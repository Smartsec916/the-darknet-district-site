/* The Relay: the in-universe broadcast network, heard as a station on the ship and station radio
   (David's Option D, phase 1; station screens come later). Rules only: which segment plays next,
   where it can be heard, and when it must give way. Mission dialogue and combat always take
   priority, and nothing plays inside The Darknet District's protected premises. The scripts are
   David's, in relay-content.json; relay-radio.js plays them. */
(function(root){
 'use strict';
 const config={gapMin:5,gapMax:11,resumeHold:3,retry:8,history:6,wordsPerSecond:2.6};
 const kinds={
  news:{speaker:'news-anchor'},breaking:{speaker:'news-anchor'},public:{speaker:'news-anchor'},station:{},ad:{},
  police:{speaker:'police-recruiter'},warflying:{speaker:'warflying-host'},
  communion:{speaker:'communion-spokesperson',systems:['communion']},
  'natural-order':{speaker:'natural-order-spokesperson',systems:['natural-order']},
  // The Function is Tessaly's corporate government; its broadcasts stay in Tessaly space.
  function:{speaker:'the-function',systems:['sol']}
 };
 const labels={news:'NEWS',breaking:'BREAKING',public:'PUBLIC INFORMATION',station:'STATION NOTICE',ad:'ADVERTISEMENT',police:'RECRUITMENT',warflying:'WARFLYING',communion:'THE COMMUNION','natural-order':'THE NATURAL ORDER',function:'THE FUNCTION'};
 const systemIds=['erebus','sol','communion','natural-order'];
 // Returns problems with the content file; an empty list means it is safe to broadcast.
 function validate(content){
  const problems=[],ids=new Set();
  for(const s of content?.segments||[]){
   const where=s?.id||'(no id)';
   if(!/^[a-z][a-z0-9-]{0,63}$/.test(s?.id||''))problems.push(where+': bad id');else if(ids.has(s.id))problems.push(where+': duplicate id');ids.add(s?.id);
   if(!kinds[s?.kind])problems.push(where+': unknown kind '+s?.kind);
   if(!speakerOf(s))problems.push(where+': needs a speaker');
   if(typeof s?.text!=='string'||!s.text.trim()||s.text.length>600)problems.push(where+': text missing or too long');
   if(s?.systems&&(!Array.isArray(s.systems)||s.systems.some(x=>!systemIds.includes(x))))problems.push(where+': unknown system');
  }
  return problems;
 }
 function speakerOf(s){return s?.speaker||kinds[s?.kind]?.speaker||null;}
 function systemsOf(s){return s.systems||kinds[s.kind]?.systems||systemIds;}
 function eligible(segments,ctx){return (segments||[]).filter(s=>kinds[s.kind]&&s.text&&systemsOf(s).includes(ctx.system)&&(!s.when||!ctx.matches||ctx.matches(s.when)));}
 // Rough on-air length for a segment without a recording (subtitles only).
 function readTime(s){return 1.5+String(s.text).split(/\s+/).length/config.wordsPerSecond;}
 function create(){return {state:'idle',segment:null,interrupted:null,timer:1.5,history:[]};}
 function pick(r,list,rng){
  if(!list.length)return null;
  const fresh=list.filter(s=>!r.history.includes(s.id));
  const breaking=fresh.filter(s=>s.kind==='breaking');
  const pool=breaking.length?breaking:fresh.length?fresh:list.filter(s=>s.id!==r.history[r.history.length-1]);
  const from=pool.length?pool:list;return from[Math.floor(rng()*from.length)%from.length];
 }
 // ctx: {on, system, protected, priority, ended, matches}. Returns an action or null:
 // {type:'play',segment} | {type:'stop',reason}
 function step(r,dt,ctx,segments,rng=Math.random){
  const playing=r.state==='playing';
  if(!ctx.on||ctx.protected){r.state='idle';r.timer=1.5;r.interrupted=null;r.segment=null;return playing?{type:'stop',reason:ctx.on?'protected':'off'}:null;}
  if(ctx.priority){
   // Give way at once; the interrupted segment comes back after a short hold.
   if(playing){r.interrupted=r.segment;r.segment=null;}r.state='held';r.timer=config.resumeHold;
   return playing?{type:'stop',reason:'priority'}:null;
  }
  if(playing){if(ctx.ended){r.state='gap';r.segment=null;r.timer=config.gapMin+rng()*(config.gapMax-config.gapMin);}return null;}
  r.timer-=dt;if(r.timer>0)return null;
  const list=eligible(segments,ctx);
  const next=r.interrupted&&list.some(s=>s.id===r.interrupted.id)?r.interrupted:pick(r,list,rng);r.interrupted=null;
  if(!next){r.state='idle';r.timer=config.retry;return null;}
  r.state='playing';r.segment=next;r.history=[...r.history.filter(id=>id!==next.id),next.id].slice(-config.history);
  return {type:'play',segment:next};
 }
 const api={config,kinds,labels,systemIds,validate,speakerOf,systemsOf,eligible,readTime,create,step};
 if(typeof module!=='undefined')module.exports=api;else root.VoidRelay=api;
})(globalThis);
