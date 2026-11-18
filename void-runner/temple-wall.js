/* ZEN ZEPHYR TEMPLE: the monastery wall round the hilltop (the owner, 18 Nov 2026: "a Buddhist monastery style wall around the outside of the Temple area, cyberpunk style
   but matching the Temple ... right at the dropoff on the edge, not very high, just taller than the player"; then: "make the new wall translucent, but about .20m solid at
   the bottom and the solid part slightly thicker with trim at the bottom"). docs/development/TEMPLE.md.
   PURE layout (runs in Node, tests/temple-wall.test.cjs) plus the 3D build (browser only). The plateau's ground ends at |x|,|z| = 50 (temple-build.js `tmp-plateau`,
   100 x 100; the slope cone starts beyond it), so the wall's outer face stands at 49.65, just inside the drop. 2.3 m to the top rail (the player's eye is 1.7).
   Form: a solid 0.2 m printed-concrete base, wider than the wall above, on a dark trim moulding; above it translucent dark-teal glass panels between slim dark mullions,
   a thin maroon rail and a dark cap on top (the monastery wall's band and coping, kept as a rail); faint additive dharma-wheel glyphs in the glass every bay, a few warm
   lamps under the rail; solid corner posts and gate piers with small stupa finials; saffron cloth only at the gate and the overlook.
   Openings: the GATEHOUSE in the south wall behind the taxi stop (a road bay where the hill road comes up, and a walkers' bay behind the EAST GATE · ON FOOT sign), and a
   low OVERLOOK window in the east wall (glass only to 1 m, so the view down to the city is clear; it stays solid). Nothing else at the Temple changes.
   Collision: this module wraps VoidTemple.layout(): the old 1.2 m parapet's solids are replaced by the wall's (full height, same line, with the gate gaps). temple-build.js
   calls build() where it used to draw the parapet, and draws the parapet as before if this file is missing. Everything is parented to the Temple's node and its
   materials and textures go into the Temple's `own` list, so the area's dispose() removes it.
   Cost: one glass material (four meshes, one per side, so Babylon sorts them by distance; no depth write), one merged mesh per other material, no real lights.
   Low: no glyphs, plain colours, the glass a little more opaque and unlit by specular. */
(function(root){
 'use strict';
 const T=typeof module==='object'&&module.exports?require('./temple.js'):root.VoidTemple;if(!T)return;
 const EDGE=50,LINE=49.4,BASE=.5,PLINTH=.2,GLASS=.24,RAIL=2.1,HEIGHT=2.3,OUT=LINE+BASE/2,IN=LINE-BASE/2,BAY=8;
 // Openings in the wall: [from, to] along the side. The road bay is centred on the taxi stop, the walkers' bay on the East Gate sign (WALK_BACK).
 const GATES=[{id:'foot-gate',side:'south',from:T.WALK_BACK.x-2.2,to:T.WALK_BACK.x+2.2,kind:'foot'},{id:'road-gate',side:'south',from:T.CAB_PAD.x-3.6,to:T.CAB_PAD.x+3.6,kind:'road'}];
 const WINDOW={id:'overlook-window',side:'east',from:-27.5,to:-12.5,sill:1};
 const SIDES=[{side:'south',axis:'z',c:-LINE,from:-OUT,to:OUT},{side:'north',axis:'z',c:LINE,from:-OUT,to:OUT},{side:'west',axis:'x',c:-LINE,from:-IN,to:IN},{side:'east',axis:'x',c:LINE,from:-IN,to:IN}];
 const halfAt=y=>y<=PLINTH?BASE/2:GLASS/2;   // half the wall's thickness at height y: the solid base is wider than the glass above
 function segments(){const out=[];
  for(const s of SIDES){const cuts=[...GATES.filter(g=>g.side===s.side).map(g=>({...g,gap:true})),...(WINDOW.side===s.side?[{...WINDOW,gap:false}]:[])].sort((a,b)=>a.from-b.from);let from=s.from,i=0;
   const add=(a,b,kind)=>{if(b-a>.01)out.push({id:'temple-perimeter-'+s.side+'-'+(i++),side:s.side,axis:s.axis,c:s.c,from:a,to:b,kind,height:kind==='window'?WINDOW.sill:HEIGHT,solidHeight:HEIGHT});};
   for(const g of cuts){add(from,g.from,'wall');if(!g.gap)add(g.from,g.to,'window');from=g.to;}add(from,s.to,'wall');}
  return out;}
 // Rect of a run [x0,x1,z0,z1] and the collider boxes (same shape as temple.js solids()). Full height, glass or not: you see through it, you do not walk through it.
 const rectOf=s=>s.axis==='z'?[s.from,s.to,s.c-BASE/2,s.c+BASE/2]:[s.c-BASE/2,s.c+BASE/2,s.from,s.to];
 function solids(){return segments().map(s=>{const r=rectOf(s);return {id:s.id,position:[(r[0]+r[1])/2,s.solidHeight/2,(r[2]+r[3])/2],size:[r[1]-r[0],s.solidHeight,r[3]-r[2]]};});}
 // Where a point on the inner face lies: along the side, at height y, `out` metres in front of the face.
 function at(side,along,y,out=0){const s=SIDES.find(q=>q.side===side),dir=-Math.sign(s.c),f=s.c+dir*(halfAt(y)+out);return s.axis==='z'?[along,y,f]:[f,y,along];}
 const faceYaw={south:Math.PI,north:0,west:-Math.PI/2,east:Math.PI/2};   // a plane/box facing into the plateau from that side
 // Decoration, pure so it can be tested: mullions every third of a bay, a faint glyph in the glass or (every third bay) a warm lamp under the rail, finials, cloth.
 function features(){const out=[];let n=0;
  for(const s of segments()){const len=s.to-s.from;if(len<3)continue;const bays=Math.max(1,Math.round(len/BAY)),bay=len/bays;
   for(let k=1;k<bays*3;k++)out.push({kind:'mullion',side:s.side,along:s.from+k*bay/3});   // thirds of a bay, so a glyph at the bay's centre never sits on a mullionif(s.kind!=='wall')continue;
   for(let k=0;k<bays;k++){const along=s.from+(k+.5)*bay;if(Math.abs(Math.abs(along)-LINE)<2.5)continue;out.push({kind:n%3===1?'lantern':'glyph',side:s.side,along});n++;}}
  for(const x of [-1,1])for(const z of [-1,1])out.push({kind:'stupa',corner:true,x:x*LINE,z:z*LINE});
  const g0=Math.min(...GATES.map(g=>g.from)),g1=Math.max(...GATES.map(g=>g.to));
  out.push({kind:'stupa',gate:true,x:g0-.4,z:-LINE},{kind:'stupa',gate:true,x:g1+.4,z:-LINE});
  out.push({kind:'banner',side:'south',along:g0-.4},{kind:'banner',side:'south',along:g1+.4},{kind:'banner',side:'east',along:WINDOW.from-.45},{kind:'banner',side:'east',along:WINDOW.to+.45});
  return out;}
 // Collision: the parapet's solids give way to the wall's. Wraps layout() once; temple-integration.js reads it when the game starts.
 function apply(L){L.solids=L.solids.filter(s=>!/^temple-parapet-/.test(s.id)).concat(solids());return L;}
 if(T.layout&&!T.layout.withWall){const base=T.layout,f=function(){return apply(base.apply(this,arguments));};f.withWall=true;T.layout=f;}

 // ---- the 3D wall (browser only) ----
 function build({scene,parent,quality,own=[],mats={}}){
  const B=root.BABYLON,low=quality==='low',lists=new Map(),made=[];let seed=9137;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const std=(name,diff,em,spec=.12)=>{const m=new B.StandardMaterial('tmp-wall-'+name,scene);m.diffuseColor=B.Color3.FromHexString(diff);m.emissiveColor=B.Color3.FromHexString(em);m.specularColor=new B.Color3(spec,spec,spec);m.specularPower=48;m.maxSimultaneousLights=4;own.push(m);return m;};
  const layer=mats.layer||std('body','#3c4747','#0a0f10'),trim=mats.trim||std('trim','#232b2d','#06090a',.4),dark=mats.dark||std('dark','#0b1012','#030506');
  const maroon=std('maroon','#431315','#0e0304',.08),gilt=std('gilt','#7a5a24','#170e03',.55),saffron=std('saffron','#c47418','#2e1503',.05);saffron.backFaceCulling=false;
  const lamp=new B.StandardMaterial('tmp-wall-lamp',scene);lamp.diffuseColor=B.Color3.Black();lamp.specularColor=B.Color3.Black();lamp.emissiveColor=B.Color3.FromHexString(low?'#a8681e':'#ffb04a');lamp.disableLighting=true;own.push(lamp);
  // the glass: one material for every panel; dark teal, see-through, a cold sheen on Medium and up; no depth write, so the far sides show through the near one
  const glass=new B.StandardMaterial('tmp-wall-glass',scene);glass.diffuseColor=new B.Color3(.05,.16,.17);glass.emissiveColor=new B.Color3(.018,.07,.075);glass.alpha=low?.4:.32;glass.disableDepthWrite=true;glass.backFaceCulling=true;
  glass.specularColor=low?B.Color3.Black():new B.Color3(.45,.62,.64);glass.specularPower=110;glass.maxSimultaneousLights=4;own.push(glass);
  // the glyphs in the glass: a faint dharma wheel inside a ring of small marks (abstract; no real script), additive. Not on Low.
  let glyph=null;if(!low){const t=new B.DynamicTexture('tmp-wall-glyph',{width:256,height:256},scene,true);own.push(t);const g=t.getContext(),w=256,h=256,c=w/2;g.fillStyle='#000';g.fillRect(0,0,w,h);
   g.strokeStyle='rgba(90,225,238,.85)';g.lineWidth=3;g.beginPath();g.arc(c,c,92,0,7);g.stroke();g.lineWidth=2;g.beginPath();g.arc(c,c,70,0,7);g.stroke();g.beginPath();g.arc(c,c,16,0,7);g.stroke();
   for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.beginPath();g.moveTo(c+Math.cos(a)*16,c+Math.sin(a)*16);g.lineTo(c+Math.cos(a)*70,c+Math.sin(a)*70);g.stroke();g.beginPath();g.arc(c+Math.cos(a)*81,c+Math.sin(a)*81,3,0,7);g.stroke();}
   g.fillStyle='rgba(90,225,238,.6)';for(let i=0;i<36;i++){const a=i/36*Math.PI*2+.05;if(rand()<.25)continue;g.save();g.translate(c+Math.cos(a)*110,c+Math.sin(a)*110);g.rotate(a);g.fillRect(-1,-5,2,10);if(rand()<.5)g.fillRect(-4,-1,8,2);g.restore();}
   g.fillStyle='rgba(230,170,70,.9)';g.fillRect(c-3,c-3,6,6);t.update();
   glyph=new B.StandardMaterial('tmp-wall-glyph',scene);glyph.diffuseColor=B.Color3.Black();glyph.specularColor=B.Color3.Black();glyph.emissiveTexture=t;t.level=.55;glyph.disableLighting=true;glyph.alpha=.9;glyph.alphaMode=B.Engine.ALPHA_ADD;glyph.disableDepthWrite=true;glyph.backFaceCulling=false;own.push(glyph);}
  const put=(m,mat,x,y,z,ry=0,key=mat)=>{m.position.set(x,y,z);m.rotation.y=ry;let l=lists.get(key);if(!l)lists.set(key,l=[mat]);l.push(m);return m;};
  const box=(w,h,d,x,y,z,mat,ry,key)=>put(B.MeshBuilder.CreateBox('tmp-wall',{width:w,height:h,depth:d},scene),mat,x,y,z,ry,key);
  const cyl=(dia,h,x,y,z,mat,top,seg=12)=>put(B.MeshBuilder.CreateCylinder('tmp-wall',{diameter:dia,diameterTop:top??dia,height:h,tessellation:seg},scene),mat,x,y,z);
  // one run along a side: the trim moulding at the foot, the solid base, the glass up to `top`, the maroon rail and the dark cap
  const run=(s,a,b,top=RAIL)=>{const len=b-a,mid=(a+b)/2,ry=s.axis==='z'?0:-Math.PI/2,px=s.axis==='z'?mid:s.c,pz=s.axis==='z'?s.c:mid;
   box(len,.07,BASE+.08,px,.035,pz,trim,ry);box(len,PLINTH-.07,BASE,px,.07+(PLINTH-.07)/2,pz,layer,ry);box(len,.025,BASE+.03,px,PLINTH-.0125,pz,trim,ry);
   box(len,top-PLINTH,GLASS,px,PLINTH+(top-PLINTH)/2,pz,glass,ry,'glass-'+s.side);
   box(len,.08,GLASS+.06,px,top+.04,pz,maroon,ry);box(len,.06,GLASS+.16,px,top+.11,pz,trim,ry);const r=box(len,.1,.1,px,top+.14,pz,trim,ry);r.rotation.x=Math.PI/4;};   // top ~2.21-2.3
  for(const s of segments())run(s,s.from,s.to,s.kind==='window'?WINDOW.sill:RAIL);
  const F=features(),side=n=>SIDES.find(q=>q.side===n);
  // mullions: slim dark posts through the glass from the base to the rail (up to the sill at the overlook window, where slim posts carry a lintel rail)
  for(const f of F.filter(f=>f.kind==='mullion')){const s=side(f.side),inWin=f.side===WINDOW.side&&f.along>WINDOW.from&&f.along<WINDOW.to,x=s.axis==='z'?f.along:s.c,z=s.axis==='z'?s.c:f.along,ry=s.axis==='z'?0:-Math.PI/2;
   box(.09,RAIL-PLINTH,GLASS+.05,x,PLINTH+(RAIL-PLINTH)/2,z,trim,ry);if(inWin)box(.09,.06,GLASS+.05,x,RAIL+.03,z,trim,ry);}
  {const s=side(WINDOW.side),len=WINDOW.to-WINDOW.from,mid=(WINDOW.from+WINDOW.to)/2;box(GLASS+.06,.08,len,s.c,RAIL+.04,mid,maroon);box(GLASS+.16,.06,len,s.c,RAIL+.11,mid,trim);
   for(const q of [WINDOW.from,WINDOW.to])box(.36,RAIL+.14,.36,s.c,(RAIL+.14)/2,q,layer);}
  // glyphs in the glass (Medium and up) and warm lamps hung under the rail on the inside (emissive only: no real light is added)
  for(const f of F.filter(f=>f.kind==='glyph'))if(glyph)put(B.MeshBuilder.CreatePlane('tmp-wall',{width:1.3,height:1.3},scene),glyph,...at(f.side,f.along,1.2,-GLASS/2+.005),faceYaw[f.side]);
  for(const f of F.filter(f=>f.kind==='lantern')){const ry=faceYaw[f.side];box(.05,.05,.3,...at(f.side,f.along,RAIL-.02,.15),trim,ry);cyl(.18,.28,...at(f.side,f.along,RAIL-.2,.28),lamp,.14,8);cyl(.25,.05,...at(f.side,f.along,RAIL-.04,.28),trim,.1,8);cyl(.14,.035,...at(f.side,f.along,RAIL-.355,.28),trim,undefined,8);}
  // corner posts and gate piers: solid, the same base and trim, the maroon band and a small stupa finial (square base, dome, gilt spire)
  const stupa=(x,y,z,k)=>{box(.6*k,.2*k,.6*k,x,y+.1*k,z,trim);const d=put(B.MeshBuilder.CreateSphere('tmp-wall',{diameter:.56*k,segments:10},scene),trim,x,y+.4*k,z);d.scaling.y=.8;box(.26*k,.1*k,.26*k,x,y+.68*k,z,maroon);cyl(.2*k,.5*k,x,y+.98*k,z,gilt,.03*k,10);cyl(.11*k,.04*k,x,y+.75*k,z,gilt,undefined,10);};
  for(const f of F.filter(f=>f.kind==='stupa')){const tall=f.gate?3.3:2.55,w=f.gate?.8:.7,d=f.gate?BASE+.1:.7;box(w+.1,.07,d+.1,f.x,.035,f.z,trim);box(w,tall-.07,d,f.x,.07+(tall-.07)/2,f.z,layer);
   box(w+.04,.2,d+.04,f.x,tall-.38,f.z,maroon);box(w+.16,.08,d+.16,f.x,tall-.04,f.z,trim);stupa(f.x,tall,f.z,f.gate?1:.8);}
  // the gatehouse: the middle pier, a lintel over both bays with the band, a dark tiled roof, a lamp under it in each bay, a glyph on the middle pier
  {const g0=Math.min(...GATES.map(g=>g.from))-.8,g1=Math.max(...GATES.map(g=>g.to))+.8,m0=GATES[0].to,m1=GATES[1].from,mid=(g0+g1)/2,len=g1-g0,z=-LINE;
   box(m1-m0+.1,.07,BASE+.18,(m0+m1)/2,.035,z,trim);box(m1-m0,3.3-.07,BASE+.1,(m0+m1)/2,.07+(3.3-.07)/2,z,layer);
   box(len,.4,BASE,mid,2.9,z,layer);box(len+.02,.24,BASE+.06,mid,2.92,z,maroon);box(len+.7,.1,BASE+.7,mid,3.15,z,trim);const ridge=box(len+.5,.24,.24,mid,3.22,z,trim);ridge.rotation.x=Math.PI/4;
   if(!low)for(let q=g0-.3;q<g1+.3;q+=.45)box(.06,.05,BASE+.66,q,3.22,z,trim);
   for(const g of GATES){const cx=(g.from+g.to)/2;box(.04,.26,.04,cx,2.57,z+.08,trim);cyl(.2,.3,cx,2.3,z+.08,lamp,.16,8);cyl(.27,.05,cx,2.46,z+.08,trim,.12,8);}
   if(glyph)put(B.MeshBuilder.CreatePlane('tmp-wall',{width:.9,height:.9},scene),glyph,(m0+m1)/2,1.7,z+(BASE+.1)/2+.02,Math.PI);}
  // saffron cloth: a long narrow hanging on the gate piers and the overlook's ends (sparing; the Temple's warm accent)
  for(const f of F.filter(f=>f.kind==='banner')){const s=side(f.side),dir=-Math.sign(s.c),gate=f.side==='south',deep=gate?(BASE+.1)/2:.18,y=gate?2.05:1.3,hgt=gate?1.7:1.1;
   const pos=s.axis==='z'?[f.along,y,s.c+dir*(deep+.03)]:[s.c+dir*(deep+.03),y,f.along];put(B.MeshBuilder.CreatePlane('tmp-wall',{width:gate?.42:.3,height:hgt},scene),saffron,...pos,faceYaw[f.side]);
   const bar=s.axis==='z'?[f.along,y+hgt/2,s.c+dir*(deep+.05)]:[s.c+dir*(deep+.05),y+hgt/2,f.along];box(gate?.52:.38,.04,.04,...bar,gilt,faceYaw[f.side]);}
  // the hill road and the walkers' path leaving through the gate, down the slope (the cone below the plateau: top radius 56 at y -0.2, falling 70 m over 324 m)
  {const slopeY=r=>r<=56?-.12:-.2-(r-56)*70/324+.06,road=(x0,w,z1)=>{const L=[],R=[];for(let z=-OUT+.2;z>=z1;z-=z>-60?1:4){const y=z>-EDGE?.012:slopeY(Math.hypot(x0,z));L.push(new B.Vector3(x0-w/2,y,z));R.push(new B.Vector3(x0+w/2,y,z));}
    return put(B.MeshBuilder.CreateRibbon('tmp-wall',{pathArray:[L,R],sideOrientation:B.Mesh.DOUBLESIDE},scene),dark,0,0,0);};
   road(T.CAB_PAD.x,6.4,-150);road(T.WALK_BACK.x,2,-90);
   for(let z=-56;z>-150;z-=9)for(const sx of [-1,1]){const x=T.CAB_PAD.x+sx*3.5;box(.12,.5,.12,x,slopeY(Math.hypot(x,z))+.25,z,trim);box(.1,.08,.1,x,slopeY(Math.hypot(x,z))+.52,z,lamp);}}
  // merge: one mesh per material, and the glass one per side (so the sides sort by distance)
  const node=new B.TransformNode('tmp-wall-root',scene);node.parent=parent;
  for(const [key,[mat,...list]] of lists){const m=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!m)continue;m.name='tmp-wall-'+(typeof key==='string'?key:mat.name.replace(/^tmp-(wall-)?/,''));m.material=mat;m.parent=node;m.isPickable=false;made.push(m);}
  return {node,meshes:made,drawCalls:made.length,dispose(){node.dispose(false,false);}};}

 const api={EDGE,LINE,BASE,PLINTH,GLASS,RAIL,HEIGHT,GATES,WINDOW,SIDES,halfAt,segments,solids,features,at,apply,build};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidTempleWall=api;
})(typeof globalThis!=='undefined'?globalThis:this);
