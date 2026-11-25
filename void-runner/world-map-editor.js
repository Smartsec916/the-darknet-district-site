/* Developer-only view over the location editor's street geometry and shared apartment registry. */
(function(root){
 'use strict';
 const element=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 function field(title,control){control.setAttribute('aria-label',title);const label=element('label',title+' ');label.append(control);return label;}
 function missionPaths(m){
  const paths=[];
  function append(area,name,points){
   const finite=points.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
   if(finite.length)paths.push({area,label:name,points:finite});
  }
  const A=root.VoidNPCAreas,P=root.VoidPlaces;
  function area(place,x,z){
   const entry=P?.node(place)?.enter;
   return entry?.quarter||(entry?.walk==='darknet-district'?'district':null)||
    (A.list().some(a=>a.id===place)?place:A.areaOf({x,z}));
  }
  function markPlace(id,label){
   const point=id&&P?.target(id);
   if(Array.isArray(point))append(area(id,point[0],point[2]),label,[[point[0],point[2]]]);
  }
  function markNpc(id,label){
   if(!id||(m.cast||[]).some(c=>c.id===id))return;
   const home=root.VoidNPCPaths?.homeOf?.(id);
   if(home){append(area(null,home.x,home.z),label,[[home.x,home.z]]);return;}
   const giver=root.VoidLiveContent?.env?.givers?.find(g=>g.id===id);
   if(!giver)return;
   if(giver.place){markPlace(giver.place,label);return;}
   if(!giver.layout||!['darknet-district','sacramento'].includes(giver.enter?.walk))return;
   const inside=giver.enter.walk==='darknet-district';
   const scene=root.VoidNeoChinatown?.layout(inside?'interior':'street',giver.enter.quarter);
   const pos=scene?.interactions?.find(i=>i.id===giver.layout||i.action===giver.layout)?.position;
   if(pos)append(inside?'district':area(giver.enter.quarter,pos[0],pos[2]),label,[[pos[0],pos[2]]]);
  }
  for(const c of m.cast||[])append(area(c.place,c.x,c.z),c.name||c.id,c.route?.length?c.route:[[c.x,c.z]]);
  if(!m.waitAt)markNpc(m.giver,m.giver);
  if(m.waitAt)append(root.VoidNPCAreas.areaOf(m.waitAt)||m.location,m.giver,[[m.waitAt.x,m.waitAt.z]]);
  for(const o of m.objectives||[]){
   markPlace(o.place,o.label);if(o.npc)markNpc(o.npc,o.label);
   const p=o.to;if(p&&Number.isFinite(p.x))append(root.VoidNPCAreas.areaOf(p)||m.location,o.label,[[p.x,p.z]]);
  }
  return paths;
 }
 async function render(panel,tools){
  const A=root.VoidApartments,M=root.VoidMissionEditor;
  const housing=await tools.request('developer/properties');
  let catalog;
  try{catalog=await tools.request('developer/items');}catch{}
  const cards=new Map();
  for(const [source,items] of [['Published',catalog?.live?.content?.items],['Draft',catalog?.draft?.content?.items]]){
   for(const card of items||[])for(const target of card.keycard?.doors||[]){
    if(!cards.has(target))cards.set(target,new Set());
    cards.get(target).add(card.name+' ('+source+')');
   }
  }
  const players=new Map();
  function indexPlayers(){
   players.clear();
   for(const [unit,assignment] of Object.entries(housing.units||{})){
    const [,door,slot]=unit.split('/');
    if(!players.has(door))players.set(door,[]);
    players.get(door).push({slot:Number(slot),name:assignment.name});
   }
  }
  indexPlayers();
  const registry=await A.readAddressRegistry({
   shipped:root.VoidMainStory?.trees?.()||[],cached:root.VoidLiveContent?.env||{},
   readLive:()=>root.VoidNetwork.request('live-content'),
   readDraft:()=>tools.request('developer/drafts/mission-editor-workspace'),
   readLocal:()=>M.local()
  });
  if(!panel.isConnected)return;
  const search=element('input'),type=element('select'),entrance=element('select');
  search.type='search';type.add(new Option('All properties',''));
  for(const [id,category] of Object.entries(A.entranceLegend))type.add(new Option(category.label,id));
  const mission=element('select');mission.add(new Option('All missions',''));
  const tree=element('select');tree.add(new Option('All mission trees',''));
  const byTree=new Map();
  for(const t of registry.trees){
   if(!byTree.has(t.id))byTree.set(t.id,{name:t.name||t.title||t.id,missions:new Map()});
   for(const m of t.missions||[])byTree.get(t.id).missions.set(m.id,m);
  }
  for(const [id,t] of byTree)tree.add(new Option(t.name,id));
  const layers=element('fieldset');layers.append(element('legend','Map layers'));
  const layer={};for(const id of ['Geometry','Entrances','Mission routes']){
   const c=element('input');c.type='checkbox';c.checked=true;c.onchange=filter;layer[id]=c;layers.append(field(id,c));
  }
  function missions(){return [...byTree].filter(([id])=>!tree.value||tree.value===id).flatMap(([,t])=>[...t.missions.values()]);}
  function changeTree(){mission.replaceChildren(new Option('All missions',''));
   const choices=new Map(missions().map(m=>[m.id,m.title||m.id]));
   for(const [id,title] of [...choices].sort((a,b)=>a[1].localeCompare(b[1])))mission.add(new Option(title,id));
   filter();
  }
  const interiorDoors=A.interiorDoors(registry.trees);
  const places=element('select'),jumpPlace=element('button','Jump to location'),placeSearch=element('input');
  jumpPlace.type='button';placeSearch.type='search';
  const landmarks=[];
  for(const area of root.VoidNPCAreas.list()){
   const data=root.VoidNPCPaths.mapData(area.id);
   for(const spot of [...(data.labels||[]),...(data.shops||[])]){
    if(Number.isFinite(spot.x)&&Number.isFinite(spot.z))landmarks.push({...spot,area:area.id,district:area.name});
   }
  }
  function filterPlaces(){
   const q=placeSearch.value.trim().toLowerCase();
   places.replaceChildren(...landmarks.flatMap((spot,i)=>{
    const label=spot.district+' · '+spot.name;
    return label.toLowerCase().includes(q)?[new Option(label,String(i))]:[];
   }));
   jumpPlace.disabled=places.selectedIndex<0;
  }
  placeSearch.oninput=filterPlaces;filterPlaces();
  jumpPlace.onclick=async()=>{
   const spot=landmarks[Number(places.value)];if(!spot)return;
   await M.shared.ensure();M.shared.jumpTo(spot.x,spot.z,null,spot.name,null,{area:spot.area});
  };
  const map=element('div'),detail=element('section'),summary=element('p');
  detail.setAttribute('aria-live','polite');
  panel.replaceChildren(field('Search entrances',search),field('Property type',type),field('Mission tree',tree),field('Mission',mission),field('Entrance',entrance),layers,summary,map,detail,field('Search locations',placeSearch),field('Registered location',places),jumpPlace);
  const doors=A.doors(),records=new Map(doors.map(d=>[d.id,A.propertyRecord(d,registry.rows.get(d.id),players.get(d.id))]));
  function show(){
   detail.replaceChildren();
   const d=A.door(entrance.value),r=records.get(entrance.value);if(!d||!r)return;
   detail.append(element('h3',root.VoidModuleEditor.doorTitle(d)),element('p',A.entranceLegend[r.kind].label+' · '+d.quarter));
   for(const m of r.missions)detail.append(element('p',m.title+' · '+[...(registry.doorSources.get(d.id+'/'+m.id)||registry.missionSources.get(m.id)||[])].join(', ')));
   if(!catalog)detail.append(element('p','Keycard catalog unavailable.'));
   if(cards.has(d.id))detail.append(element('p','Entrance keycards · '+[...cards.get(d.id)].join(', ')));
   for(const inner of interiorDoors.values())if(inner.entrance===d.id){
    const names=[...(cards.get(inner.id)||[])].join(', ');
    detail.append(element('p',inner.location+' · '+inner.name+(names?' · Keycards: '+names:'')));
   }
   for(const u of r.units){
    const labels=[...u.residents.map(x=>x.name),...u.players.map(x=>x.name),...u.reservations.map(x=>x.title)];
    const line=element('details'),title=element('summary','Apartment '+u.number+' — '+(labels.join(', ')||(r.reserved?'Mission entrance':registry.complete?'Available':'Assignment unverified')));
    line.append(title);detail.append(line);
    if(cards.has(u.id))line.append(element('p','Unit keycards · '+[...cards.get(u.id)].join(', ')));
    const assigned=u.players.length>0;
    if(!assigned&&(labels.length||r.reserved||!registry.complete))continue;
    const recipient=element('input'),button=element('button',assigned?'Release player assignment':'Assign player');
    recipient.placeholder='Saved player account ID';if(!assigned)line.append(field('Player account',recipient));
    button.type='button';line.append(button);const feedback=element('p');feedback.setAttribute('role','status');line.append(feedback);
    button.onclick=async()=>{
     if(!assigned&&!recipient.value.trim()){feedback.textContent='Enter a player account ID.';return;}
     button.disabled=true;
     try{
      const next=await tools.request('developer/properties',{revision:housing.revision,unit:u.id,player:assigned?null:recipient.value.trim()});
      Object.assign(housing,next);root.dispatchEvent(new Event('vr-property-assigned'));indexPlayers();records.set(d.id,A.propertyRecord(d,registry.rows.get(d.id),players.get(d.id)));filter();
     }catch(e){feedback.textContent=e.message;button.disabled=false;}
    };
   }
   if(d.front&&root.VoidNPCAreas?.get(d.quarter)){
    const point=A.editorDoorPoint(d,d.front);
    const jump=element('button','Jump to entrance');jump.type='button';
    jump.onclick=async()=>{await M.shared.ensure();M.shared.jumpTo(point.x,point.z,null,d.name,null,{area:d.quarter});};detail.append(jump);
   }
  }
  const paths=new Map(missions().map(m=>[m,missionPaths(m)]));
  let view;
  function filter(){
   view?.dispose();
   const query=search.value.trim().toLowerCase(),selected=entrance.value;
   const selectedMissions=missions().filter(m=>!mission.value||m.id===mission.value),ids=new Set(selectedMissions.map(m=>m.id));
   const options=doors.filter(d=>{
    const r=records.get(d.id);
    return (!type.value||r.kind===type.value)&&(!(tree.value||mission.value)||r.missions.some(m=>ids.has(m.id)))&&
     (!query||[d.name,d.number,d.id,d.quarter,...r.residents.map(c=>c.name),...r.missions.map(m=>m.title)].join(' ').toLowerCase().includes(query));
   });
   entrance.replaceChildren(...options.map(d=>new Option(root.VoidModuleEditor.doorTitle(d),d.id)));
   if(options.some(d=>d.id===selected))entrance.value=selected;
   summary.textContent=options.length+' entrances'+(registry.complete?'':' · Some assignments could not be loaded.');
   const routes=layer['Mission routes'].checked?selectedMissions.flatMap(m=>paths.get(m)||[]):[];
   view=options.length||routes.length?root.VoidModuleEditor.doorMap(entrance,{key:'world-properties',allAreas:true,rows:registry.rows,players,
    entrances:layer.Entrances.checked,geometry:layer.Geometry.checked,routes}):null;
   map.replaceChildren(...(view?[view]:[]));show();
  }
  search.oninput=filter;type.onchange=mission.onchange=filter;entrance.onchange=show;tree.onchange=changeTree;changeTree();
 }
 root.VoidWorldMapEditor={render};
})(globalThis);
