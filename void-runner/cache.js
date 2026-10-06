/* Optional disk cache. Normal browser loading remains the fallback. */
(function(root){
  const build='2026-10-06-tutorial-save-1';
  const api=root.VoidCache={build,worker:null,ready:false};
  if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
  const sw=new URL('../void-runner-sw.js',document.currentScript.src);
  navigator.serviceWorker.addEventListener('message',event=>{
    if(event.data?.type==='VERSION')console.info('[VOID//RUNNER cache]',event.data);
    if(event.data?.type==='CORE_READY'){api.ready=event.data.complete;console.info('[VOID//RUNNER cache] core files available',event.data.count+'/'+event.data.total);}
  });
  navigator.serviceWorker.register(sw,{scope:new URL('../',sw).pathname,updateViaCache:'none'})
    .then(async registration=>{
      api.worker=registration;
      try{await registration.update();}catch{}
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
      urls.push(new URL('vendor/babylon-8.26.0.js',new URL('./',sw)).pathname);
      worker.postMessage({type:'WARM_CORE',urls:[...new Set(urls)]});
    }catch(error){console.warn('[VOID//RUNNER cache] warm unavailable',error?.message||error);}
  };
})(window);
