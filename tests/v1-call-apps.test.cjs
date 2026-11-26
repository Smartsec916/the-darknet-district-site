/* The V1 during a call and the mission app hint (the owner, 20 Nov 2026: "when you press L it goes to Comms instead of the Apps page, because Admin is using Comms"):
   pressing L with a call waiting opens the V1's home with the call going on in a call bar, the app the mission step wants glows in the mission yellow, and every
   mission hint uses the arrow's yellow (guide-route.js COLOR). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),src=p=>fs.readFileSync(R(p),'utf8');
const D=require(R('void-runner/device-v1.js'));

test('opening the V1 with a Comms call waiting goes to the home screen; other notifications still open their app',()=>{
 assert.equal(D.openTarget({app:'comms',sub:'call'}),null);
 assert.equal(D.openTarget({app:'comms'}),null);
 assert.deepEqual(D.openTarget({app:'messages',sub:'inbox'}),{app:'messages',sub:'inbox'});
 assert.deepEqual(D.openTarget({app:'missions'}),{app:'missions',sub:null});
 assert.equal(D.openTarget(null),null);
 const pd=src('void-runner/personal-device.js');
 assert.match(pd,/pending=D\.openTarget\?D\.openTarget\(noteApp\)/,'the open-on-notification wrapper asks openTarget');
 assert.match(pd,/if\(v&&open\)\{notes=0;noteApp=null;hideBanner\(\);startCall\(\);/,'opening the V1 answers the waiting call');
 assert.match(pd,/const show=live&&open&&stack\[0\]!=='comms'/,'the call bar shows on every screen but Comms');
 assert.match(pd,/if\(t\.dataset\.callOpen\)\{if\(stack\[0\]!=='comms'\)go\(\['comms'\],'open'\)/,'the call bar opens the full call');
 assert.doesNotMatch(pd,/const calls=inbox\('comms'\),fresh=calls\.find/,'Comms no longer starts its own copy of the call');
});

test('the call bar line follows the Comms transcript timing',()=>{
 assert.equal(D.callLine(6,0),-1);assert.equal(D.callLine(6,399),-1);assert.equal(D.callLine(6,400),0);assert.equal(D.callLine(6,2599),0);assert.equal(D.callLine(6,2600),1);
 assert.equal(D.callLine(6,60000),5);assert.equal(D.callLine(0,5000),-1);
});

test('the app a mission step wants: its own app, else what its kind implies',()=>{
 assert.equal(D.stepApp({kind:'photo'}),'camera');
 assert.equal(D.stepApp({kind:'send-photo'}),'messages');
 assert.equal(D.stepApp({kind:'talk'}),null);
 assert.equal(D.stepApp({kind:'talk',app:'map'}),'map');
 assert.equal(D.stepApp({kind:'photo',app:'gallery'}),'gallery');
 assert.equal(D.stepApp({kind:'photo',app:'not-an-app'}),'camera');
 assert.equal(D.stepApp(null),null);
 assert.deepEqual(D.appGoal({kind:'photo'},'Admin'),{app:'camera',title:'CAMERA',text:'ADMIN: OPEN CAMERA'});
 assert.equal(D.appGoal({kind:'photo'},'').text,'OPEN CAMERA');
 assert.equal(D.appGoal({kind:'talk'},'Admin'),null);
 for(const id of D.STEP_APPS)assert.ok(D.APPS[id],id+' is a V1 app');
 // Mission 002: entering NULL brings Admin's call; the step after it (the photograph) lights the Camera
 const MS=require(R('void-runner/main-story.js')),m=MS.EYES;
 const i=m.objectives.findIndex(o=>o.id==='enter-null');assert.equal(m.objectives[i].via,'comms');
 assert.equal(m.objectives[i].say[0].text,'Your V1 has a camera. Press L to open your device, then select the Camera app.','the approved line is unchanged');
 assert.equal(D.stepApp(m.objectives[i+1]),'camera');
});

test('the optional step field `app`: kept by the game, checked by the editor rules and the server alike',()=>{
 const MC=require(R('void-runner/mission-content.js'));
 assert.deepEqual(MC.STEP_APPS,D.STEP_APPS);
 const py=src('void_runner_live_content.py'),list=JSON.parse(py.match(/^STEP_APPS = (\[.*\])$/m)[1].replace(/'/g,'"'));
 assert.deepEqual(list,D.STEP_APPS);
 assert.match(py,/'wrong', 'via', 'app', 'clip'/);
 const m={id:'draft-x',title:'X',type:'side',giver:'admin',objectives:[{id:'a',label:'Look',kind:'go',place:'null',app:'map'},{id:'b',label:'Look',kind:'go',place:'null',app:'bogus'},{id:'c',label:'Look',kind:'go',place:'null'}]};
 const r=MC.treeStrip(m);assert.equal(r.objectives[0].app,'map');assert.equal(r.objectives[1].app,undefined);assert.equal(r.objectives[2].app,undefined);
 assert.match(src('void-runner/mission-editor.js'),/data-me-step-app/);
});

test('mission hints use the arrow yellow from one place',()=>{
 const G=require(R('void-runner/guide-route.js'));
 assert.equal(G.COLOR.rgb,'255,214,120');assert.equal(G.COLOR.hex,'#ffd678');
 const wi=src('void-runner/world-integration.js');
 assert.match(wi,/const MISSION_YELLOW=VoidGuideRoute\.COLOR;/);assert.equal(G.ENCOUNTER_COLOR.hex,'#2ee6cf');assert.match(wi,/goal\.encounter\?VoidGuideRoute\.ENCOUNTER_COLOR:MISSION_YELLOW/);assert.match(wi,/ctx\.fillStyle='rgba\('\+guideColor\.rgb\+','/);assert.match(wi,/setProperty\('--mission-yellow',MISSION_YELLOW\.hex\)/);
 const mg=src('void-runner/mission-guide.js');assert.doesNotMatch(mg,/#ffc35c|#ff9f2e|#ffe08a|#f2b33d/);assert.match(mg,/color:var\(--mission-yellow/);
 const wm=src('void-runner/world-markers.js');assert.doesNotMatch(wm,/#ffd23f|#f2b33d/);
 const css=src('void-runner/device-v1.css');assert.match(css,/\.pd-app\.pd-goal::after\{[^}]*var\(--mission-yellow/);assert.match(css,/\.pd-goalhint\{[^}]*color:var\(--mission-yellow/);assert.match(css,/:not\(#pd-callpill\)/);
 assert.match(src('void-runner/modern.css'),/#mission-tracker:not\(\[hidden\]\)\{[^}]*var\(--mission-yellow/);
});
