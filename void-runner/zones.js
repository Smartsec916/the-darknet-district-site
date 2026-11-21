/* ZONES AND ON-FOOT COMBAT RULES (pure: browser and Node; tests/zones.test.cjs, tests/test_zones.py). The owner, 19 Nov 2026: "You can walk around freely in NeoChinatown.
   But you can't fire it there. ... a small Green 'Friendly' indicator ... Orange in 'Neutral' areas where you can have a gun, if you fire it you will be attacked. Then a red
   indicator 'Hostile' area the enemy will try to kill you if you're seen and you can shoot back." He decides which areas are which (and changes them as the game plays):
   every city area and every location defaults to FRIENDLY; nothing here makes a place Neutral or Hostile on its own.
   - FRIENDLY: the gun can be drawn and holstered, never fired ("Weapons are locked here"). No PvP.
   - NEUTRAL:  the gun can be carried and fired; a SHOT (or hitting someone) makes the armed people nearby hostile for a while (Combat Balance guardHostileTime) and
               civilians flee. Drawing or holstering never provokes anyone. An optional safety catch (Combat Balance neutralSafety, off by default): the first trigger press only
               warns, a second press within safetyWindow seconds fires; holstering or waiting re-arms it.
   - HOSTILE:  enemies attack on sight (range detectRange, cone detectCone, a clear line); the player fires freely.
   WHERE A ZONE COMES FROM (zoneAt), most specific first:
     inside a mission location: that mission's combat.places['<loc>/<module>'], then combat.places['<loc>'], then the owner's table modules[<module type>], then Friendly;
     on the street / in a venue: for each place the player is in (deepest first, VoidPlaces.at): any taken mission's combat.areas[place], then the owner's table areas[place];
     then Friendly.
   DATA: the owner's Zones table is editor content (content.zones / the draft workspace's `zones`): {areas:{<place id>:zone}, modules:{<module type>:zone}} (only non-Friendly
   entries need to be stored). A mission's `combat`: {areas?, places?, armed?:[{id, at:'<loc>/<module>', x, z, figure, role:'guard'|'patrol', route?:[[x,z]..], yaw?}],
   onDeath?:'retry'|'fail'}. x/z are metres in the module's own frame (the same frame as its placed items). Saves: the bought pistol is progression.personal.weapons
   ['base-pistol'] (void_runner_progression.py checks it). Nothing else here is saved. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const ZONES=['friendly','neutral','hostile'],DEFAULT='friendly';
 const INFO={friendly:{word:'FRIENDLY',colour:'#37d67a',icon:'◆',help:'Weapons stay locked: you can draw and holster, never fire.'},
  neutral:{word:'NEUTRAL',colour:'#ff9a2e',icon:'▲',help:'You can carry and fire, but a shot makes the armed people here attack you and everyone else run.'},
  hostile:{word:'HOSTILE',colour:'#ff4646',icon:'✖',help:'Enemies attack on sight; shoot back freely.'}};
 // Combat-capable figures (the Skirmish raider's armoured body, three outfits) and how they behave.
 const FIGURES={security:{name:'Security guard',armour:'#3f4a55',trim:'#1b2228',visor:'#e0b23a',hp:1},merc:{name:'Mercenary',armour:'#4e5552',trim:'#22292b',visor:'#b84439',hp:1},
  enforcer:{name:'Enforcer',armour:'#5d3a3a',trim:'#251818',visor:'#ff5a3c',hp:1.35}};
 const ROLES=['guard','patrol'],ON_DEATH=['retry','fail'],LIMIT={armed:12,route:6,areas:40,places:24,table:240};
 const ARMED_KEYS=['id','at','x','z','figure','role','route','yaw'],COMBAT_KEYS=['areas','places','armed','onDeath'],TABLE_KEYS=['areas','modules'];
 const ID=/^[a-z][a-z0-9-]{0,23}$/,REF=/^([a-z][a-z0-9-]{0,23})(?:\/([a-z][a-z0-9-]{0,11}))?$/;
 // The base pistol Admin sells (price: Combat Balance pistolPrice). One-time purchase; progression.personal.weapons.
 const PISTOL={id:'base-pistol',name:'PISTOL',vendor:'admin',note:'A plain 10-round sidearm. Admin sells it once; it stays yours.'},WEAPONS=['base-pistol'];
 // Combat Balance keys (balance-data.js) and their defaults, so Node tests and the rules run without the balance file.
 // ONE SOURCE FOR ON-FOOT COMBAT (the owner: "if something is changed in ground combat like how much damage guns do also change it in the Skirmish FPS mode"): the campaign
 // (zone-integration.js) and Skirmish FPS (skirmish.js) both read these through tune() / gun() / skirmish(); the magazine, reserve and reload time are progression.js
 // tuning.ground (the save server checks the magazine). Skirmish difficulty only scales the enemies' Normal values (SKIRMISH_DIFFICULTY).
 const TUNE={pistolPrice:350,pistolDamage:34,pistolAimBonus:1.24,pistolCooldown:.25,pistolSpread:1.2,pistolRecoil:.6,footPlayerHealth:100,footEnemyHealth:60,footEnemyDamage:11,footEnemyAccuracy:.66,
  footEnemyReaction:1.1,footEnemySpeed:1.05,detectRange:26,detectCone:110,guardHostileTime:45,civilianFleeRadius:25,neutralSafety:0,safetyWindow:2};
 const SKIRMISH_DIFFICULTY={easy:{damage:.64,accuracy:.7,reaction:1.36,speed:.76},normal:{damage:1,accuracy:1,reaction:1,speed:1},hard:{damage:1.36,accuracy:1.24,reaction:.64,speed:1.24}};
 const GROUND={magazine:10,reserve:48,reload:1.1};   // progression.js tuning.ground (Node tests without it)
 /* The player's gun, the same in both modes. ground: progression.js tuning.ground. */
 function gun(values,ground){const c=tune(values),g=ground||GROUND;return {damage:c.pistolDamage,aimDamage:c.pistolDamage*c.pistolAimBonus,cooldown:c.pistolCooldown,spread:c.pistolSpread,recoil:c.pistolRecoil,health:c.footPlayerHealth,magazine:g.magazine,reserve:g.reserve,reload:g.reload};}
 /* Skirmish FPS enemies for a difficulty: the shared Normal values scaled. */
 function skirmish(values,difficulty){const c=tune(values),k=SKIRMISH_DIFFICULTY[difficulty]||SKIRMISH_DIFFICULTY.normal;return {damage:c.footEnemyDamage*k.damage,accuracy:Math.min(1,c.footEnemyAccuracy*k.accuracy),reaction:c.footEnemyReaction*k.reaction,speed:c.footEnemySpeed*k.speed,health:c.footEnemyHealth,detectRange:c.detectRange,detectCone:c.detectCone};}
 /* A shot's direction with the gun's spread (degrees from the aim; a third of it aiming down the sights). rnd: () -> 0..1. -> [x,y,z] */
 function shotDir(yaw,pitch,spreadDeg,aim,rnd=Math.random){const s=(spreadDeg||0)*(aim?1/3:1)*Math.PI/180,a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*s,y=yaw+Math.cos(a)*r,p=pitch+Math.sin(a)*r;return [Math.sin(y)*Math.cos(p),-Math.sin(p),Math.cos(y)*Math.cos(p)];}
 function tune(values){const v=values||{},out={};for(const [k,d] of Object.entries(TUNE))out[k]=Number.isFinite(v[k])?v[k]:d;return out;}
 const isZone=z=>ZONES.includes(z);
 const plainObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
 const keysOk=(o,keys)=>plainObj(o)&&Object.keys(o).every(k=>keys.includes(k));
 const num=v=>typeof v==='number'&&Number.isFinite(v);
 // ---------------------------------------------------------------- what each zone allows
 function rules(zone){if(zone==='hostile')return {zone,canFire:true,provokes:false,onSight:true,pvp:false};if(zone==='neutral')return {zone,canFire:true,provokes:true,onSight:false,pvp:false};
  if(zone==='friendly')return {zone,canFire:false,provokes:false,onSight:false,pvp:false};return {zone:null,canFire:true,provokes:false,onSight:false,pvp:false};}   // null: outside NeoChinatown (old behaviour)
 /* q: {table, missions:[{id, combat}], inside:{mission, loc, mod, type}|null, places:[place ids deepest first]} -> {zone, source:'mission'|'table'|'default', at} */
 function zoneAt(q){const t=(q&&q.table)||{},all=((q&&q.missions)||[]).filter(Boolean),ms=all.filter(m=>plainObj(m.combat)),inside=q&&q.inside;
  // "Change zone" steps in force (m.changes, from changesNow): the latest one for the room, then the location, then each place
  const changed=(m,target)=>{let z=null;for(const c of m.changes||[])if(c.target===target)z=c.zone;return z;};
  if(inside&&inside.loc){const own=all.find(m=>m.id===inside.mission);if(own){for(const k of [inside.mod&&inside.loc+'/'+inside.mod,inside.loc].filter(Boolean)){const z=changed(own,k);if(z)return {zone:z,source:'step',at:k};}}
   const pl=(own&&plainObj(own.combat)&&own.combat.places)||{};
   if(inside.mod&&isZone(pl[inside.loc+'/'+inside.mod]))return {zone:pl[inside.loc+'/'+inside.mod],source:'mission',at:inside.loc+'/'+inside.mod};
   if(isZone(pl[inside.loc]))return {zone:pl[inside.loc],source:'mission',at:inside.loc};
   if(inside.type&&isZone((t.modules||{})[inside.type]))return {zone:t.modules[inside.type],source:'table',at:inside.type};
   return {zone:DEFAULT,source:'default',at:inside.loc};}
  for(const p of (q&&q.places)||[]){for(const m of all){const z=changed(m,'area:'+p);if(z)return {zone:z,source:'step',at:p};}for(const m of ms){const z=(m.combat.areas||{})[p];if(isZone(z))return {zone:z,source:'mission',at:p};}const z=(t.areas||{})[p];if(isZone(z))return {zone:z,source:'table',at:p};}
  return {zone:DEFAULT,source:'default',at:null};}
 // ---------------------------------------------------------------- the safety catch (Neutral only) and escalation
 /* One trigger press in a zone. st: {armedAt} (kept by the caller). -> 'fire' | 'locked' (Friendly) | 'warn' (the first press with the safety catch on). */
 function press(st,zone,now,cfg){const c=cfg||tune();const r=rules(zone);if(!r.canFire)return 'locked';if(zone!=='neutral'||!(c.neutralSafety>=.5))return 'fire';
  if(st.armedAt!=null&&now-st.armedAt<=c.safetyWindow){st.armedAt=now;return 'fire';}st.armedAt=now;return 'warn';}
 // Holstering (or the window running out, checked in press) re-arms it.
 function rearm(st){st.armedAt=null;}
 // esc: {until, at} where `at` is the zone's place (the area or the location) that was provoked. Leaving it calms everyone down.
 function provoke(esc,at,now,cfg){esc.at=at;esc.until=now+(cfg||tune()).guardHostileTime;return esc;}
 function hostileNow(esc,at,now){if(!esc||esc.at==null)return false;if(esc.at!==at){esc.at=null;esc.until=0;return false;}if(now>=esc.until){esc.at=null;return false;}return true;}
 // ---------------------------------------------------------------- sight and the enemies' brains (the Skirmish AI: alert on sight, close in, fire with an accuracy roll)
 /* A clear line between two points at chest height through `solids` ({position:[x,y,z], size:[w,h,d], open?}): walls, closed doors and tall furniture block it. */
 function lineClear(a,b,solids,eye=1.4){const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz);if(n<.6)return true;
  const tall=(solids||[]).filter(s=>s&&!s.open&&Array.isArray(s.position)&&Array.isArray(s.size)&&s.position[1]-s.size[1]/2<=eye&&s.position[1]+s.size[1]/2>=eye);
  for(let t=.35;t<n-.35;t+=.25){const x=a.x+dx*t/n,z=a.z+dz*t/n;for(const s of tall)if(Math.abs(x-s.position[0])<s.size[0]/2&&Math.abs(z-s.position[2])<s.size[2]/2)return false;}return true;}
 const norm=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};
 /* Does enemy e see the player p? Inside range (shorter for a crouching player), inside its cone (an alerted enemy looks everywhere), with a clear line. */
 function sees(e,p,cfg,clear){const c=cfg||tune(),d=Math.hypot(p.x-e.x,p.z-e.z),range=c.detectRange*(p.crouch?.6:1);if(d>range)return false;
  if(!e.alert&&d>2.2){const want=Math.atan2(p.x-e.x,p.z-e.z);if(Math.abs(norm(want-(e.yaw||0)))>c.detectCone*Math.PI/360)return false;}
  return clear?!!clear(e,p):true;}
 /* A new enemy record from a mission's armed entry (world position already worked out by the caller). */
 function enemy(a,world,cfg){const c=cfg||tune(),f=FIGURES[a.figure]||FIGURES.security;const hp=Math.round(c.footEnemyHealth*(f.hp||1));
  return {id:a.id,figure:FIGURES[a.figure]?a.figure:'security',role:a.role==='patrol'?'patrol':'guard',x:world.x,z:world.z,post:{x:world.x,z:world.z},yaw:num(a.yaw)?a.yaw:0,homeYaw:num(a.yaw)?a.yaw:0,
   route:(world.route||[]).map(r=>({x:r.x,z:r.z})),leg:0,hp,max:hp,dead:false,alert:false,seen:0,lost:0,fire:c.footEnemyReaction,last:null,state:'idle'};}
 /* One frame of one enemy. ctx: {hostile (may it attack the player now), clear(a,b), blocked(x,z), cfg, rnd}. Returns {shot, hit, damage}. */
 function step(e,p,dt,ctx){const out={shot:false,hit:false,damage:0};if(!e||e.dead)return out;const c=ctx.cfg||tune(),rnd=ctx.rnd||Math.random;dt=Math.max(0,Math.min(.1,dt));
  const blocked=ctx.blocked||(()=>false),move=(tx,tz,speed)=>{const dx=tx-e.x,dz=tz-e.z,n=Math.hypot(dx,dz);if(n<.05)return n;const k=Math.min(n,speed*dt)/n;
   if(!blocked(e.x+dx*k,e.z))e.x+=dx*k;if(!blocked(e.x,e.z+dz*k))e.z+=dz*k;e.yaw=Math.atan2(dx,dz);return n;};
  const line=!!p&&!p.dead&&ctx.hostile&&sees(e,p,c,ctx.clear);
  if(line){e.alert=true;e.lost=0;e.last={x:p.x,z:p.z};e.state='attack';}else if(e.alert){e.lost+=dt;if(!ctx.hostile||e.lost>8){e.alert=false;e.state='return';e.fire=c.footEnemyReaction;}}
  if(e.alert&&ctx.hostile){const d=p?Math.hypot(p.x-e.x,p.z-e.z):99;
   if(line){e.yaw=Math.atan2(p.x-e.x,p.z-e.z);if(d>7)move(p.x,p.z,c.footEnemySpeed*.8);}else if(e.last)if(move(e.last.x,e.last.z,c.footEnemySpeed)<.5)e.last=null;
   e.fire-=dt;if(line&&d<c.detectRange*1.2&&e.fire<=0){e.fire=c.footEnemyReaction+rnd()*.8;out.shot=true;const acc=c.footEnemyAccuracy*(d>14?.75:1)*(p.crouch?.85:1);if(rnd()<acc){out.hit=true;out.damage=c.footEnemyDamage;}}
   return out;}
  // calm: a guard holds its post facing its way; a patrol walks its route and back round
  e.fire=Math.max(e.fire,c.footEnemyReaction*.5);
  if(e.role==='patrol'&&e.route.length>1&&e.state!=='return'){const r=e.route[e.leg%e.route.length];if(move(r.x,r.z,1.15)<.3)e.leg=(e.leg+1)%e.route.length;e.state='patrol';}
  else{const d=move(e.post.x,e.post.z,1.4);if(d<.3){e.state='idle';e.yaw+=norm(e.homeYaw-e.yaw)*Math.min(1,dt*2);}}
  return out;}
 /* The player's shot hits an enemy: -> true when it goes down. A hit always alerts it. */
 function hurt(e,dmg){if(!e||e.dead)return false;e.hp=Math.max(0,e.hp-dmg);e.alert=true;e.lost=0;if(e.hp<=0){e.dead=true;e.state='down';return true;}return false;}
 // ---------------------------------------------------------------- the owner's Zones table (editor content) and a mission's `combat`: checks in plain words, clean copies
 /* ctx: {places: Set of place ids, types: {<module type>: {bounds:[x0,x1,z0,z1]}}} */
 function tableProblems(z,ctx={}){const out=[];if(z==null)return out;if(!keysOk(z,TABLE_KEYS)){out.push('Zones table: unknown fields.');return out;}let n=0;
  for(const [k,label,known] of [['areas','area',ctx.places],['modules','location type',ctx.types&&new Set(Object.keys(ctx.types))]]){const v=z[k];if(v==null)continue;
   if(!plainObj(v)){out.push('Zones table: '+k+' is a list of '+label+'s and zones.');continue;}
   for(const [id,zz] of Object.entries(v)){n++;if(!isZone(zz))out.push('Zones table: '+label+' “'+id+'” must be Friendly, Neutral or Hostile.');if(known&&!known.has(id))out.push('Zones table: there is no '+label+' “'+id+'”.');}}
  if(n>LIMIT.table)out.push('Zones table: at most '+LIMIT.table+' entries.');return out;}
 function cleanTable(z){if(!plainObj(z))return null;const out={};for(const k of TABLE_KEYS){const v=z[k];if(!plainObj(v))continue;const e=Object.entries(v).filter(([id,zz])=>typeof id==='string'&&id.length<=60&&isZone(zz)&&zz!==DEFAULT);if(e.length)out[k]=Object.fromEntries(e.slice(0,LIMIT.table));}
  return Object.keys(out).length?out:null;}
 // The module a reference names in a mission's apartments: {loc, mod, type} or null. Old-style apartments have 'flat' and 'hall'.
 function refOf(m,ref){const r=typeof ref==='string'&&REF.exec(ref);if(!r)return null;const a=((m&&m.apartments)||[]).find(x=>x&&x.id===r[1]);if(!a)return null;
  if(Array.isArray(a.modules)){if(!r[2])return {loc:a,mod:null,type:null};const mm=a.modules.find(x=>x&&x.id===r[2]);return mm?{loc:a,mod:mm.id,type:mm.type}:null;}
  if(!r[2])return {loc:a,mod:null,type:null};if(r[2]==='flat'||r[2]==='hall')return {loc:a,mod:r[2],type:(r[2]==='flat'?'apt-':'hall-')+a.style};return null;}
 function combatProblems(m,ctx={}){const out=[],c=m&&m.combat;if(c==null)return out;if(!keysOk(c,COMBAT_KEYS)){out.push('zones and enemies: unknown fields.');return out;}
  if(c.areas!=null){if(!plainObj(c.areas)||Object.keys(c.areas).length>LIMIT.areas)out.push('zones: at most '+LIMIT.areas+' areas, each Friendly, Neutral or Hostile.');
   else for(const [id,z] of Object.entries(c.areas)){if(!isZone(z))out.push('zones: area “'+id+'” must be Friendly, Neutral or Hostile.');if(ctx.places&&!ctx.places.has(id))out.push('zones: there is no area “'+id+'”.');}}
  if(c.places!=null){if(!plainObj(c.places)||Object.keys(c.places).length>LIMIT.places)out.push('zones: at most '+LIMIT.places+' locations or rooms, each Friendly, Neutral or Hostile.');
   else for(const [ref,z] of Object.entries(c.places)){if(!isZone(z))out.push('zones: “'+ref+'” must be Friendly, Neutral or Hostile.');if(!refOf(m,ref))out.push('zones: “'+ref+'” is not one of this mission’s locations or rooms.');}}
  if(c.onDeath!=null&&!ON_DEATH.includes(c.onDeath))out.push('if the player is taken down: try again or fail the mission.');
  if(c.armed!=null){if(!Array.isArray(c.armed)||c.armed.length>LIMIT.armed){out.push('a mission has at most '+LIMIT.armed+' armed people.');return out;}const ids=new Set();
   for(const a of c.armed){const w='armed person “'+((a&&a.id)||'?')+'”';if(!keysOk(a,ARMED_KEYS)){out.push(w+' has unknown fields.');continue;}
    if(typeof a.id!=='string'||!ID.test(a.id))out.push(w+': its name is lowercase letters, digits and hyphens (24 at most).');else if(ids.has(a.id))out.push(w+': two armed people have the same name.');ids.add(a.id);
    if(!FIGURES[a.figure])out.push(w+': choose a figure ('+Object.keys(FIGURES).join(', ')+').');if(a.role!=null&&!ROLES.includes(a.role))out.push(w+': guard or patrol.');
    if(a.yaw!=null&&!num(a.yaw))out.push(w+': the way they face is a number.');
    const r=refOf(m,a.at);if(!r||!r.mod){out.push(w+': choose the room (module) they stand in.');continue;}
    const b=(ctx.types&&ctx.types[r.type]&&ctx.types[r.type].bounds)||null,inside=(x,z)=>num(x)&&num(z)&&(!b||(x>=b[0]&&x<=b[1]&&z>=b[2]&&z<=b[3]));
    if(!inside(a.x,a.z))out.push(w+': they must stand inside the room'+(b?' (x '+b[0]+'..'+b[1]+', z '+b[2]+'..'+b[3]+')':'')+'.');
    if(a.route!=null){if(!Array.isArray(a.route)||a.route.length>LIMIT.route||a.route.some(p=>!Array.isArray(p)||p.length!==2||!inside(p[0],p[1])))out.push(w+': a patrol route is up to '+LIMIT.route+' points inside the room.');}
    if(a.role==='patrol'&&!(Array.isArray(a.route)&&a.route.length>=1))out.push(w+': a patrol needs at least one route point.');}}
  return out;}
 const r2=v=>Math.round(v*100)/100;
 function stripCombat(c){if(!plainObj(c))return null;const out={};
  if(plainObj(c.areas)){const e=Object.entries(c.areas).filter(([,z])=>isZone(z)).slice(0,LIMIT.areas);if(e.length)out.areas=Object.fromEntries(e);}
  if(plainObj(c.places)){const e=Object.entries(c.places).filter(([k,z])=>REF.test(k)&&isZone(z)).slice(0,LIMIT.places);if(e.length)out.places=Object.fromEntries(e);}
  if(Array.isArray(c.armed)){const a=c.armed.filter(x=>x&&typeof x.id==='string'&&typeof x.at==='string'&&num(x.x)&&num(x.z)).slice(0,LIMIT.armed).map(x=>{const y={id:x.id,at:x.at,x:r2(x.x),z:r2(x.z),figure:FIGURES[x.figure]?x.figure:'security',role:x.role==='patrol'?'patrol':'guard'};
    if(Array.isArray(x.route)&&x.route.length)y.route=x.route.slice(0,LIMIT.route).filter(p=>Array.isArray(p)&&num(p[0])&&num(p[1])).map(p=>[r2(p[0]),r2(p[1])]);if(num(x.yaw))y.yaw=r2(x.yaw);return y;});if(a.length)out.armed=a;}
  if(ON_DEATH.includes(c.onDeath)&&c.onDeath!=='retry')out.onDeath=c.onDeath;return Object.keys(out).length?out:null;}
 // ---------------------------------------------------------------- the "Change zone" step (the owner: "let me change a room or area from friendly to hostile in the mission timeline")
 /* A step {kind:'zone', label, target, zone, until?, spawn?}: target '<loc>' / '<loc>/<module>' (this mission's locations) or 'area:<place id>'. It completes as soon as it is
    reached; from then the target has that zone until the step named in `until` is done (default: until the mission ends; then it is back to its normal zone).
    spawn: the armed people placed in that room (or location) appear only when this step is reached. */
 const STEP_KEYS=['target','zone','until','spawn'];
 function stepProblems(m,o,ctx={}){const out=[],w='step '+((o&&o.id)||'?');if(!o||o.kind!=='zone'){if(o&&STEP_KEYS.some(k=>o[k]!=null))out.push(w+': only a “Change zone” step names a zone.');return out;}
  if(!isZone(o.zone))out.push(w+': choose Friendly, Neutral or Hostile.');
  const t=o.target;if(typeof t!=='string'||!t)out.push(w+': choose the room, location or area that changes.');else if(t.startsWith('area:')){if(ctx.places&&!ctx.places.has(t.slice(5)))out.push(w+': there is no area “'+t.slice(5)+'”.');}else if(!refOf(m,t))out.push(w+': “'+t+'” is not one of this mission’s locations or rooms.');
  if(o.until!=null){const steps=(m.objectives||[]).map(x=>x&&x.id),i=steps.indexOf(o.id),j=steps.indexOf(o.until);if(j<0||j<=i)out.push(w+': “until” must be a later step of this mission (or leave it empty: until the mission ends).');}
  if(o.spawn!=null&&typeof o.spawn!=='boolean')out.push(w+': “bring in the armed people placed there” is yes or no.');
  if(o.say!=null||o.early!=null||o.via!=null)out.push(w+': a “Change zone” step has no lines.');return out;}
 function stripStep(o,x){if(typeof o.target==='string')x.target=o.target;if(isZone(o.zone))x.zone=o.zone;if(typeof o.until==='string'&&o.until)x.until=o.until;if(o.spawn===true)x.spawn=true;if(!x.label)x.label='Change zone';return x;}
 /* The zone changes in force for a taken mission now: [{target, zone, step}] in step order (a later one wins). rec: state.universe.missions[id]. */
 function changesNow(m,rec){if(!m||!rec||!rec.acquired||rec.completed)return [];const done=rec.objectives||{},out=[];
  for(const o of m.objectives||[])if(o&&o.kind==='zone'&&done[o.id]===true&&isZone(o.zone)&&!(o.until&&done[o.until]===true))out.push({target:o.target,zone:o.zone,step:o.id});return out;}
 /* Armed people still waiting for a "Change zone" step with spawn (not yet reached). */
 function waiting(m,rec,a){const done=(rec&&rec.objectives)||{};return (m.objectives||[]).some(o=>o&&o.kind==='zone'&&o.spawn===true&&done[o.id]!==true&&typeof o.target==='string'&&(a.at===o.target||a.at.startsWith(o.target+'/')));}
 // The "Change zone" step waiting to complete now (it completes the moment it is reached): [{mission, step}].
 function dueNow(m,rec){if(!m||!rec||!rec.acquired||rec.completed)return null;const done=rec.objectives||{};const o=(m.objectives||[]).find(x=>x&&done[x.id]!==true);return o&&o.kind==='zone'?{mission:m.id,step:o.id}:null;}
 // The admin inventory's `zones` (the server checks with the same lists).
 function inventory(){return {zones:ZONES.slice(),default:DEFAULT,figures:Object.keys(FIGURES),roles:ROLES.slice(),onDeath:ON_DEATH.slice(),limit:{...LIMIT},weapons:WEAPONS.slice(),armedKeys:ARMED_KEYS.slice(),combatKeys:COMBAT_KEYS.slice(),tableKeys:TABLE_KEYS.slice(),stepKeys:STEP_KEYS.slice()};}
 const api={SKIRMISH_DIFFICULTY,GROUND,gun,skirmish,shotDir,STEP_KEYS,stepProblems,stripStep,changesNow,waiting,dueNow,ZONES,DEFAULT,INFO,FIGURES,ROLES,ON_DEATH,LIMIT,PISTOL,WEAPONS,TUNE,REF,tune,rules,zoneAt,press,rearm,provoke,hostileNow,lineClear,sees,enemy,step,hurt,tableProblems,cleanTable,refOf,combatProblems,stripCombat,inventory,isZone};
 if(node)module.exports=api;else root.VoidZones=api;
})(globalThis);
