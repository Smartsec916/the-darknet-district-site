/* This small script follows the static loading markup, before the game modules. */
const VoidLoading={stages:new Set(),stage(name,label){this.stages.add(name);const progress=document.getElementById('init-progress'),status=document.getElementById('init-status');if(progress)progress.value=this.stages.size;if(status)status.textContent=label;},ready(){document.getElementById('loading-screen')?.remove();},error(message){const el=document.getElementById('init-status');if(el)el.textContent=message;document.getElementById('init-retry').hidden=false;}};
VoidLoading.stage('core','LOADING FLIGHT SYSTEMS…');
addEventListener('error',event=>{
 if(event.target?.tagName==='SCRIPT'&&event.target.type!=='module')VoidLoading.error('A FLIGHT SYSTEM FAILED TO LOAD · Check your connection and retry.');
},true);
addEventListener('void-service-state',()=>{
 const el=document.getElementById('service-status');if(!el)return;
 const states=Object.values(VoidNetwork.states);const pending=states.some(s=>['connecting','retrying'].includes(s.state));
 const degraded=states.some(s=>s.state==='degraded');
 el.textContent=pending?'CONNECTING TO VOID NETWORK…':degraded?'LOCAL PLAY READY · NETWORK SERVICES OFFLINE':'';el.dataset.state=pending?'connecting':degraded?'degraded':'ready';
});
