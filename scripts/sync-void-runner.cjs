// Keep Flask's entry pages aligned with GitHub Pages. Game assets have a Flask route.
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
for(const file of ['index.html','firebase-auth.js','void-runner.html','store-first-page.html'])fs.copyFileSync(path.join(root,file),path.join(root,'static',file));
console.log('Synced shared login, game entry and store pages.');
