(function(){
  console.log("[patch] platform-patch active");
  const TILE = window.TILE||16, VW = window.VW||256, VH = window.VH||240;

  // Use top part of ledge_tile for rails, bottom part for deck
  const RAIL_FRAC = 0.42;                 // ~top 42% of the source image
  const BASE_FRAC = 1 - RAIL_FRAC;        // ~bottom 58%
  const FULL_DRAW_H = 36;                 // overall on-screen height (rails+deck)
  const PLATFORM_BASE_H = Math.round(FULL_DRAW_H*BASE_FRAC); // ~21px
  const RAIL_DRAW_H     = FULL_DRAW_H - PLATFORM_BASE_H;     // ~15px

  const imgOK = (img)=>img && img.complete && img.naturalWidth>0 && img.naturalHeight>0;

  // Draw deck (bottom band) stretched to platform width
  const _origDrawTiles = window.drawTiles;
  window.drawTiles = function(){
    const img = window.ledgeImg; // your ledge_tile.png already loaded by the game
    for(const p of (window.platforms||[])){
      const sx=(p.x-(window.cameraX||0))|0;
      if(sx+p.w<0 || sx>VW) continue;

      if(imgOK(img)){
        const srcW = img.naturalWidth, srcH = img.naturalHeight;
        const srcBaseH = Math.max(1, Math.round(srcH*BASE_FRAC));
        const srcBaseY = srcH - srcBaseH;
        const dy = (p.y + (TILE - PLATFORM_BASE_H))|0;
        window.ctx.drawImage(img, 0, srcBaseY, srcW, srcBaseH, sx, dy, p.w, PLATFORM_BASE_H);
      }else{
        // minimal fallback box
        window.ctx.fillStyle='#3a3f47'; window.ctx.fillRect(sx|0,p.y|0,p.w,TILE);
        window.ctx.fillStyle='#98a0b0'; window.ctx.fillRect(sx|0,p.y|0,p.w,1);
      }
    }
  };

  // Draw rails (top band) ABOVE the player on floating platforms
  window.drawRailsOnTop = function(){
    const img = window.ledgeImg; if(!imgOK(img)) return;
    const camX=window.cameraX||0;
    const srcW=img.naturalWidth, srcH=img.naturalHeight;
    const srcRailH=Math.max(1, Math.round(srcH*RAIL_FRAC));  // from top
    const srcRailY=0;

    for(const p of (window.platforms||[])){
      if(p.y >= VH - TILE) continue;      // only floating platforms
      const sx=(p.x-camX)|0;
      if(sx+p.w<0 || sx>VW) continue;
      const dy=(p.y - (RAIL_DRAW_H - 2))|0; // sit rails on deck with slight overlap
      window.ctx.drawImage(img, 0, srcRailY, srcW, srcRailH, sx, dy, p.w, RAIL_DRAW_H);
    }
  };
})();
