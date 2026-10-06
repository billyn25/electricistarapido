"""All-town regressions adapted from the six-link layout to nine service blocks.
Preserves coverage of every town, province and eight widths; never sends messages.
Detailed form/no-JS/WebKit checks are in browser-local.py.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
REPORTS=ROOT/'reports'
REPORTS.mkdir(exist_ok=True)
towns=sorted((DIST/'electricista').glob('*/*/index.html'))
provinces=sorted((DIST/'zonas').glob('*/index.html'))
assert len(towns)==101 and len(provinces)==5
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(DIST)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
def route(file): return '/'+file.parent.relative_to(DIST).as_posix()+'/'
checks=0
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        context=browser.new_context(reduced_motion='reduce')
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda err: errors.append(str(err)))
        samples=[max([t for t in towns if t.parent.parent.name==pr.parent.name],key=lambda t:len(t.parent.name)) for pr in provinces]
        for width in [320,375,390,430,650,768,1280,1440]:
            page.set_viewport_size({'width':width,'height':844})
            for file in samples+provinces+(towns if width==390 else []):
                url=route(file)
                response=page.goto(base+url,wait_until='domcontentloaded')
                assert response.status==200,url
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),(url,width)
                assert page.locator('h1').count()==1,url
                assert '641 58 93 94' in page.title(),url
                assert page.locator('link[rel=canonical]').get_attribute('href')=='https://electricistarapido.com'+url
                assert page.locator('.service-hero .actions').is_visible()==(width>650),(url,width)
                assert page.locator('.contact-dock').is_visible()==(width<=650),(url,width)
                if '/electricista/' in url:
                    assert page.locator('.local-service').count()==9,url
                    assert page.locator('.local-faq details').count()==5,url
                    assert page.locator('.local-service h3').first.evaluate('(e)=>e.getBoundingClientRect().width')>180,(url,width)
                checks+=1
        assert not errors,errors
        context.close();browser.close()
finally:
    server.shutdown()
(REPORTS/'all-local-pages.json').write_text(json.dumps({'routes_checked':checks,'towns':len(towns),'provinces':len(provinces),'widths':8,'browser':'chromium'}))
print(f'ALL LOCAL PAGES OK: {checks} route/viewport checks; 101 towns; 5 provinces; 8 widths')
