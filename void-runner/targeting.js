/* Continuous acquisition; loss of the target requires a fresh lock. */
(function(root){
 function fresh(){return {target:null,progress:0,status:'SEARCH'};}
 function step(lock,candidates,project,width,height,dt,balance,enabled){
  if(!enabled){Object.assign(lock,fresh());return;}
  const radius=Math.min(width,height)*balance.missileLockRadius;
  const eligible=candidates.filter(e=>!e.dead&&(!(e.relationship||e.allegiance)||(e.relationship||e.allegiance)==='hostile')).map(e=>({e,p:project(e)})).filter(({e,p})=>p.z>1&&Math.hypot(p.x-width/2,p.y-height*.44)<=radius&&(!balance.missileRange||Math.hypot(e.x,e.y,e.z)<=balance.missileRange)).sort((a,b)=>a.p.z-b.p.z);
  const next=eligible.find(q=>q.e===lock.target)?.e||eligible[0]?.e||null;
  if(next!==lock.target){lock.target=next;lock.progress=0;}
  lock.progress=next?Math.min(1,lock.progress+dt/balance.missileLockTime):0;
  lock.status=lock.progress>=1?'LOCK':next?'ACQUIRING':'SEARCH';
 }
 const api={fresh,step};if(typeof module!=='undefined')module.exports=api;else root.VoidTargeting=api;
})(globalThis);
