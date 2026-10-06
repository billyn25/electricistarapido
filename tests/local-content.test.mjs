import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { townRecord, renderTown, linkHomeTowns } from '../scripts/local-pages.mjs';
import { localServices } from '../content/local-services.mjs';
import { intakeNotes } from '../content/local-intake.mjs';

const dist = path.resolve('dist');
const pages = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const file = path.join(dir,entry.name);
    if (entry.isDirectory()) await walk(file);
    else if (entry.name.endsWith('.html')) pages.push({file,html:await fs.readFile(file,'utf8')});
  }
}
await walk(dist);
const towns = pages.filter(p => p.html.includes('class="local-page"'));
const schemas = html => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=> {const data=JSON.parse(m[1]);return data['@graph']||[data];});

test('all existing town pages have nine useful service summaries and five address/service FAQs', () => {
  assert.equal(towns.length,533);
  for(const p of towns) {
    assert.equal((p.html.match(/<article class="local-service"/g)||[]).length,9,p.file);
    assert.equal((p.html.match(/<details class="local-service-detail"/g)||[]).length,9,p.file);
    assert.equal((p.html.match(/<h1>/g)||[]).length,1,p.file);
    assert.equal((p.html.match(/class="mobile-bar contact-dock"/g)||[]).length,1,p.file);
    const faq=p.html.match(/class="wrap section local-faq"[\s\S]*?<\/section>/)[0];
    assert.equal((faq.match(/<details>/g)||[]).length,5,p.file);
    for(const s of localServices) assert.ok(p.html.includes(intakeNotes[s.slug]),`${p.file}: ${s.slug}`);
    assert.doesNotMatch(p.html,/LOCALIDADES CERCANAS|AVERÍA HABITUAL/);
  }
});
test('every home town links directly to an existing municipality', async () => {
  const home=await fs.readFile(path.join(dist,'index.html'),'utf8');
  const links=[...home.matchAll(/class="town-chip" href="([^"]+)"/g)];
  assert.equal(links.length,533);
  assert.doesNotMatch(home,/<span class="town-chip">/);
  for(const [,url] of links) {
    assert.match(url,/^\/electricista\/[^/]+\/[^/]+\/$/);
    await fs.access(path.join(dist,url,'index.html'));
  }
  assert.doesNotMatch(home,/Cuando publiquemos las páginas municipales/);
});
test('canonical, phone and breadcrumb data identify the correct town', () => {
  for(const p of towns) {
    const record=townRecord(p.html),graph=schemas(p.html);
    assert.ok(record && record.town);
    assert.match(p.html,/<title>[^<]*641 58 93 94<\/title>/);
    const breadcrumb=graph.find(g=>g['@type']==='BreadcrumbList');
    assert.equal(breadcrumb.itemListElement.length,3);
    assert.equal(breadcrumb.itemListElement[2].item,record.url);
    assert.equal(breadcrumb.itemListElement[2].name,record.town);
    assert.ok(graph.some(g=>g['@type']==='Service'&&g.areaServed.name===`${record.town}, ${record.province}`));
    assert.ok(!graph.some(g=>['Review','AggregateRating'].includes(g['@type'])));
    const main=p.html.match(/<main[\s\S]*?<\/main>/)[0];
    assert.equal(main,renderTown(record,towns.map(t=>townRecord(t.html)).filter(t=>t.provinceSlug===record.provinceSlug).sort((a,b)=>a.town.localeCompare(b.town,'es'))));
  }
});
test('sitemap has one entry per generated page and no literal newline escapes', async () => {
  const xml=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
  assert.doesNotMatch(xml,/\\n/);
  const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  assert.equal(urls.length,pages.length);
  assert.equal(new Set(urls).size,pages.length);
});
test('all local internal destinations and anchors exist', async () => {
  for(const p of pages) {
    for(const [,href] of p.html.matchAll(/href="([^"<>]+)"/g)) {
      if(!href.startsWith('/') && !href.startsWith('#')) continue;
      const url=new URL(href,`https://electricistarapido.com/${path.relative(dist,p.file)}`);
      const relative=decodeURIComponent(url.pathname);
      const target=path.join(dist,relative.endsWith('/')?`${relative}index.html`:relative);
      await fs.access(target);
      if(url.hash) assert.ok((await fs.readFile(target,'utf8')).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`${p.file} -> ${href}`);
    }
  }
});
test('forms retain the correct locality and never invent bookings', () => {
  for(const p of towns) {
    assert.match(p.html,/data-whatsapp-form data-phone="34641589394"/);
    assert.match(p.html,/No se envía automáticamente/);
    assert.match(p.html,/name="problem" required/);
    assert.match(p.html,/id="wa-town"[^>]*required/);
  }
});
test('broken home destinations are rejected rather than silently linked', () => {
  assert.throws(()=>linkHomeTowns('<article class="town-group"><h3><a href="/zonas/vizcaya/">Vizcaya</a></h3><span class="town-chip">Missing</span></article>',[]),/Missing municipal/);
});
test('enhancement stylesheet exists and favicon uses valid color values', async () => {
  await fs.access(path.join(dist,'assets/local-pages.css'));
  const favicon=await fs.readFile(path.join(dist,'favicon.svg'),'utf8');
  assert.doesNotMatch(favicon,/%23/);
  for (const p of pages) assert.equal((p.html.match(/href="\/assets\/local-pages\.css/g)||[]).length,1);
});

test('legal pages are generated, linked and contain only the supplied public owner identity', async () => {
  const home=await fs.readFile(path.join(dist,'index.html'),'utf8');
  for (const route of ['/aviso-legal/','/privacidad/','/cookies/']) {
    const html=await fs.readFile(path.join(dist,route,'index.html'),'utf8');
    assert.match(html,/<meta name="robots" content="(?:index,follow,max-image-preview:large|noindex,follow)">/);
    assert.match(html,new RegExp('<link rel="canonical" href="https://electricistarapido\\.com'+route.replaceAll('/','\\/')+'">'));
    assert.ok(home.includes(`href="${route}"`));
  }
  const legal=await fs.readFile(path.join(dist,'aviso-legal','index.html'),'utf8');
  assert.match(legal,/R\.F\.G\./);
  assert.doesNotMatch(legal,/CIF|NIF|DNI|domicilio fiscal/i);
});
test('production build contains no editorial dummy markers or analytics scripts', async () => {
  for (const p of pages) {
    assert.doesNotMatch(p.html,/Lorem ipsum|\bTODO\b|\bFIXME\b|cuando publiquemos/,p.file);
    assert.doesNotMatch(p.html,/googletagmanager\.com|google-analytics\.com|connect\.facebook\.net\/.*fbevents/i,p.file);
  }
});

test('home keeps original service photos except the reviewed differential image', async () => {
  const home=await fs.readFile(path.join(dist,'index.html'),'utf8');
  const ids=[...home.matchAll(/images\.pexels\.com\/photos\/(\d+)\//g)].map(m=>m[1]);
  for(const id of ['38171184','17842832','5691642','9679179','5691590','14319099','11679114','442160','7359566','7647233']) assert.ok(ids.includes(id),id);
  assert.ok(!ids.includes('35138694'),'old differential image must not return');
  assert.match(home,/fetchpriority="high" decoding="async"/);
  assert.doesNotMatch(home,/Electricidad doméstica, sin rodeos/);
  assert.match(home,/Cuando falla la luz,[\s\S]*vamos rápido a la avería/);
});

test('every municipal service heading reinforces the real locality without duplicating service pages', () => {
  for (const p of towns) {
    const record=townRecord(p.html);
    for (const service of localServices) {
      assert.ok(p.html.includes(`<h3>${service.title} en ${record.town}</h3>`), `${p.file}: ${service.slug}`);
      assert.ok(p.html.includes(`aria-label="${service.title} en ${record.town}: diagnóstico y reparación"`), `${p.file}: local guide label`);
    }
  }
});

test('municipal pages include useful review and repair detail for every service', () => {
  for (const p of towns) {
    for (const service of localServices) {
      assert.ok(p.html.includes('<strong>Comprobación:</strong> '+service.review), p.file+': '+service.slug+' review');
      assert.ok(p.html.includes('<strong>Reparación:</strong> '+service.repair), p.file+': '+service.slug+' repair');
    }
  }
});

test('home labels towns as Electricista en, hides secondary towns accessibly and ends with coverage summary', async () => {
  const home=await fs.readFile(path.join(dist,'index.html'),'utf8');
  assert.equal((home.match(/class="town-chip" href="\/electricista\//g)||[]).length,533);
  assert.ok((home.match(/>Electricista en [^<]+<\/a>/g)||[]).length>=533);
  assert.equal((home.match(/<details class="town-more">/g)||[]).length,5);
  assert.match(home,/ZONAS DONDE PRESTAMOS SERVICIO/);
  assert.match(home,/Resumen de pueblos y localidades/);
  for(const name of ['Vizcaya','Álava','Guipúzcoa','Madrid','Cantabria']) assert.ok(home.includes(`Electricista en ${name} ·`),name);
});
