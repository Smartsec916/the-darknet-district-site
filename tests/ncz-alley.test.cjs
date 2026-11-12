/* The people who stay in the alley by the District: where they stand, what they do, and that nobody is ever in the way. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../void-runner/ncz-alley.js'),N=require('../void-runner/neochinatown.js'),E=require('../void-runner/exploration-controller.js'),D=require('../void-runner/district-area.js'),C=require('../void-runner/crowd.js');
const clipsOf=l=>C.clips[l]||['idle'],street=N.layout('street');
test('the alley in this file is the layout\'s alley, and the door is the District door',()=>{
 assert.deepEqual([A.ALLEY.x0,A.ALLEY.x1,A.ALLEY.south,A.ALLEY.north],N.streets.alley);assert.deepEqual(A.DOOR,[N.door.x,N.door.z]);
});
test('everyone stands on open ground against a wall or on the crates: out of the walking lane, away from the District door and the vestibule',()=>{
 for(const p of A.PEOPLE){assert(A.outOfTheWay(p),p.id+' is out of the way');assert(!E.blocked(p.x,p.z,street)||p.sits,p.id+' is not inside a wall');
  assert(Math.hypot(p.x-A.DOOR[0],p.z-A.DOOR[1])>4.5,p.id+' is clear of the door');assert(!D.inVestibule(N,{x:p.x,z:p.z}),p.id+' is not in the vestibule');
  assert(Math.abs(p.z-A.LANE.z)>A.LANE.half,p.id+' leaves the lane free');}
 for(const a of A.PEOPLE)for(const b of A.PEOPLE)if(a!==b)assert(Math.hypot(a.x-b.x,a.z-b.z)>.9,a.id+' and '+b.id+' do not stand inside each other');
});
test('more people on higher settings; each has a look that can do what they are doing, and neighbours differ',()=>{
 const n=q=>A.plan(q,clipsOf).length;assert(n('low')<n('medium')&&n('medium')<n('high'));assert.equal(n('high'),A.PEOPLE.length);assert(n('low')>=3);
 const high=A.plan('high',clipsOf);for(const p of high){assert(A.CAST.includes(p.look));assert(clipsOf(p.look).includes(p.clip),p.id+': '+p.look+' can '+p.clip);assert(p.clips.includes(p.clip));}
 for(let i=1;i<high.length;i++)assert.notEqual(high[i].look,high[i-1].look,'two people next to each other never wear the same look');
 const doing=new Set(high.map(p=>p.clip));for(const c of ['talk','smoke','sit','watch'])assert(doing.has(c),'someone is doing: '+c);assert(doing.size>=5,'varied, not a row of people standing still');
 assert(high.some(p=>p.watchesDoor),'someone watches the District door');
});
test('a look that cannot do anything special still gets a person who simply stands',()=>{
 const p=A.plan('high',()=>['idle']);assert.equal(p.length,A.PEOPLE.length);assert(p.every(x=>x.clip==='idle'));
});
test('they are ordinary street people: crowd looks only, no mission characters or companions, no collision added',()=>{
 const src=fs.readFileSync('void-runner/ncz-alley.js','utf8');for(const look of A.CAST)assert(C.clips[look],look+' is a crowd look');
 assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,''),/solids\.push|interactions\.push|mission|companion/i);
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(f,'utf8');assert.match(h,/<script type="text\/tdd-game" src="void-runner\/ncz-alley\.js">/);assert(h.indexOf('ncz-alley.js')<h.indexOf('void-runner/neochinatown.js'));}
});
