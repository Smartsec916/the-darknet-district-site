
// engine.js  (shared engine for Levels 1–3)
const VW = 256, VH = 240, TILE = 16;
const LEVEL_LEN = 1600;
const DOOR_W = 24, DOOR_H = 32;
const HYPER_RELOAD_TAG = 'rev=' + Date.now();

// ====== storage helpers (session for run; local for leaderboard) ======
export function getRunN(k,d=0){ return +(sessionStorage.getItem(k) ?? d) }
export function setRunN(k,v){ sessionStorage.setItem(k, String(v)) }
export function getRunO(k,d={}){ try{return JSON.parse(sessionStorage.getItem(k)||'null')??d}catch(e){return d} }
export function setRunO(k,o){ sessionStorage.setItem(k, JSON.stringify(o)) }
export function hardResetRun(){
  sessionStorage.clear();
  setRunN('playerBTC',0);
  setRunN('playerScore',0);
  setRunN('playerHealth',100);
  setRunO('playerUpgrades',{});
  setRunN('gameLevel',1);
}
export function goTo(href){ window.location.assign(href) }

function getLeaderboard(){ try{return JSON.parse(localStorage.getItem('leaderboard')||'[]')}catch(e){return[]} }
function setLeaderboard(list){ localStorage.setItem('leaderboard', JSON.stringify(list)) }
function postScore(score=0){
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
    idle:'assets/player_idle_48.png', walk:'assets/player_walk_48.png', run:'assets/player_run_48.png',
    jump:'assets/player_jump_48.png', fall:'assets/player_fall_48.png', hurt:'assets/player_hurt_48.png', dead:'assets/player_dead_48.png'
  }, fps:{idle:6, walk:10, run:12, jump:10, fall:10, hurt:6, dead:8}},
  robot:{fw:48,fh:48, states:{
    idle:'assets/robot_idle_48.png', walk:'assets/robot_walk_48.png', run:'assets/robot_run_48.png',
    attack:'assets/robot_attack_48.png', hurt:'assets/robot_hurt_48.png', dead:'assets/robot_dead_48.png'
  }, fps:{idle:6, walk:9, run:10, attack:12, hurt:6, dead:8}},
  drone:{fw:32,fh:32, states:{
    idle:'assets/drone_idle_32.png', hover:'assets/drone_hover_32.png', move:'assets/drone_move_32.png',
    attack:'assets/drone_attack_32.png', hurt:'assets/drone_hurt_32.png', dead:'assets/drone_dead_32.png'
  }, fps:{idle:3, hover:10, move:10, attack:12, hurt:6, dead:8}},
  female:{fw:48,fh:48, states:{
    idle:'assets/female_idle.png', run:'assets/female_run.png'
  }, fps:{idle:6, run:10}},
  bg_far:null, bg_near:null, coin:null, door:null, ledge:null, platform:null
};

function bgURLsForLevel(lvl){
  if(lvl===2) return {far:`assets/02_bg_far.png?${HYPER_RELOAD_TAG}`, near:`assets/02_bg_near.png?${HYPER_RELOAD_TAG}`};
  if(lvl===3) return {far:`assets/03_bg_far.png?${HYPER_RELOAD_TAG}`, near:`assets/03_bg_near.png?${HYPER_RELOAD_TAG}`};
  return {far:`assets/01_bg_far.png?${HYPER_RELOAD_TAG}`, near:`assets/01_bg_near.png?${HYPER_RELOAD_TAG}`};
}

function adConfigForLevel(lvl){
  if(lvl===2){
    return {
      kinds:['blackrock','downthere','oxygen','skinshift','zen'],
      images:{
        blackrock:`assets/Blackrock.png?${HYPER_RELOAD_TAG}`,
        downthere:`assets/Downthere.png?${HYPER_RELOAD_TAG}`,
        oxygen:`assets/Oxygen.png?${HYPER_RELOAD_TAG}`,
        skinshift:`assets/Skinshift.png?${HYPER_RELOAD_TAG}`,
        zen:`assets/Zen.png?${HYPER_RELOAD_TAG}`,
      }
    };
  }
  if(lvl===3){
    return {
      kinds:['bug','pill','plug','touchless','pinknoise'],
      images:{
        bug:`assets/Bug.png?${HYPER_RELOAD_TAG}`,
        pill:`assets/Pill.png?${HYPER_RELOAD_TAG}`,
        plug:`assets/Plug.png?${HYPER_RELOAD_TAG}`,
        touchless:`assets/Touchless.png?${HYPER_RELOAD_TAG}`,
        pinknoise:`assets/Pinknoise.png?${HYPER_RELOAD_TAG}`,
      }
    };
  }
  return {
    kinds:['fourk','meat','holo','rent','drink'],
    images:{
      fourk:`assets/4K.png?${HYPER_RELOAD_TAG}`,
      meat:`assets/Meat.png?${HYPER_RELOAD_TAG}`,
      holo:`assets/HoloCompanion.png?${HYPER_RELOAD_TAG}`,
      rent:`assets/Rent.png?${HYPER_RELOAD_TAG}`,
      drinkA:`assets/Drink_Oil_01.png?${HYPER_RELOAD_TAG}`,
      drinkB:`assets/Drink_Oil_02.png?${HYPER_RELOAD_TAG}`,
    }
  };
}

// ====== core state objects ======
let C, ctx, off, octx, VW_CANVAS, VH_CANVAS;
let gameState = 'playing', score = 0, btc = 0, level = 1;
let LEFT=0, RIGHT=0, UP=0, jumpBufferUntil=0, coyoteUntil=0, jumpHeld=false;
let player, cameraX=0, platforms=[], coins=[], robots=[], drones=[], females=[], terminals=[], ads=[], exitDoor=null;
let BG={far:null, near:null}, CurrentAds={kinds:[], images:{}, imgObjs:{}}, adDeck=[];
let SPR=null, LVL=1, NEXT_HREF='./index.html';
let coinImg=null, doorImg=null, ledgeImg=null, platformImg=null, terminalFrame1=null, terminalFrame2=null;
let generatedUntil=0, worldMaxX=0;
let hackUntil=0, hackCDUntil=0;

const CHUNK = 320;
const JUMP_BUFFER = 140, COYOTE = 140;
const groundY = () => VH - TILE;

// ====== helpers ======
function clamp(v,a,b){ return v<a?a:v>b?b:v }
function aabb(a,b){ return (a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y) }

// ====== input ======
addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyE','Enter','Escape','KeyR'].includes(e.code)) e.preventDefault();
  
  if(e.code==='ArrowLeft'||e.code==='KeyA') LEFT=1;
  if(e.code==='ArrowRight'||e.code==='KeyD') RIGHT=1;
  if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') { UP=1; jumpBufferUntil=performance.now()+JUMP_BUFFER; jumpHeld=true; }
  if(e.code==='Escape') gameState=(gameState==='playing')?'paused':(gameState==='paused'?'playing':gameState);
  if(e.code==='Enter') tryHack();
  if(e.code==='KeyE') triggerEMP();
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
async function loadSprites(def){
  const out={};
  for(const who of ['player','robot','drone','female']){
    const fw=def[who].fw, fh=def[who].fh;
    const pack={fw,fh,anim:{}};
    for(const [state,src] of Object.entries(def[who].states)){
      const img=await IMG(src + '?' + HYPER_RELOAD_TAG);
      pack.anim[state]={img, make:()=>makeAnimator(img,fw,fh, def[who].fps[state]||8)};
    }
    out[who]=pack;
  }
  return out;
}

function setAnim(actor, who, state, clamp=false){
  if(actor.anim.state===state) return;
  actor.anim.state=state;
  const spec=SPR[who]?.anim?.[state];
  actor.anim.runner = spec ? spec.make() : null;
  if(actor.anim.runner) actor.anim.runner.reset();
  actor.anim.clamp=clamp;
}

function stepAnim(a,dt){ if(a.anim.runner) a.anim.runner.step(dt, a.anim.clamp); }
function drawAnim(a,who,x,y,flip=false,alpha=1){ const run=a.anim.runner; if(run) run.draw(x,y,flip,alpha); }

// ====== parallax backgrounds ======
const PARALLAX = {far: 0.18, near: 0.55};

function setBackgroundsForLevel(lvl){
  const urls = bgURLsForLevel(lvl);
  SPRITE_DEF.bg_far = urls.far;
  SPRITE_DEF.bg_near = urls.near;
  SPRITE_DEF.coin = `assets/btc_glow.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.door = `assets/shop_door_neon.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.ledge = `assets/ledge_tile.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.platform = `assets/platform_industrial.png?${HYPER_RELOAD_TAG}`;
}

async function loadBackgrounds(){
  BG.far = await IMG(SPRITE_DEF.bg_far);
  BG.near = await IMG(SPRITE_DEF.bg_near);
}

function tileParallax(img, speed){
  if(!img) return;
  const scale = VH / img.height;
  const tileW = Math.max(1, Math.round(img.width * scale));
  const cam = cameraX || 0;
  let x = -Math.floor((cam * speed) % tileW);
  if (x > 0) x -= tileW;
  for(let i = 0; i < 4; i++){
    const drawX = x + i * tileW;
    const flip = (i % 2) === 1;
    ctx.save();
    if(flip){
      ctx.translate(drawX + tileW, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, tileW, VH);
    } else {
      ctx.drawImage(img, 0, 0, img.width, img.height, drawX, 0, tileW, VH);
    }
    ctx.restore();
  }
}

function drawBackgrounds(){
  if(!BG.far && !BG.near){ drawSky(); return; }
  if(BG.far) tileParallax(BG.far, PARALLAX.far);
  if(BG.near){
    ctx.save();
    tileParallax(BG.near, PARALLAX.near);
    const fadeH = Math.min(120, VH);
    const g = ctx.createLinearGradient(0, 0, 0, fadeH);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    ctx.restore();
  }
}

function drawSky(){
  for(let y = 0; y < VH; y++){
    const t = y / VH;
    ctx.fillStyle = `rgb(${12+18*t|0},${16+30*t|0},${30+58*t|0})`;
    ctx.fillRect(0, y, VW, 1);
  }
}

// ====== ads ======
async function loadAdImagesForLevel(lvl){
  CurrentAds = adConfigForLevel(lvl);
  CurrentAds.imgObjs = {};
  const keys = Object.keys(CurrentAds.images || {});
  for(const k of keys){
    CurrentAds.imgObjs[k] = await IMG(CurrentAds.images[k]);
  }
  refillDeck();
}

function refillDeck(){ adDeck = [...CurrentAds.kinds].sort(() => Math.random() - 0.5); }
function nextAdKind(){ if(!adDeck.length) refillDeck(); return adDeck.shift(); }

// ====== world generation ======
function pushGroundRow(startX, endX){
  for(let x = startX; x < endX; x += TILE) platforms.push({x, y: groundY(), w: TILE, h: TILE});
}

function genChunk(startX){
  const endX = startX + CHUNK;
  const firstScreen = startX < VW;
  const lvl = LVL;

  pushGroundRow(startX, endX);

  if(lvl === 3){
    if(!firstScreen){
      for(let i = 0; i < 2; i++){
        const cx = startX + 30 + Math.random() * (CHUNK - 60);
        coins.push({x: cx|0, y: (groundY() - 24)|0, r: 10, taken: false});
      }
      const ax = startX + 60 + Math.random() * (CHUNK - 120);
      const ay = VH - (120 + ((Math.random() * 50)|0));
      ads.push({x: ax|0, y: ay|0, kind: nextAdKind(), phase: Math.random() * 6});
    }
    generatedUntil = endX;
    worldMaxX = Math.max(worldMaxX, endX);
    return;
  }

  const ledgesStartOffset = (lvl === 1) ? 760 : 0;
  const allowLedges = (!firstScreen) && (startX >= ledgesStartOffset);

  if(allowLedges){
    const LOW_LEDGE_OFFSET = TILE * 3;
    const HIGH_LEDGE_OFFSET = TILE * 5;

    const baseX = startX + 50 + Math.random() * (CHUNK - 140);
    const lowX = Math.max(startX + 24, Math.min(endX - 110, (baseX / TILE | 0) * TILE));
    const highX = Math.min(endX - 60, lowX + TILE * (5 + ((Math.random() * 2)|0)));

    const lowW = TILE * (5 + ((Math.random() * 2)|0));
    const highW = TILE * (4 + ((Math.random() * 2)|0));

    const lowY = groundY() - LOW_LEDGE_OFFSET;
    const highY = groundY() - HIGH_LEDGE_OFFSET;

    platforms.push({x: lowX, y: lowY, w: lowW, h: TILE});
    platforms.push({x: highX, y: highY, w: highW, h: TILE});

    const above = [
      {x: lowX + 8 + Math.random() * (Math.max(16, lowW - 16)), y: lowY - 20},
      {x: highX + 8 + Math.random() * (Math.max(16, highW - 16)), y: highY - 20},
      {x: (lowX + highX) / 2, y: Math.min(lowY, highY) - 26}
    ];
    for(const p of above){
      coins.push({x: p.x|0, y: Math.max(40, Math.min(VH - 24, p.y))|0, r: 10, taken: false});
    }

    if(Math.random() < 0.5){
      const tx = startX + 40 + Math.random() * (CHUNK - 80);
      let ty = VH - TILE * 2;
      for(const p of platforms){
        if(tx >= p.x - 4 && tx <= p.x + p.w + 4) ty = Math.min(ty, p.y - TILE);
      }
      terminals.push({x: tx|0, y: ty|0, w: 12, h: 16, cooldown: 0});
    }

    const ax = startX + 60 + Math.random() * (CHUNK - 120);
    const ay = VH - (120 + ((Math.random() * 50)|0));
    ads.push({x: ax|0, y: ay|0, kind: nextAdKind(), phase: Math.random() * 6});
  }

  if(lvl >= 1){
    const rc = 1 + ((Math.random() * 2)|0);
    for(let i = 0; i < rc; i++){
      const rx = startX + 64 + Math.random() * (CHUNK - 128);
      robots.push({
        x: rx|0, y: VH - TILE * 2, w: 18, h: 24, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.66, hp: 3,
        active: false, hitUntil: 0, state: 'patrol', alert: false, patrolL: rx - 40, patrolR: rx + 40,
        searchUntil: 0, lookTimer: 0, anim: {state: 'idle', runner: null}
      });
    }
  }

  if(lvl >= 2){
    if(Math.random() < 0.6){
      const dx = startX + 80 + Math.random() * (CHUNK - 160);
      const dy = 60 + Math.random() * 80;
      drones.push({
        x: dx|0, y: dy|0, w: 18, h: 14, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.8,
        phase: Math.random() * 6, active: false, disabled: false, anim: {state: 'move', runner: null}
      });
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

  body.y += body.vy;
  for(const p of platforms){
    if(rects(body, p)){
      if(body.vy > 0){ body.y = p.y - body.h; body.vy = 0; body.onGround = true; coyoteUntil = 0; }
      else if(body.vy < 0){ body.y = p.y + p.h; body.vy = 0; }
    }
  }

  body.x += body.vx;
  for(const p of platforms){
    if(rects(body, p)){
      if(body.vx > 0){
        body.y -= 2;
        if(!rects(body, p)){ body.onGround = false; break; }
        body.y += 2;
      } else if(body.vx < 0){
        body.y -= 2;
        if(!rects(body, p)){ body.onGround = false; break; }
        body.y += 2;
      }
      if(body.vx > 0) body.x = p.x - body.w;
      else if(body.vx < 0) body.x = p.x + p.w;
      body.vx = 0;
    }
  }
}

// ====== hack / emp ======
function tryHack(){
  const now = performance.now();
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
    score += 20;
  }
}

function triggerEMP(){
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
      btc += 1; score += 5;
    }
  }
}

// ====== damage / death ======
function applyDamage(dmg){
  if(LVL === 1) dmg = Math.min(dmg, 20);
  player.hp = Math.max(0, player.hp - Math.max(0, dmg|0));
  if(player.hp <= 0){
    postScore(score);
    setTimeout(() => goTo('./index.html'), 800);
    return;
  }
  setRunN('playerHealth', player.hp);
}

// ====== level management ======
function placeExitDoor(){
  const x = LEVEL_LEN - 40, y = groundY() - DOOR_H;
  exitDoor = {x, y, w: DOOR_W, h: DOOR_H};
}

function spawnLevel3Females(){
  females = [];
  const n = 3 + ((Math.random() * 3)|0);
  for(let i = 0; i < n; i++){
    const x = 180 + i * 180 + Math.random() * 60;
    females.push({
      x: x|0, y: VH - TILE * 2, w: 18, h: 28, speed: 0.5 + Math.random() * 0.3,
      hasTaken: false, anim: {state: 'idle', runner: null}
    });
  }
}

function activateEnemies(){
  const visRight = cameraX + VW + 64;
  for(const r of robots){
    if(!r.active && r.x < visRight){
      if(LVL === 1){ if(player.x >= 900){ r.active = true; } } 
      else { r.active = true; }
    }
  }
  for(const d of drones){
    if(!d.active && d.x < visRight){ if(LVL >= 2) d.active = true; }
  }
}

function playerLitByCone(){
  if(LVL < 2 || !drones.length) return false;
  const px = player.x + player.w/2, py = player.y + player.h/2;
  for(const d of drones){
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
  try {
    coinImg = await IMG(SPRITE_DEF.coin);
    doorImg = await IMG(SPRITE_DEF.door);
    ledgeImg = await IMG(SPRITE_DEF.ledge);
    platformImg = await IMG(SPRITE_DEF.platform);
    terminalFrame1 = await IMG(`assets/hacker_terminal_frame1.png?${HYPER_RELOAD_TAG}`);
    terminalFrame2 = await IMG(`assets/hacker_terminal_frame2.png?${HYPER_RELOAD_TAG}`);
  } catch (error) {
    console.error('Error loading tiles:', error);
  }
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
  pickupCoins();

  if(player.hp <= 0) setAnim(player, 'player', 'dead', true);
  else if(now < player.hitUntil) setAnim(player, 'player', 'hurt', true);
  else if(!player.onGround) setAnim(player, 'player', player.vy < 0 ? 'jump' : 'fall');
  else {
    const s = Math.abs(player.vx);
    setAnim(player, 'player', s > 1.05 ? 'run' : (s > 0.2 ? 'walk' : 'idle'));
  }
  stepAnim(player, dt);

  const need = cameraX + VW + CHUNK * 2;
  while(generatedUntil < need) genChunk(generatedUntil);

  activateEnemies();
  const hacked = now < hackUntil;

  // drones movement
  for(const d of drones){
    if(!d.active || d.disabled) continue;
    if(!hacked){
      d.x += d.dir * d.speed;
      d.phase = (d.phase || 0) + 0.02;
      d.y += Math.sin(d.phase) * 0.2;
      if((d.x % CHUNK) < 8 || (d.x % CHUNK) > CHUNK - 8) d.dir *= -1;
    }
  }

  // robots AI
  const lit = (LVL === 2) ? playerLitByCone() : false;

  for(const r of robots){
    if(!r.active) continue;
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
      if(LVL === 2 && lit){ r.y -= 0.9; }
      if(now > r.searchUntil) r.state = 'patrol';
    } else {
      r.alert = false;
      if(r.state !== 'patrol'){ r.state = 'patrol'; r.patrolL = r.x - 40; r.patrolR = r.x + 40; r.dir = Math.sign(dx) || 1; }
      r.x += r.dir * r.speed;
      if(r.x < r.patrolL){ r.x = r.patrolL; r.dir = 1; }
      if(r.x > r.patrolR){ r.x = r.patrolR; r.dir = -1; }
    }

    setAnim(r, 'robot', r.state === 'chase' ? 'run' : 'walk');
    stepAnim(r, dt);

    if(aabb(player, r)){
      if(player.vy > 0 && player.y + player.h <= r.y + 6){
        r.hp--; r.hitUntil = now + 120; player.vy = -2.6; score += 12;
      } else if(now > player.hitUntil){
        player.hitUntil = now + 800;
        player.vx += (player.x < r.x) ? -0.8 : 0.8;
        const damage = player.upgrades?.armor ? 5 : 7;
        applyDamage(damage);
      }
    }
  }

  for(let i = robots.length - 1; i >= 0; i--) if(robots[i].hp <= 0) robots.splice(i, 1);

  // Level 3 females
  if(LVL === 3){
    for(const f of females){
      if(f.hasTaken){ setAnim(f, 'female', 'idle'); stepAnim(f, dt); continue; }
      const dir = (player.x > f.x) ? 1 : -1;
      f.x += dir * f.speed;
      setAnim(f, 'female', 'run'); stepAnim(f, dt);
      if(aabb(player, f)){
        const take = Math.min(5, btc);
        if(take > 0){ btc -= take; }
        f.hasTaken = true;
        setAnim(f, 'female', 'idle');
      }
    }
  }

  if(exitDoor && aabb(player, exitDoor)){
    gameState = 'levelComplete';
    setTimeout(() => {
      setRunN('playerBTC', btc);
      setRunN('playerScore', score);
      setRunN('gameLevel', LVL);
      setRunO('playerUpgrades', player.upgrades);
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
      const frameIndex = Math.floor(performance.now() / animSpeed) % 2;
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

function drawEntities(now){
  for(const r of robots){
    const x = (r.x - cameraX)|0, y = r.y|0;
    if(x + 48 < 0 || x > VW) continue;
    drawAnim(r, 'robot', x - 14, y - 24, (player.x < r.x), now < r.hitUntil ? 0.75 : 1);
  }
  for(const d of drones){
    const x = (d.x - cameraX)|0, y = d.y|0;
    if(x + 32 < 0 || x > VW) continue;
    if(!d.anim.runner) setAnim(d, 'drone', 'move');
    stepAnim(d, 16); drawAnim(d, 'drone', x - 7, y - 9, false, d.disabled ? 0.7 : 1);
  }
  for(const f of females){
    const x = (f.x - cameraX)|0, y = f.y|0;
    if(x + 48 < 0 || x > VW) continue;
    const flip = (player.x < f.x);
    drawAnim(f, 'female', x - 15, y - 20, flip, 1);
  }
  const px = (player.x - cameraX)|0, py = player.y|0;
  drawAnim(player, 'player', px - 15, py - 20, player.facing === -1, performance.now() < player.hitUntil ? 0.8 : 1);
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

function drawAds(){
  for(const a of ads){
    const x = (a.x - cameraX)|0, y = a.y|0;
    if(x + 160 < 0 || x > VW) continue;
    
    // Update animation phase
    a.phase = (a.phase || 0) + 0.03;
    const flicker = 0.7 + 0.3 * Math.sin(a.phase * 3);
    const bob = Math.sin(a.phase) * 2;
    
    // Get correct image for this ad kind
    let img = null;
    if(a.kind === 'drink'){
      // Level 1 only: 2-frame blink animation
      const frame = (Math.floor(performance.now() / 350) % 2 === 0) ? 'drinkA' : 'drinkB';
      img = CurrentAds.imgObjs[frame];
    } else {
      img = CurrentAds.imgObjs[a.kind];
    }
    
    if(img && img.complete && img.naturalWidth > 0){
      ctx.save();
      ctx.globalAlpha = flicker;
      
      // Holographic glow effect
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 8;
      
      const targetW = 120, targetH = 80;
      ctx.drawImage(img, x, y + bob, targetW, targetH);
      ctx.restore();
    } else {
      // Fallback if image not loaded
      ctx.fillStyle = `hsl(${(a.phase * 30) % 360}, 70%, 60%)`;
      ctx.fillRect(x, y + bob, 120, 80);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(a.kind.toUpperCase(), x + 10, y + bob + 40);
    }
  }
}

function drawUI(now){
  ctx.fillStyle = 'rgba(0,0,0,.78)'; ctx.fillRect(0, 0, VW, 20);
  drawControlsHint();

  ctx.fillStyle = '#fff'; ctx.fillText(`HP:${Math.max(0, player.hp)}  L:${LVL}  SC:${score}  BTC:${btc}`, 6, 24);
  ctx.fillStyle = '#7dff9a'; ctx.fillText(`DIST:${player.dist|0}  DOOR@:${(LEVEL_LEN - 40)|0}`, 6, 36);

  const left = Math.max(0, hackUntil - now)|0;
  if(left > 0){ ctx.fillStyle = '#7dff9a'; ctx.fillText(`Hack ${Math.ceil(left/1000)}s`, 6, 48); }
  else if(now < hackCDUntil){ ctx.fillStyle = '#7f8a99'; ctx.fillText(`Hack CD ${((hackCDUntil - now)/1000|0)}s`, 6, 48); }
  else { ctx.fillStyle = '#7dff9a'; ctx.fillText('Enter: Hack', 6, 48); }

  const charges = (player.upgrades?.mobileEMPCharges | 0);
  if(player.upgrades?.mobileEMP === true && charges > 0){
    ctx.fillStyle = '#a0ffea'; ctx.fillText(`EMP Charges: ${charges} (E)`, VW - 120, 24);
  }

  if(gameState === 'paused'){
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#fff'; ctx.fillText('PAUSED (ESC)', VW/2 - 30, VH/2);
  }
  if(gameState === 'levelComplete'){
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#7dff9a'; ctx.fillText('LEVEL COMPLETE → SHOP', VW/2 - 60, VH/2 - 8);
  }
}

function blit(){
  const canvas = C;
  const gctx = canvas.getContext('2d');
  gctx.clearRect(0, 0, VW_CANVAS, VH_CANVAS);
  const s = Math.min(VW_CANVAS / VW, VH_CANVAS / VH);
  const sw = (VW * s)|0, sh = (VH * s)|0;
  const ox = ((VW_CANVAS - sw) / 2)|0, oy = ((VH_CANVAS - sh) / 2)|0;
  gctx.drawImage(off, 0, 0, VW, VH, ox, oy, sw, sh);
}

let lastTime = 0;
function loop(now){
  const dt = now - lastTime; lastTime = now;
  
  update(dt, now);

  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
  drawBackgrounds();
  drawTiles();
  drawTerminals();
  drawDronesAndCones(now);
  drawAds();
  drawCoins();
  drawExitDoor();
  drawEntities(now);
  drawRailsOnTop();
  drawUI(now);
  
  blit();
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

  LVL = levelNumber | 0;
  NEXT_HREF = opts.nextHref || './index.html';

  // Initialize game state from storage
  score = getRunN('playerScore', 0);
  btc = getRunN('playerBTC', 0);
  level = LVL;
  gameState = 'playing';

  // Load assets
  setBackgroundsForLevel(LVL);
  SPR = await loadSprites(SPRITE_DEF);
  await Promise.all([loadBackgrounds(), loadTiles(), loadAdImagesForLevel(LVL)]);

  // Reset world state
  cameraX = 0; worldMaxX = 0; generatedUntil = 0;
  platforms = []; robots = []; drones = []; females = []; terminals = []; ads = []; coins = [];
  exitDoor = null;

  // Create player
  player = makePlayer();
  setAnim(player, 'player', 'idle');

  // Generate initial chunks
  for(let x = 0; x < CHUNK * 4; x += CHUNK) genChunk(x);
  placeExitDoor();

  // Level-specific setup
  if(LVL === 2){
    drones.push({x: 120, y: 70, w: 18, h: 14, dir: 1, speed: 0.7, phase: Math.random() * 6, active: true, disabled: false, anim: {state: 'move', runner: null}});
    drones.push({x: 220, y: 85, w: 18, h: 14, dir: -1, speed: 0.7, phase: Math.random() * 6, active: true, disabled: false, anim: {state: 'move', runner: null}});
  }
  if(LVL === 3) spawnLevel3Females();

  // Reset input state
  LEFT = RIGHT = UP = 0;
  jumpBufferUntil = 0; coyoteUntil = 0; jumpHeld = false;

  // Start game loop
  requestAnimationFrame(loop);
}
