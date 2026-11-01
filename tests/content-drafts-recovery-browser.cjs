/* Stage 3B.1 recovery UI against the local fixture: VOID_TEST_SEED_STALE_DRAFT=1 python tests/serve-admin-drafts.py
   (in-memory drafts, mocked sign-in, no cloud). Unsaved-change warning, history, compare, restore, archive, export,
   rebase review and mobile layout. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const base='http://127.0.0.1:5196',out=path.resolve('work/admin-stage3b1');
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});const result={checks:[],errors:[]};try{
 async function page(viewport){const p=await b.newPage({viewport:viewport||{width:1440,height:1000},acceptDownloads:true});p.on('pageerror',e=>result.errors.push(e.message));await p.route('https://**/*',r=>r.abort());await p.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:"export const auth={},provider={};export const onAuthStateChanged=(a,fn)=>{globalThis.testSignout=()=>fn(null);fn({getIdToken:async()=> 'owner'});};export const signInWithPopup=async()=>{};export const signOut=async()=>globalThis.testSignout();"}));await p.goto(base+'/admin/void-runner.html');await p.getByText('Private storage enabled for the configured owner.',{exact:true}).waitFor();return p;}
 const p=await page(),confirm=name=>p.locator('#draft-confirm').getByRole('button',{name,exact:true}),click=name=>p.getByRole('button',{name,exact:true}).first().click(),status=text=>p.locator('#draft-status').getByText(text).waitFor();
 await p.locator('#items button').first().click();await click('EDIT SELECTED SOURCE');await p.locator('#draft-title').fill('Recovery r1');await click('SAVE PRIVATE DRAFT');await status('Saved private draft r1.');
 await p.locator('#draft-title').fill('Recovery r2');await click('SAVE PRIVATE DRAFT');await status('Saved private draft r2.');const id=await p.locator('#draft-id').inputValue();
 // Unsaved changes: a reload asks first, cancelling keeps the edit, and leaving the page is guarded.
 await p.locator('#draft-title').fill('Unsaved edit');assert.equal(await p.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});dispatchEvent(e);return e.defaultPrevented;}),true);
 await click('RELOAD SAVED DRAFT');await p.locator('#draft-confirm').getByText('unsaved changes').waitFor();await confirm('CANCEL').click();assert.equal(await p.locator('#draft-title').inputValue(),'Unsaved edit');
 await click('RELOAD SAVED DRAFT');await confirm('DISCARD CHANGES').click();await status('Loaded private draft r2.');assert.equal(await p.locator('#draft-title').inputValue(),'Recovery r2');
 assert.equal(await p.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});dispatchEvent(e);return e.defaultPrevented;}),false);result.checks.push('Unsaved edits: reload asks, cancel keeps them, leaving the page is guarded');
 // History: view and compare read-only, then restore as a new revision.
 assert.deepEqual(await p.locator('#draft-history .draft-history-row span').allTextContents().then(r=>r.map(x=>x.split(' · ').slice(0,2).join(' · '))),['r2 · save','r1 · save']);
 await click('COMPARE r1');await p.locator('#draft-recovery').getByText('Changes from r1 to the current r2').waitFor();assert.match(await p.locator('#draft-recovery').innerText(),/Recovery r1[\s\S]*Recovery r2/);
 await click('VIEW r1');await p.locator('#draft-recovery pre').getByText(/"title": "Recovery r1"/).waitFor();assert.equal(await p.locator('#draft-title').inputValue(),'Recovery r2');
 await click('RESTORE r1');await confirm('CANCEL').click();await click('RESTORE r1');await confirm('RESTORE r1').click();await status('Restored r1 as r3.');assert.equal(await p.locator('#draft-title').inputValue(),'Recovery r1');
 await p.locator('#draft-workspace').evaluate(e=>e.scrollIntoView({block:'start'}));await p.locator('.draft-tools').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:path.join(out,'history-desktop.png')});
 result.checks.push('Revision history lists saves; view and compare are read-only; restore creates r3 after confirmation');
 // Archive and restore from the archive.
 await click('ARCHIVE DRAFT');await confirm('ARCHIVE DRAFT').click();await status('Archived r3.');assert(await p.getByRole('button',{name:'SAVE PRIVATE DRAFT',exact:true}).isDisabled());assert.match(await p.locator('#draft-meta').innerText(),/ARCHIVED/);
 assert.equal(await p.locator('#draft-list option',{hasText:'Recovery r1'}).count(),0);await click('VIEW ARCHIVED DRAFTS');await p.locator('#draft-archive').getByText(id+' · r3').waitFor();await p.screenshot({path:path.join(out,'archive-desktop.png')});
 await click('RESTORE '+id+' FROM ARCHIVE');await confirm('RESTORE FROM ARCHIVE').click();await status('Restored '+id+' to the active drafts.');await p.locator('#draft-archive').getByText('No archived drafts.').waitFor();
 await click('RELOAD SAVED DRAFT');await status('Loaded private draft r3.');assert(!(await p.getByRole('button',{name:'SAVE PRIVATE DRAFT',exact:true}).isDisabled()));result.checks.push('Archive frees the active list, archived drafts are read-only and restore from the archive');
 // Export downloads a verifiable private file.
 const [download]=await Promise.all([p.waitForEvent('download'),click('EXPORT DRAFTS')]);const file=path.join(os.tmpdir(),'vr-draft-export-test.json');await download.saveAs(file);const data=JSON.parse(fs.readFileSync(file,'utf8'));fs.unlinkSync(file);
 assert.equal(data.format,'void-runner-draft-export');assert.equal(data.includes,'all-revisions');assert.match(data.owner,/^[0-9a-f]{64}$/);assert.match(data.integrity.digest,/^[0-9a-f]{64}$/);
 const recovered=data.drafts.find(d=>d.id===id);assert.deepEqual(recovered.revisions.map(r=>r.document.data.title),['Recovery r1','Recovery r2','Recovery r1']);await status('SHA-256');result.checks.push('Export downloads every draft and revision with an integrity digest');
 // Rebase review of a draft saved before a game update.
 await p.locator('#draft-list').selectOption('stale-flight');await click('LOAD DRAFT');await status('review the rebase before editing');assert.match(await p.locator('#draft-meta').innerText(),/OLDER SOURCE INVENTORY/);
 await click('REVIEW REBASE');await p.locator('#draft-recovery').getByText('Rebase review · UNRELATED').waitFor();await p.screenshot({path:path.join(out,'rebase-review.png')});
 await click('APPLY REBASE');await confirm('APPLY REBASE').click();await status('Rebased onto source inventory');assert.doesNotMatch(await p.locator('#draft-meta').innerText(),/OLDER SOURCE INVENTORY/);
 await p.locator('#draft-title').fill('Edited after rebase');await click('SAVE PRIVATE DRAFT');await status('Saved private draft r3.');result.checks.push('A draft from an older inventory is flagged, reviewed, rebased after confirmation and editable again');
 // Mobile layout with the history and confirmation visible.
 const m=await page({width:390,height:844});await m.locator('#draft-list').selectOption(id);await m.getByRole('button',{name:'LOAD DRAFT',exact:true}).click();await m.locator('#draft-history').waitFor();await m.getByRole('button',{name:'ARCHIVE DRAFT',exact:true}).click();await m.locator('#draft-confirm').waitFor();
 assert(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await m.locator('#draft-confirm').evaluate(e=>e.scrollIntoView({block:'start'}));await m.screenshot({path:path.join(out,'recovery-mobile.png')});await m.locator('#draft-confirm').getByRole('button',{name:'CANCEL',exact:true}).click();
 await m.locator('#signout').click();assert(await m.locator('#draft-workspace').isHidden());assert.equal(await m.locator('#draft-history').count(),0);result.checks.push('Mobile: history and confirmation fit without horizontal scrolling; sign-out clears them');
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
