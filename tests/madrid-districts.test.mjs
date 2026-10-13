import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { madridDistricts, madridDistrictRoute } from '../content/madrid-districts.mjs';

const dist=path.resolve('dist');
const domain='https://electricistarapido.com';

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

test('cada distrito tiene página indexable, canonical propio y contenido eléctrico', async()=>{
  for(const d of madridDistricts){
    const route=madridDistrictRoute(d);
    const file=path.join(dist,route.slice(1),'index.html');
    const html=await fs.readFile(file,'utf8');
    assert.equal((html.match(/<h1\b/g)||[]).length,1,d.name);
    assert.ok(html.includes('data-madrid-district="1"'),d.name);
    assert.ok(html.includes(`Electricista 24 horas en ${d.name}, Madrid`),d.name);
    assert.ok(html.includes('<meta name="robots" content="index,follow,max-image-preview:large">')||html.includes('<meta name="robots" content="index,follow">'),d.name);
    assert.ok(html.includes(`<link rel="canonical" href="${domain+route}"`),d.name);
    assert.ok(html.includes('no representa una oficina física'),d.name);
  }
});

test('sitemap Madrid suma provincia, 179 municipios y 21 distritos', async()=>{
  const xml=await fs.readFile(path.join(dist,'sitemaps/sitemap-madrid.xml'),'utf8');
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.equal(urls.length,201);
  assert.equal(new Set(urls).size,201);
  for(const d of madridDistricts) assert.ok(urls.includes(domain+madridDistrictRoute(d)),d.name);
});
