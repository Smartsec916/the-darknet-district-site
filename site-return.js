/* A small "back to the website" button for the site's games (David, 15 Nov 2026). One file, loaded by each game's page.
   - On a game's own page it shows a quiet button in the top-left corner that goes to the games page.
   - Inside the District arcade (the game runs in a frame over VOID//RUNNER) it shows nothing: the cabinet's own RETURN TO THE DARKNET DISTRICT button (EXIT GAME) returns the player to the arcade room.
   - In VOID//RUNNER itself it shows only on the main menu, never over play.
   No storage, no network, no tracking. */
(function(){
 'use strict';
 var embedded=false;try{embedded=window.top!==window.self;}catch(e){embedded=true;}
 if(embedded||document.getElementById('site-return'))return;
 var a=document.createElement('a');a.id='site-return';a.href='/games-list.html';a.textContent='← RETURN TO THE DARKNET DISTRICT';a.setAttribute('aria-label','Return to The Darknet District website');
 a.style.cssText='position:fixed;left:10px;top:10px;z-index:2147483000;padding:6px 10px;font:700 11px/1 ui-monospace,Consolas,monospace;letter-spacing:.12em;color:#c9fffa;background:rgba(6,14,20,.72);border:1px solid #38808b;text-decoration:none;opacity:.6;transition:opacity .15s';
 a.onmouseenter=a.onfocus=function(){a.style.opacity='1';};a.onmouseleave=a.onblur=function(){a.style.opacity='.6';};
 function mount(){if(!document.body)return setTimeout(mount,50);document.body.appendChild(a);
  // VOID//RUNNER: only on its main menu (the page declares a global `mode`); the button would be in the way anywhere else
  if(/void-runner\.html$/.test(location.pathname)||document.getElementById('game-menu')){a.style.left='auto';a.style.right='14px';a.style.top='auto';a.style.bottom='14px';var sync=function(){var on=false;try{on=typeof mode==='undefined'||mode==='menu';}catch(e){on=true;}a.style.display=on?'':'none';};sync();setInterval(sync,400);}}
 mount();
})();
