/* The reusable mission mechanics (mission-mechanics.js, 20 Nov 2026): every new step kind's checks (game and server alike), the eavesdrop / observe / tail rules and
   their retries, evidence kept in one short story flag, in-game waits, feed stages, and the content check of a draft that uses them all. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const R=p=>path.join(__dirname,'..',p);
const MM=require(R('void-runner/mission-mechanics.js'));
const base=()=>({id:'draft-x-m1',objectives:[{id:'a',kind:'enter'},{id:'b',kind:'observe',npc:'p1'},{id:'c',kind:'tail',npc:'p2'}],cast:[{id:'p1',model:'npc-office-m',place:'under-tea-room'},{id:'p2',model:'npc-merc',place:'far-south',route:[[0,0],[10,0]]}],
 evidence:[{id:'doc',title:'A document',text:'Line one.\nLine two.'}],apartments:[{id:'loc',door:'biz-main-w-166',entry:'shop.s1',modules:[{id:'shop',type:'shop-back',x:10,z:10}]}],feeds:[{id:'cam',room:'blackrock-cult'}]});
test('the checks: cast, evidence and every new step kind, in plain words',()=>{const m=base(),ctx={places:new Set(['under-tea-room','far-south','district-meeting']),models:new Set(['npc-office-m','npc-merc'])};
 assert.deepEqual(MM.castProblems(m,ctx),[]);assert.deepEqual(MM.evidenceProblems(m),[]);
 const bad=c=>MM.castProblems({...m,cast:[c]},ctx);assert.ok(bad({id:'X',model:'npc-merc',place:'far-south'}).length);assert.ok(bad({id:'q',model:'dragon',place:'far-south'}).length);assert.ok(bad({id:'q',model:'npc-merc',place:'atlantis'}).length);
 assert.ok(bad({id:'q',model:'npc-merc',place:'far-south',x:3}).length,'x without z');assert.ok(bad({id:'q',model:'npc-merc',place:'far-south',from:'nope'}).length);assert.ok(bad({id:'q',model:'npc-merc',place:'far-south',route:[[0,0]]}).length);
 assert.deepEqual(bad({id:'q',model:'marker',place:'far-south',x:1,z:2}),[],'a marker (an invisible point the camera identifies)');
 assert.ok(MM.evidenceProblems({evidence:[{id:'a',title:'x',text:'<b>'}]}).length);assert.ok(MM.evidenceProblems({evidence:[{id:'a',title:'x',text:'y'},{id:'a',title:'x',text:'y'}]}).length);
 const ok=(o,extra={})=>MM.stepProblems({...m,...extra},o,{...ctx,evidence:new Set(['doc'])},id=>['admin','iris'].includes(id));
 const cases=[[{id:'s',kind:'observe',npc:'p1',near:6,hold:3},0],[{id:'s',kind:'observe',npc:'nobody'},1],[{id:'s',kind:'observe',npc:'p1',near:3,close:4},1],
  [{id:'s',kind:'overhear',npc:'p1',say:[{who:'p1',text:'x'}]},0],[{id:'s',kind:'overhear',npc:'p1'},1],[{id:'s',kind:'overhear',npc:'p1',say:[{who:'You',text:'x'}]},1],
  [{id:'s',kind:'tail',npc:'p2'},0],[{id:'s',kind:'tail',npc:'p1'},1],[{id:'s',kind:'sneak',apt:'loc',mod:'shop'},0],[{id:'s',kind:'sneak',apt:'nope'},1],[{id:'s',kind:'sneak',apt:'loc',mod:'attic'},1],
  [{id:'s',kind:'collect',evidence:'doc',apt:'loc',mod:'shop',object:'computer'},0],[{id:'s',kind:'collect',evidence:'other'},1],
  [{id:'s',kind:'report',npc:'admin',evidence:['doc'],place:'district-meeting'},0],[{id:'s',kind:'report',npc:'admin',evidence:['ghost']},1],[{id:'s',kind:'report',npc:'You'},1],
  [{id:'s',kind:'call',via:'comms',say:[{who:'iris',text:'x'}]},0],[{id:'s',kind:'call',say:[{who:'iris',text:'x'}]},1],[{id:'s',kind:'call',via:'comms',say:[{who:'iris',text:'x'},{who:'admin',text:'y'}]},1],
  [{id:'s',kind:'wait-game',minutes:120},0],[{id:'s',kind:'wait-game',minutes:0},1],[{id:'s',kind:'wait-game',minutes:10,say:[{who:'iris',text:'x'}]},1],
  [{id:'s',kind:'feed',feed:'cam',stage:'saved'},0],[{id:'s',kind:'feed',feed:'cam',stage:'later'},1],[{id:'s',kind:'feed',feed:'other',stage:'open'},1],
  [{id:'s',kind:'flight',stage:'jump'},0],[{id:'s',kind:'flight',stage:'hover'},1],[{id:'s',kind:'apt-leave',apt:'loc'},0],
  [{id:'s',kind:'apt-use',apt:'loc',unseen:true},0],[{id:'s',kind:'talk',npc:'admin',unseen:true},1],[{id:'s',kind:'talk',minutes:4},1],[{id:'s',kind:'talk',close:2},1]];
 for(const [o,bad] of cases)assert.equal(ok(o).length>0,!!bad,JSON.stringify(o)+' → '+ok(o).join(' '));});
test('EAVESDROP: plays in range, pauses out of range, restarts when too close (they notice), done after the last line',()=>{const secs=()=>2;let st=null,r;const inp=(d,dt=1)=>({d,dt,near:6,close:1.5,lines:3,secs});
 r=MM.overhearStep(st,inp(10));st=r.st;assert.equal(r.show,-1,'out of range: nothing');r=MM.overhearStep(st,inp(4));st=r.st;assert.equal(r.show,0);r=MM.overhearStep(st,inp(4));st=r.st;assert.equal(st.line,1);
 r=MM.overhearStep(st,inp(20));st=r.st;assert.equal(st.line,1,'walking away pauses it where it was');
 r=MM.overhearStep(st,inp(1));st=r.st;assert.equal(r.noticed,true);assert.equal(st.line,0,'too close: from the start again');
 for(let i=0;i<10;i++){r=MM.overhearStep(st,inp(3));st=r.st;}assert.equal(st.noticed,0,'they start again once the player backs off');
 let n=0;while(!r.done&&n++<20){r=MM.overhearStep(st,inp(4));st=r.st;}assert.equal(r.done,true);});
test('OBSERVE and TAIL: counted only in range; noticed or lost puts the tail back at the start of the route (unlimited tries)',()=>{let s=null,r;
 for(let i=0;i<3;i++){r=MM.observeStep(s,{d:5,dt:1,near:10,close:0,hold:3});s=r.st;}assert.equal(r.done,true);
 s=null;r=MM.observeStep(s,{d:5,dt:2,near:10,close:0,hold:3});s=r.st;r=MM.observeStep(s,{d:50,dt:2,near:10,close:0,hold:3});assert.equal(r.st.t,0,'leaving resets the count');
 const route=[[0,0],[10,0]];let t=null;r=MM.tailStep(t,{d:40,dt:1,near:25,close:3,route,speed:2});assert.equal(r.st.started,false,'he waits until the player is in range');
 r=MM.tailStep(r.st,{d:10,dt:1,near:25,close:3,route,speed:2});r=MM.tailStep(r.st,{d:10,dt:1,near:25,close:3,route,speed:2});assert.ok(r.pos.x>0);
 const lost=MM.tailStep(r.st,{d:40,dt:1,near:25,close:3,route,speed:2});assert.equal(lost.reset,true);assert.equal(lost.why,'lost');assert.deepEqual(lost.pos,{x:0,z:0});
 const seen=MM.tailStep(r.st,{d:1,dt:1,near:25,close:3,route,speed:2});assert.equal(seen.why,'noticed');
 t={seg:0,u:0,started:true};let k=0;do{r=MM.tailStep(t,{d:10,dt:1,near:25,close:3,route,speed:2});t=r.st;}while(!r.done&&k++<20);assert.equal(r.done,true);assert.deepEqual([Math.round(r.pos.x),r.pos.z],[10,0]);});
test('EVIDENCE: one short story flag, once only, never past 200 characters; IN-GAME WAITS stamp once; FEED stages; flights; cast by step',()=>{const s={story:{flags:{}}};
 assert.equal(MM.addEvidence(s,'doc'),true);assert.equal(MM.addEvidence(s,'doc'),false,'once');assert.equal(MM.addEvidence(s,'Bad id'),false);assert.deepEqual(MM.evidenceList(s),['doc']);
 for(let i=0;i<40;i++)MM.addEvidence(s,'item-number-'+i);assert.ok(s.story.flags.evidence.length<=200);
 const m={id:'m',objectives:[{id:'w',kind:'wait-game',minutes:30}]};let g=MM.gameWait(s,m,m.objectives[0],100);assert.equal(g.left,30);g=MM.gameWait(s,m,m.objectives[0],125);assert.equal(g.left,5);g=MM.gameWait(s,m,m.objectives[0],131);assert.equal(g.due,true);
 const f={id:'m',objectives:[]},o={id:'o',kind:'feed',feed:'cam',stage:'watched'};assert.equal(MM.hit({type:'feed-stage',mission:'m',feed:'cam',stage:'open'},f,o,s),false);assert.equal(MM.hit({type:'feed-stage',mission:'m',feed:'cam',stage:'saved'},f,o,s),true);
 assert.equal(MM.hit({type:'flight',stage:'jump',place:'vesper'},f,{id:'j',kind:'flight',stage:'jump',place:'meridian'},s),false);
 assert.equal(MM.hit({type:'report',step:'m/r'},f,{id:'r',kind:'report',evidence:['ghost']},s),false,'a report needs its evidence');
 const c={objectives:[{id:'a'},{id:'b'},{id:'c'}],cast:[{id:'x',from:'b',until:'b'},{id:'y'}]};assert.deepEqual(MM.castVisible(c,0).map(p=>p.id),['y']);assert.deepEqual(MM.castVisible(c,1).map(p=>p.id),['x','y']);assert.deepEqual(MM.castVisible(c,2).map(p=>p.id),['y']);assert.deepEqual(MM.castVisible(c,3),[]);});
test('the server repeats the checks (void_runner_live_content.py) and the inventory lists the new kinds and models',()=>{const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).missionEditor;
 for(const k of MM.KINDS)assert.ok(inv.stepKinds.includes(k),k);assert.ok(inv.unlockKinds.includes('evidence'));assert.ok(inv.models.includes('npc-cyber-exec'));
 const py=fs.readFileSync(R('void_runner_live_content.py'),'utf8');for(const k of MM.KINDS)assert.ok(py.includes("'"+k+"'"),k);for(const f of MM.STEP_FIELDS)assert.ok(py.includes("'"+f+"'"),f);
 assert.match(py,/def mechanics_step_problems/);assert.match(py,/def cast_problems/);assert.match(py,/def evidence_problems/);});
