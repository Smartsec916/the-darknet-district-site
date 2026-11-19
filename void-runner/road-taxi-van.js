/* The street taxi: an autonomous minivan cab (the owner's reference picture, 19 Nov 2026: glossy black body, yellow side panels with a black-and-yellow check stripe,
   a lit TAXI box on the roof with a sensor dome and corner cameras, a full-width white light bar across the front, amber markers, a glowing windscreen display,
   side lettering TAXI / 无人驾驶出租车 / AUTONOMOUS TAXI with four service badges, the cab number on the rear quarter, a warm-lit cabin behind tinted glass).
   Built from code (no external model; docs/VOID_RUNNER_ASSET_LICENSES.md "Street taxis"): one shared geometry set per scene, cloned per cab.
   Per cab 6 draw calls: the body (with the cabin inside it: seats, dash, roof light), the sliding door, the tinted glass, the lights (one per-cab picture: the TAXI box,
   lamps, the windscreen display, the number, the tail lights and flashers), two axles (each spins its pair of wheels). Passengers are seen through the glass.
   Also the LED chase border round the TAXI plates of the taxi stops (one mesh and one small shader per scene).
   Local axes: +z the nose, +x the cab's right (the sliding door: road-taxi-rules.js doorPoints()[0]), y up; 4.4 m long, 1.9 m wide (road-taxi-rules.js SPEC). */
(function(root){
 'use strict';
 const LEN=4.4,HALF=LEN/2,AW=2048,AH=1024,PX=AW/2/LEN,PY=448/1.92;   // the body picture: two side views of 1024 x 448, then the skin strip, the wheel and the doorway
 // the side outline (z, y): rear foot, nose foot, bumper, front face, bonnet, windscreen foot, windscreen top, roof end, tailgate top, tailgate foot. Convex, counter-clockwise.
 const PROFILE=[[-2.15,.26],[2.12,.26],[2.2,.45],[2.2,.82],[2.05,.98],[1.45,1.12],[.85,1.8],[-1.95,1.84],[-2.17,1.7],[-2.2,.55]];
 const halfW=y=>y<1.02?.95:.95-(y-1.02)*.14;   // the glasshouse leans in
 const DOOR={z0:-.95,z1:.35,y0:.3,y1:1.74},WHEEL={r:.34,w:.22,x:.84,z:1.45},RIM={x:128,y:728,r:120};
 // the side windows (holes in the body, glazed): [rear z(y), front z(y)] between y 1.14 and 1.72; the sliding door's own window is painted on the door
 const WIN=[{a:()=>-1.6,b:()=>-.98},{a:()=>-.9,b:()=>.28,left:true},{a:()=>.42,b:y=>1.36-(y-1.14)*(.5/.58)}],WY=[1.14,1.72];
 const PATCH={black:[1600,620,40,40],trim:[1660,620,40,40],rubber:[1720,620,40,40]};
 // the cabin's surfaces: [x, y, w, h, albedo, glow] (the glow lights the cabin evenly: it is seen from outside through the glass and from the seat)
 const CAB={seat:[400,880,40,40,'#2c2724','#2a1f17'],seatTop:[450,880,40,40,'#3a332d','#3d2c1d'],panel:[500,880,40,40,'#1d1b1a','#100c09'],floor:[550,880,40,40,'#121110','#0c0907'],
  liner:[600,880,40,40,'#1c1a18','#120e0a'],strip:[650,880,40,40,'#ffe2b0','#ffcf8a'],screen:[700,880,40,40,'#0d2a33','#1f8aa6'],dash:[750,880,40,40,'#141312','#0d0a08']};
 const LP={signFront:[0,0,320,112],signSide:[330,0,120,112],black:[460,0,40,40],bar:[0,120,128,16],head:[130,120,64,32],amber:[200,120,32,16],blue:[240,120,32,16],ring:[280,120,48,48],rail:[0,180,320,40],signLong:[0,222,204,34]};
 const DP={display:[0,256,256,112],number:[0,372,256,44],tail:[0,420,256,40],amber:[0,464,256,40]};   // the per-cab picture is 512 x 512: the lights above, these below

 // ---- geometry ----
 function Geo(){this.p=[];this.n=[];this.u=[];this.c=[];this.i=[];}
 const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
 // a flat polygon (3 or 4 corners in order round its edge) facing `out`; uv: [u,v] per corner (atlas pixels, turned into texture coordinates by the caller's size)
 Geo.prototype.poly=function(pts,uv,out,col){const base=this.p.length/3;let N=norm(cross(sub(pts[2],pts[0]),sub(pts[1],pts[0])));const flip=dot(N,out)<0;if(flip)N=[-N[0],-N[1],-N[2]];
  pts.forEach((q,k)=>{this.p.push(q[0],q[1],q[2]);this.n.push(N[0],N[1],N[2]);this.u.push(uv[k][0],uv[k][1]);if(col)this.c.push(col[0],col[1],col[2],1);});
  for(let k=1;k<pts.length-1;k++)flip?this.i.push(base,base+k+1,base+k):this.i.push(base,base+k,base+k+1);return this;};
 Geo.prototype.box=function(c,s,uv,col,shade){const [x,y,z]=c,[a,b,d]=[s[0]/2,s[1]/2,s[2]/2],P=(i,j,k)=>[x+i*a,y+j*b,z+k*d],sh=(f)=>col?[col[0]*f,col[1]*f,col[2]*f]:null,r=uv||[[0,0],[1,0],[1,1],[0,1]];
  this.poly([P(1,-1,-1),P(1,1,-1),P(1,1,1),P(1,-1,1)],r,[1,0,0],sh(shade?.75:1));this.poly([P(-1,-1,1),P(-1,1,1),P(-1,1,-1),P(-1,-1,-1)],r,[-1,0,0],sh(shade?.75:1));
  this.poly([P(-1,1,-1),P(-1,1,1),P(1,1,1),P(1,1,-1)],r,[0,1,0],sh(1));this.poly([P(-1,-1,-1),P(1,-1,-1),P(1,-1,1),P(-1,-1,1)],r,[0,-1,0],sh(shade?.45:1));
  this.poly([P(-1,-1,1),P(1,-1,1),P(1,1,1),P(-1,1,1)],r,[0,0,1],sh(shade?.85:1));this.poly([P(1,-1,-1),P(-1,-1,-1),P(-1,1,-1),P(1,1,-1)],r,[0,0,-1],sh(shade?.85:1));return this;};
 Geo.prototype.mesh=function(B,name,scene,w,h){const m=new B.Mesh(name,scene),vd=new B.VertexData();vd.positions=this.p;vd.indices=this.i;vd.normals=this.n;
  vd.uvs=this.u.map((v,k)=>k%2?1-v/h:v/w);if(this.c.length)vd.colors=this.c;vd.applyToMesh(m);m.isPickable=false;return m;};
 const patch=(r,inset=.25)=>{const [x,y,w,h]=r,ix=w*inset,iy=h*inset;return [[x+ix,y+h-iy],[x+w-ix,y+h-iy],[x+w-ix,y+iy],[x+ix,y+iy]];};   // a solid swatch, corners bottom-left, bottom-right, top-right, top-left
 // where the outline crosses height y: [zRear, zFront]
 function span(y){let lo=Infinity,hi=-Infinity;for(let k=0;k<PROFILE.length;k++){const a=PROFILE[k],b=PROFILE[(k+1)%PROFILE.length];if((a[1]-y)*(b[1]-y)>0)continue;
   if(a[1]===b[1]){lo=Math.min(lo,a[0],b[0]);hi=Math.max(hi,a[0],b[0]);continue;}const z=a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]);lo=Math.min(lo,z);hi=Math.max(hi,z);}return [lo,hi];}
 const LEVELS=[...new Set([...PROFILE.map(p=>p[1]),DOOR.y0,DOOR.y1,1.02,1.12,...WY])].sort((a,b)=>a-b);
 const sideUV=(s,z,y)=>[(s>0?0:1024)+(s>0?z+HALF:HALF-z)*PX,(1.92-y)*PY];
 const sidePt=(s,z,y,off=0)=>[s*(halfW(y)+off),y,z];
 const sideOut=(s,y)=>y<1.02?[s,0,0]:norm([s,.14,0]);
 // the two sides, row by row. Holes: the windows (glazed in `glass`) and, on the right, the sliding door's opening (the door covers it; open, it shows the cabin).
 function sides(g,glass){
  for(const s of [1,-1])for(let k=0;k<LEVELS.length-1;k++){const y0=LEVELS[k],y1=LEVELS[k+1],a=span(y0),b=span(y1),ym=(y0+y1)/2,out=sideOut(s,ym);
   const holes=[];if(s>0&&ym>DOOR.y0&&ym<DOOR.y1)holes.push({a:()=>DOOR.z0,b:()=>DOOR.z1,door:true});
   if(ym>WY[0]&&ym<WY[1])for(const w of WIN)if(!(s>0&&w.left))holes.push(w);holes.sort((p,q)=>p.a(ym)-q.a(ym));
   let z0=a[0],z1=b[0];const quad=(za0,zb0,za1,zb1,G,off)=>{const q=[[za0,y0],[zb0,y0],[zb1,y1],[za1,y1]];G.poly(q.map(([z,y])=>sidePt(s,z,y,off)),q.map(([z,y])=>sideUV(s,z,y)),out);};
   for(const h of holes){quad(z0,h.a(y0),z1,h.a(y1),g,0);if(!h.door)quad(h.a(y0),h.b(y0),h.a(y1),h.b(y1),glass,-.006);z0=h.b(y0);z1=h.b(y1);}
   quad(z0,a[1],z1,b[1],g,0);}
 }
 function perimeter(){const segs=[];let L=0;for(let k=0;k<PROFILE.length;k++){const a=PROFILE[k],b=PROFILE[(k+1)%PROFILE.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push({a,b,l,from:L});L+=l;}return {segs,L};}
 const PER=perimeter();
 // the skin: bottom, nose, bonnet, windscreen, roof, tailgate; strip y 448..576 (u along the outline, v across the width)
 // the windscreen (edge 5) and the tailgate window (edge 8, between y 1.66 and 1.18) are glass
 function skin(g,glass){PER.segs.forEach((s,k)=>{const cuts=k===8?[0,(s.a[1]-1.66)/(s.a[1]-s.b[1]),(s.a[1]-1.18)/(s.a[1]-s.b[1]),1]:[0,1];
   for(let j=0;j<cuts.length-1;j++){const f0=cuts[j],f1=cuts[j+1],P=f=>[s.a[0]+(s.b[0]-s.a[0])*f,s.a[1]+(s.b[1]-s.a[1])*f],[za,ya]=P(f0),[zb,yb]=P(f1),wa=halfW(ya),wb=halfW(yb),out=norm([0,-(s.b[0]-s.a[0]),s.b[1]-s.a[1]]);
    const u0=(s.from+s.l*f0)/PER.L*AW,u1=(s.from+s.l*f1)/PER.L*AW,G=k===5||(k===8&&j===1)?glass:g;
    G.poly([[-wa,ya,za],[wa,ya,za],[wb,yb,zb],[-wb,yb,zb]],[[u0,576],[u0,448],[u1,448],[u1,576]],out);}});}
 function wheelGeo(g,cx,cz,flipOut){const n=14,{r,w}=WHEEL,xo=cx+(cx>0?w/2:-w/2),xi=cx-(cx>0?w/2:-w/2),sgn=cx>0?1:-1,rub=patch(PATCH.rubber);
  for(let k=0;k<n;k++){const a0=k/n*Math.PI*2,a1=(k+1)/n*Math.PI*2,p=(x,a)=>[x,Math.cos(a)*r,cz+Math.sin(a)*r];
   g.poly([p(xi,a0),p(xo,a0),p(xo,a1),p(xi,a1)],rub,[0,Math.cos((a0+a1)/2),Math.sin((a0+a1)/2)]);
   g.poly([[xo,0,cz],p(xo,a0),p(xo,a1)],[[RIM.x,RIM.y],[RIM.x+Math.sin(a0)*RIM.r*sgn,RIM.y-Math.cos(a0)*RIM.r],[RIM.x+Math.sin(a1)*RIM.r*sgn,RIM.y-Math.cos(a1)*RIM.r]],[sgn,0,0]);
   g.poly([[xi,0,cz],p(xi,a0),p(xi,a1)],rub.slice(0,3),[-sgn,0,0]);}}

 // ---- pictures ----
 const CJK='"Microsoft YaHei","PingFang SC","Noto Sans CJK SC","WenQuanYi Zen Hei","Source Han Sans SC",sans-serif';
 function paintSide(g,ox,dir,emit){
  const X=z=>ox+(dir>0?z+HALF:HALF-z)*PX,Y=y=>(1.92-y)*PY,R=(z0,z1,y0,y1)=>[Math.min(X(z0),X(z1)),Y(y1),Math.abs(X(z1)-X(z0)),Y(y0)-Y(y1)];
  const poly=(pts,fill)=>{g.beginPath();pts.forEach(([z,y],k)=>k?g.lineTo(X(z),Y(y)):g.moveTo(X(z),Y(y)));g.closePath();g.fillStyle=fill;g.fill();};
  g.save();g.beginPath();g.rect(ox,0,1024,448);g.clip();
  if(!emit){const gr=g.createLinearGradient(0,0,0,448);gr.addColorStop(0,'#1b1f25');gr.addColorStop(.45,'#0c0e12');gr.addColorStop(1,'#07080a');g.fillStyle=gr;g.fillRect(ox,0,1024,448);}
  // the yellow panel, the skyline at its foot and the check stripe over it (the glow picture: only the windows' warm cabin, added to a dimmed copy of this one)
  if(!emit){{const [x,y,w,h]=R(-2.06,1.24,.4,1.0);if(!emit){const gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#ffc21a');gr.addColorStop(.55,'#f0a800');gr.addColorStop(1,'#b97c00');g.fillStyle=gr;}else g.fillStyle='rgba(120,82,0,.55)';g.fillRect(x,y,w,h);
   if(!emit){g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x,y+2,w,3);}
   let s=7;const rnd=()=>((s=s*16807%2147483647)-1)/2147483646;g.fillStyle=emit?'rgba(0,0,0,.6)':'rgba(40,26,0,.55)';g.beginPath();g.moveTo(X(-1.95),Y(.42));
   for(let z=-1.95;z<-.25;){const w2=.05+rnd()*.09,hh=.05+rnd()*.17;g.lineTo(X(z),Y(.42+hh));g.lineTo(X(z+w2),Y(.42+hh));z+=w2;if(rnd()<.3){g.lineTo(X(z),Y(.44+hh+.05));g.lineTo(X(z+.012),Y(.44+hh+.05));}}
   g.lineTo(X(-.25),Y(.42));g.closePath();g.fill();}
  {const q=.042,z0=-2.12,z1=1.42;for(let r=0;r<2;r++)for(let k=0;(z0+k*q)<z1;k++){const z=dir>0?z0+k*q:z0+k*q;g.fillStyle=(k+r)%2?(emit?'rgba(130,90,0,.6)':'#ffc21a'):'#060606';const [x,y,w,h]=R(z,Math.min(z+q,z1),1.0+r*q,1.0+(r+1)*q);g.fillRect(x,y,w+.5,h+.5);}}
  // the sill: black with a bright trim line
  {const [x,y,w,h]=R(-2.15,2.12,.26,.4);g.fillStyle='#08090b';g.fillRect(x,y,w,h);if(!emit){const [x2,y2,w2,h2]=R(-1.9,1.9,.355,.375);g.fillStyle='#9aa1aa';g.fillRect(x2,y2,w2,h2);}}
  // wheel arches
  for(const zc of [WHEEL.z,-WHEEL.z]){g.beginPath();g.arc(X(zc),Y(.34),.45*PX,0,Math.PI*2);g.fillStyle='#030304';g.fill();g.lineWidth=3;g.strokeStyle='#1d2127';g.stroke();}}
  // the glasshouse: tinted windows with the warm cabin behind, black pillars
  const win=(pts,seats)=>{g.save();g.beginPath();pts.forEach(([z,y],k)=>k?g.lineTo(X(z),Y(y)):g.moveTo(X(z),Y(y)));g.closePath();g.clip();
   const zs=pts.map(p=>p[0]),zl=Math.min(...zs),zh=Math.max(...zs);
   if(!emit){const gr=g.createLinearGradient(0,Y(1.74),0,Y(1.12));gr.addColorStop(0,'#2a2116');gr.addColorStop(.18,'#14120f');gr.addColorStop(1,'#0b0e12');g.fillStyle=gr;g.fillRect(X(zl)-2,Y(1.8),Math.abs(X(zh)-X(zl))+4,Y(1.1)-Y(1.8));}
   else{g.fillStyle='rgba(70,46,20,.55)';g.fillRect(Math.min(X(zl),X(zh))-2,Y(1.8),Math.abs(X(zh)-X(zl))+4,Y(1.1)-Y(1.8));}
   g.fillStyle=emit?'#ffcb80':'#ffd9a0';g.fillRect(Math.min(X(zl),X(zh)),Y(1.70),Math.abs(X(zh)-X(zl)),3);   // the ceiling strip
   for(const zc of seats){const c=emit?'#0a0705':'#2c2824';g.fillStyle=c;const hw=.13*PX;g.beginPath();g.roundRect?g.roundRect(X(zc)-hw,Y(1.47),hw*2,Y(1.2)-Y(1.47),8):g.rect(X(zc)-hw,Y(1.47),hw*2,Y(1.2)-Y(1.47));g.fill();
    if(!emit){g.fillStyle='rgba(255,200,130,.25)';g.fillRect(X(zc)-hw+4,Y(1.47),hw*2-8,3);}g.fillStyle=c;g.fillRect(X(zc)-hw*1.2,Y(1.24),hw*2.4,Y(1.12)-Y(1.24));}
   if(!emit){g.globalAlpha=.09;g.fillStyle='#e8f4ff';for(const d of [0,.3]){g.beginPath();g.moveTo(X(zl+d+.1),Y(1.74));g.lineTo(X(zl+d+.28),Y(1.74));g.lineTo(X(zl+d+.02),Y(1.12));g.lineTo(X(zl+d-.16),Y(1.12));g.fill();}g.globalAlpha=1;}
   g.restore();};
  win([[.42,1.14],[1.36,1.14],[.86,1.72],[.42,1.72]],[.78]);
  win([[-.9,1.14],[.28,1.14],[.28,1.72],[-.9,1.72]],[-.4,.12]);
  win([[-1.6,1.14],[-.98,1.14],[-.98,1.72],[-1.6,1.72]],[-1.35]);
  if(!emit){
   // door seams and handles
   g.strokeStyle='rgba(0,0,0,.85)';g.lineWidth=2.5;const ln=(pts)=>{g.beginPath();pts.forEach(([z,y],k)=>k?g.lineTo(X(z),Y(y)):g.moveTo(X(z),Y(y)));g.stroke();};
   ln([[DOOR.z0,.3],[DOOR.z0,1.76]]);ln([[DOOR.z1,.3],[DOOR.z1,1.76]]);ln([[1.4,.42],[1.4,1.1],[1.45,1.12]]);ln([[-2.0,.45],[-2.0,1.12]]);
   g.fillStyle='#b8bec6';for(const z of [.12,1.18]){const [x,y,w,h]=R(z-.08,z+.08,1.095,1.115);g.fillRect(x,y,w,h);}
   // lettering: TAXI, the Chinese line, AUTONOMOUS TAXI
   const left=(z0,z1)=>Math.min(X(z0),X(z1));
   g.fillStyle='#0a0a0a';g.textBaseline='alphabetic';g.textAlign='left';
   g.save();g.translate(left(-1.62,-.74),Y(.66));g.transform(1,0,-.18,1,0,0);g.font='900 66px "Arial Black",Impact,Arial,sans-serif';g.fillText('TAXI',0,0);g.restore();
   g.font='700 27px '+CJK;g.fillText('无人驾驶出租车',left(-.66,.24),Y(.84));
   g.font='600 15px Arial,Helvetica,sans-serif';if('letterSpacing' in g)g.letterSpacing='2px';g.fillText('AUTONOMOUS TAXI',left(-.66,.24),Y(.74));if('letterSpacing' in g)g.letterSpacing='0px';
   // the four service badges
   const badge=(row,label,icon)=>{const z0=.46,z1=1.0,y1=.97-row*.135,y0=y1-.11,[x,y,w,h]=R(z0,z1,y0,y1);g.fillStyle='#16171a';g.beginPath();g.roundRect?g.roundRect(x,y,w,h,5):g.rect(x,y,w,h);g.fill();
    g.strokeStyle='#f4f4f4';g.fillStyle='#f4f4f4';g.lineWidth=2;const cx=x+16,cy=y+h/2;icon(cx,cy);g.font='700 12px Arial,Helvetica,sans-serif';g.fillText(label,x+32,cy+4);};
   badge(0,'4 PASSENGERS',(cx,cy)=>{for(const d of [-4,4]){g.beginPath();g.arc(cx+d,cy-5,3,0,7);g.fill();g.fillRect(cx+d-4,cy,8,7);}});
   badge(1,'LUGGAGE',(cx,cy)=>{g.strokeRect(cx-7,cy-4,14,11);g.strokeRect(cx-3,cy-8,6,4);});
   badge(2,'FREE WI-FI',(cx,cy)=>{for(const r of [4,8,12]){g.beginPath();g.arc(cx,cy+6,r,-Math.PI*.8,-Math.PI*.2);g.stroke();}});
   badge(3,'CASHLESS',(cx,cy)=>{g.strokeRect(cx-8,cy-6,16,12);g.fillRect(cx-8,cy-3,16,3);});
  }
  g.restore();
 }
 function paintSkin(g,emit){
  g.fillStyle=emit?'#000':'#0d0f12';g.fillRect(0,448,AW,128);
  const at=k=>PER.segs[k],U=(k,f)=>(at(k).from+at(k).l*f)/PER.L*AW,V=f=>448+f*128;
  // nose grille
  if(!emit){g.fillStyle='#050607';g.fillRect(U(2,.15),V(.2),U(2,.75)-U(2,.15),V(.8)-V(.2));g.strokeStyle='rgba(120,130,140,.25)';g.lineWidth=1;for(let x=U(2,.15);x<U(2,.75);x+=4){g.beginPath();g.moveTo(x,V(.2));g.lineTo(x,V(.8));g.stroke();}
   g.fillStyle='#9aa1aa';g.fillRect(U(1,0),V(.1),U(1,1)-U(1,0),V(.9)-V(.1));}
  // the windscreen and the tailgate window
  const glass=(x0,x1,warm)=>{const gr=g.createLinearGradient(x0,0,x1,0);if(emit){gr.addColorStop(0,'#000');gr.addColorStop(1,warm?'#2a1c0c':'#000');}else{gr.addColorStop(0,'#141a20');gr.addColorStop(.5,'#0a0e12');gr.addColorStop(1,'#1d1812');}g.fillStyle=gr;g.fillRect(x0,V(.07),x1-x0,V(.93)-V(.07));
   if(!emit){g.globalAlpha=.1;g.fillStyle='#e8f4ff';g.fillRect(x0+(x1-x0)*.2,V(.07),(x1-x0)*.08,V(.93)-V(.07));g.globalAlpha=1;}};
  glass(U(5,.04),U(5,.97),true);
  {const s=at(8),f=y=>(s.a[1]-y)/(s.a[1]-s.b[1]);glass(U(8,f(1.66)),U(8,f(1.18)),true);}
  // roof seams
  if(!emit){g.fillStyle='rgba(0,0,0,.6)';for(const f of [.25,.6])g.fillRect(U(6,f),V(.05),2,V(.95)-V(.05));}
 }
 function paintWheel(g){
  const {x,y,r}=RIM;g.fillStyle='#050505';g.fillRect(x-r-4,y-r-4,2*r+8,2*r+8);g.beginPath();g.arc(x,y,r*.74,0,7);g.fillStyle='#16181c';g.fill();
  g.strokeStyle='#8f969f';g.lineWidth=10;for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.beginPath();g.moveTo(x+Math.cos(a)*r*.16,y+Math.sin(a)*r*.16);g.lineTo(x+Math.cos(a+.18)*r*.7,y+Math.sin(a+.18)*r*.7);g.stroke();}
  g.beginPath();g.arc(x,y,r*.72,0,7);g.lineWidth=5;g.strokeStyle='#5d636b';g.stroke();g.beginPath();g.arc(x,y,r*.16,0,7);g.fillStyle='#b9c0c8';g.fill();
  g.fillStyle='#0b0c0e';g.fillRect(...PATCH.black);g.fillStyle='#9aa1aa';g.fillRect(...PATCH.trim);g.fillStyle='#080808';g.fillRect(...PATCH.rubber);
  for(const c of Object.values(CAB)){g.fillStyle=c[4];g.fillRect(c[0],c[1],c[2],c[3]);}
 }
 function paintCabinGlow(g){g.fillStyle='#000';for(const c of Object.values(CAB)){g.fillStyle=c[5];g.fillRect(c[0],c[1],c[2],c[3]);}}
 function paintLights(g){
  const [sx,sy,sw,sh]=LP.signFront;{const gr=g.createLinearGradient(0,sy,0,sy+sh);gr.addColorStop(0,'#ffe066');gr.addColorStop(1,'#ffb000');g.fillStyle=gr;g.fillRect(sx,sy,sw,sh);}
  g.fillStyle='#000';g.lineWidth=4;g.strokeStyle='#1a1200';g.strokeRect(sx+2,sy+2,sw-4,sh-4);
  for(const cx of [sx+22,sx+sw-46])for(let i=0;i<3;i++)for(let j=0;j<3;j++)if((i+j)%2===0)g.fillRect(cx+i*8,sy+sh/2-12+j*8,8,8);
  g.save();g.translate(sx+sw/2,sy+sh/2+28);g.transform(1,0,-.18,1,0,0);g.font='900 82px "Arial Black",Impact,Arial,sans-serif';g.textAlign='center';g.fillStyle='#0b0900';g.fillText('TAXI',0,0);g.restore();
  {const [x,y,w,h]=LP.signSide,gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#ffd84a');gr.addColorStop(1,'#e8a000');g.fillStyle=gr;g.fillRect(x,y,w,h);g.fillStyle='#000';for(let i=0;i<w/10;i++)for(let j=0;j<2;j++)if((i+j)%2===0)g.fillRect(x+i*10,y+h/2-10+j*10,10,10);}
  g.fillStyle='#000';g.fillRect(...LP.black);
  {const [x,y,w,h]=LP.bar,gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#5a6a7a');gr.addColorStop(.5,'#ffffff');gr.addColorStop(1,'#5a6a7a');g.fillStyle=gr;g.fillRect(x,y,w,h);}
  {const [x,y,w,h]=LP.head;g.fillStyle='#2a3440';g.fillRect(x,y,w,h);g.fillStyle='#f4f9ff';g.fillRect(x+4,y+h*.3,w-8,h*.4);g.fillStyle='#bfe6ff';g.fillRect(x+4,y+h*.75,w-8,3);}
  g.fillStyle='#ffa21a';g.fillRect(...LP.amber);g.fillStyle='#29cfff';g.fillRect(...LP.blue);
  {const [x,y,w]=LP.ring;g.fillStyle='#000';g.fillRect(x,y,w,w);g.strokeStyle='#29cfff';g.lineWidth=7;g.strokeRect(x+8,y+8,w-16,w-16);}
  {const [x,y,w,h]=LP.signLong,gr=g.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#ffe066');gr.addColorStop(1,'#ffb000');g.fillStyle=gr;g.fillRect(x,y,w,h);g.fillStyle='#0b0900';
   for(const cx of [x+6,x+w-22])for(let i=0;i<2;i++)for(let j=0;j<2;j++)if((i+j)%2===0)g.fillRect(cx+i*8,y+h/2-8+j*8,8,8);g.save();g.translate(x+w/2,y+h-5);g.transform(1,0,-.18,1,0,0);g.font='900 28px "Arial Black",Impact,Arial,sans-serif';g.textAlign='center';g.fillText('TAXI',0,0);g.restore();}
  {const [x,y,w,h]=LP.rail;g.fillStyle='#050505';g.fillRect(x,y,w,h);g.fillStyle='#e9eef2';g.font='700 22px Arial,Helvetica,sans-serif';g.textBaseline='middle';g.textAlign='center';g.fillText('AUTONOMOUS ///',x+w/2,y+h/2+1);}
 }
 // the cab's own picture: windscreen display (available / on trip / arrived), number, tail lights (dim or braking), amber flashers
 function paintCab(g,st){
  g.clearRect(0,256,256,256);
  {const [x,y,w,h]=DP.display,busy=st.show!=='free';g.fillStyle=busy?'#120b02':'#021317';g.fillRect(x,y,w,h);g.strokeStyle=busy?'#ffb347':'#4fe3ff';g.lineWidth=3;g.strokeRect(x+3,y+3,w-6,h-6);
   const c=busy?'#ffc066':'#9ff2ff';g.fillStyle=c;g.strokeStyle=c;g.textAlign='left';g.textBaseline='middle';
   g.lineWidth=2;g.strokeRect(x+12,y+16,34,26);for(const d of [-7,7]){g.beginPath();g.arc(x+29+d,y+25,3.5,0,7);g.fill();g.fillRect(x+25+d,y+30,8,8);}
   g.font='700 26px Arial,Helvetica,sans-serif';g.fillText('TAXI',x+58,y+30);
   g.font='700 22px Arial,Helvetica,sans-serif';g.fillText(st.show==='free'?'AVAILABLE':st.show==='arrived'?'ARRIVED':'ON TRIP',x+58,y+62);
   g.beginPath();g.arc(x+30,y+90,11,0,7);g.lineWidth=2;g.stroke();g.beginPath();g.moveTo(x+20,y+100);g.lineTo(x+40,y+80);g.stroke();g.font='700 20px Arial,Helvetica,sans-serif';g.fillText('AI DRIVE',x+58,y+92);}
  {const [x,y,w,h]=DP.number;g.fillStyle='#000';g.fillRect(x,y,w,h);g.fillStyle='#eef2f5';g.font='700 34px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(st.number,x+w/2,y+h/2+2);}
  {const [x,y,w,h]=DP.tail;g.fillStyle=st.brake?'#ff1e1e':'#7a0606';g.fillRect(x,y,w,h);if(st.brake){g.fillStyle='#ffb0a0';g.fillRect(x,y+h*.4,w,h*.2);}}
  {const [x,y,w,h]=DP.amber;g.fillStyle=st.flash?'#ffb020':'#2a1800';g.fillRect(x,y,w,h);}
 }

 // ---- the shared parts of one scene ----
 /* parts(B, scene, quality) -> {own, body, door, glass, lit, axle, low, tris}: built once per scene and quality (road-taxi.js makeMats); each cab clones them (shared geometry). */
 function parts(B,scene,quality){
  const low=quality==='low',k=low?.5:1,own=[];
  const tex=(name,w,h,draw)=>{const t=new B.DynamicTexture(name,{width:w,height:h},scene,true);const g=t.getContext();g.save();g.scale(w/AW,h/AH);draw(g);g.restore();t.update();own.push(t);return t;};
  const albedo=tex('road-taxi-body',AW*k,AH*k,g=>{paintSide(g,0,1,false);paintSide(g,1024,-1,false);paintSkin(g,false);paintWheel(g);});
  // the glow: the whole picture at a third (the yellow and the lettering read in the dark street), then the door window's warm cabin and the cabin's own light
  const emitT=tex('road-taxi-body-glow',AW*k/2,AH*k/2,g=>{const c=g.canvas;g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);g.globalAlpha=.32;g.drawImage(albedo.getContext().canvas,0,0,c.width,c.height);g.restore();
   g.globalCompositeOperation='lighter';paintSide(g,0,1,true);g.globalCompositeOperation='source-over';paintCabinGlow(g);});
  albedo.wrapU=albedo.wrapV=emitT.wrapU=emitT.wrapV=B.Texture.CLAMP_ADDRESSMODE;
  const body=new B.PBRMaterial('road-taxi-body',scene);body.albedoTexture=albedo;body.albedoColor=B.Color3.White();body.metallic=.25;body.roughness=.32;body.emissiveTexture=emitT;body.emissiveColor=new B.Color3(1,1,1);
  if(!low){body.clearCoat.isEnabled=true;body.clearCoat.intensity=.85;body.clearCoat.roughness=.06;}body.maxSimultaneousLights=8;own.push(body);
  const glassM=new B.PBRMaterial('road-taxi-glass',scene);glassM.albedoColor=B.Color3.FromHexString('#0a1016');glassM.metallic=0;glassM.roughness=.06;glassM.alpha=.42;glassM.environmentIntensity=.55;glassM.backFaceCulling=true;   // one-sided: from the seat the street is seen clear
  glassM.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;glassM.maxSimultaneousLights=8;own.push(glassM);
  // body: sides, skin, roof furniture (sensor dome housing, corner cameras, mirror cameras, roof rails), and the cabin inside
  const g=new Geo(),gl=new Geo();sides(g,gl);skin(g,gl);const blk=patch(PATCH.black),trim=patch(PATCH.trim);
  g.box([0,2.34,.24],[.3,.08,.3],blk);                                        // the sensor dome's housing on the TAXI box (its blue ring is a light)
  for(const [x,z] of [[.74,.95],[-.74,.95],[.74,-1.7],[-.74,-1.7]])g.box([x,1.9,z],[.14,.1,.16],blk);
  for(const s of [1,-1])g.box([s*.99,1.16,1.28],[.1,.1,.17],blk);
  for(const s of [1,-1])g.box([s*.8,1.87,-.55],[.05,.05,2.5],blk);
  g.box([0,1.97,.24],[1.0,.04,.5],blk);                                       // the sign's base
  g.box([0,.3,2.16],[1.7,.06,.08],trim);
  {const C=n=>patch(CAB[n]);   // the cabin: floor, roof lining and its light strip, inner panels with a warm line, pillars, dash with its screen, three rows of seats
   g.poly([[-.88,.4,-2.0],[.88,.4,-2.0],[.88,.4,1.4],[-.88,.4,1.4]],C('floor'),[0,1,0]);
   g.poly([[-.84,1.76,1.0],[.84,1.76,1.0],[.84,1.76,-2.0],[-.84,1.76,-2.0]],C('liner'),[0,-1,0]);
   g.poly([[-.06,1.755,.9],[.06,1.755,.9],[.06,1.755,-1.9],[-.06,1.755,-1.9]],C('strip'),[0,-1,0]);
   g.poly([[-.88,.4,-2.0],[.88,.4,-2.0],[.88,1.18,-2.0],[-.88,1.18,-2.0]],C('panel'),[0,0,1]);
   for(const s of [1,-1]){const x=s*.88;g.poly([[x,.4,-2.0],[x,.4,1.4],[x,1.1,1.4],[x,1.1,-2.0]],C('panel'),[-s,0,0]);g.poly([[x-s*.01,1.08,-2.0],[x-s*.01,1.08,1.3],[x-s*.01,1.1,1.3],[x-s*.01,1.1,-2.0]],C('strip'),[-s,0,0]);
    for(const [z0,z1] of [[.3,.42],[-.98,-.88],[-2.0,-1.62]])g.box([s*.84,1.43,(z0+z1)/2],[.06,.66,z1-z0],C('panel'));}
   g.box([0,.72,1.4],[1.76,.64,.24],C('dash'));g.poly([[.42,.92,1.275],[-.42,.92,1.275],[-.42,1.0,1.275],[.42,1.0,1.275]],C('screen'),[0,0,-1]);
   // three rows; the passenger rides the middle row's right seat, a companion its left (road-taxi-rules.js seatPoint / companionSeat)
   // the front row (nobody drives) has low backs and no headrests, so the windscreen is clear from the middle row
   for(const [zc,back,row] of [[.78,.5,0],[-.35,-.66,1],[-1.5,-1.81,2]])for(const s of [1,-1]){const x=s*.42;g.box([x,.62,zc],[.5,.44,.5],C('seatTop'));if(!row)g.box([x,1.0,back],[.5,.36,.12],C('seat'));else{g.box([x,1.13,back],[.5,.62,.12],C('seat'));g.box([x,1.52,back+.01],[.26,.18,.1],C('seat'));}}
   g.box([0,1.06,1.0],[1.7,.06,.06],C('panel'));}
  const bodyMesh=g.mesh(B,'road-taxi-body',scene,AW,AH);bodyMesh.material=body;own.push(bodyMesh);
  const glassMesh=gl.mesh(B,'road-taxi-glass',scene,AW,AH);glassMesh.material=glassM;own.push(glassMesh);
  // the sliding door (right side), rows like the side, a little proud of it, with its window painted; it slides back along the van
  const dg=new Geo();for(let k2=0;k2<LEVELS.length-1;k2++){const y0=LEVELS[k2],y1=LEVELS[k2+1];if(y0<DOOR.y0-1e-6||y1>DOOR.y1+1e-6)continue;
   const q=[[DOOR.z0,y0],[DOOR.z1,y0],[DOOR.z1,y1],[DOOR.z0,y1]];dg.poly(q.map(([z,y])=>sidePt(1,z,y,.012)),q.map(([z,y])=>sideUV(1,z,y)),sideOut(1,(y0+y1)/2));}
  const doorMesh=dg.mesh(B,'road-taxi-door',scene,AW,AH);doorMesh.material=body;own.push(doorMesh);
  // the lit parts, all on the cab's own 512 x 512 picture: the TAXI box, the dome's ring, the front light bar and lamps, markers, camera lenses, the roof-rail lettering;
  // the windscreen display, the numbers (both rear quarters and the tailgate), the tail lights and the amber flashers
  const lg=new Geo(),L=r=>patch(r,0),Lf=r=>{const [x,y,w,h]=r;return [[x,y+h],[x+w,y+h],[x+w,y],[x,y]];};
  {const z0=-.02,z1=.5,yb=1.99,yt=2.3,zf=.44,zr=.04,w=.52;
   lg.poly([[w,yb,z1],[-w,yb,z1],[-w,yt,zf],[w,yt,zf]],Lf(LP.signFront),[0,.2,1]);       // front: read from ahead (its right is the cab's left)
   lg.poly([[-w,yb,z0],[w,yb,z0],[w,yt,zr],[-w,yt,zr]],Lf(LP.signFront),[0,.2,-1]);
   for(const s of [1,-1]){const q=s>0?[[w,yb,z0],[w,yb,z1],[w,yt,zf],[w,yt,zr]]:[[-w,yb,z1],[-w,yb,z0],[-w,yt,zr],[-w,yt,zf]];lg.poly(q,Lf(LP.signSide),[s,0,0]);}
   lg.poly([[-w,yt,zr],[w,yt,zr],[w,yt,zf],[-w,yt,zf]],L(LP.black),[0,1,0]);}
  {const n=12,r=.165,y0=2.38,y1=2.43,cz=.24,ring=(ra,ya,rb,yb,uv,up)=>{for(let k2=0;k2<n;k2++){const a0=k2/n*Math.PI*2,a1=(k2+1)/n*Math.PI*2,P=(rr,yy,a)=>[Math.sin(a)*rr,yy,cz+Math.cos(a)*rr];lg.poly([P(ra,ya,a0),P(ra,ya,a1),P(rb,yb,a1),P(rb,yb,a0)],uv,[Math.sin((a0+a1)/2),up,Math.cos((a0+a1)/2)]);}};
   ring(.15,2.38,r,y0,L(LP.black),0);ring(r,y0,r,y1,L(LP.blue),0);ring(r,y1,.12,y1+.06,L(LP.black),1);
   const cap=[];for(let k2=0;k2<n;k2++){const a=k2/n*Math.PI*2;cap.push([Math.sin(a)*.12,y1+.06,cz+Math.cos(a)*.12]);}for(let k2=1;k2<n-1;k2++)lg.poly([cap[0],cap[k2],cap[k2+1]],L(LP.black).slice(0,3),[0,1,0]);}
  const zf=2.204;lg.poly([[.84,.765,zf],[-.84,.765,zf],[-.84,.80,zf],[.84,.80,zf]],Lf(LP.bar),[0,0,1]);
  for(const s of [1,-1])lg.poly([[s*.9,.66,zf],[s*.6,.66,zf],[s*.6,.75,zf],[s*.9,.75,zf]],Lf(LP.head),[0,0,1]);
  for(const s of [1,-1])lg.poly([[s*.86,.5,zf],[s*.72,.5,zf],[s*.72,.56,zf],[s*.86,.56,zf]],L(LP.amber),[0,0,1]);
  lg.poly([[.1,.47,zf],[-.1,.47,zf],[-.1,.61,zf],[.1,.61,zf]],Lf(LP.ring),[0,0,1]);
  if(!low){
   for(const s of [1,-1])lg.poly([[s*.953,.5,1.94],[s*.953,.5,2.1],[s*.953,.56,2.1],[s*.953,.56,1.94]],L(LP.amber),[s,0,0]);
   for(const [x,z,f] of [[.74,.95,1],[-.74,.95,1],[.74,-1.7,-1],[-.74,-1.7,-1]]){const zz=z+f*.081;lg.poly([[x-.03,1.88,zz],[x+.03,1.88,zz],[x+.03,1.92,zz],[x-.03,1.92,zz]],L(LP.blue),[0,0,f]);}
   for(const s of [1,-1]){const zz=1.28+.086;lg.poly([[s*.99-.025,1.14,zz],[s*.99+.025,1.14,zz],[s*.99+.025,1.18,zz],[s*.99-.025,1.18,zz]],L(LP.blue),[0,0,1]);}
   for(const s of [1,-1]){const x=s*.826,q=s>0?[[x,1.85,-1.55],[x,1.85,.45],[x,1.89,.45],[x,1.89,-1.55]]:[[x,1.85,.45],[x,1.85,-1.55],[x,1.89,-1.55],[x,1.89,.45]];lg.poly(q,Lf(LP.rail),[s,0,0]);}}
  {const a=PROFILE[5],b=PROFILE[6],P=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],n=norm([0,a[0]-b[0],b[1]-a[1]]),o=.008,[z0,y0]=P(.1),[z1,y1]=P(.42);
   const q=[[.72,y0,z0],[.02,y0,z0],[.02,y1,z1],[.72,y1,z1]].map(([x,y,z])=>[x,y+n[1]*o,z+n[2]*o]);lg.poly(q,Lf(DP.display),[0,n[1],n[2]]);}
  for(const s of [1,-1]){const zA=-1.66,zB=-2.08,y0=1.38,y1=1.5,q=s>0?[[zB,y0],[zA,y0],[zA,y1],[zB,y1]]:[[zA,y0],[zB,y0],[zB,y1],[zA,y1]];lg.poly(q.map(([z,y])=>sidePt(s,z,y,.004)),Lf(DP.number),sideOut(s,1.44));}
  {const zr=y=>-2.17-(1.7-y)/1.15*.03-.005;lg.poly([[-.2,1.0,zr(1.0)],[.2,1.0,zr(1.0)],[.2,1.1,zr(1.1)],[-.2,1.1,zr(1.1)]],Lf(DP.number),[0,0,-1]);
   lg.poly([[-.86,.86,zr(.86)],[.86,.86,zr(.86)],[.86,.92,zr(.92)],[-.86,.92,zr(.92)]],Lf(DP.tail),[0,0,-1]);
   for(const s of [1,-1]){lg.poly([[s*.78,.6,zr(.6)],[s*.9,.6,zr(.6)],[s*.9,.86,zr(.86)],[s*.78,.86,zr(.86)]],Lf(DP.tail),[0,0,-1]);lg.poly([[s*.6,.62,zr(.62)],[s*.74,.62,zr(.62)],[s*.74,.68,zr(.68)],[s*.6,.68,zr(.68)]],Lf(DP.amber),[0,0,-1]);}}
  const lit=lg.mesh(B,'road-taxi-lit',scene,512,512);own.push(lit);
  // an axle: its two wheels, turning about the axle's own centre
  const ag=new Geo();wheelGeo(ag,WHEEL.x,0);wheelGeo(ag,-WHEEL.x,0);const axle=ag.mesh(B,'road-taxi-axle',scene,AW,AH);axle.material=body;own.push(axle);
  for(const m of [bodyMesh,glassMesh,doorMesh,lit,axle])m.setEnabled(false);
  return {own,body:bodyMesh,glass:glassMesh,door:doorMesh,lit,axle,low,tris:[bodyMesh,glassMesh,doorMesh,lit,axle,axle].reduce((n,m)=>n+m.getTotalIndices()/3,0)};
 }
 // the cab number painted on a cab: four digits from its id (cab-1 is 0724, the reference's)
 function number(id){if(id==='cab-1')return '0724';let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return String(1000+(h*7919)%8999).padStart(4,'0');}
 /* build(B, scene, set, id) -> {root, parts, door, wheels:[front, rear], own, state({show:'free'|'trip'|'arrived', brake, flash}), number} — one cab from the scene's shared parts */
 function build(B,scene,set,id){
  const root=new B.TransformNode('road-taxi-'+id,scene),own=[],clone=(m,name)=>{const c=m.clone('road-taxi-'+name+'-'+id,root);c.setEnabled(true);c.isPickable=false;return c;};
  const body=clone(set.body,'body'),glass=clone(set.glass,'glass'),door=clone(set.door,'door'),lit=clone(set.lit,'lit');
  const wheels=[WHEEL.z,-WHEEL.z].map((z,k)=>{const a=clone(set.axle,'axle'+k);a.position.set(0,WHEEL.r,z);return a;});
  const size=set.low?256:512,t=new B.DynamicTexture('road-taxi-lit-'+id,{width:size,height:size},scene,true),m=new B.StandardMaterial('road-taxi-lit-'+id,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;own.push(t,m);lit.material=m;
  const g=t.getContext(),num=number(id);g.setTransform(size/512,0,0,size/512,0,0);paintLights(g);let key='';
  const state=st=>{const k=st.show+'|'+(st.brake?1:0)+'|'+(st.flash?1:0);if(k===key)return;key=k;g.setTransform(size/512,0,0,size/512,0,0);paintCab(g,{...st,number:num});t.update();};
  state({show:'free',brake:false,flash:false});
  return {root,parts:[body,glass,door,lit,...wheels],door,wheels,own,state,number:num,doorOpen:0};
 }

 /* LED chase borders round the taxi stops' TAXI plates (the owner, 19 Nov 2026: "the taxi yellow lights to go around the sign like string lights on the chase setting",
    then "no bulbs, like leds"): a thin strip of small, close yellow LED points round each plate's edge, a bright band running round the frame with a soft fading tail.
    No real lights: one mesh for every plate in a build and one small shader (the time moves the band). Low quality: fewer LEDs and a slower chase.
    ledFrames(B, scene, frames, {quality, parent}) -> mesh. frames: [{x, y, z, turn, w, h, faces:[-1] | [-1, 1], off}] in the parent's space:
    (x, y, z) the plate's centre, turn its rotation about y, w x h the border's size (centre line of the strip), faces: which local side(s) (-z is a plane's front), off: the gap out from it. */
 function ledFrames(B,scene,frames,{quality='medium',parent=null}={}){
  if(!frames?.length)return null;
  const low=quality==='low',strip=.03,g=new Geo();let seed=11;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  for(const f of frames){const c=Math.cos(f.turn||0),s=Math.sin(f.turn||0),W=f.w/2,H=f.h/2,per=4*(W+H),shift=rnd();
   const P=(lx,ly,lz)=>[f.x+lx*c+lz*s,f.y+ly,f.z-lx*s+lz*c];
   for(const side of f.faces||[-1]){const lz=side*(f.off??.012),out=[side*s,0,side*c];
    // round the border: start at the top-left, clockwise as the viewer of this face sees it (the -z face sees +x on its right... mirrored for +z)
    const corners=side<0?[[-W,H],[W,H],[W,-H],[-W,-H]]:[[W,H],[-W,H],[-W,-H],[W,-H]];let run=0;
    for(let k=0;k<4;k++){const a=corners[k],b=corners[(k+1)%4],len=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/len,dy=(b[1]-a[1])/len,nx=-dy,ny=dx;   // inward normal of a clockwise loop... both sides of the centre line
     const e=strip/2,u0=shift+run/per,u1=shift+(run+len)/per;run+=len;
     g.poly([P(a[0]-nx*e-dx*e,a[1]-ny*e-dy*e,lz),P(b[0]-nx*e+dx*e,b[1]-ny*e+dy*e,lz),P(b[0]+nx*e+dx*e,b[1]+ny*e+dy*e,lz),P(a[0]+nx*e-dx*e,a[1]+ny*e-dy*e,lz)],[[u0,0],[u1,0],[u1,1],[u0,1]],out);}}}
  const mesh=new B.Mesh('taxi-stop-leds',scene),vd=new B.VertexData();vd.positions=g.p;vd.indices=g.i;vd.normals=g.n;vd.uvs=g.u;vd.applyToMesh(mesh);mesh.isPickable=false;if(parent)mesh.parent=parent;
  const per=(frames[0].w+frames[0].h)*2,n=Math.round(per/(low?.05:.03));
  const mat=new B.ShaderMaterial('taxi-stop-leds',scene,{
   vertexSource:'precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 worldViewProjection;varying vec2 vUV;void main(){vUV=uv;gl_Position=worldViewProjection*vec4(position,1.0);}',
   fragmentSource:'precision highp float;varying vec2 vUV;uniform float time;uniform float count;uniform float speed;uniform float tail;'+
    'void main(){float i=floor(vUV.x*count);float p=fract(i/count);float head=fract(time*speed);float d=fract(head-p);'+
    'float band=d<0.035?1.0:exp(-(d-0.035)*tail);float lvl=0.16+0.84*band;'+
    'vec2 q=vec2(fract(vUV.x*count)-0.5,vUV.y-0.5);float dotm=1.0-smoothstep(0.3,0.44,length(q));'+
    'vec3 led=mix(vec3(1.0,0.6,0.0),vec3(1.0,0.86,0.5),band*band*0.35)*lvl*(1.0+band*0.9);'+
    'gl_FragColor=vec4(mix(vec3(0.035,0.03,0.02),led,dotm),1.0);}'
  },{attributes:['position','uv'],uniforms:['worldViewProjection','time','count','speed','tail']});
  mat.setFloat('count',n);mat.setFloat('speed',low?.18:.38);mat.setFloat('tail',low?9:6);mat.setFloat('time',0);mat.backFaceCulling=true;mesh.material=mat;
  const t0=performance.now(),obs=scene.onBeforeRenderObservable.add(()=>mat.setFloat('time',(performance.now()-t0)/1000));
  mesh.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(obs);mat.dispose();});
  return mesh;
 }
 /* ---- the Meshy model (19 Nov 2026) ----
    vehicles/taxi-van.glb (taxi-van-low.glb on Low: 1024 maps): the owner's minivan made with Meshy from his reference picture, cut and re-baked in Blender
    (docs/development/MESHY_CHARACTERS.md): nodes body (two materials: the painted body with its baked lights as emission, and the tinted glass), axle_front
    and axle_rear (each a pair of wheels turning about the node). 4.4 m long, 1.72 m across the body. The cabin inside was cut out, so the glass shows the
    seats below (and anyone riding); from the seat the body's inner faces are drawn (two-sided), the glass is not. When the file is missing or fails to
    load the code van above stays. Per cab: body, glass, two axles, the seats, and the cab's own lit picture (windscreen display, numbers, tail lights,
    flashers, placed on the model's surfaces as measured in Blender) = 6 draw calls. */
 const MODEL={id:q=>'vehicle:taxi-van'+(q==='low'?'-low':''),src:q=>'assets/models/vehicles/'+(q==='low'?'taxi-van-low':'taxi-van')+'.glb'};
 const MWS={lo:[1.622,1.056],hi:[.679,1.843],x:[.02,.62]},MNUM={x:.745,z:[-1.86,-1.4],y:[1.1,1.28]};
 function modelParts(B,scene,quality,container){
  const low=quality==='low',own=[];
  for(const m of container.materials||[]){m.maxSimultaneousLights=8;
   if(/glass/i.test(m.name)){m.backFaceCulling=true;if('environmentIntensity' in m)m.environmentIntensity=.55;}
   else{m.backFaceCulling=false;if('twoSidedLighting' in m)m.twoSidedLighting=true;if(!low&&m.clearCoat&&!m.clearCoat.isEnabled){m.clearCoat.isEnabled=true;m.clearCoat.intensity=.6;m.clearCoat.roughness=.08;}}}
  // the seats (the model's own cabin was cut out): floor, dash with its screen, three rows; unlit vertex colours, a warm wash from the roof light
  const cabM=new B.StandardMaterial('road-taxi-seats',scene);cabM.diffuseColor=B.Color3.White();cabM.specularColor=B.Color3.Black();cabM.disableLighting=true;own.push(cabM);
  const cg=new Geo(),Z=[[0,0],[1,0],[1,1],[0,1]],seat=[.2,.17,.15],dark=[.07,.065,.06];
  cg.poly([[-.7,.4,-1.9],[.7,.4,-1.9],[.7,.4,1.3],[-.7,.4,1.3]],Z,[0,1,0],[.05,.045,.04]);
  // a roof lining with its warm light strip and a warm line along each side at the window sill, as in the built van (the model's own inside is black paint)
  cg.poly([[-.55,1.7,.7],[.55,1.7,.7],[.55,1.7,-1.85],[-.55,1.7,-1.85]],Z,[0,-1,0],[.15,.13,.12]);cg.poly([[-.06,1.695,.62],[.06,1.695,.62],[.06,1.695,-1.75],[-.06,1.695,-1.75]],Z,[0,-1,0],[1,.8,.55]);
  for(const s2 of [1,-1]){const x=s2*.8;cg.poly([[x,1.06,-1.85],[x,1.06,1.0],[x,1.09,1.0],[x,1.09,-1.85]],Z,[-s2,0,0],[.95,.62,.3]);}
  cg.box([0,.75,1.3],[1.4,.6,.3],Z,dark,true);cg.poly([[.38,.95,1.148],[-.38,.95,1.148],[-.38,1.03,1.148],[.38,1.03,1.148]],Z,[0,0,-1],[.15,.55,.65]);
  for(const [zc,back,row] of [[.62,.36,0],[-.35,-.66,1],[-1.4,-1.7,2]])for(const s2 of [1,-1]){const x=s2*.42;cg.box([x,.62,zc],[.48,.44,.5],Z,[.26,.22,.19],true);if(!row)cg.box([x,1.0,back],[.48,.36,.12],Z,seat,true);else{cg.box([x,1.13,back],[.48,.62,.12],Z,seat,true);cg.box([x,1.52,back+.01],[.26,.18,.1],Z,seat,true);}}
  const cabin=cg.mesh(B,'road-taxi-seats',scene,1,1);cabin.material=cabM;cabin.setEnabled(false);own.push(cabin);
  // the cab's own lit picture on the model (the windscreen display, numbers, tail lights, flashers; the 512 x 512 picture's lower half)
  const lg=new Geo(),D=r=>{const [x,y,w,h]=r;return [[x,y+h],[x+w,y+h],[x+w,y],[x,y]];};
  {const a=MWS.lo,b=MWS.hi,P=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],[z0,y0]=P(.14),[z1,y1]=P(.42),N=norm([0,a[0]-b[0],b[1]-a[1]]),o=.012;
   const q=[[MWS.x[1],y0,z0],[MWS.x[0],y0,z0],[MWS.x[0],y1,z1],[MWS.x[1],y1,z1]].map(([x,y,z])=>[x,y+N[1]*o,z+N[2]*o]);lg.poly(q,D(DP.display),[0,N[1],N[2]]);}
  for(const s2 of [1,-1]){const [zB,zA]=MNUM.z,[y0,y1]=MNUM.y,x=s2*(MNUM.x+.008),q=s2>0?[[zB,y0],[zA,y0],[zA,y1],[zB,y1]]:[[zA,y0],[zB,y0],[zB,y1],[zA,y1]];lg.poly(q.map(([z,y])=>[x,y,z]),D(DP.number),[s2,0,0]);}
  {const zr=-2.105;lg.poly([[-.17,1.05,zr],[.17,1.05,zr],[.17,1.15,zr],[-.17,1.15,zr]],D(DP.number),[0,0,-1]);
   for(const s2 of [1,-1]){lg.poly([[s2*.62,.86,zr],[s2*.8,.86,zr],[s2*.8,.99,zr],[s2*.62,.99,zr]],D(DP.tail),[0,0,-1]);lg.poly([[s2*.62,.57,zr],[s2*.8,.57,zr],[s2*.8,.66,zr],[s2*.62,.66,zr]],D(DP.tail),[0,0,-1]);lg.poly([[s2*.44,.6,zr],[s2*.58,.6,zr],[s2*.58,.66,zr],[s2*.44,.66,zr]],D(DP.amber),[0,0,-1]);}}
  // the roof box's left face: the model's texture has TAXI mirrored there (painted from one side); a lit TAXI covers it
  {const x=-.172,y0=1.8,y1=2.01,zf=.5,zb=-.66;lg.poly([[x,y0,zf],[x,y0,zb],[x,y1,zb],[x,y1,zf]],D(LP.signLong),[-1,0,0]);}
  const lit=lg.mesh(B,'road-taxi-lit',scene,512,512);lit.setEnabled(false);own.push(lit);
  return {own,low,model:true,container,cabin,lit,tris:(container.meshes||[]).reduce((n,m)=>n+(m.getTotalIndices?.()||0)/3,0)};
 }
 function buildModel(B,scene,set,id){
  const root=new B.TransformNode('road-taxi-'+id,scene),own=[],inst=set.container.instantiateModelsToScene(n=>'road-taxi-'+id+'-'+n,false,{doNotInstantiate:true});
  for(const r of inst.rootNodes)r.parent=root;
  const meshes=root.getChildMeshes(false);for(const m of meshes){m.isPickable=false;m.receiveShadows=false;}
  const axle=k=>{const n=root.getDescendants(false).find(d=>new RegExp('axle_'+k+'$').test(d.name));if(n&&n.rotationQuaternion){n.rotation=n.rotationQuaternion.toEulerAngles();n.rotationQuaternion=null;}return n;};
  const wheels=[axle('front'),axle('rear')].filter(Boolean);
  const clone=(m,name)=>{const c=m.clone('road-taxi-'+name+'-'+id,root);c.setEnabled(true);c.isPickable=false;return c;};
  const cabin=clone(set.cabin,'seats'),lit=clone(set.lit,'lit');
  const size=set.low?256:512,t=new B.DynamicTexture('road-taxi-lit-'+id,{width:size,height:size},scene,true),m=new B.StandardMaterial('road-taxi-lit-'+id,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;own.push(t,m);lit.material=m;
  const g=t.getContext(),num=number(id);let key='';
  const state=st=>{const k=st.show+'|'+(st.brake?1:0)+'|'+(st.flash?1:0);if(k===key)return;key=k;g.setTransform(size/512,0,0,size/512,0,0);paintCab(g,{...st,number:num});t.update();};
  state({show:'free',brake:false,flash:false});
  return {root,parts:[...meshes,cabin,lit],door:new B.TransformNode('road-taxi-door-'+id,scene),wheels,own,state,number:num,doorOpen:0,model:true};
 }
 const api={LEN,PROFILE,DOOR,WHEEL,MODEL,halfW,span,parts,build,modelParts,buildModel,number,ledFrames};
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.VoidTaxiVan=api;
})(typeof globalThis!=='undefined'?globalThis:this);
