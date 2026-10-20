"""Footer containment and local brands on Chromium and iPhone's WebKit engine."""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path('dist').resolve()
REPORTS = Path('reports'); REPORTS.mkdir(exist_ok=True)
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}'
ROUTES = ['/', '/electricista/madrid/coslada/', '/electricista/vizcaya/bilbao/', '/electricista-madrid/latina/']
WIDTHS = [320, 360, 390, 430, 768, 1440]
results = []
try:
    with sync_playwright() as p:
        for engine in ['chromium', 'webkit']:
            browser = getattr(p, engine).launch()
            for width in WIDTHS:
                context = browser.new_context(viewport={'width': width, 'height': 900}, device_scale_factor=1)
                # New images must work without relying on a third-party server at page view time.
                context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
                for route in ROUTES:
                    page = context.new_page()
                    errors = []; page.on('pageerror', lambda error: errors.append(str(error)))
                    response = page.goto(BASE + route, wait_until='domcontentloaded')
                    assert response and response.ok, (engine, width, route)
                    footer = page.locator('.er-map'); footer.scroll_into_view_if_needed()
                    page.wait_for_timeout(60)
                    geometry = page.evaluate('''() => {
                      const box=document.querySelector('.er-map').getBoundingClientRect();
                      const links=[...document.querySelectorAll('.er-map-links>a')].map(a=>{
                       const r=a.getBoundingClientRect(); return {text:a.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom,height:r.height};
                      });
                      return {width:innerWidth,docWidth:document.documentElement.scrollWidth,box:{x:box.x,y:box.y,right:box.right,bottom:box.bottom},links};
                    }''')
                    assert geometry['docWidth'] <= width + 1, (engine,width,route,'horizontal overflow',geometry)
                    assert len(geometry['links']) == 5
                    for link in geometry['links']:
                        box = geometry['box']
                        assert link['x'] >= box['x'] and link['right'] <= box['right'] + 1, (engine,width,route,link)
                        assert link['y'] >= box['y'] and link['bottom'] <= box['bottom'] - 5, (engine,width,route,link,'outside map')
                        assert link['height'] >= 43, (engine,width,route,link,'touch target')
                    if route != '/':
                        block = page.locator('#material-electrico-local')
                        block.scroll_into_view_if_needed()
                        assert block.locator('.er-material-logo').count() == 2
                        assert block.locator('.er-materials-photo').count() == 1
                        for image in block.locator('img').all():
                            image.scroll_into_view_if_needed()
                            image.evaluate('(e)=>e.decode()')
                            assert image.evaluate('(e)=>e.complete && e.naturalWidth>0')
                        block.locator('summary').first.click()
                        assert page.evaluate('document.documentElement.scrollWidth') <= width + 1
                        block.locator('summary').first.click()
                        if width in [390,1440] and route in ['/electricista/madrid/coslada/','/electricista-madrid/latina/']:
                            tag = 'coslada' if 'coslada' in route else 'latina'
                            block.screenshot(path=str(REPORTS/f'materiales-{tag}-{engine}-{width}.png'))
                    if width in [320,390,1440] and route == '/':
                        footer.screenshot(path=str(REPORTS/f'footer-corregido-{engine}-{width}.png'))
                    assert not errors, (engine,width,route,errors)
                    results.append({'browser':engine,'width':width,'route':route,'footerContained':True,'horizontalOverflow':False})
                    page.close()
                context.close()
            # Server-rendered content remains accessible without site JavaScript.
            context = browser.new_context(viewport={'width':390,'height':900},java_script_enabled=False)
            page = context.new_page(); page.goto(BASE+'/electricista-madrid/latina/',wait_until='domcontentloaded')
            assert page.locator('#material-electrico-local .er-material-card').count() == 2
            context.close(); browser.close()
finally:
    server.shutdown()
(REPORTS/'local-materials-browser.json').write_text(json.dumps({'checks':len(results),'results':results,'javascriptDisabled':True},ensure_ascii=False,indent=2))
print(f'LOCAL MATERIALS BROWSER OK: {len(results)} escenarios; Chromium y WebKit, 320–1440 px.')
