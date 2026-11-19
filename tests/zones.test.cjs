/* Zones and on-foot combat rules (void-runner/zones.js), the base pistol in progression.js, the mission content wiring (mission-content.js) and server parity. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Z=require('../void-runner/zones.js'),P=require('../void-runner/progression.js'),MC=require('../void-runner/mission-content.js'),M=require('../void-runner/modules.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const types=M.inventory().types;

test('every place is Friendly unless the owner or a mission says otherwise',()=>{
 assert.equal(Z.zoneAt({places:['district-hall','district','oldtown','neochinatown']}).zone,'friendly');
 assert.equal(Z.zoneAt({inside:{mission:'m',loc:'office',mod:'hall',type:'hall-office'}}).zone,'friendly');
 // the owner's table: an area, a location type; the deepest place wins
 const table={areas:{oldtown:'neutral','main-null':'hostile'},modules:{'server-room':'hostile'}};
 assert.equal(Z.zoneAt({table,places:['district-hall','district','oldtown','neochinatown']}).zone,'neutral');
 assert.equal(Z.zoneAt({table,places:['main-null','oldtown','neochinatown']}).zone,'hostile');
 assert.equal(Z.zoneAt({table,inside:{mission:'m',loc:'office',mod:'servers',type:'server-room'}}).zone,'hostile');
 // a mission's own rooms beat the table; a room beats its location
 const ms=[{id:'m',combat:{places:{office:'neutral','office/servers':'friendly'},areas:{oldtown:'hostile'}}}];
 assert.equal(Z.zoneAt({table,missions:ms,inside:{mission:'m',loc:'office',mod:'servers',type:'server-room'}}).zone,'friendly');
 assert.equal(Z.zoneAt({table,missions:ms,inside:{mission:'m',loc:'office',mod:'hall',type:'hall-office'}}).zone,'neutral');
 assert.equal(Z.zoneAt({table,missions:ms,places:['district','oldtown']}).zone,'hostile');
 // another mission's rooms do not count
 assert.equal(Z.zoneAt({missions:ms,inside:{mission:'other',loc:'office',mod:'hall'}}).zone,'friendly');
});

test('what each zone allows: Friendly never fires, Neutral provokes, Hostile attacks on sight; no PvP anywhere',()=>{
 assert.deepEqual(Z.rules('friendly'),{zone:'friendly',canFire:false,provokes:false,onSight:false,pvp:false});
 assert.equal(Z.rules('neutral').canFire,true);assert.equal(Z.rules('neutral').provokes,true);assert.equal(Z.rules('neutral').onSight,false);
 assert.equal(Z.rules('hostile').onSight,true);for(const z of Z.ZONES)assert.equal(Z.rules(z).pvp,false);
 assert.equal(Z.rules(null).canFire,true,'outside NeoChinatown the old behaviour stays');
});

test('the Neutral safety catch: the first press warns, a second within the window fires; holstering re-arms it; it can be switched off',()=>{
 const c=Z.tune({}),st={armedAt:null};
 assert.equal(Z.press(st,'friendly',0,c),'locked');assert.equal(Z.press(st,'hostile',0,c),'fire');
 assert.equal(Z.press(st,'neutral',10,c),'warn');assert.equal(Z.press(st,'neutral',11,c),'fire');assert.equal(Z.press(st,'neutral',11.5,c),'fire');
 assert.equal(Z.press(st,'neutral',20,c),'warn','too long after: the safety is back on');
 Z.rearm(st);assert.equal(Z.press(st,'neutral',20.5,c),'warn','holstered: warns again');
 const off=Z.tune({neutralSafety:0});assert.equal(Z.press({armedAt:null},'neutral',0,off),'fire');
});

test('escalation: a shot makes the area hostile for guardHostileTime; leaving it calms everyone at once',()=>{
 const c=Z.tune({guardHostileTime:30}),esc={at:null,until:0};
 assert.equal(Z.hostileNow(esc,'loc:a',0),false,'drawing never provokes: only provoke() does');
 Z.provoke(esc,'loc:a',100,c);assert.equal(Z.hostileNow(esc,'loc:a',110),true);assert.equal(Z.hostileNow(esc,'loc:a',131),false);
 Z.provoke(esc,'loc:a',200,c);assert.equal(Z.hostileNow(esc,'area:oldtown',201),false,'somewhere else');assert.equal(Z.hostileNow(esc,'loc:a',202),false,'and coming back it has calmed down');
});

test('sight: range (shorter crouching), cone (all round once alerted), walls',()=>{
 const c=Z.tune({detectRange:20,detectCone:90}),e={x:0,z:0,yaw:0,alert:false};
 assert.equal(Z.sees(e,{x:0,z:10},c),true);assert.equal(Z.sees(e,{x:0,z:25},c),false);assert.equal(Z.sees(e,{x:0,z:15,crouch:true},c),false);
 assert.equal(Z.sees(e,{x:0,z:-10},c),false,'behind');assert.equal(Z.sees({...e,alert:true},{x:0,z:-10},c),true);
 const wall=[{position:[0,1.2,5],size:[4,2.4,.2]}];assert.equal(Z.lineClear({x:0,z:0},{x:0,z:10},wall),false);assert.equal(Z.lineClear({x:0,z:0},{x:0,z:10},[{...wall[0],open:true}]),true);
 assert.equal(Z.lineClear({x:0,z:0},{x:0,z:10},[{position:[0,.4,5],size:[4,.8,.4]}]),true,'a low desk does not block');
 assert.equal(Z.sees(e,{x:0,z:10},c,(a,b)=>Z.lineClear(a,b,wall)),false);
});

test('the enemy brain: calm guards hold their post, hostile ones close in and shoot, patrols walk their route',()=>{
 const c=Z.tune({footEnemyAccuracy:1,footEnemyReaction:.5,footEnemyDamage:10}),rnd=()=>0;
 const g=Z.enemy({id:'g',figure:'security',role:'guard',yaw:0},{x:0,z:0},c),p={x:0,z:10};
 for(let i=0;i<50;i++){const o=Z.step(g,p,.05,{hostile:false,cfg:c,rnd});assert.equal(o.shot,false);}assert.equal(g.alert,false);assert.equal(Math.hypot(g.x,g.z)<.01,true);
 let hits=0;for(let i=0;i<60;i++){const o=Z.step(g,p,.05,{hostile:true,cfg:c,rnd});if(o.hit)hits+=o.damage;}assert.ok(g.alert);assert.ok(hits>=20,'it hits: '+hits);assert.ok(g.z>0,'it closes in');
 const pt=Z.enemy({id:'p',figure:'merc',role:'patrol'},{x:0,z:0,route:[{x:0,z:0},{x:4,z:0}]},c);for(let i=0;i<80;i++)Z.step(pt,{x:50,z:50},.05,{hostile:true,cfg:c,rnd});assert.ok(pt.x>1,'walks its route');
 const e=Z.enemy({id:'e',figure:'enforcer'},{x:0,z:0},Z.tune({footEnemyHealth:60}));assert.equal(e.hp,81,'an enforcer is tougher');assert.equal(Z.hurt(e,40),false);assert.equal(Z.hurt(e,50),true);assert.equal(e.dead,true);
 assert.deepEqual(Z.step(e,p,.1,{hostile:true,cfg:c,rnd}),{shot:false,hit:false,damage:0},'the dead do nothing');
});

const loc={id:'office',door:'biz-avenue-n-13',...JSON.parse(JSON.stringify(M.TEMPLATES.find(t=>t.id==='office').loc))};
const mission=(extra={})=>({id:'draft-z-m1',apartments:[loc],objectives:[{id:'in',kind:'apt-enter',apt:'office',mod:'hall',label:'In'}],...extra});
test('a mission\'s combat: checks in plain words and the clean copy',()=>{
 const places=new Set(['oldtown','avenue']);
 assert.deepEqual(Z.combatProblems(mission({combat:{places:{'office/hall':'neutral',office:'hostile'},areas:{avenue:'neutral'},armed:[{id:'g1',at:'office/hall',x:0,z:0,figure:'security',role:'guard'}],onDeath:'fail'}}),{places,types}),[]);
 const bad=Z.combatProblems(mission({combat:{places:{'office/nope':'neutral',office:'red'},areas:{nowhere:'hostile'},armed:[{id:'g1',at:'office/hall',x:99,z:0,figure:'robot'},{id:'g1',at:'office',x:0,z:0,figure:'merc',role:'patrol'}],onDeath:'explode',extra:1}}),{places,types});
 assert.deepEqual(bad,['zones and enemies: unknown fields.']);
 const b2=Z.combatProblems(mission({combat:{places:{'office/nope':'neutral',office:'red'},areas:{nowhere:'hostile'},armed:[{id:'g1',at:'office/hall',x:99,z:0,figure:'robot'},{id:'g1',at:'office',x:0,z:0,figure:'merc',role:'patrol'}],onDeath:'explode'}}),{places,types}).join('\n');
 for(const re of [/there is no area “nowhere”/,/“office\/nope” is not one of this mission’s locations or rooms/,/“office” must be Friendly, Neutral or Hostile/,/try again or fail/,/choose a figure/,/inside the room/,/same name/,/choose the room/])assert.match(b2,re);
 const s=Z.stripCombat({places:{office:'hostile'},armed:[{id:'g',at:'office/hall',x:1.234,z:0,figure:'merc',role:'patrol',route:[[1,2],[3,4]],junk:1}],onDeath:'retry'});
 assert.deepEqual(s,{places:{office:'hostile'},armed:[{id:'g',at:'office/hall',x:1.23,z:0,figure:'merc',role:'patrol',route:[[1,2],[3,4]]}]});
});

test('the "Change zone" step: checks, the clean copy, when it is in force, the armed people it brings in',()=>{
 const m=mission({objectives:[{id:'in',kind:'apt-enter',apt:'office',mod:'hall',label:'In'},{id:'z',kind:'zone',target:'office/hall',zone:'hostile',until:'out',spawn:true,label:'Z'},{id:'out',kind:'apt-enter',apt:'office',mod:'office',label:'Out'}],combat:{armed:[{id:'g1',at:'office/hall',x:0,z:0,figure:'security'}]}});
 const z=m.objectives[1];assert.deepEqual(Z.stepProblems(m,z,{places:new Set(['avenue'])}),[]);
 assert.match(Z.stepProblems(m,{...z,until:'in'}).join(),/later step/);assert.match(Z.stepProblems(m,{...z,target:'area:nowhere'},{places:new Set(['avenue'])}).join(),/no area/);assert.match(Z.stepProblems(m,{...z,zone:'red'}).join(),/Friendly, Neutral or Hostile/);
 assert.match(Z.stepProblems(m,{id:'x',kind:'talk',zone:'hostile'}).join(),/only a “Change zone” step/);
 const rec={acquired:true,objectives:{}};assert.deepEqual(Z.changesNow(m,rec),[]);assert.equal(Z.waiting(m,rec,m.combat.armed[0]),true,'waits for the step');
 rec.objectives.in=true;assert.deepEqual(Z.dueNow(m,rec),{mission:m.id,step:'z'},'reached: it completes at once');
 rec.objectives.z=true;assert.deepEqual(Z.changesNow(m,rec),[{target:'office/hall',zone:'hostile',step:'z'}]);assert.equal(Z.waiting(m,rec,m.combat.armed[0]),false);
 assert.equal(Z.zoneAt({missions:[{id:m.id,combat:m.combat,changes:Z.changesNow(m,rec)}],inside:{mission:m.id,loc:'office',mod:'hall'}}).zone,'hostile');
 rec.objectives.out=true;assert.deepEqual(Z.changesNow(m,rec),[],'until the later step');rec.completed=true;assert.deepEqual(Z.changesNow(m,rec),[]);
 const area={id:'z2',kind:'zone',target:'area:oldtown',zone:'neutral',label:'Z'};assert.equal(Z.zoneAt({missions:[{id:'q',changes:[{target:'area:oldtown',zone:'neutral'}]}],places:['district','oldtown']}).zone,'neutral');
 assert.deepEqual(Z.stripStep({...z,junk:1},{id:'z',label:'',kind:'zone'}),{id:'z',label:'Change zone',kind:'zone',target:'office/hall',zone:'hostile',until:'out',spawn:true});void area;
});

test('the Zones table: checks and the clean copy (only Neutral / Hostile entries are kept)',()=>{
 const places=new Set(['oldtown']);assert.deepEqual(Z.tableProblems({areas:{oldtown:'neutral'},modules:{'server-room':'hostile'}},{places,types}),[]);
 assert.match(Z.tableProblems({areas:{nowhere:'neutral'},modules:{'server-room':'blue'}},{places,types}).join(),/no area “nowhere”.*Friendly, Neutral or Hostile/);
 assert.deepEqual(Z.tableProblems({x:1}),['Zones table: unknown fields.']);
 assert.deepEqual(Z.cleanTable({areas:{oldtown:'friendly',avenue:'hostile'},modules:{}}),{areas:{avenue:'hostile'}});assert.equal(Z.cleanTable({areas:{oldtown:'friendly'}}),null);
});

test('mission content carries the zones: the table, a mission\'s combat and the step (check, strip, events)',()=>{
 const trees=[{id:'draft-zt',name:'Zones',missions:[{id:'draft-zt-m1',title:'Z',type:'side',giver:'admin',offer:[],apartments:[loc],objectives:[{id:'in',kind:'apt-enter',apt:'office',mod:'hall',label:'In'},{id:'z',kind:'zone',target:'office/office',zone:'hostile',label:'Z'}],combat:{places:{'office/hall':'neutral'},armed:[{id:'g1',at:'office/hall',x:0,z:0,figure:'security',role:'guard'}]}}]}];
 const givers=[{id:'admin',name:'Admin',say:'Admin',canTalk:true,draft:true,players:true}];const content=MC.fromDrafts({local:{trees,zones:{areas:{oldtown:'neutral',avenue:'friendly'}}},givers});assert.ok(content.trees,JSON.stringify(MC.notApplied({local:{trees},givers})));
 assert.deepEqual(content.zones,{areas:{oldtown:'neutral'}});const m=content.trees[0].missions[0];assert.deepEqual(m.combat.places,{'office/hall':'neutral'});assert.equal(m.objectives[1].zone,'hostile');
 assert.ok(MC.STEP_KINDS.includes('zone'));
 const ctx={places:new Set(['oldtown','avenue']),givers:new Map(givers.map(g=>[g.id,g]))};const ok=MC.check(content,ctx);assert.deepEqual(ok.errors.filter(e=>/zone|armed|Zones/i.test(e)),[]);
 const bad=JSON.parse(JSON.stringify(content));bad.zones={areas:{oldtown:'purple'}};bad.trees[0].missions[0].combat.armed[0].figure='robot';bad.trees[0].missions[0].objectives[1].zone='blue';
 const errs=MC.check(bad,ctx).errors.join('\n');assert.match(errs,/Zones table: area “oldtown” must be/);assert.match(errs,/choose a figure/);assert.match(errs,/step z: choose Friendly, Neutral or Hostile/);
 // the step completes on its own event
 const env={trees:content.trees,Missions:null};void env;
 assert.match(read('void-runner/mission-content.js'),/o\.kind==='zone'\?ev\.type==='zone'&&ev\.step===m\.id\+'\/'\+o\.id/);
});

test('the base pistol: sold by Admin for the Combat Balance price, bought once, kept in the save; the server knows it',()=>{
 const s={credits:500,quest:'inheritance',progression:P.fresh()};assert.equal(s.progression.personal.weapon,null);
 assert.equal(P.buyWeapon(s,'base-pistol',350),true);assert.equal(s.credits,150);assert.deepEqual(s.progression.personal.weapons,['base-pistol']);assert.equal(s.progression.personal.weapon,'base-pistol');
 assert.equal(P.buyWeapon(s,'base-pistol',0),false,'once');assert.equal(P.buyWeapon({credits:10,progression:P.fresh()},'base-pistol',350),false,'not enough credits');assert.equal(P.buyWeapon(s,'rocket',0),false);
 const back=P.restore(JSON.parse(JSON.stringify(s.progression)),{quest:'inheritance'});assert.deepEqual(back.personal.weapons,['base-pistol']);assert.equal(back.personal.weapon,'base-pistol');
 assert.deepEqual(P.restore({...P.fresh(),personal:{...P.fresh().personal,weapons:['base-pistol','laser-sword']}},{quest:'inheritance'}).personal.weapons,['base-pistol']);
 const spec=require('../void-runner/balance.js').spec;for(const k of Object.keys(Z.TUNE))assert.ok(spec[k],'Combat Balance has '+k);assert.equal(spec.neutralSafety.value,1,'the safety catch is on by default');
 const py=read('void_runner_progression.py');assert.match(py,/WEAPONS = \['base-pistol'\]/);assert.match(py,/'weapons':weapons/);
 assert.match(read('void-runner/faction-scenes.js'),/admin-buy-weapon:/);assert.match(read('void-runner/mouse-control.js'),/id:'base-pistol',name:'PISTOL'/);
});

test('server parity: the Python checks know the same fields and lists',()=>{
 const py=read('void_runner_live_content.py'),inv=Z.inventory();
 for(const f of ['def zone_table_problems','def combat_problems','def zone_step_problems','def zone_shape_problems',"'characters', 'zones']","'feeds', 'combat']","'target', 'zone', 'until', 'spawn'"])assert.ok(py.includes(f),f);
 const m=/ZONE_DEFAULT = \{'zones': \[([^\]]*)\], 'figures': \[([^\]]*)\]/.exec(py);assert.ok(m);assert.deepEqual(m[1].split(',').map(x=>x.trim().replace(/'/g,'')),inv.zones);assert.deepEqual(m[2].split(',').map(x=>x.trim().replace(/'/g,'')),inv.figures);
 assert.match(read('void_runner_drafts.py'),/'characters', 'zones'\]/);assert.deepEqual(JSON.parse(read('void_runner_admin_inventory.json')).zones,inv);
 const html=read('void-runner.html');assert.ok(html.indexOf('void-runner/zones.js')<html.indexOf('void-runner/mission-content.js'));assert.ok(html.indexOf('void-runner/zone-integration.js')>html.indexOf('void-runner/module-integration.js'));
 assert.match(read('void-runner/dev-tools.js'),/\['zones','Zones'\]/);assert.match(read('void-runner/dev-tools.js'),/void-runner\/zone-editor\.js/);
});

test('ONE combat balance for on-foot combat: the campaign and Skirmish FPS read the same gun, health, enemies and detection',()=>{
 const values={...require('../void-runner/balance.js').defaults,pistolDamage:50,pistolAimBonus:1.5,pistolCooldown:.4,pistolSpread:2,pistolRecoil:1,footPlayerHealth:150,footEnemyDamage:20,footEnemyAccuracy:.5,footEnemyReaction:2,footEnemySpeed:2,footEnemyHealth:90,detectRange:30,detectCone:180};
 const g=Z.gun(values,P.tuning.ground);assert.deepEqual(g,{damage:50,aimDamage:75,cooldown:.4,spread:2,recoil:1,health:150,magazine:P.tuning.ground.magazine,reserve:P.tuning.ground.reserve,reload:P.tuning.ground.reload});
 const n=Z.skirmish(values,'normal'),c=Z.tune(values);assert.deepEqual(n,{damage:c.footEnemyDamage,accuracy:c.footEnemyAccuracy,reaction:c.footEnemyReaction,speed:c.footEnemySpeed,health:c.footEnemyHealth,detectRange:c.detectRange,detectCone:c.detectCone});
 assert.ok(Z.skirmish(values,'hard').damage>n.damage&&Z.skirmish(values,'easy').damage<n.damage,'difficulty only scales the shared values');
 // the defaults keep Skirmish's old Normal enemies and aimed / hip damage
 const d=Z.skirmish(null,'normal');assert.equal(d.damage,11);assert.equal(d.accuracy,.66);assert.equal(d.reaction,1.1);assert.equal(d.speed,1.05);const g0=Z.gun(null);assert.equal(Math.round(g0.aimDamage),42);assert.equal(g0.damage,34);
 // both modes read them, and no copy of the old numbers is left in Skirmish
 const sk=read('void-runner/skirmish.js'),zi=read('void-runner/zone-integration.js');
 for(const re of [/Z\.gun\(bal\(\)/,/Z\.skirmish\(bal\(\),d\)/,/g\.aimDamage:g\.damage/,/Z\.sees\(/,/Z\.shotDir\(/,/c\.detectRange\*1\.2/])assert.match(sk,re);
 for(const old of ['s.aim?42:34','s.cooldown=.27','distance<29','ammo:12,reserve:96','12-s.ammo','reload=1.35','damage:7,accuracy:.46'])assert.ok(!sk.includes(old),'skirmish still has '+old);
 for(const re of [/Z\.gun\(root\.VOID_BALANCE/,/gg\.aimDamage:gg\.damage/,/footPlayerHealth/,/Z\.shotDir\(/])assert.match(zi,re);
 const spec=require('../void-runner/balance.js').spec;for(const k of ['pistolAimBonus','pistolCooldown','pistolSpread','pistolRecoil','footPlayerHealth'])assert.equal(spec[k].value,Z.TUNE[k],k+' default matches');
 for(const [k,v] of Object.entries(Z.TUNE))assert.equal(spec[k].value,v,'Combat Balance default '+k);
 // spread: none at 0, inside the cone otherwise
 assert.deepEqual(Z.shotDir(0,0,0,false,()=>.5).map(x=>Math.round(x*1e6)/1e6+0),[0,0,1]);const dv=Z.shotDir(0,0,2,false,()=>1);assert.ok(Math.acos(dv[2])<=2*Math.PI/180+1e-9);
});
