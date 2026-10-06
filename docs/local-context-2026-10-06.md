# Revisión local — 6 de octubre de 2026

## Alcance real
Se conservan las 117 URLs existentes: portada, cinco provincias, 101 municipios y diez guías de servicios. No se amplía cobertura ni se afirman oficinas locales, tiempos de llegada o trabajos que no estén documentados. El teléfono, las urgencias 24 horas y el contacto único en móvil se mantienen.

## Información local verificable
Se han contrastado los 101 municipios con las tablas oficiales del Instituto Geográfico Nacional (IGN). Cada URL se vincula a un código municipal único, una provincia y la cabecera de su municipio. Se distingue, por ejemplo, Asparrena/Araia y Camargo/Muriedas; se mantiene la URL de Las Rozas y se aclara su denominación oficial, Las Rozas de Madrid.

La referencia del mapa identifica aproximadamente el municipio: no representa una oficina, la ubicación de un técnico ni una dirección de cliente. No se publican estadísticas de población, altitud o extensión como relleno ajeno al servicio.

Los enlaces a cinco municipios del mismo directorio se ordenan mediante la distancia entre las referencias geográficas del IGN. No se utiliza el orden alfabético como sustituto de proximidad, y no se muestran distancias por carretera ni estimaciones de llegada.

## Servicios sin repetir nueve guías enteras
Cada página municipal conserva nueve explicaciones breves de síntomas y los datos que ayudan a preparar cada tipo de aviso. Los párrafos largos de comprobación y reparación no se duplican íntegramente en los 101 municipios: se accede a las guías especializadas existentes.

Las preguntas locales se centran en identificar el municipio, distinguir el núcleo o barrio, elegir la ficha correcta y consultar las condiciones de atención. Los contenidos eléctricos generales y las condiciones comunes siguen compartidos. No se utiliza rotación de sinónimos, reordenación aleatoria ni un porcentaje artificial de palabras diferentes.

El formulario añade provincia y barrio/núcleo opcional. Cada servicio puede preseleccionarse al preparar la consulta. El mensaje se compone en el dispositivo y el usuario confirma el envío en WhatsApp; no se envía automáticamente.

## Fuentes y actualización
- https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS_ES-PV.json
- https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS_ES-CB.json
- https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS_ES-MD.json

Consulta: 2026-10-06. Los tamaños y hashes SHA-256 de origen están en `content/local-geography-provenance.json`. El recopilador manual no modifica ni publica páginas. Los builds normales usan el subconjunto de datos versionado, sin depender de una consulta externa.

## Verificaciones incorporadas
- Una referencia válida por municipio, sin códigos o rutas duplicados ni provincias ajenas al alcance.
- Fallo explícito al añadir una página municipal sin referencia revisada.
- Mantenimiento de URLs, canonical, sitemap, teléfono y enlaces directos desde portada.
- Jerarquía de provincia/pueblo y guías de servicios con destinos válidos.
- Cinco enlaces geográficos únicos, de la misma provincia y sin enlazarse a sí misma.
- Formularios con localidad, provincia y zona; pruebas sin llamadas ni envío real.
- Contacto único y lectura de servicios en móvil, pruebas sin JavaScript, Chromium y WebKit.

## Lo que esta revisión NO acredita
La diferenciación geográfica no equivale a 101 historiales de trabajos locales ni garantiza indexación, posiciones o ausencia de acciones de Google. La plantilla y parte del contenido siguen siendo comunes porque explican el mismo servicio. No se debe presentar esta revisión como SEO perfecto.

Antes de una expansión masiva, añadir información operativa verificada (cobertura, condiciones y responsable técnico) y trabajos locales reales cuando existan, y revisar rendimiento e indexación en Search Console. No crear más URLs solo cambiando nombres o incorporando geografía irrelevante.

Referencias editoriales:
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=es
- https://developers.google.com/search/docs/essentials/spam-policies?hl=es
