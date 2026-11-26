const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = path.resolve(__dirname, '../void-runner');
const seed = require('../void-runner/chance-encounter-seed.json');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.route('http://localhost/**', route => {
      if (route.request().url().endsWith('.json')) return route.fulfill({ json: seed });
      return route.fulfill({ contentType: 'text/html', body: '<main></main>' });
    });
    await page.goto('http://localhost/');
    for (const file of ['voice-imports.js','chance-encounter.js', 'chance-encounter-editor.js']) {
      await page.addScriptTag({ path: path.join(base, file) });
    }
    await page.evaluate(async () => {
      const tools = { uid: 'test', authorized: true, request: async () => ({ encounters: [] }) };
      window.mountEncounter = () => VoidEncounterEditor.mount(document.querySelector('main'), tools);
      window.VoidEncounterGame = { playtest: (graph, start) => {
        window.testStart = start;
        window.decisionAfter = graph.decisionAfter;
        window.testRecording = graph.dialogue[0]?.recording;
        sessionStorage.setItem('chance-editor-return', graph.id);
      } };
      await mountEncounter();
    });
    await page.getByLabel('Name', { exact: true }).fill('Old Town draft');
    await page.getByLabel('Show player choices').selectOption('lace_arrival_01');
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).first().isVisible(), true);
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).count(), 9);
    const waiting=page.getByRole('group',{name:'lace_wait_01',exact:true});
    await waiting.getByLabel('Spoken line',{exact:true}).fill('Still deciding?');
    await waiting.getByLabel('Wait before this line (seconds)').fill('7');
    await page.getByLabel('Spoken line', { exact: true }).first().fill('Preview only');
    await page.getByLabel('Import recording',{exact:true}).first().setInputFiles(path.join(base,'assets/audio/voice/bartender-ebb7d2f21c.ogg'));
    await page.getByText('Recorded',{exact:true}).waitFor();
    const bytes=require('node:fs').readFileSync(path.join(base,'assets/audio/voice/bartender-ebb7d2f21c.ogg'));
    await page.getByLabel('Spoken line',{exact:true}).nth(1).fill('Second take');
    await page.getByLabel('Bulk import recordings',{exact:true}).setInputFiles(
      ['lace_arrival_02.ogg','unknown.ogg'].map(name=>({name,mimeType:'audio/ogg',buffer:bytes})));
    await page.getByText(/1 imported.*unknown.ogg.*Unknown line ID/).waitFor();
    await page.getByRole('button', { name: '▶ Play This Chance Encounter' }).click();
    assert.equal(await page.evaluate(() => window.testStart), 'crossing');
    assert.equal(await page.evaluate(() => window.decisionAfter), 'lace_arrival_01');
    assert.equal(await page.evaluate(() => window.testRecording.who), 'lace');
    assert.equal(await page.evaluate(() => window.testRecording.text), 'Preview only');
    await page.evaluate(() => mountEncounter());
    assert.equal(await page.getByLabel('Name', { exact: true }).inputValue(), 'Old Town draft');
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).first().isVisible(), true);
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).first().inputValue(), 'Preview only');
    assert.equal(await waiting.getByLabel('Spoken line',{exact:true}).inputValue(),'Still deciding?');
    assert.equal(await waiting.getByLabel('Wait before this line (seconds)').inputValue(),'7');
    const group=id=>page.getByRole('group',{name:id,exact:true});
    // A recorded line changes branch with its recording intact.
    await group('lace_arrival_02').getByLabel('Conversation for this line').selectOption('free');
    await group('lace_free_04').getByText('Recorded',{exact:true}).waitFor();
    await group('lace_free_04').getByLabel('Conversation for this line').selectOption('arrival');
    await group('lace_arrival_02').getByRole('button',{name:'Move earlier'}).click();
    await page.getByLabel('Insert new line',{exact:true}).selectOption('lace_arrival_01');
    await page.getByRole('button',{name:'Add Lace line'}).click();
    const order=()=>page.locator('[data-line-id^="lace_arrival_"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.lineId));
    assert.deepEqual(await order(),['lace_arrival_02','lace_arrival_03','lace_arrival_01']);
    await group('lace_free_01').getByLabel('Conversation for this line').selectOption({label:'Waiting for choice'});
    await group('lace_wait_02').getByLabel('Wait before this line (seconds)').fill('8');
    assert.equal(await group('lace_wait_02').getByLabel('Wait before this line (seconds)').inputValue(),'8');
    await page.getByText('Apartment placement and animation', { exact: true }).click();
    await page.getByRole('button', { name: 'Preview in apartment' }).click();
    assert.equal(await page.evaluate(() => window.testStart), 'flat');
    console.log('Draft playback, dialogue, return to editor and apartment preview passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
