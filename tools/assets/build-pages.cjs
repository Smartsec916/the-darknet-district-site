/* Builds the GitHub Pages site for .github/workflows/pages.yml.
   The site is what the old branch deployment published: every tracked file except paths with a part starting with
   "." or "_" (Jekyll leaves those out) and exports/ (Git LFS archives, which Pages only ever served as pointer files).
   The licensed models come from the private asset repository (never the public one), laid out as in the site
   (void-runner/...), and every packed model and look texture (.vrpak, .vrtex) is encrypted with AES-256-GCM: a "VRPE"
   header, a 12-byte IV, then the ciphertext and tag (asset-pipeline.js open() reads it). The key goes into
   void-runner/asset-pipeline.js. The browser needs the key to draw the model, so this meets CGTrader's "encrypting
   the Product data" measure without stopping a determined player.
   Usage: VOID_ASSET_KEY=<base64, 32 bytes> node tools/assets/build-pages.cjs <licensed-dir> <out-dir>
          node tools/assets/build-pages.cjs --new-key */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const PACKED=0x4b505256,SEALED=0x45505256,PAGES_LIMIT=1024**3;

// Published by Pages (as Jekyll did): no part of the path starts with "." or "_", and not exports/. Also not docs/ or tests/ (17 Nov 2026):
// development notes, screenshots and test scripts are not part of the site (no page loads them) and pushed the site over GitHub Pages' 1 GB limit.
// Also not tools/ (build and pipeline sources, except SITE_TOOLS) or static/ (the Flask mirror the Render backend serves from its own checkout: server.py static_folder) (18 Nov 2026, the
// owner: "Yes take them off the live site"; no page links into any of them). They stay in the repository.
// The one file under tools/ a page reads: the voice registry the mission editor (Developer Tools) loads.
const SITE_TOOLS=new Set(['tools/audio/npc-voice-registry.json']);
// Not shipped either (18 Nov 2026, site slimming; the owner approved): files no page, script, stylesheet or the service worker loads. They stay in the
// repository. The attached_assets PNG originals of the .webp images the pages use, the root copies of Blackout's backgrounds (Blackout loads its own
// blackout-protocol/assets/ copies), two Blackout textures nothing loads, the unused Vesper ridges art and iris-service/ (the Render chat service's source).
const UNSHIPPED=new Set(['attached_assets/epsiloncircle_420_Dark_cyberpunk_cityscape_at_night_glowing_neo_0ca6182c-0ff0-4948-bdfd-a6f406667165.png','attached_assets/epsiloncircle_420_Top_of_the_image_fades_to_pure_black_for_vert_d4be96d3-0564-4824-bf89-48e1c0575ada.png',
'attached_assets/epsiloncircle_420_dark_cyberpunk_sleeping_pod_interior_viewed_f_82a73688-d6a7-4668-b80e-32dbd348dabc.png','attached_assets/top.png','attached_assets/Iris 01.png','attached_assets/Iris 01(1).png','attached_assets/cyber-hoodie.jpg',
'01_bg_near.png','01_bg_far.png','blackout-protocol/assets/Neuroforge.png','blackout-protocol/assets/platform_rail.png','void-runner/art/vesper-ridges.webp']);
// Blackout Protocol's textures that ship as lossless WebP instead (18 Nov 2026, the owner approved; pixel-identical, the game loads the .webp): their PNG
// originals stay in the repository (and in static/) but are not published.
const BLACKOUT_WEBP=new Set('01_bg_far 01_bg_near 02_bg_far 02_bg_near 03_bg_far 03_bg_near 4K Blackrock Bug Downthere Drink_Oil_01 Drink_Oil_02 HoloCompanion Meat Oxygen Pill Pinknoise Plug Rent Skinshift Touchless Zen ad_corelink ad_ioncell ad_voidwatt btc_glow drone_attack_32 drone_dead_32 drone_hover_32 drone_hurt_32 drone_idle_32 drone_move_32 female_idle female_run female_walk gang_rats_dead_48 gang_rats_hurt_48 gang_rats_idle_48 gang_rats_run_48 gang_rats_walk_48 gang_saints_dead_48 gang_saints_hurt_48 gang_saints_idle_48 gang_saints_run_48 gang_saints_walk_48 hacker_terminal_frame1 hacker_terminal_frame2 hacking_terminal_frame1 hacking_terminal_frame2 impact_8 ledge_tile platform_industrial player_dead_48 player_fall_48 player_hurt_48 player_idle_48 player_jump_48 player_run_48 player_walk_48 robot_armed_attack_48 robot_armed_hurt_48 robot_armed_idle_48 robot_armed_run_48 robot_armed_walk_48 robot_attack_48 robot_dead_48 robot_hurt_48 robot_idle_48 robot_run_48 robot_walk_48 security_bg_far security_fence_near shop_addmen shop_door_neon sidearm_16'.split(' ').map(n=>'blackout-protocol/assets/'+n+'.png'));
const publishable=f=>!f.split('/').some(p=>p.startsWith('.')||p.startsWith('_'))&&!/^(exports|docs|tests|static|iris-service)\//.test(f)&&(!f.startsWith('tools/')||SITE_TOOLS.has(f))&&!UNSHIPPED.has(f)&&!BLACKOUT_WEBP.has(f);

// The .vrpak scramble (tools/assets/pack-model.cjs), undone.
function unscramble(buf){
 if(buf.length<8||buf.readUInt32LE(0)!==PACKED)throw Error('Not a VRPK file');
 const out=Buffer.alloc(buf.length-8);let x=(0x9e3779b9^buf.readUInt32LE(4))>>>0||1;
 for(let i=0;i<out.length;i++){if((i&3)===0){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;}out[i]=buf[i+8]^(x>>>((i&3)*8))&255;}
 return out;}

function seal(plain,key){
 const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);
 const body=Buffer.concat([c.update(plain),c.final(),c.getAuthTag()]),head=Buffer.alloc(16);
 head.writeUInt32LE(SEALED,0);iv.copy(head,4);return Buffer.concat([head,body]);}

function keyFrom(b64){const k=Buffer.from(b64||'','base64');if(k.length!==32)throw Error('VOID_ASSET_KEY must be 32 bytes, base64');return k;}

function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else out.push(p);}return out;}

function build(licensed,out,key){
 fs.rmSync(out,{recursive:true,force:true});
 let bytes=0,files=0;const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);bytes+=fs.statSync(to).size;files++;};
 for(const f of execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0'))if(f&&publishable(f)&&fs.existsSync(f))copy(f,path.join(out,f));
 // Licensed files: only the site's own tree, and never over a tracked file.
 let added=0;const root=path.join(licensed,'void-runner');
 if(fs.existsSync(root))for(const f of walk(root)){const rel=path.relative(licensed,f).split(path.sep).join('/');if(!publishable(rel))continue;
  const to=path.join(out,rel);if(fs.existsSync(to))throw Error('Licensed file would replace a tracked file: '+rel);copy(f,to);added++;}
 let sealed=0;
 for(const f of walk(out))if(/\.(vrpak|vrtex)$/.test(f)){const buf=fs.readFileSync(f);if(buf.readUInt32LE(0)!==PACKED)continue;
  const next=seal(unscramble(buf),key);bytes+=next.length-buf.length;fs.writeFileSync(f,next);sealed++;}
 const loader=path.join(out,'void-runner/asset-pipeline.js'),src=fs.readFileSync(loader,'utf8');
 if(src.split("'__VOID_ASSET_KEY__'").length!==2)throw Error('Key placeholder not found once in asset-pipeline.js');
 fs.writeFileSync(loader,src.replace("'__VOID_ASSET_KEY__'","'"+key.toString('base64')+"'"));
 // Every deploy starts a fresh offline cache (void-runner-sw.js caches game files per BUILD), so a forgotten BUILD
 // bump or a new key can never leave players on stale files.
 const sw=path.join(out,'void-runner-sw.js'),worker=fs.readFileSync(sw,'utf8'),stamp=(process.env.GITHUB_SHA||Date.now().toString(36)).slice(0,10);
 if(!/const BUILD='[^']*';/.test(worker))throw Error('BUILD not found in void-runner-sw.js');
 fs.writeFileSync(sw,worker.replace(/const BUILD='([^']*)';/,(m,b)=>`const BUILD='${b}+${stamp}';`));
 if(bytes>PAGES_LIMIT)throw Error(`Site is ${(bytes/1048576).toFixed(0)} MB, over GitHub Pages' 1 GB limit`);
 return {files,added,sealed,mb:+(bytes/1048576).toFixed(1)};}

module.exports={UNSHIPPED,BLACKOUT_WEBP,publishable,unscramble,seal,keyFrom,build};
if(require.main===module){
 const args=process.argv.slice(2);
 if(args[0]==='--new-key'){console.log(crypto.randomBytes(32).toString('base64'));process.exit(0);}
 if(args.length!==2){console.error('Usage: VOID_ASSET_KEY=<base64> node tools/assets/build-pages.cjs <licensed-dir> <out-dir>');process.exit(1);}
 const r=build(args[0],args[1],keyFrom(process.env.VOID_ASSET_KEY));
 console.log(`site: ${r.files} files, ${r.mb} MB; ${r.added} licensed files added; ${r.sealed} models and textures encrypted`);}
