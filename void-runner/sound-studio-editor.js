/* Private developer interface. Signed uploads and previews never write to the published mixer. */
(function(root){
 'use strict';
 const S=root.VoidSoundStudio;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const id=()=> 's-'+crypto.randomUUID().slice(0,12);
 async function mount(host,tools){
  const uid=tools.uid,active=()=>host.isConnected&&tools.authorized&&tools.uid===uid;
  const send=(path,body)=>{if(!active())throw Error('Reopen the studio with the same developer account.');return tools.request('developer/studio/audio'+path,body);};
  const data=await send('');if(!active())return;
  let revision=data.draft.revision,version=data.live.version,c=structuredClone(data.draft.content||data.live.content),tab='Library',selected=c.assets[0]?.id,search='',category='',unused=false,preview=null,objectUrl=null,audioContext=null,auditionController=null,epoch=0,busy=false,mixerPreview=false;
  const status=node('p');status.role='status';const body=node('section');
  function stop(){if(mixerPreview){root.VoidAudio.setStudioMix(S.project.mix);mixerPreview=false;}epoch++;auditionController?.abort();auditionController=null;preview?.dispose();preview=null;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;if(audioContext)audioContext.close().catch(()=>{});audioContext=null;}
  const observer=new MutationObserver(()=>{if(!active()){stop();observer.disconnect();}});observer.observe(document.body,{subtree:true,childList:true});
  const notify=e=>status.textContent=e?.message||String(e);
  function button(parent,label,fn){const b=node('button',label);b.type='button';b.onclick=async()=>{try{await fn();}catch(e){notify(e);}};parent.append(b);return b;}
  function field(parent,label,obj,key,options){
   const choices=Array.isArray(options)&&typeof obj[key]!=='number';
   const box=node('label',label+' '),input=node(choices?'select':'input');
   if(choices)for(const v of options){const opt=node('option',v.name??v);opt.value=v.id??v;input.append(opt);}
   else if(typeof obj[key]==='number'){input.type='number';input.step='any';if(options){input.min=options[0];input.max=options[1];}}
   else if(typeof obj[key]==='boolean')input.type='checkbox';
   input.dataset.field=key;if(input.type==='checkbox')input.checked=obj[key];else input.value=obj[key]??'';
   input.onchange=()=>{if(!input.checkValidity()){input.reportValidity();return;}obj[key]=input.type==='checkbox'?input.checked:input.type==='number'?Number(input.value):input.value;};
   box.className='dev-field';box.append(input);parent.append(box);return input;
  }
  const names=()=>c.assets.map(a=>({id:a.id,name:a.name}));
  function refs(a){return [...c.locations.filter(p=>p.tracks.some(t=>t.asset===a)).map(p=>'Playlist '+p.area),...c.sources.filter(s=>s.asset===a).map(s=>'Source '+s.id),...c.events.filter(e=>e.asset===a).map(e=>'Event '+e.id)];}
  async function blobRequest(path,file){
   const u=root.VoidAccount?.user;if(!active()||u?.uid!==uid)throw Error('Developer sign-in required.');
   const token=await u.getIdToken();if(!active())throw Error('Developer session changed.');
   const r=await fetch(S.base()+'developer/studio/audio/'+path,{method:file?'POST':'GET',headers:{Authorization:'Bearer '+token},body:file,cache:'no-store'});
   if(!r.ok)throw Error((await r.json().catch(()=>({}))).error||'Recording unavailable.');return file?r.json():r.blob();
  }
  function upload(parent,replace){
   const label=node('label',replace?'Replace recording ':'Upload recording '),input=node('input');input.type='file';input.accept='audio/mpeg,audio/ogg,audio/wav,audio/mp4,.m4a';
   input.onchange=async()=>{const file=input.files[0];if(!file)return;try{if(file.size>20*1024*1024)throw Error('Choose a recording up to 20 MiB.');
    const result=await blobRequest('upload',file);if(!active())return;
    if(replace){replace.src=result.src;replace.start=0;replace.end=0;}else{const a=S.asset(id(),result.src,file.name,'Music');c.assets.push(a);selected=a.id;}
    render();notify('Uploaded to the private library. Save your draft to keep the assignment.');
   }catch(e){notify(e);}};label.append(input);parent.append(label);
  }
  async function audition(a,canvas){
   stop();const t=epoch;let url=S.mediaUrl(a.src);
   if(/^[a-f0-9]{64}$/.test(a.src)){const blob=await blobRequest('media/'+a.src);if(t!==epoch||!active())return;url=objectUrl=URL.createObjectURL(blob);}
   root.VoidAudio.unlock();preview=S.player(a,'effects',1,{url});if(!preview)throw Error('Enable game audio to preview this recording.');
   const media=preview.media,controller=auditionController=new AbortController(),signal=controller.signal;
   if(!media.readyState)await new Promise(resolve=>{
    for(const event of ['loadedmetadata','error'])media.addEventListener(event,resolve,{once:true,signal});
    signal.addEventListener('abort',resolve,{once:true});
   });
   if(signal.aborted||t!==epoch)return;
   if(!Number.isFinite(media.duration)||media.duration>180){notify('Streaming preview · full waveforms are available for recordings up to three minutes.');return;}
   const r=await fetch(url,{signal});if(!r.ok)throw Error('The recording could not be read.');const raw=await r.arrayBuffer();if(t!==epoch)return;
   const ctx=audioContext=new AudioContext(),decoded=await ctx.decodeAudioData(raw);if(t!==epoch)return;
   const samples=decoded.getChannelData(0),g=canvas.getContext('2d'),w=canvas.width,h=canvas.height;g.clearRect(0,0,w,h);g.strokeStyle='#69f3e7';g.beginPath();
   for(let x=0;x<w;x++){let peak=0;const start=Math.floor(x*samples.length/w),end=Math.min(samples.length,Math.ceil((x+1)*samples.length/w));
    for(let i=start;i<end;i+=Math.max(1,Math.floor((end-start)/120)))peak=Math.max(peak,Math.abs(samples[i]));g.moveTo(x,h*(1-peak)/2);g.lineTo(x,h*(1+peak)/2);}
   g.stroke();notify('Duration '+decoded.duration.toFixed(2)+' seconds.');
  }
  async function library(){
   const find=node('input');find.type='search';find.placeholder='Search names and tags';find.value=search;body.append(find);
   const filters={category,unused};const f=field(body,'Category',filters,'category',[{id:'',name:'All categories'},...S.categories]);
   const u=field(body,'Unused only',filters,'unused');const list=node('div');body.append(list);
   function matches(){list.replaceChildren();for(const a of c.assets.filter(a=>(!category||category===a.category)&&(!unused||!refs(a.id).length)&&[a.name,...a.tags].join(' ').toLowerCase().includes(search.toLowerCase())))button(list,a.name,()=>{selected=a.id;render();});}
   find.oninput=()=>{search=find.value;matches();};f.onchange=()=>{category=f.value;matches();};u.onchange=()=>{unused=u.checked;matches();};matches();upload(body);
   const box=node('label','Packaged recording '),stock=node('select');box.append(stock);body.append(box);
   const response=await fetch('void-runner/sound-library.json');if(!response.ok)throw Error('Packaged audio index unavailable.');
   const files=await response.json();if(!box.isConnected)return;
   for(const file of files){const o=node('option',file.replace(/^assets\/audio\//,''));o.value=file;stock.append(o);}
   button(body,'Add packaged recording',()=>{const src=stock.value,category=src.includes('/score/')?'Music':src.includes('/voice/')?'NPC voices':src.includes('steps-')?'Footsteps':src.includes('/ui/')?'Interface':'Ambience';
    const a=S.asset(id(),src,src.split('/').pop().replace(/\.[^.]+$/,''),category);c.assets.push(a);selected=a.id;render();});
   const a=c.assets.find(a=>a.id===selected);if(!a)return;
   body.append(node('h3',a.name));field(body,'Recording name',a,'name');field(body,'Recording category',a,'category',S.categories);
   const tags=field(body,'Tags, separated by commas',{tags:a.tags.join(', ')},'tags');tags.onchange=()=>a.tags=tags.value.split(',').map(s=>s.trim()).filter(Boolean);
   for(const [key,label,min,max] of [['volume','Volume',0,1],['start','Trim start (seconds)',0,7200],['end','Trim end (0 uses full recording)',0,7200],['fadeIn','Fade in (seconds)',0,60],['fadeOut','Fade out (seconds)',0,60],['rate','Playback speed',.25,4],['pitch','Pitch (semitones)',-12,12]])field(body,label,a,key,[min,max]);
   field(body,'Loop',a,'loop');body.append(node('p',refs(a.id).join(' · ')||'Unused recording'));upload(body,a);
   const wave=node('canvas');wave.width=480;wave.height=60;wave.style.maxWidth='100%';wave.setAttribute('aria-label','Recording waveform');body.append(wave);
   button(body,'Preview recording',()=>audition(a,wave));button(body,'Stop preview',stop);
   button(body,'Duplicate recording',()=>{const copy=structuredClone(a);copy.id=id();copy.name+=' copy';c.assets.push(copy);selected=copy.id;render();});
   button(body,'Remove recording',()=>{if(refs(a.id).length)throw Error('Remove the assignments before removing this recording.');c.assets=c.assets.filter(r=>r!==a);selected=c.assets[0]?.id;render();});
  }
  const locations=()=>[...new Set([...Object.keys(root.VoidMusicScore?.styles||{}),'under-tea-room','under-sleeping-room','district-rest','milked','meridian','spaceship','apartment'])];
  function area(parent,p){const input=field(parent,'Location',p,'area'),list=node('datalist');list.id='areas-'+id();for(const area of locations()){const o=node('option');o.value=area;list.append(o);}input.setAttribute('list',list.id);parent.append(list);}
  function first(){if(!c.assets.length)throw Error('Add a recording to the library first.');return c.assets[0].id;}
  function assignments(key){
   const loc=key==='locations',source=key==='sources',label=loc?'playlist':source?'spatial source':'event';
   button(body,'Add '+label,()=>{const a=first();c[key].push(loc?{id:id(),area:'district-store',tracks:[{asset:a,volume:1}],shuffle:false,crossfade:1,gap:0,loop:true,resume:true,fromHour:0,toHour:0,mission:''}:source?{id:id(),area:'district-store',asset:a,x:0,y:1,z:0,direction:0,near:1,far:12,attenuation:1,volume:1,loop:true,occlusion:false,environment:'both',mission:''}:{id:'door',asset:a});render();});
   for(const p of c[key]){const row=node('fieldset');row.append(node('legend',p.area||p.id));body.append(row);if(loc||source){area(row,p);field(row,'Mission ID (optional)',p,'mission');}
    if(loc){for(const [i,t] of p.tracks.entries()){field(row,'Track '+(i+1),t,'asset',names());field(row,'Track volume',t,'volume',[0,1]);
      if(i)button(row,'Move track '+(i+1)+' up',()=>{[p.tracks[i-1],p.tracks[i]]=[t,p.tracks[i-1]];render();});
      button(row,'Remove track '+(i+1),()=>{p.tracks.splice(i,1);render();});}
     button(row,'Append track',()=>{p.tracks.push({asset:first(),volume:1});render();});
     for(const [k,l] of Object.entries({shuffle:'Shuffle',loop:'Loop playlist',resume:'Resume on return',gap:'Pause between tracks (seconds)',crossfade:'Crossfade (seconds)',fromHour:'From game hour',toHour:'Through game hour (exclusive)'}))field(row,l,p,k);
    }else{if(!source)field(row,'Game event',p,'id',Object.keys(root.VoidAudio.effects||{}).concat(['door','dock','boost']).filter((v,i,a)=>a.indexOf(v)===i));
     field(row,'Recording',p,'asset',names());
     if(source){for(const [k,l] of Object.entries({x:'World X',y:'World Y',z:'World Z',direction:'Direction in degrees',near:'Inner radius',far:'Outer radius',attenuation:'Attenuation',volume:'Source volume',loop:'Loop source',occlusion:'Obstructed by walls'}))field(row,l,p,k);
      field(row,'Environment',p,'environment',['both','interior','exterior']);const canvas=node('canvas');canvas.width=220;canvas.height=140;row.append(canvas);
      function radius(){const g=canvas.getContext('2d');g.clearRect(0,0,220,140);g.strokeStyle='#62dacc';for(const r of [54,54*Math.min(1,Math.max(0,p.near/Math.max(.1,p.far)))]){g.beginPath();g.arc(68,68,r,0,Math.PI*2);g.stroke();}g.fillStyle='#c8e7ea';g.fillText(p.far+' m',130,70);}radius();row.addEventListener('change',radius);}
    }
    button(row,'Remove '+label,()=>{c[key]=c[key].filter(o=>o!==p);render();});
   }
  }
  function render(){stop();body.replaceChildren();if(tab==='Library')library().catch(notify);else if(tab==='Mixer'){for(const ch of S.channels){const inp=field(body,ch==='duck'?'Dialogue ducking':ch,c.mix,ch,[0,1]);inp.type='range';inp.step='.01';inp.oninput=()=>{c.mix[ch]=Number(inp.value);if(mixerPreview)root.VoidAudio.setStudioMix(c.mix);};}
   button(body,'Audition mixer in this window',()=>{mixerPreview=true;root.VoidAudio.unlock();root.VoidAudio.setStudioMix(c.mix);notify('Local mixer preview active.');});button(body,'Restore published mix',stop);}
   else assignments({Playlists:'locations','Spatial sources':'sources','Game events':'events'}[tab]);}
  host.replaceChildren(node('h2','Sound & Audio Studio'));const nav=node('nav');host.append(nav);
  for(const name of ['Library','Playlists','Spatial sources','Game events','Mixer'])button(nav,name,()=>{tab=name;render();});
  host.append(body,status);
  button(host,'Export audio configuration',()=>{
   const url=URL.createObjectURL(new Blob([JSON.stringify(c,null,2)],{type:'application/json'})),link=node('a');
   link.href=url;link.download='void-runner-audio.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  });
  const importLabel=node('label','Import audio configuration '),picker=node('input');picker.type='file';picker.accept='.json,application/json';
  picker.onchange=async()=>{if(busy)return;const file=picker.files[0];if(!file)return;
   busy=true;try{if(file.size>1024*1024)throw Error('Choose a configuration smaller than 1 MiB.');
    const content=JSON.parse(await file.text()),validated=await send('/validate',{content});if(!active())return;
    c=validated.content;selected=c.assets[0]?.id;render();notify('Imported for preview. Save the private draft to keep these changes.');
   }catch(e){notify(e);}finally{busy=false;picker.value='';}
  };importLabel.append(picker);host.append(importLabel);

  for(const [path,label] of [['draft','Save private draft'],['publish','Publish audio']])button(host,label,async()=>{if(busy)return;busy=true;try{const r=await send('/'+path,{revision,expected:version,content:c});if(!active())return;revision=r.revision;if(r.version!=null)version=r.version;notify(path==='draft'?'Private draft saved.':'Published version '+version+'.');}finally{busy=false;}});
  render();
 }
 root.VoidSoundEditor={mount};
})(globalThis);
