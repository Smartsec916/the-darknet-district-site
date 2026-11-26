/* Shared 3D trees and sky behind glazed room windows. One render target, no exterior simulation. */
(function(root){
'use strict';
const B=root.BABYLON,R=root.HotelRules;
function build(scene,camera,map){
 const outdoors=new B.Scene(scene.getEngine());
 // The game handles canvas input directly and uses explicit rays for hits.
 outdoors.detachControl();
 outdoors.clearColor=new B.Color4(.38,.65,.84,1);outdoors.fogMode=B.Scene.FOGMODE_EXP2;outdoors.fogDensity=.003;outdoors.fogColor=new B.Color3(.62,.77,.85);
 const eye=new B.FreeCamera('garden view camera',new B.Vector3(0,0,-4),outdoors);eye.minZ=.05;eye.maxZ=220;outdoors.activeCamera=eye;
 const light=new B.HemisphericLight('outdoor skylight',new B.Vector3(.3,1,-.3),outdoors);light.intensity=.8;light.groundColor=new B.Color3(.22,.29,.19);
 const sun=new B.DirectionalLight('afternoon sunlight',new B.Vector3(-.5,-.8,.6),outdoors);sun.intensity=.7;sun.diffuse=new B.Color3(1,.94,.8);
 const groups=new Map();
 function material(name,color,emission=0){const m=new B.StandardMaterial(name,outdoors);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=B.Color3.Black();m.emissiveColor=m.diffuseColor.scale(emission);return m;}
 const grass=material('garden meadow','#597747'),bark=material('tree bark','#68523a'),leaves=[material('sunlit foliage','#567b3e'),material('deep green foliage','#355d39'),material('soft green foliage','#749451')],cloud=material('white clouds','#edf3f3',.18);
 function add(m,mat,x,y,z){m.position.set(x,y,z);m.material=mat;m.isPickable=false;const group=groups.get(mat)||[];group.push(m);groups.set(mat,group);return m;}
 function canopy(name,x,y,z,w,h,d,mat){return add(B.MeshBuilder.CreateSphere(name,{diameter:1,segments:8},outdoors),mat,x,y,z).scaling.set(w,h,d);}
 // Ground and tree roots stay at a fixed physical elevation as the hotel rises.
 const ground=-2.4-map.index*4.2;
 add(B.MeshBuilder.CreateGround('meadow',{width:210,height:190},outdoors),grass,0,ground,80);
 for(let i=0;i<32;i++){const row=Math.floor(i/8),x=(i%8-3.5)*12+(row%2?5:0),z=16+row*24+(i*7%9),h=7+i*13%6;
  add(B.MeshBuilder.CreateCylinder('tree trunk',{height:h*.72,diameterTop:.22,diameterBottom:.65,tessellation:7},outdoors),bark,x,ground+h*.36,z);
  for(let j=0;j<5;j++){const angle=j*2.4,spread=j?1.7:0;canopy('tree crown',x+Math.cos(angle)*spread,ground+h-1+(j%2)*1.3,z+Math.sin(angle)*spread,4.5+j%2,4.8,4.2,leaves[(i+j)%3]);}
 }
 // Broad cloud banks remain above the tree canopy; upper floors look out into sky.
 for(let i=0;i<9;i++){const x=(i%3-1)*37+(i%2)*8,z=65+Math.floor(i/3)*36,y=ground+20+(i%3)*3;
  for(let j=0;j<5;j++)canopy('cloud bank',x+(j-2)*5,y+(j===2?1.7:0),z+(j%2)*2,13,3.5+(j%3),8,cloud);
 }
 for(const [mat,list] of groups){const mesh=B.Mesh.MergeMeshes(list,true,true,undefined,false,true);mesh.name='outdoors '+mat.name;mesh.freezeWorldMatrix();}
 const target=new B.RenderTargetTexture('shared 3D garden and sky',512,outdoors,false,true);target.activeCamera=eye;target.renderList=outdoors.meshes.slice();target.clearColor=outdoors.clearColor;target.wrapU=target.wrapV=B.Texture.CLAMP_ADDRESSMODE;
 const viewMat=new B.StandardMaterial('window exterior view',scene);viewMat.disableLighting=true;viewMat.emissiveTexture=target;viewMat.diffuseColor=B.Color3.Black();viewMat.specularColor=B.Color3.Black();
 const glass=new B.StandardMaterial('transparent window glass',scene);glass.diffuseColor=new B.Color3(.24,.4,.46);glass.alpha=.075;glass.specularColor=new B.Color3(.3,.4,.5);glass.backFaceCulling=false;
 const frameMat=new B.StandardMaterial('window steel frame',scene);frameMat.diffuseColor=new B.Color3(.12,.16,.19);
 const panes=[];
 for(const room of map.rooms){const w=room.window,x=R.world(w.x),z=R.world(w.z),y=1.95,width=2.05,height=1.95;
  const pane=B.MeshBuilder.CreatePlane('outside view '+room.number,{width,height},scene);pane.rotation.y=Math.PI/2;pane.position.set(x,y,z);pane.material=viewMat;pane.metadata={windowRoom:room.id};
  const glazing=B.MeshBuilder.CreatePlane('clear glass '+room.number,{width,height},scene);glazing.rotation.y=Math.PI/2;glazing.position.set(x-.025,y,z);glazing.material=glass;glazing.isPickable=false;
  function trim(name,dx,dy,dz,sx,sy,sz){const m=B.MeshBuilder.CreateBox(name,{width:sx,height:sy,depth:sz},scene);m.position.set(x+dx,y+dy,z+dz);m.material=frameMat;return m;}
  for(const side of [-1,1]){trim('window jamb',-.06,0,side*(width/2+.055),.16,height+.22,.11);trim('window rail',-.06,side*(height/2+.055),0,.16,.11,width+.22);}trim('window sill',-.18,-height/2-.08,0,.42,.1,width+.32);trim('window mullion',-.06,0,0,.1,height,.035);
  panes.push({room:room.id,x,y,z,width,height,pane,glazing});
 }
 let elapsed=1,active=null,renders=0;
 function update(dt){elapsed+=dt;const p=camera.position,room=map.rooms.find(r=>R.inside(r.bounds,p));active=room?panes[room.id]:null;if(!active)return;const a=active,depth=a.x-p.x;if(depth<.12||depth>25)return;const forward=camera.getForwardRay().direction;if(forward.x<-.2||elapsed<1/20)return;elapsed=0;
  const ex=-(p.z-a.z),ey=p.y-a.y,n=.05,f=220,l=(-a.width/2-ex)*n/depth,r=(a.width/2-ex)*n/depth,b=(-a.height/2-ey)*n/depth,t=(a.height/2-ey)*n/depth;
  eye.position.set(ex,ey,-depth);eye.setTarget(new B.Vector3(ex,ey,1));
  eye.freezeProjectionMatrix(B.Matrix.FromValues(2*n/(r-l),0,0,0,0,2*n/(t-b),0,0,-(r+l)/(r-l),-(t+b)/(t-b),(f+n)/(f-n),1,0,0,-2*n*f/(f-n),0));
  outdoors.incrementRenderId();outdoors.resetCachedMaterial();target.render(true);renders++;
 }
 scene.onDisposeObservable.add(()=>outdoors.dispose());
 return {panes,outdoors,target,eye,update,get renders(){return renders;},get active(){return active?.room??null;}};
}
root.HotelWindows={build};
})(globalThis);
