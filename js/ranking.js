// ══════════════════════════════════════════
// ranking.js — Score compuesto, replay de ranking, tabla
// Compartido entre facilitator.js y leaderboard.js
// ══════════════════════════════════════════

import { STAGES, fmt, computeEfficiencyScore, efficiencyStars,
         computeDecisionQualityBonus, findTool, computeStage5State,
         computeToolsCost } from './game-data.js?v=39';

// ── Presupuesto/reputación "de cierre" ───────
// Una vez que un grupo completó la última etapa, su presupuesto y reputación
// dejan de ser los valores crudos acumulados decisión a decisión: se les
// aplica el mismo ajuste de cierre (cap de reputación institucional +
// penalizaciones extra) que ven la pantalla final del equipo (group.js
// showFinal) y los resultados del facilitador (results.html). Sin esto el
// leaderboard mostraba reputación/presupuesto sin ese ajuste mientras las
// demás pantallas sí lo aplicaban, y los rankings terminaban divergiendo.
//
// El ajuste se activa por SESIÓN (g._sessionFinished, que cada pantalla
// marca según session.status === 'finished'), no por equipo individual. Si
// se activara apenas cada equipo confirma su etapa 5, el techo de
// reputación (MAX_FINAL_REPUTATION) se les aplicaría en momentos distintos
// según quién termina primero, haciendo que el orden del leaderboard en
// vivo cambie solo por eso — no porque un equipo haya jugado mejor. Al
// activarse para todos a la vez recién al cerrar la sesión, ese salto sigue
// existiendo pero les pasa a todos en el mismo instante.
function isFinalized(g) {
  return g.final_state === 'game_over' || g._sessionFinished === true;
}

function resolveGroupStats(g) {
  const flags = g.flags || {};
  let budgetFinal = g.budget || 0;
  let penFinal    = g.penalties || 0;
  (flags.pendingPenalties || []).forEach(p => { budgetFinal -= p.amount; penFinal += p.amount; });

  if (!isFinalized(g)) return { budgetFinal, reputation: g.reputation ?? 100 };
  if (g.final_state === 'game_over') return { budgetFinal, reputation: 0 };

  const state = computeStage5State(flags, budgetFinal, penFinal, g.hours, g.reputation ?? 100, computeToolsCost(g));
  budgetFinal -= (state.extraPenalties || 0);
  return { budgetFinal, reputation: state.finalReputation };
}

// ── Score compuesto ──────────────────────────
// Presupuesto/20k + Reputación×20 + Bonos de Equipo×10 + Calidad de decisión (directa).
// El peso del presupuesto se redujo a propósito: conservar dinero por sí solo
// NUNCA debe compensar una mala decisión. Lo que mueve el marcador con fuerza
// es acertar/errar cada decisión (Calidad) y decidir bien informado y rápido
// (Bonos de Equipo) — no cuánto se ahorró en herramientas.
// El marcador muestra 0 hasta que el equipo confirma su primera decisión;
// a partir de ahí parte de una base de referencia de 3,250 menos lo consumido.
export function compositeScore(g) {
  if (!g) return 0;
  // Sin decisiones confirmadas → marcador en 0
  if (!(g.decision_log || []).length) return 0;
  const { budgetFinal, reputation: rep } = resolveGroupStats(g);
  const effScore     = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
  const qualityBonus = computeDecisionQualityBonus(g.decision_log || []);
  return Math.max(0, Math.round(
    budgetFinal / 20000 + rep * 20 + effScore * 10 + qualityBonus
  ));
}

// ── Estadísticas de desempate: tiempo total, presupuesto final, reputación ──
function tieBreakStats(g) {
  const totalTime = Object.values(g.stage_durations || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const { budgetFinal, reputation } = resolveGroupStats(g);
  return { totalTime, budgetFinal, reputation };
}

// ── Comparador de ranking: score desc → tiempo total asc → presupuesto final
// desc → reputación desc.
// compositeScore usa valores discretos y gruesos (qualityBonus en múltiplos de
// 200-800, effScore en tramos de velocidad), así que dos equipos que juegan
// igual de bien pueden terminar con el MISMO puntaje — sobre todo entre los
// primeros puestos, donde converger en "la decisión correcta" es lo normal.
// Sin desempate, un empate real se resolvía en silencio por el orden en que
// llegaban los grupos (ej. Equipo 1 le "ganaba" a Equipo 2 sin motivo). Se usa
// la misma información que ya ve cada equipo en pantalla: quién fue más
// rápido, a quién le quedó más presupuesto y quién conservó más reputación.
export function compareGroups(a, b) {
  const scoreA = compositeScore(a), scoreB = compositeScore(b);
  if (scoreB !== scoreA) return scoreB - scoreA;
  const sa = tieBreakStats(a), sb = tieBreakStats(b);
  if (sa.totalTime !== sb.totalTime) return sa.totalTime - sb.totalTime;
  if (sb.budgetFinal !== sa.budgetFinal) return sb.budgetFinal - sa.budgetFinal;
  return sb.reputation - sa.reputation;
}

// ── Estado visual: 'good' | 'warn' | 'bad' | 'dead' ──
export function groupStatusTier(g) {
  if (g?.final_state === 'game_over') return 'dead';
  const { budgetFinal, reputation: rep } = resolveGroupStats(g || {});
  const budgetPct = budgetFinal / 5000000;
  if (budgetPct > 0.60 && rep >= 70) return 'good';
  if (budgetPct < 0.30 || rep < 40)  return 'bad';
  return 'warn';
}

// ── Replay del decision_log al final del stage targetNum (1-indexed) ──
// Reconstruye: budget, reputación (penalizaciones inmediatas incluidas),
// stage_durations, tools_owned y decision_log filtrados al stage targetNum
// para que el delta entre stages refleje exactamente lo que cambió en ese stage.
function replayGroupAtStage(g, targetNum) {
  const log = (g.decision_log || []).filter(e => e.stage <= targetNum);

  // Herramientas compradas hasta targetNum (entry.stage es 0-indexed → stage 1-indexed = entry.stage+1)
  const toolsAtStage = (g.tools_owned || []).filter(t =>
    typeof t === 'object' && t && (t.stage + 1) <= targetNum
  );

  // Budget y reputación: recorrer el log buscando la opción original en STAGES
  // para aplicar repCost y penalizaciones inmediatas (isPendingPenalty: false),
  // igual que applyDecision — si no, el snapshot histórico queda con la
  // reputación y el presupuesto ACTUALES del grupo en vez de los de ese momento.
  let budget     = 5000000;
  let reputation = 100;
  for (const e of log) {
    budget -= (e.cost || 0);
    const opt = STAGES[e.stage - 1]?.options?.find(o => o.letter === e.letter);
    if (opt) {
      reputation = Math.max(0, Math.min(100, reputation - (opt.repCost ?? 0)));
      if (opt.penalty && !opt.isPendingPenalty) budget -= opt.penalty;
    }
  }
  for (const t of toolsAtStage) {
    const tool = findTool(t.id);
    if (tool) budget -= tool.cost;
  }

  // Duraciones solo de stages cerrados hasta targetNum
  const stageDurations = Object.fromEntries(
    Object.entries(g.stage_durations || {}).filter(([k]) => parseInt(k) <= targetNum)
  );

  return {
    ...g,
    budget,
    reputation,
    decision_log:   log,
    tools_owned:    toolsAtStage,
    stage_durations: stageDurations,
    flags: { ...(g.flags || {}), pendingPenalties: [] }
  };
}

// ── Ranking ordenado por compositeScore al final del stage targetNum ──
export function rankingAtStage(groups, targetNum) {
  const snapshots = groups.map(g => ({
    id: g.id,
    snapshot: targetNum >= (g.stage + 1) ? g : replayGroupAtStage(g, targetNum)
  }));
  snapshots.sort((x, y) => compareGroups(x.snapshot, y.snapshot));
  return snapshots.map((r, i) => ({ id: r.id, score: compositeScore(r.snapshot), position: i + 1 }));
}

// ── Tendencia para un grupo ──
export function trendForGroup(groupId, groups, currentStageNum) {
  if (currentStageNum <= 1) return null;
  const curr = rankingAtStage(groups, currentStageNum);
  const prev = rankingAtStage(groups, currentStageNum - 1);
  const cPos = curr.find(r => r.id === groupId)?.position;
  const pPos = prev.find(r => r.id === groupId)?.position;
  if (!cPos || !pPos) return null;
  const diff = pPos - cPos;
  if (diff > 0) return { dir: 'up',   delta: diff };
  if (diff < 0) return { dir: 'down', delta: -diff };
  return { dir: 'flat', delta: 0 };
}

// ── Puntos de decisión por etapa (● correcta/ok, ✕ trampa, ○ pendiente) ──
// No revela QUÉ opción eligió el equipo, solo si acertó o cayó en trampa —
// da contexto inmediato de por qué la "calidad" pesa lo que pesa sin exponer
// el detalle que ve el facilitador.
function decisionDots(g, totalStages) {
  const log = g.decision_log || [];
  let html = '';
  for (let s = 1; s <= totalStages; s++) {
    const entry = log.find(e => e.stage === s);
    if (!entry) {
      html += `<span class="lb-dot-mini lb-dot-mini-pending" title="Etapa ${s}: pendiente">○</span>`;
      continue;
    }
    const isTrap = entry.type === 'trap';
    html += `<span class="lb-dot-mini ${isTrap ? 'lb-dot-mini-trap' : 'lb-dot-mini-ok'}" title="Etapa ${s}: ${entry.typeLabel || entry.type}">${isTrap ? '✕' : '●'}</span>`;
  }
  return html;
}

// ── HTML de la tabla. mode = 'detailed' | 'public' ──
export function buildLeaderboardTable(groups, mode = 'detailed', currentStageNum = 1) {
  if (!groups?.length) return '';

  const STATUS_DOT = {
    good: '<span class="lb-dot lb-dot-good" title="Sólido">●</span>',
    warn: '<span class="lb-dot lb-dot-warn" title="En tensión">●</span>',
    bad:  '<span class="lb-dot lb-dot-bad"  title="Crítico">●</span>',
    dead: '<span class="lb-dot lb-dot-dead" title="Eliminado">✕</span>'
  };

  // Snapshot en vivo: incluye decisiones confirmadas del stage actual
  const ranked = rankingAtStage(groups, currentStageNum);

  // Escala compartida para la mini-barra pública: el total de puntos
  // "positivos" del líder define el 100% del ancho. Así el largo de la
  // barra de cada equipo es comparable entre filas (antes cada barra se
  // normalizaba a sí misma y siempre llenaba el mismo ancho, aunque el
  // equipo tuviera 10x menos puntos que el líder).
  let scaleMax = 1;
  if (mode === 'public') {
    for (const g of groups) {
      const { budgetFinal: bf, reputation: rp } = resolveGroupStats(g);
      const eff = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
      const q   = computeDecisionQualityBonus(g.decision_log || []);
      const posTotal = Math.max(0, bf / 20000) + rp * 20 + eff * 10 + Math.max(0, q);
      if (posTotal > scaleMax) scaleMax = posTotal;
    }
  }

  // Delta de puntos vs el stage anterior.
  // En el stage 1 el baseline es la referencia de 3,250 (budget/rep/eficiencia
  // en su valor inicial, antes de aplicar la calidad de la primera decisión).
  const BASE_SCORE = 3250;
  const prevScoreMap = currentStageNum === 1
    ? Object.fromEntries(groups.map(g => [g.id, BASE_SCORE]))
    : Object.fromEntries(rankingAtStage(groups, currentStageNum - 1).map(r => [r.id, r.score]));

  const rows = ranked.map(r => {
    const g          = groups.find(x => x.id === r.id);
    const tier       = groupStatusTier(g);
    const trend      = trendForGroup(g.id, groups, currentStageNum);
    const decisions  = (g.decision_log || []).length;
    const totalStages = STAGES.length;

    // Delta: solo desde stage 2 en adelante, y solo si ya confirmaron en el stage actual
    const hasDecidedNow = (g.decision_log || []).some(e => e.stage === currentStageNum);
    const scoreDelta = (hasDecidedNow && currentStageNum > 1)
      ? r.score - (prevScoreMap[r.id] ?? BASE_SCORE)
      : null;
    const deltaHtml = scoreDelta === null ? ''
      : scoreDelta > 0 ? `<span class="lb-pts-delta lb-delta-up">+${scoreDelta}</span>`
      : scoreDelta < 0 ? `<span class="lb-pts-delta lb-delta-down">${scoreDelta}</span>`
      : `<span class="lb-pts-delta lb-delta-flat">±0</span>`;

    // Motivo del delta: la decisión que el equipo acaba de confirmar en este stage
    const lastDecision = (g.decision_log || []).find(e => e.stage === currentStageNum) || null;
    const deltaReasonHtml = (scoreDelta !== null && lastDecision)
      ? `<span class="lb-pts-delta-reason">${lastDecision.typeLabel || lastDecision.type}</span>`
      : '';

    const trendHtml = trend
      ? (trend.dir === 'up'
          ? `<span class="lb-trend lb-trend-up">▲${trend.delta}</span>`
          : trend.dir === 'down'
            ? `<span class="lb-trend lb-trend-down">▼${trend.delta}</span>`
            : `<span class="lb-trend lb-trend-flat">=</span>`)
      : `<span class="lb-trend lb-trend-flat">·</span>`;

    if (mode === 'public') {
      const { budgetFinal: budgetFin, reputation: rep } = resolveGroupStats(g);
      const effScore  = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
      const quality   = computeDecisionQualityBonus(g.decision_log || []);

      // Componentes proporcionales para la mini-bar (misma escala que compositeScore)
      const budgetPts  = Math.max(0, budgetFin / 20000);
      const repPts     = rep * 20;
      const effPts     = effScore * 10;
      const qualityPtsPos = Math.max(0, quality); // solo la parte positiva entra a la barra
      const posTotal   = budgetPts + repPts + effPts + qualityPtsPos;

      // Ancho absoluto de la barra: proporción respecto al mejor equipo (scaleMax),
      // no respecto a sí misma — así dos equipos SÍ son comparables a simple vista.
      const barWidthPct = Math.max(2, Math.min(100, (posTotal / scaleMax) * 100));

      const qualityNeg = quality < 0
        ? `<span class="lb-quality-penalty" title="Puntos perdidos por decisiones trampa">▼ ${Math.round(quality)}</span>`
        : '';

      return `
        <tr class="lb-row lb-row-${tier}" data-gid="${g.id}">
          <td class="lb-rank">${r.position}</td>
          <td class="lb-team">
            ${g.name || `Equipo ${g.slot}`}
            <div class="lb-decision-dots">${decisionDots(g, totalStages)}</div>
          </td>
          <td class="lb-pts">
            <div class="lb-pts-row">
              <span class="lb-pts-value">${r.score}</span>
              ${deltaHtml}
              ${deltaReasonHtml}
            </div>
            <div class="lb-pts-breakdown-wrap">
              <div class="lb-pts-breakdown" style="width:${barWidthPct}%">
                <div class="lb-pts-bar lb-pts-bar-budget"  style="flex:${budgetPts}"  title="Presupuesto: ${Math.round(budgetPts)} pts"></div>
                <div class="lb-pts-bar lb-pts-bar-rep"     style="flex:${repPts}"     title="Reputación: ${Math.round(repPts)} pts"></div>
                <div class="lb-pts-bar lb-pts-bar-eff"     style="flex:${effPts}"     title="Bonos de Equipo: ${Math.round(effPts)} pts"></div>
                ${qualityPtsPos > 0 ? `<div class="lb-pts-bar lb-pts-bar-quality" style="flex:${qualityPtsPos}" title="Calidad de decisiones: +${Math.round(qualityPtsPos)} pts"></div>` : ''}
              </div>
              ${qualityNeg}
            </div>
            <div class="lb-pts-breakdown-nums">
              <span class="lb-bd-item lb-bd-budget">${Math.round(budgetPts)}</span>
              <span class="lb-bd-item lb-bd-rep">${Math.round(repPts)}</span>
              <span class="lb-bd-item lb-bd-eff">${Math.round(effPts)}</span>
              <span class="lb-bd-item ${quality > 0 ? 'lb-bd-pos' : quality < 0 ? 'lb-bd-neg' : 'lb-bd-zero'}">${quality > 0 ? '+' : ''}${Math.round(quality)}</span>
            </div>
          </td>
          <td class="lb-trend-cell">${trendHtml}</td>
        </tr>`;
    }

    const { budgetFinal: budgetFin, reputation: rep } = resolveGroupStats(g);
    const effScore   = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
    const quality    = computeDecisionQualityBonus(g.decision_log || []);
    const stars      = efficiencyStars(effScore);
    const starsHtml  = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const budgetColor = budgetFin > 3000000 ? 'var(--success)'
                      : budgetFin > 1500000 ? 'var(--gold)' : 'var(--accent)';
    const repColor   = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--gold)' : 'var(--accent)';
    const qualityColor = quality > 0 ? 'var(--success)' : quality < 0 ? 'var(--accent)' : 'var(--muted)';

    return `
      <tr class="lb-row lb-row-${tier}">
        <td class="lb-rank">${r.position}</td>
        <td class="lb-team">${g.name || `Equipo ${g.slot}`}</td>
        <td class="lb-status">${STATUS_DOT[tier]}</td>
        <td class="lb-decisions">${decisions}<span class="lb-of">/${totalStages}</span></td>
        <td class="lb-budget" style="color:${budgetColor}">${fmt(budgetFin)}</td>
        <td class="lb-rep" style="color:${repColor}">${rep}%</td>
        <td class="lb-eff" title="${effScore} pts"><span class="lb-stars">${starsHtml}</span></td>
        <td class="lb-quality" style="color:${qualityColor}">${quality > 0 ? '+' : ''}${quality}</td>
        <td class="lb-pts">${r.score}</td>
        <td class="lb-trend-cell">${trendHtml}</td>
      </tr>`;
  }).join('');

  const headersPublic = `
    <tr>
      <th class="lb-rank-h">#</th>
      <th class="lb-team-h">EQUIPO</th>
      <th class="lb-pts-h">PUNTOS</th>
      <th class="lb-trend-h">TENDENCIA</th>
    </tr>`;
  const headersDetailed = `
    <tr>
      <th class="lb-rank-h">#</th>
      <th class="lb-team-h">EQUIPO</th>
      <th class="lb-status-h">ESTADO</th>
      <th>DECISIONES</th>
      <th>PRESUPUESTO</th>
      <th>REPUTACIÓN</th>
      <th>BONOS DE EQUIPO</th>
      <th>CALIDAD</th>
      <th class="lb-pts-h">PUNTOS</th>
      <th class="lb-trend-h">TENDENCIA</th>
    </tr>`;

  return `
    <div class="lb-wrap lb-${mode}">
      <table class="lb-table lb-${mode}">
        <thead>${mode === 'public' ? headersPublic : headersDetailed}</thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
