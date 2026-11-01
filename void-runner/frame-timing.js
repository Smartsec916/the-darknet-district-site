/* Presented frame intervals, sampled by the existing game loop (never another render loop). */
(function(root){
 function create({size=90,warmup=3,maxGap=10000}={}){
  const samples=new Float64Array(size);let previous=null,count=0,index=0,total=0,elapsed=0,smoothed=0,interval=0;
  function reset(now=null){previous=now;count=index=total=elapsed=smoothed=interval=0;}
  function sample(now,active=true){
   if(!active||!Number.isFinite(now)){reset();return;}
   if(previous===null){previous=now;return;}
   const ms=now-previous;previous=now;
   if(ms<=0||ms>maxGap){reset(now);return;}
   if(count===size)total-=samples[index];else count++;
   interval=ms;samples[index]=ms;index=(index+1)%size;total+=ms;elapsed+=ms/1000;
   const mean=total/count;smoothed=smoothed?smoothed+(mean-smoothed)*(1-Math.exp(-ms/700)):mean;
  }
  return {sample,reset,get stats(){return {ready:elapsed>=warmup&&count>=15,samples:count,elapsed,interval,ms:smoothed||0,fps:smoothed?1000/smoothed:0};}};
 }
 const api={create};if(typeof module!=='undefined')module.exports=api;else root.VoidFrameTiming=api;
})(globalThis);
