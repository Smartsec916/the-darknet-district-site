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

  function mountainRing(B,scene,parent,material){
    const rand=random(92341),positions=[],indices=[],colors=[];
    function vertex(x,y,z,shade){positions.push(x,y,z);colors.push(shade[0],shade[1],shade[2],1);}
    const palettes=[[[.53,.42,.35],[.46,.36,.32],[.59,.46,.36]],[[.41,.42,.46],[.34,.37,.44],[.50,.46,.45]]];
    for(let layer=1;layer>=0;layer--)for(let i=0;i<34;i++){
      const angle=(i+rand()*.35)/34*Math.PI*2,radius=(layer?610:390)+rand()*80,width=(layer?42:35)+rand()*48;
      if(angle<.90||angle>Math.PI*2-.90)continue; // The detailed backdrop owns the workshop's forward vista.
      const cx=Math.sin(angle)*radius,cz=Math.cos(angle)*radius,tx=Math.cos(angle),tz=-Math.sin(angle),height=(layer?48:34)+rand()*(layer?90:63);
      const profile=[[-1,0],[-.76,.38],[-.47,.78],[-.20,.96],[.24,.94],[.55,.65],[.82,.30],[1,0]];
      const base=positions.length/3,palette=palettes[layer];
      for(const [side,elevation]of profile){const offset=side*width;vertex(cx+tx*offset,-8+height*elevation,cz+tz*offset,palette[Math.floor(rand()*palette.length)]);}
      // A recessed foot and a fractured middle band give each ridge a changing silhouette.
      for(let j=0;j<profile.length;j++){const side=profile[j][0]*width;vertex(cx+tx*side-Math.sin(angle)*17,-8,cz+tz*side-Math.cos(angle)*17,palette[(j+1)%palette.length]);}
      for(let j=0;j<profile.length-1;j++){indices.push(base+j,base+j+1,base+8+j,base+j+1,base+9+j,base+8+j);}
    }
    const normals=[],mesh=new B.Mesh('vesper-distant-ridges',scene),data=new B.VertexData();
    B.VertexData.ComputeNormals(positions,indices,normals);Object.assign(data,{positions,indices,normals,colors});data.applyToMesh(mesh);
    mesh.parent=parent;mesh.material=material;mesh.isPickable=false;mesh.receiveShadows=false;mesh.alwaysSelectAsActiveMesh=false;return mesh;
  }

  root.VoidVesperVisuals={surfaceTexture,mountainRing};
})(globalThis);
