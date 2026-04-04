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
      type:'trap', typeLabel:'TRAMPA', repCost:5,
      consequence:'El escaneo destruye la evidencia digital forense. Al intentar eliminar el malware, este activa un módulo de robo de credenciales que captura las claves nuevas generadas durante el proceso. No se logra contener el ataque.',
      waitStory:'Las herramientas del antivirus no distinguen entre un archivo legítimo y evidencia digital crítica. En cuestión de minutos, los logs de memoria que identificaban al atacante fueron sobrescritos sin posibilidad de recuperación. El equipo forense llega más tarde y encuentra el escenario destruido: sin huellas, sin vector de entrada, sin rastro del malware original.\n\nPero hay algo peor. Durante el escaneo, el módulo de robo de credenciales integrado en el ransomware se activó silenciosamente. Las nuevas contraseñas generadas por el proceso de "limpieza" —las que el equipo usó pensando que estaban protegidas— ya están en manos del atacante. Sin saberlo, acaban de entregarle acceso con credenciales válidas al perímetro interno del banco.\n\nEl próximo ciclo comenzará en caos total: sin evidencia forense, con credenciales comprometidas y con el atacante posicionado mucho más adentro de lo que nadie sabe todavía. Cada decisión del siguiente stage será exponencialmente más costosa. Piensen bien cómo quieren usar los recursos que les quedan.',
      branchNote:'→ Stage 2, Contexto B (caos activo)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'B', text:'Apagón Preventivo',
      sub:'Apagar toda la infraestructura bancaria como medida de contención total',
      cost:2000000, hours:2,
      type:'trap', typeLabel:'TRAMPA DE PÁNICO', repCost:15,
      consequence:'El apagón masivo causa un lucro cesante millonario injustificado. Al no haber investigado, no se sabe si era necesario. Además el Core CBS se corrompe parcialmente durante el apagado de emergencia.',
      waitStory:'El apagón masivo detuvo todos los sistemas en 0.3 segundos. También detuvo: las 847 transacciones en vuelo del viernes, el sistema de nómina que procesaría pagos el sábado, y los procesos de cierre del día que garantizaban la integridad contable. El lucro cesante de dos horas de downtime bancario superó los $2,000,000 —sin que hubiera siquiera confirmación de si el ataque era real.\n\nSin evidencia previa, el equipo no sabe qué cifrar, qué restaurar ni por dónde empezar. El Core CBS, al cortarle el suministro sin un proceso de apagado limpio, reporta sectores corrompidos en las tablas de transacciones. Los técnicos pasan las siguientes horas intentando entender qué pasó, mientras el atacante —que sí lo sabe— tiene tiempo de sobra para reorganizarse.\n\nLlegan al próximo ciclo sin información, sin evidencia y con millones ya gastados. Recuerden: en una crisis de ciberseguridad, actuar sin datos es casi siempre peor que no actuar. El siguiente stage los pondrá frente a decisiones donde la información es todavía más escasa.',
      branchNote:'→ Stage 2, Contexto B (caos y sin evidencia)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'C', text:'Contención Lógica',
      sub:'Aislar los segmentos afectados, capturar imagen de RAM y preservar evidencia forense',
      cost:50000, hours:6,
      type:'correct', typeLabel:'CORRECTA', repCost:0,
      consequence:'El equipo asegura evidencia digital valiosa. El análisis de RAM revela el ransomware activo. El Core Bancario queda protegido en un segmento aislado. Tienen evidencia para actuar en el Stage 2.',
      waitStory:'En las primeras seis horas, el equipo ejecutó el manual correctamente. Los segmentos de RRHH quedaron aislados con reglas de firewall de emergencia sin afectar el Core. La imagen RAM capturada a las 10:47 AM preservó el estado completo del malware en ejecución: su proceso madre, sus conexiones de red activas y —crucialmente— la clave de cifrado en memoria antes de que el malware la borrara automáticamente.\n\nEl análisis preliminar confirma: es LockBit 3.0, variante modificada. El vector de entrada fue un correo de phishing dirigido a un empleado hace 21 días. El malware estuvo en modo sigiloso tres semanas antes de activarse el viernes por la mañana. El equipo forense tiene ahora un perfil técnico completo del atacante.\n\nEntran al siguiente ciclo con ventaja táctica real: evidencia sólida, Core a salvo y tiempo para actuar con inteligencia. Pero la nota de rescate llegará pronto. La pregunta no es si van a recibir una extorsión —es qué harán cuando los números sean astronómicos y el reloj esté corriendo. Piensen cómo quieren manejar esa conversación.',
      branchNote:'→ Stage 2, Contexto A (evidencia asegurada)',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Retener Negociador',
      sub:'Contratar un negociador de rescate antes de saber si hay un ataque de ransomware activo',
      cost:300000, hours:8,
      type:'trap', typeLabel:'PREMATURA', repCost:5,
      consequence:'Gastan recursos sin que haya una nota de rescate todavía. El negociador no tiene nada con qué trabajar. El malware sigue propagándose durante las 8 horas que tardó en llegar el negociador.',
      waitStory:'El negociador llegó cargando un maletín y sin nada con qué trabajar. No había nota de rescate. No había contacto del atacante. No había datos cifrados confirmados. El equipo pasó 8 horas en una sala de conferencias sin información útil, mientras el malware seguía propagándose silenciosamente por los servidores del banco.\n\nAl final de las ocho horas, el negociador facturó sus honorarios. El malware había alcanzado los servidores de recursos humanos completos y estaba sondeando el segmento de datos de clientes. Los $300,000 gastados fueron, en esencia, tiempo de propagación pagado. El atacante usó esas 8 horas para fortalecer su posición dentro de la red.\n\nEl próximo stage comienza con recursos comprometidos y el atacante en posición mucho más sólida. Cuando llegue la nota de rescate, el monto reflejará exactamente cuánto avanzó el ataque durante esas horas. Un negociador es una herramienta útil —pero solo cuando hay algo que negociar. La secuencia de las acciones importa tanto como las acciones mismas.',
      branchNote:'→ Stage 2, Contexto B (recursos desperdiciados)',
      penalty:0, nextCtx:'B'
    },
    {
      letter:'E', text:'Comprar EDR',
      sub:'Adquirir e instalar una solución de Endpoint Detection & Response de emergencia',
      cost:150000, hours:18,
      type:'trap', typeLabel:'PREMATURA', repCost:5,
      consequence:'La instalación del EDR tarda 18 horas. Durante ese tiempo el ataque avanza sin freno. El EDR queda operativo cuando ya es tarde para la fase de infección inicial. Falsa sensación de seguridad.',
      waitStory:'Dieciocho horas. Ese fue el tiempo que tardó el equipo de instalación del EDR en licenciar el software, desplegarlo en los 847 endpoints del banco, configurar las reglas de detección y validar la consola central. Dieciocho horas en las que el ransomware trabajó completamente sin obstáculos, con acceso libre a toda la red interna.\n\nEl EDR quedó operativo a las 4:00 AM del sábado —precisamente cuando el malware había completado su misión de cifrado. Las primeras alertas que generó la nueva herramienta documentaban un ataque ya consumado: 23,000 archivos cifrados, 4 servidores comprometidos, y una nota de rescate activa desde la medianoche. La herramienta funcionaba perfectamente. Solo que llegó tarde.\n\nEl próximo stage comienza con una plataforma de detección impecable y nada útil que detectar. El dinero gastado en el EDR no tiene retorno inmediato —aunque podría tener valor en stages futuros si el equipo sabe usarlo. Lo que no puede recuperarse son las 18 horas de ventana donde el ataque avanzó sin respuesta. Piensen en qué pueden hacer todavía con los recursos que les quedan.',
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
      type:'trap', typeLabel:'TRAMPA', repCost:10,
      consequence:'El ransomware tenía un módulo de persistencia en el servidor de backups. Al activar la restauración, cifra también los backups. Pierden la única copia de seguridad. Se aplica penalización de $1,000,000 al finalizar el juego.',
      waitStory:'Cuando el técnico ejecutó el comando de restauración, la sala quedó en silencio. Segundos después, los monitores comenzaron a mostrar barras de progreso que avanzaban demasiado rápido —demasiado rápido para ser una restauración real. El módulo de persistencia del ransomware, instalado semanas antes precisamente en el servidor de backups, se activó ante la actividad inusual y ejecutó su segunda fase de cifrado.\n\nEn 47 minutos, las doce semanas de backups disponibles quedaron cifradas. La única copia de seguridad del banco dejó de existir como tal. No hay recuperación posible sin los archivos originales en manos del atacante, que ahora tiene todavía más poder de negociación. Los backups son la última línea de defensa en una crisis de ransomware —y acaban de perderla.\n\nEl siguiente stage llega con una deuda invisible: $1,000,000 de penalización diferida que aparecerá en el resultado final. Más grave aún: sin backups, cualquier decisión de recuperación técnica en los stages siguientes será mucho más costosa y arriesgada. Antes de decidir en el próximo ciclo, piensen en lo que tienen disponible para recuperar. La respuesta puede sorprenderlos.',
      branchNote:'PENALIZACIÓN: -$1,000,000 al final. Backups destruidos.',
      penalty:1000000, isPendingPenalty:true, penaltyLabel:'Backups destruidos',
      destroysBackups:true, nextCtx:'B'
    },
    {
      letter:'B', text:'Contención Lógica Tardía',
      sub:'Aislar sectores y capturar evidencia aunque sea de forma tardía',
      cost:150000, hours:10,
      type:'recycled', typeLabel:'RECICLADA', repCost:5,
      consequence:'Si están en Contexto B: el costo se triplica a $450,000 por el trabajo extra de reconstruir evidencia destruida. Logran identificar el ransomware y pasan al siguiente stage con evidencia parcial.',
      waitStory:'Llegar tarde a la contención tiene su precio, pero el equipo demostró que un procedimiento correcto —aunque tardío— todavía puede salvar la situación. La imagen RAM parcial y los fragmentos de log recuperados permitieron al equipo forense reconstruir aproximadamente el 60% de la cadena de ataque. No es la evidencia ideal, pero es suficiente para trabajar con ella.\n\nSi venían del Contexto B, el costo fue significativamente mayor: reconstruir evidencia destruida requiere herramientas especializadas, tiempo en sala limpia y un peritaje externo que costó tres veces más de lo que habría costado hacerlo correctamente en el Stage 1. La factura refleja exactamente el precio de las decisiones anteriores: $300,000 de sobrecosto que no existiría si hubieran contenido primero.\n\nEntran al siguiente ciclo con evidencia parcial y el Core estabilizado. No es la posición ideal, pero es una posición gestionable. Recuerden que el próximo stage traerá presión mediática y regulatoria —y con evidencia parcial, la respuesta a esas preguntas será más difícil de dar. Piensen qué información tienen disponible y cómo pueden usarla.',
      branchNote:'→ Stage 3, Contexto A (evidencia recuperada, costo elevado si Ctx B)',
      penalty:0, ctxBMultiplier:3, nextCtx:'A'
    },
    {
      letter:'C', text:'Equipo IR / Ganar Tiempo',
      sub:'Contratar un equipo de Incident Response externo y negociar tiempo con el atacante',
      cost:50000, hours:8,
      type:'correct', typeLabel:'CORRECTA', repCost:0,
      consequence:'El equipo IR congela el reloj de la extorsión. Ganan tiempo operativo. Mantienen el Core estable. El atacante acepta "negociar" —lo que da espacio para la respuesta técnica sin pagar nada.',
      waitStory:'El equipo de Incident Response llegó a la sede central a las 11:30 PM. Lo primero que hicieron fue abrir un canal de comunicación con el atacante —no para negociar el pago, sino para comprar tiempo técnico. "Necesitamos verificar internamente la disponibilidad de fondos", fue el mensaje. El atacante, acostumbrado a este intercambio, aceptó extender el plazo 24 horas.\n\nEsas 24 horas son oro puro. Mientras el equipo IR mantenía ocupado al atacante con comunicaciones deliberadamente lentas, el equipo técnico desplegó herramientas de análisis avanzado, identificó los vectores de propagación activos y bloqueó los canales de comando y control del ransomware. El Core Bancario quedó estabilizado detrás de un segmento temporal que el IR construyó en 4 horas. Sin pagar un solo centavo.\n\nEl siguiente stage comienza con tiempo comprado, Core estable y un equipo externo con experiencia real en ransomware bancario. Pero el tiempo comprado no es tiempo indefinido —el atacante tiene límites de paciencia. En el próximo ciclo llegará la presión regulatoria y mediática. Cómo responden a esas dos frentes simultáneamente determinará si la crisis se contiene o explota hacia otro lado.',
      branchNote:'→ Stage 3, Contexto A',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Pago Silencioso',
      sub:'Pagar los $3,000,000 de rescate en Bitcoin sin notificar a las autoridades',
      cost:3000000, hours:2,
      type:'trap', typeLabel:'TRAMPA EJECUTIVA', repCost:25,
      consequence:'El pago es ilegal según la regulación financiera. El grupo ransomware recibe el pago pero envía una segunda nota exigiendo $2,000,000 adicionales —extorsión doble. El dinero se perdió y la situación empeoró.',
      waitStory:'Las 3,000 unidades de Bitcoin salieron de la billetera corporativa a las 2:17 AM del sábado. La transacción fue confirmada por la red blockchain en 12 minutos. El CEO esperaba recibir las claves de descifrado en las horas siguientes. En cambio, a las 3:05 AM llegó un nuevo correo al mismo canal: "Buen intento. Tenemos copias de los datos en servidores adicionales que no mencionamos. Precio final: $2,000,000 adicionales. Tienen 12 horas. Próxima filtración: datos de nómina de los últimos 3 años."\n\nLos $3,000,000 se fueron y no hay forma legal ni técnica de recuperarlos. El banco ahora es un objetivo conocido que paga —lo que lo convierte en blanco prioritario para ataques futuros del mismo grupo y de grupos que monitorean estos pagos en blockchain. Además, el pago de rescate sin notificación a las autoridades constituye una infracción regulatoria grave que la CNBV tratará como agravante.\n\nEl siguiente stage llega con la segunda extorsión activa, una amenaza de filtración de datos de nómina y la ilegalidad del pago como contexto. Cada decisión del próximo ciclo cargará el peso de este doble error. Piensen cómo pueden recuperar algo de terreno cuando el margen financiero y regulatorio se ha reducido tanto.',
      branchNote:'→ Stage 3, Contexto B (ilegalidad + extorsión doble)',
      penalty:0, paidRansom:true, nextCtx:'B'
    },
    {
      letter:'E', text:'Comunicado a Clientes',
      sub:'Emitir un comunicado público a los 180,000 clientes antes de saber qué datos fueron comprometidos',
      cost:100000, hours:6,
      type:'trap', typeLabel:'PREMATURA',
      consequence:'Sin saber qué fue cifrado ni qué datos se vieron afectados, el comunicado genera alarma masiva. Se inicia una corrida bancaria digital. El regulador llama furioso. El daño reputacional multiplica la crisis.',
      waitStory:'El comunicado se publicó a las 6:00 AM del sábado con la mejor intención: transparencia proactiva. Para las 8:00 AM, el hashtag #MeridianHackeado tenía 47,000 menciones en redes sociales. Para las 10:00 AM, las líneas de atención al cliente estaban completamente saturadas. Para el mediodía, los cajeros automáticos registraban volúmenes de retiro ocho veces superiores al promedio de un sábado.\n\nEl problema no fue comunicar —fue comunicar sin información. El mensaje no pudo responder las preguntas básicas que cualquier cliente se haría: ¿Qué datos fueron afectados específicamente? ¿Están seguros mis ahorros? ¿El banco sigue operando? Sin respuestas concretas, los 180,000 clientes asumieron el peor escenario posible y actuaron en consecuencia. La corrida bancaria digital no fue causada por el ataque —fue causada por el comunicado prematuro.\n\nEl regulador llamó al CEO directamente a las 11:30 AM: "Esto no cumple el protocolo SGSI de manejo de incidentes." El siguiente stage llega con pánico en redes activo, el regulador en modo confrontacional y la prensa esperando cualquier nuevo error para amplificarlo. La comunicación en crisis tiene reglas muy específicas —y el timing lo es todo.',
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
      waitStory:'Claudia M. fue convocada a una reunión de crisis sin que nadie le explicara por qué. Cuando salió 45 minutos después ya no tenía credenciales de acceso a los sistemas del banco. El comunicado interno la nombraba como "empleada que comprometió los protocolos de seguridad institucionales". Salió del edificio sin entender completamente qué había hecho mal.\n\nLo que el análisis forense confirma: Claudia recibió un correo aparentemente legítimo de un proveedor de LinkedIn. El correo tenía firma digital válida y un dominio que difería en una sola letra del proveedor real. Ninguno de los sistemas de filtrado del banco lo detectó. No hubo negligencia —fue un ataque de spear phishing sofisticado que habría engañado a cualquier empleado sin entrenamiento específico en esa técnica. El banco no la entrenó porque tampoco conocía ese vector.\n\nEl abogado de Claudia presentó la demanda dos horas después de su suspensión. La CNBV inició una investigación paralela sobre el proceso de investigación del banco —que ahora debe defenderse de dos frentes simultáneos. La multa es de $1,000,000, pero el costo real es la narrativa: un banco que culpa a sus empleados en lugar de proteger sus sistemas tiene muy pocas probabilidades de recuperar la confianza del regulador antes del cierre de la crisis.',
      branchNote:'PENALIZACIÓN: -$1,000,000. Demanda laboral activa. → Stage 4, Contexto B',
      penalty:1000000, isPendingPenalty:false, laborLawsuit:true, nextCtx:'B'
    },
    {
      letter:'B', text:'Silencio Corporativo',
      sub:'No comunicar nada a clientes, prensa ni regulador hasta tener el panorama completo',
      cost:0, hours:4,
      type:'trap', typeLabel:'TRAMPA LEGAL',
      consequence:'Ocultar un incidente material es una infracción regulatoria grave. El regulador descubre el silencio a través de un reporte externo. Multa máxima de $3,000,000. El banco queda bajo supervisión especial.',
      waitStory:'Durante cuatro horas, el equipo legal del banco argumentó que "hablar demasiado pronto podría comprometer la investigación". La lógica tenía sentido en abstracto. Durante esas mismas cuatro horas, un analista de seguridad independiente que detectó tráfico anómalo saliendo de servidores del banco publicó sus hallazgos en Twitter con capturas de pantalla. El regulador los vio antes de recibir cualquier comunicación oficial del banco.\n\nLa llamada del Superintendente de Bancos llegó a las 6:30 PM del sábado. No fue una solicitud de información. Fue una notificación de que se había iniciado formalmente un proceso sancionatorio por incumplimiento del artículo 112-bis del reglamento de gestión de riesgo operativo: ocultamiento de incidente material con impacto potencial en clientes. La ley no exige que el banco tenga el panorama completo para reportar —exige que reporte el incidente apenas lo detecta, aunque sea incompleto.\n\nLa multa de $3,000,000 es el piso, no el techo. El banco queda bajo supervisión especial, lo que significa que cada decisión en los stages siguientes tendrá un supervisor regulatorio mirando por encima del hombro. Operar bajo supervisión especial elimina opciones y multiplica los tiempos. La transparencia temprana —aunque incompleta— siempre es menos costosa que el silencio descubierto.',
      branchNote:'PENALIZACIÓN: -$3,000,000. Supervisión regulatoria. → Stage 4, Contexto B',
      penalty:3000000, isPendingPenalty:false, silentCorp:true, nextCtx:'B'
    },
    {
      letter:'C', text:'Comunicación SGSI',
      sub:'Activar el protocolo de comunicación del Sistema de Gestión de Seguridad de la Información',
      cost:250000, hours:6,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El protocolo SGSI proporciona mensajes preaprobados para reguladores, clientes y prensa. Se frena el pánico. El regulador recibe el informe preliminar requerido. La reputación se estabiliza. El banco mantiene el control del relato.',
      waitStory:'A las 3:15 PM del sábado, tres comunicados salieron simultáneamente: uno para el regulador con el informe técnico preliminar en el formato exigido por la norma, uno para empleados con instrucciones operativas claras, y un mensaje público breve que confirmaba "una interrupción de sistemas bajo control activo" sin revelar detalles que pudieran comprometer la investigación o generar pánico adicional.\n\nEl protocolo SGSI existe precisamente para este momento. Los mensajes estaban preaprobados por el departamento legal, calibrados para dar información sin generar alarma y diseñados para cumplir con los plazos regulatorios de reporte. No es comunicación espontánea —es comunicación de crisis ejecutada con precisión. El regulador recibió el informe antes del plazo de cuatro horas. La respuesta fue escueta pero significativa: "Confirmamos recepción. Manténganos informados."\n\nEl siguiente stage llega con el regulador en modo colaborativo, la prensa con pocas razones para especular negativamente y el equipo técnico con espacio para trabajar sin interferencia externa. Eso no significa que sea fácil —el Stage 4 traerá la carrera más difícil del juego. Pero significa que tienen las condiciones mínimas para que la recuperación técnica sea posible. Un regulador aliado en el Stage 4 vale más que cualquier herramienta técnica.',
      branchNote:'→ Stage 4, Contexto A',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'D', text:'Threat Hunting Activo',
      sub:'Lanzar una operación intensiva para identificar y eliminar todas las puertas traseras de la red',
      cost:300000, hours:18,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El equipo encuentra y elimina 3 puertas traseras que el atacante dejó para persistencia. La red queda limpia. El tiempo consumido es alto pero la seguridad está garantizada para Stage 4.',
      waitStory:'Dieciocho horas de trabajo ininterrumpido. Tres equipos rotando en turnos de seis horas. El primer backdoor fue encontrado a las 5:00 AM en un servidor de autenticación secundario que nadie usaba desde hacía meses —precisamente por eso el atacante lo eligió. El segundo, a las 11:00 AM, embebido en un proceso de sincronización de bases de datos que se ejecutaba automáticamente cada noche. El tercero —el más sofisticado— fue descubierto a las 3:00 PM integrado dentro de un módulo de actualización automática del antivirus corporativo.\n\nTres niveles de persistencia. Si el banco hubiera iniciado la recuperación técnica sin esta operación, habría reactivado el ransomware desde el interior de sus propios sistemas de recuperación —el resultado habría sido catastrófico. La operación fue costosa en tiempo y dinero, pero el resultado es definitivo: red auditada con certificación forense de limpieza total.\n\nEl siguiente stage llega con una ventaja técnica única: cualquier proceso de recuperación puede ejecutarse sin miedo a reinfección. El reloj está más ajustado —18 horas menos disponibles para llegar al lunes— pero la seguridad de los sistemas está garantizada. En el Stage 4 deberán elegir qué hacer con esa ventaja. El tiempo es crítico: calcúlenlo bien antes de decidir.',
      branchNote:'→ Stage 4, Contexto A (red segura)',
      penalty:0, nextCtx:'A'
    },
    {
      letter:'E', text:'Migrar a la Nube',
      sub:'Iniciar una migración de emergencia de toda la infraestructura a la nube en 48 horas',
      cost:2500000, hours:48,
      type:'extreme', typeLabel:'EXTREMA',
      consequence:'Una migración de arquitectura completa en 48 horas es técnicamente imposible. El equipo colapsa. El proyecto fracasa. Se consumen 48 horas del presupuesto temporal y $2.5M del presupuesto financiero. El banco no abre el lunes.',
      waitStory:'El equipo de infraestructura llevaba 28 horas trabajando sin descanso cuando el Gerente de TI entró a la sala y dijo en voz baja lo que todos sabían: "No vamos a terminar." La migración de una arquitectura bancaria certificada por el regulador requiere meses de planificación, pruebas de cumplimiento normativo, validación de integridad de datos y certificación del ambiente destino. No 48 horas de emergencia con equipos agotados.\n\nA las 36 horas, el 30% de la arquitectura estaba parcialmente migrada en un estado híbrido no certificado. El 70% restante seguía en los servidores originales, algunos ya comprometidos. La coexistencia de sistemas en dos ambientes generó inconsistencias en las bases de datos de clientes que ningún sistema podía resolver automáticamente. El ambiente nube no tenía las certificaciones regulatorias para operar en producción.\n\nEste camino lleva directamente al peor estado del Stage 5. El banco no abrirá el lunes. Los sistemas están en un estado intermedio que es técnicamente más complejo que el ataque original. Los $2,500,000 gastados no produjeron ningún resultado recuperable. La presentación ante el regulador en el Stage 5 comenzará desde el escenario más adverso posible. Utilicen los recursos que les quedan con máxima precisión.',
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
      waitStory:'El script tenía 847 líneas de código Python publicado en un foro de seguridad con doce votos positivos. El técnico que lo ejecutó argumentó que "había funcionado en casos similares". Lo que nadie leyó fue el bloque de código en la línea 203 que, al detectar la presencia de tablas de transacciones bancarias en formato propietario, ejecutaba una rutina de "limpieza de datos corrompidos" que interpretaba como corruptos exactamente esos formatos propietarios del Core CBS.\n\nLas primeras tablas sobrescritas fueron las de transacciones del viernes —el día del ataque. Luego las del jueves. Luego la semana anterior. El proceso tardó 12 horas en completarse y cuando finalizó, seis meses de historial transaccional habían sido irreversiblemente sobrescritos con ceros. La corrupción no tiene solución técnica posible.\n\nEl banco no puede abrir el lunes porque sin el historial transaccional completo no puede operar dentro de los parámetros de integridad contable exigidos por el regulador. El Stage 5 comienza en el peor escenario técnico posible. La pregunta ante el regulador no será "por qué tardaron en abrir" sino "si alguna vez podrán volver a operar normalmente". Lleguen al Stage 5 con la mejor narrativa que puedan construir.',
      branchNote:'→ Stage 5, Estado Crítico (bases de datos corrompidas)',
      penalty:0, nextCtx:'C'
    },
    {
      letter:'B', text:'Degradación Aceptable / DRP',
      sub:'Activar el Plan de Recuperación de Desastres: Core básico + cajeros al 60% de capacidad',
      cost:800000, hours:18,
      type:'correct', typeLabel:'CORRECTA',
      consequence:'El equipo ejecuta el DRP con precisión. El Core básico, los cajeros y la banca digital quedan operativos al 60% de capacidad. El lunes a las 10:00 AM el banco abre. Misión cumplida.',
      waitStory:'A las 6:00 AM del domingo, el Director de Tecnología presentó el plan al Comité de Crisis: Core básico en modo transaccional esencial, cajeros al 60% de capacidad operativa, y banca digital con funcionalidades de consulta y transferencia simple. Treinta y dos páginas del Plan de Recuperación de Desastres que el banco actualizó hace 18 meses y que nadie esperaba necesitar tan pronto.\n\nLa ejecución fue meticulosa. Cada componente subió en orden estricto, validado antes de conectar el siguiente. A las 9:47 AM del lunes —trece minutos antes de la apertura— el Director de Tecnología confirmó al Comité: "Estamos listos." El banco abrió al 60% de capacidad. Los clientes notaron algunas limitaciones en servicios avanzados pero los cajeros funcionaron y las transferencias esenciales procesaron sin interrupciones.\n\nEl Stage 5 llega con la ventaja más importante del juego: el banco abrió el lunes. Ese hecho define el piso mínimo del resultado final. Cuánto más arriba lleguen en el estado final depende de las penalizaciones acumuladas en stages anteriores y de cómo gestionen la presentación ante el regulador y los accionistas. El Stage 5 es el más importante de todos —y ahora lo enfrentan desde la mejor posición posible.',
      branchNote:'→ Stage 5, Estado según presupuesto y decisiones previas. ABRIERON EL LUNES.',
      penalty:0, openedMonday:true, nextCtx:'A'
    },
    {
      letter:'C', text:'Recovery Broker',
      sub:'Contratar un intermediario que promete descifrar los archivos por $1,000,000 en 5 horas',
      cost:1000000, hours:5,
      type:'trap', typeLabel:'TRAMPA / ESTAFA',
      consequence:'El "Recovery Broker" es una estafa. Desaparece con el millón de dólares. Pierden 5 horas críticas y $1M. Cuando intentan el siguiente plan ya no hay margen de tiempo para abrir el lunes.',
      waitStory:'El Recovery Broker se presentó en videollamada desde una conexión con VPN múltiple. Mostró tres casos de éxito con logotipos de empresas reconocidas internacionalmente. Prometió "acceso directo a grupos de ransomware para negociación técnica de claves". El pago —$1,000,000 en USDT— era irrevocable por diseño del sistema de pagos cripto.\n\nCuatro horas después del depósito, el número de WhatsApp del broker quedó desconectado. La dirección de billetera cripto no tenía historial previo de transacciones legítimas. No había empresa registrada en ningún país. La Interpol confirmó en 20 minutos que el perfil correspondía a un operador conocido que había ejecutado al menos cuatro estafas similares en instituciones financieras de América Latina en los últimos 18 meses.\n\nEl daño no es solo el millón de dólares desaparecido. Son las cinco horas perdidas mientras el reloj del lunes corría sin margen. El banco ya no tiene tiempo suficiente para ejecutar el DRP completo antes de la apertura. El Stage 5 comenzará con el banco cerrado y el regulador esperando una explicación de por qué, además de gestionar el ataque, perdieron $1,000,000 en una estafa que cualquier revisión básica habría detectado.',
      branchNote:'→ Stage 5, Estado Crítico o Grave (estafados + sin tiempo)',
      penalty:0, nextCtx:'C'
    },
    {
      letter:'D', text:'Parche Suicida',
      sub:'Aplicar un parche de seguridad directamente sobre los servidores infectados sin aislar primero',
      cost:100000, hours:8,
      type:'fatal', typeLabel:'FATAL',
      consequence:'En Contexto B: el ransomware todavía activo detecta la actividad y cifra la copia de recuperación. GAME OVER técnico. En Contexto A: el parche funciona parcialmente pero daña módulos del Core.',
      waitStory:'La decisión de aplicar el parche directamente sobre los servidores infectados tiene una lógica superficial: si el parche sella la vulnerabilidad, el ransomware pierde su canal de comunicación y eventualmente se inactiva. Esa lógica es correcta en condiciones normales. Lo que ignora es un detalle crítico que cualquier equipo de Incident Response habría señalado: el módulo de defensa de LockBit 3.0 monitorea específicamente la actividad de parches en servidores donde reside.\n\nEn Contexto B, con el ransomware todavía activo en la red, la aplicación del parche disparó el protocolo de "detección de limpieza" del malware. En tres minutos, el ransomware ejecutó su protocolo de destrucción: cifró los servidores de recuperación, los backups de último recurso y los logs de auditoría que hubieran servido de evidencia ante el regulador. No hay reversión posible.\n\nNo hay Stage 5 con posibilidad de recuperación. La pantalla muestra COLAPSO TOTAL. En Contexto A, el daño es menor pero los módulos del Core quedan comprometidos y el banco no abre el lunes. El aislamiento previo a cualquier intervención técnica no es un paso opcional en un entorno comprometido —es la diferencia entre recuperación y colapso.',
      branchNote:'CTX B → GAME OVER. CTX A → Stage 5, Estado Grave.',
      penalty:0, fatalIfCtxB:true, destroysBackups:true, nextCtx:'D'
    },
    {
      letter:'E', text:'Threat Hunting Tardío',
      sub:'Dedicar las próximas 24 horas a limpiar la red antes de intentar cualquier recuperación',
      cost:600000, hours:24,
      type:'recycled', typeLabel:'RECICLADA',
      consequence:'La red queda perfectamente segura, pero consumen 24 horas en el proceso. Ya no hay tiempo para restaurar los sistemas antes del lunes. El banco no abre. Técnicamente correcto, estratégicamente tardío.',
      waitStory:'La red quedó perfectamente auditada a las 10:00 AM del domingo. Sin backdoors, sin módulos durmientes, sin procesos sospechosos en ninguno de los 847 endpoints. El informe forense tiene 340 páginas de documentación de limpieza total con hash verification de cada archivo crítico. Es, técnicamente, una operación de seguridad impecable que cualquier auditor reconocería como correcta.\n\nEl problema es aritmético. La apertura obligatoria del lunes a las 10:00 AM está a 24 horas. El DRP mínimo viable requiere exactamente 36 horas de ejecución controlada. El equipo técnico tiene garantías de seguridad absolutas pero no tiene tiempo físico para usarlas. Ejecutar el DRP a la mitad sería peor que no ejecutarlo.\n\nEl Stage 5 comenzará con el banco cerrado. La red está limpia —eso reducirá levemente las consecuencias comparado con otros caminos que llevan al mismo resultado— pero el regulador, los accionistas y los 180,000 clientes que no pudieron operar el lunes no hacen distinciones operativas finas. El Stage 5 es la presentación final: lleguen con los argumentos más sólidos posibles. La narrativa de "hicimos lo técnicamente correcto" puede tener valor si se presenta bien.',
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
