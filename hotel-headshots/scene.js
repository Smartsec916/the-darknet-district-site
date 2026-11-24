/* Hotel architecture and original props; public CC0 characters load separately. */
(function(root){
 'use strict';
 const B=root.BABYLON,R=root.HotelRules,V=(x,y,z)=>new B.Vector3(x,y,z);
 function build(engine,map,settings){
  const scene=new B.Scene(engine);scene.clearColor=new B.Color4(.38,.65,.84,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.003;scene.fogColor=new B.Color3(.62,.77,.85);
  const camera=new B.UniversalCamera('eyes',V(24,1.68,4.8),scene);camera.minZ=.055;camera.maxZ=100;camera.fov=1.18;camera.inputs.clear();
  const hemi=new B.HemisphericLight('ambient',V(.1,1,.2),scene);hemi.intensity=.85;hemi.groundColor=B.Color3.FromHexString('#41463d');
  const sun=new B.DirectionalLight('window light',V(-.4,-1,.3),scene);sun.position=V(24,12,12);sun.intensity=1.15;sun.diffuse=B.Color3.FromHexString('#fff0d1');
  const shadow=settings.shadows?new B.ShadowGenerator(1024,sun):null;if(shadow){shadow.usePercentageCloserFiltering=true;shadow.filteringQuality=B.ShadowGenerator.QUALITY_LOW;shadow.bias=.002;shadow.normalBias=.03;}
  const materials={},statics=[],doors=[],objects=[],curtains=[],refills=[],mirrors=[];
  function mat(name,color,rough=.7,metal=0){if(materials[name])return materials[name];const m=new B.PBRMaterial(name,scene);m.albedoColor=B.Color3.FromHexString(color);m.roughness=rough;m.metallic=metal;m.environmentIntensity=.5;materials[name]=m;return m;}
  const gold=mat('scuffed steel','#65717b',.62,.65),wood=mat('battered laminate','#242630',.86),stone=mat('stained composite','#657477',.55,.1),dark=mat('painted metal','#10151e',.55,.3),cloth=mat('upholstery',map.theme.carpet,.94),white=mat('linen','#9da9ab',.9),leaf=mat('leaves','#294c3b',.8),glass=mat('bottle glass','#2d7767',.18,.25);
  const wallpaper=mat('wallpaper',map.theme.wall,.92),carpet=mat('carpet',map.theme.carpet,1),ceiling=mat('ceiling','#282a31',.95);
  function texture(material,kind){const t=new B.DynamicTexture(kind,256,scene,false),g=t.getContext();g.fillStyle=material.albedoColor.toHexString();g.fillRect(0,0,256,256);let seed=1337;for(let i=0;i<9000;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%256;seed=(seed*1664525+1013904223)>>>0;const y=seed%256;g.fillStyle=i%2?'#ffffff0a':'#00000013';g.fillRect(x,y,kind==='wallpaper'?1:2,2);}g.strokeStyle=kind==='carpet'?'#c89d5d40':'#baa17e30';g.lineWidth=1;for(let x=0;x<256;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,256);g.stroke();if(kind==='carpet')for(let y=0;y<256;y+=32){g.beginPath();g.moveTo(x+16,y+4);g.lineTo(x+28,y+16);g.lineTo(x+16,y+28);g.lineTo(x+4,y+16);g.closePath();g.stroke();}}t.update();material.albedoTexture=t;material.albedoColor=B.Color3.White();return t;}
  texture(wallpaper,'wallpaper');const carpetTex=texture(carpet,'carpet');carpetTex.uScale=carpetTex.vScale=18;
  // Grimy wall panels and worn composite are original canvas textures.
  {const g=wallpaper.albedoTexture.getContext();g.fillStyle=map.theme.wall;g.fillRect(0,0,256,256);g.strokeStyle='#05090f99';g.lineWidth=3;g.strokeRect(4,4,248,248);g.strokeRect(12,12,232,232);for(let i=0;i<65;i++){g.fillStyle=i%2?'#8ea5a514':'#00000021';g.fillRect((i*79)%256,(i*43)%256,1+(i%3),10+i%31);}for(const x of [18,238])for(const y of [18,238]){g.fillStyle='#6f7a82';g.fillRect(x,y,3,3);}wallpaper.albedoTexture.update();}
  {const t=new B.DynamicTexture('veined marble',256,scene,false),g=t.getContext();g.fillStyle='#a5aaa5';g.fillRect(0,0,256,256);for(let i=0;i<40;i++){g.strokeStyle=i%2?'#686d6c20':'#eef0df40';g.lineWidth=i%3+1;g.beginPath();for(let x=0;x<=256;x+=8)g.lineTo(x,((i*41)+Math.sin(x*.02+i)*22)%256);g.stroke();}t.update();stone.albedoTexture=t;stone.albedoColor=B.Color3.White();}
  function finish(m,material,pos,parent,dynamic){m.material=material;m.position.copyFromFloats(...pos);m.receiveShadows=true;if(parent)m.parent=parent;if(!dynamic&&!parent)statics.push(m);return m;}
  function box(name,pos,size,material,parent=null,dynamic=false){return finish(B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene),material,pos,parent,dynamic);}
  function sphere(name,pos,size,material,parent=null,dynamic=false){const m=B.MeshBuilder.CreateSphere(name,{diameter:1,segments:12},scene);m.scaling.copyFromFloats(...size);return finish(m,material,pos,parent,dynamic);}
  function cylinder(name,pos,h,d,material,parent=null,dynamic=false){return finish(B.MeshBuilder.CreateCylinder(name,{height:h,diameter:d,tessellation:16},scene),material,pos,parent,dynamic);}
  function sign(text,pos,w=3,h=.65,rot=0,color='#67edee'){const t=new B.DynamicTexture('sign '+text,{width:768,height:192},scene,false),g=t.getContext();g.fillStyle='#09121a';g.fillRect(0,0,768,192);g.strokeStyle=map.theme.accent;g.lineWidth=4;g.strokeRect(9,9,750,174);g.font='bold '+Math.min(65,Math.floor(1150/text.length))+'px monospace';g.textAlign='center';g.textBaseline='middle';g.shadowColor=color;g.shadowBlur=16;g.fillStyle=color;g.fillText(text,384,96);g.shadowBlur=0;for(let y=0;y<192;y+=4){g.fillStyle='#00000025';g.fillRect(0,y,768,1);}t.update();const m=new B.StandardMaterial('lettering',scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.specularColor=B.Color3.Black();const mesh=B.MeshBuilder.CreatePlane('sign',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);mesh.material=m;mesh.position.copyFromFloats(...pos);mesh.rotation.y=rot;return mesh;}
  const center=R.world((R.SIZE-1)/2),extent=R.SIZE*R.TILE;const ground=box('pool foundation',[center,-1.55,center],[extent,.3,extent],stone);for(let z=0;z<R.SIZE;z++){let start=0;for(let x=0;x<=R.SIZE;x++)if(x===R.SIZE||map.grid[z][x]==='W'){if(x>start)box('floor',[R.world((start+x-1)/2),-.16,R.world(z)],[(x-start)*R.TILE,.3,R.TILE],z>=25?stone:carpet);start=x+1;}}
  for(let z=0;z<R.SIZE;z++)for(let x=0;x<R.SIZE;x++)if(map.grid[z][x]==='#'){
   const wx=R.world(x),wz=R.world(z);box('wall',[wx,1.9,wz],[2.4,3.8,2.4],wallpaper);box('wainscot',[wx,.58,wz],[2.42,1.16,2.42],wood);box('skirting',[wx,.16,wz],[2.44,.2,2.44],dark);box('chair rail',[wx,1.17,wz],[2.46,.065,2.46],gold);box('crown',[wx,3.45,wz],[2.47,.13,2.47],gold);
  }
  // Daylight reaches the lobby and indoor pool through framed glazed roofs.
  box('guest wing ceiling',[center,3.95,37.2],[extent,.15,48],ceiling);
  const roofGlass=new B.StandardMaterial('daylight skylight glass',scene);roofGlass.diffuseColor=new B.Color3(.65,.82,.9);roofGlass.alpha=.12;roofGlass.specularColor=new B.Color3(.8,.85,.9);roofGlass.backFaceCulling=false;
  box('lobby glazed roof',[center,3.95,6],[extent,.08,14.4],roofGlass,null,true);
  if(map.index<4)box('pool glazed roof',[center,3.95,67.2],[extent,.08,12],roofGlass,null,true);
  for(const z of [6,67.2]){if(z>60&&map.index===4)continue;for(let x=0;x<=72;x+=12)box('skylight mullion',[x,3.91,z],[.12,.14,z<10?14.4:12],gold);}
  const skyCloud=new B.StandardMaterial('daytime clouds',scene);skyCloud.diffuseColor=B.Color3.Black();skyCloud.emissiveColor=new B.Color3(.94,.97,1);skyCloud.disableLighting=true;
  for(let i=0;i<8;i++){const x=8+(i%4)*18,z=i<4?7:66;for(let j=0;j<3;j++){const cloud=sphere('daytime cloud',[x+(j-1)*3,18+(i%3)*2,z+j*2],[10,2.8+j%2,6],skyCloud);cloud.isPickable=false;}}

  for(let z=3;z<30;z+=4)box('service ceiling beam',[center,3.75,R.world(z)],[extent,.18,.16],wood);
  // Wall panels, brass columns, practical lamps and hotel clutter frame the route.
  const lampMat=mat('neon diffuser',map.theme.accent,.5);lampMat.emissiveColor=B.Color3.FromHexString(map.theme.accent).scale(1.6);
  const cyan=mat('cyan tubes','#3ca7ad',.4);cyan.emissiveColor=new B.Color3(.15,1.8,2);
  for(let z=7;z<19;z+=4)for(const x of [1,19]){const wx=R.world(x),wz=R.world(z);box('neon housing',[wx,2.8,wz],[.18,.32,2.1],dark);box('neon strip',[wx+(x===1?.11:-.11),2.8,wz],[.04,.055,1.9],x===1?lampMat:cyan);for(let i=0;i<3;i++)box('exposed conduit',[wx,3.35+i*.12,wz],[.07,.07,9.6],gold);box('junction box',[wx,2.05,wz+1],[.2,.5,.35],dark);}
  for(const z of [5,10,15]){box('ceiling cable tray',[24,3.6,R.world(z)],[38,.12,.28],dark);for(let i=0;i<5;i++)box('tray cable',[24,3.63,R.world(z)-.1+i*.045],[37.8,.035,.025],gold);}
  const lightPoints=[[15,4],[15,10],[15,20],[5,15],[25,15],[18,27]];
  lightPoints.forEach(([x,z],i)=>{const wx=R.world(x),wz=R.world(z);cylinder('fixture cable',[wx,3.45,wz],.6,.025,dark);box('fluorescent housing',[wx,3.15,wz],[1.5,.12,.32],dark);box('fluorescent tube',[wx,3.07,wz],[1.35,.06,.15],i%2?cyan:lampMat);const l=new B.PointLight('neon practical '+i,V(wx,2.9,wz),scene);l.diffuse=B.Color3.FromHexString(i===0||i===5?'#fff1d6':i%2?'#58e2ed':map.theme.accent);l.intensity=i===0||i===5?1.6:2.4;l.range=22;});
  for(const [x,z] of [[2,2],[18,2],[2,18],[16,18]]){const wx=R.world(x),wz=R.world(z);cylinder('planter',[wx,.3,wz],.6,.65,dark);for(let i=0;i<7;i++){const a=i*2.4,m=sphere('palm',[wx+Math.sin(a)*.3,1.1+i*.08,wz+Math.cos(a)*.3],[.12,1.1,.35],leaf);m.rotation.z=Math.sin(a)*.7;m.rotation.x=Math.cos(a)*.5;}}
  for(const d of map.doors){const x=R.world(d.x),z=R.world(d.z),side=map.grid[d.z-1]?.[d.x]==='#';d.side=side;box('door lintel',[x,3.25,z],side?[.35,.5,2.4]:[2.4,.5,.35],wood);const hinge=new B.TransformNode('door hinge',scene);hinge.position=side?V(x,0,z-1.13):V(x-1.13,0,z);hinge.rotation.y=side?-Math.PI/2:0;const mesh=box('door',[1.13,1.5,0],[2.2,3,.12],wood,hinge,true);box('door inlay',[1.13,1.6,-.07],[1.82,2.2,.035],dark,hinge,true);sphere('handle',[1.95,1.2,-.16],[.12,.12,.12],gold,hinge,true);if(d.z===0||side){box('entrance inside panel',[1.13,1.6,.07],[1.82,2.2,.035],dark,hinge,true);sphere('inside handle',[1.95,1.2,.16],[.12,.12,.12],gold,hinge,true);}if(d.label.includes('EMERGENCY'))box('emergency panic bar',[1.13,1.15,d.z===0||side?.18:-.18],[1.5,.07,.08],gold,hinge,true);doors.push({data:d,hinge,mesh,angle:0,base:hinge.rotation.y});}
  function couch(x,z){box('sofa base',[x,.35,z],[1.9,.5,1.25],wood);box('sofa seat',[x,.65,z-.15],[1.65,.27,1],cloth);box('sofa back',[x,1.05,z+.47],[1.9,.95,.3],cloth);for(const s of [-1,1])box('sofa arm',[x+s*.91,.8,z],[.22,.65,1.25],cloth);for(const s of [-1,1])box('pillow',[x+s*.42,.92,z+.2],[.55,.4,.24],white);}
  function bottle(x,y,z,i){const n=new B.TransformNode('bottle',scene);n.position=V(x,y,z);const m=cylinder('bottle body',[0,.17,0],.34,.14,i%2?glass:gold,n,true);cylinder('bottle neck',[0,.4,0],.15,.065,glass,n,true);box('bottle label',[0,.18,-.073],[.095,.13,.008],white,n,true);const o={node:n,mesh:m,kind:'bottle',fall:0,base:y};for(const p of n.getChildMeshes())p.metadata={object:o};objects.push(o);}
  for(const p of map.props){const meshStart=scene.meshes.length;const x=R.world(p.x),z=R.world(p.z);
   if(p.kind==='dining-table'){
    box('dining top',[x,.78,z],[1.7,.12,3.2],wood);for(const a of [-.65,.65])for(const b of [-1.35,1.35])box('table leg',[x+a,.38,z+b],[.07,.76,.07],gold);
    const cz=z+2.4;box('dining seat',[x,.48,cz],[.65,.12,.65],cloth);box('chair back',[x,.85,cz+.33],[.65,.75,.09],wood);for(const a of [-.27,.27])for(const b of [-.27,.27])box('chair leg',[x+a,.23,cz+b],[.045,.46,.045],gold);
    for(const dz of [-1.05,1.05]){cylinder('ceramic plate',[x,.86,z+dz],.035,.42,white);sphere('noodle bowl',[x,.91,z+dz],[.32,.12,.32],stone);sphere('meal',[x,.97,z+dz],[.25,.04,.25],mat('noodles','#c8a16a'));for(let i=0;i<4;i++)sphere('vegetables',[x-.08+i*.05,.995,z+dz+(i%2)*.06],[.04,.025,.05],leaf);cylinder('paper cup',[x+.53,.98,z+dz],.25,.14,white);box('napkin',[x-.5,.86,z+dz],[.25,.015,.3],white);box('chopsticks',[x-.48,.88,z+dz],[.025,.015,.28],gold);}bottle(x+.5,.85,z,0);
   }
   if(p.kind==='buffet'){
    const cz=z-.5,bread=mat('toasted pastry','#b77b42',.9),egg=mat('egg yolk','#e4ac36',.75),fruit=mat('breakfast fruit','#9b3935',.65);
    box('breakfast counter',[x,.5,cz],[7.2,1,1.25],dark);box('breakfast worktop',[x,1.04,cz],[7.25,.08,1.3],stone);
    box('counter backsplash',[x,1.25,cz-.62],[7.2,.4,.06],gold);
    for(const dx of [-2.8,-1.4,0]){box('breakfast tray',[x+dx,1.12,cz],[1.15,.08,.8],gold);box('cabinet door',[x+dx,.52,cz+.64],[1.25,.84,.025],wood);box('cabinet handle',[x+dx,.83,cz+.68],[.32,.035,.04],gold);}
    for(let i=0;i<4;i++){const fx=x-3.08+(i%2)*.5,fz=cz-.22+Math.floor(i/2)*.42;sphere('fried egg white',[fx,1.18,fz],[.38,.04,.3],white);sphere('fried egg yolk',[fx,1.21,fz],[.15,.07,.15],egg);}
    for(let stack=0;stack<2;stack++){for(let layer=0;layer<3;layer++)cylinder('pancake',[x-1.66+stack*.52,1.18+layer*.065,cz],.065,.43,bread);box('butter pat',[x-1.66+stack*.52,1.36,cz],[.12,.035,.12],egg);}
    for(let i=0;i<3;i++){const bun=sphere('breakfast pastry',[x-.35+i*.35,1.23,cz-.16],[.28,.18,.4],bread);bun.rotation.y=.35;}
    for(let i=0;i<4;i++)sphere('fresh apple',[x-.35+i*.22,1.22,cz+.27],[.18,.19,.18],fruit);
    box('coffee machine',[x+2.45,1.47,cz-.08],[.78,.78,.65],dark);box('coffee steel face',[x+2.45,1.49,cz+.26],[.69,.6,.035],gold);
    box('coffee display',[x+2.45,1.67,cz+.29],[.34,.12,.02],glass);cylinder('coffee spout',[x+2.45,1.38,cz+.36],.13,.05,gold);
    box('coffee drip tray',[x+2.45,1.14,cz+.42],[.66,.06,.3],gold);
    for(let i=0;i<3;i++)cylinder('stacked coffee cups',[x+1.55,1.14+i*.1,cz+.18],.14,.18,white);
    cylinder('sugar jar',[x+1.1,1.23,cz-.15],.28,.22,white);cylinder('sugar lid',[x+1.1,1.39,cz-.15],.04,.24,gold);
    sign('BREAKFAST / EGGS + PANCAKES + PASTRIES',[x-.8,2.1,cz-.58],4.8,.42,Math.PI);
    sign('COFFEE',[x+2.45,2.1,cz-.58],1.25,.4,Math.PI);
   }
   if(p.kind==='mini-fridge'){
    const cz=z-.5;box('mini fridge',[x,.55,cz],[1.05,1.1,1.2],dark);box('fridge door',[x,.57,cz+.62],[.96,.98,.07],stone);
    box('fridge handle',[x+.35,.65,cz+.7],[.05,.46,.06],gold);box('fridge gasket',[x,1.08,cz+.66],[.96,.025,.02],dark);
    for(let i=0;i<5;i++)box('fridge ventilation slot',[x-.32+i*.16,.11,cz+.67],[.09,.035,.02],dark);
    sign('CHILLED / MILK + JUICE',[x,.85,cz+.67],.86,.2,Math.PI);box('fridge status light',[x-.34,.2,cz+.68],[.035,.035,.02],lampMat);
   }
   if(p.kind==='couch')couch(x,z);
   if(p.kind==='nightstand'){
    // Move the small bedside cabinet toward the bed with a matching small collision footprint.
    const bedX=R.world(map.rooms[p.room].bed[0]),nx=x+(bedX>x?1.05:-1.05);
    box('bedside cabinet',[nx,.35,z+.45],[.62,.7,.65],wood);box('cabinet top',[nx,.73,z+.45],[.68,.06,.7],stone);
    for(const y of [.22,.48]){box('bedside drawer',[nx,y,z+.11],[.55,.21,.025],dark);box('drawer pull',[nx,y,z+.08],[.16,.025,.035],gold);}
    cylinder('bedside lamp base',[nx,.8,z+.5],.09,.23,gold);cylinder('bedside lamp stem',[nx,.96,z+.5],.27,.025,gold);const shade=mat('bedside shade','#bcb4a4',.8);shade.emissiveColor=new B.Color3(.2,.14,.08);cylinder('bedside lamp shade',[nx,1.15,z+.5],.24,.3,shade);
    box('room phone',[nx+.17,.8,z+.23],[.19,.06,.19],dark);
   }
   if(p.kind==='room-desk'){
    box('writing desk',[x,.77,z-.28],[1.65,.1,.82],wood);for(const a of [-.7,.7])for(const b of [-.62,.04])box('desk leg',[x+a,.36,z+b],[.055,.72,.055],gold);
    box('desk drawer',[x+.47,.59,z-.28],[.54,.27,.7],dark);box('desk drawer handle',[x+.47,.59,z+.09],[.22,.035,.04],gold);
    box('hotel stationery',[x-.35,.84,z-.25],[.34,.015,.25],white);box('desk pen',[x-.12,.86,z-.2],[.015,.015,.2],gold);cylinder('desk mug',[x+.46,.91,z-.4],.2,.14,white);
    const cz=z+.77;box('desk chair seat',[x,.47,cz],[.55,.1,.52],cloth);box('desk chair back',[x,.85,cz+.24],[.55,.7,.07],wood);for(const a of [-.22,.22])for(const b of [-.2,.2])box('desk chair leg',[x+a,.22,cz+b],[.045,.44,.045],gold);
   }
   if(p.kind==='room-tv'){
    box('TV bracket',[x+.06,1.94,z],[.14,.35,.35],gold);box('flat screen TV',[x,1.94,z],[.11,.91,1.55],dark);
    sign('HOTEL TV / CHECKOUT 11:00',[x-.061,1.94,z],1.42,.78,Math.PI/2,'#83b9cb');
    cylinder('TV standby LED',[x-.07,1.53,z-.65],.025,.025,lampMat);
   }
   if(p.kind==='bed'){box('bed frame',[x,.25,z],[1.7,.4,2.15],wood);box('mattress',[x,.57,z],[1.65,.3,2.1],white);box('duvet',[x,.76,z-.25],[1.67,.12,1.5],cloth);box('headboard',[x,1.05,z+1.02],[1.8,1.5,.15],wood);for(const s of [-1,1])sphere('pillow',[x+s*.4,.82,z+.65],[.65,.17,.42],white);}
   if(p.kind==='desk'||p.kind==='bar'){box('counter',[x,p.kind==='desk'?.525:.65,z],[p.kind==='desk'?3.7:2.2,p.kind==='desk'?1.05:1.3,1.2],wood);box('countertop',[x,p.kind==='desk'?1.09:1.34,z],[p.kind==='desk'?3.9:2.4,.13,1.3],stone);for(const s of [-1,1])box('counter trim',[x+s*(p.kind==='desk'?1.7:1),p.kind==='desk'?.55:.68,z-.61],[.045,p.kind==='desk'?.85:1.1,.025],gold);if(p.kind==='bar'){for(let i=0;i<5;i++)bottle(x-.8+i*.38,1.42,z,i);}else{box('guest register',[x-.9,1.19,z],[.7,.06,.45],dark);box('register pages',[x-.9,1.23,z],[.65,.015,.4],white);cylinder('service bell',[x+.95,1.23,z-.1],.12,.2,gold);box('terminal',[x+.1,1.40,z+.1],[.5,.4,.08],dark);box('terminal screen',[x+.1,1.40,z+.05],[.43,.31,.01],glass);}sign(p.kind==='desk'?'CHECK IN · E':'BAR / NO TAB',[x,p.kind==='desk'?.77:1.05,z-.62],2,.35);}
   if(p.kind==='bath'){box('bath mat',[x,.012,z],[1.7,.025,2],stone);box('vanity',[x,.55,z+.65],[1.7,1.1,.65],wood);sphere('basin',[x,1.12,z+.65],[.7,.13,.4],white);cylinder('tap',[x,1.25,z+.85],.28,.06,gold);box('mirror frame',[x,1.95,z+1.05],[1.8,1.3,.08],gold);const mirrorMat=mat('mirror','#bcc6c9',.05,1),mirror=box('mirror',[x,1.95,z+1],[1.65,1.15,.015],mirrorMat,null,true);mirrors.push(mirror);}
   if(p.kind==='pool'||p.kind==='tub'){const pool=p.kind==='pool',w=pool?p.width:2.1,h=pool?p.depth:2.1;box('pool basin',[x,pool?-1.3:.04,z],[w,.12,h],stone);const waterMat=mat('water','#196b75',.12,.3);waterMat.alpha=.78;waterMat.emissiveColor=new B.Color3(.015,.11,.12);box('water',[x,.13,z],[w-.5,.04,h-.5],waterMat,null,true);for(const s of [-1,1]){box('pool rim',[x+s*w/2,.2,z],[.25,.3,h],white);box('pool rim',[x,.2,z+s*h/2],[w,.3,.25],white);}if(pool){for(let i=0;i<Math.floor(w/2.4);i++)box('pool lane',[x-w/2+1.2+i*2.4,-1.21,z],[.04,.01,h-.5],white);}}
   if(p.kind==='lounger'){const m=box('lounger',[x,.43,z],[.7,.12,1.7],white);m.rotation.x=-.14;for(const s of [-1,1])box('chair leg',[x+s*.28,.23,z],[.06,.4,1.3],gold);}
   if(p.mirrorZ)for(const mesh of scene.meshes.slice(meshStart))if(!mesh.parent)mesh.position.z=2*z-mesh.position.z;
  }
  if(map.dining){sign('NIGHT BITES / NOODLES + COFFEE',[57.6,2.45,13.15],5,.65);const light=new B.PointLight('food area practical',V(55.2,2.8,8),scene);light.diffuse=new B.Color3(1,.77,.53);light.intensity=2;light.range=16;box('food pendant',[55.2,3.1,8],[1.4,.16,.35],dark);box('food diffuser',[55.2,3,8],[1.3,.04,.25],white);}
  // Pleated curtains sway on contact; small objects can be knocked over.
  for(const zc of [8,14])for(const xc of [1,19]){const x=R.world(xc),z=R.world(zc),n=new B.TransformNode('curtain',scene);n.position=V(x,3.2,z);for(let i=0;i<9;i++){const m=box('pleated velvet',[0,-1.25,(i-4)*.17],[.13+Math.sin(i)*.04,2.5,.19],cloth,n,true);m.metadata={curtain:n};}curtains.push({node:n,sway:0});cylinder('curtain finial',[x,3.3,z],.12,.22,gold);}
  for(const [gx,gz] of map.refills){const x=R.world(gx),z=R.world(gz);const n=new B.TransformNode('refill',scene);n.position=V(x,0,z);cylinder('foam tank',[0,.65,0],1.25,.55,white,n,true);box('refill case',[0,.35,.2],[.9,.7,.6],dark,n,true);sign('E · FREE FOAM',[x,1.6,z-.35],1.9,.45);refills.push({x,z});}
  for(const [text,x,z] of map.roomLabels)sign(text,[R.world(x),3.1,R.world(z)],3,.45);
  // Original botanical paintings share one atlas and real wood frames across the hotel.
  const frameWood=mat('walnut picture frames','#82512f',.78),frameEdge=mat('dark walnut inset','#42291c',.86);
  {const t=new B.DynamicTexture('walnut grain',128,scene,false),g=t.getContext();g.fillStyle='#986640';g.fillRect(0,0,128,128);for(let i=0;i<100;i++){g.strokeStyle=i%3?'#3c211731':'#d6a06e45';g.lineWidth=1;g.beginPath();for(let y=0;y<=128;y+=8)g.lineTo((i*19)%128+Math.sin(y*.05+i)*2,y);g.stroke();}t.update();frameWood.albedoTexture=t;frameWood.albedoColor=B.Color3.White();}
  const artworkMaterials=Array.from({length:4},(_,i)=>{const m=mat('botanical oil painting '+i,'#ffffff',1),t=new B.Texture('assets/art/flowers-and-bees-atlas.png',scene);t.uScale=t.vScale=.498;t.uOffset=(i%2)*.5+.001;t.vOffset=(i<2?.5:0)+.001;t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;m.albedoTexture=t;m.emissiveTexture=t;m.emissiveColor=new B.Color3(.08,.08,.08);return m;});
  const artworkMeshes=[];
  for(const art of map.artworks){const w=1.32,h=1.32,y=2.18,angle=art.rotation,right=V(Math.cos(angle),0,-Math.sin(angle)),normal=V(-Math.sin(angle),0,-Math.cos(angle));
   const pos=(u,v,depth)=>[art.x+right.x*u+normal.x*depth,y+v,art.z+right.z*u+normal.z*depth];
   function piece(name,u,v,depth,size,material){const mesh=box(name,pos(u,v,depth),size,material);mesh.rotation.y=angle;return mesh;}
   piece('painting backing',0,0,-.035,[w+.2,h+.2,.06],frameEdge);
   const canvas=B.MeshBuilder.CreatePlane('flowers and bees '+art.zone,{width:w,height:h},scene);finish(canvas,artworkMaterials[art.variant],pos(0,0,.006),null,true);canvas.rotation.y=angle;canvas.metadata={artwork:art.variant,zone:art.zone,room:art.room};artworkMeshes.push(canvas);
   for(const side of [-1,1]){piece('wood frame side',side*(w/2+.065),0,.025,[.13,h+.26,.12],frameWood);piece('wood frame rail',0,side*(h/2+.065),.025,[w,.13,.12],frameWood);piece('wood inset bevel',side*(w/2+.012),0,.018,[.025,h,.05],frameEdge);piece('wood inset bevel',0,side*(h/2+.012),.018,[w,.025,.05],frameEdge);}
  }
  for(const [gx,gz] of [[8,5],[12,15],[16,4]])if(!R.blocked(map,gx,gz)){const x=R.world(gx),z=R.world(gz);cylinder('side table stem',[x,.4,z],.8,.09,gold);cylinder('side table',[x,.8,z],.08,.6,wood);cylinder('table lamp base',[x,.9,z],.15,.13,gold);cylinder('table lamp shade',[x,1.2,z],.28,.35,lampMat);for(let j=0;j<3;j++)box('magazine',[x+.12,.87+j*.02,z+.08],[.18,.02,.24],j%2?cloth:white);}
  for(const stair of map.stairways){const sx=R.world(stair.up[0]),sz=R.world(stair.up[1]);
  sign('STAIRS / '+(map.index===4?'TOP FLOOR':'FLOOR '+(map.index+2)),[sx,3.3,sz+.8],3,.5);
  for(let i=0;i<8;i++)box('stair tread',[sx,.07+i*.07,sz-2+i*.3],[2.2,.14+i*.14,.3],stone);
  for(const side of [-1,1]){for(let i=0;i<4;i++)cylinder('banister',[sx+side*1.03,.7+i*.2,sz-2+i*.6],1,.04,gold);const rail=box('stair handrail',[sx+side*1.03,1.5,sz-1],[.06,.06,2.8],gold);rail.rotation.x=-.35;}
  if(map.index>0)sign('STAIRS DOWN / FLOOR '+map.index,[R.world(stair.down[0]),2.5,R.world(stair.down[1])-.9],3,.5,Math.PI);
  }
  const sx=R.world(map.stairs[0]),sz=R.world(map.stairs[1]);
  for(const exit of map.exits){const x=R.world(exit.point[0]),z=R.world(exit.point[1]),side=exit.point[0]===30,front=exit.point[1]===0;sign(exit.label,[x-(side?1.25:0),3.1,z+(side?0:front?1.25:-1.25)],side?3.2:3.8,.45,side?Math.PI/2:front?Math.PI:0,'#9ce5aa');}
  sign('HOTEL // LIABILITY',[R.world(10),3.1,.95],6,.6,Math.PI);
  sign('POOL / STAIRS',[R.world(15),2.8,R.world(24)-.2],2,.4);
  sign('POOL / SPA',[R.world(15),2.8,R.world(26)-.2],2,.4);
  // A visible ladder marks the only swimmers' exit; swimmers climb before pursuing.
  const ex=R.world(map.pool.edge[0])-.95,ez=R.world(map.pool.edge[1]);
  for(const side of [-1,1])cylinder('pool ladder rail',[ex,.2,ez+side*.4],1.5,.065,gold);
  for(let i=0;i<5;i++){const rung=cylinder('pool ladder rung',[ex,-.8+i*.3,ez],.8,.055,gold);rung.rotation.x=Math.PI/2;}
  for(const room of map.rooms){const meshStart=scene.meshes.length,x=R.world(room.bath[0]),z=R.world(room.bath[1]);box('shower tray',[x-.65,.04,z-.5],[.9,.08,1],white);cylinder('shower riser',[x-.9,1.3,z-.8],2.2,.04,gold);sphere('toilet bowl',[x+.55,.36,z-.5],[.5,.55,.75],white);box('toilet cistern',[x+.55,.65,z-.85],[.52,.65,.22],white);if(room.facing<0)for(const mesh of scene.meshes.slice(meshStart))mesh.position.z=2*z-mesh.position.z;}
  if(map.index===4)sign('PENTHOUSE / NO REFUNDS',[sx,2.9,sz+.65],3,.55);
  // Merge static architecture by material; interactive/hit-tested parts stay separate.
  for(const material of new Set(statics.map(m=>m.material))){const list=statics.filter(m=>m.material===material);if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,true);if(merged){merged.name='hotel '+material.name;merged.receiveShadows=true;}}}
  if(settings.shadows&&mirrors.length){const m=mirrors[0],tex=new B.MirrorTexture('bathroom reflection',256,scene,true);tex.mirrorPlane=new B.Plane(0,0,1,-m.position.z);tex.level=.45;tex.renderList=scene.meshes.filter(x=>!mirrors.includes(x));m.material.reflectionTexture=tex;tex.refreshRate=2;}
  const glow=new B.GlowLayer('neon spill',scene,{blurKernelSize:32});glow.intensity=.65;const clouds=scene.getMeshByName('hotel daytime clouds');if(clouds){glow.addExcludedMesh(clouds);clouds.isPickable=false;}
  scene.imageProcessingConfiguration.contrast=1.12;scene.imageProcessingConfiguration.exposure=1.2;
  const windows=HotelWindows.build(scene,camera,map);
  const characters=HotelCharacters.prepare(scene,shadow);
  const person=characters.person;
  function weapon(){const n=new B.TransformNode('foam blaster',scene);n.parent=camera;n.position=V(0,-.21,.28);n.scaling=V(.62,.72,.72);const tan=mat('blaster tan','#b89a72',.65,.04);const barrel=cylinder('foam pressure barrel',[0,0,.1],.47,.17,tan,n,true);barrel.rotation.x=Math.PI/2;const nozzle=cylinder('tan nozzle',[0,0,.37],.1,.1,tan,n,true);nozzle.rotation.x=Math.PI/2;box('tan grip',[0,-.12,-.07],[.12,.24,.13],tan,n,true);for(const m of n.getChildMeshes()){m.isPickable=false;m.renderingGroupId=1;}return n;}
  const policeTracer=mat('police tracer','#ffca66',.5);policeTracer.emissiveColor=new B.Color3(1,.65,.2);
  function officer(id){
   const node=new B.TransformNode('police officer '+id,scene),uniform=mat('police navy','#182737',.9),armor=mat('police armor','#303b43',.72),skin=mat('officer skin','#a37e60',.9),visor=mat('police visor','#536b78',.3,.3);
   const torso=sphere('uniform torso',[0,1.23,0],[.52,.65,.32],uniform,node,true);box('ballistic vest',[0,1.24,.13],[.46,.5,.12],armor,node,true);box('duty belt',[0,.91,0],[.46,.08,.34],dark,node,true);
   sphere('officer head',[0,1.72,0],[.28,.34,.28],skin,node,true);sphere('police helmet',[0,1.83,-.01],[.34,.25,.34],armor,node,true);box('helmet visor',[0,1.74,.16],[.29,.13,.035],visor,node,true);
   const legs=[];for(const side of [-1,1]){const leg=new B.TransformNode('uniform leg',scene);leg.parent=node;leg.position.set(side*.14,.85,0);cylinder('trouser leg',[0,-.3,0],.64,.19,uniform,leg,true);box('police boot',[0,-.76,.06],[.21,.18,.35],dark,leg,true);legs.push(leg);const arm=cylinder('uniform sleeve',[side*.27,1.23,.16],.48,.17,uniform,node,true);arm.rotation.x=-.8;sphere('gloved hand',[side*.19,1.15,.36],[.14,.15,.18],dark,node,true);}
   box('police weapon',[.13,1.18,.48],[.12,.16,.56],dark,node,true);const barrel=cylinder('rifle barrel',[.13,1.2,.83],.26,.055,armor,node,true);barrel.rotation.x=Math.PI/2;
   const flash=sphere('police muzzle flash',[.13,1.2,1],[.16,.13,.25],policeTracer,node,true);flash.isPickable=false;
   const badge=box('police chest badge',[-.13,1.4,.21],[.07,.09,.02],gold,node,true);
   const label=sign('POLICE',[0,1.29,.202],.34,.1,Math.PI,'#dce5ec');label.parent=node;
   for(const mesh of node.getChildMeshes())shadow?.addShadowCaster(mesh);
   return {node,animate(time,firing){legs[0].rotation.x=Math.sin(time)*.38;legs[1].rotation.x=-Math.sin(time)*.38;torso.rotation.z=Math.sin(time)*.015;flash.setEnabled(firing);}};
  }
  return {scene,camera,shadow,windows,artworkMeshes,person,officer,policeTracer,weapon,ready:characters.ready,readyState:false,doors,objects,curtains,refills,sign,ground,update(dt){windows.update(dt);for(const d of doors){d.angle+=(Number(d.data.open)*1.5-d.angle)*Math.min(1,dt*7);d.hinge.rotation.y=d.base+d.angle;d.mesh.isPickable=!d.data.open;}for(const o of objects)if(o.fall){o.fall=Math.min(1.7,o.fall+dt*4);o.node.rotation.z=o.fall;o.node.position.y=o.base-.08*Math.sin(o.fall);}for(const c of curtains){c.sway=Math.max(0,c.sway-dt);c.node.rotation.x=Math.sin(performance.now()*.016)*c.sway*.14;}}};
 }
 root.HotelScene={build};
})(globalThis);
