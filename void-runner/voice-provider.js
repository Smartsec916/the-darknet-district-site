/* Optional same-origin generated clips. Configure a server endpoint, never API keys. */
(function(root){
 function create({endpoint,version='1',maxEntries=64}={}){
  const url=new URL(endpoint,location.href);if(url.origin!==location.origin)throw Error('Voice endpoint must be same-origin.');
  let controller=null,source=null;const cache=new Map();
  function cancel(){controller?.abort();controller=null;try{source?.stop();}catch{}source=null;}
  async function speak({characterId,text,profile,bus,position}){
   cancel();if(!bus)return;const context=bus.context,active=new AbortController();controller=active;
   const timer=setTimeout(()=>active.abort(),4000),key=version+':'+characterId+':'+text;
   try{let data=cache.get(key);if(!data){const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character:characterId,text,voice:profile.voiceId||characterId,version}),signal:active.signal});if(!response.ok)throw Error('Voice service '+response.status);const bytes=await response.arrayBuffer();if(bytes.byteLength>4000000)throw Error('Voice clip too large');data=await context.decodeAudioData(bytes);if(active.signal.aborted)return;cache.set(key,data);if(cache.size>maxEntries)cache.delete(cache.keys().next().value);}
    if(active.signal.aborted)return;source=context.createBufferSource();source.buffer=data;const gain=context.createGain();gain.gain.value=profile.volume||1;source.connect(gain);let panner;if(position){panner=context.createPanner();panner.distanceModel='inverse';panner.refDistance=2;panner.maxDistance=25;panner.positionX.value=position.x;panner.positionY.value=position.y;panner.positionZ.value=position.z;gain.connect(panner);panner.connect(bus);}else gain.connect(bus);clearTimeout(timer);const playing=source;await new Promise(resolve=>{playing.onended=resolve;playing.start();});playing.disconnect();gain.disconnect();panner?.disconnect();
   }finally{clearTimeout(timer);if(controller===active)controller=null;}
  }
  return {speak,cancel};
 }
 root.VoidVoiceProvider={create};
})(globalThis);
