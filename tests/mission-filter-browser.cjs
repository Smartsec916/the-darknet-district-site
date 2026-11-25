/* Opens the normal Mission Editor with an isolated editor identity. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage({ serviceWorkers: 'block', ignoreHTTPSErrors: true });
    await page.goto((process.env.SITE_TEST_URL || 'http://localhost:5187') + '/void-runner.html');
    await page.waitForFunction(() => window.VoidStartup?.started, null, { timeout: 90000 });
    await page.evaluate(async () => {
      await VoidDevTools.identity(async path => {
        if (path === 'developer/balance') return { values: VoidBalance.defaults, revision: 1, preset: 'NORMAL' };
        throw Object.assign(new Error('Isolated editor'), { status: 404 });
      });
      await VoidDevTools.open('missions');
    });
    const side = page.getByRole('complementary', { name: 'Mission trees' });
    const search = side.getByRole('searchbox');
    const status = side.getByLabel('Mission status');
    const freight = side.getByRole('button', { name: 'Rook freight contracts' });
    await search.fill('rOoK FrEight');
    await search.press('Enter');
    assert.equal(await freight.count(), 1);
    await status.selectOption('archived');
    await side.getByText('No matching missions.').waitFor();
    assert.equal(await freight.count(), 0);
    await side.getByRole('button', { name: 'Clear filters' }).click();
    await search.fill('awakening');
    await search.press('Enter');
    const match = side.locator('[data-me-mission]').filter({ hasText: /awakening/i }).first();
    await match.click();
    assert.match(await match.getAttribute('class'), /\bon\b/);
    await side.getByRole('button', { name: 'Clear filters' }).click();
    assert.equal(await search.inputValue(), '');
    assert.equal(await status.inputValue(), '');
    await freight.click();
    await page.locator('[data-me-freight]').waitFor();
    console.log('PASS search, archived status, clear, objective selection and freight editor');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
