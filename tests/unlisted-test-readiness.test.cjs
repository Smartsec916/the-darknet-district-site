/* The state the first unlisted, desktop-only playable test depends on, pinned so that nothing changes it by accident. Each line here is a decision
   recorded in docs/development (FIRST_LIVE_TEST_RUNBOOK.md, AI_HANDOFF.md); changing one needs the owner's decision first. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=f=>fs.readFileSync(f,'utf8');

test('the game page is unlisted: noindex, not in the sitemap, and the static copy is identical',()=>{
 const html=read('void-runner.html');
 assert.match(html,/<meta[^>]+name=["']robots["'][^>]+noindex/i);
 assert.doesNotMatch(read('sitemap.xml'),/void-runner/);
 assert.equal(read('static/void-runner.html'),html);
 assert.doesNotMatch(read('store-first-page.html'),/void-runner\.html/,'the shop no longer links the game');
});
test('the public homepage does not carry the game entrance (it stays an isolated, unapplied patch)',()=>{
 for(const f of ['index.html','static/index.html'])assert.doesNotMatch(read(f),/ENTER THE DARKNET DISTRICT/i,f);
 assert(fs.existsSync('docs/development/homepage-entry/activate-homepage-entry.patch'),'the patch is kept for later');
});
test('desktop only: the device gate runs first and every other game script waits for it',()=>{
 const html=read('void-runner.html'),scripts=[...html.matchAll(/<script\b[^>]*>/g)].map(m=>m[0]).filter(s=>/void-runner\//.test(s));
 const live=scripts.filter(s=>!/type="text\/tdd-game(-module)?"/.test(s));   // both the classic and the module form are held back by the gate
 assert.equal(live.length,1,'exactly one game script loads before the gate decides: '+live.join(' '));assert.match(live[0],/device-gate\.js/);
 for(const s of ['remote-players.js','trade-window.js','avatar-preview.js','pod-music.js','conversation-ui.js'])assert(scripts.some(t=>t.includes(s)&&/tdd-game/.test(t)),s+' is inert until the gate releases it, so a phone never downloads it');
});
test('no Iris chatbot on the game page or the website Sleeping Pod page; Share Links stay retired',()=>{
 for(const f of ['void-runner.html','sleeping_pod.html'])assert.doesNotMatch(read(f),/iris-chat|iris-widget|chatbot|identity_api|darknet-district-iris/i,f);
 assert(fs.existsSync('tests/share-links-removed.test.cjs'));
 assert.doesNotMatch(read('void-runner/menu.js'),/visit=|share link|guest session/i);
});
test('the pod music status: shared playlist as the owner requested, personal files browser-local, no Music Manager yet',()=>{
 const pm=read('void-runner/pod-music.js');
 assert.match(pm,/const WEBSITE_PLAYLIST=true;/,'changing the shared playlist is an owner decision (rights: docs/development/MUSIC_LICENSING.md)');
 assert.doesNotMatch(pm,/XMLHttpRequest|navigator\.sendBeacon|new FormData|method\s*:\s*['"]P(OST|UT)['"]|\bfetch\([^)]*\b(file|body)\b/i,'personal songs are never uploaded (the only .put() is the browser-local IndexedDB store)');
 assert.deepEqual(fs.readdirSync('void-runner').filter(f=>/music-manager|musicmanager/i.test(f)),[],'the admin Music Manager is a proposal only (MUSIC_MANAGER_DECISION.md)');
});
test('multiplayer and trading ship disabled: no live hub, trading refused in production, no paid service in the blueprint',()=>{
 const rp=read('void-runner/remote-players.js');assert.match(rp,/const LIVE_HUB='';/);
 const cfg=read('tools/district-hub/config.cjs');assert.match(cfg,/HUB_TRADING is not available in production/);
 const yml=read('tools/district-hub/render.yaml').split('\n').filter(l=>!/^\s*#/.test(l)).join('\n');
 assert.match(yml,/autoDeploy: false/);assert.match(yml,/plan: free/);assert.doesNotMatch(yml,/HUB_TRADING|HUB_ALLOW_ANY/);
 assert(!fs.existsSync('render.yaml'),'no root Render blueprint exists');
});
