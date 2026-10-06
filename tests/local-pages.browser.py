"""Local-page regressions in Chromium and WebKit; never sends calls/messages.

Checks every generated municipality, plus responsive samples in all provinces.
Uses geometry, not just element existence, to catch narrow-column regressions.
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
REPORTS = ROOT / 'reports'
REPORTS.mkdir(exist_ok=True)
WIDTHS = [320, 375, 390, 430, 650, 768, 1280, 1440]
TOWN_FILES = sorted((DIST / 'electricista').glob('*/*/index.html'))
PROVINCE_FILES = sorted((DIST / 'zonas').glob('*/index.html'))
assert len(TOWN_FILES) >= 101, 'Missing the municipal build'
assert len(PROVINCE_FILES) == 5, 'Unexpected province scope'

def route(file):
    return '/' + file.parent.relative_to(DIST).as_posix() + '/'

SAMPLES = []
for province in PROVINCE_FILES:
    choices = [f for f in TOWN_FILES if f.parent.parent.name == province.parent.name]
    assert choices, province
    SAMPLES.append(route(max(choices, key=lambda f: len(f.parent.name))))

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(DIST)))
Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
results = []


def check_local(page, url, width):
    response = page.goto(base + url, wait_until='domcontentloaded')
    assert response.status == 200, url
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), (url, width, 'overflow')
    assert page.locator('h1').count() == 1, url
    assert '24 horas' in page.locator('h1').inner_text(), url
    assert '641 58 93 94' in page.title(), url
    assert page.locator('link[rel=canonical]').get_attribute('href') == 'https://electricistarapido.com' + url
    assert page.locator('script[type="application/ld+json"]').count() >= 1
    assert page.locator('.contact-call').get_attribute('href') == 'tel:+34641589394'
    assert page.locator('.contact-whatsapp').get_attribute('href') == 'https://wa.me/34641589394'
    if width <= 650:
        assert page.locator('.service-hero .actions:visible').count() == 0, (url, 'duplicate hero contacts')
        assert page.locator('header .call:visible').count() == 0, url
        assert page.locator('.contact-dock:visible').count() == 1, url
        assert page.locator('.contact-dock a:visible').count() == 2, url
        assert page.evaluate("[...document.querySelectorAll('.contact-dock a')].every(e => e.scrollWidth <= e.clientWidth + 1)")
    else:
        assert page.locator('.service-hero .actions a:visible').count() == 2, (url, 'desktop contacts removed')
        assert page.locator('.contact-dock:visible').count() == 0, url
    if '/electricista/' not in url:
        return
    rows = page.locator('.demand-list .demand')
    assert rows.count() == 6, url
    geometry = rows.evaluate_all('''elements => elements.map(el => {
        const label = el.querySelector(':scope > span');
        const arrow = el.querySelector(':scope > i');
        const r = el.getBoundingClientRect(), l = label.getBoundingClientRect(), a = arrow.getBoundingClientRect();
        return {height: r.height, width: r.width, labelWidth: l.width,
            lines: l.height / parseFloat(getComputedStyle(label).lineHeight),
            rightGap: r.right - a.right, labelLeft: l.left - r.left,
            centered: Math.abs(a.top + a.height / 2 - r.top - r.height / 2),
            href: el.getAttribute('href')};
    })''')
    for item in geometry:
        assert 44 <= item['height'] <= 88, (url, width, 'oversized service row', item)
        assert item['labelWidth'] >= item['width'] * .60, (url, width, 'narrow label', item)
        assert item['lines'] <= 2.1, (url, width, 'vertical text', item)
        assert 10 <= item['rightGap'] <= 20, (url, width, 'arrow not at right edge', item)
        assert item['labelLeft'] <= 20 and item['centered'] <= 1, (url, width, item)
        assert (DIST / item['href'].lstrip('/') / 'index.html').is_file(), item

try:
    with sync_playwright() as p:
        for engine in ['chromium', 'webkit']:
            browser = getattr(p, engine).launch()
            for width in WIDTHS:
                context = browser.new_context(viewport={'width': width, 'height': 844 if width <= 650 else 1000},
                    device_scale_factor=1, is_mobile=width <= 650, has_touch=width <= 650)
                page = context.new_page()
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                for url in SAMPLES + [route(f) for f in PROVINCE_FILES]:
                    check_local(page, url, width)
                if width in [320, 390, 1440]:
                    url = '/electricista/guipuzcoa/arrasate-mondragon/'
                    check_local(page, url, width)
                    page.screenshot(path=str(REPORTS / f'pueblo-hero-{engine}-{width}.png'))
                    page.locator('.demand-list').evaluate('''el => {
                        const top = el.getBoundingClientRect().top + window.scrollY;
                        const header = document.querySelector('header').getBoundingClientRect().height;
                        window.scrollTo({top: top - header - 62, behavior: 'instant'});
                    }''')
                    page.screenshot(path=str(REPORTS / f'pueblo-servicios-{engine}-{width}.png'))
                assert not errors, errors
                results.append({'engine': engine, 'width': width, 'routes': len(SAMPLES) + len(PROVINCE_FILES), 'status': 'pass'})
                context.close()

            context = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            for file in TOWN_FILES:
                check_local(page, route(file), 390)
            # Check actual internal navigation without following tel:/WhatsApp links.
            page.locator('.demand-list .demand').first.click()
            assert '/servicios/' in page.url
            assert page.locator('.service .actions:visible').count() == 0
            assert page.locator('.contact-dock:visible').count() == 1
            assert not errors, errors
            results.append({'engine': engine, 'width': 390, 'all_municipalities': len(TOWN_FILES), 'status': 'pass'})
            context.close()

            context = browser.new_context(viewport={'width': 390, 'height': 844}, java_script_enabled=False, is_mobile=True, has_touch=True)
            page = context.new_page()
            check_local(page, SAMPLES[0], 390)
            page.locator('.mobile-menu summary').click()
            assert page.locator('.mobile-menu-panel a').first.is_visible()
            results.append({'engine': engine, 'javascript': False, 'status': 'pass'})
            context.close()
            browser.close()
finally:
    server.shutdown()
    (REPORTS / 'local-pages-layout.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(f'LOCAL BROWSER OK: {len(results)} groups; {len(TOWN_FILES)} municipalities; 5 provinces; 8 widths; Chromium + WebKit. No calls/messages sent.')
