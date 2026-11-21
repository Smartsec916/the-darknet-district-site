/* Relay screens at Meridian (the owner's Relay brief §27, animated per his Meridian brief Phase 7). Every screen is
   a live channel: it cycles through slides (each news story the player has received, the stations' ads,
   the WarFlying standings and a station notice) with animated backgrounds and transitions, and a scrolling
   ticker. News slides read relay.js headlines(), so a screen and the radio never disagree; ad slides show the
   ads' own scripted lines. Screens show NO SIGNAL without a satellite link, and none exist in The Darknet
   District. Performance: one small canvas texture per screen, redrawn about 12 times a second only while the
   screen is on camera and near, and not at all otherwise. Screens are silent; sound stays with the radio.
   Look (the owner, 16 Nov 2026): the same as the street's advertisement screens (ad-screens.js): each ad is drawn by its category's template, the
   standings are the WarFlying Leadership Board (this week's five), the news and station slides use the news template's backdrop, and each screen
   sits in a modelled housing. What the screens SAY is unchanged. */
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
 // Reading time per slide (the owner: there wasn't enough time to read them): headlines 14 s, the station notice 9 s,
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
   // The housing: the same parts as the street screens' slim panel (casing, raised lips, an accent light and a power light).
   const fm=new B.StandardMaterial('relay-screen-frame',s);fm.diffuseColor=B.Color3.FromHexString('#14181c');fm.specularColor=new B.Color3(.25,.27,.3);
   const tm=new B.StandardMaterial('relay-screen-trim',s);tm.diffuseColor=B.Color3.FromHexString('#2c3238');tm.specularColor=new B.Color3(.4,.42,.45);
   const gm=new B.StandardMaterial('relay-screen-glow',s);gm.diffuseColor=B.Color3.Black();gm.emissiveColor=B.Color3.FromHexString(p.type==='ad'?'#ffb347':'#7fc6ff');gm.disableLighting=true;
   const lm=new B.StandardMaterial('relay-screen-led',s);lm.diffuseColor=B.Color3.Black();lm.emissiveColor=B.Color3.FromHexString('#ff2b2b');lm.disableLighting=true;
   const AS=globalThis.VoidAdScreens,parts=AS.housing('panel',p.size[0],p.size[1]).map(([name,size,off,surf])=>{const m=B.MeshBuilder.CreateBox('relay-screen-'+name+'-'+p.id,{width:size[0],height:size[1],depth:size[2]},s);m.position.set(...AS.place(p.position,p.rotation,off));m.rotation.y=p.rotation;m.material=surf==='case'?fm:surf==='trim'?tm:surf==='glow'?gm:lm;m.isPickable=false;return m;});
   const frame=parts[0];
   // A hanging screen gets two ceiling rods.
   const rods=p.ceiling?[-1,1].map(side=>{const top=p.position[1]+p.size[1]/2,rod=B.MeshBuilder.CreateBox('relay-screen-rod',{width:.06,height:p.ceiling-top,depth:.06},s);const off=side*p.size[0]*.36;rod.position.set(p.position[0]+Math.cos(p.rotation)*off,(p.ceiling+top)/2,p.position[2]-Math.sin(p.rotation)*off);rod.material=fm;rod.isPickable=false;return rod;}):[];
   // Each screen runs on its own clock offset and playlist position, so no two show the same slide.
   return {place:p,mesh,frame,parts,rods,texture,materials:[m,fm,tm,gm,lm],offset:i*3.7+(p.id==='bar'?24:0),glitchAt:6+i*4.3,glitch:0};
  });
 }
 function release(){for(const s of screens){s.texture.dispose();for(const m of s.materials)m.dispose();s.mesh.dispose();for(const x of s.parts)x.dispose();for(const r of s.rods)r.dispose();}screens=[];scene=null;}
 function wrap(g,text,x,y,width,lineHeight,max){const words=String(text).split(/\s+/);let line='',n=0;for(const w of words){const test=line?line+' '+w:w;if(g.measureText(test).width>width&&line){g.fillText(line,x,y+n*lineHeight);line=w;if(++n>=max)return;}else line=test;}if(line)g.fillText(line,x,y+n*lineHeight);}
 // What the screens show, refreshed every few seconds (not every frame).
 function refresh(){
  const content=VoidRelayRadio.content,news=state.relay||R.fresh(),link=VoidComms.status(state,{onFoot:true}),live=VoidComms.canUpload(link);
  const cards=live?R.headlines(news,content,{system:state.universe?.currentSystem||'erebus',clock:state.warflying?.clock||0,matches:w=>VoidStory.matches(state,w)},6):[];
  // The WarFlying Leadership Board: this week's five (warflying-board.js), the player measured against them.
  const db=state.warflying,standing=db?(globalThis.VoidWarFlyingScanner?.standings?.()||VoidWarFlyingBoard.standings(VoidWarFlying.points(db),'YOU')):null,board=standing?standing.rows:[];
  const ads=(content.segments||[]).filter(s=>s.kind==='ad'||s.kind==='police');
  // A news channel's playlist: each story followed by an ad; the standings and a station notice once a cycle.
  const slides=[];let a=0;
  for(const card of cards){slides.push({type:'news',card});if(ads.length)slides.push({type:'ad',ad:ads[a++%ads.length]});}
  if(board.length)slides.push({type:'standings'});
  slides.push({type:'station'});
  while(slides.length<6&&ads.length)slides.push({type:'ad',ad:ads[a++%ads.length]});
  for(const s of slides)s.dur=s.type==='ad'?adTime(s.ad):READ[s.type];
  data={live,cards,board,standing,ads,slides,adSlides:ads.map(ad=>({ad,dur:adTime(ad)})),ticker:[...cards.map(c=>c.headline),...board.length?[standing.header+': '+board.map(r=>r.rank+'. '+r.name+' '+r.points).join('   ')]:[],here()+' · DOCKING OPEN · '+bar().replace(/^THE /,'')+' OPEN · OUTFITTER OPEN'].join('   ◆   ')};
 }
 const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3);
 // Moving news backdrop: a blue gradient with a travelling light band, drifting stripes, slow particles and an
 // orbit ring that turns in the corner, so the screen visibly lives even between slides.
 function backdrop(g,W,H,t,tint='#12324a'){
  // The news template's own backdrop and globe (ad-screens.js), so the station's news and the street's look alike; `tint` colours breaking news and notices.
  const L=globalThis.VoidAdScreens.LOOKS.news,pal={...L.pal,b:tint};
  g.save();L.back(g,W,H,t,pal);g.globalAlpha=.8;L.motif(g,W-130,H*.46,74,t,pal);g.restore();g.textAlign='left';g.textBaseline='alphabetic';g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.035)';for(let y=(t*18)%4;y<H;y+=4)g.fillRect(0,y,W,1);
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
 // The WarFlying Leadership Board: the street screens' board slide (the top five only), above the ticker.
 function drawStandings(g,W,H,t,local,board){
  const AS=globalThis.VoidAdScreens,slide=globalThis.VoidAdData.slide({type:'board'},{standings:data.standing});
  g.save();g.beginPath();g.rect(0,0,W,H-100);g.clip();AS.paint(g,W,H-100,slide,{t,slideT:local,i:0,p:clamp(local/8),lineT:local});g.restore();g.textAlign='left';g.textBaseline='alphabetic';g.globalAlpha=1;
 }
 const clamp=v=>v<0?0:v>1?1:v;
 function drawStation(g,W,H,t,local){
  backdrop(g,W,H,t,'#14243a');header(g,W,t,here(),false);
  const rows=[['DOCKING','OPEN'],[bar(),'OPEN'],['SHIP OUTFITTER','OPEN'],['LIVING AREA','PODS AVAILABLE']];
  rows.forEach(([k,v],i)=>{const y=140+i*70,show=ease((local-.2-i*.2)/.5);g.globalAlpha=show;g.fillStyle='#9fb6c6';g.font='bold 34px monospace';g.fillText(k,40+(1-show)*-60,y);
   g.fillStyle=Math.sin(t*3+i)>-.2?'#9fe3c9':'#6fb79b';g.textAlign='right';g.fillText(v,W-60,y);g.textAlign='left';g.globalAlpha=1;});
 }
 // An ad: drawn by its category's template (ad-screens.js), one scripted line at a time, the words arriving at reading pace. The ad's own lines and
 // headline are unchanged; `h` is the height it may use (a news screen keeps its ticker underneath).
 const adSlides=new Map();
 function adSlide(ad){
  if(adSlides.has(ad.id))return adSlides.get(ad.id);const D=globalThis.VoidAdData;
  const slide=D.slide({type:'ad',ad:{id:ad.id,cat:D.RELAY[ad.id]||(ad.kind==='police'?'police':'shipgear'),title:ad.headline||'',lines:R.lines(ad),relay:true}});adSlides.set(ad.id,slide);return slide;
 }
 function drawAdSlide(g,W,H,t,local,per,ad,h=H){
  const slide=adSlide(ad),n=slide.lines.length,each=per/n,i=Math.min(n-1,Math.floor(local/each)),lineT=local-i*each,k=h/288;
  g.save();g.beginPath();g.rect(0,0,W,h);g.clip();globalThis.VoidAdScreens.paint(g,W,h,slide,{t,slideT:local,i,p:clamp(lineT/(each*.82)),lineT});g.restore();g.textAlign='left';g.textBaseline='alphabetic';g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.6)';g.font=Math.round(11*k)+'px monospace';g.textAlign='right';g.fillText(ad.kind==='police'?'PAID RECRUITMENT NOTICE':'ADVERTISEMENT',W-14*k,h-8*k);g.textAlign='left';
 }
 function drawNews(s,t){
  const g=s.texture.getContext(),[W,H]=s.place.res,{slides,ticker,live,board}=data;
  if(!live){backdrop(g,W,H,t,'#1a1f26');header(g,W,t,'THE RELAY',false);g.fillStyle='#8a96a3';g.font='bold 64px monospace';g.fillText('NO SIGNAL',28,260);for(let i=0;i<40;i++){g.fillStyle='rgba(200,210,220,'+(Math.random()*.15)+')';g.fillRect(Math.random()*W,64+Math.random()*(H-64),Math.random()*120,2);}glitch(g,s,t,W,H);return;}
  const now=at(slides,t),slide=now.slide,local=now.local,dur=slide.dur;
  if(slide.type==='news')drawNewsSlide(g,W,H,t,local,slide.card,dur);
  else if(slide.type==='standings')drawStandings(g,W,H,t,local,board);
  else if(slide.type==='station')drawStation(g,W,H,t,local);
  else drawAdSlide(g,W,H,t,local,dur,slide.ad,H-100);
  if(slide.type==='news'||slide.type==='station')transition(g,W,H,local,dur);
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
  drawAdSlide(g,W,H,t,now.local,now.slide.dur,now.slide.ad);glitch(g,s,t,W,H);
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
 globalThis.VoidRelayScreens={get screens(){return screens;},get time(){return clock;},set time(v){clock=Number(v)||0;},draw,places,refresh,release,get slides(){return data?.slides||[];}};
})();
