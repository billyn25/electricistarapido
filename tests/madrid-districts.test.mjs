import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { madridDistricts, madridDistrictRoute } from '../content/madrid-districts.mjs';

const dist=path.resolve('dist');
const domain='https://electricistarapido.com';
const preview=process.env.FORCE_NOINDEX==='true'||['deploy-preview','branch-deploy'].includes(process.env.CONTEXT);

test('Madrid muestra los 21 distritos antes del directorio de municipios', async()=>{
  const html=await fs.readFile(path.join(dist,'zonas/madrid/index.html'),'utf8');
  assert.equal(madridDistricts.length,21);
  assert.ok(html.includes('id="distritos-madrid"'));
  assert.ok(html.indexOf('id="distritos-madrid"') < html.indexOf('<div class="eyebrow">MUNICIPIOS</div>'));
  for(const d of madridDistricts) assert.ok(html.includes(`href="${madridDistrictRoute(d)}"`),d.name);
});

test('Madrid capital enlaza también los distritos', async()=>{
  const html=await fs.readFile(path.join(dist,'electricista/madrid/madrid/index.html'),'utf8');
  assert.ok(html.includes('id="distritos-madrid"'));
  for(const d of madridDistricts) assert.ok(html.includes(`href="${madridDistrictRoute(d)}"`),d.name);
});

test('cada distrito respeta indexación según entorno, canonical y contenido eléctrico', async()=>{
  for(const d of madridDistricts){
    const route=madridDistrictRoute(d);
    const file=path.join(dist,route.slice(1),'index.html');
    const html=await fs.readFile(file,'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1,d.name);
    assert.ok(html.includes('data-madrid-district="1"'),d.name);
    assert.ok(html.includes(`Electricista 24 horas en ${d.name}, Madrid`),d.name);
    const robots=html.match(/<meta name="robots" content="([^"]+)">/)?.[1];
    if(preview) assert.equal(robots,'noindex,follow',d.name+': preview no debe indexarse');
    else assert.ok(['index,follow,max-image-preview:large','index,follow'].includes(robots),d.name+': producción debe ser indexable');
    assert.ok(html.includes(`<link rel="canonical" href="${domain+route}"`),d.name);
    assert.ok(html.toLowerCase().includes('no representa una oficina física'),d.name);
  }
});

test('sitemap Madrid suma provincia, 179 municipios y 21 distritos', async()=>{
  const xml=await fs.readFile(path.join(dist,'sitemaps/sitemap-madrid.xml'),'utf8');
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.equal(urls.length,201);
  assert.equal(new Set(urls).size,201);
  for(const d of madridDistricts) assert.ok(urls.includes(domain+madridDistrictRoute(d)),d.name);
});

test('cabeceras de previsualización bloquean indexación sin bloquear producción', async()=>{
  const headers=await fs.readFile(path.join(dist,'_headers'),'utf8');
  if(preview) assert.match(headers,/X-Robots-Tag:\s*noindex, follow/i);
  else assert.doesNotMatch(headers,/X-Robots-Tag:[^\n]*noindex/i);
});
