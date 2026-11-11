/* Player-to-player trading: the prompt, the request and the trade window. OFF UNLESS THE HUB SAYS TRADING IS ON: nothing is shown until the hub's
   welcome message carries features.trade (void-runner/remote-players.js), and the production hub never does. Today only the local test hub
   with simulated inventories can; its window carries a permanent "SIMULATED INVENTORY" banner.
   This file owns no inventory and no balance. Everything shown (your items, the other player's offer, what was exchanged) is what the server sent;
   every button only asks the server. All text from the server is set as text, never as markup. See docs/development/TRADING_ARCHITECTURE.md. */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const RANGE=3;   // metres: the prompt appears when a player is this close (the server enforces it again)
 let dirty=false,awaiting=false,rp=null,unsub=null,session=null,incoming=null,outgoing=null,note='',noteAt=0,result=null,draft=null,sendTimer=0,closeTimer=0,box=null,prompt=null,toast=null;
 const el=(tag,props={},kids=[])=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==='text')e.textContent=v;else if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v);}for(const c of [].concat(kids))if(c)e.append(c);return e;};
 const css=`#trade-window,#trade-toast,#trade-prompt{position:fixed;z-index:62;font:13px/1.35 'Courier New',monospace;color:#d8f6ff;letter-spacing:.03em}
#trade-prompt{left:50%;bottom:92px;transform:translateX(-50%);padding:8px 16px;background:rgba(4,10,16,.82);border:1px solid #5ff2ff;box-shadow:0 0 14px rgba(95,242,255,.35);pointer-events:none}
#trade-prompt b{color:#ff2d96}
#trade-toast{left:50%;top:84px;transform:translateX(-50%);min-width:300px;padding:12px 16px;background:rgba(6,10,18,.94);border:1px solid #ff2d96;box-shadow:0 0 18px rgba(255,45,150,.4)}
#trade-toast button{margin:8px 8px 0 0}
#trade-window{left:50%;top:50%;transform:translate(-50%,-50%);width:min(880px,96vw);max-height:92vh;overflow:auto;padding:16px 18px;background:rgba(4,8,14,.96);border:1px solid #5ff2ff;box-shadow:0 0 28px rgba(95,242,255,.35),inset 0 0 40px rgba(255,45,150,.06)}
#trade-window h1{margin:0 0 4px;font-size:18px;letter-spacing:.2em;color:#5ff2ff}
#trade-window .tw-sim{margin:6px 0 10px;padding:5px 8px;border:1px dashed #ffb750;color:#ffb750;font-size:12px}
#trade-window .tw-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:700px){#trade-window .tw-cols{grid-template-columns:1fr}}
#trade-window .tw-col{border:1px solid rgba(95,242,255,.45);padding:10px;background:rgba(10,18,28,.8)}
#trade-window h2{margin:0 0 8px;font-size:13px;color:#ff2d96;letter-spacing:.16em}
#trade-window .tw-row{display:flex;align-items:center;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.07)}
#trade-window .tw-row span{flex:1}
#trade-window .tw-have{opacity:.65}
#trade-window .tw-chip{display:inline-block;margin-top:8px;padding:2px 8px;border:1px solid #6b7a88;color:#9fb0bd}
#trade-window .tw-chip.on{border-color:#6dffb0;color:#6dffb0;box-shadow:0 0 8px rgba(109,255,176,.45)}
#trade-window .tw-note{min-height:20px;margin:10px 0 0;color:#ffd27a}
#trade-window .tw-actions{display:flex;gap:10px;margin-top:10px;flex-wrap:wrap}
#trade-window button,#trade-toast button{font:inherit;color:#d8f6ff;background:#0b1620;border:1px solid #5ff2ff;padding:6px 14px;cursor:pointer;letter-spacing:.08em}
#trade-window button:hover:not(:disabled),#trade-toast button:hover{background:#12303f}
#trade-window button:disabled{opacity:.4;cursor:not-allowed}
#trade-window button.tw-go{border-color:#6dffb0;color:#6dffb0}
#trade-window button.tw-no{border-color:#ff2d96;color:#ff9acb}
#trade-window input[type=number]{width:110px;font:inherit;color:#d8f6ff;background:#050b12;border:1px solid #5ff2ff;padding:3px 6px}
#trade-window .tw-step{padding:1px 9px}`;
 document.head.append(el('style',{text:css,id:'trade-style'}));

 const fmt=o=>[o.credits?o.credits+' cr':'',...o.stacks.map(s=>s.qty+' x '+s.name),...o.equipment.map(e=>e.name)].filter(Boolean).join(', ')||'nothing';
 const send=m=>rp?.sendTrade({t:'trade',...m});
 const say=(t,ms=6000)=>{note=t;noteAt=Date.now()+ms;draw();};

 // ---- what the player has marked for the offer (a draft: the server's answer is what counts) ----
 const sync=()=>{draft={credits:session.yours.credits,stacks:Object.fromEntries(session.yours.stacks.map(s=>[s.id,s.qty])),equipment:new Set(session.yours.equipment.map(e=>e.serial))};};
 // The draft is what the player has marked. It stays the player's until the server's answer matches it, so a late update from the other player never wipes
 // an edit; one offer is in flight at a time, and a refusal because the view was out of date is simply sent again with the new version.
 const offerOf=()=>({credits:draft.credits,stacks:Object.entries(draft.stacks).filter(([,q])=>q>0).map(([id,qty])=>({id,qty})).sort((a,b)=>a.id<b.id?-1:1),equipment:[...draft.equipment].sort()});
 const sameAsServer=()=>{const o=offerOf(),y=session.yours;return o.credits===y.credits&&JSON.stringify(o.stacks)===JSON.stringify(y.stacks.map(x=>({id:x.id,qty:x.qty})).sort((a,b)=>a.id<b.id?-1:1))&&JSON.stringify(o.equipment)===JSON.stringify(y.equipment.map(e=>e.serial).sort());};
 function queueOffer(){dirty=true;clearTimeout(sendTimer);sendTimer=setTimeout(function fire(){sendTimer=0;if(!session||session.over)return;if(awaiting){sendTimer=setTimeout(fire,100);return;}awaiting=true;send({op:'offer',v:session.v,...offerOf()});},150);}

 function close(){windowDraw.sig=null;clearTimeout(closeTimer);clearTimeout(sendTimer);sendTimer=0;dirty=awaiting=false;session=null;result=null;draft=null;box?.remove();box=null;draw();}
 function leaveSoon(ms){clearTimeout(closeTimer);closeTimer=setTimeout(close,ms);}

 function onTrade(m){
  if(m.ev==='offline'){close();incoming=outgoing=null;toastDraw();return;}
  if(m.ev==='requested'){outgoing={id:m.id,name:m.to.name};}
  else if(m.ev==='incoming'){incoming={id:m.id,name:m.from.name};}
  else if(m.ev==='open'){incoming=outgoing=null;clearTimeout(closeTimer);result=null;dirty=awaiting=false;session={id:m.id,with:m.with,inventory:m.inventory,simulated:!!m.simulated,v:0,yours:{credits:0,stacks:[],equipment:[]},theirs:{credits:0,stacks:[],equipment:[]},confirmed:{you:false,them:false}};sync();document.exitPointerLock?.();if(typeof walkingKeys!=='undefined')walkingKeys.clear();}
  else if(m.ev==='update'&&session&&m.id===session.id){session.v=m.v;session.yours=m.yours;session.theirs=m.theirs;session.confirmed=m.confirmed;awaiting=false;
   if(dirty){if(sameAsServer())dirty=false;else if(!sendTimer)queueOffer();}else sync();}
  else if(m.ev==='inventory'&&session){session.inventory=m.inventory;}
  else if(m.ev==='inventory'){/* after the window closed */}
  else if(m.ev==='done'&&session){result={ok:true,text:'TRADE COMPLETE. You gave '+fmt(m.gave)+'. You received '+fmt(m.got)+'.'};session.over=true;}
  else if(m.ev==='cancelled'||m.ev==='failed'){const mine=session&&m.id===session.id;if(incoming?.id===m.id||outgoing?.id===m.id){incoming=outgoing=null;say(m.reason||'The request ended.');}
   if(mine){result={ok:false,text:(m.ev==='failed'?'TRADE FAILED. ':'TRADE CANCELLED. ')+(m.reason||'')};session.over=true;}}
  else if(m.ev==='refused'){awaiting=false;if(session&&m.reason==='Your view was out of date.'){/* the server sends the current view next; the edit is sent again */}else{if(session){dirty=false;sync();}say(m.reason||'Not possible right now.');}}
  draw();
 }
 function toastDraw(){
  toast?.remove();toast=null;
  if(incoming){toast=el('div',{id:'trade-toast',role:'alertdialog','aria-label':'Trade request'},[el('div',{text:incoming.name+' wants to trade.'}),
   el('button',{type:'button',text:'ACCEPT [Y]',onclick:()=>send({op:'accept'})}),el('button',{type:'button',class:'tw-no',text:'DECLINE [N]',onclick:()=>{send({op:'decline'});incoming=null;toastDraw();}})]);}
  else if(outgoing){toast=el('div',{id:'trade-toast'},[el('div',{text:'Waiting for '+outgoing.name+' to answer...'}),el('button',{type:'button',text:'CANCEL',onclick:()=>send({op:'cancel'})})]);}
  if(toast)document.body.append(toast);
 }

 function inventoryRows(){
  const rows=[];const inv=session.inventory;
  for(const s of inv.stacks){
   const cur=draft.stacks[s.id]||0,name=s.name||s.id;
   rows.push(el('div',{class:'tw-row'},[el('span',{text:name}),el('span',{class:'tw-have',text:'have '+s.qty}),
    el('button',{type:'button',class:'tw-step','aria-label':'Offer fewer '+name,text:'-',onclick:()=>{draft.stacks[s.id]=Math.max(0,cur-1);queueOffer();draw();}}),el('b',{text:String(cur)}),
    el('button',{type:'button',class:'tw-step','aria-label':'Offer more '+name,text:'+',onclick:()=>{draft.stacks[s.id]=Math.min(s.qty,cur+1);queueOffer();draw();}})]));
  }
  for(const item of inv.equipment){
   const serial=item.serial,label=item.name||serial.replace(/-[0-9a-f]+$/,'');
   const box=el('input',{type:'checkbox','aria-label':'Offer '+label});box.checked=draft.equipment.has(serial);
   box.addEventListener('change',()=>{if(box.checked)draft.equipment.add(serial);else draft.equipment.delete(serial);queueOffer();draw();});
   rows.push(el('label',{class:'tw-row'},[el('span',{text:label}),el('span',{class:'tw-have',text:'#'+serial.split('-')[1]}),box]));
  }
  return rows.length?rows:[el('div',{class:'tw-have',text:'Nothing you can trade.'})];
 }
 function theirRows(o){
  const rows=[...o.stacks.map(s=>el('div',{class:'tw-row'},[el('span',{text:s.name}),el('b',{text:'x '+s.qty})])),...o.equipment.map(e=>el('div',{class:'tw-row'},[el('span',{text:e.name}),el('span',{class:'tw-have',text:'#'+e.serial.split('-')[1]})]))];
  if(o.credits)rows.unshift(el('div',{class:'tw-row'},[el('span',{text:'Credits'}),el('b',{text:o.credits+' cr'})]));
  return rows.length?rows:[el('div',{class:'tw-have',text:'Nothing offered yet.'})];
 }
 function windowDraw(){
  if(!session){box?.remove();box=null;return;}
  const keep=!result&&box?.querySelector('input[type=number]')===document.activeElement;if(keep)return;   // never rebuild under the player's typing
  // Rebuild only when something shown has changed: a redraw under the pointer would swallow a click, and most messages change nothing visible.
  const sig=JSON.stringify([session.v,session.yours,session.theirs,session.confirmed,session.inventory,draft&&[draft.credits,draft.stacks,[...draft.equipment]],result,Date.now()<noteAt?note:'']);
  if(box&&sig===windowDraw.sig)return;windowDraw.sig=sig;
  const done=!!result,empty=!session.yours.credits&&!session.yours.stacks.length&&!session.yours.equipment.length&&!session.theirs.credits&&!session.theirs.stacks.length&&!session.theirs.equipment.length;
  const credits=el('input',{type:'number',min:'0',max:String(session.inventory.credits),step:'1','aria-label':'Credits to offer'});credits.value=String(draft.credits);
  credits.addEventListener('input',()=>{const n=Math.floor(Number(credits.value));draft.credits=Number.isFinite(n)?Math.max(0,Math.min(session.inventory.credits,n)):0;queueOffer();});
  credits.addEventListener('blur',()=>setTimeout(draw,300));   // not at once: a redraw between the press and the release of a click would swallow that click
  const mine=el('div',{class:'tw-col'},[el('h2',{text:'YOUR OFFER'}),el('div',{class:'tw-row'},[el('span',{text:'Credits'}),el('span',{class:'tw-have',text:'have '+session.inventory.credits}),credits]),...inventoryRows(),
   el('div',{class:'tw-chip'+(session.confirmed.you?' on':''),text:session.confirmed.you?'YOU: CONFIRMED':'YOU: NOT CONFIRMED'})]);
  const theirs=el('div',{class:'tw-col'},[el('h2',{text:(session.with.name||'THEIR').toUpperCase()+' OFFERS'}),...theirRows(session.theirs),el('div',{class:'tw-chip'+(session.confirmed.them?' on':''),text:session.confirmed.them?'THEM: CONFIRMED':'THEM: NOT CONFIRMED'})]);
  const actions=done?[el('button',{type:'button',text:'CLOSE',onclick:close})]:[
   el('button',{type:'button',class:'tw-go',text:'CONFIRM EXCHANGE',...(empty||session.confirmed.you?{disabled:''}:{}),onclick:()=>send({op:'confirm',v:session.v})}),el('button',{type:'button',class:'tw-no',text:'CANCEL TRADE',onclick:()=>send({op:'cancel'})})];
  const next=el('div',{id:'trade-window',role:'dialog','aria-label':'Trade'},[el('h1',{text:'TRADE'}),session.simulated?el('div',{class:'tw-sim',text:'SIMULATED INVENTORY: no real items or credits are used or changed.'}):null,
   el('div',{class:'tw-cols'},[mine,theirs]),el('div',{class:'tw-note',role:'status','aria-live':'polite',text:result?result.text:(Date.now()<noteAt?note:(session.confirmed.you&&!session.confirmed.them?'Waiting for '+session.with.name+' to confirm.':'Any change to either offer clears both confirmations.'))}),el('div',{class:'tw-actions'},actions)]);
  next.addEventListener('keydown',e=>e.stopPropagation());next.addEventListener('keyup',e=>e.stopPropagation());
  box?.replaceWith(next);if(!box)document.body.append(next);box=next;
  if(result)leaveSoon(result.ok?45000:8000);
 }
 function promptDraw(){
  const near=!session&&!incoming&&!outgoing&&rp?.features?.trade&&mode==='walking'&&!document.querySelector('#screen.conversation-live')?rp.nearest(RANGE):null;
  if(near){if(!prompt){prompt=el('div',{id:'trade-prompt'});document.body.append(prompt);}const t='[T] TRADE WITH '+near.name;if(prompt.dataset.t!==t){prompt.dataset.t=t;prompt.textContent='';prompt.append(el('b',{text:'[T] '}),document.createTextNode('TRADE WITH '+near.name));}prompt.dataset.id=near.id;}
  else if(prompt){prompt.remove();prompt=null;}
 }
 function draw(){windowDraw();toastDraw();promptDraw();}

 document.addEventListener('keydown',e=>{
  if(!rp?.features?.trade||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.code==='KeyT'&&prompt?.dataset.id){send({op:'request',to:prompt.dataset.id});e.preventDefault();}
  else if(e.code==='KeyY'&&incoming){send({op:'accept'});e.preventDefault();}
  else if(e.code==='KeyN'&&incoming){send({op:'decline'});incoming=null;toastDraw();e.preventDefault();}
 },true);

 // The hub client appears when multiplayer is switched on; look for it once a second until then, and refresh the prompt a few times a second after.
 setInterval(()=>{rp=root.VoidRemotePlayers||null;if(rp&&!unsub)unsub=rp.onTrade(onTrade);if(rp)promptDraw();},400);
 root.VoidTrade={get open(){return !!session;},get session(){return session&&{id:session.id,v:session.v,over:!!session.over,confirmed:session.confirmed,yours:session.yours,theirs:session.theirs,inventory:session.inventory,simulated:session.simulated};},get result(){return result;},get promptText(){return prompt?.textContent||null;},get toastText(){return toast?.textContent||null;}};
})(globalThis);
