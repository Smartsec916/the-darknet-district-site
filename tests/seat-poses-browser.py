"""The floor poses at their seats in the real game (Chromium, software GL, offline): the underground tea room's cushions (kneeling, cross-legged, knees to
chest), the mahjong parlour's stools (the chair sit), a sleeping-room cot and an alcove bench (knees to chest). Each figure is put on its seat exactly as the
runtime does (ncz-street-pair.js: the origin FLOOR_BACK behind the seat's middle, lifted to the seat's top, facing the seat's way) and plays its pose.

Usage: python tests/seat-poses-browser.py BASE_URL SHOTS_DIR   (serve the repo first: node tests/serve-modern.cjs -> http://127.0.0.1:5187)
Needs Python Playwright with its bundled Chromium. Software GL is slow: allow 5 to 10 minutes.
"""
import os, sys, time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5187'
SHOTS = sys.argv[2] if len(sys.argv) > 2 else 'seat-poses-shots'
os.makedirs(SHOTS, exist_ok=True)
EXE = os.environ.get('BROWSER_EXECUTABLE') or next((f for f in ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'] if os.path.exists(f)), None)
log = lambda m: print(time.strftime('%H:%M:%S'), m, flush=True)

# who sits where: (seat id, model, pose)
SITTERS = [('under-tea-room-cushion-c-w', 'npc-cook-old', 'kneel'), ('under-tea-room-cushion-c-s', 'npc-office-f', 'cross'), ('under-tea-room-cushion-c-n', 'npc-casual-m', 'knees'),
           ('under-tea-room-cushion-c-e', 'npc-grey-reverie', 'kneel'), ('under-tea-room-cushion-a-e', 'npc-executive', 'cross'), ('under-tea-room-cushion-b-s', 'npc-student', 'kneel'),
           ('under-mahjong-stool-e-w', 'npc-office-m', 'chair'), ('under-mahjong-stool-e-s', 'npc-medic', 'chair'), ('under-mahjong-stool-nw-e', 'npc-fixer', 'chair'),
           ('under-sleeping-room-cot-2', 'npc-veteran', 'knees'), ('under-sleeping-room-cot-1', 'npc-courier', 'cross'), ('under-alcove-3-bench-up', 'npc-ethereal-lace', 'knees')]
PUT = """async(list)=>{const U=VoidUnderground,SP=VoidStreetPair,A=VoidAssets,scene=VoidBabylon.scene||BABYLON.Engine.LastCreatedScene,out=[];window.__sit=window.__sit||[];
 for(const [id,model,pose] of list){const st=U.seatsAll().find(s=>s.id===id);await A.load('crowd:'+model,{src:'assets/models/crowd/'+model+'.glb'},scene);const n=A.instance('crowd:'+model,window.__sitRoot||(window.__sitRoot=new BABYLON.TransformNode('seat-poses-test',scene)));
  const chair=pose==='chair',o=chair?SP.along(st,Number.isFinite(st.back)?st.back:.1):SP.along(st,-SP.FLOOR_BACK[pose]);n.position.set(o.x,U.Y+(chair?0:st.h),o.z);n.rotation.y=st.yaw;
  const an=VoidCrowd.animate(n,model,SP.POSE_CLIP[pose]);for(const m of n.getChildMeshes(false))m.isPickable=false;window.__sit.push(n);out.push([id,model,pose,!!an]);}
 return out;}"""


def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--no-sandbox'], **({'executable_path': EXE} if EXE else {}))
        ctx = b.new_context(viewport={'width': 1100, 'height': 700}, service_workers='block')
        page = ctx.new_page(); page.set_default_timeout(600000)
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
        page.wait_for_function("VoidAssets.pending===0", timeout=600000)
        log('underground; placing ' + str(page.evaluate(PUT, SITTERS)))
        page.wait_for_timeout(3000)
        # where each sitter's hips are, measured along the way the seat faces from its middle (metres; negative: behind the middle) and above the seat's top
        hips = page.evaluate("""(list)=>window.__sit.map((n,i)=>{const st=VoidUnderground.seatsAll().find(s=>s.id===list[i][0]);const h=n.getChildTransformNodes(false).find(t=>/Hips$/.test(t.name));if(!h)return null;
          const p=h.getAbsolutePosition(),dx=p.x-st.x,dz=p.z-st.z;return [list[i][0].replace('under-',''),list[i][1],+(dx*Math.sin(st.yaw)+dz*Math.cos(st.yaw)).toFixed(2),+(dx*Math.cos(st.yaw)-dz*Math.sin(st.yaw)).toFixed(2),+(p.y-VoidUnderground.Y-st.h).toFixed(2)];})""", SITTERS)
        for h in hips: log('hips ' + str(h))

        def view(name, x, z, yaw, pitch=.3, y=None):
            page.evaluate("([x,z,yaw,pitch,y])=>{walker.x=x;walker.z=z;walker.yaw=yaw;walker.pitch=pitch;if(y!=null)walker.y=y;}", [x, z, yaw, pitch, y])
            page.wait_for_timeout(2500)
            log(name + ' camera at ' + str(page.evaluate("()=>[walker.x,walker.y,walker.z].map(v=>+v.toFixed(2))")))
            page.screenshot(path=os.path.join(SHOTS, name + '.png')); log('shot ' + name)
        U = page.evaluate("()=>Object.fromEntries(VoidUnderground.seatsAll().map(s=>[s.id,[s.x,s.z,s.yaw]]))")
        c = U['under-tea-room-cushion-c-w']; m = U['under-mahjong-stool-e-w']; cot = U['under-sleeping-room-cot-2']; al = U['under-alcove-3-bench-up']
        tx, tz = (U['under-tea-room-cushion-c-s'][0] + U['under-tea-room-cushion-c-n'][0]) / 2, (U['under-tea-room-cushion-c-w'][1] + U['under-tea-room-cushion-c-e'][1]) / 2
        import math
        def look(name, fx, fz, tx_, tz_, pitch=.3):   # pitch > 0 looks down
            view(name, fx, fz, math.atan2(tx_ - fx, tz_ - fz), pitch)
        def behind(name, seat, back=1.9, side=.7, pitch=.35):   # from behind and to one side of a seat, looking past it the way it faces
            x, z, yw = U[seat]; fx, fz, rx, rz = math.sin(yw), math.cos(yw), math.cos(yw), -math.sin(yw)
            look(name, x - fx * back + rx * side, z - fz * back + rz * side, x + fx * .4, z + fz * .4, pitch)
        look('01-tea-room-east-table', tx - 1.9, tz - 1.6, tx, tz, .4)
        behind('02-tea-room-kneel-from-behind', 'under-tea-room-cushion-c-w', 1.6, .9, .45)
        da = U['under-tea-room-cushion-a-e']
        look('03-tea-room-dais', da[0] + 1.0, da[1] + 2.4, da[0], da[1] - .3, .35)
        behind('04-mahjong-stool', 'under-mahjong-stool-e-w', 1.7, 1.0, .3)
        behind('05-mahjong-stool-2', 'under-mahjong-stool-nw-e', 1.6, -.9, .3)
        look('06-cot', cot[0] + 2.4 * math.sin(cot[2]) + .5, cot[1] + 2.4 * math.cos(cot[2]), cot[0], cot[1], .3)
        look('07-alcove-bench', al[0] + 1.9, al[1] + 1.2, al[0], al[1], .35)
        log('page errors: ' + (str(errors[:5]) if errors else 'none'))
        b.close()
    assert not errors, errors


if __name__ == '__main__':
    main()
