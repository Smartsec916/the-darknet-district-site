/* The Relay: the in-universe broadcast network (David's Option D and his Relay brief). Rules only.
   - Content (relay-content.json) has two parts. EVENTS are the canonical record of what happened:
     confirmed facts, unknowns, who is involved, when it becomes public. REPORTS (segments) are what
     a broadcaster says about an event, or standalone programming (ads, WarFlying, The Function).
     Several reports can cover one event from different perspectives; none of them changes the event.
   - Every report is labelled with its perspective (neutral, Communion, Natural Order, The Function,
     commercial, sports) and its standing (confirmed, unverified, claim, propaganda, rumour, opinion).
   - Scheduling: combat, mission dialogue and conversations always come first. Breaking news is
     queued (and saved) until it can play, then interrupts routine programming and ads. Routine news
     and ads rotate with cooldowns, so nothing repeats too often; a news report is heard once.
   - Developing stories advance by stage: once a later report is due, earlier ones stop airing.
   - Only public events are ever reported. A private event is reported only once a story flag says
     the public could know (for example, evidence was transmitted).
   - Nothing airs inside The Darknet District's premises or without a satellite link.
   - WarFlying commentary is triggered only by real leaderboard changes (warflying-scan.js), and
     never changes anyone's points.
   relay-radio.js plays reports on the radio; relay-screens.js shows them on station screens. */
(function(root){
 'use strict';
 const config={gapMin:5,gapMax:11,resumeHold:3,retry:8,history:6,wordsPerSecond:2.6,linePause:.5,archive:80,pending:8,line:320,script:1400};
 // Priority, highest first (the brief's §25). 1–3 belong to the game itself (combat, mission dialogue,
 // conversations): the Relay never plays over them. The Relay's own reports use 4–7.
 const priorities={breaking:4,important:5,routine:6,ad:7};
 const kinds={
  news:{speaker:'news-anchor',perspective:'neutral',priority:'routine'},
  breaking:{speaker:'news-anchor',perspective:'neutral',priority:'breaking'},
  public:{speaker:'news-anchor',perspective:'neutral',priority:'routine'},
  station:{perspective:'neutral',priority:'routine'},
  ad:{speaker:'commercial-announcer',perspective:'commercial',priority:'ad',archive:false,cooldown:30},
  police:{speaker:'police-recruiter',perspective:'commercial',priority:'ad',archive:false,cooldown:40},
  warflying:{speaker:'warflying-host',perspective:'sports',priority:'routine',cooldown:25},
  communion:{speaker:'communion-spokesperson',perspective:'communion',priority:'routine',systems:['communion'],cooldown:45},
  'natural-order':{speaker:'natural-order-spokesperson',perspective:'natural-order',priority:'routine',systems:['natural-order'],cooldown:45},
  // The Function's broadcasts stay in Tessaly space and stay rare.
  function:{speaker:'the-function',perspective:'function',priority:'routine',systems:['sol'],cooldown:60}
 };
 const labels={news:'NEWS',breaking:'BREAKING',public:'PUBLIC INFORMATION',station:'STATION NOTICE',ad:'ADVERTISEMENT',police:'RECRUITMENT',warflying:'WARFLYING',communion:'THE COMMUNION','natural-order':'THE NATURAL ORDER',function:'THE FUNCTION'};
 const perspectives={neutral:'Relay News','communion':'Communion','natural-order':'Natural Order','function':'The Function',commercial:'Advertisement',sports:'WarFlying coverage'};
 // How much a report can be trusted. Faction claims and propaganda never rewrite the event record.
 const standings={confirmed:'Confirmed',unverified:'Unverified report',claim:'Faction claim',propaganda:'Propaganda',rumor:'Rumour',opinion:'Opinion',advertisement:'Advertisement',commentary:'Commentary'};
 const systemIds=['erebus','sol','communion','natural-order'];
 // Leaderboard moments that can trigger WarFlying commentary (moments() below).
 const triggers=['warflying-one-point','warflying-comeback','warflying-new-contender'];
 const idPattern=/^[a-z][a-z0-9-]{0,63}$/;
 const lines=s=>Array.isArray(s?.lines)?s.lines:typeof s?.text==='string'?[s.text]:[];
 function speakerOf(s){return s?.speaker||kinds[s?.kind]?.speaker||null;}
 function systemsOf(s){return s.systems||kinds[s.kind]?.systems||systemIds;}
 function priorityOf(s){return priorities[s.priority||kinds[s.kind]?.priority]||priorities.routine;}
 function perspectiveOf(s){return s.perspective||kinds[s.kind]?.perspective||'neutral';}
 function archived(s){return (s.archive??kinds[s.kind]?.archive)!==false;}
 // Minutes before a report may air again; null means once only (every report tied to an event).
 function cooldownOf(s){return s.cooldown!==undefined?s.cooldown:s.event?null:kinds[s.kind]?.cooldown??20;}

 // ---- Validation: problems with the content file; an empty list means it is safe to broadcast ----
 function validate(content){
  const problems=[],ids=new Set(),events=new Map();
  for(const e of content?.events||[]){
   const where='event '+(e?.id||'(no id)');
   if(!idPattern.test(e?.id||''))problems.push(where+': bad id');else if(events.has(e.id))problems.push(where+': duplicate id');events.set(e?.id,e);
   if(typeof e?.summary!=='string'||!e.summary.trim()||e.summary.length>500)problems.push(where+': summary missing or too long');
   for(const k of ['confirmed','unknown'])if(e?.[k]!==undefined&&(!Array.isArray(e[k])||e[k].some(x=>typeof x!=='string'||x.length>240)))problems.push(where+': '+k+' must be a list of short facts');
   const o=e?.occurs;if(!o||!(Number.isFinite(o.at)&&o.at>=0||o.story&&typeof o.story.type==='string'||o.always===true))problems.push(where+': occurs needs at (minutes), story or always');
   if(e?.visibility!==undefined&&e.visibility!=='public'&&e.visibility!=='private'&&!(e.visibility&&typeof e.visibility.flag==='string'))problems.push(where+': visibility must be public, private or {flag}');
  }
  for(const s of content?.segments||[]){
   const where=s?.id||'(no id)',text=lines(s);
   if(!idPattern.test(s?.id||''))problems.push(where+': bad id');else if(ids.has(s.id))problems.push(where+': duplicate id');ids.add(s?.id);
   if(!kinds[s?.kind])problems.push(where+': unknown kind '+s?.kind);
   if(!speakerOf(s))problems.push(where+': needs a speaker');
   if(!text.length||text.some(t=>typeof t!=='string'||!t.trim()||t.length>config.line)||text.join(' ').length>config.script)problems.push(where+': text missing or too long');
   if(s?.systems&&(!Array.isArray(s.systems)||s.systems.some(x=>!systemIds.includes(x))))problems.push(where+': unknown system');
   if(s?.event!==undefined&&!events.has(s.event))problems.push(where+': unknown event '+s.event);
   if(s?.perspective!==undefined&&!perspectives[s.perspective])problems.push(where+': unknown perspective');
   if(s?.standing!==undefined&&!standings[s.standing])problems.push(where+': unknown standing');
   if(s?.priority!==undefined&&!priorities[s.priority])problems.push(where+': unknown priority');
   if(s?.trigger!==undefined&&!triggers.includes(s.trigger))problems.push(where+': unknown trigger');
   if(s?.headline!==undefined&&(typeof s.headline!=='string'||s.headline.length>90))problems.push(where+': headline too long');
   if(s?.stage!==undefined&&!(Number.isInteger(s.stage)&&s.stage>=1))problems.push(where+': stage must be 1 or more');
   if(s?.after!==undefined&&!(Number.isFinite(s.after)&&s.after>=0))problems.push(where+': after must be minutes');
   if(s?.cooldown!==undefined&&s.cooldown!==null&&!(Number.isFinite(s.cooldown)&&s.cooldown>=0))problems.push(where+': cooldown must be minutes or null');
  }
  return problems;
 }

 // ---- Saved news state (save block 'relay'): small and bounded ----
 // occurred: event id -> play-clock second it became public. heard: report id -> second last aired.
 // archive: what the player received, newest last. pending: breaking reports waiting to air.
 // board: the last leaderboard seen, so commentary only follows real changes. said: one-off moments.
 function fresh(){return {version:1,occurred:{},heard:{},archive:[],pending:[],board:null,said:{}};}
 const second=v=>Number.isSafeInteger(v)&&v>=0?Math.min(v,1e9):null;
 function restore(raw){
  const rs=fresh();if(!raw||typeof raw!=='object')return rs;
  for(const key of ['occurred','heard'])for(const [id,t] of Object.entries(raw[key]||{}).slice(0,400))if(idPattern.test(id)&&second(t)!==null)rs[key][id]=second(t);
  rs.archive=(Array.isArray(raw.archive)?raw.archive:[]).filter(a=>a&&idPattern.test(a.id||'')&&second(a.clock)!==null).slice(-config.archive)
   .map(a=>({id:a.id,clock:a.clock,time:Number.isSafeInteger(a.time)&&a.time>0?a.time:0,...(a.vars&&typeof a.vars==='object'?{vars:cleanVars(a.vars)}:{})}));
  rs.pending=[...new Set((Array.isArray(raw.pending)?raw.pending:[]).filter(id=>idPattern.test(id||'')))].slice(0,config.pending);
  if(Array.isArray(raw.board))rs.board=raw.board.filter(r=>r&&typeof r.name==='string'&&r.name.length<=24&&Number.isSafeInteger(r.points)&&Number.isSafeInteger(r.rank)).slice(0,12).map(r=>({name:r.name,points:r.points,rank:r.rank,player:r.player===true}));
  for(const [k,v] of Object.entries(raw.said||{}).slice(0,32))if(idPattern.test(k)&&v===true)rs.said[k]=true;
  return rs;
 }
 function cleanVars(v){const out={};for(const [k,x] of Object.entries(v).slice(0,12))if(/^[a-zA-Z]{1,16}$/.test(k)&&(typeof x==='string'&&x.length<=40||Number.isSafeInteger(x)))out[k]=x;return out;}

 // ---- Events ----
 function isPublic(e,matches){const v=e.visibility??'public';return v==='public'||!!(v.flag&&matches?.({flags:{[v.flag]:true}}));}
 /* Marks events that have become public. ctx: {clock (play seconds), story ({type, subject}) for a
    game event just emitted, matches (story conditions)}. Breaking first reports join the queue.
    Returns the ids that just became public. */
 function occur(rs,content,ctx){
  const out=[];
  for(const e of content?.events||[]){
   if(rs.occurred[e.id]!==undefined)continue;
   const o=e.occurs||{};
   const due=o.always===true||Number.isFinite(o.at)&&ctx.clock>=o.at*60||!!(o.story&&ctx.story&&o.story.type===ctx.story.type&&(!o.story.subject||o.story.subject===ctx.story.subject));
   if(!due||e.when&&!ctx.matches?.(e.when)||!isPublic(e,ctx.matches))continue;
   rs.occurred[e.id]=ctx.clock;out.push(e.id);
   for(const s of content.segments||[])if(s.event===e.id&&priorityOf(s)===priorities.breaking&&(s.stage||1)===1&&!rs.pending.includes(s.id)&&rs.heard[s.id]===undefined)rs.pending.push(s.id);
   rs.pending=rs.pending.slice(-config.pending);
  }
  return out;
 }
 // The stage an event's story has reached: the latest stage whose reports are due.
 function stageOf(rs,content,eventId,clock){
  const since=(clock-(rs.occurred[eventId]??clock))/60;let stage=1;
  for(const s of content?.segments||[])if(s.event===eventId&&(s.after||0)<=since)stage=Math.max(stage,s.stage||1);
  return stage;
 }
 // ---- Which reports may air now ----
 function allowed(s,ctx,rs,content,{ignoreHeard=false}={}){
  if(!kinds[s.kind]||!lines(s).length||!systemsOf(s).includes(ctx.system))return false;
  if(s.when&&ctx.matches&&!ctx.matches(s.when))return false;
  if(s.trigger&&ctx.moment?.trigger!==s.trigger)return false;
  if(s.event){if(!rs||rs.occurred[s.event]===undefined||(s.stage||1)!==stageOf(rs,content,s.event,ctx.clock||0))return false;}
  if(!ignoreHeard&&rs&&!s.trigger&&rs.heard[s.id]!==undefined){const c=cooldownOf(s);if(c===null||(ctx.clock||0)-rs.heard[s.id]<c*60)return false;}
  return true;
 }
 function eligible(segments,ctx,rs,content){const list=Array.isArray(segments)?segments:segments?.segments||[];return list.filter(s=>allowed(s,ctx,rs,content||{segments:list}));}
 // Rough on-air length of one line without a recording (subtitles only).
 function readTime(s){return 1.5+lines(s).join(' ').split(/\s+/).length/config.wordsPerSecond;}
 function lineTime(text){return 1.2+String(text).split(/\s+/).length/config.wordsPerSecond;}
 function create(){return {state:'idle',segment:null,vars:null,interrupted:null,timer:1.5,history:[],last:null};}
 // Breaking and important news first, then commentary on a live leaderboard moment (it is only news
 // while it is fresh); otherwise rotate kinds, favour news over ads, avoid repeats.
 function pick(r,list,rng){
  if(!list.length)return null;
  const top=Math.min(...list.map(priorityOf));
  let pool=top<=priorities.important?list.filter(s=>priorityOf(s)===top):list;
  if(top>priorities.important&&pool.some(s=>s.trigger))pool=pool.filter(s=>s.trigger);
  const fresh=pool.filter(s=>!r.history.includes(s.id));if(fresh.length)pool=fresh;else pool=pool.filter(s=>s.id!==r.history[r.history.length-1]).length?pool.filter(s=>s.id!==r.history[r.history.length-1]):pool;
  const rotated=pool.filter(s=>s.kind!==r.last);if(rotated.length)pool=rotated;
  const weight=s=>priorityOf(s)>=priorities.ad?1:2,total=pool.reduce((n,s)=>n+weight(s),0);
  let roll=rng()*total;for(const s of pool){roll-=weight(s);if(roll<0)return s;}return pool[pool.length-1];
 }
 function begin(r,rs,s,ctx,vars){
  r.state='playing';r.segment=s;r.vars=vars||null;r.last=s.kind;r.history=[...r.history.filter(id=>id!==s.id),s.id].slice(-config.history);
  if(rs){
   rs.heard[s.id]=ctx.clock||0;rs.pending=rs.pending.filter(id=>id!==s.id);
   if(archived(s)&&!rs.archive.some(a=>a.id===s.id&&(ctx.clock||0)-a.clock<600)){rs.archive.push({id:s.id,clock:ctx.clock||0,time:ctx.now||0,...(vars?{vars}:{})});if(rs.archive.length>config.archive)rs.archive.shift();}
   if(s.trigger==='warflying-new-contender')rs.said['warflying-new-contender']=true;
  }
  return {type:'play',segment:s,vars:vars||null};
 }
 /* One scheduler tick. ctx: {on, system, protected, offline (no satellite link), priority (combat,
    mission dialogue or a conversation is running), ended (the current report finished), clock,
    now, matches, moment ({trigger, vars} from a real leaderboard change)}. content: {segments,
    events} or a plain list of segments. rs: the saved news state (optional in old callers).
    Returns {type:'play', segment, vars, interrupting?} | {type:'stop', reason} | null. */
 function step(r,dt,ctx,content,rng=Math.random,rs=null){
  content=Array.isArray(content)?{segments:content}:content||{segments:[]};
  const segments=content.segments||[],playing=r.state==='playing';
  if(!ctx.on||ctx.protected||ctx.offline){r.state='idle';r.timer=1.5;r.interrupted=null;r.segment=null;return playing?{type:'stop',reason:!ctx.on?'off':ctx.protected?'protected':'offline'}:null;}
  if(ctx.priority){
   // Give way at once; the interrupted report comes back after a short hold.
   if(playing){r.interrupted=r.segment;r.interruptedVars=r.vars;r.segment=null;}r.state='held';r.timer=config.resumeHold;
   return playing?{type:'stop',reason:'priority'}:null;
  }
  const breaking=rs?rs.pending.map(id=>segments.find(s=>s.id===id)).find(s=>s&&allowed(s,ctx,rs,content,{ignoreHeard:true})):null;
  if(rs)rs.pending=rs.pending.filter(id=>segments.some(s=>s.id===id&&s.event&&rs.occurred[s.event]!==undefined&&(s.stage||1)>=stageOf(rs,content,s.event,ctx.clock||0)));
  if(playing){
   // Breaking news cuts into routine programming and ads (never into other breaking news).
   if(breaking&&priorityOf(r.segment)>priorities.breaking){const cut=r.segment;r.interrupted=priorityOf(cut)<priorities.ad?cut:null;r.interruptedVars=r.vars;return {...begin(r,rs,breaking,ctx),interrupting:cut.id};}
   if(ctx.ended){r.state='gap';r.segment=null;r.timer=breaking?1:config.gapMin+rng()*(config.gapMax-config.gapMin);}
   return null;
  }
  r.timer-=dt;if(r.timer>0)return null;
  if(breaking)return begin(r,rs,breaking,ctx);
  const back=r.interrupted&&allowed(r.interrupted,ctx,rs,content,{ignoreHeard:true})?r.interrupted:null;r.interrupted=null;
  if(back)return begin(r,rs,back,ctx,r.interruptedVars);
  const list=eligible(segments,ctx,rs,content),next=pick(r,list,rng);
  if(!next){r.state='idle';r.timer=config.retry;return null;}
  return begin(r,rs,next,ctx,next.trigger?ctx.moment?.vars:null);
 }

 // ---- WarFlying commentary from real leaderboard changes ----
 const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
 const word=n=>words[n]||String(n),ordinal=n=>['','first','second','third','fourth','fifth','sixth','seventh','eighth'][n]||n+'th';
 /* Compares two leaderboard snapshots (warflying-scan.js leaderboard()) and returns the moments
    worth commentary, best first. Read-only: nobody's points change. */
 function moments(before,after){
  if(!Array.isArray(before)||!Array.isArray(after))return [];
  const out=[],prev=new Map(before.map(r=>[r.name,r]));
  for(const r of after){
   const p=prev.get(r.name);if(!p)continue;const gain=r.points-p.points,climb=p.rank-r.rank;
   if(r.player){if(p.points<=0&&r.points>0)out.push({trigger:'warflying-new-contender',vars:{}});continue;}
   if(gain===1&&climb>0)out.push({trigger:'warflying-one-point',vars:{name:r.name,NAME:r.name.toUpperCase(),RANK:ordinal(r.rank).toUpperCase(),rank:ordinal(r.rank)}});
   else if(gain>=2&&climb>0)out.push({trigger:'warflying-comeback',vars:{name:r.name,count:word(gain),COUNT:word(gain).toUpperCase(),positions:word(climb)+' position'+(climb===1?'':'s')}});
  }
  return out;
 }
 // A report's lines with leaderboard names and numbers filled in.
 function render(s,vars){return lines(s).map(t=>t.replace(/\{(\w+)\}/g,(m,k)=>vars&&vars[k]!==undefined?String(vars[k]):m));}
 // Headlines for station screens: the newest received reports plus anything currently airing, from the
 // same records the radio uses. Ads and recruitment are shown as such.
 function headlines(rs,content,ctx,limit=5){
  const segs=new Map((content?.segments||[]).map(s=>[s.id,s])),seen=new Set(),out=[];
  const add=(s,vars)=>{if(!s||seen.has(s.id)||!s.headline)return;seen.add(s.id);out.push({id:s.id,kind:s.kind,label:labels[s.kind],perspective:perspectiveOf(s),standing:s.standing||null,headline:render({lines:[s.headline]},vars)[0],event:s.event||null});};
  for(const a of [...(rs?.archive||[])].reverse())add(segs.get(a.id),a.vars);
  for(const s of eligible(content?.segments||[],{...ctx,moment:null},rs,content))if(s.event)add(s);
  return out.slice(0,limit);
 }
 const api={config,priorities,kinds,labels,perspectives,standings,systemIds,triggers,lines,validate,speakerOf,systemsOf,priorityOf,perspectiveOf,archived,cooldownOf,
  fresh,restore,occur,stageOf,allowed,eligible,readTime,lineTime,create,pick,step,moments,render,headlines};
 if(typeof module!=='undefined')module.exports=api;else root.VoidRelay=api;
})(globalThis);
