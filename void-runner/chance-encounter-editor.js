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
  const [catalog,seed]=await Promise.all([tools.request('developer/chance-encounters'),fetch(tools.seedUrl||'void-runner/chance-encounter-seed.json').then(r=>{if(!r.ok)throw Error('Could not load Pleasure Breach.');return r.json();})]);
  if(!current())return;
  const records=new Map(catalog.encounters.map(r=>[r.id,r]));
  if(!records.has(seed.id))records.set(seed.id,{id:seed.id,revision:0,draft:seed});
  let id=[...records.values()].find(r=>!r.deleted)?.id,selected,dirty=false,busy=false,status='';
  let working,addBranch='arrival',dialogueOpen=!tools.mobile,preview;
  const checked=new Set(),closed=new Set();
  const record=()=>records.get(id),graph=()=>working;
  const mark=()=>{dirty=true;tools.onDirtyChange?.(true);message.textContent='Unsaved draft';};
  const message=element('p');message.setAttribute('role','status');
  function choose(key){checked.clear();closed.clear();id=key;working=api.withWaitingDialogue(structuredClone(record()?.draft));selected=graph()?.start;dirty=false;tools.onDirtyChange?.(false);status='';draw();}
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
    records.set(id,saved);dirty=false;tools.onDirtyChange?.(false);
    if(action==='delete')id=[...records.values()].find(v=>!v.deleted)?.id;
    working=api.withWaitingDialogue(structuredClone(record()?.draft));if(action==='delete')selected=working?.start;
    status=action==='publish'?'Published revision '+saved.revision:action==='save'?'Saved draft':'Encounter deleted';draw();
   }catch(e){message.textContent=e.message;}finally{busy=false;host.inert=false;}
  }
  function draw(){
   preview?.abort();
   host.replaceChildren();
   const bar=element('div');bar.className='dev-actions';host.append(bar);
   const entries=[...records.values()].filter(r=>!r.deleted);
   if(entries.length)bar.append(select(entries.map(r=>[r.id,r.draft.name]),id,key=>{if(!dirty||confirm('Leave this unsaved draft?'))choose(key);else draw();}));
   bar.append(button('New encounter',()=>newGraph(false)));
   const g=graph();if(!g){host.append(message);return;}
   bar.append(button('Duplicate',()=>newGraph(true)),button('Save draft',()=>send('save')));
   if(!tools.mobile)bar.append(button('Publish',()=>send('publish')),button('Delete',()=>send('delete')));
   const launch=async(start)=>{
    try{
     sessionStorage.setItem('chance-playtest-draft',JSON.stringify({uid,graph:g,revision:record().revision,dirty,selected}));
     await root.VoidEncounterGame.playtest(structuredClone(g),start);
    }
    catch(e){message.textContent=e.message;}
   };
   if(!tools.mobile)bar.append(button('▶ Play This Chance Encounter',()=>launch(g.start)),button('Play From Selected Node',()=>launch(selected||g.start)));
   if(!tools.mobile&&record().live){
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
   const trigger=g.conditions.startTrigger||{kind:'interval'};
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
   if(!tools.mobile)setup.append(button('Set From Current Player Position',()=>{
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
   const motions=element('datalist');motions.id='encounter-lace-motions';host.append(motions);
   const clipNames=new Set([...(tools.clips||[]),...(root.VoidCrowd?.clips?.['npc-lib-eb1d6cc8']||[]),
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
   if(g.dialogue?.length){
    const dialogue=element('details');dialogue.className='encounter-playlist-editor';dialogue.append(element('summary','Dialogue ('+g.dialogue.length+' slots)'));dialogue.open=dialogueOpen;dialogue.ontoggle=()=>{if(dialogue.isConnected)dialogueOpen=dialogue.open;};host.insertBefore(dialogue,props);
    const editable=g.id==='dropped-cardkey'||g.dialogue.some(line=>branchOf(line));
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
      const line={id:nextLineId(g,addBranch),speaker:'lace',text:'',tags:'',delay:addBranch==='wait'?12:0,animation:''};
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
     g.dialogue.push({id,speaker:'lace',text:'',animation:'',delay:0,tags:''});return id;
    }
    function removeActions(ids){
     const removed=new Set(ids);
     for(const id of removed){
      const line=g.dialogue.find(row=>row.id===id);
      for(const branch of line?.branches||[])for(const child of branch.actions)removed.add(child);
     }
     g.dialogue=g.dialogue.filter(row=>!removed.has(row.id));
    }
    const sections=api.dialogueSections(g),selectionControls=[];
    const byId=new Map(g.dialogue.map(line=>[line.id,line])),actionOptions=new Map();
    const actionLabel=(line,n)=>n+' · '+(line.text||line.animation||line.id).slice(0,70);
    function refresh(){
     for(const [button,eligible] of selectionControls)button.disabled=!eligible.some(line=>checked.has(line.id));
    }
    function keepOpen(details,key){
     details.open=!closed.has(key);
     details.ontoggle=()=>{if(details.isConnected){if(details.open)closed.delete(key);else closed.add(key);}};
    }
    const newKey=()=> 'main_'+crypto.randomUUID().replaceAll('-','');
    function setMembers(rows,key,passes,legacyRows=[]){
     for(const row of rows){
      row.mainPlaylist=key;row.mainPasses=passes;
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
      delete line.mainPlaylist;delete line.mainPasses;
      for(const branch of line.branches||[]){
       if(['start','action'].includes(branch.completion)){delete branch.returnAction;branch.completion='next';}
      }
     }
     for(const row of rest)for(const branch of row.branches||[]){
      if(ids.has(branch.returnAction)){delete branch.returnAction;branch.completion='next';}
     }
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
       const target=peers[index+step],control=button(label,()=>move(item,target));control.disabled=!target;toolbar.append(control);
      }
     }
     const choice=element('input');choice.type='checkbox';choice.checked=checked.has(line.id);
     choice.onchange=()=>{if(choice.checked)checked.add(line.id);else checked.delete(line.id);refresh();};
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
      const control=field(parameters,label,input(line[key],v=>{
       if(key==='speaker'){delete line.recording;audio.textContent='No recording';}
       line[key]=v;mark();updateLabels();
      },key==='delay'?'number':'text'));
      if(key==='animation')control.setAttribute('list',motions.id);
     }
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
       const bounds=element('details');bounds.append(element('summary','Advanced chance settings'));lane.append(bounds);
       const boundFields=element('div');boundFields.className='encounter-action-fields';bounds.append(boundFields);
       lane.className='encounter-chance-playlist';
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
        const section=Object.values(sections).find(rows=>rows.includes(anchor));
        let last=section.at(-1);
        for(const action of actions){
         const oldId=action.id;
         branch.actions.splice(branch.actions.indexOf(oldId),1);checked.delete(oldId);
         for(const bound of ['startAction','endAction'])if(branch[bound]===oldId)delete branch[bound];
         for(const flag of ['repeatSpeech','repeatAnimation','playlistStart','playlistEnd'])delete action[flag];
         g.dialogue.splice(g.dialogue.indexOf(action),1);
         action.id=nextLineId(g,conversation);
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
         for(const flag of ['playlistStart','playlistEnd'])delete action[flag];
         action.id=branchId();branch.actions.push(action.id);
        }
        redraw();
       });
       selectionControls.push([addSelected,candidates]);
       const addAction=button('Add branch action',()=>{branch.actions.push(newAction());redraw();});
       const branchTools=element('div');branchTools.className='encounter-action-tools';lane.append(branchTools);
       addAction.disabled=g.dialogue.length>=100;branchTools.append(moveSelected,addSelected,addAction,button('Delete chance playlist',()=>{
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
    }
    const names={opening:'Arrival',remaining:'Arrival after choices',free:'Free Lace',be_kade:'Be Kade',wait:'Waiting for choice'};
    for(const [key,group] of Object.entries(sections)){
     if(!group.length)continue;
     const section=element('section');section.className='encounter-conversation';section.dataset.conversation=branchOf(group[0]);
     section.append(element('h3',names[key]));dialogue.append(section);
     const toolsRow=element('div');toolsRow.className='encounter-action-tools';section.append(toolsRow);
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
     drawPreview(section,toolsRow,group);
     let number=0,playlistNumber=0;
     for(const segment of segments){
      let lane=section;
      if(segment.key){
       lane=element('details');lane.className='encounter-main-playlist';section.append(lane);
       lane.append(element('summary','Main playlist '+(++playlistNumber)+' · '+segment.rows.length+' actions'));
       keepOpen(lane,key+':'+segment.key);
       const controls=element('div');controls.className='encounter-action-fields';lane.append(controls);
       const membership=()=>segment.legacy?newKey():segment.key;
       field(controls,'Repeat',select([['0','Until canceled'],['count','Number of passes']],segment.passes?'count':'0',value=>{
        setMembers(segment.rows,membership(),value==='0'?0:1,segment.legacy?segment.rows:[]);redraw();
       }));
       if(segment.passes){
        const passes=field(controls,'Main playlist passes',input(segment.passes,value=>{
         for(const row of segment.rows)row.mainPasses=value;segment.passes=value;mark();
        },'number'));passes.min=1;passes.max=100;passes.step=1;
       }
       controls.append(selectedAction('Add selected to this playlist',rows=>{
        setMembers(group.filter(row=>segment.rows.includes(row)||rows.includes(row)),membership(),segment.passes,segment.legacy?segment.rows:[]);
       }));
       const remove=button('Remove selected from main playlist',()=>{
        detach(segment.rows.filter(row=>checked.has(row.id)),segment);redraw();
       });
       selectionControls.push([remove,segment.rows]);controls.append(remove);
       const add=button('Add playlist action',()=>{
        const last=segment.rows.at(-1),id=nextLineId(g,branchOf(last));
        const line={id,speaker:'lace',text:'',animation:'',delay:0,tags:''};
        g.dialogue.splice(g.dialogue.indexOf(last)+1,0,line);
        if(g.decisionAfter===last.id)g.decisionAfter=id;
        setMembers([...segment.rows,line],membership(),segment.passes,segment.legacy?segment.rows:[]);redraw();
        host.querySelector('[data-line-id="'+id+'"] textarea')?.focus();
       });
       add.disabled=g.dialogue.length>=100;controls.append(add);
      }
      for(const line of segment.rows)drawRow(line,lane,null,0,String(++number),segment,eligible);
     }
    }
    for(const line of ordered)if(!drawn.has(line.id))drawRow(line,dialogue,null);
    refresh();
    function drawPreview(section,toolsRow,group){
     const panel=element('div');panel.className='encounter-execution-preview';panel.hidden=true;
     const status=element('output'),trace=element('ol');status.setAttribute('aria-live','polite');
     let active,controller;
     const stop=button('Stop execution preview',()=>controller?.abort());
     const start=button('Preview execution',async()=>{
      preview?.abort();controller=new AbortController();preview=controller;
      const {signal}=controller;
      panel.hidden=false;trace.replaceChildren();start.disabled=true;stop.disabled=false;
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
       await api.runPlaylist(group,byId,{signal,pause,play:()=>pause(550),observe:event=>{
        if(!section.isConnected){controller.abort();signal.throwIfAborted();}
        if(event.type==='action'){
         active?.removeAttribute('aria-current');active=node(event.row);
         active?.setAttribute('aria-current','step');status.textContent='Playing '+describe(event.row);return;
        }
        const text=event.type==='roll'
         ? 'Rolled '+(event.roll*100).toFixed(2)+'% after '+describe(event.row)+' · '+(event.branch?'Branch taken ('+event.branch.chance+'%)':'Continue')
         : (event.mode==='reroll'?'Reroll after ':'Return to ')+describe(event.target);
        trace.prepend(element('li',text));if(trace.children.length>12)trace.lastElementChild.remove();
       }});
       status.textContent='Preview complete';
      }catch(error){status.textContent=signal.aborted?'Preview stopped':error.message;}
      finally{
       active?.removeAttribute('aria-current');active=null;
       if(preview===controller)preview=null;
       start.disabled=false;stop.disabled=true;
      }
     });
     toolsRow.append(start);panel.append(status,stop,trace);section.append(panel);
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
  if(tools.mobile){choose(id);return;}
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
