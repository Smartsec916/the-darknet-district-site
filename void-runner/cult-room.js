/* THE BLACKROCK CULT ROOM (the owner, 19 Nov 2026): one large square basement room in a corporate building, two storeys tall, one door centred on one side, a large owl
   stencilled on the far wall with an altar under it and a small box on the altar. Seven figures in the same black hooded robe (npc-blackrock-robe.glb): six who enter, and
   the initiate (male) who kneels at the centre. THE PLAYER NEVER GOES THERE: it is a camera-feed-only location ("Other" in the Mission Editor's Add a location), seen
   through a hacked security camera in a top corner. A "Hack the access point" step with a camera feed (feed: '<id>') switches the screen to the feed (camera-feed.js), the
   scene plays and records itself, the recording is saved in the V1 Gallery as a video, the view returns to the player; the step completes when the recording is saved.
   THE SCENE is an editable timeline (mission.feeds[i].scene): beats played one after another, each after its own pause. No dialogue is written here: every line slot starts
   empty (silence, nothing shown) for the owner to fill, with a voice import slot per line (Mission Editor). Movement is slow and ritual: a slow processional walk (the
   walk clip slowed with its play rate matched to the speed, so the feet do not slide), equal spacing, synchronised turns, deliberate pauses, no idle variation.
   CHOREOGRAPHY MATHS (pure, Node-tested): the six enter in a line spaced exactly one sixth of the circle apart (R * 60 degrees), so when the leader reaches the last spot
   every walker is on its own spot at the same moment (evenly spaced, 60 degrees apart); they leave behind the initiate, each joining the line where its spot meets his path.
   Data shape: mission.feeds = [{id, room:'blackrock-cult', scene:{radius?, speed?, beats:[{act, who?, to?, text?, clip?, secs?, wait?, speed?, open?}]}}];
   a hack step: {kind:'hack', ap, feed:'<feed id>'}. Server mirror: void_runner_live_content.py feed_problems (admin inventory `feeds`). */
(function(root){
 'use strict';
 const ROOM={id:'blackrock-cult',name:'Blackrock cult room',size:14,height:7,
  door:{x:0,z:-7,w:1.5,h:2.5},corridor:{len:4.2,w:2.4,h:2.8},
  owl:{w:8.4,h:5.6,y:3.45},altar:{x:0,z:5.55,w:2.6,d:1.0,h:1.02},box:{w:.36,d:.24,h:.2},
  centre:{x:0,z:0},camera:{x:6.0,y:5.8,z:-5.7,lookX:-1.8,lookY:0,lookZ:-1.2,fov:1.3,zooms:[1,1.5,2,3]}};
 const FEED_ROOMS=[{id:ROOM.id,name:'Blackrock cult room (camera feed only)',cat:'other',note:'A large square basement room in a corporate building: the owl on the far wall, an altar and a box. Seen only through a hacked security camera (a “Hack the access point” step with this camera feed). Not walkable and not joined to other modules.'}];
 const SIX=['robed-1','robed-2','robed-3','robed-4','robed-5','robed-6'],ACTORS=['initiate',...SIX],SPEAKERS=[...ACTORS,'robed-all'];
 const NAMES={initiate:'The initiate','robed-all':'All six (together)'};SIX.forEach((id,i)=>{NAMES[id]='Robed figure '+(i+1);});
 /* THE SIX MEMBERS' VOICES AND THE CHORUS (APPROVED by the owner 20 Nov 2026; Mission 010's seven chorus lines and the laugh RECORDED 21 Nov 2026 with this recipe: extra/manifest.json robed-all-m010-1..8). Each robed figure's ElevenLabs voice is in
    tools/audio/revoice-engines.json ('robed-1'..'robed-6', labelled "Blackrock Member N (name)"): ordinary, slightly nerdy corporate men, not dramatic. A line by
    'robed-all' (the unison lines and the laugh) is ONE mix of the six, the owner's "half in sync" recipe below, so every future chorus line and the laugh sound the
    same: members 1-3 together (time-aligned to a common length, offsets 0 / 20 / 10 ms), member 4 about 230 ms late, member 6 about 160 ms late, member 5 rushing
    (about 6% faster), the drifting three (4, 5, 6) at 80-85% volume, a light room echo. Model eleven_v4 with the delivery tag [slow, solemn, ceremonial]. Data
    only here: whoever renders the take (the owner's own files, or an approved generation) follows it. */
 const CHORUS={'robed-all':{members:SIX.slice(),model:'eleven_v4',tag:'[slow, solemn, ceremonial]',mix:'half in sync',approved:'2026-11-20 by the owner',
  voices:{'robed-1':{label:'Blackrock Member 1 (Jacob L.)',voiceId:'SO9JediIwzugrikv7xw0',offsetMs:0,align:true,gain:1,speed:1},'robed-2':{label:'Blackrock Member 2 (Edward Sterling)',voiceId:'VsQmyFHffusQDewmHB5v',offsetMs:20,align:true,gain:1,speed:1},
   'robed-3':{label:'Blackrock Member 3 (Cole)',voiceId:'oXuGG4PpSq1U1YAFxeEO',offsetMs:10,align:true,gain:1,speed:1},'robed-4':{label:'Blackrock Member 4 (Alex)',voiceId:'wqcUglz7RaiukTjAKIvu',offsetMs:230,align:false,gain:.82,speed:1},
   'robed-5':{label:'Blackrock Member 5 (Dean)',voiceId:'hqsADTrqjrr0sI9LFcYV',offsetMs:0,align:false,gain:.85,speed:1.06},'robed-6':{label:'Blackrock Member 6 (Gareth)',voiceId:'ctbfMo4IDq5ExcIEim2K',offsetMs:160,align:false,gain:.8,speed:1}},
  alignTo:'common length (members 1-3)',room:{echo:'light'},appliesTo:['every robed-all line','the laugh']}};
 const WHO_TURN=['six',...ACTORS],TO_TURN=['initiate','owl','door','centre'],TO_WALK=['altar','centre','spot'];
 const ACTS=[
  {id:'pause',name:'Pause',note:'Nobody moves.'},
  {id:'door',name:'Door',note:'The door slides open or shut.'},
  {id:'enter',name:'The six enter',note:'In a line through the door, slowly round the initiate until evenly spaced (60° apart).'},
  {id:'turn',name:'Turn',note:'Stop, pause, then turn together.'},
  {id:'line',name:'A line',note:'Someone speaks. Empty words: silence, nothing shown.'},
  {id:'rise',name:'The initiate rises',note:'From kneeling to standing, slowly.'},
  {id:'walk',name:'Walk',note:'One figure walks slowly to a place.'},
  {id:'card',name:'Take the card',note:'The initiate opens the box on the altar and takes out the paper card.'},
  {id:'anim',name:'Animation',note:'One figure (or all six) plays an animation.'},
  {id:'exit',name:'All seven leave',note:'In a line, the initiate first, slowly out through the door.'}];
 const ACT_IDS=ACTS.map(a=>a.id);
 // the robe figure's clips (tools/animation-pipeline/characters/npc-blackrock-robe.json): what a beat may play
 const CLIPS=['stand','kneel','rise','talk','laugh','read','shock','idle'],ANIMS=['talk','laugh','read','shock','stand','idle'],ONCE=['rise','shock'];
 const STRIDE=1.2;   // m/s the walk clip covers at play rate 1 (the game's street walk); a slower walk plays it slower so the feet stay planted
 const LIMIT={beats:80,text:500,secs:[0,60],speed:[.2,1],radius:[2,3.4],gap:[1.2,3],turn:[1,8],lineDefault:3};
 const DEF={radius:2.6,speed:.7,gap:1.6,turn:3,rise:3.2,card:2.4,door:1.6};
 const deg=d=>d*Math.PI/180,r2=n=>Math.round(n*1000)/1000;
 const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
 const yawTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);   // yaw 0 faces +z (the owl), pi/2 faces +x
 /* The six spots: n points round the centre, evenly spaced, the first `first` degrees from the door side (south), going round the way the line walks (south, east,
    north, west). Each faces the centre. -> [{x, z, yaw, phi}] (phi: the angle from north, clockwise seen from above). */
 function circleSpots(n=6,r=DEF.radius,first=30){const out=[];for(let k=0;k<n;k++){const phi=deg(180-first-k*360/n);out.push({x:r2(r*Math.sin(phi)),z:r2(r*Math.cos(phi)),yaw:r2(wrap(phi+Math.PI)),phi:r2(phi)});}return out;}
 const lineGap=r=>r*Math.PI/3;   // one sixth of the circle: the entry spacing that puts all six on their spots at once
 // ---- the default scene: the owner's choreography of 19 Nov 2026, every line slot empty for his words ----
 const L=(who,extra={})=>({act:'line',who,text:'',...extra});
 function defaultScene(){return {radius:DEF.radius,speed:DEF.speed,beats:[
  {act:'pause',secs:3},
  {act:'door',open:true},
  {act:'enter',wait:.5},
  {act:'turn',who:'six',to:'initiate',wait:2,secs:3},
  {act:'door',open:false,wait:.5},
  L('robed-1',{wait:2}),L('robed-2',{wait:1.5}),L('robed-3',{wait:1.5}),L('robed-4',{wait:1.5}),L('robed-5',{wait:1.5}),L('robed-6',{wait:1.5}),L('initiate',{wait:2}),
  {act:'rise',wait:2},
  {act:'turn',who:'six',to:'owl',wait:2,secs:4},
  {act:'walk',who:'initiate',to:'altar',wait:2,speed:.6},
  {act:'card',wait:1.5},
  {act:'anim',who:'initiate',clip:'read',secs:5},
  L('initiate',{anim:'shock',wait:.5}),
  L('robed-all',{anim:'laugh',secs:3.5,wait:.6}),
  {act:'door',open:true,wait:2},
  {act:'exit',wait:1},
  {act:'door',open:false,wait:1},
  {act:'pause',secs:2}]};}
 /* The words a line's recorded voice is looked up by (voice-clips.js: speaker|text). An empty line with an animation (the laugh) has no words to show, so its voice is
    keyed by the beat's animation instead: '[laugh]' (extra/manifest.json robed-all-m010-8). Nothing is shown for it; '' means no voice. */
 const voiceText=e=>!e||e.type!=='line'?'':e.text||(e.anim?'['+e.anim+']':'');
 const num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 const plainText=(s,n)=>typeof s==='string'&&s.length<=n&&!/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
 const keysOk=(o,ks)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>ks.includes(k));
 const BEAT_KEYS={pause:['secs'],door:['open'],enter:['speed'],turn:['who','to','secs'],line:['who','text','anim','secs'],rise:[],walk:['who','to','speed'],card:[],anim:['who','clip','secs'],exit:['speed','gap']};
 const nameOf=who=>NAMES[who]||(who==='six'?'the six':who);
 /* Shape and order problems of a scene, in plain words (the same rules as the server's feed_scene_problems). */
 function sceneProblems(sc){const out=[];if(!keysOk(sc,['radius','speed','beats']))return ['the scene has unknown fields.'];
  if(sc.radius!=null&&!num(sc.radius,...LIMIT.radius))out.push('the circle radius is '+LIMIT.radius[0]+' to '+LIMIT.radius[1]+' m.');
  if(sc.speed!=null&&!num(sc.speed,...LIMIT.speed))out.push('the walking speed is '+LIMIT.speed[0]+' to '+LIMIT.speed[1]+' m/s.');
  const bs=sc.beats;if(!Array.isArray(bs)||!bs.length||bs.length>LIMIT.beats){out.push('a scene has 1 to '+LIMIT.beats+' beats.');return out;}
  const st={six:'out',init:'kneel',at:'centre',card:false,door:false,done:false};
  bs.forEach((b,i)=>{const w='beat '+(i+1);if(!b||!ACT_IDS.includes(b.act)){out.push(w+': unknown kind of beat.');return;}
   if(!keysOk(b,['act','wait',...BEAT_KEYS[b.act]])){out.push(w+': unknown fields for “'+b.act+'”.');return;}
   if(b.wait!=null&&!num(b.wait,...LIMIT.secs))out.push(w+': the pause before it is 0 to 60 seconds.');
   if(b.secs!=null&&!num(b.secs,.5,60))out.push(w+': it lasts 0.5 to 60 seconds.');
   if(b.speed!=null&&!num(b.speed,...LIMIT.speed))out.push(w+': the walking speed is '+LIMIT.speed[0]+' to '+LIMIT.speed[1]+' m/s.');
   const here=who=>who==='initiate'?st.init!=='out':who==='six'||who==='robed-all'||SIX.includes(who)?st.six==='circle':false;
   if(st.done&&!['pause','door'].includes(b.act)){out.push(w+': everyone has left; only a pause or the door can follow.');return;}
   switch(b.act){
    case 'pause':if(b.secs==null)out.push(w+': say how long the pause lasts.');break;
    case 'door':if(typeof b.open!=='boolean')out.push(w+': the door opens or closes.');else st.door=b.open;break;
    case 'enter':if(st.six!=='out')out.push(w+': the six are already in the room.');else st.six='circle';break;
    case 'turn':if(!WHO_TURN.includes(b.who))out.push(w+': choose who turns.');else if(!TO_TURN.includes(b.to))out.push(w+': choose what they turn to face.');else if(!here(b.who))out.push(w+': '+nameOf(b.who)+' '+(b.who==='six'?'are':'is')+' not in the room.');else if(b.who==='initiate'&&b.to==='initiate')out.push(w+': the initiate cannot face himself.');break;
    case 'line':if(!SPEAKERS.includes(b.who))out.push(w+': choose who speaks.');else if(!here(b.who))out.push(w+': '+nameOf(b.who)+' '+(b.who==='robed-all'?'are':'is')+' not in the room yet.');
     if(b.text!=null&&!plainText(b.text,LIMIT.text))out.push(w+': a line is plain text, '+LIMIT.text+' characters at most.');
     if(b.anim!=null){if(!ANIMS.includes(b.anim))out.push(w+': unknown animation.');else if(b.who==='initiate'&&st.init==='kneel')out.push(w+': the initiate is kneeling: he can speak but not play an animation.');}break;
    case 'rise':if(st.init!=='kneel')out.push(w+': the initiate is not kneeling.');else st.init='stand';break;
    case 'walk':if(!ACTORS.includes(b.who))out.push(w+': choose who walks.');else if(!TO_WALK.includes(b.to))out.push(w+': choose where to.');else if(b.who==='initiate'){if(st.init!=='stand')out.push(w+': the initiate must rise first.');else st.at=b.to==='spot'?'centre':b.to;}else if(st.six!=='circle')out.push(w+': the six are not in the room yet.');break;
    case 'card':if(st.at!=='altar')out.push(w+': the initiate must walk to the altar first.');else if(st.card)out.push(w+': the card is already taken.');else st.card=true;break;
    case 'anim':if(!(ACTORS.includes(b.who)||b.who==='six'))out.push(w+': choose who plays it.');else if(!ANIMS.includes(b.clip))out.push(w+': choose the animation.');else if(!here(b.who))out.push(w+': '+nameOf(b.who)+' '+(b.who==='six'?'are':'is')+' not in the room.');else if(b.who==='initiate'&&st.init==='kneel')out.push(w+': the initiate must rise first.');break;
    case 'exit':if(st.six!=='circle')out.push(w+': the six must enter first.');else if(st.init!=='stand')out.push(w+': the initiate must rise first.');else{st.six='out';st.init='out';st.done=true;}
     if(b.gap!=null&&!num(b.gap,...LIMIT.gap))out.push(w+': the gap in the line is '+LIMIT.gap[0]+' to '+LIMIT.gap[1]+' m.');break;}});
  return out;}
 /* ---- the timeline: beats -> one track per figure (segments) + events (door, lines, card). ---- */
 const S=ROOM.size/2,DOOR_IN=-S-.6,GONE=-S-ROOM.corridor.len+.3;
 // a polyline path: pts [[x,z],...] -> {pts, cum (arc length at each point), len}
 function poly(pts){const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return {pts,cum,len:cum[cum.length-1]};}
 function along(p,s){s=Math.max(0,Math.min(p.len,s));let i=1;while(i<p.pts.length-1&&p.cum[i]<s)i++;const a=p.pts[i-1],b=p.pts[i],seg=(p.cum[i]-p.cum[i-1])||1,t=(s-p.cum[i-1])/seg;return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,yaw:Math.atan2(b[0]-a[0],b[1]-a[1])};}
 // the heading at s, blended across corners (over `blend` metres) so a turn on the path is gradual, never a snap
 function heading(p,s,blend=.5){const a=along(p,Math.max(0,s-blend)).yaw,b=along(p,Math.min(p.len,s+blend)).yaw;return wrap(a+wrap(b-a)*.5);}
 // the circle arc from angle phi0 going round (phi decreasing) by `arc` radians, as points every 6 degrees
 function arcPts(r,phi0,arc){const out=[],n=Math.max(1,Math.ceil(arc/deg(6)));for(let i=1;i<=n;i++){const ph=phi0-arc*i/n;out.push([r*Math.sin(ph),r*Math.cos(ph)]);}return out;}
 /* The entry: walker k (0 leads) starts k gaps behind the leader at the doorway and walks the same path (in through the door, north to the circle, round it) at the same
    speed; the gap is one sixth of the circle, so all six reach their spots together. -> {gap, dur, paths:[{path, s0, s1}], spots} */
 function enterPlan(r=DEF.radius,v=DEF.speed){const g=lineGap(r),spots=circleSpots(6,r),back=-S-.6-5*g,p0=[0,-r];
  const path=poly([[0,back],[0,DOOR_IN],p0,...arcPts(r,Math.PI,deg(330))]),u0=path.cum[2]-0;   // u0: the arc length at the circle's south point
  const walkers=SIX.map((id,k)=>{const s0=5*g-k*g,target=u0+deg(330-60*k)*r;return {id,path,s0,s1:target};});   // walker k ends deg(30+60*(5-k)) round from the south point
  const dur=(walkers[0].s1-walkers[0].s0)/v;return {gap:g,dur,walkers,spots,speed:v};}
 /* The exit: the initiate walks from where he stands to the door and out; each of the six joins behind him, in order of where its spot meets his path (north first, then
    west before east at the same depth), stepping sideways onto the path just as its place in the line arrives. -> {order, init:{path,t0}, followers:[{id,path,t0}], dur} */
 function exitPlan(init,pos,r=DEF.radius,v=DEF.speed,g=DEF.gap){const ip=poly([[init.x,init.z],[0,DOOR_IN],[0,GONE-.5]]);
  const zr=id=>Math.round(pos[id].z*4)/4,ord=SIX.slice().sort((a,b)=>zr(b)-zr(a)||pos[a].x-pos[b].x);   // north first; at the same depth (to a quarter metre) west first
  const out=ord.map((id,j)=>{const p=pos[id],jz=Math.min(p.z,init.z),uJ=Math.max(0,init.z-jz)+Math.abs(init.x),side=Math.abs(p.x),path=poly([[p.x,p.z],[0,jz],[0,DOOR_IN],[0,GONE-.5]]);
   const tJ=(uJ+(j+1)*g)/v;return {id,path,t0:tJ-side/v,order:j+1};});
  const lead=Math.max(0,...out.map(f=>-f.t0));for(const f of out)f.t0+=lead;
  const dur=Math.max(ip.len/v+lead,...out.map(f=>f.t0+f.path.len/v));return {order:['initiate',...ord],init:{path:ip,t0:lead},followers:out,dur};}
 const lineSecs=b=>b.secs!=null?b.secs:b.text&&b.text.trim()?Math.max(2,Math.min(12,1.4+b.text.trim().length*.065)):LIMIT.lineDefault;
 /* Compile a scene into tracks. -> {problems, dur, tracks:{id:[seg]}, events:[{t, type, ...}], start:{id:{x,z,yaw,rest}}}. A segment: {t0, t1, type:'hold'|'turn'|'path'|'once'|'loop',
    x, z, yaw0, yaw1, path, s0, speed, clip, rest} and it leaves the figure in its end state {x, z, yaw, rest}. */
 function compile(scene){const sc=scene&&Array.isArray(scene.beats)?scene:defaultScene(),problems=sceneProblems(sc),R=sc.radius||DEF.radius,V=sc.speed||DEF.speed,spots=circleSpots(6,R);
  const tracks={},state={},events=[];let T=0,cardOn=false;
  const altarFront={x:ROOM.altar.x,z:ROOM.altar.z-ROOM.altar.d/2-.42};
  state.initiate={x:0,z:0,yaw:0,rest:'kneel',in:true};SIX.forEach((id,k)=>{state[id]={x:0,z:-S-4,yaw:0,rest:'stand',in:false,spot:spots[k]};});
  const start=JSON.parse(JSON.stringify(state));for(const id of ACTORS)tracks[id]=[];
  const push=(id,seg)=>{const st=state[id],s={...seg,rest:seg.rest||st.rest};delete s.end;Object.assign(st,seg.end||{});s.after={x:st.x,z:st.z,yaw:st.yaw,rest:st.rest,in:st.in};tracks[id].push(s);};
  const who=w=>w==='six'||w==='robed-all'?SIX:[w];
  const turnSeg=(id,t0,yaw1,secs)=>{const st=state[id],d=Math.abs(wrap(yaw1-st.yaw));if(d<.02)return 0;const dur=secs||Math.max(1.2,d/deg(45));push(id,{t0,t1:t0+dur,type:'turn',x:st.x,z:st.z,yaw0:st.yaw,yaw1:st.yaw+wrap(yaw1-st.yaw),clip:st.rest,end:{yaw:wrap(yaw1)}});return dur;};
  const target=(id,to)=>{const st=state[id];return to==='initiate'?yawTo(st.x,st.z,state.initiate.x,state.initiate.z):to==='owl'?0:to==='door'?Math.PI:yawTo(st.x,st.z,0,0);};
  for(const b of sc.beats){if(!b||!ACT_IDS.includes(b.act))continue;T+=num(b.wait,0,60)?b.wait:0;let d=0;
   if(b.act==='pause')d=num(b.secs,0,60)?b.secs:1;
   else if(b.act==='door'){d=DEF.door;events.push({t:T,type:'door',open:b.open!==false,dur:d});}
   else if(b.act==='enter'){const v=b.speed||V,pl=enterPlan(R,v);d=pl.dur;
    for(const w of pl.walkers){const st=state[w.id];st.in=true;push(w.id,{t0:T,t1:T+d,type:'path',path:w.path,s0:w.s0,s1:w.s1,speed:v,clip:'walk',end:(()=>{const e=along(w.path,w.s1);return {x:e.x,z:e.z,yaw:heading(w.path,w.s1),in:true,spot:{x:e.x,z:e.z}};})()});}}
   else if(b.act==='turn'){for(const id of b.who==='six'?SIX:[b.who]){if(!state[id].in)continue;d=Math.max(d,turnSeg(id,T,target(id,b.to),b.secs||DEF.turn)||0);}if(!d)d=b.secs||DEF.turn;}   // together: the same start, the same length
   else if(b.act==='line'){d=lineSecs(b);const ids=who(b.who);events.push({t:T,type:'line',who:b.who,text:String(b.text||'').trim(),...(b.anim?{anim:b.anim}:{}),dur:d});
    if(b.anim){for(const id of ids){const st=state[id];if(!st.in||st.rest==='kneel')continue;push(id,{t0:T,t1:T+d,type:ONCE.includes(b.anim)?'once':'loop',x:st.x,z:st.z,yaw0:st.yaw,clip:b.anim});}}}
   else if(b.act==='rise'){const st=state.initiate;if(st.rest==='kneel'){d=DEF.rise;push('initiate',{t0:T,t1:T+d,type:'once',x:st.x,z:st.z,yaw0:st.yaw,clip:'rise',rest:'kneel',end:{rest:'stand'}});}}
   else if(b.act==='walk'){const id=ACTORS.includes(b.who)?b.who:'initiate',st=state[id],v=b.speed||V,to=b.to==='altar'?altarFront:b.to==='spot'&&st.spot?st.spot:{x:0,z:0};
    if(Math.hypot(to.x-st.x,to.z-st.z)>.05){const p=poly([[st.x,st.z],[to.x,to.z]]),pre=turnSeg(id,T,p.len?Math.atan2(to.x-st.x,to.z-st.z):st.yaw,null);push(id,{t0:T+pre,t1:T+pre+p.len/v,type:'path',path:p,s0:0,s1:p.len,speed:v,clip:'walk',end:{x:to.x,z:to.z,yaw:Math.atan2(to.x-st.x,to.z-st.z)}});d=pre+p.len/v;
     if(b.to==='altar'){d+=turnSeg(id,T+d,0,1.6);}}}
   else if(b.act==='card'){d=DEF.card;events.push({t:T,type:'box',open:true},{t:T+d*.55,type:'card',on:true});cardOn=true;const st=state.initiate;push('initiate',{t0:T,t1:T+d,type:'loop',x:st.x,z:st.z,yaw0:st.yaw,clip:'stand'});}
   else if(b.act==='anim'){d=b.secs||3;for(const id of b.who==='six'?SIX:[b.who]){const st=state[id];if(!st.in)continue;push(id,{t0:T,t1:T+d,type:ONCE.includes(b.clip)?'once':'loop',x:st.x,z:st.z,yaw0:st.yaw,clip:b.clip});}}
   else if(b.act==='exit'){const v=b.speed||V,g=b.gap||DEF.gap,ini=state.initiate,pos={};for(const id of SIX)pos[id]={x:state[id].x,z:state[id].z};const pl=exitPlan(ini,pos,R,v,g);
    const pre=turnSeg('initiate',T,yawTo(ini.x,ini.z,0,DOOR_IN),3)||0;
    const t0i=T+pre+pl.init.t0;push('initiate',{t0:t0i,t1:t0i+pl.init.path.len/v,type:'path',path:pl.init.path,s0:0,s1:pl.init.path.len,speed:v,clip:'walk',end:{x:0,z:GONE-.5,in:false}});
    let end=t0i+pl.init.path.len/v;
    for(const f of pl.followers){const st=state[f.id],t0=T+pre+f.t0,first=Math.atan2(f.path.pts[1][0]-st.x,f.path.pts[1][1]-st.z);const tp=turnSeg(f.id,Math.max(T,t0-2.4),first,Math.min(2.4,Math.max(1.2,t0-T)));
     push(f.id,{t0,t1:t0+f.path.len/v,type:'path',path:f.path,s0:0,s1:f.path.len,speed:v,clip:'walk',end:{x:0,z:GONE-.5,in:false}});end=Math.max(end,t0+f.path.len/v);void tp;}
    d=end-T;events.push({t:T,type:'order',order:pl.order});}
   T+=d;}
  for(const id of ACTORS)tracks[id].sort((a,b)=>a.t0-b.t0);
  return {problems,dur:r2(T),tracks,events:events.sort((a,b)=>a.t-b.t),start,radius:R,speed:V};}
 /* Where a figure is at time t: {x, z, yaw, clip, clipT (seconds into the clip), rate, visible}. */
 function poseAt(cs,id,t){const st=cs.start[id],segs=cs.tracks[id]||[];let cur={x:st.x,z:st.z,yaw:st.yaw,rest:st.rest,in:st.in};
  for(const s of segs){if(t<s.t0)break;if(t>s.t1){cur=s.after;continue;}const k=s.t1>s.t0?(t-s.t0)/(s.t1-s.t0):1,local=t-s.t0;
   if(s.type==='path'){const sp=s.s0+(s.s1-s.s0)*k,p=along(s.path,sp);return {x:p.x,z:p.z,yaw:heading(s.path,sp),clip:'walk',clipT:local,rate:s.speed/STRIDE,visible:p.z>GONE};}
   if(s.type==='turn'){const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;return {x:s.x,z:s.z,yaw:wrap(s.yaw0+(s.yaw1-s.yaw0)*e),clip:s.clip||cur.rest,clipT:t,rate:1,visible:true};}
   return {x:s.x,z:s.z,yaw:cur.yaw,clip:s.clip,clipT:local,rate:1,once:s.type==='once',visible:true};}
  return {x:cur.x,z:cur.z,yaw:cur.yaw,clip:cur.rest,clipT:t,rate:1,visible:!!cur.in&&cur.z>GONE};}
 /* The lines a recording shows at time t (empty words: nothing). */
 const lineAt=(cs,t)=>cs.events.filter(e=>e.type==='line'&&t>=e.t&&t<e.t+e.dur&&e.text).map(e=>({who:e.who,name:NAMES[e.who]||e.who,text:e.text}));
 const doorAt=(cs,t)=>{let open=0;for(const e of cs.events){if(e.type!=='door'||e.t>t)continue;const k=Math.min(1,(t-e.t)/e.dur);open=e.open?k:1-k;}return open;};
 /* ---- mission data ---- */
 const FEED_ID=/^[a-z][a-z0-9-]{0,23}$/,LIMIT_FEEDS=4;
 function feedProblems(m){const out=[],fs=m&&m.feeds;const ids=new Set();
  if(fs!=null){if(!Array.isArray(fs)||fs.length>LIMIT_FEEDS)return ['a mission has at most '+LIMIT_FEEDS+' camera feeds.'];
   for(const f of fs){if(!keysOk(f,['id','room','scene'])||!FEED_ID.test(f.id||'')){out.push('a camera feed needs a short name (letters, digits, hyphens).');continue;}if(ids.has(f.id))out.push('two camera feeds are both called “'+f.id+'”.');ids.add(f.id);
    if(!FEED_ROOMS.some(r=>r.id===f.room))out.push('camera feed “'+f.id+'”: choose the room it shows.');if(f.scene!=null)for(const p of sceneProblems(f.scene))out.push('camera feed “'+f.id+'”: '+p);}}
  for(const o of (m&&m.objectives)||[]){if(!o||o.feed==null)continue;if(o.kind!=='hack'&&o.kind!=='feed')out.push('step '+o.id+': only a “hack the access point” or a “watch a remote camera feed” step shows a camera feed.');else if(!ids.has(o.feed))out.push('step '+o.id+': choose one of this mission’s camera feeds.');}
  return out;}
 const strip=fs=>Array.isArray(fs)&&fs.length?JSON.parse(JSON.stringify(fs)).map(f=>({id:f.id,room:f.room,...(f.scene?{scene:f.scene}:{})})):null;
 function addFeed(m,room=ROOM.id){const ids=new Set((m.feeds||[]).map(f=>f.id));let n=1;while(ids.has('cam'+n))n++;const f={id:'cam'+n,room,scene:defaultScene()};return {feeds:[...(m.feeds||[]),f],id:f.id};}
 function inventory(){return {rooms:FEED_ROOMS.map(r=>r.id),speakers:SPEAKERS.slice(),actors:ACTORS.slice(),acts:ACT_IDS.slice(),beatKeys:JSON.parse(JSON.stringify(BEAT_KEYS)),anims:ANIMS.slice(),turnWho:WHO_TURN.slice(),turnTo:TO_TURN.slice(),walkTo:TO_WALK.slice(),limit:{beats:LIMIT.beats,text:LIMIT.text,feeds:LIMIT_FEEDS,secs:LIMIT.secs.slice(),speed:LIMIT.speed.slice(),radius:LIMIT.radius.slice(),gap:LIMIT.gap.slice()}};}
 const api={CHORUS,GONE,DOOR_IN,ROOM,FEED_ROOMS,SIX,ACTORS,SPEAKERS,NAMES,ACTS,ACT_IDS,CLIPS,ANIMS,ONCE,STRIDE,LIMIT,DEF,WHO_TURN,TO_TURN,TO_WALK,BEAT_KEYS,LIMIT_FEEDS,
  circleSpots,lineGap,enterPlan,exitPlan,defaultScene,sceneProblems,compile,poseAt,lineAt,doorAt,lineSecs,voiceText,feedProblems,strip,addFeed,inventory,poly,along,wrap,nameOf};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.VoidCultRoom=api;
})(typeof globalThis!=='undefined'?globalThis:this);
