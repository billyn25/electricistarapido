import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {manufacturers,photographs,selectMaterials,transform,readLogos,CSS,cssPath} from '../scripts/local-materials.mjs';
const home=fs.readFileSync('dist/index.html','utf8'),logos=readLogos(home);
const fixture=(route,name='Prueba')=>`<!doctype html><html><head><link rel="canonical" href="https://electricistarapido.com${route}"><meta name="locality" content="${name}"></head><body><main><section class="service-hero"><h1>Electricista 24 horas en ${name}, Madrid</h1></section><section id="ejemplos-averias"></section></main><footer class="site-footer er-footer-v2"><div class="er-map"><div class="er-map-note">Nota anterior</div><nav class="er-map-links"><a href="/zonas/madrid/">Madrid</a></nav></div></footer></body></html>`;
function filesIn(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?filesIn(path.join(dir,x.name)):x.name.endsWith('.html')?[path.join(dir,x.name)]:[]);}
test('selección estable, dos fabricantes y temas distintos, sin mutar el catálogo',()=>{
 const before=JSON.stringify(manufacturers);
 for(let i=0;i<100;i++){
  const route=`/electricista/madrid/prueba-${i}/`,p=selectMaterials(route);
  assert.deepEqual(p,selectMaterials(route));assert.equal(p.cards.length,2);
  assert.equal(new Set(p.cards.map(c=>c.brand.id)).size,2);
  assert.equal(new Set(p.cards.map(c=>c.example.topic)).size,2);
 }
 assert.equal(JSON.stringify(manufacturers),before);
});
test('evita marcas y fotos ya incluidas en los ejemplos locales',()=>{
 const before='<main><a href="/servicios/reparacion-cuadros-electricos/#caso-cuadro-chint">CHINT</a><img src="https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg"></main>';
 for(let i=0;i<30;i++){
  const p=selectMaterials(`/electricista/madrid/p-${i}/`,before);
  assert(!p.cards.some(c=>c.brand.id==='chint'));assert.notEqual(p.photo.id,'9679179');
 }
});
test('transformación idempotente con marcas solo en municipios y distritos',()=>{
 for(const route of ['/','/electricista/madrid/coslada/','/electricista-madrid/latina/','/servicios/reparacion-cuadros-electricos/']){
  const original=fixture(route),result=transform(original,logos);
  assert.equal(transform(result.html,logos).html,result.html);
  assert.equal(result.html.match(/<h1[^>]*>.*?<\/h1>/)[0],original.match(/<h1[^>]*>.*?<\/h1>/)[0]);
  assert.equal(result.html.match(/rel="canonical"[^>]*>/)[0],original.match(/rel="canonical"[^>]*>/)[0]);
  assert.equal((result.html.match(/id="material-electrico-local"/g)||[]).length,/^\/electricista(?:\/|-madrid\/)/.test(route)?1:0);
 }
});
test('footer resetea altura/ancho/márgenes y no oculta el contenido desbordado',()=>{
 assert(CSS.includes('height:auto;min-height:0;max-height:none'));
 assert(CSS.includes('nav.er-map-links>a{'));
 assert(!CSS.includes('overflow:hidden'));
 assert(!CSS.includes('overflow-x:hidden'));
});
test('todas las localidades tienen dos logos y una foto; enlaces y assets existen',()=>{
 const guide=fs.readFileSync('dist/servicios/reparacion-cuadros-electricos/index.html','utf8');
 const htmlFiles=filesIn('dist');let towns=0,districts=0;const usedBrands=new Set(),combinations=new Set();
 for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');assert(html.includes(cssPath),file);
  const route=new URL(html.match(/rel="canonical" href="([^"]+)"/)[1]).pathname;
  const section=html.match(/<!-- local-materials:start -->([\s\S]*?)<!-- local-materials:end -->/)?.[1];
  if(/^\/(?:electricista\/[^/]+\/[^/]+|electricista-madrid\/[^/]+)\/$/.test(route)){
   assert(section,route);assert.equal((html.match(/id="material-electrico-local"/g)||[]).length,1,route);
   assert.equal((section.match(/class="er-material-logo/g)||[]).length,2,route);
   assert.equal((section.match(/class="er-materials-photo"/g)||[]).length,1,route);
   assert(section.includes('no acredita trabajos ni marcas instaladas'));
   const brands=[...section.matchAll(/data-material-brand="([^"]+)"/g)].map(m=>m[1]);
   assert.equal(new Set(brands).size,2);brands.forEach(b=>usedBrands.add(b));
   combinations.add(brands.join('|'));
   for(const link of section.matchAll(/href="\/servicios\/reparacion-cuadros-electricos\/#caso-([^"]+)"/g))assert(guide.includes(`id="caso-${link[1]}"`),link[1]);
   for(const img of section.matchAll(/<img\b[^>]*src="([^"]+)"/g))if(img[1].startsWith('/'))assert(fs.existsSync(path.join('dist',img[1])),img[1]);
   if(route.startsWith('/electricista-madrid/'))districts++;else towns++;
  }else assert(!section,route);
 }
 assert(towns>500);assert.equal(districts,21);assert.equal(usedBrands.size,5);assert(combinations.size>=10);
 assert(fs.existsSync(path.join('dist',cssPath)));assert.equal(photographs.length,3);
});
