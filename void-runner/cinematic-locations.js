/* The original location builders own their own Babylon engine, HUD and event listeners.
   This document loads geometry modules only. No campaign or account is handed to a preview. */
(function(root){
 'use strict';
 const locations={
  'Corporate District':{name:'VoidCorporate',scripts:['corporate-security','corporate','corporate-actors','corporate-build']},
  'Zen Zephyr Temple':{name:'VoidTemple',scripts:['temple','temple-wall','temple-build']},
  'Milked reception':{name:'VoidMilked',scripts:['milked','milked-build']}
 };
 const scriptBase=new URL('.',document.currentScript.src);
 async function open(name){
  const entry=locations[name];if(!entry)throw Error('Unknown filming location.');
  const iframe=document.createElement('iframe');iframe.hidden=true;iframe.title='Private scene builder';iframe.src=new URL('cinematic-stage.html',scriptBase).href;
  await new Promise((resolve,reject)=>{iframe.onload=resolve;iframe.onerror=()=>{iframe.remove();reject(Error('Could not open the private stage.'));};document.body.append(iframe);});
  const win=iframe.contentWindow,doc=win.document;let handle,parent,spawn,disposed=false;
  function dispose(){if(disposed)return;disposed=true;try{handle?.dispose?.();}finally{parent?.dispose();iframe.remove();}}
  try{
   for(const src of ['vendor/babylon-8.26.0','vendor/babylonjs-loaders-8.26.0.min','asset-pipeline',...entry.scripts]){
    await new Promise((ok,fail)=>{const tag=doc.createElement('script');tag.src=new URL(src+'.js',scriptBase).href;tag.onload=ok;tag.onerror=()=>fail(Error('Could not load '+src));doc.head.append(tag);});
   }
   const B=win.BABYLON,owner=win[entry.name],canvas=doc.createElement('canvas');doc.body.append(canvas);
   return {B,canvas,assets:win.VoidAssets,dispose,
    async build(scene,quality){
     const definition=owner.layout();
     spawn=definition.spawn;
     parent=new B.TransformNode('cinema-location-origin',scene);parent.position.set(-spawn[0],0,-spawn[2]);
     const options={scene,parent,quality,state:{story:{flags:{}}}};
     handle=owner.build(options);await handle.prepare?.();
    },
    tick(t,cam){const eye={x:cam.position.x+spawn[0],y:cam.position.y,z:cam.position.z+spawn[2],yaw:cam.rotation.y};
     handle.tick?.(t,eye);}
   };
  }catch(e){dispose();throw e;}
 }
 root.VoidCinemaLocations={locations,open};
})(globalThis);
