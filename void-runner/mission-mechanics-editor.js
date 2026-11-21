/* MISSION EDITOR: THE REUSABLE MECHANICS (20 Nov 2026; loaded with the editor scripts, before mission-editor.js). The fields of the new step kinds (mission-mechanics.js)
   in the Form view, and two panels under every tree mission: PEOPLE FOR THIS MISSION (mission.cast: who stands where, doing what, from which step to which, an optional
   walking route) and EVIDENCE (mission.evidence: the documents and recordings its steps hand out, with the owner's own text). Plain words, undo through the editor's
   own edit function (ed / eo), nothing saved outside the draft. */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const MM=()=>root.VoidMissionMechanics;
 const el=(tag,text,cls,attrs)=>{const n=document.createElement(tag);if(text!=null&&text!=='')n.textContent=text;if(cls)n.className=cls;for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,v);return n;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls||'',{type:'button',...(attrs||{})});b.onclick=fn;return b;};
 const num=(label,value,min,max,stepv,on,attrs,ph)=>{const i=el('input','','',{type:'number',min:String(min),max:String(max),step:String(stepv),size:'4','aria-label':label,...(ph?{placeholder:ph}:{}),...(attrs||{})});i.value=value==null?'':String(value);i.oninput=()=>{const n=parseFloat(i.value);on(Number.isFinite(n)?Math.max(min,Math.min(max,n)):null);};return i;};
 const numFt=(label,m,lo,hi,on,attrs,ph)=>{const U=root.VoidUnits,r=U.ftRange(lo,hi);return num(label,m==null?null:U.ft(m),r[0],r[1],1,v=>on(v==null?null:U.m(v,m,{min:lo,max:hi})),attrs,ph);};   // a distance shown in feet, stored in metres (units.js)
 const sel=(label,options,value,on,attrs)=>{const s=el('select','','',{'aria-label':label,...(attrs||{})});for(const [v,n] of options)s.append(new Option(n,v));s.value=value==null?'':String(value);s.onchange=()=>on(s.value);return s;};
 const small=t=>el('span',t,'me-small');
 const placeName=id=>{try{return (root.VoidPlaces?.node?.(id)||{}).name||id;}catch{return id;}};
 const placeIds=()=>{try{return [...root.VoidMissionGivers.placeIds()];}catch{return [];}};
 const KINDS=['observe','overhear','sneak','collect','report','feed','call','wait-game','tail','apt-leave','flight','v1-app'];
 const NO_VIA=['observe','overhear','tail','wait-game','feed','sneak','apt-leave','collect'],NO_LINES=['wait-game','tail','observe','sneak','apt-leave','feed'];
 /* Who: someone placed for this mission (cast), else any person the editor's own picker offers (npcSelect). */
 function whoSelect(m,o,eo,npcSelect,label){const cast=(m.cast||[]).map(c=>[c.id,(c.name||c.id)+' (placed for this mission)']);const s=sel(label,[['','— choose —'],...cast],cast.some(c=>c[0]===o.npc)?o.npc:'',v=>eo(x=>{if(v)x.npc=v;},true),{'data-me-step-npc':o.id});
  const out=[s];if(npcSelect&&!cast.some(c=>c[0]===o.npc))out.push(small('or'),npcSelect(o.npc,v=>eo(x=>{x.npc=v;},true),{label,attrs:{'data-me-step-npc2':o.id}}));return out;}
 function distances(o,eo,{near=true,close=true,hold=false,lost=false}={}){const D=(MM()&&MM().DEF[o.kind])||{},out=[];
  if(near)out.push(small(lost?'lost beyond':'within'),numFt(lost?'Lost beyond (feet)':'Within (feet)',o.near!=null?o.near:D.near,lost?5:1,lost?60:50,v=>eo(x=>{if(v==null)delete x.near;else x.near=v;}),{'data-me-step-near':o.id}),small('ft'));
  if(close)out.push(small('· too close under'),numFt('Too close (feet)',o.close!=null?o.close:D.close,0.5,10,v=>eo(x=>{if(v==null)delete x.close;else x.close=v;}),{'data-me-step-close':o.id},'—'),small('ft'));
  if(hold)out.push(small('· for'),num('Seconds',o.hold!=null?o.hold:D.hold,1,600,1,v=>eo(x=>{if(v==null)delete x.hold;else x.hold=Math.round(v);}),{'data-me-step-hold':o.id}),small('s'));return out;}
 /* The fields of one step of a new kind (and the "without being seen" box on the steps that take it). k: {npcSelect, placeRow, placeSelect}. */
 function stepFields(m,o,eo,k={}){const out=[],K=o.kind,ev=(m.evidence||[]).map(e=>[e.id,e.title]);
  if(K==='observe'){out.push(...whoSelect(m,o,eo,k.npcSelect,'Who the player watches'),...distances(o,eo,{hold:true}));}
  else if(K==='overhear'){out.push(...whoSelect(m,o,eo,k.npcSelect,'Who is overheard'),...distances(o,eo),small('· the conversation: the lines below'));}
  else if(K==='tail'){const withRoute=(m.cast||[]).filter(c=>Array.isArray(c.route));out.push(sel('Who is followed',[['','— someone placed with a route —'],...withRoute.map(c=>[c.id,c.name||c.id])],o.npc||'',v=>eo(x=>{x.npc=v;},true),{'data-me-step-npc':o.id}),...distances(o,eo,{lost:true}));}
  else if(K==='sneak'||K==='apt-leave'||K==='collect'){if(k.placeRow){const fake={...o,kind:K==='collect'&&o.object?'apt-use':K==='collect'?'apt-enter':K==='sneak'&&o.object?'apt-use':'apt-enter'};out.push(...k.placeRow(m,fake,(fn,r)=>eo(x=>{const y={...x,kind:fake.kind};fn(y);for(const f of ['apt','mod','object'])if(y[f]==null)delete x[f];else x[f]=y[f];},r)));}
   if(K==='sneak'||K==='collect')out.push(btn(o.object?'NO THING (A ROOM)':'A THING TO USE',()=>eo(x=>{if(x.object)delete x.object;else x.object='computer';},true),'',{'data-me-step-object-toggle':o.id}));
   if(K==='collect')out.push(small('copies'),sel('Evidence',[['','— choose the evidence —'],...ev],o.evidence||'',v=>eo(x=>{x.evidence=v;},true),{'data-me-step-evidence':o.id}));}
  else if(K==='report'){if(k.npcSelect)out.push(small('to'),k.npcSelect(o.npc,v=>eo(x=>{x.npc=v;},true),{label:'Who the report goes to',attrs:{'data-me-step-npc':o.id}}));
   const all=[];for(const t of (root.VoidMissionEditor?.trees?.()||[]))for(const mm of t.missions||[])for(const e of mm.evidence||[])all.push([e.id,e.title]);const pick=el('div','','me-row',{'data-me-step-evidence':o.id});pick.append(small('needs:'));
   for(const [id,title] of (all.length?all:ev)){const l=el('label','','me-small'),c=el('input','','',{type:'checkbox'});c.checked=(o.evidence||[]).includes(id);c.onchange=()=>eo(x=>{const s=new Set(x.evidence||[]);if(c.checked)s.add(id);else s.delete(id);if(s.size)x.evidence=[...s];else delete x.evidence;});l.append(c,document.createTextNode(' '+title));pick.append(l);}
   out.push(pick,small('handed over in'),sel('Only inside this place',[['','— anywhere (sent from the V1) —'],...placeIds().map(id=>[id,placeName(id)])],o.place||'',v=>eo(x=>{if(v)x.place=v;else delete x.place;},true),{'data-me-step-place':o.id}));}
  else if(K==='feed'){out.push(sel('Camera feed',[['','— a camera feed of this mission —'],...((m.feeds||[]).map(f=>[f.id,'Camera feed “'+f.id+'”']))],o.feed||'',v=>eo(x=>{x.feed=v;},true),{'data-me-step-feed':o.id}),
   sel('Stage',[['open','opened'],['watched','watched to the end'],['recorded','recorded'],['saved','saved in the V1 Gallery']],o.stage||'open',v=>eo(x=>{x.stage=v;},true),{'data-me-step-stage':o.id}));}
  else if(K==='v1-app')out.push(small('opens'),sel('V1 app',(MM()?MM().V1_APPS:[]).map(a=>[a,a.toUpperCase()]),o.app||'loadout',v=>eo(x=>{x.app=v;},true),{'data-me-step-v1app':o.id}),small('(the same app glows in mission yellow)'));
  else if(K==='call')out.push(small('done by itself after the step before (and its delay); the lines below arrive as a call from one NPC'));
  else if(K==='wait-game')out.push(small('wait'),num('In-game minutes',o.minutes||60,1,10080,1,v=>eo(x=>{x.minutes=Math.round(v||60);}),{'data-me-step-minutes':o.id}),small('in-game minutes (about '+Math.max(1,Math.round((o.minutes||60)/12))+' min of play)'));
  else if(K==='flight'){out.push(sel('Stage',[['board','board the ship'],['launch','take off'],['jump','make the jump'],['dock','dock']],o.stage||'board',v=>eo(x=>{x.stage=v;},true),{'data-me-step-stage':o.id}));
   if(o.stage==='jump'||o.stage==='dock')out.push(small('toward'),sel('Where',[['','— anywhere —'],...['meridian','vesper','kepler','rusthaven','foundry','sol-belt','mars'].map(id=>[id,placeName(id)])],o.place||'',v=>eo(x=>{if(v)x.place=v;else delete x.place;},true),{'data-me-step-place':o.id}));}
  if(MM()&&MM().UNSEEN_KINDS.includes(K))out.push(unseenBox(o,eo));
  return out;}
 function unseenBox(o,eo){const l=el('label','','me-small',{'data-me-step-unseen':o.id}),c=el('input','','',{type:'checkbox'});c.checked=o.unseen===true||o.kind==='sneak';if(o.kind==='sneak')c.disabled=true;c.onchange=()=>eo(x=>{if(c.checked)x.unseen=true;else{delete x.unseen;delete x.onSpotted;}});l.append(c,document.createTextNode(' without being seen (the armed people of the place spot the player: back to the street, try again)'));
  // (21 Nov 2026) or: a shout, a few seconds to get out of sight, then they open fire (mission-mechanics.js onSpotted:'alarm')
  if(!(o.unseen===true||o.kind==='sneak'))return l;const w=el('span'),la=el('label','','me-small',{'data-me-step-alarm':o.id}),ca=el('input','','',{type:'checkbox'});ca.checked=o.onSpotted==='alarm';ca.onchange=()=>eo(x=>{if(ca.checked)x.onSpotted='alarm';else delete x.onSpotted;});
  la.append(ca,document.createTextNode(' seen: a guard shouts, a few seconds to get out of sight, then they open fire (instead of back to the street)'));w.append(l,' ',la);return w;}
 /* PEOPLE FOR THIS MISSION and EVIDENCE (under the mission). */
 function panel(t,m,ed){const box=el('section','','me-end',{'data-me-mech-panel':m.id}),M=MM();box.append(el('h4','People for this mission'));
  box.append(el('p','People placed only for the player doing this mission: they stand in the place you choose (its middle, or at x / z in metres), doing what you choose, from one step until another. The V1 camera identifies them; watch, overhear and follow steps use them. A “marker” is an invisible point the camera identifies (a doorway to photograph).','me-small'));
  const steps=[['','— the start —'],...(m.objectives||[]).map(o=>[o.id,o.id+': '+String(o.label||'').slice(0,40)])],steps2=[['','— the end —'],...steps.slice(1)];
  (m.cast||[]).forEach((c,i)=>{const r=el('div','','me-row',{'data-me-cast':c.id}),eC=(fn,redraw)=>ed(x=>{const cc=(x.cast||[])[i];if(cc)fn(cc,x);},redraw);
   const name=el('input','','',{'aria-label':'Name','maxlength':'40',size:'14'});name.value=c.name||'';name.oninput=()=>eC(cc=>{if(name.value.trim())cc.name=name.value.slice(0,40);else delete cc.name;});
   const models=[['marker','marker (invisible point)'],...((root.VoidMadeNPCs?.models?.()||[]).map(x=>[x.asset,x.label||x.asset]))];if(!models.some(x=>x[0]===c.model))models.push([c.model,c.model]);
   r.append(el('b',c.id),name,sel('Figure',models,c.model,v=>eC(cc=>{cc.model=v;},true)),small('in'),sel('Place',[...placeIds().map(id=>[id,placeName(id)]),...(placeIds().includes(c.place)?[]:[[c.place,c.place+' (not in this build yet)']])],c.place,v=>eC(cc=>{cc.place=v;},true)),
    small('x'),num('x (metres)',c.x,-2000,2000,.1,v=>eC(cc=>{if(v==null){delete cc.x;delete cc.z;}else{cc.x=v;if(cc.z==null)cc.z=0;}}),{},'mid'),small('z'),num('z (metres)',c.z,-2000,2000,.1,v=>eC(cc=>{if(v==null){delete cc.x;delete cc.z;}else{cc.z=v;if(cc.x==null)cc.x=0;}}),{},'mid'),
    sel('Doing',(M?M.CLIPS:['idle']).filter(x=>!(M.FLOOR_CLIPS||[]).includes(x)||x===c.clip||!c.model||c.model==='marker'||((root.VoidCrowd&&root.VoidCrowd.clips[c.model])||[]).includes(x)).map(x=>[x,(M.CLIP_NAMES||{})[x]||x]),c.clip||'idle',v=>eC(cc=>{cc.clip=v;})),small('from'),sel('From step',steps,c.from||'',v=>eC(cc=>{if(v)cc.from=v;else delete cc.from;})),small('until'),sel('Until step',steps2,c.until||'',v=>eC(cc=>{if(v)cc.until=v;else delete cc.until;})));
   const route=el('input','','',{'aria-label':'Walking route: x,z; x,z','size':'26',placeholder:'route: x,z; x,z (follow at a distance)'});route.value=(c.route||[]).map(p=>p.join(',')).join('; ');
   route.onchange=()=>eC(cc=>{const pts=route.value.split(';').map(s=>s.split(',').map(Number)).filter(p=>p.length===2&&p.every(Number.isFinite));if(pts.length>=2)cc.route=pts.slice(0,12);else delete cc.route;},true);
   r.append(route,btn('×',()=>ed(x=>{x.cast.splice(i,1);if(!x.cast.length)delete x.cast;},true),'me-x',{'aria-label':'Remove this person'}));box.append(r);});
  box.append(btn('+ PERSON',()=>ed(x=>{const ids=new Set((x.cast||[]).map(c=>c.id));let n=1;while(ids.has('person-'+n))n++;(x.cast=x.cast||[]).push({id:'person-'+n,name:'Person '+n,model:'npc-casual-m',place:placeIds()[0]||'avenue'});},true),'',{'data-me-cast-add':m.id}));
  box.append(el('h4','Evidence'),el('p','Documents and recordings the steps hand out (a “Copy evidence” step, or the unlock “Evidence item”). The player reads them in the V1 Mission Log. Your text, exactly as written.','me-small'));
  (m.evidence||[]).forEach((e,i)=>{const r=el('div','','me-field',{'data-me-evidence':e.id}),eE=fn=>ed(x=>{const ee=(x.evidence||[])[i];if(ee)fn(ee);});const ti=el('input','','',{'aria-label':'Title',maxlength:'60'});ti.value=e.title||'';ti.oninput=()=>eE(ee=>{ee.title=ti.value.slice(0,60);});
   const tx=el('textarea','','',{'aria-label':'Text',rows:'4',maxlength:'1500'});tx.value=e.text||'';tx.oninput=()=>eE(ee=>{ee.text=tx.value.slice(0,1500);});
   r.append(el('b',e.id),ti,sel('Kind',(M?M.EV_KINDS:['document']).map(x=>[x,x]),e.kind||'document',v=>eE(ee=>{ee.kind=v;})),tx,btn('×',()=>ed(x=>{x.evidence.splice(i,1);if(!x.evidence.length)delete x.evidence;},true),'me-x',{'aria-label':'Remove this evidence'}));box.append(r);});
  box.append(btn('+ EVIDENCE',()=>ed(x=>{const ids=new Set((x.evidence||[]).map(e=>e.id));let n=1;while(ids.has('item-'+n))n++;(x.evidence=x.evidence||[]).push({id:'item-'+n,title:'Evidence '+n,text:'(your text)',kind:'document'});},true),'',{'data-me-evidence-add':m.id}));
  if(M){const p=[...M.castProblems(m,{}),...M.evidenceProblems(m)];if(p.length)box.append(el('p',p.join(' '),'me-warn'));}
  return box;}
 root.VoidMechanicsEditor={KINDS,NO_VIA,NO_LINES,stepFields,unseenBox,panel};
})(globalThis);
