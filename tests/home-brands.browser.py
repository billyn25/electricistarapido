"""Check actual logos, accessible links and responsive layout; never follow contact links."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from time import monotonic
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'reports'
REPORTS.mkdir(exist_ok=True)
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT / 'dist')))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width, javascript in [(320, True), (390, True), (768, True), (1440, True), (390, False)]:
            context = browser.new_context(viewport={'width': width, 'height': 960}, java_script_enabled=javascript)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda err: errors.append(str(err)))
            page.goto(base + '/#marcas-electricas', wait_until='domcontentloaded')
            section = page.locator('#marcas-electricas')
            section.evaluate("node => node.scrollIntoView({behavior: 'instant', block: 'center'})")
            images = section.locator('img')
            assert images.count() == 5
            for image in images.all():
                image.evaluate("node => node.scrollIntoView({behavior: 'instant', block: 'center'})")
                image.evaluate("img => img.loading = 'eager'")
            # Poll from Python: Playwright's RAF-based stability checks do not run
            # reliably in a page with JavaScript disabled. Keep the same image assertions.
            deadline = monotonic() + 40
            while not page.evaluate("[...document.querySelectorAll('#marcas-electricas img')].every(img => img.complete && img.naturalWidth > 10 && img.naturalHeight > 10)"):
                assert monotonic() < deadline, 'One or more manufacturer logos did not load'
                page.wait_for_timeout(100)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'Overflow at {width}'
            assert section.locator('a.er-brand-card').count() == 5
            for card in section.locator('a.er-brand-card').all():
                rect = card.bounding_box()
                assert rect['width'] >= 44 and rect['height'] >= 44
                assert rect['x'] >= -1 and rect['x'] + rect['width'] <= width + 1
                assert card.get_attribute('href').startswith('/servicios/reparacion-cuadros-electricos/#caso-')
            assert page.locator('h1').count() == 1
            assert not errors, errors
            if width in [390, 1440] and javascript:
                section.screenshot(path=str(REPORTS / f'home-brands-{width}.png'))
            results.append({'width': width, 'javascript': javascript, 'logosLoaded': 5, 'overflow': False, 'ok': True})
            context.close()
        browser.close()
finally:
    server.shutdown()
    (REPORTS / 'home-brands-browser.json').write_text(json.dumps(results, indent=2))
print(f'HOME BRANDS BROWSER OK: {len(results)} escenarios, cinco logos cargados.')
