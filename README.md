# CyberWar 2026

Simulacro de crisis cibernética bancaria multijugador para uso en aula. 6 grupos de 5 personas toman decisiones en tiempo real ante un ataque de ransomware. El facilitador controla el ritmo desde su propio panel y proyecta los resultados al final.

---

## Estructura del proyecto

```
cyberwar2026/
│
├── gm.html              # Modo single-player (sin cambios)
├── gm.js                # Lógica del modo single-player (sin cambios)
├── gm.css               # Estilos base del juego (compartido)
│
├── index.html           # Login de participantes
├── group.html           # Pantalla del jugador (por rol)
├── facilitator.html     # Panel del facilitador
├── results.html         # Pantalla de proyección de resultados
│
├── js/
│   ├── game-data.js     # Datos y lógica pura del juego (5 etapas)
│   ├── supabase-client.js  # Inicialización de Supabase
│   ├── group.js         # Lógica de la pantalla del jugador
│   └── facilitator.js   # Lógica del panel del facilitador
│
├── css/
│   └── multiplayer.css  # Estilos del modo multijugador
│
└── supabase/
    └── schema.sql       # Schema de la base de datos
```

---

## Modo multijugador

### Arquitectura

```
SUPABASE (bus de estado en tiempo real)
  sessions  →  1 fila por sala
  groups    →  1 fila por equipo (estado completo del juego)
  players   →  1 fila por persona

Facilitador                    Grupos (6 equipos × 5 roles)
facilitator.html  ─────────►  group.html
advanceStage()                 Líder: decide y confirma
                               CISO / Legal / Comms / Ops: read-only
```

### Roles por equipo

| Rol | Puede confirmar decisiones | Vista especial |
|-----|--------------------------|----------------|
| **Líder** | ✅ Sí | Consecuencia completa de cada opción |
| CISO | ❌ No | Análisis técnico de cada opción |
| Legal | ❌ No | Penalizaciones y riesgos legales |
| Comunicaciones | ❌ No | Impacto reputacional |
| Operaciones | ❌ No | Costos y tiempo operativo |

### Flujo de una sesión

```
1. Facilitador crea sesión → obtiene código de sala (ej. M3Z8)
2. Facilitador genera 1 código de acceso por grupo (ej. BRPAYX para Equipo 1)
3. Participantes entran a index.html → ingresan código de grupo, nombre y rol
4. Facilitador inicia el simulacro → todos los grupos ven la Etapa 1
5. Cada equipo discute → Líder selecciona y confirma la decisión
6. Cuando todos los grupos confirmaron → Facilitador avanza a la siguiente etapa
7. Al completar 5 etapas → Facilitador finaliza → aparece pantalla de resultados
8. Facilitador proyecta results.html en pantalla para revelar el ranking
```

---

## Puesta en marcha

### Requisitos

- Cuenta en [Supabase](https://supabase.com) (free tier es suficiente)
- Python 3 (para el servidor local de desarrollo) o cualquier servidor HTTP estático

### 1. Configurar Supabase

1. Crear un proyecto nuevo en Supabase
2. Ir a **SQL Editor** y ejecutar el contenido de `supabase/schema.sql`
3. Habilitar Realtime para las tres tablas:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
   ALTER PUBLICATION supabase_realtime ADD TABLE groups;
   ALTER PUBLICATION supabase_realtime ADD TABLE players;
   ```
4. Copiar la **URL del proyecto** y la **anon key** desde *Project Settings → API*

### 2. Configurar credenciales

Editar `js/supabase-client.js`:

```javascript
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'tu_anon_key_aqui';
```

### 3. Iniciar servidor local

```bash
python -m http.server 8080
```

Abrir `http://localhost:8080`

---

## URLs de acceso

| URL | Quién accede |
|-----|-------------|
| `index.html` | Participantes (login con código de grupo) |
| `facilitator.html` | Facilitador (acceso directo, no visible para participantes) |
| `results.html?session=ID` | Pantalla de proyección (se abre desde el panel del facilitador) |
| `gm.html` | Modo single-player independiente |

---

## Panel del facilitador

El facilitador tiene acceso a:

- **Código de sala** — código de 4 caracteres que identifica la sesión (copiable con clic)
- **Estado de la sesión** — LOBBY / ACTIVO / FINALIZADO
- **Progreso por etapas** — indicadores visuales de qué etapa van
- **Iniciar simulacro** — pasa todos los grupos de lobby a activo
- **Avanzar etapa** — habilitado cuando todos los grupos confirmaron (o con override manual)
- **Finalizar sesión** — cierra el juego y muestra resultados
- **↺ Reiniciar sesión** — vuelve todo al estado inicial (útil para pruebas)
- **Generar códigos de acceso** — genera 1 código por grupo para distribuir a los equipos
- **Proyectar resultados** — abre `results.html` con el ranking final para mostrar en pantalla

---

## Base de datos

### Tablas

**`sessions`** — una fila por sala activa
- `room_code` — código de 4 caracteres (ej. `M3Z8`)
- `status` — `lobby` | `active` | `finished`
- `current_stage` — etapa actual controlada por el facilitador (0–4)

**`groups`** — una fila por equipo, contiene todo el estado del juego
- `access_code` — código compartido por los 5 miembros del equipo
- `budget`, `costs`, `penalties`, `hours` — estado financiero
- `flags` — JSONB con flags de ramificación (`backupsDestroyed`, `openedMonday`, etc.)
- `decision_log` — historial de decisiones tomadas
- `chosen_option`, `revealed` — estado de la decisión actual

**`players`** — una fila por persona conectada
- `role` — `leader` | `ciso` | `legal` | `comms` | `ops`
- `is_online` — presencia en tiempo real
- Restricción única: `(group_id, role)` — un rol por equipo

### Realtime

Se usa `postgres_changes` de Supabase Realtime. Cada sala tiene un canal:

```javascript
supabase.channel(`room-${roomCode}`)
  .on('postgres_changes', { table: 'sessions', ... }, handleSessionUpdate)
  .on('postgres_changes', { table: 'groups',   ... }, handleGroupUpdate)
  .subscribe()
```

---

## Resultados y ranking

Al finalizar las 5 etapas, el sistema calcula automáticamente el resultado de cada equipo según sus decisiones acumuladas:

| Resultado | Condición |
|-----------|-----------|
| **GESTIÓN EXITOSA** | Abrieron el lunes, presupuesto saludable, penalizaciones bajas |
| **GESTIÓN ACEPTABLE** | Abrieron el lunes, pero con costos o penalizaciones elevadas |
| **GESTIÓN DEFICIENTE** | No lograron abrir el lunes a tiempo |
| **COLAPSO INSTITUCIONAL** | Backups destruidos, licencia revocada, o penalizaciones > $3M sin abrir |
| **ELIMINADO** | Game Over por decisión fatal |

El ranking se ordena por resultado y luego por presupuesto final. La pantalla `results.html` se puede proyectar en el aula y se actualiza en tiempo real.

---

## Tecnologías

- **Vanilla HTML/CSS/JS** — sin frameworks ni build tools
- **ES Modules** — `<script type="module">` en los archivos multijugador
- **Supabase** — Postgres + Realtime websockets (free tier durante desarrollo)
- **Google Fonts** — Playfair Display, DM Sans, DM Mono

---

## Migración futura

Al finalizar el proyecto se evaluará migrar el backend de Supabase free tier a un servidor Postgres propio para mayor control y sin límites de inactividad.
