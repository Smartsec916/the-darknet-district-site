/* Smoke the shipped Tesana build without Firebase or production writes.
   Run with tests/serve-modern.cjs on port 5187 and BROWSER_CHANNEL=chromium. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.SITE_TEST_URL || 'http://127.0.0.1:5187';
const channel = process.env.BROWSER_CHANNEL || 'chromium';

async function offline(page) {
  await page.route('**/firebase-auth.js', route => route.abort());
  await page.route('**/api/blackout/**', route => route.fulfill({
    status: 503, contentType: 'application/json', body: '{"error":"Rankings are not configured"}'
  }));
}
async function ready(page) {
  await page.goto(base + '/blackout-protocol/index.html');
  await page.waitForFunction(() => Boolean(window.__BP), null, { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] }
      : channel === 'chromium' ? {} : { channel }) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && response.url().includes('/blackout-protocol/assets/')) errors.push(`${response.status()} ${response.url()}`);
    });
    await offline(page);
    await ready(page);
    await page.getByRole('button', { name: 'LOCAL PLAY · RANKINGS OFFLINE' }).waitFor();
    await page.locator('#district-account-toggle').click();
    assert.match(await page.locator('#district-account-panel').innerText(), /no ranked score was submitted/i);
    await page.locator('#district-account-panel header button').click();

    // Enter through the actual canvas menu and move with the desktop controls.
    await page.mouse.click(650, 370);
    await page.waitForTimeout(300);
    await page.mouse.click(650, 300);
    await page.waitForFunction(() => window.__BP.screen === 'play' && Boolean(window.__BP.world));
    const startX = await page.evaluate(() => window.__BP.world.player.x);
    await page.keyboard.down('d');
    await page.waitForTimeout(400);
    const moving = await page.evaluate(() => ({ x: window.__BP.world.player.x, anim: window.__BP.world.player.anim }));
    await page.keyboard.up('d');
    assert.ok(moving.x > startX + 10, 'desktop right movement');
    assert.equal(moving.anim, 'run');

    // A real checkpoint object should survive a death and remain in the local save.
    const checkpoint = await page.evaluate(() => {
      const w = window.__BP.world;
      const marker = w.L.ents.find(entity => entity.t === 'checkpoint');
      const cp = marker && w.things.find(thing => thing.id === marker.id);
      if (!cp) return null;
      w.player.x = cp.x; w.player.y = cp.y;
      return { id: cp.id, x: cp.x, y: cp.y };
    });
    assert.ok(checkpoint, 'sector 1 has a checkpoint');
    await page.waitForFunction(id => window.__BP.save().resume?.cp === id, checkpoint.id);
    await page.evaluate(() => window.__BP.world.player.die(window.__BP.world, 'test hazard'));
    await page.waitForFunction(() => window.__BP.world.player.state === 'play', null, { timeout: 8000 });
    const afterDeath = await page.evaluate(() => ({
      x: window.__BP.world.player.x, y: window.__BP.world.player.y,
      hp: window.__BP.world.player.hp, savedCheckpoint: window.__BP.save().resume?.cp
    }));
    assert.ok(Math.abs(afterDeath.x - checkpoint.x) < 20 && Math.abs(afterDeath.y - checkpoint.y) < 30,
      'death respawns at the checkpoint');
    assert.ok(afterDeath.hp > 0, 'respawn restores health');
    assert.equal(afterDeath.savedCheckpoint, checkpoint.id, 'death keeps checkpoint save');
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__BP));
    assert.equal(await page.evaluate(() => window.__BP.save().resume?.cp), checkpoint.id,
      'checkpoint survives a browser reload');
    const canvas = await page.locator('#screen canvas').first().boundingBox();
    assert.ok(canvas, 'game canvas is visible after reload');
    const clickGame = async (x, y) => page.mouse.click(canvas.x + canvas.width * x / 320,
      canvas.y + canvas.height * y / 240);
    await clickGame(160, 128); // start prompt
    await page.waitForTimeout(250);
    await clickGame(160, 93); // Continue Sector 01
    await page.waitForFunction(() => window.__BP.screen === 'play' && Boolean(window.__BP.world));
    assert.ok(Math.abs(await page.evaluate(() => window.__BP.world.player.x) - checkpoint.x) < 20,
      'Continue resumes at the saved checkpoint');

    // Drive the completion hook without fabricating a leaderboard response.
    await page.evaluate(() => { window.__BP.world.time = 20; window.__BP.world.finish(); });
    await page.waitForFunction(() => window.__BP.screen === 'results');
    assert.equal(await page.evaluate(() => window.__BP.save().unlocked), 2);
    await page.waitForTimeout(300); // the game debounces menu input after a screen change
    await page.mouse.click(640, 420);
    await page.waitForFunction(() => window.__BP.screen === 'play' && window.__BP.world.idx === 1);

    const sectors = [];
    for (let i = 0; i < 12; i++) {
      const sector = await page.evaluate(i => { window.__BP.start(i); return {
        number: window.__BP.world.cfg.num,
        objects: window.__BP.world.things.length,
        npcs: window.__BP.world.npcs.length
      }; }, i);
      assert.equal(sector.number, i + 1);
      assert.ok(sector.objects > 20, `sector ${i + 1} built its scene`);
      if (i === 2) assert.ok(sector.npcs > 0, 'sector 3 contains NPCs');
      sectors.push(sector.number);
      await page.waitForTimeout(80);
    }
    await page.reload();
    await page.waitForFunction(() => Boolean(window.__BP));
    assert.ok(await page.evaluate(() => window.__BP.save().unlocked >= 2), 'guest progression persisted');
    assert.deepEqual(errors, []);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mobileErrors = [];
    mobile.on('pageerror', error => mobileErrors.push(error.message));
    await offline(mobile);
    await ready(mobile);
    await mobile.evaluate(() => window.__BP.start(2));
    await mobile.waitForFunction(() => document.getElementById('touch').classList.contains('on'));
    const pad = await mobile.locator('#touch .tbtn').first().boundingBox();
    assert.ok(pad && pad.width > 40, 'touch movement pad visible');
    const mobileX = await mobile.evaluate(() => window.__BP.world.player.x);
    await mobile.mouse.move(pad.x + pad.width * 0.8, pad.y + pad.height / 2);
    await mobile.mouse.down();
    await mobile.waitForTimeout(400);
    await mobile.mouse.up();
    assert.ok(await mobile.evaluate(() => window.__BP.world.player.x) > mobileX + 10, 'touch movement works');
    assert.ok(await mobile.evaluate(() => window.__BP.world.npcs.length) > 0, 'Level 3 NPCs remain');
    assert.deepEqual(mobileErrors, []);
    await mobile.close();

    // Switching District accounts on one browser must not expose another account's local campaign.
    const signed = await browser.newPage();
    await signed.route('**/blackout-protocol/firebase-auth.js', route => route.fulfill({contentType: 'text/javascript', body: `
      const uid = localStorage.getItem('blackout-test-uid');
      export const auth = {currentUser: uid ? {uid, getIdToken: async () => 'test-token'} : null};
      export const provider = {};
      export const onAuthStateChanged = (a, callback) => { callback(a.currentUser); return () => {}; };
      export const getRedirectResult = async () => null;
    `}));
    await signed.route('**/blackout-protocol/district-identity.js', route => route.fulfill({
      contentType: 'text/javascript', body: 'export async function completeEmailLink() { return null; }'
    }));
    await signed.route('**/api/blackout/**', route => route.fulfill({
      status: 503, contentType: 'application/json', body: '{"error":"offline"}'
    }));
    await ready(signed);
    await signed.evaluate(() => {
      localStorage.setItem('blackout_protocol_save_v1', JSON.stringify({...window.__BP.save(), unlocked: 4}));
      localStorage.setItem('blackout-test-uid', 'uidA');
    });
    await signed.reload();
    await signed.waitForFunction(() => Boolean(window.__BP));
    // Wait for the page to finish switching to account A (slow runners read the guest save for a moment), then check it did not inherit the guest's progress.
    await signed.waitForFunction(() => window.__BP.save().unlocked === 1, null, { timeout: 30000 }).catch(() => {});
    assert.equal(await signed.evaluate(() => window.__BP.save().unlocked), 1, 'account A does not inherit guest progress');
    await signed.evaluate(() => {
      localStorage.setItem('blackout_protocol_save_v1_uid_uidA', JSON.stringify({...window.__BP.save(), unlocked: 3}));
      localStorage.setItem('blackout-test-uid', 'uidB');
    });
    await signed.reload();
    await signed.waitForFunction(() => Boolean(window.__BP));
    assert.equal(await signed.evaluate(() => window.__BP.save().unlocked), 1, 'account B does not inherit account A progress');
    await signed.evaluate(() => localStorage.setItem('blackout-test-uid', 'uidA'));
    await signed.reload();
    await signed.waitForFunction(() => Boolean(window.__BP));
    assert.equal(await signed.evaluate(() => window.__BP.save().unlocked), 3, 'account A progress returns');
    await signed.evaluate(() => localStorage.removeItem('blackout-test-uid'));
    await signed.reload();
    await signed.waitForFunction(() => Boolean(window.__BP));
    assert.equal(await signed.evaluate(() => window.__BP.save().unlocked), 4, 'original guest progress returns');
    await signed.close();

    // A signed-in account can load progress on another device. A stale device
    // gets a conflict instead of silently replacing the newer account save.
    let cloudRevision = 3;
    let cloudProgress = {v:1, unlocked:5, btc:24, score:2400, up:{}, shield:0,
      sidearm:false, stats:{}, resume:null, muted:false,
      fx:{scanlines:true, glow:true, grid:false, cabinet:true}, finished:false};
    async function cloudPage() {
      const context = await browser.newContext();
      const p = await context.newPage();
      await p.addInitScript(() => localStorage.setItem('blackout-test-uid', 'cloudA'));
      await p.route('**/blackout-protocol/firebase-auth.js', route => route.fulfill({contentType:'text/javascript', body:`
        const uid = localStorage.getItem('blackout-test-uid');
        export const auth = {currentUser:{uid, getIdToken:async()=> 'test-token'}};
        export const provider = {};
        export const onAuthStateChanged = (a, callback) => { callback(a.currentUser); return () => {}; };
        export const getRedirectResult = async () => null;
      `}));
      await p.route('**/blackout-protocol/district-identity.js', route => route.fulfill({
        contentType:'text/javascript', body:'export async function completeEmailLink() { return null; }'
      }));
      await p.route('**/api/blackout/**', route => route.fulfill({status:503,
        contentType:'application/json', body:'{"error":"Rankings offline"}'}));
      await p.route('**/api/blackout/v2/progress', async route => {
        if (route.request().method() === 'GET') return route.fulfill({contentType:'application/json',
          body:JSON.stringify({progress:cloudProgress, revision:cloudRevision})});
        const submitted = route.request().postDataJSON();
        if (submitted.revision !== cloudRevision) return route.fulfill({status:409, contentType:'application/json',
          body:JSON.stringify({error:'Account progress changed on another device.'})});
        cloudProgress = submitted.progress; cloudRevision++;
        return route.fulfill({contentType:'application/json', body:JSON.stringify({revision:cloudRevision})});
      });
      await ready(p);
      await p.waitForFunction(() => window.__BP.save().unlocked === 5);
      return {context, page:p};
    }
    // The account-save half of the game page (account.js tesanaGetProgress and the page that calls it) is on the branch
    // codex/blackout-district-production-integration and has NOT been merged: the shipped game does not sync progress to accounts.
    // Until it ships this part is reported as not run, instead of failing every build. It runs by itself once the game has it.
    const shipped = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'blackout-protocol', 'account.js'), 'utf8').includes('tesanaGetProgress');
    if (!shipped) {
      console.log(`Blackout browser smoke passed: ${sectors.length} sectors, desktop/mobile controls, offline fallback, guest saves. NOT RUN: account save sync (not shipped in the game yet).`);
      return;
    }
    const first = await cloudPage();
    assert.equal(cloudRevision, 3, 'loading account progress does not submit a score');
    await first.page.evaluate(() => window.__BP.start(0));
    await first.page.waitForFunction(() => document.querySelector('#district-account-panel')?.textContent?.includes('Account progress saved'));
    assert.equal(cloudRevision, 4, 'game progress syncs to the account');
    const second = await cloudPage();
    await first.page.evaluate(() => window.__BP.start(1));
    for (let i = 0; i < 50 && cloudRevision < 5; i++) await first.page.waitForTimeout(100);
    assert.equal(cloudRevision, 5, 'newer device progress reached the account');
    await second.page.evaluate(() => window.__BP.start(2));
    await second.page.waitForFunction(() => document.querySelector('#district-account-panel')?.textContent?.includes('Both copies are safe'));
    assert.equal(cloudProgress.resume.level, 1, 'stale device did not overwrite the server');
    assert.equal(await second.page.evaluate(() => window.__BP.save().resume.level), 2,
      'stale device kept its local copy');
    await second.page.locator('#district-account-toggle').click();
    await second.page.getByRole('button', {name:'LOAD ACCOUNT SAVE'}).click();
    await second.page.waitForFunction(() => window.__BP?.save().resume?.level === 1);
    assert.equal(cloudProgress.resume.level, 1, 'loading the account copy does not change verified score data');
    await first.context.close(); await second.context.close();
    console.log(`Blackout browser smoke passed: ${sectors.length} sectors, desktop/mobile controls, offline fallback, guest and account saves.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
