/* VR experience: Play in a Bedroom. A private virtual suite above a dusk sea, with an original adult companion
   chosen before launch (Seren or Kai). The companion greets you, keeps eye contact, talks, walks, sits with you,
   dances, holds hands and, when the moment is right and you choose it, shares a kiss. Everything is optional and
   non-explicit; you can simply enjoy the room. Mood lighting, music, curtains and seating respond.
   DRAFT: the companions' names and all their lines are Claude's placeholders for David's review. Unvoiced.
   Furniture: Quaternius Ultimate House Interior (CC0) and Poly Haven (CC0); characters: MakeHuman (CC0) with
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
 // The suite: 12 x 10 m, the window wall to the east, a balcony beyond its glass door.
 // The sofa seat is angled toward the cushion beside it, so a companion sitting there is in view.
 const seats={sofa:{x:-3.6,z:-1.2,yaw:.8,eye:1.12},sofa2:{x:-3.6,z:.2,yaw:Math.PI/2,eye:1.12},bed:{x:.6,z:2.6,yaw:Math.PI,eye:1.15},bed2:{x:-.6,z:2.6,yaw:Math.PI,eye:1.15},armchair:{x:2,z:-3.4,yaw:-.6,eye:1.12},balcony:{x:8.2,z:0,yaw:Math.PI/2,eye:1.6}};
 function layout(){const wall=(id,x,z,w,d)=>({id:'vr-'+id,position:[x,1.5,z],size:[w,3,d]});
  return {id:'vr-suite',name:'VR · PLAY IN A BEDROOM',bounds:[11,7],spawn:[-4.5,1.7,-3.6],yaw:Math.PI/3,music:null,signs:[],
   solids:[wall('w-n',0,5.1,12.4,.3),wall('w-s',0,-5.1,12.4,.3),wall('w-w',-6.1,0,.3,10),wall('w-e1',6.1,-3.1,.3,4),wall('w-e2',6.1,3.1,.3,4),
    {id:'vr-rail',position:[9.6,.55,0],size:[.2,1.1,6]},{id:'vr-rail-n',position:[7.85,.55,3],size:[3.5,1.1,.2]},{id:'vr-rail-s',position:[7.85,.55,-3],size:[3.5,1.1,.2]},
    {id:'vr-bed',position:[0,.4,3.6],size:[2.4,.8,2.6]},{id:'vr-sofa',position:[-4.6,.4,-.5],size:[1.1,.8,2.6]},{id:'vr-armchair',position:[2.6,.4,-4],size:[1,.8,1]}],
   interactions:[spot('companion','TALK',0,0,2.6),spot('lamp','MOOD LIGHTING',-2.1,3.9,1.8),spot('music','MUSIC',4.6,-4.4,1.8),spot('curtains','CURTAINS',5.6,-1.4,2),
    spot('sit-sofa','SIT ON THE SOFA',-3.6,-1.2,1.8),spot('sit-bed','SIT ON THE BED',.6,2,1.8),spot('sit-armchair','SIT IN THE ARMCHAIR',2,-3.2,1.6),spot('balcony','LEAN ON THE BALCONY RAIL',8.6,0,2.2)]};}
 async function build(ctx){
  const k=kit(ctx),B=k.B,api=ctx.api,who=companions[ctx.opts.choice]||companions.f,L=lines[ctx.opts.choice]||lines.f,mem={};
  k.light({clear:[.2,.12,.16],fog:[.5,.35,.35],fogDensity:.0015,sunColor:[1,.7,.5],sunIntensity:.5,sunDir:[-.9,-.3,.1],sky:[.9,.75,.7],ground:[.3,.22,.2],ambient:.55,exposure:1.05,env:.8});
  k.sky('suite-dusk',Math.PI/2);
  // Room shell: wood floor, papered walls, a pale ceiling, a picture window and a glass balcony door.
  const floor=k.material('floor',{color:'wood-floor-color',normal:'wood-floor-normal',scale:5,hex:'#d8c2a8',spec:.25});k.box('floor',[12.2,.1,10.2],[0,-.05,0],floor);
  const paper=k.material('paper',{color:'wallpaper-color',normal:'wallpaper-normal',scale:3,hex:'#efe2d8'}),ceil=k.material('ceiling',{hex:'#f4efe8'}),trim=k.material('trim',{hex:'#2a2226'});
  k.box('wall-n',[12.4,3.2,.2],[0,1.6,5.1],paper);k.box('wall-s',[12.4,3.2,.2],[0,1.6,-5.1],paper);k.box('wall-w',[.2,3.2,10.2],[-6.1,1.6,0],paper);
  k.box('wall-e1',[.2,3.2,3.2],[6.1,1.6,-3.5],paper);k.box('wall-e2',[.2,3.2,3.2],[6.1,1.6,3.5],paper);k.box('wall-e-top',[.2,.5,3.8],[6.1,2.95,0],paper);k.box('ceiling',[12.4,.1,10.4],[0,3.25,0],ceil);
  const glass=k.material('glass',{hex:'#a8c8d8',spec:.9});glass.alpha=.18;glass.backFaceCulling=false;k.box('door-glass',[.05,2.7,3.8],[6.1,1.35,0],glass);for(const z of [-1.9,0,1.9])k.box('door-frame',[.1,2.7,.08],[6.1,1.35,z],trim);
  k.box('window-glass',[.05,1.8,2.6],[-6.05,1.7,0],glass);
  // Balcony: deck, glass rail, the sea beyond.
  const deck=k.material('deck',{color:'wood-floor-color',scale:3,hex:'#a88a6a'});k.box('balcony',[3.6,.1,6],[7.9,-.05,0],deck);
  for(const [s,p] of [[[.06,1,6],[9.65,.55,0]],[[3.6,1,.06],[7.9,.55,3]],[[3.6,1,.06],[7.9,.55,-3]]])k.box('rail-glass',s,p,glass);k.box('rail-top',[.08,.06,6],[9.65,1.08,0],trim);
  const sea=k.water('sea',{hex:'#3a3f62',alpha:1,sky:'suite-dusk',scale:40,reflect:.3,spec:.5});k.mesh(B.MeshBuilder.CreateGround('vr-sea',{width:3000,height:3000},k.scene),sea,[0,-25,0]);
  // Furniture.
  const names=['bed','nightstand','floor-lamp','rug','curtains','houseplant','sofa','armchair','plant','ceiling-lamp'],M=Object.fromEntries(await Promise.all(names.map(async n=>[n,await k.model(n)])));
  k.place(M.bed,[0,0,3.6],Math.PI,1.25);for(const x of [-1.9,1.9])k.place(M.nightstand,[x,0,4.5],Math.PI,1.1);k.place(M['floor-lamp'],[-2.6,0,4.4],0,1.1);k.place(M['floor-lamp'],[4.9,0,-4.4],0,1.1);
  k.place(M.rug,[0,.01,0],0,2.2);k.place(M.sofa,[-4.7,0,-.5],Math.PI/2,1.1);k.place(M.armchair,[2.6,0,-4],-.6+Math.PI,1.05);k.place(M.plant,[-5.4,0,-4.4],0,1.2);k.place(M.houseplant,[5.4,0,4.5],0,1.4);
  const curtains=[-1,1].map(s=>k.place(M.curtains,[6,0,s*1.9],-Math.PI/2,1.1));k.place(M['ceiling-lamp'],[0,3.2,0],0,1);
  // Music console and the lamp switch.
  k.box('console',[.9,.8,.45],[4.6,.4,-4.75],trim);const consoleScreen=k.box('console-screen',[.7,.25,.04],[4.6,.86,-4.5],k.glow('console-screen','#ff7fb4',.8));
  // Mood lighting: two lamp lights and a soft fill, recoloured by preset.
  const lamps=[new B.PointLight('vr-lamp-a',new B.Vector3(-2.6,1.9,4.2),k.scene),new B.PointLight('vr-lamp-b',new B.Vector3(4.6,1.9,-4.2),k.scene),new B.PointLight('vr-fill',new B.Vector3(0,2.8,0),k.scene)];k._own=lamps;lamps.forEach(l=>{l.range=12;});
  const moods={warm:{c:['#ffb070','#ffb070','#ffd8b0'],i:[1.1,.9,.35],label:'Warm'},rose:{c:['#ff6a9a','#ff8ab0','#ffb0c8'],i:[1,.9,.3],label:'Rose'},night:{c:['#5a7aff','#7a6aff','#304060'],i:[.7,.6,.2],label:'Night'},candle:{c:['#ff8a3a','#ff7a2a','#3a2010'],i:[.75,.55,.1],label:'Candlelight'}};
  function mood(name){const m=moods[name]||moods.warm;lamps.forEach((l,i)=>{l.diffuse=B.Color3.FromHexString(m.c[i]);l.intensity=m.i[i];});k.mood=name;}
  mood(ctx.settings.mood||'warm');
  // The companion.
  const container=await VoidAssets.loadContainer({src:'assets/models/crowd/'+who.look+'.glb'},k.scene,ctx.task,'vr:'+who.look);(k._containers||(k._containers=[])).push(container);
  const inst=container.instantiateModelsToScene(n=>who.look+'-'+n,false,{doNotInstantiate:true}),node=new B.TransformNode('vr-companion',k.scene),asset=new B.TransformNode('vr-companion-asset',k.scene);node.parent=k.parent;asset.parent=node;for(const r of inst.rootNodes)r.parent=asset;
  for(const g of inst.animationGroups)g.stop();node.metadata={animationGroups:inst.animationGroups};for(const m of node.getChildMeshes())m.isPickable=false;
  const anim=VoidCrowd.animate(node,who.look,'idle');node.position.set(3.4,0,.6);
  // Companion behaviour: a small state machine. 'idle' turns to face you; 'walk' goes somewhere; 'sit', 'dance'.
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
  function sitTogether(){c.dancing=false;resumeWalking();const s=seats.sofa2;walkTo(s.x+.6,s.z,()=>{node.rotation.y=Math.PI/2;node.position.set(-4.1,0,s.z);c.sitting=true;try{anim.playOnce?.('sit-enter','sit');}catch{anim.play('sit');}});
   api.sit({...seats.sofa,text:pick(L.sit,mem,'sit')});}
  function dance(){if(c.dancing){c.dancing=false;idle();resumeWalking();return;}stand();c.dancing=true;if(!api.session.settings.music||api.session.settings.music==='off'){api.setPad('velvet');api.session.settings.music='velvet';}
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
  const dispose=()=>{for(const l of k._own||[])l.dispose();for(const c2 of k._containers||[])c2.dispose();k.dispose();};
  return {tick:k.tick,dispose,anim,companion:node,overlay:(g,W,H)=>k.overlayFn(g,W,H),
   onEnter(){setTimeout(()=>{if(api.session&&mode==='walking'){c.greeted=true;say(pick(L.greet,mem,'greet'));}},1200);},
   onStand(){if(c.sitting){stand();c.state='idle';walkTo(3.4,.6);}},
   interact(item){const id=item.id.slice(3);
    if(id==='companion')menu();
    else if(id==='lamp'){const order=Object.keys(moods),next=order[(order.indexOf(k.mood)+1)%order.length];mood(next);api.session.settings.mood=next;announce('Lighting: '+moods[next].label+'.');}
    else if(id==='music'){const order=['off','lounge','velvet','midnight'],next=order[(order.indexOf(api.session.settings.music||'off')+1)%order.length];api.setPad(next);api.session.settings.music=next;announce('Music: '+(next==='off'?'off':next)+'.');}
    else if(id==='curtains'){k.curtainsOpen=!k.curtainsOpen;curtains.forEach((n,i)=>n.position.z=(i?1:-1)*(k.curtainsOpen?3.2:1.9));announce(k.curtainsOpen?'You draw the curtains back. The sea glows below.':'The curtains close softly.');}
    else if(id.startsWith('sit-')||id==='balcony'){const s=seats[id.replace('sit-','')]||seats.balcony;api.sit({...s,text:id==='balcony'?'You lean on the rail. Warm air comes up off the water.':'You sit down. The room is quiet and soft.'});}},
   setOption(key,val){if(key==='mood')mood(val);if(key==='music')api.setPad(val);}};
 }
 VoidVR.register({id:'suite',title:'Play in a Bedroom',status:'ready',station:1,tint:'linear-gradient(135deg,#3a1022,#ff7fb4)',preview:'void-runner/assets/vr/sky/suite-dusk.jpg',
  description:'A private suite above a dusk sea, with an adult companion of your choice. Talk, sit together, dance, or simply enjoy the room. Romance is optional and never explicit.',
  options:{prompt:'Choose your companion. Both are original adult characters of this simulation.',choices:[{id:'f',label:'Female Companion · Seren',description:companions.f.about},{id:'m',label:'Male Companion · Kai',description:companions.m.about}]},
  defaults:{mood:'warm',music:'lounge'},settings:[{key:'mood',label:'Mood lighting',values:[['warm','Warm'],['rose','Rose'],['night','Night'],['candle','Candlelight']]},{key:'music',label:'Music',values:[['off','Off'],['lounge','Lounge'],['velvet','Velvet'],['midnight','Midnight']]}],
  ambience:()=>({waves:.025,pad:'lounge'}),layout,build});
})();
