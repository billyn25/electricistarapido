import test from 'node:test';
import assert from 'node:assert/strict';
import {inventory,transform,CSS_PATH} from '../scripts/seo-strengthen.mjs';
const {pages,byRoute}=inventory('dist');
const extract=(h,re)=>[...h.matchAll(re)].map(m=>m[0]);
test('all existing cities, districts, provinces and service guides transform without changing assets or contacts',()=>{
 for(const p of pages){const after=transform(p.html,p,byRoute);
  for(const re of [/<link rel="canonical"[^>]*>/g,/<meta name="robots"[^>]*>/g,/<img\b[^>]*>/g,/<header\b[^>]*>[\s\S]*?<\/header>/g,/<footer\b[^>]*>[\s\S]*?<\/footer>/g,/<form\b[\s\S]*?<\/form>/g])assert.deepEqual(extract(after,re),extract(p.html,re),p.route);
  assert.equal(transform(after,p,byRoute),after,'Second pass must be identical');
  if(p.type==='other')assert.equal(after,p.html,'Legal pages remain unchanged');else assert(after.includes(CSS_PATH));
 }
});
test('metadata distinguishes the Madrid province from Madrid city and all five capitals',()=>{
 for(const route of ['/electricista/vizcaya/bilbao/','/electricista/alava/vitoria-gasteiz/','/electricista/guipuzcoa/donostia-san-sebastian/','/electricista/cantabria/santander/','/electricista/madrid/madrid/']){
  const p=byRoute.get(route),after=transform(p.html,p,byRoute);assert(after.includes('id="reparacion-en-la-ciudad"'));assert(after.includes('urgencias y reparaciones'));
 }
 const p=byRoute.get('/zonas/madrid/');assert(transform(p.html,p,byRoute).includes('Electricistas en Comunidad de Madrid: ciudades y pueblos'));
});
test('malformed base templates fail rather than publishing partial service navigation',()=>{
 const p=byRoute.get('/electricista/vizcaya/bilbao/');
 const bad=p.html.replace('class="local-guide-link"','class="broken-guide"');assert.throws(()=>transform(bad,p,byRoute));
 const h=byRoute.get('/');assert.throws(()=>transform(h.html.replace('class="wrap section demand-section"','class="unrecognized"'),h,byRoute));
});
test('regional Madrid phone survives text changes and outside Madrid no contact is reassigned',()=>{
 const p=byRoute.get('/electricista/madrid/madrid/');const html=p.html.replaceAll('641 58 93 94','614 78 99 45').replaceAll('34641589394','34614789945');
 const after=transform(html,p,byRoute);assert(after.includes('614 78 99 45'));assert(!after.includes('34641589394'));
 const n=byRoute.get('/electricista/vizcaya/bilbao/');assert(!transform(n.html,n,byRoute).includes('34614789945'));
});
