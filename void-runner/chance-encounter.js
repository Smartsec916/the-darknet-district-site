/* Runtime-independent graph operations shared with the private encounter playtest. */
(function(root){
 'use strict';
 const kinds=Object.freeze({
  trigger:'Event',move:'NPC movement',item:'Item',choice:'Dialogue and choices',
  animation:'Animation',location:'Location and access',end:'Cleanup'
 });

 function validate(encounter){
  const errors=[],nodes=encounter?.nodes;
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
  if(graph?.id!=='dropped-cardkey'||graph.waitingDialogueConfigured===true||!Array.isArray(graph.dialogue)||graph.dialogue.some(l=>l.id.startsWith('lace_wait_'))||graph.dialogue.length>=100)return graph;
  return {...graph,dialogue:[...graph.dialogue,{id:'lace_wait_01',speaker:'lace',text:'Still with me? Tell me what you want to do.',tags:'',delay:12,animation:''}]};
 }
 const api={kinds,validate,createRun,withWaitingDialogue};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.VoidChanceEncounter=api;
})(globalThis);
