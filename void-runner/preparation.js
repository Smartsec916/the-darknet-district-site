/* Bounded, phase-aware readiness. No simulation or render loop is owned here. */
(function(root){
 const limits={module:240000,assets:8000,scene:10000,artwork:3000,optional:3000,total:270000};
 let current=null;const tasks=new Set();
 async function run(action){
  const controller=new AbortController(),started=performance.now();
  const task={cancel(){controller.abort(Error('Preparation cancelled.'));},signal:controller.signal,started,phase:'starting',asset:null,
   check(){if(performance.now()-started>=limits.total&&!this.signal.aborted){const e=Error('Overall preparation deadline exceeded.');e.phase=this.phase;e.asset=this.asset;e.elapsedMs=performance.now()-started;controller.abort(e);}if(this.signal.aborted)throw this.signal.reason;},
   async wait(name,operation,asset){
    this.check();this.phase=name;this.asset=asset||null;
    const remaining=limits.total-(performance.now()-started);
    let timer,abort;
    try{return await Promise.race([Promise.resolve().then(operation).then(value=>{this.check();return value;}),new Promise((_,reject)=>{
     abort=()=>reject(this.signal.reason);this.signal.addEventListener('abort',abort,{once:true});
     timer=setTimeout(()=>{const error=Error('Preparation timed out during '+name+(asset?' ('+asset+')':''));error.phase=name;error.asset=asset;controller.abort(error);reject(error);},Math.max(0,Math.min(limits[name]||limits.assets,remaining)));
    })]);}catch(error){error.phase??=name;error.asset??=asset;error.elapsedMs=performance.now()-started;throw error;}finally{clearTimeout(timer);if(abort)this.signal.removeEventListener('abort',abort);}
   }
  };
  const previous=current;current=task;tasks.add(task);
  try{return await action(task);}catch(error){controller.abort(error);throw error;}finally{tasks.delete(task);if(current===task)current=tasks.has(previous)?previous:null;}
 }
 const api={limits,run,cancel(){for(const task of tasks)task.cancel();},get current(){return current;}};
 if(typeof module!=='undefined')module.exports=api;else root.VoidPreparation=api;
})(globalThis);
