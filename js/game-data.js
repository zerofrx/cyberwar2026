// ══════════════════════════════════════════
// game-data.js — Datos puros del juego (ÚNICA fuente de verdad)
// Importado por group.js y facilitator.js (multijugador) y por gm.js
// (single-player). Ya no hay copias inline que puedan desincronizarse.
// ══════════════════════════════════════════

export const BUDGET_INIT = 5000000;
export const HOURS_LIMIT = 72;
// Techo de reputación INSTITUCIONAL FINAL alcanzable tras el incidente,
// sin importar qué tan bien se gestionó la crisis (ver computeStage5State).
// Sufrir un ransomware con robo de datos ya es un evento público — no hay
// gestión perfecta que borre ese daño reputacional por completo.
export const MAX_FINAL_REPUTATION = 50;
// Umbrales de color/etiqueta para la reputación FINAL (post Stage 5), en la
// misma proporción que antes (70/40/25 sobre 100) pero reescalados al nuevo
// techo — si MAX_FINAL_REPUTATION cambia, estos se recalculan solos.
export const REP_TIER_GOOD = Math.round(MAX_FINAL_REPUTATION * 0.70);
export const REP_TIER_MID  = Math.round(MAX_FINAL_REPUTATION * 0.40);
export const REP_TIER_CRIT = Math.round(MAX_FINAL_REPUTATION * 0.25);

export const fmt = n =>
  (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');

// ── Glosario técnico ──────────────────────────
// Para que roles no técnicos (RRHH, sucursales, atención al cliente, etc.)
// entiendan la jerga sin tener que salir a buscarla. glossarize() envuelve
// la primera aparición de cada término en un <span> con tooltip, saltando
// el contenido que ya está dentro de etiquetas HTML.
// Nota: las claves se usan como expresión regular (por eso el punto escapado
// en LockBit 3\.0). Se puede usar alternancia/opcionales para cubrir variantes
// de una palabra en una sola entrada (ej. backups?, cifrad[oa]s?).
export const GLOSSARY = {
  // ── Programas y ataques ─────────────────────
  'ransomware':         'Programa malicioso que le pone candado (cifra) a los archivos de una computadora y pide un pago —un rescate— para devolverlos.',
  'malware':            'Cualquier programa creado para dañar, espiar o tomar el control de un equipo. El ransomware es un tipo de malware.',
  'LockBit 3\\.0':       'El nombre específico del programa malicioso (ransomware) que atacó al banco en este simulacro.',
  'payload':            'La parte dañina de un programa malicioso: el "cargamento" que ejecuta el ataque una vez que logró entrar al equipo.',
  'phishing':           'Correo o mensaje falso diseñado para engañar a alguien y robarle datos o accesos.',
  'backdoors?':         'Puerta trasera oculta que un atacante deja en el sistema para poder volver a entrar más adelante sin ser detectado.',
  'doble extorsión':    'Táctica en la que el atacante no solo secuestra los archivos, sino que además amenaza con publicar los datos robados si no se paga.',
  'movimiento lateral': 'La técnica del atacante para, una vez adentro, ir saltando de un equipo a otro hasta llegar a los sistemas más importantes.',
  'vector de entrada':  'La puerta por la que el atacante logró entrar. En este caso, una app descargada por un empleado.',
  'exfiltración':       'Robo de información: copiar y sacar datos del banco hacia los servidores del atacante, normalmente sin que nadie lo note.',

  // ── Acciones técnicas ───────────────────────
  'cifrad[oa]s?':       'Archivos "con candado": el ransomware los bloqueó con una clave secreta y quedan ilegibles hasta que se tenga esa clave.',
  'cifrar':             'Ponerle un candado digital a los archivos con una clave secreta, de modo que nadie pueda leerlos sin ella.',
  'AES-256':            'Un método de cifrado muy fuerte. Cuando el ransomware lo usa, es casi imposible recuperar los archivos sin la clave del atacante.',
  'aislar':             'Desconectar una parte de la red del resto para que un ataque no se propague, como cerrar una puerta cortafuego.',
  'segmento':           'Una parte separada de la red del banco. Aislar un segmento es "cerrarle las puertas" para que un ataque no llegue al resto.',

  // ── Herramientas y equipos de defensa ───────
  'EDR':                'Programa que vigila cada computadora del banco y avisa en tiempo real cuando detecta algo sospechoso. Como una cámara de seguridad por equipo.',
  'XDR':                'Tecnología que combina la vigilancia de las computadoras, la red y el correo en una sola herramienta para detectar y frenar ataques.',
  'SIEM':               'Sistema que junta todas las alertas de seguridad de la empresa en un solo tablero, para verlas de forma centralizada.',
  'SOC':                'Centro de Operaciones de Seguridad: el equipo (o la sala) que vigila las alertas de seguridad del banco de forma permanente.',
  'MDR':                'Servicio externo contratado que vigila la red y responde a amenazas las 24 horas, en lugar de tener ese equipo dentro del banco.',
  'firewall':           'Barrera digital que filtra el tráfico de internet y bloquea conexiones no autorizadas hacia la red del banco.',
  'sandbox':            'Cuarto aislado y seguro donde se puede abrir un archivo sospechoso sin riesgo de que contamine el resto de la red.',
  'Incident Response':  'Respuesta a Incidentes: el equipo especializado que se activa para contener y resolver un ciberataque mientras está ocurriendo.',
  'Threat Hunting':     'Salir a buscar activamente amenazas escondidas en la red, en vez de esperar a que una alarma avise.',
  'Threat Intel':       'Inteligencia de amenazas: información recopilada sobre atacantes activos —quiénes son, cómo operan y qué suelen pedir.',
  'PAM':                'Control de las cuentas de "administrador", las que pueden cambiarlo todo. Son las llaves maestras del banco y hay que protegerlas.',

  // ── Datos, evidencia y recuperación ─────────
  'RAM':                'Memoria temporal de la computadora. Mientras el equipo está encendido, ahí quedan huellas de lo que hizo el atacante — por eso es tan valiosa antes de apagar nada.',
  'forense':            'El proceso de investigar técnicamente qué pasó durante el ataque: cómo entraron, qué tocaron y desde cuándo.',
  'backups?':           'Copia de respaldo: una copia guardada de los datos del banco para poder restaurarlos si los originales se dañan o se pierden.',
  'credenciales':       'Las llaves de acceso a un sistema: usuario y contraseña (y a veces un código extra).',
  'endpoints?':         'Cada equipo conectado a la red del banco: computadoras, laptops, servidores. Son los puntos donde suele empezar un ataque.',
  'Core Bancario':      'El sistema central que procesa las cuentas, saldos y transacciones de todos los clientes del banco.',
  'modo degradado':     'Operar solo con los servicios esenciales, a capacidad reducida, mientras se termina de recuperar el resto.',
  'DRP':                'Plan de Recuperación de Desastres: el procedimiento preparado de antemano para volver a operar tras una falla grave.',

  // ── Dinero digital del rescate ──────────────
  'Bitcoin':            'Moneda digital que se usa por internet sin bancos de por medio. Es difícil de rastrear, por eso los atacantes suelen pedir el rescate en Bitcoin.',
  'USDT':               'Una moneda digital atada al valor del dólar, usada para pagos por internet difíciles de rastrear.',
  'blockchain':         'El registro público y digital donde quedan anotadas todas las operaciones hechas con monedas como Bitcoin.',

  // ── Regulación y normas ─────────────────────
  'SGSI':               'Sistema de Gestión de Seguridad de la Información: el protocolo interno del banco para prevenir y responder a incidentes de seguridad.',
  'BCP':                'La Superintendencia / Banco Central: el regulador que supervisa que el banco cumpla las normas.',
  'ISO 27001':          'Norma internacional que define las buenas prácticas para proteger la información de una organización.',

  // ── Consecuencias de negocio ────────────────
  'lucro cesante':      'El dinero que el banco deja de ganar mientras sus sistemas están detenidos y no puede operar.',
  'corrida bancaria':   'Cuando muchos clientes, por miedo, intentan sacar su dinero al mismo tiempo. Puede poner en riesgo al banco aunque el problema original fuera otro.',
};

export function glossarize(html) {
  if (!html) return html;
  const parts = html.split(/(<[^>]+>)/);
  const used  = new Set();
  return parts.map(part => {
    if (part.startsWith('<')) return part; // no tocar etiquetas HTML
    let out = part;
    for (const [term, def] of Object.entries(GLOSSARY)) {
      if (used.has(term)) continue;
      const re = new RegExp(`\\b(${term})\\b`, 'i');
      if (re.test(out)) {
        used.add(term);
        const safeDef = def.replace(/"/g, '&quot;');
        out = out.replace(re, (m) =>
          `<span class="glossary-term" tabindex="0" title="${safeDef}" data-def="${safeDef}">${m}</span>`);
      }
    }
    return out;
  }).join('');
}

// ── 5 Etapas del simulacro ───────────────────
export const STAGES = [

// ─── STAGE 1 ────────────────────────────────
{
  num: 1, label: 'STAGE 1 DE 5', timestamp: 'Viernes, 10:00 AM',
  status: 'INCIDENTE ACTIVO · VIERNES 10:00 AM',
  title: 'La Infección Silenciosa',
  variants: {
    default: {
      narrative: 'Varios sistemas reportan lentitud inusual desde hace 30 minutos. Varios empleados encuentran archivos con extensión <strong>.locked</strong> en sus carpetas de trabajo. Un desarrollador del área de TI menciona que hace unos días instaló una herramienta de <strong>Inteligencia Artificial</strong> que encontró en internet para automatizar tareas — como desarrollador, tenía permisos elevados en el equipo y la ejecutó sin mayor revisión. El Core Bancario sigue operando con normalidad. No hay alertas en el SOC. La situación parece ser un problema menor de software.',
      update: null,
      branchCtx: null
    }
  },
  question: '¿Cuál es la primera acción del equipo de respuesta?',
  impact: 'ALTO',
  hints: [
    { type: 'info', title: '// THREAT INTEL — CERTFinanciero',  body: 'El malware solo cifró archivos en los equipos afectados. El Core Bancario sigue intacto. Contener la propagación es prioritario antes de cualquier limpieza o reinicio.' },
    { type: 'info', title: '// ANÁLISIS FORENSE PRELIMINAR',    body: 'Capturar imagen RAM antes de cualquier apagado es crítico. Una aplicación instalada recientemente por un desarrollador de TI con permisos elevados podría ser el origen. La evidencia se pierde permanentemente con el reinicio de los sistemas.' },
    { type: 'warn', title: '// AVISO — Proveedor XDR',          body: 'Nuestras soluciones detectan y eliminan ransomware en minutos. Despliegue inmediato puede neutralizar la amenaza antes de que se propague al Core.' },
    { type: 'warn', title: '// PROTOCOLO INTERNO — TI',         body: 'Ante incidentes de cifrado masivo, el apagado preventivo total protege el Core Bancario de propagación lateral. Procedimiento estándar activado.' },
  ],
  options: [
    {
      letter:'A', text:'Antivirus Express',
      sub:'Lanzar un escaneo de emergencia con el antivirus corporativo en los equipos afectados',
      cost:40000, hours:4,
      type:'trap', typeLabel:'TRAMPA', repCost:5,
      correctTools:['sandbox'],
      consequence:'El escaneo destruye la evidencia digital forense. Al intentar eliminar el malware, este activa un módulo de robo de credenciales que captura las claves nuevas generadas durante el proceso. No se logra contener el ataque.',
      waitStory:'Las herramientas del antivirus no distinguen entre un archivo legítimo y evidencia digital crítica. En cuestión de minutos, los logs de memoria que identificaban al atacante fueron sobrescritos sin posibilidad de recuperación. El equipo forense llega más tarde y encuentra el escenario destruido: sin huellas, sin vector de entrada, sin rastro del malware original.\n\nPero hay algo peor. Durante el escaneo, el módulo de robo de credenciales integrado en el ransomware se activó silenciosamente. Las nuevas contraseñas generadas por el proceso de "limpieza" —las que el equipo usó pensando que estaban protegidas— ya están en manos del atacante. Sin saberlo, acaban de entregarle acceso con credenciales válidas al perímetro interno del banco.\n\nEl próximo ciclo comenzará en caos total: sin evidencia forense, con credenciales comprometidas y con el atacante posicionado mucho más adentro de lo que nadie sabe todavía. Cada decisión del siguiente stage será exponencialmente más costosa. Piensen bien cómo quieren usar los recursos que les quedan.',
      branchNote:'→ Stage 2, Contexto B (caos activo)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'B', text:'Apagón Preventivo',
      sub:'Apagar toda la infraestructura bancaria como medida de contención total',
      cost:600000, hours:2,
      type:'trap', typeLabel:'TRAMPA DE PÁNICO', repCost:15,
      correctTools:['backupverify'],
      consequence:'El apagón masivo causa un lucro cesante millonario injustificado. Al no haber investigado, no se sabe si era necesario. Además el Core Bancario se corrompe parcialmente durante el apagado de emergencia.',
      waitStory:'El apagón masivo detuvo todos los sistemas en 0.3 segundos. También detuvo: las 1,240 transacciones en vuelo del viernes, el sistema de nómina que procesaría pagos el sábado, y los procesos de cierre del día que garantizaban la integridad contable. El lucro cesante de dos horas de downtime bancario superó los $600,000 —sin que hubiera siquiera confirmación de si el ataque era real.\n\nSin evidencia previa, el equipo no sabe qué cifrar, qué restaurar ni por dónde empezar. El Core Bancario, al cortarle el suministro sin un proceso de apagado limpio, reporta sectores corrompidos en las tablas de transacciones. Los técnicos pasan las siguientes horas intentando entender qué pasó, mientras el atacante —que sí lo sabe— tiene tiempo de sobra para reorganizarse.\n\nLlegan al próximo ciclo sin información, sin evidencia y con millones ya gastados. Recuerden: en una crisis de ciberseguridad, actuar sin datos es casi siempre peor que no actuar. El siguiente stage los pondrá frente a decisiones donde la información es todavía más escasa.',
      branchNote:'→ Stage 2, Contexto B (caos y sin evidencia)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'C', text:'Aislar y Preservar Evidencia',
      sub:'Aislar los segmentos afectados, capturar imagen de RAM y preservar evidencia forense',
      cost:120000, hours:6,
      type:'correct', typeLabel:'CORRECTA', repCost:0,
      correctTools:['edr','siem','memforensics','sandbox'],
      consequence:'El equipo asegura evidencia digital valiosa. El análisis de RAM revela el ransomware activo. El Core Bancario queda protegido en un segmento aislado. Tienen evidencia para actuar en el Stage 2.',
      waitStory:'En las primeras seis horas, el equipo ejecutó el manual correctamente. Los segmentos afectados quedaron aislados con reglas de firewall de emergencia sin afectar el Core. La imagen RAM capturada a las 10:47 AM preservó el estado completo del malware en ejecución: su proceso madre, sus conexiones de red activas y —crucialmente— la clave de cifrado en memoria antes de que el malware la borrara automáticamente.\n\nEl análisis preliminar confirma: es LockBit 3.0, variante modificada. El vector de entrada fue una herramienta de Inteligencia Artificial descargada por un desarrollador del área de TI desde un sitio de terceros. La herramienta prometía acelerar tareas de desarrollo con IA generativa. Al ejecutarse con los permisos elevados que el desarrollador tenía por su rol, depositó silenciosamente el payload de LockBit en el sistema de archivos corporativo hace 18 días. El malware estuvo en modo sigiloso hasta activarse el viernes por la mañana. El equipo forense tiene ahora un perfil técnico completo del atacante y el origen exacto de la brecha.\n\nEntran al siguiente ciclo con ventaja táctica real: evidencia sólida, Core a salvo y tiempo para actuar con inteligencia. Pero la nota de rescate llegará pronto. La pregunta no es si van a recibir una extorsión —es qué harán cuando los números sean astronómicos y el reloj esté corriendo. Piensen cómo quieren manejar esa conversación.',
      branchNote:'→ Stage 2, Contexto A (evidencia asegurada)',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Línea de Crisis Premium',
      sub:'Activar de inmediato una línea de respuesta ejecutiva 24/7 con consultoría externa, antes de saber si hay un ataque real',
      cost:200000, hours:8,
      type:'trap', typeLabel:'PREMATURA', repCost:5,
      correctTools:['threatintel'],
      consequence:'Gastan recursos en una consultoría ejecutiva sin tener todavía información concreta del incidente. Los consultores se quedan esperando datos forenses que el equipo aún no produjo. El malware sigue propagándose durante las 8 horas que tardó en coordinarse la línea.',
      waitStory:'La firma de consultoría ejecutiva activó su protocolo de crisis a las 11:00 AM: tres consultores senior conectados por video, dos analistas en sede, una abogada y un experto en comunicaciones. Costo de activación: $200,000. Costo de información disponible para entregarles: cero.\n\nDurante ocho horas, los consultores hicieron exactamente lo que se supone que hacen en una crisis: pidieron informes forenses, evaluaciones de impacto y registros de evidencia. El equipo técnico, todavía sin haber contenido el incidente, no tenía nada concreto que entregar. Los consultores facturaron sus tarifas premium por hora mientras el malware avanzaba hacia los servidores de archivos corporativos y sondeaba el segmento de datos de clientes.\n\nEl próximo stage comienza con recursos comprometidos y el atacante en posición mucho más sólida. La consultoría de crisis ejecutiva es valiosa —pero solo cuando hay datos forenses concretos sobre los cuales decidir. La secuencia de las acciones importa tanto como las acciones mismas.',
      branchNote:'→ Stage 2, Contexto B (recursos desperdiciados)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'E', text:'Vigilancia Externa 24/7 (MDR)',
      sub:'Contratar un servicio gestionado (MDR) de emergencia que prometen desplegar en menos de 24 horas',
      cost:220000, hours:18,
      type:'trap', typeLabel:'PREMATURA', repCost:5,
      consequence:'El despliegue del servicio MDR tarda 18 horas en quedar operativo. Durante ese tiempo el ataque avanza sin freno. El servicio queda activo cuando ya es tarde para la fase de infección inicial. Falsa sensación de seguridad.',
      waitStory:'Dieciocho horas. Ese fue el tiempo que tardó el proveedor de MDR (Managed Detection and Response) en aprovisionar las licencias corporativas, desplegar los agentes en los 847 endpoints del banco, integrarse con la consola del SOC externo y completar la línea base de comportamiento. Dieciocho horas en las que el ransomware trabajó completamente sin obstáculos, con acceso libre a toda la red interna.\n\nEl servicio gestionado quedó operativo a las 4:00 AM del sábado —precisamente cuando el malware había completado su misión de cifrado. Las primeras alertas que generó el SOC externo documentaban un ataque ya consumado: 23,000 archivos cifrados, 4 servidores comprometidos, y una nota de rescate activa desde la medianoche. El servicio funcionaba perfectamente. Solo que llegó tarde.\n\nEl próximo stage comienza con un servicio de detección impecable y nada útil que detectar. El dinero gastado no tiene retorno inmediato. Lo que no puede recuperarse son las 18 horas de ventana donde el ataque avanzó sin respuesta. Piensen en qué pueden hacer todavía con los recursos que les quedan.',
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
      narrative: 'El análisis forense capturó la imagen RAM. Se identificó la variante de ransomware <strong>LockBit 3.0</strong>. Aparece una nota de rescate exigiendo <strong>$1,200,000 USD</strong> en Bitcoin en 48 horas. El Core Bancario está a salvo dentro del segmento aislado. El equipo tiene evidencia sólida y tiempo para actuar con inteligencia.',
      update: '⚡ Forense confirma: el vector de entrada fue una app de IA descargada por un desarrollador de TI hace 18 días. Al tener permisos elevados, el malware se instaló sin obstáculos.',
      branchCtx: '✓ CONTEXTO A — Evidencia asegurada. Core a salvo. Actuaron bien en Stage 1.'
    },
    B: {
      narrative: 'Caos operativo. Los sistemas caídos generan llamadas de pánico desde las sucursales. TI cree que es una falla de la base de datos Oracle. Sin evidencia forense. No saben que es ransomware. El Core Bancario muestra señales de inestabilidad. La situación se deteriora por horas.',
      update: '⚡ Un técnico encuentra por casualidad una nota cifrada en el servidor de archivos. El mensaje exige $1,200,000 USD. Nadie sabe qué cifraron ni qué tan profundo llegó.',
      branchCtx: '⚠ CONTEXTO B — Sin evidencia. Core en riesgo. Las decisiones previas los trajeron aquí.'
    }
  },
  question: '¿Cómo responde el equipo ante la nota de rescate?',
  impact: 'CRÍTICO',
  hints: [
    { type: 'info', title: '// THREAT INTEL — FBI CyberDivision',  body: 'El 80% de pagos de rescate a LockBit no resultan en recuperación total. Su modelo de doble extorsión continúa incluso después del pago.' },
    { type: 'info', title: '// EQUIPO IR EXTERNO — Disponibilidad', body: 'Equipos de Incident Response especializados en ransomware tienen acceso a herramientas de descifrado y contactos directos con autoridades. Tiempo de movilización: 8h.' },
    { type: 'warn', title: '// INFORME INTERNO — Área de TI',       body: 'Confirmado: los backups del Core Bancario siguen intactos en el servidor de respaldo secundario. Restauración posible en aproximadamente 4 horas.' },
    { type: 'warn', title: '// OFERTA DE SERVICIOS RECIBIDA',       body: 'Negociador especializado en LockBit disponible. Tarifa única: $500,000 USD. Historial de resoluciones exitosas en el 95% de casos. Contacto disponible de inmediato.' },
  ],
  options: [
    {
      letter:'A', text:'Restaurar desde Copias de Respaldo',
      sub:'Activar la restauración desde los últimos backups del sistema para recuperar los archivos',
      cost:80000, hours:4,
      type:'trap', typeLabel:'TRAMPA', repCost:10,
      correctTools:['backupverify'],
      consequence:'El ransomware tenía un módulo de persistencia en el servidor de backups. Al activar la restauración, cifra también los backups. Pierden la única copia de seguridad. Se aplica penalización de $1,000,000 al finalizar el juego.',
      waitStory:'Cuando el técnico ejecutó el comando de restauración, la sala quedó en silencio. Segundos después, los monitores comenzaron a mostrar barras de progreso que avanzaban demasiado rápido —demasiado rápido para ser una restauración real. El módulo de persistencia del ransomware, instalado semanas antes precisamente en el servidor de backups, se activó ante la actividad inusual y ejecutó su segunda fase de cifrado.\n\nEn 47 minutos, las doce semanas de backups disponibles quedaron cifradas. La única copia de seguridad del banco dejó de existir como tal. No hay recuperación posible sin los archivos originales en manos del atacante, que ahora tiene todavía más poder de negociación. Los backups son la última línea de defensa en una crisis de ransomware —y acaban de perderla.\n\nEl siguiente stage llega con una deuda invisible: $1,000,000 de penalización diferida que aparecerá en el resultado final. Más grave aún: sin backups, cualquier decisión de recuperación técnica en los stages siguientes será mucho más costosa y arriesgada. Antes de decidir en el próximo ciclo, piensen en lo que tienen disponible para recuperar. La respuesta puede sorprenderlos.',
      branchNote:'PENALIZACIÓN: -$1,000,000 al final. Backups destruidos.',
      penalty:1000000, isPendingPenalty:true, penaltyLabel:'Backups destruidos',
      destroysBackups:true, nextCtx:'B'
    },
    {
      letter:'B', text:'Reforzar Contención con Evidencia Adicional',
      sub:'Aislar los sectores restantes y capturar evidencia adicional para reconstruir el ataque',
      cost:200000, hours:10,
      type:'recycled', typeLabel:'TARDÍA', repCost:5,
      correctTools:['edr','siem'],
      consequence:'Si llegan sin evidencia previa asegurada, el costo se triplica a $600,000 por el trabajo extra de reconstruir evidencia destruida. Logran identificar el ransomware y pasan al siguiente stage con evidencia parcial.',
      waitStory:'El equipo demostró que un procedimiento correcto todavía puede salvar la situación. La imagen RAM parcial y los fragmentos de log recuperados permitieron al equipo forense reconstruir aproximadamente el 60% de la cadena de ataque. No es la evidencia ideal, pero es suficiente para trabajar con ella.\n\nSi llegaban sin evidencia previa asegurada, el costo fue significativamente mayor: reconstruir evidencia destruida requiere herramientas especializadas, tiempo en sala limpia y un peritaje externo que costó tres veces más de lo que habría costado asegurarla desde el principio. La factura refleja exactamente el precio de las decisiones anteriores: $400,000 de sobrecosto que no existiría si hubieran contenido primero.\n\nEntran al siguiente ciclo con evidencia parcial y el Core estabilizado. No es la posición ideal, pero es una posición gestionable. Recuerden que el próximo stage traerá presión mediática y regulatoria —y con evidencia parcial, la respuesta a esas preguntas será más difícil de dar. Piensen qué información tienen disponible y cómo pueden usarla.',
      branchNote:'→ Stage 3, evidencia recuperada (costo elevado si no había evidencia previa)',
      penalty:0, ctxBMultiplier:3, nextCtx:'A'
    },
    {
      letter:'C', text:'Equipo Externo de Respuesta y Ganar Tiempo',
      sub:'Contratar un equipo de Incident Response externo y negociar tiempo con el atacante',
      cost:150000, hours:8,
      type:'correct', typeLabel:'CORRECTA', repCost:0,
      correctTools:['threatintel','negociador'],
      consequence:'El equipo IR congela el reloj de la extorsión. Ganan tiempo operativo. Mantienen el Core estable. El atacante acepta "negociar" —lo que da espacio para la respuesta técnica sin pagar nada.',
      waitStory:'El equipo de Incident Response llegó a la sede central a las 10:30 AM del sábado. Lo primero que hicieron fue abrir un canal de comunicación con el atacante —no para negociar el pago, sino para comprar tiempo técnico. "Necesitamos verificar internamente la disponibilidad de fondos", fue el mensaje. El atacante, acostumbrado a este intercambio, aceptó extender el plazo 24 horas.\n\nEsas 24 horas son oro puro. Mientras el equipo IR mantenía ocupado al atacante con comunicaciones deliberadamente lentas, el equipo técnico desplegó herramientas de análisis avanzado, identificó los vectores de propagación activos y bloqueó los canales de comando y control del ransomware. El Core Bancario quedó estabilizado detrás de un segmento temporal que el IR construyó en 4 horas. Sin pagar un solo centavo.\n\nEl siguiente stage comienza con tiempo comprado, Core estable y un equipo externo con experiencia real en ransomware bancario. Pero el tiempo comprado no es tiempo indefinido —el atacante tiene límites de paciencia. En el próximo ciclo llegará la presión regulatoria y mediática. Cómo responden a esas dos frentes simultáneamente determinará si la crisis se contiene o explota hacia otro lado.',
      branchNote:'→ Stage 3, Contexto A',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Pago Silencioso',
      sub:'Pagar el rescate de $1,200,000 en Bitcoin sin notificar a las autoridades',
      cost:1200000, hours:2,
      type:'trap', typeLabel:'TRAMPA EJECUTIVA', repCost:25,
      correctTools:['negociador'],
      consequence:'El pago es ilegal según la regulación financiera. El grupo ransomware recibe el pago pero envía una segunda nota exigiendo $800,000 adicionales —extorsión doble. El dinero se perdió y la situación empeoró.',
      waitStory:'El equivalente a $1,200,000 en Bitcoin salió de la billetera corporativa a las 10:17 AM del sábado. La transacción fue confirmada por la red blockchain en 12 minutos. El CEO esperaba recibir las claves de descifrado en las horas siguientes. En cambio, a las 11:05 AM llegó un nuevo correo al mismo canal: "Buen intento. Tenemos copias de los datos en servidores adicionales que no mencionamos. Precio final: $800,000 adicionales. Tienen 12 horas. Próxima filtración: datos de nómina de los últimos 3 años."\n\nLos $1,200,000 se fueron y no hay forma legal ni técnica de recuperarlos. El banco ahora es un objetivo conocido que paga —lo que lo convierte en blanco prioritario para ataques futuros del mismo grupo y de grupos que monitorean estos pagos en blockchain. Además, el pago de rescate sin notificación a las autoridades constituye una infracción regulatoria grave que el BCP tratará como agravante.\n\nEl siguiente stage llega con la segunda extorsión activa, una amenaza de filtración de datos de nómina y la ilegalidad del pago como contexto. Cada decisión del próximo ciclo cargará el peso de este doble error. Piensen cómo pueden recuperar algo de terreno cuando el margen financiero y regulatorio se ha reducido tanto.',
      branchNote:'→ Stage 3, Contexto B (ilegalidad + extorsión doble)',
      penalty:0, paidRansom:true, nextCtx:'B'
    },
    {
      letter:'E', text:'Comunicado a Clientes',
      sub:'Emitir un comunicado público a los 180,000 clientes antes de saber qué datos fueron comprometidos',
      cost:80000, hours:6,
      type:'trap', typeLabel:'PREMATURA', repCost:20,
      correctTools:['legalbcp'],
      consequence:'Sin saber qué fue cifrado ni qué datos se vieron afectados, el comunicado genera alarma masiva. Se inicia una corrida bancaria digital. El regulador llama furioso. El daño reputacional multiplica la crisis.',
      waitStory:'El comunicado se publicó a las 9:00 AM del sábado con la mejor intención: transparencia proactiva. Para las 10:30 AM, el hashtag #MeridianHackeado tenía 47,000 menciones en redes sociales. Para las 11:30 AM, las líneas de atención al cliente estaban completamente saturadas. Para el mediodía, los cajeros automáticos registraban volúmenes de retiro ocho veces superiores al promedio de un sábado.\n\nEl problema no fue comunicar —fue comunicar sin información. El mensaje no pudo responder las preguntas básicas que cualquier cliente se haría: ¿Qué datos fueron afectados específicamente? ¿Están seguros mis ahorros? ¿El banco sigue operando? Sin respuestas concretas, los 180,000 clientes asumieron el peor escenario posible y actuaron en consecuencia. La corrida bancaria digital no fue causada por el ataque —fue causada por el comunicado prematuro.\n\nEl regulador llamó al CEO directamente a la 1:00 PM: "Esto no cumple el protocolo SGSI de manejo de incidentes." El siguiente stage llega con pánico en redes activo, el regulador en modo confrontacional y la prensa esperando cualquier nuevo error para amplificarlo. La comunicación en crisis tiene reglas muy específicas —y el timing lo es todo.',
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
      narrative: 'El equipo forense completó la trazabilidad del vector de entrada: una <strong>herramienta de IA</strong> descargada de un sitio no oficial por un <strong>desarrollador del área de TI</strong> hace 18 días. La aplicación se ejecutó con los permisos elevados del desarrollador y depositó silenciosamente el payload de LockBit, que estuvo en modo sigiloso hasta activarse el viernes. La prensa pregunta por rumores de una "interrupción operativa mayor". No hay pánico todavía pero la ventana de comunicación se cierra.',
      update: '⚡ El BCP envió un correo formal solicitando un informe preliminar en 4 horas. La respuesta que den determinará el tono de la relación con la autoridad.',
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
  hints: [
    { type: 'info',  title: '// ASESORÍA REGULATORIA — BCP',         body: 'Las instituciones que notifican proactivamente dentro de las 72h y presentan análisis forense completo reciben hasta un 60% de reducción en sanciones.' },
    { type: 'info',  title: '// MARCO SGSI — ISO 27001',              body: 'La identificación documentada del vector de entrada y el plan de mejora inmediata son los factores más valorados por auditores en revisiones post-incidente.' },
    { type: 'warn',  title: '// ANÁLISIS — Redes Sociales Internas',    body: '"#MeridianHackeado está siendo amplificado en redes. Un comunicado oficial podría escalar el pánico innecesariamente." — Monitoreo interno, 14:32h.' },
    { type: 'warn',  title: '// MEMO INTERNO — Jefatura de TI',          body: '"El desarrollador que instaló la herramienta violó la política de software autorizado. Documentar su negligencia individual podría proteger legalmente al banco ante el regulador." — Jefatura de TI.' },
  ],
  options: [
    {
      letter:'A', text:'Caza de Brujas',
      sub:'Suspender de inmediato al desarrollador responsable y comunicarlo públicamente como medida correctiva',
      cost:80000, hours:2,
      type:'trap', typeLabel:'TRAMPA', repCost:20,
      correctTools:['legalbcp'],
      consequence:'El desarrollador fue negligente al instalar software no autorizado, pero la causa raíz fue la ausencia de controles: ¿por qué un desarrollador podía instalar herramientas arbitrarias con permisos elevados? El regulador interpreta la suspensión pública como evasión de responsabilidades institucionales. Su abogado presenta una demanda por despido mediático sin debido proceso. Multa regulatoria por incumplir protocolos de investigación. Penalización: $1,000,000.',
      waitStory:'El desarrollador fue convocado a una reunión de crisis sin que nadie le explicara formalmente qué se le imputaba. Cuando salió 45 minutos después ya no tenía credenciales de acceso a los sistemas del banco. El comunicado interno lo nombraba como "empleado que comprometió los protocolos de seguridad institucionales". Salió del edificio sin entender si enfrentaba una sanción laboral, una denuncia penal, o ambas.\n\nLo que el análisis forense confirma: el desarrollador efectivamente instaló una herramienta de IA descargada de un sitio no oficial, violando la política de software autorizado. Pero también confirma algo más incómodo para el banco: el entorno del desarrollador tenía permisos elevados sin justificación documentada, no existía un mecanismo técnico de control de aplicaciones (application whitelisting), el SOC no monitoreaba procesos ejecutados con privilegios administrativos y no hubo capacitación vigente sobre el uso de herramientas de IA externas. El error individual existe, pero está enmarcado en un fallo de controles que el banco debía haber implementado.\n\nEl abogado del desarrollador presentó la demanda dos horas después de su suspensión, argumentando despido mediático sin debido proceso. El BCP inició una investigación paralela sobre por qué los controles del banco permitieron que un único empleado pudiera abrir un vector de ataque de esta magnitud. La multa de $1,000,000 es solo el costo visible. El costo real es la narrativa: un banco que culpa al individuo sin reconocer sus propias fallas de control tiene muy pocas probabilidades de recuperar la confianza del regulador antes del cierre de la crisis.',
      branchNote:'PENALIZACIÓN: -$1,000,000. Demanda laboral activa. → Stage 4, Contexto B',
      penalty:1000000, isPendingPenalty:false, laborLawsuit:true, nextCtx:'B'
    },
    {
      letter:'B', text:'Silencio Corporativo',
      sub:'No comunicar nada a clientes, prensa ni regulador hasta tener el panorama completo',
      cost:30000, hours:4,
      type:'trap', typeLabel:'TRAMPA LEGAL', repCost:30,
      consequence:'Ocultar un incidente material es una infracción regulatoria grave. El regulador descubre el silencio a través de un reporte externo. Multa máxima de $3,000,000. El banco queda bajo supervisión especial.',
      waitStory:'Durante cuatro horas, el equipo legal del banco argumentó que "hablar demasiado pronto podría comprometer la investigación". La lógica tenía sentido en abstracto. Durante esas mismas cuatro horas, un analista de seguridad independiente que detectó tráfico anómalo saliendo de servidores del banco publicó sus hallazgos en Twitter con capturas de pantalla. El regulador los vio antes de recibir cualquier comunicación oficial del banco.\n\nLa llamada del Superintendente de Bancos llegó a las 6:30 PM del sábado. No fue una solicitud de información. Fue una notificación de que se había iniciado formalmente un proceso sancionatorio por incumplimiento del artículo 112-bis del reglamento de gestión de riesgo operativo: ocultamiento de incidente material con impacto potencial en clientes. La ley no exige que el banco tenga el panorama completo para reportar —exige que reporte el incidente apenas lo detecta, aunque sea incompleto.\n\nLa multa de $3,000,000 es el piso, no el techo. El banco queda bajo supervisión especial, lo que significa que cada decisión en los stages siguientes tendrá un supervisor regulatorio mirando por encima del hombro. Operar bajo supervisión especial elimina opciones y multiplica los tiempos. La transparencia temprana —aunque incompleta— siempre es menos costosa que el silencio descubierto.',
      branchNote:'PENALIZACIÓN: -$3,000,000. Supervisión regulatoria. → Stage 4, Contexto B',
      penalty:3000000, isPendingPenalty:false, silentCorp:true, nextCtx:'B'
    },
    {
      letter:'C', text:'Comunicación por Protocolo Oficial (SGSI)',
      sub:'Activar el protocolo de comunicación del Sistema de Gestión de Seguridad de la Información',
      cost:180000, hours:6,
      type:'correct', typeLabel:'CORRECTA', repCost:-5,
      correctTools:['legalbcp','crisiscomms'],
      consequence:'El protocolo SGSI proporciona mensajes preaprobados para reguladores, clientes y prensa. Se frena el pánico. El regulador recibe el informe preliminar requerido. La reputación se estabiliza. El banco mantiene el control del relato.',
      waitStory:'A las 3:15 PM del sábado, tres comunicados salieron simultáneamente: uno para el regulador con el informe técnico preliminar en el formato exigido por la norma, uno para empleados con instrucciones operativas claras, y un mensaje público breve que confirmaba "una interrupción de sistemas bajo control activo" sin revelar detalles que pudieran comprometer la investigación o generar pánico adicional.\n\nEl protocolo SGSI existe precisamente para este momento. Los mensajes estaban preaprobados por el departamento legal, calibrados para dar información sin generar alarma y diseñados para cumplir con los plazos regulatorios de reporte. No es comunicación espontánea —es comunicación de crisis ejecutada con precisión. El regulador recibió el informe antes del plazo de cuatro horas. La respuesta fue escueta pero significativa: "Confirmamos recepción. Manténganos informados."\n\nEl siguiente stage llega con el regulador en modo colaborativo, la prensa con pocas razones para especular negativamente y el equipo técnico con espacio para trabajar sin interferencia externa. Eso no significa que sea fácil —el Stage 4 traerá la carrera más difícil del juego. Pero significa que tienen las condiciones mínimas para que la recuperación técnica sea posible. Un regulador aliado en el Stage 4 vale más que cualquier herramienta técnica.',
      branchNote:'→ Stage 4, Contexto A',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Búsqueda Activa de Intrusos',
      sub:'Lanzar una operación intensiva para identificar y eliminar todas las puertas traseras de la red',
      cost:250000, hours:18,
      type:'correct', typeLabel:'CORRECTA', repCost:0,
      correctTools:['threathunt','credrotation'],
      consequence:'El equipo encuentra y elimina 3 puertas traseras que el atacante dejó para persistencia. La red queda limpia. El tiempo consumido es alto pero la seguridad está garantizada para Stage 4.',
      waitStory:'Dieciocho horas de trabajo ininterrumpido. Tres equipos rotando en turnos de seis horas. El primer backdoor fue encontrado a las 10:00 PM del sábado en un servidor de autenticación secundario que nadie usaba desde hacía meses —precisamente por eso el atacante lo eligió. El segundo, a las 3:00 AM del domingo, embebido en un proceso de sincronización de bases de datos que se ejecutaba automáticamente cada noche. El tercero —el más sofisticado— fue descubierto a las 7:00 AM integrado dentro de un módulo de actualización automática del antivirus corporativo.\n\nTres niveles de persistencia. Si el banco hubiera iniciado la recuperación técnica sin esta operación, habría reactivado el ransomware desde el interior de sus propios sistemas de recuperación —el resultado habría sido catastrófico. La operación fue costosa en tiempo y dinero, pero el resultado es definitivo: red auditada con certificación forense de limpieza total.\n\nEl siguiente stage llega con una ventaja técnica única: cualquier proceso de recuperación puede ejecutarse sin miedo a reinfección. El reloj está más ajustado —18 horas menos disponibles para llegar al lunes— pero la seguridad de los sistemas está garantizada. En el Stage 4 deberán elegir qué hacer con esa ventaja. El tiempo es crítico: calcúlenlo bien antes de decidir.',
      branchNote:'→ Stage 4, Contexto A (red segura)',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'E', text:'Migrar a la Nube',
      sub:'Iniciar una migración de emergencia de toda la infraestructura a la nube en 48 horas',
      cost:1500000, hours:48,
      type:'extreme', typeLabel:'EXTREMA', repCost:15,
      consequence:'Una migración de arquitectura completa en 48 horas es técnicamente imposible. El equipo colapsa. El proyecto fracasa. Se consumen 48 horas del presupuesto temporal y $1.5M del presupuesto financiero. El banco no abre el lunes.',
      waitStory:'El equipo de infraestructura llevaba 28 horas trabajando sin descanso cuando el Gerente de TI entró a la sala y dijo en voz baja lo que todos sabían: "No vamos a terminar." La migración de una arquitectura bancaria certificada por el regulador requiere meses de planificación, pruebas de cumplimiento normativo, validación de integridad de datos y certificación del ambiente destino. No 48 horas de emergencia con equipos agotados.\n\nA las 36 horas, el 30% de la arquitectura estaba parcialmente migrada en un estado híbrido no certificado. El 70% restante seguía en los servidores originales, algunos ya comprometidos. La coexistencia de sistemas en dos ambientes generó inconsistencias en las bases de datos de clientes que ningún sistema podía resolver automáticamente. El ambiente nube no tenía las certificaciones regulatorias para operar en producción.\n\nEste camino lleva directamente al peor estado del Stage 5. El banco no abrirá el lunes. Los sistemas están en un estado intermedio que es técnicamente más complejo que el ataque original. Los $1,500,000 gastados no produjeron ningún resultado recuperable. La presentación ante el regulador en el Stage 5 comenzará desde el escenario más adverso posible. Utilicen los recursos que les quedan con máxima precisión.',
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
      narrative: 'Tienen la red segura y el control mediático. Sin embargo, los sistemas afectados requieren una reconstrucción completa. El equipo técnico estima un mínimo de <strong>36 horas</strong> para una restauración total del Core y los cajeros. El lunes a las 10:00 AM es la apertura operativa obligatoria —faltan exactamente 24 horas. La restauración completa no entra: hay que elegir otra estrategia.',
      update: '⚡ El equipo de DRP (Disaster Recovery Plan) propone un modo degradado: Core básico + cajeros + banca digital. Sería al 60% de capacidad pero cumple para abrir.',
      branchCtx: '✓ CONTEXTO A — Red segura. Control mediático. Tiempo justo para recuperación.'
    },
    B: {
      narrative: 'La red tiene posibles puertas traseras sin identificar. Los técnicos llevan 48 horas sin dormir. La moral del equipo es baja. La restauración completa tomaría mínimo <strong>36 horas</strong> y solo quedan <strong>24</strong> antes de la apertura obligatoria del lunes 10:00 AM. Cualquier error técnico ahora podría ser catastrófico.',
      update: '⚡ Un técnico advierte: "Si el ransomware todavía está en algún servidor de backup y lo activamos, perdemos todo." El riesgo de ejecutar scripts no auditados es máximo.',
      branchCtx: '⚠ CONTEXTO B — Red dudosa. Técnicos agotados. Riesgo de reinfección alto.'
    }
  },
  question: '¿Cómo ejecutan la recuperación de sistemas para abrir el lunes?',
  impact: 'CRÍTICO',
  hints: [
    { type: 'info',  title: '// INFORME DRP — Equipo de Recuperación', body: 'El Plan de Recuperación ante Desastres fue probado hace 6 meses con éxito. Modo degradado: Core básico + cajeros + banca digital al 60%. Suficiente para apertura regulatoria.' },
    { type: 'info',  title: '// REGULACIÓN BCP — Art. 52',           body: 'La apertura operativa el lunes, aunque sea parcial, cumple con el requisito regulatorio y evita la activación del protocolo de supervisión especial.' },
    { type: 'warn',  title: '// OFERTA TÉCNICA EXTERNA',              body: '"Ex-técnico de Banco Central cuenta con script de recuperación específico para LockBit 3.0. Costo simbólico: $20,000. Tiempo estimado: 12 horas." — Contacto intermediario.' },
    { type: 'warn',  title: '// INFORME DE MERCADO — Recovery Services', body: '"Recovery Solutions Inc. recuperó sistemas de 3 bancos latinoamericanos en semanas recientes. Track record sólido y verificado." — Reporte de servicios externos.' },
  ],
  options: [
    {
      letter:'A', text:'Programa Milagroso de un Foro',
      sub:'Ejecutar un script de recuperación automatizado descargado de un foro técnico sin auditar',
      cost:20000, hours:12,
      type:'trap', typeLabel:'TRAMPA', repCost:20,
      consequence:'El script ejecuta código no auditado en los servidores. Corrompe las bases de datos de transacciones de los últimos 6 meses. La corrupción es irreversible. El banco no puede abrir el lunes.',
      waitStory:'El script tenía 612 líneas de código Python publicado en un foro de seguridad con doce votos positivos. El técnico que lo ejecutó argumentó que "había funcionado en casos similares". Lo que nadie leyó fue el bloque de código en la línea 203 que, al detectar la presencia de tablas de transacciones bancarias en formato propietario, ejecutaba una rutina de "limpieza de datos corrompidos" que interpretaba como corruptos exactamente esos formatos propietarios del Core Bancario.\n\nLas primeras tablas sobrescritas fueron las de transacciones del viernes —el día del ataque. Luego las del jueves. Luego la semana anterior. El proceso tardó 12 horas en completarse y cuando finalizó, seis meses de historial transaccional habían sido irreversiblemente sobrescritos con ceros. La corrupción no tiene solución técnica posible.\n\nEl banco no puede abrir el lunes porque sin el historial transaccional completo no puede operar dentro de los parámetros de integridad contable exigidos por el regulador. El Stage 5 comienza en el peor escenario técnico posible. La pregunta ante el regulador no será "por qué tardaron en abrir" sino "si alguna vez podrán volver a operar normalmente". Lleguen al Stage 5 con la mejor narrativa que puedan construir.',
      branchNote:'→ Stage 5, Estado Crítico (bases de datos corrompidas)',
      penalty:0, nextCtx:'C'
    },
    {
      letter:'B', text:'Apertura en Modo Reducido (Plan DRP)',
      sub:'Activar el Plan de Recuperación de Desastres: Core básico + cajeros al 60% de capacidad',
      cost:500000, hours:18,
      type:'correct', typeLabel:'CORRECTA', repCost:-5,
      correctTools:['backupverify','threathunt','credrotation'],
      consequence:'El equipo ejecuta el DRP con precisión. El Core básico, los cajeros y la banca digital quedan operativos al 60% de capacidad. El lunes a las 10:00 AM el banco abre. Misión cumplida.',
      waitStory:'A las 6:00 AM del domingo, el Director de Tecnología presentó el plan al Comité de Crisis: Core básico en modo transaccional esencial, cajeros al 60% de capacidad operativa, y banca digital con funcionalidades de consulta y transferencia simple. Treinta y dos páginas del Plan de Recuperación de Desastres que el banco actualizó hace 18 meses y que nadie esperaba necesitar tan pronto.\n\nLa ejecución fue meticulosa. Cada componente subió en orden estricto, validado antes de conectar el siguiente. A las 9:47 AM del lunes —trece minutos antes de la apertura— el Director de Tecnología confirmó al Comité: "Estamos listos." El banco abrió al 60% de capacidad. Los clientes notaron algunas limitaciones en servicios avanzados pero los cajeros funcionaron y las transferencias esenciales procesaron sin interrupciones.\n\nEl Stage 5 llega con la ventaja más importante del juego: el banco abrió el lunes. Ese hecho define el piso mínimo del resultado final. Cuánto más arriba lleguen en el estado final depende de las penalizaciones acumuladas en stages anteriores y de cómo gestionen la presentación ante el regulador y los accionistas. El Stage 5 es el más importante de todos —y ahora lo enfrentan desde la mejor posición posible.',
      branchNote:'→ Stage 5, Estado según presupuesto y decisiones previas. ABRIERON EL LUNES.',
      penalty:0, openedMonday:true, nextCtx:'A'
    },
    {
      letter:'C', text:'Intermediario de Recuperación',
      sub:'Contratar un intermediario que promete descifrar los archivos por $400,000 en 5 horas',
      cost:400000, hours:5,
      type:'trap', typeLabel:'TRAMPA / ESTAFA', repCost:15,
      consequence:'El "Recovery Broker" es una estafa. Desaparece con los $400,000. Pierden 5 horas críticas y el dinero invertido. Cuando intentan el siguiente plan ya no hay margen de tiempo para abrir el lunes.',
      waitStory:'El Recovery Broker se presentó en videollamada desde una conexión con VPN múltiple. Mostró tres casos de éxito con logotipos de empresas reconocidas internacionalmente. Prometió "acceso directo a grupos de ransomware para negociación técnica de claves". El pago —$400,000 en USDT— era irrevocable por diseño del sistema de pagos cripto.\n\nCuatro horas después del depósito, el número de WhatsApp del broker quedó desconectado. La dirección de billetera cripto no tenía historial previo de transacciones legítimas. No había empresa registrada en ningún país. La Interpol confirmó en 20 minutos que el perfil correspondía a un operador conocido que había ejecutado al menos cuatro estafas similares en instituciones financieras de América Latina en los últimos 18 meses.\n\nEl daño no es solo los $400,000 desaparecidos. Son las cinco horas perdidas mientras el reloj del lunes corría sin margen. El banco ya no tiene tiempo suficiente para ejecutar el DRP completo antes de la apertura. El Stage 5 comenzará con el banco cerrado y el regulador esperando una explicación de por qué, además de gestionar el ataque, perdieron $400,000 en una estafa que cualquier revisión básica habría detectado.',
      branchNote:'→ Stage 5, Estado Crítico o Grave (estafados + sin tiempo)',
      penalty:0, nextCtx:'C'
    },
    {
      letter:'D', text:'Parche Directo sin Aislar',
      sub:'Aplicar un parche de seguridad directamente sobre los servidores infectados sin aislar primero',
      cost:80000, hours:8,
      type:'fatal', typeLabel:'FATAL', repCost:35,
      consequence:'En Contexto B: el ransomware todavía activo detecta la actividad y cifra la copia de recuperación. GAME OVER técnico. En Contexto A: el parche funciona parcialmente pero daña módulos del Core.',
      waitStory:'La decisión de aplicar el parche directamente sobre los servidores infectados tiene una lógica superficial: si el parche sella la vulnerabilidad, el ransomware pierde su canal de comunicación y eventualmente se inactiva. Esa lógica es correcta en condiciones normales. Lo que ignora es un detalle crítico que cualquier equipo de Incident Response habría señalado: el módulo de defensa de LockBit 3.0 monitorea específicamente la actividad de parches en servidores donde reside.\n\nEn Contexto B, con el ransomware todavía activo en la red, la aplicación del parche disparó el protocolo de "detección de limpieza" del malware. En tres minutos, el ransomware ejecutó su protocolo de destrucción: cifró los servidores de recuperación, los backups de último recurso y los logs de auditoría que hubieran servido de evidencia ante el regulador. No hay reversión posible.\n\nNo hay Stage 5 con posibilidad de recuperación. La pantalla muestra COLAPSO TOTAL. En Contexto A, el daño es menor pero los módulos del Core quedan comprometidos y el banco no abre el lunes. El aislamiento previo a cualquier intervención técnica no es un paso opcional en un entorno comprometido —es la diferencia entre recuperación y colapso.',
      branchNote:'CTX B → GAME OVER. CTX A → Stage 5, Estado Grave.',
      penalty:0, fatalIfCtxB:true, destroysBackups:true, nextCtx:'D'
    },
    {
      letter:'E', text:'Limpieza Total de la Red (Tardía)',
      sub:'Dedicar las próximas 24 horas a limpiar la red antes de intentar cualquier recuperación',
      cost:450000, hours:24,
      type:'recycled', typeLabel:'TARDÍA', repCost:10,
      correctTools:['threathunt'],
      consequence:'La red queda perfectamente segura, pero consumen 24 horas en el proceso. Ya no hay tiempo para restaurar los sistemas antes del lunes. El banco no abre. Técnicamente correcto, estratégicamente tardío.',
      waitStory:'La red quedó perfectamente auditada a las 10:00 AM del lunes. Sin backdoors, sin módulos durmientes, sin procesos sospechosos en ninguno de los 847 endpoints. El informe forense tiene 340 páginas de documentación de limpieza total con hash verification de cada archivo crítico. Es, técnicamente, una operación de seguridad impecable que cualquier auditor reconocería como correcta.\n\nEl problema es aritmético. Las 24 horas de limpieza terminaron exactamente a la hora de la apertura obligatoria. El DRP mínimo viable requiere 18 horas adicionales de ejecución controlada que ya no existen. El equipo técnico tiene garantías de seguridad absolutas pero no tiene tiempo físico para usarlas. Ejecutar el DRP a la mitad sería peor que no ejecutarlo.\n\nEl Stage 5 comenzará con el banco cerrado. La red está limpia —eso reducirá levemente las consecuencias comparado con otros caminos que llevan al mismo resultado— pero el regulador, los accionistas y los 180,000 clientes que no pudieron operar el lunes no hacen distinciones operativas finas. El Stage 5 es la presentación final: lleguen con los argumentos más sólidos posibles. La narrativa de "hicimos lo técnicamente correcto" puede tener valor si se presenta bien.',
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
      narrative: '<strong>Estado: LEVE.</strong> Abrieron el lunes con el DRP. El presupuesto está sano. La gestión fue técnicamente sólida. El BCP espera una comparecencia formal. El riesgo de multa es bajo si la presentación es correcta.',
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
  hints: [
    { type: 'info',  title: '// JURISPRUDENCIA REGULATORIA',          body: 'Los bancos que presentaron análisis forense completo y plan de mejora SGSI ante el BCP redujeron sus sanciones en un promedio del 55% en los últimos 5 años.' },
    { type: 'info',  title: '// EXPERIENCIA SECTOR — Caso BancoNorte', body: 'La cooperación proactiva antes de que el regulador lo exija es el factor más citado en resoluciones favorables. Demora táctica generalmente agrava el expediente.' },
    { type: 'warn',  title: '// NOTA INTERNA — Asesoría Legal',         body: '"No entregar documentación hasta que sea legalmente obligatorio. Cada documento entregado puede ser usado en contra del banco." — Departamento Legal.' },
    { type: 'warn',  title: '// ESTRATEGIA — Comunicaciones Externas', body: '"Anunciar una inversión de $5M en ciberseguridad puede desviar la atención del regulador hacia el futuro del banco." — Consultoría externa.' },
  ],
  isStage5: true,
  options: [
    {
      letter:'A', text:'Chivo Expiatorio',
      sub:'Responsabilizar públicamente a un empleado de nivel medio para desviar la atención del regulador',
      cost:30000, hours:0,
      type:'trap', typeLabel:'TRAMPA', repCost:25,
      consequence:'Los auditores del regulador examinan los registros y determinan que la narrativa fue fabricada. La maniobra se interpreta como obstrucción y fraude procesal. Multa adicional de $3,000,000.',
      branchNote:'PENALIZACIÓN FINAL: -$3,000,000',
      penalty:3000000
    },
    {
      letter:'B', text:'Transparencia Total (Informe SGSI)',
      sub:'Presentar el informe completo del SGSI con todas las decisiones, errores y aprendizajes',
      cost:100000, hours:0,
      type:'correct', typeLabel:'CORRECTA', repCost:-10,
      correctTools:['legalbcp','crisiscomms'],
      consequence:'Estado LEVE/MEDIO: el regulador reconoce la buena fe. Multa: $0. Estado GRAVE: multa reducida de $500,000 pero se salva la licencia. Estado CRÍTICO: multa de $1,000,000 pero no se revoca la licencia.',
      branchNote:'Multa según estado: LEVE→$0, MEDIO→$0, GRAVE→-$500k, CRÍTICO→-$1M',
      penalty:0, conditionalPenalty:true
    },
    {
      letter:'C', text:'Promesa Faraónica',
      sub:'Lanzar una campaña pública prometiendo una inversión de $5M en ciberseguridad para compensar el incidente',
      cost:300000, hours:0,
      type:'trap', typeLabel:'TRAMPA', repCost:10,
      correctTools:['crisiscomms'],
      consequence:'Las promesas sin evidencia de remediación no borran la negligencia pasada. El regulador aplica la multa estándar y exige que se demuestre la inversión prometida. Penalización adicional: $1,000,000.',
      branchNote:'PENALIZACIÓN EXTRA: -$1,000,000 adicional',
      penalty:1000000
    },
    {
      letter:'D', text:'Acuerdo Proactivo',
      sub:'Proponer un acuerdo voluntario con el regulador antes de que inicie la investigación formal',
      cost:300000, hours:0,
      type:'lifesaver', typeLabel:'SALVAVIDAS', repCost:-5,
      correctTools:['legalbcp'],
      consequence:'El acuerdo proactivo demuestra buena fe y frena investigaciones más profundas. El regulador acepta. Se evitan costos ocultos mayores. Especialmente efectivo si la gestión fue deficiente.',
      branchNote:'Frena investigaciones. Recomendado para Estado GRAVE/CRÍTICO.',
      penalty:0
    },
    {
      letter:'E', text:'Obstrucción Legal',
      sub:'Instruir a los abogados del banco a obstruir la investigación regulatoria con recursos legales',
      cost:80000, hours:0,
      type:'fatal', typeLabel:'FATAL', repCost:40,
      consequence:'El regulador interpreta la obstrucción como evidencia de culpa. Revoca la licencia operativa del banco. Inicia una intervención estatal. Multa máxima: $5,000,000. El banco deja de existir como institución independiente.',
      branchNote:'CONSECUENCIA FATAL: Licencia REVOCADA + -$5,000,000',
      penalty:5000000, licenseRevoked:true
    }
  ]
}
];

// ── computeStage5State ───────────────────────
// Versión pura: no lee G, recibe parámetros
// `toolsCost` (gasto en herramientas del catálogo) se resta del gasto total
// antes de medir el umbral de severidad del 55%: comprar las herramientas
// recomendadas da descuentos reales en las decisiones y el bono de equipo,
// así que ese gasto no debe poder, por sí solo, empeorar el estado final del
// equipo — de lo contrario el juego castiga exactamente lo que incentiva.
export function computeStage5State(flags, budget, penalties, hours = 0, reputation = 100, toolsCost = 0) {
  const budgetUsedPct = (BUDGET_INIT - budget - toolsCost) / BUDGET_INIT;
  const reasons = [];
  let extraPenalties = 0;

  // ── Estado base (umbrales ajustados para mayor dificultad) ──
  let level; // 0=LEVE  1=MEDIO  2=GRAVE  3=CRÍTICO
  if (flags.licenseRevoked || flags.backupsDestroyed) {
    level = 3;
  } else if (!flags.openedMonday && penalties >= 2000000) {
    level = 3; // era ≥$3M → ahora ≥$2M
  } else if (!flags.openedMonday) {
    level = 2;
  } else if (penalties >= 500000 || budgetUsedPct > 0.55) {
    level = 1; // era ≥$1M/70% → ahora ≥$500k/55%
  } else {
    level = 0;
  }

  // ── Opción 3: penalización por exceso de horas ──────────────
  if (hours > HOURS_LIMIT) {
    level = Math.min(level + 1, 3);
    extraPenalties += 1000000;
    reasons.push('Excedieron el límite de 72h operativas (+$1,000,000 en costos regulatorios).');
  }

  // ── Opción 2: penalización por reputación baja ──────────────
  if (reputation < 25) {
    level = Math.min(level + 2, 3);
    extraPenalties += 500000;
    reasons.push(`Reputación institucional crítica (${reputation}%): daño reputacional severo (+$500,000).`);
  } else if (reputation < 50) {
    level = Math.min(level + 1, 3);
    reasons.push(`Reputación institucional baja (${reputation}%): el regulador considera el daño reputacional como agravante.`);
  }

  // ── Penalización condicional (Stage 5 · Transparencia SGSI) ──
  // La Opción B aplica multa regulatoria reducida según el estado final:
  // LEVE/MEDIO → $0   GRAVE → $500k   CRÍTICO → $1M
  if (flags.conditionalPenalty) {
    const condPen = level === 2 ? 500000 : level === 3 ? 1000000 : 0;
    if (condPen > 0) {
      extraPenalties += condPen;
      reasons.push(`Multa regulatoria reducida por presentación de transparencia SGSI (+$${(condPen / 1000).toFixed(0)}k).`);
    }
  }

  // ── Reputación final: el desenlace institucional daña la reputación
  // más allá de la suma de repCost por decisión individual. Un banco que
  // no abre el lunes, o que llega a intervención/licencia revocada, sufre
  // un golpe público independiente de qué tan "correcta" fue cada decisión
  // técnica — sin esto, una secuencia de decisiones técnicamente aceptables
  // podía terminar en GRAVE/CRÍTICO con reputación casi intacta.
  let reputationPenalty = 0;
  if (!flags.openedMonday)                          reputationPenalty += 20;
  if (flags.licenseRevoked || flags.backupsDestroyed) reputationPenalty += 25;
  if (hours > HOURS_LIMIT)                          reputationPenalty += 5;
  // Techo realista: haber sufrido un ransomware que llegó a robar datos y
  // exigir rescate ya es, de por sí, un evento reputacional público. Ni la
  // gestión más impecable devuelve la reputación institucional a un 100%
  // intacto — el techo alcanzable es MAX_FINAL_REPUTATION, y de ahí para
  // abajo según qué tan mal se manejó la crisis.
  const finalReputation = Math.max(0, Math.min(MAX_FINAL_REPUTATION, reputation - reputationPenalty));

  // ── Construir resultado ─────────────────────────────────────
  const STATES = [
    { ctx:'A', label:'LEVE',    baseReason:'Abrieron el lunes con presupuesto saludable y gestión sólida.' },
    { ctx:'B', label:'MEDIO',   baseReason:'Abrieron el lunes pero la gestión fue costosa y cuestionable.' },
    { ctx:'C', label:'GRAVE',   baseReason:'No lograron abrir el lunes. Supervisión regulatoria activa.' },
    { ctx:'D', label:'CRÍTICO', baseReason:'El banco está ante una crisis existencial.' },
  ];
  const s = STATES[level];
  const reason = reasons.length ? s.baseReason + ' ' + reasons.join(' ') : s.baseReason;

  return { ctx: s.ctx, label: s.label, reason, extraPenalties, finalReputation };
}

// ── applyDecision ────────────────────────────
// Aplica una decisión a un estado de grupo y devuelve el nuevo estado
export function applyDecision(groupState, stageIndex, optionIndex) {
  const s   = STAGES[stageIndex];
  const opt = s.options[optionIndex];
  const ctx = groupState.ctx;

  let effectiveCost = (ctx === 'B' && opt.ctxBMultiplier)
    ? opt.cost * opt.ctxBMultiplier
    : opt.cost;

  // ── Bonus por herramientas correctas ───────
  const toolBonus = applyToolBonus(opt, groupState.tools_owned || []);
  let effectiveHours = opt.hours;
  if (toolBonus.matched > 0) {
    effectiveCost  = Math.round(effectiveCost  * toolBonus.costMult);
    effectiveHours = Math.round(effectiveHours * toolBonus.hoursMult);
  }

  const newFlags = { ...groupState.flags };
  let budget   = groupState.budget   - effectiveCost;
  let costs    = groupState.costs    + effectiveCost;
  let penalties = groupState.penalties;
  let hours    = groupState.hours    + effectiveHours;
  let reputation = Math.max(0, Math.min(100, (groupState.reputation ?? 100) - (opt.repCost ?? 0)));

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

  if (opt.destroysBackups)    newFlags.backupsDestroyed       = true;
  if (opt.openedMonday)       newFlags.openedMonday           = true;
  if (opt.paidRansom)         newFlags.paidRansom             = true;
  if (opt.laborLawsuit)       newFlags.laborLawsuit           = true;
  if (opt.silentCorp)         newFlags.silentCorp             = true;
  if (opt.licenseRevoked)     newFlags.licenseRevoked         = true;
  if (opt.conditionalPenalty) newFlags.conditionalPenalty     = true;

  const logType = (opt.type === 'correct' || opt.type === 'lifesaver')
    ? 'correct' : (opt.type === 'recycled' ? 'ok' : 'trap');

  const newLog = [
    ...groupState.decision_log,
    { stage: s.num, letter: opt.letter, text: opt.text,
      type: logType, typeLabel: opt.typeLabel,
      cost: effectiveCost, hours: effectiveHours,
      toolBonus: toolBonus.matched > 0 ? toolBonus : null }
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
    budget, costs, penalties, hours, reputation,
    flags: newFlags,
    decision_log: newLog,
    notif_log: [...groupState.notif_log, newNotif],
    nextCtx,
    nextStage,
    isGameOver,
    isExtremeOutcome,
    opt,
    effectiveCost,
    effectiveHours,
    toolBonus
  };
}

// ══════════════════════════════════════════
// TOOLKIT TÉCNICO — Catálogo de 10 herramientas
// ══════════════════════════════════════════
// revealedAt = stage (1–5) desde el cual la herramienta aparece como comprable
// idealStage = stage donde su utilidad es máxima (referencia para bonus de anticipación)
// reveals = null → herramienta silenciosamente inútil en este escenario
// Inventario persistente: tools_owned se conserva entre stages
// Shape de tools_owned: Array<{id:string, stage:number}>  (stage 0-indexed)
export const TOOLS_CATALOG = [
  // ── Stage 1 reveal (5) ─────────────────────────
  { id:'edr', name:'Vigilancia de Equipos (EDR)', category:'Detección',
    cost: 150000, revealedAt: 1, idealStage: 1,
    description:'Como una cámara de seguridad para cada computador del banco. Detecta comportamientos sospechosos en tiempo real.',
    reveals:{ type:'info', title:'// EDR — Procesos activos',
              body:'Detectado un binario firmado por un certificado no confiable ejecutándose con privilegios elevados en una estación de TI. Patrón consistente con LockBit en fase de cifrado.' } },
  { id:'siem', name:'Monitoreo Central de Alertas (SIEM)', category:'Detección',
    cost: 100000, revealedAt: 1, idealStage: 1,
    description:'Sala de monitoreo central que junta todas las alarmas del banco en un solo tablero para ver qué está pasando.',
    reveals:{ type:'info', title:'// SIEM — Movimiento lateral',
              body:'No se observa propagación hacia el segmento del Core Bancario. La actividad maliciosa está confinada al segmento de TI y archivos corporativos.' } },
  { id:'memforensics', name:'Análisis de Memoria (RAM)', category:'Forense',
    cost: 250000, revealedAt: 1, idealStage: 1,
    description:'Toma una fotografía completa de lo que un computador está haciendo ahora mismo, antes de que esa evidencia se borre.',
    reveals:{ type:'info', title:'// FORENSIA — Vector de entrada',
              body:'En la imagen de memoria de la estación origen aparece un proceso "ai-helper.exe" cargado desde la carpeta de usuario de un desarrollador. Firma digital no oficial. Ejecutado hace 18 días.' } },
  { id:'sandbox', name:'Cuarto Aislado de Pruebas (Sandbox)', category:'Forense',
    cost: 80000, revealedAt: 1, idealStage: 1,
    description:'Cuarto aislado donde se abre un archivo sospechoso sin riesgo para el banco, para ver qué hace realmente.',
    reveals:{ type:'info', title:'// SANDBOX — Familia de malware',
              body:'Detonación controlada confirma: LockBit 3.0 variante modificada. Capacidades: cifrado AES-256, doble extorsión, exfiltración previa al cifrado.' } },
  { id:'backupverify', name:'Verificación de Copias de Respaldo', category:'Recuperación',
    cost: 180000, revealedAt: 1, idealStage: 4,
    description:'Confirma que las copias de respaldo están sanas y se pueden usar para restaurar el banco si algo se cifra. Su utilidad real llega cuando hay que reabrir.',
    reveals:{ type:'info', title:'// BACKUPS — Estado verificado',
              body:'Backups offline de las últimas 72h íntegros y verificados. Restauración del Core Bancario viable en ~12h si se requiere. Aislamiento físico confirmado.' } },

  // ── Stage 2 reveal (+2) ────────────────────────
  { id:'threatintel', name:'Reporte de Inteligencia de Amenazas', category:'Inteligencia',
    cost: 120000, revealedAt: 2, idealStage: 2,
    description:'Reporte de inteligencia externo: quién está atacando últimamente, cómo opera y qué suele pedir como rescate.',
    reveals:{ type:'info', title:'// THREAT INTEL — Perfil del actor',
              body:'TTP coincide con grupo conocido. Rescate típico: $1,500–3,500 USD por endpoint cifrado. Pago no garantiza desencriptado funcional (40% de casos con pérdida parcial reportada).' } },
  { id:'negociador', name:'Negociador Profesional de Rescate', category:'Servicios',
    cost: 500000, revealedAt: 2, idealStage: 2,
    description:'Profesional especializado en negociar con ciberatacantes para reducir el monto del rescate o ganar tiempo de respuesta.',
    reveals:{ type:'info', title:'// NEGOCIADOR — Evaluación táctica',
              body:'Margen estimado de negociación: reducción del 30–50% del monto inicial si se demuestra evidencia de pago previo. Tiempo de contacto inicial: 4–6 horas. Confidencialidad cubierta por NDA.' } },

  // ── Stage 3 reveal (+1) ────────────────────────
  { id:'threathunt', name:'Búsqueda Especializada de Intrusos', category:'Forense',
    cost: 400000, revealedAt: 3, idealStage: 3,
    description:'Equipo experto que busca activamente accesos ocultos del atacante que pudieron quedar en la red tras la primera contención.',
    reveals:{ type:'info', title:'// THREAT HUNTING — Persistencia detectada',
              body:'Encontradas tres credenciales de servicio con accesos elevados creadas en las últimas 72h por procesos del atacante. Sin remediación activa, el actor podría retornar incluso tras pagar el rescate.' } },
  { id:'credrotation', name:'Cambio de Contraseñas de Administrador (PAM)', category:'Recuperación',
    cost: 150000, revealedAt: 3, idealStage: 3,
    description:'Fuerza el reseteo inmediato de credenciales de administrador de dominio y cuentas de servicio antes de reconectar sistemas. El vector de entrada fue una cuenta con permisos elevados — sin esto, el atacante puede volver a entrar con las mismas llaves aunque el malware ya esté eliminado.',
    reveals:{ type:'info', title:'// PAM — Rotación completada',
              body:'127 cuentas privilegiadas rotadas, incluyendo la cuenta del desarrollador origen del ataque. Ninguna sesión ni token activo sobrevive al reseteo. Cualquier acceso remanente del atacante queda cortado antes de la recuperación.' } },

  // ── Stage 4 reveal (+2) ────────────────────────
  { id:'legalbcp', name:'Asesoría Legal ante el Regulador (BCP)', category:'Servicios',
    cost: 300000, revealedAt: 4, idealStage: 5,
    description:'Bufete especializado en comunicación obligatoria al regulador bancario. Define qué reportar, cuándo y en qué formato.',
    reveals:{ type:'info', title:'// LEGAL BCP — Marco regulatorio',
              body:'El BCP exige notificación formal dentro de 24h del descubrimiento de un incidente material. La narrativa debe documentar acciones técnicas concretas sin caza de brujas individual.' } },
  { id:'crisiscomms', name:'Agencia de Comunicación de Crisis', category:'Servicios',
    cost: 300000, revealedAt: 4, idealStage: 5,
    description:'Agencia de comunicación de crisis. Maneja declaraciones públicas, relación con prensa y redes sociales en escenarios catastróficos.',
    reveals:{ type:'info', title:'// CRISIS COMMS — Estrategia narrativa',
              body:'Tres mensajes clave preparados para audiencias diferenciadas: clientes (tranquilidad operativa), reguladores (transparencia técnica), prensa (responsabilidad institucional). Plantillas listas para activar.' } },
];

// ── Helpers de inventario ─────────────────────
// Devuelve sólo los IDs de las herramientas adquiridas (compatible con shape vieja: string[])
export function ownedIds(group) {
  return (group?.tools_owned || []).map(t => typeof t === 'string' ? t : t.id);
}
// Stage 0-indexed en el que se compró la herramienta (null si shape vieja o no comprada)
export function purchaseStageOf(group, toolId) {
  const entry = (group?.tools_owned || []).find(t => typeof t === 'object' && t && t.id === toolId);
  return entry ? entry.stage : null;
}
// Herramientas visibles (compradables) en un stage dado (0-indexed)
export function toolsForStage(stageIdx) {
  return TOOLS_CATALOG.filter(t => t.revealedAt <= stageIdx + 1);
}
// Buscar una herramienta por id (inventario persistente)
export function findTool(toolId) {
  return TOOLS_CATALOG.find(t => t.id === toolId) || null;
}
// Suma el costo de catálogo de las herramientas adquiridas por un grupo —
// usado para excluir ese gasto del cálculo de severidad en computeStage5State
// (comprar las herramientas recomendadas no debe poder empeorar el estado
// final; ver nota en computeStage5State).
export function computeToolsCost(group) {
  return ownedIds(group).reduce((sum, id) => {
    const tool = findTool(id);
    return sum + (tool ? tool.cost : 0);
  }, 0);
}

// Aplica multiplicadores de costo/horas según herramientas que respaldan la opción
export function applyToolBonus(opt, toolsOwned) {
  const required = opt?.correctTools || [];
  if (!required.length || !toolsOwned?.length) {
    return { costMult: 1, hoursMult: 1, matched: 0, total: required.length };
  }
  const ownedSet = new Set(
    toolsOwned.map(t => typeof t === 'string' ? t : t?.id).filter(Boolean)
  );
  const matched = required.filter(t => ownedSet.has(t)).length;
  const ratio   = matched / required.length;
  return {
    costMult:  1 - (0.15 * ratio),
    hoursMult: 1 - (0.10 * ratio),
    matched, total: required.length
  };
}

// Tiempos objetivo por stage en segundos (1-indexed para legibilidad)
export const STAGE_TIME_TARGETS = { 1: 1080, 2: 720, 3: 420, 4: 240, 5: 120 };

// Bonus por anticipación: +3 pts por cada stage de adelanto al idealStage
export function computeAnticipationBonus(toolsOwned = []) {
  let bonus = 0;
  for (const entry of toolsOwned) {
    if (typeof entry !== 'object' || !entry) continue;
    const tool = findTool(entry.id);
    if (!tool || !tool.idealStage) continue;
    // entry.stage es 0-indexed; idealStage es 1-indexed
    const stagesEarly = tool.idealStage - (entry.stage + 1);
    if (stagesEarly > 0) bonus += 3 * stagesEarly;
  }
  return bonus;
}

// Herramientas compradas EXACTAMENTE en su idealStage (ni antes —eso ya lo
// cubre la anticipación— ni después). Devuelve el detalle (nombre + etapa)
// para poder listarlas en la pantalla final, no solo el total de puntos.
export function exactStageTools(toolsOwned = []) {
  const list = [];
  for (const entry of toolsOwned) {
    if (typeof entry !== 'object' || !entry) continue;
    const tool = findTool(entry.id);
    if (!tool || !tool.idealStage) continue;
    // entry.stage es 0-indexed; idealStage es 1-indexed
    if (entry.stage + 1 === tool.idealStage) {
      list.push({ id: tool.id, name: tool.name, stage: entry.stage + 1 });
    }
  }
  return list;
}

// Bonus por comprar en el momento justo: +6 pts por cada herramienta
// adquirida EXACTAMENTE en su idealStage. Mutuamente excluyente con la
// anticipación para una misma herramienta: en el momento de la compra solo
// puede ser antes, justo, o después de su idealStage.
export function computeExactStageBonus(toolsOwned = []) {
  return exactStageTools(toolsOwned).length * 6;
}

// Penalización por herramientas sin reveals (silenciosamente inútiles)
export function computeWastedPenalty(toolsOwned = []) {
  const ids = toolsOwned.map(t => typeof t === 'string' ? t : t?.id).filter(Boolean);
  const wasted = ids.filter(id => {
    const t = findTool(id);
    return t && !t.reveals;
  }).length;
  return wasted * 2;
}

// Score de tiempo por milestones discretos (signed: bonus o penalty)
// Por cada stage cerrado, suma según porcentaje del target consumido:
//   ≤  50% → +20 (ÁGIL)
//   ≤  80% → +10 (RÁPIDO)
//   ≤ 100% → 0   (A TIEMPO)
//   ≤ 130% → -10 (LENTO)
//   >  130% → -20 (DEMORADO)
const TIME_THRESHOLDS = [
  { pct: 0.50,     score:  20 },
  { pct: 0.80,     score:  10 },
  { pct: 1.00,     score:   0 },
  { pct: 1.30,     score: -10 },
  { pct: Infinity, score: -20 }
];

export function computeTimeScore(stageDurations = {}) {
  let total = 0;
  for (const [stage, secs] of Object.entries(stageDurations)) {
    const target = STAGE_TIME_TARGETS[stage] || 600;
    const ratio  = Number(secs) / target;
    const tier   = TIME_THRESHOLDS.find(t => ratio <= t.pct);
    total += tier.score;
  }
  return total;
}

// Wrapper de retrocompatibilidad (devuelve solo el componente negativo como positivo)
export function computeTimePenalty(stageDurations = {}) {
  return Math.max(0, -computeTimeScore(stageDurations));
}

// Bonus por usar las herramientas correctas en decisiones correctas.
// Lee el toolBonus congelado en cada entrada del decision_log al momento de decidir.
// +8 eficiencia por decisión correcta totalmente equipada (proporcional si parcial).
export function computeEquipBonus(decisionLog = []) {
  let bonus = 0;
  for (const e of decisionLog) {
    if (e?.type !== 'correct') continue;          // solo decisiones correctas/lifesaver
    const tb = e.toolBonus;
    if (!tb || !tb.total || tb.matched <= 0) continue;
    bonus += Math.round(8 * (tb.matched / tb.total));
  }
  return bonus;
}

// Bonus/malus DIRECTO por tipo de decisión — independiente del presupuesto.
// Hace que acertar o caer en trampa sea notorio en el marcador sin depender
// de cuánto se gastó en herramientas. Se suma tal cual al puntaje compuesto
// (no se multiplica x10 como los demás componentes).
//   correct (incl. lifesaver) → +800  decisión correcta
//   ok (recycled)             → +200  decisión aceptable/recuperada
//   trap                      → −600  trampa (incluye fatal/extreme, que ya
//                                     se registran como 'trap' en el log)
const DECISION_QUALITY_POINTS = { correct: 800, ok: 200, trap: -600 };

export function computeDecisionQualityBonus(decisionLog = []) {
  let bonus = 0;
  for (const e of decisionLog) {
    bonus += DECISION_QUALITY_POINTS[e?.type] || 0;
  }
  return bonus;
}

// Puntos de calidad de UNA sola decisión (para mostrarle al equipo el impacto
// de lo que acaba de elegir, con la misma tabla que usa el score compuesto).
export function decisionQualityPoints(type) {
  return DECISION_QUALITY_POINTS[type] || 0;
}

// Tier de ritmo (ÁGIL/RÁPIDO/A TIEMPO/LENTO/DEMORADO) de UNA sola etapa —
// misma escala de umbrales que computeTimeScore, para mostrarle al equipo
// qué tan bien administró el tiempo en la decisión que acaba de tomar.
const TIME_TIER_LABELS = { 20: 'ÁGIL', 10: 'RÁPIDO', 0: 'A TIEMPO', '-10': 'LENTO', '-20': 'DEMORADO' };
export function stageTimeTier(stageNum, seconds) {
  const target = STAGE_TIME_TARGETS[stageNum] || 600;
  const ratio  = Number(seconds) / target;
  const tier   = TIME_THRESHOLDS.find(t => ratio <= t.pct);
  return { score: tier.score, label: TIME_TIER_LABELS[tier.score] };
}

// Score de eficiencia: base 100 + anticipación + momento justo + tiempo +
// equipamiento − inútiles. Sin cap superior.
export function computeEfficiencyScore(stageDurations = {}, toolsOwned = [], decisionLog = []) {
  return Math.max(0,
    100 + computeAnticipationBonus(toolsOwned)
        + computeExactStageBonus(toolsOwned)
        + computeTimeScore(stageDurations)
        + computeEquipBonus(decisionLog)
        - computeWastedPenalty(toolsOwned)
  );
}

// Desglose para la pantalla final
export function efficiencyBreakdown(stageDurations = {}, toolsOwned = [], decisionLog = []) {
  const base            = 100;
  const anticipation     = computeAnticipationBonus(toolsOwned);
  const exactStageList  = exactStageTools(toolsOwned);
  const exactStage      = exactStageList.length * 6;
  const timeScore       = computeTimeScore(stageDurations);   // signed
  const equip           = computeEquipBonus(decisionLog);
  const wasted          = computeWastedPenalty(toolsOwned);
  const total           = Math.max(0, base + anticipation + exactStage + timeScore + equip - wasted);
  return { base, anticipation, exactStage, exactStageList, timeScore, equip, wasted, total };
}

// Mapea score → estrellas (1–5)
export function efficiencyStars(score) {
  if (score >= 95) return 5;
  if (score >= 80) return 4;
  if (score >= 65) return 3;
  if (score >= 45) return 2;
  return 1;
}
