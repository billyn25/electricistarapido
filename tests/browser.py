"""Responsive regression checks. Does not click tel: or WhatsApp destinations."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
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
        for width, height in [(320, 700), (375, 812), (390, 844), (430, 932), (650, 900), (768, 1024), (1280, 900), (1440, 1000)]:
            context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=1, is_mobile=width <= 650, has_touch=width <= 650)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(base, wait_until='domcontentloaded')
            page.wait_for_function("document.querySelector('body').dataset.mobileLayout === '1'")
            page.wait_for_timeout(300)
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'Horizontal overflow at {width}'
            assert page.locator('h1').count() == 1
            assert '641 58 93 94' in page.title()
            if width <= 650:
                assert not page.locator('header .call').is_visible(), 'Header call still visible'
                assert not page.locator('.hero .actions').is_visible(), 'Duplicate hero actions'
                assert not page.locator('.hero-pills').is_visible(), 'Repeated pills'
                assert not page.locator('.hero .eyebrow').is_visible(), 'Repeated 24h eyebrow'
                assert page.locator('.contact-dock').is_visible()
                assert page.locator('.contact-dock a').count() == 2
                assert page.locator('.contact-call').get_attribute('href') == 'tel:+34641589394'
                assert page.locator('.contact-whatsapp').get_attribute('href') == 'https://wa.me/34641589394'
                photo = page.locator('.hero-media img').bounding_box()
                assert photo['y'] < height - 120, f'Photo still too far down: {photo}'
                assert page.locator('header').bounding_box()['height'] <= 115, 'Header too tall'
                for selector in ['.contact-dock a', '.mobile-menu summary']:
                    for element in page.locator(selector).all():
                        box = element.bounding_box()
                        assert box['width'] >= 44 and box['height'] >= 44, f'Target too small: {selector}'
                assert page.evaluate("[...document.querySelectorAll('.contact-dock a')].every(e => e.scrollWidth <= e.clientWidth + 1)")
                trigger = page.locator('.mobile-menu summary')
                trigger.click()
                assert page.locator('.mobile-menu').get_attribute('open') is not None
                page.keyboard.press('Escape')
                assert page.locator('.mobile-menu').get_attribute('open') is None
                trigger.click()
                page.locator('.mobile-menu-panel a[href="/#averias"]').click()
                assert page.locator('.mobile-menu').get_attribute('open') is None
                page.goto(base, wait_until='domcontentloaded')
                page.wait_for_timeout(500)
                page.screenshot(path=str(REPORTS / f'mobile-{width}.png'), full_page=False)
                for route in ['/servicios/diferencial-que-no-sube/', '/servicios/humedad-y-derivaciones/']:
                    page.goto(base + route, wait_until='domcontentloaded')
                    assert page.locator('.contact-dock').is_visible()
                    assert not page.locator('.service .actions').is_visible()
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'Overflow in {route}'
            else:
                assert not page.locator('.contact-dock').is_visible()
                assert not page.locator('.mobile-menu').is_visible()
                assert page.locator('header .call').is_visible()
                assert page.locator('.hero .actions').is_visible()
                if width >= 1280:
                    page.screenshot(path=str(REPORTS / f'desktop-{width}.png'), full_page=False)
            assert not errors, errors
            results.append({'width': width, 'height': height, 'status': 'pass'})
            context.close()
        context = browser.new_context(viewport={'width': 390, 'height': 844}, java_script_enabled=False, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.goto(base, wait_until='domcontentloaded')
        page.locator('.mobile-menu summary').click()
        assert page.locator('.mobile-menu-panel a').first.is_visible()
        assert page.locator('.contact-dock').is_visible()
        results.append({'javascript': False, 'status': 'pass'})
        context.close()
        browser.close()
finally:
    server.shutdown()
    (REPORTS / 'mobile-layout.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(f'BROWSER OK: {len(results)} escenarios, móvil y escritorio; sin llamadas externas de contacto.')
