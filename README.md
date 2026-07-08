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
├── results.html         # Pantalla de proyección de resultados finales
├── leaderboard.html     # Clasificación pública proyectable (en vivo)
├── guia.html            # Manual: cómo jugar, reglas y puntajes
│
├── js/
│   ├── game-data.js     # Datos y lógica pura (5 etapas, toolkit, eficiencia)
│   ├── ranking.js       # Puntaje compuesto, perfiles, tendencia, tabla
│   ├── supabase-client.js  # Inicialización de Supabase
│   ├── group.js         # Lógica de la pantalla del jugador
│   ├── leaderboard.js   # Lógica de la clasificación pública
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
advanceStage()                 CISO: compra tools, decide y confirma
                               Analista / Legal / Comms / Ops: read-only
```

### Roles por equipo

| Rol | Puede comprar tools y confirmar decisiones | Vista especial |
|-----|--------------------------|----------------|
| **CISO** | ✅ Sí | Consecuencia completa de cada opción + Toolkit SOC |
| Analista de Seguridad | ❌ No | Análisis técnico de cada opción |
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

## Cálculo del puntaje

El puntaje vive en `js/ranking.js` (`compositeScore`) y se nutre de funciones definidas en `js/game-data.js`. El marcador muestra **0** mientras el equipo no haya confirmado ninguna decisión. Los pesos están calibrados a propósito para que **decidir bien importe mucho más que ahorrar dinero** — el presupuesto es el componente de menor peso y nunca compensa una mala decisión.

### Fórmula del puntaje compuesto (columna PUNTOS)

```
PUNTOS = Presupuesto ÷ 20,000  +  Reputación × 20  +  Eficiencia × 10  +  Calidad de decisiones
```

| Componente | Rango | Cómo se calcula |
|-----------|-------|-----------------|
| 💰 **Presupuesto** | 0 – 250 pts | `(budget − penalizaciones diferidas) ÷ 20,000`. Cada $20,000 conservados = 1 punto — el de menor peso, a propósito |
| ❤ **Reputación** | 0 – 2,000 pts | `reputation × 20`. Cada 1 % de reputación = 20 puntos |
| ⚡ **Eficiencia** | 0 – 3,000 pts | `efficiencyScore × 10` (ver abajo) |
| 🎯 **Calidad de decisiones** | −300 a +400 pts | `computeDecisionQualityBonus` — directo, sin multiplicar (ver abajo) |

### Calidad de decisiones (`computeDecisionQualityBonus`) — el componente más notorio

Se suma **directo** al puntaje por cada decisión del `decision_log`, sin depender del presupuesto ni de las herramientas compradas:

```js
correct (incl. lifesaver) → +80   // decisión correcta
ok (tardía)               → +20   // decisión aceptable/recuperada
trap                      → −60   // trampa (incluye fatal/extreme, que ya se registran como 'trap')
```

Máximo en 5 etapas: **+400** (todas correctas) a **−300** (todas trampas). Es el componente que hace el impacto de cada acción obvio en el marcador, sin importar cuánto gastó el equipo.

### Eficiencia (`computeEfficiencyScore`)

```
EFICIENCIA = 100 (base) + anticipación + tiempo + equipamiento − compras inútiles
```

Sin cap superior. Cada factor:

| Factor | Función | Efecto |
|--------|---------|--------|
| 🛠 **Equipamiento** | `computeEquipBonus` | **+8 por decisión correcta equipada** (proporcional si parcial). Máx +40. Premia tener las herramientas que respaldan la opción correcta al confirmarla |
| 🎯 **Anticipación** | `computeAnticipationBonus` | **+3 por etapa de adelanto** al comprar una herramienta antes de su `idealStage`. Máx +15 |
| ⏱ **Tiempo** | `computeTimeScore` | Por etapa según % del tiempo objetivo: ≤50 % → **+20**, ≤80 % → **+10**, ≤100 % → 0, ≤130 % → **−10**, >130 % → **−20** |
| 🗑 **Compras inútiles** | `computeWastedPenalty` | **−2** por herramienta comprada que no aporta inteligencia (`reveals: null`) |

### Anti-acaparamiento (por qué el presupuesto pesa poco)

Las herramientas cuestan presupuesto, así que un equipo podría acaparar dinero y no comprar nada. Se evita por partida doble: el presupuesto es el componente de **menor peso** (÷20,000) y la Calidad de decisiones + el bono de Equipamiento premian directamente decidir bien y usar las herramientas correctas, sin importar el gasto. El `matched/total` del equipamiento se congela en el `decision_log` al momento de decidir: comprar la herramienta **después** de confirmar no cuenta.

**Resultado verificado:** un equipo que compra todo el toolkit y acierta las 5 decisiones supera por **~1,400 puntos** a uno que no compró nada con los mismos aciertos. Un equipo que cae en 3 trampas queda **~1,370 puntos** por debajo de uno que no compró nada pero acertó. Ahorrar nunca gana — decidir bien sí.

### Bonus de matching en la ejecución

Además del puntaje, tener las herramientas correctas abarata la decisión en el momento: **−15 % de costo y −10 % de horas** proporcional al match (`applyToolBonus` en `game-data.js`).

### Tendencia (▲▼ =)

El leaderboard reconstruye el ranking al final de la etapa anterior (`rankingAtStage` reproduce el `decision_log`) y lo compara con el actual para mostrar cuántas posiciones subió o bajó cada equipo.

### Perfil del equipo (`profileOf`)

Etiqueta gamificada según los drivers dominantes, en orden de prioridad:

| Perfil | Condición |
|--------|-----------|
| ☠ **ELIMINADO** | `final_state === 'game_over'` |
| 🔥 **EN CRISIS** | reputación < 40 % o presupuesto < 30 % |
| 🐌 **DEMORADO** | penalización de tiempo acumulada < −5 |
| 🎯⚡ **COMPLETO** | anticipación > 5 **y** velocidad > 5 |
| 🎯 **ESTRATEGA** | anticipación > 5 |
| ⚡ **ÁGIL** | velocidad > 5 |
| ⚖ **EQUILIBRADO** | ninguno de los anteriores |

### Estado final del banco (`computeStage5State`)

Independiente del puntaje, resume la gestión de la crisis. Se agrava si exceden 72 h o terminan con reputación baja:

| Estado | Condición |
|--------|-----------|
| 🟢 **LEVE** | Abrieron el lunes, presupuesto sano, pocas multas |
| 🟡 **MEDIO** | Abrieron el lunes pero con costos o multas elevadas |
| 🟠 **GRAVE** | No lograron abrir el lunes — supervisión regulatoria |
| 🔴 **CRÍTICO** | Backups destruidos, licencia revocada o multas masivas |

### Dónde se muestra

- **`leaderboard.html`** — clasificación pública proyectable (en vivo): `# · EQUIPO · PERFIL · PUNTOS · TENDENCIA`, con barra tricolor que muestra la proporción presupuesto/reputación/eficiencia bajo cada puntaje. **No revela** los valores exactos.
- **Resultados Preliminares** del facilitador — tabla detallada con todas las columnas (presupuesto, reputación, eficiencia, decisiones).
- **Pantalla final del jugador** — desglose completo de su eficiencia (base, anticipación, equipamiento, velocidad).
- **`guia.html`** — manual proyectable que explica todo esto a los participantes (atajo en el panel del facilitador).

---

## Tecnologías

- **Vanilla HTML/CSS/JS** — sin frameworks ni build tools
- **ES Modules** — `<script type="module">` en los archivos multijugador
- **Supabase** — Postgres + Realtime websockets (free tier durante desarrollo)
- **Google Fonts** — Playfair Display, DM Sans, DM Mono

---

## Migración futura

Al finalizar el proyecto se evaluará migrar el backend de Supabase free tier a un servidor Postgres propio para mayor control y sin límites de inactividad.
