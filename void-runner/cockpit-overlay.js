/* Painted Kestrel cockpit drawn over the 3D space view. The canopy openings are
   transparent, so Babylon's sky, targets and stations show through them. The
   dashboard's three blank screens carry the live SHIP / NAV / WEAPONS readouts.
   Until the image loads (or if it fails) the 3D box cockpit stays in use. */
(function(root){
 const SOURCE={width:1672,height:941};
 // Screen interiors in source-image pixels.
 const screens={
  ship:{x:432,y:627,w:255,h:128},
  nav:{x:762,y:560,w:149,h:83},
  weapons:{x:977,y:627,w:255,h:128}
 };
 const image=typeof Image!=='undefined'?new Image():null;
 const api={ready:false,failed:false,screens,source:SOURCE,layout,draw};
 if(image){
  image.decoding='async';
  image.onload=()=>{api.ready=true;document.body?.classList.add('painted-cockpit');};
  image.onerror=()=>{api.failed=true;};
  image.src=new URL('art/cockpit-kestrel-pilot.webp',document.currentScript?.src||location.href).href;
 }
 // The pilot sits close to the canopy: only this part of the painting is framed on
 // screen, so the window posts sit near the screen edges and the seat and lower
 // console fall off the bottom. The dashboard screens stay fully visible.
 const VIEW={x0:230,x1:1442,bottom:768};
 function layout(width,height){
  const scale=Math.max(width/(VIEW.x1-VIEW.x0),height/VIEW.bottom);
  return {scale,x:width/2-(VIEW.x0+VIEW.x1)/2*scale,y:height-VIEW.bottom*scale};
 }
 const pct=v=>Math.max(0,Math.min(999,Math.round(Number(v)||0)))+'%';
 function readout(ctx,box,title,rows,time){
  const {x,y,w,h}=box,pad=Math.max(4,w*.05),lineH=(h-pad*2)/(rows.length+1.25);
  ctx.save();
  ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  const glow=ctx.createLinearGradient(x,y,x,y+h);glow.addColorStop(0,'rgba(18,40,46,.92)');glow.addColorStop(1,'rgba(6,16,20,.95)');
  ctx.fillStyle=glow;ctx.fillRect(x,y,w,h);
  // Faint scan lines keep the screens feeling physical.
  ctx.globalAlpha=.08;ctx.fillStyle='#9fe8dc';for(let sy=y+((time*18)%3);sy<y+h;sy+=3)ctx.fillRect(x,sy,w,1);ctx.globalAlpha=1;
  const size=Math.max(8,Math.min(lineH*.72,w*.085));
  ctx.textBaseline='middle';
  ctx.font='bold '+size+'px Consolas, monospace';ctx.fillStyle='#e8a862';ctx.textAlign='left';
  ctx.fillText(title,x+pad,y+pad+lineH*.5);
  ctx.font=size*.92+'px Consolas, monospace';
  rows.forEach(([label,value,color],i)=>{
   const ry=y+pad+lineH*(i+1.6);
   ctx.fillStyle='#8fa4a6';ctx.textAlign='left';ctx.fillText(label,x+pad,ry);
   ctx.fillStyle=color||'#8fe3d7';ctx.textAlign='right';ctx.fillText(String(value),x+w-pad,ry);
  });
  ctx.restore();
 }
 function draw(ctx,width,height,data={},time=0){
  if(!api.ready)return false;
  const L=layout(width,height);
  ctx.drawImage(image,L.x,L.y,SOURCE.width*L.scale,SOURCE.height*L.scale);
  const place=b=>({x:L.x+b.x*L.scale,y:L.y+b.y*L.scale,w:b.w*L.scale,h:b.h*L.scale});
  const short=v=>String(v||'').toUpperCase().slice(0,12);
  readout(ctx,place(screens.ship),'SHIP',[['HULL',pct(data.hull)],['SHIELD',pct(data.shield)],['HEAT',pct(data.heat),(data.heat||0)>75?'#ef7b6e':'#e8a862']],time);
  readout(ctx,place(screens.nav),'NAV',[['SPD',Math.round(data.speed||0)],['THR',pct((data.throttle||0)*100)]],time);
  readout(ctx,place(screens.weapons),'WEAPONS',[['POWER',pct(data.power)],['MISSILES',data.missiles??0],['TARGET',short(data.target||'NONE'),'#e8a862']],time);
  return true;
 }
 root.VoidCockpitOverlay=api;
})(globalThis);
