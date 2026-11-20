"""Usage: python tests/awakening-play-browser.py (Python Playwright; RUN=fresh | RUN=after003; SHOTS=dir; RUN=after003 needs SHOTS/save-after-003.json:
node tests/awakening-make-save003.cjs > SHOTS/save-after-003.json). Browser playthrough of the Awakening continuation (Python Playwright, bundled Chromium, --use-gl=swiftshader, offline: every API refused).
RUN=fresh : a new character through the main menu and the creator; 001-003 by mission events; then 004-012.
RUN=after003 : a local test profile that has just finished Mission 003 (made by the real engine), loaded with CONTINUE; then 004-012.
Movement-heavy steps are driven with mission events (dev helpers); the UI pieces are used for real: Fish's Comms call on the V1, the Mission Log card
(REPORT, EVIDENCE, OPEN REMOTE FEED), the COPY TO V1 document window, the hack HUD at the Corporate District maintenance door, the remote camera feed
(the existing Blackrock Cult Room scene, recorded to the Gallery), a reload in the middle of a mission, the reward, the Kestrel, the cargo tree."""
import json, os, subprocess, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('SHOTS', os.path.join(ROOT, 'docs/development/awakening-shots'))
RUN = os.environ.get('RUN', 'fresh')
BASE = 'http://127.0.0.1:5187'
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
os.makedirs(OUT, exist_ok=True)
t0 = time.time()
def log(*a): print('[%4ds %s]' % (time.time() - t0, RUN), *a, flush=True)

srv = None
try:
    urllib.request.urlopen(BASE + '/void-runner/mission-mechanics.js', timeout=3).read()
    log('server already up (this worktree)')
except Exception:
    srv = subprocess.Popen(['node', 'tests/serve-modern.cjs'], cwd=ROOT)
    time.sleep(1.5)
    urllib.request.urlopen(BASE + '/void-runner/mission-mechanics.js', timeout=5).read()

LIMITS = "Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:300000,total:1800000,module:900000,artwork:300000})"
EV = """(e)=>{const L=VoidLiveContent,r=VoidMissionContent.treeEvent(state,L.env,e,VoidMissions,C);L.report(r);L.deliver(r);try{save();}catch{};
 return {objective:r.objective,done:r.done,completed:r.completed,mission:r.mission,notes:r.notes,messages:(r.messages||[]).map(m=>({from:m.from,header:m.header,text:m.text})),lines:(r.lines||[]).map(l=>l.text),hear:r.hear}}"""
STEP = """(id)=>{const r=state.universe.missions[id];if(!r)return null;const m=VoidLiveContent.env.trees.flatMap(t=>t.missions).find(y=>y.id===id);const o=m.objectives.find(o=>r.objectives[o.id]!==true);return o?o.id:'(done)';}"""

def main():
    with sync_playwright() as p:
        br = p.chromium.launch(headless=True, **({'executable_path': EXE} if EXE else {}), args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        ctx = br.new_context(viewport={'width': 1366, 'height': 768}, service_workers='block')
        page = ctx.new_page(); page.set_default_timeout(400000)
        errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
        page.route('https://**/*', lambda r: r.abort())
        page.route('**/firebase-auth.js', lambda r: r.fulfill(status=503, body='offline test'))
        page.route('**/api/**', lambda r: r.fulfill(status=503, content_type='application/json', body='{}'))
        page.add_init_script("if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));localStorage.setItem('editor-tour-done','1');sessionStorage.setItem('i','1');}")
        shot = lambda n: page.screenshot(path=os.path.join(OUT, RUN + '-' + n + '.png'))
        ev = lambda e: page.evaluate(EV, e)
        step = lambda mid: page.evaluate(STEP, mid)
        def boot():
            page.wait_for_function('()=>window.VoidStartup?.started'); page.evaluate(LIMITS)
        def into_world():
            page.wait_for_function("()=>mode==='pod-waking'||mode==='walking'")
            if page.evaluate("()=>mode==='pod-waking'"):
                page.wait_for_function("()=>VoidAssets.pending===0"); page.wait_for_timeout(800); page.keyboard.press('KeyE')
            page.wait_for_function("()=>mode==='walking'&&walker")
            page.evaluate("()=>{VoidV1.bannerMs=600000;window.__said=window.__said||[];if(!window.__wrapped){window.__wrapped=1;const a=announce;announce=function(t){window.__said.push(String(t));return a.apply(this,arguments);};}}")
        def cont():
            page.reload(); boot(); page.locator('[data-action=menu-continue]').click(); into_world()
        def time_passes(mins):
            page.evaluate("(n)=>{state.story.flags.gameMin=(Number(state.story.flags.gameMin)||0)+n;save();}", mins)
        def place(*places, **extra):
            return ev({'type': 'place', 'places': list(places), **extra})
        def done(mid): return page.evaluate("(id)=>!!state.universe.missions[id]?.completed", mid)
        def v1(app=None):
            page.evaluate("(a)=>{if(a&&VoidPersonalDevice.openApp)VoidPersonalDevice.openApp(a);else VoidPersonalDevice.open();}", app)
            page.wait_for_function('()=>VoidPersonalDevice.isOpen&&!VoidPersonalDevice.busy'); page.wait_for_timeout(500)
        def v1_close():
            page.evaluate("()=>{try{VoidPersonalDevice.close();}catch{}}"); page.wait_for_function('()=>!VoidPersonalDevice.isOpen')
            page.evaluate("()=>{try{resumeWalking();}catch{}}")

        page.goto(BASE + '/void-runner.html'); boot()
        if RUN == 'fresh':
            page.click('[data-action=menu-campaign]'); page.click('[data-action=menu-new]')
            if page.locator('[data-action=menu-new-confirm]').count(): page.click('[data-action=menu-new-confirm]')
            page.wait_for_selector('#character-creator.on'); page.wait_for_function("()=>!document.querySelector('[data-cc=confirm]').disabled"); page.locator('[data-cc=confirm]').click()
            into_world(); log('new character in the world')
            try: page.wait_for_function("()=>!!state.universe.missions['m001-awakening']?.acquired", timeout=60000)
            except Exception: log('Admin\'s call not in yet; flags:', page.evaluate("()=>({pod:state.story.flags.podWakePending,pool:state.story.flags.missionPool,mode})")); ev({'type': 'pod-exit'})
            log('Awakening:', step('m001-awakening')); shot('00-new-character')
            # 001-003 (their own browser tests cover them in detail): the events the game sends
            for e in [{'type': 'talk', 'npcs': ['admin']}, {'type': 'talk', 'npcs': ['admin']}, {'type': 'accept', 'mission': 'm002-eyes-on-the-street'}, {'type': 'place', 'places': ['null']},
                      {'type': 'photo', 'subjects': ['juno-vex', 'halden-reyes']},
                      {'type': 'send-photo', 'to': 'admin', 'photo': {'subjects': [{'id': 'juno-vex', 'valid': True}, {'id': 'halden-reyes', 'valid': True}], 'during': ['m002-eyes-on-the-street/photograph'], 'place': 'null', 'at': 1}},
                      {'type': 'talk', 'npcs': ['admin']}, {'type': 'accept', 'mission': 'm003-corporate-connections'}, {'type': 'place', 'places': ['milked']}, {'type': 'talk', 'npcs': ['milked-eva']}, {'type': 'talk', 'npcs': ['milked-fish']}]:
                r = ev(e); log('event', e.get('type'), e.get('npcs') or e.get('places') or e.get('mission') or '', '->', r.get('mission'), r.get('objective'), r.get('completed'), [step(m) for m in ['m001-awakening','m002-eyes-on-the-street','m003-corporate-connections']])
            assert done('m003-corporate-connections'), '003 done'
            page.evaluate("()=>{try{resumeWalking();}catch{}}")
        else:
            save003 = open(os.path.join(OUT, 'save-after-003.json')).read()
            page.evaluate("(j)=>localStorage.setItem('void-runner-campaign-v1',j)", save003)
            page.reload(); boot(); page.locator('[data-action=menu-continue]').click(); into_world()
            assert done('m003-corporate-connections'), 'the profile has finished 003'
            log('loaded the after-003 profile; 004 not started:', page.evaluate("()=>!state.universe.missions['m004-a-promising-investment']"))

        # ---- 004: Fish's call after 6 in-game hours
        assert page.evaluate("()=>!state.universe.missions['m004-a-promising-investment']"), 'no call yet'
        time_passes(361)
        page.wait_for_function("()=>!!state.universe.missions['m004-a-promising-investment']?.acquired", timeout=20000)
        log('Fish calls (the place tick fired it by itself)')
        page.wait_for_timeout(1500); shot('01-fish-call-banner')
        page.evaluate("()=>{try{VoidKeyMapUI?.close?.();}catch{}}")
        if page.evaluate("()=>!!VoidKeyMapUI?.open"): page.keyboard.press('KeyK')
        log('inbox comms:', page.evaluate("()=>VoidLiveContent.inbox('comms').map(m=>[m.id,m.at,m.read])"))
        page.keyboard.press('KeyL'); page.wait_for_function("()=>VoidPersonalDevice.isOpen&&!VoidPersonalDevice.busy"); page.wait_for_timeout(1200)
        txt = page.inner_text('#personal-device')
        assert 'Veyra Dynamics' in txt or 'FISH' in txt.upper(), txt[:400]
        shot('02-fish-call-v1'); v1_close()
        place('underground', 'under-tea-room')
        for s in ['locate', 'blend-in', 'overhear']:
            r = ev({'type': 'observe' if s != 'overhear' else 'overhear', 'step': 'm004-a-promising-investment/' + s}); assert r['objective'] == s, (s, r)
        # the real Mission Log card: evidence and REPORT TO FISH
        v1('missions'); page.wait_for_timeout(800)
        card = page.inner_text('#personal-device'); log('card:', card[:300].replace('\n',' | '))
        if not ('REPORT TO FISH' in card and 'OVERHEARD AT THE TEA HOUSE' in card.upper()):
            log('DEBUG extras:', page.evaluate("()=>{try{return [typeof VoidMissionExtras,typeof VoidMissionMechanicsGame,VoidMissionExtras?VoidMissionExtras('m004-a-promising-investment',false):'-',JSON.stringify(VoidMissionMechanicsGame?VoidMissionMechanicsGame.now().map(x=>x.key):null),state.story.flags.evidence];}catch(e){return 'ERR '+e.message;}}"))
            log('DEBUG card tail:', card[-700:].replace('\n',' | '))
            raise SystemExit('card')
        shot('03-mission-log-report'); page.locator('[data-mx-report]').first.dispatch_event('click')
        page.wait_for_function("()=>!!state.universe.missions['m004-a-promising-investment']?.completed", timeout=20000); log('004 done through the REPORT button')
        page.evaluate("()=>{try{resumeWalking();}catch{}}")

        # ---- 005, with a reload (disconnect) in the middle
        place('avenue'); place('avenue')
        assert step('m005-behind-closed-doors') == 'find-105', step('m005-behind-closed-doors')
        cont(); log('reloaded mid-005:', step('m005-behind-closed-doors'))
        assert step('m005-behind-closed-doors') == 'find-105'
        place('avenue', apt='m005-behind-closed-doors/reyes', mod='hall')
        ev({'type': 'hack', 'ap': 'reyes/hall.d0', 'mission': 'm005-behind-closed-doors'})
        place('avenue', apt='m005-behind-closed-doors/reyes', mod='flat')
        # the real use of Halden's computer: the document window opens with COPY TO V1
        page.evaluate("()=>VoidLiveContent.aptUse({mission:'m005-behind-closed-doors',apt:'reyes',object:'computer',mod:'flat'})")
        page.wait_for_timeout(2500)
        log('after the use:', step('m005-behind-closed-doors'), page.evaluate("()=>({speech:!!(typeof speech!=='undefined'&&speech),mode,now:VoidMissionMechanicsGame.now().map(x=>x.key),tc:typeof talkChoice})"))
        page.evaluate("()=>{let n=0;while(speech&&(speech.index<speech.lines.length-1||speech.shown<speech.lines[speech.index].text.length)&&n++<60)advanceSpeech();}"); page.wait_for_timeout(800)
        log('the window:', page.evaluate("()=>({first:speech&&speech.lines[0].text,main:document.getElementById('speech-next')?.textContent,choices:[...document.querySelectorAll('[data-talk-choice]')].map(b=>b.textContent)})"))
        shot('04-copy-to-v1')
        page.evaluate("()=>{const b=[...document.querySelectorAll('#speech-next,[data-talk-choice]')].find(x=>/COPY TO V1/.test(x.textContent));b.click();}")
        page.wait_for_function("()=>/br-proposal/.test(state.story.flags.evidence||'')", timeout=20000); log('evidence:', page.evaluate("()=>state.story.flags.evidence"))
        place('avenue'); ev({'type': 'report', 'step': 'm005-behind-closed-doors/send'})
        assert done('m005-behind-closed-doors')

        # ---- 006 (driven; the guard / sneak runs in the game loop)
        place('avenue')
        for m in ['lobby', 'hall', 'office']: place('avenue', apt='m006-hostile-takeover/veyra', mod=m)
        ev({'type': 'apt-use', 'mission': 'm006-hostile-takeover', 'apt': 'veyra', 'object': 'manager-pc', 'mod': 'office'})
        ev({'type': 'collect', 'step': 'm006-hostile-takeover/download'}); ev({'type': 'collect', 'step': 'm006-hostile-takeover/documents'}); place('avenue')
        page.evaluate("()=>{for(const t of VoidMissionContent.timersNow(state,VoidLiveContent.env))VoidMissionContent.timerSet(state,t,0);}"); ev({'type': 'timer'})
        page.evaluate("()=>{for(const t of VoidMissionContent.timersNow(state,VoidLiveContent.env))VoidMissionContent.timerSet(state,t,0);}"); ev({'type': 'timer'})
        assert done('m006-hostile-takeover'), step('m006-hostile-takeover')

        # ---- 007 and 008 (driven)
        place('underground'); place('underground', 'under-fight-pit')
        for k, s in [('observe', 'find-juno'), ('overhear', 'observe')]: ev({'type': k, 'step': 'm007-the-house-always-wins/' + s})
        ev({'type': 'photo', 'subjects': ['blackrock-associate']}); ev({'type': 'tail', 'step': 'm007-the-house-always-wins/follow'}); ev({'type': 'observe', 'step': 'm007-the-house-always-wins/see-entrance'})
        ev({'type': 'photo', 'subjects': ['blackrock-entrance']}); ev({'type': 'report', 'step': 'm007-the-house-always-wins/send-location'})
        assert done('m007-the-house-always-wins')
        place('far-south'); ev({'type': 'observe', 'step': 'm008-private-network/locate'}); ev({'type': 'hack', 'ap': 'biz-main-w-166', 'mission': 'm008-private-network'})
        place('far-south', apt='m008-private-network/contractor', mod='shop')
        ev({'type': 'apt-use', 'mission': 'm008-private-network', 'apt': 'contractor', 'object': 'computer', 'mod': 'shop'}); ev({'type': 'apt-use', 'mission': 'm008-private-network', 'apt': 'contractor', 'object': 'panel', 'mod': 'maint'})
        ev({'type': 'collect', 'step': 'm008-private-network/destination'}); ev({'type': 'collect', 'step': 'm008-private-network/records'}); place('far-south')
        assert done('m008-private-network')

        # ---- 009: the Corporate District's maintenance door (real): the hack HUD on its keypad
        place('corporate')
        page.evaluate("async()=>{state.location='earth';await enterWalking('corporate',{silent:true,spawn:[-40,1.7,-90.6],yaw:0});}")
        page.wait_for_function("()=>mode==='walking'&&walkingLocation?.id==='corporate'&&VoidAssets.pending===0", timeout=300000)
        ev({'type': 'observe', 'step': 'm009-ghost-in-the-network/locate'})
        page.evaluate("()=>{const it=walkingLocation.interactions.find(i=>i.id==='corp-back-door');VoidInteractions.handlers.get('corp-door')({item:it});}")
        page.wait_for_selector('#apt-hack:not([hidden])', timeout=20000); page.wait_for_timeout(2500); shot('05-corporate-door-hack')
        page.wait_for_function("()=>state.universe.missions['m009-ghost-in-the-network'].objectives.access===true", timeout=60000); log('the maintenance door hacked for real')
        page.evaluate("()=>{const it=walkingLocation.interactions.find(i=>i.id==='corp-back-door');VoidInteractions.handlers.get('corp-door')({item:it});}")
        page.wait_for_function("()=>walkingLocation?.apt?.mission==='m009-ghost-in-the-network'", timeout=300000); page.wait_for_function("()=>VoidAssets.pending===0"); page.wait_for_timeout(2000)
        log('inside the network facility:', page.evaluate("()=>[walkingLocation.id,VoidApartments.insideMod?.()]")); shot('06-network-facility')
        for m in ['servers', 'servers']: place('corporate', apt='m009-ghost-in-the-network/facility', mod=m)
        for e in [{'type': 'apt-use', 'mission': 'm009-ghost-in-the-network', 'apt': 'facility', 'object': 'core', 'mod': 'servers'}, {'type': 'hack', 'ap': 'facility/servers.s1', 'mission': 'm009-ghost-in-the-network'},
                  {'type': 'apt-use', 'mission': 'm009-ghost-in-the-network', 'apt': 'facility', 'object': 'terminal', 'mod': 'servers'}, {'type': 'apt-use', 'mission': 'm009-ghost-in-the-network', 'apt': 'facility', 'object': 'core', 'mod': 'servers'}]:
            ev(e)
        log('spotted notices so far:', page.evaluate("()=>window.__said.filter(t=>/SPOTTED/.test(t))"))
        page.evaluate("async()=>{if(walkingLocation?.apt)await VoidModules.backToStreet();}"); 
        for k in range(4):
            try:
                page.wait_for_function("()=>mode==='walking'&&!walkingLocation?.apt", timeout=150000); break
            except Exception:
                again = page.get_by_text('TRY AGAIN', exact=True)
                log('slow machine: the Corporate District did not finish loading;', 'TRY AGAIN' if again.count() else 'waiting')
                if again.count(): again.first.click()
        log('back outside:', page.evaluate("()=>walkingLocation.id"))
        page.wait_for_function("()=>!!state.universe.missions['m009-ghost-in-the-network']?.completed", timeout=20000); log('009 done (left through the maintenance door)')

        # ---- 010: BR-04 online after an in-game wait; OPEN REMOTE FEED in the Mission Log; the existing cult room scene, recorded
        page.evaluate("async()=>{await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'avenue',spawn:[30,1.7,-9],yaw:0});}"); page.wait_for_function("()=>mode==='walking'&&VoidAssets.pending===0", timeout=300000)
        time_passes(61); page.wait_for_function("()=>!!state.universe.missions['m010-the-price-of-admission']?.acquired", timeout=20000)
        log('BR-04 online:', page.evaluate("()=>window.__said.slice(-2)"))
        page.evaluate("()=>{VoidCameraFeed.speed=12;}")
        v1('missions'); page.wait_for_timeout(600); page.locator('[data-mx-feed]').first.dispatch_event('click')
        page.wait_for_function("()=>VoidCameraFeed.active", timeout=60000)
        page.wait_for_function("()=>VoidCameraFeed.active&&/Awakening, brother/.test(document.querySelector('#cam-feed [data-cf=say]')?.textContent||'')", timeout=300000); page.evaluate("()=>{VoidCameraFeed.speed=1;}"); page.wait_for_timeout(1500); shot('07-br04-feed-ritual'); page.evaluate("()=>{VoidCameraFeed.speed=12;}")
        page.wait_for_function("()=>!!state.universe.missions['m010-the-price-of-admission'].objectives.save", timeout=600000)
        log('recording saved; evidence', page.evaluate("()=>state.story.flags.evidence"))
        page.evaluate("()=>{for(const t of VoidMissionContent.timersNow(state,VoidLiveContent.env))VoidMissionContent.timerSet(state,t,0);}"); ev({'type': 'timer'}); place('district')
        assert done('m010-the-price-of-admission'), step('m010-the-price-of-admission')

        # ---- 011: the hand-over, the sale, the reward and the Kestrel; reload; nothing twice
        place('district', 'district-meeting'); r = ev({'type': 'report', 'step': 'm011-leverage/deliver'}); assert r['lines'][0].startswith('Fifty-one percent'), r
        page.evaluate("()=>{try{resumeWalking();}catch{}}"); page.wait_for_timeout(500)
        page.evaluate("()=>VoidMissionContent.mechanicsNow(state,VoidLiveContent.env)"); time_passes(121)
        page.wait_for_function("()=>state.universe.missions['m011-leverage'].objectives['admin-call']===true", timeout=20000)
        c0 = page.evaluate("()=>state.credits")
        ev({'type': 'talk', 'npcs': ['admin']}); ev({'type': 'heard', 'mission': 'm011-leverage'}); ev({'type': 'heard', 'mission': 'm011-leverage'}); ev({'type': 'heard', 'mission': 'm011-leverage'})
        page.evaluate("()=>{try{resumeWalking();}catch{}}")
        st = page.evaluate("()=>({credits:state.credits,ships:state.ownedShips,access:state.story.flags.shipAccess,cargo:state.story.flags['ts_first-cargo-delivery'],m12:!!state.universe.missions['m012-first-cargo-delivery']})")
        log('after 011', st); assert st['credits'] == c0 + 25000 and st['access'] == 'granted' and st['cargo'] is True and st['ships'].count('starter') == 1
        cont(); st2 = page.evaluate("()=>({credits:state.credits,ships:state.ownedShips})"); assert st2['credits'] == st['credits'] and st2['ships'] == st['ships'], st2
        v1('missions'); page.wait_for_timeout(800); t = page.inner_text('#personal-device'); assert 'FIRST CARGO DELIVERY' in t.upper(), t[:500]; shot('08-mission-log-cargo'); v1_close()
        # ---- 012 (driven)
        # the Ship Loadout app tutorial: really opened on the V1 (its tile glows in mission yellow)
        v1(); page.wait_for_timeout(800); shot('09-v1-loadout-glow'); v1('loadout'); page.wait_for_function("()=>state.universe.missions['m012-first-cargo-delivery'].objectives.loadout===true", timeout=30000)
        page.wait_for_timeout(1200); shot('10-ship-loadout-app'); log('loadout step done by opening the app'); v1_close()
        place('port'); place('port', 'landing-pad'); ev({'type': 'flight', 'stage': 'board'})
        for k in range(4):
            page.evaluate("()=>{for(const t of VoidMissionContent.timersNow(state,VoidLiveContent.env))VoidMissionContent.timerSet(state,t,0);}"); ev({'type': 'timer'})
        ev({'type': 'flight', 'stage': 'launch'})
        ev({'type': 'flight', 'stage': 'jump', 'place': 'meridian'}); place('meridian'); c1 = page.evaluate("()=>state.credits")
        ev({'type': 'talk', 'npcs': ['rook']}); ev({'type': 'heard', 'mission': 'm012-first-cargo-delivery'})
        assert done('m012-first-cargo-delivery') and page.evaluate("()=>state.credits") == c1 + 500
        bad = [e for e in errors if 'offline test' not in e]
        log('DONE. page errors:', bad[:5])
        json.dump({'run': RUN, 'errors': bad, 'said': page.evaluate("()=>window.__said.slice(-40)")}, open(os.path.join(OUT, RUN + '-result.json'), 'w'), indent=1)
        br.close()

try:
    main()
finally:
    if srv: srv.terminate()
