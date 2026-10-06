/** Content layer after the base generator and mobile pass. No client-side content loading. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { site, provinces } from '../content/site.mjs';
import { localServices, technicalSources } from '../content/local-services.mjs';
import { intakeNotes } from '../content/local-intake.mjs';
import { getLocalContext, nearbyTowns, localIdentity, contextQuestions } from './local-context.mjs';
import { madridPostalCodesByIne, madridPostalSource } from '../content/madrid-postal-codes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode = value => value.replace(/&(amp|lt|gt|quot|#39);/g, (_, k) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[k]));
const plain = value => decode(value.replace(/<[^>]*>/g, '')).trim();
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const canonical = html => decode(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || '');
const href = slug => `/servicios/${slug}/`;
const arrow = '<span aria-hidden="true">→</span>';
const provincesBySlug = new Map(provinces.map(p => [p.slug, p]));

function exactlyOnce(html, expression, replacement, label) {
  const count = [...html.matchAll(new RegExp(expression.source, 'g'))].length;
  if (count !== 1) throw new Error(`Local pages: expected one ${label}, got ${count}`);
  return html.replace(expression, () => replacement);
}

export function townRecord(html) {
  const url = canonical(html);
  const match = new URL(url).pathname.match(/^\/electricista\/([^/]+)\/([^/]+)\/$/);
  if (!match) return null;
  const province = provincesBySlug.get(match[1]);
  const town = plain(html.match(/<meta name="locality" content="([^"]+)"/)?.[1] || '');
  if (!province || !town || town.includes('<')) throw new Error(`Invalid municipality: ${url}`);
  return { town, province: province.name, provinceSlug: province.slug, url, route: new URL(url).pathname };
}


const postalText = codes => codes.join(', ');
const madridPanelPhoto='https://images.pexels.com/photos/38171184/pexels-photo-38171184.jpeg?auto=compress&cs=tinysrgb&w=1400';
function madridLocalExtra(record){
  if(record.provinceSlug!=='madrid') return '';
  const geography=getLocalContext(record);
  const postal=madridPostalCodesByIne[geography.code] || [];
  return `<section class="wrap madrid-local-extra" aria-labelledby="madrid-extra-title"><div><div class="eyebrow">REPARACIÓN ELÉCTRICA EN MADRID</div><h2 id="madrid-extra-title">Cuadros y averías eléctricas en ${escape(record.town)}</h2><p>Revisión de cuadros, diferenciales, automáticos, conexiones y circuitos de vivienda en ${escape(record.town)}. La fotografía es una referencia del tipo de trabajo y no una intervención atribuida a esta localidad.</p>${postal.length?`<p class="madrid-postal"><strong>${postal.length===1?'Código postal asociado':'Códigos postales asociados'}:</strong> ${escape(postalText(postal))}. ${postal.length>1?'El código exacto depende de la dirección concreta. ':''}Indícalo al solicitar el aviso.</p><small class="madrid-postal-source">Fuente postal: Callejero del Censo Electoral (INE), edición 2026-01.</small>`:''}</div><img loading="lazy" decoding="async" src="${madridPanelPhoto}" alt="Protecciones de un cuadro eléctrico de vivienda" width="700" height="470"></section>`;
}

const localIntentVariants=[
  {hero:'Electricista 24 horas en {town}',lead:'Electricista para averías y arreglos puntuales en {town}, {province}: vivienda sin luz, diferencial que salta, automáticos, cuadro eléctrico, enchufes, alumbrado y fallos por humedad. Cuéntanos qué ocurre para confirmar disponibilidad.',services:'Servicios de reparación eléctrica en {town}'},
  {hero:'Reparaciones eléctricas y electricista en {town}',lead:'Reparación de averías eléctricas domésticas en {town}, {province}: apagones, cuadros eléctricos, diferenciales, cortocircuitos, enchufes y circuitos de alumbrado. Atención de urgencias 24 horas sujeta a disponibilidad de desplazamiento.',services:'Averías eléctricas que atendemos en {town}'},
  {hero:'Electricista en {town} para averías domésticas',lead:'Servicio de electricista en {town}, {province}, para localizar y reparar fallos en viviendas: cortes de luz, protecciones que disparan, cuadros, mecanismos, circuitos y problemas relacionados con humedad.',services:'Reparación de averías eléctricas en {town}'},
  {hero:'Urgencias eléctricas 24 horas en {town}',lead:'Consulta asistencia para una urgencia eléctrica en {town}, {province}: falta de suministro en la vivienda, diferencial que no se mantiene, automático que salta, cuadro deteriorado o circuitos sin servicio.',services:'Electricista para urgencias y reparaciones en {town}'}
];
const intentFor=record=>localIntentVariants[[...record.route].reduce((n,ch)=>n+ch.charCodeAt(0),0)%localIntentVariants.length];
const intentText=(text,record)=>text.replaceAll('{town}',escape(record.town)).replaceAll('{province}',escape(record.province));

function serviceGuide(record) {
  const town=escape(record.town);
  return localServices.map((s, i) => `<article class="local-service" id="servicio-${escape(s.slug)}"><div class="local-service-heading"><span class="local-service-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h3>${escape(s.title)} en ${town}</h3></div><p>${escape(s.symptom)}</p><details class="local-service-detail"><summary>Qué revisamos en esta avería</summary><p><strong>Comprobación:</strong> ${escape(s.review)}</p><p><strong>Reparación:</strong> ${escape(s.repair)}</p><p><strong>Para preparar el aviso:</strong> ${escape(intakeNotes[s.slug])}</p><a class="local-prepare-link" href="#consulta-local" data-intake-service="${escape(s.title)}">Preparar este aviso en ${town} ${arrow}</a><a class="local-guide-link" href="${href(s.slug)}" aria-label="${escape(s.title)} en ${town}: diagnóstico y reparación">Ver diagnóstico y reparación ${arrow}</a></details></article>`).join('');
}

function placeSection(record) {
  const g=getLocalContext(record), e=escape;
  const extra=g.enhanced?`<div><dt>Cabecera según el IGN</dt><dd>${e(g.capital)}</dd></div>`:'';
  const source=g.mapUrl?`<a href="${e(g.mapUrl)}" rel="noopener noreferrer" target="_blank">Ver referencia en el mapa del IGN ${arrow}</a><small>Referencia geográfica, no una sede del servicio.</small>`:`<small>Municipio identificado por su código administrativo. No se muestra una ubicación ficticia del servicio.</small>`;
  return `<section class="wrap local-place-section" id="ubicacion-local" aria-labelledby="place-title" data-local-code="${g.code}"><div><div class="eyebrow">SERVICIO EN ${e(record.town).toUpperCase()}</div><h2 id="place-title">Electricista para averías en ${e(record.town)}</h2><p>${e(localIdentity(record))}</p></div><div class="local-place-reference"><dl><div><dt>Municipio</dt><dd>${e(g.officialName)}</dd></div><div><dt>Provincia</dt><dd>${e(record.province)}</dd></div>${extra}</dl>${source}</div></section>`;
}

function localForm(record) {
  const geography = getLocalContext(record);
  return `<section class="local-contact" id="consulta-local" aria-labelledby="consulta-title"><div class="wrap section"><div class="local-contact-layout"><div><div class="eyebrow">CONSULTA SOBRE TU AVERÍA</div><h2 id="consulta-title">Prepara el aviso en ${escape(record.town)}</h2><p>Indica qué falla y desde cuándo. El mensaje se prepara en tu dispositivo; revísalo en WhatsApp antes de enviarlo. No necesitamos que abras el cuadro ni desmontes ningún mecanismo.</p><p>Una consulta no reserva una visita: la atención y sus condiciones se confirman al contactar.</p></div><form class="wa-form" data-whatsapp-form data-phone="${escape(site.whatsapp)}" data-province="${escape(record.province)}"><div class="form-grid"><div class="field"><label for="wa-name">Nombre (opcional)</label><input id="wa-name" name="name" autocomplete="name" maxlength="60"></div><div class="field"><label for="wa-town">Localidad</label><input id="wa-town" name="town" autocomplete="address-level2" maxlength="100" value="${escape(record.town)}" required></div><div class="field full"><label for="wa-area">Barrio o núcleo (opcional)</label><input id="wa-area" name="area" autocomplete="address-level3" maxlength="100" placeholder="${escape(geography.capital)} u otra zona del municipio"><small class="form-help">La dirección completa se acuerda al confirmar la visita.</small></div><div class="field full"><label for="wa-problem">¿Qué ocurre?</label><select id="wa-problem" name="problem" required><option value="">Selecciona una avería</option>${localServices.map(s => `<option>${escape(s.title)}</option>`).join('')}<option>Otra avería eléctrica</option></select></div><div class="field full"><label for="wa-message">Detalles (opcional)</label><textarea id="wa-message" name="message" maxlength="500" placeholder="Por ejemplo: salta al encender el termo."></textarea></div></div><button class="btn wa-submit" type="submit">Preparar consulta en WhatsApp ${arrow}</button><small class="form-help">No se envía automáticamente. Tú confirmas el envío en WhatsApp.</small><noscript><p>Para preparar el mensaje hace falta JavaScript. Puedes utilizar el enlace de WhatsApp o el teléfono del pie.</p></noscript></form></div></div></section>`;
}

export function renderTown(record, otherTowns) {
  const e = escape, town = e(record.town), province = e(record.province), intent=intentFor(record);
  const questions = contextQuestions(record, otherTowns).map(([q,a]) => `<details><summary>${e(q)}</summary><p>${e(a)}</p></details>`).join('');
  const others = nearbyTowns(record, otherTowns);
  return `<main class="local-page" data-local-content="1"><section class="service-hero"><div class="wrap section"><div class="breadcrumbs" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">›</span><a href="/zonas/${record.provinceSlug}/">${province}</a><span aria-hidden="true">›</span><span>${town}</span></div><div class="eyebrow">ELECTRICISTA EN ${town.toUpperCase()} · ${province}</div><h1>${intentText(intent.hero,record)}</h1><p class="lead">${intentText(intent.lead,record)}</p><div class="actions"><a class="btn yellow" href="tel:${e(site.tel)}">${e(site.phone)}</a><a class="btn wa" href="https://wa.me/${e(site.whatsapp)}?text=${encodeURIComponent(`Hola, necesito consultar una avería eléctrica en ${record.town}, ${record.province}.`)}">WhatsApp</a></div><a class="local-hero-link" href="#servicios-locales">Ver servicios y averías <span aria-hidden="true">↓</span></a></div></section>
${placeSection(record)}
${madridLocalExtra(record)}
<section class="wrap section local-services-section" id="servicios-locales" aria-labelledby="servicios-title"><div class="local-section-heading"><div class="eyebrow">QUÉ PODEMOS REVISAR</div><h2 id="servicios-title">${intentText(intent.services,record)}</h2><p class="lead">Averías y reparaciones eléctricas habituales en ${town}. Abre cada servicio para ver qué se comprueba, qué puede repararse y qué información ayuda antes de solicitar asistencia.</p></div><div class="local-services-grid">${serviceGuide(record)}</div></section>
<section class="soft" id="atencion-local"><div class="wrap section"><div class="local-section-heading"><div class="eyebrow">DEL AVISO A LA REPARACIÓN</div><h2>Cómo se organiza la asistencia en ${town}</h2><p>Para preparar un aviso en ${town} no necesitas identificar la avería por tu cuenta. Estos datos ayudan a valorar el servicio sin exponerte a una instalación dañada.</p></div><div class="local-process"><article><span>01</span><h3>Localidad y acceso</h3><p>Indica ${town} y el tipo de inmueble. La dirección y las indicaciones de acceso se facilitan al concertar la visita, no en una reseña pública.</p></article><article><span>02</span><h3>Alcance del fallo</h3><p>Explica si falta luz en toda la vivienda, en una zona o en un equipo. Añade cuándo empezó y si coincide con lluvia o con el uso de algún aparato.</p></article><article><span>03</span><h3>Diagnóstico y condiciones</h3><p>Consulta disponibilidad, desplazamiento, diagnóstico y posibles suplementos antes de aceptar el aviso. La reparación se acuerda según el problema localizado.</p></article><article><span>04</span><h3>Trabajo y comprobación</h3><p>El alcance debe aclarar qué se repara o sustituye y qué comprobaciones se realizan al terminar. No todos los avisos requieren renovar el cuadro completo.</p></article></div><aside class="local-safety"><strong>Sin manipulaciones para pedir ayuda.</strong> No retires tapas, no anules protecciones y no toques elementos mojados o deteriorados. Con humo, fuego, una descarga o peligro inmediato, aléjate y solicita asistencia de emergencia; un aviso comercial no la sustituye.</aside></div></section>
<section class="wrap section local-faq" id="preguntas-locales" aria-labelledby="faq-title"><div class="eyebrow">ANTES DE SOLICITAR LA VISITA</div><h2 id="faq-title">Preguntas sobre el servicio en ${town}</h2>${questions}</section>
${localForm(record)}
<section class="wrap section local-directory"><div class="eyebrow">DIRECTORIO DE ${province}</div><h2>Otros municipios del directorio</h2><p>Consulta otras localidades publicadas de ${province}. Elige siempre el municipio de la dirección real; la disponibilidad y el desplazamiento se confirman para cada aviso.</p><div class="local-other-towns">${others.map(t => `<a href="${e(t.route)}">Electricista en ${e(t.town)} ${arrow}</a>`).join('')}</div><a class="local-guide-link" href="/zonas/${record.provinceSlug}/">Ver localidades de ${province} de la A a la Z ${arrow}</a><details class="local-references"><summary>Información técnica y alcance de esta página</summary><p>Las explicaciones de averías son orientativas y comunes al servicio. No describen trabajos realizados en ${town} ni sustituyen una inspección de la instalación.</p><ul>${[["IGN: referencia municipal utilizada",getLocalContext(record).source],...technicalSources].map(([name,url]) => `<li><a href="${e(url)}">${e(name)}</a></li>`).join('')}</ul></details></section></main>`;
}

export function linkHomeTowns(html, records) {
  let linked = 0;
  html = html.replace(/<article class="town-group">([\s\S]*?)<\/article>/g, (whole, body) => {
    const slug = body.match(/href="\/zonas\/([^/]+)\/"/)?.[1];
    if (!slug) throw new Error('Home province link missing');
    const provinceRecords=records.filter(r=>r.provinceSlug===slug).sort((a,b)=>a.town.localeCompare(b.town,'es'));
    if(!provinceRecords.length) throw new Error(`No municipal records for ${slug}`);
    const links=provinceRecords.map(record=>{
      linked++;
      return `<a class="town-chip" href="${escape(record.route)}" aria-label="Electricista en ${escape(record.town)}">Electricista en ${escape(record.town)}</a>`;
    });
    const visible=links.slice(0,6).join('');
    const hidden=links.slice(6).join('');
    body=body.replace(/<div class="town-chips(?: [^"]*)?">[\s\S]*?<\/div>(?:<details class="town-more">[\s\S]*?<\/details>)?/, `<div class="town-chips town-chips-featured">${visible}</div>${hidden?`<details class="town-more"><summary>Ver más localidades</summary><div class="town-chips town-chips-more">${hidden}</div></details>`:''}`);
    return `<article class="town-group">${body}</article>`;
  });
  html = html.replace('Mostramos más localidades de Vizcaya, Álava, Guipúzcoa, Madrid y Cantabria. Cuando publiquemos las páginas municipales, estos nombres pasarán a enlazar a contenido local específico y útil.', 'Encuentra electricista en tu localidad para averías y reparaciones domésticas. Mostramos primero los pueblos principales y puedes desplegar el resto de localidades con servicio.');
  if (linked !== records.length) throw new Error(`Home municipal links incomplete: ${linked}/${records.length}`);
  return { html, linked };
}

function homeCoverageSummary(records) {
  const groups=provinces.map(province => {
    const towns=records.filter(r=>r.provinceSlug===province.slug).sort((a,b)=>a.town.localeCompare(b.town,'es'));
    const townLabel=t=>{if(province.slug!=='madrid') return escape(t.town);const g=getLocalContext(t),cp=madridPostalCodesByIne[g.code]||[];return `${escape(t.town)}${cp.length?` (CP ${escape(cp.join(', '))})`:''}`};
    return `<details class="coverage-summary-group"><summary>Electricista en ${escape(province.name)} · ${towns.length} localidades</summary><p>${towns.map(t=>townLabel(t)).join(' · ')}</p><a href="/zonas/${province.slug}/">Ver todos los pueblos de ${escape(province.name)} de la A a la Z ${arrow}</a></details>`;
  }).join('');
  return `<section class="coverage-summary"><div class="wrap section"><div class="eyebrow">ZONAS DONDE PRESTAMOS SERVICIO</div><h2>Resumen de pueblos y localidades</h2><p class="lead">Servicio de electricista para averías y arreglos puntuales en localidades de Vizcaya, Álava, Guipúzcoa, Madrid y Cantabria. Consulta tu pueblo y confirma disponibilidad y desplazamiento al solicitar el aviso.</p><div class="coverage-summary-grid">${groups}</div></div></section>`;
}

function addSchema(html, record) {
  html = html.replace(/<script type="application\/ld\+json" data-local-schema="1">[\s\S]*?<\/script>/g, '');
  const crumb = [{ '@type':'ListItem', position:1, name:'Inicio', item:`${site.domain}/` }, { '@type':'ListItem', position:2, name:record.province, item:`${site.domain}/zonas/${record.provinceSlug}/` }];
  if (record.town) crumb.push({'@type':'ListItem',position:3,name:record.town,item:record.url});
  const graph = [{ '@type':'BreadcrumbList', '@id':`${record.url}#breadcrumb`, itemListElement:crumb }];
  if (record.town) graph.push({'@type':'Service','@id':`${record.url}#servicio`,'name':`Reparaciones eléctricas en ${record.town}`,'url':record.url,'provider':{'@id':`${site.domain}/#organization`},'areaServed':{'@type':'AdministrativeArea','name':`${record.town}, ${record.province}`}});
  return html.replace('</head>', `<script type="application/ld+json" data-local-schema="1">${json({'@context':'https://schema.org','@graph':graph})}</script></head>`);
}

export async function enhanceLocalPages(directory = path.join(root, 'dist')) {
  if (!/^\+\d{9,15}$/.test(site.tel) || !/^\d{9,15}$/.test(site.whatsapp)) throw new Error('Invalid contact configuration');
  const files = [];
  async function visit(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes:true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.name.endsWith('.html')) files.push(file);
    }
  }
  await visit(directory);
  const pages = await Promise.all(files.map(async file => ({ file, html:await fs.readFile(file, 'utf8') })));
  const records = pages.filter(p => /\/electricista\//.test(canonical(p.html))).map(p => townRecord(p.html));
  if (!records.length) throw new Error('No municipal pages to enrich');
  for (const record of records) getLocalContext(record); // New towns need reviewed geographic evidence, not just a new name.
  const css = Buffer.concat([await fs.readFile(path.join(root, 'public/local-pages.css')), Buffer.from('\n'), await fs.readFile(path.join(root, 'public/local-context.css'))]);
  const version = createHash('sha256').update(css).digest('hex').slice(0,10);
  await fs.mkdir(path.join(directory,'assets'), {recursive:true});
  await fs.writeFile(path.join(directory,'assets/local-pages.css'), css);
  for (const service of localServices) await fs.access(path.join(directory, 'servicios', service.slug, 'index.html'));
  const preview = process.env.FORCE_NOINDEX === 'true' || ['deploy-preview','branch-deploy'].includes(process.env.CONTEXT);
  let linked = 0;
  const urls = [];
  for (const p of pages) {
    let html = p.html;
    const url = canonical(html), route = new URL(url).pathname;
    if (route.startsWith('/electricista/')) {
      const record = townRecord(html);
      const sameProvince = records.filter(r => r.provinceSlug === record.provinceSlug).sort((a,b) => a.town.localeCompare(b.town,'es'));
      html = exactlyOnce(html, /<main\b[^>]*>[\s\S]*?<\/main>/, renderTown(record, sameProvince), 'municipal main');
      html = addSchema(html, record);
    } else if (route === '/') {
      const result = linkHomeTowns(html, records); html = result.html; linked = result.linked;
      html = html.replace('</main>', `${homeCoverageSummary(records)}</main>`);
    } else if (route.startsWith('/zonas/')) {
      const province = provincesBySlug.get(route.split('/')[2]);
      if (!province) throw new Error(`Unknown province: ${route}`);
      html = addSchema(html, {province:province.name, provinceSlug:province.slug, url});
    }
    html = html.replace(/<link rel="stylesheet" href="\/assets\/local-pages\.css[^>]*>/g, '');
    html = html.replace('</head>', `<link rel="stylesheet" href="/assets/local-pages.css?v=${version}"></head>`);
    if (preview) html = html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex,follow">');
    await fs.writeFile(p.file, html);
    urls.push(url);
  }
  if (new Set(urls).size !== urls.length) throw new Error('Duplicate canonical URLs');
  await fs.writeFile(path.join(directory,'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.sort().map(url => `  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`);
  await fs.writeFile(path.join(directory,'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#ffd22e"/><path d="M36 5 17 35h13l-3 24 20-34H34z" fill="#071c2d"/></svg>');
  if (preview) {
    const headerFile = path.join(directory,'_headers');
    const headers = await fs.readFile(headerFile,'utf8');
    if (!headers.includes('X-Robots-Tag:')) await fs.appendFile(headerFile,'\n/*\n  X-Robots-Tag: noindex, follow\n');
  }
  const report = {pages:pages.length,towns:records.length,services:localServices.length,verifiedLocalContexts:records.length,fullServiceGuidesShared:true,homeTownLinks:linked,preview,provinces:provinces.map(p=>({name:p.name,towns:records.filter(r=>r.provinceSlug===p.slug).length}))};
  await fs.mkdir(path.join(root,'reports'),{recursive:true});
  await fs.writeFile(path.join(root,'reports/local-content.json'), JSON.stringify(report,null,2));
  console.log(`LOCAL OK: ${records.length} municipios · ${localServices.length} servicios desarrollados · ${linked} enlaces directos desde inicio`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await enhanceLocalPages();
