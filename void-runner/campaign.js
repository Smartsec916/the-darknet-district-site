/* Campaign rules are independent of rendering so rewards and saves can be tested. */
(function (root) {
  'use strict';
  const content = typeof module !== 'undefined' ? require('./content.js') : root.VoidContent;
  const S = typeof module !== 'undefined' ? require('./ships.js') : root.VoidShips;
  const Warp = typeof module !== 'undefined' ? require('./warp.js') : root.VoidWarp;
  const B = (typeof module !== 'undefined' ? require('./balance.js') : root.VoidBalance).values;
  const Story=typeof module!=='undefined'?require('./story.js'):root.VoidStory;
  const P=typeof module!=='undefined'?require('./progression.js'):root.VoidProgression;
  const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
  const Missions=typeof module!=='undefined'?require('./mission-log.js'):root.VoidMissions;
  const stations=Story.content.locations;for(const [id,def] of Object.entries(U.locations))stations[id]={...stations[id],...def};
  const contracts = [
    { id: 'medicine', name: 'Cold chain', cargo: 'Refrigerated clinic supplies', legal: true, destination: 'kepler', reward: 650, enemies: 8, tier: 1, duration: 38, contact: 'Dr. Sol', briefing: 'Our clinics need these before the next shift. Keep the containers intact. Raider activity has increased along the route.' },
    { id: 'ghost', name: 'Ghost hardware', cargo: 'Unlicensed neural processors', legal: false, destination: 'rusthaven', reward: 1000, enemies: 12, tier: 2, duration: 45, contact: 'Iona Vale', briefing: 'The people buying these cannot afford corporate leases on their own minds. Expect armored interceptors. Upgrade before you leave.' },
    { id: 'foundry', name: 'A debt in steel', cargo: 'Restricted fabrication cores', legal: false, destination: 'foundry', reward: 1500, enemies: 16, tier: 3, duration: 52, contact: 'Rook', briefing: 'The Foundry is building something the corporations would rather stay broken. A gunship guards the approach. Bring armor and a better reactor.' }
  ];
  const upgrades = {
    guns: { name: 'Pulse cannons', description: 'More damage and a faster firing cycle.', prices: [350, 700, 1200] },
    armor: { name: 'Hull plating', get description(){return 'Adds '+B.hullPerTier+' hull integrity per tier.';}, prices: [300, 600, 1000] },
    engines: { name: 'Vector thrusters', description: 'Faster movement and more responsive handling.', prices: [250, 500, 900] },
    shields: { name: 'Deflector shield', get description(){return B.shieldPerTier+' shield capacity per tier. Regenerates '+B.shieldRechargeRate+' per second after '+B.shieldRechargeDelay+' seconds without a hit.';}, prices: [300, 650, 1000] }
  };
  // The District's faction deliveries (David's docs 05/06). Delivering the cargo and collecting
  // payment from Iris at The Darknet District are separate steps. Progress lives in story.flags.
  const factionDeliveries={
    communion:{id:'communion-delivery',faction:'communion',flag:'communionDelivery',name:'Communion delivery',cargo:'Advanced electronics and research equipment',legal:true,destination:'vigil',payment:1200,reward:1200,enemies:3,tier:1,duration:40,contact:'Admin',recipient:'elara',briefing:'Advanced electronics and research equipment for Dr. Elara Voss at The Vigil, Cantor System. Payment is collected at The Darknet District.'},
    'natural-order':{id:'order-delivery',faction:'natural-order',flag:'orderDelivery',name:'Natural Order delivery',cargo:'Mechanical components and industrial supplies',legal:true,destination:'holdfast',payment:1200,reward:1200,enemies:3,tier:1,duration:40,contact:'Admin',recipient:'marcus',briefing:'Mechanical components and industrial supplies for Marcus Vale at Holdfast, Garrow System. Payment is collected at The Darknet District.'}
  };
  const factionList=Object.values(factionDeliveries);
  // Iris's follow-up contracts (design doc 09), offered once both introductory deliveries are paid.
  // Same deliver-then-collect flow; both stay available independently.
  const supplyDeliveries={
    communion:{id:'communion-supply',faction:'communion',kind:'supply',flag:'communionSupply',name:'Communion supply contract',cargo:'Advanced processing modules, high-precision sensor assemblies and specialized research electronics',legal:true,destination:'vigil',payment:1500,reward:1500,enemies:3,tier:1,duration:40,contact:'Iris',recipient:'elara',briefing:'Specialized processing modules, sensor components and research hardware for Dr. Elara Voss at The Vigil, Cantor System. Payment is collected at The Darknet District.'},
    'natural-order':{id:'order-supply',faction:'natural-order',kind:'supply',flag:'orderSupply',name:'Natural Order supply contract',cargo:'Industrial control assemblies, heavy-duty mechanical components, and replacement machinery and repair equipment',legal:true,destination:'holdfast',payment:1500,reward:1500,enemies:3,tier:1,duration:40,contact:'Iris',recipient:'marcus',briefing:'Industrial control assemblies, replacement machinery and heavy-duty mechanical components for Marcus Vale at Holdfast, Garrow System. Payment is collected at The Darknet District.'}
  };
  const supplyList=Object.values(supplyDeliveries),payable=[...factionList,...supplyList];
  // Homeworld missions are placeholders until David designs them: they can be offered and
  // accepted, but have no destination, objectives or rewards and never complete.
  const originMissions={communion:{id:'communion-origin-mission-01',faction:'communion',flag:'communionOrigin',giver:'elara'},'natural-order':{id:'natural-order-origin-mission-01',faction:'natural-order',flag:'orderOrigin',giver:'marcus'}};
  const stageOf=(s,d)=>{const v=s.story?.flags?.[d.flag];return ['accepted','delivered','paid'].includes(v)?v:null;};
  function factionStage(s,faction){return factionDeliveries[faction]?stageOf(s,factionDeliveries[faction]):null;}
  function supplyStage(s,faction){return supplyDeliveries[faction]?stageOf(s,supplyDeliveries[faction]):null;}
  function supplyOffers(s){if(s.quest!=='open'||s.story?.flags?.factionsVisited!==true)return [];return Object.keys(supplyDeliveries).filter(id=>!supplyStage(s,id));}
  function acceptSupply(s,faction){
    const d=supplyDeliveries[faction];
    if(!d||s.contract||!supplyOffers(s).includes(faction))return false;
    if((s.progression?.cargo||[]).reduce((n,x)=>n+x.units,0)>=P.systems(s).cargo)return false;
    s.story.flags[d.flag]='accepted';s.destination=null;s.contract=d.id;U.discover(s,d.destination);Missions.acquire(s,d.id);Story.emit(s,'missionAccepted',d.id);return true;
  }
  function originState(s,faction){const v=s.story?.flags?.[originMissions[faction]?.flag];return ['offered','accepted'].includes(v)?v:null;}
  function acceptOrigin(s,faction){const o=originMissions[faction];if(!o||originState(s,faction)!=='offered')return false;s.story.flags[o.flag]='accepted';Missions.acquire(s,o.id);return true;}
  // Admin offers both until one is taken; Iris offers the other once the first is paid.
  function factionOffers(s){
    if(s.quest!=='open'||!s.universe?.freeTravel||s.story?.flags?.metAdmin!==true)return [];
    const first=s.story.flags.factionFirst;
    if(!factionDeliveries[first])return Object.keys(factionDeliveries);
    if(factionStage(s,first)!=='paid')return [];
    return Object.keys(factionDeliveries).filter(id=>id!==first&&!factionStage(s,id));
  }
  function acceptFaction(s,faction){
    const d=factionDeliveries[faction];
    if(!d||s.contract||!factionOffers(s).includes(faction))return false;
    if((s.progression?.cargo||[]).reduce((n,x)=>n+x.units,0)>=P.systems(s).cargo)return false;
    const f=s.story.flags;f[d.flag]='accepted';if(!factionDeliveries[f.factionFirst])f.factionFirst=faction;
    s.destination=null;s.contract=d.id;U.discover(s,d.destination);Missions.acquire(s,d.id);Story.emit(s,'missionAccepted',d.id);return true;
  }
  // The recipient takes the cargo in person; payment waits for the District.
  // The recipient takes whichever of their faction's contracts is aboard; returns that contract.
  function deliverFaction(s,faction){
    const d=[factionDeliveries[faction],supplyDeliveries[faction]].find(x=>x&&stageOf(s,x)==='accepted'&&s.location===x.destination);
    if(!d)return false;
    if(s.contract===d.id)s.contract=null;
    s.story.flags[d.flag]='delivered';
    // A supply delivery opens the recipient's homeworld offer; it stays with them until taken.
    if(d.kind==='supply'&&!originState(s,faction))s.story.flags[originMissions[faction].flag]='offered';
    Missions.complete(s,d.id,'arrive');Missions.complete(s,d.id,'deliver');Story.emit(s,'factionDelivered',faction);return d;
  }
  // Each delivered contract is paid exactly once.
  function collectFactionPayment(s){
    const paid=[];
    for(const d of payable)if(stageOf(s,d)==='delivered'){s.story.flags[d.flag]='paid';s.credits+=d.payment;s.completed++;Missions.complete(s,d.id,'payment');paid.push(d);}
    if(paid.length&&factionList.every(d=>factionStage(s,d.faction)==='paid'))s.story.flags.factionsVisited=true;
    return paid;
  }
  // Rook routes no freight into a faction system until the player has made Admin's delivery there.
  function heldForAdmin(s,system){const d=factionList.find(x=>U.system(x.destination)===system);return !!d&&!['delivered','paid'].includes(factionStage(s,d.faction));}
  const quests = ['inheritance', 'arrival', 'legal-offer', 'legal-run', 'return', 'illegal-offer', 'illegal-run', 'open'];
  // Rook keeps freight moving once the opening runs are done. Each run is numbered so
  // the Mission Log keeps a separate entry, and a newly opened system gets the next run.
  const rookCargo=['Sealed reactor couplings','Med-gel canisters','Unmarked data cores','Hydroponic seed stock','Salvaged drive coils','Encrypted ledger drives','Coolant cells','Surplus targeting optics'];
  const rookRunBase={ id: 'rook-run', name: 'Rook freight run', cargo: 'Rook freight', legal: true, destination: 'meridian', reward: 500, enemies: 4, tier: 1, duration: 36, contact: 'Rook', briefing: 'Rook always has another crate that needs to be somewhere else.' };
  function rookRunNumber(s){return (Number.isSafeInteger(s.story?.flags?.rookRuns)?s.story.flags.rookRuns:0)+1;}
  function rookRunTarget(s){
    const u=s.universe||U.fresh(),served=String(s.story?.flags?.rookSystems||'erebus').split(',');
    const fresh=(u.discoveredSystems||[]).find(id=>U.systems[id]&&!served.includes(id)&&U.systems[id].hub!==s.location&&!heldForAdmin(s,id));
    if(fresh)return U.systems[fresh].hub;
    const pool=Object.keys(U.locations).filter(id=>id!=='vesper'&&id!==s.location&&(u.discoveredLocations||[]).includes(id)&&!heldForAdmin(s,U.system(id)));
    return pool.length?pool[(rookRunNumber(s)-1)%pool.length]:'meridian';
  }
  function rookRun(s){
    const n=rookRunNumber(s),step=Math.min(n-1,8),to=s.story?.flags?.rookRunTo;
    const destination=s.contract==='rook-run'&&typeof to==='string'&&Object.hasOwn(stations,to)?to:rookRunTarget(s);
    return {...rookRunBase,id:'rook-run-'+n,number:n,name:'Rook freight run #'+n,cargo:rookCargo[(n-1)%rookCargo.length],legal:n%2===1,destination,reward:Math.min(2000,500+150*step),enemies:4+step,tier:1+step*.3,duration:36+step*2};
  }
  const allContracts = [...contracts, rookRunBase, ...factionList, ...supplyList, ...content.missions];
  function fresh() { return { version: 2, progression:P.fresh(), universe:U.fresh(), story:Story.fresh(), savedAt:null, quest: 'inheritance', location: 'meridian', credits: 100, completed: 0, upgrades: { guns: 0, armor: 0, engines: 0, shields:0 }, contract: null, cleared: [], creditGear:[], ownedShips:['starter'], activeShip:'starter', standardGear:['pulse1','shield1'], shipLoadouts:{}, combatRuns:0, missileOfferSeen:false, missileUnlocked:false, travel:null, destination:null, loadout: {weapon:null,shield:null,utility:null,missile:null} }; }
  function restore(raw) {
    try {
      // Rusthaven used the internal id 'undertow' in older saves.
      const s = JSON.parse(String(raw).replace(/"undertow"/g,'"rusthaven"'));
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
      return migrate({ ...fresh(), quest: s.quest, location: s.location, credits: s.credits, completed: s.completed, upgrades: { guns: s.upgrades.guns, armor: s.upgrades.armor, engines: s.upgrades.engines,shields:s.upgrades.shields }, contract: s.contract, cleared, loadout,creditGear },s);
    } catch { return null; }
  }
  // The Vesper practice circuit is flown before the Meridian run. Its route uses the
  // inheritance quest as its mission id, so cloud saves need no new quest state.
  function trainingPending(s){ return s.quest==='inheritance'&&P.groundDone(s)&&s.progression?.flags?.board===true&&s.story?.flags?.flightTrainingComplete!==true; }
  function beginJourney(s) { if (s.quest !== 'inheritance'||!P.groundDone(s)) return false; s.quest = 'arrival'; s.story.chapter='arrival';P.sync(s);Missions.acquire(s,'flight-training');Missions.acquire(s,'meet-rook');Missions.complete(s,'meet-rook','instructions',{missionFlight});Missions.sync(s,{missionFlight}); Story.emit(s,'leaveLocation','vesper'); return true; }
  function stats(s, owned = []) {
    const ship=S.get(s), weapon=S.equipment[s.loadout?.weapon], shield=S.equipment[s.loadout?.shield];
    const standard=id=>S.equipment[id]?.ship==='ship3'?S.owns(s,'ship3'):s.standardGear?.includes(id);
    const laser=weapon&&standard(s.loadout.weapon)?weapon.damage:ship.laser, rate=weapon&&standard(s.loadout.weapon)?weapon.rate:ship.fireRate;
    const deflector=shield&&standard(s.loadout.shield)?shield:{capacity:ship.shield,recharge:ship.recharge,delay:ship.shieldDelay};
    const has = id => owned.includes(id) && s.loadout?.[content.gear[id].slot] === id;
    const creditHas=id=>s.creditGear?.includes(id)&&s.loadout?.utility===id;
    return P.stats(s,{ ship, flight:ship.flight, hull: B.playerHull * ship.hull/100 + s.upgrades.armor * B.hullPerTier, damage: has('wraith') ? B.premiumLaserDamage : B.laserDamage * laser + s.upgrades.guns * B.laserDamagePerTier, cooldown: has('wraith') ? 1/B.premiumLaserFireRate : Math.max(1/60,1/(B.laserFireRate*rate) - s.upgrades.guns * B.laserCooldownPerTier), speed: 10 + s.upgrades.engines * 2.5, shield: has('aegis') ? B.premiumShield : B.playerShield+deflector.capacity+(s.upgrades.shields||0)*B.shieldPerTier, shieldRegen:has('aegis')?B.premiumShieldRechargeRate:B.shieldRechargeRate*deflector.recharge/6,shieldDelay:has('aegis')?B.premiumShieldRechargeDelay:B.shieldRechargeDelay*deflector.delay/6, piercing: has('wraith'), drive: has('ghost')||creditHas('vector'),driveDuration:has('ghost')?.7:.4,driveCooldown:has('ghost')?8:12, drone: has('sentinel')||creditHas('scout'),droneDamage:has('sentinel')?4:2,droneCooldown:has('sentinel')?.7:1.2 });
  }
  function unlocked(s,c) { return s.quest==='open' && (s.universe.freeTravel||s.progression.completed) && (!c.requires || s.cleared.includes(c.requires)); }
  function missionFlight(s) {
    const base = { enemies: 0, tier: 0, duration: 15, reward: 0, legal: true, cargo: 'Empty hold' };
    if (trainingPending(s)) return { ...base, name: 'Flight training / Vesper circuit', destination: 'vesper', duration: 10, kind: 'training' };
    if (s.quest === 'arrival') return { ...base, name: 'A ship of your own', destination: 'meridian' };
    if (s.quest === 'legal-run') return { ...base, name: 'An honest living', cargo: 'Water filtration parts', destination: 'kepler', enemies: 1, duration: 28, reward: 350 };
    if (s.quest === 'return') return { ...base, name: 'Back to the Dead Channel', destination: 'meridian', duration: 18 };
    if (s.quest === 'illegal-run') return { ...base, name: 'No questions asked', cargo: 'Unregistered memory wafers', legal: false, destination: 'rusthaven', enemies: 6, tier: 1, duration: 36, reward: 800 };
    if(s.quest==='open'&&!s.progression.flags.missileFired&&!s.contract)return {...base,id:'prologue-missiles',name:'Rook / Missile qualification',destination:s.location==='meridian'?'kepler':'meridian',enemies:1,tier:0,duration:18};
    if (s.quest === 'open' && s.contract==='rook-run'){const r=rookRun(s);return {...r,destination:r.destination===s.location?'meridian':r.destination};}
    if (s.quest === 'open' && s.contract) {
      const c = allContracts.find(c => c.id === s.contract);
      if (!c) return null;
      const pressure = c.chapter || c.faction ? 0 : Math.min(6, Math.floor(Math.max(0, s.completed - 2) / 2));
      // Faction deliveries are paid by Iris in the District, never on arrival.
      return { ...c, enemies: c.enemies + pressure * 2, tier: c.tier + pressure * .4, duration: c.duration + pressure * 2, pressure, destination: c.destination === s.location ? 'meridian' : c.destination, ...(c.faction ? { reward: 0 } : {}) };
    }
    if(s.quest==='open'&&s.destination&&stations[s.destination]&&s.destination!==s.location)return {...base,name:'Free transit',destination:s.destination,duration:20,enemies:3,tier:1,reward:0,kind:'transit'};
    return null;
  }
  function flight(s){
    let mission=missionFlight({...s,destination:null});
    // A run whose destination is the other system's hub is flown in one interstellar leg.
    if(mission&&U.system(s.location)!==U.system(mission.destination)&&U.nextHop(s.location,mission.destination)===mission.destination)mission={...mission,duration:Math.max(mission.duration,24)};
    else if(mission&&U.system(s.location)!==U.system(mission.destination))mission={name:'Interstellar connection',destination:U.nextHop(s.location,mission.destination),duration:24,enemies:0,tier:0,reward:0,legal:true,cargo:'Cargo retained in hold',kind:'transit'};
    if(!s.universe?.freeTravel||!s.destination||s.destination===s.location)return mission;
    if(mission?.destination===s.destination)return mission;
    const policy=U.route(s.location,s.destination);
    return {name:'Free transit',destination:s.destination,duration:policy.seconds,enemies:policy.interdiction?3:0,tier:1,reward:0,legal:true,cargo:'Empty hold',kind:'transit'};
  }
  function accept(s, id) {
    if (s.quest === 'legal-offer') { s.quest = 'legal-run';Missions.acquire(s,'legal-run'); return true; }
    if (s.quest === 'illegal-offer') { s.quest = 'illegal-run';Missions.acquire(s,'illegal-run'); return true; }
    const c = allContracts.find(c => c.id === id);
    if (c?.faction) return c.kind === 'supply' ? acceptSupply(s, c.faction) : acceptFaction(s, c.faction);
    if (s.contract || !c || !unlocked(s,c)) return false;
    if(!c.dataCargo&&(s.progression.cargo||[]).reduce((n,x)=>n+x.units,0)>=P.systems(s).cargo)return false;
    s.destination=null;s.contract = id;
    if(id==='rook-run'){s.story.flags.rookRunTo=rookRunTarget(s);Missions.acquire(s,rookRun(s).id);Story.emit(s,'missionAccepted',id);return true;}
    Missions.acquire(s,id);Story.emit(s,'missionAccepted',id);return true;
  }
  function complete(s) {
    const f = flight(s); if (!f) return null;
    const previous = s.quest;
    if(f.enemies>0){s.combatRuns=(s.combatRuns||0)+1;if(s.combatRuns>=2)s.missileUnlocked=true;}
    s.travel=null;s.destination=null;
    if(f.kind==='training'){
      s.location=f.destination;U.visit(s);P.checkpoint(s,s.location);P.mark(s,'dock');
      s.story.flags.flightTrainingComplete=true;
      Missions.sync(s,{missionFlight,contracts});Missions.complete(s,'meet-rook','instructions',{missionFlight});
      Story.emit(s,'arriveLocation',s.location);
      return {...f,repairCharged:0,gunReward:false,training:true};
    }
    s.location = f.destination; U.visit(s);P.checkpoint(s,s.location);P.mark(s,'dock');if(!s.progression.equipment.owned.includes('cooling')){s.progression.equipment.owned.push('cooling');if(previous==='arrival')s.credits+=200;} s.credits += f.reward;
    const repairCharged=Math.min(s.credits,Math.round(B.repairCost));s.credits-=repairCharged;
    if (f.reward) s.completed++;
    if (f.chapter && !s.cleared.includes(f.id)) s.cleared.push(f.id);
    if(f.kind==='transit'){s.story.chapter=s.quest;Story.emit(s,'arriveLocation',s.location);return {...f,repairCharged,gunReward:false};}
    if(f.id==='prologue-missiles')return {...f,repairCharged,gunReward:false};
    if(!f.faction&&!s.universe.completedObjectives.includes(f.id||previous))s.universe.completedObjectives.push(f.id||previous);
    if(previous==='arrival'&&s.location==='meridian'){
      for(const objective of ['travel','dock'])Missions.complete(s,'meet-rook',objective,{missionFlight});
    } else Missions.complete(s,f.id||previous);
    if (previous === 'arrival') s.quest = 'legal-offer';
    else if (previous === 'legal-run') s.quest = 'return';
    else if (previous === 'return') s.quest = 'illegal-offer';
    else if (previous === 'illegal-run') { s.quest = 'open'; s.upgrades.guns = Math.max(1, s.upgrades.guns); }
    else {
      if(s.contract==='rook-run'){
        const f=s.story.flags,served=new Set(String(f.rookSystems||'erebus').split(','));served.add(U.system(s.location));
        f.rookRuns=(Number.isSafeInteger(f.rookRuns)?f.rookRuns:0)+1;f.rookSystems=[...served].join(',');delete f.rookRunTo;
      }
      s.contract = null;
    }
    s.story.chapter=s.quest;Story.emit(s,'missionComplete',f.id||previous);Story.emit(s,'arriveLocation',s.location);Story.emit(s,'dock',s.location);
    return { ...f, missileOffer:s.missileUnlocked&&!s.missileOfferSeen, repairCharged, gunReward: previous === 'illegal-run' };
  }
  function buy(s, key) {
    if (s.completed < 1 || !Object.hasOwn(upgrades, key)) return false;
    const level = s.upgrades[key], cost = upgrades[key].prices[level];
    if (cost === undefined || s.credits < cost) return false;
    s.credits -= cost; s.upgrades[key]++; return true;
  }
  function buyGear(s,id){const g=content.creditGear[id];if(!g||(id==='launcher'&&!s.missileUnlocked)||s.completed<1||s.creditGear.includes(id)||s.credits<g.price)return false;s.credits-=g.price;s.creditGear.push(id);if(!s.progression)s.loadout[g.slot]=id;Story.emit(s,'acquireItem',id);return true;}

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
    out.progression=P.restore(raw.progression,raw);out.universe=U.restore(raw.universe,out);P.sync(out);
    out.destination=out.universe.freeTravel&&stations[raw.destination]&&raw.destination!==out.location?raw.destination:null;
    const f=flight(out);out.travel=f&&raw.travel?Warp.restore(raw.travel,out.location,f.destination,f.id||out.quest,f.enemies>0||['salvage','hazard','escort'].includes(f.kind)):null;
    out.story=Story.restore(raw.story);out.savedAt=Number.isSafeInteger(raw.savedAt)&&raw.savedAt>0?raw.savedAt:null;
    if(!raw.story&&out.quest!=='inheritance'){out.story.flags.metMara=true;out.story.met=['mara','elias'];out.story.events=['mara_workshop_intro'];out.story.chapter=out.quest;if(out.completed>0){out.story.flags.rookIntroduced=true;out.story.met.push('rook');}}
    if(!Object.hasOwn(stations,out.progression.checkpoint.location))out.progression.checkpoint={location:out.location};
    if(stations[out.progression.checkpoint.location]){out.location=out.progression.checkpoint.location;out.universe.station={location:out.location};}
    out.travel=null;out.destination=null;out.story.cursor=null;out.universe.currentSystem=U.system(out.location);Missions.sync(out,{missionFlight,contracts});return out;
  }
  function buyShip(s,id){const ship=S.ships[id];if(!ship||ship.premium||s.ownedShips.includes(id)||s.credits<ship.price)return false;s.credits-=ship.price;s.ownedShips.push(id);s.shipLoadouts[id]={...S.defaults[id]};for(const [key,item]of Object.entries(S.equipment))if(item.ship===id&&!s.standardGear.includes(key))s.standardGear.push(key);Story.emit(s,'ownShip',id);return true;}
  function switchShip(s,id){if(!S.owns(s,id)||!S.ships[id])return false;s.shipLoadouts[s.activeShip]={...s.loadout};s.activeShip=id;s.loadout={...(s.shipLoadouts[id]||S.defaults[id])};return true;}
  function ownsEquipment(s,id,verified=[]){return Object.hasOwn(content.gear,id)?verified.includes(id):Object.hasOwn(content.creditGear,id)?s.creditGear.includes(id):Object.hasOwn(S.equipment,id)&&(S.equipment[id].ship==='ship3'?S.owns(s,'ship3'):s.standardGear.includes(id));}
  function equip(s,id,verified=[]){const g={...content.gear,...content.creditGear,...S.equipment}[id];if(!g||!ownsEquipment(s,id,verified))return false;s.loadout[g.slot]=s.loadout[g.slot]===id?null:id;s.shipLoadouts[s.activeShip]={...s.loadout};return true;}
  function chooseDestination(s,id){if(!s.universe?.freeTravel||!U.destinations(s).includes(id)||!stations[id]||id===s.location)return false;s.destination=id;s.travel=null;return true;}

  // Resolve the current campaign at each callback: loading/new journeys replace state.
  function enemyHitConsequences(getState, persist) {
    return {
      beforeDamage() {
        const s = getState();
        if (typeof s.progression !== 'undefined') P.mark(s, 'laserCombat');
      },
      destroyed(enemy) {
        const s = getState();
        Story.emit(s, 'destroyTarget', enemy.contentId || enemy.className);
        if (enemy.owner) s.story.characters[enemy.owner] = 'dead';
        persist();
      }
    };
  }
  function missileFireConsequences(getState, persist) {
    return {
      fired(remaining) {
        const s = getState();
        s.progression.missiles = remaining;
        P.mark(s, 'missileLocked');
        P.mark(s, 'missileFired');
        persist();
      }
    };
  }
  function pistolConsequences(getState, mark, persist, hitCan) {
    return {
      ammunition() {
        const p = getState().progression.personal;
        return {ammo:p.ammo, reserve:p.reserve};
      },
      ammunitionChanged(ammunition) {
        const p = getState().progression.personal;
        p.ammo = ammunition.ammo;
        p.reserve = ammunition.reserve;
      },
      mark,
      hitCan(id) { return hitCan(getState(), id); },
      practiceComplete() { return getState().progression.flags.shootingTutorialComplete === true; },
      save: persist
    };
  }
  function pistolHandlingConsequences(getState, mark) {
    return {
      drawChanged(drawn) { mark(drawn ? 'draw' : 'holster'); },
      aimed() {
        mark('aim');
        if (getState().progression.personal.optic === 'red-dot') mark('sightAim');
      }
    };
  }
  const api = { stations, contracts, allContracts, rookRun, rookRunTarget, factionDeliveries, factionStage, factionOffers, acceptFaction, deliverFaction, collectFactionPayment, heldForAdmin, supplyDeliveries, supplyStage, supplyOffers, acceptSupply, originMissions, originState, acceptOrigin, upgrades, fresh, restore, beginJourney, trainingPending, stats, flight, missionFlight, accept, complete, buy, buyGear, unlocked, buyShip, switchShip, ownsEquipment, equip, chooseDestination, enemyHitConsequences, missileFireConsequences, pistolConsequences, pistolHandlingConsequences };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidCampaign = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
