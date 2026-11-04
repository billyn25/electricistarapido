import fs from 'node:fs';
import path from 'node:path';
import {allMunicipalities} from '../content/all-municipalities.mjs';
import {madridPostalCodesByIne} from '../content/madrid-postal-codes.mjs';
import {provinces,site} from '../content/site.mjs';
import {inventory,e} from './seo-strengthen.mjs';
import {selectCoverage,policy,distanceKm,COVERAGE_CSS,COVERAGE_RELEASE} from './municipal-coverage.mjs';
const root='dist',origin=site.domain;
if(fs.existsSync(root+'/coverage-manifest.json'))throw new Error('Consolidación ya aplicada; reconstruye primero.');
const geoData=JSON.parse(fs.readFileSync('content/municipal-geography.json','utf8')),geo=new Map(geoData.municipalities.map(t=>[t.code,t]));
const slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const towns=allMunicipalities.map(t=>({...t,...geo.get(t.code),province:provinces.find(p=>p.slug===t.provinceSlug).name,route:`/electricista/${t.provinceSlug}/${slug(t.name)}/`}));
const {retained,assignments}=selectCoverage(towns),selected=new Set(retained.map(t=>t.route)),byRoute=new Map(assignments.map(a=>[a.town.route,a]));
const original=inventory(root),retired=assignments.filter(a=>a.town.code!==a.hub.code);
const docs=original.pages.filter(p=>p.type!=='town'||selected.has(p.route));
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
function destination(raw,current='/',anchor=true){
 let u;try{u=new URL(decode(raw),origin+current);}catch{return raw;}
 if(u.origin!==origin)return raw;
 const clean=u.pathname.endsWith('/index.html')?u.pathname.slice(0,-10):u.pathname.endsWith('/')?u.pathname:u.pathname+'/';
 const row=byRoute.get(clean);if(!row||row.town.code===row.hub.code)return raw;
 return row.hub.route+(anchor?`#cobertura-${row.town.code}`:'');
}
function metadata(html,title,description,h1){
 html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${e(title)}</title>`);
 const values={'description':description,'og:title':title,'og:description':description,'twitter:title':title,'twitter:description':description};
 for(const [key,value] of Object.entries(values)){
  const re=new RegExp('<meta (?:name|property)="'+key+'" content="[^\"]*">','g');
  if(re.test(html))html=html.replace(re,tag=>tag.replace(/content="[^"]*"/,`content="${e(value)}"`));
 }
 if(h1)html=html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/,`<h1>${e(h1)}</h1>`);
 return html;
}
function block(town){
 const members=assignments.filter(a=>a.hub.code===town.code&&a.town.code!==town.code).map(a=>a.town).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 if(!members.length)return '';
 return `<section class="municipal-coverage soft" id="cobertura-cercana"><div class="wrap section"><div class="eyebrow">TAMBIÉN EN LOS ALREDEDORES</div><h2>Electricista urgente 24 horas en ${e(town.name)} y municipios cercanos</h2><p>Esta página reúne la atención de averías eléctricas en ${e(town.name)} y estas localidades próximas. Puedes consultar apagones de vivienda, diferenciales que disparan, fallos de cuadros, enchufes y circuitos.</p><ul class="municipal-coverage-list">${members.map(t=>{const cp=madridPostalCodesByIne[t.code]||[];return `<li id="cobertura-${t.code}" data-coverage-name="${e(t.name)}"><span>${e(t.name)}</span>${cp.length?`<small>CP: ${cp.join(' · ')}</small>`:''}</li>`;}).join('')}</ul><p>Indica el municipio real de la instalación, qué se ha quedado sin corriente y desde cuándo sucede. La disponibilidad, el desplazamiento y las condiciones del aviso se confirman al contactar.</p><a class="local-guide-link" href="#consulta-local">Preparar el aviso para mi localidad →</a></div></section>`;
}
for(const doc of docs){
 let html=doc.html;
 if(doc.route==='/'||doc.type==='province')html=html.replace('</main>',`<section class="municipal-coverage soft"><div class="wrap section" data-coverage-search><h2>Busca tu municipio</h2><label for="coverage-query">Localidad o pueblo</label><input id="coverage-query" type="search" autocomplete="off" placeholder="Escribe el nombre de tu localidad"><p role="status" aria-live="polite"></p><ul data-coverage-results></ul></div></section></main>`);
 html=html.replace(/\bhref="([^"]*)"/g,(_,raw)=>`href="${e(destination(raw,doc.route))}"`);
 let title=null,description=null,localName=null;
 const town=retained.find(t=>t.route===doc.route);
 const phone=doc.route.startsWith('/electricista/madrid/')||doc.type==='district'||doc.route==='/zonas/madrid/'?'614 78 99 45':site.phone;
 if(town){
  localName=town.name;title=`Electricista urgente 24 horas en ${town.name} | ${phone}`;
  description=`Electricista urgente 24 horas en ${town.name===town.province?town.name:town.name+', '+town.province}. Apagones, diferenciales, cuadros y cortocircuitos. ${phone}. Consulta disponibilidad y desplazamiento.`;
  html=metadata(html,title,description,`Electricista urgente 24 horas en ${town.name}`);
  const content=block(town);html=html.replace(/(<section\b[^>]*\bid="consulta-local"[^>]*>)/,content+'$1');
  if(content&&!html.includes('id="cobertura-cercana"'))throw new Error('Falta cobertura de '+town.name);
  const nearby=retained.filter(t=>t.provinceSlug===town.provinceSlug&&t.code!==town.code).sort((a,b)=>distanceKm(town,a)-distanceKm(town,b)||a.code.localeCompare(b.code)).slice(0,8);
  html=html.replace(/<div class="local-other-towns">[\s\S]*?<\/div>/,`<div class="local-other-towns">${nearby.map(t=>`<a href="${t.route}">Electricista en ${e(t.name)}</a>`).join('')}</div>`);
 }else if(doc.type==='province'){
  const province=provinces.find(p=>doc.route===`/zonas/${p.slug}/`);localName=province.name;
  title=`Electricista urgente 24 horas en ${province.name}: municipios | ${phone}`;description=`Electricista urgente 24 horas en ${province.name}. Averías de vivienda, apagones, cuadros y diferenciales. Busca tu municipio y consulta disponibilidad y desplazamiento.`;
  html=metadata(html,title,description,`Electricista urgente 24 horas en ${province.name}`);
 }else if(doc.type==='district'){
  localName=doc.name;title=`Electricista urgente 24 horas en ${doc.name}, Madrid | ${phone}`;
  description=`Electricista urgente 24 horas en ${doc.name}, Madrid. Apagones, cuadros, diferenciales y averías de vivienda. ${phone}. Consulta disponibilidad para tu dirección.`;
  html=metadata(html,title,description,`Electricista urgente 24 horas en ${doc.name}, Madrid`);
 }else if(doc.route==='/'){
  title='Electricista urgente 24 horas en Madrid y zona norte | Electricista Rápido';
  description='Electricista urgente 24 horas en Madrid, Vizcaya, Álava, Guipúzcoa y Cantabria. Averías domésticas, apagones, diferenciales, cuadros y enchufes. Consulta disponibilidad.';
  html=metadata(html,title,description,null);
 }
 const rewrite=value=>typeof value==='string'?(/^(?:https?:\/\/|\/)/.test(value)?destination(value,doc.route,false):value):Array.isArray(value)?value.map(rewrite):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)])):value;
 html=html.replace(/(<script[^>]*type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g,(_,open,raw,close)=>{
  const data=rewrite(JSON.parse(raw));
  const update=value=>{if(Array.isArray(value)){value.forEach(update);return;}if(!value||typeof value!=='object')return;
   if(['WebPage','CollectionPage'].includes(value['@type'])&&title){value.name=title;value.description=description;}
   if(value['@type']==='Service'&&town){value.name=`Electricista urgente 24 horas en ${town.name}`;value.serviceType='Urgencias y reparación de averías eléctricas';value.areaServed=assignments.filter(a=>a.hub.code===town.code).map(a=>({'@type':'AdministrativeArea',name:a.town.name+', '+a.town.province}));}
   Object.values(value).forEach(update);
  };update(data);return open+JSON.stringify(data).replace(/</g,'\\u003c')+close;
 });
 html=html.replace('</body>','<script src="/assets/municipal-coverage.js" defer></script></body>');
 html=html.replace('</head>','<link rel="stylesheet" href="/assets/municipal-coverage.css"></head>');
 fs.writeFileSync(doc.file,html);
}
for(const a of retired)fs.rmSync(path.dirname(original.byRoute.get(a.town.route).file),{recursive:true});
const search=towns.map(t=>({name:t.name,province:t.province,provinceSlug:t.provinceSlug,path:t.route}));
fs.writeFileSync(root+'/assets/municipios.json',JSON.stringify(search.map(t=>({...t,originalPath:t.path,path:destination(t.path)}))));
const redirects=retired.flatMap(({town,hub})=>[town.route,town.route.slice(0,-1),town.route+'index.html'].map(from=>({from,to:hub.route})));
fs.writeFileSync(root+'/_redirects','# Municipal coverage: direct permanent destinations.\n'+redirects.map(r=>`${r.from} ${origin}${r.to} 301!`).join('\n')+'\n');
const coverage={release:COVERAGE_RELEASE,domain:origin,policy,source:geoData.source,edition:geoData.edition,total:towns.length,retained:retained.length,redirected:retired.length,urls:docs.length,routes:docs.map(d=>d.route),provinces:provinces.map(p=>({name:p.name,slug:p.slug,total:towns.filter(t=>t.provinceSlug===p.slug).length,retained:retained.filter(t=>t.provinceSlug===p.slug).length})),redirects,assignments:assignments.map(({town,hub,distanceKm})=>({code:town.code,name:town.name,province:town.province,provinceSlug:town.provinceSlug,population:town.population,original:town.route,destination:hub.route,hub:hub.name,url:hub.route+(town.code===hub.code?'':`#cobertura-${town.code}`),distanceKm:Number(distanceKm.toFixed(3))}))};
fs.writeFileSync(root+'/coverage-manifest.json',JSON.stringify(coverage,null,2));
const groups=new Map([['core',[]]]);for(const doc of docs){const p=provinces.find(p=>doc.route.startsWith(`/electricista/${p.slug}/`)||doc.route===`/zonas/${p.slug}/`||(p.slug==='madrid'&&doc.route.startsWith('/electricista-madrid/')));const key=p?.slug||'core';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(doc.route);}
fs.rmSync(root+'/sitemaps',{recursive:true,force:true});fs.mkdirSync(root+'/sitemaps');
for(const [key,routes] of groups)fs.writeFileSync(`${root}/sitemaps/sitemap-${key}.xml`,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r=>`<url><loc>${e(origin+r)}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync(root+'/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...groups.keys()].map(k=>`<sitemap><loc>${origin}/sitemaps/sitemap-${k}.xml</loc></sitemap>`).join('')}</sitemapindex>`);
fs.writeFileSync(root+'/assets/municipal-coverage.css',COVERAGE_CSS+'\n.municipal-coverage h2{font-size:clamp(1.5rem,3vw,2.4rem);margin-bottom:20px}.municipal-coverage p{margin:16px 0}.municipal-coverage li>span,.municipal-coverage li>small{display:block}.municipal-coverage li>small{font-size:.85rem;color:var(--muted)}\n');
console.log(`CONSOLIDACIÓN Y SEO OK: ${towns.length} municipios cubiertos, ${retained.length} páginas propias, ${retired.length} agrupados, ${docs.length} URLs finales.`);

fs.writeFileSync(root+'/assets/municipal-coverage.js',`(()=>{function sync(){if(!/^#cobertura-\\d{5}$/.test(location.hash))return;const row=document.getElementById(location.hash.slice(1));const input=document.querySelector('[data-whatsapp-form] input[name="town"]');if(row&&input){input.value=row.dataset.coverageName;input.dispatchEvent(new Event('input',{bubbles:true}));}}sync();window.addEventListener('hashchange',sync);const box=document.querySelector('[data-coverage-search]');if(box){fetch('/assets/municipios.json').then(r=>r.json()).then(rows=>{const fold=v=>v.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();const input=box.querySelector('input'),list=box.querySelector('ul'),status=box.querySelector('[role=status]');input.addEventListener('input',()=>{list.replaceChildren();const q=fold(input.value.trim());const found=q.length<2?[]:rows.filter(r=>fold(r.name+' '+r.province).includes(q)).slice(0,30);status.textContent=q.length<2?'Escribe al menos dos letras.':found.length?'Selecciona tu localidad.':'No se ha encontrado esa localidad.';for(const r of found){const li=document.createElement('li'),a=document.createElement('a');a.href=r.path;a.textContent=r.name+', '+r.province;li.append(a);list.append(li);}});}).catch(()=>{box.querySelector('[role=status]').textContent='Consulta las localidades del listado de cobertura.';});}})();`);

fs.appendFileSync(root+'/assets/municipal-coverage.css','[data-coverage-search] input{display:block;width:100%;max-width:40rem;min-height:48px;padding:12px;font:inherit;border:1px solid #789;border-radius:6px;margin:14px 0}[data-coverage-results] a{display:inline-block;padding:10px 0;text-decoration:underline}');

fs.appendFileSync(root+'/assets/municipal-coverage.css','.local-hero .wrap>*{min-width:0}.local-hero h1,.madrid-postal,.madrid-postal-source{overflow-wrap:anywhere}.local-hero img{max-width:100%}');

fs.appendFileSync(root+'/assets/municipal-coverage.css','.madrid-local-extra>*{min-width:0;max-width:100%}.madrid-local-extra{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}@media(max-width:700px){.madrid-local-extra{grid-template-columns:minmax(0,1fr)}}');
