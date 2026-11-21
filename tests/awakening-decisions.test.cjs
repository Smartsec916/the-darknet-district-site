/* The owner's decisions on the Awakening QA questions (21 Nov 2026): Iris's 005 call a while after Fish's reply, the cockpit calls one after another, SPOTTED on
   Mission 006's way out (a shout, a few seconds to hide, then they open fire), mission things without their everyday description, REPORT keeps the V1 open, and the
   Corporate District's walking routes for the arrow. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),src=p=>fs.readFileSync(R(p),'utf8');
function env(){for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),DP=require(R('void-runner/district-people.js')),MS=require(R('void-runner/main-story.js')),MM=require(R('void-runner/mission-mechanics.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(src('tools/audio/npc-voice-registry.json')),people:DP.npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,MS,MM};}
const ID5='m005-behind-closed-doors',ID4='m004-a-promising-investment',ID6='m006-hostile-takeover';
/* A character who has just reported Mission 004 to Fish. */
function after004(x){const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;
 const ev=e=>x.MC.treeEvent(s,x.e,e,x.M,x.C);ev({type:'pod-exit',at:1});ev({type:'talk',npcs:['admin']});ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m002-eyes-on-the-street'});ev({type:'place',places:['null']});
 ev({type:'photo',subjects:['juno-vex','halden-reyes']});ev({type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:['m002-eyes-on-the-street/photograph'],place:'null',at:1}});
 ev({type:'talk',npcs:['admin']});ev({type:'accept',mission:'m003-corporate-connections'});ev({type:'place',places:['milked']});ev({type:'talk',npcs:['milked-eva']});ev({type:'talk',npcs:['milked-fish']});
 s.story.flags.gameMin=(Number(s.story.flags.gameMin)||0)+361;ev({type:'place',places:['far-south']});ev({type:'place',places:['underground','under-tea-room']});
 for(const k of ['locate','blend-in'])ev({type:'observe',step:ID4+'/'+k});ev({type:'overhear',step:ID4+'/overhear'});return {s,ev};}

test('decision 2: Iris\'s Mission 005 call comes 20 in-game minutes after Fish\'s 004 reply, not in the same second',()=>{const x=env(),{s,ev}=after004(x);
 const m5=x.e.trees.flatMap(t=>t.missions).find(m=>m.id===ID5);assert.deepEqual(m5.start.when,{kind:'game-time',mission:ID4,value:20});
 const rep=ev({type:'report',step:ID4+'/report'});assert.equal(rep.completed,true);assert.equal(rep.messages[0].from,'milked-fish','Fish first');
 assert.ok(!rep.messages.some(m=>m.from==='iris'),'Iris does not call in the same second');
 ev({type:'place',places:['avenue']});assert.equal(s.universe.missions[ID5],undefined,'not yet');
 s.story.flags.gameMin+=19;ev({type:'place',places:['avenue']});assert.equal(s.universe.missions[ID5],undefined,'not after 19 in-game minutes');
 s.story.flags.gameMin+=1;const i5=ev({type:'place',places:['avenue']});assert.equal(i5.offered,true);assert.match(i5.messages[0].text,/^Fish sent me the address\./);
 assert.ok(require(R('void-runner/game-clock.js')).realMinutes(20)<=2,'about a minute or two of play');});

test('decision 2: a save with Mission 005 already offered or running is unaffected',()=>{const x=env(),{s,ev}=after004(x);ev({type:'report',step:ID4+'/report'});
 // an older save: 005 was offered at once (the old trigger); its step in progress stays where it was, through a reload
 s.story.flags.gameMin+=20;ev({type:'place',places:['avenue']});ev({type:'place',places:['avenue']});const r=x.C.restore(JSON.stringify(s));
 assert.equal(r.universe.missions[ID5].acquired,true);assert.equal(r.universe.missions[ID5].objectives['receive-call'],true);
 const r2=x.MC.treeEvent(r,x.e,{type:'place',places:['avenue'],apt:ID5+'/reyes',mod:'hall'},x.M,x.C);assert.equal(r2.objective,'find-105');});

test('decision 3: the four cockpit calls follow one another (2 s after the last call ends), and count in the cockpit',()=>{const x=env(),m=x.MS.M012;
 const d=['cockpit-display','cockpit-controls','cockpit-weapons','cockpit-nav'].map(id=>m.objectives.find(o=>o.id===id).delay);assert.deepEqual(d,[3,2,2,2]);
 assert.ok(d.reduce((a,b)=>a+b,0)<=15,'the waits between them are short; the calls themselves fill the minute');
 const call={kind:'delay',stepKind:'call'},walk={kind:'delay',stepKind:'enter'},wait={kind:'wait'};
 const c=o=>({hidden:false,blocked:true,busy:false,mode:'play',callBusy:false,...o});
 assert.equal(x.MC.timerRuns(call,c()),true,'a call step counts in flight (not on foot)');
 for(const md of ['dock','arrival','walking'])assert.equal(x.MC.timerRuns(call,c({mode:md,blocked:md!=='walking'})),true,md);
 assert.equal(x.MC.timerRuns(call,c({callBusy:true})),false,'it waits while the call before it is being heard');
 assert.equal(x.MC.timerRuns(call,c({busy:true})),false,'never in a conversation, menu or the pod card');
 assert.equal(x.MC.timerRuns(call,c({hidden:true})),false,'never in a hidden tab');
 assert.equal(x.MC.timerRuns(call,c({mode:'menu'})),false);
 assert.equal(x.MC.timerRuns(walk,c()),false,'every other delay: on foot only, as before');assert.equal(x.MC.timerRuns(walk,c({blocked:false,mode:'walking'})),true);
 assert.equal(x.MC.timerRuns(wait,c({blocked:false,mode:'walking',callBusy:true})),true,'a wait step does not care about calls');
 const lc=src('void-runner/live-content.js');assert.match(lc,/if\(MC\.timerRuns\?!MC\.timerRuns\(x,ctx\):ctx\.blocked\)continue;/);assert.match(lc,/const c=root\.VoidV1\?\.call,n=root\.VoidVoiceClips\?\.now;return !!\(c&&!c\.ended\)\|\|!!\(n&&!n\.ended\)/);});

test('decision 3: the timers list says which kind of step a delay is for; the walkthrough still runs and the soft-lock guard stays',()=>{const x=env(),s=x.C.startDistrictCampaign(x.C.fresh());
 const m=x.MS.M012,rec={acquired:true,completed:false,objectives:{}};for(const o of m.objectives){if(o.id==='cockpit-display')break;rec.objectives[o.id]=true;}
 s.universe.missions[m.id]=rec;s.story.flags['ts_first-cargo-delivery']=true;s.story.flags[x.MC.linkFlag?x.MC.linkFlag('first-cargo-delivery'):'tl_first-cargo-delivery']=true;
 const t=x.MC.timersNow(s,x.e).find(y=>y.mission===m.id);assert.ok(t,'the first cockpit call is waiting');assert.equal(t.stepKind,'call');assert.equal(t.total,3);
 assert.match(src('void-runner/mission-mechanics-game.js'),/else if\(\(o\.stage==='launch'\|\|o\.stage==='jump'\)&&\['walking','dock','arrival'\]\.includes\(m\)&&s\.location!=='earth'\)/,'already there: those stages complete');});

test('decision 5: SPOTTED with an alarm: warning, a grace window, out of sight in time or the guards open fire',()=>{const MM=require(R('void-runner/mission-mechanics.js'));
 assert.equal(MM.ALARM.grace,3);let r=MM.spottedStep(null,{spotted:false,seen:true,dt:.25});assert.equal(r.st.phase,'calm');assert.equal(r.warn,false);
 r=MM.spottedStep(r.st,{spotted:true,seen:true,dt:.25});assert.equal(r.warn,true,'just spotted: the shout');assert.equal(r.st.phase,'grace');
 // hides in time (out of sight half a second in a row): back to patrol, nothing more
 let h=MM.spottedStep(JSON.parse(JSON.stringify(r.st)),{seen:true,dt:1});for(let i=0;i<2;i++)h=MM.spottedStep(h.st,{seen:false,dt:.25});assert.equal(h.clear,true);assert.equal(h.st.phase,'calm');
 // ducks out for a moment only: still counts as seen
 let f=MM.spottedStep(JSON.parse(JSON.stringify(r.st)),{seen:false,dt:.25});f=MM.spottedStep(f.st,{seen:true,dt:.25});assert.equal(f.st.phase,'grace');
 // still visible when the grace ends: the alarm, once
 let a={st:JSON.parse(JSON.stringify(r.st))},alarms=0;for(let i=0;i<20;i++){a=MM.spottedStep(a.st,{seen:true,dt:.25});if(a.alarm)alarms++;}assert.equal(alarms,1);assert.equal(a.st.phase,'alarm');
 assert.equal(MM.spottedStep(a.st,{spotted:true,seen:true,dt:.25}).warn,false,'no new warnings during the alarm');
 // tunable
 let g=MM.spottedStep(null,{spotted:true,grace:1});g=MM.spottedStep(g.st,{seen:true,dt:1.01,grace:1});assert.equal(g.alarm,true);});

test('decision 5: onSpotted:\'alarm\' is on Mission 006\'s leave step only; it is a reusable, validated step option',()=>{const x=env(),MM=x.MM;
 const all=x.e.trees.flatMap(t=>t.missions).flatMap(m=>m.objectives.map(o=>({m,o}))).filter(y=>y.o.onSpotted);
 assert.deepEqual(all.map(y=>y.m.id+'/'+y.o.id),[ID6+'/leave']);assert.equal(all[0].o.onSpotted,'alarm');assert.equal(all[0].o.unseen,true);
 const m6=all[0].m;assert.equal(m6.combat.onDeath,'retry');assert.equal(m6.objectives.find(o=>o.id==='avoid-guard').onSpotted,undefined,'other steps: SPOTTED -> outside, as before');
 assert.ok(MM.STEP_FIELDS.includes('onSpotted'));const p=o=>MM.stepProblems(m6,o);
 assert.deepEqual(p({id:'a',kind:'apt-leave',apt:'veyra',unseen:true,onSpotted:'alarm'}),[]);assert.deepEqual(p({id:'a',kind:'sneak',apt:'veyra',onSpotted:'alarm'}),[]);
 assert.equal(p({id:'a',kind:'apt-leave',apt:'veyra',onSpotted:'alarm'}).length,1,'only on a step done without being seen');assert.equal(p({id:'a',kind:'sneak',apt:'veyra',onSpotted:'shout'}).length,1);
 // the shipped tree validates, and the option is kept in what the game reads
 const py=src('void_runner_live_content.py');assert.match(py,/MECH_FIELDS = \['minutes', 'stage', 'evidence', 'unseen', 'close', 'onSpotted'\]/,'the server knows the field');
 const g=src('void-runner/mission-mechanics-game.js');assert.match(g,/if\(x\.o\.onSpotted==='alarm'\)return alarmCheck\(x,r,seen,dt\);/);assert.match(g,/say\('SPOTTED · get out of sight!'\)/);assert.match(g,/R\?\.alarm\?\.\(\)/);
 const z=src('void-runner/zone-integration.js');assert.match(z,/function alarm\(\)\{const r=current\(\);if\(!r\|\|!r\.inside\)return false;Z\.provoke\(esc,r\.key,now\(\),cfg\(\)\)/,'the Neutral rule: the armed people are after the player');
 assert.match(z,/if\(!\(downEl\.dataset\.back==='1'&&MOD\(\)\.reenter&&await MOD\(\)\.reenter\(\)\)\)await MOD\(\)\.backToStreet\(\);/,'taken down: back inside by the way out, so dying never completes the step');
 assert.match(src('void-runner/module-integration.js'),/async function reenter\(\)\{/);
 assert.match(src('void-runner/mission-mechanics-editor.js'),/data-me-step-alarm/,'the Mission Editor offers it on a step done without being seen');});

test('decision 6: the thing a mission step needs shows only the mission content, elsewhere its description stays',()=>{const x=env(),{s,ev}=after004(x);ev({type:'report',step:ID4+'/report'});
 s.story.flags.gameMin+=20;ev({type:'place',places:['avenue']});ev({type:'place',places:['avenue']});ev({type:'place',places:['avenue'],apt:ID5+'/reyes',mod:'hall'});ev({type:'hack',ap:'reyes/hall.d0',mission:ID5});
 const u={mission:ID5,apt:'reyes',object:'computer',mod:'flat'};assert.equal(x.MC.stepWants(s,x.e,u),false,'before the step: the description');
 ev({type:'place',places:['avenue'],apt:ID5+'/reyes',mod:'flat'});assert.equal(x.MC.stepWants(s,x.e,u),true,'"Access Halden\'s computer": no "biometric reader"');
 assert.equal(x.MC.stepWants(s,x.e,{...u,object:'safe'}),false,'the safe beside it keeps its description');
 ev({type:'apt-use',...u});assert.equal(x.MC.stepWants(s,x.e,u),true,'COPY TO V1 (collect at the computer)');
 ev({type:'collect',step:ID5+'/copy'});assert.equal(x.MC.stepWants(s,x.e,u),false,'done: the description again');
 assert.equal(x.MC.stepWants(s,x.e,{mission:'m006-hostile-takeover',apt:'veyra',object:'manager-pc'}),false,'another mission not running');
 assert.match(src('void-runner/apartment-integration.js'),/if\(!\(wl\?\.apt&&!\['lights','screen'\]\.includes\(obj\)&&LC\(\)\?\.stepWants\?\.\(/);
 assert.match(src('void-runner/module-integration.js'),/if\(msg&&!\(wl\?\.apt&&!\['lights','screen'\]\.includes\(obj\)&&LC\(\)\?\.stepWants\?\.\(/);});

test('decision 7: REPORT by Comms keeps the V1 open and plays the reply there; a hand-over in person still closes it',()=>{const MM=require(R('void-runner/mission-mechanics.js')),x=env();
 const st=id=>x.e.trees.flatMap(t=>t.missions).flatMap(m=>m.objectives).find(o=>o.kind==='report'&&o.id===id);
 assert.equal(MM.reportKeepsV1(st('report')),true,'004: REPORT TO FISH');assert.equal(MM.reportKeepsV1(st('send')),true,'005: REPORT TO ADMIN');
 assert.equal(MM.reportKeepsV1({kind:'report',npc:'admin',place:'district-meeting',via:'comms'}),false,'a hand-over in person');assert.equal(MM.reportKeepsV1({kind:'report',npc:'admin'}),false,'a reply in the conversation window');
 const g=src('void-runner/mission-mechanics-game.js');assert.match(g,/if\(!keep\)try\{root\.VoidPersonalDevice\?\.close\?\.\(\);\}catch\{\}/);assert.match(g,/if\(D&&D\.isOpen\)\{D\.openApp\?\.\('comms'\);root\.VoidV1\?\.clear\?\.\(\);\}/);});

test('decision 9: the Corporate District has walking routes: the arrow from the Function Gate follows South Street to the maintenance door',()=>{
 for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];
 const G=require(R('void-runner/guide-route.js')),CO=require(R('void-runner/corporate.js')),g=G.graphFor('corporate');assert.ok(g&&g.portals.length>=10);
 const inBlock=(px,pz)=>CO.BLOCKS.some(b=>px>b.rect[0]+.01&&px<b.rect[1]-.01&&pz>b.rect[2]+.01&&pz<b.rect[3]-.01);
 const legsClear=(from,route)=>{let p=from;for(const w of route){for(let t=0;t<=40;t++){const qx=p.x+(w.x-p.x)*t/40,qz=p.z+(w.z-p.z)*t/40;if(inBlock(qx,qz))return false;}p=w;}return true;};
 const door={x:-40,y:1.7,z:-90.4},from={x:CO.ARRIVAL.spawn[0],z:CO.ARRIVAL.spawn[2]};
 const r=G.plan(g,from,door);assert.ok(r.length>=3);assert.equal(r[0].id,'junction:corp:central:corp:south-street>','first to the top of South Street');assert.ok(legsClear(from,r),'never through a block');
 // a straight line would cut through the Operations block
 assert.equal(legsClear(from,[{x:door.x,z:door.z}]),false);
 // anywhere to anywhere: from the cross streets, the far alleys and the north road
 for(const [a,b] of [[{x:-51,z:70},door],[{x:64,z:-60},door],[{x:0,z:92},{x:64,z:-80}],[{x:-60,z:-40},{x:30,z:24}]]){const rr=G.plan(g,a,{...b,y:1.7});assert.ok(legsClear(a,rr),JSON.stringify(a)+' -> '+JSON.stringify(b));}
 // the follower: from the arrival the arrow points down the plaza toward South Street (west-south-west), not at the door through the buildings
 const f=G.follower(),o=f.update({graph:g,scene:'corporate',player:from,goal:door,key:'m009',dt:.1});assert.equal(o.waypoint.id,'junction:corp:central:corp:south-street>');
 const want=Math.atan2(-14-from.x,-26-from.z);assert.ok(Math.abs(G.wrap(o.bearing-want))<.01);
 // the other scenes are as before
 assert.equal(G.graphFor('temple'),null);assert.ok(G.graphFor('neochinatown'));});

test('the build, the copies and the handoff record all nine decisions',()=>{const sw=src('void-runner-sw.js').split(/\n/);assert.match(sw[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
 assert.equal(src('static/void-runner.html'),src('void-runner.html'));
 const h=src('docs/development/AI_HANDOFF.md'),v=src('VOID_RUNNER_HANDOFF.md');for(const t of [h,v])assert.match(t,/Awakening QA decisions/i);});
