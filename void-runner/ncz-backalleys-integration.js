/* THE BACK ALLEYS' FIRE ESCAPES IN PLAY (browser only; ncz-backalleys.js has the data and the rules, docs/development/AI_HANDOFF.md 20 Nov 2026).
   - CLIMBING (the owner: "jump at the fire escape to climb"): the lowest ladder section hangs 1.55 m off the ground like a real drop ladder. Jump (the game's own jump:
     Space, the on-screen JUMP, a pad) while standing at its foot and facing the wall: the player grabs it and climbs to the landing (a short climb, not a jump cut). On the
     landing he walks along it; jump again, or walk off the ladder end, and he climbs back down. No menu prompt is involved.
   - THE WINDOW (on the landing): its prompt only shows while one of the player's missions uses that building's street door (apartments.js doorsInUse, the street door's own
     prompt rule); it opens only while the apartment placed there is available (its "available from" step reached: the street door's opening rule), otherwise "The window is
     shut." No hacking, ever. Through it the player comes into that apartment's HALLWAY at its far end (opposite the street door), facing back down the corridor.
   - THE STAIRS DOWN TO THE TUNNELS (one per quarter, UNDERGROUND_ENTRANCES): the walk follows the stairs' height (groundAt); the steel door at the bottom is closed, no prompt.
   - THE HALLWAY'S WINDOW: at the far end of a city hallway, "CLIMB OUT OF THE WINDOW" puts the player back in the alley at the foot of that building's fire escape (only for a
     building that has one).
   Wraps VoidExplorer.step / select (the walker only), groundAction (a jump on the landing), VoidNeoChinatown.layout (the window prompts) and VoidApartments.layout (the hallway's). */
(function(root){
 'use strict';
 const BA=root.VoidBackAlleys,A=root.VoidApartments,E=root.VoidExplorer;if(!BA||!A||!E||typeof document==='undefined')return;
 const W=()=>{try{return typeof walker!=='undefined'?walker:null;}catch{return null;}};
 const note=t=>{try{resumeWalking();}catch{}try{announce(t);}catch{}};
 let st=null;   // {e: the escape, phase: 'up' | 'perch' | 'down', k, loc}
 let used=new Set(),usedAt=0;const inUse=()=>{const now=performance.now();if(now-usedAt>400){usedAt=now;try{used=A.inUse?A.inUse():new Set();}catch{used=new Set();}}return used;};
 // ---- the window prompts in the street (one per fire escape of the quarter; hidden unless the player stands on that landing and the door is in use) ----
 {const NC=root.VoidNeoChinatown;if(NC&&NC.layout&&!NC.layout.backAlleys){const orig=NC.layout;NC.layout=function(area){const l=orig.apply(this,arguments);
   if(area==='street'&&l&&l.quarter)l.interactions=[...l.interactions,...BA.escapesIn(l.quarter).map(e=>({id:'fe-window-'+e.door,label:'OPEN THE WINDOW',position:[e.x+e.u[0]*.3+e.t[0]*-.25,BA.ESC.H+1.7,e.z+e.u[1]*.3+e.t[1]*-.25],action:'fe-window',door:e.door,range:1.7,hidden:true}))];return l;};NC.layout.backAlleys=true;}}
 // ---- the hallway: the window at its far end; entered through the window, the player stands there facing back down the corridor ----
 let viaWindow=false;
 {const orig=A.layout;if(orig&&!orig.backAlleys){A.layout=function(part,style){const def=orig.apply(this,arguments);try{if(part==='hall'&&def&&!def.container){const H=A.geo(def.style).HALL,v=A.visit,e=v&&v.door?BA.escapeFor(v.door.id):null;
    def.interactions.push({id:'hall-window',label:'CLIMB OUT OF THE WINDOW',position:A.world([H.x[1]-.45,1.7,0]),action:'apt-hall-window',range:1.6,hidden:!e});
    if(viaWindow){viaWindow=false;def.spawn=[A.ORIGIN[0]+H.x[1]-1.45,1.7,A.ORIGIN[1]];def.yaw=-Math.PI/2;}}}catch(err){console.warn('[back alleys] hallway window',err);}return def;};A.layout.backAlleys=true;}}
 // ---- climbing and the landing ----
 const step0=E.step,select0=E.select;
 const H=()=>BA.ESC.H+.05;
 function down(){if(st&&st.phase==='perch'){st.phase='down';st.k=0;try{root.VoidAudio?.event?.('step');}catch{}}}
 E.step=function(p,input,dt,loc){const me=W();if(!me||p!==me)return step0.apply(this,arguments);
  if(st&&st.loc!==loc){st=null;p.height=0;}
  if(!st){if(p.jumpRequested&&loc&&loc.area==='street'&&loc.quarter&&!(p.height>0)){const e=BA.grab(p,loc.quarter);if(e){p.jumpRequested=false;st={e,phase:'up',k:0,loc};p.vx=p.vz=p.vy=0;}}
   // the stairs down to the tunnels' doors (UNDERGROUND_ENTRANCES): the ordinary walk, then the ground's height under him (the stairwell's walls are solid; the stairs are walked)
   if(!st){const r=step0.apply(this,arguments);if(loc&&loc.area==='street'){const g=BA.groundAt(p.x,p.z);if(g<0)p.y+=g;}return r;}}
  dt=Math.max(0,Math.min(.1,dt));p.jumpRequested=false;
  if(st.phase!=='perch'){const up=st.phase==='up';st.k+=dt/(up?BA.CLIMB.up:BA.CLIMB.down);const k=Math.min(1,st.k),pose=BA.climbPose(st.e,up?k:1-k);p.x=pose.x;p.z=pose.z;p.vx=p.vz=p.vy=0;p.height=Math.max(.001,pose.h);p.eye=1.68;p.y=p.eye+p.height;
   if(k>=1){if(up)st.phase='perch';else{p.height=0;p.y=p.eye;st=null;}}return;}
  // on the landing: the ordinary walk (no walls: the landing itself is the limit), clamped to the grating; off the ladder end, he climbs down
  const was={x:p.x,z:p.z};p.height=0;step0.call(this,p,input,dt,{...loc,solids:[],bounds:[1e5,1e5]});const c=BA.perch(st.e,p);
  if(c.off){p.x=was.x;p.z=was.z;down();}else{p.x=c.x;p.z=c.z;}p.height=H();p.vy=0;p.y=(p.eye||1.68)+p.height;};
 E.select=function(p,loc,allowed){const me=W();if(!me||p!==me||!st)return select0.apply(this,arguments);if(st.phase!=='perch')return null;
  const it=(loc.interactions||[]).find(i=>i.action==='fe-window'&&i.door===st.e.door);if(!it)return null;it.hidden=!inUse().has(st.e.door);if(it.hidden)return null;
  it.hidden=false;const r=select0.call(this,p,{...loc,solids:[],interactions:[it]},allowed);it.hidden=true;return r;};
 // a jump on the landing (the walker is off the ground, so the ordinary jump is not asked for): climb down
 if(typeof groundAction==='function'){const ga=groundAction;groundAction=function(a){if(a==='jump'&&st&&st.phase==='perch'){down();return;}return ga.apply(this,arguments);};}
 // ---- the interactions ----
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof announce==='undefined')return;clearInterval(wait);
  VoidInteractions.register('fe-window',async({item})=>{const d=A.door(item.door);if(!d)return;const inst=BA.windowOpen(item.door,A.open());if(!inst){note('The window is shut.');return;}
   try{resumeWalking();}catch{}st=null;const me=W();if(me)me.height=0;viaWindow=true;try{await A.enterHall(d,A.open().filter(a=>a.door===item.door));}finally{viaWindow=false;}});
  VoidInteractions.register('apt-hall-window',({item})=>{const v=A.visit,e=v&&v.door?BA.escapeFor(v.door.id):null;if(!e){note('The window is painted shut. No fire escape outside this building.');return;}
   try{resumeWalking();}catch{}A.backToStreet({quarter:e.quarter,spawn:[e.foot[0],1.7,e.foot[1]],yaw:Math.atan2(e.u[0],e.u[1])});});},300);
 root.VoidBackAlleys.live=()=>st?{escape:st.e.id,door:st.e.door,phase:st.phase,k:st.k}:null;
})(globalThis);
