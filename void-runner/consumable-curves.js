/* Local controls for a single track. Coordinates are fractions of its duration and intensity. */
(function(root){
 'use strict';
 function editor(track,update,labels={}){
  const host=document.createElement('section');
  host.className='cs-curve';
  host.innerHTML='<label>Interpolation <select data-mode><option>linear</option><option>smooth</option><option>step</option></select></label> <label>Graph zoom <select data-zoom><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label><div class="cs-scroll"><svg viewBox="0 0 600 100" preserveAspectRatio="none" aria-label="Intensity curve"></svg></div><label>Point <select data-index></select></label> <label>Time (s) <input type="number" data-x step="any"></label> <label>Level (%) <input type="number" data-y min="0" max="100" step="any"></label><div><button data-insert>Add point</button><button data-remove>Remove point</button><button data-undo>Undo curve edit</button><button data-redo>Redo curve edit</button><button data-reset>Reset curve</button></div>';
  const q=s=>host.querySelector(s),svg=q('svg'),ns=svg.namespaceURI,undo=[],redo=[];
  if(labels.x)q('[data-x]').parentElement.firstChild.textContent=labels.x+' ';
  if(labels.y)q('[data-y]').parentElement.firstChild.textContent=labels.y+' ';
  if(labels.name)svg.setAttribute('aria-label',labels.name);
  let index=0,drag=null;
  const flat=()=>({mode:'linear',points:labels.descending?[[0,1],[1,0]]:[[0,1],[1,1]]});
  const curve=()=>track.curve||flat();
  const snapshot=()=>JSON.stringify(track.curve||null);
  function remember(){undo.push(snapshot());if(undo.length>80)undo.shift();redo.length=0;}
  function restore(from,to){if(!from.length)return;to.push(snapshot());const value=JSON.parse(from.pop());if(value)track.curve=value;else delete track.curve;draw();update();}
  function setPoint(x,y){
   const c=track.curve??=flat(),points=c.points;
   const gap=index>0&&index<points.length-1?Math.min(.00001,(points[index+1][0]-points[index-1][0])/3):0;
   if(index>0&&index<points.length-1)x=Math.max(points[index-1][0]+gap,Math.min(points[index+1][0]-gap,x));else x=index?1:0;
   points[index]=[x,Math.min(1,Math.max(0,y))];draw();update();
  }
  function shape(tag,attrs){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);svg.append(n);return n;}
  const px=x=>6+588*x,py=y=>94-88*y;
  function draw(){
   const c=curve(),points=c.points;index=Math.min(index,points.length-1);svg.replaceChildren();
   let path='M '+px(points[0][0])+' '+py(points[0][1]);
   for(let i=1;i<points.length;i++){const [x,y]=points[i],[a,b]=points[i-1];
    if(c.mode==='step')path+=' H '+px(x)+' V '+py(y);
    else if(c.mode==='smooth')path+=' C '+px(a+(x-a)/3)+' '+py(b)+' '+px(x-(x-a)/3)+' '+py(y)+' '+px(x)+' '+py(y);
    else path+=' L '+px(x)+' '+py(y);
   }
   shape('path',{d:path,fill:'none',stroke:'currentColor','stroke-width':2});
   points.forEach(([x,y],i)=>shape('circle',{cx:px(x),cy:py(y),r:i===index?5:4,fill:i===index?'white':'currentColor','data-point':i}));
   q('[data-index]').replaceChildren(...points.map((_,i)=>new Option(String(i+1),String(i))));
   q('[data-index]').value=String(index);q('[data-mode]').value=c.mode;
   q('[data-x]').value=Number((points[index][0]*track.duration).toFixed(4));q('[data-x]').disabled=index===0||index===points.length-1;
   q('[data-y]').value=Number((points[index][1]*100).toFixed(3));
   q('[data-remove]').disabled=q('[data-x]').disabled;q('[data-insert]').disabled=points.length>=32;
   q('[data-undo]').disabled=!undo.length;q('[data-redo]').disabled=!redo.length;
  }
  q('[data-index]').onchange=e=>{index=+e.target.value;draw();};
  q('[data-mode]').onchange=e=>{remember();(track.curve??=flat()).mode=e.target.value;draw();update();};
  q('[data-zoom]').onchange=e=>svg.style.width=(100*Number(e.target.value))+'%';
  q('[data-insert]').onclick=()=>{remember();const points=(track.curve??=flat()).points;index=Math.min(index,points.length-2)+1;
   const a=points[index-1],b=points[index];points.splice(index,0,[(a[0]+b[0])/2,(a[1]+b[1])/2]);draw();update();};
  q('[data-remove]').onclick=()=>{remember();track.curve.points.splice(index,1);draw();update();};
  q('[data-reset]').onclick=()=>{remember();delete track.curve;draw();update();};
  q('[data-undo]').onclick=()=>restore(undo,redo);q('[data-redo]').onclick=()=>restore(redo,undo);
  for(const selector of ['[data-x]','[data-y]'])q(selector).onchange=()=>{
   const x=q('[data-x]').valueAsNumber,y=q('[data-y]').valueAsNumber;if(!Number.isFinite(x)||!Number.isFinite(y)){draw();return;}remember();setPoint(x/track.duration,y/100);
  };
  svg.onpointerdown=e=>{if(!e.target.hasAttribute('data-point'))return;index=+e.target.dataset.point;remember();drag=e.pointerId;svg.setPointerCapture(drag);draw();};
  svg.onpointermove=e=>{if(e.pointerId!==drag)return;const rect=svg.getBoundingClientRect();setPoint((((e.clientX-rect.left)/rect.width)*600-6)/588,(94-100*(e.clientY-rect.top)/rect.height)/88);};
  svg.onlostpointercapture=()=>{drag=null;};draw();host.refresh=draw;return host;
 }
 root.VoidConsumableCurves={editor};
})(globalThis);
