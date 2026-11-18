/* ZEN ZEPHYR TEMPLE: the monastery wall round the hilltop (the owner, 18 Nov 2026: "a Buddhist monastery style wall around the outside of the Temple area, cyberpunk style
   but matching the Temple ... right at the dropoff on the edge, not very high, just taller than the player"). docs/development/TEMPLE.md.
   PURE layout (runs in Node, tests/temple-wall.test.cjs) plus the 3D build (browser only). The plateau's ground ends at |x|,|z| = 50 (temple-build.js `tmp-plateau`,
   100 x 100; the slope cone starts beyond it), so the wall's outer face stands at 49.65, just inside the drop. 2.3 m to the coping ridge (the player's eye is 1.7).
   Language: a Himalayan monastery wall (thick battered base, a dark printed-concrete body that matches the hall, a maroon band near the top with small gilt bosses, a
   dark tiled coping) translated into the Temple's material set; inset prayer-wheel niches and faint teal glyph panels every bay, a few warm lanterns, saffron cloth only at
   the gate and the overlook, small stupa finials on the corners and gate piers.
   Openings: the GATEHOUSE in the south wall behind the taxi stop (a road bay where the hill road comes up, and a walkers' bay behind the EAST GATE · ON FOOT sign), and a
   low OVERLOOK window in the east wall (a 1 m sill, so the view down to the city is kept; it stays solid). Nothing else at the Temple changes.
   Collision: this module wraps VoidTemple.layout(): the old 1.2 m parapet's solids are replaced by the wall's (same line, with the gate gaps). temple-build.js calls
   build() where it used to draw the parapet, and draws the parapet as before if this file is missing. Everything is parented to the Temple's node and its
   materials and textures go into the Temple's `own` list, so the area's dispose() removes it.
   Cost: one merged mesh per material (8 draw calls on every tier), no real lights. Low: plain colours, no glyph texture, no tile ribs or bosses. */
(function(root){
 'use strict';
 const T=typeof module==='object'&&module.exports?require('./temple.js'):root.VoidTemple;if(!T)return;
 const EDGE=50,LINE=49.1,BASE=1.1,TOP=.72,BODY=2.05,HEIGHT=2.3,OUT=LINE+BASE/2,IN=LINE-BASE/2,BAY=8;
 // Openings in the wall: [from, to] along the side. The road bay is centred on the taxi stop, the walkers' bay on the East Gate sign (WALK_BACK).
 const GATES=[{id:'foot-gate',side:'south',from:T.WALK_BACK.x-2.2,to:T.WALK_BACK.x+2.2,kind:'foot'},{id:'road-gate',side:'south',from:T.CAB_PAD.x-3.6,to:T.CAB_PAD.x+3.6,kind:'road'}];
 const WINDOW={id:'overlook-window',side:'east',from:-27.5,to:-12.5,sill:1};
 const SIDES=[{side:'south',axis:'z',c:-LINE,from:-OUT,to:OUT},{side:'north',axis:'z',c:LINE,from:-OUT,to:OUT},{side:'west',axis:'x',c:-LINE,from:-IN,to:IN},{side:'east',axis:'x',c:LINE,from:-IN,to:IN}];
 const halfAt=y=>BASE/2-(BASE-TOP)/2*Math.min(1,Math.max(0,y/BODY));   // the battered face: half the wall's thickness at height y
 function segments(){const out=[];
  for(const s of SIDES){const cuts=[...GATES.filter(g=>g.side===s.side).map(g=>({...g,gap:true})),...(WINDOW.side===s.side?[{...WINDOW,gap:false}]:[])].sort((a,b)=>a.from-b.from);let from=s.from,i=0;
   const add=(a,b,kind)=>{if(b-a>.01)out.push({id:'temple-perimeter-'+s.side+'-'+(i++),side:s.side,axis:s.axis,c:s.c,from:a,to:b,kind,height:kind==='window'?WINDOW.sill:HEIGHT,solidHeight:HEIGHT});};
   for(const g of cuts){add(from,g.from,'wall');if(!g.gap)add(g.from,g.to,'window');from=g.to;}add(from,s.to,'wall');}
  return out;}
 // Rect of a run [x0,x1,z0,z1] and the collider boxes (same shape as temple.js solids()). The window keeps its collider: you look over the sill, you do not step out.
 const rectOf=s=>s.axis==='z'?[s.from,s.to,s.c-BASE/2,s.c+BASE/2]:[s.c-BASE/2,s.c+BASE/2,s.from,s.to];
 function solids(){return segments().map(s=>{const r=rectOf(s);return {id:s.id,position:[(r[0]+r[1])/2,s.solidHeight/2,(r[2]+r[3])/2],size:[r[1]-r[0],s.solidHeight,r[3]-r[2]]};});}
 // Where a point on the inner face lies: along the side, at height y, `out` metres in front of the face. dir: the inward direction (+1 toward larger coordinate).
 function at(side,along,y,out=0){const s=SIDES.find(q=>q.side===side),dir=-Math.sign(s.c),f=s.c+dir*(halfAt(y)+out);return s.axis==='z'?[along,y,f]:[f,y,along];}
 const faceYaw={south:Math.PI,north:0,west:-Math.PI/2,east:Math.PI/2};   // a plane/box facing into the plateau from that side
 // Decoration, pure so it can be tested: pilasters between 8 m bays, a niche (prayer wheels or a glyph panel) or a lantern in each bay, finials, cloth.
 function features(){const out=[];let n=0;
  for(const s of segments().filter(q=>q.kind==='wall')){const len=s.to-s.from;if(len<6)continue;const bays=Math.max(1,Math.round(len/BAY)),bay=len/bays;
   for(let k=1;k<bays;k++)out.push({kind:'pilaster',side:s.side,along:s.from+k*bay});
   for(let k=0;k<bays;k++){const along=s.from+(k+.5)*bay;if(Math.abs(Math.abs(along)-LINE)<2.5)continue;out.push({kind:n%4===2?'lantern':n%4===0?'wheels':'glyph',side:s.side,along});n++;}}
  for(const x of [-1,1])for(const z of [-1,1])out.push({kind:'stupa',corner:true,x:x*LINE,z:z*LINE});
  const g0=Math.min(...GATES.map(g=>g.from)),g1=Math.max(...GATES.map(g=>g.to));
  out.push({kind:'stupa',gate:true,x:g0-.55,z:-LINE},{kind:'stupa',gate:true,x:g1+.55,z:-LINE});
  out.push({kind:'banner',side:'south',along:g0-.55},{kind:'banner',side:'south',along:g1+.55},{kind:'banner',side:'east',along:WINDOW.from-.6},{kind:'banner',side:'east',along:WINDOW.to+.6});
  return out;}
 // Collision: the parapet's solids give way to the wall's. Wraps layout() once; temple-integration.js reads it when the game starts.
 function apply(L){L.solids=L.solids.filter(s=>!/^temple-parapet-/.test(s.id)).concat(solids());return L;}
 if(T.layout&&!T.layout.withWall){const base=T.layout,f=function(){return apply(base.apply(this,arguments));};f.withWall=true;T.layout=f;}

 // ---- the 3D wall (browser only) ----
 function build({scene,parent,quality,own=[],mats={}}){
  const B=root.BABYLON,VK=B.VertexBuffer,low=quality==='low',hi=quality==='high'||quality==='ultra',lists=new Map(),made=[];let seed=9137;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const std=(name,diff,em,spec=.12)=>{const m=new B.StandardMaterial('tmp-wall-'+name,scene);m.diffuseColor=B.Color3.FromHexString(diff);m.emissiveColor=B.Color3.FromHexString(em);m.specularColor=new B.Color3(spec,spec,spec);m.specularPower=48;m.maxSimultaneousLights=4;own.push(m);return m;};
  const layer=mats.layer||std('body','#3c4747','#0a0f10'),trim=mats.trim||std('trim','#232b2d','#06090a',.4),dark=mats.dark||std('dark','#0b1012','#030506');
  const maroon=std('maroon','#431315','#0e0304',.08),gilt=std('gilt','#7a5a24','#170e03',.55),saffron=std('saffron','#c47418','#2e1503',.05);saffron.backFaceCulling=false;
  const lamp=new B.StandardMaterial('tmp-wall-lamp',scene);lamp.diffuseColor=B.Color3.Black();lamp.specularColor=B.Color3.Black();lamp.emissiveColor=B.Color3.FromHexString(low?'#a8681e':'#ffb04a');lamp.disableLighting=true;own.push(lamp);
  // the glyph panels: faint teal columns of small marks round a dim eight-spoked wheel (abstract; no real script is written). Low: a plain dim colour.
  const glyph=new B.StandardMaterial('tmp-wall-glyph',scene);glyph.diffuseColor=B.Color3.Black();glyph.specularColor=B.Color3.Black();glyph.disableLighting=true;own.push(glyph);
  if(low)glyph.emissiveColor=new B.Color3(.02,.09,.1);else{const t=new B.DynamicTexture('tmp-wall-glyph',{width:256,height:256},scene,true);own.push(t);const g=t.getContext(),w=256,h=256;g.fillStyle='#020708';g.fillRect(0,0,w,h);
   for(let x=14;x<w-10;x+=20)for(let y=12;y<h-10;y+=14){if(rand()<.28)continue;g.fillStyle='rgba(70,215,230,'+(.18+rand()*.32)+')';const k=rand();if(k<.4)g.fillRect(x,y,9,2);else if(k<.7){g.fillRect(x,y,2,9);g.fillRect(x,y+4,8,2);}else{g.fillRect(x,y,8,2);g.fillRect(x+3,y,2,9);}}
   g.fillStyle='rgba(2,7,8,.86)';g.beginPath();g.arc(w/2,h/2,64,0,7);g.fill();g.strokeStyle='rgba(120,240,250,.55)';g.lineWidth=3;g.beginPath();g.arc(w/2,h/2,52,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(w/2,h/2,14,0,7);g.stroke();
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.beginPath();g.moveTo(w/2+Math.cos(a)*14,h/2+Math.sin(a)*14);g.lineTo(w/2+Math.cos(a)*52,h/2+Math.sin(a)*52);g.stroke();}
   g.fillStyle='rgba(224,164,54,.75)';g.fillRect(w/2-2,h/2-2,4,4);t.update();glyph.emissiveTexture=t;}
  const put=(m,mat,x,y,z,ry=0)=>{m.position.set(x,y,z);m.rotation.y=ry;let l=lists.get(mat);if(!l)lists.set(mat,l=[]);l.push(m);return m;};
  const box=(w,h,d,x,y,z,mat,ry)=>put(B.MeshBuilder.CreateBox('tmp-wall',{width:w,height:h,depth:d},scene),mat,x,y,z,ry);
  const cyl=(dia,h,x,y,z,mat,top,seg=12)=>put(B.MeshBuilder.CreateCylinder('tmp-wall',{diameter:dia,diameterTop:top??dia,height:h,tessellation:seg},scene),mat,x,y,z);
  // a battered (tapered) run along local x: d0 deep at the foot, d1 at the top; UVs in world metres so the printed layers and the kit maps do not stretch
  const taper=(len,h,d0,d1,mat,x,y0,z,ry)=>{const m=B.MeshBuilder.CreateBox('tmp-wall',{width:len,height:h,depth:d0,updatable:true},scene),p=m.getVerticesData(VK.PositionKind),uv=m.getVerticesData(VK.UVKind),idx=m.getIndices(),n=[];
   for(let i=0;i<p.length;i+=3)if(p[i+1]>0)p[i+2]*=d1/d0;B.VertexData.ComputeNormals(p,idx,n);
   for(let i=0,j=0;i<p.length;i+=3,j+=2){const ax=Math.abs(n[i]),ay=Math.abs(n[i+1]),az=Math.abs(n[i+2]),v=(p[i+1]+h/2+y0)/BODY;if(ay>.9){uv[j]=p[i]/4;uv[j+1]=p[i+2]/4;}else if(ax>az){uv[j]=p[i+2]/2;uv[j+1]=v;}else{uv[j]=(p[i]+x+z)/4;uv[j+1]=v;}}
   m.setVerticesData(VK.PositionKind,p);m.setVerticesData(VK.NormalKind,n);m.setVerticesData(VK.UVKind,uv);return put(m,mat,x,y0+h/2,z,ry);};
  // one run of wall between two points along a side: plinth, battered body, maroon band with gilt bosses, coping slab, ridge and tile ribs
  const run=(s,a,b,top=BODY,band=true)=>{const len=b-a,mid=(a+b)/2,ry=s.axis==='z'?0:-Math.PI/2,pos=(o=0)=>s.axis==='z'?[mid,s.c+o]:[s.c+o,mid];const [px,pz]=pos();
   box(len,.3,BASE+.16,px,.15,pz,dark,ry);taper(len,top-.3,2*halfAt(.3),2*halfAt(top),layer,px,.3,pz,ry);
   const wTop=2*halfAt(top);
   if(band){const by0=top-.5,bw=2*halfAt(by0+.2)+.06;box(len,.38,bw,px,by0+.19,pz,maroon,ry);
    if(!low){for(let q=a+1;q<b-.5;q+=2){const [x,y,z]=at(s.side,q,by0+.19,.04);const d=put(B.MeshBuilder.CreateCylinder('tmp-wall',{diameter:.1,height:.025,tessellation:10},scene),gilt,x,y,z);d.rotation.x=Math.PI/2;d.rotation.y=faceYaw[s.side];}}}
   box(len,.12,wTop+.36,px,top+.06,pz,trim,ry);const r=box(len,.2,.2,px,top+.12,pz,trim,ry);r.rotation.x=Math.PI/4;   // the coping and its ridge (top ~2.26-2.3)
   box(len,.04,wTop+.4,px,top-.02,pz,dark,ry);   // a dark drip line under the eave
   if(!low)for(let q=a+.2;q<b-.1;q+=hi?.42:.6)box(.07,.05,wTop+.34,...(s.axis==='z'?[q,top+.145,s.c]:[s.c,top+.145,q]),trim,s.axis==='z'?0:-Math.PI/2);};
  const segs=segments();
  for(const s of segs){if(s.kind==='wall')run(s,s.from,s.to);else{   // the overlook window: a 1 m sill, slim posts, a lintel carrying the band and the coping
    run(s,s.from,s.to,WINDOW.sill,false);const len=s.to-s.from,posts=4;for(let k=1;k<posts;k++){const q=s.from+k*len/posts;box(.26,BODY-.5-WINDOW.sill,.26,s.c,WINDOW.sill+(BODY-.5-WINDOW.sill)/2,q,trim);}
    const mid=(s.from+s.to)/2;box(.5,.38,len,s.c,BODY-.31,mid,maroon);box(.5,.12,len,s.c,BODY-.06,mid,layer);box(.88,.12,len,s.c,BODY+.06,mid,trim);const r=box(.2,.2,len,s.c,BODY+.12,mid,trim);r.rotation.z=Math.PI/4;}}
  // piers: thicker, a little taller blocks at both window ends
  for(const q of [WINDOW.from,WINDOW.to])taper(.7,BODY-.3+.25,BASE+.2,TOP+.2,layer,LINE,.3,q,-Math.PI/2);
  // pilasters between the bays: a slightly deeper battered strip, the same layered concrete
  const F=features();
  for(const f of F.filter(f=>f.kind==='pilaster')){const s=SIDES.find(q=>q.side===f.side),[x,,z]=s.axis==='z'?[f.along,0,s.c]:[s.c,0,f.along];taper(.5,BODY-.5-.3,BASE+.14,TOP+.16,layer,x,.3,z,s.axis==='z'?0:-Math.PI/2);}
  // niches: a dark recess in a trim frame under a small hood; prayer wheels (dark drums with gilt bands) or a faint teal glyph panel
  for(const f of F.filter(f=>f.kind==='wheels'||f.kind==='glyph')){const ry=faceYaw[f.side],Y=1,c=at(f.side,f.along,Y,.02),w=1.5,h=.8;
   box(w+.16,h+.16,.1,...c,trim,ry);const back=at(f.side,f.along,Y,.06);box(w,h,.06,...back,dark,ry);const hood=at(f.side,f.along,Y+h/2+.1,.12);box(w+.4,.08,.34,...hood,trim,ry);
   put(B.MeshBuilder.CreatePlane('tmp-wall',{width:w-.14,height:h-.14},scene),glyph,...at(f.side,f.along,Y,.1),ry);
   if(f.kind==='wheels')for(const d of [-.46,0,.46]){cyl(.3,.56,...at(f.side,f.along+d,Y,.3),trim,undefined,14);for(const yy of [Y-.22,Y+.22])cyl(.33,.04,...at(f.side,f.along+d,yy,.3),gilt,undefined,14);cyl(.04,.72,...at(f.side,f.along+d,Y,.3),trim,undefined,6);}}
  // lanterns: a bracket from the face and a small warm lamp under a cap (emissive only: no real light is added)
  for(const f of F.filter(f=>f.kind==='lantern')){const ry=faceYaw[f.side],b0=at(f.side,f.along,1.86,.18);box(.06,.06,.36,...b0,trim,ry);const l=at(f.side,f.along,1.62,.32);cyl(.2,.3,...l,lamp,.16,8);const cap=at(f.side,f.along,1.8,.32);cyl(.28,.06,...cap,trim,.12,8);const base=at(f.side,f.along,1.45,.32);cyl(.16,.04,...base,trim,undefined,8);}
  // corner towers and gate piers, each with a small stupa finial (square base, dome, gilt spire)
  const stupa=(x,y,z)=>{box(.8,.24,.8,x,y+.12,z,trim);const d=put(B.MeshBuilder.CreateSphere('tmp-wall',{diameter:.72,segments:10},scene),trim,x,y+.5,z);d.scaling.y=.8;box(.34,.14,.34,x,y+.86,z,maroon);cyl(.26,.62,x,y+1.22,z,gilt,.04,10);cyl(.14,.05,x,y+.95,z,gilt,undefined,10);};
  for(const f of F.filter(f=>f.kind==='stupa')){const tall=f.gate?3.6:2.75,w=f.gate?1.1:1.7,d=f.gate?BASE+.3:1.7;box(w+.2,.3,d+.2,f.x,.15,f.z,dark);taper(w,tall-.3-.12,d,d-.22,layer,f.x,.3,f.z,0);
   box(w+.04,.36,d-.16,f.x,tall-.62,f.z,maroon);box(w+.36,.12,d+.14,f.x,tall-.06,f.z,trim);stupa(f.x,tall,f.z);}
  // the gatehouse: the middle pier, a lintel over both bays with the band, a tiled roof, a lamp under it in each bay, and a glyph plaque on the middle pier
  {const g0=Math.min(...GATES.map(g=>g.from))-1.1,g1=Math.max(...GATES.map(g=>g.to))+1.1,m0=GATES[0].to,m1=GATES[1].from,mid=(g0+g1)/2,len=g1-g0,z=-LINE;
   box(m1-m0+.2,.3,BASE+.5,(m0+m1)/2,.15,z,dark);taper(m1-m0,3.6-.3,BASE+.3,BASE+.08,layer,(m0+m1)/2,.3,z,0);
   box(len,.5,BASE+.1,mid,3.05,z,layer);box(len+.04,.32,BASE+.16,mid,3.1,z,maroon);box(len+.9,.14,BASE+1,mid,3.37,z,trim);const ridge=box(len+.6,.32,.32,mid,3.46,z,trim);ridge.rotation.x=Math.PI/4;
   if(!low)for(let q=g0-.35;q<g1+.4;q+=hi?.42:.6)box(.08,.06,BASE+.96,q,3.47,z,trim);
   for(const g of GATES){const cx=(g.from+g.to)/2;box(.05,.32,.05,cx,2.62,z+.1,trim);cyl(.22,.34,cx,2.32,z+.1,lamp,.18,8);cyl(.3,.06,cx,2.5,z+.1,trim,.14,8);}
   put(B.MeshBuilder.CreatePlane('tmp-wall',{width:1.2,height:1.2},scene),glyph,(m0+m1)/2,1.9,z+.72,Math.PI);}
  // saffron cloth: a long narrow hanging on the gate piers and the overlook's ends (sparing; the Temple's warm accent)
  for(const f of F.filter(f=>f.kind==='banner')){const deep=f.side==='south'?(BASE+.3)/2:(BASE+.2)/2,y=f.side==='south'?2.2:1.35,s=SIDES.find(q=>q.side===f.side),dir=-Math.sign(s.c);
   const pos=s.axis==='z'?[f.along,y,s.c+dir*(deep+.03)]:[s.c+dir*(deep+.03),y,f.along];put(B.MeshBuilder.CreatePlane('tmp-wall',{width:.46,height:f.side==='south'?1.9:1.1},scene),saffron,...pos,faceYaw[f.side]);
   const bar=s.axis==='z'?[f.along,y+(f.side==='south'?.95:.55),s.c+dir*(deep+.05)]:[s.c+dir*(deep+.05),y+.55,f.along];box(.56,.04,.04,...bar,gilt,faceYaw[f.side]);}
  // the hill road and the walkers' path leaving through the gate, down the slope (the cone below the plateau: top radius 56 at y -0.2, falling 70 m over 324 m)
  {const slopeY=r=>r<=56?-.12:-.2-(r-56)*70/324+.06,road=(x0,w,z1)=>{const L=[],R=[];for(let z=-OUT+.2;z>=z1;z-=z>-60?1:4){const y=z>-EDGE?.012:slopeY(Math.hypot(x0,z));L.push(new B.Vector3(x0-w/2,y,z));R.push(new B.Vector3(x0+w/2,y,z));}
    return put(B.MeshBuilder.CreateRibbon('tmp-wall',{pathArray:[L,R],sideOrientation:B.Mesh.DOUBLESIDE},scene),dark,0,0,0);};
   road(T.CAB_PAD.x,6.4,-150);road(T.WALK_BACK.x,2,-90);
   for(let z=-56;z>-150;z-=9)for(const sx of [-1,1]){const x=T.CAB_PAD.x+sx*3.5;box(.12,.5,.12,x,slopeY(Math.hypot(x,z))+.25,z,trim);box(.1,.08,.1,x,slopeY(Math.hypot(x,z))+.52,z,lamp);}}
  // merge: one mesh per material (8 draw calls in all)
  const node=new B.TransformNode('tmp-wall-root',scene);node.parent=parent;
  for(const [mat,list] of lists){const m=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!m)continue;m.name='tmp-wall-'+mat.name.replace(/^tmp-(wall-)?/,'');m.material=mat;m.parent=node;m.isPickable=false;made.push(m);}
  return {node,meshes:made,drawCalls:made.length,dispose(){node.dispose(false,false);}};}

 const api={EDGE,LINE,BASE,TOP,BODY,HEIGHT,GATES,WINDOW,SIDES,halfAt,segments,solids,features,at,apply,build};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidTempleWall=api;
})(typeof globalThis!=='undefined'?globalThis:this);
