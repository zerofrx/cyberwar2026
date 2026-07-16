// ══════════════════════════════════════════
// facilitator.js — Lógica del panel del facilitador
// ══════════════════════════════════════════

import { supabase }                              from './supabase-client.js';
import { STAGES, fmt, computeStage5State,
         computeEfficiencyScore, efficiencyStars,
         applyDecision, findTool, BUDGET_INIT,
         computeDecisionQualityBonus, efficiencyBreakdown } from './game-data.js?v=35';
import { buildLeaderboardTable }                  from './ranking.js?v=35';

const NUM_GROUPS  = 6;
const ROLES       = ['ciso', 'analyst', 'legal', 'comms', 'ops'];
const ROLE_LABELS = { ciso:'CISO', analyst:'ANALISTA', legal:'LEGAL', comms:'COMMS', ops:'OPS' };

let session  = null;
let groups   = [];
let players  = [];
let sessionId = null;

// localStorage puede lanzar SecurityError en navegadores/perfiles con
// almacenamiento restringido (modo privado, políticas de terceros, etc.) —
// sin este wrapper, el error rompe la carga de todo el módulo.
const safeStorage = {
  get(key)        { try { return localStorage.getItem(key); }    catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); }    catch {} },
  remove(key)     { try { localStorage.removeItem(key); }        catch {} }
};

// Recuperar sesión guardada del facilitador — por URL (para reabrir en otro
// dispositivo/pestaña) o, si no, por localStorage.
const urlSessionId    = new URLSearchParams(location.search).get('session');
const savedSessionId  = urlSessionId || safeStorage.get('fac_session_id');

// ── Init ─────────────────────────────────────
async function init() {
  document.getElementById('btnCreateSession').addEventListener('click', createSession);
  document.getElementById('btnStart').addEventListener('click', startSession);
  document.getElementById('btnAdvance').addEventListener('click', advanceStage);
  document.getElementById('btnFinish').addEventListener('click', async () => {
    const ok = await showConfirm(
      '¿Finalizar el simulacro?',
      'Se cerrará el juego y se mostrarán los resultados finales a todos los grupos. Esta acción no se puede deshacer.',
      'Finalizar'
    );
    if (ok) finishSession();
  });
  document.getElementById('btnReset').addEventListener('click', resetSession);
  document.getElementById('btnGenCodes').addEventListener('click', generateCodes);
  document.getElementById('facRoomCode').addEventListener('click', copyRoomCode);
  document.getElementById('overrideCheck').addEventListener('change', updateAdvanceButton);
  document.getElementById('btnPrelim').addEventListener('click', showPreliminary);
  document.getElementById('btnClosePrelim').addEventListener('click', () => {
    document.getElementById('prelimOverlay').classList.add('mp-hidden');
  });
  document.getElementById('btnBestPath').addEventListener('click', showBestPath);
  document.getElementById('btnCloseBestPath').addEventListener('click', () => {
    document.getElementById('bestPathOverlay').classList.add('mp-hidden');
  });
  document.getElementById('btnWinnerPath').addEventListener('click', showWinnerPath);
  document.getElementById('btnCloseWinnerPath').addEventListener('click', () => {
    document.getElementById('winnerPathOverlay').classList.add('mp-hidden');
  });

  // ── Atajos ─────────────────────────────────
  document.getElementById('btnOpenGuide').addEventListener('click', () => {
    window.open('guia.html', '_blank', 'noopener');
  });
  document.getElementById('btnOpenSplash').addEventListener('click', () => {
    window.open('splash.html', '_blank', 'noopener');
  });
  document.getElementById('btnOpenPlayer').addEventListener('click', () => {
    if (!groups?.length || !sessionId) return;
    const g = groups[0];
    window.open(`group.html?session=${sessionId}&group=${g.id}&role=ciso`, '_blank', 'noopener');
  });
  document.getElementById('btnOpenResults').addEventListener('click', () => {
    if (!sessionId) return;
    window.open(`results.html?session=${sessionId}`, '_blank', 'noopener');
  });
  document.getElementById('btnOpenLeaderboard').addEventListener('click', () => {
    if (!sessionId) return;
    window.open(`leaderboard.html?session=${sessionId}`, '_blank', 'noopener');
  });

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
    safeStorage.set('fac_session_id', sessionId);

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
    safeStorage.remove('fac_session_id');
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

// ── Modal de confirmación ────────────────────
function showConfirm(title, body, okLabel = 'Confirmar') {
  return new Promise(resolve => {
    const overlay   = document.getElementById('confirmModal');
    const okBtn     = document.getElementById('btnModalOk');
    const cancelBtn = document.getElementById('btnModalCancel');
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalBody').textContent  = body;
    okBtn.textContent = okLabel;
    overlay.classList.remove('mp-hidden');
    const done = (val) => {
      overlay.classList.add('mp-hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      overlay.onclick = null;
      resolve(val);
    };
    okBtn.onclick     = () => done(true);
    cancelBtn.onclick = () => done(false);
    overlay.onclick   = (e) => { if (e.target === overlay) done(false); };
  });
}

// ── Controles ────────────────────────────────
async function startSession() {
  if (!session) return;
  const nowIso = new Date().toISOString();
  await supabase.from('sessions')
    .update({ status: 'active', updated_at: nowIso })
    .eq('id', sessionId);
  // Arrancar cronómetro del Stage 1 en todos los grupos
  await supabase.from('groups')
    .update({ stage_start_at: nowIso, updated_at: nowIso })
    .eq('session_id', sessionId);
}

async function advanceStage() {
  if (!session) return;
  const next    = session.current_stage + 1;
  const isFinal = next > 4;

  // Ventana de confirmación antes de avanzar
  const active  = groups.filter(g => g.final_state !== 'game_over');
  const decided = active.filter(g => g.revealed).length;
  const ok = await showConfirm(
    isFinal ? '¿Finalizar el simulacro?' : `¿Avanzar a la etapa ${next + 1}?`,
    `${decided} de ${active.length} grupos han confirmado su decisión. ` +
    (isFinal
      ? 'Se cerrará el juego y se mostrarán los resultados finales a todos los grupos.'
      : 'El cronómetro de la nueva etapa arrancará para todos los grupos. Esta acción no se puede deshacer.'),
    isFinal ? 'Finalizar' : 'Avanzar →'
  );
  if (!ok) return;

  if (isFinal) {
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
        stage:           next,
        chosen_option:   null,
        revealed:        false,
        stage_start_at:  new Date().toISOString(),
        updated_at:      new Date().toISOString()
      })
      .in('id', activeGroupIds);
  }
}

async function finishSession() {
  await supabase.from('sessions')
    .update({ status: 'finished', updated_at: new Date().toISOString() })
    .eq('id', sessionId);
}

async function resetSession() {
  if (!confirm('¿Reiniciar la sesión? Esto borrará todo el progreso de todos los grupos.')) return;

  const btn = document.getElementById('btnReset');
  btn.disabled = true;
  btn.textContent = 'Reiniciando...';

  try {
    await supabase.from('sessions')
      .update({ status: 'lobby', current_stage: 0, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    for (const g of groups) {
      await supabase.from('groups')
        .update({
          name:          `Equipo ${g.slot}`,
          stage:         0,
          ctx:           'default',
          budget:        5000000,
          costs:         0,
          penalties:     0,
          hours:         0,
          reputation:    100,
          flags:         { backupsDestroyed: false, openedMonday: false, paidRansom: false,
                           silentCorp: false, laborLawsuit: false, licenseRevoked: false,
                           pendingPenalties: [] },
          decision_log:    [],
          notif_log:       [],
          chosen_option:   null,
          revealed:        false,
          final_state:     null,
          tools_owned:     [],
          stage_start_at:  null,
          stage_durations: {},
          efficiency_score: 100,
          updated_at:      new Date().toISOString()
        })
        .eq('id', g.id);
    }

    await loadGroups();
    renderAll();
  } catch (err) {
    console.error(err);
    alert('Error al reiniciar la sesión.');
  } finally {
    btn.disabled = false;
    btn.textContent = '↺ Reiniciar sesión';
  }
}

// ── Render ───────────────────────────────────
function renderAll() {
  renderStatus();
  renderStageDots();
  renderGroupsGrid();
  renderControls();
  renderDecisionProgress();
  renderResults();
}

// Refresh stage timer in group cards once per second
setInterval(() => {
  if (!groups || !session || session.status !== 'active') return;
  document.querySelectorAll('[data-group-elapsed]').forEach(el => {
    const gid = el.getAttribute('data-group-elapsed');
    const g   = groups.find(x => x.id === gid);
    if (g) el.textContent = '⏱ ' + formatStageElapsed(g);
  });
}, 1000);

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
  document.getElementById('btnPrelim').classList.toggle('mp-hidden', !isActive);
  document.getElementById('btnWinnerPath').classList.toggle('mp-hidden', !isFinished);
  document.getElementById('btnAdvance').classList.toggle('mp-hidden', !isActive);
  document.getElementById('btnFinish').classList.toggle('mp-hidden', isLobby || isFinished);
  document.getElementById('btnReset').classList.toggle('mp-hidden', isLobby && session.current_stage === 0);
  document.getElementById('overrideWrap').classList.toggle('mp-hidden', !isActive);
  document.getElementById('decisionProgress').classList.toggle('mp-hidden', !isActive);

  // Atajos
  document.getElementById('btnOpenPlayer').disabled      = !groups?.length;
  document.getElementById('btnOpenResults').disabled     = isLobby;
  document.getElementById('btnOpenLeaderboard').disabled = isLobby || !groups?.length;

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

    ${g.access_code ? `<div style="font-family:'DM Mono',monospace;font-size:.72rem;letter-spacing:.12em;color:var(--info)">${g.access_code}</div>` : ''}
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

    <div class="fac-bar-row">
      <div class="fac-bar-label">
        <span>Reputación</span>
        <span>${g.reputation ?? 100}%</span>
      </div>
      <div class="fac-bar-track">
        <div class="fac-bar-fill" style="width:${g.reputation ?? 100}%;background:${(g.reputation ?? 100) >= 70 ? '#4caf81' : (g.reputation ?? 100) >= 40 ? '#d4a843' : '#e05c5c'}"></div>
      </div>
    </div>

    <div class="fac-mini-row">
      <span title="Herramientas adquiridas">🛠 ${(g.tools_owned || []).length}</span>
      <span data-group-elapsed="${g.id}" title="Tiempo en el stage actual">⏱ ${formatStageElapsed(g)}</span>
    </div>

    <div class="fac-decision-state ${dsClass}">${dsText}</div>
  </div>`;
}

function formatStageElapsed(g) {
  if (!g.stage_start_at) return '--:--';
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(g.stage_start_at).getTime()) / 1000));
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ── Resultados finales ───────────────────────
function renderResults() {
  const section = document.getElementById('resultsSection');
  const grid    = document.getElementById('resultsGrid');
  const isFinished = session.status === 'finished';

  section.classList.toggle('mp-hidden', !isFinished);
  document.getElementById('groupsGrid').classList.toggle('mp-hidden', isFinished);
  document.getElementById('mainAreaTitle').classList.toggle('mp-hidden', isFinished);

  if (!isFinished) return;

  // Link de proyección
  document.getElementById('btnProject').href =
    `results.html?session=${sessionId}`;

  // Calcular resultado de cada grupo
  const ranked = groups.map(g => {
    const flags = g.flags || {};
    let budgetFinal = g.budget;
    let penFinal    = g.penalties || 0;
    (flags.pendingPenalties || []).forEach(p => { budgetFinal -= p.amount; penFinal += p.amount; });

    const state   = g.final_state === 'game_over'
      ? { ctx: 'X', label: 'ELIMINADO' }
      : computeStage5State(flags, budgetFinal, penFinal, g.hours, g.reputation ?? 100);

    const log     = g.decision_log || [];
    const correct = log.filter(e => e.type === 'correct').length;
    const traps   = log.filter(e => e.type === 'trap').length;

    return { ...g, budgetFinal, penFinal, state, correct, traps, log };
  }).sort((a, b) => {
    const order = { A:0, B:1, C:2, D:3, X:4 };
    const diff  = (order[a.state.ctx] ?? 4) - (order[b.state.ctx] ?? 4);
    return diff !== 0 ? diff : b.budgetFinal - a.budgetFinal;
  });

  const ctxColors = { A:'var(--success)', B:'var(--info)', C:'var(--gold)', D:'var(--accent)', X:'var(--muted)' };
  const ctxLabels = {
    A: 'GESTIÓN EXITOSA',
    B: 'GESTIÓN ACEPTABLE',
    C: 'GESTIÓN DEFICIENTE',
    D: 'COLAPSO INSTITUCIONAL',
    X: 'ELIMINADO'
  };
  const medals = ['🥇','🥈','🥉','4°','5°','6°'];

  grid.innerHTML = ranked.map((g, i) => {
    const color = ctxColors[g.state.ctx] || 'var(--muted)';
    return `
    <div class="fac-result-card" style="border-color:${color}">
      <div class="fac-result-rank">${medals[i]}</div>
      <div class="fac-result-body">
        <div class="fac-result-name">${g.name}</div>
        <div class="fac-result-outcome" style="color:${color}">${ctxLabels[g.state.ctx]}</div>
        <div class="fac-result-stats">
          <span class="fac-result-stat">💰 ${fmt(g.budgetFinal)}</span>
          <span class="fac-result-stat">⏱ ${g.hours}h usadas</span>
          <span class="fac-result-stat" style="color:var(--success)">✓ ${g.correct} óptimas</span>
          <span class="fac-result-stat" style="color:var(--accent)">✗ ${g.traps} trampas</span>
        </div>
        <div class="fac-result-log">
          ${g.log.map(e => `<span class="fac-log-chip fac-log-${e.type}" title="${e.text}">S${e.stage} ${e.letter}</span>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── El mejor camino ───────────────────────────
// Ruta óptima curada a mano (opción correcta más barata/rápida en cada
// bifurcación, más las herramientas que hay que comprar y cuándo para
// maximizar el bonus de costo/horas y el bonus de anticipación).
const BEST_PATH = [
  {
    stageIdx: 0, optIdx: 2, buyTools: ['edr', 'siem', 'memforensics', 'backupverify'],
    why: 'Es la única opción que aísla los sistemas afectados y preserva evidencia forense (imagen de RAM) antes de tocar nada. Las otras cuatro destruyen la evidencia (Antivirus Express), causan un apagón injustificado y carísimo (Apagón Preventivo), o gastan tiempo y dinero en servicios externos antes de tener siquiera un diagnóstico (Línea de Crisis, MDR). Sin contener primero, cualquier decisión posterior parte de una posición peor y más cara. El Sandbox de Análisis también respalda esta decisión (confirma la familia del malware), pero en esta ruta se deja sin comprar por la misma razón que el Negociador de la Etapa 2: no se paga solo.'
  },
  {
    stageIdx: 1, optIdx: 2, buyTools: [],
    why: 'Un equipo de Incident Response congela el reloj de extorsión y estabiliza el Core sin pagar un centavo. Restaurar backups (A) es una trampa si el ransomware sigue activo en la red: cifra también el respaldo. Pagar el rescate (D) es ilegal y termina en una segunda extorsión. Emitir un comunicado (E) sin saber qué se filtró provoca una corrida bancaria. Ganar tiempo primero es lo que permite responder con información en vez de pánico. El Threat Intel Feed y el Negociador Externo dan bonus aquí, pero ninguno de los dos se paga solo con lo que ahorran — ese presupuesto rinde más en la Etapa 3.'
  },
  {
    stageIdx: 2, optIdx: 2, buyTools: ['threathunt', 'credrotation'],
    why: 'La decisión principal es activar el protocolo SGSI: mensajes preaprobados para regulador, prensa y clientes, cumple el plazo del BCP y mejora la reputación (repCost −5) — más barato y rápido que dedicar el esfuerzo del equipo a Threat Hunting Activo (opción D, también correcta pero $250k y 18h en vez de $180k y 6h). Pero comprar herramientas no consume horas del reloj, así que en paralelo se contrata Threat Hunting Especializado y se fuerza una Rotación de Credenciales Privilegiadas — el vector de entrada fue justamente una cuenta con permisos elevados, así que sin rotar esas credenciales el atacante puede volver a entrar con las mismas llaves aunque el malware ya esté eliminado. Restaurar sistemas en la Etapa 4 sin haber erradicado accesos persistentes es exactamente el error que el Parche Suicida (Etapa 4, opción D) castiga con GAME OVER.'
  },
  {
    stageIdx: 3, optIdx: 1, buyTools: ['legalbcp'],
    why: 'La restauración completa del Core toma 36h y solo quedan 24 antes de la apertura obligatoria del lunes: no hay forma de abrir a tiempo sin degradar servicio. El DRP al 60% es la única ruta que logra abrir el lunes, lo cual define el piso del resultado final. Gracias a haber comprado Threat Hunting y Rotación de Credenciales en la Etapa 3 (además de la Verificación de Backups de la Etapa 1), esta decisión llega con el bonus completo de herramientas: la red está confirmada limpia y sin credenciales robadas antes de reconectar nada. Script Milagroso, Recovery Broker y Parche Suicida son trampas que corrompen datos, estafan al banco o pueden terminar en colapso total; Threat Hunting Tardío es técnicamente impecable pero llega literalmente sin tiempo para recuperar nada.'
  },
  {
    stageIdx: 4, optIdx: 1, buyTools: [],
    why: 'Presentar el informe completo de transparencia ante el regulador reduce la multa a $0 en los estados LEVE/MEDIO (y limita el daño incluso en estados peores). La Asesoría Legal BCP comprada en la Etapa 4 ya respalda esta decisión con parte del bonus de herramientas; sumar Crisis Communications Firm ($300k) daría el bonus completo, pero ese gasto extra es justo lo que empuja el presupuesto total sobre el 55% y degrada el resultado de LEVE a MEDIO — se prioriza el documento legal formal, que es lo que el regulador exige. Buscar un chivo expiatorio o prometer inversiones sin evidencia agrava las sanciones cuando el regulador lo descubre; ocultar información u obstruir la investigación son las dos únicas formas de terminar con la licencia revocada.'
  },
];

// Nota: tres compras que SÍ dan bonus de costo/tiempo se dejan fuera a propósito
// porque no se pagan solas — Negociador Externo ($500k, Etapa 2), Sandbox de
// Análisis ($80k, Etapa 1) y Crisis Communications Firm ($300k, Etapa 5). Cada
// una, sumada al resto, empuja el gasto total por encima del 55% del
// presupuesto — el umbral que separa el estado LEVE del MEDIO en
// computeStage5State(). En cambio Threat Hunting Especializado y Rotación de
// Credenciales Privilegiadas SÍ entran, aunque cuestan más juntas ($550k),
// porque respaldan la Etapa 4 (DRP) y representan el paso de erradicación que
// un IR real no puede saltarse antes de reconectar sistemas recuperados.

function simulateBestPath() {
  let state = {
    budget: BUDGET_INIT, costs: 0, penalties: 0, hours: 0, reputation: 100,
    flags: { pendingPenalties: [] }, decision_log: [], notif_log: [],
    ctx: 'default', tools_owned: []
  };
  const steps = [];

  for (const step of BEST_PATH) {
    const boughtTools = step.buyTools.map(id => findTool(id)).filter(Boolean);
    for (const tool of boughtTools) {
      state.budget -= tool.cost;
      state.costs  += tool.cost;
      state.tools_owned = [...state.tools_owned, { id: tool.id, stage: step.stageIdx }];
    }
    const opt = STAGES[step.stageIdx].options[step.optIdx];
    const result = applyDecision(state, step.stageIdx, step.optIdx);
    steps.push({
      stage: STAGES[step.stageIdx], opt, boughtTools, why: step.why,
      effectiveCost: result.effectiveCost, effectiveHours: result.effectiveHours
    });
    state = {
      ...state,
      budget: result.budget, costs: result.costs, penalties: result.penalties,
      hours: result.hours, reputation: result.reputation, flags: result.flags,
      decision_log: result.decision_log, notif_log: result.notif_log,
      ctx: result.nextCtx
    };
  }

  // Resolución final (idéntica a la de group.js showFinal)
  let budgetFinal = state.budget;
  let penFinal    = state.penalties;
  (state.flags.pendingPenalties || []).forEach(p => { budgetFinal -= p.amount; penFinal += p.amount; });
  const finalState = computeStage5State(state.flags, budgetFinal, penFinal, state.hours, state.reputation);
  budgetFinal -= finalState.extraPenalties;
  penFinal    += finalState.extraPenalties;

  const effBreakdown = efficiencyBreakdown({}, state.tools_owned, state.decision_log);
  const stars        = efficiencyStars(effBreakdown.total);
  const quality       = computeDecisionQualityBonus(state.decision_log);

  return { steps, state, budgetFinal, penFinal, finalState, effBreakdown, stars, quality };
}

function showBestPath() {
  const overlay = document.getElementById('bestPathOverlay');
  const sim = simulateBestPath();

  const summaryEl = document.getElementById('bestPathSummary');
  const starsHtml = Array.from({ length: 5 },
    (_, i) => `<span style="color:${i < sim.stars ? 'var(--gold)' : 'var(--border)'}">★</span>`).join('');
  summaryEl.innerHTML = `
    <div class="prelim-section-label">// DESENLACE SI SE SIGUE ESTA RUTA EN TODAS LAS ETAPAS</div>
    <div class="bp-summary">
      <div class="prelim-stat">
        <span class="prelim-stat-label">ESTADO FINAL</span>
        <span class="prelim-stat-val" style="color:var(--success)">${sim.finalState.label}</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">PRESUPUESTO RESTANTE</span>
        <span class="prelim-stat-val" style="color:var(--success)">${fmt(sim.budgetFinal)}</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">MULTAS/PENALIZACIONES</span>
        <span class="prelim-stat-val">${fmt(sim.penFinal)}</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">REPUTACIÓN FINAL</span>
        <span class="prelim-stat-val">${sim.finalState.finalReputation}%</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">HORAS USADAS</span>
        <span class="prelim-stat-val">${sim.state.hours}h / 72h</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">EFICIENCIA</span>
        <span class="prelim-stat-val">${starsHtml} (${sim.effBreakdown.total})</span>
      </div>
    </div>
    <div class="prelim-narrative prelim-narrative-muted">
      Esta ruta combina en cada etapa la opción marcada como <strong>CORRECTA</strong> más barata y rápida entre
      las disponibles, equipada con las herramientas que respaldan esa decisión — salvo Negociador Externo,
      Sandbox de Análisis y Crisis Communications Firm, cuyo costo combinado empujaría el gasto total sobre
      el 55% del presupuesto y degradaría el resultado de LEVE a MEDIO. Threat Hunting Especializado y
      Rotación de Credenciales Privilegiadas sí se compran en la Etapa 3 — sin consumir horas del reloj — para
      erradicar accesos persistentes y credenciales robadas <em>antes</em> de reconectar sistemas en la
      Etapa 4, el paso que en un incidente real nadie puede saltarse. El "por qué" de cada paso está debajo
      de cada tarjeta.
    </div>`;

  const stepsEl = document.getElementById('bestPathSteps');
  stepsEl.innerHTML = `<div class="prelim-section-label">// DECISIONES Y HERRAMIENTAS, EN ORDEN</div>` +
    sim.steps.map(s => {
      // Distinguir herramientas que dan bonus a ESTA decisión de las que se
      // compran aquí solo porque se revelan en esta etapa, para un bonus en
      // una etapa futura (p.ej. Legal BCP comprado en la Etapa 4 para la
      // Etapa 5) — mezclar ambas bajo "comprar antes de decidir" confunde.
      const required   = s.opt.correctTools || [];
      const forThisOne = s.boughtTools.filter(t => required.includes(t.id));
      const forLater   = s.boughtTools.filter(t => !required.includes(t.id));
      const toolsLines = [];
      if (forThisOne.length) toolsLines.push(`🛠 Respaldan esta decisión: ${forThisOne.map(t => t.name).join(', ')}`);
      if (forLater.length)   toolsLines.push(`⏩ Se compran aquí para usarlas en una etapa siguiente: ${forLater.map(t => t.name).join(', ')}`);
      const toolsHtml = toolsLines.length
        ? toolsLines.join('<br>')
        : `🛠 No se necesita comprar herramientas nuevas en esta etapa`;
      return `
        <div class="bp-step">
          <div class="bp-step-head">
            <span class="bp-step-stage">${s.stage.label} · ${s.stage.title}</span>
            <span class="bp-step-cost">${fmt(s.effectiveCost)} · +${s.effectiveHours}h</span>
          </div>
          <div class="bp-step-title">Opción ${s.opt.letter} — ${s.opt.text}</div>
          <div class="bp-step-sub">${s.opt.sub}</div>
          <div class="bp-step-tools">${toolsHtml}</div>
          <div class="bp-step-why"><span class="bp-step-why-label">// POR QUÉ ES LA MEJOR OPCIÓN</span>${s.why}</div>
        </div>`;
    }).join('');

  overlay.classList.remove('mp-hidden');
}

// ── El camino del ganador ─────────────────────
// Reconstruye, a partir de decision_log/tools_owned, exactamente lo que hizo
// el equipo que terminó primero — con la misma explicación (consequence) que
// el juego les mostró tras cada decisión, para poder contrastarla con
// "el mejor camino" en la revisión post-simulacro.
function determineWinner() {
  if (!groups?.length) return null;
  const ranked = groups.map(g => {
    const flags = g.flags || {};
    let budgetFinal = g.budget;
    let penFinal    = g.penalties || 0;
    (flags.pendingPenalties || []).forEach(p => { budgetFinal -= p.amount; penFinal += p.amount; });
    const state = g.final_state === 'game_over'
      ? { ctx: 'X', label: 'ELIMINADO', finalReputation: g.reputation ?? 0 }
      : computeStage5State(flags, budgetFinal, penFinal, g.hours, g.reputation ?? 100);
    return { ...g, budgetFinal, penFinal, state };
  }).sort((a, b) => {
    const order = { A:0, B:1, C:2, D:3, X:4 };
    const diff  = (order[a.state.ctx] ?? 4) - (order[b.state.ctx] ?? 4);
    return diff !== 0 ? diff : b.budgetFinal - a.budgetFinal;
  });
  return ranked[0] || null;
}

const VERDICT_LABEL = { correct: '✓ CORRECTA', ok: '≈ TARDÍA', trap: '✗ TRAMPA' };

function showWinnerPath() {
  const overlay   = document.getElementById('winnerPathOverlay');
  const winner    = determineWinner();
  const summaryEl = document.getElementById('winnerPathSummary');
  const stepsEl   = document.getElementById('winnerPathSteps');

  if (!winner || !(winner.decision_log || []).length) {
    document.getElementById('winnerPathLabel').textContent = 'Camino del Ganador';
    summaryEl.innerHTML = `
      <div class="prelim-section-label">// SIN DATOS</div>
      <div class="prelim-narrative prelim-narrative-muted">
        Todavía no hay decisiones registradas para mostrar el camino del equipo ganador.
      </div>`;
    stepsEl.innerHTML = '';
    overlay.classList.remove('mp-hidden');
    return;
  }

  document.getElementById('winnerPathLabel').textContent = `🥇 ${winner.name}`;

  const log     = winner.decision_log || [];
  const correct = log.filter(e => e.type === 'correct').length;
  const traps   = log.filter(e => e.type === 'trap').length;
  const effBreakdown = efficiencyBreakdown(winner.stage_durations || {}, winner.tools_owned || [], log);
  const stars   = efficiencyStars(effBreakdown.total);
  const starsHtml = Array.from({ length: 5 },
    (_, i) => `<span style="color:${i < stars ? 'var(--gold)' : 'var(--border)'}">★</span>`).join('');

  summaryEl.innerHTML = `
    <div class="prelim-section-label">// LO QUE LOGRÓ ${winner.name.toUpperCase()}</div>
    <div class="bp-summary">
      <div class="prelim-stat">
        <span class="prelim-stat-label">ESTADO FINAL</span>
        <span class="prelim-stat-val" style="color:var(--gold)">${winner.state.label}</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">PRESUPUESTO RESTANTE</span>
        <span class="prelim-stat-val" style="color:var(--gold)">${fmt(winner.budgetFinal)}</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">MULTAS/PENALIZACIONES</span>
        <span class="prelim-stat-val">${fmt(winner.penFinal)}</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">REPUTACIÓN FINAL</span>
        <span class="prelim-stat-val">${winner.state.finalReputation ?? winner.reputation ?? 100}%</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">HORAS USADAS</span>
        <span class="prelim-stat-val">${winner.hours}h / 72h</span>
      </div>
      <div class="prelim-stat">
        <span class="prelim-stat-label">EFICIENCIA</span>
        <span class="prelim-stat-val">${starsHtml} (${effBreakdown.total})</span>
      </div>
    </div>
    <div class="prelim-narrative prelim-narrative-muted">
      ${winner.name} ganó con ${correct} decisión${correct === 1 ? '' : 'es'} correcta${correct === 1 ? '' : 's'}
      y ${traps} trampa${traps === 1 ? '' : 's'} de ${log.length} decisiones totales. Cada tarjeta abajo
      muestra exactamente lo que eligieron y la explicación que el juego les dio en ese momento — comparen
      esto contra "★ Ver el mejor camino" para ver dónde ganaron terreno o dónde tuvieron suerte.
    </div>`;

  stepsEl.innerHTML = `<div class="prelim-section-label">// DECISIONES REALES, EN ORDEN</div>` +
    log.map(e => {
      const stage = STAGES[e.stage - 1];
      const opt   = stage?.options?.find(o => o.letter === e.letter);
      if (!opt) return '';
      const toolsAtStage = (winner.tools_owned || [])
        .filter(t => typeof t === 'object' && t && t.stage === e.stage - 1)
        .map(t => findTool(t.id)).filter(Boolean);
      const toolsHtml = toolsAtStage.length
        ? `🛠 Herramientas con las que llegaron a esta decisión: ${toolsAtStage.map(t => t.name).join(', ')}`
        : `🛠 No habían comprado herramientas nuevas para esta etapa`;
      const verdictCls = e.type === 'correct' ? 'bp-step-verdict-correct'
                        : e.type === 'ok'      ? 'bp-step-verdict-ok' : 'bp-step-verdict-trap';
      const stepCls = e.type === 'correct' ? '' : e.type === 'ok' ? 'bp-step-ok' : 'bp-step-trap';
      return `
        <div class="bp-step ${stepCls}">
          <div class="bp-step-head">
            <span class="bp-step-stage">${stage.label} · ${stage.title}</span>
            <span class="bp-step-cost">${fmt(e.cost)} · +${e.hours}h</span>
          </div>
          <div class="bp-step-title">
            Opción ${opt.letter} — ${opt.text}
            <span class="bp-step-verdict ${verdictCls}" style="margin-left:.5rem">${VERDICT_LABEL[e.type] || opt.typeLabel}</span>
          </div>
          <div class="bp-step-sub">${opt.sub}</div>
          <div class="bp-step-tools">${toolsHtml}</div>
          <div class="bp-step-why"><span class="bp-step-why-label">// QUÉ PASÓ</span>${opt.consequence}</div>
        </div>`;
    }).join('');

  overlay.classList.remove('mp-hidden');
}

// ── Resultados preliminares ──────────────────
function showPreliminary() {
  const overlay    = document.getElementById('prelimOverlay');
  const stageIdx   = session.current_stage;
  const curStage   = STAGES[stageIdx];
  const nextStage  = STAGES[stageIdx + 1];

  // Label de etapa actual
  document.getElementById('prelimStageLabel').textContent =
    `${curStage.label} — ${curStage.title}`;

  // Determinar líder por ctx → budget (sin mostrar nombre)
  const ctxOrder = { A:0, B:1, C:2, D:3, default:1 };
  const active = groups.filter(g => g.final_state !== 'game_over');
  const ranked = [...active].sort((a, b) => {
    const diff = (ctxOrder[a.ctx] ?? 1) - (ctxOrder[b.ctx] ?? 1);
    if (diff !== 0) return diff;
    const aB = a.budget - (a.flags?.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
    const bB = b.budget - (b.flags?.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
    return bB - aB;
  });
  const leader = ranked[0];

  // ── Historia del equipo líder ─────────────
  const leaderEl = document.getElementById('prelimLeaderStory');
  if (leader) {
    const lCtx      = (leader.ctx && leader.ctx !== 'default') ? leader.ctx : 'A';
    const variant   = curStage.variants?.[lCtx] ?? curStage.variants?.['default'];
    const narrative = variant?.narrative || curStage.status;
    const rep       = leader.reputation ?? 100;
    const repColor  = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--gold)' : 'var(--accent)';
    const budgetFinal = leader.budget -
      (leader.flags?.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
    const budgetColor = budgetFinal > 3000000 ? 'var(--success)'
                      : budgetFinal > 1500000 ? 'var(--gold)' : 'var(--accent)';

    leaderEl.innerHTML = `
      <div class="prelim-section-label">// SITUACIÓN DEL EQUIPO LÍDER</div>
      <div class="prelim-narrative">${narrative}</div>
      <div class="prelim-leader-stats">
        <div class="prelim-stat">
          <span class="prelim-stat-label">PRESUPUESTO</span>
          <span class="prelim-stat-val" style="color:${budgetColor}">${fmt(budgetFinal)}</span>
        </div>
        <div class="prelim-stat">
          <span class="prelim-stat-label">REPUTACIÓN</span>
          <span class="prelim-stat-val" style="color:${repColor}">${rep}%</span>
        </div>
        <div class="prelim-stat">
          <span class="prelim-stat-label">HORAS</span>
          <span class="prelim-stat-val">${leader.hours}h / 72h</span>
        </div>
      </div>`;
  } else {
    leaderEl.innerHTML = '';
  }

  // ── Tabla de ranking detallada ─────────────
  const lbEl = document.getElementById('prelimLeaderboard');
  if (lbEl) {
    lbEl.innerHTML = `
      <div class="prelim-divider"></div>
      <div class="prelim-section-label">// CLASIFICACIÓN — STAGE ${stageIdx + 1} DE ${STAGES.length}</div>
      ${buildLeaderboardTable(groups, 'detailed', stageIdx + 1)}`;
  }

  // ── Teaser de la siguiente etapa ──────────
  const nextEl = document.getElementById('prelimNextStage');
  if (nextStage) {
    const nextVariant = nextStage.variants?.A;
    nextEl.innerHTML = `
      <div class="prelim-divider"></div>
      <div class="prelim-section-label">// SE APROXIMA — ${nextStage.label}</div>
      <div class="prelim-next-time">${nextStage.timestamp}</div>
      <div class="prelim-next-title">${nextStage.title}</div>
      ${nextVariant ? `<div class="prelim-narrative prelim-narrative-muted">${nextVariant.narrative}</div>` : ''}`;
  } else {
    nextEl.innerHTML = `
      <div class="prelim-divider"></div>
      <div class="prelim-section-label">// SIGUIENTE — ETAPA FINAL</div>
      <div class="prelim-next-title">El Día de Cuentas</div>
      <div class="prelim-narrative">Cada decisión define el desenlace. El BCP está listo para evaluar a Banco Meridian.</div>`;
  }

  // ── Tarjetas de grupos (orden por slot, sin posición) ──
  const gridEl = document.getElementById('prelimGroupsGrid');
  const sorted = [...groups].sort((a, b) => a.slot - b.slot);
  gridEl.innerHTML = sorted.map(g => {
    if (g.final_state === 'game_over') {
      return `<div class="prelim-group-card prelim-gameover">
        <div class="prelim-group-name">${g.name}</div>
        <div style="font-family:'DM Mono',monospace;font-size:.62rem;letter-spacing:.1em;color:var(--muted)">ELIMINADO</div>
      </div>`;
    }
    const flags      = g.flags || {};
    const budgetFin  = g.budget - (flags.pendingPenalties || []).reduce((s, p) => s + p.amount, 0);
    const budgetPct  = Math.max(0, (budgetFin / 5000000) * 100);
    const hoursPct   = Math.min(100, (g.hours / 72) * 100);
    const rep        = g.reputation ?? 100;
    const repColor   = rep >= 70 ? 'var(--success)' : rep >= 40 ? 'var(--gold)' : 'var(--accent)';
    const budColor   = budgetPct > 60 ? 'var(--success)' : budgetPct > 30 ? 'var(--gold)' : 'var(--accent)';
    const log        = g.decision_log || [];
    const chips      = log.map(e =>
      `<span class="prelim-chip prelim-chip-${e.type}" title="S${e.stage} ${e.letter}: ${e.text}">S${e.stage} ${e.letter}</span>`
    ).join('');

    return `<div class="prelim-group-card">
      <div class="prelim-group-name">${g.name}</div>
      <div class="prelim-bar-row">
        <span class="prelim-bar-label">Presupuesto</span>
        <span class="prelim-bar-val" style="color:${budColor}">${fmt(budgetFin)}</span>
      </div>
      <div class="prelim-bar-track">
        <div class="prelim-bar-fill" style="width:${budgetPct}%;background:${budColor}"></div>
      </div>
      <div class="prelim-bar-row">
        <span class="prelim-stat-label-sm">Reputación</span>
        <span class="prelim-bar-val" style="color:${repColor}">${rep}%</span>
      </div>
      <div class="prelim-bar-track">
        <div class="prelim-bar-fill" style="width:${rep}%;background:${repColor}"></div>
      </div>
      <div class="prelim-bar-row">
        <span class="prelim-bar-label">Horas</span>
        <span class="prelim-bar-val">${g.hours}h</span>
      </div>
      <div class="prelim-bar-track">
        <div class="prelim-bar-fill" style="width:${hoursPct}%;background:var(--info)"></div>
      </div>
      ${chips ? `<div class="prelim-chips">${chips}</div>` : ''}
    </div>`;
  }).join('');

  overlay.classList.remove('mp-hidden');
}

// ── Generar códigos de acceso ─────────────────
// 1 código por grupo — todos los miembros del grupo comparten el mismo código
async function generateCodes() {
  if (!session) return;
  const btn = document.getElementById('btnGenCodes');
  btn.disabled = true;

  try {
    const output = [];

    for (const g of groups) {
      const code = generateCode(6);
      // Asignar el código al grupo
      await supabase.from('groups')
        .update({ access_code: code })
        .eq('id', g.id);
      g.access_code = code;
      output.push(`${g.name}: ${code}`);
    }

    // Recargar groups con los códigos
    const { data: grps } = await supabase
      .from('groups').select('*').eq('session_id', sessionId).order('slot');
    groups = grps || [];
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
