/** Shared service guide. Do not present these explanations as local case histories. */
export const localServices = [
  {
    slug: 'sin-luz-en-casa', title: 'Apagones y vivienda sin luz',
    symptom: 'Se ha apagado toda la casa, solo una habitación o varios enchufes. También puede ocurrir que las palancas del cuadro estén arriba y no llegue corriente.',
    review: 'La revisión distingue entre alimentación, protecciones y circuitos interiores. Saber si los vecinos y las zonas comunes conservan la luz ayuda a orientar el aviso, aunque no confirma por sí solo el origen.',
    repair: 'Si el fallo pertenece a la instalación particular, se valora la reparación del circuito o elemento afectado. Una incidencia general de la red corresponde a la distribuidora: este servicio no puede restablecer un apagón de todo el municipio.'
  },
  {
    slug: 'diferencial-que-no-sube', title: 'Diferencial que salta o no sube',
    symptom: 'El diferencial cae inmediatamente, no se mantiene arriba o dispara al utilizar un equipo. El salto puede ser continuo o aparecer solo en determinados momentos.',
    review: 'Se comprueba qué circuito o receptor puede estar provocando una fuga y el comportamiento de la protección. Un diferencial que dispara puede estar funcionando correctamente; no basta ese síntoma para darlo por averiado.',
    repair: 'La propuesta puede consistir en reparar el aislamiento, una conexión o el elemento afectado, o sustituir la protección cuando el diagnóstico lo justifique. No se puentea el diferencial ni se fuerza la palanca para recuperar el suministro.'
  },
  {
    slug: 'reparacion-cuadros-electricos', title: 'Reparación del cuadro eléctrico',
    symptom: 'Un automático no se mantiene conectado, falla una línea o se observan señales de deterioro. Los chasquidos y el olor a quemado requieren atención, no pruebas caseras.',
    review: 'Se revisan conexiones, identificación de circuitos, protecciones y estado del cuadro según la avería. Diferencial y magnetotérmico cumplen funciones distintas; cambiar uno no resuelve necesariamente lo que ocurre en el otro.',
    repair: 'El alcance puede ser una reparación localizada o la renovación de elementos deteriorados. No se aumenta el calibre de una protección sin comprobar la instalación. Antes de empezar conviene acordar los materiales y las comprobaciones incluidas.'
  },
  {
    slug: 'humedad-y-derivaciones', title: 'Humedad, lluvia y derivaciones',
    symptom: 'Los cortes coinciden con lluvia, condensación o una filtración. Puede verse afectada una luminaria exterior, una caja de conexiones, un mecanismo o el aislamiento del cableado.',
    review: 'Se busca el punto afectado y se comprueba el aislamiento. Que la instalación vuelva a funcionar cuando se seca no acredita que esté reparada: la humedad puede reaparecer y el material puede haber quedado deteriorado.',
    repair: 'Según el diagnóstico se sustituyen los componentes dañados y se plantea cómo resolver la entrada de agua, que puede requerir otro oficio. No toques elementos eléctricos mojados ni te acerques a ellos para tomar fotografías.'
  },
  {
    slug: 'sobrecargas-y-cortocircuitos', title: 'Automáticos, sobrecargas y cortocircuitos',
    symptom: 'Se corta la luz al conectar varios aparatos, salta una protección inmediatamente o falla siempre el mismo circuito. No todas estas situaciones se corrigen aumentando la potencia contratada.',
    review: 'Se identifica qué dispositivo actúa y se comprueba la relación entre las cargas y el circuito. Una sobrecarga, un cortocircuito y la actuación del control de potencia son situaciones diferentes.',
    repair: 'La reparación se plantea sobre el origen detectado, no anulando la protección. Si el problema apunta a un electrodoméstico, se aclara si necesita su servicio técnico; localizar el aparato implicado no incluye automáticamente su reparación interna.'
  },
  {
    slug: 'enchufes-e-interruptores', title: 'Enchufes e interruptores averiados',
    symptom: 'Una toma deja de funcionar, el interruptor falla o aparecen marcas de calentamiento. Si un enchufe huele a quemado o produce chispas, no sigas utilizándolo para comprobar si se repite.',
    review: 'Se diferencia un mecanismo deteriorado de un fallo en sus conexiones o en el circuito. Cambiar la tapa exterior no permite valorar ni reparar por sí solo los daños que puedan existir detrás.',
    repair: 'Puede ser necesario sustituir el mecanismo y reparar la conexión afectada. El material debe ser adecuado a la instalación y a su uso. No desmontes enchufes ni manipules conductores; explica dónde está el punto que falla.'
  },
  {
    slug: 'circuitos-enchufes-alumbrado', title: 'Circuitos de enchufes y alumbrado',
    symptom: 'Falla una zona de la vivienda mientras el resto tiene electricidad: varios enchufes, una habitación o una línea de luces. El origen puede estar antes del último punto que ha dejado de funcionar.',
    review: 'Se delimita el tramo afectado y se comprueban su alimentación, conexiones y mecanismos. En iluminación se distingue el circuito de la propia luminaria y de sus componentes.',
    repair: 'Se valora la reparación de la conexión, mecanismo o tramo deteriorado. Indica si hay falsos techos, zonas comunes o puntos de difícil acceso para preparar la intervención, sin abrir cajas ni desmontar elementos antes de la visita.'
  },
  {
    slug: 'averias-intermitentes', title: 'Averías que aparecen y desaparecen',
    symptom: 'La luz vuelve sola o la instalación parece funcionar cuando llega el momento de revisarla. Resulta útil anotar la hora, los equipos en uso y la zona afectada, sin provocar el fallo.',
    review: 'Se contrasta ese patrón con el estado de circuitos, conexiones y protecciones. Puede ser necesario observar distintas condiciones de funcionamiento; no sería riguroso atribuir la causa a una pieza sin comprobarla.',
    repair: 'Una avería intermitente puede requerir una revisión adicional. Se deben aclarar su alcance y condiciones antes de aceptarla. Si hay olor a quemado, chispas o una descarga, deja de utilizar el elemento afectado y solicita ayuda.'
  },
  {
    slug: 'revision-instalacion-electrica', title: 'Revisión de la instalación doméstica',
    symptom: 'Los fallos se repiten, hay elementos deteriorados o se quiere conocer el estado de la instalación antes de plantear una reparación. La antigüedad por sí sola no permite diagnosticar su estado.',
    review: 'Se acuerda qué se va a revisar: cuadro, circuitos, conexiones y medidas de protección. Las comprobaciones de aislamiento y puesta a tierra corresponden al profesional, no a pruebas improvisadas del usuario.',
    repair: 'El resultado permite distinguir reparaciones necesarias de otras mejoras propuestas. Una revisión de averías no equivale automáticamente a un boletín ni a una inspección reglamentaria; cualquier documento se confirma por separado.'
  }
];

export const technicalSources = [
  ['Schneider Electric: funcionamiento del diferencial', 'https://www.electrical-installation.org/enwiki/Description_of_RCDs'],
  ['Schneider Electric: humedad y defectos de aislamiento', 'https://www.electrical-installation.org/enwiki/Protection_against_fire_due_to_insulation_failure'],
  ['e-distribución: averías de suministro y red', 'https://www.edistribucion.com/es/averias.html'],
  ['Reglamento electrotécnico para baja tensión', 'https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099']
];

export function localQuestions(town, province) {
  return [
    [`¿Cómo solicito un electricista en ${town}?`, `Indica que estás en ${town}, ${province}, qué ha dejado de funcionar y desde cuándo. No hace falta que sepas el nombre de la protección. La disponibilidad y las condiciones de desplazamiento se confirman antes de concertar la visita.`],
    ['¿Cuánto cuesta localizar y reparar la avería?', 'Pregunta por el desplazamiento, el diagnóstico, la mano de obra, los materiales y cualquier suplemento aplicable. El coste depende del trabajo necesario. La solicitud de información no debe confundirse con la aceptación de una reparación ni con un presupuesto cerrado.'],
    ['¿Urgencias 24 horas significa llegada inmediata?', 'La atención de urgencias es de 24 horas, pero el desplazamiento y el momento de la visita se confirman al contactar. No se promete un tiempo de llegada fijo sin conocer la localidad y la disponibilidad.'],
    ['¿Se cambia siempre el diferencial cuando salta?', 'No. Puede estar actuando por una fuga en la instalación o en un aparato. La comprobación debe orientar la reparación; cambiar la protección no corrige por sí mismo un defecto de aislamiento.'],
    ['¿Se reparan también hornos, termos o lavadoras?', 'La revisión eléctrica puede localizar que el fallo está relacionado con un aparato. La reparación interna del electrodoméstico no se considera incluida: hay que confirmar si corresponde a su servicio técnico.'],
    ['¿Qué ocurre si también están sin luz los vecinos?', 'Comunícalo al solicitar ayuda. Puede tratarse de una incidencia común o de la red; no confirma por sí solo el origen. Los problemas de distribución se notifican a la distribuidora que figura en la factura, no a este teléfono como si fuera el de la compañía.'],
    ['¿Tengo que mandar una foto del cuadro?', 'No es obligatorio. Solo envía una imagen exterior tomada desde un lugar seguro, sin retirar tapas ni acercarte a elementos mojados o dañados. Una fotografía no sustituye las comprobaciones de la instalación.']
  ];
}
