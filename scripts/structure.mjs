/** Shared final layout for homepage and municipal pages. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
function blocks(main){
 const result=[];let depth=0,start=0;
 for(const m of main.matchAll(/<\/?section\b[^>]*>/g)){
  if(m[0].startsWith('</')){if(--depth===0)result.push(main.slice(start,m.index+m[0].length));}
  else {if(depth++===0)start=m.index;}
 }
 assert.equal(depth,0,'Secciones descompensadas'); return result;
}
export function structure(html){
 const route=new URL(html.match(/rel="canonical" href="([^"]+)"/)[1]).pathname;
 if(route!=='/'&&!/^\/electricista\/[^/]+\/[^/]+\/$/.test(route))return html;
 if(html.includes('data-structure="2"'))return html;
 const main=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)[0];
 let sections=blocks(main);
 const take=pattern=>{const i=sections.findIndex(s=>pattern.test(s.slice(0,s.indexOf('>')+1)));return i<0?'':sections.splice(i,1)[0];};
 const insert=(container,content)=>{const i=container.lastIndexOf('</section>');return container.slice(0,i)+content+container.slice(i);};
 let ordered;
 if(route==='/'){
  const hero=take(/class="hero"/),quick=take(/quick-strip/),services=take(/demand-section/),symptoms=take(/id="buscar-averia"/),brands=take(/er-brands/),diagnosis=take(/class="diagnosis"/),trust=take(/trust-band/),coverage=take(/id="zonas"/),cities=take(/id="electricista-en-tu-ciudad"/),contact=take(/wa-form-section/);
  assert(hero&&services&&coverage&&contact,'Portada incompleta');
  // The symptom index belongs to services; its anchor remains available.
  const compact=symptoms.replace('class="wrap section fault-section"','class="fault-section"');
  // One coverage section, retaining all municipal links and capital shortcuts.
  const cityCards=cities.match(/<div class="home-coverage-grid">[\s\S]*<\/div><\/section>/)?.[0].replace(/<\/section>$/,'')||'';
  const updatedCoverage=coverage.replace(/<p class="lead">[\s\S]*?<\/p>/, '<p class="lead">Consulta tu localidad en Madrid, Vizcaya, Álava, Guipúzcoa o Cantabria. Confirma la disponibilidad y el desplazamiento para la dirección de la avería.</p>');
  const unifiedCoverage=updatedCoverage.replace(/(<div class="town-groups[^>]*>)/,cityCards+'$1');
  ordered=[hero,quick,insert(services,compact),diagnosis,brands,trust,contact,unifiedCoverage];
 }else{
  const hero=take(/service-hero/),services=take(/local-services-section/),nav=take(/id="guia-de-averias"/),examples=take(/id="ejemplos-averias"/),materials=take(/er-materials/),place=take(/id="ubicacion-local"/),city=take(/id="reparacion-en-la-ciudad"/),madrid=take(/madrid-local-extra/),process=take(/id="atencion-local"/),faq=take(/local-faq/),contact=take(/local-contact/),districts=take(/madrid-districts/),directory=take(/local-directory/);
  assert(hero&&services&&process&&faq&&contact&&directory,'Página municipal incompleta');
  // Place the short symptom navigation inside the complete services block.
  const links=nav.match(/<nav\b[\s\S]*?<\/nav>/)?.[0]||'';
  const unified=services.replace('<div class="local-services-grid">',links+'<div class="local-services-grid">');
  ordered=[hero,unified,examples,materials,madrid,place,city,process,faq,contact,districts,directory];
 }
 assert.equal(sections.length,0,'Bloque no clasificado: '+sections.map(s=>s.slice(0,120)).join('\n'));
 let result=html.replace(main,main.match(/<main\b[^>]*>/)[0].replace('<main','<main data-structure="2"')+ordered.join('\n')+'</main>');
 // Reordering must preserve forms, images, and every destination.
 for(const re of [/<form\b[\s\S]*?<\/form>/g,/<img\b[^>]*>/g,/href="[^"]*"/g]){
  const items=s=>[...s.matchAll(re)].map(m=>m[0]).sort();
  // Coverage shortcuts removed with the duplicate panel already exist in the directory.
  if(re.source.startsWith('href')){const after=new Set(items(result));for(const link of items(html))assert(after.has(link),'Enlace perdido '+link);}
  else assert.deepEqual(items(result),items(html));
 }
 if(route==='/'){
  const title='Electricista 24 horas en Madrid y zona norte | Electricista Rápido';
  result=result.replace(/<title>[\s\S]*?<\/title>/, '<title>'+title+'</title>').replace(/(<meta property="og:title" content=")[^"]*/, '$1'+title);
 }
 return result;
}
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.name==='index.html'){const before=fs.readFileSync(file,'utf8'),after=structure(before);if(before!==after)fs.writeFileSync(file,after);}}}
if(process.argv[1]===new URL(import.meta.url).pathname)walk('dist');
