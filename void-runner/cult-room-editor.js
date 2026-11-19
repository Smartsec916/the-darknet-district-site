/* CAMERA FEEDS in the Mission Editor (browser only; loaded with the editor, dev-tools.js editorScripts). cult-room.js has the rules.
   - Add a location > Other > "Blackrock cult room (camera feed only)" adds a camera feed to the mission (mission.feeds): not a walkable place, not joined to modules.
   - A "Hack the access point" step (Form and Blocks views, mission-editor.js hackRow) gets "Camera feed": choose the feed; the step then completes when the feed's
     recording is saved in the V1 Gallery (not when the door opens).
   - THE SCENE EDITOR (card): the timeline of beats in order, each after its own pause: who, where to, how long, the walking speed, and every LINE with an empty words box
     for the owner (nothing is written for him: an empty line is silence and shows nothing) and IMPORT VOICE FILE beside it (voice-imports.js, the same as every
     other line). + ADD A BEAT, ↑ ↓, ×, RESET TO THE OWNER'S CHOREOGRAPHY, PREVIEW (plays the feed in the game without recording), the length, problems in plain words.
   card({m, f, ed, kit}) -> element; stepFeed(m, o, eo, kit) -> elements for the hack step's row. */
(function(root){
 'use strict';
 const C=()=>root.VoidCultRoom;
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls,{type:'button',...(attrs||{})});b.onclick=e=>{e.preventDefault();fn(e);};return b;};
 const hint=t=>el('span',t,'me-help');
 if(typeof document!=='undefined'&&!document.getElementById('cult-editor-css')){const st=document.createElement('style');st.id='cult-editor-css';st.textContent='.cf-card .cf-beat{border-left:3px solid #4a5560;padding:4px 8px;margin:4px 0;background:rgba(255,255,255,.02)}.cf-card .cf-beat[data-act=line]{border-left-color:#c89a4a}.cf-card .cf-beat[data-act=enter],.cf-card .cf-beat[data-act=exit]{border-left-color:#5a8ac8}.cf-card .cf-beat textarea{width:min(520px,100%);min-height:2.4em}.cf-card .cf-n{display:inline-block;min-width:2.2em;color:#9ab}.cf-card input[type=number]{width:5em}.cf-ok{color:#7fe0a8}';document.head.append(st);}
 function num(label,value,min,max,step,on,attrs,blank){const l=el('label','','me-small');const i=el('input','','',{type:'number',min:String(min),max:String(max),step:String(step),'aria-label':label,...(attrs||{})});i.value=value==null?'':String(value);if(blank)i.placeholder=blank;
  i.onchange=()=>{const v=i.value===''?null:Number(i.value);if(v!=null&&!(v>=min&&v<=max)){i.value=value==null?'':String(value);return;}on(v==null?null:Math.round(v*10)/10);};l.append(document.createTextNode(label+' '),i);return l;}
 function sel(label,opts,value,on,attrs){const s=el('select','','',{'aria-label':label,...(attrs||{})});for(const [v,t] of opts)s.append(new Option(t,v));s.value=value==null?'':String(value);s.onchange=()=>on(s.value);return s;}
 const whoOpts=(list)=>list.map(id=>[id,id==='six'?'All six':C().NAMES[id]||id]);
 const clock=s=>Math.floor(s/60)+' min '+Math.round(s%60)+' s';
 function beatRow({m,f,b,i,n,edS,kit}){const X=C(),row=el('div','','cf-beat',{'data-cf-beat':String(i),'data-act':b.act}),r=el('div','','me-row'),act=X.ACTS.find(a=>a.id===b.act)||{name:b.act};
  const set=(k,v)=>edS(sc=>{const x=sc.beats[i];if(v==null||v==='')delete x[k];else x[k]=v;});
  r.append(el('span','#'+(i+1),'cf-n'),el('b',act.name),num('pause before (s)',b.wait==null?0:b.wait,0,60,.5,v=>set('wait',v||null),{'data-cf-wait':String(i)}));
  if(b.act==='pause')r.append(num('lasts (s)',b.secs,.5,60,.5,v=>set('secs',v),{'data-cf-secs':String(i)}));
  if(b.act==='door')r.append(sel('Door',[['open','opens'],['close','closes']],b.open===false?'close':'open',v=>set('open',v==='open'),{'data-cf-open':String(i)}));
  if(b.act==='enter'||b.act==='walk'||b.act==='exit')r.append(num('speed (m/s)',b.speed,X.LIMIT.speed[0],X.LIMIT.speed[1],.05,v=>set('speed',v),{'data-cf-speed':String(i)},'scene'));
  if(b.act==='exit')r.append(num('gap in the line (m)',b.gap,X.LIMIT.gap[0],X.LIMIT.gap[1],.1,v=>set('gap',v),{'data-cf-gap':String(i)},String(X.DEF.gap)));
  if(b.act==='turn'){r.append(sel('Who turns',whoOpts(X.WHO_TURN),b.who,v=>set('who',v),{'data-cf-who':String(i)}),el('span','to face','me-small'),sel('To face',X.TO_TURN.map(t=>[t,{initiate:'the initiate',owl:'the owl',door:'the door',centre:'the centre'}[t]]),b.to,v=>set('to',v),{'data-cf-to':String(i)}),num('over (s)',b.secs,1,8,.5,v=>set('secs',v),{'data-cf-secs':String(i)},String(X.DEF.turn)));}
  if(b.act==='walk'){r.append(sel('Who walks',whoOpts(X.ACTORS),b.who,v=>set('who',v),{'data-cf-who':String(i)}),el('span','to','me-small'),sel('To',X.TO_WALK.map(t=>[t,{altar:'the altar',centre:'the centre',spot:'their spot in the circle'}[t]]),b.to,v=>set('to',v),{'data-cf-to':String(i)}));}
  if(b.act==='anim'){r.append(sel('Who',whoOpts(['six',...X.ACTORS]),b.who,v=>set('who',v),{'data-cf-who':String(i)}),el('span','plays','me-small'),sel('Animation',[['','— choose —'],...X.ANIMS.map(a=>[a,a])],b.clip||'',v=>set('clip',v||null),{'data-cf-clip':String(i)}),num('for (s)',b.secs,.5,60,.5,v=>set('secs',v),{'data-cf-secs':String(i)},'3'));}
  if(b.act==='line'){r.append(sel('Who speaks',X.SPEAKERS.map(s=>[s,X.NAMES[s]||s]),b.who,v=>edS(sc=>{sc.beats[i].who=v;}),{'data-cf-who':String(i)}),sel('Animation',[['','no animation'],...X.ANIMS.map(a=>[a,a])],b.anim||'',v=>set('anim',v||null),{'data-cf-anim':String(i)}),num('lasts (s)',b.secs,.5,60,.5,v=>set('secs',v),{'data-cf-secs':String(i)},'auto'));}
  r.append(btn('↑',()=>edS(sc=>{if(i>0)[sc.beats[i-1],sc.beats[i]]=[sc.beats[i],sc.beats[i-1]];}),'',{'aria-label':'Move up','data-cf-up':String(i),...(i?{}:{disabled:''})}),btn('↓',()=>edS(sc=>{if(i<n-1)[sc.beats[i+1],sc.beats[i]]=[sc.beats[i],sc.beats[i+1]];}),'',{'aria-label':'Move down','data-cf-down':String(i),...(i<n-1?{}:{disabled:''})}),
   btn('×',()=>edS(sc=>{sc.beats.splice(i,1);}),'me-x',{'aria-label':'Remove beat','data-cf-del':String(i)}));row.append(r);
  if(b.act==='line'){const ta=el('textarea','','',{'aria-label':'What '+(X.NAMES[b.who]||b.who)+' says','data-cf-text':String(i),maxlength:String(X.LIMIT.text),placeholder:'(empty: silence, nothing is shown) the words are yours to write'});ta.value=b.text||'';
   ta.onchange=()=>edS(sc=>{sc.beats[i].text=ta.value.slice(0,X.LIMIT.text);},false);row.append(ta);
   if(kit&&kit.importBox){const key='tree:'+m.id+'/feed/'+f.id+'/'+i,ib=kit.importBox(key,b.who==='robed-all'?'robed-all':b.who,()=>ta.value);ta.addEventListener('input',()=>ib.refresh&&ib.refresh());row.append(ib);}}
  else row.append(el('p',act.note||'','me-small'));
  return row;}
 function card({m,f,ed,kit}){const X=C(),box=el('div','','me-step cf-card',{'data-cf-feed':f.id});if(!X){box.append(el('p','The camera feed rules are loading…','me-small'));return box;}
  const edF=(fn,redraw=true)=>ed(x=>{const y=(x.feeds||[]).find(z=>z.id===f.id);if(y)fn(y,x);},redraw);
  const edS=(fn,redraw=true)=>edF(y=>{if(!y.scene||!Array.isArray(y.scene.beats))y.scene=X.defaultScene();fn(y.scene);},redraw);
  const sc=f.scene&&Array.isArray(f.scene.beats)?f.scene:X.defaultScene(),room=X.FEED_ROOMS.find(r=>r.id===f.room)||{name:f.room};
  const r1=el('div','','me-row');r1.append(el('b','CAMERA FEED “'+f.id+'”'),el('span',room.name,'me-small'),
   btn('▶ PREVIEW THE SCENE',()=>{const F=root.VoidCameraFeed;if(!F){alert('The camera feed is not loaded in this game page.');return;}F.preview(JSON.parse(JSON.stringify(sc)));},'',{'data-cf-preview':f.id}),
   btn('RESET TO THE OWNER’S CHOREOGRAPHY',()=>{if(!confirm('Put the scene back to the choreography of 19 Nov 2026? Your lines and timings in this feed are replaced (UNDO brings them back).'))return;edF(y=>{y.scene=X.defaultScene();});},'',{'data-cf-reset':f.id}),
   btn('×',()=>{if(!confirm('Remove camera feed “'+f.id+'” from this mission? A hack step that shows it will need another feed.'))return;ed(x=>{x.feeds=(x.feeds||[]).filter(y=>y.id!==f.id);if(!x.feeds.length)delete x.feeds;for(const o of x.objectives||[])if(o.feed===f.id)delete o.feed;},true);},'me-x',{'aria-label':'Remove camera feed'}));box.append(r1);
  box.append(el('p','Seen only through the hacked security camera in a top corner (a “Hack the access point” step with this camera feed). Recording starts by itself as the feed comes up and stops when the scene ends; the video is saved in the V1 Gallery and the step completes. Every line starts empty: write the words, then IMPORT VOICE FILE.','me-small'));
  const r2=el('div','','me-row');r2.append(num('Circle radius (m)',sc.radius==null?X.DEF.radius:sc.radius,X.LIMIT.radius[0],X.LIMIT.radius[1],.1,v=>edS(s=>{if(v==null)delete s.radius;else s.radius=v;}),{'data-cf-radius':f.id}),
   num('Walking speed (m/s)',sc.speed==null?X.DEF.speed:sc.speed,X.LIMIT.speed[0],X.LIMIT.speed[1],.05,v=>edS(s=>{if(v==null)delete s.speed;else s.speed=v;}),{'data-cf-scene-speed':f.id}),hint('Slow and ritual: about half a normal walk. The six enter spaced one sixth of the circle apart, so they reach their places together, 60° apart.'));box.append(r2);
  const list=el('div','','cf-beats',{'data-cf-beats':f.id});sc.beats.forEach((b,i)=>list.append(beatRow({m,f,b,i,n:sc.beats.length,edS,kit})));box.append(list);
  const r3=el('div','','me-row'),as=sel('Add a beat',X.ACTS.map(a=>[a.id,a.name]),'line',()=>{},{'data-cf-add-act':f.id});
  r3.append(as,btn('+ ADD A BEAT',()=>edS(s=>{const a=as.value,b={act:a};if(a==='line'){b.who='initiate';b.text='';}if(a==='turn'){b.who='six';b.to='owl';}if(a==='walk'){b.who='initiate';b.to='centre';}if(a==='anim'){b.who='initiate';b.clip='talk';b.secs=3;}if(a==='pause')b.secs=2;if(a==='door')b.open=true;if(s.beats.length<X.LIMIT.beats)s.beats.push(b);}),'',{'data-cf-add':f.id}),hint('Beats play one after another. Use ↑ ↓ to move a beat; the pause before each one is the deliberate stillness between them.'));box.append(r3);
  const cs=X.compile(sc),probs=cs.problems,lines=sc.beats.filter(b=>b.act==='line'),empty=lines.filter(b=>!String(b.text||'').trim()).length;
  box.append(el('p',probs.length?'To fix: '+probs.join(' · '):'The scene lasts about '+clock(cs.dur)+' (the recording is as long). '+lines.length+' line'+(lines.length===1?'':'s')+(empty?', '+empty+' still empty (silence)':'')+'.',probs.length?'me-small me-warn':'me-small cf-ok',{'data-cf-problems':f.id}));
  return box;}
 /* The hack step's "Camera feed" choice (and the scene editor under it). */
 const OPEN=new Set();   // scene editors left open (kept across the editor's redraws)
 function stepFeed(m,o,eo,kit){const X=C();if(!X)return [];const out=[],fs=m.feeds||[],s=el('select','','',{'aria-label':'Camera feed','data-me-step-feed':o.id});
  s.append(new Option('no camera feed (opens the door)',''));for(const f of fs)s.append(new Option('shows camera feed “'+f.id+'” ('+((X.FEED_ROOMS.find(r=>r.id===f.room)||{}).name||f.room)+')',f.id));s.value=o.feed||'';
  s.onchange=()=>eo((x)=>{if(s.value){x.feed=s.value;delete x.unlock;}else delete x.feed;},true);out.push(s);
  if(!fs.length)out.push(btn('+ ADD THE BLACKROCK CULT ROOM FEED',()=>eo((x,mm)=>{const r=X.addFeed(mm);mm.feeds=r.feeds;x.feed=r.id;delete x.unlock;},true),'',{'data-me-step-feed-add':o.id}));
  const f=fs.find(z=>z.id===o.feed);if(f){const d=el('details','','',{'data-me-step-scene':o.id}),k=m.id+'/'+o.id;d.open=OPEN.has(k);d.ontoggle=()=>{if(d.open)OPEN.add(k);else OPEN.delete(k);};d.append(el('summary','EDIT THE SCENE (lines, timing, movement)'));d.append(card({m,f,ed:(fn,redraw)=>eo((x,mm)=>fn(mm),redraw),kit}));out.push(d);out.push(hint('Done when the recording of this feed is saved in the V1 Gallery.'));}
  return out;}
 root.VoidCultRoomEditor={card,stepFeed};
})(globalThis);
