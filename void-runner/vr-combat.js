/* VR experience: Combat Simulator. A holographic range: a 60-second challenge of pop-up and sliding targets, then
   drones that strafe and fire harmless training bolts. Score, accuracy, time and virtual health; Easy, Normal or Hard;
   restart at any time. The pistol and its ammunition are simulated (vr-core.js): nothing here touches the real
   character, inventory, missions or factions. */
(function(){
 const {kit,spot}=VoidVRKit;
 const levels={easy:{pop:2.6,slide:.8,drones:1,accuracy:.12,dmg:6},normal:{pop:1.9,slide:1.4,drones:2,accuracy:.22,dmg:9},hard:{pop:1.3,slide:2.2,drones:3,accuracy:.35,dmg:12}};
 function layout(){return {id:'vr-combat',name:'VR · COMBAT SIMULATOR',bounds:[14,30],spawn:[0,1.7,-24],yaw:0,music:null,signs:[],
  // The firing line: the range beyond it is out of bounds.
  solids:[{id:'vr-line',position:[0,.6,-14.5],size:[28,1.2,.3]}],
  interactions:[spot('start','START THE CHALLENGE',-4,-17,2),spot('level','CHANGE DIFFICULTY',0,-17,2),spot('reset','RESET THE RANGE',4,-17,2)]};}
 async function build(ctx){
  const k=kit(ctx),B=k.B,api=ctx.api;
  k.light({clear:[.01,.02,.04],fog:[.02,.05,.08],fogDensity:.012,sunIntensity:.2,ambient:.55,sky:[.4,.8,1],ground:[.05,.1,.15],exposure:1.1,contrast:1.15,env:.3});
  // Tron-style floor and walls: a glowing grid on black.
  const grid=k.paint('grid',512,512,(g,W,H)=>{g.fillStyle='#03070b';g.fillRect(0,0,W,H);g.strokeStyle='rgba(95,242,255,.55)';g.lineWidth=3;g.strokeRect(0,0,W,H);g.strokeStyle='rgba(95,242,255,.18)';g.lineWidth=1;for(let i=64;i<W;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(W,i);g.stroke();}});grid.uScale=grid.vScale=16;
  const floor=k.material('grid-floor');floor.diffuseTexture=grid;floor.emissiveTexture=grid;grid.level=.55;floor.specularColor=new B.Color3(.3,.4,.5);k.mesh(B.MeshBuilder.CreateGround('vr-floor',{width:120,height:120},k.scene),floor);
  const wallTex=k.paint('wall-grid',512,512,(g,W,H)=>{g.fillStyle='#02050a';g.fillRect(0,0,W,H);g.strokeStyle='rgba(56,232,255,.25)';for(let i=0;i<W;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,H);g.stroke();}g.strokeStyle='rgba(255,63,180,.35)';g.lineWidth=4;g.beginPath();g.moveTo(0,H*.2);g.lineTo(W,H*.2);g.stroke();});wallTex.uScale=10;wallTex.vScale=2;
  const wall=k.material('wall');wall.diffuseColor=B.Color3.Black();wall.emissiveTexture=wallTex;
  for(const [w,p,r] of [[64,[0,6,32],0],[64,[-15,6,0],-Math.PI/2],[64,[15,6,0],Math.PI/2],[30,[0,6,-30],Math.PI]])k.mesh(B.MeshBuilder.CreatePlane('vr-wall',{width:w,height:12,sideOrientation:B.Mesh.DOUBLESIDE},k.scene),wall,p,r);
  const cyan=k.glow('cyan','#38e8ff',1),pink=k.glow('pink','#ff3fb4',1),amber=k.glow('amber','#ffcf5a',1),red=k.glow('red','#ff3b3b',1.2);
  k.box('firing-line',[28,.05,.25],[0,.03,-14.5],amber);k.box('rail',[28,.08,.08],[0,1.1,-14.5],cyan);
  // Consoles at the firing line.
  const consoleMat=k.material('console',{hex:'#0d151a'});for(const [x,label,c] of [[-4,'START',cyan],[0,'LEVEL',amber],[4,'RESET',pink]]){k.box('console',[1.2,1.1,.6],[x,.55,-17.6],consoleMat);k.box('console-screen',[1,.5,.05],[x,1.1,-17.28],c);}
  // Scoreboard over the range.
  const board=k.paint('board',1024,256,()=>{},false),boardMat=k.material('board');boardMat.diffuseColor=B.Color3.Black();boardMat.emissiveTexture=board;k.mesh(B.MeshBuilder.CreatePlane('vr-board',{width:12,height:3},k.scene),boardMat,[0,7,20]).rotation.y=0;
  const s={state:'idle',level:ctx.settings.level||'normal',time:0,score:0,shots:0,hits:0,hp:100,targets:[],drones:[],bolts:[],spawn:0,countdown:0,best:0};
  function drawBoard(){const g=board.getContext();g.fillStyle='#02060a';g.fillRect(0,0,1024,256);g.fillStyle='#5ff2ff';g.font='bold 44px Consolas,monospace';g.fillText('COMBAT SIMULATOR · '+s.level.toUpperCase(),40,70);g.font='bold 56px Consolas,monospace';g.fillStyle='#ffcf5a';
   g.fillText('SCORE '+s.score+'   TIME '+Math.max(0,Math.ceil(60-s.time))+'   HP '+Math.ceil(s.hp),40,160);g.font='32px Consolas,monospace';g.fillStyle='#b9c8ce';g.fillText(s.state==='idle'?'Start at the console. Best: '+s.best:s.state==='countdown'?'Get ready…':s.state==='done'?'Final '+s.score+' · accuracy '+(s.shots?Math.round(s.hits/s.shots*100):0)+'% · best '+s.best:'Hit the targets. Drones fire training bolts.',40,220);board.update();}
  drawBoard();
  // Targets: a ring and a bullseye on a holographic stand. Drones: a glowing sphere with a ring.
  const targetMat=k.glow('target','#ff3fb4',1.1),eyeMat=k.glow('target-eye','#ffffff',1.2);
  function target(){const lane=Math.floor(Math.random()*7)-3,z=-2+Math.random()*24,n=new B.TransformNode('vr-target',k.scene);n.parent=k.parent;
   const ring=B.MeshBuilder.CreateTorus('vr-target-ring',{diameter:1.1,thickness:.12,tessellation:24},k.scene);ring.material=targetMat;ring.parent=n;ring.rotation.x=Math.PI/2;const eye=B.MeshBuilder.CreateDisc('vr-target-eye',{radius:.18,tessellation:16},k.scene);eye.material=eyeMat;eye.parent=n;eye.rotation.y=Math.PI;
   for(const m of [ring,eye])m.isPickable=false;n.position.set(lane*3.2,0,z);return {n,x:lane*3.2,z,y:1.4+Math.random()*1.4,life:levels[s.level].pop+Math.random(),rise:0,slide:Math.random()<.4?(Math.random()<.5?-1:1)*levels[s.level].slide:0,r:.6,points:z>12?150:100};}
  function drone(){const n=new B.TransformNode('vr-drone',k.scene);n.parent=k.parent;const body=B.MeshBuilder.CreateSphere('vr-drone-body',{diameter:.9,segments:12},k.scene);body.material=red;body.parent=n;const ring=B.MeshBuilder.CreateTorus('vr-drone-ring',{diameter:1.5,thickness:.06,tessellation:24},k.scene);ring.material=cyan;ring.parent=n;for(const m of [body,ring])m.isPickable=false;
   return {n,x:(Math.random()*2-1)*10,z:8+Math.random()*14,y:3+Math.random()*3,ph:Math.random()*6,hp:3,fire:1+Math.random()*2,r:.75,points:250};}
  function clear(){for(const t of [...s.targets,...s.drones,...s.bolts])t.n.dispose();s.targets=[];s.drones=[];s.bolts=[];}
  function start(){clear();Object.assign(s,{state:'countdown',countdown:3,time:0,score:0,shots:0,hits:0,hp:100,spawn:0});groundState.drawn=true;api.sfx(660,.2,'square',.05);drawBoard();}
  function finish(){s.state='done';s.best=Math.max(s.best,s.score);clear();api.sfx(330,.6,'sawtooth',.05);drawBoard();announce('Challenge over: '+s.score+' points, '+(s.shots?Math.round(s.hits/s.shots*100):0)+'% accuracy.');}
  const boltMat=k.glow('bolt','#ff6b6b',1.4);
  k.every((dt)=>{
   if(s.state==='countdown'){const before=Math.ceil(s.countdown);s.countdown-=dt;if(Math.ceil(s.countdown)!==before&&s.countdown>0)api.sfx(660,.15,'square',.05);if(s.countdown<=0){s.state='running';api.sfx(990,.3,'square',.06);}drawBoard();return;}
   if(s.state!=='running')return;s.time+=dt;const L=levels[s.level];
   s.spawn-=dt;if(s.spawn<=0&&s.targets.length<5){s.targets.push(target());s.spawn=.5+Math.random()*.6;}
   if(s.time>20&&s.drones.length<L.drones&&Math.random()<dt*.6)s.drones.push(drone());
   for(const t of s.targets){t.rise=Math.min(1,t.rise+dt*4);t.life-=dt;t.x+=t.slide*dt;if(Math.abs(t.x)>11)t.slide*=-1;t.n.position.set(t.x,t.y*t.rise,t.z);if(t.life<0){t.dead=true;t.n.dispose();}}
   for(const d of s.drones){d.ph+=dt;d.n.position.set(d.x+Math.sin(d.ph*.9)*5,d.y+Math.sin(d.ph*1.7)*.6,d.z);d.n.getChildMeshes()[1].rotation.y+=dt*3;d.fire-=dt;
    if(d.fire<=0){d.fire=1.4+Math.random()*1.6;const from=d.n.position.clone(),to=new B.Vector3(walker.x+(Math.random()-.5)*2,walker.y-.3,walker.z),m=B.MeshBuilder.CreateSphere('vr-bolt',{diameter:.22,segments:6},k.scene);m.material=boltMat;m.parent=k.parent;m.isPickable=false;m.position.copyFrom(from);s.bolts.push({n:m,v:to.subtract(from).normalize().scale(18),hit:Math.random()<L.accuracy,t:0});api.sfx(260,.15,'sawtooth',.03);}}
   for(const b of s.bolts){b.t+=dt;b.n.position.addInPlace(b.v.scale(dt));if(b.n.position.z<walker.z+.5){if(b.hit){s.hp=Math.max(0,s.hp-L.dmg);api.sfx(140,.25,'square',.06);k.flash=.3;}b.dead=true;b.n.dispose();}else if(b.t>4){b.dead=true;b.n.dispose();}}
   s.targets=s.targets.filter(t=>!t.dead);s.drones=s.drones.filter(d=>!d.dead);s.bolts=s.bolts.filter(b=>!b.dead);k.flash=Math.max(0,(k.flash||0)-dt);
   if(s.time>=60||s.hp<=0)finish();else if(Math.floor(s.time*4)!==Math.floor((s.time-dt)*4))drawBoard();});
  return {tick:k.tick,dispose:()=>{clear();k.dispose();},
   onEnter(){groundState.drawn=true;},
   // A shot: the nearest target or drone the ray passes within reach of.
   onFire(o,d){if(s.state!=='running')return;s.shots++;let best=null,bt=Infinity;
    for(const t of [...s.targets,...s.drones]){const p=t.n.position,vx=p.x-o.x,vy=p.y-o.y,vz=p.z-o.z,tt=vx*d.x+vy*d.y+vz*d.z;if(tt<0)continue;const dist=Math.hypot(vx-d.x*tt,vy-d.y*tt,vz-d.z*tt);if(dist<t.r&&tt<bt){bt=tt;best=t;}}
    if(!best)return;s.hits++;if(best.hp!=null){best.hp--;api.sfx(500,.12,'square',.05);if(best.hp>0)return;}best.dead=true;best.n.dispose();s.score+=best.points;api.sfx(1400,.15,'triangle',.06);s.targets=s.targets.filter(t=>!t.dead);s.drones=s.drones.filter(t=>!t.dead);drawBoard();},
   overlay(g,W,H){if(s.state==='idle')return;g.save();g.fillStyle='rgba(2,6,10,.8)';g.fillRect(W/2-210,16,420,46);g.strokeStyle='#2aa6b8';g.strokeRect(W/2-210,16,420,46);g.fillStyle='#ffcf5a';g.font='bold 16px Consolas,monospace';g.textAlign='center';
    g.fillText(s.state==='countdown'?'GET READY · '+Math.ceil(s.countdown):'SCORE '+s.score+' · '+Math.max(0,Math.ceil(60-s.time))+' s · HP '+Math.ceil(s.hp)+' · '+(s.shots?Math.round(s.hits/s.shots*100):0)+'%',W/2,45);
    if(k.flash>0){g.fillStyle='rgba(255,40,40,'+k.flash*.6+')';g.fillRect(0,0,W,H);}g.restore();},
   interact(item){const id=item.id.slice(3);if(id==='start')start();else if(id==='reset'){clear();Object.assign(s,{state:'idle',time:0,score:0,shots:0,hits:0,hp:100});drawBoard();announce('Range reset.');}
    else if(id==='level'){const order=['easy','normal','hard'];s.level=order[(order.indexOf(s.level)+1)%3];api.session.settings.level=s.level;drawBoard();announce('Difficulty: '+s.level.toUpperCase()+'.');}},
   setOption(key,val){if(key==='level'&&levels[val]){s.level=val;drawBoard();}}};
 }
 VoidVR.register({id:'combat',title:'Combat Simulator',status:'ready',station:0,weapon:true,tint:'linear-gradient(135deg,#05121a,#ff3fb4)',
  description:'A holographic range: pop-up and sliding targets, then drones that fire back. Timed challenge, score, accuracy and three difficulty levels. Simulated weapon; nothing carries over.',
  defaults:{level:'normal'},settings:[{key:'level',label:'Difficulty',values:[['easy','Easy'],['normal','Normal'],['hard','Hard']]}],
  ambience:()=>({hum:.025}),layout,build});
})();
