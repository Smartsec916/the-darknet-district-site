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
        window.waitingRepeat = graph.dialogue.find(line => line.id === 'lace_wait_01')?.repeatSpeech;
        window.testStart = start;window.playedGraph=structuredClone(graph);
        window.decisionAfter = graph.decisionAfter;
        window.testRecording = graph.dialogue[0]?.recording;
        sessionStorage.setItem('chance-editor-return', graph.id);
      } };
      window.VoidLiveContent={env:{trees:[{missions:[{id:'awakening',name:'Awakening'}]}]}};
      await mountEncounter();
    });
    await page.getByLabel('Name', { exact: true }).fill('Old Town draft');
    await page.getByLabel('Start trigger',{exact:true}).selectOption('game-time');
    await page.getByLabel('Trigger mission').selectOption('awakening');
    await page.getByLabel('In-game minutes after completion').fill('45');
    await page.getByLabel('Also allow nearby percentage rolls without this trigger').check();
    await page.getByLabel('Show player choices').selectOption('lace_arrival_01');
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).first().isVisible(), true);
    assert.equal(await page.getByLabel('Spoken line', { exact: true }).count(), 9);
    const waiting=page.getByRole('group',{name:'lace_wait_01',exact:true});
    const motions=await waiting.getByLabel('Animation',{exact:true}).evaluate(input=>[...input.list.options].map(o=>o.value));
    for(const name of ['sz-tiedbf','sz-tiedbf-look-back','sz-tiedbf-look-back-return'])assert.ok(motions.includes(name));
    await waiting.getByLabel('Repeat spoken line until canceled').check();
    assert.equal(await waiting.getByLabel('Repeat animation until canceled').isChecked(), false);
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
    assert.deepEqual(await page.evaluate(()=>window.playedGraph.conditions.startTrigger),
      {kind:'game-time',target:'awakening',minutes:45,alsoRandom:true});
    assert.equal(await page.evaluate(() => window.waitingRepeat), true);
    assert.equal(await page.evaluate(() => window.decisionAfter), 'lace_arrival_01');
    assert.equal(await page.evaluate(() => window.testRecording.who), 'lace');
    assert.equal(await page.evaluate(() => window.testRecording.text), 'Preview only');
    await page.evaluate(() => mountEncounter());
    assert.equal(await page.getByLabel('Name', { exact: true }).inputValue(), 'Old Town draft');
    assert.equal(await page.getByLabel('Trigger mission').inputValue(),'awakening');
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
    await waiting.getByText('Playlist bounds and percentage branches',{exact:true}).click();
    await waiting.getByLabel('First repeated action').check();
    await waiting.getByRole('button',{name:'Add percentage branch'}).click();
    const branch=waiting.getByRole('group',{name:'Branch playlist 1',exact:true}).first();
    await branch.getByLabel('Chance (%)',{exact:true}).fill('75');
    await branch.getByLabel('Playlist passes (0 = until canceled)').fill('2');
    await branch.getByLabel('Spoken line',{exact:true}).fill('Branch begins.');
    await branch.getByRole('button',{name:'Add branch action'}).click();
    const second=branch.locator('[data-line-id]').nth(1);
    await second.getByLabel('Animation',{exact:true}).fill('sz-tiedbf-look-back-return');
    await second.getByText('Playlist bounds and percentage branches',{exact:true}).click();
    await second.getByRole('button',{name:'Add percentage branch'}).click();
    await second.locator('[data-line-id]').getByLabel('Spoken line',{exact:true}).fill('Nested branch.');
    await page.getByRole('button',{name:'▶ Play This Chance Encounter'}).click();
    const saved=await page.evaluate(()=>window.playedGraph);
    const first=saved.dialogue.find(l=>l.id==='lace_wait_01');
    assert.equal(first.playlistStart,true);assert.equal(first.branches[0].passes,2);assert.equal(first.branches[0].chance,75);
    assert.equal(first.branches[0].actions.length,2);
    const children=first.branches[0].actions.map(id=>saved.dialogue.find(r=>r.id===id));
    assert.equal(children[0].text,'Branch begins.');assert.equal(children[1].animation,'sz-tiedbf-look-back-return');
    assert.equal(saved.dialogue.find(r=>r.id===children[1].branches[0].actions[0]).text,'Nested branch.');
    assert.deepEqual(await page.evaluate(()=>VoidChanceEncounter.validate(window.playedGraph)),[]);
    console.log('Draft playback, dialogue, return to editor and apartment preview passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
