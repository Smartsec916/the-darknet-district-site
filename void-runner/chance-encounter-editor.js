(function(root){
 'use strict';
 const conversations=[['arrival','Arrival'],['free','Free Lace'],['be_kade','Be Kade'],['wait','Waiting for choice']];
 const branchOf=line=>conversations.find(([key])=>line.id.startsWith('lace_'+key+'_'))?.[0];
 const branchLines=(graph,branch)=>graph.dialogue.filter(line=>branchOf(line)===branch);
 function nextLineId(graph,branch){
  const prefix='lace_'+branch+'_';let n=1;
  while(graph.dialogue.some(line=>line.id===prefix+String(n).padStart(2,'0')))n++;
  return prefix+String(n).padStart(2,'0');
 }
 function insertLine(graph,line,branch,before){
  const last=branchLines(graph,branch).at(-1);
  const index=before?graph.dialogue.indexOf(before):last?graph.dialogue.indexOf(last)+1:graph.dialogue.length;
  graph.dialogue.splice(index,0,line);
 }
 const colors={trigger:'#e3be52',move:'#71aaff',item:'#6cd598',choice:'#c29af7',animation:'#f4a563',location:'#65d5ce',end:'#f17d84'};
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
  l.append(input);host.append(l);return input;
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
  const [catalog,seed]=await Promise.all([tools.request('developer/chance-encounters'),fetch('void-runner/chance-encounter-seed.json').then(r=>{if(!r.ok)throw Error('Could not load Pleasure Breach.');return r.json();})]);
  if(!current())return;
  const records=new Map(catalog.encounters.map(r=>[r.id,r]));
  if(!records.has(seed.id))records.set(seed.id,{id:seed.id,revision:0,draft:seed});
  let id=[...records.values()].find(r=>!r.deleted)?.id,selected,dirty=false,busy=false,status='';
  let working,addBranch='arrival';
  const record=()=>records.get(id),graph=()=>working;
  const mark=()=>{dirty=true;message.textContent='Unsaved draft';};
  const message=element('p');message.setAttribute('role','status');
  function choose(key){id=key;working=api.withWaitingDialogue(structuredClone(record()?.draft));selected=graph()?.start;dirty=false;status='';draw();}
  function newGraph(duplicate){
   if(dirty&&!confirm('Discard the unsaved changes?'))return;
   const key='enc-'+crypto.randomUUID().slice(0,12);
   const draft=structuredClone(duplicate?graph():seed);
   if(!duplicate){
    draft.nodes=[{id:'start',kind:'trigger',name:'Encounter begins',edges:[{to:'end'}]},{id:'end',kind:'end',name:'End encounter',edges:[]}];
    draft.start='start';draft.dialogue=[];delete draft.item;delete draft.residence;
   }
   draft.id=key;draft.name=duplicate?draft.name+' (copy)':'New encounter';draft.enabled=false;
   records.set(key,{id:key,revision:0,draft});choose(key);mark();
  }
  async function send(action){
   if(!current()||busy)return;
   const g=graph(),r=record();
   if(action==='publish'){
    const errors=api.validate(g);
    if(errors.length){message.textContent=errors.join(' ');return;}
    if(!confirm('Publish '+g.name+' for all players?'))return;
   }
   if(action==='delete'&&!confirm('Delete '+g.name+' and remove it from live encounters?'))return;
   busy=true;host.inert=true;
   try{
    if(action==='save'||action==='publish'){
     const recordings=(g.dialogue||[]).flatMap(line=>line.recording?[line.recording]:[]);
     if(recordings.length)await root.VoidVoiceImports.upload((path,body)=>tools.request(path,body),recordings);
    }
    const saved=await tools.request('developer/chance-encounters',{action,id,revision:r.revision,graph:g});
    if(!current())return;
    records.set(id,saved);dirty=false;
    if(action==='delete')id=[...records.values()].find(v=>!v.deleted)?.id;
    working=api.withWaitingDialogue(structuredClone(record()?.draft));if(action==='delete')selected=working?.start;
    status=action==='publish'?'Published revision '+saved.revision:action==='save'?'Saved draft':'Encounter deleted';draw();
   }catch(e){message.textContent=e.message;}finally{busy=false;host.inert=false;}
  }
  function draw(){
   host.replaceChildren();
   const bar=element('div');bar.className='dev-actions';host.append(bar);
   const entries=[...records.values()].filter(r=>!r.deleted);
   if(entries.length)bar.append(select(entries.map(r=>[r.id,r.draft.name]),id,key=>{if(!dirty||confirm('Leave this unsaved draft?'))choose(key);else draw();}));
   bar.append(button('New encounter',()=>newGraph(false)));
   const g=graph();if(!g){host.append(message);return;}
   bar.append(button('Duplicate',()=>newGraph(true)),button('Save draft',()=>send('save')),button('Publish',()=>send('publish')),button('Delete',()=>send('delete')));
   const launch=async(start)=>{
    try{
     sessionStorage.setItem('chance-playtest-draft',JSON.stringify({uid,graph:g,revision:record().revision,dirty,selected}));
     await root.VoidEncounterGame.playtest(structuredClone(g),start);
    }
    catch(e){message.textContent=e.message;}
   };
   bar.append(button('▶ Play This Chance Encounter',()=>launch(g.start)),button('Play From Selected Node',()=>launch(selected||g.start)));
   if(record().live){
    const live=record().live;
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
   field(props,'Chance (%)',input(g.conditions.chance,v=>{g.conditions.chance=v;mark();},'number'));
   field(props,'Opportunity interval (seconds)',input(g.conditions.intervalSeconds,v=>{g.conditions.intervalSeconds=v;mark();},'number'));
   const conditions=element('details');conditions.append(element('summary','Eligibility and repeat visits'));host.append(conditions);
   for(const [key,label,initial] of [['radius','Activation radius (metres)',20],['cooldownSeconds','Cooldown (seconds)',0],['dailyLimit','Maximum occurrences per game day (0 for unlimited)',0],['fromMinute','Start minute of game day',0],['toMinute','End minute of game day',0]])
    field(conditions,label,input(g.conditions[key]??initial,v=>{g.conditions[key]=v;mark();},'number'));
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
   setup.append(button('Set From Current Player Position',()=>{
    if(typeof walker==='undefined'||!walker||walkingLocation?.area!=='street'){message.textContent='Stand on the street at the desired starting point.';return;}
    updateStart({x:walker.x,z:walker.z,yaw:walker.yaw,pitch:walker.pitch,quarter:walkingLocation.quarter});
   }));
   setup.addEventListener('toggle',()=>{
    if(!setup.open||map||!root.VoidNPCMap)return;
    map=root.VoidNPCMap.create({npc:null,area:g.playtest.quarter,markers:[marker()],selected:'player',
     onArea:quarter=>{g.playtest.quarter=quarter;mark();},onPick:(x,z)=>updateStart({x,z}),
     onDrag:(_,x,z)=>updateStart({x,z}),onFacing:(_,yaw)=>updateStart({yaw})});
    setup.append(map.el);
   });
   if(g.residence&&g.placement){
    const placement=element('details');placement.append(element('summary','Apartment placement and animation'));host.append(placement);
    for(const [key,label] of [['x','East / west'],['y','Floor offset'],['z','North / south'],['yaw','Facing (radians)'],['scale','Character scale']])
     field(placement,label,input(g.placement[key],v=>{g.placement[key]=v;mark();},'number'));
    field(placement,'Apartment animation',input(g.placement.clip,v=>{g.placement.clip=v;mark();}));
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
   if(g.dialogue?.length){
    const dialogue=element('details');dialogue.append(element('summary','Dialogue ('+g.dialogue.length+' slots)'));dialogue.open=true;host.insertBefore(dialogue,props);
    if(g.id==='dropped-cardkey'){
     const position=element('select');position.setAttribute('aria-label','Insert new line');
     const fillPositions=()=>{
      position.replaceChildren(new Option('End of this conversation',''));
      for(const line of branchLines(g,addBranch))position.add(new Option('Before '+line.id+(line.text?' — '+line.text.slice(0,45):''),line.id));
     };
     const branch=select(conversations,addBranch,v=>{addBranch=v;fillPositions();});
     fillPositions();
     const arrival=g.dialogue.filter(l=>l.id.startsWith('lace_arrival_'));
     field(dialogue,'Show player choices',select([['end','After all arrival lines'],['before','Before the first line'],
      ...arrival.map(l=>[l.id,'After '+l.id+(l.text?' — '+l.text.slice(0,55):'')])],g.decisionAfter||'end',v=>{g.decisionAfter=v;mark();}));
     field(dialogue,'Conversation',branch);field(dialogue,'Insert new line',position);
     dialogue.append(element('p','Waiting lines play in order while the choices are open. A choice cancels the current repeat. Set the delay on each line, or clear the text to keep Lace silent.'));
     const add=button('Add Lace line',()=>{
      const line={id:nextLineId(g,addBranch),speaker:'lace',text:'',tags:'',delay:addBranch==='wait'?12:0,animation:''};
      insertLine(g,line,addBranch,g.dialogue.find(l=>l.id===position.value));mark();draw();
      host.querySelector('[data-line-id="'+line.id+'"] input')?.focus();
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
    const editable=g.id==='dropped-cardkey';
    const ordered=editable?[...conversations.flatMap(([key])=>branchLines(g,key)),...g.dialogue.filter(l=>!branchOf(l))]:g.dialogue;
    for(const line of ordered){
     const row=element('fieldset');row.append(element('legend',line.id));dialogue.append(row);
     const currentBranch=editable&&branchOf(line);
     if(currentBranch){
      row.dataset.lineId=line.id;
      const siblings=branchLines(g,currentBranch),index=siblings.indexOf(line);
      const redrawLine=()=>{mark();draw();host.querySelector('[data-line-id="'+line.id+'"] select')?.focus();};
      field(row,'Conversation for this line',select(conversations,currentBranch,destination=>{
       if(g.decisionAfter===line.id)g.decisionAfter=siblings[index-1]?.id||'before';
       if(currentBranch==='wait')g.waitingDialogueConfigured=true;
       g.dialogue.splice(g.dialogue.indexOf(line),1);
       line.id=nextLineId(g,destination);
       insertLine(g,line,destination);redrawLine();
      }));
      for(const [step,label] of [[-1,'Move earlier'],[1,'Move later']]){
       const adjacent=siblings[index+step];
       const move=button(label,()=>{
        const a=g.dialogue.indexOf(line),b=g.dialogue.indexOf(adjacent);
        [g.dialogue[a],g.dialogue[b]]=[g.dialogue[b],g.dialogue[a]];redrawLine();
       });
       move.disabled=!adjacent;row.append(move);
      }
     }
     const audio=element('output',line.recording?'Recorded':'No recording');
     for(const [key,label] of [['text','Spoken line'],['speaker','Speaker'],['tags','Delivery tags'],['delay',line.id.startsWith('lace_wait_')?'Wait before this line (seconds)':'Delay (seconds)'],['animation','Animation']])
      field(row,label,input(line[key],v=>{
       if(key==='text'||key==='speaker'){delete line.recording;audio.textContent='No recording';}
       line[key]=v;mark();
      },key==='delay'?'number':'text'));
     for(const [key,label] of [['repeatSpeech','Repeat spoken line until canceled'],['repeatAnimation','Repeat animation until canceled']]){
      const toggle=element('input');toggle.type='checkbox';toggle.checked=line[key]===true;
      toggle.onchange=()=>{line[key]=toggle.checked;mark();};field(row,label,toggle);
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
     field(row,'Import recording',upload);
     const generate=button('Generate voice',async()=>{
      if(generate.disabled)return;
      try{
       const who=line.speaker,text=line.text,tags=(line.tags||'').trim();
       const voice=root.VoidMissionEditor?.shared?.voiceNow(who);
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
     row.append(generate);
     row.append(button('Play recording',async()=>{
      try{
       if(!line.recording)throw Error('Import a recording first.');
       const data=await root.VoidVoiceImports.getData(line.recording.hash);
       const url=URL.createObjectURL(new Blob([data],{type:line.recording.type})),player=new Audio(url);
       player.onended=player.onerror=()=>URL.revokeObjectURL(url);
       try{await player.play();}catch(e){URL.revokeObjectURL(url);throw e;}
      }catch(e){audio.textContent=e.message;}
     }),audio);
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
   const types=select(Object.entries(api.kinds),'move',()=>{});
   host.append(types,button('Add node',()=>{
    const key='node-'+crypto.randomUUID().slice(0,8);g.nodes.push({id:key,kind:types.value,name:api.kinds[types.value],edges:[]});selected=key;mark();draw();
   }));
   const n=g.nodes.find(n=>n.id===selected);
   if(!n)return;
   const detail=element('fieldset');detail.append(element('legend',api.kinds[n.kind]));host.append(detail);
   field(detail,'Node name',input(n.name,v=>{n.name=v;mark();}));
   if(n.kind==='animation'){
    field(detail,'Action',select([['','Choose an action'],['stumble','Fall at the crossing'],['release','Release and leave the apartment'],['roleplay','Optional Kade roleplay']],n.action||'',v=>{n.action=v;mark();}));
   }
   n.edges.forEach((edge,index)=>{
    const row=element('div');
    if(n.kind==='choice')field(row,'Choice',input(edge.label,v=>{edge.label=v;mark();}));
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
  choose(records.has(returned)?returned:id);
 }
 root.VoidEncounterEditor={mount};
})(globalThis);
