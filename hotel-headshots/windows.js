/* Shared 3D city view behind glazed room windows. One render target, no city simulation. */
(function(root){
'use strict';
const B=root.BABYLON,R=root.HotelRules;
function build(scene,camera,map){
 const city=new B.Scene(scene.getEngine());city.clearColor=new B.Color4(.035,.055,.09,1);city.fogMode=B.Scene.FOGMODE_EXP2;city.fogDensity=.006;city.fogColor=new B.Color3(.055,.075,.11);
 const eye=new B.FreeCamera('city view camera',new B.Vector3(0,0,-4),city);eye.minZ=.05;eye.maxZ=220;city.activeCamera=eye;
 const light=new B.HemisphericLight('city ambient',new B.Vector3(.3,1,-.3),city);light.intensity=.48;const moon=new B.DirectionalLight('city moonlight',new B.Vector3(-.5,-.8,.6),city);moon.intensity=.65;moon.diffuse=new B.Color3(.55,.68,.85);
 const groups=new Map();
 function material(name,color,emission=0){const m=new B.StandardMaterial(name,city);m.diffuseColor=B.Color3.FromHexString(color);m.specularColor=B.Color3.Black();m.emissiveColor=m.diffuseColor.scale(emission);return m;}
 const concrete=material('city concrete','#283747'),steel=material('city steel','#192632'),road=material('wet street','#152331',.15),warm=material('lit apartments','#dfb88a',.8),cyan=material('cyan signs','#449db0',.8),pink=material('magenta signs','#a9517a',.8);
 const wear=new B.DynamicTexture('weathered city panels',128,city,false),ctx=wear.getContext();ctx.fillStyle='#99a2ac';ctx.fillRect(0,0,128,128);for(let i=0;i<1400;i++){ctx.fillStyle=i%2?'#ffffff12':'#00000020';ctx.fillRect(i*47%128,i*73%128,1,i%9+1);}ctx.strokeStyle='#18253366';ctx.strokeRect(1,1,126,126);wear.update();concrete.diffuseTexture=wear;steel.diffuseTexture=wear;
 function box(name,x,y,z,w,h,d,mat){const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},city);m.position.set(x,y,z);m.material=mat;m.isPickable=false;const a=groups.get(mat)||[];a.push(m);groups.set(mat,a);return m;}
 const street=-2.4-map.index*4.2;
 box('street',0,street-.2,65,180,.3,160,road);
 for(let i=0;i<21;i++){const row=Math.floor(i/7),x=(i%7-3)*14+(row%2?5:0),z=24+row*34,h=10+(i*17%31),w=8+i%4;
  box('tower',x,street+h/2,z,w,h,9, i%2?concrete:steel);box('rooftop plant',x+1,street+h+.7,z,2,1.4,2,steel);box('antenna',x-2,street+h+2,z,.12,4,.12,steel);
  for(let floor=1;floor<h/3;floor++)for(let col=-2;col<=2;col++)if((i+floor*3+col*7)%4!==0)box('apartment light',x+col*1.35,street+floor*3,z-4.53,.65,.95,.04,(i+col)%3?warm:cyan);
  for(let y=3;y<h;y+=6){box('facade ledge',x,street+y,z-4.65,w+.25,.16,.35,steel);box('air conditioning',x-w*.35,street+y+.5,z-4.8,.8,.6,.6,concrete);}
  if(i%3===0){box('vertical sign',x+w/2+.3,street+h*.6,z-4.6,.7,4,.12,i%2?cyan:pink);for(let j=0;j<4;j++)box('sign lettering',x+w/2+.3,street+h*.6-1.3+j*.85,z-4.68,.4,.12,.02,warm);}
 }
 for(const x of [-10,10]){box('street curb',x,street+.08,26,.25,.18,45,concrete);for(let z=7;z<45;z+=9){box('street lamp',x,street+2,z,.12,4,.12,steel);box('lamp head',x,street+4,z,1.2,.16,.3,warm);}}
 for(let i=0;i<5;i++){const x=-6+i*3,z=12+i*3;box('parked vehicle',x,street+.65,z,1.8,1.1,3.4,steel);box('vehicle windscreen',x,street+1.23,z,1.5,.05,1.2,cyan);}
 for(const [mat,list] of groups){const mesh=B.Mesh.MergeMeshes(list,true,true,undefined,false,true);mesh.name='city '+mat.name;mesh.freezeWorldMatrix();}
 const target=new B.RenderTargetTexture('shared 3D city',512,city,false,true);target.activeCamera=eye;target.renderList=city.meshes.slice();target.clearColor=city.clearColor;target.wrapU=target.wrapV=B.Texture.CLAMP_ADDRESSMODE;
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
  city.incrementRenderId();city.resetCachedMaterial();target.render(true);renders++;
 }
 scene.onDisposeObservable.add(()=>city.dispose());
 return {panes,city,target,eye,update,get renders(){return renders;},get active(){return active?.room??null;}};
}
root.HotelWindows={build};
})(globalThis);
