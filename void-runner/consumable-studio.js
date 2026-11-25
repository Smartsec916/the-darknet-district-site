// Edits an isolated copy. The caller alone decides when to save and publish a catalog.
(function(root){
 'use strict';
 const examples={
  stamina:['Runner reserve','stimulants','colorShift','staminaRegen',.25],
  speed:['Street sprint','stimulants','lensGrade','runSpeed',.22],
  relaxation:['Quiet tea','beverages','audioFilter','walkSpeed',-.08],
  recovery:['Slow release','medical','lensGrade','healthRecovery',.02],
  medical:['District recovery patch','medical','colorShift','healthRecovery',.025],
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
 function open(item,presets,apply,allowed,items=[],catalog=null){
  const spec=root.VoidConsumableSpec,R=root.VoidConsumables,renderer=root.VoidConsumableRenderer;
  const draft=R.clone(item.consumable||{effects:[],modifiers:[]}),library=R.clone(presets),dialog=document.createElement('dialog');
  dialog.className='cs-studio';dialog.setAttribute('aria-label','Consumables Studio');dialog.style.cssText='color:#d6f3ed;background:#0b171d;border:1px solid #55999d;width:min(1100px,94vw);max-height:88vh;overflow:auto';
  dialog.innerHTML='<h2>Consumables Studio</h2><p data-name></p>'+
   '<fieldset><legend>Repeat use</legend><select aria-label="Repeat use policy" data-repeat></select><label>Replacement group <input data-group maxlength="40"></label><label>Maximum doses <input type="number" data-cap min="1" max="8"></label><label>Maximum duration in seconds <input type="number" data-maxseconds min="1" max="3600"></label></fieldset><div data-layers></div><h3>Effect timeline</h3><div data-tracks></div><div class="cs-envelope"><i data-playhead></i><canvas data-timeline width="600" height="90" style="width:100%;height:90px"></canvas></div><label>Elapsed seconds <input data-time type="range" step=".05" min="0" value="0"></label> <output data-clock></output>'+
   '<div><button data-play>Play</button> <button data-restart>Restart</button> <button data-stop>Stop</button> <select data-rate aria-label="Playback speed"><option value=".5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select> <button data-all>Preview all tracks</button> <output data-solo></output> <label><input type="checkbox" data-compare> Before effects</label></div>'+
   '<h3>3D preview</h3><label>Scene <select data-place><option value="store">Store scanner</option><option value="arcade">Arcade cabinet</option><option value="character" selected>Walking character</option><option value="cult">Blackrock first-person view</option></select></label> <button data-reset>Reset scene</button> <button data-audio>Audition audio</button>'+
   '<div data-view></div><div data-meters><label>Health <meter data-hp min="0" max="100"></meter></label> <label title="Six seconds sprinting, then six seconds recovering">Sprint reserve <meter data-stamina min="0" max="100"></meter></label> <output data-vitals></output></div><details><summary>Preview accessibility</summary><fieldset data-access><legend>Effect accessibility</legend></fieldset></details>'+
   '<h3>Presets</h3><select data-presets aria-label="Effect presets"></select> <button data-load>Apply preset</button> <label>Preset name <input data-presetname maxlength="60"></label> <button data-savepreset>Save preset</button>'+
   '<p role="status"></p><button data-apply>Apply to item draft</button> <button data-close>Cancel</button>';
  const q=s=>dialog.querySelector(s),el=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
  const workspace=el('div'),inspector=el('section'),monitor=el('section'),footer=el('div');footer.className='cs-actions';
  workspace.className='cs-workspace';monitor.className='cs-monitor';inspector.className='cs-inspector';
  const headings=[...dialog.querySelectorAll('h3')];
  inspector.append(q('[data-layers]'));monitor.append(headings[1],q('[data-place]').closest('label'),q('[data-reset]'),q('[data-audio]'),q('[data-view]'),q('[data-meters]'),q('[data-access]').closest('details'));
  monitor.append(q('[data-play]').parentNode);workspace.append(inspector,monitor);dialog.insertBefore(workspace,headings[0]);
  footer.append(q('[role=status]'),q('[data-close]'),q('[data-apply]'));dialog.append(footer);
  document.body.append(dialog);dialog.showModal();q('[data-name]').textContent=item.name;
  const option=(select,value,label)=>{const n=el('option',label);n.value=value;select.append(n);};

  const status=s=>q('[role=status]').textContent=s;
  for(const id of spec.repeatPolicies)option(q('[data-repeat]'),id,({none:'Prevent repeat use',refresh:'Refresh duration',extend:'Extend duration',intensify:'Increase intensity',independent:'Independent doses',replace:'Replace this effect group'})[id]);
  for(const [selector,key,fallback] of [['repeat','repeat','refresh'],['group','group',''],['cap','maxStacks',3],['maxseconds','maxSeconds',1800]]){
   const input=q('[data-'+selector+']');input.value=draft[key]??fallback;input.onchange=()=>draft[key]=input.type==='number'?input.valueAsNumber:input.value;
  }
  let limits={...(root.VoidConsumableGame?.preferences||{motion:true,distortion:true,flashing:false})},time=0,playing=false,previous=performance.now(),scene=null,engine=null,room=null,camera=null,canvas=null,version=0,closed=false,raf=0,audition=null,lastAudio=0;
  function total(){return Math.min(draft.maxSeconds||1800,Math.max(1,...[...draft.effects,...draft.modifiers].map(v=>v.delay+v.duration)));}
  let solo=null,walk=null,stopped=false,meters=null,chartDirty=true;
  const D=root.VoidConsumableDashboard,sounds=root.VoidConsumableAudio?.cues(root.VoidConsumableAudio.playAsset);
  let onset=null;
  function startSound(){onset?.pause();if(!q('[data-compare]').checked&&item.useSound)onset=root.VoidConsumableAudio?.playAsset(item.useSound);}

  function selected(t){return !solo||solo===t||solo===D.group(t);}
  function frame(at=time){return renderer.sample(stopped||q('[data-compare]').checked?[]:[{startedAt:0,until:total(),definition:{effects:draft.effects.filter(selected),modifiers:draft.modifiers.filter(selected)}}],at);}
  function preview(which){solo=which;stopped=false;const layer=typeof which==='object'&&which;
   time=layer?.delay??0;playing=true;meters=null;q('[data-solo]').textContent=layer?(spec.effects[layer.type]||spec.modifiers[layer.stat]).label:(which||'All tracks');}
  q('[data-all]').onclick=()=>preview(null);
  const board=D.dashboard(dialog,draft,spec,(key,category,source)=>{
   if(key){const fx=spec.effects[key],array=fx?draft.effects:draft.modifiers;
    if(array.length>=spec.limits[fx?'effects':'modifiers'])return status('Track limit reached.');
    array.push(fx?R.newEffect(key,nextId(key)):{stat:key,delay:0,duration:30,amount:Math.min(.1,spec.modifiers[key].max)});
   }else{const original=items.find(it=>it.id===source)?.consumable;if(!original)return;
    const copies={};for(const kind of ['effects','modifiers']){
     copies[kind]=R.clone(original[kind].filter(t=>D.group(t)===category));if(draft[kind].length+copies[kind].length>spec.limits[kind])return status('Copy exceeds the track limit.');
    }if(category==='health')for(const key of ['onUseHealth','onUseStamina']){if(original[key])draft[key]=original[key];}
    for(const [kind,tracks] of Object.entries(copies))for(const t of tracks){if(t.type)t.id=nextId(t.type);draft[kind].push(t);}
   }controls();
  },preview,items.filter(it=>it!==item&&it.consumable));
  if(catalog)for(const [pane,title,summary] of [
   ['properties','▤  Item properties',item.name+' · '+item.price+' credits'],
   ['vendors','⌖  Vendors and distribution',catalog.vendors.join(', ')||'No vendors assigned']
  ]){
   const card=el('details'),head=el('summary');card.className='cs-card cs-'+pane;
   head.append(el('strong',title),el('small',summary));card.append(head);q('[data-layers]').append(card);
   action(card,'Apply draft and edit '+(pane==='properties'?'properties':'vendors'),()=>{if(save())catalog.focus(pane);});
  }
  function refresh(){chartDirty=true;board.refresh();meters=null;D.timeline(q('[data-tracks]'),draft,spec,preview,controls);}
  function vitals(at){
   if(!meters){const immediate=!stopped&&!q('[data-compare]').checked&&(!solo||solo==='health');meters=[[Math.max(0,Math.min(1,.5+(immediate?draft.onUseHealth||0:0))),Math.min(1,.5+(immediate?draft.onUseStamina||0:0))]];}
   function advance(prev,t,dt){const mods=frame(t).modifiers,cap=k=>Math.min(spec.modifiers[k].max,Math.max(spec.modifiers[k].min,mods[k]||0));
    return [Math.max(0,Math.min(1,prev[0]+renderer.recoveryRate(1,cap('healthRecovery'),cap('healthLoss'),0)*dt)),cap('staminaRegen')||cap('staminaDrain')?
     renderer.staminaAfter(prev[1],t%12<6,cap('staminaRegen'),cap('staminaDrain'),dt):1];}
   const i=Math.floor(at*4);while(meters.length<=i){const t=(meters.length-1)/4;meters.push(advance(meters.at(-1),t,.25));}
   return advance(meters[i],i/4,at-i/4);
  }
  for(const [k,title] of Object.entries({motion:'Camera motion',distortion:'Distortion',flashing:'Pulsating and flashing effects'})){
   const lab=el('label'),input=el('input');input.type='checkbox';input.checked=limits[k];input.onchange=()=>{limits[k]=input.checked;};lab.append(input,' '+title+' ');q('[data-access]').append(lab);
  }
  function range(parent,obj,key,schema,title){
   const label=el('label'),slider=el('input'),numeric=el('input'),name=title||schema.label||key;
   slider.type='range';numeric.type='number';for(const input of [slider,numeric]){input.min=schema.min;input.max=schema.max;input.step=schema.step||.01;input.value=obj[key];}
   slider.setAttribute('aria-label',name);numeric.setAttribute('aria-label',name+' value');
   function sync(value){if(!Number.isFinite(value)||value<schema.min||value>schema.max)return;obj[key]=value;slider.value=value;numeric.value=value;parent.querySelector('.cs-curve')?.refresh();refresh();}
   slider.oninput=()=>sync(slider.valueAsNumber);numeric.onchange=()=>{sync(numeric.valueAsNumber);numeric.value=obj[key];};
   label.append(name,' ',slider,numeric);parent.append(label);return slider;
  }
  function action(parent,title,fn){const b=el('button',title);b.type='button';b.onclick=fn;parent.append(b);}
  function controls(){
   if(solo&&typeof solo==='object'&&![...draft.effects,...draft.modifiers].includes(solo)){solo=null;q('[data-solo]').textContent='All tracks';}
   for(const [id,box] of Object.entries(board.sections))if(id!=='timing')box.replaceChildren();
   for(const [key,label,min] of [['onUseHealth','Health on use (fraction of maximum)',-1],['onUseStamina','Stamina restored on use',0]]){
    const wrap=el('fieldset');board.sections.health.append(wrap);const settings={value:draft[key]||0};
    range(wrap,settings,'value',{min,max:1,step:.01},label);
    wrap.addEventListener('input',()=>{if(settings.value)draft[key]=settings.value;else delete draft[key];refresh();});
    wrap.addEventListener('change',()=>{if(settings.value)draft[key]=settings.value;else delete draft[key];refresh();});
   }
   for(const [arr,isEffect] of [[draft.effects,true],[draft.modifiers,false]])arr.forEach((layer,index)=>{
    const field=el('fieldset'),config=isEffect?spec.effects[layer.type]:spec.modifiers[layer.stat];
    field.append(el('legend',(index+1)+'. '+config.label));board.sections[D.group(layer)].append(field);
    if(isEffect){
     range(field,layer,'intensity',spec.common.intensity,'Intensity');
     const enabled=el('input');enabled.type='checkbox';enabled.checked=layer.intensity>0;const toggle=el('label');toggle.append(enabled,' Enabled ');field.append(toggle);enabled.onchange=()=>{layer.intensity=enabled.checked?spec.common.intensity.def:0;controls();};
     const advanced=el('details');advanced.append(el('summary','Layer parameters'));field.append(advanced);const stack=el('select');stack.setAttribute('aria-label','Stacking');spec.stacking.forEach(value=>option(stack,value,value));stack.value=layer.stacking;stack.onchange=()=>layer.stacking=stack.value;advanced.append(stack);
     for(const [k,p] of Object.entries(config.params))range(advanced,layer.params,k,p);
    }else{range(field,layer,'amount',{min:config.min,max:config.max},'Amount');layer.fadeIn??=0;layer.fadeOut??=0;}
    for(const k of isEffect?['delay','duration','fadeIn','fadeOut','speed']:['delay','duration','fadeIn','fadeOut'])range(field,layer,k,spec.common[k],({delay:'Start delay',duration:'Duration',fadeIn:'Fade in',fadeOut:'Fade out',speed:'Speed'})[k]);
    const graph=el('details');graph.append(el('summary','Intensity curve'),root.VoidConsumableCurves.editor(layer,refresh));field.append(graph);
    action(field,'Preview track',()=>preview(layer));
    action(field,'Duplicate',()=>{if(arr.length>=spec.limits[isEffect?'effects':'modifiers'])return status('Track limit reached.');const copy=R.clone(layer);if(isEffect){copy.id=nextId(layer.type);}arr.splice(index+1,0,copy);controls();});
    action(field,'Move up',()=>{if(index){[arr[index-1],arr[index]]=[arr[index],arr[index-1]];controls();}});
    action(field,'Remove',()=>{arr.splice(index,1);controls();});
   });
   refresh();const ps=q('[data-presets]'),previousPreset=ps.value;ps.replaceChildren();Object.entries(examples).forEach(([id,row])=>option(ps,'template/'+id,row[0]));library.forEach(p=>option(ps,p.id,p.name));if(previousPreset)ps.value=previousPreset;
  }
  function nextId(type){const base=type.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());let n=1;while(draft.effects.some(v=>v.id===base+'-'+n))n++;return base+'-'+n;}
  q('[data-savepreset]').onclick=()=>{const name=q('[data-presetname]').value.trim();if(!name)return status('Give the preset a name.');if(library.length>=spec.limits.presets)return status('Preset limit reached.');
   let n=1;while(library.some(p=>p.id==='preset-'+n))n++;library.push({id:'preset-'+n,name,effects:R.clone(draft.effects),modifiers:R.clone(draft.modifiers),onUseHealth:draft.onUseHealth||0,onUseStamina:draft.onUseStamina||0});controls();};
  q('[data-load]').onclick=()=>{const id=q('[data-presets]').value,p=id.startsWith('template/')?example(id.slice(9),item.id).consumable:library.find(x=>x.id===id);if(p){draft.effects=R.clone(p.effects);if(p.modifiers){draft.modifiers=R.clone(p.modifiers);for(const k of ['onUseHealth','onUseStamina']){if(p[k])draft[k]=p[k];else delete draft[k];}}controls();}};
  function disposeScene(){version++;walk=null;if(room){room.dispose();room=null;}else scene?.dispose();scene=null;camera=null;engine?.dispose();engine=null;}
  async function loadScene(){
   disposeScene();const gen=version,B=root.BABYLON;if(!B)return status('3D preview requires the desktop renderer.');canvas=el('canvas');canvas.width=640;canvas.height=310;canvas.style.cssText='width:100%;height:clamp(180px,32vh,350px);touch-action:none';q('[data-view]').replaceChildren(canvas);
   try{
    engine=new B.Engine(canvas,true,{stencil:true,preserveDrawingBuffer:true});engine.setHardwareScalingLevel(root.VoidBabylon?.quality==='low'?1.5:1);
    const place=q('[data-place]').value;
    if(place==='cult'){
     room=root.VoidCultRoomBuild.create(engine,{quality:'low'});scene=room.scene;camera=room.camera;camera.attachControl(canvas,true);await room.loaded;if(gen!==version)return;if(room.failed)throw Error(String(room.failed));
    }else{
     scene=new B.Scene(engine);scene.clearColor=new B.Color4(.026,.055,.072,1);camera=new B.ArcRotateCamera('catalog-preview',-.9,1.18,5,new B.Vector3(0,1,0),scene);
     camera.lowerRadiusLimit=1.1;camera.upperRadiusLimit=16;camera.attachControl(canvas,true);
     new B.HemisphericLight('studio-sky',new B.Vector3(0,1,0),scene);
     const floor=B.MeshBuilder.CreateGround('floor',{width:14,height:14},scene),mat=new B.StandardMaterial('floor-material',scene);mat.diffuseColor=new B.Color3(.16,.26,.28);floor.material=mat;
     const local=scene,src=place==='character'?'assets/models/crowd/regular-01.glb':'assets/models/district-interior/'+(place==='arcade'?'district_arcade_cabinet_1m.glb':'district_scanner_kiosk_1m.glb');
     root.VoidAssets?.useMeshoptLocally?.();const contents=await root.VoidAssets.loadContainer({src},local,null,'studio:'+src);if(gen!==version)return;const rig=contents.instantiateModelsToScene();if(place==='character'){walk=rig.animationGroups.find(g=>/walk$/i.test(g.name));walk?.start(true);camera.alpha=2.15;camera.beta=1.4;camera.radius=3.2;camera.setTarget(new B.Vector3(0,.94,0));}
    }
    renderer.attach(scene,()=>({frame:frame(),limits,time}));status(place==='cult'?'Drag to look around Blackrock.':'Drag to orbit the preview.');engine.resize();
   }catch(e){if(gen===version)status('Preview could not load. '+e.message);}
  }
  async function sound(){
   if(audition){const old=audition;audition=null;old.rack.dispose();old.tone.stop();await old.context.close();q('[data-audio]').textContent='Audition audio';return;}
   const context=new AudioContext();await context.resume();if(closed){await context.close();return;}const tone=context.createOscillator(),gain=context.createGain();tone.frequency.value=220;gain.gain.value=.035;tone.connect(gain);gain.connect(context.destination);tone.start();
   audition={context,tone,rack:root.VoidConsumableAudio.attach(context,gain,context.destination)};q('[data-audio]').textContent='Mute preview audio';
  }
  q('[data-audio]').onclick=()=>sound().catch(e=>status(e.message));q('[data-place]').onchange=loadScene;q('[data-reset]').onclick=loadScene;
  q('[data-compare]').onchange=()=>{onset?.pause();meters=null;};q('[data-time]').oninput=e=>{stopped=false;time=Number(e.target.value);playing=false;};q('[data-play]').onclick=()=>{stopped=false;if(time>=total())time=0;if(!playing&&time===0)startSound();playing=!playing;};q('[data-restart]').onclick=()=>{sounds?.stopAll();startSound();time=0;playing=true;stopped=false;meters=null;};q('[data-stop]').onclick=()=>{playing=false;time=0;stopped=true;meters=null;onset?.pause();sounds?.stopAll();};
  function close(){if(closed)return;closed=true;onset?.pause();sounds?.stopAll();cancelAnimationFrame(raf);disposeScene();if(audition)sound().catch(()=>{});dialog.remove();}
  q('[data-close]').onclick=close;dialog.oncancel=close;
  function save(){if(!allowed()){close();return false;}const invalid=R.itemProblems({...item,consumable:draft},new Set([item.category]));if(invalid.length){status(invalid.join(' '));return false;}apply(R.clone(draft),R.clone(library));close();return true;}
  q('[data-apply]').onclick=save;
  const timeline=q('[data-timeline]'),ctx=timeline.getContext('2d');function scrub(e){const b=timeline.getBoundingClientRect();time=total()*Math.max(0,Math.min(1,(e.clientX-b.left)/b.width));playing=false;stopped=false;}
  timeline.onpointerdown=e=>{timeline.setPointerCapture(e.pointerId);scrub(e);};timeline.onpointermove=e=>{if(timeline.hasPointerCapture(e.pointerId))scrub(e);};
  function tick(t){
   if(closed)return;if(!allowed()){close();return;}const end=total();if(playing)time=Math.min(end,time+(t-previous)/1000*Number(q('[data-rate]').value));if(playing&&!q('[data-compare]').checked&&(!solo||solo==='audio'))sounds?.tick([{item:item.id,startedAt:0,until:end,definition:item}],time);
   else sounds?.stopAll();if(time>=end)playing=false;previous=t;
   q('[data-play]').textContent=playing?'Pause':'Play';time=Math.min(time,end);q('[data-time]').max=end;q('[data-time]').value=time;q('[data-clock]').textContent=time.toFixed(1)+' / '+end.toFixed(1)+' s';
   if(chartDirty){chartDirty=false;ctx.clearRect(0,0,600,90);[...draft.effects,...draft.modifiers].forEach(e=>{ctx.strokeStyle=board.sections[D.group(e)].closest('details').style.getPropertyValue('--category');ctx.beginPath();for(let x=0;x<=600;x+=3){const y=87-renderer.envelope({intensity:1,...e},x*end/600)*80;if(x)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();});}q('[data-playhead]').style.left=(100*time/end)+'%';
   const current=frame(),mods=current.modifiers,[hp,reserve]=vitals(time);const maximum=Math.round(100*(1+Math.max(-.5,Math.min(.5,mods.maxHealth||0))));q('[data-hp]').max=maximum;q('[data-hp]').value=hp*maximum;q('[data-stamina]').value=100*reserve;
   const mobility=1-Math.min(1,mods.movementRestriction||0),speed=mobility*(1+Math.max(-.5,Math.min(.5,mods.walkSpeed||0))),run=mobility*(1+Math.max(-.5,Math.min(.5,mods.runSpeed||0)));
   const walks=root.VoidExplorer?.config||{walk:3.9,sprint:6.4};
   q('[data-vitals]').textContent=Math.round(hp*maximum)+' / '+maximum+' HP · Walk '+walks.walk+' → '+(walks.walk*speed).toFixed(1)+' m/s · Run '+walks.sprint+' → '+(walks.sprint*run).toFixed(1)+' m/s · '+(current.effects.size+Object.keys(mods).length)+' active types';
   if(walk){walk.speedRatio=speed*Number(q('[data-rate]').value);if(playing&&!walk.isPlaying)walk.play(true);if(!playing){walk.pause();const length=walk.to-walk.from;if(length>0)walk.goToFrame(walk.from+time*60*speed%length);}}
   if(scene&&!scene.isDisposed){room?.tick(time);scene.render();}if(audition&&t-lastAudio>260){audition.rack.apply(frame());lastAudio=t;}raf=requestAnimationFrame(tick);
  }
  controls();loadScene();raf=requestAnimationFrame(tick);
 }
 root.VoidConsumableStudio={open,examples,example};
})(globalThis);
