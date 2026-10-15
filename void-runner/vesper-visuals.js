/* Vesper presentation assets. All textures and terrain are generated locally at scene creation. */
(function(root){
  function random(seed){return()=>((seed=seed*16807%2147483647)-1)/2147483646;}

  function surfaceTexture(B,scene,name,kind,color,quality){
    const size=quality==='high'?1024:512,texture=new B.DynamicTexture('vesper-'+name,{width:size,height:size},scene,true);
    const g=texture.getContext(),rand=random(8103+name.length*173);g.fillStyle=color;g.fillRect(0,0,size,size);
    const grain=kind==='soil'?16000:kind==='floor'?11000:7000;
    for(let i=0;i<grain;i++){
      const light=rand()>.5,alpha=kind==='soil'?.05+rand()*.16:.018+rand()*.07;
      g.fillStyle=light?'rgba(255,239,211,'+alpha+')':'rgba(19,20,19,'+alpha+')';
      g.fillRect(rand()*size,rand()*size,1+rand()*(kind==='soil'?10:5),1+rand()*3);
    }
    if(kind==='moon'){
      for(let i=0;i<170;i++){
        const x=rand()*size,y=rand()*size,r=4+rand()*45;
        const crater=g.createRadialGradient(x,y,0,x,y,r);
        crater.addColorStop(0,'rgba(61,75,113,'+(.07+rand()*.18)+')');crater.addColorStop(.62,'rgba(90,109,145,.07)');crater.addColorStop(1,'rgba(225,229,234,0)');
        g.fillStyle=crater;g.fillRect(x-r,y-r,r*2,r*2);
      }
      g.strokeStyle='rgba(72,86,118,.10)';g.lineWidth=2;
      for(let i=0;i<30;i++){const x=rand()*size,y=rand()*size;g.beginPath();g.ellipse(x,y,6+rand()*40,3+rand()*21,rand()*3,0,Math.PI*2);g.stroke();}
    }else if(kind==='soil'){
      for(let i=0;i<48;i++){
        const x=rand()*size,y=rand()*size,r=12+rand()*72,shade=rand()>.5?'112,80,54':'219,190,149';
        const fade=g.createRadialGradient(x,y,0,x,y,r);fade.addColorStop(0,'rgba('+shade+',.22)');fade.addColorStop(1,'rgba('+shade+',0)');g.fillStyle=fade;g.fillRect(x-r,y-r,r*2,r*2);
      }
      g.lineWidth=1;g.strokeStyle='rgba(68,52,40,.23)';
      for(let i=0;i<90;i++){let x=rand()*size,y=rand()*size;g.beginPath();g.moveTo(x,y);for(let j=0;j<4;j++){x+=rand()*28-14;y+=rand()*22-11;g.lineTo(x,y);}g.stroke();}
    }else if(kind==='floor'){
      for(let y=0;y<size;y+=size/8)for(let x=0;x<size;x+=size/8){
        const cell=size/8;g.fillStyle='rgba(35,32,28,'+(.018+rand()*.025)+')';g.fillRect(x+2,y+2,cell-4,cell-4);
        g.strokeStyle='rgba(28,31,31,.27)';g.lineWidth=2;g.strokeRect(x+.5,y+.5,cell-1,cell-1);
        g.strokeStyle='rgba(228,216,194,.14)';g.lineWidth=1;g.strokeRect(x+2,y+2,cell-4,cell-4);
        for(const dx of [8,cell-8])for(const dy of [8,cell-8]){g.fillStyle='rgba(33,36,35,.36)';g.fillRect(x+dx-2,y+dy-2,4,4);}
      }
      for(let i=0;i<32;i++){const x=rand()*size,y=rand()*size,r=16+rand()*60,f=g.createRadialGradient(x,y,0,x,y,r);f.addColorStop(0,'rgba(28,29,28,.15)');f.addColorStop(1,'rgba(28,29,28,0)');g.fillStyle=f;g.fillRect(x-r,y-r,r*2,r*2);}
    }else{
      const step=size/8;for(let x=0;x<size;x+=step){
        g.fillStyle='rgba(255,242,216,.07)';g.fillRect(x+3,0,2,size);
        g.fillStyle='rgba(22,26,27,.19)';g.fillRect(x+step-5,0,3,size);
        for(let y=12;y<size;y+=step){g.fillStyle='rgba(21,25,27,.28)';g.fillRect(x+9,y,4,3);g.fillStyle='rgba(255,230,190,.1)';g.fillRect(x+10,y+3,2,1);}
      }
      for(let i=0;i<80;i++){const x=rand()*size,y=rand()*size;g.fillStyle='rgba(91,48,29,'+(.025+rand()*.055)+')';g.fillRect(x,y,1+rand()*13,2+rand()*34);}
      for(let i=0;i<70;i++){g.fillStyle='rgba(239,238,224,.14)';g.fillRect(rand()*size,rand()*size,6+rand()*55,1);}
    }
    texture.update();texture.anisotropicFilteringLevel=quality==='low'?2:4;return texture;
  }

  // A continuous, double-sided radial heightfield replaces the single forward-facing photo card.
  // It has real depth from every flight camera angle and costs only a few thousand triangles.
  function mountainRing(B,scene,parent,material,quality='medium'){
    const segments=quality==='low'?96:192,radii=[245,290,350,425,510,610,725,845,970,1100,1240],positions=[],indices=[],colors=[],uvs=[];
    const peaks=[[-2.76,1.0],[-2.23,.72],[-1.72,1.18],[-1.10,.83],[-.40,1.07],[.27,1.24],[.86,.78],[1.44,1.09],[2.15,.85],[2.74,1.20]];
    function wrap(a){return Math.atan2(Math.sin(a),Math.cos(a));}
    for(let ring=0;ring<radii.length;ring++)for(let i=0;i<=segments;i++){
      const angle=i/segments*Math.PI*2,r=radii[ring],angular=angle>Math.PI?angle-Math.PI*2:angle;
      let skyline=0;for(const [at,scale] of peaks){const d=wrap(angular-at);skyline+=scale*Math.exp(-d*d/.027);}
      // Integer angular frequencies keep the first and last columns identical.
      const crest=34+skyline*73+12*Math.sin(angle*12)+6*Math.sin(angle*28+.6);
      // Open desert floor out to the buttes; the ridge ring rises only as the distant hazy range.
      const radial=Math.max(0,Math.min(1,(r-820)/420));
      const shelves=Math.sin(r*.043+Math.sin(angle*15)*2.2)*5+Math.sin(r*.11+angle*31)*2;
      // Mesa profile: tall crests flatten into table tops with steep stratified walls.
      let raw=(crest+shelves)*radial+(r>900?Math.sin(angle*7+r*.013)*15:0)+(r>300&&r<900?2.5*Math.sin(angle*9+r*.03):0);const cap=38+skyline*30+Math.sin(angle*9)*5;if(raw>cap)raw=cap+(raw-cap)*.12;
      const y=ring===0?-.035:Math.max(-.035,raw);
      positions.push(Math.sin(angle)*r,y,Math.cos(angle)*r);
      const shade=.79+.13*Math.sin(angle*23+r*.014)+.06*Math.sin(r*.18+angle*37);
      // Sandstone strata: alternating pale and rust bands by height, darker desert varnish near the tops.
      const band=Math.sin(y*.42+Math.sin(angle*5)*.6),strata=band>.55?1.13:band<-.6?.86:1,varnish=y>40?1-Math.min(.22,(y-40)/260):1,dist=1-Math.min(.25,(r-245)/3600);
      const k=shade*strata*varnish,haze=Math.min(.78,Math.max(0,(r-420)/900));colors.push(Math.min(1,.74*k*(1-haze)+.52*haze),Math.min(1,.5*k*(1-haze)+.44*haze),Math.min(1,.36*k*(1-haze)+.56*haze),1);
      uvs.push(i/segments*16,ring*1.5);
    }
    for(let ring=0;ring<radii.length-1;ring++)for(let i=0;i<segments;i++){
      const a=ring*(segments+1)+i,b=a+segments+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
    const normals=[],mesh=new B.Mesh('vesper-continuous-mountain-terrain',scene),data=new B.VertexData();
    B.VertexData.ComputeNormals(positions,indices,normals);Object.assign(data,{positions,indices,normals,colors,uvs});data.applyToMesh(mesh);
    mesh.parent=parent;mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=false;return mesh;
  }

  // Monument-valley buttes and spires: sheer stratified sandstone walls on talus
  // skirts, in full 3D so they hold up when the Kestrel climbs away from Vesper.
  function strataTexture(B,scene,quality){
    const size=quality==='low'?256:512,t=new B.DynamicTexture('vesper-strata',{width:size,height:size},scene,true),g=t.getContext(),rand=random(5521);
    const grad=g.createLinearGradient(0,0,0,size);grad.addColorStop(0,'#b8673a');grad.addColorStop(.55,'#a2522c');grad.addColorStop(1,'#7a3c22');g.fillStyle=grad;g.fillRect(0,0,size,size);
    let y=0;while(y<size){const h=8+rand()*46,tone=rand();g.fillStyle=tone>.7?'rgba(232,170,120,.22)':tone<.3?'rgba(70,30,18,.22)':'rgba(190,110,70,.12)';g.fillRect(0,y,size,h);g.fillStyle='rgba(40,18,10,.35)';g.fillRect(0,y+h-1,size,1);y+=h;}
    for(let i=0;i<220;i++){const x=rand()*size,w=1+rand()*5,top=rand()*size*.6,len=size*(.15+rand()*.6);const sg=g.createLinearGradient(0,top,0,top+len);sg.addColorStop(0,'rgba(45,22,14,0)');sg.addColorStop(.3,'rgba(45,22,14,'+(.1+rand()*.25)+')');sg.addColorStop(1,'rgba(45,22,14,0)');g.fillStyle=sg;g.fillRect(x,top,w,len);}
    for(let i=0;i<9000;i++){g.fillStyle='rgba('+(rand()<.5?'255,220,180':'30,12,8')+','+(rand()*.07)+')';g.fillRect(rand()*size,rand()*size,1+rand()*3,1+rand()*2);}
    t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=quality==='low'?2:8;return t;
  }
  function buttes(B,scene,parent,quality='medium'){
    const rand=random(9173),low=quality==='low',wall=new B.StandardMaterial('vesper-butte-walls',scene),talus=new B.StandardMaterial('vesper-butte-talus',scene);
    wall.diffuseTexture=strataTexture(B,scene,quality);wall.specularColor=new B.Color3(.04,.03,.02);wall.ambientColor=new B.Color3(.4,.3,.26);
    talus.diffuseColor=B.Color3.FromHexString('#6c4029');talus.specularColor=B.Color3.Black();talus.ambientColor=new B.Color3(.32,.24,.2);
    const W={p:[],i:[],u:[]},T={p:[],i:[],u:[]};
    function ring(target,n,radii,ys,cx,cz,uv){const start=target.p.length/3;for(let r=0;r<ys.length;r++)for(let k=0;k<=n;k++){const a=k/n*Math.PI*2,rad=radii[r][k%n];target.p.push(cx+Math.cos(a)*rad,ys[r],cz+Math.sin(a)*rad);target.u.push(uv?k/n*uv[0]:k/n*4,uv?ys[r]/uv[1]:r);}for(let r=0;r<ys.length-1;r++)for(let k=0;k<n;k++){const a=start+r*(n+1)+k,b=a+n+1;target.i.push(a,b,a+1,a+1,b,b+1);}return start;}
    function cap(target,n,radius,y,cx,cz){const c=target.p.length/3;target.p.push(cx,y,cz);target.u.push(.5,y/60);for(let k=0;k<=n;k++){const a=k/n*Math.PI*2;target.p.push(cx+Math.cos(a)*radius[k%n],y,cz+Math.sin(a)*radius[k%n]);target.u.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);}for(let k=0;k<n;k++)target.i.push(c,c+2+k,c+1+k);}
    function butte(cx,cz,R,H,spire){const n=spire?9:24,stretch=spire?1:1+rand()*1.6,rot=rand()*Math.PI,ph=rand()*6;
      // Elongated, notched footprint with vertical buttresses so walls read as eroded rock, not drums.
      const shape=Array.from({length:n},(_,k)=>{const a=k/n*Math.PI*2,e=Math.hypot(Math.cos(a-rot)*stretch,Math.sin(a-rot))/Math.max(1,stretch)*1.15,flute=spire?1:(1+.08*Math.sin(a*11+ph)+.05*Math.sin(a*23+ph*2));return Math.max(.35,e*flute*(.82+rand()*.26));});const taper=spire?.5:.93;
      const wallR=[shape.map(v=>v*R*1.02),shape.map(v=>v*R*(1-(1-taper)*.5)),shape.map(v=>v*R*taper)];const wallY=[H*.28,H*.66,H];
      ring(W,n,wallR,wallY,cx,cz,[Math.max(1,Math.round(R*stretch*2*Math.PI/70)),Math.max(45,H*1.4)]);cap(W,n,wallR[2],H,cx,cz);
      // Ledges: a slight overhang band partway up the wall reads as a harder stratum.
      if(!spire&&H>50){const lr=shape.map(v=>v*R*1.06);ring(W,n,[lr,lr],[H*.62,H*.645],cx,cz,[4,H]);}
      const talusR=[shape.map(v=>v*R*(spire?1.8:2.1)*(.9+rand()*.25)),shape.map(v=>v*R*1.5),shape.map(v=>v*R*1.04)];ring(T,n,talusR,[-.5,H*.12,H*.3],cx,cz,null);}
    const sites=[];
    for(let i=0;i<(low?10:18);i++){let a,d,ok;let tries=0;do{a=rand()*Math.PI*2;d=300+rand()*480;ok=sites.every(s=>Math.hypot(Math.cos(a)*d-s[0],Math.sin(a)*d-s[1])>s[2]+60);tries++;}while(!ok&&tries<40);
      const R=18+rand()*36,H=60+rand()*95;sites.push([Math.cos(a)*d,Math.sin(a)*d,R*2.3]);butte(Math.cos(a)*d,Math.sin(a)*d,R,H,false);
      // Spires cluster beside the larger buttes, like the reference's needles.
      const spires=low?1:2+Math.floor(rand()*3);for(let k=0;k<spires;k++){const sa=a+(rand()-.5)*.35,sd=d+(rand()-.5)*R*3.5;butte(Math.cos(sa)*sd,Math.sin(sa)*sd,4+rand()*6,40+rand()*70,true);}}
    const out=[];for(const [name,data,m] of [['vesper-buttes',W,wall],['vesper-talus',T,talus]]){const mesh=new B.Mesh(name,scene),vd=new B.VertexData(),normals=[];
      // Faces were wound for an outward view; flip so Babylon's front faces point out.
      for(let k=0;k<data.i.length;k+=3)[data.i[k+1],data.i[k+2]]=[data.i[k+2],data.i[k+1]];
      B.VertexData.ComputeNormals(data.p,data.i,normals);Object.assign(vd,{positions:data.p,indices:data.i,normals,uvs:data.u});vd.applyToMesh(mesh);mesh.parent=parent;mesh.material=m;mesh.isPickable=false;mesh.receiveShadows=false;out.push(mesh);}
    return {meshes:out,materials:[wall,talus],dispose(){for(const m of out)m.dispose();wall.diffuseTexture?.dispose();wall.dispose();talus.dispose();}};
  }
  root.VoidVesperVisuals={surfaceTexture,mountainRing,buttes};
})(globalThis);
