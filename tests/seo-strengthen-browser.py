"""Check actual published layouts, including vertical containment and overlap."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

origin = os.environ.get('SEO_TEST_ORIGIN', 'https://electricistarapido.com')
out = Path('reports/seo'); out.mkdir(parents=True, exist_ok=True)
routes = ['/', '/electricista/vizcaya/bilbao/', '/electricista/alava/vitoria-gasteiz/', '/electricista/guipuzcoa/donostia-san-sebastian/', '/electricista/cantabria/santander/', '/electricista/madrid/madrid/', '/electricista/madrid/getafe/', '/electricista-madrid/chamberi/', '/zonas/vizcaya/', '/zonas/alava/', '/zonas/guipuzcoa/', '/zonas/cantabria/', '/zonas/madrid/', '/servicios/diferencial-que-no-sube/']
result = {'origin': origin, 'commit': os.environ.get('GITHUB_SHA'), 'checks': [], 'ok': False}

# Horizontal scroll tests alone miss fixed-height navs overlapping the next heading.
NAV_LAYOUT = """() => [...document.querySelectorAll('.er-seo .er-links')].map(nav => {
    const rect = el => { const r=el.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}; };
    const box=rect(nav), links=[...nav.querySelectorAll(':scope > a')].map(rect);
    const next=nav.nextElementSibling;
    const styles=getComputedStyle(nav);
    return {box,links,display:styles.display,columns:styles.gridTemplateColumns,
        next:next?rect(next):null,nextIsHeading:!!next?.matches('h2,h3'),
        province:nav.parentElement.id==='ciudades-destacadas'};
})"""

def check_navigation(page, route, width):
    layouts = page.evaluate(NAV_LAYOUT)
    for item in layouts:
        box, links = item['box'], item['links']
        assert links, f'Empty navigation: {route}'
        for child in links:
            assert child['height'] >= 43, f'Collapsed button: {route} at {width}'
            assert child['top'] >= box['top']-1 and child['bottom'] <= box['bottom']+1, f'Navigation height clips its buttons: {route} at {width}'
            assert child['left'] >= box['left']-1 and child['right'] <= box['right']+1, f'Button outside its navigation: {route} at {width}'
        for i, a in enumerate(links):
            for b in links[i+1:]:
                overlap_x=min(a['right'],b['right'])-max(a['left'],b['left'])
                overlap_y=min(a['bottom'],b['bottom'])-max(a['top'],b['top'])
                assert overlap_x <= 1 or overlap_y <= 1, f'Buttons overlap: {route} at {width}'
        if item['next']:
            minimum = 24 if item['province'] and item['nextIsHeading'] else 0
            gap=item['next']['top']-max(c['bottom'] for c in links)
            assert gap >= minimum-1, f'Next content overlaps the navigation: {route} at {width}, gap={gap}'
        if item['province']:
            assert item['display']=='grid', f'Province grid missing: {route}'
            columns=1 if width<=540 else 2 if width<=1000 else 4
            assert len(item['columns'].split())==columns, f'Wrong province columns: {route} at {width}'
            assert max(c['width'] for c in links)-min(c['width'] for c in links)<=1, f'Uneven province buttons: {route} at {width}'
    return len(layouts)

try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for width, js in [(320, True), (390, True), (768, True), (1024, True), (1440, True), (1591, True), (390, False)]:
            context = browser.new_context(viewport={'width': width, 'height': 950}, java_script_enabled=js)
            page = context.new_page()
            for route in routes:
                page.goto(origin+route, wait_until='load', timeout=45000)
                page.wait_for_selector('link[href*="seo-navigation."]', state='attached')
                page.evaluate('document.fonts.ready')
                assert page.locator('h1').count() == 1, route
                assert page.locator('.er-seo').count() > 0, route
                overflow=page.evaluate('document.documentElement.scrollWidth > document.documentElement.clientWidth + 1')
                assert not overflow, f'Overflow {route} at {width}'
                nav_count=check_navigation(page, route, width)
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
                result['checks'].append({'route':route,'width':width,'javascript':js,'noOverflow':True,'contentVisible':True,'navigationBlocks':nav_count,'noVerticalOverlap':True,'buttonsContained':True})
                if js and width in [390,1440] and route in ['/electricista/vizcaya/bilbao/','/electricista/cantabria/santander/','/electricista/madrid/madrid/']:
                    page.locator('#reparacion-en-la-ciudad').screenshot(path=str(out/(route.split('/')[-2]+f'-contenido-{width}.png')))
                if js and width in [390,1440,1591] and route.startswith('/zonas/'):
                    panel=page.locator('#ciudades-destacadas')
                    panel.screenshot(path=str(out/(route.split('/')[-2]+f'-ciudades-ordenadas-{width}.png')))
                    if route=='/zonas/vizcaya/' and width in [390,1591]:
                        page.evaluate("scrollTo(0, document.querySelector('#ciudades-destacadas').getBoundingClientRect().top + scrollY - 105)")
                        page.screenshot(path=str(out/f'vizcaya-contexto-{width}.png'))
            context.close()
        browser.close()
    result['ok']=True
    print('NAVEGADOR SEO OK:',len(result['checks']),'comprobaciones; cinco provincias, filas y separación vertical verificadas')
finally:
    (out/'browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
