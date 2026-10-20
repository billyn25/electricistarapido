/** Homepage-only manufacturer strip. Logos identify products, not an official affiliation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const brands = [
  { id: 'chint', name: 'CHINT', caption: 'Automáticos y diferenciales', scenario: 'cuadro-chint', ext: 'svg',
    logo: 'https://www.chint.eu/assets/build/images/chint-claim-blue-logo.svg', source: 'https://www.chint.eu/es/' },
  { id: 'schneider-electric', name: 'Schneider Electric', caption: 'Protecciones Acti9', scenario: 'cuadro-schneider-acti9', ext: 'svg',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Schneider_Electric_2007.svg', source: 'https://commons.wikimedia.org/wiki/File:Schneider_Electric_2007.svg' },
  { id: 'maxge', name: 'MAXGE', caption: 'Protección y control', scenario: 'cuadro-maxge', ext: 'png', monochrome: true,
    logo: 'https://www.maxge.eu/web/image/1161-5d1f7ecc/logo_maxge_187x89px%20blanco.png', source: 'https://www.maxge.eu/' },
  { id: 'legrand', name: 'Legrand', caption: 'Diferenciales DX³', scenario: 'cuadro-legrand-dx3', ext: 'webp',
    logo: 'https://www.legrand.com/sites/default/files/styles/simple_webp/public/Photos/Groupe/Logo_actuel.png.webp?itok=XDBxNZx0', source: 'https://www.legrand.com/en/group/our-history' },
  { id: 'revalco', name: 'Revalco', caption: 'Componentes de cuadro', scenario: 'cuadro-revalco', ext: 'png', monochrome: true,
    logo: 'https://www.revalco.es/wp-content/uploads/2024/11/LOGO-REVALCO-material-electrico-online.png', source: 'https://www.revalco.es/' }
];

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 12);
const start = '<!-- home-brands:start -->';
const end = '<!-- home-brands:end -->';
const anchor = '<section class="wrap section demand-section"';
export const CSS = `
/* Deliberately scoped: this strip must not restyle service cards or local pages. */
.er-brands{background:#f5f8fb;border-bottom:1px solid #dce7ee;padding:36px 0;scroll-margin-top:115px}
.er-brands .er-brands-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:22px}
.er-brands .er-brands-kicker{display:block;color:#63768a;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px}
.er-brands h2{font-size:clamp(24px,2.7vw,32px);line-height:1.2;letter-spacing:-.03em;color:#10283b;margin:0}
.er-brands .er-brands-intro{color:#526b7d;font-size:14px;line-height:1.6;max-width:420px;margin:0}
.er-brands .er-brands-grid{list-style:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;padding:0;margin:0}
.er-brands .er-brands-grid li{min-width:0;margin:0;padding:0}
.er-brands .er-brand-card{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;min-width:0;padding:20px 12px 16px;background:#fff;border:1px solid #dce7ee;border-radius:14px;text-align:center;text-decoration:none;box-shadow:0 3px 12px #071c2d04}
.er-brands .er-brand-card:hover{border-color:#c8a316;box-shadow:0 5px 18px #071c2d0c}
.er-brands .er-brand-card:focus-visible,.er-brands .er-brands-link:focus-visible{outline:3px solid #976d00;outline-offset:4px}
.er-brands .er-brand-logo{height:58px;width:100%;display:flex;align-items:center;justify-content:center}
.er-brands .er-brand-logo img{display:block;width:100%;max-width:166px;height:52px;object-fit:contain;object-position:center;margin:0;border:0;border-radius:0;box-shadow:none}
.er-brands .er-brand-monochrome{filter:brightness(0);opacity:.82}
.er-brands .er-brand-caption{font-size:12px;line-height:1.45;color:#455f72;overflow-wrap:anywhere}
.er-brands .er-brands-bottom{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:16px}
.er-brands .er-brands-note{font-size:11px;line-height:1.65;color:#63768a;max-width:720px;margin:0}
.er-brands .er-brands-link{display:inline-flex;align-items:center;min-height:44px;gap:8px;font-size:13px;font-weight:800;color:#0a69b2;text-decoration:none;white-space:nowrap}
@media(max-width:850px){.er-brands .er-brands-heading{display:block}.er-brands .er-brands-intro{max-width:650px;margin-top:10px}.er-brands .er-brands-grid{gap:8px}.er-brands .er-brand-card{padding:16px 9px 13px}.er-brands .er-brand-logo img{height:44px}.er-brands .er-brands-bottom{align-items:flex-start}}
@media(max-width:600px){.er-brands{padding:28px 0}.er-brands .er-brands-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.er-brands .er-brands-grid li:last-child{grid-column:1/-1;width:calc(50% - 5px);justify-self:center}.er-brands .er-brand-card{padding:14px 12px 12px;gap:7px}.er-brands .er-brand-logo{height:44px}.er-brands .er-brand-logo img{height:42px;max-width:148px}.er-brands .er-brand-caption{font-size:11px}.er-brands .er-brands-bottom{display:block}.er-brands .er-brands-link{margin-top:4px;white-space:normal}.er-brands .er-brands-heading{margin-bottom:17px}}
`;
export const cssPath = '/assets/home-brands.' + hash(CSS) + '.css';
export const brandLink = brand => '/servicios/reparacion-cuadros-electricos/#caso-' + brand.scenario;

export function renderBrands(logos = new Map()) {
  const cards = brands.map(b => `<li><a class="er-brand-card" href="${brandLink(b)}" aria-label="${escape(b.name)}: consultar revisión del cuadro"><span class="er-brand-logo"><img ${b.monochrome ? 'class="er-brand-monochrome" ' : ''}src="${escape(logos.get(b.id) || b.logo)}" alt="${escape(b.name)}" width="190" height="58" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span><span class="er-brand-caption">${escape(b.caption)}</span></a></li>`).join('');
  return `${start}<section class="er-brands" id="marcas-electricas" aria-labelledby="marcas-title"><div class="wrap"><div class="er-brands-heading"><div><span class="er-brands-kicker">Cuadros · protecciones · componentes</span><h2 id="marcas-title">Marcas de material eléctrico</h2></div><p class="er-brands-intro">La referencia adecuada para cada instalación. Consulta la revisión de tu cuadro y sus protecciones.</p></div><ul class="er-brands-grid" aria-label="Fabricantes de material eléctrico">${cards}</ul><div class="er-brands-bottom"><p class="er-brands-note">Material según compatibilidad y disponibilidad. Las marcas identifican fabricantes; no implican servicio técnico oficial.</p><a class="er-brands-link" href="/servicios/reparacion-cuadros-electricos/">Ver reparación de cuadros <span aria-hidden="true">→</span></a></div></div></section>${end}`;
}

export function transform(html, logos = new Map()) {
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical || new URL(canonical).pathname !== '/') return html;
  if (html.includes(start)) {
    assert.equal(html.split(start).length, 2, 'Bloque de marcas duplicado');
    assert(html.includes(end), 'Bloque de marcas incompleto');
    html = html.slice(0, html.indexOf(start)) + html.slice(html.indexOf(end) + end.length);
  }
  html = html.replace(/<link rel="stylesheet" href="\/assets\/home-brands\.[a-f0-9]+\.css">/g, '');
  assert.equal(html.split(anchor).length, 2, 'No se ha encontrado el listado único de servicios de portada');
  assert.equal(html.split('</head>').length, 2, 'Cabecera HTML no reconocida');
  return html.replace(anchor, () => renderBrands(logos) + anchor).replace('</head>', `<link rel="stylesheet" href="${cssPath}"></head>`);
}

export function validateLogo(bytes, ext) {
  assert(bytes.length > 80 && bytes.length < 400_000, 'Tamaño de logo no válido');
  if (ext === 'svg') {
    const text = bytes.toString('utf8');
    assert(/<svg\b/.test(text) && !/<(?:script|foreignObject)\b|\son[a-z]+\s*=/i.test(text), 'SVG no válido');
  } else if (ext === 'png') {
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG no válido');
  } else if (ext === 'webp') {
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', 'WebP no válido');
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP', 'WebP no válido');
  } else throw new Error('Formato de logo desconocido');
}

async function loadLogo(brand, root) {
  const cacheFile = path.resolve('.cache/brand-logos', hash(brand.logo) + '.' + brand.ext);
  try {
    let bytes;
    try { bytes = await fs.readFile(cacheFile); validateLogo(bytes, brand.ext); }
    catch {
      const response = await fetch(brand.logo, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'ElectricistaRapido-site-build/1.0 (brand identification)' } });
      assert(response.ok, 'HTTP ' + response.status);
      assert(Number(response.headers.get('content-length') || 0) < 400_000, 'Logo demasiado grande');
      bytes = Buffer.from(await response.arrayBuffer());
      validateLogo(bytes, brand.ext);
      await fs.mkdir(path.dirname(cacheFile), { recursive: true });
      await fs.writeFile(cacheFile, bytes);
    }
    const url = `/assets/brands/${brand.id}.${hash(bytes)}.${brand.ext}`;
    await fs.mkdir(path.join(root, 'assets/brands'), { recursive: true });
    await fs.writeFile(path.join(root, url), bytes);
    return { id: brand.id, src: url, storage: 'local', bytes: bytes.length };
  } catch (error) {
    // A manufacturer outage must not prevent the rest of the website from deploying.
    console.warn(`BRAND LOGO ${brand.name}: copia local no disponible (${error.message}); se mantiene el original remoto.`);
    return { id: brand.id, src: brand.logo, storage: 'remote', warning: error.message };
  }
}

export async function build(root = 'dist', { download = true } = {}) {
  const file = path.join(root, 'index.html');
  const before = await fs.readFile(file, 'utf8');
  // Validate before making any changes or network requests.
  transform(before);
  const logoResults = download ? await Promise.all(brands.map(b => loadLogo(b, root))) : brands.map(b => ({ id: b.id, src: b.logo, storage: 'remote' }));
  const html = transform(before, new Map(logoResults.map(b => [b.id, b.src])));
  await fs.mkdir(path.join(root, 'assets'), { recursive: true });
  await fs.writeFile(path.join(root, cssPath), CSS);
  await fs.writeFile(file, html);
  await fs.mkdir('reports', { recursive: true });
  const report = { page: '/', section: '#marcas-electricas', brands: logoResults, changedPages: 1, newPages: 0 };
  await fs.writeFile('reports/home-brands.json', JSON.stringify(report, null, 2));
  console.log(`HOME BRANDS OK: ${brands.length} logos; solo portada, sin nuevas URL.`);
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await build();
