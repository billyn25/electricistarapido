import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { brands, brandLink, transform, cssPath, validateLogo } from '../scripts/home-brands.mjs';
const fixture = route => `<!doctype html><html><head><title>Prueba</title><link rel="canonical" href="https://electricistarapido.com${route}"></head><body><header>Cabecera</header><main><section class="hero"><h1>Electricista</h1></section><section class="quick-strip">Atajos</section><section class="wrap section demand-section" id="averias">Servicios</section></main><footer>Pie</footer></body></html>`;
test('cinco marcas y anclas distintas, con logos auténticos de origen documentado', () => {
  assert.equal(brands.length, 5);
  assert.equal(new Set(brands.map(b => b.id)).size, 5);
  assert.equal(new Set(brands.map(brandLink)).size, 5);
  for (const b of brands) { assert(b.logo.startsWith('https://')); assert(b.source.startsWith('https://')); }
});
test('inserción única antes de los servicios sin cambiar el hero ni el pie', () => {
  const original = fixture('/');
  const html = transform(original);
  assert.equal((html.match(/id="marcas-electricas"/g) || []).length, 1);
  assert.equal((html.match(/<img /g) || []).length, 5);
  assert(html.indexOf('quick-strip') < html.indexOf('id="marcas-electricas"'));
  assert(html.indexOf('id="marcas-electricas"') < html.indexOf('id="averias"'));
  assert.equal(html.match(/<section class="hero">.*?<\/section>/)[0], original.match(/<section class="hero">.*?<\/section>/)[0]);
  assert.equal(html.match(/<footer>.*?<\/footer>/)[0], original.match(/<footer>.*?<\/footer>/)[0]);
  assert.equal(transform(html), html);
  assert(html.includes('no implican servicio técnico oficial'));
});
test('no modifica municipios, distritos ni guías', () => {
  for (const route of ['/electricista/madrid/alcala-de-henares/', '/electricista-madrid/latina/', '/servicios/reparacion-cuadros-electricos/']) assert.equal(transform(fixture(route)), fixture(route));
});
test('rechaza respuestas HTML y SVG activos en lugar de guardarlos como logos', () => {
  assert.throws(() => validateLogo(Buffer.from('<html>' + 'error'.repeat(30) + '</html>'), 'png'));
  assert.throws(() => validateLogo(Buffer.from('<svg><script>' + 'x'.repeat(100) + '</script></svg>'), 'svg'));
  assert.throws(() => validateLogo(Buffer.alloc(30), 'webp'));
});
test('la portada construida conserva cinco logos y enlaces a casos existentes', () => {
  const root = 'dist';
  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const guide = fs.readFileSync(path.join(root, 'servicios/reparacion-cuadros-electricos/index.html'), 'utf8');
  assert.equal((home.match(/id="marcas-electricas"/g) || []).length, 1);
  assert(home.includes(cssPath));
  assert(fs.existsSync(path.join(root, cssPath)));
  for (const b of brands) {
    assert(home.includes(`alt="${b.name}"`));
    assert(home.includes(brandLink(b)));
    assert(guide.includes(`id="caso-${b.scenario}"`));
  }
  for (const route of ['electricista-madrid/latina', 'electricista/madrid/madrid']) assert(!fs.readFileSync(path.join(root, route, 'index.html'), 'utf8').includes('id="marcas-electricas"'));
});
