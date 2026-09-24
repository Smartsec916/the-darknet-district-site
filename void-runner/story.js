/* Campaign-owned continuity. This module never grants premium inventory. */
(function(root) {
  const content = typeof module !== 'undefined' ? require('./story-content.js') : root.VoidStoryContent;
  const valid = id => typeof id === 'string' && /^[a-zA-Z][\w-]{0,63}$/.test(id) && !['constructor',
    'prototype', '__proto__'
  ].includes(id);

  function fresh() {
    return {
      flags: {},
      met: [],
      events: [],
      relationships: {},
      characters: {},
      unlocked: [],
      chapter: 'inheritance',
      pending: [],
      encounters: [],
      cursor: null
    };
  }

  function restore(raw) {
    const s = fresh();
    if (!raw || typeof raw !== 'object') return s;
    for (const key of ['met', 'events', 'unlocked', 'pending', 'encounters']) s[key] = [...new Set((Array
      .isArray(raw[key]) ? raw[key] : []).filter(valid))].slice(0, 256);
    for (const [key, test] of [
        ['flags', v => typeof v === 'boolean' || typeof v === 'string' && v.length <= 200 || Number
          .isSafeInteger(v)
        ],
        ['relationships', v => Number.isSafeInteger(v) && Math.abs(v) <= 100],
        ['characters', v => ['alive', 'dead', 'removed'].includes(v)]
      ])
      for (const [id, v] of Object.entries(raw[key] || {}).slice(0, 256))
        if (valid(id) && test(v)) s[key][id] = v;
    if (valid(raw.chapter)) s.chapter = raw.chapter;
    if (valid(raw.cursor?.scene) && valid(raw.cursor?.node) && content.dialogue[raw.cursor.scene]?.nodes[raw.cursor.node]) {
      s.cursor = {scene:raw.cursor.scene,node:raw.cursor.node,choices:raw.cursor.choices===true};
    }
    return s;
  }

  function matches(s, c = {}) {
    const t = s.story;
    return (!c.flags || Object.entries(c.flags).every(([k, v]) => t.flags[k] === v)) && (!c.completed || c
      .completed.every(id => s.cleared.includes(id))) && (!c.events || c.events.every(id => t.events
      .includes(id))) && (!c.met || c.met.every(id => t.met.includes(id))) && (!c.alive || c.alive.every(
      id => !['dead', 'removed'].includes(t.characters[id]))) && (!c.ship || s.ownedShips.includes(c
      .ship)) && (!c.item || s.creditGear.includes(c.item) || s.standardGear.includes(c.item)) && (!c
      .quest || c.quest === s.quest);
  }

  function apply(s, e = {}) {
    s.story ??= fresh();
    for (const [id, v] of Object.entries(e.flags || {}))
      if (valid(id)) {
        const changed = s.story.flags[id] !== v;
        s.story.flags[id] = v;
        if (changed) emit(s, 'reachFlag', id);
      } for (const [id, v] of Object.entries(e.relationships || {}))
      if (valid(id)) s.story.relationships[id] = Math.max(-100, Math.min(100, (s.story.relationships[id] ||
        0) + v));
    for (const [id, v] of Object.entries(e.characters || {}))
      if (valid(id) && ['alive', 'dead', 'removed'].includes(v)) s.story.characters[id] = v;
    for (const id of e.unlock || [])
      if (valid(id) && !s.story.unlocked.includes(id)) s.story.unlocked.push(id);
    if (e.chapter) s.story.chapter = e.chapter;
    if (Number.isSafeInteger(e.credits) && e.credits >= 0) s.credits = Math.min(100000000, s.credits + e
      .credits);
  }

  function emit(s, type, subject) {
    s.story ??= fresh();
    const fired = [];
    for (const event of content.events) {
      if (event.trigger.type !== type || event.trigger.subject && event.trigger.subject !== subject || s
        .story.events.includes(event.id) || !matches(s, event.when)) continue;
      s.story.events.push(event.id);
      apply(s, event.effects);
      if (event.scene && !s.story.pending.includes(event.scene)) s.story.pending.push(event.scene);
      if (event.encounter && !s.story.encounters.includes(event.encounter)) s.story.encounters.push(event
        .encounter);
      fired.push(event.id);
      emit(s, 'eventComplete', event.id);
    }
    return fired;
  }

  function relationship(ship) {
    if(ship.faction&&typeof VoidFactions!=='undefined')return VoidFactions.attitude({id:'player',faction:'player'},ship);
    const value=ship.relationship || ship.allegiance || 'hostile';
    return ['hostile','neutral','friendly'].includes(value)?value:'neutral';
  }
  const contactColors={hostile:'#ff718a',neutral:'#bbc2cc',friendly:'#58ffe1'};
  function hostile(ship) { return !ship.dead && relationship(ship)==='hostile'; }
  const api = {
    fresh,
    restore,
    matches,
    apply,
    emit,
    hostile, relationship, contactColors,
    content
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidStory = api;
})(globalThis);
