/* IRIS'S AMBIENT LINES: the rules (Node + browser; the game wiring is iris-ambient-game.js). The owner approved 13 short lines on 21 Nov 2026 that Iris says
   "now and then" over Comms in fitting situations. Each has a recorded clip (assets/audio/voice/extra/iris-bark-*.ogg, speaker 'iris', the exact text below).
   - The words are the owner's, verbatim. Do not edit them: a clip is found by speaker + exact text (voice-clips.js), and tests/iris-ambient.test.cjs checks every one.
   - Never while anything else is going on (a conversation, a call, a cutscene, a camera feed, another voice line, a menu): `busy` skips; nothing is queued.
   - Automatic remarks only play during an access-point hack or the BR-04 wait. Only once the player has Iris as a contact.
   - THE BR-04 GAP (the owner, 21 Nov 2026: the gap between finishing Mission 009 and BR-04 coming online for Mission 010 "is supposed to be filled by Iris"): about
     25 s after 009 ends the wait line, then a shorter cooldown so she says a few more (jokes, the store line if it has not played this session), no line twice; it stops
     the moment Mission 010 arrives.
   Nothing here is saved: the state lives in memory for this play session (the store line at most once per session). TUNING is the one table of numbers. */
(function(root){
 'use strict';
 const LINES=[
  {id:'iris-bark-hack-1',cat:'hack',text:'Almost there.'},
  {id:'iris-bark-hack-2',cat:'hack',text:'Just a little longer.'},
  {id:'iris-bark-hack-3',cat:'hack',text:'Steady. You\'re halfway through.'},
  {id:'iris-bark-hack-4',cat:'hack',text:'Keep your hand still. Nearly done.'},
  {id:'iris-bark-sneak-1',cat:'sneak',text:'Easy. Don\'t rush it.'},
  {id:'iris-bark-sneak-2',cat:'sneak',text:'He hasn\'t seen you. Let\'s keep it that way.'},
  {id:'iris-bark-spotted-1',cat:'spotted',text:'That happens. Try again, a little slower.'},
  {id:'iris-bark-wait-1',cat:'wait',text:'Nothing yet. I\'ll tell you the moment it changes.'},
  {id:'iris-bark-joke-1',cat:'joke',text:'For the record, I calculated your odds. I\'ve decided not to share them.'},
  {id:'iris-bark-joke-2',cat:'joke',text:'I\'d come and help, but someone has to mind the counter.'},
  {id:'iris-bark-joke-3',cat:'joke',text:'You\'re doing fine. Statistically, someone has done this worse.'},
  {id:'iris-bark-store-1',cat:'store',text:'Have you seen the new T-shirts in the store? You\'d look a lot cooler doing this in one.'},
  {id:'iris-bark-store-2',cat:'store',text:'If you\'re going to break into places, you might as well look good doing it. The store has new shirts.'}];
 // Every number in seconds (real time) unless named otherwise.
 const TUNING={
  globalCooldown:210,     // between any two ambient lines (3.5 min)
  lineCooldown:1500,      // the same line again (25 min)
  hackMinHold:8,          // hack lines only on hacks this long or longer
  hackFrom:.42,hackTo:.72,// ... once, somewhere between these fractions of the hack (around the middle)
  storeChance:.34,        // a BR-04 slot picks the store line with this chance (while it has not played)
  gapFirst:25,            // the BR-04 gap: the wait line this long after Mission 009 ends
  gapCooldown:70,         // ... then a line about every 70 s (instead of globalCooldown)
  gapCalm:10              // ... each needing this long of calm
 };
 const BY=Object.fromEntries(LINES.map(l=>[l.id,l]));
 const of=cat=>LINES.filter(l=>l.cat===cat);
 function create(now=0){return {start:now,lastAny:-Infinity,last:{},storeDone:false,hacks:new Set(),calmSince:now,gap:null,log:[]};}
 const ready=(st,l,now,T)=>now-(st.last[l.id]??-Infinity)>=T.lineCooldown;
 function choose(list,rnd){return list.length?list[Math.min(list.length-1,Math.floor(rnd()*list.length))]:null;}
 function commit(st,l,now){st.lastAny=now;st.last[l.id]=now;if(l.cat==='store')st.storeDone=true;st.log.push({id:l.id,at:now});if(st.log.length>40)st.log.shift();}
 /* One check (about twice a second). now: seconds. ctx:
      enabled (the player's "Iris chatter" setting and the developer switch), contact (Iris is a contact), busy (conversation, call, cutscene, feed, voice, menu, dev play-test),
      combat (an armed person is after the player), hostile (a hostile zone), voice (voice on: the clip plays; off: the words only),
      hack {key, hold, t} (a hack running),
      gap (the BR-04 gap: Mission 009 done, Mission 010 not yet here).
    Returns null or {id, cat, text, speak} (already recorded: say it now). */
 function decide(st,ctx={},now=0,opt={}){
  const T={...TUNING,...(opt.tuning||{})},rnd=opt.random||Math.random;
  const tense=!!(ctx.busy||ctx.combat||ctx.hack);if(tense)st.calmSince=now;
  if(!ctx.gap)st.gap=null;else if(!st.gap)st.gap={since:now,used:new Set(),waitDone:false};
  if(!ctx.enabled||!ctx.contact||ctx.busy||ctx.combat)return null;
  const out=l=>{commit(st,l,now);if(st.gap)st.gap.used.add(l.id);return {id:l.id,cat:l.cat,text:l.text,speak:ctx.voice!==false};};
  const cool=now-st.lastAny>=T.globalCooldown;
  // a hack of hackMinHold s or more: one line around the middle
  if(ctx.hack){const h=ctx.hack,f=h.hold>0?h.t/h.hold:0;if(h.hold>=T.hackMinHold&&!st.hacks.has(h.key)&&f>=T.hackFrom&&f<=T.hackTo){st.hacks.add(h.key);const l=choose(of('hack').filter(x=>ready(st,x,now,T)),rnd);if(cool&&l)return out(l);}return null;}
  if(!st.gap||ctx.hostile)return null;
  const calm=now-st.calmSince;
  // THE BR-04 GAP: Iris fills it
  const g=st.gap,wait=of('wait')[0];
  if(!g.waitDone){if(now-g.since>=T.gapFirst&&calm>=Math.min(T.gapCalm,now-g.since)){g.waitDone=true;return out(wait);}return null;}
  if(now-st.lastAny<T.gapCooldown||calm<T.gapCalm)return null;
  const pool=LINES.filter(l=>(l.cat==='joke'||(l.cat==='store'&&!st.storeDone))&&!g.used.has(l.id)&&ready(st,l,now,T));
  const store=pool.filter(l=>l.cat==='store'),jokes=pool.filter(l=>l.cat==='joke');
  const l=store.length&&(!jokes.length||rnd()<T.storeChance)?choose(store,rnd):choose(jokes,rnd);return l?out(l):null;
 }
 /* Force one line of a kind (Developer Tools: TRY): only the busy rule still applies. */
 function force(st,cat,ctx={},now=0,opt={}){if(ctx.busy)return null;const rnd=opt.random||Math.random,l=choose(of(cat),rnd);if(!l)return null;commit(st,l,now);return {id:l.id,cat:l.cat,text:l.text,speak:ctx.voice!==false};}
 const api={LINES,TUNING,BY,of,create,decide,force,SPEAKER:'iris',MISSION_009:'m009-ghost-in-the-network',MISSION_010:'m010-the-price-of-admission'};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidIrisAmbientRules=api;
})(globalThis);
