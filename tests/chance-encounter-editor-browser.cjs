const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const base = path.resolve(__dirname, '../void-runner');
const seed = require('../void-runner/chance-encounter-seed.json');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage({viewport:{width:1400,height:1250}});
    await page.route('http://localhost/**', route => {
      if (route.request().url().endsWith('.json')) return route.fulfill({ json: seed });
      return route.fulfill({ contentType: 'text/html', body: '<main></main>' });
    });
    await page.goto('http://localhost/');
    for (const file of ['voice-imports.js','chance-encounter.js', 'chance-encounter-editor.js']) {
      await page.addScriptTag({ path: path.join(base, file) });
    }
    await page.addStyleTag({path:path.join(base,'chance-encounter.css')});
    await page.evaluate(async () => {
      let saved;
      const tools = { uid: 'test', authorized: true, request: async (path, body) => {
        if(path==='developer/voice-clips')return {missing:[]};
        if(!body)return { encounters: saved ? [saved] : [] };
        saved={id:body.id,revision:body.revision+1,draft:structuredClone(body.graph)};
        return saved;
      } };
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
    await waiting.getByText('Advanced action settings',{exact:true}).click();
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
    const free=page.locator('section[data-conversation=free]');
    const first=group('lace_free_01'),second=group('lace_free_02'),third=group('lace_free_03');
    await first.getByLabel('Spoken line',{exact:true}).fill('First main action');
    await second.getByLabel('Animation',{exact:true}).fill('sz-tiedbf-look-back-return');
    await third.getByLabel('Spoken line',{exact:true}).fill('Third main action');
    await first.getByLabel('Select action',{exact:true}).check();
    await third.getByLabel('Select action',{exact:true}).check();
    await free.getByRole('button',{name:'Create playlist from selected'}).click();
    const main=free.locator('.encounter-main-playlist');
    const members=()=>main.locator(':scope > [data-line-id]').evaluateAll(nodes=>nodes.map(n=>n.dataset.lineId));
    assert.deepEqual(await members(),['lace_free_01','lace_free_03']);
    assert.equal(await first.getAttribute('data-conversation'),'free');
    await second.getByLabel('Select action',{exact:true}).check();
    await main.getByRole('button',{name:'Add selected to this playlist'}).click();
    assert.deepEqual(await members(),['lace_free_01','lace_free_02','lace_free_03']);
    await third.getByText('Drag to reorder',{exact:true}).dragTo(second.getByText('Drag to reorder',{exact:true}));
    assert.deepEqual(await members(),['lace_free_01','lace_free_03','lace_free_02']);
    await third.getByRole('button',{name:'Move earlier',exact:true}).click();
    assert.deepEqual(await members(),['lace_free_03','lace_free_01','lace_free_02']);
    await third.getByRole('button',{name:'Remove from main playlist',exact:true}).click();
    assert.equal(await third.getByLabel('Spoken line',{exact:true}).inputValue(),'Third main action');
    assert.deepEqual(await members(),['lace_free_01','lace_free_02']);
    await main.getByLabel('Repeat',{exact:true}).selectOption('count');
    await main.getByLabel('Main playlist passes').fill('2');
    await first.getByRole('button',{name:'Create chance playlist',exact:true}).click();
    const chance=first.locator(':scope > .encounter-chance-playlist');
    await chance.getByLabel('Chance (%)',{exact:true}).fill('50');
    await chance.getByLabel('Spoken line',{exact:true}).fill('Branch dialogue');
    assert.equal(await chance.getByLabel('After chance playlist').inputValue(),'reroll');
    await chance.getByRole('button',{name:'Add branch action'}).click();
    const branchActions=chance.locator(':scope > [data-line-id]');
    await branchActions.nth(1).getByLabel('Animation',{exact:true}).fill('sz-tiedbf-look-back-return');
    await branchActions.nth(1).getByRole('button',{name:'Remove from chance playlist',exact:true}).click();
    assert.equal(await branchActions.count(),1);
    await second.getByRole('button',{name:'Create chance playlist',exact:true}).click();
    const later=second.locator(':scope > .encounter-chance-playlist');
    await later.getByLabel('Chance (%)',{exact:true}).fill('0');
    await later.getByLabel('After chance playlist').selectOption('action');
    await later.getByLabel('Return to action').selectOption('lace_free_01');
    // A recorded action changes conversation with its recording intact.
    await group('lace_arrival_02').getByLabel('Conversation for this line').selectOption('free');
    await group('lace_free_05').getByText('Recorded',{exact:true}).waitFor();
    await group('lace_free_05').getByLabel('Conversation for this line').selectOption('arrival');
    await page.getByText('Apartment placement and animation', { exact: true }).click();
    await page.getByRole('button', { name: 'Preview in apartment' }).click();
    assert.equal(await page.evaluate(() => window.testStart), 'flat');

    await page.evaluate(()=>{const rolls=[.1,.2,.95,.3,.99,.3];Math.random=()=>rolls.shift()??.99;});
    await free.getByRole('button',{name:'Preview execution',exact:true}).click();
    await free.getByText(/Playing .*First main action/).waitFor();
    await free.getByText(/Reroll after .*First main action/).first().waitFor();
    await free.getByText(/Rolled 95.00% after .*First main action .* Continue/).first().waitFor();
    await free.getByRole('button',{name:'Stop execution preview',exact:true}).click();
    await free.getByText('Preview stopped',{exact:true}).waitFor();
    if(process.env.ENCOUNTER_SCREENSHOT)await free.screenshot({path:process.env.ENCOUNTER_SCREENSHOT});
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    await page.getByText('Saved draft',{exact:true}).waitFor();
    await page.evaluate(()=>mountEncounter());
    assert.deepEqual(await members(),['lace_free_01','lace_free_02']);
    assert.equal(await main.getByLabel('Main playlist passes').inputValue(),'2');
    assert.equal(await chance.getByLabel('Chance (%)',{exact:true}).inputValue(),'50');
    assert.equal(await later.getByLabel('Return to action').inputValue(),'lace_free_01');
    await group('lace_arrival_02').getByText('Recorded',{exact:true}).waitFor();
    assert.equal(await second.locator(':scope > .encounter-action-fields').getByLabel('Animation',{exact:true}).inputValue(),'sz-tiedbf-look-back-return');
    await main.locator(':scope > summary').click();
    assert.equal(await first.isVisible(),false);
    await main.locator(':scope > summary').click();
    assert.equal(await first.isVisible(),true);
    console.log('Draft playback, selection, drag and drop, chance returns, cancellation and save/reload passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
