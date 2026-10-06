import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../public/mobile-contact.js',import.meta.url),'utf8');
function setup({mobile=true,primaryBottom=400,alternativeTop=2000,focused=false,missing=false}={}){
 const events={},frames=[];
 const media={matches:mobile,addEventListener:(name,fn)=>events.media=fn};
 const bar={hidden:true,contains:()=>focused,addEventListener:(name,fn)=>events[name]=fn};
 const primary={getBoundingClientRect:()=>({bottom:primaryBottom})};
 const alternative={getBoundingClientRect:()=>({width:300,height:60,top:alternativeTop,bottom:alternativeTop+60})};
 const document={activeElement:null,documentElement:{dataset:{}},querySelector:s=>s==='.mobile-bar'?bar:s==='header'?{getBoundingClientRect:()=>({bottom:96})}:missing?null:primary,querySelectorAll:()=>[primary,alternative]};
 const window={innerHeight:844,matchMedia:()=>media,addEventListener:(name,fn)=>events[name]=fn,requestAnimationFrame:fn=>frames.push(fn)};
 vm.runInNewContext(code,{window,document});
 return {bar,media,document,events,frames,move:n=>{primaryBottom=n;events.scroll();while(frames.length)frames.shift()();},alternative:n=>{alternativeTop=n;events.scroll();while(frames.length)frames.shift()();}};
}
test('bar hidden at entry and while main contact buttons remain visible',()=>{const x=setup();assert.equal(x.bar.hidden,true);x.move(97);assert.equal(x.bar.hidden,true);});
test('bar appears only after primary contact passes sticky header, hides on return',()=>{const x=setup();x.move(90);assert.equal(x.bar.hidden,false);x.move(400);assert.equal(x.bar.hidden,true);});
test('desktop never displays fixed bar',()=>{const x=setup({mobile:false,primaryBottom:-500});assert.equal(x.bar.hidden,true);});
test('secondary visible contact avoids duplication; bar returns afterwards',()=>{const x=setup({primaryBottom:90});x.alternative(350);assert.equal(x.bar.hidden,true);x.alternative(-100);assert.equal(x.bar.hidden,false);});
test('initial restored scroll uses current geometry',()=>{const x=setup({primaryBottom:-80});assert.equal(x.bar.hidden,false);assert.equal(x.document.documentElement.dataset.mobileContactReady,'1');});
test('scroll callbacks coalesce into one frame',()=>{const x=setup();for(let i=0;i<20;i++)x.events.scroll();assert.equal(x.frames.length,1);});
test('missing primary leaves safe hidden fallback',()=>{assert.equal(setup({missing:true}).bar.hidden,true);});
test('all generated routes keep one hidden bar and real contact links',()=>{
 const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
 const files=walk('dist').filter(f=>f.endsWith('.html'));assert.equal(files.length,11);
 for(const f of files){const h=fs.readFileSync(f,'utf8');assert.equal((h.match(/class="mobile-bar"/g)||[]).length,1);assert.ok(h.includes('class="mobile-bar" hidden'));assert.ok(h.includes('/mobile-contact.js?v=1'));assert.ok(h.includes('/mobile-contact.css?v=1'));assert.ok(h.includes('tel:+34641589394'));assert.ok(h.includes('https://wa.me/34641589394'));}
});
