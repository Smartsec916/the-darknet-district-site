/* Camera-mounted Babylon cockpit. Geometry and instrument textures live only
   for the active space scene; the canvas fallback keeps its existing frame. */
(function(root){
 function build(scene,camera,cipher=false){
  const B=root.BABYLON,owned=[],textures=[];
  const frame=new B.TransformNode(cipher?'cipher-cockpit':'pilot-cockpit',scene);
  function metal(name,hex,glow=false){const m=new B.StandardMaterial('cockpit-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.32,.36,.39);m.specularPower=cipher?58:36;m.ambientColor=m.diffuseColor.scale(.35);if(glow)m.emissiveColor=m.diffuseColor.scale(.7);owned.push(m);return m;}
  const shell=metal('worn-shell',cipher?'#242e33':'#252d31'),edge=metal('dark-iron','#121a1f'),trim=metal('scratched-alloy',cipher?'#45585c':'#4a5658'),orange=metal('amber-marking','#bd783b',true),cyan=metal('cyan-marking','#5cc9c5',true),rubber=metal('grip','#161a1c');
  function box(name,size,pos,mat){const mesh=B.MeshBuilder.CreateBox('cockpit-'+name,{width:size[0],height:size[1],depth:size[2]},scene);mesh.parent=frame;mesh.position.set(...pos);mesh.material=mat;mesh.isPickable=false;mesh.renderingGroupId=2;return mesh;}
  function brace(name,a,b,width,mat=trim){const start=B.Vector3.FromArray(a),end=B.Vector3.FromArray(b),delta=end.subtract(start);const mesh=box(name,[width,width,delta.length()],start.add(end).scale(.5).asArray(),mat);mesh.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Z,delta.normalize(),new B.Quaternion());return mesh;}
  function rounded(name,[width,height,depth],position,material){
   if(!cipher)return box(name,[width,height,depth],position,material);
   const mesh=B.MeshBuilder.CreateCapsule('cipher-'+name,{height:1,diameter:.56,tessellation:18,subdivisions:2,capSubdivisions:5},scene);
   mesh.parent=frame;
   mesh.position.set(...position);
   mesh.rotation.z=Math.PI/2;
   mesh.scaling.set(height/.56,width,depth/.56);
   mesh.material=material;mesh.isPickable=false;mesh.renderingGroupId=2;
   return mesh;
  }
  function rib(name,points,radius,material){
   const path=B.Curve3.CreateCatmullRomSpline(points.map(p=>B.Vector3.FromArray(p)),7).getPoints();
   const mesh=B.MeshBuilder.CreateTube('cipher-'+name,{path,radius,tessellation:10,cap:B.Mesh.CAP_ALL},scene);
   mesh.parent=frame;mesh.material=material;mesh.isPickable=false;mesh.renderingGroupId=2;
  }
  // Leave the central upper aperture clear for targets and route markers.
  for(const side of [-1,1]){
   if(cipher){
    rounded('side-bolster',[.26,.56,1.04],[side*1.02,-.82,1.08],shell);
    rib('canopy-rib',[[side*.97,-.65,1.25],[side*.92,-.13,1.43],[side*.85,.41,1.58],[side*.74,.78,1.67],[side*.61,.91,1.64]],.033,trim);
   }else{
    box('side-wall',[.3,1.55,1.4],[side*1.13,-.17,1.05],shell);
    brace('window-post',[side*.88,-.78,1.1],[side*.76,.75,1.35],.12,trim);
    brace('outer-window',[side*.76,.75,1.35],[side*1.05,.95,1.25],.09,shell);
   }
   rounded('side-console',[.46,.17,.85],[side*.67,-.78,1.12],shell);
   rounded('console-inlay',[.43,.025,.71],[side*.67,-.665,1.13],edge);
   if(cipher){brace('console-rail',[side*.90,-.67,.73],[side*.96,-.59,1.48],.028,trim);box('status-strip',[.035,.022,.38],[side*.82,-.645,1.13],cyan);}
   for(let i=0;i<(cipher?3:5);i++)box('switch',[.045,.025,.085],[side*(.47+i*.08),-.64,.91],i===0?orange:trim);
   const stick=box('flight-stick',[.055,.4,.055],[side*.47,-.76,.78],edge);stick.rotation.x=-.3;
   box('stick-grip',[.13,.18,.12],[side*.47,-.55,.73],rubber);
   box('side-warning',[.19,.026,.035],[side*.72,-.64,1.41],orange);
  }
  if(cipher){
   rib('canopy-header',[[-.66,.88,1.64],[-.32,.98,1.60],[0,1.01,1.58],[.32,.98,1.60],[.66,.88,1.64]],.035,shell);
   rounded('dashboard',[1.80,.34,.54],[0,-.73,1.46],shell);
   rounded('instrument-brow',[1.63,.09,.34],[0,-.43,1.36],edge);
   rib('dashboard-inlay',[[-.77,-.50,1.22],[-.38,-.461,1.185],[0,-.45,1.17],[.38,-.461,1.185],[.77,-.50,1.22]],.008,cyan);
   rounded('center-pedestal',[.40,.45,.70],[0,-.94,.99],edge);
  }else{
   brace('windshield-header',[-1.05,.95,1.25],[1.05,.95,1.25],.12,shell);
   brace('dash-crossmember',[-.85,-.73,1.38],[.85,-.73,1.38],.08,trim);
   box('dashboard',[1.78,.34,.68],[0,-.88,1.42],shell);
   box('instrument-brow',[1.55,.08,.25],[0,-.37,1.37],edge);
   box('center-pedestal',[.46,.55,.86],[0,-1.0,.94],edge);
  }
  for(const x of [-.67,.67])for(const z of [.87,1.3])box('fastener',[.045,.025,.045],[x,-.58,z],trim);
  for(let i=0;i<4;i++)box('pedestal-key',[.06,.03,.1],[-.17+i*.11,-.69,.63],i===0?cyan:trim);
  const panels=[{name:'ship',x:-.52},{name:'nav',x:0},{name:'weapons',x:.52}].map(({name,x})=>{
   const bezel=rounded(name+'-bezel',[cipher?.46:.46,cipher?.27:.27,.055],[x,cipher?-.552:-.515,1.125],cipher?edge:trim);
   if(cipher)bezel.rotation.y=-x*.38;
   const texture=new B.DynamicTexture('cockpit-'+name+'-data',{width:256,height:128},scene,false);textures.push(texture);
   const material=new B.StandardMaterial('cockpit-'+name+'-screen',scene);material.diffuseTexture=texture;material.emissiveTexture=texture;material.disableLighting=true;material.backFaceCulling=false;owned.push(material);
   const screen=B.MeshBuilder.CreatePlane('cockpit-'+name+'-screen',{width:cipher?.38:.41,height:cipher?.19:.22,sideOrientation:B.Mesh.DOUBLESIDE},scene);screen.parent=frame;screen.position.set(x,cipher?-.55:-.515,1.08);if(cipher)screen.rotation.y=-x*.38;screen.material=material;screen.isPickable=false;screen.renderingGroupId=2;
   return {name,texture};
  });
  let lastUpdate=-Infinity;
  function update(data={},time=0){if(time-lastUpdate<.1)return;lastUpdate=time;
   const line=(g,y,label,value,color='#89ddd7')=>{g.fillStyle=cipher?'#b8c9cd':'#8b9ca1';g.font='15px monospace';g.fillText(label,11,y);g.fillStyle=color;g.textAlign='right';g.fillText(String(value),245,y);g.textAlign='left';};
   for(const panel of panels){const g=panel.texture.getContext();g.fillStyle='#06121a';g.fillRect(0,0,256,128);g.strokeStyle='#354b52';g.strokeRect(2,2,252,124);g.fillStyle='#e2aa67';g.font='bold 17px monospace';g.fillText(panel.name.toUpperCase(),11,22);
    if(panel.name==='ship'){line(g,51,'HULL',Math.round(data.hull||0)+'%');line(g,77,'SHIELD',Math.round(data.shield||0)+'%');line(g,103,'HEAT',Math.round(data.heat||0)+'%','#e2aa67');}
    if(panel.name==='nav'){line(g,51,'SPEED',Math.round(data.speed||0));line(g,77,'THR',Math.round((data.throttle||0)*100)+'%');line(g,103,'ROUTE',(data.route||'LOCAL').slice(0,11),'#e2aa67');}
    if(panel.name==='weapons'){line(g,51,'POWER',Math.round(data.power||0)+'%');line(g,77,'MISSILES',data.missiles??0);line(g,103,'TARGET',(data.target||'NONE').slice(0,11),'#e2aa67');}
    panel.texture.update();
   }
  }
  update({},0);
  return {cipher,root:frame,update,sync(){frame.position.copyFrom(camera.position);frame.rotation.copyFrom(camera.rotation);},setEnabled(value){frame.setEnabled(value);},dispose(){frame.dispose(false,false);for(const m of owned)m.dispose(false,false);for(const t of textures)t.dispose();}};
 }
 root.VoidCockpit3D={build};
})(globalThis);
