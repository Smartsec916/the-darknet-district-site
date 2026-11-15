/* The News app's sponsored lines (void-runner/news-feed.js): station brands, the Relay's own adverts, and District store adverts from Admin and Iris. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('../void-runner/news-feed.js'),relay=require('../void-runner/relay-content.json'),atlas=require('../void-runner/assets/textures/store/store-atlas.json');
globalThis.window=globalThis;require('../void-runner/ad-art.js');const brands=globalThis.VoidAds.brands;
const store=[];for(const k of Object.keys(atlas))for(const c of atlas[k].cells||[])if(c.name&&!store.includes(c.name))store.push(c.name);
test('adverts repeat what the world already shows: every station brand except The Function, and the Relay\'s spots word for word',()=>{
 const all=F.adverts({brands,relay:relay.segments,store});
 assert.equal(all.filter(a=>a.kind==='station').length,brands.length-1);assert(!all.some(a=>/FUNCTION/.test(a.sponsor)),'The Function is not given an advert');
 const k=brands.find(b=>b.id==='kessler'),ad=all.find(a=>a.id==='brand:kessler');assert.equal(ad.sponsor,k.brand);assert.equal(ad.text,k.slogan);
 const spots=relay.segments.filter(s=>s.kind==='ad'||s.kind==='police');assert(spots.length>=5);for(const s of spots){const a=all.find(x=>x.id==='relay:'+s.id);assert(a,s.id);assert.equal(a.text,s.lines.join(' ').replace(/\s+/g,' ').trim().slice(0,400));}
});
test('District store adverts come from Admin or Iris, name goods the store really stocks, and link to the real storefront',()=>{
 assert(store.length>=10);const ads=F.adverts({store}).filter(a=>a.kind==='store');assert.equal(ads.length,store.length);
 for(const a of ads){assert.match(a.sponsor,/^(ADMIN|IRIS) · THE DARKNET DISTRICT$/);assert(store.includes(a.title));assert(a.text.includes(a.title));assert.equal(a.link,'https://thedarknetdistrict.com/store-first-page.html');}
 assert(ads.some(a=>/^ADMIN/.test(a.sponsor))&&ads.some(a=>/^IRIS/.test(a.sponsor)));
});
test('an item sold through missions is advertised only once the player has reached it; none exist yet',()=>{
 assert.equal(F.GAME_ITEMS.length,0);
 F.GAME_ITEMS.push({id:'t1',seller:'iris',name:'TEST ITEM',ad:'Test advert.',requires:{flag:'gotIt'}},{id:'t2',seller:'admin',name:'M ITEM',ad:'Mission advert.',requires:{mission:'m1'}});
 try{assert.equal(F.adverts({flags:{}}).length,0);assert.deepEqual(F.adverts({flags:{gotIt:true}}).map(a=>a.id),['game:t1']);assert.deepEqual(F.adverts({completed:['m1']}).map(a=>a.sponsor),['ADMIN · THE DARKNET DISTRICT']);}finally{F.GAME_ITEMS.length=0;}
});
test('the feed: a different order each opening, the same order for one opening, mixed sources, slots among the reports',()=>{
 const all=F.adverts({brands,relay:relay.segments,store}),a=F.feed(all,5,111),b=F.feed(all,5,111),c=F.feed(all,5,222);
 assert.deepEqual(a,b);assert.notDeepEqual(a.map(x=>x.ad.id),c.map(x=>x.ad.id));assert.equal(a.length,8);assert.equal(new Set(a.map(x=>x.ad.id)).size,8);
 assert(new Set(a.map(x=>x.ad.kind)).size>=3,'station, Relay and store adverts all appear');for(const x of a)assert(x.slot>=0&&x.slot<=5);
 assert(F.feed(all,0,5).every(x=>x.slot===0));assert.equal(F.feed([],3,1).length,0);
 for(const x of all){assert.doesNotMatch(x.text+x.title+x.sponsor,/[<>]/);}
});
test('the feed script is loaded by the game page, before the device code',()=>{const h=fs.readFileSync('void-runner.html','utf8');assert(h.indexOf('void-runner/news-feed.js')>0&&h.indexOf('void-runner/news-feed.js')<h.indexOf('void-runner/personal-device.js'));});
