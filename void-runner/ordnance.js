/* Ship missiles (the owner, 19 Nov 2026): the launcher rails carry two missile types. M1 is the standard round (turns hard, smaller warhead); M2 is the upgrade
   (bigger warhead and blast, turns slowly, so an agile target can out-turn it). The lasers never run out; missiles do. Pure rules: Node and the browser.
   Saved (tolerant, validated by void_runner_progression.py): progression.missiles = M1 rounds (null: a full rack, as before), progression.m2 = M2 rounds,
   progression.missileType = the selected type ('m1' / 'm2'); story.flags.loadoutApp = the Ship Loadout app is on the player's V1 (granted with a ship).
   Prices, damage, turning, speed and blast are balance values (balance-data.js), so the owner can change them in Developer Tools > Combat Balance. */
(function(root){
 const S=typeof module!=='undefined'?require('./ships.js'):root.VoidShips;
 const B=()=>typeof module!=='undefined'?require('./balance.js').values:(root.VOID_BALANCE||{});
 const TYPES={
  m1:{id:'m1',name:'M1',title:'M1 SEEKER',role:'Standard round. Turns hard and stays on an agile target; smaller warhead.',keys:{damage:'missileM1Damage',turn:'missileM1TurnRate',speed:'missileM1Speed',blast:'missileM1Blast',price:'missileM1Price'}},
  m2:{id:'m2',name:'M2',title:'M2 HEAVY',role:'Upgraded round. Bigger warhead and blast; turns slowly, so a hard-turning target can slip it.',keys:{damage:'missileM2Damage',turn:'missileM2TurnRate',speed:'missileM2Speed',blast:'missileM2Blast',price:'missileM2Price'}}};
 const IDS=Object.keys(TYPES),MAX=30;
 // How far off its nose (radians) the seeker head still sees the target. Past this the round flies on unguided: a target that out-turns it is missed.
 const SEEKER=1.15;
 const shipOf=s=>S.get(s);
 const hasShip=s=>!!s&&S.hasShip(s)&&Array.isArray(s.ownedShips)&&s.ownedShips.length>0;
 /* Rack size per type: M1 fills the ship's missile capacity (Kestrel 6); M2 rounds are bigger, half as many (at least 2). */
 function capacity(s,type,ship=shipOf(s)){const c=Math.max(1,Math.floor(ship?.missile?.capacity||6));return Math.min(MAX,type==='m2'?Math.max(2,Math.floor(c/2)):c);}
 const launcher=s=>!!s&&Array.isArray(s.creditGear)&&s.creditGear.includes('launcher');
 const equipped=s=>launcher(s)&&s.loadout?.missile==='launcher';
 function counts(s){const p=s?.progression||{},ship=shipOf(s),c1=capacity(s,'m1',ship),c2=capacity(s,'m2',ship);
  const n=v=>Number.isFinite(v)?Math.max(0,Math.floor(v)):0;return {m1:Math.min(c1,p.missiles==null?c1:n(p.missiles)),m2:Math.min(c2,n(p.m2))};}
 const selected=s=>s?.progression?.missileType==='m2'?'m2':'m1';
 function select(s,type){if(!TYPES[type]||!s?.progression)return false;s.progression.missileType=type;return true;}
 function set(s,type,value){const v=Math.max(0,Math.min(capacity(s,type),Math.floor(value)||0));if(type==='m2')s.progression.m2=v;else s.progression.missiles=v;return v;}
 /* One type's flight values, scaled by the hull's missile multiplier (ships.js missile.damage). */
 function spec(type,balance=B(),ship=null){const t=TYPES[type]||TYPES.m1,k=t.keys,mul=ship?.missile?.damage||1;
  return {type:t.id,damage:balance[k.damage]*mul,turn:balance[k.turn],speed:balance[k.speed],blast:balance[k.blast],fuse:balance[k.blast]*.6,seeker:SEEKER,lead:true,lifetime:balance.missileLifetime,range:balance.missileRange};}
 const price=(type,balance=B())=>Math.max(0,Math.round(balance[(TYPES[type]||TYPES.m1).keys.price]||0));
 /* The flight's missile state (flight-runtime-integration.js missileSource): both racks, the selected type's rounds as missilesLoaded. */
 function rack(s,ship=shipOf(s)){const c=counts(s),type=c[selected(s)]>0||c.m1+c.m2===0?selected(s):(c.m1?'m1':'m2');
  return {type,rack:{m1:{loaded:c.m1,capacity:capacity(s,'m1',ship)},m2:{loaded:c.m2,capacity:capacity(s,'m2',ship)}}};}
 /* A ship comes with its missile rails: the launcher (fitted), a full M1 rack, and the Ship Loadout app on the V1. Idempotent. shipId: a hull just added. */
 function grant(s,shipId){
  if(!s?.story?.flags||!s.progression)return false;let changed=false;
  if(!launcher(s)){s.creditGear=[...(Array.isArray(s.creditGear)?s.creditGear:[]),'launcher'];if(s.progression.missiles==null||s.progression.missiles<capacity(s,'m1'))s.progression.missiles=capacity(s,'m1');changed=true;}
  if(s.story.flags.loadoutApp!==true){s.loadout={...(s.loadout||{}),missile:'launcher'};if(s.shipLoadouts&&s.activeShip)s.shipLoadouts[s.activeShip]={...(s.shipLoadouts[s.activeShip]||{}),...s.loadout};s.story.flags.loadoutApp=true;changed=true;}
  if(shipId&&s.shipLoadouts?.[shipId]&&!s.shipLoadouts[shipId].missile){s.shipLoadouts[shipId].missile='launcher';changed=true;}
  if(s.progression.missileType!=='m2'&&s.progression.missileType!=='m1'){s.progression.missileType='m1';changed=true;}
  return changed;}
 /* Saves that already own a ship (the developer test ship, a ship from an earlier mission) get the same rails and app once. A campaign with no ship is untouched. */
 function migrate(s){const f=s?.story?.flags;if(!f||f.loadoutApp===true||!hasShip(s)||!(f.missionPool==='closed'||f.shipAccess==='granted'||f.starterShipAwarded===true))return false;return grant(s);}   // District campaigns only: older campaigns keep Rook's launcher offer
 /* Admin's counter. Returns null when the purchase can go ahead, or the plain reason it cannot. */
 function canBuy(s,type,n=1,balance=B()){
  if(!TYPES[type])return 'Unknown missile.';if(!hasShip(s))return 'You need a ship first.';if(!launcher(s))return 'Your ship has no missile launcher.';
  if(!Number.isInteger(n)||n<1)return 'Choose how many.';const c=counts(s)[type],cap=capacity(s,type);if(c+n>cap)return c>=cap?'Rack full.':'Only '+(cap-c)+' more fit the rack.';
  if((Number(s.credits)||0)<price(type,balance)*n)return 'Not enough credits.';return null;}
 function buy(s,type,n=1,balance=B()){if(canBuy(s,type,n,balance))return false;s.credits-=price(type,balance)*n;set(s,type,counts(s)[type]+n);return true;}
 /* A mission reward (Mission Editor unlock 'missiles'): rounds added up to the rack. Returns how many fitted. */
 function award(s,type,n){if(!TYPES[type]||!s?.progression)return 0;const before=counts(s)[type],after=set(s,type,before+Math.max(0,Math.floor(n)||0));return after-before;}
 const api={TYPES,IDS,MAX,SEEKER,capacity,launcher,equipped,counts,selected,select,set,spec,price,rack,grant,migrate,hasShip,canBuy,buy,award};
 if(typeof module!=='undefined')module.exports=api;else root.VoidOrdnance=api;
})(globalThis);
