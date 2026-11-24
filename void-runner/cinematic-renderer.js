/* A dedicated scene and an output canvas. Timeline playback never calls campaign actions. */
(function(root){
 'use strict';
 const C=root.VoidCinema;
 async function create(parent,project,note){
  let B=root.BABYLON,assets=root.VoidAssets,view=document.createElement('canvas');
  const out=document.createElement('canvas'),g=out.getContext('2d',{alpha:false});
  const [w,h]=C.dimensions(project.resolution,project.aspect);out.width=w;out.height=h;
  out.style.cssText='display:block;max-width:100%;max-height:42vh;background:#081016;margin:auto';out.tabIndex=0;out.setAttribute('aria-label','Cinematic preview');
  parent.replaceChildren(out);let scene,engine,cam,actor,lamp,room,venue,disposeRenderer=false,display,video,groups=[],currentGroup,pipeline,record,captureTrack,session,download=null,soundCtx,recordMix,monitor;
  const sounds=new Map(),held=new Set();let time=0,playing=false,frame=0,last=performance.now(),mouse=null,yaw=0,tilt=0,free=null;
  const loaded=[];
  function dispose(){disposeRenderer=true;cancelAnimationFrame(frame);stopRecording();clearSounds();display?.getTracks().forEach(t=>t.stop());video?.pause();soundCtx?.close().catch(()=>{});
   venue?.dispose();for(const resource of loaded)resource.dispose();scene?.dispose();engine?.dispose();if(download)URL.revokeObjectURL(download);}
  function remember(container){if(disposeRenderer){container.dispose();throw Error('Preview closed.');}loaded.push(container);return container;}
  async function model(path,x=0,z=0,height){
   const src='assets/models/'+path,container=remember(await assets.loadContainer({src},scene,null,'cinema:'+src));
   const instance=container.instantiateModelsToScene(n=>n),node=new B.TransformNode('cinematic-instance',scene);
   for(const m of instance.rootNodes)m.parent=node;
   if(height){const box=node.getHierarchyBoundingVectors(true),size=box.max.y-box.min.y;if(size>.001){node.scaling.setAll(height/size);node.position.y=-box.min.y*node.scaling.y;}}
   node.position.x=x;node.position.z=z;return {node,groups:instance.animationGroups};
  }
  function graphics(){
   engine=new B.Engine(view,true,{preserveDrawingBuffer:true,stencil:true});if(Math.max(w,h)>engine.getCaps().maxTextureSize)throw Error('Resolution exceeds this renderer’s texture limit.');
   engine.setSize(w,h);assets?.useMeshoptLocally?.();
   if(project.place==='Blackrock camera feed'){const feed=project.feed&&root.VoidCinemaEditor?.feeds().find(f=>f.id===project.feed);
    if(project.feed&&!feed)throw Error('This mission feed is no longer available.');
    room=root.VoidCultRoomBuild.create(engine,{quality:'low',scene:feed?.scene?structuredClone(feed.scene):undefined});scene=room.scene;}
   else scene=new B.Scene(engine);
   cam=new B.FreeCamera('cinema-camera',new B.Vector3(1,2,-6),scene);cam.inputs.clear();cam.minZ=.03;cam.maxZ=2400;scene.activeCamera=cam;
   lamp=new B.HemisphericLight('cinema-fill',new B.Vector3(.2,1,-.3),scene);lamp.intensity=1;
   if(!room)scene.clearColor=new B.Color4(.022,.047,.066,1);
  }
  async function share(){
   if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Tab capture is unavailable in this browser.');
   const stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'browser'},audio:true,preferCurrentTab:false,selfBrowserSurface:'exclude'});
   if(disposeRenderer){stream.getTracks().forEach(t=>t.stop());return;}
   display=stream;video=document.createElement('video');video.muted=true;video.srcObject=stream;await video.play();
   const audioTracks=stream.getAudioTracks();if(audioTracks.length){audio();soundCtx.createMediaStreamSource(new MediaStream(audioTracks)).connect(recordMix);}
   stream.getVideoTracks()[0].onended=()=>{playing=false;stopRecording();note('Tab sharing ended.');};
  }
  function audio(){
   if(!soundCtx){soundCtx=new AudioContext();recordMix=soundCtx.createMediaStreamDestination();monitor=soundCtx.createGain();monitor.connect(soundCtx.destination);}
   if(soundCtx.state==='suspended')soundCtx.resume().catch(()=>{});return soundCtx;
  }
  function clearSounds(){for(const s of sounds.values()){s.el.pause();s.el.removeAttribute('src');s.el.load();s.source.disconnect();s.gain.disconnect();}sounds.clear();}
  function syncSound(t){
   const active=[...C.on(project,'Music',t),...C.on(project,'Dialogue',t),...C.on(project,'Sound effects',t)].filter(c=>c.src);
   const live=new Set(active.map(c=>c.id));
   for(const [id,s] of sounds)if(!live.has(id)){s.el.pause();s.el.removeAttribute('src');s.el.load();s.source.disconnect();s.gain.disconnect();sounds.delete(id);}
   if(!project.clips.some(c=>c.src))return;
   const ctx=audio();
   for(const c of active){if(sounds.has(c.id))continue;
    const el=new Audio();el.crossOrigin='anonymous';el.src=root.VoidSoundStudio.mediaUrl(c.src);const source=ctx.createMediaElementSource(el),gain=ctx.createGain();gain.gain.value=c.volume*(root.VoidSoundStudio.project.mix.cinematic??1);
    source.connect(gain);gain.connect(recordMix);gain.connect(monitor);sounds.set(c.id,{el,source,gain});
    const begin=()=>{if(!sounds.has(c.id))return;el.currentTime=Math.min(Math.max(0,time-c.start+c.offset),Math.max(0,el.duration-.02));el.play().catch(e=>note(e.message));};
    el.addEventListener('loadedmetadata',begin,{once:true});el.onerror=()=>note('A timeline recording could not be loaded.');
   }
  }
  function stopRecording(){if(record?.state==='recording')record.stop();}
  async function exportVideo(type){
   if(record&&record.state!=='inactive')throw Error('Recording already in progress.');
   if(!C.formats().includes(type)||!out.captureStream)throw Error('The selected encoder is unavailable.');
   if(project.place==='Gameplay tab'&&!video)throw Error('Share a gameplay tab before recording.');
   const duration=C.span(project);if(!duration)throw Error('Add a clip before recording.');
   const hasAudio=project.clips.some(c=>c.src)||display?.getAudioTracks().length;
   if(hasAudio){const candidate=C.formats(true).find(t=>t.split(';')[0]===type.split(';')[0]);if(!candidate)throw Error('This encoder cannot include the soundtrack.');type=candidate;}
   const ctx=hasAudio?audio():null;
   if(ctx&&ctx.state!=='running')await Promise.race([ctx.resume(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Audio device unavailable. Enable audio before exporting the soundtrack.')),5000))]);
   const stream=out.captureStream(project.fps);captureTrack=stream.getVideoTracks()[0];
   let silence;
   if(hasAudio){
    // Keep the encoder clock running before the first audible cue.
    silence=ctx.createConstantSource();silence.offset.value=0;silence.connect(recordMix);silence.start();
    for(const a of recordMix.stream.getAudioTracks())stream.addTrack(a.clone());
   }
   let r;try{r=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:Math.min(50000000,Math.round(w*h*project.fps*.16))});}
   catch(e){silence?.stop();silence?.disconnect();stream.getTracks().forEach(t=>t.stop());throw e;}
   const chunks=[];let size=0,failed='',started=false;
   const startupTimer=setTimeout(()=>{if(!started){failed='The browser encoder did not start. Try another format or check your media device.';stopRecording();}},8000);
   session=new Promise((resolve,reject)=>{r.ondataavailable=e=>{if(!e.data.size)return;size+=e.data.size;if(size>300*1024*1024){failed='Recording exceeded 300 MiB.';stopRecording();}else chunks.push(e.data);};
    r.onerror=e=>{failed=e.error?.message||'Browser encoder failed.';note(failed);};
    r.onstop=()=>{captureTrack=null;clearTimeout(startupTimer);silence?.stop();silence?.disconnect();stream.getTracks().forEach(t=>t.stop());if(failed||!chunks.length||disposeRenderer){reject(Error(failed||'The encoder returned no video. Try a different format or lower resolution.'));return;}
     if(download)URL.revokeObjectURL(download);const blob=new Blob(chunks,{type:r.mimeType});download=URL.createObjectURL(blob);resolve({url:download,blob,extension:r.mimeType.includes('mp4')?'mp4':'webm'});};});
   record=r;playing=false;seek(0);
   r.onstart=()=>{started=true;clearTimeout(startupTimer);last=performance.now();playing=true;};
   r.start(250);draw(0);return session;
  }
  function seek(t){time=Math.min(C.span(project),Math.max(0,t));clearSounds();draw(time);}
  function stop(){playing=false;stopRecording();clearSounds();}
  function projectScene(t,dt){
   room?.tick(t);
   const move=C.on(project,'Movement',t).at(-1),anim=C.on(project,'Animation',t).at(-1);
   if(actor){if(move){const k=(t-move.start)/move.duration;actor.position.set(move.x+(move.toX-move.x)*k,move.y+(move.toY-move.y)*k,move.z+(move.toZ-move.z)*k);}else actor.position.copyFrom(actor.metadata.origin);
    const next=groups.find(g=>g.name.toLowerCase()===anim?.clip.toLowerCase());if(currentGroup!==next){currentGroup?.stop();currentGroup=next;if(next){next.start(true);next.pause();}}
    if(next){const fps=next.targetedAnimations[0]?.animation.framePerSecond||30;next.goToFrame(next.from+(t-anim.start)*fps%Math.max(1,next.to-next.from));}}
   const shot=C.on(project,'Camera',t).at(-1)||project.clips.find(c=>c.track==='Camera');
   if(shot){let [x,y,z]=C.camera(shot,t);let focus=new B.Vector3(shot.targetX,shot.targetY,shot.targetZ);
    if(shot.mode==='Hacked camera'&&room){const it=root.VoidCultRoom.ROOM.camera;x=it.x;y=it.y;z=it.z;focus.set(it.lookX,it.lookY,it.lookZ);}
    if(shot.mode==='Orbit'){const angle=(t-shot.start)/shot.duration*2*Math.PI;x=focus.x+Math.cos(angle)*Math.max(1,Math.abs(x));z=focus.z+Math.sin(angle)*Math.max(1,Math.abs(z));}
    if(['Follow NPC','Follow player','First person','Third person'].includes(shot.mode)&&actor){focus=actor.position.clone();focus.y+=1.5;x+=focus.x;y+=focus.y;z+=focus.z;
     if(shot.mode==='First person'){x=focus.x;y=focus.y;z=focus.z;focus.z+=2;}
     if(shot.mode==='Third person'){x=focus.x+1;y=focus.y+.7;z=focus.z-3;}}
    if(shot.mode==='Free'){free??=new B.Vector3(x,y,z);const speed=Math.max(.02,dt)*3,forward=(held.has('KeyW')?1:0)-(held.has('KeyS')?1:0),side=(held.has('KeyD')?1:0)-(held.has('KeyA')?1:0);
     free.x+=speed*(forward*Math.sin(yaw)+side*Math.cos(yaw));free.z+=speed*(forward*Math.cos(yaw)-side*Math.sin(yaw));({x,y,z}=free);focus.set(x+Math.sin(yaw),y+tilt,z+Math.cos(yaw));}else free=null;
    cam.position.set(x+shot.shake*.035*Math.sin(29*t),y+shot.shake*.03*Math.sin(37*t),z);cam.setTarget(focus);cam.rotation.y+=shot.yaw*Math.PI/180;cam.rotation.x+=shot.pitch*Math.PI/180;cam.fov=Math.min(2.6,Math.max(.12,shot.fov*Math.PI/180/shot.zoom));
    if(shot.focus&&!pipeline){pipeline=new B.DefaultRenderingPipeline('cinema-focus',false,scene,[cam]);pipeline.fxaaEnabled=false;}
    if(pipeline){pipeline.depthOfFieldEnabled=shot.focus>0;if(shot.focus>0)pipeline.depthOfField.focusDistance=shot.focus*1000;}
   }
   const light=C.on(project,'Lighting',t).at(-1),env=C.on(project,'Environment',t).at(-1);
   const hour=project.hour??21,daylight=Math.max(0,Math.sin((hour-6)*Math.PI/12));
   lamp.intensity=light?.brightness??(1+daylight*.8);lamp.diffuse=B.Color3.FromHexString(light?.color||(daylight>.15?'#fff1d5':'#dbe8ff'));
   venue?.tick(t,cam);
   if(env){scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogColor=B.Color3.FromHexString(env.color);scene.fogDensity=env.fog;}else if(!room&&!venue)scene.fogMode=B.Scene.FOGMODE_NONE;
   scene.render();g.drawImage(view,0,0,w,h);
  }
  function draw(t,dt=0){
   if(disposeRenderer)return;if(video){if(video.readyState>=2)g.drawImage(video,0,0,w,h);}else if(scene)projectScene(t,dt);
   for(const c of C.on(project,'Text',t)){g.textAlign='center';g.font='600 '+Math.round(h*.045)+'px sans-serif';g.fillStyle=c.color;g.fillText(c.text,w/2,h*.87,w*.92);}
   for(const c of C.on(project,'Transition',t)){const f=(t-c.start)/c.duration;g.globalAlpha=c.kind==='Fade in'?1-f:f;g.fillStyle=c.color;g.fillRect(0,0,w,h);g.globalAlpha=1;}
   captureTrack?.requestFrame?.();
  }
  function tick(n){if(disposeRenderer)return;const dt=Math.max(0,(n-last)/1000);last=n;
   if(playing){time=Math.min(C.span(project),time+dt);syncSound(time);if(time>=C.span(project)){draw(Math.max(0,time-.0001),dt);stop();}}
   draw(time,dt);frame=requestAnimationFrame(tick);}
  out.onpointerdown=e=>{out.focus();mouse=[e.clientX,e.clientY];out.setPointerCapture(e.pointerId);};out.onpointerup=()=>mouse=null;
  out.onpointermove=e=>{if(!mouse)return;yaw+=(e.clientX-mouse[0])*.006;tilt=Math.max(-1.3,Math.min(1.3,tilt-(e.clientY-mouse[1])*.006));mouse=[e.clientX,e.clientY];};
  out.onkeydown=e=>{if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){held.add(e.code);e.preventDefault();e.stopPropagation();}};out.onkeyup=e=>held.delete(e.code);out.onblur=()=>{held.clear();mouse=null;};
  try{
   if(project.place==='Gameplay tab')await share();
   else{
    if(root.VoidCinemaLocations?.locations[project.place]){venue=await root.VoidCinemaLocations.open(project.place);B=venue.B;view=venue.canvas;assets=venue.assets;}
    graphics();
    if(venue)await venue.build(scene,'low');
    else if(project.place==='Meridian Station'){const station=root.VoidMeridian.build(scene,null,{occupied:true});station.scaling.setAll(.025);}
    else if(project.place==='Kestrel spacecraft')await model('ships/kestrel-low.glb',0,0,1.8);
    else if(!room){await model('district-interior/district_vestibule_floor_6m.glb');
     if(project.place==='Arcade set')await model('district-interior/district_arcade_cabinet_1m.glb',0,0,2);else{await model('district-interior/district_shop_counter_8m.glb',0,1,1);await model('district-interior/district_scanner_kiosk_1m.glb',-1,0,1.6);}}
    if(project.actor!=='none'){let id=project.actor;if(id==='saved-player'){id=root.VoidAccount?.character?.model||'district-resident';if(!/^[a-z][a-z0-9-]{0,48}$/.test(id))throw Error('Choose a packaged performer for this player appearance.');}
     const result=await model('crowd/'+id+'.glb',0,0,1.75);actor=result.node;actor.metadata={origin:actor.position.clone()};groups=result.groups;}
    if(room){await room.loaded;if(room.failed)throw Error('The camera feed actors could not load.');}
    await scene.whenReadyAsync();
   }
   draw(0);frame=requestAnimationFrame(tick);
   return {seek,stop,dispose,exportVideo,get time(){return time;},get playing(){return playing;},get animations(){return groups.map(g=>g.name);},
    play(){if(time>=C.span(project))seek(0);if(project.clips.some(c=>c.src))audio();playing=true;last=performance.now();},pause(){playing=false;clearSounds();}};
  }catch(e){dispose();throw e;}
 }
 root.VoidCinemaRenderer={create};
})(globalThis);
