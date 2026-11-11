/* Lighting probe (diagnostic, not a test): boots the real game into the District interior and prints every light in the scene, how many lights each surface
   is allowed (maxSimultaneousLights), and which lights the first surfaces actually compile into their shaders. Software rendering is fine.
   Run: node tests/serve-modern.cjs &  then  node tools/lighting-probe.cjs [low|high] > probe.json     (BASE=... for another address; SHOT=... for a screenshot) */
const { chromium } = require('playwright');
const q = process.argv[2] || 'high';
const BASE = process.env.BASE || 'http://127.0.0.1:5187';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(t => { try { localStorage.setItem('void-runner-graphics-v1', JSON.stringify({ quality: t })); } catch (e) {} }, q);
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.route(/\/api\/|firebase|googleapis|gstatic|googletagmanager/, r => r.abort());
  await page.goto(BASE + '/void-runner.html'); await page.waitForFunction(() => window.VoidStartup?.started, null, { timeout: 240000 });
  await page.evaluate(async () => { Object.assign(VoidPreparation.limits, { scene: 900000, assets: 300000, optional: 300000, total: 1500000 }); state = C.fresh(); Object.assign(state, { quest: 'open', location: 'earth' }); state.universe.currentSystem = 'sol'; state.universe.freeTravel = true; for (const id of VoidProgression.flags) state.progression.flags[id] = true; state.progression.completed = true; await enterWalking(VoidDistrictArea.KEY.interior); });
  await page.waitForFunction(() => typeof mode !== 'undefined' && mode === 'walking' && walkingLocation && walker, null, { timeout: 300000 });
  await page.evaluate(() => { walker.x = 126.9 + 9; walker.z = -41.9 - 62; walker.yaw = Math.PI / 2; for (let i = 0; i < 6; i++) update(.1); });
  await new Promise(r => setTimeout(r, 4000));
  const r = await page.evaluate(() => {
    const sc = BABYLON.EngineStore.Instances.flatMap(e => e.scenes).sort((a, b) => b.meshes.length - a.meshes.length)[0];
    const lights = sc.lights.map(l => ({ n: l.name, type: l.getClassName(), on: l.isEnabled(), i: +l.intensity.toFixed(2), r: l.range === undefined ? null : +(+l.range).toFixed(1), p: l.position ? [l.position.x, l.position.y, l.position.z].map(v => +v.toFixed(1)) : null }));
    const mats = new Map(); let meshes = 0;
    for (const m of sc.meshes) { if (!m.isEnabled() || !m.material || !m.getTotalVertices()) continue; meshes++; const k = m.material.maxSimultaneousLights; mats.set(k, (mats.get(k) || 0) + 1); }
    const pod = sc.meshes.filter(m => /pod-/.test(m.name) && m.material).slice(0, 4).map(m => ({ n: m.name, max: m.material.maxSimultaneousLights, sources: (m.lightSources || []).length, first: (m.lightSources || []).slice(0, m.material.maxSimultaneousLights).map(l => l.name + (l.position ? '@' + [l.position.x, l.position.z].map(v => +v.toFixed(0)).join(',') : '')) }));
    const big = [...sc.meshes].filter(m => m.isEnabled() && m.material && m.getTotalVertices() > 2000).slice(0, 5).map(m => ({ n: m.name, mat: m.material.name, max: m.material.maxSimultaneousLights, sources: (m.lightSources || []).length }));
    return { sceneLights: lights.length, lights, maxSimultaneousLightsByMesh: [...mats.entries()], meshes, pod, big, caps: { ubo: sc.getEngine().getCaps().maxUniformBufferBindings === undefined ? null : sc.getEngine().getCaps().maxUniformBufferBindings } };
  });
  console.log(JSON.stringify(r, null, 1));
  await page.screenshot({ path: process.env.SHOT || 'lighting-probe.png' });
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
