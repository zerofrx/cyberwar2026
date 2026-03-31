// ══════════════════════════════════════════
// facilitator.js — Lógica del panel del facilitador
// ══════════════════════════════════════════

import { supabase }         from './supabase-client.js';
import { STAGES, fmt }      from './game-data.js';

const NUM_GROUPS  = 6;
const ROLES       = ['leader', 'ciso', 'legal', 'comms', 'ops'];
const ROLE_LABELS = { leader:'LÍDER', ciso:'CISO', legal:'LEGAL', comms:'COMMS', ops:'OPS' };

let session  = null;
let groups   = [];
let players  = [];
let sessionId = null;

// Recuperar sesión guardada del facilitador
const savedSessionId = localStorage.getItem('fac_session_id');

// ── Init ─────────────────────────────────────
async function init() {
  document.getElementById('btnCreateSession').addEventListener('click', createSession);
  document.getElementById('btnStart').addEventListener('click', startSession);
  document.getElementById('btnAdvance').addEventListener('click', advanceStage);
  document.getElementById('btnFinish').addEventListener('click', finishSession);
  document.getElementById('btnGenCodes').addEventListener('click', generateCodes);
  document.getElementById('facRoomCode').addEventListener('click', copyRoomCode);
  document.getElementById('overrideCheck').addEventListener('change', updateAdvanceButton);

  if (savedSessionId) {
    sessionId = savedSessionId;
    await loadSession();
  } else {
    showScreen('screenSetup');
  }
}

// ── Crear sesión ─────────────────────────────
async function createSession() {
  document.getElementById('btnCreateSession').disabled = true;
  document.getElementById('setupError').textContent    = '';

  try {
    // Generar código de sala único
    const code = generateCode(4);

    const { data: ses, error } = await supabase
      .from('sessions')
      .insert({ room_code: code, status: 'lobby', current_stage: 0 })
      .select()
      .single();

    if (error) throw error;

    sessionId = ses.id;
    localStorage.setItem('fac_session_id', sessionId);

    // Crear 6 grupos vacíos
    const groupRows = Array.from({ length: NUM_GROUPS }, (_, i) => ({
      session_id: sessionId,
      slot:       i + 1,
      name:       `Equipo ${i + 1}`
    }));
    await supabase.from('groups').insert(groupRows);

    session = ses;
    await loadGroups();
    showScreen('screenMain');
    renderAll();
    subscribeRealtime();
  } catch (err) {
    document.getElementById('setupError').textContent = 'Error al crear la sesión.';
    document.getElementById('btnCreateSession').disabled = false;
    console.error(err);
  }
}

// ── Cargar sesión existente ──────────────────
async function loadSession() {
  const { data: ses } = await supabase
    .from('sessions').select('*').eq('id', sessionId).single();

  if (!ses) {
    localStorage.removeItem('fac_session_id');
    showScreen('screenSetup');
    return;
  }
  session = ses;
  await loadGroups();
  showScreen('screenMain');
  renderAll();
  subscribeRealtime();
}

async function loadGroups() {
  const { data: grps } = await supabase
    .from('groups').select('*').eq('session_id', sessionId).order('slot');
  groups = grps || [];

  const { data: plrs } = await supabase
    .from('players').select('*').eq('session_id', sessionId);
  players = plrs || [];
}

// ── Controles ────────────────────────────────
async function startSession() {
  if (!session) return;
  await supabase.from('sessions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

async function advanceStage() {
  if (!session) return;
  const next = session.current_stage + 1;
  if (next > 4) {
    await finishSession();
    return;
  }

  // Avanzar stage en la sesión
  await supabase.from('sessions')
    .update({ current_stage: next, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  // Resetear chosen_option y revealed en todos los grupos activos
  const activeGroupIds = groups
    .filter(g => g.final_state !== 'game_over')
    .map(g => g.id);

  if (activeGroupIds.length) {
    await supabase.from('groups')
      .update({
        stage:         next,
        chosen_option: null,
        revealed:      false,
        updated_at:    new Date().toISOString()
      })
      .in('id', activeGroupIds);
  }
}

async function finishSession() {
  await supabase.from('sessions')
    .update({ status: 'finished', updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

// ── Render ───────────────────────────────────
function renderAll() {
  renderStatus();
  renderStageDots();
  renderGroupsGrid();
  renderControls();
  renderDecisionProgress();
}

function renderStatus() {
  const el   = document.getElementById('facStatus');
  const text = document.getElementById('facStatusText');
  el.className = `fac-status ${session.status}`;
  const labels = {
    lobby:    'LOBBY — Esperando participantes',
    active:   `ACTIVO — Etapa ${session.current_stage + 1} de 5`,
    finished: 'FINALIZADO'
  };
  text.textContent = labels[session.status] || session.status;
  document.getElementById('facRoomCode').textContent = session.room_code;
}

function renderStageDots() {
  const el = document.getElementById('facStageDots');
  el.innerHTML = STAGES.map((s, i) => {
    const cls = i < session.current_stage ? 'done' : i === session.current_stage ? 'current' : '';
    return `<div class="fac-stage-dot ${cls}" title="${s.title}">${i + 1}</div>`;
  }).join('');
  document.getElementById('currentStageLabel').textContent =
    `${session.current_stage + 1} — ${STAGES[session.current_stage]?.title || '—'}`;
}

function renderControls() {
  const isLobby    = session.status === 'lobby';
  const isActive   = session.status === 'active';
  const isFinished = session.status === 'finished';

  document.getElementById('btnStart').classList.toggle('mp-hidden', !isLobby);
  document.getElementById('btnAdvance').classList.toggle('mp-hidden', !isActive);
  document.getElementById('btnFinish').classList.toggle('mp-hidden', isLobby || isFinished);
  document.getElementById('overrideWrap').classList.toggle('mp-hidden', !isActive);
  document.getElementById('decisionProgress').classList.toggle('mp-hidden', !isActive);

  if (isActive) {
    const nextNum = session.current_stage + 2;
    document.getElementById('nextStageNum').textContent =
      session.current_stage >= 4 ? 'final' : nextNum;
    updateAdvanceButton();
  }
}

function renderDecisionProgress() {
  const active  = groups.filter(g => g.final_state !== 'game_over');
  const decided = active.filter(g => g.revealed).length;
  document.getElementById('decisionProgressBar').textContent =
    `${decided} / ${active.length} grupos han confirmado su decisión`;
}

function updateAdvanceButton() {
  const active    = groups.filter(g => g.final_state !== 'game_over');
  const allDecided = active.every(g => g.revealed);
  const override  = document.getElementById('overrideCheck').checked;
  document.getElementById('btnAdvance').disabled = !(allDecided || override);
}

function renderGroupsGrid() {
  const grid = document.getElementById('groupsGrid');
  if (!groups.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:.85rem">Sin grupos aún.</div>';
    return;
  }

  grid.innerHTML = groups.map(g => buildGroupCard(g)).join('');
}

function buildGroupCard(g) {
  const budgetPct  = Math.max(0, (g.budget / 5000000) * 100);
  const hoursPct   = Math.min(100, (g.hours / 72) * 100);
  const ctxCss     = g.ctx && g.ctx !== 'default' ? `fac-ctx-${g.ctx.toLowerCase()}` : '';
  const ctxLabel   = g.ctx && g.ctx !== 'default' ? g.ctx : '—';

  // Estado de decisión
  let dsClass = 'fac-ds-waiting';
  let dsText  = 'Esperando...';
  if (g.final_state === 'game_over') { dsClass = 'fac-ds-gameover'; dsText = 'GAME OVER'; }
  else if (g.revealed)               { dsClass = 'fac-ds-decided';  dsText = `✓ Opción ${g.final_state || (g.decision_log?.slice(-1)[0]?.letter || '?')} confirmada`; }
  else if (g.chosen_option !== null && g.chosen_option !== undefined) {
    const optLetter = STAGES[g.stage]?.options[g.chosen_option]?.letter;
    dsClass = 'fac-ds-selected';
    dsText  = `Opción ${optLetter} seleccionada`;
  }

  // Online players
  const groupPlayers = players.filter(p => p.group_id === g.id);
  const memberChips  = ROLES.map(role => {
    const p       = groupPlayers.find(pl => pl.role === role);
    const name    = p?.display_name || ROLE_LABELS[role];
    const online  = p?.is_online ? 'online' : '';
    return `<span class="fac-member-chip ${online}" title="${name}">${ROLE_LABELS[role]}</span>`;
  }).join('');

  // Card CSS
  let cardCss = 'fac-group-card';
  if (g.final_state === 'game_over') cardCss += ' gameover';
  else if (g.revealed)               cardCss += ' decided';
  else if (g.chosen_option !== null && g.chosen_option !== undefined) cardCss += ' selected';

  return `
  <div class="${cardCss}" id="gcard-${g.id}">
    <div class="fac-group-name">
      ${g.name}
      <div style="display:flex;gap:.4rem;align-items:center">
        ${ctxLabel !== '—' ? `<span class="fac-ctx-badge ${ctxCss}">CTX ${ctxLabel}</span>` : ''}
        <span class="fac-group-slot">GRP ${g.slot}</span>
      </div>
    </div>

    <div class="fac-members">${memberChips}</div>

    <div class="fac-bar-row">
      <div class="fac-bar-label">
        <span>Presupuesto</span>
        <span>${fmt(g.budget)}</span>
      </div>
      <div class="fac-bar-track">
        <div class="fac-bar-fill fac-bar-budget" style="width:${budgetPct}%"></div>
      </div>
    </div>

    <div class="fac-bar-row">
      <div class="fac-bar-label">
        <span>Horas</span>
        <span>${g.hours}h / 72h</span>
      </div>
      <div class="fac-bar-track">
        <div class="fac-bar-fill fac-bar-hours" style="width:${hoursPct}%"></div>
      </div>
    </div>

    <div class="fac-decision-state ${dsClass}">${dsText}</div>
  </div>`;
}

// ── Generar códigos de acceso ─────────────────
async function generateCodes() {
  if (!session) return;
  const btn = document.getElementById('btnGenCodes');
  btn.disabled = true;

  try {
    // Eliminar jugadores existentes de esta sesión
    await supabase.from('players').delete().eq('session_id', sessionId);

    const rows   = [];
    const output = [];

    for (const g of groups) {
      output.push(`\n--- ${g.name} ---`);
      for (const role of ROLES) {
        const code = generateCode(6);
        rows.push({
          session_id:   sessionId,
          group_id:     g.id,
          access_code:  code,
          role,
          display_name: ''
        });
        output.push(`${ROLE_LABELS[role]}: ${code}`);
      }
    }

    await supabase.from('players').insert(rows);

    // Recargar players
    const { data: plrs } = await supabase
      .from('players').select('*').eq('session_id', sessionId);
    players = plrs || [];
    renderGroupsGrid();

    // Mostrar códigos
    document.getElementById('codesOutput').innerHTML = `
      <pre style="font-family:'DM Mono',monospace;font-size:.68rem;color:var(--text);
                  background:var(--bg);border:1px solid var(--border);border-radius:6px;
                  padding:.75rem;white-space:pre-wrap;max-height:300px;overflow-y:auto"
      >${output.join('\n')}</pre>
      <button onclick="copyCodesOutput()" style="margin-top:.5rem;font-size:.75rem;
              background:var(--surface);border:1px solid var(--border);color:var(--muted);
              padding:.35rem .75rem;border-radius:4px;cursor:pointer">
        Copiar códigos
      </button>`;

    window.copyCodesOutput = () => {
      navigator.clipboard.writeText(output.join('\n'));
    };
  } catch (err) {
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

// ── Realtime ─────────────────────────────────
function subscribeRealtime() {
  supabase
    .channel(`fac-room-${session.room_code}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'sessions',
      filter: `id=eq.${sessionId}`
    }, payload => {
      session = { ...session, ...payload.new };
      renderAll();
    })
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'groups',
      filter: `session_id=eq.${sessionId}`
    }, payload => {
      const idx = groups.findIndex(g => g.id === payload.new.id);
      if (idx !== -1) groups[idx] = { ...groups[idx], ...payload.new };
      renderGroupsGrid();
      renderDecisionProgress();
      updateAdvanceButton();
    })
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'players',
      filter: `session_id=eq.${sessionId}`
    }, payload => {
      const idx = players.findIndex(p => p.id === payload.new.id);
      if (idx !== -1) players[idx] = { ...players[idx], ...payload.new };
      else players.push(payload.new);
      renderGroupsGrid();
    })
    .subscribe();
}

// ── Helpers ──────────────────────────────────
function generateCode(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function copyRoomCode() {
  const code = document.getElementById('facRoomCode').textContent;
  navigator.clipboard.writeText(code).then(() => {
    document.getElementById('facRoomCode').textContent = '¡Copiado!';
    setTimeout(() => { document.getElementById('facRoomCode').textContent = code; }, 1500);
  });
}

function showScreen(id) {
  ['screenSetup','screenMain'].forEach(s => {
    document.getElementById(s).classList.toggle('mp-hidden', s !== id);
  });
}

init();
