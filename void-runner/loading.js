/* This small script follows the static loading markup, before the game modules. */
const VoidLoading={
 stages:new Set(),value:0,target:8,started:performance.now(),graphicsLost:false,
 stage(name,label){this.stages.add(name);if(name==='account')return;this.target=Math.max(this.target,({core:8,data:20,campaign:32,art:94,ready:100})[name]||0);const status=document.getElementById('init-status');if(status)status.textContent=label;},
 ready(){clearInterval(this.timer);document.getElementById('loading-screen')?.remove();},
 graphicsState(state){
  const el=document.getElementById('service-status');if(!el)return;
  this.graphicsLost=state==='lost';
  if(state==='lost'){el.textContent='GRAPHICS CONTEXT LOST · WAITING FOR RESTORATION';el.dataset.graphics='lost';console.warn('[VOID//RUNNER graphics] context lost');}
  else{delete el.dataset.graphics;console.info('[VOID//RUNNER graphics] context restored');updateServiceStatus();}
 },
 error(message){clearInterval(this.timer);const el=document.getElementById('init-status');if(el)el.textContent=message;const retry=document.getElementById('init-retry');if(retry){retry.hidden=false;retry.onclick=()=>globalThis.VoidStartup?.retry?.()||location.reload();}const activity=document.getElementById('init-activity');if(activity)activity.textContent='LOADING STOPPED · RETRY AVAILABLE';},
 tick(){this.target=Math.min(93,this.target+(93-this.target)*.007);this.value+=(this.target-this.value)*.1;const progress=document.getElementById('init-progress');if(progress){progress.max=100;progress.value=this.value;progress.setAttribute('aria-label','Estimated loading progress');}const activity=document.getElementById('init-activity');if(activity)activity.textContent='LOADING · '+Math.floor((performance.now()-this.started)/1000)+'s elapsed';}
};
document.getElementById('init-progress')?.insertAdjacentHTML('afterend','<p id="init-activity" aria-live="off">LOADING…</p>');
VoidLoading.timer=setInterval(()=>VoidLoading.tick(),100);
VoidLoading.stage('core','LOADING FLIGHT SYSTEMS…');
addEventListener('error',event=>{
 if(document.getElementById('loading-screen')&&event.target?.tagName==='SCRIPT'&&event.target.type!=='module'&&!event.target.dataset.voidRetry)VoidLoading.error('A FLIGHT SYSTEM FAILED TO LOAD · Check your connection and retry.');
},true);
function updateServiceStatus(){
 const el=document.getElementById('service-status');if(!el)return;
 if(el.dataset.graphics==='lost')return;
 const states=Object.values(VoidNetwork.states);const pending=states.some(s=>['connecting','retrying'].includes(s.state));
 const degraded=states.some(s=>s.state==='degraded');
 const offline=navigator.onLine===false;
 el.textContent=offline?'OFFLINE · LOCAL CONTENT AVAILABLE':pending?'CONNECTING TO VOID NETWORK…':degraded?'LOCAL PLAY READY · NETWORK SERVICES OFFLINE':'';
 el.dataset.state=offline?'offline':pending?'connecting':degraded?'degraded':'ready';
}
addEventListener('void-service-state',updateServiceStatus);
addEventListener('online',updateServiceStatus);
addEventListener('offline',updateServiceStatus);
updateServiceStatus();
