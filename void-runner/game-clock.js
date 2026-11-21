/* THE IN-GAME CLOCK (pure rules: browser and Node tests; no DOM, no clock of its own). The owner, 17 Nov 2026: Fish's callback waits on IN-GAME time, so the player can
   do other things meanwhile; "clock only for now" (no day / night lighting, crowds or shop hours yet: they can read now() later, see LATER below).
   RATE: 1 real minute of ACTIVE play = 12 in-game minutes, so an in-game day is 2 hours of play.
   It runs only during active play: walking or flight (game.js modes 'walking', 'play', and a road-taxi ride), with the tab visible; never in a menu, while paused, in a
   conversation or the pod card, while the tab is hidden, or while the game is closed or the computer asleep (a gap between ticks counts MAX_STEP real seconds at most).
   Kept per player in the save: story.flags.gameMin = whole in-game minutes since the campaign started (clean_save accepts safe integers, so a reload or another computer
   carries on). A new campaign (and an older save, the first time it ticks) starts at START: Day 1, 21:00.
   Timers on it: a mission's completion is stamped story.flags.gc_<mission> = gameMin (mission-content.js); due(s, mission, minutes) is true once that many in-game
   minutes have passed since. The Mission Editor's trigger "After in-game time" uses it, and so do follow-ups (main-story.js FOLLOWUPS: {event, after, gameMinutes}),
   which fire ONCE (story.flags.ev_<event> = true). Every player has their own save: nothing here is shared in multiplayer.
   LATER (not built): lighting, crowds and shop hours can read now(s).minuteOfDay / .hour; nothing else needs to change. */
(function(root){
 'use strict';
 const FLAG='gameMin',RATE=12,MAX_STEP=5,START={day:1,hour:21,minute:0},MAX=9007199254740991,DAY=1440;
 const START_MIN=(START.day-1)*DAY+START.hour*60+START.minute;
 const stampKey=id=>'gc_'+String(id).slice(0,60),eventKey=id=>'ev_'+String(id).slice(0,60);
 const flagsOf=s=>s&&s.story&&s.story.flags&&typeof s.story.flags==='object'?s.story.flags:null;
 /* In-game minutes since the campaign started (0 for a new campaign). */
 const minutes=s=>{const f=flagsOf(s),v=f?Number(f[FLAG]):0;return Number.isSafeInteger(v)&&v>0?v:0;};
 const ACTIVE_MODES=['walking','play','road-taxi'];   // walking, flight ('play' in game.js), a taxi ride; 'dialogue', 'menu', 'pause', loading and the creator never run it
 function active(v){return !!(v&&v.visible&&ACTIVE_MODES.includes(v.mode)&&!v.paused&&!v.menu&&!v.podCard);}
 /* A clock for one page: add(s, dt, active) advances by dt real seconds (at most MAX_STEP) x RATE when active; whole in-game minutes go into the save, the fraction stays here.
    Returns the whole in-game minutes added this time. */
 function clock(){let frac=0;
  return {add(s,dt,on){const f=flagsOf(s);if(!f||!on||!(dt>0))return 0;frac+=Math.min(MAX_STEP,dt)*RATE/60;const whole=Math.floor(frac);if(!whole)return 0;frac-=whole;f[FLAG]=Math.min(MAX,minutes(s)+whole);return whole;},
   get fraction(){return frac;},reset(){frac=0;}};}
 const pad=n=>String(n).padStart(2,'0');
 /* The time of day for an in-game minute count (since the campaign started): {total, day, hour, minute, minuteOfDay, label:'21:40 · DAY 1'}. */
 function at(total){const t=START_MIN+Math.max(0,Math.floor(total||0)),day=Math.floor(t/DAY)+1,mod=t%DAY,hour=Math.floor(mod/60),minute=mod%60;
  return {total:Math.max(0,Math.floor(total||0)),day,hour,minute,minuteOfDay:mod,time:pad(hour)+':'+pad(minute),label:pad(hour)+':'+pad(minute)+' · DAY '+day};}
 const now=s=>at(minutes(s));
 /* A mission's completion stamp (in-game minutes); stamps it now when the mission is completed but has none (a mission completed before this existed starts its clock then). */
 function stamp(s,mission){const f=flagsOf(s);if(!f)return null;const k=stampKey(mission);if(!Number.isSafeInteger(f[k]))f[k]=minutes(s);return f[k];}
 function completed(s,mission){const r=s&&s.universe&&s.universe.missions&&s.universe.missions[mission];return !!(r&&r.completed===true);}
 /* In-game minutes since `mission` completed (null: not completed). */
 function since(s,mission){if(!completed(s,mission))return null;const a=stamp(s,mission);return Math.max(0,minutes(s)-(Number(a)||0));}
 const due=(s,mission,mins)=>{const t=since(s,mission);return t!==null&&Number.isFinite(mins)&&t>=mins;};
 const need=x=>Number.isFinite(x&&x.gameMinutes)?x.gameMinutes:Number.isFinite(x&&x.hours)?x.hours*60:NaN;
 /* The follow-ups due now that have not fired: each is marked fired (ev_<event> = true) and returned. Pure: the caller dispatches. */
 function fire(s,list){const f=flagsOf(s),out=[];if(!f)return out;for(const x of list||[]){if(!x||!x.event||f[eventKey(x.event)]===true)continue;if(due(s,x.after,need(x))){f[eventKey(x.event)]=true;out.push(x);}}return out;}
 /* For Developer Tools and the Mission Editor: where each follow-up stands, with the in-game time it is (or was) due. */
 function status(s,list){const f=flagsOf(s)||{};return (list||[]).map(x=>{const t=since(s,x.after),n=need(x),st=Number(f[stampKey(x.after)]);
  return {event:x.event,after:x.after,gameMinutes:n,status:x.status||'',fired:f[eventKey(x.event)]===true,started:t!==null,elapsed:t,remaining:t===null?null:Math.max(0,n-t),due:t!==null&&t>=n,dueAt:t!==null&&Number.isFinite(st)?at(st+n).label:null};});}
 /* Real minutes of active play for a span of in-game minutes (for the editor: 3 in-game hours = 15 minutes of play). */
 const realMinutes=gameMinutes=>gameMinutes/RATE;
 const api={FLAG,RATE,MAX_STEP,START,START_MIN,ACTIVE_MODES,stampKey,eventKey,minutes,active,clock,at,now,stamp,since,due,fire,status,realMinutes};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidClock=api;
})(typeof globalThis!=='undefined'?globalThis:this);
