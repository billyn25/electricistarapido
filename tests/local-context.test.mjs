import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { geographicRows } from '../content/local-geography.mjs';
import { getLocalContext, localIdentity, nearbyTowns, contextQuestions, pointDistance } from '../scripts/local-context.mjs';
import { townRecord } from '../scripts/local-pages.mjs';
import { localServices } from '../content/local-services.mjs';
const records=[];
for(const [province,slug] of geographicRows){
  const html=await fs.readFile(`dist/electricista/${province}/${slug}/index.html`,'utf8');
  records.push({...townRecord(html),html});
}
test('101 existing local pages have uniquely matched official municipality references',()=>{
  assert.equal(records.length,101);
  assert.equal(new Set(geographicRows.map(r=>r[2])).size,101);
  assert.deepEqual([...new Set(geographicRows.map(r=>r[0]))].sort(),['alava','cantabria','guipuzcoa','madrid','vizcaya']);
  for(const record of records){
    const g=getLocalContext(record);
    assert.ok(record.html.includes(`data-local-code="${g.code}"`));
    assert.ok(record.html.includes(g.capital));
    assert.match(g.source,/^https:\/\/www\.ign\.es\//);
    assert.ok(record.html.includes('Referencia geográfica, no una sede'));
  }
});
test('municipality, capital and bilingual names are not silently substituted',()=>{
  const find=slug=>records.find(r=>r.route.endsWith('/'+slug+'/'));
  assert.equal(getLocalContext(find('asparrena')).capital,'Araia');
  assert.equal(getLocalContext(find('camargo')).capital,'Muriedas');
  assert.equal(getLocalContext(find('getxo')).capital,'Algorta');
  assert.equal(getLocalContext(find('las-rozas')).officialName,'Las Rozas de Madrid');
  assert.match(localIdentity(find('arrasate-mondragon')),/mismo municipio/);
  assert.throws(()=>getLocalContext({provinceSlug:'madrid',route:'/electricista/madrid/no-revisado/'}),/Missing municipality/);
});
test('related links are ranked by geographic references, not alphabetically',()=>{
  for(const record of records){
    const near=nearbyTowns(record,records);
    assert.equal(near.length,5);
    assert.equal(new Set(near.map(r=>r.route)).size,5);
    for(let i=0;i<near.length;i++){
      assert.equal(near[i].provinceSlug,record.provinceSlug);
      assert.notEqual(near[i].route,record.route);
      assert.ok(record.html.includes(`href="${near[i].route}"`));
      assert.ok(near[i].referenceDistance>=0);
      if(i) assert.ok(near[i-1].referenceDistance<=near[i].referenceDistance);
    }
  }
  assert.equal(pointDistance({latitude:43,longitude:-2},{latitude:43,longitude:-2}),0);
});
test('municipal pages include useful technical detail and keep guides linked',()=>{
  for(const record of records){
    for(const service of localServices){
      assert.ok(record.html.includes(service.symptom));
      assert.ok(record.html.includes(service.review));
      assert.ok(record.html.includes(service.repair));
      assert.ok(record.html.includes(`/servicios/${service.slug}/`));
    }
    assert.equal(contextQuestions(record,records).length,5);
    assert.match(record.html,/data-province="[^"]+"/);
    assert.match(record.html,/id="wa-area" name="area"/);
    assert.match(record.html,/data-intake-service=/);
  }
});
test('technical guides retain their own useful service detail',async()=>{
  for(const service of localServices){
    const html=await fs.readFile(`dist/servicios/${service.slug}/index.html`,'utf8');
    assert.ok((html.match(/<article/g)||[]).length>=3);
    assert.match(html,/641 58 93 94/);
  }
});
