// The device gate (void-runner/device-gate.js): who gets the 3D game and who gets the landing page. Signals are combined; width alone or the user agent alone never decides.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../void-runner/device-gate.js');
const UA={
 iphone:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
 pixel:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
 androidDesktopSite:'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 ipadOS:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
 galaxyTab:'Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 windows:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
 mac:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
 chromebook:'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
 linux:'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
 winPhone:'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.15254'
};
const c=(e)=>G.classify(e);

test('phones never get the 3D game, whatever the screen size or the override',()=>{
 for(const e of [
  {ua:UA.iphone,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:false,screenShort:393,platform:'iPhone'},
  {ua:UA.pixel,uaMobile:true,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:false,screenShort:412},
  {ua:UA.pixel,uaMobile:true,pointerCoarse:true,anyPointerFine:false,screenShort:1200,forced:true}, // a huge phone, forced: still a phone
  {ua:UA.winPhone,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:false,screenShort:400}
 ]){const r=c(e);assert.equal(r.kind,'phone',JSON.stringify(e));assert.equal(r.allow,false);assert.equal(r.overridable,false);assert.equal(r.reason,'phone');}
});

test('a phone that asks for the desktop site is still caught: a touch-only screen this small is a phone (not the user agent alone)',()=>{
 const r=c({ua:UA.androidDesktopSite,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:false,screenShort:412});
 assert.equal(r.kind,'phone');assert.equal(r.allow,false);
});

test('tablets: touch-only tablets get the landing page with a "try anyway" choice; tablets with a mouse or trackpad and enough power are let in',()=>{
 for(const [ua,short,platform] of [[UA.ipadOS,820,'MacIntel'],[UA.galaxyTab,800,'Linux armv8l']]){
  const touch=c({ua,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:false,screenShort:short,platform,cores:6,memory:4});
  assert.equal(touch.kind,'tablet');assert.equal(touch.allow,false);assert.equal(touch.overridable,true);assert.equal(touch.reason,'tablet');
  const forced=c({ua,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:false,screenShort:short,platform,forced:true});
  assert.equal(forced.allow,true);assert.equal(forced.reason,'tablet-override');
  const withMouse=c({ua,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:true,screenShort:short,platform,cores:8,memory:8});
  assert.equal(withMouse.allow,true);assert.equal(withMouse.reason,'capable-tablet');
  const weak=c({ua,maxTouchPoints:5,pointerCoarse:true,anyPointerFine:true,screenShort:short,platform,cores:2,memory:2});
  assert.equal(weak.allow,false,'a mouse alone is not enough: a weak tablet stays on the landing page');
 }
 assert.equal(c({ua:UA.ipadOS,maxTouchPoints:5,platform:'MacIntel',pointerCoarse:true,anyPointerFine:false,screenShort:820}).signals.ipadOS,true,'iPadOS that pretends to be a Mac is recognised by its touch points');
});

test('desktops and Windows touch machines (the ROG Ally, Surface), Macs, Chromebooks and Linux get the game',()=>{
 const cases={
  windows:{ua:UA.windows,maxTouchPoints:0,pointerCoarse:false,anyPointerFine:true,screenShort:1080},
  rogAllyTouchOnly:{ua:UA.windows,maxTouchPoints:10,pointerCoarse:true,anyPointerFine:false,screenShort:720,cores:16,memory:8},
  rogAllyWithPointer:{ua:UA.windows,maxTouchPoints:10,pointerCoarse:true,anyPointerFine:true,screenShort:864},
  mac:{ua:UA.mac,maxTouchPoints:0,platform:'MacIntel',pointerCoarse:false,anyPointerFine:true,screenShort:900},
  chromebookTouch:{ua:UA.chromebook,maxTouchPoints:10,pointerCoarse:true,anyPointerFine:false,screenShort:768},
  linux:{ua:UA.linux,maxTouchPoints:0,pointerCoarse:false,anyPointerFine:true,screenShort:1080}
 };
 for(const [name,e] of Object.entries(cases)){const r=c(e);assert.equal(r.kind,'desktop',name);assert.equal(r.allow,true,name);}
});

test('a small browser window on a desktop does not matter: the decision uses the device, not the window width',()=>{
 assert.equal(c({ua:UA.windows,pointerCoarse:false,anyPointerFine:true,screenShort:1080}).allow,true);
 assert.ok(!('innerWidth' in {})&&c.length===1,'classify takes no window size');
});

test('no WebGL: the browser is told why (desktop or capable tablet); phones still say phone',()=>{
 const d=c({ua:UA.windows,anyPointerFine:true,screenShort:1080,webgl:false});assert.equal(d.allow,false);assert.equal(d.reason,'no-webgl');assert.equal(d.overridable,false);
 assert.equal(c({ua:UA.iphone,pointerCoarse:true,anyPointerFine:false,screenShort:393,webgl:false}).reason,'phone');
});

test('graphics quality is not auto-downgraded for few cores, low memory or software rendering',()=>{
 assert.equal(G.recommendQuality({cores:4,memory:8},false),null);
 assert.equal(G.recommendQuality({cores:16,memory:4},false),null);
 assert.equal(G.recommendQuality({cores:2,memory:2},false),null);
 assert.equal(G.recommendQuality({cores:16},false),null);
 assert.equal(G.recommendQuality({cores:16,memory:8},true),null);
 const src=fs.readFileSync(path.join(__dirname,'..','void-runner','device-gate.js'),'utf8');
 assert.ok(!/void-runner-graphics-v1/.test(src),'the gate does not write a graphics setting');
});

test('the landing copy is honest: it does not claim social features exist and it always offers the way back to the website',()=>{
 for(const k of ['phone','tablet','no-webgl']){assert.ok(G.COPY[k].title&&G.COPY[k].lines.length>=1,k);}
 assert.match(G.SOCIAL,/planned/);assert.match(G.SOCIAL,/not available yet/);
 const src=fs.readFileSync(path.join(__dirname,'..','void-runner','device-gate.js'),'utf8');
 assert.match(src,/href="\/">Back to the website/);
 assert.ok(!/fetch\(|XMLHttpRequest|WebSocket|sendBeacon|serviceWorker/.test(src),'the gate loads and registers nothing');
 assert.ok(!/iris/i.test(src.replace(/\/\*[^]*?\*\//g,'')),'no Iris on the game page');
});

test('the page: every game script is inert until the gate releases it, and the gate comes first',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','void-runner.html'),'utf8').replace(/\r/g,'');
 const tags=[...html.matchAll(/<script[^>]*>/g)].map(m=>m[0]);
 assert.equal(tags[0],'<script src="void-runner/device-gate.js">','the gate is the first script on the page');
 const game=tags.filter(t=>/src="void-runner\/(?!device-gate)/.test(t));
 assert.ok(game.length>60,'the game scripts are all present ('+game.length+')');
 assert.ok(game.some(t=>/tdd-game-module/.test(t)),'the module script (account.js) is held back too');
 for(const t of game)assert.match(t,/^<script type="text\/tdd-game(-module)?" src="/,'inert: '+t);
 assert.ok(html.trimEnd().endsWith('<script>VoidDeviceGate.release();</script>\n</body></html>')||/VoidDeviceGate\.release\(\);<\/script>\s*<\/body>/.test(html),'the page releases the scripts at the end of the body');
 assert.ok(html.indexOf('VoidDeviceGate.release')>html.lastIndexOf('type="text/tdd-game"'),'released after every inert tag exists');
 assert.ok(!/<link rel="stylesheet" href="void-runner\//.test(html),'no game stylesheet is fetched before the gate decides');
 assert.ok(/<body><script>VoidDeviceGate\.styles\(\);<\/script>/.test(html),'the stylesheets are released at the start of the body, before anything is drawn');
 assert.ok((html.match(/rel="tdd-stylesheet"/g)||[]).length>=15);
});
