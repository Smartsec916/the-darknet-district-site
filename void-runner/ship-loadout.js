/* Ship ordnance in the game (the owner, 19 Nov 2026): Admin's counter sells M1 refills and M2 missiles once the player has a ship, and the Ship Loadout app
   on the V1 (installed the moment a ship is granted: ordnance.js grant sets story.flags.loadoutApp) shows the ship, its slots with their player-facing names
   (PRIMARY, SHIELD, DRIVE = internal 'utility', MISSILES, UTILITY = internal 'signal', and the module bays), the lasers, both missile racks, the default
   missile, and fits the upgrades the player owns. Rules and saving: ordnance.js (prices are balance values). No new character lines: Admin's counter is a
   panel, like his scrambler stock. */
(function(root){
 'use strict';
 const O=root.VoidOrdnance;if(!O)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const st=()=>{try{return typeof state!=='undefined'?state:null;}catch{return null;}};
 const persist=()=>{try{if(typeof save==='function')save();}catch{}try{if(typeof hud==='function')hud();}catch{}};
 const shipOf=s=>VoidShips.get(s);
 const one=v=>Math.round(v*10)/10;
 function typeCard(s,type,shop){const t=O.TYPES[type],sp=O.spec(type,VOID_BALANCE,shipOf(s)),c=O.counts(s)[type],cap=O.capacity(s,type),price=O.price(type),room=cap-c;
  const buy=n=>{const why=O.canBuy(s,type,n);return button('BUY '+n+' · '+(price*n).toLocaleString()+' CR','ord-buy:'+type+':'+n,n>1,!!why);};
  return '<article class="ord-card ord-'+type+'"><h2>'+esc(t.title)+'</h2><p>'+esc(t.role)+'</p><dl class="ord-kv"><dt>Warhead</dt><dd>'+one(sp.damage)+'</dd><dt>Turning</dt><dd>'+one(sp.turn)+' rad/s</dd><dt>Speed</dt><dd>'+Math.round(sp.speed)+'</dd><dt>Blast</dt><dd>'+one(sp.blast)+' m</dd><dt>In your rack</dt><dd>'+c+' / '+cap+'</dd>'+(shop?'<dt>Price</dt><dd>'+price.toLocaleString()+' CR each</dd>':'')+'</dl>'
   +(shop?(room>0?buy(1)+(room>1?buy(room):''):'<p class="ord-full">RACK FULL</p>'):'')+'</article>';}
 /* Admin's stock (faction-scenes.js adminStore: the pistol, the scrambler) gains the ship missiles for a pilot: adminItems() adds the two cards, adminNote() the help.
    One panel, so whatever else Admin sells stays beside the missiles. */
 let note='';
 function adminItems(){const s=st();if(!s||!O.hasShip(s)||!O.launcher(s))return [];return [typeCard(s,'m1',true),typeCard(s,'m2',true)];}
 function adminNote(){const s=st();if(!s||!O.hasShip(s)||!O.launcher(s))return '';const n=note;note='';
  return (n?'<p class="ord-note" role="status">'+esc(n)+'</p>':'')+'<p class="ord-help">Ship missiles for your wing rails: lasers never need ammunition, missiles do. M1 is the standard round. M2 is the upgrade: a heavier warhead with a bigger blast, but it turns slowly, so a hard-turning ship can slip it. In flight: '+esc(VoidInput.label(VoidInput.bindings.missile))+' or right-click fires (guided when the box says LOCK, straight ahead without a lock). '+esc(VoidInput.label(VoidInput.bindings.missileSwitch||'KeyZ'))+' or the mouse wheel switches M1 / M2. Your V1’s Ship Loadout app sets the default.</p>';}
 function shop(n){const s=st();if(!s)return;note=n||'';
  if(typeof root.VoidAdminStore==='function'){root.VoidAdminStore();return;}
  localPanel('Admin’s <em>stock.</em>','<div class="module-grid ord-grid">'+adminItems().join('')+'</div>'+adminNote());}
 screen.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(!a?.startsWith('ord-buy:'))return;const [,type,n]=a.split(':'),s=st(),count=Number(n);
  const why=O.canBuy(s,type,count);if(why){shop(why);return;}O.buy(s,type,count);persist();try{VoidAudio.event('confirm');}catch{}shop('Bought '+count+' '+O.TYPES[type].name+(count>1?' missiles':' missile')+'. Loaded on your ship.');});
 // The counter beside Admin (neochinatown.js, for pilots): his stock, reachable even while he has a mission to offer. Talking to Admin opens it too when he has nothing else (faction-scenes.js).
 VoidInteractions.register('admin-ordnance',()=>shop());

 /* ---- The V1 Ship Loadout app ---- */
 const SLOT_NAMES={weapon:'PRIMARY',shield:'SHIELD',utility:'DRIVE',missile:'MISSILES'},BAYS=['weapon','shield','power','cooling','engine','sensor','thrusters','signal'];
 const BAY_NAMES={weapon:'WEAPON BAY',shield:'SHIELD BAY',power:'POWER',cooling:'COOLING',engine:'ENGINE',sensor:'SENSOR',thrusters:'THRUSTERS',signal:'UTILITY'};
 // The Kestrel from above: hull, canopy, wings with the gun and missile rails, twin engines (drawn, not a picture file).
 const SHIP_SVG='<svg class="lo-ship" viewBox="0 0 220 150" role="img" aria-label="Your ship from above"><g fill="#1b2228" stroke="#9fb3bd" stroke-width="1.2"><path d="M110 8 L124 40 L128 92 L196 112 L198 122 L128 116 L122 136 L98 136 L92 116 L22 122 L24 112 L92 92 L96 40 Z"/><path d="M103 30 L110 18 L117 30 L117 52 L103 52 Z" fill="#33464f"/><path d="M98 136 L96 146 L106 146 L106 136 M114 136 L114 146 L124 146 L122 136" fill="#3a2a22" stroke="#c98a5a"/></g>'
  +'<g stroke="#e8e2d0" stroke-width="2"><path d="M70 98 L70 88"/><path d="M150 98 L150 88"/></g><g fill="#d6c8a4"><rect x="44" y="104" width="16" height="3"/><rect x="160" y="104" width="16" height="3"/></g><g fill="#ff8a40" opacity=".85"><circle cx="101" cy="146" r="2.4"/><circle cx="119" cy="146" r="2.4"/></g>'
  +'<g font-family="Consolas,monospace" font-size="8" fill="#9fb3bd"><text x="60" y="84">GUNS</text><text x="140" y="84">GUNS</text><text x="30" y="100">RAIL</text><text x="170" y="100">RAIL</text><text x="128" y="150">ENGINES</text></g></svg>';
 function gearName(id){return id?(VoidShips.equipment[id]?.name||VoidContent.gear[id]?.name||VoidContent.creditGear[id]?.name||id):'NONE';}
 function view(){const s=st();if(!s)return '<div class="pd-empty">Not available right now.</div>';
  if(!O.hasShip(s))return '<div class="pd-empty">You do not have a ship.</div>';
  const ship=shipOf(s),stats=C.stats(s,typeof ownedGear!=='undefined'?ownedGear:[]),P=VoidProgression,inst=s.progression.equipment.installed[s.activeShip]||{},owned=s.progression.equipment.owned,sel=O.selected(s);
  const drives=[...Object.entries(VoidContent.gear),...Object.entries(VoidContent.creditGear)].filter(([id,g])=>g.slot==='utility'&&C.ownsEquipment(s,id,typeof ownedGear!=='undefined'?ownedGear:[]));
  const row=(label,value,extra='')=>'<div class="pd-line lo-row"><b>'+esc(label)+'</b>'+esc(value)+extra+'</div>';
  let h='<section class="pd-storage lo-head">'+SHIP_SVG+'<dl class="pd-kv"><dt>SHIP</dt><dd>'+esc(ship.name)+'</dd><dt>HULL</dt><dd>'+stats.hull+'</dd><dt>SHIELD</dt><dd>'+(stats.shield||'NONE')+'</dd><dt>TOP SPEED</dt><dd>'+ship.flight.maxSpeed+'</dd></dl></section>';
  h+='<h2>LASER CANNONS</h2>'+row('PRIMARY',s.loadout.weapon?gearName(s.loadout.weapon):'Built-in pulse cannons')+'<div class="pd-note">Two pulse cannons. Unlimited: they never run out. '+one(stats.damage)+' damage a bolt, '+one(1/Math.max(.01,stats.cooldown))+' shots a second; they heat up and cool down.</div>';
  h+='<h2>MISSILES</h2>'+row('LAUNCHER',O.launcher(s)?(O.equipped(s)?'FITTED · wing rails':'OWNED · not fitted'):'NONE',O.launcher(s)?' <button type="button" data-loadout="launcher">'+(O.equipped(s)?'REMOVE':'FIT')+'</button>':'')
   +'<div class="lo-racks">'+['m1','m2'].map(t=>{const c=O.counts(s)[t];return '<button type="button" class="lo-rack'+(sel===t?' pd-hot':'')+'" data-loadout="select:'+t+'" aria-pressed="'+(sel===t)+'"><b>'+esc(O.TYPES[t].title)+'</b><span>'+c+' / '+O.capacity(s,t)+'</span><small>'+(sel===t?'DEFAULT':'SET AS DEFAULT')+'</small></button>';}).join('')+'</div>'
   +'<div class="pd-note">The default is armed when you launch; switch in flight with '+esc(VoidInput.label(VoidInput.bindings.missileSwitch||'KeyZ'))+' or the mouse wheel. More at Admin’s counter in The Darknet District.</div>'
   +'<dl class="pd-kv">'+['m1','m2'].map(t=>{const sp=O.spec(t,VOID_BALANCE,ship);return '<dt>'+O.TYPES[t].name+'</dt><dd>warhead '+one(sp.damage)+' · turning '+one(sp.turn)+' · blast '+one(sp.blast)+' m</dd>';}).join('')+'</dl>';
  h+='<h2>SLOTS</h2>'+row(SLOT_NAMES.shield,s.loadout.shield?gearName(s.loadout.shield):ship.shield?'Built-in deflector':'NONE (no deflector fitted)')+row(SLOT_NAMES.utility,gearName(s.loadout.utility))
   +(drives.length?'<div class="pd-tabs">'+drives.map(([id,g])=>'<button type="button" data-loadout="gear:'+id+'" aria-pressed="'+(s.loadout.utility===id)+'" class="'+(s.loadout.utility===id?'pd-hot':'')+'">'+esc(g.name)+(s.loadout.utility===id?' · FITTED':'')+'</button>').join('')+'</div>':'<div class="pd-note">No drive equipment owned (boosters and drones go in the DRIVE slot).</div>');
  h+='<h2>UPGRADES</h2>'+BAYS.map(bay=>{const fit=inst[bay]&&owned.includes(inst[bay])?inst[bay]:null,opts=owned.filter(id=>P.modules[id]?.slot===bay&&P.modules[id].compatible.includes(s.activeShip));
   return row(BAY_NAMES[bay],fit?P.modules[fit].name:'EMPTY')+(opts.length?'<div class="pd-tabs">'+opts.map(id=>'<button type="button" data-loadout="module:'+bay+':'+id+'" class="'+(fit===id?'pd-hot':'')+'" aria-pressed="'+(fit===id)+'">'+esc(P.modules[id].name)+(fit===id?' · FITTED':' · FIT')+'</button>').join('')+(fit?'<button type="button" data-loadout="module:'+bay+':none">REMOVE</button>':'')+'</div>':'');}).join('')
   +'<div class="pd-note">Owned upgrades can be fitted here or at a hangar maintenance terminal. Changes apply from your next launch.</div>';
  return h;}
 function act(code){const s=st();if(!s||!O.hasShip(s))return false;const [k,a,b]=String(code).split(':');let ok=false;
  if(k==='select')ok=O.select(s,a);
  else if(k==='launcher'&&O.launcher(s)){s.loadout.missile=s.loadout.missile==='launcher'?null:'launcher';s.shipLoadouts[s.activeShip]={...s.loadout};ok=true;}
  else if(k==='gear')ok=C.equip(s,a,typeof ownedGear!=='undefined'?ownedGear:[]);
  else if(k==='module')ok=VoidProgression.install(s,a,b==='none'?null:b);
  if(ok)persist();return ok;}
 if(root.VoidPersonalDevice?.APP_VIEW)root.VoidPersonalDevice.APP_VIEW.loadout=view;
 // The moment a ship is granted (a mission reward, the test ship) the V1 says the app arrived; once per save (story.flags.loadoutAppSeen).
 setInterval(()=>{const s=st(),f=s?.story?.flags;if(!f||f.loadoutApp!==true||f.loadoutAppSeen===true)return;try{if(typeof mode==='undefined'||!['walking','dock'].includes(mode))return;}catch{return;}
  if(root.VoidV1?.notify?.({app:'loadout',key:'loadout-app',text:'Ship Loadout app installed: your ship, its slots and missiles'})!==false){f.loadoutAppSeen=true;persist();}},1000);
 root.VoidShipLoadout={view,act,shop,adminItems,adminNote,SLOT_NAMES,BAY_NAMES};
})(globalThis);
