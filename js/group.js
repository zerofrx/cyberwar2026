// ══════════════════════════════════════════
// group.js — Lógica de la pantalla de grupo
// Soporta roles: ciso | analyst | legal | comms | ops
// ══════════════════════════════════════════

import { supabase }                          from './supabase-client.js';
import { STAGES, BUDGET_INIT, HOURS_LIMIT,
         fmt, applyDecision, computeStage5State,
         TOOLS_CATALOG, STAGE_TIME_TARGETS, findTool,
         toolsForStage, ownedIds,
         computeEfficiencyScore, efficiencyStars, efficiencyBreakdown } from './game-data.js?v=3';

// ── Parsear URL params ───────────────────────
const params    = new URLSearchParams(location.search);
const SESSION_ID = params.get('session') || localStorage.getItem('cw_session_id');
const GROUP_ID   = params.get('group')   || localStorage.getItem('cw_group_id');
const ROLE       = (params.get('role')   || localStorage.getItem('cw_role') || 'ciso').toLowerCase();
const IS_LEADER  = ROLE === 'ciso';

// ── Estado local ─────────────────────────────
let group    = null;   // fila de la tabla groups
let session  = null;   // fila de la tabla sessions
let unread   = 0;
let currentTab = 'info';

const ROLE_LABELS = {
  ciso: 'CISO', analyst: 'ANALISTA', legal: 'LEGAL',
  comms: 'COMMS', ops: 'OPS'
};
const ROLE_CSS = {
  ciso: 'role-ciso', analyst: 'role-analyst', legal: 'role-legal',
  comms: 'role-comms', ops: 'role-ops'
};

// Textos de contexto por rol para cada opción
const ROLE_PANELS = {
  analyst: {
    label: '// ANÁLISIS TÉCNICO',
    css: 'role-panel-ciso',
    keys: ['consequence']   // Analista ve la consecuencia técnica
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

  const stn = document.getElementById('sidebarTeamName');
  if (stn) stn.textContent = group?.name || '—';

  const badge = document.getElementById('roleBadge');
  badge.textContent  = ROLE_LABELS[ROLE] || ROLE.toUpperCase();
  badge.className    = `role-badge ${ROLE_CSS[ROLE] || ''}`;
}

// ── Nombre del equipo (lobby) ─────────────────
function setupLobbyNameField() {
  if (IS_LEADER) {
    const wrap  = document.getElementById('teamNameEditWrap');
    const input = document.getElementById('teamNameInput');
    if (!wrap || !input) return;
    wrap.classList.remove('mp-hidden');
    if (!input.dataset.focused) input.value = group?.name || '';

    // Evitar añadir listeners duplicados
    if (!input.dataset.wired) {
      input.dataset.wired = '1';
      document.getElementById('teamNameSaveBtn')
        .addEventListener('click', saveTeamName);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { input.blur(); } });
      input.addEventListener('focus',   () => { input.dataset.focused = '1'; });
      input.addEventListener('blur',    () => { delete input.dataset.focused; saveTeamName(); });
    }
  } else {
    const disp = document.getElementById('teamNameDisplay');
    const text = document.getElementById('teamNameText');
    if (disp) disp.classList.remove('mp-hidden');
    if (text) text.textContent = group?.name || '—';
  }
}

async function saveTeamName() {
  const input    = document.getElementById('teamNameInput');
  const feedback = document.getElementById('teamNameFeedback');
  if (!input || !feedback) return;
  const newName = input.value.trim();
  if (!newName || newName === group?.name) return;

  try {
    const { error } = await supabase.from('groups')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', GROUP_ID);
    if (error) throw error;
    group = { ...group, name: newName };
    setupTopbar();
    feedback.textContent = '✓ Guardado';
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  } catch (err) {
    feedback.textContent = 'Error al guardar';
    console.error(err);
  }
}

// ── Render principal ─────────────────────────
function render() {
  if (!session || !group) return;

  updateSidebar();

  if (session.status === 'lobby') {
    showScreen('screenLobby');
    setupLobbyNameField();
    startLobbyFeed();
    return;
  }
  stopLobbyFeed();
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
  if (waitingAdvance && group.chosen_option !== null) {
    const s = STAGES[group.stage];
    const opt = s?.options?.[group.chosen_option];
    if (opt) populateWaitOverlay(s, opt);
  } else {
    const el = document.getElementById('swoNarrative');
    if (el) { el.dataset.filled = ''; el.innerHTML = ''; el.classList.add('mp-hidden'); }
  }

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
    const state5 = computeStage5State(flags, group.budget, group.penalties, group.hours, group.reputation ?? 100);
    const v5     = s.variants[state5.ctx];
    html += buildIncidentCard(s, v5, state5);
  } else {
    html += buildIncidentCard(s, variant, null);
  }

  html += buildToolkitPanel();
  html += buildDecisionCard(s, ctx);
  main.innerHTML = html;
  renderRoundIndicator();
  ensureStageStartAt();
  startStageTimer();

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

// ── Toolkit técnico ───────────────────────────
const TOOL_CAT_SLUG = {
  'Detección':     'deteccion',
  'Forense':       'forense',
  'Inteligencia':  'inteligencia',
  'Recuperación':  'recuperacion',
  'Servicios':     'servicios'
};
const TOOL_CAT_ICON = {
  deteccion:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/></svg>',
  forense:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M7 10h6M10 7v6"/></svg>',
  inteligencia:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12l10-5M7 12l10 5"/></svg>',
  recuperacion:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  servicios:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M6 21V10l6-5 6 5v11M10 21v-6h4v6"/></svg>'
};

function buildToolkitPanel() {
  if (!TOOLS_CATALOG || !TOOLS_CATALOG.length) return '';
  const owned = ownedIds({ tools_owned: group.tools_owned });
  const locked = !IS_LEADER;
  const stageIdx = group.stage; // 0-indexed

  // Solo herramientas reveladas — las futuras NO se muestran (sin teaser)
  const visibleTools = TOOLS_CATALOG.filter(t => t.revealedAt <= stageIdx + 1);

  const cards = visibleTools.map(t => {
    const slug      = TOOL_CAT_SLUG[t.category] || 'deteccion';
    const icon      = TOOL_CAT_ICON[slug] || '';
    const isOwned   = owned.includes(t.id);
    const canAfford = group.budget >= t.cost;
    const isLocked  = !isOwned && !canAfford;
    const cls = [
      'toolkit-card',
      `cat-${slug}`,
      isOwned  ? 'tool-purchased' : '',
      isLocked ? 'tool-locked'    : ''
    ].filter(Boolean).join(' ');

    return `
      <div class="${cls}">
        <div class="tk-cat-row">
          <span class="tk-icon">${icon}</span>
          <span class="tk-cat">${t.category}</span>
        </div>
        <div class="tk-name">${t.name}</div>
        ${t.description ? `<div class="tk-desc">${t.description}</div>` : ''}
        <div class="tk-cost">${fmt(t.cost)}</div>
        <button class="tk-buy" data-tool="${t.id}"
          ${(isOwned || locked || !canAfford) ? 'disabled' : ''}
          ${IS_LEADER && !isOwned && canAfford ? `onclick="purchaseTool('${t.id}')"` : ''}>
          ${isOwned ? '✓ ADQUIRIDA'
           : canAfford ? 'COMPRAR'
           : 'SIN PRESUPUESTO'}
        </button>
      </div>`;
  }).join('');

  return `
  <section class="toolkit-panel">
    <div class="tk-header">
      <div class="tk-title-row">
        <div class="tk-title">// TOOLKIT SOC</div>
        <div class="tk-budget">PRESUPUESTO <span>${fmt(group.budget)}</span></div>
      </div>
      <div class="tk-sub">${IS_LEADER
        ? 'Compra herramientas para revelar inteligencia. Algunas son útiles ahora, otras lo serán más adelante — invertir temprano puede tener recompensa.'
        : 'El CISO decide qué herramientas compra el equipo. Las pistas reveladas aparecen en Alertas.'}</div>
      <div class="tk-legend">${
        ['deteccion','forense','inteligencia','recuperacion','servicios']
          .filter(slug => visibleTools.some(t => (TOOL_CAT_SLUG[t.category] || 'deteccion') === slug))
          .map(slug => `<span class="lg-item cat-${slug}"><span class="lg-dot"></span>${({deteccion:'DETECCIÓN',forense:'FORENSE',inteligencia:'INTELIGENCIA',recuperacion:'RECUPERACIÓN',servicios:'SERVICIOS'})[slug]}</span>`)
          .join('')
      }</div>
    </div>
    <div class="tk-grid">${cards}</div>
  </section>`;
}

window.purchaseTool = async function(toolId) {
  if (!IS_LEADER) return;
  const tool = findTool(toolId);
  if (!tool) return;
  // Solo se puede comprar si ya está revelada en el stage actual
  if (tool.revealedAt > group.stage + 1) return;
  const owned = ownedIds({ tools_owned: group.tools_owned });
  if (owned.includes(toolId)) return;
  if (group.budget < tool.cost) return;

  // Feedback inmediato: flash en la card + pulse en la pestaña Alertas
  const btn = document.querySelector(`.tk-buy[data-tool="${toolId}"]`);
  const card = btn?.closest('.toolkit-card');
  if (card) {
    card.classList.add('tool-acquiring');
    card.addEventListener('animationend', () => card.classList.remove('tool-acquiring'), { once: true });
  }
  const alertsTab = document.getElementById('tabAlerts');
  if (alertsTab && tool.reveals) {
    alertsTab.classList.remove('tab-pulse');
    void alertsTab.offsetWidth;
    alertsTab.classList.add('tab-pulse');
  }

  // Nueva shape: array de objetos {id, stage}
  const newOwned  = [...(group.tools_owned || []), { id: toolId, stage: group.stage }];
  const newBudget = group.budget - tool.cost;
  const newCosts  = (group.costs || 0) + tool.cost;
  const newNotif  = [...(group.notif_log || [])];

  if (tool.reveals) {
    newNotif.push({
      type: tool.reveals.type || 'info',
      title: tool.reveals.title,
      body: tool.reveals.body,
      stage: group.stage
    });
  } else {
    newNotif.push({
      type: 'warn',
      title: `// ${tool.name} — Sin hallazgos`,
      body: 'La herramienta no devolvió información útil para este escenario.',
      stage: group.stage
    });
  }

  await supabase.from('groups').update({
    tools_owned: newOwned,
    budget:      newBudget,
    costs:       newCosts,
    notif_log:   newNotif,
    updated_at:  new Date().toISOString()
  }).eq('id', GROUP_ID);
};

// ── Stage timer ───────────────────────────────
let _stageTimerInterval = null;

async function ensureStageStartAt() {
  if (group.stage_start_at) return;
  // Marca el inicio del stage. Pequeña carrera entre roles tolerable
  // gracias a la cláusula .is('stage_start_at', null).
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('groups')
    .update({ stage_start_at: nowIso })
    .eq('id', GROUP_ID)
    .is('stage_start_at', null)
    .select()
    .maybeSingle();
  if (data) {
    group = { ...group, stage_start_at: data.stage_start_at };
  }
}

function startStageTimer() {
  clearInterval(_stageTimerInterval);
  const el = document.getElementById('stageTimerVal');
  const wrap = document.getElementById('stageTimer');
  if (!el || !wrap) return;

  const tick = () => {
    if (!group?.stage_start_at) { el.textContent = '--:--'; return; }
    const startMs = new Date(group.stage_start_at).getTime();
    const targetSec = STAGE_TIME_TARGETS[group.stage + 1] || 600;
    const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
    const remainSec  = targetSec - elapsedSec;

    if (remainSec >= 0) {
      const m = String(Math.floor(remainSec / 60)).padStart(2, '0');
      const s = String(remainSec % 60).padStart(2, '0');
      el.textContent = `${m}:${s}`;
      wrap.classList.toggle('timer-warn',     remainSec < 120 && remainSec >= 60);
      wrap.classList.toggle('timer-critical', remainSec < 60);
      wrap.classList.remove('timer-over');
      document.body.classList.toggle('time-pressure', remainSec < 60);
      if (remainSec > 1) delete wrap.dataset.zeroFlashed;
    } else {
      const over = -remainSec;
      // Flash de pantalla una sola vez al cruzar el cero
      if (over <= 1 && !wrap.dataset.zeroFlashed) {
        wrap.dataset.zeroFlashed = '1';
        document.body.classList.add('timer-zero-flash');
        setTimeout(() => document.body.classList.remove('timer-zero-flash'), 900);
      }
      const m = String(Math.floor(over / 60)).padStart(2, '0');
      const s = String(over % 60).padStart(2, '0');
      el.textContent = `+${m}:${s}`;
      wrap.classList.add('timer-over');
      wrap.classList.remove('timer-warn', 'timer-critical');
      document.body.classList.remove('time-pressure');
    }
  };
  tick();
  _stageTimerInterval = setInterval(tick, 1000);
}

function stopStageTimer() {
  clearInterval(_stageTimerInterval);
  _stageTimerInterval = null;
  const wrap = document.getElementById('stageTimer');
  if (wrap) wrap.classList.remove('timer-warn', 'timer-over');
}

function elapsedStageSeconds() {
  if (!group?.stage_start_at) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(group.stage_start_at).getTime()) / 1000));
}

// ══════════════════════════════════════════
// JUICE — feedback visual del estado del juego
// ══════════════════════════════════════════

// Animar un número de from→to con rAF (efecto "el sistema está calculando")
function animateNumber(el, from, to, ms = 600, formatter = v => fmt(Math.round(v))) {
  if (!el || from === to) { if (el) el.textContent = formatter(to); return; }
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / ms);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    el.textContent = formatter(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Chip flotante de delta (-15% / -$600,000) que sube y se desvanece
function floatDelta(anchorEl, text, isNegative = true) {
  if (!anchorEl) return;
  const chip = document.createElement('span');
  chip.className = `stat-delta ${isNegative ? 'stat-delta-bad' : 'stat-delta-good'}`;
  chip.textContent = text;
  anchorEl.style.position = 'relative';
  anchorEl.appendChild(chip);
  chip.addEventListener('animationend', () => chip.remove(), { once: true });
}

// Sacudida + flash rojo en un elemento (daño recibido)
function statHit(el) {
  if (!el) return;
  el.classList.remove('stat-hit');
  void el.offsetWidth; // reflow para reiniciar la animación
  el.classList.add('stat-hit');
}

// Valores previos para detectar cambios entre renders
let _prevBudget = null;
let _prevRep    = null;

// ── Lobby: feed de terminal SOC ──────────────
const LOBBY_FEED_LINES = [
  '> escaneando perímetro de red... OK',
  '> verificando integridad del Core Bancario... OK',
  '> monitoreando tráfico saliente... sin anomalías',
  '> sincronizando feeds de threat intel... OK',
  '> backup incremental completado · 02:00 AM',
  '> 847 endpoints reportando... OK',
  '> certificados TLS verificados... OK',
  '> SOC en monitoreo pasivo... esperando inicio',
  '> revisando logs de autenticación... sin alertas',
  '> firewall perimetral: 14,202 paquetes descartados',
  '> análisis heurístico programado... en cola',
  '> canal cifrado con BCP establecido... OK'
];
let _lobbyFeedTimer = null;

function startLobbyFeed() {
  const feed = document.getElementById('lobbyFeed');
  if (!feed || _lobbyFeedTimer) return;
  let i = 0;
  _lobbyFeedTimer = setInterval(() => {
    const line = document.createElement('div');
    line.className = 'lobby-feed-line';
    line.textContent = LOBBY_FEED_LINES[i % LOBBY_FEED_LINES.length];
    feed.appendChild(line);
    while (feed.children.length > 6) feed.removeChild(feed.firstChild);
    i++;
  }, 2200);
}

function stopLobbyFeed() {
  clearInterval(_lobbyFeedTimer);
  _lobbyFeedTimer = null;
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
      ${isLocked ? `<div class="leader-only-banner">Solo el CISO puede seleccionar y confirmar la decisión</div>` : ''}
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
        </div>
      </div>`;
  });

  html += `
      </div>
    </div>
    <div class="confirm-bar" id="confirmBar">
      <div class="confirm-hint" id="confirmHint">
        ${IS_LEADER ? 'Selecciona la opción elegida por el equipo' : 'El CISO seleccionará la decisión del equipo'}
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
    // Penalizaciones cuantitativas ocultas: solo riesgos cualitativos
    const items = [];
    if (opt.penalty)        items.push('⚠ Riesgo de sanción económica del regulador');
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

// ── Efecto cybernético al confirmar ──────────
function showCyberConfirm(opt) {
  const overlay = document.getElementById('cyberConfirmOverlay');
  if (!overlay) return;

  // Rellenar contenido
  document.getElementById('ccoLetter').textContent     = opt.letter;
  document.getElementById('ccoOptionName').textContent = opt.text;

  // Generar líneas de log fake
  const hash = Array.from({ length: 16 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  document.getElementById('ccoLog').innerHTML = [
    `OPCIÓN ${opt.letter} — REGISTRADA`,
    `HASH: ${hash}`,
    `TIMESTAMP: ${ts}`,
    `TRANSMISIÓN COMPLETADA`
  ].map(l => `<div class="cco-log-line">${l}</div>`).join('');

  // Reiniciar animaciones: quitar y volver a añadir la clase
  overlay.classList.remove('cco-leaving');
  overlay.classList.remove('mp-hidden');

  // Cerrar con fade-out tras 2.6s
  const timer = setTimeout(() => hideCyberConfirm(), 2600);
  overlay._hideTimer = timer;
}

function hideCyberConfirm() {
  const overlay = document.getElementById('cyberConfirmOverlay');
  if (!overlay || overlay.classList.contains('mp-hidden')) return;
  clearTimeout(overlay._hideTimer);
  overlay.classList.add('cco-leaving');
  overlay.addEventListener('animationend', () => {
    overlay.classList.add('mp-hidden');
    overlay.classList.remove('cco-leaving');
  }, { once: true });
}

window.confirmDecision = async function() {
  const chosen = group.chosen_option;
  if (chosen === null || chosen === undefined || group.revealed) return;

  // Efecto cybernético
  const opt = STAGES[group.stage]?.options?.[chosen];
  if (opt) showCyberConfirm(opt);

  const result = applyDecision(group, group.stage, chosen);

  // Persistir duración del stage actual
  const elapsed = elapsedStageSeconds();
  const newDurations = { ...(group.stage_durations || {}), [group.stage + 1]: elapsed };

  if (result.isGameOver) {
    // Game Over — actualizar estado y mostrar pantalla
    await supabase.from('groups').update({
      budget:           result.budget,
      costs:            result.costs,
      penalties:        result.penalties,
      hours:            result.hours,
      reputation:       result.reputation,
      flags:            result.flags,
      decision_log:     result.decision_log,
      notif_log:        result.notif_log,
      stage_durations:  newDurations,
      final_state:      'game_over',
      revealed:         true,
      updated_at:       new Date().toISOString()
    }).eq('id', GROUP_ID);
    return;
  }

  // Aplicar decisión y marcar revealed=true
  await supabase.from('groups').update({
    budget:           result.budget,
    costs:            result.costs,
    penalties:        result.penalties,
    hours:            result.hours,
    reputation:       result.reputation,
    flags:            result.flags,
    decision_log:     result.decision_log,
    notif_log:        result.notif_log,
    stage_durations:  newDurations,
    ctx:              result.nextCtx,
    revealed:         true,
    // Si extremeOutcome, saltar al stage 4
    stage:            result.isExtremeOutcome ? 4 : group.stage,
    updated_at:       new Date().toISOString()
  }).eq('id', GROUP_ID);
};

window.toggleGMInfo = function(i) {
  document.getElementById(`gmi-${i}`)?.classList.toggle('open');
};

// ── Sidebar ──────────────────────────────────
function updateSidebar() {
  if (!group) return;

  // Budget pill — animado si cambió, con shake + chip de delta al bajar
  const budgetPill = document.getElementById('budgetPill');
  if (_prevBudget !== null && _prevBudget !== group.budget) {
    animateNumber(budgetPill, _prevBudget, group.budget);
    if (group.budget < _prevBudget) {
      statHit(budgetPill);
      floatDelta(budgetPill, '-' + fmt(_prevBudget - group.budget));
    }
  } else {
    budgetPill.textContent = fmt(group.budget);
  }
  _prevBudget = group.budget;
  document.getElementById('timePill').textContent = `${group.hours}h / ${HOURS_LIMIT}h`;

  // Hours bar
  const pct = Math.min((group.hours / HOURS_LIMIT) * 100, 100);
  document.getElementById('hoursVal').textContent = `${group.hours}h`;
  const bar = document.getElementById('hoursBar');
  bar.style.width = pct + '%';
  bar.style.background = pct > 85 ? 'var(--accent)' : pct > 60 ? 'var(--gold)' : 'var(--info)';

  // Reputation bar — shake + chip al recibir daño
  const rep    = group.reputation ?? 100;
  const repVal = document.getElementById('repVal');
  if (_prevRep !== null && _prevRep !== rep) {
    animateNumber(repVal, _prevRep, rep, 600, v => Math.round(v) + '%');
    if (rep < _prevRep) {
      statHit(repVal.closest('.rep-track') || repVal);
      floatDelta(repVal, `-${_prevRep - rep}%`);
    } else {
      floatDelta(repVal, `+${rep - _prevRep}%`, false);
    }
  } else {
    repVal.textContent = rep + '%';
  }
  _prevRep = rep;
  const repBar = document.getElementById('repBar');
  repBar.style.width = rep + '%';
  repBar.style.background =
    rep >= 70 ? 'var(--success)' :
    rep >= 40 ? 'var(--gold)'    :
                'var(--accent)';

  // Budget detail (penalizaciones ocultas — solo visibles al facilitador)
  document.getElementById('blCosts').textContent     = '-' + fmt(group.costs);
  document.getElementById('blAvailable').textContent = fmt(group.budget);
  document.getElementById('blAvailable').style.color = group.budget < 0 ? 'var(--accent)' : 'var(--info)';

  // Notifications — combine stage hints + decision log
  const decisions = group.notif_log || [];
  const stageIdx  = group.stage ?? 0;
  const hints     = [];
  for (let i = 0; i <= Math.min(stageIdx, STAGES.length - 1); i++) {
    (STAGES[i].hints || []).forEach(h => hints.push(h));
  }
  const allAlerts = [...hints, ...decisions];

  {
    const badge = document.getElementById('notifBadge');
    if (allAlerts.length && currentTab !== 'alerts') {
      unread = allAlerts.length;
      badge.textContent = unread;
      badge.style.display = 'inline';
    }
    document.getElementById('notifFeed').innerHTML = allAlerts.length
      ? [...allAlerts].reverse()
          .map(n => `<div class="notif-item notif-${n.type}"><div class="ni-title">${n.title}</div><div class="ni-body">${n.body}</div></div>`)
          .join('')
      : '<div style="color:var(--muted);font-size:.78rem;text-align:center;padding:1rem">Sin alertas</div>';
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
      <div style="font-size:.65rem;opacity:.6">// DECISIÓN APLICADA — ETAPA ${group.stage + 1}</div>
      <div class="cr2-title">Opción ${opt.letter}: ${opt.text}</div>
    </div>
    <div class="cr2-body">
      <div class="cr2-budget-box">
        <div class="cr2-brow"><span>Costo de decisión</span><span class="cr2-val cr2-red">${effectiveCost > 0 ? '-'+fmt(effectiveCost) : '$0'}</span></div>
        <div class="cr2-brow total"><span>Presupuesto actual</span><span class="cr2-val cr2-blue">${fmt(group.budget)}</span></div>
        <div class="cr2-brow"><span>Horas consumidas</span><span class="cr2-val">${group.hours}h / ${HOURS_LIMIT}h</span></div>
      </div>
    </div>
  </div>`;
  main.insertAdjacentHTML('beforeend', html);
  main.scrollTop = 99999;
}

function populateWaitOverlay(s, opt) {
  const el = document.getElementById('swoNarrative');
  if (!el || el.dataset.filled === '1') return;
  el.dataset.filled = '1';

  const nextStage   = STAGES[group.stage + 1];
  const nextCtx     = opt.nextCtx || 'A';
  const nextVariant = nextStage?.variants?.[nextCtx];

  let html = `
    <div class="swo-divider"></div>
    <div class="swo-section">
      <div class="swo-label">// LO QUE OCURRIÓ EN BANCO MERIDIAN</div>
      <div class="swo-text">${(opt.waitStory || opt.consequence).replace(/\n\n/g, '<br><br>')}</div>
    </div>`;

  if (nextStage) {
    html += `
    <div class="swo-divider"></div>
    <div class="swo-section">
      <div class="swo-label">// SE APROXIMA — ${nextStage.label}</div>
      <div class="swo-next-time">${nextStage.timestamp}</div>
      <div class="swo-next-title">${nextStage.title}</div>
      <div class="swo-text">${nextStage.status}</div>
      ${nextVariant ? `<div class="swo-text swo-variant">${nextVariant.narrative}</div>` : ''}
    </div>`;
  }

  el.innerHTML = html;
  el.classList.remove('mp-hidden');
}

// ── showFinal ────────────────────────────────
function showFinal() {
  showScreen('screenFinal');

  const flags  = group.flags || {};
  // Aplicar penalizaciones diferidas al mostrar final
  let budgetFinal = group.budget;
  let penFinal    = group.penalties;
  (flags.pendingPenalties || []).forEach(p => { budgetFinal -= p.amount; penFinal += p.amount; });

  const state = computeStage5State(flags, budgetFinal, penFinal, group.hours, group.reputation ?? 100);
  budgetFinal -= state.extraPenalties;
  penFinal    += state.extraPenalties;

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
  // ── Eficiencia (medalla + desglose) ───────────────
  const effBreakdown = efficiencyBreakdown(group.stage_durations || {}, group.tools_owned || []);
  const effScore     = effBreakdown.total;
  const stars        = efficiencyStars(effScore);
  const starsHtml    = Array.from({ length: 5 },
    (_, i) => `<span class="${i < stars ? '' : 'eff-empty'}">★</span>`).join('');

  document.getElementById('finalStats').innerHTML = `
    <div class="fstat"><div class="fstat-val" style="color:var(--success)">${correct}</div><div class="fstat-lbl">Óptimas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--accent)">${traps}</div><div class="fstat-lbl">Trampas caídas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--info)">${group.hours}h</div><div class="fstat-lbl">Horas usadas</div></div>
    <div class="fstat eff-fstat">
      <div class="fstat-val eff-stars">${starsHtml}</div>
      <div class="fstat-lbl">Eficiencia (${effScore} pts)</div>
      <div class="eff-breakdown">
        <div class="eff-row"><span>Base</span><span>+${effBreakdown.base}</span></div>
        ${effBreakdown.anticipation ? `<div class="eff-row eff-good"><span>Anticipación</span><span>+${effBreakdown.anticipation}</span></div>` : ''}
        ${effBreakdown.timeScore > 0
          ? `<div class="eff-row eff-good"><span>Velocidad</span><span>+${effBreakdown.timeScore}</span></div>`
          : effBreakdown.timeScore < 0
          ? `<div class="eff-row eff-bad"><span>Tiempo</span><span>${effBreakdown.timeScore}</span></div>`
          : ''}
        ${effBreakdown.wasted ? `<div class="eff-row eff-bad"><span>Herramientas inútiles</span><span>−${effBreakdown.wasted}</span></div>` : ''}
        <div class="eff-row eff-total"><span>Total</span><span>${effScore}</span></div>
      </div>
    </div>`;

  // Persistir score de eficiencia (best-effort)
  supabase.from('groups').update({ efficiency_score: effScore }).eq('id', GROUP_ID).then(() => {});

  // ── Historia final ───────────────────────────
  const stories = {
    A: `Banco Meridian superó el ataque de ransomware más grave de su historia sin perder la confianza de sus clientes ni su posición ante el regulador. El lunes a las 10:00 AM las puertas abrieron en modo controlado, y los 180,000 clientes encontraron los servicios esenciales funcionando sin interrupciones pese al fin de semana más difícil en la historia del banco.\n\nLas decisiones técnicas correctas en las primeras horas —contención lógica, preservación de evidencia, comunicación protocolizada— marcaron la diferencia entre una crisis gestionada y un colapso institucional. El BCP reconoció públicamente la respuesta como modelo de gestión de incidentes para el sector financiero. Las penalizaciones fueron mínimas o inexistentes.\n\nBanco Meridian emerge de esta crisis no solo intacto sino fortalecido. La reputación institucional se mantiene sólida, los sistemas están limpios y documentados, y el equipo demostró que la preparación y las decisiones correctas bajo presión extrema son posibles. Este es el estándar que el sector necesita.`,
    B: `Banco Meridian abrió el lunes —ese objetivo crítico se cumplió— pero el costo del camino fue significativamente mayor de lo necesario. Las decisiones subóptimas durante la crisis generaron gastos que erosionaron el presupuesto operativo y dejaron al regulador con preguntas legítimas sobre la calidad de la gestión del equipo.\n\nEl BCP abrió un expediente de seguimiento formal. No hay multas catastróficas, pero las observaciones acompañarán al banco durante los próximos doce meses de auditorías reforzadas. Los accionistas recibieron el informe con reservas: se abrió, sí, pero ¿a qué precio y con qué precedentes?\n\nEl banco sobrevive. La lección es clara: abrir el lunes no es suficiente si el camino para lograrlo fue innecesariamente costoso. Una próxima crisis —y siempre hay una próxima— llegará con las reservas ya parcialmente comprometidas por las decisiones de este fin de semana.`,
    C: `Banco Meridian no abrió el lunes. Los cajeros permanecieron apagados. Las sucursales colocaron carteles improvisados en sus ventanas. Las redes sociales ardieron con el hashtag #MeridianCerrado. Para las 2:00 PM, el BCP había iniciado formalmente una supervisión especial y tres medios de comunicación tenían corresponsales frente a la sede central.\n\nEl BCP no tiene margen de flexibilidad cuando una institución financiera de importancia sistémica no puede operar en la fecha comprometida. Las penalizaciones son significativas y el banco entra en modo de supervisión reforzada: cada decisión futura requerirá aprobación regulatoria previa, lo que ralentizará dramáticamente la recuperación.\n\nNo todo está perdido. Con un plan de remediación creíble presentado antes del jueves y ejecución disciplinada, Banco Meridian puede recuperar su posición operativa en el próximo trimestre. Pero la confianza —de clientes, reguladores y mercado— tardará años en reconstruirse.`,
    D: `A las 2:47 PM del lunes, el Superintendente de Bancos emitió la Resolución de Intervención Temporal número 2026-BM-001 sobre Banco Meridian. El banco —con 180,000 clientes y cuarenta años de historia ininterrumpida en el sistema financiero— dejó de operar de forma independiente en ese momento.\n\nLas decisiones tomadas durante la crisis no solo destruyeron el presupuesto y la reputación institucional: activaron simultáneamente todos los mecanismos de protección regulatoria disponibles. Backups destruidos, pagos ilegales de rescate, obstrucción activa de la investigación, silencio ante el regulador en momentos críticos —la acumulación de errores fue demasiado para cualquier sistema de defensa institucional.\n\nLos próximos pasos no son recuperación sino procesos. Auditorías forenses completas, demandas colectivas de depositantes, posible liquidación controlada o fusión forzada con otro banco intervenido. El análisis post-mortem de esta crisis se utilizará durante años en programas de formación en ciberseguridad financiera. Como ejemplo definitivo de qué no hacer.`
  };

  // ── Reputación ────────────────────────────────
  const rep      = group.reputation ?? 100;
  const repColor = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--gold)' : 'var(--accent)';
  const repLabel = rep >= 70 ? 'Reputación preservada' : rep >= 40 ? 'Reputación dañada' : rep >= 25 ? 'Reputación crítica' : 'Reputación destruida';
  const repDesc  = rep >= 70
    ? 'Las decisiones del equipo mantuvieron la confianza institucional. El banco conserva su credibilidad ante reguladores, clientes y mercado.'
    : rep >= 40
    ? 'Algunas decisiones comprometieron la imagen pública del banco. Se requiere trabajo activo para recuperar la confianza del mercado en los próximos meses.'
    : rep >= 25
    ? 'El daño reputacional es severo y ha incidido directamente en el resultado final. La reconstrucción de la imagen institucional tomará años de gestión activa.'
    : 'La reputación institucional fue destruida. El banco ha perdido la confianza de sus clientes, el mercado y el regulador de forma casi irrecuperable.';

  let narrative = `
  <div class="fn-story">
    <div class="fn-story-eyebrow">// HISTORIA FINAL — BANCO MERIDIAN</div>
    <div class="fn-story-body">${(stories[state.ctx] || stories.D).replace(/\n\n/g, '</p><p>')}</div>
  </div>

  <div class="fn-rep-block">
    <div class="fn-rep-header">
      <div class="fn-rep-label">// REPUTACIÓN INSTITUCIONAL FINAL</div>
      <div class="fn-rep-pct" style="color:${repColor}">${rep}%</div>
    </div>
    <div class="fn-rep-bar-track">
      <div class="fn-rep-bar" style="width:${rep}%;background:${repColor}"></div>
    </div>
    <div class="fn-rep-tag" style="color:${repColor}">${repLabel}</div>
    <div class="fn-rep-desc">${repDesc}</div>
  </div>

  <div class="story-narrative" style="margin-bottom:1.25rem"><div class="sn-title">REGISTRO DE DECISIONES</div>`;

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
