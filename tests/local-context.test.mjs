import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { geographicRows } from '../content/local-geography.mjs';
import { allMunicipalities } from '../content/all-municipalities.mjs';
import { municipalityNavigationPoints } from '../content/municipality-navigation.mjs';
import { getLocalContext, localIdentity, nearbyTowns, contextQuestions, pointDistance, navigationPointIndex } from '../scripts/local-context.mjs';
import { townRecord } from '../scripts/local-pages.mjs';
import { localServices } from '../content/local-services.mjs';
const allRecords=await Promise.all((await fs.readdir('dist/electricista',{recursive:true}))
  .filter(file=>file.endsWith('/index.html'))
  .map(async file=>{
    const html=await fs.readFile(`dist/electricista/${file}`,'utf8');
    return {...townRecord(html),html};
  }));
const records=allRecords.filter(record=>getLocalContext(record).enhanced);
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
  const lasRozas=find('las-rozas-de-madrid');
  assert.equal(getLocalContext(find('asparrena')).capital,'Araia');
  assert.equal(getLocalContext(find('camargo')).capital,'Muriedas');
  assert.equal(getLocalContext(find('getxo')).capital,'Algorta');
  assert.equal(getLocalContext(lasRozas).officialName,'Las Rozas de Madrid');
  assert.match(localIdentity(find('arrasate-mondragon')),/mismo municipio/);
  assert.throws(()=>getLocalContext({provinceSlug:'madrid',route:'/electricista/madrid/no-revisado/'}),/Missing municipality/);
});
test('every catalogue municipality has a validated navigation point and incomplete data fails safely',()=>{
  assert.equal(allRecords.length,allMunicipalities.length);
  assert.deepEqual(municipalityNavigationPoints.map(r=>r[0]).sort(),allMunicipalities.map(r=>r.code).sort());
  assert.equal(navigationPointIndex(municipalityNavigationPoints).size,allMunicipalities.length);
  assert.throws(()=>navigationPointIndex(municipalityNavigationPoints.filter(r=>r[0]!=='28130')),/Missing municipal navigation point: 28130/);
  assert.throws(()=>navigationPointIndex([...municipalityNavigationPoints,municipalityNavigationPoints[0]]),/Invalid municipal navigation point/);
  assert.throws(()=>navigationPointIndex(municipalityNavigationPoints.map(r=>r[0]==='28130'?[r[0],NaN,r[2]]:r)),/Invalid municipal navigation point: 28130/);
});
test('Coslada and San Fernando link to each other without extending editorial claims',()=>{
  const find=slug=>allRecords.find(r=>r.route.endsWith('/'+slug+'/'));
  const coslada=find('coslada'),sanFernando=find('san-fernando-de-henares');
  assert.ok(nearbyTowns(coslada,allRecords).some(r=>r.route===sanFernando.route));
  assert.ok(nearbyTowns(sanFernando,allRecords).some(r=>r.route===coslada.route));
  assert.equal(getLocalContext(sanFernando).enhanced,false);
  assert.equal(getLocalContext(sanFernando).mapUrl,null);
  assert.throws(()=>nearbyTowns({provinceSlug:'madrid',route:'/electricista/madrid/no-revisado/'},allRecords),/Missing municipality navigation context/);
});
test('all related links use geographic references, without self-links or other provinces',()=>{
  for(const record of allRecords){
    const near=nearbyTowns(record,allRecords);
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
