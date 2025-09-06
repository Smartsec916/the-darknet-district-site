
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");

(async () => {
  try {
    // Process the far background
    const farInputPath = "assets/01_bg_far.png";
    const farOutputPath = "assets/01_bg_far_seamless.png";

    if (fs.existsSync(farInputPath)) {
      const farImg = await loadImage(farInputPath);
      const w = farImg.width;
      const h = farImg.height;

      // Create a new canvas twice as wide, for mirroring
      const canvas = createCanvas(w * 2, h);
      const ctx = canvas.getContext("2d");

      // Draw original
      ctx.drawImage(farImg, 0, 0);

      // Draw mirrored copy
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(farImg, -w * 2, 0); // mirrored position
      ctx.restore();

      // Crop back to original width with seamless edges
      const cropCanvas = createCanvas(w, h);
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(canvas, -w / 2, 0);

      const buffer = cropCanvas.toBuffer("image/png");
      fs.writeFileSync(farOutputPath, buffer);
      console.log(`Seamless far background saved to ${farOutputPath}`);
    } else {
      console.log(`Far background not found at ${farInputPath}`);
    }

    // Process the mid background (if it exists)
    const midInputPath = "assets/01_bg_mid_transparent_1024w.png";
    const midOutputPath = "assets/01_bg_mid_seamless.png";

    if (fs.existsSync(midInputPath)) {
      const midImg = await loadImage(midInputPath);
      const w = midImg.width;
      const h = midImg.height;

      const canvas = createCanvas(w * 2, h);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(midImg, 0, 0);

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(midImg, -w * 2, 0);
      ctx.restore();

      const cropCanvas = createCanvas(w, h);
      const cropCtx = cropCanvas.getContext("2d");
      cropCtx.drawImage(canvas, -w / 2, 0);

      const buffer = cropCanvas.toBuffer("image/png");
      fs.writeFileSync(midOutputPath, buffer);
      console.log(`Seamless mid background saved to ${midOutputPath}`);
    } else {
      console.log(`Mid background not found at ${midInputPath}`);
    }

  } catch (error) {
    console.error("Error creating seamless backgrounds:", error);
  }
})();
