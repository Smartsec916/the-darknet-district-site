/* Camera-mounted Babylon cockpit. Geometry and instrument textures live only
   for the active space scene; the canvas fallback keeps its existing frame. */
(function(root){
 function build(scene,camera){
  const B=root.BABYLON,owned=[],textures=[];
  const frame=new B.TransformNode('pilot-cockpit',scene);
  function metal(name,hex,glow=false){const m=new B.StandardMaterial('cockpit-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.32,.36,.39);m.specularPower=36;m.ambientColor=m.diffuseColor.scale(.35);if(glow)m.emissiveColor=m.diffuseColor.scale(.7);owned.push(m);return m;}
  const shell=metal('worn-shell','#252d31'),edge=metal('dark-iron','#121a1f'),trim=metal('scratched-alloy','#4a5658'),orange=metal('amber-marking','#bd783b',true),cyan=metal('cyan-marking','#5cc9c5',true),rubber=metal('grip','#161a1c');
  function box(name,size,pos,mat){const mesh=B.MeshBuilder.CreateBox('cockpit-'+name,{width:size[0],height:size[1],depth:size[2]},scene);mesh.parent=frame;mesh.position.set(...pos);mesh.material=mat;mesh.isPickable=false;mesh.renderingGroupId=2;return mesh;}
  function brace(name,a,b,width,mat=trim){const start=B.Vector3.FromArray(a),end=B.Vector3.FromArray(b),delta=end.subtract(start);const mesh=box(name,[width,width,delta.length()],start.add(end).scale(.5).asArray(),mat);mesh.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Z,delta.normalize(),new B.Quaternion());return mesh;}
  // Leave the central upper aperture clear for targets and route markers.
  for(const side of [-1,1]){
   box('side-wall',[.3,1.55,1.4],[side*1.13,-.17,1.05],shell);
   brace('window-post',[side*.88,-.78,1.1],[side*.76,.75,1.35],.12,trim);
   brace('outer-window',[side*.76,.75,1.35],[side*1.05,.95,1.25],.09,shell);
   box('side-console',[.49,.2,.85],[side*.67,-.78,1.12],shell);
   box('console-inlay',[.43,.025,.71],[side*.67,-.665,1.13],edge);
   for(let i=0;i<5;i++)box('switch',[.045,.025,.085],[side*(.47+i*.08),-.64,.91],i===0?orange:trim);
   const stick=box('flight-stick',[.055,.4,.055],[side*.47,-.76,.78],edge);stick.rotation.x=-.3;
   box('stick-grip',[.13,.18,.12],[side*.47,-.55,.73],rubber);
   box('side-warning',[.19,.026,.035],[side*.72,-.64,1.41],orange);
  }
  brace('windshield-header',[-1.05,.95,1.25],[1.05,.95,1.25],.12,shell);
  brace('dash-crossmember',[-.85,-.73,1.38],[.85,-.73,1.38],.08,trim);
  box('dashboard',[1.78,.34,.68],[0,-.88,1.42],shell);
  box('instrument-brow',[1.55,.08,.25],[0,-.37,1.37],edge);
  box('center-pedestal',[.46,.55,.86],[0,-1.0,.94],edge);
  for(const x of [-.67,.67])for(const z of [.87,1.3])box('fastener',[.045,.025,.045],[x,-.58,z],trim);
  for(let i=0;i<4;i++)box('pedestal-key',[.06,.03,.1],[-.17+i*.11,-.69,.63],i===0?cyan:trim);
  const panels=[{name:'ship',x:-.52},{name:'nav',x:0},{name:'weapons',x:.52}].map(({name,x})=>{
   box(name+'-bezel',[.46,.27,.045],[x,-.515,1.115],trim);
   const texture=new B.DynamicTexture('cockpit-'+name+'-data',{width:256,height:128},scene,false);textures.push(texture);
   const material=new B.StandardMaterial('cockpit-'+name+'-screen',scene);material.diffuseTexture=texture;material.emissiveTexture=texture;material.disableLighting=true;material.backFaceCulling=false;owned.push(material);
   const screen=B.MeshBuilder.CreatePlane('cockpit-'+name+'-screen',{width:.41,height:.22,sideOrientation:B.Mesh.DOUBLESIDE},scene);screen.parent=frame;screen.position.set(x,-.515,1.08);screen.material=material;screen.isPickable=false;screen.renderingGroupId=2;
   return {name,texture};
  });
  let lastUpdate=-Infinity;
  function update(data={},time=0){if(time-lastUpdate<.1)return;lastUpdate=time;
   const line=(g,y,label,value,color='#89ddd7')=>{g.fillStyle='#8b9ca1';g.font='15px monospace';g.fillText(label,11,y);g.fillStyle=color;g.textAlign='right';g.fillText(String(value),245,y);g.textAlign='left';};
   for(const panel of panels){const g=panel.texture.getContext();g.fillStyle='#06121a';g.fillRect(0,0,256,128);g.strokeStyle='#354b52';g.strokeRect(2,2,252,124);g.fillStyle='#e2aa67';g.font='bold 17px monospace';g.fillText(panel.name.toUpperCase(),11,22);
    if(panel.name==='ship'){line(g,51,'HULL',Math.round(data.hull||0)+'%');line(g,77,'SHIELD',Math.round(data.shield||0)+'%');line(g,103,'HEAT',Math.round(data.heat||0)+'%','#e2aa67');}
    if(panel.name==='nav'){line(g,51,'SPEED',Math.round(data.speed||0));line(g,77,'THR',Math.round((data.throttle||0)*100)+'%');line(g,103,'ROUTE',(data.route||'LOCAL').slice(0,11),'#e2aa67');}
    if(panel.name==='weapons'){line(g,51,'POWER',Math.round(data.power||0)+'%');line(g,77,'MISSILES',data.missiles??0);line(g,103,'TARGET',(data.target||'NONE').slice(0,11),'#e2aa67');}
    panel.texture.update();
   }
  }
  update({},0);
  return {root:frame,update,sync(){frame.position.copyFrom(camera.position);frame.rotation.copyFrom(camera.rotation);},setEnabled(value){frame.setEnabled(value);},dispose(){frame.dispose(false,false);for(const m of owned)m.dispose(false,false);for(const t of textures)t.dispose();}};
 }
 root.VoidCockpit3D={build};
})(globalThis);
