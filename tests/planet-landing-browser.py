"""Planet descents, take-offs and the way home in the real game (Chromium, software GL, offline). planet-landing.js.

A. A pilot (District campaign, Kestrel granted, coordinates) flies Meridian -> Tessaly Belt Anchorage (the warp to Tessaly) -> NeoChinatown: the descent plays
   (frames saved), hands over to the Port pad (street, quarter port, next to the ship).
B. Boarding at the Port: the ascent plays (frames saved), then the existing flight: mode play, the route reaches 'align' (the take-off trigger the Mission 012 /
   beginner steps read), the arrival at Vantor plays its descent and lands in the Vantor terminal.
C. The other landing areas' descents (The Nexus, the Natural Order homeworld, Vesper) and the Vantor / Servo ascents, frames only; SKIP (Space) ends one early.
D. The setting off: no sequence. E. A District player with no ship at Meridian: BOARD takes the passenger shuttle home to the Port.

Usage: python tests/planet-landing-browser.py BASE_URL SHOTS_DIR [QUALITY]   (serve the repo first: node tests/serve-modern.cjs -> http://127.0.0.1:5187)
Needs Python Playwright with its bundled Chromium. Software GL is slow: allow 15 to 30 minutes.
"""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5187'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else 'planet-landing-shots'
QUALITY = sys.argv[3] if len(sys.argv) > 3 else 'low'
ONLY = os.environ.get('ONLY', 'ABCDE')
os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
log = lambda m: print(time.strftime('%H:%M:%S'), m, flush=True)
LIMITS = "Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000})"
PILOT = """const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.story.flags.appearanceOffered=true;C.awardStarterShip(d);VoidNav.grant(d,'test');"""
# Ends the flight now: the route has arrived and every raider is counted as dealt with (cockpit.js then calls arrive() as on a real arrival).
FINISH = "()=>{flight.route.progress=1;flight.route.phase='arrived';approachTime=99;elapsed=current.duration;spawned=resolved=current.enemies;enemies=[];hostile=[];}"


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox'], **({'executable_path': EXE} if EXE else {}))
        ctx = b.new_context(viewport={'width': 1280, 'height': 720}, service_workers='block')
        page = ctx.new_page()
        page.set_default_timeout(900000)
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', e)))
        page.on('console', lambda m: m.type == 'error' and '[landing' in m.text and print('CONSOLE', m.text))
        page.route('https://**/*', lambda r: r.abort())
        page.route('**/firebase-auth.js', lambda r: r.fulfill(status=503, body='offline test'))
        page.route('**/api/**', lambda r: r.fulfill(status=503, content_type='application/json', body='{}'))
        page.add_init_script("if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'%s',v:2,chosen:true}));sessionStorage.setItem('i','1');}" % QUALITY)
        page.goto(BASE + '/void-runner.html')
        page.wait_for_function('window.VoidStartup?.started')
        page.evaluate(LIMITS)
        shot = lambda n: (page.screenshot(path=os.path.join(SHOTS, n + '.png')), log('shot ' + n))

        def frames(prefix, kind, times):
            """Holds the running sequence at each time and saves a picture (the clock is set, then two frames are drawn)."""
            for t in times:
                page.evaluate("t=>VoidLanding.frameTo(t)", t)
                page.wait_for_timeout(250)
                page.evaluate("t=>VoidLanding.frameTo(t)", t)
                page.wait_for_function("()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))")
                page.wait_for_timeout(400)
                page.evaluate("t=>VoidLanding.frameTo(t)", t)
                page.wait_for_timeout(300)
                assert page.evaluate("!!VoidLanding.active"), 'the sequence ended early at %s: %s mode %s' % (t, page.evaluate("JSON.stringify(VoidLanding.log.slice(-1))"), page.evaluate("mode"))
                shot('%s-%s-%04.1f' % (prefix, kind, t))

        def wait_end():
            page.evaluate("()=>{VoidLanding.frameTo(1e9);}")
            page.wait_for_function("!VoidLanding.active", timeout=900000)

        if 'A' in ONLY or 'B' in ONLY:
            # ---- A: Meridian -> Tessaly Belt -> NeoChinatown
            page.evaluate("async()=>{" + PILOT + "d.location='meridian';d.progression.checkpoint={location:'meridian'};VoidUniverse.visit(d);state=d;C.chooseDestination(state,'sol-belt');save();await launch();}")
            page.wait_for_function("mode==='play'&&flight.route&&flight.route.destination==='sol-belt'")
            page.evaluate(FINISH)
            page.wait_for_function("mode==='walking'&&!!walkingLocation&&state.location==='sol-belt'", timeout=900000)
            assert page.evaluate("!VoidLanding.active"), 'a station arrival has no descent'
            log('at the Tessaly Belt Anchorage')
            page.evaluate("()=>{C.chooseDestination(state,'earth');leaveWalking();}")
            page.wait_for_function("mode==='play'&&flight.route&&flight.route.destination==='earth'")
            assert page.evaluate("!VoidLanding.active"), 'no ascent from a station'
            page.evaluate(FINISH)
            page.wait_for_function("!!VoidLanding.active&&VoidLanding.active.kind==='descent'", timeout=60000)
            a = page.evaluate("()=>({loc:state.location,area:state.story.flags.area||null,quarter:state.story.flags.quarter||null,active:VoidLanding.active})")
            log('A descent ' + str(a))
            assert a['loc'] == 'earth' and a['area'] is None and a['quarter'] is None
            frames('a', 'servo-descent', [1.0, 3.6, 5.5, 7.8, 9.8, 12.5, 14.5, 16.5, 18.5, 20.0, 21.6])
            wait_end()
            page.wait_for_function("mode==='walking'&&!!walker", timeout=900000)
            page.wait_for_timeout(1500)
            w = page.evaluate("()=>({id:walkingLocation.id,quarter:walkingLocation.quarter||state.story.flags.quarter||'port',x:walker.x,z:walker.z,rec:VoidLanding.log[VoidLanding.log.length-1]})")
            log('A landed ' + str(w))
            assert w['id'] == 'neochinatown' and abs(w['x'] - 31) < 12 and abs(w['z'] + 96) < 12, w
            shot('a-servo-landed-port')

            # ---- B: take off from the Port, then land on Vantor
            page.evaluate("()=>{C.chooseDestination(state,'mars');leaveWalking();}")
            page.wait_for_function("!!VoidLanding.active&&VoidLanding.active.kind==='ascent'", timeout=60000)
            frames('b', 'servo-ascent', [1.0, 2.6, 5.0, 7.4, 9.4, 11.5, 13.4])
            wait_end()
            page.wait_for_function("mode==='play'&&flight.route&&flight.route.phase==='align'", timeout=900000)
            log('B flight after the ascent: ' + page.evaluate("flight.route.origin+'->'+flight.route.destination+' '+flight.route.phase"))
            page.evaluate(FINISH)
            page.wait_for_function("!!VoidLanding.active&&VoidLanding.active.kind==='descent'&&VoidLanding.active.id==='mars'", timeout=60000)
            frames('b', 'vantor-descent', [3.6, 6.5, 13.0, 17.5, 21.0])
            wait_end()
            page.wait_for_function("mode==='walking'&&!!walkingLocation", timeout=900000)
            log('B landed at ' + page.evaluate("walkingLocation.name+' / '+state.location"))
            assert page.evaluate("walkingLocation.kind==='underground'&&state.location==='mars'")
            shot('b-vantor-landed')

        if 'C' in ONLY:
            if page.evaluate("mode")!='walking':
                page.evaluate("async()=>{" + PILOT + "d.location='earth';delete d.story.flags.area;state=d;save();walkingLocation=walker=null;await dock();}")
                page.wait_for_function("mode==='walking'&&!!walkingLocation", timeout=900000)
            for loc in ['nexus', 'order-homeworld', 'vesper']:
                ok = page.evaluate("id=>VoidLanding.start('descent',id,{preview:true})", loc)
                assert ok, loc
                frames('c', loc + '-descent', [2.0, 6.0, 13.5, 18.0, 21.5])
                page.evaluate("VoidLanding.end('test')")
            ok = page.evaluate("VoidLanding.start('ascent','mars',{preview:true})")
            frames('c', 'vantor-ascent', [1.5, 5.5, 12.5])
            page.evaluate("VoidLanding.end('test')")
            # SKIP with Space
            page.evaluate("VoidLanding.start('descent','earth')")
            page.wait_for_timeout(1500)
            page.keyboard.press('Space')
            page.wait_for_timeout(500)
            s = page.evaluate("VoidLanding.active")
            log('C skip ' + str(s))
            assert s is None or s['skipped'], s
            page.wait_for_function("!VoidLanding.active", timeout=120000)

        if 'D' in ONLY:
            page.evaluate("VoidLanding.setEnabled(false)")
            started = page.evaluate("VoidLanding.start('descent','earth')")
            assert started is False
            page.evaluate("VoidLanding.setEnabled(true)")
            log('D off: no sequence')

        if 'E' in ONLY:
            page.evaluate("async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.story.flags.appearanceOffered=true;delete d.story.flags.area;d.location='meridian';d.progression.checkpoint={location:'meridian'};VoidUniverse.visit(d);state=d;save();walkingLocation=walker=null;await dock();}")
            page.wait_for_function("mode==='walking'&&!!walkingLocation&&state.location==='meridian'", timeout=900000)
            page.evaluate("()=>{leaveWalking();}")
            page.wait_for_function("!!VoidLanding.active", timeout=60000)
            page.wait_for_timeout(2000)
            shot('e-shuttle-home')
            wait_end()
            page.wait_for_function("mode==='walking'&&!!walker&&walkingLocation.id==='neochinatown'", timeout=900000)
            log('E home: ' + page.evaluate("state.location+' '+walkingLocation.id+' '+Math.round(walker.x)+','+Math.round(walker.z)"))
        bad = [e for e in errors if "reading 'update'" not in e]
        assert not bad, bad
        log('PASS')
        b.close()


if __name__ == '__main__':
    main()
