/* Relay screens at Meridian (David's Relay brief §27, animated per his Meridian brief Phase 7). Every screen is
   a live channel: it cycles through slides (each news story the player has received, the stations' ads,
   the WarFlying standings and a station notice) with animated backgrounds and transitions, and a scrolling
   ticker. News slides read relay.js headlines(), so a screen and the radio never disagree; ad slides show the
   ads' own scripted lines. Screens show NO SIGNAL without a satellite link, and none exist in The Darknet
   District. Performance: one small canvas texture per screen, redrawn about 12 times a second only while the
   screen is on camera and near, and not at all otherwise. Screens are silent; sound stays with the radio. */
(function(){
 const R=VoidRelay;
 // Positions follow meridian-interior.js and stand clear of the wall dressing (meridian-interior-kit.js) and
 // the bar's lamps and canopy: a screen hanging at the hall entrance facing arrivals, one hanging in front of the Dead
 // Channel's back bar facing the stools, and two ad panels on the corridor's outer wall.
 const places=[
  {id:'hall',type:'news',position:[0,3.75,44.5],rotation:0,size:[3.4,1.91],ceiling:5,res:[1024,576]},
  {id:'bar',type:'news',position:[-13.9,3.95,53],rotation:-Math.PI/2,size:[2.8,1.575],ceiling:5,res:[1024,576]},
  {id:'corridor-ad-1',type:'ad',style:0,position:[1.84,1.85,13],rotation:Math.PI/2,size:[1.6,.9],res:[512,288]},
  {id:'corridor-ad-2',type:'ad',style:1,position:[1.84,1.85,26],rotation:Math.PI/2,size:[1.6,.9],res:[512,288]}
 ];
 const fps=12,range=26;
 // Reading time per slide (David: there wasn't enough time to read them): headlines 14 s, the station notice 9 s,
 // the standings 10 s, and ads about 5 s for each scripted line (12 s at least), one line at a time.
 const READ={news:14,standings:10,station:9},adTime=ad=>Math.max(12,R.lines(ad).length*5),TICKER=70;
 // The slide showing at time t in a playlist of {dur} slides, and how far into it.
 function at(list,t){const total=list.reduce((s,x)=>s+x.dur,0);if(!total)return null;let r=((t%total)+total)%total,i=0;for(;i<list.length-1&&r>=list[i].dur;i++)r-=list[i].dur;return {slide:list[i],index:i,local:r};}
 let screens=[],scene=null,timer=0,clock=0,data=null,dataTimer=0;
 // Every station is built on Meridian's plan, so every station hall has these screens, named for where you are.
 const atMeridian=()=>typeof walkingLocation!=='undefined'&&walkingLocation?.kind==='station'&&!!walkingLocation.rooms;
 const here=()=>(C.stations[state?.location]?.name||'Meridian Station').toUpperCase(),bar=()=>(C.stations[state?.location]?.bar||'The Dead Channel').toUpperCase();
 function build(){
  const B=BABYLON,s=VoidBabylon.scene;scene=s;
  screens=places.map((p,i)=>{
   const mesh=B.MeshBuilder.CreatePlane('relay-screen-'+p.id,{width:p.size[0],height:p.size[1]},s);mesh.position.set(...p.position);mesh.rotation.y=p.rotation;mesh.isPickable=false;
   const texture=new B.DynamicTexture('relay-screen-'+p.id,{width:p.res[0],height:p.res[1]},s,true),m=new B.StandardMaterial('relay-screen-'+p.id,s);
   m.diffuseTexture=texture;m.emissiveTexture=texture;m.disableLighting=true;m.specularColor=B.Color3.Black();mesh.material=m;
   const frame=B.MeshBuilder.CreateBox('relay-screen-frame-'+p.id,{width:p.size[0]+.16,height:p.size[1]+.16,depth:.08},s);frame.position.set(...p.position);frame.rotation.y=p.rotation;
   frame.locallyTranslate(new B.Vector3(0,0,.06));const fm=new B.StandardMaterial('relay-screen-frame',s);fm.diffuseColor=B.Color3.FromHexString('#20262b');frame.material=fm;frame.isPickable=false;
   // A hanging screen gets two ceiling rods.
   const rods=p.ceiling?[-1,1].map(side=>{const top=p.position[1]+p.size[1]/2,rod=B.MeshBuilder.CreateBox('relay-screen-rod',{width:.06,height:p.ceiling-top,depth:.06},s);const off=side*p.size[0]*.36;rod.position.set(p.position[0]+Math.cos(p.rotation)*off,(p.ceiling+top)/2,p.position[2]-Math.sin(p.rotation)*off);rod.material=fm;rod.isPickable=false;return rod;}):[];
   // Each screen runs on its own clock offset and playlist position, so no two show the same slide.
   return {place:p,mesh,frame,rods,texture,materials:[m,fm],offset:i*3.7+(p.id==='bar'?24:0),glitchAt:6+i*4.3,glitch:0};
  });
 }
 function release(){for(const s of screens){s.texture.dispose();for(const m of s.materials)m.dispose();s.mesh.dispose();s.frame.dispose();for(const r of s.rods)r.dispose();}screens=[];scene=null;}
 function wrap(g,text,x,y,width,lineHeight,max){const words=String(text).split(/\s+/);let line='',n=0;for(const w of words){const test=line?line+' '+w:w;if(g.measureText(test).width>width&&line){g.fillText(line,x,y+n*lineHeight);line=w;if(++n>=max)return;}else line=test;}if(line)g.fillText(line,x,y+n*lineHeight);}
 // What the screens show, refreshed every few seconds (not every frame).
 function refresh(){
  const content=VoidRelayRadio.content,news=state.relay||R.fresh(),link=VoidComms.status(state,{onFoot:true}),live=VoidComms.canUpload(link);
  const cards=live?R.headlines(news,content,{system:state.universe?.currentSystem||'erebus',clock:state.warflying?.clock||0,matches:w=>VoidStory.matches(state,w)},6):[];
  const db=state.warflying,board=db?VoidWarFlyingScan.leaderboard(db.clock,VoidWarFlying.points(db),'YOU').slice(0,5):[];
  const ads=(content.segments||[]).filter(s=>s.kind==='ad'||s.kind==='police');
  // A news channel's playlist: each story followed by an ad; the standings and a station notice once a cycle.
  const slides=[];let a=0;
  for(const card of cards){slides.push({type:'news',card});if(ads.length)slides.push({type:'ad',ad:ads[a++%ads.length]});}
  if(board.length)slides.push({type:'standings'});
  slides.push({type:'station'});
  while(slides.length<6&&ads.length)slides.push({type:'ad',ad:ads[a++%ads.length]});
  for(const s of slides)s.dur=s.type==='ad'?adTime(s.ad):READ[s.type];
  data={live,cards,board,ads,slides,adSlides:ads.map(ad=>({ad,dur:adTime(ad)})),ticker:[...cards.map(c=>c.headline),...board.length?['WARFLYING STANDINGS: '+board.map(r=>r.rank+'. '+r.name+' '+r.points).join('   ')]:[],here()+' · DOCKING OPEN · '+bar().replace(/^THE /,'')+' OPEN · OUTFITTER OPEN'].join('   ◆   ')};
 }
 const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3);
 // Moving news backdrop: a blue gradient with a travelling light band, drifting stripes, slow particles and an
 // orbit ring that turns in the corner, so the screen visibly lives even between slides.
 function backdrop(g,W,H,t,tint='#12324a'){
  const grad=g.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#071420');grad.addColorStop(.5+.35*Math.sin(t*.35),tint);grad.addColorStop(1,'#050c14');g.fillStyle=grad;g.fillRect(0,0,W,H);
  g.save();g.globalAlpha=.07;g.strokeStyle='#8fd4ee';g.lineWidth=18;for(let i=-2;i<10;i++){const x=((t*40+i*140)%(W+280))-140;g.beginPath();g.moveTo(x,H);g.lineTo(x+H*.6,0);g.stroke();}g.restore();
  const band=((t*.18)%1.6-.3)*W;const bg=g.createLinearGradient(band-120,0,band+120,0);bg.addColorStop(0,'rgba(159,227,201,0)');bg.addColorStop(.5,'rgba(159,227,201,.10)');bg.addColorStop(1,'rgba(159,227,201,0)');g.fillStyle=bg;g.fillRect(0,0,W,H);
  for(let i=0;i<24;i++){const x=(i*97+t*(14+i%5*6))%W,y=(i*53+Math.sin(t*.6+i)*30+H)%H;g.fillStyle='rgba(180,220,240,'+(.12+.1*Math.sin(t*2+i))+')';g.fillRect(x,y,3,3);}
  g.save();g.translate(W-120,H*.48);g.rotate(t*.5);g.strokeStyle='rgba(217,164,65,.35)';g.lineWidth=3;for(const r of [46,70]){g.beginPath();g.ellipse(0,0,r,r*.42,0,0,Math.PI*2);g.stroke();}g.fillStyle='rgba(217,164,65,.6)';g.beginPath();g.arc(70,0,6,0,Math.PI*2);g.fill();g.restore();
  g.fillStyle='rgba(255,255,255,.035)';for(let y=(t*30)%6;y<H;y+=6)g.fillRect(0,y,W,2);
 }
 function header(g,W,t,title,red){
  g.fillStyle=red?(Math.sin(t*6)>0?'#c8392d':'#9e2a20'):'#d9a441';g.fillRect(0,0,W,64);
  g.fillStyle='#071019';g.font='bold 34px monospace';g.textAlign='left';g.fillText(title,28,44);
  const now=new Date();g.font='bold 22px monospace';g.fillText(String(now.getHours()).padStart(2,'0')+(now.getSeconds()%2?':':' ')+String(now.getMinutes()).padStart(2,'0'),W-300,40);
  g.fillStyle=Math.sin(t*4)>0?'#e5413a':'#5a1a17';g.beginPath();g.arc(W-150,32,9,0,Math.PI*2);g.fill();g.fillStyle='#071019';g.fillText('LIVE',W-132,40);
 }
 // A slide's entry: a bright scan line sweeps down and the content slides in; at the end it slides out.
 function transition(g,W,H,local,per){
  if(local<.45){const y=ease(local/.45)*H;g.fillStyle='rgba(200,240,255,.55)';g.fillRect(0,y-3,W,6);g.fillStyle='rgba(200,240,255,.08)';g.fillRect(0,0,W,y);}
  if(local>per-.3){g.fillStyle='rgba(5,12,20,'+ease((local-(per-.3))/.3)+')';g.fillRect(0,64,W,H-164);}
 }
 function drawNewsSlide(g,W,H,t,local,card,dur){
  const breaking=card.kind==='breaking',inT=ease(local/.6),x=28+(1-inT)*-W*.5;
  backdrop(g,W,H,t,breaking?'#3a1414':'#12324a');header(g,W,t,breaking?'THE RELAY · BREAKING':'THE RELAY',breaking);
  g.save();g.beginPath();g.rect(0,70,W,H-170);g.clip();
  g.fillStyle=breaking?'#ff8a7a':'#9fe3c9';g.font='bold 30px monospace';g.fillText((R.perspectives[card.perspective]||'')+(card.standing?' · '+(R.standings[card.standing]||'').toUpperCase():''),x,116);
  g.fillStyle='#f0ece2';g.font='bold 58px system-ui,sans-serif';wrap(g,card.headline,x,196,W-210,68,3);
  g.fillStyle='#d9a441';g.fillRect(28,140,Math.min(W-60,(local/dur)*(W-60)),4);g.restore();
 }
 function drawStandings(g,W,H,t,local,board){
  backdrop(g,W,H,t,'#1d2a12');header(g,W,t,'WARFLYING · STANDINGS',false);
  const max=Math.max(1,...board.map(r=>r.points));
  board.forEach((r,i)=>{const y=110+i*62,grow=ease((local-.3-i*.15)/.9),w=(W-420)*(r.points/max)*grow;
   g.fillStyle=r.name==='YOU'?'#9fe3c9':'#d9a441';g.fillRect(260,y-30,w,40);g.fillStyle='#f0ece2';g.font='bold 32px monospace';g.fillText(r.rank+'. '+r.name,28,y);g.fillText(String(Math.round(r.points*grow)),270+w,y);});
 }
 function drawStation(g,W,H,t,local){
  backdrop(g,W,H,t,'#14243a');header(g,W,t,here(),false);
  const rows=[['DOCKING','OPEN'],[bar(),'OPEN'],['SHIP OUTFITTER','OPEN'],['LIVING AREA','PODS AVAILABLE']];
  rows.forEach(([k,v],i)=>{const y=140+i*70,show=ease((local-.2-i*.2)/.5);g.globalAlpha=show;g.fillStyle='#9fb6c6';g.font='bold 34px monospace';g.fillText(k,40+(1-show)*-60,y);
   g.fillStyle=Math.sin(t*3+i)>-.2?'#9fe3c9':'#6fb79b';g.textAlign='right';g.fillText(v,W-60,y);g.textAlign='left';g.globalAlpha=1;});
 }
 // Ad styles: 0 a product sweep with line-by-line pop-in, 1 a holographic ring, 2 recruitment colour blocks.
 // Sized from the panel's height, so the same ad fills a big news screen or a small corridor panel.
 function drawAdSlide(g,W,H,t,local,per,ad,styleSeed){
  const k=H/288,lines=R.lines(ad),line=lines[Math.min(lines.length-1,Math.floor(local/(per/lines.length)))],police=ad.kind==='police',style=police?2:styleSeed%2;
  if(style===0){const grad=g.createLinearGradient(0,0,W,0),p=(local/per);grad.addColorStop(0,'#1a0f2e');grad.addColorStop(Math.min(1,p),'#4a2672');grad.addColorStop(1,'#0c0716');g.fillStyle=grad;g.fillRect(0,0,W,H);
   for(let i=0;i<6;i++){g.strokeStyle='rgba(255,140,220,'+(.18+.12*Math.sin(t*2+i))+')';g.lineWidth=2*k;g.beginPath();g.moveTo(((t*80*k+i*90*k)%(W+200*k))-100*k,0);g.lineTo(((t*80*k+i*90*k)%(W+200*k))-220*k,H);g.stroke();}}
  else if(style===1){g.fillStyle='#03121a';g.fillRect(0,0,W,H);g.save();g.translate(W*.82,H*.5);g.rotate(t*.8);g.strokeStyle='rgba(110,230,255,'+(.55+.25*Math.sin(t*9))+')';g.lineWidth=3*k;for(let r=30;r<=90;r+=30){g.beginPath();g.ellipse(0,0,r*k,r*k*.45,0,0,Math.PI*2);g.stroke();}g.restore();
   g.fillStyle='rgba(110,230,255,.07)';for(let y=(t*40)%4;y<H;y+=4)g.fillRect(0,y,W,1);}
  else{const flip=Math.floor(t*2.5)%2;g.fillStyle=flip?'#0b2a6b':'#a3161a';g.fillRect(0,0,W,H);g.fillStyle=flip?'#a3161a':'#0b2a6b';g.fillRect(0,H-40*k,W,40*k);g.fillStyle='#ffffff';g.fillRect(0,H-44*k,W,4*k);}
  // The headline, then the current line popping in.
  const pop=ease((local%(per/lines.length))/.35);
  g.fillStyle=style===1?'#8ff0ff':'#ffd27a';g.font='bold '+Math.round(22*k)+'px monospace';g.textAlign='left';g.fillText((ad.headline||'').toUpperCase(),18*k,36*k);
  g.globalAlpha=pop;g.fillStyle='#ffffff';g.font='bold '+Math.round((style===2?30:28)*k)+'px system-ui,sans-serif';wrap(g,line,18*k+(1-pop)*30*k,92*k,style===1?W*.62:W-36*k,34*k,5);g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.55)';g.font=Math.round(14*k)+'px monospace';g.fillText(police?'PAID RECRUITMENT NOTICE':'ADVERTISEMENT',18*k,H-14*k);
 }
 function drawNews(s,t){
  const g=s.texture.getContext(),[W,H]=s.place.res,{slides,ticker,live,board}=data;
  if(!live){backdrop(g,W,H,t,'#1a1f26');header(g,W,t,'THE RELAY',false);g.fillStyle='#8a96a3';g.font='bold 64px monospace';g.fillText('NO SIGNAL',28,260);for(let i=0;i<40;i++){g.fillStyle='rgba(200,210,220,'+(Math.random()*.15)+')';g.fillRect(Math.random()*W,64+Math.random()*(H-64),Math.random()*120,2);}glitch(g,s,t,W,H);return;}
  const now=at(slides,t),slide=now.slide,local=now.local,dur=slide.dur;
  if(slide.type==='news')drawNewsSlide(g,W,H,t,local,slide.card,dur);
  else if(slide.type==='standings')drawStandings(g,W,H,t,local,board);
  else if(slide.type==='station')drawStation(g,W,H,t,local);
  else drawAdSlide(g,W,H,t,local,dur,slide.ad,now.index);
  transition(g,W,H,local,dur);
  // Scrolling ticker under every slide.
  g.fillStyle='#0d1c28';g.fillRect(0,H-100,W,100);g.fillStyle='#d9a441';g.fillRect(0,H-100,W,4);
  if(ticker){g.font='bold 34px monospace';g.textAlign='left';const width=g.measureText(ticker+'   ◆   ').width,x=W-(t*TICKER)%(width+W);g.fillStyle='#e6e1d6';g.fillText(ticker+'   ◆   '+ticker,x,H-38);}
  glitch(g,s,t,W,H);
 }
 function drawAd(s,t){
  const g=s.texture.getContext(),[W,H]=s.place.res,{ads,live}=data;
  if(!live||!ads.length){g.fillStyle='#05090e';g.fillRect(0,0,W,H);g.fillStyle='#596570';g.font='bold 36px monospace';g.textAlign='center';g.fillText(live?here():'NO SIGNAL',W/2,H/2+12);g.textAlign='left';glitch(g,s,t,W,H);return;}
  // Each corridor panel starts at a different ad, then runs through them all at reading pace.
  const list=data.adSlides,start=list.slice(0,s.place.style*5%list.length).reduce((n,x)=>n+x.dur,0),now=at(list,t+start);
  drawAdSlide(g,W,H,t,now.local,now.slide.dur,now.slide.ad,s.place.style+now.index);transition(g,W,H,now.local,now.slide.dur);glitch(g,s,t,W,H);
 }
 // Occasional signal interference: a few displaced slices and a colour fringe for a fraction of a second.
 function glitch(g,s,t,W,H){
  if(t>s.glitchAt){s.glitch=.18;s.glitchAt=t+8+Math.random()*14;}
  if(s.glitch<=0)return;
  for(let i=0;i<4;i++){const y=Math.random()*H,h=6+Math.random()*24,dx=(Math.random()-.5)*60;try{const slice=g.getImageData(0,y,W,h);g.putImageData(slice,dx,y);}catch{}}
  g.fillStyle='rgba(255,0,80,.08)';g.fillRect(0,0,W,H);
 }
 // Only screens on camera and within range are redrawn.
 function visible(s){const cam=scene.activeCamera;return !!cam&&BABYLON.Vector3.Distance(cam.position,s.mesh.position)<range&&cam.isInFrustum(s.mesh);}
 function draw(force=false){
  if(!data)refresh();
  for(const s of screens){if(!force&&!visible(s))continue;const t=clock+s.offset;if(s.place.type==='ad')drawAd(s,t);else drawNews(s,t);s.texture.update();}
 }
 const screenUpdate=update;
 update=function(dt){
  screenUpdate(dt);
  const want=atMeridian()&&VoidComms.allows(state.location,true,'relay')&&!!VoidBabylon.scene;
  if(screens.length&&(!want||scene!==VoidBabylon.scene||screens[0].mesh.isDisposed()))release();
  if(!want)return;
  if(!screens.length){build();refresh();draw(true);timer=0;}
  clock+=dt;for(const s of screens)s.glitch=Math.max(0,s.glitch-dt);
  dataTimer-=dt;if(dataTimer<=0){dataTimer=4;refresh();}
  timer-=dt;if(timer<=0){timer=1/fps;draw();}
 };
 globalThis.VoidRelayScreens={get screens(){return screens;},draw,places,refresh,get slides(){return data?.slides||[];}};
})();
