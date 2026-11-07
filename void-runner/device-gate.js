/* Device gate: decides, before any game file is downloaded, whether this device gets the 3D game or a landing page.
   The game is a desktop experience. Phones never start it. Tablets start it only when they look like a computer (a mouse or trackpad is attached, enough
   cores and memory, WebGL works). A browser without WebGL gets an explanation. The decision uses several signals (pointer type, screen size, platform and
   user agent, input hardware, memory and cores, WebGL), never one alone, and the ROG Ally and other Windows touch machines count as desktops.
   How it is used (void-runner.html): this script runs first, in the head. Every game script tag in the page is marked type="text/tdd-game" and every game stylesheet rel="tdd-stylesheet", so the
   browser neither downloads nor runs them. At the end of the body, release() either writes those tags back in their original order (desktop: the game starts
   exactly as it always did) or shows the landing page (nothing of the game is downloaded and no service worker is registered).
   classify() is pure and unit-tested (tests/device-gate.test.cjs). Nothing here touches saves, accounts or the network. */
(function(root){
 'use strict';
 const PHONE_UA=/iPhone|iPod|Windows Phone|Android.*\bMobile\b|\bMobile\b.*Firefox|BlackBerry|Opera Mini|IEMobile|webOS/i;
 const TABLET_UA=/iPad|Tablet|Silk|PlayBook|Kindle|Nexus 7|Nexus 9|SM-T|Android(?!.*\bMobile\b)/i;
 const SHORT_SIDE_PHONE=500,SHORT_SIDE_TABLET=1100;

 /* env: {ua, platform, maxTouchPoints, uaMobile, pointerCoarse, anyPointerFine, screenShort, cores, memory, webgl, forced}
    Returns {kind:'desktop'|'tablet'|'phone', allow, reason, overridable, signals}. */
 function classify(env){
  const e=Object.assign({ua:'',platform:'',maxTouchPoints:0,uaMobile:undefined,pointerCoarse:false,anyPointerFine:true,screenShort:1080,cores:8,memory:undefined,webgl:true,forced:false},env||{});
  const windows=/Windows NT/i.test(e.ua)&&!/Windows Phone/i.test(e.ua),cros=/\bCrOS\b/.test(e.ua);
  const ipadOS=/Macintosh/i.test(e.ua)&&e.maxTouchPoints>1&&/Mac/i.test(e.platform||'MacIntel'); /* iPadOS 13+ says it is a Mac */
  const touchOnly=!!e.pointerCoarse&&!e.anyPointerFine;
  const signals={windows,cros,ipadOS,touchOnly,phoneUA:PHONE_UA.test(e.ua),tabletUA:TABLET_UA.test(e.ua)||ipadOS,uaMobile:e.uaMobile,screenShort:e.screenShort};
  let kind='desktop';
  if(!windows&&!cros&&(signals.phoneUA||(e.uaMobile===true&&!signals.tabletUA)||(touchOnly&&e.screenShort<=SHORT_SIDE_PHONE)))kind='phone';
  else if(!windows&&!cros&&(signals.tabletUA||(touchOnly&&e.screenShort<=SHORT_SIDE_TABLET)))kind='tablet';
  if(kind==='phone')return {kind,allow:false,reason:'phone',overridable:false,signals};
  if(!e.webgl)return {kind,allow:false,reason:'no-webgl',overridable:false,signals};
  if(kind==='tablet'){
   const capable=!!e.anyPointerFine&&e.cores>=4&&(e.memory===undefined||e.memory>=4);
   if(capable||e.forced)return {kind,allow:true,reason:capable?'capable-tablet':'tablet-override',overridable:false,signals};
   return {kind,allow:false,reason:'tablet',overridable:true,signals};
  }
  return {kind,allow:true,reason:'desktop',overridable:false,signals};
 }

 /* A weak machine starts on Low graphics, once, and only if the player has never chosen (the Settings menu always wins afterwards). */
 function recommendQuality(env,softwareRenderer){
  const e=Object.assign({cores:8,memory:undefined},env||{});
  return (e.cores<=4||(e.memory!==undefined&&e.memory<=4)||softwareRenderer)?'low':null;
 }

 const COPY={
  phone:{title:'The Darknet District is a desktop experience',lines:['The 3D game is built for desktop computers, with a keyboard and mouse or a gamepad. It does not run on phones.','Open this page on a computer to walk into the District. Your phone keeps the full website.']},
  tablet:{title:'This tablet is not set up for the 3D game',lines:['The 3D game needs a computer-class device: a mouse or trackpad, enough memory and a recent browser.','Open this page on a desktop or laptop computer to enter the District.']},
  'no-webgl':{title:'This browser cannot draw the 3D world',lines:['The game needs WebGL, and it is switched off or unavailable here.','Try a current version of Edge, Chrome or Firefox on a desktop computer, with hardware acceleration turned on.']}
 };
 const SOCIAL='Chat, direct messages, friends and the player directory are planned for the website. They are not available yet.';

 function readEnv(){
  const n=root.navigator||{},mm=q=>{try{return !!root.matchMedia&&root.matchMedia(q).matches;}catch(e){return false;}},screenRef=root.screen||{};
  let webgl=false,renderer='';
  try{const c=root.document.createElement('canvas'),gl=c.getContext('webgl2')||c.getContext('webgl')||c.getContext('experimental-webgl');webgl=!!gl;
   if(gl){const x=gl.getExtension('WEBGL_debug_renderer_info');if(x)renderer=String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL)||'');const l=gl.getExtension('WEBGL_lose_context');if(l)l.loseContext();}}catch(e){webgl=false;}
  let forced=false;try{forced=root.sessionStorage.getItem('tdd-force-3d')==='1';}catch(e){/* storage blocked */}
  return {env:{ua:n.userAgent||'',platform:n.platform||'',maxTouchPoints:n.maxTouchPoints||0,uaMobile:n.userAgentData&&typeof n.userAgentData.mobile==='boolean'?n.userAgentData.mobile:undefined,
   pointerCoarse:mm('(pointer: coarse)'),anyPointerFine:mm('(any-pointer: fine)'),screenShort:Math.min(screenRef.width||9999,screenRef.height||9999),cores:n.hardwareConcurrency||4,memory:n.deviceMemory,webgl,forced},
   software:/swiftshader|llvmpipe|software/i.test(renderer)};
 }

 const hasDom=!!(root.document&&root.document.documentElement&&root.document.head); /* false in Node (the unit tests): then only classify() is used */
 const decided=!hasDom?{kind:'desktop',allow:true,reason:'no-dom',overridable:false,signals:{},env:{},software:false}:(function(){try{const r=readEnv();const d=classify(r.env);d.env=r.env;d.software=r.software;return d;}catch(e){return {kind:'desktop',allow:true,reason:'gate-error',overridable:false,signals:{},env:{},software:false};}})();
 if(hasDom&&!decided.allow){
  const s=root.document.createElement('style');
  s.textContent='html.tdd-gated body>*:not(#tdd-gate){display:none!important}html.tdd-gated,html.tdd-gated body{height:auto!important;min-height:100%;overflow:auto!important;position:static!important;background:#040713!important}';
  root.document.head.appendChild(s);root.document.documentElement.classList.add('tdd-gated');
 }else if(hasDom){
  /* weak hardware: start on Low once, never over a choice the player made */
  try{const q=recommendQuality(decided.env,decided.software);if(q&&!root.localStorage.getItem('void-runner-graphics-v1'))root.localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q,auto:true}));}catch(e){/* storage blocked */}
 }

 function landing(){
  const d=root.document,copy=COPY[decided.reason]||COPY.phone,box=d.createElement('main');box.id='tdd-gate';box.setAttribute('aria-labelledby','tdd-gate-title');
  box.innerHTML='<style>#tdd-gate{box-sizing:border-box;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;padding:32px 20px;text-align:center;color:#d9f7ec;font:16px/1.55 "Courier New",Courier,monospace;background:radial-gradient(ellipse at 50% 0,rgba(0,255,157,.12),transparent 60%),#040713}'
   +'#tdd-gate .kicker{margin:0;font-size:12px;letter-spacing:.35em;color:#00ff9d}#tdd-gate h1{margin:0;font:700 clamp(1.6rem,7vw,2.6rem)/1.15 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#e4e4e4;text-shadow:-.6px 0 rgba(255,51,102,.55),.6px 0 rgba(0,220,255,.55),0 0 14px rgba(0,255,157,.45)}'
   +'#tdd-gate h2{margin:6px 0 0;font-size:1.05rem;color:#fff}#tdd-gate p{margin:0;max-width:34em;color:#b9d8cf}#tdd-gate .note{font-size:.85rem;color:#7fa89b;border-top:1px solid rgba(0,255,157,.25);padding-top:14px;margin-top:6px}'
   +'#tdd-gate .row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:8px}#tdd-gate a,#tdd-gate button{font:700 13px/1.2 "Courier New",monospace;letter-spacing:.12em;text-transform:uppercase;color:#d6ffe8;background:rgba(3,13,11,.86);border:1px solid #35ff8f;padding:14px 22px;text-decoration:none;cursor:pointer;min-height:48px;display:inline-flex;align-items:center}'
   +'#tdd-gate a:hover,#tdd-gate button:hover{background:rgba(10,48,32,.92);color:#fff}#tdd-gate a:focus-visible,#tdd-gate button:focus-visible{outline:2px solid #fff0c9;outline-offset:3px}</style>'
   +'<p class="kicker">NEOCHINATOWN</p><h1>The Darknet<br>District</h1><h2 id="tdd-gate-title"></h2><div class="copy"></div>'
   +'<div class="row"><a href="/">Back to the website</a></div><p class="note"></p>';
  box.querySelector('#tdd-gate-title').textContent=copy.title;
  const holder=box.querySelector('.copy');for(const line of copy.lines){const p=d.createElement('p');p.textContent=line;holder.appendChild(p);}
  box.querySelector('.note').textContent=SOCIAL;
  if(decided.overridable){const b=d.createElement('button');b.type='button';b.textContent='Try the 3D game on this device anyway';
   b.addEventListener('click',()=>{try{root.sessionStorage.setItem('tdd-force-3d','1');}catch(e){/* storage blocked */}root.location.reload();});box.querySelector('.row').appendChild(b);}
  d.body.appendChild(box);d.title='The Darknet District';
 }

 /* Called by the page at the start of the body: the game's stylesheets (marked rel="tdd-stylesheet", so the browser does not fetch them) are written back as real ones, before anything is drawn. */
 function styles(){
  if(!decided.allow)return false;
  const d=root.document;
  for(const link of [...d.querySelectorAll('link[rel="tdd-stylesheet"][href]')])d.write('<link rel="stylesheet" href="'+link.getAttribute('href').replace(/"/g,'&quot;')+'">');
  return true;
 }

 /* Called by the page, once, at the end of the body. */
 function release(){
  const d=root.document;
  if(!decided.allow){landing();return false;}
  /* Written in place, in document order, so the scripts run exactly as the static tags always did (parser-blocking, in sequence). */
  for(const tag of [...d.querySelectorAll('script[type^="text/tdd-game"][src]')])d.write('<script '+(tag.getAttribute('type')==='text/tdd-game-module'?'type="module" ':'')+'src="'+tag.getAttribute('src').replace(/"/g,'&quot;')+'"><\/script>');
  return true;
 }

 const api={classify,recommendQuality,COPY,SOCIAL,decision:decided,release,styles,SHORT_SIDE_PHONE,SHORT_SIDE_TABLET};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidDeviceGate=api;
})(typeof window!=='undefined'?window:globalThis);
