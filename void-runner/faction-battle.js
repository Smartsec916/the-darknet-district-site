/* Small Communion vs Natural Order skirmishes the player witnesses on the District deliveries
   (design doc 08). Positions use the flight's player-relative frame. The ships fight only each
   other: they never target the player, their shots and hulls never touch the player, and no
   reputation changes. Rules only; the renderer draws the ships and bolts. */
(function(root){
 // Communion: precise, smooth, coordinated single shots. Natural Order: direct, heavy bursts.
 const sides={
  communion:{speed:30,turn:2.3,accuracy:.95,lead:.9,cone:.92,fireEvery:.6,burst:1,burstGap:0,bolt:150,damage:11,orbit:55,jink:.6},
  'natural-order':{speed:25,turn:1.45,accuracy:.72,lead:.45,cone:.86,fireEvery:1.8,burst:4,burstGap:.12,bolt:125,damage:5,orbit:24,jink:1.3}
 };
 const classes={
  'communion-lancer':{side:'communion',hp:90,size:1.7},'communion-warden':{side:'communion',hp:130,size:2.1},
  'order-brawler':{side:'natural-order',hp:100,size:1.7},'order-hauler':{side:'natural-order',hp:140,size:2.2}
 };
 // Two different fights: each delivery gets its own composition, side of the route and damage state.
 const layouts={
  communion:{side:-1,lift:16,distance:140,lateral:36,ships:[['communion-lancer',.9],['communion-lancer',.55],['order-brawler',.7],['order-hauler',.95]],wrecks:[]},
  'natural-order':{side:1,lift:8,distance:135,lateral:38,ships:[['order-brawler',.95],['order-brawler',.5],['communion-warden',.85],['communion-lancer',.9]],wrecks:['order-brawler']}
 };
 const config={duration:55,leaveAfter:4,shotRange:150,playerClearance:14,shipClearance:30,cleanupDistance:2400,wreckLife:45,rechargeSeconds:8};
 const v=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b,k=1)=>v(a.x+b.x*k,a.y+b.y*k,a.z+b.z*k),sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z),len=a=>Math.hypot(a.x,a.y,a.z),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
 const unit=a=>{const l=len(a)||1;return v(a.x/l,a.y/l,a.z/l);},cross=(a,b)=>v(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
 function turn(from,to,rate){const t=Math.min(1,rate);return unit(add(from,sub(to,from),t));}

 // basis: the player's forward/right/up when the battle appears, so it opens off to one side.
 function create(faction,basis={f:v(0,0,1),r:v(1,0,0),u:v(0,1,0)},rng=Math.random){
  const L=layouts[faction];if(!L)return null;
  const center=add(add(add(v(),basis.f,L.distance),basis.r,L.side*L.lateral),basis.u,L.lift);
  const battle={faction,center,clock:0,ships:[],shots:[],wrecks:[],events:[],ended:false};
  const counts={};
  L.ships.forEach(([className,health],i)=>{
   const c=classes[className],slot=counts[c.side]=(counts[c.side]||0),line=c.side==='communion'?-1:1;counts[c.side]++;
   const offset=add(add(basis.r,basis.f,.3*line),basis.u,(slot?1:-1)*.2);
   const position=add(add(center,offset,line*(28+rng()*10)),basis.u,(slot-.5)*14+(rng()-.5)*6);
   const heading=unit(add(sub(center,position),basis.u,(rng()-.5)*.3));
   battle.ships.push({id:faction+'-'+i,className,side:c.side,slot,relationship:'neutral',battle:true,marker:'none',size:c.size,maxHp:c.hp,hp:Math.round(c.hp*health),...position,heading,velocity:add(v(),heading,sides[c.side].speed),fire:rng()*1.5,burstLeft:0,burstClock:0,hit:0,smoke:rng(),age:0,target:null,leaving:0,warp:0});
  });
  for(const className of L.wrecks){const c=classes[className],p=add(add(center,basis.u,-20),basis.r,-L.side*25);battle.wrecks.push({id:faction+'-wreck',className,side:c.side,relationship:'neutral',battle:true,wreck:true,marker:'none',size:c.size,...p,velocity:v((rng()-.5)*2,(rng()-.5)*2,(rng()-.5)*2),heading:v(0,0,1),spin:.2+rng()*.3,age:0,smoke:0});}
  return battle;
 }
 const living=b=>b.ships.filter(s=>!s.dead&&!s.leaving);
 function pickTarget(b,s){
  if(s.target&&!s.target.dead&&!s.target.leaving)return s.target;
  const foes=living(b).filter(o=>o.side!==s.side);
  // Communion pairs focus the same target; the Natural Order takes whoever is closest.
  const leader=s.side==='communion'&&s.slot===1?living(b).find(o=>o.side==='communion'&&o.slot===0):null;
  s.target=leader?.target&&!leader.target.dead?leader.target:foes.sort((a,c)=>len(sub(a,s))-len(sub(c,s)))[0]||null;
  return s.target;
 }
 function fire(b,s,t,k,rng){
  const to=sub(t,s),distance=len(to),aim=add(to,t.velocity,distance/k.bolt*k.lead),spread=(1-k.accuracy)*.35;
  const d=unit(v(aim.x/distance+(rng()-.5)*spread,aim.y/distance+(rng()-.5)*spread,aim.z/distance+(rng()-.5)*spread));
  b.shots.push({x:s.x+d.x*2.5,y:s.y+d.y*2.5,z:s.z+d.z*2.5,vx:d.x*k.bolt,vy:d.y*k.bolt,vz:d.z*k.bolt,side:s.side,damage:k.damage,life:config.shotRange/k.bolt});
 }
 function step(b,dt,playerVelocity=v(),rng=Math.random){
  if(!b)return;dt=Math.max(0,Math.min(.1,dt));b.clock+=dt;
  const drift=e=>{for(const a of ['x','y','z'])e[a]+=((e.velocity?.[a]||0)-(playerVelocity[a]||0))*dt;};
  const disengage=b.clock>=config.duration||new Set(living(b).map(s=>s.side)).size<2;
  for(const s of b.ships){
   if(s.dead)continue;s.age+=dt;s.hit=Math.max(0,s.hit-dt);
   const k=sides[s.side];
   if(disengage&&!s.leaving)s.leaving=.001;
   if(s.leaving){
    // Survivors break off and jump out, like passing traffic does.
    s.leaving+=dt;const away=unit(add(sub(s,b.center),s.heading,1));s.heading=turn(s.heading,away,k.turn*dt);
    if(s.leaving>config.leaveAfter)s.warp=Math.min(1,s.warp+dt/1.5);
    s.velocity=add(v(),s.heading,k.speed*(1.3+s.warp*45));drift(s);continue;
   }
   const t=pickTarget(b,s);if(!t){drift(s);continue;}
   const to=sub(t,s),distance=len(to);let want=unit(add(to,t.velocity,distance/k.bolt*k.lead));
   if(distance<k.orbit){const side=unit(cross(to,v(0,1,0)));want=unit(add(want,side,s.side==='communion'?(s.slot?1.2:-1.2):1.8));}
   if(s.side==='communion'&&s.slot===1){const lead=living(b).find(o=>o.side==='communion'&&o.slot===0);if(lead)want=unit(add(want,unit(sub(add(lead,lead.heading,-14),s)),.35));}
   if(s.hit>0){const phase=s.side==='communion'?Math.sin(s.age*3):(Math.sin(s.age*7)>0?1:-1);want=unit(add(want,unit(cross(s.heading,v(0,1,0))),phase*k.jink));}
   // Keep clear of the player: these ships never intercept or ram the pilot.
   const fromPlayer=len(s);if(fromPlayer<config.shipClearance*2)want=unit(add(want,unit(s),(config.shipClearance*2-fromPlayer)/config.shipClearance*2));
   s.heading=turn(s.heading,want,k.turn*dt);s.velocity=add(v(),s.heading,k.speed);drift(s);
   s.fire-=dt;s.burstClock-=dt;
   if(s.burstLeft>0&&s.burstClock<=0){fire(b,s,t,k,rng);s.burstLeft--;s.burstClock=k.burstGap;}
   else if(s.fire<=0&&distance<config.shotRange&&dot(s.heading,unit(to))>k.cone){s.fire=k.fireEvery*(.85+rng()*.3);s.burstLeft=k.burst-1;s.burstClock=k.burstGap;fire(b,s,t,k,rng);}
   if(s.hp<s.maxHp*.45){s.smoke-=dt;if(s.smoke<=0){s.smoke=.35;b.events.push({type:'smoke',kind:'impact',x:s.x,y:s.y,z:s.z});}}
  }
  for(const q of b.shots){
   for(const a of ['x','y','z'])q[a]+=(q['v'+a]-(playerVelocity[a]||0))*dt;q.life-=dt;
   // Stray fire is removed before it can reach the player.
   if(len(q)<config.playerClearance){q.life=0;continue;}
   const hit=b.ships.find(s=>!s.dead&&s.side!==q.side&&len(sub(s,q))<3.2*s.size);
   if(hit){q.life=0;hit.hp-=q.damage;hit.hit=.6;b.events.push({type:'hit',kind:'impact',x:q.x,y:q.y,z:q.z});
    if(hit.hp<=0){hit.dead=true;b.events.push({type:'destroyed',kind:'ship',x:hit.x,y:hit.y,z:hit.z,className:hit.className});
     b.wrecks.push({id:hit.id+'-wreck',className:hit.className,side:hit.side,relationship:'neutral',battle:true,wreck:true,marker:'none',size:hit.size,x:hit.x,y:hit.y,z:hit.z,velocity:add(v(),hit.velocity,.15),heading:hit.heading,spin:.3+rng()*.5,age:0,smoke:0});}}
  }
  b.shots=b.shots.filter(q=>q.life>0);
  for(const w of b.wrecks){w.age+=dt;drift(w);w.smoke-=dt;if(w.age<12&&w.smoke<=0){w.smoke=.6;b.events.push({type:'smoke',kind:'impact',x:w.x,y:w.y,z:w.z});}}
  const near=e=>len(e)<config.cleanupDistance;
  b.ships=b.ships.filter(s=>!s.dead&&s.warp<1&&near(s));b.wrecks=b.wrecks.filter(w=>w.age<config.wreckLife&&near(w));
  b.ended=!b.ships.length&&!b.shots.length;
 }
 // What the renderer should draw this frame.
 function visible(b){return b?[...b.ships,...b.wrecks]:[];}

 // Campaign rules: each delivery's outbound jump drops out once, halfway, near the border.
 const missions={'communion-delivery':'communion','order-delivery':'natural-order'},flags={communion:'communionBattle','natural-order':'orderBattle'};
 function due(s,mission,route){
  const faction=missions[mission?.id];
  if(!faction||!route||route.phase!=='warp'||route.progress<.5||s.contract!==mission.id||s.story?.flags?.[flags[faction]]===true)return null;
  return faction;
 }
 function begin(s,route,faction){s.story.flags[flags[faction]]=true;route.progress=.5;route.phase='align';route.aligned=0;route.recharge=config.rechargeSeconds;}
 const api={sides,classes,layouts,config,create,step,visible,due,begin,flags};
 if(typeof module!=='undefined')module.exports=api;else root.VoidFactionBattle=api;
})(globalThis);
