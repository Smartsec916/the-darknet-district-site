/* NPC LOOKS: the appearance editor's rules and the game side (Developer Tools > NPCs > Appearance; queue item 0c, approved by the owner 18 Nov 2026).
   "NPC appearance editor in the NPCs tab, like the player character creator but adapted per NPC to what its model supports (detected from the file)."
   A LOOK is a named set of changes to one model file (content.looks[asset]: everyone drawn with that file takes it), saved as a Mission Editor draft, played with
   PLAY THIS DRAFT, published like missions and checked by the server (void_runner_live_content.py look_problems, from the admin inventory's npcLooks):
     content.looks = {'<asset>': {looks:[{id, name, hide:[part names], colour:{'<material>'|'*': {tint:'#rrggbb'?, hue, sat, bright}}, gear:[ids], hair:'<style>'?}],
                                  use:'original' | '<look id>' | 'mix'}}
   - PARTS (hide): only separate meshes that are an accessory or hair (hat, shades, visor, mask, collar, headset, trackers, bag ...). Anything that covers the body
     (a suit, a top, trousers, armour, shoes), the body and the face are NEVER hideable, and a mesh whose name cannot be classified is not hideable either: clothing
     can never be removed below the model's own outfit.
   - COLOUR: a separate garment, hair or accessory material is recoloured whole; a figure made of one material (the Meshy figures) is recoloured as a whole figure with
     its skin kept (the same shader as the street variants, npc-variants.js). A colour picker (the clothes take that colour, keeping their light and dark) or a hue turn,
     saturation and brightness. No texture is changed or made; the model files are never edited.
   - PIECES (gear, hair): the player creator's gear (character-assembler.js GEAR, assets/models/gear) and hairstyles (assets/models/parts) only on figures built on the
     creator's 52-joint skeleton (the bodies listed in gear-fit.json / bind-data.json with a creator base); other models are greyed with the reason.
   - LICENSED models (the VR companions, studio-warrior, Dax): only recolour and hide accessories; nothing is added; never any AI processing (their licences).
   - Reverie and Lace stay in ordinary street clothing: colours only (no parts, no pieces).
   - Which look the crowd wears: none (as made), one look, or a mix of the saved looks (each person keeps one, chosen from a stable key).
   COST: one cloned material per source material and colour (shared by every figure wearing it, disposed with its source, npc-variants.js variantMaterial); the pieces
   are fitted once per model and scene and copied with shared geometry. The PURE part (classification, capabilities, checks, the pick) runs in Node (tests/npc-looks.test.cjs). */
(function(root){
 'use strict';
 const ID=/^[a-z0-9][a-z0-9-]{0,23}$/,ASSET=/^[a-z][a-z0-9-]{0,40}$/,PART=/^[A-Za-z0-9 _.:-]{1,80}$/,HEX=/^#[0-9a-f]{6}$/i,TAGS=/<[^>]*>|[\x00-\x1f]/;
 const LIMIT={assets:60,looks:8,name:40,hide:24,colours:16,hue:180,sat:[0,2],bright:[.4,1.6]};
 const LICENSED=/^(vr-companion-.+|studio-warrior|npc-dax|npc-upload-[0-9a-f]{32})$/,STREET=[];
 const GEAR={'gear-visor':{label:'Visor',parts:['visor']},'gear-collar':{label:'Tech collar',parts:['collar']},'gear-shoulders':{label:'Shoulder plates',parts:['pauldron_L','pauldron_R']},'gear-chest':{label:'Chest light',parts:['chest_line']}};   // character-assembler.js GEAR, the catalog's labels
 const HAIR={short01:{label:'Short crop',hatOk:true},short02:{label:'Short swept',hatOk:true},short03:{label:'Short tousled',hatOk:true},short04:{label:'Short neat',hatOk:true},bob01:{label:'Bob',hatOk:false},bob02:{label:'Bob layered',hatOk:false},braid01:{label:'Braid',hatOk:false},long01:{label:'Long',hatOk:false},ponytail01:{label:'Ponytail',hatOk:false}};   // character-appearance.js CATALOG.hair (a test keeps them equal)
 // ---- what a mesh is, from its name (and its material's name when the mesh name says nothing, e.g. Cube.001)
 const W={body:['body','base','skin','human','genitals','nude','torso','unwrapped','headmesh','head'],face:['eyebrow','eyebrows','eyelash','eyelashes','eye','eyes','teeth','tongue','poly'],
  shoes:['shoe','shoes','boot','boots','sneaker','sneakers','heels','sandal','sandals','feet','foot'],garmentExact:['top','tee','bra','cape','cloak','sock','socks'],
  garment:['suit','shirt','pants','trouser','jeans','skirt','dress','shorts','jacket','coat','hoodie','vest','sweater','armor','armour','outfit','cloth','uniform','underwear','panties','bikini','robe','kimono','legging','tights','stocking','sleeve','overall','corset','blouse','tank'],
  hair:['hair','bob','braid','long','short','ponytail','afro','bun','mohawk','dreads','fringe','bangs','wig'],
  accessory:['hat','cap','fedora','beanie','helmet','hood','visor','shades','glasses','sunglasses','goggles','mask','slit','bag','backpack','satchel','pouch','belt','holster','earring','earrings','necklace','chain','pendant','bracelet','watch','scarf','collar','headset','headphone','headphones','earpiece','lens','strap','tracker','trackers','badge','cigarette','antenna','implant','glove','gloves']};
 const GENERIC=/^(cube|mesh|object|plane|cylinder|sphere|circle|node)([._ ]?\d+)?$/i;
 const tokens=n=>String(n||'').toLowerCase().split(/[^a-z0-9]+/).map(t=>t.replace(/\d+$/,'')).filter(Boolean);
 function kindOf(name){const t=tokens(name);if(!t.length)return 'unknown';const has=l=>t.some(x=>l.includes(x));
  if(has(W.body))return 'body';if(has(W.face))return 'face';if(has(W.garmentExact)||t.some(x=>W.garment.some(g=>x.includes(g))))return 'garment';if(has(W.shoes))return 'shoes';
  if(has(W.hair))return 'hair';if(has(W.accessory))return 'accessory';return 'unknown';}
 /* A part's kind: from its own name, or its material's name when the mesh name is generic. Body, face, garment and shoes win over anything else. */
 function classify(name,material){const a=kindOf(name);if(!GENERIC.test(String(name||'')))return a;const b=kindOf(material);return a==='unknown'?b:a;}
 const HIDEABLE=['hair','accessory'],hideable=(name,material)=>HIDEABLE.includes(classify(name,material));
 /* The name a part is known by: the glTF node's name (the game's copies are named "<prefix>-<name>", a split mesh "<name>_primitive<n>"). */
 function partName(meshName,known){let n=String(meshName||'').replace(/_primitive\d+$/,'');if(known){if(known.includes(n))return n;const hit=known.filter(k=>n.endsWith('-'+k)).sort((x,y)=>y.length-x.length)[0];return hit||null;}return n;}
 const LABEL={shades:'Sunglasses',glasses:'Glasses',visor:'Visor',mask:'Face mask',collar:'Collar',fedora:'Hat (fedora)',hat:'Hat',cap:'Cap',helmet:'Helmet',headset:'VR headset',trackers:'Hand trackers',tracker:'Hand tracker',bag:'Bag',backpack:'Backpack',belt:'Belt',scarf:'Scarf',gloves:'Gloves',
  bob:'Hair (bob)',braid:'Hair (braid)',long:'Hair (long)',short:'Hair (short)',ponytail:'Hair (ponytail)',hair:'Hair'};
 function label(name,kind){const t=tokens(name);const k=t.find(x=>LABEL[x]&&(kind!=='hair'||W.hair.includes(x)));if(k)return LABEL[k]+(/left$/i.test(name)?' (left)':/right$/i.test(name)?' (right)':'');
  if(kind==='garment')return 'Clothing ('+t.filter(x=>x.length>2&&!/^(male|female|npc|matcreator|mc)$/.test(x)).slice(-1)[0]+')';return {body:'Body',face:'Face detail',shoes:'Shoes'}[kind]||t.slice(-1)[0]||String(name);}
 // ---- reading a model file (Node: the admin inventory and tests; the editor reads the loaded file instead, metaFromContainer)
 /* A .glb's JSON chunk -> {parts:[{name, material}], joints}. Only the header is read (no geometry). */
 function metaFromGlb(bytes){const u8=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);if(dv.getUint32(0,true)!==0x46546c67)throw Error('not a .glb');
  const len=dv.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(u8.subarray(20,20+len)));return metaFromGltf(j);}
 function metaFromGltf(j){const mats=j.materials||[],parts=[];for(const n of j.nodes||[]){if(n.mesh==null)continue;const m=(j.meshes||[])[n.mesh]||{},mat=mats[((m.primitives||[])[0]||{}).material];parts.push({name:n.name||m.name||'mesh',material:(mat&&mat.name)||''});}
  return {parts,joints:((j.skins||[])[0]||{joints:[]}).joints.length};}
 /* The loaded preview file (Babylon AssetContainer) -> the same shape. */
 function metaFromContainer(c){const parts=[];for(const m of (c&&c.meshes)||[]){if(!m.getTotalVertices||!m.getTotalVertices())continue;const n=partName(m.name);if(parts.some(p=>p.name===n))continue;parts.push({name:n,material:(m.material&&m.material.name)||''});}
  return {parts,joints:Math.max(0,...((c&&c.skeletons)||[]).map(s=>s.bones.length))};}
 // ---- what a model can do
 /* data (optional): {bases:{model:'male'|'female'} (the creator catalog's looks), fitBodies:[models in gear-fit.json], bindBodies:[models in bind-data.json]}. */
 function fits(asset,data){if(LICENSED.test(asset))return {gear:null,hair:false,why:'A licensed model: its colours can change and its accessories can be hidden, but nothing is added to it (its licence; no AI tools).'};
  if(STREET.includes(asset))return {gear:null,hair:false,why:'Reverie and Lace stay in ordinary street clothing: colours only.'};
  const base=data&&data.bases&&data.bases[asset]||null,g=!!(base&&(data.fitBodies||[]).includes(asset)),h=!!(base&&(data.bindBodies||[]).includes(asset));
  return {gear:g?base:null,hair:h,why:g||h?'':'The creator’s gear and hair fit only figures built on the character creator’s skeleton (the District resident and smuggler bodies and figures made like them). This model has its own skeleton.'};}
 /* meta: {parts, joints} -> what the editor offers for this model. */
 function capabilities(asset,meta,data){const parts=((meta&&meta.parts)||[]).map(p=>{const kind=classify(p.name,p.material);return {name:p.name,material:p.material,kind,hideable:HIDEABLE.includes(kind),label:label(GENERIC.test(p.name)?p.material:p.name,kind)};});
  const street=STREET.includes(asset),licensed=LICENSED.test(asset);
  // groups: a mask with its slits, a headset with its lens and strap hide together
  const groups=[];for(const p of parts){const parent=parts.find(q=>q!==p&&p.name.startsWith(q.name+'.')&&q.hideable===p.hideable);const g=parent&&groups.find(x=>x.names.includes(parent.name));if(g){g.names.push(p.name);continue;}groups.push({id:p.name,label:p.label,kind:p.kind,hideable:p.hideable&&!street,names:[p.name],why:street?'Reverie and Lace: colours only.':p.hideable?'':p.kind==='unknown'?'Its name does not say what it is, so it stays (it might be clothing).':p.kind==='garment'||p.kind==='shoes'?'Clothing stays on: nothing below the model’s own outfit can be removed.':'Part of the body or face.'});}
  const solid=parts.filter(p=>p.kind!=='face'),whole=!solid.length||solid.every(p=>p.kind==='body')||new Set(solid.map(p=>p.material)).size===1;
  const colours=whole?[{key:'*',label:'Whole figure (skin is kept)',kind:'whole'}]:[...new Map(parts.filter(p=>p.kind!=='body'&&p.kind!=='face'&&p.material&&!parts.some(q=>q!==p&&p.name.startsWith(q.name+'.'))).map(p=>[p.material,{key:p.material,label:p.label,kind:p.kind}])).values()];
  const f=fits(asset,data),hats=parts.filter(p=>p.kind==='accessory'&&/hat|fedora|cap|helmet|hood|beanie/i.test(p.name)).map(p=>p.name);
  return {asset,licensed,street,whole,joints:(meta&&meta.joints)|0,parts,groups,colours,
   gear:{base:f.gear,ok:!!f.gear,why:f.gear?'':f.why,ids:Object.keys(GEAR)},hair:{ok:f.hair,why:f.hair?'':f.why,styles:Object.keys(HAIR),native:parts.filter(p=>p.kind==='hair').map(p=>p.name),hats}};}
 /* The server's copy (admin inventory npcLooks.assets[asset]): just what may be changed. */
 const summary=c=>({licensed:c.licensed,street:c.street,whole:c.whole,parts:c.street?[]:c.parts.filter(p=>p.hideable).map(p=>p.name),colours:c.colours.map(x=>x.key),gear:c.gear.base,hair:c.hair.ok,hats:c.hair.hats});
 // ---- checks (the server repeats them: void_runner_live_content.py look_problems)
 const num=(v,a,b)=>typeof v==='number'&&Number.isFinite(v)&&v>=a&&v<=b;
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 function colourOk(c){return keysOk(c,['tint','hue','sat','bright'])&&(c.tint==null||HEX.test(c.tint))&&(c.hue==null||num(c.hue,-LIMIT.hue,LIMIT.hue))&&(c.sat==null||num(c.sat,...LIMIT.sat))&&(c.bright==null||num(c.bright,...LIMIT.bright));}
 /* One asset's entry -> problems (plain words). inv: the admin inventory's npcLooks.assets[asset] (optional: without it only the name rules apply). */
 function entryProblems(asset,e,inv){const out=[],w=asset+': ';if(!ASSET.test(asset))return [w+'unknown model.'];
  if(!keysOk(e,['looks','use'])||!Array.isArray(e.looks)||e.looks.length>LIMIT.looks)return [w+'looks have an unknown shape (at most '+LIMIT.looks+' looks).'];
  const lic=inv?inv.licensed:LICENSED.test(asset),street=inv?inv.street:STREET.includes(asset),ids=new Set();
  for(const l of e.looks){const n=w+'look '+(l&&typeof l.name==='string'?'“'+l.name.slice(0,40)+'”':'(no name)')+': ';
   if(!keysOk(l,['id','name','hide','colour','gear','hair'])){out.push(n+'unknown fields.');continue;}
   if(typeof l.id!=='string'||!ID.test(l.id)||ids.has(l.id))out.push(n+'bad or repeated id.');ids.add(l.id);
   if(!plain(l.name,LIMIT.name))out.push(n+'a look needs a plain name ('+LIMIT.name+' characters at most).');
   const hide=l.hide==null?[]:l.hide;if(!Array.isArray(hide)||hide.length>LIMIT.hide||hide.some(p=>typeof p!=='string'||!PART.test(p)))out.push(n+'the hidden parts have an unknown shape.');
   else for(const p of hide){if(street)out.push(n+'Reverie and Lace keep every part (colours only).');else if(inv?!inv.parts.includes(p):!hideable(p))out.push(n+'“'+p+'” cannot be hidden (only accessories and hair; clothing that covers the body always stays).');}
   const col=l.colour==null?{}:l.colour;if(!col||typeof col!=='object'||Array.isArray(col)||Object.keys(col).length>LIMIT.colours)out.push(n+'the colours have an unknown shape.');
   else for(const [k,c] of Object.entries(col)){if(typeof k!=='string'||!(k==='*'||PART.test(k)))out.push(n+'unknown colour target.');else if(inv&&!inv.colours.includes(k))out.push(n+'“'+k+'” is not a colour this model can change.');else if(!inv&&k!=='*'&&['body','face'].includes(classify(k)))out.push(n+'the body and face keep their own colours.');if(!colourOk(c))out.push(n+'a colour needs a #rrggbb tint and/or a hue (-180..180), saturation (0..2) and brightness (0.4..1.6).');}
   const gear=l.gear==null?[]:l.gear;if(!Array.isArray(gear)||gear.length>4||gear.some(g=>!GEAR[g])||new Set(gear).size!==gear.length)out.push(n+'unknown gear.');
   else if(gear.length&&(lic||street||(inv&&!inv.gear)))out.push(n+(lic?'a licensed model gets nothing added.':street?'Reverie and Lace stay in ordinary street clothing.':'the creator’s gear does not fit this model’s skeleton.'));
   if(l.hair!=null){if(!HAIR[l.hair])out.push(n+'unknown hairstyle.');else if(lic||street||(inv&&!inv.hair))out.push(n+(lic?'a licensed model gets nothing added.':street?'Reverie and Lace stay in ordinary street clothing.':'the creator’s hair does not fit this model.'));
    else if(!HAIR[l.hair].hatOk&&inv&&(inv.hats||[]).some(h=>!hide.includes(h)))out.push(n+'that hairstyle does not fit under the hat: hide the hat first, or choose a short style.');}}
  if(!(e.use==null||e.use==='original'||e.use==='mix'||e.looks.some(l=>l&&l.id===e.use)))out.push(w+'“which look they wear” names a look that does not exist.');
  if(e.use==='mix'&&!e.looks.length)out.push(w+'a mix needs at least one saved look.');
  return out;}
 /* content.looks -> problems. ctx.inventory: the admin inventory's npcLooks (optional). */
 function problems(looks,ctx={}){if(!looks||typeof looks!=='object'||Array.isArray(looks)||Object.keys(looks).length>LIMIT.assets)return ['Looks have an unknown shape.'];const inv=ctx.inventory&&ctx.inventory.assets,out=[];
  for(const [a,e] of Object.entries(looks)){if(inv&&!inv[a]){out.push(a+': not a model the editor knows.');continue;}out.push(...entryProblems(a,e,inv&&inv[a]));}return out;}
 /* An entry as it is sent (empty parts dropped), or null when it is not valid or does nothing. */
 function clean(asset,e,inv){if(entryProblems(asset,e,inv).length)return null;const looks=e.looks.map(l=>{const x={id:l.id,name:l.name.trim()};if(l.hide&&l.hide.length)x.hide=l.hide.slice();const c=l.colour&&Object.keys(l.colour).length?JSON.parse(JSON.stringify(l.colour)):null;if(c)x.colour=c;if(l.gear&&l.gear.length)x.gear=l.gear.slice();if(l.hair)x.hair=l.hair;return x;});
  if(!looks.length)return null;return {looks,use:e.use||'original'};}
 // ---- which look a figure wears
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
 /* entry, a stable key (the person's id) -> the look, or null (as made). 'mix': each key keeps one of the saved looks. */
 function pick(e,key){if(!e||!Array.isArray(e.looks)||!e.looks.length)return null;if(e.use==='mix')return e.looks[hash(String(key))%e.looks.length];return e.use&&e.use!=='original'?e.looks.find(l=>l.id===e.use)||null:null;}
 /* A colour setting -> the street-variant shader's variant {id, h, s, v, t, all}. all: a separate material, recoloured whole (no skin test). */
 function variant(c,all){const lin=x=>Math.pow(parseInt(x,16)/255,2.2),br=typeof c.bright==='number'?c.bright:1;let v;
  if(c.tint&&HEX.test(c.tint)){const h=c.tint,rgb=[lin(h.slice(1,3)),lin(h.slice(3,5)),lin(h.slice(5,7))],l=Math.max(1e-3,.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]);v={h:0,s:0,v:Math.max(.25,Math.min(2,(.45+.8*Math.sqrt(l/.2))*br)),t:rgb.map(x=>Math.min(4,x/l))};}
  else v={h:(c.hue||0)/360,s:typeof c.sat==='number'?c.sat:1,v:br,t:[1,1,1]};
  v.all=!!all;v.id='look-'+hash(JSON.stringify([v.h,v.s,v.v,v.t,v.all])).toString(36);return v;}
 /* The admin inventory's npcLooks: what may change on every model the game ships (read from the files' headers; licensed .vrpak files only by name). */
 function inventory(metas,data){const assets={};for(const [a,m] of Object.entries(metas))assets[a]=summary(capabilities(a,m||{parts:[]},data));
  return {limits:LIMIT,gear:Object.keys(GEAR),hair:Object.fromEntries(Object.entries(HAIR).map(([k,v])=>[k,{hatOk:v.hatOk}])),assets};}

 // ================================================================= browser: the game side
 const env=()=>root.VoidLiveContent&&root.VoidLiveContent.env||null;
 const lookFor=(asset,key)=>{const e=env()&&env().looks&&env().looks[asset];return e?pick(e,key):null;};
 const isPlayer=node=>{for(let p=node;p;p=p.parent)if(/^(character:|remote-player:|avatar-preview)/.test(p.name||''))return true;return false;};
 let dataP=null;
 function loadData(){return dataP??=(async()=>{const get=u=>fetch(new URL(u,document.baseURI||location.href)).then(r=>{if(!r.ok)throw Error(u+' HTTP '+r.status);return r.json();});
  const [fit,bind]=await Promise.all([get('void-runner/assets/models/gear/gear-fit.json'),get('void-runner/assets/models/parts/bind-data.json')]);const bases={};for(const l of Object.values((root.VoidCharacterAppearance&&root.VoidCharacterAppearance.CATALOG||{}).looks||{}))if(!l.street&&l.model)bases[l.model]=l.base;
  return {fit,bind,bases,fitBodies:Object.keys(fit.bodies||{}),bindBodies:Object.keys(bind.bodies||{})};})().catch(e=>{dataP=null;throw e;});}
 const templates=new Map();
 function cached(scene,key,make){const k=scene.uid+'|'+key;if(!templates.has(k)){if(!scene.__npcLooks){scene.__npcLooks=true;scene.onDisposeObservable.addOnce(()=>{for(const [x,p] of templates)if(x.startsWith(scene.uid+'|')){templates.delete(x);p.then(t=>t.dispose(),()=>{});}});}
  const p=make();templates.set(k,p);p.catch(()=>templates.delete(k));}return templates.get(k);}
 const GEAR_FIT={visor:['Head','headW'],collar:['Neck','headW'],pauldron_L:['LeftArm','span'],pauldron_R:['RightArm','span'],chest_line:['Spine2','span','chestFront']};   // character-assembler.js GEAR_FIT
 /* One gear piece fitted to one model, once per scene: {meshes (disabled templates), dispose}. Copies share their geometry. */
 function gearTemplate(part,base,asset,scene,data){return cached(scene,'gear|'+part+'|'+base+'|'+asset,async()=>{const B=root.BABYLON,key=part+'_'+(base==='female'?'f':'m');
  const c=await root.VoidAssets.loadContainer({src:'assets/models/gear/gear_'+key+'.glb'},scene,null,'npclook-gear:'+key),ref=data.fit.bodies[data.fit.reference[base]],tgt=data.fit.bodies[asset],out=[];
  for(const m of c.meshes.filter(m=>m.getTotalVertices()>0)){const t=m.clone('npc-look-gear:'+asset+':'+m.name,null);
   if(ref&&tgt&&ref!==tgt){const [jn,sk,depth]=GEAR_FIT[part],sc=tgt[sk]/ref[sk],Jr=ref.joints[jn],Jt=tgt.joints[jn];t.makeGeometryUnique();const pos=Float32Array.from(t.getVerticesData(B.VertexBuffer.PositionKind));
    for(let i=0;i<pos.length;i+=3){pos[i]=Jt[0]+sc*(pos[i]-Jr[0]);pos[i+1]=Jt[1]+sc*(pos[i+1]-Jr[1]);pos[i+2]=depth?tgt[depth]+(pos[i+2]-ref[depth]):Jt[2]+sc*(pos[i+2]-Jr[2]);}t.setVerticesData(B.VertexBuffer.PositionKind,pos,false);}
   t.setEnabled(false);t.isPickable=false;out.push(t);}
  return {meshes:out,dispose(){for(const t of out)t.dispose();c.dispose();}};});}
 /* One hairstyle fitted to one model's head, once per scene (the creator's own fit: character-fit.js). */
 function hairTemplate(style,asset,scene,data){return cached(scene,'hair|'+style+'|'+asset,async()=>{const B=root.BABYLON,F=root.VoidCharacterFit,p=data.bind.parts[style],body=data.bind.bodies[asset];if(!F||!p||!body)throw Error('no fit data');
  const f=F.headFit(p.headDims,body.headDims);if(f.mismatch>F.FIT_LIMIT)throw Error('hairstyle does not fit this head');
  const c=await root.VoidAssets.loadContainer({src:'assets/models/parts/hair-'+style+'.glb'},scene,null,'npclook-hair:'+style),m=c.meshes.find(x=>x.name==='hair-'+style&&x.getTotalVertices()>0);if(!m)throw Error('hair part has no mesh');
  const r=F.refit({positions:Array.from(m.getVerticesData(B.VertexBuffer.PositionKind)),normals:Array.from(m.getVerticesData(B.VertexBuffer.NormalKind)),joints:Array.from(m.getVerticesData(B.VertexBuffer.MatricesIndicesKind)),weights:Array.from(m.getVerticesData(B.VertexBuffer.MatricesWeightsKind))},p.ibm,body.ibm,f.scale);
  const t=m.clone('npc-look-hair:'+asset+':'+style,null);t.makeGeometryUnique();t.setVerticesData(B.VertexBuffer.PositionKind,Float32Array.from(r.positions),false);t.setVerticesData(B.VertexBuffer.NormalKind,Float32Array.from(r.normals),false);t.setEnabled(false);t.isPickable=false;
  return {meshes:[t],dispose(){t.dispose();c.dispose();}};});}
 /* Puts the look's pieces on a figure (after its colours and parts). A newer look on the same figure cancels this one. */
 async function addPieces(node,asset,look,st,scene){if(LICENSED.test(asset)||STREET.includes(asset))return;const data=await loadData();if(node.metadata?.npcLookState!==st)return;
  const base=data.bases[asset],meshes=node.getChildMeshes(false),body=meshes.find(m=>m.skeleton&&/(^|[.-])body$/.test(partName(m.name)))||meshes.find(m=>m.skeleton);if(!body)return;
  const put=t=>{const c=t.clone(t.name+'#'+node.uniqueId,null);c.skeleton=body.skeleton;c.parent=body.parent;c.isPickable=false;c.alwaysSelectAsActiveMesh=true;c.setEnabled(true);st.added.push(c);return c;};
  if(base&&data.fitBodies.includes(asset))for(const g of look.gear||[])for(const part of (GEAR[g]||{parts:[]}).parts){const T=await gearTemplate(part,base,asset,scene,data);if(node.metadata?.npcLookState!==st||node.isDisposed())return;T.meshes.forEach(put);}
  if(look.hair&&HAIR[look.hair]&&base&&data.bindBodies.includes(asset)){const T=await hairTemplate(look.hair,asset,scene,data);if(node.metadata?.npcLookState!==st||node.isDisposed())return;
   for(const m of node.getChildMeshes(false))if(classify(partName(m.name).split('-').pop())==='hair'&&!st.added.includes(m)&&m.isEnabled(false)){m.setEnabled(false);st.hidden.push(m);}T.meshes.forEach(put);}
  st.pieces=true;}
 /* Takes a figure back to how it was before any look (parts shown, its own materials, pieces removed). */
 function reset(node){const st=node&&node.metadata&&node.metadata.npcLookState;if(!st)return;for(const m of st.hidden)if(!m.isDisposed())m.setEnabled(true);for(const [m,mat] of st.mats)if(!m.isDisposed())m.material=mat;for(const m of st.added)m.dispose();node.metadata.npcLookState=null;node.metadata.npcLook=null;}
 /* Dresses one figure (a game copy, or the editor's preview) in a look; null / no look: as made. Returns the look id. */
 function applyLook(node,asset,look,opts={}){if(!node||!root.BABYLON)return null;reset(node);if(!look)return null;const B=root.BABYLON,V=root.VoidNPCVariants,st={hidden:[],mats:[],added:[]};
  node.metadata={...(node.metadata||{}),npcLookState:st,npcLook:look.id};const meshes=node.getChildMeshes(false),street=STREET.includes(asset);
  const hide=new Set(street?[]:look.hide||[]),known=[...hide];
  for(const m of meshes){const n=partName(m.name,known);if(n&&hideable(n,m.material&&m.material.name)&&m.isEnabled(false)){m.setEnabled(false);st.hidden.push(m);}}
  const col=look.colour||{},keys=Object.keys(col);
  if(keys.length&&V&&V.variantMaterial)for(const m of meshes){const mat=m.material;if(!mat||!(mat instanceof B.PBRMaterial))continue;const base=(mat.metadata&&mat.metadata.npcVariantOf)||mat,key=col['*']?'*':keys.find(k=>k===base.name||base.name.endsWith('-'+k)||base.name.endsWith('.'+k));
   if(!key||(key!=='*'&&['body','face'].includes(classify(key))))continue;let c;try{c=V.variantMaterial(base,variant(col[key],key!=='*'));}catch(e){continue;}if(!c||c===base)continue;c.metadata={...(c.metadata||{}),npcVariantOf:base};st.mats.push([m,mat]);m.material=c;}
  if(!street&&((look.gear||[]).length||look.hair))addPieces(node,asset,look,st,opts.scene||node.getScene()).catch(e=>{try{console.warn('[VOID//RUNNER npc looks] pieces',e&&e.message||e);}catch{}});
  return look.id;}
 /* The look the published content (or the draft being played) gives this figure, applied. */
 function dressIn(node,asset,key){const L=lookFor(asset,key==null?node.metadata?.character||node.metadata?.alley||node.uniqueId:key);if(!L)return null;return applyLook(node,asset,L);}
 // Every NPC figure goes through VoidCrowd.animate (and the street people through VoidCrowd.dress first): a look is put on there. Player figures are never touched.
 function install(){const C=root.VoidCrowd;if(!C||C.__npcLooks)return;C.__npcLooks=true;const an=C.animate,dr=C.dress;
  C.animate=function(node,look){const r=an.apply(this,arguments);try{if(node&&!node.metadata?.npcLook&&!isPlayer(node))dressIn(node,look);}catch(e){}return r;};
  if(dr)C.dress=function(node,look,key){try{if(node&&!isPlayer(node)){const id=dressIn(node,look,key);if(id)return id;}}catch(e){}return dr.apply(this,arguments);};}
 const api={ID,LIMIT,LICENSED,STREET,GEAR,HAIR,W,tokens,classify,hideable,partName,label,metaFromGlb,metaFromGltf,metaFromContainer,fits,capabilities,summary,entryProblems,problems,clean,pick,variant,inventory,hash,
  lookFor,isPlayer,loadData,applyLook,reset,dressIn,install};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.VoidNPCLooks=api;install();}
})(typeof globalThis!=='undefined'?globalThis:this);
