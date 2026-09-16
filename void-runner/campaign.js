/* Campaign rules are independent of rendering so rewards and saves can be tested. */
(function (root) {
  'use strict';
  const content = typeof module !== 'undefined' ? require('./content.js') : root.VoidContent;
  const stations = {
    meridian: { name: 'Meridian Station', district: 'SECTOR 07 / THE LOWER ORBIT', color: '#58ffe1', bar: 'The Dead Channel' },
    kepler: { name: 'Kepler Exchange', district: 'SECTOR 12 / FREIGHT LANE', color: '#ffbd69', bar: 'The Loading Bay' },
    undertow: { name: 'Rusthaven Port', district: 'SECTOR 19 / OFF THE GRID', color: '#ef79ff', bar: 'Low Frequency' },
    foundry: { name: 'The Foundry', district: 'SECTOR 24 / INDUSTRIAL BELT', color: '#ff795f', bar: 'Afterburn' }
  };
  const contracts = [
    { id: 'medicine', name: 'Cold chain', cargo: 'Refrigerated clinic supplies', legal: true, destination: 'kepler', reward: 650, rep: 2, enemies: 8, tier: 1, duration: 38, requirement: 5, contact: 'Dr. Sol', briefing: 'Our clinics need these before the next shift. Keep the containers intact. The raiders out here have started flying in pairs.' },
    { id: 'ghost', name: 'Ghost hardware', cargo: 'Unlicensed neural processors', legal: false, destination: 'undertow', reward: 1000, rep: 3, enemies: 12, tier: 2, duration: 45, requirement: 7, contact: 'Iona Vale', briefing: 'The people buying these cannot afford corporate leases on their own minds. Expect armored interceptors. Upgrade before you leave.' },
    { id: 'foundry', name: 'A debt in steel', cargo: 'Restricted fabrication cores', legal: false, destination: 'foundry', reward: 1500, rep: 4, enemies: 16, tier: 3, duration: 52, requirement: 10, contact: 'Rook', briefing: 'The Foundry is building something the corporations would rather stay broken. A gunship guards the approach. Bring armor and a better reactor.' }
  ];
  const upgrades = {
    guns: { name: 'Pulse cannons', description: 'More damage and a faster firing cycle.', prices: [350, 700, 1200] },
    armor: { name: 'Hull plating', description: 'Adds 30 hull integrity per tier.', prices: [300, 600, 1000] },
    engines: { name: 'Vector thrusters', description: 'Faster movement and more responsive handling.', prices: [250, 500, 900] },
    shields: { name: 'Deflector shield', description: '15 shield capacity per tier. Regenerates 6 per second after 6 seconds without a hit.', prices: [300, 650, 1000] }
  };
  const quests = ['inheritance', 'arrival', 'legal-offer', 'legal-run', 'return', 'illegal-offer', 'illegal-run', 'open'];
  const allContracts = [...contracts, ...content.missions];
  function fresh() { return { version: 2, quest: 'inheritance', location: 'meridian', credits: 100, reputation: 0, completed: 0, upgrades: { guns: 0, armor: 0, engines: 0, shields:0 }, contract: null, cleared: [], creditGear:[], loginOfferSeen:false, loadout: {weapon:null,shield:null,utility:null} }; }
  function restore(raw) {
    try {
      const s = JSON.parse(raw);
      if (!s || ![1,2].includes(s.version) || !quests.includes(s.quest) || !Object.hasOwn(stations, s.location)) return null;
      for (const k of ['credits', 'reputation', 'completed']) if (!Number.isSafeInteger(s[k]) || s[k] < 0 || s[k] > 100000000) return null;
      if(s.upgrades && s.upgrades.shields===undefined)s.upgrades.shields=0;
      for (const k of Object.keys(upgrades)) if (!Number.isInteger(s.upgrades?.[k]) || s.upgrades[k] < 0 || s.upgrades[k] > 3) return null;
      if (s.contract !== null && !allContracts.some(c => c.id === s.contract)) return null;
      const cleared = Array.isArray(s.cleared) ? [...new Set(s.cleared.filter(id=>content.missions.some(m=>m.id===id)))] : [];
      const loadout = fresh().loadout;
      const allGear={...content.gear,...content.creditGear};
      for (const slot of Object.keys(loadout)) if (Object.hasOwn(allGear,s.loadout?.[slot] || '') && allGear[s.loadout[slot]].slot===slot) loadout[slot]=s.loadout[slot];
      const creditGear=Array.isArray(s.creditGear)?[...new Set(s.creditGear.filter(id=>Object.hasOwn(content.creditGear,id)))]:[];
      return { ...fresh(), quest: s.quest, location: s.location, credits: s.credits, reputation: s.reputation, completed: s.completed, upgrades: { guns: s.upgrades.guns, armor: s.upgrades.armor, engines: s.upgrades.engines,shields:s.upgrades.shields }, contract: s.contract, cleared, loadout,creditGear,loginOfferSeen:typeof s.loginOfferSeen==='boolean'?s.loginOfferSeen:s.completed>0 };
    } catch { return null; }
  }
  function beginJourney(s) { if (s.quest !== 'inheritance') return false; s.quest = 'arrival'; return true; }
  function stats(s, owned = []) {
    const has = id => owned.includes(id) && s.loadout?.[content.gear[id].slot] === id;
    const creditHas=id=>s.creditGear?.includes(id)&&s.loadout?.utility===id;
    return { hull: 100 + s.upgrades.armor * 30, damage: has('wraith') ? 3.6875 : 1 + s.upgrades.guns * .65, cooldown: has('wraith') ? .115 : .22 - s.upgrades.guns * .035, speed: 10 + s.upgrades.engines * 2.5, shield: has('aegis') ? 70 : (s.upgrades.shields||0)*15, shieldRegen:has('aegis')?12:6,shieldDelay:has('aegis')?4:6, piercing: has('wraith'), drive: has('ghost')||creditHas('vector'),driveDuration:has('ghost')?.7:.4,driveCooldown:has('ghost')?8:12, drone: has('sentinel')||creditHas('scout'),droneDamage:has('sentinel')?4:2,droneCooldown:has('sentinel')?.7:1.2 };
  }
  function unlocked(s,c) { return s.quest==='open' && s.reputation>=c.requirement && (!c.requires || s.cleared.includes(c.requires)); }
  function flight(s) {
    const base = { enemies: 0, tier: 0, duration: 15, reward: 0, rep: 0, legal: true, cargo: 'Empty hold' };
    if (s.quest === 'arrival') return { ...base, name: 'A ship of your own', destination: 'meridian' };
    if (s.quest === 'legal-run') return { ...base, name: 'An honest living', cargo: 'Water filtration parts', destination: 'kepler', enemies: 1, duration: 28, reward: 350, rep: 2 };
    if (s.quest === 'return') return { ...base, name: 'Back to the Dead Channel', destination: 'meridian', duration: 18 };
    if (s.quest === 'illegal-run') return { ...base, name: 'No questions asked', cargo: 'Unregistered memory wafers', legal: false, destination: 'undertow', enemies: 6, tier: 1, duration: 36, reward: 800, rep: 3 };
    if (s.quest === 'open' && s.contract) {
      const c = allContracts.find(c => c.id === s.contract);
      if (!c) return null;
      const pressure = c.chapter ? 0 : Math.min(6, Math.floor(Math.max(0, s.completed - 2) / 2));
      return { ...c, enemies: c.enemies + pressure * 2, tier: c.tier + pressure * .4, duration: c.duration + pressure * 2, pressure, destination: c.destination === s.location ? 'meridian' : c.destination };
    }
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
    s.location = f.destination; s.credits += f.reward; s.reputation += f.rep;
    if (f.reward) s.completed++;
    if (f.chapter && !s.cleared.includes(f.id)) s.cleared.push(f.id);
    if (previous === 'arrival') s.quest = 'legal-offer';
    else if (previous === 'legal-run') s.quest = 'return';
    else if (previous === 'return') s.quest = 'illegal-offer';
    else if (previous === 'illegal-run') { s.quest = 'open'; s.upgrades.guns = Math.max(1, s.upgrades.guns); }
    else s.contract = null;
    return { ...f, gunReward: previous === 'illegal-run' };
  }
  function buy(s, key) {
    if (s.completed < 1 || !Object.hasOwn(upgrades, key)) return false;
    const level = s.upgrades[key], cost = upgrades[key].prices[level];
    if (cost === undefined || s.credits < cost) return false;
    s.credits -= cost; s.upgrades[key]++; return true;
  }
  function buyGear(s,id){const g=content.creditGear[id];if(!g||s.completed<1||s.creditGear.includes(id)||s.credits<g.price)return false;s.credits-=g.price;s.creditGear.push(id);s.loadout[g.slot]=id;return true;}
  const api = { stations, contracts, allContracts, upgrades, fresh, restore, beginJourney, stats, flight, accept, complete, buy, buyGear, unlocked };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidCampaign = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
