// Edits an isolated copy. The caller alone decides when to save and publish a catalog.
(function(root){
 'use strict';
 const examples={
  energy:['District charge','stimulants','cameraMotion','runSpeed',.18],
  coffee:['Synthetic coffee','beverages','colorShift','movementControl',.12],
  focus:['Signal focus','stimulants','tunnelVision','movementControl',.16],
  club:['NULL afterglow','beverages','chromaticAberration','walkSpeed',-.08],
  experimental:['Echo slip','substances','audioEcho','movementControl',-.13]
 };
 function example(key,id){
  const [name,category,effect,stat,amount]=examples[key],R=root.VoidConsumables,it=R.newItem(id,name);
  it.category=category;it.description='Fictional District consumable.';const first=R.newEffect(effect),after=R.newEffect('colorShift','recovery');
  Object.assign(first,{delay:1,duration:35,fadeIn:6,fadeOut:8,intensity:.45});Object.assign(after,{delay:32,duration:12,fadeIn:3,fadeOut:6,intensity:.17});
  it.consumable={effects:[first,after],modifiers:[{stat,amount,delay:3,duration:30}]};return it;
 }
 function open(item,presets,apply,allowed){
  const spec=root.VoidConsumableSpec,R=root.VoidConsumables,renderer=root.VoidConsumableRenderer;
  const draft=R.clone(item.consumable||{effects:[],modifiers:[]}),library=R.clone(presets),dialog=document.createElement('dialog');
  dialog.setAttribute('aria-label','Consumables Studio');dialog.style.cssText='color:#d6f3ed;background:#0b171d;border:1px solid #55999d;width:min(900px,94vw);max-height:88vh;overflow:auto';
  dialog.innerHTML='<h2>Consumables Studio</h2><p data-name></p><label>Effect <select data-types></select></label><button data-add>Add effect</button><label>Gameplay stat <select data-stats></select></label><button data-mod>Add modifier</button>'+
   '<div data-layers></div><h3>Effect timeline</h3><canvas data-timeline width="600" height="90" style="width:100%;height:90px"></canvas><label>Elapsed seconds <input data-time type="range" step=".05" min="0" value="0"></label> <output data-clock></output>'+
   '<div><button data-play>Play</button> <button data-restart>Restart</button> <button data-stop>Stop all effects</button> <label><input type="checkbox" data-compare> Before effects</label></div>'+
   '<h3>3D preview</h3><label>Scene <select data-place><option value="store">District store</option><option value="arcade">Arcade cabinet</option><option value="cult">Blackrock camera room</option></select></label> <button data-reset>Reset scene</button> <button data-audio>Audition audio</button>'+
   '<div data-view></div><fieldset data-access><legend>Effect accessibility</legend></fieldset>'+
   '<h3>Presets</h3><select data-presets aria-label="Effect presets"></select> <button data-load>Apply preset</button> <label>Preset name <input data-presetname maxlength="60"></label> <button data-savepreset>Save preset</button>'+
   '<p role="status"></p><button data-apply>Apply to item draft</button> <button data-close>Cancel</button>';
  const q=s=>dialog.querySelector(s),el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
  document.body.append(dialog);dialog.showModal();q('[data-name]').textContent=item.name;
  const option=(select,value,label)=>{const n=el('option',label);n.value=value;select.append(n);};
  const opts=(select,obj)=>{for(const [id,label] of Object.entries(obj))option(select,id,label);};
  const status=s=>q('[role=status]').textContent=s;
  opts(q('[data-types]'),Object.fromEntries(Object.entries(spec.effects).map(([k,v])=>[k,v.label])));
  opts(q('[data-stats]'),Object.fromEntries(Object.entries(spec.modifiers).filter(([,v])=>v.supported).map(([k,v])=>[k,v.label])));
  let limits=root.VoidConsumableGame?.preferences||{motion:true,distortion:true,flashing:false},time=0,playing=false,previous=performance.now(),scene=null,engine=null,room=null,camera=null,canvas=null,version=0,closed=false,raf=0,audition=null,lastAudio=0;
  function total(){return Math.max(1,...[...draft.effects,...draft.modifiers].map(v=>v.delay+v.duration));}
  function frame(){return renderer.sample(q('[data-compare]').checked?[]:[{startedAt:0,definition:draft}],time);}
  for(const [k,title] of Object.entries({motion:'Camera motion',distortion:'Distortion',flashing:'Pulsating and flashing effects'})){
   const lab=el('label'),input=el('input');input.type='checkbox';input.checked=limits[k];input.onchange=()=>{limits[k]=input.checked;root.VoidConsumableGame?.setPreference(k,input.checked);};lab.append(input,' '+title+' ');q('[data-access]').append(lab);
  }
  function range(parent,obj,key,schema,title){
   const label=el('label'),slider=el('input'),out=el('output');slider.type='range';slider.min=schema.min;slider.max=schema.max;slider.step=schema.step||.01;slider.value=obj[key];out.textContent=slider.value;
   slider.setAttribute('aria-label',title||schema.label||key);slider.oninput=()=>{obj[key]=Number(slider.value);out.textContent=slider.value;};
   label.append(title||schema.label||key,' ',slider,' ',out,' ');parent.append(label);return slider;
  }
  function action(parent,title,fn){const b=el('button',title);b.type='button';b.onclick=fn;parent.append(b);}
  function controls(){
   const box=q('[data-layers]');box.replaceChildren();
   for(const [arr,isEffect] of [[draft.effects,true],[draft.modifiers,false]])arr.forEach((layer,index)=>{
    const field=el('fieldset'),config=isEffect?spec.effects[layer.type]:spec.modifiers[layer.stat];
    field.append(el('legend',(index+1)+'. '+config.label));box.append(field);
    if(isEffect){
     range(field,layer,'intensity',spec.common.intensity,'Intensity');
     const enabled=el('input');enabled.type='checkbox';enabled.checked=layer.intensity>0;const toggle=el('label');toggle.append(enabled,' Enabled ');field.append(toggle);enabled.onchange=()=>{layer.intensity=enabled.checked?spec.common.intensity.def:0;controls();};
     const stack=el('select');stack.setAttribute('aria-label','Stacking');spec.stacking.forEach(value=>option(stack,value,value));stack.value=layer.stacking;stack.onchange=()=>layer.stacking=stack.value;field.append(stack);
     for(const [k,p] of Object.entries(config.params))range(field,layer.params,k,p);
    }else range(field,layer,'amount',{min:config.min,max:config.max},'Amount');
    for(const k of isEffect?['delay','duration','fadeIn','fadeOut','speed']:['delay','duration'])range(field,layer,k,spec.common[k],({delay:'Start delay',duration:'Duration',fadeIn:'Fade in',fadeOut:'Fade out',speed:'Speed'})[k]);
    action(field,'Duplicate',()=>{const copy=R.clone(layer);if(isEffect){copy.id=nextId(layer.type);}arr.splice(index+1,0,copy);controls();});
    action(field,'Move up',()=>{if(index){[arr[index-1],arr[index]]=[arr[index],arr[index-1]];controls();}});
    action(field,'Remove',()=>{arr.splice(index,1);controls();});
   });
   const ps=q('[data-presets]');ps.replaceChildren();library.forEach(p=>option(ps,p.id,p.name));
  }
  function nextId(type){const base=type.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());let n=1;while(draft.effects.some(v=>v.id===base+'-'+n))n++;return base+'-'+n;}
  q('[data-add]').onclick=()=>{if(draft.effects.length>=spec.limits.effects)return status('Effect limit reached.');const type=q('[data-types]').value;draft.effects.push(R.newEffect(type,nextId(type)));controls();};
  q('[data-mod]').onclick=()=>{if(draft.modifiers.length>=spec.limits.modifiers)return status('Modifier limit reached.');draft.modifiers.push({stat:q('[data-stats]').value,delay:0,duration:30,amount:.1});controls();};
  q('[data-savepreset]').onclick=()=>{const name=q('[data-presetname]').value.trim();if(!name)return status('Give the preset a name.');if(library.length>=spec.limits.presets)return status('Preset limit reached.');
   let n=1;while(library.some(p=>p.id==='preset-'+n))n++;library.push({id:'preset-'+n,name,effects:R.clone(draft.effects)});controls();};
  q('[data-load]').onclick=()=>{const p=library.find(x=>x.id===q('[data-presets]').value);if(p){draft.effects=R.clone(p.effects);controls();}};
  function disposeScene(){version++;if(room){room.dispose();room=null;}else scene?.dispose();scene=null;camera=null;engine?.dispose();engine=null;}
  async function loadScene(){
   disposeScene();const gen=version,B=root.BABYLON;if(!B)return status('3D preview requires the desktop renderer.');canvas=el('canvas');canvas.width=640;canvas.height=310;canvas.style.cssText='width:100%;height:clamp(180px,32vh,350px);touch-action:none';q('[data-view]').replaceChildren(canvas);
   try{
    engine=new B.Engine(canvas,true,{stencil:true,preserveDrawingBuffer:true});engine.setHardwareScalingLevel(root.VoidBabylon?.quality==='low'?1.5:1);
    const place=q('[data-place]').value;
    if(place==='cult'){
     room=root.VoidCultRoomBuild.create(engine,{quality:'low'});scene=room.scene;camera=room.camera;room.overview();
    }else{
     scene=new B.Scene(engine);scene.clearColor=new B.Color4(.026,.055,.072,1);camera=new B.ArcRotateCamera('catalog-preview',-.9,1.18,5,new B.Vector3(0,1,0),scene);
     camera.lowerRadiusLimit=1.1;camera.upperRadiusLimit=16;camera.attachControl(canvas,true);
     new B.HemisphericLight('studio-sky',new B.Vector3(0,1,0),scene);
     const floor=B.MeshBuilder.CreateGround('floor',{width:14,height:14},scene),mat=new B.StandardMaterial('floor-material',scene);mat.diffuseColor=new B.Color3(.16,.26,.28);floor.material=mat;
     const local=scene,src='assets/models/district-interior/'+(place==='arcade'?'district_arcade_cabinet_1m.glb':'district_scanner_kiosk_1m.glb');
     root.VoidAssets?.useMeshoptLocally?.();const contents=await root.VoidAssets.loadContainer({src},local,null,'studio:'+src);if(gen!==version)return;contents.instantiateModelsToScene();
    }
    renderer.attach(scene,()=>({frame:frame(),limits,time}));status('Drag to orbit the preview.');engine.resize();
   }catch(e){if(gen===version)status('Preview could not load. '+e.message);}
  }
  async function sound(){
   if(audition){audition.rack.dispose();audition.tone.stop();await audition.context.close();audition=null;q('[data-audio]').textContent='Audition audio';return;}
   const context=new AudioContext();await context.resume();const tone=context.createOscillator(),gain=context.createGain();tone.frequency.value=220;gain.gain.value=.035;tone.connect(gain);gain.connect(context.destination);tone.start();
   audition={context,tone,rack:root.VoidConsumableAudio.attach(context,gain,context.destination)};q('[data-audio]').textContent='Mute preview audio';
  }
  q('[data-audio]').onclick=()=>sound().catch(e=>status(e.message));q('[data-place]').onchange=loadScene;q('[data-reset]').onclick=loadScene;
  q('[data-time]').oninput=e=>{time=Number(e.target.value);playing=false;};q('[data-play]').onclick=()=>{if(time>=total())time=0;playing=!playing;};q('[data-restart]').onclick=()=>{time=0;playing=true;};q('[data-stop]').onclick=()=>{playing=false;time=total();};
  function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);disposeScene();if(audition)sound().catch(()=>{});dialog.remove();}
  q('[data-close]').onclick=close;dialog.oncancel=close;
  q('[data-apply]').onclick=()=>{if(!allowed())return close();const invalid=R.itemProblems({...item,consumable:draft},new Set([item.category]));if(invalid.length)return status(invalid.join(' '));apply(R.clone(draft),R.clone(library));close();};
  const timeline=q('[data-timeline]'),ctx=timeline.getContext('2d');timeline.onclick=e=>{time=total()*e.offsetX/timeline.clientWidth;playing=false;};
  function tick(t){
   if(closed)return;if(!allowed()){close();return;}const end=total();if(playing)time=Math.min(end,time+(t-previous)/1000);if(time>=end)playing=false;previous=t;
   q('[data-play]').textContent=playing?'Pause':'Play';q('[data-time]').max=end;q('[data-time]').value=time;q('[data-clock]').textContent=time.toFixed(1)+' s';
   ctx.clearRect(0,0,600,90);draft.effects.forEach((e,i)=>{ctx.strokeStyle='hsl('+((160+i*47)%360)+' 80% 65%)';ctx.beginPath();for(let x=0;x<=600;x+=3){const y=87-renderer.envelope(e,x*end/600)*80;if(x)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();});ctx.fillStyle='#fff';ctx.fillRect(599*time/end,0,1,90);
   if(scene&&!scene.isDisposed){room?.tick(time);scene.render();}if(audition&&t-lastAudio>260){audition.rack.apply(frame());lastAudio=t;}raf=requestAnimationFrame(tick);
  }
  controls();loadScene();raf=requestAnimationFrame(tick);
 }
 root.VoidConsumableStudio={open,examples,example};
})(globalThis);
