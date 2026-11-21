/* ROOK'S PROCEDURAL CARGO JOBS (21 Nov 2026). The owner: "For Rook after this make cargo missions Procedural".
   After Mission 012 (First Cargo Delivery, story flag rook-first-delivery-done) Rook's side-mission board in a District campaign is generated here.
   Pure rules (browser and Node): no randomness except the player's seed, so the same save always shows the same board.
    - Seed: story.flags.rookSeed (a safe integer the cloud save accepts). A new District campaign gets a random one (campaign.js startDistrictCampaign);
      a save without one gets a seed derived from the save (seedOf), written once on load (campaign.js restore), so a reload never rerolls.
    - Refresh: the board is seeded by the seed and the run number (story.flags.rookRuns + 1), so every finished run brings a new board.
    - Each slot is one kind of rook-cargo-jobs.js districtBoard (the owner's kinds, in his order): its destination (only places the campaign passes in:
      known, reachable, never the `never` list; a far kind only another system), its goods and how many containers (their weight sets the hold spaces,
      never more than the ship holds), and its pay (rook-cargo-jobs.js pay for the run number + the kind's bonus, scaled by distance, with a little variety).
    - Titles and cargo wording come from rook-cargo-jobs.js procedural lists: flavour text only, no new lore.
   An accepted job keeps its terms in story.flags.rookTerms (encode/decode: 'units|credits|kg|cargo|title', at most 200 characters), so editing the lists
   later never changes a job already aboard. */
(function(root){
 'use strict';
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const RC=typeof module!=='undefined'?require('./rook-cargo-jobs.js'):root.VoidRookCargoJobs;
 const ORIGIN='meridian',MAX=2147483646,MAX_PAY=999999;
 // FNV-1a: a stable 32-bit hash of a string.
 function hash(text){let h=2166136261>>>0;for(const c of String(text)){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
 // mulberry32: a small seeded random number generator, values in [0,1).
 function rng(seed){let a=(seed>>>0)||1;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
 const validSeed=v=>Number.isSafeInteger(v)&&v>=1&&v<=MAX;
 // The player's seed: the saved one, or one derived from the save (the V1's device serial when it has one).
 function seedOf(s){const f=s?.story?.flags||{};if(validSeed(f.rookSeed))return f.rookSeed;return 1+hash('rook-seed:'+String(f.deviceSerial||''))%MAX;}
 function freshSeed(random=Math.random){return 1+Math.floor(random()*MAX)%MAX;}
 // How far a place is from Meridian, as a pay factor (rook-cargo-jobs.js procedural.distance) and plain tags.
 function distance(to,from=ORIGIN){
  const D=RC.procedural.distance,sys=U.systems[U.system(to)],tags=[];let factor=1;
  if(U.planetside(to)){factor+=D.landing;tags.push('landing');}
  if(U.system(to)!==U.system(from)){factor+=D.interstellar;tags.push('interstellar');}
  if(sys?.ownerFaction){factor+=D.faction;tags.push('faction');}
  return {factor,tags};
 }
 // The pay before distance and variety: the run number's base (capped) plus the kind's bonus (the older board's formula).
 function basePay(number,kind){const p=RC.pay,j=RC.jobs[kind]||{bonus:0};return Math.min(p.cap,p.base+p.perRun*Math.min(Math.max(0,number-1),p.steps))+(j.bonus||0);}
 // The lowest and highest pay a kind can be offered for a run (for tests and balancing).
 function payBounds(number,kind,capacity=2){
  const P=RC.procedural,D=P.distance,j=RC.jobs[kind]||{units:1},base=basePay(number,kind),extra=Math.max(0,capacity-(j.units||1));
  return {min:Math.floor(base*(1-P.variance)/10)*10,max:Math.ceil(base*(1+D.landing+D.interstellar+D.faction)*(1+extra*P.extraSpace)*(1+P.variance)/10)*10};
 }
 function pick(r,list){return list[Math.floor(r()*list.length)%list.length];}
 function weighted(r,items){const total=items.reduce((n,x)=>n+x.w,0);let t=r()*total;for(const x of items){t-=x.w;if(t<0)return x.v;}return items[items.length-1].v;}
 /* The board. seed, number: the run; kinds: the slots (rook-cargo-jobs.js districtBoard); pool: the places Rook may send freight to (the campaign filters
    them: known, reachable, not `never`); capacity: the ship's hold spaces; served: systems Rook's runs already reached (new ones are a little likelier). */
 function board({seed,number,kinds,pool,capacity=2,served=[]}){
  const P=RC.procedural,out=[],used=new Set(),home=U.system(ORIGIN);
  for(const [slot,kind] of (kinds||[]).entries()){
   const job=RC.jobs[kind];if(!job)continue;
   const list=(pool||[]).filter(id=>id!==ORIGIN&&!RC.never.includes(id)&&Object.hasOwn(U.locations,id)&&(!job.far||U.system(id)!==home));if(!list.length)continue;
   const r=rng(hash(seed+':'+number+':'+slot+':'+kind)),fresh=list.filter(id=>!used.has(id));
   // A quiet job prefers the local lanes, a dangerous one the far ones; a system Rook has not run to yet is likelier.
   const destination=weighted(r,(fresh.length?fresh:list).map(id=>({v:id,w:(U.system(id)===home?(job.danger?1:3):(job.danger>=3?2:1))*(served.includes(U.system(id))?1:2)})));used.add(destination);
   const goods=pick(r,P.goods.filter(g=>!job.valueGoods||g.value).length?P.goods.filter(g=>!job.valueGoods||g.value):P.goods);
   const room=Math.max(job.units||1,capacity||1);
   let quantity=goods.min+Math.floor(r()*(goods.max-goods.min+1));quantity=Math.max(1,Math.min(quantity,Math.floor(room*P.holdKg/goods.kg)));
   const weightKg=quantity*goods.kg,units=Math.min(room,Math.max(job.units||1,Math.ceil(weightKg/P.holdKg)));
   const d=distance(destination),variety=1+(r()*2-1)*P.variance,extra=1+Math.max(0,units-(job.units||1))*P.extraSpace;
   const payment=Math.max(10,Math.min(MAX_PAY,Math.round(basePay(number,kind)*d.factor*extra*variety/10)*10));
   const title=pick(r,P.titles.first)+' '+pick(r,P.titles.trip);
   out.push({slot,kind,destination,cargo:quantity+' '+(quantity===1?goods.container.replace(/(es|s)$/,''):goods.container)+' of '+goods.name,quantity,goods:goods.name,weightKg,units,payment,title,distance:d.tags});
  }
  return out;
 }
 // An accepted job's terms in one story flag (cloud saves accept strings up to 200 characters).
 const clean=t=>String(t||'').replace(/[|\r\n]/g,' ').slice(0,80);
 function encode(job){const text=[job.units,job.payment,job.weightKg||0,clean(job.cargo),clean(job.title)].join('|');return text.slice(0,200);}
 function decode(text){
  const m=/^([1-9])\|(\d{1,6})\|(\d{1,6})\|([^|]{1,80})\|([^|]{0,80})$/.exec(String(text||''));if(!m)return null;
  const payment=Number(m[2]);if(payment<1)return null;
  return {units:Number(m[1]),payment,weightKg:Number(m[3]),cargo:m[4],title:m[5]||undefined};
 }
 const api={ORIGIN,MAX,hash,rng,validSeed,seedOf,freshSeed,distance,basePay,payBounds,board,encode,decode};
 if(typeof module!=='undefined')module.exports=api;else root.VoidRookCargoGen=api;
})(globalThis);
