from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
c=json.loads((root/'dist/coverage-manifest.json').read_text())
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
try:
 with sync_playwright() as p:
  for engine in ['chromium','webkit']:
   browser=getattr(p,engine).launch()
   for width in [320,390,768,1440]:
    page=browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
    page.route('https://images.pexels.com/**',lambda route:route.abort())
    for province in ['madrid','vizcaya']:
     row=next(a for a in c['assignments'] if a['provinceSlug']==province and a['original']!=a['destination'])
     page.goto(base+'/',wait_until='domcontentloaded')
     field=page.locator('[data-coverage-search] input');field.fill(row['name'])
     link=page.locator('[data-coverage-results] a').filter(has_text=row['name']+', '+row['province']).first
     link.wait_for();assert link.get_attribute('href')==row['url'];link.click()
     page.locator('#cobertura-'+row['code']).wait_for()
     page.wait_for_function('(name)=>document.querySelector(\'[data-whatsapp-form] input[name="town"]\').value===name',arg=row['name'])
     assert 'Electricista urgente 24 horas en' in page.locator('h1').inner_text()
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.close()
   browser.close()
 print('NAVEGADORES OK: búsqueda, pueblo agrupado, formulario y anchuras 320/390/768/1440; Chromium y WebKit.')
finally:server.shutdown()
