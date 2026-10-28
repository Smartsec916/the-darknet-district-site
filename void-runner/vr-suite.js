/* VR experience: Play in a Bedroom. A private apartment bedroom high above NeoChinatown at night, with an original adult companion
   chosen before launch (Seren or Kai). The companion greets you, keeps eye contact, talks, walks, sits with you,
   dances, holds hands and, when the moment is right and you choose it, shares a kiss. Everything is optional and
   non-explicit; you can simply enjoy the room. Mood lighting, music, curtains and seating respond. The room and the
   city outside are built in vr-suite-room.js.
   DRAFT: the companions' names and all their lines are Claude's placeholders for David's review. Unvoiced.
   Characters: MakeHuman (CC0) with
   Quaternius animations (CC0). */
(function(){
 const {kit,spot}=VoidVRKit;
 const companions={
  f:{look:'vr-companion-f',name:'Seren',role:'VR COMPANION',about:'Warm, quick-witted and a little teasing. She notices everything.'},
  m:{look:'vr-companion-m',name:'Kai',role:'VR COMPANION',about:'Calm, wry and attentive. He listens more than he talks.'}};
 // Lines (DRAFT for David's review). Each pool is drawn from without repeating the last line used.
 const lines={
  f:{greet:['There you are. I was starting to think the city kept you.','Hey, you. Come in, the view is better from over here.','You made it. Leave NeoChinatown at the door; it\'s just us up here.'],
   chat:['Up here, nobody is selling anything. I like that about this place.','I come out to the balcony when the sun goes down. Everything turns the colour of honey.','Tell me something nobody else knows about you. I\'ll keep it, I promise.','I like how quiet you get when you\'re thinking. It\'s a good look.','The rain never reaches this room. I made sure of it.'],
   compliment:['Careful. Keep saying things like that and I\'ll believe you.','Well. That\'s made my whole evening.','You\'re sweet. I noticed you noticed, by the way.'],
   flirt:['Is that a line? It\'s working, a little.','Mm. You\'re trouble. The good kind.','Say that again, slower.'],
   sit:['Room for two. Come here.','That\'s better. I like having you close.'],
   dance:['Is that an invitation? Then lead.','Don\'t look at your feet. Look at me.','See? You\'re a natural.'],
   hands:['Your hands are warm.','There. Now don\'t let go too soon.'],
   kiss:['Come here.'],kissAfter:['Mm. I was hoping you\'d do that.','Well. That was worth waiting for.'],
   notYet:['Slow down, you. Talk to me a little first.','Not yet. I like the anticipation.'],
   notNow:['Sit with me first, or ask me to dance.'],
   relax:['Just breathe. Nothing out there can find you in here.','This is nice. No need to say anything.'],
   bye:['Go on, then. Come back soon; I\'ll keep the lights low.','Goodnight. Don\'t let the city keep you too long.']},
  m:{greet:['Hey. Glad you came up. The city can wait an hour.','There you are. Come in, the view is the best part.','You look like you need somewhere quiet. You found it.'],
   chat:['Up here it\'s just the sea and the sky. No ads, no drones.','I like this hour. The light goes soft and everything slows down.','You don\'t have to tell me about your day. But I\'d listen.','You\'re easy to be around. Not many people are.','I keep the window open a little. The air smells like salt.'],
   compliment:['Now you\'re just being kind. Keep going.','That\'s the best thing I\'ve heard all week.','You\'ve got a way with words. I noticed.'],
   flirt:['Is that so? Tell me more.','You\'re dangerous. I like it.','Say it like you mean it.'],
   sit:['Sit with me.','Better. I like you here.'],
   dance:['Then dance with me. No one\'s watching.','Follow me. There. Just like that.','See? Nothing to it.'],
   hands:['Steady hands.','Stay a while.'],
   kiss:['Come here.'],kissAfter:['I\'ve been wanting to do that.','Well. Hello to you too.'],
   notYet:['Let\'s talk a little first. I like getting to know you.','Not yet. There\'s no rush.'],
   notNow:['Come sit with me, or ask me to dance.'],
   relax:['Close your eyes for a minute. I\'ve got the watch.','This is good. Just this.'],
   bye:['Go on. Come back when the city gets loud.','Goodnight. The view will be here.']}};
 const pick=(pool,mem,key)=>{const options=pool.filter(l=>l!==mem[key]);const l=options[Math.floor(Math.random()*options.length)]||pool[0];mem[key]=l;return l;};
 // The apartment: 12 x 10 m, the bed against the fluted wall to the north, floor-to-ceiling glass to the east with a
 // sliding door onto a balcony, the lounge to the west, the desk and shelves to the south.
 // The sofa seat is angled toward the cushion beside it, so a companion sitting there is in view.
 const seats={sofa:{x:-4.4,z:-1.2,yaw:.4,eye:1.1},sofa2:{x:-3.6,z:.2,yaw:Math.PI/2,eye:1.1},bed:{x:1.2,z:3.2,yaw:Math.PI/2,eye:1.08},bed2:{x:-1.2,z:3.2,yaw:-Math.PI/2,eye:1.08},armchair:{x:4.3,z:-3.4,yaw:.9,eye:1.08},balcony:{x:8.4,z:0,yaw:Math.PI/2,eye:1.6}};
 const home=[3.6,.3];
 function layout(){const wall=(id,x,z,w,d)=>({id:'vr-'+id,position:[x,1.5,z],size:[w,3,d]});
  return {id:'vr-suite',name:'VR · PLAY IN A BEDROOM',bounds:[11,7],spawn:[-3,1.7,-3.9],yaw:.5,music:null,signs:[],
   solids:[wall('w-n',0,5.1,12.4,.3),wall('w-s',0,-5.1,12.4,.3),wall('w-w',-6.1,0,.3,10),wall('w-e1',6.1,-3.1,.3,3.8),wall('w-e2',6.1,3.1,.3,3.8),
    {id:'vr-rail',position:[8.95,.55,0],size:[.2,1.1,5.4]},{id:'vr-rail-n',position:[7.5,.55,2.75],size:[3,1.1,.2]},{id:'vr-rail-s',position:[7.5,.55,-2.75],size:[3,1.1,.2]},
    {id:'vr-bed',position:[0,.4,3.55],size:[3,.8,2.75]},{id:'vr-nightstand-l',position:[-2.15,.4,4.72],size:[.66,.8,.5]},{id:'vr-nightstand-r',position:[2.15,.4,4.72],size:[.66,.8,.5]},
    {id:'vr-sofa',position:[-4.72,.4,-.5],size:[1.05,.8,2.7]},{id:'vr-table',position:[-2.8,.2,-.7],size:[.7,.4,1.25]},{id:'vr-armchair',position:[4.3,.4,-3.4],size:[.95,.8,.95]},
    {id:'vr-desk',position:[1.4,.4,-4.7],size:[1.8,.8,.6]},{id:'vr-credenza',position:[-2.3,.4,-4.78],size:[2.6,.8,.5]},{id:'vr-lamp',position:[-5.5,.4,-2.6],size:[.35,.8,.35]},
    {id:'vr-plant-n',position:[5.3,.4,4.35],size:[.6,.8,.6]},{id:'vr-plant-s',position:[-5.35,.4,-4.3],size:[.6,.8,.6]}],
   interactions:[spot('companion','TALK',0,0,2.6),spot('lamp','MOOD LIGHTING',-2.8,4.2,1.8),spot('music','MUSIC',1.4,-3.9,1.8),spot('curtains','CURTAINS',5.2,-2.6,2),
    spot('sit-sofa','SIT ON THE SOFA',-3.8,-1.2,1.8),spot('sit-bed','SIT ON THE BED',1.9,3.2,1.8),spot('sit-armchair','SIT IN THE ARMCHAIR',3.8,-2.8,1.6),spot('balcony','LEAN ON THE BALCONY RAIL',8.3,0,2.2)]};}
 async function build(ctx){
  const k=kit(ctx),B=k.B,api=ctx.api,who=companions[ctx.opts.choice]||companions.f,L=lines[ctx.opts.choice]||lines.f,mem={};
  // Night: little sky light, a violet glow from the city through the glass, deep haze over the streets.
  k.light({clear:[.012,.008,.02],fog:[.14,.06,.16],fogDensity:.0028,sunColor:[.5,.42,.85],sunIntensity:.4,sunDir:[-1,-.35,.1],sky:[.5,.38,.62],ground:[.18,.11,.15],ambient:1,exposure:1.45,contrast:1.1,env:.3});
  const room=await VoidVRSuiteRoom.build(k,ctx);k.every((dt,t)=>room.tick(dt,t));
  const moods={warm:{label:'Warm'},rose:{label:'Rose'},night:{label:'Night'},candle:{label:'Candlelight'}};
  function mood(name){room.mood(name);k.mood=moods[name]?name:'rose';}
  mood(ctx.settings.mood||'rose');room.music(ctx.settings.music||'lounge');
  // The companion.
  const container=await VoidAssets.loadContainer({src:'assets/models/crowd/'+who.look+'.glb'},k.scene,ctx.task,'vr:'+who.look);(k._containers||(k._containers=[])).push(container);
  const inst=container.instantiateModelsToScene(n=>who.look+'-'+n,false,{doNotInstantiate:true}),node=new B.TransformNode('vr-companion',k.scene),asset=new B.TransformNode('vr-companion-asset',k.scene);node.parent=k.parent;asset.parent=node;for(const r of inst.rootNodes)r.parent=asset;
  for(const g of inst.animationGroups)g.stop();node.metadata={animationGroups:inst.animationGroups};for(const m of node.getChildMeshes())m.isPickable=false;
  const anim=VoidCrowd.animate(node,who.look,'idle');node.position.set(home[0],0,home[1]);node.rotation.y=-Math.PI/2;
  // Companion behaviour: a small state machine. 'idle' turns to face you; 'walk' goes somewhere; 'sit', 'dance'.
  room.follow(node,()=>c.sitting?1.25:1.72);
  const c={state:'idle',target:null,then:null,affection:0,sitting:false,dancing:false,yaw:0};
  const face=(x,z,dt,rate=3)=>{const want=Math.atan2(x-node.position.x,z-node.position.z),d=((want-node.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI;node.rotation.y+=d*Math.min(1,dt*rate);};
  function walkTo(x,z,then){c.state='walk';c.target=[x,z];c.then=then;c.sitting=false;anim.play('walk');}
  function stand(){if(c.sitting){c.sitting=false;try{anim.playOnce?.('sit-exit','idle');}catch{anim.play('idle');}}}
  k.every((dt)=>{
   if(c.state==='walk'){const [x,z]=c.target,dx=x-node.position.x,dz=z-node.position.z,d=Math.hypot(dx,dz);face(x,z,dt,6);if(d<.08){c.state='idle';anim.play('idle');const t=c.then;c.then=null;t?.();}else{const st=Math.min(d,1.25*dt);node.position.x+=dx/d*st;node.position.z+=dz/d*st;}}
   else if(c.state==='sit'){c.yaw+=0;}
   else face(walker.x,walker.z,dt);
   // Interaction spot follows the companion.
   const sp=walkingLocation?.interactions.find(i=>i.id==='vr-companion');if(sp){sp.position[0]=node.position.x;sp.position[2]=node.position.z;sp.label='TALK TO '+who.name.toUpperCase();}});
  // ---- Conversation: the game's own dialogue panel, with a choice menu ----
  const say=(text,done,label='CONTINUE')=>{talk('',[{who:who.name,text}],()=>{done?done():resumeWalking();},label);anim.play(c.sitting?'sit-talk':c.dancing?'dance':'talk');};
  let choices=null;
  function menu(){const opts=[['Chat',chat],['Compliment them',compliment],['Flirt',flirt],['Sit together',sitTogether],[c.dancing?'Stop dancing':'Dance together',dance],['Hold hands',hands],['Kiss',kiss],['Relax together',relax],['Say goodnight',goodbye],['Never mind',()=>{resumeWalking();idle();}]];
   const opening=c.greeted?pick(L.chat,mem,'menu'):pick(L.greet,mem,'greet');c.greeted=true;say(opening,()=>{},'');
   speech.shown=speech.lines[0].text.length;$('speech-next').style.display='none';screen.querySelector('.dialogue-window')?.classList.add('choice-menu');
   choices=opts;screen.querySelector('.speech-controls')?.insertAdjacentHTML('beforeend',opts.map(([l],i)=>button(l.toUpperCase(),'vr-choice:'+i,i===opts.length-1)).join(''));}
  screen.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(!a?.startsWith('vr-choice:')||!choices)return;const f=choices[+a.slice(10)][1];choices=null;speech=null;f();});
  const idle=()=>{anim.play(c.sitting?'sit':c.dancing?'dance':'idle');};
  function chat(){say(pick(L.chat,mem,'chat'),()=>{resumeWalking();idle();});}
  function compliment(){c.affection++;say(pick(L.compliment,mem,'compliment'),()=>{resumeWalking();idle();});}
  function flirt(){c.affection++;try{anim.playOnce?.('interact',c.sitting?'sit':'idle');}catch{}say(pick(L.flirt,mem,'flirt'),()=>{resumeWalking();idle();});}
  function sitTogether(){c.dancing=false;resumeWalking();const s=seats.sofa2;walkTo(s.x-.1,s.z+.35,()=>{node.rotation.y=Math.PI/2;node.position.set(-4.32,0,s.z);c.sitting=true;try{anim.playOnce?.('sit-enter','sit');}catch{anim.play('sit');}});
   api.sit({...seats.sofa,text:pick(L.sit,mem,'sit')});}
  function dance(){if(c.dancing){c.dancing=false;idle();resumeWalking();return;}stand();c.dancing=true;if(!api.session.settings.music||api.session.settings.music==='off'){api.setPad('velvet');room.music('velvet');api.session.settings.music='velvet';}
   walkTo(walker.x+Math.sin(walker.yaw)*1.2,walker.z+Math.cos(walker.yaw)*1.2,()=>{anim.play('dance');});say(pick(L.dance,mem,'dance'),()=>{resumeWalking();anim.play('dance');});}
  function hands(){c.affection++;const near=Math.hypot(walker.x-node.position.x,walker.z-node.position.z);if(!c.sitting&&near>1.3)walkTo(walker.x+Math.sin(walker.yaw)*.8,walker.z+Math.cos(walker.yaw)*.8,()=>{try{anim.playOnce?.('interact','idle');}catch{}});
   else try{anim.playOnce?.('interact',c.sitting?'sit':'idle');}catch{}say(pick(L.hands,mem,'hands'),()=>{resumeWalking();idle();});}
  // A kiss is the companion's choice too: only when you've been close (sitting or dancing) and talking a while.
  function kiss(){if(!c.sitting&&!c.dancing)return say(pick(L.notNow,mem,'notNow'));if(c.affection<3)return say(pick(L.notYet,mem,'notYet'));
   say(L.kiss[0],()=>{resumeWalking();k.kiss=1.6;api.sfx(520,1.2,'sine',.02);setTimeout(()=>{if(api.session)say(pick(L.kissAfter,mem,'kissAfter'),()=>{resumeWalking();idle();});},1700);});}
  function relax(){c.affection++;if(!c.sitting)return sitTogether();say(pick(L.relax,mem,'relax'),()=>{resumeWalking();idle();});}
  function goodbye(){say(pick(L.bye,mem,'bye'),()=>{api.exit();},'EXIT VR →');}
  // The kiss: the companion leans in and the view softens into a warm glow for a moment (nothing explicit).
  k.overlayFn=(g,W,H)=>{if(!(k.kiss>0))return;const a=Math.sin(Math.min(1,k.kiss/1.6)*Math.PI);g.save();const r=g.createRadialGradient(W/2,H/2,H*.2,W/2,H/2,H*.9);r.addColorStop(0,'rgba(255,170,150,'+a*.25+')');r.addColorStop(1,'rgba(40,10,20,'+a*.85+')');g.fillStyle=r;g.fillRect(0,0,W,H);g.restore();};
  k.every(dt=>{if(k.kiss>0)k.kiss-=dt;});
  const dispose=()=>{for(const c2 of k._containers||[])c2.dispose();k.dispose();};
  return {tick:k.tick,dispose,anim,companion:node,overlay:(g,W,H)=>k.overlayFn(g,W,H),
   onEnter(){setTimeout(()=>{if(api.session&&mode==='walking'){c.greeted=true;say(pick(L.greet,mem,'greet'));}},1200);},
   onStand(){if(c.sitting){stand();c.state='idle';walkTo(...home);}},
   interact(item){const id=item.id.slice(3);
    if(id==='companion')menu();
    else if(id==='lamp'){const order=Object.keys(moods),next=order[(order.indexOf(k.mood)+1)%order.length];mood(next);api.session.settings.mood=next;announce('Lighting: '+moods[next].label+'.');}
    else if(id==='music'){const order=['off','lounge','velvet','midnight'],next=order[(order.indexOf(api.session.settings.music||'off')+1)%order.length];api.setPad(next);room.music(next);api.session.settings.music=next;announce('Music: '+(next==='off'?'off':next)+'.');}
    else if(id==='curtains'){k.curtainsOpen=!k.curtainsOpen;room.curtains(k.curtainsOpen);announce(k.curtainsOpen?'You draw the curtains back. NeoChinatown glows below.':'The curtains close softly.');}
    else if(id.startsWith('sit-')||id==='balcony'){const s=seats[id.replace('sit-','')]||seats.balcony;api.sit({...s,text:id==='balcony'?'You lean on the rail. The city hums far below, all neon and rain-haze.':'You sit down. The room is quiet and soft.'});}},
   setOption(key,val){if(key==='mood')mood(val);if(key==='music'){api.setPad(val);room.music(val);}}};
 }
 VoidVR.register({id:'suite',title:'Play in a Bedroom',status:'ready',station:1,tint:'linear-gradient(135deg,#1a0820,#ff2d96)',preview:'void-runner/assets/vr/preview-suite.jpg',
  description:'A private apartment high above NeoChinatown at night, with an adult companion of your choice. Talk, sit together, dance, or simply enjoy the room. Romance is optional and never explicit.',
  options:{prompt:'Choose your companion. Both are original adult characters of this simulation.',choices:[{id:'f',label:'Female Companion · Seren',description:companions.f.about},{id:'m',label:'Male Companion · Kai',description:companions.m.about}]},
  defaults:{mood:'rose',music:'lounge'},settings:[{key:'mood',label:'Mood lighting',values:[['warm','Warm'],['rose','Rose'],['night','Night'],['candle','Candlelight']]},{key:'music',label:'Music',values:[['off','Off'],['lounge','Lounge'],['velvet','Velvet'],['midnight','Midnight']]}],
  ambience:()=>({waves:.018,pad:'lounge'}),layout,build});
})();
