'use strict';
/* The District chat store (void-runner/district-chat.js) with a MOCKED multiplayer service: unread counting, duplicates, ordering, listeners, slash commands.
   Live two-client chat through the real hub is tests/district-chat-browser.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
function fresh(){
 const listeners=new Set(),calls=[];
 const rp={me:'aaaaaaaaaaaa',connected:true,features:{chat:true},peers:[{id:'bbbbbbbbbbbb',name:'Ben_K'}],
  onChat(fn){listeners.add(fn);return()=>listeners.delete(fn);},sendChat(t){calls.push(['send',t]);return true;},setIgnore(id,m,n){calls.push(['ignore',id,m]);return true;}};
 globalThis.VoidRemotePlayers=rp;globalThis.addEventListener=()=>{};delete globalThis.VoidDistrictChat;delete globalThis.document;
 delete require.cache[require.resolve('../void-runner/district-chat.js')];require('../void-runner/district-chat.js');
 const C=globalThis.VoidDistrictChat;C.boot();return {C,rp,listeners,calls,send:m=>{for(const f of [...listeners])f(m);}};
}
const msg=(id,name,text,at)=>({t:'chat',id,name,text,at});
test('messages are kept in arrival order and counted as unread when the V1 is not showing the chat',()=>{
 const {C,send}=fresh();send(msg('bbbbbbbbbbbb','Ben_K','one',1000));send(msg('cccccccccccc','Cy','two',1001));send(msg('bbbbbbbbbbbb','Ben_K','three',1002));
 assert.deepEqual(C.lines.map(l=>l.text),['one','two','three']);assert.ok(C.lines.every((l,i,a)=>!i||l.seq>a[i-1].seq));assert.equal(C.unread,3);
 C.markRead();assert.equal(C.unread,0);assert.equal(C.lines.length,3,'reading does not delete anything');
});
test('my own messages are never unread; messages seen while viewing are read at once; opening the chat clears the count',()=>{
 const {C,send}=fresh();send(msg('aaaaaaaaaaaa','Me','mine',1));assert.equal(C.unread,0);assert.equal(C.lines[0].kind,'me');
 send(msg('bbbbbbbbbbbb','Ben_K','a',2));assert.equal(C.unread,1);C.setViewing(true);assert.equal(C.unread,0,'viewing clears');
 send(msg('bbbbbbbbbbbb','Ben_K','b',3));assert.equal(C.unread,0,'read while on screen');C.setViewing(false);send(msg('bbbbbbbbbbbb','Ben_K','c',4));assert.equal(C.unread,1);
});
test('rapid messages: every one is counted exactly once; a repeated delivery is ignored',()=>{
 const {C,send}=fresh();for(let i=0;i<250;i++)send(msg('bbbbbbbbbbbb','Ben_K','m'+i,5000+i));assert.equal(C.unread,250);assert.equal(C.lines.length,100,'the session keeps the latest 100');assert.equal(C.lines.at(-1).text,'m249');
 const before=C.lines.length,un=C.unread;send(msg('bbbbbbbbbbbb','Ben_K','m249',5249));assert.equal(C.lines.length,before);assert.equal(C.unread,un,'duplicate: no new line, no new unread');
 send(msg('bbbbbbbbbbbb','Ben_K','m249',5300));assert.equal(C.unread,un+1,'the same words at another time are a new message');assert.equal(C.lines.length,100);
});
test('exactly one multiplayer listener, however many times the store is started again',()=>{
 const {C,listeners}=fresh();assert.equal(listeners.size,1);C.boot();C.boot();C.boot();assert.equal(listeners.size,1);assert.equal(C.hubListener,true);
 const calls=[];const off=C.onChange(()=>calls.push(1));assert.equal(C.listeners,1);off();assert.equal(C.listeners,0);
});
test('refusals, reports and connection changes become notes, never unread chat',()=>{
 const {C,send}=fresh();send({t:'chat-refused',reason:'Slow down.'});send({t:'chat-status',on:false});send({t:'chat-status',on:true});
 assert.deepEqual(C.lines.map(l=>l.kind),['sys','sys','sys']);assert.equal(C.unread,0);assert.match(C.lines[1].text,/Disconnected/);assert.match(C.lines[2].text,/Connected/);
 send({t:'reported'});assert.match(C.note,/server log/);assert.doesNotMatch(C.note,/permanent(ly)? stored|kept forever/i);assert.match(C.note,/not stored as a permanent case file/);
 send({t:'report-refused',reason:'Too many reports.'});assert.equal(C.note,'Too many reports.');
});
test('session continuity: lines from before a reconnect stay, and a new session marker is added',()=>{
 const {C,send}=fresh();send(msg('bbbbbbbbbbbb','Ben_K','before',1));send({t:'chat-status',on:false});send({t:'chat-status',on:true});send(msg('bbbbbbbbbbbb','Ben_K','after',2));
 assert.deepEqual(C.lines.map(l=>l.text).filter(t=>/before|after/.test(t)),['before','after']);assert.equal(C.unread,2);
});
test('slash commands are never sent as chat; plain text is; commands keep working',()=>{
 const {C,calls,rp}=fresh();assert.deepEqual(C.submit('hello'),{ok:true});assert.deepEqual(calls.at(-1),['send','hello']);
 assert.equal(C.submit('/players').players,true);assert.ok(!calls.some(c=>c[0]==='send'&&c[1]==='/players'));
 C.submit('/mute ben_k');assert.deepEqual(calls.at(-1),['ignore','bbbbbbbbbbbb','mute']);C.submit('/block ben_k');assert.deepEqual(calls.at(-1),['ignore','bbbbbbbbbbbb','block']);C.submit('/unblock BEN_K');assert.deepEqual(calls.at(-1),['ignore','bbbbbbbbbbbb',null]);
 C.submit('/mute nobody');assert.match(C.lines.at(-1).text,/No player named/);assert.deepEqual(C.submit('   '),{ok:false});
 rp.sendChat=()=>false;const r=C.submit('hi');assert.equal(r.ok,false);assert.match(r.text,/Not connected/);
});
test('text is stored as plain text for the screen to escape (no markup is interpreted here)',()=>{
 const {C,send}=fresh();send(msg('bbbbbbbbbbbb','<b>x</b>','<img src=x onerror=alert(1)>',1));assert.equal(C.lines[0].text,'<img src=x onerror=alert(1)>');assert.equal(C.lines[0].name,'<b>x</b>');
});
