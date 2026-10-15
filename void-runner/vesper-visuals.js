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

  // Seeded value noise. Mountains, mesas and butte walls are all shaped by layered
  // noise rather than repeating sine waves, so no ridge or wall repeats around the horizon.
  function noise(seed){
    const rand=random(seed),perm=new Uint16Array(512),vals=new Float32Array(256);
    for(let i=0;i<256;i++){perm[i]=i;vals[i]=rand();}
    for(let i=255;i>0;i--){const j=Math.floor(rand()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}
    for(let i=0;i<256;i++)perm[i+256]=perm[i];
    const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(a,b,t)=>a+(b-a)*t;
    function n2(x,y){const X=Math.floor(x),Y=Math.floor(y),fx=fade(x-X),fy=fade(y-Y),xi=X&255,yi=Y&255,v=(i,j)=>vals[perm[perm[(xi+i)&255]+((yi+j)&255)]];
      return lerp(lerp(v(0,0),v(1,0),fx),lerp(v(0,1),v(1,1),fx),fy);}
    function n3(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=fade(x-X),fy=fade(y-Y),fz=fade(z-Z),v=(i,j,k)=>vals[perm[perm[perm[((X+i)&255)]+((Y+j)&255)]+((Z+k)&255)]];
      return lerp(lerp(lerp(v(0,0,0),v(1,0,0),fx),lerp(v(0,1,0),v(1,1,0),fx),fy),lerp(lerp(v(0,0,1),v(1,0,1),fx),lerp(v(0,1,1),v(1,1,1),fx),fy),fz);}
    function fbm(x,y,oct=5){let a=.5,f=1,sum=0,norm=0;for(let o=0;o<oct;o++){sum+=a*n2(x*f+o*17.3,y*f-o*9.1);norm+=a;a*=.5;f*=2.03;}return sum/norm;}
    // Ridged noise gives sharp crests and branching valleys like eroded ranges.
    function ridged(x,y,oct=5){let a=.5,f=1,sum=0,norm=0,w=1;for(let o=0;o<oct;o++){let r=1-Math.abs(n2(x*f+o*31.7,y*f+o*11.9)*2-1);r*=r*w;w=Math.min(1,r*1.6);sum+=a*r;norm+=a;a*=.5;f*=2.1;}return sum/norm;}
    function fbm3(x,y,z,oct=4){let a=.5,f=1,sum=0,norm=0;for(let o=0;o<oct;o++){sum+=a*n3(x*f+o*5.1,y*f,z*f-o*3.3);norm+=a;a*=.5;f*=2.07;}return sum/norm;}
    return {n2,n3,fbm,ridged,fbm3};
  }
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

  // The horizon terrain: a polar heightfield (dense near Vesper, coarser far away) whose
  // heights come from domain-warped ridged noise. Mesa country is blended in by region,
  // with soft sandstone terraces, and everything fades into blue-violet haze with distance.
  function mountainRing(B,scene,parent,material,quality='medium'){
    const low=quality==='low',segments=low?160:320,ringCount=low?26:44,inner=245,outer=1350,N=noise(4417);
    const radii=Array.from({length:ringCount},(_,i)=>inner*Math.pow(outer/inner,i/(ringCount-1)));
    const positions=[],indices=[],uvs=[],heights=[];
    for(let ring=0;ring<ringCount;ring++)for(let i=0;i<=segments;i++){
      const angle=i/segments*Math.PI*2,r=radii[ring],x=Math.sin(angle)*r,z=Math.cos(angle)*r;
      // Domain warp bends ridgelines so they wander instead of radiating from the village.
      const wx=x+160*(N.fbm(x*.0016,z*.0016,3)-.5),wz=z+160*(N.fbm(x*.0016+40,z*.0016-25,3)-.5);
      const start=600+260*N.fbm(x*.0011+3,z*.0011+8,3);const mask=smooth(start,start+420,r);
      const massif=.45+N.fbm(wx*.0009,wz*.0009,3)*1.1;
      const range=Math.pow(N.ridged(wx*.0032,wz*.0032,6),1.5)*210*massif+18*massif;
      let h=range*mask;
      // Mesa regions: flat-topped tables with stepped strata and steep breaks.
      const mesa=smooth(.5,.62,N.fbm(wx*.0014-11,wz*.0014+6,3));
      if(mesa>0&&h>8){const step=24+8*N.n2(wx*.004,wz*.004),k=h/step,f=k-Math.floor(k),tiers=(Math.floor(k)+smooth(.72,.98,f))*step;const table=Math.min(tiers,40+70*massif);h=h+(table-h)*mesa*.9;}
      // Low sand swells across the open desert between the village and the ranges.
      h+=(N.fbm(x*.006,z*.006,3)-.45)*7*smooth(260,420,r)+(N.fbm(x*.03,z*.03,2)-.5)*1.6;
      const y=ring===0?-.035:Math.max(-.035,h);
      positions.push(x,y,z);heights.push(y);uvs.push(i/segments*24,ring*.8);
    }
    for(let ring=0;ring<ringCount-1;ring++)for(let i=0;i<segments;i++){const a=ring*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
    const normals=[];B.VertexData.ComputeNormals(positions,indices,normals);
    // Colour from slope, height and distance: pale sand on flats, rust rock on slopes,
    // strata bands on cliffs, dark varnish on high faces, then atmospheric haze.
    const colors=[];
    for(let v=0;v<heights.length;v++){
      const x=positions[v*3],y=heights[v],z=positions[v*3+2],r=Math.hypot(x,z),ny=Math.abs(normals[v*3+1]),slope=smooth(.55,.92,1-ny);
      const grain=.9+.2*N.fbm(x*.05,z*.05,2),band=Math.sin(y*.38+N.fbm(x*.01,z*.01,2)*6),strata=1+.12*band*slope;
      const varnish=1-.28*smooth(30,140,y)*slope;
      let cr=(.80*(1-slope)+.63*slope)*grain*strata*varnish,cg=(.62*(1-slope)+.36*slope)*grain*strata*varnish,cb=(.45*(1-slope)+.24*slope)*grain*strata*varnish;
      const haze=Math.min(.8,Math.max(0,(r-450)/1000));
      colors.push(Math.min(1,cr*(1-haze)+.53*haze),Math.min(1,cg*(1-haze)+.46*haze),Math.min(1,cb*(1-haze)+.58*haze),1);
    }
    const mesh=new B.Mesh('vesper-continuous-mountain-terrain',scene),data=new B.VertexData();
    Object.assign(data,{positions,indices,normals,colors,uvs});data.applyToMesh(mesh);
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
    const rand=random(9173),N=noise(7331),low=quality==='low',wall=new B.StandardMaterial('vesper-butte-walls',scene),talus=new B.StandardMaterial('vesper-butte-talus',scene);
    wall.diffuseTexture=strataTexture(B,scene,quality);wall.specularColor=new B.Color3(.04,.03,.02);wall.ambientColor=new B.Color3(.4,.3,.26);
    talus.diffuseColor=B.Color3.FromHexString('#7d5a44');talus.specularColor=B.Color3.Black();talus.ambientColor=new B.Color3(.32,.24,.2);
    const W={p:[],i:[],u:[]},T={p:[],i:[],u:[]};
    function grid(target,n,rows,point){const start=target.p.length/3;for(let r=0;r<rows.length;r++)for(let k=0;k<=n;k++){const [x,y,z,u,v]=point(k%n,k/n,rows[r],r);target.p.push(x,y,z);target.u.push(u,v);}
      for(let r=0;r<rows.length-1;r++)for(let k=0;k<n;k++){const a=start+r*(n+1)+k,b=a+n+1;target.i.push(a,b,a+1,a+1,b,b+1);}return start;}
    // Each butte is a stack of irregular rings. Noise in 3D (angle and height) carves
    // alcoves, buttresses and overhanging hard strata, so no two walls look alike.
    function butte(cx,cz,R,H,spire){
      const n=spire?(low?10:14):(low?22:36),levels=spire?(low?6:9):(low?7:12),stretch=spire?1+rand()*.3:1+rand()*1.5,rot=rand()*Math.PI,seed=rand()*500;
      const plan=a=>{const c=Math.cos(a-rot),s=Math.sin(a-rot);return 1/Math.hypot(c/stretch,s)/Math.sqrt(stretch)*(.8+.4*N.fbm(Math.cos(a)*1.3+seed,Math.sin(a)*1.3,3));};
      const radius=(a,t)=>{const y=t*H,body=spire?(1-t*.55)*(1+.35*Math.sin(t*9+seed)*(N.n2(seed,t*4)-.3)):1-.06*t;
        const carve=N.fbm3(Math.cos(a)*R*.09+seed,y*.05,Math.sin(a)*R*.09,4),hard=Math.sin(y*.21+N.n2(a*2+seed,y*.03)*3)>.7?1.05:1;
        return R*plan(a)*body*(.78+.44*carve)*hard;};
      const rows=Array.from({length:levels+1},(_,k)=>k/levels);
      const top=t=>H*(1+(spire?.04:.015)*(N.n2(seed+t*3,seed)-.5));
      grid(W,n,rows,(k,f,t)=>{const a=f*Math.PI*2,rr=radius(a,Math.max(.22,t)),y=t===1?top(f):H*(.22+t*.78);return [cx+Math.cos(a)*rr,y,cz+Math.sin(a)*rr,f*Math.max(2,Math.round(R*stretch/9)),y/Math.max(45,H*1.25)];});
      // Slightly domed, uneven cap.
      const c=W.p.length/3;W.p.push(cx,H*1.01+(spire?1:2),cz);W.u.push(.5,.5);for(let k=0;k<=n;k++){const f=(k%n)/n,a=f*Math.PI*2,rr=radius(a,1);W.p.push(cx+Math.cos(a)*rr,top(f),cz+Math.sin(a)*rr);W.u.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);}for(let k=0;k<n;k++)W.i.push(c,c+2+k,c+1+k);
      // Talus: an uneven apron of fallen rock that climbs the lower wall.
      const apron=[[-.6,spire?1.9:2.2],[H*.1,1.45],[H*.22,1.03]];
      grid(T,n,[0,1,2],(k,f,_,r)=>{const a=f*Math.PI*2,base=radius(a,.22),[y,scale]=apron[r],j=r===0?.85+.4*N.n2(a*3+seed,seed):r===1?.9+.2*N.n2(a*5+seed,7):1;const yy=r===0?y:y*(.7+.6*N.n2(a*4+seed,3));return [cx+Math.cos(a)*base*scale*j,yy,cz+Math.sin(a)*base*scale*j,f*4,r];});
    }
    // Buttes stand in loose clusters with open desert between them, needles beside the big ones.
    const sites=[],clusters=Array.from({length:low?4:6},()=>[rand()*Math.PI*2,340+rand()*380]);
    for(let i=0;i<(low?10:18);i++){let a,d,ok,tries=0;do{const [ca,cd]=clusters[i%clusters.length];a=ca+(rand()-.5)*.55;d=cd+(rand()-.5)*160;ok=d>290&&sites.every(s=>Math.hypot(Math.cos(a)*d-s[0],Math.sin(a)*d-s[1])>s[2]+40);tries++;}while(!ok&&tries<60);
      const R=14+Math.pow(rand(),1.4)*42,H=45+rand()*100+R*.6;sites.push([Math.cos(a)*d,Math.sin(a)*d,R*2.2]);butte(Math.cos(a)*d,Math.sin(a)*d,R,H,false);
      const spires=low?(rand()<.5?1:0):Math.floor(rand()*4);for(let k=0;k<spires;k++){const sa=a+(rand()-.5)*.3,sd=d+(rand()-.5)*R*3.5;butte(Math.cos(sa)*sd,Math.sin(sa)*sd,3.5+rand()*6,35+rand()*75,true);}}
    const out=[];for(const [name,data,m] of [['vesper-buttes',W,wall],['vesper-talus',T,talus]]){const mesh=new B.Mesh(name,scene),vd=new B.VertexData(),normals=[];
      // Faces were wound for an outward view; flip so Babylon's front faces point out.
      for(let k=0;k<data.i.length;k+=3)[data.i[k+1],data.i[k+2]]=[data.i[k+2],data.i[k+1]];
      B.VertexData.ComputeNormals(data.p,data.i,normals);Object.assign(vd,{positions:data.p,indices:data.i,normals,uvs:data.u});vd.applyToMesh(mesh);mesh.parent=parent;mesh.material=m;mesh.isPickable=false;mesh.receiveShadows=false;out.push(mesh);}
    return {meshes:out,materials:[wall,talus],dispose(){for(const m of out)m.dispose();wall.diffuseTexture?.dispose();wall.dispose();talus.dispose();}};
  }
  // Weathered sandstone boulder: a subdivided sphere pushed in and out by 3D noise,
  // squashed and flattened where it sits in the sand.
  const boulderNoise=noise(2203);
  function boulder(B,scene,name,size,seed,quality='medium'){
    const mesh=B.MeshBuilder.CreateIcoSphere(name,{radius:1,subdivisions:quality==='low'?2:3,updatable:true},scene),p=mesh.getVerticesData(B.VertexBuffer.PositionKind),N=boulderNoise;
    for(let k=0;k<p.length;k+=3){const x=p[k],y=p[k+1],z=p[k+2],d=.62+.75*N.fbm3(x*1.4+seed,y*1.4,z*1.4-seed,4),blocky=1+.12*Math.sign(Math.sin(y*6+seed));
      p[k]=x*d*size;p[k+1]=Math.max(-.15,y*d*blocky)*size*.62;p[k+2]=z*d*size*(.8+.3*N.n2(seed,1));}
    mesh.updateVerticesData(B.VertexBuffer.PositionKind,p);const normals=[];B.VertexData.ComputeNormals(p,mesh.getIndices(),normals);mesh.updateVerticesData(B.VertexBuffer.NormalKind,normals);mesh.convertToFlatShadedMesh?.();return mesh;
  }
  root.VoidVesperVisuals={surfaceTexture,mountainRing,buttes,boulder};
})(globalThis);
