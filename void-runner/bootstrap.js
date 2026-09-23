/* One startup owner. Never render the legacy exterior behind a cinematic interior. */
const VoidStartup=window.VoidStartup={started:false,starts:0,ready:null};
VoidStartup.ready=(async()=>{
 VoidLoading.stage('data','GAME DATA READY');
 VoidLoading.stage('campaign','CAMPAIGN RESTORED · LOADING ESSENTIAL ART');
 const opening=texture('vesper-people.png');
 // Only these assets are required for startup. Other destinations load in the background.
 await Promise.all([cockpitArt.ready,opening.ready]);
 await Promise.all([cockpitArt,opening].map(img=>img.decode().catch(()=>{})));
 if(!cockpitArt.naturalWidth||!opening.naturalWidth){
  VoidLoading.error('ESSENTIAL ARTWORK FAILED · Check your connection and retry.');
  screen.innerHTML='<section class="panel"><h1>Game artwork unavailable</h1><p>A required image could not load. Check your connection, then reload this page.</p><button onclick="location.reload()">RETRY</button></section>';
  return false;
 }
 VoidLoading.stage('art','ESSENTIAL ART DECODED');
 if(VoidStartup.started)return true;
 VoidStartup.started=true;VoidStartup.starts++;
 title();
 VoidLoading.stage('ready','READY · OPTIONAL SERVICES CONTINUE IN BACKGROUND');VoidLoading.ready();
 last=performance.now();requestAnimationFrame(loop);
 return true;
})().catch(error=>{console.error('[VOID//RUNNER startup]',error);VoidLoading.error('INITIALIZATION FAILED · Reload to retry.');return false;});
