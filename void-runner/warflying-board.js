/* The WarFlying Leadership Board (David, 16 Nov 2026; docs/void-runner/design-source/12-street-advertisements-david.md).
   PURE RULES: runs in the browser and in Node (tests/warflying-board.test.cjs). No server, no save field.
   - Only the top 5 are ever shown.
   - The five change WEEKLY and are the same for every player: they are worked out from the real-world ISO week alone.
   - #1 always comes from David's own handle list (HANDLES: both of his batches, verbatim, repeats removed), because #1 is the only name a voice ever says.
   - #2 to #5 mostly come from the handle generator below (never spoken); a few are David's, a few are plain.
   - During the week the lower four pick up the odd point at fixed moments (the same moments for everyone), so David's WarFlying commentary on the radio
     ("...THAT SINGLE POINT HAS MOVED {NAME} INTO {RANK} PLACE!") still has real changes to report. Only handles from David's list ever move that way,
     because only those can be recorded. #1 is never overtaken by the other four.
   - The player's own score is measured against the week's five. A player who is #1 is announced as "a new number one" (NEW_ONE): there is no recording
     of a player's name.
   The points are on the same scale as the player's (one point per unique signal), and stay below the number of signals that exist, so the top is reachable. */
(function(root){
 'use strict';
 const HEADER='WARFLYING LEADERSHIP BOARD',NEW_ONE='a new number one',SHOWN=5;
 // David's handles, verbatim (doc 12, both batches, deduplicated in the order he gave them).
 const HANDLES=['GlitchBitch','ChromeSlut','DeepSocket','RustyProbe','DirtyCircuit','WetwareWhore','NeonNasty','FilthyFirmware','CyberPerv','DeadInside','SinDealer','ChromeDaddy','FleshGlitch','MalwareMama','DirtyRAM',
  'DirtyCircuits','RustyOrifice','CyberPimp','NeonSinner','BrokenCondom','ShadyBytes','SyntheticVice','DirtySocket','DaddysFirmware','NastyGlitch','BootyProtocol','FleshFirmware','EmotionalDamage','CorruptedVirgin','BarelyHuman',
  'HappyEnding','HardDrive','ForbiddenPlug','MaliciousIntent','GlitchedGSpot','DirtyMotherboard','MorningAfter','QuestionableUpgrade','MoistCircuit','SiliconeSinner','UnethicalPleasure','FatalAttraction','ScreamingImplant',
  'BadDecisions','ConsentError','BlackMass','OrganDonor','HumanError','LastBadIdea','UnholyHardware','CorporateBastard','CheapFlesh','DisposableHuman','TerminalPleasure','BeautifulMalfunction','NoRefunds','FactoryDefect'];
 const DAVID=new Set(HANDLES),isDavid=name=>DAVID.has(name);
 /* The generator's words. Every pairing of FIRST and SECOND is harmless (signal, ship and street words only): nothing here is ruder than David's own list,
    and none of it is a person's name. PLAIN are ordinary hobbyist handles. To change the flavour, edit these lists. */
 const FIRST=['Neon','Chrome','Rust','Static','Ghost','Void','Null','Cold','Zero','Glitch','Proxy','Packet','Signal','Orbit','Vector','Cipher','Kernel','Solder','Carbon','Ember','Hollow','Night','Dust','Echo','Lunar','Vanta','Mono','Hex','Byte','Drift','Quiet','Stray','Rogue','Burnt','Cheap','Lost','Low','Side','Back','Dark'];
 const SECOND=['Runner','Sniffer','Hound','Moth','Rat','Wraith','Jockey','Socket','Ping','Daemon','Relay','Antenna','Scanner','Listener','Drifter','Circuit','Probe','Pilot','Fox','Crow','Monk','Punk','Mule','Leech','Vulture','Gremlin','Goblin','Lurker','Tuner','Band','Channel','Beacon','Carrier','Uplink','Squelch'];
 const PLAIN=['orbitfan','scanlog','nightshift','longhaul','deckhand','coldstart','sidechannel','backscatter','lowpass','carrierwave','skywatch','listener','dishwatcher','beaconhunter','freqcounter','deadair','shortwave','antennafarm','logkeeper','tuningfork'];
 const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 // A small seeded random sequence (mulberry32): the same seed gives the same handles on every machine.
 const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 const pick=(r,list)=>list[Math.floor(r()*list.length)],two=r=>String(Math.floor(r()*100)).padStart(2,'0');
 /* One generated handle. About half look like login handles ending in two digits ("staticmoth67", "Rust_Hound04"); the rest are two words run together
    ("VoidJockey") or a plain handle, sometimes with digits ("scanlog", "longhaul12"). Returns {name, kind:'generated'|'plain'}. */
 function generate(r){
  const roll=r();
  if(roll<.2){const w=pick(r,PLAIN);return {name:r()<.45?w+two(r):w,kind:'plain'};}
  const a=pick(r,FIRST),b=pick(r,SECOND);
  if(roll<.45)return {name:a+b,kind:'generated'};
  if(roll<.72)return {name:(a+b).toLowerCase()+two(r),kind:'generated'};
  if(roll<.88)return {name:a+b+two(r),kind:'generated'};
  return {name:a+'_'+b+two(r),kind:'generated'};
 }
 // n generated handles from a seed (for David to look over, and for tests).
 function sample(n,seed=1){const r=rng(hash('sample|'+seed)),out=[];while(out.length<n){const h=generate(r).name;if(!out.includes(h))out.push(h);}return out;}

 // ---- The week ----
 // ISO week of a date, in UTC: {key:'2026-W47', start: ms of that Monday 00:00 UTC}.
 function weekOf(date){
  const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())),day=(d.getUTCDay()+6)%7,monday=d.getTime()-day*864e5;
  const thursday=new Date(monday+3*864e5),year=thursday.getUTCFullYear(),jan4=Date.UTC(year,0,4),first=jan4-((new Date(jan4).getUTCDay()+6)%7)*864e5;
  return {key:year+'-W'+String(1+Math.round((monday-first)/(7*864e5))).padStart(2,'0'),start:monday};
 }
 const WEEK=7*864e5;
 const topIndex=key=>hash('warflying-one|'+key)%HANDLES.length;
 // The week's cast: five entries {name, kind, base, gains:[{at (0..1 of the week), points}]}, #1 first. The same for everyone, from the week's key alone.
 const plans=new Map();
 function plan(week){
  if(plans.has(week.key))return plans.get(week.key);
  const r=rng(hash('warflying-week|'+week.key)),prev=weekOf(new Date(week.start-864e5));
  // #1: one of David's, never the same handle two weeks running.
  let ti=topIndex(week.key);if(ti===topIndex(prev.key))ti=(ti+1)%HANDLES.length;
  const used=new Set([HANDLES[ti]]),david=()=>{let n;do n=pick(r,HANDLES);while(used.has(n));used.add(n);return {name:n,kind:'david'};};
  const made=()=>{let h;do h=generate(r);while(used.has(h.name)||isDavid(h.name));used.add(h.name);return h;};
  // The other four: mostly generated. A planned move (below) is always one of David's, because the radio may name it.
  const rows=[];let score=58+Math.floor(r()*35);
  for(let i=0;i<4;i++){rows.push({...(r()<.15?david():made()),base:score,gains:[]});score=Math.max(9,score-3-Math.floor(r()*10));}
  // A single point that lifts one of them a place (David's "THAT'S ONE POINT!"): it starts level with the handle above and finds one signal.
  if(r()<.6){const j=1+Math.floor(r()*3);Object.assign(rows[j],david(),{base:rows[j-1].base,gains:[{at:.12+r()*.76,points:1}]});rows[j-1].still=true;
   for(let k=j+1;k<4;k++)rows[k].base=Math.min(rows[k].base,rows[k-1].base-2-Math.floor(r()*4));}
  // A run of several signals that lifts one of them (David's "comeback").
  if(r()<.35){const j=[1,2,3].filter(k=>!rows[k].gains.length&&!rows[k].still&&!rows[k-1].gains.length);if(j.length){const k=pick(r,j),n=2+Math.floor(r()*3);
   Object.assign(rows[k],david(),{base:Math.max(rows[k].base,rows[k-1].base-n+1),gains:[{at:.2+r()*.6,points:n}]});rows[k-1].still=true;}}
  // Ordinary finds: a point here and there for the handles with no planned move.
  for(const row of rows)if(!row.gains.length&&!row.still&&r()<.5)row.gains.push({at:.05+r()*.9,points:1});
  // #1 stays out of reach of the four, and below the number of signals that exist.
  const best=Math.max(...rows.map(x=>x.base+x.gains.reduce((n,g)=>n+g.points,0)));
  const top={name:HANDLES[ti],kind:'david',base:Math.min(124,best+4+Math.floor(r()*12)),gains:r()<.5?[{at:.1+r()*.8,points:1}]:[]};
  const out=[top,...rows.map(({still,...x})=>x)];plans.set(week.key,out);if(plans.size>8)plans.delete(plans.keys().next().value);return out;
 }
 // The week's five at a moment, best first: [{name, points, kind}].
 function five(date=new Date()){
  const week=weekOf(date),at=(date.getTime()-week.start)/WEEK;
  return plan(week).map((p,i)=>({name:p.name,kind:p.kind,points:p.base+p.gains.reduce((n,g)=>n+(at>=g.at?g.points:0),0),order:i}))
   .sort((a,b)=>b.points-a.points||a.order-b.order).map(({order,...x})=>x);
 }
 /* Everyone ranked: the week's five and the player (six rows, each {rank, name, points, player}). A tie goes to the handle who was there first.
    This is the shape the Relay's commentary compares; what is SHOWN is standings().rows (five). */
 function ranked(playerPoints,playerName='YOU',date=new Date()){
  const rows=five(date).map(r=>({name:r.name,points:r.points,player:false}));
  rows.push({name:String(playerName||'YOU').slice(0,24),points:Math.max(0,Math.floor(Number(playerPoints)||0)),player:true});
  return rows.sort((x,y)=>y.points-x.points||(x.player?1:y.player?-1:0)).map((r,i)=>({...r,rank:i+1}));
 }
 /* What a board shows and says. rows: the top five only. you: the player's own row (rank null when not in the five). first: #1.
    spoken: the only thing a voice says: #1's handle, or "a new number one" when #1 is a real player. */
 function standings(playerPoints,playerName='YOU',date=new Date()){
  const all=ranked(playerPoints,playerName,date),rows=all.slice(0,SHOWN),me=all.find(r=>r.player),first=rows[0];
  return {week:weekOf(date).key,header:HEADER,rows,you:{name:me.name,points:me.points,rank:me.rank<=SHOWN?me.rank:null},first,spoken:first.player?NEW_ONE:first.name};
 }
 const api={HEADER,NEW_ONE,SHOWN,HANDLES,FIRST,SECOND,PLAIN,isDavid,generate,sample,rng,hash,weekOf,plan,five,ranked,standings};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidWarFlyingBoard=api;
})(typeof globalThis!=='undefined'?globalThis:this);
