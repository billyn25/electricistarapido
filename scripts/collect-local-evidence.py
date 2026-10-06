"""Download public IGN reference files for editorial review; never changes the website."""
from pathlib import Path
from urllib.request import Request, urlopen
import hashlib
import json
import re

OUT = Path('evidence')
OUT.mkdir(exist_ok=True)
ROOT = 'https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/'
FILES = ['IGN_INFOGEO_MUNICIPIOS.xlsx', 'IGN_INFOGEO_MUNICIPIOS_ES-PV.html', 'IGN_INFOGEO_MUNICIPIOS_ES-CB.html', 'IGN_INFOGEO_MUNICIPIOS_ES-MD.html']
results = []
for name in FILES:
    url = ROOT + name
    try:
        with urlopen(Request(url, headers={'User-Agent': 'ElectricistaRapido-reference-review/1.0'}), timeout=40) as response:
            data = response.read(15000001)
        if len(data) > 15000000:
            raise ValueError('Reference exceeds size limit')
        (OUT / name).write_bytes(data)
        results.append({'url': url, 'file': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        if name.endswith('.html'):
            text = data.decode('utf-8', errors='replace')
            print(name, re.findall(r'<script[^>]*src=[\"\x27]([^\"\x27]+)', text))
        print('OK', name, len(data))
    except Exception as exc:
        results.append({'url': url, 'error': str(exc)})
        print('SOURCE ERROR', name, str(exc))
(OUT / 'provenance.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
