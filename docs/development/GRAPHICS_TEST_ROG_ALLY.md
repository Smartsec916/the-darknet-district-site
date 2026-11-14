# Graphics test on a real GPU (ASUS ROG Ally Extreme)

The cloud and CI machines render with a SOFTWARE renderer (SwiftShader), so they can prove resolution, draw calls and active meshes, but **not** real frame rates. Do this on the Ally (or any real-GPU PC) before trusting any performance claim.

## What changed (V1 Phase 2, graphics)
- New players start on **Medium**. A preset chosen in Settings is kept. The game never changes quality by itself (no adaptive or automatic quality exists).
- Medium draws at the page's own size (scale 1), at most 1.25x the display pixel ratio, never above 2560x1440. High (up to 3840x2160 with supersampling) and Ultra (up to 5120x2880) are opt-in only.
- Settings > Graphics has **Reset graphics to Medium**.
- Old saves: Low, Medium and Ultra choices are kept. The unchosen High that the game defaulted to from 12 Nov 2026 (c3c9213) is moved to Medium once; the removed weak-hardware "auto Low" is not treated as a choice. Choosing High again keeps it.

## Steps (about 10 minutes)
1. Open https://thedarknetdistrict.com (or the local test host `node tests/serve-modern.cjs`, http://127.0.0.1:5187/void-runner.html) in Chrome or Edge with hardware acceleration ON (chrome://gpu should show your Radeon, not SwiftShader).
2. Settings > Graphics: note the preset it shows on a fresh browser profile (should be Medium). Press F12 > Console and run:
   `VoidBabylon.scene.getEngine().getRenderWidth()+'x'+VoidBabylon.scene.getEngine().getRenderHeight()`
   Expected on a 1920x1080 window at 100% scaling: `1920x1080` (Medium). On a 125% Windows scale: about 2400x1350.
3. Frame rate: in the console run
   `(async()=>{const S=VoidBabylon.scene,f=S.getFrameId(),t=performance.now();await new Promise(r=>setTimeout(r,10000));return ((S.getFrameId()-f)/((performance.now()-t)/1000)).toFixed(1)+' fps'})()`
   Standing still, in each place: Sleeping Pod room, The Darknet District interior (walk to the bar), NeoChinatown street, a VR play area (VR terminal). Record Low, Medium, High, Ultra in each (change it in Settings, wait 5 seconds).
4. Optional full table (resolution, draw calls, active meshes, post-processing, frame time per scene and preset): `node tests/graphics-measure-browser.cjs ally.json 1` on the Ally with Playwright's Chromium launched WITHOUT `--use-gl=swiftshader` (edit the launch args) and send `ally.json`.
5. Judge: Medium should hold your target frame rate (60, or 30 for battery) in all four places. If not, report which place and the numbers; do not raise Medium. Compare how Medium looks against High (screenshot both): the intent is that Medium looks clean and neon-lit, High is a little sharper.

## What is NOT claimed
No frame-rate improvement is claimed from the cloud measurements. Only the internal resolution and the counted draw calls / active meshes are real numbers there.
