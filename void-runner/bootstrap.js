/* One startup owner. Never render the legacy exterior behind a cinematic interior. */
const VoidStartup=window.VoidStartup={started:false,starts:0,ready:null};
let pendingStartup=null;
function beginStartup(){
 if(pendingStartup)return pendingStartup;
 pendingStartup=(async()=>{
 VoidLoading.stage('data','GAME DATA READY');
 VoidLoading.stage('campaign','CAMPAIGN RESTORED · LOADING ESSENTIAL ART');
 await VoidBabylon.prepareMenu();
 modernMenuReady=true;
 VoidLoading.stage('art','MODERN ENVIRONMENT READY');
 if(VoidStartup.started)return true;
 VoidStartup.started=true;VoidStartup.starts++;
 title();
 VoidLoading.stage('ready','READY · OPTIONAL SERVICES CONTINUE IN BACKGROUND');VoidLoading.ready();
 globalThis.VoidCache?.warm?.();
 last=performance.now();requestAnimationFrame(loop);
 return true;
})().catch(error=>{console.error('[VOID//RUNNER startup]',error);VoidStartup.error={message:error.message,phase:error.phase||'initialization',asset:error.asset||null};VoidLoading.error('INITIALIZATION FAILED · '+(error.phase?error.phase.toUpperCase()+' · ':'')+error.message+' · Retry when ready.');return false;}).finally(()=>{pendingStartup=null;});
 return pendingStartup;
}
VoidStartup.retry=()=>{if(VoidStartup.started)return VoidStartup.ready;const button=document.getElementById('init-retry');if(button)button.hidden=true;VoidStartup.error=null;VoidStartup.ready=beginStartup();return VoidStartup.ready;};
VoidStartup.ready=beginStartup();
