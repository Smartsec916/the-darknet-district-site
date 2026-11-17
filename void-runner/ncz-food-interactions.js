/* Street-food conversations and first-person counter seating. No save fields. */
(function(root){
 'use strict';
 const F=root.VoidFoodStands;if(!F||typeof VoidInteractions==='undefined')return;
 let seated=null,lookPointer=null;
 function stand(){if(!seated||!walker)return;const b=seated.before;walker.x=b.x;walker.z=b.z;walker.y=b.y;walker.yaw=b.yaw;walker.pitch=b.pitch;seated=null;resumeWalking();}
 VoidInteractions.register('ncz-food-vendor',({item,resume})=>{const line=F.order[item.quarter];F.greet(item.quarter);if(line)announce(F.STANDS[item.quarter].name+': '+line);resume();});
 VoidInteractions.register('ncz-food-seat',({item})=>{
  const seat=F.seats(item.quarter).find(s=>s.seat===item.seat&&!s.occupied);if(!seat||!walker)return;
  seated={quarter:item.quarter,before:{x:walker.x,z:walker.z,y:walker.y,yaw:walker.yaw,pitch:walker.pitch}};
  walkingKeys.clear();clearInput();document.exitPointerLock?.();walker.x=seat.x;walker.z=seat.z;walker.y=1.55;walker.yaw=seat.yaw;walker.pitch=0;mode='food-seated';
  announce('You sit at '+F.STANDS[item.quarter].name+'. E or Space to stand.');
 });
 const previousUpdate=update;
 update=function(dt){if(mode!=='food-seated')return previousUpdate(dt);time+=dt;VoidAudio.tick(dt);$('walking-caption').textContent=F.STANDS[seated.quarter].name.toUpperCase();$('walking-interact').textContent='[E] STAND UP';$('walking-interact').disabled=false;};
 const previousDraw=draw;
 draw=function(){if(mode!=='food-seated')return previousDraw();mode='walking';try{previousDraw();}finally{mode='food-seated';}};
 addEventListener('keydown',e=>{if(mode!=='food-seated'||!['KeyE','Space','Escape'].includes(e.code))return;e.preventDefault();e.stopImmediatePropagation();stand();},true);
 canvas.addEventListener('click',()=>{if(mode==='food-seated')canvas.requestPointerLock?.()?.catch?.(()=>{});});
 canvas.addEventListener('pointerdown',e=>{if(mode==='food-seated')lookPointer={x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointerup',()=>lookPointer=null);
 canvas.addEventListener('pointermove',e=>{if(mode!=='food-seated'||!walker)return;const locked=document.pointerLockElement===canvas;if(!locked&&!lookPointer)return;const dx=locked?e.movementX:e.clientX-lookPointer.x,dy=locked?e.movementY:e.clientY-lookPointer.y;walker.yaw+=dx*VoidExplorer.config.sensitivity;walker.pitch=FM.clamp(walker.pitch+dy*VoidExplorer.config.sensitivity,-1.35,1.35);if(lookPointer)lookPointer={x:e.clientX,y:e.clientY};});
 $('walking-interact').addEventListener('click',e=>{if(mode!=='food-seated')return;e.preventDefault();e.stopImmediatePropagation();stand();},true);
 root.VoidFoodSeat={get active(){return !!seated;},stand};
})(globalThis);
