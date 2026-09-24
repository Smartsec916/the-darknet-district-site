/* One startup owner. Never render the legacy exterior behind a cinematic interior. */
const VoidStartup=window.VoidStartup={started:false,starts:0,ready:null};
VoidStartup.ready=(async()=>{
 VoidLoading.stage('data','GAME DATA READY');
 VoidLoading.stage('campaign','CAMPAIGN RESTORED · LOADING ESSENTIAL ART');
 await VoidBabylon.prepareSpace(state.location);
 modernMenuReady=true;
 VoidLoading.stage('art','MODERN ENVIRONMENT READY');
 if(VoidStartup.started)return true;
 VoidStartup.started=true;VoidStartup.starts++;
 title();
 VoidLoading.stage('ready','READY · OPTIONAL SERVICES CONTINUE IN BACKGROUND');VoidLoading.ready();
 last=performance.now();requestAnimationFrame(loop);
 return true;
})().catch(error=>{console.error('[VOID//RUNNER startup]',error);VoidLoading.error('INITIALIZATION FAILED · Reload to retry.');return false;});
