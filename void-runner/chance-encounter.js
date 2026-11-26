/* Runtime-independent graph operations shared with the private encounter playtest. */
(function(root){
 'use strict';
 const kinds=Object.freeze({
  trigger:'Event',move:'NPC movement',item:'Item',choice:'Dialogue and choices',
  animation:'Animation',location:'Location and access',end:'Cleanup'
 });

 function dialogueSections(graph){
  const result={opening:[],remaining:[],wait:[],free:[],be_kade:[]};
  let after=graph.decisionAfter==='before';
  for(const row of graph.dialogue||[]){
   if(row.id.startsWith('lace_arrival_')){
    result[after?'remaining':'opening'].push(row);
    if(row.id===graph.decisionAfter)after=true;
   }else for(const key of ['wait','free','be_kade'])if(row.id.startsWith('lace_'+key+'_'))result[key].push(row);
  }
  return result;
 }
 const isRepeat=row=>!!((row.repeatSpeech&&row.text?.trim())||(row.repeatAnimation&&row.animation));
 function playlist(rows,repeatAll=false){
  const selected=rows.filter(isRepeat);
  if(!selected.length)return repeatAll?{before:[],cycle:rows,after:[]}:{before:rows,cycle:[],after:[]};
  const first=rows.indexOf(selected.find(row=>row.playlistStart)||selected[0]);
  const last=rows.indexOf(selected.find(row=>row.playlistEnd)||selected.at(-1));
  return {before:rows.slice(0,first),cycle:rows.slice(first,last+1),after:rows.slice(last+1)};
 }
 function chooseBranch(row,roll=Math.random()){
  let limit=0;
  for(const branch of row.branches||[]){
   limit+=branch.chance;
   if(roll*100<limit)return branch;
  }
  return null;
 }
 function dialogueProblems(graph){
  const errors=[],rows=graph.dialogue??[],seen=new Set();
  if(!Array.isArray(rows)||rows.length>100||rows.some(row=>typeof row?.id!=='string'||typeof row.text!=='string'))return ['Use up to 100 valid dialogue actions.'];
  const ids=new Set(rows.map(row=>row.id));
  if(ids.size!==rows.length)errors.push('Each dialogue action needs a distinct ID.');
  const byId=new Map(rows.map(row=>[row.id,row]));
  function checkBounds(group){
   const first=group.filter(row=>row.playlistStart),last=group.filter(row=>row.playlistEnd);
   if(first.length>1||last.length>1||first.length&&last.length&&group.indexOf(first[0])>group.indexOf(last[0]))
    errors.push('Choose a first repeated action that precedes the last one in each playlist.');
  }
  for(const group of Object.values(dialogueSections(graph)))checkBounds(group);
  for(const row of rows){
   if((row.playlistStart||row.playlistEnd)&&!isRepeat(row))errors.push('Select speech or animation to repeat on '+row.id+'.');
   if(!row.branches)continue;
   if(!Array.isArray(row.branches)||!/^(lace_(arrival|free|be_kade|wait)|branch)_/.test(row.id)){
    errors.push('Branches must start from conversation actions.');continue;
   }
   let total=0;
   for(const branch of row.branches){
    if(!Number.isFinite(branch?.chance)||branch.chance<0||branch.chance>100||!Array.isArray(branch.actions)||!branch.actions.length){
     errors.push('Give each branch at '+row.id+' a percentage and at least one action.');continue;
    }
    if(branch.passes!==undefined&&(!Number.isInteger(branch.passes)||branch.passes<0||branch.passes>100))errors.push('Use 0 to 100 passes for a branch playlist.');
    checkBounds(branch.actions.map(id=>byId.get(id)).filter(Boolean));
    total+=branch.chance;
    for(const id of branch.actions){
     if(typeof id!=='string'||!id.startsWith('branch_')||!ids.has(id)||seen.has(id))errors.push('Invalid or shared branch action on '+row.id+'.');
     seen.add(id);
    }
   }
   if(total>100+1e-9)errors.push('Branch chances on '+row.id+' must total 100% or less.');
  }
  const reachable=new Set();
  function visit(row){
   if(!row||reachable.has(row.id))return;
   reachable.add(row.id);
   if(Array.isArray(row.branches))for(const branch of row.branches)if(Array.isArray(branch?.actions))for(const id of branch.actions)visit(byId.get(id));
  }
  rows.filter(row=>!row.id.startsWith('branch_')).forEach(visit);
  if(rows.some(row=>!reachable.has(row.id)))errors.push('A branch playlist has no reachable parent.');
  return errors;
 }
 function validate(encounter){
  const errors=dialogueProblems(encounter||{}),nodes=encounter?.nodes;
  if(!Array.isArray(nodes)||!nodes.length||nodes.length>128)return ['An encounter needs 1 to 128 nodes.'];
  const byId=new Map();
  for(const node of nodes){
   if(!node||!Object.hasOwn(kinds,node.kind)||typeof node.id!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(node.id)){
    errors.push('Each node needs a valid type and ID.');continue;
   }
   if(byId.has(node.id))errors.push('Repeated node '+node.id+'.');
   byId.set(node.id,node);
  }
  if(!byId.has(encounter.start))errors.push('Choose a starting node.');
  for(const node of byId.values()){
   const edges=node.edges;
   if(!Array.isArray(edges)){errors.push('Select the outgoing connections for '+node.id+'.');continue;}
   if(node.kind==='end'&&edges.length||node.kind!=='end'&&!edges.length||node.kind!=='choice'&&edges.length>1)
    errors.push('Check the number of connections on '+node.id+'.');
   const labels=new Set();
   for(const edge of edges){
    if(!byId.has(edge?.to))errors.push(node.id+' points to a missing node.');
    if(node.kind==='choice'){
     const label=edge?.label?.trim();
     if(!label||labels.has(label))errors.push('Give each choice on '+node.id+' a distinct label.');
     labels.add(label);
    }
   }
  }
  if(errors.length)return errors;
  const reached=new Set(),visiting=new Set();
  function visit(id){
   if(visiting.has(id)){errors.push('The connection to '+id+' forms a cycle.');return;}
   if(reached.has(id))return;
   reached.add(id);visiting.add(id);
   for(const edge of byId.get(id).edges)visit(edge.to);
   visiting.delete(id);
  }
  visit(encounter.start);
  for(const id of byId.keys())if(!reached.has(id))errors.push(id+' cannot be reached from the start.');
  return errors;
 }

 function createRun(encounter,start=encounter.start){
  const errors=validate(encounter);
  if(errors.length)throw Error(errors.join(' '));
  const nodes=new Map(encounter.nodes.map(node=>[node.id,node]));
  if(!nodes.has(start))throw Error('Choose an existing playtest node.');
  let current=nodes.get(start),stopped=false;
  return {
   get node(){return stopped?null:current;},
   step(choice){
    if(stopped||!current)return null;
    if(current.kind==='end'){current=null;return null;}
    const edge=current.kind==='choice'?current.edges.find(e=>e.label===choice):current.edges[0];
    if(!edge)throw Error('Select one of the available choices.');
    current=nodes.get(edge.to);return current;
   },
   stop(){stopped=true;}
  };
 }
 // Older published encounters predate the editable waiting line. A blank saved line means silence.
 function withWaitingDialogue(graph){
  if(graph?.id==='dropped-cardkey'&&graph.name==='The Dropped Cardkey')graph={...graph,name:'Pleasure Breach'};
  if(graph?.id!=='dropped-cardkey'||graph.waitingDialogueConfigured===true||!Array.isArray(graph.dialogue)||graph.dialogue.some(l=>l.id.startsWith('lace_wait_'))||graph.dialogue.length>=100)return graph;
  return {...graph,dialogue:[...graph.dialogue,{id:'lace_wait_01',speaker:'lace',text:'Still with me? Tell me what you want to do.',tags:'',delay:12,animation:''}]};
 }
 const api={kinds,validate,createRun,withWaitingDialogue,dialogueSections,playlist,isRepeat,chooseBranch};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.VoidChanceEncounter=api;
})(globalThis);
