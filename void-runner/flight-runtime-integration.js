/* Compatibility accessors keep existing mechanics using a single session-owned resource store. */
(function(root){
 const idle={hp:100,shieldHP:0,shieldDelay:0,driveTime:0,driveCooldown:0,droneClock:0,shot:0,missileCooldown:0,damageTime:0,weaponBank:{},missileState:{}};
 const active=()=>root.VoidFlightSession?.active?.craft;
 // The completed craft remains available to arrival/debrief presentation; the next run gets fresh objects.
 let displayed=idle,lastCraft=null;
 function resources(){
  const craft=active();
  if(craft){lastCraft=craft;displayed=craft.resources;}
  else if(lastCraft){displayed=JSON.parse(JSON.stringify(displayed));lastCraft=null;}
  return displayed;
 }
 for(const key of Object.keys(idle))Object.defineProperty(root,key,{configurable:false,
  get(){return resources()[key];},set(value){resources()[key]=value;}});
 function missileSource(ship){
  const testing=devMissileTrial&&VoidDevTools.authorized&&trialGear==='missile';
  const owns=state.creditGear.includes('launcher'),equipped=owns&&state.loadout.missile==='launcher',capacity=ship.missile.capacity;
  return {ownsMissileLauncher:testing||owns,equipped:testing||equipped,missilesLoaded:testing?12:equipped?Math.min(capacity,state.progression.missiles??capacity):0,missileCapacity:testing?12:owns?capacity:0,type:'standard'};
 }
 const api=root.VoidFlightCraft={
  active,
  initialize(){
   const owner=root.VoidFlightSession.active;if(!owner||owner.craft)return;
   const stats=C.stats(state),loadout=Object.fromEntries(Object.entries(state.loadout).filter(([,id])=>id&&C.ownsEquipment(state,id,ownedGear)));
   if(trialGear&&VoidContent.gear[trialGear])loadout[VoidContent.gear[trialGear].slot]=trialGear;
   const modules=Object.fromEntries(Object.entries(state.progression.equipment.installed[state.activeShip]||{}).filter(([,id])=>P.modules[id]&&state.progression.equipment.owned.includes(id)));
   owner.craft=VoidFlightRuntime.create(VoidFlightRuntime.configure({stats,systems:P.systems(state),upgrades:state.upgrades,loadout,modules,missiles:missileSource(stats.ship),balance:VOID_BALANCE}));
   owner.missileTrial=devMissileTrial&&VoidDevTools.authorized&&trialGear==='missile';
   displayed=owner.craft.resources;lastCraft=owner.craft;
  },
  stats:()=>active()?.config.stats||C.stats(state),
  ship:()=>active()?.config.ship||VoidShips.get(state),
  systems:()=>active()?.config.systems||P.systems(state),
  upgrades:()=>active()?.config.upgrades||state.upgrades,
  missiles(){
   const owner=root.VoidFlightSession?.active;
   // Explicit developer-trial revocation still removes temporary test equipment.
   if(owner?.missileTrial&&(!devMissileTrial||!VoidDevTools.authorized))return missileSource(VoidShips.get(state));
   return active()?.config.missiles||missileSource(VoidShips.get(state));
  },
  missileBalance(){return active()?.config.missileBalance;},
  resetIdle(){lastCraft=null;displayed={...idle,weaponBank:{...idle.weaponBank},missileState:{...idle.missileState}};}
 };
})(globalThis);
