/* Painted RGBA environments. Only the departure phase can draw this mesh. */
const departureImages=Object.fromEntries(['meridian','kepler','undertow','foundry'].map(id=>[id,texture(`hangar-${id}.png`,true)]));
const departureMesh=[];
for(let y=0;y<10;y++)for(let x=0;x<16;x++){
 const a=[x/16,y/10],b=[(x+1)/16,y/10],c=[(x+1)/16,(y+1)/10],d=[x/16,(y+1)/10];
 departureMesh.push([a,b,c],[a,c,d]);
}
function departureVertex(u,v,t,iw,ih){
 const dx=u-.5,dy=v-.43,depth=1/(1+Math.max(Math.abs(dx)/.18,Math.abs(dy)/.18)*.55);
 const scale=depth/Math.max(.025,depth-t*t*.96),cover=Math.max(W/iw,H/ih);
 return [W*.5+dx*iw*cover*scale,H*.44+dy*ih*cover*scale];
}
function drawDeparture(){
 const r=flight.route;if(r?.phase!=='departure')return;
 const image=departureImages[r.origin];image?.load();if(!image?.naturalWidth)return;
 const t=Math.min(1,r.departure/VoidWarp.config.departureSeconds);if(t>=.94)return;
 const iw=image.naturalWidth,ih=image.naturalHeight;
 // Each triangle samples the original alpha intact. No baked sky or black backing.
 for(const triangle of departureMesh){
  const src=triangle.map(([u,v])=>[u*iw,v*ih]),dst=triangle.map(([u,v])=>departureVertex(u,v,t,iw,ih));
  if(dst.every(p=>p[0]<0)||dst.every(p=>p[0]>W)||dst.every(p=>p[1]<0)||dst.every(p=>p[1]>H))continue;
  const [[u0,v0],[u1,v1],[u2,v2]]=src,[[x0,y0],[x1,y1],[x2,y2]]=dst;
  const den=(u1-u0)*(v2-v0)-(u2-u0)*(v1-v0);
  const a=((x1-x0)*(v2-v0)-(x2-x0)*(v1-v0))/den,b=((y1-y0)*(v2-v0)-(y2-y0)*(v1-v0))/den;
  const c=((x2-x0)*(u1-u0)-(x1-x0)*(u2-u0))/den,d=((y2-y0)*(u1-u0)-(y1-y0)*(u2-u0))/den;
  // Subpixel overlap prevents antialiased cracks between adjacent triangles.
  const mx=(x0+x1+x2)/3,my=(y0+y1+y2)/3,clip=dst.map(([x,y])=>{const d=Math.hypot(x-mx,y-my)||1;return [x+(x-mx)/d*.65,y+(y-my)/d*.65];});
  ctx.save();ctx.beginPath();clip.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,x0-a*u0-c*v0,y0-b*u0-d*v0);ctx.drawImage(image,0,0);ctx.restore();
 }
}
