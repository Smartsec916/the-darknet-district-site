/* Opaque wet streaks; gravity remains world-down even on animated hit meshes. */
(function(root){
 'use strict';
 root.HotelLiquid={create(B,scene){
  const wet=new B.StandardMaterial('milk-white liquid',scene);wet.diffuseColor=new B.Color3(.98,.98,.94);wet.specularColor=new B.Color3(.8,.8,.8);wet.specularPower=96;
  const drops=[];
  function remove(d){d.head.dispose();d.trail.dispose();}
  function hit(hit,viewer){const normal=hit.getNormal(true)||B.Vector3.Up(),parent=hit.pickedMesh; if(!parent||!hit.pickedPoint)return;
   parent.computeWorldMatrix(true);const npc=parent.metadata?.npc!==undefined,flowNormal=npc&&viewer?viewer.subtract(hit.pickedPoint).normalize():normal,origin=hit.pickedPoint.add(flowNormal.scale(npc ? .26 : .016));
   for(let i=0;i<3;i++){const head=B.MeshBuilder.CreateSphere('liquid drip',{diameter:1,segments:6},scene),trail=B.MeshBuilder.CreateSphere('liquid streak',{diameter:1,segments:6},scene);for(const m of [head,trail]){m.material=wet;m.isPickable=false;}
    const at=origin.add(new B.Vector3((i-1)*.035,0,0));drops.push({head,trail,parent,local:B.Vector3.TransformCoordinates(at,B.Matrix.Invert(parent.getWorldMatrix())),age:-i*.16,speed:.055+i*.025,flat:!npc&&normal.y>.65,ceiling:!npc&&normal.y<-.5});
   }while(drops.length>72)remove(drops.shift());
  }
  function update(dt){for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.age+=dt;if(d.age>9||d.parent.isDisposed()){remove(d);drops.splice(i,1);continue;}const t=Math.max(0,d.age),dry=Math.min(1,Math.max(0,9-t)),origin=B.Vector3.TransformCoordinates(d.local,d.parent.computeWorldMatrix(true));
    // Attached streaks follow the hit region, but flow downward under world gravity.
    const length=d.flat?0:Math.min(.65,t*d.speed+t*t*.008),y=Math.max(.025,origin.y-length);
    d.head.position.set(origin.x,y,origin.z);d.trail.position.set(origin.x,(origin.y+y)/2,origin.z);
    d.head.scaling.set((d.flat?.1+Math.min(t,.9)*.08:.037)*dry,(d.flat?.009:.065)*dry,(d.flat?.1+Math.min(t,.9)*.08:.025)*dry);
    d.trail.scaling.set(.018*dry,Math.max(.01,origin.y-y)*dry,.012*dry);
    if(d.ceiling){d.head.position.y=Math.max(.025,origin.y-1.4*t*t);d.trail.setEnabled(false);}
   }}
  return {hit,update,get count(){return drops.length;}};
 }};
})(globalThis);
