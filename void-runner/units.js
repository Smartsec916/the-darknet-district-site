/* DISTANCES SHOWN IN FEET (the owner, 20 Nov 2026: "can you change the distances to feet instead of meters"). Display only: the game, saves, mission data, the server and
   the tests keep METRES everywhere; only what the owner and the players read changes. Pure (browser global VoidUnits and Node module); loaded first in void-runner.html.
   fmtDist(m): "144 ft", "1,250 ft", from one mile (5,280 ft) "1.2 mi" (on foot short, long walks / rides in miles). Flight keeps its own game unit ("u").
   Editors: ft(m) is the whole number of feet an input shows; m(feet, oldMetres, {min, max, whole}) the metres to store: the old value unchanged when the field still shows
   it (nothing drifts), else feet / 3.28084 rounded to 3 decimals (whole metres where the stored form must be a whole number), kept inside the metre limits.
   ftRange(minM, maxM): an input's limits in whole feet that stay inside the metre limits. text(s): rewrites "1 to 30 metres", "15 m" … in a message into feet. */
(function(root){
 'use strict';
 const FT=3.28084,MILE=5280;
 const num=v=>typeof v==='string'&&v.trim()!==''?Number(v):v;
 const group=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
 const toFeet=m=>Number(m)*FT;
 const fromFeet=f=>Math.round(Number(f)/FT*1000)/1000;
 const ft=m=>{const n=num(m);return typeof n==='number'&&Number.isFinite(n)?Math.round(n*FT):NaN;};
 /* Feet (whole, comma grouping) up to a mile, then miles: one decimal under 10 mi, whole above. {miles:false}: always feet. */
 function fmtDist(m,{miles=true}={}){const n=num(m);if(typeof n!=='number'||!Number.isFinite(n))return '';const f=Math.abs(n)*FT,s=n<0?'-':'';
  if(miles&&Math.round(f)>=MILE){const mi=f/MILE;return s+(mi<9.95?mi.toFixed(1):group(Math.round(mi)))+' mi';}
  return s+group(Math.round(f))+' ft';}
 function m(feet,old,{min=-Infinity,max=Infinity,whole=false}={}){const f=num(feet),o=num(old);if(typeof f!=='number'||!Number.isFinite(f))return typeof o==='number'&&Number.isFinite(o)?o:undefined;
  if(typeof o==='number'&&Number.isFinite(o)&&ft(o)===f)return o;
  const v=whole?Math.round(f/FT):fromFeet(f);return Math.min(max,Math.max(min,v));}
 const ftRange=(minM,maxM)=>[Math.ceil(minM*FT-1e-9),Math.floor(maxM*FT+1e-9)];
 /* Messages written in metres (validators, the server's answers): "1 to 30 metres" -> "4 to 98 ft", "15 m" / "15 metres" -> "49 ft"; "m/s" and wording without a number ("x is a number of metres": coordinates stay metres) are left alone. */
 function text(s){if(typeof s!=='string')return s;
  return s.replace(/(?:a )?whole number of metres from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)/g,(_,a,b)=>{const r=ftRange(+a,+b);return 'from '+group(r[0])+' to '+group(r[1])+' ft';}).replace(/(\d+(?:\.\d+)?) to (\d+(?:\.\d+)?) (?:metres|meters|m)\b(?!\/)/g,(_,a,b)=>{const r=ftRange(+a,+b);return group(r[0])+' to '+group(r[1])+' ft';})
   .replace(/(\d+(?:\.\d+)?) ?(?:metres|meters|metre|m)\b(?!\/)/g,(_,a)=>fmtDist(+a,{miles:false}));}
 const api={FT,MILE,toFeet,fromFeet,ft,m,ftRange,fmtDist,text,unit:'ft'};
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.VoidUnits=api;
})(typeof globalThis!=='undefined'?globalThis:this);
