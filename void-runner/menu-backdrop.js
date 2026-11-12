/* The first picture a player sees: the city around The Darknet District at night, in rain. BROWSER ONLY, 2D canvas, no assets and no 3D scene.
   Art direction (docs/development/AAA_MODERNIZATION.md): darkness first, a low amber smog horizon against cold blue-teal air, monumental blocks fading into haze,
   dense lit windows, and only a few focused neon accents; a wet street mirrors it all. The still layers are painted once per size; each frame adds only rain,
   a few aircraft lights and drifting haze, so it costs almost nothing. With reduced motion it is a still picture. */
(function(root){
 'use strict';
 const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 let still=null,stillKey='',drops=null;
 function paint(W,H){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=rng(916),hz=Math.round(H*.8),u=H/720;
  // air: cold above, amber smog low on the horizon
  const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,'#03050b');sky.addColorStop(.45,'#08111c');sky.addColorStop(.8,'#17252e');sky.addColorStop(1,'#4a3122');g.fillStyle=sky;g.fillRect(0,0,W,hz);
  const glow=g.createRadialGradient(W*.7,hz,0,W*.7,hz,W*.55);glow.addColorStop(0,'rgba(255,150,70,.55)');glow.addColorStop(.45,'rgba(220,110,60,.16)');glow.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=glow;g.fillRect(0,0,W,hz);
  const windows=(x,y,w,h,cell,lit,a)=>{for(let yy=y+cell;yy<y+h-cell;yy+=cell*1.6)for(let xx=x+cell*.7;xx<x+w-cell;xx+=cell*1.25)if(r()<lit){g.fillStyle=r()<.72?'rgba(255,206,140,'+a+')':'rgba(150,222,255,'+a+')';g.fillRect(xx,yy,cell*.7,cell*.75);}};
  const block=(x,w,h,color,cell,lit,a)=>{const y=hz-h;g.fillStyle=color;g.fillRect(x,y,w,h);
   if(r()<.6){const tw=w*(.4+.3*r()),th=h*(.08+.14*r());g.fillRect(x+(w-tw)*r(),y-th,tw,th);}                                  // a set-back upper tier
   if(r()<.5)g.fillRect(x+w*(.2+.6*r()),y-h*.16-20*u*r(),Math.max(1,1.5*u),h*.16+20*u*r());                                    // a mast
   for(let k=0;k<3;k++)if(r()<.5)g.fillRect(x+w*r()*.8,y-5*u-6*u*r(),w*.14,5*u+6*u*r());                                        // roof plant
   windows(x,y,w,h,cell,lit,a);};
  // 1. monumental far structures, almost lost in the haze
  // a stepped megastructure: three setbacks, darker at the crown, dissolving into the smog at its foot
  const mega=g.createLinearGradient(0,hz-H*.62,0,hz);mega.addColorStop(0,'#0e1820');mega.addColorStop(.6,'#1a2530');mega.addColorStop(1,'#4a3428');g.fillStyle=mega;
  g.beginPath();g.moveTo(W*.56,hz);g.lineTo(W*.6,hz-H*.3);g.lineTo(W*.625,hz-H*.3);g.lineTo(W*.645,hz-H*.5);g.lineTo(W*.665,hz-H*.5);g.lineTo(W*.675,hz-H*.62);g.lineTo(W*.765,hz-H*.62);g.lineTo(W*.775,hz-H*.5);g.lineTo(W*.795,hz-H*.5);g.lineTo(W*.815,hz-H*.3);g.lineTo(W*.84,hz-H*.3);g.lineTo(W*.9,hz);g.fill();
  g.fillStyle='#0e1820';g.fillRect(W*.716,hz-H*.7,W*.004,H*.08);g.fillStyle='rgba(255,80,60,.9)';g.fillRect(W*.7155,hz-H*.705,W*.005,2*u);
  for(let k=0;k<26;k++){const yy=hz-H*.6+k*H*.0225,t=(yy-(hz-H*.62))/(H*.62),x0=W*(t<.2?.68:t<.52?.65:.6)-(W*.03)*t,x1=W*(t<.2?.76:t<.52?.79:.84)+(W*.04)*t;g.fillStyle='rgba(255,196,130,'+(.05+.1*r())+')';for(let xx=x0+4*u;xx<x1-4*u;xx+=3.2*u)if(r()<.5)g.fillRect(xx,yy,1.8*u,1.4*u);}
  g.fillStyle='#131f28';g.fillRect(W*.3,hz-H*.5,W*.09,H*.5);g.fillRect(W*.325,hz-H*.57,W*.04,H*.07);windows(W*.3,hz-H*.5,W*.09,H*.5,2.6*u,.3,.16);
  for(let k=0;k<16;k++)block(W*(.12+.9*r())-40*u,(40+70*r())*u,(110+240*r())*u,'#131f28',2.8*u,.22,.2);
  let haze=g.createLinearGradient(0,hz-H*.5,0,hz);haze.addColorStop(0,'rgba(20,34,44,0)');haze.addColorStop(1,'rgba(214,128,72,.22)');g.fillStyle=haze;g.fillRect(0,hz-H*.5,W,H*.5);
  // 2. the middle city
  for(let k=0;k<22;k++)block(W*(.18+.86*r())-50*u,(44+80*r())*u,(70+210*r())*u,'#0b131b',3.4*u,.26,.42);
  haze=g.createLinearGradient(0,hz-H*.28,0,hz);haze.addColorStop(0,'rgba(10,18,26,0)');haze.addColorStop(1,'rgba(150,92,60,.2)');g.fillStyle=haze;g.fillRect(0,hz-H*.28,W,H*.28);
  // 3. the near street front: dark, with the few neon accents
  const fronts=[];for(let k=0;k<13;k++){const x=W*(.26+.78*r())-60*u,w=(60+90*r())*u,h=(50+150*r())*u;block(x,w,h,'#05090f',4.2*u,.2,.7);fronts.push([x,w,h]);}
  const neon=['#ff3fb4','#38e8ff','#ffb347','#ff3fb4','#38e8ff'];
  neon.forEach((col,k)=>{const f=fronts[(k*3+1)%fronts.length],w=(9+7*r())*u,h=Math.min(f[2]*.6,(46+60*r())*u),x=f[0]+f[1]*(.15+.6*r()),y=hz-f[2]*.82;
   g.save();g.shadowColor=col;g.shadowBlur=26*u;g.fillStyle=col;g.globalAlpha=.9;g.fillRect(x,y,w,h);g.shadowBlur=0;g.globalAlpha=.75;g.fillStyle='#05090f';for(let yy=y+4*u;yy<y+h-5*u;yy+=8*u)g.fillRect(x+2*u,yy,w-4*u,(2+3*r())*u);g.restore();});
  // a long low sign and the street lamps, sodium against the cold
  g.save();g.shadowColor='#ffb347';g.shadowBlur=18*u;g.fillStyle='rgba(255,186,96,.9)';for(let k=0;k<9;k++)g.fillRect(W*(.3+.08*k)+10*u*r(),hz-(16+5*r())*u,3*u,2.4*u);g.restore();
  // 4. the wet street: the city again, upside down, smeared and darkened
  const gh=H-hz,copy=document.createElement('canvas');copy.width=W;copy.height=hz;copy.getContext('2d').drawImage(c,0,0,W,hz,0,0,W,hz);
  g.fillStyle='#020409';g.fillRect(0,hz,W,gh);g.save();g.translate(0,hz);g.scale(1,-.5);g.globalAlpha=.55;g.drawImage(copy,0,hz-2*gh,W,2*gh,0,-2*gh,W,2*gh);g.restore();
  for(let k=0;k<90;k++){g.fillStyle='rgba(2,4,9,'+(.25+.4*r())+')';g.fillRect(0,hz+gh*r(),W,(1+2*r())*u);}
  for(let k=0;k<40;k++){g.fillStyle='rgba(190,210,230,'+(.03+.05*r())+')';g.fillRect(W*r(),hz+gh*r(),(30+120*r())*u,1*u);}
  const fade=g.createLinearGradient(0,hz,0,H);fade.addColorStop(0,'rgba(2,4,9,0)');fade.addColorStop(1,'rgba(2,4,9,.9)');g.fillStyle=fade;g.fillRect(0,hz,W,gh);
  g.fillStyle='#01030a';g.fillRect(0,hz-1.5*u,W,3*u);
  // 5. the frame: dark corners, so the light sits in the middle distance
  const vig=g.createRadialGradient(W*.68,H*.55,H*.25,W*.68,H*.55,W*.75);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.72)');g.fillStyle=vig;g.fillRect(0,0,W,H);
  return c;
 }
 /* draw(ctx, W, H, timeSeconds, reducedMotion, dim) : dim 0..1 darkens the picture (used behind the "preparing" card). */
 function draw(ctx,W,H,time,reduced,dim){
  if(!ctx||!(W>0)||!(H>0)||typeof document==='undefined')return false;
  const key=W+'x'+H;if(key!==stillKey){still=paint(W,H);stillKey=key;const r=rng(77);drops=Array.from({length:170},()=>[r(),r(),.6+.4*r(),12+16*r()]);}
  ctx.drawImage(still,0,0,W,H);
  if(!reduced){const t=time||0,u=H/720,hz=H*.8;
   // haze drifting across the middle distance
   const hx=W*(.35+.5*((t*.012)%1)),hg=ctx.createRadialGradient(hx,hz-H*.12,0,hx,hz-H*.12,W*.3);hg.addColorStop(0,'rgba(170,150,140,.07)');hg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=hg;ctx.fillRect(0,0,W,hz);
   // aircraft: slow, far, blinking
   for(let k=0;k<3;k++){const p=((t*(.006+.003*k)+k*.37)%1),x=W*(k%2?1-p:p),y=H*(.14+.11*k)+Math.sin(p*6+k)*8*u;ctx.fillStyle='rgba(255,240,220,.75)';ctx.fillRect(x,y,2*u,1.4*u);if(((t*1.3+k*.4)%1)<.18){ctx.fillStyle='rgba(255,70,60,.9)';ctx.fillRect(x-3*u,y,2*u,1.6*u);}}
   // rain
   ctx.strokeStyle='rgba(176,204,232,.13)';ctx.lineWidth=Math.max(1,u);ctx.beginPath();
   for(const d of drops){const y=((d[1]+t*d[2]*1.5)%1)*(H+40*u)-20*u,x=((d[0]+t*.05*d[2])%1)*(W+60*u)-30*u,l=d[3]*u;ctx.moveTo(x,y);ctx.lineTo(x-l*.22,y+l);}
   ctx.stroke();}
  if(dim>0){ctx.fillStyle='rgba(2,5,12,'+Math.min(1,dim)+')';ctx.fillRect(0,0,W,H);}
  return true;
 }
 root.VoidMenuBackdrop={draw};
})(globalThis);
