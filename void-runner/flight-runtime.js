/* Per-flight values derived from shared definitions; never a second balance table. */
(function(root){
 const copy=value=>JSON.parse(JSON.stringify(value));
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
 function configure({stats,systems,upgrades,loadout,modules={},missiles,balance}){
  const ship=stats.ship,m=ship.missile;
  return freeze(copy({shipId:ship.id,ship,stats,systems,upgrades,loadout,modules,missiles,
   missileBalance:{...balance,missileDamage:balance.missileDamage*m.damage,missileLockTime:balance.missileLockTime*m.lock,missileCooldown:balance.missileCooldown*m.cooldown}}));
 }
 function create(configuration){
  // Copy even test/alternate inputs: neither configuration nor mutable resource objects alias their source.
  const config=freeze(copy(configuration));
  return {config,resources:{hp:config.stats.hull,shieldHP:config.stats.shield,shieldDelay:0,driveTime:0,driveCooldown:0,droneClock:0,shot:0,missileCooldown:0,damageTime:0,
   weaponBank:{energy:config.systems.capacity,heat:0,overheated:false},missileState:copy(config.missiles)}};
 }
 const api={configure,create};if(typeof module!=='undefined')module.exports=api;else root.VoidFlightRuntime=api;
})(globalThis);
