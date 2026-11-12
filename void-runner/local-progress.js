/* Local progress: counts of things a player has done in the District's simulations, kept in THIS BROWSER (docs/development/ACHIEVEMENTS.md).
   This is NOT the achievement system and unlocks nothing: achievements (achievements.js) are unlocked only by server-verified events, and that server record does
   not exist yet. Until it does, this lets a player see how far along they are. Counters only go up, by events the game itself reports (a fish landed); nothing
   here accepts a number typed by a player. A goal that has been reached is shown as "reached", never as an unlocked achievement.
   PURE RULES (run in Node tests) plus a thin browser store, per account (or 'local' when not signed in). */
(function(root){
 'use strict';
 const DEFS=[
  {id:'tropical-100-fish',game:'tropical',gameTitle:'Tropical Escape',title:'Catch 100 Fish',description:'Catch 100 fish in Tropical Escape.',counter:'tropical-fish',goal:100}   // the same id as its achievement in achievements.js
 ];
 const clean=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 function restore(raw){let o=null;try{o=typeof raw==='string'?JSON.parse(raw):raw;}catch{o=null;}const out={counters:{},earned:{}};if(!o||typeof o!=='object')return out;
  for(const d of DEFS){const c=clean(o.counters?.[d.counter]);if(c)out.counters[d.counter]=c;const e=o.earned?.[d.id];if(typeof e==='string'&&/^\d{4}-\d{2}-\d{2}/.test(e))out.earned[d.id]=e.slice(0,24);}
  return out;}
 /* add(record, counter, n, today) -> ids newly earned. One event adds at most 5 (a guard against a runaway caller, not a security measure). */
 function add(rec,counter,n=1,today=''){if(!DEFS.some(d=>d.counter===counter)||!Number.isSafeInteger(n)||n<1)return [];rec.counters[counter]=clean(rec.counters[counter])+Math.min(5,n);
  const got=[];for(const d of DEFS)if(d.counter===counter&&!rec.earned[d.id]&&rec.counters[counter]>=d.goal){rec.earned[d.id]=String(today||'').slice(0,24)||'earned';got.push(d.id);}return got;}
 const list=rec=>DEFS.map(d=>({...d,progress:Math.min(d.goal,clean(rec.counters[d.counter])),earned:rec.earned[d.id]||null}));
 // Lines for the profile screen: only what has been started.
 const lines=rec=>list(rec).filter(a=>a.earned||a.progress>0).map(a=>a.gameTitle+' · '+a.title+' · '+a.progress+' of '+a.goal+(a.earned?' · reached '+a.earned.slice(0,10):'')+' (progress kept in this browser)');
 const api={DEFS,restore,add,list,lines};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 const key=()=>{let uid='local';try{uid=root.VoidAccount?.user?.uid||'local';}catch{}return 'void-runner-local-progress-v1:'+uid;};
 const load=()=>{try{return restore(root.localStorage.getItem(key()));}catch{return restore(null);}};
 const save=rec=>{try{root.localStorage.setItem(key(),JSON.stringify(rec));}catch{}};
 root.VoidLocalProgress={...api,
  /* count(counter, n): the game reports an event. Returns {total, earned:[definitions newly earned]}. */
  count(counter,n=1){const rec=load(),got=add(rec,counter,n,new Date().toISOString().slice(0,10));save(rec);return {total:rec.counters[counter]||0,earned:got.map(id=>DEFS.find(d=>d.id===id))};},
  get record(){return load();},mine(){return list(load());},profileLines(){return lines(load());}};
})(typeof globalThis!=='undefined'?globalThis:this);
