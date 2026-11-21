/* Writes the owner's review sheet of every named place (docs/development/LOCATION_NAMES.md) from void-runner/places.js, and, with --json <file>, the shapes the
   picture map is drawn from (docs/development/location-names-map.png). Numbers follow the order of places.js, so the sheet and the map agree.
   Usage: node tools/location-names.cjs [--json out.json] */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const P=require('../void-runner/places.js');
const LEVEL=Object.fromEntries(P.LEVELS.map(l=>[l.id,l.name]));
const rows=P.NODES.map((n,i)=>({no:i+1,n}));
const cell=s=>String(s??'').replace(/\|/g,'\\|').replace(/\n/g,' ');
const total=rows.length,proposed=rows.filter(r=>r.n.proposed).length,existing=total-proposed;
const groups=[['The system, the planet and the city',r=>['system','planet','city'].includes(r.n.level)],['Areas',r=>r.n.level==='area'],
 ...P.NODES.filter(n=>n.level==='area').map(a=>[a.name,r=>!['system','planet','city','area'].includes(r.n.level)&&P.within(r.n.id,a.id)])];
let md='# Location names: review sheet for the owner\n\n'
 +'The owner (18 Nov 2026): *"every location needs a name whether it\'s just an area, venue, etc"*, and a trigger\'s place is picked as **System › Planet › City › Area › Exact location**. '
 +'This sheet lists every named place in the game today, one row each. Generated from `void-runner/places.js` by `node tools/location-names.cjs` (rerun after a change).\n\n'
 +'- **'+total+' places**: **'+existing+'** use a name the game already has (signs, menus, the map, the game\'s own data: the "Source" column says where), and **'+proposed+'** have a short **PROPOSED** working name because the game does not name that spot. Nothing PROPOSED is canon.\n'
 +'- **Your name:** write the name you want in the last column (or "keep"). Only the name changes; the ID number and the internal id stay, so missions keep working.\n'
 +'- **Planet:** the game shows "NeoChinatown" for the planet as well as the city (internal id `earth`). The planet\'s own name is not settled: it is row 2, PROPOSED.\n'
 +'- **Venue** is a building with rooms (The Darknet District, NULL, Milked). An exact location can hold smaller ones (a shopfront or a taxi stop on a stretch of street): the smallest one you stand in is what a photo\'s LOCATION shows.\n'
 +'- **Shopfronts** are the neon shop signs on the street walls, named by the sign\'s own words (several signs repeat, so the street name tells them apart). They are facades: no shop interiors exist yet.\n'
 +'- **The map:** [`location-names-map.png`](location-names-map.png) shows the city from above with each area and exact location labelled by the number in the first column (the separate scenes, the Corporate District, the Temple and the VR rooms, are listed here only).\n'
 +'- A photo\'s METADATA shows the chain most specific first, e.g. "The Bar · The Darknet District · Old Town · NeoChinatown · Tessaly System".\n\n';
const seen=new Set();
for(const [title,f] of groups){const list=rows.filter(r=>!seen.has(r.no)&&f(r));if(!list.length)continue;list.forEach(r=>seen.add(r.no));
 md+='## '+title+'\n\n| # | Level | Full hierarchy | Existing name / PROPOSED working name | Source | Where it is | Owner\'s name |\n|---|---|---|---|---|---|---|\n';
 for(const {no,n} of list)md+='| '+no+' | '+LEVEL[n.level]+(n.group?' (group)':'')+' | '+cell(P.label(n.id))+' | '+(n.proposed?'**PROPOSED:** ':'')+cell(n.name)+' | '+cell(n.proposed?(n.src||'—'):n.src)+' | '+cell(n.where||n.note||'')+' |  |\n';
 md+='\n';}
const left=rows.filter(r=>!seen.has(r.no));if(left.length)throw new Error('rows not in a group: '+left.map(r=>r.n.id));
md+='## For Claude and Codex\n\n`void-runner/places.js` is the registry (`NODES`, `chain()`, `deepest()`, `options()`), tested by `tests/places-names.test.cjs` (a 1 m grid over every walkable area resolves to a named exact location). '
 +'When the owner fills in a name, change `name` (and drop `proposed`) in places.js; never change an `id`. Then rerun this tool and the map script.\n';
fs.writeFileSync(path.resolve(__dirname,'../docs/development/LOCATION_NAMES.md'),md);
const j=process.argv.indexOf('--json');
if(j>0)fs.writeFileSync(process.argv[j+1],JSON.stringify(rows.filter(r=>r.n.scene==='neochinatown'&&r.n.rects&&r.n.rects.length&&!r.n.whole).map(r=>({no:r.no,id:r.n.id,level:r.n.level,name:r.n.name,proposed:!!r.n.proposed,shop:!!r.n.shop,fallback:!!r.n.fallback,depth:P.parents(r.n.id).length,rects:r.n.rects}))));
console.log(total+' places: '+existing+' existing names, '+proposed+' PROPOSED');
