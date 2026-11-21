/* Awakening QA (20 Nov 2026): the fixes from the full playthrough of Missions 004-012. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),src=p=>fs.readFileSync(R(p),'utf8');
function env(){for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),DP=require(R('void-runner/district-people.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(src('tools/audio/npc-voice-registry.json')),people:DP.npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC};}
const hintFor=(()=>{const s=src('void-runner/mission-guide.js');return new Function(s.slice(s.indexOf(' function hintFor('),s.indexOf(' let shown=\'\';'))+';return hintFor;')();})();

test('a missed call does not ring later; waiting calls ring oldest first',()=>{const D=require(R('void-runner/device-v1.js'));
 // newest first, as the V1 inbox lists them
 assert.equal(D.nextCall([{id:'m004/start',at:900,read:true},{id:'m002/enter-null',at:500,read:false}]),null,'an unread call older than the last one heard is a missed call');
 assert.equal(D.nextCall([{id:'m005/start',at:903,read:false},{id:'m004/report',at:900,read:false},{id:'m004/travel',at:600,read:true}]).id,'m004/report','Fish\'s reply before Iris\'s next call');
 assert.equal(D.nextCall([]),null);assert.equal(D.nextCall([{id:'a',at:1,read:false}]).id,'a');
 assert.match(src('void-runner/personal-device.js'),/function startCall\(\)\{const fresh=D\.nextCall\(inbox\('comms'\)\)/);});

test('a report made from the V1 has no arrow to the person; a leave step leads out',()=>{const x=env();
 const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;
 const ev=e=>x.MC.treeEvent(s,x.e,e,x.M,x.C);ev({type:'pod-exit',at:1});ev({type:'talk',npcs:['admin']});ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m002-eyes-on-the-street'});ev({type:'place',places:['null']});
 ev({type:'photo',subjects:['juno-vex','halden-reyes']});ev({type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:['m002-eyes-on-the-street/photograph'],place:'null',at:1}});
 ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m003-corporate-connections'});ev({type:'place',places:['milked']});ev({type:'talk',npcs:['milked-eva']});ev({type:'talk',npcs:['milked-fish']});
 s.story.flags.gameMin=(Number(s.story.flags.gameMin)||0)+361;ev({type:'place',places:['far-south']});ev({type:'place',places:['underground','under-tea-room']});
 for(const k of ['locate','blend-in'])ev({type:'observe',step:'m004-a-promising-investment/'+k});ev({type:'overhear',step:'m004-a-promising-investment/overhear'});
 const g=()=>{const m=x.M.tracked(s,x.C);return x.M.guidance(s,m,true);};
 assert.deepEqual(g(),{kind:'instruction',label:'Report the information to Fish (V1 Mission Log: REPORT TO FISH).'},'no arrow to Fish at Milked');
 ev({type:'report',step:'m004-a-promising-investment/report'});ev({type:'place',places:['avenue']});ev({type:'place',places:['avenue']});
 ev({type:'place',places:['avenue'],apt:'m005-behind-closed-doors/reyes',mod:'hall'});ev({type:'hack',ap:'reyes/hall.d0',mission:'m005-behind-closed-doors'});ev({type:'place',places:['avenue'],apt:'m005-behind-closed-doors/reyes',mod:'flat'});
 ev({type:'apt-use',mission:'m005-behind-closed-doors',apt:'reyes',object:'computer',mod:'flat'});ev({type:'collect',step:'m005-behind-closed-doors/copy'});
 assert.equal(g().apt.kind,'apt-leave','"Leave the apartment" is guided as a way out (mission-guide.js aptGoal)');
 ev({type:'place',places:['avenue']});assert.equal(g().kind,'instruction','the report to Admin is made from the V1');assert.equal(g().interaction,undefined);
 // a hand-over in person (Mission 011) still leads to its place
 const m11=x.e.trees.flatMap(t=>t.missions).find(m=>m.id==='m011-leverage');assert.equal(m11.objectives.find(o=>o.id==='deliver').place,'district-meeting');
 const mg=src('void-runner/mission-guide.js');assert.match(mg,/if\(x\.kind==='apt-leave'\)\{const w=wayOut\(\);if\(w\)return w;\}/);
 assert.match(mg,/walkingLocation\.id!=='neochinatown'&&walkingLocation\.id!=='corporate'/,'the Corporate District door and facility (Mission 009) are guided');
 assert.match(mg,/const into=here\(i=>i\.action==='mod-portal'&&String\(i\.door\|\|''\)\.split\('\|'\)\.some\(p=>p\.split\('\.'\)\[0\]===mod\)\)/,'a hallway door straight into the apartment');
 assert.match(mg,/\|\|here\(i=>i\.action==='apt-use'&&i\.object===x\.object\)/,'an apartment\'s things behind a modular hallway');
 assert.match(mg,/position:i\.action==='mod-elev'\?cabOf\(i\.position\.slice\(\)\)/,'a lift button: the middle of the cab');});

test('the hint line names the key and the button for Mission Log steps and the V1 app step',()=>{
 const v=(o={})=>({step:{kind:'report',npc:'milked-fish'},deviceOpen:false,app:null,thread:null,attach:{},camera:false,feed:false,key:'L',name:id=>id==='milked-fish'?'Fish':id,...o});
 assert.equal(hintFor(v()).text,'Press <b>L</b> to open your V1, then <b>Mission Log</b>');
 assert.equal(hintFor(v({deviceOpen:true})).text,'Open <b>Mission Log</b>');assert.equal(hintFor(v({deviceOpen:true,app:'camera'})).id,'app');
 assert.equal(hintFor(v({deviceOpen:true,app:'missions'})).text,'Press <b>REPORT TO FISH</b> on this mission');
 assert.equal(hintFor(v({step:{kind:'report',npc:'admin',place:'district-meeting'}})),null,'a hand-over in person: the arrow leads first');
 assert.equal(hintFor(v({step:{kind:'feed',feed:'br-04'},deviceOpen:true,app:'missions'})).text,'Press <b>OPEN REMOTE FEED</b> on this mission');
 assert.equal(hintFor(v({step:{kind:'feed',feed:'br-04'},feed:true})),null,'nothing while the feed is on screen');
 assert.equal(hintFor(v({step:{kind:'v1-app',app:'loadout'}})).text,'Press <b>L</b> to open your V1, then <b>Ship Loadout</b>');
 assert.equal(hintFor(v({step:{kind:'call'}})).text,'A call is coming in on your V1 · answer it with <b>L</b>');assert.equal(hintFor(v({step:{kind:'call'},deviceOpen:true})),null);
 const D=require(R('void-runner/device-v1.js'));assert.equal(D.stepApp({kind:'report'}),'missions');assert.equal(D.stepApp({kind:'feed'}),'missions');assert.equal(D.stepApp({kind:'v1-app',app:'loadout'}),'loadout');});

test('small clarity fixes are wired',()=>{
 assert.match(src('void-runner/apartment-integration.js'),/walked away from the access point\. Go back and press E at it to try again\./);
 const mg=src('void-runner/mission-mechanics-game.js');assert.match(mg,/Too far away to hear them\. Move closer/);assert.match(mg,/z\.o\.object===x\.o\.object&&z\.o\.apt===x\.o\.apt\);if\(y&&md\(\)==='walking'\)openDoc\(y\)/);
 assert.match(src('void-runner/personal-device.js'),/PLACE\?\.get\(id\)\|\|root\.VoidPlaces\?\.BY\?\.get\?\.\(id\)/);
 const css=src('void-runner/device-v1.css');assert.match(css,/body\.v1-side #notice\{left:264px;right:calc\(50vw \+ 12px\)\}/);assert.match(css,/body\.v1-side #mission-tracker:not\(\[hidden\]\)\{top:150px\}body\.v1-side #mission-hint:not\(\[hidden\]\)\{top:192px\}/);
 assert.match(src('void-runner/world-integration.js'),/if\(c\.textContent!==state\.credits\.toLocaleString\(\)\|\|n&&n\.textContent!==want\)hud\(\);/);});

test('a pilot already docked at Meridian is not stuck on "take off" / "make the jump" (Kestrel tutorial)',()=>{const MM=require(R('void-runner/mission-mechanics.js')),MS=require(R('void-runner/main-story.js'));
 const ob=MS.M012.objectives,launch=ob.find(o=>o.id==='set-course'),jump=ob.find(o=>o.id==='jump');assert.equal(jump.place,'meridian');
 // the catch-up events the game sends when the player is already at the jump's place: they complete those steps
 const m={id:MS.M012.id},h=(o,ev)=>MM.hit(ev,m,o,{story:{flags:{}},universe:{missions:{}}});assert.ok(h(launch,{type:'flight',stage:'launch',place:'meridian'}));assert.ok(h(jump,{type:'flight',stage:'jump',place:'meridian'}));assert.ok(!h(jump,{type:'flight',stage:'jump',place:'kepler'}));
 const g=src('void-runner/mission-mechanics-game.js');assert.match(g,/else if\(\(o\.stage==='launch'\|\|o\.stage==='jump'\)&&\['walking','dock','arrival'\]\.includes\(m\)&&s\.location!=='earth'\)/);});

test('the arrow\'s detour corners round furniture are walkable (clear of the walker\'s 0.38 m radius)',()=>{const GR=require(R('void-runner/guide-route.js'));
 // Mission 006's cubicle gap: a thin partition (x 599.0-600.9, z 596) beside the way into the office aisle
 const solids=[{id:'cube',position:[599.95,.63,596],size:[1.9,1.25,.06]},{id:'cube-w',position:[596.1,.63,596],size:[1.8,1.25,.06]}];
 const G=GR.modular({mods:[{id:'office',cx:601,cz:595,w:6,d:5}],doors:[]},solids);
 const pts=G.cross({x:598.6,z:598},{x:601,z:595})||[];assert.ok(pts.length,'a detour round the partition');
 for(const p of pts)for(const s of solids)assert.ok(!(Math.abs(p.x-s.position[0])<s.size[0]/2+.38&&Math.abs(p.z-s.position[2])<s.size[2]/2+.38),'corner '+p.id+' is inside the walker\'s collision of '+s.id);});
