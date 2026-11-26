const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = path.resolve(__dirname, '../void-runner');
const seed = require('../void-runner/chance-encounter-seed.json');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.route('http://encounter.test/**', route => {
      if (route.request().url().endsWith('.json')) return route.fulfill({ json: seed });
      return route.fulfill({ contentType: 'text/html', body: '<main></main>' });
    });
    await page.goto('http://encounter.test/');
    for (const file of ['chance-encounter.js', 'chance-encounter-editor.js']) {
      await page.addScriptTag({ path: path.join(base, file) });
    }
    await page.evaluate(async () => {
      const tools = { uid: 'test', authorized: true, request: async () => ({ encounters: [] }) };
      window.mountEncounter = () => VoidEncounterEditor.mount(document.querySelector('main'), tools);
      window.VoidEncounterGame = { playtest: (graph, start) => {
        window.testStart = start;
        sessionStorage.setItem('chance-editor-return', graph.id);
      } };
      await mountEncounter();
    });
    await page.getByLabel('Name', { exact: true }).fill('Old Town draft');
    await page.getByText('Dialogue (8 slots)', { exact: true }).click();
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).count(), 8);
    await page.getByLabel('Spoken line', { exact: true }).first().fill('Preview only');
    await page.getByRole('button', { name: '▶ Play This Chance Encounter' }).click();
    assert.equal(await page.evaluate(() => window.testStart), 'crossing');
    await page.evaluate(() => mountEncounter());
    assert.equal(await page.getByLabel('Name', { exact: true }).inputValue(), 'Old Town draft');
    await page.getByText('Dialogue (8 slots)', { exact: true }).click();
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).first().inputValue(), 'Preview only');
    await page.getByText('Apartment placement and animation', { exact: true }).click();
    await page.getByRole('button', { name: 'Preview in apartment' }).click();
    assert.equal(await page.evaluate(() => window.testStart), 'flat');
    console.log('Draft playback, dialogue, return to editor and apartment preview passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
