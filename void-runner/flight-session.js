/* Runtime authority only. Campaign data and combat resources remain in their existing owners. */
(function(root){
 'use strict';
 function create({clearInput=()=>{},cancel=()=>{},release=()=>{}}={}){
  let active=null,generation=0,tail=Promise.resolve();
  function exclusive(action){
   const work=tail.then(action);
   tail=work.catch(()=>{});
   return work;
  }
  function owns(owner){return !!owner&&active===owner&&owner.status!=='ENDED';}
  function end(owner=active){
   if(!owns(owner))return owner?.cleanup||Promise.resolve();
   owner.status='ENDED';active=null;owner.controller.abort();cancel();clearInput();
   // This job is queued before any replacement may acquire the shared gameplay scene.
   owner.cleanup=exclusive(()=>release());
   return owner.cleanup;
  }
  function begin(){
   end();
   const controller=new AbortController();
   active={id:++generation,kind:'CAMPAIGN',status:'PREPARING',controller,signal:controller.signal,ready:tail,cleanup:null};
   clearInput();return active;
  }
  function change(owner,from,to){if(!owns(owner)||owner.status!==from)return false;owner.status=to;return true;}
  return {get active(){return active;},owns,begin,end,exclusive,
   activate:owner=>change(owner,'PREPARING','RUNNING'),
   pause(owner=active){const changed=change(owner,'RUNNING','PAUSED');if(changed)clearInput();return changed;},
   resume:owner=>change(owner,'PAUSED','RUNNING'),
   running(){return active?.status==='RUNNING';},
   settled(){return tail;}};
 }
 const api={create};if(typeof module!=='undefined')module.exports=api;else root.VoidFlightLifecycle=api;
})(globalThis);
