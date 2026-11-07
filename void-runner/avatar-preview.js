/* DEVELOPMENT ONLY. Shows the account's chosen character model as a stand-in "other player" a few metres in front of you,
   so the look of a second player can be checked before any multiplayer exists. It never runs for players: it needs a local
   address (localhost or 127.0.0.1) AND ?avatar-preview=1 (or the local flag tdd-avatar-preview=1). It only adds one extra
   copy of a model the District already loaded; it does not touch, replace or reanimate any NPC. */
(function(root){
 const allowed=(loc,storage)=>{try{return /^(localhost|127\.0\.0\.1)$/.test(loc.hostname)&&(/[?&]avatar-preview=1(&|$)/.test(loc.search||'')||storage?.getItem?.('tdd-avatar-preview')==='1');}catch{return false;}};
 const MODELS=['district-smuggler','district-resident','admin'];
 if(typeof module!=='undefined')module.exports={allowed,MODELS};
 if(typeof document==='undefined'||!allowed(root.location,root.localStorage))return;
 let node=null,ctrl=null,pending=null;
 const hide=()=>{ctrl?.dispose?.();node?.dispose?.();node=ctrl=null;pending=null;};
 // model: one of MODELS (default: this account's character, else the smuggler). Placed `ahead` metres in front of the player, facing them.
 function show({model,ahead=2.4,x,z}={}){
  hide();model=model||root.VoidAccount?.character?.model||'district-smuggler';
  if(!MODELS.includes(model))return {ok:false,reason:'unknown model'};
  if(typeof walker==='undefined'||!walker)return {ok:false,reason:'walk somewhere first'};
  if(model==='admin')return {ok:false,reason:'Admin is a built-in NPC figure, not an animated crowd model, so there is nothing to place yet'};
  const B=root.BABYLON,scene=root.VoidBabylon.scene,id='crowd:'+model,token=pending={};
  const px=x??walker.x+Math.sin(walker.yaw)*ahead,pz=z??walker.z+Math.cos(walker.yaw)*ahead,py=walker.y-1.68,yaw=walker.yaw+Math.PI; // faces the viewer
  function place(){
   if(pending!==token)return false;const parent=new B.TransformNode('avatar-preview',scene),made=root.VoidAssets.instance(id,parent);
   if(!made){parent.dispose();return false;}
   node=parent;parent.position.set(px,py,pz);parent.rotation.y=yaw;ctrl=root.VoidCrowd.animate(made,model,'idle');return made;}
  const made=place();
  if(made)return {ok:true,model,x:px,z:pz,clips:made.metadata.animationGroups.length};
  // District figures are fetched in the background (a few seconds, longer on slow machines): place it when it arrives.
  const off=root.VoidAssets.onLoaded?.(loaded=>{if(loaded===id){if(!node)place();off?.();}});
  return {ok:true,pending:true,model,x:px,z:pz};
 }
 const walkAnim=on=>ctrl?.play(on?'walk':'idle');
 root.VoidAvatarPreview={show,hide,walk:walkAnim,get active(){return !!node;},models:MODELS};
})(globalThis);
