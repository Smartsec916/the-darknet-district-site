/* One startup owner. Never render the legacy exterior behind a cinematic interior. */
const VoidStartup=window.VoidStartup={started:false,starts:0,ready:null};
VoidStartup.ready=(async()=>{
 const opening=texture('vesper-people.png');
 // Only these assets are required for startup. Other destinations load in the background.
 await Promise.all([cockpitArt.ready,stationTexture.ready,opening.ready]);
 await Promise.all([cockpitArt,stationTexture,opening].map(img=>img.decode().catch(()=>{})));
 if(!cockpitArt.naturalWidth||!stationTexture.naturalWidth||!opening.naturalWidth){
  screen.innerHTML='<section class="panel"><h1>Game artwork unavailable</h1><p>A required image could not load. Check your connection, then reload this page.</p><button onclick="location.reload()">RETRY</button></section>';
  return false;
 }
 if(VoidStartup.started)return true;
 VoidStartup.started=true;VoidStartup.starts++;
 title();if(location.hash==='#market'&&state.completed>=1)market();
 last=performance.now();requestAnimationFrame(loop);
 return true;
})();
