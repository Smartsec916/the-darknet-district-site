/* Controlled humanoid POC. Only loaded by the development animation lab. */
(function(root){
 const rig='VR_Humanoid_v1',asset='assets/animations/mara-poc.glb',base=new URL('.',document.currentScript.src);
 const clips=Object.freeze({
  idle_fighting:{group:'idle_fighting',loop:true,role:'mara',category:'idle',rootMotion:'in-place',blendMs:300},
  clap_slow:{group:'clap_slow',loop:false,role:'mara',category:'conversation',rootMotion:'in-place',blendMs:300}
 });
 const scenes=new WeakMap();let nextId=0;
 async function prepare(scene,url=asset){
  let resources=scenes.get(scene);if(!resources){resources=new Map();scenes.set(scene,resources);}
  if(!resources.has(url)){
   const absolute=new URL(url,base);
   if(absolute.origin!==root.location.origin||!absolute.pathname.endsWith('.glb'))throw Error('Local GLB required.');
   const directory=absolute.href.slice(0,absolute.href.lastIndexOf('/')+1),file=absolute.href.slice(absolute.href.lastIndexOf('/')+1);
   resources.set(url,BABYLON.SceneLoader.LoadAssetContainerAsync(directory,file,scene).catch(error=>{resources.delete(url);throw error;}));
  }
  return resources.get(url);
 }
 function controller(groups){
  const byName=Object.fromEntries(groups.map(group=>[Object.keys(clips).find(id=>group.name.endsWith(id)),group]).filter(([id])=>id));let current=null,token=0;
  function stop(){token++;for(const group of groups)group.stop();current=null;}
  function play(id,{loop=clips[id]?.loop,speed=1,blendMs=clips[id]?.blendMs}={}){
   const definition=clips[id],next=definition&&byName[definition.group];if(!next)return false;
   if(current===next){next.speedRatio=speed;return true;}
   const previous=current,stepToken=++token;
   for(const group of groups)if(group!==previous&&group!==next)group.stop();
   next.stop();next.start(loop,speed);
   next.setWeightForAllAnimatables(previous?0:1);current=next;
   if(previous){const start=performance.now();function blend(now){if(stepToken!==token)return;const alpha=Math.min(1,(now-start)/Math.max(1,blendMs));next.setWeightForAllAnimatables(alpha);previous.setWeightForAllAnimatables(1-alpha);if(alpha<1)requestAnimationFrame(blend);else previous.stop();}requestAnimationFrame(blend);}
   return true;
  }
  return {play,stop,get current(){return current;},setSpeed(value){if(current)current.speedRatio=value;}};
 }
 async function spawn(scene,{url=asset,role='mara'}={}){
  const container=await prepare(scene,url),id=++nextId,instance=container.instantiateModelsToScene(name=>role+'-'+id+'-'+name,false);
  const animator=controller(instance.animationGroups);
  return {...instance,animator,dispose(){animator.stop();instance.animationGroups.forEach(group=>group.dispose());instance.rootNodes.forEach(node=>node.dispose());instance.skeletons.forEach(skeleton=>skeleton.dispose());}};
 }
 function release(scene){const resources=scenes.get(scene);if(!resources)return;scenes.delete(scene);for(const promise of resources.values())promise.then(container=>container.dispose()).catch(()=>{});}
 root.VoidAnimationLibrary={rig,asset,clips,prepare,spawn,controller,release};
})(globalThis);
