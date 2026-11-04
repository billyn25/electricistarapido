import fs from 'node:fs';
import assert from 'node:assert/strict';
import {inventory} from './seo-strengthen.mjs';
import {madridPostalCodesByIne} from '../content/madrid-postal-codes.mjs';
const c=JSON.parse(fs.readFileSync('dist/coverage-manifest.json','utf8')),{pages,byRoute}=inventory('dist');
assert.equal(c.total,533);assert.equal(pages.length,c.urls);assert.equal(new Set(c.assignments.map(a=>a.code)).size,c.total);
const search=JSON.parse(fs.readFileSync('dist/assets/municipios.json','utf8'));assert.equal(search.length,c.total);
const redirects=fs.readFileSync('dist/_redirects','utf8');
for(const a of c.assignments){
 const doc=byRoute.get(a.destination);assert(doc,a.name+': destino inexistente');
 const hub=c.assignments.find(t=>t.original===a.destination);assert.equal(hub.provinceSlug,a.provinceSlug);assert(a.distanceKm<=25.001);
 if(a.population>=5000)assert.equal(a.original,a.destination);
 assert(search.some(t=>t.path===a.url),a.name+': buscador');
 if(a.original!==a.destination){assert(!byRoute.has(a.original));assert(doc.html.includes(`id="cobertura-${a.code}" data-coverage-name=`));for(const cp of madridPostalCodesByIne[a.code]||[])assert(doc.html.includes(cp));for(const from of [a.original,a.original.slice(0,-1),a.original+'index.html'])assert(redirects.includes(`${from} ${c.domain}${a.destination} 301!`));}
}
for(const p of pages){
 if(['town','province','district'].includes(p.type)){for(const re of [/<title>(.*?)<\/title>/,/<h1[^>]*>(.*?)<\/h1>/,/<meta name="description" content="([^"]*)"/])assert.match(p.html.match(re)?.[1]||'',/Electricista urgente 24 horas en /);}
 assert(p.html.includes('/assets/municipal-coverage.js'));
}
const reached=new Set(['/']),queue=['/'];while(queue.length){const p=byRoute.get(queue.shift());for(const [,href] of p.html.matchAll(/href="([^"]+)"/g)){let u;try{u=new URL(href,c.domain+p.route);}catch{continue;}if(u.origin!==c.domain||!byRoute.has(u.pathname)||reached.has(u.pathname))continue;reached.add(u.pathname);queue.push(u.pathname);}}
assert.equal(reached.size,pages.length,'Páginas huérfanas');
console.log(`COBERTURA AUDITADA: ${c.total} municipios, ${c.retained} páginas municipales, ${c.urls} URLs, redirecciones directas, CP, buscador, SEO y enlaces correctos.`);
