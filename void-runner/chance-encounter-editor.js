(function(root){
 'use strict';
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
  const [catalog,seed]=await Promise.all([tools.request('developer/chance-encounters'),fetch('void-runner/chance-encounter-seed.json').then(r=>{if(!r.ok)throw Error('Could not load The Dropped Cardkey.');return r.json();})]);
  if(!current())return;
  const records=new Map(catalog.encounters.map(r=>[r.id,r]));
  if(!records.has(seed.id))records.set(seed.id,{id:seed.id,revision:0,draft:seed});
  let id=[...records.values()].find(r=>!r.deleted)?.id,selected,dirty=false,busy=false,status='';
  let working;
  const record=()=>records.get(id),graph=()=>working;
  const mark=()=>{dirty=true;message.textContent='Unsaved draft';};
  const message=element('p');message.setAttribute('role','status');
  function choose(key){id=key;working=structuredClone(record()?.draft);selected=graph()?.start;dirty=false;status='';draw();}
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
    const saved=await tools.request('developer/chance-encounters',{action,id,revision:r.revision,graph:g});
    if(!current())return;
    records.set(id,saved);dirty=false;
    if(action==='delete')id=[...records.values()].find(v=>!v.deleted)?.id;
    working=structuredClone(record()?.draft);if(action==='delete')selected=working?.start;
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
    field(placement,'Optional Kade animation',input(g.roleplayClip,v=>{g.roleplayClip=v;mark();}));
    const room=g.nodes.find(n=>n.kind==='location');
    if(room)placement.append(button('Preview in apartment',()=>launch(room.id)));
   }
   if(g.item){
    const prop=element('details');prop.append(element('summary','Dropped keycard'));host.append(prop);
    field(prop,'Items & Vendors item ID',input(g.item,v=>{g.item=v;mark();}));
    field(prop,'Pickup distance (metres)',input(g.pickupDistance,v=>{g.pickupDistance=v;mark();},'number'));
    for(const [key,label] of [['x','Street X'],['z','Street Z']])
     field(prop,label,input(g.dropPosition[key],v=>{g.dropPosition[key]=v;mark();},'number'));
    const drop=g.nodes.find(n=>n.kind==='item');if(drop)prop.append(button('Preview keycard drop',()=>launch(drop.id)));
   }
   if(g.dialogue?.length){
    const dialogue=element('details');dialogue.append(element('summary','Dialogue ('+g.dialogue.length+' slots)'));host.append(dialogue);
    for(const line of g.dialogue){
     const row=element('fieldset');row.append(element('legend',line.id.replaceAll('_',' ')));dialogue.append(row);
     for(const [key,label] of [['text','Spoken line'],['speaker','Speaker'],['delay','Delay (seconds)'],['animation','Animation']])
      field(row,label,input(line[key],v=>{line[key]=v;mark();},key==='delay'?'number':'text'));
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
    choose(returned);working=restore.graph;selected=restore.selected||working.start;dirty=true;draw();return;
   }
  }
  choose(records.has(returned)?returned:id);
 }
 root.VoidEncounterEditor={mount};
})(globalThis);
