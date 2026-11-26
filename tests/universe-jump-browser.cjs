/* Run against a served build. Developer authorization is a fixture in an isolated
   browser. Block API writes and assert the campaign save survives every jump. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const registry = require('../void-runner/universe.js');
const entries = Object.entries(registry.locations).flatMap(([id, loc]) =>
  loc.type === 'pad' ? [id, id + '/planet', id + '/settlement'] : [id]);
const base = process.argv[2] || 'http://127.0.0.1:5201';

(async () => {
  const browser = await chromium.launch({executablePath: process.env.BROWSER_EXECUTABLE,
    args:['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({serviceWorkers:'block', viewport:{width:1000,height:680}});
    await page.route('**/api/**', route => route.request().method() === 'GET' ? route.continue() : route.abort());
    await page.goto(base + '/void-runner.html');
    for (const target of entries) {
      await page.waitForFunction(() => globalThis.VoidStartup?.started, null, {timeout:120000});
      const before = await page.evaluate(() => {
        leaveMenu();VoidGraphics.quality='low';VoidBabylon.setQuality('low');
        VoidDevTools.authorized=true;VoidDevTools.request=async()=>({});
        VoidDevTools.tab='guide';VoidDevTools.render();document.getElementById('dev-balance').hidden=false;
        return localStorage.getItem(SAVE_KEY);
      });
      await page.locator('[data-dev-tab="test"]').click();
      const button = page.locator('[data-dev="test-place-' + target + '"]');
      await button.locator('xpath=ancestor::details[1]/summary').click();
      await button.click();
      const [id, site] = target.split('/');
      await page.waitForFunction(id => VoidDevTest.active && state.location === id &&
        (VoidUniverse.locations[id].type === 'arrival' ? mode === 'play' && flight?.route?.phase === 'align' :
          mode === 'walking' && !!walkingLocation && !!walker), id, {timeout:150000});
      const result = await page.evaluate(() => ({save:localStorage.getItem(SAVE_KEY), scene:walkingLocation?.id || walkingLocation?.kind,
        quarter:walkingLocation?.quarter,credits:state.credits,weapon:state.progression.personal.weapon,launcher:state.creditGear.includes('launcher')}));
      assert.equal(result.save, before);assert.equal(result.credits,10000);assert.equal(result.weapon,'ward-pistol');assert.ok(result.launcher);
      if (id === 'earth') assert.equal(result.quarter, site === 'settlement' ? 'oldtown' : 'port');
      console.log(target, result.scene || 'open space', result.quarter || '');
      await Promise.all([page.waitForNavigation(), page.locator('#dev-test-banner button').click()]);
      await page.waitForFunction(() => globalThis.VoidStartup?.started, null, {timeout:120000});
      assert.equal(await page.evaluate(() => localStorage.getItem(SAVE_KEY)), before);
    }
    console.log(entries.length + ' destination buttons passed.');
  } finally { await browser.close(); }
})().catch(err => { console.error(err);process.exitCode=1; });
