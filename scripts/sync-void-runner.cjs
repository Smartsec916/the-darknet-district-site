// Keep Flask's entry pages aligned with GitHub Pages. Game assets have a Flask route.
const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
for(const file of ['index.html','firebase-auth.js','void-runner.html','store-first-page.html'])fs.copyFileSync(path.join(root,file),path.join(root,'static',file));
console.log('Synced shared login, game entry and store pages.');

const campaign=require('../void-runner/campaign.js');
fs.writeFileSync(path.join(root,'void-runner','save-manifest.json'),JSON.stringify({locations:Object.keys(campaign.stations),missions:campaign.allContracts.map(m=>m.id),chapters:campaign.allContracts.filter(m=>m.chapter).map(m=>m.id)},null,2)+'\n');
