/* Existing Firebase/API account menu: switching users must clear account-bound records. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const mock=`export const auth={currentUser:null},provider={};let listener;let sequence=0;export function onAuthStateChanged(a,fn){listener=fn;queueMicrotask(()=>fn(null));return ()=>{};}export async function getRedirectResult(){}export async function signInWithPopup(){sequence++;auth.currentUser={uid:'pilot'+sequence,displayName:'Pilot '+sequence,email:'pilot'+sequence+'@example.test',getIdToken:async()=> 'pilot'+sequence};listener(auth.currentUser);}export async function signOut(){auth.currentUser=null;listener(null);}`;
 await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:mock}));
 await page.route('**/api/void-runner/**',async r=>{const p=r.request().url().split('/').pop();await r.fulfill({contentType:'application/json',body:JSON.stringify(p==='account'?{owned:[],revision:0,save:null,savedAt:null,character:null}:p==='catalog'?{products:[]}:{values:{},revision:0})});});
 try{
  await page.goto('http://127.0.0.1:5000/void-runner.html');
  await page.waitForFunction(()=>VoidStartup.started&&VoidAccount.request);
  const signIn=async()=>{await page.locator('[data-action="menu-account"]').click();await page.locator('.account-other summary').click();await page.locator('[data-action="sign-in"]').click();};
  await signIn();await page.waitForFunction(()=>VoidAccount.user?.uid==='pilot1'&&VoidAccount.profileReady);
  await page.evaluate(()=>{VoidAccount.handle='Old_1';VoidAccount.character={gender:'female',model:'district-resident'};VoidAccount.appearance={look:'old'};});
  await page.locator('[data-action="account-main-menu"]').click();
  await page.locator('[data-action="menu-logout"]').click();
  await page.waitForFunction(()=>!VoidAccount.user&&!VoidAccount.busy);
  assert.equal(await page.evaluate(()=>VoidAccount.profileReady),false,'the prior account is no longer considered verified');
  await signIn();await page.waitForFunction(()=>VoidAccount.user?.uid==='pilot2'&&VoidAccount.profileReady);
  const next=await page.evaluate(()=>({uid:VoidAccount.user.uid,handle:VoidAccount.handle,character:VoidAccount.character,appearance:VoidAccount.appearance}));
  assert.equal(next.uid,'pilot2');assert.equal(next.character,null);assert.equal(next.appearance,null);assert.notEqual(next.handle,'Old_1');
  assert.deepEqual(errors,[]);console.log('PASS account switch clears previous handle, character, appearance and verification state');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
