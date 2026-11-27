// Developer Tools > NPCs: behaviour recipes from ChatGPT, daily schedules by in-game hour, and the street cat as an NPC and giver (queue item 1, 18 Nov 2026).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=(...p)=>path.join(__dirname,'..',...p);
const B=require(R('void-runner/npc-behaviour.js')),X=require(R('void-runner/npc-paths.js')),SP=require(R('void-runner/ncz-street-pair.js'));
const REV='tea-host',CAT='street-cat';
const base=(extra={})=>({recipe:B.KIND,version:1,npc:REV,...extra});
const pts=[{at:'repair',action:'look',seconds:5},{at:'laundry',action:'idle',seconds:5}];

test('the paste: ```json fences and stray text around the recipe are tolerated; broken JSON says how to fix it',()=>{
 const ex=B.examples(REV)[0],json=JSON.stringify(ex,null,1);
 for(const text of [json,'```json\n'+json+'\n```','Here you go!\n```json\n'+json+'\n```\nHope that helps.','Sure. '+json+' Let me know.','```\n'+json+'\n```'])
  {const r=B.read(text,REV);assert.equal(r.ok,true,text.slice(0,30));assert.deepEqual(r.plan,B.validate(ex,REV).plan);}
 assert.match(B.read('',REV).problems[0],/empty/);
 assert.match(B.read('no json here',REV).problems[0],/No recipe found/);
 assert.match(B.read(json.slice(0,-3),REV).problems[0],/cut off/);
 assert.match(B.read('{"recipe": "x",, }',REV).problems[0],/not valid JSON/);
 assert.match(B.read('x'.repeat(B.MAX_TEXT+1),REV).problems[0],/too long/);
 // braces inside strings do not confuse the scan
 const r=B.read('{"recipe":"'+B.KIND+'","version":1,"npc":"'+REV+'","schedule":[{"from":"08:00","to":"09:00","name":"A (b)","do":"usual"}]}',REV);assert.equal(r.ok,true);});

test('code-like payloads are refused before anything is read (never run)',()=>{
 for(const t of ['const r = () => ({});','function x(){return 1}','<script>alert(1)</script>','{"npc":"'+REV+'","x":"javascript:alert(1)"}','eval("1")','new Function("return 1")','{"__proto__":{"polluted":1}}','{"a":"constructor"}','window.location="x"','require("fs")','import("x")','fetch("/api")','{"name":"<img onerror=alert(1)>"}','setTimeout(go,1)'])
  {const r=B.read(t,REV);assert.equal(r.ok,false,t);assert.equal(r.code,true,t);assert.match(r.problems[0],/program code/);}
 assert.equal(({}).polluted,undefined);
 // the module itself never evaluates or injects: JSON.parse only
 const src=fs.readFileSync(R('void-runner/npc-behaviour.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/const CODE=.*\n/,'');
 assert.doesNotMatch(src,/\beval\s*\(|new Function|\bFunction\s*\(|innerHTML|insertAdjacentHTML|document\.write|setTimeout\s*\(\s*['"`]/);assert.match(src,/JSON\.parse/);});

test('the schema is strict: unknown keys, wrong NPC, places off her pavement, disallowed clips, too many steps and bad times are refused with fix-it messages',()=>{
 const bad=(j,re,id=REV)=>{const r=B.validate(j,id);assert.equal(r.ok,false,JSON.stringify(j).slice(0,80));assert.ok(r.problems.some(p=>re.test(p)),r.problems.join(' | ')+' !~ '+re);};
 bad(base({allDay:{do:'usual'},notes:'hi'}),/Unknown field at the top: “notes”/);
 bad({...base({allDay:{do:'usual'}}),recipe:'other'},/“recipe” must be/);
 bad({...base({allDay:{do:'usual'}}),version:2},/“version” must be 1/);
 bad({...base({allDay:{do:'usual'}}),npc:'street-cat'},/This recipe is for Street cat, but you are editing Tea Room Host/);
 bad(base(),/says nothing for her to do/);
 bad(base({allDay:{do:'dance'}}),/"do" must be "usual", "stay" or "route"/);
 bad(base({allDay:{do:'stay',at:'laundry',actions:['idle'],speed:3}}),/unknown field “speed”/);
 bad(base({allDay:{do:'stay',at:'the moon',actions:['idle']}}),/no place called “the moon”/);
 bad(base({allDay:{do:'stay',at:{x:100,z:-12},actions:['idle']}}),/not somewhere she can be: it is the road/);   // the road
 bad(base({allDay:{do:'stay',at:{x:300,z:-6.5},actions:['idle']}}),/not somewhere she can be/);
 bad(base({allDay:{do:'stay',at:{x:'100',z:-6.5},actions:['idle']}}),/must be numbers/);
 bad(base({allDay:{do:'stay',at:{x:100,z:-6.5,y:2},actions:['idle']}}),/only "x" and "z"/);
 bad(base({allDay:{do:'stay',at:'laundry',actions:['pole-dance']}}),/cannot do “pole-dance”/);
 bad(base({allDay:{do:'stay',at:'laundry',actions:['smoke']}}),/cannot do “smoke”/);
 bad(base({allDay:{do:'stay',at:'laundry',actions:['walk-on']}}),/cannot do “walk-on” at a spot/);
 bad(base({allDay:{do:'stay',at:'laundry',actions:[]}}),/1 to 6 actions/);
 bad(base({allDay:{do:'stay',at:'laundry',actions:['idle'],face:'up'}}),/"face" must be/);
 bad(base({allDay:{do:'stay',at:'tea-house',actions:['sit']}}),/cannot do “sit”/);
 bad(base({allDay:{do:'route',points:[pts[0]]}}),/2 to 12 points/);
 bad(base({allDay:{do:'route',points:Array.from({length:13},(_,i)=>({at:{x:90+i,z:-6.2},action:'idle',seconds:2}))}}),/2 to 12 points \(this one has 13\)/);
 bad(base({allDay:{do:'route',points:[pts[0],{...pts[1],seconds:500}]}}),/whole number from 1 to 120/);
 bad(base({allDay:{do:'route',points:[pts[0],{...pts[1],seconds:2.5}]}}),/whole number/);
 bad(base({allDay:{do:'route',points:[pts[0],{...pts[1],run:true}]}}),/unknown field “run”/);
 // times
 bad(base({schedule:[{from:'25:00',to:'26:00',do:'usual'}]}),/"from" must be a 24-hour time/);
 bad(base({schedule:[{from:'8am',to:'12:00',do:'usual'}]}),/"from" must be a 24-hour time like "08:00" \(not “8am”\)/);
 bad(base({schedule:[{from:'08:00',to:'24:00',do:'usual'}]}),/use "00:00" for midnight/);
 bad(base({schedule:[{from:'08:00',to:'08:00',do:'usual'}]}),/starts and ends at the same time/);
 bad(base({schedule:[{from:'08:00',to:'08:10',do:'usual'}]}),/at least 15 minutes/);
 bad(base({schedule:[{from:'08:00',to:'12:00',do:'usual'},{from:'11:00',to:'13:00',do:'usual'}]}),/overlaps time block 1/);
 bad(base({schedule:[{from:'22:00',to:'02:00',do:'usual'},{from:'01:00',to:'03:00',do:'usual'}]}),/overlaps time block 1/);   // across midnight
 bad(base({schedule:Array.from({length:9},(_,i)=>({from:String(i).padStart(2,'0')+':00',to:String(i).padStart(2,'0')+':30',do:'usual'}))}),/8 time blocks at most \(this one has 9\)/);
 bad(base({schedule:[{from:'08:00',to:'12:00',do:'usual',name:'<b>x</b>'}]}),/"name" must be a single-line name/);
 bad(base({schedule:{from:'08:00'}}),/must be a list of time blocks/);
 bad(base({schedule:[{from:'08:00',to:'12:00',do:'usual',points:[]}]}),/unknown field “points”/);
 // "8:00" is tidied to "08:00"
 const ok=B.validate(base({schedule:[{from:'8:00',to:'9:30',do:'stay',at:'laundry',actions:['idle','look']}]}),REV);assert.equal(ok.ok,true,ok.problems.join());assert.equal(ok.plan.schedule[0].from,'08:00');assert.equal(ok.plan.schedule[0].to,'09:30');});

test('a good recipe becomes the same placement the route editor makes (content.npcs), with her added animations kept, and passes the full check',()=>{
 for(const id of [REV,'tea-host',CAT]){for(const ex of B.examples(id)){const r=B.validate(ex,id);assert.equal(r.ok,true,id+': '+r.problems.join(' | '));assert.deepEqual(X.planProblems(id,r.plan),[]);assert.deepEqual(X.clean(r.plan),r.plan);assert.ok(r.summary.length>=1);}}
 const r=B.validate(B.examples(REV)[0],REV,{anims:['x/y']});assert.equal(r.ok,false);   // an animation she does not have is refused by the full check
 const pl=B.places(REV);assert.ok(pl.length>=10);for(const p of pl)assert.deepEqual(X.spotProblems(REV,p),[],p.id);assert.ok(pl.some(p=>p.ledge&&p.id==='ledge-reverie'));
 const plan=B.validate(B.examples(REV)[0],REV).plan;assert.equal(plan.mode,'original');assert.equal(plan.schedule.length,3);assert.equal(plan.schedule[1].mode,'stay');assert.deepEqual(plan.schedule[1].actions,['idle']);});

test('the ChatGPT prompt is self-contained: schema, her places and actions, the limits, examples; no banned clip is offered',()=>{
 const p=B.prompt(REV);for(const s of ['ONLY ONE JSON OBJECT','"recipe": "void-runner-npc-behaviour"','"schedule"','"from": "HH:MM"','past midnight','laundry','ledge-reverie','work','walk-on','12.5','141.5','EXAMPLE 1','EXAMPLE 2','WHAT I WANT TEA ROOM HOST TO DO'])assert.ok(p.includes(s),s);
 for(const a of X.actionsFor(REV))assert.ok(p.includes('  '+a.id+': '),a.id);for(const l of p.split('ACTIONS')[1].split('EXAMPLE 1')[0].split('\n').slice(1))if(l.trim())assert.doesNotMatch(l.trim().split(':')[0],SP.BANNED);
 assert.equal(B.CODE.test(p.split('```json')[1]),false,'the examples themselves are not refused as code');
 const c=B.prompt(CAT);assert.ok(c.includes('the street cat'));assert.ok(c.includes('cat-sit'));assert.ok(!c.includes('  scroll: '));assert.equal(B.prompt('admin'),'');});

test('daily schedules: the block for an in-game minute, across midnight; outside every block the all-day plan; a waiting mission still comes first',()=>{
 const plan=B.validate(B.examples(REV)[0],REV).plan,at=(h,m=0)=>h*60+m;
 assert.equal(X.blockAt(plan.schedule,at(7,59)),-1);assert.equal(X.blockAt(plan.schedule,at(8)),0);assert.equal(X.blockAt(plan.schedule,at(11,59)),0);assert.equal(X.blockAt(plan.schedule,at(12)),1);
 assert.equal(X.blockAt(plan.schedule,at(13)),-1);assert.equal(X.blockAt(plan.schedule,at(20)),2);assert.equal(X.blockAt(plan.schedule,at(23,59)),2);assert.equal(X.blockAt(plan.schedule,0),2);assert.equal(X.blockAt(plan.schedule,at(1,59)),2);assert.equal(X.blockAt(plan.schedule,at(2)),-1);
 assert.equal(X.blockAt(plan.schedule,1440+at(8)),0,'a minute count past one day wraps');
 const now=m=>X.planNow(REV,{plan,minute:m});
 assert.equal(now(at(9)).mode,'path');assert.match(now(at(9)).key,/^sched:0:08:00-12:00:/);assert.equal(now(at(12,30)).mode,'stay');assert.match(now(at(12,30)).key,/^sched:1:/);
 assert.equal(now(at(15)).why,'home','outside: her usual thing (the all-day plan)');assert.equal(now(at(23)).mode,'stay');assert.equal(now(at(1)).key,now(at(23)).key,'the same block on both sides of midnight');
 assert.equal(X.planNow(REV,{plan}).why,'home','no clock: the all-day plan');
 const stayAll={...plan,mode:'stay',x:104.4,z:-6.1,yaw:Math.PI,actions:['idle']};assert.match(X.planNow(REV,{plan:stayAll,minute:at(15)}).key,/^stay:/);
 assert.equal(X.planNow(REV,{plan,minute:at(9),waiting:{x:100,z:-6.5,mission:'m'}}).why,'waiting');
 // a block that is "her usual thing" inside a stay all day: her own routine then
 const o={...stayAll,schedule:[{from:'10:00',to:'11:00',mode:'original'}]};assert.equal(X.planNow(REV,{plan:o,minute:at(10,30)}).why,'home');assert.deepEqual(X.planProblems(REV,o),[]);
 // the game: live-content.js passes the game clock's minute of the day
 const lc=fs.readFileSync(R('void-runner/live-content.js'),'utf8');assert.match(lc,/GC\.now\(state\)\.minuteOfDay/);assert.match(lc,/let w=wait\[id\]\|\|null;/);assert.match(lc,/planNow\(id,\{waiting:w,plan:\(env\.npcPlans\|\|\{\}\)\[id\]\|\|null,minute\}\)/);});

test('schedules are checked in the content (PLAY THIS DRAFT, PUBLISH) and tidied by clean',()=>{
 const MC=require(R('void-runner/mission-content.js'));const plan=B.validate(B.examples(REV)[0],REV).plan;
 const ok=MC.check({format:'void-runner-live-content',version:1,trees:[],npcs:{[REV]:plan}},{});assert.ok(!ok.errors||!ok.errors.some(e=>/Reverie/.test(e)),JSON.stringify(ok.errors));
 const bad={...plan,schedule:[...plan.schedule,{from:'09:00',to:'10:00',mode:'original'}]};assert.ok(X.planProblems(REV,bad).some(p=>/overlaps/.test(p)));
 const nested={...plan,schedule:[{from:'09:00',to:'10:00',mode:'stay',x:104.4,z:-6.1,yaw:0,actions:['idle'],schedule:[]}]};assert.ok(X.planProblems(REV,nested).some(p=>/unknown fields \(schedule\)/.test(p)));
 assert.deepEqual(X.clean({mode:'original',schedule:[{from:'08:00',to:'09:00',name:' Walk ',mode:'original',junk:1}]}),{mode:'original',schedule:[{from:'08:00',to:'09:00',name:'Walk',mode:'original'}]});
 const inv=X.inventory();assert.equal(inv.limits.blocks,8);assert.equal(inv.limits.blockMin,15);
 const adm=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8'));assert.deepEqual(adm.npcPaths.limits,inv.limits);assert.deepEqual(adm.npcPaths.movable[CAT].actions,X.CAT_ACTIONS);});

test('the street cat is an NPC the editor can move and a mission giver (PET THE CAT), out day and night, with its own actions only',()=>{
 const G=require(R('void-runner/mission-givers.js')),r=G.roster(),cat=(Array.isArray(r)?r:Object.values(r)).find(g=>g.id===CAT);
 assert.ok(cat&&cat.canTalk&&cat.players&&cat.draft);assert.equal(cat.shift,null);assert.deepEqual(cat.targets,[{action:'street-cat',character:CAT}]);assert.equal(G.onDuty(cat),true);assert.doesNotMatch(CAT,/\s/);
 assert.deepEqual(G.whoAt(r,'street-cat',CAT),[CAT]);
 assert.equal(SP.CAT_ID,CAT);assert.equal(SP.CAT_ACTION,'street-cat');assert.deepEqual(SP.CAT_REACTION,['The cat looks up at you.']);
 assert.equal(X.MOVABLE[CAT].asset,SP.CAT);assert.ok(X.animAllowed(CAT,'actorcore/x'));
 assert.deepEqual(X.planNow(CAT,{waiting:{x:100,z:-6.4}}).actions,X.CAT_STAY,'"Giver waits at": the cat sits, looks about and potters');
 assert.ok(X.planProblems(CAT,{mode:'stay',x:100,z:-6.4,yaw:0,actions:['scroll']}).length,'no V1 for the cat');assert.deepEqual(X.planProblems(CAT,{mode:'stay',x:100,z:-6.4,yaw:0,actions:['cat-sit']}),[]);
 const sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8');assert.match(sp,/label:'PET THE CAT'/);assert.match(sp,/VoidInteractions\.register\(CAT_ACTION/);assert.match(sp,/function catPlan\(/);
 const ed=fs.readFileSync(R('void-runner/npc-editor.js'),'utf8');assert.match(ed,/function scheduleBox\(/);assert.match(ed,/function behaviourBox\(/);
 // the paste box only ever goes through VoidNPCBehaviour.read (JSON.parse); the pasted text is put in a textarea's value, never in HTML
 const bb=ed.slice(ed.indexOf('function behaviourBox('),ed.indexOf(' // ---- add animation:'));assert.match(bb,/NB\.read\(st\.text,id,\{anims\}\)/);assert.doesNotMatch(bb,/innerHTML|eval\(|Function\(|insertAdjacentHTML/);
 const dt=fs.readFileSync(R('void-runner/dev-tools.js'),'utf8');assert.ok(dt.indexOf("'void-runner/npc-behaviour.js'")<dt.indexOf("'void-runner/npc-editor.js'"));});
