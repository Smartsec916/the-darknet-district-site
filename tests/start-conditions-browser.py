"""Usage: node tests/serve-modern.cjs, then python tests/start-conditions-browser.py (Python Playwright, bundled Chromium, --use-gl=swiftshader, offline; SHOTS=dir).
"...and only when" (start-conditions.js, 20 Nov 2026) in a real browser:
1. EDITOR: a new tree; a mission Reverie gives when the player walks within 4 m of her, "and only when" no other placed people are within 6 m of her (+ ADD CONDITION,
   the kind, the distance, untick "count the street crowd"), the plain-words summary; a bad distance shows a problem; the Blocks view's Start block has the same panel.
2. GAME (PLAY THIS DRAFT): Reverie held still; a placed person (a District resident figure, metadata.character) stands 2 m from her: the player walks to 3 m of her and
   nothing starts; the person walks 12 m away: it starts (the real world measured by live-content.js env.world)."""
import os, sys, time, urllib.request
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.environ.get('SHOTS', os.path.join(ROOT, 'docs/development/start-conditions-shots'))
BASE = os.environ.get('SITE_TEST_URL', 'http://127.0.0.1:5187')
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
os.makedirs(OUT, exist_ok=True)
t0 = time.time()
def log(*a): print('[%4ds]' % (time.time() - t0), *a, flush=True)
urllib.request.urlopen(BASE + '/void-runner/start-conditions.js', timeout=5).read()

T = 'draft-second-trigger'; M1 = T + '-m1'

with sync_playwright() as p:
    br = p.chromium.launch(headless=True, **({'executable_path': EXE} if EXE else {}), args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'])
    ctx = br.new_context(viewport={'width': 1366, 'height': 900}, service_workers='block')
    page = ctx.new_page(); page.set_default_timeout(600000)
    errors = []; page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');localStorage.setItem('editor-tour-done','1');localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));}catch{}")
    page.route('https://**/*', lambda r: r.abort())
    page.route('**/firebase-auth.js', lambda r: r.fulfill(status=503, body='offline test'))
    page.route('**/api/**', lambda r: r.fulfill(status=404 if 'live-content' in r.request.url else 503, content_type='application/json', body='{"error":"offline test"}'))
    boot = lambda: page.wait_for_function('()=>globalThis.VoidStartup?.started', timeout=120000)
    page.goto(BASE + '/void-runner.html'); boot()
    page.evaluate("()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));}")
    page.reload(); boot()
    page.evaluate("()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000})")
    page.evaluate("()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;})")
    page.evaluate("()=>VoidDevTools.open('missions')"); page.wait_for_selector('[data-me-new-tree]', timeout=60000)
    # ---- 1. the editor
    page.locator('[data-me-new-tree]').click(); page.locator('[data-me-new-name]').fill('Second trigger'); page.locator('[data-me-create-tree]').click()
    page.wait_for_selector('[data-me-owner-tree="%s"]' % T); page.locator('[data-me-tree="%s"]' % T).click(); page.wait_for_selector('[data-me-add-mission]')
    page.locator('[data-me-add-mission]').click(); page.wait_for_selector('[data-me-tree-mission="%s"]' % M1)
    c1 = lambda: page.locator('[data-me-tree-mission="%s"]' % M1)
    c1().locator('[data-me-giver]').select_option('grey-reverie'); c1().locator('[data-me-field="title"]').fill('TEST: a quiet word with Reverie')
    c1().locator('[data-me-starts]').select_option('near'); page.wait_for_selector('[data-me-start-distance="%s"]' % M1)
    c1().locator('[data-me-start-distance]').fill('4'); c1().locator('[data-me-start-distance]').dispatch_event('change')
    c1().locator('[data-me-start-text]').fill('TEST: Reverie catches your eye.')
    c1().locator('[data-me-step-npc="step-1"]').select_option('grey-reverie'); c1().locator('[data-me-label="step-1"]').fill('Talk to Reverie (test)')
    c1().locator('[data-me-tline="step-1/say/0"] textarea').fill('TEST LINE: Reverie answers.')
    assert 'Leave this empty' in c1().locator('[data-me-only]').inner_text()
    c1().locator('[data-me-only-add]').click(); page.wait_for_selector('[data-me-only-row="0"]')
    c1().locator('[data-me-only-crowd="0"]').uncheck(); page.wait_for_timeout(300)
    c1().locator('[data-me-only-add]').click(); page.wait_for_selector('[data-me-only-row="1"]')
    c1().locator('[data-me-only-kind="1"]').select_option('holstered'); page.wait_for_timeout(300)
    summary = c1().locator('[data-me-only-summary]').inner_text(); log('summary:', summary)
    assert 'Starts when you walk within 4 m of Reverie, and only when no other placed people are within 6 m of Reverie and the player’s weapon is holstered' in summary, summary
    draft = lambda: page.evaluate("(id)=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id).start", M1)
    st = draft(); log('saved start:', st); assert st['only'] == [{'kind': 'alone', 'distance': 6, 'crowd': False}, {'kind': 'holstered'}], st
    c1().locator('[data-me-only]').scroll_into_view_if_needed(); page.wait_for_timeout(300)
    c1().locator('[data-me-start]').screenshot(path=os.path.join(OUT, 'editor-form-and-only-when.png'))
    # a bad value is refused in plain words (the field clamps, so write it into the draft the way an old file could have it)
    c1().locator('[data-me-only-kind="1"]').select_option('time'); page.wait_for_timeout(200)
    c1().locator('[data-me-only-from="1"]').fill('10:00'); c1().locator('[data-me-only-from="1"]').dispatch_event('change'); page.wait_for_timeout(100)
    c1().locator('[data-me-only-to="1"]').fill('10:00'); c1().locator('[data-me-only-to="1"]').dispatch_event('change'); page.wait_for_timeout(300)
    prob = c1().locator('[data-me-only-problem]').all_inner_texts(); log('problem:', prob); assert any('start and end times must differ' in x for x in prob), prob
    c1().locator('[data-me-only-problem]').first.scroll_into_view_if_needed(); c1().locator('[data-me-only]').screenshot(path=os.path.join(OUT, 'editor-problem.png'))
    c1().locator('[data-me-only-remove="1"]').click(); page.wait_for_timeout(300); assert draft()['only'] == [{'kind': 'alone', 'distance': 6, 'crowd': False}]
    # the Blocks view: the same panel in the Start block
    page.locator('[data-mb-switch="%s"] [data-mb-view=blocks]' % M1).click(); page.wait_for_timeout(600)
    log('blocks view:', page.evaluate("()=>({only:document.querySelectorAll('[data-me-only]').length,roots:document.querySelectorAll('.mb-root').length,start:document.querySelectorAll('.mb-block').length,kit:!!document.querySelector('.mb-root [data-me-only]')})"))
    blk = page.locator('[data-me-tree-mission="%s"] [data-me-only]' % M1); assert blk.count() == 1, 'the Start block has it'
    blk.scroll_into_view_if_needed(); page.wait_for_timeout(300)
    page.locator('[data-me-tree-mission="%s"] .mb-block' % M1).first.screenshot(path=os.path.join(OUT, 'editor-blocks-start.png'))
    page.locator('[data-mb-switch="%s"] [data-mb-view=form]' % M1).click(); page.wait_for_timeout(400)
    content = page.evaluate("()=>VoidMissionEditor.draftContent()")
    chk = page.evaluate("(c)=>VoidMissionContent.check(c,{givers:new Map(VoidLiveContent.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()}).errors", content)
    assert chk == [], chk
    # ---- 2. the game
    page.locator('[data-me-play="tree:%s"]' % M1).click()
    page.wait_for_function("()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue'", timeout=900000, polling=100)
    page.evaluate("()=>{Object.assign(walker,{x:100,z:-27});}"); page.wait_for_function("()=>VoidAssets.pending===0", timeout=900000)
    page.wait_for_function("()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='grey-reverie'", timeout=900000, polling=1000)
    HOLD = "()=>{const h=VoidBabylon.district.streetPair.her;Object.assign(h.s,{mode:'stop',left:9999,clip:'idle',device:null,face:null,sub:'test',x:100,z:-6.85,yaw:Math.PI});VoidBabylon.district.streetPair.tick(.3);}"
    page.evaluate(HOLD)
    # a placed person: a figure made exactly as the game places named people (an instance of a street figure, metadata.character, animated through crowd.js)
    made = page.evaluate("""()=>{const her=VoidBabylon.district.streetPair.her,src=[...VoidCrowd.figures()].find(f=>f.node&&f.node.metadata&&f.node.metadata.streetPair==='grey-reverie');
      const look=src?.node?.name?.replace(/^crowd:/,'').replace(/-\\d+$/,'')||null,sc=VoidBabylon.scene,h=new BABYLON.TransformNode('test-placed-holder',sc);
      let fig=null;for(const id of [look,...Object.keys(VoidCrowd.street||{})].filter(Boolean)){fig=VoidAssets.instance?.('crowd:'+id,h);if(fig){fig.metadata={...fig.metadata,character:'kai',displayName:'Test resident'};VoidCrowd.animate(fig,id,'idle');break;}}
      h.position.set(102,0,-6.85);window.__placed=h;return {look,ok:!!fig,figures:VoidCrowd.figures().size};}""")
    log('placed person:', made); assert made['ok'], made
    page.wait_for_timeout(500)
    near = lambda: page.evaluate("()=>VoidLiveContent.peopleNear('grey-reverie',6,false)")
    log('placed people within 6 m of Reverie:', near(), 'with the crowd:', page.evaluate("()=>VoidLiveContent.peopleNear('grey-reverie',6,true)"))
    rec = lambda: page.evaluate("(id)=>state.universe.missions[id]||null", M1)
    page.evaluate("()=>{Object.assign(walker,{x:100,z:-9.85,yaw:0,pitch:.12});}")
    for k in range(8):
        page.evaluate(HOLD); page.wait_for_timeout(500)
    assert near() >= 1, 'the placed person counts'
    log('only now:', page.evaluate("()=>VoidLiveContent.onlyNow()"))
    assert rec() is None, 'someone stands by her: nothing starts'
    page.wait_for_timeout(1500); page.screenshot(path=os.path.join(OUT, 'game-someone-beside-her-waits.png'), timeout=300000)
    page.evaluate("()=>{window.__placed.position.set(112,0,-6.85);}")
    page.evaluate(HOLD)
    page.wait_for_function("(id)=>!!state.universe.missions[id]?.acquired", arg=M1, timeout=20000)
    log('started once the person walked away; tracked:', page.evaluate("()=>state.universe.trackedMission"))
    page.wait_for_timeout(2500); page.screenshot(path=os.path.join(OUT, 'game-started-after-they-left.png'), timeout=300000)
    bad = [e for e in errors if 'offline test' not in e]
    log('page errors:', bad[:5]); assert not bad, bad
    br.close()
log('OK')
