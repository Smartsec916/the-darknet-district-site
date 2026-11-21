"""Flight-map warp markers and Rook's side missions in the real game (Chromium, software GL, offline).

A. A new pilot (District campaign, Kestrel granted) with a mission to Meridian: in flight the markers and the Map app show only the route (ROUTE ONLY).
B. The same flight after VoidNav.grantCoordinates: every Tessaly System location plus the warp markers to the other systems (ALL LOCATIONS).
C. At Meridian after story flag rook-first-delivery-done: Rook's PROPOSED coordinates line (the grant happens there), his side-mission board,
   a job taken, and the job in the Mission Log as a side mission.

Usage: python tests/flight-map-browser.py BASE_URL SHOTS_DIR   (serve the repo first: node tests/serve-modern.cjs -> http://127.0.0.1:5187)
Needs Python Playwright with its bundled Chromium. Software GL is slow: allow 10 to 20 minutes.
"""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5187'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else 'flight-map-shots'
os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
log = lambda m: print(time.strftime('%H:%M:%S'), m, flush=True)


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox'], **({'executable_path': EXE} if EXE else {}))
        ctx = b.new_context(viewport={'width': 1366, 'height': 768}, service_workers='block')
        page = ctx.new_page()
        page.set_default_timeout(600000)
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', e)))
        page.route('https://**/*', lambda r: r.abort())
        page.route('**/firebase-auth.js', lambda r: r.fulfill(status=503, body='offline test'))
        page.route('**/api/**', lambda r: r.fulfill(status=503, content_type='application/json', body='{}'))
        page.add_init_script("if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));sessionStorage.setItem('i','1');}")
        page.goto(BASE + '/void-runner.html')
        page.wait_for_function('window.VoidStartup?.started')
        page.evaluate("Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000})")
        shot = lambda n: (page.screenshot(path=os.path.join(SHOTS, n + '.png')), log('shot ' + n))

        # ---- A: route-only, a new pilot with a mission to Meridian
        page.evaluate("""()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.story.flags.appearanceOffered=true;C.awardStarterShip(d);d.location='earth';state=d;save();
          window.__active=VoidMissions.active;VoidMissions.active=(s,c)=>[...window.__active(s,c),{id:'test-first-delivery',title:'First delivery (test)',destination:'meridian'}];}""")
        page.evaluate("async()=>{await launch();}")
        page.wait_for_function("mode==='play'&&flight.route&&flight.route.phase==='align'")
        log('flight ' + page.evaluate("flight.route.origin+'->'+flight.route.destination"))
        a = page.evaluate("()=>({flag:state.story.flags.navCoords,mode:VoidNav.mode(state,VoidNav.active()),routes:flightRoutes().map(r=>r.id),known:VoidUniverse.destinations(state)})")
        log('A ' + str(a))
        assert a['flag'] is False and a['mode'] == 'route' and a['routes'] == ['meridian'], a
        page.wait_for_function("VoidNavigationReveal.opacity(navigationReveal)>=1", timeout=300000)
        page.evaluate("()=>{const r=flightRoutes()[0];flight.yaw=Math.atan2(r.vector.x,r.vector.z)+.2;flight.pitch=0;flight.roll=0;}")
        page.wait_for_timeout(1500)
        shot('a1-route-only-markers')
        page.keyboard.press('KeyL')
        page.wait_for_function("!!document.querySelector('#personal-device [data-nav]')", timeout=60000)
        page.wait_for_timeout(600)
        listed = page.evaluate("[...document.querySelectorAll('#personal-device [data-nav]')].map(b=>b.dataset.nav)")
        log('A map lists ' + str(listed))
        assert listed == ['meridian'] and page.evaluate("!!document.querySelector('[data-nav-mode=route]')")
        shot('a2-route-only-map-app')
        page.keyboard.press('KeyL')
        page.wait_for_timeout(400)

        # ---- B: full mode after the coordinates
        g = page.evaluate("()=>({first:VoidNav.grantCoordinates('test'),again:VoidNav.grantCoordinates('test'),mode:VoidNav.mode(state,VoidNav.active()),routes:flightRoutes().map(r=>r.id)})")
        log('B ' + str(g))
        assert g['first'] is True and g['again'] is False and g['mode'] == 'full' and set(g['routes']) == {'sol-belt', 'mars', 'meridian'}, g
        page.wait_for_timeout(1500)
        shot('b1-full-markers')
        page.keyboard.press('KeyL')
        page.wait_for_function("document.querySelectorAll('#personal-device [data-nav]').length>=3", timeout=60000)
        page.wait_for_timeout(600)
        listed = page.evaluate("[...document.querySelectorAll('#personal-device [data-nav]')].map(b=>b.dataset.nav)")
        log('B map lists ' + str(listed))
        assert {'sol-belt', 'mars', 'meridian'} <= set(listed) and page.evaluate("!!document.querySelector('[data-nav-mode=full]')")
        shot('b2-full-map-app')
        page.keyboard.press('KeyL')
        page.evaluate("()=>{VoidMissions.active=window.__active;}")

        # ---- C: Rook at Meridian after the first delivery
        page.reload()
        page.wait_for_function('window.VoidStartup?.started')
        page.evaluate("Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000})")
        page.evaluate("""async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.story.flags.appearanceOffered=true;C.awardStarterShip(d);d.location='meridian';d.progression.checkpoint={location:'meridian'};VoidUniverse.visit(d);
          d.story.flags['rook-first-delivery-done']=true;state=d;VoidMissions.sync(state,C);save();await dock();}""")
        page.wait_for_function("mode==='walking'&&!!walkingLocation", timeout=600000)
        page.wait_for_timeout(2000)
        page.evaluate("()=>{const r=walkingLocation.interactions.find(i=>i.id==='rook');if(r){walker.x=r.position[0]+1.6;walker.z=r.position[2]-1.4;walker.yaw=Math.atan2(r.position[0]-walker.x,r.position[2]-walker.z);walker.pitch=0;}VoidInteractions.handlers.get('talk')({item:{character:'rook',action:'talk'}});}")
        page.wait_for_timeout(2500)
        c1 = page.evaluate("()=>({text:document.querySelector('.dialogue-window')?.textContent||'',flag:state.story.flags.navCoords,sent:state.story.flags.rookNavSent})")
        log('C1 ' + str(c1))
        assert c1['flag'] is True and c1['sent'] is True and 'coordinates' in c1['text'], c1
        shot('c1-rook-coordinates-line')
        for _ in range(4):
            if page.evaluate("!!document.querySelector('.rook-board')"):
                break
            page.evaluate("(document.getElementById('speech-next')||document.querySelector('[data-action=speech-next]'))?.click()")
            page.wait_for_timeout(1200)
        page.wait_for_function("!!document.querySelector('.rook-board')", timeout=60000)
        page.wait_for_timeout(1500)
        board = page.evaluate("()=>C.rookBoard(state).map(j=>j.kind+':'+j.destination+':'+j.payment)")
        log('C2 board ' + str(board))
        shot('c2-rook-board')
        page.evaluate("document.querySelector('[data-action=\"rook-job:routine\"]').click()")
        page.wait_for_timeout(1500)
        job = page.evaluate("()=>({contract:state.contract,tracked:state.universe.trackedMission,run:C.rookRun(state)})")
        log('C3 job ' + str({k: job[k] for k in ('contract', 'tracked')}) + ' to ' + job['run']['destination'] + ' pay ' + str(job['run']['payment']))
        assert job['contract'] == 'rook-run' and job['tracked'] == job['run']['id']
        page.wait_for_timeout(1500)
        shot('c3-after-accept')
        page.evaluate("VoidPersonalDevice.openApp('missions')")   # the V1's Mission Log (L on foot)
        page.wait_for_timeout(1500)
        shot('c4-mission-log-side-mission')
        entry = page.evaluate("document.querySelector('#personal-device')?.textContent||''")
        log('C4 log ' + entry[:300])
        assert 'Rook freight run' in entry and ('SIDE' in entry.upper()), entry[:600]
        page.evaluate("VoidPersonalDevice.close()")
        bad = [e for e in errors if "reading 'update'" not in e]
        assert not bad, bad
        log('PASS')
        b.close()


if __name__ == '__main__':
    main()
