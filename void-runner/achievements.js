/* Catalog and rules only. Unlocking needs server-verified events; this client never grants rewards. */
(function(root){
 const definitions=Object.freeze([
  {id:'district-first-visit',name:'District Arrival',description:'Visit The Darknet District.',icon:'◇',category:'district',condition:{event:'location_discovered',field:'location',equals:'darknet-district',count:1},hidden:false,rarity:null,reward:null},
  {id:'blackout-score',name:'Blackout Specialist',description:'Reach a verified Blackout Protocol score.',icon:'◆',category:'arcade',condition:{event:'arcade_score_verified',field:'game',equals:'blackout-protocol',count:1},hidden:false,rarity:null,reward:null},
  {id:'rook-three-runs',name:'Reliable Courier',description:'Complete three cargo missions for Rook.',icon:'◈',category:'district',condition:{event:'cargo_mission_completed',field:'giver',equals:'rook',count:3},hidden:false,rarity:null,reward:null},
  {id:'tropical-100-fish',name:'Catch 100 Fish',description:'Catch 100 fish in Tropical Escape.',icon:'◍',category:'arcade',condition:{event:'vr_fish_landed',field:'world',equals:'tropical',count:100},hidden:false,rarity:null,reward:null},
  {id:'official-shirt',name:'District Supporter',description:'Purchase an official District T-shirt.',icon:'✦',category:'merchandise',condition:{event:'merchandise_purchase_verified',field:'product',equals:'official-shirt',count:1},hidden:false,rarity:null,reward:null}
 ]);
 const categories=Object.freeze(['all','merchandise','district','arcade','community']);
 const valid=d=>!!d&&/^[a-z][a-z0-9-]{1,63}$/.test(d.id)&&typeof d.name==='string'&&typeof d.description==='string'&&typeof d.condition?.event==='string'&&Number.isSafeInteger(d.condition.count)&&d.condition.count>0;
 function preview(def,events=[]){if(!valid(def))return null;const matched=events.filter(e=>e?.verified===true&&e?.type===def.condition.event&&e?.data?.[def.condition.field]===def.condition.equals);return {id:def.id,progress:Math.min(matched.length,def.condition.count),target:def.condition.count,unlocked:matched.length>=def.condition.count};}
 function publicDisplay(defs=definitions,unlocks=[],category='all',featured=[]){const byId=new Map(defs.map(d=>[d.id,d]));const chosen=featured.slice(0,3),available=unlocks.filter(u=>u&&u.verified===true&&Number.isSafeInteger(u.unlockedAt)&&u.unlockedAt>0&&byId.has(u.id)).map(u=>({...byId.get(u.id),unlockedAt:u.unlockedAt})).filter(d=>!d.hidden||chosen.includes(d.id));const order={merchandise:0,district:1,arcade:2,community:3};return available.filter(d=>category==='all'||d.category===category).sort((a,b)=>(order[a.category]??9)-(order[b.category]??9)||(chosen.includes(b.id)?1:0)-(chosen.includes(a.id)?1:0)||a.unlockedAt-b.unlockedAt);}
 const api={definitions,categories,valid,preview,publicDisplay};if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidAchievements=api;
})(typeof globalThis!=='undefined'?globalThis:this);
