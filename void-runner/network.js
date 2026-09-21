/* Optional services: bounded GET retries, identity-scoped deduplication, no cached ownership. */
(function(root){
 const config={timeout:20000,attempts:3,backoff:1000,maxBackoff:4000};
 const inflight=new Map(),states={};
 const base=root.location&&!['localhost','127.0.0.1'].includes(root.location.hostname)?'https://the-darknet-district-site.onrender.com':'';
 class ServiceError extends Error{constructor(message,kind,status=0){super(message);this.name='ServiceError';this.kind=kind;this.status=status;}}
 function report(path,state,details={}){states[path]={state,...details};root.dispatchEvent?.(new CustomEvent('void-service-state',{detail:{path,...states[path]}}));}
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function request(path,{body,token,scope='public'}={}){
  const post=body!==undefined&&body!==null,key=scope+':'+path;
  if(!post&&inflight.has(key))return inflight.get(key);
  const operation=(async()=>{
   const attempts=post?1:config.attempts;
   for(let attempt=1;attempt<=attempts;attempt++){
    report(path,attempt===1?'connecting':'retrying',{attempt});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeout);
    let retry=false,error;
    try{
     const headers={Accept:'application/json'};if(post)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
     const response=await root.fetch(base+'/api/void-runner/'+path,{method:post?'POST':'GET',headers,body:post?JSON.stringify(body):undefined,signal:controller.signal,credentials:'omit',cache:'no-store'});
     if(!response.ok){
      retry=[408,429,500,502,503,504].includes(response.status);
      let data;try{data=await response.json();}catch{}
      const message=response.status===401?'Your sign-in expired. Sign in again.':response.status===403?'This account is not authorized for that feature.':retry?'VOID NETWORK unavailable. Local play is ready; account services can be retried.':data?.error||'That request could not be completed.';
      throw new ServiceError(message,retry?'unavailable':'rejected',response.status);
     }
     let data;try{data=await response.json();}catch{throw new ServiceError('The service returned an unexpected response. Local play is still available.','invalid-response',response.status);}
     report(path,data.degraded?'degraded':'ready',{attempt,status:response.status});return data;
    }catch(cause){
     error=cause instanceof ServiceError?cause:new ServiceError(cause.name==='AbortError'?'The VOID NETWORK connection timed out. Local play is ready.':'Unable to reach VOID NETWORK. Check your connection or try again later.',cause.name==='AbortError'?'timeout':'network');
     retry=retry||['timeout','network'].includes(error.kind);
    }finally{clearTimeout(timer);}
    if(post||!retry||attempt===attempts){report(path,error.kind==='rejected'?'error':'degraded',{attempt,status:error.status,kind:error.kind});console.warn('[VOID//RUNNER service]',path,error.kind,error.status||'no readable HTTP response');throw error;}
    await sleep(Math.min(config.maxBackoff,config.backoff*2**(attempt-1)));
   }
  })();
  if(!post){inflight.set(key,operation);operation.finally(()=>{if(inflight.get(key)===operation)inflight.delete(key);}).catch(()=>{});}
  return operation;
 }
 const api={config,states,request,ServiceError,report,base};if(typeof module!=='undefined')module.exports=api;else root.VoidNetwork=api;
})(globalThis);
