const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../void-runner/ad-screens-data.js'),relay=require('../void-runner/relay-content.json'),Q=require('../void-runner/ncz-quarters.js'),Board=require('../void-runner/warflying-board.js');
const doc=fs.readFileSync(path.join(__dirname,'../docs/void-runner/design-source/12-street-advertisements-david.md'),'utf8');
const section=(from,to)=>{const a=doc.indexOf(from);return doc.slice(a,to?doc.indexOf(to,a):undefined);};

test('every brand, tagline and announcement is the owner’s, word for word, and none is missing or added',()=>{
  const want=section('## The lines').split('\n').filter(l=>l.startsWith('- ')).map(l=>l.slice(2));
  const have=D.ADS.filter(a=>a.cat!=='warflying').map(a=>a.brand?a.brand+' — '+a.line:a.line);
  assert.deepEqual(have,want);assert.equal(want.length,54);
  assert.ok(have.includes('Second Chances™ — Lost an arm? Upgrade your poor decisions.'),'the trademark sign and the dash are kept');
  // what a voice would say for a brand ad is the whole of his line
  for(const ad of D.ADS.filter(a=>a.brand)){const s=D.slide({type:'ad',ad});assert.equal(s.lines.length,1);assert.equal(s.lines[0].say,ad.brand+' — '+ad.line);assert.equal(s.title,ad.brand);}
});
test('the three pro-WarFlying ads are the owner’s text, in order, with nothing added',()=>{
  const text=section('## Pro-WarFlying advertisements','## The lines'),norm=s=>s.replace(/\s+/g,' ').trim();
  const blocks=text.split(/\n### \d+\. /).slice(1).map(b=>{const [title,...rest]=b.split('\n');return norm(title+' '+rest.join(' ').replace(/(^|\s)- /g,' '));});
  const ads=D.ADS.filter(a=>a.cat==='warflying');assert.equal(ads.length,3);
  ads.forEach((ad,i)=>assert.equal(norm(ad.title+' '+ad.lines.join(' ')),blocks[i]));
  assert.ok(ads[0].lines.includes('Hit SUBMIT SCANS to upload your discoveries.'));
});
test('the game really works the way the pro-WarFlying ads say: an App Store, a WarFlying app, a SUBMIT SCANS button',()=>{
  const device=fs.readFileSync(path.join(__dirname,'../void-runner/personal-device.js'),'utf8'),v1=fs.readFileSync(path.join(__dirname,'../void-runner/device-v1.js'),'utf8');
  assert.ok(/data-wf="send"[^>]*>SUBMIT SCANS<\/button>/.test(device));assert.ok(!device.includes('SEND DATA TO WARFLYING LEADERBOARD'));
  assert.ok(/title:'APP STORE'/.test(v1)&&/STORE_EXTRA=\[\{id:'warflying'/.test(v1));
});
test('The owner’s seven space-station ads are the only Relay ads the street shows; drafts and The Function never appear',()=>{
  assert.equal(Object.keys(D.RELAY).length,7);
  for(const id of Object.keys(D.RELAY)){const s=relay.segments.find(x=>x.id===id);assert.ok(s&&!s.draft&&(s.kind==='ad'||s.kind==='police'),id);}
  const all=Object.keys(D.ZONES).flatMap(z=>Object.values(D.adsFor(z,{relay})).flat());
  assert.ok(!all.some(a=>relay.segments.find(s=>s.id===a.id)?.draft));
  assert.ok(!JSON.stringify(D.ADS).toLowerCase().includes('the function'));assert.ok(!Object.values(D.CATEGORIES).some(c=>c.speaker==='the-function'));
  const thr=D.slide({type:'ad',ad:D.adsFor('port',{relay}).shipgear.find(a=>a.id==='ad-shield-systems')});
  assert.deepEqual(thr.lines.map(l=>l.say),relay.segments.find(s=>s.id==='ad-shield-systems').lines);assert.equal(thr.speaker,'commercial-announcer');
  assert.equal(D.slide({type:'ad',ad:D.adsFor('port',{relay}).police[0]}).speaker,'police-recruiter');
});
test('location table: what plays where',()=>{
  const cats=z=>Object.keys(D.adsFor(z,{relay})).sort();
  assert.deepEqual(cats('oldtown'),['cyber','dating','district','food','housing','tech','warflying']);
  assert.deepEqual(cats('port'),['health','housing','police','shipgear','transport','warflying']);
  assert.ok(!cats('avenue').includes('tech'),'no black-market ads on the Avenue');assert.ok(cats('avenue').includes('government'));
  assert.deepEqual(cats('corporate'),['corporate','government','health']);
  // no Darknet District advertisement near the Corporate District
  const corp=Object.values(D.adsFor('corporate',{relay})).flat();assert.ok(!corp.some(a=>D.CATEGORIES[a.cat].district||/darknet district/i.test(JSON.stringify(a))));
  for(const z of Object.values(D.ZONES))for(const c of z.cats)assert.ok(D.CATEGORIES[c],c);
});
test('where a screen may stand: none toward the Temple, the corporate zone by the Function Gate, none in the Temple or the Corporate District',()=>{
  const f=Q.gate('function').rect,e=Q.gate('east').rect;
  assert.equal(D.zoneAt('avenue',f[1]+5,-12),'corporate');assert.equal(D.zoneAt('avenue',20,-12),'corporate','the Function Gate taxi stop');
  assert.equal(D.zoneAt('avenue',70,-12),'avenue');assert.equal(D.zoneAt('avenue',e[0]-5,-12),null);assert.equal(D.zoneAt('avenue',134,-12.5),null,'the East Gate taxi stop');
  assert.equal(D.zoneAt('oldtown',61,-80),'oldtown');assert.equal(D.zoneAt('port',25,-96),'port');assert.equal(D.zoneAt('nowhere',0,0),null);
  assert.equal(D.SCENES.temple,null);assert.equal(D.SCENES.corporate,null);assert.equal(D.SCENES.district,'silent');
  for(const p of D.PLACES){assert.ok(Q.valid(p.quarter));assert.ok(D.zoneAt(p.quarter,p.at[0],p.at[2]),p.id);assert.ok(['wall','kiosk'].includes(p.kind));assert.ok('nsew'.includes(p.faces));}
});
test('rotation: every fifth slot is news or the board, and never two in a row',()=>{
  for(const z of Object.keys(D.ZONES))for(const seed of [1,2,3]){
   const p=D.programme(z,{relay,seed});assert.ok(p.length>=10);
   p.forEach((s,i)=>assert.equal(s.type,i%5===4?'break':'ad',z+' slot '+i));
   const ads=p.filter(s=>s.type==='ad').map(s=>s.ad.id),all=Object.values(D.adsFor(z,{relay})).flat().map(a=>a.id);
   assert.deepEqual([...ads].sort(),[...all].sort(),'each ad of the zone once per cycle');
   assert.deepEqual(p.filter(s=>s.type==='break').map(s=>s.n),p.filter(s=>s.type==='break').map((_,i)=>i));
  }
  assert.notDeepEqual(D.programme('oldtown',{relay,seed:1}).map(s=>s.ad?.id),D.programme('oldtown',{relay,seed:2}).map(s=>s.ad?.id),'two screens run different orders');
  assert.deepEqual(D.programme('oldtown',{relay,seed:1}),D.programme('oldtown',{relay,seed:1}));
  assert.equal(D.EVERY,5);
});
test('a break is the board or one of the owner’s own news reports; with no news that fits it is always the board',()=>{
  for(let n=0;n<8;n++)assert.deepEqual(D.breakSlot(n,[]),{type:'board'});
  assert.deepEqual(D.newsFor(relay,{}),[],'no story has happened yet for a new player');
  const all=D.newsFor(relay,Object.fromEntries(relay.events.map(e=>[e.id,1])));
  assert.deepEqual(all.map(s=>s.id).sort(),['news-missing-cargo-vessel','news-station-door-repaired','news-warflying-coffee-maker']);
  assert.ok(all.every(s=>s.kind==='news'&&!s.draft));
  const seq=[0,1,2,3,4,5,6].map(n=>D.breakSlot(n,all));assert.deepEqual(seq.map(s=>s.type),['board','news','board','news','board','news','board']);
  assert.deepEqual([seq[1],seq[3],seq[5]].map(s=>s.segment.id),all.map(s=>s.id));
  const one=D.newsFor(relay,{'warflying-coffee-maker':5});assert.deepEqual(one.map(s=>s.id),['news-warflying-coffee-maker']);
  const s=D.slide(seq[1]);assert.equal(s.kind,'news');assert.equal(s.label,'NEWS');assert.equal(s.lines[0].say,null,'a headline is shown, not read');assert.deepEqual(s.lines.slice(1).map(l=>l.say),seq[1].segment.lines);
});
test('the board slide lists five and says only number one, or "a new number one"',()=>{
  const when=new Date(Date.UTC(2026,10,18)),st=Board.standings(0,'YOU',when),s=D.slide({type:'board'},{standings:st});
  assert.equal(s.label,'WARFLYING LEADERSHIP BOARD');assert.equal(s.standings.rows.length,5);assert.equal(s.lines.length,1);assert.equal(s.lines[0].say,st.rows[0].name);assert.ok(Board.isOwnerHandle(s.lines[0].say));
  const top=D.slide({type:'board'},{standings:Board.standings(999,'Pilot',when)});assert.equal(top.lines[0].say,'a new number one');
});
test('eras: an ad with no era always runs; an ad tagged with an era runs only in it; there are no eras yet',()=>{
  assert.equal(D.ERA,null);assert.ok(D.ADS.every(a=>a.era===undefined));
  assert.ok(D.inEra({},null)&&D.inEra({},'x'));assert.ok(!D.inEra({era:'later'},null));assert.ok(D.inEra({era:'later'},'later'));assert.ok(D.inEra({era:['a','b']},'b'));assert.ok(!D.inEra({era:['a','b']},'c'));
});
test('every line a voice could say is the owner’s, and nothing is said for The Function',()=>{
  const lines=D.spokenLines(relay),own=new Set([...D.ADS.flatMap(a=>a.brand?[a.brand+' — '+a.line]:a.lines?[a.title,...a.lines]:[a.line]),...relay.segments.filter(s=>D.RELAY[s.id]).flatMap(s=>s.lines)]);
  assert.ok(lines.length>100);for(const l of lines){assert.ok(own.has(l.text),l.text);assert.notEqual(l.speaker,'the-function');}
});
test('the page loads the board and the screens before the scripts that use them, and the device and the Mission Log show the weekly five',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../void-runner.html'),'utf8'),at=f=>html.indexOf('src="void-runner/'+f+'"');
  for(const f of ['warflying-board.js','ad-screens-data.js','ad-screens.js'])assert.ok(at(f)>0,f);
  assert.ok(at('warflying-board.js')<at('warflying-scan.js'));assert.ok(at('ad-screens-data.js')<at('ad-screens.js')&&at('ad-screens.js')<at('neochinatown.js')&&at('ad-screens.js')<at('relay-screens.js'));
  assert.ok(fs.readFileSync(path.join(__dirname,'../void-runner/personal-device.js'),'utf8').includes('X.standings()'));
});
