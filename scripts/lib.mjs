import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const slugify = value => normalize(value).replaceAll(' ','-');
export const displayName = value => String(value).replaceAll('\\/','/').replace(/^(.+),\s*(El|La|Los|Las)$/, '$2 $1').trim();
export const townPath = (province,town) => `/electricista/${province.slug}/${town.slug}/`;
export const servicePath = service => `/servicios/${service.slug}/`;
export function groupTowns(rows, provinces) {
 const ids = new Set();
 return provinces.map(p => {
  const towns = rows.filter(r => r.provincia_id === p.id).map(r => {
   if(!/^\d{5}$/.test(r.municipio_id) || ids.has(r.municipio_id) || !r.nombre) throw new Error('Municipio inválido o repetido');
   ids.add(r.municipio_id);
   const name=displayName(r.nombre); return {id:r.municipio_id,name,slug:slugify(name)};
  }).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  const counts = new Map(); for(const t of towns) counts.set(t.slug,(counts.get(t.slug)||0)+1);
  for(const t of towns) if(counts.get(t.slug)>1) t.slug += `-${t.id}`;
  if(!towns.length) throw new Error(`Sin municipios en ${p.name}`);
  return {...p,towns};
 });
}
export function localReady(local) {
 return Boolean(local?.indexApproved && local?.coverageConfirmed && local?.reviewedBy && /^\d{4}-\d{2}-\d{2}$/.test(local?.reviewedAt || '') && Array.isArray(local?.paragraphs) && local.paragraphs.length >= 2 && local.paragraphs.every(t=>typeof t==='string' && t.trim().length>=100));
}
export function launchReady(site, env=process.env) {
 const isPreview = env.FORCE_NOINDEX==='true' || ['deploy-preview','branch-deploy'].includes(env.CONTEXT);
 const canonicalHost = !env.URL || new URL(env.URL).hostname===new URL(site.domain).hostname;
 return Boolean(site.launchApproved && site.legal.reviewed && site.legal.holder && site.legal.taxId && site.legal.address && site.legal.email && site.technicalReview.name && site.technicalReview.date && !isPreview && canonicalHost);
}
export async function cachedDownload(url, file, {gitBlob, image=false}={}) {
 await fs.mkdir(new URL('.',`file://${file}`).pathname,{recursive:true});
 const valid = bytes => {
  if(gitBlob && createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')!==gitBlob) throw new Error('Integridad del origen geográfico incorrecta');
  if(image && (bytes.length < 1000 || bytes.length > 15_000_000 || !(bytes[0]===0xff && bytes[1]===0xd8))) throw new Error('Fotografía JPEG inválida');
  return bytes;
 };
 try { return valid(await fs.readFile(file)); } catch(e) { if(e.code!=='ENOENT') await fs.rm(file,{force:true}); }
 let last;
 for(let n=0;n<3;n++) {
  try {
   const r = await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'ElectricistaRapido-build/1.0'}});
   if(!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
   const bytes=valid(Buffer.from(await r.arrayBuffer())); await fs.writeFile(file,bytes); return bytes;
  } catch(e) {last=e; if(n<2) await new Promise(r=>setTimeout(r,1000*(n+1)));}
 }
 throw last;
}
