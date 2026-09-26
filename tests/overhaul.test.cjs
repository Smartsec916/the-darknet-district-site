const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),S=require('../void-runner/ships.js'),F=require('../void-runner/pilot-flight.js'),M=require('../void-runner/cockpit-math.js'),W=require('../void-runner/warp.js'),AI=require('../void-runner/enemy-pilots.js'),Audio=require('../void-runner/ship-audio.js');
test('ship purchases deduct once, retain old hull and persist active loadouts',()=>{
 const s=C.fresh();assert.deepEqual(s.ownedShips,['starter']);assert.equal(S.ships.ship2.price,1000);assert(!C.buyShip(s,'ship2'));s.credits=3500;
 assert(C.buyShip(s,'ship2'));assert.equal(s.credits,2500);assert(!C.buyShip(s,'ship2'));assert.equal(s.credits,2500);assert.equal(s.activeShip,'starter');assert(!C.switchShip(s,'ship3'));
 assert(C.switchShip(s,'ship2'));assert(C.equip(s,'pulse1'));assert.equal(s.loadout.weapon,'pulse1');assert(C.switchShip(s,'starter'));assert(C.switchShip(s,'ship2'));assert.equal(s.loadout.weapon,'pulse1');
 const r=C.restore(JSON.stringify(s));assert.equal(r.activeShip,'ship2');assert.equal(r.loadout.weapon,'pulse1');assert.deepEqual(r.ownedShips,['starter','ship2']);assert(!C.buyShip(r,'ship3'));assert.equal(r.credits,2500);
});
test('only explicitly owned or server verified equipment equips',()=>{
 const s=C.fresh();assert(!C.equip(s,'pulse3'));assert(!C.equip(s,'wraith'));s.loadout.weapon='wraith';assert.equal(C.stats(s).damage,1);assert(C.equip(s,'wraith',['wraith']));
 s.loadout.weapon='pulse3';assert.equal(C.stats(s).damage,1);const r=C.restore(JSON.stringify(s));assert(!C.ownsEquipment(r,'pulse3'));assert(!C.equip(r,'launcher'));
});
test('second completed enemy run unlocks one persistent Rook offer, installation is separate',()=>{
 let s=trained(C.fresh());s.missileOfferSeen=false;assert(!s.creditGear.includes('launcher'));assert(!C.buyGear(s,'launcher'));C.beginJourney(s);C.complete(s);C.accept(s);const first=C.complete(s);assert.equal(s.combatRuns,1);assert(!first.missileOffer);assert(!C.buyGear(s,'launcher'));
 C.complete(s);assert.equal(s.combatRuns,1);C.accept(s);const second=C.complete(s);assert.equal(s.combatRuns,2);assert(second.missileOffer);assert(!s.creditGear.includes('launcher'));s.missileOfferSeen=true;
 s=C.restore(JSON.stringify(s));assert(s.missileOfferSeen&&s.missileUnlocked);const credits=s.credits;assert(C.buyGear(s,'launcher'));assert.equal(s.credits,credits);assert(!C.buyGear(s,'launcher'));assert.equal(s.loadout.missile,null);assert(C.equip(s,'launcher'));assert.equal(s.loadout.missile,'launcher');assert(C.restore(JSON.stringify(s)).creditGear.includes('launcher'));
 C.accept(s,'medicine');assert(!C.complete(s).missileOffer);assert.equal(C.complete(s),null);
});
test('old saves safely migrate without treating equipped gear or ammunition as ownership',()=>{
 const s=C.fresh();for(const k of ['ownedShips','activeShip','standardGear','shipLoadouts','combatRuns','missileOfferSeen','missileUnlocked','travel','destination'])delete s[k];s.completed=4;s.loadout.missile='launcher';s.missilesLoaded=20;
 const r=C.restore(JSON.stringify(s));assert.equal(r.activeShip,'starter');assert(r.missileUnlocked);assert(!r.creditGear.includes('launcher'));assert(!C.ownsEquipment(r,'launcher'));assert.equal(r.travel,null);
});
function simulate(ship,hz){const s={yaw:0,pitch:0,roll:0,throttle:.8};F.reset(s);for(let i=0;i<hz*2;i++)F.step(s,{x:1,y:.4,roll:.2,throttle:1},1/hz,ship.flight);return s;}
test('flight tiers differ, bounded acceleration and inertia remain stable across frame rates',()=>{
 const angles=[];for(const ship of Object.values(S.ships)){const a=simulate(ship,30),b=simulate(ship,144);assert(Math.abs(a.yaw-b.yaw)<.025);assert(Math.abs(M.length(a.velocity)-M.length(b.velocity))<.2);assert(M.length(a.velocity)<=ship.flight.maxSpeed+.001);assert(a.pitch<=1.48);angles.push(a.yawRate);const before=a.yawRate;F.step(a,{},1/60,ship.flight);assert(a.yawRate>0&&a.yawRate<before);}
 assert(angles[0]<angles[1]&&angles[2]<angles[1]);const s={yaw:0,pitch:0,roll:0,throttle:.8};F.reset(s);F.step(s,{},1/60,S.ships.starter.flight);assert(M.length(s.velocity)<1);
});
test('all pilot tiers initialize, evade lock threats, retreat and return within flight bounds',()=>{
 const context={velocity:{x:0,y:0,z:0},forward:{x:0,y:0,z:1},right:{x:1,y:0,z:0},shieldsDown:false,missileThreat:true};
 for(const tier of Object.keys(AI.tiers)){const e={x:0,y:0,z:60,age:0,armor:10,maxArmor:10};AI.init(e,tier);AI.step(e,.1,context);assert.equal(e.pilot.state,'evade');context.missileThreat=false;e.pilot.timer=0;e.pilot.decision=0;e.armor=1;AI.step(e,.1,context);assert.equal(e.pilot.state,'retreat');for(let i=0;i<3600;i++){e.age+=1/60;AI.step(e,1/60,context);for(const a of ['x','y','z'])e[a]+=e.velocity[a]/60;}assert(M.length(e)<300);assert(M.length(e.velocity)<=AI.tiers[tier].speed*1.11);context.missileThreat=true;}
});
test('warp requires alignment, interrupts, persists and resumes the same destination',()=>{
 const r=W.create('meridian','kepler','legal-run',true);for(let i=0;i<100;i++)W.step(r,.1,{x:0,y:0,z:-1});assert.equal(r.phase,'align');for(let i=0;i<7;i++)W.step(r,.1,r.vector);assert.equal(r.phase,'warp');for(let i=0;i<Math.ceil(W.config.warpSeconds*W.config.interruption/.1);i++)W.step(r,.1,r.vector);assert.equal(r.phase,'encounter');assert.equal(r.progress,.42);
 const saved=W.restore(JSON.parse(JSON.stringify(r)),'meridian','kepler','legal-run',true);assert.equal(saved.phase,'encounter');W.step(saved,.1,saved.vector,true);assert.equal(saved.phase,'align');assert.equal(saved.destination,'kepler');for(let i=0;i<150;i++)W.step(saved,.1,saved.vector,true);assert.equal(saved.phase,'arrived');assert.equal(saved.progress,1);
 const s=C.fresh();s.quest='legal-run';s.travel=saved;C.complete(s);assert.equal(s.travel,null);
});
test('free navigation requires Rook unlock and preserves loaded cargo',()=>{const s=C.fresh();assert(!C.chooseDestination(s,'foundry'));trained(s);s.quest='open';require('../void-runner/universe.js').unlock(s);assert(C.chooseDestination(s,'foundry'));assert.equal(C.flight(s).kind,'transit');s.contract='medicine';assert(C.chooseDestination(s,'kepler'));assert.equal(s.contract,'medicine');});
test('audio absence and disabled voices fail gracefully; settings clamp and persist',()=>{
 let saved;global.localStorage={setItem:(k,v)=>saved=v};Audio.set({enabled:true,voiceEnabled:true,master:9});Audio.unlock();Audio.event('laser',S.ships.starter);Audio.update(S.ships.starter,1,1,'warp',true);assert.equal(Audio.speak('rook','Testing'),false);Audio.set({voiceEnabled:false});assert.equal(JSON.parse(saved).master,1);assert.equal(JSON.parse(saved).voiceEnabled,false);Audio.cancel();delete global.localStorage;
});
test('NPC speech replaces previous lines, uses stable varied profiles and cancels on disable',()=>{
 const spoken=[];let cancelled=0;
 global.SpeechSynthesisUtterance=class {constructor(text){this.text=text;}};
 global.speechSynthesis={cancel:()=>cancelled++,getVoices:()=>[{name:'Device A',lang:'en-US',localService:true},{name:'Device B',lang:'en-GB',localService:true}],speak:u=>spoken.push(u)};
 Audio.set({enabled:true,voiceEnabled:true});assert(Audio.speak('rook','First line'));assert(Audio.speak('rook','Second line'));assert.equal(spoken[0].pitch,spoken[1].pitch);assert.equal(spoken[0].voice.name,spoken[1].voice.name);assert(Audio.speak('mara','Different speaker'));assert.notEqual(spoken[2].pitch,spoken[1].pitch);assert(cancelled>=3);Audio.set({voiceEnabled:false});assert(!Audio.speak('rook','Disabled'));Audio.cancel();delete global.speechSynthesis;delete global.SpeechSynthesisUtterance;
});


function trained(s){s.progression.opening={version:2,hologram:true,pistol:true,cans:[0,1,2,3]};s.progression.personal.weapon='ward-pistol';const P=require('../void-runner/progression.js');for(const f of P.flags)s.progression.flags[f]=true;s.progression.completed=true;s.progression.equipment.owned=['cooling'];s.missileOfferSeen=true;s.progression.checkpoint={location:s.location};return s;}
