/* EVERY LOCATION NEEDS A NAME (the owner, 18 Nov 2026), the photo METADATA and the device ID.
   - every walkable sample point (a 1 m grid over the streets of each quarter, the gates, the District's rooms, NULL, Milked's rooms, the terrace, the Corporate District,
     the Temple plateau and the VR rooms) resolves to a NAMED EXACT LOCATION;
   - the hierarchy is valid (System > Planet > City > Area > Venue > Exact location);
   - the device ID is stable and does not leak the account id;
   - the metadata is recorded at capture (cleanMeta keeps the device ID, place and time; nothing about the photographer but the device ID);
   - the one-time fresh start empties only the Gallery's photos. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../void-runner/places.js'),QT=require('../void-runner/ncz-quarters.js'),MK=require('../void-runner/milked.js'),NC=require('../void-runner/ncz-nightclub.js');
const CO=require('../void-runner/corporate.js'),TP=require('../void-runner/temple.js'),D=require('../void-runner/device-v1.js'),G=require('../void-runner/device-gallery.js');
const grid=([x0,x1,z0,z1],step=1,m=.25)=>{const out=[];for(let x=x0+m;x<=x1-m+1e-9;x+=step)for(let z=z0+m;z<=z1-m+1e-9;z+=step)out.push([x,z]);out.push([(x0+x1)/2,(z0+z1)/2]);return out;};
const DOOR=P.DISTRICT_DOOR,local=([x0,x1,z0,z1])=>[DOOR.x-x1,DOOR.x-x0,DOOR.z+20-z1,DOOR.z+20-z0];
// The District's rooms as neochinatown.js walls them (local plan).
const DISTRICT_ROOMS={vestibule:[-3,3,20,26],hall:[-3,3,26,70.5],pods:[-17,17,70.5,78.3],vr:[-17,-3,28,44],vending:[-7,-3,46.5,52.5],arcade:[-10.5,-3,57.5,66.5],bar:[3,17,28,42],store:[3,17,43,53],meeting:[3,15,56,69]};
function walkable(){const out=[];
 for(const q of QT.IDS)for(const r of QT.QUARTERS[q].streets)out.push(['neochinatown',r,q]);
 for(const g of QT.GATES)out.push(['neochinatown',g.rect,'gate '+g.id]);
 for(const [k,r] of Object.entries(DISTRICT_ROOMS))out.push(['neochinatown',local(r),'district '+k]);
 out.push(['neochinatown',[78.4,99.4,-116.4,-95.4],'terrace']);
 out.push(['neochinatown',NC.HALL,'NULL hall'],['neochinatown',NC.ENTRY.rect,'NULL entry']);
 for(const r of MK.ROOMS)out.push(['neochinatown',r.rect,'Milked '+r.id]);
 for(const s of CO.STREETS)out.push(['corporate',s.rect,'corporate '+s.id]);
 out.push(['temple',TP.PLATEAU,'temple plateau']);
 for(const v of ['vr-suite','vr-tropical','vr-forest','vr-combat'])out.push([v,[-2,2,-2,2],v]);
 return out;}
test('every walkable sample point resolves to a named exact location',()=>{let n=0;const bad=[];
 for(const [scene,r,what] of walkable())for(const [x,z] of grid(r,(r[1]-r[0])*(r[3]-r[2])>4000?2:1)){n++;const id=P.deepest({scene,x,z}),node=P.node(id);
  if(!node||node.level!=='place'||!node.name||node.group)bad.push(what+' ('+x.toFixed(1)+', '+z.toFixed(1)+') -> '+id);}
 assert.ok(n>5000,'a real sample: '+n);assert.deepEqual(bad.slice(0,12),[],bad.length+' unnamed points');});
test('the right names in the right places (spot checks)',()=>{
 const at=(scene,x,z)=>P.deepest({scene,x,z}),dl=(x,z)=>[DOOR.x-x,DOOR.z+20-z];
 assert.equal(at('neochinatown',...dl(10,35)),'district-bar');assert.equal(at('neochinatown',...dl(0,23)),'district-vestibule');assert.equal(at('neochinatown',...dl(-5,49)),'district-vending');
 assert.equal(at('neochinatown',31,-50),'null-bar');assert.equal(at('neochinatown',23.5,-58.6),'null-dj');assert.equal(at('neochinatown',38,-67),'null-vip');assert.equal(at('neochinatown',48,-58.5),'null-entrance');assert.equal(at('neochinatown',35,-58),'null-floor');
 for(const r of MK.ROOMS){const c=[(r.rect[0]+r.rect[1])/2,(r.rect[2]+r.rect[3])/2];assert.equal(at('neochinatown',...c),'milked-'+r.id,r.id);}
 assert.equal(at('neochinatown',79.5,-235),'kai-home');assert.equal(at('neochinatown',61,-23),'gate-north');assert.equal(at('neochinatown',61,-221),'gate-far-south');
 assert.equal(at('neochinatown',24,-96),'landing-pad');assert.equal(at('corporate',0,-18),'corp-taxi');assert.equal(at('temple',0,-20),'temple-path');assert.equal(at('vr-tropical',3,4),'vr-tropical');
 assert.equal(P.chain('district-bar'),'The Bar · The Darknet District · Old Town · NeoChinatown · Servo · Tessaly System','the city on the planet Servo');
 assert.equal(P.chain('nowhere'),'');});
test('the hierarchy is valid: System > Planet > City > Area > Venue > Exact location',()=>{
 const ids=new Set();for(const n of P.NODES){assert.ok(/^[a-z][a-z0-9-]{0,63}$/.test(n.id),n.id);assert.ok(!ids.has(n.id),'unique '+n.id);ids.add(n.id);assert.ok(typeof n.name==='string'&&n.name.trim(),n.id+' has a name');
  assert.ok(n.level in P.LEVEL_INDEX,n.id+' level');
  if(n.parent===null){assert.equal(n.level,'system');continue;}const p=P.node(n.parent);assert.ok(p,n.id+' parent '+n.parent);
  const a=P.LEVEL_INDEX[p.level],b=P.LEVEL_INDEX[n.level];assert.ok(b>a||(b===a&&n.level==='place'),n.id+' ('+n.level+') under '+p.id+' ('+p.level+')');
  assert.ok(P.parents(n.id).length<12,'no cycle');if(n.scene&&p.scene&&!p.group)assert.equal(n.scene,p.scene,n.id+' in its parent\'s scene');}
 for(const n of P.NODES)if(!P.NODES.some(c=>c.parent===n.id)&&!n.group)assert.equal(n.level,'place',n.id+' (a leaf) is an exact location');
 assert.deepEqual(P.path('district-bar').map(id=>P.node(id).level),['system','planet','city','area','venue','place']);
 // the ids missions already use are all still there
 for(const id of ['tessaly','neochinatown','port','oldtown','avenue','far-south','outskirts','corporate','temple','gates','district','district-vestibule','district-hall','district-pods','district-vr','district-arcade','district-store','district-bar','district-meeting','district-alley','null','null-entrance','milked','gate-customs','gate-north','gate-function','gate-east','gate-south','gate-far-south'])assert.ok(P.node(id),id);
 // a working name is marked PROPOSED; an existing name says where it comes from
 for(const n of P.NODES)assert.ok(n.proposed||n.src,n.id+': proposed or a source');
 const opts=P.options();assert.ok(opts.every(o=>o.label.split(' › ').length===o.depth+1));assert.ok(opts.some(o=>o.proposed));});
test('the shopfronts are the city\'s own shop signs',()=>{const src=fs.readFileSync('void-runner/neochinatown.js','utf8'),signs=src.match(/const shopSigns=(\[.*?\]\]\]);/)[1],words=new Set(eval(signs).map(([l])=>l[l.length-1]));
 assert.ok(P.SHOPFRONTS.length>=40,'signs read from the built city: '+P.SHOPFRONTS.length);for(const [w] of P.SHOPFRONTS)assert.ok(words.has(w),w);
 const shops=P.NODES.filter(n=>n.shop);assert.equal(shops.length,P.SHOPFRONTS.length,'every shopfront has a place');for(const s of shops)assert.equal(P.node(s.parent).level,'place');});
test('the device ID: V1-XXXX-XXXX, stable across reloads, never the account id',()=>{
 const account='Xq9ZkA1bc2uidSECRET7',flags={campaignEpoch:3};const serial=D.ensureSerial(flags,{account,epoch:3});
 assert.match(serial,D.SERIAL);assert.equal(flags.deviceSerial,serial);const id=D.deviceId(serial,'v1');assert.match(id,D.DEVICE_ID);assert.match(id,/^V1-[0-9A-F]{4}-[0-9A-F]{4}$/);
 // stable: a reload (the save's flags as JSON) keeps it; asking again changes nothing
 const again=JSON.parse(JSON.stringify(flags));assert.equal(D.ensureSerial(again,{account,epoch:3}),serial);assert.equal(D.deviceId(again.deviceSerial,'v1'),id);
 assert.equal(D.deviceId(serial,'v3'),'V3-'+id.slice(3),'a later model keeps the serial, with its own prefix');
 // not the account: nothing of it in the ID, and the same account gets unrelated IDs in two campaigns (a one-time random number): a guessed account cannot be checked
 for(const part of [account,account.slice(0,4),account.toLowerCase().slice(0,4)])assert.ok(!id.toLowerCase().includes(part.toLowerCase()));
 const other={};D.ensureSerial(other,{account,epoch:3});assert.notEqual(other.deviceSerial,serial);
 assert.notEqual(D.makeSerial({account,epoch:3,nonce:'a'}),D.makeSerial({account,epoch:3,nonce:'b'}));
 // a malformed serial is replaced; the save validator accepts it (a short string in story.flags)
 const bad={deviceSerial:'<x>'};assert.match(D.ensureSerial(bad,{}),D.SERIAL);assert.equal(D.deviceId('nope','v1'),null);
 assert.ok(serial.length<=200&&typeof serial==='string');});
test('the metadata is recorded at capture: who, where, the device ID and the in-game time; the photographer stays anonymous',()=>{
 const cam=fs.readFileSync('void-runner/device-camera.js','utf8');assert.match(cam,/device=deviceIdNow\(\)/,'capture() records the device ID');assert.match(cam,/via:t\.who\?\.key/,'each tag says how it was identified');
 assert.doesNotMatch(cam.slice(cam.indexOf('function capture')),/VoidAccount\?\.handle/,'no handle in a capture');
 const m=G.cleanMeta({subjects:[{id:'juno-vex',name:'Juno Vex',valid:true,dist:6.24}],place:'null-bar',during:[],at:1,gameMin:51,gameTime:'21:51 · DAY 1',device:'V1-7F3A-91C2',handle:'Zed',uid:'abc',email:'a@b'});
 assert.equal(m.device,'V1-7F3A-91C2');assert.equal(m.place,'null-bar');assert.equal(m.gameTime,'21:51 · DAY 1');assert.equal(m.postedBy,'');
 for(const k of ['handle','uid','email','player','account'])assert.ok(!(k in m),'never kept: '+k);
 assert.equal(G.cleanMeta({subjects:[],device:'7F3A91C2'}).device,'','only a real device ID');
 const photo={tags:G.cleanTags([{name:'Juno Vex',role:'',kind:'npc',via:'subject'},{name:'Nyx',role:'Bartender',kind:'npc',via:'resident'}]),meta:m};
 const rows=G.metadata(photo,{placeLabel:P.chain});assert.deepEqual(rows.map(r=>r.label),['TAGGED','LOCATION','DEVICE ID','TAKEN'],'POSTED ONLINE BY shows only when set');
 assert.equal(rows[0].rows[0].name,'Juno Vex');assert.equal(rows[0].rows[0].how,'Camera identification');assert.match(rows[0].rows[0].detail,/clear shot · 20 ft/);assert.equal(rows[0].rows[1].how,'District resident registry');
 assert.equal(rows[1].value,'Bar · NULL · Old Town · NeoChinatown · Servo · Tessaly System');assert.equal(rows[2].value,'V1-7F3A-91C2');assert.equal(rows[3].value,'21:51 · DAY 1');
 const posted=G.metadata({...photo,meta:{...m,postedBy:'Zed_9'}},{placeLabel:P.chain});assert.equal(posted[4].label,'POSTED ONLINE BY');assert.equal(posted[4].value,'@Zed_9');});
test('the fresh start: once, and only the Gallery\'s photos',()=>{
 const mock=stores=>{const log=[];return {log,db:{objectStoreNames:{contains:n=>stores.includes(n)},createObjectStore:(n)=>{log.push('create '+n);stores.push(n);}},tx:{objectStore:n=>({clear:()=>log.push('clear '+n)})}};};
 let m=mock(['photos']);assert.equal(G.upgrade(m.db,m.tx,1),'cleared');assert.deepEqual(m.log,['clear photos'],'version 1 (photos taken before this update): emptied');
 m=mock([]);assert.equal(G.upgrade(m.db,m.tx,0),'created');assert.deepEqual(m.log,['create photos'],'a new browser: nothing to clear');
 m=mock(['photos']);assert.equal(G.upgrade(m.db,m.tx,2),'kept');assert.deepEqual(m.log,[],'already done: never again');
 assert.equal(G.DB_VERSION,2);assert.equal(G.STORE,'photos');assert.equal(G.DB,'void-runner-gallery');
 const src=fs.readFileSync('void-runner/device-gallery.js','utf8');assert.match(src,/indexedDB\.open\(DB,DB_VERSION\)/);assert.doesNotMatch(src,/deleteDatabase|localStorage\.clear|removeItem/,'nothing else is removed');});
