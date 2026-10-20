import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {faultScenarios} from '../content/fault-scenarios.mjs';
import {selectScenarios} from '../scripts/fault-scenarios.mjs';
test('every scenario links to a real guide anchor and all ten guides have examples',()=>{
 assert.equal(new Set(faultScenarios.map(s=>s.id)).size,faultScenarios.length);
 assert.equal(new Set(faultScenarios.map(s=>s.service)).size,10);
 for(const s of faultScenarios){const html=fs.readFileSync(`dist/servicios/${s.service}/index.html`,'utf8');assert(html.includes(`id="caso-${s.id}"`),s.id);}
});
test('local selection is stable, covers distinct services and varies with the route',()=>{
 const a=selectScenarios('/electricista/vizcaya/zalla/');assert.deepEqual(a,selectScenarios('/electricista/vizcaya/zalla/'));assert.equal(new Set(a.map(s=>s.service)).size,4);
 assert.notDeepEqual(a,selectScenarios('/electricista/madrid/madrid/'));
});
test('all municipalities and districts contain four examples with working local destinations',()=>{
 let towns=0,districts=0;function visit(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+d.name;if(d.isDirectory())visit(p);else if(d.name==='index.html'){const h=fs.readFileSync(p,'utf8');assert.equal([...h.matchAll(/data-fault-id=/g)].length,4,p);const ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,p);for(const m of h.matchAll(/href="#([^"]+)"/g))assert(ids.includes(m[1]),`${p} #${m[1]}`);if(dir.includes('electricista-madrid'))districts++;else towns++;}}}visit('dist/electricista');visit('dist/electricista-madrid');assert.equal(towns,533);assert.equal(districts,21);
});
