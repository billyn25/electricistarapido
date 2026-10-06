"""Download public IGN reference data for editorial review; never changes the website."""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json

OUT = Path('evidence')
OUT.mkdir(exist_ok=True)
ROOT = 'https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/'
FILES = ['IGN_INFOGEO_MUNICIPIOS_ES-PV.json', 'IGN_INFOGEO_MUNICIPIOS_ES-CB.json', 'IGN_INFOGEO_MUNICIPIOS_ES-MD.json']
results = []
for name in FILES:
    url = ROOT + name
    with urlopen(Request(url, headers={'User-Agent': 'ElectricistaRapido-reference-review/1.0'}), timeout=40) as response:
        data = response.read(15000001)
    if len(data) > 15000000:
        raise ValueError('Reference exceeds size limit')
    parsed = json.loads(data)
    if not isinstance(parsed, list) or not parsed:
        raise ValueError('Empty or invalid geographic table')
    (OUT / name).write_bytes(data)
    results.append({'url': url, 'file': name, 'bytes': len(data), 'records': len(parsed), 'sha256': hashlib.sha256(data).hexdigest()})
    print(name, 'records:', len(parsed), 'sample:', json.dumps(parsed[0], ensure_ascii=False))
(OUT / 'provenance.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
