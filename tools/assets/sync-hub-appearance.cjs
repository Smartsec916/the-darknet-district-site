#!/usr/bin/env node
/* The hub deploys from its own folder (rootDir), so it carries byte-identical copies of the appearance rules and catalog. --check compares and writes nothing. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.join(__dirname,'..','..');
const files=['void-runner/character-appearance.js','void-runner/character-catalog.json'];let bad=0;
for(const f of files){const dst=path.join(root,'tools/district-hub/appearance',path.basename(f)),src=fs.readFileSync(path.join(root,f));
 if(process.argv.includes('--check')){if(!fs.existsSync(dst)||Buffer.compare(fs.readFileSync(dst),src)){console.error(f+' copy in the hub is out of date: run node tools/assets/sync-hub-appearance.cjs');bad=1;}}else fs.writeFileSync(dst,src);}
process.exit(bad);
