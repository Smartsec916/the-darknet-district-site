/* Local NPC transcript only. Player messages require an authenticated server. */
(function(root){
 const prefix='tdd:npc-conversations:v1:';
 const safe=s=>String(s??'').slice(0,300);
 function key(uid){return prefix+encodeURIComponent(safe(uid)||'guest');}
 function read(store,uid){try{const rows=JSON.parse(store.getItem(key(uid))||'[]');return Array.isArray(rows)?rows.filter(r=>r&&typeof r.character==='string'&&typeof r.text==='string'&&Number.isSafeInteger(r.at)&&r.at>0).slice(-150):[];}catch{return [];}}
 function append(store,uid,entry){const rows=read(store,uid),row={character:safe(entry.character),name:safe(entry.name),text:safe(entry.text),place:safe(entry.place),at:Number.isSafeInteger(entry.at)?entry.at:Date.now(),read:false};if(!row.character||!row.text)return rows;rows.push(row);try{store.setItem(key(uid),JSON.stringify(rows.slice(-150)));}catch{}return rows.slice(-150);}
 function markRead(store,uid){const rows=read(store,uid);for(const row of rows)row.read=true;try{store.setItem(key(uid),JSON.stringify(rows));}catch{}return rows;}
 function filter(rows,kind='all',character){let result=rows;if(character)result=result.filter(r=>r.character===character);if(kind==='unread')result=result.filter(r=>!r.read);if(kind==='recent')result=result.slice(-20);return result;}
 const api={key,read,append,markRead,filter};if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidConversationHistory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
