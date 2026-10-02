/* One authored station. Scene construction is presentation; the layout and encounter data are reusable. */
(function(root){
  const base=new URL('.',document.currentScript.src);
  const solids=[];
  const cover=(id,x,z,w=2,d=1.4,h=1.5)=>solids.push({id,position:[x,h/2,z],size:[w,h,d],cover:true});
  // Walls have actual openings. These same footprints drive walking and combat line of sight.
  function wall(id,x,z,w,d,h=8){solids.push({id,position:[x,h/2,z],size:[w,h,d]});}
  for(const [z,w] of [[-77,35],[-27,35],[4,20],[38,22],[72,22],[103,22]]){
    if(z===-77||z===103)wall('bulkhead-'+z,0,z,w,.7);
    else {wall('bulkhead-'+z+'-l',-(w+4)/4,z,(w-4)/2,.7);wall('bulkhead-'+z+'-r',(w+4)/4,z,(w-4)/2,.7);}
  }
  for(const side of [-1,1]){
    for(const [x,a,b] of [[18,-77,-27],[10,-27,4],[11,4,15],[11,23,38],[11,38,49],[11,59,72],[11,72,103],[37,5,28],[37,34,56],[37,63,72]])wall('side-'+side*x+'-'+a,side*x,(a+b)/2,.65,b-a);
  }
  // Side rooms and service routes deliberately reconnect through several open portals.
  for(const [x,z,w,d] of [[-24,6,26,.6],[-24,37,26,.6],[-24,70,26,.6],[24,6,26,.6],[24,37,26,.6],[24,70,26,.6]]){
    wall('wing-'+x+'-'+z+'-a',x-8,z,9,d);wall('wing-'+x+'-'+z+'-b',x+8,z,9,d);
  }
  for(const [id,x,z,w,d,h] of [
    ['hangar-freight-l',-8,-51,3,2,1.6],['hangar-freight-r',8,-46,4,2,1.45],['hangar-loader',-13,-37,2.5,3,2],['hangar-spares',12,-65,2.8,2,1.2],
    ['customs-left',-6,-13,2.4,1.5,1.45],['customs-right',6,-9,2.4,1.5,1.45],['concourse-kiosk',0,19,3.2,2.2,1.7],
    ['bar-counter',-23,22,7,1.3,1.45],['store-counter',23,22,7,1.3,1.45],['hab-barricade',-21,52,4,1.2,1.35],
    ['engineering-core',22,55,5,4,2.5],['stronghold-cover-l',-6,84,3,2,1.5],['stronghold-cover-r',6,89,3,2,1.5],
    ['maintenance-cache-l',-32,48,2,2,1.3],['maintenance-cache-r',32,51,2,2,1.3]
  ])cover(id,x,z,w,d,h);
  solids.push({id:'customs-xray',position:[0,2.2,-13],size:[5,4.3,2]});
  const zones=[
    {id:'hangar',name:'HANGAR',z:-52,color:'#d69b60',enemies:[[-10,-38],[8,-33],[14,-52],[15,-47,4.5],[-15,-54,4.5]]},
    {id:'customs',name:'SECURITY / CUSTOMS',z:-13,color:'#83b6bb',enemies:[[-5,-10],[5,-6]]},
    {id:'concourse',name:'CENTRAL CONCOURSE',z:20,color:'#d7aa67',enemies:[[-4,24],[6,29],[0,34]]},
    {id:'bar',name:'BAR / STORE',z:30,color:'#b56765',enemies:[[-22,26],[22,27]]},
    {id:'habitation',name:'HABITATION',z:55,color:'#9aa7a3',enemies:[[-22,55],[-29,61]]},
    {id:'engineering',name:'ENGINEERING',z:58,color:'#d87859',enemies:[[20,60],[30,64]]},
    {id:'stronghold',name:'GANG STRONGHOLD',z:89,color:'#b95359',enemies:[[-5,88],[5,92],[0,98]]}
  ];
  const layout={id:'derelict-station',name:'Derelict Space Station',kind:'derelict',music:'combat',bounds:[38,104],spawn:[0,1.68,-71],yaw:0,solids,interactions:[],signs:[],zones};
  function build({scene,parent,quality,shipModel}){
    const B=root.BABYLON, mat={}, staticByMaterial=new Map(), dynamic=[];
    scene.clearColor=new B.Color4(.012,.018,.027,1);
    scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.006;scene.fogColor=new B.Color3(.045,.065,.075);
    const sun=scene.getLightByName('sun');if(sun)sun.intensity=.38;
    const ambient=scene.getLightByName('ambient');if(ambient)ambient.intensity=.72;
    const tint={hull:'#e5dbcc',deck:'#969da0',machinery:'#b6a188',gang:'#a99491'};
    function material(key,hex,emission){if(mat[key])return mat[key];const m=new B.PBRMaterial('derelict-'+key,scene);m.albedoColor=B.Color3.FromHexString(hex||'#ffffff');m.metallic=key==='glass'? .2:.58;m.roughness=key==='glass'?.23:.83;m.environmentIntensity=.35;if(['hull','deck','machinery','gang'].includes(key)){const t=new B.Texture(new URL('art/derelict-'+key+'.webp',base).href,scene),normal=new B.Texture(new URL('art/derelict-'+key+'-normal.webp',base).href,scene);t.wrapU=t.wrapV=normal.wrapU=normal.wrapV=B.Texture.WRAP_ADDRESSMODE;t.uScale=t.vScale=normal.uScale=normal.vScale=2.2;normal.level=.38;m.albedoTexture=t;m.bumpTexture=normal;m.albedoColor=B.Color3.FromHexString(tint[key]);}if(emission)m.emissiveColor=B.Color3.FromHexString(emission);mat[key]=m;return m;}
    material('hull');material('deck');material('machinery');material('gang');
    material('frame','#242e35');material('trim','#8d7152');material('dark','#101a20');material('glass','#51798c');
    material('warm','#bca277','#e7a854');material('cold','#8ebcca','#6ac5ea');material('red','#7b3336','#dc333d');
    function box(name,pos,size,key,angle=0,merge=true){const m=B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);m.position.set(...pos);m.rotation.y=angle;m.material=mat[key];m.parent=parent;m.isPickable=false;if(merge){if(!staticByMaterial.has(key))staticByMaterial.set(key,[]);staticByMaterial.get(key).push(m);}else dynamic.push(m);return m;}
    function cyl(name,pos,r,h,key,segments=12,rot=0){const m=B.MeshBuilder.CreateCylinder(name,{diameter:r*2,height:h,tessellation:segments},scene);m.position.set(...pos);m.rotation.z=rot;m.material=mat[key];m.parent=parent;m.isPickable=false;dynamic.push(m);return m;}
    function beam(name,a,c,width,key){const start=B.Vector3.FromArray(a),end=B.Vector3.FromArray(c),mid=start.add(end).scale(.5),m=box(name,mid.asArray(),[width,width,B.Vector3.Distance(start,end)],key);m.lookAt(end);return m;}
    function placard(text,pos,w=3.8){const t=new B.DynamicTexture('derelict-sign-'+text,{width:512,height:128},scene,false),g=t.getContext();g.fillStyle='#101d23';g.fillRect(0,0,512,128);g.strokeStyle='#af8b62';g.lineWidth=7;g.strokeRect(5,5,502,118);g.fillStyle='#d2c8af';g.font='bold 34px monospace';g.textAlign='center';g.fillText(text,256,77);t.update();const m=new B.StandardMaterial('derelict-sign-material-'+text,scene);m.diffuseTexture=t;m.emissiveColor=new B.Color3(.22,.18,.12);const plane=B.MeshBuilder.CreatePlane('wayfinding-'+text,{width:w,height:.93,sideOrientation:B.Mesh.DOUBLESIDE},scene);plane.parent=parent;plane.position.set(...pos);plane.material=m;dynamic.push(plane,m,t);}
    function lamp(x,y,z,color='warm'){box('recessed-industrial-luminaire',[x,y,z],[2.5,.12,.28],color);box('lamp-housing',[x,y+.10,z],[2.7,.18,.4],'frame');}
    function section(id,x,z,w,d,h,kind,openFront=true,openBack=true){
      const floor=kind==='stronghold'?'gang':'deck',walls=kind==='service'?'machinery':kind==='retail'?'gang':'hull';
      box(id+'-deck',[x,-.21,z],[w,.4,d],floor);box(id+'-ceiling',[x,h+.18,z],[w,.34,d],'hull');
      for(const side of [-1,1]){
        const px=x+side*w/2;
        const portal=([11,26,37].includes(Math.round(Math.abs(px)))&&z>0&&z<75);
        if(portal){for(const [a,b] of [[-d/2,-4],[4,d/2]])if(b>a)box(id+'-wall',[px,h/2,z+(a+b)/2],[.55,h,b-a],walls);box(id+'-side-door-header',[px,h-.7,z],[.8,1.4,8],'frame');}
        else box(id+'-wall',[px,h/2,z],[.55,h,d],walls);
        if(!portal)box(id+'-lower-scuff',[px-side*.31,.55,z],[.05,1,d],'gang');
        for(let q=-d/2+3;q<d/2;q+=5){const zz=z+q;
          box(id+'-rib',[px-side*.35,h/2,zz],[.45,h,.38],'frame');
          box(id+'-wall-rail',[px-side*.35,2.35,zz+1.5],[.15,.1,2.4],'trim');
          box(id+'-service-box',[px-side*.4,1.45,zz+1],[.3,.75,.8],q%2?'machinery':'frame');
          box(id+'-conduit',[px-side*.48,h-1.3,zz+1],[.15,.14,3.1],'machinery');
        }
      }
      for(const [end,open] of [[-1,openFront],[1,openBack]]){
        const ez=z+end*d/2;
        if(open){const aperture=id==='hangar'&&end<0?22:4;for(const side of [-1,1])box(id+'-portal-cheek',[x+side*(w+aperture)/4,h/2,ez],[(w-aperture)/2,h,.65],walls);box(id+'-portal-header',[x,h-.65,ez],[aperture,1.3,.9],'frame');}
        else box(id+'-end-wall',[x,h/2,ez],[w,h,.65],walls);
      }
      for(let q=-d/2+3;q<d/2;q+=5){const zz=z+q;
        box(id+'-roof-truss',[x,h-.25,zz],[w,.4,.55],'frame');
        box(id+'-drain',[x,-.005,zz],[w-.8,.04,.12],'dark');
        for(let t=-w/2+2;t<w/2;t+=4)box(id+'-ceiling-tile',[x+t,h-.07,zz+1.5],[3.7,.04,2.5],'machinery');
        if(Math.round(q)%2===0)lamp(x,h-.37,zz);
      }
    }
    section('hangar',0,-52,36,50,11,'hangar',true,true);
    section('customs',0,-11,20,30,7,'customs');
    section('concourse',0,21,22,34,9,'concourse');
    section('habitation-link',0,55,22,34,7,'habitation');
    section('stronghold',0,87,22,32,8,'stronghold',true,false);
    for(const side of [-1,1]){
      section(side<0?'bar':'store',side*24,21,26,32,6,'retail',false,true);
      section(side<0?'crew-quarters':'engineering',side*24,54,26,34,7,'service',true,false);
      box('maintenance-floor',[side*34,-.15,37],[6,.3,72],'deck');
      box('maintenance-outer-wall',[side*37,3.2,37],[.5,6.4,72],'hull');
      for(let zz=5;zz<70;zz+=5){box('service-pipe',[side*35,5.3,zz],[.17,.17,4.6],'trim');lamp(side*35,5.8,zz,'red');}
      // Elevated hangar catwalks and the central control gallery share the Meridian frame language.
      box('catwalk',[side*15,4.5,-50],[4,.28,43],'deck');
      for(let zz=-70;zz<-28;zz+=4){box('catwalk-post',[side*17,5.2,zz],[.12,1.3,.12],'trim');box('catwalk-support',[side*15,2.2,zz],[.24,4.4,.24],'frame');}
      box('catwalk-rail',[side*17,5.9,-50],[.12,.1,43],'trim');
      // Wide industrial ramp replaces non-navigable ladder art; the player can actually climb it.
      for(let q=0;q<9;q++)box('ramp-tread',[side*15,(q+.5)*.5,-70+q*.9],[3.8,.2,.88],'deck');
      box('catwalk-stair-rail',[side*17,2.65,-66],[.12,5.3,.12],'trim');
      for(let z=-69;z<-31;z+=7){beam('hangar-raking-brace',[side*17.55,.2,z],[side*17.55,7.7,z+4],.26,'frame');beam('hangar-reverse-brace',[side*17.55,7.7,z+4],[side*17.55,.2,z+8],.21,'trim');}
      for(let z=-69;z<-30;z+=6){beam('roof-diagonal-brace',[side*17,10.25,z],[side*3,10.25,z+5],.22,'frame');}
    }
    for(const s of solids){if(s.cover){box('cover-'+s.id,s.position,s.size,s.id.includes('stronghold')?'gang':'machinery');box('cover-top-'+s.id,[s.position[0],s.size[1]+.04,s.position[2]],[s.size[0]+.12,.10,s.size[2]+.12],'frame');}}
    // A parked stripped shuttle ties the entrance arena to the player's ship scale.
    const wreck=shipModel('starter','friendly',parent);wreck.position.set(-8,1.65,-58);wreck.rotation.y=.45;wreck.scaling.setAll(1.25);dynamic.push(wreck);
    for(let i=0;i<22;i++){const x=(i%2?-1:1)*(8+i%4*2),z=-68+Math.floor(i/2)*4;box('freight-stack',[x,.55,z],[1.25,1.1,1.5],i%3?'machinery':'gang');box('freight-lock',[x,1.13,z],[1.1,.12,1.37],'frame');box('freight-corner',[x+.52,.58,z+.57],[.08,1.1,.08],'trim');}
    // Functional handling equipment and layered hangar floor markings.
    for(const z of [-67,-52,-37]){box('crane-bridge',[0,9.35,z],[34,.75,.8],'machinery');for(const side of [-1,1]){box('crane-rail',[side*16,9.8,z],[.4,.35,3.6],'trim');box('hangar-lane',[side*5,.015,z],[.12,.025,12],'trim');}box('crane-winch',[0,8.25,z],[2.4,1.2,1.8],'frame');box('crane-cable',[0,6.65,z],[.06,2.5,.06],'dark');cyl('crane-hook',[0,5.3,z],.35,.42,'trim');}
    for(let i=0;i<9;i++){const z=-72+i*5;box('runway-chevron-left',[-2,.026,z],[.16,.025,2.1],'trim',-.35);box('runway-chevron-right',[2,.026,z],[.16,.025,2.1],'trim',.35);}
    for(const side of [-1,1])for(let i=0;i<5;i++){const z=-70+i*8;box('airduct',[side*13,8,z],[1.4,.8,5.4],'frame');box('airduct-vent',[side*13,7.55,z],[1.2,.06,3.8],'machinery');box('cable-tray',[side*16,6.7,z],[.6,.14,5.8],'trim');}
    for(let i=0;i<8;i++){const z=-69+i*6;box('gantry-banner',[i%2?-16.8:16.8,5.6,z],[.05,3.1,1.6],'gang');box('banner-rag',[i%2?-16.75:16.75,3.9,z+.3],[.04,.7,1.1],'dark');}
    // Painted occupation symbols and directional signage give each district a visual identity.
    const flag=new B.DynamicTexture('raider-fabric',{width:256,height:512},scene,false),fg=flag.getContext();fg.fillStyle='#752f33';fg.fillRect(0,0,256,512);for(let i=0;i<42;i++){fg.fillStyle=i%2?'#4b2327':'#a45a4b';fg.fillRect((i*73)%256,(i*127)%512,4+i%11,2+i%37);}fg.strokeStyle='#d5bdb0';fg.lineWidth=15;fg.beginPath();fg.arc(128,175,55,0,Math.PI*2);fg.stroke();fg.beginPath();fg.moveTo(53,338);fg.lineTo(203,449);fg.moveTo(203,338);fg.lineTo(53,449);fg.stroke();fg.fillStyle='#d5bdb0';fg.font='bold 50px monospace';fg.textAlign='center';fg.fillText('VII',128,210);flag.update();
    const flagMat=new B.StandardMaterial('gang-flag',scene);flagMat.diffuseTexture=flag;flagMat.backFaceCulling=false;flagMat.emissiveColor=new B.Color3(.10,.02,.02);
    for(const [x,y,z,w,h] of [[-17,7,-44,3.1,5.2],[17,7,-36,3.1,5.2],[-9,5.7,84,2.6,4.2],[9,5.7,92,2.6,4.2]]){const banner=B.MeshBuilder.CreatePlane('gang-occupation-banner',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);banner.position.set(x,y,z);banner.rotation.y=x<0?Math.PI/2:-Math.PI/2;banner.parent=parent;banner.material=flagMat;dynamic.push(banner);}
    dynamic.push(flagMat,flag);placard('CUSTOMS / SECURITY',[0,5.8,-25]);placard('CENTRAL CONCOURSE',[0,7.9,6],5.5);placard('BAR / REST',[ -24,4.7,7]);placard('STORE / TRADE',[24,4.7,7]);placard('CREW DECK',[-24,5.9,39]);placard('ENGINEERING',[24,5.9,39]);placard('NO AUTHORIZED ENTRY',[0,6.8,73],5.1);
    for(const z of [-62,-45,-28,14,26,45,58,81,96])for(const side of [-1,1]){box('bulkhead-number-plate',[side*8,3.5,z],[.08,.8,1.5],'gang');lamp(side*7,6,z,z>70?'red':'cold');}
    // Concave pipe banks, improvised bulkhead repairs and localized gang occupation.
    for(let i=0;i<17;i++){const z=-60+i*9,x=i%2?-9:9;box('patched-wall-plate',[x,2.2,z],[.22,2.2,2.4],i%3?'gang':'machinery');box('weld-line',[x,2.5,z+1.2],[.28,.05,2.3],'trim');}
    for(const side of [-1,1]){
      const x=side*24;
      for(let i=0;i<5;i++){box('bar-store-shelf',[x+side*7,1+i*.8,12+i*3],[2,.11,2.6],'machinery');box('bottle-or-spare',[x+side*(5+i%2),1.6,16+i*3],[.25,.7,.3],side<0?'glass':'trim');}
      for(let i=0;i<4;i++)box('habitation-bunk',[x+side*6,.55,43+i*6],[2,.6,3],'hull');
      if(side>0){for(let i=0;i<4;i++){cyl('coolant-reactor',[x+(i%2?4:-4),1.8,47+i*6],1,3.6,'machinery');lamp(x+(i%2?4:-4),5.8,47+i*6,'red');}}
    }
    for(let i=0;i<4;i++){const z=15+i*5;cyl('abandoned-bar-stool',[-19,.54,z],.32,1.08,'frame');box('bar-stool-seat',[-19,1.1,z],[.75,.11,.75],'gang');box('bar-bottle-collection',[-22,1.68,z],[.16,.55,.16],'glass');}
    box('bar-ceiling-canopy',[-24,5.4,21],[15,.45,7],'gang');for(let i=0;i<5;i++)lamp(-30+i*3,5.05,21,'warm');
    for(let i=0;i<9;i++){const z=11+i*2.6;box('surplus-display-crate',[23,1.1,z],[1.2,.6,1],'machinery');box('inventory-label',[23,1.42,z+.35],[1,.05,.13],'cold');}
    for(let i=0;i<5;i++){const z=44+i*5;box('crew-privacy-frame',[-29,2.3,z],[.2,4.3,3.5],'frame');box('crew-privacy-curtain',[-28.9,2.4,z],[.05,3.4,2.2],i%2?'gang':'hull');box('crew-locker',[-21,1.2,z+1.3],[1.1,2.4,.9],'machinery');}
    for(let i=0;i<5;i++){const z=42+i*6;box('coolant-main',[31,4.8,z],[.4,.4,5.4],'trim');box('coolant-drop',[31,2.6,z],[.35,4.4,.35],'machinery');cyl('pressure-valve',[31,1.7,z],.44,.18,'red',12,Math.PI/2);box('reactor-warning',[22,.04,z],[3,.05,.2],'trim');}
    box('customs-xray-machine',[0,2.2,-13],[5,4.3,2],'frame');box('customs-xray-aperture',[0,2.3,-11.9],[3.4,2.8,.14],'dark');for(const x of [-5,5]){box('scanner-lane',[x,1.6,-14],[.35,3.2,6],'machinery');lamp(x,4.8,-14,'cold');}
    box('gang-command-dais',[0,.25,97],[8,.5,5],'gang');box('gang-command-console',[0,1.32,98],[3.3,1.65,1.2],'frame');box('gang-command-display',[0,2.1,97.36],[2.9,.95,.07],'red');
    for(let i=0;i<5;i++){const x=-7+i*3.5;box('stronghold-hanging-cable',[x,5.9,82+i%2*3],[.11,3.2,.11],'dark');box('stronghold-improvised-light',[x,4.25,82+i%2*3],[.8,.11,.3],'red');}
    for(let i=0;i<8;i++){const x=(i%2?-1:1)*(3+i%3*2),z=78+i*3;box('gang-supply',[x,.65,z],[1.4,1.3,1.4],i%2?'gang':'machinery');}
    // Exterior remains a 3D orbital scene through the open arrival aperture.
    box('arrival-threshold-warning',[0,.016,-76.7],[21,.04,.35],'trim');
    for(const side of [-1,1]){box('arrival-safety-stanchion',[side*10.8,.82,-76.8],[.16,1.65,.16],'frame');box('arrival-safety-rail',[side*6,.82,-76.8],[8,.1,.12],'trim');}
    const planetMat=new B.StandardMaterial('orbital-world',scene);planetMat.diffuseColor=B.Color3.FromHexString('#8cabc7');planetMat.diffuseTexture=VoidVesperVisuals.surfaceTexture(B,scene,'derelict-orbit','moon','#788ba6',quality);planetMat.specularColor=new B.Color3(.02,.03,.05);
    const planet=B.MeshBuilder.CreateSphere('derelict-orbital-world',{diameter:84,segments:48},scene);planet.position.set(34,-18,-205);planet.parent=parent;planet.material=planetMat;dynamic.push(planet,planetMat);
    for(let i=0;i<70;i++){const x=Math.sin(i*17.71)*94,y=Math.cos(i*14.43)*50+9,z=-125-Math.abs(Math.sin(i*3.1))*85;const star=B.MeshBuilder.CreateSphere('orbital-star',{diameter:i%9===0?.32:.12,segments:4},scene);star.position.set(x,y,z);star.parent=parent;star.material=mat.cold;star.isPickable=false;dynamic.push(star);}
    const outpost=new B.TransformNode('neighboring-orbital-station',scene);outpost.parent=parent;outpost.position.set(-31,17,-132);dynamic.push(outpost);
    const hub=cyl('orbital-hub',[0,0,0],2,13,'frame');hub.parent=outpost;
    const ring=B.MeshBuilder.CreateTorus('orbital-habitation-ring',{diameter:22,thickness:1.9,tessellation:36},scene);ring.parent=outpost;ring.rotation.x=Math.PI/2;ring.material=mat.machinery;dynamic.push(ring);
    for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*10,z=Math.sin(a)*10;const pod=box('orbital-pod',[x,0,z],[2,3,4],'hull',a,false);pod.parent=outpost;const beacon=box('orbital-beacon',[x,.5,z],[.3,.3,.4],'warm',a,false);beacon.parent=outpost;}
    for(const side of [-1,1]){const array=box('solar-array',[side*17,0,0],[11,.2,5],'dark',0,false);array.parent=outpost;for(let i=0;i<5;i++){const stripe=box('array-grid',[side*17,0.12,-2+i],[10,.03,.06],'cold',0,false);stripe.parent=outpost;}}
    const glow=(name,pos,c,intensity,radius)=>{const light=new B.PointLight(name,new B.Vector3(...pos),scene);light.diffuse=B.Color3.FromHexString(c);light.intensity=intensity;light.range=radius;light.parent=parent;dynamic.push(light);};
    for(const [z,color] of [[-58,'#f6ad69'],[-36,'#9ccbd6'],[-11,'#89bdcd'],[22,'#f2b36e'],[55,'#d8825f'],[85,'#d44e53']])glow('derelict-local-light',[0,6,z],color,quality==='low'?.45:.8,23);
    // Static material batches reduce draw calls without baking the map or its gameplay collision.
    for(const [key,meshes] of staticByMaterial)if(meshes.length>1){const merged=B.Mesh.MergeMeshes(meshes,true,true,undefined,false,false);if(merged){merged.name='derelict-batch-'+key;merged.parent=parent;merged.material=mat[key];merged.isPickable=false;}}
    return {dispose(){scene.fogMode=B.Scene.FOGMODE_NONE;for(const m of dynamic)m.dispose?.();for(const m of Object.values(mat))m.dispose(false,true);},materials:mat};
  }
  root.VoidDerelictStation={layout,zones,build};
})(globalThis);
