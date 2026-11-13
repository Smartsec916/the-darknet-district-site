/* The arcade's playable cabinets (docs/development/ARCADE.md). BROWSER ONLY.
   A cabinet runs the REAL game, not a copy: the game's own page is opened in a frame over the District, so it is the same code, saves and sign-in as the
   stand-alone page (same site, same browser storage). While it is open the player's character stands still at the cabinet and stays in the District (multiplayer
   keeps them connected); LEAVE CABINET (or closing the frame) gives movement back. Nothing is passed into the game and nothing is read out of it.
   GAMES is the register: to make another cabinet playable, add its game id and page here and give a cabinet that game in neochinatown.js (ARCADE). */
(function(root){
 'use strict';
 const GAMES={'blackout-protocol':{title:'BLACKOUT PROTOCOL',page:'blackout-protocol/index.html'},'corporate-zombies':{title:'CORPORATE ZOMBIES',page:'corporate-zombies/index.html'}};
 if(typeof module==='object'&&module.exports){module.exports={GAMES};return;}
 if(typeof document==='undefined'||typeof VoidInteractions==='undefined')return;
 let el=null,frame=null,playing=null;
 const css=document.createElement('style');css.textContent='#arcade-play{position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;background:#000}#arcade-play[hidden]{display:none}#arcade-play .ap-bar{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:14px;padding:8px 14px;background:#0a0710;border-bottom:1px solid #ff3fb4;color:#ffe9f6;font:12px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.12em}#arcade-play .ap-bar b{color:#ffe066}#arcade-play .ap-bar span{opacity:.7;margin-right:auto}#arcade-play button{font:inherit;letter-spacing:.1em;color:#fff;background:#3a0f2a;border:1px solid #ff3fb4;padding:7px 14px;cursor:pointer}#arcade-play button:hover,#arcade-play button:focus-visible{outline:2px solid #fff;outline-offset:2px}#arcade-play iframe{position:static;inset:auto;display:block;flex:1 1 0;min-height:0;width:100%;height:auto;border:0;background:#000}';
 document.head.appendChild(css);
 // The bar is a div, not a <header>: the game page styles every <header>.
 function build(){el=document.createElement('section');el.id='arcade-play';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Arcade cabinet');
  el.innerHTML='<div class="ap-bar"><b></b><span>ARCADE CABINET · the game runs here exactly as on its own page</span><button type="button" data-arcade="leave">LEAVE CABINET</button></div>';document.body.appendChild(el);
  el.querySelector('[data-arcade=leave]').addEventListener('click',close);}
 function open(id){
  const game=GAMES[id];if(!game||playing||typeof mode==='undefined'||typeof walker==='undefined'||!walker)return false;if(!el)build();
  playing=id;mode='arcade';try{clearInput?.();walkingKeys?.clear?.();document.exitPointerLock?.();}catch{}
  el.querySelector('b').textContent=game.title;frame=document.createElement('iframe');frame.title=game.title;frame.setAttribute('allow','fullscreen; autoplay; gamepad');frame.src=new URL(game.page,document.baseURI||location.href).href;el.appendChild(frame);
  el.hidden=false;frame.addEventListener('load',()=>{try{frame.contentWindow.focus();}catch{}});return true;
 }
 function close(){
  if(!playing)return;playing=null;if(frame){frame.src='about:blank';frame.remove();frame=null;}   // removing the frame stops the game and its sound
  if(el)el.hidden=true;if(typeof mode!=='undefined'&&mode==='arcade'){try{resumeWalking();}catch{mode='walking';}}
 }
 // Anything that takes the player out of the District while a cabinet is open closes it.
 setInterval(()=>{if(playing&&(typeof mode==='undefined'||mode!=='arcade'))close();},500);
 VoidInteractions.register('district-arcade',({item}={})=>{if(!open(item?.game||'blackout-protocol')){try{resumeWalking();}catch{}}});
 VoidInteractions.register('district-arcade-soon',()=>{try{resumeWalking();}catch{}try{announce('These cabinets are not switched on yet. More games are coming.');}catch{}});
 root.VoidArcade={GAMES,open,close,get playing(){return playing;}};
})(typeof globalThis!=='undefined'?globalThis:this);
