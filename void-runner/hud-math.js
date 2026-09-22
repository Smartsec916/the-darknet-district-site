(function(root){
 const deg=180/Math.PI,wrap=n=>(n%360+360)%360;
 function read(f,target){
  const v=f.velocity||{x:0,y:0,z:0},range=target?Math.hypot(target.x,target.y,target.z):0,tv=target?.velocity||{x:0,y:0,z:0};
  return {heading:wrap(f.yaw*deg),pitch:-f.pitch*deg,bank:f.roll*deg,speed:Math.hypot(v.x,v.y,v.z),range,closing:range?((v.x-tv.x)*target.x+(v.y-tv.y)*target.y+(v.z-tv.z)*target.z)/range:0};
 }
 function headingOffset(mark,heading){return (mark-heading+540)%360-180;}
 function ladderOffset(pitch,mark,focal){return Math.tan((pitch-mark)/deg)*focal;}
 const api={read,wrap,headingOffset,ladderOffset};root.VoidHudMath=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
