/* BEHAVIOUR RECIPES FROM CHATGPT (pure data and rules: browser and Node tests; no network, no DOM). The owner, 18 Nov 2026 (queue item 1): a "Copy ChatGPT prompt"
   button and a "Paste behaviour" box, so he can say in words what an NPC should do and ChatGPT writes it; plus daily schedules by in-game hour.
   SAFETY: what ChatGPT writes is a RECIPE, never code. It is read with JSON.parse only (never eval, Function, innerHTML or a script tag), checked field by field against
   the schema below (unknown fields, places off her pavement, actions she may not do, too many steps and bad times are all refused, with a plain fix-it message), and then
   turned into the same placement the route editor makes (content.npcs[id], npc-paths.js) and checked again by npc-paths.js planProblems (and by the server when published).
   Nothing in a recipe is ever run: its strings are only compared with fixed lists (place names, action ids, times).
   THE RECIPE (version 1):
     {"recipe":"void-runner-npc-behaviour", "version":1, "npc":"grey-reverie",
      "allDay":   ACTIVITY                       what she does outside every time block (optional: her usual thing)
      "schedule": [ {"from":"08:00", "to":"12:00", "name":"Morning walk", ...ACTIVITY}, ... ]   (optional: up to 8 blocks on the in-game 24-hour clock)}
     ACTIVITY: {"do":"usual"}                                         her own routine
               {"do":"stay", "at":PLACE, "face":"road", "actions":["idle","look"]}   stand at one spot, doing the actions in turn
               {"do":"route", "points":[{"at":PLACE, "action":"look", "seconds":5}, ...]}   walk the points in order, round and round
     PLACE: a named place ("laundry", "ledge-reverie", "oldtown-alley-mouth", ...) or {"x":104.5, "z":-6.4} anywhere walkable in the city's areas (npc-areas.js, 19 Nov 2026:
     the Avenue, Old Town, Far South, the Outskirts, the Port, inside the District; never Milked, NULL, the District bar or the VR area). A route stays in one area.
   Reverie and Lace keep their 12-hour real-time street shift: a schedule only says what she does while she is out. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const X=()=>node?require('./npc-paths.js'):root.VoidNPCPaths;
 const KIND='void-runner-npc-behaviour',VERSION=1,MAX_TEXT=20000;
 const TOP=['recipe','version','npc','allDay','schedule'];
 const ACT_KEYS={usual:['do'],stay:['do','at','face','actions'],route:['do','points']};
 const BLOCK_EXTRA=['from','to','name'];
 const POINT_KEYS=['at','action','seconds'];
 const FACE={shops:0,north:0,n:0,road:Math.PI,street:Math.PI,south:Math.PI,s:Math.PI,east:Math.PI/2,e:Math.PI/2,west:-Math.PI/2,w:-Math.PI/2};
 // Anything that looks like program code, anywhere in the paste: refused outright (the recipe is data; the editor never runs anything).
 const CODE=/<\s*\/?\s*script|javascript\s*:|\beval\s*\(|\bnew\s+Function\b|\bFunction\s*\(|\bfunction\s*[\w$]*\s*\(|=>|\brequire\s*\(|\bimport\s*\(|\bimport\s+[\w{*]|\bdocument\s*\.|\bwindow\s*\.|\bglobalThis\b|\blocalStorage\b|\bfetch\s*\(|\bsetTimeout\s*\(|\bsetInterval\s*\(|\bon[a-z]+\s*=|__proto__|\bconstructor\b|\bprototype\b/i;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const isObj=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
 const r1=v=>Math.round(v*10)/10;
 const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 /* Named places for NPC id: the ledges on the Avenue (to sit on), and the named spots of every area she may be placed in (npc-areas.js places: shopfronts and landmarks;
    the Avenue's north pavement keeps its first names). [{id, name, area, x, z, ledge}] */
 const AR=()=>node?require('./npc-areas.js'):root.VoidNPCAreas;
 function places(id){const P=X(),M=P.MOVABLE[id];if(!M)return [];const d=P.mapData('avenue'),out=[],seen=new Set();
  const add=(pid,name,area,x,z,ledge)=>{if(!pid||seen.has(pid))return;const p={x:r1(x),z:r1(z)};if(P.spotProblems(id,p).length)return;seen.add(pid);out.push({id:pid,name,area,x:p.x,z:p.z,ledge:!!ledge});};
  for(const l of d.ledges)add(l.id,'the ledge '+(l.id==='ledge-reverie'?'by the laundry (her usual seat)':l.id==='ledge-laundry'?'east of the laundry':l.id==='ledge-repair'?'west of the laundry':'at x '+l.x)+' (The Avenue)','avenue',l.x,l.front-.4,true);
  for(const q of AR().places())add(q.id,q.name,q.area,q.x,q.z,false);
  add('west-end','the west end of the north pavement (by the Function Gate, The Avenue)','avenue',13.5,-6.6,false);add('east-end','the east end of the north pavement (by the East Gate, The Avenue)','avenue',140.5,-6.6,false);
  if(d.stretch)add('her-stretch','the middle of her usual stretch (The Avenue)','avenue',(d.stretch.x0+d.stretch.x1)/2,-6.6,false);
  return out;}
 /* Find the JSON in a paste: a ```json fence if there is one, else the first {...} (strings and escapes respected). {ok, json, error} */
 function extract(text){if(typeof text!=='string'||!text.trim())return {ok:false,error:'The box is empty. Paste ChatGPT’s whole answer (or just its JSON) into it.'};
  if(text.length>MAX_TEXT)return {ok:false,error:'That is too long for a recipe ('+text.length+' characters; '+MAX_TEXT+' at most). Paste only the JSON part of ChatGPT’s answer.'};
  if(CODE.test(text))return {ok:false,code:true,error:'This looks like program code, which the editor never runs. Ask ChatGPT again: “Only the JSON behaviour recipe, no code.” Then paste its answer here.'};
  const fence=/```(?:json|JSON)?\s*\n?([\s\S]*?)```/.exec(text),src=fence?fence[1]:text,start=src.indexOf('{');
  if(start<0)return {ok:false,error:'No recipe found: a recipe starts with { and ends with }. Ask ChatGPT for “the JSON behaviour recipe”.'};
  let depth=0,inStr=false,esc=false,end=-1;
  for(let i=start;i<src.length;i++){const c=src[i];if(inStr){if(esc)esc=false;else if(c==='\\')esc=true;else if(c==='"')inStr=false;continue;}
   if(c==='"')inStr=true;else if(c==='{')depth++;else if(c==='}'){depth--;if(!depth){end=i;break;}}}
  if(end<0)return {ok:false,error:'The recipe is cut off: it has more { than }. Copy ChatGPT’s whole answer again (the last line should be a }).'};
  let json;try{json=JSON.parse(src.slice(start,end+1));}catch(e){const m=/position (\d+)/.exec(e&&e.message||''),at=m?' near “'+src.slice(start,end+1).slice(Math.max(0,+m[1]-15),+m[1]+15).replace(/\s+/g,' ')+'”':'';
   return {ok:false,error:'The recipe is not valid JSON'+at+'. Usual causes: a missing comma or quote, or a comment. Ask ChatGPT to “fix the JSON”, or check that spot.'};}
  if(!isObj(json))return {ok:false,error:'The recipe must be one { … } object.'};
  return {ok:true,json};}
 /* Normalise a time: "8:00" -> "08:00"; null if it is not a 24-hour time. */
 function time(t){if(typeof t!=='string')return null;const m=/^\s*(\d{1,2}):(\d{2})\s*$/.exec(t);if(!m)return null;const h=+m[1],mi=+m[2];if(h>23||mi>59)return null;return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0');}
 /* Check a parsed recipe for NPC id and turn it into a placement. ctx: {anims} (her added animations, kept). Returns {ok, problems:[plain words], plan, summary}. */
 function validate(json,id,ctx={}){const P=X(),M=P.MOVABLE[id],probs=[],add=t=>{if(probs.length<40)probs.push(t);};
  if(!M)return {ok:false,problems:['This NPC cannot be moved by the editor yet, so it cannot take a behaviour recipe.']};
  if(!isObj(json))return {ok:false,problems:['The recipe must be one { … } object.']};
  const extra=Object.keys(json).filter(k=>!TOP.includes(k));if(extra.length)add('Unknown field'+(extra.length>1?'s':'')+' at the top: '+extra.map(k=>'“'+k+'”').join(', ')+'. Remove '+(extra.length>1?'them':'it')+' (only recipe, version, npc, allDay and schedule are allowed).');
  if(json.recipe!==KIND)add('“recipe” must be "'+KIND+'".');
  if(json.version!==VERSION)add('“version” must be '+VERSION+'.');
  if(json.npc!==id){const who=Object.entries(P.MOVABLE).find(([k])=>k===json.npc);add(who?'This recipe is for '+who[1].name+', but you are editing '+M.name+'. Open '+who[1].name+' in the list, or change “npc” to "'+id+'".':'“npc” must be "'+id+'" ('+M.name+').');}
  if(!own(json,'allDay')&&!own(json,'schedule'))add('The recipe says nothing for her to do: give it “allDay”, “schedule” or both.');
  const anims=Array.isArray(ctx.anims)?ctx.anims.filter(a=>typeof a==='string'):[],acts=P.actionsFor(id,anims),actIds=new Set(acts.map(a=>a.id)),pl=places(id),byId=new Map(pl.map(p=>[p.id,p]));
  const actList=acts.map(a=>a.id).join(', ');
  const spot=(at,where)=>{if(typeof at==='string'){const p=byId.get(at.trim().toLowerCase());if(!p){add(where+'there is no place called “'+at.slice(0,40)+'”. Use one of: '+pl.map(q=>q.id).join(', ')+', or {"x": …, "z": …}.');return null;}return {x:p.x,z:p.z};}
   if(isObj(at)){const k=Object.keys(at).filter(q=>q!=='x'&&q!=='z');if(k.length){add(where+'a place has only "x" and "z" (remove '+k.map(q=>'“'+q+'”').join(', ')+').');return null;}
    if(typeof at.x!=='number'||typeof at.z!=='number'||!Number.isFinite(at.x)||!Number.isFinite(at.z)){add(where+'"x" and "z" must be numbers (metres).');return null;}
    const p={x:r1(at.x),z:r1(at.z)},why=P.spotProblems(id,p);if(why.length){add(where+'x '+p.x+', z '+p.z+' is not somewhere she can be: '+why[0].replace(/^That is /,'it is ')+' Use a place from the list, or a spot inside one of the areas’ rectangles.');return null;}return p;}
   add(where+'"at" must be a place name or {"x": …, "z": …}.');return null;};
  const act=(o,where)=>{if(!isObj(o)){add(where+'must be an object like {"do":"stay", …}.');return null;}
   const kind=o.do;if(!own(ACT_KEYS,kind)||typeof kind!=='string'){add(where+'"do" must be "usual", "stay" or "route".');return null;}
   const allowed=[...ACT_KEYS[kind],...(where.startsWith('Time block')?BLOCK_EXTRA:[])],bad=Object.keys(o).filter(k=>!allowed.includes(k));
   if(bad.length){add(where+'unknown field'+(bad.length>1?'s':'')+' '+bad.map(k=>'“'+k+'”').join(', ')+' for "do":"'+kind+'". Allowed: '+allowed.join(', ')+'.');return null;}
   if(kind==='usual')return {mode:'original'};
   if(kind==='stay'){const p=spot(o.at,where);let yaw=Math.PI;if(o.face!=null){if(typeof o.face==='string'&&own(FACE,o.face.toLowerCase()))yaw=FACE[o.face.toLowerCase()];else add(where+'"face" must be "road", "shops", "east" or "west".');}
    const L=P.LIMIT.actions;if(!Array.isArray(o.actions)||o.actions.length<L[0]||o.actions.length>L[1]){add(where+'"actions" must be a list of '+L[0]+' to '+L[1]+' actions.');return null;}
    for(const a of o.actions)if(typeof a!=='string'||!actIds.has(a)||a==='walk-on')add(where+'she cannot do “'+String(a).slice(0,40)+'” at a spot. Allowed: '+acts.filter(x=>x.id!=='walk-on').map(x=>x.id).join(', ')+'.');
    if(!p)return null;return {mode:'stay',x:p.x,z:p.z,yaw:Math.round(yaw*100)/100,actions:o.actions.filter(a=>typeof a==='string')};}
   const L=P.LIMIT.points;if(!Array.isArray(o.points)||o.points.length<L[0]||o.points.length>L[1]){add(where+'a route needs '+L[0]+' to '+L[1]+' points'+(Array.isArray(o.points)?' (this one has '+o.points.length+')':'')+'.');return null;}
   const pts=[];o.points.forEach((q,i)=>{const pw=where+'point '+(i+1)+': ';if(!isObj(q)){add(pw+'must be an object like {"at":"laundry","action":"look","seconds":5}.');return;}
    const bad=Object.keys(q).filter(k=>!POINT_KEYS.includes(k));if(bad.length){add(pw+'unknown field'+(bad.length>1?'s':'')+' '+bad.map(k=>'“'+k+'”').join(', ')+' (allowed: at, action, seconds).');return;}
    const p=spot(q.at,pw);if(typeof q.action!=='string'||!actIds.has(q.action)){add(pw+'she cannot do “'+String(q.action).slice(0,40)+'”. Allowed: '+actList+'.');return;}
    let sec=q.seconds;if(q.action==='walk-on')sec=Number.isInteger(sec)?sec:1;else if(!Number.isInteger(sec)||sec<P.LIMIT.seconds[0]||sec>P.LIMIT.seconds[1]){add(pw+'"seconds" must be a whole number from '+P.LIMIT.seconds[0]+' to '+P.LIMIT.seconds[1]+'.');return;}
    if(p)pts.push({x:p.x,z:p.z,action:q.action,seconds:Math.max(1,Math.min(120,sec))});});
   if(pts.length===o.points.length){const ids=[...new Set(pts.map(q=>AR().areaOf(q)).filter(Boolean))];if(ids.length>1){add(where+'a route stays in one area, but this one has points in '+ids.map(a=>AR().get(a).name).join(' and ')+'. Use a time block for each area.');return null;}}
   return pts.length===o.points.length?{mode:'path',points:pts}:null;};
  let base={mode:'original'};if(own(json,'allDay')){const b=act(json.allDay,'All day: ');if(b)base=b;}
  let sched=null;
  if(own(json,'schedule')){const S=json.schedule;if(!Array.isArray(S))add('“schedule” must be a list of time blocks: [ {"from":"08:00","to":"12:00", …}, … ].');
   else if(S.length>P.LIMIT.blocks)add('A schedule has '+P.LIMIT.blocks+' time blocks at most (this one has '+S.length+'). Merge some of them.');
   else{sched=[];S.forEach((b,i)=>{const label=isObj(b)&&time(b.from)&&time(b.to)?' ('+time(b.from)+'–'+time(b.to)+')':'',w='Time block '+(i+1)+label+': ';
     if(!isObj(b)){add(w+'must be an object like {"from":"08:00","to":"12:00","do":"usual"}.');return;}
     const f=time(b.from),t=time(b.to);if(!f)add(w+'"from" must be a 24-hour time like "08:00" (not “'+String(b.from).slice(0,12)+'”).');if(!t)add(w+'"to" must be a 24-hour time like "12:00" (not “'+String(b.to).slice(0,12)+'”; use "00:00" for midnight).');
     if(b.name!=null&&(typeof b.name!=='string'||!P.NAME_OK.test(b.name.trim())))add(w+'"name" may use letters, numbers and simple punctuation only (40 at most).');
     const a=act(b,w);if(a&&f&&t)sched.push({from:f,to:t,...(typeof b.name==='string'&&b.name.trim()?{name:b.name.trim()}:{}),...a});});}}
  if(probs.length)return {ok:false,problems:probs};
  const plan=P.clean({...base,...(anims.length?{anims}:{}),...(sched&&sched.length?{schedule:sched}:{})})||{mode:'original'};
  const again=P.planProblems(id,plan);if(again.length)return {ok:false,problems:again.map(x=>x.replace(M.name+': ','')),plan};
  return {ok:true,problems:[],plan,summary:summary(id,plan)};}
 /* Paste -> {ok, problems, plan, summary}. */
 function read(text,id,ctx){const e=extract(text);if(!e.ok)return {ok:false,problems:[e.error],code:!!e.code};return validate(e.json,id,ctx);}
 /* Plain-words lines for a placement (preview). */
 function describe(id,a){const P=X(),acts=new Map(P.actionsFor(id,(a&&a.anims)||[]).map(x=>[x.id,x.name])),pl=places(id),near=(x,z)=>{const p=pl.find(q=>Math.hypot(q.x-x,q.z-z)<1.2);return p?p.name:'x '+x+', z '+z;};
  if(!a||a.mode==='original')return P.MOVABLE[id]&&P.MOVABLE[id].cat?'its usual thing (goes to whichever of Reverie and Lace is out)':'her usual thing (walks her stretch, sits on the ledges, the cat)';
  const low=t=>t.charAt(0).toLowerCase()+t.slice(1);
  if(a.mode==='stay')return 'stays at one spot ('+near(a.x,a.z)+') and does: '+a.actions.map(x=>low(acts.get(x)||x)).join(', then ');
  return 'walks a route of '+a.points.length+' points: '+a.points.map((q,i)=>(i+1)+'. '+near(q.x,q.z)+' — '+low(acts.get(q.action)||q.action)+(q.action==='walk-on'?'':' '+q.seconds+' s')).join('; ');}
 function summary(id,plan){const out=[];const sch=(plan&&plan.schedule)||[];
  out.push((sch.length?'Outside the times below: ':'All day: ')+describe(id,plan));
  for(const b of sch)out.push(b.from+'–'+b.to+(b.name?' “'+b.name+'”':'')+': '+describe(id,b));return out;}
 /* The prompt the owner pastes into ChatGPT: self-contained (the schema, her places and actions, the limits, two examples). */
 function examples(id){const pl=places(id),pick=k=>(pl.find(p=>p.id===k)||pl[0]).id,led=(pl.find(p=>p.ledge)||pl[0]).id,ids=X().actionsFor(id).map(a=>a.id),A=(want,alt)=>ids.includes(want)?want:alt;
  return [{recipe:KIND,version:VERSION,npc:id,allDay:{do:'usual'},schedule:[{from:'08:00',to:'12:00',name:'Morning walk',do:'route',points:[{at:pick('repair'),action:A('look','cat-look'),seconds:6},{at:pick('laundry'),action:A('scroll','cat-wander'),seconds:10},{at:pick('bio-clinic'),action:A('idle-shift','cat-sit'),seconds:5}]},
    {from:'12:00',to:'13:00',name:'Lunch on the ledge',do:'stay',at:led,face:'road',actions:[A('sit','cat-sit')]},{from:'20:00',to:'02:00',name:'Night watch',do:'stay',at:{x:118.5,z:-6.6},face:'road',actions:[A('idle','cat-sit'),A('look','cat-look'),A('scroll','cat-wander')]}]},
   {recipe:KIND,version:VERSION,npc:id,allDay:{do:'stay',at:pick('oldtown-alley-mouth'),face:'west',actions:[A('idle','cat-sit'),A('look','cat-look'),A('selfie','cat-wander')]}}];}
 function prompt(id,ctx={}){const P=X(),M=P.MOVABLE[id];if(!M)return '';const acts=P.actionsFor(id,ctx.anims||[]),pl=places(id),L=P.LIMIT,areas=AR().describe(),she=M.cat?'it':'she';
  const lines=[
   'You are helping me write a BEHAVIOUR RECIPE for '+M.name+', a character in my game. A behaviour recipe is DATA in JSON. It is never code.',
   '',
   'REPLY WITH ONLY ONE JSON OBJECT inside a ```json block. Do not write JavaScript, functions, HTML, comments or any other code. Do not add fields that are not listed below: the game refuses the whole recipe if it has unknown fields.',
   '',
   ...(M.cat?['WHO: the street cat (id "'+id+'") lives in NeoChinatown (a city). Its usual home is the north pavement of The Avenue. It is out day and night. It can only stand, sit, look about, potter about and walk (no other animations).']:
    ['WHO: '+M.name+' (id "'+id+'") is an ordinary street resident of NeoChinatown. Her usual routine is on the north pavement of The Avenue, but she can be placed anywhere listed under AREAS. She only does casual, everyday things: nothing flirtatious, nothing from clubs, no smoking or drinking.',
     'HER SHIFT: she is out for 12 real hours a day (the game decides that). Your recipe only says what she does WHILE she is out.']),
   'THE CLOCK: the game has its own 24-hour clock (an in-game day passes in 2 hours of play). Times are written "HH:MM", e.g. "08:00", "13:30", "00:00".',
   '',
   'THE RECIPE (version 1):',
   '{',
   '  "recipe": "'+KIND+'",',
   '  "version": 1,',
   '  "npc": "'+id+'",',
   '  "allDay": ACTIVITY,        (optional) what '+she+' does at every time NOT covered by a time block. Leave it out for the usual routine.',
   '  "schedule": [ BLOCK, ... ]  (optional) up to '+L.blocks+' time blocks',
   '}',
   'BLOCK = ACTIVITY plus "from": "HH:MM", "to": "HH:MM" and an optional "name" (letters, numbers and simple punctuation, 40 characters at most).',
   '  A block may run past midnight ("from": "20:00", "to": "02:00"). Blocks must not overlap. Each block lasts at least '+L.blockMin+' minutes.',
   'ACTIVITY is one of:',
   '  {"do": "usual"}   the usual routine ('+(M.cat?'goes to whichever of Reverie and Lace is out':'walks her stretch of The Avenue, sits on the ledges, plays with the cat')+')',
   '  {"do": "stay", "at": PLACE, "face": "road" | "shops" | "north" | "south" | "east" | "west", "actions": [ACTION, ...]}   '+she+' stands at one spot and does the actions in turn (a few seconds each); '+L.actions[0]+' to '+L.actions[1]+' actions; "face" is optional (default "road", which is south)',
   '  {"do": "route", "points": [ {"at": PLACE, "action": ACTION, "seconds": N}, ... ]}   '+she+' walks the points in order, does each point\'s action for N seconds (a whole number from '+L.seconds[0]+' to '+L.seconds[1]+'), then starts again at the first point; '+L.points[0]+' to '+L.points[1]+' points',
   'PLACE is a place name from the PLACES list below, or {"x": number, "z": number} in metres (x grows to the east, z grows to the north) inside one of the AREAS rectangles.',
   'A STAY or a ROUTE is in ONE area: all points of a route must be in the same area (there is no walking through the gates). To be in another area at another time of day, use another time block: '+she+' appears there when that block starts.',
   'A straight walk between two route points must stay on walkable ground: it must not cross a road, a wall, a gate, or furniture. Points close together along one pavement are safest; a route round a corner needs a point at the corner.',
   '',
   'AREAS (where '+she+' may be; each is a list of walkable rectangles x0..x1, z0..z1 in metres):',
   ...areas.flatMap(a=>['  '+a.name+(a.inside?' (indoors)':'')+':',...a.walk.map(w=>'    '+w.name+': x '+w.x0+' to '+w.x1+', z '+w.z0+' to '+w.z1),...(a.never.length?['    never: '+a.never.join(', ')]:[])]),
   'NEVER (the owner\'s rule): Milked (the building), NULL (the nightclub), standing or waiting in NULL\'s doorway or Milked\'s front or rear doorway (within 1.5 m of each door; walking past is fine: the pavements in front of NULL and Milked, Milked\'s side street and its service alley are public, and so is the crosswalk by NULL; so are the narrow back alleys, lanes, loading bays and yards behind the housing in The Avenue, Old Town and Far South: the places named ...-alley, ...-lane, ...-bay and ...-yard, where dumpsters, crates, loading docks and the ground under the fire escapes are furniture), the District bar, the District VR area and arcade room, the District’s Sleeping Pod room (the players’ own pods), the Corporate District and the Temple. Roads (where taxis drive), the gates\' insides, walls and furniture are blocked too.',
   '',
   'PLACES (name: what it is, x, z):',
   ...pl.map(p=>'  '+p.id+': '+p.name+' (x '+p.x+', z '+p.z+')'+(p.ledge&&!M.cat?' — a ledge: she can "sit" here':'')),
   '',
   'ACTIONS '+she+' can do (use the id exactly):',
   ...acts.map(a=>'  '+a.id+': '+a.name+' — '+a.help+(a.id==='sit'?' Only at a ledge place.':'')+(a.id==='walk-on'?' Only in a route, not in a stay.':'')),
   '',
   'EXAMPLE 1 (a day with a schedule):',
   '```json',JSON.stringify(examples(id)[0],null,1),'```',
   'EXAMPLE 2 (stay at one place all day):',
   '```json',JSON.stringify(examples(id)[1],null,1),'```',
   '',
   'Now write the recipe for what I describe next. If something I ask for is not possible with the actions and places above, use the closest one and tell me in one short sentence BEFORE the JSON block.',
   '',
   'WHAT I WANT '+M.name.toUpperCase()+' TO DO: '];
  return lines.join('\n');}
 const api={KIND,VERSION,MAX_TEXT,TOP,ACT_KEYS,FACE,CODE,places,extract,time,validate,read,describe,summary,examples,prompt};
 if(node)module.exports=api;else root.VoidNPCBehaviour=api;
})(typeof globalThis!=='undefined'?globalThis:this);
