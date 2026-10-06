/** Mobile presentation pass. Leaves page URLs, SEO metadata and desktop content intact. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg = body => `<svg class="contact-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
const phoneIcon = svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z"/>');
const chatIcon = svg('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M9 8c0 3.3 2.7 6 6 6m-6-6 1 2m5 4-2-1"/>');
const menu = `<details class="mobile-menu"><summary aria-label="Menú de navegación"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></summary><div class="mobile-menu-panel"><a href="/">Inicio</a><a href="/#averias">Averías y servicios</a><a href="/#zonas">Zonas de servicio</a></div></details>`;

function once(html, search, replacement, label) {
  const matches = typeof search === 'string' ? html.split(search).length - 1 : [...html.matchAll(new RegExp(search.source, 'g'))].length;
  if (matches !== 1) throw new Error(`Mobile layout: expected one ${label}, found ${matches}`);
  return html.replace(search, replacement);
}

export function adaptMobile(html, site, version = '1') {
  if (html.includes('data-mobile-layout="1"')) return html;
  if (!/^\+\d{9,15}$/.test(site.tel) || !/^\d{9,15}$/.test(site.whatsapp)) throw new Error('Invalid contact configuration');
  html = once(html, '<body>', '<body data-mobile-layout="1">', 'body');
  html = once(html, '</head>', `<link rel="stylesheet" href="/assets/mobile-layout.css?v=${escape(version)}"><script defer src="/assets/mobile-layout.js?v=${escape(version)}"></script></head>`, 'head');
  html = once(html, '</nav></header>', `${menu}</nav></header>`, 'header navigation');
  html = once(html, '<small>Reparaciones eléctricas 24h</small>', '<small>Reparaciones eléctricas<span class="brand-hours"> 24h</span></small>', 'brand subtitle');
  const bar = `<div class="mobile-bar contact-dock" role="group" aria-label="Contactar con Electricista Rápido"><a class="btn yellow contact-call" href="tel:${escape(site.tel)}" aria-label="Llamar al ${escape(site.phone)}">${phoneIcon}<span class="contact-label"><strong>Llamar</strong><small>${escape(site.phone)}</small></span></a><a class="btn wa contact-whatsapp" href="https://wa.me/${escape(site.whatsapp)}" aria-label="Contactar por WhatsApp">${chatIcon}<span class="contact-label"><strong>WhatsApp</strong><small>Cuéntanos tu avería</small></span></a></div>`;
  html = once(html, /<div class="mobile-bar">[\s\S]*?<\/div>/, bar, 'contact bar');
  if (html.includes('<section class="hero">')) {
    html = once(html, '<section class="hero"><div class="wrap"><div>', '<section class="hero"><div class="wrap"><div class="hero-copy">', 'home hero');
  }
  return html;
}

export async function refineBuild(directory = path.join(root, 'dist')) {
  const { site } = await import('../content/site.mjs');
  const assets = ['mobile-layout.css', 'mobile-layout.js'];
  const contents = await Promise.all(assets.map(name => fs.readFile(path.join(root, 'public', name))));
  const version = createHash('sha256').update(Buffer.concat(contents)).digest('hex').slice(0, 10);
  await fs.mkdir(path.join(directory, 'assets'), { recursive: true });
  await Promise.all(assets.map((name, i) => fs.writeFile(path.join(directory, 'assets', name), contents[i])));
  let pages = 0;
  async function visit(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.name.endsWith('.html')) {
        const before = await fs.readFile(file, 'utf8');
        await fs.writeFile(file, adaptMobile(before, site, version));
        pages++;
      }
    }
  }
  await visit(directory);
  if (!pages) throw new Error('No generated pages to adapt');
  console.log(`MOBILE OK: ${pages} páginas · cabecera compacta · contacto único · SEO conservado`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await refineBuild();
