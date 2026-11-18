/* The alley by The Darknet District: the people who hang about in it (docs/development/ALLEY_LIFE.md).
   The walkers who pass through belong to the nightlife system (ncz-nightlife.js, lane 'alley'). These are the ones who STAY: a few friends talking, someone
   smoking against the wall, someone sitting on a crate, someone reading their device, someone across from the District door who watches who goes in and out.
   They are ordinary street people (the crowd looks, no names, no dialogue, no missions), have no collision, and stand against the north wall or on the crates,
   clear of the walking lane, the District door and the security vestibule. When a player comes close they turn to look, then go back to what they were doing.
   Pure planning runs in Node (tests/ncz-alley.test.cjs); the figures run in the browser (started by neochinatown.js with the street).
   Multiplayer: the street is not a shared place (only the District interior is), so each player has their own alley; nothing here is synchronised. */
(function(root){
 'use strict';
 // World metres (x east, z north). The alley runs x 71..136 between its south wall (z -61.6) and north wall (z -55.5); the District door is in the south wall.
 const ALLEY={x0:71,x1:136,south:-61.6,north:-55.5},DOOR=[126.9,-61.9],LANE={z:-59.3,half:.75},CLEAR_DOOR=4.5;
 // Who is there. `clips` lists what the person does, in order of preference (the first one their look can play is used); `seat` is how far the figure is lowered
 // onto what they sit on; `face` is the point they look at; `tier` is the lowest quality setting that shows them (1 low, 2 medium, 3 high).
 // The owner, Nov 2026: fewer people in the alley, four at the most, and one of them is ALWAYS a drunk. Nobody else walks through (the nightlife lane here has no walkers).
 const PEOPLE=[
  {id:'alley-drunk',x:88.0,z:-56.5,face:[88.6,-60],clips:['drink','idle'],tier:1,drunk:true},
  {id:'alley-watcher',x:122.4,z:-56.25,face:DOOR,clips:['watch','idle'],tier:1,watchesDoor:true},
  {id:'alley-smoker',x:104.0,z:-56.15,face:[104.0,-60],clips:['smoke','idle'],tier:1},
  {id:'alley-sitter',x:93.6,z:-60.75,face:[93.6,-56],clips:['sit','idle'],seat:0,tier:2,sits:true}];
 const TIER={low:1,medium:2,high:3,ultra:3},CAST=['npc-hacker','npc-enforcer','npc-lookout','npc-club-m','npc-courier','npc-fixer','npc-casual-m','npc-veteran'];   // the street people (NPC upgrade, 18 Nov 2026; crowd.js street). Before: ncz-neon, fixer-01, hacker-01, outlaw-01, district-resident, district-smuggler, runner-02, communion-tech
 const config={reactRadius:3.2,reactFor:[2.5,4.5],doorWatchRadius:7,showRadius:75,turn:4};
 /* plan(quality, clipsOf): who appears, with the look and clip each will use. clipsOf(look) -> the clips that look can play. Looks are dealt in turn so
    neighbours differ; a person gets the first look in the deal that can do their first-choice clip, else any look and their best available clip. */
 function plan(quality='medium',clipsOf=()=>['idle']){
  const tier=TIER[quality]||2,out=[];let deal=0;
  for(const p of PEOPLE.filter(p=>p.tier<=tier)){
   let look=null,clip=null;
   for(const want of p.clips){for(let i=0;i<CAST.length&&!look;i++){const c=CAST[(deal+i)%CAST.length];if((clipsOf(c)||[]).includes(want)&&!out.slice(-2).some(o=>o.look===c)){look=c;clip=want;deal+=i+1;}}if(look)break;}
   if(!look){look=CAST[deal++%CAST.length];clip='idle';}
   out.push({...p,look,clip,yaw:Math.atan2(p.face[0]-p.x,p.face[1]-p.z)});}
  return out;
 }
 // True when a spot is against a wall or on the crates: out of the walking lane and well away from the District door.
 const outOfTheWay=p=>p.x>ALLEY.x0+1&&p.x<ALLEY.x1-1&&p.z<ALLEY.north-.3&&p.z>ALLEY.south+.3&&Math.abs(p.z-LANE.z)>LANE.half+.25&&Math.hypot(p.x-DOOR[0],p.z-DOOR[1])>CLEAR_DOOR;
 const api={ALLEY,DOOR,LANE,PEOPLE,CAST,config,plan,outOfTheWay};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}

 /* start({scene, parent, quality, instance, animate, player}) -> {tick(dt), stats(), dispose()}. Figures appear as their looks finish loading. */
 function start({scene,parent,quality,instance,animate=root.VoidCrowd?.animate,player=()=>typeof walker!=='undefined'?walker:null,rnd=Math.random,cfg=config}){
  const people=plan(quality,look=>root.VoidCrowd?.clips?.[look]||['idle']).map(p=>({...p,node:null,anim:null,now:p.clip,react:0,cool:0,target:p.yaw,rot:p.yaw}));let disposed=false,clock=0;
  // The looks these people wear are asked for once, in the background (several are otherwise only loaded inside the District). A person whose look has still not
  // arrived after a while wears any look that is ready and can do what they are doing (or simply stands), so the alley is never empty for long.
  const clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'];
  // Asked for only once the street is up and running (never while it is being prepared: the loader waits for everything asked of it during preparation).
  let asked=false;const askForLooks=()=>{asked=true;for(const look of new Set(people.map(p=>p.look)))try{Promise.resolve(root.VoidCharacterAssembler?.ensureLook?.(look,scene)).catch(()=>{});}catch{}};
  function spawn(p){if(p.node||disposed)return;let node=instance('crowd:'+p.look,parent);
   if(!node&&clock>(p.drunk?.5:14)){for(const want of [p.clip,'idle']){   /* the drunk must always be there: if their look is slow or missing they take any ready look at once (the sway does not need a clip) */const alt=CAST.find(c=>clipsOf(c).includes(want)&&(node=instance('crowd:'+c,parent)));if(alt){p.look=alt;p.clip=p.now=want;break;}}}
   if(!node)return;root.VoidCrowd?.dress?.(node,p.look,p.id);node.metadata={...node.metadata,crowd:p.look,alley:p.id};
   p.node=node;p.anim=animate(node,p.look,p.clip);node.position.set(p.x,-(p.seat||0),p.z);node.rotation.y=p.rot;}
  const cam=()=>scene?.activeCamera?.globalPosition||null;
  function tick(dt){
   if(disposed)return;clock+=dt;const c=cam(),me=player();if(!asked&&clock>3&&typeof mode!=='undefined'&&mode==='walking')askForLooks();
   for(const p of people){
    if(!p.node){spawn(p);continue;}
    const far=c?Math.hypot(c.x-p.x,c.z-p.z)*(root.VoidZoom?root.VoidZoom.now():1)>cfg.showRadius:false;   /* judged as the picture shows it when the camera app is zoomed (zoom-detail.js) */if(p.node.isEnabled()===far)p.node.setEnabled(!far);if(far)continue;
    // Someone close (or, for the watcher, someone at the District door) draws a look; afterwards they turn back to what they were doing.
    p.cool=Math.max(0,p.cool-dt);
    if(me){const d=Math.hypot(me.x-p.x,me.z-p.z),atDoor=p.watchesDoor&&Math.hypot(me.x-DOOR[0],me.z-DOOR[1])<cfg.doorWatchRadius;
     if((d<cfg.reactRadius||atDoor)&&p.react<=0&&p.cool<=0&&!p.sits){p.react=cfg.reactFor[0]+rnd()*(cfg.reactFor[1]-cfg.reactFor[0]);p.cool=p.react+6+rnd()*8;const glance=['watch','look','idle'].find(k=>p.anim?.has?.(k));if(glance&&glance!==p.now&&p.clip!=='smoke'){p.now=glance;p.anim.play(glance);}}
     if(p.react>0){p.react-=dt;p.target=Math.atan2(me.x-p.x,me.z-p.z);if(p.react<=0){p.target=p.yaw;if(p.now!==p.clip){p.now=p.clip;p.anim?.play(p.clip);}}}}
    let dy=p.target-p.rot;dy=Math.atan2(Math.sin(dy),Math.cos(dy));if(Math.abs(dy)>.002){p.rot+=dy*Math.min(1,dt*cfg.turn);p.node.rotation.y=p.rot;}
    // The drunk never stands straight: a slow sway on the spot, now and then a lurch.
    if(p.drunk){p.sway=(p.sway||0)+dt;const lurch=Math.max(0,Math.sin(p.sway*.23))**6;p.node.rotation.z=.07*Math.sin(p.sway*.9)+.05*lurch*Math.sin(p.sway*3.1);p.node.rotation.x=.05*Math.sin(p.sway*.61+1)+.04*lurch;}}
  }
  return {tick,people,prewarm(){for(const p of people)if(!p.node)spawn(p);},stats:()=>({people:people.length,spawned:people.filter(p=>p.node).length,reacting:people.filter(p=>p.react>0).length,clips:people.map(p=>p.id+':'+p.look+':'+p.now)}),
   dispose(){disposed=true;for(const p of people){p.anim?.dispose?.();p.node?.dispose?.();p.node=null;}}};
 }
 root.VoidAlley={...api,start};
})(typeof globalThis!=='undefined'?globalThis:this);
