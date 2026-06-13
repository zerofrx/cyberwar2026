// ══════════════════════════════════════════
// leaderboard.js — Vista pública de ranking en tiempo real
// ══════════════════════════════════════════

import { supabase }                                      from './supabase-client.js';
import { STAGES }                                        from './game-data.js?v=18';
import { buildLeaderboardTable }                         from './ranking.js?v=18';

// ── Parsear sesión ───────────────────────────
const params    = new URLSearchParams(location.search);
const SESSION_ID = params.get('session');

if (!SESSION_ID) {
  document.getElementById('lbContainer').innerHTML =
    '<div class="lb-loading">Falta el parámetro <code>?session=...</code> en la URL.</div>';
  document.getElementById('lbStatus').textContent = 'ERROR DE PARÁMETROS';
  throw new Error('no session id');
}

let session = null;
let groups  = [];

// ── Render con animación FLIP (las filas que cambian de posición se deslizan) ──
function render() {
  if (!session) return;
  const stageIdx = session.current_stage ?? 0;

  // Status header
  const status = session.status === 'lobby'
    ? 'EN ESPERA · LOBBY'
    : session.status === 'finished'
    ? 'CLASIFICACIÓN FINAL'
    : `STAGE ${stageIdx + 1} DE ${STAGES.length}`;
  document.getElementById('lbStatus').textContent = status;

  // Tabla pública
  const container = document.getElementById('lbContainer');
  if (!groups.length) {
    container.innerHTML = '<div class="lb-loading">Sin grupos activos.</div>';
    return;
  }

  // FIRST: capturar posiciones actuales por grupo
  const before = {};
  container.querySelectorAll('.lb-row[data-gid]').forEach(row => {
    before[row.dataset.gid] = row.getBoundingClientRect().top;
  });

  container.innerHTML = buildLeaderboardTable(groups, 'public', stageIdx + 1);

  // LAST + INVERT + PLAY: deslizar las filas que se movieron
  container.querySelectorAll('.lb-row[data-gid]').forEach(row => {
    const prevTop = before[row.dataset.gid];
    if (prevTop === undefined) return;
    const delta = prevTop - row.getBoundingClientRect().top;
    if (Math.abs(delta) < 2) return;
    row.style.transform  = `translateY(${delta}px)`;
    row.style.transition = 'none';
    requestAnimationFrame(() => {
      row.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)';
      row.style.transform  = '';
      if (delta > 0) {
        // Subió de posición → destello dorado
        row.classList.add('lb-row-overtake');
        row.addEventListener('transitionend', () => row.classList.remove('lb-row-overtake'), { once: true });
      }
    });
  });
}

// ── Init ─────────────────────────────────────
async function init() {
  // Fetch inicial
  const [sessionRes, groupsRes] = await Promise.all([
    supabase.from('sessions').select('*').eq('id', SESSION_ID).single(),
    supabase.from('groups').select('*').eq('session_id', SESSION_ID).order('slot')
  ]);

  if (sessionRes.error || !sessionRes.data) {
    document.getElementById('lbContainer').innerHTML =
      '<div class="lb-loading">Sesión no encontrada.</div>';
    document.getElementById('lbStatus').textContent = 'SESIÓN INVÁLIDA';
    return;
  }

  session = sessionRes.data;
  groups  = groupsRes.data || [];
  render();

  // Realtime: cambios en sessions
  supabase
    .channel(`lb-session-${SESSION_ID}`)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions',
        filter: `id=eq.${SESSION_ID}` },
      (payload) => {
        session = { ...session, ...payload.new };
        render();
      })
    .subscribe();

  // Realtime: cambios en groups
  supabase
    .channel(`lb-groups-${SESSION_ID}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'groups',
        filter: `session_id=eq.${SESSION_ID}` },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          groups = groups.map(g => g.id === payload.new.id ? { ...g, ...payload.new } : g);
        } else if (payload.eventType === 'INSERT') {
          groups = [...groups, payload.new].sort((a, b) => a.slot - b.slot);
        } else if (payload.eventType === 'DELETE') {
          groups = groups.filter(g => g.id !== payload.old.id);
        }
        render();
      })
    .subscribe();
}

init();
