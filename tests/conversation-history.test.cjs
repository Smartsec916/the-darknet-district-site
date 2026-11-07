const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../void-runner/conversation-history.js');
test('NPC history is scoped to an identity and supports social filters',()=>{
 const values=new Map(),store={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 H.append(store,'pilot-a',{character:'iris',name:'Iris',text:'Hello',place:'earth',at:1000});
 H.append(store,'pilot-a',{character:'admin',name:'Admin',text:'Welcome',place:'earth',at:2000});
 assert.equal(H.read(store,'pilot-b').length,0);
 assert.deepEqual(H.filter(H.read(store,'pilot-a'),'all','iris').map(x=>x.text),['Hello']);
 assert.equal(H.filter(H.read(store,'pilot-a'),'unread').length,2);
 H.markRead(store,'pilot-a');assert.equal(H.filter(H.read(store,'pilot-a'),'unread').length,0);
});
