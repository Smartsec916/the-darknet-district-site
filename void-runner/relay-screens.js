/* Relay screens at Meridian (David's Relay brief §27): the same reports the radio carries, shown as
   headline cards with the WarFlying top three. They read relay.js headlines(), so a screen and the
   radio can never disagree. Screens show nothing without a satellite link, and none exist in The
   Darknet District. One small texture per screen, redrawn every few seconds, never every frame. */
(function(){
 const R=VoidRelay;
 // Meridian interior positions (metres): hanging in the concourse facing arrivals from the hangar, and
 // above the Dead Channel bar.
 const places=[{id:'concourse',position:[0,4.1,26],rotation:0,size:[4.4,2.48],ceiling:6},{id:'bar',position:[0,3.75,63.6],rotation:0,size:[4,2.25]}];
 let screens=[],scene=null,timer=0,card=0;
 const atMeridian=()=>typeof walkingLocation!=='undefined'&&walkingLocation?.kind==='station'&&state?.location==='meridian';
 function build(){
  const B=BABYLON,s=VoidBabylon.scene;scene=s;
  screens=places.map(p=>{
   const mesh=B.MeshBuilder.CreatePlane('relay-screen-'+p.id,{width:p.size[0],height:p.size[1]},s);mesh.position.set(...p.position);mesh.rotation.y=p.rotation;mesh.isPickable=false;
   const texture=new B.DynamicTexture('relay-screen-'+p.id,{width:1024,height:576},s,true),m=new B.StandardMaterial('relay-screen-'+p.id,s);
   m.diffuseTexture=texture;m.emissiveTexture=texture;m.disableLighting=true;m.specularColor=B.Color3.Black();mesh.material=m;
   const frame=B.MeshBuilder.CreateBox('relay-screen-frame-'+p.id,{width:p.size[0]+.16,height:p.size[1]+.16,depth:.08},s);frame.position.set(...p.position);frame.rotation.y=p.rotation;
   frame.locallyTranslate(new B.Vector3(0,0,.06));const fm=new B.StandardMaterial('relay-screen-frame',s);fm.diffuseColor=B.Color3.FromHexString('#20262b');frame.material=fm;frame.isPickable=false;
   // A hanging screen gets two ceiling rods.
   const rods=p.ceiling?[-1,1].map(side=>{const top=p.position[1]+p.size[1]/2,rod=B.MeshBuilder.CreateBox('relay-screen-rod',{width:.06,height:p.ceiling-top,depth:.06},s);rod.position.set(p.position[0]+side*p.size[0]*.36,(p.ceiling+top)/2,p.position[2]+.06);rod.material=fm;rod.isPickable=false;return rod;}):[];
   return {mesh,frame,rods,texture,materials:[m,fm]};
  });
 }
 function release(){for(const s of screens){s.texture.dispose();for(const m of s.materials)m.dispose();s.mesh.dispose();s.frame.dispose();for(const r of s.rods)r.dispose();}screens=[];scene=null;}
 function wrap(g,text,x,y,width,lineHeight,max){const words=String(text).split(/\s+/);let line='',n=0;for(const w of words){const test=line?line+' '+w:w;if(g.measureText(test).width>width&&line){g.fillText(line,x,y+n*lineHeight);line=w;if(++n>=max)return;}else line=test;}if(line)g.fillText(line,x,y+n*lineHeight);}
 function draw(){
  const content=VoidRelayRadio.content,news=state.relay||R.fresh(),link=VoidComms.status(state,{onFoot:true});
  const cards=VoidComms.canUpload(link)?R.headlines(news,content,{system:state.universe?.currentSystem||'erebus',clock:state.warflying?.clock||0,matches:w=>VoidStory.matches(state,w)},6):[];
  const db=state.warflying,board=db?VoidWarFlyingScan.leaderboard(db.clock,VoidWarFlying.points(db),'YOU').slice(0,3):[];
  const c=cards.length?cards[card%cards.length]:null;card++;
  for(const s of screens){
   const g=s.texture.getContext();g.fillStyle='#071019';g.fillRect(0,0,1024,576);
   g.fillStyle='#d9a441';g.fillRect(0,0,1024,64);g.fillStyle='#071019';g.font='bold 34px monospace';g.textAlign='left';g.fillText('THE RELAY',28,44);
   g.textAlign='right';g.font='24px monospace';g.fillText(c?c.label:'',996,42);g.textAlign='left';
   if(!VoidComms.canUpload(link)){g.fillStyle='#8a96a3';g.font='bold 54px monospace';g.fillText('NO SIGNAL',28,250);}
   else if(c){
    const breaking=c.kind==='breaking';g.fillStyle=breaking?'#ff8a7a':'#9fe3c9';g.font='bold 30px monospace';g.fillText((R.perspectives[c.perspective]||'')+(c.standing?' · '+(R.standings[c.standing]||'').toUpperCase():''),28,112);
    g.fillStyle='#f0ece2';g.font='bold 56px system-ui,sans-serif';wrap(g,c.headline,28,190,968,66,4);
   }else{g.fillStyle='#8a96a3';g.font='36px system-ui,sans-serif';g.fillText('Programming continues shortly.',28,250);}
   g.fillStyle='#0d1c28';g.fillRect(0,456,1024,120);g.fillStyle='#d9a441';g.font='bold 28px monospace';g.fillText('WARFLYING STANDINGS',28,498);
   g.fillStyle='#e6e1d6';g.font='bold 32px monospace';g.fillText(board.map(r=>r.rank+'. '+r.name+' '+r.points).join('   '),28,548);
   s.texture.update();
  }
 }
 const screenUpdate=update;
 update=function(dt){
  screenUpdate(dt);
  const want=atMeridian()&&VoidComms.allows(state.location,true,'relay')&&!!VoidBabylon.scene;
  if(screens.length&&(!want||scene!==VoidBabylon.scene||screens[0].mesh.isDisposed()))release();
  if(!want)return;
  if(!screens.length){build();timer=0;}
  timer-=dt;if(timer<=0){timer=8;draw();}
 };
 globalThis.VoidRelayScreens={get screens(){return screens;},draw,places};
})();
