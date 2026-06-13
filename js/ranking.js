// ══════════════════════════════════════════
// ranking.js — Score compuesto, replay de ranking, tabla
// Compartido entre facilitator.js y leaderboard.js
// ══════════════════════════════════════════

import { STAGES, fmt, computeEfficiencyScore, efficiencyStars,
         computeAnticipationBonus, computeTimeScore } from './game-data.js?v=18';

// ── Score compuesto ──────────────────────────
// Presupuesto/10k + Reputación×10 + Eficiencia×10.
// Estado inicial: 500 + 1000 + 1000 = 2,500 puntos exactos.
// Rango aprox: 0–2,650. Cada decisión mueve cientos de puntos.
export function compositeScore(g) {
  if (!g) return 0;
  const flags = g.flags || {};
  const budgetFinal = (g.budget || 0)
    - (flags.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
  const rep         = g.reputation ?? 100;
  const effScore    = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
  return Math.max(0, Math.round(budgetFinal / 10000 + rep * 10 + effScore * 10));
}

// ── Perfil del equipo (etiqueta gamificada según drivers dominantes) ──
export function profileOf(g) {
  if (g?.final_state === 'game_over')
    return { icon: '☠', label: 'ELIMINADO', cls: 'lb-profile-dead' };

  const flags     = g?.flags || {};
  const budgetFin = (g?.budget || 0)
    - (flags.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
  const budgetPct = budgetFin / 5000000;
  const rep       = g?.reputation ?? 100;
  const anticipation = computeAnticipationBonus(g?.tools_owned || []);
  const timeScore    = computeTimeScore(g?.stage_durations || {});

  if (rep < 40 || budgetPct < 0.30)
    return { icon: '🔥', label: 'EN CRISIS',  cls: 'lb-profile-crisis' };
  if (timeScore < -5)
    return { icon: '🐌', label: 'DEMORADO',   cls: 'lb-profile-slow' };
  if (anticipation > 5 && timeScore > 5)
    return { icon: '🎯⚡', label: 'COMPLETO', cls: 'lb-profile-complete' };
  if (anticipation > 5)
    return { icon: '🎯', label: 'ESTRATEGA',  cls: 'lb-profile-strategist' };
  if (timeScore > 5)
    return { icon: '⚡', label: 'ÁGIL',       cls: 'lb-profile-agile' };
  return { icon: '⚖', label: 'EQUILIBRADO', cls: 'lb-profile-balanced' };
}

// ── Estado visual: 'good' | 'warn' | 'bad' | 'dead' ──
export function groupStatusTier(g) {
  if (g?.final_state === 'game_over') return 'dead';
  const flags = g?.flags || {};
  const budgetFinal = (g?.budget || 0)
    - (flags.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
  const budgetPct = budgetFinal / 5000000;
  const rep       = g?.reputation ?? 100;
  if (budgetPct > 0.60 && rep >= 70) return 'good';
  if (budgetPct < 0.30 || rep < 40)  return 'bad';
  return 'warn';
}

// ── Replay del decision_log al final del stage targetNum (1-indexed) ──
function replayGroupAtStage(g, targetNum) {
  const log = (g.decision_log || []).filter(e => e.stage <= targetNum);
  let budget = 5000000;
  for (const e of log) budget -= (e.cost || 0);
  return {
    ...g,
    budget,
    flags: { ...(g.flags || {}), pendingPenalties: [] }
  };
}

// ── Ranking ordenado por compositeScore al final del stage targetNum ──
export function rankingAtStage(groups, targetNum) {
  const scored = groups.map(g => {
    const snapshot = targetNum >= (g.stage + 1) ? g : replayGroupAtStage(g, targetNum);
    return { id: g.id, score: compositeScore(snapshot) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((r, i) => ({ ...r, position: i + 1 }));
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

// ── HTML de la tabla. mode = 'detailed' | 'public' ──
export function buildLeaderboardTable(groups, mode = 'detailed', currentStageNum = 1) {
  if (!groups?.length) return '';

  const STATUS_DOT = {
    good: '<span class="lb-dot lb-dot-good" title="Sólido">●</span>',
    warn: '<span class="lb-dot lb-dot-warn" title="En tensión">●</span>',
    bad:  '<span class="lb-dot lb-dot-bad"  title="Crítico">●</span>',
    dead: '<span class="lb-dot lb-dot-dead" title="Eliminado">✕</span>'
  };

  // Snapshot a final del último stage cerrado
  const lastClosedStage = Math.max(0, currentStageNum - 1);
  const ranked = rankingAtStage(groups, lastClosedStage);

  const rows = ranked.map(r => {
    const g          = groups.find(x => x.id === r.id);
    const tier       = groupStatusTier(g);
    const trend      = trendForGroup(g.id, groups, lastClosedStage);
    const decisions  = (g.decision_log || []).length;
    const totalStages = STAGES.length;

    const trendHtml = trend
      ? (trend.dir === 'up'
          ? `<span class="lb-trend lb-trend-up">▲${trend.delta}</span>`
          : trend.dir === 'down'
            ? `<span class="lb-trend lb-trend-down">▼${trend.delta}</span>`
            : `<span class="lb-trend lb-trend-flat">=</span>`)
      : `<span class="lb-trend lb-trend-flat">·</span>`;

    if (mode === 'public') {
      const flags     = g.flags || {};
      const budgetFin = (g.budget || 0)
        - (flags.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
      const rep       = g.reputation ?? 100;
      const effScore  = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
      const profile   = profileOf(g);

      // Componentes proporcionales para la mini-bar (misma escala que compositeScore)
      const budgetPts = Math.max(0, budgetFin / 10000);
      const repPts    = rep * 10;
      const effPts    = effScore * 10;

      return `
        <tr class="lb-row lb-row-${tier}" data-gid="${g.id}">
          <td class="lb-rank">${r.position}</td>
          <td class="lb-team">${g.name || `Equipo ${g.slot}`}</td>
          <td class="lb-profile-cell">
            <span class="lb-profile ${profile.cls}">
              <span class="lb-profile-icon">${profile.icon}</span>
              <span class="lb-profile-label">${profile.label}</span>
            </span>
          </td>
          <td class="lb-pts">
            <div class="lb-pts-value">${r.score}</div>
            <div class="lb-pts-breakdown" title="Presupuesto · Reputación · Eficiencia">
              <div class="lb-pts-bar lb-pts-bar-budget" style="flex:${budgetPts}"></div>
              <div class="lb-pts-bar lb-pts-bar-rep"    style="flex:${repPts}"></div>
              <div class="lb-pts-bar lb-pts-bar-eff"    style="flex:${effPts}"></div>
            </div>
          </td>
          <td class="lb-trend-cell">${trendHtml}</td>
        </tr>`;
    }

    const flags      = g.flags || {};
    const budgetFin  = (g.budget || 0)
      - (flags.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
    const rep        = g.reputation ?? 100;
    const effScore   = computeEfficiencyScore(g.stage_durations || {}, g.tools_owned || [], g.decision_log || []);
    const stars      = efficiencyStars(effScore);
    const starsHtml  = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const budgetColor = budgetFin > 3000000 ? 'var(--success)'
                      : budgetFin > 1500000 ? 'var(--gold)' : 'var(--accent)';
    const repColor   = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--gold)' : 'var(--accent)';

    return `
      <tr class="lb-row lb-row-${tier}">
        <td class="lb-rank">${r.position}</td>
        <td class="lb-team">${g.name || `Equipo ${g.slot}`}</td>
        <td class="lb-status">${STATUS_DOT[tier]}</td>
        <td class="lb-decisions">${decisions}<span class="lb-of">/${totalStages}</span></td>
        <td class="lb-budget" style="color:${budgetColor}">${fmt(budgetFin)}</td>
        <td class="lb-rep" style="color:${repColor}">${rep}%</td>
        <td class="lb-eff" title="${effScore} pts"><span class="lb-stars">${starsHtml}</span></td>
        <td class="lb-pts">${r.score}</td>
        <td class="lb-trend-cell">${trendHtml}</td>
      </tr>`;
  }).join('');

  const headersPublic = `
    <tr>
      <th class="lb-rank-h">#</th>
      <th class="lb-team-h">EQUIPO</th>
      <th>PERFIL</th>
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
      <th>EFICIENCIA</th>
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
