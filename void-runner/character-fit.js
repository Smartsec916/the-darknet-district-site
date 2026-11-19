/* Re-fitting a hairstyle from the body it was made for onto another body that shares the same 52-joint skeleton. PURE: arrays in, arrays out, no engine.
   Why this is needed: MakeHuman hair is fitted to ONE body when a character is built, so its vertices live in that body's bind pose. The 22 shipped characters
   share joint names and order but not proportions (each is a different MakeHuman build). The hair is skinned to the head joints, so moving each vertex from the
   source body's head-joint frame to the target's, and scaling it by the head-size ratio about the joint, places it on the target's head. How good the fit is
   depends on how similar the two heads are; `fitMismatch` measures that and the catalog only offers pairs under the limit (a fit gate, never a promise).
   Matrices are glTF column-major 4x4 arrays (translation in elements 12 to 14).                                                                                  */
(function(root){
 'use strict';
 const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
 function mul(a,b){const o=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}
 function inv(m){
  const a=m,o=new Array(16),
   s0=a[0]*a[5]-a[4]*a[1],s1=a[0]*a[6]-a[4]*a[2],s2=a[0]*a[7]-a[4]*a[3],s3=a[1]*a[6]-a[5]*a[2],s4=a[1]*a[7]-a[5]*a[3],s5=a[2]*a[7]-a[6]*a[3],
   c5=a[10]*a[15]-a[14]*a[11],c4=a[9]*a[15]-a[13]*a[11],c3=a[9]*a[14]-a[13]*a[10],c2=a[8]*a[15]-a[12]*a[11],c1=a[8]*a[14]-a[12]*a[10],c0=a[8]*a[13]-a[12]*a[9];
  const det=s0*c5-s1*c4+s2*c3+s3*c2-s4*c1+s5*c0;if(!det||!isFinite(det))throw new Error('matrix is not invertible');const d=1/det;
  o[0]=(a[5]*c5-a[6]*c4+a[7]*c3)*d;o[1]=(-a[1]*c5+a[2]*c4-a[3]*c3)*d;o[2]=(a[13]*s5-a[14]*s4+a[15]*s3)*d;o[3]=(-a[9]*s5+a[10]*s4-a[11]*s3)*d;
  o[4]=(-a[4]*c5+a[6]*c2-a[7]*c1)*d;o[5]=(a[0]*c5-a[2]*c2+a[3]*c1)*d;o[6]=(-a[12]*s5+a[14]*s2-a[15]*s1)*d;o[7]=(a[8]*s5-a[10]*s2+a[11]*s1)*d;
  o[8]=(a[4]*c4-a[5]*c2+a[7]*c0)*d;o[9]=(-a[0]*c4+a[1]*c2-a[3]*c0)*d;o[10]=(a[12]*s4-a[13]*s2+a[15]*s0)*d;o[11]=(-a[8]*s4+a[9]*s2-a[11]*s0)*d;
  o[12]=(-a[4]*c3+a[5]*c1-a[6]*c0)*d;o[13]=(a[0]*c3-a[1]*c1+a[2]*c0)*d;o[14]=(-a[12]*s3+a[13]*s1-a[14]*s0)*d;o[15]=(a[8]*s3-a[9]*s1+a[10]*s0)*d;
  return o;
 }
 const point=(m,x,y,z)=>[m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]];
 const vector=(m,x,y,z)=>[m[0]*x+m[4]*y+m[8]*z,m[1]*x+m[5]*y+m[9]*z,m[2]*x+m[6]*y+m[10]*z];

 /* Head size of a body as three numbers (bone-local bounding box of the vertices bound to the head joint). Returns the uniform scale that makes a head of size A
    match B and how far the shape still differs afterwards (0 = same shape). */
 function headFit(dimsA,dimsB){
  const r=dimsB.map((v,i)=>v/dimsA[i]),s=Math.cbrt(r[0]*r[1]*r[2]);
  return {scale:s,mismatch:Math.max(...r.map(x=>Math.abs(x/s-1)))};
 }
 const FIT_LIMIT=0.06;   // a hairstyle is offered on a body only if the heads differ by less than 6% in shape after scaling

 /* Re-fit vertices. `mesh`: {positions:[x,y,z...], normals:[...], joints:[4 per vertex, joint indices], weights:[4 per vertex]}.
    `src` and `dst`: {jointIndex: inverse-bind matrix (16 numbers)} for every joint the mesh uses. Returns new {positions, normals}. */
 function refit(mesh,src,dst,scale=1){
  const n=mesh.positions.length/3,P=new Array(n*3),N=mesh.normals?new Array(n*3):null,T={};
  const matrix=j=>T[j]||(T[j]=(()=>{if(!src[j]||!dst[j])throw new Error('joint '+j+' has no bind matrix');return {a:src[j],bw:inv(dst[j])};})());
  for(let k=0;k<n;k++){
   const x=mesh.positions[k*3],y=mesh.positions[k*3+1],z=mesh.positions[k*3+2],nx=N?mesh.normals[k*3]:0,ny=N?mesh.normals[k*3+1]:0,nz=N?mesh.normals[k*3+2]:0;
   let px=0,py=0,pz=0,qx=0,qy=0,qz=0,wsum=0;
   for(let c=0;c<4;c++){
    const w=mesh.weights[k*4+c];if(!(w>0))continue;const t=matrix(mesh.joints[k*4+c]);wsum+=w;
    const l=point(t.a,x,y,z),p=point(t.bw,l[0]*scale,l[1]*scale,l[2]*scale);px+=w*p[0];py+=w*p[1];pz+=w*p[2];
    if(N){const ln=vector(t.a,nx,ny,nz),q=vector(t.bw,ln[0],ln[1],ln[2]);qx+=w*q[0];qy+=w*q[1];qz+=w*q[2];}
   }
   if(!(wsum>0)){P[k*3]=x;P[k*3+1]=y;P[k*3+2]=z;if(N){N[k*3]=nx;N[k*3+1]=ny;N[k*3+2]=nz;}continue;}
   P[k*3]=px/wsum;P[k*3+1]=py/wsum;P[k*3+2]=pz/wsum;
   if(N){const l=Math.hypot(qx,qy,qz)||1;N[k*3]=qx/l;N[k*3+1]=qy/l;N[k*3+2]=qz/l;}
  }
  return {positions:P,normals:N};
 }
 const api={I,mul,inv,point,vector,headFit,FIT_LIMIT,refit};
 if(typeof module!=='undefined')module.exports=api;else root.VoidCharacterFit=api;
})(typeof globalThis!=='undefined'?globalThis:this);
