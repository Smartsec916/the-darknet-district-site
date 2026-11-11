const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const yml=fs.readFileSync('tools/district-hub/render.yaml','utf8'),pkg=JSON.parse(fs.readFileSync('tools/district-hub/package.json','utf8')),lock=JSON.parse(fs.readFileSync('tools/district-hub/package-lock.json','utf8'));
const code=(s)=>s.split('\n').filter(l=>!/^\s*#/.test(l)).map(l=>l.replace(/\s+#.*$/,'')).join('\n');

test('the Render blueprint is free, manual-deploy, secret-free and fail-closed',()=>{
 const y=code(yml);
 assert.match(y,/^\s*plan: free\b/m);assert.match(y,/^\s*autoDeploy: false\b/m);assert.match(y,/^\s*healthCheckPath: \/health\s*$/m);assert.match(y,/rootDir: tools\/district-hub/);
 assert.match(y,/key: HUB_MODE\s+value: production/);
 // The allow-list, deny-list are entered in the dashboard; no secret or account id is committed.
 assert.match(y,/key: HUB_ALLOWED_UIDS\s+sync: false/);assert.match(y,/key: HUB_DENY_UIDS\s+sync: false/);
 assert.doesNotMatch(y,/HUB_ALLOW_ANY_SIGNED_IN/,'an open test is never the default');
 assert.doesNotMatch(y,/DATABASE_URL|SERVICE_ACCOUNT|PRIVATE_KEY|GOOGLE_APPLICATION_CREDENTIALS|sk_live|sk_test|AIza/,'no credential of any kind');
 assert.doesNotMatch(y,/\bplan:\s*(?!free\b)\w+/,'no paid plan');
 assert.match(y,/HUB_ALLOWED_ORIGINS\s+value: https:\/\/thedarknetdistrict\.com,https:\/\/www\.thedarknetdistrict\.com/);
 assert.match(y,/HUB_API_BASE\s+value: https:\/\/the-darknet-district-site\.onrender\.com/);
});
test('the hub package has one dependency (ws, already used by the Iris service) and a lock file for npm ci',()=>{
 assert.deepEqual(Object.keys(pkg.dependencies),['ws']);assert.equal(pkg.private,true);assert.equal(pkg.scripts.start,'node server.cjs');
 assert(lock.packages['node_modules/ws'],'ws is locked');assert.equal(Object.keys(lock.packages).filter(k=>k.startsWith('node_modules/')).length,1,'no transitive dependencies');
 const iris=JSON.parse(fs.readFileSync('iris-service/package.json','utf8'));assert.equal(iris.dependencies.ws,pkg.dependencies.ws,'same ws range as Iris');
});
test('the hub files use only what is in their own folder, so rootDir deployment works',()=>{
 for(const f of fs.readdirSync('tools/district-hub').filter(f=>f.endsWith('.cjs'))){
  const src=fs.readFileSync('tools/district-hub/'+f,'utf8');
  for(const m of src.matchAll(/require\('(\.[^']*)'\)/g))assert(fs.existsSync('tools/district-hub/'+m[1].replace(/^\.\//,'')),f+' requires '+m[1]);
  assert.doesNotMatch(src,/require\('\.\.\//,f+' reaches outside its folder');
 }
});
