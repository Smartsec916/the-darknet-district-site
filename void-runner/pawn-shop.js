/* PAWN SHOP: selling things to the broker (the owner, 20 Nov 2026: players can SELL items at the pawn shop; he fills in what it buys later).
   The pawn shop back room (modules.js 'pawn-back', the "SELL ITEMS" counter: `opens:{counter:'pawn'}`) opens this panel through module-integration.js (root.VoidPanels.pawn).
   What a player can sell is what they carry: progression.js personalItems (state.progression.personal.items). Selling takes the item away and adds its price to the
   campaign's credits, like Admin's counter takes credits away (progression.js buy / buyWeapon); the save then goes through the usual save() and the server's checks
   (void_runner_api.py clean_save: credits a whole number 0..100 000 000; void_runner_progression.py: carried items from the known list). No server change is needed.
   PURE PART (Node and the browser, tests/pawn-shop.test.cjs): BUYS, offers(s), sell(s, item). BROWSER PART: the panel. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const P_=()=>{try{return node?require('./progression.js'):root.VoidProgression;}catch{return null;}};

 /* ======================== WHAT THE BROKER BUYS (THE OWNER'S LIST: EDIT HERE) ========================
    One line per thing the broker buys: {item:'<an id from progression.js personalItems>', price:<credits, a whole number from 1 to 100000>}.
    Example (NOT active): {item:'ward-kit', price:40}
    It starts EMPTY on purpose: the owner decides what the pawn shop buys and for how much. While it is empty the panel says EMPTY below. */
 const BUYS=[];
 /* ==================================================================================================== */

 const EMPTY='The broker isn’t buying anything right now.',MAX_PRICE=100000,MAX_CREDITS=100000000;
 const known=()=>(P_()&&P_().personalItems)||{};
 // the list as the game uses it: known items only, whole prices in range, one line per item (the first wins)
 function list(buys=BUYS){const K=known(),seen=new Set(),out=[];for(const b of Array.isArray(buys)?buys:[]){if(!b||typeof b.item!=='string'||!K[b.item]||seen.has(b.item))continue;const p=b.price;if(!Number.isInteger(p)||p<1||p>MAX_PRICE)continue;seen.add(b.item);out.push({item:b.item,name:K[b.item].name||b.item,price:p});}return out;}
 // the problems with a list (for the owner and the tests): unknown items, bad prices, repeats
 function problems(buys=BUYS){const K=known(),out=[],seen=new Set();if(!Array.isArray(buys))return ['the list must be a list'];buys.forEach((b,i)=>{const n='line '+(i+1)+': ';if(!b||typeof b.item!=='string'||!K[b.item])out.push(n+'"'+(b&&b.item)+'" is not something a player carries (progression.js personalItems).');else if(seen.has(b.item))out.push(n+b.item+' is listed twice.');if(b&&!(Number.isInteger(b.price)&&b.price>=1&&b.price<=MAX_PRICE))out.push(n+'the price must be a whole number from 1 to '+MAX_PRICE+'.');if(b&&typeof b.item==='string')seen.add(b.item);});return out;}
 // what this player could sell now
 function offers(s,buys=BUYS){const have=new Set((s&&s.progression&&s.progression.personal&&s.progression.personal.items)||[]);return list(buys).map(o=>({...o,have:have.has(o.item)}));}
 // sell one: the item leaves the player's things, its price joins the credits
 function sell(s,item,buys=BUYS){const o=list(buys).find(x=>x.item===item);if(!o)return {ok:false,why:'The broker is not buying that.'};const p=s&&s.progression&&s.progression.personal;const items=(p&&p.items)||[];
  if(!items.includes(item))return {ok:false,why:'You are not carrying '+o.name+'.'};p.items=items.filter(x=>x!==item);s.credits=Math.min(MAX_CREDITS,(Number.isInteger(s.credits)?s.credits:0)+o.price);return {ok:true,item,name:o.name,price:o.price};}
 const api={BUYS,EMPTY,MAX_PRICE,list,problems,offers,sell};
 if(node){module.exports=api;return;}
 root.VoidPawn=api;

 // ---- the panel (browser): the game's own panel (game.js panel / button), back to walking with RETURN ----
 const esc=t=>typeof escapeText==='function'?escapeText(t):String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function open(){if(typeof state==='undefined'||!state||typeof panel!=='function')return;try{clearInput();walkingKeys.clear();}catch{}try{document.exitPointerLock?.();}catch{}mode='equipment';view='equipment';draw();}
 function draw(msg){const os=offers(state),cr=Number.isInteger(state.credits)?state.credits:0;
  const body=os.length?'<p>The broker looks over what you carry. You have '+cr+' CR.</p>'+(msg?'<p>'+esc(msg)+'</p>':'')+'<div class="module-grid">'+os.map(o=>'<article data-pawn-item="'+esc(o.item)+'"><h2>'+esc(o.name)+'</h2><p>'+o.price+' CR</p>'+button(o.have?'SELL · '+o.price+' CR':'NOT CARRIED','pawn-sell:'+o.item,false,!o.have)+'</article>').join('')+'</div>'
   :'<p>'+esc(EMPTY)+'</p>';
  panel('PAWN SHOP','Sell <em>items.</em>',body,button('RETURN TO GAMEPLAY','pawn-close',true));}
 (root.VoidPanels=root.VoidPanels||{}).pawn=open;
 const wire=setInterval(()=>{if(typeof screen==='undefined'||!screen||!screen.addEventListener)return;clearInterval(wire);
  screen.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(!a)return;
   if(a==='pawn-close'){try{resumeWalking();}catch{}return;}
   if(a.startsWith('pawn-sell:')){const r=sell(state,a.slice(10));if(r.ok){try{save();}catch{}try{announce('SOLD · '+r.name+' for '+r.price+' CR.');}catch{}}draw(r.ok?'Sold: '+r.name+' for '+r.price+' CR.':r.why);}});},300);
})(typeof globalThis!=='undefined'?globalThis:this);
