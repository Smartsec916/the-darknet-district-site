/* "…AND ONLY WHEN": EXTRA START CONDITIONS (the owner, 20 Nov 2026: "can you add a secondary trigger. so like i can set the first one to 'when you get close to' giver,
   then a secondary trigger, like 'when other npcs are farther than . . .' and other ones. if a secondary isn't set it will just go off the first trigger.")
   PURE RULES: no DOM, no network; browser and Node (tests/start-conditions.test.cjs). The server repeats the checks (void_runner_live_content.py only_problems).
   DATA: a mission's start (any way of starting: in person, walked near, Messages, Comms, a banner) may carry `only`: a list (up to 6) of conditions. The mission starts when
   its trigger fires AND every condition is true. No list (or an empty one): exactly the old behaviour.
     alone      {npc?, distance (m, 1..30, default 6), crowd? (default true)}  nobody else within `distance` of that person (default: the person the trigger walks near,
                else the giver). crowd:true counts the street crowd too; crowd:false counts only placed people (named residents, made characters, mission cast).
     players    {npc?, distance (m, 1..50, default 10)}  no other online player within `distance` of that person (remote-players.js: only players drawn on this level).
     time       {from:'hh:mm', to:'hh:mm'}  the street clock (mission-givers.js streetTime, UTC hours, the clock Reverie's and Lace's shifts use); past midnight works
                (20:00 to 04:00). from and to must differ.
     place      {place}  the player is in that place (places.js id: an exact spot, a venue or a whole area / quarter such as `underground`).
     mission    {mission, done (default true)}  that mission is finished (done:true) or not finished (done:false).
     flag       {flag, set (default true)}  a story flag is set (any value but false) or not set.
     credits    {amount 1..10000000}  the player has at least that many credits.
     ship       {has (default true)}  the player has a ship (ships.js hasShip: story.flags.shipAccess is not 'none'), or has none.
     on-foot    {}  the player is walking (not riding a taxi, not flying).
     holstered  {}  the player's weapon is not drawn.
     zone       {zone:'friendly'|'neutral'|'hostile'}  the zone the player stands in (zones.js through zone-integration.js; outside NeoChinatown: Friendly).
   WHEN THE CONDITIONS ARE NOT MET AT THE MOMENT OF THE TRIGGER (oneShot below):
     walked near            the game keeps checking four times a second while the player stays in range; it starts as soon as they are all true.
     talk (in person)       the giver does not offer it this time; the next time the player talks to them it is checked again.
     after a mission / after in-game time / a story flag   these are states, checked on every event (twice a second while walking): it starts once all are true.
     pod exit / enter a place / leave a place   one moment: the trigger is remembered (story.flags.mq_<mission> = true) and checked on every event after that (twice a
                second while walking) until the conditions are true; then it starts and the mark is removed. Nothing to save on the server: story.flags is tolerant.
   WHAT THE GAME MEASURES (world, given by live-content.js; tests give their own): {others(npc,metres,crowd) -> number | null (null: that person is not in this scene),
     players(npc,metres) -> number | null, places() -> [ids], onFoot() -> boolean, drawn() -> boolean, zone() -> 'friendly'|'neutral'|'hostile'|null}.
     A condition the game cannot measure right now (no world, the person not in the scene) is NOT met: the mission waits rather than starting wrongly.
   NOT BUILT: "the giver is idle (not walking a route)": the people who walk routes (Reverie and Lace, made characters, mission cast) each keep their own state and
     there is no one clean "is walking now" signal for every giver; left out rather than guessed. Steps: these conditions gate a mission's START only (there is no
     "walk near" step kind; the wait step's "only while near" already exists). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const KINDS=[
  {id:'alone',name:'No other people near someone',help:'Nobody else within the distance of that person (the giver if you leave it). Untick “count the street crowd” to count only placed people (residents, characters you made, people placed for a mission).',world:true},
  {id:'players',name:'No other players near someone',help:'No other online player within the distance of that person (multiplayer).',world:true},
  {id:'time',name:'Time of day (street clock)',help:'Between two times on the street clock (UTC, the clock Reverie’s and Lace’s shifts use). 20:00 to 04:00 goes past midnight.'},
  {id:'place',name:'The player is in a place',help:'An exact spot, a venue, or a whole area or quarter.',world:true},
  {id:'mission',name:'Another mission is finished / not finished',help:'Pick the mission and whether it must be finished or not finished yet.'},
  {id:'flag',name:'A story flag is set / not set',help:'Set: the flag has any value except false.'},
  {id:'credits',name:'The player has at least some credits',help:'Checked, never taken.'},
  {id:'ship',name:'The player has a ship / has no ship',help:'Any ship of their own.'},
  {id:'on-foot',name:'The player is on foot (not in a taxi or a ship)',help:'Not riding a taxi, not flying.',world:true},
  {id:'holstered',name:'The player has not drawn their weapon',help:'The pistol is holstered (or they have none).',world:true},
  {id:'zone',name:'The zone where the player is',help:'Friendly, Neutral or Hostile (the Zones table and the missions’ own zones).',world:true}];
 const IDS=KINDS.map(k=>k.id),MAX=6,DIST={min:1,max:30,def:6},PDIST={min:1,max:50,def:10},CREDITS={min:1,max:10000000,def:100},ZONES=['friendly','neutral','hostile'];
 const KEYS={alone:['kind','npc','distance','crowd'],players:['kind','npc','distance'],time:['kind','from','to'],place:['kind','place'],mission:['kind','mission','done'],flag:['kind','flag','set'],
  credits:['kind','amount'],ship:['kind','has'],'on-foot':['kind'],holstered:['kind'],zone:['kind','zone']};
 const HHMM=/^([01]\d|2[0-3]):[0-5]\d$/,FLAG=/^[a-zA-Z][\w-]{0,63}$/,ID=/^[a-z0-9][a-z0-9_-]{0,63}$/;
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x),num=x=>typeof x==='number'&&Number.isFinite(x);
 const minutes=t=>HHMM.test(t||'')?Number(t.slice(0,2))*60+Number(t.slice(3)):null;
 /* Is minute-of-day `m` inside from..to (past midnight when to is earlier)? */
 const between=(from,to,m)=>{const a=minutes(from),b=minutes(to);if(a===null||b===null||a===b)return false;return a<b?m>=a&&m<b:m>=a||m<b;};
 const streetMinute=ms=>((Math.floor(ms/60000)%1440)+1440)%1440;
 const oneShot=st=>!!(st&&st.how==='notification'&&st.when&&['pod-exit','place','leave'].includes(st.when.kind));
 const list=st=>st&&Array.isArray(st.only)&&st.only.length?st.only:null;
 const needsWorld=l=>(l||[]).some(c=>c&&(KINDS.find(k=>k.id===c.kind)||{}).world);
 /* A new condition for "+ ADD CONDITION" (the editor), in the shape problems() accepts once its blanks are filled. */
 function fresh(kind){switch(kind){case 'alone':return {kind,distance:DIST.def,crowd:true};case 'players':return {kind,distance:PDIST.def};case 'time':return {kind,from:'20:00',to:'04:00'};
  case 'place':return {kind,place:''};case 'mission':return {kind,mission:'',done:true};case 'flag':return {kind,flag:'',set:true};case 'credits':return {kind,amount:CREDITS.def};case 'ship':return {kind,has:true};
  case 'zone':return {kind,zone:'friendly'};default:return {kind};}}
 /* Plain-words problems with a start's `only` (the server's only_problems says the same). ctx: {person(id) -> true when the game has a TALK prompt for them,
    places: Set of place ids, missions: Set of mission ids (or null: not checked)}. */
 function problems(only,ctx={}){const out=[];if(only==null)return out;if(!Array.isArray(only))return ['the extra conditions must be a list.'];if(only.length>MAX)out.push('at most '+MAX+' extra conditions.');
  only.slice(0,MAX).forEach((c,i)=>{const w='condition '+(i+1)+': ';if(!obj(c)||!IDS.includes(c.kind)){out.push(w+'unknown kind of condition.');return;}
   if(Object.keys(c).some(k=>!KEYS[c.kind].includes(k))){out.push(w+'has fields it does not use.');return;}
   const who=()=>{if(c.npc!=null&&(typeof c.npc!=='string'||(ctx.person&&!ctx.person(c.npc))))out.push(w+'must name someone the game has a TALK prompt for (or leave it as the giver).');};
   if(c.kind==='alone'){who();if(!(num(c.distance)&&c.distance>=DIST.min&&c.distance<=DIST.max))out.push(w+'“no other people near” needs a distance from '+DIST.min+' to '+DIST.max+' metres.');if(c.crowd!=null&&typeof c.crowd!=='boolean')out.push(w+'“count the street crowd” must be yes or no.');}
   if(c.kind==='players'){who();if(!(num(c.distance)&&c.distance>=PDIST.min&&c.distance<=PDIST.max))out.push(w+'“no other players near” needs a distance from '+PDIST.min+' to '+PDIST.max+' metres.');}
   if(c.kind==='time'){if(!HHMM.test(c.from||'')||!HHMM.test(c.to||''))out.push(w+'the times must be written hh:mm (00:00 to 23:59).');else if(c.from===c.to)out.push(w+'the start and end times must differ.');}
   if(c.kind==='place'&&(typeof c.place!=='string'||!c.place||(ctx.places&&!ctx.places.has(c.place))))out.push(w+'choose the place the player must be in.');
   if(c.kind==='mission'){if(typeof c.mission!=='string'||!ID.test(c.mission)||(ctx.missions&&!ctx.missions.has(c.mission)))out.push(w+'choose a mission that exists.');if(c.done!=null&&typeof c.done!=='boolean')out.push(w+'“finished / not finished” must be yes or no.');}
   if(c.kind==='flag'){if(!FLAG.test(c.flag||''))out.push(w+'the story flag needs a name (letters, digits, - or _).');if(c.set!=null&&typeof c.set!=='boolean')out.push(w+'“set / not set” must be yes or no.');}
   if(c.kind==='credits'&&!(Number.isInteger(c.amount)&&c.amount>=CREDITS.min&&c.amount<=CREDITS.max))out.push(w+'the credits must be a whole number from '+CREDITS.min+' to '+CREDITS.max+'.');
   if(c.kind==='ship'&&c.has!=null&&typeof c.has!=='boolean')out.push(w+'“has a ship / has none” must be yes or no.');
   if(c.kind==='zone'&&!ZONES.includes(c.zone))out.push(w+'choose Friendly, Neutral or Hostile.');});
  return out;}
 /* The copy the game runs (defaults filled, nothing unknown). */
 function strip(only){return (Array.isArray(only)?only:[]).slice(0,MAX).filter(c=>obj(c)&&IDS.includes(c.kind)).map(c=>{const x={kind:c.kind};for(const k of KEYS[c.kind])if(k!=='kind'&&c[k]!=null)x[k]=c[k];
  if(c.kind==='alone'&&x.crowd==null)x.crowd=true;if(c.kind==='mission'&&x.done==null)x.done=true;if(c.kind==='flag'&&x.set==null)x.set=true;if(c.kind==='ship'&&x.has==null)x.has=true;return x;});}
 /* One condition now. q: {who (the default person: the walked-near person, else the giver), street (ms on the street clock), world, places (the event's own, or null)}. */
 function one(c,s,q){const W=q.world||null,f=(s&&s.story&&s.story.flags)||{},who=c.npc||q.who;
  try{switch(c.kind){
   case 'alone':{if(!W||!W.others)return false;const n=W.others(who,c.distance,c.crowd!==false);return n===0;}
   case 'players':{if(!W||!W.players)return false;const n=W.players(who,c.distance);return n===0;}
   case 'time':return num(q.street)&&between(c.from,c.to,streetMinute(q.street));
   case 'place':{const p=q.places||(W&&W.places?W.places():null);return Array.isArray(p)&&p.includes(c.place);}
   case 'mission':{const r=s&&s.universe&&s.universe.missions&&s.universe.missions[c.mission];return (!!r&&r.completed===true)===(c.done!==false);}
   case 'flag':{const v=f[c.flag];return (v!==undefined&&v!==null&&v!==false)===(c.set!==false);}
   case 'credits':return (Number(s&&s.credits)||0)>=c.amount;
   case 'ship':return (f.shipAccess!=='none')===(c.has!==false);
   case 'on-foot':return !!(W&&W.onFoot&&W.onFoot()===true);
   case 'holstered':return !!(W&&W.drawn&&W.drawn()===false);
   case 'zone':return !!(W&&W.zone&&(W.zone()||null)===c.zone);}}catch{return false;}
  return false;}
 /* Every condition now: {ok, each:[{kind, ok}]}. An empty list is ok. */
 function check(only,s,q={}){const each=(only||[]).map(c=>({kind:c&&c.kind,ok:!!c&&one(c,s,q)}));return {ok:each.every(x=>x.ok),each};}
 /* Plain English, for the editor: "no other people are within 6 m of the Tea Room Host". names: {person(id), place(id), mission(id)} -> display names. */
 const D=v=>{const U=root.VoidUnits;return U?U.fmtDist(v):v+' m';};   // the distance as the owner reads it (feet, units.js); the data stays in metres
 function words(c,names={},who){const P=id=>(names.person?names.person(id):id)||id||'the giver',p=c.npc||who;
  switch(c&&c.kind){
   case 'alone':return 'no other '+(c.crowd===false?'placed people':'people')+' are within '+D(c.distance)+' of '+P(p);
   case 'players':return 'no other players are within '+D(c.distance)+' of '+P(p);
   case 'time':return 'the street clock is between '+(c.from||'?')+' and '+(c.to||'?');
   case 'place':return 'the player is in '+(c.place?(names.place?names.place(c.place):c.place):'(choose a place)');
   case 'mission':return '“'+(c.mission?(names.mission?names.mission(c.mission):c.mission):'(choose a mission)')+'” is '+(c.done===false?'not finished yet':'finished');
   case 'flag':return 'the story flag '+(c.flag||'(name)')+' is '+(c.set===false?'not set':'set');
   case 'credits':return 'the player has at least '+c.amount+' credits';
   case 'ship':return c.has===false?'the player has no ship':'the player has a ship';
   case 'on-foot':return 'the player is on foot (not in a taxi or a ship)';
   case 'holstered':return 'the player’s weapon is holstered';
   case 'zone':return 'the player is in a '+String(c.zone||'?').toUpperCase()+' zone';}
  return '(an unknown condition)';}
 /* The trigger in words: "when you walk within 4 m of the Tea Room Host". */
 function triggerWords(m,names={}){const st=(m&&m.start)||{how:'person'},w=st.when||{},P=id=>(names.person?names.person(id):id)||id||'the giver',M=id=>names.mission?names.mission(id):id,PL=id=>names.place?names.place(id):id;
  if(st.how!=='notification')return 'when the player talks to '+P(m&&m.giver);
  switch(w.kind){case 'near':return 'when you walk within '+D(num(w.distance)?w.distance:5)+' of '+P(w.npc||(m&&m.giver));case 'pod-exit':return 'when the player leaves the Sleeping Pod';
   case 'after-mission':return 'when “'+M(w.mission||'?')+'” is finished';case 'game-time':return (w.value||'?')+' in-game minutes after “'+M(w.mission||'?')+'” is finished';
   case 'place':return 'when the player enters '+PL(w.place||'?');case 'leave':return 'when the player leaves '+PL(w.place||'?');case 'flag':return 'when the story flag '+(w.flag||'?')+' is '+String(w.value===undefined?true:w.value);}
  return 'when its trigger happens';}
 /* "Starts when you walk within 4 m of the Tea Room Host, and only when no other people are within 6 m of him." */
 function sentence(m,names={}){const st=(m&&m.start)||{},w=st.when||{},who=st.how==='notification'&&w.kind==='near'?w.npc||m.giver:m&&m.giver,l=list(st);
  let t='Starts '+triggerWords(m,names);if(l){const parts=l.map(c=>words(c,names,who));t+=', and only when '+(parts.length>1?parts.slice(0,-1).join(', ')+' and '+parts[parts.length-1]:parts[0]);}
  if(l&&st.how!=='notification')t+='. If they are not true when the player talks, the offer waits for the next talk';else if(l)t+='. If they are not true at that moment, it waits and starts as soon as they are';
  return t+'.';}
 const api={KINDS,IDS,KEYS,MAX,DIST,PDIST,CREDITS,ZONES,HHMM,minutes,between,streetMinute,oneShot,list,needsWorld,fresh,problems,strip,one,check,words,triggerWords,sentence};
 if(node)module.exports=api;else root.VoidStartConditions=api;
})(globalThis);
