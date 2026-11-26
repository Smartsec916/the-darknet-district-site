var Zu=0,jc=1,$u=2;var jr=1,Ju=2,Xs=3,pi=0,rn=1,Ze=2,ei=0,ss=1,cs=2,Qc=3,th=4,Ku=5;var Pi=100,ju=101,Qu=102,td=103,ed=104,nd=200,id=201,sd=202,rd=203,no=204,io=205,ad=206,od=207,ld=208,cd=209,hd=210,ud=211,dd=212,fd=213,pd=214,so=0,ro=1,ao=2,rs=3,oo=4,lo=5,co=6,ho=7,zo=0,md=1,gd=2,zn=0,eh=1,nh=2,ih=3,sh=4,rh=5,ah=6,oh=7;var lh=300,zi=301,hs=302,ko=303,Ho=304,Qr=306,Li=1e3,Zn=1001,uo=1002,Qe=1003,xd=1004;var ta=1005;var nn=1006,Go=1007;var ki=1008;var vn=1009,ch=1010,hh=1011,qs=1012,Vo=1013,kn=1014,In=1015,ni=1016,Wo=1017,Xo=1018,Ys=1020,uh=35902,dh=35899,fh=1021,ph=1022,Pn=1023,$n=1026,Hi=1027,qo=1028,Yo=1029,Gi=1030,Zo=1031;var $o=1033,ea=33776,na=33777,ia=33778,sa=33779,Jo=35840,Ko=35841,jo=35842,Qo=35843,tl=36196,el=37492,nl=37496,il=37488,sl=37489,ra=37490,rl=37491,al=37808,ol=37809,ll=37810,cl=37811,hl=37812,ul=37813,dl=37814,fl=37815,pl=37816,ml=37817,gl=37818,xl=37819,vl=37820,_l=37821,yl=36492,bl=36494,Ml=36495,El=36283,Sl=36284,aa=36285,wl=36286;var Tr=2300,fo=2301,eo=2302,Gc=2303,Vc=2400,Wc=2401,Xc=2402;var vd=3200;var Tl=0,_d=1,vi="",Re="srgb",Ar="srgb-linear",Rr="linear",pe="srgb";var ns=7680;var qc=519,yd=512,bd=513,Md=514,Al=515,Ed=516,Sd=517,Rl=518,wd=519,po=35044;var mh="300 es",On=2e3,Os=2001;function Yf(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Zf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Cr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Td(){let i=Cr("canvas");return i.style.display="block",i}var _u={},zs=null;function Ir(...i){let t="THREE."+i.shift();zs?zs("log",t,...i):console.log(t,...i)}function Ad(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Nt(...i){i=Ad(i);let t="THREE."+i.shift();if(zs)zs("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Bt(...i){i=Ad(i);let t="THREE."+i.shift();if(zs)zs("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function is(...i){let t=i.join(" ");t in _u||(_u[t]=!0,Nt(...i))}function Rd(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var Cd={[so]:ro,[ao]:co,[oo]:ho,[rs]:lo,[ro]:so,[co]:ao,[ho]:oo,[lo]:rs},Jn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},ln=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],yu=1234567,Sr=Math.PI/180,as=180/Math.PI;function di(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(ln[i&255]+ln[i>>8&255]+ln[i>>16&255]+ln[i>>24&255]+"-"+ln[t&255]+ln[t>>8&255]+"-"+ln[t>>16&15|64]+ln[t>>24&255]+"-"+ln[e&63|128]+ln[e>>8&255]+"-"+ln[e>>16&255]+ln[e>>24&255]+ln[n&255]+ln[n>>8&255]+ln[n>>16&255]+ln[n>>24&255]).toLowerCase()}function se(i,t,e){return Math.max(t,Math.min(e,i))}function gh(i,t){return(i%t+t)%t}function $f(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Jf(i,t,e){return i!==t?(e-i)/(t-i):0}function wr(i,t,e){return(1-e)*i+e*t}function Kf(i,t,e,n){return wr(i,t,1-Math.exp(-e*n))}function jf(i,t=1){return t-Math.abs(gh(i,t*2)-t)}function Qf(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function tp(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function ep(i,t){return i+Math.floor(Math.random()*(t-i+1))}function np(i,t){return i+Math.random()*(t-i)}function ip(i){return i*(.5-Math.random())}function sp(i){i!==void 0&&(yu=i);let t=yu+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function rp(i){return i*Sr}function ap(i){return i*as}function op(i){return(i&i-1)===0&&i!==0}function lp(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function cp(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function hp(i,t,e,n,s){let r=Math.cos,a=Math.sin,o=r(e/2),c=a(e/2),l=r((t+n)/2),h=a((t+n)/2),f=r((t-n)/2),u=a((t-n)/2),m=r((n-t)/2),g=a((n-t)/2);switch(s){case"XYX":i.set(o*h,c*f,c*u,o*l);break;case"YZY":i.set(c*u,o*h,c*f,o*l);break;case"ZXZ":i.set(c*f,c*u,o*h,o*l);break;case"XZX":i.set(o*h,c*g,c*m,o*l);break;case"YXY":i.set(c*m,o*h,c*g,o*l);break;case"ZYZ":i.set(c*g,c*m,o*h,o*l);break;default:Nt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Bn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function xe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var us={DEG2RAD:Sr,RAD2DEG:as,generateUUID:di,clamp:se,euclideanModulo:gh,mapLinear:$f,inverseLerp:Jf,lerp:wr,damp:Kf,pingpong:jf,smoothstep:Qf,smootherstep:tp,randInt:ep,randFloat:np,randFloatSpread:ip,seededRandom:sp,degToRad:rp,radToDeg:ap,isPowerOfTwo:op,ceilPowerOfTwo:lp,floorPowerOfTwo:cp,setQuaternionFromProperEuler:hp,normalize:xe,denormalize:Bn},Ut=class i{static{i.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=se(this.x,t.x,e.x),this.y=se(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=se(this.x,t,e),this.y=se(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(se(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(se(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Ye=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let c=n[s+0],l=n[s+1],h=n[s+2],f=n[s+3],u=r[a+0],m=r[a+1],g=r[a+2],v=r[a+3];if(f!==v||c!==u||l!==m||h!==g){let p=c*u+l*m+h*g+f*v;p<0&&(u=-u,m=-m,g=-g,v=-v,p=-p);let d=1-o;if(p<.9995){let b=Math.acos(p),M=Math.sin(b);d=Math.sin(d*b)/M,o=Math.sin(o*b)/M,c=c*d+u*o,l=l*d+m*o,h=h*d+g*o,f=f*d+v*o}else{c=c*d+u*o,l=l*d+m*o,h=h*d+g*o,f=f*d+v*o;let b=1/Math.sqrt(c*c+l*l+h*h+f*f);c*=b,l*=b,h*=b,f*=b}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],c=n[s+1],l=n[s+2],h=n[s+3],f=r[a],u=r[a+1],m=r[a+2],g=r[a+3];return t[e]=o*g+h*f+c*m-l*u,t[e+1]=c*g+h*u+l*f-o*m,t[e+2]=l*g+h*m+o*u-c*f,t[e+3]=h*g-o*f-c*u-l*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),h=o(s/2),f=o(r/2),u=c(n/2),m=c(s/2),g=c(r/2);switch(a){case"XYZ":this._x=u*h*f+l*m*g,this._y=l*m*f-u*h*g,this._z=l*h*g+u*m*f,this._w=l*h*f-u*m*g;break;case"YXZ":this._x=u*h*f+l*m*g,this._y=l*m*f-u*h*g,this._z=l*h*g-u*m*f,this._w=l*h*f+u*m*g;break;case"ZXY":this._x=u*h*f-l*m*g,this._y=l*m*f+u*h*g,this._z=l*h*g+u*m*f,this._w=l*h*f-u*m*g;break;case"ZYX":this._x=u*h*f-l*m*g,this._y=l*m*f+u*h*g,this._z=l*h*g-u*m*f,this._w=l*h*f+u*m*g;break;case"YZX":this._x=u*h*f+l*m*g,this._y=l*m*f+u*h*g,this._z=l*h*g-u*m*f,this._w=l*h*f-u*m*g;break;case"XZY":this._x=u*h*f-l*m*g,this._y=l*m*f-u*h*g,this._z=l*h*g+u*m*f,this._w=l*h*f+u*m*g;break;default:Nt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],h=e[6],f=e[10],u=n+o+f;if(u>0){let m=.5/Math.sqrt(u+1);this._w=.25/m,this._x=(h-c)*m,this._y=(r-l)*m,this._z=(a-s)*m}else if(n>o&&n>f){let m=2*Math.sqrt(1+n-o-f);this._w=(h-c)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+l)/m}else if(o>f){let m=2*Math.sqrt(1+o-n-f);this._w=(r-l)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(c+h)/m}else{let m=2*Math.sqrt(1+f-n-o);this._w=(a-s)/m,this._x=(r+l)/m,this._y=(c+h)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(se(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+a*o+s*l-r*c,this._y=s*h+a*c+r*o-n*l,this._z=r*h+a*l+n*c-s*o,this._w=a*h-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-e;if(o<.9995){let l=Math.acos(o),h=Math.sin(l);c=Math.sin(c*l)/h,e=Math.sin(e*l)/h,this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},L=class i{static{i.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(bu.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(bu.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*s-o*n),h=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+c*l+a*f-o*h,this.y=n+c*h+o*l-r*f,this.z=s+c*f+r*h-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=se(this.x,t.x,e.x),this.y=se(this.y,t.y,e.y),this.z=se(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=se(this.x,t,e),this.y=se(this.y,t,e),this.z=se(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(se(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return vc.copy(this).projectOnVector(t),this.sub(vc)}reflect(t){return this.sub(vc.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(se(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},vc=new L,bu=new Ye,Xt=class i{static{i.prototype.isMatrix3=!0}constructor(t,e,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l)}set(t,e,n,s,r,a,o,c,l){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=c,h[6]=n,h[7]=a,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],h=n[4],f=n[7],u=n[2],m=n[5],g=n[8],v=s[0],p=s[3],d=s[6],b=s[1],M=s[4],y=s[7],w=s[2],T=s[5],R=s[8];return r[0]=a*v+o*b+c*w,r[3]=a*p+o*M+c*T,r[6]=a*d+o*y+c*R,r[1]=l*v+h*b+f*w,r[4]=l*p+h*M+f*T,r[7]=l*d+h*y+f*R,r[2]=u*v+m*b+g*w,r[5]=u*p+m*M+g*T,r[8]=u*d+m*y+g*R,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8];return e*a*h-e*o*l-n*r*h+n*o*c+s*r*l-s*a*c}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],f=h*a-o*l,u=o*c-h*r,m=l*r-a*c,g=e*f+n*u+s*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return t[0]=f*v,t[1]=(s*l-h*n)*v,t[2]=(o*n-s*a)*v,t[3]=u*v,t[4]=(h*e-s*c)*v,t[5]=(s*r-o*e)*v,t[6]=m*v,t[7]=(n*c-l*e)*v,t[8]=(a*e-n*r)*v,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-s*l,s*c,-s*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return is("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(_c.makeScale(t,e)),this}rotate(t){return is("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(_c.makeRotation(-t)),this}translate(t,e){return is("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(_c.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},_c=new Xt,Mu=new Xt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Eu=new Xt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function up(){let i={enabled:!0,workingColorSpace:Ar,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===pe&&(s.r=fi(s.r),s.g=fi(s.g),s.b=fi(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===pe&&(s.r=Bs(s.r),s.g=Bs(s.g),s.b=Bs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===vi?Rr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return is("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return is("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ar]:{primaries:t,whitePoint:n,transfer:Rr,toXYZ:Mu,fromXYZ:Eu,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Re},outputColorSpaceConfig:{drawingBufferColorSpace:Re}},[Re]:{primaries:t,whitePoint:n,transfer:pe,toXYZ:Mu,fromXYZ:Eu,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Re}}}),i}var ie=up();function fi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Bs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var ys,mo=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{ys===void 0&&(ys=Cr("canvas")),ys.width=t.width,ys.height=t.height;let s=ys.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=ys}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Cr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=fi(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(fi(e[n]/255)*255):e[n]=fi(e[n]);return{data:e,width:t.width,height:t.height}}else return Nt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},dp=0,ks=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:dp++}),this.uuid=di(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(yc(s[a].image)):r.push(yc(s[a]))}else r=yc(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function yc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?mo.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Nt("Texture: Unable to serialize Texture."),{})}var fp=0,bc=new L,fn=class i extends Jn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Zn,s=Zn,r=nn,a=ki,o=Pn,c=vn,l=i.DEFAULT_ANISOTROPY,h=vi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:fp++}),this.uuid=di(),this.name="",this.source=new ks(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Ut(0,0),this.repeat=new Ut(1,1),this.center=new Ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(bc).x}get height(){return this.source.getSize(bc).y}get depth(){return this.source.getSize(bc).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Nt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Nt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==lh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Li:t.x=t.x-Math.floor(t.x);break;case Zn:t.x=t.x<0?0:1;break;case uo:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Li:t.y=t.y-Math.floor(t.y);break;case Zn:t.y=t.y<0?0:1;break;case uo:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};fn.DEFAULT_IMAGE=null;fn.DEFAULT_MAPPING=lh;fn.DEFAULT_ANISOTROPY=1;var Fe=class i{static{i.prototype.isVector4=!0}constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,c=t.elements,l=c[0],h=c[4],f=c[8],u=c[1],m=c[5],g=c[9],v=c[2],p=c[6],d=c[10];if(Math.abs(h-u)<.01&&Math.abs(f-v)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+v)<.1&&Math.abs(g+p)<.1&&Math.abs(l+m+d-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let M=(l+1)/2,y=(m+1)/2,w=(d+1)/2,T=(h+u)/4,R=(f+v)/4,x=(g+p)/4;return M>y&&M>w?M<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(M),s=T/n,r=R/n):y>w?y<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(y),n=T/s,r=x/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=R/r,s=x/r),this.set(n,s,r,e),this}let b=Math.sqrt((p-g)*(p-g)+(f-v)*(f-v)+(u-h)*(u-h));return Math.abs(b)<.001&&(b=1),this.x=(p-g)/b,this.y=(f-v)/b,this.z=(u-h)/b,this.w=Math.acos((l+m+d-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=se(this.x,t.x,e.x),this.y=se(this.y,t.y,e.y),this.z=se(this.z,t.z,e.z),this.w=se(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=se(this.x,t,e),this.y=se(this.y,t,e),this.z=se(this.z,t,e),this.w=se(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(se(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},go=class extends Jn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:nn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Fe(0,0,t,e),this.scissorTest=!1,this.viewport=new Fe(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new fn(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:nn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new ks(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},hn=class extends go{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Pr=class extends fn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Qe,this.minFilter=Qe,this.wrapR=Zn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var xo=class extends fn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Qe,this.minFilter=Qe,this.wrapR=Zn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var oe=class i{static{i.prototype.isMatrix4=!0}constructor(t,e,n,s,r,a,o,c,l,h,f,u,m,g,v,p){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l,h,f,u,m,g,v,p)}set(t,e,n,s,r,a,o,c,l,h,f,u,m,g,v,p){let d=this.elements;return d[0]=t,d[4]=e,d[8]=n,d[12]=s,d[1]=r,d[5]=a,d[9]=o,d[13]=c,d[2]=l,d[6]=h,d[10]=f,d[14]=u,d[3]=m,d[7]=g,d[11]=v,d[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/bs.setFromMatrixColumn(t,0).length(),r=1/bs.setFromMatrixColumn(t,1).length(),a=1/bs.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let u=a*h,m=a*f,g=o*h,v=o*f;e[0]=c*h,e[4]=-c*f,e[8]=l,e[1]=m+g*l,e[5]=u-v*l,e[9]=-o*c,e[2]=v-u*l,e[6]=g+m*l,e[10]=a*c}else if(t.order==="YXZ"){let u=c*h,m=c*f,g=l*h,v=l*f;e[0]=u+v*o,e[4]=g*o-m,e[8]=a*l,e[1]=a*f,e[5]=a*h,e[9]=-o,e[2]=m*o-g,e[6]=v+u*o,e[10]=a*c}else if(t.order==="ZXY"){let u=c*h,m=c*f,g=l*h,v=l*f;e[0]=u-v*o,e[4]=-a*f,e[8]=g+m*o,e[1]=m+g*o,e[5]=a*h,e[9]=v-u*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){let u=a*h,m=a*f,g=o*h,v=o*f;e[0]=c*h,e[4]=g*l-m,e[8]=u*l+v,e[1]=c*f,e[5]=v*l+u,e[9]=m*l-g,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){let u=a*c,m=a*l,g=o*c,v=o*l;e[0]=c*h,e[4]=v-u*f,e[8]=g*f+m,e[1]=f,e[5]=a*h,e[9]=-o*h,e[2]=-l*h,e[6]=m*f+g,e[10]=u-v*f}else if(t.order==="XZY"){let u=a*c,m=a*l,g=o*c,v=o*l;e[0]=c*h,e[4]=-f,e[8]=l*h,e[1]=u*f+v,e[5]=a*h,e[9]=m*f-g,e[2]=g*f-m,e[6]=o*h,e[10]=v*f+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(pp,t,mp)}lookAt(t,e,n){let s=this.elements;return Mn.subVectors(t,e),Mn.lengthSq()===0&&(Mn.z=1),Mn.normalize(),wi.crossVectors(n,Mn),wi.lengthSq()===0&&(Math.abs(n.z)===1?Mn.x+=1e-4:Mn.z+=1e-4,Mn.normalize(),wi.crossVectors(n,Mn)),wi.normalize(),Ca.crossVectors(Mn,wi),s[0]=wi.x,s[4]=Ca.x,s[8]=Mn.x,s[1]=wi.y,s[5]=Ca.y,s[9]=Mn.y,s[2]=wi.z,s[6]=Ca.z,s[10]=Mn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],h=n[1],f=n[5],u=n[9],m=n[13],g=n[2],v=n[6],p=n[10],d=n[14],b=n[3],M=n[7],y=n[11],w=n[15],T=s[0],R=s[4],x=s[8],E=s[12],A=s[1],I=s[5],D=s[9],P=s[13],H=s[2],z=s[6],W=s[10],q=s[14],Z=s[3],et=s[7],rt=s[11],it=s[15];return r[0]=a*T+o*A+c*H+l*Z,r[4]=a*R+o*I+c*z+l*et,r[8]=a*x+o*D+c*W+l*rt,r[12]=a*E+o*P+c*q+l*it,r[1]=h*T+f*A+u*H+m*Z,r[5]=h*R+f*I+u*z+m*et,r[9]=h*x+f*D+u*W+m*rt,r[13]=h*E+f*P+u*q+m*it,r[2]=g*T+v*A+p*H+d*Z,r[6]=g*R+v*I+p*z+d*et,r[10]=g*x+v*D+p*W+d*rt,r[14]=g*E+v*P+p*q+d*it,r[3]=b*T+M*A+y*H+w*Z,r[7]=b*R+M*I+y*z+w*et,r[11]=b*x+M*D+y*W+w*rt,r[15]=b*E+M*P+y*q+w*it,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],h=t[2],f=t[6],u=t[10],m=t[14],g=t[3],v=t[7],p=t[11],d=t[15],b=c*m-l*u,M=o*m-l*f,y=o*u-c*f,w=a*m-l*h,T=a*u-c*h,R=a*f-o*h;return e*(v*b-p*M+d*y)-n*(g*b-p*w+d*T)+s*(g*M-v*w+d*R)-r*(g*y-v*T+p*R)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],c=t[2],l=t[6],h=t[10];return e*(a*h-o*l)-n*(r*h-o*c)+s*(r*l-a*c)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],h=t[8],f=t[9],u=t[10],m=t[11],g=t[12],v=t[13],p=t[14],d=t[15],b=e*o-n*a,M=e*c-s*a,y=e*l-r*a,w=n*c-s*o,T=n*l-r*o,R=s*l-r*c,x=h*v-f*g,E=h*p-u*g,A=h*d-m*g,I=f*p-u*v,D=f*d-m*v,P=u*d-m*p,H=b*P-M*D+y*I+w*A-T*E+R*x;if(H===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let z=1/H;return t[0]=(o*P-c*D+l*I)*z,t[1]=(s*D-n*P-r*I)*z,t[2]=(v*R-p*T+d*w)*z,t[3]=(u*T-f*R-m*w)*z,t[4]=(c*A-a*P-l*E)*z,t[5]=(e*P-s*A+r*E)*z,t[6]=(p*y-g*R-d*M)*z,t[7]=(h*R-u*y+m*M)*z,t[8]=(a*D-o*A+l*x)*z,t[9]=(n*A-e*D-r*x)*z,t[10]=(g*T-v*y+d*b)*z,t[11]=(f*y-h*T-m*b)*z,t[12]=(o*E-a*I-c*x)*z,t[13]=(e*I-n*E+s*x)*z,t[14]=(v*M-g*w-p*b)*z,t[15]=(h*w-f*M+u*b)*z,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,c=t.z,l=r*a,h=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,h*o+n,h*c-s*a,0,l*c-s*o,h*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,h=a+a,f=o+o,u=r*l,m=r*h,g=r*f,v=a*h,p=a*f,d=o*f,b=c*l,M=c*h,y=c*f,w=n.x,T=n.y,R=n.z;return s[0]=(1-(v+d))*w,s[1]=(m+y)*w,s[2]=(g-M)*w,s[3]=0,s[4]=(m-y)*T,s[5]=(1-(u+d))*T,s[6]=(p+b)*T,s[7]=0,s[8]=(g+M)*R,s[9]=(p-b)*R,s[10]=(1-(u+v))*R,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=bs.set(s[0],s[1],s[2]).length(),o=bs.set(s[4],s[5],s[6]).length(),c=bs.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Nn.copy(this);let l=1/a,h=1/o,f=1/c;return Nn.elements[0]*=l,Nn.elements[1]*=l,Nn.elements[2]*=l,Nn.elements[4]*=h,Nn.elements[5]*=h,Nn.elements[6]*=h,Nn.elements[8]*=f,Nn.elements[9]*=f,Nn.elements[10]*=f,e.setFromRotationMatrix(Nn),n.x=a,n.y=o,n.z=c,this}makePerspective(t,e,n,s,r,a,o=On,c=!1){let l=this.elements,h=2*r/(e-t),f=2*r/(n-s),u=(e+t)/(e-t),m=(n+s)/(n-s),g,v;if(c)g=r/(a-r),v=a*r/(a-r);else if(o===On)g=-(a+r)/(a-r),v=-2*a*r/(a-r);else if(o===Os)g=-a/(a-r),v=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=f,l[9]=m,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=On,c=!1){let l=this.elements,h=2/(e-t),f=2/(n-s),u=-(e+t)/(e-t),m=-(n+s)/(n-s),g,v;if(c)g=1/(a-r),v=a/(a-r);else if(o===On)g=-2/(a-r),v=-(a+r)/(a-r);else if(o===Os)g=-1/(a-r),v=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=h,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=f,l[9]=0,l[13]=m,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},bs=new L,Nn=new oe,pp=new L(0,0,0),mp=new L(1,1,1),wi=new L,Ca=new L,Mn=new L,Su=new oe,wu=new Ye,Sn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],h=s[9],f=s[2],u=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(se(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-se(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(se(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,m),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-se(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,m),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(se(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-se(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,m),this._y=0);break;default:Nt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Su.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Su,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return wu.setFromEuler(this),this.setFromQuaternion(wu,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Sn.DEFAULT_ORDER="XYZ";var Lr=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},gp=0,Tu=new L,Ms=new Ye,ai=new oe,Ia=new L,pr=new L,xp=new L,vp=new Ye,Au=new L(1,0,0),Ru=new L(0,1,0),Cu=new L(0,0,1),Iu={type:"added"},_p={type:"removed"},Es={type:"childadded",child:null},Mc={type:"childremoved",child:null},_e=class i extends Jn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:gp++}),this.uuid=di(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new L,e=new Sn,n=new Ye,s=new L(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new oe},normalMatrix:{value:new Xt}}),this.matrix=new oe,this.matrixWorld=new oe,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Lr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ms.setFromAxisAngle(t,e),this.quaternion.multiply(Ms),this}rotateOnWorldAxis(t,e){return Ms.setFromAxisAngle(t,e),this.quaternion.premultiply(Ms),this}rotateX(t){return this.rotateOnAxis(Au,t)}rotateY(t){return this.rotateOnAxis(Ru,t)}rotateZ(t){return this.rotateOnAxis(Cu,t)}translateOnAxis(t,e){return Tu.copy(t).applyQuaternion(this.quaternion),this.position.add(Tu.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Au,t)}translateY(t){return this.translateOnAxis(Ru,t)}translateZ(t){return this.translateOnAxis(Cu,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ai.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ia.copy(t):Ia.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),pr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ai.lookAt(pr,Ia,this.up):ai.lookAt(Ia,pr,this.up),this.quaternion.setFromRotationMatrix(ai),s&&(ai.extractRotation(s.matrixWorld),Ms.setFromRotationMatrix(ai),this.quaternion.premultiply(Ms.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Bt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Iu),Es.child=t,this.dispatchEvent(Es),Es.child=null):Bt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(_p),Mc.child=t,this.dispatchEvent(Mc),Mc.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ai.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ai.multiply(t.parent.matrixWorld)),t.applyMatrix4(ai),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Iu),Es.child=t,this.dispatchEvent(Es),Es.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(pr,t,xp),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(pr,vp,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let c=o.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let f=c[l];r(t.shapes,f)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let c=this.animations[o];s.animations.push(r(t.animations,c))}}if(e){let o=a(t.geometries),c=a(t.materials),l=a(t.textures),h=a(t.images),f=a(t.shapes),u=a(t.skeletons),m=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let c=[];for(let l in o){let h=o[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};_e.DEFAULT_UP=new L(0,1,0);_e.DEFAULT_MATRIX_AUTO_UPDATE=!0;_e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ee=class extends _e{constructor(){super(),this.isGroup=!0,this.type="Group"}},yp={type:"move"},Hs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ee,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ee,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ee,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(let v of t.hand.values()){let p=e.getJointPose(v,n),d=this._getHandJoint(l,v);p!==null&&(d.matrix.fromArray(p.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=p.radius),d.visible=p!==null}let h=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],u=h.position.distanceTo(f.position),m=.02,g=.005;l.inputState.pinching&&u>m+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=m-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(yp)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new ee;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Id={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ti={h:0,s:0,l:0},Pa={h:0,s:0,l:0};function Ec(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var wt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Re){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ie.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=ie.workingColorSpace){return this.r=t,this.g=e,this.b=n,ie.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=ie.workingColorSpace){if(t=gh(t,1),e=se(e,0,1),n=se(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Ec(a,r,t+1/3),this.g=Ec(a,r,t),this.b=Ec(a,r,t-1/3)}return ie.colorSpaceToWorking(this,s),this}setStyle(t,e=Re){function n(r){r!==void 0&&parseFloat(r)<1&&Nt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Nt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Nt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Re){let n=Id[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Nt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=fi(t.r),this.g=fi(t.g),this.b=fi(t.b),this}copyLinearToSRGB(t){return this.r=Bs(t.r),this.g=Bs(t.g),this.b=Bs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Re){return ie.workingToColorSpace(cn.copy(this),t),Math.round(se(cn.r*255,0,255))*65536+Math.round(se(cn.g*255,0,255))*256+Math.round(se(cn.b*255,0,255))}getHexString(t=Re){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ie.workingColorSpace){ie.workingToColorSpace(cn.copy(this),e);let n=cn.r,s=cn.g,r=cn.b,a=Math.max(n,s,r),o=Math.min(n,s,r),c,l,h=(o+a)/2;if(o===a)c=0,l=0;else{let f=a-o;switch(l=h<=.5?f/(a+o):f/(2-a-o),a){case n:c=(s-r)/f+(s<r?6:0);break;case s:c=(r-n)/f+2;break;case r:c=(n-s)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=ie.workingColorSpace){return ie.workingToColorSpace(cn.copy(this),e),t.r=cn.r,t.g=cn.g,t.b=cn.b,t}getStyle(t=Re){ie.workingToColorSpace(cn.copy(this),t);let e=cn.r,n=cn.g,s=cn.b;return t!==Re?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Ti),this.setHSL(Ti.h+t,Ti.s+e,Ti.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Ti),t.getHSL(Pa);let n=wr(Ti.h,Pa.h,e),s=wr(Ti.s,Pa.s,e),r=wr(Ti.l,Pa.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},cn=new wt;wt.NAMES=Id;var Dr=class i{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new wt(t),this.near=e,this.far=n}clone(){return new i(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Di=class extends _e{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Sn,this.environmentIntensity=1,this.environmentRotation=new Sn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}},Un=new L,oi=new L,Sc=new L,li=new L,Ss=new L,ws=new L,Pu=new L,wc=new L,Tc=new L,Ac=new L,Rc=new Fe,Cc=new Fe,Ic=new Fe,ui=class i{constructor(t=new L,e=new L,n=new L){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Un.subVectors(t,e),s.cross(Un);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Un.subVectors(s,e),oi.subVectors(n,e),Sc.subVectors(t,e);let a=Un.dot(Un),o=Un.dot(oi),c=Un.dot(Sc),l=oi.dot(oi),h=oi.dot(Sc),f=a*l-o*o;if(f===0)return r.set(0,0,0),null;let u=1/f,m=(l*c-o*h)*u,g=(a*h-o*c)*u;return r.set(1-m-g,g,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,li)===null?!1:li.x>=0&&li.y>=0&&li.x+li.y<=1}static getInterpolation(t,e,n,s,r,a,o,c){return this.getBarycoord(t,e,n,s,li)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,li.x),c.addScaledVector(a,li.y),c.addScaledVector(o,li.z),c)}static getInterpolatedAttribute(t,e,n,s,r,a){return Rc.setScalar(0),Cc.setScalar(0),Ic.setScalar(0),Rc.fromBufferAttribute(t,e),Cc.fromBufferAttribute(t,n),Ic.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Rc,r.x),a.addScaledVector(Cc,r.y),a.addScaledVector(Ic,r.z),a}static isFrontFacing(t,e,n,s){return Un.subVectors(n,e),oi.subVectors(t,e),Un.cross(oi).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Un.subVectors(this.c,this.b),oi.subVectors(this.a,this.b),Un.cross(oi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;Ss.subVectors(s,n),ws.subVectors(r,n),wc.subVectors(t,n);let c=Ss.dot(wc),l=ws.dot(wc);if(c<=0&&l<=0)return e.copy(n);Tc.subVectors(t,s);let h=Ss.dot(Tc),f=ws.dot(Tc);if(h>=0&&f<=h)return e.copy(s);let u=c*f-h*l;if(u<=0&&c>=0&&h<=0)return a=c/(c-h),e.copy(n).addScaledVector(Ss,a);Ac.subVectors(t,r);let m=Ss.dot(Ac),g=ws.dot(Ac);if(g>=0&&m<=g)return e.copy(r);let v=m*l-c*g;if(v<=0&&l>=0&&g<=0)return o=l/(l-g),e.copy(n).addScaledVector(ws,o);let p=h*g-m*f;if(p<=0&&f-h>=0&&m-g>=0)return Pu.subVectors(r,s),o=(f-h)/(f-h+(m-g)),e.copy(s).addScaledVector(Pu,o);let d=1/(p+v+u);return a=v*d,o=u*d,e.copy(n).addScaledVector(Ss,a).addScaledVector(ws,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Kn=class{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Fn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Fn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Fn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Fn):Fn.fromBufferAttribute(r,a),Fn.applyMatrix4(t.matrixWorld),this.expandByPoint(Fn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),La.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),La.copy(n.boundingBox)),La.applyMatrix4(t.matrixWorld),this.union(La)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Fn),Fn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(mr),Da.subVectors(this.max,mr),Ts.subVectors(t.a,mr),As.subVectors(t.b,mr),Rs.subVectors(t.c,mr),Ai.subVectors(As,Ts),Ri.subVectors(Rs,As),ji.subVectors(Ts,Rs);let e=[0,-Ai.z,Ai.y,0,-Ri.z,Ri.y,0,-ji.z,ji.y,Ai.z,0,-Ai.x,Ri.z,0,-Ri.x,ji.z,0,-ji.x,-Ai.y,Ai.x,0,-Ri.y,Ri.x,0,-ji.y,ji.x,0];return!Pc(e,Ts,As,Rs,Da)||(e=[1,0,0,0,1,0,0,0,1],!Pc(e,Ts,As,Rs,Da))?!1:(Na.crossVectors(Ai,Ri),e=[Na.x,Na.y,Na.z],Pc(e,Ts,As,Rs,Da))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Fn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Fn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ci[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ci[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ci[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ci[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ci[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ci[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ci[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ci[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ci),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},ci=[new L,new L,new L,new L,new L,new L,new L,new L],Fn=new L,La=new Kn,Ts=new L,As=new L,Rs=new L,Ai=new L,Ri=new L,ji=new L,mr=new L,Da=new L,Na=new L,Qi=new L;function Pc(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Qi.fromArray(i,r);let o=s.x*Math.abs(Qi.x)+s.y*Math.abs(Qi.y)+s.z*Math.abs(Qi.z),c=t.dot(Qi),l=e.dot(Qi),h=n.dot(Qi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>o)return!1}return!0}var qe=new L,Ua=new Ut,bp=0,We=class extends Jn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:bp++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=po,this.updateRanges=[],this.gpuType=In,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ua.fromBufferAttribute(this,e),Ua.applyMatrix3(t),this.setXY(e,Ua.x,Ua.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyMatrix3(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyMatrix4(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.applyNormalMatrix(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)qe.fromBufferAttribute(this,e),qe.transformDirection(t),this.setXYZ(e,qe.x,qe.y,qe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Bn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=xe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Bn(e,this.array)),e}setX(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Bn(e,this.array)),e}setY(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Bn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Bn(e,this.array)),e}setW(t,e){return this.normalized&&(e=xe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array),s=xe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array),s=xe(s,this.array),r=xe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==po&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}};var Nr=class extends We{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Ur=class extends We{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var jt=class extends We{constructor(t,e,n){super(new Float32Array(t),e,n)}},Mp=new Kn,gr=new L,Lc=new L,mi=class{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Mp.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;gr.subVectors(t,this.center);let e=gr.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(gr,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Lc.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(gr.copy(t.center).add(Lc)),this.expandByPoint(gr.copy(t.center).sub(Lc))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Ep=0,Cn=new oe,Dc=new _e,Cs=new L,En=new Kn,xr=new Kn,je=new L,ye=class i extends Jn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ep++}),this.uuid=di(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Yf(t)?Ur:Nr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Xt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Cn.makeRotationFromQuaternion(t),this.applyMatrix4(Cn),this}rotateX(t){return Cn.makeRotationX(t),this.applyMatrix4(Cn),this}rotateY(t){return Cn.makeRotationY(t),this.applyMatrix4(Cn),this}rotateZ(t){return Cn.makeRotationZ(t),this.applyMatrix4(Cn),this}translate(t,e,n){return Cn.makeTranslation(t,e,n),this.applyMatrix4(Cn),this}scale(t,e,n){return Cn.makeScale(t,e,n),this.applyMatrix4(Cn),this}lookAt(t){return Dc.lookAt(t),Dc.updateMatrix(),this.applyMatrix4(Dc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Cs).negate(),this.translate(Cs.x,Cs.y,Cs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new jt(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Nt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Kn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Bt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];En.setFromBufferAttribute(r),this.morphTargetsRelative?(je.addVectors(this.boundingBox.min,En.min),this.boundingBox.expandByPoint(je),je.addVectors(this.boundingBox.max,En.max),this.boundingBox.expandByPoint(je)):(this.boundingBox.expandByPoint(En.min),this.boundingBox.expandByPoint(En.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Bt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new mi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Bt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){let n=this.boundingSphere.center;if(En.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];xr.setFromBufferAttribute(o),this.morphTargetsRelative?(je.addVectors(En.min,xr.min),En.expandByPoint(je),je.addVectors(En.max,xr.max),En.expandByPoint(je)):(En.expandByPoint(xr.min),En.expandByPoint(xr.max))}En.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)je.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(je));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],c=this.morphTargetsRelative;for(let l=0,h=o.count;l<h;l++)je.fromBufferAttribute(o,l),c&&(Cs.fromBufferAttribute(t,l),je.add(Cs)),s=Math.max(s,n.distanceToSquared(je))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Bt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Bt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new We(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],c=[];for(let x=0;x<n.count;x++)o[x]=new L,c[x]=new L;let l=new L,h=new L,f=new L,u=new Ut,m=new Ut,g=new Ut,v=new L,p=new L;function d(x,E,A){l.fromBufferAttribute(n,x),h.fromBufferAttribute(n,E),f.fromBufferAttribute(n,A),u.fromBufferAttribute(r,x),m.fromBufferAttribute(r,E),g.fromBufferAttribute(r,A),h.sub(l),f.sub(l),m.sub(u),g.sub(u);let I=1/(m.x*g.y-g.x*m.y);isFinite(I)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(f,-m.y).multiplyScalar(I),p.copy(f).multiplyScalar(m.x).addScaledVector(h,-g.x).multiplyScalar(I),o[x].add(v),o[E].add(v),o[A].add(v),c[x].add(p),c[E].add(p),c[A].add(p))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let x=0,E=b.length;x<E;++x){let A=b[x],I=A.start,D=A.count;for(let P=I,H=I+D;P<H;P+=3)d(t.getX(P+0),t.getX(P+1),t.getX(P+2))}let M=new L,y=new L,w=new L,T=new L;function R(x){w.fromBufferAttribute(s,x),T.copy(w);let E=o[x];M.copy(E),M.sub(w.multiplyScalar(w.dot(E))).normalize(),y.crossVectors(T,E);let I=y.dot(c[x])<0?-1:1;a.setXYZW(x,M.x,M.y,M.z,I)}for(let x=0,E=b.length;x<E;++x){let A=b[x],I=A.start,D=A.count;for(let P=I,H=I+D;P<H;P+=3)R(t.getX(P+0)),R(t.getX(P+1)),R(t.getX(P+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new We(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,m=n.count;u<m;u++)n.setXYZ(u,0,0,0);let s=new L,r=new L,a=new L,o=new L,c=new L,l=new L,h=new L,f=new L;if(t)for(let u=0,m=t.count;u<m;u+=3){let g=t.getX(u+0),v=t.getX(u+1),p=t.getX(u+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),a.fromBufferAttribute(e,p),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),o.fromBufferAttribute(n,g),c.fromBufferAttribute(n,v),l.fromBufferAttribute(n,p),o.add(h),c.add(h),l.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(v,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let u=0,m=e.count;u<m;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)je.fromBufferAttribute(t,e),je.normalize(),t.setXYZ(e,je.x,je.y,je.z)}toNonIndexed(){function t(o,c){let l=o.array,h=o.itemSize,f=o.normalized,u=new l.constructor(c.length*h),m=0,g=0;for(let v=0,p=c.length;v<p;v++){o.isInterleavedBufferAttribute?m=c[v]*o.data.stride+o.offset:m=c[v]*h;for(let d=0;d<h;d++)u[g++]=l[m++]}return new We(u,h,f)}if(this.index===null)return Nt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let c=s[o],l=t(c,n);e.setAttribute(o,l)}let r=this.morphAttributes;for(let o in r){let c=[],l=r[o];for(let h=0,f=l.length;h<f;h++){let u=l[h],m=t(u,n);c.push(m)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,c=a.length;o<c;o++){let l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let c in n){let l=n[c];t.data.attributes[c]=l.toJSON(t.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let f=0,u=l.length;f<u;f++){let m=l[f];h.push(m.toJSON(t.data))}h.length>0&&(s[c]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(e))}let r=t.morphAttributes;for(let l in r){let h=[],f=r[l];for(let u=0,m=f.length;u<m;u++)h.push(f[u].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let l=0,h=a.length;l<h;l++){let f=a[l];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},Fr=class{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=po,this.updateRanges=[],this.version=0,this.uuid=di()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let s=0,r=this.stride;s<r;s++)this.array[t+s]=e.array[n+s];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=di()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=di()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},dn=new L,Gs=class i{constructor(t,e,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)dn.fromBufferAttribute(this,e),dn.applyMatrix4(t),this.setXYZ(e,dn.x,dn.y,dn.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)dn.fromBufferAttribute(this,e),dn.applyNormalMatrix(t),this.setXYZ(e,dn.x,dn.y,dn.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)dn.fromBufferAttribute(this,e),dn.transformDirection(t),this.setXYZ(e,dn.x,dn.y,dn.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=Bn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=xe(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=xe(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=xe(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=xe(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=xe(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Bn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Bn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Bn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Bn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array),s=xe(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=xe(e,this.array),n=xe(n,this.array),s=xe(s,this.array),r=xe(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this.data.array[t+3]=r,this}clone(t){if(t===void 0){Ir("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let e=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return new We(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new i(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){Ir("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let e=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Sp=0,jn=class extends Jn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Sp++}),this.uuid=di(),this.name="",this.type="Material",this.blending=ss,this.side=pi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=no,this.blendDst=io,this.blendEquation=Pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new wt(0,0,0),this.blendAlpha=0,this.depthFunc=rs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=qc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ns,this.stencilZFail=ns,this.stencilZPass=ns,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Nt(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Nt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ss&&(n.blending=this.blending),this.side!==pi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==no&&(n.blendSrc=this.blendSrc),this.blendDst!==io&&(n.blendDst=this.blendDst),this.blendEquation!==Pi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==rs&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==qc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ns&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ns&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ns&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let c=r[o];delete c.metadata,a.push(c)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new wt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Ut().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ut().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Vs=class extends jn{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new wt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Is,vr=new L,Ps=new L,Ls=new L,Ds=new Ut,_r=new Ut,Pd=new oe,Fa=new L,yr=new L,Ba=new L,Lu=new Ut,Nc=new Ut,Du=new Ut,Br=class extends _e{constructor(t=new Vs){if(super(),this.isSprite=!0,this.type="Sprite",Is===void 0){Is=new ye;let e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Fr(e,5);Is.setIndex([0,1,2,0,2,3]),Is.setAttribute("position",new Gs(n,3,0,!1)),Is.setAttribute("uv",new Gs(n,2,3,!1))}this.geometry=Is,this.material=t,this.center=new Ut(.5,.5),this.count=1}raycast(t,e){t.camera===null&&Bt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Ps.setFromMatrixScale(this.matrixWorld),Pd.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Ls.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ps.multiplyScalar(-Ls.z);let n=this.material.rotation,s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));let a=this.center;Oa(Fa.set(-.5,-.5,0),Ls,a,Ps,s,r),Oa(yr.set(.5,-.5,0),Ls,a,Ps,s,r),Oa(Ba.set(.5,.5,0),Ls,a,Ps,s,r),Lu.set(0,0),Nc.set(1,0),Du.set(1,1);let o=t.ray.intersectTriangle(Fa,yr,Ba,!1,vr);if(o===null&&(Oa(yr.set(-.5,.5,0),Ls,a,Ps,s,r),Nc.set(0,1),o=t.ray.intersectTriangle(Fa,Ba,yr,!1,vr),o===null))return;let c=t.ray.origin.distanceTo(vr);c<t.near||c>t.far||e.push({distance:c,point:vr.clone(),uv:ui.getInterpolation(vr,Fa,yr,Ba,Lu,Nc,Du,new Ut),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}};function Oa(i,t,e,n,s,r){Ds.subVectors(i,e).addScalar(.5).multiply(n),s!==void 0?(_r.x=r*Ds.x-s*Ds.y,_r.y=s*Ds.x+r*Ds.y):_r.copy(Ds),i.copy(t),i.x+=_r.x,i.y+=_r.y,i.applyMatrix4(Pd)}var hi=new L,Uc=new L,za=new L,Ci=new L,Fc=new L,ka=new L,Bc=new L,Or=class{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,hi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=hi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(hi.copy(this.origin).addScaledVector(this.direction,e),hi.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Uc.copy(t).add(e).multiplyScalar(.5),za.copy(e).sub(t).normalize(),Ci.copy(this.origin).sub(Uc);let r=t.distanceTo(e)*.5,a=-this.direction.dot(za),o=Ci.dot(this.direction),c=-Ci.dot(za),l=Ci.lengthSq(),h=Math.abs(1-a*a),f,u,m,g;if(h>0)if(f=a*c-o,u=a*o-c,g=r*h,f>=0)if(u>=-g)if(u<=g){let v=1/h;f*=v,u*=v,m=f*(f+a*u+2*o)+u*(a*f+u+2*c)+l}else u=r,f=Math.max(0,-(a*u+o)),m=-f*f+u*(u+2*c)+l;else u=-r,f=Math.max(0,-(a*u+o)),m=-f*f+u*(u+2*c)+l;else u<=-g?(f=Math.max(0,-(-a*r+o)),u=f>0?-r:Math.min(Math.max(-r,-c),r),m=-f*f+u*(u+2*c)+l):u<=g?(f=0,u=Math.min(Math.max(-r,-c),r),m=u*(u+2*c)+l):(f=Math.max(0,-(a*r+o)),u=f>0?r:Math.min(Math.max(-r,-c),r),m=-f*f+u*(u+2*c)+l);else u=a>0?-r:r,f=Math.max(0,-(a*u+o)),m=-f*f+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(Uc).addScaledVector(za,u),m}intersectSphere(t,e){hi.subVectors(t.center,this.origin);let n=hi.dot(this.direction),s=hi.dot(hi)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,c,l=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return l>=0?(n=(t.min.x-u.x)*l,s=(t.max.x-u.x)*l):(n=(t.max.x-u.x)*l,s=(t.min.x-u.x)*l),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-u.z)*f,c=(t.max.z-u.z)*f):(o=(t.max.z-u.z)*f,c=(t.min.z-u.z)*f),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,hi)!==null}intersectTriangle(t,e,n,s,r){Fc.subVectors(e,t),ka.subVectors(n,t),Bc.crossVectors(Fc,ka);let a=this.direction.dot(Bc),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Ci.subVectors(this.origin,t);let c=o*this.direction.dot(ka.crossVectors(Ci,ka));if(c<0)return null;let l=o*this.direction.dot(Fc.cross(Ci));if(l<0||c+l>a)return null;let h=-o*Ci.dot(Bc);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},re=class extends jn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Sn,this.combine=zo,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Nu=new oe,ts=new Or,Ha=new mi,Uu=new L,Ga=new L,Va=new L,Wa=new L,Oc=new L,Xa=new L,Fu=new L,qa=new L,st=class extends _e{constructor(t=new ye,e=new re){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Xa.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=o[c],f=r[c];h!==0&&(Oc.fromBufferAttribute(f,t),a?Xa.addScaledVector(Oc,h):Xa.addScaledVector(Oc.sub(e),h))}e.add(Xa)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ha.copy(n.boundingSphere),Ha.applyMatrix4(r),ts.copy(t.ray).recast(t.near),!(Ha.containsPoint(ts.origin)===!1&&(ts.intersectSphere(Ha,Uu)===null||ts.origin.distanceToSquared(Uu)>(t.far-t.near)**2))&&(Nu.copy(r).invert(),ts.copy(t.ray).applyMatrix4(Nu),!(n.boundingBox!==null&&ts.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ts)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,f=r.attributes.normal,u=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){let p=u[g],d=a[p.materialIndex],b=Math.max(p.start,m.start),M=Math.min(o.count,Math.min(p.start+p.count,m.start+m.count));for(let y=b,w=M;y<w;y+=3){let T=o.getX(y),R=o.getX(y+1),x=o.getX(y+2);s=Ya(this,d,t,n,l,h,f,T,R,x),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,m.start),v=Math.min(o.count,m.start+m.count);for(let p=g,d=v;p<d;p+=3){let b=o.getX(p),M=o.getX(p+1),y=o.getX(p+2);s=Ya(this,a,t,n,l,h,f,b,M,y),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let g=0,v=u.length;g<v;g++){let p=u[g],d=a[p.materialIndex],b=Math.max(p.start,m.start),M=Math.min(c.count,Math.min(p.start+p.count,m.start+m.count));for(let y=b,w=M;y<w;y+=3){let T=y,R=y+1,x=y+2;s=Ya(this,d,t,n,l,h,f,T,R,x),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,m.start),v=Math.min(c.count,m.start+m.count);for(let p=g,d=v;p<d;p+=3){let b=p,M=p+1,y=p+2;s=Ya(this,a,t,n,l,h,f,b,M,y),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function wp(i,t,e,n,s,r,a,o){let c;if(t.side===rn?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,t.side===pi,o),c===null)return null;qa.copy(o),qa.applyMatrix4(i.matrixWorld);let l=e.ray.origin.distanceTo(qa);return l<e.near||l>e.far?null:{distance:l,point:qa.clone(),object:i}}function Ya(i,t,e,n,s,r,a,o,c,l){i.getVertexPosition(o,Ga),i.getVertexPosition(c,Va),i.getVertexPosition(l,Wa);let h=wp(i,t,e,n,Ga,Va,Wa,Fu);if(h){let f=new L;ui.getBarycoord(Fu,Ga,Va,Wa,f),s&&(h.uv=ui.getInterpolatedAttribute(s,o,c,l,f,new Ut)),r&&(h.uv1=ui.getInterpolatedAttribute(r,o,c,l,f,new Ut)),a&&(h.normal=ui.getInterpolatedAttribute(a,o,c,l,f,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:c,c:l,normal:new L,materialIndex:0};ui.getNormal(Ga,Va,Wa,u.normal),h.face=u,h.barycoord=f}return h}var zr=class extends fn{constructor(t=null,e=1,n=1,s,r,a,o,c,l=Qe,h=Qe,f,u){super(null,a,o,c,l,h,s,r,f,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Qn=class extends We{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Ns=new oe,Bu=new oe,Za=[],Ou=new Kn,Tp=new oe,br=new st,Mr=new mi,ke=class extends st{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Qn(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Tp)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Kn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ns),Ou.copy(t.boundingBox).applyMatrix4(Ns),this.boundingBox.union(Ou)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new mi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ns),Mr.copy(t.boundingSphere).applyMatrix4(Ns),this.boundingSphere.union(Mr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(br.geometry=this.geometry,br.material=this.material,br.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Mr.copy(this.boundingSphere),Mr.applyMatrix4(n),t.ray.intersectsSphere(Mr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ns),Bu.multiplyMatrices(n,Ns),br.matrixWorld=Bu,br.raycast(t,Za);for(let a=0,o=Za.length;a<o;a++){let c=Za[a];c.instanceId=r,c.object=this,e.push(c)}Za.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Qn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new zr(new Float32Array(s*this.count),s,this.count,qo,In));let r=this.morphTexture.source.data.data,a=0;for(let l=0;l<n.length;l++)a+=n[l];let o=this.geometry.morphTargetsRelative?1:1-a,c=s*t;return r[c]=o,r.set(n,c+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},zc=new L,Ap=new L,Rp=new Xt,Yn=class{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=zc.subVectors(n,e).cross(Ap.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(zc),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Rp.getNormalMatrix(t),s=this.coplanarPoint(zc).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},es=new mi,Cp=new Ut(.5,.5),$a=new L,Ws=class{constructor(t=new Yn,e=new Yn,n=new Yn,s=new Yn,r=new Yn,a=new Yn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=On,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],c=r[2],l=r[3],h=r[4],f=r[5],u=r[6],m=r[7],g=r[8],v=r[9],p=r[10],d=r[11],b=r[12],M=r[13],y=r[14],w=r[15];if(s[0].setComponents(l-a,m-h,d-g,w-b).normalize(),s[1].setComponents(l+a,m+h,d+g,w+b).normalize(),s[2].setComponents(l+o,m+f,d+v,w+M).normalize(),s[3].setComponents(l-o,m-f,d-v,w-M).normalize(),n)s[4].setComponents(c,u,p,y).normalize(),s[5].setComponents(l-c,m-u,d-p,w-y).normalize();else if(s[4].setComponents(l-c,m-u,d-p,w-y).normalize(),e===On)s[5].setComponents(l+c,m+u,d+p,w+y).normalize();else if(e===Os)s[5].setComponents(c,u,p,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),es.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),es.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(es)}intersectsSprite(t){es.center.set(0,0,0);let e=Cp.distanceTo(t.center);return es.radius=.7071067811865476+e,es.applyMatrix4(t.matrixWorld),this.intersectsSphere(es)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if($a.x=s.normal.x>0?t.max.x:t.min.x,$a.y=s.normal.y>0?t.max.y:t.min.y,$a.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint($a)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var vo=class extends jn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new wt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},_o=new L,yo=new L,zu=new oe,Er=new Or,Ja=new mi,kc=new L,ku=new L,bo=class extends _e{constructor(t=new ye,e=new vo){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)_o.fromBufferAttribute(e,s-1),yo.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=_o.distanceTo(yo);t.setAttribute("lineDistance",new jt(n,1))}else Nt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ja.copy(n.boundingSphere),Ja.applyMatrix4(s),Ja.radius+=r,t.ray.intersectsSphere(Ja)===!1)return;zu.copy(s).invert(),Er.copy(t.ray).applyMatrix4(zu);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){let m=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let v=m,p=g-1;v<p;v+=l){let d=h.getX(v),b=h.getX(v+1),M=Ka(this,t,Er,c,d,b,v);M&&e.push(M)}if(this.isLineLoop){let v=h.getX(g-1),p=h.getX(m),d=Ka(this,t,Er,c,v,p,g-1);d&&e.push(d)}}else{let m=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let v=m,p=g-1;v<p;v+=l){let d=Ka(this,t,Er,c,v,v+1,v);d&&e.push(d)}if(this.isLineLoop){let v=Ka(this,t,Er,c,g-1,m,g-1);v&&e.push(v)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Ka(i,t,e,n,s,r,a){let o=i.geometry.attributes.position;if(_o.fromBufferAttribute(o,s),yo.fromBufferAttribute(o,r),e.distanceSqToSegment(_o,yo,kc,ku)>n)return;kc.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(kc);if(!(l<t.near||l>t.far))return{distance:l,point:ku.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}var Hu=new L,Gu=new L,kr=class extends bo{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[];for(let s=0,r=e.count;s<r;s+=2)Hu.fromBufferAttribute(e,s),Gu.fromBufferAttribute(e,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Hu.distanceTo(Gu);t.setAttribute("lineDistance",new jt(n,1))}else Nt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}};var Hr=class extends fn{constructor(t=[],e=zi,n,s,r,a,o,c,l,h){super(t,e,n,s,r,a,o,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Xe=class extends fn{constructor(t,e,n,s,r,a,o,c,l){super(t,e,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}};var gi=class extends fn{constructor(t,e,n=kn,s,r,a,o=Qe,c=Qe,l,h=$n,f=1){if(h!==$n&&h!==Hi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:e,depth:f};super(u,s,r,a,o,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new ks(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Mo=class extends gi{constructor(t,e=kn,n=zi,s,r,a=Qe,o=Qe,c,l=$n){let h={width:t,height:t,depth:1},f=[h,h,h,h,h,h];super(t,t,e,n,s,r,a,o,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Gr=class extends fn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},gt=class i extends ye{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let c=[],l=[],h=[],f=[],u=0,m=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new jt(l,3)),this.setAttribute("normal",new jt(h,3)),this.setAttribute("uv",new jt(f,2));function g(v,p,d,b,M,y,w,T,R,x,E){let A=y/R,I=w/x,D=y/2,P=w/2,H=T/2,z=R+1,W=x+1,q=0,Z=0,et=new L;for(let rt=0;rt<W;rt++){let it=rt*I-P;for(let at=0;at<z;at++){let Ht=at*A-D;et[v]=Ht*b,et[p]=it*M,et[d]=H,l.push(et.x,et.y,et.z),et[v]=0,et[p]=0,et[d]=T>0?1:-1,h.push(et.x,et.y,et.z),f.push(at/R),f.push(1-rt/x),q+=1}}for(let rt=0;rt<x;rt++)for(let it=0;it<R;it++){let at=u+it+z*rt,Ht=u+it+z*(rt+1),Gt=u+(it+1)+z*(rt+1),Vt=u+(it+1)+z*rt;c.push(at,Ht,Vt),c.push(Ht,Gt,Vt),Z+=6}o.addGroup(m,Z,E),m+=Z,u+=q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Vr=class i extends ye{constructor(t=1,e=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:s,heightSegments:r},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let a=[],o=[],c=[],l=[],h=e/2,f=Math.PI/2*t,u=e,m=2*f+u,g=n*2+r,v=s+1,p=new L,d=new L;for(let b=0;b<=g;b++){let M=0,y=0,w=0,T=0;if(b<=n){let E=b/n,A=E*Math.PI/2;y=-h-t*Math.cos(A),w=t*Math.sin(A),T=-t*Math.cos(A),M=E*f}else if(b<=n+r){let E=(b-n)/r;y=-h+E*e,w=t,T=0,M=f+E*u}else{let E=(b-n-r)/n,A=E*Math.PI/2;y=h+t*Math.sin(A),w=t*Math.cos(A),T=t*Math.sin(A),M=f+u+E*f}let R=Math.max(0,Math.min(1,M/m)),x=0;b===0?x=.5/s:b===g&&(x=-.5/s);for(let E=0;E<=s;E++){let A=E/s,I=A*Math.PI*2,D=Math.sin(I),P=Math.cos(I);d.x=-w*P,d.y=y,d.z=w*D,o.push(d.x,d.y,d.z),p.set(-w*P,T,w*D),p.normalize(),c.push(p.x,p.y,p.z),l.push(A+x,R)}if(b>0){let E=(b-1)*v;for(let A=0;A<s;A++){let I=E+A,D=E+A+1,P=b*v+A,H=b*v+A+1;a.push(I,D,P),a.push(D,H,P)}}}this.setIndex(a),this.setAttribute("position",new jt(o,3)),this.setAttribute("normal",new jt(c,3)),this.setAttribute("uv",new jt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}},Wr=class i extends ye{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);let r=[],a=[],o=[],c=[],l=new L,h=new Ut;a.push(0,0,0),o.push(0,0,1),c.push(.5,.5);for(let f=0,u=3;f<=e;f++,u+=3){let m=n+f/e*s;l.x=t*Math.cos(m),l.y=t*Math.sin(m),a.push(l.x,l.y,l.z),o.push(0,0,1),h.x=(a[u]/t+1)/2,h.y=(a[u+1]/t+1)/2,c.push(h.x,h.y)}for(let f=1;f<=e;f++)r.push(f,f+1,0);this.setIndex(r),this.setAttribute("position",new jt(a,3)),this.setAttribute("normal",new jt(o,3)),this.setAttribute("uv",new jt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.segments,t.thetaStart,t.thetaLength)}},Ne=class i extends ye{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let h=[],f=[],u=[],m=[],g=0,v=[],p=n/2,d=0;b(),a===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new jt(f,3)),this.setAttribute("normal",new jt(u,3)),this.setAttribute("uv",new jt(m,2));function b(){let y=new L,w=new L,T=0,R=(e-t)/n;for(let x=0;x<=r;x++){let E=[],A=x/r,I=A*(e-t)+t;for(let D=0;D<=s;D++){let P=D/s,H=P*c+o,z=Math.sin(H),W=Math.cos(H);w.x=I*z,w.y=-A*n+p,w.z=I*W,f.push(w.x,w.y,w.z),y.set(z,R,W).normalize(),u.push(y.x,y.y,y.z),m.push(P,1-A),E.push(g++)}v.push(E)}for(let x=0;x<s;x++)for(let E=0;E<r;E++){let A=v[E][x],I=v[E+1][x],D=v[E+1][x+1],P=v[E][x+1];(t>0||E!==0)&&(h.push(A,I,P),T+=3),(e>0||E!==r-1)&&(h.push(I,D,P),T+=3)}l.addGroup(d,T,0),d+=T}function M(y){let w=g,T=new Ut,R=new L,x=0,E=y===!0?t:e,A=y===!0?1:-1;for(let D=1;D<=s;D++)f.push(0,p*A,0),u.push(0,A,0),m.push(.5,.5),g++;let I=g;for(let D=0;D<=s;D++){let H=D/s*c+o,z=Math.cos(H),W=Math.sin(H);R.x=E*W,R.y=p*A,R.z=E*z,f.push(R.x,R.y,R.z),u.push(0,A,0),T.x=z*.5+.5,T.y=W*.5*A+.5,m.push(T.x,T.y),g++}for(let D=0;D<s;D++){let P=w+D,H=I+D;y===!0?h.push(H,H+1,P):h.push(H+1,H,P),x+=3}l.addGroup(d,x,y===!0?1:2),d+=x}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ti=class i extends Ne{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Eo=class i extends ye{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],a=[];o(s),l(n),h(),this.setAttribute("position",new jt(r,3)),this.setAttribute("normal",new jt(r.slice(),3)),this.setAttribute("uv",new jt(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(b){let M=new L,y=new L,w=new L;for(let T=0;T<e.length;T+=3)m(e[T+0],M),m(e[T+1],y),m(e[T+2],w),c(M,y,w,b)}function c(b,M,y,w){let T=w+1,R=[];for(let x=0;x<=T;x++){R[x]=[];let E=b.clone().lerp(y,x/T),A=M.clone().lerp(y,x/T),I=T-x;for(let D=0;D<=I;D++)D===0&&x===T?R[x][D]=E:R[x][D]=E.clone().lerp(A,D/I)}for(let x=0;x<T;x++)for(let E=0;E<2*(T-x)-1;E++){let A=Math.floor(E/2);E%2===0?(u(R[x][A+1]),u(R[x+1][A]),u(R[x][A])):(u(R[x][A+1]),u(R[x+1][A+1]),u(R[x+1][A]))}}function l(b){let M=new L;for(let y=0;y<r.length;y+=3)M.x=r[y+0],M.y=r[y+1],M.z=r[y+2],M.normalize().multiplyScalar(b),r[y+0]=M.x,r[y+1]=M.y,r[y+2]=M.z}function h(){let b=new L;for(let M=0;M<r.length;M+=3){b.x=r[M+0],b.y=r[M+1],b.z=r[M+2];let y=p(b)/2/Math.PI+.5,w=d(b)/Math.PI+.5;a.push(y,1-w)}g(),f()}function f(){for(let b=0;b<a.length;b+=6){let M=a[b+0],y=a[b+2],w=a[b+4],T=Math.max(M,y,w),R=Math.min(M,y,w);T>.9&&R<.1&&(M<.2&&(a[b+0]+=1),y<.2&&(a[b+2]+=1),w<.2&&(a[b+4]+=1))}}function u(b){r.push(b.x,b.y,b.z)}function m(b,M){let y=b*3;M.x=t[y+0],M.y=t[y+1],M.z=t[y+2]}function g(){let b=new L,M=new L,y=new L,w=new L,T=new Ut,R=new Ut,x=new Ut;for(let E=0,A=0;E<r.length;E+=9,A+=6){b.set(r[E+0],r[E+1],r[E+2]),M.set(r[E+3],r[E+4],r[E+5]),y.set(r[E+6],r[E+7],r[E+8]),T.set(a[A+0],a[A+1]),R.set(a[A+2],a[A+3]),x.set(a[A+4],a[A+5]),w.copy(b).add(M).add(y).divideScalar(3);let I=p(w);v(T,A+0,b,I),v(R,A+2,M,I),v(x,A+4,y,I)}}function v(b,M,y,w){w<0&&b.x===1&&(a[M]=b.x-1),y.x===0&&y.z===0&&(a[M]=w/2/Math.PI+.5)}function p(b){return Math.atan2(b.z,-b.x)}function d(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var Xr=class i extends Eo{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var ce=class i extends ye{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),c=Math.floor(s),l=o+1,h=c+1,f=t/o,u=e/c,m=[],g=[],v=[],p=[];for(let d=0;d<h;d++){let b=d*u-a;for(let M=0;M<l;M++){let y=M*f-r;g.push(y,-b,0),v.push(0,0,1),p.push(M/o),p.push(1-d/c)}}for(let d=0;d<c;d++)for(let b=0;b<o;b++){let M=b+l*d,y=b+l*(d+1),w=b+1+l*(d+1),T=b+1+l*d;m.push(M,y,T),m.push(y,w,T)}this.setIndex(m),this.setAttribute("position",new jt(g,3)),this.setAttribute("normal",new jt(v,3)),this.setAttribute("uv",new jt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var sn=class i extends ye{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let c=Math.min(a+o,Math.PI),l=0,h=[],f=new L,u=new L,m=[],g=[],v=[],p=[];for(let d=0;d<=n;d++){let b=[],M=d/n,y=a+M*o,w=t*Math.cos(y),T=Math.sqrt(t*t-w*w),R=0;d===0&&a===0?R=.5/e:d===n&&c===Math.PI&&(R=-.5/e);for(let x=0;x<=e;x++){let E=x/e,A=s+E*r;f.x=-T*Math.cos(A),f.y=w,f.z=T*Math.sin(A),g.push(f.x,f.y,f.z),u.copy(f).normalize(),v.push(u.x,u.y,u.z),p.push(E+R,1-M),b.push(l++)}h.push(b)}for(let d=0;d<n;d++)for(let b=0;b<e;b++){let M=h[d][b+1],y=h[d][b],w=h[d+1][b],T=h[d+1][b+1];(d!==0||a>0)&&m.push(M,y,T),(d!==n-1||c<Math.PI)&&m.push(y,w,T)}this.setIndex(m),this.setAttribute("position",new jt(g,3)),this.setAttribute("normal",new jt(v,3)),this.setAttribute("uv",new jt(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var xi=class i extends ye{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let c=[],l=[],h=[],f=[],u=new L,m=new L,g=new L;for(let v=0;v<=n;v++){let p=a+v/n*o;for(let d=0;d<=s;d++){let b=d/s*r;m.x=(t+e*Math.cos(p))*Math.cos(b),m.y=(t+e*Math.cos(p))*Math.sin(b),m.z=e*Math.sin(p),l.push(m.x,m.y,m.z),u.x=t*Math.cos(b),u.y=t*Math.sin(b),g.subVectors(m,u).normalize(),h.push(g.x,g.y,g.z),f.push(d/s),f.push(v/n)}}for(let v=1;v<=n;v++)for(let p=1;p<=s;p++){let d=(s+1)*v+p-1,b=(s+1)*(v-1)+p-1,M=(s+1)*(v-1)+p,y=(s+1)*v+p;c.push(d,b,y),c.push(b,M,y)}this.setIndex(c),this.setAttribute("position",new jt(l,3)),this.setAttribute("normal",new jt(h,3)),this.setAttribute("uv",new jt(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}};function ds(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(Vu(s))s.isRenderTargetTexture?(Nt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(Vu(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function un(i){let t={};for(let e=0;e<i.length;e++){let n=ds(i[e]);for(let s in n)t[s]=n[s]}return t}function Vu(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Ip(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function xh(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ie.workingColorSpace}var Ld={clone:ds,merge:un},Pp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Lp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,tn=class extends jn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Pp,this.fragmentShader=Lp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ds(t.uniforms),this.uniformsGroups=Ip(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new wt().setHex(s.value);break;case"v2":this.uniforms[n].value=new Ut().fromArray(s.value);break;case"v3":this.uniforms[n].value=new L().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Fe().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Xt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new oe().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},So=class extends tn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Qt=class extends jn{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new wt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Tl,this.normalScale=new Ut(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Sn,this.combine=zo,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},wo=class extends jn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=vd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},To=class extends jn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function ja(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}var Ni=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Ao=class extends Ni{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Vc,endingEnd:Vc}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],c=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Wc:r=t,o=2*e-n;break;case Xc:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Wc:a=t,c=2*n-e;break;case Xc:a=1,c=n+s[1]-s[0];break;default:a=t-1,c=e}let l=(n-e)*.5,h=this.valueSize;this._weightPrev=l/(e-o),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,h=this._offsetPrev,f=this._offsetNext,u=this._weightPrev,m=this._weightNext,g=(n-e)/(s-e),v=g*g,p=v*g,d=-u*p+2*u*v-u*g,b=(1+u)*p+(-1.5-2*u)*v+(-.5+u)*g+1,M=(-1-m)*p+(1.5+m)*v+.5*g,y=m*p-m*v;for(let w=0;w!==o;++w)r[w]=d*a[h+w]+b*a[l+w]+M*a[c+w]+y*a[f+w];return r}},Ro=class extends Ni{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,h=(n-e)/(s-e),f=1-h;for(let u=0;u!==o;++u)r[u]=a[l+u]*f+a[c+u]*h;return r}},Co=class extends Ni{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Io=class extends Ni{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=t*o,l=c-o,h=this.inTangents,f=this.outTangents;if(!h||!f){let g=(n-e)/(s-e),v=1-g;for(let p=0;p!==o;++p)r[p]=a[l+p]*v+a[c+p]*g;return r}let u=o*2,m=t-1;for(let g=0;g!==o;++g){let v=a[l+g],p=a[c+g],d=m*u+g*2,b=f[d],M=f[d+1],y=t*u+g*2,w=h[y],T=h[y+1],R=(n-e)/(s-e),x,E,A,I,D;for(let P=0;P<8;P++){x=R*R,E=x*R,A=1-R,I=A*A,D=I*A;let z=D*e+3*I*R*b+3*A*x*w+E*s-n;if(Math.abs(z)<1e-10)break;let W=3*I*(b-e)+6*A*R*(w-b)+3*x*(s-w);if(Math.abs(W)<1e-10)break;R=R-z/W,R=Math.max(0,Math.min(1,R))}r[g]=D*v+3*I*R*M+3*A*x*T+E*p}return r}},wn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=ja(e,this.TimeBufferType),this.values=ja(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:ja(t.times,Array),values:ja(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Co(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Ro(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Ao(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new Io(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Tr:e=this.InterpolantFactoryMethodDiscrete;break;case fo:e=this.InterpolantFactoryMethodLinear;break;case eo:e=this.InterpolantFactoryMethodSmooth;break;case Gc:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Nt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Tr;case this.InterpolantFactoryMethodLinear:return fo;case this.InterpolantFactoryMethodSmooth:return eo;case this.InterpolantFactoryMethodBezier:return Gc}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Bt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Bt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let c=n[o];if(typeof c=="number"&&isNaN(c)){Bt("KeyframeTrack: Time is not a valid number.",this,o,c),t=!1;break}if(a!==null&&a>c){Bt("KeyframeTrack: Out of order keys.",this,o,c,a),t=!1;break}a=c}if(s!==void 0&&Zf(s))for(let o=0,c=s.length;o!==c;++o){let l=s[o];if(isNaN(l)){Bt("KeyframeTrack: Value is not a valid number.",this,o,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===eo,r=t.length-1,a=1;for(let o=1;o<r;++o){let c=!1,l=t[o],h=t[o+1];if(l!==h&&(o!==1||l!==t[0]))if(s)c=!0;else{let f=o*n,u=f-n,m=f+n;for(let g=0;g!==n;++g){let v=e[f+g];if(v!==e[u+g]||v!==e[m+g]){c=!0;break}}}if(c){if(o!==a){t[a]=t[o];let f=o*n,u=a*n;for(let m=0;m!==n;++m)e[u+m]=e[f+m]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,c=a*n,l=0;l!==n;++l)e[c+l]=e[o+l];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};wn.prototype.ValueTypeName="";wn.prototype.TimeBufferType=Float32Array;wn.prototype.ValueBufferType=Float32Array;wn.prototype.DefaultInterpolation=fo;var Ui=class extends wn{constructor(t,e,n){super(t,e,n)}};Ui.prototype.ValueTypeName="bool";Ui.prototype.ValueBufferType=Array;Ui.prototype.DefaultInterpolation=Tr;Ui.prototype.InterpolantFactoryMethodLinear=void 0;Ui.prototype.InterpolantFactoryMethodSmooth=void 0;var Po=class extends wn{constructor(t,e,n,s){super(t,e,n,s)}};Po.prototype.ValueTypeName="color";var Lo=class extends wn{constructor(t,e,n,s){super(t,e,n,s)}};Lo.prototype.ValueTypeName="number";var Do=class extends Ni{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,c=(n-e)/(s-e),l=t*o;for(let h=l+o;l!==h;l+=4)Ye.slerpFlat(r,0,a,l-o,a,l,c);return r}},qr=class extends wn{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new Do(this.times,this.values,this.getValueSize(),t)}};qr.prototype.ValueTypeName="quaternion";qr.prototype.InterpolantFactoryMethodSmooth=void 0;var Fi=class extends wn{constructor(t,e,n){super(t,e,n)}};Fi.prototype.ValueTypeName="string";Fi.prototype.ValueBufferType=Array;Fi.prototype.DefaultInterpolation=Tr;Fi.prototype.InterpolantFactoryMethodLinear=void 0;Fi.prototype.InterpolantFactoryMethodSmooth=void 0;var No=class extends wn{constructor(t,e,n,s){super(t,e,n,s)}};No.prototype.ValueTypeName="vector";var Uo=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,c,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,f){return l.push(h,f),this},this.removeHandler=function(h){let f=l.indexOf(h);return f!==-1&&l.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=l.length;f<u;f+=2){let m=l[f],g=l[f+1];if(m.global&&(m.lastIndex=0),m.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Dd=new Uo,Fo=class{constructor(t){this.manager=t!==void 0?t:Dd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Fo.DEFAULT_MATERIAL_NAME="__DEFAULT";var os=class extends _e{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new wt(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},ls=class extends os{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(_e.DEFAULT_UP),this.updateMatrix(),this.groundColor=new wt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Hc=new oe,Wu=new L,Xu=new L,Yr=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ut(512,512),this.mapType=vn,this.map=null,this.mapPass=null,this.matrix=new oe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ws,this._frameExtents=new Ut(1,1),this._viewportCount=1,this._viewports=[new Fe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Wu.setFromMatrixPosition(t.matrixWorld),e.position.copy(Wu),Xu.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Xu),e.updateMatrixWorld(),Hc.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Hc,e.coordinateSystem,e.reversedDepth),e.coordinateSystem===Os||e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Hc)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Qa=new L,to=new Ye,qn=new L,Zr=class extends _e{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new oe,this.projectionMatrix=new oe,this.projectionMatrixInverse=new oe,this.coordinateSystem=On,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Qa,to,qn),qn.x===1&&qn.y===1&&qn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qa,to,qn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Qa,to,qn),qn.x===1&&qn.y===1&&qn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qa,to,qn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Ii=new L,qu=new Ut,Yu=new Ut,ze=class extends Zr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=as*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Sr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return as*2*Math.atan(Math.tan(Sr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Ii.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Ii.x,Ii.y).multiplyScalar(-t/Ii.z),Ii.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Ii.x,Ii.y).multiplyScalar(-t/Ii.z)}getViewSize(t,e){return this.getViewBounds(t,qu,Yu),e.subVectors(Yu,qu)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Sr*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,e-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Yc=class extends Yr{constructor(){super(new ze(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){let e=this.camera,n=as*2*t.angle*this.focus,s=this.mapSize.width/this.mapSize.height*this.aspect,r=t.distance||e.far;(n!==e.fov||s!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=s,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this}},$r=class extends os{constructor(t,e,n=0,s=Math.PI/3,r=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(_e.DEFAULT_UP),this.updateMatrix(),this.target=new _e,this.distance=n,this.angle=s,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Yc}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.map=t.map,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.angle=this.angle,e.object.decay=this.decay,e.object.penumbra=this.penumbra,e.object.target=this.target.uuid,this.map&&this.map.isTexture&&(e.object.map=this.map.toJSON(t).uuid),e.object.shadow=this.shadow.toJSON(),e}},Zc=class extends Yr{constructor(){super(new ze(90,1,.5,500)),this.isPointLightShadow=!0}},Jr=class extends os{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Zc}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},Bi=class extends Zr{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,c=s-e;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=h*this.view.offsetY,c=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},$c=class extends Yr{constructor(){super(new Bi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Oi=class extends os{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(_e.DEFAULT_UP),this.updateMatrix(),this.target=new _e,this.shadow=new $c}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var Kr=class extends ye{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){let t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}};var Us=-90,Fs=1,Bo=class extends _e{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new ze(Us,Fs,t,e);s.layers=this.layers,this.add(s);let r=new ze(Us,Fs,t,e);r.layers=this.layers,this.add(r);let a=new ze(Us,Fs,t,e);a.layers=this.layers,this.add(a);let o=new ze(Us,Fs,t,e);o.layers=this.layers,this.add(o);let c=new ze(Us,Fs,t,e);c.layers=this.layers,this.add(c);let l=new ze(Us,Fs,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,c]=e;for(let l of e)this.remove(l);if(t===On)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Os)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,c,l,h]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let p=!1;t.isWebGLRenderer===!0?p=t.state.buffers.depth.getReversed():p=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),p&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(f,u,m),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},Oo=class extends ze{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var vh="\\[\\]\\.:\\/",Dp=new RegExp("["+vh+"]","g"),_h="[^"+vh+"]",Np="[^"+vh.replace("\\.","")+"]",Up=/((?:WC+[\/:])*)/.source.replace("WC",_h),Fp=/(WCOD+)?/.source.replace("WCOD",Np),Bp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",_h),Op=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",_h),zp=new RegExp("^"+Up+Fp+Bp+Op+"$"),kp=["material","materials","bones","map"],Jc=class{constructor(t,e,n){let s=n||De.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},De=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(Dp,"")}static parseTrackName(t){let e=zp.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);kp.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let c=n(o.children);if(c)return c}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Nt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){Bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Bt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Bt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===l){l=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Bt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Bt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Bt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){Bt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let a=t[s];if(a===void 0){let l=e.nodeName;Bt("PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Bt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(c=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};De.Composite=Jc;De.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};De.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};De.prototype.GetterByBindingType=[De.prototype._getValue_direct,De.prototype._getValue_array,De.prototype._getValue_arrayElement,De.prototype._getValue_toArray];De.prototype.SetterByBindingTypeAndVersioning=[[De.prototype._setValue_direct,De.prototype._setValue_direct_setNeedsUpdate,De.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[De.prototype._setValue_array,De.prototype._setValue_array_setNeedsUpdate,De.prototype._setValue_array_setMatrixWorldNeedsUpdate],[De.prototype._setValue_arrayElement,De.prototype._setValue_arrayElement_setNeedsUpdate,De.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[De.prototype._setValue_fromArray,De.prototype._setValue_fromArray_setNeedsUpdate,De.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var __=new Float32Array(1);var Kc=class i{static{i.prototype.isMatrix2=!0}constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};function yh(i,t,e,n){let s=Hp(n);switch(e){case fh:return i*t;case qo:return i*t/s.components*s.byteLength;case Yo:return i*t/s.components*s.byteLength;case Gi:return i*t*2/s.components*s.byteLength;case Zo:return i*t*2/s.components*s.byteLength;case ph:return i*t*3/s.components*s.byteLength;case Pn:return i*t*4/s.components*s.byteLength;case $o:return i*t*4/s.components*s.byteLength;case ea:case na:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ia:case sa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ko:case Qo:return Math.max(i,16)*Math.max(t,8)/4;case Jo:case jo:return Math.max(i,8)*Math.max(t,8)/2;case tl:case el:case il:case sl:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case nl:case ra:case rl:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case al:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ol:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case ll:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case cl:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case hl:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case ul:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case dl:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case fl:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case pl:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case ml:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case gl:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case xl:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case vl:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case _l:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case yl:case bl:case Ml:return Math.ceil(i/4)*Math.ceil(t/4)*16;case El:case Sl:return Math.ceil(i/4)*Math.ceil(t/4)*8;case aa:case wl:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Hp(i){switch(i){case vn:case ch:return{byteLength:1,components:1};case qs:case hh:case ni:return{byteLength:2,components:1};case Wo:case Xo:return{byteLength:2,components:4};case kn:case Vo:case In:return{byteLength:4,components:1};case uh:case dh:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));typeof window<"u"&&(window.__THREE__?Nt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");function nf(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function qp(i){let t=new WeakMap;function e(o,c){let l=o.array,h=o.usage,f=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,h),o.onUploadCallback();let m;if(l instanceof Float32Array)m=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)m=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)m=i.SHORT;else if(l instanceof Uint32Array)m=i.UNSIGNED_INT;else if(l instanceof Int32Array)m=i.INT;else if(l instanceof Int8Array)m=i.BYTE;else if(l instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:m,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,c,l){let h=c.array,f=c.updateRanges;if(i.bindBuffer(l,o),f.length===0)i.bufferSubData(l,0,h);else{f.sort((m,g)=>m.start-g.start);let u=0;for(let m=1;m<f.length;m++){let g=f[u],v=f[m];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++u,f[u]=v)}f.length=u+1;for(let m=0,g=f.length;m<g;m++){let v=f[m];i.bufferSubData(l,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let c=t.get(o);c&&(i.deleteBuffer(c.buffer),t.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var Yp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Zp=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,$p=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Kp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,jp=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Qp=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,tm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,em=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,nm=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,im=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,sm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,rm=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,am=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,om=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,lm=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,cm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,hm=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,um=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,dm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,fm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,pm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,mm=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,gm=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,xm=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,vm=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,_m=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ym=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,bm=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Mm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Em="gl_FragColor = linearToOutputTexel( gl_FragColor );",Sm=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,wm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Tm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Am=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Rm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cm=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Im=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Pm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Lm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Dm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Nm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Um=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Fm=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Om=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,zm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,km=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Hm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Gm=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Vm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Wm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Xm=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,qm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Ym=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Zm=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,$m=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Jm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Km=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,t0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,e0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,n0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,i0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,s0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,r0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,a0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,o0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,l0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,c0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,h0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,u0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,d0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,f0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,p0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,m0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,g0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,x0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,v0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,y0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,b0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,M0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,E0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,S0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,w0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,T0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,A0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,R0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,C0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,I0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,P0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,L0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,D0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,N0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,U0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,F0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,B0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,O0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,z0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,k0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,H0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,G0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,V0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,W0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,X0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,q0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Y0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Z0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,J0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,K0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,j0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Q0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,tg=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,eg=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ng=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,ig=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,sg=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rg=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,ag=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,og=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,lg=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cg=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,hg=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ug=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,dg=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,fg=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,pg=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,mg=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gg=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xg=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,vg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_g=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yg=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bg=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Mg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Eg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sg=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,wg=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Tg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,$t={alphahash_fragment:Yp,alphahash_pars_fragment:Zp,alphamap_fragment:$p,alphamap_pars_fragment:Jp,alphatest_fragment:Kp,alphatest_pars_fragment:jp,aomap_fragment:Qp,aomap_pars_fragment:tm,batching_pars_vertex:em,batching_vertex:nm,begin_vertex:im,beginnormal_vertex:sm,bsdfs:rm,iridescence_fragment:am,bumpmap_pars_fragment:om,clipping_planes_fragment:lm,clipping_planes_pars_fragment:cm,clipping_planes_pars_vertex:hm,clipping_planes_vertex:um,color_fragment:dm,color_pars_fragment:fm,color_pars_vertex:pm,color_vertex:mm,common:gm,cube_uv_reflection_fragment:xm,defaultnormal_vertex:vm,displacementmap_pars_vertex:_m,displacementmap_vertex:ym,emissivemap_fragment:bm,emissivemap_pars_fragment:Mm,colorspace_fragment:Em,colorspace_pars_fragment:Sm,envmap_fragment:wm,envmap_common_pars_fragment:Tm,envmap_pars_fragment:Am,envmap_pars_vertex:Rm,envmap_physical_pars_fragment:zm,envmap_vertex:Cm,fog_vertex:Im,fog_pars_vertex:Pm,fog_fragment:Lm,fog_pars_fragment:Dm,gradientmap_pars_fragment:Nm,lightmap_pars_fragment:Um,lights_lambert_fragment:Fm,lights_lambert_pars_fragment:Bm,lights_pars_begin:Om,lights_toon_fragment:km,lights_toon_pars_fragment:Hm,lights_phong_fragment:Gm,lights_phong_pars_fragment:Vm,lights_physical_fragment:Wm,lights_physical_pars_fragment:Xm,lights_fragment_begin:qm,lights_fragment_maps:Ym,lights_fragment_end:Zm,lightprobes_pars_fragment:$m,logdepthbuf_fragment:Jm,logdepthbuf_pars_fragment:Km,logdepthbuf_pars_vertex:jm,logdepthbuf_vertex:Qm,map_fragment:t0,map_pars_fragment:e0,map_particle_fragment:n0,map_particle_pars_fragment:i0,metalnessmap_fragment:s0,metalnessmap_pars_fragment:r0,morphinstance_vertex:a0,morphcolor_vertex:o0,morphnormal_vertex:l0,morphtarget_pars_vertex:c0,morphtarget_vertex:h0,normal_fragment_begin:u0,normal_fragment_maps:d0,normal_pars_fragment:f0,normal_pars_vertex:p0,normal_vertex:m0,normalmap_pars_fragment:g0,clearcoat_normal_fragment_begin:x0,clearcoat_normal_fragment_maps:v0,clearcoat_pars_fragment:_0,iridescence_pars_fragment:y0,opaque_fragment:b0,packing:M0,premultiplied_alpha_fragment:E0,project_vertex:S0,dithering_fragment:w0,dithering_pars_fragment:T0,roughnessmap_fragment:A0,roughnessmap_pars_fragment:R0,shadowmap_pars_fragment:C0,shadowmap_pars_vertex:I0,shadowmap_vertex:P0,shadowmask_pars_fragment:L0,skinbase_vertex:D0,skinning_pars_vertex:N0,skinning_vertex:U0,skinnormal_vertex:F0,specularmap_fragment:B0,specularmap_pars_fragment:O0,tonemapping_fragment:z0,tonemapping_pars_fragment:k0,transmission_fragment:H0,transmission_pars_fragment:G0,uv_pars_fragment:V0,uv_pars_vertex:W0,uv_vertex:X0,worldpos_vertex:q0,background_vert:Y0,background_frag:Z0,backgroundCube_vert:$0,backgroundCube_frag:J0,cube_vert:K0,cube_frag:j0,depth_vert:Q0,depth_frag:tg,distance_vert:eg,distance_frag:ng,equirect_vert:ig,equirect_frag:sg,linedashed_vert:rg,linedashed_frag:ag,meshbasic_vert:og,meshbasic_frag:lg,meshlambert_vert:cg,meshlambert_frag:hg,meshmatcap_vert:ug,meshmatcap_frag:dg,meshnormal_vert:fg,meshnormal_frag:pg,meshphong_vert:mg,meshphong_frag:gg,meshphysical_vert:xg,meshphysical_frag:vg,meshtoon_vert:_g,meshtoon_frag:yg,points_vert:bg,points_frag:Mg,shadow_vert:Eg,shadow_frag:Sg,sprite_vert:wg,sprite_frag:Tg},vt={common:{diffuse:{value:new wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xt}},envmap:{envMap:{value:null},envMapRotation:{value:new Xt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xt},normalScale:{value:new Ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new L},probesMax:{value:new L},probesResolution:{value:new L}},points:{diffuse:{value:new wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0},uvTransform:{value:new Xt}},sprite:{diffuse:{value:new wt(16777215)},opacity:{value:1},center:{value:new Ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xt},alphaMap:{value:null},alphaMapTransform:{value:new Xt},alphaTest:{value:0}}},si={basic:{uniforms:un([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.fog]),vertexShader:$t.meshbasic_vert,fragmentShader:$t.meshbasic_frag},lambert:{uniforms:un([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new wt(0)},envMapIntensity:{value:1}}]),vertexShader:$t.meshlambert_vert,fragmentShader:$t.meshlambert_frag},phong:{uniforms:un([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new wt(0)},specular:{value:new wt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:$t.meshphong_vert,fragmentShader:$t.meshphong_frag},standard:{uniforms:un([vt.common,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.roughnessmap,vt.metalnessmap,vt.fog,vt.lights,{emissive:{value:new wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag},toon:{uniforms:un([vt.common,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.gradientmap,vt.fog,vt.lights,{emissive:{value:new wt(0)}}]),vertexShader:$t.meshtoon_vert,fragmentShader:$t.meshtoon_frag},matcap:{uniforms:un([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,{matcap:{value:null}}]),vertexShader:$t.meshmatcap_vert,fragmentShader:$t.meshmatcap_frag},points:{uniforms:un([vt.points,vt.fog]),vertexShader:$t.points_vert,fragmentShader:$t.points_frag},dashed:{uniforms:un([vt.common,vt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$t.linedashed_vert,fragmentShader:$t.linedashed_frag},depth:{uniforms:un([vt.common,vt.displacementmap]),vertexShader:$t.depth_vert,fragmentShader:$t.depth_frag},normal:{uniforms:un([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,{opacity:{value:1}}]),vertexShader:$t.meshnormal_vert,fragmentShader:$t.meshnormal_frag},sprite:{uniforms:un([vt.sprite,vt.fog]),vertexShader:$t.sprite_vert,fragmentShader:$t.sprite_frag},background:{uniforms:{uvTransform:{value:new Xt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$t.background_vert,fragmentShader:$t.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Xt}},vertexShader:$t.backgroundCube_vert,fragmentShader:$t.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$t.cube_vert,fragmentShader:$t.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$t.equirect_vert,fragmentShader:$t.equirect_frag},distance:{uniforms:un([vt.common,vt.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$t.distance_vert,fragmentShader:$t.distance_frag},shadow:{uniforms:un([vt.lights,vt.fog,{color:{value:new wt(0)},opacity:{value:1}}]),vertexShader:$t.shadow_vert,fragmentShader:$t.shadow_frag}};si.physical={uniforms:un([si.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xt},clearcoatNormalScale:{value:new Ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xt},sheen:{value:0},sheenColor:{value:new wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xt},transmissionSamplerSize:{value:new Ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xt},attenuationDistance:{value:0},attenuationColor:{value:new wt(0)},specularColor:{value:new wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xt},anisotropyVector:{value:new Ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xt}}]),vertexShader:$t.meshphysical_vert,fragmentShader:$t.meshphysical_frag};var Cl={r:0,b:0,g:0},Ag=new oe,sf=new Xt;sf.set(-1,0,0,0,1,0,0,0,1);function Rg(i,t,e,n,s,r){let a=new wt(0),o=s===!0?0:1,c,l,h=null,f=0,u=null;function m(b){let M=b.isScene===!0?b.background:null;if(M&&M.isTexture){let y=b.backgroundBlurriness>0;M=t.get(M,y)}return M}function g(b){let M=!1,y=m(b);y===null?p(a,o):y&&y.isColor&&(p(y,1),M=!0);let w=i.xr.getEnvironmentBlendMode();w==="additive"?e.buffers.color.setClear(0,0,0,1,r):w==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||M)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function v(b,M){let y=m(M);y&&(y.isCubeTexture||y.mapping===Qr)?(l===void 0&&(l=new st(new gt(1,1,1),new tn({name:"BackgroundCubeMaterial",uniforms:ds(si.backgroundCube.uniforms),vertexShader:si.backgroundCube.vertexShader,fragmentShader:si.backgroundCube.fragmentShader,side:rn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(w,T,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=y,l.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Ag.makeRotationFromEuler(M.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(sf),l.material.toneMapped=ie.getTransfer(y.colorSpace)!==pe,(h!==y||f!==y.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=y,f=y.version,u=i.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new st(new ce(2,2),new tn({name:"BackgroundMaterial",uniforms:ds(si.background.uniforms),vertexShader:si.background.vertexShader,fragmentShader:si.background.fragmentShader,side:pi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.toneMapped=ie.getTransfer(y.colorSpace)!==pe,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||f!==y.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=y,f=y.version,u=i.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null))}function p(b,M){b.getRGB(Cl,xh(i)),e.buffers.color.setClear(Cl.r,Cl.g,Cl.b,M,r)}function d(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,M=1){a.set(b),o=M,p(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,p(a,o)},render:g,addToRenderList:v,dispose:d}}function Cg(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,a=!1;function o(I,D,P,H,z){let W=!1,q=f(I,H,P,D);r!==q&&(r=q,l(r.object)),W=m(I,H,P,z),W&&g(I,H,P,z),z!==null&&t.update(z,i.ELEMENT_ARRAY_BUFFER),(W||a)&&(a=!1,y(I,D,P,H),z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(z).buffer))}function c(){return i.createVertexArray()}function l(I){return i.bindVertexArray(I)}function h(I){return i.deleteVertexArray(I)}function f(I,D,P,H){let z=H.wireframe===!0,W=n[D.id];W===void 0&&(W={},n[D.id]=W);let q=I.isInstancedMesh===!0?I.id:0,Z=W[q];Z===void 0&&(Z={},W[q]=Z);let et=Z[P.id];et===void 0&&(et={},Z[P.id]=et);let rt=et[z];return rt===void 0&&(rt=u(c()),et[z]=rt),rt}function u(I){let D=[],P=[],H=[];for(let z=0;z<e;z++)D[z]=0,P[z]=0,H[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:P,attributeDivisors:H,object:I,attributes:{},index:null}}function m(I,D,P,H){let z=r.attributes,W=D.attributes,q=0,Z=P.getAttributes();for(let et in Z)if(Z[et].location>=0){let it=z[et],at=W[et];if(at===void 0&&(et==="instanceMatrix"&&I.instanceMatrix&&(at=I.instanceMatrix),et==="instanceColor"&&I.instanceColor&&(at=I.instanceColor)),it===void 0||it.attribute!==at||at&&it.data!==at.data)return!0;q++}return r.attributesNum!==q||r.index!==H}function g(I,D,P,H){let z={},W=D.attributes,q=0,Z=P.getAttributes();for(let et in Z)if(Z[et].location>=0){let it=W[et];it===void 0&&(et==="instanceMatrix"&&I.instanceMatrix&&(it=I.instanceMatrix),et==="instanceColor"&&I.instanceColor&&(it=I.instanceColor));let at={};at.attribute=it,it&&it.data&&(at.data=it.data),z[et]=at,q++}r.attributes=z,r.attributesNum=q,r.index=H}function v(){let I=r.newAttributes;for(let D=0,P=I.length;D<P;D++)I[D]=0}function p(I){d(I,0)}function d(I,D){let P=r.newAttributes,H=r.enabledAttributes,z=r.attributeDivisors;P[I]=1,H[I]===0&&(i.enableVertexAttribArray(I),H[I]=1),z[I]!==D&&(i.vertexAttribDivisor(I,D),z[I]=D)}function b(){let I=r.newAttributes,D=r.enabledAttributes;for(let P=0,H=D.length;P<H;P++)D[P]!==I[P]&&(i.disableVertexAttribArray(P),D[P]=0)}function M(I,D,P,H,z,W,q){q===!0?i.vertexAttribIPointer(I,D,P,z,W):i.vertexAttribPointer(I,D,P,H,z,W)}function y(I,D,P,H){v();let z=H.attributes,W=P.getAttributes(),q=D.defaultAttributeValues;for(let Z in W){let et=W[Z];if(et.location>=0){let rt=z[Z];if(rt===void 0&&(Z==="instanceMatrix"&&I.instanceMatrix&&(rt=I.instanceMatrix),Z==="instanceColor"&&I.instanceColor&&(rt=I.instanceColor)),rt!==void 0){let it=rt.normalized,at=rt.itemSize,Ht=t.get(rt);if(Ht===void 0)continue;let Gt=Ht.buffer,Vt=Ht.type,K=Ht.bytesPerElement,U=Vt===i.INT||Vt===i.UNSIGNED_INT||rt.gpuType===Vo;if(rt.isInterleavedBufferAttribute){let k=rt.data,tt=k.stride,ct=rt.offset;if(k.isInstancedInterleavedBuffer){for(let ot=0;ot<et.locationSize;ot++)d(et.location+ot,k.meshPerAttribute);I.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=k.meshPerAttribute*k.count)}else for(let ot=0;ot<et.locationSize;ot++)p(et.location+ot);i.bindBuffer(i.ARRAY_BUFFER,Gt);for(let ot=0;ot<et.locationSize;ot++)M(et.location+ot,at/et.locationSize,Vt,it,tt*K,(ct+at/et.locationSize*ot)*K,U)}else{if(rt.isInstancedBufferAttribute){for(let k=0;k<et.locationSize;k++)d(et.location+k,rt.meshPerAttribute);I.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let k=0;k<et.locationSize;k++)p(et.location+k);i.bindBuffer(i.ARRAY_BUFFER,Gt);for(let k=0;k<et.locationSize;k++)M(et.location+k,at/et.locationSize,Vt,it,at*K,at/et.locationSize*k*K,U)}}else if(q!==void 0){let it=q[Z];if(it!==void 0)switch(it.length){case 2:i.vertexAttrib2fv(et.location,it);break;case 3:i.vertexAttrib3fv(et.location,it);break;case 4:i.vertexAttrib4fv(et.location,it);break;default:i.vertexAttrib1fv(et.location,it)}}}}b()}function w(){E();for(let I in n){let D=n[I];for(let P in D){let H=D[P];for(let z in H){let W=H[z];for(let q in W)h(W[q].object),delete W[q];delete H[z]}}delete n[I]}}function T(I){if(n[I.id]===void 0)return;let D=n[I.id];for(let P in D){let H=D[P];for(let z in H){let W=H[z];for(let q in W)h(W[q].object),delete W[q];delete H[z]}}delete n[I.id]}function R(I){for(let D in n){let P=n[D];for(let H in P){let z=P[H];if(z[I.id]===void 0)continue;let W=z[I.id];for(let q in W)h(W[q].object),delete W[q];delete z[I.id]}}}function x(I){for(let D in n){let P=n[D],H=I.isInstancedMesh===!0?I.id:0,z=P[H];if(z!==void 0){for(let W in z){let q=z[W];for(let Z in q)h(q[Z].object),delete q[Z];delete z[W]}delete P[H],Object.keys(P).length===0&&delete n[D]}}}function E(){A(),a=!0,r!==s&&(r=s,l(r.object))}function A(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:E,resetDefaultState:A,dispose:w,releaseStatesOfGeometry:T,releaseStatesOfObject:x,releaseStatesOfProgram:R,initAttributes:v,enableAttribute:p,disableUnusedAttributes:b}}function Ig(i,t,e){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function a(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),e.update(l,n,h))}function o(c,l,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let u=0;for(let m=0;m<h;m++)u+=l[m];e.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Pg(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let R=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(R){return!(R!==Pn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let x=R===ni&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==vn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==In&&!x)}function c(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp",h=c(l);h!==l&&(Nt("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let f=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&u===!1&&Nt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),M=i.getParameter(i.MAX_VARYING_VECTORS),y=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=i.getParameter(i.MAX_SAMPLES),T=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:m,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:p,maxAttributes:d,maxVertexUniforms:b,maxVaryings:M,maxFragmentUniforms:y,maxSamples:w,samples:T}}function Lg(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Yn,o=new Xt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){let m=f.length!==0||u||n!==0||s;return s=u,n=f.length,m},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,u){e=h(f,u,0)},this.setState=function(f,u,m){let g=f.clippingPlanes,v=f.clipIntersection,p=f.clipShadows,d=i.get(f);if(!s||g===null||g.length===0||r&&!p)r?h(null):l();else{let b=r?0:n,M=b*4,y=d.clippingState||null;c.value=y,y=h(g,u,M,m);for(let w=0;w!==M;++w)y[w]=e[w];d.clippingState=y,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=b}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(f,u,m,g){let v=f!==null?f.length:0,p=null;if(v!==0){if(p=c.value,g!==!0||p===null){let d=m+v*4,b=u.matrixWorldInverse;o.getNormalMatrix(b),(p===null||p.length<d)&&(p=new Float32Array(d));for(let M=0,y=m;M!==v;++M,y+=4)a.copy(f[M]).applyMatrix4(b,o),a.normal.toArray(p,y),p[y+3]=a.constant}c.value=p,c.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,p}}var Vi=4,Nd=[.125,.215,.35,.446,.526,.582],fs=20,Dg=256,oa=new Bi,Ud=new wt,bh=null,Mh=0,Eh=0,Sh=!1,Ng=new L,Pl=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=Ng}=r;bh=this._renderer.getRenderTarget(),Mh=this._renderer.getActiveCubeFace(),Eh=this._renderer.getActiveMipmapLevel(),Sh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,s,c,o),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Od(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Bd(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(bh,Mh,Eh),this._renderer.xr.enabled=Sh,t.scissorTest=!1,Zs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===zi||t.mapping===hs?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),bh=this._renderer.getRenderTarget(),Mh=this._renderer.getActiveCubeFace(),Eh=this._renderer.getActiveMipmapLevel(),Sh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:nn,minFilter:nn,generateMipmaps:!1,type:ni,format:Pn,colorSpace:Ar,depthBuffer:!1},s=Fd(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Fd(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Ug(r)),this._blurMaterial=Bg(r,t,e),this._ggxMaterial=Fg(r,t,e)}return s}_compileMaterial(t){let e=new st(new ye,t);this._renderer.compile(e,oa)}_sceneToCubeUV(t,e,n,s,r){let c=new ze(90,1,e,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,m=f.toneMapping;f.getClearColor(Ud),f.toneMapping=zn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new st(new gt,new re({name:"PMREM.Background",side:rn,depthWrite:!1,depthTest:!1})));let v=this._backgroundBox,p=v.material,d=!1,b=t.background;b?b.isColor&&(p.color.copy(b),t.background=null,d=!0):(p.color.copy(Ud),d=!0);for(let M=0;M<6;M++){let y=M%3;y===0?(c.up.set(0,l[M],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[M],r.y,r.z)):y===1?(c.up.set(0,0,l[M]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[M],r.z)):(c.up.set(0,l[M],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[M]));let w=this._cubeSize;Zs(s,y*w,M>2?w:0,w,w),f.setRenderTarget(s),d&&f.render(v,c),f.render(t,c)}f.toneMapping=m,f.autoClear=u,t.background=b}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===zi||t.mapping===hs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Od()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Bd());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=t;let c=this._cubeSize;Zs(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,oa)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let c=a.uniforms,l=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),f=Math.sqrt(l*l-h*h),u=0+l*1.25,m=f*u,{_lodMax:g}=this,v=this._sizeLods[n],p=3*v*(n>g-Vi?n-g+Vi:0),d=4*(this._cubeSize-v);c.envMap.value=t.texture,c.roughness.value=m,c.mipInt.value=g-e,Zs(r,p,d,3*v,2*v),s.setRenderTarget(r),s.render(o,oa),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=g-n,Zs(t,p,d,3*v,2*v),s.setRenderTarget(t),s.render(o,oa)}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let c=this._renderer,l=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Bt("blur direction must be either latitudinal or longitudinal!");let h=3,f=this._lodMeshes[s];f.material=l;let u=l.uniforms,m=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*fs-1),v=r/g,p=isFinite(r)?1+Math.floor(h*v):fs;p>fs&&Nt(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${fs}`);let d=[],b=0;for(let R=0;R<fs;++R){let x=R/v,E=Math.exp(-x*x/2);d.push(E),R===0?b+=E:R<p&&(b+=2*E)}for(let R=0;R<d.length;R++)d[R]=d[R]/b;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=d,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:M}=this;u.dTheta.value=g,u.mipInt.value=M-n;let y=this._sizeLods[s],w=3*y*(s>M-Vi?s-M+Vi:0),T=4*(this._cubeSize-y);Zs(e,w,T,3*y,2*y),c.setRenderTarget(e),c.render(f,oa)}};function Ug(i){let t=[],e=[],n=[],s=i,r=i-Vi+1+Nd.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let c=1/o;a>i-Vi?c=Nd[a-i+Vi-1]:a===0&&(c=0),e.push(c);let l=1/(o-2),h=-l,f=1+l,u=[h,h,f,h,f,f,h,h,f,f,h,f],m=6,g=6,v=3,p=2,d=1,b=new Float32Array(v*g*m),M=new Float32Array(p*g*m),y=new Float32Array(d*g*m);for(let T=0;T<m;T++){let R=T%3*2/3-1,x=T>2?0:-1,E=[R,x,0,R+2/3,x,0,R+2/3,x+1,0,R,x,0,R+2/3,x+1,0,R,x+1,0];b.set(E,v*g*T),M.set(u,p*g*T);let A=[T,T,T,T,T,T];y.set(A,d*g*T)}let w=new ye;w.setAttribute("position",new We(b,v)),w.setAttribute("uv",new We(M,p)),w.setAttribute("faceIndex",new We(y,d)),n.push(new st(w,null)),s>Vi&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function Fd(i,t,e){let n=new hn(i,t,e);return n.texture.mapping=Qr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Zs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Fg(i,t,e){return new tn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Dg,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Nl(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:ei,depthTest:!1,depthWrite:!1})}function Bg(i,t,e){let n=new Float32Array(fs),s=new L(0,1,0);return new tn({name:"SphericalGaussianBlur",defines:{n:fs,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ei,depthTest:!1,depthWrite:!1})}function Bd(){return new tn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ei,depthTest:!1,depthWrite:!1})}function Od(){return new tn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ei,depthTest:!1,depthWrite:!1})}function Nl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var Ll=class extends hn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Hr(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new gt(5,5,5),r=new tn({name:"CubemapFromEquirect",uniforms:ds(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:rn,blending:ei});r.uniforms.tEquirect.value=e;let a=new st(s,r),o=e.minFilter;return e.minFilter===ki&&(e.minFilter=nn),new Bo(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}};function Og(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,m=!1){return u==null?null:m?a(u):r(u)}function r(u){if(u&&u.isTexture){let m=u.mapping;if(m===ko||m===Ho)if(t.has(u)){let g=t.get(u).texture;return o(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let v=new Ll(g.height);return v.fromEquirectangularTexture(i,u),t.set(u,v),u.addEventListener("dispose",l),o(v.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let m=u.mapping,g=m===ko||m===Ho,v=m===zi||m===hs;if(g||v){let p=e.get(u),d=p!==void 0?p.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==d)return n===null&&(n=new Pl(i)),p=g?n.fromEquirectangular(u,p):n.fromCubemap(u,p),p.texture.pmremVersion=u.pmremVersion,e.set(u,p),p.texture;if(p!==void 0)return p.texture;{let b=u.image;return g&&b&&b.height>0||v&&b&&c(b)?(n===null&&(n=new Pl(i)),p=g?n.fromEquirectangular(u):n.fromCubemap(u),p.texture.pmremVersion=u.pmremVersion,e.set(u,p),u.addEventListener("dispose",h),p.texture):null}}}return u}function o(u,m){return m===ko?u.mapping=zi:m===Ho&&(u.mapping=hs),u}function c(u){let m=0,g=6;for(let v=0;v<g;v++)u[v]!==void 0&&m++;return m===g}function l(u){let m=u.target;m.removeEventListener("dispose",l);let g=t.get(m);g!==void 0&&(t.delete(m),g.dispose())}function h(u){let m=u.target;m.removeEventListener("dispose",h);let g=e.get(m);g!==void 0&&(e.delete(m),g.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function zg(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&is("WebGLRenderer: "+n+" extension not supported."),s}}}function kg(i,t,e,n){let s={},r=new WeakMap;function a(f){let u=f.target;u.index!==null&&t.remove(u.index);for(let g in u.attributes)t.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete s[u.id];let m=r.get(u);m&&(t.remove(m),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(f,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,e.memory.geometries++),u}function c(f){let u=f.attributes;for(let m in u)t.update(u[m],i.ARRAY_BUFFER)}function l(f){let u=[],m=f.index,g=f.attributes.position,v=0;if(g===void 0)return;if(m!==null){let b=m.array;v=m.version;for(let M=0,y=b.length;M<y;M+=3){let w=b[M+0],T=b[M+1],R=b[M+2];u.push(w,T,T,R,R,w)}}else{let b=g.array;v=g.version;for(let M=0,y=b.length/3-1;M<y;M+=3){let w=M+0,T=M+1,R=M+2;u.push(w,T,T,R,R,w)}}let p=new(g.count>=65535?Ur:Nr)(u,1);p.version=v;let d=r.get(f);d&&t.remove(d),r.set(f,p)}function h(f){let u=r.get(f);if(u){let m=f.index;m!==null&&u.version<m.version&&l(f)}else l(f);return r.get(f)}return{get:o,update:c,getWireframeAttribute:h}}function Hg(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function c(f,u){i.drawElements(n,u,r,f*a),e.update(u,n,1)}function l(f,u,m){m!==0&&(i.drawElementsInstanced(n,u,r,f*a,m),e.update(u,n,m))}function h(f,u,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,f,0,m);let v=0;for(let p=0;p<m;p++)v+=u[p];e.update(v,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function Gg(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Bt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Vg(i,t,e){let n=new WeakMap,s=new Fe;function r(a,o,c){let l=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0,u=n.get(o);if(u===void 0||u.count!==f){let E=function(){R.dispose(),n.delete(o),o.removeEventListener("dispose",E)};u!==void 0&&u.texture.dispose();let m=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],b=o.morphAttributes.color||[],M=0;m===!0&&(M=1),g===!0&&(M=2),v===!0&&(M=3);let y=o.attributes.position.count*M,w=1;y>t.maxTextureSize&&(w=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);let T=new Float32Array(y*w*4*f),R=new Pr(T,y,w,f);R.type=In,R.needsUpdate=!0;let x=M*4;for(let A=0;A<f;A++){let I=p[A],D=d[A],P=b[A],H=y*w*4*A;for(let z=0;z<I.count;z++){let W=z*x;m===!0&&(s.fromBufferAttribute(I,z),T[H+W+0]=s.x,T[H+W+1]=s.y,T[H+W+2]=s.z,T[H+W+3]=0),g===!0&&(s.fromBufferAttribute(D,z),T[H+W+4]=s.x,T[H+W+5]=s.y,T[H+W+6]=s.z,T[H+W+7]=0),v===!0&&(s.fromBufferAttribute(P,z),T[H+W+8]=s.x,T[H+W+9]=s.y,T[H+W+10]=s.z,T[H+W+11]=P.itemSize===4?s.w:1)}}u={count:f,texture:R,size:new Ut(y,w)},n.set(o,u),o.addEventListener("dispose",E)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let m=0;for(let v=0;v<l.length;v++)m+=l[v];let g=o.morphTargetsRelative?1:1-m;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function Wg(i,t,e,n,s){let r=new WeakMap;function a(l){let h=s.render.frame,f=l.geometry,u=t.get(l,f);if(r.get(u)!==h&&(t.update(u),r.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==h&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){let m=l.skeleton;r.get(m)!==h&&(m.update(),r.set(m,h))}return u}function o(){r=new WeakMap}function c(l){let h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}var Xg={[eh]:"LINEAR_TONE_MAPPING",[nh]:"REINHARD_TONE_MAPPING",[ih]:"CINEON_TONE_MAPPING",[sh]:"ACES_FILMIC_TONE_MAPPING",[ah]:"AGX_TONE_MAPPING",[oh]:"NEUTRAL_TONE_MAPPING",[rh]:"CUSTOM_TONE_MAPPING"};function qg(i,t,e,n,s,r){let a=new hn(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,depthTexture:s?new gi(t,e):void 0}),o=new hn(t,e,{type:ni,depthBuffer:!1,stencilBuffer:!1}),c=new ye;c.setAttribute("position",new jt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new jt([0,2,0,0,2,0],2));let l=new So({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new st(c,l),f=new Bi(-1,1,1,-1,0,1),u=null,m=null,g=!1,v,p=null,d=[],b=!1;this.setSize=function(M,y){a.setSize(M,y),o.setSize(M,y);for(let w=0;w<d.length;w++){let T=d[w];T.setSize&&T.setSize(M,y)}},this.setEffects=function(M){d=M,b=d.length>0&&d[0].isRenderPass===!0;let y=a.width,w=a.height;for(let T=0;T<d.length;T++){let R=d[T];R.setSize&&R.setSize(y,w)}},this.begin=function(M,y){if(g||M.toneMapping===zn&&d.length===0)return!1;if(p=y,y!==null){let w=y.width,T=y.height;(a.width!==w||a.height!==T)&&this.setSize(w,T)}return b===!1&&M.setRenderTarget(a),v=M.toneMapping,M.toneMapping=zn,!0},this.hasRenderPass=function(){return b},this.end=function(M,y){M.toneMapping=v,g=!0;let w=a,T=o;for(let R=0;R<d.length;R++){let x=d[R];if(x.enabled!==!1&&(x.render(M,T,w,y),x.needsSwap!==!1)){let E=w;w=T,T=E}}if(u!==M.outputColorSpace||m!==M.toneMapping){u=M.outputColorSpace,m=M.toneMapping,l.defines={},ie.getTransfer(u)===pe&&(l.defines.SRGB_TRANSFER="");let R=Xg[m];R&&(l.defines[R]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=w.texture,M.setRenderTarget(p),M.render(h,f),p=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),c.dispose(),l.dispose()}}var rf=new fn,Ah=new gi(1,1),af=new Pr,of=new xo,lf=new Hr,zd=[],kd=[],Hd=new Float32Array(16),Gd=new Float32Array(9),Vd=new Float32Array(4);function Js(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=zd[s];if(r===void 0&&(r=new Float32Array(s),zd[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function $e(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Je(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Ul(i,t){let e=kd[t];e===void 0&&(e=new Int32Array(t),kd[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Yg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Zg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if($e(e,t))return;i.uniform2fv(this.addr,t),Je(e,t)}}function $g(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if($e(e,t))return;i.uniform3fv(this.addr,t),Je(e,t)}}function Jg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if($e(e,t))return;i.uniform4fv(this.addr,t),Je(e,t)}}function Kg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if($e(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Je(e,t)}else{if($e(e,n))return;Vd.set(n),i.uniformMatrix2fv(this.addr,!1,Vd),Je(e,n)}}function jg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if($e(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Je(e,t)}else{if($e(e,n))return;Gd.set(n),i.uniformMatrix3fv(this.addr,!1,Gd),Je(e,n)}}function Qg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if($e(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Je(e,t)}else{if($e(e,n))return;Hd.set(n),i.uniformMatrix4fv(this.addr,!1,Hd),Je(e,n)}}function tx(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function ex(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if($e(e,t))return;i.uniform2iv(this.addr,t),Je(e,t)}}function nx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if($e(e,t))return;i.uniform3iv(this.addr,t),Je(e,t)}}function ix(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if($e(e,t))return;i.uniform4iv(this.addr,t),Je(e,t)}}function sx(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function rx(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if($e(e,t))return;i.uniform2uiv(this.addr,t),Je(e,t)}}function ax(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if($e(e,t))return;i.uniform3uiv(this.addr,t),Je(e,t)}}function ox(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if($e(e,t))return;i.uniform4uiv(this.addr,t),Je(e,t)}}function lx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ah.compareFunction=e.isReversedDepthBuffer()?Rl:Al,r=Ah):r=rf,e.setTexture2D(t||r,s)}function cx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||of,s)}function hx(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||lf,s)}function ux(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||af,s)}function dx(i){switch(i){case 5126:return Yg;case 35664:return Zg;case 35665:return $g;case 35666:return Jg;case 35674:return Kg;case 35675:return jg;case 35676:return Qg;case 5124:case 35670:return tx;case 35667:case 35671:return ex;case 35668:case 35672:return nx;case 35669:case 35673:return ix;case 5125:return sx;case 36294:return rx;case 36295:return ax;case 36296:return ox;case 35678:case 36198:case 36298:case 36306:case 35682:return lx;case 35679:case 36299:case 36307:return cx;case 35680:case 36300:case 36308:case 36293:return hx;case 36289:case 36303:case 36311:case 36292:return ux}}function fx(i,t){i.uniform1fv(this.addr,t)}function px(i,t){let e=Js(t,this.size,2);i.uniform2fv(this.addr,e)}function mx(i,t){let e=Js(t,this.size,3);i.uniform3fv(this.addr,e)}function gx(i,t){let e=Js(t,this.size,4);i.uniform4fv(this.addr,e)}function xx(i,t){let e=Js(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function vx(i,t){let e=Js(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function _x(i,t){let e=Js(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function yx(i,t){i.uniform1iv(this.addr,t)}function bx(i,t){i.uniform2iv(this.addr,t)}function Mx(i,t){i.uniform3iv(this.addr,t)}function Ex(i,t){i.uniform4iv(this.addr,t)}function Sx(i,t){i.uniform1uiv(this.addr,t)}function wx(i,t){i.uniform2uiv(this.addr,t)}function Tx(i,t){i.uniform3uiv(this.addr,t)}function Ax(i,t){i.uniform4uiv(this.addr,t)}function Rx(i,t,e){let n=this.cache,s=t.length,r=Ul(e,s);$e(n,r)||(i.uniform1iv(this.addr,r),Je(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=Ah:a=rf;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function Cx(i,t,e){let n=this.cache,s=t.length,r=Ul(e,s);$e(n,r)||(i.uniform1iv(this.addr,r),Je(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||of,r[a])}function Ix(i,t,e){let n=this.cache,s=t.length,r=Ul(e,s);$e(n,r)||(i.uniform1iv(this.addr,r),Je(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||lf,r[a])}function Px(i,t,e){let n=this.cache,s=t.length,r=Ul(e,s);$e(n,r)||(i.uniform1iv(this.addr,r),Je(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||af,r[a])}function Lx(i){switch(i){case 5126:return fx;case 35664:return px;case 35665:return mx;case 35666:return gx;case 35674:return xx;case 35675:return vx;case 35676:return _x;case 5124:case 35670:return yx;case 35667:case 35671:return bx;case 35668:case 35672:return Mx;case 35669:case 35673:return Ex;case 5125:return Sx;case 36294:return wx;case 36295:return Tx;case 36296:return Ax;case 35678:case 36198:case 36298:case 36306:case 35682:return Rx;case 35679:case 36299:case 36307:return Cx;case 35680:case 36300:case 36308:case 36293:return Ix;case 36289:case 36303:case 36311:case 36292:return Px}}var Rh=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=dx(e.type)}},Ch=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Lx(e.type)}},Ih=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},wh=/(\w+)(\])?(\[|\.)?/g;function Wd(i,t){i.seq.push(t),i.map[t.id]=t}function Dx(i,t,e){let n=i.name,s=n.length;for(wh.lastIndex=0;;){let r=wh.exec(n),a=wh.lastIndex,o=r[1],c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){Wd(e,l===void 0?new Rh(o,i,t):new Ch(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new Ih(o),Wd(e,f)),e=f}}}var $s=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),c=t.getUniformLocation(e,o.name);Dx(o,c,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function Xd(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var Nx=37297,Ux=0;function Fx(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var qd=new Xt;function Bx(i){ie._getMatrix(qd,ie.workingColorSpace,i);let t=`mat3( ${qd.elements.map(e=>e.toFixed(4))} )`;switch(ie.getTransfer(i)){case Rr:return[t,"LinearTransferOETF"];case pe:return[t,"sRGBTransferOETF"];default:return Nt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Yd(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+Fx(i.getShaderSource(t),o)}else return r}function Ox(i,t){let e=Bx(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var zx={[eh]:"Linear",[nh]:"Reinhard",[ih]:"Cineon",[sh]:"ACESFilmic",[ah]:"AgX",[oh]:"Neutral",[rh]:"Custom"};function kx(i,t){let e=zx[t];return e===void 0?(Nt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Il=new L;function Hx(){ie.getLuminanceCoefficients(Il);let i=Il.x.toFixed(4),t=Il.y.toFixed(4),e=Il.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Gx(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ca).join(`
`)}function Vx(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Wx(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function ca(i){return i!==""}function Zd(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function $d(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Xx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ph(i){return i.replace(Xx,Yx)}var qx=new Map;function Yx(i,t){let e=$t[t];if(e===void 0){let n=qx.get(t);if(n!==void 0)e=$t[n],Nt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Ph(e)}var Zx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Jd(i){return i.replace(Zx,$x)}function $x(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Kd(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var Jx={[jr]:"SHADOWMAP_TYPE_PCF",[Xs]:"SHADOWMAP_TYPE_VSM"};function Kx(i){return Jx[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var jx={[zi]:"ENVMAP_TYPE_CUBE",[hs]:"ENVMAP_TYPE_CUBE",[Qr]:"ENVMAP_TYPE_CUBE_UV"};function Qx(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":jx[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var tv={[hs]:"ENVMAP_MODE_REFRACTION"};function ev(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":tv[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var nv={[zo]:"ENVMAP_BLENDING_MULTIPLY",[md]:"ENVMAP_BLENDING_MIX",[gd]:"ENVMAP_BLENDING_ADD"};function iv(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":nv[i.combine]||"ENVMAP_BLENDING_NONE"}function sv(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function rv(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,c=Kx(e),l=Qx(e),h=ev(e),f=iv(e),u=sv(e),m=Gx(e),g=Vx(r),v=s.createProgram(),p,d,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ca).join(`
`),p.length>0&&(p+=`
`),d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ca).join(`
`),d.length>0&&(d+=`
`)):(p=[Kd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ca).join(`
`),d=[Kd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==zn?"#define TONE_MAPPING":"",e.toneMapping!==zn?$t.tonemapping_pars_fragment:"",e.toneMapping!==zn?kx("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",$t.colorspace_pars_fragment,Ox("linearToOutputTexel",e.outputColorSpace),Hx(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(ca).join(`
`)),a=Ph(a),a=Zd(a,e),a=$d(a,e),o=Ph(o),o=Zd(o,e),o=$d(o,e),a=Jd(a),o=Jd(o),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,d=["#define varying in",e.glslVersion===mh?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===mh?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let M=b+p+a,y=b+d+o,w=Xd(s,s.VERTEX_SHADER,M),T=Xd(s,s.FRAGMENT_SHADER,y);s.attachShader(v,w),s.attachShader(v,T),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function R(I){if(i.debug.checkShaderErrors){let D=s.getProgramInfoLog(v)||"",P=s.getShaderInfoLog(w)||"",H=s.getShaderInfoLog(T)||"",z=D.trim(),W=P.trim(),q=H.trim(),Z=!0,et=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,w,T);else{let rt=Yd(s,w,"vertex"),it=Yd(s,T,"fragment");Bt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+z+`
`+rt+`
`+it)}else z!==""?Nt("WebGLProgram: Program Info Log:",z):(W===""||q==="")&&(et=!1);et&&(I.diagnostics={runnable:Z,programLog:z,vertexShader:{log:W,prefix:p},fragmentShader:{log:q,prefix:d}})}s.deleteShader(w),s.deleteShader(T),x=new $s(s,v),E=Wx(s,v)}let x;this.getUniforms=function(){return x===void 0&&R(this),x};let E;this.getAttributes=function(){return E===void 0&&R(this),E};let A=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return A===!1&&(A=s.getProgramParameter(v,Nx)),A},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Ux++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=w,this.fragmentShader=T,this}var av=0,Lh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Dh(t),e.set(t,n)),n}},Dh=class{constructor(t){this.id=av++,this.code=t,this.usedTimes=0}};function ov(i){return i===Gi||i===ra||i===aa}function lv(i,t,e,n,s,r){let a=new Lr,o=new Lh,c=new Set,l=[],h=new Map,f=n.logarithmicDepthBuffer,u=n.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(x){return c.add(x),x===0?"uv":`uv${x}`}function v(x,E,A,I,D,P){let H=I.fog,z=D.geometry,W=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?I.environment:null,q=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,Z=t.get(x.envMap||W,q),et=Z&&Z.mapping===Qr?Z.image.height:null,rt=m[x.type];x.precision!==null&&(u=n.getMaxPrecision(x.precision),u!==x.precision&&Nt("WebGLProgram.getParameters:",x.precision,"not supported, using",u,"instead."));let it=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,at=it!==void 0?it.length:0,Ht=0;z.morphAttributes.position!==void 0&&(Ht=1),z.morphAttributes.normal!==void 0&&(Ht=2),z.morphAttributes.color!==void 0&&(Ht=3);let Gt,Vt,K,U;if(rt){let Tt=si[rt];Gt=Tt.vertexShader,Vt=Tt.fragmentShader}else{Gt=x.vertexShader,Vt=x.fragmentShader;let Tt=o.getVertexShaderStage(x),Be=o.getFragmentShaderStage(x);o.update(x,Tt,Be),K=Tt.id,U=Be.id}let k=i.getRenderTarget(),tt=i.state.buffers.depth.getReversed(),ct=D.isInstancedMesh===!0,ot=D.isBatchedMesh===!0,Pe=!!x.map,qt=!!x.matcap,ae=!!Z,ne=!!x.aoMap,Wt=!!x.lightMap,zt=!!x.bumpMap&&x.wireframe===!1,me=!!x.normalMap,Ue=!!x.displacementMap,He=!!x.emissiveMap,Le=!!x.metalnessMap,we=!!x.roughnessMap,F=x.anisotropy>0,xn=x.clearcoat>0,ge=x.dispersion>0,C=x.iridescence>0,_=x.sheen>0,O=x.transmission>0,X=F&&!!x.anisotropyMap,$=xn&&!!x.clearcoatMap,lt=xn&&!!x.clearcoatNormalMap,ut=xn&&!!x.clearcoatRoughnessMap,J=C&&!!x.iridescenceMap,Q=C&&!!x.iridescenceThicknessMap,ft=_&&!!x.sheenColorMap,It=_&&!!x.sheenRoughnessMap,xt=!!x.specularMap,pt=!!x.specularColorMap,Dt=!!x.specularIntensityMap,Ft=O&&!!x.transmissionMap,Yt=O&&!!x.thicknessMap,N=!!x.gradientMap,ht=!!x.alphaMap,j=x.alphaTest>0,mt=!!x.alphaHash,bt=!!x.extensions,nt=zn;x.toneMapped&&(k===null||k.isXRRenderTarget===!0)&&(nt=i.toneMapping);let Ct={shaderID:rt,shaderType:x.type,shaderName:x.name,vertexShader:Gt,fragmentShader:Vt,defines:x.defines,customVertexShaderID:K,customFragmentShaderID:U,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:u,batching:ot,batchingColor:ot&&D._colorsTexture!==null,instancing:ct,instancingColor:ct&&D.instanceColor!==null,instancingMorph:ct&&D.morphTexture!==null,outputColorSpace:k===null?i.outputColorSpace:k.isXRRenderTarget===!0?k.texture.colorSpace:ie.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Pe,matcap:qt,envMap:ae,envMapMode:ae&&Z.mapping,envMapCubeUVHeight:et,aoMap:ne,lightMap:Wt,bumpMap:zt,normalMap:me,displacementMap:Ue,emissiveMap:He,normalMapObjectSpace:me&&x.normalMapType===_d,normalMapTangentSpace:me&&x.normalMapType===Tl,packedNormalMap:me&&x.normalMapType===Tl&&ov(x.normalMap.format),metalnessMap:Le,roughnessMap:we,anisotropy:F,anisotropyMap:X,clearcoat:xn,clearcoatMap:$,clearcoatNormalMap:lt,clearcoatRoughnessMap:ut,dispersion:ge,iridescence:C,iridescenceMap:J,iridescenceThicknessMap:Q,sheen:_,sheenColorMap:ft,sheenRoughnessMap:It,specularMap:xt,specularColorMap:pt,specularIntensityMap:Dt,transmission:O,transmissionMap:Ft,thicknessMap:Yt,gradientMap:N,opaque:x.transparent===!1&&x.blending===ss&&x.alphaToCoverage===!1,alphaMap:ht,alphaTest:j,alphaHash:mt,combine:x.combine,mapUv:Pe&&g(x.map.channel),aoMapUv:ne&&g(x.aoMap.channel),lightMapUv:Wt&&g(x.lightMap.channel),bumpMapUv:zt&&g(x.bumpMap.channel),normalMapUv:me&&g(x.normalMap.channel),displacementMapUv:Ue&&g(x.displacementMap.channel),emissiveMapUv:He&&g(x.emissiveMap.channel),metalnessMapUv:Le&&g(x.metalnessMap.channel),roughnessMapUv:we&&g(x.roughnessMap.channel),anisotropyMapUv:X&&g(x.anisotropyMap.channel),clearcoatMapUv:$&&g(x.clearcoatMap.channel),clearcoatNormalMapUv:lt&&g(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ut&&g(x.clearcoatRoughnessMap.channel),iridescenceMapUv:J&&g(x.iridescenceMap.channel),iridescenceThicknessMapUv:Q&&g(x.iridescenceThicknessMap.channel),sheenColorMapUv:ft&&g(x.sheenColorMap.channel),sheenRoughnessMapUv:It&&g(x.sheenRoughnessMap.channel),specularMapUv:xt&&g(x.specularMap.channel),specularColorMapUv:pt&&g(x.specularColorMap.channel),specularIntensityMapUv:Dt&&g(x.specularIntensityMap.channel),transmissionMapUv:Ft&&g(x.transmissionMap.channel),thicknessMapUv:Yt&&g(x.thicknessMap.channel),alphaMapUv:ht&&g(x.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(me||F),vertexNormals:!!z.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!z.attributes.uv&&(Pe||ht),fog:!!H,useFog:x.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||z.attributes.normal===void 0&&me===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:tt,skinning:D.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:at,morphTextureStride:Ht,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:P.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&A.length>0,shadowMapType:i.shadowMap.type,toneMapping:nt,decodeVideoTexture:Pe&&x.map.isVideoTexture===!0&&ie.getTransfer(x.map.colorSpace)===pe,decodeVideoTextureEmissive:He&&x.emissiveMap.isVideoTexture===!0&&ie.getTransfer(x.emissiveMap.colorSpace)===pe,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Ze,flipSided:x.side===rn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:bt&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(bt&&x.extensions.multiDraw===!0||ot)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ct.vertexUv1s=c.has(1),Ct.vertexUv2s=c.has(2),Ct.vertexUv3s=c.has(3),c.clear(),Ct}function p(x){let E=[];if(x.shaderID?E.push(x.shaderID):(E.push(x.customVertexShaderID),E.push(x.customFragmentShaderID)),x.defines!==void 0)for(let A in x.defines)E.push(A),E.push(x.defines[A]);return x.isRawShaderMaterial===!1&&(d(E,x),b(E,x),E.push(i.outputColorSpace)),E.push(x.customProgramCacheKey),E.join()}function d(x,E){x.push(E.precision),x.push(E.outputColorSpace),x.push(E.envMapMode),x.push(E.envMapCubeUVHeight),x.push(E.mapUv),x.push(E.alphaMapUv),x.push(E.lightMapUv),x.push(E.aoMapUv),x.push(E.bumpMapUv),x.push(E.normalMapUv),x.push(E.displacementMapUv),x.push(E.emissiveMapUv),x.push(E.metalnessMapUv),x.push(E.roughnessMapUv),x.push(E.anisotropyMapUv),x.push(E.clearcoatMapUv),x.push(E.clearcoatNormalMapUv),x.push(E.clearcoatRoughnessMapUv),x.push(E.iridescenceMapUv),x.push(E.iridescenceThicknessMapUv),x.push(E.sheenColorMapUv),x.push(E.sheenRoughnessMapUv),x.push(E.specularMapUv),x.push(E.specularColorMapUv),x.push(E.specularIntensityMapUv),x.push(E.transmissionMapUv),x.push(E.thicknessMapUv),x.push(E.combine),x.push(E.fogExp2),x.push(E.sizeAttenuation),x.push(E.morphTargetsCount),x.push(E.morphAttributeCount),x.push(E.numDirLights),x.push(E.numPointLights),x.push(E.numSpotLights),x.push(E.numSpotLightMaps),x.push(E.numHemiLights),x.push(E.numRectAreaLights),x.push(E.numDirLightShadows),x.push(E.numPointLightShadows),x.push(E.numSpotLightShadows),x.push(E.numSpotLightShadowsWithMaps),x.push(E.numLightProbes),x.push(E.shadowMapType),x.push(E.toneMapping),x.push(E.numClippingPlanes),x.push(E.numClipIntersection),x.push(E.depthPacking)}function b(x,E){a.disableAll(),E.instancing&&a.enable(0),E.instancingColor&&a.enable(1),E.instancingMorph&&a.enable(2),E.matcap&&a.enable(3),E.envMap&&a.enable(4),E.normalMapObjectSpace&&a.enable(5),E.normalMapTangentSpace&&a.enable(6),E.clearcoat&&a.enable(7),E.iridescence&&a.enable(8),E.alphaTest&&a.enable(9),E.vertexColors&&a.enable(10),E.vertexAlphas&&a.enable(11),E.vertexUv1s&&a.enable(12),E.vertexUv2s&&a.enable(13),E.vertexUv3s&&a.enable(14),E.vertexTangents&&a.enable(15),E.anisotropy&&a.enable(16),E.alphaHash&&a.enable(17),E.batching&&a.enable(18),E.dispersion&&a.enable(19),E.batchingColor&&a.enable(20),E.gradientMap&&a.enable(21),E.packedNormalMap&&a.enable(22),E.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),E.numLightProbeGrids>0&&a.enable(22),E.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function M(x){let E=m[x.type],A;if(E){let I=si[E];A=Ld.clone(I.uniforms)}else A=x.uniforms;return A}function y(x,E){let A=h.get(E);return A!==void 0?++A.usedTimes:(A=new rv(i,E,x,s),l.push(A),h.set(E,A)),A}function w(x){if(--x.usedTimes===0){let E=l.indexOf(x);l[E]=l[l.length-1],l.pop(),h.delete(x.cacheKey),x.destroy()}}function T(x){o.remove(x)}function R(){o.dispose()}return{getParameters:v,getProgramCacheKey:p,getUniforms:M,acquireProgram:y,releaseProgram:w,releaseShaderCache:T,programs:l,dispose:R}}function cv(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function hv(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function jd(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Qd(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(u){let m=0;return u.isInstancedMesh&&(m+=2),u.isSkinnedMesh&&(m+=1),m}function o(u,m,g,v,p,d){let b=i[t];return b===void 0?(b={id:u.id,object:u,geometry:m,material:g,materialVariant:a(u),groupOrder:v,renderOrder:u.renderOrder,z:p,group:d},i[t]=b):(b.id=u.id,b.object=u,b.geometry=m,b.material=g,b.materialVariant=a(u),b.groupOrder=v,b.renderOrder=u.renderOrder,b.z=p,b.group=d),t++,b}function c(u,m,g,v,p,d){let b=o(u,m,g,v,p,d);g.transmission>0?n.push(b):g.transparent===!0?s.push(b):e.push(b)}function l(u,m,g,v,p,d){let b=o(u,m,g,v,p,d);g.transmission>0?n.unshift(b):g.transparent===!0?s.unshift(b):e.unshift(b)}function h(u,m,g){e.length>1&&e.sort(u||hv),n.length>1&&n.sort(m||jd),s.length>1&&s.sort(m||jd),g&&(e.reverse(),n.reverse(),s.reverse())}function f(){for(let u=t,m=i.length;u<m;u++){let g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:f,sort:h}}function uv(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Qd,i.set(n,[a])):s>=r.length?(a=new Qd,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function dv(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new L,color:new wt};break;case"SpotLight":e={position:new L,direction:new L,color:new wt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new wt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new wt,groundColor:new wt};break;case"RectAreaLight":e={color:new wt,position:new L,halfWidth:new L,halfHeight:new L};break}return i[t.id]=e,e}}}function fv(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var pv=0;function mv(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function gv(i){let t=new dv,e=fv(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new L);let s=new L,r=new oe,a=new oe;function o(l){let h=0,f=0,u=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let m=0,g=0,v=0,p=0,d=0,b=0,M=0,y=0,w=0,T=0,R=0;l.sort(mv);for(let E=0,A=l.length;E<A;E++){let I=l[E],D=I.color,P=I.intensity,H=I.distance,z=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===Gi?z=I.shadow.map.texture:z=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=D.r*P,f+=D.g*P,u+=D.b*P;else if(I.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(I.sh.coefficients[W],P);R++}else if(I.isDirectionalLight){let W=t.get(I);if(W.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let q=I.shadow,Z=e.get(I);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize=q.mapSize,n.directionalShadow[m]=Z,n.directionalShadowMap[m]=z,n.directionalShadowMatrix[m]=I.shadow.matrix,b++}n.directional[m]=W,m++}else if(I.isSpotLight){let W=t.get(I);W.position.setFromMatrixPosition(I.matrixWorld),W.color.copy(D).multiplyScalar(P),W.distance=H,W.coneCos=Math.cos(I.angle),W.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),W.decay=I.decay,n.spot[v]=W;let q=I.shadow;if(I.map&&(n.spotLightMap[w]=I.map,w++,q.updateMatrices(I),I.castShadow&&T++),n.spotLightMatrix[v]=q.matrix,I.castShadow){let Z=e.get(I);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize=q.mapSize,n.spotShadow[v]=Z,n.spotShadowMap[v]=z,y++}v++}else if(I.isRectAreaLight){let W=t.get(I);W.color.copy(D).multiplyScalar(P),W.halfWidth.set(I.width*.5,0,0),W.halfHeight.set(0,I.height*.5,0),n.rectArea[p]=W,p++}else if(I.isPointLight){let W=t.get(I);if(W.color.copy(I.color).multiplyScalar(I.intensity),W.distance=I.distance,W.decay=I.decay,I.castShadow){let q=I.shadow,Z=e.get(I);Z.shadowIntensity=q.intensity,Z.shadowBias=q.bias,Z.shadowNormalBias=q.normalBias,Z.shadowRadius=q.radius,Z.shadowMapSize=q.mapSize,Z.shadowCameraNear=q.camera.near,Z.shadowCameraFar=q.camera.far,n.pointShadow[g]=Z,n.pointShadowMap[g]=z,n.pointShadowMatrix[g]=I.shadow.matrix,M++}n.point[g]=W,g++}else if(I.isHemisphereLight){let W=t.get(I);W.skyColor.copy(I.color).multiplyScalar(P),W.groundColor.copy(I.groundColor).multiplyScalar(P),n.hemi[d]=W,d++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=vt.LTC_FLOAT_1,n.rectAreaLTC2=vt.LTC_FLOAT_2):(n.rectAreaLTC1=vt.LTC_HALF_1,n.rectAreaLTC2=vt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;let x=n.hash;(x.directionalLength!==m||x.pointLength!==g||x.spotLength!==v||x.rectAreaLength!==p||x.hemiLength!==d||x.numDirectionalShadows!==b||x.numPointShadows!==M||x.numSpotShadows!==y||x.numSpotMaps!==w||x.numLightProbes!==R)&&(n.directional.length=m,n.spot.length=v,n.rectArea.length=p,n.point.length=g,n.hemi.length=d,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=M,n.pointShadowMap.length=M,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=M,n.spotLightMatrix.length=y+w-T,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=T,n.numLightProbes=R,x.directionalLength=m,x.pointLength=g,x.spotLength=v,x.rectAreaLength=p,x.hemiLength=d,x.numDirectionalShadows=b,x.numPointShadows=M,x.numSpotShadows=y,x.numSpotMaps=w,x.numLightProbes=R,n.version=pv++)}function c(l,h){let f=0,u=0,m=0,g=0,v=0,p=h.matrixWorldInverse;for(let d=0,b=l.length;d<b;d++){let M=l[d];if(M.isDirectionalLight){let y=n.directional[f];y.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),f++}else if(M.isSpotLight){let y=n.spot[m];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(p),y.direction.setFromMatrixPosition(M.matrixWorld),s.setFromMatrixPosition(M.target.matrixWorld),y.direction.sub(s),y.direction.transformDirection(p),m++}else if(M.isRectAreaLight){let y=n.rectArea[g];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(p),a.identity(),r.copy(M.matrixWorld),r.premultiply(p),a.extractRotation(r),y.halfWidth.set(M.width*.5,0,0),y.halfHeight.set(0,M.height*.5,0),y.halfWidth.applyMatrix4(a),y.halfHeight.applyMatrix4(a),g++}else if(M.isPointLight){let y=n.point[u];y.position.setFromMatrixPosition(M.matrixWorld),y.position.applyMatrix4(p),u++}else if(M.isHemisphereLight){let y=n.hemi[v];y.direction.setFromMatrixPosition(M.matrixWorld),y.direction.transformDirection(p),v++}}}return{setup:o,setupView:c,state:n}}function tf(i){let t=new gv(i),e=[],n=[],s=[];function r(u){f.camera=u,e.length=0,n.length=0,s.length=0}function a(u){e.push(u)}function o(u){n.push(u)}function c(u){s.push(u)}function l(){t.setup(e)}function h(u){t.setupView(e,u)}let f={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:l,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function xv(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new tf(i),t.set(s,[o])):r>=a.length?(o=new tf(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var vv=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,_v=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,yv=[new L(1,0,0),new L(-1,0,0),new L(0,1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1)],bv=[new L(0,-1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1),new L(0,-1,0),new L(0,-1,0)],ef=new oe,la=new L,Th=new L;function Mv(i,t,e){let n=new Ws,s=new Ut,r=new Ut,a=new Fe,o=new wo,c=new To,l={},h=e.maxTextureSize,f={[pi]:rn,[rn]:pi,[Ze]:Ze},u=new tn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ut},radius:{value:4}},vertexShader:vv,fragmentShader:_v}),m=u.clone();m.defines.HORIZONTAL_PASS=1;let g=new ye;g.setAttribute("position",new We(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new st(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=jr;let d=this.type;this.render=function(T,R,x){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||T.length===0)return;this.type===Ju&&(Nt("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=jr);let E=i.getRenderTarget(),A=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),D=i.state;D.setBlending(ei),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);let P=d!==this.type;P&&R.traverse(function(H){H.material&&(Array.isArray(H.material)?H.material.forEach(z=>z.needsUpdate=!0):H.material.needsUpdate=!0)});for(let H=0,z=T.length;H<z;H++){let W=T[H],q=W.shadow;if(q===void 0){Nt("WebGLShadowMap:",W,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;s.copy(q.mapSize);let Z=q.getFrameExtents();s.multiply(Z),r.copy(q.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Z.x),s.x=r.x*Z.x,q.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Z.y),s.y=r.y*Z.y,q.mapSize.y=r.y));let et=i.state.buffers.depth.getReversed();if(q.camera._reversedDepth=et,q.map===null||P===!0){if(q.map!==null&&(q.map.depthTexture!==null&&(q.map.depthTexture.dispose(),q.map.depthTexture=null),q.map.dispose()),this.type===Xs){if(W.isPointLight){Nt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}q.map=new hn(s.x,s.y,{format:Gi,type:ni,minFilter:nn,magFilter:nn,generateMipmaps:!1}),q.map.texture.name=W.name+".shadowMap",q.map.depthTexture=new gi(s.x,s.y,In),q.map.depthTexture.name=W.name+".shadowMapDepth",q.map.depthTexture.format=$n,q.map.depthTexture.compareFunction=null,q.map.depthTexture.minFilter=Qe,q.map.depthTexture.magFilter=Qe}else W.isPointLight?(q.map=new Ll(s.x),q.map.depthTexture=new Mo(s.x,kn)):(q.map=new hn(s.x,s.y),q.map.depthTexture=new gi(s.x,s.y,kn)),q.map.depthTexture.name=W.name+".shadowMap",q.map.depthTexture.format=$n,this.type===jr?(q.map.depthTexture.compareFunction=et?Rl:Al,q.map.depthTexture.minFilter=nn,q.map.depthTexture.magFilter=nn):(q.map.depthTexture.compareFunction=null,q.map.depthTexture.minFilter=Qe,q.map.depthTexture.magFilter=Qe);q.camera.updateProjectionMatrix()}let rt=q.map.isWebGLCubeRenderTarget?6:1;for(let it=0;it<rt;it++){if(q.map.isWebGLCubeRenderTarget)i.setRenderTarget(q.map,it),i.clear();else{it===0&&(i.setRenderTarget(q.map),i.clear());let at=q.getViewport(it);a.set(r.x*at.x,r.y*at.y,r.x*at.z,r.y*at.w),D.viewport(a)}if(W.isPointLight){let at=q.camera,Ht=q.matrix,Gt=W.distance||at.far;Gt!==at.far&&(at.far=Gt,at.updateProjectionMatrix()),la.setFromMatrixPosition(W.matrixWorld),at.position.copy(la),Th.copy(at.position),Th.add(yv[it]),at.up.copy(bv[it]),at.lookAt(Th),at.updateMatrixWorld(),Ht.makeTranslation(-la.x,-la.y,-la.z),ef.multiplyMatrices(at.projectionMatrix,at.matrixWorldInverse),q._frustum.setFromProjectionMatrix(ef,at.coordinateSystem,at.reversedDepth)}else q.updateMatrices(W);n=q.getFrustum(),y(R,x,q.camera,W,this.type)}q.isPointLightShadow!==!0&&this.type===Xs&&b(q,x),q.needsUpdate=!1}d=this.type,p.needsUpdate=!1,i.setRenderTarget(E,A,I)};function b(T,R){let x=t.update(v);u.defines.VSM_SAMPLES!==T.blurSamples&&(u.defines.VSM_SAMPLES=T.blurSamples,m.defines.VSM_SAMPLES=T.blurSamples,u.needsUpdate=!0,m.needsUpdate=!0),T.mapPass===null&&(T.mapPass=new hn(s.x,s.y,{format:Gi,type:ni})),u.uniforms.shadow_pass.value=T.map.depthTexture,u.uniforms.resolution.value=T.mapSize,u.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(R,null,x,u,v,null),m.uniforms.shadow_pass.value=T.mapPass.texture,m.uniforms.resolution.value=T.mapSize,m.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(R,null,x,m,v,null)}function M(T,R,x,E){let A=null,I=x.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(I!==void 0)A=I;else if(A=x.isPointLight===!0?c:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let D=A.uuid,P=R.uuid,H=l[D];H===void 0&&(H={},l[D]=H);let z=H[P];z===void 0&&(z=A.clone(),H[P]=z,R.addEventListener("dispose",w)),A=z}if(A.visible=R.visible,A.wireframe=R.wireframe,E===Xs?A.side=R.shadowSide!==null?R.shadowSide:R.side:A.side=R.shadowSide!==null?R.shadowSide:f[R.side],A.alphaMap=R.alphaMap,A.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,A.map=R.map,A.clipShadows=R.clipShadows,A.clippingPlanes=R.clippingPlanes,A.clipIntersection=R.clipIntersection,A.displacementMap=R.displacementMap,A.displacementScale=R.displacementScale,A.displacementBias=R.displacementBias,A.wireframeLinewidth=R.wireframeLinewidth,A.linewidth=R.linewidth,x.isPointLight===!0&&A.isMeshDistanceMaterial===!0){let D=i.properties.get(A);D.light=x}return A}function y(T,R,x,E,A){if(T.visible===!1)return;if(T.layers.test(R.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&A===Xs)&&(!T.frustumCulled||n.intersectsObject(T))){T.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,T.matrixWorld);let P=t.update(T),H=T.material;if(Array.isArray(H)){let z=P.groups;for(let W=0,q=z.length;W<q;W++){let Z=z[W],et=H[Z.materialIndex];if(et&&et.visible){let rt=M(T,et,E,A);T.onBeforeShadow(i,T,R,x,P,rt,Z),i.renderBufferDirect(x,null,P,rt,T,Z),T.onAfterShadow(i,T,R,x,P,rt,Z)}}}else if(H.visible){let z=M(T,H,E,A);T.onBeforeShadow(i,T,R,x,P,z,null),i.renderBufferDirect(x,null,P,z,T,null),T.onAfterShadow(i,T,R,x,P,z,null)}}let D=T.children;for(let P=0,H=D.length;P<H;P++)y(D[P],R,x,E,A)}function w(T){T.target.removeEventListener("dispose",w);for(let x in l){let E=l[x],A=T.target.uuid;A in E&&(E[A].dispose(),delete E[A])}}}function Ev(i,t){function e(){let N=!1,ht=new Fe,j=null,mt=new Fe(0,0,0,0);return{setMask:function(bt){j!==bt&&!N&&(i.colorMask(bt,bt,bt,bt),j=bt)},setLocked:function(bt){N=bt},setClear:function(bt,nt,Ct,Tt,Be){Be===!0&&(bt*=Tt,nt*=Tt,Ct*=Tt),ht.set(bt,nt,Ct,Tt),mt.equals(ht)===!1&&(i.clearColor(bt,nt,Ct,Tt),mt.copy(ht))},reset:function(){N=!1,j=null,mt.set(-1,0,0,0)}}}function n(){let N=!1,ht=!1,j=null,mt=null,bt=null;return{setReversed:function(nt){if(ht!==nt){let Ct=t.get("EXT_clip_control");nt?Ct.clipControlEXT(Ct.LOWER_LEFT_EXT,Ct.ZERO_TO_ONE_EXT):Ct.clipControlEXT(Ct.LOWER_LEFT_EXT,Ct.NEGATIVE_ONE_TO_ONE_EXT),ht=nt;let Tt=bt;bt=null,this.setClear(Tt)}},getReversed:function(){return ht},setTest:function(nt){nt?k(i.DEPTH_TEST):tt(i.DEPTH_TEST)},setMask:function(nt){j!==nt&&!N&&(i.depthMask(nt),j=nt)},setFunc:function(nt){if(ht&&(nt=Cd[nt]),mt!==nt){switch(nt){case so:i.depthFunc(i.NEVER);break;case ro:i.depthFunc(i.ALWAYS);break;case ao:i.depthFunc(i.LESS);break;case rs:i.depthFunc(i.LEQUAL);break;case oo:i.depthFunc(i.EQUAL);break;case lo:i.depthFunc(i.GEQUAL);break;case co:i.depthFunc(i.GREATER);break;case ho:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}mt=nt}},setLocked:function(nt){N=nt},setClear:function(nt){bt!==nt&&(bt=nt,ht&&(nt=1-nt),i.clearDepth(nt))},reset:function(){N=!1,j=null,mt=null,bt=null,ht=!1}}}function s(){let N=!1,ht=null,j=null,mt=null,bt=null,nt=null,Ct=null,Tt=null,Be=null;return{setTest:function(Te){N||(Te?k(i.STENCIL_TEST):tt(i.STENCIL_TEST))},setMask:function(Te){ht!==Te&&!N&&(i.stencilMask(Te),ht=Te)},setFunc:function(Te,Vn,Wn){(j!==Te||mt!==Vn||bt!==Wn)&&(i.stencilFunc(Te,Vn,Wn),j=Te,mt=Vn,bt=Wn)},setOp:function(Te,Vn,Wn){(nt!==Te||Ct!==Vn||Tt!==Wn)&&(i.stencilOp(Te,Vn,Wn),nt=Te,Ct=Vn,Tt=Wn)},setLocked:function(Te){N=Te},setClear:function(Te){Be!==Te&&(i.clearStencil(Te),Be=Te)},reset:function(){N=!1,ht=null,j=null,mt=null,bt=null,nt=null,Ct=null,Tt=null,Be=null}}}let r=new e,a=new n,o=new s,c=new WeakMap,l=new WeakMap,h={},f={},u={},m=new WeakMap,g=[],v=null,p=!1,d=null,b=null,M=null,y=null,w=null,T=null,R=null,x=new wt(0,0,0),E=0,A=!1,I=null,D=null,P=null,H=null,z=null,W=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),q=!1,Z=0,et=i.getParameter(i.VERSION);et.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(et)[1]),q=Z>=1):et.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(et)[1]),q=Z>=2);let rt=null,it={},at=i.getParameter(i.SCISSOR_BOX),Ht=i.getParameter(i.VIEWPORT),Gt=new Fe().fromArray(at),Vt=new Fe().fromArray(Ht);function K(N,ht,j,mt){let bt=new Uint8Array(4),nt=i.createTexture();i.bindTexture(N,nt),i.texParameteri(N,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(N,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ct=0;Ct<j;Ct++)N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY?i.texImage3D(ht,0,i.RGBA,1,1,mt,0,i.RGBA,i.UNSIGNED_BYTE,bt):i.texImage2D(ht+Ct,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,bt);return nt}let U={};U[i.TEXTURE_2D]=K(i.TEXTURE_2D,i.TEXTURE_2D,1),U[i.TEXTURE_CUBE_MAP]=K(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),U[i.TEXTURE_2D_ARRAY]=K(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),U[i.TEXTURE_3D]=K(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),k(i.DEPTH_TEST),a.setFunc(rs),zt(!1),me(jc),k(i.CULL_FACE),ne(ei);function k(N){h[N]!==!0&&(i.enable(N),h[N]=!0)}function tt(N){h[N]!==!1&&(i.disable(N),h[N]=!1)}function ct(N,ht){return u[N]!==ht?(i.bindFramebuffer(N,ht),u[N]=ht,N===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=ht),N===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=ht),!0):!1}function ot(N,ht){let j=g,mt=!1;if(N){j=m.get(ht),j===void 0&&(j=[],m.set(ht,j));let bt=N.textures;if(j.length!==bt.length||j[0]!==i.COLOR_ATTACHMENT0){for(let nt=0,Ct=bt.length;nt<Ct;nt++)j[nt]=i.COLOR_ATTACHMENT0+nt;j.length=bt.length,mt=!0}}else j[0]!==i.BACK&&(j[0]=i.BACK,mt=!0);mt&&i.drawBuffers(j)}function Pe(N){return v!==N?(i.useProgram(N),v=N,!0):!1}let qt={[Pi]:i.FUNC_ADD,[ju]:i.FUNC_SUBTRACT,[Qu]:i.FUNC_REVERSE_SUBTRACT};qt[td]=i.MIN,qt[ed]=i.MAX;let ae={[nd]:i.ZERO,[id]:i.ONE,[sd]:i.SRC_COLOR,[no]:i.SRC_ALPHA,[hd]:i.SRC_ALPHA_SATURATE,[ld]:i.DST_COLOR,[ad]:i.DST_ALPHA,[rd]:i.ONE_MINUS_SRC_COLOR,[io]:i.ONE_MINUS_SRC_ALPHA,[cd]:i.ONE_MINUS_DST_COLOR,[od]:i.ONE_MINUS_DST_ALPHA,[ud]:i.CONSTANT_COLOR,[dd]:i.ONE_MINUS_CONSTANT_COLOR,[fd]:i.CONSTANT_ALPHA,[pd]:i.ONE_MINUS_CONSTANT_ALPHA};function ne(N,ht,j,mt,bt,nt,Ct,Tt,Be,Te){if(N===ei){p===!0&&(tt(i.BLEND),p=!1);return}if(p===!1&&(k(i.BLEND),p=!0),N!==Ku){if(N!==d||Te!==A){if((b!==Pi||w!==Pi)&&(i.blendEquation(i.FUNC_ADD),b=Pi,w=Pi),Te)switch(N){case ss:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case cs:i.blendFunc(i.ONE,i.ONE);break;case Qc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case th:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Bt("WebGLState: Invalid blending: ",N);break}else switch(N){case ss:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case cs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Qc:Bt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case th:Bt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Bt("WebGLState: Invalid blending: ",N);break}M=null,y=null,T=null,R=null,x.set(0,0,0),E=0,d=N,A=Te}return}bt=bt||ht,nt=nt||j,Ct=Ct||mt,(ht!==b||bt!==w)&&(i.blendEquationSeparate(qt[ht],qt[bt]),b=ht,w=bt),(j!==M||mt!==y||nt!==T||Ct!==R)&&(i.blendFuncSeparate(ae[j],ae[mt],ae[nt],ae[Ct]),M=j,y=mt,T=nt,R=Ct),(Tt.equals(x)===!1||Be!==E)&&(i.blendColor(Tt.r,Tt.g,Tt.b,Be),x.copy(Tt),E=Be),d=N,A=!1}function Wt(N,ht){N.side===Ze?tt(i.CULL_FACE):k(i.CULL_FACE);let j=N.side===rn;ht&&(j=!j),zt(j),N.blending===ss&&N.transparent===!1?ne(ei):ne(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),r.setMask(N.colorWrite);let mt=N.stencilWrite;o.setTest(mt),mt&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),He(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?k(i.SAMPLE_ALPHA_TO_COVERAGE):tt(i.SAMPLE_ALPHA_TO_COVERAGE)}function zt(N){I!==N&&(N?i.frontFace(i.CW):i.frontFace(i.CCW),I=N)}function me(N){N!==Zu?(k(i.CULL_FACE),N!==D&&(N===jc?i.cullFace(i.BACK):N===$u?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):tt(i.CULL_FACE),D=N}function Ue(N){N!==P&&(q&&i.lineWidth(N),P=N)}function He(N,ht,j){N?(k(i.POLYGON_OFFSET_FILL),(H!==ht||z!==j)&&(H=ht,z=j,a.getReversed()&&(ht=-ht),i.polygonOffset(ht,j))):tt(i.POLYGON_OFFSET_FILL)}function Le(N){N?k(i.SCISSOR_TEST):tt(i.SCISSOR_TEST)}function we(N){N===void 0&&(N=i.TEXTURE0+W-1),rt!==N&&(i.activeTexture(N),rt=N)}function F(N,ht,j){j===void 0&&(rt===null?j=i.TEXTURE0+W-1:j=rt);let mt=it[j];mt===void 0&&(mt={type:void 0,texture:void 0},it[j]=mt),(mt.type!==N||mt.texture!==ht)&&(rt!==j&&(i.activeTexture(j),rt=j),i.bindTexture(N,ht||U[N]),mt.type=N,mt.texture=ht)}function xn(){let N=it[rt];N!==void 0&&N.type!==void 0&&(i.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function ge(){try{i.compressedTexImage2D(...arguments)}catch(N){Bt("WebGLState:",N)}}function C(){try{i.compressedTexImage3D(...arguments)}catch(N){Bt("WebGLState:",N)}}function _(){try{i.texSubImage2D(...arguments)}catch(N){Bt("WebGLState:",N)}}function O(){try{i.texSubImage3D(...arguments)}catch(N){Bt("WebGLState:",N)}}function X(){try{i.compressedTexSubImage2D(...arguments)}catch(N){Bt("WebGLState:",N)}}function $(){try{i.compressedTexSubImage3D(...arguments)}catch(N){Bt("WebGLState:",N)}}function lt(){try{i.texStorage2D(...arguments)}catch(N){Bt("WebGLState:",N)}}function ut(){try{i.texStorage3D(...arguments)}catch(N){Bt("WebGLState:",N)}}function J(){try{i.texImage2D(...arguments)}catch(N){Bt("WebGLState:",N)}}function Q(){try{i.texImage3D(...arguments)}catch(N){Bt("WebGLState:",N)}}function ft(N){return f[N]!==void 0?f[N]:i.getParameter(N)}function It(N,ht){f[N]!==ht&&(i.pixelStorei(N,ht),f[N]=ht)}function xt(N){Gt.equals(N)===!1&&(i.scissor(N.x,N.y,N.z,N.w),Gt.copy(N))}function pt(N){Vt.equals(N)===!1&&(i.viewport(N.x,N.y,N.z,N.w),Vt.copy(N))}function Dt(N,ht){let j=l.get(ht);j===void 0&&(j=new WeakMap,l.set(ht,j));let mt=j.get(N);mt===void 0&&(mt=i.getUniformBlockIndex(ht,N.name),j.set(N,mt))}function Ft(N,ht){let mt=l.get(ht).get(N);c.get(ht)!==mt&&(i.uniformBlockBinding(ht,mt,N.__bindingPointIndex),c.set(ht,mt))}function Yt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},rt=null,it={},u={},m=new WeakMap,g=[],v=null,p=!1,d=null,b=null,M=null,y=null,w=null,T=null,R=null,x=new wt(0,0,0),E=0,A=!1,I=null,D=null,P=null,H=null,z=null,Gt.set(0,0,i.canvas.width,i.canvas.height),Vt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:k,disable:tt,bindFramebuffer:ct,drawBuffers:ot,useProgram:Pe,setBlending:ne,setMaterial:Wt,setFlipSided:zt,setCullFace:me,setLineWidth:Ue,setPolygonOffset:He,setScissorTest:Le,activeTexture:we,bindTexture:F,unbindTexture:xn,compressedTexImage2D:ge,compressedTexImage3D:C,texImage2D:J,texImage3D:Q,pixelStorei:It,getParameter:ft,updateUBOMapping:Dt,uniformBlockBinding:Ft,texStorage2D:lt,texStorage3D:ut,texSubImage2D:_,texSubImage3D:O,compressedTexSubImage2D:X,compressedTexSubImage3D:$,scissor:xt,viewport:pt,reset:Yt}}function Sv(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ut,h=new WeakMap,f=new Set,u,m=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(C,_){return g?new OffscreenCanvas(C,_):Cr("canvas")}function p(C,_,O){let X=1,$=ge(C);if(($.width>O||$.height>O)&&(X=O/Math.max($.width,$.height)),X<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let lt=Math.floor(X*$.width),ut=Math.floor(X*$.height);u===void 0&&(u=v(lt,ut));let J=_?v(lt,ut):u;return J.width=lt,J.height=ut,J.getContext("2d").drawImage(C,0,0,lt,ut),Nt("WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+lt+"x"+ut+")."),J}else return"data"in C&&Nt("WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),C;return C}function d(C){return C.generateMipmaps}function b(C){i.generateMipmap(C)}function M(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function y(C,_,O,X,$,lt=!1){if(C!==null){if(i[C]!==void 0)return i[C];Nt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let ut;X&&(ut=t.get("EXT_texture_norm16"),ut||Nt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let J=_;if(_===i.RED&&(O===i.FLOAT&&(J=i.R32F),O===i.HALF_FLOAT&&(J=i.R16F),O===i.UNSIGNED_BYTE&&(J=i.R8),O===i.UNSIGNED_SHORT&&ut&&(J=ut.R16_EXT),O===i.SHORT&&ut&&(J=ut.R16_SNORM_EXT)),_===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.R8UI),O===i.UNSIGNED_SHORT&&(J=i.R16UI),O===i.UNSIGNED_INT&&(J=i.R32UI),O===i.BYTE&&(J=i.R8I),O===i.SHORT&&(J=i.R16I),O===i.INT&&(J=i.R32I)),_===i.RG&&(O===i.FLOAT&&(J=i.RG32F),O===i.HALF_FLOAT&&(J=i.RG16F),O===i.UNSIGNED_BYTE&&(J=i.RG8),O===i.UNSIGNED_SHORT&&ut&&(J=ut.RG16_EXT),O===i.SHORT&&ut&&(J=ut.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.RG8UI),O===i.UNSIGNED_SHORT&&(J=i.RG16UI),O===i.UNSIGNED_INT&&(J=i.RG32UI),O===i.BYTE&&(J=i.RG8I),O===i.SHORT&&(J=i.RG16I),O===i.INT&&(J=i.RG32I)),_===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.RGB8UI),O===i.UNSIGNED_SHORT&&(J=i.RGB16UI),O===i.UNSIGNED_INT&&(J=i.RGB32UI),O===i.BYTE&&(J=i.RGB8I),O===i.SHORT&&(J=i.RGB16I),O===i.INT&&(J=i.RGB32I)),_===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(J=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(J=i.RGBA16UI),O===i.UNSIGNED_INT&&(J=i.RGBA32UI),O===i.BYTE&&(J=i.RGBA8I),O===i.SHORT&&(J=i.RGBA16I),O===i.INT&&(J=i.RGBA32I)),_===i.RGB&&(O===i.UNSIGNED_SHORT&&ut&&(J=ut.RGB16_EXT),O===i.SHORT&&ut&&(J=ut.RGB16_SNORM_EXT),O===i.UNSIGNED_INT_5_9_9_9_REV&&(J=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(J=i.R11F_G11F_B10F)),_===i.RGBA){let Q=lt?Rr:ie.getTransfer($);O===i.FLOAT&&(J=i.RGBA32F),O===i.HALF_FLOAT&&(J=i.RGBA16F),O===i.UNSIGNED_BYTE&&(J=Q===pe?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT&&ut&&(J=ut.RGBA16_EXT),O===i.SHORT&&ut&&(J=ut.RGBA16_SNORM_EXT),O===i.UNSIGNED_SHORT_4_4_4_4&&(J=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(J=i.RGB5_A1)}return(J===i.R16F||J===i.R32F||J===i.RG16F||J===i.RG32F||J===i.RGBA16F||J===i.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function w(C,_){let O;return C?_===null||_===kn||_===Ys?O=i.DEPTH24_STENCIL8:_===In?O=i.DEPTH32F_STENCIL8:_===qs&&(O=i.DEPTH24_STENCIL8,Nt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===kn||_===Ys?O=i.DEPTH_COMPONENT24:_===In?O=i.DEPTH_COMPONENT32F:_===qs&&(O=i.DEPTH_COMPONENT16),O}function T(C,_){return d(C)===!0||C.isFramebufferTexture&&C.minFilter!==Qe&&C.minFilter!==nn?Math.log2(Math.max(_.width,_.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?_.mipmaps.length:1}function R(C){let _=C.target;_.removeEventListener("dispose",R),E(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&f.delete(_)}function x(C){let _=C.target;_.removeEventListener("dispose",x),I(_)}function E(C){let _=n.get(C);if(_.__webglInit===void 0)return;let O=C.source,X=m.get(O);if(X){let $=X[_.__cacheKey];$.usedTimes--,$.usedTimes===0&&A(C),Object.keys(X).length===0&&m.delete(O)}n.remove(C)}function A(C){let _=n.get(C);i.deleteTexture(_.__webglTexture);let O=C.source,X=m.get(O);delete X[_.__cacheKey],a.memory.textures--}function I(C){let _=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(_.__webglFramebuffer[X]))for(let $=0;$<_.__webglFramebuffer[X].length;$++)i.deleteFramebuffer(_.__webglFramebuffer[X][$]);else i.deleteFramebuffer(_.__webglFramebuffer[X]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[X])}else{if(Array.isArray(_.__webglFramebuffer))for(let X=0;X<_.__webglFramebuffer.length;X++)i.deleteFramebuffer(_.__webglFramebuffer[X]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let X=0;X<_.__webglColorRenderbuffer.length;X++)_.__webglColorRenderbuffer[X]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[X]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let O=C.textures;for(let X=0,$=O.length;X<$;X++){let lt=n.get(O[X]);lt.__webglTexture&&(i.deleteTexture(lt.__webglTexture),a.memory.textures--),n.remove(O[X])}n.remove(C)}let D=0;function P(){D=0}function H(){return D}function z(C){D=C}function W(){let C=D;return C>=s.maxTextures&&Nt("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),D+=1,C}function q(C){let _=[];return _.push(C.wrapS),_.push(C.wrapT),_.push(C.wrapR||0),_.push(C.magFilter),_.push(C.minFilter),_.push(C.anisotropy),_.push(C.internalFormat),_.push(C.format),_.push(C.type),_.push(C.generateMipmaps),_.push(C.premultiplyAlpha),_.push(C.flipY),_.push(C.unpackAlignment),_.push(C.colorSpace),_.join()}function Z(C,_){let O=n.get(C);if(C.isVideoTexture&&F(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&O.__version!==C.version){let X=C.image;if(X===null)Nt("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)Nt("WebGLRenderer: Texture marked for update but image is incomplete");else{tt(O,C,_);return}}else C.isExternalTexture&&(O.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+_)}function et(C,_){let O=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&O.__version!==C.version){tt(O,C,_);return}else C.isExternalTexture&&(O.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+_)}function rt(C,_){let O=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&O.__version!==C.version){tt(O,C,_);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+_)}function it(C,_){let O=n.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&O.__version!==C.version){ct(O,C,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+_)}let at={[Li]:i.REPEAT,[Zn]:i.CLAMP_TO_EDGE,[uo]:i.MIRRORED_REPEAT},Ht={[Qe]:i.NEAREST,[xd]:i.NEAREST_MIPMAP_NEAREST,[ta]:i.NEAREST_MIPMAP_LINEAR,[nn]:i.LINEAR,[Go]:i.LINEAR_MIPMAP_NEAREST,[ki]:i.LINEAR_MIPMAP_LINEAR},Gt={[yd]:i.NEVER,[wd]:i.ALWAYS,[bd]:i.LESS,[Al]:i.LEQUAL,[Md]:i.EQUAL,[Rl]:i.GEQUAL,[Ed]:i.GREATER,[Sd]:i.NOTEQUAL};function Vt(C,_){if(_.type===In&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===nn||_.magFilter===Go||_.magFilter===ta||_.magFilter===ki||_.minFilter===nn||_.minFilter===Go||_.minFilter===ta||_.minFilter===ki)&&Nt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,at[_.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,at[_.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,at[_.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,Ht[_.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,Ht[_.minFilter]),_.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,Gt[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Qe||_.minFilter!==ta&&_.minFilter!==ki||_.type===In&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function K(C,_){let O=!1;C.__webglInit===void 0&&(C.__webglInit=!0,_.addEventListener("dispose",R));let X=_.source,$=m.get(X);$===void 0&&($={},m.set(X,$));let lt=q(_);if(lt!==C.__cacheKey){$[lt]===void 0&&($[lt]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,O=!0),$[lt].usedTimes++;let ut=$[C.__cacheKey];ut!==void 0&&($[C.__cacheKey].usedTimes--,ut.usedTimes===0&&A(_)),C.__cacheKey=lt,C.__webglTexture=$[lt].texture}return O}function U(C,_,O){return Math.floor(Math.floor(C/O)/_)}function k(C,_,O,X){let lt=C.updateRanges;if(lt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,O,X,_.data);else{lt.sort((It,xt)=>It.start-xt.start);let ut=0;for(let It=1;It<lt.length;It++){let xt=lt[ut],pt=lt[It],Dt=xt.start+xt.count,Ft=U(pt.start,_.width,4),Yt=U(xt.start,_.width,4);pt.start<=Dt+1&&Ft===Yt&&U(pt.start+pt.count-1,_.width,4)===Ft?xt.count=Math.max(xt.count,pt.start+pt.count-xt.start):(++ut,lt[ut]=pt)}lt.length=ut+1;let J=e.getParameter(i.UNPACK_ROW_LENGTH),Q=e.getParameter(i.UNPACK_SKIP_PIXELS),ft=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let It=0,xt=lt.length;It<xt;It++){let pt=lt[It],Dt=Math.floor(pt.start/4),Ft=Math.ceil(pt.count/4),Yt=Dt%_.width,N=Math.floor(Dt/_.width),ht=Ft,j=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Yt),e.pixelStorei(i.UNPACK_SKIP_ROWS,N),e.texSubImage2D(i.TEXTURE_2D,0,Yt,N,ht,j,O,X,_.data)}C.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,J),e.pixelStorei(i.UNPACK_SKIP_PIXELS,Q),e.pixelStorei(i.UNPACK_SKIP_ROWS,ft)}}function tt(C,_,O){let X=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(X=i.TEXTURE_3D);let $=K(C,_),lt=_.source;e.bindTexture(X,C.__webglTexture,i.TEXTURE0+O);let ut=n.get(lt);if(lt.version!==ut.__version||$===!0){if(e.activeTexture(i.TEXTURE0+O),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let j=ie.getPrimaries(ie.workingColorSpace),mt=_.colorSpace===vi?null:ie.getPrimaries(_.colorSpace),bt=_.colorSpace===vi||j===mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,bt)}e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let Q=p(_.image,!1,s.maxTextureSize);Q=xn(_,Q);let ft=r.convert(_.format,_.colorSpace),It=r.convert(_.type),xt=y(_.internalFormat,ft,It,_.normalized,_.colorSpace,_.isVideoTexture);Vt(X,_);let pt,Dt=_.mipmaps,Ft=_.isVideoTexture!==!0,Yt=ut.__version===void 0||$===!0,N=lt.dataReady,ht=T(_,Q);if(_.isDepthTexture)xt=w(_.format===Hi,_.type),Yt&&(Ft?e.texStorage2D(i.TEXTURE_2D,1,xt,Q.width,Q.height):e.texImage2D(i.TEXTURE_2D,0,xt,Q.width,Q.height,0,ft,It,null));else if(_.isDataTexture)if(Dt.length>0){Ft&&Yt&&e.texStorage2D(i.TEXTURE_2D,ht,xt,Dt[0].width,Dt[0].height);for(let j=0,mt=Dt.length;j<mt;j++)pt=Dt[j],Ft?N&&e.texSubImage2D(i.TEXTURE_2D,j,0,0,pt.width,pt.height,ft,It,pt.data):e.texImage2D(i.TEXTURE_2D,j,xt,pt.width,pt.height,0,ft,It,pt.data);_.generateMipmaps=!1}else Ft?(Yt&&e.texStorage2D(i.TEXTURE_2D,ht,xt,Q.width,Q.height),N&&k(_,Q,ft,It)):e.texImage2D(i.TEXTURE_2D,0,xt,Q.width,Q.height,0,ft,It,Q.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Ft&&Yt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ht,xt,Dt[0].width,Dt[0].height,Q.depth);for(let j=0,mt=Dt.length;j<mt;j++)if(pt=Dt[j],_.format!==Pn)if(ft!==null)if(Ft){if(N)if(_.layerUpdates.size>0){let bt=yh(pt.width,pt.height,_.format,_.type);for(let nt of _.layerUpdates){let Ct=pt.data.subarray(nt*bt/pt.data.BYTES_PER_ELEMENT,(nt+1)*bt/pt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,nt,pt.width,pt.height,1,ft,Ct)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,0,pt.width,pt.height,Q.depth,ft,pt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,j,xt,pt.width,pt.height,Q.depth,0,pt.data,0,0);else Nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ft?N&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,j,0,0,0,pt.width,pt.height,Q.depth,ft,It,pt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,j,xt,pt.width,pt.height,Q.depth,0,ft,It,pt.data)}else{Ft&&Yt&&e.texStorage2D(i.TEXTURE_2D,ht,xt,Dt[0].width,Dt[0].height);for(let j=0,mt=Dt.length;j<mt;j++)pt=Dt[j],_.format!==Pn?ft!==null?Ft?N&&e.compressedTexSubImage2D(i.TEXTURE_2D,j,0,0,pt.width,pt.height,ft,pt.data):e.compressedTexImage2D(i.TEXTURE_2D,j,xt,pt.width,pt.height,0,pt.data):Nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?N&&e.texSubImage2D(i.TEXTURE_2D,j,0,0,pt.width,pt.height,ft,It,pt.data):e.texImage2D(i.TEXTURE_2D,j,xt,pt.width,pt.height,0,ft,It,pt.data)}else if(_.isDataArrayTexture)if(Ft){if(Yt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,ht,xt,Q.width,Q.height,Q.depth),N)if(_.layerUpdates.size>0){let j=yh(Q.width,Q.height,_.format,_.type);for(let mt of _.layerUpdates){let bt=Q.data.subarray(mt*j/Q.data.BYTES_PER_ELEMENT,(mt+1)*j/Q.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,mt,Q.width,Q.height,1,ft,It,bt)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,Q.width,Q.height,Q.depth,ft,It,Q.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,xt,Q.width,Q.height,Q.depth,0,ft,It,Q.data);else if(_.isData3DTexture)Ft?(Yt&&e.texStorage3D(i.TEXTURE_3D,ht,xt,Q.width,Q.height,Q.depth),N&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,Q.width,Q.height,Q.depth,ft,It,Q.data)):e.texImage3D(i.TEXTURE_3D,0,xt,Q.width,Q.height,Q.depth,0,ft,It,Q.data);else if(_.isFramebufferTexture){if(Yt)if(Ft)e.texStorage2D(i.TEXTURE_2D,ht,xt,Q.width,Q.height);else{let j=Q.width,mt=Q.height;for(let bt=0;bt<ht;bt++)e.texImage2D(i.TEXTURE_2D,bt,xt,j,mt,0,ft,It,null),j>>=1,mt>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let j=i.canvas;if(j.hasAttribute("layoutsubtree")||j.setAttribute("layoutsubtree","true"),Q.parentNode!==j){j.appendChild(Q),f.add(_),j.onpaint=mt=>{let bt=mt.changedElements;for(let nt of f)bt.includes(nt.image)&&(nt.needsUpdate=!0)},j.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,Q);else{let bt=i.RGBA,nt=i.RGBA,Ct=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,bt,nt,Ct,Q)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Dt.length>0){if(Ft&&Yt){let j=ge(Dt[0]);e.texStorage2D(i.TEXTURE_2D,ht,xt,j.width,j.height)}for(let j=0,mt=Dt.length;j<mt;j++)pt=Dt[j],Ft?N&&e.texSubImage2D(i.TEXTURE_2D,j,0,0,ft,It,pt):e.texImage2D(i.TEXTURE_2D,j,xt,ft,It,pt);_.generateMipmaps=!1}else if(Ft){if(Yt){let j=ge(Q);e.texStorage2D(i.TEXTURE_2D,ht,xt,j.width,j.height)}N&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ft,It,Q)}else e.texImage2D(i.TEXTURE_2D,0,xt,ft,It,Q);d(_)&&b(X),ut.__version=lt.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function ct(C,_,O){if(_.image.length!==6)return;let X=K(C,_),$=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+O);let lt=n.get($);if($.version!==lt.__version||X===!0){e.activeTexture(i.TEXTURE0+O);let ut=ie.getPrimaries(ie.workingColorSpace),J=_.colorSpace===vi?null:ie.getPrimaries(_.colorSpace),Q=_.colorSpace===vi||ut===J?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Q);let ft=_.isCompressedTexture||_.image[0].isCompressedTexture,It=_.image[0]&&_.image[0].isDataTexture,xt=[];for(let nt=0;nt<6;nt++)!ft&&!It?xt[nt]=p(_.image[nt],!0,s.maxCubemapSize):xt[nt]=It?_.image[nt].image:_.image[nt],xt[nt]=xn(_,xt[nt]);let pt=xt[0],Dt=r.convert(_.format,_.colorSpace),Ft=r.convert(_.type),Yt=y(_.internalFormat,Dt,Ft,_.normalized,_.colorSpace),N=_.isVideoTexture!==!0,ht=lt.__version===void 0||X===!0,j=$.dataReady,mt=T(_,pt);Vt(i.TEXTURE_CUBE_MAP,_);let bt;if(ft){N&&ht&&e.texStorage2D(i.TEXTURE_CUBE_MAP,mt,Yt,pt.width,pt.height);for(let nt=0;nt<6;nt++){bt=xt[nt].mipmaps;for(let Ct=0;Ct<bt.length;Ct++){let Tt=bt[Ct];_.format!==Pn?Dt!==null?N?j&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct,0,0,Tt.width,Tt.height,Dt,Tt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct,Yt,Tt.width,Tt.height,0,Tt.data):Nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?j&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct,0,0,Tt.width,Tt.height,Dt,Ft,Tt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct,Yt,Tt.width,Tt.height,0,Dt,Ft,Tt.data)}}}else{if(bt=_.mipmaps,N&&ht){bt.length>0&&mt++;let nt=ge(xt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,mt,Yt,nt.width,nt.height)}for(let nt=0;nt<6;nt++)if(It){N?j&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,xt[nt].width,xt[nt].height,Dt,Ft,xt[nt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,Yt,xt[nt].width,xt[nt].height,0,Dt,Ft,xt[nt].data);for(let Ct=0;Ct<bt.length;Ct++){let Be=bt[Ct].image[nt].image;N?j&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct+1,0,0,Be.width,Be.height,Dt,Ft,Be.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct+1,Yt,Be.width,Be.height,0,Dt,Ft,Be.data)}}else{N?j&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,0,0,Dt,Ft,xt[nt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,0,Yt,Dt,Ft,xt[nt]);for(let Ct=0;Ct<bt.length;Ct++){let Tt=bt[Ct];N?j&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct+1,0,0,Dt,Ft,Tt.image[nt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+nt,Ct+1,Yt,Dt,Ft,Tt.image[nt])}}}d(_)&&b(i.TEXTURE_CUBE_MAP),lt.__version=$.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function ot(C,_,O,X,$,lt){let ut=r.convert(O.format,O.colorSpace),J=r.convert(O.type),Q=y(O.internalFormat,ut,J,O.normalized,O.colorSpace),ft=n.get(_),It=n.get(O);if(It.__renderTarget=_,!ft.__hasExternalTextures){let xt=Math.max(1,_.width>>lt),pt=Math.max(1,_.height>>lt);$===i.TEXTURE_3D||$===i.TEXTURE_2D_ARRAY?e.texImage3D($,lt,Q,xt,pt,_.depth,0,ut,J,null):e.texImage2D($,lt,Q,xt,pt,0,ut,J,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),we(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,$,It.__webglTexture,0,Le(_)):($===i.TEXTURE_2D||$>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,$,It.__webglTexture,lt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Pe(C,_,O){if(i.bindRenderbuffer(i.RENDERBUFFER,C),_.depthBuffer){let X=_.depthTexture,$=X&&X.isDepthTexture?X.type:null,lt=w(_.stencilBuffer,$),ut=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;we(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Le(_),lt,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,Le(_),lt,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,lt,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ut,i.RENDERBUFFER,C)}else{let X=_.textures;for(let $=0;$<X.length;$++){let lt=X[$],ut=r.convert(lt.format,lt.colorSpace),J=r.convert(lt.type),Q=y(lt.internalFormat,ut,J,lt.normalized,lt.colorSpace);we(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Le(_),Q,_.width,_.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,Le(_),Q,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Q,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function qt(C,_,O){let X=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let $=n.get(_.depthTexture);if($.__renderTarget=_,(!$.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),X){if($.__webglInit===void 0&&($.__webglInit=!0,_.depthTexture.addEventListener("dispose",R)),$.__webglTexture===void 0){$.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,$.__webglTexture),Vt(i.TEXTURE_CUBE_MAP,_.depthTexture);let ft=r.convert(_.depthTexture.format),It=r.convert(_.depthTexture.type),xt;_.depthTexture.format===$n?xt=i.DEPTH_COMPONENT24:_.depthTexture.format===Hi&&(xt=i.DEPTH24_STENCIL8);for(let pt=0;pt<6;pt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+pt,0,xt,_.width,_.height,0,ft,It,null)}}else Z(_.depthTexture,0);let lt=$.__webglTexture,ut=Le(_),J=X?i.TEXTURE_CUBE_MAP_POSITIVE_X+O:i.TEXTURE_2D,Q=_.depthTexture.format===Hi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===$n)we(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,J,lt,0,ut):i.framebufferTexture2D(i.FRAMEBUFFER,Q,J,lt,0);else if(_.depthTexture.format===Hi)we(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,J,lt,0,ut):i.framebufferTexture2D(i.FRAMEBUFFER,Q,J,lt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ae(C){let _=n.get(C),O=C.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==C.depthTexture){let X=C.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),X){let $=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,X.removeEventListener("dispose",$)};X.addEventListener("dispose",$),_.__depthDisposeCallback=$}_.__boundDepthTexture=X}if(C.depthTexture&&!_.__autoAllocateDepthBuffer)if(O)for(let X=0;X<6;X++)qt(_.__webglFramebuffer[X],C,X);else{let X=C.texture.mipmaps;X&&X.length>0?qt(_.__webglFramebuffer[0],C,0):qt(_.__webglFramebuffer,C,0)}else if(O){_.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[X]),_.__webglDepthbuffer[X]===void 0)_.__webglDepthbuffer[X]=i.createRenderbuffer(),Pe(_.__webglDepthbuffer[X],C,!1);else{let $=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,lt=_.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,lt),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,lt)}}else{let X=C.texture.mipmaps;if(X&&X.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),Pe(_.__webglDepthbuffer,C,!1);else{let $=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,lt=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,lt),i.framebufferRenderbuffer(i.FRAMEBUFFER,$,i.RENDERBUFFER,lt)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function ne(C,_,O){let X=n.get(C);_!==void 0&&ot(X.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&ae(C)}function Wt(C){let _=C.texture,O=n.get(C),X=n.get(_);C.addEventListener("dispose",x);let $=C.textures,lt=C.isWebGLCubeRenderTarget===!0,ut=$.length>1;if(ut||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=_.version,a.memory.textures++),lt){O.__webglFramebuffer=[];for(let J=0;J<6;J++)if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer[J]=[];for(let Q=0;Q<_.mipmaps.length;Q++)O.__webglFramebuffer[J][Q]=i.createFramebuffer()}else O.__webglFramebuffer[J]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){O.__webglFramebuffer=[];for(let J=0;J<_.mipmaps.length;J++)O.__webglFramebuffer[J]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(ut)for(let J=0,Q=$.length;J<Q;J++){let ft=n.get($[J]);ft.__webglTexture===void 0&&(ft.__webglTexture=i.createTexture(),a.memory.textures++)}if(C.samples>0&&we(C)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let J=0;J<$.length;J++){let Q=$[J];O.__webglColorRenderbuffer[J]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[J]);let ft=r.convert(Q.format,Q.colorSpace),It=r.convert(Q.type),xt=y(Q.internalFormat,ft,It,Q.normalized,Q.colorSpace,C.isXRRenderTarget===!0),pt=Le(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,pt,xt,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+J,i.RENDERBUFFER,O.__webglColorRenderbuffer[J])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),Pe(O.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(lt){e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),Vt(i.TEXTURE_CUBE_MAP,_);for(let J=0;J<6;J++)if(_.mipmaps&&_.mipmaps.length>0)for(let Q=0;Q<_.mipmaps.length;Q++)ot(O.__webglFramebuffer[J][Q],C,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+J,Q);else ot(O.__webglFramebuffer[J],C,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0);d(_)&&b(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ut){for(let J=0,Q=$.length;J<Q;J++){let ft=$[J],It=n.get(ft),xt=i.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(xt=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(xt,It.__webglTexture),Vt(xt,ft),ot(O.__webglFramebuffer,C,ft,i.COLOR_ATTACHMENT0+J,xt,0),d(ft)&&b(xt)}e.unbindTexture()}else{let J=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(J=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(J,X.__webglTexture),Vt(J,_),_.mipmaps&&_.mipmaps.length>0)for(let Q=0;Q<_.mipmaps.length;Q++)ot(O.__webglFramebuffer[Q],C,_,i.COLOR_ATTACHMENT0,J,Q);else ot(O.__webglFramebuffer,C,_,i.COLOR_ATTACHMENT0,J,0);d(_)&&b(J),e.unbindTexture()}C.depthBuffer&&ae(C)}function zt(C){let _=C.textures;for(let O=0,X=_.length;O<X;O++){let $=_[O];if(d($)){let lt=M(C),ut=n.get($).__webglTexture;e.bindTexture(lt,ut),b(lt),e.unbindTexture()}}}let me=[],Ue=[];function He(C){if(C.samples>0){if(we(C)===!1){let _=C.textures,O=C.width,X=C.height,$=i.COLOR_BUFFER_BIT,lt=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ut=n.get(C),J=_.length>1;if(J)for(let ft=0;ft<_.length;ft++)e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,ut.__webglMultisampledFramebuffer);let Q=C.texture.mipmaps;Q&&Q.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglFramebuffer);for(let ft=0;ft<_.length;ft++){if(C.resolveDepthBuffer&&(C.depthBuffer&&($|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&($|=i.STENCIL_BUFFER_BIT)),J){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ut.__webglColorRenderbuffer[ft]);let It=n.get(_[ft]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,It,0)}i.blitFramebuffer(0,0,O,X,0,0,O,X,$,i.NEAREST),c===!0&&(me.length=0,Ue.length=0,me.push(i.COLOR_ATTACHMENT0+ft),C.depthBuffer&&C.resolveDepthBuffer===!1&&(me.push(lt),Ue.push(lt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ue)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,me))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),J)for(let ft=0;ft<_.length;ft++){e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,ut.__webglColorRenderbuffer[ft]);let It=n.get(_[ft]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,ut.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,It,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ut.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&c){let _=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function Le(C){return Math.min(s.maxSamples,C.samples)}function we(C){let _=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function F(C){let _=a.render.frame;h.get(C)!==_&&(h.set(C,_),C.update())}function xn(C,_){let O=C.colorSpace,X=C.format,$=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||O!==Ar&&O!==vi&&(ie.getTransfer(O)===pe?(X!==Pn||$!==vn)&&Nt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Bt("WebGLTextures: Unsupported texture color space:",O)),_}function ge(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(l.width=C.naturalWidth||C.width,l.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(l.width=C.displayWidth,l.height=C.displayHeight):(l.width=C.width,l.height=C.height),l}this.allocateTextureUnit=W,this.resetTextureUnits=P,this.getTextureUnits=H,this.setTextureUnits=z,this.setTexture2D=Z,this.setTexture2DArray=et,this.setTexture3D=rt,this.setTextureCube=it,this.rebindTextures=ne,this.setupRenderTarget=Wt,this.updateRenderTargetMipmap=zt,this.updateMultisampleRenderTarget=He,this.setupDepthRenderbuffer=ae,this.setupFrameBufferTexture=ot,this.useMultisampledRTT=we,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function wv(i,t){function e(n,s=vi){let r,a=ie.getTransfer(s);if(n===vn)return i.UNSIGNED_BYTE;if(n===Wo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Xo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===uh)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===dh)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===ch)return i.BYTE;if(n===hh)return i.SHORT;if(n===qs)return i.UNSIGNED_SHORT;if(n===Vo)return i.INT;if(n===kn)return i.UNSIGNED_INT;if(n===In)return i.FLOAT;if(n===ni)return i.HALF_FLOAT;if(n===fh)return i.ALPHA;if(n===ph)return i.RGB;if(n===Pn)return i.RGBA;if(n===$n)return i.DEPTH_COMPONENT;if(n===Hi)return i.DEPTH_STENCIL;if(n===qo)return i.RED;if(n===Yo)return i.RED_INTEGER;if(n===Gi)return i.RG;if(n===Zo)return i.RG_INTEGER;if(n===$o)return i.RGBA_INTEGER;if(n===ea||n===na||n===ia||n===sa)if(a===pe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===ea)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===na)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ia)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===sa)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===ea)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===na)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ia)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===sa)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Jo||n===Ko||n===jo||n===Qo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Jo)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ko)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===jo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Qo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===tl||n===el||n===nl||n===il||n===sl||n===ra||n===rl)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===tl||n===el)return a===pe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===nl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===il)return r.COMPRESSED_R11_EAC;if(n===sl)return r.COMPRESSED_SIGNED_R11_EAC;if(n===ra)return r.COMPRESSED_RG11_EAC;if(n===rl)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===al||n===ol||n===ll||n===cl||n===hl||n===ul||n===dl||n===fl||n===pl||n===ml||n===gl||n===xl||n===vl||n===_l)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===al)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ol)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ll)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===cl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===hl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ul)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===dl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===fl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===pl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ml)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===gl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===xl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===vl)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===_l)return a===pe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===yl||n===bl||n===Ml)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===yl)return a===pe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===bl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ml)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===El||n===Sl||n===aa||n===wl)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===El)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Sl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===aa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===wl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ys?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var Tv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Av=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Nh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new Gr(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new tn({vertexShader:Tv,fragmentShader:Av,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new st(new ce(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Uh=class extends Jn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",c=1,l=null,h=null,f=null,u=null,m=null,g=null,v=typeof XRWebGLBinding<"u",p=new Nh,d={},b=e.getContextAttributes(),M=null,y=null,w=[],T=[],R=new Ut,x=null,E=new ze;E.viewport=new Fe;let A=new ze;A.viewport=new Fe;let I=[E,A],D=new Oo,P=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let U=w[K];return U===void 0&&(U=new Hs,w[K]=U),U.getTargetRaySpace()},this.getControllerGrip=function(K){let U=w[K];return U===void 0&&(U=new Hs,w[K]=U),U.getGripSpace()},this.getHand=function(K){let U=w[K];return U===void 0&&(U=new Hs,w[K]=U),U.getHandSpace()};function z(K){let U=T.indexOf(K.inputSource);if(U===-1)return;let k=w[U];k!==void 0&&(k.update(K.inputSource,K.frame,l||a),k.dispatchEvent({type:K.type,data:K.inputSource}))}function W(){s.removeEventListener("select",z),s.removeEventListener("selectstart",z),s.removeEventListener("selectend",z),s.removeEventListener("squeeze",z),s.removeEventListener("squeezestart",z),s.removeEventListener("squeezeend",z),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",q);for(let K=0;K<w.length;K++){let U=T[K];U!==null&&(T[K]=null,w[K].disconnect(U))}P=null,H=null,p.reset();for(let K in d)delete d[K];t.setRenderTarget(M),m=null,u=null,f=null,s=null,y=null,Vt.stop(),n.isPresenting=!1,t.setPixelRatio(x),t.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&Nt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,n.isPresenting===!0&&Nt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(K){l=K},this.getBaseLayer=function(){return u!==null?u:m},this.getBinding=function(){return f===null&&v&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(M=t.getRenderTarget(),s.addEventListener("select",z),s.addEventListener("selectstart",z),s.addEventListener("selectend",z),s.addEventListener("squeeze",z),s.addEventListener("squeezestart",z),s.addEventListener("squeezeend",z),s.addEventListener("end",W),s.addEventListener("inputsourceschange",q),b.xrCompatible!==!0&&await e.makeXRCompatible(),x=t.getPixelRatio(),t.getSize(R),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let k=null,tt=null,ct=null;b.depth&&(ct=b.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,k=b.stencil?Hi:$n,tt=b.stencil?Ys:kn);let ot={colorFormat:e.RGBA8,depthFormat:ct,scaleFactor:r};f=this.getBinding(),u=f.createProjectionLayer(ot),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),y=new hn(u.textureWidth,u.textureHeight,{format:Pn,type:vn,depthTexture:new gi(u.textureWidth,u.textureHeight,tt,void 0,void 0,void 0,void 0,void 0,void 0,k),stencilBuffer:b.stencil,colorSpace:t.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let k={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,k),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),y=new hn(m.framebufferWidth,m.framebufferHeight,{format:Pn,type:vn,colorSpace:t.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),Vt.setContext(s),Vt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return p.getDepthTexture()};function q(K){for(let U=0;U<K.removed.length;U++){let k=K.removed[U],tt=T.indexOf(k);tt>=0&&(T[tt]=null,w[tt].disconnect(k))}for(let U=0;U<K.added.length;U++){let k=K.added[U],tt=T.indexOf(k);if(tt===-1){for(let ot=0;ot<w.length;ot++)if(ot>=T.length){T.push(k),tt=ot;break}else if(T[ot]===null){T[ot]=k,tt=ot;break}if(tt===-1)break}let ct=w[tt];ct&&ct.connect(k)}}let Z=new L,et=new L;function rt(K,U,k){Z.setFromMatrixPosition(U.matrixWorld),et.setFromMatrixPosition(k.matrixWorld);let tt=Z.distanceTo(et),ct=U.projectionMatrix.elements,ot=k.projectionMatrix.elements,Pe=ct[14]/(ct[10]-1),qt=ct[14]/(ct[10]+1),ae=(ct[9]+1)/ct[5],ne=(ct[9]-1)/ct[5],Wt=(ct[8]-1)/ct[0],zt=(ot[8]+1)/ot[0],me=Pe*Wt,Ue=Pe*zt,He=tt/(-Wt+zt),Le=He*-Wt;if(U.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Le),K.translateZ(He),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),ct[10]===-1)K.projectionMatrix.copy(U.projectionMatrix),K.projectionMatrixInverse.copy(U.projectionMatrixInverse);else{let we=Pe+He,F=qt+He,xn=me-Le,ge=Ue+(tt-Le),C=ae*qt/F*we,_=ne*qt/F*we;K.projectionMatrix.makePerspective(xn,ge,C,_,we,F),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function it(K,U){U===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(U.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let U=K.near,k=K.far;p.texture!==null&&(p.depthNear>0&&(U=p.depthNear),p.depthFar>0&&(k=p.depthFar)),D.near=A.near=E.near=U,D.far=A.far=E.far=k,(P!==D.near||H!==D.far)&&(s.updateRenderState({depthNear:D.near,depthFar:D.far}),P=D.near,H=D.far),D.layers.mask=K.layers.mask|6,E.layers.mask=D.layers.mask&-5,A.layers.mask=D.layers.mask&-3;let tt=K.parent,ct=D.cameras;it(D,tt);for(let ot=0;ot<ct.length;ot++)it(ct[ot],tt);ct.length===2?rt(D,E,A):D.projectionMatrix.copy(E.projectionMatrix),at(K,D,tt)};function at(K,U,k){k===null?K.matrix.copy(U.matrixWorld):(K.matrix.copy(k.matrixWorld),K.matrix.invert(),K.matrix.multiply(U.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(U.projectionMatrix),K.projectionMatrixInverse.copy(U.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=as*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return D},this.getFoveation=function(){if(!(u===null&&m===null))return c},this.setFoveation=function(K){c=K,u!==null&&(u.fixedFoveation=K),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=K)},this.hasDepthSensing=function(){return p.texture!==null},this.getDepthSensingMesh=function(){return p.getMesh(D)},this.getCameraTexture=function(K){return d[K]};let Ht=null;function Gt(K,U){if(h=U.getViewerPose(l||a),g=U,h!==null){let k=h.views;m!==null&&(t.setRenderTargetFramebuffer(y,m.framebuffer),t.setRenderTarget(y));let tt=!1;k.length!==D.cameras.length&&(D.cameras.length=0,tt=!0);for(let qt=0;qt<k.length;qt++){let ae=k[qt],ne=null;if(m!==null)ne=m.getViewport(ae);else{let zt=f.getViewSubImage(u,ae);ne=zt.viewport,qt===0&&(t.setRenderTargetTextures(y,zt.colorTexture,zt.depthStencilTexture),t.setRenderTarget(y))}let Wt=I[qt];Wt===void 0&&(Wt=new ze,Wt.layers.enable(qt),Wt.viewport=new Fe,I[qt]=Wt),Wt.matrix.fromArray(ae.transform.matrix),Wt.matrix.decompose(Wt.position,Wt.quaternion,Wt.scale),Wt.projectionMatrix.fromArray(ae.projectionMatrix),Wt.projectionMatrixInverse.copy(Wt.projectionMatrix).invert(),Wt.viewport.set(ne.x,ne.y,ne.width,ne.height),qt===0&&(D.matrix.copy(Wt.matrix),D.matrix.decompose(D.position,D.quaternion,D.scale)),tt===!0&&D.cameras.push(Wt)}let ct=s.enabledFeatures;if(ct&&ct.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&v){f=n.getBinding();let qt=f.getDepthInformation(k[0]);qt&&qt.isValid&&qt.texture&&p.init(qt,s.renderState)}if(ct&&ct.includes("camera-access")&&v){t.state.unbindTexture(),f=n.getBinding();for(let qt=0;qt<k.length;qt++){let ae=k[qt].camera;if(ae){let ne=d[ae];ne||(ne=new Gr,d[ae]=ne);let Wt=f.getCameraImage(ae);ne.sourceTexture=Wt}}}}for(let k=0;k<w.length;k++){let tt=T[k],ct=w[k];tt!==null&&ct!==void 0&&ct.update(tt,U,l||a)}Ht&&Ht(K,U),U.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:U}),g=null}let Vt=new nf;Vt.setAnimationLoop(Gt),this.setAnimationLoop=function(K){Ht=K},this.dispose=function(){}}},Rv=new oe,cf=new Xt;cf.set(-1,0,0,0,1,0,0,0,1);function Cv(i,t){function e(p,d){p.matrixAutoUpdate===!0&&p.updateMatrix(),d.value.copy(p.matrix)}function n(p,d){d.color.getRGB(p.fogColor.value,xh(i)),d.isFog?(p.fogNear.value=d.near,p.fogFar.value=d.far):d.isFogExp2&&(p.fogDensity.value=d.density)}function s(p,d,b,M,y){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?r(p,d):d.isMeshLambertMaterial?(r(p,d),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(r(p,d),f(p,d)):d.isMeshPhongMaterial?(r(p,d),h(p,d),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(r(p,d),u(p,d),d.isMeshPhysicalMaterial&&m(p,d,y)):d.isMeshMatcapMaterial?(r(p,d),g(p,d)):d.isMeshDepthMaterial?r(p,d):d.isMeshDistanceMaterial?(r(p,d),v(p,d)):d.isMeshNormalMaterial?r(p,d):d.isLineBasicMaterial?(a(p,d),d.isLineDashedMaterial&&o(p,d)):d.isPointsMaterial?c(p,d,b,M):d.isSpriteMaterial?l(p,d):d.isShadowMaterial?(p.color.value.copy(d.color),p.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(p,d){p.opacity.value=d.opacity,d.color&&p.diffuse.value.copy(d.color),d.emissive&&p.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(p.map.value=d.map,e(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.bumpMap&&(p.bumpMap.value=d.bumpMap,e(d.bumpMap,p.bumpMapTransform),p.bumpScale.value=d.bumpScale,d.side===rn&&(p.bumpScale.value*=-1)),d.normalMap&&(p.normalMap.value=d.normalMap,e(d.normalMap,p.normalMapTransform),p.normalScale.value.copy(d.normalScale),d.side===rn&&p.normalScale.value.negate()),d.displacementMap&&(p.displacementMap.value=d.displacementMap,e(d.displacementMap,p.displacementMapTransform),p.displacementScale.value=d.displacementScale,p.displacementBias.value=d.displacementBias),d.emissiveMap&&(p.emissiveMap.value=d.emissiveMap,e(d.emissiveMap,p.emissiveMapTransform)),d.specularMap&&(p.specularMap.value=d.specularMap,e(d.specularMap,p.specularMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest);let b=t.get(d),M=b.envMap,y=b.envMapRotation;M&&(p.envMap.value=M,p.envMapRotation.value.setFromMatrix4(Rv.makeRotationFromEuler(y)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&p.envMapRotation.value.premultiply(cf),p.reflectivity.value=d.reflectivity,p.ior.value=d.ior,p.refractionRatio.value=d.refractionRatio),d.lightMap&&(p.lightMap.value=d.lightMap,p.lightMapIntensity.value=d.lightMapIntensity,e(d.lightMap,p.lightMapTransform)),d.aoMap&&(p.aoMap.value=d.aoMap,p.aoMapIntensity.value=d.aoMapIntensity,e(d.aoMap,p.aoMapTransform))}function a(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,d.map&&(p.map.value=d.map,e(d.map,p.mapTransform))}function o(p,d){p.dashSize.value=d.dashSize,p.totalSize.value=d.dashSize+d.gapSize,p.scale.value=d.scale}function c(p,d,b,M){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.size.value=d.size*b,p.scale.value=M*.5,d.map&&(p.map.value=d.map,e(d.map,p.uvTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function l(p,d){p.diffuse.value.copy(d.color),p.opacity.value=d.opacity,p.rotation.value=d.rotation,d.map&&(p.map.value=d.map,e(d.map,p.mapTransform)),d.alphaMap&&(p.alphaMap.value=d.alphaMap,e(d.alphaMap,p.alphaMapTransform)),d.alphaTest>0&&(p.alphaTest.value=d.alphaTest)}function h(p,d){p.specular.value.copy(d.specular),p.shininess.value=Math.max(d.shininess,1e-4)}function f(p,d){d.gradientMap&&(p.gradientMap.value=d.gradientMap)}function u(p,d){p.metalness.value=d.metalness,d.metalnessMap&&(p.metalnessMap.value=d.metalnessMap,e(d.metalnessMap,p.metalnessMapTransform)),p.roughness.value=d.roughness,d.roughnessMap&&(p.roughnessMap.value=d.roughnessMap,e(d.roughnessMap,p.roughnessMapTransform)),d.envMap&&(p.envMapIntensity.value=d.envMapIntensity)}function m(p,d,b){p.ior.value=d.ior,d.sheen>0&&(p.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),p.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(p.sheenColorMap.value=d.sheenColorMap,e(d.sheenColorMap,p.sheenColorMapTransform)),d.sheenRoughnessMap&&(p.sheenRoughnessMap.value=d.sheenRoughnessMap,e(d.sheenRoughnessMap,p.sheenRoughnessMapTransform))),d.clearcoat>0&&(p.clearcoat.value=d.clearcoat,p.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(p.clearcoatMap.value=d.clearcoatMap,e(d.clearcoatMap,p.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,e(d.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(p.clearcoatNormalMap.value=d.clearcoatNormalMap,e(d.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===rn&&p.clearcoatNormalScale.value.negate())),d.dispersion>0&&(p.dispersion.value=d.dispersion),d.iridescence>0&&(p.iridescence.value=d.iridescence,p.iridescenceIOR.value=d.iridescenceIOR,p.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(p.iridescenceMap.value=d.iridescenceMap,e(d.iridescenceMap,p.iridescenceMapTransform)),d.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=d.iridescenceThicknessMap,e(d.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),d.transmission>0&&(p.transmission.value=d.transmission,p.transmissionSamplerMap.value=b.texture,p.transmissionSamplerSize.value.set(b.width,b.height),d.transmissionMap&&(p.transmissionMap.value=d.transmissionMap,e(d.transmissionMap,p.transmissionMapTransform)),p.thickness.value=d.thickness,d.thicknessMap&&(p.thicknessMap.value=d.thicknessMap,e(d.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=d.attenuationDistance,p.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(p.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(p.anisotropyMap.value=d.anisotropyMap,e(d.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=d.specularIntensity,p.specularColor.value.copy(d.specularColor),d.specularColorMap&&(p.specularColorMap.value=d.specularColorMap,e(d.specularColorMap,p.specularColorMapTransform)),d.specularIntensityMap&&(p.specularIntensityMap.value=d.specularIntensityMap,e(d.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,d){d.matcap&&(p.matcap.value=d.matcap)}function v(p,d){let b=t.get(d).light;p.referencePosition.value.setFromMatrixPosition(b.matrixWorld),p.nearDistance.value=b.shadow.camera.near,p.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Iv(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(y,w){let T=w.program;n.uniformBlockBinding(y,T)}function l(y,w){let T=s[y.id];T===void 0&&(p(y),T=h(y),s[y.id]=T,y.addEventListener("dispose",b));let R=w.program;n.updateUBOMapping(y,R);let x=t.render.frame;r[y.id]!==x&&(u(y),r[y.id]=x)}function h(y){let w=f();y.__bindingPointIndex=w;let T=i.createBuffer(),R=y.__size,x=y.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,R,x),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,T),T}function f(){for(let y=0;y<o;y++)if(a.indexOf(y)===-1)return a.push(y),y;return Bt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(y){let w=s[y.id],T=y.uniforms,R=y.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let x=0,E=T.length;x<E;x++){let A=T[x];if(Array.isArray(A))for(let I=0,D=A.length;I<D;I++)m(A[I],x,I,R);else m(A,x,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(y,w,T,R){if(v(y,w,T,R)===!0){let x=y.__offset,E=y.value;if(Array.isArray(E)){let A=0;for(let I=0;I<E.length;I++){let D=E[I],P=d(D);g(D,y.__data,A),typeof D!="number"&&typeof D!="boolean"&&!D.isMatrix3&&!ArrayBuffer.isView(D)&&(A+=P.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(E,y.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,x,y.__data)}}function g(y,w,T){typeof y=="number"||typeof y=="boolean"?w[0]=y:y.isMatrix3?(w[0]=y.elements[0],w[1]=y.elements[1],w[2]=y.elements[2],w[3]=0,w[4]=y.elements[3],w[5]=y.elements[4],w[6]=y.elements[5],w[7]=0,w[8]=y.elements[6],w[9]=y.elements[7],w[10]=y.elements[8],w[11]=0):ArrayBuffer.isView(y)?w.set(new y.constructor(y.buffer,y.byteOffset,w.length)):y.toArray(w,T)}function v(y,w,T,R){let x=y.value,E=w+"_"+T;if(R[E]===void 0)return typeof x=="number"||typeof x=="boolean"?R[E]=x:ArrayBuffer.isView(x)?R[E]=x.slice():R[E]=x.clone(),!0;{let A=R[E];if(typeof x=="number"||typeof x=="boolean"){if(A!==x)return R[E]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(A.equals(x)===!1)return A.copy(x),!0}}return!1}function p(y){let w=y.uniforms,T=0,R=16;for(let E=0,A=w.length;E<A;E++){let I=Array.isArray(w[E])?w[E]:[w[E]];for(let D=0,P=I.length;D<P;D++){let H=I[D],z=Array.isArray(H.value)?H.value:[H.value];for(let W=0,q=z.length;W<q;W++){let Z=z[W],et=d(Z),rt=T%R,it=rt%et.boundary,at=rt+it;T+=it,at!==0&&R-at<et.storage&&(T+=R-at),H.__data=new Float32Array(et.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=T,T+=et.storage}}}let x=T%R;return x>0&&(T+=R-x),y.__size=T,y.__cache={},this}function d(y){let w={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(w.boundary=4,w.storage=4):y.isVector2?(w.boundary=8,w.storage=8):y.isVector3||y.isColor?(w.boundary=16,w.storage=12):y.isVector4?(w.boundary=16,w.storage=16):y.isMatrix3?(w.boundary=48,w.storage=48):y.isMatrix4?(w.boundary=64,w.storage=64):y.isTexture?Nt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(w.boundary=16,w.storage=y.byteLength):Nt("WebGLRenderer: Unsupported uniform value type.",y),w}function b(y){let w=y.target;w.removeEventListener("dispose",b);let T=a.indexOf(w.__bindingPointIndex);a.splice(T,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function M(){for(let y in s)i.deleteBuffer(s[y]);a=[],s={},r={}}return{bind:c,update:l,dispose:M}}var Pv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ii=null;function Lv(){return ii===null&&(ii=new zr(Pv,16,16,Gi,ni),ii.name="DFG_LUT",ii.minFilter=nn,ii.magFilter=nn,ii.wrapS=Zn,ii.wrapT=Zn,ii.generateMipmaps=!1,ii.needsUpdate=!0),ii}var Dl=class{constructor(t={}){let{canvas:e=Td(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:m=vn}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;let v=m,p=new Set([$o,Zo,Yo]),d=new Set([vn,kn,qs,Ys,Wo,Xo]),b=new Uint32Array(4),M=new Int32Array(4),y=new L,w=null,T=null,R=[],x=[],E=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=zn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let A=this,I=!1,D=null,P=null,H=null,z=null;this._outputColorSpace=Re;let W=0,q=0,Z=null,et=-1,rt=null,it=new Fe,at=new Fe,Ht=null,Gt=new wt(0),Vt=0,K=e.width,U=e.height,k=1,tt=null,ct=null,ot=new Fe(0,0,K,U),Pe=new Fe(0,0,K,U),qt=!1,ae=new Ws,ne=!1,Wt=!1,zt=new oe,me=new L,Ue=new Fe,He={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Le=!1;function we(){return Z===null?k:1}let F=n;function xn(S,B){return e.getContext(S,B)}try{let S={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"185"}`),e.addEventListener("webglcontextlost",Be,!1),e.addEventListener("webglcontextrestored",Te,!1),e.addEventListener("webglcontextcreationerror",Vn,!1),F===null){let B="webgl2";if(F=xn(B,S),F===null)throw xn(B)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(S){throw Bt("WebGLRenderer: "+S.message),S}let ge,C,_,O,X,$,lt,ut,J,Q,ft,It,xt,pt,Dt,Ft,Yt,N,ht,j,mt,bt,nt;function Ct(){ge=new zg(F),ge.init(),mt=new wv(F,ge),C=new Pg(F,ge,t,mt),_=new Ev(F,ge),C.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),P=F.createFramebuffer(),H=F.createFramebuffer(),z=F.createFramebuffer(),O=new Gg(F),X=new cv,$=new Sv(F,ge,_,X,C,mt,O),lt=new Og(A),ut=new qp(F),bt=new Cg(F,ut),J=new kg(F,ut,O,bt),Q=new Wg(F,J,ut,bt,O),N=new Vg(F,C,$),Dt=new Lg(X),ft=new lv(A,lt,ge,C,bt,Dt),It=new Cv(A,X),xt=new uv,pt=new xv(ge),Yt=new Rg(A,lt,_,Q,g,c),Ft=new Mv(A,Q,C),nt=new Iv(F,O,C,_),ht=new Ig(F,ge,O),j=new Hg(F,ge,O),O.programs=ft.programs,A.capabilities=C,A.extensions=ge,A.properties=X,A.renderLists=xt,A.shadowMap=Ft,A.state=_,A.info=O}Ct(),v!==vn&&(E=new qg(v,e.width,e.height,o,s,r));let Tt=new Uh(A,F);this.xr=Tt,this.getContext=function(){return F},this.getContextAttributes=function(){return F.getContextAttributes()},this.forceContextLoss=function(){let S=ge.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=ge.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return k},this.setPixelRatio=function(S){S!==void 0&&(k=S,this.setSize(K,U,!1))},this.getSize=function(S){return S.set(K,U)},this.setSize=function(S,B,Y=!0){if(Tt.isPresenting){Nt("WebGLRenderer: Can't change size while VR device is presenting.");return}K=S,U=B,e.width=Math.floor(S*k),e.height=Math.floor(B*k),Y===!0&&(e.style.width=S+"px",e.style.height=B+"px"),E!==null&&E.setSize(e.width,e.height),this.setViewport(0,0,S,B)},this.getDrawingBufferSize=function(S){return S.set(K*k,U*k).floor()},this.setDrawingBufferSize=function(S,B,Y){K=S,U=B,k=Y,e.width=Math.floor(S*Y),e.height=Math.floor(B*Y),this.setViewport(0,0,S,B)},this.setEffects=function(S){if(v===vn){Bt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(S){for(let B=0;B<S.length;B++)if(S[B].isOutputPass===!0){Nt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(S||[])},this.getCurrentViewport=function(S){return S.copy(it)},this.getViewport=function(S){return S.copy(ot)},this.setViewport=function(S,B,Y,G){S.isVector4?ot.set(S.x,S.y,S.z,S.w):ot.set(S,B,Y,G),_.viewport(it.copy(ot).multiplyScalar(k).round())},this.getScissor=function(S){return S.copy(Pe)},this.setScissor=function(S,B,Y,G){S.isVector4?Pe.set(S.x,S.y,S.z,S.w):Pe.set(S,B,Y,G),_.scissor(at.copy(Pe).multiplyScalar(k).round())},this.getScissorTest=function(){return qt},this.setScissorTest=function(S){_.setScissorTest(qt=S)},this.setOpaqueSort=function(S){tt=S},this.setTransparentSort=function(S){ct=S},this.getClearColor=function(S){return S.copy(Yt.getClearColor())},this.setClearColor=function(){Yt.setClearColor(...arguments)},this.getClearAlpha=function(){return Yt.getClearAlpha()},this.setClearAlpha=function(){Yt.setClearAlpha(...arguments)},this.clear=function(S=!0,B=!0,Y=!0){let G=0;if(S){let V=!1;if(Z!==null){let yt=Z.texture.format;V=p.has(yt)}if(V){let yt=Z.texture.type,Et=d.has(yt),_t=Yt.getClearColor(),Rt=Yt.getClearAlpha(),Pt=_t.r,Zt=_t.g,Kt=_t.b;Et?(b[0]=Pt,b[1]=Zt,b[2]=Kt,b[3]=Rt,F.clearBufferuiv(F.COLOR,0,b)):(M[0]=Pt,M[1]=Zt,M[2]=Kt,M[3]=Rt,F.clearBufferiv(F.COLOR,0,M))}else G|=F.COLOR_BUFFER_BIT}B&&(G|=F.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Y&&(G|=F.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&F.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(S){S.setRenderer(this),D=S},this.dispose=function(){e.removeEventListener("webglcontextlost",Be,!1),e.removeEventListener("webglcontextrestored",Te,!1),e.removeEventListener("webglcontextcreationerror",Vn,!1),Yt.dispose(),xt.dispose(),pt.dispose(),X.dispose(),lt.dispose(),Q.dispose(),bt.dispose(),nt.dispose(),ft.dispose(),Tt.dispose(),Tt.removeEventListener("sessionstart",uu),Tt.removeEventListener("sessionend",du),Ki.stop()};function Be(S){S.preventDefault(),Ir("WebGLRenderer: Context Lost."),I=!0}function Te(){Ir("WebGLRenderer: Context Restored."),I=!1;let S=O.autoReset,B=Ft.enabled,Y=Ft.autoUpdate,G=Ft.needsUpdate,V=Ft.type;Ct(),O.autoReset=S,Ft.enabled=B,Ft.autoUpdate=Y,Ft.needsUpdate=G,Ft.type=V}function Vn(S){Bt("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Wn(S){let B=S.target;B.removeEventListener("dispose",Wn),kf(B)}function kf(S){Hf(S),X.remove(S)}function Hf(S){let B=X.get(S).programs;B!==void 0&&(B.forEach(function(Y){ft.releaseProgram(Y)}),S.isShaderMaterial&&ft.releaseShaderCache(S))}this.renderBufferDirect=function(S,B,Y,G,V,yt){B===null&&(B=He);let Et=V.isMesh&&V.matrixWorld.determinantAffine()<0,_t=Wf(S,B,Y,G,V);_.setMaterial(G,Et);let Rt=Y.index,Pt=1;if(G.wireframe===!0){if(Rt=J.getWireframeAttribute(Y),Rt===void 0)return;Pt=2}let Zt=Y.drawRange,Kt=Y.attributes.position,Lt=Zt.start*Pt,ve=(Zt.start+Zt.count)*Pt;yt!==null&&(Lt=Math.max(Lt,yt.start*Pt),ve=Math.min(ve,(yt.start+yt.count)*Pt)),Rt!==null?(Lt=Math.max(Lt,0),ve=Math.min(ve,Rt.count)):Kt!=null&&(Lt=Math.max(Lt,0),ve=Math.min(ve,Kt.count));let Ge=ve-Lt;if(Ge<0||Ge===1/0)return;bt.setup(V,G,_t,Y,Rt);let Oe,Ee=ht;if(Rt!==null&&(Oe=ut.get(Rt),Ee=j,Ee.setIndex(Oe)),V.isMesh)G.wireframe===!0?(_.setLineWidth(G.wireframeLinewidth*we()),Ee.setMode(F.LINES)):Ee.setMode(F.TRIANGLES);else if(V.isLine){let on=G.linewidth;on===void 0&&(on=1),_.setLineWidth(on*we()),V.isLineSegments?Ee.setMode(F.LINES):V.isLineLoop?Ee.setMode(F.LINE_LOOP):Ee.setMode(F.LINE_STRIP)}else V.isPoints?Ee.setMode(F.POINTS):V.isSprite&&Ee.setMode(F.TRIANGLES);if(V.isBatchedMesh)if(ge.get("WEBGL_multi_draw"))Ee.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let on=V._multiDrawStarts,Mt=V._multiDrawCounts,bn=V._multiDrawCount,le=Rt?ut.get(Rt).bytesPerElement:1,Rn=X.get(G).currentProgram.getUniforms();for(let Xn=0;Xn<bn;Xn++)Rn.setValue(F,"_gl_DrawID",Xn),Ee.render(on[Xn]/le,Mt[Xn])}else if(V.isInstancedMesh)Ee.renderInstances(Lt,Ge,V.count);else if(Y.isInstancedBufferGeometry){let on=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Mt=Math.min(Y.instanceCount,on);Ee.renderInstances(Lt,Ge,Mt)}else Ee.render(Lt,Ge)};function hu(S,B,Y){S.transparent===!0&&S.side===Ze&&S.forceSinglePass===!1?(S.side=rn,S.needsUpdate=!0,Ra(S,B,Y),S.side=pi,S.needsUpdate=!0,Ra(S,B,Y),S.side=Ze):Ra(S,B,Y)}this.compile=function(S,B,Y=null){Y===null&&(Y=S),T=pt.get(Y),T.init(B),x.push(T),Y.traverseVisible(function(V){V.isLight&&V.layers.test(B.layers)&&(T.pushLight(V),V.castShadow&&T.pushShadow(V))}),S!==Y&&S.traverseVisible(function(V){V.isLight&&V.layers.test(B.layers)&&(T.pushLight(V),V.castShadow&&T.pushShadow(V))}),T.setupLights();let G=new Set;return S.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let yt=V.material;if(yt)if(Array.isArray(yt))for(let Et=0;Et<yt.length;Et++){let _t=yt[Et];hu(_t,Y,V),G.add(_t)}else hu(yt,Y,V),G.add(yt)}),T=x.pop(),G},this.compileAsync=function(S,B,Y=null){let G=this.compile(S,B,Y);return new Promise(V=>{function yt(){if(G.forEach(function(Et){X.get(Et).currentProgram.isReady()&&G.delete(Et)}),G.size===0){V(S);return}setTimeout(yt,10)}ge.get("KHR_parallel_shader_compile")!==null?yt():setTimeout(yt,10)})};let gc=null;function Gf(S){gc&&gc(S)}function uu(){Ki.stop()}function du(){Ki.start()}let Ki=new nf;Ki.setAnimationLoop(Gf),typeof self<"u"&&Ki.setContext(self),this.setAnimationLoop=function(S){gc=S,Tt.setAnimationLoop(S),S===null?Ki.stop():Ki.start()},Tt.addEventListener("sessionstart",uu),Tt.addEventListener("sessionend",du),this.render=function(S,B){if(B!==void 0&&B.isCamera!==!0){Bt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;D!==null&&D.renderStart(S,B);let Y=Tt.enabled===!0&&Tt.isPresenting===!0,G=E!==null&&(Z===null||Y)&&E.begin(A,Z);if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),B.parent===null&&B.matrixWorldAutoUpdate===!0&&B.updateMatrixWorld(),Tt.enabled===!0&&Tt.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(Tt.cameraAutoUpdate===!0&&Tt.updateCamera(B),B=Tt.getCamera()),S.isScene===!0&&S.onBeforeRender(A,S,B,Z),T=pt.get(S,x.length),T.init(B),T.state.textureUnits=$.getTextureUnits(),x.push(T),zt.multiplyMatrices(B.projectionMatrix,B.matrixWorldInverse),ae.setFromProjectionMatrix(zt,On,B.reversedDepth),Wt=this.localClippingEnabled,ne=Dt.init(this.clippingPlanes,Wt),w=xt.get(S,R.length),w.init(),R.push(w),Tt.enabled===!0&&Tt.isPresenting===!0){let Et=A.xr.getDepthSensingMesh();Et!==null&&xc(Et,B,-1/0,A.sortObjects)}xc(S,B,0,A.sortObjects),w.finish(),A.sortObjects===!0&&w.sort(tt,ct,B.reversedDepth),Le=Tt.enabled===!1||Tt.isPresenting===!1||Tt.hasDepthSensing()===!1,Le&&Yt.addToRenderList(w,S),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ne===!0&&Dt.beginShadows();let V=T.state.shadowsArray;if(Ft.render(V,S,B),ne===!0&&Dt.endShadows(),(G&&E.hasRenderPass())===!1){let Et=w.opaque,_t=w.transmissive;if(T.setupLights(),B.isArrayCamera){let Rt=B.cameras;if(_t.length>0)for(let Pt=0,Zt=Rt.length;Pt<Zt;Pt++){let Kt=Rt[Pt];pu(Et,_t,S,Kt)}Le&&Yt.render(S);for(let Pt=0,Zt=Rt.length;Pt<Zt;Pt++){let Kt=Rt[Pt];fu(w,S,Kt,Kt.viewport)}}else _t.length>0&&pu(Et,_t,S,B),Le&&Yt.render(S),fu(w,S,B)}Z!==null&&q===0&&($.updateMultisampleRenderTarget(Z),$.updateRenderTargetMipmap(Z)),G&&E.end(A),S.isScene===!0&&S.onAfterRender(A,S,B),bt.resetDefaultState(),et=-1,rt=null,x.pop(),x.length>0?(T=x[x.length-1],$.setTextureUnits(T.state.textureUnits),ne===!0&&Dt.setGlobalState(A.clippingPlanes,T.state.camera)):T=null,R.pop(),R.length>0?w=R[R.length-1]:w=null,D!==null&&D.renderEnd()};function xc(S,B,Y,G){if(S.visible===!1)return;if(S.layers.test(B.layers)){if(S.isGroup)Y=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(B);else if(S.isLightProbeGrid)T.pushLightProbeGrid(S);else if(S.isLight)T.pushLight(S),S.castShadow&&T.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||ae.intersectsSprite(S)){G&&Ue.setFromMatrixPosition(S.matrixWorld).applyMatrix4(zt);let Et=Q.update(S),_t=S.material;_t.visible&&w.push(S,Et,_t,Y,Ue.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||ae.intersectsObject(S))){let Et=Q.update(S),_t=S.material;if(G&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),Ue.copy(S.boundingSphere.center)):(Et.boundingSphere===null&&Et.computeBoundingSphere(),Ue.copy(Et.boundingSphere.center)),Ue.applyMatrix4(S.matrixWorld).applyMatrix4(zt)),Array.isArray(_t)){let Rt=Et.groups;for(let Pt=0,Zt=Rt.length;Pt<Zt;Pt++){let Kt=Rt[Pt],Lt=_t[Kt.materialIndex];Lt&&Lt.visible&&w.push(S,Et,Lt,Y,Ue.z,Kt)}}else _t.visible&&w.push(S,Et,_t,Y,Ue.z,null)}}let yt=S.children;for(let Et=0,_t=yt.length;Et<_t;Et++)xc(yt[Et],B,Y,G)}function fu(S,B,Y,G){let{opaque:V,transmissive:yt,transparent:Et}=S;T.setupLightsView(Y),ne===!0&&Dt.setGlobalState(A.clippingPlanes,Y),G&&_.viewport(it.copy(G)),V.length>0&&Aa(V,B,Y),yt.length>0&&Aa(yt,B,Y),Et.length>0&&Aa(Et,B,Y),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function pu(S,B,Y,G){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;if(T.state.transmissionRenderTarget[G.id]===void 0){let Lt=ge.has("EXT_color_buffer_half_float")||ge.has("EXT_color_buffer_float");T.state.transmissionRenderTarget[G.id]=new hn(1,1,{generateMipmaps:!0,type:Lt?ni:vn,minFilter:ki,samples:Math.max(4,C.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ie.workingColorSpace})}let yt=T.state.transmissionRenderTarget[G.id],Et=G.viewport||it;yt.setSize(Et.z*A.transmissionResolutionScale,Et.w*A.transmissionResolutionScale);let _t=A.getRenderTarget(),Rt=A.getActiveCubeFace(),Pt=A.getActiveMipmapLevel();A.setRenderTarget(yt),A.getClearColor(Gt),Vt=A.getClearAlpha(),Vt<1&&A.setClearColor(16777215,.5),A.clear(),Le&&Yt.render(Y);let Zt=A.toneMapping;A.toneMapping=zn;let Kt=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),T.setupLightsView(G),ne===!0&&Dt.setGlobalState(A.clippingPlanes,G),Aa(S,Y,G),$.updateMultisampleRenderTarget(yt),$.updateRenderTargetMipmap(yt),ge.has("WEBGL_multisampled_render_to_texture")===!1){let Lt=!1;for(let ve=0,Ge=B.length;ve<Ge;ve++){let Oe=B[ve],{object:Ee,geometry:on,material:Mt,group:bn}=Oe;if(Mt.side===Ze&&Ee.layers.test(G.layers)){let le=Mt.side;Mt.side=rn,Mt.needsUpdate=!0,mu(Ee,Y,G,on,Mt,bn),Mt.side=le,Mt.needsUpdate=!0,Lt=!0}}Lt===!0&&($.updateMultisampleRenderTarget(yt),$.updateRenderTargetMipmap(yt))}A.setRenderTarget(_t,Rt,Pt),A.setClearColor(Gt,Vt),Kt!==void 0&&(G.viewport=Kt),A.toneMapping=Zt}function Aa(S,B,Y){let G=B.isScene===!0?B.overrideMaterial:null;for(let V=0,yt=S.length;V<yt;V++){let Et=S[V],{object:_t,geometry:Rt,group:Pt}=Et,Zt=Et.material;Zt.allowOverride===!0&&G!==null&&(Zt=G),_t.layers.test(Y.layers)&&mu(_t,B,Y,Rt,Zt,Pt)}}function mu(S,B,Y,G,V,yt){S.onBeforeRender(A,B,Y,G,V,yt),S.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),V.onBeforeRender(A,B,Y,G,S,yt),V.transparent===!0&&V.side===Ze&&V.forceSinglePass===!1?(V.side=rn,V.needsUpdate=!0,A.renderBufferDirect(Y,B,G,V,S,yt),V.side=pi,V.needsUpdate=!0,A.renderBufferDirect(Y,B,G,V,S,yt),V.side=Ze):A.renderBufferDirect(Y,B,G,V,S,yt),S.onAfterRender(A,B,Y,G,V,yt)}function Ra(S,B,Y){B.isScene!==!0&&(B=He);let G=X.get(S),V=T.state.lights,yt=T.state.shadowsArray,Et=V.state.version,_t=ft.getParameters(S,V.state,yt,B,Y,T.state.lightProbeGridArray),Rt=ft.getProgramCacheKey(_t),Pt=G.programs;G.environment=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?B.environment:null,G.fog=B.fog;let Zt=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap;G.envMap=lt.get(S.envMap||G.environment,Zt),G.envMapRotation=G.environment!==null&&S.envMap===null?B.environmentRotation:S.envMapRotation,Pt===void 0&&(S.addEventListener("dispose",Wn),Pt=new Map,G.programs=Pt);let Kt=Pt.get(Rt);if(Kt!==void 0){if(G.currentProgram===Kt&&G.lightsStateVersion===Et)return xu(S,_t),Kt}else _t.uniforms=ft.getUniforms(S),D!==null&&S.isNodeMaterial&&D.build(S,Y,_t),S.onBeforeCompile(_t,A),Kt=ft.acquireProgram(_t,Rt),Pt.set(Rt,Kt),G.uniforms=_t.uniforms;let Lt=G.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Lt.clippingPlanes=Dt.uniform),xu(S,_t),G.needsLights=qf(S),G.lightsStateVersion=Et,G.needsLights&&(Lt.ambientLightColor.value=V.state.ambient,Lt.lightProbe.value=V.state.probe,Lt.directionalLights.value=V.state.directional,Lt.directionalLightShadows.value=V.state.directionalShadow,Lt.spotLights.value=V.state.spot,Lt.spotLightShadows.value=V.state.spotShadow,Lt.rectAreaLights.value=V.state.rectArea,Lt.ltc_1.value=V.state.rectAreaLTC1,Lt.ltc_2.value=V.state.rectAreaLTC2,Lt.pointLights.value=V.state.point,Lt.pointLightShadows.value=V.state.pointShadow,Lt.hemisphereLights.value=V.state.hemi,Lt.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Lt.spotLightMatrix.value=V.state.spotLightMatrix,Lt.spotLightMap.value=V.state.spotLightMap,Lt.pointShadowMatrix.value=V.state.pointShadowMatrix),G.lightProbeGrid=T.state.lightProbeGridArray.length>0,G.currentProgram=Kt,G.uniformsList=null,Kt}function gu(S){if(S.uniformsList===null){let B=S.currentProgram.getUniforms();S.uniformsList=$s.seqWithValue(B.seq,S.uniforms)}return S.uniformsList}function xu(S,B){let Y=X.get(S);Y.outputColorSpace=B.outputColorSpace,Y.batching=B.batching,Y.batchingColor=B.batchingColor,Y.instancing=B.instancing,Y.instancingColor=B.instancingColor,Y.instancingMorph=B.instancingMorph,Y.skinning=B.skinning,Y.morphTargets=B.morphTargets,Y.morphNormals=B.morphNormals,Y.morphColors=B.morphColors,Y.morphTargetsCount=B.morphTargetsCount,Y.numClippingPlanes=B.numClippingPlanes,Y.numIntersection=B.numClipIntersection,Y.vertexAlphas=B.vertexAlphas,Y.vertexTangents=B.vertexTangents,Y.toneMapping=B.toneMapping}function Vf(S,B){if(S.length===0)return null;if(S.length===1)return S[0].texture!==null?S[0]:null;y.setFromMatrixPosition(B.matrixWorld);for(let Y=0,G=S.length;Y<G;Y++){let V=S[Y];if(V.texture!==null&&V.boundingBox.containsPoint(y))return V}return null}function Wf(S,B,Y,G,V){B.isScene!==!0&&(B=He),$.resetTextureUnits();let yt=B.fog,Et=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?B.environment:null,_t=Z===null?A.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:ie.workingColorSpace,Rt=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Pt=lt.get(G.envMap||Et,Rt),Zt=G.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,Kt=!!Y.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Lt=!!Y.morphAttributes.position,ve=!!Y.morphAttributes.normal,Ge=!!Y.morphAttributes.color,Oe=zn;G.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(Oe=A.toneMapping);let Ee=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,on=Ee!==void 0?Ee.length:0,Mt=X.get(G),bn=T.state.lights;if(ne===!0&&(Wt===!0||S!==rt)){let Ae=S===rt&&G.id===et;Dt.setState(G,S,Ae)}let le=!1;G.version===Mt.__version?(Mt.needsLights&&Mt.lightsStateVersion!==bn.state.version||Mt.outputColorSpace!==_t||V.isBatchedMesh&&Mt.batching===!1||!V.isBatchedMesh&&Mt.batching===!0||V.isBatchedMesh&&Mt.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&Mt.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&Mt.instancing===!1||!V.isInstancedMesh&&Mt.instancing===!0||V.isSkinnedMesh&&Mt.skinning===!1||!V.isSkinnedMesh&&Mt.skinning===!0||V.isInstancedMesh&&Mt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&Mt.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&Mt.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&Mt.instancingMorph===!1&&V.morphTexture!==null||Mt.envMap!==Pt||G.fog===!0&&Mt.fog!==yt||Mt.numClippingPlanes!==void 0&&(Mt.numClippingPlanes!==Dt.numPlanes||Mt.numIntersection!==Dt.numIntersection)||Mt.vertexAlphas!==Zt||Mt.vertexTangents!==Kt||Mt.morphTargets!==Lt||Mt.morphNormals!==ve||Mt.morphColors!==Ge||Mt.toneMapping!==Oe||Mt.morphTargetsCount!==on||!!Mt.lightProbeGrid!=T.state.lightProbeGridArray.length>0)&&(le=!0):(le=!0,Mt.__version=G.version);let Rn=Mt.currentProgram;le===!0&&(Rn=Ra(G,B,V),D&&G.isNodeMaterial&&D.onUpdateProgram(G,Rn,Mt));let Xn=!1,Mi=!1,vs=!1,Se=Rn.getUniforms(),Ve=Mt.uniforms;if(_.useProgram(Rn.program)&&(Xn=!0,Mi=!0,vs=!0),G.id!==et&&(et=G.id,Mi=!0),Mt.needsLights){let Ae=Vf(T.state.lightProbeGridArray,V);Mt.lightProbeGrid!==Ae&&(Mt.lightProbeGrid=Ae,Mi=!0)}if(Xn||rt!==S){_.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),Se.setValue(F,"projectionMatrix",S.projectionMatrix),Se.setValue(F,"viewMatrix",S.matrixWorldInverse);let Si=Se.map.cameraPosition;Si!==void 0&&Si.setValue(F,me.setFromMatrixPosition(S.matrixWorld)),C.logarithmicDepthBuffer&&Se.setValue(F,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Se.setValue(F,"isOrthographic",S.isOrthographicCamera===!0),rt!==S&&(rt=S,Mi=!0,vs=!0)}if(Mt.needsLights&&(bn.state.directionalShadowMap.length>0&&Se.setValue(F,"directionalShadowMap",bn.state.directionalShadowMap,$),bn.state.spotShadowMap.length>0&&Se.setValue(F,"spotShadowMap",bn.state.spotShadowMap,$),bn.state.pointShadowMap.length>0&&Se.setValue(F,"pointShadowMap",bn.state.pointShadowMap,$)),V.isSkinnedMesh){Se.setOptional(F,V,"bindMatrix"),Se.setOptional(F,V,"bindMatrixInverse");let Ae=V.skeleton;Ae&&(Ae.boneTexture===null&&Ae.computeBoneTexture(),Se.setValue(F,"boneTexture",Ae.boneTexture,$))}V.isBatchedMesh&&(Se.setOptional(F,V,"batchingTexture"),Se.setValue(F,"batchingTexture",V._matricesTexture,$),Se.setOptional(F,V,"batchingIdTexture"),Se.setValue(F,"batchingIdTexture",V._indirectTexture,$),Se.setOptional(F,V,"batchingColorTexture"),V._colorsTexture!==null&&Se.setValue(F,"batchingColorTexture",V._colorsTexture,$));let Ei=Y.morphAttributes;if((Ei.position!==void 0||Ei.normal!==void 0||Ei.color!==void 0)&&N.update(V,Y,Rn),(Mi||Mt.receiveShadow!==V.receiveShadow)&&(Mt.receiveShadow=V.receiveShadow,Se.setValue(F,"receiveShadow",V.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&B.environment!==null&&(Ve.envMapIntensity.value=B.environmentIntensity),Ve.dfgLUT!==void 0&&(Ve.dfgLUT.value=Lv()),Mi){if(Se.setValue(F,"toneMappingExposure",A.toneMappingExposure),Mt.needsLights&&Xf(Ve,vs),yt&&G.fog===!0&&It.refreshFogUniforms(Ve,yt),It.refreshMaterialUniforms(Ve,G,k,U,T.state.transmissionRenderTarget[S.id]),Mt.needsLights&&Mt.lightProbeGrid){let Ae=Mt.lightProbeGrid;Ve.probesSH.value=Ae.texture,Ve.probesMin.value.copy(Ae.boundingBox.min),Ve.probesMax.value.copy(Ae.boundingBox.max),Ve.probesResolution.value.copy(Ae.resolution)}$s.upload(F,gu(Mt),Ve,$)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&($s.upload(F,gu(Mt),Ve,$),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&Se.setValue(F,"center",V.center),Se.setValue(F,"modelViewMatrix",V.modelViewMatrix),Se.setValue(F,"normalMatrix",V.normalMatrix),Se.setValue(F,"modelMatrix",V.matrixWorld),G.uniformsGroups!==void 0){let Ae=G.uniformsGroups;for(let Si=0,_s=Ae.length;Si<_s;Si++){let vu=Ae[Si];nt.update(vu,Rn),nt.bind(vu,Rn)}}return Rn}function Xf(S,B){S.ambientLightColor.needsUpdate=B,S.lightProbe.needsUpdate=B,S.directionalLights.needsUpdate=B,S.directionalLightShadows.needsUpdate=B,S.pointLights.needsUpdate=B,S.pointLightShadows.needsUpdate=B,S.spotLights.needsUpdate=B,S.spotLightShadows.needsUpdate=B,S.rectAreaLights.needsUpdate=B,S.hemisphereLights.needsUpdate=B}function qf(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return W},this.getActiveMipmapLevel=function(){return q},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(S,B,Y){let G=X.get(S);G.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),X.get(S.texture).__webglTexture=B,X.get(S.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:Y,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,B){let Y=X.get(S);Y.__webglFramebuffer=B,Y.__useDefaultFramebuffer=B===void 0},this.setRenderTarget=function(S,B=0,Y=0){Z=S,W=B,q=Y;let G=null,V=!1,yt=!1;if(S){let _t=X.get(S);if(_t.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(F.FRAMEBUFFER,_t.__webglFramebuffer),it.copy(S.viewport),at.copy(S.scissor),Ht=S.scissorTest,_.viewport(it),_.scissor(at),_.setScissorTest(Ht),et=-1;return}else if(_t.__webglFramebuffer===void 0)$.setupRenderTarget(S);else if(_t.__hasExternalTextures)$.rebindTextures(S,X.get(S.texture).__webglTexture,X.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Zt=S.depthTexture;if(_t.__boundDepthTexture!==Zt){if(Zt!==null&&X.has(Zt)&&(S.width!==Zt.image.width||S.height!==Zt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");$.setupDepthRenderbuffer(S)}}let Rt=S.texture;(Rt.isData3DTexture||Rt.isDataArrayTexture||Rt.isCompressedArrayTexture)&&(yt=!0);let Pt=X.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(Pt[B])?G=Pt[B][Y]:G=Pt[B],V=!0):S.samples>0&&$.useMultisampledRTT(S)===!1?G=X.get(S).__webglMultisampledFramebuffer:Array.isArray(Pt)?G=Pt[Y]:G=Pt,it.copy(S.viewport),at.copy(S.scissor),Ht=S.scissorTest}else it.copy(ot).multiplyScalar(k).floor(),at.copy(Pe).multiplyScalar(k).floor(),Ht=qt;if(Y!==0&&(G=P),_.bindFramebuffer(F.FRAMEBUFFER,G)&&_.drawBuffers(S,G),_.viewport(it),_.scissor(at),_.setScissorTest(Ht),V){let _t=X.get(S.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_CUBE_MAP_POSITIVE_X+B,_t.__webglTexture,Y)}else if(yt){let _t=B;for(let Rt=0;Rt<S.textures.length;Rt++){let Pt=X.get(S.textures[Rt]);F.framebufferTextureLayer(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0+Rt,Pt.__webglTexture,Y,_t)}}else if(S!==null&&Y!==0){let _t=X.get(S.texture);F.framebufferTexture2D(F.FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,_t.__webglTexture,Y)}et=-1},this.readRenderTargetPixels=function(S,B,Y,G,V,yt,Et,_t=0){if(!(S&&S.isWebGLRenderTarget)){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Rt=X.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Et!==void 0&&(Rt=Rt[Et]),Rt){_.bindFramebuffer(F.FRAMEBUFFER,Rt);try{let Pt=S.textures[_t],Zt=Pt.format,Kt=Pt.type;if(S.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+_t),!C.textureFormatReadable(Zt)){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!C.textureTypeReadable(Kt)){Bt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}B>=0&&B<=S.width-G&&Y>=0&&Y<=S.height-V&&F.readPixels(B,Y,G,V,mt.convert(Zt),mt.convert(Kt),yt)}finally{let Pt=Z!==null?X.get(Z).__webglFramebuffer:null;_.bindFramebuffer(F.FRAMEBUFFER,Pt)}}},this.readRenderTargetPixelsAsync=async function(S,B,Y,G,V,yt,Et,_t=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Rt=X.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Et!==void 0&&(Rt=Rt[Et]),Rt)if(B>=0&&B<=S.width-G&&Y>=0&&Y<=S.height-V){_.bindFramebuffer(F.FRAMEBUFFER,Rt);let Pt=S.textures[_t],Zt=Pt.format,Kt=Pt.type;if(S.textures.length>1&&F.readBuffer(F.COLOR_ATTACHMENT0+_t),!C.textureFormatReadable(Zt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!C.textureTypeReadable(Kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Lt=F.createBuffer();F.bindBuffer(F.PIXEL_PACK_BUFFER,Lt),F.bufferData(F.PIXEL_PACK_BUFFER,yt.byteLength,F.STREAM_READ),F.readPixels(B,Y,G,V,mt.convert(Zt),mt.convert(Kt),0);let ve=Z!==null?X.get(Z).__webglFramebuffer:null;_.bindFramebuffer(F.FRAMEBUFFER,ve);let Ge=F.fenceSync(F.SYNC_GPU_COMMANDS_COMPLETE,0);return F.flush(),await Rd(F,Ge,4),F.bindBuffer(F.PIXEL_PACK_BUFFER,Lt),F.getBufferSubData(F.PIXEL_PACK_BUFFER,0,yt),F.deleteBuffer(Lt),F.deleteSync(Ge),yt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,B=null,Y=0){let G=Math.pow(2,-Y),V=Math.floor(S.image.width*G),yt=Math.floor(S.image.height*G),Et=B!==null?B.x:0,_t=B!==null?B.y:0;$.setTexture2D(S,0),F.copyTexSubImage2D(F.TEXTURE_2D,Y,0,0,Et,_t,V,yt),_.unbindTexture()},this.copyTextureToTexture=function(S,B,Y=null,G=null,V=0,yt=0){let Et,_t,Rt,Pt,Zt,Kt,Lt,ve,Ge,Oe=S.isCompressedTexture?S.mipmaps[yt]:S.image;if(Y!==null)Et=Y.max.x-Y.min.x,_t=Y.max.y-Y.min.y,Rt=Y.isBox3?Y.max.z-Y.min.z:1,Pt=Y.min.x,Zt=Y.min.y,Kt=Y.isBox3?Y.min.z:0;else{let Ve=Math.pow(2,-V);Et=Math.floor(Oe.width*Ve),_t=Math.floor(Oe.height*Ve),S.isDataArrayTexture?Rt=Oe.depth:S.isData3DTexture?Rt=Math.floor(Oe.depth*Ve):Rt=1,Pt=0,Zt=0,Kt=0}G!==null?(Lt=G.x,ve=G.y,Ge=G.z):(Lt=0,ve=0,Ge=0);let Ee=mt.convert(B.format),on=mt.convert(B.type),Mt;B.isData3DTexture?($.setTexture3D(B,0),Mt=F.TEXTURE_3D):B.isDataArrayTexture||B.isCompressedArrayTexture?($.setTexture2DArray(B,0),Mt=F.TEXTURE_2D_ARRAY):($.setTexture2D(B,0),Mt=F.TEXTURE_2D),_.activeTexture(F.TEXTURE0),_.pixelStorei(F.UNPACK_FLIP_Y_WEBGL,B.flipY),_.pixelStorei(F.UNPACK_PREMULTIPLY_ALPHA_WEBGL,B.premultiplyAlpha),_.pixelStorei(F.UNPACK_ALIGNMENT,B.unpackAlignment);let bn=_.getParameter(F.UNPACK_ROW_LENGTH),le=_.getParameter(F.UNPACK_IMAGE_HEIGHT),Rn=_.getParameter(F.UNPACK_SKIP_PIXELS),Xn=_.getParameter(F.UNPACK_SKIP_ROWS),Mi=_.getParameter(F.UNPACK_SKIP_IMAGES);_.pixelStorei(F.UNPACK_ROW_LENGTH,Oe.width),_.pixelStorei(F.UNPACK_IMAGE_HEIGHT,Oe.height),_.pixelStorei(F.UNPACK_SKIP_PIXELS,Pt),_.pixelStorei(F.UNPACK_SKIP_ROWS,Zt),_.pixelStorei(F.UNPACK_SKIP_IMAGES,Kt);let vs=S.isDataArrayTexture||S.isData3DTexture,Se=B.isDataArrayTexture||B.isData3DTexture;if(S.isDepthTexture){let Ve=X.get(S),Ei=X.get(B),Ae=X.get(Ve.__renderTarget),Si=X.get(Ei.__renderTarget);_.bindFramebuffer(F.READ_FRAMEBUFFER,Ae.__webglFramebuffer),_.bindFramebuffer(F.DRAW_FRAMEBUFFER,Si.__webglFramebuffer);for(let _s=0;_s<Rt;_s++)vs&&(F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,X.get(S).__webglTexture,V,Kt+_s),F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,X.get(B).__webglTexture,yt,Ge+_s)),F.blitFramebuffer(Pt,Zt,Et,_t,Lt,ve,Et,_t,F.DEPTH_BUFFER_BIT,F.NEAREST);_.bindFramebuffer(F.READ_FRAMEBUFFER,null),_.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else if(V!==0||S.isRenderTargetTexture||X.has(S)){let Ve=X.get(S),Ei=X.get(B);_.bindFramebuffer(F.READ_FRAMEBUFFER,H),_.bindFramebuffer(F.DRAW_FRAMEBUFFER,z);for(let Ae=0;Ae<Rt;Ae++)vs?F.framebufferTextureLayer(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Ve.__webglTexture,V,Kt+Ae):F.framebufferTexture2D(F.READ_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,Ve.__webglTexture,V),Se?F.framebufferTextureLayer(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,Ei.__webglTexture,yt,Ge+Ae):F.framebufferTexture2D(F.DRAW_FRAMEBUFFER,F.COLOR_ATTACHMENT0,F.TEXTURE_2D,Ei.__webglTexture,yt),V!==0?F.blitFramebuffer(Pt,Zt,Et,_t,Lt,ve,Et,_t,F.COLOR_BUFFER_BIT,F.NEAREST):Se?F.copyTexSubImage3D(Mt,yt,Lt,ve,Ge+Ae,Pt,Zt,Et,_t):F.copyTexSubImage2D(Mt,yt,Lt,ve,Pt,Zt,Et,_t);_.bindFramebuffer(F.READ_FRAMEBUFFER,null),_.bindFramebuffer(F.DRAW_FRAMEBUFFER,null)}else Se?S.isDataTexture||S.isData3DTexture?F.texSubImage3D(Mt,yt,Lt,ve,Ge,Et,_t,Rt,Ee,on,Oe.data):B.isCompressedArrayTexture?F.compressedTexSubImage3D(Mt,yt,Lt,ve,Ge,Et,_t,Rt,Ee,Oe.data):F.texSubImage3D(Mt,yt,Lt,ve,Ge,Et,_t,Rt,Ee,on,Oe):S.isDataTexture?F.texSubImage2D(F.TEXTURE_2D,yt,Lt,ve,Et,_t,Ee,on,Oe.data):S.isCompressedTexture?F.compressedTexSubImage2D(F.TEXTURE_2D,yt,Lt,ve,Oe.width,Oe.height,Ee,Oe.data):F.texSubImage2D(F.TEXTURE_2D,yt,Lt,ve,Et,_t,Ee,on,Oe);_.pixelStorei(F.UNPACK_ROW_LENGTH,bn),_.pixelStorei(F.UNPACK_IMAGE_HEIGHT,le),_.pixelStorei(F.UNPACK_SKIP_PIXELS,Rn),_.pixelStorei(F.UNPACK_SKIP_ROWS,Xn),_.pixelStorei(F.UNPACK_SKIP_IMAGES,Mi),yt===0&&B.generateMipmaps&&F.generateMipmap(Mt),_.unbindTexture()},this.initRenderTarget=function(S){X.get(S).__webglFramebuffer===void 0&&$.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?$.setTextureCube(S,0):S.isData3DTexture?$.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?$.setTexture2DArray(S,0):$.setTexture2D(S,0),_.unbindTexture()},this.resetState=function(){W=0,q=0,Z=null,_.reset(),bt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return On}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=ie._getDrawingBufferColorSpace(t),e.unpackColorSpace=ie._getUnpackColorSpace()}};function Fl(i,t=!1){let e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,c=new ye,l=0;for(let h=0;h<i.length;++h){let f=i[h],u=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let m in f.attributes){if(!n.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+m+'" attribute exists among all geometries, or in none of them.'),null;r[m]===void 0&&(r[m]=[]),r[m].push(f.attributes[m]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let m in f.morphAttributes){if(!s.has(m))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[m]===void 0&&(a[m]=[]),a[m].push(f.morphAttributes[m])}if(t){let m;if(e)m=f.index.count;else if(f.attributes.position!==void 0)m=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,m,h),l+=m}}if(e){let h=0,f=[];for(let u=0;u<i.length;++u){let m=i[u].index;for(let g=0;g<m.count;++g)f.push(m.getX(g)+h);h+=i[u].attributes.position.count}c.setIndex(f)}for(let h in r){let f=hf(r[h]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;c.setAttribute(h,f)}for(let h in a){let f=a[h][0].length;if(f!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[h]=[];for(let u=0;u<f;++u){let m=[];for(let v=0;v<a[h].length;++v)m.push(a[h][v][u]);let g=hf(m);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;c.morphAttributes[h].push(g)}}}return c}function hf(i){let t,e,n,s=-1,r=0;for(let l=0;l<i.length;++l){let h=i[l];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}let a=new t(r),o=new We(a,e,n),c=0;for(let l=0;l<i.length;++l){let h=i[l];if(h.isInterleavedBufferAttribute){let f=c/e;for(let u=0,m=h.count;u<m;u++)for(let g=0;g<e;g++){let v=h.getComponent(u,g);o.setComponent(u+f,g,v)}}else a.set(h.array,c);c+=h.count*e}return s!==void 0&&(o.gpuType=s),o}var St=80,fe=9,Ce=10,be=Ce+1,ha=4,pn=4;function Dv(i){let t=i>>>0;return()=>(t=t*1664525+1013904223>>>0,t/4294967296)}var _n=(i,t)=>i+t*be,mn=i=>({x:i%be*St,z:Math.floor(i/be)*St}),Tn=(i,t)=>i<t?i+":"+t:t+":"+i;function ua(i,t){return{x0:i*St+fe,z0:t*St+fe,x1:(i+1)*St-fe,z1:(t+1)*St-fe}}var Nv=[{id:"grocery",bi:3,bj:1,side:"E",kind:"curb",name:"FRESHLOOP GROCERY",color:"#3fbf6a"},{id:"electronics",bi:4,bj:3,side:"S",kind:"curb",name:"VOLTAGE ELECTRONICS",color:"#3f8cff"},{id:"clothing",bi:5,bj:6,side:"W",kind:"alley",name:"THREADLINE CLOTHING",color:"#d64fd0"},{id:"restaurant",bi:4,bj:5,side:"N",kind:"curb",name:"BYTE'S DINER",color:"#ff7a3a"},{id:"furniture",bi:9,bj:0,side:"N",kind:"curb",name:"NESTWELL FURNITURE",color:"#c9a35a"},{id:"pharmacy",bi:2,bj:6,side:"E",kind:"curb",name:"PIXELCARE PHARMACY",color:"#4fd6c8"},{id:"convenience",bi:3,bj:7,side:"S",kind:"alley",name:"QUIKLOG 24/7",color:"#ffd23f"},{id:"hardware",bi:8,bj:6,side:"W",kind:"curb",name:"BLOCKSMITH HARDWARE",color:"#e8553f"},{id:"department",bi:2,bj:2,side:"N",kind:"dock",name:"GRANDVIEW DEPARTMENT STORE",color:"#a77bff"},{id:"supermarket",bi:8,bj:8,side:"S",kind:"curb",name:"MEGAMART SUPERMARKET",color:"#ff4f6d"}],Uv=[{bi:2,bj:4,side:"S"},{bi:7,bj:2,side:"W"},{bi:5,bj:8,side:"E"},{bi:8,bj:5,side:"N"}],Fh=[{bi:0,bj:2},{bi:9,bj:6},{bi:6,bj:9}],uf=[{bi:5,bj:4},{bi:1,bj:7},{bi:7,bj:4}],Bh=[{t:"METASHIFT",s:"Your income stream.",bg:"#0b1d3a",fg:"#5ff2ff"},{t:"VIRTUAL WORK.",s:"Real income.",bg:"#1b0f33",fg:"#ff7ad9"},{t:"TURN PLAYTIME",s:"into payday.",bg:"#062d26",fg:"#6dffb6"},{t:"YOUR NEXT OPPORTUNITY",s:"is one login away.",bg:"#2d1405",fg:"#ffb347"},{t:"WHY JUST PLAY",s:"when you can earn?",bg:"#08243d",fg:"#ffe066"},{t:"ANOTHER DAY.",s:"Another opportunity.",bg:"#26093a",fg:"#c7a6ff"},{t:"SKYLINE LOFTS",s:"Virtual penthouses from 89,000 CR",bg:"#f2efe9",fg:"#1d2a44"},{t:"NOW HIRING",s:"Drivers \xB7 Cashiers \xB7 Greeters",bg:"#ffd23f",fg:"#1a1a1a"},{t:"OWN YOUR DREAM HOME",s:"Lakeside plots \u2014 limited release",bg:"#e7f6ff",fg:"#0d4a7a"},{t:"SHIFT SCORE 98%?",s:"Unlock Priority Routes",bg:"#101010",fg:"#5ff2ff"},{t:"LOG IN. CLOCK IN.",s:"MetaShift Workforce",bg:"#0b1d3a",fg:"#ffffff"},{t:"NEW: HEADSET X",s:"Play games inside your game",bg:"#151515",fg:"#ff4f6d"}],Bl=class{solids=[];solidGrid=[];poles=[];poleGrid=[];lots=[];stores={};fuel=[];dcStarts=[];adj=[];blocked=new Set;group=new ee;nightU={value:0};lampMesh;lampInfo=[];lastLampKey="";hasLight=new Set;walkPaths=[];plazaCenters=[];buildingTops=[];constructor(){for(let t=0;t<169;t++)this.solidGrid.push([]),this.poleGrid.push([]);for(let t=0;t<be*be;t++){let e=t%be,n=Math.floor(t/be),s=[];e>0&&s.push(_n(e-1,n)),e<Ce&&s.push(_n(e+1,n)),n>0&&s.push(_n(e,n-1)),n<Ce&&s.push(_n(e,n+1)),this.adj.push(s)}this.makeLots(),this.build()}cell(t,e){let n=Math.max(0,Math.min(12,Math.floor((t+St)/St))),s=Math.max(0,Math.min(12,Math.floor((e+St)/St)));return n+s*13}addSolid(t){let e=this.solids.length;this.solids.push(t);let n=Math.max(0,Math.floor((t.x0+St)/St)),s=Math.min(12,Math.floor((t.x1+St)/St)),r=Math.max(0,Math.floor((t.z0+St)/St)),a=Math.min(12,Math.floor((t.z1+St)/St));for(let o=n;o<=s;o++)for(let c=r;c<=a;c++)this.solidGrid[o+c*13].push(e);return e}removeSolids(t){this.solids.length=t;for(let e of this.solidGrid)for(let n=e.length-1;n>=0;n--)e[n]>=t&&e.splice(n,1)}lotFor(t,e,n,s){let r=ua(t,e),a=(r.x0+r.x1)/2,o=(r.z0+r.z1)/2,c=s==="curb"||s==="fuel"?30:32,l=s==="curb"?7:s==="fuel"?9:0,h=s==="alley"?9:s==="dock"?13:0,f,u,m,g,v,p=s==="curb"||s==="fuel";if(n==="S"||n==="N"){let d=n==="S"?r.z0:r.z1,b=n==="S"?1:-1;u={x:0,z:b},p?(f={x0:a-c/2,x1:a+c/2,z0:Math.min(d,d+b*l),z1:Math.max(d,d+b*l)},m={x:1,z:0}):(f={x0:a-h/2,x1:a+h/2,z0:Math.min(d,d+b*c),z1:Math.max(d,d+b*c)},m={x:0,z:1}),g={x:a,z:d};let M=n==="S"?e:e+1;v=[_n(t,M),_n(t+1,M)]}else{let d=n==="W"?r.x0:r.x1,b=n==="W"?1:-1;u={x:b,z:0},p?(f={z0:o-c/2,z1:o+c/2,x0:Math.min(d,d+b*l),x1:Math.max(d,d+b*l)},m={x:0,z:1}):(f={z0:o-h/2,z1:o+h/2,x0:Math.min(d,d+b*c),x1:Math.max(d,d+b*c)},m={x:1,z:0}),g={x:d,z:o};let M=n==="W"?t:t+1;v=[_n(M,e),_n(M,e+1)]}return{kind:s,bi:t,bj:e,side:n,rect:f,inward:u,along:m,entry:g,edge:v}}makeLots(){for(let t of Nv){let e={id:t.id,name:t.name,color:t.color,...this.lotFor(t.bi,t.bj,t.side,t.kind)};this.lots.push(e),this.stores[t.id]=e}Uv.forEach((t,e)=>{let n={id:"fuel"+e,name:"GRIDFUEL",color:"#ffcc00",...this.lotFor(t.bi,t.bj,t.side,"fuel")};this.lots.push(n),this.fuel.push(n)});for(let t of Fh)this.dcStarts.push({x:(t.bi+1)*St-pn,z:t.bj*St+32,h:Math.PI/2})}lightState(t,e,n){let s=t%be,r=Math.floor(t/be),a=(n+(s*5+r*3)%22)%22;return e===0?a<9?0:a<11?1:2:a<11?2:a<20?0:1}build(){let t=Dv(7),e=this.group,n=new Set(uf.map(U=>U.bi+","+U.bj)),s=new Set(Fh.map(U=>U.bi+","+U.bj)),r=new st(new ce(3e3,3e3),new Qt({color:3951167}));r.rotation.x=-Math.PI/2,r.position.set(400,-.05,400),e.add(r);let a=new st(new ce(Ce*St+2*fe+8,Ce*St+2*fe+8),new Qt({color:2829876}));a.rotation.x=-Math.PI/2,a.position.set(Ce*St/2,0,Ce*St/2),e.add(a);let o=new gt(1,1,1);o.translate(0,.5,0);let c=new ke(o,new Qt({color:9277591}),Ce*Ce),l=new oe,h=new Ye,f=new L,u=new L,m=0;for(let U=0;U<Ce;U++)for(let k=0;k<Ce;k++){let tt=ua(U,k);l.compose(f.set((tt.x0+tt.x1)/2,0,(tt.z0+tt.z1)/2),h.identity(),u.set(tt.x1-tt.x0,.15,tt.z1-tt.z0)),c.setMatrixAt(m++,l),this.walkPaths.push({x0:tt.x0+1.8,z0:tt.z0+1.8,x1:tt.x1-1.8,z1:tt.z1-1.8})}e.add(c);let g=new Qt({color:16777215}),v=this.nightU;g.onBeforeCompile=U=>{U.uniforms.uNight=v,U.vertexShader=`varying vec3 vWP; varying vec3 vWN;
`+U.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
        vec4 wp4 = modelMatrix * instanceMatrix * vec4(transformed,1.0); vWP = wp4.xyz;
        vWN = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);`),U.fragmentShader=`varying vec3 vWP; varying vec3 vWN; uniform float uNight;
`+U.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
          float wall = 1.0 - step(0.9, abs(vWN.y));
          vec2 gg = vec2((abs(vWN.x) > 0.5 ? vWP.z : vWP.x) / 3.2, vWP.y / 3.6);
          vec2 ff = fract(gg);
          float win = wall * step(0.2, ff.x) * step(ff.x, 0.8) * step(0.28, ff.y) * step(ff.y, 0.82) * step(3.6, vWP.y);
          float rnd = fract(sin(dot(floor(gg), vec2(12.9898,78.233))) * 43758.5453);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.20,0.27,0.36) + 0.08*rnd, win*0.9);
          diffuseColor.rgb *= mix(1.0, 0.55, step(0.9, vWN.y));`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
          totalEmissiveRadiance += win * step(0.5, rnd) * uNight * vec3(1.0,0.82,0.5) * 0.85;`)};let p=[],d=[8226708,10134445,7305866,11773327,9142131,6253434,10859458,9412526,12761251],b=new Map;for(let U of this.lots){let k=U.bi+","+U.bj;b.has(k)||b.set(k,[]),b.get(k).push(U)}for(let U=0;U<Ce;U++)for(let k=0;k<Ce;k++){let tt=U+","+k,ct=ua(U,k),ot={x0:ct.x0+ha,z0:ct.z0+ha,x1:ct.x1-ha,z1:ct.z1-ha};if(n.has(tt)){this.plazaCenters.push({x:(ct.x0+ct.x1)/2,z:(ct.z0+ct.z1)/2});continue}let Pe=1-Math.hypot(U-4.5,k-4.5)/7;if(s.has(tt)){p.push({r:{x0:ot.x0+4,z0:ot.z0,x1:ot.x1,z1:ot.z1},h:11,c:new wt(14212579)});continue}let qt=[ot],ae=b.get(tt)||[];for(let zt of ae){let me={x0:zt.rect.x0-1,z0:zt.rect.z0-1,x1:zt.rect.x1+1,z1:zt.rect.z1+1};qt=qt.flatMap(Ue=>Fv(Ue,me))}let ne=[],Wt=(zt,me)=>{let Ue=zt.x1-zt.x0,He=zt.z1-zt.z0;if(me>0&&Math.max(Ue,He)>26&&t()<.85){let Le=.35+t()*.3;if(Ue>He){let we=zt.x0+Ue*Le;Wt({...zt,x1:we-.5},me-1),Wt({...zt,x0:we+.5},me-1)}else{let we=zt.z0+He*Le;Wt({...zt,z1:we-.5},me-1),Wt({...zt,z0:we+.5},me-1)}}else ne.push(zt)};qt.filter(zt=>zt.x1-zt.x0>2&&zt.z1-zt.z0>2).forEach(zt=>Wt(zt,ae.length?1:2));for(let zt of ne){let me=ae.length?9+t()*8:10+t()*(18+55*Math.max(0,Pe));p.push({r:zt,h:me,c:new wt(d[Math.floor(t()*d.length)])})}}let M=new ke(o,g,p.length);p.forEach((U,k)=>{l.compose(f.set((U.r.x0+U.r.x1)/2,0,(U.r.z0+U.r.z1)/2),h.identity(),u.set(U.r.x1-U.r.x0,U.h,U.r.z1-U.r.z0)),M.setMatrixAt(k,l),M.setColorAt(k,U.c),this.addSolid(U.r),this.buildingTops.push({x:(U.r.x0+U.r.x1)/2,z:(U.r.z0+U.r.z1)/2,h:U.h})}),e.add(M);let y=new ke(o,new Qt({color:7042694}),90);for(let U=0;U<90;U++){let k=U/90*Math.PI*2,tt=820+t()*200;l.compose(f.set(400+Math.cos(k)*tt,0,400+Math.sin(k)*tt),h.setFromAxisAngle(new L(0,1,0),k),u.set(40+t()*40,30+t()*120,40+t()*40)),y.setMatrixAt(U,l)}e.add(y);let w=Ce*St;this.addSolid({x0:-60,z0:-60,x1:w+60,z1:-fe-2}),this.addSolid({x0:-60,z0:w+fe+2,x1:w+60,z1:w+60}),this.addSolid({x0:-60,z0:-60,x1:-fe-2,z1:w+60}),this.addSolid({x0:w+fe+2,z0:-60,x1:w+60,z1:w+60});let T=Ov(),R=new re({map:T,transparent:!0,opacity:.55,side:Ze,depthWrite:!1,fog:!0}),x=w+2*fe+4;for(let U=0;U<4;U++){let k=new ce(x,8),tt=new st(k,R);T.repeat.set(x/8,1);let ct=-fe-2,ot=w+fe+2;U===0&&tt.position.set(w/2,4,ct),U===1&&tt.position.set(w/2,4,ot),U===2&&(tt.position.set(ct,4,w/2),tt.rotation.y=Math.PI/2),U===3&&(tt.position.set(ot,4,w/2),tt.rotation.y=Math.PI/2),e.add(tt)}let E=[],A=(U,k,tt,ct)=>E.push(U,k,tt,ct),I=[];for(let U=0;U<be;U++)for(let k=0;k<be;k++){let tt=mn(_n(U,k));if(U<Ce)for(let ot=fe+4;ot<St-fe-4;ot+=6)A(tt.x+ot,tt.z-.12,tt.x+ot+3,tt.z+.12);if(k<Ce)for(let ot=fe+4;ot<St-fe-4;ot+=6)A(tt.x-.12,tt.z+ot,tt.x+.12,tt.z+ot+3);let ct=fe+1.5;U>0&&I.push(tt.x-ct-.4,tt.z+.3,tt.x-ct,tt.z+fe),U<Ce&&I.push(tt.x+ct,tt.z-fe,tt.x+ct+.4,tt.z-.3),k>0&&I.push(tt.x-fe,tt.z-ct-.4,tt.x-.3,tt.z-ct),k<Ce&&I.push(tt.x+.3,tt.z+ct,tt.x+fe,tt.z+ct+.4)}e.add(df(E,.02,15254855)),e.add(df(I,.02,15263976));let D=new Ne(.18,.22,6.4,6);D.translate(0,3.2,0);let P=new gt(.16,.16,1);P.translate(0,0,.5);let H=new gt(.5,1.5,.45),z=new sn(.17,8,6),W=[];for(let U=0;U<be;U++)for(let k=0;k<be;k++){let tt=_n(U,k),ct=mn(tt),ot=fe+1.4;U>0&&k<Ce&&W.push({node:tt,axis:0,cx:ct.x+ot,cz:ct.z+ot,dx:1,dz:0}),U<Ce&&k>0&&W.push({node:tt,axis:0,cx:ct.x-ot,cz:ct.z-ot,dx:-1,dz:0}),k>0&&U>0&&W.push({node:tt,axis:1,cx:ct.x-ot,cz:ct.z+ot,dx:0,dz:1}),k<Ce&&U<Ce&&W.push({node:tt,axis:1,cx:ct.x+ot,cz:ct.z-ot,dx:0,dz:-1})}let q=new Qt({color:2764081}),Z=new ke(D,q,W.length),et=new ke(P,q,W.length),rt=new ke(H,new Qt({color:1776928}),W.length);this.lampMesh=new ke(z,new re({color:16777215}),W.length*3);let it=new L(0,1,0);W.forEach((U,k)=>{l.compose(f.set(U.cx,0,U.cz),h.identity(),u.set(1,1,1)),Z.setMatrixAt(k,l),this.hasLight.add(U.node+","+U.dx+","+U.dz),this.poles.push({x:U.cx,z:U.cz});let tt=U.dz,ct=-U.dx,ot=fe+1.4-pn+.6,Pe=Math.atan2(tt,ct);l.compose(f.set(U.cx,6.2,U.cz),h.setFromAxisAngle(it,Pe),u.set(1,1,ot)),et.setMatrixAt(k,l);let qt=U.cx+tt*ot,ae=U.cz+ct*ot,ne=Math.atan2(-U.dx,-U.dz);l.compose(f.set(qt,5.3,ae),h.setFromAxisAngle(it,ne),u.set(1,1,1)),rt.setMatrixAt(k,l);for(let Wt=0;Wt<3;Wt++)l.compose(f.set(qt-U.dx*.25,5.8-Wt*.48,ae-U.dz*.25),h.identity(),u.set(1,1,1)),this.lampMesh.setMatrixAt(k*3+Wt,l),this.lampInfo.push({node:U.node,axis:U.axis,color:Wt})});for(let U=0;U<this.poles.length;U++){let k=this.poles[U];this.poleGrid[this.cell(k.x,k.z)].push(U)}e.add(Z,et,rt,this.lampMesh),this.updateLights(0);let at=new Ne(.2,.3,3,5);at.translate(0,1.5,0);let Ht=new Xr(2.2,0);Ht.translate(0,4.4,0);let Gt=[];for(let U of uf){let k=ua(U.bi,U.bj);for(let ot=0;ot<14;ot++)Gt.push({x:k.x0+4+t()*(k.x1-k.x0-8),z:k.z0+4+t()*(k.z1-k.z0-8)});let tt=new st(new ce(k.x1-k.x0-4,k.z1-k.z0-4),new Qt({color:5214026}));tt.rotation.x=-Math.PI/2,tt.position.set((k.x0+k.x1)/2,.17,(k.z0+k.z1)/2),e.add(tt);let ct=new st(new Ne(7,7,.5,20),new Qt({color:9067775,emissive:2756704}));ct.position.set((k.x0+k.x1)/2,.3,(k.z0+k.z1)/2),e.add(ct)}let Vt=new ke(at,new Qt({color:5914672}),Gt.length),K=new ke(Ht,new Qt({color:4165455}),Gt.length);Gt.forEach((U,k)=>{l.compose(f.set(U.x,.15,U.z),h.identity(),u.setScalar(.8+t()*.5)),Vt.setMatrixAt(k,l),K.setMatrixAt(k,l),K.setColorAt(k,new wt().setHSL(.28+t()*.12,.5,.35+t()*.1))}),e.add(Vt,K),this.buildLots(t),this.buildBillboards(t)}buildLots(t){let e=this.group,n=document.createElement("canvas");n.width=1024,n.height=1024;let s=n.getContext("2d"),r=[],a=[],o=(m,g,v,p)=>{let d=m%2*512,b=Math.floor(m/2)*128;s.fillStyle="#14161c",s.fillRect(d,b,512,128),s.fillStyle=v,s.fillRect(d,b+112,512,16),s.fillStyle=v,s.font="bold 44px Arial",s.textAlign="center",s.textBaseline="middle";let M=44;for(;s.measureText(g).width>480&&M>18;)M-=2,s.font=`bold ${M}px Arial`;s.fillText(g,d+256,b+48),s.fillStyle="#cfd6e0",s.font="22px Arial",s.fillText(p,d+256,b+92),r.push({tex:m})},c=(m,g,v,p,d,b)=>{let M=new ce(b,b/4),y=M.attributes.uv,w=m%2*.5,T=1-(Math.floor(m/2)+1)/8;for(let R=0;R<y.count;R++)y.setXY(R,w+y.getX(R)*.5,T+y.getY(R)/8);M.rotateY(d),M.translate(g,p,v),a.push(M)},l=0,h=new Qt({color:3422013});for(let m of this.lots){let g=m.rect,v=new st(new ce(g.x1-g.x0,g.z1-g.z0),h);v.rotation.x=-Math.PI/2,v.position.set((g.x0+g.x1)/2,.17,(g.z0+g.z1)/2),e.add(v);let p=m.kind==="fuel",d=m.kind==="curb"||p?(p?9:7)+1.05:33.05,b=Math.atan2(-m.inward.x,-m.inward.z),M=m.entry.x+m.inward.x*d,y=m.entry.z+m.inward.z*d;if(o(l,m.name,m.color,p?"FUEL \xB7 24H \xB7 CR ACCEPTED":m.kind==="dock"?"RECEIVING DOCK \u2014 BACK IN":"DELIVERIES \xB7 RECEIVING"),c(l,M,y,p?4.5:6.5,b,12),l++,p){let w=new st(new gt(g.x1-g.x0+2,.6,g.z1-g.z0+2),new Qt({color:15856113,emissive:2236962}));w.position.set((g.x0+g.x1)/2,6.6,(g.z0+g.z1)/2),e.add(w);let T=new st(new gt(g.x1-g.x0+2.1,.25,g.z1-g.z0+2.1),new re({color:16763904}));T.position.copy(w.position),e.add(T);for(let R=-1;R<=1;R+=2){let x=new st(new gt(1,1.8,.7),new Qt({color:13777466})),E=m.along.x*R*8,A=m.along.z*R*8;x.position.set(m.entry.x+m.inward.x*8.2+E,.9,m.entry.z+m.inward.z*8.2+A),e.add(x);let I=new st(new gt(.3,6.4,.3),new Qt({color:14540253}));I.position.set(m.entry.x+m.inward.x*8.6+E,3.3,m.entry.z+m.inward.z*8.6+A),e.add(I)}}}for(let m of Fh){let g=ua(m.bi,m.bj);o(l,"METASHIFT DISTRIBUTION","#5ff2ff","DC-"+(m.bi+1)+(m.bj+1)+" \xB7 OUTBOUND FREIGHT"),c(l,g.x1-ha+.06,(g.z0+g.z1)/2,8,Math.PI/2,16),l++}let f=new Xe(n);f.colorSpace=Re,f.anisotropy=4;let u=new st(Fl(a),new re({map:f,side:Ze}));e.add(u)}buildBillboards(t){let e=document.createElement("canvas");e.width=2048,e.height=1024;let n=e.getContext("2d");Bh.forEach((l,h)=>{let f=h%4*512,u=Math.floor(h/4)*256,m=n.createLinearGradient(f,u,f+512,u+256);m.addColorStop(0,l.bg),m.addColorStop(1,Bv(l.bg)),n.fillStyle=m,n.fillRect(f,u,512,256),n.strokeStyle=l.fg,n.lineWidth=6,n.strokeRect(f+10,u+10,492,236),n.fillStyle=l.fg,n.textAlign="center",n.textBaseline="middle";let g=56;for(n.font=`900 ${g}px Arial`;n.measureText(l.t).width>460;)g-=2,n.font=`900 ${g}px Arial`;n.fillText(l.t,f+256,u+100),n.font="30px Arial";let v=30;for(;n.measureText(l.s).width>460;)v-=2,n.font=`${v}px Arial`;n.fillText(l.s,f+256,u+165),n.font="bold 16px Arial",n.globalAlpha=.7,n.fillText("\u25C6 METASHIFT",f+256,u+222),n.globalAlpha=1});let s=new Xe(e);s.colorSpace=Re,s.anisotropy=4;let r=[],a=[],o=this.buildingTops.filter(l=>l.h>14),c=Math.min(46,o.length);for(let l=0;l<c;l++){let h=o[Math.floor(t()*o.length)],f=h.x/St-Math.floor(h.x/St),u=h.z/St-Math.floor(h.z/St),m=f<.5?-1:1,g=u<.5?-1:1,v=Math.abs(f-.5)>Math.abs(u-.5),p=v?m>0?Math.PI/2:-Math.PI/2:g>0?0:Math.PI,d=Math.floor(t()*Bh.length),b=14+t()*6,M=new ce(b,b/2),y=M.attributes.uv,w=d%4/4,T=1-(Math.floor(d/4)+1)/4;for(let x=0;x<y.count;x++)y.setXY(x,w+y.getX(x)/4,T+y.getY(x)/4);M.rotateY(p),M.translate(h.x+(v?m:0)*2,h.h+b/4+1.5,h.z+(v?0:g)*2),r.push(M);let R=new gt(b+.6,b/2+.6,.4);R.translate(0,0,-.25),R.rotateY(p),R.translate(h.x+(v?m:0)*2,h.h+b/4+1.5,h.z+(v?0:g)*2),a.push(R)}for(let l of this.plazaCenters)for(let h=0;h<4;h++){let f=(h*3+Math.floor(l.x))%Bh.length,u=9,m=new ce(u,u/2),g=m.attributes.uv,v=f%4/4,p=1-(Math.floor(f/4)+1)/4;for(let y=0;y<g.count;y++)g.setXY(y,v+g.getX(y)/4,p+g.getY(y)/4);let d=h*Math.PI/2;m.translate(0,0,.26),m.rotateY(d),m.translate(l.x+Math.sin(d)*24,5.5,l.z+Math.cos(d)*24),r.push(m);let b=new gt(u+.5,u/2+.5,.4);b.rotateY(d),b.translate(l.x+Math.sin(d)*24,5.5,l.z+Math.cos(d)*24),a.push(b);let M=new gt(.4,3.4,.4);M.translate(l.x+Math.sin(d)*24,1.7,l.z+Math.cos(d)*24),a.push(M)}this.group.add(new st(Fl(r),new re({map:s}))),this.group.add(new st(Fl(a),new Qt({color:2303532})))}updateLights(t){let e=""+Math.floor(t);if(e===this.lastLampKey)return;this.lastLampKey=e;let n=[new wt(3211114),new wt(16761370),new wt(16722474)],s=new wt(2105376),r=[2,1,0];for(let a=0;a<this.lampInfo.length;a++){let o=this.lampInfo[a],c=this.lightState(o.node,o.axis,t);this.lampMesh.setColorAt(a,r[o.color]===c?n[c]:s)}this.lampMesh.instanceColor&&(this.lampMesh.instanceColor.needsUpdate=!0)}shortest(t,e){let n=be*be,s=new Float64Array(n).fill(1/0),r=new Int32Array(n).fill(-1),a=new Uint8Array(n);for(let[o,c]of t)s[o]=c;for(;;){let o=-1,c=1/0;for(let l=0;l<n;l++)!a[l]&&s[l]<c&&(c=s[l],o=l);if(o<0)break;a[o]=1;for(let l of this.adj[o]){if(e.has(Tn(o,l)))continue;let h=s[o]+St;h<s[l]&&(s[l]=h,r[l]=o)}}return{dist:s,prev:r}}routeStates(t,e){let n=be*be*4,s=new Float64Array(n).fill(1/0),r=new Int32Array(n).fill(-1),a=new Uint8Array(n);for(let o of t){let c=o.node*4+o.dir;o.cost<s[c]&&(s[c]=o.cost)}for(;;){let o=-1,c=1/0;for(let f=0;f<n;f++)!a[f]&&s[f]<c&&(c=s[f],o=f);if(o<0)break;a[o]=1;let l=o>>2,h=o&3;for(let f of this.adj[l]){if(e.has(Tn(l,f)))continue;let u=js(l,f);if((u^1)===h)continue;let m=f*4+u,g=s[o]+St+(u!==h?14:0);g<s[m]&&(s[m]=g,r[m]=o)}}return{dist:s,prev:r}}nearestEdge(t,e){let n=Math.round(t/St),s=Math.round(e/St),r=Math.abs(t-n*St);if(Math.abs(e-s*St)<=r){let o=Math.max(0,Math.min(Ce,s)),c=Math.max(0,Math.min(Ce-1,Math.floor(t/St)));return[_n(c,o),_n(c+1,o),(t-c*St)/St]}else{let o=Math.max(0,Math.min(Ce,n)),c=Math.max(0,Math.min(Ce-1,Math.floor(e/St)));return[_n(o,c),_n(o,c+1),(e-c*St)/St]}}};function js(i,t){let e=t-i;return e===1?0:e===-1?1:e>0?2:3}function Fv(i,t){if(t.x1<=i.x0||t.x0>=i.x1||t.z1<=i.z0||t.z0>=i.z1)return[i];let e=[];t.z0>i.z0&&e.push({x0:i.x0,x1:i.x1,z0:i.z0,z1:t.z0}),t.z1<i.z1&&e.push({x0:i.x0,x1:i.x1,z0:t.z1,z1:i.z1});let n=Math.max(i.z0,t.z0),s=Math.min(i.z1,t.z1);return t.x0>i.x0&&e.push({x0:i.x0,x1:t.x0,z0:n,z1:s}),t.x1<i.x1&&e.push({x0:t.x1,x1:i.x1,z0:n,z1:s}),e}function df(i,t,e){let n=[],s=[];for(let a=0;a<i.length;a+=4){let[o,c,l,h]=[i[a],i[a+1],i[a+2],i[a+3]],f=n.length/3;n.push(o,t,c,l,t,c,l,t,h,o,t,h),s.push(f,f+2,f+1,f,f+3,f+2)}let r=new ye;return r.setAttribute("position",new jt(n,3)),r.setIndex(s),r.computeVertexNormals(),new st(r,new re({color:e}))}function Bv(i){let t=new wt(i);return t.multiplyScalar(.55),"#"+t.getHexString()}function Ov(){let i=document.createElement("canvas");i.width=64,i.height=64;let t=i.getContext("2d");t.fillStyle="rgba(60,220,255,0.10)",t.fillRect(0,0,64,64),t.strokeStyle="rgba(95,242,255,0.9)",t.lineWidth=2,t.strokeRect(1,1,62,62);let e=new Xe(i);return e.wrapS=e.wrapT=Li,e}function Qs(i,t){let e=[[i.c,i.s],[-i.s,i.c],[t.c,t.s],[-t.s,t.c]],n=t.x-i.x,s=t.z-i.z;for(let[r,a]of e){let o=i.hx*Math.abs(i.c*r+i.s*a)+i.hz*Math.abs(-i.s*r+i.c*a),c=t.hx*Math.abs(t.c*r+t.s*a)+t.hz*Math.abs(-t.s*r+t.c*a);if(Math.abs(n*r+s*a)>o+c)return!1}return!0}function ff(i){return{x:(i.x0+i.x1)/2,z:(i.z0+i.z1)/2,hx:(i.x1-i.x0)/2,hz:(i.z1-i.z0)/2,c:1,s:0}}var zv=4,da=.4,kv=10.5,Hv=24,Oh=i=>Math.atan2(Math.sin(i),Math.cos(i)),Ol=class{x=0;z=0;h=0;v=0;delta=0;ht=0;gear="D";holdT=0;fuel=1;throttleNow=0;brakeNow=0;latAcc=0;lonAcc=0;odo=0;tractor=new ee;trailer=new ee;wheelPivot=new ee;frontWheels=[];allWheels=[];freshener;wiper;rainGlass;dashCanvas;dashCtx;dashTex;headlight;brakeLightMat;interior=new ee;camAnchor=new _e;mirrorL=new _e;mirrorR=new _e;freshAng=0;freshVel=0;wiperT=0;constructor(){this.dashCanvas=document.createElement("canvas"),this.dashCanvas.width=512,this.dashCanvas.height=128,this.dashCtx=this.dashCanvas.getContext("2d"),this.dashTex=new Xe(this.dashCanvas),this.dashTex.colorSpace=Re,this.brakeLightMat=new re({color:6688784}),this.headlight=new $r(16773840,0,90,.55,.5,1.2),this.buildTractor(),this.buildTrailer()}reset(t,e,n,s){this.x=t,this.z=e,this.h=n,this.ht=n,this.v=0,this.delta=0,this.gear="D",this.fuel=s,this.holdT=0,this.sync()}snapshot(){return[this.x,this.z,this.h,this.ht,this.v,this.delta]}restore(t){[this.x,this.z,this.h,this.ht,this.v,this.delta]=t}step(t,e,n){let s=Math.abs(this.v);this.gear==="D"&&e.brake>.2&&s<.4&&e.throttle<.1?(this.holdT+=t,this.holdT>.35&&(this.gear="R",this.holdT=0)):this.gear==="R"&&e.throttle>.2&&s<.4?(this.holdT+=t,this.holdT>.2&&(this.gear="D",this.holdT=0)):this.holdT=0;let r=this.gear==="D",a=r?e.throttle:e.brake,o=r?e.brake:e.throttle;this.throttleNow=a,this.brakeNow=o;let c=this.fuel>0?Hv:3,l=0;r?l+=a*2.1*Math.max(0,1-this.v/c):l-=a*1.3*Math.max(0,1+this.v/4.5);let h=o*6.5*n+.25+.0022*this.v*this.v;this.v>0?l-=h:this.v<0&&(l+=h);let f=this.v+l*t;this.v!==0&&Math.sign(f)!==Math.sign(this.v)&&a<.05?this.v=0:this.v=f,Math.abs(this.v)<.02&&a<.05&&(this.v=0),this.lonAcc=l;let u=.6/(1+Math.abs(this.v)*.075),m=e.steer*u,g=1.5*t;this.delta+=Math.max(-g,Math.min(g,m-this.delta));let v=Math.abs(this.v)*t;this.odo+=v,this.fuel=Math.max(0,this.fuel-v*(12e-5+a*8e-5));let p=2,d=t/p;for(let y=0;y<p;y++){let w=this.v/zv*Math.tan(this.delta),T=Math.cos(this.h),R=Math.sin(this.h),x=this.v*T+w*da*-R,E=this.v*R+w*da*T,A=-Math.sin(this.ht),I=Math.cos(this.ht),D=(x*A+E*I)/kv;this.x+=this.v*T*d,this.z+=this.v*R*d,this.h+=w*d,this.ht+=D*d,this.latAcc=this.v*w}let b=Oh(this.h-this.ht),M=1.3;Math.abs(b)>M&&(this.ht=this.h-Math.sign(b)*M,this.v*=.9),this.h=Oh(this.h),this.ht=Oh(this.ht)}kingpin(){return{x:this.x+Math.cos(this.h)*da,z:this.z+Math.sin(this.h)*da}}obbs(){let t=Math.cos(this.h),e=Math.sin(this.h),n=this.kingpin(),s=Math.cos(this.ht),r=Math.sin(this.ht);return[{x:this.x+t*2,z:this.z+e*2,hx:3.45,hz:1.27,c:t,s:e},{x:n.x-s*5.6,z:n.z-r*5.6,hx:6.8,hz:1.3,c:s,s:r}]}trailerRear(){let t=this.kingpin();return{x:t.x-Math.cos(this.ht)*12.4,z:t.z-Math.sin(this.ht)*12.4}}front(){return{x:this.x+Math.cos(this.h)*5.6,z:this.z+Math.sin(this.h)*5.6}}sync(){this.tractor.position.set(this.x,0,this.z),this.tractor.rotation.y=Math.PI/2-this.h;let t=this.kingpin();this.trailer.position.set(t.x,0,t.z),this.trailer.rotation.y=Math.PI/2-this.ht}animate(t,e,n){this.sync(),this.wheelPivot.rotation.z=-this.delta*15;for(let a of this.frontWheels)a.rotation.y=-this.delta;let s=this.v*t/.52;for(let a of this.allWheels)a.rotation.x+=s;let r=Math.max(-.7,Math.min(.7,-this.latAcc*.08));this.freshVel+=((r-this.freshAng)*30-this.freshVel*3)*t,this.freshAng+=this.freshVel*t,this.freshener.rotation.z=this.freshAng,this.freshener.rotation.x=Math.max(-.5,Math.min(.5,this.lonAcc*.05)),this.wiper.visible=e,this.rainGlass.visible=e,e&&(this.wiperT+=t*2.4,this.wiper.rotation.z=-.1+Math.abs(Math.sin(this.wiperT))*1.9),this.headlight.intensity=n?60:0,this.brakeLightMat.color.setHex(this.brakeNow>.1||this.gear==="R"?16719904:6688784)}drawDash(t,e,n,s){let r=this.dashCtx,a=512;r.fillStyle="#05080c",r.fillRect(0,0,a,128),r.fillStyle="#5ff2ff",r.font="bold 64px Arial",r.textAlign="right",r.textBaseline="alphabetic",r.fillText(String(Math.round(Math.abs(this.v)*3.6)),150,74),r.font="bold 20px Arial",r.textAlign="left",r.fillText("KM/H",156,74),r.fillStyle=this.gear==="R"?"#ff5050":"#9cff9c",r.font="bold 44px Arial",r.fillText(this.gear,214,70),r.fillStyle="#233",r.fillRect(20,92,220,18),r.fillStyle=s?"#ff4040":"#ffcc33",r.fillRect(20,92,220*this.fuel,18),r.fillStyle="#ccc",r.font="bold 14px Arial",r.fillText("FUEL",24,106),r.fillStyle="#7a8a99",r.font="16px Arial",r.fillText(t,20,26),r.fillStyle="#0c1410",r.fillRect(268,8,236,112),r.strokeStyle="#2b3b33",r.lineWidth=3,r.strokeRect(268,8,236,112),r.fillStyle=e?"#7dff9a":"#335544",r.font="bold 30px Arial",r.textAlign="center",r.fillText(e?n:"RADIO OFF",386,58),r.font="16px Arial",r.fillText(e?"\u266A SHIFT FM \xB7 Electro Hits":"tap to turn on",386,92),this.dashTex.needsUpdate=!0}buildTractor(){let t=this.tractor,e=(it,at=0)=>new Qt({color:it,emissive:at}),n=e(1920936),s=e(13159634,2236962),r=e(1447446),a=e(2829360),o=(it,at,Ht,Gt,Vt,K=t)=>{let U=new st(it,at);return U.position.set(Ht,Gt,Vt),K.add(U),U};o(new gt(1.2,.35,7.2),r,0,.9,1.9),o(new gt(2.5,2.4,2.9),n,0,2.45,2.2),o(new gt(2.5,.9,1.4),n,0,3.9,1.3);let c=o(new gt(2,.95,1.55),n,0,1.47,4.35);o(new gt(.08,.02,1.5),e(14212579,3355443),0,1.955,4.35),o(new gt(.12,.12,.12),s,0,2,5),c.scale.set(1,1,1),o(new gt(1.7,.85,.08),s,0,1.42,5.15),o(new gt(2.5,.35,.3),s,0,.9,5.3);let l=e(16777198,8947814);o(new gt(.35,.2,.05),l,.85,1.25,5.17),o(new gt(.35,.2,.05),l,-.85,1.25,5.17),o(new gt(.8,.25,.1),e(16763955,5583616),0,2.75,5.5).visible=!1,o(new gt(.4,.3,1.5),n,1.1,1.35,4),o(new gt(.4,.3,1.5),n,-1.1,1.35,4);let h=new Ne(.12,.12,3.6,8);o(h,s,1.15,3.1,.6),o(h,s,-1.15,3.1,.6);let f=new Ne(.42,.42,1.6,10);f.rotateX(Math.PI/2),o(f,s,1.05,1,1.4),o(f,s,-1.05,1,1.4),o(new gt(1.6,.15,1.4),a,0,1.15,da);for(let it of[1,-1])o(new gt(.05,.05,.6),a,it*1.35,2.9,3.45),o(new gt(.12,.7,.32),a,it*1.6,2.85,3.3);let u=new Ne(.52,.52,.4,12);u.rotateZ(Math.PI/2);let m=e(1118481),g=new Ne(.25,.25,.42,8);g.rotateZ(Math.PI/2);let v=(it,at,Ht)=>{let Gt=new ee;Gt.position.set(it,.52,at),t.add(Gt);let Vt=new ee;Gt.add(Vt),Vt.add(new st(u,m)),Vt.add(new st(g,s)),Ht&&this.frontWheels.push(Gt),this.allWheels.push(Vt)};v(1.05,4,!0),v(-1.05,4,!0);for(let it of[0,-1.3])v(1,it,!1),v(-1,it,!1);o(new gt(.3,.15,.05),this.brakeLightMat,.9,1.2,-1.75),o(new gt(.3,.15,.05),this.brakeLightMat,-.9,1.2,-1.75),this.headlight.position.set(0,1.6,5.6);let p=new _e;p.position.set(0,0,30),t.add(p),this.headlight.target=p,t.add(this.headlight);let d=this.interior;t.add(d);let b=e(2500395),M=e(3421755),y=e(4869461);o(new gt(2.4,.45,.9),b,0,1.85,3.35,d);let w=o(new gt(2.4,.08,.7),M,0,2.1,3.3,d);w.rotation.x=-.12;let T=o(new gt(.66,.2,.22),b,.47,2.22,3.42,d);T.rotation.x=.5;let R=new ce(.58,.145),x=o(R,new re({map:this.dashTex}),.47,2.28,3.31,d);x.rotation.y=Math.PI,x.rotation.x=.5;for(let it of[.12,.82]){let at=o(new Ne(.03,.03,.04,10),y,it,2.27,3.33,d);at.rotation.x=Math.PI/2-.5}for(let it of[1,-1]){let at=o(new gt(.16,1.45,.16),b,it*1.18,3,3.6,d);at.rotation.x=.18}o(new gt(2.5,.22,.4),b,0,3.66,3.45,d),o(new gt(.9,.03,.42),e(4931640),.55,3.52,3.35,d),o(new gt(2.4,.06,.08),y,0,2.15,3.62,d),this.wheelPivot.position.set(.55,2.12,2.92),this.wheelPivot.rotation.order="XYZ";let E=new ee;E.position.copy(this.wheelPivot.position),E.rotation.x=.8,d.add(E),this.wheelPivot.position.set(0,0,0),E.add(this.wheelPivot);let A=new st(new xi(.24,.028,6,24),e(1710618));this.wheelPivot.add(A);let I=new gt(.46,.04,.03),D=new st(I,y);this.wheelPivot.add(D);let P=new st(new gt(.04,.24,.03),y);P.position.y=-.12,this.wheelPivot.add(P);let H=new st(new Ne(.07,.07,.05,12),e(1920936));H.rotation.x=Math.PI/2,H.position.z=-.01,this.wheelPivot.add(H);let z=new st(new sn(.03,6,6),e(16732013));z.position.set(.24,0,-.03),this.wheelPivot.add(z);let W=new ee;W.position.set(.3,3.53,3.35),d.add(W);let q=new st(new gt(.006,.18,.006),e(14540253));q.position.y=-.09,W.add(q);let Z=new st(new ti(.05,.13,3),e(6288127,1725792));Z.position.y=-.24,W.add(Z),this.freshener=W;let et=new ee;et.position.set(.35,2.18,3.66),d.add(et);let rt=new st(new gt(.035,1,.02),e(1118481));rt.position.y=.5,et.add(rt),this.wiper=et,this.rainGlass=o(new ce(2.3,1.3),new re({map:Gv(),transparent:!0,opacity:.55,depthWrite:!1}),0,3,3.68,d),this.rainGlass.rotation.y=Math.PI,this.camAnchor.position.set(.55,2.95,2.35),t.add(this.camAnchor),this.mirrorL.position.set(1.62,2.85,3),t.add(this.mirrorL),this.mirrorR.position.set(-1.62,2.85,3),t.add(this.mirrorR)}buildTrailer(){let t=this.trailer,e=document.createElement("canvas");e.width=1024,e.height=256;let n=e.getContext("2d");n.fillStyle="#eef1f4",n.fillRect(0,0,1024,256),n.fillStyle="#0b1d3a",n.fillRect(0,196,1024,60),n.fillStyle="#5ff2ff",n.fillRect(0,190,1024,6),n.fillStyle="#0b1d3a",n.font="900 92px Arial",n.textAlign="center",n.textBaseline="middle",n.fillText("METASHIFT",512,92),n.font="italic 34px Arial",n.fillStyle="#3a4a60",n.fillText("FREIGHT \xB7 Your income stream.",512,156),n.fillStyle="#ffffff",n.font="bold 26px Arial",n.fillText("UNIT 4471 \xB7 VIRTUAL WORK. REAL INCOME.",512,226);let s=new Xe(e);s.colorSpace=Re,s.anisotropy=4;let r=new Qt({map:s}),a=new Qt({color:15133164}),o=new Qt({color:12172996}),c=new st(new gt(2.56,2.9,13.6),[r,r,a,a,a,o]);c.position.set(0,2.65,-5.6),t.add(c);let l=new Qt({color:1381653}),h=new st(new gt(1.2,.3,13),l);h.position.set(0,1.05,-5.8),t.add(h);let f=new Ne(.52,.52,.4,12);f.rotateZ(Math.PI/2);for(let g of[-9.9,-11.2])for(let v of[1,-1]){let p=new st(f,l);p.position.set(v,.52,g),t.add(p),this.allWheels.push(p)}let u=new gt(.15,1.1,.15);for(let g of[.8,-.8]){let v=new st(u,l);v.position.set(g,.65,-2.2),t.add(v)}for(let g of[1,-1]){let v=new st(new gt(.4,.2,.05),this.brakeLightMat);v.position.set(g,1.25,-12.42),t.add(v)}let m=new st(new gt(2.3,.15,.15),l);m.position.set(0,.75,-12.3),t.add(m)}};function Gv(){let i=document.createElement("canvas");i.width=256,i.height=128;let t=i.getContext("2d");for(let e=0;e<140;e++){let n=Math.random()*256,s=Math.random()*128,r=.8+Math.random()*2.2;t.fillStyle=`rgba(200,220,255,${.25+Math.random()*.35})`,t.beginPath(),t.ellipse(n,s,r,r*1.3,0,0,Math.PI*2),t.fill()}return new Xe(i)}var fa=fe+1,tr=St-fe-1.5,zl=class{constructor(t,e){this.city=t;let n=new gt(1.9,.8,4.3);n.translate(0,.75,0);let s=new gt(1.7,.62,2.2);s.translate(0,1.45,-.3);let r=new gt(.35,.16,.06);this.body=new ke(n,new Qt({color:16777215}),this.max),this.cabin=new ke(s,new Qt({color:1778736,emissive:329740}),this.max),this.lights=new ke(r,new re({color:16777215}),this.max*4);for(let o of[this.body,this.cabin,this.lights])o.frustumCulled=!1,o.count=0,e.add(o);let a=[16732013,6288127,10976255,16765503,4177770,15921906,2763306,16747066,4164863,14045136];for(let o=0;o<this.max;o++)this.cars.push({a:0,b:1,s:0,mode:0,c:0,p0:new Ut,p1:new Ut,p2:new Ut,u:0,len:1,v:0,vmax:10,x:0,z:0,h:0,hit:0,stuck:0,color:new wt(a[o%a.length]),active:!1}),this.body.setColorAt(o,this.cars[o].color);for(let o=0;o<this.max;o++){let c=new wt(16774872),l=new wt(16719904);this.lights.setColorAt(o*4,c),this.lights.setColorAt(o*4+1,c),this.lights.setColorAt(o*4+2,l),this.lights.setColorAt(o*4+3,l)}}cars=[];body;cabin;lights;max=40;count=0;speed=11;m=new oe;q=new Ye;v3=new L;s3=new L(1,1,1);Y=new L(0,1,0);R=Math.random;setup(t,e,n,s){this.count=Math.min(this.max,t),this.speed=e;for(let r=0;r<this.max;r++){let a=this.cars[r];a.active=r<this.count,a.active&&this.spawn(a,n,s,25,260)}this.body.count=this.cabin.count=this.count,this.lights.count=this.count*4}edgeDir(t,e){let n=mn(t),s=mn(e);return{dx:Math.sign(s.x-n.x),dz:Math.sign(s.z-n.z),A:n,B:s}}place(t){let{dx:e,dz:n,A:s}=this.edgeDir(t.a,t.b);t.x=s.x+e*t.s-n*pn,t.z=s.z+n*t.s+e*pn,t.h=Math.atan2(n,e)}spawn(t,e,n,s,r){for(let a=0;a<40;a++){let o=Math.floor(this.R()*be*be),c=this.city.adj[o],l=c[Math.floor(this.R()*c.length)];if(this.city.blocked.has(Tn(o,l)))continue;t.a=o,t.b=l,t.s=fa+this.R()*(tr-fa-4),t.mode=0,this.place(t);let h=Math.hypot(t.x-e,t.z-n);if(h<s||h>r)continue;let f=!0;for(let u of this.cars)if(u!==t&&u.active&&Math.hypot(u.x-t.x,u.z-t.z)<12){f=!1;break}if(f){t.v=this.speed*.6,t.vmax=this.speed*(.8+this.R()*.4),t.hit=0,t.stuck=0;return}}}startTurn(t){let e=this.city.adj[t.b].filter(c=>c!==t.a&&!this.city.blocked.has(Tn(t.b,c))),n=e.length?e[Math.floor(this.R()*e.length)]:t.a,s=this.edgeDir(t.a,t.b),r=this.edgeDir(t.b,n),a=s.B;t.p0.set(a.x-s.dx*(St-tr)-s.dz*pn,a.z-s.dz*(St-tr)+s.dx*pn),t.p2.set(a.x+r.dx*fa-r.dz*pn,a.z+r.dz*fa+r.dx*pn);let o=s.dx*r.dx+s.dz*r.dz;o>.5?t.p1.copy(t.p0).add(t.p2).multiplyScalar(.5):o<-.5?t.p1.set(a.x+s.dx*6,a.z+s.dz*6):t.p1.set(a.x-s.dz*pn-r.dz*pn,a.z+s.dx*pn+r.dx*pn),t.len=t.p0.distanceTo(t.p1)+t.p1.distanceTo(t.p2),t.c=n,t.u=0,t.mode=1}update(t,e,n,s,r){for(let a=0;a<this.count;a++){let o=this.cars[a],c=Math.cos(o.h),l=Math.sin(o.h),h=o.vmax;if(o.hit>0&&(o.hit-=t,h=0),o.mode===0){let v=tr-o.s,{dx:p}=this.edgeDir(o.a,o.b),d=this.city.lightState(o.b,p!==0?0:1,e);(d===2||d===1&&v>7)&&(h=Math.min(h,Math.sqrt(Math.max(0,2*3.5*(v-.5)))))}for(let v=0;v<this.count;v++){if(v===a)continue;let p=this.cars[v],d=p.x-o.x,b=p.z-o.z,M=d*c+b*l;M<0||M>16||Math.abs(-d*l+b*c)>2.2||(h=Math.min(h,Math.max(0,(M-6.5)*1.2)))}let f={x:o.x+c*7.5,z:o.z+l*7.5,hx:5.5,hz:1.4,c,s:l};for(let v of n)if(Qs(f,v)){h=0;break}let u=h>o.v?2.5:-7;o.v+=u*t,(u>0&&o.v>h||u<0&&o.v<h)&&(o.v=h),o.v=Math.max(0,o.v),o.stuck=o.v<.2?o.stuck+t:0;let m=o.v*t;if(o.mode===0&&(o.s+=m,o.s>=tr?(o.s=tr,this.startTurn(o)):this.place(o)),o.mode===1)if(o.u+=m/o.len,o.u>=1)o.a=o.b,o.b=o.c,o.s=fa,o.mode=0,this.place(o);else{let v=o.u,p=1-v,d=p*p*o.p0.x+2*p*v*o.p1.x+v*v*o.p2.x,b=p*p*o.p0.y+2*p*v*o.p1.y+v*v*o.p2.y,M=2*p*(o.p1.x-o.p0.x)+2*v*(o.p2.x-o.p1.x),y=2*p*(o.p1.y-o.p0.y)+2*v*(o.p2.y-o.p1.y);o.x=d,o.z=b,M*M+y*y>1e-6&&(o.h=Math.atan2(y,M))}let g=Math.hypot(o.x-s,o.z-r);(g>280||o.stuck>30&&g>60)&&this.spawn(o,s,r,90,240),this.q.setFromAxisAngle(this.Y,Math.PI/2-o.h),this.m.compose(this.v3.set(o.x,0,o.z),this.q,this.s3),this.body.setMatrixAt(a,this.m),this.cabin.setMatrixAt(a,this.m);for(let v=0;v<4;v++){let p=v%2===0?.65:-.65,d=v<2?2.17:-2.17,b=o.x+c*d-l*-p,M=o.z+l*d+c*-p;this.m.compose(this.v3.set(b,.85,M),this.q,this.s3),this.lights.setMatrixAt(a*4+v,this.m)}}this.body.instanceMatrix.needsUpdate=!0,this.cabin.instanceMatrix.needsUpdate=!0,this.lights.instanceMatrix.needsUpdate=!0}obb(t){let e=this.cars[t];return{x:e.x,z:e.z,hx:2.15,hz:.95,c:Math.cos(e.h),s:Math.sin(e.h)}}bump(t){this.cars[t].hit=3,this.cars[t].v=0}};var yn=(i,t=0)=>new Qt({color:i,emissive:t}),ps=class{root=new ee;hips=new ee;spine=new ee;head=new ee;armL=new ee;armR=new ee;foreL=new ee;foreR=new ee;legL=new ee;legR=new ee;shinL=new ee;shinR=new ee;handR=new _e;handL=new _e;browL;browR;mouth;eyeL;eyeR;tag;expr="neutral";talking=!1;talkT=0;blinkT=2;walkT=0;constructor(t){let e=this.root;e.add(this.hips),this.hips.position.y=.95,this.hips.add(this.spine);let n=yn(t.skin),s=yn(t.shirt,t.glow??0),r=yn(t.pants),a=yn(t.hair),o=yn(t.shoes??2236962),c=t.build??1,l=(p,d,b,M,y,w=0,T=0,R=0)=>{let x=new st(new gt(p,d,b),M);return x.position.set(w,T,R),y.add(x),x};l(.36*c,.16,.22,r,this.hips,0,.02,0),l(.4*c,.52,.24*c,s,this.spine,0,.32,0),t.jacket!==void 0&&l(.42*c,.36,.26*c,yn(t.jacket),this.spine,0,.42,0),this.head.position.y=.66,this.spine.add(this.head),l(.09,.08,.09,n,this.head,0,-.04,0);let h=new st(new sn(.125,14,10),n);h.scale.set(.95,1.12,1),h.position.y=.1,this.head.add(h);let f=new st(new sn(.133,14,8,0,Math.PI*2,0,Math.PI*.55),a);if(f.scale.set(.97,1.1,1.05),f.position.set(0,.11,-.01),f.rotation.x=-.25,this.head.add(f),t.longHair){let p=l(.24,.26,.08,a,this.head,0,0,-.1);p.rotation.x=.1}let u=yn(1118481);this.eyeL=new st(new sn(.018,6,6),u),this.eyeL.position.set(.045,.12,.112),this.head.add(this.eyeL),this.eyeR=new st(new sn(.018,6,6),u),this.eyeR.position.set(-.045,.12,.112),this.head.add(this.eyeR),this.browL=l(.05,.011,.01,a,this.head,.047,.158,.118),this.browR=l(.05,.011,.01,a,this.head,-.047,.158,.118),this.mouth=l(.055,.012,.01,yn(5906464),this.head,0,.035,.118),l(.02,.035,.02,n,this.head,0,.085,.125);let m=yn(t.hatColor??16732013,t.hatColor?t.hatColor&4144959:0);switch(t.hat){case"cap":{l(.27,.08,.27,m,this.head,0,.22,0),l(.2,.02,.12,m,this.head,0,.19,.17);break}case"beanie":{let p=new st(new sn(.14,10,8,0,Math.PI*2,0,Math.PI*.5),m);p.position.y=.15,this.head.add(p);break}case"ears":{for(let p of[1,-1]){let d=new st(new ti(.05,.12,4),m);d.position.set(p*.08,.27,0),this.head.add(d)}break}case"halo":{let p=new st(new xi(.11,.015,6,20),new re({color:t.hatColor??16769126}));p.rotation.x=Math.PI/2,p.position.y=.33,this.head.add(p);break}case"crown":{let p=new st(new Ne(.1,.09,.08,6,1,!0),yn(16763955,5583616));p.position.y=.26,this.head.add(p);break}case"visor":{l(.25,.05,.04,new re({color:t.hatColor??6288127}),this.head,0,.12,.13);break}case"antenna":{l(.012,.2,.012,yn(14540253),this.head,0,.32,0);let p=new st(new sn(.03,6,6),new re({color:t.hatColor??7208886}));p.position.y=.43,this.head.add(p);break}}let g=(p,d,b,M)=>{p.position.set(M*.25*c,.55,0),this.spine.add(p),l(.1,.3,.1,s,p,0,-.14,0),d.position.y=-.29,p.add(d),l(.085,.27,.085,t.jacket!==void 0?yn(t.jacket):n,d,0,-.13,0),l(.08,.09,.08,n,d,0,-.3,0),b.position.y=-.31,d.add(b)};g(this.armL,this.foreL,this.handL,1),g(this.armR,this.foreR,this.handR,-1);let v=(p,d,b)=>{p.position.set(b*.1,0,0),this.hips.add(p),l(.14,.46,.15,r,p,0,-.23,0),d.position.y=-.45,p.add(d),l(.12,.44,.13,r,d,0,-.22,0),l(.13,.08,.24,o,d,0,-.46,.05)};v(this.legL,this.shinL,1),v(this.legR,this.shinR,-1),t.name&&(this.tag=Vv(t.name,t.nameColor??"#5ff2ff"),this.tag.position.y=2.1,e.add(this.tag))}setExpr(t){this.expr=t}update(t){let e=this.expr,n=.158,s=0,r=1,a=.035,o=0,c=1;e==="tired"&&(c=.45,s=-.15,r=.8),e==="sad"&&(s=.35,r=.8,a=.03),e==="surprised"&&(n=.175,c=1.3,r=.6),e==="smile"&&(r=1.35,a=.04,n=.163),e==="annoyed"&&(s=-.35,n=.152,r=.9,o=.15),e==="closed"&&(c=.08),this.browL.position.y=this.browR.position.y=n,this.browL.rotation.z=s,this.browR.rotation.z=-s,this.blinkT-=t;let l=this.blinkT<.12&&this.blinkT>0?.1:1;if(this.blinkT<0&&(this.blinkT=2+Math.random()*3),this.eyeL.scale.y=this.eyeR.scale.y=c*l,this.mouth.position.y=a,this.mouth.rotation.z=o,this.talking){this.talkT+=t*14;let h=.5+.5*Math.abs(Math.sin(this.talkT)*Math.sin(this.talkT*.37+1));this.mouth.scale.set(r*.9,1+h*3.2,1)}else this.mouth.scale.set(r,1,1)}resetPose(){for(let t of[this.armL,this.armR,this.foreL,this.foreR,this.legL,this.legR,this.shinL,this.shinR,this.spine,this.head,this.hips])t.rotation.set(0,0,0);this.hips.position.set(0,.95,0),this.armL.rotation.z=.08,this.armR.rotation.z=-.08}walk(t,e){this.walkT+=t*e*5.5;let n=Math.sin(this.walkT);this.legL.rotation.x=n*.5,this.legR.rotation.x=-n*.5,this.shinL.rotation.x=Math.max(0,-n)*.6,this.shinR.rotation.x=Math.max(0,n)*.6,this.armL.rotation.x=-n*.4,this.armR.rotation.x=n*.4,this.hips.position.y=.95+Math.abs(Math.cos(this.walkT))*.03}idle(t){this.spine.rotation.x=Math.sin(t*1.3)*.015,this.armL.rotation.z=.08+Math.sin(t*1.1)*.02,this.armR.rotation.z=-.08-Math.sin(t*1.1)*.02}gesture(t){this.armR.rotation.x=-.5+Math.sin(t*2.2)*.15,this.foreR.rotation.x=-.6+Math.sin(t*3.1)*.2}};function Vv(i,t){let e=document.createElement("canvas");e.width=256,e.height=40;let n=e.getContext("2d");n.font="bold 22px Arial";let s=Math.min(250,n.measureText(i).width+22);n.fillStyle="rgba(8,12,20,0.72)",pf(n,128-s/2,4,s,32,10),n.fill(),n.fillStyle=t,n.textAlign="center",n.textBaseline="middle",n.fillText(i,128,21);let r=new Xe(e);r.colorSpace=Re;let a=new Br(new Vs({map:r,depthWrite:!1,transparent:!0}));return a.scale.set(1.4,.22,1),a}function pf(i,t,e,n,s,r){i.beginPath(),i.moveTo(t+r,e),i.arcTo(t+n,e,t+n,e+s,r),i.arcTo(t+n,e+s,t,e+s,r),i.arcTo(t,e+s,t,e,r),i.arcTo(t,e,t+n,e,r),i.closePath()}var Wi=["xX_NeonKaiju_Xx","LunaByte","drift_queen","PixelPapa","ZeroLatency","mochi.exe","SirLagsAlot","StarlitVex","Glitchcat","bigtipper99","kawaii_tank","NightOwl_77","VaporRick","cloud_nine","Captain_AFK","jellybeam","DJ_Respawn","ok_boomerang","Fizzwhistle","NoobMaster420","velvetvoid","Hex_Ana","TacoTuesday","quietstorm","Rainbow_Dash_IRL","meta_marco","sk8rgrl","Lord_Ping","bubbletea4ever","Orbit","lofi_larry","PrincessPayday","catgpt","TurboTurtle","snowcone","Mx_Mirage","DeltaFox","hyperpop_hal","Juniper","B0ss_Baby","WORKER_2291","WORKER_7713","Courier_5520","Greeter_0148","Cashier_3307","Janitor_8812","Builder_6604","Barista_4120"],kl=class{constructor(t,e){this.city=t;let n=new Vr(.24,.9,3,8);n.translate(0,.75,0);let s=new sn(.17,10,8);s.translate(0,1.52,0);let r=new ti(.16,.3,6);r.translate(0,1.78,0),this.bodies=new ke(n,yn(16777215,1118481),this.N),this.heads=new ke(s,yn(16777215),this.N),this.hats=new ke(r,new re({color:16777215}),this.N);let a=[16732013,6288127,10976255,16765503,7208886,16743129,16777215,16747066],o=[15843965,14724201,13010498,9262372,16767916,10478335,12189616,14137599],c=Math.random;for(let p=0;p<this.N;p++){let d=p%5===0;this.bodies.setColorAt(p,new wt(d?3095114:a[p%a.length]).multiplyScalar(d?1:.85)),this.heads.setColorAt(p,new wt(o[Math.floor(c()*o.length)])),this.hats.setColorAt(p,new wt(a[(p*3+1)%a.length]));let b=p<30,M={x:0,z:0,h:0,mode:b?1:0,rect:t.walkPaths[0],p:0,dir:1,px:0,pz:0,scale:1,fade:0,name:p%Wi.length,phase:c()*10,worker:d};if(b){let y=t.plazaCenters[p%t.plazaCenters.length],w=c()*Math.PI*2,T=4+c()*14;M.px=y.x+Math.cos(w)*T,M.pz=y.z+Math.sin(w)*T,M.x=M.px,M.z=M.pz,M.h=c()*6}this.walkers.push(M)}for(let p of[this.bodies,this.heads,this.hats])p.frustumCulled=!1,e.add(p);let l=document.createElement("canvas");l.width=1024,l.height=1024;let h=l.getContext("2d");Wi.forEach((p,d)=>{let b=d%4*256,M=Math.floor(d/4)*32,y=/^(WORKER|Courier|Greeter|Cashier|Janitor|Builder|Barista)/.test(p);h.font="bold 19px Arial";let w=Math.min(250,h.measureText(p).width+18);h.fillStyle="rgba(8,12,20,0.7)",pf(h,b+128-w/2,M+3,w,26,8),h.fill(),h.fillStyle=y?"#ffd23f":"#ffffff",h.textAlign="center",h.textBaseline="middle",h.fillText(p,b+128,M+17)});let f=new Xe(l);f.colorSpace=Re;let u=new ce(1,1);this.tagGeo=new Kr,this.tagGeo.index=u.index,this.tagGeo.setAttribute("position",u.attributes.position),this.tagGeo.setAttribute("uv",u.attributes.uv),this.tagPos=new Qn(new Float32Array(this.N*3),3),this.tagA=new Qn(new Float32Array(this.N),1);let m=new Float32Array(this.N*2);for(let p=0;p<this.N;p++){let d=this.walkers[p].name;m[p*2]=d%4,m[p*2+1]=Math.floor(d/4)}this.tagGeo.setAttribute("aPos",this.tagPos),this.tagGeo.setAttribute("aA",this.tagA),this.tagGeo.setAttribute("aCell",new Qn(m,2)),this.tagGeo.instanceCount=this.N;let g=new tn({uniforms:{map:{value:f},uR:{value:new L(1,0,0)},uU:{value:new L(0,1,0)}},vertexShader:`attribute vec3 aPos; attribute vec2 aCell; attribute float aA; uniform vec3 uR; uniform vec3 uU; varying vec2 vUv; varying float vA;
        void main(){ vec3 wp = aPos + uR*position.x*1.9 + uU*position.y*0.24; float d = distance(aPos, cameraPosition);
          vA = aA * (1.0 - smoothstep(35.0, 55.0, d));
          vUv = vec2((aCell.x + uv.x)/4.0, 1.0 - (aCell.y + 1.0 - uv.y)/32.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(wp,1.0); }`,fragmentShader:"uniform sampler2D map; varying vec2 vUv; varying float vA; void main(){ vec4 c = texture2D(map, vUv); c.a *= vA; if (c.a < 0.02) discard; gl_FragColor = c; }",transparent:!0,depthWrite:!1});this.tagMesh=new st(this.tagGeo,g),this.tagMesh.frustumCulled=!1,this.tagMesh.onBeforeRender=(p,d,b)=>{let M=b.matrixWorld.elements;g.uniforms.uR.value.set(M[0],M[1],M[2]).normalize(),g.uniforms.uU.value.set(M[4],M[5],M[6]).normalize()},e.add(this.tagMesh);let v=new Ne(.6,.6,6,12,1,!0);v.translate(0,3,0),this.pillars=new ke(v,new re({color:6288127,transparent:!0,opacity:.45,blending:cs,depthWrite:!1,side:Ze}),6),this.pillars.frustumCulled=!1;for(let p=0;p<6;p++)this.pillarT.push(0),this.pillarP.push(new L);e.add(this.pillars)}walkers=[];bodies;heads;hats;tagGeo;tagMesh;tagPos;tagA;pillars;pillarT=[];pillarP=[];events=[];m=new oe;q=new Ye;v=new L;s=new L;Y=new L(0,1,0);evT=6;N=60;placeWalker(t,e,n){let s=this.city.walkPaths.filter(r=>Math.hypot((r.x0+r.x1)/2-e,(r.z0+r.z1)/2-n)<160);t.rect=s.length?s[Math.floor(Math.random()*s.length)]:this.city.walkPaths[Math.floor(Math.random()*this.city.walkPaths.length)],t.p=Math.random(),t.dir=Math.random()<.5?1:-1}reset(t,e){for(let n of this.walkers)n.mode===0&&(this.placeWalker(n,t,e),n.scale=1,n.fade=0)}perim(t,e){let n=t.x1-t.x0,s=t.z1-t.z0,r=2*(n+s),a=(e%1+1)%1*r;return a<n?{x:t.x0+a,z:t.z0,h:0}:(a-=n,a<s?{x:t.x1,z:t.z0+a,h:Math.PI/2}:(a-=s,a<n?{x:t.x1-a,z:t.z1,h:Math.PI}:(a-=n,{x:t.x0,z:t.z1-a,h:-Math.PI/2})))}pillar(t,e){let n=this.pillarT.findIndex(s=>s<=0);n<0&&(n=0),this.pillarT[n]=1,this.pillarP[n].set(t,0,e)}update(t,e,n,s){let r=Math.random;if(this.evT-=t,this.evT<0){this.evT=4+r()*6;let a=this.walkers.filter(o=>o.fade===0&&Math.hypot(o.x-n,o.z-s)<70);if(a.length){let o=a[Math.floor(r()*a.length)];o.fade=-1,this.pillar(o.x,o.z),this.events.push(Wi[o.name]+" logged out")}}for(let a=0;a<this.N;a++){let o=this.walkers[a];if(o.mode===0){let l=o.rect,h=2*(l.x1-l.x0+l.z1-l.z0);o.p+=o.dir*t*1.3/h;let f=this.perim(l,o.p);o.x=f.x,o.z=f.z,o.h=f.h+(o.dir<0?Math.PI:0),Math.hypot(o.x-n,o.z-s)>170&&o.fade===0&&this.placeWalker(o,n,s)}else o.x=o.px+Math.sin(e*.3+o.phase)*.6,o.z=o.pz+Math.cos(e*.25+o.phase)*.6,o.h+=t*.3*Math.sin(o.phase);if(o.fade<0){if(o.scale-=t*1.6,o.scale<=0){o.scale=0,o.fade=1,o.mode===0&&this.placeWalker(o,n,s);let l=o.mode===0?this.perim(o.rect,o.p):{x:o.px,z:o.pz};this.pillar(l.x,l.z),this.events.push(Wi[(o.name+7)%Wi.length]+" logged in"),o.name=(o.name+7)%Wi.length}}else o.fade>0&&(o.scale+=t*1.6,o.scale>=1&&(o.scale=1,o.fade=0));let c=o.mode===1?Math.abs(Math.sin(e*4+o.phase))*.25:Math.abs(Math.sin(e*7+o.phase))*.04;this.q.setFromAxisAngle(this.Y,Math.PI/2-o.h),this.m.compose(this.v.set(o.x,.15+c,o.z),this.q,this.s.set(o.scale,o.scale,o.scale)),this.bodies.setMatrixAt(a,this.m),this.heads.setMatrixAt(a,this.m),o.worker&&this.m.compose(this.v.set(0,-100,0),this.q,this.s.set(0,0,0)),this.hats.setMatrixAt(a,this.m),this.tagPos.setXYZ(a,o.x,2.15+c,o.z),this.tagA.setX(a,o.scale)}this.bodies.instanceMatrix.needsUpdate=this.heads.instanceMatrix.needsUpdate=this.hats.instanceMatrix.needsUpdate=!0,this.tagPos.needsUpdate=!0,this.tagA.needsUpdate=!0;for(let a=0;a<6;a++){this.pillarT[a]>0&&(this.pillarT[a]-=t*1.2);let o=Math.max(0,this.pillarT[a]);this.m.compose(this.v.copy(this.pillarP[a]),this.q.identity(),this.s.set(o,o>0?1:0,o)),this.pillars.setMatrixAt(a,this.m)}this.pillars.instanceMatrix.needsUpdate=!0}};var Hl=class{ctx=null;master;music;sfx;radioBus;radioFilter;engOsc=[];engGain;engFilter;rainGain;noiseBuf;radioOn=!0;radioPlaying=!1;titleMode=!1;nextNote=0;seqStep=0;timer=0;radioLP;pump;delaySend;voices=[];init(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}let t=window.AudioContext||window.webkitAudioContext;if(!t)return;let e=new t;this.ctx=e,this.master=e.createGain(),this.master.gain.value=.8,this.master.connect(e.destination),this.music=e.createGain(),this.music.gain.value=.55,this.music.connect(this.master),this.sfx=e.createGain(),this.sfx.gain.value=.9,this.sfx.connect(this.master),this.radioFilter=e.createBiquadFilter(),this.radioFilter.type="highpass",this.radioFilter.frequency.value=90,this.radioLP=e.createBiquadFilter(),this.radioLP.type="lowpass",this.radioLP.frequency.value=7500;let n=e.createDynamicsCompressor();n.threshold.value=-16,n.ratio.value=3.5,n.attack.value=.005,n.release.value=.15,this.radioBus=e.createGain(),this.radioBus.gain.value=0,this.radioBus.connect(this.radioFilter),this.radioFilter.connect(this.radioLP),this.radioLP.connect(n);let s=e.createGain();s.gain.value=2.6,n.connect(s),s.connect(this.music),this.pump=e.createGain(),this.pump.connect(this.radioBus);let r=e.createDelay(1);r.delayTime.value=60/118*.75;let a=e.createGain();a.gain.value=.34;let o=e.createBiquadFilter();o.type="lowpass",o.frequency.value=2800,this.delaySend=e.createGain(),this.delaySend.gain.value=.3,this.delaySend.connect(r),r.connect(o),o.connect(a),a.connect(r),o.connect(this.radioBus);let c=e.createBuffer(1,e.sampleRate*2,e.sampleRate),l=c.getChannelData(0);for(let m=0;m<l.length;m++)l[m]=Math.random()*2-1;this.noiseBuf=c,this.engGain=e.createGain(),this.engGain.gain.value=0,this.engFilter=e.createBiquadFilter(),this.engFilter.type="lowpass",this.engFilter.frequency.value=400;for(let[m,g]of[["sawtooth",1],["square",.5],["sine",2]]){let v=e.createOscillator();v.type=m,v.frequency.value=40*g;let p=e.createGain();p.gain.value=m==="sine"?.4:.25,v.connect(p),p.connect(this.engFilter),v.start(),this.engOsc.push(v)}this.engFilter.connect(this.engGain),this.engGain.connect(this.sfx);let h=e.createBufferSource();h.buffer=c,h.loop=!0;let f=e.createBiquadFilter();f.type="highpass",f.frequency.value=1200,this.rainGain=e.createGain(),this.rainGain.gain.value=0,h.connect(f),f.connect(this.rainGain),this.rainGain.connect(this.sfx),h.start(),this.timer=window.setInterval(()=>this.schedule(),60);let u=()=>{this.voices=(window.speechSynthesis?.getVoices()||[]).filter(m=>/^en/i.test(m.lang))};u(),window.speechSynthesis&&(window.speechSynthesis.onvoiceschanged=u),this.setRadio(this.radioPlaying,this.titleMode)}setEngine(t,e,n){if(!this.ctx)return;let s=this.ctx.currentTime,r=34+t*46;this.engOsc[0].frequency.setTargetAtTime(r,s,.08),this.engOsc[1].frequency.setTargetAtTime(r*.5,s,.08),this.engOsc[2].frequency.setTargetAtTime(r*2,s,.08),this.engFilter.frequency.setTargetAtTime(250+e*500+t*300,s,.1),this.engGain.gain.setTargetAtTime(n?.16+e*.12:0,s,.15)}setRain(t){this.ctx&&this.rainGain.gain.setTargetAtTime(t*.14,this.ctx.currentTime,.4)}setRadio(t,e=!1){if(this.radioPlaying=t,this.titleMode=e,!this.ctx)return;let n=this.ctx.currentTime,s=t&&(e||this.radioOn);s&&this.seqIdle&&(this.seqStep=0),this.radioBus.gain.setTargetAtTime(s?e?.42:.5:0,n,.08),this.radioLP.frequency.setTargetAtTime(e?16e3:7500,n,.1)}seqIdle=!0;schedule(){let t=this.ctx;if(!t)return;if(!this.radioPlaying||!(this.radioOn||this.titleMode)){this.nextNote=t.currentTime+.05,this.seqIdle=!0;return}this.seqIdle=!1;let e=60/118/4;for(this.nextNote<t.currentTime&&(this.nextNote=t.currentTime+.05);this.nextNote<t.currentTime+.3;)this.playStep(this.seqStep,this.nextNote,e),this.nextNote+=e,this.seqStep=(this.seqStep+1)%512}playStep(t,e,n){let s=Math.floor(t/16),r=t%16,a=s%4,o=[45,41,48,43],c=[[57,60,64],[53,57,60],[55,60,64],[55,59,62]],l=[[76,0,0,76,0,74,76,0,79,0,76,0,74,0,72,0],[72,0,0,72,0,71,72,0,74,0,72,0,69,0,0,0],[72,0,0,72,0,74,76,0,79,0,81,0,79,0,76,0],[74,0,0,0,76,0,74,0,71,0,0,0,67,0,0,0],[76,0,0,76,0,74,76,0,79,0,76,0,74,0,72,0],[72,0,0,72,0,71,72,0,74,0,72,0,69,0,0,0],[76,0,79,0,81,0,79,0,76,0,74,0,76,0,79,0],[83,0,0,81,0,79,0,0,74,0,0,0,76,0,0,0]],h=s<4,f=s>=4,u=s>=24&&s<28,m=s>=28,g=f&&!u,v=s>=2&&!u,p=s>=8,d=s>=16&&s<24||u||m,b=this.radioBus;if(r===0&&(s===4||s===8||s===16||s===28)&&this.noise(e,1.4,.07,b,"highpass",6e3),g&&r%4===0&&(this.kick(e,b),this.pump.gain.setValueAtTime(.25,e),this.pump.gain.linearRampToValueAtTime(1,e+n*3.2)),g&&(r===4||r===12)&&this.clap(e,b),(!h||r%2===0)&&(r%4===2?this.noise(e,.16,u?.025:.045,b,"highpass",8e3):this.noise(e,.035,(r%2?.03:.018)*(u?.6:1),b,"highpass",9500)),s===27&&r===0&&this.riser(e,n*16,b),r===0){let M=h?700+s*250:u?2600:1700;for(let y of c[a])for(let w of[-9,0,9])this.voice(y,e,n*16,"sawtooth",u?.024:.016,this.pump,M,0,w,.25,.4)}if(v&&r%4!==0){let M=o[a]-12+(r%4===2?12:0);this.voice(M,e,n*.9,"sawtooth",.11,this.pump,380,900,0,.004,.03)}if(p&&!(m&&r%2===1)){let M=c[a],T=[M[0],M[1],M[2],M[0]+12,M[1]+12,M[2]+12][[0,2,4,5,3,1,2,4,0,2,4,5,4,2,1,3][r]]+12;this.voice(T,e,n*.8,"square",u?.035:.026,b,900,2600,0,.003,.05).connect(this.delaySend)}if(d){let M=l[s%8],y=M[r];if(y){let w=1;for(;r+w<16&&M[r+w]===0&&w<6;)w++;let T=u?.04:.055,R=this.voice(y,e,n*w*.95,"sawtooth",T,b,1800,2200,-6,.01,.12,!0),x=this.voice(y+12,e,n*w*.95,"square",T*.35,b,2500,1500,6,.01,.12,!0);R.connect(this.delaySend),x.connect(this.delaySend)}}}voice(t,e,n,s,r,a,o,c,l=0,h=.005,f=.08,u=!1){let m=this.ctx,g=m.createOscillator();if(g.type=s,g.frequency.value=440*Math.pow(2,(t-69)/12),g.detune.value=l,u){let d=m.createOscillator();d.frequency.value=5.2;let b=m.createGain();b.gain.setValueAtTime(0,e),b.gain.linearRampToValueAtTime(9,e+.25),d.connect(b),b.connect(g.detune),d.start(e),d.stop(e+n+f+.05)}let v=m.createBiquadFilter();v.type="lowpass",v.Q.value=2,v.frequency.setValueAtTime(o+c,e),v.frequency.exponentialRampToValueAtTime(Math.max(60,o),e+Math.min(n,.18)+.02);let p=m.createGain();return p.gain.setValueAtTime(1e-4,e),p.gain.linearRampToValueAtTime(r,e+h),p.gain.setValueAtTime(r,e+Math.max(h,n)),p.gain.exponentialRampToValueAtTime(1e-4,e+Math.max(h,n)+f),g.connect(v),v.connect(p),p.connect(a),g.start(e),g.stop(e+Math.max(h,n)+f+.05),p}riser(t,e,n){let s=this.ctx,r=s.createBufferSource();r.buffer=this.noiseBuf,r.loop=!0;let a=s.createBiquadFilter();a.type="bandpass",a.Q.value=3,a.frequency.setValueAtTime(400,t),a.frequency.exponentialRampToValueAtTime(7e3,t+e);let o=s.createGain();o.gain.setValueAtTime(1e-4,t),o.gain.exponentialRampToValueAtTime(.12,t+e),o.gain.linearRampToValueAtTime(0,t+e+.02),r.connect(a),a.connect(o),o.connect(n),r.start(t),r.stop(t+e+.05)}tone(t,e,n,s,r,a,o=4e3,c=!1){let l=this.ctx,h=l.createOscillator();if(h.type=s,h.frequency.value=440*Math.pow(2,(t-69)/12),c){let m=l.createOscillator();m.frequency.value=5.5;let g=l.createGain();g.gain.value=4,m.connect(g),g.connect(h.frequency),m.start(e),m.stop(e+n+.05)}let f=l.createBiquadFilter();f.type="lowpass",f.frequency.value=o;let u=l.createGain();u.gain.setValueAtTime(1e-4,e),u.gain.exponentialRampToValueAtTime(r,e+.01),u.gain.exponentialRampToValueAtTime(1e-4,e+n),h.connect(f),f.connect(u),u.connect(a),h.start(e),h.stop(e+n+.02)}noise(t,e,n,s,r,a){let o=this.ctx,c=o.createBufferSource();c.buffer=this.noiseBuf;let l=o.createBiquadFilter();l.type=r,l.frequency.value=a;let h=o.createGain();h.gain.setValueAtTime(n,t),h.gain.exponentialRampToValueAtTime(1e-4,t+e),c.connect(l),l.connect(h),h.connect(s),c.start(t,Math.random()),c.stop(t+e+.02)}kick(t,e){let n=this.ctx,s=n.createOscillator();s.type="sine",s.frequency.setValueAtTime(165,t),s.frequency.exponentialRampToValueAtTime(48,t+.09);let r=n.createGain();r.gain.setValueAtTime(1e-4,t),r.gain.linearRampToValueAtTime(.55,t+.003),r.gain.exponentialRampToValueAtTime(1e-4,t+.32),s.connect(r),r.connect(e),s.start(t),s.stop(t+.34),this.noise(t,.012,.12,e,"highpass",3e3)}clap(t,e){for(let n of[0,.011,.022])this.noise(t+n,.02,.09,e,"bandpass",1500);this.noise(t+.03,.16,.1,e,"bandpass",1300)}jingle(){let t=this.ctx;if(!t)return;let e=t.currentTime+.05,n=[[72,0],[76,.14],[79,.28],[84,.42],[83,.7],[84,.84]];for(let[s,r]of n)this.bell(s,e+r,.9,.12);for(let s of[60,64,67,72,76])this.bell(s,e+.84,2.2,.05);this.tone(48,e+.84,1.6,"sine",.2,this.music,600)}bell(t,e,n,s){let r=this.ctx,a=440*Math.pow(2,(t-69)/12);for(let[o,c]of[[1,1],[2.01,.35],[3.98,.12]]){let l=r.createOscillator();l.type="sine",l.frequency.value=a*o;let h=r.createGain();h.gain.setValueAtTime(1e-4,e),h.gain.exponentialRampToValueAtTime(s*c,e+.008),h.gain.exponentialRampToValueAtTime(1e-4,e+n),l.connect(h),h.connect(this.music),l.start(e),l.stop(e+n+.05)}}crash(){let t=this.ctx;if(!t)return;let e=t.currentTime;this.noise(e,.5,.6,this.sfx,"lowpass",900),this.noise(e,.25,.3,this.sfx,"bandpass",3e3);let n=t.createOscillator();n.frequency.setValueAtTime(90,e),n.frequency.exponentialRampToValueAtTime(30,e+.3);let s=t.createGain();s.gain.setValueAtTime(.5,e),s.gain.exponentialRampToValueAtTime(1e-4,e+.35),n.connect(s),s.connect(this.sfx),n.start(e),n.stop(e+.4)}horn(t){let e=this.ctx;if(e){if(t&&!this.hornNodes){let n=e.createGain();n.gain.value=1e-4,n.gain.setTargetAtTime(.12,e.currentTime,.02),n.connect(this.sfx);let s=e.createBiquadFilter();s.type="lowpass",s.frequency.value=1800,s.connect(n);let r=[233,277,349].map(a=>{let o=e.createOscillator();return o.type="sawtooth",o.frequency.value=a,o.connect(s),o.start(),o});this.hornNodes={g:n,os:r}}else if(!t&&this.hornNodes){let n=this.hornNodes;this.hornNodes=null,n.g.gain.setTargetAtTime(1e-4,e.currentTime,.04),n.os.forEach(s=>s.stop(e.currentTime+.3))}}}hornNodes=null;hiss(){this.ctx&&this.noise(this.ctx.currentTime,.6,.12,this.sfx,"highpass",3e3)}ding(){if(!this.ctx)return;let t=this.ctx.currentTime;this.bell(84,t,.6,.1),this.bell(91,t+.1,.8,.08)}beep(){if(!this.ctx)return;let t=this.ctx.currentTime;for(let e=0;e<3;e++)this.tone(88,t+e*.22,.12,"square",.05,this.sfx,5e3)}click(){this.ctx&&this.noise(this.ctx.currentTime,.05,.25,this.sfx,"bandpass",2500)}thud(){this.ctx&&this.noise(this.ctx.currentTime,.2,.4,this.sfx,"lowpass",300)}step(){this.ctx&&this.noise(this.ctx.currentTime,.06,.08,this.sfx,"lowpass",600)}bufs=new Map;voiceSrc=null;preload(t){if(!this.ctx||this.bufs.has(t))return this.bufs.get(t)??Promise.resolve(null);let e=this.ctx,n=fetch(t).then(s=>s.ok?s.arrayBuffer():Promise.reject(new Error("missing"))).then(s=>new Promise((r,a)=>e.decodeAudioData(s,r,a))).catch(()=>null);return this.bufs.set(t,n),n}speak(t,e,n,s){if(s&&this.ctx){let r=!1,a=()=>{r||(r=!0,n())},o=900+t.length*62,c=window.setTimeout(()=>{l||(r=!0,this.speakSynth(t,e,n))},1800),l=!1;this.preload(s).then(h=>{if(r)return;if(!h||!this.ctx){window.clearTimeout(c),r=!0,this.speakSynth(t,e,n);return}l=!0,window.clearTimeout(c),this.hush();let f=this.ctx.createBufferSource();f.buffer=h;let u=this.ctx.createGain();u.gain.value=1.15,f.connect(u),u.connect(this.sfx),f.onended=()=>{this.voiceSrc===f&&(this.voiceSrc=null),window.setTimeout(a,120)},f.start(),this.voiceSrc=f,window.setTimeout(a,h.duration*1e3+1500)});return}this.speakSynth(t,e,n)}speakSynth(t,e,n){let s=window.speechSynthesis,r=!1,a=()=>{r||(r=!0,n())},o=900+t.length*62;if(window.setTimeout(a,o+2500),!s||typeof SpeechSynthesisUtterance>"u"){window.setTimeout(a,o);return}try{s.cancel();let c=new SpeechSynthesisUtterance(t),l=this.voices;if(e==="driver")c.pitch=.8,c.rate=.92,c.voice=mf(l,/(daniel|alex|fred|male|guy|david|google uk english male|aaron|arthur)/i,0);else if(e==="system")c.pitch=1.45,c.rate=1.04,c.voice=mf(l,/(samantha|female|zira|google us english|karen|moira|victoria)/i,1);else{let h=[1.15,.95,1.25,1.05,.9,1.2,1.3,.85,1.1,1];c.pitch=h[e%10],c.rate=.98,l.length&&(c.voice=l[(e*3+2)%l.length])}c.volume=1,c.onend=()=>window.setTimeout(a,150),c.onerror=()=>window.setTimeout(a,o),s.speak(c)}catch{window.setTimeout(a,o)}}hush(){try{window.speechSynthesis?.cancel()}catch{}if(this.voiceSrc){try{this.voiceSrc.stop()}catch{}this.voiceSrc=null}}};function mf(i,t,e){return i.find(n=>t.test(n.name))||i[Math.min(e,i.length-1)]||null}var Gl=class{throttle=0;brake=0;steer=0;horn=!1;keys=new Set;pressed=new Set;touchSteer=0;touchGas=!1;touchBrake=!1;touchHorn=!1;touchUI;wheelEl;touchVisible=!1;padPrev=[];kbSteer=0;onAnyPress=null;constructor(t){window.addEventListener("keydown",h=>{["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(h.code)&&h.preventDefault(),this.keys.has(h.code)||this.pressed.add(h.code),this.keys.add(h.code),this.onAnyPress?.()}),window.addEventListener("keyup",h=>this.keys.delete(h.code)),window.addEventListener("blur",()=>this.keys.clear());let e=document.createElement("div");e.id="touch",t.appendChild(e),this.touchUI=e,e.innerHTML=`
      <div class="steer-zone" id="steerZone"><div class="wheel" id="wheel"><div class="spoke"></div><div class="spoke v"></div><div class="hubc"></div></div><div class="steer-hint">\u25C0 drag to steer \u25B6</div></div>
      <div class="pedals"><div class="pedal brake" id="brakeBtn"><span>BRAKE</span><small>hold = reverse</small></div><div class="pedal gas" id="gasBtn"><span>GAS</span></div></div>
      <div class="hornbtn" id="hornBtn">HORN</div>`,this.wheelEl=e.querySelector("#wheel");let n=e.querySelector("#steerZone"),s=-1,r=0;n.addEventListener("pointerdown",h=>{s=h.pointerId,r=h.clientX,n.setPointerCapture(h.pointerId),this.touchSteer=0,h.preventDefault()}),n.addEventListener("pointermove",h=>{if(h.pointerId!==s)return;let f=Math.max(60,n.clientWidth*.42);this.touchSteer=Math.max(-1,Math.min(1,(h.clientX-r)/f))});let a=h=>{h.pointerId===s&&(s=-1,this.touchSteer=0)};n.addEventListener("pointerup",a),n.addEventListener("pointercancel",a);let o=(h,f)=>{let u=e.querySelector(h);u.addEventListener("pointerdown",g=>{f(!0),u.classList.add("on"),u.setPointerCapture(g.pointerId),g.preventDefault()});let m=()=>{f(!1),u.classList.remove("on")};u.addEventListener("pointerup",m),u.addEventListener("pointercancel",m),u.addEventListener("lostpointercapture",m)};o("#gasBtn",h=>this.touchGas=h),o("#brakeBtn",h=>this.touchBrake=h),o("#hornBtn",h=>this.touchHorn=h);let c=matchMedia("(pointer: coarse)").matches,l=matchMedia("(any-pointer: fine)").matches;this.setTouch(navigator.maxTouchPoints>0&&c&&!l),window.addEventListener("pointerdown",h=>{h.pointerType==="touch"||h.pointerType==="pen"?this.setTouch(!0):h.pointerType==="mouse"&&matchMedia("(any-pointer: fine)").matches&&this.setTouch(!1),this.onAnyPress?.()},!0)}setTouch(t){this.touchVisible=t,document.body.classList.toggle("touchmode",t)}down(t){return this.keys.has(t)}hit(...t){let e=!1;for(let n of t)this.pressed.has(n)&&(this.pressed.delete(n),e=!0);return e}clearPressed(){this.pressed.clear()}update(t){let e=(l,h)=>this.keys.has(l)||this.keys.has(h),n=e("KeyW","ArrowUp")?1:0,s=e("KeyS","ArrowDown")?1:0,r=(e("KeyD","ArrowRight")?1:0)-(e("KeyA","ArrowLeft")?1:0);r!==0?this.kbSteer=Math.max(-1,Math.min(1,this.kbSteer+r*t*2.2)):this.kbSteer-=Math.sign(this.kbSteer)*Math.min(Math.abs(this.kbSteer),t*3);let a=this.kbSteer,o=this.keys.has("KeyH"),c=navigator.getGamepads?navigator.getGamepads():[];for(let l of c){if(!l)continue;let h=l.axes[0]||0;Math.abs(h)>.12&&(a=h);let f=l.buttons[7]?.value||0,u=l.buttons[6]?.value||0;n=Math.max(n,f),s=Math.max(s,u),l.buttons[12]?.pressed&&(n=1),l.buttons[13]?.pressed&&(s=1),l.buttons[1]?.pressed&&(o=!0);let m=[[0,"Enter"],[9,"Escape"],[3,"KeyR"],[8,"KeyR"],[2,"KeyX"]];for(let[g,v]of m){let p=!!l.buttons[g]?.pressed;p&&!this.padPrev[g]&&(this.pressed.add(v),this.onAnyPress?.()),this.padPrev[g]=p}break}this.touchGas&&(n=1),this.touchBrake&&(s=1),Math.abs(this.touchSteer)>.02&&(a=this.touchSteer),this.touchHorn&&(o=!0),this.throttle=n,this.brake=s,this.steer=a,this.horn=o,this.wheelEl.style.transform=`rotate(${a*120}deg)`}};var Vl=class{time=0;skipping=!1;waits=[];tweens=[];update(t){this.time+=t;for(let e of this.tweens.slice()){e.t+=t;let n=this.skipping?1:Math.min(1,e.t/e.dur);e.fn(Wv(n)),n>=1&&(this.tweens.splice(this.tweens.indexOf(e),1),e.res())}for(let e of this.waits.slice())(this.skipping||this.time>=e.until)&&(this.waits.splice(this.waits.indexOf(e),1),e.res())}wait(t){return new Promise(e=>{if(this.skipping){e();return}this.waits.push({until:this.time+t,res:e})})}tween(t,e){return new Promise(n=>{if(this.skipping){e(1),n();return}this.tweens.push({t:0,dur:t,fn:e,res:n})})}until(t){return new Promise(e=>{let n=()=>{this.skipping||t()?e():this.waits.push({until:this.time,res:n})};n()})}skip(){this.skipping=!0}reset(){this.skipping=!1}};function Wv(i){return i<.5?2*i*i:1-Math.pow(-2*i+2,2)/2}var kt=(i,t,e)=>i+(t-i)*e;var Me=(i,t=0)=>new Qt({color:i,emissive:t}),Wl=class{scene=new Di;camera=new ze(50,1,.05,50);guy;headset;lamp;fill;lampShade;windowLight;amb;windowMat;clockCtx;clockTex;camTarget=new L(-1.6,.8,-.9);camPos=new L(1.6,1.55,1.7);lyingQ=new Ye().setFromEuler(new Sn(-Math.PI/2,0,0));sitQ=new Ye().setFromEuler(new Sn(0,Math.PI/2,0));nightstandTop=new L(-1.05,.6,-1.7);t=0;constructor(){let t=this.scene;t.background=new wt(724242),this.amb=new ls(12109014,4866102,1.3),t.add(this.amb),this.fill=new Oi(14673650,1),this.fill.position.set(2,2.4,3),t.add(this.fill),this.windowLight=new Oi(12571391,1.2),this.windowLight.position.set(.8,2.2,-4),t.add(this.windowLight),this.lamp=new Jr(16761466,6,6,1.6),this.lamp.position.set(-1,1.1,-1.7),t.add(this.lamp);let e=new st(new ce(5,4),Me(5916214));e.rotation.x=-Math.PI/2,t.add(e);let n=Me(9341564),s=Me(8223084),r=new st(new ce(5,2.7),n);r.position.set(0,1.35,-2),t.add(r);let a=new st(new ce(4,2.7),s);a.rotation.y=Math.PI/2,a.position.set(-2.5,1.35,0),t.add(a);let o=new st(new ce(5,4),Me(7170658));o.rotation.x=Math.PI/2,o.position.y=2.7,t.add(o);let c=new st(new Wr(.35,12),Me(7301722));c.position.set(1.6,2.3,-1.99),t.add(c);let l=new st(new ce(.55,.75),new Qt({map:gf(256,352,P=>{P.fillStyle="#28324a",P.fillRect(0,0,256,352),P.fillStyle="#e8d8a8",P.font="bold 34px Arial",P.textAlign="center",P.fillText("PARADISE",128,70),P.fillText("ISLAND",128,110),P.fillStyle="#e09a4a",P.beginPath(),P.arc(128,220,60,0,Math.PI*2),P.fill(),P.fillStyle="#3a8a8a",P.fillRect(0,260,256,92),P.fillStyle="#ffffff",P.font="16px Arial",P.fillText("someday",128,330)})}));l.position.set(-2.49,1.6,.6),l.rotation.y=Math.PI/2,l.rotation.z=.04,t.add(l);let h=new st(new ce(.4,.5),new Qt({map:gf(200,250,P=>{P.fillStyle="#f2efe6",P.fillRect(0,0,200,250),P.fillStyle="#b03030",P.fillRect(0,0,200,46),P.fillStyle="#fff",P.font="bold 24px Arial",P.textAlign="center",P.fillText("NOVEMBER",100,32),P.fillStyle="#333",P.font="14px Arial";for(let H=0;H<30;H++)P.fillText(String(H+1),22+H%7*26,72+Math.floor(H/7)*34);P.strokeStyle="#d02020",P.lineWidth=3,P.beginPath(),P.arc(126,208,16,0,Math.PI*2),P.stroke(),P.fillStyle="#d02020",P.font="bold 16px Arial",P.fillText("RENT $1500",100,244)})}));h.position.set(0,1.55,-1.99),t.add(h),this.windowMat=new re({color:10335448});let f=new st(new ce(1.1,1.1),this.windowMat);f.position.set(1.1,1.55,-1.98),t.add(f);for(let P=0;P<9;P++){let H=new st(new gt(1.14,.03,.04),Me(14210248));H.position.set(1.1,1.1+P*.11,-1.95),H.rotation.x=.6,t.add(H)}let u=new st(new gt(1.25,.06,.1),Me(13617856));u.position.set(1.1,.98,-1.95),t.add(u);let m=new st(new gt(1,.3,2),Me(4864556));m.position.set(-1.9,.15,-.9),t.add(m);let g=new st(new gt(.95,.22,1.95),Me(14211280));g.position.set(-1.9,.41,-.9),t.add(g);let v=new st(new gt(.98,.06,1.2),Me(5925514));v.position.set(-1.9,.53,-.4),t.add(v);let p=new st(new gt(.6,.12,.35),Me(15658734));p.position.set(-1.9,.57,-1.7),t.add(p);let d=new st(new gt(.45,.58,.4),Me(6244920));d.position.set(-1.05,.29,-1.7),t.add(d);let b=new st(new Ne(.05,.07,.3,8),Me(3355443));b.position.set(-.95,.73,-1.8),t.add(b),this.lampShade=new st(new Ne(.09,.15,.16,12,1,!0),Me(15786176,16756832)),this.lampShade.position.set(-.95,.92,-1.8),t.add(this.lampShade);let M=document.createElement("canvas");M.width=128,M.height=64,this.clockCtx=M.getContext("2d"),this.clockTex=new Xe(M);let y=new st(new gt(.16,.08,.07),[Me(1118481),Me(1118481),Me(1118481),Me(1118481),new re({map:this.clockTex}),Me(1118481)]);y.position.set(-1.15,.63,-1.6),y.rotation.y=.6,t.add(y);let w=new st(new gt(1.2,.05,.6),Me(7035464));w.position.set(1.7,.75,-1.6),t.add(w);for(let P of[1.15,2.25]){let H=new st(new gt(.05,.75,.55),Me(4930092));H.position.set(P,.375,-1.6),t.add(H)}let T=new st(new gt(.5,.35,.08),Me(1710618));T.position.set(1.7,1,-1.75),t.add(T);let R=new st(new gt(.3,.02,.22),Me(16052448));R.position.set(1.35,.79,-1.45),R.rotation.y=.3,t.add(R);let x=new st(new Ne(.04,.04,.1,8),Me(11549242));x.position.set(2.05,.82,-1.45),t.add(x);for(let P=0;P<5;P++){let H=new st(new gt(.4-P*.05,.08,.3),Me([4478310,9071178,3355443,6965866,5601109][P]));H.position.set(1.5+P*.03,.04+P*.07,.9),H.rotation.y=P*.7,t.add(H)}let E=new st(new gt(.45,.05,.45),Me(7829367));E.position.set(1.6,.45,-1),t.add(E),this.guy=new ps({skin:14264190,shirt:6053990,pants:3028032,hair:2759956,shoes:3815994}),t.add(this.guy.root),this.headset=new ee;let A=new st(new gt(.26,.12,.14),Me(1776930));this.headset.add(A);let I=new st(new gt(.22,.05,.02),new re({color:6288127}));I.position.set(0,0,.075),this.headset.add(I);let D=new st(new xi(.135,.015,4,16,Math.PI),Me(2236962));D.rotation.x=Math.PI/2,D.rotation.z=Math.PI,D.position.z=-0,this.headset.add(D),t.add(this.headset)}setTime(t,e,n){this.windowMat.color.setHex(t?1712696:10335448),this.windowLight.intensity=t?.15:1.1,this.amb.intensity=t?e?.45:.1:1.3,this.fill.intensity=t?e?.25:.05:1,this.lamp.intensity=e?6:0,this.lampShade.material.emissive.setHex(e?16756832:0);let s=this.clockCtx;s.fillStyle="#050505",s.fillRect(0,0,128,64),s.fillStyle="#ff3030",s.font="bold 40px monospace",s.textAlign="center",s.textBaseline="middle",s.fillText(n,64,34),this.clockTex.needsUpdate=!0}pose(t){let e=this.guy;e.resetPose(),e.root.quaternion.slerpQuaternions(this.lyingQ,this.sitQ,t),e.root.position.set(kt(-1.9,-1.6,t),kt(.64,-.4,t),kt(.08,-.85,t)),e.legL.rotation.x=e.legR.rotation.x=kt(0,-Math.PI/2,t),e.shinL.rotation.x=e.shinR.rotation.x=kt(0,Math.PI/2,t),e.armL.rotation.z=kt(.12,.1,t),e.armR.rotation.z=-.12,e.spine.rotation.x=kt(0,.18,t)}headsetAt(t,e=1,n){let s=new L,r=new Ye;t==="stand"?(s.copy(this.nightstandTop).add(new L(.05,.06,.12)),r.setFromEuler(new Sn(0,.4,0))):t==="head"?(this.guy.root.updateMatrixWorld(!0),this.guy.head.localToWorld(s.set(0,.13,.09)),this.guy.head.getWorldQuaternion(r)):(this.guy.root.updateMatrixWorld(!0),this.guy.handL.getWorldPosition(s),this.guy.head.getWorldQuaternion(r)),n&&s.lerpVectors(n,s,e),this.headset.position.copy(s),this.headset.quaternion.copy(r)}update(t,e){this.t+=t,this.guy.update(t);let n=e<1;this.camera.aspect=e,this.camera.fov=n?62:46;let s=n?new L(1.2,1.7,2.6):this.camPos;this.camera.position.set(s.x+Math.sin(this.t*.2)*.04,s.y+Math.sin(this.t*.31)*.02,s.z),this.camera.lookAt(this.camTarget),this.camera.updateProjectionMatrix()}async morning(t,e,n,s,r){this.setTime(!1,!1,["6:47","6:52","6:45","6:58","6:41","6:50","6:47","6:44","6:49","6:46"][e-1]||"6:47"),this.pose(0),this.guy.setExpr("closed"),this.headsetAt("stand"),this.camTarget.set(-1.7,.7,-.9),r(`DAY ${e}`),await t.wait(.6),s.beep(),await t.wait(1),this.guy.setExpr("tired"),await t.wait(.6),await t.tween(1.8,o=>{this.pose(o),this.camTarget.set(-1.7,kt(.7,1.1,o),-.9)}),await t.wait(.5),e===1?(this.guy.setExpr("sad"),await n("D","Oh, man. I'm short on rent.",this.guy),await t.wait(.4),await n("D","I need to go to work.",this.guy)):await t.wait(1),this.guy.setExpr("neutral"),await t.tween(.9,o=>{this.pose(1),this.guy.armL.rotation.x=kt(0,-.9,o),this.guy.armL.rotation.z=kt(.1,.9,o),this.guy.spine.rotation.y=kt(0,.4,o)});let a=this.headset.position.clone();await t.tween(.5,o=>{this.pose(1),this.guy.armL.rotation.set(-.9,0,.9),this.guy.spine.rotation.y=.4,this.headsetAt("handL",o,a)}),s.click(),await t.tween(1.1,o=>{this.pose(1),this.guy.spine.rotation.y=kt(.4,0,o),this.guy.armL.rotation.set(kt(-.9,-2.5,o),0,kt(.9,.3,o)),this.guy.foreL.rotation.x=kt(0,-1.2,o),this.guy.armR.rotation.set(kt(0,-2.5,o),0,kt(-.1,-.3,o)),this.guy.foreR.rotation.x=kt(0,-1.2,o),this.headsetAt("handL");let c=this.headset.position.clone();this.headsetAt("head",o,c)}),this.headsetAt("head"),await t.tween(.6,o=>{this.camTarget.set(kt(-1.7,-1.6,o),kt(1.1,1.45,o),-.85)}),await t.wait(.3)}async night(t,e,n,s,r=""){this.setTime(!0,!0,e?"11:58":["10:41","11:05","10:52","11:30","10:12","11:21","11:47","10:33","11:15"][Math.floor(Math.random()*9)]),this.pose(1),this.guy.setExpr("tired"),this.headsetAt("head"),this.camTarget.set(-1.6,1.3,-.85),await t.wait(.8),await t.tween(1,c=>{this.pose(1),this.guy.armL.rotation.set(kt(0,-2.5,c),0,.3),this.guy.foreL.rotation.x=kt(0,-1.2,c),this.guy.armR.rotation.set(kt(0,-2.5,c),0,-.3),this.guy.foreR.rotation.x=kt(0,-1.2,c),this.headsetAt("head")});let a=this.headset.position.clone();await t.tween(1,c=>{this.pose(1),this.guy.armL.rotation.set(kt(-2.5,-.9,c),0,kt(.3,.9,c)),this.guy.foreL.rotation.x=kt(-1.2,0,c),this.guy.armR.rotation.set(kt(-2.5,0,c),0,-.1),this.guy.foreR.rotation.x=kt(-1.2,0,c),this.guy.spine.rotation.y=kt(0,.4,c),this.headsetAt("handL");let l=this.headset.position.clone();this.headset.position.lerpVectors(a,l,c)});let o=this.headset.position.clone();await t.tween(.5,c=>{this.pose(1),this.guy.armL.rotation.set(-.9,0,.9),this.guy.spine.rotation.y=.4,this.headsetAt("stand",c,o)}),s.click(),await t.tween(.6,c=>{this.pose(1),this.guy.armL.rotation.set(kt(-.9,0,c),0,kt(.9,.1,c)),this.guy.spine.rotation.y=kt(.4,0,c)}),e?(n("MetaShift Payout","Earnings transferred. Rent: covered."),await t.wait(3.2)):(r&&n("MetaShift Pay",r),await t.wait(2.2)),await t.tween(.6,c=>{this.pose(1),this.guy.armL.rotation.set(kt(0,-.9,c),0,kt(.1,.9,c)),this.guy.spine.rotation.y=kt(0,.5,c)}),s.click(),this.setTime(!0,!1,"11:59"),await t.tween(.5,c=>{this.pose(1),this.guy.armL.rotation.set(kt(-.9,0,c),0,kt(.9,.1,c)),this.guy.spine.rotation.y=kt(.5,0,c)}),await t.tween(1.8,c=>{this.pose(1-c),this.camTarget.set(-1.7,kt(1.3,.7,c),-.9)}),this.guy.setExpr("closed"),await t.wait(e?3:1.6)}};function gf(i,t,e){let n=document.createElement("canvas");n.width=i,n.height=t,e(n.getContext("2d"));let s=new Xe(n);return s.colorSpace=Re,s}var _i=[{day:1,store:"grocery",title:"Neighborhood Grocery",challenge:"Easy streets, gentle turns, light traffic.",dc:0,traffic:8,trafficSpeed:9,weather:"clear",fuel:.9,fuelStop:!1,construction:0,pace:5.5,empName:"Greeter_0148",employee:{skin:14724201,shirt:4177770,pants:2764602,hair:3877402,hat:"cap",hatColor:4177770,name:"Greeter_0148 \xB7 FreshLoop",nameColor:"#6dffb6"},lines:[{who:"D",text:"Hey. I've got your grocery delivery.",dface:"neutral"},{who:"E",text:"Finally. The other driver overslept and didn't log into MetaShift this morning.",face:"annoyed"},{who:"D",text:"Yeah, that'll happen.",dface:"tired"},{who:"E",text:"We've had players complaining about the empty shelves all day.",face:"neutral",pause:.6},{who:"E",text:"Funny thing is, I've still gotta go grocery shopping myself when I take this headset off.",face:"tired"},{who:"D",text:"Well, at least somebody's getting groceries today.",dface:"smile"}]},{day:2,store:"electronics",title:"Electronics Store",challenge:"Busier intersections and tighter turns.",dc:0,traffic:16,trafficSpeed:10,weather:"clear",fuel:.85,fuelStop:!1,construction:0,pace:6,empName:"Cashier_3307",employee:{skin:13010498,shirt:4164863,pants:1776932,hair:1118481,hat:"visor",hatColor:6288127,name:"Cashier_3307 \xB7 Voltage",nameColor:"#5ff2ff"},lines:[{who:"D",text:"Got a trailer full of electronics for you."},{who:"E",text:"Perfect. There's a new virtual headset going on sale tomorrow. Players have been asking about it all week.",face:"smile"},{who:"D",text:"People buy VR headsets inside MetaShift?",dface:"surprised"},{who:"E",text:"Yeah. Apparently, there's another game you can play inside this one.",face:"neutral"},{who:"D",text:"You're kidding.",dface:"surprised"},{who:"E",text:"Nope.",face:"neutral",pause:.7},{who:"E",text:"Anyway, I need the overtime. My actual headset's starting to fall apart.",face:"tired"}]},{day:3,store:"clothing",title:"Clothing Store",challenge:"Urban streets and a narrow delivery alley.",dc:1,traffic:16,trafficSpeed:10,weather:"clear",fuel:.85,fuelStop:!1,construction:0,pace:6,empName:"Stockroom_Mira",employee:{skin:16767916,shirt:14045136,pants:2236996,hair:11553322,longHair:!0,hat:"ears",hatColor:16743129,jacket:8006282,name:"Stockroom_Mira \xB7 Threadline",nameColor:"#ff7ad9"},lines:[{who:"D",text:"Where do you want the clothing shipment?"},{who:"E",text:"Around back. We've got a big sale happening tonight.",face:"neutral"},{who:"D",text:"Keeping you busy?"},{who:"E",text:"Too busy. Some player spent more on a virtual jacket yesterday than I made working all week.",face:"annoyed"},{who:"D",text:"Must be nice.",dface:"tired"},{who:"E",text:"Yeah.",face:"sad",pause:.8},{who:"E",text:"I'm saving up to buy my daughter a real winter coat.",face:"sad"}]},{day:4,store:"restaurant",title:"Restaurant",challenge:"Heavier traffic and a tight schedule.",dc:2,traffic:26,trafficSpeed:11,weather:"clear",fuel:.8,fuelStop:!1,construction:0,pace:7.5,empName:"LineCook_Dev",employee:{skin:9262372,shirt:15921906,pants:2763306,hair:1118481,hat:"crown",name:"LineCook_Dev \xB7 Byte's Diner",nameColor:"#ffb347"},lines:[{who:"D",text:"I've got your food delivery."},{who:"E",text:"Thank goodness. We were about to run out of ingredients.",face:"surprised"},{who:"D",text:"Busy lunch?"},{who:"E",text:"Packed. I've been serving virtual meals for six hours, and I haven't eaten anything in real life.",face:"tired"},{who:"D",text:"You should probably take a break.",dface:"sad"},{who:"E",text:"After the lunch rush. I can't afford to clock out yet.",face:"tired"}]},{day:5,store:"furniture",title:"Furniture Store",challenge:"A long haul. Low fuel: refuel on the way.",dc:2,traffic:16,trafficSpeed:11,weather:"clear",fuel:.16,fuelStop:!0,construction:0,pace:7,empName:"Showroom_Pat",employee:{skin:15843965,shirt:13214554,pants:3813926,hair:10132122,hat:"halo",hatColor:16769126,name:"Showroom_Pat \xB7 Nestwell",nameColor:"#ffe066"},lines:[{who:"D",text:"Furniture delivery."},{who:"E",text:"Great. A bunch of players bought new apartments this week.",face:"smile"},{who:"D",text:"Business must be good."},{who:"E",text:"For the company, sure. I spent yesterday arranging furniture in a virtual mansion.",face:"neutral"},{who:"D",text:"Sounds relaxing.",dface:"smile"},{who:"E",text:"Then I took my headset off and sat down on a folding chair in my apartment.",face:"tired",pause:.7},{who:"E",text:"Couldn't afford a couch.",face:"sad"}]},{day:6,store:"pharmacy",title:"Pharmacy",challenge:"Rain: poor visibility and longer braking.",dc:1,traffic:18,trafficSpeed:9,weather:"rain",fuel:.8,fuelStop:!1,construction:0,pace:6.5,empName:"Pharm_Tech_Yun",employee:{skin:16767916,shirt:5232328,pants:2767418,hair:1710618,hat:"antenna",hatColor:7208886,name:"Pharm_Tech_Yun \xB7 PixelCare",nameColor:"#4fd6c8"},lines:[{who:"D",text:"Sorry about the weather. I've got your shipment."},{who:"E",text:"No problem. At least we're not actually getting wet.",face:"smile"},{who:"D",text:"There's that."},{who:"E",text:"My headset battery died halfway through my shift yesterday. The system marked me absent.",face:"annoyed"},{who:"D",text:"Did they fix your pay?",dface:"surprised"},{who:"E",text:"No. They said maintaining my equipment was my responsibility.",face:"sad"},{who:"D",text:"Figures.",dface:"tired"}]},{day:7,store:"convenience",title:"Convenience Store",challenge:"Night driving on congested streets.",dc:1,traffic:28,trafficSpeed:10,weather:"night",fuel:.75,fuelStop:!1,construction:0,pace:6.5,empName:"NightClerk_Jo",employee:{skin:14724201,shirt:16765503,pants:1710634,hair:2759184,hat:"beanie",hatColor:4164863,build:.9,name:"NightClerk_Jo \xB7 QuikLog",nameColor:"#ffd23f"},lines:[{who:"D",text:"Late-night delivery."},{who:"E",text:"You're not the only one working late.",face:"tired"},{who:"D",text:"How long have you been on?"},{who:"E",text:"Since I got home from school. I've still got homework to finish after this.",face:"tired"},{who:"D",text:"Long day.",dface:"sad"},{who:"E",text:"Yeah.",face:"neutral",pause:.8},{who:"E",text:"My friends log into MetaShift to hang out. I log in to pay for college.",face:"sad"}]},{day:8,store:"hardware",title:"Hardware Store",challenge:"Road construction, detours and tricky turns.",dc:0,traffic:20,trafficSpeed:10,weather:"clear",fuel:.8,fuelStop:!1,construction:3,pace:7,empName:"Builder_6604",employee:{skin:13010498,shirt:16747066,pants:2767450,hair:1118481,hat:"cap",hatColor:16765503,jacket:16747066,name:"Builder_6604 \xB7 Blocksmith",nameColor:"#ff8a3a"},lines:[{who:"D",text:"Got your hardware shipment."},{who:"E",text:"Good. They're building another residential district. Everybody's buying supplies.",face:"neutral"},{who:"D",text:"More players moving in?"},{who:"E",text:"Apparently. My landlord raised my real rent last month, though.",face:"annoyed"},{who:"D",text:"Mine too.",dface:"tired"},{who:"E",text:"Sometimes I think I spend more time living in here than in my actual apartment.",face:"sad"}]},{day:9,store:"department",title:"Department Store",challenge:"Heavy traffic. Back the trailer into the dock.",dc:1,traffic:34,trafficSpeed:10,weather:"clear",fuel:.8,fuelStop:!1,construction:0,pace:7.5,empName:"Associate_Rae",employee:{skin:9262372,shirt:10976255,pants:1710618,hair:1706506,longHair:!0,hat:"halo",hatColor:13084415,name:"Associate_Rae \xB7 Grandview",nameColor:"#c7a6ff"},lines:[{who:"D",text:"Delivery for the department store."},{who:"E",text:"Thanks. Management's been watching our performance scores all week.",face:"neutral"},{who:"D",text:"They've been doing that to us drivers too.",dface:"tired"},{who:"E",text:"A customer reported me yesterday because I didn't smile enough.",face:"annoyed"},{who:"D",text:"Seriously?",dface:"surprised"},{who:"E",text:"Yeah. I was having a bad day in real life.",face:"sad",pause:.7},{who:"E",text:"Apparently, that's not supposed to affect my avatar.",face:"smile"}]},{day:10,store:"supermarket",title:"Supermarket",challenge:"The longest route: dusk rain, detours, low fuel, heavy traffic.",dc:0,traffic:30,trafficSpeed:10,weather:"dusk",fuel:.2,fuelStop:!0,construction:2,pace:7.5,empName:"Receiving_Sam",employee:{skin:15843965,shirt:16732013,pants:2763322,hair:6965802,hat:"none",name:"Receiving_Sam \xB7 MegaMart",nameColor:"#ff7a8a"},lines:[{who:"D",text:"Last delivery."},{who:"E",text:"Last one for today?",face:"neutral"},{who:"D",text:"Yeah. Finally made enough to cover my rent.",dface:"smile"},{who:"E",text:"That's good. You taking tomorrow off?",face:"smile"},{who:"D",text:"Probably not. Electricity bill's coming up.",dface:"tired"},{who:"E",text:"Yeah. I know how that goes.",face:"tired",pause:2.2},{who:"E",text:"See you around.",face:"neutral"},{who:"D",text:"See you.",dface:"neutral"}]}];var nc=window,or=()=>nc.Tesana;async function Ta(){try{return await Promise.race([nc.__TESANA_READY__??Promise.resolve(nc.Tesana),new Promise(i=>setTimeout(()=>i(null),3e3))])}catch{return null}}var va=document.getElementById("ui");va.innerHTML=`
<div id="hud" class="hidden">
  <div id="gps" class="card"><canvas id="mini" width="184" height="184"></canvas><div id="gpsText"><div id="gpsTitle">METASHIFT GPS</div><div id="gpsArrow"></div><div id="gpsInstr">\u2014</div><div id="gpsDist"></div></div></div>
  <div id="clock" class="card"><div id="pauseBtn">II</div><div><div id="clockDay">DAY 1</div><div id="clockTime">0:00</div><div id="clockStore"></div><div id="clockPen"></div></div></div>
  <div id="toasts"></div>
  <div id="status" class="hidden"></div>
  <div id="hint" class="hidden"></div>
  <div id="dashInfo" class="card"><div><div id="spd">0</div><div id="spdU">KM/H</div></div><div id="gear">D</div><div id="fuelBox"><div id="fuelLbl">FUEL</div><div id="fuelBar"><div id="fuelFill"></div></div></div><div id="radioBtn" class="mini card on">\u266A<span>RADIO</span></div></div>
</div>
<div id="sub" class="hidden"><div class="who"></div><div class="line"></div></div>
<div id="daycard" class="hidden"></div>
<div id="note" class="hidden"><div class="ic">M</div><div><b></b><span></span></div></div>
<div id="loading" class="hidden"><div class="logo">META<i>SHIFT</i></div><div class="tag">Your income stream.</div><div id="loadBar"><div id="loadFill"></div></div><div id="loadMsg"></div><div class="legal">\xA9 MetaShift Workforce Platform \xB7 Worker ID 4471 \xB7 Shift data is monitored for quality</div></div>
<div id="finalCard" class="hidden"><div class="logo">META<i>SHIFT</i></div><div class="tag">Your income stream.</div></div>
<div id="title" class="hidden">
  <div class="top"><div class="cab">THE DARKNET DISTRICT \xB7 ARCADE</div><div class="logo">META<i>SHIFT</i></div><div class="tag">Your income stream.</div></div>
  <div id="attract"></div>
  <div id="titleBtns"><button class="btn" id="startBtn">START SHIFT</button><button class="btn alt hidden" id="contBtn">CONTINUE</button><button class="btn alt" id="badgeBtn">BADGES</button><div class="blink">INSERT COIN \xB7 TAP TO START</div></div>
</div>
<div id="summary" class="panel hidden"></div>
<div id="results" class="panel hidden"></div>
<div id="pause" class="panel hidden"><h2>PAUSED</h2><h1>Shift on hold</h1>
  <button class="btn" id="resumeBtn">RESUME</button><button class="btn alt" id="restartBtn">RESTART THIS DAY</button><button class="btn alt" id="radioBtn2">RADIO: ON</button><button class="btn alt" id="badgeBtn2">BADGES</button><button class="btn alt" id="quitBtn">QUIT TO TITLE</button>
  <div class="small">Keyboard: W/S or \u2191/\u2193 gas & brake (hold brake to reverse) \xB7 A/D or \u2190/\u2192 steer \xB7 H horn \xB7 R radio \xB7 Esc pause<br>Controller: RT gas \xB7 LT brake/reverse \xB7 stick steer \xB7 B horn \xB7 Y radio \xB7 Start pause</div></div>
<div id="badges" class="panel hidden"><h2>BADGES</h2><h1>Worker achievements</h1><div id="badgeList"><div class="small">Loading\u2026</div></div><button class="btn" id="badgeClose">CLOSE</button></div>
<div id="skip" class="hidden">SKIP \xBB</div>
<div id="fade"></div>`;var At=i=>document.getElementById(i),de=(i,t)=>At(i).classList.toggle("hidden",!t),er=document.getElementById("game"),Dn=null,_a=1,ya=1,zh=Math.min(window.devicePixelRatio||1,1.5),an=new Di,Ie=new ze(70,1,.1,1500),wf=new ls(13624319,4868672,1);an.add(wf);var ic=new Oi(16773597,1.6);ic.position.set(300,500,150);an.add(ic);an.fog=new Dr(12111840,80,380);var Xv=new sn(1300,16,10),Wh=new tn({uniforms:{top:{value:new wt(6134752)},bot:{value:new wt(13624050)}},vertexShader:"varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",fragmentShader:"uniform vec3 top; uniform vec3 bot; varying float vY; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(-0.05, 0.5, vY)), 1.0); }",side:rn,depthWrite:!1,fog:!1}),nu=new st(Xv,Wh);nu.renderOrder=-1;an.add(nu);var Jt=new Bl;an.add(Jt.group);var Tf=Jt.solids.length,dt=new Ol;an.add(dt.tractor,dt.trailer);var ri=new zl(Jt,an),rr=new kl(Jt,an),Ot=new Hl,en=new Gl(va),he=new Vl,ba=new Wl,Xl=1400,$l=new ye;{let i=new Float32Array(Xl*2*3),t=new Float32Array(Xl*2),e=new Float32Array(Xl*2*3);for(let n=0;n<Xl;n++){let s=Math.random(),r=Math.random(),a=Math.random();for(let o=0;o<2;o++)i.set([s,r,a],(n*2+o)*3),t[n*2+o]=o}$l.setAttribute("position",new We(e,3)),$l.setAttribute("aSeed",new We(i,3)),$l.setAttribute("aEnd",new We(t,1))}var Xh=new tn({uniforms:{uTime:{value:0},uCam:{value:new L}},vertexShader:`attribute vec3 aSeed; attribute float aEnd; uniform float uTime; uniform vec3 uCam;
    void main(){ vec3 b = aSeed * vec3(50.0, 26.0, 50.0); float y = mod(b.y - uTime*22.0, 26.0) - 8.0;
      vec3 p = vec3(mod(b.x - uCam.x, 50.0) - 25.0 + uCam.x + aEnd*0.15, y + uCam.y - aEnd*0.8, mod(b.z - uCam.z, 50.0) - 25.0 + uCam.z);
      gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,fragmentShader:"void main(){ gl_FragColor = vec4(0.75,0.8,0.9,0.45); }",transparent:!0,depthWrite:!1}),uc=new kr($l,Xh);uc.frustumCulled=!1;uc.visible=!1;an.add(uc);var dc=document.createElement("canvas");dc.width=64;dc.height=64;{let i=dc.getContext("2d");i.clearRect(0,0,64,64),i.strokeStyle="#5ff2ff",i.lineWidth=10,i.lineCap="round",i.beginPath(),i.moveTo(14,12),i.moveTo(12,14),i.lineTo(32,46),i.lineTo(52,14),i.stroke()}var sc=new Xe(dc);sc.wrapS=sc.wrapT=Li;var qv=new re({map:sc,transparent:!0,opacity:.95,depthWrite:!1,fog:!1}),lr=new st(new ye,qv);lr.frustumCulled=!1;an.add(lr);var Ea=new ee;an.add(Ea);var ar=new ee;an.add(ar);var iu=[new hn(128,200),new hn(128,200)],qh=[new ze(32,.62,.5,260),new ze(32,.62,.5,260)],Yh=new Di,nr=new Bi(0,1,0,-1,-10,10),Zh=[],$h=[];for(let i=0;i<2;i++){let t=new st(new ce(1,1),new re({color:1382428}));t.position.z=-1,Yh.add(t),$h.push(t);let e=new st(new ce(1,1),new re({map:iu[i].texture,side:Ze}));Yh.add(e),Zh.push(e)}var kh=[{x:0,y:0,w:1,h:1},{x:0,y:0,w:1,h:1}],te="boot",Ma=!1,rc=0,ue=_i[0],gn=Jt.stores[ue.store],Jh=null,gs=!1,ms=!1,qi=0,Sa=0,Yi=0,Zi=0,fc=120,ir=0,Af=0,Jl=0,ma=0,Kl=!1,Kh=-1,Rf=1,jh=!1,jl=!1,ac=null,sr=0,Ql=0,ga=0,tc=8,yi=[],Qh=0,ec=0,xa=0,tu=!1,Cf=0,su="metashift_run_v1";function Ji(){return{saveVersion:1,day:0,times:[],pens:[],earned:0,collisions:0,violations:0}}var Ke=Ji();function pc(){try{let i=localStorage.getItem(su);if(!i)return null;let t=JSON.parse(i),e=Ji();for(let s of Object.keys(e)){let r=t[s];(Array.isArray(e[s])?Array.isArray(r):typeof r==typeof e[s])&&(e[s]=r)}let n=e;return n.times=n.times.filter(s=>typeof s=="number"),n.pens=n.pens.filter(s=>typeof s=="number"),n.day<=0||n.day>=_i.length||n.times.length!==n.day?null:n}catch{return null}}function Yv(){try{localStorage.setItem(su,JSON.stringify(Ke))}catch{}}function If(){try{localStorage.removeItem(su)}catch{}}var cr=i=>{let t=i<0;i=Math.abs(i);let e=Math.floor(i/60),n=i-e*60;return(t?"-":"")+e+":"+(n<10?"0":"")+n.toFixed(1)},eu=i=>(i=Math.max(0,Math.ceil(i)),Math.floor(i/60)+":"+String(i%60).padStart(2,"0")),oc=i=>"$"+Math.round(i).toLocaleString("en-US");function xs(i,t=""){let e=document.createElement("div");e.className="toast "+t,e.textContent=i,At("toasts").prepend(e);let n=At("toasts");for(;n.children.length>3;)n.lastChild.remove();setTimeout(()=>e.remove(),4200)}function ru(i){let t=At("status");i?(t.classList.remove("hidden"),t.textContent!==i&&(t.textContent=i)):t.classList.add("hidden")}function hr(i,t=""){if(!i){de("sub",!1);return}de("sub",!0),At("sub").querySelector(".who").textContent=i,At("sub").querySelector(".line").textContent=t}function Zv(i,t){let e=At("note");e.querySelector("b").textContent=i,e.querySelector("span").textContent=t,de("note",!0),Ot.ding(),setTimeout(()=>de("note",!1),3600)}function Ln(i){At("fade").style.opacity=String(i)}function Hh(i,t,e,n){let s=i.rect;return t>s.x0-n&&t<s.x1+n&&e>s.z0-n&&e<s.z1+n}function wa(i,t,e,n){let[s,r,a]=Jt.nearestEdge(i,t),o=mn(s),c=mn(r),l=(c.x-o.x)/St,h=(c.z-o.z)/St,f=Math.cos(e)*l+Math.sin(e)*h>0,u=Jt.blocked,m=js(s,r),g=js(r,s),v=[{node:r,dir:m,cost:(1-a)*St+(f?0:160)},{node:s,dir:g,cost:a*St+(f?160:0)}],p=new Set(u);p.add(Tn(s,r));let{dist:d,prev:b}=Jt.routeStates(v,p),[M,y]=n.edge,w=mn(M),T=mn(y),R=Math.hypot(w.x-n.entry.x,w.z-n.entry.z),x=Math.hypot(T.x-n.entry.x,T.z-n.entry.z),E=1/0,A=-1;for(let[Z,et,rt]of[[M,R,js(M,y)],[y,x,js(y,M)]])for(let it=0;it<4;it++){if((rt^1)===it)continue;let at=d[Z*4+it]+et+(it!==rt?14:0);at<E&&(E=at,A=Z*4+it)}let I=[];if(Tn(s,r)===Tn(M,y)){let Z=(n.entry.x-o.x)*l+(n.entry.z-o.z)*h,et=a*St;(f?Z>et+2:Z<et-2)&&(E=Math.abs(Z-et),A=-1)}if(A>=0){let Z=A;for(;Z>=0;)I.unshift(Z>>2),Z=b[Z]}isFinite(E)||(E=9999);let P=[{x:i,z:t}];for(let Z of I)P.push(mn(Z));P.push({x:n.entry.x,z:n.entry.z}),P.push({x:n.entry.x+n.inward.x*(n.kind==="curb"||n.kind==="fuel"?3.5:14),z:n.entry.z+n.inward.z*(n.kind==="curb"||n.kind==="fuel"?3.5:14)});let H="straight",z="Continue",W=0,q=!1;for(let Z=1;Z<P.length-2&&!q;Z++){let et=P[Z-1],rt=P[Z],it=P[Z+1];W+=Math.hypot(rt.x-et.x,rt.z-et.z);let at=rt.x-et.x,Ht=rt.z-et.z,Gt=it.x-rt.x,Vt=it.z-rt.z,K=Math.hypot(at,Ht)||1,U=Math.hypot(Gt,Vt)||1,k=(at*Vt-Ht*Gt)/(K*U),tt=(at*Gt+Ht*Vt)/(K*U);Z===1&&K<2||(tt<-.5?(H="uturn",z="Make a U-turn",q=!0):k>.5?(H="right",z="Turn right",q=!0):k<-.5&&(H="left",z="Turn left",q=!0))}if(!q){W=0;for(let Gt=1;Gt<P.length-1;Gt++)W+=Math.hypot(P[Gt].x-P[Gt-1].x,P[Gt].z-P[Gt-1].z);let Z=P.length,et=P[Z-2].x-P[Z-3].x,it=-(P[Z-2].z-P[Z-3].z),at=et,Ht=it*n.inward.x+at*n.inward.z>0;H=Ht?"destR":"destL",z=(n.kind==="fuel"?"Fuel station":"Destination")+(Ht?" on the right":" on the left")}return{pts:P,len:E,arrow:H,instr:z,dist:W}}var xf={straight:"M12 21V4M5 11l7-7 7 7",right:"M6 21v-8a4 4 0 0 1 4-4h10M15 4l5 5-5 5",left:"M18 21v-8a4 4 0 0 0-4-4H4M9 4L4 9l5 5",uturn:"M7 21V10a5 5 0 0 1 10 0v6M13 12l4 4 4-4",destR:"M5 21V5h9M10 1l4 4-4 4M17 13a3 3 0 1 0 0.01 0",destL:"M19 21V5h-9M14 1l-4 4 4 4M7 13a3 3 0 1 0 0.01 0"};function $v(i){return`<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#5ff2ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${xf[i]||xf.straight}"/></svg>`}var An=null;function Jv(i){let t=[],e=[],n=[],s=[];for(let o=0;o<i.length;o++){let c=i[Math.max(0,o-1)],l=i[Math.min(i.length-1,o+1)],h=l.x-c.x,f=l.z-c.z,u=Math.hypot(h,f)||1;h/=u,f/=u;let m=o===0||o>=i.length-2?0:pn;s.push({x:i[o].x-f*m,z:i[o].z+h*m})}let r=0;for(let o=0;o<s.length;o++){let c=s[Math.max(0,o-1)],l=s[Math.min(s.length-1,o+1)],h=l.x-c.x,f=l.z-c.z,u=Math.hypot(h,f)||1;h/=u,f/=u,o>0&&(r+=Math.hypot(s[o].x-s[o-1].x,s[o].z-s[o-1].z));let m=1.3;if(t.push(s[o].x-f*m,.08,s[o].z+h*m,s[o].x+f*m,.08,s[o].z-h*m),e.push(0,-r/3,1,-r/3),o>0){let g=(o-1)*2;n.push(g,g+1,g+2,g+1,g+3,g+2)}}let a=new ye;a.setAttribute("position",new jt(t,3)),a.setAttribute("uv",new jt(e,2)),a.setIndex(n),lr.geometry.dispose(),lr.geometry=a}var Kv=At("mini"),jv=Kv.getContext("2d");function Qv(){let i=jv,t=184,e=.55;i.save(),i.fillStyle="#0a1420",i.fillRect(0,0,t,t),i.translate(t/2,t*.62),i.rotate(-dt.h-Math.PI/2),i.scale(e,e),i.translate(-dt.x,-dt.z),i.strokeStyle="#2c3d50",i.lineWidth=14,i.lineCap="butt",i.beginPath();for(let s=0;s<be;s++)i.moveTo(s*St,0),i.lineTo(s*St,(be-1)*St),i.moveTo(0,s*St),i.lineTo((be-1)*St,s*St);i.stroke(),i.strokeStyle="#ff4040",i.lineWidth=10;for(let s of Jt.blocked){let[r,a]=s.split(":").map(Number),o=mn(r),c=mn(a);i.beginPath(),i.moveTo((o.x*2+c.x)/3,(o.z*2+c.z)/3),i.lineTo((o.x+c.x*2)/3,(o.z+c.z*2)/3),i.stroke()}for(let s of Jt.fuel)i.fillStyle=gs&&!ms?"#ffcc00":"#806a10",i.fillRect(s.rect.x0,s.rect.z0,s.rect.x1-s.rect.x0,s.rect.z1-s.rect.z0);i.fillStyle="#6dffb6";let n=gn.rect;i.fillRect(n.x0-3,n.z0-3,n.x1-n.x0+6,n.z1-n.z0+6),An&&(i.strokeStyle="#5ff2ff",i.lineWidth=7,i.lineJoin="round",i.beginPath(),An.pts.forEach((s,r)=>r?i.lineTo(s.x,s.z):i.moveTo(s.x,s.z)),i.stroke()),i.fillStyle="#ff7ad9";for(let s of ri.cars)s.active&&i.fillRect(s.x-3,s.z-3,6,6);i.restore(),i.fillStyle="#ffffff",i.beginPath(),i.moveTo(t/2,t*.62-11),i.lineTo(t/2-7,t*.62+7),i.lineTo(t/2+7,t*.62+7),i.closePath(),i.fill()}function Pf(i){jh=i==="night"||i==="dusk",jl=i==="rain"||i==="dusk",Rf=i==="rain"?.55:i==="dusk"?.72:1;let t=an.fog,e={clear:{top:5214172,bot:13821170,fog:12374755,near:90,far:420,hemi:1,sun:1.6,sunC:16773597,night:0},title:{top:3825576,bot:15906976,fog:13154504,near:120,far:700,hemi:.95,sun:1.3,sunC:16766640,night:.25},rain:{top:5595246,bot:9082274,fog:8029586,near:20,far:170,hemi:.7,sun:.4,sunC:14542576,night:.35},night:{top:132368,bot:1318970,fog:791590,near:30,far:230,hemi:.22,sun:.08,sunC:8952268,night:1},dusk:{top:2763354,bot:14189162,fog:6969966,near:30,far:220,hemi:.5,sun:.6,sunC:16751210,night:.75}}[i];Wh.uniforms.top.value.setHex(e.top),Wh.uniforms.bot.value.setHex(e.bot),t.color.setHex(e.fog),t.near=e.near,t.far=e.far,wf.intensity=e.hemi,ic.intensity=e.sun,ic.color.setHex(e.sunC),Jt.nightU.value=e.night,uc.visible=jl,ri.lights.material.color.setScalar(jh?1.6:.8),Ot.setRain(jl?i==="dusk"?.6:1:0)}function t_(i,t){let e=document.createElement("canvas");e.width=256,e.height=512;let n=e.getContext("2d");return n.fillStyle="rgba(60,255,150,0.28)",n.fillRect(0,0,256,512),n.strokeStyle="rgba(160,255,200,0.95)",n.lineWidth=14,n.setLineDash([36,20]),n.strokeRect(8,8,240,496),n.fillStyle="rgba(220,255,235,0.95)",n.font="bold 44px Arial",n.textAlign="center",n.save(),n.translate(128,256),n.rotate(-Math.PI/2),n.fillText(i,0,-10),n.font="bold 26px Arial",n.fillText(t,0,34),n.restore(),new Xe(e)}function vf(i,t,e,n){let s=i.rect,r=s.x1-s.x0,a=s.z1-s.z0,o=(i.kind==="curb"||i.kind==="fuel",i.along.x!==0),c=new ce(o?a:r,o?r:a),l=new re({map:t_(e,n),transparent:!0,depthWrite:!1,color:t}),h=new st(c,l);h.rotation.x=-Math.PI/2,o&&(h.rotation.z=Math.PI/2),h.position.set((s.x0+s.x1)/2,.22,(s.z0+s.z1)/2),Ea.add(h);let f=new st(new Ne(1.4,1.4,70,12,1,!0),new re({color:t,transparent:!0,opacity:.28,blending:cs,depthWrite:!1,side:Ze,fog:!1}));f.position.set((s.x0+s.x1)/2,35,(s.z0+s.z1)/2),Ea.add(f)}function e_(i,t,e){let n=wa(t.x,t.z,t.h,e),s=[];for(let v=1;v<n.pts.length-2;v++){let p=n.pts[v];s.push(Math.round(p.x/St)+Math.round(p.z/St)*be)}let r=[];for(let v=0;v<s.length-1;v++)r.push([s[v],s[v+1]]);let a=new Set([Tn(e.edge[0],e.edge[1]),...Jt.fuel.map(v=>Tn(v.edge[0],v.edge[1]))]),o=[],c=r.filter((v,p)=>p>0&&!a.has(Tn(v[0],v[1])));for(let v=0;v<i&&c.length;v++){let p=Math.floor((v+.5)/i*c.length),d=c[Math.min(c.length-1,p)];o.includes(d)||o.push(d)}let l=new Qt({color:16742938,emissive:4200448}),h=new Qt({color:15921906}),f=new ti(.3,.8,8);f.translate(0,.4,0);let u=document.createElement("canvas");u.width=256,u.height=128;let m=u.getContext("2d");m.fillStyle="#ff7a1a",m.fillRect(0,0,256,128),m.fillStyle="#111",m.font="bold 34px Arial",m.textAlign="center",m.fillText("ROAD WORK",128,52),m.font="bold 26px Arial",m.fillText("DETOUR \u27F2",128,98);let g=new re({map:new Xe(u),side:Ze});for(let[v,p]of o){Jt.blocked.add(Tn(v,p));let d=mn(v),b=mn(p),M=d.z===b.z;for(let y of[.2,.8]){let w=kt(d.x,b.x,y),T=kt(d.z,b.z,y),R=fe+4,x=M?{x0:w-1,x1:w+1,z0:T-R,z1:T+R}:{x0:w-R,x1:w+R,z0:T-1,z1:T+1};Jt.addSolid(x);for(let A=-R+1;A<=R-1;A+=2.6){let I=new st(new gt(M?.5:2.4,.9,M?2.4:.5),Math.round(A/2.6)%2?l:h);I.position.set(M?w:w+A,.45,M?T+A:T),ar.add(I)}for(let A=-2;A<=2;A++){let I=new st(f,l),D=y<.5?-3:3;I.position.set(M?w+D+A*0:w+A*3,0,M?T+A*3:T+D),ar.add(I)}let E=new st(new ce(3.2,1.6),g);E.position.set(w,2.2,T),E.rotation.y=M?Math.PI/2:0,ar.add(E)}}}function lc(i){rc=i,ue=_i[i],gn=Jt.stores[ue.store],Jt.blocked.clear(),Jt.removeSolids(Tf),ar.clear(),Ea.clear();let t=Jt.dcStarts[ue.dc];dt.reset(t.x,t.z,t.h,ue.fuel),ue.construction&&e_(ue.construction,t,gn),Pf(ue.weather),ri.setup(ue.traffic,ue.trafficSpeed,t.x,t.z),rr.reset(t.x,t.z),vf(gn,7208886,gn.kind==="dock"?"BACK IN":"DELIVERY",gn.kind==="dock"?"trailer first":"stop inside"),gs=ue.fuelStop,ms=!1,Jh=null;let e;if(gs){let n=1/0;for(let s of Jt.fuel){let r=wa(t.x,t.z,t.h,s).len,a=Math.abs(s.entry.x-gn.entry.x)+Math.abs(s.entry.z-gn.entry.z);r+a<n&&(n=r+a,Jh=s)}e=n*1.1+25*ue.pace;for(let s of Jt.fuel)vf(s,16763904,"FUEL","stop to refuel")}else e=wa(t.x,t.z,t.h,gn).len;fc=Math.round(e/ue.pace+35),Cf=dt.odo,qi=0,Sa=0,Yi=0,Zi=0,ir=0,Af=0,Jl=0,Kl=!1,Kh=-1,ga=0,An=null,tc=6,yi=[],i===0?yi=[{t:.5,text:"Hold GAS \xB7 follow the blue arrows"},{t:9,text:"Swing wide on turns: the trailer cuts corners"},{t:20,text:"Watch the mirrors to see your trailer"}]:yi=[{t:.5,text:ue.challenge}],gs&&yi.push({t:6,text:"Low fuel! Stop at a yellow GridFuel bay first"}),gn.kind==="dock"&&yi.push({t:12,text:"Hold BRAKE when stopped to reverse into the dock"}),ue.construction&&yi.push({t:6,text:"Road work ahead: the GPS will detour you"}),Qh=0,At("clockDay").textContent=`DAY ${ue.day} / 10`,At("clockStore").textContent=ue.title,dt.sync()}var pa=new L;function _f(){let i=dt.obbs();for(let t of i){let e=Math.hypot(t.hx,t.hz)+1,n=new Set;for(let s of[-e,e])for(let r of[-e,e])n.add(Jt.cell(t.x+s,t.z+r));for(let s of n){for(let r of Jt.solidGrid[s])if(Qs(t,ff(Jt.solids[r])))return{hit:!0,car:-1};for(let r of Jt.poleGrid[s]){let a=Jt.poles[r];if(Qs(t,{x:a.x,z:a.z,hx:.25,hz:.25,c:1,s:0}))return{hit:!0,car:-1}}}for(let s=0;s<ri.count;s++){let r=ri.cars[s];if(!(Math.abs(r.x-t.x)>12||Math.abs(r.z-t.z)>12)&&Qs(t,ri.obb(s)))return{hit:!0,car:s}}}return{hit:!1,car:-1}}function yf(i,t){Sa+=i,xs(`${t}  +${i}s`,"pen"),At("clockPen").textContent=`penalties +${Sa}s`}function n_(i){qi+=i;let t=dt.snapshot(),e=Math.abs(dt.v);dt.step(i,{throttle:en.throttle,brake:en.brake,steer:en.steer},Rf);let n=_f();n.hit?Kl?dt.v=Math.max(-2,Math.min(2,dt.v)):(dt.restore(t),dt.v=-dt.v*.15,Jl<=0&&e>1.6?(Yi++,yf(5,n.car>=0?"Collision with a player vehicle":"Collision"),Ot.crash(),ma=Math.min(1,e/10+.3),Jl=1.5):e>.5&&Ot.thud(),n.car>=0&&ri.bump(n.car),Kl=_f().hit):Kl=!1,Jl-=i;let s=dt.front(),r=Math.round(s.x/St),a=Math.round(s.z/St),o=r>=0&&r<be&&a>=0&&a<be?r+a*be:-1,c=o>=0&&Math.abs(s.x-r*St)<fe&&Math.abs(s.z-a*St)<fe;if(c&&Kh!==o&&dt.v>2.5){let R=Math.cos(dt.h),x=Math.sin(dt.h),E=Math.abs(R)>Math.abs(x)?0:1,A=E===0?Math.sign(R):0,I=E===1?Math.sign(x):0;Jt.hasLight.has(o+","+A+","+I)&&Jt.lightState(o,E,Ql)===2&&(Zi++,yf(10,"Ran a red light"),Ot.hiss())}Kh=c?o:-1;let l=null;dt.fuel<=0?l="OUT OF FUEL \xB7 crawling on reserve":dt.fuel<.12&&Math.floor(sr*2)%2===0&&(l="FUEL LOW");let[h,f]=dt.obbs();for(let R of Jt.fuel)Hh(R,h.x,h.z,1.5)&&(Math.abs(dt.v)<.5&&dt.fuel<.995?(dt.fuel=Math.min(1,dt.fuel+i*.16),Af+=i,l=`REFUELING ${Math.round(dt.fuel*100)}%`,dt.fuel>.6&&!ms&&(ms=!0,gs&&(xs("Transaction confirmed: \u221238 CR fuel","cash"),An=null,ga=0))):dt.fuel<.995&&(l="Stop in the bay to refuel"));let u=gn,m=Hh(u,h.x,h.z,1),g=Hh(u,f.x,f.z,1),v={x:Math.cos(dt.ht),z:Math.sin(dt.ht)},p=Math.abs(v.x*u.along.x+v.z*u.along.z)>.8,d=u.kind!=="dock"||v.x*u.inward.x+v.z*u.inward.z<-.6,b=Math.hypot(h.x-u.entry.x,h.z-u.entry.z)<45;if(gs&&!ms)b&&!l&&(l="Refuel first! Head to a yellow GridFuel bay");else if(m&&g&&p&&d){if(Math.abs(dt.v)<.6?(ir+=i,l=ir>.3?"PARKED \xB7 unloading\u2026":"Hold still\u2026"):(l="Stop the truck",ir=0),ir>1.1){Lf();return}}else ir=0,b&&!l&&(u.kind==="dock"&&(m||g)&&!d?l="Back the trailer into the dock":m||g?l="Pull the whole truck into the green bay":qi>3&&(l=u.kind==="dock"?"Reverse the trailer into the green dock":"Pull into the green bay and stop"));if(ru(l),ga-=i,ga<=0){ga=.4;let R=gs&&!ms&&Jh?i_():gn;An=wa(dt.x+Math.cos(dt.h)*2,dt.z+Math.sin(dt.h)*2,dt.h,R),Jv(An.pts),At("gpsArrow").dataset.k!==An.arrow&&(At("gpsArrow").dataset.k=An.arrow,At("gpsArrow").innerHTML=$v(An.arrow)),At("gpsInstr").textContent=An.instr,At("gpsDist").textContent=`in ${Math.max(0,Math.round(An.dist/10)*10)} m \xB7 ${(An.len/1e3).toFixed(2)} km left`,Qv()}if(sc.offset.y-=i*.8,Qh+=i,yi.length&&Qh>yi[0].t){let R=yi.shift(),x=At("hint");x.textContent=R.text,de("hint",!0),setTimeout(()=>de("hint",!1),4500)}if(tc-=i,tc<0&&(tc=11+Math.random()*9,xs(bf[Math.floor(Math.random()*bf.length)],Math.random()<.3?"cash":"")),rr.events.length){let R=rr.events.shift();Math.random()<.6&&xs(R),rr.events.length=0}en.horn!==tu&&(Ot.horn(en.horn),tu=en.horn),en.hit("KeyR")&&au(),en.hit("Escape","KeyP")&&ur(!0);let M=fc-qi,y=At("clockTime");y.textContent=M>=0?eu(M):"+"+eu(-M),y.classList.toggle("late",M<0),At("spd").textContent=String(Math.round(Math.abs(dt.v)*3.6));let w=At("gear");w.textContent=dt.gear,w.classList.toggle("r",dt.gear==="R");let T=At("fuelFill");T.style.width=(dt.fuel*100).toFixed(0)+"%",T.classList.toggle("low",dt.fuel<.15),Ot.setEngine(Math.min(1,Math.abs(dt.v)/24+dt.throttleNow*.25),dt.throttleNow,!0)}function i_(){let i=Jt.fuel[0],t=1/0;for(let e of Jt.fuel){let n=Math.abs(e.entry.x-dt.x)+Math.abs(e.entry.z-dt.z);n<t&&(t=n,i=e)}return i}var bf=["Shift performance: 94% \xB7 Keep it up!","Transaction confirmed: \u22122 CR road usage fee","Reminder: customer smiles are rated","Priority Routes unlock at 98% shift score","MetaShift Workforce: 12,408 workers online","Now hiring: Night Greeters \xB7 9 CR/hr","Skyline Lofts: virtual penthouses 5% off today","Your headset battery: 61%","Idle detection active. Stay engaged!","Tip: on-time deliveries protect your rating","Transaction confirmed: +0.40 CR mileage credit","New cosmetic drop: Aurora Jacket \xB7 2,400 CR","Weekly leaderboard resets in 2 days","Break eligibility: 0 min remaining"];function au(){Ot.radioOn=!Ot.radioOn,Ot.click(),Ot.setRadio(te==="drive"),At("radioBtn").classList.toggle("on",Ot.radioOn),At("radioBtn2").textContent="RADIO: "+(Ot.radioOn?"ON":"OFF"),xs(Ot.radioOn?"\u266A SHIFT FM 98.6 \xB7 Electro Hits, all day":"Radio off")}function Lf(){ru(null),de("hint",!1),Ot.horn(!1),tu=!1,Ot.hiss(),dt.v=0,dt.throttleNow=0,dt.brakeNow=1,s_();let i=ac;ac=null,i?.()}function s_(){or()?.gameplay?.levelComplete({levelId:"day-"+ue.day})}function ur(i){te!=="drive"&&(i=!1),Ma=i,de("pause",i),i?(Ot.setRadio(!1),Ot.setEngine(0,0,!1),Ot.horn(!1)):Ot.setRadio(te==="drive")}At("pauseBtn").addEventListener("click",()=>ur(!0));At("resumeBtn").addEventListener("click",()=>ur(!1));At("radioBtn").addEventListener("click",()=>au());At("radioBtn2").addEventListener("click",()=>au());At("restartBtn").addEventListener("click",()=>{or()?.gameplay?.levelFail("day-"+ue.day,"restart"),ur(!1),lc(rc),or()?.gameplay?.levelStart({levelId:"day-"+ue.day,levelIndex:rc}),At("clockPen").textContent=""});At("quitBtn").addEventListener("click",()=>{or()?.gameplay?.levelFail("day-"+ue.day,"quit"),ur(!1),ac=null,cu()});var ou=!1;function bi(i){ou=i,de("skip",i)}At("skip").addEventListener("click",i=>{i.stopPropagation(),ou&&(he.skip(),Ot.hush())});var $i="assets/audio/voice/";function Df(i,t,e){return e==="D"?`${$i}driver/voice_d${i}_${t}.mp3`:`${$i}day${i}/voice_l${t}.mp3`}function r_(i){_i[i-1]?.lines.forEach((t,e)=>Ot.preload(Df(i,e,t.who)))}async function Nf(i,t,e,n,s){hr(i,t),e&&(e.talking=!0);let r=!1;Ot.speak(t,n,()=>{r=!0},s),await he.until(()=>r),he.skipping&&Ot.hush(),e&&(e.talking=!1)}var Hn=[],Gn=null,ql=0,Mf=null;function Yl(i,t){let e=Jt.cell(i,t);for(let n of Jt.solidGrid[e]){let s=Jt.solids[n];if(i>s.x0-.6&&i<s.x1+.6&&t>s.z0-.6&&t<s.z1+.6)return!1}return!0}async function a_(){let i=dt.h,t=Math.cos(i),e=Math.sin(i),n=Math.sin(i),s=-Math.cos(i),r=(E,A)=>new L(dt.x+t*E+n*A,.15,dt.z+e*E+s*A),a=new ps({skin:15251600,shirt:1920936,pants:1778739,hair:2759956,hat:"cap",hatColor:6288127,glow:662080,name:"WORKER_4471 (you)",nameColor:"#5ff2ff"}),o=new ps({...ue.employee});an.add(a.root,o.root),Hn=[a,o];let c=[[8,.4,9.7,-.4],[2,3.6,2.4,5.2],[2,-3.6,2.4,-5.2],[-3,3.6,-3,5.2]],l=c[0];for(let E of c){let A=r(E[0],E[1]),I=r(E[2],E[3]);if(Yl(A.x,A.z)&&Yl(I.x,I.z)){l=E;break}}let h=r(2.6,1.9),f=r(l[0],l[1]),u=r(l[2],l[3]);a.root.position.copy(h),a.resetPose(),o.resetPose(),o.root.position.copy(u);let m=(E,A)=>{E.root.rotation.y=Math.atan2(A.x-E.root.position.x,A.z-E.root.position.z)};m(o,f),o.setExpr("neutral"),a.setExpr("neutral");let g=(E,A)=>{for(let I=0;I<=8;I++){let D=kt(E.x,A.x,I/8),P=kt(E.z,A.z,I/8);if(!Yl(D,P))return!1}return!0},v=[r(15,8),r(15,-8),r(18,2),r(-6,9),r(-6,-9),r(9,4)];Gn={pos:(v.find(E=>g(E,h))??v[2]).clone().setY(5),look:h.clone().setY(1.4),tags:!0},await he.wait(.6),Ot.thud();let d=l===c[0]?[h,r(7.2,2),f]:[h,f];for(let E=1;E<d.length;E++){let A=d[E-1].clone(),I=d[E];m(a,I);let D=A.distanceTo(I)/1.5,P=0;await he.tween(D,H=>{a.root.position.lerpVectors(A,I,H),a.walk(1/60,1.5),P+=1,P%22===0&&Ot.step(),Gn.look.lerp(a.root.position.clone().setY(1.3),.08)})}a.resetPose(),m(a,u);let b=f.clone().add(u).multiplyScalar(.5),M=u.clone().sub(f).normalize(),y=new L(-M.z,0,M.x),w=Yl(b.x+y.x*4,b.z+y.z*4)?1:-1,T=()=>{Gn={pos:b.clone().addScaledVector(y,4.4*w).setY(1.8),look:b.clone().setY(1.45),tags:!0}},R=(E,A)=>{let I=A.clone().sub(E).normalize(),D=new L(-I.z,0,I.x).multiplyScalar(.85*w);Gn={pos:E.clone().addScaledVector(I,-1.7).add(D).setY(1.95),look:A.clone().setY(1.5),tags:!1}};T(),await he.wait(.4);let x=rc;for(let E=0;E<ue.lines.length;E++){let A=ue.lines[E],I=A.who==="D"?a:o,D=A.who==="D"?o:a;E===0||E===ue.lines.length-1||E%3===2?T():R(D.root.position,I.root.position),A.face&&o.setExpr(A.face),A.dface&&a.setExpr(A.dface),await Nf(A.who==="D"?"WORKER_4471 (you)":ue.empName,A.text,I,A.who==="D"?"driver":x,Df(ue.day,E,A.who)),await he.wait(A.pause??.35)}hr(null),T(),o.setExpr("neutral"),a.setExpr("neutral"),Ot.ding(),xs("Delivery confirmed \xB7 signature received","cash"),await he.wait(1)}function Uf(){for(let i of Hn)an.remove(i.root);Hn=[],Gn=null,hr(null)}function o_(i,t,e,n){let s=Math.max(40,Math.round(100-Yi*6-Zi*8-(n?12:0))),r=s>=95?5:s>=85?4:s>=72?3:s>=58?2:1,a=Math.max(0,1500-Ke.earned),o=At("summary");return o.innerHTML=`<h2>SHIFT SUMMARY \xB7 DAY ${ue.day}</h2><h1>Delivery completed</h1>
    <div class="row"><span>${gn.name}</span><b class="pos">Delivered</b></div>
    <div class="row"><span>Delivery time</span><b>${cr(qi)}${n?' <span class="neg">(late)</span>':""}</b></div>
    <div class="row"><span>Collision penalties</span><b class="${Yi?"neg":""}">${Yi} \xD7 5s</b></div>
    <div class="row"><span>Driving violations</span><b class="${Zi?"neg":""}">${Zi} \xD7 10s</b></div>
    <div class="row"><span>Leaderboard time today</span><b>${cr(i)}</b></div>
    <div class="row"><span>Credits earned</span><b class="pos">${t} CR</b></div>
    <div class="row"><span>Remaining rent balance</span><b>${a>0?oc(a):"Covered"}</b></div>
    <div class="row"><span>Overall performance</span><b>${s}% <span class="stars">${c_(r)}</span></b></div>
    <div class="txn">Transaction confirmed \xB7 ${150} CR base + ${e} CR performance \u2192 ${oc(t)} transferred to your real-world account.</div>
    <div id="sumBadges"></div>
    <button class="btn" id="clockOut">CLOCK OUT</button>`,de("summary",!0),Ot.ding(),new Promise(c=>{let l=()=>{de("summary",!1),c()};At("clockOut").addEventListener("click",l),cc=l})}var cc=null;async function l_(){te="results";let i=Ke.times.reduce((a,o)=>a+o,0),t=Math.round(i*1e3),e=At("results"),n=Ke.times.map((a,o)=>`<div class="row"><span>Day ${o+1} \xB7 ${_i[o].title}</span><b>${cr(a)}</b></div>`).join("");e.innerHTML=`<h2>TEN-DAY SHIFT COMPLETE</h2><h1>Total time ${cr(i)}</h1>
    ${n}
    <div class="row"><span>Collisions / violations</span><b>${Ke.collisions} / ${Ke.violations}</b></div>
    <div class="row"><span>Earned</span><b class="pos">${oc(Ke.earned)} \xB7 rent covered</b></div>
    <div id="resBadges"></div>
    <h2 style="margin-top:14px">TOP DRIVERS</h2><div class="lb" id="lb"><div class="small">Loading leaderboard\u2026</div></div>
    <button class="btn" id="againBtn">START A NEW SHIFT</button><button class="btn alt" id="titleBtn">TITLE SCREEN</button>`,de("results",!0),lu("resBadges",mc.filter(a=>a==="rent-covered"||a==="model-worker")),At("againBtn").addEventListener("click",()=>{de("results",!1),dr(Ji())}),At("titleBtn").addEventListener("click",()=>{de("results",!1),cu()}),or()?.gameplay?.score({value:t});let s=await Ta(),r="";try{s?.scores&&(await s.scores.submit("total-shift-time",t))?.improved&&(r='<div class="small" style="color:#6dffb6">New personal best!</div>')}catch(a){console.warn("score not sent",a)}await Ff(At("lb"),r)}async function Ff(i,t=""){let e=await Ta(),n=[];try{e?.scores&&(n=(await e.scores.top("total-shift-time",{limit:10}))?.entries||[])}catch{n=[]}let s="";try{if(e?.scores){let a=await e.scores.best("total-shift-time");a&&(s=`<div class="row you"><span>Your best</span><b>${cr(a.score/1e3)}</b></div>`)}}catch{}let r=n.find(a=>a.you);i.innerHTML=t+(n.length?n.map(a=>`<div class="row ${a.you?"you":""}"><span>#${a.rank} ${hc(String(a.displayName))}</span><b>${cr(a.score/1e3)}</b></div>`).join(""):'<div class="small">No shifts ranked yet. Be the first!</div>')+(r?`<div class="small" style="color:#5ff2ff">Your rank: #${r.rank}</div>`:s)}function c_(i){let t="";for(let e=0;e<5;e++)t+=`<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z" fill="${e<i?"#ffd23f":"none"}" stroke="#ffd23f" stroke-width="1.5"/></svg>`;return t}function hc(i){return i.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}var h_={"first-delivery":"First Shift","deliveries-10":"Regular Worker","deliveries-30":"Company Lifer","clean-5":"Spotless Record","ontime-10":"Punctual","long-haul":"Long Haul","dock-master":"Back It In","rent-covered":"Rent Covered","model-worker":"Model Worker"},mc=[];function lu(i,t){if(!t.length)return;let e=document.getElementById(i);e&&(e.innerHTML+=t.map(n=>`<div class="txn badge-earned">Badge earned \xB7 ${hc(h_[n]??n)}</div>`).join(""))}async function u_(i,t,e,n){let r=(await Ta())?.achievements;if(!r)return;let a=[],o=(c,l)=>{c?.unlocked===!0&&l&&a.push(l),Array.isArray(c?.unlocked)&&a.push(...c.unlocked)};try{o(await r.unlock("first-delivery"),"first-delivery"),o(await r.progress("deliveries",1)),t&&o(await r.progress("clean_deliveries",1)),i&&o(await r.progress("ontime_deliveries",1)),e>0&&o(await r.progress("meters",e)),n&&o(await r.unlock("dock-master"),"dock-master")}catch(c){console.warn("badge",c)}mc.push(...a),te==="summary"&&lu("sumBadges",a)}async function d_(i){let e=(await Ta())?.achievements;if(!e)return;let n=[];try{(await e.unlock("rent-covered"))?.unlocked===!0&&n.push("rent-covered"),i&&(await e.unlock("model-worker"))?.unlocked===!0&&n.push("model-worker")}catch(s){console.warn("badge",s)}te==="results"?lu("resBadges",n):mc.push(...n)}async function Bf(){de("badges",!0);let i=At("badgeList");i.innerHTML='<div class="small">Loading\u2026</div>';let t=await Ta(),e=[];try{t?.achievements&&(e=await t.achievements.list()||[])}catch{e=[]}if(!e.length){i.innerHTML='<div class="small">Badges are unavailable right now. Try again later.</div>';return}i.innerHTML=e.map(n=>{let s=n.secret&&!n.unlocked,r=s?"???":hc(String(n.name??n.id)),a=s?"A secret badge. Keep working.":hc(String(n.description??"")),o="";if(n.target&&!n.unlocked){let c=Math.max(0,Math.min(1,(Number(n.progress)||0)/n.target)),l=n.stat==="meters"||n.id==="long-haul"?`${((Number(n.progress)||0)/1e3).toFixed(1)} / ${(n.target/1e3).toFixed(0)} km`:`${Math.min(n.target,Number(n.progress)||0)} / ${n.target}`;o=`<div class="bbar"><div style="width:${(c*100).toFixed(1)}%"></div></div><div class="bnum">${l}</div>`}return`<div class="badge ${n.unlocked?"got":""}"><div class="bic">${n.unlocked?'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6dffb6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>':s?"?":""}</div><div class="btx"><b>${r}</b><span>${a}</span>${o}</div></div>`}).join("")}var Xi=0;async function dr(i){Ot.init(),Ot.preload($i+"system/voice_welcome.mp3"),Ot.preload($i+"driver/voice_apt_rent.mp3"),Ot.preload($i+"driver/voice_apt_work.mp3"),Ke=i;let t=++Xi;mc=[],Ot.setRadio(!1),de("title",!1);for(let e=Ke.day;e<_i.length;e++)if(await f_(e,t),t!==Xi)return;t===Xi&&(If(),d_(Ke.collisions===0&&Ke.violations===0),te="final",de("finalCard",!0),Ln(0),Ot.jingle(),bi(!0),he.reset(),await he.wait(3.6),bi(!1),he.reset(),de("finalCard",!1),Ln(0),l_())}async function f_(i,t){let e=i===_i.length-1;if(lc(i),te="morning",he.reset(),bi(!0),Ln(1),await he.wait(.2),Ln(0),r_(ue.day),await ba.morning(he,ue.day,(l,h,f)=>Nf("Driver",h,f,"driver",h.startsWith("Oh")?$i+"driver/voice_apt_rent.mp3":$i+"driver/voice_apt_work.mp3"),Ot,l=>{let h=At("daycard");h.textContent=l,de("daycard",!0),setTimeout(()=>de("daycard",!1),2600)}),t!==Xi)return;he.reset(),Ln(1),await he.wait(.7),te="loading",de("loading",!0),Ln(0),he.reset(),Ot.jingle();let n=["Verifying worker ID #4471\u2026","Syncing shift contract\u2026","Assigning delivery route\u2026","Loading MetaShift City\u2026"],s=!1;if(Ot.speak("Welcome to MetaShift. Your income stream.","system",()=>{s=!0},$i+"system/voice_welcome.mp3"),hr("MetaShift","Welcome to MetaShift. Your income stream."),await he.tween(4.2,l=>{At("loadFill").style.width=(l*100).toFixed(0)+"%",At("loadMsg").textContent=n[Math.min(3,Math.floor(l*4))]}),await he.until(()=>s||he.time>0),Ot.hush(),hr(null),t!==Xi||(Ln(1),await he.wait(.35),de("loading",!1),bi(!1),he.reset(),lc(i),te="drive",de("hud",!0),en.touchUI.classList.add("active"),fr(),At("clockPen").textContent="",At("toasts").innerHTML="",Ln(0),Ot.setRadio(!0),or()?.gameplay?.levelStart({levelId:"day-"+ue.day,levelIndex:i}),xs(`Shift started \xB7 Deliver to ${gn.name}`),await new Promise(l=>{ac=l}),t!==Xi))return;let r=qi>fc,a=qi+Sa,o=Math.max(0,15-Yi*3-Zi*3-(r?8:0)),c=150+o;Ke.times.push(a),Ke.pens.push(Sa),Ke.collisions+=Yi,Ke.violations+=Zi,te="deliver",de("hud",!1),en.touchUI.classList.remove("active"),Ot.setRadio(!1),Ot.setEngine(0,0,!1),he.reset(),bi(!0),await a_(),bi(!1),he.reset(),Ke.earned=Math.min(1500,Ke.earned+c),u_(!r,Yi===0&&Zi===0,Math.round(dt.odo-Cf),gn.kind==="dock"),te="summary",await o_(a,c,o,r),Uf(),t===Xi&&(cc=null,Ke.day=i+1,e||Yv(),Ln(1),await he.wait(.5),te=e?"final":"night",he.reset(),bi(!0),Ln(0),e&&(te="night"),await ba.night(he,e,(l,h)=>Zv(l,h),Ot,e?"":`Payout received \xB7 rent balance ${oc(Math.max(0,1500-Ke.earned))} remaining`),he.reset(),bi(!1),Ln(1),await he.wait(1))}function cu(){Xi++,te="title",Ma=!1,de("hud",!1),de("summary",!1),de("results",!1),de("loading",!1),de("pause",!1),de("finalCard",!1),bi(!1),hr(null),ru(null),en.touchUI.classList.remove("active"),Ot.setRadio(!0,!0),Ot.setEngine(0,0,!1),Ot.setRain(0),Ot.hush(),Uf(),Jt.blocked.clear(),Jt.removeSolids(Tf),ar.clear(),Ea.clear(),lr.geometry=new ye,Pf("title"),ri.setup(34,10,400,400),rr.reset(400,400),dt.reset(Jt.dcStarts[0].x,Jt.dcStarts[0].z,Jt.dcStarts[0].h,1);let i=pc(),t=At("contBtn");t.classList.toggle("hidden",!i),i&&(t.textContent=`CONTINUE \xB7 DAY ${i.day+1}`),de("title",!0),Ln(0),ec=0,xa=-1,Of()}function Of(){xa=(xa+1)%3;let i=At("attract");xa===0?i.innerHTML='<div class="card"><h2 style="margin:0 0 6px;font-size:12px;letter-spacing:3px;color:#5ff2ff">TEN DAYS \xB7 TEN DELIVERIES</h2><div class="keys">Drive an 18-wheeler through MetaShift City. Make your deliveries, get paid, cover the rent.<br>Fastest total time across all ten days tops the board.</div></div>':xa===1?(i.innerHTML='<div class="card"><h2 style="margin:0 0 6px;font-size:12px;letter-spacing:3px;color:#5ff2ff">TOP DRIVERS</h2><div id="tlb"><div class="small">Loading\u2026</div></div></div>',Ff(At("tlb"))):i.innerHTML='<div class="card"><h2 style="margin:0 0 6px;font-size:12px;letter-spacing:3px;color:#5ff2ff">HOW TO DRIVE</h2><div class="keys"><b>Touch:</b> drag the wheel \xB7 GAS / BRAKE pedals (hold BRAKE when stopped to reverse)<br><b>Keys:</b> W/S gas & brake \xB7 A/D steer \xB7 H horn \xB7 R radio \xB7 Esc pause<br><b>Pad:</b> RT gas \xB7 LT brake \xB7 stick steer</div></div>'}At("badgeBtn").addEventListener("click",i=>{i.stopPropagation(),Bf()});At("badgeBtn2").addEventListener("click",()=>Bf());At("badgeClose").addEventListener("click",i=>{i.stopPropagation(),de("badges",!1)});At("badges").addEventListener("click",i=>i.stopPropagation());At("startBtn").addEventListener("click",i=>{i.stopPropagation(),If(),dr(Ji())});At("contBtn").addEventListener("click",i=>{i.stopPropagation();let t=pc();dr(t??Ji())});At("title").addEventListener("click",()=>{te==="title"&&!pc()&&dr(Ji())});function fr(){let i=window.innerWidth,t=window.innerHeight;if(i>=2&&t>=2){let p=i,d=t;i/t>=1&&(p=Math.min(i,t*4/3),d=p*3/4);let b=Math.round((i-p)/2),M=Math.round((t-d)/2);for(let y of[er,va])y.style.left=b+"px",y.style.top=M+"px",y.style.width=Math.round(p)+"px",y.style.height=Math.round(d)+"px",y.style.right="auto",y.style.bottom="auto";va.style.setProperty("--vw",p/100+"px"),va.style.setProperty("--vh",d/100+"px")}let e=er.clientWidth,n=er.clientHeight;if(e<2||n<2)return;Dn||(Dn=new Dl({antialias:!0,powerPreference:"high-performance"}),Dn.setPixelRatio(zh),Dn.outputColorSpace=Re,er.appendChild(Dn.domElement)),_a=e,ya=n,Dn.setSize(e,n);let s=e/n,r=us.clamp(2*Math.atan(Math.tan(us.degToRad(64)/2)/s)*180/Math.PI,50,96);Ie.fov=r,Ie.aspect=s,Ie.updateProjectionMatrix(),nr.left=0,nr.right=e,nr.top=0,nr.bottom=-n,nr.updateProjectionMatrix();let a=At("gps").getBoundingClientRect(),o=At("clock").getBoundingClientRect(),c=s<1,l=Math.max(a.bottom,o.bottom)-er.getBoundingClientRect().top+8,h=Math.min(n*.21,190),f=Math.round(h*.6),u=3,m=3;if(c){let p=n/2-70;l+h>p&&(h=Math.max(80,p-l),f=Math.round(h*.6))}kh[0]={x:u,y:l,w:f,h},kh[1]={x:e-m-f,y:l,w:f,h};for(let p=0;p<2;p++){let d=kh[p];Zh[p].scale.set(-d.w,d.h,1),Zh[p].position.set(d.x+d.w/2,-(d.y+d.h/2),0),$h[p].scale.set(d.w+8,d.h+8,1),$h[p].position.set(d.x+d.w/2,-(d.y+d.h/2),-1),qh[p].aspect=d.w/d.h,qh[p].updateProjectionMatrix(),iu[p].setSize(Math.round(d.w*zh*.8),Math.round(d.h*zh*.8))}let g=At("toasts");g.style.top=l+4+"px",g.style.width=Math.max(140,e-2*(f+22))+"px",At("status").style.top=l+h+14+"px";let v=document.body.classList.contains("touchmode");At("dashInfo").style.bottom=v?"calc(66px + var(--sb))":"calc(12px + var(--sb))",v&&c&&(At("dashInfo").style.bottom="calc(196px + var(--sb))"),At("hint").style.bottom=v&&c?"calc(262px + var(--sb))":v?"calc(128px + var(--sb))":"calc(80px + var(--sb))"}new ResizeObserver(()=>fr()).observe(er);window.addEventListener("resize",fr);var p_=new MutationObserver(()=>fr());p_.observe(document.body,{attributes:!0,attributeFilter:["class"]});var Ef=performance.now(),m_=0,Gh=0,Zl=new L;function zf(i){requestAnimationFrame(zf);let t=Math.min(.05,(i-Ef)/1e3);if(Ef=i,!Dn&&(fr(),!Dn))return;if(en.update(t),ou&&en.hit("Enter","Space","KeyX")&&(he.skip(),Ot.hush()),te==="summary"&&cc&&en.hit("Enter","Space")&&cc(),te==="title"&&en.hit("Enter","Space")){let n=pc();dr(n??Ji())}Ma&&en.hit("Escape","KeyP","Enter")&&ur(!1),te!=="drive"&&en.hit("KeyR","Escape","KeyP"),Ma||(sr+=t,Ql+=t,he.update(t),Jt.updateLights(Ql));let e=Dn;if(te==="morning"||te==="night"){ba.update(t,_a/ya),e.setRenderTarget(null),e.autoClear=!0,e.render(ba.scene,ba.camera);return}if(te==="loading"||te==="final"||te==="boot")return void 0;if(!Ma){te==="drive"&&n_(t);let n=te==="title"?[]:dt.obbs(),s=te==="title"?Ie.position.x:dt.x,r=te==="title"?Ie.position.z:dt.z;ri.update(t,Ql,n,s,r),rr.update(t,sr,s,r),dt.animate(t,jl,jh),Xh.uniforms.uTime.value=sr;for(let a of Hn)a.update(t);Hn.length&&(ql+=t,Hn[1]?.idle(ql),Hn[1]?.talking&&Hn[1].gesture(ql),Hn[0]?.talking&&Hn[0].gesture(ql*.9))}if(te==="title"){let n=sr*.04;Ie.fov=us.clamp(Ie.fov,50,80),Ie.updateProjectionMatrix(),Ie.position.set(400+Math.cos(n)*330,95+Math.sin(n*2)*20,400+Math.sin(n)*330),Ie.lookAt(400+Math.cos(n+.8)*120,10,400+Math.sin(n+.8)*120),ec+=t,ec>7&&(ec=0,Of())}else if(Gn&&(te==="deliver"||te==="summary")){let n=_a/ya<1?54:40;if(Ie.fov!==n&&(Ie.fov=n,Ie.aspect=_a/ya,Ie.updateProjectionMatrix()),Gn!==Mf){Ie.position.copy(Gn.pos),Mf=Gn;for(let s of Hn)s.tag&&(s.tag.visible=Gn.tags)}Ie.lookAt(Gn.look)}else{g_(),dt.tractor.updateMatrixWorld(!0),dt.camAnchor.getWorldPosition(Zl),ma=Math.max(0,ma-t*2.5);let n=(Math.random()-.5)*ma*.15,s=(Math.random()-.5)*ma*.1;Ie.position.set(Zl.x+n,Zl.y+s+Math.sin(sr*9)*Math.min(.012,Math.abs(dt.v)*8e-4),Zl.z);let r=Math.PI/2-dt.h+Math.PI-dt.delta*.35;Ie.rotation.set(-.11+dt.lonAcc*.004,r,-dt.latAcc*.002,"YXZ")}if(nu.position.copy(Ie.position),Xh.uniforms.uCam.value.copy(Ie.position),dt.interior.visible=te==="drive",lr.visible=te==="drive",te==="drive"&&(Gh-=t,Gh<0)){Gh=.15;let n=fc-qi;dt.drawDash(`DAY ${ue.day} \xB7 ${n>=0?eu(n):"LATE"}`,Ot.radioOn,"98.6 FM",dt.fuel<.15)}if(e.autoClear=!0,te==="drive"){let n=m_++%2;(n===0?dt.mirrorL:dt.mirrorR).getWorldPosition(pa);let r=qh[n];r.position.copy(pa);let a=Math.cos(dt.h),o=Math.sin(dt.h),c=Math.sin(dt.h),l=-Math.cos(dt.h),h=n===0?1:-1;r.lookAt(pa.x-a*30+c*h*2.2,pa.y-1.6,pa.z-o*30+l*h*2.2),e.setRenderTarget(iu[n]),e.render(an,r),e.setRenderTarget(null)}e.render(an,Ie),te==="drive"&&(e.autoClear=!1,e.clearDepth(),e.render(Yh,nr),e.autoClear=!0)}function g_(){let i=_a/ya,t=us.clamp(2*Math.atan(Math.tan(us.degToRad(64)/2)/i)*180/Math.PI,50,96);(Math.abs(Ie.fov-t)>.01||Ie.aspect!==i)&&(Ie.fov=t,Ie.aspect=i,Ie.updateProjectionMatrix())}en.onAnyPress=()=>Ot.init();fr();cu();requestAnimationFrame(zf);nc.__ms={audio:Ot,forceRefuel(){ms=!0},get info(){return Dn?{calls:Dn.info.render.calls,tris:Dn.info.render.triangles}:null},truck:dt,city:Jt,traffic:ri,computeRoute:wa,get route(){return An},get state(){return te},setupLevel:lc,finishDrive:Lf,startRun:dr,newRun:Ji,LEVELS:_i,D:he,PLAYER_NAMES:Wi};
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
