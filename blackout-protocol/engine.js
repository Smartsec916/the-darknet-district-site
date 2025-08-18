// engine.js  (shared engine for Levels 1–3)
const VW = 256, VH = 192, SCALE = 3;
let C, ctx, off, octx, VW_CANVAS = 960, VH_CANVAS = 720;
let LVL = 1, NEXT_HREF = './index.html';

const VW_PHYS = 256, VH_PHYS = 192;
const CHUNK = 160, TILE = 16;
const LEVEL_LEN = 1600;
const DOOR_W = 24, DOOR_H = 32;
const HYPER_RELOAD_TAG = 'rev=' + Date.now();

// ====== storage helpers (session for run-state; local only for leaderboard) ======
export function getRunN(k, d=0){ const n=parseInt(sessionStorage.getItem(k)||''); return Number.isFinite(n)?n:d; }
export function setRunN(k, v){ sessionStorage.setItem(k, String(v)); }
export function getRunO(k, d={}){ try{ return JSON.parse(sessionStorage.getItem(k)||'') || d }catch{ return d } }
export function setRunO(k, v){ sessionStorage.setItem(k, JSON.stringify(v)); }
export function hardResetRun(){
  try { sessionStorage.clear(); } catch {}
  sessionStorage.setItem('playerBTC','0');
  sessionStorage.setItem('playerScore','0');
  sessionStorage.setItem('playerHealth','100');
  sessionStorage.setItem('playerUpgrades','{}');
}
export function goTo(href){ location.href = href; }

// ====== image helper ======
function IMG(src){ return new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }) }

// ====== sprite/animation defs ======
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
    idle:'assets/female_idle.png', walk:'assets/female_walk.png', run:'assets/female_run.png'
  }, fps:{idle:6, walk:8, run:10}},
  bg_far:null, bg_near:null, coin:null, door:null, ledge:null,
  platform:null, rail:null, terminalA:null, terminalB:null, shop:null
};

let SPR = null;

function makeAnimator(img, fw, fh, fps){
  const cols = Math.max(1, (img.naturalWidth / fw)|0);
  const rows = Math.max(1, (img.naturalHeight / fh)|0);
  const frames = cols * rows;
  let f = 0, acc = 0, ix = 0, iy = 0;
  let flip = false, alpha = 1;
  return {
    step(dt, clamp=false){
      acc += dt / (1000/fps);
      const step = clamp ? Math.min(1, acc|0) : (acc|0);
      if(step > 0){ f = (f + step) % frames; acc = 0; }
      ix = (f % cols) * fw; iy = ((f / cols)|0) * fh;
    },
    draw(x, y, flipH=false, a=1){
      const saveA = ctx.globalAlpha; ctx.globalAlpha = a;
      if(flipH){
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, ix, iy, fw, fh, -x - fw, y, fw, fh);
        ctx.restore();
      } else ctx.drawImage(img, ix, iy, fw, fh, x, y, fw, fh);
      ctx.globalAlpha = saveA;
    }
  };
}

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
  if(actor.anim?.state===state && actor.anim.runner) return;
  const pack=SPR[who]; if(!pack) return;
  const a=pack.anim[state]; if(!a) return;
  actor.anim = actor.anim || {};
  actor.anim.state = state;
  actor.anim.runner = a.make();
  actor.anim.clamp=clamp;
}

function stepAnim(a,dt){ if(a.anim?.runner) a.anim.runner.step(dt, a.anim.clamp); }
function drawAnim(a,who,x,y,flip=false,alpha=1){ const run=a.anim?.runner; if(run) run.draw(x,y,flip,alpha); }

// ====== parallax backgrounds ======
const PARALLAX = {far: 0.18, near: 0.55};

function setBackgroundsForLevel(lvl){
  const urls = bgURLsForLevel(lvl);
  SPRITE_DEF.bg_far = urls.far;
  SPRITE_DEF.bg_near = urls.near;
  SPRITE_DEF.coin = `assets/btc_glow.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.door = `assets/door.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.ledge = `assets/ledge_32.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.platform = `assets/platform_64.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.rail = `assets/platform_rail_64.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.terminalA = `assets/terminal_A.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.terminalB = `assets/terminal_B.png?${HYPER_RELOAD_TAG}`;
  SPRITE_DEF.shop = `assets/shop_door.png?${HYPER_RELOAD_TAG}`;
}

function bgURLsForLevel(lvl){
  if(lvl===1) return {far: `assets/01_bg_far.png?${HYPER_RELOAD_TAG}`, near: `assets/01_bg_near.png?${HYPER_RELOAD_TAG}`};
  if(lvl===2) return {far: `assets/02_bg_far.png?${HYPER_RELOAD_TAG}`, near: `assets/02_bg_near.png?${HYPER_RELOAD_TAG}`};
  return {far: `assets/03_bg_far.png?${HYPER_RELOAD_TAG}`, near: `assets/03_bg_near.png?${HYPER_RELOAD_TAG}`};
}

let bgFarImg=null, bgNearImg=null, coinImg=null, doorImg=null, ledgeImg=null, platformImg=null, platformRailImg=null, terminalFrame1=null, terminalFrame2=null;

async function loadBackgrounds(){
  bgFarImg = await IMG(SPRITE_DEF.bg_far);
  bgNearImg = await IMG(SPRITE_DEF.bg_near);
}

async function loadTiles(){
  coinImg = await IMG(SPRITE_DEF.coin);
  doorImg = await IMG(SPRITE_DEF.door);
  ledgeImg = await IMG(SPRITE_DEF.ledge);
  platformImg = await IMG(SPRITE_DEF.platform);
  platformRailImg = await IMG(SPRITE_DEF.rail);
  terminalFrame1 = await IMG(SPRITE_DEF.terminalA);
  terminalFrame2 = await IMG(SPRITE_DEF.terminalB);
}

// ====== Ads ======
const AdSets = {
  1: ['Drink_Oil_01','Drink_Oil_02','4K','bitcoin_glow_cyberpunk','btc_glow'],
  2: ['Blackrock','Downthere','Oxygen','Skinshift','Zen'],
  3: ['Bug','Pill','Plug','Touchless','Pinknoise']
};

function nextAdKind(){
  const set = AdSets[LVL] || AdSets[1];
  return set[(Math.random()*set.length)|0];
}

const CurrentAds = {
  imgObjs: Object.create(null)
};

async function loadAdImagesForLevel(lvl){
  const kinds = (AdSets[lvl] || []);
  const toLoad = [];
  for(const kind of kinds){
    const key = kind;
    const url = `assets/${kind}.png?${HYPER_RELOAD_TAG}`;
    toLoad.push(IMG(url).then(img => { CurrentAds.imgObjs[key] = img; }));
  }
  // Level 1 blink pair
  if(lvl === 1){
    toLoad.push(IMG(`assets/Drink_Oil_01.png?${HYPER_RELOAD_TAG}`).then(img => { CurrentAds.imgObjs['drinkA'] = img; }));
    toLoad.push(IMG(`assets/Drink_Oil_02.png?${HYPER_RELOAD_TAG}`).then(img => { CurrentAds.imgObjs['drinkB'] = img; }));
  }
  await Promise.all(toLoad);
}

// ====== world state ======
let cameraX = 0, worldMaxX = 0, generatedUntil = 0;
let platforms=[], robots=[], drones=[], females=[], terminals=[], ads=[], coins=[];
let exitDoor=null;

function groundY(){ return VH - TILE; }

// ===== player =====
let player = null, score=0, btc=0;

function makePlayer(){
  return {
    x: 40, y: VH - TILE*2, w: 16, h: 24,
    vx: 0, vy: 0, facing: 1,
    speed: 1.3, aGround: 0.23, aAir: 0.12,
    dragG: 0.84, dragA: 0.92,
    jump: 3.35,
    hp: getRunN('playerHealth', 100),
    hitUntil: 0,
    upgrades: getRunO('playerUpgrades', {}),
    dist: 0,
    anim: {state:'idle', runner:null}
  };
}

let COYOTE = 120, coyoteUntil=0, jumpHeld=false, jumpBufferUntil=0, JUMP_BUF=160;
let hackUntil=0, hackCDUntil=0;

function pushGroundRow(fromX, toX){
  const y = groundY();
  for(let x = fromX; x < toX; x += TILE){ platforms.push({x, y, w:TILE, h:TILE}); }
}

// ====== chunk generation ======
function genChunk(startX){
  const endX = startX + CHUNK;
  const firstScreen = startX < VW;
  const lvl = LVL;

  pushGroundRow(startX, endX);

  // Level 3: More BTC coins and female NPCs
  if(lvl === 3){
    if(!firstScreen && startX >= 300){
      for(let i = 0; i < 5; i++){ // Even more coins in Level 3
        const cx = startX + 30 + Math.random() * (CHUNK - 60);
        coins.push({x: cx|0, y: (groundY() - 24)|0, r: 10, taken: false});
      }
      // ads - more frequent with guaranteed variety
      const variety = 1 + ((Math.random()*2)|0);
      for(let i=0;i<variety;i++){
        const ax = startX + 80 + Math.random() * (CHUNK - 160);
        const ay = VH - (100 + ((Math.random() * 60)|0));
        ads.push({x: ax|0, y: ay|0, kind: nextAdKind(), phase: Math.random() * 6});
      }

      // Female NPCs for Level 3 (spawn in every chunk after 300)
      const fc = 2 + ((Math.random() * 2)|0); // More females per chunk
      for(let i = 0; i < fc; i++){
        const fx = startX + 64 + Math.random() * (CHUNK - 128);
        const newFemale = {
          x: fx|0, y: VH - TILE * 2, w: 18, h: 28, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.6, hp: 1,
          active: false, hitUntil: 0, state: 'patrol', alert: false, patrolL: fx - 50, patrolR: fx + 50,
          searchUntil: 0, lookTimer: 0, hasTaken: false, anim: {state: 'idle', runner: null}
        };
        // Initialize animation immediately
        setAnim(newFemale, 'female', 'idle');
        females.push(newFemale);
      }
    }
    generatedUntil = endX;
    worldMaxX = Math.max(worldMaxX, endX);
    return;
  }

  // Ledges and other platforms
  const ledgesStartOffset = 300; // All levels: ledges and NPCs start at DIST 300
  const allowLedges = (!firstScreen) && (startX >= ledgesStartOffset);

  if(allowLedges){
    // two ledges: lower + higher
    const lowX = startX + 24 + Math.random() * 80;
    const lowW = 48 + ((Math.random() * 64)|0);
    const lowY = VH - TILE*3 - ((Math.random() * 12)|0);
    platforms.push({x: lowX|0, y: lowY|0, w: lowW|0, h: TILE|0});

    const highX = startX + CHUNK - (80 + Math.random() * 60);
    const highW = 48 + ((Math.random() * 60)|0);
    const highY = VH - TILE*4 - ((Math.random() * 18)|0);
    platforms.push({x: highX|0, y: highY|0, w: highW|0, h: TILE|0});

    // rails on the platforms
    platforms.push({x: lowX|0, y: (lowY - 3)|0, w: lowW|0, h: 3, rail:true});
    platforms.push({x: highX|0, y: (highY - 3)|0, w: highW|0, h: 3, rail:true});

    // coins around platforms
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

    // ads - better spacing, less frequent
    if(Math.random() < 0.7){ // 70% chance of ad per chunk
      const ax = startX + 80 + Math.random() * (CHUNK - 160); // More centered
      const ay = VH - (140 + ((Math.random() * 60)|0)); // Higher placement
      ads.push({x: ax|0, y: ay|0, kind: nextAdKind(), phase: Math.random() * 6});
    }
  }

  if(lvl >= 1 && startX >= 300){
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

  if(lvl >= 2 && startX >= 300){
    // Level 2: Robots in starting area fixed by only activating them later
    if(Math.random() < 0.6){
      const dx = startX + 80 + Math.random() * (CHUNK - 160);
      const dy = 60 + Math.random() * 80;
      drones.push({
        x: dx|0, y: dy|0, w: 18, h: 14, dir: Math.random() < 0.5 ? -1 : 1, speed: 0.8,
        phase: Math.random() * 6, active: false, disabled: false, anim:{state:'move', runner:null}
      });
    }
  }

  generatedUntil = endX;
  worldMaxX = Math.max(worldMaxX, endX);
}

// ====== exit door ======
function placeExit(){
  exitDoor = {x: LEVEL_LEN - 40, y: VH - TILE*3, w: DOOR_W, h: DOOR_H};
}

// ====== collisions/helpers ======
function rects(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

// ====== activation parity ======
function activateEnemies(){
  const visRight = cameraX + VW + 64;
  for(const r of robots){
    if(!r.active && r.x < visRight){
      // Robots activate after moving forward out of the starting area
      if(LVL === 1){ if(player.x >= 400){ r.active = true; } } 
      else if(LVL === 2){ if(player.x >= 400){ r.active = true; } }
      else { r.active = true; }
    }
  }
  for(const d of drones){
    if(!d.active && d.x < visRight){ if(LVL >= 2) d.active = true; }
  }
  for(const f of females){
    if(!f.active && f.x < visRight){ 
      if(LVL === 3) { 
        if(player.x >= 400){ 
          f.active = true; 
          if(!f.anim.runner) setAnim(f, 'female', 'idle');
        } 
      }
    }
  }
}

function playerLitByCone(){
  if(LVL < 2 || !drones.length) return false;
  const px = player.x|0, py = player.y|0;
  for(const d of drones){
    if(!d.active || d.disabled) continue;
    const dx = (px - d.x), dy = (py - d.y);
    if(dy < 0 || dy > 120) continue;
    const wAtY = 70 * (dy/120);
    if(Math.abs(dx - 8) <= wAtY/2) return true;
  }
  return false;
}

// ====== coins / terminals / pickups ======
function pickupCoins(){
  for(const c of coins){
    if(c.taken) continue;
    const dx = Math.abs(player.x - c.x), dy = Math.abs(player.y - c.y);
    if(dx < 14 && dy < 18){
      c.taken = true; btc += 1; setRunN('playerBTC', btc);
    }
  }
}

// ====== draw routines ======
function drawBackgrounds(){
  const farX = -((cameraX) * PARALLAX.far)|0;
  const nearX = -((cameraX) * PARALLAX.near)|0;
  if(bgFarImg)  ctx.drawImage(bgFarImg,  farX, 0);
  if(bgNearImg) ctx.drawImage(bgNearImg, nearX, 0);
}

function drawTiles(){
  // ground/platforms
  ctx.save();
  for(const p of platforms){
    if(p.rail) continue;
    const x = (p.x - cameraX)|0, y = p.y|0;
    if(x + p.w < 0 || x > VW) continue;
    ctx.drawImage(platformImg, x, y- (TILE-3), p.w, TILE);
  }
  // rails on top pass
  ctx.restore();
}

function drawRailsOnTop(){
  for(const p of platforms){
    if(!p.rail) continue;
    const x = (p.x - cameraX)|0, y = p.y|0;
    if(x + p.w < 0 || x > VW) continue;
    ctx.drawImage(platformRailImg, x, y, p.w, p.h);
  }
}

function drawTerminals(){
  const frame = (Math.floor(performance.now()/400)%2===0) ? terminalFrame1 : terminalFrame2;
  for(const t of terminals){
    const x = (t.x - cameraX)|0, y = (t.y - 12)|0;
    if(x + 16 < 0 || x > VW) continue;
    ctx.drawImage(frame, x-4, y-4, 20, 20);
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

function drawAds(){
  for(const a of ads){
    const x = (a.x - cameraX)|0, y = a.y|0;
    if(x + 80 < 0 || x > VW) continue;

    // Subtle animation phase
    a.phase = (a.phase || 0) + 0.005;
    const bob = Math.sin(a.phase) * 0.5;

    // Get correct image for this ad kind
    let img = null;
    if(a.kind === 'drink'){
      // Level 1 only: 2-frame blink animation
      const frame = (Math.floor(performance.now() / 500) % 2 === 0) ? 'drinkA' : 'drinkB';
      img = CurrentAds.imgObjs[frame];
    } else {
      img = CurrentAds.imgObjs[a.kind];
    }

    if(img && img.complete && img.naturalWidth > 0){
      // Calculate proper scaling - make ads larger and more readable
      const targetW = 56;
      const ratio = img.height ? (img.width / img.height) : 1;
      const w = targetW, h = Math.max(14, Math.round(targetW / ratio));
      const drawX = x - Math.round(w/2), drawY = y - Math.round(h/2) + bob;

      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = 'rgba(5,8,12,0.85)';
      ctx.fillRect(drawX - 3, drawY - 3, w + 6, h + 6);
      ctx.strokeStyle = 'rgba(0,255,157,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX - 3, drawY - 3, w + 6, h + 6);

      // Draw the ad image with full opacity for maximum readability
      ctx.globalAlpha = 1.0;
      ctx.drawImage(img, drawX, drawY, w, h);

      ctx.restore();
    }
  }
}

function drawCoins(){
  for(const c of coins){
    if(c.taken) continue;
    const x = (c.x - cameraX)|0, y = c.y|0;
    if(x + 16 < 0 || x > VW) continue;
    ctx.drawImage(coinImg, x-6, y-6, 12, 12);
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
    ctx.fillStyle = '#d16'; ctx.fillRect(x, y, exitDoor.w, exitDoor.h);
  }
}

// ====== input ======
let LEFT=false, RIGHT=false, JUMP=false, ENTER=false, EKEY=false, ESC=false;

function bindInput(){
  const set=(k,v)=>{ if(k==='ArrowLeft'||k==='a') LEFT=v; if(k==='ArrowRight'||k==='d') RIGHT=v; if(k===' '||k==='ArrowUp'||k==='w') JUMP=v; if(k==='Enter') ENTER=v; if(k==='e'||k==='E') EKEY=v; if(k==='Escape') ESC=v; };
  addEventListener('keydown',e=>{ set(e.key,true); });
  addEventListener('keyup',e=>{ set(e.key,false); });
}

// ====== collisions / damage ======
function damagePlayer(n){
  if(player.hp <= 0) return;
  player.hp = Math.max(0, player.hp - n);
  setRunN('playerHealth', player.hp);
  player.hitUntil = performance.now() + 300;
  if(player.hp <= 0){
    // TODO: death handling
  }
}

function collide(a){
  const body = {x:a.x, y:a.y, w:a.w, h:a.h, vx:a.vx, vy:a.vy, onGround:false};

  // vertical
  body.y += body.vy;
  for(const p of platforms){
    if(rects(body, p)){
      if(body.vy > 0) { body.y = p.y - body.h; body.onGround = true; body.vy = 0; }
      else if(body.vy < 0){ body.y = p.y + p.h; body.vy = 0; }
    }
  }

  // horizontal
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

  a.x=body.x; a.y=body.y; a.vx=body.vx; a.vy=body.vy; a.onGround=body.onGround;

  // enemy collisions
  for(const r of robots){
    if(!r.active) continue;
    if(rects(a, {x:r.x-10,y:r.y-18,w:20,h:22})){
      damagePlayer(20);
    }
  }
  for(const d of drones){
    if(!d.active || d.disabled) continue;
    if(rects(a, {x:d.x-8,y:d.y-6,w:16,h:12})){
      damagePlayer(15);
    }
  }
  for(const f of females){
    if(!f.active) continue;
    if(rects(a, {x:f.x-10,y:f.y-18,w:20,h:22})){
      if(!f.hasTaken){
        const have = getRunN('playerBTC', 0);
        const take = Math.min(5, have); // 5 BTC once
        setRunN('playerBTC', have - take);
        btc = getRunN('playerBTC', 0);
        f.hasTaken = true;
        setAnim(f, 'female', 'idle');
      }
    }
  }
}

// ====== update ======
let lastTime = 0, gameState='playing';

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
  if(JUMP){ jumpHeld = true; jumpBufferUntil = now + JUMP_BUF; } else jumpHeld = false;

  if(jumpHeld && (now < jumpBufferUntil) && (now < coyoteUntil)){
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
      if(d.x < 32) d.dir = 1;
      if(d.x > worldMaxX - 32) d.dir = -1;
    }
    if(playerLitByCone()){
      // highlight or behavior tweak can go here
    }
  }

  // robots movement
  for(const r of robots){
    if(!r.active) continue;
    const dx = player.x - r.x, dy = player.y - r.y;
    const see = Math.abs(dx) < 80 && Math.abs(dy) < 24;
    const playerAbove = (player.y + 8 < r.y);

    if(see && !playerAbove){
      const ahead = r.x + r.dir * 8;
      let hasFloorAhead = false;
      for(const p of platforms){
        if(ahead >= p.x - 8 && ahead <= p.x + p.w + 8 && r.y <= p.y && p.y <= r.y + 20) { hasFloorAhead = true; break; }
      }
      if(!hasFloorAhead){
        r.dir *= -1;
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
      if(now > r.searchUntil){
        r.state = 'patrol';
      }
    } else {
      r.state = 'patrol'; r.alert = false;
      r.x += r.dir * r.speed * (0.75 + Math.random()*0.2);
      if(r.x < r.patrolL || r.x > r.patrolR) r.dir *= -1;
    }

    if(now < r.hitUntil) setAnim(r, 'robot', 'hurt');
    else setAnim(r, 'robot', r.alert ? 'run' : 'walk');
    stepAnim(r, dt);
  }

  // females movement (patrol like robots when active)
  for(const f of females){
    if(!f.active) continue;
    f.x += f.dir * f.speed * (0.7 + Math.random()*0.2);
    if(f.x < f.patrolL || f.x > f.patrolR) f.dir *= -1;
    setAnim(f, 'female', 'run');
    stepAnim(f, dt);
  }

  // camera
  cameraX = clamp(player.x - VW/2, 0, Math.max(0, worldMaxX - VW));
  player.dist = Math.max(player.dist, player.x);

  // exit door and win
  if(!exitDoor && player.dist > LEVEL_LEN - 220) placeExit();
  if(exitDoor && rects(player, exitDoor)){
    setRunN('playerHealth', Math.max(1, player.hp));
    setRunN('playerBTC', btc);
    setRunN('playerScore', score + 50);
    location.href = NEXT_HREF;
  }
}

// ====== main loop ======
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

  // blit
  const dctx = C.getContext('2d');
  dctx.imageSmoothingEnabled = false;
  dctx.drawImage(off, 0, 0, VW, VH, 0, 0, VW_CANVAS, VH_CANVAS);

  requestAnimationFrame(loop);
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
  if(player.upgrades?.mobileEMP === true){
    ctx.fillStyle = '#aee2ff'; ctx.fillText(`EMP:${charges}`, 6, 60);
  }
}

function drawControlsHint(){
  const title = 'Blackout Protocol';
  ctx.font = '9px monospace'; ctx.textAlign = 'left';
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = '#cfd6df'; ctx.fillText(title, 6, 4);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7f8a99';
  ctx.fillText('← → Move   Space Jump   Enter Hack   E (EMP)   ESC', VW - 6, 4);
}

// ====== boot ======
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
  for(let x = 0; x < VW + CHUNK*2; x += CHUNK) genChunk(x);
  placeExit();

  // Carry over numeric stats from session
  score = getRunN('playerScore', 0);
  btc = getRunN('playerBTC', 0);
  level = LVL;
  gameState = 'playing';

  bindInput();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}
