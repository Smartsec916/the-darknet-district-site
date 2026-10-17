/* The Relay as a station on the radio (Settings > Radio > THE RELAY). Rules live in relay.js and
   the scripts in relay-content.json. Each report is spoken line by line: a recorded line plays on
   the voice channel through a live transmission filter, and a line without a recording is shown as
   a caption for a natural reading time. Music ducks under a broadcast.
   - The station gives way to combat, mission dialogue and conversations; breaking news waits for
     them (saved across reloads), then cuts into routine programming and ads.
   - Live programming needs the satellite link (comms.js): in warp between systems the station has
     no signal, and anything breaking waits. It is silent on The Darknet District's premises.
   - The news state (what became public, what you heard, the archive) is saved in state.relay.
   - WarFlying commentary follows real leaderboard changes and never changes anyone's points.
   The archive is in the Mission Log; relay-screens.js shows the same reports on station screens. */
(function(){
 const R=VoidRelay,radio=VoidRadio,base=document.currentScript?.src||location.href;
 let content={segments:[],events:[]},relay=R.create(),on=false,playing=null,ended=false,timer=null,status='',tick=0,boardTick=0,moments=[];
 fetch(new URL('relay-content.json',base)).then(r=>r.ok?r.json():null).then(c=>{
  if(!c)return;const problems=R.validate(c);if(problems.length){console.warn('[VOID relay] content not loaded',problems);return;}content={events:[],...c};
 }).catch(()=>{});
 VoidExplorationData.radio.relay={name:'THE RELAY',regions:['erebus','sol','earth','mars'],tracks:[],relay:true};

 const css=document.createElement('style');
 css.textContent='#relay-caption{position:fixed;left:16px;bottom:160px;z-index:25;max-width:min(400px,calc(100vw - 32px));padding:8px 12px;background:#0a0f16d9;border-left:3px solid #d9a441;color:#e6e1d6;font:14px/1.45 system-ui,sans-serif;pointer-events:none}'
  +'#relay-caption .relay-tag{display:block;font:11px monospace;letter-spacing:.12em;color:#d9a441;margin-bottom:3px}#relay-caption.breaking{border-left-color:#e0574a}#relay-caption.breaking .relay-tag{color:#ff8a7a}';
 document.head.append(css);
 const caption=document.createElement('div');caption.id='relay-caption';caption.hidden=true;caption.setAttribute('aria-live','polite');document.body.append(caption);
 const rs=()=>state?.relay||(state&&(state.relay=R.fresh()));
 const clock=()=>state?.warflying?.clock||0;
 const matches=w=>VoidStory.matches(state,w);
 function show(seg,text){caption.className=seg.kind==='breaking'?'breaking':'';caption.innerHTML='<div class="relay-tag">THE RELAY · '+R.labels[seg.kind]+'</div>'+escapeText(text);caption.hidden=false;}
 function halt(){const p=playing;playing=null;clearTimeout(timer);p?.stop();caption.hidden=true;}
 // Speaks a report's lines in order. Returns a handle; onDone runs once when every line has played.
 function speak(seg,vars,onDone){
  const texts=R.render(seg,vars),speaker=R.speakerOf(seg),bus=VoidAudio.bus('voice');let index=-1,current=null,stopped=false;
  const handle={stop(){stopped=true;clearTimeout(timer);current?.stop();}};
  const next=()=>{
   if(stopped)return;index++;if(index>=texts.length){onDone?.(handle);return;}
   const text=texts[index];show(seg,text);
   const clip=bus&&globalThis.VoidVoiceClips?.broadcast(speaker,text,bus.node);
   const wait=()=>{current=null;timer=setTimeout(next,R.lineTime(text)*1000);};
   if(clip){current=clip;clip.done.then(()=>{if(!stopped)timer=setTimeout(next,R.config.linePause*1000);},()=>{if(!stopped)wait();});}else wait();
  };
  next();return handle;
 }
 function start(seg,vars){
  halt();ended=false;
  const handle=speak(seg,vars,h=>{if(playing!==h)return;playing=null;ended=true;caption.hidden=true;});playing=handle;
 }

 // The radio treats THE RELAY like any other station.
 const tune=radio.tune,category=radio.category,stop=radio.stop;
 const statusGet=Object.getOwnPropertyDescriptor(radio,'status').get,selectionGet=Object.getOwnPropertyDescriptor(radio,'selection').get;
 radio.tune=function(id){if(id==='relay'){tune(null);on=true;relay=R.create();status='THE RELAY / TUNING';return Promise.resolve(true);}on=false;halt();return tune(id);};
 radio.category=function(name){if(!on)return category(name);};
 radio.stop=function(){on=false;halt();return stop();};
 Object.defineProperty(radio,'status',{get(){return on?status:statusGet();},configurable:true});
 Object.defineProperty(radio,'selection',{get(){return on?'relay':selectionGet();},configurable:true});

 // Game events can make news (a story event's trigger in relay-content.json), whether or not the
 // radio is on. Only public events are recorded; nothing private is ever reported.
 const storyEmit=VoidStory.emit;
 VoidStory.emit=function(s,type,subject){const fired=storyEmit.apply(this,arguments);if(s===state&&content.events.length)R.occur(rs(),content,{clock:clock(),story:{type,subject},matches});return fired;};

 // Real leaderboard changes become WarFlying moments (newest kept, for ten minutes).
 function watchBoard(){
  const db=state?.warflying;if(!db)return;
  const board=VoidWarFlyingScan.leaderboard(db.clock,VoidWarFlying.points(db),'YOU').map(r=>({name:r.name,points:r.points,rank:r.rank,player:r.player}));
  const found=R.moments(rs().board,board).filter(m=>m.trigger!=='warflying-new-contender'||!rs().said['warflying-new-contender']);
  rs().board=board;
  for(const m of found){moments=moments.filter(x=>x.trigger!==m.trigger);moments.push({...m,at:clock()});}
  moments=moments.filter(m=>clock()-m.at<600);
 }
 function link(){return VoidComms.status(state,{route:mode==='play'?flight.route:null,onFoot:!!walkingLocation});}

 const relayUpdate=update;
 update=function(dt){
  relayUpdate(dt);
  if(!state||['menu','recovery'].includes(mode))return;
  // Events and the leaderboard are checked every few seconds, not every frame.
  tick-=dt;if(tick<=0){tick=2;if(content.events.length)R.occur(rs(),content,{clock:clock(),matches});}
  boardTick-=dt;if(boardTick<=0){boardTick=20;watchBoard();}
  // The location policy (comms.js): no Relay broadcasts on The Darknet District's premises.
  const sealed=!VoidComms.allows(state.location,!!walkingLocation,'relay'),st=link(),offline=!sealed&&!VoidComms.canUpload(st);
  const priority=['dialogue','pause','menu','recovery','over','mission-log'].includes(mode)||!!(typeof speech!=='undefined'&&speech)
   ||mode==='play'&&(enemies.some(VoidStory.hostile)||flight.route?.phase==='encounter'||!!document.getElementById('police-hail')||globalThis.VoidPolicePatrolState?.()?.state==='pursuit');
  const moment=moments[moments.length-1]||null;
  const ctx={on,system:state.universe?.currentSystem||'erebus',protected:sealed,offline,priority,ended,clock:clock(),now:Date.now(),matches,moment};
  const action=R.step(relay,dt,ctx,content,Math.random,rs());ended=false;
  if(action?.type==='stop')halt();
  else if(action?.type==='play'){if(action.segment.trigger)moments=moments.filter(m=>m.trigger!==action.segment.trigger);start(action.segment,action.vars);}
  const pending=rs().pending.length;
  status=sealed?'THE RELAY / NO SIGNAL INSIDE THE DISTRICT':offline?'THE RELAY / NO SIGNAL'+(st.reason==='warp'?' IN WARP':'')+(pending?' · '+pending+' REPORT'+(pending===1?'':'S')+' WAITING':'')
   :!content.segments.length?'THE RELAY / AWAITING TRANSMISSIONS':relay.state==='playing'?'THE RELAY / ON AIR · '+R.labels[relay.segment.kind]:relay.state==='held'?'THE RELAY / HOLDING FOR PRIORITY TRAFFIC':'THE RELAY / STANDING BY';
  if(on&&$('radio-status'))$('radio-status').textContent=status;
 };

 // ---- The news archive, inside the Mission Log ----
 const css2=document.createElement('style');
 css2.textContent='#mission-log .relay-archive details{margin:6px 0;padding:6px 10px;border-left:2px solid #d9a441;background:#ffffff08}#mission-log .relay-archive summary{cursor:pointer}'
  +'#mission-log .relay-archive .tag{display:inline-block;margin-right:6px;padding:0 6px;font:11px monospace;letter-spacing:.06em;border:1px solid #d9a44188;color:#e8c27a}'
  +'#mission-log .relay-archive .tag.claim,#mission-log .relay-archive .tag.propaganda,#mission-log .relay-archive .tag.opinion{border-color:#9b8cd988;color:#c4b8f2}#mission-log .relay-archive .tag.unverified,#mission-log .relay-archive .tag.rumor{border-color:#e0574a88;color:#ff9c8f}'
  +'#mission-log .relay-archive .facts{color:#b9c4c0;font-size:13px}#mission-log .relay-archive .script p{margin:3px 0}';
 document.head.append(css2);
 const when=a=>a.time?new Date(a.time).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
 function report(a){
  const s=content.segments.find(x=>x.id===a.id);if(!s)return '';
  const standing=s.standing?'<span class="tag '+s.standing+'">'+R.standings[s.standing]+'</span>':'';
  return '<details><summary><span class="tag">'+escapeText(R.perspectives[R.perspectiveOf(s)])+'</span>'+standing+escapeText(R.render({lines:[s.headline||R.labels[s.kind]]},a.vars)[0])+' <small>'+escapeText(when(a))+'</small></summary>'
   +'<div class="script">'+R.render(s,a.vars).map(t=>'<p>'+escapeText(t)+'</p>').join('')+'</div></details>';
 }
 function archiveSection(){
  const state_=rs(),groups=new Map(),other=[];
  for(const a of [...state_.archive].reverse()){const s=content.segments.find(x=>x.id===a.id);if(!s)continue;if(s.event){if(!groups.has(s.event))groups.set(s.event,[]);groups.get(s.event).push(a);}else other.push(a);}
  const events=[...groups.entries()].slice(0,10).map(([id,list])=>{
   const e=content.events.find(x=>x.id===id);if(!e)return '';
   return '<article class="mission-entry"><h3>'+escapeText(e.summary)+'</h3>'
    +(e.confirmed?.length?'<p class="facts"><strong>Confirmed:</strong> '+e.confirmed.map(escapeText).join(' ')+'</p>':'')
    +(e.unknown?.length?'<p class="facts"><strong>Unknown:</strong> '+e.unknown.map(escapeText).join(' ')+'</p>':'')
    +list.map(report).join('')+'</article>';
  }).join('');
  const rest=other.slice(0,10).map(report).join('');
  return '<section class="relay-archive"><h2>THE RELAY · NEWS ARCHIVE</h2>'
   +(events||rest?'<p>Reports you have heard on the Relay, kept aboard. Each story shows what is confirmed and what is unknown; faction statements are labelled as claims or opinion.</p>'+events+(rest?'<h3>OTHER PROGRAMMING</h3>'+rest:''):'<p>Nothing received yet. Tune the radio to THE RELAY to hear the news.</p>')
   +'</section>';
 }
 const archiveLog=openMissionLog;
 openMissionLog=function(){
  const result=archiveLog.apply(this,arguments);
  if(typeof missionPanel!=='undefined'&&missionPanel&&state)missionPanel.querySelector('[data-close]')?.insertAdjacentHTML('beforebegin',archiveSection());
  return result;
 };
 globalThis.VoidRelayRadio={get on(){return on;},get speaking(){return on&&relay.state==='playing';},get state(){return relay;},get news(){return rs();},get moments(){return moments;},get content(){return content;},
  set content(c){if(!R.validate(c).length){halt();content={events:[],...c};relay=R.create();}},archiveSection,watchBoard};
})();
