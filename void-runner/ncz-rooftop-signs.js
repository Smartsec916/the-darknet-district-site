/* Rooftop letter signs (the owner, 20 Nov 2026): one in each of NeoChinatown's three street quarters, "one in each area if you look up". After his reference
   photo of an old Soviet-era rooftop sign (big separate block letters standing on a steel lattice along a roofline), given a cyberpunk treatment: each letter is
   its own shallow box letter with an LED face (some flicker, one or two are dead), rust and grime on the frames, a steel truss behind with a maintenance
   catwalk and cables, and a small made-up emblem panel. THE WORDS ARE THE OWNER'S CHOICE, spelled exactly as he gave them; do not change them without him.
   PURE PART (SIGNS, layout()) runs in Node (tests/rooftop-signs.test.cjs); build() needs Babylon and is called by neochinatown.js with the street's plots.
   Cheap: per sign one merged mesh per material (letter faces, flickering faces, dead letters, letter sides, frame, catwalk grating), emissive only, no real lights. */
(function(root){
 'use strict';
 /* id, quarter, words (rows of the sign; a space is a gap on the frame), meaning, line: the street face of the roof it stands on ('n','s','e','w': the side of the
    building the sign looks out of; 'e' looks toward +x) and where (x or z of that face, and the middle of the sign along it), cell: a letter's width in metres,
    colours: the LED faces (red and amber like the reference, some cold white), dead: letters (by index, spaces counted) that are out, flicker: letters that flicker. */
 const SIGNS=[
  {id:'avenue-city',quarter:'avenue',words:['ГОРОД БЕЗ СНА'],meaning:'city without sleep',face:'s',line:-5,mid:61,cell:2.2,colours:['#ff3a2e','#ff3a2e','#ffb347'],dead:[7],flicker:[3,11]},
  {id:'oldtown-nightlife',quarter:'oldtown',words:['НОЧНАЯ ЖИЗНЬ'],meaning:'nightlife',face:'w',line:71,mid:-42,cell:2.0,colours:['#ff2f5a','#ffb347','#e8f0ff'],dead:[2],flicker:[8]},
  {id:'far-south-nirvana',quarter:'far-south',words:['НИРВАНА'],meaning:'nirvana',face:'e',line:51,mid:-178,cell:2.4,colours:['#ffb347','#ff3a2e'],dead:[4],flicker:[1]}];
 const FACE={s:[0,-1],n:[0,1],e:[1,0],w:[-1,0]};
 /* Where a sign's letters go, in metres along its face (u, from its left end as seen from the street) and up (v, from the frame's foot): [{ch, u, v, w, h, i}] and
    the sign's {width, height}. A space is 0.6 of a cell. */
 function layout(sign){
  const cw=sign.cell,lh=cw*1.3,gap=cw*.12,rows=sign.words,out=[];let width=0,i=0;
  const rw=rows.map(r=>[...r].reduce((a,c)=>a+(c===' '?cw*.6:cw),0));width=Math.max(...rw);
  rows.forEach((r,ri)=>{let u=(width-rw[ri])/2;const v=(rows.length-1-ri)*(lh+gap*2);for(const ch of r){if(ch===' '){u+=cw*.6;i++;continue;}out.push({ch,u:u+cw/2,v:v+lh/2,w:cw-gap,h:lh,i});u+=cw;i++;}});
  return {letters:out,width,height:rows.length*lh+(rows.length-1)*gap*2};}
 /* Does a plot (its rectangle on the ground) carry a sign? neochinatown.js gives those plots a floor more than any other, so each sign stands clear against the sky
    from the street below (the owner: "one in each area if you look up"). */
 function under(x0,x1,z0,z1){for(const S of SIGNS){const L=layout(S),lo=S.mid-L.width/2-.6,hi=S.mid+L.width/2+.6,f=S.face==='s'?z0:S.face==='n'?z1:S.face==='e'?x1:x0;if(Math.abs(f-S.line)>.8)continue;
  const along=S.face==='n'||S.face==='s',a=along?x0:z0,b=along?x1:z1;if(a<hi&&b>lo)return S.id;}return null;}
 // Every letter must be Cyrillic capitals (the owner's words): a test checks it.
 const letters=()=>SIGNS.flatMap(s=>s.words.join('').replace(/ /g,'').split(''));

 /* build(env): env {B, scene, parent, quality, quarter, plots:[{x0,x1,z0,z1,h}], keep(x,z), textures, owned}. Returns {tick(dt), dispose(), signs:[...]}. */
 function build(env){
  const {B,scene,parent,quality,plots=[]}=env,low=quality==='low',rich=quality==='high'||quality==='ultra',made=[],meshes=[],flick=[];
  let q=91;const rnd=()=>(q=q*16807%2147483647)/2147483647;
  const own=m=>{(env.owned||made).push(m);return m;};
  const frameM=own(new B.PBRMaterial('rooftop-frame',scene));frameM.albedoColor=B.Color3.FromHexString('#3b2a22');frameM.roughness=.82;frameM.metallic=.55;
  const steelM=own(new B.PBRMaterial('rooftop-steel',scene));steelM.albedoColor=B.Color3.FromHexString('#24262a');steelM.roughness=.6;steelM.metallic=.75;
  const cableM=own(new B.PBRMaterial('rooftop-cable',scene));cableM.albedoColor=B.Color3.FromHexString('#0b0b0d');cableM.roughness=.6;cableM.metallic=.2;
  for(const S of SIGNS){
   const [nx,nz]=FACE[S.face],along=S.face==='n'||S.face==='s',L=layout(S);
   // the roofs under the sign: plots whose street face is this line and that reach under the sign's span
   const lo=S.mid-L.width/2-.6,hi=S.mid+L.width/2+.6;
   const under=plots.filter(p=>{const f=S.face==='s'?p.z0:S.face==='n'?p.z1:S.face==='e'?p.x1:p.x0;if(Math.abs(f-S.line)>.8)return false;const a=along?p.x0:p.z0,b=along?p.x1:p.z1;return a<hi&&b>lo;});
   if(!under.length)continue;
   const roof=Math.max(...under.map(p=>p.h)),base=roof+1.1,set=.8;   // the letters stand 1.1 m over the highest roof, 0.8 m back from the street face (along the roofline, so they read from the pavement opposite)
   const r=Math.atan2(-nx,-nz),ax=[Math.cos(r),-Math.sin(r)];   // a quad (or a box's -z) turned by r faces (-sin r, -cos r) = (nx, nz); ax: the viewer's left-to-right
   const c0=along?[S.mid,S.line-nz*set]:[S.line-nx*set,S.mid];   // the middle of the sign's face line, set back onto the roof
   if(env.keep&&!env.keep(c0[0],c0[1]))continue;
   const W=(u,w)=>[c0[0]+ax[0]*(u-L.width/2)+nx*w,c0[1]+ax[1]*(u-L.width/2)+nz*w];   // u along from the left end, w toward the street
   // ---- the letters: one canvas per sign, a cell per letter
   const CW=128,CH=Math.round(CW*1.3),n=L.letters.length,T=new B.DynamicTexture('rooftop-letters-'+S.id,{width:CW*n,height:CH},scene,true);T.hasAlpha=true;(env.textures||made).push(T);
   const g=T.getContext();g.clearRect(0,0,CW*n,CH);
   L.letters.forEach((l,k)=>{const x=k*CW+CW/2,col=S.colours[k%S.colours.length];g.save();g.beginPath();g.rect(k*CW,0,CW,CH);g.clip();
    g.font='900 '+Math.round(CH*.98)+'px "Arial Black","Arial",Arial,"DejaVu Sans","Liberation Sans",sans-serif';g.textAlign='center';g.textBaseline='middle';
    const wd=g.measureText(l.ch).width,sx=Math.min(1,(CW*.96)/wd);g.translate(x,CH*.53);g.scale(sx,1);
    g.fillStyle=col;g.fillText(l.ch,0,0);
    // LED face: rows of dots (darker between), a hot core line, grime running down from the top, a rust drip or two
    g.globalCompositeOperation='source-atop';g.setTransform(1,0,0,1,0,0);
    g.fillStyle='rgba(0,0,0,.35)';for(let yy=0;yy<CH;yy+=7)g.fillRect(k*CW,yy+5,CW,2);for(let xx=k*CW;xx<(k+1)*CW;xx+=7)g.fillRect(xx+5,0,2,CH);
    const gr=g.createLinearGradient(0,0,0,CH);gr.addColorStop(0,'rgba(255,255,255,.28)');gr.addColorStop(.45,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(40,20,10,.45)');g.fillStyle=gr;g.fillRect(k*CW,0,CW,CH);
    for(let d=0;d<3;d++){const dx=k*CW+10+rnd()*(CW-20),len=CH*(.2+rnd()*.5);g.fillStyle='rgba(70,35,15,'+(.25+rnd()*.3)+')';g.fillRect(dx,CH-len,2+rnd()*3,len);}
    g.globalCompositeOperation='source-over';g.restore();});
   T.update();
   const faceM=own(new B.StandardMaterial('rooftop-face-'+S.id,scene));faceM.diffuseTexture=T;faceM.emissiveTexture=T;faceM.diffuseColor=B.Color3.Black();faceM.specularColor=B.Color3.Black();faceM.disableLighting=true;faceM.useAlphaFromDiffuseTexture=false;
   const deadM=own(new B.StandardMaterial('rooftop-dead-'+S.id,scene));deadM.diffuseTexture=T;deadM.diffuseColor=new B.Color3(.22,.2,.2);deadM.specularColor=new B.Color3(.05,.05,.05);deadM.emissiveColor=new B.Color3(.02,.02,.025);
   const sideM=own(new B.StandardMaterial('rooftop-side-'+S.id,scene));sideM.diffuseTexture=T;sideM.diffuseColor=new B.Color3(.09,.08,.08);sideM.specularColor=new B.Color3(.1,.1,.1);sideM.emissiveColor=new B.Color3(.015,.012,.012);sideM.backFaceCulling=false;
   const groups={face:[],flick:[],dead:[],side:[]};
   for(const [k,l] of L.letters.entries()){const uv=[k/n,0,(k+1)/n,1],kind=S.dead.includes(l.i)?'dead':S.flicker.includes(l.i)?'flick':'face';
    groups[kind].push({u:l.u,v:l.v,w:l.w,h:l.h,d:0,uv});
    // the letter's depth: its silhouette repeated behind the face (a shallow box letter, 0.3 m deep)
    for(const d of low?[.18]:[.1,.2,.3])groups.side.push({u:l.u,v:l.v,w:l.w,h:l.h,d,uv});}
   const quadMesh=(name,list,m)=>{if(!list.length)return null;const P=[],N=[],U=[],I=[];
    for(const qd of list){const [cx,cz]=W(qd.u,-qd.d),cy=base+.35+qd.v,k=P.length/3;
     for(const [sx,sy,uu,vv] of [[-1,-1,qd.uv[0],0],[1,-1,qd.uv[2],0],[1,1,qd.uv[2],1],[-1,1,qd.uv[0],1]]){P.push(cx+ax[0]*sx*qd.w/2,cy+sy*qd.h/2,cz+ax[1]*sx*qd.w/2);N.push(nx,0,nz);U.push(uu,vv);}
     I.push(k,k+1,k+2,k,k+2,k+3);}   // the same winding as neochinatown.js quadAt(): the front looks toward the street (checked in screenshots)
    const mesh=new B.Mesh(name,scene),vd=new B.VertexData();vd.positions=P;vd.normals=N;vd.uvs=U;vd.indices=I;vd.applyToMesh(mesh);mesh.material=m;mesh.parent=parent;mesh.isPickable=false;meshes.push(mesh);return mesh;};
   quadMesh('rooftop-letters',groups.face,faceM);quadMesh('rooftop-dead',groups.dead,deadM);quadMesh('rooftop-sides',groups.side,sideM);
   const fl=quadMesh('rooftop-flicker',groups.flick,faceM);if(fl)flick.push({mesh:fl,next:1+rnd()*4,off:0});
   // ---- the steel: chords, posts, braces, legs down to each roof, the catwalk and its rail, cables (by tier)
   const parts={frame:[],steel:[]},bx=(kind,size,u,y,w,rz=0)=>{const m=B.MeshBuilder.CreateBox('rooftop-'+kind,{width:size[0],height:size[1],depth:size[2]},scene);const [x,z]=W(u,w);m.position.set(x,y,z);m.rotation.set(0,r,rz);parts[kind==='grate'||kind==='rail'?'steel':'frame'].push(m);return m;};
   const top=base+.35+L.height+.25,span=L.width+1.2,u0=-.6,back=-.55,step=1.6;
   for(const y of [base+.2,top])bx('chord',[span,.16,.16],L.width/2,y,back);
   if(!low)bx('chord',[span,.12,.12],L.width/2,(base+top)/2,back);
   const posts=Math.max(2,Math.round(span/step));for(let k=0;k<=posts;k++){const u=u0+span*k/posts;bx('post',[.14,top-base+.1,.14],u,(base+top)/2,back);
    if(!low&&k<posts){const du=span/posts,dy=top-base-.2,len=Math.hypot(du,dy);bx('brace',[len,.07,.07],u+du/2,(base+top)/2,back,(k%2?1:-1)*Math.atan2(dy,du));}
    // legs: down to whatever roof is under this post
    const [lx,lz]=W(u,back),p=under.find(p=>lx>=p.x0-.2&&lx<=p.x1+.2&&lz>=p.z0-.2&&lz<=p.z1+.2)||under[0],legH=base+.2-p.h;if(legH>.05){bx('leg',[.16,legH,.16],u,p.h+legH/2,back);bx('foot',[.4,.08,.4],u,p.h+.04,back);}
    if(!low){const [kx,kz]=W(u,back-1.2),pk=under.find(p=>kx>=p.x0-.2&&kx<=p.x1+.2&&kz>=p.z0-.2&&kz<=p.z1+.2)||p,sh=base+.2-pk.h;if(sh>.05)bx('strut',[.1,sh,.1],u,pk.h+sh/2,back-1.2);}}
   if(!low){bx('grate',[span,.05,.8],L.width/2,base+.08,back-.55);bx('rail',[span,.05,.05],L.width/2,base+1.1,back-.9);for(let k=0;k<=posts;k+=2)bx('rail',[.05,1,.05],u0+span*k/posts,base+.6,back-.9);}
   // the emblem: a small panel at the left end on its own bracket, a made-up mark (a ring round three bars), amber
   if(!low){const E=new B.DynamicTexture('rooftop-emblem-'+S.id,{width:128,height:128},scene,true);(env.textures||made).push(E);const e=E.getContext();e.fillStyle='#0b0b0d';e.fillRect(0,0,128,128);e.strokeStyle='#ffb347';e.lineWidth=9;e.beginPath();e.arc(64,64,44,0,Math.PI*2);e.stroke();e.fillStyle='#ffb347';for(let k=0;k<3;k++)e.fillRect(40,38+k*20,48-k*12,11);e.fillStyle='rgba(60,30,10,.5)';e.fillRect(0,96,128,32);E.update();
    const em=own(new B.StandardMaterial('rooftop-emblem-'+S.id,scene));em.diffuseColor=B.Color3.Black();em.specularColor=B.Color3.Black();em.emissiveTexture=E;em.disableLighting=true;
    const size=Math.min(2.2,L.height*.9),pl=B.MeshBuilder.CreatePlane('rooftop-emblem',{width:size,height:size},scene),[ex,ez]=W(-size/2-.5,.02);pl.position.set(ex,base+.35+L.height/2,ez);pl.rotation.y=r;pl.material=em;pl.parent=parent;pl.isPickable=false;meshes.push(pl);
    bx('emblem-back',[size+.2,size+.2,.12],-size/2-.5,base+.35+L.height/2,-.08);bx('emblem-arm',[1,.1,.1],-.3,base+.35+L.height/2,back);}
   const cables=[];if(rich){for(let k=0;k<4;k++){const u=rnd()*L.width,[ax0,az0]=W(u,back),[bx0,bz0]=W(u+(rnd()-.5)*3,back-2.5-rnd()*2),p=under[0],pts=[];for(let t=0;t<=8;t++){const f=t/8;pts.push(new B.Vector3(ax0+(bx0-ax0)*f,base+.2+(p.h+.05-base-.2)*f+Math.sin(Math.PI*f)*-.3,az0+(bz0-az0)*f));}cables.push(B.MeshBuilder.CreateTube('rooftop-cable',{path:pts,radius:.03,tessellation:4},scene));}}
   for(const [list,m] of [[parts.frame,frameM],[parts.steel,steelM],[cables,cableM]]){if(!list.length)continue;const merged=B.Mesh.MergeMeshes(list,true,true);if(!merged)continue;merged.name='rooftop-steel';merged.material=m;merged.parent=parent;merged.isPickable=false;merged.freezeWorldMatrix();meshes.push(merged);}
  }
  function tick(dt){for(const f of flick){f.next-=dt;if(f.next>0)continue;if(f.off>0){f.mesh.setEnabled(true);f.off--;f.next=f.off>0?.05+rnd()*.12:1.5+rnd()*6;}else{f.mesh.setEnabled(false);f.off=1+Math.floor(rnd()*4);f.next=.04+rnd()*.15;}}}
  function dispose(){for(const m of meshes)m.dispose();for(const t of made)t.dispose?.();meshes.length=0;}
  return {tick,dispose,meshes,count:meshes.length};
 }
 const api={SIGNS,FACE,layout,letters,under,build};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidRooftopSigns=api;
})(typeof globalThis!=='undefined'?globalThis:this);
