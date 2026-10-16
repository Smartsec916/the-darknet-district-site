/* The Relay as a station on the radio (Settings > Radio > THE RELAY). Rules live in relay.js and
   the scripts in relay-content.json. Recorded broadcasts play on the voice channel through a live
   transmission filter; a line without a recording is shown as a caption only. Music ducks under a
   broadcast, the station gives way to mission dialogue and combat, and it is silent inside The
   Darknet District's protected premises. */
(function(){
 const R=VoidRelay,radio=VoidRadio,base=document.currentScript?.src||location.href;
 let content={segments:[]},relay=R.create(),on=false,playing=null,ended=false,timer=null,status='';
 fetch(new URL('relay-content.json',base)).then(r=>r.ok?r.json():null).then(c=>{
  if(!c)return;const problems=R.validate(c);if(problems.length){console.warn('[VOID relay] content not loaded',problems);return;}content=c;
 }).catch(()=>{});
 VoidExplorationData.radio.relay={name:'THE RELAY',regions:['erebus','sol','earth','mars'],tracks:[],relay:true};

 const css=document.createElement('style');
 css.textContent='#relay-caption{position:fixed;left:16px;bottom:160px;z-index:25;max-width:min(380px,calc(100vw - 32px));padding:8px 12px;background:#0a0f16d9;border-left:3px solid #d9a441;color:#e6e1d6;font:14px/1.45 system-ui,sans-serif;pointer-events:none}'
  +'#relay-caption .relay-tag{display:block;font:11px monospace;letter-spacing:.12em;color:#d9a441;margin-bottom:3px}';
 document.head.append(css);
 const caption=document.createElement('div');caption.id='relay-caption';caption.hidden=true;caption.setAttribute('aria-live','polite');document.body.append(caption);
 function show(seg){caption.innerHTML='<div class="relay-tag">THE RELAY · '+R.labels[seg.kind]+'</div>'+escapeText(seg.text);caption.hidden=false;}
 function halt(){const p=playing;playing=null;clearTimeout(timer);p?.stop();caption.hidden=true;}
 function finish(handle){if(playing!==handle)return;playing=null;ended=true;caption.hidden=true;}
 function start(seg){
  halt();show(seg);ended=false;
  const bus=VoidAudio.bus('voice'),handle=bus&&globalThis.VoidVoiceClips?.broadcast(R.speakerOf(seg),seg.text,bus.node);
  if(handle){playing=handle;handle.done.then(()=>finish(handle),()=>{if(playing===handle)captionOnly(seg);});}
  else captionOnly(seg);
 }
 // No recording yet (an uncast broadcaster): the caption stays up for a natural reading time.
 function captionOnly(seg){const handle={stop(){}};playing=handle;timer=setTimeout(()=>finish(handle),R.readTime(seg)*1000);}

 // The radio treats THE RELAY like any other station.
 const tune=radio.tune,category=radio.category,stop=radio.stop;
 const statusGet=Object.getOwnPropertyDescriptor(radio,'status').get,selectionGet=Object.getOwnPropertyDescriptor(radio,'selection').get;
 radio.tune=function(id){if(id==='relay'){tune(null);on=true;relay=R.create();status='THE RELAY / TUNING';return Promise.resolve(true);}on=false;halt();return tune(id);};
 radio.category=function(name){if(!on)return category(name);};
 radio.stop=function(){on=false;halt();return stop();};
 Object.defineProperty(radio,'status',{get(){return on?status:statusGet();},configurable:true});
 Object.defineProperty(radio,'selection',{get(){return on?'relay':selectionGet();},configurable:true});

 const relayUpdate=update;
 update=function(dt){
  relayUpdate(dt);
  // On foot at NeoChinatown is The Darknet District (as music-director.js treats it).
  const sealed=!!walkingLocation&&state?.location==='earth';
  const priority=['dialogue','pause','menu','recovery','over'].includes(mode)||!!(typeof speech!=='undefined'&&speech)
   ||mode==='play'&&(enemies.some(VoidStory.hostile)||flight.route?.phase==='encounter'||!!document.getElementById('police-hail')||globalThis.VoidPolicePatrolState?.()?.state==='pursuit');
  const ctx={on,system:state?.universe?.currentSystem||'erebus',protected:sealed,priority,ended,matches:w=>VoidStory.matches(state,w)};
  const action=R.step(relay,dt,ctx,content.segments);ended=false;
  if(action?.type==='stop')halt();
  else if(action?.type==='play')start(action.segment);
  status=sealed?'THE RELAY / NO SIGNAL INSIDE THE DISTRICT':!content.segments.length?'THE RELAY / AWAITING TRANSMISSIONS':relay.state==='playing'?'THE RELAY / ON AIR · '+R.labels[relay.segment.kind]:relay.state==='held'?'THE RELAY / HOLDING FOR PRIORITY TRAFFIC':'THE RELAY / STANDING BY';
  if(on&&$('radio-status'))$('radio-status').textContent=status;
 };
 globalThis.VoidRelayRadio={get on(){return on;},get speaking(){return on&&relay.state==='playing';},get state(){return relay;},get content(){return content;},set content(c){if(!R.validate(c).length){halt();content=c;relay=R.create();}}};
})();
