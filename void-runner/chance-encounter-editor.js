(function(root){
 'use strict';
 const conversations=[['arrival','Arrival'],['free','Free Lace'],['be_kade','Be Kade'],['wait','Waiting for choice']];
 const branchOf=line=>conversations.find(([key])=>line.id.startsWith('lace_'+key+'_'))?.[0];
 const branchLines=(graph,branch)=>graph.dialogue.filter(line=>branchOf(line)===branch);
 function nextLineId(graph,branch,reserved=new Set()){
  const prefix='lace_'+branch+'_';let n=1;
  let id=prefix+String(n).padStart(2,'0');
  while(reserved.has(id)||graph.dialogue.some(line=>line.id===id))id=prefix+String(++n).padStart(2,'0');
  return id;
 }
 function insertLine(graph,line,branch,before){
  const last=branchLines(graph,branch).at(-1);
  const index=before?graph.dialogue.indexOf(before):last?graph.dialogue.indexOf(last)+1:graph.dialogue.length;
  graph.dialogue.splice(index,0,line);
 }
 const colors={trigger:'#e3be52',move:'#71aaff',item:'#6cd598',choice:'#c29af7',animation:'#f4a563',cast:'#6cd598',location:'#65d5ce',end:'#f17d84'};
 function element(tag,text){
  const e=document.createElement(tag);
  if(text!==undefined)e.textContent=text;
  return e;
 }
 function button(label,action){
  const b=element('button',label);
  b.type='button';b.onclick=action;return b;
 }
 function field(host,label,input){
  const l=element('label',label+' ');
  input.setAttribute('aria-label',label);l.append(input);host.append(l);return input;
 }
 function select(options,value,change){
  const s=element('select');
  for(const [key,label] of options)s.add(new Option(label,key));
  s.value=value;s.onchange=()=>change(s.value);return s;
 }
 function input(value,change,type='text'){
  const i=element('input');i.type=type;i.value=value??'';
  i.oninput=()=>change(type==='number'?i.valueAsNumber:i.value);return i;
 }
 async function mount(host,tools){
  const uid=tools.uid,api=root.VoidChanceEncounter;
  const current=()=>host.isConnected&&tools.authorized&&uid===tools.uid;
  const [catalog,seed,soundLibrary]=await Promise.all([tools.request('developer/chance-encounters'),fetch(tools.seedUrl||'void-runner/chance-encounter-seed.json').then(r=>{if(!r.ok)throw Error('Could not load Pleasure Breach.');return r.json();}),
   fetch(tools.soundLibraryUrl||'void-runner/sound-library.json').then(r=>r.ok?r.json():[]).then(list=>Array.isArray(list)?list:[]).catch(()=>[])]);
  if(!current())return;
  const records=new Map(catalog.encounters.map(r=>[r.id,r]));
  if(!records.has(seed.id))records.set(seed.id,{id:seed.id,revision:0,draft:seed});
  let id,selected,dirty=false,busy=false,status='';
  let working,addBranch='arrival',dialogueOpen=!tools.mobile,preview,previewSounds,audition;
  const durationLabels=[];
  const checked=new Set(),closed=new Set();
  const record=()=>records.get(id),graph=()=>working;
  const mark=()=>{dirty=true;tools.onDirtyChange?.(true);message.textContent='Unsaved draft';for(const refresh of durationLabels)refresh();};
  const message=element('p');message.setAttribute('role','status');
  function choose(key){checked.clear();closed.clear();id=key;working=api.withWaitingDialogue(structuredClone(record()?.draft));selected=graph()?.start;dirty=false;tools.onDirtyChange?.(false);status='';draw();}
  function newGraph(duplicate){
   if(dirty&&!confirm('Discard the unsaved changes?'))return;
   const key='enc-'+crypto.randomUUID().slice(0,12);
   const draft=structuredClone(duplicate?graph():seed);
   if(!duplicate){
    draft.nodes=[{id:'start',kind:'trigger',name:'Encounter begins',edges:[{to:'meet'}]},
     {id:'meet',kind:'cast',name:'Talk to the cast',edges:[{to:'end'}]},{id:'end',kind:'end',name:'End encounter',edges:[]}];
    draft.start='start';draft.dialogue=[];draft.cast=[];
    draft.conditions={chance:100,intervalSeconds:15,radius:20,quarter:seed.playtest.quarter};
    draft.playtest={scene:'sacramento',quarter:seed.playtest.quarter,x:seed.playtest.x,z:seed.playtest.z,yaw:seed.playtest.yaw,pitch:0,delaySeconds:0};
    for(const key of ['item','residence','placement','roleplayClip','dropPosition','decisionAfter'])delete draft[key];
   }
   draft.id=key;draft.name=duplicate?draft.name+' (copy)':'New encounter';draft.enabled=false;
   records.set(key,{id:key,revision:0,draft});choose(key);mark();
  }
  async function send(action){
   if(!current()||busy)return;
   const g=graph(),r=record();
   if(action==='save'){
    const errors=api.animationSpeedProblems(g);
    if(errors.length){message.textContent=errors.join(' ');return;}
   }
   if(action==='publish'){
    const invalidSound=api.soundLists(g).some(cues=>Array.isArray(cues)&&cues.some(cue=>!soundLibrary.includes(cue?.src)));
    const errors=[...api.validate(g),...api.castProblems(g,true),...(invalidSound?['Choose sound files from the packaged audio library.']:[])];
    if(errors.length){message.textContent=[...new Set(errors)].join(' ');return;}
    if(!confirm('Publish '+g.name+' for all players?'))return;
   }
   if(action==='unpublish'&&!confirm('Unpublish '+g.name+' and keep it as a draft?'))return;
   if(action==='delete'&&!confirm('Delete '+g.name+' and remove it from live encounters?'))return;
   busy=true;host.inert=true;
   try{
    if(action==='save'||action==='publish'){
     const recordings=[...(g.dialogue||[]),...(g.savedActions||[]).flat()].flatMap(line=>line.recording?[line.recording]:[]);
     if(recordings.length)await root.VoidVoiceImports.upload((path,body)=>tools.request(path,body),recordings);
    }
    const payload={action,id,revision:r.revision};
    if(action==='save'||action==='publish')payload.graph=g;
    const saved=await tools.request('developer/chance-encounters',payload);
    if(!current())return;
    records.set(id,saved);
    if(action==='unpublish'){
     status=dirty?'Unpublished · Unsaved draft changes':'Unpublished · Draft';draw();return;
    }
    dirty=false;tools.onDirtyChange?.(false);
    if(action==='delete')id=undefined;
    working=api.withWaitingDialogue(structuredClone(record()?.draft));if(action==='delete')selected=working?.start;
    status=action==='publish'?'Published revision '+saved.revision:action==='save'?'Saved draft':'Encounter deleted';draw();
   }catch(e){message.textContent=e.message;}finally{busy=false;host.inert=false;}
  }
  function draw(){
   preview?.abort();previewSounds?.dispose();audition?.dispose();durationLabels.length=0;
   host.replaceChildren();
   const bar=element('div');bar.className='dev-actions';host.append(bar);
   const entries=[...records.values()].filter(r=>!r.deleted);
   if(entries.length){
    const picker=select([['','Select an encounter'],...entries.map(r=>[r.id,r.draft.name])],id??'',key=>{if(!dirty||confirm('Leave this unsaved draft?'))choose(key);else draw();});
    picker.setAttribute('aria-label','Select an encounter');
    picker.options[0].disabled=true;
    bar.append(picker);
   }
   bar.append(button('New encounter',()=>newGraph(false)));
   const g=graph();if(!g){message.textContent=status;host.append(message);return;}
   bar.append(button('Duplicate',()=>newGraph(true)),button('Save draft',()=>send('save')));
   if(!tools.mobile)bar.append(button('Publish',()=>send('publish')),button('Delete',()=>send('delete')));
   const launch=async(start)=>{
    const errors=api.animationSpeedProblems(g);
    if(errors.length){message.textContent=errors.join(' ');return;}
    try{
     sessionStorage.setItem('chance-playtest-draft',JSON.stringify({uid,graph:g,revision:record().revision,dirty,selected}));
     await root.VoidEncounterGame.playtest(structuredClone(g),start);
    }
    catch(e){message.textContent=e.message;}
   };
   if(!tools.mobile)bar.append(button('▶ Play This Chance Encounter',()=>launch(g.start)),button('Play From Selected Node',()=>launch(selected||g.start)));
   const startHere=(label,action)=>{
    const control=button('Start from this point',action);
    control.setAttribute('aria-label','Start from this point: '+label);return control;
   };
   if(!tools.mobile&&record().live){
    const live=record().live;
    bar.append(button('Unpublish',()=>send('unpublish')));
    bar.append(button('Play published version',async()=>{
     try{
      sessionStorage.setItem('chance-playtest-draft',JSON.stringify({uid,graph:g,revision:record().revision,dirty,selected}));
      await root.VoidEncounterGame.playtest(structuredClone(live),live.start);
     }catch(e){message.textContent=e.message;}
    }));
   }
   message.textContent=status||(dirty?'Unsaved draft':record().liveRevision?'Published revision '+record().liveRevision:'Draft');host.append(message);
   const props=element('div');props.className='dev-fields';host.append(props);
   field(props,'Name',input(g.name,v=>{g.name=v;mark();}));
   const on=element('input');on.type='checkbox';on.checked=g.enabled;on.onchange=()=>{g.enabled=on.checked;mark();};field(props,'Enabled',on);
   const trigger=g.conditions.startTrigger||{kind:'interval'};
   if(g.cast){
    field(props,'Encounter location',select(Object.entries(api.castLocations),g.playtest.scene,value=>{
     const previous={x:g.playtest.x,z:g.playtest.z};
     g.playtest.scene=value;
     const spawn=value==='planet-low-quay'?[27.4,371]:value==='darknet-district'?root.VoidNeoChinatown?.layout('interior')?.spawn?.filter((_,i)=>i!==1):null;
     const [x,z]=spawn||[seed.playtest.x,seed.playtest.z];
     g.playtest.x=x;g.playtest.z=z;
     for(const [i,actor] of g.cast.entries())if(actor.x===previous.x+1+i*.75&&actor.z===previous.z+1){actor.x=x+1+i*.75;actor.z=z+1;}
     mark();draw();
    }));
    if(g.playtest.scene==='sacramento'){
     const quarters=Object.values(root.VoidQuarters?.QUARTERS||{}).filter(q=>q.id!=='underground');
     if(quarters.length)field(props,'Street quarter',select(quarters.map(q=>[q.id,q.name]),g.playtest.quarter,id=>{
      const q=quarters.find(item=>item.id===id);
      g.conditions.quarter=g.playtest.quarter=id;
      updateStart({x:q.spawn[0],z:q.spawn[2],yaw:q.yaw});draw();
     }));
    }
   }
   field(props,'Start trigger',select(Object.entries(api.startTriggers),trigger.kind,kind=>{
    if(kind==='interval')delete g.conditions.startTrigger;
    else g.conditions.startTrigger={kind,...(kind==='game-time'?{minutes:60}:kind==='near'?{distance:5}:{})};
    mark();draw();
   }));
   if(['place','leave','after-mission','game-time'].includes(trigger.kind)){
    const place=['place','leave'].includes(trigger.kind);
    const entries=place?tools.places?.slice()||(root.VoidPlaces?.options()||[]).filter(p=>p.selectable).map(p=>[p.id,p.label]):
     tools.missions?.slice()||(root.VoidLiveContent?.env?.trees||[]).flatMap(t=>t.missions.map(m=>[m.id,m.name||m.title||m.id]));
    if(!place)for(const [id,m] of Object.entries(root.VoidLiveContent?.env?.shipped?.registry||{}))if(!entries.some(([key])=>key===id))entries.push([id,m.name||m.title||id]);
    if(trigger.target&&!entries.some(([key])=>key===trigger.target))entries.push([trigger.target,trigger.target]);
    field(props,place?'Trigger place':'Trigger mission',select([['','Choose…'],...entries],trigger.target||'',v=>{trigger.target=v;mark();}));
   }
   if(trigger.kind==='near'){
    const npcs=tools.npcs?.slice()||(root.VoidLiveContent?.env?.givers||[]).filter(g=>g.targets?.length).map(g=>[g.id,g.name||g.id]);
    if(trigger.target&&!npcs.some(([key])=>key===trigger.target))npcs.push([trigger.target,trigger.target]);
    if(g.cast)props.append(element('small','A nearby NPC trigger checks a character already present in the game. Cast members appear after activation.'));
    field(props,'Trigger NPC',select([['','Choose…'],...npcs],trigger.target||'',v=>{trigger.target=v;mark();}));
    field(props,'Approach distance (metres)',input(trigger.distance,v=>{trigger.distance=v;mark();},'number'));
   }
   if(trigger.kind!=='interval'){
    const ambient=element('input');ambient.type='checkbox';ambient.checked=trigger.alsoRandom===true;
    ambient.onchange=()=>{trigger.alsoRandom=ambient.checked;mark();draw();};field(props,'Also allow nearby percentage rolls without this trigger',ambient);
   }
   if(trigger.kind==='flag')field(props,'Story flag ID',input(trigger.target,v=>{trigger.target=v.trim();mark();}));
   if(trigger.kind==='game-time')field(props,'In-game minutes after completion',input(trigger.minutes,v=>{trigger.minutes=v;mark();},'number'));
   if(api.isVisitTrigger(trigger.kind))props.append(element('small','The latest matching visit is held until you reach the activation radius during this session, then rolled once. The interval sets the minimum time between rolls.'));
   else if(trigger.kind!=='interval')props.append(element('small','Once your saved campaign meets this condition, the encounter rolls its percentage at the configured interval inside the activation radius.'));
   field(props,'Chance (%)',input(g.conditions.chance,v=>{g.conditions.chance=v;mark();},'number'));
   field(props,'Opportunity interval (seconds)',input(g.conditions.intervalSeconds,v=>{g.conditions.intervalSeconds=v;mark();},'number'));
   const conditions=element('details');conditions.append(element('summary','Eligibility and repeat visits'));host.append(conditions);
   for(const [key,label,initial] of [['radius','Activation radius (metres)',20],['cooldownSeconds','Cooldown (seconds)',0],['dailyLimit','Maximum occurrences per game day (0 = unlimited, 0.5 = every other day)',0],['fromMinute','Start minute of game day',0],['toMinute','End minute of game day',0]])
    field(conditions,label,input(g.conditions[key]??initial,v=>{g.conditions[key]=v;mark();},'number')).step=key==='dailyLimit'?'0.5':'1';
   const repeat=element('input');repeat.type='checkbox';repeat.checked=!!g.conditions.repeatable;repeat.onchange=()=>{g.conditions.repeatable=repeat.checked;mark();};field(conditions,'Allow repeat visits',repeat);
   for(const [key,label] of [['requiredItems','Required item IDs'],['requiredNPCs','Required NPC IDs'],['requiredDoors','Required door permissions'],['requiredFlags','Required story flags']])
    field(conditions,label+' (comma separated)',input((g.conditions[key]||[]).join(', '),v=>{g.conditions[key]=v.split(',').map(s=>s.trim()).filter(Boolean);mark();}));
   const names=g.nodes.map(n=>[n.id,n.name]);field(props,'First node',select(names,g.start,v=>{g.start=v;mark();draw();}));
   const setup=element('details');setup.append(element('summary','Playtest starting position'));host.append(setup);
   const coords={},marker=()=>({id:'player',x:g.playtest.x,z:g.playtest.z,yaw:g.playtest.yaw,color:'#4debd5',label:'Player start',drag:true,facing:true});
   let map;
   const updateStart=changes=>{
    Object.assign(g.playtest,changes);
    for(const [key,value] of Object.entries(changes))if(coords[key])coords[key].value=value;
    map?.set({area:g.playtest.quarter,markers:[marker()]});mark();
   };
   for(const [key,label] of [['x','East / west'],['z','North / south'],['yaw','Facing (radians)'],['pitch','Camera pitch'],['delaySeconds','Activation delay (seconds)']]){
    coords[key]=field(setup,label,input(g.playtest[key],v=>updateStart({[key]:v}),'number'));
   }
   if(!tools.mobile)setup.append(button('Set From Current Player Position',()=>{
    const loc=typeof walkingLocation!=='undefined'?walkingLocation:null;
    if(typeof walker==='undefined'||!walker||!loc||(g.cast?!api.matchesScene(g.playtest,loc):loc.area!=='street')){message.textContent='Stand in the selected encounter location first.';return;}
    updateStart({x:walker.x,z:walker.z,yaw:walker.yaw,pitch:walker.pitch,...(loc.quarter?{quarter:loc.quarter}:{})});
    if(g.cast&&loc.quarter)g.conditions.quarter=loc.quarter;
   }));
   setup.addEventListener('toggle',()=>{
    if(!setup.open||map||!root.VoidNPCMap||(g.cast&&g.playtest.scene!=='sacramento'))return;
    map=root.VoidNPCMap.create({npc:null,area:g.playtest.quarter,markers:[marker()],selected:'player',
     onArea:quarter=>{g.playtest.quarter=quarter;if(g.cast)g.conditions.quarter=quarter;mark();},onPick:(x,z)=>updateStart({x,z}),
     onDrag:(_,x,z)=>updateStart({x,z}),onFacing:(_,yaw)=>updateStart({yaw})});
    setup.append(map.el);
   });
   if(g.cast){
    const cast=element('section');cast.className='dev-fields';cast.append(element('h3','Cast'));host.insertBefore(cast,conditions);
    const looks=(root.VoidMadeNPCs?.models()||[]).map(model=>model.asset).sort();
    const roster=(root.VoidLiveContent?.env?.givers||[]).flatMap(npc=>{
     const configured=root.VoidLiveContent?.current?.content?.characters?.[npc.id];
     const model=configured?.model||root.VoidDistrictPeople?.npc?.(npc.id)?.model;
     return looks.includes(model)?[[npc.id,npc.name,model]]:[];
    });
    function renameActor(actor,id){
     for(const row of [...g.dialogue,...g.nodes,...(g.savedActions||[]).flat()])if(row.speaker===actor.id){
      row.speaker=id;delete row.recording;
     }
     actor.id=id;
    }
    const pick=element('datalist');pick.id='chance-cast-models';
    for(const look of looks)pick.append(new Option(look,look));
    cast.append(pick,button('Add cast member',()=>{
     let n=1;while(g.cast.some(actor=>actor.id==='npc-'+n))n++;
     g.cast.push({id:'npc-'+n,name:'NPC '+n,model:'',x:g.playtest.x+1+(n-1)*.75,y:0,z:g.playtest.z+1,yaw:0,scale:1,idle:''});
     mark();draw();
    }));
    for(const actor of g.cast){
     const form=element('fieldset');form.append(element('legend',actor.name||actor.id));cast.append(form);
     if(roster.length)field(form,'Use existing NPC',select([['','Choose from the roster'],...roster.map(([id,name])=>[id,name])],'',id=>{
      const chosen=roster.find(npc=>npc[0]===id);if(!chosen)return;
      if(g.cast.some(member=>member!==actor&&member.id===id)){message.textContent='That NPC ID is already in this cast.';return;}
      renameActor(actor,id);actor.name=chosen[1];actor.model=chosen[2];actor.idle='';
      delete actor.localAsset;delete actor.fileName;delete actor.clips;delete actor.clipSeconds;mark();draw();
     }));
     field(form,'NPC ID',input(actor.id,value=>{renameActor(actor,value);mark();}));
     field(form,'NPC name',input(actor.name,value=>{actor.name=value;mark();}));
     const model=field(form,'Game model',input(actor.model,value=>{actor.model=value.trim();actor.idle='';delete actor.localAsset;delete actor.fileName;delete actor.clips;delete actor.clipSeconds;mark();}));
     model.setAttribute('list',pick.id);
     if(!tools.mobile){
      const upload=element('input');upload.type='file';upload.accept='.glb,model/gltf-binary';
      const note=element('output',actor.fileName?'Local model: '+actor.fileName:'Imported models can be used in browser playtests. Select a game model to publish.');note.setAttribute('role','status');
      field(form,'Import .glb',upload);form.append(note);
      upload.onchange=async()=>{
       const file=upload.files[0];if(!file)return;
       upload.disabled=true;
       try{
        if(!/\.glb$/i.test(file.name))throw Error('Choose a .glb file.');
        const doc=root.VoidAssets.validate(await file.arrayBuffer());
        if(!doc.meshes?.length)throw Error('Choose a GLB containing a mesh.');
        const key='enc-glb-'+crypto.randomUUID();await api.castAsset(key,file);
        if(!current()||!form.isConnected)return;
        actor.localAsset=key;actor.fileName=file.name;actor.idle='';delete actor.model;
        actor.clips=(doc.animations||[]).map(clip=>clip.name).filter(name=>typeof name==='string'&&name.length<=100);
        actor.clipSeconds=Object.fromEntries((doc.animations||[]).filter(clip=>actor.clips.includes(clip.name)).map(clip=>{
         const spans=(clip.samplers||[]).map(s=>doc.accessors?.[s.input]);
         return [clip.name,Math.max(...spans.map(a=>a?.max?.[0]))-Math.min(...spans.map(a=>a?.min?.[0]))];
        }).filter(([,seconds])=>Number.isFinite(seconds)&&seconds>=0));
        if(!actor.id||/^npc-\d+$/.test(actor.id)){
         const label=file.name.replace(/_meshy.*|\.glb$/i,''),slug=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
         if(label&&/^NPC \d+$/.test(actor.name))actor.name=label.slice(0,60);
         const id=slug.slice(0,64);
         if(/^[a-z]/.test(id)&&!g.cast.some(item=>item!==actor&&item.id===id)){
          renameActor(actor,id);
         }
        }
        note.textContent='Local model: '+file.name;mark();draw();
       }catch(error){note.textContent=error.message;}finally{upload.disabled=false;upload.value='';}
      };
      form.append(button('Place NPC at my position',()=>{
       const loc=typeof walkingLocation!=='undefined'?walkingLocation:null;
       if(typeof walker==='undefined'||!walker||!api.matchesScene(g.playtest,loc)){message.textContent='Stand in the selected encounter location first.';return;}
       Object.assign(actor,{x:walker.x,z:walker.z,yaw:walker.yaw});mark();draw();
      }));
     }
     for(const [key,label] of [['x','NPC east / west'],['y','NPC floor offset'],['z','NPC north / south'],['yaw','NPC facing (radians)'],['scale','NPC scale']])
      field(form,label,input(actor[key],value=>{actor[key]=value;mark();},'number')).step='any';
     const clips=actor.clips||root.VoidCrowd?.clips?.[actor.model]||[];
     field(form,'Idle animation',clips.length?select([['','Automatic'],...clips.map(name=>[name,name])],actor.idle||'',value=>{actor.idle=value;mark();}):input(actor.idle,value=>{actor.idle=value.trim();mark();}));
     form.append(button('Remove cast member',()=>{g.cast=g.cast.filter(value=>value!==actor);mark();draw();}));
    }
   }
   const motions=element('datalist');motions.id='encounter-lace-motions';host.append(motions);
   const clipNames=new Set([...(tools.clips||[]),...(root.VoidCrowd?.clips?.['npc-lib-eb1d6cc8']||[]),
    ...(g.cast||[]).flatMap(actor=>actor.clips||root.VoidCrowd?.clips?.[actor.model]||[]),
    g.placement?.clip,...(g.dialogue||[]).map(line=>line.animation),
    'sz-tiedbf','sz-tiedbf-look-back','sz-tiedbf-look-back-return']);
   for(const id of clipNames){if(id){const option=element('option');option.value=id;option.label=root.VoidAnimLibrary?.clip?.(id)?.title||id;motions.append(option);}}
   if(g.residence&&g.placement){
    const placement=element('details');placement.append(element('summary','Apartment placement and animation'));host.append(placement);
    for(const [key,label] of [['x','East / west'],['y','Floor offset'],['z','North / south'],['yaw','Facing (radians)'],['scale','Character scale']])
     field(placement,label,input(g.placement[key],v=>{g.placement[key]=v;mark();},'number'));
    field(placement,'Apartment animation',input(g.placement.clip,v=>{g.placement.clip=v;mark();})).setAttribute('list',motions.id);
    field(placement,'Player first-person animation',input(g.roleplayClip,v=>{g.roleplayClip=v;mark();}));
    const room=g.nodes.find(n=>n.kind==='location');
    if(room)placement.append(button('Preview in apartment',()=>launch(room.id)));
   }
   if(g.item){
    const prop=element('details');prop.append(element('summary','Dropped keycard'));host.append(prop);
    field(prop,'Items & Vendors item ID',input(g.item,v=>{g.item=v;mark();}));
    field(prop,'Pickup distance (metres)',input(g.pickupDistance,v=>{g.pickupDistance=v;mark();},'number'));
    field(prop,'Kade recovery delay (seconds)',input(g.recoverySeconds??8,v=>{g.recoverySeconds=v;mark();},'number'));
    for(const [key,label] of [['x','Street X'],['z','Street Z']])
     field(prop,label,input(g.dropPosition[key],v=>{g.dropPosition[key]=v;mark();},'number'));
    const drop=g.nodes.find(n=>n.kind==='item');if(drop)prop.append(button('Preview keycard drop',()=>launch(drop.id)));
   }
   const soundFiles=element('datalist');soundFiles.id='chance-encounter-sounds';
   for(const path of soundLibrary)soundFiles.append(new Option(path.split('/').at(-1),path));
   host.append(soundFiles);
   function drawSounds(parent,label,get,set){
    const details=element('details');details.className='encounter-sound-cues';parent.append(details);
    const summary=element('summary'),controls=element('div');details.append(summary,controls);
    const update=()=>{
     const cues=get()||[];
     summary.textContent=label+' ('+cues.length+')';controls.replaceChildren();
     for(const [index,cue] of cues.entries()){
      const form=element('fieldset');form.className='encounter-action-fields';controls.append(form);
      form.append(element('legend','Sound effect '+(index+1)));
      const number=(label,value,min,max,change)=>{
       const control=field(form,label,input(value,v=>{change(v);mark();},'number'));control.min=min;control.max=max;control.step='any';
      };
      const file=field(form,'Sound file',input(cue.src,value=>{cue.src=value.trim();mark();}));file.setAttribute('list',soundFiles.id);
      field(form,'Cue moment',select([['start','Start'],['end','End']],cue.when,when=>{
       cue.when=when;if(when==='end'&&cue.loop)cue.stop='seconds';mark();update();
      }));
      number('Offset after cue moment (seconds)',cue.offset,0,3600,v=>{cue.offset=v;});
      number('Volume',cue.volume,0,1,v=>{cue.volume=v;});
      const loop=element('input');loop.type='checkbox';loop.checked=cue.loop;
      loop.onchange=()=>{cue.loop=loop.checked;cue.stop=cue.when==='start'?'scope':'seconds';cue.seconds??=1;mark();update();};
      field(form,'Loop sound effect',loop);
      if(cue.loop){
       const choices=[['seconds','After a set duration']];
       if(cue.when==='start')choices.unshift(['scope','At the end of this section, playlist, or action'],['encounter','When the encounter stops']);
       field(form,'Stop loop',select(choices,cue.stop,stop=>{cue.stop=stop;mark();update();}));
       if(cue.stop==='seconds')number('Loop duration (seconds)',cue.seconds,.01,3600,v=>{cue.seconds=v;});
      }
      if(root.VoidSoundStudio)form.append(button('Preview sound',()=>{
       audition?.dispose();if(soundLibrary.includes(cue.src))audition=api.playSound({...cue,loop:false});
      }),button('Stop preview',()=>audition?.dispose()));
      form.append(button('Remove sound effect',()=>{set(cues.filter(value=>value!==cue));mark();update();}));
     }
     controls.append(button('Add sound effect',()=>{
      set([...cues,{src:'',when:'start',offset:0,volume:1,loop:false}]);mark();update();
     }));
    };
    update();return details;
   }
   const soundMap=(key,id,value)=>{(g[key]||={})[id]=value;};
   host.insertBefore(drawSounds(host,'Encounter start and stop sounds',()=>g.soundCues,value=>{g.soundCues=value;}),props);
   const clipSeconds=row=>g.cast?.find(actor=>actor.id===row.speaker)?.clipSeconds?.[row.animation]??root.VoidAnimLibrary?.clip?.(row.animation)?.seconds;
   function duration(host,calculate){
    const line=element('p');line.className='encounter-duration';host.append(line);
    const refresh=()=>{
     const value=calculate(),seconds=Math.round(value.seconds*10)/10;
     line.textContent=(value.loop?'Until canceled · '+seconds+' s first pass':(value.variable?'Base estimate ':'Estimated duration ')+'≈ '+seconds+' s')
      +(value.unknown?' plus unmeasured animation':'')+(value.variable?' · chance or repeats can add time':'');
    };
    durationLabels.push(refresh);refresh();
   }
   const segmentTiming=part=>api.timing({before:[],cycle:part.rows,after:[]},part.passes,clipSeconds,part.legacy,part.chance);
   if(Array.isArray(g.dialogue)){
    const dialogue=element('details');dialogue.className='encounter-playlist-editor';dialogue.append(element('summary','Dialogue ('+g.dialogue.length+' slots)'));dialogue.open=dialogueOpen;dialogue.ontoggle=()=>{if(dialogue.isConnected)dialogueOpen=dialogue.open;};host.insertBefore(dialogue,props);
    const editable=!g.cast&&(g.id==='dropped-cardkey'||g.dialogue.some(line=>branchOf(line)));
    if(editable){
     const position=element('select');position.setAttribute('aria-label','Insert new line');
     const fillPositions=()=>{
      position.replaceChildren(new Option('End of this conversation',''));
      for(const line of branchLines(g,addBranch))position.add(new Option('Before '+line.id+(line.text?' — '+line.text.slice(0,45):''),line.id));
     };
     const branch=select(conversations,addBranch,v=>{addBranch=v;fillPositions();});
     fillPositions();
     const arrival=g.dialogue.filter(l=>l.id.startsWith('lace_arrival_'));
     const decisionControl=field(dialogue,'Show player choices',select([['end','After all arrival lines'],['before','Before the first line'],
      ...arrival.map(l=>[l.id,'After '+l.id+(l.text?' — '+l.text.slice(0,55):'')])],g.decisionAfter||'end',v=>{
       const updated=api.dialogueSections({...g,decisionAfter:v});
       const before=new Set(updated.opening.map(line=>line.mainPlaylist).filter(Boolean));
       if(updated.remaining.some(line=>before.has(line.mainPlaylist))){
        decisionControl.value=g.decisionAfter||'end';message.textContent='Place player choices before or after the main playlist.';return;
       }
       g.decisionAfter=v;redraw();
      }));
     field(dialogue,'Conversation',branch);field(dialogue,'Insert new line',position);
     const add=button('Add Lace line',()=>{
      const line={id:nextLineId(g,addBranch),speaker:g.cast?.[0]?.id||'lace',text:'',tags:'',delay:addBranch==='wait'?12:0,animation:''};
      insertLine(g,line,addBranch,g.dialogue.find(l=>l.id===position.value));mark();draw();
      host.querySelector('[data-line-id="'+line.id+'"] textarea')?.focus();
     });
     add.disabled=g.dialogue.length>=100;dialogue.append(add);
    }
    const uploads=new Map();
    dialogue.append(element('p','Enter the spoken text first. For bulk import, name each recording after its line ID, such as lace_arrival_01.ogg.'));
    const bulk=element('input'),report=element('output');bulk.type='file';bulk.multiple=true;bulk.accept='audio/*,.ogg,.mp3,.wav';
    field(dialogue,'Bulk import recordings',bulk);dialogue.append(report);
    bulk.onchange=async()=>{
     const files=Array.from(bulk.files),issues=[],seen=new Set();let imported=0;host.inert=true;
     try{for(const file of files){
      const key=file.name.replace(/\.[^.]+$/,'').toLowerCase();
      try{if(seen.has(key))throw Error('Duplicate file');if(!uploads.has(key))throw Error('Unknown line ID');
       seen.add(key);await uploads.get(key)(file);imported++;
      }catch(e){issues.push(file.name+' — '+e.message);}
     }}finally{host.inert=false;bulk.value='';report.textContent=[imported+' imported',...issues].join(' · ');}
    };
    const ordered=(editable?[...conversations.flatMap(([key])=>branchLines(g,key)),...g.dialogue.filter(l=>!branchOf(l))]:g.dialogue).filter(l=>!l.id.startsWith('branch_'));
    const drawn=new Set();
    function redraw(){mark();draw();}
    const branchId=()=> 'branch_'+crypto.randomUUID().replaceAll('-','').slice(0,12);
    function newAction(){
     const id=branchId();
     g.dialogue.push({id,speaker:g.cast?.[0]?.id||'lace',text:'',animation:'',delay:0,tags:''});return id;
    }
    function removeActions(ids){
     const removed=new Set(ids);
     for(const id of removed){
      const line=g.dialogue.find(row=>row.id===id);
      for(const branch of line?.branches||[])for(const child of branch.actions)removed.add(child);
     }
     g.dialogue=g.dialogue.filter(row=>!removed.has(row.id));
    }
    const sections=api.dialogueSections(g),selectionControls=[],sectionPreviews=new Map();
    const byId=new Map(g.dialogue.map(line=>[line.id,line])),actionOptions=new Map();
    const actionLabel=(line,n)=>n+' · '+(line.text||line.animation||line.id).slice(0,70);
    const saved=g.savedActions||[];
    const selectionBar=element('div');selectionBar.className='encounter-selection-bar';dialogue.append(selectionBar);
    const savedPanel=element('details');savedPanel.append(element('summary','Saved Actions ('+saved.flat().length+')'));dialogue.append(savedPanel);
    savedPanel.open=closed.has('saved-actions-open');
    savedPanel.ontoggle=()=>{if(savedPanel.isConnected){if(savedPanel.open)closed.add('saved-actions-open');else closed.delete('saved-actions-open');}};
    const targets=[];
    function collect(rows,owner,section,segment){
     const target={rows,owner,section,segment};targets.push(target);
     for(const row of rows)for(const branch of row.branches||[])
      collect(branch.actions.map(id=>byId.get(id)).filter(Boolean),branch,section,null);
    }
    for(const [section,rows] of Object.entries(sections)){
     const segments=api.playlistSegments(rows);
     collect(segments.filter(segment=>!segment.key).flatMap(segment=>segment.rows),null,section,null);
     for(const segment of segments.filter(segment=>segment.key))collect(segment.rows,null,section,segment);
    }
    const sourceOf=row=>targets.find(target=>target.rows.includes(row));
    function bundle(root,include){
     const rows=[root];
     if(include)for(const row of rows)for(const branch of row.branches||[])
      for(const id of branch.actions)rows.push(byId.get(id));
     return rows;
    }
    function unlink(row,preserve=new Set()){
     const source=sourceOf(row);
     if(branchOf(row)==='wait')g.waitingDialogueConfigured=true;
     if(!source)return;
     if(source.owner){
      const branch=source.owner;
      branch.actions=branch.actions.filter(id=>id!==row.id);
      for(const key of ['startAction','endAction'])if(branch[key]===row.id)delete branch[key];
      if(!branch.actions.length)for(const parent of g.dialogue)
       if(parent.branches?.includes(branch))parent.branches=parent.branches.filter(item=>item!==branch);
     }
     if(g.decisionAfter===row.id){
      const arrival=branchLines(g,'arrival');
      g.decisionAfter=arrival[arrival.indexOf(row)-1]?.id||'before';
     }
     for(const parent of g.dialogue)for(const branch of parent.branches||[])
      if(!preserve.has(parent)&&branch.returnAction===row.id){delete branch.returnAction;branch.completion='next';}
    }
    function park(rows){
     const chosen=new Set(rows);
     const descendants=new Set(rows.flatMap(row=>bundle(row,true).slice(1)));
     g.savedActions=saved;
     for(const row of chosen){
      if(descendants.has(row))continue;
      const stored=bundle(row,true),members=new Set(stored);unlink(row,members);
      g.dialogue=g.dialogue.filter(action=>!members.has(action));
      saved.push(stored);
     }
     checked.clear();redraw();
    }
    function destination(rows,mode){
     dialogue.querySelector('.encounter-action-destination')?.remove();
     const form=element('fieldset');form.className='encounter-action-destination';
     form.append(element('legend',mode==='clone'?'Clone actions':mode==='restore'?'Restore actions':'Move actions'));
     selectionBar.after(form);
     const original=sourceOf(rows[0]);
     const sameSource=rows.every(row=>sourceOf(row)===original);
     const options=targets.filter(target=>mode!=='move'||(!target.segment&&!target.owner)||!rows.some(row=>sourceOf(row)===target));
     const positionRows=target=>target&&(target.owner||target.segment?target.rows:api.playlistSegments(sections[target.section]).map(segment=>segment.rows[0]));
     const label=target=>{
      const name=names[target.section]||target.section;
      if(target.owner){
       const parent=g.dialogue.find(line=>line.branches?.includes(target.owner));
       return name+' / Chance playlist after '+(parent?.text||parent?.id||'action').slice(0,55);
      }
      return name+(target.segment?' / Main playlist '+(target.segment.rows[0].text||target.segment.key).slice(0,55):' / Conversation');
     };
     const defaults=mode==='clone'&&sameSource&&(original||saved.some(group=>group[0]===rows[0]));
     const entries=[...(defaults?[['same','Immediately after the original']]:[]),...options.map((target,i)=>[String(i),label(target)]),...(mode==='clone'?[['saved','Saved Actions']]:[])];
     const position=select([['','End']], '',()=>{});
     const targetControl=select(entries,entries[0]?.[0]||'',fill);
     function fill(){
      const target=options[Number(targetControl.value)];
      position.hidden=!target||['same','saved'].includes(targetControl.value);
      position.replaceChildren(new Option('End of destination',''),...(positionRows(target)||[]).filter(row=>mode!=='move'||!rows.includes(row)).map(row=>new Option('Before '+(row.text||row.animation||row.id).slice(0,55),row.id)));
     }
     const include=element('input');include.type='checkbox';
     field(form,'Destination',targetControl);form.append(position);position.setAttribute('aria-label','Position');
     if(mode==='clone'&&rows.some(row=>row.branches?.length))field(form,'Include attached chance playlists',include);
     const feedback=element('output');
     form.append(button('Apply',()=>{
      const same=targetControl.value==='same',toSaved=targetControl.value==='saved'||same&&!original;
      const target=same?original:options[Number(targetControl.value)];
      if(!target&&!toSaved)return;
      const actions=rows.map(row=>saved.find(group=>group[0]===row)||
       bundle(row,mode!=='clone'||include.checked));
      const copies=actions.map(group=>mode==='clone'?structuredClone(include.checked?group:group.slice(0,1)):group);
      const adding=copies.reduce((sum,group)=>sum+group.length,0);
      if(!toSaved&&mode!=='move'&&g.dialogue.length+adding>100){feedback.textContent='The encounter can have up to 100 active actions.';return;}
      if(toSaved&&saved.reduce((sum,group)=>sum+group.length,0)+adding>100){feedback.textContent='The encounter can have up to 100 saved actions.';return;}
      if(mode==='move'){
       const moved=new Set(actions.flat());
       if(moved.size!==adding){feedback.textContent='Select either a parent action or its attached actions.';return;}
       if(target.owner&&g.dialogue.some(row=>moved.has(row)&&row.branches?.includes(target.owner))){
        feedback.textContent='Choose a different playlist.';return;
       }
       for(const source of new Set(rows.map(sourceOf)))
        if(source!==target&&source?.segment)detach(rows.filter(row=>sourceOf(row)===source),source.segment);
       for(const row of rows)unlink(row,moved);
       g.dialogue=g.dialogue.filter(row=>!moved.has(row));
      }
      if(mode==='restore')for(const group of actions)saved.splice(saved.indexOf(group),1);
      let after=same?(target?.rows.filter(row=>rows.includes(row)).at(-1)||rows.at(-1)):null;
      const before=positionRows(target)?.find(row=>row.id===position.value);
      const conversation=target?.section==='opening'||target?.section==='remaining'?'arrival':target?.section;
      const membership=target?.segment?.legacy?newKey():target?.segment?.key;
      const reserved=new Set(mode==='move'&&!target.owner?rows.filter(row=>branchOf(row)===conversation).map(row=>row.id):[]);
      if(target?.segment?.legacy)setMembers(target.segment.rows,membership,0,target.segment.rows);
      for(const [index,group] of copies.entries()){
       const row=group[0],ids=new Map();
       for(const [i,item] of group.entries()){
        const inBranch=i||toSaved||target.owner;
        const staysInConversation=!inBranch&&branchOf(item)===conversation;
        const id=mode==='move'&&(staysInConversation||inBranch&&item.id.startsWith('branch_'))?item.id:inBranch?branchId():nextLineId(g,conversation,reserved);
        ids.set(item.id,id);item.id=id;
       }
       if(mode==='clone'&&!include.checked)delete row.branches;
       for(const item of group)for(const branch of item.branches||[]){
        branch.actions=branch.actions.map(id=>ids.get(id));
        for(const key of ['startAction','endAction'])if(branch[key])branch[key]=ids.get(branch[key]);
        if(branch.returnAction){
         const own=ids.get(branch.returnAction);
         if(own||target?.segment?.rows.some(member=>member.id===branch.returnAction))branch.returnAction=own||branch.returnAction;
         else{delete branch.returnAction;branch.completion='next';}
        }
        if(branch.completion==='start'&&!membership&&!toSaved)branch.completion='next';
       }
       if(toSaved){
        g.savedActions=saved;
        const originalIndex=saved.indexOf(actions[index]);
        saved.splice(same&&originalIndex>=0?originalIndex+1:saved.length,0,group);
        continue;
       }
       if(mode==='clone'||!same){delete row.playlistStart;delete row.playlistEnd;}
       if(membership)setMembers([row],membership,target.segment.passes,[],target.segment.chance);
       else{delete row.mainPlaylist;delete row.mainPasses;delete row.mainContinueChance;}
       if(target.owner){
        const links=target.owner.actions,at=after?links.indexOf(after.id)+1:before?links.indexOf(before.id):links.length;
        links.splice(at,0,row.id);g.dialogue.push(row);
       }else{
        const scope=target.segment?target.rows:sections[target.section];
        const last=after||(!before&&scope.filter(row=>g.dialogue.includes(row)).at(-1));
        const boundary=target.section==='opening'&&g.decisionAfter==='before'?sections.remaining[0]:null;
        const at=last?g.dialogue.indexOf(last)+1:before||boundary?g.dialogue.indexOf(before||boundary):g.dialogue.length;
        g.dialogue.splice(at,0,row);
        if(target.section==='opening'&&(g.decisionAfter==='before'||last&&g.decisionAfter===last.id))g.decisionAfter=row.id;
        if(target.section==='wait')g.waitingDialogueConfigured=true;
       }
       g.dialogue.push(...group.slice(1));after=row;
      }
      checked.clear();redraw();
     }),button('Cancel',()=>form.remove()),feedback);fill();
     form.scrollIntoView({block:'nearest'});
    }
    for(const group of saved){
     const row=group[0],entry=element('div'),check=element('input');check.type='checkbox';check.checked=checked.has(row.id);
     check.onchange=()=>{if(check.checked)checked.add(row.id);else checked.delete(row.id);refresh();};
     field(entry,row.text||row.animation||row.id,check);
     entry.append(button('Restore action',()=>destination([row],'restore')),button('Clone action',()=>destination([row],'clone')));
     savedPanel.append(entry);
    }
    function refresh(){
     const orderedActive=[...targets.flatMap(target=>target.rows),...g.dialogue.filter(row=>!sourceOf(row))].filter(row=>checked.has(row.id));
     const stored=saved.map(group=>group[0]).filter(row=>checked.has(row.id));
     selectionBar.hidden=!checked.size;selectionBar.replaceChildren(element('strong',checked.size+' selected'));
     const actions=stored.length?stored:orderedActive;
     if(actions.length&&actions.length===checked.size){
      selectionBar.append(button('Clone selected actions',()=>destination(actions,'clone')));
      if(stored.length)selectionBar.append(button('Restore selected actions',()=>destination(stored,'restore')));
      else{
       const source=sourceOf(actions[0]);
       if(source&&!source.owner&&!source.segment&&actions.every(row=>sourceOf(row)===source))
        selectionBar.append(button('Create playlist from selected',()=>{setMembers(actions,newKey(),0);checked.clear();redraw();}));
       selectionBar.append(button('Move selected actions',()=>destination(actions,'move')));
       selectionBar.append(button('Move to Saved Actions',()=>park(actions)));
      }
     }
     selectionBar.append(button('Clear selection',()=>{checked.clear();draw();}));
     for(const [button,eligible] of selectionControls)button.disabled=!eligible.some(line=>checked.has(line.id));
    }
    function keepOpen(details,key){
     details.open=!closed.has(key);
     details.ontoggle=()=>{if(details.isConnected){if(details.open)closed.delete(key);else closed.add(key);}};
    }
    const newKey=()=> 'main_'+crypto.randomUUID().replaceAll('-','');
    function setMembers(rows,key,passes,legacyRows=[],chance){
     if(legacyRows.length&&g.playlistSounds){
      const owner=Object.entries(api.dialogueSections(g)).find(([,items])=>items.includes(legacyRows[0]))?.[0];
      const prior=owner+':legacy';
      if(owner&&g.playlistSounds[prior]){
       g.playlistSounds[owner+':'+key]=g.playlistSounds[prior];delete g.playlistSounds[prior];
      }
     }
     for(const row of rows){
      row.mainPlaylist=key;row.mainPasses=passes;
      if(chance===undefined)delete row.mainContinueChance;else row.mainContinueChance=chance;
      delete row.playlistStart;delete row.playlistEnd;
      for(const branch of row.branches||[])if(branch.completion===undefined)branch.completion=legacyRows.includes(row)?'start':'next';
     }
    }
    function detach(actions,segment){
     if(!segment?.key)return;
     const rest=segment.rows.filter(row=>!actions.includes(row)),ids=new Set(actions.map(row=>row.id));
     if(segment.legacy)setMembers(rest,newKey(),0,rest);
     for(const line of actions){
      checked.delete(line.id);
      for(const key of ['repeatSpeech','repeatAnimation','playlistStart','playlistEnd'])delete line[key];
      delete line.mainPlaylist;delete line.mainPasses;delete line.mainContinueChance;
      for(const branch of line.branches||[]){
       if(['start','action'].includes(branch.completion)){delete branch.returnAction;branch.completion='next';}
      }
     }
     for(const row of rest)for(const branch of row.branches||[]){
      if(ids.has(branch.returnAction)){delete branch.returnAction;branch.completion='next';}
     }
    }
    function actionFooter(host,label,add){
     const footer=element('div');footer.className='encounter-action-tools encounter-add-action';
     const feedback=element('output');feedback.setAttribute('role','status');
     footer.append(button(label,()=>{
      if(g.dialogue.length>=100){
       feedback.textContent='This encounter has 100 active actions. Move an action to Saved Actions to make room.';
       return;
      }
      add();
     }),feedback);
     host.append(footer);
    }
    function insertAction(line,owner,segment,after,section){
     let id;
     if(owner){
      id=newAction();
      owner.actions.splice(owner.actions.indexOf(line.id)+(after?1:0),0,id);
     }else{
      const conversation=line?branchOf(line):section==='opening'||section==='remaining'?'arrival':section;
      id=nextLineId(g,conversation);
      const added={id,speaker:g.cast?.[0]?.id||'lace',text:'',animation:'',delay:conversation==='wait'?12:0,tags:''};
      if(line){
       g.dialogue.splice(g.dialogue.indexOf(line)+(after?1:0),0,added);
       if(after&&g.decisionAfter===line.id)g.decisionAfter=id;
      }else{
       if(section==='remaining'&&(!g.decisionAfter||g.decisionAfter==='end'))g.decisionAfter=sections.opening.at(-1)?.id||'before';
       insertLine(g,added,conversation,section==='opening'?sections.remaining[0]:null);
       if(section==='opening'&&g.decisionAfter==='before')g.decisionAfter=id;
      }
      if(conversation==='wait')g.waitingDialogueConfigured=true;
      if(segment?.key){
       if(segment.legacy)setMembers(segment.rows,newKey(),0,segment.rows);
       setMembers([added],segment.legacy?segment.rows[0].mainPlaylist:segment.key,segment.passes,[],segment.chance);
      }
     }
     redraw();
     host.querySelector('[data-line-id="'+id+'"] textarea')?.focus();
    }
    const executionNumbers=new Map();
    let dragged;
    function drawRow(line,parent,owner,depth=0,number='',segment=null,group=null,anchor=line,leaveBranch){

     if(!line||drawn.has(line.id))return;
     drawn.add(line.id);
     const row=element('fieldset');row.setAttribute('aria-label',line.id);
     row.append(element('legend',number?number+' · '+(line.text.trim()?'Dialogue':line.animation?'Animation':'Action'):line.id));parent.append(row);
     const toolbar=element('div');toolbar.className='encounter-action-tools';row.append(toolbar);
     row.dataset.executionNumber=number;
     if(segment?.key)row.classList.add('encounter-main-member');
     const peers=owner?owner.actions:segment?.key?segment.rows:group;
     const item=owner?line.id:line;
     if(peers){
      const list=owner?owner.actions:g.dialogue,index=peers.indexOf(item);
      function move(source,target){
       const after=peers.indexOf(source)<peers.indexOf(target);
       const ordered=peers.slice();
       ordered.splice(ordered.indexOf(source),1);ordered.splice(ordered.indexOf(target)+(after?1:0),0,source);
       const positions=peers.map(peer=>list.indexOf(peer));
       for(const [index,position] of positions.entries())list[position]=ordered[index];
       if(owner?.startAction&&owner.endAction&&ordered.indexOf(owner.startAction)>ordered.indexOf(owner.endAction)){
        [owner.startAction,owner.endAction]=[owner.endAction,owner.startAction];
       }
       if(!owner&&g.decisionAfter===peers.at(-1).id)g.decisionAfter=ordered.at(-1).id;
       redraw();
      }
      const handle=element('span','Drag to reorder');handle.className='encounter-drag-handle';handle.draggable=true;
      handle.ondragstart=e=>{dragged={item,peers};e.dataTransfer.setData('text/plain',line.id);};
      handle.ondragend=()=>{dragged=null;};
      const accepts=()=>dragged&&dragged.item!==item&&dragged.peers===peers;
      row.ondragover=e=>{if(accepts()){e.preventDefault();e.stopPropagation();}};
      row.ondrop=e=>{if(accepts()){e.preventDefault();e.stopPropagation();const source=dragged.item;dragged=null;move(source,item);}};
      toolbar.append(handle);
      for(const [step,label] of [[-1,'Move earlier'],[1,'Move later']]){
       const section=sourceOf(line)?.section;
       const lanes=!owner&&!segment?.key&&section?api.playlistSegments(sections[section]):null;
       const adjacentIndex=lanes?lanes.findIndex(lane=>lane.rows.includes(line))+step:-1;
       const adjacent=lanes?.[adjacentIndex];
       const target=peers[index+step];
       const control=button(label,()=>{
        if(!adjacent?.key){move(item,target);return;}
        g.dialogue.splice(g.dialogue.indexOf(line),1);
        const following=step>0?lanes[adjacentIndex+1]?.rows[0]:null;
        const boundary=following||(step<0?adjacent.rows[0]:adjacent.rows.at(-1));
        g.dialogue.splice(g.dialogue.indexOf(boundary)+(step>0&&!following?1:0),0,line);
        const last=sections[section].at(-1);
        if(g.decisionAfter===last.id)
         g.decisionAfter=g.dialogue.findLast(row=>sections[section].includes(row)).id;
        redraw();
       });
       control.disabled=!target&&!adjacent;toolbar.append(control);
      }
     }
     const choice=element('input');choice.type='checkbox';choice.checked=checked.has(line.id);
     choice.onchange=()=>{if(choice.checked)checked.add(line.id);else checked.delete(line.id);refresh();};
     if(owner||branchOf(line)){
      const before=button('Add action before',()=>insertAction(line,owner,segment,false));
      before.disabled=g.dialogue.length>=100;toolbar.append(before);
      toolbar.append(button('Move action',()=>destination([line],'move')));
     }
     toolbar.append(button('Clone action',()=>destination([line],'clone')));
     toolbar.append(button('Delete action permanently',()=>{
      if(!confirm('Permanently delete this action and its attached chance playlists?'))return;
      if(segment?.key)detach([line],segment);
      unlink(line);removeActions([line.id]);checked.delete(line.id);redraw();
     }));
     field(toolbar,'Select action',choice);toolbar.append(element('small',line.id));
     if(segment?.key)toolbar.append(button('Remove from main playlist',()=>{detach([line],segment);redraw();}));
     row.dataset.lineId=line.id;
     if(owner||branchOf(line))row.classList.add('encounter-dialogue-action');
     if(!owner&&branchOf(line))row.dataset.conversation=branchOf(line);
     if(owner){
      toolbar.append(button('Remove from chance playlist',()=>leaveBranch([line])));
     }
     const currentBranch=editable&&branchOf(line);
     if(currentBranch){
      row.dataset.lineId=line.id;
      const siblings=branchLines(g,currentBranch),index=siblings.indexOf(line);
      const redrawLine=()=>{mark();draw();host.querySelector('[data-line-id="'+line.id+'"] select')?.focus();};
      field(row,'Conversation for this line',select(conversations,currentBranch,destination=>{
       detach([line],segment);checked.delete(line.id);
       if(g.decisionAfter===line.id)g.decisionAfter=siblings[index-1]?.id||'before';
       if(currentBranch==='wait')g.waitingDialogueConfigured=true;
       g.dialogue.splice(g.dialogue.indexOf(line),1);
       delete line.playlistStart;delete line.playlistEnd;line.id=nextLineId(g,destination);
       insertLine(g,line,destination);redrawLine();
      }));
     }
     const audio=element('output',line.recording?'Recorded':'No recording');
     const spoken=element('textarea');spoken.value=line.text;spoken.rows=3;spoken.maxLength=1000;
     const legend=row.querySelector('legend');
     const updateLabels=()=>{
      if(number)legend.textContent=number+' · '+(line.text.trim()?'Dialogue':line.animation?'Animation':'Action');
      for(const option of actionOptions.get(line.id)||[])option.text=actionLabel(line,option.dataset.number);
     };
     spoken.oninput=()=>{delete line.recording;audio.textContent='No recording';line.text=spoken.value;mark();updateLabels();};
     field(row,'Spoken line',spoken).parentElement.classList.add('encounter-spoken-line');
     const parameters=element('div');parameters.className='encounter-action-fields';row.append(parameters);
     for(const [key,label] of [['speaker','Speaker'],['tags','Delivery tags'],['delay',line.id.startsWith('lace_wait_')?'Wait before this line (seconds)':'Delay (seconds)'],['animation','Animation']]){
      const change=v=>{
       if(key==='speaker'){delete line.recording;audio.textContent='No recording';}
       line[key]=v;mark();updateLabels();
       if(key==='animation'){
        speed.parentElement.hidden=!v;
        if(!v&&!api.validAnimationSpeed(line.animationSpeed)){delete line.animationSpeed;speed.value=1;}
       }
      };
      const speakers=g.cast?.map(actor=>[actor.id,actor.name])||[];
      if(key==='speaker'&&g.cast&&!speakers.some(([id])=>id===line.speaker))speakers.push([line.speaker,line.speaker]);
      const control=field(parameters,label,key==='speaker'&&g.cast?select(speakers,line.speaker,change):input(line[key],change,key==='delay'?'number':'text'));
      if(key==='animation')control.setAttribute('list',motions.id);
     }
     const estimate=field(parameters,'Animation length estimate (seconds)',input(line.animationSeconds,v=>{
      if(Number.isFinite(v)&&v>=0)line.animationSeconds=v;else delete line.animationSeconds;mark();
     },'number'));estimate.min=0;estimate.step='any';
     duration(row,()=>api.lineSeconds(line,clipSeconds));
     drawSounds(row,'Action sounds',()=>line.soundCues,value=>{line.soundCues=value;});
     const speed=field(parameters,'Animation speed (×)',input(line.animationSpeed??1,v=>{
      if((speed.value===''&&!speed.validity.badInput)||v===1)delete line.animationSpeed;
      else line.animationSpeed=Number.isFinite(v)?v:0;
      mark();
     },'number'));
     speed.step='any';speed.placeholder='1';speed.parentElement.hidden=!line.animation;
     const advanced=element('details');advanced.className='encounter-advanced';advanced.append(element('summary','Advanced action settings'));
     if(!line.mainPlaylist)row.append(advanced);
     advanced.open=closed.has('advanced:'+line.id);
     advanced.ontoggle=()=>{if(advanced.isConnected){if(advanced.open)closed.add('advanced:'+line.id);else closed.delete('advanced:'+line.id);}};
     for(const [key,label] of [['repeatSpeech','Repeat spoken line until canceled'],['repeatAnimation','Repeat animation until canceled']]){
      const toggle=element('input');toggle.type='checkbox';toggle.checked=line[key]===true;
      toggle.onchange=()=>{line[key]=toggle.checked;if(!line.repeatSpeech&&!line.repeatAnimation){delete line.playlistStart;delete line.playlistEnd;redraw();}else mark();};field(advanced,label,toggle);
     }
     if(currentBranch||owner){
      const settings=advanced;
      if(!line.mainPlaylist)for(const [key,label] of [['playlistStart','First repeated action'],['playlistEnd','Last repeated action']]){
       const check=element('input');check.type='checkbox';check.checked=!!line[key];
       check.onchange=()=>{
        if(check.checked&&!api.isRepeat(line)){check.checked=false;message.textContent='Enter a line or animation and select it to repeat first.';return;}
        const group=owner?g.dialogue.filter(r=>owner.actions.includes(r.id)):Object.values(api.dialogueSections(g)).find(rows=>rows.includes(line));
        for(const sibling of group||[])delete sibling[key];
        if(check.checked)line[key]=true;redraw();
       };field(settings,label,check);
      }
      const add=button('Create chance playlist',()=>{
       const used=(line.branches||[]).reduce((sum,b)=>sum+b.chance,0);
       (line.branches||=[]).push({chance:Math.max(0,Math.min(25,100-used)),passes:1,completion:'reroll',actions:[newAction()]});redraw();
      });add.disabled=g.dialogue.length>=100;toolbar.append(add);
      for(const [index,branch] of (line.branches||[]).entries()){
       const lane=element('details');lane.setAttribute('aria-label','Chance playlist '+(index+1));
       const heading=element('summary','Chance playlist '+(index+1)+' · '+branch.chance+'%');
       lane.append(heading);row.append(lane);keepOpen(lane,branch.actions[0]);
       const chanceFields=element('div');chanceFields.className='encounter-action-fields';lane.append(chanceFields);
       const run=sectionPreviews.get(sourceOf(line)?.section);
       if(run&&branch.actions.length)chanceFields.append(startHere('Chance playlist '+(index+1),()=>run({branch})));
       const bounds=element('details');bounds.append(element('summary','Advanced chance settings'));lane.append(bounds);
       const boundFields=element('div');boundFields.className='encounter-action-fields';bounds.append(boundFields);
       lane.className='encounter-chance-playlist';
       duration(lane,()=>api.timing(api.branchPlaylist(branch,byId),branch.passes??1,clipSeconds,true));
       drawSounds(lane,'Chance playlist sounds',()=>branch.soundCues,value=>{branch.soundCues=value;});
       lane.style.setProperty('--playlist-color',['#f3c55b','#f896cc','#aaafff'][depth%3]);

       const probability=field(chanceFields,'Chance (%)',input(branch.chance,v=>{branch.chance=v;heading.textContent='Chance playlist '+(index+1)+' · '+v+'%';mark();},'number'));
       probability.min=0;probability.max=100;probability.step='any';
       const passes=field(chanceFields,'Playlist passes (0 = until canceled)',input(branch.passes??1,v=>{branch.passes=v;mark();},'number'));
       passes.min=0;passes.max=100;passes.step=1;
       const modes=api.completionOptions.filter(([mode])=>!['start','action'].includes(mode)||segment?.key);
       if(!branch.completion)modes.unshift(['','Use saved return behavior']);
       field(chanceFields,'After chance playlist',select(modes,branch.completion||'',value=>{
        if(value)branch.completion=value;else delete branch.completion;
        if(value==='action')branch.returnAction=segment.rows[0].id;else delete branch.returnAction;
        redraw();
       }));
       if(branch.completion==='action'&&segment?.key){
        const target=field(chanceFields,'Return to action',select(segment.rows.map(row=>[row.id,actionLabel(row,executionNumbers.get(row.id))]),
         branch.returnAction,value=>{branch.returnAction=value;mark();}));
        for(const option of target.options){
         option.dataset.number=executionNumbers.get(option.value);
         if(!actionOptions.has(option.value))actionOptions.set(option.value,[]);
         actionOptions.get(option.value).push(option);
        }
       }
       for(const [key,label,automatic] of [['startAction','Starting action','Automatic start'],['endAction','Ending action','Automatic end']]){
        const options=branch.actions.map((id,i)=>{
         const action=g.dialogue.find(r=>r.id===id);
         return [id,action?actionLabel(action,number+'.'+(index+1)+'.'+(i+1)):id];
        });
        const bound=field(boundFields,label,select([['',automatic],...options],branch[key]||'',value=>{
         if(value)branch[key]=value;else delete branch[key];
         mark();
        }));
        for(const option of Array.from(bound.options).slice(1)){
         if(!actionOptions.has(option.value))actionOptions.set(option.value,[]);
         option.dataset.number=number+'.'+(index+1)+'.'+option.index;
         actionOptions.get(option.value).push(option);
        }
       }
       function release(actions){
        const conversation=branchOf(anchor);
        let last=anchor;
        const parent=api.playlistSegments(Object.values(sections).find(rows=>rows.includes(anchor))).find(segment=>segment.rows.includes(anchor));
        const parentKey=parent.legacy?newKey():parent.key;
        if(parent.legacy)setMembers(parent.rows,parentKey,0,parent.rows);
        for(const action of actions){
         const oldId=action.id;
         branch.actions.splice(branch.actions.indexOf(oldId),1);checked.delete(oldId);
         for(const bound of ['startAction','endAction'])if(branch[bound]===oldId)delete branch[bound];
         for(const flag of ['repeatSpeech','repeatAnimation','playlistStart','playlistEnd'])delete action[flag];
         g.dialogue.splice(g.dialogue.indexOf(action),1);
         action.id=nextLineId(g,conversation);
         if(parentKey)setMembers([action],parentKey,parent.passes,[],parent.chance);
         g.dialogue.splice(g.dialogue.indexOf(last)+1,0,action);
         if(g.decisionAfter===last.id)g.decisionAfter=action.id;
         last=action;
        }
        if(!branch.actions.length)line.branches.splice(index,1);
        redraw();
       }
       const rows=branch.actions.map(id=>byId.get(id)).filter(Boolean);
       rows.forEach((action,i)=>drawRow(action,lane,branch,depth+1,number+'.'+(index+1)+'.'+(i+1),null,group,anchor,release));
       const moveSelected=button('Remove selected from chance playlist',()=>release(rows.filter(action=>checked.has(action.id))));
       selectionControls.push([moveSelected,rows]);
       const candidates=(group||[]).filter(action=>action!==anchor);
       const addSelected=button('Add selected to chance playlist',()=>{
        for(const action of candidates.filter(row=>checked.has(row.id))){
         const oldId=action.id;checked.delete(oldId);
         if(g.decisionAfter===oldId){
          const arrival=branchLines(g,'arrival');
          g.decisionAfter=arrival[arrival.indexOf(action)-1]?.id||'before';
         }
         const member=api.playlistSegments(Object.values(sections).find(rows=>rows.includes(action))||[]).find(segment=>segment.rows.includes(action));
         detach([action],member);
         for(const flag of ['playlistStart','playlistEnd'])delete action[flag];
         action.id=branchId();branch.actions.push(action.id);
        }
        redraw();
       });
       selectionControls.push([addSelected,candidates]);
       const addAction=button('Add branch action',()=>{branch.actions.push(newAction());redraw();});
       const branchTools=element('div');branchTools.className='encounter-action-tools';lane.append(branchTools);
       addAction.disabled=g.dialogue.length>=100;branchTools.append(moveSelected,addSelected,addAction,button('Delete chance playlist permanently',()=>{
        if(!confirm('Remove this playlist and all its actions?'))return;
        removeActions(branch.actions);line.branches.splice(index,1);redraw();
       }));
      }
     }
     const attach=async file=>{
      if(!line.text.trim())throw Error('Enter the spoken line first.');
      const who=line.speaker,text=line.text,I=root.VoidVoiceImports,p=await I.prepare(file);
      if(!p.ok)throw Error(p.why);
      if(!await I.store(p.hash,p.type,p.data,p.duration))throw Error('Could not store the recording.');
      if(line.speaker!==who||line.text!==text)throw Error('The line changed during import.');
      line.recording={who,text,hash:p.hash,type:p.type,bytes:p.bytes,duration:p.duration};mark();audio.textContent='Recorded';
     };
     uploads.set(line.id.toLowerCase(),attach);
     const upload=element('input');upload.type='file';upload.accept='audio/*,.ogg,.mp3,.wav';
     upload.onchange=async()=>{try{if(upload.files[0])await attach(upload.files[0]);}catch(e){audio.textContent=e.message;}finally{upload.value='';}};
     const recordings=element('details');recordings.className='encounter-recordings';
     const recordedSummary=element('summary','Recording and voice');recordedSummary.append(audio);recordings.append(recordedSummary);keepOpen(recordings,'recording:'+line.id);
     row.insertBefore(recordings,row.querySelector('.encounter-chance-playlist'));
     field(recordings,'Import recording',upload);
     const generate=button('Generate voice',async()=>{
      if(generate.disabled)return;
      try{
       const who=line.speaker,text=line.text,tags=(line.tags||'').trim();
       const voice=tools.voiceNow?.(who)||root.VoidMissionEditor?.shared?.voiceNow(who);
       if(!text.trim())throw Error('Enter the spoken line first.');
       if(!voice?.voiceId||voice.kind!=='elevenlabs')throw Error('Choose an ElevenLabs voice for '+who+' under NPCs → Lines & voice, or import a recording.');
       const spoken=(tags?(tags.startsWith('[')?tags:'['+tags+']')+' ':'')+text;
       if(spoken.length>700||root.VoidNPCVoices?.tagProblems(spoken).length)throw Error('Check the delivery tags and keep the tagged line under 701 characters.');
       if(!confirm('Generate this line using '+voice.name+' ('+spoken.length+' input characters)? This uses ElevenLabs credits.'))return;
       generate.disabled=true;
       const response=await tools.request('developer/companion-voice',{voiceId:voice.voiceId,text:spoken});
       if(line.speaker!==who||line.text!==text)throw Error('The line changed during generation.');
       const bytes=Uint8Array.from(atob(response.audio),c=>c.charCodeAt(0));
       await attach(new File([bytes],line.id+'.mp3',{type:'audio/mpeg'}));
      }catch(e){audio.textContent=e.message;}finally{generate.disabled=false;}
     });
     const recordTools=element('div');recordTools.className='encounter-action-tools';recordings.append(recordTools);
     recordTools.append(generate,button('Play recording',async()=>{
      try{
       if(!line.recording)throw Error('Import a recording first.');
       const data=await root.VoidVoiceImports.getData(line.recording.hash);
       const url=URL.createObjectURL(new Blob([data],{type:line.recording.type})),player=new Audio(url);
       player.onended=player.onerror=()=>URL.revokeObjectURL(url);
       try{await player.play();}catch(e){URL.revokeObjectURL(url);throw e;}
      }catch(e){audio.textContent=e.message;}
     }));
     if(owner||branchOf(line))actionFooter(row,'Add action',()=>insertAction(line,owner,segment,true));
    }
    const names={opening:g.cast?'Encounter dialogue':'Arrival',remaining:'Arrival after choices',free:'Free Lace',be_kade:'Be Kade',wait:'Waiting for choice'};
    for(const [key,group] of Object.entries(sections)){
     if(g.cast&&key!=='opening'&&!group.length)continue;
     const section=element('section');section.className='encounter-conversation';
     section.dataset.conversation=key==='opening'||key==='remaining'?'arrival':key;
     section.dataset.section=key;
     section.append(element('h3',names[key]));dialogue.append(section);
     duration(section,()=>api.playlistSegments(group).map(segmentTiming).reduce((total,part)=>({
      seconds:total.seconds+part.seconds,unknown:total.unknown||part.unknown,variable:total.variable||part.variable,loop:total.loop||part.loop
     }),{seconds:0}));
     drawSounds(section,'Section sounds',()=>g.sectionSounds?.[key],value=>soundMap('sectionSounds',key,value));
     const toolsRow=element('div');toolsRow.className='encounter-action-tools';section.append(toolsRow);
     if(group.length)sectionPreviews.set(key,drawPreview(section,toolsRow,group,key,names[key]));
     const segments=api.playlistSegments(group);
     segments.flatMap(part=>part.rows).forEach((line,i)=>executionNumbers.set(line.id,i+1));
     const eligible=segments.filter(part=>!part.key).flatMap(part=>part.rows);
     function selectedAction(label,apply){
      const control=button(label,()=>{
       const selected=eligible.filter(line=>checked.has(line.id));
       apply(selected);for(const line of selected)checked.delete(line.id);redraw();
      });
      selectionControls.push([control,eligible]);return control;
     }
     toolsRow.append(selectedAction('Create playlist from selected',rows=>setMembers(rows,newKey(),0)));
     let number=0,playlistNumber=0;
     for(const segment of segments){
      let lane=section;
      if(segment.key){
       lane=element('details');lane.className='encounter-main-playlist';section.append(lane);
       lane.append(element('summary','Main playlist '+(++playlistNumber)+' · '+segment.rows.length+' actions'));
       keepOpen(lane,key+':'+segment.key);
       lane.append(startHere('Main playlist '+playlistNumber,()=>sectionPreviews.get(key)({segment})));
       duration(lane,()=>segmentTiming(segment));
       const soundKey=key+':'+segment.key;
       drawSounds(lane,'Main playlist sounds',()=>g.playlistSounds?.[soundKey],value=>soundMap('playlistSounds',soundKey,value));
       const controls=element('div');controls.className='encounter-action-fields';lane.append(controls);
       const membership=()=>segment.legacy?newKey():segment.key;
       field(controls,'Repeat',select([['0','Until canceled'],['count','Number of passes'],['chance','Chance to continue (%)']],segment.chance!==undefined?'chance':segment.passes?'count':'0',value=>{
        setMembers(segment.rows,membership(),value==='count'?1:0,segment.legacy?segment.rows:[],value==='chance'?50:undefined);redraw();
       }));
       if(segment.chance!==undefined){
        const chance=field(controls,'Chance to continue (%)',input(segment.chance,value=>{
         for(const row of segment.rows)row.mainContinueChance=value;segment.chance=value;mark();
        },'number'));chance.min=0;chance.max=100;chance.step='any';
       }
       if(segment.passes){
        const passes=field(controls,'Main playlist passes',input(segment.passes,value=>{
         for(const row of segment.rows)row.mainPasses=value;segment.passes=value;mark();
        },'number'));passes.min=1;passes.max=100;passes.step=1;
       }
       controls.append(selectedAction('Add selected to this playlist',rows=>{
        setMembers(group.filter(row=>segment.rows.includes(row)||rows.includes(row)),membership(),segment.passes,segment.legacy?segment.rows:[],segment.chance);
       }));
       const remove=button('Remove selected from main playlist',()=>{
        detach(segment.rows.filter(row=>checked.has(row.id)),segment);redraw();
       });
       selectionControls.push([remove,segment.rows]);controls.append(remove);
       const add=button('Add playlist action',()=>{
        const last=segment.rows.at(-1),id=nextLineId(g,branchOf(last));
        const line={id,speaker:g.cast?.[0]?.id||'lace',text:'',animation:'',delay:0,tags:''};
        g.dialogue.splice(g.dialogue.indexOf(last)+1,0,line);
        if(g.decisionAfter===last.id)g.decisionAfter=id;
        setMembers([...segment.rows,line],membership(),segment.passes,segment.legacy?segment.rows:[],segment.chance);redraw();
        host.querySelector('[data-line-id="'+id+'"] textarea')?.focus();
       });
       add.disabled=g.dialogue.length>=100;controls.append(add);
       const next=segments[segments.indexOf(segment)+1]?.rows[0];
       for(const [label,after] of [['Add action before playlist',false],['Add action after playlist',true]]){
        const anchor=after?(next||segment.rows.at(-1)):segment.rows[0];
        const outside=button(label,()=>insertAction(anchor,null,null,after&&!next));
        outside.disabled=g.dialogue.length>=100;controls.append(outside);
       }
      }
      for(const line of segment.rows)drawRow(line,lane,null,0,String(++number),segment,eligible);
     }
     actionFooter(section,'Add action to conversation',()=>insertAction(group.at(-1),null,null,true,key));
    }
    for(const line of ordered)if(!drawn.has(line.id))drawRow(line,dialogue,null);
    refresh();
    function drawPreview(section,toolsRow,group,key,name){
     const panel=element('div');panel.className='encounter-execution-preview';panel.hidden=true;
     const status=element('output'),trace=element('ol');status.setAttribute('aria-live','polite');
     let active,controller;
     const stop=button('Stop execution preview',()=>controller?.abort());
     const start=startHere(name,()=>run());
     async function run(target){
      preview?.abort();previewSounds?.dispose();const runController=new AbortController();controller=preview=runController;
      const timeline=api.soundTimeline();previewSounds=timeline;
      const {signal}=runController;
      panel.hidden=false;trace.replaceChildren();start.disabled=true;stop.disabled=false;
      if(target)panel.scrollIntoView?.({block:'nearest'});
      const pause=ms=>new Promise((resolve,reject)=>{
       signal.throwIfAborted();
       const abort=()=>{clearTimeout(timer);reject(signal.reason);};
       const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);
       signal.addEventListener('abort',abort,{once:true});
      });
      const node=line=>section.querySelector('[data-line-id="'+line.id+'"]');
      const describe=line=>line?actionLabel(line,node(line)?.dataset.executionNumber||line.id):'end of playlist';
      try{
       const problems=api.validate(g);
       if(problems.length)throw Error(problems[0]);
       const execute=()=>api.runPlaylist(group,byId,{
        signal,pause,previewTarget:target,play:(row,_,replay)=>{
         const t=api.lineSeconds(row,clipSeconds,replay);
         return pause(Math.max(550,t.seconds*1000));
        },
        scope:(kind,item,local,work)=>api.withSounds(timeline,api.soundsFor(g,key,kind,item),local,work),
        observe:event=>{
        if(!section.isConnected){runController.abort();signal.throwIfAborted();}
        if(event.type==='action'){
         active?.removeAttribute('aria-current');active=node(event.row);
         active?.setAttribute('aria-current','step');
         const speed=event.row.animationSpeed;
         status.textContent='Playing '+describe(event.row)+(event.row.animation&&speed?' · Animation '+speed+'×':'');return;
        }
        const text=event.type==='continue-roll'
         ? 'Rolled '+(event.roll*100).toFixed(2)+'% against '+event.chance+'% to continue. '+(event.continued?'Continue':'Repeat')
         : event.type==='roll'
         ? 'Rolled '+(event.roll*100).toFixed(2)+'% after '+describe(event.row)+' · '+(event.branch?'Branch taken ('+event.branch.chance+'%)':'Continue')
         : (event.mode==='reroll'?'Reroll after ':'Return to ')+describe(event.target);
        trace.prepend(element('li',text));if(trace.children.length>12)trace.lastElementChild.remove();
       }});
       await (target?execute():api.withSounds(timeline,g.sectionSounds?.[key],signal,execute));
       timeline.finish();status.textContent='Preview complete';
      }catch(error){timeline.dispose();if(controller===runController)status.textContent=signal.aborted?'Preview stopped':error.message;}
      finally{
       if(controller===runController){active?.removeAttribute('aria-current');active=null;start.disabled=false;stop.disabled=true;}
       if(preview===runController)preview=null;
      }
     }
     toolsRow.append(start);panel.append(status,stop,trace);section.append(panel);
     return run;
    }
   }
   const board=element('div');board.className='encounter-board';board.setAttribute('aria-label','Encounter connections');host.append(board);
   for(const n of g.nodes){
    const cell=element('section');cell.style.setProperty('--node-color',colors[n.kind]);cell.className='encounter-node';
    cell.append(element('small',api.kinds[n.kind]),button(n.name,()=>{selected=n.id;draw();}));
    for(const edge of n.edges){
     const to=g.nodes.find(it=>it.id===edge.to);
     cell.append(button((edge.label?edge.label+' ':'')+'→ '+(to?.name||'Missing node'),()=>{selected=edge.to;draw();}));
    }
    if(n.id===selected)cell.setAttribute('aria-current','true');board.append(cell);
   }
   const types=select(Object.entries(api.kinds).filter(([kind])=>g.cast?['trigger','cast','choice','end'].includes(kind):kind!=='cast'),g.cast?'cast':'move',()=>{});
   host.append(types,button('Add node',()=>{
    const key='node-'+crypto.randomUUID().slice(0,8);g.nodes.push({id:key,kind:types.value,name:api.kinds[types.value],edges:[]});selected=key;mark();draw();
   }));
   const n=g.nodes.find(n=>n.id===selected);
   if(!n)return;
   const detail=element('fieldset');detail.append(element('legend',api.kinds[n.kind]));host.append(detail);
   field(detail,'Node name',input(n.name,v=>{n.name=v;mark();}));
   drawSounds(detail,'Node start and end sounds',()=>n.soundCues,value=>{n.soundCues=value;});
   if(n.kind==='cast')field(detail,'Talk to',select([['','First cast member'],...(g.cast||[]).map(actor=>[actor.id,actor.name])],n.speaker||'',value=>{n.speaker=value;mark();}));
   if(n.kind==='animation'){
    field(detail,'Action',select([['','Choose an action'],['stumble','Fall at the crossing'],['release','Release and leave the apartment'],['roleplay','Optional Kade roleplay']],n.action||'',v=>{n.action=v;mark();}));
   }
   n.edges.forEach((edge,index)=>{
    const row=element('div');
    if(n.kind==='choice'){
     const fallback='Choice '+(index+1);
     const control=!tools.mobile&&startHere(edge.label||fallback,()=>launch(edge.to));
     field(row,'Choice',input(edge.label,v=>{edge.label=v;control&&control.setAttribute('aria-label','Start from this point: '+(v||fallback));mark();}));
     if(control)row.append(control);
    }
    field(row,'Connect to',select(names,edge.to,v=>{edge.to=v;mark();draw();}));
    row.append(button('Disconnect',()=>{n.edges.splice(index,1);mark();draw();}));detail.append(row);
   });
   if(n.kind!=='end'&&(n.kind==='choice'||!n.edges.length))detail.append(button('Add connection',()=>{
    const dest=g.nodes.find(it=>it.id!==n.id);if(!dest)return;
    n.edges.push(n.kind==='choice'?{label:'New choice',to:dest.id}:{to:dest.id});mark();draw();
   }));
   detail.append(button('Remove node',()=>{
    g.nodes=g.nodes.filter(it=>it!==n);for(const other of g.nodes)other.edges=other.edges.filter(e=>e.to!==n.id);
    if(g.start===n.id)g.start=g.nodes[0]?.id||'';selected=g.start;mark();draw();
   }));
  }
  if(tools.mobile){draw();return;}
  const returned=sessionStorage.getItem('chance-editor-return');sessionStorage.removeItem('chance-editor-return');
  let restore;
  try{restore=JSON.parse(sessionStorage.getItem('chance-playtest-draft'));}catch{}
  sessionStorage.removeItem('chance-playtest-draft');
  if(restore?.uid===uid&&returned&&restore.graph?.id===returned&&restore.dirty){
   if(!records.has(returned)&&restore.revision===0)records.set(returned,{id:returned,draft:restore.graph,revision:0});
   const saved=records.get(returned);
   if(saved&&!saved.deleted&&saved.revision===restore.revision){
    choose(returned);working=api.withWaitingDialogue(restore.graph);selected=restore.selected||working.start;dirty=true;draw();return;
   }
  }
  if(returned&&records.has(returned)&&!records.get(returned).deleted)choose(returned);
  else draw();
 }
 root.VoidEncounterEditor={mount};
})(globalThis);
