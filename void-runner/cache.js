/* Optional disk cache. Normal browser loading remains the fallback. */
(function(root){
  const build='2026-10-29-stage1-ci-timing';
  const api=root.VoidCache={build,worker:null,ready:false};
  if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
  const sw=new URL('../void-runner-sw.js',document.currentScript.src);
  /* UPDATES WITHOUT A MANUAL REFRESH (update-ready.js has the rule and the reason). loaded: the build that served this page; 'network' when no worker did (then the
     first worker to answer is the current build). A different build taking control is an update: reload on the loading screen or the main menu, otherwise one
     small notice and the reload at the next main-menu visit. Never in a conversation, a flight, a test or draft session. */
  const U=root.VoidUpdate;let loaded=navigator.serviceWorker.controller?undefined:'network',update=null,noticed=false;
  api.update=()=>({loaded,update});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{navigator.serviceWorker.controller?.postMessage({type:'VERSION'});});
  // The game's own globals (let bindings in game.js) exist once game.js has run; before that typeof is 'undefined'.
  const decide=()=>{if(!update||!U)return;const ctx={started:!!root.VoidStartup?.started,mode:typeof mode!=='undefined'?mode:undefined,mainMenu:!!document.querySelector('#screen:not(.hidden) .main-menu'),flight:!!root.VoidFlightSession?.active,speech:typeof speech!=='undefined'&&!!speech,testing:!!root.VoidDevTest?.active};
    if(U.when(ctx)==='reload'){update=null;location.reload();return;}
    if(ctx.started&&!noticed&&root.VoidV1?.notify){noticed=!!root.VoidV1.notify({key:'update',text:U.NOTICE,silent:true});}};
  setInterval(decide,1000);
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='VERSION'){console.info('[VOID//RUNNER cache]',event.data);const b=event.data.build;if(loaded===undefined||loaded==='network')loaded=b;else if(U?.ready(loaded,b)){update=b;decide();}}
    if(event.data?.type==='CORE_READY'){api.ready=event.data.complete;console.info('[VOID//RUNNER cache] core files available',event.data.count+'/'+event.data.total);}
  });
  navigator.serviceWorker.register(sw,{scope:new URL('../',sw).pathname,updateViaCache:'none'})
    .then(async registration=>{
      api.worker=registration;
      try{await registration.update();}catch{}
      setInterval(()=>{registration.update().catch(()=>{});},15*60*1000);   // a deploy during a long session is noticed too
      navigator.serviceWorker.controller?.postMessage({type:'VERSION'});
    })
    .catch(error=>console.warn('[VOID//RUNNER cache] service worker unavailable',error?.message||error));
  api.warm=async()=>{
    try{
      const registration=await navigator.serviceWorker.ready;
      const worker=navigator.serviceWorker.controller||registration.active;
      if(!worker)return;
      const urls=[...document.querySelectorAll('script[src],link[rel="stylesheet"][href]')]
        .map(node=>new URL(node.src||node.href,location.href).pathname)
        .filter(path=>path.startsWith(new URL('./',sw).pathname));
      urls.unshift(location.pathname);
      for(const f of ['vendor/babylon-8.26.0.js','vendor/meshopt_decoder-1.3.0.js'])urls.push(new URL(f,new URL('./',sw)).pathname);   // the meshopt decoder: the game's models are meshopt-compressed (asset-pipeline.js)
      worker.postMessage({type:'WARM_CORE',urls:[...new Set(urls)]});
    }catch(error){console.warn('[VOID//RUNNER cache] warm unavailable',error?.message||error);}
  };
})(window);
