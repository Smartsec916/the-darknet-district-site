(function(root){
 'use strict';
 const C=root.VoidCinema;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 function feeds(){
  const rows=[];for(const tree of root.VoidLiveContent?.env?.trees||[])for(const mission of tree.missions||[])for(const f of mission.feeds||[])if(f.scene)rows.push({id:mission.id+'/'+f.id,name:(mission.name||mission.id)+' · '+f.id,scene:f.scene});
  return rows;
 }
 async function mount(host,tools){
  const uid=tools.uid,valid=()=>host.isConnected&&!host.closest('[hidden]')&&tools.authorized&&tools.uid===uid;
  function request(body){if(!valid())throw Error('Reopen the studio with the same developer account.');return tools.request('developer/studio/cinematics',body);}
  const data=await request();if(!valid())return;
  let revision=data.revision,projects=data.projects||{},key=Object.keys(projects)[0]||crypto.randomUUID(),p=structuredClone(projects[key]||C.fresh()),selected=p.clips?.[0]?.id,viewer,loadId=0,timer,busy=false,recording=false,audioFiles=[];
  const status=node('p');status.role='status';const note=e=>status.textContent=e?.message||String(e);
  if(C.validate(p))throw Error('The saved project has invalid settings. Reopen a valid project before rendering.');
  const head=node('div'),tracks=node('section'),edit=node('fieldset'),preview=node('div'),transport=node('div'),links=node('div');const clock=node('output');
  const scrub=node('input');scrub.type='range';scrub.step='.01';scrub.min=0;scrub.setAttribute('aria-label','Timeline position');
  function button(parent,text,fn){const b=node('button',text);b.type='button';b.onclick=async()=>{try{await fn();}catch(e){note(e);}};parent.append(b);return b;}
  function box(parent,label,value,choices,changed){
   const l=node('label',label+' '),input=node(choices?'select':'input');
   if(choices){for(const opt of choices){const o=node('option',opt.name??opt);o.value=opt.value??opt;input.append(o);}}
   else input.type=typeof value==='number'?'number':'text';
   if(input.type==='number')input.step='any';input.value=value;input.setAttribute('aria-label',label);l.className='dev-field';l.append(input);parent.append(l);
   input.onchange=()=>{if(recording){input.value=value;return;}const next=typeof value==='number'?Number(input.value):input.value;try{changed(next);}catch(e){input.value=value;note(e);}};return input;
  }
  function close(){loadId++;viewer?.dispose();viewer=null;recording=false;links.replaceChildren();}
  const observer=new MutationObserver(()=>{if(!valid()){close();clearInterval(timer);observer.disconnect();}});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  function ensureEdit(){if(recording)throw Error('Stop the recording before editing.');}
  async function open(){ensureEdit();const problem=C.validate(p);if(problem)throw Error(problem);close();const version=loadId;note(p.place==='Gameplay tab'?'Choose the gameplay tab to record.':'Loading scene…');
   const v=await root.VoidCinemaRenderer.create(preview,p,note);if(!valid()||version!==loadId){v.dispose();return;}viewer=v;fields();note('Preview ready.');}
  function prop(obj,name,value){const before=obj[name];obj[name]=value;const problem=C.validate(p);if(problem){obj[name]=before;throw Error(problem);}if(name==='start'||name==='duration')timeline();}
  function heading(){head.replaceChildren();
   const pick=box(head,'Saved project',key,Object.entries(projects).map(([value,proj])=>({value,name:proj.name})),value=>{close();key=value;p=structuredClone(projects[key]);selected=p.clips[0]?.id;render();});
   if(!projects[key])pick.append(new Option(p.name+' (unsaved)',key,true,true));
   button(head,'New project',()=>{ensureEdit();close();key=crypto.randomUUID();p=C.fresh();selected=p.clips[0].id;render();});
   box(head,'Project name',p.name,null,v=>prop(p,'name',v));
   for(const [k,l,list] of [['place','Scene',C.places],['actor','Performer',C.actors],['resolution','Resolution (short edge)',C.presets.resolution],['aspect','Aspect ratio',C.presets.aspect],['fps','Frames per second',C.presets.fps]]){
    box(head,l,p[k],list,v=>{if(k==='place'&&v!=='Blackrock camera feed')delete p.feed;prop(p,k,v);close();heading();note('Load the scene to preview the new settings.');});}
   if(p.place==='Gameplay tab'){
    const source=node('a','Open gameplay with HUD, markers and crosshair hidden');
    const url=new URL('void-runner.html',document.baseURI);url.searchParams.set('cinemaView','clean');
    source.href=url.href;source.target='_blank';source.rel='noopener';head.append(source);
    head.append(node('p','Open the recording tab, then choose it when you load the scene. Actions in that tab use its current game save. Choose an ordinary gameplay tab to include the HUD.'));
   }
   box(head,'Lighting hour',p.hour??21,Array.from({length:24},(_,h)=>({value:h,name:String(h).padStart(2,'0')+'00'})),v=>prop(p,'hour',v));
   if(p.place==='Blackrock camera feed')box(head,'Mission camera sequence',p.feed||'',[{value:'',name:'Original Blackrock sequence'},...feeds().map(f=>({value:f.id,name:f.name}))],v=>{if(v)p.feed=v;else delete p.feed;close();});
   button(head,'Save private project',async()=>{ensureEdit();if(busy)return;const problem=C.validate(p);if(problem)throw Error(problem);
    busy=true;try{const next={...projects,[key]:structuredClone(p)},r=await request({revision,projects:next});revision=r.revision;projects=next;heading();note('Private project saved.');}finally{busy=false;}});
   button(head,'Duplicate project',()=>{ensureEdit();key=crypto.randomUUID();p=structuredClone(p);p.name+=' copy';close();render();});
   button(head,'Export project JSON',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'})),a=node('a');a.download='void-runner-cinematic.json';a.href=url;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
   const l=node('label','Import project JSON '),input=node('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{ensureEdit();const file=input.files[0];if(!file||file.size>600000)throw Error('Choose a project smaller than 600 KB.');const next=JSON.parse(await file.text()),error=C.validate(next);if(error)throw Error(error);close();key=crypto.randomUUID();p=next;selected=p.clips[0]?.id;render();}catch(e){note(e);}};l.append(input);head.append(l);
  }
  function timeline(){tracks.replaceChildren();scrub.max=C.span(p)||1;for(const name of C.tracks){const row=node('div');row.className='dev-field';const label=node('b',name);row.append(label);
    const lane=node('div');lane.style.cssText='position:relative;min-height:28px;background:#102128;overflow:hidden;border:1px solid #365359';row.append(lane);
    const rows=[],end=Math.max(.1,C.span(p));for(const c of p.clips.filter(c=>c.track===name).sort((a,b)=>a.start-b.start)){
     let level=rows.findIndex(t=>t<=c.start);if(level<0)level=rows.length;rows[level]=c.start+c.duration;
     const b=button(lane,c.start.toFixed(2)+'–'+(c.start+c.duration).toFixed(2)+' s',()=>{ensureEdit();selected=c.id;viewer?.seek(c.start);fields();timeline();});
     b.style.cssText='position:absolute;height:26px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:'+(selected===c.id?'#245550':'#253d53')+';left:'+100*c.start/end+'%;width:'+100*c.duration/end+'%;top:'+26*level+'px';
     b.setAttribute('aria-pressed',String(c.id===selected));b.title=name+' · '+b.textContent;b.dataset.cinemaClip=c.id;b.draggable=true;
     b.ondragstart=e=>{if(recording){e.preventDefault();return;}e.dataTransfer.setData('text/plain',c.id);};
    }
    lane.style.height=Math.max(28,rows.length*26)+'px';lane.ondragover=e=>e.preventDefault();
    lane.ondrop=e=>{e.preventDefault();if(recording)return;const c=p.clips.find(v=>v.id===e.dataTransfer.getData('text/plain')&&v.track===name);if(!c)return;
     const rect=lane.getBoundingClientRect(),t=Math.max(0,Math.min(600-c.duration,(e.clientX-rect.left)/Math.max(1,rect.width)*end));
     c.start=Math.round(t*p.fps)/p.fps;selected=c.id;timeline();fields();};
    button(row,'Add '+name.toLowerCase(),()=>{ensureEdit();const last=p.clips.filter(c=>c.track===name).reduce((n,c)=>Math.max(n,c.start+c.duration),0);const c=C.clip(name,last,3);p.clips.push(c);selected=c.id;fields();timeline();});tracks.append(row);}}
  const labels={start:'Start time',duration:'Duration',mode:'Camera mode',x:'Start X',y:'Start Y',z:'Start Z',toX:'End X',toY:'End Y',toZ:'End Z',targetX:'Look at X',targetY:'Look at Y',targetZ:'Look at Z',yaw:'Yaw (degrees)',pitch:'Tilt (degrees)',fov:'Field of view (degrees)',zoom:'Zoom',shake:'Camera shake',easing:'Movement easing',focus:'Focus distance (0 disables depth of field)',brightness:'Light intensity',fog:'Fog density',color:'Color',clip:'Animation clip',src:'Recording',text:'Overlay text',volume:'Volume',offset:'Recording trim start',kind:'Transition'};
  function fields(){edit.replaceChildren();const c=p.clips.find(c=>c.id===selected);if(!c)return;edit.append(node('legend',c.track+' clip'));
   for(const [k,v] of Object.entries(c)){if(['id','track'].includes(k))continue;
    const opts=k==='mode'?C.modes:k==='easing'?['Linear','Smooth']:k==='kind'?['Fade in','Fade out']:k==='clip'&&viewer?.animations.length?viewer.animations:k==='src'?['',...audioFiles,...(root.VoidSoundStudio?.project.assets||[]).map(a=>({name:a.name,value:a.src}))]:null;
    const input=box(edit,labels[k]||k,v,opts,n=>prop(c,k,n));if(k==='color')input.type='color';}
   button(edit,'Duplicate clip',()=>{ensureEdit();const copy={...c,id:C.clip(c.track).id,start:c.start+c.duration};if(copy.start+copy.duration>600)throw Error('Clip exceeds ten minutes.');p.clips.push(copy);selected=copy.id;timeline();fields();});
   button(edit,'Remove clip',()=>{ensureEdit();p.clips=p.clips.filter(row=>row!==c);selected=p.clips[0]?.id;timeline();fields();});
  }
  function render(){heading();timeline();fields();}
  host.replaceChildren(node('h2','Cinematic Video Studio'),head,preview,transport,scrub,clock,tracks,edit,links,status);
  button(transport,'Load scene',open);
  const ready=()=>{if(!viewer)throw Error('Load a scene first.');return viewer;};
  button(transport,'Play',()=>{ensureEdit();ready().play();});button(transport,'Pause',()=>{ensureEdit();ready().pause();});
  button(transport,'Stop',()=>{ready().stop();if(!recording)ready().seek(0);});button(transport,'Restart',()=>{ensureEdit();ready().seek(0);ready().play();});
  for(const [label,d] of [['Previous frame',-1],['Next frame',1]])button(transport,label,()=>{ensureEdit();ready().pause();ready().seek(viewer.time+d/p.fps);});
  scrub.oninput=()=>{if(viewer&&!recording){viewer.pause();viewer.seek(Number(scrub.value));}};
  const formats=C.formats(),selector=box(transport,'Recording format',formats[0]||'',formats,()=>{});
  const rec=button(transport,'Record timeline',async()=>{if(recording)return;const v=ready();recording=true;note('Recording…');
   try{const r=await v.exportVideo(selector.value);if(!valid()||viewer!==v)return;
    const link=node('a','Download '+r.extension.toUpperCase());link.href=r.url;link.download=(p.name.replace(/[^a-z0-9_-]/gi,'-')||'cinematic')+'.'+r.extension;links.replaceChildren(link);note('Recording ready · '+Math.ceil(r.blob.size/1024)+' KiB.');}finally{recording=false;}});
  rec.disabled=!formats.length;if(!formats.length)note('Video recording is unavailable in this browser.');
  render();timer=setInterval(()=>{if(!viewer)return;scrub.value=viewer.time;clock.value=viewer.time.toFixed(2)+' / '+C.span(p).toFixed(2)+' s';},100);
  try{const res=await fetch('void-runner/sound-library.json');if(res.ok)audioFiles=await res.json();if(valid())fields();}catch{}
 }
 root.VoidCinemaEditor={mount,feeds};
})(globalThis);
