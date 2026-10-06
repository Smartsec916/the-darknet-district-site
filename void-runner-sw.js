/* VOID//RUNNER only. Increment BUILD when deploying changed game files. */
const BUILD='2026-10-05-recovery-2';
const CORE='void-runner-core-'+BUILD;
const ASSETS='void-runner-assets-'+BUILD;
const PAGE=new URL('./void-runner.html',self.location).pathname;
const GAME=new URL('./void-runner/',self.location).pathname;
const allowed=/\.(?:js|css|png|webp|jpe?g|svg|glb|gltf|mp3|ogg|wav|woff2?)$/i;
const large=/\.(?:png|webp|jpe?g|svg|glb|gltf|mp3|ogg|wav|woff2?)$/i;
const cacheable=response=>response?.ok&&response.type==='basic'&&!response.headers.has('set-cookie');

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('void-runner-core-')||key.startsWith('void-runner-assets-')).filter(key=>key!==CORE&&key!==ASSETS).map(key=>caches.delete(key)));
  await self.clients.claim();
})()));

async function store(cacheName,request,response){
  if(!cacheable(response))return response;
  try{await (await caches.open(cacheName)).put(request,response.clone());}catch(error){console.warn('[VOID//RUNNER cache] storage unavailable',error?.name||error);}
  return response;
}
async function networkThenCache(request,cacheName){
  try{
    const response=await fetch(request);
    if(response.status>=500){const cached=await (await caches.open(cacheName)).match(request);if(cached)return cached;}
    return await store(cacheName,request,response);
  }
  catch(error){const cached=await (await caches.open(cacheName)).match(request);if(cached)return cached;throw error;}
}
async function cacheThenNetwork(request,cacheName){
  const cached=await (await caches.open(cacheName)).match(request);
  if(cached)return cached;
  return networkThenCache(request,cacheName);
}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.search||url.pathname.startsWith('/api/')||request.headers.has('authorization'))return;
  if(request.mode==='navigate'){
    if(url.pathname===PAGE)event.respondWith(networkThenCache(request,CORE));
    return;
  }
  if(!url.pathname.startsWith(GAME)||!allowed.test(url.pathname))return;
  // Explicit versions keep immutable assets fast. Scripts use the same build cache;
  // the HTML navigation remains network-first to discover new deployments.
  event.respondWith(cacheThenNetwork(request,large.test(url.pathname)?ASSETS:CORE));
});

self.addEventListener('message',event=>{
  if(event.data?.type==='VERSION'){event.source?.postMessage({type:'VERSION',build:BUILD,core:CORE,assets:ASSETS});return;}
  if(event.data?.type!=='WARM_CORE'||!Array.isArray(event.data.urls))return;
  event.waitUntil((async()=>{
    const urls=event.data.urls.filter(path=>typeof path==='string'&&(path===PAGE||path.startsWith(GAME)&&allowed.test(path)));
    const cache=await caches.open(CORE);
    for(const path of urls){
      try{if(await cache.match(path))continue;await store(CORE,new Request(path),await fetch(path,{cache:path===PAGE?'no-cache':'force-cache'}));}
      catch(error){console.warn('[VOID//RUNNER cache] warm skipped',path,error?.message||error);}
    }
    let count=0;for(const path of urls)if(await cache.match(path))count++;
    event.source?.postMessage({type:'CORE_READY',build:BUILD,count,total:urls.length,complete:count===urls.length});
  })());
});
