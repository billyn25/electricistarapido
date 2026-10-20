/** Final content/navigation pass for the existing five provinces. No new URLs. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import config from '../content/seo-navigation.json' with {type:'json'};
export const VERSION='electricista-cinco-provincias-v1';
const ORIGIN='https://electricistarapido.com';
export const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>String(s).replace(/&(amp|lt|gt|quot|#39);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[k]));
const plain=s=>decode(s.replace(/<[^>]*>/g,'')).trim();
const json=s=>JSON.stringify(s).replaceAll('<','\\u003c');
const one=(h,re,label)=>{const found=[...h.matchAll(new RegExp(re.source,'g'))];assert.equal(found.length,1,label);return found[0][0];};
const mainRE=/<main\b[^>]*>[\s\S]*?<\/main>/;
const getMain=h=>one(h,mainRE,'Falta main único');
const routeOf=h=>new URL(decode(h.match(/<link rel="canonical" href="([^"]+)"/)?.[1]||'')).pathname;
const allFiles=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(v=>v.isDirectory()?allFiles(path.join(dir,v.name)):[path.join(dir,v.name)]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const typeOf=route=>route==='/'?'home':/^\/electricista\//.test(route)?'town':/^\/electricista-madrid\//.test(route)?'district':/^\/zonas\//.test(route)?'province':/^\/servicios\//.test(route)?'service':'other';
const serviceLink=s=>`<a class="er-guide-link" href="/servicios/${s.slug}/">${e(s.label)} <span aria-hidden="true">→</span></a>`;
export const CSS=`/* SEO navigation uses the current Electricista Rápido palette; scope only new blocks. */
body[data-er-seo] main.wrap.section>section.grid .card h2{font-size:22px;line-height:1.3;margin:0 0 14px}.er-seo{margin-top:28px;margin-bottom:28px;scroll-margin-top:110px}.er-seo h2{font-size:clamp(23px,3vw,31px);line-height:1.2;margin:0 0 14px}.er-seo h3{font-size:18px;line-height:1.35;margin:0 0 10px}.er-seo p{line-height:1.65}.er-seo .er-intro{max-width:850px}.er-seo .er-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.er-seo .er-card{min-width:0;border:1px solid #d7dce2;border-top:3px solid #f4cb36;padding:20px;border-radius:12px;background:#fff;color:#172533;overflow-wrap:anywhere}.er-seo .er-card p{margin:10px 0}.er-seo .er-card h3{color:#172533}.er-seo .er-card>a{display:block;font-weight:700;min-height:44px;padding:10px 0;color:#123b60}.er-seo .er-card small{display:block;color:#465768}.er-seo .er-links{display:flex;flex-wrap:wrap;gap:10px}.er-seo .er-links a{display:inline-flex;align-items:center;min-height:44px;padding:10px 14px;border:1px solid #d7dce2;border-radius:8px;background:#fff;color:#123b60;font-weight:650;overflow-wrap:anywhere;max-width:100%;line-height:1.4;box-sizing:border-box}.er-seo .er-note{background:#f4f7fa;border-left:3px solid #f4cb36;padding:16px 18px;margin-top:18px}.er-seo a:focus-visible,.local-guide-link:focus-visible{outline:3px solid #b88400;outline-offset:3px}.local-service>.local-guide-link{display:block;line-height:1.5;padding:12px 0;margin-top:8px}.er-seo .er-city-label{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#465768}.er-seo .er-region-links{margin-top:10px}.er-seo .er-region-links a{display:block;min-height:36px;padding:6px 0}.er-seo .er-emergency{font-weight:600}.er-seo .er-subtitle{font-size:18px!important}.er-seo+.local-services-section{padding-top:28px}
@media(max-width:850px){.er-seo .er-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.er-seo .er-grid{grid-template-columns:minmax(0,1fr)}.er-seo .er-card{padding:18px}.er-seo .er-links a{flex:1 1 180px}.er-seo{margin-top:24px;margin-bottom:24px}}
.er-seo > .er-intro + .er-intro{margin-top:16px}
.er-seo > p + nav.er-links,.er-seo > p + .er-grid,.er-seo > p + .er-links{margin-top:22px}
.er-seo > nav.er-links + p{margin-top:24px;padding-top:18px;border-top:1px solid var(--line,#dce7ee)}
#guias-del-distrito > nav.er-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#guias-del-distrito .er-guide-link{justify-content:space-between;gap:16px;padding:14px 18px;line-height:1.5}
#guias-del-distrito > p:last-child{display:flex;flex-wrap:wrap;gap:12px 24px}
#guias-del-distrito > p:last-child a{display:inline-flex;align-items:center;min-height:44px;color:#123b60;font-weight:650}
@media(max-width:650px){#guias-del-distrito > nav.er-links{grid-template-columns:minmax(0,1fr)}#guias-del-distrito > p:last-child{display:grid;gap:8px}}
/* Content navigation must not inherit the masthead's fixed nav height. */
.er-seo .er-links{width:100%;max-width:100%;height:auto;min-height:0;margin:0;padding:0;position:static;align-items:stretch;align-content:start;justify-content:flex-start;box-sizing:border-box}
.er-seo .er-links a{gap:8px;min-width:0;white-space:normal}
.er-seo .er-links a>span[aria-hidden]{flex-shrink:0}
#ciudades-destacadas>.er-intro{margin:0 0 22px}
#ciudades-destacadas>nav.er-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
#ciudades-destacadas>nav.er-links>a{width:100%;min-height:52px;margin:0;padding:12px 16px;justify-content:flex-start;flex:none}
#ciudades-destacadas>.er-subtitle{margin:28px 0 16px;padding-top:24px;border-top:1px solid var(--line,#dce7ee)}
@media(max-width:1000px){#ciudades-destacadas>nav.er-links{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:540px){#ciudades-destacadas>nav.er-links{grid-template-columns:minmax(0,1fr)}}
`;
export const CSS_PATH='/assets/seo-navigation.'+sha(CSS).slice(0,12)+'.css';
const marker=`data-er-seo="${VERSION}"`;
function section(id,title,body,extra=''){return `<section class="er-seo ${extra}" id="${id}"><h2>${e(title)}</h2>${body}</section>`;}
const wrap=block=>`<div class="wrap">${block}</div>`;
const cityURL=(p,slug)=>`/electricista/${p.slug}/${slug}/`;
export function inventory(root){
 const pages=allFiles(root).filter(f=>f.endsWith('.html')).map(file=>{const html=fs.readFileSync(file,'utf8');return {file,html,route:routeOf(html),type:typeOf(routeOf(html))};});
 const byRoute=new Map(pages.map(p=>[p.route,p]));assert.equal(byRoute.size,pages.length,'Canonical duplicado');
 for(const p of pages){if(p.type==='town')p.name=decode(p.html.match(/name="locality" content="([^"]+)"/)?.[1]||'');if(p.type==='district')p.name=plain(p.html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'').replace(/^Electricista 24 horas en /,'').replace(/, Madrid$/,'');}
 for(const p of config.provinces){assert(byRoute.has('/zonas/'+p.slug+'/'),'Falta provincia '+p.slug);for(const slug of p.featured)assert(byRoute.get(cityURL(p,slug))?.name,'Ciudad fuera del inventario '+slug);}
 for(const s of config.services){assert(byRoute.has('/servicios/'+s.slug+'/'),'Falta servicio '+s.slug);for(const slug of s.related)assert(config.services.some(x=>x.slug===slug),'Servicio relacionado inválido');}
 return {pages,byRoute};
}
function provinceLinks(p,byRoute){return `<nav class="er-links" aria-label="Ciudades y localidades de ${e(p.name)}">${p.featured.map(slug=>{const route=cityURL(p,slug);return `<a href="${route}">Electricista en ${e(byRoute.get(route).name)}</a>`;}).join('')}</nav>`;}
function capitals(byRoute,serviceMode=false){return `<div class="er-grid">${config.provinces.map(p=>{const route=cityURL(p,p.capital),name=byRoute.get(route).name;return `<article class="er-card"><small class="er-city-label">${e(p.name)}</small><h3><a href="${route}">Electricista en ${e(name)}</a></h3><p>${serviceMode?'Consulta la atención para tu localidad y el contacto de la zona.':'Averías domésticas, cuadros, enchufes y urgencias. Consulta disponibilidad para tu dirección.'}</p><a href="/zonas/${p.slug}/">Ver ciudades y pueblos de ${e(p.name)} →</a></article>`;}).join('')}</div>`;}
function metadata(html,title,description,h1=null){
 html=html.replace(/<title>[\s\S]*?<\/title>/,()=>`<title>${e(title)}</title>`);
 for(const [key,val] of [['description',description],['og:title',title],['og:description',description],['twitter:title',title],['twitter:description',description]]){
  const re=new RegExp('<meta (?:name|property)="'+key+'" content="[^\"]*">','g');
  html=html.replace(re,old=>old.replace(/content="[^"]*"/,()=>`content="${e(val)}"`));
 }
 if(h1)html=html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/,()=>`<h1>${e(h1)}</h1>`);
 return html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(_,open,payload,close)=>{
  const data=JSON.parse(payload);const visit=v=>{if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object'){if(v['@type']==='WebPage'){v.name=title;v.description=description;}Object.values(v).forEach(visit);}};visit(data);return open+json(data)+close;
 });
}
function phoneIn(html){return plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'').match(/(?:641 58 93 94|614 78 99 45)/)?.[0]||'641 58 93 94';}
function sourcePanel(){return '<section class="er-seo" id="seguridad-del-aviso"><h2>Seguridad antes de pedir ayuda</h2><p class="er-note">Con humo, fuego, una descarga o peligro inmediato, aléjate y solicita asistencia de emergencia. No retires tapas, no anules protecciones y no manipules elementos mojados. <a href="https://www.edistribucion.com/es/averias.html" rel="noopener noreferrer" target="_blank">Información sobre cortes y averías de e-distribución</a>. Para incidencias de red, consulta la distribuidora que figure en tu factura; este servicio es independiente de ella.</p></section>';}
const cityCopy={
 bilbao:['Electricista en Bilbao para averías en la vivienda','Al comunicar una avería en Bilbao, diferencia entre falta de luz en toda la vivienda, cortes en un circuito y un punto concreto que no funciona. No es necesario abrir el cuadro para preparar la consulta.','Si también hay problemas en zonas comunes, indica quién puede facilitar el acceso y qué parte del edificio está afectada. La visita permite distinguir la instalación particular de un fallo que deba trasladarse a otro responsable.'],
 'vitoria-gasteiz':['Reparaciones eléctricas en Vitoria-Gasteiz: preparar el aviso','Describe si el problema está en el cuadro, en los enchufes, en el alumbrado o si todavía no sabes de dónde procede. Indica la zona de Vitoria-Gasteiz y el tipo de inmueble para valorar el desplazamiento.','Cuando el síntoma aparece solo de vez en cuando, anota el momento y el uso con el que coincide, sin intentar provocar el fallo. Un corte intermitente no se resuelve necesariamente cambiando la protección.'],
 'donostia-san-sebastian':['Electricista en Donostia / San Sebastián: de la consulta a la revisión','Consulta la reparación de averías eléctricas domésticas en Donostia / San Sebastián. Explica qué parte de la instalación falla y si el suministro se recupera solo o sigue cortado. Indica también si hay tomas o luces que continúan funcionando.','Si observas agua o humedad, comunícalo sin acercarte al elemento afectado. Esa información ayuda a preparar la revisión; no permite atribuir la causa al clima ni diagnosticar una derivación sin comprobaciones.'],
 santander:['Revisión de averías eléctricas en Santander','Para un aviso en Santander, indica cuándo comenzó el problema y si el apagón afecta a la vivienda completa, a varias tomas o al alumbrado. La coincidencia con otros afectados orienta la consulta, pero no determina por sí sola el origen.','Ante un corte de red, el contacto es la distribuidora indicada en la factura. Para un defecto en la instalación particular, consulta disponibilidad y condiciones de diagnóstico antes de confirmar una visita.'],
 madrid:['Electricista en Madrid capital: vivienda, distrito y alcance de la avería','Esta página corresponde a Madrid capital. El directorio de la Comunidad de Madrid reúne los demás municipios, mientras que los 21 distritos organizan las consultas dentro de la ciudad.','Indica distrito, tipo de inmueble y si el fallo afecta a toda la vivienda o solo a un circuito. El aviso se prepara con el contacto de Madrid; disponibilidad, desplazamiento y condiciones se confirman antes de aceptar la asistencia.']
};
function cityBlock(p,record){
 const [title,a,b]=cityCopy[p.capital];
 return wrap(section('reparacion-en-la-ciudad',title,`<p class="er-intro">${e(a)}</p><p class="er-intro">${e(b)}</p><div class="er-links"><a href="#consulta-local">Preparar aviso en ${e(record.name)}</a><a href="/zonas/${p.slug}/">Ciudades y pueblos de ${e(p.name)}</a></div><aside class="er-note"><h3>Antes de confirmar la visita</h3><p>Pregunta por desplazamiento, diagnóstico, materiales, mano de obra, posibles suplementos e impuestos. El precio y el alcance se acuerdan según lo que necesite la instalación; confirma las condiciones antes de aceptar el trabajo.</p></aside>`));
}
export function transform(html,record,byRoute){
 if(record.type==='other')return html;
 if(html.includes(marker))return html;
 const before=html,phone=phoneIn(html);let main=getMain(html);
 if(record.type==='town'){
  const parts=record.route.split('/'),p=config.provinces.find(x=>x.slug===parts[2]);assert(p,'Provincia no prevista');
  // A visible link outside details helps the visitor reach the complete guide.
  let links=0;
  main=main.replace(/(<details class="local-service-detail">)([\s\S]*?)(<\/details>)/g,(_,open,body,close)=>{
   const link=one(body,/<a class="local-guide-link"[^>]*>[\s\S]*?<\/a>/,'Guía del servicio ausente');links++;return open+body.replace(link,'')+close+link;
  });assert.equal(links,9,record.route+': servicios incompletos');
  const nav=wrap(section('guia-de-averias','Encuentra la información de tu avería',`<nav class="er-links" aria-label="Consulta por síntoma">${config.services.slice(0,4).map(s=>`<a href="#servicio-${s.slug}">${e(s.label)}</a>`).join('')}<a href="#consulta-local">Preparar consulta</a></nav>`));
  main=main.replace(/<section class="wrap section local-services-section"/,nav+'<section class="wrap section local-services-section"');
  if(parts[3]===p.capital)main=main.replace(/<section class="wrap local-place-section"/,cityBlock(p,record)+'<section class="wrap local-place-section"');
  html=html.replace(getMain(html),()=>main);
  if(p.featured.includes(parts[3])){
   const label=record.name,title=`Electricista en ${label} | Averías 24h · ${phone}`;
   html=metadata(html,title,`Electricista en ${label}, ${p.name}. Reparación de apagones, diferenciales, cuadros y enchufes. Consulta disponibilidad y presupuesto: ${phone}.`,`Electricista en ${label}: urgencias y reparaciones`);
  }
 }else if(record.type==='province'){
  const p=config.provinces.find(x=>record.route==='/zonas/'+x.slug+'/');assert(p,'Provincia desconocida');
  main=main.replace('<section class="towns-featured">',wrap(section('ciudades-destacadas','Electricista en ciudades y pueblos de '+p.name,`<p class="er-intro">Abre tu localidad para consultar el servicio y utilizar el teléfono de su zona. También puedes buscar tu municipio por su inicial en el directorio inferior.</p>${provinceLinks(p,byRoute)}<h3 class="er-subtitle">Guías para describir la avería</h3><nav class="er-links" aria-label="Averías eléctricas">${config.services.slice(0,4).map(serviceLink).join('')}</nav>`))+'<section class="towns-featured">');
  html=html.replace(getMain(html),()=>main);
  html=metadata(html,`Electricistas en ${p.name}: ciudades y pueblos | ${phone}`,`Servicio de electricista en ${p.name}. Elige tu ciudad o pueblo para consultar apagones, diferenciales, cuadros y reparaciones. ${phone}.`,`Electricistas en ${p.name}: ciudades y pueblos`);
 }else if(record.type==='home'){
  const cityNav=wrap(section('electricista-en-tu-ciudad','¿Dónde necesitas un electricista?',`<p class="er-intro">Elige tu provincia o consulta la capital. La disponibilidad y el desplazamiento se confirman para tu localidad.</p><div class="home-coverage-grid">${config.provinces.map(p=>`<article class="home-coverage-card"><h3><a href="/zonas/${p.slug}/">${e(p.name)}</a></h3><a href="${cityURL(p,p.capital)}">Electricista en ${e(byRoute.get(cityURL(p,p.capital)).name)}</a><a href="/zonas/${p.slug}/">Ver todos los pueblos <span aria-hidden="true">→</span></a></article>`).join('')}</div>`));
  assert(main.includes('<section class="wrap section demand-section"'),'Sección de servicios no reconocida');const pos=main.indexOf('<section class="wa-form-section"');assert(pos>=0,'Formulario de portada no reconocido');main=main.slice(0,pos)+cityNav+main.slice(pos);html=html.replace(getMain(html),()=>main);
 }else if(record.type==='district'){
  const nav=wrap(section('guias-del-distrito',`Averías eléctricas en ${record.name}: guías de consulta`,`<p class="er-intro">Estas guías explican los síntomas y la información que ayuda al técnico. No requieren abrir el cuadro ni manipular la instalación.</p><nav class="er-links" aria-label="Guías de averías para el distrito">${config.services.slice(0,6).map(serviceLink).join('')}</nav><p><a href="/electricista/madrid/madrid/">Electricista en Madrid capital</a> <a href="/zonas/madrid/">Municipios de la Comunidad de Madrid</a></p>`));
  main=main.replace('</main>',nav+'</main>');html=html.replace(getMain(html),()=>main);
 }else if(record.type==='service'){
  const s=config.services.find(s=>record.route==='/servicios/'+s.slug+'/');assert(s,'Servicio no previsto');
  // Content cards are independent topics under h1, so use h2 rather than h3.
  const grid=one(main,/<section class="grid">[\s\S]*?<\/section>/,'Grid de servicio');
  main=main.replace(grid,()=>grid.replace(/<h3>/g,'<h2>').replace(/<\/h3>/g,'</h2>'));
  const extra=section('preparar-el-servicio',s.question,`<div class="er-grid"><article class="er-card"><h3>Qué comunicar</h3><p>${e(s.preparation)}</p></article><article class="er-card"><h3>Qué debe aclarar el presupuesto</h3><p>${e(s.scope)}</p></article><article class="er-card"><h3>Confirmación del aviso</h3><p>Pregunta por disponibilidad, desplazamiento, diagnóstico, materiales, mano de obra, impuestos y suplementos. La consulta no reserva una visita ni garantiza un tiempo de llegada.</p></article></div>`);
  const related=section('averias-relacionadas','Otras averías que pueden ayudarte a describir el problema',`<nav class="er-links" aria-label="Guías relacionadas">${s.related.map(slug=>serviceLink(config.services.find(x=>x.slug===slug))).join('')}</nav>`);
  const cities=section('servicio-en-tu-ciudad','Consulta el servicio en tu ciudad',`<p class="er-intro">Elige tu localidad para preparar el aviso con el contacto correspondiente. Madrid utiliza un teléfono distinto del de la zona norte.</p>${capitals(byRoute,true)}`);
  main=main.replace('</main>',extra+related+cities+sourcePanel()+'</main>');
  html=html.replace(getMain(html),()=>main);
  const graph={'@context':'https://schema.org','@graph':[{'@type':'BreadcrumbList','@id':ORIGIN+record.route+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:'Inicio',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:s.label,item:ORIGIN+record.route}]},{'@type':'Service','@id':ORIGIN+record.route+'#service',name:s.label,url:ORIGIN+record.route,provider:{'@id':ORIGIN+'/#organization'},areaServed:config.provinces.map(p=>({'@type':'AdministrativeArea',name:p.name}))}]};
  html=html.replace('</head>',()=>`<script type="application/ld+json">${json(graph)}</script></head>`);
 }
 html=html.replace('<body',`<body ${marker}`).replace('</head>',()=>`<link rel="stylesheet" href="${CSS_PATH}"></head>`);
 // Protected rendering and crawl resources must not change during this pass.
 for(const re of [/<link rel="canonical"[^>]*>/g,/<meta name="robots"[^>]*>/g,/<img\b[^>]*>/g,/<header\b[^>]*>[\s\S]*?<\/header>/g,/<footer\b[^>]*>[\s\S]*?<\/footer>/g,/<script src=[^>]*>[\s\S]*?<\/script>/g,/<form\b[\s\S]*?<\/form>/g,/<div class="mobile-bar[\s\S]*?<\/div>/g])assert.deepEqual([...html.matchAll(re)].map(m=>m[0]),[...before.matchAll(re)].map(m=>m[0]),record.route+': cambio fuera de alcance');
 return html;
}
export function audit(root='dist'){
 const {pages,byRoute}=inventory(root),stats={version:VERSION,checkedAt:new Date().toISOString(),ok:false,pages:pages.length,changed:0,towns:0,districts:0,provinces:0,services:0,visibleGuideLinks:0,priorityCities:35};
 const sitemapUrls=[];for(const f of allFiles(root).filter(f=>/\.xml$/.test(f))){const t=fs.readFileSync(f,'utf8');if(t.includes('<urlset'))sitemapUrls.push(...[...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1])));}
 assert.equal(sitemapUrls.length,pages.length);assert.equal(new Set(sitemapUrls).size,pages.length);
 const titles=new Map();
 for(const p of pages){
  assert(sitemapUrls.includes(ORIGIN+p.route),'Página fuera del sitemap '+p.route);
  if(p.type!=='other'){assert(p.html.includes(marker),p.route+': sin refuerzo');assert(p.html.includes(CSS_PATH));stats.changed++;}
  const title=plain(p.html.match(/<title>([\s\S]*?)<\/title>/)?.[1]||'');assert(!titles.has(title),'Título duplicado '+p.route+' '+titles.get(title));titles.set(title,p.route);
  assert.equal((p.html.match(/<h1\b/g)||[]).length,1,p.route+': h1');
  for(const m of p.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
  for(const [,href] of p.html.matchAll(/href="([^"<>]+)"/g)){
   if(!href.startsWith('/')&&!href.startsWith('#'))continue;const url=new URL(decode(href),ORIGIN+p.route),target=byRoute.get(url.pathname);
   if(!target){assert(fs.existsSync(path.join(root,decodeURIComponent(url.pathname))),'Enlace roto '+p.route+' '+href);continue;}
   if(url.hash)assert(target.html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),'Ancla rota '+p.route+' '+href);
  }
  if(p.type==='town'){stats.towns++;const main=getMain(p.html);const details=[...main.matchAll(/<details class="local-service-detail">([\s\S]*?)<\/details>/g)];assert.equal(details.length,9);assert(details.every(m=>!m[1].includes('class="local-guide-link"')));const cards=[...main.matchAll(/<article class="local-service"[\s\S]*?<\/article>/g)];assert.equal(cards.length,9);for(const card of cards)assert.equal((card[0].match(/class="local-guide-link"/g)||[]).length,1);stats.visibleGuideLinks+=9;}
  if(p.type==='district'){stats.districts++;assert(p.html.includes('id="guias-del-distrito"'));}
  if(p.type==='province'){stats.provinces++;assert(p.html.includes('id="ciudades-destacadas"'));}
  if(p.type==='service'){stats.services++;for(const id of ['preparar-el-servicio','averias-relacionadas','servicio-en-tu-ciudad'])assert(p.html.includes(`id="${id}"`));}
 }
 assert.equal(stats.towns,533);assert.equal(stats.districts,21);assert.equal(stats.provinces,5);assert.equal(stats.services,10);assert.equal(stats.pages,573);
 stats.sitemapUrls=sitemapUrls.length;stats.duplicateTitles=0;stats.ok=true;return stats;
}
export function build(root='dist'){
 const {pages,byRoute}=inventory(root),unchanged=new Map(allFiles(root).filter(f=>!f.endsWith('.html')).map(f=>[f,sha(fs.readFileSync(f))]));
 const pending=pages.map(p=>({...p,after:transform(p.html,p,byRoute)}));
 for(const p of pending)if(p.after!==p.html)fs.writeFileSync(p.file,p.after);
 fs.writeFileSync(root+CSS_PATH,CSS);
 for(const [file,digest] of unchanged)assert.equal(sha(fs.readFileSync(file)),digest,'Cambió un archivo de recursos/rastreo '+file);
 const report=audit(root);report.unchangedAssetsAndCrawlFiles=unchanged.size;
 fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/seo-five-provinces-build.json',JSON.stringify(report,null,2));console.log('SEO CINCO PROVINCIAS OK:',JSON.stringify(report));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){if(process.argv.includes('--audit'))console.log(JSON.stringify(audit(),null,2));else build();}

