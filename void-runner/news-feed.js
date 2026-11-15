/* The News app's feed: the adverts the world already shows on its screens, as small sponsored lines mixed in among the reports like a social feed.
   Pure data and helpers (browser and Node; tests/news-feed.test.cjs). Nothing here invents a Relay broadcast: station adverts are the brands painted on the
   screens (ad-art.js) and the Relay's own advert and police spots (relay-content.json, David's lines), repeated word for word.
   The Darknet District store adverts are posted by Admin or Iris for goods the District store really stocks (the same list the in-game shop shelves show,
   assets/textures/store/store-atlas.json), and point at the real storefront page.
   GAME_ITEMS is for things Admin or Iris sell a player inside the game as their missions go on. It is EMPTY: when David adds such an item, add a line here
       {id:'item-id', seller:'admin'|'iris', name:'ITEM NAME', ad:'the advert line David wants', requires:{flag:'storyFlagName'} | {mission:'mission-id'} | null}
   and its advert appears in the feed once the player has reached that point (requires: null = always).
   DRAFT: the store advert sentences (STORE_LINES) are Claude's placeholders for David to rewrite. */
(function(root){
 'use strict';
 const STORE_URL='https://thedarknetdistrict.com/store-first-page.html';
 const STORE_LINES={admin:['{item}. On the shelf at The Darknet District store.','{item}. In stock. Come by the counter.','New on the wall: {item}.'],
  iris:['{item}. Ask me at the counter.','{item} is in at the District store.','Looking for {item}? We have it.']};
 const GAME_ITEMS=[];
 const text=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
 // A small repeatable random source, so one opening of the app keeps its order while it is on screen and the next opening differs.
 function rng(seed){let s=(Number(seed)>>>0)||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
 function shuffle(list,rand){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 const met=(req,ctx)=>!req||(req.flag?ctx.flags?.[req.flag]===true:req.mission?(ctx.completed||[]).includes(req.mission):false);
 /* Every advert that could be shown. src: {brands (ad-art.js), relay (relay-content.json segments), store (names of goods the store stocks), flags, completed}. */
 function adverts(src={}){
  const out=[];
  for(const b of src.brands||[])if(b&&b.brand&&b.id!=='function')out.push({id:'brand:'+text(b.id,30),kind:'station',sponsor:text(b.brand,40),title:text(b.line,60),text:text(b.slogan,160)});   // The Function's notice is not an advert and is left on its screens
  for(const s of src.relay||[])if(s&&(s.kind==='ad'||s.kind==='police')&&Array.isArray(s.lines))out.push({id:'relay:'+text(s.id,40),kind:s.kind==='police'?'police':'relay',sponsor:s.kind==='police'?'TESSALY POLICE':'THE RELAY · ADVERTISEMENT',title:text(s.headline,80),text:text(s.lines.join(' '),400)});
  (src.store||[]).forEach((name,i)=>{const item=text(name,60);if(!item)return;const who=i%2?'iris':'admin',lines=STORE_LINES[who];
   out.push({id:'store:'+i,kind:'store',sponsor:(who==='iris'?'IRIS':'ADMIN')+' · THE DARKNET DISTRICT',title:item,text:lines[i%lines.length].replace('{item}',item),link:STORE_URL});});
  for(const g of GAME_ITEMS)if(g&&g.id&&g.ad&&met(g.requires,src))out.push({id:'game:'+text(g.id,40),kind:'store',sponsor:(g.seller==='iris'?'IRIS':'ADMIN')+' · THE DARKNET DISTRICT',title:text(g.name,60),text:text(g.ad,240)});
  return out;
 }
 /* One opening of the feed: `count` adverts in random order, never two from the same source side by side when it can be avoided, and where each goes among
    `news` report blocks (slot i = before report i; slot news = after the last). */
 function feed(all,news,seed,count=8){
  const rand=rng(seed),byKind=new Map();for(const a of shuffle(all,rand)){if(!byKind.has(a.kind))byKind.set(a.kind,[]);byKind.get(a.kind).push(a);}
  const picked=[];let kinds=shuffle([...byKind.keys()],rand);
  while(picked.length<count&&kinds.length){for(const k of kinds.slice()){const l=byKind.get(k);if(l.length&&picked.length<count)picked.push(l.shift());if(!l.length)kinds=kinds.filter(x=>x!==k);}}
  const n=Math.max(0,news|0);return picked.map((ad,i)=>({ad,slot:n?Math.min(n,Math.floor((i+rand())*(n+1)/Math.max(1,picked.length))):0}));
 }
 const api={STORE_URL,STORE_LINES,GAME_ITEMS,adverts,feed,rng,shuffle};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidNewsFeed=api;
})(typeof globalThis!=='undefined'?globalThis:this);
