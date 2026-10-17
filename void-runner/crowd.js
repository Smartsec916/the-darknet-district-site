/* Crowd looks: which CC0 MakeHuman figures (tools/animation-pipeline/characters) dress the ambient crew-* NPCs
   at each place, and which mocap clip each one plays. Named characters never use these. Data and small helpers;
   the pure part is tested in Node. Missing models fall back to the procedural crew figure. */
(function(root){
 const base='assets/models/crowd/';
 // Clips each look carries (must match its character spec).
 const clips={
  'vesper-mechanic':['idle','talk','work','watch','walk'],'vesper-pilot':['idle','talk','work','watch','sit','walk'],'vesper-trader':['idle','talk','work','watch','sit','walk'],
  'order-farmhand':['idle','talk','work','watch','walk'],'order-grower':['idle','talk','work','watch','walk'],'order-militia':['idle','talk','work','watch','walk'],
  'communion-worker':['idle','talk','work','watch','walk'],'communion-tech':['idle','talk','work','watch','sit','walk'],'cyborg-01':['idle','talk','work','watch','sit','walk'],
  'ncz-neon':['idle','talk','watch','walk'],'fixer-01':['idle','talk','watch','sit','walk'],'runner-02':['idle','talk','watch','walk'],
  'hacker-01':['idle','talk','sit','smoke','watch','walk'],'district-smuggler':['idle','talk','sit','smoke','walk'],'district-resident':['idle','talk','sit','smoke','walk'],
  'outlaw-01':['idle','talk','sit','smoke','watch','walk'],'regular-01':['idle','talk','sit','watch','walk']
 };
 // Each place has its own feel; the order spreads looks across a scene's crew.
 const frontierMix=['vesper-mechanic','regular-01','vesper-pilot','communion-worker','outlaw-01'];
 const casts={
  vesper:['vesper-mechanic','vesper-trader','vesper-pilot'],                       // Outer Rim desert frontier
  meridian:['hacker-01','vesper-trader','fixer-01','outlaw-01','cyborg-01','regular-01'], // everyone passes through
  kepler:frontierMix,foundry:frontierMix,'sol-belt':frontierMix,mars:frontierMix,
  rusthaven:['outlaw-01','district-smuggler','vesper-trader','regular-01'],          // pirates and outlaws
  vigil:['communion-worker','communion-tech','cyborg-01'],nexus:['communion-worker','communion-tech','cyborg-01'],
  holdfast:['order-farmhand','order-militia','order-grower'],'order-homeworld':['order-farmhand','order-grower','order-militia','vesper-mechanic'],
  neochinatown:['ncz-neon','fixer-01','runner-02','communion-tech'],               // street crowd
  district:['hacker-01','district-smuggler','district-resident','outlaw-01']       // The Darknet District
 };
 // NeoChinatown and The Darknet District share one scene; these crew belong to the District.
 const districtCrew=/^crew-(vr|bar|smoke)/;
 function castFor(location,id){return location==='neochinatown'&&districtCrew.test(id)?casts.district:casts[location]||null;}
 function hash(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
 function clipFor(id){
  if(/smoke/.test(id))return 'smoke';
  if(/crew-vr|patient|-sit/.test(id))return 'sit'; // VR chairs, the couch, cots, stools
  if(/pray|watch/.test(id))return 'watch';
  if(/repair|work/.test(id))return 'work';
  if(/farm/.test(id))return Number(id.replace(/\D/g,''))%2?'work':'watch';
  if(/teach|learn|medic|bar|talk/.test(id))return 'talk';
  return ['idle','talk','watch'][hash(id)%3];
 }
 // Which station activity state plays which clip (Meridian's moving crew).
 const activityClip={sit:'sit',drink:'sit',talk:'talk',window:'watch',terminal:'watch','get-drink':'idle',waiting:'idle',idle:'idle'};
 function clipIn(look,want){const have=clips[look]||[];return have.includes(want)?want:'idle';}
 // Model definitions to preload for a place. Low quality keeps the light procedural crew.
 function models(location,quality){
  if(quality==='low'||!casts[location])return {};
  const set=new Set(casts[location]);if(location==='neochinatown')casts.district.forEach(l=>set.add(l));
  return Object.fromEntries([...set].map(l=>['crowd:'+l,{src:base+l+'.glb'}]));
 }
 // Looks are dealt round-robin per place so neighbours differ, skipping looks without the clip that spot needs.
 let dealt=new Map();
 function begin(){dealt=new Map();}
 function pick(location,id,clip=clipFor(id)){const cast=castFor(location,id);if(!cast)return null;const key=cast===casts.district?'district':location,n=dealt.get(key)||0;dealt.set(key,n+1);for(let i=0;i<cast.length;i++){const look=cast[(n+i)%cast.length];if(clips[look].includes(clip))return look;}return cast[n%cast.length];}

 // Browser side: one controller per figure, playing a clip from its own cloned animation groups.
 const groups=new Set();
 function animate(node,look,clip){
  const list=node.metadata?.animationGroups||[];list.forEach(g=>groups.add(g));
  const bones={};for(const t of node.getDescendants(false))for(const b of ['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftArm','RightArm'])if(t.name.endsWith('mixamorig:'+b)&&t.rotationQuaternion)bones[b]={node:t,rest:t.rotationQuaternion.clone()};
  const speed=.9+(hash(node.name)%20)/100;let current=null,walking=false;
  function play(name){
   name=clipIn(look,name);if(current?.name===name&&!walking)return;walking=false;
   const next=list.find(g=>g.name===name||g.name.endsWith('-'+name))||list[0];if(!next)return;for(const g of list)if(g!==next)g.stop();
   next.start(true,speed,next.from,next.to);next.goToFrame(next.from+(next.to-next.from)*((hash(node.name+name)%100)/100));current=next;
  }
  // Walking plays the Quaternius walk loop (CC0). A look without it holds the idle clip's first pose (arms down)
  // and swings its legs and arms from there.
  function walk(time){
   if(clipIn(look,'walk')==='walk'){play('walk');return;}
   const B=root.BABYLON;
   if(!walking){const idle=list.find(g=>g.name==='idle'||g.name.endsWith('-idle'))||list[0];for(const g of list)if(g!==idle)g.stop();
    if(idle){idle.start(false,1,idle.from,idle.to);idle.goToFrame(idle.from);idle.pause();}current=null;walking=true;
    for(const b of Object.values(bones))b.base=b.node.rotationQuaternion.clone();}
   const s=Math.sin(time*5.2),bend=x=>Math.max(0,x)*.55;
   const swing=(b,angle)=>{const k=bones[b];if(k?.base)k.node.rotationQuaternion.copyFrom(k.base.multiply(B.Quaternion.RotationAxis(B.Axis.X,angle)));};
   swing('LeftUpLeg',s*.36);swing('RightUpLeg',-s*.36);swing('LeftLeg',bend(-Math.sin(time*5.2+1.3)));swing('RightLeg',bend(Math.sin(time*5.2+1.3)));swing('LeftArm',-s*.18);swing('RightArm',s*.18);
  }
  play(clip);return {play,walk,look};
 }
 function release(){for(const g of groups)g.dispose();groups.clear();}

 const api={casts,clips,castFor,clipFor,activityClip,clipIn,models,begin,pick,animate,release};
 if(typeof module!=='undefined')module.exports=api;else root.VoidCrowd=api;
})(globalThis);
