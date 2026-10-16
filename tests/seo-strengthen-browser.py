"""Check published SEO sections at four sizes, including with JavaScript disabled."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

origin = os.environ.get('SEO_TEST_ORIGIN', 'https://electricistarapido.com')
out = Path('reports/seo'); out.mkdir(parents=True, exist_ok=True)
routes = ['/', '/electricista/vizcaya/bilbao/', '/electricista/alava/vitoria-gasteiz/', '/electricista/guipuzcoa/donostia-san-sebastian/', '/electricista/cantabria/santander/', '/electricista/madrid/madrid/', '/electricista/madrid/getafe/', '/electricista-madrid/chamberi/', '/zonas/vizcaya/', '/zonas/madrid/', '/servicios/diferencial-que-no-sube/']
result = {'origin': origin, 'checks': [], 'ok': False}
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for width, js in [(320, True), (390, True), (768, True), (1440, True), (390, False)]:
            context = browser.new_context(viewport={'width': width, 'height': 950}, java_script_enabled=js)
            page = context.new_page()
            for route in routes:
                page.goto(origin+route, wait_until='load', timeout=45000)
                page.wait_for_selector('link[href*="seo-navigation."]', state='attached')
                assert page.locator('h1').count() == 1, route
                assert page.locator('.er-seo').count() > 0, route
                overflow=page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth + 1')
                assert not overflow, f'Overflow {route} at {width}'
                if route.startswith('/electricista/'):
                    guides=page.locator('.local-service > .local-guide-link')
                    assert guides.count()==9, route
                    assert guides.first.is_visible(), route
                footer=page.locator('footer .regional-contact')
                assert footer.count()==1, route
                if js:
                    header_tel=page.locator('header a[href^="tel:"]').first.get_attribute('href')
                    expected='+34614789945' if '/madrid/' in route or route.startswith('/electricista-madrid/') else '+34641589394'
                    assert header_tel=='tel:'+expected, route
                result['checks'].append({'route':route,'width':width,'javascript':js,'noOverflow':True,'contentVisible':True})
                if js and width in [390,1440] and route in ['/electricista/vizcaya/bilbao/','/electricista/cantabria/santander/','/electricista/madrid/madrid/']:
                    page.locator('#reparacion-en-la-ciudad').screenshot(path=str(out/(route.split('/')[-2]+f'-contenido-{width}.png')))
            context.close()
        browser.close()
    result['ok']=True
    print('NAVEGADOR SEO OK:',len(result['checks']),'comprobaciones')
finally:
    (out/'browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
