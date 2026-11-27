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
 const startTriggers={interval:'Nearby percentage roll',near:'Walking near an NPC',place:'Entering a place',leave:'Leaving a place','pod-exit':'Exiting a Sleeping Pod',
  'after-mission':'After a mission is completed','game-time':'After in-game time following a mission',flag:'A story flag is set'};
 const isVisitTrigger=kind=>['near','place','leave','pod-exit'].includes(kind);
 const isRepeat=row=>!!((row.repeatSpeech&&row.text?.trim())||(row.repeatAnimation&&row.animation));
 function playlist(rows,repeatAll=false){
  const selected=rows.filter(isRepeat);
  if(!selected.length)return repeatAll?{before:[],cycle:rows,after:[]}:{before:rows,cycle:[],after:[]};
  const first=rows.indexOf(selected.find(row=>row.playlistStart)||selected[0]);
  const last=rows.indexOf(selected.find(row=>row.playlistEnd)||selected.at(-1));
  return {before:rows.slice(0,first),cycle:rows.slice(first,last+1),after:rows.slice(last+1)};
 }
 const completionOptions=[
  ['reroll','Roll chance again'],
  ['replay','Replay the preceding action and roll again'],
  ['next','Continue to the next action'],
  ['start','Return to the beginning of the main playlist'],
  ['action','Return to a selected main action']
 ];
 function playlistSegments(rows){
  const legacy=playlist(rows.filter(row=>!row.mainPlaylist)).cycle;
  const groups=new Map(),segments=[];
  for(const row of rows){
   const key=row.mainPlaylist||(legacy.includes(row)?'legacy':'');
   if(!key){segments.push({rows:[row],passes:1});continue;}
   if(!groups.has(key)){
    const segment={key,rows:[],passes:key==='legacy'?0:row.mainPasses,chance:row.mainContinueChance,legacy:key==='legacy'};
    segments.push(segment);groups.set(key,segment);
   }
   groups.get(key).rows.push(row);
  }
  return segments;
 }

 async function runPlaylist(rows,byId,{signal,play,pause,random=Math.random,observe=()=>{},repeat=(parent,_,run)=>run(parent)}){
  const restart=Symbol('legacy main restart');
  const segments=playlistSegments(rows);
  let legacyActive=segments.some(segment=>segment.legacy);
  async function actions(items,signal,main,legacyReturn,marked=null){
   const next=index=>{
    while(index<items.length&&marked&&!marked.has(items[index]))index++;
    return index;
   };
   for(let index=next(0);index<items.length;){
    signal.throwIfAborted();
    const row=items[index];
    observe({type:'action',row});
    await play(row,signal,marked?.has(row)===true);
    let target=next(index+1);
    for(;;){
     signal.throwIfAborted();
     if(!row.branches?.length)break;
     const roll=random(),branch=chooseBranch(row,roll);
     observe({type:'roll',row,roll,branch});
     if(!branch)break;
     const child=branchPlaylist(branch,byId);
     const complete=await sequence(child,branch.passes??1,signal,true,false,legacyReturn);
     if(!complete)break;
     const mode=branch.completion;
     if(mode===undefined&&legacyReturn)throw restart;
     if(mode==='reroll'){
      observe({type:'return',row,mode,target:row});
      await pause(250,signal);
      continue;
     }
     if(mode==='replay')target=index;
     if(mode==='start'&&main)target=0;
     if(mode==='action'&&main){
      const found=items.findIndex(item=>item.id===branch.returnAction);
      if(found>=0)target=found;
     }
     observe({type:'return',row,mode:mode||'next',target:items[target]});
     if(target<=index)await pause(250,signal);
     break;
    }
    index=target;
   }
  }
  async function sequence({before,cycle,after},passes,signal,child,legacy=false,legacyReturn=legacy,chance){
   await actions(before,signal,!child,legacyReturn);
   if(cycle.length){
    const result=await repeat(signal,{child,show:passes!==1||!child},async local=>{
     const marked=new Set(cycle.filter(isRepeat));
     for(let pass=0;passes===0||pass<passes;pass++){
      local.throwIfAborted();
      const partial=(legacy||child)&&pass>0&&marked.size>0;
      try{await actions(cycle,local,!child,legacyReturn,partial?marked:null);}
      catch(error){
       if(child||!legacy||error!==restart)throw error;
       observe({type:'return',mode:'start',target:cycle[0]});
      }
      if(chance!==undefined){
       local.throwIfAborted();
       const roll=random(),continued=chance===100||roll*100<chance;
       observe({type:'continue-roll',roll,chance,continued,row:cycle[cycle.length-1]});
       if(continued)break;
      }
      if(passes===0||pass+1<passes)await pause(250,local);
     }
    });
    if(result===false&&child)return false;
   }
   await actions(after,signal,!child,legacyReturn);
   return true;
  }
  let jumpToLegacy=false;
  for(const segment of segments){
   if(jumpToLegacy&&!segment.legacy)continue;
   jumpToLegacy=false;
   if(segment.key){
    await sequence({before:[],cycle:segment.rows,after:[]},segment.passes,signal,false,segment.legacy,segment.legacy,segment.chance);
    if(segment.legacy)legacyActive=false;
   }else{
    try{await actions(segment.rows,signal,false,legacyActive);}
    catch(error){if(error!==restart)throw error;jumpToLegacy=true;
     observe({type:'return',mode:'start',target:segments.find(part=>part.legacy)?.rows[0]});
    }
   }
  }
 }

 function branchPlaylist(branch,byId){
  const rows=branch.actions.map(id=>byId.get(id));
  if(branch.startAction===undefined&&branch.endAction===undefined)return playlist(rows,(branch.passes??1)!==1);
  const first=branch.startAction===undefined?0:branch.actions.indexOf(branch.startAction);
  const last=branch.endAction===undefined?rows.length-1:branch.actions.indexOf(branch.endAction);
  return {before:[],cycle:rows.slice(first,last+1),after:[]};
 }
 function chooseBranch(row,roll=Math.random()){
  let limit=0;
  const percent=Math.min(roll,1-Number.EPSILON)*100;
  for(const branch of row.branches||[]){
   limit+=branch.chance;
   if(percent<limit)return branch;
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
  const sections=Object.values(dialogueSections(graph));
  const mainGroups=new Map(),mainByRow=new Map();
  for(const group of sections){
   checkBounds(group);
   for(const segment of playlistSegments(group)){
    if(!segment.key)continue;
    for(const row of segment.rows)mainByRow.set(row.id,segment.rows);
    if(segment.legacy)continue;
    if(mainGroups.has(segment.key)||segment.rows.some(row=>row.mainPasses!==segment.passes||row.mainContinueChance!==segment.chance))
     errors.push('Keep playlist members in one conversation section with matching passes.');
    mainGroups.set(segment.key,segment);
   }
  }
  for(const row of rows){
   if((row.mainPlaylist!==undefined||row.mainPasses!==undefined)&&(!mainByRow.has(row.id)||typeof row.mainPlaylist!=='string'||!/^main_[a-z0-9]{1,59}$/.test(row.mainPlaylist)||!Number.isInteger(row.mainPasses)||row.mainPasses<0||row.mainPasses>100))
    errors.push('Choose a valid main playlist and 0 to 100 passes for '+row.id+'.');
   if(row.mainContinueChance!==undefined&&(!row.mainPlaylist||row.mainPasses!==0||!Number.isFinite(row.mainContinueChance)||row.mainContinueChance<0||row.mainContinueChance>100))
    errors.push('Choose a continuation chance from 0% to 100% for '+row.id+'.');
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
    if(branch.completion!==undefined&&!completionOptions.some(([mode])=>mode===branch.completion))
     errors.push('Choose a completion behavior on '+row.id+'.');
    if(branch.completion==='start'&&!mainByRow.has(row.id))errors.push('Choose a main playlist for the branch return on '+row.id+'.');
    if(branch.completion==='action'&&!mainByRow.get(row.id)?.some(target=>target.id===branch.returnAction))
     errors.push('Choose a return action in the same main playlist on '+row.id+'.');
    const first=branch.actions.indexOf(branch.startAction===undefined?branch.actions[0]:branch.startAction);
    const last=branch.actions.indexOf(branch.endAction===undefined?branch.actions.at(-1):branch.endAction);
    if(first<0||last<first)errors.push('Choose starting and ending actions in order within the chance playlist on '+row.id+'.');
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
 const validAnimationSpeed=speed=>Number.isFinite(speed)&&speed>0;
 function animationSpeedProblems(graph){
  const rows=Array.isArray(graph?.dialogue)?graph.dialogue:[];
  const saved=Array.isArray(graph?.savedActions)?graph.savedActions.flat():[];
  return [...rows,...saved].filter(row=>row?.animationSpeed!==undefined&&!validAnimationSpeed(row.animationSpeed))
   .map(row=>'Enter a playback speed greater than 0 for '+row.id+'.');
 }
 function validate(encounter){
  const errors=[...dialogueProblems(encounter||{}),...animationSpeedProblems(encounter)],nodes=encounter?.nodes;
  const limit=encounter?.conditions?.dailyLimit;
  if(limit!==undefined&&limit!==0.5&&(!Number.isInteger(limit)||limit<0||limit>1000))
   errors.push('Use 0.5 for every other game day or a whole number from 0 to 1000.');
  const trigger=encounter?.conditions?.startTrigger;
  if(trigger!==undefined){
   if(!trigger||!Object.hasOwn(startTriggers,trigger.kind))errors.push('Choose a supported encounter start trigger.');
   else if(!['interval','pod-exit'].includes(trigger.kind)&&(typeof trigger.target!=='string'||!trigger.target.trim()||trigger.target.length>100))errors.push('Choose the place, mission or flag for the start trigger.');
   if(trigger?.kind==='near'&&(!Number.isFinite(trigger.distance)||trigger.distance<1||trigger.distance>30))errors.push('Choose a distance from 1 to 30 metres.');
   if(trigger?.kind==='game-time'&&(!Number.isInteger(trigger.minutes)||trigger.minutes<1||trigger.minutes>10080))errors.push('Choose 1 to 10080 in-game minutes after mission completion.');
  }
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
 const api={kinds,startTriggers,isVisitTrigger,validate,validAnimationSpeed,animationSpeedProblems,createRun,withWaitingDialogue,dialogueSections,playlist,playlistSegments,runPlaylist,completionOptions,branchPlaylist,isRepeat,chooseBranch};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.VoidChanceEncounter=api;
})(globalThis);
