/* Developer Tools · Share Links: pick a place or a scenario from share-registry.js, generate its guest link, copy it.
   Only shown inside Developer Tools (accounts the server confirms as developers). A link only names a registry id;
   it carries no account, save, developer access or settings, so whoever opens it gets Guest Mode and nothing more. */
(function(){
 let tab='location',picked={location:'neochinatown',scenario:'station-arrival'},query='',made=null;
 const esc=s=>escapeText(String(s??''));
 const base=()=>location.origin+location.pathname;
 function preview(e){return e.preview?'<img class="share-preview" alt="" src="'+esc(e.preview)+'" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'share-preview\'}))">':'<div class="share-preview" style="background:'+esc(e.tint)+'"><span>'+esc(e.name)+'</span></div>';}
 function render(){
  const items=VoidShare.search(query,tab),e=VoidShare.get(picked[tab])||items[0]||null;if(e)picked[tab]=e.id;
  const url=made&&e&&made.id===e.id?made.url:'';
  return '<div class="share-panel"><p class="share-kicker">SHARE // GUEST LINKS</p>'+
   '<p class="dev-note">Send someone a link that opens VOID//RUNNER straight at a place or scenario in <b>Guest Mode</b>: no sign-in, no intro, nothing saved. The link never carries your account, save or developer access.</p>'+
   '<nav class="share-tabs" aria-label="Share type">'+[['location','SHARE LOCATION'],['scenario','SHARE SCENARIO']].map(([id,l])=>'<button type="button" data-share-tab="'+id+'" class="'+(tab===id?'on':'')+'" aria-pressed="'+(tab===id)+'">'+l+'</button>').join('')+'</nav>'+
   '<label class="share-search"><span>Search</span><input id="share-search" type="search" maxlength="60" autocomplete="off" value="'+esc(query)+'" placeholder="'+(tab==='location'?'NeoChinatown, Meridian…':'VR, arrival, departure…')+'"></label>'+
   '<div class="share-body"><ul class="share-list" role="listbox" aria-label="'+(tab==='location'?'Locations':'Scenarios')+'">'+(items.length?items.map(x=>'<li><button type="button" role="option" data-share-pick="'+esc(x.id)+'" aria-selected="'+(e&&x.id===e.id)+'" class="'+(e&&x.id===e.id?'on':'')+'"><b>'+esc(x.name)+'</b><small>'+esc(x.system)+'</small></button></li>').join(''):'<li class="share-empty">Nothing matches.</li>')+'</ul>'+
   (e?'<article class="share-detail">'+preview(e)+'<h3>'+esc(e.name)+'</h3><p>'+esc(e.description)+'</p><dl><dt>Environment</dt><dd>'+esc(e.environment)+'</dd>'+(e.npc?'<dt>People</dt><dd>'+esc(e.npc)+'</dd>':'')+'<dt>Objective</dt><dd>'+esc(e.objective)+'</dd><dt>Guests</dt><dd>Start here with the intro and tutorial skipped. Nothing is saved.</dd></dl>'+
    '<div class="share-actions"><button type="button" data-share="generate">GENERATE LINK</button>'+(url?'<button type="button" data-share="copy">COPY LINK</button>':'')+'</div>'+
    (url?'<input id="share-url" class="share-url" readonly value="'+esc(url)+'" aria-label="Share link">':'')+'<p id="share-status" class="share-status" role="status"></p></article>':'')+'</div></div>';
 }
 function rerender(focus){const panel=document.getElementById('dev-balance');if(!panel||!VoidDevTools.authorized||VoidDevTools.tab!=='share')return;VoidDevTools.render();if(focus)panel.querySelector(focus)?.focus();}
 async function copy(){const input=document.getElementById('share-url'),status=document.getElementById('share-status');if(!input)return;
  try{await navigator.clipboard.writeText(input.value);status.textContent='Link copied. Paste it into a message.';}
  catch{input.select();let ok=false;try{ok=document.execCommand('copy');}catch{}status.textContent=ok?'Link copied. Paste it into a message.':'Select the link above and copy it.';}}
 document.addEventListener('click',ev=>{
  const panel=ev.target.closest?.('#dev-balance');if(!panel||!VoidDevTools.authorized)return;
  const t=ev.target.closest('[data-share-tab]')?.dataset.shareTab;if(t){tab=t==='scenario'?'scenario':'location';query='';made=null;return rerender('[data-share-tab="'+tab+'"]');}
  const p=ev.target.closest('[data-share-pick]')?.dataset.sharePick;if(p&&VoidShare.get(p)){picked[tab]=p;made=null;return rerender('[data-share-pick="'+p+'"]');}
  const a=ev.target.closest('[data-share]')?.dataset.share;
  if(a==='generate'){const id=picked[tab],url=VoidShare.link(id,base());if(url){made={id,url};rerender('#share-url');document.getElementById('share-url')?.select();}}
  if(a==='copy')copy();
 });
 document.addEventListener('input',ev=>{if(ev.target.id!=='share-search'||!VoidDevTools.authorized)return;query=ev.target.value.slice(0,60);const pos=ev.target.selectionStart;rerender('#share-search');const s=document.getElementById('share-search');try{s?.setSelectionRange(pos,pos);}catch{}});
 globalThis.VoidSharePanel={render,get tab(){return tab;},set tab(v){tab=v==='scenario'?'scenario':'location';made=null;}};
})();
