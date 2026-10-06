"""Regression checks for municipal content, mobile contacts and home links. No messages sent."""
import functools
import http.server
import json
import os
import threading
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'reports'
REPORTS.mkdir(exist_ok=True)
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT / 'dist')))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
results = []
engines = ['chromium'] + (['webkit'] if os.environ.get('TEST_WEBKIT') == '1' else [])
try:
    with sync_playwright() as playwright:
        for engine in engines:
            launch_args = {'headless': True}
            if engine == 'chromium' and os.environ.get('CHROMIUM_PATH'):
                launch_args['executable_path'] = os.environ['CHROMIUM_PATH']
            browser = getattr(playwright, engine).launch(**launch_args)
            context = browser.new_context(reduced_motion='reduce')
            # The towns have no external images. Home images are excluded from this layout regression.
            context.route('https://images.pexels.com/**', lambda route: route.abort())
            for width in [320, 375, 390, 430, 650, 768, 1440]:
                page = context.new_page()
                page.set_viewport_size({'width':width, 'height':844})
                errors = []
                page.on('pageerror', lambda err: errors.append(str(err)))
                page.goto(base+'/electricista/vizcaya/durango/', wait_until='domcontentloaded')
                page.wait_for_timeout(150)
                assert page.locator('.local-service').count() == 9
                assert page.locator('.local-service-detail').count() == 9
                assert page.locator('.local-faq details').count() == 7
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), (engine,width,'overflow')
                buttons=page.locator('.service-hero .actions')
                assert buttons.is_visible() == (width > 650), (engine,width,'duplicate hero contact')
                assert page.locator('.contact-dock').is_visible() == (width <= 650)
                assert not page.locator('header .call').is_visible() if width <= 650 else True
                heights=page.locator('.local-service').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)')
                assert max(heights) < 360, (engine,width,heights)
                title_width=page.locator('.local-service h3').first.evaluate('(e)=>e.getBoundingClientRect().width')
                assert title_width > 180, (engine,width,title_width)
                first=page.locator('.local-service-detail').first
                first.locator('summary').click()
                assert first.get_attribute('open') is not None
                assert first.locator('p').first.is_visible()
                first.locator('summary').click()
                if width in [320,390,1440]:
                    page.evaluate('scrollTo(0,0)')
                    page.wait_for_timeout(150)
                    page.screenshot(path=str(REPORTS/f'local-{engine}-{width}.png'), full_page=False)
                    page.locator('#servicios-locales').scroll_into_view_if_needed()
                    page.wait_for_timeout(150)
                    page.screenshot(path=str(REPORTS/f'services-{engine}-{width}.png'), full_page=False)
                # Inspect generated URL instead of navigating to WhatsApp.
                page.evaluate('() => {window.__opened=[];window.open=(url)=>{window.__opened.push(url);return null;};}')
                form=page.locator('[data-whatsapp-form]')
                form.locator('[name=problem]').select_option(label='Diferencial que salta o no sube')
                form.locator('[name=name]').fill('Prueba')
                form.locator('[name=message]').fill('Salta al encender el termo.')
                form.locator('button').click()
                opened=page.evaluate('window.__opened')
                assert len(opened)==1, (engine,width,'form did not prepare message')
                url=urlparse(opened[0]); text=parse_qs(url.query)['text'][0]
                assert url.hostname=='wa.me' and url.path=='/34641589394'
                assert 'Estoy en Durango.' in text and 'Salta al encender el termo.' in text
                assert not errors, (engine,width,errors)
                results.append({'engine':engine,'width':width,'town':'Durango','services':9,'form':'verified without sending','maxCardHeight':round(max(heights),1)})
                page.close()
            # Home -> municipality, including accented names and direct destination.
            page=context.new_page()
            page.set_viewport_size({'width':390,'height':844})
            page.goto(base,wait_until='domcontentloaded')
            link=page.locator('.town-chip',has_text='Durango')
            assert link.get_attribute('href')=='/electricista/vizcaya/durango/'
            link.click()
            assert page.url.endswith('/electricista/vizcaya/durango/')
            assert page.locator('h1').inner_text()=='Electricista 24 horas en Durango'
            for route in ['/zonas/alava/','/zonas/madrid/','/electricista/alava/agurain-salvatierra/','/electricista/guipuzcoa/arrasate-mondragon/','/electricista/madrid/san-sebastian-de-los-reyes/','/electricista/cantabria/castro-urdiales/']:
                page.goto(base+route,wait_until='domcontentloaded')
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), route
                assert not page.locator('.service-hero .actions').is_visible(), route
            page.close()
            nojs=browser.new_context(java_script_enabled=False,reduced_motion='reduce',viewport={'width':390,'height':844})
            page=nojs.new_page()
            page.goto(base+'/electricista/vizcaya/durango/',wait_until='domcontentloaded')
            first=page.locator('.local-service-detail').first
            first.locator('summary').click()
            assert first.locator('p').first.is_visible()
            page.locator('.mobile-menu summary').click()
            assert page.locator('.mobile-menu-panel').is_visible()
            nojs.close(); context.close(); browser.close()
finally:
    server.shutdown()
(REPORTS/'local-browser.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(f'BROWSER LOCAL OK: {len(results)} viewport/engine combinations + home links + bilingual names + no-JS details; no WhatsApp messages sent')
