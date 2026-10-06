# Contenido de servicios en páginas municipales

## Cambios

Se amplían las 101 páginas ya existentes, sin cambiar sus URLs. Cada página incluye nueve servicios con síntoma, comprobación y alcance de reparación; siete preguntas frecuentes; condiciones para organizar el aviso; formulario WhatsApp con localidad preseleccionada y retorno al directorio provincial.

Las explicaciones técnicas se comparten por servicio y se declaran orientativas. No son trabajos locales ni casos de clientes, no se afirma una exclusividad editorial municipal inexistente y no se inventan sedes, reseñas, plazos o tarifas. Se elimina la atribución aleatoria de una avería a una localidad según el orden alfabético. Sigue siendo necesario aportar experiencia local real y confirmar las condiciones operativas del negocio; añadir texto no garantiza posicionamiento.

## Correcciones pendientes resueltas

- Los 101 nombres de pueblos del inicio enlazan a su URL municipal real; la construcción falla si falta un destino.
- En móvil, el hero municipal y provincial no repite teléfono/WhatsApp junto a la barra fija.
- Las tarjetas de enlaces sin número dejan de ocupar una columna de 40 px; los nuevos bloques de servicios usan títulos de ancho normal y detalles nativos sin JavaScript.
- Los enlaces alfabéticos dejan de heredar la altura de la cabecera.
- Las localidades relacionadas se etiquetan como otras de la provincia, no como cercanas: no se dispone de coordenadas para afirmar proximidad.
- BreadcrumbList y Service por municipio, canonical/títulos/teléfono preservados, sitemap XML regenerado sin escapes literales y favicon con colores válidos.
- Las vistas de prueba de Netlify quedan noindex; producción conserva index/follow.

## Comprobación

Se añaden pruebas de contenido en todas las páginas generadas y pruebas de navegador para 320, 375, 390, 430, 650, 768 y 1440 px en Chromium y WebKit. Se valida navegación inicio → municipio, detalles sin JavaScript, nombres bilingües y composición del mensaje de WhatsApp interceptando window.open: no se envía ningún mensaje.

## Fuentes técnicas consultadas

- https://www.electrical-installation.org/enwiki/Description_of_RCDs
- https://www.electrical-installation.org/enwiki/Protection_against_fire_due_to_insulation_failure
- https://www.edistribucion.com/es/averias.html
- https://www.boe.es/buscar/act.php?id=BOE-A-2002-18099
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=es

Estos enlaces no equivalen a una revisión firmada por un instalador. La revisión del profesional que presta el servicio sigue siendo recomendable antes de dar por cerrados los textos técnicos.
