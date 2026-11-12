/* Shared VR sessions on the hub: public discovery and joining, private sessions that only a join code opens, and what happens when people leave. */
const test=require('node:test'),assert=require('node:assert/strict');
const {Hub,parse,VR}=require('../tools/district-hub/protocol.cjs');
function rig(){let now=1e6;const sent=new Map();
 const hub=new Hub({send:(c,m)=>{(sent.get(c)||sent.set(c,[]).get(c)).push(m);},close:()=>{},now:()=>now});
 const join=(c,uid,extra={})=>{hub.join(c,{t:'hello',token:'x',room:'district-interior'},{uid,anonymous:false,model:'district-resident',handle:uid.replace('-','_')+'_x',...extra});hub.state(c,{t:'state',x:1,z:1,yaw:0});now+=200;};
 return {hub,join,adv:ms=>{now+=ms;},msgs:c=>sent.get(c)||[],last:(c,t)=>(sent.get(c)||[]).filter(m=>!t||m.t===t).at(-1),clear:()=>sent.clear()};}
const create=(priv,exp='forest')=>({t:'vr-create',exp,opts:'{}',private:priv});

test('only well-formed session messages parse',()=>{
 for(const ok of ['{"t":"vr-list"}','{"t":"vr-leave"}','{"t":"vr-create","exp":"forest","opts":"{\\"scene\\":\\"dusk\\"}","private":true}','{"t":"vr-join","id":"0123456789ab"}','{"t":"vr-join","code":"ABCD-EFGH"}'])assert(parse(ok),ok);
 for(const bad of ['{"t":"vr-create","exp":"Forest!","opts":"{}","private":true}','{"t":"vr-create","exp":"forest","opts":"{}","private":"yes"}','{"t":"vr-create","exp":"forest","opts":"[1]","private":false}','{"t":"vr-create","exp":"forest","opts":"{\\"a\\":{\\"b\\":1}}","private":false}','{"t":"vr-create","exp":"forest","opts":"{}","private":false,"owner":"me"}','{"t":"vr-join","id":"../x"}','{"t":"vr-join","id":"0123456789ab","code":"x"}','{"t":"vr-list","all":true}'])assert.equal(parse(bad),null,bad);
});
test('a public session is listed, joinable, and its members see each other but not the District',()=>{
 const r=rig();r.join('a','uid-a');r.join('b','uid-b');r.join('c','uid-c');r.clear();
 assert(r.hub.vrCreate('a',create(false)).ok);const mine=r.last('a','vr-room');assert.equal(mine.session.private,false);assert.equal(mine.session.code,undefined);assert.deepEqual(mine.peers,[]);
 assert.equal(r.last('b','leave').id,r.hub.byConn.get('a').id,'the District sees the player go');
 r.hub.vrList('b');const list=r.last('b','vr-sessions').list;assert.equal(list.length,1);assert.equal(list[0].count,1);assert.equal(list[0].cap,VR.cap);assert.equal(list[0].exp,'forest');assert.equal(list[0].code,undefined);
 r.hub.state('a',{t:'state',x:500,z:900,yaw:0});r.clear();   // a VR world has its own coordinates
 assert(r.hub.vrJoin('b',{t:'vr-join',id:list[0].id}).ok);assert.equal(r.last('b','vr-room').peers.length,1,'the joiner is handed who is already inside');
 r.hub.state('b',{t:'state',x:501,z:900,yaw:0});assert.equal(r.last('a','join').peer.id,r.hub.byConn.get('b').id);
 assert(!r.msgs('c').some(m=>m.t==='join'||m.t==='state'),'someone still in the District sees nothing of the session');
 r.adv(200);r.hub.state('c',{t:'state',x:2,z:2,yaw:0});assert(!r.msgs('a').some(m=>m.t==='state'&&m.id===r.hub.byConn.get('c').id),'and the session sees nothing of the District');
});
test('a private session is never listed and cannot be entered by its id, only with its code',()=>{
 const r=rig();r.join('a','uid-a');r.join('b','uid-b');r.clear();
 r.hub.vrCreate('a',create(true));const s=r.last('a','vr-room').session;assert.match(s.code,VR.code);assert.equal(s.private,true);
 r.hub.vrList('b');assert.deepEqual(r.last('b','vr-sessions').list,[]);
 assert.equal(r.hub.vrJoin('b',{t:'vr-join',id:s.id}).ok,false);const refused=r.last('b','vr-refused').reason;
 assert.equal(r.hub.vrJoin('b',{t:'vr-join',id:'ffffffffffff'}).ok,false);assert.equal(r.last('b','vr-refused').reason,refused,'a private session answers exactly like one that does not exist');
 assert.equal(r.hub.vrJoin('b',{t:'vr-join',code:'AAAAAAAA'}).ok,false);
 assert(r.hub.vrJoin('b',{t:'vr-join',code:s.code.toLowerCase().replace(/(.{4})/,'$1-')}).ok,'the code works, however it was typed');
 assert.equal(r.last('b','vr-room').session.id,s.id);
 // whoever was let in may come back by id while the session lives (a reconnect); it stays unlisted
 r.hub.vrLeave('b');assert.equal(r.last('b','vr-room').session,null);assert(r.hub.vrJoin('b',{t:'vr-join',id:s.id}).ok);
 r.hub.vrList('b');assert.deepEqual(r.last('b','vr-sessions').list,[]);
});
test('wrong codes are limited, codes expire, guests and full sessions are refused',()=>{
 const r=rig();r.join('a','uid-a');r.join('b','uid-b');r.join('g','uid-g',{anonymous:true});
 r.hub.vrCreate('a',create(true));const s=r.last('a','vr-room').session;
 for(let i=0;i<VR.badCodes;i++)r.hub.vrJoin('b',{t:'vr-join',code:'BBBBBBB'+'23456'[i]});
 assert.equal(r.hub.vrJoin('b',{t:'vr-join',code:s.code}).ok,false,'even the right code is refused while locked out');assert.match(r.last('b','vr-refused').reason,/Too many/);
 r.adv(VR.badCodeWindowMs+1);assert(r.hub.vrJoin('b',{t:'vr-join',code:s.code}).ok);
 assert.equal(r.hub.vrCreate('g',create(false)).ok,false);assert.equal(r.hub.vrJoin('g',{t:'vr-join',code:s.code}).ok,false);
 r.join('c','uid-c');r.adv(VR.codeMs);assert.equal(r.hub.vrJoin('c',{t:'vr-join',code:s.code}).ok,false,'an old code no longer opens the session');
 const q=rig();q.join('o','uid-o');q.hub.vrCreate('o',create(false));const id=q.last('o','vr-room').session.id;
 for(let i=1;i<VR.cap;i++){q.join('m'+i,'uid-m'+i);assert(q.hub.vrJoin('m'+i,{t:'vr-join',id}).ok);}
 q.join('late','uid-late');assert.equal(q.hub.vrJoin('late',{t:'vr-join',id}).ok,false);assert.match(q.last('late','vr-refused').reason,/full/);
});
test('the creator leaving passes the session on; it ends when the last member leaves; a dropped connection counts as leaving',()=>{
 const r=rig();r.join('a','uid-a');r.join('b','uid-b');r.hub.vrCreate('a',create(false));const id=r.last('a','vr-room').session.id;r.hub.vrJoin('b',{t:'vr-join',id});
 r.hub.state('a',{t:'state',x:5,z:5,yaw:0});r.hub.state('b',{t:'state',x:6,z:5,yaw:0});r.clear();
 r.hub.vrLeave('a');assert.equal(r.last('b','leave').id,r.hub.byConn.get('a').id);assert.equal(r.last('b','vr-update').session.count,1);assert.equal(r.hub.sessions.get(id).owner,'uid-b');
 assert.equal(r.last('a','vr-room').session,null,'the creator is back in the District');
 r.hub.closed('b');assert.equal(r.hub.sessions.size,0,'an empty session is removed');
 r.hub.vrList('a');assert.deepEqual(r.last('a','vr-sessions').list,[]);
 r.adv(VR.createEveryMs);assert(r.hub.vrCreate('a',create(false)).ok);assert.equal(r.hub.vrCreate('a',create(false)).ok,false,'sessions cannot be opened in a burst');
});
