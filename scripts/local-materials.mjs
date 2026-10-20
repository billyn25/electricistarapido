/** Stable local manufacturer examples; no fictitious installations or official affiliation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain = value => String(value).replace(/<[^>]*>/g, '').replace(/&(amp|quot|#39|lt|gt);/g, (_, key) => ({amp:'&',quot:'"','#39':"'",lt:'<',gt:'>'}[key])).trim();
const hash = value => createHash('sha256').update(value).digest('hex');
const pick = (seed, length) => parseInt(hash(seed).slice(0, 8), 16) % length;
const start = '<!-- local-materials:start -->', end = '<!-- local-materials:end -->';
const row = (topic, title, summary, detail) => ({topic, title, summary, detail});
export const manufacturers = [
 {id:'chint', name:'CHINT', scenario:'cuadro-chint', source:'https://www.chint.eu/es/', examples:[
  row('panel','Renovación de cuadro con material CHINT','Al cambiar un cuadro, se estudian sus circuitos y el espacio disponible antes de elegir automáticos y diferenciales.','La referencia, los polos y las características de cada protección deben corresponder al circuito. Conservar la marca no sustituye esa comprobación.'),
  row('charging','CHINT y el cuadro para recarga del coche','La familia EVPROT reúne cuadros de protección para recarga. Su elección depende del cargador y del esquema de alimentación.','También se revisan la línea de alimentación, el recorrido y las protecciones exigidas por el equipo; no se instala un conjunto sin comprobar su adecuación.'),
  row('circuit','Un automático CHINT baja repetidamente','Se identifica qué línea pierde servicio y qué carga estaba conectada, sin dar por averiada la protección por el mero disparo.','Antes de sustituirla se diferencia un problema del circuito, de una conexión o del receptor. No se aumenta el calibre para evitar que salte.')
 ]},
 {id:'schneider-electric', name:'Schneider Electric', scenario:'cuadro-schneider-acti9', source:'https://www.se.com/es/es/product/A9F74113/', examples:[
  row('panel','Cuadro completo y protecciones Acti9','Acti9 incluye protecciones modulares. En una renovación se planifican circuitos, reserva de espacio y etiquetado, además de los componentes.','Si hay una ampliación anterior, se comprueba cómo quedó conectada. El cuadro nuevo debe responder a la instalación real, no solo tener más módulos.'),
  row('circuit','Revisar un magnetotérmico Schneider','Una línea que deja de funcionar requiere revisar su alimentación, conexiones y protección, identificando la referencia instalada.','La posición de la palanca no demuestra por sí sola que exista tensión. La comprobación corresponde al profesional, sin abrir el cuadro para preparar el aviso.'),
  row('rewire','Línea nueva y protección Schneider','Para añadir un circuito se estudian el cableado, la canalización y la protección adecuada; incorporar otro automático no basta.','Indica qué equipo o estancia necesita alimentación. La sección y la protección se determinan según el recorrido, la instalación y la carga prevista.')
 ]},
 {id:'maxge', name:'MAXGE', scenario:'cuadro-maxge', source:'https://www.maxge.eu/', examples:[
  row('panel','Ampliar un cuadro con componentes MAXGE','Si faltan módulos, se valora ampliar la envolvente o renovar el conjunto sin amontonar conexiones ni ocupar espacios inadecuados.','Se comprueban la referencia de las protecciones, su montaje y la compatibilidad de los accesorios. No basta con que dos aparatos tengan el mismo ancho.'),
  row('charging','Protección y gestión de la recarga','MAXGE ofrece soluciones de protección y movilidad eléctrica. El circuito de recarga se estudia junto con los consumos de la vivienda.','Cuando el corte coincide con cocinar y cargar el coche, se identifica qué protección actúa y si procede valorar la gestión de potencia.'),
  row('rcd','Disparos en un cuadro equipado con MAXGE','Un diferencial que salta puede estar detectando un defecto. La revisión busca el origen antes de decidir si necesita sustitución.','Anota cuándo sucede y qué equipos estaban en uso, sin provocar nuevos disparos. Se revisan circuito, aislamiento y características de la protección.')
 ]},
 {id:'legrand', name:'Legrand', scenario:'cuadro-legrand-dx3', source:'https://www.legrand.es/es/productos/magnetotermico-dx3-600010ka-2p-230400v-63a-curva-407806', examples:[
  row('panel','Renovar y organizar un cuadro Legrand','La gama DX³ incluye protecciones modulares. Una renovación también contempla el orden, la identificación de circuitos y el estado de sus conexiones.','La revisión separa los componentes que deben cambiarse de los que pueden conservarse. No se presupone que todo el cuadro esté mal por su antigüedad.'),
  row('rcd','Identificar la protección Legrand que dispara','Diferencial y magnetotérmico no realizan la misma función. Se comprueba qué dispositivo actúa antes de proponer otra referencia.','La marca o el aspecto exterior no bastan para escoger el recambio; importan las características y el origen del fallo.'),
  row('circuit','Cuadro Legrand y alimentación del horno','Si el horno pierde corriente o su conexión se recalienta, se revisan la línea, la toma cuando exista y las protecciones del circuito.','La reparación eléctrica se distingue de una avería interna del electrodoméstico. No sigas utilizando una conexión con olor a quemado o deterioro visible.')
 ]},
 {id:'revalco', name:'Revalco', scenario:'cuadro-revalco', source:'https://www.revalco.es/producto/interruptores-diferenciales-clase-a-residencia-2-polos/', examples:[
  row('rcd','Diferenciales Revalco de la serie RV31','Revalco incluye diferenciales RV31 de distintas clases. Se identifica el tipo instalado y su adecuación al circuito antes de cambiarlo.','Un disparo no demuestra que el diferencial esté defectuoso. Hay que comprobar la instalación y los receptores, además de la protección.'),
  row('panel','Reorganizar un cuadro con material Revalco','En cuadros con elementos Revalco se comprueba la función de cada componente: protección, mando o medida, según su referencia.','La propuesta puede limitarse a reparar una conexión o requerir reorganizar circuitos. Se acuerda el alcance antes de sustituir piezas.'),
  row('surge','Revalco y la protección frente a sobretensiones','El catálogo de Revalco incluye protecciones contra sobretensiones. Conviene revisar qué protección existe y qué necesita el suministro.','La selección se valora junto con el resto del cuadro y las características de alimentación; no todos los protectores cumplen la misma función.')
 ]}
];
export const photographs = [
 {id:'9679179', alt:'Electricista trabajando sobre las protecciones de un cuadro', source:'https://www.pexels.com/photo/9679179/'},
 {id:'11679114', alt:'Comprobación de una instalación eléctrica con equipo de medida', source:'https://www.pexels.com/photo/11679114/'},
 {id:'38171184', alt:'Detalle de las protecciones de un cuadro eléctrico', source:'https://www.pexels.com/photo/38171184/'}
].map(photo => ({...photo, url:`https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=720`}));

export const CSS = `
/* A content nav must not inherit the header nav's fixed height or distribution. */
.site-footer.er-footer-v2 .er-foot-top,.site-footer.er-footer-v2 .footer-grid{min-width:0}
.site-footer.er-footer-v2 .er-foot-top>*,.site-footer.er-footer-v2 .footer-grid>*,.site-footer.er-footer-v2 .er-map{min-width:0;max-width:100%;box-sizing:border-box}
.site-footer.er-footer-v2 nav.er-map-links{position:static;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%;max-width:100%;height:auto;min-height:0;max-height:none;margin:16px 0 0;padding:0;gap:10px;align-items:stretch;align-content:start;justify-content:start;box-sizing:border-box}
.site-footer.er-footer-v2 nav.er-map-links>a{display:flex;align-items:center;justify-content:center;gap:5px;width:100%;max-width:100%;min-width:0;min-height:44px;height:auto;margin:0;padding:10px 8px;font-size:12px;line-height:1.4;white-space:normal;overflow-wrap:anywhere;box-sizing:border-box;text-align:center}
.site-footer.er-footer-v2 .er-map-note{font-size:12px;line-height:1.6;margin-top:10px;overflow-wrap:anywhere}
.site-footer.er-footer-v2 .footer-brand,.site-footer.er-footer-v2 .footer-bottom{overflow-wrap:anywhere;line-height:1.4}
.site-footer.er-footer-v2 .footer-bottom>span{min-width:0;max-width:100%}
.site-footer.er-footer-v2 a:focus-visible{outline:3px solid #ffd22e;outline-offset:3px}
.er-materials{padding:38px 0;background:#f4f8fb;border-bottom:1px solid #dce7ee;scroll-margin-top:110px}
.er-materials .er-materials-head{margin-bottom:20px}
.er-materials .er-materials-kicker{display:block;font-size:11px;letter-spacing:.13em;font-weight:800;color:#526b7d;text-transform:uppercase;margin-bottom:7px}
.er-materials h2{font-size:clamp(23px,2.7vw,32px);line-height:1.2;letter-spacing:-.03em;margin:0 0 9px}
.er-materials .er-materials-intro{font-size:14px;line-height:1.6;color:#526b7d;max-width:800px;margin:0}
.er-materials .er-materials-layout{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:22px;align-items:start}
.er-materials figure{margin:0;min-width:0}
.er-materials .er-materials-photo{display:block;width:100%;height:300px;object-fit:cover;border-radius:16px;background:#e1e9ef}
.er-materials figcaption{font-size:11px;line-height:1.55;color:#526b7d;padding-top:8px}
.er-materials .er-materials-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}
.er-materials .er-material-card{min-width:0;background:#fff;border:1px solid #dce7ee;border-radius:14px;padding:19px;overflow-wrap:anywhere}
.er-materials .er-material-logo{display:block;width:155px;max-width:100%;height:43px;object-fit:contain;object-position:left center;margin:0 0 17px;border-radius:0;box-shadow:none}
.er-materials .er-material-monochrome{filter:brightness(0);opacity:.82}
.er-materials h3{font-size:17px;line-height:1.3;letter-spacing:-.02em;margin:0 0 10px}
.er-materials .er-material-card p{font-size:13px;line-height:1.65;color:#455f72;margin:0}
.er-materials details{margin-top:11px;border-top:1px solid #e3eaf0;padding-top:5px}
.er-materials summary{cursor:pointer;min-height:44px;padding:12px 0;font-size:12px;font-weight:750;line-height:1.5;color:#284f69}
.er-materials details p{padding-bottom:10px}
.er-materials .er-material-guide{display:inline-flex;align-items:center;min-height:44px;font-size:12px;line-height:1.5;font-weight:800;color:#0a69b2;gap:8px;margin-top:4px}
.er-materials .er-material-note{font-size:11px;line-height:1.65;color:#63768a;margin-top:15px;max-width:950px}
.er-materials a:focus-visible,.er-materials summary:focus-visible{outline:3px solid #976d00;outline-offset:3px}
@media(max-width:850px){.er-materials .er-materials-layout{grid-template-columns:minmax(0,1fr)}.er-materials .er-materials-photo{height:230px}.er-materials figure{max-width:100%}}
@media(max-width:600px){.er-materials{padding:28px 0}.er-materials .er-materials-cards{grid-template-columns:minmax(0,1fr)}.er-materials .er-material-card{padding:17px}.er-materials .er-material-logo{height:35px;width:140px;margin-bottom:13px}.er-materials .er-materials-photo{height:190px}.er-materials .er-materials-layout{gap:16px}.site-footer.er-footer-v2 .er-map{padding:18px}.site-footer.er-footer-v2 nav.er-map-links{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.site-footer.er-footer-v2 nav.er-map-links>a:last-child{grid-column:1/-1}.site-footer.er-footer-v2 .footer-brand{font-size:19px}}
`;
export const cssPath = `/assets/local-materials.${hash(CSS).slice(0,12)}.css`;
const brandLink = brand => `/servicios/reparacion-cuadros-electricos/#caso-${brand.scenario}`;
function stripBlock(html) {
 const count = html.split(start).length - 1;
 assert(count <= 1, 'Bloque local de marcas duplicado');
 if (count) {assert(html.includes(end), 'Bloque local de marcas incompleto'); html=html.slice(0,html.indexOf(start))+html.slice(html.indexOf(end)+end.length);}
 return html;
}
export function readLogos(home) {
 const logos = new Map();
 for (const card of home.matchAll(/<a class="er-brand-card"[\s\S]*?<\/a>/g)) {
  const image = card[0].match(/<img\b[^>]*>/)?.[0] || '';
  const name = plain(image.match(/alt="([^"]+)"/)?.[1] || '');
  const brand = manufacturers.find(b => b.name === name);
  if (brand) logos.set(brand.id, {src:plain(image.match(/src="([^"]+)"/)?.[1] || ''), monochrome:image.includes('er-brand-monochrome')});
 }
 for(const b of manufacturers) assert(logos.get(b.id)?.src, `No se encuentra el logo de ${b.name} en portada`);
 return logos;
}
export function selectMaterials(route, html='') {
 html=stripBlock(html);
 const main=html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || html;
 // Do not repeat a manufacturer already featured by a fault card on this page.
 const available=manufacturers.filter(b=>!main.includes(`#caso-${b.scenario}`)&&!main.includes(`data-fault-id="${b.scenario}"`));
 assert(available.length>=2, 'No quedan dos fabricantes distintos para la selección local');
 const chosen=[...available].sort((a,b)=>hash(route+'|brand|'+a.id).localeCompare(hash(route+'|brand|'+b.id))).slice(0,2);
 const topics=new Set();
 const cards=chosen.map(brand=>{
  let index=pick(route+'|example|'+brand.id,brand.examples.length);
  for(let j=0;j<brand.examples.length&&topics.has(brand.examples[index].topic);j++)index=(index+1)%brand.examples.length;
  const example=brand.examples[index];topics.add(example.topic);return {brand,example,index};
 });
 const availablePhotos=photographs.filter(p=>!main.includes(`/photos/${p.id}/`)&&!main.includes(`local-material-${p.id}`));
 const candidates=availablePhotos.length?availablePhotos:photographs;
 const photo=candidates[pick(route+'|photo',candidates.length)];
 return {cards,photo};
}
function render(record, plan, logos, images) {
 const cards=plan.cards.map(({brand,example})=>{
  const logo=logos.get(brand.id);assert(logo?.src, 'Logo no disponible');
  return `<article class="er-material-card" data-material-brand="${brand.id}" data-material-topic="${example.topic}"><img class="er-material-logo${logo.monochrome?' er-material-monochrome':''}" src="${e(logo.src)}" alt="${e(brand.name)}" width="155" height="43" loading="lazy" decoding="async"><h3>${e(example.title)}</h3><p>${e(example.summary)}</p><details><summary>Qué conviene comprobar</summary><p>${e(example.detail)}</p></details><a class="er-material-guide" href="${brandLink(brand)}">Consultar material ${e(brand.name)} <span aria-hidden="true">→</span></a></article>`;
 }).join('');
 const photo=plan.photo;
 return `${start}<section class="er-materials" id="material-electrico-local" aria-labelledby="material-electrico-title"><div class="wrap"><div class="er-materials-head"><span class="er-materials-kicker">Material · cuadros · protecciones</span><h2 id="material-electrico-title">Marcas y material eléctrico en ${e(record.name)}</h2><p class="er-materials-intro">Ejemplos de componentes y comprobaciones para preparar tu consulta, según el estado de la instalación.</p></div><div class="er-materials-layout"><figure><img class="er-materials-photo" src="${e(images.get(photo.id)||photo.url)}" alt="${e(photo.alt)}" width="720" height="480" loading="lazy" decoding="async"><figcaption>Fotografía ilustrativa; no acredita trabajos ni marcas instaladas en esta localidad.</figcaption></figure><div class="er-materials-cards">${cards}</div></div><p class="er-material-note">Selección sujeta a diagnóstico, compatibilidad y disponibilidad. Las marcas identifican fabricantes, no un servicio técnico oficial.</p></div></section>${end}`;
}
export function transform(input, logos, images=new Map()) {
 let html=stripBlock(input);
 const canonical=html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
 assert(canonical, 'Falta canonical');
 const route=new URL(plain(canonical)).pathname;
 let plan=null;
 if (/^\/(?:electricista\/[^/]+\/[^/]+|electricista-madrid\/[^/]+)\/$/.test(route)) {
  const name=route.startsWith('/electricista/')?plain(html.match(/name="locality" content="([^"]+)"/)?.[1]||''):plain(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'').replace(/^Electricista 24 horas en /,'').replace(/, Madrid$/,'');
  assert(name, `Falta nombre de localidad: ${route}`);
  plan=selectMaterials(route,html);
  const hero=/<section class="service-hero">[\s\S]*?<\/section>/g;
  assert.equal([...html.matchAll(hero)].length,1,`Hero local no reconocido: ${route}`);
  html=html.replace(hero,match=>match+render({name,route},plan,logos,images));
 }
 // Concise caption, preserving the scope warning rather than clipping it.
 html=html.replace(/<div class="er-map-note">[\s\S]*?<\/div>/, '<div class="er-map-note">Cobertura orientativa, no sedes físicas. Confirma disponibilidad en tu localidad.</div>');
 html=html.replace(/<link rel="stylesheet" href="\/assets\/local-materials\.[a-f0-9]+\.css">/g,'');
 assert.equal(html.split('</head>').length,2,'Cabecera no reconocida');
 html=html.replace('</head>',`<link rel="stylesheet" href="${cssPath}"></head>`);
 return {html,route,plan};
}
async function photoAsset(photo, root) {
 const cache=path.resolve('.cache/local-materials',photo.id+'.jpg');
 try {
  let bytes;
  try {bytes=await fs.readFile(cache);} catch {
   const response=await fetch(photo.url,{signal:AbortSignal.timeout(12000)});assert(response.ok,`HTTP ${response.status}`);
   assert(Number(response.headers.get('content-length')||0)<2_000_000,'Foto demasiado grande');bytes=Buffer.from(await response.arrayBuffer());
  }
  assert(bytes.length>300&&bytes.length<2_000_000&&bytes.subarray(0,3).toString('hex')==='ffd8ff','JPEG no válido');
  await fs.mkdir(path.dirname(cache),{recursive:true});await fs.writeFile(cache,bytes);
  const src=`/assets/local-material-${photo.id}.${hash(bytes).slice(0,12)}.jpg`;
  await fs.writeFile(path.join(root,src),bytes);return {id:photo.id,src,storage:'local',bytes:bytes.length,source:photo.source};
 } catch(error) {
  console.warn(`LOCAL PHOTO ${photo.id}: ${error.message}; se conserva la fotografía remota.`);
  return {id:photo.id,src:photo.url,storage:'remote',source:photo.source};
 }
}
async function filesIn(dir) {
 const files=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})) {
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())files.push(...await filesIn(file));else if(entry.name.endsWith('.html'))files.push(file);
 }
 return files.sort();
}
export async function build(root='dist',{download=true}={}) {
 const files=await filesIn(root),home=await fs.readFile(path.join(root,'index.html'),'utf8'),logos=readLogos(home);
 await fs.mkdir(path.join(root,'assets'),{recursive:true});
 const assets=download?await Promise.all(photographs.map(p=>photoAsset(p,root))):photographs.map(p=>({id:p.id,src:p.url,storage:'remote'}));
 const images=new Map(assets.map(p=>[p.id,p.src]));
 const report={pages:files.length,towns:0,districts:0,newPages:0,photos:assets,brands:Object.fromEntries(manufacturers.map(b=>[b.id,0])),examples:[],combinations:0};
 const combinations=new Set();
 for(const file of files) {
  const before=await fs.readFile(file,'utf8');const result=transform(before,logos,images);
  if(result.plan){
   const {cards,photo}=result.plan;
   const signature=cards.map(c=>`${c.brand.id}:${c.index}`).join('|')+'|'+photo.id;combinations.add(signature);
   report[result.route.startsWith('/electricista/')?'towns':'districts']++;
   for(const card of cards)report.brands[card.brand.id]++;
   if(report.examples.length<15||result.route.includes('/latina/'))report.examples.push({route:result.route,brands:cards.map(c=>c.brand.name),photo:photo.id});
  }
  await fs.writeFile(file,result.html);
 }
 report.combinations=combinations.size;
 await fs.writeFile(path.join(root,cssPath),CSS);await fs.mkdir('reports',{recursive:true});
 await fs.writeFile('reports/local-materials.json',JSON.stringify(report,null,2));
 console.log(`LOCAL MATERIALS OK: ${report.towns} municipios + ${report.districts} distritos, dos marcas y una foto; footer corregido en ${report.pages} páginas.`);
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await build();
