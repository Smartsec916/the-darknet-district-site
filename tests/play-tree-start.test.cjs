/* PLAY FROM THE START OF THIS TREE and the always-shown "Apartments for this mission" panel (19 Nov 2026). The browser walkthrough is tests/play-tree-start-browser.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8');
const s=src('mission-editor.js');
test('the apartments panel is always added to a tree mission card (no condition on the street scene or the script), with a loading note while the doors are not ready',()=>{
 assert.match(s,/\n  card\.append\(aptPanel\(t,m,ed\)\);/);assert.doesNotMatch(s,/if\(root\.VoidApartments\?\.doors\)card\.append/);
 const p=s.slice(s.indexOf(' function aptPanel(t,m,ed){'),s.indexOf(' function aptPanel(t,m,ed){')+1400);assert.match(p,/if\(!aptReady\(\)\)\{box\.append\(el\('p',aptFail\?[^]*'Loading the street doors…'/);assert.match(p,/aptEnsure\(\)\.then/);
 assert.match(s,/\['VoidApartments','void-runner\/apartments\.js'\]/);
 // a mission of the older game data says where apartments go and offers the copy
 assert.match(s,/'data-me-apt-other':m\.key/);assert.match(s,/btn\('COPY THIS MISSION INTO A NEW TREE',\(\)=>copyInto\(\[m\],m\.title\)/);});
test('apartments.js: the door list is pure data and an early call (before ncz-quarters.js) never freezes an empty list',()=>{
 const X=require('../void-runner/apartments.js');assert.ok(X.doors().length>40);assert.match(src('apartments.js'),/if\(Q&&CT\(\)&&out\.length\)cache=out;return out;\}/);});
test('PLAY FROM THE START OF THIS TREE: on the tree header and beside every PLAY THIS DRAFT; it plays the first mission with nothing of the tree done and a clean session',()=>{
 assert.match(s,/if\(raw\.missions\.length\)\{const r=el\('div','','me-row me-actions',\{'data-me-tree-start-row':t\.id\}\);r\.append\(startBtn\(raw\),hint\(HELP\.playStart\)\)/);
 assert.match(s,/act\.append\(btn\('PLAY THIS DRAFT',\(\)=>play\('tree:'\+m\.id,null\),'me-play',[^\n]*\),startBtn\(raw\),hint\(HELP\.play\)\);card\.append\(act\);/);
 assert.match(s,/btn\('PLAY FROM THE START OF THIS TREE',\(\)=>playStart\(raw\.id\)/);
 assert.match(s,/function playStart\(treeId\)\{fresh\(\);[^]*?return play\('tree:'\+f\.id,null,\{tree:raw\}\);\}/);
 // treeState with no step: a brand-new campaign, missions before the first one: none
 const ts=s.slice(s.indexOf(' function treeState('));assert.match(ts,/s=C\.startDistrictCampaign\(C\.fresh\(\)\)/);
 // every draft session forgets what the running game kept in memory
 assert.match(s,/root\.VoidLiveContent\?\.resetRun\?\.\(\);root\.VoidApartments\?\.resetRun\?\.\(\);/);
 assert.match(src('live-content.js'),/function resetRun\(\)\{for\(const o of \[animRun,timerLeft,promptAt,needAt,nearD\]\)/);assert.match(src('apartment-integration.js'),/resetRun\(\)\{preview=null;for\(const x of \[screenOff,screenSet,lightOff,lightSet\]\)x\.clear\(\);\}/);
 assert.match(s,/HELP\.playStart|playStart:'PLAY FROM THE START OF THIS TREE: /);assert.match(s,/shared=\{[^]*playTree\(id,step\)\{return play\('tree:'\+id,step\|\|null\);\},playStart,fresh,/);});
test('Make a mission: one optional apartment on the steps page and the step "Go into the mission’s apartment"',()=>{
 const W=require('../void-runner/editor-wizard.js'),T=require('../void-runner/mission-trees.js'),MC=require('../void-runner/mission-content.js'),X=require('../void-runner/apartments.js');
 assert.deepEqual(W.PAGES.map(p=>p.id),['kind','giver','start','steps','reward','name'],'no new page: the apartment is on the steps page');
 const g=[{id:'admin',canTalk:true,draft:true,players:true},{id:'iris',canTalk:true,draft:true,players:true}],a=W.fresh('talk');a.giver='admin';a.steps[0].npc='iris';assert.equal(a.apt,null);
 a.steps.push({kind:'apt-enter',npc:'',place:'',label:'',auto:true});W.relabel(a,{});assert.match(W.problems(a,'steps',{givers:g}).join(' '),/no apartment yet/);
 a.apt={style:'normal',door:''};assert.match(W.problems(a,'steps',{givers:g}).join(' '),/choose its street door/);
 a.apt.door='apt-nowhere-n-1';assert.match(W.problems(a,'steps',{givers:g}).join(' '),/not in the game/);
 const d0=X.doors().find(d=>(d.family||'city')==='city');a.apt.door=d0.id;assert.deepEqual(W.problems(a,'steps',{givers:g}),[]);
 a.title='Flat';const r=W.build({trees:[]},a,{T,number:7});assert.deepEqual(r.mission.apartments,[{id:'a1',style:'normal',door:d0.id}]);
 const o=r.mission.objectives[1];assert.equal(o.kind,'apt-enter');assert.equal(o.apt,'a1');assert.equal(o.npc,undefined);assert.equal(o.label,'Go into the apartment');
 assert.deepEqual(MC.treeBlockers(r.mission,g,new Set()),[]);assert.deepEqual(X.problems(r.mission),[]);
 // no apartment: nothing added
 const b=W.fresh('talk');b.giver='admin';b.steps[0].npc='iris';b.title='x';W.relabel(b,{});assert.equal(W.build({trees:[]},b,{T,number:8}).mission.apartments,undefined);
 const h=src('editor-home.js');assert.match(h,/box\.append\(aptBox\(a\)\);\}/);assert.match(h,/'Loading the street doors…'/);assert.match(h,/'data-eh-apt-add':'1'/);});
