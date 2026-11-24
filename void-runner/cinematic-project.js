/* Portable, private edit decision list. Times are seconds and positions are in game metres. */
(function(root){
 'use strict';
 const tracks=['Camera','Movement','Animation','Dialogue','Music','Sound effects','Lighting','Environment','Text','Transition'];
 const modes=['Tracking','Fixed','Free','First person','Third person','Orbit','Follow NPC','Follow player','Security camera','Hacked camera'];
 const places=['District store set','Arcade set','Meridian Station','Blackrock camera feed','Kestrel spacecraft','Corporate District','Zen Zephyr Temple','Milked reception','Gameplay tab'];
 const actors=['none','saved-player','district-resident','npc-admin','npc-iris','npc-fish','npc-hacker','npc-blackrock-robe'];
 const presets={resolution:[720,1080,1440,2160],aspect:['16:9','9:16','1:1'],fps:[30,60]};
 const base={Camera:{mode:'Tracking',x:2,y:2,z:-5,toX:-2,toY:2,toZ:-4,targetX:0,targetY:1,targetZ:0,yaw:0,pitch:0,fov:52,zoom:1,shake:0,easing:'Smooth',focus:0},
  Movement:{x:-1,y:0,z:0,toX:1,toY:0,toZ:0},Animation:{clip:'idle'},Dialogue:{src:'',volume:1,offset:0},Music:{src:'',volume:.6,offset:0},'Sound effects':{src:'',volume:1,offset:0},
  Lighting:{brightness:1,color:'#cbdcff'},Environment:{fog:0,color:'#172e38'},Text:{text:'',color:'#ffffff'},Transition:{kind:'Fade in',color:'#000000'}};
 function clip(track,start=0,duration=3){return {id:'c-'+root.crypto.randomUUID().slice(0,12),track,start,duration,...base[track]};}
 function fresh(){return {name:'District trailer',place:places[0],actor:'none',hour:21,resolution:720,aspect:'16:9',fps:30,clips:[clip('Camera',0,4)]};}
 function dimensions(resolution,aspect){const wide=Math.round(resolution*16/9/2)*2;return aspect==='1:1'?[resolution,resolution]:aspect==='9:16'?[resolution,wide]:[wide,resolution];}
 const span=p=>p.clips.reduce((n,c)=>Math.max(n,c.start+c.duration),0);
 const on=(p,track,t)=>p.clips.filter(c=>c.track===track&&c.start<=t&&t<c.start+c.duration).sort((a,b)=>a.start-b.start);
 function camera(c,t){
  let k=Math.min(1,Math.max(0,(t-c.start)/c.duration));if(c.easing==='Smooth')k=k*k*(3-2*k);
  if(c.mode==='Fixed'||c.mode==='Security camera'||c.mode==='Hacked camera')k=0;
  const mix=(a,b)=>a+(b-a)*k;return [mix(c.x,c.toX),mix(c.y,c.toY),mix(c.z,c.toZ)];
 }
 function validate(p){
  const okName=x=>typeof x==='string'&&x.length<=140;
  if(!p||!okName(p.name)||!p.name.trim()||!places.includes(p.place)||!actors.includes(p.actor)||Object.entries(presets).some(([k,v])=>!v.includes(p[k]))||!Array.isArray(p.clips)||p.clips.length>240)return 'Invalid cinematic project.';
  if(p.hour!=null&&(!Number.isInteger(p.hour)||p.hour<0||p.hour>=24))return 'Choose an hour from 0 to 23.';
  if(p.feed!=null&&(p.place!=='Blackrock camera feed'||typeof p.feed!=='string'||!/^[-a-zA-Z0-9_:/]{1,140}$/.test(p.feed)))return 'Choose a valid mission feed.';
  const ids=new Set();
  for(const c of p.clips){
   if(!c||typeof c.id!=='string'||!/^c-[a-z0-9-]{1,48}$/.test(c.id)||ids.has(c.id)||!tracks.includes(c.track))return 'Invalid or duplicate clip.';
   ids.add(c.id);
   if(!Number.isFinite(c.start)||c.start<0||!Number.isFinite(c.duration)||c.duration<.05||c.start+c.duration>600)return 'Clips must fit within ten minutes.';
   const allowed=new Set(['id','track','start','duration',...Object.keys(base[c.track])]);
   if(Object.keys(c).some(k=>!allowed.has(k)))return 'Unknown clip setting.';
   for(const [key,def] of Object.entries(base[c.track])){const v=c[key];if(typeof v!==typeof def||(typeof v==='number'&&(!Number.isFinite(v)||Math.abs(v)>5000))||(typeof v==='string'&&v.length>240))return 'Invalid '+key+'.';}
   if(c.mode&&!modes.includes(c.mode)||c.easing&&!['Linear','Smooth'].includes(c.easing)||c.kind&&!['Fade in','Fade out'].includes(c.kind))return 'Unknown shot option.';
   if(c.color&&!/^#[a-f0-9]{6}$/i.test(c.color))return 'Choose a valid color.';
   if('src' in c&&c.src&&!/^assets\/audio\/[\w/-]+\.(ogg|mp3|m4a|wav)$/.test(c.src)&&!/^[a-f0-9]{64}$/.test(c.src))return 'Choose a game recording.';
   for(const [k,lo,hi] of [['zoom',.1,12],['fov',10,145],['focus',0,300],['shake',0,1],['volume',0,1],['offset',0,7200],['brightness',0,4],['fog',0,.2]])if(k in c&&(c[k]<lo||c[k]>hi))return 'Invalid '+k+'.';
  }
  return '';
 }
 function formats(withSound=false){if(!root.MediaRecorder||!root.HTMLCanvasElement?.prototype.captureStream)return [];
  const audio=withSound?',opus':'';
  return ['video/webm;codecs=vp9'+audio,'video/webm;codecs=vp8'+audio,'video/webm','video/mp4;codecs=avc1.42E01E'+(withSound?',mp4a.40.2':''),'video/mp4'].filter(t=>MediaRecorder.isTypeSupported(t));}
 const api={tracks,modes,places,actors,presets,base,clip,fresh,dimensions,span,on,camera,validate,formats};if(typeof module!=='undefined')module.exports=api;else root.VoidCinema=api;
})(globalThis);
