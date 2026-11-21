"""Sitting down to the floor poses and standing up (21 Nov 2026) in the real game (Chromium, software GL, offline): figures at the underground tea room's cushions
(kneeling, cross-legged, knees to chest, one on the dais), on two sleeping-room cots and an alcove bench (the '-hi' clips from the edge), each frozen at a moment
of its floor-<pose>-down / -up clip and placed exactly as the runtime moves it (ncz-street-pair.js FLOOR_MOVE: origin d metres in front of the loop's origin,
lift h - hb*(1-r), r = smoothstep(k)). Shots: half-way down, seated (the loop), half-way up; the feet are measured against the floor each time.

Usage: python tests/floor-transitions-browser.py BASE_URL SHOTS_DIR   (serve the repo first: node tests/serve-modern.cjs -> http://127.0.0.1:5187)
Needs Python Playwright with its bundled Chromium. Software GL is slow: allow 5 to 10 minutes.
"""
import math, os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5187'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else 'floor-transitions-shots'
os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
log = lambda m: print(time.strftime('%H:%M:%S'), m, flush=True)

SITTERS = [('under-tea-room-cushion-c-w', 'npc-cook-old', 'kneel'), ('under-tea-room-cushion-c-s', 'npc-office-f', 'cross'), ('under-tea-room-cushion-c-n', 'npc-casual-m', 'knees'),
           ('under-tea-room-cushion-c-e', 'vesper-mechanic', 'kneel'), ('under-tea-room-cushion-a-e', 'npc-executive', 'cross'), ('under-tea-room-cushion-b-s', 'npc-student', 'knees'),
           ('under-sleeping-room-cot-2', 'npc-veteran', 'knees'), ('under-sleeping-room-cot-1', 'npc-courier', 'cross'), ('under-alcove-3-bench-up', 'npc-ethereal-lace', 'knees')]
PUT = """async(list)=>{const U=VoidUnderground,A=VoidAssets,scene=VoidBabylon.scene||BABYLON.Engine.LastCreatedScene;window.__fx=[];
 for(const [id,model,pose] of list){await A.load('crowd:'+model,{src:'assets/models/crowd/'+model+'.glb'},scene);const n=A.instance('crowd:'+model,window.__fxRoot||(window.__fxRoot=new BABYLON.TransformNode('floor-fx-test',scene)));
  for(const m of n.getChildMeshes(false))m.isPickable=false;VoidCrowd.animate(n,model,'idle');window.__fx.push({n,id,model,pose,st:U.seatsAll().find(s=>s.id===id)});}
 return window.__fx.length;}"""
# phase: 'down' / 'up' at k, or 'loop': each figure's clip frozen at k, placed as the runtime places it
SET = """([phase,k])=>{const SP=VoidStreetPair,U=VoidUnderground,out=[];
 for(const f of window.__fx){const st=f.st,hi=st.h>SP.RAISED,mv=SP.FLOOR_MOVE[f.pose+(hi?'-hi':'')],sm=x=>x*x*(3-2*x);
  const clip=phase==='loop'?'floor-'+f.pose:'floor-'+f.pose+'-'+phase+(hi?'-hi':''),r=phase==='loop'?1:phase==='down'?sm(k):1-sm(k);
  const o=SP.along(st,-SP.FLOOR_BACK[f.pose]+mv.d*(1-r));f.n.position.set(o.x,U.Y+st.h-mv.hb*(1-r),o.z);f.n.rotation.y=st.yaw;
  const groups=f.n.metadata.animationGroups,g=groups.find(x=>x.name.endsWith('-'+clip)||x.name===clip);for(const x of groups)x.stop();
  if(!g){out.push([f.id,clip,'MISSING']);continue;}g.enableBlending=false;g.start(false,1,g.from,g.to);g.goToFrame(g.from+(g.to-g.from)*(phase==='loop'?0:k));g.pause();
  out.push([f.id.replace('under-',''),f.model,clip]);}
 return out;}"""
MEASURE = """()=>window.__fx.map(f=>{const U=VoidUnderground,t=f.n.getChildTransformNodes(false),y=re=>{const b=t.find(x=>re.test(x.name));return b?+(b.getAbsolutePosition().y-U.Y).toFixed(3):null;};
 return [f.id.replace('under-',''),f.pose,'seat',f.st.h,'hips',y(/Hips$/),'feet',Math.min(y(/LeftToeBase$/),y(/RightToeBase$/)).toFixed(3),'ankles',y(/LeftFoot$/),y(/RightFoot$/),'knees',y(/LeftLeg$/),y(/RightLeg$/)];})"""


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox'], **({'executable_path': EXE} if EXE else {}))
        ctx = b.new_context(viewport={'width': 1100, 'height': 700}, service_workers='block')
        page = ctx.new_page(); page.set_default_timeout(900000)
        page.on('pageerror', lambda e: (errors.append(str(e)), print('PAGE ERROR', e)))
        page.route('https://**/*', lambda r: r.abort())
        page.route('**/firebase-auth.js', lambda r: r.fulfill(status=503, body='offline test'))
        page.route('**/api/**', lambda r: r.fulfill(status=503, content_type='application/json', body='{}'))
        page.add_init_script("if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'medium',v:2,chosen:true}));sessionStorage.setItem('i','1');}")
        page.goto(BASE + '/void-runner.html')
        page.wait_for_function('window.VoidStartup?.started')
        page.evaluate("Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000})")
        page.evaluate("""async()=>{const d=C.startDistrictCampaign(C.fresh());d.story.flags.podWakePending=false;d.story.flags.appearanceOffered=true;d.location='earth';state=d;save();
          const a=VoidUnderground.arrive('under-avenue');await enterWalking('sacramento',{silent:true,quarter:a.quarter,spawn:a.spawn,yaw:a.yaw});}""")
        page.wait_for_function("mode==='walking'&&walkingLocation.quarter==='underground'&&!!VoidBabylon.district?.underground")
        page.wait_for_function("VoidAssets.pending===0", timeout=900000)
        log('underground; placed ' + str(page.evaluate(PUT, SITTERS)))
        U = page.evaluate("()=>Object.fromEntries(VoidUnderground.seatsAll().map(s=>[s.id,[s.x,s.z,s.yaw]]))")

        def view(name, fx, fz, tx, tz, pitch=.3):
            page.evaluate("([x,z,yaw,pitch])=>{walker.x=x;walker.z=z;walker.yaw=yaw;walker.pitch=pitch;}", [fx, fz, math.atan2(tx - fx, tz - fz), pitch])
            page.wait_for_timeout(2500); page.screenshot(path=os.path.join(SHOTS, name + '.png')); log('shot ' + name)

        cn, cs = U['under-tea-room-cushion-c-n'], U['under-tea-room-cushion-c-s']; tx, tz = (cs[0] + cn[0]) / 2, (U['under-tea-room-cushion-c-w'][1] + U['under-tea-room-cushion-c-e'][1]) / 2
        for phase, k, tag in (('down', .5, 'a-mid-down'), ('loop', 0, 'b-seated'), ('up', .5, 'c-mid-up'), ('down', .25, 'd-early-down'), ('up', .8, 'e-late-up')):
            log(tag + ' ' + str(page.evaluate(SET, [phase, k])))
            page.wait_for_timeout(1500)
            for m in page.evaluate(MEASURE): log('  ' + str(m))
            cot, al, c, da = U['under-sleeping-room-cot-2'], U['under-alcove-3-bench-up'], U['under-tea-room-cushion-c-w'], U['under-tea-room-cushion-a-e']
            view(tag + '-1-tea-room-east-table', tx - 1.9, tz - 1.6, tx, tz, .4)
            if tag in ('d-early-down', 'e-late-up'): continue
            view(tag + '-3-dais', da[0] + 1.0, da[1] + 2.4, da[0], da[1] - .3, .35)
            view(tag + '-4-cot', cot[0] + 2.4 * math.sin(cot[2]) + .5, cot[1] + 2.4 * math.cos(cot[2]), cot[0], cot[1], .3)
            view(tag + '-5-bench', al[0] + 1.9, al[1] + 1.2, al[0], al[1], .35)
        log('page errors: ' + (str(errors[:5]) if errors else 'none'))
        b.close()
    assert not errors, errors


if __name__ == '__main__':
    main()
