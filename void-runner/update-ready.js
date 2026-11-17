/* WHEN A NEW BUILD MAY TAKE OVER (pure: browser and Node tests). David, 17 Nov 2026: after a deploy he heard the OLD area music until he refreshed the page.
   Cause: the page that was open (or the first load after a deploy) was controlled by the previous service worker, which serves game files cache-first from the
   previous build's cache; the new worker installs during that load, but the files already running are the old ones until the page loads again.
   Rule (cache.js runs it): the build this page was loaded with is remembered (the controlling worker's BUILD, or none when the page came from the network); when a
   worker with a DIFFERENT build takes control, an update is ready. It is applied by reloading the page, but only where nothing is lost: on the loading screen or the
   main menu, never in a conversation, a flight (even paused behind the menu), a test or draft session, or while saving is impossible. Otherwise a small V1-style notice says
   "Update ready — it applies next time you return to the main menu", and the reload happens at the next main-menu visit. */
(function(root){
 'use strict';
 /* loaded: the build that served this page (null: the network did, so it is current); now: the build of the worker in control. */
 function ready(loaded,now){return typeof loaded==='string'&&typeof now==='string'&&loaded!==now;}
 /* ctx: {started (the game finished loading), mode, mainMenu (the main menu is on screen), flight (a flight session exists), speech (a conversation is open),
    testing (a developer test or draft session), saved (the last save worked)}. Returns 'reload' or 'wait'. */
 function when(ctx){const c=ctx||{};if(c.testing||c.flight||c.speech||c.saved===false)return 'wait';if(!c.started)return 'reload';return c.mode==='menu'&&c.mainMenu?'reload':'wait';}
 const NOTICE='Update ready — it applies next time you return to the main menu';
 const api={ready,when,NOTICE};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidUpdate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
