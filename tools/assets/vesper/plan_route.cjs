/* Vesper long road: route planner (docs/development/VESPER_ROAD.md, phase 2). Run: node tools/assets/vesper/plan_route.cjs [targetX]
   Finds a natural line for the road east of the pass over the uncarved land (vesper-world.js baseHeight): A* on a 20 m grid where a step costs its length times
   (1 + steepness penalty) plus a penalty for height above the valley floor, so the road keeps to valleys and winds around the mountains instead of over them.
   Prints control points (about every 160 m) to paste into vesper-world.js CONTROL after the pass. Deterministic; nothing is downloaded. Made by Claude for this project. */
const W=require('../../../void-runner/vesper-world.js');
const G=20,X0=1100,X1=9000,Z0=-4500,Z1=3000,NX=Math.round((X1-X0)/G)+1,NZ=Math.round((Z1-Z0)/G)+1;
const start=[1240,-190],targetX=Number(process.argv[2]||7400);
const H=new Float32Array(NX*NZ);for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++)H[i*NZ+j]=W.baseHeight(X0+i*G,Z0+j*G);
const idx=(i,j)=>i*NZ+j,si=Math.round((start[0]-X0)/G),sj=Math.round((start[1]-Z0)/G);
const cost=new Float64Array(NX*NZ).fill(Infinity),from=new Int32Array(NX*NZ).fill(-1);
// binary heap
const heap=[];const push=(c,k)=>{heap.push([c,k]);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
const pop=()=>{const t=heap[0],l=heap.pop();if(heap.length){heap[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<heap.length&&heap[a][0]<heap[m][0])m=a;if(b<heap.length&&heap[b][0]<heap[m][0])m=b;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return t;};
cost[idx(si,sj)]=0;push(0,idx(si,sj));let goal=-1;
const D=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1],[2,1],[1,2],[2,-1],[1,-2],[-2,1],[-1,2],[-2,-1],[-1,-2]];
while(heap.length){const [c,k]=pop();if(c>cost[k])continue;const i=Math.floor(k/NZ),j=k%NZ;if(X0+i*G>=targetX){goal=k;break;}
 for(const [di,dj] of D){const a=i+di,b=j+dj;if(a<0||b<0||a>=NX||b>=NZ)continue;if(di<0&&X0+a*G<start[0]+200)continue;
  const kk=idx(a,b),len=Math.hypot(di,dj)*G,gr=Math.abs(H[kk]-H[k])/len,h=H[kk];
  const step=len*(1+Math.pow(gr/.06,2)*3+h*.012)+(di<0?len*.6:0);
  if(c+step<cost[kk]){cost[kk]=c+step;from[kk]=k;push(c+step,kk);}}}
if(goal<0)throw Error('no route');
const path=[];for(let k=goal;k>=0;k=from[k])path.push([X0+Math.floor(k/NZ)*G,Z0+(k%NZ)*G]);path.reverse();
// smooth (moving average) and resample about every 160 m
const sm=path.map((p,i)=>{let x=0,z=0,n=0;for(let k=Math.max(0,i-6);k<=Math.min(path.length-1,i+6);k++){x+=path[k][0];z+=path[k][1];n++;}return [x/n,z/n];});
const out=[];let acc=0;out.push(sm[0]);for(let i=1;i<sm.length;i++){acc+=Math.hypot(sm[i][0]-sm[i-1][0],sm[i][1]-sm[i-1][1]);if(acc>=160){out.push(sm[i]);acc=0;}}out.push(sm[sm.length-1]);
let len=0;for(let i=1;i<out.length;i++)len+=Math.hypot(out[i][0]-out[i-1][0],out[i][1]-out[i-1][1]);
console.log(JSON.stringify(out.map(p=>[Math.round(p[0]),Math.round(p[1])])));console.error('points',out.length,'length m',Math.round(len),'max h',Math.max(...path.map(p=>W.baseHeight(...p))).toFixed(0));
