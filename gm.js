// ══════════════════════════════════════════
// GM PANEL — Crisis Cibernética Bancaria
// Lógica de juego y datos de las 5 etapas
// ══════════════════════════════════════════

const BUDGET_INIT = 5000000;
const HOURS_LIMIT = 72;

let G = {
  stage: 0,
  ctx: 'default',
  budget: BUDGET_INIT,
  costs: 0,
  penalties: 0,
  hours: 0,
  chosen: null,
  revealed: false,
  log: [],
  notifs: [],
  unread: 0,
  currentTab: 'info',
  flags: {
    backupsDestroyed: false,
    openedMonday: false,
    paidRansom: false,
    laborLawsuit: false,
    silentCorp: false,
    licenseRevoked: false,
    pendingPenalties: []
  },
  team: { name:'', ciso:'', legal:'', comms:'', ops:'', gm:'' }
};

const fmt  = n => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const role = k => G.team[k] || { ciso:'el CISO', legal:'Legal', comms:'Comunicaciones', ops:'Operaciones', gm:'el Gerente General' }[k];

// ══════════════════════════════════════════
// DATOS DEL JUEGO — 5 STAGES
// ══════════════════════════════════════════
const STAGES = [

// ─── STAGE 1 ───────────────────────────────
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

// ─── STAGE 2 ───────────────────────────────
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

// ─── STAGE 3 ───────────────────────────────
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

// ─── STAGE 4 ───────────────────────────────
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

// ─── STAGE 5 ───────────────────────────────
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

]; // end STAGES

// ══════════════════════════════════════════
// INICIO DEL JUEGO
// ══════════════════════════════════════════
function startGame() {
  G.team.name  = document.getElementById('iTeam').value.trim() || 'Equipo';
  G.team.ciso  = document.getElementById('iCISO').value.trim();
  G.team.legal = document.getElementById('iLegal').value.trim();
  G.team.comms = document.getElementById('iComms').value.trim();
  G.team.ops   = document.getElementById('iOps').value.trim();
  G.team.gm    = document.getElementById('iGM').value.trim();

  G.stage = 0;
  G.ctx = 'default';
  G.budget = BUDGET_INIT;
  G.costs = 0; G.penalties = 0; G.hours = 0;
  G.chosen = null; G.revealed = false;
  G.log = []; G.notifs = []; G.unread = 0;
  G.flags = {
    backupsDestroyed: false, openedMonday: false, paidRansom: false,
    laborLawsuit: false, silentCorp: false, licenseRevoked: false,
    pendingPenalties: []
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
  const variant = s.variants[G.ctx] || s.variants['default'] || s.variants['A'];
  const main = document.getElementById('gameMain');

  document.getElementById('stageLabel').textContent = s.label;

  let html = '';

  if (s.isStage5) {
    const autoState = computeStage5State();
    G.ctx = autoState.ctx;
    const variant5 = s.variants[G.ctx];
    html += `
    <div class="incident-card">
      <div class="ic-status-bar"><div class="ic-dot"></div>${s.status}</div>
      <div class="ic-body">
        <div class="ic-eyebrow">${s.label} · ${s.timestamp}</div>
        <h2 class="ic-title">${s.title}</h2>
        <p class="ic-narrative">${variant5.narrative}</p>
        ${variant5.update ? `<div class="ic-update"><div class="ic-update-label">// ALERTA GM</div>${variant5.update}</div>` : ''}
        <div class="branch-ctx ctx-${G.ctx.toLowerCase()}">
          <div class="branch-ctx-label">// ESTADO EVALUADO AUTOMÁTICAMENTE</div>
          ${variant5.branchCtx}
        </div>
        <div style="margin-top:.75rem;padding:.65rem;background:var(--gold-light);border:1px solid #e0c880;border-radius:6px;font-size:.78rem;color:var(--gold);">
          <div style="font-family:'DM Mono',monospace;font-size:.54rem;letter-spacing:.1em;margin-bottom:.2rem;">// GM: ESTADO CALCULADO</div>
          <strong>Estado: ${autoState.label}</strong> — ${autoState.reason}
        </div>
      </div>
    </div>`;
  } else {
    html += `
    <div class="incident-card">
      <div class="ic-status-bar"><div class="ic-dot"></div>${s.status}</div>
      <div class="ic-body">
        <div class="ic-eyebrow">${s.label} · ${s.timestamp}</div>
        <h2 class="ic-title">${s.title}</h2>
        <p class="ic-narrative">${variant.narrative}</p>
        ${variant.update ? `<div class="ic-update"><div class="ic-update-label">// ACTUALIZACIÓN</div>${variant.update}</div>` : ''}
        ${variant.branchCtx ? `<div class="branch-ctx ${G.ctx === 'A' ? 'ctx-a' : 'ctx-b'}"><div class="branch-ctx-label">// BIFURCACIÓN ACTIVA</div>${variant.branchCtx}</div>` : ''}
      </div>
    </div>`;
  }

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
    const costStr = effectiveCost === 0 ? '$0' : fmt(effectiveCost);
    const costClass = effectiveCost === 0 ? 'zero' : '';
    html += `
        <div class="dec-opt" id="opt-${i}" onclick="selectOption(${i})">
          <div class="do-key">${opt.letter}</div>
          <div class="do-content">
            <div class="do-text">${opt.text}</div>
            <div class="do-sub">${opt.sub}</div>
            <div class="opt-meta">
              <span class="opt-cost ${costClass}">${costStr}</span>
              ${opt.hours > 0 ? `<span class="opt-hours">+${opt.hours}h</span>` : '<span class="opt-hours" style="color:var(--success)">Sin tiempo</span>'}
            </div>
            <div class="gm-type-badge gm-${opt.type}">${opt.typeLabel}</div>
            <button class="gm-info-toggle" onclick="event.stopPropagation();toggleGMInfo(${i})">▼ Ver consecuencia [GM]</button>
            <div class="gm-info" id="gmi-${i}">
              <div class="gm-consequence">${opt.consequence}</div>
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
}

function toggleGMInfo(i) {
  document.getElementById(`gmi-${i}`).classList.toggle('open');
}

function selectOption(i) {
  if (G.revealed) return;
  G.chosen = i;

  document.querySelectorAll('.dec-opt').forEach((el, idx) => {
    el.classList.toggle('selected', idx === i);
  });

  const opt = STAGES[G.stage].options[i];
  const effectiveCost = (G.ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;
  document.getElementById('confirmHint').innerHTML = `Opción elegida: <strong>${opt.letter} — ${opt.text}</strong> · ${fmt(effectiveCost)}${opt.hours > 0 ? ` · +${opt.hours}h` : ''}`;
  document.getElementById('confirmBtn').style.display = 'block';

  const gmInfo = document.getElementById(`gmi-${i}`);
  if (gmInfo) gmInfo.classList.add('open');
}

// ══════════════════════════════════════════
// CONFIRMAR DECISIÓN
// ══════════════════════════════════════════
function confirmDecision() {
  if (G.chosen === null) return;

  const s = STAGES[G.stage];
  const opt = s.options[G.chosen];
  const effectiveCost = (G.ctx === 'B' && opt.ctxBMultiplier) ? opt.cost * opt.ctxBMultiplier : opt.cost;

  G.budget -= effectiveCost;
  G.costs  += effectiveCost;
  G.hours  += opt.hours;

  if (opt.penalty && !opt.isPendingPenalty) {
    G.budget   -= opt.penalty;
    G.penalties += opt.penalty;
    addNotif('alert', '⚠ Penalización aplicada', `${opt.letter}: ${fmt(opt.penalty)} deducidos del presupuesto`);
  }

  if (opt.penalty && opt.isPendingPenalty) {
    G.flags.pendingPenalties.push({ label: opt.penaltyLabel || opt.text, amount: opt.penalty });
    addNotif('warn', '⏳ Penalización diferida', `${opt.penaltyLabel || opt.text}: -${fmt(opt.penalty)} se aplicará al final`);
  }

  if (opt.destroysBackups) G.flags.backupsDestroyed = true;
  if (opt.openedMonday)    G.flags.openedMonday     = true;
  if (opt.paidRansom)      G.flags.paidRansom       = true;
  if (opt.laborLawsuit)    G.flags.laborLawsuit     = true;
  if (opt.silentCorp)      G.flags.silentCorp       = true;
  if (opt.licenseRevoked)  G.flags.licenseRevoked   = true;

  if (opt.fatalIfCtxB && G.ctx === 'B') {
    G.flags.backupsDestroyed = true;
    addNotif('alert', '💀 GAME OVER TÉCNICO', 'El ransomware cifró la copia de recuperación. No hay retorno posible.');
    showGameOver(
      'Colapso Técnico Irreversible',
      `La opción "${opt.letter} — ${opt.text}" en Contexto B activó el módulo de persistencia del ransomware. Los backups fueron cifrados. El banco no puede recuperar sus sistemas. Fin del simulacro.`
    );
    return;
  }

  if (opt.extremeOutcome) {
    G.stage = 4;
    G.ctx   = 'C';
  }

  const logType = (opt.type === 'correct' || opt.type === 'lifesaver') ? 'correct' : (opt.type === 'recycled' ? 'ok' : 'trap');
  G.log.push({ stage: s.num, letter: opt.letter, text: opt.text, type: logType, typeLabel: opt.typeLabel, cost: effectiveCost, hours: opt.hours });

  const nextCtx = opt.nextCtx || 'A';
  showConsequenceReveal(opt, effectiveCost);

  G.revealed = true;
  document.getElementById('confirmBtn').textContent = 'AVANZAR →';
  document.getElementById('confirmBtn').onclick = () => advance(nextCtx, opt);

  updateSidebar();
  flashBudget(effectiveCost);
  addNotif('info', `Stage ${s.num}: Opción ${opt.letter}`, `${opt.text} — ${fmt(effectiveCost)}${opt.hours ? ` · +${opt.hours}h` : ''}`);
}

function showConsequenceReveal(opt, effectiveCost) {
  const s    = STAGES[G.stage];
  const main = document.getElementById('gameMain');

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
        <div class="cr2-text">${opt.consequence}</div>
      </div>
      <div class="cr2-branch">
        <div class="cr2-branch-label">// BIFURCACIÓN</div>
        ${opt.branchNote}
      </div>
      <div class="cr2-budget-box">
        <div class="cr2-brow"><span>Costo de decisión</span><span class="cr2-val cr2-red">${effectiveCost > 0 ? '-' + fmt(effectiveCost) : '$0'}</span></div>
        ${opt.penalty && !opt.isPendingPenalty ? `<div class="cr2-brow"><span>Penalización inmediata</span><span class="cr2-val cr2-red">-${fmt(opt.penalty)}</span></div>` : ''}
        ${opt.penalty && opt.isPendingPenalty  ? `<div class="cr2-brow"><span>Penalización diferida</span><span class="cr2-val" style="color:var(--gold)">-${fmt(opt.penalty)} al final</span></div>` : ''}
        <div class="cr2-brow total"><span>Presupuesto actual</span><span class="cr2-val cr2-blue">${fmt(G.budget)}</span></div>
        <div class="cr2-brow"><span>Horas consumidas</span><span class="cr2-val">${G.hours}h / ${HOURS_LIMIT}h</span></div>
      </div>
    </div>
  </div>`;

  main.insertAdjacentHTML('beforeend', html);
  main.scrollTop = 99999;
}

// ══════════════════════════════════════════
// AVANZAR AL SIGUIENTE STAGE
// ══════════════════════════════════════════
function advance(nextCtx, opt) {
  G.revealed = false;
  G.chosen   = null;

  if (G.stage >= 4) { showFinal(); return; }

  G.stage++;

  if (opt && opt.extremeOutcome) {
    G.stage = 4;
    G.ctx   = 'C';
  } else {
    const variants = Object.keys(STAGES[G.stage].variants);
    G.ctx = variants.includes(nextCtx) ? nextCtx : (variants.includes('default') ? 'default' : variants[0]);
  }

  renderRoundIndicator();
  renderStage();
  updateSidebar();
  document.getElementById('gameMain').scrollTop = 0;
  addNotif('branch', `▶ Avanzando a Stage ${G.stage + 1}`, `Contexto: ${G.ctx}`);
}

// ══════════════════════════════════════════
// CÁLCULO DE ESTADO — STAGE 5
// ══════════════════════════════════════════
function computeStage5State() {
  const budgetUsedPct = (BUDGET_INIT - G.budget) / BUDGET_INIT;

  if (G.flags.licenseRevoked || G.flags.backupsDestroyed) {
    return { ctx:'D', label:'CRÍTICO', reason:'Backups destruidos o licencia revocada. El banco está ante una crisis existencial.' };
  }
  if (!G.flags.openedMonday && G.penalties >= 3000000) {
    return { ctx:'D', label:'CRÍTICO', reason:'No abrieron el lunes y las penalizaciones superan $3M.' };
  }
  if (!G.flags.openedMonday) {
    return { ctx:'C', label:'GRAVE', reason:'No lograron abrir el lunes. Supervisión regulatoria activa.' };
  }
  if (G.penalties >= 1000000 || budgetUsedPct > 0.7) {
    return { ctx:'B', label:'MEDIO', reason:'Abrieron el lunes pero la gestión fue costosa y cuestionable.' };
  }
  return { ctx:'A', label:'LEVE', reason:'Abrieron el lunes con presupuesto saludable y gestión sólida.' };
}

// ══════════════════════════════════════════
// PANTALLA FINAL
// ══════════════════════════════════════════
function showFinal() {
  G.flags.pendingPenalties.forEach(p => { G.budget -= p.amount; G.penalties += p.amount; });

  const lastOpt = G.log[G.log.length - 1];
  if (lastOpt && lastOpt.letter === 'B') {
    const state = computeStage5State();
    const s5Penalty = state.ctx === 'C' ? 500000 : state.ctx === 'D' ? 1000000 : 0;
    G.budget -= s5Penalty;
    G.penalties += s5Penalty;
  }

  const budgetFinal = G.budget;
  const state = computeStage5State();

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

  document.getElementById('finalEyebrow').textContent = eyebrows[state.ctx];
  document.getElementById('finalEyebrow').style.color = colors[state.ctx];
  document.getElementById('finalTitle').innerHTML = titles[state.ctx];
  document.getElementById('finalSub').textContent = subs[state.ctx];
  document.getElementById('finalBudget').textContent = fmt(budgetFinal);
  document.getElementById('finalBudget').style.color = budgetFinal >= 0 ? colors[state.ctx] : 'var(--accent)';
  document.getElementById('finalTeamLabel').textContent = `${G.team.name} · ${G.hours}h consumidas · ${G.log.length} decisiones`;

  const correct = G.log.filter(l => l.type === 'correct').length;
  const traps   = G.log.filter(l => l.type === 'trap').length;
  document.getElementById('finalStats').innerHTML = `
    <div class="fstat"><div class="fstat-val" style="color:var(--success)">${correct}</div><div class="fstat-lbl">Óptimas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--accent)">${traps}</div><div class="fstat-lbl">Trampas caídas</div></div>
    <div class="fstat"><div class="fstat-val" style="color:var(--info)">${G.hours}h</div><div class="fstat-lbl">Horas usadas</div></div>`;

  let narrative = `<div class="story-narrative" style="margin-bottom:1.25rem"><div class="sn-title">REGISTRO DE DECISIONES</div>`;
  G.log.forEach(e => {
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
      <div class="bn-row"><span>Costos operativos</span><span class="bn-val bn-red">-${fmt(G.costs)}</span></div>
      <div class="bn-row"><span>Penalizaciones</span><span class="bn-val bn-red">-${fmt(G.penalties)}</span></div>
      <div class="bn-row bn-total"><span>Presupuesto final</span><span class="bn-val" style="color:${budgetFinal >= 0 ? 'var(--success)' : 'var(--accent)'}">${fmt(budgetFinal)}</span></div>
    </div>
    ${G.flags.pendingPenalties.length > 0 ? `<div class="bn-bonus" style="background:var(--accent-light);border-color:var(--accent-border);color:var(--accent);margin-top:.7rem">Penalizaciones diferidas: ${G.flags.pendingPenalties.map(p => p.label + ' (-' + fmt(p.amount) + ')').join(', ')}</div>` : ''}
  </div>`;

  narrative += `<div class="optimal-path">
    <div class="op-title">CAMINO ÓPTIMO (para comparar)</div>
    <div class="op-step"><div class="op-step-head"><span class="op-step-num">STAGE 1</span><span class="op-step-name">Contención Lógica (C)</span></div><div class="op-action">$50,000 · 6h → Evidencia asegurada, Core a salvo</div></div>
    <div class="op-step"><div class="op-step-head"><span class="op-step-num">STAGE 2</span><span class="op-step-name">Equipo IR / Ganar Tiempo (C)</span></div><div class="op-action">$50,000 · 8h → Reloj congelado, Core estable</div></div>
    <div class="op-step"><div class="op-step-head"><span class="op-step-num">STAGE 3</span><span class="op-step-name">Comunicación SGSI (C) o Threat Hunting (D)</span></div><div class="op-action">$250k–$300k · 6–18h → Reputación salvada, red limpia</div></div>
    <div class="op-step"><div class="op-step-head"><span class="op-step-num">STAGE 4</span><span class="op-step-name">Degradación Aceptable / DRP (B)</span></div><div class="op-action">$800,000 · 18h → Banco abre el lunes al 60%</div></div>
    <div class="op-step"><div class="op-step-head"><span class="op-step-num">STAGE 5</span><span class="op-step-name">Transparencia SGSI (B)</span></div><div class="op-action">$150,000 · Multa $0 en estado Leve/Medio</div></div>
    <div style="margin-top:.85rem;padding:.6rem;background:var(--success-light);border-radius:5px;font-family:'DM Mono',monospace;font-size:.68rem;color:var(--success)">COSTO ÓPTIMO TOTAL: ~$1,300,000 · PRESUPUESTO RESTANTE: ~$3,700,000</div>
  </div>`;

  document.getElementById('finalNarrativeArea').innerHTML = narrative;
}

// ══════════════════════════════════════════
// GAME OVER
// ══════════════════════════════════════════
function showGameOver(title, reason) {
  showScreen('screenOver');
  document.getElementById('goTitle').textContent = title;
  document.getElementById('goSub').textContent   = reason;
}

// ══════════════════════════════════════════
// SIDEBAR & HELPERS DE UI
// ══════════════════════════════════════════
function updateSidebar() {
  document.getElementById('budgetVal').textContent      = fmt(G.budget);
  document.getElementById('blCosts').textContent        = '-' + fmt(G.costs);
  document.getElementById('blPenalties').textContent    = G.penalties > 0 ? '-' + fmt(G.penalties) : '$0';
  document.getElementById('blAvailable').textContent    = fmt(G.budget);
  document.getElementById('blAvailable').style.color    = G.budget < 1000000 ? 'var(--accent)' : G.budget < 2000000 ? '#e6a817' : 'var(--info)';
  document.getElementById('budgetVal').style.color      = G.budget < 0 ? 'var(--accent)' : G.budget < 1500000 ? '#e6a817' : '#e5ddd5';

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
  if (ctxMap[G.ctx]) {
    ctxBox.style.color = ctxMap[G.ctx][0];
    ctxBox.textContent = ctxMap[G.ctx][1];
  } else {
    ctxBox.style.color = 'var(--muted)';
    ctxBox.textContent = 'Sin bifurcación activa';
  }

  const pp = document.getElementById('penaltiesList');
  if (G.flags.pendingPenalties.length === 0) {
    pp.textContent  = 'Ninguna';
    pp.style.color  = 'var(--muted)';
  } else {
    pp.innerHTML = G.flags.pendingPenalties.map(p =>
      `<div class="penalty-box" style="margin-bottom:.3rem"><div class="penalty-lbl">DIFERIDA</div>${p.label}: -${fmt(p.amount)}</div>`
    ).join('');
  }

  const dl = document.getElementById('decisionLog');
  dl.innerHTML = G.log.length === 0
    ? '<div style="font-size:.76rem;color:var(--muted)">Sin decisiones aún.</div>'
    : G.log.map(e => `
        <div class="log-entry log-${e.type}">
          <div class="log-lbl">STAGE ${e.stage} · OPT ${e.letter} · ${e.typeLabel}</div>
          ${e.text} — ${fmt(e.cost)}${e.hours ? ' · +' + e.hours + 'h' : ''}
        </div>`).join('');

  const badge = document.getElementById('notifBadge');
  badge.style.display  = G.unread > 0 ? 'flex' : 'none';
  badge.textContent    = G.unread;
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
}

function flashBudget(cost) {
  const toast  = document.getElementById('budgetToast');
  toast.className  = cost > 500000 ? 'toast-red' : cost > 100000 ? 'toast-amber' : 'toast-green';
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
