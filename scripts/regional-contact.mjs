/** Server-rendered regional contacts. No route, sitemap, image or robots changes. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

// Project-specific settings are inserted by the build integration.
const SETTINGS=JSON.parse(fs.readFileSync(new URL('./regional-contact.json',import.meta.url),'utf8'));
export const CENTRAL={phone:'614 78 99 45',tel:'+34614789945',wa:'34614789945'};
export const NORTH={phone:SETTINGS.northPhone,tel:'+34641589394',wa:'34641589394'};
const oldValues=['+34641589394','34641589394','641589394','641 589 394','641 58 93 94','641%20589%20394','641%2058%2093%2094','641&nbsp;589&nbsp;394','641\u00a0589\u00a0394'];
export function region(route){
 const parts=new URL(route,'https://audit.invalid').pathname.toLowerCase().split('/').filter(Boolean);
 const first=parts[0]||'';
 const value=['electricista','zonas'].includes(first)?parts[1]:first==='electricista-madrid'?'madrid':first;
 return SETTINGS.central.includes(value)?value:null;
}
export function replacePhone(text){
 let result=text;
 for(const old of oldValues){
  const value=old.startsWith('+')?CENTRAL.tel:old.startsWith('34')?CENTRAL.wa:old==='641589394'?'614789945':old.includes('%20')?encodeURIComponent(CENTRAL.phone):CENTRAL.phone;
  result=result.replaceAll(old,value);
 }
 return result;
}
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const card=(label,contact,key)=>`<div class="rc-card" data-contact-zone="${key}"><h3>${esc(label)}</h3><a class="rc-phone" href="tel:${contact.tel}">${contact.phone}</a><a class="rc-whatsapp" href="https://wa.me/${contact.wa}" rel="noopener noreferrer" aria-label="WhatsApp: ${esc(label)}">WhatsApp</a></div>`;
const panel=()=>`<section class="regional-contact" data-regional-contact="v1" aria-label="Contacto por zonas"><h2>Contacto por zonas</h2><div class="rc-grid">${card(SETTINGS.centralLabel,CENTRAL,'centro')}${card(SETTINGS.northLabel,NORTH,'norte')}</div></section>`;
const footerRE=/<footer\b[^>]*>[\s\S]*?<\/footer>/gi;
const css=`/* Scoped to the regional footer only. */
footer .regional-contact{box-sizing:border-box;max-width:1120px;width:calc(100% - 32px);margin:0 auto 24px;padding:24px 0;color:#fff;font-family:inherit}
footer .regional-contact h2{font-size:20px;line-height:1.3;color:#fff;margin:0 0 16px;font-weight:700;letter-spacing:0}
footer .regional-contact .rc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
footer .regional-contact .rc-card{min-width:0;border:1px solid #65717a;border-radius:12px;padding:18px;display:flex;align-items:flex-start;flex-direction:column;gap:12px;background:rgba(255,255,255,.035)}
footer .regional-contact h3{font-size:16px;line-height:1.4;color:#fff;margin:0;font-weight:600;letter-spacing:0}
footer .regional-contact a.rc-phone{display:inline-block;font-size:25px;font-weight:800;line-height:1.25;color:#fff;white-space:nowrap;text-decoration:none;margin:0;padding:0;background:none}
footer .regional-contact a.rc-whatsapp{display:inline-flex;min-height:44px;box-sizing:border-box;align-items:center;justify-content:center;padding:10px 18px;border-radius:7px;background:#087c42;color:#fff;font-size:15px;line-height:1.3;font-weight:700;text-decoration:none;margin:0}
footer .regional-contact a:focus-visible{outline:3px solid #ffda52;outline-offset:4px}
@media(max-width:600px){footer .regional-contact .rc-grid{grid-template-columns:minmax(0,1fr)}footer .regional-contact{width:calc(100% - 28px);padding:20px 0}footer .regional-contact a.rc-phone{font-size:24px}}
`;
const browser=`/* Only prepares the recipient. Never sends a message. */
(()=>{'use strict';
 const central=${JSON.stringify(SETTINGS.central)},north='34641589394',centre='34614789945';
 const fold=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').trim().toLowerCase();
 const forms=[...document.querySelectorAll('[data-quote-form],[data-whatsapp-form]')];
 function sync(form){
  const field=form.querySelector('[name="province"],[name="provincia"],[data-regional-province]');
  const selected=field?.value||form.dataset.province||document.body.dataset.contactProvince||'';
  const recipient=central.includes(fold(selected))?centre:north;
  if(form.hasAttribute('data-phone'))form.dataset.phone=recipient;
  if(form.hasAttribute('data-whatsapp'))form.dataset.whatsapp=recipient;
  for(const button of form.querySelectorAll('[data-whatsapp]'))button.dataset.whatsapp=recipient;
  if(field?.hasAttribute('data-regional-province'))form.dataset.province=field.value;
 }
 for(const form of forms){sync(form);form.addEventListener('input',()=>sync(form));form.addEventListener('change',()=>sync(form));form.addEventListener('submit',()=>sync(form),true);}
})();
`;
const assetHash=crypto.createHash('sha256').update(css+browser).digest('hex').slice(0,12);
const cssPath=`/assets/regional-contact.${assetHash}.css`,jsPath=`/assets/regional-contact.${assetHash}.js`;
const withoutFooter=html=>html.replace(footerRE,'');
function cleanFooter(footer){
 let clean=footer.replace(/<section\b[^>]*data-regional-contact="v1"[^>]*>[\s\S]*?<\/section>/g,'');
 clean=clean.replace(/<a\b(?=[^>]*\bhref=["'](?:tel:|https:\/\/wa\.me\/|https:\/\/api\.whatsapp\.com\/))[^>]*>[\s\S]*?<\/a>/gi,'');
 for(const old of [...oldValues,CENTRAL.phone,CENTRAL.tel,CENTRAL.wa,'614789945'])clean=clean.replaceAll(old,'');
 clean=clean.replace(/<div>\s*<strong>Contacto<\/strong>\s*<p>\s*<\/p>\s*<\/div>/g,'')
  .replace(/Contacto y legal/g,'Información legal').replace(/<p(?:\s+class="[^"]*")?>\s*<\/p>/g,'');
 return clean.replace(/(<footer\b[^>]*>)/i,'$1'+panel());
}
function addProvinceChoice(html){
 if(!SETTINGS.formProvinces)return html;
 return html.replace(/(<form\b[^>]*data-whatsapp-form[^>]*>)/g,(open)=>{
  if(/data-province="[^"]+"/.test(open))return open;
  return open+`<div class="field"><label for="regional-province">Provincia del servicio</label><select id="regional-province" name="province" data-regional-province required><option value="">Selecciona tu provincia</option>${SETTINGS.formProvinces.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select></div>`;
 });
}
export function transform(html,route){
 if(html.includes('data-regional-contact="v1"'))return html; // Idempotent output; audited separately.
 let result=region(route)?replacePhone(html):html;
 if(!/<footer\b/i.test(result))return result;
 result=result.replace(footerRE,cleanFooter);
 const contactProvince=region(route)||'';
 result=result.replace(/<body\b([^>]*)>/i,`<body$1 data-contact-province="${contactProvince}">`);
 result=result.replace('</head>',`<link rel="stylesheet" href="${cssPath}"><script src="${jsPath}" defer></script></head>`);
 result=addProvinceChoice(result);
 return result;
}
const matchAll=(html,re)=>[...html.matchAll(re)].map(m=>m[0]);
function invariant(before,after){
 for(const re of [/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,/<meta\b[^>]*name=["'](?:robots|googlebot)["'][^>]*>/gi,/<img\b[^>]*>/gi])assert.deepEqual(matchAll(after,re),matchAll(before,re),'Cambio no permitido en canonical, robots o fotografías');
 const localLinks=h=>[...h.matchAll(/\bhref=["']([^"']+)["']/g)].map(m=>m[1]).filter(v=>(v.startsWith('/')||v.startsWith('#'))&&!v.includes('/assets/regional-contact.')).sort();
 assert.deepEqual(localLinks(after),localLinks(before),'Se han modificado enlaces internos');
}
export function auditHtml(html,route,hasFooter=true){
 const contact=region(route)?CENTRAL:NORTH,external=withoutFooter(html);
 if(hasFooter){
  const footers=[...html.matchAll(footerRE)];assert.equal(footers.length,1,route+': pie único');
  const footer=footers[0][0];assert.equal((footer.match(/data-regional-contact="v1"/g)||[]).length,1,route+': falta pie regional');
  for(const [key,c,label] of [['centro',CENTRAL,SETTINGS.centralLabel],['norte',NORTH,SETTINGS.northLabel]]){
   const block=footer.match(new RegExp('<div class="rc-card" data-contact-zone="'+key+'">([\\s\\S]*?)</div>'))?.[1]||'';
   assert.ok(block.includes(esc(label))&&block.includes(c.phone)&&block.includes('href="tel:'+c.tel+'"')&&block.includes('href="https://wa.me/'+c.wa+'"'),route+': contacto de pie incorrecto '+key);
  }
  assert.equal((footer.match(/href="tel:/g)||[]).length,2,route+': teléfono de pie duplicado');
  assert.equal((footer.match(/href="https:\/\/wa.me\//g)||[]).length,2,route+': WhatsApp de pie duplicado');
 }
 const calls=[...external.matchAll(/\bhref=["']tel:([^"']+)["']/g)].map(m=>m[1]);
 const wa=[...external.matchAll(/\bhref=["']https:\/\/wa\.me\/([^?"'/]+)/g)].map(m=>m[1]);
 for(const n of calls)assert.equal(n.replace(/\s/g,''),contact.tel,route+': llamada a otra zona');
 for(const n of wa)assert.equal(n,contact.wa,route+': WhatsApp a otra zona');
 for(const m of external.matchAll(/\bdata-(?:phone|whatsapp)="(\d{11})"/g))assert.equal(m[1],contact.wa,route+': formulario de otra zona');
 if(region(route)){for(const old of oldValues)assert.ok(!external.includes(old),route+': queda número antiguo fuera del pie');}
 else assert.ok(!external.includes(CENTRAL.tel)&&!external.includes(CENTRAL.phone),route+': contacto centro fuera de su zona');
 for(const m of external.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  const visit=value=>{if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){if(k==='telephone')assert.equal(String(v).replace(/\s/g,''),contact.tel,route+': teléfono schema');else visit(v);}};
  visit(JSON.parse(m[1]));
 }
 return {calls:calls.length,whatsapps:wa.length,central:!!region(route),footer:hasFooter};
}
function allFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?allFiles(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function routeOf(html,file,root){return html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]||'/'+path.relative(root,file).replace(/index\.html$/,'');}
export function build(){
 const root=SETTINGS.root,files=allFiles(root),unchanged=files.filter(f=>f.endsWith('.xml')||/\/(?:robots\.txt|_headers|_redirects)$/.test(f));
 const digests=new Map(unchanged.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
 const report={domain:SETTINGS.domain,checkedAt:new Date().toISOString(),pages:[],centralCounts:{},ok:false};
 let hasContacts=false;
 for(const file of files.filter(f=>f.endsWith('.html'))){
  const before=fs.readFileSync(file,'utf8'),route=routeOf(before,file,root),hasFooter=/<footer\b/i.test(before),after=transform(before,route);
  invariant(before,after);const result=auditHtml(after,route,hasFooter);
  if(after!==before)fs.writeFileSync(file,after);
  if(hasFooter)hasContacts=true;
  if(region(route))report.centralCounts[region(route)]=(report.centralCounts[region(route)]||0)+1;
  report.pages.push({url:new URL(route,SETTINGS.domain).href,file:path.relative(root,file),...result});
 }
 assert.ok(hasContacts,'No se ha encontrado ningún pie de página');
 for(const [province,count] of Object.entries(SETTINGS.expected))assert.equal(report.centralCounts[province],count,'Inventario central incompleto: '+province);
 for(const [file,digest] of digests)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),digest,'Cambió un archivo de rastreo: '+file);
 fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.writeFileSync(root+cssPath,css);fs.writeFileSync(root+jsPath,browser);
 report.ok=true;report.css=cssPath;report.js=jsPath;
 fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/regional-contact-build.json',JSON.stringify(report,null,2));
 console.log('CONTACTOS REGIONALES OK:',JSON.stringify({pages:report.pages.length,central:report.centralCounts,footerPages:report.pages.filter(p=>p.footer).length}));
 return report;
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function read(url){const response=await fetch(url,{headers:{'User-Agent':'Regional-Contact-Verification','Cache-Control':'no-cache'},signal:AbortSignal.timeout(20000)});assert.equal(response.status,200,'HTTP '+response.status+' '+url);return {response,text:await response.text()};}
async function live(){
 const built=JSON.parse(fs.readFileSync('.cache/regional-contact-build.json','utf8'));
 const rows=built.pages.filter(p=>p.footer&&!/(^|\/)404\.html$/.test(p.file));
 const selected=rows.filter(p=>p.central||new URL(p.url).pathname.split('/').filter(Boolean).length<=1||/\/zonas\/[^/]+\/$/.test(p.url));
 // One northern municipality per provincial directory, in addition to all central pages and hubs.
 const groups=new Set();for(const p of rows.filter(p=>!p.central)){const parts=new URL(p.url).pathname.split('/').filter(Boolean),key=parts[0]==='electricista'?parts[1]:parts[0];if(parts.length>=2&&!groups.has(key)){groups.add(key);selected.push(p);}}
 const pages=[...new Map(selected.map(p=>[p.url,p])).values()],report={domain:SETTINGS.domain,commit:process.env.GITHUB_SHA||null,scope:'Todas las páginas centrales y controles de portada, provincias, legales y municipios norte. Solo lectura.',pages:[],ok:false};
 try{
  let ready=false;const home=new URL('/',SETTINGS.domain).href;
  for(let n=0;n<24;n++){try{const {text}=await read(home);auditHtml(text,home);assert.ok(text.includes(cssPath));ready=true;break;}catch(e){console.log('Esperando publicación regional:',n+1,e.message);}if(n<23)await pause(10000);}
  assert.ok(ready,'No se ha confirmado la nueva publicación');
  let i=0;await Promise.all(Array.from({length:4},async()=>{while(i<pages.length){const p=pages[i++];let error;for(let retry=0;retry<3;retry++){try{const {response,text}=await read(p.url);const result=auditHtml(text,p.url,p.footer);assert.equal(response.url,p.url,'Redirección inesperada del canonical');assert.ok(text.includes(cssPath)&&text.includes(jsPath),'Faltan assets regionales');const canonical=text.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];assert.equal(canonical,p.url,'Canonical cambiado');if(p.central){assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag')||''));assert.ok(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(text));}report.pages.push({url:p.url,status:response.status,...result,ok:true});error=null;break;}catch(e){error=e;if(retry<2)await pause(1200);}}if(error)report.pages.push({url:p.url,ok:false,error:error.message});}}));
  for(const [asset,wanted] of [[cssPath,css],[jsPath,browser]]){const {text}=await read(SETTINGS.domain+asset);assert.equal(text,wanted,'Asset regional publicado diferente');}
  assert.ok(report.pages.every(p=>p.ok),'Hay páginas publicadas pendientes o incorrectas');report.ok=true;
  console.log('CONTACTOS PUBLICADOS OK:',report.pages.length,'páginas verificadas');
 }catch(e){report.error=e.message;process.exitCode=1;console.error(e.message);}
 report.checkedAt=new Date().toISOString();report.pages.sort((a,b)=>a.url.localeCompare(b.url));fs.writeFileSync('.cache/regional-contact-live.json',JSON.stringify(report,null,2));
}
function selfTest(){
 for(const [route,central] of [['/madrid/',true],['/madrid/carabanchel/',true],['/electricista/madrid/ajalvir/',true],['/electricista-madrid/usera/',true],['/zonas/madrid/',true],['/burgos/madrid/',false],['/guadalajara/',SETTINGS.central.includes('guadalajara')],['/',false]])assert.equal(!!region(route),central);
 const make=route=>`<!doctype html><html><head><link rel="canonical" href="https://audit.invalid${route}"><meta name="robots" content="noindex,follow"><title>Servicio 641 589 394</title><script type="application/ld+json">{"telephone":"+34641589394"}</script></head><body><main><img src="a.jpg" alt="Original"><a href="/burgos/">Burgos</a><a href="tel:+34641589394">641 589 394</a><a href="https://wa.me/34641589394?text=Hola">WhatsApp</a></main><footer><a href="tel:+34641589394">641 589 394</a><a href="/cookies/">Cookies</a></footer></body></html>`;
 for(const route of ['/madrid/','/burgos/','/','/toledo/']){const before=make(route),after=transform(before,route);invariant(before,after);auditHtml(after,route);assert.equal(transform(after,route),after);assert.throws(()=>auditHtml(after.replace('href="tel:'+CENTRAL.tel+'"','href="tel:+34999999999"'),route));}
 assert.equal(replacePhone('641 58 93 94 +34641589394 34641589394'),`${CENTRAL.phone} ${CENTRAL.tel} ${CENTRAL.wa}`);
 console.log('PRUEBAS REGIONALES OK: aislamiento, pie, destinatarios, schema, robots, imágenes e idempotencia');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){if(process.argv.includes('--self-test'))selfTest();else if(process.argv.includes('--live'))await live();else {selfTest();build();}}
