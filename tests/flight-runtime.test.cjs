const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../void-runner/campaign.js'),P=require('../void-runner/progression.js'),Ships=require('../void-runner/ships.js'),M=require('../void-runner/missiles.js'),Math3=require('../void-runner/cockpit-math.js'),B=require('../void-runner/balance.js').defaults,Content=require('../void-runner/content.js'),R=require('../void-runner/flight-runtime.js');
const read=n=>fs.readFileSync(require.resolve('../void-runner/'+n+'.js'),'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
function harness(ship='starter',options={}){
 Ships.verify(ship==='ship3'?['spectre']:[]);const state=C.fresh();state.ownedShips.push('ship2');state.standardGear.push('pulse2','shield2');C.switchShip(state,ship);
 state.creditGear.push('launcher');state.loadout.missile='launcher';state.progression.missiles=options.ammo??4;
 state.upgrades={guns:1,armor:1,engines:1,shields:1};
 state.progression.equipment.owned.push('capacitor','shield');state.progression.equipment.installed[state.activeShip]={power:'capacitor',shield:'shield'};
 let c;const owner={status:'PREPARING'},saves=[];
 c=vm.createContext({VoidFlightSession:{active:owner},VoidFlightRuntime:R,VoidShips:Ships,P,VoidContent:Content,VOID_BALANCE:B.defaults||B,
  state,ownedGear:ship==='ship3'?['spectre']:[],trialGear:null,devMissileTrial:false,VoidDevTools:{authorized:false},mode:'play',view:'flight',
  save:()=>saves.push(copy(state)),hud(){},hangar(){},market(){},updateEquipmentHud(){},tone(){},panel(){},button(){},shipCard(){},clearInput(){},flightUI(){},VoidCombatEffects:{pulse(){}}});
 c.C={...C,stats:s=>C.stats(s,c.ownedGear)};
 vm.runInContext(read('flight-runtime-integration'),c);
 const game=read('game'),expansion=read('expansion');
 vm.runInContext(game.slice(game.indexOf('function hurt(amount)'),game.indexOf('function pause()')),c);
 vm.runInContext(expansion.slice(expansion.indexOf('const expansionHurt='),expansion.indexOf('const expansionSpawn=')),c);
 vm.runInContext(expansion.slice(expansion.indexOf('function setOwnedGear('),expansion.indexOf('const expansionDock=')),c);
 c.VoidFlightCraft.initialize();owner.status='RUNNING';return {c,owner,state,saves};
}
for(const id of ['starter','ship2','ship3'])test('Campaign '+id+' configuration matches shared derived stats and initialization',()=>{
 const {c,owner,state}=harness(id),config=owner.craft.config,r=owner.craft.resources;
 assert.deepEqual(config.stats,copy(c.C.stats(state)));assert.deepEqual(config.systems,copy(P.systems(state)));assert.equal(config.shipId,id);
 assert.equal(r.hp,config.stats.hull);assert.equal(r.shieldHP,config.stats.shield);assert.equal(r.weaponBank.energy,config.systems.capacity);assert.equal(r.missileState.missileCapacity,Ships.ships[id].missile.capacity);assert.equal(r.missileState.missilesLoaded,4);
 assert.equal(config.systems.cargo,id==='ship3'?3:1);assert(Object.isFrozen(config.stats.flight));assert(Object.isFrozen(config.ship));
});
test('configuration records validated loadout and installed modules without source aliases',()=>{
 const {c,owner,state}=harness();assert.equal(owner.craft.config.modules.power,'capacitor');assert.equal(owner.craft.config.loadout.missile,'launcher');
 const before=copy(owner.craft.config);state.upgrades.guns=99;state.loadout.weapon='wraith';state.progression.equipment.installed.starter.power=null;
 assert.deepEqual(owner.craft.config,before);assert.equal(c.VoidFlightCraft.stats().damage,before.stats.damage);
});
test('real shield and hull damage operates on session resources without mutating definitions or Campaign',()=>{
 const {c,owner,state}=harness('ship2'),before=copy(state),defs=copy(Ships.ships),r=owner.craft.resources,hull=r.hp,shield=r.shieldHP;
 c.hurt(shield+7);assert.equal(r.shieldHP,0);assert.equal(r.hp,hull-7);assert.equal(r.shieldDelay,owner.craft.config.stats.shieldDelay);
 assert.deepEqual(state,before);assert.deepEqual(Ships.ships,defs);
});
test('damage protection and drive immunity retain their current behavior',()=>{
 const {c,owner}=harness(),r=owner.craft.resources,before=copy(r);r.driveTime=1;c.hurt(20);assert.equal(r.hp,before.hp);assert.equal(r.shieldHP,before.shieldHP);
 r.driveTime=0;r.damageTime=.2;c.hurt(20);assert.equal(r.shieldHP,before.shieldHP);
});
test('replacement initializes fresh resources without sharing old banks or missile state',()=>{
 const {c,owner}=harness(),old=owner.craft;old.resources.hp=1;old.resources.weaponBank.energy=0;old.resources.missileState.missilesLoaded=0;
 c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();const next=c.VoidFlightSession.active.craft;
 assert.equal(next.resources.hp,next.config.stats.hull);assert.equal(next.resources.weaponBank.energy,next.config.systems.capacity);assert.equal(next.resources.missileState.missilesLoaded,4);
 assert.notEqual(old.resources.weaponBank,next.resources.weaponBank);assert.notEqual(old.resources.missileState,next.resources.missileState);
});
test('account refresh updates Campaign ownership without clamping the active craft',()=>{
 const {c,owner,state,saves}=harness('ship3');owner.craft.resources.hp-=9;const before=copy(owner.craft);
 c.setOwnedGear([]);assert.equal(state.activeShip,'starter');assert.equal(saves.length,1);assert.deepEqual(owner.craft,before);assert.equal(c.VoidFlightCraft.ship().id,'ship3');
 c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();assert.equal(c.VoidFlightSession.active.craft.config.shipId,'starter');
});
test('pause keeps the same resource objects and values',()=>{const {c,owner}=harness(),r=owner.craft.resources;r.hp-=8;r.weaponBank.energy=12;const before=copy(r);owner.status='PAUSED';assert.equal(c.weaponBank,r.weaponBank);assert.equal(c.missileState,r.missileState);owner.status='RUNNING';assert.deepEqual(r,before);});
for(const [name,ammo,expected]of [['empty',0,0],['partial',3,3],['over capacity',99,6]])test('missile initialization preserves '+name+' count',()=>{const {owner}=harness('starter',{ammo});assert.equal(owner.craft.resources.missileState.missilesLoaded,expected);});
test('unowned launcher remains unavailable despite a selected slot',()=>{const {c,state}=harness();state.creditGear=[];c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();const m=c.missileState;assert.equal(m.ownsMissileLauncher,false);assert.equal(m.equipped,false);assert.equal(m.missilesLoaded,0);assert.equal(m.missileCapacity,0);});
test('owned unequipped launcher retains capacity but no loaded rounds',()=>{const {c,state}=harness();state.loadout.missile=null;c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();assert.equal(c.missileState.missileCapacity,6);assert.equal(c.missileState.missilesLoaded,0);assert.equal(c.missileState.equipped,false);});
test('unset Campaign missile count retains the existing full-capacity default',()=>{const {c,state}=harness();state.progression.missiles=null;c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();assert.equal(c.missileState.missilesLoaded,6);});
test('authorized developer missile trial and explicit revocation retain their special rules',()=>{
 const {c}=harness();c.devMissileTrial=true;c.trialGear='missile';c.VoidDevTools.authorized=true;c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();
 assert.equal(c.missileState.missileCapacity,12);assert.equal(c.missileState.missilesLoaded,12);
 c.VoidDevTools.authorized=false;c.devMissileTrial=false;Object.assign(c.missileState,c.VoidFlightCraft.missiles());assert.equal(c.missileState.missileCapacity,6);assert.equal(c.missileState.missilesLoaded,4);
});
test('unverified premium selection cannot produce premium configuration',()=>{const {c,state}=harness('ship3');Ships.verify([]);c.ownedGear=[];c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();assert.equal(state.activeShip,'ship3');assert.equal(c.VoidFlightSession.active.craft.config.shipId,'starter');assert.equal(c.missileState.missileCapacity,6);});
test('post-flight presentation writes do not mutate the ended craft',()=>{const {c,owner}=harness(),before=copy(owner.craft.resources);c.VoidFlightSession.active=null;c.hp=2;c.weaponBank.energy=1;assert.deepEqual(owner.craft.resources,before);});
test('shared power calculations accept explicit systems with identical arithmetic',()=>{
 const {owner,state}=harness('ship3'),a={energy:30,heat:40,overheated:false},b=copy(a);
 P.powerStep(a,state,.4);P.powerStep(b,null,.4,owner.craft.config.systems);assert.deepEqual(a,b);
 assert.equal(P.consume(a,state),P.consume(b,null,owner.craft.config.systems));assert.deepEqual(a,b);
});
test('alternate configuration uses actual damage and missile/power mechanics without Campaign writes',()=>{
 const {c,owner,state}=harness(),before=copy(state),definition=copy(Ships.ships);
 const alternate=copy(owner.craft.config);alternate.stats.hull=81;alternate.stats.shield=11;alternate.missiles.missilesLoaded=2;
 owner.craft=R.create(alternate);const other=R.create(alternate),r=owner.craft.resources;c.hurt(15);assert.equal(r.hp,77);assert.equal(r.shieldHP,0);
 const target={x:0,y:0,z:30,relationship:'hostile'},missile=M.launch(r.missileState,{progress:1,target},Math3.basis(0,0,0),owner.craft.config.missileBalance,0);
 assert(missile);assert.equal(missile.damage,B.missileDamage*alternate.ship.missile.damage);assert.equal(r.missileState.missilesLoaded,1);assert(P.consume(r.weaponBank,null,owner.craft.config.systems));
 assert.equal(other.resources.hp,81);assert.equal(other.resources.missileState.missilesLoaded,2);assert.equal(alternate.missiles.missilesLoaded,2);
 assert.deepEqual(state,before);assert.deepEqual(Ships.ships,definition);
});
test('shared definition changes reach subsequent configurations without changing an existing snapshot',()=>{
 const {c,owner}=harness(),old=owner.craft.config.ship.hull,original=Ships.ships.starter.hull;
 try{Ships.ships.starter.hull=original+5;c.VoidFlightSession.active={status:'PREPARING'};c.VoidFlightCraft.initialize();assert.equal(owner.craft.config.ship.hull,old);assert.equal(c.VoidFlightSession.active.craft.config.ship.hull,original+5);}finally{Ships.ships.starter.hull=original;}
});
test('runtime configuration does not enter Campaign save/restore data',()=>{const {owner,state}=harness(),before=JSON.stringify(state);owner.craft.resources.hp=1;assert.equal(JSON.stringify(state),before);assert(!('craft' in C.restore(before)));assert(!('session' in state));});
