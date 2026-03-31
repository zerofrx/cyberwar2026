// ══════════════════════════════════════════
// game-data.js — Datos puros del juego
// Importado por group.js y facilitator.js
// gm.js mantiene su propia copia inline
// ══════════════════════════════════════════

export const BUDGET_INIT = 5000000;
export const HOURS_LIMIT = 72;

export const fmt = n =>
  (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');

// ── 5 Etapas del simulacro ───────────────────
export const STAGES = [

// ─── STAGE 1 ────────────────────────────────
{
  num: 1, label: 'STAGE 1 DE 5', timestamp: 'Viernes, 10:00 AM',
  status: 'INCIDENTE ACTIVO · VIERNES 10:00 AM',
  title: 'La Infección Silenciosa',
  variants: {
    default: {
      narrative: 'Los sistemas de RRHH reportan lentitud inusual desde hace 30 minutos. Varios empleados encuentran archivos con extensión <strong>.locked</strong> en sus carpetas de trabajo. El equipo de TI no puede determinar la causa. El Core Bancario (CBS) sigue operando con normalidad. No hay alertas en el SOC. La situación parece ser un problema menor de software.',
      update: null,
      branchCtx: null
    }
  },
  question: '¿Cuál es la primera acción del equipo de respuesta?',
  impact: 'ALTO',
  options: [
    {
      letter:'A', text:'Antivirus Express',
      sub:'Lanzar un escaneo de emergencia con el antivirus corporativo en los equipos afectados',
      cost:10000, hours:4,
      type:'trap', typeLabel:'TRAMPA',
      consequence:'El escaneo destruye la evidencia digital forense. Al intentar eliminar el malware, este activa un módulo de robo de credenciales que captura las claves nuevas generadas durante el proceso. No se logra contener el ataque.',
      branchNote:'→ Stage 2, Contexto B (caos activo)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'B', text:'Apagón Preventivo',
      sub:'Apagar toda la infraestructura bancaria como medida de contención total',
      cost:2000000, hours:2,
      type:'trap', typeLabel:'TRAMPA DE PÁNICO',
      consequence:'El apagón masivo causa un lucro cesante millonario injustificado. Al no haber investigado, no se sabe si era necesario. Además el Core CBS se corrompe parcialmente durante el apagado de emergencia.',
      branchNote:'→ Stage 2, Contexto B (caos y sin evidencia)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'C', text:'Contención Lógica',
      sub:'Aislar los segmentos afectados, capturar imagen de RAM y preservar evidencia forense',
      cost:50000, hours:6,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El equipo asegura evidencia digital valiosa. El análisis de RAM revela el ransomware activo. El Core Bancario queda protegido en un segmento aislado. Tienen evidencia para actuar en el Stage 2.',
      branchNote:'→ Stage 2, Contexto A (evidencia asegurada)',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Retener Negociador',
      sub:'Contratar un negociador de rescate antes de saber si hay un ataque de ransomware activo',
      cost:300000, hours:8,
      type:'trap', typeLabel:'PREMATURA',
      consequence:'Gastan recursos sin que haya una nota de rescate todavía. El negociador no tiene nada con qué trabajar. El malware sigue propagándose durante las 8 horas que tardó en llegar el negociador.',
      branchNote:'→ Stage 2, Contexto B (recursos desperdiciados)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'E', text:'Comprar EDR',
      sub:'Adquirir e instalar una solución de Endpoint Detection & Response de emergencia',
      cost:150000, hours:18,
      type:'trap', typeLabel:'PREMATURA',
      consequence:'La instalación del EDR tarda 18 horas. Durante ese tiempo el ataque avanza sin freno. El EDR queda operativo cuando ya es tarde para la fase de infección inicial. Falsa sensación de seguridad.',
      branchNote:'→ Stage 2, Contexto B (ataque avanzó sin contención)',
      penalty:0, nextCtx:'B'
    }
  ]
},

// ─── STAGE 2 ────────────────────────────────
{
  num: 2, label: 'STAGE 2 DE 5', timestamp: 'Sábado, 08:00 AM',
  status: 'EXTORSIÓN ACTIVA · SÁBADO 08:00 AM',
  title: 'La Extorsión y el Doble Robo',
  variants: {
    A: {
      narrative: 'El análisis forense capturó la imagen RAM. Se identificó la variante de ransomware <strong>LockBit 3.0</strong>. Aparece una nota de rescate exigiendo <strong>$3,000,000 USD</strong> en Bitcoin en 48 horas. El Core Bancario está a salvo dentro del segmento aislado. El equipo tiene evidencia sólida y tiempo para actuar con inteligencia.',
      update: '⚡ Forense confirma: el vector de entrada fue un correo de phishing hace 21 días. El malware estuvo en modo sigiloso 3 semanas antes de activarse.',
      branchCtx: '✓ CONTEXTO A — Evidencia asegurada. Core a salvo. Actuaron bien en Stage 1.'
    },
    B: {
      narrative: 'Caos operativo. Los sistemas caídos generan llamadas de pánico desde las sucursales. TI cree que es una falla de la base de datos Oracle. Sin evidencia forense. No saben que es ransomware. El Core Bancario muestra señales de inestabilidad. La situación se deteriora por horas.',
      update: '⚡ Un técnico encuentra por casualidad una nota cifrada en el servidor de archivos. El mensaje exige $3,000,000 USD. Nadie sabe qué cifraron ni qué tan profundo llegó.',
      branchCtx: '⚠ CONTEXTO B — Sin evidencia. Core en riesgo. Las decisiones previas los trajeron aquí.'
    }
  },
  question: '¿Cómo responde el equipo ante la nota de rescate?',
  impact: 'CRÍTICO',
  options: [
    {
      letter:'A', text:'Restaurar Backup',
      sub:'Activar la restauración desde los últimos backups del sistema para recuperar los archivos',
      cost:0, hours:4,
      type:'trap', typeLabel:'TRAMPA',
      consequence:'El ransomware tenía un módulo de persistencia en el servidor de backups. Al activar la restauración, cifra también los backups. Pierden la única copia de seguridad. Se aplica penalización de $1,000,000 al finalizar el juego.',
      branchNote:'PENALIZACIÓN: -$1,000,000 al final. Backups destruidos.',
      penalty:1000000, isPendingPenalty:true, penaltyLabel:'Backups destruidos',
      destroysBackups:true, nextCtx:'B'
    },
    {
      letter:'B', text:'Contención Lógica Tardía',
      sub:'Aislar sectores y capturar evidencia aunque sea de forma tardía',
      cost:150000, hours:10,
      type:'recycled', typeLabel:'RECICLADA',
      consequence:'Si están en Contexto B: el costo se triplica a $450,000 por el trabajo extra de reconstruir evidencia destruida. Logran identificar el ransomware y pasan al siguiente stage con evidencia parcial.',
      branchNote:'→ Stage 3, Contexto A (evidencia recuperada, costo elevado si Ctx B)',
      penalty:0, ctxBMultiplier:3, nextCtx:'A'
    },
    {
      letter:'C', text:'Equipo IR / Ganar Tiempo',
      sub:'Contratar un equipo de Incident Response externo y negociar tiempo con el atacante',
      cost:50000, hours:8,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El equipo IR congela el reloj de la extorsión. Ganan tiempo operativo. Mantienen el Core estable. El atacante acepta "negociar" —lo que da espacio para la respuesta técnica sin pagar nada.',
      branchNote:'→ Stage 3, Contexto A',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Pago Silencioso',
      sub:'Pagar los $3,000,000 de rescate en Bitcoin sin notificar a las autoridades',
      cost:3000000, hours:2,
      type:'trap', typeLabel:'TRAMPA EJECUTIVA',
      consequence:'El pago es ilegal según la regulación financiera. El grupo ransomware recibe el pago pero envía una segunda nota exigiendo $2,000,000 adicionales —extorsión doble. El dinero se perdió y la situación empeoró.',
      branchNote:'→ Stage 3, Contexto B (ilegalidad + extorsión doble)',
      penalty:0, paidRansom:true, nextCtx:'B'
    },
    {
      letter:'E', text:'Comunicado a Clientes',
      sub:'Emitir un comunicado público a los 180,000 clientes antes de saber qué datos fueron comprometidos',
      cost:100000, hours:6,
      type:'trap', typeLabel:'PREMATURA',
      consequence:'Sin saber qué fue cifrado ni qué datos se vieron afectados, el comunicado genera alarma masiva. Se inicia una corrida bancaria digital. El regulador llama furioso. El daño reputacional multiplica la crisis.',
      branchNote:'→ Stage 3, Contexto B (corrida bancaria activa)',
      penalty:0, nextCtx:'B'
    }
  ]
},

// ─── STAGE 3 ────────────────────────────────
{
  num: 3, label: 'STAGE 3 DE 5', timestamp: 'Sábado, 14:00 PM',
  status: 'FORENSIA Y PRENSA · SÁBADO 14:00 PM',
  title: 'El Paciente Cero y la Prensa',
  variants: {
    A: {
      narrative: 'El equipo forense identificó el vector de entrada: un correo de phishing en LinkedIn dirigido a <strong>Claudia M., analista de RRHH</strong>, hace 21 días. El malware estuvo latente tres semanas antes de activarse. La prensa pregunta por rumores de una "interrupción operativa mayor". No hay pánico todavía pero la ventana de comunicación se cierra.',
      update: '⚡ El regulador (CNBV) envió un correo formal solicitando un informe preliminar en 4 horas. La respuesta que den determinará el tono de la relación con la autoridad.',
      branchCtx: '✓ CONTEXTO A — Control forense. Tiempo para comunicar correctamente.'
    },
    B: {
      narrative: 'El atacante publicó una nota en las <strong>pantallas públicas</strong> del banco y en las redes sociales. Hay pánico en Twitter con el hashtag #MeridianHackeado. El regulador llama directamente al CEO. Periodistas esperan afuera de la sede central. La situación se salió del control técnico y entró en crisis reputacional.',
      update: '⚡ Tres directores del banco publicaron declaraciones personales en redes sociales —sin coordinación— creando mensajes contradictorios que amplifican el pánico.',
      branchCtx: '⚠ CONTEXTO B — Crisis pública activa. Pánico social. Presión regulatoria máxima.'
    }
  },
  question: '¿Cómo gestiona el equipo la crisis de comunicación y la identificación del vector?',
  impact: 'ALTO',
  options: [
    {
      letter:'A', text:'Caza de Brujas',
      sub:'Suspender de inmediato a la empleada de RRHH y comunicarlo públicamente como medida correctiva',
      cost:50000, hours:2,
      type:'trap', typeLabel:'TRAMPA',
      consequence:'La empleada no era un insider —fue víctima de phishing. Su abogado presenta una demanda por daño moral. El regulador multa al banco por incumplir protocolos de investigación. Penalización: $1,000,000.',
      branchNote:'PENALIZACIÓN: -$1,000,000. Demanda laboral activa. → Stage 4, Contexto B',
      penalty:1000000, isPendingPenalty:false, laborLawsuit:true, nextCtx:'B'
    },
    {
      letter:'B', text:'Silencio Corporativo',
      sub:'No comunicar nada a clientes, prensa ni regulador hasta tener el panorama completo',
      cost:0, hours:4,
      type:'trap', typeLabel:'TRAMPA LEGAL',
      consequence:'Ocultar un incidente material es una infracción regulatoria grave. El regulador descubre el silencio a través de un reporte externo. Multa máxima de $3,000,000. El banco queda bajo supervisión especial.',
      branchNote:'PENALIZACIÓN: -$3,000,000. Supervisión regulatoria. → Stage 4, Contexto B',
      penalty:3000000, isPendingPenalty:false, silentCorp:true, nextCtx:'B'
    },
    {
      letter:'C', text:'Comunicación SGSI',
      sub:'Activar el protocolo de comunicación del Sistema de Gestión de Seguridad de la Información',
      cost:250000, hours:6,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El protocolo SGSI proporciona mensajes preaprobados para reguladores, clientes y prensa. Se frena el pánico. El regulador recibe el informe preliminar requerido. La reputación se estabiliza. El banco mantiene el control del relato.',
      branchNote:'→ Stage 4, Contexto A',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Threat Hunting Activo',
      sub:'Lanzar una operación intensiva para identificar y eliminar todas las puertas traseras de la red',
      cost:300000, hours:18,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El equipo encuentra y elimina 3 puertas traseras que el atacante dejó para persistencia. La red queda limpia. El tiempo consumido es alto pero la seguridad está garantizada para Stage 4.',
      branchNote:'→ Stage 4, Contexto A (red segura)',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'E', text:'Migrar a la Nube',
      sub:'Iniciar una migración de emergencia de toda la infraestructura a la nube en 48 horas',
      cost:2500000, hours:48,
      type:'extreme', typeLabel:'EXTREMA',
      consequence:'Una migración de arquitectura completa en 48 horas es técnicamente imposible. El equipo colapsa. El proyecto fracasa. Se consumen 48 horas del presupuesto temporal y $2.5M del presupuesto financiero. El banco no abre el lunes.',
      branchNote:'→ COLAPSO TOTAL: Stage 5 Crítico directo (tiempo y dinero agotados)',
      penalty:0, nextCtx:'B', extremeOutcome:true
    }
  ]
},

// ─── STAGE 4 ────────────────────────────────
{
  num: 4, label: 'STAGE 4 DE 5', timestamp: 'Domingo, 10:00 AM',
  status: 'RECUPERACIÓN · DOMINGO 10:00 AM',
  title: 'La Carrera de Recuperación',
  variants: {
    A: {
      narrative: 'Tienen la red segura y el control mediático. Sin embargo, los sistemas afectados requieren una reconstrucción completa. El equipo técnico estima un mínimo de <strong>36 horas</strong> para restaurar el Core y los cajeros. El lunes a las 10:00 AM es la apertura operativa obligatoria —exactamente en 36 horas. No hay margen.',
      update: '⚡ El equipo de DRP (Disaster Recovery Plan) propone un modo degradado: Core básico + cajeros + banca digital. Sería al 60% de capacidad pero cumple para abrir.',
      branchCtx: '✓ CONTEXTO A — Red segura. Control mediático. Tiempo justo para recuperación.'
    },
    B: {
      narrative: 'La red tiene posibles puertas traseras sin identificar. Los técnicos llevan 36 horas sin dormir. La moral del equipo es baja. Restaurar tomará mínimo <strong>36 horas</strong>. El lunes a las 10:00 AM es la apertura obligatoria. Cualquier error técnico ahora podría ser catastrófico.',
      update: '⚡ Un técnico advierte: "Si el ransomware todavía está en algún servidor de backup y lo activamos, perdemos todo." El riesgo de ejecutar scripts no auditados es máximo.',
      branchCtx: '⚠ CONTEXTO B — Red dudosa. Técnicos agotados. Riesgo de reinfección alto.'
    }
  },
  question: '¿Cómo ejecutan la recuperación de sistemas para abrir el lunes?',
  impact: 'CRÍTICO',
  options: [
    {
      letter:'A', text:'Script Milagroso',
      sub:'Ejecutar un script de recuperación automatizado descargado de un foro técnico sin auditar',
      cost:0, hours:12,
      type:'trap', typeLabel:'TRAMPA',
      consequence:'El script ejecuta código no auditado en los servidores. Corrompe las bases de datos de transacciones de los últimos 6 meses. La corrupción es irreversible. El banco no puede abrir el lunes.',
      branchNote:'→ Stage 5, Estado Crítico (bases de datos corrompidas)',
      penalty:0, nextCtx:'C'
    },
    {
      letter:'B', text:'Degradación Aceptable / DRP',
      sub:'Activar el Plan de Recuperación de Desastres: Core básico + cajeros al 60% de capacidad',
      cost:800000, hours:18,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El equipo ejecuta el DRP con precisión. El Core básico, los cajeros y la banca digital quedan operativos al 60% de capacidad. El lunes a las 10:00 AM el banco abre. Misión cumplida.',
      branchNote:'→ Stage 5, Estado según presupuesto y decisiones previas. ABRIERON EL LUNES.',
      penalty:0, openedMonday:true, nextCtx:'A'
    },
    {
      letter:'C', text:'Recovery Broker',
      sub:'Contratar un intermediario que promete descifrar los archivos por $1,000,000 en 5 horas',
      cost:1000000, hours:5,
      type:'trap', typeLabel:'TRAMPA / ESTAFA',
      consequence:'El "Recovery Broker" es una estafa. Desaparece con el millón de dólares. Pierden 5 horas críticas y $1M. Cuando intentan el siguiente plan ya no hay margen de tiempo para abrir el lunes.',
      branchNote:'→ Stage 5, Estado Crítico o Grave (estafados + sin tiempo)',
      penalty:0, nextCtx:'C'
    },
    {
      letter:'D', text:'Parche Suicida',
      sub:'Aplicar un parche de seguridad directamente sobre los servidores infectados sin aislar primero',
      cost:100000, hours:8,
      type:'fatal', typeLabel:'FATAL',
      consequence:'En Contexto B: el ransomware todavía activo detecta la actividad y cifra la copia de recuperación. GAME OVER técnico. En Contexto A: el parche funciona parcialmente pero daña módulos del Core.',
      branchNote:'CTX B → GAME OVER. CTX A → Stage 5, Estado Grave.',
      penalty:0, fatalIfCtxB:true, destroysBackups:true, nextCtx:'D'
    },
    {
      letter:'E', text:'Threat Hunting Tardío',
      sub:'Dedicar las próximas 24 horas a limpiar la red antes de intentar cualquier recuperación',
      cost:600000, hours:24,
      type:'recycled', typeLabel:'RECICLADA',
      consequence:'La red queda perfectamente segura, pero consumen 24 horas en el proceso. Ya no hay tiempo para restaurar los sistemas antes del lunes. El banco no abre. Técnicamente correcto, estratégicamente tardío.',
      branchNote:'→ Stage 5, Estado Grave (red limpia pero no abrieron)',
      penalty:0, nextCtx:'C'
    }
  ]
},

// ─── STAGE 5 ────────────────────────────────
{
  num: 5, label: 'STAGE 5 DE 5', timestamp: 'Lunes, 12:00 PM',
  status: 'DÍA DE CUENTAS · LUNES 12:00 PM',
  title: 'El Día de Cuentas',
  variants: {
    A: {
      narrative: '<strong>Estado: LEVE.</strong> Abrieron el lunes con el DRP. El presupuesto está sano. La gestión fue técnicamente sólida. El regulador (CNBV) espera una comparecencia formal. El riesgo de multa es bajo si la presentación es correcta.',
      update: '⚡ El regulador valora la transparencia y la velocidad de respuesta. Un informe SGSI bien documentado puede resultar en multa cero.',
      branchCtx: '✓ ESTADO LEVE — Abrieron el lunes. Presupuesto saludable. Gestión sólida.'
    },
    B: {
      narrative: '<strong>Estado: MEDIO.</strong> Abrieron el lunes pero gastaron millones en decisiones subóptimas. El regulador tiene preguntas sobre las decisiones tomadas. El banco opera pero la gestión fue costosa e inconsistente.',
      update: '⚡ El auditor externo señala que algunas decisiones "rozaron la imprudencia". La multa regulatoria depende de cómo se presente el caso.',
      branchCtx: '⚠ ESTADO MEDIO — Abrieron el lunes. Gestión costosa. Decisiones cuestionables.'
    },
    C: {
      narrative: '<strong>Estado: GRAVE.</strong> El banco no abrió el lunes o abrió con sistemas inestables. El regulador inició formalmente un proceso de supervisión especial. Los accionistas exigen explicaciones. La imagen pública está dañada.',
      update: '⚡ El BCP considerará una intervención si el banco no demuestra un plan de remediación creíble en 48 horas.',
      branchCtx: '⚠ ESTADO GRAVE — No abrieron el lunes. O abrieron con sistemas comprometidos.'
    },
    D: {
      narrative: '<strong>Estado: CRÍTICO.</strong> Los backups están destruidos. Hay demandas activas. El sistema de pagos está comprometido. El regulador tiene en mesa la revocación de la licencia operativa. Están ante el peor escenario posible.',
      update: '⚡ Tres bufetes de abogados presentaron demandas colectivas. El BCP convocó una reunión de emergencia para la tarde.',
      branchCtx: '🔴 ESTADO CRÍTICO — Backups destruidos. Demandas activas. Licencia en riesgo.'
    }
  },
  question: '¿Cómo se presenta el equipo ante el regulador y los accionistas?',
  impact: 'ALTO',
  isStage5: true,
  options: [
    {
      letter:'A', text:'Chivo Expiatorio',
      sub:'Responsabilizar públicamente a un empleado de nivel medio para desviar la atención del regulador',
      cost:10000, hours:0,
      type:'trap', typeLabel:'TRAMPA',
      consequence:'Los auditores del regulador examinan los registros y determinan que la narrativa fue fabricada. La maniobra se interpreta como obstrucción y fraude procesal. Multa adicional de $3,000,000.',
      branchNote:'PENALIZACIÓN FINAL: -$3,000,000',
      penalty:3000000
    },
    {
      letter:'B', text:'Transparencia SGSI',
      sub:'Presentar el informe completo del SGSI con todas las decisiones, errores y aprendizajes',
      cost:150000, hours:0,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'Estado LEVE/MEDIO: el regulador reconoce la buena fe. Multa: $0. Estado GRAVE: multa reducida de $500,000 pero se salva la licencia. Estado CRÍTICO: multa de $1,000,000 pero no se revoca la licencia.',
      branchNote:'Multa según estado: LEVE→$0, MEDIO→$0, GRAVE→-$500k, CRÍTICO→-$1M',
      penalty:0, conditionalPenalty:true
    },
    {
      letter:'C', text:'Promesa Faraónica',
      sub:'Comprometerse públicamente a invertir $5M en ciberseguridad para compensar el incidente',
      cost:2000000, hours:0,
      type:'trap', typeLabel:'TRAMPA',
      consequence:'Las promesas sin evidencia de remediación no borran la negligencia pasada. El regulador aplica la multa estándar y exige que se demuestre la inversión prometida. Penalización adicional: $1,000,000.',
      branchNote:'PENALIZACIÓN EXTRA: -$1,000,000 adicional',
      penalty:1000000
    },
    {
      letter:'D', text:'Acuerdo Proactivo',
      sub:'Proponer un acuerdo voluntario con el regulador antes de que inicie la investigación formal',
      cost:500000, hours:0,
      type:'lifesaver', typeLabel:'SALVAVIDAS',
      consequence:'El acuerdo proactivo demuestra buena fe y frena investigaciones más profundas. El regulador acepta. Se evitan costos ocultos mayores. Especialmente efectivo si la gestión fue deficiente.',
      branchNote:'Frena investigaciones. Recomendado para Estado GRAVE/CRÍTICO.',
      penalty:0
    },
    {
      letter:'E', text:'Obstrucción Legal',
      sub:'Instruir a los abogados del banco a obstruir la investigación regulatoria con recursos legales',
      cost:50000, hours:0,
      type:'fatal', typeLabel:'FATAL',
      consequence:'El regulador interpreta la obstrucción como evidencia de culpa. Revoca la licencia operativa del banco. Inicia una intervención estatal. Multa máxima: $5,000,000. El banco deja de existir como institución independiente.',
      branchNote:'CONSECUENCIA FATAL: Licencia REVOCADA + -$5,000,000',
      penalty:5000000, licenseRevoked:true
    }
  ]
}
];

// ── computeStage5State ───────────────────────
// Versión pura: no lee G, recibe parámetros
export function computeStage5State(flags, budget, penalties) {
  const budgetUsedPct = (BUDGET_INIT - budget) / BUDGET_INIT;

  if (flags.licenseRevoked || flags.backupsDestroyed) {
    return { ctx:'D', label:'CRÍTICO', reason:'Backups destruidos o licencia revocada. El banco está ante una crisis existencial.' };
  }
  if (!flags.openedMonday && penalties >= 3000000) {
    return { ctx:'D', label:'CRÍTICO', reason:'No abrieron el lunes y las penalizaciones superan $3M.' };
  }
  if (!flags.openedMonday) {
    return { ctx:'C', label:'GRAVE', reason:'No lograron abrir el lunes. Supervisión regulatoria activa.' };
  }
  if (penalties >= 1000000 || budgetUsedPct > 0.7) {
    return { ctx:'B', label:'MEDIO', reason:'Abrieron el lunes pero la gestión fue costosa y cuestionable.' };
  }
  return { ctx:'A', label:'LEVE', reason:'Abrieron el lunes con presupuesto saludable y gestión sólida.' };
}

// ── applyDecision ────────────────────────────
// Aplica una decisión a un estado de grupo y devuelve el nuevo estado
export function applyDecision(groupState, stageIndex, optionIndex) {
  const s   = STAGES[stageIndex];
  const opt = s.options[optionIndex];
  const ctx = groupState.ctx;

  const effectiveCost = (ctx === 'B' && opt.ctxBMultiplier)
    ? opt.cost * opt.ctxBMultiplier
    : opt.cost;

  const newFlags = { ...groupState.flags };
  let budget   = groupState.budget   - effectiveCost;
  let costs    = groupState.costs    + effectiveCost;
  let penalties = groupState.penalties;
  let hours    = groupState.hours    + opt.hours;

  // Penalizaciones inmediatas
  if (opt.penalty && !opt.isPendingPenalty) {
    budget    -= opt.penalty;
    penalties += opt.penalty;
  }
  // Penalizaciones diferidas
  if (opt.penalty && opt.isPendingPenalty) {
    newFlags.pendingPenalties = [
      ...newFlags.pendingPenalties,
      { label: opt.penaltyLabel || opt.text, amount: opt.penalty }
    ];
  }

  if (opt.destroysBackups) newFlags.backupsDestroyed = true;
  if (opt.openedMonday)    newFlags.openedMonday     = true;
  if (opt.paidRansom)      newFlags.paidRansom       = true;
  if (opt.laborLawsuit)    newFlags.laborLawsuit     = true;
  if (opt.silentCorp)      newFlags.silentCorp       = true;
  if (opt.licenseRevoked)  newFlags.licenseRevoked   = true;

  const logType = (opt.type === 'correct' || opt.type === 'lifesaver')
    ? 'correct' : (opt.type === 'recycled' ? 'ok' : 'trap');

  const newLog = [
    ...groupState.decision_log,
    { stage: s.num, letter: opt.letter, text: opt.text,
      type: logType, typeLabel: opt.typeLabel,
      cost: effectiveCost, hours: opt.hours }
  ];

  const newNotif = {
    type: 'info',
    title: `Stage ${s.num}: Opción ${opt.letter}`,
    body: `${opt.text} — ${fmt(effectiveCost)}${opt.hours ? ` · +${opt.hours}h` : ''}`,
    stage: stageIndex
  };

  // Determinar nextCtx
  let nextCtx = opt.nextCtx || 'A';
  let nextStage = stageIndex;
  let isGameOver = false;
  let isExtremeOutcome = false;

  if (opt.fatalIfCtxB && ctx === 'B') {
    newFlags.backupsDestroyed = true;
    isGameOver = true;
  }

  if (opt.extremeOutcome) {
    isExtremeOutcome = true;
    nextCtx  = 'C';
    nextStage = 4;
  }

  return {
    budget, costs, penalties, hours,
    flags: newFlags,
    decision_log: newLog,
    notif_log: [...groupState.notif_log, newNotif],
    nextCtx,
    nextStage,
    isGameOver,
    isExtremeOutcome,
    opt,
    effectiveCost
  };
}
