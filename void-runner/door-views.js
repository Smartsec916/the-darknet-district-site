/* DOORWAY VIEWS AND THE DOOR TRANSITION (the owner, 20 Nov 2026: every housing door "is really a short loading screen into the next area"; "slide open and show part of the
   next area in the doorway ... make it feel seamless. Fine with it being faked"; both directions, everywhere). Browser only; no network beyond the images.
   - VIEWS: one still picture per destination style and quarter (void-runner/art/door-views/<key>.webp, 256 x 512), taken from that doorway at eye height in the real interior
     by tools/door-views/bake.cjs (Playwright, the game itself). Behind every door that leads elsewhere a short dark reveal (two jambs and a head) holds the picture a little
     way in, so as the door slides open the player sees the hallway, the apartment, the street at night, the module's first room, the checkpoint or the stair landing.
     One unlit material per picture per built place (lifted a little, level 1.45, so the lit place beyond reads in a dark corridor); nothing renders live.
   - THE PASS: walking into the open door (or E) waits until the door is open (DOOR.wait), then a short black fade (DOOR.fadeIn), the place is swapped behind it (the
     game's silent load, no "Preparing" card), and the fade lifts (DOOR.fadeOut). Every sliding door shares one timing (VoidApartments.DOOR: open, hold, wait).
   Used by apartment-build.js / apartment-integration.js (housing), module-build.js / module-integration.js (module locations), ncz-backalleys.js and
   ncz-underground-integration.js (the tunnels' stair doors). Keys: hall-<style>, hallx-<style> (the hallway seen from an apartment's door), apt-<style>,
   street-<quarter>, mod-<module style>, checkpoint, landing. A missing picture falls back to a dark doorway. */
(function(root){
 'use strict';
 const QUARTERS=['avenue','oldtown','far-south','port','outskirts'],HOUSING=['rundown','normal','luxury','container-rundown','container-regular'];
 const MOD_STYLES=['corp','tech','back','clinic','kitchen','den','garage','pit','gang','tunnel'];
 const KEYS=[...HOUSING.flatMap(s=>['hall-'+s,'hallx-'+s,'apt-'+s]),...QUARTERS.map(q=>'street-'+q),...MOD_STYLES.map(s=>'mod-'+s),'checkpoint','landing'];
 // where each picture is taken (tools/door-views/bake.cjs): the representative module of each style, entered through its first door
 const MOD_SAMPLE={corp:'hall-office',tech:'maint-corridor',back:'hall-commercial',clinic:'clinic',kitchen:'noodle-kitchen',den:'tea-room',garage:'scooter-bay',pit:'fight-pit',gang:'gang-vestibule',tunnel:'tunnel'};
 const script=typeof document!=='undefined'?document.currentScript:null,base=script&&script.src?new URL('art/door-views/',script.src).href:'void-runner/art/door-views/';
 const url=key=>base+key+'.webp';
 const street=q=>'street-'+(QUARTERS.includes(q)?q:'avenue');
 const mod=s=>MOD_STYLES.includes(s)?'mod-'+s:'mod-corp';
 const housing=(kind,style)=>kind+'-'+(HOUSING.includes(style)?style:'normal');
 /* A material cache for one built place (pass the same object to every view of that place; dispose it with the place). */
 function cache(B,scene,own){const m=new Map();return {get(key){if(!KEYS.includes(key))key=null;const k=key||'dark';if(m.has(k))return m.get(k);
   const mat=new B.StandardMaterial('door-view-'+k,scene);mat.disableLighting=true;mat.diffuseColor=B.Color3.Black();mat.specularColor=B.Color3.Black();
   if(key){const t=new B.Texture(url(key),scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE,null,()=>{mat.emissiveColor=new B.Color3(.02,.02,.025);});t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;t.level=1.45;mat.emissiveTexture=t;mat.emissiveColor=B.Color3.Black();own&&own.push(t);}
   else mat.emissiveColor=new B.Color3(.02,.02,.025);
   own&&own.push(mat);m.set(k,mat);return mat;},dark(){if(!m.has('#jamb')){const j=new B.StandardMaterial('door-view-jamb',scene);j.diffuseColor=new B.Color3(.05,.05,.055);j.specularColor=B.Color3.Black();j.emissiveColor=new B.Color3(.012,.012,.014);own&&own.push(j);m.set('#jamb',j);}return m.get('#jamb');}};}
 /* The reveal behind one door. at: the middle of the door opening on the floor [x, y, z]; n: [nx, nz] the way through the door (away from the viewer); w, h: the opening;
    depth: how far in the picture stands; parent; cache (above); own (disposed with the place). Returns the meshes. */
 function reveal(B,scene,{at,n,w=1.05,h=2.15,depth=.45,key,cache:c,parent=null,own=null}){
  const ry=Math.atan2(n[0],n[1]),t=[n[1],-n[0]],P=(a,b,y)=>new B.Vector3(at[0]+t[0]*a+n[0]*b,(at[1]||0)+y,at[2]+t[1]*a+n[1]*b),out=[];
  const pic=B.MeshBuilder.CreatePlane('door-view',{width:w+.1,height:h+.08},scene);pic.position=P(0,depth,(h+.08)/2);pic.rotation.y=ry;pic.material=c.get(key);out.push(pic);
  const jam=[];const bx=(a,b,y,sx,sy,sz)=>{const m=B.MeshBuilder.CreateBox('door-view-jamb',{width:sx,height:sy,depth:sz},scene);m.position=P(a,b,y);m.rotation.y=ry;jam.push(m);};
  bx(-(w/2+.06),depth/2,h/2,.1,h+.1,depth);bx(w/2+.06,depth/2,h/2,.1,h+.1,depth);bx(0,depth/2,h+.05,w+.22,.1,depth);bx(0,depth/2,-.01,w+.22,.02,depth);
  const merged=jam.length>1?B.Mesh.MergeMeshes(jam,true,true):jam[0];if(merged){merged.material=c.dark();out.push(merged);}
  for(const m of out){m.isPickable=false;if(parent)m.parent=parent;m.freezeWorldMatrix?.();own&&own.push(m);}return out;}
 /* The pass through a door: wait for it to open, fade, swap, lift. fn: the swap (async). */
 let veil=null;function veilEl(){if(veil||typeof document==='undefined')return veil;veil=document.createElement('div');veil.id='door-veil';veil.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .2s ease;z-index:61';document.body.append(veil);return veil;}
 const T=()=>root.VoidApartments?.DOOR||{open:.6,hold:1.5,wait:.62,fadeIn:.18,fadeOut:.32};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 async function pass(fn,{wait=false}={}){const v=veilEl(),D=T();if(wait)await sleep(D.wait*1000);
  if(v){v.style.transition='opacity '+D.fadeIn+'s ease-in';v.style.opacity='1';await sleep(D.fadeIn*1000+20);}
  try{return await fn();}finally{if(v){await sleep(60);v.style.transition='opacity '+D.fadeOut+'s ease-out';v.style.opacity='0';}}}
 root.VoidDoorViews={KEYS,QUARTERS,HOUSING,MOD_STYLES,MOD_SAMPLE,url,street,mod,housing,cache,reveal,pass};
})(globalThis);
