/* Relay screens at Meridian (David's Relay brief §27, animated per his Meridian brief Phase 7): the same
   reports the radio carries, shown as live broadcast graphics, plus animated advertising panels. News
   screens read relay.js headlines(), so a screen and the radio never disagree; ad panels show the ads'
   own scripted lines. Screens show NO SIGNAL without a satellite link, and none exist in The Darknet
   District. Performance: one small canvas texture per screen, redrawn about 12 times a second only while
   the screen is on camera and near, and not at all otherwise. Screens are silent; sound stays with the radio. */
(function(){
 const R=VoidRelay;
 // Positions follow meridian-interior.js: a screen hanging at the hall entrance facing arrivals from the
 // corridor, one on the Dead Channel's back wall facing the bar, and two ad panels on the corridor's outer wall.
 const places=[
  {id:'hall',type:'news',position:[0,3.75,44.5],rotation:0,size:[3.4,1.91],ceiling:5,res:[1024,576]},
  {id:'bar',type:'news',position:[-15.75,3.55,51],rotation:-Math.PI/2,size:[3.2,1.8],res:[1024,576]},
  {id:'corridor-ad-1',type:'ad',style:0,position:[2.17,2.15,13],rotation:Math.PI/2,size:[1.6,.9],res:[512,288]},
  {id:'corridor-ad-2',type:'ad',style:1,position:[2.17,2.15,26],rotation:Math.PI/2,size:[1.6,.9],res:[512,288]}
 ];
 const fps=12,range=26;
 let screens=[],scene=null,timer=0,clock=0,data=null,dataTimer=0;
 const atMeridian=()=>typeof walkingLocation!=='undefined'&&walkingLocation?.kind==='station'&&state?.location==='meridian';
 function build(){
  const B=BABYLON,s=VoidBabylon.scene;scene=s;
  screens=places.map((p,i)=>{
   const mesh=B.MeshBuilder.CreatePlane('relay-screen-'+p.id,{width:p.size[0],height:p.size[1]},s);mesh.position.set(...p.position);mesh.rotation.y=p.rotation;mesh.isPickable=false;
   const texture=new B.DynamicTexture('relay-screen-'+p.id,{width:p.res[0],height:p.res[1]},s,true),m=new B.StandardMaterial('relay-screen-'+p.id,s);
   m.diffuseTexture=texture;m.emissiveTexture=texture;m.disableLighting=true;m.specularColor=B.Color3.Black();mesh.material=m;
   const frame=B.MeshBuilder.CreateBox('relay-screen-frame-'+p.id,{width:p.size[0]+.16,height:p.size[1]+.16,depth:.08},s);frame.position.set(...p.position);frame.rotation.y=p.rotation;
   frame.locallyTranslate(new B.Vector3(0,0,.06));const fm=new B.StandardMaterial('relay-screen-frame',s);fm.diffuseColor=B.Color3.FromHexString('#20262b');frame.material=fm;frame.isPickable=false;
   // A hanging screen gets two ceiling rods.
   const rods=p.ceiling?[-1,1].map(side=>{const top=p.position[1]+p.size[1]/2,rod=B.MeshBuilder.CreateBox('relay-screen-rod',{width:.06,height:p.ceiling-top,depth:.06},s);rod.position.set(p.position[0]+side*p.size[0]*.36,(p.ceiling+top)/2,p.position[2]+.06);rod.material=fm;rod.isPickable=false;return rod;}):[];
   // Each screen runs on its own clock offset so no two show the same frame.
   return {place:p,mesh,frame,rods,texture,materials:[m,fm],offset:i*3.7,glitchAt:6+i*4.3,glitch:0};
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
  data={live,cards,board,ads,ticker:[...cards.map(c=>c.headline),...board.length?['WARFLYING STANDINGS: '+board.map(r=>r.rank+'. '+r.name+' '+r.points).join('   ')]:[]].join('   ◆   ')};
 }
 const ease=t=>t<0?0:t>1?1:1-Math.pow(1-t,3);
 function drawNews(s,t){
  const g=s.texture.getContext(),[W,H]=s.place.res,{cards,ticker,live}=data;
  // Moving backdrop: a slow diagonal light sweep over dark blue, with scanlines.
  const grad=g.createLinearGradient(0,0,W,H),sweep=(t*.07)%1.4-.2;grad.addColorStop(0,'#061019');grad.addColorStop(Math.max(0,Math.min(1,sweep)),'#0f2433');grad.addColorStop(1,'#050b12');g.fillStyle=grad;g.fillRect(0,0,W,H);
  g.fillStyle='rgba(255,255,255,.035)';for(let y=(t*30)%6;y<H;y+=6)g.fillRect(0,y,W,2);
  // Header with a live dot and the time.
  const card=cards.length?cards[Math.floor(t/9)%cards.length]:null,breaking=card?.kind==='breaking';
  g.fillStyle=breaking?(Math.sin(t*6)>0?'#c8392d':'#9e2a20'):'#d9a441';g.fillRect(0,0,W,64);
  g.fillStyle='#071019';g.font='bold 34px monospace';g.textAlign='left';g.fillText(breaking?'THE RELAY · BREAKING':'THE RELAY',28,44);
  g.fillStyle=Math.sin(t*4)>0?'#e5413a':'#5a1a17';g.beginPath();g.arc(W-150,32,9,0,Math.PI*2);g.fill();g.fillStyle='#071019';g.font='bold 22px monospace';g.fillText('LIVE',W-132,40);
  if(!live){g.fillStyle='#8a96a3';g.font='bold 64px monospace';g.fillText('NO SIGNAL',28,260);for(let i=0;i<40;i++){g.fillStyle='rgba(200,210,220,'+(Math.random()*.15)+')';g.fillRect(Math.random()*W,64+Math.random()*(H-64),Math.random()*120,2);}}
  else if(card){
   // The headline card wipes in at the start of each 9-second slot and out at the end.
   const slot=t%9,inT=ease(slot/.6),outT=ease((slot-8.4)/.6),x=28+(1-inT)*-W*.6+outT*W*.6;
   g.save();g.beginPath();g.rect(0,70,W,H-170);g.clip();
   g.fillStyle=breaking?'#ff8a7a':'#9fe3c9';g.font='bold 30px monospace';g.fillText((R.perspectives[card.perspective]||'')+(card.standing?' · '+(R.standings[card.standing]||'').toUpperCase():''),x,116);
   g.fillStyle='#f0ece2';g.font='bold 58px system-ui,sans-serif';wrap(g,card.headline,x,196,W-60,68,3);
   g.fillStyle='#d9a441';g.fillRect(x,140,Math.min(W-60,(slot/9)*(W-60)),4);g.restore();
  }else{g.fillStyle='#8a96a3';g.font='36px system-ui,sans-serif';g.fillText('Programming continues shortly.',28,260);}
  // Scrolling ticker.
  g.fillStyle='#0d1c28';g.fillRect(0,H-100,W,100);g.fillStyle='#d9a441';g.fillRect(0,H-100,W,4);
  if(ticker){g.font='bold 34px monospace';const width=g.measureText(ticker+'   ◆   ').width,x=W-(t*120)%(width+W);g.fillStyle='#e6e1d6';g.fillText(ticker+'   ◆   '+ticker,x,H-38);}
  glitch(g,s,t,W,H);
 }
 // Ad styles: 0 a product sweep with line-by-line pop-in, 1 a holographic ring, 2 recruitment colour blocks.
 function drawAd(s,t){
  const g=s.texture.getContext(),[W,H]=s.place.res,{ads,live}=data;
  if(!live||!ads.length){g.fillStyle='#05090e';g.fillRect(0,0,W,H);g.fillStyle='#596570';g.font='bold 36px monospace';g.textAlign='center';g.fillText(live?'MERIDIAN STATION':'NO SIGNAL',W/2,H/2+12);g.textAlign='left';glitch(g,s,t,W,H);return;}
  const per=14,ad=ads[(Math.floor(t/per)+s.place.style*3)%ads.length],local=t%per,lines=R.lines(ad),line=lines[Math.min(lines.length-1,Math.floor(local/(per/lines.length)))];
  const police=ad.kind==='police',style=police?2:s.place.style;
  if(style===0){const grad=g.createLinearGradient(0,0,W,0),p=(local/per);grad.addColorStop(0,'#1a0f2e');grad.addColorStop(Math.min(1,p),'#3b1f5c');grad.addColorStop(1,'#0c0716');g.fillStyle=grad;g.fillRect(0,0,W,H);
   for(let i=0;i<6;i++){g.strokeStyle='rgba(255,140,220,'+(.15+.1*Math.sin(t*2+i))+')';g.lineWidth=2;g.beginPath();g.moveTo(((t*80+i*90)%(W+200))-100,0);g.lineTo(((t*80+i*90)%(W+200))-220,H);g.stroke();}}
  else if(style===1){g.fillStyle='#03121a';g.fillRect(0,0,W,H);g.save();g.translate(W*.82,H*.5);g.rotate(t*.8);g.strokeStyle='rgba(110,230,255,'+(.55+.25*Math.sin(t*9))+')';g.lineWidth=3;for(let r=30;r<=90;r+=30){g.beginPath();g.ellipse(0,0,r,r*.45,0,0,Math.PI*2);g.stroke();}g.restore();
   g.fillStyle='rgba(110,230,255,.06)';for(let y=(t*40)%4;y<H;y+=4)g.fillRect(0,y,W,1);}
  else{const flip=Math.floor(t*2.5)%2;g.fillStyle=flip?'#0b2a6b':'#a3161a';g.fillRect(0,0,W,H);g.fillStyle=flip?'#a3161a':'#0b2a6b';g.fillRect(0,H-40,W,40);g.fillStyle='#ffffff';g.fillRect(0,H-44,W,4);}
  // The headline, then the current line popping in.
  const pop=ease((local%(per/lines.length))/.35);
  g.fillStyle=style===1?'#8ff0ff':'#ffd27a';g.font='bold 22px monospace';g.fillText((ad.headline||'').toUpperCase(),18,36);
  g.globalAlpha=pop;g.fillStyle='#ffffff';g.font='bold '+(style===2?30:28)+'px system-ui,sans-serif';wrap(g,line,18+(1-pop)*30,92,style===1?W*.62:W-36,34,5);g.globalAlpha=1;
  glitch(g,s,t,W,H);
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
 globalThis.VoidRelayScreens={get screens(){return screens;},draw,places,refresh};
})();
