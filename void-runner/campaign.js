/* Campaign rules are independent of rendering so rewards and saves can be tested. */
(function (root) {
  'use strict';
  const stations = {
    meridian: { name: 'Meridian Station', district: 'SECTOR 07 / THE LOWER ORBIT', color: '#58ffe1', bar: 'The Dead Channel' },
    kepler: { name: 'Kepler Exchange', district: 'SECTOR 12 / FREIGHT LANE', color: '#ffbd69', bar: 'The Loading Bay' },
    undertow: { name: 'Undertow Dock', district: 'SECTOR 19 / OFF THE GRID', color: '#ef79ff', bar: 'Low Frequency' },
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
    engines: { name: 'Vector thrusters', description: 'Faster movement and more responsive handling.', prices: [250, 500, 900] }
  };
  const quests = ['inheritance', 'arrival', 'legal-offer', 'legal-run', 'return', 'illegal-offer', 'illegal-run', 'open'];
  function fresh() { return { version: 1, quest: 'inheritance', location: 'meridian', credits: 100, reputation: 0, completed: 0, upgrades: { guns: 0, armor: 0, engines: 0 }, contract: null }; }
  function restore(raw) {
    try {
      const s = JSON.parse(raw);
      if (!s || s.version !== 1 || !quests.includes(s.quest) || !Object.hasOwn(stations, s.location)) return null;
      for (const k of ['credits', 'reputation', 'completed']) if (!Number.isSafeInteger(s[k]) || s[k] < 0 || s[k] > 100000000) return null;
      for (const k of Object.keys(upgrades)) if (!Number.isInteger(s.upgrades?.[k]) || s.upgrades[k] < 0 || s.upgrades[k] > 3) return null;
      if (s.contract !== null && !contracts.some(c => c.id === s.contract)) return null;
      return { ...fresh(), quest: s.quest, location: s.location, credits: s.credits, reputation: s.reputation, completed: s.completed, upgrades: { guns: s.upgrades.guns, armor: s.upgrades.armor, engines: s.upgrades.engines }, contract: s.contract };
    } catch { return null; }
  }
  function beginJourney(s) { if (s.quest !== 'inheritance') return false; s.quest = 'arrival'; return true; }
  function stats(s) { return { hull: 100 + s.upgrades.armor * 30, damage: 1 + s.upgrades.guns * .65, cooldown: .22 - s.upgrades.guns * .035, speed: 10 + s.upgrades.engines * 2.5 }; }
  function flight(s) {
    const base = { enemies: 0, tier: 0, duration: 15, reward: 0, rep: 0, legal: true, cargo: 'Empty hold' };
    if (s.quest === 'arrival') return { ...base, name: 'A ship of your own', destination: 'meridian' };
    if (s.quest === 'legal-run') return { ...base, name: 'An honest living', cargo: 'Water filtration parts', destination: 'kepler', enemies: 1, duration: 28, reward: 350, rep: 2 };
    if (s.quest === 'return') return { ...base, name: 'Back to the Dead Channel', destination: 'meridian', duration: 18 };
    if (s.quest === 'illegal-run') return { ...base, name: 'No questions asked', cargo: 'Unregistered memory wafers', legal: false, destination: 'undertow', enemies: 6, tier: 1, duration: 36, reward: 800, rep: 3 };
    if (s.quest === 'open' && s.contract) {
      const c = contracts.find(c => c.id === s.contract);
      const pressure = Math.min(6, Math.floor(Math.max(0, s.completed - 2) / 2));
      return { ...c, enemies: c.enemies + pressure * 2, tier: c.tier + pressure * .4, duration: c.duration + pressure * 2, pressure, destination: c.destination === s.location ? 'meridian' : c.destination };
    }
    return null;
  }
  function accept(s, id) {
    if (s.quest === 'legal-offer') { s.quest = 'legal-run'; return true; }
    if (s.quest === 'illegal-offer') { s.quest = 'illegal-run'; return true; }
    const c = contracts.find(c => c.id === id);
    if (s.quest !== 'open' || s.contract || !c || s.reputation < c.requirement) return false;
    s.contract = id; return true;
  }
  function complete(s) {
    const f = flight(s); if (!f) return null;
    const previous = s.quest;
    s.location = f.destination; s.credits += f.reward; s.reputation += f.rep;
    if (f.reward) s.completed++;
    if (previous === 'arrival') s.quest = 'legal-offer';
    else if (previous === 'legal-run') s.quest = 'return';
    else if (previous === 'return') s.quest = 'illegal-offer';
    else if (previous === 'illegal-run') { s.quest = 'open'; s.upgrades.guns = Math.max(1, s.upgrades.guns); }
    else s.contract = null;
    return { ...f, gunReward: previous === 'illegal-run' };
  }
  function buy(s, key) {
    if (s.quest !== 'open' || !Object.hasOwn(upgrades, key)) return false;
    const level = s.upgrades[key], cost = upgrades[key].prices[level];
    if (cost === undefined || s.credits < cost) return false;
    s.credits -= cost; s.upgrades[key]++; return true;
  }
  const api = { stations, contracts, upgrades, fresh, restore, beginJourney, stats, flight, accept, complete, buy };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidCampaign = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
