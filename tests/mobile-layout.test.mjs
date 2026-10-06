import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { adaptMobile } from '../scripts/mobile-layout.mjs';

const site = { tel: '+34641589394', phone: '641 58 93 94', whatsapp: '34641589394' };
const fixture = '<!doctype html><html lang="es"><head><title>Electricista Urgencias 24 Horas | 641 58 93 94</title><meta name="description" content="Urgencias 24 horas: 641 58 93 94"><link rel="canonical" href="https://electricistarapido.com/"><script type="application/ld+json">{"telephone":"+34641589394"}</script></head><body><header><nav><a class="brand"><small>Reparaciones eléctricas 24h</small></a></nav></header><main><section class="hero"><div class="wrap"><div><h1>Cuando falla la luz</h1></div><div class="hero-media"><img src="reparacion.jpg" alt="Cuadro eléctrico"></div></div></section></main><div class="mobile-bar"><a href="tel:+34641589394">Llamar</a><a href="https://wa.me/34641589394">WhatsApp</a></div></body></html>';

test('single contact bar and correct destinations', () => {
  const result = adaptMobile(fixture, site);
  assert.equal((result.match(/class="mobile-bar /g) || []).length, 1);
  assert.match(result, /href="tel:\+34641589394"/);
  assert.match(result, /href="https:\/\/wa.me\/34641589394"/);
  assert.match(result, /<strong>Llamar<\/strong>/);
  assert.doesNotMatch(result, /☎|📞|📱/);
});
test('SEO title, description, canonical and JSON-LD unchanged', () => {
  const result = adaptMobile(fixture, site);
  for (const regex of [/<title>[\s\S]*?<\/title>/, /<meta name="description"[^>]*>/, /<link rel="canonical"[^>]*>/, /<script type="application\/ld\+json">[\s\S]*?<\/script>/]) assert.equal(result.match(regex)[0], fixture.match(regex)[0]);
});
test('native menu, no dependency on JS for opening links', () => {
  const result = adaptMobile(fixture, site);
  assert.match(result, /<details class="mobile-menu"><summary aria-label=/);
  assert.match(result, /href="\/#averias"/);
  assert.match(result, /href="\/#zonas"/);
});
test('photo, heading and original page contents preserved', () => {
  const result = adaptMobile(fixture, site);
  assert.match(result, /<h1>Cuando falla la luz<\/h1>/);
  assert.match(result, /src="reparacion.jpg"/);
  assert.match(result, /class="hero-copy"/);
});
test('idempotent if run again', () => {
  const once = adaptMobile(fixture, site);
  assert.equal(adaptMobile(once, site), once);
});
test('template mismatch fails rather than silently publishing incomplete UI', () => {
  assert.throws(() => adaptMobile(fixture.replace('</nav></header>', '</header>'), site), /header navigation/);
});
test('invalid contact configuration rejected', () => {
  assert.throws(() => adaptMobile(fixture, { ...site, tel: 'javascript:alert(1)' }), /Invalid contact/);
});
test('all generated pages keep their phone, canonical, schema and one bar', async () => {
  const dist = path.resolve('dist');
  let pages = 0;
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (file.endsWith('.html')) {
        const html = await fs.readFile(file, 'utf8');
        assert.equal((html.match(/class="mobile-bar /g) || []).length, 1, file);
        assert.match(html, /<title>[^<]*641 58 93 94<\/title>/, file);
        assert.match(html, /<link rel="canonical"/, file);
        assert.match(html, /641 58 93 94/, file);
        assert.match(html, /assets\/mobile-layout\.css/, file);
        assert.match(html, /assets\/mobile-layout\.js/, file);
        pages++;
      }
    }
  }
  await walk(dist);
  assert.ok(pages >= 16, `Only ${pages} pages built`);
  for (const name of ['mobile-layout.css', 'mobile-layout.js']) await fs.access(path.join(dist, 'assets', name));
});
