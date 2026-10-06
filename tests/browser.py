"""Mobile contact regression checks. Never click a phone/WhatsApp link."""
import concurrent.futures, hashlib, http.server, json, os, re, signal, threading, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
REPORT=ROOT/'reports';REPORT.mkdir(exist_ok=True)
BASE=ROOT/'.quality/baseline'
def stop(*args):raise TimeoutError('Browser verification exceeded 120 seconds')
signal.signal(signal.SIGALRM,stop);signal.alarm(120)
class Handler(http.server.SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
 def do_GET(self):
  # Both builds share an origin in this test; absolute production asset URLs
  # must resolve to dist, not to the repository root.
  if self.path.startswith(('/mobile-contact.css','/mobile-contact.js')):self.path='/dist'+self.path
  super().do_GET()
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
# Cache the exact existing photos for deterministic rendering, with bounded requests.
urls=set(re.findall(r'<img[^>]+src="([^"]+)"',(DIST/'index.html').read_text()))
cache={}
def get_image(url):
 try:
  with urllib.request.urlopen(url,timeout=8) as r:return url,(r.read(),r.headers.get('Content-Type','image/jpeg'))
 except Exception:return url,None
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 for url,data in pool.map(get_image,urls):
  if data:cache[url]=data
checks=[]
def external(route):
 value=cache.get(route.request.url)
 if value:route.fulfill(body=value[0],content_type=value[1])
 else:route.abort()
def load(page,url,ready=True):
 r=page.goto(url,wait_until='domcontentloaded');assert r.status==200,url
 page.add_style_tag(content='html{scroll-behavior:auto!important}')
 if ready:page.wait_for_function("document.documentElement.dataset.mobileContactReady === '1'")
def no_overflow(page):assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
try:
 with sync_playwright() as p:
  for engine,widths in [(p.chromium,[320,390,650,768,1440]),(p.webkit,[390])]:
   browser=engine.launch(headless=True)
   for width in widths:
    print('Checking',engine.name,width,flush=True)
    ctx=browser.new_context(viewport={'width':width,'height':844},device_scale_factor=1)
    ctx.set_default_timeout(6000);ctx.set_default_navigation_timeout(12000);ctx.route('https://**/*',external)
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    for path in ['','servicios/diferencial-que-no-sube/']:
     load(page,base+'/dist/'+path);no_overflow(page)
     bar=page.locator('.mobile-bar');expect(bar).to_be_hidden()
     if width<=650:
      expect(page.locator('header .call')).to_be_hidden()
      primary=page.locator('.hero .actions, main .service .actions').first
      for link in primary.locator('a').all():assert link.bounding_box()['height']>=44
      if path=='' and width==390 and engine.name=='chromium':
       assert page.locator('.primary-call-number').bounding_box()['y']<844
       page.screenshot(path=str(REPORT/'electricista-movil-inicio.png'))
      primary.evaluate('(e)=>scrollTo(0,scrollY+e.getBoundingClientRect().bottom-document.querySelector("header").getBoundingClientRect().bottom+20)')
      expect(bar).to_be_visible();no_overflow(page)
      for a in bar.locator('a').all():
       r=a.bounding_box();assert r['width']>=44 and r['height']>=44
      number=bar.locator('.mobile-call-number');assert number.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
      if path=='' and width==390 and engine.name=='chromium':page.screenshot(path=str(REPORT/'electricista-movil-scroll.png'))
      if path=='':
       page.locator('.final-actions').evaluate('(e)=>scrollTo(0,scrollY+e.getBoundingClientRect().top-300)')
       expect(bar).to_be_hidden()
      page.evaluate('scrollTo(0,0)');expect(bar).to_be_hidden()
     else:
      expect(page.locator('header .call')).to_be_visible()
    # Exact desktop visual comparison when a baseline is available.
    if BASE.exists() and width in [768,1440] and engine.name=='chromium':
     load(page,base+'/.quality/baseline/',ready=False)
     page.evaluate('Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})))')
     before=page.screenshot()
     load(page,base+'/dist/')
     page.evaluate('Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})))')
     after=page.screenshot();assert before==after,('Desktop changed',width)
    assert not errors,errors
    checks.append({'browser':engine.name,'width':width,'homeAndService':True,'passed':True})
    ctx.close()
   ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});ctx.route('https://**/*',external)
   page=ctx.new_page();load(page,base+'/dist/',ready=False)
   expect(page.locator('.mobile-bar')).to_be_hidden();expect(page.locator('.hero .actions')).to_be_visible();no_overflow(page)
   checks.append({'browser':engine.name,'javascript':False,'contactAccessible':True,'passed':True})
   ctx.close();browser.close()
finally:
 server.shutdown();server.server_close();signal.alarm(0)
(REPORT/'mobile-browser.json').write_text(json.dumps({'passed':True,'checks':checks,'existingPhotosCached':len(cache)},indent=2))
print('MOBILE CONTACT OK:',len(checks),'scenarios',flush=True)
