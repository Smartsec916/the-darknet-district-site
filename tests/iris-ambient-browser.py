"""Iris's ambient lines in the real game (Chromium, software GL, offline): on foot in the District with Iris as a contact, a 10 s hack at an access point
(a stand-in hack job: VoidLiveContent.hacks) brings one of her hack lines about half way, shown as "Iris (Comms): ..." and played as her clip; no page errors.

Usage: python tests/iris-ambient-browser.py BASE_URL   (serve the repo first, e.g. python3 -m http.server 5190)
"""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5187'
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
log = lambda m: print(time.strftime('%H:%M:%S'), m, flush=True)
HACKS = ['Almost there.', 'Just a little longer.', "Steady. You're halfway through.", 'Keep your hand still. Nearly done.']


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'], **({'executable_path': EXE} if EXE else {}))
        ctx = b.new_context(viewport={'width': 1100, 'height': 700}, service_workers='block')
        page = ctx.new_page(); page.set_default_timeout(600000)
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', e)))
        page.route('https://**/*', lambda r: r.abort())
        page.route('**/firebase-auth.js', lambda r: r.fulfill(status=503, body='offline test'))
        page.route('**/api/**', lambda r: r.fulfill(status=503, content_type='application/json', body='{}'))
        page.add_init_script("if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));sessionStorage.setItem('i','1');}")
        page.goto(BASE + '/void-runner.html')
        page.wait_for_function('window.VoidStartup?.started')
        page.evaluate("Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000})")
        page.evaluate("""async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.story.flags.appearanceOffered=true;d.location='earth';Object.assign(d.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});state=d;save();
          await enterWalking('sacramento',{silent:true});}""")
        page.wait_for_function("mode==='walking'&&!!walker")
        log('on foot: ' + str(page.evaluate("()=>({loc:walkingLocation.id,area:walkingLocation.area,irisRules:!!VoidIrisAmbientRules,enabled:VoidIrisAmbient.enabled})")))
        page.wait_for_timeout(2000)
        # a stand-in hack step in progress (10 s, stay near) and the player using its access point
        page.evaluate("""()=>{VoidAudio.unlock?.();noticeTime=0;const L=VoidLiveContent;L.hacks=()=>[{key:'test/hack',mission:'test',step:'hack',ap:'test-ap',hold:10,stay:true,unlock:false}];L.hack=()=>null;
          VoidApartments.useAP({ap:'test-ap',position:[walker.x,walker.y||0,walker.z]});}""")
        log('hacking: ' + str(page.evaluate("()=>VoidApartments.hacking&&{hold:VoidApartments.hacking.job.hold}")))
        seen = None; t0 = time.time()
        while time.time() - t0 < 30:
            r = page.evaluate("()=>({t:VoidApartments.hacking?.t??null,notice:document.getElementById('notice')?.textContent||'',last:VoidIrisAmbient.last,played:VoidVoiceClips.played.map(x=>x.primary.id),busy:VoidIrisAmbient.ctx().busy})")
            if r['last'] and not seen:
                seen = r; log('LINE: ' + str(r))
            if seen and r['t'] is None: break
            page.wait_for_timeout(250)
        page.screenshot(path=os.environ.get('SHOT', '/tmp/iris-ambient.png'))
        ok = bool(seen) and seen['last']['cat'] == 'hack' and seen['last']['text'] in HACKS and ('Iris (Comms): ' + seen['last']['text']) in seen['notice']
        frac = seen['t'] / 10 if seen and seen['t'] is not None else None
        log('hack line at %s of the hack; voiced clip played: %s' % (frac, seen and any(x.startswith('extra:iris-bark-hack') for x in seen['played'])))
        page.wait_for_timeout(1500)
        played = page.evaluate("()=>VoidVoiceClips.played.map(x=>x.primary.id)")
        log('clips played: ' + str(played))
        log('page errors: ' + str(errors))
        b.close()
    if not ok or errors:
        print('FAIL'); sys.exit(1)
    print('PASS')


if __name__ == '__main__':
    main()
