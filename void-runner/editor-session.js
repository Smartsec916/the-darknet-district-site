/* THE EDITOR STAYS OPEN (pure: browser and Node tests). The owner, 21 Nov 2026: "sometimes the mission editor times out and goes to the previous page. also while
   trying to play through a test mission the editor pops up". Causes (found in account.js / dev-tools.js / cache.js):
   1. account.js re-checks the account every 4 minutes (and when the browser tab gets focus back); each successful check called VoidDevTools.identity() again, which
      HID the Developer tools window (the game or the main menu behind it came back: "the previous page") and, while a mission-editor-return note was waiting (it is
      written when PLAY THIS DRAFT starts and kept for LEAVE DRAFT), OPENED the Mission Editor over the draft being played.
   2. A new build deployed while the editor was open over the main menu reloaded the page by itself (update-ready.js: the main menu was "safe").
   Rules here: a re-check of the same account keeps everything as it is; a sign-out keeps an open editor or draft play open with a small "sign in again" bar; the
   editor opens by itself only once per page load (after LEAVE DRAFT's reload), never during a draft; a failed server call is retried with a growing wait;
   Escape in a text box does not close the window. */
(function(root){
 'use strict';
 /* cur: {authorized, uid, open (the Developer tools window is showing), testing (a test or draft session)}; next: {uid, request (a confirmed developer request)}.
    'swap': the same account confirmed again: keep the window, its tab and its work; only the request is new. 'fresh': a first confirmation (or another account):
    the old behaviour (window closed until the new account is confirmed). 'hold': the same account seen again by the sign-in listener: nothing changes.
    'expired': signed out while the editor or a draft is open: keep it open and show the sign-in bar (the server still checks every write). 'close': fail closed. */
 function identity(cur,next){const c=cur||{},n=next||{};
  if(n.request)return c.authorized&&c.uid&&c.uid===n.uid?'swap':'fresh';
  if(c.authorized&&c.uid&&n.uid&&n.uid===c.uid)return 'hold';
  if(c.authorized&&c.uid&&!n.uid&&(c.open||c.testing))return 'expired';
  return 'close';}
 /* c: {first (the first developer confirmation of this page load), testing, open, missions / npcs (an editor-return note waits)}. Returns the tab to open or null. */
 function autoOpen(c){const x=c||{};if(!x.first||x.testing||x.open)return null;return x.missions?'missions':x.npcs?'npcs':null;}
 /* What a failed editor call means: 'signin' (401: the sign-in expired), 'waking' (no answer, a timeout or a 5xx: the free server is asleep or restarting; retry),
    'other' (refused or invalid: show it, do not retry). */
 function problem(e){const s=Number(e&&e.status)||0,k=String(e&&e.kind||''),m=String(e&&e.message||'');
  if(s===401||/sign in again|sign-in expired/i.test(m))return 'signin';
  if(k==='timeout'||k==='network'||k==='unavailable'||[408,429,500,502,503,504].includes(s))return 'waking';
  return 'other';}
 /* Seconds before retry n (1, 2, 3 …): 3, 6, 12, 24, 45, then every 60. */
 const WAITS=[3,6,12,24,45,60];
 function retryDelay(n){const i=Math.max(1,Math.floor(Number(n)||1));return WAITS[Math.min(i,WAITS.length)-1];}
 /* Escape closes the Developer tools window, but not while typing in a box (it only leaves the box). */
 function escapeCloses(t){if(!t)return true;if(t.isContentEditable)return false;return !/^(INPUT|TEXTAREA|SELECT)$/.test(String(t.tagName||'').toUpperCase());}
 const TEXT={signin:'Sign-in expired — your editor and your draft stay open.',waking:'Server waking up / retrying…',update:'Update ready — it applies when you press APPLY UPDATE (your draft is saved first).',
  stepFailed:'Draft: step failed'};
 const api={identity,autoOpen,problem,retryDelay,escapeCloses,TEXT,WAITS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidEditorSession=api;
})(typeof globalThis!=='undefined'?globalThis:this);
