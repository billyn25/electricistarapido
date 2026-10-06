/** Verified municipal identity and navigable geographic context. No synonym spinning. */
import { geographicRows, geoSources } from '../content/local-geography.mjs';
import { allMunicipalities, municipalitySource } from '../content/all-municipalities.mjs';
export const normalizePlace = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const areas = {vizcaya:'48',alava:'01',guipuzcoa:'20',madrid:'28',cantabria:'39'};
const byRoute = new Map();
const ids = new Set();
for (const [provinceSlug,slug,code,officialName,capital,longitude,latitude] of geographicRows) {
  const route = `/electricista/${provinceSlug}/${slug}/`;
  if (!areas[provinceSlug] || !/^[0-9]{5}$/.test(code) || !code.startsWith(areas[provinceSlug]) || ids.has(code) || byRoute.has(route) || !officialName || !capital || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 39 || latitude > 44 || longitude < -5 || longitude > -1) throw Error(`Invalid local evidence: ${route}`);
  ids.add(code);
  byRoute.set(route, Object.freeze({provinceSlug,route,code,officialName,capital,longitude,latitude,
    source:geoSources[provinceSlug] || geoSources.basque,
    mapUrl:`https://signa.ign.es/signa/?center=${longitude},${latitude}&level=14&basemap=basemap_3`}));
}
const slugify=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const catalogueByRoute=new Map(allMunicipalities.map(x=>[`/electricista/${x.provinceSlug}/${slugify(x.name)}/`,x]));
export function getLocalContext(record) {
  const facts = byRoute.get(record.route);
  if (facts && facts.provinceSlug === record.provinceSlug) return {...facts,enhanced:true};
  const basic=catalogueByRoute.get(record.route);
  if (!basic || basic.provinceSlug!==record.provinceSlug) throw Error(`Missing municipality context: ${record.route}`);
  return {provinceSlug:basic.provinceSlug,route:record.route,code:basic.code,officialName:basic.name,capital:basic.name,
    source:municipalitySource,mapUrl:null,enhanced:false};
}
// Haversine ranks IGN reference points only; it does not estimate roads or arrival times.
export function pointDistance(a,b) {
  const rad = x => x * Math.PI / 180;
  const dlat=rad(b.latitude-a.latitude), dlon=rad(b.longitude-a.longitude);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
}
export function nearbyTowns(record, records, limit=5) {
  const current=getLocalContext(record);
  const same=records.filter(r=>r.provinceSlug===record.provinceSlug && r.route!==record.route);
  if(current.enhanced && Number.isFinite(current.latitude)){
    const geo=same.filter(r=>{const g=getLocalContext(r);return g.enhanced&&Number.isFinite(g.latitude);})
      .map(r=>({...r,referenceDistance:pointDistance(current,getLocalContext(r))}))
      .sort((a,b)=>a.referenceDistance-b.referenceDistance || a.town.localeCompare(b.town,'es'));
    if(geo.length>=limit) return geo.slice(0,limit);
  }
  return same.sort((a,b)=>a.town.localeCompare(b.town,'es')).slice(0,limit).map(r=>({...r,referenceDistance:null}));
}
export function localIdentity(record) {
  const g=getLocalContext(record);
  if(!g.enhanced) return `Esta ficha corresponde al municipio de ${g.officialName}, en ${record.province}. Indica el barrio, núcleo o zona de la vivienda al solicitar la reparación; la disponibilidad y el desplazamiento se confirman para cada aviso.`;
  const different=normalizePlace(g.officialName)!==normalizePlace(g.capital);
  const name=normalizePlace(record.town)===normalizePlace(g.officialName) ? record.town : `${record.town} (${g.officialName})`;
  if(different) return `La ficha corresponde al municipio de ${name}, en ${record.province}. El IGN identifica ${g.capital} como su cabecera municipal. Al pedir asistencia, especifica si la dirección está en ${g.capital} o en otro núcleo o barrio del municipio.`;
  if(g.officialName.includes('/')) return `El municipio figura en el IGN como ${g.officialName}, en ${record.province}. Las denominaciones de esta ficha corresponden al mismo municipio; no hace falta abrir un aviso diferente por cada nombre. Añade el barrio o núcleo donde está la vivienda para concretar el desplazamiento.`;
  return `Esta ficha corresponde a ${name}, provincia de ${record.province}. Para situar el aviso puedes consultar la referencia municipal del IGN. Indica también el barrio o núcleo de la vivienda; el punto del mapa identifica el municipio, no una oficina ni la ubicación de un técnico.`;
}
export function contextQuestions(record, records) {
  const g=getLocalContext(record), near=nearbyTowns(record,records,2);
  return [
    [`¿Qué municipio corresponde a esta página?`, `Esta página corresponde a ${g.officialName}, en ${record.province}. Usa esta ficha si ese es el municipio de la dirección donde se necesita la reparación.`],
    [normalizePlace(g.capital)!==normalizePlace(g.officialName) ? `¿Qué indico si la vivienda no está en ${g.capital}?` : `¿Qué dato de ubicación añado al aviso de ${record.town}?`, normalizePlace(g.capital)!==normalizePlace(g.officialName) ? `El municipio es ${g.officialName} y su cabecera figura como ${g.capital}. Escribe el núcleo o barrio concreto en el formulario; no basta con indicar la cabecera si la vivienda se encuentra en otro lugar. La dirección completa se acuerda al confirmar la visita.` : `Además de ${record.town}, indica el barrio, núcleo o una referencia de acceso. No publiques la dirección completa en una valoración ni envíes fotografías que te obliguen a acercarte a una instalación dañada.`],
    [`¿Y si la avería está en ${near.map(t=>t.town).join(' o ')}?`, `Son otros municipios con página propia en el directorio de ${record.province}. Selecciona la localidad de la dirección real en los enlaces de esta página, en lugar de utilizar ${record.town} como referencia genérica. El desplazamiento se confirma para cada aviso.`],
    ['¿Urgencias 24 horas significa llegada inmediata?', 'La atención de urgencias es de 24 horas; la disponibilidad de desplazamiento y el momento de la visita se confirman al contactar. La cercanía geográfica de dos municipios no garantiza un tiempo de llegada.'],
    ['¿Qué condiciones conviene consultar antes de la visita?', 'Pregunta por desplazamiento, diagnóstico, mano de obra, materiales y posibles suplementos. El alcance se acuerda según la avería; enviar un formulario no equivale a reservar ni a aceptar un presupuesto cerrado.']
  ];
}
