/* Bounded, phase-aware readiness. No simulation or render loop is owned here. */
(function(root){
 const limits={module:90000,assets:60000,scene:30000,artwork:45000,total:180000};
 let current=null;
 async function run(action){
  const controller=new AbortController(),started=performance.now();
  const task={signal:controller.signal,started,phase:'starting',asset:null,
   check(){if(performance.now()-started>=limits.total&&!this.signal.aborted){const e=Error('Overall preparation deadline exceeded.');e.phase=this.phase;e.asset=this.asset;e.elapsedMs=performance.now()-started;controller.abort(e);}if(this.signal.aborted)throw this.signal.reason;},
   async wait(name,operation,asset){
    this.check();this.phase=name;this.asset=asset||null;
    const remaining=limits.total-(performance.now()-started);
    let timer;
    try{return await Promise.race([Promise.resolve().then(operation).then(value=>{this.check();return value;}),new Promise((_,reject)=>{
     timer=setTimeout(()=>{const error=Error('Preparation timed out during '+name+(asset?' ('+asset+')':''));error.phase=name;error.asset=asset;controller.abort(error);reject(error);},Math.max(0,Math.min(limits[name]||limits.assets,remaining)));
    })]);}catch(error){error.phase??=name;error.asset??=asset;error.elapsedMs=performance.now()-started;throw error;}finally{clearTimeout(timer);}
   }
  };
  current=task;
  try{return await action(task);}catch(error){controller.abort(error);throw error;}finally{if(current===task)current=null;}
 }
 const api={limits,run,get current(){return current;}};
 if(typeof module!=='undefined')module.exports=api;else root.VoidPreparation=api;
})(globalThis);
