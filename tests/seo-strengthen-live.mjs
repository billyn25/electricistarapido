/** Read-only verification of all public canonical URLs; no calls or messages. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {inventory,VERSION,CSS_PATH} from '../scripts/seo-strengthen.mjs';
import {auditHtml} from '../scripts/regional-contact.mjs';
const origin='https://electricistarapido.com';
const {pages}=inventory('dist');
const report={origin,commit:process.env.GITHUB_SHA||null,version:VERSION,pages:[],ok:false};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function read(route){const r=await fetch(origin+route,{redirect:'manual',signal:AbortSignal.timeout(18000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,route+': HTTP '+r.status);return {r,html:await r.text()};}
try{
 let ready=false;
 for(let i=0;i<30;i++){try{const {html}=await read('/electricista/vizcaya/bilbao/');assert(html.includes('data-er-seo="'+VERSION+'"'));assert(html.includes(CSS_PATH));ready=true;break;}catch(e){report.lastObservation=e.message;if(i<29)await wait(8000);}}
 assert(ready,'No se ha confirmado la publicación nueva');
 let next=0;
 await Promise.all(Array.from({length:4},async()=>{while(next<pages.length){const p=pages[next++];let last;
  for(let retry=0;retry<3;retry++){try{
   const {r,html}=await read(p.route);auditHtml(html,p.route);
   for(const re of [/<title>[\s\S]*?<\/title>/,/<meta name="description"[^>]*>/,/<meta name="robots"[^>]*>/,/<link rel="canonical"[^>]*>/,/<main\b[^>]*>[\s\S]*?<\/main>/])assert.equal(html.match(re)?.[0],p.html.match(re)?.[0],p.route+': contenido publicado distinto');
   if(p.type!=='other'){assert(html.includes(CSS_PATH));assert(!/noindex/i.test(r.headers.get('x-robots-tag')||''));}
   report.pages.push({url:origin+p.route,type:p.type,status:r.status,contentMatchesBuild:true,contactsCorrect:true,ok:true});last=null;break;
  }catch(e){last=e;if(retry<2)await wait(1000);}}
  if(last)report.pages.push({url:origin+p.route,ok:false,error:last.message});
 }}));
 for(const file of ['sitemap.xml',...fs.readdirSync('dist/sitemaps').map(f=>'sitemaps/'+f)]){const {html}=await read('/'+file);assert.equal(html,fs.readFileSync('dist/'+file,'utf8'),'Sitemap distinto '+file);}
 const {html:css}=await read(CSS_PATH);assert.equal(css,fs.readFileSync('dist'+CSS_PATH,'utf8'));
 assert.equal(report.pages.length,573);assert(report.pages.every(x=>x.ok),'Hay páginas pendientes o incorrectas');report.ok=true;
 console.log('PUBLICACIÓN SEO OK: 573 URLs; contenido, contactos y sitemaps contrastados.');
}catch(e){report.error=e.message;process.exitCode=1;console.error(e);}
finally{report.checkedAt=new Date().toISOString();report.pages.sort((a,b)=>a.url.localeCompare(b.url));fs.mkdirSync('reports/seo',{recursive:true});fs.writeFileSync('reports/seo/publication.json',JSON.stringify(report,null,2));}
