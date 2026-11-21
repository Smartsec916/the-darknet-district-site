/* DEVELOPER TOOLS: "GUIDE ME" (the owner, 18 Nov 2026: "if I add a tree, mission, npc, giver, have it highlight the next box that needs an input ... for all the next
   inputs that are required"). Shared by the Mission Editor and Developer Tools > NPCs (browser only; loaded with them). The editors say WHAT is still required, in their
   own order, from the same rules their play / publish check uses (mission-content.js treeNeeds for missions, npc-paths.js for placements), as a list of
   {sel (a CSS selector of the input), text (plain words)}. This file finds the first one on screen, gives it a soft pulsing outline and a small "Next: ..." label, and
   scrolls it into view (never taking the typing focus, except right after a "+ NEW ..." action: focusNext()). With nothing left it shows a quiet "All required fields
   filled" and points at the next action button (PLAY THIS DRAFT). Optional fields are never highlighted. The pulse stops for reduced motion. The "Guide me" switch is on by
   default and remembered in this browser (localStorage, guarded). */
(function(root){
 'use strict';
 const KEY='editor-guide-on';let focusOnce=false,lastSel=null;
 const on=()=>{try{return root.localStorage.getItem(KEY)!=='0';}catch{return true;}};
 const setOn=v=>{try{root.localStorage.setItem(KEY,v?'1':'0');}catch{}};
 function style(){if(document.getElementById('editor-guide-style'))return;const s=document.createElement('style');s.id='editor-guide-style';
  s.textContent='.eg-next{outline:2px solid #58ffe1!important;outline-offset:2px;box-shadow:0 0 0 4px rgba(88,255,225,.25);animation:egPulse 1.6s ease-in-out infinite}.eg-label{display:inline-block;margin:2px 6px;padding:1px 6px;border-radius:3px;background:#58ffe1;color:#03121a;font:700 10px/1.5 ui-monospace,Consolas,monospace;letter-spacing:.05em;vertical-align:middle}.eg-done{color:#8fd9a8;font-size:11px;margin:4px 0}.eg-switch{display:inline-flex;gap:5px;align-items:center;font-size:11px;color:#8fa9a4;cursor:pointer}@keyframes egPulse{0%,100%{box-shadow:0 0 0 2px rgba(88,255,225,.15)}50%{box-shadow:0 0 0 6px rgba(88,255,225,.35)}}@media (prefers-reduced-motion:reduce){.eg-next{animation:none}}';document.head.append(s);}
 function clear(scope){for(const n of scope.querySelectorAll('.eg-next'))n.classList.remove('eg-next');for(const n of scope.querySelectorAll('.eg-label,.eg-done[data-eg]'))n.remove();}
 /* scope: the element to search; needs: [{sel, text}] in the editor's order; done: {sel, text} the next action once nothing is left (optional); box: where "All required
    fields filled" goes. Returns the element highlighted or null. */
 function show(scope,needs,{done=null,box=null}={}){if(!scope)return null;style();clear(scope);if(!on())return null;
  let target=null,why='';for(const n of needs||[]){const e=n.sel&&scope.querySelector(n.sel);if(e&&e.offsetParent!==null){target=e;why=n.text;break;}}
  if(!target){if(box){const p=document.createElement('p');p.className='eg-done';p.dataset.eg='1';p.textContent='All required fields filled'+(done&&done.text?' · next: '+done.text:'.');box.prepend(p);}
   const b=done&&done.sel&&scope.querySelector(done.sel);if(b&&!b.disabled){b.classList.add('eg-next');}lastSel=null;return b||null;}
  target.classList.add('eg-next');const lab=document.createElement('span');lab.className='eg-label';lab.textContent='Next: '+why;lab.setAttribute('role','note');target.after(lab);
  const active=document.activeElement,typing=active&&/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)&&scope.contains(active)&&active!==target;
  if(focusOnce){focusOnce=false;try{target.focus({preventScroll:true});}catch{}}
  if(!typing&&lastSel!==needs[0]?.sel)try{target.scrollIntoView({block:'nearest',behavior:root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}catch{}
  lastSel=needs[0]?.sel||null;return target;}
 function toggle(after){const l=document.createElement('label');l.className='eg-switch';l.title='Highlights the next box you still have to fill in (the same rules the play and publish check use).';
  const c=document.createElement('input');c.type='checkbox';c.checked=on();c.dataset.egToggle='1';c.onchange=()=>{setOn(c.checked);after?.();};l.append(c,document.createTextNode('Guide me (highlight the next box to fill in)'));return l;}
 root.VoidEditorGuide={show,clear,toggle,on,setOn,focusNext(){focusOnce=true;},KEY};
})(globalThis);
