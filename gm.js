// ══════════════════════════════════════════
// GM PANEL — Crisis Cibernética Bancaria (single-player)
// Reescrito como módulo sobre game-data.js: MISMA fuente de verdad que el
// modo multijugador. Datos, ramificación, herramientas, reputación,
// eficiencia y estado final vienen todos de js/game-data.js — ya no hay
// una copia inline que pueda desincronizarse. La UX single-player se
// mantiene: un solo equipo, sin backend, y el GM ve las consecuencias
// (gm-info) antes de revelarlas.
// ══════════════════════════════════════════

import {
  STAGES, BUDGET_INIT, HOURS_LIMIT, fmt, glossarize,
  applyDecision, computeStage5State, MAX_FINAL_REPUTATION,
  TOOLS_CATALOG, findTool, computeToolsCost,
  efficiencyBreakdown, efficiencyStars,
  computeDecisionQualityBonus, decisionQualityPoints, stageTimeTier
} from './js/game-data.js?v=40';

let G = {};

// ── Catálogo visual del toolkit (mismos slugs/íconos que group.js) ──
const TOOL_CAT_SLUG = {
  'Detección':'deteccion', 'Forense':'forense', 'Inteligencia':'inteligencia',
  'Recuperación':'recuperacion', 'Servicios':'servicios'
};
const TOOL_CAT_ICON = {
  deteccion:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/></svg>',
  forense:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M7 10h6M10 7v6"/></svg>',
  inteligencia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12l10-5M7 12l10 5"/></svg>',
  recuperacion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  servicios:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6 21V10l6-5 6 5v11M10 21v-6h4v6"/></svg>'
};
const CAT_LABEL = { deteccion:'DETECCIÓN', forense:'FORENSE', inteligencia:'INTELIGENCIA', recuperacion:'RECUPERACIÓN', servicios:'SERVICIOS' };

// ── Helpers de inventario ─────────────────────
function ownedIdsOf() {
  return (G.tools_owned || []).map(t => typeof t === 'string' ? t : t?.id).filter(Boolean);
}

// ══════════════════════════════════════════
// INICIAR
// ══════════════════════════════════════════
function startGame() {
  G = {
    stage: 0,
    ctx: 'default',
    budget: BUDGET_INIT,
    costs: 0,
    penalties: 0,
    hours: 0,
    reputation: 100,
    chosen: null,
    revealed: false,
    decision_log: [],
    notif_log: [],
    tools_owned: [],
    stage_durations: {},
    stage_start: Date.now(),
    notifs: [],
    unread: 0,
    currentTab: 'info',
    flags: {
      backupsDestroyed: false, openedMonday: false, paidRansom: false,
      laborLawsuit: false, silentCorp: false, licenseRevoked: false,
      conditionalPenalty: false, pendingPenalties: []
    },
    team: {
      name:  document.getElementById('iTeam').value.trim()  || 'Equipo',
      ciso:  document.getElementById('iCISO').value.trim(),
      legal: document.getElementById('iLegal').value.trim(),
      comms: document.getElementById('iComms').value.trim(),
      ops:   document.getElementById('iOps').value.trim(),
      gm:    document.getElementById('iGM').value.trim()
    }
  };

  showScreen('screenGame');
  document.getElementById('teamLabel').textContent = G.team.name;
  renderRoundIndicator();
  renderStage();
  updateSidebar();
  addNotif('info', '🔐 Simulacro iniciado', `Equipo: ${G.team.name} · Budget: $5,000,000 · Tiempo: 72 horas`);
}

// ══════════════════════════════════════════
// RENDER STAGE
// ══════════════════════════════════════════
function renderStage() {
  const s = STAGES[G.stage];
  const main = document.getElementById('gameMain');
  document.getElementById('stageLabel').textContent = s.label;

  let html = '';

  if (s.isStage5) {
    // Estado final se evalúa automáticamente con la MISMA función que el
    // multijugador (incluye horas, reputación, penalizaciones diferidas).
    const st = computeStage5State(G.flags, G.budget, G.penalties, G.hours, G.reputation, computeToolsCost(G));
    G.ctx = st.ctx;
    const v = s.variants[G.ctx];
    html += `
    <div class="incident-card">
      <div class="ic-status-bar"><div class="ic-dot"></div>${s.status}</div>
      <div class="ic-body">
        <div class="ic-eyebrow">${s.label} · ${s.timestamp}</div>
        <h2 class="ic-title">${s.title}</h2>
        <p class="ic-narrative">${glossarize(v.narrative)}</p>
        ${v.update ? `<div class="ic-update"><div class="ic-update-label">// ALERTA GM</div>${glossarize(v.update)}</div>` : ''}
        <div class="branch-ctx ctx-${G.ctx.toLowerCase()}"><div class="branch-ctx-label">// ESTADO EVALUADO AUTOMÁTICAMENTE</div>${v.branchCtx}</div>
        <div style="margin-top:.75rem;padding:.65rem;background:var(--gold-light);border:1px solid #e0c880;border-radius:6px;font-size:.78rem;color:var(--gold);">
          <div style="font-family:'DM Mono',monospace;font-size:.54rem;letter-spacing:.1em;margin-bottom:.2rem;">// GM: ESTADO CALCULADO</div>
          <strong>Estado: ${st.label}</strong> — ${glossarize(st.reason)}
        </div>
      </div>
    </div>`;
  } else {
    const variant = s.variants[G.ctx] || s.variants['default'] || s.variants['A'];
    html += `
    <div class="incident-card">
      <div class="ic-status-bar"><div class="ic-dot"></div>${s.status}</div>
      <div class="ic-body">
        <div class="ic-eyebrow">${s.label} · ${s.timestamp}</div>
        <h2 class="ic-title">${s.title}</h2>
        <p class="ic-narrative">${glossarize(variant.narrative)}</p>
        ${variant.update ? `<div class="ic-update"><div class="ic-update-label">// ACTUALIZACIÓN</div>${glossarize(variant.update)}</div>` : ''}
        ${variant.branchCtx ? `<div class="branch-ctx ${G.ctx === 'A' ? 'ctx-a' : 'ctx-b'}"><div class="branch-ctx-label">// BIFURCACIÓN ACTIVA</div>${variant.branchCtx}</div>` : ''}
      </div>
    </div>`;
  }

  // Toolkit (mismo catálogo y lógica de reveals que el multijugador)
  html += `<div id="toolkitMount">${renderToolkit()}</div>`;

  // Decisión
  html += `
  <div class="decision-card">
    <div class="dc-header">
      <div class="dc-question">${s.question}</div>
      <div class="impact-badge impact-${s.impact === 'CRÍTICO' ? 'high' : 'med'}">${s.impact}</div>
    </div>
    <div class="dc-body">
      <div class="decision-opts" id="decOpts">`;

  s.options.forEach((opt, i) => {
    const effectiveCost = (G.ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;
    const costStr   = effectiveCost === 0 ? '$0' : fmt(effectiveCost);
    const costClass = effectiveCost === 0 ? 'zero' : '';
    html += `
        <div class="dec-opt" id="opt-${i}" onclick="selectOption(${i})">
          <div class="do-key">${opt.letter}</div>
          <div class="do-content">
            <div class="do-text">${opt.text}</div>
            <div class="do-sub">${glossarize(opt.sub)}</div>
            <div class="opt-meta">
              <span class="opt-cost ${costClass}">${costStr}</span>
              ${opt.hours > 0 ? `<span class="opt-hours">+${opt.hours}h</span>` : '<span class="opt-hours" style="color:var(--success)">Sin tiempo</span>'}
            </div>
            <div class="gm-type-badge gm-${opt.type}">${opt.typeLabel}</div>
            <button class="gm-info-toggle" onclick="event.stopPropagation();toggleGMInfo(${i})">▼ Ver consecuencia [GM]</button>
            <div class="gm-info" id="gmi-${i}">
              <div class="gm-consequence">${glossarize(opt.consequence)}</div>
              <div class="gm-branch-note">📍 ${opt.branchNote}</div>
            </div>
          </div>
        </div>`;
  });

  html += `
      </div>
    </div>
    <div class="confirm-bar" id="confirmBar">
      <div class="confirm-hint" id="confirmHint">Selecciona la opción elegida por el equipo</div>
      <button class="btn btn-dark" id="confirmBtn" onclick="confirmDecision()" style="display:none">APLICAR DECISIÓN →</button>
    </div>
  </div>`;

  main.innerHTML = html;
  renderRoundIndicator();
}

// ── Toolkit ───────────────────────────────────
function renderToolkit() {
  if (!TOOLS_CATALOG || !TOOLS_CATALOG.length) return '';
  const owned = ownedIdsOf();
  const stageIdx = G.stage;
  const visible = TOOLS_CATALOG.filter(t => t.revealedAt <= stageIdx + 1);

  const cards = visible.map(t => {
    const slug      = TOOL_CAT_SLUG[t.category] || 'deteccion';
    const icon      = TOOL_CAT_ICON[slug] || '';
    const isOwned   = owned.includes(t.id);
    const canAfford = G.budget >= t.cost;
    const isLocked  = !isOwned && !canAfford;
    const cls = ['toolkit-card', `cat-${slug}`, isOwned ? 'tool-purchased' : '', isLocked ? 'tool-locked' : ''].filter(Boolean).join(' ');
    return `
      <div class="${cls}">
        <div class="tk-cat-row"><span class="tk-icon">${icon}</span><span class="tk-cat">${t.category}</span></div>
        <div class="tk-name">${t.name}</div>
        ${t.description ? `<div class="tk-desc">${glossarize(t.description)}</div>` : ''}
        <div class="tk-cost">${fmt(t.cost)}</div>
        <button class="tk-buy" data-tool="${t.id}"
          ${(isOwned || isLocked) ? 'disabled' : ''}
          ${(!isOwned && canAfford) ? `onclick="purchaseTool('${t.id}')"` : ''}>
          ${isOwned ? '✓ ADQUIRIDA' : canAfford ? 'COMPRAR' : 'SIN PRESUPUESTO'}
        </button>
      </div>`;
  }).join('');

  const legend = ['deteccion','forense','inteligencia','recuperacion','servicios']
    .filter(slug => visible.some(t => (TOOL_CAT_SLUG[t.category] || 'deteccion') === slug))
    .map(slug => `<span class="lg-item cat-${slug}"><span class="lg-dot"></span>${CAT_LABEL[slug]}</span>`)
    .join('');

  return `
  <section class="toolkit-panel">
    <div class="tk-header">
      <div class="tk-title-row">
        <div class="tk-title">// TOOLKIT SOC</div>
        <div class="tk-budget">PRESUPUESTO <span>${fmt(G.budget)}</span></div>
      </div>
      <div class="tk-sub">Compra herramientas para revelar inteligencia. Algunas son útiles ahora, otras lo serán más adelante — invertir temprano da bono de anticipación.</div>
      <div class="tk-legend">${legend}</div>
    </div>
    <div class="tk-grid">${cards}</div>
  </section>`;
}

function refreshToolkit() {
  const mount = document.getElementById('toolkitMount');
  if (mount) mount.innerHTML = renderToolkit();
}

function purchaseTool(toolId) {
  if (G.revealed) return;
  const tool = findTool(toolId);
  if (!tool) return;
  if (tool.revealedAt > G.stage + 1) return;
  if (ownedIdsOf().includes(toolId)) return;
  if (G.budget < tool.cost) return;

  G.budget -= tool.cost;
  G.costs  += tool.cost;
  G.tools_owned.push({ id: toolId, stage: G.stage });

  flashBudget(tool.cost);
  if (tool.reveals) {
    addNotif(tool.reveals.type || 'info', tool.reveals.title, glossarize(tool.reveals.body));
  } else {
    addNotif('info', `🛠 ${tool.name}`, `Herramienta adquirida por ${fmt(tool.cost)}.`);
  }
  refreshToolkit();
  updateSidebar();
}

function toggleGMInfo(i) {
  document.getElementById(`gmi-${i}`)?.classList.toggle('open');
}

function selectOption(i) {
  if (G.revealed) return;
  G.chosen = i;
  document.querySelectorAll('.dec-opt').forEach((el, idx) => el.classList.toggle('selected', idx === i));
  const opt = STAGES[G.stage].options[i];
  const effectiveCost = (G.ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;
  document.getElementById('confirmHint').innerHTML =
    `Opción elegida: <strong>${opt.letter} — ${opt.text}</strong> · ${fmt(effectiveCost)}${opt.hours > 0 ? ` · +${opt.hours}h` : ''}`;
  document.getElementById('confirmBtn').style.display = 'block';
  document.getElementById(`gmi-${i}`)?.classList.add('open');
}

// ══════════════════════════════════════════
// CONFIRMAR DECISIÓN — usa applyDecision() de game-data.js
// ══════════════════════════════════════════
function confirmDecision() {
  if (G.chosen === null || G.revealed) return;

  const s = STAGES[G.stage];
  // Congelar la duración de la etapa (para el score de tiempo / eficiencia)
  G.stage_durations[s.num] = Math.max(1, Math.round((Date.now() - G.stage_start) / 1000));

  const res = applyDecision(G, G.stage, G.chosen);

  // Volcar el nuevo estado al objeto local
  G.budget       = res.budget;
  G.costs        = res.costs;
  G.penalties    = res.penalties;
  G.hours        = res.hours;
  G.reputation   = res.reputation;
  G.flags        = res.flags;
  G.decision_log = res.decision_log;

  const opt = res.opt;

  if (res.opt.penalty && !res.opt.isPendingPenalty) {
    addNotif('alert', '⚠ Penalización aplicada', `${opt.letter}: ${fmt(res.opt.penalty)} deducidos del presupuesto`);
  }
  if (res.opt.penalty && res.opt.isPendingPenalty) {
    addNotif('warn', '⏳ Penalización diferida', `${res.opt.penaltyLabel || res.opt.text}: -${fmt(res.opt.penalty)} se aplicará al final`);
  }

  // GAME OVER técnico (fatalIfCtxB en Contexto B)
  if (res.isGameOver) {
    updateSidebar();
    addNotif('alert', '💀 GAME OVER TÉCNICO', 'El ransomware cifró la copia de recuperación. No hay retorno posible.');
    showGameOver(
      'Colapso Técnico Irreversible',
      `La opción "${opt.letter} — ${opt.text}" en Contexto B activó el módulo de persistencia del ransomware. Los backups fueron cifrados. El banco no puede recuperar sus sistemas. Fin del simulacro.`
    );
    return;
  }

  showConsequenceReveal(res);

  G.revealed = true;
  const btn = document.getElementById('confirmBtn');
  btn.textContent = 'AVANZAR →';
  btn.onclick = () => advance(res);

  updateSidebar();
  flashBudget(res.effectiveCost);
  addNotif('info', `Stage ${s.num}: Opción ${opt.letter}`, `${opt.text} — ${fmt(res.effectiveCost)}${res.effectiveHours ? ` · +${res.effectiveHours}h` : ''}`);
}

function showConsequenceReveal(res) {
  const s    = STAGES[G.stage];
  const opt  = res.opt;
  const main = document.getElementById('gameMain');

  // Impacto en calidad, reputación y ritmo (igual criterio que el multijugador)
  const repChange   = -(opt.repCost ?? 0);
  const repSign     = repChange > 0 ? '+' : '';
  const repCls      = repChange > 0 ? 'cr2-green' : repChange < 0 ? 'cr2-red' : '';
  const qualityPts  = decisionQualityPoints(res.decision_log[res.decision_log.length - 1]?.type);
  const qualitySign = qualityPts > 0 ? '+' : '';
  const qualityCls  = qualityPts > 0 ? 'cr2-green' : qualityPts < 0 ? 'cr2-red' : '';
  const secs        = G.stage_durations[s.num];
  const pace        = secs !== undefined ? stageTimeTier(s.num, secs) : null;
  const paceCls     = pace ? (pace.score > 0 ? 'cr2-green' : pace.score < 0 ? 'cr2-red' : '') : '';
  const tbNote      = (res.toolBonus && res.toolBonus.matched > 0)
    ? `<div class="cr2-brow"><span>Herramientas que respaldaron la decisión</span><span class="cr2-val cr2-green">${res.toolBonus.matched}/${res.toolBonus.total} · costo −${Math.round((1 - res.toolBonus.costMult) * 100)}%</span></div>`
    : '';

  const html = `
  <div class="consequence-reveal">
    <div class="cr2-header">
      <div style="font-size:.65rem;opacity:.6">// CONSECUENCIA REVELADA — STAGE ${s.num}</div>
      <div class="cr2-title">Opción ${opt.letter}: ${opt.text}</div>
      <div class="gm-type-badge gm-${opt.type}" style="flex-shrink:0">${opt.typeLabel}</div>
    </div>
    <div class="cr2-body">
      <div>
        <div class="cr2-label">LO QUE OCURRIÓ</div>
        <div class="cr2-text">${glossarize(opt.consequence)}</div>
      </div>
      <div class="cr2-branch">
        <div class="cr2-branch-label">// BIFURCACIÓN</div>
        ${opt.branchNote}
      </div>
      <div class="cr2-budget-box">
        <div class="cr2-brow"><span>Costo de decisión</span><span class="cr2-val cr2-red">${res.effectiveCost > 0 ? '-' + fmt(res.effectiveCost) : '$0'}</span></div>
        ${tbNote}
        <div class="cr2-brow total"><span>Presupuesto actual</span><span class="cr2-val cr2-blue">${fmt(G.budget)}</span></div>
        <div class="cr2-brow"><span>Horas consumidas</span><span class="cr2-val">${G.hours}h / ${HOURS_LIMIT}h</span></div>
      </div>
      <div class="cr2-budget-box">
        <div class="cr2-label">// IMPACTO EN EL PUNTAJE — ${opt.typeLabel || ''}</div>
        <div class="cr2-brow"><span>Calidad de la decisión</span><span class="cr2-val ${qualityCls}">${qualityPts !== 0 ? `${qualitySign}${qualityPts} pts` : 'sin impacto'}</span></div>
        <div class="cr2-brow"><span>Reputación institucional</span><span class="cr2-val ${repCls}">${repChange !== 0 ? `${repSign}${repChange}%` : 'sin cambios'}</span></div>
        ${pace ? `<div class="cr2-brow"><span>Ritmo de resolución</span><span class="cr2-val ${paceCls}">${pace.label}${pace.score !== 0 ? ` (${pace.score > 0 ? '+' : ''}${pace.score})` : ''}</span></div>` : ''}
      </div>
    </div>
  </div>`;

  main.insertAdjacentHTML('beforeend', html);
  main.scrollTop = 99999;
}

// ══════════════════════════════════════════
// AVANZAR
// ══════════════════════════════════════════
function advance(res) {
  G.revealed = false;
  G.chosen   = null;

  if (res.isExtremeOutcome) {
    // "Migrar a la Nube": salto directo al Stage 5 en Contexto C
    G.stage = 4;
    G.ctx   = 'C';
  } else if (G.stage >= 4) {
    showFinal();
    return;
  } else {
    G.stage++;
    const variants = Object.keys(STAGES[G.stage].variants);
    const nextCtx  = res.nextCtx || 'A';
    G.ctx = variants.includes(nextCtx) ? nextCtx
          : variants.includes('default') ? 'default' : variants[0];
  }

  G.stage_start = Date.now();
  renderRoundIndicator();
  renderStage();
  updateSidebar();
  document.getElementById('gameMain').scrollTop = 0;
  addNotif('branch', `▶ Avanzando a Stage ${G.stage + 1}`, `Contexto: ${G.ctx}`);
}

// ══════════════════════════════════════════
// PANTALLA FINAL
// ══════════════════════════════════════════
function showFinal() {
  // Penalizaciones diferidas
  (G.flags.pendingPenalties || []).forEach(p => { G.budget -= p.amount; G.penalties += p.amount; });

  // Estado final + penalizaciones extra + reputación final (game-data.js)
  const st = computeStage5State(G.flags, G.budget, G.penalties, G.hours, G.reputation, computeToolsCost(G));
  G.budget    -= st.extraPenalties;
  G.penalties += st.extraPenalties;
  G.reputation = st.finalReputation;

  const budgetFinal = G.budget;
  const eff     = efficiencyBreakdown(G.stage_durations, G.tools_owned, G.decision_log);
  const stars   = efficiencyStars(eff.total);
  const quality = computeDecisionQualityBonus(G.decision_log);

  showScreen('screenFinal');

  const eyebrows = { A:'// GESTIÓN EXITOSA', B:'// GESTIÓN ACEPTABLE', C:'// GESTIÓN DEFICIENTE', D:'// COLAPSO INSTITUCIONAL' };
  const titles   = { A:'Crisis<br>contenida', B:'Crisis<br>costosa', C:'Crisis<br>sin resolver', D:'Quiebre<br>institucional' };
  const subs = {
    A: `${G.team.name} demostró capacidad técnica, velocidad de respuesta y comunicación efectiva. El banco abrió el lunes y la relación con el regulador se mantuvo sólida.`,
    B: `${G.team.name} logró abrir el lunes pero las decisiones subóptimas generaron costos innecesarios. Hubo aprendizajes valiosos para el futuro.`,
    C: `${G.team.name} no logró estabilizar el banco a tiempo. La recuperación fue incompleta y las consecuencias regulatorias serán significativas.`,
    D: `Las decisiones críticas tomadas por ${G.team.name} llevaron al banco a un punto de no retorno. El escenario sirve como lección sobre lo que nunca debe hacerse.`
  };
  const colors = { A:'var(--success)', B:'var(--info)', C:'var(--gold)', D:'var(--accent)' };

  document.getElementById('finalEyebrow').textContent = eyebrows[st.ctx];
  document.getElementById('finalEyebrow').style.color = colors[st.ctx];
  document.getElementById('finalTitle').innerHTML     = titles[st.ctx];
  document.getElementById('finalSub').textContent     = subs[st.ctx];
  document.getElementById('finalBudget').textContent  = fmt(budgetFinal);
  document.getElementById('finalBudget').style.color  = budgetFinal >= 0 ? colors[st.ctx] : 'var(--accent)';
  document.getElementById('finalTeamLabel').textContent =
    `${G.team.name} · ${G.hours}h consumidas · ${G.decision_log.length} decisiones · reputación final ${G.reputation}% (techo ${MAX_FINAL_REPUTATION}%)`;

  const correct = G.decision_log.filter(l => l.type === 'correct').length;
  const traps   = G.decision_log.filter(l => l.type === 'trap').length;
  document.getElementById('finalStats').innerHTML = `
    <div class="fstat"><div class="fstat-val" style="color:var(--success)">${correct}</div><div class="fstat-lbl">Óptimas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--accent)">${traps}</div><div class="fstat-lbl">Trampas caídas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--info)">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div><div class="fstat-lbl">Bonos de Equipo ${eff.total}</div></div>`;

  // Narrativa: registro + finanzas + bonos de equipo
  let narrative = `<div class="story-narrative" style="margin-bottom:1.25rem"><div class="sn-title">REGISTRO DE DECISIONES</div>`;
  G.decision_log.forEach(e => {
    const tierCss = e.type === 'correct' ? 'sn-tier-best' : e.type === 'ok' ? 'sn-tier-good' : 'sn-tier-poor';
    narrative += `
    <div class="sn-chapter">
      <div class="sn-chapter-head">
        <span class="sn-chapter-num">STAGE ${e.stage}</span>
        <span class="sn-chapter-name">${e.text}</span>
        <span class="sn-tier-badge ${tierCss}">${e.typeLabel}</span>
      </div>
      <div class="sn-action">Opción <strong>${e.letter}</strong> · ${fmt(e.cost)} · ${e.hours}h${e.toolBonus && e.toolBonus.matched > 0 ? ` · 🛠 ${e.toolBonus.matched}/${e.toolBonus.total}` : ''}</div>
    </div>`;
  });
  narrative += `</div>`;

  narrative += `<div class="budget-narrative">
    <div class="bn-title">RESUMEN FINANCIERO</div>
    <div class="bn-sheet">
      <div class="bn-row"><span>Budget inicial</span><span class="bn-val bn-blue">$5,000,000</span></div>
      <div class="bn-row"><span>Costos operativos</span><span class="bn-val bn-red">-${fmt(G.costs)}</span></div>
      <div class="bn-row"><span>Penalizaciones</span><span class="bn-val bn-red">-${fmt(G.penalties)}</span></div>
      <div class="bn-row bn-total"><span>Presupuesto final</span><span class="bn-val" style="color:${budgetFinal >= 0 ? 'var(--success)' : 'var(--accent)'}">${fmt(budgetFinal)}</span></div>
    </div>
  </div>`;

  narrative += `<div class="budget-narrative" style="margin-top:1rem">
    <div class="bn-title">BONOS DE EQUIPO — ${eff.total} pts (${'★'.repeat(stars)}${'☆'.repeat(5 - stars)})</div>
    <div class="bn-sheet">
      <div class="bn-row"><span>Base</span><span class="bn-val">${eff.base}</span></div>
      <div class="bn-row"><span>Anticipación (compras tempranas)</span><span class="bn-val bn-blue">+${eff.anticipation}</span></div>
      <div class="bn-row"><span>Momento justo (compra en su etapa ideal)</span><span class="bn-val bn-blue">+${eff.exactStage}</span></div>
      ${eff.exactStageList.length ? `<div class="bn-subrow">${eff.exactStageList.map(t => `${t.name} (Etapa ${t.stage})`).join(' · ')}</div>` : ''}
      <div class="bn-row"><span>Equipamiento (aciertos equipados)</span><span class="bn-val bn-blue">+${eff.equip}</span></div>
      <div class="bn-row"><span>Ritmo de decisión</span><span class="bn-val" style="color:${eff.timeScore >= 0 ? 'var(--success)' : 'var(--accent)'}">${eff.timeScore >= 0 ? '+' : ''}${eff.timeScore}</span></div>
      <div class="bn-row"><span>Compras inútiles</span><span class="bn-val bn-red">-${eff.wasted}</span></div>
      <div class="bn-row bn-total"><span>Calidad de decisiones (directo al puntaje)</span><span class="bn-val" style="color:${quality >= 0 ? 'var(--success)' : 'var(--accent)'}">${quality >= 0 ? '+' : ''}${quality} pts</span></div>
    </div>
  </div>`;

  document.getElementById('finalNarrativeArea').innerHTML = narrative;
}

function showGameOver(title, reason) {
  showScreen('screenOver');
  document.getElementById('goTitle').textContent = title;
  document.getElementById('goSub').textContent   = reason;
}

// ══════════════════════════════════════════
// SIDEBAR & HELPERS
// ══════════════════════════════════════════
function updateSidebar() {
  document.getElementById('budgetVal').textContent   = fmt(G.budget);
  document.getElementById('blCosts').textContent     = '-' + fmt(G.costs);
  document.getElementById('blPenalties').textContent = G.penalties > 0 ? '-' + fmt(G.penalties) : '$0';
  document.getElementById('blAvailable').textContent = fmt(G.budget);
  document.getElementById('blAvailable').style.color = G.budget < 1000000 ? 'var(--accent)' : G.budget < 2000000 ? '#e6a817' : 'var(--info)';
  document.getElementById('budgetVal').style.color   = G.budget < 0 ? 'var(--accent)' : G.budget < 1500000 ? '#e6a817' : '#e5ddd5';

  // Reputación (nuevo — misma variable que el multijugador)
  const repVal = document.getElementById('repVal');
  const repBar = document.getElementById('repBar');
  if (repVal) {
    const rep = G.reputation ?? 100;
    repVal.textContent = rep + '%';
    const repColor = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--gold)' : 'var(--accent)';
    repVal.style.color = repColor;
    if (repBar) { repBar.style.width = rep + '%'; repBar.style.background = repColor; }
  }

  const pct = Math.min(100, (G.hours / HOURS_LIMIT) * 100);
  document.getElementById('hoursConsumedVal').textContent = G.hours + 'h';
  document.getElementById('hoursLabel').textContent       = (HOURS_LIMIT - G.hours) + 'h restantes';
  const bar = document.getElementById('hoursBar');
  bar.style.width = pct + '%';
  bar.className   = 'ht-bar' + (pct > 85 ? ' crit' : pct > 60 ? ' warn' : '');

  const stamps = ['VIE 10AM', 'SAB 8AM', 'SAB 14PM', 'DOM 10AM', 'LUN 12PM', 'LUN 10AM'];
  document.getElementById('currentTimeStamp').textContent = stamps[Math.min(G.stage, 5)] || 'LUN 10AM';

  const ctxBox = document.getElementById('contextBox');
  const ctxMap = {
    A: ['var(--success)', 'Contexto A — Camino óptimo'],
    B: ['var(--accent)',  'Contexto B — Camino comprometido'],
    C: ['var(--gold)',    'Contexto C — Estado Grave'],
    D: ['var(--accent)',  'Contexto D — Estado Crítico']
  };
  if (ctxMap[G.ctx]) { ctxBox.style.color = ctxMap[G.ctx][0]; ctxBox.textContent = ctxMap[G.ctx][1]; }
  else { ctxBox.style.color = 'var(--muted)'; ctxBox.textContent = 'Sin bifurcación activa'; }

  const pp = document.getElementById('penaltiesList');
  if (!G.flags.pendingPenalties || G.flags.pendingPenalties.length === 0) {
    pp.textContent = 'Ninguna'; pp.style.color = 'var(--muted)';
  } else {
    pp.innerHTML = G.flags.pendingPenalties.map(p =>
      `<div class="penalty-box" style="margin-bottom:.3rem"><div class="penalty-lbl">DIFERIDA</div>${p.label}: -${fmt(p.amount)}</div>`
    ).join('');
  }

  const dl = document.getElementById('decisionLog');
  dl.innerHTML = G.decision_log.length === 0
    ? '<div style="font-size:.76rem;color:var(--muted)">Sin decisiones aún.</div>'
    : G.decision_log.map(e => `
        <div class="log-entry log-${e.type}">
          <div class="log-lbl">STAGE ${e.stage} · OPT ${e.letter} · ${e.typeLabel}</div>
          ${e.text} — ${fmt(e.cost)}${e.hours ? ' · +' + e.hours + 'h' : ''}
        </div>`).join('');

  const badge = document.getElementById('notifBadge');
  badge.style.display = G.unread > 0 ? 'flex' : 'none';
  badge.textContent   = G.unread;
}

function renderRoundIndicator() {
  document.getElementById('roundIndicator').innerHTML =
    Array.from({ length: 5 }, (_, i) => {
      const cls = i < G.stage ? 'done' : i === G.stage ? 'active' : '';
      return `<div class="ri-dot ${cls}" title="Stage ${i + 1}"></div>`;
    }).join('') +
    `<span style="font-family:'DM Mono',monospace;font-size:.62rem;color:var(--muted);margin-left:.3rem">Stage ${G.stage + 1}/5</span>`;
}

function addNotif(type, title, body) {
  G.notifs.unshift({ type, title, body, time: G.stage + 1 });
  if (G.currentTab !== 'notif') G.unread++;
  const cls  = { info:'notif-info', warn:'notif-warn', alert:'notif-alert', branch:'notif-branch', recovery:'notif-recovery' }[type] || 'notif-info';
  const item = document.createElement('div');
  item.className = `notif-item ${cls}`;
  item.innerHTML = `<div class="notif-dot"></div><div style="flex:1"><strong style="font-size:.78rem">${title}</strong><div style="font-size:.72rem;margin-top:.1rem;opacity:.85">${body}</div></div><div class="notif-time">S${G.stage + 1}</div>`;
  document.getElementById('notifFeed').prepend(item);
  const badge = document.getElementById('notifBadge');
  if (badge) { badge.style.display = G.unread > 0 ? 'flex' : 'none'; badge.textContent = G.unread; }
}

function flashBudget(cost) {
  const toast = document.getElementById('budgetToast');
  toast.className   = cost > 500000 ? 'toast-red' : cost > 100000 ? 'toast-amber' : 'toast-green';
  toast.textContent = cost > 0 ? '-' + fmt(cost) : '+' + fmt(Math.abs(cost));
  setTimeout(() => { toast.className = ''; }, 2400);
}

function switchTab(tab) {
  G.currentTab = tab;
  if (tab === 'notif') { G.unread = 0; updateSidebar(); }
  ['info', 'notif', 'log'].forEach(t => {
    document.getElementById('stab-' + t)?.classList.toggle('active', t === tab);
    document.getElementById('sp-' + t)?.classList.toggle('active', t === tab);
  });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function resetGame() { showScreen('screenIntro'); }

// ── Exponer handlers para los onclick/onsubmit inline del HTML ──
// (gm.js ahora es un módulo, así que las funciones no son globales por
// defecto y hay que colgarlas de window explícitamente.)
Object.assign(window, {
  startGame, selectOption, confirmDecision, toggleGMInfo,
  purchaseTool, switchTab, resetGame
});
