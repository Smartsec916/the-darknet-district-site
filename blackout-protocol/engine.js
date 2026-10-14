/*
==============================================================================
BLACKOUT PROTOCOL — SHARED GAME ENGINE

Purpose: runs the three platforming levels, between-level shops, and browser-local run state.
Relationship: level pages import bootLevel(); shop pages use the exported storage helpers.
==============================================================================
*/
import * as Account from './account.js';

// Shared engine for the existing districts and their later sectors.
const VW = 256, VH = 240, TILE = 16;
const LEVEL_LEN = 1600;
const DOOR_W = 24, DOOR_H = 32;
const HYPER_RELOAD_TAG = 'rev=20261011-accounts';
// gang: street gang for the early sectors. fireEvery: ms between armed-robot shots.
const LEVELS = {
  1:{name:'THE UNDERGRID', ledges:1, robots:0, drones:0, thieves:0, gun:false, gang:'rats', gangs:1},
  2:{name:'WATCHER DISTRICT', ledges:2, robots:0, drones:0, thieves:0, gun:false, gang:'saints', gangs:1},
  3:{name:'NEON BAZAAR', ledges:2, robots:0, drones:0, thieves:1, gun:false},
  4:{name:'MACHINE PERIMETER', ledges:2, robots:1, drones:0, thieves:0, gun:false, fireEvery:2600},
  5:{name:'ARMORY ACCESS', ledges:2, robots:1, drones:1, thieves:0, gun:true, fireEvery:2200},
  6:{name:'BLACKOUT CORE', ledges:3, robots:2, drones:1, thieves:0, gun:true, fireEvery:1800}
};
// Street gangs: contact damage, hits to drop, walking speed, and the name shown when they spot you.
const GANGS = {
  rats:{label:'RUST RATS', damage:5, hp:2, speed:.55},
  saints:{label:'GLITCH SAINTS', damage:6, hp:2, speed:.62}
};
// Muzzle point of the armed robot's rifle in its firing pose (sprite faces right).
const ROBOT_MUZZLE = {x:47, y:21};
// All gaps are shorter than the unupgraded ground jump's ~94 px range.
const GAPS={1:[],2:[[608,640]],3:[[928,976]],4:[[608,656],[1216,1264]],
  5:[[608,656],[1216,1280]],6:[[608,672],[1216,1280]]};

// ====== storage helpers (session for run; local for leaderboard) ======
export function getRunN(k,d=0){ return +(sessionStorage.getItem(k) ?? d) }
export function setRunN(k,v){ sessionStorage.setItem(k, String(v)) }
export function getRunO(k,d={}){ try{return JSON.parse(sessionStorage.getItem(k)||'null')??d}catch(e){return d} }
export function setRunO(k,o){ sessionStorage.setItem(k, JSON.stringify(o)) }
export function hardResetRun(){
  Account.resetRankedRun();
  for(const key of ['playerBTC','playerScore','playerHealth','playerUpgrades','gameLevel','blackoutGun','blackoutLevel3Warned','blackoutFinished']) sessionStorage.removeItem(key);
  for(let n=1;n<=6;n++) {sessionStorage.removeItem(`blackoutCoins${n}`);sessionStorage.removeItem(`blackoutRelays${n}`);sessionStorage.removeItem(`blackoutCheckpoint${n}`);sessionStorage.removeItem(`blackoutScoreEvents${n}`);}
  setRunN('playerBTC',0);
  setRunN('playerScore',0);
  setRunN('playerHealth',100);
  setRunO('playerUpgrades',{});
  setRunN('gameLevel',1);
}
export function goTo(href){ window.location.assign(href) }

function getLeaderboard(){ try{return JSON.parse(localStorage.getItem('leaderboard')||'[]')}catch(e){return[]} }
function setLeaderboard(list){ localStorage.setItem('leaderboard', JSON.stringify(list)) }
// The leaderboard is intentionally browser-local; this does not submit scores to a service.
export function postScore(score=0){
  const id = Math.random().toString(36).slice(2,10).toUpperCase();
  const lb = getLeaderboard();
  lb.push({id, score});
  lb.sort((a,b)=> (b.score|0)-(a.score|0));
  setLeaderboard(lb.slice(0,10));
}

// ====== assets ======
function IMG(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }) }

const SPRITE_DEF = {
  player:{fw:48,fh:48, states:{
    idle:'./assets/player_idle_48.png', walk:'./assets/player_walk_48.png', run:'./assets/player_run_48.png',
    jump:'./assets/player_jump_48.png', fall:'./assets/player_fall_48.png', hurt:'./assets/player_hurt_48.png', dead:'./assets/player_dead_48.png'
  }, fps:{idle:6, walk:10, run:12, jump:10, fall:10, hurt:6, dead:8}},
  robot:{fw:48,fh:48, states:{
    idle:'./assets/robot_idle_48.png', walk:'./assets/robot_walk_48.png', run:'./assets/robot_run_48.png',
    attack:'./assets/robot_attack_48.png', hurt:'./assets/robot_hurt_48.png', dead:'./assets/robot_dead_48.png'
  }, fps:{idle:6, walk:9, run:10, attack:12, hurt:6, dead:8}},
  drone:{fw:32,fh:32, states:{
    idle:'./assets/drone_idle_32.png', hover:'./assets/drone_hover_32.png', move:'./assets/drone_move_32.png',
    attack:'./assets/drone_attack_32.png', hurt:'./assets/drone_hurt_32.png', dead:'./assets/drone_dead_32.png'
  }, fps:{idle:3, hover:10, move:10, attack:12, hurt:6, dead:8}},
  female:{fw:48,fh:48, states:{
    idle:'./assets/female_idle.png', walk:'./assets/female_walk.png', run:'./assets/female_run.png'
  }, fps:{idle:6, walk:8, run:10}},
  robot_armed:{fw:48,fh:48, states:{
    idle:'./assets/robot_armed_idle_48.png', walk:'./assets/robot_armed_walk_48.png', run:'./assets/robot_armed_run_48.png',
    attack:'./assets/robot_armed_attack_48.png', hurt:'./assets/robot_armed_hurt_48.png', dead:'./assets/robot_dead_48.png'
  }, fps:{idle:6, walk:9, run:10, attack:12, hurt:6, dead:8}},
  gang_rats:{fw:48,fh:48, states:{
    idle:'./assets/gang_rats_idle_48.png', walk:'./assets/gang_rats_walk_48.png', run:'./assets/gang_rats_run_48.png',
    hurt:'./assets/gang_rats_hurt_48.png', dead:'./assets/gang_rats_dead_48.png'
  }, fps:{idle:6, walk:9, run:11, hurt:6, dead:8}},
  gang_saints:{fw:48,fh:48, states:{
    idle:'./assets/gang_saints_idle_48.png', walk:'./assets/gang_saints_walk_48.png', run:'./assets/gang_saints_run_48.png',
    hurt:'./assets/gang_saints_hurt_48.png', dead:'./assets/gang_saints_dead_48.png'
  }, fps:{idle:6, walk:9, run:11, hurt:6, dead:8}},
  bg_far:null, bg_near:null, coin:null, door:null, ledge:null, platform:null
};

function bgURLsForLevel(lvl){
  if(lvl>=4) return {far:`./assets/security_bg_far.png?${HYPER_RELOAD_TAG}`, near:`./assets/security_fence_near.png?${HYPER_RELOAD_TAG}`};
  if(lvl===2) return {far:`./assets/02_bg_far.png?${HYPER_RELOAD_TAG}`, near:`./assets/02_bg_near.png?${HYPER_RELOAD_TAG}`};
  if(lvl===3) return {far:`./assets/03_bg_far.png?${HYPER_RELOAD_TAG}`, near:`./assets/03_bg_near.png?${HYPER_RELOAD_TAG}`};
  return {far:`./assets/01_bg_far.png?${HYPER_RELOAD_TAG}`, near:`./assets/01_bg_near.png?${HYPER_RELOAD_TAG}`};
}

function adConfigForLevel(lvl){
  if(lvl>=4){
    // Neon tube posters in the same style as the early sectors.
    const sets={
      4:['sentry','ironmesh','botforce'],
      5:['novaarms','dronepal','bulletcoffee'],
      6:['obey','happyfeed','dreampass']
    };
    const kinds=sets[lvl]||sets[6];
    return {kinds, images:Object.fromEntries(kinds.map(kind=>[kind,`./assets/ad_${kind}.webp?${HYPER_RELOAD_TAG}`]))};
  }
  if(lvl===2){
    return {
      kinds:['blackrock','downthere','oxygen','skinshift','zen'],
      images:{
        blackrock:`./assets/Blackrock.png?${HYPER_RELOAD_TAG}`,
        downthere:`./assets/Downthere.png?${HYPER_RELOAD_TAG}`,
        oxygen:`./assets/Oxygen.png?${HYPER_RELOAD_TAG}`,
        skinshift:`./assets/Skinshift.png?${HYPER_RELOAD_TAG}`,
        zen:`./assets/Zen.png?${HYPER_RELOAD_TAG}`,
      }
    };
  }
  if(lvl===3){
    return {
      kinds:['bug','pill','plug','touchless','pinknoise'],
      images:{
        bug:`./assets/Bug.png?${HYPER_RELOAD_TAG}`,
        pill:`./assets/Pill.png?${HYPER_RELOAD_TAG}`,
        plug:`./assets/Plug.png?${HYPER_RELOAD_TAG}`,
        touchless:`./assets/Touchless.png?${HYPER_RELOAD_TAG}`,
        pinknoise:`./assets/Pinknoise.png?${HYPER_RELOAD_TAG}`,
      }
    };
  }
  return {
    kinds:['fourk','meat','holo','rent','drink'],
    images:{
      fourk:`./assets/4K.png?${HYPER_RELOAD_TAG}`,
      meat:`./assets/Meat.png?${HYPER_RELOAD_TAG}`,
      holo:`./assets/HoloCompanion.png?${HYPER_RELOAD_TAG}`,
      rent:`./assets/Rent.png?${HYPER_RELOAD_TAG}`,
      drinkA:`./assets/Drink_Oil_01.png?${HYPER_RELOAD_TAG}`,
      drinkB:`./assets/Drink_Oil_02.png?${HYPER_RELOAD_TAG}`,
    }
  };
}

// ====== core state objects ======
let C, ctx, off, octx, VW_CANVAS, VH_CANVAS;
let gameState = 'playing', score = 0, btc = 0, level = 1;
const SCORE_POINTS={hack:20,shot:10,coin:5,relay:50,relayBonus:100,jumpRobot:12};
let scoreEvents={};
function earnScore(kind){
  score+=SCORE_POINTS[kind];
  scoreEvents[kind]=(scoreEvents[kind]||0)+1;
  setRunO(`blackoutScoreEvents${LVL}`,scoreEvents);
}
let LEFT=0, RIGHT=0, UP=0, jumpBufferUntil=0, coyoteUntil=0, jumpHeld=false;
let player, cameraX=0, platforms=[], coins=[], robots=[], drones=[], females=[], terminals=[], ads=[], exitDoor=null;
let BG={far:null, near:null}, CurrentAds={kinds:[], images:{}, imgObjs:{}}, adDeck=[];
let SPR=null, LVL=1, NEXT_HREF='./index.html';
let coinImg=null, doorImg=null, ledgeImg=null, platformImg=null, terminalFrame1=null, terminalFrame2=null, sidearmImg=null, impactImg=null;
let generatedUntil=0, worldMaxX=0;
let hackUntil=0, hackCDUntil=0;
let relays=[];
let enemyShots=[], corpses=[], gangSpotted=false;
let projectiles=[], impacts=[], gunPickup=null, hasGun=false, nextShot=0, notice='', noticeUntil=0;
let coinHistory=new Set(), relayHistory=new Set();
let nextCoinId=0;
let lastCheckpointX=32;

const CHUNK = 320;
const JUMP_BUFFER = 140, COYOTE = 140;
const groundY = () => VH - TILE;

// ====== helpers ======
function clamp(v,a,b){ return v<a?a:v>b?b:v }
function aabb(a,b){ return (a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y) }
function hasGroundAt(x){return x>=0&&x<LEVEL_LEN&&!(GAPS[LVL]||[]).some(([a,b])=>x>=a&&x<b)}

// ====== input ======
addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','KeyA','KeyD','KeyW','KeyE','KeyF','KeyJ','Enter','Escape','KeyR'].includes(e.code)) e.preventDefault();
  if(gameState==='warning') { if(e.code==='Enter'||e.code==='Space') gameState='playing'; return; }

  if(e.code==='ArrowLeft'||e.code==='KeyA') LEFT=1;
  if(e.code==='ArrowRight'||e.code==='KeyD') RIGHT=1;
  if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') { UP=1; if(!e.repeat) jumpBufferUntil=simulationTime+JUMP_BUFFER; jumpHeld=true; }
  if(e.repeat) return;
  if(e.code==='Escape') gameState=(gameState==='playing')?'paused':(gameState==='paused'?'playing':gameState);
  if(e.code==='Enter') tryHack();
  if(e.code==='KeyE') triggerEMP();
  if(e.code==='KeyF'||e.code==='KeyJ') fireGun();
});

addEventListener('keyup',e=>{
  if(e.code==='ArrowLeft'||e.code==='KeyA') LEFT=0;
  if(e.code==='ArrowRight'||e.code==='KeyD') RIGHT=0;
  if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') { UP=0; jumpHeld=false; }
});

// ====== camera ======
const DEAD_ZONE = 8;
function updateCamera(){
  const center = VW * 0.40;
  const L = center - DEAD_ZONE, R = center + DEAD_ZONE;
  let target = cameraX;
  if(player.x - cameraX < L) target = player.x - L;
  else if(player.x - cameraX > R) target = player.x - R;
  cameraX += (target - cameraX) * 0.45;
  cameraX = Math.max(0, Math.min(cameraX, worldMaxX - VW));
}

// ====== animator helper ======
function makeAnimator(sheet, fw, fh, fps){
  const frames = sheet ? Math.max(1, Math.floor(sheet.width / fw)) : 1;
  let frame=0, time=0, spf=1000/(fps||8);
  return {
    reset(){ frame=0; time=0; },
    step(dt, clamp=false){ time+=dt; while(time>spf){ time-=spf; frame = clamp ? Math.min(frame+1, frames-1) : (frame+1)%frames; } },
    draw(x,y,flip=false,alpha=1){
      if(!sheet){
        ctx.save();
        ctx.globalAlpha=alpha;
        ctx.fillStyle='#8a99ff';
        ctx.fillRect(x+6,y+6,36,36);
        ctx.strokeStyle='#2a3a8f';
        ctx.strokeRect(x+6,y+6,36,36);
        ctx.restore();
        return;
      }
      const sx=frame*fw, sy=0;
      ctx.save(); ctx.globalAlpha=alpha;
      if(flip){ ctx.translate(x+fw,y); ctx.scale(-1,1); ctx.drawImage(sheet,sx,sy,fw,fh,0,0,fw,fh); }
      else { ctx.drawImage(sheet,sx,sy,fw,fh,x,y,fw,fh); }
      ctx.restore();
    },
    frames
  };
}

// ====== sprites ======
// Source files contain single poses with backgrounds, not animation strips.
// Trace the character silhouette while drawing the original, unmodified artwork.
async function femaleSheet(state,src){
 const img=await IMG(src+'?'+HYPER_RELOAD_TAG);
 const outlines={
 idle:[[.32,.03],[.55,.02],[.64,.06],[.66,.21],[.64,.27],[.69,.37],[.72,.45],[.75,.51],[.74,.56],[.69,.56],[.68,.66],[.70,.78],[.73,.92],[.74,.98],[.60,.98],[.56,.87],[.55,.73],[.49,.62],[.46,.74],[.43,.83],[.43,.96],[.34,.97],[.31,.91],[.32,.77],[.34,.65],[.33,.57],[.25,.56],[.24,.51],[.26,.41],[.27,.29],[.31,.23]],
 walk:[[.49,.06],[.62,.06],[.67,.10],[.66,.19],[.62,.24],[.65,.36],[.72,.41],[.79,.41],[.86,.44],[.86,.47],[.79,.48],[.70,.46],[.62,.43],[.64,.55],[.65,.65],[.68,.70],[.67,.78],[.72,.85],[.84,.87],[.86,.90],[.78,.94],[.70,.94],[.60,.91],[.57,.85],[.54,.73],[.51,.67],[.45,.61],[.39,.73],[.32,.80],[.27,.88],[.25,.93],[.20,.94],[.14,.90],[.13,.87],[.19,.82],[.21,.75],[.28,.64],[.32,.58],[.35,.48],[.39,.43],[.32,.40],[.25,.47],[.23,.52],[.19,.52],[.15,.49],[.16,.45],[.23,.40],[.29,.32],[.32,.27],[.26,.29],[.28,.21],[.35,.17],[.43,.15]],
 run:[[.28,.14],[.36,.13],[.48,.14],[.61,.10],[.71,.10],[.77,.13],[.78,.20],[.73,.25],[.76,.33],[.82,.35],[.84,.32],[.88,.33],[.93,.37],[.92,.40],[.86,.42],[.75,.40],[.66,.36],[.64,.45],[.66,.50],[.70,.56],[.70,.60],[.65,.66],[.57,.72],[.48,.78],[.49,.83],[.57,.86],[.57,.89],[.51,.90],[.43,.87],[.38,.83],[.35,.80],[.34,.76],[.43,.65],[.52,.57],[.45,.57],[.37,.66],[.27,.76],[.18,.83],[.13,.87],[.17,.92],[.17,.94],[.12,.94],[.09,.90],[.07,.85],[.07,.82],[.13,.79],[.18,.74],[.26,.66],[.31,.57],[.37,.49],[.41,.45],[.35,.43],[.32,.39],[.26,.42],[.20,.46],[.16,.46],[.12,.42],[.13,.39],[.18,.35],[.20,.29],[.24,.25],[.28,.24],[.33,.24],[.29,.21],[.25,.20],[.30,.18]]};
 const sheet=document.createElement('canvas');sheet.width=48;sheet.height=48;
 const g=sheet.getContext('2d');g.save();g.translate(11,12);g.scale(26,36);g.beginPath();
 outlines[state].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();g.drawImage(img,0,0,1,1);g.restore();return sheet;
}
async function loadSprites(def){
  const packs=['player','robot','drone','female','robot_armed','gang_rats','gang_saints'];
  const entries=await Promise.all(packs.map(async who=>{
    const {fw,fh}=def[who],pack={fw,fh,anim:{}};
    await Promise.all(Object.entries(def[who].states).map(async ([state,src])=>{
      let img=null;
      try {img=who==='female'?await femaleSheet(state,src):await IMG(src+'?'+HYPER_RELOAD_TAG)}
      catch(error){console.warn('Sprite unavailable:',src)}
      pack.anim[state]={img,make:()=>makeAnimator(img,fw,fh,def[who].fps[state]||8)};
    }));return [who,pack];
  }));return Object.fromEntries(entries);
}

function setAnim(actor, who, state, clamp=false){
  const packName=who==='player'&&hasGun?'playerArmed':who;
  if(actor.anim.state===state && actor.anim.who===packName && actor.anim.runner) return;
  actor.anim.state=state;
  actor.anim.who=packName;
  const spec=SPR[packName]?.anim?.[state];
  actor.anim.runner = spec ? spec.make() : null;
  if(actor.anim.runner) actor.anim.runner.reset();
  actor.anim.clamp=clamp;
}

function stepAnim(a,dt){ if(a.anim.runner) a.anim.runner.step(dt, a.anim.clamp); }
function drawAnim(a,who,x,y,flip=false,alpha=1){ const run=a.anim.runner; if(run) run.draw(x,y,flip,alpha); }

// Build each armed state once from the original sprite and gun pixels. The
// player's hand is drawn over the grip, so it is part of the animation frame.
function makeArmedPlayerSprites(){
  const base=SPR.player, armed={fw:48,fh:48,anim:{}};
  const hands={idle:[26,26],walk:[26,26],run:[29,23],jump:[26,26],
    fall:[29,23],hurt:[26,26]};
  for(const [state,spec] of Object.entries(base.anim)){
    const img=spec.img;
    if(!img || !sidearmImg || !hands[state]){armed.anim[state]=spec;continue;}
    const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;
    const g=sheet.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(img,0,0);
    const [hx,hy]=hands[state],frames=Math.max(1,Math.floor(img.width/48));
    for(let frame=0;frame<frames;frame++){
      const origin=frame*48;
      g.drawImage(sidearmImg,origin+hx-5,hy-6,16,12);
      g.drawImage(img,origin+hx,hy,2,2,origin+hx,hy,2,2);
    }
    armed.anim[state]={img:sheet,make:()=>makeAnimator(sheet,48,48,SPRITE_DEF.player.fps[state])};
  }
  return armed;
}

// ====== parallax backgrounds ======
const PARALLAX = {far: 0.12, near: 0.82};
// Source-image coordinates of chimney mouths in security_bg_far.png.
const SECURITY_STACKS = [[99,152],[130,180],[391,245],[1008,211],[1070,225],[1590,152],[1620,181]];

function setBackgroundsForLevel(lvl){
  const urls = bgURLsForLevel(lvl);
  SPRITE_DEF.bg_far = urls.far;
  SPRITE_DEF.bg_near = urls.near;
  SPRITE_DEF.coin = `./assets/btc_glow.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.door = `./assets/shop_door_neon.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.ledge = `./assets/ledge_tile.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.platform = `./assets/platform_industrial.png?${HYPER_RELOAD_TAG}`;
}

async function loadBackgrounds(){
  [BG.far,BG.near] = await Promise.all([SPRITE_DEF.bg_far,SPRITE_DEF.bg_near].map(src=>IMG(src).catch(()=>null)));
}

async function loadAdImagesForLevel(lvl){
  CurrentAds = adConfigForLevel(lvl);
  CurrentAds.imgObjs = {};
  await Promise.all(Object.entries(CurrentAds.images||{}).map(async ([key,src])=>{
    try {CurrentAds.imgObjs[key]=await IMG(src)}
    catch(error){console.warn('Ad image unavailable:',src)}
  }));
  refillDeck();
}

function tileParallax(img, speed){
  if(!img) return;
  const scale = VH / img.height;
  const tileW = Math.max(1, Math.round(img.width * scale));
  const cam = cameraX || 0;
  let x = -Math.floor((cam * speed) % tileW);
  if (x > 0) x -= tileW;
  for(let i = 0, count = Math.ceil(VW/tileW)+2; i < count; i++){
    const drawX = x + i * tileW;
    // These layers contain lettering. Mirroring alternate tiles reverses the signs.
    ctx.drawImage(img, 0, 0, img.width, img.height, drawX, 0, tileW, VH);
  }
}

function drawSecuritySkyEffects(){
  if(LVL<4 || !BG.far) return;
  const scale=VH/BG.far.height;
  const tileW=Math.max(1,Math.round(BG.far.width*scale));
  const offset=-Math.floor(((cameraX||0)*PARALLAX.far)%tileW);
  const seconds=simulationTime/1000;
  const tiles=Math.ceil(VW/tileW)+2;
  ctx.save();
  for(let tile=0;tile<tiles;tile++){
    const left=offset+tile*tileW;
    for(const [sx,sy] of SECURITY_STACKS){
      const mouthX=left+sx*scale, mouthY=sy*scale;
      if(mouthX < -22 || mouthX > VW+22) continue;
      for(let i=0;i<6;i++){
        const rise=(seconds*.18+i/6)%1;
        const drift=Math.sin(seconds*.7+i*1.7+sx)*2+rise*5;
        const radius=1.5+rise*4;
        ctx.globalAlpha=(1-rise)*.23;
        ctx.fillStyle='#a3a4c3';
        ctx.beginPath();
        ctx.ellipse(mouthX+drift,mouthY-rise*25,radius*1.35,radius,0,0,Math.PI*2);
        ctx.fill();
      }
    }
  }
  const haze=ctx.createLinearGradient(0,0,0,102);
  haze.addColorStop(0,'rgba(75,82,132,.10)');
  haze.addColorStop(.55,'rgba(112,92,144,.07)');
  haze.addColorStop(1,'rgba(112,92,144,0)');
  ctx.globalAlpha=.8+Math.sin(seconds*.18)*.12;
  ctx.fillStyle=haze;
  ctx.fillRect(0,0,VW,102);
  ctx.restore();
}

function drawBackgrounds(){
  if(!BG.far && !BG.near){ drawSky(); return; }
  if(BG.far) tileParallax(BG.far, PARALLAX.far);
  drawSecuritySkyEffects();
  if(BG.near) tileParallax(BG.near, PARALLAX.near);
}

function drawSky(){
  for(let y = 0; y < VH; y++){
    const t = y / VH;
    ctx.fillStyle = `rgb(${12+18*t|0},${16+30*t|0},${30+58*t|0})`;
    ctx.fillRect(0, y, VW, 1);
  }
}

// ====== ads ======
let lastAdKind = null; // Track the last ad shown

function refillDeck(){ 
  // Create multiple copies of each ad type to ensure variety
  adDeck = [];
  for(let i = 0; i < 8; i++){ // Increased from 5 to 8 copies
    adDeck.push(...CurrentAds.kinds);
  }
  // Better shuffling algorithm - Fisher-Yates shuffle
  for(let i = adDeck.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [adDeck[i], adDeck[j]] = [adDeck[j], adDeck[i]];
  }
}

function nextAdKind(){ 
  if(!adDeck.length || adDeck.length < 3) refillDeck(); // Refill earlier
  
  // If we have multiple ad types available, avoid showing the same ad consecutively
  if(CurrentAds.kinds.length > 1 && lastAdKind) {
    // Find the first ad in deck that's different from the last one
    let foundIndex = -1;
    for(let i = 0; i < adDeck.length; i++) {
      if(adDeck[i] !== lastAdKind) {
        foundIndex = i;
        break;
      }
    }
    
    if(foundIndex !== -1) {
      // Remove the found ad from its position and use it
      const kind = adDeck.splice(foundIndex, 1)[0];
      lastAdKind = kind;
      return kind;
    }
  }
  
  // Fallback to normal behavior if no alternatives found or first ad
  const kind = adDeck.shift();
  lastAdKind = kind;
  return kind; 
}

// ====== world generation ======
function pushGroundRow(startX, endX){
  for(let x = startX; x < endX; x += TILE){
    if((GAPS[LVL]||[]).some(([a,b])=>x>=a&&x<b))continue;
    platforms.push({x, y: groundY(), w: TILE, h: TILE});
  }
}
function addCoin(x,y){
  const id=nextCoinId++;
  coins.push({x:x|0,y:y|0,r:10,taken:coinHistory.has(id),id});
}

function genChunk(startX){
  const endX = startX + CHUNK;
  const firstScreen = startX < VW;
  const lvl = LVL;

  pushGroundRow(startX, endX);

  // The Bazaar uses its established elevated route and paid encounters.
  if(lvl === 3){
    if(startX>=CHUNK){
      platforms.push({x:startX+70,y:groundY()-48,w:80,h:TILE});
      platforms.push({x:startX+190,y:groundY()-80,w:64,h:TILE});
      terminals.push({x:startX+100,y:groundY()-64,w:12,h:16,cooldown:0});
      addCoin(startX+210,groundY()-100);
    }
    if(!firstScreen && startX >= CHUNK){
      for(let i = 0; i < 5; i++){ // Even more coins in Level 3
        const cx = startX + 30 + Math.random() * (CHUNK - 60);
        addCoin(cx,groundY()-24);
      }
      // ads - more frequent with guaranteed variety
      if(Math.random() < 0.8){ // Higher chance for more ads
        const ax = startX + 80 + Math.random() * (CHUNK - 160);
        const ay = VH - (100 + ((Math.random() * 60)|0));
        ads.push({x: ax|0, y: ay|0, kind: nextAdKind(), phase: Math.random() * 6});
      }

      // Female NPCs for Level 3 (spawn in every chunk after 400)
      const fc = 1;
      for(let i = 0; i < fc; i++){
        const fx = startX + 64 + Math.random() * (CHUNK - 128);
        const newFemale = {
          x: fx|0, y: groundY() - 28, w: 18, h: 28, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.6, hp: 1,
          active: false, hitUntil: 0, state: 'patrol', alert: false, patrolL: fx - 50, patrolR: fx + 50,
          searchUntil: 0, lookTimer: 0, hasCharged: false, anim: {state: 'idle', runner: null}
        };
        // Initialize animation immediately if sprites are loaded
        if(SPR && SPR.female) {
          setAnim(newFemale, 'female', 'idle');
        }
        females.push(newFemale);
      }
    }
    generatedUntil = endX;
    worldMaxX = Math.max(worldMaxX, endX);
    return;
  }

  // Ledges and other platforms
  const allowLedges = !firstScreen && (lvl>1 || startX>=CHUNK*2);

  if(allowLedges){
    const LOW_LEDGE_OFFSET = TILE * 3;
    const HIGH_LEDGE_OFFSET = TILE * 5;

    // Fixed supports avoid overlap. From the first ledge, the second starts
    // 56 px away and 32 px higher; the base jump covers this at 1.52 px/tick.
    const lowX = startX + 32, highX = startX + 160;
    const lowW = 72, highW = 64;
    const lowY = groundY() - (lvl===1 ? 32 : LOW_LEDGE_OFFSET);
    const highY = groundY() - (lvl===1 ? 48 : HIGH_LEDGE_OFFSET);

    platforms.push({x: lowX, y: lowY, w: lowW, h: TILE});
    if(LEVELS[lvl].ledges>=2) platforms.push({x: highX, y: highY, w: highW, h: TILE});
    if(LEVELS[lvl].ledges>=3) platforms.push({x:startX+256,y:groundY()-64,w:48,h:TILE});

    const above = [{x:lowX+lowW/2,y:lowY-20}];
    if(LEVELS[lvl].ledges>=2) above.push({x:highX+highW/2,y:highY-20});
    if(LEVELS[lvl].ledges>=3) above.push({x:startX+280,y:groundY()-84});
    for(const p of above){
      addCoin(p.x,Math.max(40, Math.min(VH - 24, p.y)));
    }

    if(Math.random() < 0.5){
      const tx = startX + 40 + Math.random() * (CHUNK - 80);
      let ty = VH - TILE * 2;
      for(const p of platforms){
        if(tx >= p.x - 4 && tx <= p.x + p.w + 4) ty = Math.min(ty, p.y - TILE);
      }
      terminals.push({x: tx|0, y: ty|0, w: 12, h: 16, cooldown: 0});
    }

    // ads - better spacing, more frequent for Level 1
    const adChance = lvl === 1 ? 0.9 : 0.7; // 90% chance for Level 1, 70% for others
    if(Math.random() < adChance){
      const ax = startX + 80 + Math.random() * (CHUNK - 160); // More centered
      const ay = VH - (120 + ((Math.random() * 40)|0)); // Lower placement for better visibility
      ads.push({x: ax|0, y: ay|0, kind: nextAdKind(), phase: Math.random() * 6});
    }
  }

  if(LEVELS[lvl]?.robots && startX >= CHUNK && startX < LEVEL_LEN-CHUNK){
    const rc = LEVELS[lvl].robots;
    for(let i = 0; i < rc; i++){
      const rx = startX + 210 + i*35;
      const armed = !!LEVELS[lvl].fireEvery;
      robots.push({
        x: rx|0, y: VH - TILE * 2, w: 18, h: 24, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.66, hp: 3,
        active: false, hitUntil: 0, state: 'patrol', alert: false, patrolL: rx - 40, patrolR: rx + 40,
        searchUntil: 0, lookTimer: 0, anim: {state: 'idle', runner: null},
        kind: 'robot', pack: armed ? 'robot_armed' : 'robot', armed,
        nextShot: 0, windupUntil: 0, attackUntil: 0
      });
    }
  }

  // Street gangs work the early sectors. They're human, so hacking terminals doesn't stop them.
  const gang = LEVELS[lvl]?.gang && GANGS[LEVELS[lvl].gang];
  if(gang && startX >= CHUNK && startX < LEVEL_LEN-CHUNK){
    for(let i = 0; i < LEVELS[lvl].gangs; i++){
      const gx = (startX + 120 + Math.random() * 120)|0;
      if(!hasGroundAt(gx) || !hasGroundAt(gx + 18)) continue;
      robots.push({
        x: gx, y: groundY() - 28, w: 18, h: 28, dir: Math.random() < 0.5 ? -1 : 1, speed: gang.speed, hp: gang.hp,
        active: false, hitUntil: 0, state: 'patrol', alert: false, patrolL: gx - 40, patrolR: gx + 40,
        searchUntil: 0, lookTimer: 0, anim: {state: 'idle', runner: null},
        kind: 'gang', pack: 'gang_' + LEVELS[lvl].gang, damage: gang.damage
      });
    }
  }

  if(LEVELS[lvl]?.drones && startX >= CHUNK*2){
    // Level 2: Robots in starting area fixed by only activating them later
    if(Math.random() < 0.6){
      const dx = startX + 80 + Math.random() * (CHUNK - 160);
      const dy = 60 + Math.random() * 80;
      const newDrone = {
        x: dx|0, y: dy|0, w: 18, h: 14, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.8,
        phase: Math.random() * 6, active: false, disabled: false, anim: {state: 'move', runner: null}
      };
      
      // Initialize animation immediately if sprites are loaded
      if(SPR && SPR.drone) {
        setAnim(newDrone, 'drone', 'move');
      }
      
      drones.push(newDrone);
    }
  }

  generatedUntil = endX;
  worldMaxX = Math.max(worldMaxX, endX);
}

// ====== player ======
function makePlayer(){
  const savedHealth = getRunN('playerHealth', 100);
  const savedUpgrades = getRunO('playerUpgrades', {});
  const baseSpeed = 1.52;
  const baseJump = 5.6;
  const speed = savedUpgrades.speedBoost ? baseSpeed * 1.3 : baseSpeed;
  const jump = savedUpgrades.jumpBoost ? baseJump * 1.2 : baseJump;

  return {
    x: 32, y: VH - 80, w: 18, h: 28, vx: 0, vy: 0, onGround: false, facing: 1,
    speed, aGround: 0.19, aAir: 0.12, dragG: 0.82, dragA: 0.986, jump,
    hp: savedHealth, dist: 0, hitUntil: 0, anim: {state: 'idle', runner: null},
    upgrades: savedUpgrades
  };
}

// ====== physics ======
function rects(a, b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function collide(body){
  body.onGround = false;

  const previousBottom = body.y + body.h, previousTop = body.y;
  body.y += body.vy;
  for(const p of platforms){
    if(p.x > body.x+body.w+24 || p.x+p.w < body.x-24) continue;
    if(rects(body, p)){
      if(body.vy >= 0 && previousBottom <= p.y+2){ body.y = p.y - body.h; body.vy = 0; body.onGround = true; }
      else if(body.vy < 0 && previousTop >= p.y+p.h-2){ body.y = p.y + p.h; body.vy = 0; }
    }
  }

  body.x += body.vx;
  for(const p of platforms){
    if(p.x > body.x+body.w+24 || p.x+p.w < body.x-24) continue;
    if(rects(body, p)){
      // The visible rail is decorative; collisions use the deck rectangle.
      if(body.vx > 0) body.x = p.x - body.w;
      else if(body.vx < 0) body.x = p.x + p.w;
      body.vx = 0;
    }
  }
}

// ====== hack / emp ======
function tryHack(){
  if(!player || gameState!=='playing') return;
  const now = simulationTime;
  if(now < hackCDUntil) return;
  const near = terminals.find(t => 
    Math.hypot((t.x + 6) - (player.x + player.w/2), (t.y + 8) - (player.y + player.h/2)) < 18 && 
    t.cooldown <= 0
  );
  if(near){
    const d = player.upgrades?.advancedHack ? 5000 : 3000;
    hackUntil = now + d;
    hackCDUntil = now + 5000;
    near.cooldown = 5000;
    earnScore('hack');
  }
}

function triggerEMP(){
  if(!player || gameState!=='playing') return;
  const charges = (player.upgrades?.mobileEMPCharges | 0);
  if(!(player.upgrades?.mobileEMP) || charges <= 0) return;
  player.upgrades.mobileEMPCharges = charges - 1;
  setRunO('playerUpgrades', player.upgrades);

  const left = cameraX - 40, right = cameraX + VW + 40;
  robots = robots.filter(r => (r.x < left) || (r.x > right));
  for(const d of drones){
    if(d.x >= left && d.x <= right){
      d.disabled = true; d.dir = 0; d.speed = 0; d.y = groundY() - 28;
    }
  }
}

function fireGun(){
  if(gameState!=='playing' || !hasGun || simulationTime<nextShot) return;
  nextShot=simulationTime+320;
  projectiles.push({x:player.x+(player.facing>0?20:-2),y:player.y+5,
    vx:player.facing*5.5,life:500,hit:false});
}

function updateProjectiles(dt){
  for(const shot of projectiles){
    shot.x+=shot.vx; shot.life-=dt;
    if(shot.x<0 || shot.x>LEVEL_LEN || platforms.some(p=>p.y<groundY() &&
      shot.x>=p.x && shot.x<=p.x+p.w && shot.y>=p.y && shot.y<=p.y+p.h)) shot.life=0;
    for(const r of robots){
      if(shot.life>0 && !shot.hit && shot.x>=r.x && shot.x<=r.x+r.w &&
        shot.y>=r.y-14 && shot.y<=r.y+r.h){r.hp--;r.hitUntil=simulationTime+220;shot.hit=true;shot.life=0;earnScore('shot');
          impacts.push({x:shot.x,y:shot.y,until:simulationTime+180});break;}
    }
  }
  projectiles=projectiles.filter(s=>s.life>0);
  impacts=impacts.filter(i=>i.until>simulationTime);
}

// Robot rifle bolts: stopped by raised platforms; one hit per hurt window.
function updateEnemyShots(dt, now){
  for(const shot of enemyShots){
    shot.x += shot.vx; shot.life -= dt;
    if(shot.x < 0 || shot.x > LEVEL_LEN || platforms.some(p => p.y < groundY() &&
      shot.x >= p.x && shot.x <= p.x + p.w && shot.y >= p.y && shot.y <= p.y + p.h)){
      shot.life = 0; impacts.push({x: shot.x, y: shot.y, until: now + 160}); continue;
    }
    if(shot.x >= player.x && shot.x <= player.x + player.w && shot.y >= player.y && shot.y <= player.y + player.h){
      shot.life = 0; impacts.push({x: shot.x, y: shot.y, until: now + 180});
      if(now > player.hitUntil){
        player.hitUntil = now + 700;
        player.vx += Math.sign(shot.vx) * 0.9;
        const damage = LVL >= 6 ? 7 : 6;
        applyDamage(player.upgrades?.armor ? damage - 2 : damage);
      }
    }
  }
  enemyShots = enemyShots.filter(s => s.life > 0);
}

// ====== coins ======
function pickupCoins(){
  for(const c of coins){
    if(c.taken) continue;
    const px = player.x + player.w/2, py = player.y + player.h/2;
    const dx = c.x - px, dy = c.y - py;
    const dist2 = dx*dx + dy*dy;

    const hasUpgrade = !!(player.upgrades && player.upgrades.coinMagnet === true);
    const magnetR = hasUpgrade ? 56 : 24;
    if(dist2 <= magnetR * magnetR){
      const d = Math.sqrt(dist2) || 1;
      const pull = hasUpgrade ? 1.3 : 0.65;
      c.x -= (dx/d) * pull;
      c.y -= (dy/d) * pull;
    }
    const rr = (c.r || 10) + 8;
    if(dist2 <= rr * rr){
      c.taken = true;
      btc += 1; earnScore('coin');
      coinHistory.add(c.id);
      setRunO(`blackoutCoins${LVL}`,[...coinHistory]);
      setRunN('playerBTC',btc);setRunN('playerScore',score);
    }
  }
}

// ====== damage / death ======
function applyDamage(dmg){
  if(gameState!=='playing') return;
  if(LVL === 1) dmg = Math.min(dmg, 20);
  player.hp = Math.max(0, player.hp - Math.max(0, dmg|0));
  if(player.hp <= 0){
    gameState='dead';
    setRunN('playerScore',score);
    postScore(score);
    setTimeout(async () => {
      await Account.finishRun(score,scoreEvents);
      goTo('./game-over.html');
    }, 800);
    return;
  }
  setRunN('playerHealth', player.hp);
}

// ====== level management ======
function placeExitDoor(){
  const x = LEVEL_LEN - 40, y = groundY() - DOOR_H;
  exitDoor = {x, y, w: DOOR_W, h: DOOR_H};
}

function activateEnemies(){
  const visRight = cameraX + VW + 64;
  
  for(const r of robots){
    if(!r.active && r.x < visRight){
      // Robots only activate after player progresses past starting area
      r.active = true;
    }
  }
  
  for(const d of drones){
    if(!d.active && d.x < visRight){ if(LVL >= 2) d.active = true; }
  }
  
  // Enhanced female activation for Level 3
  for(const f of females){
    if(LVL === 3) {
      // Always activate females in Level 3 if they're in view range
      if(!f.active && f.x < visRight + 100) { // Wider activation range
        f.active = true; 
        // Ensure animation is set up
        if(!f.anim.runner && SPR && SPR.female) {
          setAnim(f, 'female', 'idle');
        }
      }
    }
  }
}

function playerLitByCone(){
  if(LVL < 2 || !drones.length) return false;
  const px = player.x + player.w/2, py = player.y + player.h/2;
  for(const d of drones){
    if(!d.active || d.disabled) continue;
    const topXw = d.x + 8, topYw = d.y + 10;
    if(py < topYw) continue;
    const coneH = 120, baseW = 70;
    const t = Math.min(1, (py - topYw) / coneH);
    const halfAtY = (baseW/2) * t;
    if(Math.abs(px - topXw) <= halfAtY) return true;
  }
  return false;
}

function cull(){
  const cutoff = cameraX - 300;
  for(let i = ads.length - 1; i >= 0; i--) if(ads[i].x + 160 < cutoff) ads.splice(i, 1);
  for(let i = robots.length - 1; i >= 0; i--) if(robots[i].x + 120 < cutoff) robots.splice(i, 1);
  for(let i = drones.length - 1; i >= 0; i--) if(drones[i].x + 120 < cutoff) drones.splice(i, 1);
  for(let i = coins.length - 1; i >= 0; i--) if(coins[i].x + 40 < cutoff) coins.splice(i, 1);
  for(let i = females.length - 1; i >= 0; i--) if(females[i].x + 120 < cutoff) females.splice(i, 1);
}

// ====== load tiles ======
async function loadTiles(){
  const urls=[SPRITE_DEF.coin,SPRITE_DEF.door,SPRITE_DEF.ledge,SPRITE_DEF.platform,
    `./assets/hacker_terminal_frame1.png?${HYPER_RELOAD_TAG}`,
    `./assets/hacker_terminal_frame2.png?${HYPER_RELOAD_TAG}`,
    `./assets/sidearm_16.png?${HYPER_RELOAD_TAG}`,
    `./assets/impact_8.png?${HYPER_RELOAD_TAG}`];
  [coinImg,doorImg,ledgeImg,platformImg,terminalFrame1,terminalFrame2,sidearmImg,impactImg]=
    await Promise.all(urls.map(src=>IMG(src).catch(()=>null)));
}

// ====== update ======
function update(dt, now){
  if(gameState !== 'playing') return;

  for(const t of terminals){
    if(t.cooldown > 0) t.cooldown = Math.max(0, t.cooldown - dt);
  }

  const L = !!LEFT, R = !!RIGHT;
  const accel = player.onGround ? player.aGround : player.aAir;
  const drag = player.onGround ? player.dragG : player.dragA;

  if(L){ player.vx = Math.max(player.vx - accel, -player.speed); player.facing = -1; }
  if(R){ player.vx = Math.min(player.vx + accel, player.speed); player.facing = 1; }
  if(!L && !R) player.vx *= drag;

  if(player.onGround) coyoteUntil = now + COYOTE;
  const wantsJump = now <= jumpBufferUntil;
  if(wantsJump && (player.onGround || now <= coyoteUntil)){
    player.vy = -player.jump; player.onGround = false; jumpBufferUntil = 0; coyoteUntil = 0;
  }
  if(!jumpHeld && player.vy < -1.25) player.vy = -1.25;

  player.vy += 0.18;
  if(player.vy > 3.7) player.vy = 3.7;

  collide(player);
  player.x = clamp(player.x,0,LEVEL_LEN-player.w);
  if(player.y>VH+24){
    player.x=lastCheckpointX;player.y=groundY()-player.h;
    player.vx=0;player.vy=0;player.onGround=true;player.hitUntil=now+1000;
    notice='SIGNAL RECOVERED AT CHECKPOINT';noticeUntil=now+1800;
    applyDamage(8);
  }
  const nextCheckpoint=lastCheckpointX+320;
  if(player.x>=nextCheckpoint && player.onGround &&
    !(GAPS[LVL]||[]).some(([a,b])=>nextCheckpoint>=a&&nextCheckpoint<b)){
    lastCheckpointX=nextCheckpoint;setRunN(`blackoutCheckpoint${LVL}`,lastCheckpointX);
  }
  pickupCoins();
  if(gunPickup && !hasGun && aabb(player,gunPickup)){
    hasGun=true;gunPickup=null;notice='SIDEARM ACQUIRED · F / J TO FIRE';noticeUntil=now+3000;
    setRunN('blackoutGun',1);
  }
  updateProjectiles(dt);

  if(player.hp <= 0) setAnim(player, 'player', 'dead', true);
  else if(now < player.hitUntil) setAnim(player, 'player', 'hurt', true);
  else if(!player.onGround) setAnim(player, 'player', player.vy < 0 ? 'jump' : 'fall');
  else {
    const s = Math.abs(player.vx);
    setAnim(player, 'player', s > 1.05 ? 'run' : (s > 0.2 ? 'walk' : 'idle'));
  }
  stepAnim(player, dt);

  for(const relay of relays){
    if(!relay.taken && Math.hypot(player.x+9-relay.x,player.y+14-relay.y)<24){
      relay.taken=true; earnScore('relay'); btc+=3;
      relayHistory.add(relay.id);setRunO(`blackoutRelays${LVL}`,[...relayHistory]);
      if(relays.every(r=>r.taken)){earnScore('relayBonus'); player.hp=Math.min(100,player.hp+15)}
      setRunN('playerBTC',btc);setRunN('playerScore',score);setRunN('playerHealth',player.hp);
    }
  }
  const need = cameraX + VW + CHUNK * 2;
  while(generatedUntil < Math.min(need,LEVEL_LEN)) genChunk(generatedUntil);

  activateEnemies();
  const hacked = now < hackUntil;

  // drones movement
  for(const d of drones){
    if(!d.active || d.disabled) continue;
    setAnim(d,'drone','move'); stepAnim(d,dt);
    if(!hacked){
      d.x += d.dir * d.speed;
      d.phase = (d.phase || 0) + 0.02;
      d.y += Math.sin(d.phase) * 0.2;
      if((d.x % CHUNK) < 8 || (d.x % CHUNK) > CHUNK - 8) d.dir *= -1;
    }
  }

  // robots AI
  const lit = playerLitByCone();

  for(const r of robots){
    if(!r.active) continue;
    const pack = r.pack || 'robot';
    // Terminal hacks shut down machines; gang members keep coming.
    if(hacked && r.kind !== 'gang'){ r.windupUntil = 0; stepAnim(r,dt); continue; }
    const oldX=r.x;
    const dx = player.x - r.x;
    const dy = player.y - r.y;
    const see = Math.abs(dx) < 92 && Math.abs(dy) < 56;

    const playerAbove = (player.y + player.h) < (r.y - 6);
    let hasFloorBetween = false;
    if(playerAbove){
      for(const p of platforms){
        const betweenY = (p.y >= player.y) && (p.y <= r.y);
        const overlapX = (r.x > p.x - 8) && (r.x < p.x + p.w + 8);
        if(betweenY && overlapX){ hasFloorBetween = true; break; }
      }
    }

    if(see && !(playerAbove && hasFloorBetween)){
      if(r.kind === 'gang' && !gangSpotted){
        gangSpotted = true; notice = GANGS[LEVELS[LVL].gang].label + ' SPOTTED YOU'; noticeUntil = now + 1800;
      }
      r.state = 'chase'; r.alert = true; r.dir = dx > 0 ? 1 : -1;
      r.x += r.dir * r.speed * 1.25;
    } else if(playerAbove){
      if(r.state !== 'search'){
        r.state = 'search'; r.alert = false; r.searchUntil = now + 2500 + Math.random() * 2000;
        const offset = (dx > 0 ? -1 : 1) * (24 + Math.random() * 28);
        const c = r.x + offset, span = 28 + Math.random() * 18;
        r.patrolL = c - span; r.patrolR = c + span; r.dir = Math.random() < 0.5 ? -1 : 1;
        r.lookTimer = now + 600 + Math.random() * 800;
      }
      if(now > r.lookTimer){ r.dir *= -1; r.lookTimer = now + 600 + Math.random() * 900; }
      r.x += r.dir * r.speed * 0.9;
      if(r.x < r.patrolL){ r.x = r.patrolL; r.dir = 1; }
      if(r.x > r.patrolR){ r.x = r.patrolR; r.dir = -1; }
      if(lit){ r.alert=true; }
      if(now > r.searchUntil) r.state = 'patrol';
    } else {
      r.alert = false;
      if(r.state !== 'patrol'){ r.state = 'patrol'; r.patrolL = r.x - 40; r.patrolR = r.x + 40; r.dir = Math.sign(dx) || 1; }
      r.x += r.dir * r.speed;
      if(r.x < r.patrolL){ r.x = r.patrolL; r.dir = 1; }
      if(r.x > r.patrolR){ r.x = r.patrolR; r.dir = -1; }
    }

    if(!hasGroundAt(r.x+r.w/2)){r.x=oldX;r.dir*=-1;r.state='patrol';}

    // Armed robots stop, aim for a moment (laser sight), then fire a bolt.
    if(r.armed){
      const aimY = r.y - 24 + ROBOT_MUZZLE.y;
      const inRange = Math.abs(dx) < 150 && Math.abs((player.y + player.h/2) - aimY) < 30 &&
        r.x - cameraX > -10 && r.x - cameraX < VW + 10;
      if(r.windupUntil){
        r.x = oldX;
        if(now >= r.windupUntil){
          const dir = player.x < r.x ? -1 : 1;
          const mx = r.x - 14 + (dir > 0 ? ROBOT_MUZZLE.x : 48 - ROBOT_MUZZLE.x);
          enemyShots.push({x: mx, y: aimY, vx: dir * 2.4, life: 1600});
          r.windupUntil = 0; r.attackUntil = now + 260;
          r.nextShot = now + LEVELS[LVL].fireEvery * (0.85 + Math.random() * 0.3);
        }
      } else if(inRange && now >= r.nextShot && now >= r.attackUntil){
        r.windupUntil = now + 450;
      }
      if(now < r.attackUntil) r.x = oldX;
    }
    const aiming = r.windupUntil || now < r.attackUntil;
    setAnim(r, pack, aiming ? 'attack' : (r.state === 'chase' ? 'run' : 'walk'));
    stepAnim(r, dt);

    if(aabb(player, r)){
      if(player.vy > 0 && player.y + player.h <= r.y + 6){
        r.hp--; r.hitUntil = now + 120; player.vy = -2.6; earnScore('jumpRobot');
      } else if(now > player.hitUntil){
        player.hitUntil = now + 800;
        player.vx += (player.x < r.x) ? -0.8 : 0.8;
        const base = r.kind === 'gang' ? r.damage : 7;
        applyDamage(player.upgrades?.armor ? base - 2 : base);
      }
    }
  }

  for(let i = robots.length - 1; i >= 0; i--){
    const r = robots[i];
    if(r.hp > 0) continue;
    corpses.push({x: r.x, y: r.y, pack: r.pack || 'robot', kind: r.kind, flip: player.x < r.x, until: now + 900});
    robots.splice(i, 1);
  }
  corpses = corpses.filter(c => c.until > now);
  updateEnemyShots(dt, now);

  // Bazaar NPCs charge BTC for a brief encounter instead of dealing damage.
  if(LVL === 3){
    for(const f of females){
      if(!f.active) continue;
      const oldX=f.x;
      const dx = player.x - f.x;
      const dy = player.y - f.y;
      const see = Math.abs(dx) < 92 && Math.abs(dy) < 56;

      const playerAbove = (player.y + player.h) < (f.y - 6);
      let hasFloorBetween = false;
      if(playerAbove){
        for(const p of platforms){
          const betweenY = (p.y >= player.y) && (p.y <= f.y);
          const overlapX = (f.x > p.x - 8) && (f.x < p.x + p.w + 8);
          if(betweenY && overlapX){ hasFloorBetween = true; break; }
        }
      }

      if(see && !(playerAbove && hasFloorBetween)){
        f.state = 'chase'; f.alert = true; f.dir = dx > 0 ? 1 : -1;
        f.x += f.dir * f.speed * 1.25;
      } else if(playerAbove){
        if(f.state !== 'search'){
          f.state = 'search'; f.alert = false; f.searchUntil = now + 2500 + Math.random() * 2000;
          const offset = (dx > 0 ? -1 : 1) * (24 + Math.random() * 28);
          const c = f.x + offset, span = 28 + Math.random() * 18;
          f.patrolL = c - span; f.patrolR = c + span; f.dir = Math.random() < 0.5 ? -1 : 1;
          f.lookTimer = now + 600 + Math.random() * 800;
        }
        if(now > f.lookTimer){ f.dir *= -1; f.lookTimer = now + 600 + Math.random() * 900; }
        f.x += f.dir * f.speed * 0.9;
        if(f.x < f.patrolL){ f.x = f.patrolL; f.dir = 1; }
        if(f.x > f.patrolR){ f.x = f.patrolR; f.dir = -1; }
        if(now > f.searchUntil) f.state = 'patrol';
      } else {
        f.alert = false;
        if(f.state !== 'patrol'){ f.state = 'patrol'; f.patrolL = f.x - 40; f.patrolR = f.x + 40; f.dir = Math.sign(dx) || 1; }
        f.x += f.dir * f.speed;
        if(f.x < f.patrolL){ f.x = f.patrolL; f.dir = 1; }
        if(f.x > f.patrolR){ f.x = f.patrolR; f.dir = -1; }
      }

      if(!hasGroundAt(f.x+f.w/2)){f.x=oldX;f.dir*=-1;f.state='patrol';}
      setAnim(f, 'female', f.state === 'chase' ? 'run' : 'walk');
      stepAnim(f, dt);

      // One fictional in-game BTC charge per NPC; no external wallet interaction.
      if(aabb(player, f) && !f.hasCharged){
        const charge = Math.min(5, btc);
        if(charge > 0){
          btc -= charge;
          setRunN('playerBTC', btc);
          notice=`BAZAAR ENCOUNTER  -${charge} BTC`;
          noticeUntil=now+2200;
        }
        f.hasCharged = true;
        f.hitUntil = now + 800;
      }
    }
  }

  if(exitDoor && aabb(player, exitDoor)){
    gameState = 'levelComplete';
    setTimeout(async () => {
      setRunN('playerBTC', btc);
      setRunN('playerScore', score);
      setRunN('playerHealth', player.hp);
      setRunN('gameLevel', LVL+1);
      setRunN('blackoutGun',hasGun?1:0);
      setRunO('playerUpgrades', player.upgrades);
      await Account.recordLevel(LVL, score, scoreEvents);
      goTo(NEXT_HREF);
    }, 300);
  }

  updateCamera(); cull();
  player.dist = Math.max(player.dist, player.x);
}

// ====== draw functions ======
function drawTiles(){
  const ok = (im) => im && im.complete && im.naturalWidth > 0;
  const img = ok(ledgeImg) ? ledgeImg : (ok(platformImg) ? platformImg : null);

  for(const p of platforms){
    const sx = p.x - cameraX;
    if(sx + p.w < 0 || sx > VW) continue;

    if(!img){
      ctx.fillStyle = '#1a2332'; ctx.fillRect(sx|0, p.y|0, p.w, TILE);
      ctx.fillStyle = '#6fc2ff'; ctx.fillRect(sx|0, p.y|0, p.w, 2);
      ctx.fillStyle = '#4a5568'; ctx.fillRect(sx|0, (p.y + TILE - 2)|0, p.w, 2);
      continue;
    }

    const iw = img.naturalWidth, ih = img.naturalHeight;
    const srcBaseY = Math.floor(ih * 0.55);
    const srcBaseH = ih - srcBaseY;
    const srcX = 1, srcW = Math.max(1, iw - 2);
    const dy = (p.y - (20 - TILE))|0;
    ctx.drawImage(img, srcX, srcBaseY, srcW, srcBaseH, sx|0, dy, p.w, 20);
  }
}
// Floor gaps: a lit pit below the deck, then hazard markings drawn over the tiles.
function drawGaps(){
  for(const [a,b] of GAPS[LVL]||[]){
    const x=a-cameraX,w=b-a;
    if(x+w<0||x>VW)continue;
    const top=groundY()-4;
    const pit=ctx.createLinearGradient(0,top,0,VH);
    pit.addColorStop(0,'#000');pit.addColorStop(.35,'#16030c');pit.addColorStop(1,'#7a0830');
    ctx.fillStyle=pit;ctx.fillRect(x,top,w,VH-top);
  }
}
function drawGapWarnings(){
  const t=simulationTime, blink=Math.floor(t/350)%2===0, pulse=.5+.5*Math.sin(t/260);
  for(const [a,b] of GAPS[LVL]||[]){
    const x=(a-cameraX)|0,w=b-a,top=groundY();
    if(x+w<-24||x>VW+24)continue;
    ctx.save();
    // Red glow rising from the drop.
    const glow=ctx.createLinearGradient(0,top-44,0,top+4);
    glow.addColorStop(0,'rgba(255,40,90,0)');glow.addColorStop(1,`rgba(255,40,90,${.3+.18*pulse})`);
    ctx.fillStyle=glow;ctx.fillRect(x,top-44,w,48);
    // Broken deck lips.
    ctx.fillStyle='#07080c';
    for(const [ex,dir] of [[x,1],[x+w,-1]]){ctx.fillRect(dir>0?ex:ex-2,top-4,2,3);ctx.fillRect(dir>0?ex:ex-1,top-1,1,2);}
    // Hazard stripes along both lips of the deck.
    for(const [lx,dir] of [[x-10,1],[x+w,-1]]){
      for(let i=0;i<10;i++){
        ctx.fillStyle=((i>>1)%2)?'#14161c':'#ffcc1a';
        ctx.fillRect(lx+i,top,1,3);
      }
      ctx.fillStyle='#ff2b56';ctx.fillRect(dir>0?lx+9:lx,top-1,1,5);
    }
    // Warning posts with blinking beacons at each edge.
    for(const px of [x-3,x+w+1]){
      ctx.fillStyle='#2a2f3a';ctx.fillRect(px,top-12,2,12);
      ctx.fillStyle=blink?'#ff2b56':'#5a1022';ctx.fillRect(px-1,top-15,4,3);
      if(blink){ctx.shadowColor='#ff2b56';ctx.shadowBlur=6;ctx.fillRect(px-1,top-15,4,3);ctx.shadowBlur=0;}
    }
    // Floating hazard sign above the middle of the drop.
    const cx=(x+w/2)|0,cy=(top-40+Math.sin(t/300)*1.5)|0;
    ctx.shadowColor='#ffcc1a';ctx.shadowBlur=6;
    ctx.fillStyle='rgba(20,14,0,.75)';
    ctx.beginPath();ctx.moveTo(cx,cy-8);ctx.lineTo(cx+9,cy+7);ctx.lineTo(cx-9,cy+7);ctx.closePath();ctx.fill();
    ctx.globalAlpha=.8+.2*pulse;ctx.strokeStyle='#ffcc1a';ctx.lineWidth=1.5;ctx.stroke();
    ctx.shadowBlur=0;ctx.fillStyle='#ffe066';ctx.fillRect(cx-1,cy-3,2,6);ctx.fillRect(cx-1,cy+4,2,2);
    ctx.restore();
  }
}

function drawRailsOnTop(){
  const ok = (im) => im && im.complete && im.naturalWidth > 0;
  const img = ok(ledgeImg) ? ledgeImg : null;
  if(!img) return;

  const iw = img.naturalWidth, ih = img.naturalHeight;
  const railSrcH = Math.floor(ih * 0.55);
  const baseSrcH = ih - railSrcH;
  const scale = 20 / baseSrcH;
  const railDstH = Math.max(10, Math.round(railSrcH * scale));
  const srcX = 1, srcW = Math.max(1, iw - 2);

  for(const p of platforms){
    if(p.y >= VH - TILE) continue;
    const sx = p.x - cameraX;
    if(sx + p.w < 0 || sx > VW) continue;
    const y = (p.y - railDstH)|0;
    ctx.drawImage(img, srcX, 0, srcW, railSrcH, sx|0, y, p.w, railDstH);
  }
}

function drawTerminals(){
  for(const t of terminals){
    const x = (t.x - cameraX)|0;
    if(x + t.w < 0 || x > VW) continue;

    const hasAnimFrames = terminalFrame1 && terminalFrame1.complete && terminalFrame2 && terminalFrame2.complete;
    let currentTerminalImg = null;
    if(hasAnimFrames){
      const animSpeed = 300;
      const frameIndex = Math.floor(simulationTime / animSpeed) % 2;
      currentTerminalImg = frameIndex === 0 ? terminalFrame1 : terminalFrame2;
    }

    if(currentTerminalImg && currentTerminalImg.complete && currentTerminalImg.naturalWidth){
      ctx.save();
      if(t.cooldown <= 0){ ctx.shadowColor = '#00ff9d'; ctx.shadowBlur = 4; }
      else { ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 2; }
      ctx.drawImage(currentTerminalImg, x - 2, t.y - 4, t.w + 4, t.h + 4);
      ctx.restore();
      if(t.cooldown > 0){
        ctx.fillStyle = 'rgba(255, 68, 68, 0.8)';
        ctx.fillRect(x, t.y - 2, Math.max(1, (t.w * (t.cooldown / 5000))), 2);
      }
    } else {
      ctx.fillStyle = t.cooldown > 0 ? '#6b4d9b' : '#9b6bff';
      ctx.fillRect(x, t.y, t.w, t.h);
      ctx.fillStyle = t.cooldown > 0 ? '#ccc' : '#fff';
      ctx.fillRect(x + 2, t.y + 3, t.w - 4, 3);
      ctx.fillStyle = '#00ff9d'; ctx.font = '6px monospace'; ctx.fillText('HACK', x + 1, t.y + t.h - 2);
      ctx.textAlign = 'left';
    }
  }
}

function drawCoins(){
  for(const c of coins){
    if(c.taken) continue;
    const x = (c.x - cameraX)|0, y = c.y|0;
    if(x < -16 || x > VW + 16) continue;
    if(coinImg && coinImg.complete && coinImg.naturalWidth){
      const coinSize = 20;
      ctx.save(); ctx.shadowColor = '#ffaa00'; ctx.shadowBlur = 8;
      ctx.drawImage(coinImg, x - coinSize/2, y - coinSize/2, coinSize, coinSize);
      ctx.restore();
    } else {
      ctx.fillStyle = '#ffd95e'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.fillText('₿', x, y + 2);
      ctx.textAlign = 'left';
    }
  }
}

// Gang members share the player's 48px frame layout; robots use their own.
const spriteOffset = (kind) => kind === 'gang' ? {x: 15, y: 20} : {x: 14, y: 24};

function drawEntities(now){
  for(const c of corpses){
    const x = (c.x - cameraX)|0, y = c.y|0, o = spriteOffset(c.kind);
    const img = SPR[c.pack]?.anim?.dead?.img;
    if(!img || x + 48 < 0 || x > VW) continue;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, (c.until - simulationTime) / 500));
    if(c.flip){ ctx.translate(x - o.x + 48, y - o.y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, 48, 48, 0, 0, 48, 48); }
    else ctx.drawImage(img, 0, 0, 48, 48, x - o.x, y - o.y, 48, 48);
    ctx.restore();
  }
  for(const r of robots){
    const x = (r.x - cameraX)|0, y = r.y|0;
    if(x + 48 < 0 || x > VW) continue;
    const o = spriteOffset(r.kind), flip = player.x < r.x;
    drawAnim(r, r.pack || 'robot', x - o.x, y - o.y, flip, now < r.hitUntil ? 0.75 : 1);
    if(r.windupUntil){
      // Laser sight while the robot aims: the cue to jump.
      const mx = x - 14 + (flip ? 48 - ROBOT_MUZZLE.x : ROBOT_MUZZLE.x), my = y - 24 + ROBOT_MUZZLE.y;
      const pulse = 0.45 + 0.35 * Math.sin(simulationTime / 40);
      ctx.save();
      ctx.globalAlpha = pulse; ctx.fillStyle = '#ff3a4f';
      ctx.fillRect(flip ? mx - 70 : mx, my, 70, 1);
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffd0d6'; ctx.fillRect(mx - 1, my - 1, 2, 2);
      ctx.restore();
    }
  }
  for(const shot of enemyShots){
    const sx = (shot.x - cameraX)|0, sy = shot.y|0;
    if(sx < -8 || sx > VW + 8) continue;
    ctx.save();
    ctx.shadowColor = '#ff4a5c'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff4a5c'; ctx.fillRect(shot.vx > 0 ? sx - 8 : sx + 2, sy, 6, 1);
    ctx.fillStyle = '#ffe0e4'; ctx.fillRect(sx - 2, sy - 1, 4, 3);
    ctx.restore();
  }
  for(const d of drones){
    const x = (d.x - cameraX)|0, y = d.y|0;
    if(x + 32 < 0 || x > VW) continue;
    
    // Ensure animation is properly set up
    if(!d.anim.runner && SPR && SPR.drone) {
      setAnim(d, 'drone', 'move');
    }
    
    if(d.anim.runner) {

      drawAnim(d, 'drone', x - 7, y - 9, false, d.disabled ? 0.7 : 1);
    } else {
      // Fallback visual if no animation
      ctx.fillStyle = d.disabled ? '#666' : '#8a99ff';
      ctx.fillRect(x, y, 18, 14);
    }
  }
  for(const f of females){
    const x = (f.x - cameraX)|0, y = f.y|0;
    if(x + 48 < 0 || x > VW) continue;
    
    // Ensure animation is properly set
    if(!f.anim.runner && SPR && SPR.female) {
      setAnim(f, 'female', 'idle');
    }
    
    const flip = (player.x < f.x);
    
    if(f.anim.runner) {
      drawAnim(f, 'female', x - 15, y - 20, flip, 1);
    } else {
      // Fallback visual if no animation
      ctx.fillStyle = '#ff69b4';
      ctx.fillRect(x, y, 18, 28);
      ctx.fillStyle = '#fff';
      ctx.fillText('F', x + 6, y + 10);
    }
  }
  const px = (player.x - cameraX)|0, py = player.y|0;
  drawAnim(player, 'player', px - 15, py - 20, player.facing === -1, simulationTime < player.hitUntil ? 0.8 : 1);
  if(gunPickup){
    const gx=(gunPickup.x-cameraX)|0,gy=gunPickup.y|0;
    ctx.fillStyle='#0b2434';ctx.fillRect(gx-3,gy-3,gunPickup.w+6,gunPickup.h+6);
    ctx.strokeStyle='#60e8da';ctx.strokeRect(gx-3,gy-3,gunPickup.w+6,gunPickup.h+6);
    if(sidearmImg)ctx.drawImage(sidearmImg,gx,gy,16,12);
  }
  for(const s of projectiles){
    const sx=s.x-cameraX;
    if(sx<0||sx>VW)continue;
    ctx.fillStyle='#b2fff2';ctx.fillRect(sx-2,s.y-1,5,2);
  }
  for(const i of impacts){
    const ix=i.x-cameraX;
    if(ix>=0&&ix<=VW&&impactImg)ctx.drawImage(impactImg,ix-4,i.y-4,8,8);
  }
}

function drawExitDoor(){
  if(!exitDoor) return;
  const x = (exitDoor.x - cameraX)|0, y = exitDoor.y|0;
  if(x > VW || x + exitDoor.w < 0) return;
  if(doorImg && doorImg.complete && doorImg.naturalWidth){
    ctx.save(); ctx.shadowColor = '#ff1493'; ctx.shadowBlur = 6;
    ctx.drawImage(doorImg, x, y, exitDoor.w, exitDoor.h);
    ctx.restore();
  } else {
    ctx.fillStyle = '#2a3040'; ctx.fillRect(x, y, exitDoor.w, exitDoor.h);
    ctx.fillStyle = '#6fc2ff'; ctx.fillRect(x + exitDoor.w - 6, y + exitDoor.h/2 - 3, 4, 6);
    ctx.fillStyle = '#8fb3ff'; ctx.fillRect(x + 2, y + 4, exitDoor.w - 4, 3);
    ctx.fillStyle = '#a0c4ff'; ctx.fillRect(x + 2, y + 8, exitDoor.w - 4, 2);
    ctx.fillStyle = '#7dff9a'; ctx.fillText('SHOP', x + 3, y + exitDoor.h - 8); ctx.fillText('DOOR', x + 3, y + exitDoor.h - 2);
    ctx.strokeStyle = '#6fc2ff'; ctx.lineWidth = 1; ctx.strokeRect(x, y, exitDoor.w, exitDoor.h);
  }
}

function drawDronesAndCones(now){
  if(LVL < 2) return;
  for(const d of drones){
    const x = (d.x - cameraX)|0, y = d.y|0;
    if(x + 32 < 0 || x > VW) continue;
    if(!d.active || d.disabled) continue;
    const coneH = 120, baseW = 70;
    const topX = x + 8, topY = y + 10, by = Math.min(VH - 10, topY + coneH);
    ctx.save();
    const grad = ctx.createLinearGradient(topX, topY, topX, by);
    grad.addColorStop(0, 'rgba(111,194,255,0.30)');
    grad.addColorStop(1, 'rgba(111,194,255,0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(topX + baseW/2, by);
    ctx.lineTo(topX - baseW/2, by);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawControlsHint(){
  const title = 'Blackout Protocol';
  ctx.font = '9px monospace'; ctx.textAlign = 'left';
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = '#cfd6df'; ctx.fillText(title, 6, 4);

  const pad = 6;
  const avail = VW - (titleW + pad * 2 + 2);

  const candidates = [
    {text: '← → Move | Space | Enter | E(EMP) | ESC', size: 7},
    {text: '← → | Space | Enter | E | ESC', size: 7},
    {text: '←→|␣|⏎|E|ESC', size: 7},
    {text: '←→ ␣ ⏎ E ESC', size: 6},
  ];

  let choice = candidates[0];
  for(const c of candidates){
    ctx.font = `${c.size}px monospace`;
    if(ctx.measureText(c.text).width <= avail){ choice = c; break; }
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9aa3b2';
  ctx.font = `${choice.size}px monospace`;
  ctx.fillText(choice.text, VW - 4, 4);

  ctx.textAlign = 'left';
  ctx.font = '9px monospace';
}

// Render at display resolution: small lettering must not pass through the
// 256x240 pixel-art buffer. Screen blending emits light without dark panels.
function adPlacement(a,img){
 if(a.layout)return a.layout;
 const ratio=Math.min(90/img.naturalWidth,112/img.naturalHeight);
 const rail=ledgeImg&&ledgeImg.naturalHeight?Math.max(10,Math.round(Math.floor(ledgeImg.naturalHeight*.55)*20/(ledgeImg.naturalHeight-Math.floor(ledgeImg.naturalHeight*.55)))):0;
 const obstacles=platforms.map(p=>({x:p.x-4,y:p.y-rail-5,w:p.w+8,h:rail+25})).concat(terminals.map(t=>({x:t.x-6,y:t.y-8,w:t.w+12,h:t.h+16})),coins.map(c=>({x:c.x-14,y:c.y-14,w:28,h:28})),exitDoor?[{x:exitDoor.x-4,y:exitDoor.y-4,w:exitDoor.w+8,h:exitDoor.h+8}]:[]);
 const hit=(r,o)=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y;
 for(const factor of [1,.9,.8,.7,.6,.5,.4]){
  const w=img.naturalWidth*ratio*factor,h=img.naturalHeight*ratio*factor;
  for(const offset of [0,-24,24,-48,48,-72,72]){
   const x=clamp(a.x-w/2+offset,4,LEVEL_LEN-w-4);
   for(let y=43;y+h<groundY()-8;y+=4){const r={x,y,w,h};if(!obstacles.some(o=>hit(r,o)))return a.layout=r;}
  }
 }
 const bottom=Math.min(groundY()-8,...obstacles.map(o=>o.y));
 const scale=Math.min(ratio,Math.max(1,bottom-47)/img.naturalHeight);
 return a.layout={x:clamp(a.x-img.naturalWidth*scale/2,4,LEVEL_LEN-img.naturalWidth*scale-4),y:43,w:img.naturalWidth*scale,h:img.naturalHeight*scale};
}
function drawAds(target=ctx){
  for(const a of ads){
    if(a.x-cameraX < -180 || a.x-cameraX > VW+180)continue;
    const img=CurrentAds.imgObjs[a.kind==='drink'?'drinkA':a.kind];
    if(!img || !img.complete || !img.naturalWidth) continue;
    const {x:worldX,y,w,h}=adPlacement(a,img);
    const x=worldX-cameraX;
    if(x+w+4<0 || x-4>VW) continue;
    target.save();
    target.globalCompositeOperation='screen';
    target.imageSmoothingEnabled=true;target.imageSmoothingQuality='high';
    // A restrained halo, followed by a sharp, full-opacity lettering pass.
    target.globalAlpha=.22;
    target.filter='brightness(1.8) blur(2px)';
    target.drawImage(img,x,y,w,h);
    target.globalAlpha=1;
    target.filter='brightness(1.55) saturate(1.15)';
    target.drawImage(img,x,y,w,h);
    target.restore();
  }
}
function drawDisplayAds(){
  const target=C.getContext('2d');
  const s=Math.min(VW_CANVAS/VW,VH_CANVAS/VH);
  const sw=(VW*s)|0,sh=(VH*s)|0;
  target.save();
  target.translate(((VW_CANVAS-sw)/2)|0,((VH_CANVAS-sh)/2)|0);
  target.scale(sw/VW,sh/VH);
  target.beginPath();target.rect(0,0,VW,VH);target.clip();
  drawAds(target);
  target.restore();
}

function drawUI(now){
  ctx.fillStyle='rgba(5,12,25,.92)';ctx.fillRect(0,0,VW,39);
  ctx.font='8px monospace';ctx.fillStyle='#61e8dc';
  ctx.fillText(`${String(LVL).padStart(2,'0')} / ${LEVELS[LVL]?.name||'SECTOR'}`,6,5);
  ctx.fillStyle='#edf5ff';ctx.fillText('BTC '+btc+'   SCORE '+score,6,17);
  ctx.fillStyle='#24354b';ctx.fillRect(181,7,68,5);
  ctx.fillStyle=player.hp>30?'#61e8dc':'#ff779b';ctx.fillRect(181,7,68*player.hp/100,5);
  ctx.fillStyle='#c5d8ed';ctx.fillText('HP '+player.hp,205,18);
  ctx.fillStyle='#536a86';ctx.fillRect(6,31,243,2);
  ctx.fillStyle='#ed91d2';ctx.fillRect(6,31,243*clamp(player.dist/(LEVEL_LEN-40),0,1),2);
  ctx.fillStyle='rgba(5,12,25,.9)';ctx.fillRect(0,228,VW,12);
  ctx.fillStyle='#b9cde3';ctx.fillText('RELAYS '+relays.filter(r=>r.taken).length+'/3  '+(now<hackUntil?'SYSTEMS OFFLINE': 'ENTER: HACK')+(hasGun?'  F: FIRE':'  E: EMP'),5,230);
  if(now<noticeUntil){ctx.fillStyle='#ff9ac8';ctx.fillText(notice,6,44);}
  if(gameState!=='playing'){
    ctx.fillStyle='rgba(3,8,20,.8)';ctx.fillRect(0,65,VW,110);
    ctx.fillStyle='#80f3df';ctx.textAlign='center';ctx.font='12px monospace';
    ctx.fillText(gameState==='warning'?'SECURITY ALERT':gameState==='paused'?'SIGNAL PAUSED':gameState==='dead'?'SIGNAL LOST':'DISTRICT CLEARED',VW/2,91);
    ctx.font='8px monospace';
    if(gameState==='warning'){
      ctx.fillStyle='#ff9ac8';ctx.fillText('NEON BAZAAR ENCOUNTERS',VW/2,111);
      ctx.fillStyle='#dce8f7';ctx.fillText('An encounter may cost BTC.',VW/2,129);
      ctx.fillText('Keep moving to save it. ENTER.',VW/2,143);
    } else ctx.fillText(gameState==='paused'?'ESC TO RESUME':gameState==='dead'?'Returning to base':'Sector complete',VW/2,130);
    ctx.textAlign='left';
  }
}
function drawAtmosphere(now){
  ctx.save();ctx.strokeStyle='rgba(133,199,255,.16)';ctx.lineWidth=.5;
  for(let i=0;i<32;i++){const x=(i*79-cameraX*.3)%VW,y=(i*43+now*.035)%VH;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+9);ctx.stroke()}
  for(const r of relays){if(r.taken)continue;const x=r.x-cameraX,y=r.y+Math.sin(now/250)*2;
    ctx.shadowBlur=8;ctx.shadowColor='#65ffe0';ctx.strokeStyle='#65ffe0';ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+5,y);ctx.lineTo(x,y+7);ctx.lineTo(x-5,y);ctx.closePath();ctx.stroke();
  }ctx.restore();
}

function blit(clear=true){
  const canvas = C;
  const gctx = canvas.getContext('2d');
  gctx.imageSmoothingEnabled = false;
  if(clear) gctx.clearRect(0, 0, VW_CANVAS, VH_CANVAS);
  const s = Math.min(VW_CANVAS / VW, VH_CANVAS / VH);
  const sw = (VW * s)|0, sh = (VH * s)|0;
  const ox = ((VW_CANVAS - sw) / 2)|0, oy = ((VH_CANVAS - sh) / 2)|0;
  gctx.drawImage(off, 0, 0, VW, VH, ox, oy, sw, sh);
}

let lastTime = 0, accumulator=0, simulationTime=0;
addEventListener('blur',()=>{LEFT=RIGHT=UP=0;jumpHeld=false;if(gameState==='playing')gameState='paused';});
function loop(now){
  const dt = Math.min(100,now-lastTime); lastTime=now;
  if(gameState==='playing'){
    accumulator+=dt;
    while(accumulator>=1000/60){simulationTime+=1000/60;update(1000/60,simulationTime);accumulator-=1000/60;}
  }else{accumulator=0;}

  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  drawBackgrounds();
  blit();
  drawDisplayAds();
  // Composite pixel-art foreground over the high-resolution holograms.
  ctx.clearRect(0,0,VW,VH);
  drawGaps();
  drawTiles();
  drawGapWarnings();
  drawTerminals();
  drawDronesAndCones(now);
  drawCoins();
  drawExitDoor();
  drawEntities(now);
  drawRailsOnTop();
  drawAtmosphere(simulationTime);
  drawUI(simulationTime);

  blit(false);
  requestAnimationFrame(loop);
}

// ====== public entry point ======
export async function bootLevel(levelNumber, opts = {}){
  const canvas = document.getElementById('game');
  C = canvas;
  ctx = C.getContext('2d');
  VW_CANVAS = C.width;
  VH_CANVAS = C.height;

  off = document.createElement('canvas');
  off.width = VW;
  off.height = VH;
  octx = off.getContext('2d');
  ctx = octx;
  ctx.imageSmoothingEnabled = false;
  ctx.font = '9px monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle='#06101d';ctx.fillRect(0,0,VW,VH);
  ctx.fillStyle='#65ecdc';ctx.fillText('CONNECTING TO SECTOR...',58,112);
  blit();

  LVL = levelNumber | 0;
  NEXT_HREF = opts.nextHref || './index.html';
  Account.authReady();
  if(LVL===1 && new URLSearchParams(location.search).has('new')) Account.startRankedRun();

  // Initialize game state from storage
  score = getRunN('playerScore', 0);
  scoreEvents=getRunO(`blackoutScoreEvents${LVL}`,{});
  btc = getRunN('playerBTC', 0);
  coinHistory=new Set(getRunO(`blackoutCoins${LVL}`,[]));
  relayHistory=new Set(getRunO(`blackoutRelays${LVL}`,[]));
  level = LVL;
  gameState = 'playing';

  // Load assets
  setBackgroundsForLevel(LVL);
  SPR = await loadSprites(SPRITE_DEF);
  await Promise.all([loadBackgrounds(), loadTiles(), loadAdImagesForLevel(LVL)]);
  SPR.playerArmed=makeArmedPlayerSprites();

  // Reset world state
  cameraX = 0; worldMaxX = 0; generatedUntil = 0;
  nextCoinId=0;
  platforms = []; robots = []; drones = []; females = []; terminals = []; ads = []; coins = [];
  projectiles=[];impacts=[];gunPickup=null;nextShot=0;notice='';noticeUntil=0;
  enemyShots=[];corpses=[];gangSpotted=false;
  hasGun=LVL>=5 && getRunN('blackoutGun',0)>0;
  exitDoor = null;

  // Create player
  player = makePlayer();
  lastCheckpointX=clamp(getRunN(`blackoutCheckpoint${LVL}`,32),32,1312);
  player.x=lastCheckpointX;
  setAnim(player, 'player', 'idle');

  // Generate initial chunks
  for(let x = 0; x < CHUNK * 4; x += CHUNK) genChunk(x);
  placeExitDoor();
  relays=[480,960,1400].map((x,id)=>({x,y:groundY()-32,taken:relayHistory.has(id),id}));
  if(LVL===5 && !hasGun) gunPickup={x:150,y:groundY()-16,w:16,h:12};
  if(LVL===6 && !hasGun) gunPickup={x:150,y:groundY()-16,w:16,h:12};

  // Level-specific setup - MOVED AFTER sprite loading
  if(LVL===3 && !sessionStorage.getItem('blackoutLevel3Warned')){
    gameState='warning';sessionStorage.setItem('blackoutLevel3Warned','1');
  }

  // Reset input state
  LEFT = RIGHT = UP = 0;
  jumpBufferUntil = 0; coyoteUntil = 0; jumpHeld = false;

  // Start game loop
  lastTime=performance.now();simulationTime=0;accumulator=0;
  requestAnimationFrame(loop);
}
