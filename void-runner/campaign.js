/* Campaign rules are independent of rendering so rewards and saves can be tested. */
(function (root) {
  'use strict';
  const content = typeof module !== 'undefined' ? require('./content.js') : root.VoidContent;
  const S = typeof module !== 'undefined' ? require('./ships.js') : root.VoidShips;
  const Warp = typeof module !== 'undefined' ? require('./warp.js') : root.VoidWarp;
  const B = (typeof module !== 'undefined' ? require('./balance.js') : root.VoidBalance).values;
  const stations = {
    meridian: { name: 'Meridian Station', district: 'SECTOR 07 / THE LOWER ORBIT', color: '#58ffe1', bar: 'The Dead Channel' },
    kepler: { name: 'Kepler Exchange', district: 'SECTOR 12 / FREIGHT LANE', color: '#ffbd69', bar: 'The Loading Bay' },
    undertow: { name: 'Rusthaven Port', district: 'SECTOR 19 / OFF THE GRID', color: '#ef79ff', bar: 'Low Frequency' },
    foundry: { name: 'The Foundry', district: 'SECTOR 24 / INDUSTRIAL BELT', color: '#ff795f', bar: 'Afterburn' }
  };
  const contracts = [
    { id: 'medicine', name: 'Cold chain', cargo: 'Refrigerated clinic supplies', legal: true, destination: 'kepler', reward: 650, enemies: 8, tier: 1, duration: 38, contact: 'Dr. Sol', briefing: 'Our clinics need these before the next shift. Keep the containers intact. Raider activity has increased along the route.' },
    { id: 'ghost', name: 'Ghost hardware', cargo: 'Unlicensed neural processors', legal: false, destination: 'undertow', reward: 1000, enemies: 12, tier: 2, duration: 45, contact: 'Iona Vale', briefing: 'The people buying these cannot afford corporate leases on their own minds. Expect armored interceptors. Upgrade before you leave.' },
    { id: 'foundry', name: 'A debt in steel', cargo: 'Restricted fabrication cores', legal: false, destination: 'foundry', reward: 1500, enemies: 16, tier: 3, duration: 52, contact: 'Rook', briefing: 'The Foundry is building something the corporations would rather stay broken. A gunship guards the approach. Bring armor and a better reactor.' }
  ];
  const upgrades = {
    guns: { name: 'Pulse cannons', description: 'More damage and a faster firing cycle.', prices: [350, 700, 1200] },
    armor: { name: 'Hull plating', get description(){return 'Adds '+B.hullPerTier+' hull integrity per tier.';}, prices: [300, 600, 1000] },
    engines: { name: 'Vector thrusters', description: 'Faster movement and more responsive handling.', prices: [250, 500, 900] },
    shields: { name: 'Deflector shield', get description(){return B.shieldPerTier+' shield capacity per tier. Regenerates '+B.shieldRechargeRate+' per second after '+B.shieldRechargeDelay+' seconds without a hit.';}, prices: [300, 650, 1000] }
  };
  const quests = ['inheritance', 'arrival', 'legal-offer', 'legal-run', 'return', 'illegal-offer', 'illegal-run', 'open'];
  const allContracts = [...contracts, ...content.missions];
  function fresh() { return { version: 2, quest: 'inheritance', location: 'meridian', credits: 100, completed: 0, upgrades: { guns: 0, armor: 0, engines: 0, shields:0 }, contract: null, cleared: [], creditGear:[], loginOfferSeen:false, ownedShips:['starter'], activeShip:'starter', standardGear:['pulse1','shield1'], shipLoadouts:{}, combatRuns:0, missileOfferSeen:false, missileUnlocked:false, travel:null, destination:null, loadout: {weapon:null,shield:null,utility:null,missile:null} }; }
  function restore(raw) {
    try {
      const s = JSON.parse(raw);
      if (!s || ![1,2].includes(s.version) || !quests.includes(s.quest) || !Object.hasOwn(stations, s.location)) return null;
      for (const k of ['credits', 'completed']) if (!Number.isSafeInteger(s[k]) || s[k] < 0 || s[k] > 100000000) return null;
      if(s.upgrades && s.upgrades.shields===undefined)s.upgrades.shields=0;
      for (const k of Object.keys(upgrades)) if (!Number.isInteger(s.upgrades?.[k]) || s.upgrades[k] < 0 || s.upgrades[k] > 3) return null;
      if (s.contract !== null && !allContracts.some(c => c.id === s.contract)) return null;
      const cleared = Array.isArray(s.cleared) ? [...new Set(s.cleared.filter(id=>content.missions.some(m=>m.id===id)))] : [];
      const loadout = fresh().loadout;
      const allGear={...content.gear,...content.creditGear,...S.equipment};
      for (const slot of Object.keys(loadout)) if (Object.hasOwn(allGear,s.loadout?.[slot] || '') && allGear[s.loadout[slot]].slot===slot) loadout[slot]=s.loadout[slot];
      const creditGear=Array.isArray(s.creditGear)?[...new Set(s.creditGear.filter(id=>Object.hasOwn(content.creditGear,id)))]:[];
      return migrate({ ...fresh(), quest: s.quest, location: s.location, credits: s.credits, completed: s.completed, upgrades: { guns: s.upgrades.guns, armor: s.upgrades.armor, engines: s.upgrades.engines,shields:s.upgrades.shields }, contract: s.contract, cleared, loadout,creditGear,loginOfferSeen:typeof s.loginOfferSeen==='boolean'?s.loginOfferSeen:s.completed>0 },s);
    } catch { return null; }
  }
  function beginJourney(s) { if (s.quest !== 'inheritance') return false; s.quest = 'arrival'; return true; }
  function stats(s, owned = []) {
    const ship=S.get(s), weapon=S.equipment[s.loadout?.weapon], shield=S.equipment[s.loadout?.shield];
    const standard=id=>S.equipment[id]?.ship==='ship3'?S.owns(s,'ship3'):s.standardGear?.includes(id);
    const laser=weapon&&standard(s.loadout.weapon)?weapon.damage:ship.laser, rate=weapon&&standard(s.loadout.weapon)?weapon.rate:ship.fireRate;
    const deflector=shield&&standard(s.loadout.shield)?shield:{capacity:ship.shield,recharge:ship.recharge,delay:ship.shieldDelay};
    const has = id => owned.includes(id) && s.loadout?.[content.gear[id].slot] === id;
    const creditHas=id=>s.creditGear?.includes(id)&&s.loadout?.utility===id;
    return { ship, flight:ship.flight, hull: B.playerHull * ship.hull/100 + s.upgrades.armor * B.hullPerTier, damage: has('wraith') ? B.premiumLaserDamage : B.laserDamage * laser + s.upgrades.guns * B.laserDamagePerTier, cooldown: has('wraith') ? 1/B.premiumLaserFireRate : Math.max(1/60,1/(B.laserFireRate*rate) - s.upgrades.guns * B.laserCooldownPerTier), speed: 10 + s.upgrades.engines * 2.5, shield: has('aegis') ? B.premiumShield : B.playerShield+deflector.capacity+(s.upgrades.shields||0)*B.shieldPerTier, shieldRegen:has('aegis')?B.premiumShieldRechargeRate:B.shieldRechargeRate*deflector.recharge/6,shieldDelay:has('aegis')?B.premiumShieldRechargeDelay:B.shieldRechargeDelay*deflector.delay/6, piercing: has('wraith'), drive: has('ghost')||creditHas('vector'),driveDuration:has('ghost')?.7:.4,driveCooldown:has('ghost')?8:12, drone: has('sentinel')||creditHas('scout'),droneDamage:has('sentinel')?4:2,droneCooldown:has('sentinel')?.7:1.2 };
  }
  function unlocked(s,c) { return s.quest==='open' && (!c.requires || s.cleared.includes(c.requires)); }
  function flight(s) {
    const base = { enemies: 0, tier: 0, duration: 15, reward: 0, legal: true, cargo: 'Empty hold' };
    if (s.quest === 'arrival') return { ...base, name: 'A ship of your own', destination: 'meridian' };
    if (s.quest === 'legal-run') return { ...base, name: 'An honest living', cargo: 'Water filtration parts', destination: 'kepler', enemies: 1, duration: 28, reward: 350 };
    if (s.quest === 'return') return { ...base, name: 'Back to the Dead Channel', destination: 'meridian', duration: 18 };
    if (s.quest === 'illegal-run') return { ...base, name: 'No questions asked', cargo: 'Unregistered memory wafers', legal: false, destination: 'undertow', enemies: 6, tier: 1, duration: 36, reward: 800 };
    if (s.quest === 'open' && s.contract) {
      const c = allContracts.find(c => c.id === s.contract);
      if (!c) return null;
      const pressure = c.chapter ? 0 : Math.min(6, Math.floor(Math.max(0, s.completed - 2) / 2));
      return { ...c, enemies: c.enemies + pressure * 2, tier: c.tier + pressure * .4, duration: c.duration + pressure * 2, pressure, destination: c.destination === s.location ? 'meridian' : c.destination };
    }
    if(s.quest==='open'&&s.destination&&stations[s.destination]&&s.destination!==s.location)return {...base,name:'Free transit',destination:s.destination,duration:20,enemies:3,tier:1,reward:0,kind:'transit'};
    return null;
  }
  function accept(s, id) {
    if (s.quest === 'legal-offer') { s.quest = 'legal-run'; return true; }
    if (s.quest === 'illegal-offer') { s.quest = 'illegal-run'; return true; }
    const c = allContracts.find(c => c.id === id);
    if (s.contract || !c || !unlocked(s,c)) return false;
    s.contract = id; return true;
  }
  function complete(s) {
    const f = flight(s); if (!f) return null;
    const previous = s.quest;
    if(f.enemies>0){s.combatRuns=(s.combatRuns||0)+1;if(s.combatRuns>=2)s.missileUnlocked=true;}
    s.travel=null;s.destination=null;
    s.location = f.destination; s.credits += f.reward;
    const repairCharged=Math.min(s.credits,Math.round(B.repairCost));s.credits-=repairCharged;
    if (f.reward) s.completed++;
    if (f.chapter && !s.cleared.includes(f.id)) s.cleared.push(f.id);
    if (previous === 'arrival') s.quest = 'legal-offer';
    else if (previous === 'legal-run') s.quest = 'return';
    else if (previous === 'return') s.quest = 'illegal-offer';
    else if (previous === 'illegal-run') { s.quest = 'open'; s.upgrades.guns = Math.max(1, s.upgrades.guns); }
    else s.contract = null;
    return { ...f, missileOffer:s.missileUnlocked&&!s.missileOfferSeen, repairCharged, gunReward: previous === 'illegal-run' };
  }
  function buy(s, key) {
    if (s.completed < 1 || !Object.hasOwn(upgrades, key)) return false;
    const level = s.upgrades[key], cost = upgrades[key].prices[level];
    if (cost === undefined || s.credits < cost) return false;
    s.credits -= cost; s.upgrades[key]++; return true;
  }
  function buyGear(s,id){const g=content.creditGear[id];if(!g||(id==='launcher'&&!s.missileUnlocked)||s.completed<1||s.creditGear.includes(id)||s.credits<g.price)return false;s.credits-=g.price;s.creditGear.push(id);s.loadout[g.slot]=id;return true;}

  function migrate(out,raw){
    out.ownedShips=['starter',...new Set((Array.isArray(raw.ownedShips)?raw.ownedShips:[]).filter(id=>id==='ship2'))];
    out.activeShip=out.ownedShips.includes(raw.activeShip)?raw.activeShip:'starter';
    out.standardGear=['pulse1','shield1',...new Set((Array.isArray(raw.standardGear)?raw.standardGear:[]).filter(id=>['pulse2','shield2'].includes(id)))];
    out.combatRuns=Number.isSafeInteger(raw.combatRuns)&&raw.combatRuns>=0?Math.min(raw.combatRuns,100000000):Math.min(raw.completed,2);
    out.missileUnlocked=out.combatRuns>=2;
    out.missileOfferSeen=raw.missileOfferSeen===true;
    const gear={...content.gear,...content.creditGear,...S.equipment};
    const clean=l=>Object.fromEntries(['weapon','shield','utility','missile'].map(slot=>[slot,gear[l?.[slot]]?.slot===slot?l[slot]:null]));
    for(const id of out.ownedShips)out.shipLoadouts[id]=clean(raw.shipLoadouts?.[id]||S.defaults[id]);
    out.shipLoadouts.ship3=clean(raw.shipLoadouts?.ship3||S.defaults.ship3);
    out.loadout=clean(raw.loadout);out.shipLoadouts[out.activeShip]={...out.loadout};
    out.destination=out.quest==='open'&&!out.contract&&stations[raw.destination]&&raw.destination!==out.location?raw.destination:null;
    const f=flight(out);out.travel=f&&raw.travel?Warp.restore(raw.travel,out.location,f.destination,f.id||out.quest,f.enemies>0||['salvage','hazard','escort'].includes(f.kind)):null;
    return out;
  }
  function buyShip(s,id){const ship=S.ships[id];if(!ship||ship.premium||s.ownedShips.includes(id)||s.credits<ship.price)return false;s.credits-=ship.price;s.ownedShips.push(id);s.shipLoadouts[id]={...S.defaults[id]};for(const [key,item]of Object.entries(S.equipment))if(item.ship===id&&!s.standardGear.includes(key))s.standardGear.push(key);return true;}
  function switchShip(s,id){if(!S.owns(s,id)||!S.ships[id])return false;s.shipLoadouts[s.activeShip]={...s.loadout};s.activeShip=id;s.loadout={...(s.shipLoadouts[id]||S.defaults[id])};return true;}
  function ownsEquipment(s,id,verified=[]){return Object.hasOwn(content.gear,id)?verified.includes(id):Object.hasOwn(content.creditGear,id)?s.creditGear.includes(id):Object.hasOwn(S.equipment,id)&&(S.equipment[id].ship==='ship3'?S.owns(s,'ship3'):s.standardGear.includes(id));}
  function equip(s,id,verified=[]){const g={...content.gear,...content.creditGear,...S.equipment}[id];if(!g||!ownsEquipment(s,id,verified))return false;s.loadout[g.slot]=s.loadout[g.slot]===id?null:id;s.shipLoadouts[s.activeShip]={...s.loadout};return true;}
  function chooseDestination(s,id){if(s.quest!=='open'||s.contract||!stations[id]||id===s.location)return false;s.destination=id;s.travel=null;return true;}

  const api = { stations, contracts, allContracts, upgrades, fresh, restore, beginJourney, stats, flight, accept, complete, buy, buyGear, unlocked, buyShip, switchShip, ownsEquipment, equip, chooseDestination };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidCampaign = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
