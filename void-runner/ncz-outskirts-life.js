/* The residents of The Outskirts (the owner, 16 Nov 2026): "about half of the people living in The Outskirts will look like NPCs from north of Far South Gate and the other half
   look poor". Ambient figures only: no names, no dialogue, no voices, no interactions, no missions, no collision. They live in that quarter only (started by neochinatown.js for
   the Outskirts' build and nowhere else), so nobody here is streamed to another quarter; like the alley's people they are not synchronised between players.
   HALF look like the street crowd (the same looks as ncz-alley.js). The OTHER HALF are the same bodies made to read as poor: their clothes and shoes are re-tinted dull, faded,
   dirty and mismatched (each piece its own worn colour), and anything that is street gear, a mask, a headset or neon trim is hidden. Deterministic from a seed.
   What they do uses only clips the looks already have: standing and talking, sitting, smoking, drinking, watching, and a few walking the gravel lanes. Pure planning runs in Node
   (tests/ncz-outskirts-life.test.cjs). Figures hide with distance (zoom-detail rule) and wait for their looks to load, as the alley's do. */
(function(root){
 'use strict';
 const CAST=['npc-outskirts-f','npc-outskirts-m','npc-veteran','npc-outskirts-f','npc-elder-f','npc-outskirts-m','npc-courier','npc-cyber-respirator','npc-casual-f'];   // the Outskirts' own people first (NPC upgrade, 18 Nov 2026: #21, #22; crowd.js street). Before: the street crowd's eight MakeHuman looks
 // x, z (world metres, clear of the containers in ncz-containers.js), what they do (clips in order of preference), who they face, and `poor`.
 const PEOPLE=[
  // around the fire barrel in the plaza
  {id:'os-fire-1',x:59.6,z:-238.9,face:[61,-238],clips:['talk','idle'],poor:true},{id:'os-fire-2',x:62.5,z:-239.2,face:[61,-238],clips:['talk','idle'],poor:true},{id:'os-fire-3',x:61.2,z:-236.3,face:[61,-238],clips:['idle','talk'],poor:false},
  // sitting and smoking near the walls
  {id:'os-sit-1',x:70.0,z:-251.6,face:[70,-246],clips:['sit','idle'],poor:true,seat:0,sits:true},{id:'os-smoke-1',x:73.5,z:-232.2,face:[73.5,-228],clips:['smoke','idle'],poor:false},{id:'os-drink-1',x:79.2,z:-243.5,face:[84,-243.5],clips:['drink','idle'],poor:true},
  {id:'os-watch-1',x:55.5,z:-231.2,face:[61,-228],clips:['watch','idle'],poor:false},{id:'os-talk-1',x:53.6,z:-244.0,face:[52.2,-244.9],clips:['talk','idle'],poor:true},{id:'os-talk-2',x:52.2,z:-245.6,face:[53.6,-244.0],clips:['talk','idle'],poor:false},
  {id:'os-sit-2',x:43.0,z:-233.0,face:[47,-233],clips:['sit','idle'],poor:false,seat:0,sits:true},{id:'os-lean-1',x:66.5,z:-254.2,face:[66.5,-250],clips:['idle','watch'],poor:true},
  {id:'os-smoke-2',x:36.2,z:-245.0,face:[44,-245],clips:['smoke','idle'],poor:true},{id:'os-lane-1',x:30,z:-245,face:[40,-245],clips:['idle'],poor:false},
  // a few who walk the gravel (x or z ping-pong between two points)
  {id:'os-walk-1',x:48,z:-236,to:[76,-236],clips:['walk','idle'],poor:true,walks:true},{id:'os-walk-2',x:70,z:-248.4,to:[49,-248.4],clips:['walk','idle'],poor:false,walks:true},{id:'os-walk-3',x:96,z:-244,to:[104,-244],clips:['walk','idle'],poor:true,walks:true}];
 const TIER={low:1,medium:2,high:3,ultra:3},KEEP={low:7,medium:15,high:16,ultra:16};
 // The dull, faded, dirty colours of worn clothes (multiplied into the look's own colours): earth, ash, faded blue, rust, olive. A piece takes its own, so an outfit is mismatched.
 const WORN=[[.42,.38,.31],[.34,.35,.33],[.3,.34,.42],[.46,.32,.26],[.33,.36,.27],[.4,.4,.38]];
 const CLOTHES=/suit|cloth|shirt|jacket|coat|pants|trouser|jean|dress|top|hood|sweater|shoe|boot|sock|skirt|vest/i,GEAR=/mask|headset|tracker|visor|goggle|neon|glow|armband|badge|cyber|helmet/i;
 const rng=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};};
 function plan(quality='medium',clipsOf=()=>['idle'],seed=4127){const r=rng(seed),keep=KEEP[quality]||KEEP.medium,out=[];let deal=0;
  const list=quality==='low'?PEOPLE.filter((_,i)=>i%2===0||PEOPLE[i].poor&&i%3===0).slice(0,keep):PEOPLE.slice(0,keep);
  for(const p of list){let look=null,clip=null;for(const want of p.clips){for(let i=0;i<CAST.length&&!look;i++){const c=CAST[(deal+i)%CAST.length];if((clipsOf(c)||[]).includes(want)){look=c;clip=want;deal+=i+1;}}if(look)break;}
   if(!look){look=CAST[deal++%CAST.length];clip='idle';}
   out.push({...p,look,clip,yaw:Math.atan2((p.face?p.face[0]-p.x:p.to[0]-p.x),(p.face?p.face[1]-p.z:p.to[1]-p.z)),worn:p.poor?WORN.map((_,i)=>WORN[(i+Math.floor(r()*WORN.length))%WORN.length]):null});}
  return out;}
 const api={CAST,PEOPLE,WORN,CLOTHES,GEAR,KEEP,plan};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 // ---- the browser part ----
 function start({scene,parent,quality,instance,animate=root.VoidCrowd?.animate,player=()=>typeof walker!=='undefined'?walker:null}){
  const clipsOf=look=>root.VoidCrowd?.clips?.[look]||['idle'],people=plan(quality,clipsOf).map(p=>({...p,node:null,anim:null,now:p.clip,rot:p.yaw,t:0,dir:1}));let disposed=false,clock=0,asked=false;const own=[];
  const B=root.BABYLON,cam=()=>scene?.activeCamera?.globalPosition||null;
  // Make one figure read as poor: every piece of clothing and footwear gets its own dull colour and more roughness; street gear, masks and neon trim are hidden.
  function poor(node,p){let k=0;for(const m of node.getChildMeshes()){const mat=m.material,nm=(mat?.name||'')+' '+(m.name||'');if(GEAR.test(nm)){m.setEnabled(false);continue;}
   if(mat&&CLOTHES.test(nm)&&(mat.albedoColor||mat.diffuseColor)){const c=p.worn[k++%p.worn.length],cl=mat.clone(mat.name+'-worn-'+p.id);if(cl.albedoColor)cl.albedoColor=cl.albedoColor.multiply(new B.Color3(c[0]*1.8,c[1]*1.8,c[2]*1.8));else cl.diffuseColor=cl.diffuseColor.multiply(new B.Color3(c[0]*1.8,c[1]*1.8,c[2]*1.8));if('roughness' in cl)cl.roughness=Math.min(1,(cl.roughness??.6)+.35);if(cl.emissiveColor)cl.emissiveColor=cl.emissiveColor.scale(.3);own.push(cl);m.material=cl;}}}
  const askForLooks=()=>{asked=true;for(const look of new Set(people.map(p=>p.look)))try{Promise.resolve(root.VoidCharacterAssembler?.ensureLook?.(look,scene)).catch(()=>{});}catch{}};
  function spawn(p){if(p.node||disposed)return;const node=instance('crowd:'+p.look,parent);if(!node)return;node.metadata={...node.metadata,crowd:p.look,alley:p.id,outskirts:true};p.node=node;if(root.VoidCrowd?.street?.[p.look])root.VoidCrowd.dress(node,p.look,p.id,p.poor?'worn':null);else if(p.poor)poor(node,p);   /* a street figure is one material: its worn variant (npc-variants.js) instead of re-colouring pieces */
   p.anim=animate(node,p.look,p.clip);node.position.set(p.x,-(p.seat||0),p.z);node.rotation.y=p.rot;}
  function tick(dt){if(disposed)return;clock+=dt;const c=cam();if(!asked&&clock>3&&typeof mode!=='undefined'&&mode==='walking')askForLooks();
   for(const p of people){if(!p.node){spawn(p);continue;}
    const far=c?Math.hypot(c.x-p.x,c.z-p.z)*(root.VoidZoom?root.VoidZoom.now():1)>80:false;if(p.node.isEnabled()===far)p.node.setEnabled(!far);if(far)continue;
    if(p.walks){const [tx,tz]=p.dir>0?p.to:[p.x0??(p.x0=p.x,p.x0),p.z0??(p.z0=p.z,p.z0)];void tx;const a=p.dir>0?p.to:[p.x0,p.z0],dx=a[0]-p.node.position.x,dz=a[1]-p.node.position.z,d=Math.hypot(dx,dz);
     if(d<.3)p.dir*=-1;else{const s=Math.min(d,1.0*dt);p.node.position.x+=dx/d*s;p.node.position.z+=dz/d*s;p.rot=Math.atan2(dx,dz);p.node.rotation.y=p.rot;}}}}
  return {tick,people,stats:()=>({people:people.length,spawned:people.filter(p=>p.node).length,poor:people.filter(p=>p.poor).length}),dispose(){disposed=true;for(const p of people){p.anim?.dispose?.();p.node?.dispose?.();p.node=null;}for(const o of own)try{o.dispose();}catch{}own.length=0;}};
 }
 root.VoidOutskirtsLife={...api,start};
})(typeof globalThis!=='undefined'?globalThis:this);
