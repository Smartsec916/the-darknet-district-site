/* Flight combat upgrade (19 Nov 2026): missiles M1 / M2 (ordnance.js), guidance with a turn limit, seeker cone and proximity fuse (missiles.js),
   the ship grant (launcher, full M1 rack, Ship Loadout app), Admin's prices, saves and the Mission Editor's missile reward. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../void-runner/campaign.js'),P=require('../void-runner/progression.js'),O=require('../void-runner/ordnance.js'),M=require('../void-runner/missiles.js');
const B=require('../void-runner/balance.js').defaults,FM=require('../void-runner/cockpit-math.js'),D=require('../void-runner/device-v1.js'),MC=require('../void-runner/mission-content.js');
const district=()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;return s;};
const roundTrip=s=>C.restore(JSON.stringify(s));

test('a new District campaign has no ship, no launcher, no missiles to buy and no Loadout app',()=>{
 const s=district();assert.equal(O.hasShip(s),false);assert.equal(O.launcher(s),false);assert.equal(O.canBuy(s,'m1',1),'You need a ship first.');
 assert.equal(D.restore(s.story.flags).apps.includes('loadout'),false);const r=roundTrip(s);assert.equal(r.story.flags.loadoutApp,undefined);assert.equal(r.creditGear.includes('launcher'),false);
});
test('the ship grant fits the launcher with a full M1 rack and installs the Ship Loadout app; it survives a reload and is idempotent',()=>{
 const s=district();s.credits=5000;C.awardStarterShip(s);
 assert.equal(O.launcher(s),true);assert.equal(s.loadout.missile,'launcher');assert.deepEqual(O.counts(s),{m1:6,m2:0});assert.equal(O.selected(s),'m1');assert.equal(s.story.flags.loadoutApp,true);
 assert.ok(D.restore(s.story.flags).apps.includes('loadout'));assert.equal(D.storage(D.restore(s.story.flags)).usedPct,75,'the granted app takes no storage');
 s.progression.missiles=2;assert.equal(O.grant(s),false,'a second grant changes nothing');assert.equal(s.progression.missiles,2);
 const r=roundTrip(s);assert.deepEqual(O.counts(r),{m1:2,m2:0});assert.equal(r.loadout.missile,'launcher');assert.equal(r.story.flags.loadoutApp,true);
});
test('a District save that already owned a ship (the developer test ship, an earlier mission) gets the rails and the app once on load',()=>{
 const s=district();C.grantShip(s);s.ownedShips=['starter'];assert.equal(s.creditGear.includes('launcher'),false);
 const r=roundTrip(s);assert.equal(O.launcher(r),true);assert.equal(r.loadout.missile,'launcher');assert.equal(r.story.flags.loadoutApp,true);assert.deepEqual(O.counts(r),{m1:6,m2:0});
 r.loadout.missile=null;const again=roundTrip(r);assert.equal(again.loadout.missile,null,'the player’s own choice to remove it is kept');
});
test('Admin’s counter: prices from the balance values, rack limits, credits; only with a ship',()=>{
 const s=district();C.awardStarterShip(s);s.credits=1000;
 assert.equal(O.price('m1'),B.missileM1Price);assert.equal(O.price('m2'),B.missileM2Price);assert.ok(B.missileM2Price>B.missileM1Price);
 assert.equal(O.canBuy(s,'m1',1),'Rack full.');assert.equal(O.capacity(s,'m2'),3);
 assert.equal(O.buy(s,'m2',2),true);assert.equal(s.credits,1000-2*B.missileM2Price);assert.equal(O.counts(s).m2,2);
 assert.equal(O.canBuy(s,'m2',2),'Only 1 more fit the rack.');s.credits=10;assert.equal(O.canBuy(s,'m2',1),'Not enough credits.');
 s.credits=1000;s.progression.missiles=1;assert.equal(O.buy(s,'m1',5),true);assert.equal(O.counts(s).m1,6);
 const r=roundTrip(s);assert.deepEqual(O.counts(r),{m1:6,m2:2});
});
test('M1 turns faster but hits for less than M2; M2 has the bigger blast',()=>{
 const a=O.spec('m1',B),b=O.spec('m2',B);assert.ok(a.turn>b.turn);assert.ok(a.damage<b.damage);assert.ok(a.blast<b.blast);
 for(const k of ['missileM1Damage','missileM1TurnRate','missileM1Speed','missileM1Blast','missileM1Price','missileM2Damage','missileM2TurnRate','missileM2Speed','missileM2Blast','missileM2Price'])assert.ok(require('../void-runner/balance.js').spec[k],k+' is a Combat Balance value');
});
function fly(type,breakAt){const e={x:0,y:0,z:120,size:1,relationship:'hostile'},s={ownsMissileLauncher:true,equipped:true,missilesLoaded:1,missileCapacity:1};
 const m=M.launch(s,{target:e,progress:1},FM.basis(0,0),B,0,O.spec(type,B));let hit=0,t=0;
 for(let i=0;i<600&&!m.dead;i++){const dt=1/60;t+=dt;if(t>breakAt){e.x+=50*dt;e.y+=15*dt;e.z-=30*dt;}M.step(m,dt,{x:0,y:0,z:0},B,[e],(_,d,direct)=>{if(direct)hit+=d;});}
 return {hit,lost:!!m.lost,detonated:m.detonated};}
test('guidance: both hit a steady target; on a hard break the slow M2 loses it and misses, the agile M1 holds on',()=>{
 assert.ok(fly('m1',99).hit>0);assert.ok(fly('m2',99).hit>0);
 const m2=fly('m2',.25),m1=fly('m1',.25);assert.equal(m2.hit,0,'M2 misses');assert.ok(m2.detonated&&!m2.detonated.hit);assert.ok(m1.hit>0,'M1 hits');
});
test('proximity fuse and blast: a near pass detonates and nearby ships take part of the damage',()=>{
 const e={x:3,y:0,z:60,size:1,relationship:'hostile'},o={x:9,y:0,z:62,size:1,relationship:'hostile'},s={ownsMissileLauncher:true,equipped:true,missilesLoaded:1,missileCapacity:1},got=new Map();
 const m=M.launch(s,{target:e,progress:1},FM.basis(0,0),B,0,{...O.spec('m2',B),turn:0});for(let i=0;i<200&&!m.dead;i++)M.step(m,1/60,{x:0,y:0,z:0},B,[e,o],(x,d)=>got.set(x,(got.get(x)||0)+d));
 assert.ok(got.get(e)>0,'fused next to its target');assert.ok(got.get(o)>0&&got.get(o)<got.get(e),'splash, less than the direct hit');
});
test('dumb-fire: no lock still launches, unguided; no ammo or cooldown still refuses',()=>{
 const s={ownsMissileLauncher:true,equipped:true,missilesLoaded:1,missileCapacity:1};const m=M.launch(s,{target:null,progress:0},FM.basis(0,0),B,0,{dumb:true});assert.ok(m);assert.equal(m.target,null);
 assert.equal(M.launch(s,{target:null,progress:0},FM.basis(0,0),B,0,{dumb:true}),null);assert.equal(M.launch({...s,missilesLoaded:1},{target:null,progress:0},FM.basis(0,0),B,1,{dumb:true}),null);
});
test('progression keeps M2 rounds and the selected type; bad values are cleaned',()=>{
 const s=district(),p=P.restore({...s.progression,m2:99,missileType:'nuke'},s);assert.equal(p.m2,30);assert.equal(p.missileType,'m1');
 const q=P.restore({...s.progression,m2:2,missileType:'m2'},s);assert.equal(q.m2,2);assert.equal(q.missileType,'m2');
});
test('Mission Editor: a missile reward is checked and given (up to the rack), the ship grant names the launcher and the app',()=>{
 assert.ok(MC.UNLOCKS.includes('missiles'));const G=require('../void-runner/mission-givers.js');
 assert.match(G.UNLOCK_KINDS.find(k=>k.id==='ship').note,/Ship Loadout app/);assert.ok(G.UNLOCK_KINDS.find(k=>k.id==='missiles').supported);
 const inv=JSON.parse(fs.readFileSync(path.join(__dirname,'..','void_runner_admin_inventory.json'),'utf8'));assert.ok(inv.missionEditor.unlockKinds.includes('missiles'),'the server knows the new reward');
 const src=fs.readFileSync(path.join(__dirname,'..','void-runner/mission-content.js'),'utf8');assert.match(src,/missiles must be M1 or M2, 1 to 30/);
});
test('the game page loads the new scripts in order, the static copy matches and the keymap knows the switch key',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','void-runner.html'),'utf8'),at=f=>html.indexOf('void-runner/'+f+'"');
 for(const f of ['ordnance.js','flight-sfx.js','flight-fx.js','ship-loadout.js'])assert.ok(at(f)>0,f);
 assert.ok(at('ordnance.js')<at('campaign.js'));assert.ok(at('combat.js')<at('flight-sfx.js'));assert.ok(at('personal-device.js')<at('ship-loadout.js'));assert.ok(at('faction-scenes.js')<at('ship-loadout.js'));
 assert.equal(html,fs.readFileSync(path.join(__dirname,'..','static/void-runner.html'),'utf8'));
 assert.equal(require('../void-runner/keymap.js').DEFAULTS.missileSwitch,'KeyZ');
});
test('Flight Skirmish and Campaign flight share one flight model and one weapons source (the owner: a change in one applies to both)',()=>{
 const src=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8'),sk=src('flight-skirmish.js'),combat=src('combat.js');
 // the skirmish runs the Campaign's own launch / update / fire / hurt, wrapped (never a copy)
 for(const w of ['campaignUpdate=update','campaignMissile=fireMissile','campaignHurt=hurt','await launch()'])assert.ok(sk.includes(w),w);
 assert.ok(!/function (fireMissile|stepMissileCombat|hitEnemy|drawMissileReticle|switchMissile)\b/.test(sk),'no weapon code of its own');
 // no weapon or flight number of its own: every balance key lives in balance-data.js
 for(const k of Object.keys(require('../void-runner/balance.js').spec))assert.ok(!sk.includes(k),'flight-skirmish.js must not set '+k);
 assert.ok(!/VOID_BALANCE\s*[.\[]\w*\s*=|missileTurnRate|missileDamage|laserDamage/.test(sk));
 // ordnance.js has no skirmish branch: the same M1 / M2 numbers everywhere
 assert.ok(!/skirmish/i.test(src('ordnance.js').replace(/\/\*[\s\S]*?\*\//g,'')));
 // the skirmish's difficulty touches only how hard a lock is (time and circle size), not the weapons
 const diff=combat.match(/const missileDifficulty=(\{[^;]*\});/)[1];assert.deepEqual(Object.keys(Object.values(eval('('+diff+')'))[0]).sort(),['radius','time']);
 // skirmish ammunition rule: full racks of the same types (ordnance capacities), on the throwaway copy
 assert.match(sk,/s\.progression\.missiles=O\.capacity\(s,'m1'\);s\.progression\.m2=O\.capacity\(s,'m2'\)/);
 // the same visuals and sounds: drawn and played by the shared flight code, whatever the mode
 assert.ok(!/VoidFlightSkirmish/.test(src('flight-fx.js')));assert.ok(!/VoidFlightSkirmish/.test(src('flight-sfx.js')));
});
test('flight navigation: this system’s places, warp markers to other systems, the marker toward a far place, mission markers and the nav target',()=>{
 const N=require('../void-runner/flight-nav.js'),U=require('../void-runner/universe.js');
 const s=district();C.awardStarterShip(s);s.location='earth';s.universe.discoveredLocations=[...new Set([...s.universe.discoveredLocations,'earth','sol-belt','mars','meridian','kepler','vigil'])];
 const e=N.entries(s),by=id=>e.find(x=>x.id===id);
 assert.equal(by('sol-belt').kind,'station');assert.equal(by('mars').kind,'planet');assert.equal(by('meridian').kind,'warp','Erebus’s hub is the warp marker to that system');assert.equal(by('vigil').kind,'warp');
 assert.equal(by('kepler').direct,false);assert.equal(by('kepler').marker,'meridian','a far station is reached through its system’s warp marker');assert.equal(N.markerFor(s,'kepler'),U.nextHop('earth','kepler'));
 assert.equal(N.select(s,'kepler'),true);assert.equal(N.target(s),'kepler');assert.equal(N.markerFor(s,N.target(s)),'meridian');
 assert.equal(N.select(s,'holdfast'),false,'an unknown place cannot be chosen');
 const r=roundTrip(s);assert.equal(N.target(r),'kepler','kept in the save (story.flags.navTarget)');
 r.location='meridian';assert.equal(N.markerFor(r,'kepler'),'kepler','after the warp the square moves to the station itself');
 r.location='kepler';assert.equal(N.arrived(r),true);assert.equal(N.target(r),null,'arriving ends it');
 const mm=N.missionMarkers(s,[{id:'m',title:'Job',destination:'kepler'},{id:'n',title:'Local',destination:'sol-belt'},{id:'o',title:'Done',destination:'vigil',completed:true}]);
 assert.deepEqual(mm,[{marker:'meridian',mission:'Job',destination:'kepler'}],'only missions in another system, on the warp marker toward them');
 assert.equal(N.select(s,''),true);assert.equal(N.target(s),null);
});
