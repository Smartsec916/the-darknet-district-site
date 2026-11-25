/* Developer studios (consumables, sound library, ad playlists, cinematic shots, skirmish practice).
   Pure rules run in Node. The browser adds the SHOP HERE counter, a developer tab, and a sprint multiplier.
   Nothing here writes the music player, the Sleeping Pod room, or a new multiplayer service. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const PRESETS=[
  {id:'sprint',name:'Sprint tonic',price:40,help:'You move faster for 90 seconds. Buying it again refreshes the time. It does not stack.',stat:'sprint',amount:.2,seconds:90},
  {id:'tint',name:'Street tint',price:15,help:'A light color wash for 60 seconds. Reduced motion leaves it off.',stat:'tint',amount:.2,seconds:60}
 ];
 const CAPS={sprint:.25,tint:.2};
 const byId=id=>PRESETS.find(p=>p.id===id)||null;
 function buy(credits,flag,id,now){const p=byId(id);if(!p)return {ok:false,why:'That item is not for sale.'};
  if(!Number.isInteger(credits)||credits<p.price)return {ok:false,why:'Not enough credits.'};
  if(!Number.isFinite(now))return {ok:false,why:'The clock has no time.'};
  const amount=Math.min(CAPS[p.stat],p.amount),until=Math.round(now+p.seconds);
  return {ok:true,credits:credits-p.price,flag:p.stat+':'+amount+':'+until,stat:p.stat,amount,until};}
 function read(flag,now){if(typeof flag!=='string')return null;const [stat,a,e]=flag.split(':'),amount=Number(a),until=Number(e);
  if(!CAPS[stat]||!(amount>0)||!(until>now))return null;return {stat,amount:Math.min(CAPS[stat],amount),until};}
 function moveMul(flag,now){const r=read(flag,now);return r&&r.stat==='sprint'?1+r.amount:1;}
 function playlistProblems(spec,known){if(spec==null)return [];if(!spec||typeof spec!=='object'||Array.isArray(spec))return ['A playlist has an unknown shape.'];
  const keys=['id','order','ids','location'];if(Object.keys(spec).some(k=>!keys.includes(k)))return ['A playlist has unknown fields.'];
  const out=[];if(typeof spec.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(spec.id))out.push('The playlist id uses lowercase letters, numbers and hyphens.');
  if(spec.order!=='ordered'&&spec.order!=='shuffle')out.push('The order is “ordered” or “shuffle”.');
  if(!Array.isArray(spec.ids)||spec.ids.length<1||spec.ids.length>12||spec.ids.some(id=>typeof id!=='string'||!(known||[]).includes(id)))out.push('Choose 1 to 12 existing ads.');
  if(spec.location!=null&&(typeof spec.location!=='string'||spec.location.length>40))out.push('The location name is too long.');
  return out;}
 function filterProgramme(slots,spec){if(!spec||!Array.isArray(spec.ids)||!spec.ids.length||!Array.isArray(slots))return slots||[];
  const allow=new Set(spec.ids),ads=slots.filter(s=>s&&s.type==='ad'&&s.ad&&allow.has(s.ad.id));if(!ads.length)return slots;
  const ordered=spec.order==='ordered'?spec.ids.map(id=>ads.find(s=>s.ad.id===id)).filter(Boolean):ads;
  const out=[];ordered.forEach((ad,i)=>{out.push(ad);if(i%4===3)out.push({type:'break',n:out.length});});return out;}
 function soundLibrary(score){const styles=score&&score.styles||{},files=score&&score.files||{};
  return Object.keys(styles).sort().map(id=>({id,mood:String(styles[id].mood||''),file:files[id]||null,gain:styles[id].gain}));}
 function mixProblems(mix){if(mix==null)return [];if(!mix||typeof mix!=='object')return ['A mix has an unknown shape.'];
  const out=[];for(const k of ['music','ambient','effects','dialogue']){if(mix[k]!=null&&!(typeof mix[k]==='number'&&mix[k]>=0&&mix[k]<=1))out.push(k+' is a level from 0 to 1.');}return out;}
 function shotProblems(s){if(!s||typeof s!=='object')return ['A shot has an unknown shape.'];
  const out=[];if(typeof s.id!=='string'||!/^[a-z0-9-]{1,40}$/.test(s.id))out.push('The shot id uses lowercase letters, numbers and hyphens.');
  if(typeof s.place!=='string'||!s.place||s.place.length>60)out.push('Pick a place.');
  if(!(typeof s.x==='number'&&Number.isFinite(s.x)&&Math.abs(s.x)<=400&&typeof s.z==='number'&&Number.isFinite(s.z)&&Math.abs(s.z)<=400))out.push('The spot is inside the map.');
  if(!(typeof s.yaw==='number'&&Number.isFinite(s.yaw)))out.push('The facing is a number.');
  if(typeof s.hideHud!=='boolean')out.push('Hide HUD is on or off.');
  return out;}
 function practice(o){if(o&&o.network)return {ok:false,why:'A shared skirmish lobby is not on this service. Practice on this machine does not spend credits or change your campaign.'};
  if(o&&o.difficulty!=null&&!['easy','normal','hard'].includes(o.difficulty))return {ok:false,why:'Difficulty is easy, normal or hard.'};
  return {ok:true,credits:false,campaign:false};}
 const KEY='vr-studio-playlist';
 function activePlaylist(){try{const raw=root.sessionStorage?.getItem(KEY);if(!raw)return null;const spec=JSON.parse(raw);return playlistProblems(spec).length?null:spec;}catch{return null;}}
 function savePlaylist(spec){const why=playlistProblems(spec);if(why.length)return why;try{root.sessionStorage.setItem(KEY,JSON.stringify(spec));}catch{}return [];}
 const api={PRESETS,CAPS,buy,read,moveMul,playlistProblems,filterProgramme,soundLibrary,mixProblems,shotProblems,practice,activePlaylist,savePlaylist,KEY};
 if(node){module.exports=api;return;}
 root.VoidDevStudios=api;
 const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 function tint(on){const reduce=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;document.documentElement.classList.toggle('shop-tint',!!on&&!reduce);}
 function openShop(){const old=document.getElementById('shop-here');if(old)old.remove();
  const box=document.createElement('section');box.id='shop-here';box.setAttribute('role','dialog');box.setAttribute('aria-label','Shop here');
  box.style.cssText='position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:40;box-sizing:border-box;width:min(440px,92vw);max-height:78vh;overflow:auto;padding:16px 18px;background:#0c1214;color:#d7e6e4;border:1px solid #2a7f8a;font:14px/1.4 sans-serif';
  const cr=Number.isInteger(root.state?.credits)?root.state.credits:0;let html='<h2 style="margin:0 0 8px;font-size:18px">SHOP HERE</h2><p>This counter sells tonics. Admin and Iris keep their own conversation. You have '+cr+' CR.</p>';
  for(const p of PRESETS)html+='<p><b>'+esc(p.name)+'</b> · '+p.price+' CR<br>'+esc(p.help)+'</p><button type="button" data-buy="'+p.id+'">BUY '+esc(p.name.toUpperCase())+'</button>';
  html+='<button type="button" data-buy="catalog">Vendor catalog &amp; inventory</button><p id="shop-here-note" role="status"></p><p><button type="button" data-buy="close" data-input-dismiss>CLOSE</button></p>';box.innerHTML=html;
  box.addEventListener('click',e=>{const id=e.target?.dataset?.buy;if(!id)return;if(id==='close'){box.remove();return;}if(id==='catalog'){box.remove();root.VoidCatalogShop.open('shop-here');return;}
   const now=Date.now()/1000,r=buy(root.state?.credits,root.state?.story?.flags?.shopEffect,id,now),note=box.querySelector('#shop-here-note');
   if(!r.ok){if(note)note.textContent=r.why;return;}
   root.state.credits=r.credits;root.state.story=root.state.story||{};root.state.story.flags=root.state.story.flags||{};root.state.story.flags.shopEffect=r.flag;
   try{root.save?.();}catch{}tint(r.stat==='tint');if(r.stat==='tint')setTimeout(()=>tint(false),Math.max(0,(r.until-now)*1000));
   if(note)note.textContent=r.stat==='sprint'?'Sprint is on.':'The tint is on.';});
  document.body.append(box);}
 const wait=setInterval(()=>{if(typeof root.VoidInteractions==='undefined'||!root.VoidInteractions.register)return;clearInterval(wait);root.VoidInteractions.register('district-shop-here',()=>{try{openShop();}catch(e){console.warn(e);}});},300);
 if(typeof document!=='undefined'){const css=document.createElement('style');css.textContent='.shop-tint body,.shop-tint{filter:saturate(1.15) hue-rotate(8deg)}@media (prefers-reduced-motion:reduce){.shop-tint{filter:none}}';document.head.append(css);}
 api.panel=head=>head+'<section data-dev-studios="1"><h3>Consumables</h3><p>SHOP HERE in the District store sells these. They are not attached to Admin’s stock.</p><ul>'+PRESETS.map(p=>'<li><b>'+esc(p.name)+'</b> · '+p.price+' CR — '+esc(p.help)+'</li>').join('')+'</ul><h3>Sound library</h3><p>Existing area music. Preview does not change the music player or the pod.</p><ul>'+(function(){try{const S=root.VoidMusicScore;return soundLibrary(S).filter(t=>t.file).slice(0,12).map(t=>'<li>'+esc(t.id)+' — '+esc(t.mood)+'</li>').join('');}catch{return '';}})()+'</ul><h3>Advertisement playlist</h3><p>A developer preview on the screens already in the city. It only uses existing ads. Leave it empty and the screens keep their own order.</p><h3>Cinematic shots</h3><p>A named shot jumps in a throwaway test session. It does not write the campaign save.</p><h3>Skirmish</h3><p>'+esc(practice({network:true}).why)+'</p></section>';
})(typeof globalThis!=='undefined'?globalThis:this);
