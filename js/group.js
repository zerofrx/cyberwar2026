// ══════════════════════════════════════════
// group.js — Lógica de la pantalla de grupo
// Soporta roles: leader | ciso | legal | comms | ops
// ══════════════════════════════════════════

import { supabase }                          from './supabase-client.js';
import { STAGES, BUDGET_INIT, HOURS_LIMIT,
         fmt, applyDecision, computeStage5State } from './game-data.js';

// ── Parsear URL params ───────────────────────
const params    = new URLSearchParams(location.search);
const SESSION_ID = params.get('session') || localStorage.getItem('cw_session_id');
const GROUP_ID   = params.get('group')   || localStorage.getItem('cw_group_id');
const ROLE       = (params.get('role')   || localStorage.getItem('cw_role') || 'ciso').toLowerCase();
const IS_LEADER  = ROLE === 'leader';

// ── Estado local ─────────────────────────────
let group    = null;   // fila de la tabla groups
let session  = null;   // fila de la tabla sessions
let unread   = 0;
let currentTab = 'info';

const ROLE_LABELS = {
  leader: 'LÍDER', ciso: 'CISO', legal: 'LEGAL',
  comms: 'COMMS', ops: 'OPS'
};
const ROLE_CSS = {
  leader: 'role-leader', ciso: 'role-ciso', legal: 'role-legal',
  comms: 'role-comms', ops: 'role-ops'
};

// Textos de contexto por rol para cada opción
const ROLE_PANELS = {
  ciso: {
    label: '// ANÁLISIS TÉCNICO',
    css: 'role-panel-ciso',
    keys: ['consequence']   // CISO ve la consecuencia técnica
  },
  legal: {
    label: '// EXPOSICIÓN LEGAL',
    css: 'role-panel-legal',
    keys: ['penalty', 'laborLawsuit', 'silentCorp', 'licenseRevoked']
  },
  comms: {
    label: '// IMPACTO REPUTACIONAL',
    css: 'role-panel-comms',
    keys: ['branchNote']
  },
  ops: {
    label: '// IMPACTO OPERACIONAL',
    css: 'role-panel-ops',
    keys: ['cost', 'hours']
  }
};

// ── Init ─────────────────────────────────────
async function init() {
  if (!SESSION_ID || !GROUP_ID) {
    window.location.href = 'index.html';
    return;
  }

  // Cargar estado inicial
  const [{ data: grp }, { data: ses }] = await Promise.all([
    supabase.from('groups').select('*').eq('id', GROUP_ID).single(),
    supabase.from('sessions').select('*').eq('id', SESSION_ID).single()
  ]);

  group   = grp;
  session = ses;

  setupTopbar();
  render();

  // Suscripciones realtime
  supabase
    .channel(`room-${ses.room_code}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'sessions',
      filter: `id=eq.${SESSION_ID}`
    }, payload => {
      session = { ...session, ...payload.new };
      render();
    })
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'groups',
      filter: `id=eq.${GROUP_ID}`
    }, payload => {
      group = { ...group, ...payload.new };
      render();
    })
    .subscribe();

  // Presencia: marcar online
  await supabase.from('players')
    .update({ is_online: true, last_seen: new Date().toISOString() })
    .eq('group_id', GROUP_ID)
    .eq('role', ROLE);
}

// ── Setup topbar ─────────────────────────────
function setupTopbar() {
  document.getElementById('groupNamePill').textContent = group?.name || '—';
  document.getElementById('roomCodePill').textContent  = session?.room_code || '—';
  document.getElementById('lobbyRoomCode').textContent = session?.room_code || '—';

  const badge = document.getElementById('roleBadge');
  badge.textContent  = ROLE_LABELS[ROLE] || ROLE.toUpperCase();
  badge.className    = `role-badge ${ROLE_CSS[ROLE] || ''}`;
}

// ── Render principal ─────────────────────────
function render() {
  if (!session || !group) return;

  updateSidebar();

  if (session.status === 'lobby') {
    showScreen('screenLobby');
    return;
  }
  if (session.status === 'finished' || group.final_state) {
    showFinal();
    return;
  }
  if (group.final_state === 'game_over') {
    showScreen('screenOver');
    return;
  }

  showScreen('screenGame');

  // Si ya confirmó y espera al facilitador para avanzar
  const waitingAdvance = group.revealed && (group.stage === session.current_stage);
  document.getElementById('stageWaitOverlay').classList.toggle('mp-hidden', !waitingAdvance);

  // Renderizar la etapa solo si es la etapa correcta
  if (group.stage === session.current_stage) {
    renderStage();
  }
}

// ── Render etapa ─────────────────────────────
function renderStage() {
  const s       = STAGES[group.stage];
  const ctx     = group.ctx;
  const variant = s.variants[ctx] || s.variants['default'] || s.variants['A'];
  const main    = document.getElementById('gameMain');

  let html = '';

  if (s.isStage5) {
    const flags  = group.flags || {};
    const state5 = computeStage5State(flags, group.budget, group.penalties);
    const v5     = s.variants[state5.ctx];
    html += buildIncidentCard(s, v5, state5);
  } else {
    html += buildIncidentCard(s, variant, null);
  }

  html += buildDecisionCard(s, ctx);
  main.innerHTML = html;
  renderRoundIndicator();

  // Restaurar selección si el líder ya eligió
  if (group.chosen_option !== null && group.chosen_option !== undefined) {
    const opts = document.querySelectorAll('.dec-opt');
    opts.forEach((el, i) => {
      el.classList.toggle('selected', i === group.chosen_option);
      el.classList.toggle('peer-selected', !IS_LEADER && i === group.chosen_option);
    });
    if (IS_LEADER) {
      const opt = s.options[group.chosen_option];
      const eff = (ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;
      document.getElementById('confirmHint').innerHTML =
        `Opción elegida: <strong>${opt.letter} — ${opt.text}</strong> · ${fmt(eff)}`;
      document.getElementById('confirmBtn').style.display = 'block';
    }
  }

  // Si ya está revelado, mostrar la consecuencia
  if (group.revealed) {
    const opt = s.options[group.chosen_option];
    const eff = (ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;
    appendConsequenceReveal(opt, eff);
    if (IS_LEADER) {
      document.getElementById('confirmBtn').textContent = 'AVANZAR →';
      document.getElementById('confirmBtn').onclick     = null; // El avance lo controla el facilitador
      document.getElementById('confirmBtn').style.display = 'block';
      document.getElementById('confirmBtn').disabled   = true;
    }
  }
}

function buildIncidentCard(s, variant, state5) {
  return `
  <div class="incident-card">
    <div class="ic-status-bar"><div class="ic-dot"></div>${s.status}</div>
    <div class="ic-body">
      <div class="ic-eyebrow">${s.label} · ${s.timestamp}</div>
      <h2 class="ic-title">${s.title}</h2>
      <p class="ic-narrative">${variant.narrative}</p>
      ${variant.update ? `<div class="ic-update"><div class="ic-update-label">// ACTUALIZACIÓN</div>${variant.update}</div>` : ''}
      ${variant.branchCtx ? `<div class="branch-ctx"><div class="branch-ctx-label">// BIFURCACIÓN ACTIVA</div>${variant.branchCtx}</div>` : ''}
      ${state5 ? `<div style="margin-top:.75rem;padding:.65rem;background:var(--gold-light);border:1px solid #e0c880;border-radius:6px;font-size:.78rem;color:var(--gold)">
        <div style="font-family:'DM Mono',monospace;font-size:.54rem;letter-spacing:.1em;margin-bottom:.2rem">// ESTADO CALCULADO</div>
        <strong>Estado: ${state5.label}</strong> — ${state5.reason}
      </div>` : ''}
    </div>
  </div>`;
}

function buildDecisionCard(s, ctx) {
  const rolePanel = ROLE_PANELS[ROLE];
  const isLocked  = !IS_LEADER;

  let html = `
  <div class="decision-card">
    <div class="dc-header">
      <div class="dc-question">${s.question}</div>
      <div class="impact-badge impact-${s.impact === 'CRÍTICO' ? 'high' : 'med'}">${s.impact}</div>
    </div>
    <div class="dc-body">
      ${isLocked ? `<div class="leader-only-banner">Solo el Líder del equipo puede seleccionar y confirmar la decisión</div>` : ''}
      <div class="decision-opts ${isLocked ? 'dec-opts-locked' : ''}" id="decOpts">`;

  s.options.forEach((opt, i) => {
    const eff = (ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;
    const costStr   = eff === 0 ? '$0' : fmt(eff);
    const costClass = eff === 0 ? 'zero' : '';

    // Panel de rol
    let rolePanelHtml = '';
    if (rolePanel) {
      rolePanelHtml = buildRolePanel(opt, rolePanel, eff);
    }

    html += `
      <div class="dec-opt" id="opt-${i}" ${IS_LEADER ? `onclick="selectOption(${i})"` : ''}>
        <div class="do-key">${opt.letter}</div>
        <div class="do-content">
          <div class="do-text">${opt.text}</div>
          <div class="do-sub">${opt.sub}</div>
          <div class="opt-meta">
            <span class="opt-cost ${costClass}">${costStr}</span>
            ${opt.hours > 0
              ? `<span class="opt-hours">+${opt.hours}h</span>`
              : '<span class="opt-hours" style="color:var(--success)">Sin tiempo</span>'}
          </div>
          ${IS_LEADER ? `
            <div class="gm-type-badge gm-${opt.type}">${opt.typeLabel}</div>
            <button class="gm-info-toggle" onclick="event.stopPropagation();toggleGMInfo(${i})">▼ Ver consecuencia</button>
            <div class="gm-info" id="gmi-${i}">
              <div class="gm-consequence">${opt.consequence}</div>
              <div class="gm-branch-note">📍 ${opt.branchNote}</div>
            </div>
          ` : rolePanelHtml}
        </div>
      </div>`;
  });

  html += `
      </div>
    </div>
    <div class="confirm-bar" id="confirmBar">
      <div class="confirm-hint" id="confirmHint">
        ${IS_LEADER ? 'Selecciona la opción elegida por el equipo' : 'El Líder seleccionará la decisión del equipo'}
      </div>
      ${IS_LEADER ? '<button class="btn btn-dark" id="confirmBtn" onclick="confirmDecision()" style="display:none">APLICAR DECISIÓN →</button>' : ''}
    </div>
  </div>`;

  return html;
}

function buildRolePanel(opt, panel, effectiveCost) {
  let content = '';

  if (ROLE === 'ciso') {
    content = opt.consequence;
  } else if (ROLE === 'legal') {
    const items = [];
    if (opt.penalty)        items.push(`Penalización: ${fmt(opt.penalty)}${opt.isPendingPenalty ? ' (diferida)' : ' (inmediata)'}`);
    if (opt.laborLawsuit)   items.push('⚠ Riesgo de demanda laboral');
    if (opt.silentCorp)     items.push('⚠ Infracción regulatoria por silencio');
    if (opt.licenseRevoked) items.push('🔴 Riesgo de revocación de licencia');
    if (opt.paidRansom)     items.push('⚠ Pago ilegal de rescate');
    content = items.length
      ? items.join('<br>')
      : 'Sin implicaciones legales directas identificadas.';
  } else if (ROLE === 'comms') {
    content = opt.branchNote || 'Sin impacto reputacional directo documentado.';
  } else if (ROLE === 'ops') {
    content = `Costo operativo: <strong>${effectiveCost === 0 ? '$0' : fmt(effectiveCost)}</strong>`;
    if (opt.hours > 0) content += ` · Tiempo: <strong>+${opt.hours}h</strong>`;
    if (opt.destroysBackups) content += '<br>⚠ Riesgo de pérdida de backups';
    if (opt.openedMonday)   content += '<br>✓ Permite abrir el lunes';
  }

  return `
    <div class="role-panel ${panel.css}">
      <div class="role-panel-label">${panel.label}</div>
      <div class="role-panel-body">${content}</div>
    </div>`;
}

// ── Funciones del líder ──────────────────────
window.selectOption = async function(i) {
  if (!IS_LEADER || group.revealed) return;

  // Actualizar selección visual
  document.querySelectorAll('.dec-opt').forEach((el, idx) => {
    el.classList.toggle('selected', idx === i);
  });

  const s   = STAGES[group.stage];
  const opt = s.options[i];
  const eff = (group.ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;

  document.getElementById('confirmHint').innerHTML =
    `Opción elegida: <strong>${opt.letter} — ${opt.text}</strong> · ${fmt(eff)}${opt.hours > 0 ? ` · +${opt.hours}h` : ''}`;
  document.getElementById('confirmBtn').style.display = 'block';

  // Abrir consecuencia para el líder
  const gmi = document.getElementById(`gmi-${i}`);
  if (gmi) gmi.classList.add('open');

  // Sincronizar selección en tiempo real
  await supabase.from('groups')
    .update({ chosen_option: i, updated_at: new Date().toISOString() })
    .eq('id', GROUP_ID);
};

window.confirmDecision = async function() {
  const chosen = group.chosen_option;
  if (chosen === null || chosen === undefined || group.revealed) return;

  const result = applyDecision(group, group.stage, chosen);

  if (result.isGameOver) {
    // Game Over — actualizar estado y mostrar pantalla
    await supabase.from('groups').update({
      budget:       result.budget,
      costs:        result.costs,
      penalties:    result.penalties,
      hours:        result.hours,
      flags:        result.flags,
      decision_log: result.decision_log,
      notif_log:    result.notif_log,
      final_state:  'game_over',
      revealed:     true,
      updated_at:   new Date().toISOString()
    }).eq('id', GROUP_ID);
    return;
  }

  // Aplicar decisión y marcar revealed=true
  await supabase.from('groups').update({
    budget:        result.budget,
    costs:         result.costs,
    penalties:     result.penalties,
    hours:         result.hours,
    flags:         result.flags,
    decision_log:  result.decision_log,
    notif_log:     result.notif_log,
    ctx:           result.nextCtx,
    revealed:      true,
    // Si extremeOutcome, saltar al stage 4
    stage:         result.isExtremeOutcome ? 4 : group.stage,
    updated_at:    new Date().toISOString()
  }).eq('id', GROUP_ID);
};

window.toggleGMInfo = function(i) {
  document.getElementById(`gmi-${i}`)?.classList.toggle('open');
};

// ── Sidebar ──────────────────────────────────
function updateSidebar() {
  if (!group) return;

  // Budget pill
  document.getElementById('budgetPill').textContent = fmt(group.budget);
  document.getElementById('timePill').textContent   = `${group.hours}h / ${HOURS_LIMIT}h`;

  // Hours bar
  const pct = Math.min((group.hours / HOURS_LIMIT) * 100, 100);
  document.getElementById('hoursVal').textContent = `${group.hours}h`;
  const bar = document.getElementById('hoursBar');
  bar.style.width = pct + '%';
  bar.style.background = pct > 85 ? 'var(--accent)' : pct > 60 ? 'var(--gold)' : 'var(--info)';

  // Budget detail
  document.getElementById('blCosts').textContent     = '-' + fmt(group.costs);
  document.getElementById('blPenalties').textContent = group.penalties > 0 ? '-' + fmt(group.penalties) : '$0';
  document.getElementById('blAvailable').textContent = fmt(group.budget);
  document.getElementById('blAvailable').style.color = group.budget < 0 ? 'var(--accent)' : 'var(--info)';

  // Pending penalties
  const pending = group.flags?.pendingPenalties || [];
  const sec     = document.getElementById('pendingSection');
  sec.style.display = pending.length ? '' : 'none';
  if (pending.length) {
    document.getElementById('pendingList').innerHTML = pending
      .map(p => `<div style="font-size:.78rem;color:var(--gold);margin-bottom:.3rem">⏳ ${p.label}: -${fmt(p.amount)}</div>`)
      .join('');
  }

  // Notifications
  const feed = group.notif_log || [];
  if (feed.length) {
    const badge = document.getElementById('notifBadge');
    if (currentTab !== 'alerts') {
      unread = feed.length;
      badge.textContent = unread;
      badge.style.display = 'inline';
    }
    document.getElementById('notifFeed').innerHTML = [...feed].reverse()
      .map(n => `<div class="notif-item notif-${n.type}"><div class="ni-title">${n.title}</div><div class="ni-body">${n.body}</div></div>`)
      .join('');
  }

  // Decision log
  const log = group.decision_log || [];
  if (log.length) {
    document.getElementById('decisionLog').innerHTML = log
      .map(e => `<div class="dl-entry dl-${e.type}">
        <span class="dl-stage">S${e.stage}</span>
        <span class="dl-letter">${e.letter}</span>
        <span class="dl-text">${e.text}</span>
        <span class="dl-cost">${fmt(e.cost)}</span>
      </div>`)
      .join('');
  }
}

function renderRoundIndicator() {
  const el = document.getElementById('roundIndicator');
  if (!el) return;
  el.innerHTML = STAGES.map((s, i) => {
    const cls = i < group.stage ? 'ri-dot done' : i === group.stage ? 'ri-dot current' : 'ri-dot';
    return `<div class="${cls}" title="${s.title}"></div>`;
  }).join('');
}

window.switchTab = function(tab) {
  currentTab = tab;
  ['info','alerts','log'].forEach(t => {
    document.getElementById(`tabPanel${t.charAt(0).toUpperCase()+t.slice(1)}`).classList.toggle('mp-hidden', t !== tab);
    document.getElementById(`tab${t.charAt(0).toUpperCase()+t.slice(1)}`).classList.toggle('active', t === tab);
  });
  if (tab === 'alerts') {
    unread = 0;
    document.getElementById('notifBadge').style.display = 'none';
  }
};

function appendConsequenceReveal(opt, effectiveCost) {
  const main = document.getElementById('gameMain');
  if (main.querySelector('.consequence-reveal')) return; // ya existe
  const html = `
  <div class="consequence-reveal">
    <div class="cr2-header">
      <div style="font-size:.65rem;opacity:.6">// CONSECUENCIA REVELADA — STAGE ${group.stage + 1}</div>
      <div class="cr2-title">Opción ${opt.letter}: ${opt.text}</div>
      <div class="gm-type-badge gm-${opt.type}" style="flex-shrink:0">${opt.typeLabel}</div>
    </div>
    <div class="cr2-body">
      <div>
        <div class="cr2-label">LO QUE OCURRIÓ</div>
        <div class="cr2-text">${opt.consequence}</div>
      </div>
      <div class="cr2-branch">
        <div class="cr2-branch-label">// BIFURCACIÓN</div>
        ${opt.branchNote}
      </div>
      <div class="cr2-budget-box">
        <div class="cr2-brow"><span>Costo de decisión</span><span class="cr2-val cr2-red">${effectiveCost > 0 ? '-'+fmt(effectiveCost) : '$0'}</span></div>
        ${opt.penalty && !opt.isPendingPenalty ? `<div class="cr2-brow"><span>Penalización inmediata</span><span class="cr2-val cr2-red">-${fmt(opt.penalty)}</span></div>` : ''}
        ${opt.penalty && opt.isPendingPenalty  ? `<div class="cr2-brow"><span>Penalización diferida</span><span class="cr2-val" style="color:var(--gold)">-${fmt(opt.penalty)} al final</span></div>` : ''}
        <div class="cr2-brow total"><span>Presupuesto actual</span><span class="cr2-val cr2-blue">${fmt(group.budget)}</span></div>
        <div class="cr2-brow"><span>Horas consumidas</span><span class="cr2-val">${group.hours}h / ${HOURS_LIMIT}h</span></div>
      </div>
    </div>
  </div>`;
  main.insertAdjacentHTML('beforeend', html);
  main.scrollTop = 99999;
}

// ── showFinal ────────────────────────────────
function showFinal() {
  showScreen('screenFinal');

  const flags  = group.flags || {};
  // Aplicar penalizaciones diferidas al mostrar final
  let budgetFinal = group.budget;
  let penFinal    = group.penalties;
  (flags.pendingPenalties || []).forEach(p => { budgetFinal -= p.amount; penFinal += p.amount; });

  const state = computeStage5State(flags, budgetFinal, penFinal);

  const eyebrows = { A:'// GESTIÓN EXITOSA', B:'// GESTIÓN ACEPTABLE', C:'// GESTIÓN DEFICIENTE', D:'// COLAPSO INSTITUCIONAL' };
  const titles   = { A:'Crisis<br>contenida', B:'Crisis<br>costosa', C:'Crisis<br>sin resolver', D:'Quiebre<br>institucional' };
  const colors   = { A:'var(--success)', B:'var(--info)', C:'var(--gold)', D:'var(--accent)' };
  const teamName = group.name || 'Equipo';
  const subs     = {
    A: `${teamName} demostró capacidad técnica y comunicación efectiva. El banco abrió el lunes.`,
    B: `${teamName} logró abrir el lunes pero las decisiones subóptimas generaron costos innecesarios.`,
    C: `${teamName} no logró estabilizar el banco a tiempo. Las consecuencias regulatorias serán significativas.`,
    D: `Las decisiones críticas de ${teamName} llevaron al banco a un punto de no retorno.`
  };

  document.getElementById('finalEyebrow').textContent  = eyebrows[state.ctx];
  document.getElementById('finalEyebrow').style.color  = colors[state.ctx];
  document.getElementById('finalTitle').innerHTML      = titles[state.ctx];
  document.getElementById('finalSub').textContent      = subs[state.ctx];
  document.getElementById('finalBudget').textContent   = fmt(budgetFinal);
  document.getElementById('finalBudget').style.color   = budgetFinal >= 0 ? colors[state.ctx] : 'var(--accent)';
  document.getElementById('finalTeamLabel').textContent =
    `${teamName} · ${group.hours}h consumidas · ${(group.decision_log||[]).length} decisiones`;

  const log     = group.decision_log || [];
  const correct = log.filter(l => l.type === 'correct').length;
  const traps   = log.filter(l => l.type === 'trap').length;
  document.getElementById('finalStats').innerHTML = `
    <div class="fstat"><div class="fstat-val" style="color:var(--success)">${correct}</div><div class="fstat-lbl">Óptimas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--accent)">${traps}</div><div class="fstat-lbl">Trampas caídas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--info)">${group.hours}h</div><div class="fstat-lbl">Horas usadas</div></div>`;

  let narrative = `<div class="story-narrative" style="margin-bottom:1.25rem"><div class="sn-title">REGISTRO DE DECISIONES</div>`;
  log.forEach(e => {
    const tierCss = e.type === 'correct' ? 'sn-tier-best' : e.type === 'ok' ? 'sn-tier-good' : 'sn-tier-poor';
    narrative += `
    <div class="sn-chapter">
      <div class="sn-chapter-head">
        <span class="sn-chapter-num">STAGE ${e.stage}</span>
        <span class="sn-chapter-name">${e.text}</span>
        <span class="sn-tier-badge ${tierCss}">${e.typeLabel}</span>
      </div>
      <div class="sn-action">Opción <strong>${e.letter}</strong> · ${fmt(e.cost)} · ${e.hours}h</div>
    </div>`;
  });
  narrative += `</div>`;

  narrative += `<div class="budget-narrative">
    <div class="bn-title">RESUMEN FINANCIERO</div>
    <div class="bn-sheet">
      <div class="bn-row"><span>Budget inicial</span><span class="bn-val bn-blue">$5,000,000</span></div>
      <div class="bn-row"><span>Costos operativos</span><span class="bn-val bn-red">-${fmt(group.costs)}</span></div>
      <div class="bn-row"><span>Penalizaciones</span><span class="bn-val bn-red">-${fmt(penFinal)}</span></div>
      <div class="bn-row bn-total"><span>Presupuesto final</span>
        <span class="bn-val" style="color:${budgetFinal >= 0 ? 'var(--success)' : 'var(--accent)'}">${fmt(budgetFinal)}</span>
      </div>
    </div>
  </div>`;

  document.getElementById('finalNarrativeArea').innerHTML = narrative;
}

// ── Helpers ──────────────────────────────────
function showScreen(id) {
  ['screenLobby','screenGame','screenOver','screenFinal'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.toggle('mp-hidden', s !== id);
  });
}

init();
