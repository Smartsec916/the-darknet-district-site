'use strict';
// Street sight (void-runner/street-sight.js): which street people the camera can see past the city blocks. Pure rule only; the browser side is checked by hand.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const S=require('../void-runner/street-sight.js'),N=require('../void-runner/neochinatown.js'),L=require('../void-runner/ncz-nightlife.js'),A=require('../void-runner/ncz-alley.js');
const R=S.open(),eye=(x,z,y=1.7)=>({x,y,z}),at=(x,z)=>({x,z});

test('the sight rectangles are the streets plus NULL, and cover every place street people stand',()=>{
 assert.equal(R.length,Object.keys(N.streets).length+(N.footprints.club?1:0));
 for(const l of L.lanes)for(const p of [l.a,l.b])assert.ok(S.within(R,p[0],p[1]),l.id);
 for(const p of A.PEOPLE)assert.ok(S.within(R,p.x,p.z),p.id);
 for(const [x,z] of L.standing)assert.ok(S.within(R,x,z));
 // The District, the terrace and Milked are solid from outside.
 assert.ok(!S.within(R,126,-90,S.config.margin));assert.ok(!S.within(R,88,-105,S.config.margin));assert.ok(!S.within(R,96,-75,S.config.margin));   // (20 Nov 2026: 88,-82 is the back alleys' yard north of the terrace now)

});

test('a line of sight must stay inside the streets from end to end',()=>{
 assert.ok(S.clear(R,61,-112,61,-30));                 // straight up Main Street
 assert.ok(S.clear(R,124,-58.5,60,-58.5));             // down the alley and out onto Main Street
 assert.ok(!S.clear(R,124,-58.5,61,-100));             // from the alley to Main Street's south end: through a block
 assert.ok(!S.clear(R,124,-58.5,100,-12.5));           // from the alley to the avenue
 assert.ok(!S.clear(R,31,-96,61,-96));                 // from the pad to Main Street: the block between the passage and the street
 assert.ok(S.clear(R,61,-12.5,140,-12.5));             // along the avenue
 // Both ends inside a street is not enough.
 assert.ok(S.within(R,100,-58.5)&&S.within(R,100,-12.5)&&!S.clear(R,100,-58.5,100,-12.5));
 // A degenerate (zero length) segment inside a street is clear, outside it is not.
 assert.ok(S.clear(R,61,-60,61,-60));assert.ok(!S.clear(R,96,-75,96,-75));
});

test('the measured case: from the District door only the alley and the strip of Main Street at its mouth are in sight',()=>{
 const door=eye(124,-58.5);
 for(const p of A.PEOPLE)assert.ok(S.sees(R,door,at(p.x,p.z)),p.id);
 assert.ok(S.sees(R,door,at(69.4,-58)));assert.ok(S.sees(R,door,at(52.6,-59)));
 for(const z of [-121,-100,-80,-40,-22])for(const x of [52.6,69.4])assert.ok(!S.sees(R,door,at(x,z)),x+','+z);
 for(const x of [10,40,98,140])for(const z of [-6.6,-18.4])assert.ok(!S.sees(R,door,at(x,z)),x+','+z);
 // Every walker and stander the game can plan is either seen or not, never an error, and most of Medium's crowd is out of sight from here.
 const plan=L.plan('medium',(()=>{let s=7;return ()=>((s=s*16807%2147483647)-1)/2147483646;})());
 const spots=plan.map(p=>p.fixed?[p.x,p.z]:L.at(L.lanes.find(l=>l.id===p.lane),p.t,p.side)),seen=spots.filter(([x,z])=>S.sees(R,door,at(x,z))).length;
 assert.ok(spots.length>=40);assert.ok(seen<spots.length*.25,seen+' of '+spots.length);
});

test('it errs on the side of showing people',()=>{
 const c=S.config;
 // close by, through anything
 assert.ok(S.sees(R,eye(124,-58.5),at(124,-58.5-c.near+.5)));
 // people are shown before the corner uncovers them: a walker just round the alley mouth, seen from Main Street's pavement
 assert.ok(!S.clear(R,69.4,-80,74,-56.5));assert.ok(S.sees(R,eye(69.4,-80),at(72.3,-56.5)));
 // the widening is bounded: well round the corner is hidden
 assert.ok(!S.sees(R,eye(69.4,-80),at(95,-58.5)));
 // a camera in the air (a cab), a camera that is not in a street (the vestibule, a lobby), a person who is not in a street
 assert.ok(S.sees(R,eye(124,-58.5,12),at(61,-100)));assert.ok(S.sees(R,eye(126.9,-66),at(61,-100)));assert.ok(S.sees(R,eye(124,-58.5),at(126,-90)));
 // switched off: everyone
 assert.ok(S.sees(R,eye(124,-58.5),at(61,-100),{...c,enabled:false}));
 // symmetric: if A cannot see B, B cannot see A
 for(const [a,b] of [[[124,-58.5],[61,-100]],[[31,-96],[61,-40]],[[61,-112],[120,-12.5]]]){assert.equal(S.sees(R,eye(...a),at(...b)),false);assert.equal(S.sees(R,eye(...b),at(...a)),false);}
});

test('hysteresis: shown at once, hidden only after a moment out of sight',()=>{
 const s={hidden:false,lost:0},c=S.config;
 assert.equal(S.track(s,false,c.hideAfter*.5),false);assert.equal(S.track(s,true,.016),false);assert.equal(s.lost,0);   // a glimpse resets the wait
 assert.equal(S.track(s,false,c.hideAfter*.6),false);assert.equal(S.track(s,false,c.hideAfter*.6),true);
 assert.equal(S.track(s,false,1),true);assert.equal(S.track(s,true,0),false);   // back the same frame they are seen
});

test('distance: animation every 2nd then 3rd frame, face pieces dropped far away without blinking at the line',()=>{
 const c=S.config;assert.equal(S.rate(5),1);assert.equal(S.rate(c.anim[0][0]+1),2);assert.equal(S.rate(c.anim[1][0]+1),3);
 assert.ok(c.detail[0]<c.detail[1]);assert.equal(S.dropDetail(false,c.detail[1]-1),false);assert.equal(S.dropDetail(false,c.detail[1]+1),true);
 assert.equal(S.dropDetail(true,c.detail[1]-1),true);assert.equal(S.dropDetail(true,c.detail[0]-1),false);
 for(const n of ['ncz_neon.eyebrow001','fixer_01.eyelashes01','runner_02.low-poly'])assert.ok(c.detailParts.test(n),n);
 for(const n of ['ncz_neon.body','fixer_01.shades0','runner_02.bob01','outlaw_01.mask0','street-gear:x','ncz_neon.shoes05'])assert.ok(!c.detailParts.test(n),n);
});

test('only the street\'s own ambient people are ever touched',()=>{
 assert.ok(S.ambient({nightlife:'night-3'}));assert.ok(S.ambient({alley:'alley-drunk'}));assert.ok(S.ambient({club:'dancer-0'}));assert.ok(S.ambient({ambient:true,character:'crew-ncz2'}));
 assert.ok(!S.ambient(null));assert.ok(!S.ambient({}));assert.ok(!S.ambient({crowd:'ncz-neon'}));assert.ok(!S.ambient({character:'rin'}));assert.ok(!S.ambient({ambient:true,character:'admin'}));
});

test('wiring: started for the street only, ticked and disposed; the controller has the two switches; the page loads it after the city',()=>{
 const n=fs.readFileSync('void-runner/neochinatown.js','utf8'),c=fs.readFileSync('void-runner/crowd.js','utf8'),h=fs.readFileSync('void-runner.html','utf8');
 assert.ok(n.includes("area==='street'&&root.VoidStreetSight?root.VoidStreetSight.start({scene}):null"));assert.ok(n.includes('sight?.tick();'));assert.ok(n.includes('sight?.dispose();'));
 for(const k of ['function setCulled(','function lod(','figures:()=>controllers'])assert.ok(c.includes(k),k);
 assert.ok(h.indexOf('void-runner/street-sight.js')>h.indexOf('void-runner/neochinatown.js')&&h.indexOf('void-runner/street-sight.js')<h.indexOf('void-runner/babylon-renderer.js'));
 // never by switching a figure off (the camera app, footsteps and the owners read isEnabled)
 assert.ok(!/setEnabled\(/.test(fs.readFileSync('void-runner/street-sight.js','utf8').split("if(typeof module==='object'")[1]));
});

// crowd.js animation controller against stand-in clips: the two switches and the every-nth-frame mode.
function figure(names=['idle','walk']){
 const log=[],groups=names.map(n=>{const g={name:'crowd:ncz-neon-'+n,from:0,to:30,loopAnimation:true,isStarted:false,paused:false,frame:0,targetedAnimations:[{animation:{framePerSecond:30}}],onAnimationGroupEndObservable:{addOnce(){}},
   get animatables(){return [{get masterFrame(){return g.frame;}}];},
   start(loop){g.isStarted=true;g.paused=false;g.loopAnimation=loop;log.push('start:'+n);},stop(){g.isStarted=false;},pause(){g.paused=true;log.push('pause:'+n);},play(){g.paused=false;log.push('play:'+n);},goToFrame(f){g.frame=f;log.push('goto:'+n+':'+f.toFixed(2));}};return g;});
 const node={name:'fig',metadata:{animationGroups:groups},getDescendants:()=>[],onDisposeObservable:{addOnce(){}}};return {node,groups,log};
}
test('controller: a figure animates only while its owner wants it AND it is not culled',()=>{
 const C=require('../void-runner/crowd.js'),{node,groups,log}=figure(),c=C.animate(node,'ncz-neon','walk'),walk=groups[1];
 assert.equal(c.node,node);assert.ok([...C.figures()].includes(c));assert.equal(walk.paused,false);
 c.setCulled(true);assert.equal(walk.paused,true);assert.equal(c.culled,true);
 c.setActive(false);c.setCulled(false);assert.equal(walk.paused,true,'still off: the owner paused it');
 c.setActive(true);assert.equal(walk.paused,false);
 c.setCulled(true);const n=log.length;c.setCulled(true);assert.equal(log.length,n,'no repeat work');
 c.play('idle');assert.equal(groups[0].paused,true,'a clip chosen while culled starts paused');c.setCulled(false);assert.equal(groups[0].paused,false);
 c.dispose();assert.ok(![...C.figures()].includes(c));
});
test('controller: far away the loop is held and moved on by hand every nth frame, at the same speed, and handed back cleanly',()=>{
 const C=require('../void-runner/crowd.js'),{node,groups,log}=figure(),c=C.animate(node,'ncz-neon','walk'),walk=groups[1];
 walk.frame=10;log.length=0;const speed=.9+(((h=>{let x=7;for(const ch of h)x=(x*31+ch.charCodeAt(0))>>>0;return x;})('fig'))%20)/100;
 for(let i=0;i<9;i++)c.lod(3,1/60);
 assert.equal(c.held,true);assert.equal(walk.paused,true);const gotos=log.filter(l=>l.startsWith('goto:'));assert.equal(gotos.length,3,'9 frames, 3 updates');
 assert.ok(Math.abs(walk.frame-(10+9/60*30*speed))<.2+3/60*30*speed,'same speed as before: '+walk.frame);
 // wraps round the loop
 for(let i=0;i<300;i++)c.lod(2,1/60);assert.ok(walk.frame>=0&&walk.frame<30);
 // back to every frame
 c.lod(1,1/60);assert.equal(c.held,false);assert.equal(walk.paused,false);
 // a new clip, a cull or a one-off move ends the hold
 c.lod(3,.016);assert.equal(c.held,true);c.play('idle');assert.equal(c.held,false);
 c.lod(3,.016);assert.equal(c.held,true);c.setCulled(true);assert.equal(c.held,false);c.lod(3,.016);assert.equal(c.held,false,'nothing is moved while culled');c.setCulled(false);assert.equal(groups[0].paused,false);
 c.dispose();
});
