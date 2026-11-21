/* REUSABLE MISSION MECHANICS (20 Nov 2026, built for the owner's Awakening continuation: Missions 004-012). PURE RULES: no DOM, no network; runs in the browser and in
   Node (tests/mission-mechanics.test.cjs). mission-content.js runs these step kinds with the same tree engine as every other step; the game side is
   mission-mechanics-game.js (browser only); the server repeats the checks (void_runner_live_content.py mechanics_problems). Nothing here is mission-specific: every
   mission (the owner's own trees too) can use every piece through the Mission Editor.
   NEW STEP KINDS
     observe    {npc, near (m, default 10), hold (s, default 2), close? (m)}   done once the player has been within `near` of that person for `hold` seconds (and, with
                close, never closer than `close`: closer is "too close": they notice, the count starts again). npc: a mission cast member, a photo subject, or a giver.
     overhear   {npc, near (default 6), close? (default 1.5), say:[the conversation]}   EAVESDROP: while the player stays within `near` (and not within `close`) the
                conversation plays line by line as overheard subtitles; walking out of range pauses it (it picks up from the line it reached); coming too close: "THEY
                NOTICED YOU", it stops and starts again from its first line once the player backs off. Done when the last line has been heard. Retry is unlimited.
     sneak      {apt, mod?, object?}   STEALTH: reach that room (or use that object) of a location of this mission without being seen by its armed people (mission.combat
                .armed, best in a NEUTRAL room so they do not shoot). Seen: "SPOTTED", the player is put back outside the street door; the step stays (try again).
                `unseen:true` on apt-enter / apt-use / collect / apt-leave / hack steps applies the same rule while those steps are in progress.
                `onSpotted:'alarm'` on such a step (the owner, 21 Nov 2026, Mission 006's way out): seen, a guard shouts ("SPOTTED · get out of sight!") and the player has
                ALARM.grace seconds to break the line of sight; out of sight in time: the guards go back to their rounds and the step goes on; still seen: the armed
                people of that location turn hostile and shoot (zone-integration.js alarm), the player can shoot back or run; the step completes as usual (reaching the
                street alive) and being taken down is the mission's onDeath. spottedStep() is the state machine.
     collect    {evidence, apt?, mod?, object?}   EVIDENCE: the player copies an evidence item (mission.evidence) to the V1: the document window opens when the player uses
                that object (or straight after the step before it when no object is named) with COPY TO V1. The evidence is kept (story.flags.evidence) and listed
                in the V1 Mission Log under the mission. An unlock {kind:'evidence', id} gives one without a step.
     report     {npc, evidence?:[ids], place?, via?, say}   SEND / HAND OVER: the player presses REPORT TO <NPC> on the mission's card in the V1 Mission Log (only with
                every listed evidence item held, and only inside `place` when one is named: a hand-over in person). The lines are the reply: a Comms call (via
                'comms'), a message, or the conversation window (in person).
     call       {say (one NPC), via:'comms'|'messages'}   A CALLBACK: done by itself right after the step before it (with its `delay` in seconds: a timed callback); its
                lines arrive as an incoming Comms call (or a message) from that NPC.
     wait-game  {minutes}   A TIMED WAIT in IN-GAME minutes (game-clock.js: 12 in-game minutes a minute of play): counted from the moment it becomes the step in progress
                (story.flags tg_<mission>_<step>, removed when done), so the player can explore or play other missions meanwhile; a reload keeps it.
     feed       {feed, stage:'open'|'watched'|'recorded'|'saved'}   REMOTE SURVEILLANCE: a camera feed of this mission (mission.feeds, cult-room.js) watched through
                the V1: OPEN REMOTE FEED on the mission's card (and its notification). Each stage completes as the feed reaches it; a later stage also completes the
                earlier ones. Closing the game, a reload or a full Gallery never loses it: until the 'saved' stage is done the feed can be opened again.
     tail       {npc (a cast member with a route), near (lost beyond, default 25), close (noticed within, default 3)}   FOLLOW AT A DISTANCE: the person walks their
                route; the player keeps between `close` and `near`. Lost or noticed: they go back to the start of the route and the step starts again.
     apt-leave  {apt}   done while the player is outside that location (the street).
     flight     {stage:'board'|'launch'|'jump'|'dock', place?}   the existing flight: boarding the ship at the pad, take-off, the jump toward `place`, docking.
     v1-app     {app}   done when the player opens that app on the V1 (its tile glows in mission yellow: the step's `app`, device-v1.js). A tutorial step.
   NEW MISSION FIELDS
     cast       [{id, name?, model, place, x?, z?, y?, yaw?, clip?, from?, until?, route?, speed?}]   people placed for this mission only, in a named place (places.js
                id, e.g. under-tea-room) at its middle or at x / z (world metres): `model` a crowd model (crowd.js), `clip` what they do (idle, talk, sit ...), shown
                from step `from` until step `until` is done. Only the player doing the mission sees them (mission-instanced). The V1 camera identifies them
                (photo steps) and observe / overhear / tail steps use them. Editable in the Mission Editor (People for this mission).
     evidence   [{id, title, text, kind?}]   the documents / recordings a mission's steps hand out (the owner's text shown in the V1 when read). */
(function(root){
 'use strict';
 const KINDS=['observe','overhear','sneak','collect','report','feed','call','wait-game','tail','apt-leave','flight','v1-app'];
 const V1_APPS=['camera','gallery','messages','map','missions','comms','social','news','store','warflying','loadout'];   // mission-content.js STEP_APPS (device-v1.js)
 const AUTO=['call'];
 const UNSEEN_KINDS=['apt-enter','apt-use','collect','apt-leave','sneak','hack'];
 const FEED_STAGES=['open','watched','recorded','saved'],FLIGHT_STAGES=['board','launch','jump','dock'];
 const STEP_FIELDS=['minutes','stage','evidence','unseen','close','onSpotted'];
 const ON_SPOTTED=['alarm'],ALARM={grace:3,hide:.5};   // grace: seconds to get out of sight; hide: out of sight this long (in a row) counts as hidden
 const CAST_KEYS=['id','name','model','place','x','z','y','yaw','clip','from','until','route','speed'],EVIDENCE_KEYS=['id','title','text','kind'];
 const EV_KINDS=['document','recording','audio','photo'];
 const LIMIT={cast:8,evidence:12,title:60,text:1500,route:12,minutes:10080,store:200};
 const RANGE={near:[1,50],close:[.5,10],hold:[1,600],lost:[5,60],speed:[.4,3],xz:[-2000,2000],y:[-20,40]};
 const DEF={observe:{near:10,hold:2},overhear:{near:6,close:1.5},tail:{near:25,close:3,speed:1.25}};
 const CLIPS=['idle','talk','listen','sit','walk','look','watch','phone','lean','cheer','drink','floor-kneel','floor-cross','floor-knees'];
 // the floor poses (21 Nov 2026, crowd.js FLOOR): kneeling, cross-legged, knees to chest; only for a figure whose file has them (y: the cushion's or cot's top). CLIP_NAMES: the editor's words.
 const FLOOR_CLIPS=['floor-kneel','floor-cross','floor-knees'],CLIP_NAMES={'floor-kneel':'kneel on the floor (seiza)','floor-cross':'sit cross-legged','floor-knees':'sit, knees to chest'};
 const crowdClips=m=>{try{const C=typeof module!=='undefined'&&module.exports?require('./crowd.js'):root.VoidCrowd;return C&&C.clips?C.clips[m]||null:null;}catch{return null;}};
 const ID=/^[a-z][a-z0-9-]{0,39}$/,EV_ID=/^[a-z][a-z0-9-]{0,15}$/,MODEL=/^(npc-[a-z0-9-]{1,40}|marker)$/,TAGS=/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
 const num=(v,r)=>typeof v==='number'&&Number.isFinite(v)&&v>=r[0]&&v<=r[1];
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 const keysOk=(o,ks)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>ks.includes(k));
 const near=o=>num(o.near,RANGE.near)?o.near:(DEF[o.kind]||{}).near||10,close=o=>num(o.close,RANGE.close)?o.close:(DEF[o.kind]||{}).close||0,hold=o=>Number.isInteger(o.hold)&&o.hold>=1?Math.min(o.hold,RANGE.hold[1]):(DEF[o.kind]||{}).hold||2;
 const rank=st=>FEED_STAGES.indexOf(st);
 // ---------------------------------------------------------------- evidence kept in the save (one short story flag: ids separated by commas)
 const FLAG='evidence';
 const evidenceList=s=>String((s&&s.story&&s.story.flags&&s.story.flags[FLAG])||'').split(',').filter(x=>EV_ID.test(x));
 const hasEvidence=(s,id)=>evidenceList(s).includes(id);
 function addEvidence(s,id){if(!s||!s.story||!s.story.flags||!EV_ID.test(id||''))return false;const l=evidenceList(s);if(l.includes(id))return false;l.push(id);if(l.join(',').length>LIMIT.store)return false;s.story.flags[FLAG]=l.join(',');return true;}
 /* Every evidence item the trees define: id -> {mission, title, text, kind}. */
 function evidenceDefs(trees){const out={};for(const t of trees||[])for(const m of (t&&t.missions)||[])for(const e of (m&&m.evidence)||[])if(e&&EV_ID.test(e.id||'')&&!out[e.id])out[e.id]={...e,mission:m.id,kind:e.kind||'document'};return out;}
 // ---------------------------------------------------------------- checks (the server repeats them)
 const castIds=m=>new Set(((m&&m.cast)||[]).map(c=>c&&c.id).filter(Boolean));
 /* ctx: {places:Set?, subjects:Set?, givers:Map?, locations:Set?, evidence:Set (every evidence id of every tree), models:Set?} */
 function castProblems(m,ctx={}){const out=[],list=m&&m.cast;if(list==null)return out;if(!Array.isArray(list)||list.length>LIMIT.cast){out.push('people for this mission: at most '+LIMIT.cast+'.');return out;}
  const ids=new Set(),steps=(m.objectives||[]).map(o=>o&&o.id);
  for(const c of list){const w='person “'+((c&&c.id)||'?')+'”';if(!keysOk(c,CAST_KEYS)){out.push(w+' has unknown fields.');continue;}
   if(!ID.test(c.id||''))out.push(w+': the id is lowercase letters, digits and hyphens.');else if(ids.has(c.id))out.push(w+': two people have the same id.');ids.add(c.id);
   if(c.name!=null&&!plain(c.name,40))out.push(w+': the name is plain text (40 characters at most).');
   if(!MODEL.test(c.model||'')||(ctx.models&&c.model!=='marker'&&!ctx.models.has(c.model)))out.push(w+': choose a figure the game has (a crowd model).');
   if(typeof c.place!=='string'||!c.place||(ctx.places&&!ctx.places.has(c.place)))out.push(w+': choose the place they stand in.');
   for(const k of ['x','z'])if(c[k]!=null&&!num(c[k],RANGE.xz))out.push(w+': '+k+' is a number of metres.');if((c.x==null)!==(c.z==null))out.push(w+': give both x and z, or neither (the middle of the place).');
   if(c.y!=null&&!num(c.y,RANGE.y))out.push(w+': y is a number of metres.');if(c.yaw!=null&&!num(c.yaw,[-7,7]))out.push(w+': the way they face is a number (radians).');
   if(c.clip!=null&&!CLIPS.includes(c.clip))out.push(w+': what they do must be one of: '+CLIPS.join(', ')+'.');
   else if(FLOOR_CLIPS.includes(c.clip)&&c.model!=='marker'){const have=crowdClips(c.model);if(have&&!have.includes(c.clip))out.push(w+': this figure has no “'+CLIP_NAMES[c.clip]+'” pose (choose another figure or what they do).');}
   for(const k of ['from','until'])if(c[k]!=null&&!steps.includes(c[k]))out.push(w+': “'+k+'” must be a step of this mission.');
   if(c.from!=null&&c.until!=null&&steps.indexOf(c.until)<steps.indexOf(c.from))out.push(w+': they must appear before they go.');
   if(c.route!=null&&(!Array.isArray(c.route)||c.route.length<2||c.route.length>LIMIT.route||c.route.some(p=>!Array.isArray(p)||p.length!==2||!num(p[0],RANGE.xz)||!num(p[1],RANGE.xz))))out.push(w+': a route is 2 to '+LIMIT.route+' points [x, z] in metres.');
   if(c.speed!=null&&!num(c.speed,RANGE.speed))out.push(w+': walking speed is '+RANGE.speed[0]+' to '+RANGE.speed[1]+' m/s.');}
  return out;}
 function evidenceProblems(m){const out=[],list=m&&m.evidence;if(list==null)return out;if(!Array.isArray(list)||list.length>LIMIT.evidence){out.push('evidence: at most '+LIMIT.evidence+' items.');return out;}const ids=new Set();
  for(const e of list){const w='evidence “'+((e&&e.id)||'?')+'”';if(!keysOk(e,EVIDENCE_KEYS)){out.push(w+' has unknown fields.');continue;}
   if(!EV_ID.test(e.id||''))out.push(w+': the id is lowercase letters, digits and hyphens (16 at most).');else if(ids.has(e.id))out.push(w+': two items have the same id.');ids.add(e.id);
   if(!plain(e.title,LIMIT.title))out.push(w+': it needs a title (plain text, '+LIMIT.title+' characters at most).');
   if(!plain(e.text,LIMIT.text))out.push(w+': it needs its text (plain text, '+LIMIT.text+' characters at most).');
   if(e.kind!=null&&!EV_KINDS.includes(e.kind))out.push(w+': the kind is one of '+EV_KINDS.join(', ')+'.');}
  return out;}
 const locOf=(m,id)=>((m&&m.apartments)||[]).find(a=>a&&a.id===id)||null;
 const modsOf=a=>Array.isArray(a&&a.modules)?a.modules.map(x=>x&&x.id):null;
 /* The checks of one step of a new kind (and of `unseen` / `minutes` / `stage` / `evidence` / `close` on any step). speakerOk(id): a known speaker. */
 function stepProblems(m,o,ctx={},speakerOk=()=>true){const out=[],k=o&&o.kind,cast=castIds(m),who=id=>typeof id==='string'&&(cast.has(id)||(ctx.subjects&&ctx.subjects.has(id))||speakerOk(id));
  if(o.unseen!=null&&(o.unseen!==true||!UNSEEN_KINDS.includes(k)))out.push('“without being seen” is only for a go into / use / collect / leave / sneak / hack step.');
  if(o.onSpotted!=null&&(!ON_SPOTTED.includes(o.onSpotted)||!(o.unseen===true||k==='sneak')))out.push('“they shout, then open fire” is only for a step done without being seen.');
  if(o.minutes!=null&&k!=='wait-game')out.push('only an in-game wait has minutes.');if(o.stage!=null&&k!=='feed'&&k!=='flight')out.push('only a camera feed or a flight step has a stage.');
  if(o.evidence!=null&&k!=='collect'&&k!=='report')out.push('only a collect or report step names evidence.');if(o.close!=null&&!['observe','overhear','tail'].includes(k))out.push('only an observe, overhear or follow-at-a-distance step has a “too close” distance.');
  if(!KINDS.includes(k))return out;
  const apt=()=>{const a=locOf(m,o.apt);if(!a){out.push('choose a place of this mission.');return null;}const ms=modsOf(a);if(o.mod!=null&&(!ms||!ms.includes(o.mod)))out.push('“'+o.mod+'” is not a room of that place.');return a;};
  if(k==='observe'||k==='overhear'||k==='tail'){if(!who(o.npc))out.push('choose who (someone placed for this mission, someone the camera can identify, or a known NPC).');
   if(o.near!=null&&!num(o.near,k==='tail'?RANGE.lost:RANGE.near))out.push(k==='tail'?'“lost beyond” is 5 to 60 metres.':'the distance is 1 to 50 metres.');
   if(o.close!=null&&!num(o.close,RANGE.close))out.push('“too close” is 0.5 to 10 metres.');else if(close(o)>=near(o))out.push('“too close” must be less than the distance.');
   if(k==='observe'&&o.hold!=null&&!(Number.isInteger(o.hold)&&o.hold>=1&&o.hold<=600))out.push('observe for a whole number of seconds from 1 to 600.');
   if(k==='overhear'){if(!Array.isArray(o.say)||!o.say.length)out.push('write the conversation the player overhears.');else if(o.say.some(l=>l&&l.who==='You'))out.push('the player says nothing while eavesdropping.');}
   if(k==='tail'){const c=(m.cast||[]).find(x=>x&&x.id===o.npc);if(!c||!Array.isArray(c.route))out.push('follow at a distance needs someone placed for this mission with a route.');}
   if(k!=='overhear'&&o.say!=null&&k!=='observe')out.push('this step has no lines.');if(o.via!=null)out.push('this step has no Comms call or message.');}
  else if(k==='sneak'){apt();if(o.object!=null&&typeof o.object!=='string')out.push('choose the thing to reach.');}
  else if(k==='apt-leave')apt();
  else if(k==='collect'){const ids=new Set(((m.evidence)||[]).map(e=>e&&e.id));if(!ids.has(o.evidence))out.push('choose an evidence item of this mission.');if(o.apt!=null)apt();}
  else if(k==='report'){if(typeof o.npc!=='string'||o.npc==='You'||!speakerOk(o.npc))out.push('choose who the report goes to.');
   if(o.evidence!=null&&(!Array.isArray(o.evidence)||o.evidence.length>LIMIT.evidence*2||o.evidence.some(id=>!EV_ID.test(id||'')||(ctx.evidence&&!ctx.evidence.has(id)))))out.push('the evidence to send must be items the missions hand out.');
   if(o.place!=null&&(typeof o.place!=='string'||(ctx.places&&!ctx.places.has(o.place))))out.push('unknown place "'+o.place+'".');}
  else if(k==='call'){const say=o.say||[];if(!say.length||say.some(l=>!l||l.who==='You'||l.who!==say[0].who))out.push('a call needs its lines, all from one NPC.');if(o.via!=='comms'&&o.via!=='messages')out.push('a call comes as a Comms call or a message.');}
  else if(k==='wait-game'){if(!(Number.isInteger(o.minutes)&&o.minutes>=1&&o.minutes<=LIMIT.minutes))out.push('an in-game wait is a whole number of in-game minutes from 1 to 10080 (a week).');if(o.say!=null||o.via!=null)out.push('an in-game wait has no lines (add a call after it).');}
  else if(k==='feed'){if(!((m.feeds)||[]).some(f=>f&&f.id===o.feed))out.push('choose a camera feed of this mission.');if(!FEED_STAGES.includes(o.stage))out.push('choose the stage: opened, watched to the end, recorded or saved.');}
  else if(k==='v1-app'){if(!V1_APPS.includes(o.app))out.push('choose the V1 app the player opens.');}
  else if(k==='flight'){if(!FLIGHT_STAGES.includes(o.stage))out.push('choose the stage: board, take off, jump or dock.');if(o.place!=null&&(typeof o.place!=='string'||(ctx.locations&&!ctx.locations.has(o.place))))out.push('"'+o.place+'" is not a place a ship can fly to.');}
  return out;}
 // ---------------------------------------------------------------- what the engine asks
 /* Is the event the one that completes this step? (mission-content.js hit) */
 function hit(ev,m,o,s){const key=m.id+'/'+o.id,k=o.kind;
  if(k==='observe'||k==='overhear'||k==='tail'||k==='collect'||k==='report')return ev.type===k&&ev.step===key&&(k!=='report'||(o.evidence||[]).every(id=>hasEvidence(s,id)));
  if(k==='sneak')return o.object!=null?ev.type==='apt-use'&&ev.mission===m.id&&ev.apt===o.apt&&ev.object===o.object&&(o.mod==null||ev.mod===o.mod):ev.type==='place'&&ev.apt===m.id+'/'+o.apt&&(o.mod==null||ev.mod===o.mod);
  if(k==='apt-leave')return ev.type==='place'&&ev.apt!==m.id+'/'+o.apt;
  if(k==='feed')return ev.type==='feed-stage'&&ev.mission===m.id&&ev.feed===o.feed&&rank(ev.stage)>=rank(o.stage);
  if(k==='wait-game')return ev.type==='game-wait'&&ev.step===key;
  if(k==='v1-app')return ev.type==='v1-app'&&ev.app===o.app;
  if(k==='flight')return ev.type==='flight'&&ev.stage===o.stage&&(o.place==null||ev.place==null||ev.place===o.place);
  return false;}
 const waitFlag=(mid,sid)=>'tg_'+String(mid).slice(0,40)+'_'+String(sid).slice(0,18);
 /* An in-game wait: stamps its start the first time it is the step in progress; {left: in-game minutes still to wait, due}. minutesNow: game-clock.js minutes(s). */
 function gameWait(s,m,o,minutesNow){const f=s.story.flags,k=waitFlag(m.id,o.id);if(!Number.isSafeInteger(f[k]))f[k]=minutesNow;const left=Math.max(0,o.minutes-(minutesNow-f[k]));return {flag:k,left,due:left<=0};}
 /* Who of a mission's cast is there now: the step in progress (index i; -1 before it starts; objectives.length when done). */
 function castVisible(m,i){const steps=(m.objectives||[]).map(o=>o.id);return ((m&&m.cast)||[]).filter(c=>{const a=c.from!=null?steps.indexOf(c.from):0,b=c.until!=null?steps.indexOf(c.until):steps.length;return i>=a&&i<=b&&i<steps.length;});}
 /* One overheard conversation's progress (the game keeps it per step; pure so it is tested): st {line, at, noticed}; inp {d (metres to the speaker), dt (s), near, close,
    lines (count), secs(i) (how long line i shows)}. Returns {st, show (line index to show or -1), done, noticed (just now)}. */
 function overhearStep(st,inp){st=st||{line:0,at:0,noticed:0};const out={st,show:-1,done:false,noticed:false};const d=inp.d;
  if(st.noticed>0){st.noticed=Math.max(0,st.noticed-inp.dt);if(!(Number.isFinite(d)&&d<=inp.close))st.noticed=Math.min(st.noticed,4);return out;}
  if(!Number.isFinite(d)||d>inp.near)return out;   // out of range: paused where it was
  if(inp.close>0&&d<inp.close){st.line=0;st.at=0;st.noticed=6;out.noticed=true;return out;}
  st.at+=inp.dt;out.show=st.line;if(st.at>=inp.secs(st.line)){st.line++;st.at=0;if(st.line>=inp.lines){out.done=true;out.show=-1;}}return out;}
 /* How long an overheard line shows (seconds): a reading pace, 2.5 s at least. */
 const lineSecs=t=>Math.max(2.5,1.2+String(t||'').length*.06);
 /* A watched / followed person (observe, tail): st {t (seconds counted), seg, u (progress), noticed}; returns {st, done, reset, why}. */
 function observeStep(st,inp){st=st||{t:0};const d=inp.d;if(!Number.isFinite(d)||d>inp.near){st.t=0;return {st,done:false};}if(inp.close>0&&d<inp.close){st.t=0;return {st,done:false,noticed:true};}st.t+=inp.dt;return {st,done:st.t>=inp.hold};}
 function tailStep(st,inp){st=st||{seg:0,u:0,started:false};const r=inp.route;if(!Array.isArray(r)||r.length<2)return {st,done:true};const d=inp.d;
  if(!st.started){if(Number.isFinite(d)&&d<=inp.near)st.started=true;else return {st,pos:{x:r[0][0],z:r[0][1]},done:false};}
  if(!Number.isFinite(d)||d>inp.near)return {st:{seg:0,u:0,started:false},pos:{x:r[0][0],z:r[0][1]},done:false,reset:true,why:'lost'};
  if(inp.close>0&&d<inp.close)return {st:{seg:0,u:0,started:false},pos:{x:r[0][0],z:r[0][1]},done:false,reset:true,why:'noticed'};
  let left=inp.speed*inp.dt;while(left>0&&st.seg<r.length-1){const a=r[st.seg],b=r[st.seg+1],len=Math.hypot(b[0]-a[0],b[1]-a[1])||.001,rem=(1-st.u)*len;if(left<rem){st.u+=left/len;left=0;}else{left-=rem;st.seg++;st.u=0;}}
  const a=r[Math.min(st.seg,r.length-1)],b=r[Math.min(st.seg+1,r.length-1)],pos={x:a[0]+(b[0]-a[0])*st.u,z:a[1]+(b[1]-a[1])*st.u,yaw:Math.atan2(b[0]-a[0],b[1]-a[1])};
  return {st,pos,done:st.seg>=r.length-1};}
 /* SPOTTED WITH AN ALARM (onSpotted:'alarm'): st {phase:'calm'|'grace'|'alarm', left (s of grace), hid (s out of sight in a row)}; inp {spotted (the sight meter just
    filled), seen (a guard sees the player now), dt, grace?, hide?}. Returns {st, warn (just spotted: show the warning), clear (got out of sight: back to their rounds),
    alarm (just now: the guards open fire)}. 'alarm' stays until the step is done (the caller drops the state). */
 function spottedStep(st,inp){st=st||{phase:'calm',left:0,hid:0};const out={st,warn:false,clear:false,alarm:false},dt=Math.max(0,Number(inp&&inp.dt)||0),g=Number.isFinite(inp&&inp.grace)?inp.grace:ALARM.grace,h=Number.isFinite(inp&&inp.hide)?inp.hide:ALARM.hide;
  if(st.phase==='alarm')return out;
  if(st.phase==='calm'){if(inp&&inp.spotted){st.phase='grace';st.left=g;st.hid=0;out.warn=true;}return out;}
  st.left-=dt;st.hid=inp&&inp.seen?0:st.hid+dt;
  if(st.hid>=h){st.phase='calm';st.left=0;st.hid=0;out.clear=true;return out;}
  if(st.left<=0){st.phase='alarm';st.left=0;out.alarm=true;}return out;}
 /* REPORT from the V1 Mission Log (the owner, 21 Nov 2026): a reply by Comms call keeps the V1 open and plays there as an answered call; a hand-over in person
    (a place named) or a reply in the conversation window closes it as before. */
 const reportKeepsV1=o=>!!o&&!o.place&&o.via==='comms';
 const api={V1_APPS,KINDS,AUTO,UNSEEN_KINDS,ON_SPOTTED,ALARM,spottedStep,reportKeepsV1,FEED_STAGES,FLIGHT_STAGES,STEP_FIELDS,CAST_KEYS,EVIDENCE_KEYS,EV_KINDS,LIMIT,RANGE,DEF,CLIPS,FLOOR_CLIPS,CLIP_NAMES,FLAG,EV_ID,
  evidenceList,hasEvidence,addEvidence,evidenceDefs,castProblems,evidenceProblems,stepProblems,hit,rank,waitFlag,gameWait,castVisible,overhearStep,observeStep,tailStep,lineSecs,near,close,hold};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionMechanics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
