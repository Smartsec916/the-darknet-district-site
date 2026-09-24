/* Persisted prologue, equipment and safe checkpoints. No renderer or account authority. */
(function(root){
 const Ships=typeof module!=='undefined'?require('./ships.js'):root.VoidShips;
 const tuning={jump:{local:14,interstellar:28},ground:{magazine:8,reserve:48,damage:12,reload:1.1,cooldown:.25,hostileHull:36,hostileDamage:5},ships:{starter:{capacity:72,recharge:12,cooling:18,heatLimit:100,cargo:1},ship2:{capacity:96,recharge:16,cooling:22,heatLimit:110,cargo:1},ship3:{capacity:125,recharge:18,cooling:20,heatLimit:120,cargo:3}},laser:{cost:6,heat:13,recover:.35}};
 const modules={
  capacitor:{name:'Reserve capacitor',slot:'power',price:150,icon:'power',stats:{capacity:24,recharge:3},compatible:['starter','ship2','ship3']},
  cooling:{name:'Ward cooling loop',slot:'cooling',price:120,icon:'cooling',stats:{cooling:8,heatLimit:15},compatible:['starter','ship2','ship3']},
  pulse:{name:'Focused pulse coils',slot:'weapon',price:240,icon:'weapon',stats:{damage:1.15,cost:1.1,heat:1.1},compatible:['starter','ship2','ship3']},
  shield:{name:'Compact shield generator',slot:'shield',price:220,icon:'shield',stats:{shield:20,shieldRegen:2},compatible:['starter','ship2','ship3']},
  engine:{name:'Maneuvering vanes',slot:'engine',price:200,icon:'engine',stats:{turn:1.12,acceleration:1.08},compatible:['starter','ship2','ship3']}
 };
 for(const m of Object.values(modules)){m.faction=null;m.technology='conventional';m.requiresAugmentation=0;}
 const ground=['move','look','sprint','jump','interact','pickup','draw','aim','fire','reload','holster','groundCombat','inventory','sightOwned','sightEquipped','sightAim'];
 const flight=['board','throttle','steer','roll','navigation','jumpTravel','dock','shipInventory','hangar','moduleInstalled','vendor','modulePurchased','purchasedInstalled','laserCombat','missileSelected','targetSelected','missileLocked','missileFired'];
 const flags=[...ground,...flight];
 const fresh=()=>({version:1,flags:{},completed:false,migrated:false,personal:{weapon:'ward-pistol',ammo:8,reserve:48,items:[],attachments:[],optic:null},equipment:{owned:[],installed:{}},missiles:null,checkpoint:{location:'vesper'},reputation:{},cargo:[],data:[],relays:{}});
 const number=(x,f=0,max=1e8)=>Number.isFinite(x)?Math.max(0,Math.min(max,x)):f;
 function restore(raw,s){const p=fresh();
  if(!raw){if(s.quest!=='inheritance'){for(const id of ground)p.flags[id]=true;p.migrated=true;p.checkpoint={location:s.location};}if(s.universe?.freeTravel||s.missileOfferSeen){for(const id of flags)p.flags[id]=true;p.completed=true;}return p;}
  for(const id of flags)if(raw.flags?.[id]===true)p.flags[id]=true;
  p.completed=raw.completed===true&&flags.every(id=>p.flags[id]);p.migrated=raw.migrated===true;
  const a=raw.personal||{};p.personal.ammo=number(a.ammo,8,8);p.personal.reserve=number(a.reserve,48,999);p.personal.items=(a.items||[]).filter(x=>x==='ward-kit');p.personal.attachments=(a.attachments||[]).filter(x=>x==='red-dot');p.personal.optic=a.optic==='red-dot'&&p.personal.attachments.includes('red-dot')?'red-dot':null;
  p.equipment.owned=[...new Set((raw.equipment?.owned||[]).filter(id=>Object.hasOwn(modules,id)))];
  for(const ship of ['starter','ship2','ship3']){p.equipment.installed[ship]={};for(const [slot,id] of Object.entries(raw.equipment?.installed?.[ship]||{}))if(p.equipment.owned.includes(id)&&modules[id].slot===slot)p.equipment.installed[ship][slot]=id;}
  p.missiles=raw.missiles===null?null:Math.floor(number(raw.missiles,0,30));p.checkpoint={location:typeof raw.checkpoint?.location==='string'?raw.checkpoint.location:s.location};
  for(const [id,v]of Object.entries(raw.reputation||{}))if(/^[a-z][a-z-]{0,39}$/.test(id)&&Number.isFinite(v))p.reputation[id]=Math.max(-100,Math.min(100,v));
  p.cargo=(raw.cargo||[]).filter(x=>x&&typeof x.id==='string'&&Number.isInteger(x.units)&&x.units>0&&x.units<=3).slice(0,3);p.data=(raw.data||[]).filter(x=>typeof x==='string'&&x.length<80).slice(0,16);
  for(const [id,v]of Object.entries(raw.relays||{}))if(['erebus','sol'].includes(id)&&['online','offline','damaged'].includes(v))p.relays[id]=v;
  return p;
 }
 function mark(s,id){if(!flags.includes(id)||s.progression.flags[id])return false;s.progression.flags[id]=true;sync(s);return true;}
 function groundDone(s){return ground.every(id=>s.progression.flags[id]);}
 function sync(s){const p=s.progression;if(p.personal.attachments.includes('red-dot'))p.flags.sightOwned=true;if(p.personal.optic==='red-dot')p.flags.sightEquipped=true;
  if(Object.values(p.equipment.installed[s.activeShip]||{}).some(id=>Object.hasOwn(modules,id)))p.flags.moduleInstalled=true;
  if(p.flags.modulePurchased&&Object.values(p.equipment.installed[s.activeShip]||{}).some(id=>id!=='cooling'))p.flags.purchasedInstalled=true;
  p.completed=flags.every(id=>p.flags[id])&&s.missileOfferSeen===true;
  if(s.universe){s.universe.freeTravel=p.completed;s.universe.missionLogUnlocked=p.completed||s.missileOfferSeen===true;}
  return p.completed;
 }
 function stage(s){if(s.progression.completed)return 'ACT-01_OPEN_WORLD';if(!groundDone(s))return 'PROLOGUE-01_GROUND';if(s.quest==='inheritance')return 'PROLOGUE-02_SHIP_ACQUISITION';if(!s.progression.flags.dock)return 'PROLOGUE-03_FLIGHT';if(!s.progression.flags.purchasedInstalled)return 'PROLOGUE-04_FIRST_STATION';if(!s.missileUnlocked)return 'PROLOGUE-05_COMBAT';return s.creditGear.includes('launcher')?'PROLOGUE-07_MISSILE_TRAINING':'PROLOGUE-06_MISSILE_ACQUISITION';}
 function next(s){sync(s);return (groundDone(s)?flight:ground).find(id=>!s.progression.flags[id])||null;}
 function buy(s,id){const m=modules[id],p=s.progression;if(!m||p.equipment.owned.includes(id)||s.credits<m.price)return false;s.credits-=m.price;p.equipment.owned.push(id);mark(s,'modulePurchased');return true;}
 function install(s,slot,id){const p=s.progression,m=modules[id];if(id!==null&&(!m||m.slot!==slot||!m.compatible.includes(s.activeShip)||!p.equipment.owned.includes(id)))return false;if(!['weapon','shield','power','cooling','engine'].includes(slot))return false;(p.equipment.installed[s.activeShip]??={})[slot]=id;sync(s);return true;}
 function systems(s){const ship=Ships.get(s).id,t={...tuning.ships[ship],cost:tuning.laser.cost,heat:tuning.laser.heat};for(const id of Object.values(s.progression?.equipment.installed[ship]||{})){const m=modules[id];if(!m||!s.progression.equipment.owned.includes(id))continue;for(const [k,v]of Object.entries(m.stats))if(['capacity','recharge','cooling','heatLimit'].includes(k))t[k]+=v;else if(k==='cost'||k==='heat')t[k]*=v;}return t;}
 function stats(s,value){const out={...value,flight:{...value.flight}};for(const id of Object.values(s.progression?.equipment.installed[s.activeShip]||{})){const m=modules[id];if(!m||!s.progression.equipment.owned.includes(id))continue;for(const [k,v]of Object.entries(m.stats)){if(k==='damage')out.damage*=v;if(k==='shield'||k==='shieldRegen')out[k]+=v;if(k==='turn')for(const a of ['yawRate','pitchRate','rollRate'])out.flight[a]*=v;if(k==='acceleration')out.flight.acceleration*=v;}}return out;}
 function powerStep(bank,s,dt){const t=systems(s);bank.energy=Math.min(t.capacity,bank.energy+dt*t.recharge);bank.heat=Math.max(0,bank.heat-dt*t.cooling);if(bank.heat<t.heatLimit*tuning.laser.recover)bank.overheated=false;}
 function consume(bank,s){const t=systems(s);if(bank.overheated||bank.energy<t.cost)return false;bank.energy-=t.cost;bank.heat=Math.min(t.heatLimit,bank.heat+t.heat);if(bank.heat>=t.heatLimit)bank.overheated=true;return true;}
 function checkpoint(s,location){s.progression.checkpoint={location};s.travel=null;}
 function respawn(s){s.story.cursor=null;s.location=s.progression.checkpoint.location;s.travel=null;s.destination=null;s.universe.station={location:s.location};s.progression.personal.ammo=tuning.ground.magazine;s.progression.personal.reserve=Math.max(24,s.progression.personal.reserve);}
 const api={tuning,modules,ground,flight,flags,fresh,restore,mark,groundDone,sync,stage,next,buy,install,systems,stats,powerStep,consume,checkpoint,respawn};if(typeof module!=='undefined')module.exports=api;else root.VoidProgression=api;
})(globalThis);
