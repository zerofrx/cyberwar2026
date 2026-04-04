-- ══════════════════════════════════════════
-- CyberWar2026 — Schema Supabase
-- ══════════════════════════════════════════

-- sessions: una fila por sala activa
CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code     CHAR(4) NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'lobby',   -- lobby | active | finished
  current_stage INT  NOT NULL DEFAULT 0,          -- 0–4, controlado por el facilitador
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- groups: una fila por equipo (6 equipos de 5 personas)
CREATE TABLE IF NOT EXISTS groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  slot         INT  NOT NULL,                    -- 1–6
  name         TEXT NOT NULL DEFAULT 'Equipo',

  -- Nombres de los miembros (personalizan la narrativa)
  member_ciso     TEXT DEFAULT '',
  member_analyst  TEXT DEFAULT '',
  member_legal  TEXT DEFAULT '',
  member_comms  TEXT DEFAULT '',
  member_ops    TEXT DEFAULT '',

  -- Código compartido por todos los miembros del grupo (generado por el facilitador)
  access_code   TEXT UNIQUE,

  -- Estado del juego (espejo del objeto G)
  stage         INT    NOT NULL DEFAULT 0,
  ctx           TEXT   NOT NULL DEFAULT 'default',
  budget        BIGINT NOT NULL DEFAULT 5000000,
  costs         BIGINT NOT NULL DEFAULT 0,
  penalties     BIGINT NOT NULL DEFAULT 0,
  hours         INT    NOT NULL DEFAULT 0,

  -- Estado de decisión de la etapa actual
  chosen_option INT    DEFAULT NULL,             -- índice 0–4, null = sin elegir
  revealed      BOOLEAN NOT NULL DEFAULT false,  -- consecuencia mostrada

  -- Flags de ramificación (todos como JSONB para flexibilidad)
  flags         JSONB NOT NULL DEFAULT '{
    "backupsDestroyed": false,
    "openedMonday": false,
    "paidRansom": false,
    "laborLawsuit": false,
    "silentCorp": false,
    "licenseRevoked": false,
    "pendingPenalties": []
  }',

  -- Historial completo
  decision_log  JSONB NOT NULL DEFAULT '[]',
  notif_log     JSONB NOT NULL DEFAULT '[]',

  -- Resultado final
  final_state   TEXT  DEFAULT NULL,              -- LEVE | MEDIO | GRAVE | CRÍTICO
  final_budget  BIGINT DEFAULT NULL,

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(session_id, slot)
);

-- players: una fila por persona conectada a un grupo
-- Todos los miembros del grupo comparten el mismo access_code (en groups.access_code)
-- La clave única es (group_id, role) — un rol por grupo
CREATE TABLE IF NOT EXISTS players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  group_id     UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,                    -- ciso | analyst | legal | comms | ops
  display_name TEXT DEFAULT '',
  is_online    BOOLEAN NOT NULL DEFAULT false,
  last_seen    TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, role)
);

-- ── Índices ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_groups_session  ON groups(session_id);
CREATE INDEX IF NOT EXISTS idx_players_group   ON players(group_id);
CREATE INDEX IF NOT EXISTS idx_players_session ON players(session_id);
CREATE INDEX IF NOT EXISTS idx_players_code    ON players(access_code);
CREATE INDEX IF NOT EXISTS idx_sessions_code   ON sessions(room_code);

-- ── Row Level Security ───────────────────────
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE players  ENABLE ROW LEVEL SECURITY;

-- Lectura pública (room_code es el control de acceso)
CREATE POLICY "sessions_select" ON sessions FOR SELECT USING (true);
CREATE POLICY "groups_select"   ON groups   FOR SELECT USING (true);
CREATE POLICY "players_select"  ON players  FOR SELECT USING (true);

-- Escritura pública (la seguridad está en la lógica de la aplicación)
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_insert"   ON groups   FOR INSERT WITH CHECK (true);
CREATE POLICY "players_insert"  ON players  FOR INSERT WITH CHECK (true);

CREATE POLICY "sessions_update" ON sessions FOR UPDATE USING (true);
CREATE POLICY "groups_update"   ON groups   FOR UPDATE USING (true);
CREATE POLICY "players_update"  ON players  FOR UPDATE USING (true);

-- ── Realtime ─────────────────────────────────
-- Ejecutar en el SQL Editor de Supabase:
-- ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE groups;
-- ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- ── Función: generar código de sala ──────────
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', ceil(random()*32)::int, 1), ''
  )
  FROM generate_series(1, 4);
$$;

-- ── Función: generar código de acceso de jugador ──
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', ceil(random()*32)::int, 1), ''
  )
  FROM generate_series(1, 6);
$$;
