/* ACTIVE PLAYTIME (pure rules: browser and Node tests; no DOM, no clock of its own). One counter of the seconds a player has spent in ACTIVE play, kept in the save
   as story.flags.playSec (a whole number of seconds, so the cloud save carries it from device to device; clean_save accepts safe integers). The browser ticker
   (live-content.js) adds time only while the tab is visible and the game is in play (walking, a conversation, flight, docked, a taxi ride): never in a menu, while paused, in the
   pod card, while the tab is hidden, or while the computer sleeps or the game is closed (a gap longer than MAX_STEP between ticks counts as MAX_STEP at most).
   The reusable trigger "after N minutes of active play" (the owner, 17 Nov 2026, Mission 003: Fish's follow-up call) measures from a mission's completion:
   story.flags.pc_<mission> = playSec when that mission completed (stamped by mission-content.js; a mission completed before this existed is stamped the first time
   it is checked, so its clock starts then). due(s, mission, minutes) is true once that much active play has passed since.
   Follow-ups (main-story.js FOLLOWUPS: event, after, minutes) fire ONCE: story.flags.ev_<event> = true marks it fired, so a reload, a second device or a second tick
   never fires it again. Every player has their own save, so all of this is per player (multiplayer: nothing is shared). */
(function(root){
 'use strict';
 const COUNTER='playSec',MAX_STEP=5,MAX=9007199254740991;
 const stampKey=id=>'pc_'+String(id).slice(0,60),eventKey=id=>'ev_'+String(id).slice(0,60);
 const flagsOf=s=>s&&s.story&&s.story.flags&&typeof s.story.flags==='object'?s.story.flags:null;
 const seconds=s=>{const f=flagsOf(s),v=f?Number(f[COUNTER]):0;return Number.isSafeInteger(v)&&v>0?v:0;};
 /* A playtime clock for one page: add(s, dt, active) counts dt seconds (capped at MAX_STEP) when active is true; whole seconds go into the save, the fraction is kept here.
    Returns the whole seconds added this time (0 most of the time). */
 function clock(){let frac=0;
  return {add(s,dt,active){const f=flagsOf(s);if(!f||!active||!(dt>0))return 0;frac+=Math.min(MAX_STEP,dt);const whole=Math.floor(frac);if(!whole)return 0;frac-=whole;f[COUNTER]=Math.min(MAX,seconds(s)+whole);return whole;},
   get fraction(){return frac;},reset(){frac=0;}};}
 /* Is the game in active play right now? view: {visible, mode, paused, menu, podCard}. */
 const ACTIVE_MODES=['walking','dialogue','play','dock','arrival','road-taxi'];   // game.js modes: 'play' is flight; 'menu' (the game menu), 'pause', loading and the creator never count
 function active(v){return !!(v&&v.visible&&ACTIVE_MODES.includes(v.mode)&&!v.paused&&!v.menu&&!v.podCard);}
 /* The completion stamp of a mission (the playSec it completed at); stamps it now when the mission is completed but has none. */
 function stamp(s,mission){const f=flagsOf(s);if(!f)return null;const k=stampKey(mission);if(!Number.isSafeInteger(f[k]))f[k]=seconds(s);return f[k];}
 function completed(s,mission){const r=s&&s.universe&&s.universe.missions&&s.universe.missions[mission];return !!(r&&r.completed===true);}
 /* Active seconds since `mission` completed (null: not completed). Stamps a missing completion. */
 function since(s,mission){if(!completed(s,mission))return null;const at=stamp(s,mission);return Math.max(0,seconds(s)-(Number(at)||0));}
 const due=(s,mission,minutes)=>{const t=since(s,mission);return t!==null&&Number.isFinite(minutes)&&t>=minutes*60;};
 /* The follow-ups that are due now and have not fired: marks each fired (ev_<event> = true) and returns them. Pure: the caller dispatches. */
 function fire(s,list){const f=flagsOf(s),out=[];if(!f)return out;for(const x of list||[]){if(!x||!x.event||f[eventKey(x.event)]===true)continue;if(due(s,x.after,x.minutes)){f[eventKey(x.event)]=true;out.push(x);}}return out;}
 /* For Developer Tools and the Mission Editor: where each follow-up stands. */
 function status(s,list){const f=flagsOf(s)||{};return (list||[]).map(x=>{const t=since(s,x.after),need=x.minutes*60;
  return {event:x.event,after:x.after,minutes:x.minutes,status:x.status||'',fired:f[eventKey(x.event)]===true,started:t!==null,elapsed:t,remaining:t===null?null:Math.max(0,need-t),due:t!==null&&t>=need};});}
 const api={COUNTER,MAX_STEP,ACTIVE_MODES,stampKey,eventKey,seconds,clock,active,stamp,since,due,fire,status};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidPlaytime=api;
})(typeof globalThis!=='undefined'?globalThis:this);
