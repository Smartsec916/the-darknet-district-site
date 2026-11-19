(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function e(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(n){if(n.ep)return;n.ep=!0;const r=e(n);fetch(n.href,r)}})();const Tl="185",qu=0,dc=1,Ku=2,oa=1,Zu=2,nr=3,Dn=0,di=1,Ui=2,ln=0,$n=1,Oi=2,pc=3,mc=4,$u=5,Xn=100,Ju=101,Qu=102,ju=103,tf=104,ef=200,nf=201,sf=202,rf=203,Lo=204,Do=205,af=206,of=207,lf=208,cf=209,hf=210,uf=211,ff=212,df=213,pf=214,Uo=0,No=1,Fo=2,Ls=3,Oo=4,ko=5,Bo=6,zo=7,Ca=0,mf=1,gf=2,qi=0,Oh=1,kh=2,Bh=3,zh=4,Hh=5,Gh=6,Vh=7,gc="attached",xf="detached",Wh=300,jn=301,Ds=302,Ha=303,Ga=304,Pa=306,Us=1e3,$e=1001,Ho=1002,Je=1003,_f=1004,Ar=1005,Qe=1006,Va=1007,Kn=1008,Mi=1009,Xh=1010,Yh=1011,hr=1012,Al=1013,Zi=1014,Ti=1015,$i=1016,Rl=1017,Cl=1018,ur=1020,qh=35902,Kh=35899,Zh=1021,$h=1022,Ai=1023,un=1026,Zn=1027,Pl=1028,Il=1029,ts=1030,Ll=1031,Dl=1033,la=33776,ca=33777,ha=33778,ua=33779,Go=35840,Vo=35841,Wo=35842,Xo=35843,Yo=36196,qo=37492,Ko=37496,Zo=37488,$o=37489,ga=37490,Jo=37491,Qo=37808,jo=37809,tl=37810,el=37811,il=37812,nl=37813,sl=37814,rl=37815,al=37816,ol=37817,ll=37818,cl=37819,hl=37820,ul=37821,fl=36492,dl=36494,pl=36495,ml=36283,gl=36284,xa=36285,xl=36286,vf=3200,_a=0,Mf=1,Pn="",Be="srgb",va="srgb-linear",Ma="linear",oe="srgb",os=7680,xc=519,yf=512,bf=513,Sf=514,Ul=515,wf=516,Ef=517,Nl=518,Tf=519,_l=35044,rr=35048,_c="300 es",Xi=2e3,fr=2001;function Af(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}function ya(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function Rf(){const s=ya("canvas");return s.style.display="block",s}const vc={};function ba(...s){const t="THREE."+s.shift();console.log(t,...s)}function Jh(s){const t=s[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=s[1];e&&e.isStackTrace?s[0]+=" "+e.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function It(...s){s=Jh(s);const t="THREE."+s.shift();{const e=s[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...s)}}function Qt(...s){s=Jh(s);const t="THREE."+s.shift();{const e=s[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...s)}}function Cs(...s){const t=s.join(" ");t in vc||(vc[t]=!0,It(...s))}function Cf(s,t,e){return new Promise(function(i,n){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:n();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:i()}}setTimeout(r,e)})}const Pf={[Uo]:No,[Fo]:Bo,[Oo]:zo,[Ls]:ko,[No]:Uo,[Bo]:Fo,[zo]:Oo,[ko]:Ls};class ns{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){const i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){const i=this._listeners;if(i===void 0)return;const n=i[t];if(n!==void 0){const r=n.indexOf(e);r!==-1&&n.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const i=e[t.type];if(i!==void 0){t.target=this;const n=i.slice(0);for(let r=0,a=n.length;r<a;r++)n[r].call(this,t);t.target=null}}}const ei=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Mc=1234567;const ar=Math.PI/180,dr=180/Math.PI;function Ki(){const s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(ei[s&255]+ei[s>>8&255]+ei[s>>16&255]+ei[s>>24&255]+"-"+ei[t&255]+ei[t>>8&255]+"-"+ei[t>>16&15|64]+ei[t>>24&255]+"-"+ei[e&63|128]+ei[e>>8&255]+"-"+ei[e>>16&255]+ei[e>>24&255]+ei[i&255]+ei[i>>8&255]+ei[i>>16&255]+ei[i>>24&255]).toLowerCase()}function Zt(s,t,e){return Math.max(t,Math.min(e,s))}function Fl(s,t){return(s%t+t)%t}function If(s,t,e,i,n){return i+(s-t)*(n-i)/(e-t)}function Lf(s,t,e){return s!==t?(e-s)/(t-s):0}function or(s,t,e){return(1-e)*s+e*t}function Df(s,t,e,i){return or(s,t,1-Math.exp(-e*i))}function Uf(s,t=1){return t-Math.abs(Fl(s,t*2)-t)}function Nf(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*(3-2*s))}function Ff(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*s*(s*(s*6-15)+10))}function Of(s,t){return s+Math.floor(Math.random()*(t-s+1))}function kf(s,t){return s+Math.random()*(t-s)}function Bf(s){return s*(.5-Math.random())}function zf(s){s!==void 0&&(Mc=s);let t=Mc+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Hf(s){return s*ar}function Gf(s){return s*dr}function Vf(s){return(s&s-1)===0&&s!==0}function Wf(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Xf(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function Yf(s,t,e,i,n){const r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+i)/2),u=a((t+i)/2),f=r((t-i)/2),h=a((t-i)/2),d=r((i-t)/2),g=a((i-t)/2);switch(n){case"XYX":s.set(o*u,l*f,l*h,o*c);break;case"YZY":s.set(l*h,o*u,l*f,o*c);break;case"ZXZ":s.set(l*f,l*h,o*u,o*c);break;case"XZX":s.set(o*u,l*g,l*d,o*c);break;case"YXY":s.set(l*d,o*u,l*g,o*c);break;case"ZYZ":s.set(l*g,l*d,o*u,o*c);break;default:It("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Ni(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return s/4294967295;case Uint16Array:return s/65535;case Uint8Array:return s/255;case Int32Array:return Math.max(s/2147483647,-1);case Int16Array:return Math.max(s/32767,-1);case Int8Array:return Math.max(s/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function le(s,t){switch(t.constructor){case Float32Array:return s;case Uint32Array:return Math.round(s*4294967295);case Uint16Array:return Math.round(s*65535);case Uint8Array:return Math.round(s*255);case Int32Array:return Math.round(s*2147483647);case Int16Array:return Math.round(s*32767);case Int8Array:return Math.round(s*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Ps={DEG2RAD:ar,RAD2DEG:dr,generateUUID:Ki,clamp:Zt,euclideanModulo:Fl,mapLinear:If,inverseLerp:Lf,lerp:or,damp:Df,pingpong:Uf,smoothstep:Nf,smootherstep:Ff,randInt:Of,randFloat:kf,randFloatSpread:Bf,seededRandom:zf,degToRad:Hf,radToDeg:Gf,isPowerOfTwo:Vf,ceilPowerOfTwo:Wf,floorPowerOfTwo:Xf,setQuaternionFromProperEuler:Yf,normalize:le,denormalize:Ni};class Ut{static{Ut.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,n=t.elements;return this.x=n[0]*e+n[3]*i+n[6],this.y=n[1]*e+n[4]*i+n[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Zt(this.x,t.x,e.x),this.y=Zt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Zt(this.x,t,e),this.y=Zt(this.y,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Zt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),n=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*i-a*n+t.x,this.y=r*n+a*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class ni{constructor(t=0,e=0,i=0,n=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=n}static slerpFlat(t,e,i,n,r,a,o){let l=i[n+0],c=i[n+1],u=i[n+2],f=i[n+3],h=r[a+0],d=r[a+1],g=r[a+2],y=r[a+3];if(f!==y||l!==h||c!==d||u!==g){let m=l*h+c*d+u*g+f*y;m<0&&(h=-h,d=-d,g=-g,y=-y,m=-m);let p=1-o;if(m<.9995){const b=Math.acos(m),S=Math.sin(b);p=Math.sin(p*b)/S,o=Math.sin(o*b)/S,l=l*p+h*o,c=c*p+d*o,u=u*p+g*o,f=f*p+y*o}else{l=l*p+h*o,c=c*p+d*o,u=u*p+g*o,f=f*p+y*o;const b=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=b,c*=b,u*=b,f*=b}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,i,n,r,a){const o=i[n],l=i[n+1],c=i[n+2],u=i[n+3],f=r[a],h=r[a+1],d=r[a+2],g=r[a+3];return t[e]=o*g+u*f+l*d-c*h,t[e+1]=l*g+u*h+c*f-o*d,t[e+2]=c*g+u*d+o*h-l*f,t[e+3]=u*g-o*f-l*h-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,n){return this._x=t,this._y=e,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,n=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(i/2),u=o(n/2),f=o(r/2),h=l(i/2),d=l(n/2),g=l(r/2);switch(a){case"XYZ":this._x=h*u*f+c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f-h*d*g;break;case"YXZ":this._x=h*u*f+c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f+h*d*g;break;case"ZXY":this._x=h*u*f-c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f-h*d*g;break;case"ZYX":this._x=h*u*f-c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f+h*d*g;break;case"YZX":this._x=h*u*f+c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f-h*d*g;break;case"XZY":this._x=h*u*f-c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f+h*d*g;break;default:It("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,n=Math.sin(i);return this._x=t.x*n,this._y=t.y*n,this._z=t.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],n=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],f=e[10],h=i+o+f;if(h>0){const d=.5/Math.sqrt(h+1);this._w=.25/d,this._x=(u-l)*d,this._y=(r-c)*d,this._z=(a-n)*d}else if(i>o&&i>f){const d=2*Math.sqrt(1+i-o-f);this._w=(u-l)/d,this._x=.25*d,this._y=(n+a)/d,this._z=(r+c)/d}else if(o>f){const d=2*Math.sqrt(1+o-i-f);this._w=(r-c)/d,this._x=(n+a)/d,this._y=.25*d,this._z=(l+u)/d}else{const d=2*Math.sqrt(1+f-i-o);this._w=(a-n)/d,this._x=(r+c)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Zt(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const n=Math.min(1,e/i);return this.slerp(t,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,n=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=i*u+a*o+n*c-r*l,this._y=n*u+a*l+r*o-i*c,this._z=r*u+a*c+i*l-n*o,this._w=a*u-i*o-n*l-r*c,this._onChangeCallback(),this}slerp(t,e){let i=t._x,n=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(i=-i,n=-n,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){const c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,e=Math.sin(e*c)/u,this._x=this._x*l+i*e,this._y=this._y*l+n*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+i*e,this._y=this._y*l+n*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),n=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(n*Math.sin(t),n*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class T{static{T.prototype.isVector3=!0}constructor(t=0,e=0,i=0){this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(yc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(yc.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,n=this.z,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6]*n,this.y=r[1]*e+r[4]*i+r[7]*n,this.z=r[2]*e+r[5]*i+r[8]*n,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,n=this.z,r=t.elements,a=1/(r[3]*e+r[7]*i+r[11]*n+r[15]);return this.x=(r[0]*e+r[4]*i+r[8]*n+r[12])*a,this.y=(r[1]*e+r[5]*i+r[9]*n+r[13])*a,this.z=(r[2]*e+r[6]*i+r[10]*n+r[14])*a,this}applyQuaternion(t){const e=this.x,i=this.y,n=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*n-o*i),u=2*(o*e-r*n),f=2*(r*i-a*e);return this.x=e+l*c+a*f-o*u,this.y=i+l*u+o*c-r*f,this.z=n+l*f+r*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,n=this.z,r=t.elements;return this.x=r[0]*e+r[4]*i+r[8]*n,this.y=r[1]*e+r[5]*i+r[9]*n,this.z=r[2]*e+r[6]*i+r[10]*n,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Zt(this.x,t.x,e.x),this.y=Zt(this.y,t.y,e.y),this.z=Zt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Zt(this.x,t,e),this.y=Zt(this.y,t,e),this.z=Zt(this.z,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,n=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=n*l-r*o,this.y=r*a-i*l,this.z=i*o-n*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return Wa.copy(this).projectOnVector(t),this.sub(Wa)}reflect(t){return this.sub(Wa.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Zt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,n=this.z-t.z;return e*e+i*i+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const n=Math.sin(e)*t;return this.x=n*Math.sin(i),this.y=Math.cos(e)*t,this.z=n*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),n=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=n,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Wa=new T,yc=new ni;class kt{static{kt.prototype.isMatrix3=!0}constructor(t,e,i,n,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,n,r,a,o,l,c)}set(t,e,i,n,r,a,o,l,c){const u=this.elements;return u[0]=t,u[1]=n,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=i,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,n=e.elements,r=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],u=i[4],f=i[7],h=i[2],d=i[5],g=i[8],y=n[0],m=n[3],p=n[6],b=n[1],S=n[4],v=n[7],R=n[2],w=n[5],C=n[8];return r[0]=a*y+o*b+l*R,r[3]=a*m+o*S+l*w,r[6]=a*p+o*v+l*C,r[1]=c*y+u*b+f*R,r[4]=c*m+u*S+f*w,r[7]=c*p+u*v+f*C,r[2]=h*y+d*b+g*R,r[5]=h*m+d*S+g*w,r[8]=h*p+d*v+g*C,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],n=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-i*r*u+i*o*l+n*r*c-n*a*l}invert(){const t=this.elements,e=t[0],i=t[1],n=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=u*a-o*c,h=o*l-u*r,d=c*r-a*l,g=e*f+i*h+n*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/g;return t[0]=f*y,t[1]=(n*c-u*i)*y,t[2]=(o*i-n*a)*y,t[3]=h*y,t[4]=(u*e-n*l)*y,t[5]=(n*r-o*e)*y,t[6]=d*y,t[7]=(i*l-c*e)*y,t[8]=(a*e-i*r)*y,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,n,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*a+c*o)+a+t,-n*c,n*l,-n*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return Cs("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Xa.makeScale(t,e)),this}rotate(t){return Cs("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Xa.makeRotation(-t)),this}translate(t,e){return Cs("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Xa.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let n=0;n<9;n++)if(e[n]!==i[n])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Xa=new kt,bc=new kt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Sc=new kt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function qf(){const s={enabled:!0,workingColorSpace:va,spaces:{},convert:function(n,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===oe&&(n.r=cn(n.r),n.g=cn(n.g),n.b=cn(n.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(n.applyMatrix3(this.spaces[r].toXYZ),n.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===oe&&(n.r=Is(n.r),n.g=Is(n.g),n.b=Is(n.b))),n},workingToColorSpace:function(n,r){return this.convert(n,this.workingColorSpace,r)},colorSpaceToWorking:function(n,r){return this.convert(n,r,this.workingColorSpace)},getPrimaries:function(n){return this.spaces[n].primaries},getTransfer:function(n){return n===Pn?Ma:this.spaces[n].transfer},getToneMappingMode:function(n){return this.spaces[n].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(n,r=this.workingColorSpace){return n.fromArray(this.spaces[r].luminanceCoefficients)},define:function(n){Object.assign(this.spaces,n)},_getMatrix:function(n,r,a){return n.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(n){return this.spaces[n].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(n=this.workingColorSpace){return this.spaces[n].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(n,r){return Cs("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),s.workingToColorSpace(n,r)},toWorkingColorSpace:function(n,r){return Cs("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),s.colorSpaceToWorking(n,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],i=[.3127,.329];return s.define({[va]:{primaries:t,whitePoint:i,transfer:Ma,toXYZ:bc,fromXYZ:Sc,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Be},outputColorSpaceConfig:{drawingBufferColorSpace:Be}},[Be]:{primaries:t,whitePoint:i,transfer:oe,toXYZ:bc,fromXYZ:Sc,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Be}}}),s}const jt=qf();function cn(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function Is(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let ls;class Kf{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{ls===void 0&&(ls=ya("canvas")),ls.width=t.width,ls.height=t.height;const n=ls.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),i=ls}return i.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=ya("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const n=i.getImageData(0,0,t.width,t.height),r=n.data;for(let a=0;a<r.length;a++)r[a]=cn(r[a]/255)*255;return i.putImageData(n,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(cn(e[i]/255)*255):e[i]=cn(e[i]);return{data:e,width:t.width,height:t.height}}else return It("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Zf=0;class Ol{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Zf++}),this.uuid=Ki(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let r;if(Array.isArray(n)){r=[];for(let a=0,o=n.length;a<o;a++)n[a].isDataTexture?r.push(Ya(n[a].image)):r.push(Ya(n[a]))}else r=Ya(n);i.url=r}return e||(t.images[this.uuid]=i),i}}function Ya(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?Kf.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(It("Texture: Unable to serialize Texture."),{})}let $f=0;const qa=new T;class si extends ns{constructor(t=si.DEFAULT_IMAGE,e=si.DEFAULT_MAPPING,i=$e,n=$e,r=Qe,a=Kn,o=Ai,l=Mi,c=si.DEFAULT_ANISOTROPY,u=Pn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:$f++}),this.uuid=Ki(),this.name="",this.source=new Ol(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ut(0,0),this.repeat=new Ut(1,1),this.center=new Ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new kt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(qa).x}get height(){return this.source.getSize(qa).y}get depth(){return this.source.getSize(qa).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const i=t[e];if(i===void 0){It(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const n=this[e];if(n===void 0){It(`Texture.setValues(): property '${e}' does not exist.`);continue}n&&i&&n.isVector2&&i.isVector2||n&&i&&n.isVector3&&i.isVector3||n&&i&&n.isMatrix3&&i.isMatrix3?n.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Wh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Us:t.x=t.x-Math.floor(t.x);break;case $e:t.x=t.x<0?0:1;break;case Ho:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Us:t.y=t.y-Math.floor(t.y);break;case $e:t.y=t.y<0?0:1;break;case Ho:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}si.DEFAULT_IMAGE=null;si.DEFAULT_MAPPING=Wh;si.DEFAULT_ANISOTROPY=1;class he{static{he.prototype.isVector4=!0}constructor(t=0,e=0,i=0,n=1){this.x=t,this.y=e,this.z=i,this.w=n}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,n){return this.x=t,this.y=e,this.z=i,this.w=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,n=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*n+a[12]*r,this.y=a[1]*e+a[5]*i+a[9]*n+a[13]*r,this.z=a[2]*e+a[6]*i+a[10]*n+a[14]*r,this.w=a[3]*e+a[7]*i+a[11]*n+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,n,r;const l=t.elements,c=l[0],u=l[4],f=l[8],h=l[1],d=l[5],g=l[9],y=l[2],m=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(f-y)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+y)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const S=(c+1)/2,v=(d+1)/2,R=(p+1)/2,w=(u+h)/4,C=(f+y)/4,_=(g+m)/4;return S>v&&S>R?S<.01?(i=0,n=.707106781,r=.707106781):(i=Math.sqrt(S),n=w/i,r=C/i):v>R?v<.01?(i=.707106781,n=0,r=.707106781):(n=Math.sqrt(v),i=w/n,r=_/n):R<.01?(i=.707106781,n=.707106781,r=0):(r=Math.sqrt(R),i=C/r,n=_/r),this.set(i,n,r,e),this}let b=Math.sqrt((m-g)*(m-g)+(f-y)*(f-y)+(h-u)*(h-u));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(f-y)/b,this.z=(h-u)/b,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Zt(this.x,t.x,e.x),this.y=Zt(this.y,t.y,e.y),this.z=Zt(this.z,t.z,e.z),this.w=Zt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Zt(this.x,t,e),this.y=Zt(this.y,t,e),this.z=Zt(this.z,t,e),this.w=Zt(this.w,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Jf extends ns{constructor(t=1,e=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Qe,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=i.depth,this.scissor=new he(0,0,t,e),this.scissorTest=!1,this.viewport=new he(0,0,t,e),this.textures=[];const n={width:t,height:e,depth:i.depth},r=new si(n),a=i.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Qe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let n=0,r=this.textures.length;n<r;n++)this.textures[n].image.width=t,this.textures[n].image.height=e,this.textures[n].image.depth=i,this.textures[n].isData3DTexture!==!0&&(this.textures[n].isArrayTexture=this.textures[n].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,i=t.textures.length;e<i;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const n=Object.assign({},t.textures[e].image);this.textures[e].source=new Ol(n)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class ki extends Jf{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class Qh extends si{constructor(t=null,e=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:n},this.magFilter=Je,this.minFilter=Je,this.wrapR=$e,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Qf extends si{constructor(t=null,e=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:n},this.magFilter=Je,this.minFilter=Je,this.wrapR=$e,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Bt{static{Bt.prototype.isMatrix4=!0}constructor(t,e,i,n,r,a,o,l,c,u,f,h,d,g,y,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,n,r,a,o,l,c,u,f,h,d,g,y,m)}set(t,e,i,n,r,a,o,l,c,u,f,h,d,g,y,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=i,p[12]=n,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=f,p[14]=h,p[3]=d,p[7]=g,p[11]=y,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Bt().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,i=t.elements,n=1/cs.setFromMatrixColumn(t,0).length(),r=1/cs.setFromMatrixColumn(t,1).length(),a=1/cs.setFromMatrixColumn(t,2).length();return e[0]=i[0]*n,e[1]=i[1]*n,e[2]=i[2]*n,e[3]=0,e[4]=i[4]*r,e[5]=i[5]*r,e[6]=i[6]*r,e[7]=0,e[8]=i[8]*a,e[9]=i[9]*a,e[10]=i[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,n=t.y,r=t.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(n),c=Math.sin(n),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){const h=a*u,d=a*f,g=o*u,y=o*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=d+g*c,e[5]=h-y*c,e[9]=-o*l,e[2]=y-h*c,e[6]=g+d*c,e[10]=a*l}else if(t.order==="YXZ"){const h=l*u,d=l*f,g=c*u,y=c*f;e[0]=h+y*o,e[4]=g*o-d,e[8]=a*c,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=d*o-g,e[6]=y+h*o,e[10]=a*l}else if(t.order==="ZXY"){const h=l*u,d=l*f,g=c*u,y=c*f;e[0]=h-y*o,e[4]=-a*f,e[8]=g+d*o,e[1]=d+g*o,e[5]=a*u,e[9]=y-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const h=a*u,d=a*f,g=o*u,y=o*f;e[0]=l*u,e[4]=g*c-d,e[8]=h*c+y,e[1]=l*f,e[5]=y*c+h,e[9]=d*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const h=a*l,d=a*c,g=o*l,y=o*c;e[0]=l*u,e[4]=y-h*f,e[8]=g*f+d,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=d*f+g,e[10]=h-y*f}else if(t.order==="XZY"){const h=a*l,d=a*c,g=o*l,y=o*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=h*f+y,e[5]=a*u,e[9]=d*f-g,e[2]=g*f-d,e[6]=o*u,e[10]=y*f+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(jf,t,td)}lookAt(t,e,i){const n=this.elements;return _i.subVectors(t,e),_i.lengthSq()===0&&(_i.z=1),_i.normalize(),Mn.crossVectors(i,_i),Mn.lengthSq()===0&&(Math.abs(i.z)===1?_i.x+=1e-4:_i.z+=1e-4,_i.normalize(),Mn.crossVectors(i,_i)),Mn.normalize(),Rr.crossVectors(_i,Mn),n[0]=Mn.x,n[4]=Rr.x,n[8]=_i.x,n[1]=Mn.y,n[5]=Rr.y,n[9]=_i.y,n[2]=Mn.z,n[6]=Rr.z,n[10]=_i.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,n=e.elements,r=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],u=i[1],f=i[5],h=i[9],d=i[13],g=i[2],y=i[6],m=i[10],p=i[14],b=i[3],S=i[7],v=i[11],R=i[15],w=n[0],C=n[4],_=n[8],E=n[12],P=n[1],I=n[5],L=n[9],X=n[13],Z=n[2],N=n[6],V=n[10],k=n[14],K=n[3],tt=n[7],at=n[11],lt=n[15];return r[0]=a*w+o*P+l*Z+c*K,r[4]=a*C+o*I+l*N+c*tt,r[8]=a*_+o*L+l*V+c*at,r[12]=a*E+o*X+l*k+c*lt,r[1]=u*w+f*P+h*Z+d*K,r[5]=u*C+f*I+h*N+d*tt,r[9]=u*_+f*L+h*V+d*at,r[13]=u*E+f*X+h*k+d*lt,r[2]=g*w+y*P+m*Z+p*K,r[6]=g*C+y*I+m*N+p*tt,r[10]=g*_+y*L+m*V+p*at,r[14]=g*E+y*X+m*k+p*lt,r[3]=b*w+S*P+v*Z+R*K,r[7]=b*C+S*I+v*N+R*tt,r[11]=b*_+S*L+v*V+R*at,r[15]=b*E+S*X+v*k+R*lt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],n=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],f=t[6],h=t[10],d=t[14],g=t[3],y=t[7],m=t[11],p=t[15],b=l*d-c*h,S=o*d-c*f,v=o*h-l*f,R=a*d-c*u,w=a*h-l*u,C=a*f-o*u;return e*(y*b-m*S+p*v)-i*(g*b-m*R+p*w)+n*(g*S-y*R+p*C)-r*(g*v-y*w+m*C)}determinantAffine(){const t=this.elements,e=t[0],i=t[4],n=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],u=t[10];return e*(a*u-o*c)-i*(r*u-o*l)+n*(r*c-a*l)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const n=this.elements;return t.isVector3?(n[12]=t.x,n[13]=t.y,n[14]=t.z):(n[12]=t,n[13]=e,n[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],n=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=t[9],h=t[10],d=t[11],g=t[12],y=t[13],m=t[14],p=t[15],b=e*o-i*a,S=e*l-n*a,v=e*c-r*a,R=i*l-n*o,w=i*c-r*o,C=n*c-r*l,_=u*y-f*g,E=u*m-h*g,P=u*p-d*g,I=f*m-h*y,L=f*p-d*y,X=h*p-d*m,Z=b*X-S*L+v*I+R*P-w*E+C*_;if(Z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const N=1/Z;return t[0]=(o*X-l*L+c*I)*N,t[1]=(n*L-i*X-r*I)*N,t[2]=(y*C-m*w+p*R)*N,t[3]=(h*w-f*C-d*R)*N,t[4]=(l*P-a*X-c*E)*N,t[5]=(e*X-n*P+r*E)*N,t[6]=(m*v-g*C-p*S)*N,t[7]=(u*C-h*v+d*S)*N,t[8]=(a*L-o*P+c*_)*N,t[9]=(i*P-e*L-r*_)*N,t[10]=(g*w-y*v+p*b)*N,t[11]=(f*v-u*w-d*b)*N,t[12]=(o*E-a*I-l*_)*N,t[13]=(e*I-i*E+n*_)*N,t[14]=(y*S-g*R-m*b)*N,t[15]=(u*R-f*S+h*b)*N,this}scale(t){const e=this.elements,i=t.x,n=t.y,r=t.z;return e[0]*=i,e[4]*=n,e[8]*=r,e[1]*=i,e[5]*=n,e[9]*=r,e[2]*=i,e[6]*=n,e[10]*=r,e[3]*=i,e[7]*=n,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],n=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,n))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),n=Math.sin(e),r=1-i,a=t.x,o=t.y,l=t.z,c=r*a,u=r*o;return this.set(c*a+i,c*o-n*l,c*l+n*o,0,c*o+n*l,u*o+i,u*l-n*a,0,c*l-n*o,u*l+n*a,r*l*l+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,n,r,a){return this.set(1,i,r,0,t,1,a,0,e,n,1,0,0,0,0,1),this}compose(t,e,i){const n=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,u=a+a,f=o+o,h=r*c,d=r*u,g=r*f,y=a*u,m=a*f,p=o*f,b=l*c,S=l*u,v=l*f,R=i.x,w=i.y,C=i.z;return n[0]=(1-(y+p))*R,n[1]=(d+v)*R,n[2]=(g-S)*R,n[3]=0,n[4]=(d-v)*w,n[5]=(1-(h+p))*w,n[6]=(m+b)*w,n[7]=0,n[8]=(g+S)*C,n[9]=(m-b)*C,n[10]=(1-(h+y))*C,n[11]=0,n[12]=t.x,n[13]=t.y,n[14]=t.z,n[15]=1,this}decompose(t,e,i){const n=this.elements;t.x=n[12],t.y=n[13],t.z=n[14];const r=this.determinantAffine();if(r===0)return i.set(1,1,1),e.identity(),this;let a=cs.set(n[0],n[1],n[2]).length();const o=cs.set(n[4],n[5],n[6]).length(),l=cs.set(n[8],n[9],n[10]).length();r<0&&(a=-a),Pi.copy(this);const c=1/a,u=1/o,f=1/l;return Pi.elements[0]*=c,Pi.elements[1]*=c,Pi.elements[2]*=c,Pi.elements[4]*=u,Pi.elements[5]*=u,Pi.elements[6]*=u,Pi.elements[8]*=f,Pi.elements[9]*=f,Pi.elements[10]*=f,e.setFromRotationMatrix(Pi),i.x=a,i.y=o,i.z=l,this}makePerspective(t,e,i,n,r,a,o=Xi,l=!1){const c=this.elements,u=2*r/(e-t),f=2*r/(i-n),h=(e+t)/(e-t),d=(i+n)/(i-n);let g,y;if(l)g=r/(a-r),y=a*r/(a-r);else if(o===Xi)g=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===fr)g=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,i,n,r,a,o=Xi,l=!1){const c=this.elements,u=2/(e-t),f=2/(i-n),h=-(e+t)/(e-t),d=-(i+n)/(i-n);let g,y;if(l)g=1/(a-r),y=a/(a-r);else if(o===Xi)g=-2/(a-r),y=-(a+r)/(a-r);else if(o===fr)g=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let n=0;n<16;n++)if(e[n]!==i[n])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}}const cs=new T,Pi=new Bt,jf=new T(0,0,0),td=new T(1,1,1),Mn=new T,Rr=new T,_i=new T,wc=new Bt,Ec=new ni;class Ji{constructor(t=0,e=0,i=0,n=Ji.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=n}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,n=this._order){return this._x=t,this._y=e,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const n=t.elements,r=n[0],a=n[4],o=n[8],l=n[1],c=n[5],u=n[9],f=n[2],h=n[6],d=n[10];switch(e){case"XYZ":this._y=Math.asin(Zt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Zt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Zt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Zt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Zt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Zt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:It("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return wc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(wc,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Ec.setFromEuler(this),this.setFromQuaternion(Ec,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ji.DEFAULT_ORDER="XYZ";class kl{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let ed=0;const Tc=new T,hs=new ni,tn=new Bt,Cr=new T,Hs=new T,id=new T,nd=new ni,Ac=new T(1,0,0),Rc=new T(0,1,0),Cc=new T(0,0,1),Pc={type:"added"},sd={type:"removed"},us={type:"childadded",child:null},Ka={type:"childremoved",child:null};class Me extends ns{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:ed++}),this.uuid=Ki(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Me.DEFAULT_UP.clone();const t=new T,e=new Ji,i=new ni,n=new T(1,1,1);function r(){i.setFromEuler(e,!1)}function a(){e.setFromQuaternion(i,void 0,!1)}e._onChange(r),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new Bt},normalMatrix:{value:new kt}}),this.matrix=new Bt,this.matrixWorld=new Bt,this.matrixAutoUpdate=Me.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Me.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new kl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return hs.setFromAxisAngle(t,e),this.quaternion.multiply(hs),this}rotateOnWorldAxis(t,e){return hs.setFromAxisAngle(t,e),this.quaternion.premultiply(hs),this}rotateX(t){return this.rotateOnAxis(Ac,t)}rotateY(t){return this.rotateOnAxis(Rc,t)}rotateZ(t){return this.rotateOnAxis(Cc,t)}translateOnAxis(t,e){return Tc.copy(t).applyQuaternion(this.quaternion),this.position.add(Tc.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ac,t)}translateY(t){return this.translateOnAxis(Rc,t)}translateZ(t){return this.translateOnAxis(Cc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(tn.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?Cr.copy(t):Cr.set(t,e,i);const n=this.parent;this.updateWorldMatrix(!0,!1),Hs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?tn.lookAt(Hs,Cr,this.up):tn.lookAt(Cr,Hs,this.up),this.quaternion.setFromRotationMatrix(tn),n&&(tn.extractRotation(n.matrixWorld),hs.setFromRotationMatrix(tn),this.quaternion.premultiply(hs.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Qt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Pc),us.child=t,this.dispatchEvent(us),us.child=null):Qt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(sd),Ka.child=t,this.dispatchEvent(Ka),Ka.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),tn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),tn.multiply(t.parent.matrixWorld)),t.applyMatrix4(tn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Pc),us.child=t,this.dispatchEvent(us),us.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,n=this.children.length;i<n;i++){const a=this.children[i].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const n=this.children;for(let r=0,a=n.length;r<a;r++)n[r].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Hs,t,id),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Hs,nd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,i=t.y,n=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*i-r[8]*n,r[13]+=i-r[1]*e-r[5]*i-r[9]*n,r[14]+=n-r[2]*e-r[6]*i-r[10]*n}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,n=e.length;i<n;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e,i=!1){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),e===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,i)}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),this.static!==!1&&(n.static=this.static),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.pivot!==null&&(n.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(n.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(n.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),n.instanceInfo=this._instanceInfo.map(o=>({...o})),n.availableInstanceIds=this._availableInstanceIds.slice(),n.availableGeometryIds=this._availableGeometryIds.slice(),n.nextIndexStart=this._nextIndexStart,n.nextVertexStart=this._nextVertexStart,n.geometryCount=this._geometryCount,n.maxInstanceCount=this._maxInstanceCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.matricesTexture=this._matricesTexture.toJSON(t),n.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(n.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(n.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(n.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));n.material=o}else n.material=r(t.materials,this.material);if(this.children.length>0){n.children=[];for(let o=0;o<this.children.length;o++)n.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){n.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];n.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),f=a(t.shapes),h=a(t.skeletons),d=a(t.animations),g=a(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),f.length>0&&(i.shapes=f),h.length>0&&(i.skeletons=h),d.length>0&&(i.animations=d),g.length>0&&(i.nodes=g)}return i.object=n,i;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const n=t.children[i];this.add(n.clone())}return this}}Me.DEFAULT_UP=new T(0,1,0);Me.DEFAULT_MATRIX_AUTO_UPDATE=!0;Me.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class pe extends Me{constructor(){super(),this.isGroup=!0,this.type="Group"}}const rd={type:"move"};class Za{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new pe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new pe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new T,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new T),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new pe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new T,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new T,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let n=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const y of t.hand.values()){const m=e.getJointPose(y,i),p=this._getHandJoint(c,y);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=u.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&h>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(n=e.getPose(t.targetRaySpace,i),n===null&&r!==null&&(n=r),n!==null&&(o.matrix.fromArray(n.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,n.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(n.linearVelocity)):o.hasLinearVelocity=!1,n.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(n.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(rd)))}return o!==null&&(o.visible=n!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new pe;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}const jh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},yn={h:0,s:0,l:0},Pr={h:0,s:0,l:0};function $a(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}class Nt{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const n=t;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Be){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,jt.colorSpaceToWorking(this,e),this}setRGB(t,e,i,n=jt.workingColorSpace){return this.r=t,this.g=e,this.b=i,jt.colorSpaceToWorking(this,n),this}setHSL(t,e,i,n=jt.workingColorSpace){if(t=Fl(t,1),e=Zt(e,0,1),i=Zt(i,0,1),e===0)this.r=this.g=this.b=i;else{const r=i<=.5?i*(1+e):i+e-i*e,a=2*i-r;this.r=$a(a,r,t+1/3),this.g=$a(a,r,t),this.b=$a(a,r,t-1/3)}return jt.colorSpaceToWorking(this,n),this}setStyle(t,e=Be){function i(r){r!==void 0&&parseFloat(r)<1&&It("Color: Alpha component of "+t+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=n[1],o=n[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:It("Color: Unknown color model "+t)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=n[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);It("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Be){const i=jh[t.toLowerCase()];return i!==void 0?this.setHex(i,e):It("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=cn(t.r),this.g=cn(t.g),this.b=cn(t.b),this}copyLinearToSRGB(t){return this.r=Is(t.r),this.g=Is(t.g),this.b=Is(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Be){return jt.workingToColorSpace(ii.copy(this),t),Math.round(Zt(ii.r*255,0,255))*65536+Math.round(Zt(ii.g*255,0,255))*256+Math.round(Zt(ii.b*255,0,255))}getHexString(t=Be){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=jt.workingColorSpace){jt.workingToColorSpace(ii.copy(this),e);const i=ii.r,n=ii.g,r=ii.b,a=Math.max(i,n,r),o=Math.min(i,n,r);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case i:l=(n-r)/f+(n<r?6:0);break;case n:l=(r-i)/f+2;break;case r:l=(i-n)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=jt.workingColorSpace){return jt.workingToColorSpace(ii.copy(this),e),t.r=ii.r,t.g=ii.g,t.b=ii.b,t}getStyle(t=Be){jt.workingToColorSpace(ii.copy(this),t);const e=ii.r,i=ii.g,n=ii.b;return t!==Be?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(n*255)})`}offsetHSL(t,e,i){return this.getHSL(yn),this.setHSL(yn.h+t,yn.s+e,yn.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(yn),t.getHSL(Pr);const i=or(yn.h,Pr.h,e),n=or(yn.s,Pr.s,e),r=or(yn.l,Pr.l,e);return this.setHSL(i,n,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,n=this.b,r=t.elements;return this.r=r[0]*e+r[3]*i+r[6]*n,this.g=r[1]*e+r[4]*i+r[7]*n,this.b=r[2]*e+r[5]*i+r[8]*n,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ii=new Nt;Nt.NAMES=jh;class Ia{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new Nt(t),this.near=e,this.far=i}clone(){return new Ia(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class tu extends Me{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ji,this.environmentIntensity=1,this.environmentRotation=new Ji,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const Ii=new T,en=new T,Ja=new T,nn=new T,fs=new T,ds=new T,Ic=new T,Qa=new T,ja=new T,to=new T,eo=new he,io=new he,no=new he;class Ei{constructor(t=new T,e=new T,i=new T){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,n){n.subVectors(i,e),Ii.subVectors(t,e),n.cross(Ii);const r=n.lengthSq();return r>0?n.multiplyScalar(1/Math.sqrt(r)):n.set(0,0,0)}static getBarycoord(t,e,i,n,r){Ii.subVectors(n,e),en.subVectors(i,e),Ja.subVectors(t,e);const a=Ii.dot(Ii),o=Ii.dot(en),l=Ii.dot(Ja),c=en.dot(en),u=en.dot(Ja),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;const h=1/f,d=(c*l-o*u)*h,g=(a*u-o*l)*h;return r.set(1-d-g,g,d)}static containsPoint(t,e,i,n){return this.getBarycoord(t,e,i,n,nn)===null?!1:nn.x>=0&&nn.y>=0&&nn.x+nn.y<=1}static getInterpolation(t,e,i,n,r,a,o,l){return this.getBarycoord(t,e,i,n,nn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,nn.x),l.addScaledVector(a,nn.y),l.addScaledVector(o,nn.z),l)}static getInterpolatedAttribute(t,e,i,n,r,a){return eo.setScalar(0),io.setScalar(0),no.setScalar(0),eo.fromBufferAttribute(t,e),io.fromBufferAttribute(t,i),no.fromBufferAttribute(t,n),a.setScalar(0),a.addScaledVector(eo,r.x),a.addScaledVector(io,r.y),a.addScaledVector(no,r.z),a}static isFrontFacing(t,e,i,n){return Ii.subVectors(i,e),en.subVectors(t,e),Ii.cross(en).dot(n)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,n){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[n]),this}setFromAttributeAndIndices(t,e,i,n){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Ii.subVectors(this.c,this.b),en.subVectors(this.a,this.b),Ii.cross(en).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ei.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ei.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,n,r){return Ei.getInterpolation(t,this.a,this.b,this.c,e,i,n,r)}containsPoint(t){return Ei.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ei.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,n=this.b,r=this.c;let a,o;fs.subVectors(n,i),ds.subVectors(r,i),Qa.subVectors(t,i);const l=fs.dot(Qa),c=ds.dot(Qa);if(l<=0&&c<=0)return e.copy(i);ja.subVectors(t,n);const u=fs.dot(ja),f=ds.dot(ja);if(u>=0&&f<=u)return e.copy(n);const h=l*f-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(i).addScaledVector(fs,a);to.subVectors(t,r);const d=fs.dot(to),g=ds.dot(to);if(g>=0&&d<=g)return e.copy(r);const y=d*c-l*g;if(y<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(i).addScaledVector(ds,o);const m=u*g-d*f;if(m<=0&&f-u>=0&&d-g>=0)return Ic.subVectors(r,n),o=(f-u)/(f-u+(d-g)),e.copy(n).addScaledVector(Ic,o);const p=1/(m+y+h);return a=y*p,o=h*p,e.copy(i).addScaledVector(fs,a).addScaledVector(ds,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class kn{constructor(t=new T(1/0,1/0,1/0),e=new T(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(Li.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(Li.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=Li.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const r=i.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Li):Li.fromBufferAttribute(r,a),Li.applyMatrix4(t.matrixWorld),this.expandByPoint(Li);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ir.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ir.copy(i.boundingBox)),Ir.applyMatrix4(t.matrixWorld),this.union(Ir)}const n=t.children;for(let r=0,a=n.length;r<a;r++)this.expandByObject(n[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Li),Li.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Gs),Lr.subVectors(this.max,Gs),ps.subVectors(t.a,Gs),ms.subVectors(t.b,Gs),gs.subVectors(t.c,Gs),bn.subVectors(ms,ps),Sn.subVectors(gs,ms),zn.subVectors(ps,gs);let e=[0,-bn.z,bn.y,0,-Sn.z,Sn.y,0,-zn.z,zn.y,bn.z,0,-bn.x,Sn.z,0,-Sn.x,zn.z,0,-zn.x,-bn.y,bn.x,0,-Sn.y,Sn.x,0,-zn.y,zn.x,0];return!so(e,ps,ms,gs,Lr)||(e=[1,0,0,0,1,0,0,0,1],!so(e,ps,ms,gs,Lr))?!1:(Dr.crossVectors(bn,Sn),e=[Dr.x,Dr.y,Dr.z],so(e,ps,ms,gs,Lr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Li).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Li).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(sn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),sn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),sn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),sn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),sn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),sn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),sn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),sn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(sn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const sn=[new T,new T,new T,new T,new T,new T,new T,new T],Li=new T,Ir=new kn,ps=new T,ms=new T,gs=new T,bn=new T,Sn=new T,zn=new T,Gs=new T,Lr=new T,Dr=new T,Hn=new T;function so(s,t,e,i,n){for(let r=0,a=s.length-3;r<=a;r+=3){Hn.fromArray(s,r);const o=n.x*Math.abs(Hn.x)+n.y*Math.abs(Hn.y)+n.z*Math.abs(Hn.z),l=t.dot(Hn),c=e.dot(Hn),u=i.dot(Hn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const ke=new T,Ur=new Ut;let ad=0;class Ue extends ns{constructor(t,e,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:ad++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=_l,this.updateRanges=[],this.gpuType=Ti,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let n=0,r=this.itemSize;n<r;n++)this.array[t+n]=e.array[i+n];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)Ur.fromBufferAttribute(this,e),Ur.applyMatrix3(t),this.setXY(e,Ur.x,Ur.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)ke.fromBufferAttribute(this,e),ke.applyMatrix3(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)ke.fromBufferAttribute(this,e),ke.applyMatrix4(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)ke.fromBufferAttribute(this,e),ke.applyNormalMatrix(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)ke.fromBufferAttribute(this,e),ke.transformDirection(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=Ni(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=le(i,this.array)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Ni(e,this.array)),e}setX(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Ni(e,this.array)),e}setY(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Ni(e,this.array)),e}setZ(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Ni(e,this.array)),e}setW(t,e){return this.normalized&&(e=le(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),i=le(i,this.array)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,n){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),i=le(i,this.array),n=le(n,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=n,this}setXYZW(t,e,i,n,r){return t*=this.itemSize,this.normalized&&(e=le(e,this.array),i=le(i,this.array),n=le(n,this.array),r=le(r,this.array)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=n,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==_l&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}}class Bl extends Ue{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class eu extends Ue{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class xe extends Ue{constructor(t,e,i){super(new Float32Array(t),e,i)}}const od=new kn,Vs=new T,ro=new T;class mn{constructor(t=new T,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):od.setFromPoints(t).getCenter(i);let n=0;for(let r=0,a=t.length;r<a;r++)n=Math.max(n,i.distanceToSquared(t[r]));return this.radius=Math.sqrt(n),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Vs.subVectors(t,this.center);const e=Vs.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),n=(i-this.radius)*.5;this.center.addScaledVector(Vs,n/i),this.radius+=n}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ro.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Vs.copy(t.center).add(ro)),this.expandByPoint(Vs.copy(t.center).sub(ro))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let ld=0;const Si=new Bt,ao=new Me,xs=new T,vi=new kn,Ws=new kn,Xe=new T;class Ne extends ns{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ld++}),this.uuid=Ki(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Af(t)?eu:Bl)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const r=new kt().getNormalMatrix(t);i.applyNormalMatrix(r),i.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(t),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Si.makeRotationFromQuaternion(t),this.applyMatrix4(Si),this}rotateX(t){return Si.makeRotationX(t),this.applyMatrix4(Si),this}rotateY(t){return Si.makeRotationY(t),this.applyMatrix4(Si),this}rotateZ(t){return Si.makeRotationZ(t),this.applyMatrix4(Si),this}translate(t,e,i){return Si.makeTranslation(t,e,i),this.applyMatrix4(Si),this}scale(t,e,i){return Si.makeScale(t,e,i),this.applyMatrix4(Si),this}lookAt(t){return ao.lookAt(t),ao.updateMatrix(),this.applyMatrix4(ao.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(xs).negate(),this.translate(xs.x,xs.y,xs.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const i=[];for(let n=0,r=t.length;n<r;n++){const a=t[n];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new xe(i,3))}else{const i=Math.min(t.length,e.count);for(let n=0;n<i;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&It("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new kn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Qt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new T(-1/0,-1/0,-1/0),new T(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,n=e.length;i<n;i++){const r=e[i];vi.setFromBufferAttribute(r),this.morphTargetsRelative?(Xe.addVectors(this.boundingBox.min,vi.min),this.boundingBox.expandByPoint(Xe),Xe.addVectors(this.boundingBox.max,vi.max),this.boundingBox.expandByPoint(Xe)):(this.boundingBox.expandByPoint(vi.min),this.boundingBox.expandByPoint(vi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Qt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new mn);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Qt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new T,1/0);return}if(t){const i=this.boundingSphere.center;if(vi.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];Ws.setFromBufferAttribute(o),this.morphTargetsRelative?(Xe.addVectors(vi.min,Ws.min),vi.expandByPoint(Xe),Xe.addVectors(vi.max,Ws.max),vi.expandByPoint(Xe)):(vi.expandByPoint(Ws.min),vi.expandByPoint(Ws.max))}vi.getCenter(i);let n=0;for(let r=0,a=t.count;r<a;r++)Xe.fromBufferAttribute(t,r),n=Math.max(n,i.distanceToSquared(Xe));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Xe.fromBufferAttribute(o,c),l&&(xs.fromBufferAttribute(t,c),Xe.add(xs)),n=Math.max(n,i.distanceToSquared(Xe))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&Qt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Qt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.position,n=e.normal,r=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new Ue(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new T,l[_]=new T;const c=new T,u=new T,f=new T,h=new Ut,d=new Ut,g=new Ut,y=new T,m=new T;function p(_,E,P){c.fromBufferAttribute(i,_),u.fromBufferAttribute(i,E),f.fromBufferAttribute(i,P),h.fromBufferAttribute(r,_),d.fromBufferAttribute(r,E),g.fromBufferAttribute(r,P),u.sub(c),f.sub(c),d.sub(h),g.sub(h);const I=1/(d.x*g.y-g.x*d.y);isFinite(I)&&(y.copy(u).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(I),m.copy(f).multiplyScalar(d.x).addScaledVector(u,-g.x).multiplyScalar(I),o[_].add(y),o[E].add(y),o[P].add(y),l[_].add(m),l[E].add(m),l[P].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let _=0,E=b.length;_<E;++_){const P=b[_],I=P.start,L=P.count;for(let X=I,Z=I+L;X<Z;X+=3)p(t.getX(X+0),t.getX(X+1),t.getX(X+2))}const S=new T,v=new T,R=new T,w=new T;function C(_){R.fromBufferAttribute(n,_),w.copy(R);const E=o[_];S.copy(E),S.sub(R.multiplyScalar(R.dot(E))).normalize(),v.crossVectors(w,E);const I=v.dot(l[_])<0?-1:1;a.setXYZW(_,S.x,S.y,S.z,I)}for(let _=0,E=b.length;_<E;++_){const P=b[_],I=P.start,L=P.count;for(let X=I,Z=I+L;X<Z;X+=3)C(t.getX(X+0)),C(t.getX(X+1)),C(t.getX(X+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==e.count)i=new Ue(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let h=0,d=i.count;h<d;h++)i.setXYZ(h,0,0,0);const n=new T,r=new T,a=new T,o=new T,l=new T,c=new T,u=new T,f=new T;if(t)for(let h=0,d=t.count;h<d;h+=3){const g=t.getX(h+0),y=t.getX(h+1),m=t.getX(h+2);n.fromBufferAttribute(e,g),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,m),u.subVectors(a,r),f.subVectors(n,r),u.cross(f),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,y),c.fromBufferAttribute(i,m),o.add(u),l.add(u),c.add(u),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(y,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,d=e.count;h<d;h+=3)n.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,r),f.subVectors(n,r),u.cross(f),i.setXYZ(h+0,u.x,u.y,u.z),i.setXYZ(h+1,u.x,u.y,u.z),i.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)Xe.fromBufferAttribute(t,e),Xe.normalize(),t.setXYZ(e,Xe.x,Xe.y,Xe.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,f=o.normalized,h=new c.constructor(l.length*u);let d=0,g=0;for(let y=0,m=l.length;y<m;y++){o.isInterleavedBufferAttribute?d=l[y]*o.data.stride+o.offset:d=l[y]*u;for(let p=0;p<u;p++)h[g++]=c[d++]}return new Ue(h,u,f)}if(this.index===null)return It("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Ne,i=this.index.array,n=this.attributes;for(const o in n){const l=n[o],c=t(l,i);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let u=0,f=c.length;u<f;u++){const h=c[u],d=t(h,i);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const l in i){const c=i[l];t.data.attributes[l]=c.toJSON(t.data)}const n={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let f=0,h=c.length;f<h;f++){const d=c[f];u.push(d.toJSON(t.data))}u.length>0&&(n[l]=u,r=!0)}r&&(t.data.morphAttributes=n,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone());const n=t.attributes;for(const c in n){const u=n[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],f=r[c];for(let h=0,d=f.length;h<d;h++)u.push(f[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,u=a.length;c<u;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}class cd{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=_l,this.updateRanges=[],this.version=0,this.uuid=Ki()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,i){t*=this.stride,i*=e.stride;for(let n=0,r=this.stride;n<r;n++)this.array[t+n]=e.array[i+n];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ki()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(e,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Ki()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const ri=new T;class Sa{constructor(t,e,i,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=i,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,i=this.data.count;e<i;e++)ri.fromBufferAttribute(this,e),ri.applyMatrix4(t),this.setXYZ(e,ri.x,ri.y,ri.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)ri.fromBufferAttribute(this,e),ri.applyNormalMatrix(t),this.setXYZ(e,ri.x,ri.y,ri.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)ri.fromBufferAttribute(this,e),ri.transformDirection(t),this.setXYZ(e,ri.x,ri.y,ri.z);return this}getComponent(t,e){let i=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(i=Ni(i,this.array)),i}setComponent(t,e,i){return this.normalized&&(i=le(i,this.array)),this.data.array[t*this.data.stride+this.offset+e]=i,this}setX(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=le(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=Ni(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=Ni(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=Ni(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=Ni(e,this.array)),e}setXY(t,e,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),i=le(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this}setXYZ(t,e,i,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),i=le(i,this.array),n=le(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=n,this}setXYZW(t,e,i,n,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=le(e,this.array),i=le(i,this.array),n=le(n,this.array),r=le(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=i,this.data.array[t+2]=n,this.data.array[t+3]=r,this}clone(t){if(t===void 0){ba("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const n=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[n+r])}return new Ue(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Sa(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){ba("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let i=0;i<this.count;i++){const n=i*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[n+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}let hd=0;class gn extends ns{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:hd++}),this.uuid=Ki(),this.name="",this.type="Material",this.blending=$n,this.side=Dn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Lo,this.blendDst=Do,this.blendEquation=Xn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Nt(0,0,0),this.blendAlpha=0,this.depthFunc=Ls,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=xc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=os,this.stencilZFail=os,this.stencilZPass=os,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){It(`Material: parameter '${e}' has value of undefined.`);continue}const n=this[e];if(n===void 0){It(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(i):n&&n.isVector2&&i&&i.isVector2||n&&n.isEuler&&i&&i.isEuler||n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==$n&&(i.blending=this.blending),this.side!==Dn&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==Lo&&(i.blendSrc=this.blendSrc),this.blendDst!==Do&&(i.blendDst=this.blendDst),this.blendEquation!==Xn&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==Ls&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==xc&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==os&&(i.stencilFail=this.stencilFail),this.stencilZFail!==os&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==os&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function n(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=n(t.textures),a=n(t.images);r.length>0&&(i.textures=r),a.length>0&&(i.images=a)}return i}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Nt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ut().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ut().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const n=e.length;i=new Array(n);for(let r=0;r!==n;++r)i[r]=e[r].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class zl extends gn{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Nt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let _s;const Xs=new T,vs=new T,Ms=new T,ys=new Ut,Ys=new Ut,iu=new Bt,Nr=new T,qs=new T,Fr=new T,Lc=new Ut,oo=new Ut,Dc=new Ut;class nu extends Me{constructor(t=new zl){if(super(),this.isSprite=!0,this.type="Sprite",_s===void 0){_s=new Ne;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new cd(e,5);_s.setIndex([0,1,2,0,2,3]),_s.setAttribute("position",new Sa(i,3,0,!1)),_s.setAttribute("uv",new Sa(i,2,3,!1))}this.geometry=_s,this.material=t,this.center=new Ut(.5,.5),this.count=1}raycast(t,e){t.camera===null&&Qt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),vs.setFromMatrixScale(this.matrixWorld),iu.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Ms.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&vs.multiplyScalar(-Ms.z);const i=this.material.rotation;let n,r;i!==0&&(r=Math.cos(i),n=Math.sin(i));const a=this.center;Or(Nr.set(-.5,-.5,0),Ms,a,vs,n,r),Or(qs.set(.5,-.5,0),Ms,a,vs,n,r),Or(Fr.set(.5,.5,0),Ms,a,vs,n,r),Lc.set(0,0),oo.set(1,0),Dc.set(1,1);let o=t.ray.intersectTriangle(Nr,qs,Fr,!1,Xs);if(o===null&&(Or(qs.set(-.5,.5,0),Ms,a,vs,n,r),oo.set(0,1),o=t.ray.intersectTriangle(Nr,Fr,qs,!1,Xs),o===null))return;const l=t.ray.origin.distanceTo(Xs);l<t.near||l>t.far||e.push({distance:l,point:Xs.clone(),uv:Ei.getInterpolation(Xs,Nr,qs,Fr,Lc,oo,Dc,new Ut),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function Or(s,t,e,i,n,r){ys.subVectors(s,e).addScalar(.5).multiply(i),n!==void 0?(Ys.x=r*ys.x-n*ys.y,Ys.y=n*ys.x+r*ys.y):Ys.copy(ys),s.copy(t),s.x+=Ys.x,s.y+=Ys.y,s.applyMatrix4(iu)}const rn=new T,lo=new T,kr=new T,wn=new T,co=new T,Br=new T,ho=new T;class xr{constructor(t=new T,e=new T(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,rn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=rn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(rn.copy(this.origin).addScaledVector(this.direction,e),rn.distanceToSquared(t))}distanceSqToSegment(t,e,i,n){lo.copy(t).add(e).multiplyScalar(.5),kr.copy(e).sub(t).normalize(),wn.copy(this.origin).sub(lo);const r=t.distanceTo(e)*.5,a=-this.direction.dot(kr),o=wn.dot(this.direction),l=-wn.dot(kr),c=wn.lengthSq(),u=Math.abs(1-a*a);let f,h,d,g;if(u>0)if(f=a*l-o,h=a*o-l,g=r*u,f>=0)if(h>=-g)if(h<=g){const y=1/u;f*=y,h*=y,d=f*(f+a*h+2*o)+h*(a*f+h+2*l)+c}else h=r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h=-r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h<=-g?(f=Math.max(0,-(-a*r+o)),h=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+h*(h+2*l)+c):h<=g?(f=0,h=Math.min(Math.max(-r,-l),r),d=h*(h+2*l)+c):(f=Math.max(0,-(a*r+o)),h=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+h*(h+2*l)+c);else h=a>0?-r:r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),n&&n.copy(lo).addScaledVector(kr,h),d}intersectSphere(t,e){rn.subVectors(t.center,this.origin);const i=rn.dot(this.direction),n=rn.dot(rn)-i*i,r=t.radius*t.radius;if(n>r)return null;const a=Math.sqrt(r-n),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,n,r,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(i=(t.min.x-h.x)*c,n=(t.max.x-h.x)*c):(i=(t.max.x-h.x)*c,n=(t.min.x-h.x)*c),u>=0?(r=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),i>a||r>n||((r>i||isNaN(i))&&(i=r),(a<n||isNaN(n))&&(n=a),f>=0?(o=(t.min.z-h.z)*f,l=(t.max.z-h.z)*f):(o=(t.max.z-h.z)*f,l=(t.min.z-h.z)*f),i>l||o>n)||((o>i||i!==i)&&(i=o),(l<n||n!==n)&&(n=l),n<0)?null:this.at(i>=0?i:n,e)}intersectsBox(t){return this.intersectBox(t,rn)!==null}intersectTriangle(t,e,i,n,r){co.subVectors(e,t),Br.subVectors(i,t),ho.crossVectors(co,Br);let a=this.direction.dot(ho),o;if(a>0){if(n)return null;o=1}else if(a<0)o=-1,a=-a;else return null;wn.subVectors(this.origin,t);const l=o*this.direction.dot(Br.crossVectors(wn,Br));if(l<0)return null;const c=o*this.direction.dot(co.cross(wn));if(c<0||l+c>a)return null;const u=-o*wn.dot(ho);return u<0?null:this.at(u/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Wt extends gn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ji,this.combine=Ca,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Uc=new Bt,Gn=new xr,zr=new mn,Nc=new T,Hr=new T,Gr=new T,Vr=new T,uo=new T,Wr=new T,Fc=new T,Xr=new T;class Vt extends Me{constructor(t=new Ne,e=new Wt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=n.length;r<a;r++){const o=n[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const i=this.geometry,n=i.attributes.position,r=i.morphAttributes.position,a=i.morphTargetsRelative;e.fromBufferAttribute(n,t);const o=this.morphTargetInfluences;if(r&&o){Wr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=o[l],f=r[l];u!==0&&(uo.fromBufferAttribute(f,t),a?Wr.addScaledVector(uo,u):Wr.addScaledVector(uo.sub(e),u))}e.add(Wr)}return e}raycast(t,e){const i=this.geometry,n=this.material,r=this.matrixWorld;n!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),zr.copy(i.boundingSphere),zr.applyMatrix4(r),Gn.copy(t.ray).recast(t.near),!(zr.containsPoint(Gn.origin)===!1&&(Gn.intersectSphere(zr,Nc)===null||Gn.origin.distanceToSquared(Nc)>(t.far-t.near)**2))&&(Uc.copy(r).invert(),Gn.copy(t.ray).applyMatrix4(Uc),!(i.boundingBox!==null&&Gn.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Gn)))}_computeIntersections(t,e,i){let n;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,h=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,y=h.length;g<y;g++){const m=h[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),S=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,R=S;v<R;v+=3){const w=o.getX(v),C=o.getX(v+1),_=o.getX(v+2);n=Yr(this,p,t,i,c,u,f,w,C,_),n&&(n.faceIndex=Math.floor(v/3),n.face.materialIndex=m.materialIndex,e.push(n))}}else{const g=Math.max(0,d.start),y=Math.min(o.count,d.start+d.count);for(let m=g,p=y;m<p;m+=3){const b=o.getX(m),S=o.getX(m+1),v=o.getX(m+2);n=Yr(this,a,t,i,c,u,f,b,S,v),n&&(n.faceIndex=Math.floor(m/3),e.push(n))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,y=h.length;g<y;g++){const m=h[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),S=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,R=S;v<R;v+=3){const w=v,C=v+1,_=v+2;n=Yr(this,p,t,i,c,u,f,w,C,_),n&&(n.faceIndex=Math.floor(v/3),n.face.materialIndex=m.materialIndex,e.push(n))}}else{const g=Math.max(0,d.start),y=Math.min(l.count,d.start+d.count);for(let m=g,p=y;m<p;m+=3){const b=m,S=m+1,v=m+2;n=Yr(this,a,t,i,c,u,f,b,S,v),n&&(n.faceIndex=Math.floor(m/3),e.push(n))}}}}function ud(s,t,e,i,n,r,a,o){let l;if(t.side===di?l=i.intersectTriangle(a,r,n,!0,o):l=i.intersectTriangle(n,r,a,t.side===Dn,o),l===null)return null;Xr.copy(o),Xr.applyMatrix4(s.matrixWorld);const c=e.ray.origin.distanceTo(Xr);return c<e.near||c>e.far?null:{distance:c,point:Xr.clone(),object:s}}function Yr(s,t,e,i,n,r,a,o,l,c){s.getVertexPosition(o,Hr),s.getVertexPosition(l,Gr),s.getVertexPosition(c,Vr);const u=ud(s,t,e,i,Hr,Gr,Vr,Fc);if(u){const f=new T;Ei.getBarycoord(Fc,Hr,Gr,Vr,f),n&&(u.uv=Ei.getInterpolatedAttribute(n,o,l,c,f,new Ut)),r&&(u.uv1=Ei.getInterpolatedAttribute(r,o,l,c,f,new Ut)),a&&(u.normal=Ei.getInterpolatedAttribute(a,o,l,c,f,new T),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new T,materialIndex:0};Ei.getNormal(Hr,Gr,Vr,h.normal),u.face=h,u.barycoord=f}return u}const Ks=new he,Oc=new he,kc=new he,fd=new he,Bc=new Bt,qr=new T,fo=new mn,zc=new Bt,po=new xr;class dd extends Vt{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=gc,this.bindMatrix=new Bt,this.bindMatrixInverse=new Bt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const t=this.geometry;this.boundingBox===null&&(this.boundingBox=new kn),this.boundingBox.makeEmpty();const e=t.getAttribute("position");for(let i=0;i<e.count;i++)this.getVertexPosition(i,qr),this.boundingBox.expandByPoint(qr)}computeBoundingSphere(){const t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new mn),this.boundingSphere.makeEmpty();const e=t.getAttribute("position");for(let i=0;i<e.count;i++)this.getVertexPosition(i,qr),this.boundingSphere.expandByPoint(qr)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}raycast(t,e){const i=this.material,n=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fo.copy(this.boundingSphere),fo.applyMatrix4(n),t.ray.intersectsSphere(fo)!==!1&&(zc.copy(n).invert(),po.copy(t.ray).applyMatrix4(zc),!(this.boundingBox!==null&&po.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,po)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const t=new he,e=this.geometry.attributes.skinWeight;for(let i=0,n=e.count;i<n;i++){t.fromBufferAttribute(e,i);const r=1/t.manhattanLength();r!==1/0?t.multiplyScalar(r):t.set(1,0,0,0),e.setXYZW(i,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===gc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===xf?this.bindMatrixInverse.copy(this.bindMatrix).invert():It("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){const i=this.skeleton,n=this.geometry;Oc.fromBufferAttribute(n.attributes.skinIndex,t),kc.fromBufferAttribute(n.attributes.skinWeight,t),e.isVector4?(Ks.copy(e),e.set(0,0,0,0)):(Ks.set(...e,1),e.set(0,0,0)),Ks.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){const a=kc.getComponent(r);if(a!==0){const o=Oc.getComponent(r);Bc.multiplyMatrices(i.bones[o].matrixWorld,i.boneInverses[o]),e.addScaledVector(fd.copy(Ks).applyMatrix4(Bc),a)}}return e.isVector4&&(e.w=Ks.w),e.applyMatrix4(this.bindMatrixInverse)}}class su extends Me{constructor(){super(),this.isBone=!0,this.type="Bone"}}class Hl extends si{constructor(t=null,e=1,i=1,n,r,a,o,l,c=Je,u=Je,f,h){super(null,a,o,l,c,u,n,r,f,h),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Hc=new Bt,pd=new Bt;class Gl{constructor(t=[],e=[]){this.uuid=Ki(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){const t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){It("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,n=this.bones.length;i<n;i++)this.boneInverses.push(new Bt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){const i=new Bt;this.bones[t]&&i.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){const i=this.bones[t];i&&i.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){const i=this.bones[t];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){const t=this.bones,e=this.boneInverses,i=this.boneMatrices,n=this.boneTexture;for(let r=0,a=t.length;r<a;r++){const o=t[r]?t[r].matrixWorld:pd;Hc.multiplyMatrices(o,e[r]),Hc.toArray(i,r*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new Gl(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);const e=new Float32Array(t*t*4);e.set(this.boneMatrices);const i=new Hl(e,t,t,Ai,Ti);return i.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=i,this}getBoneByName(t){for(let e=0,i=this.bones.length;e<i;e++){const n=this.bones[e];if(n.name===t)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let i=0,n=t.bones.length;i<n;i++){const r=t.bones[i];let a=e[r];a===void 0&&(It("Skeleton: No bone found with UUID:",r),a=new su),this.bones.push(a),this.boneInverses.push(new Bt().fromArray(t.boneInverses[i]))}return this.init(),this}toJSON(){const t={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;const e=this.bones,i=this.boneInverses;for(let n=0,r=e.length;n<r;n++){const a=e[n];t.bones.push(a.uuid);const o=i[n];t.boneInverses.push(o.toArray())}return t}}class Gc extends Ue{constructor(t,e,i,n=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const bs=new Bt,Vc=new Bt,Kr=[],Wc=new kn,md=new Bt,Zs=new Vt,$s=new mn;class gd extends Vt{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Gc(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<i;n++)this.setMatrixAt(n,md)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new kn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,bs),Wc.copy(t.boundingBox).applyMatrix4(bs),this.boundingBox.union(Wc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new mn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,bs),$s.copy(t.boundingSphere).applyMatrix4(bs),this.boundingSphere.union($s)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const i=e.morphTargetInfluences,n=this.morphTexture.source.data.data,r=i.length+1,a=t*r+1;for(let o=0;o<i.length;o++)i[o]=n[a+o]}raycast(t,e){const i=this.matrixWorld,n=this.count;if(Zs.geometry=this.geometry,Zs.material=this.material,Zs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),$s.copy(this.boundingSphere),$s.applyMatrix4(i),t.ray.intersectsSphere($s)!==!1))for(let r=0;r<n;r++){this.getMatrixAt(r,bs),Vc.multiplyMatrices(i,bs),Zs.matrixWorld=Vc,Zs.raycast(t,Kr);for(let a=0,o=Kr.length;a<o;a++){const l=Kr[a];l.instanceId=r,l.object=this,e.push(l)}Kr.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Gc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const i=e.morphTargetInfluences,n=i.length+1;this.morphTexture===null&&(this.morphTexture=new Hl(new Float32Array(n*this.count),n,this.count,Pl,Ti));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<i.length;c++)a+=i[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=n*t;return r[l]=o,r.set(i,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const mo=new T,xd=new T,_d=new kt;class Cn{constructor(t=new T(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,n){return this.normal.set(t,e,i),this.constant=n,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const n=mo.subVectors(i,e).cross(xd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(n,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,i=!0){const n=t.delta(mo),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return i===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(n,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||_d.getNormalMatrix(t),n=this.coplanarPoint(mo).applyMatrix4(t),r=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Vn=new mn,vd=new Ut(.5,.5),Zr=new T;class Vl{constructor(t=new Cn,e=new Cn,i=new Cn,n=new Cn,r=new Cn,a=new Cn){this.planes=[t,e,i,n,r,a]}set(t,e,i,n,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(i),o[3].copy(n),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=Xi,i=!1){const n=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],u=r[4],f=r[5],h=r[6],d=r[7],g=r[8],y=r[9],m=r[10],p=r[11],b=r[12],S=r[13],v=r[14],R=r[15];if(n[0].setComponents(c-a,d-u,p-g,R-b).normalize(),n[1].setComponents(c+a,d+u,p+g,R+b).normalize(),n[2].setComponents(c+o,d+f,p+y,R+S).normalize(),n[3].setComponents(c-o,d-f,p-y,R-S).normalize(),i)n[4].setComponents(l,h,m,v).normalize(),n[5].setComponents(c-l,d-h,p-m,R-v).normalize();else if(n[4].setComponents(c-l,d-h,p-m,R-v).normalize(),e===Xi)n[5].setComponents(c+l,d+h,p+m,R+v).normalize();else if(e===fr)n[5].setComponents(l,h,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Vn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Vn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Vn)}intersectsSprite(t){Vn.center.set(0,0,0);const e=vd.distanceTo(t.center);return Vn.radius=.7071067811865476+e,Vn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Vn)}intersectsSphere(t){const e=this.planes,i=t.center,n=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(i)<n)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const n=e[i];if(Zr.x=n.normal.x>0?t.max.x:t.min.x,Zr.y=n.normal.y>0?t.max.y:t.min.y,Zr.z=n.normal.z>0?t.max.z:t.min.z,n.distanceToPoint(Zr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ru extends gn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Nt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const wa=new T,Ea=new T,Xc=new Bt,Js=new xr,$r=new mn,go=new T,Yc=new T;class Md extends Me{constructor(t=new Ne,e=new ru){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,i=[0];for(let n=1,r=e.count;n<r;n++)wa.fromBufferAttribute(e,n-1),Ea.fromBufferAttribute(e,n),i[n]=i[n-1],i[n]+=wa.distanceTo(Ea);t.setAttribute("lineDistance",new xe(i,1))}else It("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const i=this.geometry,n=this.matrixWorld,r=t.params.Line.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),$r.copy(i.boundingSphere),$r.applyMatrix4(n),$r.radius+=r,t.ray.intersectsSphere($r)===!1)return;Xc.copy(n).invert(),Js.copy(t.ray).applyMatrix4(Xc);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=i.index,h=i.attributes.position;if(u!==null){const d=Math.max(0,a.start),g=Math.min(u.count,a.start+a.count);for(let y=d,m=g-1;y<m;y+=c){const p=u.getX(y),b=u.getX(y+1),S=Jr(this,t,Js,l,p,b,y);S&&e.push(S)}if(this.isLineLoop){const y=u.getX(g-1),m=u.getX(d),p=Jr(this,t,Js,l,y,m,g-1);p&&e.push(p)}}else{const d=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let y=d,m=g-1;y<m;y+=c){const p=Jr(this,t,Js,l,y,y+1,y);p&&e.push(p)}if(this.isLineLoop){const y=Jr(this,t,Js,l,g-1,d,g-1);y&&e.push(y)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=n.length;r<a;r++){const o=n[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Jr(s,t,e,i,n,r,a){const o=s.geometry.attributes.position;if(wa.fromBufferAttribute(o,n),Ea.fromBufferAttribute(o,r),e.distanceSqToSegment(wa,Ea,go,Yc)>i)return;go.applyMatrix4(s.matrixWorld);const c=t.ray.origin.distanceTo(go);if(!(c<t.near||c>t.far))return{distance:c,point:Yc.clone().applyMatrix4(s.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:s}}const qc=new T,Kc=new T;class yd extends Md{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,i=[];for(let n=0,r=e.count;n<r;n+=2)qc.fromBufferAttribute(e,n),Kc.fromBufferAttribute(e,n+1),i[n]=n===0?0:i[n-1],i[n+1]=i[n]+qc.distanceTo(Kc);t.setAttribute("lineDistance",new xe(i,1))}else It("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class bd extends gn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Nt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Zc=new Bt,vl=new xr,Qr=new mn,jr=new T;class Sd extends Me{constructor(t=new Ne,e=new bd){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const i=this.geometry,n=this.matrixWorld,r=t.params.Points.threshold,a=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Qr.copy(i.boundingSphere),Qr.applyMatrix4(n),Qr.radius+=r,t.ray.intersectsSphere(Qr)===!1)return;Zc.copy(n).invert(),vl.copy(t.ray).applyMatrix4(Zc);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,f=i.attributes.position;if(c!==null){const h=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let g=h,y=d;g<y;g++){const m=c.getX(g);jr.fromBufferAttribute(f,m),$c(jr,m,l,n,t,e,this)}}else{const h=Math.max(0,a.start),d=Math.min(f.count,a.start+a.count);for(let g=h,y=d;g<y;g++)jr.fromBufferAttribute(f,g),$c(jr,g,l,n,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const n=e[i[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=n.length;r<a;r++){const o=n[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function $c(s,t,e,i,n,r,a){const o=vl.distanceSqToPoint(s);if(o<e){const l=new T;vl.closestPointToPoint(s,l),l.applyMatrix4(i);const c=n.ray.origin.distanceTo(l);if(c<n.near||c>n.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class au extends si{constructor(t=[],e=jn,i,n,r,a,o,l,c,u){super(t,e,i,n,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Un extends si{constructor(t,e,i,n,r,a,o,l,c){super(t,e,i,n,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Ns extends si{constructor(t,e,i=Zi,n,r,a,o=Je,l=Je,c,u=un,f=1){if(u!==un&&u!==Zn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:t,height:e,depth:f};super(h,n,r,a,o,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ol(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class wd extends Ns{constructor(t,e=Zi,i=jn,n,r,a=Je,o=Je,l,c=un){const u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,i,n,r,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class ou extends si{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class Yt extends Ne{constructor(t=1,e=1,i=1,n=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:n,heightSegments:r,depthSegments:a};const o=this;n=Math.floor(n),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],u=[],f=[];let h=0,d=0;g("z","y","x",-1,-1,i,e,t,a,r,0),g("z","y","x",1,-1,i,e,-t,a,r,1),g("x","z","y",1,1,t,i,e,n,a,2),g("x","z","y",1,-1,t,i,-e,n,a,3),g("x","y","z",1,-1,t,e,i,n,r,4),g("x","y","z",-1,-1,t,e,-i,n,r,5),this.setIndex(l),this.setAttribute("position",new xe(c,3)),this.setAttribute("normal",new xe(u,3)),this.setAttribute("uv",new xe(f,2));function g(y,m,p,b,S,v,R,w,C,_,E){const P=v/C,I=R/_,L=v/2,X=R/2,Z=w/2,N=C+1,V=_+1;let k=0,K=0;const tt=new T;for(let at=0;at<V;at++){const lt=at*I-X;for(let Mt=0;Mt<N;Mt++){const ne=Mt*P-L;tt[y]=ne*b,tt[m]=lt*S,tt[p]=Z,c.push(tt.x,tt.y,tt.z),tt[y]=0,tt[m]=0,tt[p]=w>0?1:-1,u.push(tt.x,tt.y,tt.z),f.push(Mt/C),f.push(1-at/_),k+=1}}for(let at=0;at<_;at++)for(let lt=0;lt<C;lt++){const Mt=h+lt+N*at,ne=h+lt+N*(at+1),ye=h+(lt+1)+N*(at+1),se=h+(lt+1)+N*at;l.push(Mt,ne,se),l.push(ne,ye,se),K+=6}o.addGroup(d,K,E),d+=K,h+=k}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Yt(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class pr extends Ne{constructor(t=1,e=32,i=0,n=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:i,thetaLength:n},e=Math.max(3,e);const r=[],a=[],o=[],l=[],c=new T,u=new Ut;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,h=3;f<=e;f++,h+=3){const d=i+f/e*n;c.x=t*Math.cos(d),c.y=t*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(a[h]/t+1)/2,u.y=(a[h+1]/t+1)/2,l.push(u.x,u.y)}for(let f=1;f<=e;f++)r.push(f,f+1,0);this.setIndex(r),this.setAttribute("position",new xe(a,3)),this.setAttribute("normal",new xe(o,3)),this.setAttribute("uv",new xe(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new pr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Nn extends Ne{constructor(t=1,e=1,i=1,n=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:n,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;n=Math.floor(n),r=Math.floor(r);const u=[],f=[],h=[],d=[];let g=0;const y=[],m=i/2;let p=0;b(),a===!1&&(t>0&&S(!0),e>0&&S(!1)),this.setIndex(u),this.setAttribute("position",new xe(f,3)),this.setAttribute("normal",new xe(h,3)),this.setAttribute("uv",new xe(d,2));function b(){const v=new T,R=new T;let w=0;const C=(e-t)/i;for(let _=0;_<=r;_++){const E=[],P=_/r,I=P*(e-t)+t;for(let L=0;L<=n;L++){const X=L/n,Z=X*l+o,N=Math.sin(Z),V=Math.cos(Z);R.x=I*N,R.y=-P*i+m,R.z=I*V,f.push(R.x,R.y,R.z),v.set(N,C,V).normalize(),h.push(v.x,v.y,v.z),d.push(X,1-P),E.push(g++)}y.push(E)}for(let _=0;_<n;_++)for(let E=0;E<r;E++){const P=y[E][_],I=y[E+1][_],L=y[E+1][_+1],X=y[E][_+1];(t>0||E!==0)&&(u.push(P,I,X),w+=3),(e>0||E!==r-1)&&(u.push(I,L,X),w+=3)}c.addGroup(p,w,0),p+=w}function S(v){const R=g,w=new Ut,C=new T;let _=0;const E=v===!0?t:e,P=v===!0?1:-1;for(let L=1;L<=n;L++)f.push(0,m*P,0),h.push(0,P,0),d.push(.5,.5),g++;const I=g;for(let L=0;L<=n;L++){const Z=L/n*l+o,N=Math.cos(Z),V=Math.sin(Z);C.x=E*V,C.y=m*P,C.z=E*N,f.push(C.x,C.y,C.z),h.push(0,P,0),w.x=N*.5+.5,w.y=V*.5*P+.5,d.push(w.x,w.y),g++}for(let L=0;L<n;L++){const X=R+L,Z=I+L;v===!0?u.push(Z,Z+1,X):u.push(Z+1,Z,X),_+=3}c.addGroup(p,_,v===!0?1:2),p+=_}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Nn(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Wl extends Nn{constructor(t=1,e=1,i=32,n=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,i,n,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:n,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new Wl(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Xl extends Ne{constructor(t=[],e=[],i=1,n=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:n};const r=[],a=[];o(n),c(i),u(),this.setAttribute("position",new xe(r,3)),this.setAttribute("normal",new xe(r.slice(),3)),this.setAttribute("uv",new xe(a,2)),n===0?this.computeVertexNormals():this.normalizeNormals();function o(b){const S=new T,v=new T,R=new T;for(let w=0;w<e.length;w+=3)d(e[w+0],S),d(e[w+1],v),d(e[w+2],R),l(S,v,R,b)}function l(b,S,v,R){const w=R+1,C=[];for(let _=0;_<=w;_++){C[_]=[];const E=b.clone().lerp(v,_/w),P=S.clone().lerp(v,_/w),I=w-_;for(let L=0;L<=I;L++)L===0&&_===w?C[_][L]=E:C[_][L]=E.clone().lerp(P,L/I)}for(let _=0;_<w;_++)for(let E=0;E<2*(w-_)-1;E++){const P=Math.floor(E/2);E%2===0?(h(C[_][P+1]),h(C[_+1][P]),h(C[_][P])):(h(C[_][P+1]),h(C[_+1][P+1]),h(C[_+1][P]))}}function c(b){const S=new T;for(let v=0;v<r.length;v+=3)S.x=r[v+0],S.y=r[v+1],S.z=r[v+2],S.normalize().multiplyScalar(b),r[v+0]=S.x,r[v+1]=S.y,r[v+2]=S.z}function u(){const b=new T;for(let S=0;S<r.length;S+=3){b.x=r[S+0],b.y=r[S+1],b.z=r[S+2];const v=m(b)/2/Math.PI+.5,R=p(b)/Math.PI+.5;a.push(v,1-R)}g(),f()}function f(){for(let b=0;b<a.length;b+=6){const S=a[b+0],v=a[b+2],R=a[b+4],w=Math.max(S,v,R),C=Math.min(S,v,R);w>.9&&C<.1&&(S<.2&&(a[b+0]+=1),v<.2&&(a[b+2]+=1),R<.2&&(a[b+4]+=1))}}function h(b){r.push(b.x,b.y,b.z)}function d(b,S){const v=b*3;S.x=t[v+0],S.y=t[v+1],S.z=t[v+2]}function g(){const b=new T,S=new T,v=new T,R=new T,w=new Ut,C=new Ut,_=new Ut;for(let E=0,P=0;E<r.length;E+=9,P+=6){b.set(r[E+0],r[E+1],r[E+2]),S.set(r[E+3],r[E+4],r[E+5]),v.set(r[E+6],r[E+7],r[E+8]),w.set(a[P+0],a[P+1]),C.set(a[P+2],a[P+3]),_.set(a[P+4],a[P+5]),R.copy(b).add(S).add(v).divideScalar(3);const I=m(R);y(w,P+0,b,I),y(C,P+2,S,I),y(_,P+4,v,I)}}function y(b,S,v,R){R<0&&b.x===1&&(a[S]=b.x-1),v.x===0&&v.z===0&&(a[S]=R/2/Math.PI+.5)}function m(b){return Math.atan2(b.z,-b.x)}function p(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xl(t.vertices,t.indices,t.radius,t.detail)}}class Ed{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){It("Curve: .getPoint() not implemented.")}getPointAt(t,e){const i=this.getUtoTmapping(t);return this.getPoint(i,e)}getPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPoint(i/t));return e}getSpacedPoints(t=5){const e=[];for(let i=0;i<=t;i++)e.push(this.getPointAt(i/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let i,n=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)i=this.getPoint(a/t),r+=i.distanceTo(n),e.push(r),n=i;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const i=this.getLengths();let n=0;const r=i.length;let a;e?a=e:a=t*i[r-1];let o=0,l=r-1,c;for(;o<=l;)if(n=Math.floor(o+(l-o)/2),c=i[n]-a,c<0)o=n+1;else if(c>0)l=n-1;else{l=n;break}if(n=l,i[n]===a)return n/(r-1);const u=i[n],h=i[n+1]-u,d=(a-u)/h;return(n+d)/(r-1)}getTangent(t,e){let n=t-1e-4,r=t+1e-4;n<0&&(n=0),r>1&&(r=1);const a=this.getPoint(n),o=this.getPoint(r),l=e||(a.isVector2?new Ut:new T);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const i=this.getUtoTmapping(t);return this.getTangent(i,e)}computeFrenetFrames(t,e=!1){const i=new T,n=[],r=[],a=[],o=new T,l=new Bt;for(let d=0;d<=t;d++){const g=d/t;n[d]=this.getTangentAt(g,new T)}r[0]=new T,a[0]=new T;let c=Number.MAX_VALUE;const u=Math.abs(n[0].x),f=Math.abs(n[0].y),h=Math.abs(n[0].z);u<=c&&(c=u,i.set(1,0,0)),f<=c&&(c=f,i.set(0,1,0)),h<=c&&i.set(0,0,1),o.crossVectors(n[0],i).normalize(),r[0].crossVectors(n[0],o),a[0].crossVectors(n[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(n[d-1],n[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Zt(n[d-1].dot(n[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(n[d],r[d])}if(e===!0){let d=Math.acos(Zt(r[0].dot(r[t]),-1,1));d/=t,n[0].dot(o.crossVectors(r[0],r[t]))>0&&(d=-d);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(n[g],d*g)),a[g].crossVectors(n[g],r[g])}return{tangents:n,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}function Td(s,t){const e=1-s;return e*e*t}function Ad(s,t){return 2*(1-s)*s*t}function Rd(s,t){return s*s*t}function xo(s,t,e,i){return Td(s,t)+Ad(s,e)+Rd(s,i)}class Cd extends Ed{constructor(t=new T,e=new T,i=new T){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=i}getPoint(t,e=new T){const i=e,n=this.v0,r=this.v1,a=this.v2;return i.set(xo(t,n.x,r.x,a.x),xo(t,n.y,r.y,a.y),xo(t,n.z,r.z,a.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Yl extends Xl{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,n=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(n,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Yl(t.radius,t.detail)}}class _e extends Ne{constructor(t=1,e=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:n};const r=t/2,a=e/2,o=Math.floor(i),l=Math.floor(n),c=o+1,u=l+1,f=t/o,h=e/l,d=[],g=[],y=[],m=[];for(let p=0;p<u;p++){const b=p*h-a;for(let S=0;S<c;S++){const v=S*f-r;g.push(v,-b,0),y.push(0,0,1),m.push(S/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<o;b++){const S=b+c*p,v=b+c*(p+1),R=b+1+c*(p+1),w=b+1+c*p;d.push(S,v,w),d.push(v,R,w)}this.setIndex(d),this.setAttribute("position",new xe(g,3)),this.setAttribute("normal",new xe(y,3)),this.setAttribute("uv",new xe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new _e(t.width,t.height,t.widthSegments,t.heightSegments)}}class Bs extends Ne{constructor(t=1,e=32,i=16,n=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:n,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const l=Math.min(a+o,Math.PI);let c=0;const u=[],f=new T,h=new T,d=[],g=[],y=[],m=[];for(let p=0;p<=i;p++){const b=[],S=p/i,v=a+S*o,R=t*Math.cos(v),w=Math.sqrt(t*t-R*R);let C=0;p===0&&a===0?C=.5/e:p===i&&l===Math.PI&&(C=-.5/e);for(let _=0;_<=e;_++){const E=_/e,P=n+E*r;f.x=-w*Math.cos(P),f.y=R,f.z=w*Math.sin(P),g.push(f.x,f.y,f.z),h.copy(f).normalize(),y.push(h.x,h.y,h.z),m.push(E+C,1-S),b.push(c++)}u.push(b)}for(let p=0;p<i;p++)for(let b=0;b<e;b++){const S=u[p][b+1],v=u[p][b],R=u[p+1][b],w=u[p+1][b+1];(p!==0||a>0)&&d.push(S,v,w),(p!==i-1||l<Math.PI)&&d.push(v,R,w)}this.setIndex(d),this.setAttribute("position",new xe(g,3)),this.setAttribute("normal",new xe(y,3)),this.setAttribute("uv",new xe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Bs(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class La extends Ne{constructor(t=1,e=.4,i=12,n=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:i,tubularSegments:n,arc:r,thetaStart:a,thetaLength:o},i=Math.floor(i),n=Math.floor(n);const l=[],c=[],u=[],f=[],h=new T,d=new T,g=new T;for(let y=0;y<=i;y++){const m=a+y/i*o;for(let p=0;p<=n;p++){const b=p/n*r;d.x=(t+e*Math.cos(m))*Math.cos(b),d.y=(t+e*Math.cos(m))*Math.sin(b),d.z=e*Math.sin(m),c.push(d.x,d.y,d.z),h.x=t*Math.cos(b),h.y=t*Math.sin(b),g.subVectors(d,h).normalize(),u.push(g.x,g.y,g.z),f.push(p/n),f.push(y/i)}}for(let y=1;y<=i;y++)for(let m=1;m<=n;m++){const p=(n+1)*y+m-1,b=(n+1)*(y-1)+m-1,S=(n+1)*(y-1)+m,v=(n+1)*y+m;l.push(p,b,v),l.push(b,S,v)}this.setIndex(l),this.setAttribute("position",new xe(c,3)),this.setAttribute("normal",new xe(u,3)),this.setAttribute("uv",new xe(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new La(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}function Fs(s){const t={};for(const e in s){t[e]={};for(const i in s[e]){const n=s[e][i];if(Jc(n))n.isRenderTargetTexture?(It("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=n.clone();else if(Array.isArray(n))if(Jc(n[0])){const r=[];for(let a=0,o=n.length;a<o;a++)r[a]=n[a].clone();t[e][i]=r}else t[e][i]=n.slice();else t[e][i]=n}}return t}function oi(s){const t={};for(let e=0;e<s.length;e++){const i=Fs(s[e]);for(const n in i)t[n]=i[n]}return t}function Jc(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function Pd(s){const t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function lu(s){const t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:jt.workingColorSpace}const Id={clone:Fs,merge:oi};var Ld=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Dd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class yi extends gn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Ld,this.fragmentShader=Dd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Fs(t.uniforms),this.uniformsGroups=Pd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const n in this.uniforms){const a=this.uniforms[n].value;a&&a.isTexture?e.uniforms[n]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[n]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[n]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[n]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[n]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[n]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[n]={type:"m4",value:a.toArray()}:e.uniforms[n]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const i in t.uniforms){const n=t.uniforms[i];switch(this.uniforms[i]={},n.type){case"t":this.uniforms[i].value=e[n.value]||null;break;case"c":this.uniforms[i].value=new Nt().setHex(n.value);break;case"v2":this.uniforms[i].value=new Ut().fromArray(n.value);break;case"v3":this.uniforms[i].value=new T().fromArray(n.value);break;case"v4":this.uniforms[i].value=new he().fromArray(n.value);break;case"m3":this.uniforms[i].value=new kt().fromArray(n.value);break;case"m4":this.uniforms[i].value=new Bt().fromArray(n.value);break;default:this.uniforms[i].value=n.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class Ud extends yi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Jt extends gn{constructor(t){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new Nt(16777215),this.specular=new Nt(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=_a,this.normalScale=new Ut(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ji,this.combine=Ca,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class te extends gn{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Nt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=_a,this.normalScale=new Ut(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ji,this.combine=Ca,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Nd extends gn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=vf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Fd extends gn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class Da extends Me{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Nt(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class cu extends Da{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Me.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Nt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const _o=new Bt,Qc=new T,jc=new T;class hu{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Ut(512,512),this.mapType=Mi,this.map=null,this.mapPass=null,this.matrix=new Bt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Vl,this._frameExtents=new Ut(1,1),this._viewportCount=1,this._viewports=[new he(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,i=this.matrix;Qc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Qc),jc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(jc),e.updateMatrixWorld(),_o.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(_o,e.coordinateSystem,e.reversedDepth),e.coordinateSystem===fr||e.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(_o)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const ta=new T,ea=new ni,Gi=new T;class uu extends Me{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Bt,this.projectionMatrix=new Bt,this.projectionMatrixInverse=new Bt,this.coordinateSystem=Xi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(ta,ea,Gi),Gi.x===1&&Gi.y===1&&Gi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ta,ea,Gi.set(1,1,1)).invert()}updateWorldMatrix(t,e,i=!1){super.updateWorldMatrix(t,e,i),this.matrixWorld.decompose(ta,ea,Gi),Gi.x===1&&Gi.y===1&&Gi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ta,ea,Gi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const En=new T,th=new Ut,eh=new Ut;class fi extends uu{constructor(t=50,e=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=dr*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(ar*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return dr*2*Math.atan(Math.tan(ar*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){En.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(En.x,En.y).multiplyScalar(-t/En.z),En.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(En.x,En.y).multiplyScalar(-t/En.z)}getViewSize(t,e){return this.getViewBounds(t,th,eh),e.subVectors(eh,th)}setViewOffset(t,e,i,n,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=n,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(ar*.5*this.fov)/this.zoom,i=2*e,n=this.aspect*i,r=-.5*n;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*n/l,e-=a.offsetY*i/c,n*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+n,e,e-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class Od extends hu{constructor(){super(new fi(90,1,.5,500)),this.isPointLightShadow=!0}}class Yn extends Da{constructor(t,e,i=0,n=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=n,this.shadow=new Od}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}}class ql extends uu{constructor(t=-1,e=1,i=1,n=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=n,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,n,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=n,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let r=i-t,a=i+t,o=n+e,l=n-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class kd extends hu{constructor(){super(new ql(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Bd extends Da{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Me.DEFAULT_UP),this.updateMatrix(),this.target=new Me,this.shadow=new kd}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}class zd extends Da{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}const Ss=-90,ws=1;class Hd extends Me{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const n=new fi(Ss,ws,t,e);n.layers=this.layers,this.add(n);const r=new fi(Ss,ws,t,e);r.layers=this.layers,this.add(r);const a=new fi(Ss,ws,t,e);a.layers=this.layers,this.add(a);const o=new fi(Ss,ws,t,e);o.layers=this.layers,this.add(o);const l=new fi(Ss,ws,t,e);l.layers=this.layers,this.add(l);const c=new fi(Ss,ws,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,n,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===Xi)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===fr)i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,u]=this.children,f=t.getRenderTarget(),h=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(i,0,n),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(i,1,n),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(i,2,n),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(i,3,n),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(i,4,n),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),i.texture.generateMipmaps=y,t.setRenderTarget(i,5,n),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,h,d),t.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class Gd extends fi{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}const ih=new Bt;class fu{constructor(t,e,i=0,n=1/0){this.ray=new xr(t,e),this.near=i,this.far=n,this.camera=null,this.layers=new kl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Qt("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return ih.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ih),this}intersectObject(t,e=!0,i=[]){return Ml(t,this,i,e),i.sort(nh),i}intersectObjects(t,e=!0,i=[]){for(let n=0,r=t.length;n<r;n++)Ml(t[n],this,i,e);return i.sort(nh),i}}function nh(s,t){return s.distance-t.distance}function Ml(s,t,e,i){let n=!0;if(s.layers.test(t.layers)&&s.raycast(t,e)===!1&&(n=!1),n===!0&&i===!0){const r=s.children;for(let a=0,o=r.length;a<o;a++)Ml(r[a],t,e,!0)}}class du{static{du.prototype.isMatrix2=!0}constructor(t,e,i,n){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,i,n)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let i=0;i<4;i++)this.elements[i]=t[i+e];return this}set(t,e,i,n){const r=this.elements;return r[0]=t,r[2]=e,r[1]=i,r[3]=n,this}}function sh(s,t,e,i){const n=Vd(i);switch(e){case Zh:return s*t;case Pl:return s*t/n.components*n.byteLength;case Il:return s*t/n.components*n.byteLength;case ts:return s*t*2/n.components*n.byteLength;case Ll:return s*t*2/n.components*n.byteLength;case $h:return s*t*3/n.components*n.byteLength;case Ai:return s*t*4/n.components*n.byteLength;case Dl:return s*t*4/n.components*n.byteLength;case la:case ca:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case ha:case ua:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Vo:case Xo:return Math.max(s,16)*Math.max(t,8)/4;case Go:case Wo:return Math.max(s,8)*Math.max(t,8)/2;case Yo:case qo:case Zo:case $o:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Ko:case ga:case Jo:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Qo:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case jo:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case tl:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case el:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case il:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case nl:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case sl:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case rl:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case al:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case ol:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case ll:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case cl:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case hl:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case ul:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case fl:case dl:case pl:return Math.ceil(s/4)*Math.ceil(t/4)*16;case ml:case gl:return Math.ceil(s/4)*Math.ceil(t/4)*8;case xa:case xl:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Vd(s){switch(s){case Mi:case Xh:return{byteLength:1,components:1};case hr:case Yh:case $i:return{byteLength:2,components:1};case Rl:case Cl:return{byteLength:2,components:4};case Zi:case Al:case Ti:return{byteLength:4,components:1};case qh:case Kh:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Tl}}));typeof window<"u"&&(window.__THREE__?It("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Tl);function pu(){let s=null,t=!1,e=null,i=null;function n(r,a){e(r,a),i=s.requestAnimationFrame(n)}return{start:function(){t!==!0&&e!==null&&s!==null&&(i=s.requestAnimationFrame(n),t=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function Wd(s){const t=new WeakMap;function e(o,l){const c=o.array,u=o.usage,f=c.byteLength,h=s.createBuffer();s.bindBuffer(l,h),s.bufferData(l,c,u),o.onUploadCallback();let d;if(c instanceof Float32Array)d=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=s.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=s.SHORT;else if(c instanceof Uint32Array)d=s.UNSIGNED_INT;else if(c instanceof Int32Array)d=s.INT;else if(c instanceof Int8Array)d=s.BYTE;else if(c instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function i(o,l,c){const u=l.array,f=l.updateRanges;if(s.bindBuffer(c,o),f.length===0)s.bufferSubData(c,0,u);else{f.sort((d,g)=>d.start-g.start);let h=0;for(let d=1;d<f.length;d++){const g=f[h],y=f[d];y.start<=g.start+g.count+1?g.count=Math.max(g.count,y.start+y.count-g.start):(++h,f[h]=y)}f.length=h+1;for(let d=0,g=f.length;d<g;d++){const y=f[d];s.bufferSubData(c,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function n(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(s.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:n,remove:r,update:a}}var Xd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Yd=`#ifdef USE_ALPHAHASH
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
#endif`,qd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Kd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,$d=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Jd=`#ifdef USE_AOMAP
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
#endif`,Qd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,jd=`#ifdef USE_BATCHING
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
#endif`,t0=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,e0=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,i0=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,n0=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,s0=`#ifdef USE_IRIDESCENCE
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
#endif`,r0=`#ifdef USE_BUMPMAP
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
#endif`,a0=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,o0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,l0=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,c0=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,h0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,u0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,f0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,d0=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,p0=`#define PI 3.141592653589793
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
} // validated`,m0=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,g0=`vec3 transformedNormal = objectNormal;
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
#endif`,x0=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_0=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,v0=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,M0=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,y0="gl_FragColor = linearToOutputTexel( gl_FragColor );",b0=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,S0=`#ifdef USE_ENVMAP
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
#endif`,w0=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,E0=`#ifdef USE_ENVMAP
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
#endif`,T0=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,A0=`#ifdef USE_ENVMAP
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
#endif`,R0=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,C0=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,P0=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,I0=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,L0=`#ifdef USE_GRADIENTMAP
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
}`,D0=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,U0=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,N0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,F0=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,O0=`#ifdef USE_ENVMAP
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
#endif`,k0=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,B0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,z0=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,H0=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,G0=`PhysicalMaterial material;
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
#endif`,V0=`uniform sampler2D dfgLUT;
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
}`,W0=`
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
#endif`,X0=`#if defined( RE_IndirectDiffuse )
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
#endif`,Y0=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,q0=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,K0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Z0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,$0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,J0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Q0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,j0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,tp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,ep=`#if defined( USE_POINTS_UV )
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
#endif`,ip=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,np=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,sp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,rp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ap=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,op=`#ifdef USE_MORPHTARGETS
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
#endif`,lp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,cp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,hp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,up=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,pp=`#ifdef USE_NORMALMAP
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
#endif`,mp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,gp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,xp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_p=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,vp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Mp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,yp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Sp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,wp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ep=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Tp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Ap=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Rp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Cp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Pp=`float getShadowMask() {
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
}`,Ip=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Lp=`#ifdef USE_SKINNING
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
#endif`,Dp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Up=`#ifdef USE_SKINNING
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
#endif`,Np=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Fp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Op=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,kp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Bp=`#ifdef USE_TRANSMISSION
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
#endif`,zp=`#ifdef USE_TRANSMISSION
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
#endif`,Hp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Gp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Vp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Wp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Xp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Yp=`uniform sampler2D t2D;
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
}`,qp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,Zp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,$p=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jp=`#include <common>
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
}`,Qp=`#if DEPTH_PACKING == 3200
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
}`,jp=`#define DISTANCE
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
}`,tm=`#define DISTANCE
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
}`,em=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,im=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nm=`uniform float scale;
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
}`,sm=`uniform vec3 diffuse;
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
}`,rm=`#include <common>
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
}`,am=`uniform vec3 diffuse;
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
}`,om=`#define LAMBERT
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
}`,lm=`#define LAMBERT
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
}`,cm=`#define MATCAP
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
}`,hm=`#define MATCAP
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
}`,um=`#define NORMAL
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
}`,fm=`#define NORMAL
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
}`,dm=`#define PHONG
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
}`,pm=`#define PHONG
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
}`,mm=`#define STANDARD
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
}`,gm=`#define STANDARD
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
}`,xm=`#define TOON
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
}`,_m=`#define TOON
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
}`,vm=`uniform float size;
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
}`,Mm=`uniform vec3 diffuse;
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
}`,ym=`#include <common>
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
}`,bm=`uniform vec3 color;
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
}`,Sm=`uniform float rotation;
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
}`,wm=`uniform vec3 diffuse;
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
}`,Xt={alphahash_fragment:Xd,alphahash_pars_fragment:Yd,alphamap_fragment:qd,alphamap_pars_fragment:Kd,alphatest_fragment:Zd,alphatest_pars_fragment:$d,aomap_fragment:Jd,aomap_pars_fragment:Qd,batching_pars_vertex:jd,batching_vertex:t0,begin_vertex:e0,beginnormal_vertex:i0,bsdfs:n0,iridescence_fragment:s0,bumpmap_pars_fragment:r0,clipping_planes_fragment:a0,clipping_planes_pars_fragment:o0,clipping_planes_pars_vertex:l0,clipping_planes_vertex:c0,color_fragment:h0,color_pars_fragment:u0,color_pars_vertex:f0,color_vertex:d0,common:p0,cube_uv_reflection_fragment:m0,defaultnormal_vertex:g0,displacementmap_pars_vertex:x0,displacementmap_vertex:_0,emissivemap_fragment:v0,emissivemap_pars_fragment:M0,colorspace_fragment:y0,colorspace_pars_fragment:b0,envmap_fragment:S0,envmap_common_pars_fragment:w0,envmap_pars_fragment:E0,envmap_pars_vertex:T0,envmap_physical_pars_fragment:O0,envmap_vertex:A0,fog_vertex:R0,fog_pars_vertex:C0,fog_fragment:P0,fog_pars_fragment:I0,gradientmap_pars_fragment:L0,lightmap_pars_fragment:D0,lights_lambert_fragment:U0,lights_lambert_pars_fragment:N0,lights_pars_begin:F0,lights_toon_fragment:k0,lights_toon_pars_fragment:B0,lights_phong_fragment:z0,lights_phong_pars_fragment:H0,lights_physical_fragment:G0,lights_physical_pars_fragment:V0,lights_fragment_begin:W0,lights_fragment_maps:X0,lights_fragment_end:Y0,lightprobes_pars_fragment:q0,logdepthbuf_fragment:K0,logdepthbuf_pars_fragment:Z0,logdepthbuf_pars_vertex:$0,logdepthbuf_vertex:J0,map_fragment:Q0,map_pars_fragment:j0,map_particle_fragment:tp,map_particle_pars_fragment:ep,metalnessmap_fragment:ip,metalnessmap_pars_fragment:np,morphinstance_vertex:sp,morphcolor_vertex:rp,morphnormal_vertex:ap,morphtarget_pars_vertex:op,morphtarget_vertex:lp,normal_fragment_begin:cp,normal_fragment_maps:hp,normal_pars_fragment:up,normal_pars_vertex:fp,normal_vertex:dp,normalmap_pars_fragment:pp,clearcoat_normal_fragment_begin:mp,clearcoat_normal_fragment_maps:gp,clearcoat_pars_fragment:xp,iridescence_pars_fragment:_p,opaque_fragment:vp,packing:Mp,premultiplied_alpha_fragment:yp,project_vertex:bp,dithering_fragment:Sp,dithering_pars_fragment:wp,roughnessmap_fragment:Ep,roughnessmap_pars_fragment:Tp,shadowmap_pars_fragment:Ap,shadowmap_pars_vertex:Rp,shadowmap_vertex:Cp,shadowmask_pars_fragment:Pp,skinbase_vertex:Ip,skinning_pars_vertex:Lp,skinning_vertex:Dp,skinnormal_vertex:Up,specularmap_fragment:Np,specularmap_pars_fragment:Fp,tonemapping_fragment:Op,tonemapping_pars_fragment:kp,transmission_fragment:Bp,transmission_pars_fragment:zp,uv_pars_fragment:Hp,uv_pars_vertex:Gp,uv_vertex:Vp,worldpos_vertex:Wp,background_vert:Xp,background_frag:Yp,backgroundCube_vert:qp,backgroundCube_frag:Kp,cube_vert:Zp,cube_frag:$p,depth_vert:Jp,depth_frag:Qp,distance_vert:jp,distance_frag:tm,equirect_vert:em,equirect_frag:im,linedashed_vert:nm,linedashed_frag:sm,meshbasic_vert:rm,meshbasic_frag:am,meshlambert_vert:om,meshlambert_frag:lm,meshmatcap_vert:cm,meshmatcap_frag:hm,meshnormal_vert:um,meshnormal_frag:fm,meshphong_vert:dm,meshphong_frag:pm,meshphysical_vert:mm,meshphysical_frag:gm,meshtoon_vert:xm,meshtoon_frag:_m,points_vert:vm,points_frag:Mm,shadow_vert:ym,shadow_frag:bm,sprite_vert:Sm,sprite_frag:wm},mt={common:{diffuse:{value:new Nt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new kt}},envmap:{envMap:{value:null},envMapRotation:{value:new kt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new kt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new kt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new kt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new kt},normalScale:{value:new Ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new kt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new kt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new kt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new kt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Nt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new T},probesMax:{value:new T},probesResolution:{value:new T}},points:{diffuse:{value:new Nt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0},uvTransform:{value:new kt}},sprite:{diffuse:{value:new Nt(16777215)},opacity:{value:1},center:{value:new Ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}}},Wi={basic:{uniforms:oi([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.fog]),vertexShader:Xt.meshbasic_vert,fragmentShader:Xt.meshbasic_frag},lambert:{uniforms:oi([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,mt.lights,{emissive:{value:new Nt(0)},envMapIntensity:{value:1}}]),vertexShader:Xt.meshlambert_vert,fragmentShader:Xt.meshlambert_frag},phong:{uniforms:oi([mt.common,mt.specularmap,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,mt.lights,{emissive:{value:new Nt(0)},specular:{value:new Nt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Xt.meshphong_vert,fragmentShader:Xt.meshphong_frag},standard:{uniforms:oi([mt.common,mt.envmap,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.roughnessmap,mt.metalnessmap,mt.fog,mt.lights,{emissive:{value:new Nt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Xt.meshphysical_vert,fragmentShader:Xt.meshphysical_frag},toon:{uniforms:oi([mt.common,mt.aomap,mt.lightmap,mt.emissivemap,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.gradientmap,mt.fog,mt.lights,{emissive:{value:new Nt(0)}}]),vertexShader:Xt.meshtoon_vert,fragmentShader:Xt.meshtoon_frag},matcap:{uniforms:oi([mt.common,mt.bumpmap,mt.normalmap,mt.displacementmap,mt.fog,{matcap:{value:null}}]),vertexShader:Xt.meshmatcap_vert,fragmentShader:Xt.meshmatcap_frag},points:{uniforms:oi([mt.points,mt.fog]),vertexShader:Xt.points_vert,fragmentShader:Xt.points_frag},dashed:{uniforms:oi([mt.common,mt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Xt.linedashed_vert,fragmentShader:Xt.linedashed_frag},depth:{uniforms:oi([mt.common,mt.displacementmap]),vertexShader:Xt.depth_vert,fragmentShader:Xt.depth_frag},normal:{uniforms:oi([mt.common,mt.bumpmap,mt.normalmap,mt.displacementmap,{opacity:{value:1}}]),vertexShader:Xt.meshnormal_vert,fragmentShader:Xt.meshnormal_frag},sprite:{uniforms:oi([mt.sprite,mt.fog]),vertexShader:Xt.sprite_vert,fragmentShader:Xt.sprite_frag},background:{uniforms:{uvTransform:{value:new kt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Xt.background_vert,fragmentShader:Xt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new kt}},vertexShader:Xt.backgroundCube_vert,fragmentShader:Xt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Xt.cube_vert,fragmentShader:Xt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Xt.equirect_vert,fragmentShader:Xt.equirect_frag},distance:{uniforms:oi([mt.common,mt.displacementmap,{referencePosition:{value:new T},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Xt.distance_vert,fragmentShader:Xt.distance_frag},shadow:{uniforms:oi([mt.lights,mt.fog,{color:{value:new Nt(0)},opacity:{value:1}}]),vertexShader:Xt.shadow_vert,fragmentShader:Xt.shadow_frag}};Wi.physical={uniforms:oi([Wi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new kt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new kt},clearcoatNormalScale:{value:new Ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new kt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new kt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new kt},sheen:{value:0},sheenColor:{value:new Nt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new kt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new kt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new kt},transmissionSamplerSize:{value:new Ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new kt},attenuationDistance:{value:0},attenuationColor:{value:new Nt(0)},specularColor:{value:new Nt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new kt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new kt},anisotropyVector:{value:new Ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new kt}}]),vertexShader:Xt.meshphysical_vert,fragmentShader:Xt.meshphysical_frag};const ia={r:0,b:0,g:0},Em=new Bt,mu=new kt;mu.set(-1,0,0,0,1,0,0,0,1);function Tm(s,t,e,i,n,r){const a=new Nt(0);let o=n===!0?0:1,l,c,u=null,f=0,h=null;function d(b){let S=b.isScene===!0?b.background:null;if(S&&S.isTexture){const v=b.backgroundBlurriness>0;S=t.get(S,v)}return S}function g(b){let S=!1;const v=d(b);v===null?m(a,o):v&&v.isColor&&(m(v,1),S=!0);const R=s.xr.getEnvironmentBlendMode();R==="additive"?e.buffers.color.setClear(0,0,0,1,r):R==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(s.autoClear||S)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function y(b,S){const v=d(S);v&&(v.isCubeTexture||v.mapping===Pa)?(c===void 0&&(c=new Vt(new Yt(1,1,1),new yi({name:"BackgroundCubeMaterial",uniforms:Fs(Wi.backgroundCube.uniforms),vertexShader:Wi.backgroundCube.vertexShader,fragmentShader:Wi.backgroundCube.fragmentShader,side:di,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(R,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Em.makeRotationFromEuler(S.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(mu),c.material.toneMapped=jt.getTransfer(v.colorSpace)!==oe,(u!==v||f!==v.version||h!==s.toneMapping)&&(c.material.needsUpdate=!0,u=v,f=v.version,h=s.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new Vt(new _e(2,2),new yi({name:"BackgroundMaterial",uniforms:Fs(Wi.background.uniforms),vertexShader:Wi.background.vertexShader,fragmentShader:Wi.background.fragmentShader,side:Dn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,l.material.toneMapped=jt.getTransfer(v.colorSpace)!==oe,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||f!==v.version||h!==s.toneMapping)&&(l.material.needsUpdate=!0,u=v,f=v.version,h=s.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function m(b,S){b.getRGB(ia,lu(s)),e.buffers.color.setClear(ia.r,ia.g,ia.b,S,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,S=1){a.set(b),o=S,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,m(a,o)},render:g,addToRenderList:y,dispose:p}}function Am(s,t){const e=s.getParameter(s.MAX_VERTEX_ATTRIBS),i={},n=h(null);let r=n,a=!1;function o(I,L,X,Z,N){let V=!1;const k=f(I,Z,X,L);r!==k&&(r=k,c(r.object)),V=d(I,Z,X,N),V&&g(I,Z,X,N),N!==null&&t.update(N,s.ELEMENT_ARRAY_BUFFER),(V||a)&&(a=!1,v(I,L,X,Z),N!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(N).buffer))}function l(){return s.createVertexArray()}function c(I){return s.bindVertexArray(I)}function u(I){return s.deleteVertexArray(I)}function f(I,L,X,Z){const N=Z.wireframe===!0;let V=i[L.id];V===void 0&&(V={},i[L.id]=V);const k=I.isInstancedMesh===!0?I.id:0;let K=V[k];K===void 0&&(K={},V[k]=K);let tt=K[X.id];tt===void 0&&(tt={},K[X.id]=tt);let at=tt[N];return at===void 0&&(at=h(l()),tt[N]=at),at}function h(I){const L=[],X=[],Z=[];for(let N=0;N<e;N++)L[N]=0,X[N]=0,Z[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:L,enabledAttributes:X,attributeDivisors:Z,object:I,attributes:{},index:null}}function d(I,L,X,Z){const N=r.attributes,V=L.attributes;let k=0;const K=X.getAttributes();for(const tt in K)if(K[tt].location>=0){const lt=N[tt];let Mt=V[tt];if(Mt===void 0&&(tt==="instanceMatrix"&&I.instanceMatrix&&(Mt=I.instanceMatrix),tt==="instanceColor"&&I.instanceColor&&(Mt=I.instanceColor)),lt===void 0||lt.attribute!==Mt||Mt&&lt.data!==Mt.data)return!0;k++}return r.attributesNum!==k||r.index!==Z}function g(I,L,X,Z){const N={},V=L.attributes;let k=0;const K=X.getAttributes();for(const tt in K)if(K[tt].location>=0){let lt=V[tt];lt===void 0&&(tt==="instanceMatrix"&&I.instanceMatrix&&(lt=I.instanceMatrix),tt==="instanceColor"&&I.instanceColor&&(lt=I.instanceColor));const Mt={};Mt.attribute=lt,lt&&lt.data&&(Mt.data=lt.data),N[tt]=Mt,k++}r.attributes=N,r.attributesNum=k,r.index=Z}function y(){const I=r.newAttributes;for(let L=0,X=I.length;L<X;L++)I[L]=0}function m(I){p(I,0)}function p(I,L){const X=r.newAttributes,Z=r.enabledAttributes,N=r.attributeDivisors;X[I]=1,Z[I]===0&&(s.enableVertexAttribArray(I),Z[I]=1),N[I]!==L&&(s.vertexAttribDivisor(I,L),N[I]=L)}function b(){const I=r.newAttributes,L=r.enabledAttributes;for(let X=0,Z=L.length;X<Z;X++)L[X]!==I[X]&&(s.disableVertexAttribArray(X),L[X]=0)}function S(I,L,X,Z,N,V,k){k===!0?s.vertexAttribIPointer(I,L,X,N,V):s.vertexAttribPointer(I,L,X,Z,N,V)}function v(I,L,X,Z){y();const N=Z.attributes,V=X.getAttributes(),k=L.defaultAttributeValues;for(const K in V){const tt=V[K];if(tt.location>=0){let at=N[K];if(at===void 0&&(K==="instanceMatrix"&&I.instanceMatrix&&(at=I.instanceMatrix),K==="instanceColor"&&I.instanceColor&&(at=I.instanceColor)),at!==void 0){const lt=at.normalized,Mt=at.itemSize,ne=t.get(at);if(ne===void 0)continue;const ye=ne.buffer,se=ne.type,Q=ne.bytesPerElement,ct=se===s.INT||se===s.UNSIGNED_INT||at.gpuType===Al;if(at.isInterleavedBufferAttribute){const nt=at.data,Ot=nt.stride,zt=at.offset;if(nt.isInstancedInterleavedBuffer){for(let Lt=0;Lt<tt.locationSize;Lt++)p(tt.location+Lt,nt.meshPerAttribute);I.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let Lt=0;Lt<tt.locationSize;Lt++)m(tt.location+Lt);s.bindBuffer(s.ARRAY_BUFFER,ye);for(let Lt=0;Lt<tt.locationSize;Lt++)S(tt.location+Lt,Mt/tt.locationSize,se,lt,Ot*Q,(zt+Mt/tt.locationSize*Lt)*Q,ct)}else{if(at.isInstancedBufferAttribute){for(let nt=0;nt<tt.locationSize;nt++)p(tt.location+nt,at.meshPerAttribute);I.isInstancedMesh!==!0&&Z._maxInstanceCount===void 0&&(Z._maxInstanceCount=at.meshPerAttribute*at.count)}else for(let nt=0;nt<tt.locationSize;nt++)m(tt.location+nt);s.bindBuffer(s.ARRAY_BUFFER,ye);for(let nt=0;nt<tt.locationSize;nt++)S(tt.location+nt,Mt/tt.locationSize,se,lt,Mt*Q,Mt/tt.locationSize*nt*Q,ct)}}else if(k!==void 0){const lt=k[K];if(lt!==void 0)switch(lt.length){case 2:s.vertexAttrib2fv(tt.location,lt);break;case 3:s.vertexAttrib3fv(tt.location,lt);break;case 4:s.vertexAttrib4fv(tt.location,lt);break;default:s.vertexAttrib1fv(tt.location,lt)}}}}b()}function R(){E();for(const I in i){const L=i[I];for(const X in L){const Z=L[X];for(const N in Z){const V=Z[N];for(const k in V)u(V[k].object),delete V[k];delete Z[N]}}delete i[I]}}function w(I){if(i[I.id]===void 0)return;const L=i[I.id];for(const X in L){const Z=L[X];for(const N in Z){const V=Z[N];for(const k in V)u(V[k].object),delete V[k];delete Z[N]}}delete i[I.id]}function C(I){for(const L in i){const X=i[L];for(const Z in X){const N=X[Z];if(N[I.id]===void 0)continue;const V=N[I.id];for(const k in V)u(V[k].object),delete V[k];delete N[I.id]}}}function _(I){for(const L in i){const X=i[L],Z=I.isInstancedMesh===!0?I.id:0,N=X[Z];if(N!==void 0){for(const V in N){const k=N[V];for(const K in k)u(k[K].object),delete k[K];delete N[V]}delete X[Z],Object.keys(X).length===0&&delete i[L]}}}function E(){P(),a=!0,r!==n&&(r=n,c(r.object))}function P(){n.geometry=null,n.program=null,n.wireframe=!1}return{setup:o,reset:E,resetDefaultState:P,dispose:R,releaseStatesOfGeometry:w,releaseStatesOfObject:_,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:m,disableUnusedAttributes:b}}function Rm(s,t,e){let i;function n(l){i=l}function r(l,c){s.drawArrays(i,l,c),e.update(c,i,1)}function a(l,c,u){u!==0&&(s.drawArraysInstanced(i,l,c,u),e.update(c,i,u))}function o(l,c,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,u);let h=0;for(let d=0;d<u;d++)h+=c[d];e.update(h,i,1)}this.setMode=n,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Cm(s,t,e,i){let n;function r(){if(n!==void 0)return n;if(t.has("EXT_texture_filter_anisotropic")===!0){const C=t.get("EXT_texture_filter_anisotropic");n=s.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function a(C){return!(C!==Ai&&i.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){const _=C===$i&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==Mi&&i.convert(C)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==Ti&&!_)}function l(C){if(C==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(It("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const f=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&h===!1&&It("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),g=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),p=s.getParameter(s.MAX_VERTEX_ATTRIBS),b=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),S=s.getParameter(s.MAX_VARYING_VECTORS),v=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),R=s.getParameter(s.MAX_SAMPLES),w=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:d,maxVertexTextures:g,maxTextureSize:y,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:S,maxFragmentUniforms:v,maxSamples:R,samples:w}}function Pm(s){const t=this;let e=null,i=0,n=!1,r=!1;const a=new Cn,o=new kt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){const d=f.length!==0||h||i!==0||n;return n=h,i=f.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,h){e=u(f,h,0)},this.setState=function(f,h,d){const g=f.clippingPlanes,y=f.clipIntersection,m=f.clipShadows,p=s.get(f);if(!n||g===null||g.length===0||r&&!m)r?u(null):c();else{const b=r?0:i,S=b*4;let v=p.clippingState||null;l.value=v,v=u(g,h,S,d);for(let R=0;R!==S;++R)v[R]=e[R];p.clippingState=v,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(f,h,d,g){const y=f!==null?f.length:0;let m=null;if(y!==0){if(m=l.value,g!==!0||m===null){const p=d+y*4,b=h.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let S=0,v=d;S!==y;++S,v+=4)a.copy(f[S]).applyMatrix4(b,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,m}}const Ln=4,rh=[.125,.215,.35,.446,.526,.582],qn=20,Im=256,Qs=new ql,ah=new Nt;let vo=null,Mo=0,yo=0,bo=!1;const Lm=new T;class oh{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,i=.1,n=100,r={}){const{size:a=256,position:o=Lm}=r;vo=this._renderer.getRenderTarget(),Mo=this._renderer.getActiveCubeFace(),yo=this._renderer.getActiveMipmapLevel(),bo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,i,n,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ch(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(vo,Mo,yo),this._renderer.xr.enabled=bo,t.scissorTest=!1,Es(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===jn||t.mapping===Ds?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),vo=this._renderer.getRenderTarget(),Mo=this._renderer.getActiveCubeFace(),yo=this._renderer.getActiveMipmapLevel(),bo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=e||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,i={magFilter:Qe,minFilter:Qe,generateMipmaps:!1,type:$i,format:Ai,colorSpace:va,depthBuffer:!1},n=lh(t,e,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=lh(t,e,i);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=Dm(r)),this._blurMaterial=Nm(r,t,e),this._ggxMaterial=Um(r,t,e)}return n}_compileMaterial(t){const e=new Vt(new Ne,t);this._renderer.compile(e,Qs)}_sceneToCubeUV(t,e,i,n,r){const l=new fi(90,1,e,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,d=f.toneMapping;f.getClearColor(ah),f.toneMapping=qi,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(n),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Vt(new Yt,new Wt({name:"PMREM.Background",side:di,depthWrite:!1,depthTest:!1})));const y=this._backgroundBox,m=y.material;let p=!1;const b=t.background;b?b.isColor&&(m.color.copy(b),t.background=null,p=!0):(m.color.copy(ah),p=!0);for(let S=0;S<6;S++){const v=S%3;v===0?(l.up.set(0,c[S],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+u[S],r.y,r.z)):v===1?(l.up.set(0,0,c[S]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+u[S],r.z)):(l.up.set(0,c[S],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+u[S]));const R=this._cubeSize;Es(n,v*R,S>2?R:0,R,R),f.setRenderTarget(n),p&&f.render(y,l),f.render(t,l)}f.toneMapping=d,f.autoClear=h,t.background=b}_textureToCubeUV(t,e){const i=this._renderer,n=t.mapping===jn||t.mapping===Ds;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=hh()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ch());const r=n?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;const o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;Es(e,0,0,3*l,2*l),i.setRenderTarget(e),i.render(a,Qs)}_applyPMREM(t){const e=this._renderer,i=e.autoClear;e.autoClear=!1;const n=this._lodMeshes.length;for(let r=1;r<n;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=i}_applyGGXFilter(t,e,i){const n=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),u=e/(this._lodMeshes.length-1),f=Math.sqrt(c*c-u*u),h=0+c*1.25,d=f*h,{_lodMax:g}=this,y=this._sizeLods[i],m=3*y*(i>g-Ln?i-g+Ln:0),p=4*(this._cubeSize-y);l.envMap.value=t.texture,l.roughness.value=d,l.mipInt.value=g-e,Es(r,m,p,3*y,2*y),n.setRenderTarget(r),n.render(o,Qs),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-i,Es(t,m,p,3*y,2*y),n.setRenderTarget(t),n.render(o,Qs)}_blur(t,e,i,n,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,i,n,"latitudinal",r),this._halfBlur(a,t,i,i,n,"longitudinal",r)}_halfBlur(t,e,i,n,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Qt("blur direction must be either latitudinal or longitudinal!");const u=3,f=this._lodMeshes[n];f.material=c;const h=c.uniforms,d=this._sizeLods[i]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*qn-1),y=r/g,m=isFinite(r)?1+Math.floor(u*y):qn;m>qn&&It(`sigmaRadians, ${r}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${qn}`);const p=[];let b=0;for(let C=0;C<qn;++C){const _=C/y,E=Math.exp(-_*_/2);p.push(E),C===0?b+=E:C<m&&(b+=2*E)}for(let C=0;C<p.length;C++)p[C]=p[C]/b;h.envMap.value=t.texture,h.samples.value=m,h.weights.value=p,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);const{_lodMax:S}=this;h.dTheta.value=g,h.mipInt.value=S-i;const v=this._sizeLods[n],R=3*v*(n>S-Ln?n-S+Ln:0),w=4*(this._cubeSize-v);Es(e,R,w,3*v,2*v),l.setRenderTarget(e),l.render(f,Qs)}}function Dm(s){const t=[],e=[],i=[];let n=s;const r=s-Ln+1+rh.length;for(let a=0;a<r;a++){const o=Math.pow(2,n);t.push(o);let l=1/o;a>s-Ln?l=rh[a-s+Ln-1]:a===0&&(l=0),e.push(l);const c=1/(o-2),u=-c,f=1+c,h=[u,u,f,u,f,f,u,u,f,f,u,f],d=6,g=6,y=3,m=2,p=1,b=new Float32Array(y*g*d),S=new Float32Array(m*g*d),v=new Float32Array(p*g*d);for(let w=0;w<d;w++){const C=w%3*2/3-1,_=w>2?0:-1,E=[C,_,0,C+2/3,_,0,C+2/3,_+1,0,C,_,0,C+2/3,_+1,0,C,_+1,0];b.set(E,y*g*w),S.set(h,m*g*w);const P=[w,w,w,w,w,w];v.set(P,p*g*w)}const R=new Ne;R.setAttribute("position",new Ue(b,y)),R.setAttribute("uv",new Ue(S,m)),R.setAttribute("faceIndex",new Ue(v,p)),i.push(new Vt(R,null)),n>Ln&&n--}return{lodMeshes:i,sizeLods:t,sigmas:e}}function lh(s,t,e){const i=new ki(s,t,e);return i.texture.mapping=Pa,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Es(s,t,e,i,n){s.viewport.set(t,e,i,n),s.scissor.set(t,e,i,n)}function Um(s,t,e){return new yi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Im,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ua(),fragmentShader:`

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
		`,blending:ln,depthTest:!1,depthWrite:!1})}function Nm(s,t,e){const i=new Float32Array(qn),n=new T(0,1,0);return new yi({name:"SphericalGaussianBlur",defines:{n:qn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${s}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:n}},vertexShader:Ua(),fragmentShader:`

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
		`,blending:ln,depthTest:!1,depthWrite:!1})}function ch(){return new yi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ua(),fragmentShader:`

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
		`,blending:ln,depthTest:!1,depthWrite:!1})}function hh(){return new yi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ua(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ln,depthTest:!1,depthWrite:!1})}function Ua(){return`

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
	`}class gu extends ki{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},n=[i,i,i,i,i,i];this.texture=new au(n),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},n=new Yt(5,5,5),r=new yi({name:"CubemapFromEquirect",uniforms:Fs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:di,blending:ln});r.uniforms.tEquirect.value=e;const a=new Vt(n,r),o=e.minFilter;return e.minFilter===Kn&&(e.minFilter=Qe),new Hd(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,i=!0,n=!0){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,i,n);t.setRenderTarget(r)}}function Fm(s){let t=new WeakMap,e=new WeakMap,i=null;function n(h,d=!1){return h==null?null:d?a(h):r(h)}function r(h){if(h&&h.isTexture){const d=h.mapping;if(d===Ha||d===Ga)if(t.has(h)){const g=t.get(h).texture;return o(g,h.mapping)}else{const g=h.image;if(g&&g.height>0){const y=new gu(g.height);return y.fromEquirectangularTexture(s,h),t.set(h,y),h.addEventListener("dispose",c),o(y.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){const d=h.mapping,g=d===Ha||d===Ga,y=d===jn||d===Ds;if(g||y){let m=e.get(h);const p=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return i===null&&(i=new oh(s)),m=g?i.fromEquirectangular(h,m):i.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),m.texture;if(m!==void 0)return m.texture;{const b=h.image;return g&&b&&b.height>0||y&&b&&l(b)?(i===null&&(i=new oh(s)),m=g?i.fromEquirectangular(h):i.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),h.addEventListener("dispose",u),m.texture):null}}}return h}function o(h,d){return d===Ha?h.mapping=jn:d===Ga&&(h.mapping=Ds),h}function l(h){let d=0;const g=6;for(let y=0;y<g;y++)h[y]!==void 0&&d++;return d===g}function c(h){const d=h.target;d.removeEventListener("dispose",c);const g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function u(h){const d=h.target;d.removeEventListener("dispose",u);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function f(){t=new WeakMap,e=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:n,dispose:f}}function Om(s){const t={};function e(i){if(t[i]!==void 0)return t[i];const n=s.getExtension(i);return t[i]=n,n}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){const n=e(i);return n===null&&Cs("WebGLRenderer: "+i+" extension not supported."),n}}}function km(s,t,e,i){const n={},r=new WeakMap;function a(f){const h=f.target;h.index!==null&&t.remove(h.index);for(const g in h.attributes)t.remove(h.attributes[g]);h.removeEventListener("dispose",a),delete n[h.id];const d=r.get(h);d&&(t.remove(d),r.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(f,h){return n[h.id]===!0||(h.addEventListener("dispose",a),n[h.id]=!0,e.memory.geometries++),h}function l(f){const h=f.attributes;for(const d in h)t.update(h[d],s.ARRAY_BUFFER)}function c(f){const h=[],d=f.index,g=f.attributes.position;let y=0;if(g===void 0)return;if(d!==null){const b=d.array;y=d.version;for(let S=0,v=b.length;S<v;S+=3){const R=b[S+0],w=b[S+1],C=b[S+2];h.push(R,w,w,C,C,R)}}else{const b=g.array;y=g.version;for(let S=0,v=b.length/3-1;S<v;S+=3){const R=S+0,w=S+1,C=S+2;h.push(R,w,w,C,C,R)}}const m=new(g.count>=65535?eu:Bl)(h,1);m.version=y;const p=r.get(f);p&&t.remove(p),r.set(f,m)}function u(f){const h=r.get(f);if(h){const d=f.index;d!==null&&h.version<d.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function Bm(s,t,e){let i;function n(f){i=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,h){s.drawElements(i,h,r,f*a),e.update(h,i,1)}function c(f,h,d){d!==0&&(s.drawElementsInstanced(i,h,r,f*a,d),e.update(h,i,d))}function u(f,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,r,f,0,d);let y=0;for(let m=0;m<d;m++)y+=h[m];e.update(y,i,1)}this.setMode=n,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function zm(s){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,a,o){switch(e.calls++,a){case s.TRIANGLES:e.triangles+=o*(r/3);break;case s.LINES:e.lines+=o*(r/2);break;case s.LINE_STRIP:e.lines+=o*(r-1);break;case s.LINE_LOOP:e.lines+=o*r;break;case s.POINTS:e.points+=o*r;break;default:Qt("WebGLInfo: Unknown draw mode:",a);break}}function n(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:n,update:i}}function Hm(s,t,e){const i=new WeakMap,n=new he;function r(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let h=i.get(o);if(h===void 0||h.count!==f){let P=function(){_.dispose(),i.delete(o),o.removeEventListener("dispose",P)};var d=P;h!==void 0&&h.texture.dispose();const g=o.morphAttributes.position!==void 0,y=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],b=o.morphAttributes.normal||[],S=o.morphAttributes.color||[];let v=0;g===!0&&(v=1),y===!0&&(v=2),m===!0&&(v=3);let R=o.attributes.position.count*v,w=1;R>t.maxTextureSize&&(w=Math.ceil(R/t.maxTextureSize),R=t.maxTextureSize);const C=new Float32Array(R*w*4*f),_=new Qh(C,R,w,f);_.type=Ti,_.needsUpdate=!0;const E=v*4;for(let I=0;I<f;I++){const L=p[I],X=b[I],Z=S[I],N=R*w*4*I;for(let V=0;V<L.count;V++){const k=V*E;g===!0&&(n.fromBufferAttribute(L,V),C[N+k+0]=n.x,C[N+k+1]=n.y,C[N+k+2]=n.z,C[N+k+3]=0),y===!0&&(n.fromBufferAttribute(X,V),C[N+k+4]=n.x,C[N+k+5]=n.y,C[N+k+6]=n.z,C[N+k+7]=0),m===!0&&(n.fromBufferAttribute(Z,V),C[N+k+8]=n.x,C[N+k+9]=n.y,C[N+k+10]=n.z,C[N+k+11]=Z.itemSize===4?n.w:1)}}h={count:f,texture:_,size:new Ut(R,w)},i.set(o,h),o.addEventListener("dispose",P)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,e);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];const y=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(s,"morphTargetBaseInfluence",y),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(s,"morphTargetsTextureSize",h.size)}return{update:r}}function Gm(s,t,e,i,n){let r=new WeakMap;function a(c){const u=n.render.frame,f=c.geometry,h=t.get(c,f);if(r.get(h)!==u&&(t.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(e.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,s.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){const d=c.skeleton;r.get(d)!==u&&(d.update(),r.set(d,u))}return h}function o(){r=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}const Vm={[Oh]:"LINEAR_TONE_MAPPING",[kh]:"REINHARD_TONE_MAPPING",[Bh]:"CINEON_TONE_MAPPING",[zh]:"ACES_FILMIC_TONE_MAPPING",[Gh]:"AGX_TONE_MAPPING",[Vh]:"NEUTRAL_TONE_MAPPING",[Hh]:"CUSTOM_TONE_MAPPING"};function Wm(s,t,e,i,n,r){const a=new ki(t,e,{type:s,depthBuffer:n,stencilBuffer:r,samples:i?4:0,depthTexture:n?new Ns(t,e):void 0}),o=new ki(t,e,{type:$i,depthBuffer:!1,stencilBuffer:!1}),l=new Ne;l.setAttribute("position",new xe([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new xe([0,2,0,0,2,0],2));const c=new Ud({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),u=new Vt(l,c),f=new ql(-1,1,1,-1,0,1);let h=null,d=null,g=!1,y,m=null,p=[],b=!1;this.setSize=function(S,v){a.setSize(S,v),o.setSize(S,v);for(let R=0;R<p.length;R++){const w=p[R];w.setSize&&w.setSize(S,v)}},this.setEffects=function(S){p=S,b=p.length>0&&p[0].isRenderPass===!0;const v=a.width,R=a.height;for(let w=0;w<p.length;w++){const C=p[w];C.setSize&&C.setSize(v,R)}},this.begin=function(S,v){if(g||S.toneMapping===qi&&p.length===0)return!1;if(m=v,v!==null){const R=v.width,w=v.height;(a.width!==R||a.height!==w)&&this.setSize(R,w)}return b===!1&&S.setRenderTarget(a),y=S.toneMapping,S.toneMapping=qi,!0},this.hasRenderPass=function(){return b},this.end=function(S,v){S.toneMapping=y,g=!0;let R=a,w=o;for(let C=0;C<p.length;C++){const _=p[C];if(_.enabled!==!1&&(_.render(S,w,R,v),_.needsSwap!==!1)){const E=R;R=w,w=E}}if(h!==S.outputColorSpace||d!==S.toneMapping){h=S.outputColorSpace,d=S.toneMapping,c.defines={},jt.getTransfer(h)===oe&&(c.defines.SRGB_TRANSFER="");const C=Vm[d];C&&(c.defines[C]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=R.texture,S.setRenderTarget(m),S.render(u,f),m=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),l.dispose(),c.dispose()}}const xu=new si,yl=new Ns(1,1),_u=new Qh,vu=new Qf,Mu=new au,uh=[],fh=[],dh=new Float32Array(16),ph=new Float32Array(9),mh=new Float32Array(4);function zs(s,t,e){const i=s[0];if(i<=0||i>0)return s;const n=t*e;let r=uh[n];if(r===void 0&&(r=new Float32Array(n),uh[n]=r),t!==0){i.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,s[a].toArray(r,o)}return r}function Ge(s,t){if(s.length!==t.length)return!1;for(let e=0,i=s.length;e<i;e++)if(s[e]!==t[e])return!1;return!0}function Ve(s,t){for(let e=0,i=t.length;e<i;e++)s[e]=t[e]}function Na(s,t){let e=fh[t];e===void 0&&(e=new Int32Array(t),fh[t]=e);for(let i=0;i!==t;++i)e[i]=s.allocateTextureUnit();return e}function Xm(s,t){const e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function Ym(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;s.uniform2fv(this.addr,t),Ve(e,t)}}function qm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ge(e,t))return;s.uniform3fv(this.addr,t),Ve(e,t)}}function Km(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;s.uniform4fv(this.addr,t),Ve(e,t)}}function Zm(s,t){const e=this.cache,i=t.elements;if(i===void 0){if(Ge(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),Ve(e,t)}else{if(Ge(e,i))return;mh.set(i),s.uniformMatrix2fv(this.addr,!1,mh),Ve(e,i)}}function $m(s,t){const e=this.cache,i=t.elements;if(i===void 0){if(Ge(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),Ve(e,t)}else{if(Ge(e,i))return;ph.set(i),s.uniformMatrix3fv(this.addr,!1,ph),Ve(e,i)}}function Jm(s,t){const e=this.cache,i=t.elements;if(i===void 0){if(Ge(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),Ve(e,t)}else{if(Ge(e,i))return;dh.set(i),s.uniformMatrix4fv(this.addr,!1,dh),Ve(e,i)}}function Qm(s,t){const e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function jm(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;s.uniform2iv(this.addr,t),Ve(e,t)}}function tg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;s.uniform3iv(this.addr,t),Ve(e,t)}}function eg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;s.uniform4iv(this.addr,t),Ve(e,t)}}function ig(s,t){const e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function ng(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ge(e,t))return;s.uniform2uiv(this.addr,t),Ve(e,t)}}function sg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ge(e,t))return;s.uniform3uiv(this.addr,t),Ve(e,t)}}function rg(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ge(e,t))return;s.uniform4uiv(this.addr,t),Ve(e,t)}}function ag(s,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n);let r;this.type===s.SAMPLER_2D_SHADOW?(yl.compareFunction=e.isReversedDepthBuffer()?Nl:Ul,r=yl):r=xu,e.setTexture2D(t||r,n)}function og(s,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n),e.setTexture3D(t||vu,n)}function lg(s,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n),e.setTextureCube(t||Mu,n)}function cg(s,t,e){const i=this.cache,n=e.allocateTextureUnit();i[0]!==n&&(s.uniform1i(this.addr,n),i[0]=n),e.setTexture2DArray(t||_u,n)}function hg(s){switch(s){case 5126:return Xm;case 35664:return Ym;case 35665:return qm;case 35666:return Km;case 35674:return Zm;case 35675:return $m;case 35676:return Jm;case 5124:case 35670:return Qm;case 35667:case 35671:return jm;case 35668:case 35672:return tg;case 35669:case 35673:return eg;case 5125:return ig;case 36294:return ng;case 36295:return sg;case 36296:return rg;case 35678:case 36198:case 36298:case 36306:case 35682:return ag;case 35679:case 36299:case 36307:return og;case 35680:case 36300:case 36308:case 36293:return lg;case 36289:case 36303:case 36311:case 36292:return cg}}function ug(s,t){s.uniform1fv(this.addr,t)}function fg(s,t){const e=zs(t,this.size,2);s.uniform2fv(this.addr,e)}function dg(s,t){const e=zs(t,this.size,3);s.uniform3fv(this.addr,e)}function pg(s,t){const e=zs(t,this.size,4);s.uniform4fv(this.addr,e)}function mg(s,t){const e=zs(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function gg(s,t){const e=zs(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function xg(s,t){const e=zs(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function _g(s,t){s.uniform1iv(this.addr,t)}function vg(s,t){s.uniform2iv(this.addr,t)}function Mg(s,t){s.uniform3iv(this.addr,t)}function yg(s,t){s.uniform4iv(this.addr,t)}function bg(s,t){s.uniform1uiv(this.addr,t)}function Sg(s,t){s.uniform2uiv(this.addr,t)}function wg(s,t){s.uniform3uiv(this.addr,t)}function Eg(s,t){s.uniform4uiv(this.addr,t)}function Tg(s,t,e){const i=this.cache,n=t.length,r=Na(e,n);Ge(i,r)||(s.uniform1iv(this.addr,r),Ve(i,r));let a;this.type===s.SAMPLER_2D_SHADOW?a=yl:a=xu;for(let o=0;o!==n;++o)e.setTexture2D(t[o]||a,r[o])}function Ag(s,t,e){const i=this.cache,n=t.length,r=Na(e,n);Ge(i,r)||(s.uniform1iv(this.addr,r),Ve(i,r));for(let a=0;a!==n;++a)e.setTexture3D(t[a]||vu,r[a])}function Rg(s,t,e){const i=this.cache,n=t.length,r=Na(e,n);Ge(i,r)||(s.uniform1iv(this.addr,r),Ve(i,r));for(let a=0;a!==n;++a)e.setTextureCube(t[a]||Mu,r[a])}function Cg(s,t,e){const i=this.cache,n=t.length,r=Na(e,n);Ge(i,r)||(s.uniform1iv(this.addr,r),Ve(i,r));for(let a=0;a!==n;++a)e.setTexture2DArray(t[a]||_u,r[a])}function Pg(s){switch(s){case 5126:return ug;case 35664:return fg;case 35665:return dg;case 35666:return pg;case 35674:return mg;case 35675:return gg;case 35676:return xg;case 5124:case 35670:return _g;case 35667:case 35671:return vg;case 35668:case 35672:return Mg;case 35669:case 35673:return yg;case 5125:return bg;case 36294:return Sg;case 36295:return wg;case 36296:return Eg;case 35678:case 36198:case 36298:case 36306:case 35682:return Tg;case 35679:case 36299:case 36307:return Ag;case 35680:case 36300:case 36308:case 36293:return Rg;case 36289:case 36303:case 36311:case 36292:return Cg}}class Ig{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=hg(e.type)}}class Lg{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Pg(e.type)}}class Dg{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const n=this.seq;for(let r=0,a=n.length;r!==a;++r){const o=n[r];o.setValue(t,e[o.id],i)}}}const So=/(\w+)(\])?(\[|\.)?/g;function gh(s,t){s.seq.push(t),s.map[t.id]=t}function Ug(s,t,e){const i=s.name,n=i.length;for(So.lastIndex=0;;){const r=So.exec(i),a=So.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===n){gh(e,c===void 0?new Ig(o,s,t):new Lg(o,s,t));break}else{let f=e.map[o];f===void 0&&(f=new Dg(o),gh(e,f)),e=f}}}class fa{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);Ug(o,l,this)}const n=[],r=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?n.push(a):r.push(a);n.length>0&&(this.seq=n.concat(r))}setValue(t,e,i,n){const r=this.map[e];r!==void 0&&r.setValue(t,i,n)}setOptional(t,e,i){const n=e[i];n!==void 0&&this.setValue(t,i,n)}static upload(t,e,i,n){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,n)}}static seqWithValue(t,e){const i=[];for(let n=0,r=t.length;n!==r;++n){const a=t[n];a.id in e&&i.push(a)}return i}}function xh(s,t,e){const i=s.createShader(t);return s.shaderSource(i,e),s.compileShader(i),i}const Ng=37297;let Fg=0;function Og(s,t){const e=s.split(`
`),i=[],n=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=n;a<r;a++){const o=a+1;i.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return i.join(`
`)}const _h=new kt;function kg(s){jt._getMatrix(_h,jt.workingColorSpace,s);const t=`mat3( ${_h.elements.map(e=>e.toFixed(4))} )`;switch(jt.getTransfer(s)){case Ma:return[t,"LinearTransferOETF"];case oe:return[t,"sRGBTransferOETF"];default:return It("WebGLProgram: Unsupported color space: ",s),[t,"LinearTransferOETF"]}}function vh(s,t,e){const i=s.getShaderParameter(t,s.COMPILE_STATUS),r=(s.getShaderInfoLog(t)||"").trim();if(i&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+Og(s.getShaderSource(t),o)}else return r}function Bg(s,t){const e=kg(t);return[`vec4 ${s}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const zg={[Oh]:"Linear",[kh]:"Reinhard",[Bh]:"Cineon",[zh]:"ACESFilmic",[Gh]:"AgX",[Vh]:"Neutral",[Hh]:"Custom"};function Hg(s,t){const e=zg[t];return e===void 0?(It("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const na=new T;function Gg(){jt.getLuminanceCoefficients(na);const s=na.x.toFixed(4),t=na.y.toFixed(4),e=na.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Vg(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(sr).join(`
`)}function Wg(s){const t=[];for(const e in s){const i=s[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function Xg(s,t){const e={},i=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){const r=s.getActiveAttrib(t,n),a=r.name;let o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:s.getAttribLocation(t,a),locationSize:o}}return e}function sr(s){return s!==""}function Mh(s,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function yh(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Yg=/^[ \t]*#include +<([\w\d./]+)>/gm;function bl(s){return s.replace(Yg,Kg)}const qg=new Map;function Kg(s,t){let e=Xt[t];if(e===void 0){const i=qg.get(t);if(i!==void 0)e=Xt[i],It('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return bl(e)}const Zg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bh(s){return s.replace(Zg,$g)}function $g(s,t,e,i){let n="";for(let r=parseInt(t);r<parseInt(e);r++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return n}function Sh(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const Jg={[oa]:"SHADOWMAP_TYPE_PCF",[nr]:"SHADOWMAP_TYPE_VSM"};function Qg(s){return Jg[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const jg={[jn]:"ENVMAP_TYPE_CUBE",[Ds]:"ENVMAP_TYPE_CUBE",[Pa]:"ENVMAP_TYPE_CUBE_UV"};function tx(s){return s.envMap===!1?"ENVMAP_TYPE_CUBE":jg[s.envMapMode]||"ENVMAP_TYPE_CUBE"}const ex={[Ds]:"ENVMAP_MODE_REFRACTION"};function ix(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":ex[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}const nx={[Ca]:"ENVMAP_BLENDING_MULTIPLY",[mf]:"ENVMAP_BLENDING_MIX",[gf]:"ENVMAP_BLENDING_ADD"};function sx(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":nx[s.combine]||"ENVMAP_BLENDING_NONE"}function rx(s){const t=s.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:i,maxMip:e}}function ax(s,t,e,i){const n=s.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=Qg(e),c=tx(e),u=ix(e),f=sx(e),h=rx(e),d=Vg(e),g=Wg(r),y=n.createProgram();let m,p,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(sr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(sr).join(`
`),p.length>0&&(p+=`
`)):(m=[Sh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(sr).join(`
`),p=[Sh(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==qi?"#define TONE_MAPPING":"",e.toneMapping!==qi?Xt.tonemapping_pars_fragment:"",e.toneMapping!==qi?Hg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Xt.colorspace_pars_fragment,Bg("linearToOutputTexel",e.outputColorSpace),Gg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(sr).join(`
`)),a=bl(a),a=Mh(a,e),a=yh(a,e),o=bl(o),o=Mh(o,e),o=yh(o,e),a=bh(a),o=bh(o),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===_c?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===_c?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const S=b+m+a,v=b+p+o,R=xh(n,n.VERTEX_SHADER,S),w=xh(n,n.FRAGMENT_SHADER,v);n.attachShader(y,R),n.attachShader(y,w),e.index0AttributeName!==void 0?n.bindAttribLocation(y,0,e.index0AttributeName):e.hasPositionAttribute===!0&&n.bindAttribLocation(y,0,"position"),n.linkProgram(y);function C(I){if(s.debug.checkShaderErrors){const L=n.getProgramInfoLog(y)||"",X=n.getShaderInfoLog(R)||"",Z=n.getShaderInfoLog(w)||"",N=L.trim(),V=X.trim(),k=Z.trim();let K=!0,tt=!0;if(n.getProgramParameter(y,n.LINK_STATUS)===!1)if(K=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(n,y,R,w);else{const at=vh(n,R,"vertex"),lt=vh(n,w,"fragment");Qt("WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(y,n.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+N+`
`+at+`
`+lt)}else N!==""?It("WebGLProgram: Program Info Log:",N):(V===""||k==="")&&(tt=!1);tt&&(I.diagnostics={runnable:K,programLog:N,vertexShader:{log:V,prefix:m},fragmentShader:{log:k,prefix:p}})}n.deleteShader(R),n.deleteShader(w),_=new fa(n,y),E=Xg(n,y)}let _;this.getUniforms=function(){return _===void 0&&C(this),_};let E;this.getAttributes=function(){return E===void 0&&C(this),E};let P=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=n.getProgramParameter(y,Ng)),P},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Fg++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=R,this.fragmentShader=w,this}let ox=0;class lx{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,i){const n=this._getShaderCacheForMaterial(t);return n.has(e)===!1&&(n.add(e),e.usedTimes++),n.has(i)===!1&&(n.add(i),i.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new cx(t),e.set(t,i)),i}}class cx{constructor(t){this.id=ox++,this.code=t,this.usedTimes=0}}function hx(s){return s===ts||s===ga||s===xa}function ux(s,t,e,i,n,r){const a=new kl,o=new lx,l=new Set,c=[],u=new Map,f=i.logarithmicDepthBuffer;let h=i.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return l.add(_),_===0?"uv":`uv${_}`}function y(_,E,P,I,L,X){const Z=I.fog,N=L.geometry,V=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?I.environment:null,k=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,K=t.get(_.envMap||V,k),tt=K&&K.mapping===Pa?K.image.height:null,at=d[_.type];_.precision!==null&&(h=i.getMaxPrecision(_.precision),h!==_.precision&&It("WebGLProgram.getParameters:",_.precision,"not supported, using",h,"instead."));const lt=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,Mt=lt!==void 0?lt.length:0;let ne=0;N.morphAttributes.position!==void 0&&(ne=1),N.morphAttributes.normal!==void 0&&(ne=2),N.morphAttributes.color!==void 0&&(ne=3);let ye,se,Q,ct;if(at){const wt=Wi[at];ye=wt.vertexShader,se=wt.fragmentShader}else{ye=_.vertexShader,se=_.fragmentShader;const wt=o.getVertexShaderStage(_),Se=o.getFragmentShaderStage(_);o.update(_,wt,Se),Q=wt.id,ct=Se.id}const nt=s.getRenderTarget(),Ot=s.state.buffers.depth.getReversed(),zt=L.isInstancedMesh===!0,Lt=L.isBatchedMesh===!0,Ce=!!_.map,$t=!!_.matcap,ue=!!K,re=!!_.aoMap,ee=!!_.lightMap,Fe=!!_.bumpMap&&_.wireframe===!1,ze=!!_.normalMap,We=!!_.displacementMap,qe=!!_.emissiveMap,be=!!_.metalnessMap,Oe=!!_.roughnessMap,U=_.anisotropy>0,ci=_.clearcoat>0,ae=_.dispersion>0,A=_.iridescence>0,x=_.sheen>0,O=_.transmission>0,G=U&&!!_.anisotropyMap,Y=ci&&!!_.clearcoatMap,rt=ci&&!!_.clearcoatNormalMap,ht=ci&&!!_.clearcoatRoughnessMap,q=A&&!!_.iridescenceMap,J=A&&!!_.iridescenceThicknessMap,ut=x&&!!_.sheenColorMap,At=x&&!!_.sheenRoughnessMap,pt=!!_.specularMap,ft=!!_.specularColorMap,Pt=!!_.specularIntensityMap,Dt=O&&!!_.transmissionMap,Ht=O&&!!_.thicknessMap,D=!!_.gradientMap,ot=!!_.alphaMap,$=_.alphaTest>0,dt=!!_.alphaHash,_t=!!_.extensions;let j=qi;_.toneMapped&&(nt===null||nt.isXRRenderTarget===!0)&&(j=s.toneMapping);const Tt={shaderID:at,shaderType:_.type,shaderName:_.name,vertexShader:ye,fragmentShader:se,defines:_.defines,customVertexShaderID:Q,customFragmentShaderID:ct,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:h,batching:Lt,batchingColor:Lt&&L._colorsTexture!==null,instancing:zt,instancingColor:zt&&L.instanceColor!==null,instancingMorph:zt&&L.morphTexture!==null,outputColorSpace:nt===null?s.outputColorSpace:nt.isXRRenderTarget===!0?nt.texture.colorSpace:jt.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Ce,matcap:$t,envMap:ue,envMapMode:ue&&K.mapping,envMapCubeUVHeight:tt,aoMap:re,lightMap:ee,bumpMap:Fe,normalMap:ze,displacementMap:We,emissiveMap:qe,normalMapObjectSpace:ze&&_.normalMapType===Mf,normalMapTangentSpace:ze&&_.normalMapType===_a,packedNormalMap:ze&&_.normalMapType===_a&&hx(_.normalMap.format),metalnessMap:be,roughnessMap:Oe,anisotropy:U,anisotropyMap:G,clearcoat:ci,clearcoatMap:Y,clearcoatNormalMap:rt,clearcoatRoughnessMap:ht,dispersion:ae,iridescence:A,iridescenceMap:q,iridescenceThicknessMap:J,sheen:x,sheenColorMap:ut,sheenRoughnessMap:At,specularMap:pt,specularColorMap:ft,specularIntensityMap:Pt,transmission:O,transmissionMap:Dt,thicknessMap:Ht,gradientMap:D,opaque:_.transparent===!1&&_.blending===$n&&_.alphaToCoverage===!1,alphaMap:ot,alphaTest:$,alphaHash:dt,combine:_.combine,mapUv:Ce&&g(_.map.channel),aoMapUv:re&&g(_.aoMap.channel),lightMapUv:ee&&g(_.lightMap.channel),bumpMapUv:Fe&&g(_.bumpMap.channel),normalMapUv:ze&&g(_.normalMap.channel),displacementMapUv:We&&g(_.displacementMap.channel),emissiveMapUv:qe&&g(_.emissiveMap.channel),metalnessMapUv:be&&g(_.metalnessMap.channel),roughnessMapUv:Oe&&g(_.roughnessMap.channel),anisotropyMapUv:G&&g(_.anisotropyMap.channel),clearcoatMapUv:Y&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:rt&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ht&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:q&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:J&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:ut&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:At&&g(_.sheenRoughnessMap.channel),specularMapUv:pt&&g(_.specularMap.channel),specularColorMapUv:ft&&g(_.specularColorMap.channel),specularIntensityMapUv:Pt&&g(_.specularIntensityMap.channel),transmissionMapUv:Dt&&g(_.transmissionMap.channel),thicknessMapUv:Ht&&g(_.thicknessMap.channel),alphaMapUv:ot&&g(_.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(ze||U),vertexNormals:!!N.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!N.attributes.uv&&(Ce||ot),fog:!!Z,useFog:_.fog===!0,fogExp2:!!Z&&Z.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||N.attributes.normal===void 0&&ze===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Ot,skinning:L.isSkinnedMesh===!0,hasPositionAttribute:N.attributes.position!==void 0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:Mt,morphTextureStride:ne,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:X.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:s.shadowMap.enabled&&P.length>0,shadowMapType:s.shadowMap.type,toneMapping:j,decodeVideoTexture:Ce&&_.map.isVideoTexture===!0&&jt.getTransfer(_.map.colorSpace)===oe,decodeVideoTextureEmissive:qe&&_.emissiveMap.isVideoTexture===!0&&jt.getTransfer(_.emissiveMap.colorSpace)===oe,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ui,flipSided:_.side===di,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:_t&&_.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(_t&&_.extensions.multiDraw===!0||Lt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Tt.vertexUv1s=l.has(1),Tt.vertexUv2s=l.has(2),Tt.vertexUv3s=l.has(3),l.clear(),Tt}function m(_){const E=[];if(_.shaderID?E.push(_.shaderID):(E.push(_.customVertexShaderID),E.push(_.customFragmentShaderID)),_.defines!==void 0)for(const P in _.defines)E.push(P),E.push(_.defines[P]);return _.isRawShaderMaterial===!1&&(p(E,_),b(E,_),E.push(s.outputColorSpace)),E.push(_.customProgramCacheKey),E.join()}function p(_,E){_.push(E.precision),_.push(E.outputColorSpace),_.push(E.envMapMode),_.push(E.envMapCubeUVHeight),_.push(E.mapUv),_.push(E.alphaMapUv),_.push(E.lightMapUv),_.push(E.aoMapUv),_.push(E.bumpMapUv),_.push(E.normalMapUv),_.push(E.displacementMapUv),_.push(E.emissiveMapUv),_.push(E.metalnessMapUv),_.push(E.roughnessMapUv),_.push(E.anisotropyMapUv),_.push(E.clearcoatMapUv),_.push(E.clearcoatNormalMapUv),_.push(E.clearcoatRoughnessMapUv),_.push(E.iridescenceMapUv),_.push(E.iridescenceThicknessMapUv),_.push(E.sheenColorMapUv),_.push(E.sheenRoughnessMapUv),_.push(E.specularMapUv),_.push(E.specularColorMapUv),_.push(E.specularIntensityMapUv),_.push(E.transmissionMapUv),_.push(E.thicknessMapUv),_.push(E.combine),_.push(E.fogExp2),_.push(E.sizeAttenuation),_.push(E.morphTargetsCount),_.push(E.morphAttributeCount),_.push(E.numDirLights),_.push(E.numPointLights),_.push(E.numSpotLights),_.push(E.numSpotLightMaps),_.push(E.numHemiLights),_.push(E.numRectAreaLights),_.push(E.numDirLightShadows),_.push(E.numPointLightShadows),_.push(E.numSpotLightShadows),_.push(E.numSpotLightShadowsWithMaps),_.push(E.numLightProbes),_.push(E.shadowMapType),_.push(E.toneMapping),_.push(E.numClippingPlanes),_.push(E.numClipIntersection),_.push(E.depthPacking)}function b(_,E){a.disableAll(),E.instancing&&a.enable(0),E.instancingColor&&a.enable(1),E.instancingMorph&&a.enable(2),E.matcap&&a.enable(3),E.envMap&&a.enable(4),E.normalMapObjectSpace&&a.enable(5),E.normalMapTangentSpace&&a.enable(6),E.clearcoat&&a.enable(7),E.iridescence&&a.enable(8),E.alphaTest&&a.enable(9),E.vertexColors&&a.enable(10),E.vertexAlphas&&a.enable(11),E.vertexUv1s&&a.enable(12),E.vertexUv2s&&a.enable(13),E.vertexUv3s&&a.enable(14),E.vertexTangents&&a.enable(15),E.anisotropy&&a.enable(16),E.alphaHash&&a.enable(17),E.batching&&a.enable(18),E.dispersion&&a.enable(19),E.batchingColor&&a.enable(20),E.gradientMap&&a.enable(21),E.packedNormalMap&&a.enable(22),E.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),E.numLightProbeGrids>0&&a.enable(22),E.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function S(_){const E=d[_.type];let P;if(E){const I=Wi[E];P=Id.clone(I.uniforms)}else P=_.uniforms;return P}function v(_,E){let P=u.get(E);return P!==void 0?++P.usedTimes:(P=new ax(s,E,_,n),c.push(P),u.set(E,P)),P}function R(_){if(--_.usedTimes===0){const E=c.indexOf(_);c[E]=c[c.length-1],c.pop(),u.delete(_.cacheKey),_.destroy()}}function w(_){o.remove(_)}function C(){o.dispose()}return{getParameters:y,getProgramCacheKey:m,getUniforms:S,acquireProgram:v,releaseProgram:R,releaseShaderCache:w,programs:c,dispose:C}}function fx(){let s=new WeakMap;function t(a){return s.has(a)}function e(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function i(a){s.delete(a)}function n(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:t,get:e,remove:i,update:n,dispose:r}}function dx(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.materialVariant!==t.materialVariant?s.materialVariant-t.materialVariant:s.z!==t.z?s.z-t.z:s.id-t.id}function wh(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function Eh(){const s=[];let t=0;const e=[],i=[],n=[];function r(){t=0,e.length=0,i.length=0,n.length=0}function a(h){let d=0;return h.isInstancedMesh&&(d+=2),h.isSkinnedMesh&&(d+=1),d}function o(h,d,g,y,m,p){let b=s[t];return b===void 0?(b={id:h.id,object:h,geometry:d,material:g,materialVariant:a(h),groupOrder:y,renderOrder:h.renderOrder,z:m,group:p},s[t]=b):(b.id=h.id,b.object=h,b.geometry=d,b.material=g,b.materialVariant=a(h),b.groupOrder=y,b.renderOrder=h.renderOrder,b.z=m,b.group=p),t++,b}function l(h,d,g,y,m,p){const b=o(h,d,g,y,m,p);g.transmission>0?i.push(b):g.transparent===!0?n.push(b):e.push(b)}function c(h,d,g,y,m,p){const b=o(h,d,g,y,m,p);g.transmission>0?i.unshift(b):g.transparent===!0?n.unshift(b):e.unshift(b)}function u(h,d,g){e.length>1&&e.sort(h||dx),i.length>1&&i.sort(d||wh),n.length>1&&n.sort(d||wh),g&&(e.reverse(),i.reverse(),n.reverse())}function f(){for(let h=t,d=s.length;h<d;h++){const g=s[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:i,transparent:n,init:r,push:l,unshift:c,finish:f,sort:u}}function px(){let s=new WeakMap;function t(i,n){const r=s.get(i);let a;return r===void 0?(a=new Eh,s.set(i,[a])):n>=r.length?(a=new Eh,r.push(a)):a=r[n],a}function e(){s=new WeakMap}return{get:t,dispose:e}}function mx(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new T,color:new Nt};break;case"SpotLight":e={position:new T,direction:new T,color:new Nt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new T,color:new Nt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new T,skyColor:new Nt,groundColor:new Nt};break;case"RectAreaLight":e={color:new Nt,position:new T,halfWidth:new T,halfHeight:new T};break}return s[t.id]=e,e}}}function gx(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}let xx=0;function _x(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function vx(s){const t=new mx,e=gx(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new T);const n=new T,r=new Bt,a=new Bt;function o(c){let u=0,f=0,h=0;for(let E=0;E<9;E++)i.probe[E].set(0,0,0);let d=0,g=0,y=0,m=0,p=0,b=0,S=0,v=0,R=0,w=0,C=0;c.sort(_x);for(let E=0,P=c.length;E<P;E++){const I=c[E],L=I.color,X=I.intensity,Z=I.distance;let N=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===ts?N=I.shadow.map.texture:N=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)u+=L.r*X,f+=L.g*X,h+=L.b*X;else if(I.isLightProbe){for(let V=0;V<9;V++)i.probe[V].addScaledVector(I.sh.coefficients[V],X);C++}else if(I.isDirectionalLight){const V=t.get(I);if(V.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){const k=I.shadow,K=e.get(I);K.shadowIntensity=k.intensity,K.shadowBias=k.bias,K.shadowNormalBias=k.normalBias,K.shadowRadius=k.radius,K.shadowMapSize=k.mapSize,i.directionalShadow[d]=K,i.directionalShadowMap[d]=N,i.directionalShadowMatrix[d]=I.shadow.matrix,b++}i.directional[d]=V,d++}else if(I.isSpotLight){const V=t.get(I);V.position.setFromMatrixPosition(I.matrixWorld),V.color.copy(L).multiplyScalar(X),V.distance=Z,V.coneCos=Math.cos(I.angle),V.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),V.decay=I.decay,i.spot[y]=V;const k=I.shadow;if(I.map&&(i.spotLightMap[R]=I.map,R++,k.updateMatrices(I),I.castShadow&&w++),i.spotLightMatrix[y]=k.matrix,I.castShadow){const K=e.get(I);K.shadowIntensity=k.intensity,K.shadowBias=k.bias,K.shadowNormalBias=k.normalBias,K.shadowRadius=k.radius,K.shadowMapSize=k.mapSize,i.spotShadow[y]=K,i.spotShadowMap[y]=N,v++}y++}else if(I.isRectAreaLight){const V=t.get(I);V.color.copy(L).multiplyScalar(X),V.halfWidth.set(I.width*.5,0,0),V.halfHeight.set(0,I.height*.5,0),i.rectArea[m]=V,m++}else if(I.isPointLight){const V=t.get(I);if(V.color.copy(I.color).multiplyScalar(I.intensity),V.distance=I.distance,V.decay=I.decay,I.castShadow){const k=I.shadow,K=e.get(I);K.shadowIntensity=k.intensity,K.shadowBias=k.bias,K.shadowNormalBias=k.normalBias,K.shadowRadius=k.radius,K.shadowMapSize=k.mapSize,K.shadowCameraNear=k.camera.near,K.shadowCameraFar=k.camera.far,i.pointShadow[g]=K,i.pointShadowMap[g]=N,i.pointShadowMatrix[g]=I.shadow.matrix,S++}i.point[g]=V,g++}else if(I.isHemisphereLight){const V=t.get(I);V.skyColor.copy(I.color).multiplyScalar(X),V.groundColor.copy(I.groundColor).multiplyScalar(X),i.hemi[p]=V,p++}}m>0&&(s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=mt.LTC_FLOAT_1,i.rectAreaLTC2=mt.LTC_FLOAT_2):(i.rectAreaLTC1=mt.LTC_HALF_1,i.rectAreaLTC2=mt.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=f,i.ambient[2]=h;const _=i.hash;(_.directionalLength!==d||_.pointLength!==g||_.spotLength!==y||_.rectAreaLength!==m||_.hemiLength!==p||_.numDirectionalShadows!==b||_.numPointShadows!==S||_.numSpotShadows!==v||_.numSpotMaps!==R||_.numLightProbes!==C)&&(i.directional.length=d,i.spot.length=y,i.rectArea.length=m,i.point.length=g,i.hemi.length=p,i.directionalShadow.length=b,i.directionalShadowMap.length=b,i.pointShadow.length=S,i.pointShadowMap.length=S,i.spotShadow.length=v,i.spotShadowMap.length=v,i.directionalShadowMatrix.length=b,i.pointShadowMatrix.length=S,i.spotLightMatrix.length=v+R-w,i.spotLightMap.length=R,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=C,_.directionalLength=d,_.pointLength=g,_.spotLength=y,_.rectAreaLength=m,_.hemiLength=p,_.numDirectionalShadows=b,_.numPointShadows=S,_.numSpotShadows=v,_.numSpotMaps=R,_.numLightProbes=C,i.version=xx++)}function l(c,u){let f=0,h=0,d=0,g=0,y=0;const m=u.matrixWorldInverse;for(let p=0,b=c.length;p<b;p++){const S=c[p];if(S.isDirectionalLight){const v=i.directional[f];v.direction.setFromMatrixPosition(S.matrixWorld),n.setFromMatrixPosition(S.target.matrixWorld),v.direction.sub(n),v.direction.transformDirection(m),f++}else if(S.isSpotLight){const v=i.spot[d];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(m),v.direction.setFromMatrixPosition(S.matrixWorld),n.setFromMatrixPosition(S.target.matrixWorld),v.direction.sub(n),v.direction.transformDirection(m),d++}else if(S.isRectAreaLight){const v=i.rectArea[g];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(m),a.identity(),r.copy(S.matrixWorld),r.premultiply(m),a.extractRotation(r),v.halfWidth.set(S.width*.5,0,0),v.halfHeight.set(0,S.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),g++}else if(S.isPointLight){const v=i.point[h];v.position.setFromMatrixPosition(S.matrixWorld),v.position.applyMatrix4(m),h++}else if(S.isHemisphereLight){const v=i.hemi[y];v.direction.setFromMatrixPosition(S.matrixWorld),v.direction.transformDirection(m),y++}}}return{setup:o,setupView:l,state:i}}function Th(s){const t=new vx(s),e=[],i=[],n=[];function r(h){f.camera=h,e.length=0,i.length=0,n.length=0}function a(h){e.push(h)}function o(h){i.push(h)}function l(h){n.push(h)}function c(){t.setup(e)}function u(h){t.setupView(e,h)}const f={lightsArray:e,shadowsArray:i,lightProbeGridArray:n,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function Mx(s){let t=new WeakMap;function e(n,r=0){const a=t.get(n);let o;return a===void 0?(o=new Th(s),t.set(n,[o])):r>=a.length?(o=new Th(s),a.push(o)):o=a[r],o}function i(){t=new WeakMap}return{get:e,dispose:i}}const yx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,bx=`uniform sampler2D shadow_pass;
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
}`,Sx=[new T(1,0,0),new T(-1,0,0),new T(0,1,0),new T(0,-1,0),new T(0,0,1),new T(0,0,-1)],wx=[new T(0,-1,0),new T(0,-1,0),new T(0,0,1),new T(0,0,-1),new T(0,-1,0),new T(0,-1,0)],Ah=new Bt,js=new T,wo=new T;function Ex(s,t,e){let i=new Vl;const n=new Ut,r=new Ut,a=new he,o=new Nd,l=new Fd,c={},u=e.maxTextureSize,f={[Dn]:di,[di]:Dn,[Ui]:Ui},h=new yi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ut},radius:{value:4}},vertexShader:yx,fragmentShader:bx}),d=h.clone();d.defines.HORIZONTAL_PASS=1;const g=new Ne;g.setAttribute("position",new Ue(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const y=new Vt(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=oa;let p=this.type;this.render=function(w,C,_){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;this.type===Zu&&(It("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=oa);const E=s.getRenderTarget(),P=s.getActiveCubeFace(),I=s.getActiveMipmapLevel(),L=s.state;L.setBlending(ln),L.buffers.depth.getReversed()===!0?L.buffers.color.setClear(0,0,0,0):L.buffers.color.setClear(1,1,1,1),L.buffers.depth.setTest(!0),L.setScissorTest(!1);const X=p!==this.type;X&&C.traverse(function(Z){Z.material&&(Array.isArray(Z.material)?Z.material.forEach(N=>N.needsUpdate=!0):Z.material.needsUpdate=!0)});for(let Z=0,N=w.length;Z<N;Z++){const V=w[Z],k=V.shadow;if(k===void 0){It("WebGLShadowMap:",V,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;n.copy(k.mapSize);const K=k.getFrameExtents();n.multiply(K),r.copy(k.mapSize),(n.x>u||n.y>u)&&(n.x>u&&(r.x=Math.floor(u/K.x),n.x=r.x*K.x,k.mapSize.x=r.x),n.y>u&&(r.y=Math.floor(u/K.y),n.y=r.y*K.y,k.mapSize.y=r.y));const tt=s.state.buffers.depth.getReversed();if(k.camera._reversedDepth=tt,k.map===null||X===!0){if(k.map!==null&&(k.map.depthTexture!==null&&(k.map.depthTexture.dispose(),k.map.depthTexture=null),k.map.dispose()),this.type===nr){if(V.isPointLight){It("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}k.map=new ki(n.x,n.y,{format:ts,type:$i,minFilter:Qe,magFilter:Qe,generateMipmaps:!1}),k.map.texture.name=V.name+".shadowMap",k.map.depthTexture=new Ns(n.x,n.y,Ti),k.map.depthTexture.name=V.name+".shadowMapDepth",k.map.depthTexture.format=un,k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=Je,k.map.depthTexture.magFilter=Je}else V.isPointLight?(k.map=new gu(n.x),k.map.depthTexture=new wd(n.x,Zi)):(k.map=new ki(n.x,n.y),k.map.depthTexture=new Ns(n.x,n.y,Zi)),k.map.depthTexture.name=V.name+".shadowMap",k.map.depthTexture.format=un,this.type===oa?(k.map.depthTexture.compareFunction=tt?Nl:Ul,k.map.depthTexture.minFilter=Qe,k.map.depthTexture.magFilter=Qe):(k.map.depthTexture.compareFunction=null,k.map.depthTexture.minFilter=Je,k.map.depthTexture.magFilter=Je);k.camera.updateProjectionMatrix()}const at=k.map.isWebGLCubeRenderTarget?6:1;for(let lt=0;lt<at;lt++){if(k.map.isWebGLCubeRenderTarget)s.setRenderTarget(k.map,lt),s.clear();else{lt===0&&(s.setRenderTarget(k.map),s.clear());const Mt=k.getViewport(lt);a.set(r.x*Mt.x,r.y*Mt.y,r.x*Mt.z,r.y*Mt.w),L.viewport(a)}if(V.isPointLight){const Mt=k.camera,ne=k.matrix,ye=V.distance||Mt.far;ye!==Mt.far&&(Mt.far=ye,Mt.updateProjectionMatrix()),js.setFromMatrixPosition(V.matrixWorld),Mt.position.copy(js),wo.copy(Mt.position),wo.add(Sx[lt]),Mt.up.copy(wx[lt]),Mt.lookAt(wo),Mt.updateMatrixWorld(),ne.makeTranslation(-js.x,-js.y,-js.z),Ah.multiplyMatrices(Mt.projectionMatrix,Mt.matrixWorldInverse),k._frustum.setFromProjectionMatrix(Ah,Mt.coordinateSystem,Mt.reversedDepth)}else k.updateMatrices(V);i=k.getFrustum(),v(C,_,k.camera,V,this.type)}k.isPointLightShadow!==!0&&this.type===nr&&b(k,_),k.needsUpdate=!1}p=this.type,m.needsUpdate=!1,s.setRenderTarget(E,P,I)};function b(w,C){const _=t.update(y);h.defines.VSM_SAMPLES!==w.blurSamples&&(h.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new ki(n.x,n.y,{format:ts,type:$i})),h.uniforms.shadow_pass.value=w.map.depthTexture,h.uniforms.resolution.value=w.mapSize,h.uniforms.radius.value=w.radius,s.setRenderTarget(w.mapPass),s.clear(),s.renderBufferDirect(C,null,_,h,y,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,s.setRenderTarget(w.map),s.clear(),s.renderBufferDirect(C,null,_,d,y,null)}function S(w,C,_,E){let P=null;const I=_.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(I!==void 0)P=I;else if(P=_.isPointLight===!0?l:o,s.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){const L=P.uuid,X=C.uuid;let Z=c[L];Z===void 0&&(Z={},c[L]=Z);let N=Z[X];N===void 0&&(N=P.clone(),Z[X]=N,C.addEventListener("dispose",R)),P=N}if(P.visible=C.visible,P.wireframe=C.wireframe,E===nr?P.side=C.shadowSide!==null?C.shadowSide:C.side:P.side=C.shadowSide!==null?C.shadowSide:f[C.side],P.alphaMap=C.alphaMap,P.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,P.map=C.map,P.clipShadows=C.clipShadows,P.clippingPlanes=C.clippingPlanes,P.clipIntersection=C.clipIntersection,P.displacementMap=C.displacementMap,P.displacementScale=C.displacementScale,P.displacementBias=C.displacementBias,P.wireframeLinewidth=C.wireframeLinewidth,P.linewidth=C.linewidth,_.isPointLight===!0&&P.isMeshDistanceMaterial===!0){const L=s.properties.get(P);L.light=_}return P}function v(w,C,_,E,P){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&P===nr)&&(!w.frustumCulled||i.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,w.matrixWorld);const X=t.update(w),Z=w.material;if(Array.isArray(Z)){const N=X.groups;for(let V=0,k=N.length;V<k;V++){const K=N[V],tt=Z[K.materialIndex];if(tt&&tt.visible){const at=S(w,tt,E,P);w.onBeforeShadow(s,w,C,_,X,at,K),s.renderBufferDirect(_,null,X,at,w,K),w.onAfterShadow(s,w,C,_,X,at,K)}}}else if(Z.visible){const N=S(w,Z,E,P);w.onBeforeShadow(s,w,C,_,X,N,null),s.renderBufferDirect(_,null,X,N,w,null),w.onAfterShadow(s,w,C,_,X,N,null)}}const L=w.children;for(let X=0,Z=L.length;X<Z;X++)v(L[X],C,_,E,P)}function R(w){w.target.removeEventListener("dispose",R);for(const _ in c){const E=c[_],P=w.target.uuid;P in E&&(E[P].dispose(),delete E[P])}}}function Tx(s,t){function e(){let D=!1;const ot=new he;let $=null;const dt=new he(0,0,0,0);return{setMask:function(_t){$!==_t&&!D&&(s.colorMask(_t,_t,_t,_t),$=_t)},setLocked:function(_t){D=_t},setClear:function(_t,j,Tt,wt,Se){Se===!0&&(_t*=wt,j*=wt,Tt*=wt),ot.set(_t,j,Tt,wt),dt.equals(ot)===!1&&(s.clearColor(_t,j,Tt,wt),dt.copy(ot))},reset:function(){D=!1,$=null,dt.set(-1,0,0,0)}}}function i(){let D=!1,ot=!1,$=null,dt=null,_t=null;return{setReversed:function(j){if(ot!==j){const Tt=t.get("EXT_clip_control");j?Tt.clipControlEXT(Tt.LOWER_LEFT_EXT,Tt.ZERO_TO_ONE_EXT):Tt.clipControlEXT(Tt.LOWER_LEFT_EXT,Tt.NEGATIVE_ONE_TO_ONE_EXT),ot=j;const wt=_t;_t=null,this.setClear(wt)}},getReversed:function(){return ot},setTest:function(j){j?nt(s.DEPTH_TEST):Ot(s.DEPTH_TEST)},setMask:function(j){$!==j&&!D&&(s.depthMask(j),$=j)},setFunc:function(j){if(ot&&(j=Pf[j]),dt!==j){switch(j){case Uo:s.depthFunc(s.NEVER);break;case No:s.depthFunc(s.ALWAYS);break;case Fo:s.depthFunc(s.LESS);break;case Ls:s.depthFunc(s.LEQUAL);break;case Oo:s.depthFunc(s.EQUAL);break;case ko:s.depthFunc(s.GEQUAL);break;case Bo:s.depthFunc(s.GREATER);break;case zo:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}dt=j}},setLocked:function(j){D=j},setClear:function(j){_t!==j&&(_t=j,ot&&(j=1-j),s.clearDepth(j))},reset:function(){D=!1,$=null,dt=null,_t=null,ot=!1}}}function n(){let D=!1,ot=null,$=null,dt=null,_t=null,j=null,Tt=null,wt=null,Se=null;return{setTest:function(me){D||(me?nt(s.STENCIL_TEST):Ot(s.STENCIL_TEST))},setMask:function(me){ot!==me&&!D&&(s.stencilMask(me),ot=me)},setFunc:function(me,Bi,zi){($!==me||dt!==Bi||_t!==zi)&&(s.stencilFunc(me,Bi,zi),$=me,dt=Bi,_t=zi)},setOp:function(me,Bi,zi){(j!==me||Tt!==Bi||wt!==zi)&&(s.stencilOp(me,Bi,zi),j=me,Tt=Bi,wt=zi)},setLocked:function(me){D=me},setClear:function(me){Se!==me&&(s.clearStencil(me),Se=me)},reset:function(){D=!1,ot=null,$=null,dt=null,_t=null,j=null,Tt=null,wt=null,Se=null}}}const r=new e,a=new i,o=new n,l=new WeakMap,c=new WeakMap;let u={},f={},h={},d=new WeakMap,g=[],y=null,m=!1,p=null,b=null,S=null,v=null,R=null,w=null,C=null,_=new Nt(0,0,0),E=0,P=!1,I=null,L=null,X=null,Z=null,N=null;const V=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let k=!1,K=0;const tt=s.getParameter(s.VERSION);tt.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(tt)[1]),k=K>=1):tt.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(tt)[1]),k=K>=2);let at=null,lt={};const Mt=s.getParameter(s.SCISSOR_BOX),ne=s.getParameter(s.VIEWPORT),ye=new he().fromArray(Mt),se=new he().fromArray(ne);function Q(D,ot,$,dt){const _t=new Uint8Array(4),j=s.createTexture();s.bindTexture(D,j),s.texParameteri(D,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(D,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Tt=0;Tt<$;Tt++)D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY?s.texImage3D(ot,0,s.RGBA,1,1,dt,0,s.RGBA,s.UNSIGNED_BYTE,_t):s.texImage2D(ot+Tt,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,_t);return j}const ct={};ct[s.TEXTURE_2D]=Q(s.TEXTURE_2D,s.TEXTURE_2D,1),ct[s.TEXTURE_CUBE_MAP]=Q(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),ct[s.TEXTURE_2D_ARRAY]=Q(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),ct[s.TEXTURE_3D]=Q(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),nt(s.DEPTH_TEST),a.setFunc(Ls),Fe(!1),ze(dc),nt(s.CULL_FACE),re(ln);function nt(D){u[D]!==!0&&(s.enable(D),u[D]=!0)}function Ot(D){u[D]!==!1&&(s.disable(D),u[D]=!1)}function zt(D,ot){return h[D]!==ot?(s.bindFramebuffer(D,ot),h[D]=ot,D===s.DRAW_FRAMEBUFFER&&(h[s.FRAMEBUFFER]=ot),D===s.FRAMEBUFFER&&(h[s.DRAW_FRAMEBUFFER]=ot),!0):!1}function Lt(D,ot){let $=g,dt=!1;if(D){$=d.get(ot),$===void 0&&($=[],d.set(ot,$));const _t=D.textures;if($.length!==_t.length||$[0]!==s.COLOR_ATTACHMENT0){for(let j=0,Tt=_t.length;j<Tt;j++)$[j]=s.COLOR_ATTACHMENT0+j;$.length=_t.length,dt=!0}}else $[0]!==s.BACK&&($[0]=s.BACK,dt=!0);dt&&s.drawBuffers($)}function Ce(D){return y!==D?(s.useProgram(D),y=D,!0):!1}const $t={[Xn]:s.FUNC_ADD,[Ju]:s.FUNC_SUBTRACT,[Qu]:s.FUNC_REVERSE_SUBTRACT};$t[ju]=s.MIN,$t[tf]=s.MAX;const ue={[ef]:s.ZERO,[nf]:s.ONE,[sf]:s.SRC_COLOR,[Lo]:s.SRC_ALPHA,[hf]:s.SRC_ALPHA_SATURATE,[lf]:s.DST_COLOR,[af]:s.DST_ALPHA,[rf]:s.ONE_MINUS_SRC_COLOR,[Do]:s.ONE_MINUS_SRC_ALPHA,[cf]:s.ONE_MINUS_DST_COLOR,[of]:s.ONE_MINUS_DST_ALPHA,[uf]:s.CONSTANT_COLOR,[ff]:s.ONE_MINUS_CONSTANT_COLOR,[df]:s.CONSTANT_ALPHA,[pf]:s.ONE_MINUS_CONSTANT_ALPHA};function re(D,ot,$,dt,_t,j,Tt,wt,Se,me){if(D===ln){m===!0&&(Ot(s.BLEND),m=!1);return}if(m===!1&&(nt(s.BLEND),m=!0),D!==$u){if(D!==p||me!==P){if((b!==Xn||R!==Xn)&&(s.blendEquation(s.FUNC_ADD),b=Xn,R=Xn),me)switch(D){case $n:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Oi:s.blendFunc(s.ONE,s.ONE);break;case pc:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case mc:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Qt("WebGLState: Invalid blending: ",D);break}else switch(D){case $n:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case Oi:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case pc:Qt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case mc:Qt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Qt("WebGLState: Invalid blending: ",D);break}S=null,v=null,w=null,C=null,_.set(0,0,0),E=0,p=D,P=me}return}_t=_t||ot,j=j||$,Tt=Tt||dt,(ot!==b||_t!==R)&&(s.blendEquationSeparate($t[ot],$t[_t]),b=ot,R=_t),($!==S||dt!==v||j!==w||Tt!==C)&&(s.blendFuncSeparate(ue[$],ue[dt],ue[j],ue[Tt]),S=$,v=dt,w=j,C=Tt),(wt.equals(_)===!1||Se!==E)&&(s.blendColor(wt.r,wt.g,wt.b,Se),_.copy(wt),E=Se),p=D,P=!1}function ee(D,ot){D.side===Ui?Ot(s.CULL_FACE):nt(s.CULL_FACE);let $=D.side===di;ot&&($=!$),Fe($),D.blending===$n&&D.transparent===!1?re(ln):re(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),a.setFunc(D.depthFunc),a.setTest(D.depthTest),a.setMask(D.depthWrite),r.setMask(D.colorWrite);const dt=D.stencilWrite;o.setTest(dt),dt&&(o.setMask(D.stencilWriteMask),o.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),o.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),qe(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?nt(s.SAMPLE_ALPHA_TO_COVERAGE):Ot(s.SAMPLE_ALPHA_TO_COVERAGE)}function Fe(D){I!==D&&(D?s.frontFace(s.CW):s.frontFace(s.CCW),I=D)}function ze(D){D!==qu?(nt(s.CULL_FACE),D!==L&&(D===dc?s.cullFace(s.BACK):D===Ku?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):Ot(s.CULL_FACE),L=D}function We(D){D!==X&&(k&&s.lineWidth(D),X=D)}function qe(D,ot,$){D?(nt(s.POLYGON_OFFSET_FILL),(Z!==ot||N!==$)&&(Z=ot,N=$,a.getReversed()&&(ot=-ot),s.polygonOffset(ot,$))):Ot(s.POLYGON_OFFSET_FILL)}function be(D){D?nt(s.SCISSOR_TEST):Ot(s.SCISSOR_TEST)}function Oe(D){D===void 0&&(D=s.TEXTURE0+V-1),at!==D&&(s.activeTexture(D),at=D)}function U(D,ot,$){$===void 0&&(at===null?$=s.TEXTURE0+V-1:$=at);let dt=lt[$];dt===void 0&&(dt={type:void 0,texture:void 0},lt[$]=dt),(dt.type!==D||dt.texture!==ot)&&(at!==$&&(s.activeTexture($),at=$),s.bindTexture(D,ot||ct[D]),dt.type=D,dt.texture=ot)}function ci(){const D=lt[at];D!==void 0&&D.type!==void 0&&(s.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function ae(){try{s.compressedTexImage2D(...arguments)}catch(D){Qt("WebGLState:",D)}}function A(){try{s.compressedTexImage3D(...arguments)}catch(D){Qt("WebGLState:",D)}}function x(){try{s.texSubImage2D(...arguments)}catch(D){Qt("WebGLState:",D)}}function O(){try{s.texSubImage3D(...arguments)}catch(D){Qt("WebGLState:",D)}}function G(){try{s.compressedTexSubImage2D(...arguments)}catch(D){Qt("WebGLState:",D)}}function Y(){try{s.compressedTexSubImage3D(...arguments)}catch(D){Qt("WebGLState:",D)}}function rt(){try{s.texStorage2D(...arguments)}catch(D){Qt("WebGLState:",D)}}function ht(){try{s.texStorage3D(...arguments)}catch(D){Qt("WebGLState:",D)}}function q(){try{s.texImage2D(...arguments)}catch(D){Qt("WebGLState:",D)}}function J(){try{s.texImage3D(...arguments)}catch(D){Qt("WebGLState:",D)}}function ut(D){return f[D]!==void 0?f[D]:s.getParameter(D)}function At(D,ot){f[D]!==ot&&(s.pixelStorei(D,ot),f[D]=ot)}function pt(D){ye.equals(D)===!1&&(s.scissor(D.x,D.y,D.z,D.w),ye.copy(D))}function ft(D){se.equals(D)===!1&&(s.viewport(D.x,D.y,D.z,D.w),se.copy(D))}function Pt(D,ot){let $=c.get(ot);$===void 0&&($=new WeakMap,c.set(ot,$));let dt=$.get(D);dt===void 0&&(dt=s.getUniformBlockIndex(ot,D.name),$.set(D,dt))}function Dt(D,ot){const dt=c.get(ot).get(D);l.get(ot)!==dt&&(s.uniformBlockBinding(ot,dt,D.__bindingPointIndex),l.set(ot,dt))}function Ht(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),u={},f={},at=null,lt={},h={},d=new WeakMap,g=[],y=null,m=!1,p=null,b=null,S=null,v=null,R=null,w=null,C=null,_=new Nt(0,0,0),E=0,P=!1,I=null,L=null,X=null,Z=null,N=null,ye.set(0,0,s.canvas.width,s.canvas.height),se.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:nt,disable:Ot,bindFramebuffer:zt,drawBuffers:Lt,useProgram:Ce,setBlending:re,setMaterial:ee,setFlipSided:Fe,setCullFace:ze,setLineWidth:We,setPolygonOffset:qe,setScissorTest:be,activeTexture:Oe,bindTexture:U,unbindTexture:ci,compressedTexImage2D:ae,compressedTexImage3D:A,texImage2D:q,texImage3D:J,pixelStorei:At,getParameter:ut,updateUBOMapping:Pt,uniformBlockBinding:Dt,texStorage2D:rt,texStorage3D:ht,texSubImage2D:x,texSubImage3D:O,compressedTexSubImage2D:G,compressedTexSubImage3D:Y,scissor:pt,viewport:ft,reset:Ht}}function Ax(s,t,e,i,n,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ut,u=new WeakMap,f=new Set;let h;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(A,x){return g?new OffscreenCanvas(A,x):ya("canvas")}function m(A,x,O){let G=1;const Y=ae(A);if((Y.width>O||Y.height>O)&&(G=O/Math.max(Y.width,Y.height)),G<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const rt=Math.floor(G*Y.width),ht=Math.floor(G*Y.height);h===void 0&&(h=y(rt,ht));const q=x?y(rt,ht):h;return q.width=rt,q.height=ht,q.getContext("2d").drawImage(A,0,0,rt,ht),It("WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+rt+"x"+ht+")."),q}else return"data"in A&&It("WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),A;return A}function p(A){return A.generateMipmaps}function b(A){s.generateMipmap(A)}function S(A){return A.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?s.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function v(A,x,O,G,Y,rt=!1){if(A!==null){if(s[A]!==void 0)return s[A];It("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ht;G&&(ht=t.get("EXT_texture_norm16"),ht||It("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let q=x;if(x===s.RED&&(O===s.FLOAT&&(q=s.R32F),O===s.HALF_FLOAT&&(q=s.R16F),O===s.UNSIGNED_BYTE&&(q=s.R8),O===s.UNSIGNED_SHORT&&ht&&(q=ht.R16_EXT),O===s.SHORT&&ht&&(q=ht.R16_SNORM_EXT)),x===s.RED_INTEGER&&(O===s.UNSIGNED_BYTE&&(q=s.R8UI),O===s.UNSIGNED_SHORT&&(q=s.R16UI),O===s.UNSIGNED_INT&&(q=s.R32UI),O===s.BYTE&&(q=s.R8I),O===s.SHORT&&(q=s.R16I),O===s.INT&&(q=s.R32I)),x===s.RG&&(O===s.FLOAT&&(q=s.RG32F),O===s.HALF_FLOAT&&(q=s.RG16F),O===s.UNSIGNED_BYTE&&(q=s.RG8),O===s.UNSIGNED_SHORT&&ht&&(q=ht.RG16_EXT),O===s.SHORT&&ht&&(q=ht.RG16_SNORM_EXT)),x===s.RG_INTEGER&&(O===s.UNSIGNED_BYTE&&(q=s.RG8UI),O===s.UNSIGNED_SHORT&&(q=s.RG16UI),O===s.UNSIGNED_INT&&(q=s.RG32UI),O===s.BYTE&&(q=s.RG8I),O===s.SHORT&&(q=s.RG16I),O===s.INT&&(q=s.RG32I)),x===s.RGB_INTEGER&&(O===s.UNSIGNED_BYTE&&(q=s.RGB8UI),O===s.UNSIGNED_SHORT&&(q=s.RGB16UI),O===s.UNSIGNED_INT&&(q=s.RGB32UI),O===s.BYTE&&(q=s.RGB8I),O===s.SHORT&&(q=s.RGB16I),O===s.INT&&(q=s.RGB32I)),x===s.RGBA_INTEGER&&(O===s.UNSIGNED_BYTE&&(q=s.RGBA8UI),O===s.UNSIGNED_SHORT&&(q=s.RGBA16UI),O===s.UNSIGNED_INT&&(q=s.RGBA32UI),O===s.BYTE&&(q=s.RGBA8I),O===s.SHORT&&(q=s.RGBA16I),O===s.INT&&(q=s.RGBA32I)),x===s.RGB&&(O===s.UNSIGNED_SHORT&&ht&&(q=ht.RGB16_EXT),O===s.SHORT&&ht&&(q=ht.RGB16_SNORM_EXT),O===s.UNSIGNED_INT_5_9_9_9_REV&&(q=s.RGB9_E5),O===s.UNSIGNED_INT_10F_11F_11F_REV&&(q=s.R11F_G11F_B10F)),x===s.RGBA){const J=rt?Ma:jt.getTransfer(Y);O===s.FLOAT&&(q=s.RGBA32F),O===s.HALF_FLOAT&&(q=s.RGBA16F),O===s.UNSIGNED_BYTE&&(q=J===oe?s.SRGB8_ALPHA8:s.RGBA8),O===s.UNSIGNED_SHORT&&ht&&(q=ht.RGBA16_EXT),O===s.SHORT&&ht&&(q=ht.RGBA16_SNORM_EXT),O===s.UNSIGNED_SHORT_4_4_4_4&&(q=s.RGBA4),O===s.UNSIGNED_SHORT_5_5_5_1&&(q=s.RGB5_A1)}return(q===s.R16F||q===s.R32F||q===s.RG16F||q===s.RG32F||q===s.RGBA16F||q===s.RGBA32F)&&t.get("EXT_color_buffer_float"),q}function R(A,x){let O;return A?x===null||x===Zi||x===ur?O=s.DEPTH24_STENCIL8:x===Ti?O=s.DEPTH32F_STENCIL8:x===hr&&(O=s.DEPTH24_STENCIL8,It("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Zi||x===ur?O=s.DEPTH_COMPONENT24:x===Ti?O=s.DEPTH_COMPONENT32F:x===hr&&(O=s.DEPTH_COMPONENT16),O}function w(A,x){return p(A)===!0||A.isFramebufferTexture&&A.minFilter!==Je&&A.minFilter!==Qe?Math.log2(Math.max(x.width,x.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?x.mipmaps.length:1}function C(A){const x=A.target;x.removeEventListener("dispose",C),E(x),x.isVideoTexture&&u.delete(x),x.isHTMLTexture&&f.delete(x)}function _(A){const x=A.target;x.removeEventListener("dispose",_),I(x)}function E(A){const x=i.get(A);if(x.__webglInit===void 0)return;const O=A.source,G=d.get(O);if(G){const Y=G[x.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&P(A),Object.keys(G).length===0&&d.delete(O)}i.remove(A)}function P(A){const x=i.get(A);s.deleteTexture(x.__webglTexture);const O=A.source,G=d.get(O);delete G[x.__cacheKey],a.memory.textures--}function I(A){const x=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let G=0;G<6;G++){if(Array.isArray(x.__webglFramebuffer[G]))for(let Y=0;Y<x.__webglFramebuffer[G].length;Y++)s.deleteFramebuffer(x.__webglFramebuffer[G][Y]);else s.deleteFramebuffer(x.__webglFramebuffer[G]);x.__webglDepthbuffer&&s.deleteRenderbuffer(x.__webglDepthbuffer[G])}else{if(Array.isArray(x.__webglFramebuffer))for(let G=0;G<x.__webglFramebuffer.length;G++)s.deleteFramebuffer(x.__webglFramebuffer[G]);else s.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&s.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&s.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let G=0;G<x.__webglColorRenderbuffer.length;G++)x.__webglColorRenderbuffer[G]&&s.deleteRenderbuffer(x.__webglColorRenderbuffer[G]);x.__webglDepthRenderbuffer&&s.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const O=A.textures;for(let G=0,Y=O.length;G<Y;G++){const rt=i.get(O[G]);rt.__webglTexture&&(s.deleteTexture(rt.__webglTexture),a.memory.textures--),i.remove(O[G])}i.remove(A)}let L=0;function X(){L=0}function Z(){return L}function N(A){L=A}function V(){const A=L;return A>=n.maxTextures&&It("WebGLTextures: Trying to use "+A+" texture units while this GPU supports only "+n.maxTextures),L+=1,A}function k(A){const x=[];return x.push(A.wrapS),x.push(A.wrapT),x.push(A.wrapR||0),x.push(A.magFilter),x.push(A.minFilter),x.push(A.anisotropy),x.push(A.internalFormat),x.push(A.format),x.push(A.type),x.push(A.generateMipmaps),x.push(A.premultiplyAlpha),x.push(A.flipY),x.push(A.unpackAlignment),x.push(A.colorSpace),x.join()}function K(A,x){const O=i.get(A);if(A.isVideoTexture&&U(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&O.__version!==A.version){const G=A.image;if(G===null)It("WebGLRenderer: Texture marked for update but no image data found.");else if(G.complete===!1)It("WebGLRenderer: Texture marked for update but image is incomplete");else{Ot(O,A,x);return}}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(s.TEXTURE_2D,O.__webglTexture,s.TEXTURE0+x)}function tt(A,x){const O=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){Ot(O,A,x);return}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(s.TEXTURE_2D_ARRAY,O.__webglTexture,s.TEXTURE0+x)}function at(A,x){const O=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){Ot(O,A,x);return}e.bindTexture(s.TEXTURE_3D,O.__webglTexture,s.TEXTURE0+x)}function lt(A,x){const O=i.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&O.__version!==A.version){zt(O,A,x);return}e.bindTexture(s.TEXTURE_CUBE_MAP,O.__webglTexture,s.TEXTURE0+x)}const Mt={[Us]:s.REPEAT,[$e]:s.CLAMP_TO_EDGE,[Ho]:s.MIRRORED_REPEAT},ne={[Je]:s.NEAREST,[_f]:s.NEAREST_MIPMAP_NEAREST,[Ar]:s.NEAREST_MIPMAP_LINEAR,[Qe]:s.LINEAR,[Va]:s.LINEAR_MIPMAP_NEAREST,[Kn]:s.LINEAR_MIPMAP_LINEAR},ye={[yf]:s.NEVER,[Tf]:s.ALWAYS,[bf]:s.LESS,[Ul]:s.LEQUAL,[Sf]:s.EQUAL,[Nl]:s.GEQUAL,[wf]:s.GREATER,[Ef]:s.NOTEQUAL};function se(A,x){if(x.type===Ti&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===Qe||x.magFilter===Va||x.magFilter===Ar||x.magFilter===Kn||x.minFilter===Qe||x.minFilter===Va||x.minFilter===Ar||x.minFilter===Kn)&&It("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(A,s.TEXTURE_WRAP_S,Mt[x.wrapS]),s.texParameteri(A,s.TEXTURE_WRAP_T,Mt[x.wrapT]),(A===s.TEXTURE_3D||A===s.TEXTURE_2D_ARRAY)&&s.texParameteri(A,s.TEXTURE_WRAP_R,Mt[x.wrapR]),s.texParameteri(A,s.TEXTURE_MAG_FILTER,ne[x.magFilter]),s.texParameteri(A,s.TEXTURE_MIN_FILTER,ne[x.minFilter]),x.compareFunction&&(s.texParameteri(A,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(A,s.TEXTURE_COMPARE_FUNC,ye[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Je||x.minFilter!==Ar&&x.minFilter!==Kn||x.type===Ti&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");s.texParameterf(A,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,n.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function Q(A,x){let O=!1;A.__webglInit===void 0&&(A.__webglInit=!0,x.addEventListener("dispose",C));const G=x.source;let Y=d.get(G);Y===void 0&&(Y={},d.set(G,Y));const rt=k(x);if(rt!==A.__cacheKey){Y[rt]===void 0&&(Y[rt]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,O=!0),Y[rt].usedTimes++;const ht=Y[A.__cacheKey];ht!==void 0&&(Y[A.__cacheKey].usedTimes--,ht.usedTimes===0&&P(x)),A.__cacheKey=rt,A.__webglTexture=Y[rt].texture}return O}function ct(A,x,O){return Math.floor(Math.floor(A/O)/x)}function nt(A,x,O,G){const rt=A.updateRanges;if(rt.length===0)e.texSubImage2D(s.TEXTURE_2D,0,0,0,x.width,x.height,O,G,x.data);else{rt.sort((At,pt)=>At.start-pt.start);let ht=0;for(let At=1;At<rt.length;At++){const pt=rt[ht],ft=rt[At],Pt=pt.start+pt.count,Dt=ct(ft.start,x.width,4),Ht=ct(pt.start,x.width,4);ft.start<=Pt+1&&Dt===Ht&&ct(ft.start+ft.count-1,x.width,4)===Dt?pt.count=Math.max(pt.count,ft.start+ft.count-pt.start):(++ht,rt[ht]=ft)}rt.length=ht+1;const q=e.getParameter(s.UNPACK_ROW_LENGTH),J=e.getParameter(s.UNPACK_SKIP_PIXELS),ut=e.getParameter(s.UNPACK_SKIP_ROWS);e.pixelStorei(s.UNPACK_ROW_LENGTH,x.width);for(let At=0,pt=rt.length;At<pt;At++){const ft=rt[At],Pt=Math.floor(ft.start/4),Dt=Math.ceil(ft.count/4),Ht=Pt%x.width,D=Math.floor(Pt/x.width),ot=Dt,$=1;e.pixelStorei(s.UNPACK_SKIP_PIXELS,Ht),e.pixelStorei(s.UNPACK_SKIP_ROWS,D),e.texSubImage2D(s.TEXTURE_2D,0,Ht,D,ot,$,O,G,x.data)}A.clearUpdateRanges(),e.pixelStorei(s.UNPACK_ROW_LENGTH,q),e.pixelStorei(s.UNPACK_SKIP_PIXELS,J),e.pixelStorei(s.UNPACK_SKIP_ROWS,ut)}}function Ot(A,x,O){let G=s.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(G=s.TEXTURE_2D_ARRAY),x.isData3DTexture&&(G=s.TEXTURE_3D);const Y=Q(A,x),rt=x.source;e.bindTexture(G,A.__webglTexture,s.TEXTURE0+O);const ht=i.get(rt);if(rt.version!==ht.__version||Y===!0){if(e.activeTexture(s.TEXTURE0+O),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){const $=jt.getPrimaries(jt.workingColorSpace),dt=x.colorSpace===Pn?null:jt.getPrimaries(x.colorSpace),_t=x.colorSpace===Pn||$===dt?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,_t)}e.pixelStorei(s.UNPACK_ALIGNMENT,x.unpackAlignment);let J=m(x.image,!1,n.maxTextureSize);J=ci(x,J);const ut=r.convert(x.format,x.colorSpace),At=r.convert(x.type);let pt=v(x.internalFormat,ut,At,x.normalized,x.colorSpace,x.isVideoTexture);se(G,x);let ft;const Pt=x.mipmaps,Dt=x.isVideoTexture!==!0,Ht=ht.__version===void 0||Y===!0,D=rt.dataReady,ot=w(x,J);if(x.isDepthTexture)pt=R(x.format===Zn,x.type),Ht&&(Dt?e.texStorage2D(s.TEXTURE_2D,1,pt,J.width,J.height):e.texImage2D(s.TEXTURE_2D,0,pt,J.width,J.height,0,ut,At,null));else if(x.isDataTexture)if(Pt.length>0){Dt&&Ht&&e.texStorage2D(s.TEXTURE_2D,ot,pt,Pt[0].width,Pt[0].height);for(let $=0,dt=Pt.length;$<dt;$++)ft=Pt[$],Dt?D&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,ft.width,ft.height,ut,At,ft.data):e.texImage2D(s.TEXTURE_2D,$,pt,ft.width,ft.height,0,ut,At,ft.data);x.generateMipmaps=!1}else Dt?(Ht&&e.texStorage2D(s.TEXTURE_2D,ot,pt,J.width,J.height),D&&nt(x,J,ut,At)):e.texImage2D(s.TEXTURE_2D,0,pt,J.width,J.height,0,ut,At,J.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Dt&&Ht&&e.texStorage3D(s.TEXTURE_2D_ARRAY,ot,pt,Pt[0].width,Pt[0].height,J.depth);for(let $=0,dt=Pt.length;$<dt;$++)if(ft=Pt[$],x.format!==Ai)if(ut!==null)if(Dt){if(D)if(x.layerUpdates.size>0){const _t=sh(ft.width,ft.height,x.format,x.type);for(const j of x.layerUpdates){const Tt=ft.data.subarray(j*_t/ft.data.BYTES_PER_ELEMENT,(j+1)*_t/ft.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,j,ft.width,ft.height,1,ut,Tt)}x.clearLayerUpdates()}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,0,ft.width,ft.height,J.depth,ut,ft.data)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,$,pt,ft.width,ft.height,J.depth,0,ft.data,0,0);else It("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Dt?D&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,$,0,0,0,ft.width,ft.height,J.depth,ut,At,ft.data):e.texImage3D(s.TEXTURE_2D_ARRAY,$,pt,ft.width,ft.height,J.depth,0,ut,At,ft.data)}else{Dt&&Ht&&e.texStorage2D(s.TEXTURE_2D,ot,pt,Pt[0].width,Pt[0].height);for(let $=0,dt=Pt.length;$<dt;$++)ft=Pt[$],x.format!==Ai?ut!==null?Dt?D&&e.compressedTexSubImage2D(s.TEXTURE_2D,$,0,0,ft.width,ft.height,ut,ft.data):e.compressedTexImage2D(s.TEXTURE_2D,$,pt,ft.width,ft.height,0,ft.data):It("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Dt?D&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,ft.width,ft.height,ut,At,ft.data):e.texImage2D(s.TEXTURE_2D,$,pt,ft.width,ft.height,0,ut,At,ft.data)}else if(x.isDataArrayTexture)if(Dt){if(Ht&&e.texStorage3D(s.TEXTURE_2D_ARRAY,ot,pt,J.width,J.height,J.depth),D)if(x.layerUpdates.size>0){const $=sh(J.width,J.height,x.format,x.type);for(const dt of x.layerUpdates){const _t=J.data.subarray(dt*$/J.data.BYTES_PER_ELEMENT,(dt+1)*$/J.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,dt,J.width,J.height,1,ut,At,_t)}x.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,ut,At,J.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,pt,J.width,J.height,J.depth,0,ut,At,J.data);else if(x.isData3DTexture)Dt?(Ht&&e.texStorage3D(s.TEXTURE_3D,ot,pt,J.width,J.height,J.depth),D&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,ut,At,J.data)):e.texImage3D(s.TEXTURE_3D,0,pt,J.width,J.height,J.depth,0,ut,At,J.data);else if(x.isFramebufferTexture){if(Ht)if(Dt)e.texStorage2D(s.TEXTURE_2D,ot,pt,J.width,J.height);else{let $=J.width,dt=J.height;for(let _t=0;_t<ot;_t++)e.texImage2D(s.TEXTURE_2D,_t,pt,$,dt,0,ut,At,null),$>>=1,dt>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in s){const $=s.canvas;if($.hasAttribute("layoutsubtree")||$.setAttribute("layoutsubtree","true"),J.parentNode!==$){$.appendChild(J),f.add(x),$.onpaint=dt=>{const _t=dt.changedElements;for(const j of f)_t.includes(j.image)&&(j.needsUpdate=!0)},$.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,J);else{const _t=s.RGBA,j=s.RGBA,Tt=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,_t,j,Tt,J)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(Pt.length>0){if(Dt&&Ht){const $=ae(Pt[0]);e.texStorage2D(s.TEXTURE_2D,ot,pt,$.width,$.height)}for(let $=0,dt=Pt.length;$<dt;$++)ft=Pt[$],Dt?D&&e.texSubImage2D(s.TEXTURE_2D,$,0,0,ut,At,ft):e.texImage2D(s.TEXTURE_2D,$,pt,ut,At,ft);x.generateMipmaps=!1}else if(Dt){if(Ht){const $=ae(J);e.texStorage2D(s.TEXTURE_2D,ot,pt,$.width,$.height)}D&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,ut,At,J)}else e.texImage2D(s.TEXTURE_2D,0,pt,ut,At,J);p(x)&&b(G),ht.__version=rt.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function zt(A,x,O){if(x.image.length!==6)return;const G=Q(A,x),Y=x.source;e.bindTexture(s.TEXTURE_CUBE_MAP,A.__webglTexture,s.TEXTURE0+O);const rt=i.get(Y);if(Y.version!==rt.__version||G===!0){e.activeTexture(s.TEXTURE0+O);const ht=jt.getPrimaries(jt.workingColorSpace),q=x.colorSpace===Pn?null:jt.getPrimaries(x.colorSpace),J=x.colorSpace===Pn||ht===q?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(s.UNPACK_ALIGNMENT,x.unpackAlignment),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);const ut=x.isCompressedTexture||x.image[0].isCompressedTexture,At=x.image[0]&&x.image[0].isDataTexture,pt=[];for(let j=0;j<6;j++)!ut&&!At?pt[j]=m(x.image[j],!0,n.maxCubemapSize):pt[j]=At?x.image[j].image:x.image[j],pt[j]=ci(x,pt[j]);const ft=pt[0],Pt=r.convert(x.format,x.colorSpace),Dt=r.convert(x.type),Ht=v(x.internalFormat,Pt,Dt,x.normalized,x.colorSpace),D=x.isVideoTexture!==!0,ot=rt.__version===void 0||G===!0,$=Y.dataReady;let dt=w(x,ft);se(s.TEXTURE_CUBE_MAP,x);let _t;if(ut){D&&ot&&e.texStorage2D(s.TEXTURE_CUBE_MAP,dt,Ht,ft.width,ft.height);for(let j=0;j<6;j++){_t=pt[j].mipmaps;for(let Tt=0;Tt<_t.length;Tt++){const wt=_t[Tt];x.format!==Ai?Pt!==null?D?$&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt,0,0,wt.width,wt.height,Pt,wt.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt,Ht,wt.width,wt.height,0,wt.data):It("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):D?$&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt,0,0,wt.width,wt.height,Pt,Dt,wt.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt,Ht,wt.width,wt.height,0,Pt,Dt,wt.data)}}}else{if(_t=x.mipmaps,D&&ot){_t.length>0&&dt++;const j=ae(pt[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,dt,Ht,j.width,j.height)}for(let j=0;j<6;j++)if(At){D?$&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,pt[j].width,pt[j].height,Pt,Dt,pt[j].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ht,pt[j].width,pt[j].height,0,Pt,Dt,pt[j].data);for(let Tt=0;Tt<_t.length;Tt++){const Se=_t[Tt].image[j].image;D?$&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt+1,0,0,Se.width,Se.height,Pt,Dt,Se.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt+1,Ht,Se.width,Se.height,0,Pt,Dt,Se.data)}}else{D?$&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,Pt,Dt,pt[j]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ht,Pt,Dt,pt[j]);for(let Tt=0;Tt<_t.length;Tt++){const wt=_t[Tt];D?$&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt+1,0,0,Pt,Dt,wt.image[j]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+j,Tt+1,Ht,Pt,Dt,wt.image[j])}}}p(x)&&b(s.TEXTURE_CUBE_MAP),rt.__version=Y.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function Lt(A,x,O,G,Y,rt){const ht=r.convert(O.format,O.colorSpace),q=r.convert(O.type),J=v(O.internalFormat,ht,q,O.normalized,O.colorSpace),ut=i.get(x),At=i.get(O);if(At.__renderTarget=x,!ut.__hasExternalTextures){const pt=Math.max(1,x.width>>rt),ft=Math.max(1,x.height>>rt);Y===s.TEXTURE_3D||Y===s.TEXTURE_2D_ARRAY?e.texImage3D(Y,rt,J,pt,ft,x.depth,0,ht,q,null):e.texImage2D(Y,rt,J,pt,ft,0,ht,q,null)}e.bindFramebuffer(s.FRAMEBUFFER,A),Oe(x)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,G,Y,At.__webglTexture,0,be(x)):(Y===s.TEXTURE_2D||Y>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,G,Y,At.__webglTexture,rt),e.bindFramebuffer(s.FRAMEBUFFER,null)}function Ce(A,x,O){if(s.bindRenderbuffer(s.RENDERBUFFER,A),x.depthBuffer){const G=x.depthTexture,Y=G&&G.isDepthTexture?G.type:null,rt=R(x.stencilBuffer,Y),ht=x.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;Oe(x)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,be(x),rt,x.width,x.height):O?s.renderbufferStorageMultisample(s.RENDERBUFFER,be(x),rt,x.width,x.height):s.renderbufferStorage(s.RENDERBUFFER,rt,x.width,x.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,ht,s.RENDERBUFFER,A)}else{const G=x.textures;for(let Y=0;Y<G.length;Y++){const rt=G[Y],ht=r.convert(rt.format,rt.colorSpace),q=r.convert(rt.type),J=v(rt.internalFormat,ht,q,rt.normalized,rt.colorSpace);Oe(x)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,be(x),J,x.width,x.height):O?s.renderbufferStorageMultisample(s.RENDERBUFFER,be(x),J,x.width,x.height):s.renderbufferStorage(s.RENDERBUFFER,J,x.width,x.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function $t(A,x,O){const G=x.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(s.FRAMEBUFFER,A),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Y=i.get(x.depthTexture);if(Y.__renderTarget=x,(!Y.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),G){if(Y.__webglInit===void 0&&(Y.__webglInit=!0,x.depthTexture.addEventListener("dispose",C)),Y.__webglTexture===void 0){Y.__webglTexture=s.createTexture(),e.bindTexture(s.TEXTURE_CUBE_MAP,Y.__webglTexture),se(s.TEXTURE_CUBE_MAP,x.depthTexture);const ut=r.convert(x.depthTexture.format),At=r.convert(x.depthTexture.type);let pt;x.depthTexture.format===un?pt=s.DEPTH_COMPONENT24:x.depthTexture.format===Zn&&(pt=s.DEPTH24_STENCIL8);for(let ft=0;ft<6;ft++)s.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+ft,0,pt,x.width,x.height,0,ut,At,null)}}else K(x.depthTexture,0);const rt=Y.__webglTexture,ht=be(x),q=G?s.TEXTURE_CUBE_MAP_POSITIVE_X+O:s.TEXTURE_2D,J=x.depthTexture.format===Zn?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(x.depthTexture.format===un)Oe(x)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,J,q,rt,0,ht):s.framebufferTexture2D(s.FRAMEBUFFER,J,q,rt,0);else if(x.depthTexture.format===Zn)Oe(x)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,J,q,rt,0,ht):s.framebufferTexture2D(s.FRAMEBUFFER,J,q,rt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ue(A){const x=i.get(A),O=A.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==A.depthTexture){const G=A.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),G){const Y=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,G.removeEventListener("dispose",Y)};G.addEventListener("dispose",Y),x.__depthDisposeCallback=Y}x.__boundDepthTexture=G}if(A.depthTexture&&!x.__autoAllocateDepthBuffer)if(O)for(let G=0;G<6;G++)$t(x.__webglFramebuffer[G],A,G);else{const G=A.texture.mipmaps;G&&G.length>0?$t(x.__webglFramebuffer[0],A,0):$t(x.__webglFramebuffer,A,0)}else if(O){x.__webglDepthbuffer=[];for(let G=0;G<6;G++)if(e.bindFramebuffer(s.FRAMEBUFFER,x.__webglFramebuffer[G]),x.__webglDepthbuffer[G]===void 0)x.__webglDepthbuffer[G]=s.createRenderbuffer(),Ce(x.__webglDepthbuffer[G],A,!1);else{const Y=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer[G];s.bindRenderbuffer(s.RENDERBUFFER,rt),s.framebufferRenderbuffer(s.FRAMEBUFFER,Y,s.RENDERBUFFER,rt)}}else{const G=A.texture.mipmaps;if(G&&G.length>0?e.bindFramebuffer(s.FRAMEBUFFER,x.__webglFramebuffer[0]):e.bindFramebuffer(s.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=s.createRenderbuffer(),Ce(x.__webglDepthbuffer,A,!1);else{const Y=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,rt),s.framebufferRenderbuffer(s.FRAMEBUFFER,Y,s.RENDERBUFFER,rt)}}e.bindFramebuffer(s.FRAMEBUFFER,null)}function re(A,x,O){const G=i.get(A);x!==void 0&&Lt(G.__webglFramebuffer,A,A.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),O!==void 0&&ue(A)}function ee(A){const x=A.texture,O=i.get(A),G=i.get(x);A.addEventListener("dispose",_);const Y=A.textures,rt=A.isWebGLCubeRenderTarget===!0,ht=Y.length>1;if(ht||(G.__webglTexture===void 0&&(G.__webglTexture=s.createTexture()),G.__version=x.version,a.memory.textures++),rt){O.__webglFramebuffer=[];for(let q=0;q<6;q++)if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer[q]=[];for(let J=0;J<x.mipmaps.length;J++)O.__webglFramebuffer[q][J]=s.createFramebuffer()}else O.__webglFramebuffer[q]=s.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer=[];for(let q=0;q<x.mipmaps.length;q++)O.__webglFramebuffer[q]=s.createFramebuffer()}else O.__webglFramebuffer=s.createFramebuffer();if(ht)for(let q=0,J=Y.length;q<J;q++){const ut=i.get(Y[q]);ut.__webglTexture===void 0&&(ut.__webglTexture=s.createTexture(),a.memory.textures++)}if(A.samples>0&&Oe(A)===!1){O.__webglMultisampledFramebuffer=s.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let q=0;q<Y.length;q++){const J=Y[q];O.__webglColorRenderbuffer[q]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,O.__webglColorRenderbuffer[q]);const ut=r.convert(J.format,J.colorSpace),At=r.convert(J.type),pt=v(J.internalFormat,ut,At,J.normalized,J.colorSpace,A.isXRRenderTarget===!0),ft=be(A);s.renderbufferStorageMultisample(s.RENDERBUFFER,ft,pt,A.width,A.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+q,s.RENDERBUFFER,O.__webglColorRenderbuffer[q])}s.bindRenderbuffer(s.RENDERBUFFER,null),A.depthBuffer&&(O.__webglDepthRenderbuffer=s.createRenderbuffer(),Ce(O.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(rt){e.bindTexture(s.TEXTURE_CUBE_MAP,G.__webglTexture),se(s.TEXTURE_CUBE_MAP,x);for(let q=0;q<6;q++)if(x.mipmaps&&x.mipmaps.length>0)for(let J=0;J<x.mipmaps.length;J++)Lt(O.__webglFramebuffer[q][J],A,x,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+q,J);else Lt(O.__webglFramebuffer[q],A,x,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);p(x)&&b(s.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(ht){for(let q=0,J=Y.length;q<J;q++){const ut=Y[q],At=i.get(ut);let pt=s.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(pt=A.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(pt,At.__webglTexture),se(pt,ut),Lt(O.__webglFramebuffer,A,ut,s.COLOR_ATTACHMENT0+q,pt,0),p(ut)&&b(pt)}e.unbindTexture()}else{let q=s.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(q=A.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(q,G.__webglTexture),se(q,x),x.mipmaps&&x.mipmaps.length>0)for(let J=0;J<x.mipmaps.length;J++)Lt(O.__webglFramebuffer[J],A,x,s.COLOR_ATTACHMENT0,q,J);else Lt(O.__webglFramebuffer,A,x,s.COLOR_ATTACHMENT0,q,0);p(x)&&b(q),e.unbindTexture()}A.depthBuffer&&ue(A)}function Fe(A){const x=A.textures;for(let O=0,G=x.length;O<G;O++){const Y=x[O];if(p(Y)){const rt=S(A),ht=i.get(Y).__webglTexture;e.bindTexture(rt,ht),b(rt),e.unbindTexture()}}}const ze=[],We=[];function qe(A){if(A.samples>0){if(Oe(A)===!1){const x=A.textures,O=A.width,G=A.height;let Y=s.COLOR_BUFFER_BIT;const rt=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,ht=i.get(A),q=x.length>1;if(q)for(let ut=0;ut<x.length;ut++)e.bindFramebuffer(s.FRAMEBUFFER,ht.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ut,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,ht.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ut,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,ht.__webglMultisampledFramebuffer);const J=A.texture.mipmaps;J&&J.length>0?e.bindFramebuffer(s.DRAW_FRAMEBUFFER,ht.__webglFramebuffer[0]):e.bindFramebuffer(s.DRAW_FRAMEBUFFER,ht.__webglFramebuffer);for(let ut=0;ut<x.length;ut++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(Y|=s.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(Y|=s.STENCIL_BUFFER_BIT)),q){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,ht.__webglColorRenderbuffer[ut]);const At=i.get(x[ut]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,At,0)}s.blitFramebuffer(0,0,O,G,0,0,O,G,Y,s.NEAREST),l===!0&&(ze.length=0,We.length=0,ze.push(s.COLOR_ATTACHMENT0+ut),A.depthBuffer&&A.resolveDepthBuffer===!1&&(ze.push(rt),We.push(rt),s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,We)),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,ze))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),q)for(let ut=0;ut<x.length;ut++){e.bindFramebuffer(s.FRAMEBUFFER,ht.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+ut,s.RENDERBUFFER,ht.__webglColorRenderbuffer[ut]);const At=i.get(x[ut]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,ht.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+ut,s.TEXTURE_2D,At,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,ht.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.resolveDepthBuffer===!1&&l){const x=A.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[x])}}}function be(A){return Math.min(n.maxSamples,A.samples)}function Oe(A){const x=i.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function U(A){const x=a.render.frame;u.get(A)!==x&&(u.set(A,x),A.update())}function ci(A,x){const O=A.colorSpace,G=A.format,Y=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||O!==va&&O!==Pn&&(jt.getTransfer(O)===oe?(G!==Ai||Y!==Mi)&&It("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Qt("WebGLTextures: Unsupported texture color space:",O)),x}function ae(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=V,this.resetTextureUnits=X,this.getTextureUnits=Z,this.setTextureUnits=N,this.setTexture2D=K,this.setTexture2DArray=tt,this.setTexture3D=at,this.setTextureCube=lt,this.rebindTextures=re,this.setupRenderTarget=ee,this.updateRenderTargetMipmap=Fe,this.updateMultisampleRenderTarget=qe,this.setupDepthRenderbuffer=ue,this.setupFrameBufferTexture=Lt,this.useMultisampledRTT=Oe,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Rx(s,t){function e(i,n=Pn){let r;const a=jt.getTransfer(n);if(i===Mi)return s.UNSIGNED_BYTE;if(i===Rl)return s.UNSIGNED_SHORT_4_4_4_4;if(i===Cl)return s.UNSIGNED_SHORT_5_5_5_1;if(i===qh)return s.UNSIGNED_INT_5_9_9_9_REV;if(i===Kh)return s.UNSIGNED_INT_10F_11F_11F_REV;if(i===Xh)return s.BYTE;if(i===Yh)return s.SHORT;if(i===hr)return s.UNSIGNED_SHORT;if(i===Al)return s.INT;if(i===Zi)return s.UNSIGNED_INT;if(i===Ti)return s.FLOAT;if(i===$i)return s.HALF_FLOAT;if(i===Zh)return s.ALPHA;if(i===$h)return s.RGB;if(i===Ai)return s.RGBA;if(i===un)return s.DEPTH_COMPONENT;if(i===Zn)return s.DEPTH_STENCIL;if(i===Pl)return s.RED;if(i===Il)return s.RED_INTEGER;if(i===ts)return s.RG;if(i===Ll)return s.RG_INTEGER;if(i===Dl)return s.RGBA_INTEGER;if(i===la||i===ca||i===ha||i===ua)if(a===oe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===la)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ca)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ha)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===ua)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===la)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ca)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ha)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===ua)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Go||i===Vo||i===Wo||i===Xo)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===Go)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Vo)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Wo)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Xo)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Yo||i===qo||i===Ko||i===Zo||i===$o||i===ga||i===Jo)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(i===Yo||i===qo)return a===oe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===Ko)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(i===Zo)return r.COMPRESSED_R11_EAC;if(i===$o)return r.COMPRESSED_SIGNED_R11_EAC;if(i===ga)return r.COMPRESSED_RG11_EAC;if(i===Jo)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Qo||i===jo||i===tl||i===el||i===il||i===nl||i===sl||i===rl||i===al||i===ol||i===ll||i===cl||i===hl||i===ul)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(i===Qo)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===jo)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===tl)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===el)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===il)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===nl)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===sl)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===rl)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===al)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ol)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ll)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===cl)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===hl)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===ul)return a===oe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===fl||i===dl||i===pl)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(i===fl)return a===oe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===dl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===pl)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===ml||i===gl||i===xa||i===xl)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(i===ml)return r.COMPRESSED_RED_RGTC1_EXT;if(i===gl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===xa)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===xl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===ur?s.UNSIGNED_INT_24_8:s[i]!==void 0?s[i]:null}return{convert:e}}const Cx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Px=`
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

}`;class Ix{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const i=new ou(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,i=new yi({vertexShader:Cx,fragmentShader:Px,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Vt(new _e(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Lx extends ns{constructor(t,e){super();const i=this;let n=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,h=null,d=null,g=null;const y=typeof XRWebGLBinding<"u",m=new Ix,p={},b=e.getContextAttributes();let S=null,v=null;const R=[],w=[],C=new Ut;let _=null;const E=new fi;E.viewport=new he;const P=new fi;P.viewport=new he;const I=[E,P],L=new Gd;let X=null,Z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let ct=R[Q];return ct===void 0&&(ct=new Za,R[Q]=ct),ct.getTargetRaySpace()},this.getControllerGrip=function(Q){let ct=R[Q];return ct===void 0&&(ct=new Za,R[Q]=ct),ct.getGripSpace()},this.getHand=function(Q){let ct=R[Q];return ct===void 0&&(ct=new Za,R[Q]=ct),ct.getHandSpace()};function N(Q){const ct=w.indexOf(Q.inputSource);if(ct===-1)return;const nt=R[ct];nt!==void 0&&(nt.update(Q.inputSource,Q.frame,c||a),nt.dispatchEvent({type:Q.type,data:Q.inputSource}))}function V(){n.removeEventListener("select",N),n.removeEventListener("selectstart",N),n.removeEventListener("selectend",N),n.removeEventListener("squeeze",N),n.removeEventListener("squeezestart",N),n.removeEventListener("squeezeend",N),n.removeEventListener("end",V),n.removeEventListener("inputsourceschange",k);for(let Q=0;Q<R.length;Q++){const ct=w[Q];ct!==null&&(w[Q]=null,R[Q].disconnect(ct))}X=null,Z=null,m.reset();for(const Q in p)delete p[Q];t.setRenderTarget(S),d=null,h=null,f=null,n=null,v=null,se.stop(),i.isPresenting=!1,t.setPixelRatio(_),t.setSize(C.width,C.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){r=Q,i.isPresenting===!0&&It("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){o=Q,i.isPresenting===!0&&It("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Q){c=Q},this.getBaseLayer=function(){return h!==null?h:d},this.getBinding=function(){return f===null&&y&&(f=new XRWebGLBinding(n,e)),f},this.getFrame=function(){return g},this.getSession=function(){return n},this.setSession=async function(Q){if(n=Q,n!==null){if(S=t.getRenderTarget(),n.addEventListener("select",N),n.addEventListener("selectstart",N),n.addEventListener("selectend",N),n.addEventListener("squeeze",N),n.addEventListener("squeezestart",N),n.addEventListener("squeezeend",N),n.addEventListener("end",V),n.addEventListener("inputsourceschange",k),b.xrCompatible!==!0&&await e.makeXRCompatible(),_=t.getPixelRatio(),t.getSize(C),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let nt=null,Ot=null,zt=null;b.depth&&(zt=b.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,nt=b.stencil?Zn:un,Ot=b.stencil?ur:Zi);const Lt={colorFormat:e.RGBA8,depthFormat:zt,scaleFactor:r};f=this.getBinding(),h=f.createProjectionLayer(Lt),n.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),v=new ki(h.textureWidth,h.textureHeight,{format:Ai,type:Mi,depthTexture:new Ns(h.textureWidth,h.textureHeight,Ot,void 0,void 0,void 0,void 0,void 0,void 0,nt),stencilBuffer:b.stencil,colorSpace:t.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const nt={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(n,e,nt),n.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new ki(d.framebufferWidth,d.framebufferHeight,{format:Ai,type:Mi,colorSpace:t.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await n.requestReferenceSpace(o),se.setContext(n),se.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function k(Q){for(let ct=0;ct<Q.removed.length;ct++){const nt=Q.removed[ct],Ot=w.indexOf(nt);Ot>=0&&(w[Ot]=null,R[Ot].disconnect(nt))}for(let ct=0;ct<Q.added.length;ct++){const nt=Q.added[ct];let Ot=w.indexOf(nt);if(Ot===-1){for(let Lt=0;Lt<R.length;Lt++)if(Lt>=w.length){w.push(nt),Ot=Lt;break}else if(w[Lt]===null){w[Lt]=nt,Ot=Lt;break}if(Ot===-1)break}const zt=R[Ot];zt&&zt.connect(nt)}}const K=new T,tt=new T;function at(Q,ct,nt){K.setFromMatrixPosition(ct.matrixWorld),tt.setFromMatrixPosition(nt.matrixWorld);const Ot=K.distanceTo(tt),zt=ct.projectionMatrix.elements,Lt=nt.projectionMatrix.elements,Ce=zt[14]/(zt[10]-1),$t=zt[14]/(zt[10]+1),ue=(zt[9]+1)/zt[5],re=(zt[9]-1)/zt[5],ee=(zt[8]-1)/zt[0],Fe=(Lt[8]+1)/Lt[0],ze=Ce*ee,We=Ce*Fe,qe=Ot/(-ee+Fe),be=qe*-ee;if(ct.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(be),Q.translateZ(qe),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),zt[10]===-1)Q.projectionMatrix.copy(ct.projectionMatrix),Q.projectionMatrixInverse.copy(ct.projectionMatrixInverse);else{const Oe=Ce+qe,U=$t+qe,ci=ze-be,ae=We+(Ot-be),A=ue*$t/U*Oe,x=re*$t/U*Oe;Q.projectionMatrix.makePerspective(ci,ae,A,x,Oe,U),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function lt(Q,ct){ct===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(ct.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(n===null)return;let ct=Q.near,nt=Q.far;m.texture!==null&&(m.depthNear>0&&(ct=m.depthNear),m.depthFar>0&&(nt=m.depthFar)),L.near=P.near=E.near=ct,L.far=P.far=E.far=nt,(X!==L.near||Z!==L.far)&&(n.updateRenderState({depthNear:L.near,depthFar:L.far}),X=L.near,Z=L.far),L.layers.mask=Q.layers.mask|6,E.layers.mask=L.layers.mask&-5,P.layers.mask=L.layers.mask&-3;const Ot=Q.parent,zt=L.cameras;lt(L,Ot);for(let Lt=0;Lt<zt.length;Lt++)lt(zt[Lt],Ot);zt.length===2?at(L,E,P):L.projectionMatrix.copy(E.projectionMatrix),Mt(Q,L,Ot)};function Mt(Q,ct,nt){nt===null?Q.matrix.copy(ct.matrixWorld):(Q.matrix.copy(nt.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(ct.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(ct.projectionMatrix),Q.projectionMatrixInverse.copy(ct.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=dr*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return L},this.getFoveation=function(){if(!(h===null&&d===null))return l},this.setFoveation=function(Q){l=Q,h!==null&&(h.fixedFoveation=Q),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=Q)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(L)},this.getCameraTexture=function(Q){return p[Q]};let ne=null;function ye(Q,ct){if(u=ct.getViewerPose(c||a),g=ct,u!==null){const nt=u.views;d!==null&&(t.setRenderTargetFramebuffer(v,d.framebuffer),t.setRenderTarget(v));let Ot=!1;nt.length!==L.cameras.length&&(L.cameras.length=0,Ot=!0);for(let $t=0;$t<nt.length;$t++){const ue=nt[$t];let re=null;if(d!==null)re=d.getViewport(ue);else{const Fe=f.getViewSubImage(h,ue);re=Fe.viewport,$t===0&&(t.setRenderTargetTextures(v,Fe.colorTexture,Fe.depthStencilTexture),t.setRenderTarget(v))}let ee=I[$t];ee===void 0&&(ee=new fi,ee.layers.enable($t),ee.viewport=new he,I[$t]=ee),ee.matrix.fromArray(ue.transform.matrix),ee.matrix.decompose(ee.position,ee.quaternion,ee.scale),ee.projectionMatrix.fromArray(ue.projectionMatrix),ee.projectionMatrixInverse.copy(ee.projectionMatrix).invert(),ee.viewport.set(re.x,re.y,re.width,re.height),$t===0&&(L.matrix.copy(ee.matrix),L.matrix.decompose(L.position,L.quaternion,L.scale)),Ot===!0&&L.cameras.push(ee)}const zt=n.enabledFeatures;if(zt&&zt.includes("depth-sensing")&&n.depthUsage=="gpu-optimized"&&y){f=i.getBinding();const $t=f.getDepthInformation(nt[0]);$t&&$t.isValid&&$t.texture&&m.init($t,n.renderState)}if(zt&&zt.includes("camera-access")&&y){t.state.unbindTexture(),f=i.getBinding();for(let $t=0;$t<nt.length;$t++){const ue=nt[$t].camera;if(ue){let re=p[ue];re||(re=new ou,p[ue]=re);const ee=f.getCameraImage(ue);re.sourceTexture=ee}}}}for(let nt=0;nt<R.length;nt++){const Ot=w[nt],zt=R[nt];Ot!==null&&zt!==void 0&&zt.update(Ot,ct,c||a)}ne&&ne(Q,ct),ct.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ct}),g=null}const se=new pu;se.setAnimationLoop(ye),this.setAnimationLoop=function(Q){ne=Q},this.dispose=function(){}}}const Dx=new Bt,yu=new kt;yu.set(-1,0,0,0,1,0,0,0,1);function Ux(s,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,lu(s)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function n(m,p,b,S,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),f(m,p)):p.isMeshPhongMaterial?(r(m,p),u(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),h(m,p),p.isMeshPhysicalMaterial&&d(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),y(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,b,S):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===di&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===di&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const b=t.get(p),S=b.envMap,v=b.envMapRotation;S&&(m.envMap.value=S,m.envMapRotation.value.setFromMatrix4(Dx.makeRotationFromEuler(v)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(yu),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,b,S){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=S*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function h(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===di&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function y(m,p){const b=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:n}}function Nx(s,t,e,i){let n={},r={},a=[];const o=s.getParameter(s.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,R){const w=R.program;i.uniformBlockBinding(v,w)}function c(v,R){let w=n[v.id];w===void 0&&(m(v),w=u(v),n[v.id]=w,v.addEventListener("dispose",b));const C=R.program;i.updateUBOMapping(v,C);const _=t.render.frame;r[v.id]!==_&&(h(v),r[v.id]=_)}function u(v){const R=f();v.__bindingPointIndex=R;const w=s.createBuffer(),C=v.__size,_=v.usage;return s.bindBuffer(s.UNIFORM_BUFFER,w),s.bufferData(s.UNIFORM_BUFFER,C,_),s.bindBuffer(s.UNIFORM_BUFFER,null),s.bindBufferBase(s.UNIFORM_BUFFER,R,w),w}function f(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return Qt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(v){const R=n[v.id],w=v.uniforms,C=v.__cache;s.bindBuffer(s.UNIFORM_BUFFER,R);for(let _=0,E=w.length;_<E;_++){const P=w[_];if(Array.isArray(P))for(let I=0,L=P.length;I<L;I++)d(P[I],_,I,C);else d(P,_,0,C)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function d(v,R,w,C){if(y(v,R,w,C)===!0){const _=v.__offset,E=v.value;if(Array.isArray(E)){let P=0;for(let I=0;I<E.length;I++){const L=E[I],X=p(L);g(L,v.__data,P),typeof L!="number"&&typeof L!="boolean"&&!L.isMatrix3&&!ArrayBuffer.isView(L)&&(P+=X.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(E,v.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,_,v.__data)}}function g(v,R,w){typeof v=="number"||typeof v=="boolean"?R[0]=v:v.isMatrix3?(R[0]=v.elements[0],R[1]=v.elements[1],R[2]=v.elements[2],R[3]=0,R[4]=v.elements[3],R[5]=v.elements[4],R[6]=v.elements[5],R[7]=0,R[8]=v.elements[6],R[9]=v.elements[7],R[10]=v.elements[8],R[11]=0):ArrayBuffer.isView(v)?R.set(new v.constructor(v.buffer,v.byteOffset,R.length)):v.toArray(R,w)}function y(v,R,w,C){const _=v.value,E=R+"_"+w;if(C[E]===void 0)return typeof _=="number"||typeof _=="boolean"?C[E]=_:ArrayBuffer.isView(_)?C[E]=_.slice():C[E]=_.clone(),!0;{const P=C[E];if(typeof _=="number"||typeof _=="boolean"){if(P!==_)return C[E]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(P.equals(_)===!1)return P.copy(_),!0}}return!1}function m(v){const R=v.uniforms;let w=0;const C=16;for(let E=0,P=R.length;E<P;E++){const I=Array.isArray(R[E])?R[E]:[R[E]];for(let L=0,X=I.length;L<X;L++){const Z=I[L],N=Array.isArray(Z.value)?Z.value:[Z.value];for(let V=0,k=N.length;V<k;V++){const K=N[V],tt=p(K),at=w%C,lt=at%tt.boundary,Mt=at+lt;w+=lt,Mt!==0&&C-Mt<tt.storage&&(w+=C-Mt),Z.__data=new Float32Array(tt.storage/Float32Array.BYTES_PER_ELEMENT),Z.__offset=w,w+=tt.storage}}}const _=w%C;return _>0&&(w+=C-_),v.__size=w,v.__cache={},this}function p(v){const R={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(R.boundary=4,R.storage=4):v.isVector2?(R.boundary=8,R.storage=8):v.isVector3||v.isColor?(R.boundary=16,R.storage=12):v.isVector4?(R.boundary=16,R.storage=16):v.isMatrix3?(R.boundary=48,R.storage=48):v.isMatrix4?(R.boundary=64,R.storage=64):v.isTexture?It("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(R.boundary=16,R.storage=v.byteLength):It("WebGLRenderer: Unsupported uniform value type.",v),R}function b(v){const R=v.target;R.removeEventListener("dispose",b);const w=a.indexOf(R.__bindingPointIndex);a.splice(w,1),s.deleteBuffer(n[R.id]),delete n[R.id],delete r[R.id]}function S(){for(const v in n)s.deleteBuffer(n[v]);a=[],n={},r={}}return{bind:l,update:c,dispose:S}}const Fx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Vi=null;function Ox(){return Vi===null&&(Vi=new Hl(Fx,16,16,ts,$i),Vi.name="DFG_LUT",Vi.minFilter=Qe,Vi.magFilter=Qe,Vi.wrapS=$e,Vi.wrapT=$e,Vi.generateMipmaps=!1,Vi.needsUpdate=!0),Vi}class kx{constructor(t={}){const{canvas:e=Rf(),context:i=null,depth:n=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:d=Mi}=t;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;const y=d,m=new Set([Dl,Ll,Il]),p=new Set([Mi,Zi,hr,ur,Rl,Cl]),b=new Uint32Array(4),S=new Int32Array(4),v=new T;let R=null,w=null;const C=[],_=[];let E=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=qi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const P=this;let I=!1,L=null,X=null,Z=null,N=null;this._outputColorSpace=Be;let V=0,k=0,K=null,tt=-1,at=null;const lt=new he,Mt=new he;let ne=null;const ye=new Nt(0);let se=0,Q=e.width,ct=e.height,nt=1,Ot=null,zt=null;const Lt=new he(0,0,Q,ct),Ce=new he(0,0,Q,ct);let $t=!1;const ue=new Vl;let re=!1,ee=!1;const Fe=new Bt,ze=new T,We=new he,qe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let be=!1;function Oe(){return K===null?nt:1}let U=i;function ci(M,F){return e.getContext(M,F)}try{const M={alpha:!0,depth:n,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Tl}`),e.addEventListener("webglcontextlost",Se,!1),e.addEventListener("webglcontextrestored",me,!1),e.addEventListener("webglcontextcreationerror",Bi,!1),U===null){const F="webgl2";if(U=ci(F,M),U===null)throw ci(F)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(M){throw Qt("WebGLRenderer: "+M.message),M}let ae,A,x,O,G,Y,rt,ht,q,J,ut,At,pt,ft,Pt,Dt,Ht,D,ot,$,dt,_t,j;function Tt(){ae=new Om(U),ae.init(),dt=new Rx(U,ae),A=new Cm(U,ae,t,dt),x=new Tx(U,ae),A.reversedDepthBuffer&&h&&x.buffers.depth.setReversed(!0),X=U.createFramebuffer(),Z=U.createFramebuffer(),N=U.createFramebuffer(),O=new zm(U),G=new fx,Y=new Ax(U,ae,x,G,A,dt,O),rt=new Fm(P),ht=new Wd(U),_t=new Am(U,ht),q=new km(U,ht,O,_t),J=new Gm(U,q,ht,_t,O),D=new Hm(U,A,Y),Pt=new Pm(G),ut=new ux(P,rt,ae,A,_t,Pt),At=new Ux(P,G),pt=new px,ft=new Mx(ae),Ht=new Tm(P,rt,x,J,g,l),Dt=new Ex(P,J,A),j=new Nx(U,O,A,x),ot=new Rm(U,ae,O),$=new Bm(U,ae,O),O.programs=ut.programs,P.capabilities=A,P.extensions=ae,P.properties=G,P.renderLists=pt,P.shadowMap=Dt,P.state=x,P.info=O}Tt(),y!==Mi&&(E=new Wm(y,e.width,e.height,o,n,r));const wt=new Lx(P,U);this.xr=wt,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const M=ae.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=ae.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return nt},this.setPixelRatio=function(M){M!==void 0&&(nt=M,this.setSize(Q,ct,!1))},this.getSize=function(M){return M.set(Q,ct)},this.setSize=function(M,F,W=!0){if(wt.isPresenting){It("WebGLRenderer: Can't change size while VR device is presenting.");return}Q=M,ct=F,e.width=Math.floor(M*nt),e.height=Math.floor(F*nt),W===!0&&(e.style.width=M+"px",e.style.height=F+"px"),E!==null&&E.setSize(e.width,e.height),this.setViewport(0,0,M,F)},this.getDrawingBufferSize=function(M){return M.set(Q*nt,ct*nt).floor()},this.setDrawingBufferSize=function(M,F,W){Q=M,ct=F,nt=W,e.width=Math.floor(M*W),e.height=Math.floor(F*W),this.setViewport(0,0,M,F)},this.setEffects=function(M){if(y===Mi){Qt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let F=0;F<M.length;F++)if(M[F].isOutputPass===!0){It("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}E.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(lt)},this.getViewport=function(M){return M.copy(Lt)},this.setViewport=function(M,F,W,B){M.isVector4?Lt.set(M.x,M.y,M.z,M.w):Lt.set(M,F,W,B),x.viewport(lt.copy(Lt).multiplyScalar(nt).round())},this.getScissor=function(M){return M.copy(Ce)},this.setScissor=function(M,F,W,B){M.isVector4?Ce.set(M.x,M.y,M.z,M.w):Ce.set(M,F,W,B),x.scissor(Mt.copy(Ce).multiplyScalar(nt).round())},this.getScissorTest=function(){return $t},this.setScissorTest=function(M){x.setScissorTest($t=M)},this.setOpaqueSort=function(M){Ot=M},this.setTransparentSort=function(M){zt=M},this.getClearColor=function(M){return M.copy(Ht.getClearColor())},this.setClearColor=function(){Ht.setClearColor(...arguments)},this.getClearAlpha=function(){return Ht.getClearAlpha()},this.setClearAlpha=function(){Ht.setClearAlpha(...arguments)},this.clear=function(M=!0,F=!0,W=!0){let B=0;if(M){let z=!1;if(K!==null){const xt=K.texture.format;z=m.has(xt)}if(z){const xt=K.texture.type,St=p.has(xt),gt=Ht.getClearColor(),Et=Ht.getClearAlpha(),Rt=gt.r,Gt=gt.g,qt=gt.b;St?(b[0]=Rt,b[1]=Gt,b[2]=qt,b[3]=Et,U.clearBufferuiv(U.COLOR,0,b)):(S[0]=Rt,S[1]=Gt,S[2]=qt,S[3]=Et,U.clearBufferiv(U.COLOR,0,S))}else B|=U.COLOR_BUFFER_BIT}F&&(B|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(B|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B!==0&&U.clear(B)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),L=M},this.dispose=function(){e.removeEventListener("webglcontextlost",Se,!1),e.removeEventListener("webglcontextrestored",me,!1),e.removeEventListener("webglcontextcreationerror",Bi,!1),Ht.dispose(),pt.dispose(),ft.dispose(),G.dispose(),rt.dispose(),J.dispose(),_t.dispose(),j.dispose(),ut.dispose(),wt.dispose(),wt.removeEventListener("sessionstart",rc),wt.removeEventListener("sessionend",ac),Bn.stop()};function Se(M){M.preventDefault(),ba("WebGLRenderer: Context Lost."),I=!0}function me(){ba("WebGLRenderer: Context Restored."),I=!1;const M=O.autoReset,F=Dt.enabled,W=Dt.autoUpdate,B=Dt.needsUpdate,z=Dt.type;Tt(),O.autoReset=M,Dt.enabled=F,Dt.autoUpdate=W,Dt.needsUpdate=B,Dt.type=z}function Bi(M){Qt("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function zi(M){const F=M.target;F.removeEventListener("dispose",zi),zu(F)}function zu(M){Hu(M),G.remove(M)}function Hu(M){const F=G.get(M).programs;F!==void 0&&(F.forEach(function(W){ut.releaseProgram(W)}),M.isShaderMaterial&&ut.releaseShaderCache(M))}this.renderBufferDirect=function(M,F,W,B,z,xt){F===null&&(F=qe);const St=z.isMesh&&z.matrixWorld.determinantAffine()<0,gt=Wu(M,F,W,B,z);x.setMaterial(B,St);let Et=W.index,Rt=1;if(B.wireframe===!0){if(Et=q.getWireframeAttribute(W),Et===void 0)return;Rt=2}const Gt=W.drawRange,qt=W.attributes.position;let Ct=Gt.start*Rt,ce=(Gt.start+Gt.count)*Rt;xt!==null&&(Ct=Math.max(Ct,xt.start*Rt),ce=Math.min(ce,(xt.start+xt.count)*Rt)),Et!==null?(Ct=Math.max(Ct,0),ce=Math.min(ce,Et.count)):qt!=null&&(Ct=Math.max(Ct,0),ce=Math.min(ce,qt.count));const Pe=ce-Ct;if(Pe<0||Pe===1/0)return;_t.setup(z,B,gt,W,Et);let we,fe=ot;if(Et!==null&&(we=ht.get(Et),fe=$,fe.setIndex(we)),z.isMesh)B.wireframe===!0?(x.setLineWidth(B.wireframeLinewidth*Oe()),fe.setMode(U.LINES)):fe.setMode(U.TRIANGLES);else if(z.isLine){let ti=B.linewidth;ti===void 0&&(ti=1),x.setLineWidth(ti*Oe()),z.isLineSegments?fe.setMode(U.LINES):z.isLineLoop?fe.setMode(U.LINE_LOOP):fe.setMode(U.LINE_STRIP)}else z.isPoints?fe.setMode(U.POINTS):z.isSprite&&fe.setMode(U.TRIANGLES);if(z.isBatchedMesh)if(ae.get("WEBGL_multi_draw"))fe.renderMultiDraw(z._multiDrawStarts,z._multiDrawCounts,z._multiDrawCount);else{const ti=z._multiDrawStarts,yt=z._multiDrawCounts,xi=z._multiDrawCount,ie=Et?ht.get(Et).bytesPerElement:1,bi=G.get(B).currentProgram.getUniforms();for(let Hi=0;Hi<xi;Hi++)bi.setValue(U,"_gl_DrawID",Hi),fe.render(ti[Hi]/ie,yt[Hi])}else if(z.isInstancedMesh)fe.renderInstances(Ct,Pe,z.count);else if(W.isInstancedBufferGeometry){const ti=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,yt=Math.min(W.instanceCount,ti);fe.renderInstances(Ct,Pe,yt)}else fe.render(Ct,Pe)};function sc(M,F,W){M.transparent===!0&&M.side===Ui&&M.forceSinglePass===!1?(M.side=di,M.needsUpdate=!0,Tr(M,F,W),M.side=Dn,M.needsUpdate=!0,Tr(M,F,W),M.side=Ui):Tr(M,F,W)}this.compile=function(M,F,W=null){W===null&&(W=M),w=ft.get(W),w.init(F),_.push(w),W.traverseVisible(function(z){z.isLight&&z.layers.test(F.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),M!==W&&M.traverseVisible(function(z){z.isLight&&z.layers.test(F.layers)&&(w.pushLight(z),z.castShadow&&w.pushShadow(z))}),w.setupLights();const B=new Set;return M.traverse(function(z){if(!(z.isMesh||z.isPoints||z.isLine||z.isSprite))return;const xt=z.material;if(xt)if(Array.isArray(xt))for(let St=0;St<xt.length;St++){const gt=xt[St];sc(gt,W,z),B.add(gt)}else sc(xt,W,z),B.add(xt)}),w=_.pop(),B},this.compileAsync=function(M,F,W=null){const B=this.compile(M,F,W);return new Promise(z=>{function xt(){if(B.forEach(function(St){G.get(St).currentProgram.isReady()&&B.delete(St)}),B.size===0){z(M);return}setTimeout(xt,10)}ae.get("KHR_parallel_shader_compile")!==null?xt():setTimeout(xt,10)})};let Ba=null;function Gu(M){Ba&&Ba(M)}function rc(){Bn.stop()}function ac(){Bn.start()}const Bn=new pu;Bn.setAnimationLoop(Gu),typeof self<"u"&&Bn.setContext(self),this.setAnimationLoop=function(M){Ba=M,wt.setAnimationLoop(M),M===null?Bn.stop():Bn.start()},wt.addEventListener("sessionstart",rc),wt.addEventListener("sessionend",ac),this.render=function(M,F){if(F!==void 0&&F.isCamera!==!0){Qt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;L!==null&&L.renderStart(M,F);const W=wt.enabled===!0&&wt.isPresenting===!0,B=E!==null&&(K===null||W)&&E.begin(P,K);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),F.parent===null&&F.matrixWorldAutoUpdate===!0&&F.updateMatrixWorld(),wt.enabled===!0&&wt.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(wt.cameraAutoUpdate===!0&&wt.updateCamera(F),F=wt.getCamera()),M.isScene===!0&&M.onBeforeRender(P,M,F,K),w=ft.get(M,_.length),w.init(F),w.state.textureUnits=Y.getTextureUnits(),_.push(w),Fe.multiplyMatrices(F.projectionMatrix,F.matrixWorldInverse),ue.setFromProjectionMatrix(Fe,Xi,F.reversedDepth),ee=this.localClippingEnabled,re=Pt.init(this.clippingPlanes,ee),R=pt.get(M,C.length),R.init(),C.push(R),wt.enabled===!0&&wt.isPresenting===!0){const St=P.xr.getDepthSensingMesh();St!==null&&za(St,F,-1/0,P.sortObjects)}za(M,F,0,P.sortObjects),R.finish(),P.sortObjects===!0&&R.sort(Ot,zt,F.reversedDepth),be=wt.enabled===!1||wt.isPresenting===!1||wt.hasDepthSensing()===!1,be&&Ht.addToRenderList(R,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),re===!0&&Pt.beginShadows();const z=w.state.shadowsArray;if(Dt.render(z,M,F),re===!0&&Pt.endShadows(),(B&&E.hasRenderPass())===!1){const St=R.opaque,gt=R.transmissive;if(w.setupLights(),F.isArrayCamera){const Et=F.cameras;if(gt.length>0)for(let Rt=0,Gt=Et.length;Rt<Gt;Rt++){const qt=Et[Rt];lc(St,gt,M,qt)}be&&Ht.render(M);for(let Rt=0,Gt=Et.length;Rt<Gt;Rt++){const qt=Et[Rt];oc(R,M,qt,qt.viewport)}}else gt.length>0&&lc(St,gt,M,F),be&&Ht.render(M),oc(R,M,F)}K!==null&&k===0&&(Y.updateMultisampleRenderTarget(K),Y.updateRenderTargetMipmap(K)),B&&E.end(P),M.isScene===!0&&M.onAfterRender(P,M,F),_t.resetDefaultState(),tt=-1,at=null,_.pop(),_.length>0?(w=_[_.length-1],Y.setTextureUnits(w.state.textureUnits),re===!0&&Pt.setGlobalState(P.clippingPlanes,w.state.camera)):w=null,C.pop(),C.length>0?R=C[C.length-1]:R=null,L!==null&&L.renderEnd()};function za(M,F,W,B){if(M.visible===!1)return;if(M.layers.test(F.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(F);else if(M.isLightProbeGrid)w.pushLightProbeGrid(M);else if(M.isLight)w.pushLight(M),M.castShadow&&w.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||ue.intersectsSprite(M)){B&&We.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Fe);const St=J.update(M),gt=M.material;gt.visible&&R.push(M,St,gt,W,We.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||ue.intersectsObject(M))){const St=J.update(M),gt=M.material;if(B&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),We.copy(M.boundingSphere.center)):(St.boundingSphere===null&&St.computeBoundingSphere(),We.copy(St.boundingSphere.center)),We.applyMatrix4(M.matrixWorld).applyMatrix4(Fe)),Array.isArray(gt)){const Et=St.groups;for(let Rt=0,Gt=Et.length;Rt<Gt;Rt++){const qt=Et[Rt],Ct=gt[qt.materialIndex];Ct&&Ct.visible&&R.push(M,St,Ct,W,We.z,qt)}}else gt.visible&&R.push(M,St,gt,W,We.z,null)}}const xt=M.children;for(let St=0,gt=xt.length;St<gt;St++)za(xt[St],F,W,B)}function oc(M,F,W,B){const{opaque:z,transmissive:xt,transparent:St}=M;w.setupLightsView(W),re===!0&&Pt.setGlobalState(P.clippingPlanes,W),B&&x.viewport(lt.copy(B)),z.length>0&&Er(z,F,W),xt.length>0&&Er(xt,F,W),St.length>0&&Er(St,F,W),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function lc(M,F,W,B){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[B.id]===void 0){const Ct=ae.has("EXT_color_buffer_half_float")||ae.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[B.id]=new ki(1,1,{generateMipmaps:!0,type:Ct?$i:Mi,minFilter:Kn,samples:Math.max(4,A.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:jt.workingColorSpace})}const xt=w.state.transmissionRenderTarget[B.id],St=B.viewport||lt;xt.setSize(St.z*P.transmissionResolutionScale,St.w*P.transmissionResolutionScale);const gt=P.getRenderTarget(),Et=P.getActiveCubeFace(),Rt=P.getActiveMipmapLevel();P.setRenderTarget(xt),P.getClearColor(ye),se=P.getClearAlpha(),se<1&&P.setClearColor(16777215,.5),P.clear(),be&&Ht.render(W);const Gt=P.toneMapping;P.toneMapping=qi;const qt=B.viewport;if(B.viewport!==void 0&&(B.viewport=void 0),w.setupLightsView(B),re===!0&&Pt.setGlobalState(P.clippingPlanes,B),Er(M,W,B),Y.updateMultisampleRenderTarget(xt),Y.updateRenderTargetMipmap(xt),ae.has("WEBGL_multisampled_render_to_texture")===!1){let Ct=!1;for(let ce=0,Pe=F.length;ce<Pe;ce++){const we=F[ce],{object:fe,geometry:ti,material:yt,group:xi}=we;if(yt.side===Ui&&fe.layers.test(B.layers)){const ie=yt.side;yt.side=di,yt.needsUpdate=!0,cc(fe,W,B,ti,yt,xi),yt.side=ie,yt.needsUpdate=!0,Ct=!0}}Ct===!0&&(Y.updateMultisampleRenderTarget(xt),Y.updateRenderTargetMipmap(xt))}P.setRenderTarget(gt,Et,Rt),P.setClearColor(ye,se),qt!==void 0&&(B.viewport=qt),P.toneMapping=Gt}function Er(M,F,W){const B=F.isScene===!0?F.overrideMaterial:null;for(let z=0,xt=M.length;z<xt;z++){const St=M[z],{object:gt,geometry:Et,group:Rt}=St;let Gt=St.material;Gt.allowOverride===!0&&B!==null&&(Gt=B),gt.layers.test(W.layers)&&cc(gt,F,W,Et,Gt,Rt)}}function cc(M,F,W,B,z,xt){M.onBeforeRender(P,F,W,B,z,xt),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),z.onBeforeRender(P,F,W,B,M,xt),z.transparent===!0&&z.side===Ui&&z.forceSinglePass===!1?(z.side=di,z.needsUpdate=!0,P.renderBufferDirect(W,F,B,z,M,xt),z.side=Dn,z.needsUpdate=!0,P.renderBufferDirect(W,F,B,z,M,xt),z.side=Ui):P.renderBufferDirect(W,F,B,z,M,xt),M.onAfterRender(P,F,W,B,z,xt)}function Tr(M,F,W){F.isScene!==!0&&(F=qe);const B=G.get(M),z=w.state.lights,xt=w.state.shadowsArray,St=z.state.version,gt=ut.getParameters(M,z.state,xt,F,W,w.state.lightProbeGridArray),Et=ut.getProgramCacheKey(gt);let Rt=B.programs;B.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?F.environment:null,B.fog=F.fog;const Gt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;B.envMap=rt.get(M.envMap||B.environment,Gt),B.envMapRotation=B.environment!==null&&M.envMap===null?F.environmentRotation:M.envMapRotation,Rt===void 0&&(M.addEventListener("dispose",zi),Rt=new Map,B.programs=Rt);let qt=Rt.get(Et);if(qt!==void 0){if(B.currentProgram===qt&&B.lightsStateVersion===St)return uc(M,gt),qt}else gt.uniforms=ut.getUniforms(M),L!==null&&M.isNodeMaterial&&L.build(M,W,gt),M.onBeforeCompile(gt,P),qt=ut.acquireProgram(gt,Et),Rt.set(Et,qt),B.uniforms=gt.uniforms;const Ct=B.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ct.clippingPlanes=Pt.uniform),uc(M,gt),B.needsLights=Yu(M),B.lightsStateVersion=St,B.needsLights&&(Ct.ambientLightColor.value=z.state.ambient,Ct.lightProbe.value=z.state.probe,Ct.directionalLights.value=z.state.directional,Ct.directionalLightShadows.value=z.state.directionalShadow,Ct.spotLights.value=z.state.spot,Ct.spotLightShadows.value=z.state.spotShadow,Ct.rectAreaLights.value=z.state.rectArea,Ct.ltc_1.value=z.state.rectAreaLTC1,Ct.ltc_2.value=z.state.rectAreaLTC2,Ct.pointLights.value=z.state.point,Ct.pointLightShadows.value=z.state.pointShadow,Ct.hemisphereLights.value=z.state.hemi,Ct.directionalShadowMatrix.value=z.state.directionalShadowMatrix,Ct.spotLightMatrix.value=z.state.spotLightMatrix,Ct.spotLightMap.value=z.state.spotLightMap,Ct.pointShadowMatrix.value=z.state.pointShadowMatrix),B.lightProbeGrid=w.state.lightProbeGridArray.length>0,B.currentProgram=qt,B.uniformsList=null,qt}function hc(M){if(M.uniformsList===null){const F=M.currentProgram.getUniforms();M.uniformsList=fa.seqWithValue(F.seq,M.uniforms)}return M.uniformsList}function uc(M,F){const W=G.get(M);W.outputColorSpace=F.outputColorSpace,W.batching=F.batching,W.batchingColor=F.batchingColor,W.instancing=F.instancing,W.instancingColor=F.instancingColor,W.instancingMorph=F.instancingMorph,W.skinning=F.skinning,W.morphTargets=F.morphTargets,W.morphNormals=F.morphNormals,W.morphColors=F.morphColors,W.morphTargetsCount=F.morphTargetsCount,W.numClippingPlanes=F.numClippingPlanes,W.numIntersection=F.numClipIntersection,W.vertexAlphas=F.vertexAlphas,W.vertexTangents=F.vertexTangents,W.toneMapping=F.toneMapping}function Vu(M,F){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;v.setFromMatrixPosition(F.matrixWorld);for(let W=0,B=M.length;W<B;W++){const z=M[W];if(z.texture!==null&&z.boundingBox.containsPoint(v))return z}return null}function Wu(M,F,W,B,z){F.isScene!==!0&&(F=qe),Y.resetTextureUnits();const xt=F.fog,St=B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial?F.environment:null,gt=K===null?P.outputColorSpace:K.isXRRenderTarget===!0?K.texture.colorSpace:jt.workingColorSpace,Et=B.isMeshStandardMaterial||B.isMeshLambertMaterial&&!B.envMap||B.isMeshPhongMaterial&&!B.envMap,Rt=rt.get(B.envMap||St,Et),Gt=B.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,qt=!!W.attributes.tangent&&(!!B.normalMap||B.anisotropy>0),Ct=!!W.morphAttributes.position,ce=!!W.morphAttributes.normal,Pe=!!W.morphAttributes.color;let we=qi;B.toneMapped&&(K===null||K.isXRRenderTarget===!0)&&(we=P.toneMapping);const fe=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,ti=fe!==void 0?fe.length:0,yt=G.get(B),xi=w.state.lights;if(re===!0&&(ee===!0||M!==at)){const ge=M===at&&B.id===tt;Pt.setState(B,M,ge)}let ie=!1;B.version===yt.__version?(yt.needsLights&&yt.lightsStateVersion!==xi.state.version||yt.outputColorSpace!==gt||z.isBatchedMesh&&yt.batching===!1||!z.isBatchedMesh&&yt.batching===!0||z.isBatchedMesh&&yt.batchingColor===!0&&z.colorTexture===null||z.isBatchedMesh&&yt.batchingColor===!1&&z.colorTexture!==null||z.isInstancedMesh&&yt.instancing===!1||!z.isInstancedMesh&&yt.instancing===!0||z.isSkinnedMesh&&yt.skinning===!1||!z.isSkinnedMesh&&yt.skinning===!0||z.isInstancedMesh&&yt.instancingColor===!0&&z.instanceColor===null||z.isInstancedMesh&&yt.instancingColor===!1&&z.instanceColor!==null||z.isInstancedMesh&&yt.instancingMorph===!0&&z.morphTexture===null||z.isInstancedMesh&&yt.instancingMorph===!1&&z.morphTexture!==null||yt.envMap!==Rt||B.fog===!0&&yt.fog!==xt||yt.numClippingPlanes!==void 0&&(yt.numClippingPlanes!==Pt.numPlanes||yt.numIntersection!==Pt.numIntersection)||yt.vertexAlphas!==Gt||yt.vertexTangents!==qt||yt.morphTargets!==Ct||yt.morphNormals!==ce||yt.morphColors!==Pe||yt.toneMapping!==we||yt.morphTargetsCount!==ti||!!yt.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(ie=!0):(ie=!0,yt.__version=B.version);let bi=yt.currentProgram;ie===!0&&(bi=Tr(B,F,z),L&&B.isNodeMaterial&&L.onUpdateProgram(B,bi,yt));let Hi=!1,xn=!1,rs=!1;const de=bi.getUniforms(),Ie=yt.uniforms;if(x.useProgram(bi.program)&&(Hi=!0,xn=!0,rs=!0),B.id!==tt&&(tt=B.id,xn=!0),yt.needsLights){const ge=Vu(w.state.lightProbeGridArray,z);yt.lightProbeGrid!==ge&&(yt.lightProbeGrid=ge,xn=!0)}if(Hi||at!==M){x.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),de.setValue(U,"projectionMatrix",M.projectionMatrix),de.setValue(U,"viewMatrix",M.matrixWorldInverse);const vn=de.map.cameraPosition;vn!==void 0&&vn.setValue(U,ze.setFromMatrixPosition(M.matrixWorld)),A.logarithmicDepthBuffer&&de.setValue(U,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(B.isMeshPhongMaterial||B.isMeshToonMaterial||B.isMeshLambertMaterial||B.isMeshBasicMaterial||B.isMeshStandardMaterial||B.isShaderMaterial)&&de.setValue(U,"isOrthographic",M.isOrthographicCamera===!0),at!==M&&(at=M,xn=!0,rs=!0)}if(yt.needsLights&&(xi.state.directionalShadowMap.length>0&&de.setValue(U,"directionalShadowMap",xi.state.directionalShadowMap,Y),xi.state.spotShadowMap.length>0&&de.setValue(U,"spotShadowMap",xi.state.spotShadowMap,Y),xi.state.pointShadowMap.length>0&&de.setValue(U,"pointShadowMap",xi.state.pointShadowMap,Y)),z.isSkinnedMesh){de.setOptional(U,z,"bindMatrix"),de.setOptional(U,z,"bindMatrixInverse");const ge=z.skeleton;ge&&(ge.boneTexture===null&&ge.computeBoneTexture(),de.setValue(U,"boneTexture",ge.boneTexture,Y))}z.isBatchedMesh&&(de.setOptional(U,z,"batchingTexture"),de.setValue(U,"batchingTexture",z._matricesTexture,Y),de.setOptional(U,z,"batchingIdTexture"),de.setValue(U,"batchingIdTexture",z._indirectTexture,Y),de.setOptional(U,z,"batchingColorTexture"),z._colorsTexture!==null&&de.setValue(U,"batchingColorTexture",z._colorsTexture,Y));const _n=W.morphAttributes;if((_n.position!==void 0||_n.normal!==void 0||_n.color!==void 0)&&D.update(z,W,bi),(xn||yt.receiveShadow!==z.receiveShadow)&&(yt.receiveShadow=z.receiveShadow,de.setValue(U,"receiveShadow",z.receiveShadow)),(B.isMeshStandardMaterial||B.isMeshLambertMaterial||B.isMeshPhongMaterial)&&B.envMap===null&&F.environment!==null&&(Ie.envMapIntensity.value=F.environmentIntensity),Ie.dfgLUT!==void 0&&(Ie.dfgLUT.value=Ox()),xn){if(de.setValue(U,"toneMappingExposure",P.toneMappingExposure),yt.needsLights&&Xu(Ie,rs),xt&&B.fog===!0&&At.refreshFogUniforms(Ie,xt),At.refreshMaterialUniforms(Ie,B,nt,ct,w.state.transmissionRenderTarget[M.id]),yt.needsLights&&yt.lightProbeGrid){const ge=yt.lightProbeGrid;Ie.probesSH.value=ge.texture,Ie.probesMin.value.copy(ge.boundingBox.min),Ie.probesMax.value.copy(ge.boundingBox.max),Ie.probesResolution.value.copy(ge.resolution)}fa.upload(U,hc(yt),Ie,Y)}if(B.isShaderMaterial&&B.uniformsNeedUpdate===!0&&(fa.upload(U,hc(yt),Ie,Y),B.uniformsNeedUpdate=!1),B.isSpriteMaterial&&de.setValue(U,"center",z.center),de.setValue(U,"modelViewMatrix",z.modelViewMatrix),de.setValue(U,"normalMatrix",z.normalMatrix),de.setValue(U,"modelMatrix",z.matrixWorld),B.uniformsGroups!==void 0){const ge=B.uniformsGroups;for(let vn=0,as=ge.length;vn<as;vn++){const fc=ge[vn];j.update(fc,bi),j.bind(fc,bi)}}return bi}function Xu(M,F){M.ambientLightColor.needsUpdate=F,M.lightProbe.needsUpdate=F,M.directionalLights.needsUpdate=F,M.directionalLightShadows.needsUpdate=F,M.pointLights.needsUpdate=F,M.pointLightShadows.needsUpdate=F,M.spotLights.needsUpdate=F,M.spotLightShadows.needsUpdate=F,M.rectAreaLights.needsUpdate=F,M.hemisphereLights.needsUpdate=F}function Yu(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return V},this.getActiveMipmapLevel=function(){return k},this.getRenderTarget=function(){return K},this.setRenderTargetTextures=function(M,F,W){const B=G.get(M);B.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,B.__autoAllocateDepthBuffer===!1&&(B.__useRenderToTexture=!1),G.get(M.texture).__webglTexture=F,G.get(M.depthTexture).__webglTexture=B.__autoAllocateDepthBuffer?void 0:W,B.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,F){const W=G.get(M);W.__webglFramebuffer=F,W.__useDefaultFramebuffer=F===void 0},this.setRenderTarget=function(M,F=0,W=0){K=M,V=F,k=W;let B=null,z=!1,xt=!1;if(M){const gt=G.get(M);if(gt.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(U.FRAMEBUFFER,gt.__webglFramebuffer),lt.copy(M.viewport),Mt.copy(M.scissor),ne=M.scissorTest,x.viewport(lt),x.scissor(Mt),x.setScissorTest(ne),tt=-1;return}else if(gt.__webglFramebuffer===void 0)Y.setupRenderTarget(M);else if(gt.__hasExternalTextures)Y.rebindTextures(M,G.get(M.texture).__webglTexture,G.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Gt=M.depthTexture;if(gt.__boundDepthTexture!==Gt){if(Gt!==null&&G.has(Gt)&&(M.width!==Gt.image.width||M.height!==Gt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Y.setupDepthRenderbuffer(M)}}const Et=M.texture;(Et.isData3DTexture||Et.isDataArrayTexture||Et.isCompressedArrayTexture)&&(xt=!0);const Rt=G.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Rt[F])?B=Rt[F][W]:B=Rt[F],z=!0):M.samples>0&&Y.useMultisampledRTT(M)===!1?B=G.get(M).__webglMultisampledFramebuffer:Array.isArray(Rt)?B=Rt[W]:B=Rt,lt.copy(M.viewport),Mt.copy(M.scissor),ne=M.scissorTest}else lt.copy(Lt).multiplyScalar(nt).floor(),Mt.copy(Ce).multiplyScalar(nt).floor(),ne=$t;if(W!==0&&(B=X),x.bindFramebuffer(U.FRAMEBUFFER,B)&&x.drawBuffers(M,B),x.viewport(lt),x.scissor(Mt),x.setScissorTest(ne),z){const gt=G.get(M.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+F,gt.__webglTexture,W)}else if(xt){const gt=F;for(let Et=0;Et<M.textures.length;Et++){const Rt=G.get(M.textures[Et]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+Et,Rt.__webglTexture,W,gt)}}else if(M!==null&&W!==0){const gt=G.get(M.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,gt.__webglTexture,W)}tt=-1},this.readRenderTargetPixels=function(M,F,W,B,z,xt,St,gt=0){if(!(M&&M.isWebGLRenderTarget)){Qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Et=G.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&St!==void 0&&(Et=Et[St]),Et){x.bindFramebuffer(U.FRAMEBUFFER,Et);try{const Rt=M.textures[gt],Gt=Rt.format,qt=Rt.type;if(M.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+gt),!A.textureFormatReadable(Gt)){Qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!A.textureTypeReadable(qt)){Qt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}F>=0&&F<=M.width-B&&W>=0&&W<=M.height-z&&U.readPixels(F,W,B,z,dt.convert(Gt),dt.convert(qt),xt)}finally{const Rt=K!==null?G.get(K).__webglFramebuffer:null;x.bindFramebuffer(U.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(M,F,W,B,z,xt,St,gt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Et=G.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&St!==void 0&&(Et=Et[St]),Et)if(F>=0&&F<=M.width-B&&W>=0&&W<=M.height-z){x.bindFramebuffer(U.FRAMEBUFFER,Et);const Rt=M.textures[gt],Gt=Rt.format,qt=Rt.type;if(M.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+gt),!A.textureFormatReadable(Gt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!A.textureTypeReadable(qt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ct=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Ct),U.bufferData(U.PIXEL_PACK_BUFFER,xt.byteLength,U.STREAM_READ),U.readPixels(F,W,B,z,dt.convert(Gt),dt.convert(qt),0);const ce=K!==null?G.get(K).__webglFramebuffer:null;x.bindFramebuffer(U.FRAMEBUFFER,ce);const Pe=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await Cf(U,Pe,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Ct),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,xt),U.deleteBuffer(Ct),U.deleteSync(Pe),xt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,F=null,W=0){const B=Math.pow(2,-W),z=Math.floor(M.image.width*B),xt=Math.floor(M.image.height*B),St=F!==null?F.x:0,gt=F!==null?F.y:0;Y.setTexture2D(M,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,St,gt,z,xt),x.unbindTexture()},this.copyTextureToTexture=function(M,F,W=null,B=null,z=0,xt=0){let St,gt,Et,Rt,Gt,qt,Ct,ce,Pe;const we=M.isCompressedTexture?M.mipmaps[xt]:M.image;if(W!==null)St=W.max.x-W.min.x,gt=W.max.y-W.min.y,Et=W.isBox3?W.max.z-W.min.z:1,Rt=W.min.x,Gt=W.min.y,qt=W.isBox3?W.min.z:0;else{const Ie=Math.pow(2,-z);St=Math.floor(we.width*Ie),gt=Math.floor(we.height*Ie),M.isDataArrayTexture?Et=we.depth:M.isData3DTexture?Et=Math.floor(we.depth*Ie):Et=1,Rt=0,Gt=0,qt=0}B!==null?(Ct=B.x,ce=B.y,Pe=B.z):(Ct=0,ce=0,Pe=0);const fe=dt.convert(F.format),ti=dt.convert(F.type);let yt;F.isData3DTexture?(Y.setTexture3D(F,0),yt=U.TEXTURE_3D):F.isDataArrayTexture||F.isCompressedArrayTexture?(Y.setTexture2DArray(F,0),yt=U.TEXTURE_2D_ARRAY):(Y.setTexture2D(F,0),yt=U.TEXTURE_2D),x.activeTexture(U.TEXTURE0),x.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,F.flipY),x.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,F.premultiplyAlpha),x.pixelStorei(U.UNPACK_ALIGNMENT,F.unpackAlignment);const xi=x.getParameter(U.UNPACK_ROW_LENGTH),ie=x.getParameter(U.UNPACK_IMAGE_HEIGHT),bi=x.getParameter(U.UNPACK_SKIP_PIXELS),Hi=x.getParameter(U.UNPACK_SKIP_ROWS),xn=x.getParameter(U.UNPACK_SKIP_IMAGES);x.pixelStorei(U.UNPACK_ROW_LENGTH,we.width),x.pixelStorei(U.UNPACK_IMAGE_HEIGHT,we.height),x.pixelStorei(U.UNPACK_SKIP_PIXELS,Rt),x.pixelStorei(U.UNPACK_SKIP_ROWS,Gt),x.pixelStorei(U.UNPACK_SKIP_IMAGES,qt);const rs=M.isDataArrayTexture||M.isData3DTexture,de=F.isDataArrayTexture||F.isData3DTexture;if(M.isDepthTexture){const Ie=G.get(M),_n=G.get(F),ge=G.get(Ie.__renderTarget),vn=G.get(_n.__renderTarget);x.bindFramebuffer(U.READ_FRAMEBUFFER,ge.__webglFramebuffer),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,vn.__webglFramebuffer);for(let as=0;as<Et;as++)rs&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,G.get(M).__webglTexture,z,qt+as),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,G.get(F).__webglTexture,xt,Pe+as)),U.blitFramebuffer(Rt,Gt,St,gt,Ct,ce,St,gt,U.DEPTH_BUFFER_BIT,U.NEAREST);x.bindFramebuffer(U.READ_FRAMEBUFFER,null),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(z!==0||M.isRenderTargetTexture||G.has(M)){const Ie=G.get(M),_n=G.get(F);x.bindFramebuffer(U.READ_FRAMEBUFFER,Z),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,N);for(let ge=0;ge<Et;ge++)rs?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Ie.__webglTexture,z,qt+ge):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Ie.__webglTexture,z),de?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,_n.__webglTexture,xt,Pe+ge):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,_n.__webglTexture,xt),z!==0?U.blitFramebuffer(Rt,Gt,St,gt,Ct,ce,St,gt,U.COLOR_BUFFER_BIT,U.NEAREST):de?U.copyTexSubImage3D(yt,xt,Ct,ce,Pe+ge,Rt,Gt,St,gt):U.copyTexSubImage2D(yt,xt,Ct,ce,Rt,Gt,St,gt);x.bindFramebuffer(U.READ_FRAMEBUFFER,null),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else de?M.isDataTexture||M.isData3DTexture?U.texSubImage3D(yt,xt,Ct,ce,Pe,St,gt,Et,fe,ti,we.data):F.isCompressedArrayTexture?U.compressedTexSubImage3D(yt,xt,Ct,ce,Pe,St,gt,Et,fe,we.data):U.texSubImage3D(yt,xt,Ct,ce,Pe,St,gt,Et,fe,ti,we):M.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,xt,Ct,ce,St,gt,fe,ti,we.data):M.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,xt,Ct,ce,we.width,we.height,fe,we.data):U.texSubImage2D(U.TEXTURE_2D,xt,Ct,ce,St,gt,fe,ti,we);x.pixelStorei(U.UNPACK_ROW_LENGTH,xi),x.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ie),x.pixelStorei(U.UNPACK_SKIP_PIXELS,bi),x.pixelStorei(U.UNPACK_SKIP_ROWS,Hi),x.pixelStorei(U.UNPACK_SKIP_IMAGES,xn),xt===0&&F.generateMipmaps&&U.generateMipmap(yt),x.unbindTexture()},this.initRenderTarget=function(M){G.get(M).__webglFramebuffer===void 0&&Y.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Y.setTextureCube(M,0):M.isData3DTexture?Y.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Y.setTexture2DArray(M,0):Y.setTexture2D(M,0),x.unbindTexture()},this.resetState=function(){V=0,k=0,K=null,x.reset(),_t.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Xi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=jt._getDrawingBufferColorSpace(t),e.unpackColorSpace=jt._getUnpackColorSpace()}}function pi(s,t){const e=document.createElement("canvas");e.width=s,e.height=t;const i=e.getContext("2d");return{c:e,g:i}}function mi(s,t=1,e=!0){const i=new Un(s);return i.wrapS=i.wrapT=Us,i.repeat.set(t,t),e&&(i.colorSpace=Be),i.anisotropy=4,i}let Eo=1234;function vt(){return Eo=Eo*16807%2147483647,(Eo-1)/2147483646}const Rh=new Map;function gi(s,t){let e=Rh.get(s);return e||(e=t(),Rh.set(s,e)),e}function mr(s="#d9d4cc",t="rgba(70,60,55,",e=!0){return gi("marble"+s+t,()=>{const{c:i,g:n}=pi(512,512);n.fillStyle=s,n.fillRect(0,0,512,512);for(let r=0;r<2400;r++)n.fillStyle=`rgba(255,255,255,${vt()*.06})`,n.fillRect(vt()*512,vt()*512,3,3);for(let r=0;r<14;r++){n.strokeStyle=t+(.1+vt()*.35)+")",n.lineWidth=.6+vt()*2.2,n.beginPath();let a=vt()*512,o=vt()*512;n.moveTo(a,o);for(let l=0;l<40;l++)a+=(vt()-.3)*30,o+=(vt()-.5)*30,n.lineTo(a,o);n.stroke()}return e&&(n.strokeStyle="rgba(0,0,0,0.35)",n.lineWidth=2,n.strokeRect(0,0,512,512),n.beginPath(),n.moveTo(256,0),n.lineTo(256,512),n.moveTo(0,256),n.lineTo(512,256),n.stroke()),mi(i)})}function Kl(s="#3a3f4a"){return gi("carpet"+s,()=>{const{c:t,g:e}=pi(256,256);e.fillStyle=s,e.fillRect(0,0,256,256);for(let i=0;i<9e3;i++){const n=vt();e.fillStyle=n>.5?`rgba(255,255,255,${.05*vt()})`:`rgba(0,0,0,${.12*vt()})`,e.fillRect(vt()*256,vt()*256,2,2)}return e.strokeStyle="rgba(0,0,0,0.25)",e.lineWidth=2,e.strokeRect(0,0,256,256),mi(t)})}function bu(){return gi("ceil",()=>{const{c:s,g:t}=pi(256,256);t.fillStyle="#b9b9b4",t.fillRect(0,0,256,256);for(let e=0;e<4e3;e++)t.fillStyle=`rgba(0,0,0,${.12*vt()})`,t.fillRect(vt()*256,vt()*256,1.5,1.5);return t.strokeStyle="#6d6d6a",t.lineWidth=6,t.strokeRect(0,0,256,256),mi(s)})}function es(s="#3b2416"){return gi("wood"+s,()=>{const{c:t,g:e}=pi(256,512);e.fillStyle=s,e.fillRect(0,0,256,512);for(let i=0;i<90;i++){e.strokeStyle=`rgba(${vt()>.5?"0,0,0":"255,200,150"},${.04+vt()*.08})`,e.lineWidth=1+vt()*3;const n=vt()*256;e.beginPath(),e.moveTo(n,0);for(let r=0;r<=512;r+=32)e.lineTo(n+Math.sin(r*.02+i)*6,r);e.stroke()}return mi(t)})}function Fa(s="#55565a",t=!0){return gi("wall"+s+t,()=>{const{c:e,g:i}=pi(256,256);i.fillStyle=s,i.fillRect(0,0,256,256);for(let n=0;n<3e3;n++)i.fillStyle=`rgba(0,0,0,${.06*vt()})`,i.fillRect(vt()*256,vt()*256,2,2);return t&&(i.fillStyle="rgba(0,0,0,0.3)",i.fillRect(0,0,3,256),i.fillRect(0,230,256,26)),mi(e)})}function Zl(){return gi("concrete",()=>{const{c:s,g:t}=pi(256,256);t.fillStyle="#4d4f53",t.fillRect(0,0,256,256);for(let e=0;e<6e3;e++)t.fillStyle=`rgba(${vt()>.5?"255,255,255":"0,0,0"},${.07*vt()})`,t.fillRect(vt()*256,vt()*256,2,2);return mi(s)})}function To(s,t=0){return gi("screen"+s+"_"+t,()=>{const{c:e,g:i}=pi(128,96);if(t===2)i.fillStyle="#020203",i.fillRect(0,0,128,96);else{const r=["#0b2a4a","#0c3b2e","#1b1b3a","#2a3a4a"][s%4];if(i.fillStyle=r,i.fillRect(0,0,128,96),i.fillStyle="rgba(180,220,255,0.9)",i.fillRect(0,0,128,8),s%4===0){i.strokeStyle="rgba(160,210,255,0.5)",i.lineWidth=1;for(let a=12;a<96;a+=7)i.beginPath(),i.moveTo(0,a),i.lineTo(128,a),i.stroke();for(let a=0;a<128;a+=22)i.beginPath(),i.moveTo(a,8),i.lineTo(a,96),i.stroke();i.fillStyle="rgba(220,240,255,0.8)";for(let a=0;a<40;a++)i.fillRect(a%5*22+3,13+Math.floor(a/5)*7,6+vt()*12,3)}else if(s%4===1){i.strokeStyle="#6dffb0",i.lineWidth=2,i.beginPath(),i.moveTo(6,80);for(let a=6;a<124;a+=8)i.lineTo(a,80-a/124*50+(vt()-.5)*18);i.stroke(),i.fillStyle="rgba(255,90,90,0.9)",i.font="bold 10px monospace",i.fillText("Q4 GROWTH",8,22)}else if(s%4===2){i.fillStyle="rgba(220,220,255,0.85)";for(let a=0;a<9;a++)i.fillRect(6,14+a*9,30+vt()*80,4);i.fillStyle="#ff6060",i.fillRect(6,14,8,4)}else i.fillStyle="#9fd8ff",i.font="bold 16px sans-serif",i.fillText("SYNERGEX",20,54)}if(t>=1){i.strokeStyle="rgba(255,255,255,0.85)",i.lineWidth=1;const r=40+vt()*48,a=30+vt()*36;for(let o=0;o<12;o++){i.beginPath(),i.moveTo(r,a);let l=r,c=a;const u=o/12*Math.PI*2;for(let f=0;f<5;f++)l+=Math.cos(u+(vt()-.5))*12,c+=Math.sin(u+(vt()-.5))*12,i.lineTo(l,c);i.stroke()}i.fillStyle="rgba(0,0,0,0.7)",i.beginPath(),i.arc(r,a,4,0,Math.PI*2),i.fill(),t===1&&(i.fillStyle="rgba(255,0,180,0.35)",i.fillRect(0,40+vt()*40,128,6),i.fillStyle="rgba(0,255,120,0.3)",i.fillRect(vt()*100,0,8,96))}const n=mi(e);return n.wrapS=n.wrapT=$e,n})}function Bx(){return gi("crack",()=>{const{c:s,g:t}=pi(256,256);t.strokeStyle="rgba(235,245,255,0.95)";for(let i=0;i<16;i++){t.lineWidth=1.5,t.beginPath(),t.moveTo(128,128);let n=128,r=128;const a=i/16*Math.PI*2+vt()*.3;for(let o=0;o<8;o++)n+=Math.cos(a+(vt()-.5)*.8)*16,r+=Math.sin(a+(vt()-.5)*.8)*16,t.lineTo(n,r);t.stroke()}for(let i=20;i<110;i+=22+vt()*14){t.lineWidth=1,t.beginPath();for(let n=0;n<=Math.PI*2+.01;n+=.4){const r=i+(vt()-.5)*8,a=128+Math.cos(n)*r,o=128+Math.sin(n)*r;n===0?t.moveTo(a,o):t.lineTo(a,o)}t.stroke()}t.fillStyle="rgba(20,20,25,0.9)",t.beginPath(),t.arc(128,128,6,0,Math.PI*2),t.fill();const e=mi(s);return e.wrapS=e.wrapT=$e,e})}function zx(){return gi("hole",()=>{const{c:s,g:t}=pi(64,64),e=t.createRadialGradient(32,32,2,32,32,30);e.addColorStop(0,"rgba(0,0,0,1)"),e.addColorStop(.25,"rgba(10,8,6,0.95)"),e.addColorStop(.45,"rgba(40,35,30,0.6)"),e.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=e,t.fillRect(0,0,64,64);const i=mi(s);return i.wrapS=i.wrapT=$e,i})}function lr(){return gi("glow",()=>{const{c:s,g:t}=pi(64,64),e=t.createRadialGradient(32,32,0,32,32,32);e.addColorStop(0,"rgba(255,255,255,1)"),e.addColorStop(.3,"rgba(255,255,255,0.5)"),e.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=e,t.fillRect(0,0,64,64);const i=mi(s);return i.wrapS=i.wrapT=$e,i})}function Hx(){return gi("puddle",()=>{const{c:s,g:t}=pi(128,128);t.fillStyle="rgba(255,255,255,1)",t.beginPath();for(let i=0;i<=Math.PI*2+.01;i+=.25){const n=46+vt()*16,r=64+Math.cos(i)*n,a=64+Math.sin(i)*n;i===0?t.moveTo(r,a):t.lineTo(r,a)}t.fill();for(let i=0;i<5;i++)t.beginPath(),t.arc(64+(vt()-.5)*90,64+(vt()-.5)*90,6+vt()*10,0,Math.PI*2),t.fill();const e=mi(s,1,!1);return e.wrapS=e.wrapT=$e,e})}function Gx(s=0){return gi("sky"+s,()=>{const{c:i,g:n}=pi(2048,512),r=n.createLinearGradient(0,0,0,512);r.addColorStop(0,"#07070f"),r.addColorStop(.55,"#1a1430"),r.addColorStop(1,"#2b1a2e"),n.fillStyle=r,n.fillRect(0,0,2048,512);for(let c=0;c<6;c++){const u=n.createRadialGradient(vt()*2048,409.6,10,vt()*2048,409.6,380);u.addColorStop(0,"rgba(255,90,160,0.12)"),u.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=u,n.fillRect(0,0,2048,512)}const a=[{n:70,hMin:.2,hMax:.55,col:"#0d0d18",win:.25},{n:45,hMin:.35,hMax:.9,col:"#090911",win:.35}];for(const c of a)for(let u=0;u<c.n;u++){const f=30+vt()*90,h=vt()*2048,d=512*(c.hMin+vt()*(c.hMax-c.hMin));n.fillStyle=c.col,n.fillRect(h,512-d,f,d),vt()<.3&&(n.fillRect(h+f*.4,512-d-30,4,30),n.fillStyle="#ff2030",n.fillRect(h+f*.4-1,512-d-32,6,4));for(let g=512-d+6;g<508;g+=9)for(let y=h+4;y<h+f-4;y+=7)if(vt()<c.win){const m=vt();n.fillStyle=m<.7?`rgba(255,210,150,${.3+vt()*.5})`:`rgba(150,210,255,${.3+vt()*.5})`,n.fillRect(y,g,3,4)}}const o=["SYNERGEX","KIROSHI","NEON NOODLE","BUY MORE","OMNICORP","HYDRA BANK","24H SUSHI","CONSUME"];for(let c=0;c<9;c++){const u=vt()*1848,f=512*(.35+vt()*.4),h=["#ff3fa4","#3ff7ff","#ffb43f","#a46bff"][c%4];n.save(),n.shadowColor=h,n.shadowBlur=18,n.fillStyle=h,n.font=`bold ${16+Math.floor(vt()*18)}px sans-serif`,vt()<.4?(n.translate(u,f),n.rotate(-Math.PI/2),n.fillText(o[c%o.length],0,0)):n.fillText(o[c%o.length],u,f),n.restore()}const l=mi(i);return l.wrapS=Us,l.wrapT=$e,l})}function li(s,t,e="#e8e3d8",i="#14151a",n=512,r=128){return gi("sign"+s+t+e+i+n+r,()=>{const{c:a,g:o}=pi(n,r);o.fillStyle=i,o.fillRect(0,0,n,r),o.fillStyle=e,o.textAlign="center",o.textBaseline="middle",o.font=`bold ${Math.floor(r*(t?.42:.6))}px "Helvetica Neue", Arial, sans-serif`,o.fillText(s,n/2,t?r*.4:r/2),t&&(o.font=`${Math.floor(r*.16)}px "Helvetica Neue", Arial, sans-serif`,o.globalAlpha=.8,o.fillText(t,n/2,r*.78));const l=mi(a);return l.wrapS=l.wrapT=$e,l})}function Vx(s){return gi("art"+s,()=>{const{c:t,g:e}=pi(256,192),i=[["#1b2a49","#e94560","#f5f5f5"],["#222","#d4a017","#8b0000"],["#0f3d3e","#e2dcc8","#100f0f"],["#2d132c","#ee4540","#c72c41"],["#f0e6d2","#203040","#b08850"]],n=i[s%i.length];e.fillStyle=n[0],e.fillRect(0,0,256,192);for(let a=0;a<7;a++)e.fillStyle=n[1+a%2],e.globalAlpha=.5+vt()*.5,vt()<.5?e.fillRect(vt()*200,vt()*150,20+vt()*90,20+vt()*80):(e.beginPath(),e.arc(vt()*256,vt()*192,10+vt()*50,0,Math.PI*2),e.fill());e.globalAlpha=1,s===3&&(e.fillStyle="#111",e.fillRect(90,60,80,132),e.fillStyle="#d9b99b",e.beginPath(),e.arc(130,55,26,0,Math.PI*2),e.fill(),e.fillStyle="#a00",e.fillRect(125,85,10,50));const r=mi(t);return r.wrapS=r.wrapT=$e,r})}const De=new T,Ch=new ni,sa=new Bt,da=new T,Tn=new Ji;class Ao{n;geo;pts;pos;col;size;vel;life;maxLife;s0;s1;grav;drag;a0;ground;bounce;head=0;mat;active=0;constructor(t,e,i){this.n=t,this.pos=new Float32Array(t*3),this.col=new Float32Array(t*4),this.size=new Float32Array(t),this.vel=new Float32Array(t*3),this.life=new Float32Array(t),this.maxLife=new Float32Array(t),this.s0=new Float32Array(t),this.s1=new Float32Array(t),this.grav=new Float32Array(t),this.drag=new Float32Array(t),this.a0=new Float32Array(t),this.ground=new Float32Array(t),this.bounce=new Uint8Array(t),this.geo=new Ne,this.geo.setAttribute("position",new Ue(this.pos,3).setUsage(rr)),this.geo.setAttribute("acolor",new Ue(this.col,4).setUsage(rr)),this.geo.setAttribute("asize",new Ue(this.size,1).setUsage(rr)),this.mat=new yi({uniforms:{uScale:{value:470},uSoft:{value:i}},vertexShader:`attribute vec4 acolor; attribute float asize; uniform float uScale; varying vec4 vC;
        void main(){ vC = acolor; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = asize > 0.0 ? max(1.5, asize * uScale / max(0.05, -mv.z)) : 0.0; }`,fragmentShader:`varying vec4 vC; uniform float uSoft;
        void main(){ float d = length(gl_PointCoord - 0.5); float a = vC.a * (1.0 - smoothstep(0.5 - uSoft, 0.5, d)); if (a < 0.01) discard; gl_FragColor = vec4(vC.rgb, a); }`,transparent:!0,depthWrite:!1,blending:e?Oi:$n}),this.pts=new Sd(this.geo,this.mat),this.pts.frustumCulled=!1,this.pts.renderOrder=e?5:4}spawn(t,e,i,n,r,a,o,l,c,u,f,h=-99,d=!1){const g=this.head;this.head=(this.head+1)%this.n,this.pos[g*3]=t.x,this.pos[g*3+1]=t.y,this.pos[g*3+2]=t.z,this.vel[g*3]=e.x,this.vel[g*3+1]=e.y,this.vel[g*3+2]=e.z,this.life[g]=i,this.maxLife[g]=i,this.s0[g]=n,this.s1[g]=r,this.col[g*4]=a,this.col[g*4+1]=o,this.col[g*4+2]=l,this.a0[g]=c,this.grav[g]=u,this.drag[g]=f,this.ground[g]=h,this.bounce[g]=d?1:0}update(t){let e=0;for(let i=0;i<this.n;i++){if(this.life[i]<=0){this.size[i]=0;continue}e++,this.life[i]-=t;const n=Math.max(0,1-this.drag[i]*t);if(this.vel[i*3]*=n,this.vel[i*3+2]*=n,this.vel[i*3+1]=this.vel[i*3+1]*n-this.grav[i]*t,this.pos[i*3]+=this.vel[i*3]*t,this.pos[i*3+1]+=this.vel[i*3+1]*t,this.pos[i*3+2]+=this.vel[i*3+2]*t,this.pos[i*3+1]<this.ground[i])if(this.bounce[i])this.pos[i*3+1]=this.ground[i],this.vel[i*3+1]*=-.35,this.vel[i*3]*=.6,this.vel[i*3+2]*=.6;else{this.life[i]=0,this.size[i]=0;continue}const r=1-this.life[i]/this.maxLife[i];this.size[i]=this.s0[i]+(this.s1[i]-this.s0[i])*r,this.col[i*4+3]=this.a0[i]*(r<.7?1:1-(r-.7)/.3)}this.active=e,this.geo.attributes.position.needsUpdate=!0,this.geo.attributes.acolor.needsUpdate=!0,this.geo.attributes.asize.needsUpdate=!0}clear(){this.life.fill(0),this.size.fill(0)}}class Ro{mesh;items=[];head=0;constructor(t,e,i){this.mesh=new gd(t,e,i),this.mesh.instanceMatrix.setUsage(rr),this.mesh.frustumCulled=!1;for(let n=0;n<i;n++)this.items.push({alive:!1,p:new T,v:new T,q:new ni,w:new T,s:new T,ground:0,rest:!1,life:0,flutter:0}),this.mesh.setMatrixAt(n,sa.makeScale(0,0,0)),this.mesh.setColorAt(n,new Nt(1,1,1))}spawn(t,e,i,n,r,a=40,o=0){const l=this.head;this.head=(this.head+1)%this.items.length;const c=this.items[l];c.alive=!0,c.p.copy(t),c.v.copy(e),c.s.copy(i),c.ground=r,c.rest=!1,c.life=a,c.flutter=o,c.q.setFromEuler(Tn.set(Math.random()*6,Math.random()*6,Math.random()*6)),c.w.set((Math.random()-.5)*20,(Math.random()-.5)*20,(Math.random()-.5)*20),this.mesh.setColorAt(l,n),this.mesh.instanceColor&&(this.mesh.instanceColor.needsUpdate=!0)}update(t){for(let e=0;e<this.items.length;e++){const i=this.items[e];if(!i.alive)continue;if(i.life-=t,i.life<=0){i.alive=!1,this.mesh.setMatrixAt(e,sa.makeScale(0,0,0));continue}if(!i.rest){i.flutter>0?(i.v.y=Math.max(i.v.y-3*t,-.7),i.v.x*=1-1.5*t,i.v.z*=1-1.5*t,i.p.x+=Math.sin(i.life*4+e)*t*.6):i.v.y-=9.8*t,i.p.addScaledVector(i.v,t);const r=i.w.length();r>.001&&(Ch.setFromAxisAngle(De.copy(i.w).multiplyScalar(1/r),r*t),i.q.premultiply(Ch));const a=Math.min(i.s.x,i.s.y,i.s.z)*.5;if(i.p.y<i.ground+a)if(i.p.y=i.ground+a,Math.abs(i.v.y)<1.2||i.flutter>0){i.rest=!0,Tn.setFromQuaternion(i.q,"YXZ");const o=i.s.y<=i.s.x&&i.s.y<=i.s.z?"y":i.s.x<=i.s.z?"x":"z";o==="y"?i.q.setFromEuler(Tn.set(0,Tn.y,0)):o==="x"?i.q.setFromEuler(Tn.set(0,Tn.y,Math.PI/2)):i.q.setFromEuler(Tn.set(Math.PI/2,Tn.y,0))}else i.v.y*=-.3,i.v.x*=.5,i.v.z*=.5,i.w.multiplyScalar(.5)}const n=i.life<1?i.life:1;this.mesh.setMatrixAt(e,sa.compose(i.p,i.q,da.copy(i.s).multiplyScalar(n)))}this.mesh.instanceMatrix.needsUpdate=!0}clear(){for(let t=0;t<this.items.length;t++)this.items[t].alive=!1,this.mesh.setMatrixAt(t,sa.makeScale(0,0,0));this.mesh.instanceMatrix.needsUpdate=!0}}class Wx{group=new pe;add;norm;smokeP;debrisPool;glassPool;paperPool;decals=[];decalHead=0;decalGeo=new _e(1,1);decalMat;puddles=[];arcs=[];arcMat=new ru({color:12577023,transparent:!0,blending:Oi});flashes=[];constructor(){this.add=new Ao(900,!0,.35),this.norm=new Ao(1400,!1,.25),this.smokeP=new Ao(260,!1,.5),this.group.add(this.add.pts,this.norm.pts,this.smokeP.pts),this.debrisPool=new Ro(new Yt(1,1,1),new te,420),this.glassPool=new Ro(new Yt(1,1,1),new Jt({color:13625855,transparent:!0,opacity:.55,shininess:120,specular:16777215}),360),this.paperPool=new Ro(new Yt(1,1,1),new te({color:15921386}),140),this.group.add(this.debrisPool.mesh,this.glassPool.mesh,this.paperPool.mesh),this.decalMat=new Wt({map:zx(),transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-4});for(let t=0;t<6;t++){const e=new nu(new zl({color:16769184,blending:Oi,depthWrite:!1,transparent:!0}));e.visible=!1,this.group.add(e),this.flashes.push({m:e,life:0,max:1})}}setScale(t,e){const i=t/(2*Math.tan(Ps.degToRad(e)/2));this.add.mat.uniforms.uScale.value=i,this.norm.mat.uniforms.uScale.value=i,this.smokeP.mat.uniforms.uScale.value=i}sparks(t,e,i=14,n=4){for(let r=0;r<i;r++)De.set(e.x+(Math.random()-.5)*1.4,e.y+Math.random()*.8,e.z+(Math.random()-.5)*1.4).normalize().multiplyScalar(n*(.4+Math.random())),this.add.spawn(t,De,.3+Math.random()*.5,.035,.01,1,.75+Math.random()*.25,.3,1,9.8,.5,.01,!0);this.flash(t,16760944,.35,.06)}flash(t,e,i,n){const r=this.flashes.find(a=>a.life<=0)??this.flashes[0];r.m.position.copy(t),r.m.scale.setScalar(i),r.m.material.color.setHex(e),r.life=n,r.max=n,r.m.visible=!0}dust(t,e,i=.6){for(let n=0;n<6;n++)De.set(e.x+(Math.random()-.5),e.y+(Math.random()-.3),e.z+(Math.random()-.5)).multiplyScalar(.8+Math.random()),this.norm.spawn(t,De,.35+Math.random()*.3,.025,.09,i,i*.95,i*.9,.32,1,3)}liquid(t,e,i,n,r,a,o=2.5,l=.035,c=.5){for(let u=0;u<i;u++)De.set(e.x+(Math.random()-.5)*c,e.y+(Math.random()-.5)*c,e.z+(Math.random()-.5)*c).normalize().multiplyScalar(o*(.5+Math.random()*.7)),this.norm.spawn(t,De,.6+Math.random()*.6,l,l*.7,n,r,a,.85,9.8,.2,0)}blood(t,e,i=10,n=!1){this.liquid(t,e,i,.32,.03,.02,n?3.5:2.2,n?.06:.045,.9);for(let r=0;r<3;r++)this.norm.spawn(t,De.set((Math.random()-.5)*.4,.2,(Math.random()-.5)*.4),.5,.06,.2,.25,.02,.02,.5,0,2)}smoke(t,e,i,n,r,a=.3,o=.4){for(let l=0;l<e;l++)De.set((Math.random()-.5)*a,o*(.5+Math.random()),(Math.random()-.5)*a),this.smokeP.spawn(t,De,r*(.7+Math.random()*.6),n*.4,n,i,i,i*1.02,.45,-.02,.8)}cloud(t,e,i){for(let n=0;n<i;n++)De.set(e.x*3+(Math.random()-.5)*2.5,e.y*3+Math.random()*1,e.z*3+(Math.random()-.5)*2.5),this.smokeP.spawn(t,De,3.5+Math.random()*2,.4,1.9,.93,.94,.96,.55,-.05,1.3)}debris(t,e,i,n,r=2.5,a=0,o){const l=i instanceof Nt?i:new Nt(i);for(let c=0;c<e;c++){De.set((Math.random()-.5)*2,Math.random()*1.2+.3,(Math.random()-.5)*2),o&&De.add(o),De.normalize().multiplyScalar(r*(.4+Math.random()*.8));const u=n*(.5+Math.random());this.debrisPool.spawn(t,De,da.set(u,u*(.4+Math.random()*.8),u*(.6+Math.random()*.6)),l,a)}}shards(t,e,i,n=0,r,a=.3,o=.3,l){for(let c=0;c<e;c++){const u=(Math.random()-.5)*a,f=(Math.random()-.5)*o,h=De.copy(t);l?(h.x+=l.x*u,h.z+=l.z*u):h.x+=u,h.y+=f;const d=new T((Math.random()-.5)*1.5,Math.random()*1,(Math.random()-.5)*1.5);r&&d.addScaledVector(r,1+Math.random());const g=i*(.4+Math.random());this.glassPool.spawn(h,d,da.set(g,g*(.6+Math.random()),.006),new Nt(1,1,1),n)}}papers(t,e,i,n=0){for(let r=0;r<e;r++)De.set(i.x*2+(Math.random()-.5)*1.5,1+Math.random()*1.5,i.z*2+(Math.random()-.5)*1.5),this.paperPool.spawn(t,De,da.set(.21,.004,.29),new Nt(1,1,1),n,40,1)}decal(t,e,i,n=.07){let r;this.decals.length<160?(r=new Vt(this.decalGeo,this.decalMat),r.renderOrder=2,this.decals.push(r)):(r=this.decals[this.decalHead],this.decalHead=(this.decalHead+1)%this.decals.length),r.removeFromParent(),r.position.copy(e).addScaledVector(i,.004),r.lookAt(De.copy(e).add(i)),r.rotateZ(Math.random()*6),r.scale.setScalar(n*(.8+Math.random()*.4)),t.updateMatrixWorld(),t.attach(r),r.raycast=()=>{}}puddle(t,e,i,n,r=.75){const a=new Vt(new _e(1,1),new Jt({color:e,alphaMap:Hx(),transparent:!0,opacity:r,shininess:140,specular:11193599,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2}));a.rotation.x=-Math.PI/2,a.rotation.z=Math.random()*6,a.position.set(t.x,t.y+.004+this.puddles.length*4e-4,t.z),a.scale.setScalar(.01),a.raycast=()=>{},this.group.add(a);const o={mesh:a,r:.05,max:i,rate:n};return this.puddles.push(o),o}arc(t,e,i=.12){const r=new Float32Array(60),a=new Ne;a.setAttribute("position",new Ue(r,3));const o=new yd(a,this.arcMat);o.frustumCulled=!1,this.group.add(o),this.arcs.push({line:o,life:i,a:t.clone(),b:e.clone()}),this.jag(o,t,e)}jag(t,e,i){const n=t.geometry.attributes.position.array,r=n.length/6;let a=e.clone();for(let o=1;o<=r;o++){const l=o/r,c=new T().lerpVectors(e,i,l);o<r&&c.add(De.set((Math.random()-.5)*.3,(Math.random()-.5)*.3,(Math.random()-.5)*.3)),n.set([a.x,a.y,a.z,c.x,c.y,c.z],(o-1)*6),a=c}t.geometry.attributes.position.needsUpdate=!0}update(t){this.add.update(t),this.norm.update(t),this.smokeP.update(t),this.debrisPool.update(t),this.glassPool.update(t),this.paperPool.update(t);for(const e of this.puddles)e.r<e.max&&(e.r=Math.min(e.max,e.r+e.rate*t),e.mesh.scale.setScalar(e.r*2));for(let e=this.arcs.length-1;e>=0;e--){const i=this.arcs[e];if(i.life-=t,i.life<=0){i.line.removeFromParent(),i.line.geometry.dispose(),this.arcs.splice(e,1);continue}this.jag(i.line,i.a,i.b)}for(const e of this.flashes)e.life>0&&(e.life-=t,e.m.material.opacity=Math.max(0,e.life/e.max),e.life<=0&&(e.m.visible=!1))}clear(){this.add.clear(),this.norm.clear(),this.smokeP.clear(),this.debrisPool.clear(),this.glassPool.clear(),this.paperPool.clear();for(const t of this.decals)t.removeFromParent();this.decals.length=0,this.decalHead=0;for(const t of this.puddles)t.mesh.removeFromParent(),t.mesh.geometry.dispose(),t.mesh.material.dispose();this.puddles.length=0;for(const t of this.arcs)t.line.removeFromParent();this.arcs.length=0}}class Xx{ctx=null;master;sfxBus;musicBus;ambBus;noise;started=!1;leakGain=null;leakTarget=0;humGain=null;rainGain=null;elevGain=null;buzzGain=null;musicMode="off";nextNoteTime=0;seq=0;lastAmbient=0;muted=!1;unlock(){if(!this.ctx){const t=window.AudioContext||window.webkitAudioContext;if(!t)return;const e=new t;this.ctx=e,this.master=e.createGain(),this.master.gain.value=.8;const i=e.createDynamicsCompressor();i.threshold.value=-14,i.ratio.value=4,this.master.connect(i),i.connect(e.destination),this.sfxBus=e.createGain(),this.sfxBus.connect(this.master),this.musicBus=e.createGain(),this.musicBus.gain.value=.5,this.musicBus.connect(this.master),this.ambBus=e.createGain(),this.ambBus.gain.value=.6,this.ambBus.connect(this.master);const n=e.sampleRate*2;this.noise=e.createBuffer(1,n,e.sampleRate);const r=this.noise.getChannelData(0);for(let a=0;a<n;a++)r[a]=Math.random()*2-1;this.startLoops()}this.ctx.state==="suspended"&&this.ctx.resume(),this.started=!0}get t(){return this.ctx?this.ctx.currentTime:0}noiseSrc(t=!1){const e=this.ctx.createBufferSource();return e.buffer=this.noise,e.loop=t,e.playbackRate.value=.9+Math.random()*.2,e}env(t,e,i,n,r){t.gain.setValueAtTime(1e-4,e),t.gain.linearRampToValueAtTime(n,e+i),t.gain.exponentialRampToValueAtTime(1e-4,e+i+r)}noiseHit(t,e,i,n,r,a=0,o){const l=this.ctx,c=l.currentTime+a,u=this.noiseSrc(),f=l.createBiquadFilter();f.type=t,f.frequency.value=e,f.Q.value=i;const h=l.createGain();return this.env(h,c,.002,n,r),u.connect(f),f.connect(h),h.connect(o??this.sfxBus),u.start(c,Math.random()*1.5),u.stop(c+r+.05),f}tone(t,e,i,n,r,a=0,o,l=.003){const c=this.ctx,u=c.currentTime+a,f=c.createOscillator();f.type=t,f.frequency.setValueAtTime(e,u),i!==e&&f.frequency.exponentialRampToValueAtTime(Math.max(1,i),u+r);const h=c.createGain();return this.env(h,u,l,n,r),f.connect(h),h.connect(o??this.sfxBus),f.start(u),f.stop(u+l+r+.05),f}ok(){return!!this.ctx&&this.started}shot(){this.ok()&&(this.noiseHit("lowpass",3200,.7,.9,.16),this.noiseHit("bandpass",1200,1.2,.5,.08),this.tone("sine",150,45,.9,.18),this.tone("square",900,120,.12,.05))}dryFire(){this.ok()&&(this.tone("square",2200,1800,.12,.02),this.noiseHit("highpass",4e3,1,.2,.03))}reload(){this.ok()&&(this.noiseHit("bandpass",2500,4,.5,.04),this.tone("square",600,300,.1,.05,.08),this.noiseHit("bandpass",3500,5,.6,.05,.16),this.tone("triangle",880,880,.15,.08,.2),this.tone("triangle",1320,1320,.12,.1,.27))}flesh(t=!1){this.ok()&&(this.noiseHit("lowpass",t?1400:700,2,.7,t?.18:.12),this.tone("sine",t?220:120,50,.5,.12),t&&this.noiseHit("bandpass",2500,3,.35,.1,.03))}ricochet(){this.ok()&&(this.tone("sine",2400+Math.random()*1500,900,.08,.25),this.noiseHit("highpass",3e3,1,.25,.05))}thud(){this.ok()&&(this.tone("sine",110,40,.5,.18),this.noiseHit("lowpass",400,1,.4,.1))}metal(){if(!this.ok())return;const t=300+Math.random()*200;for(const e of[1,2.76,5.4,8.9])this.tone("sine",t*e,t*e*.98,.18/e**.5,.5/e**.3);this.noiseHit("highpass",2e3,1,.3,.04)}glass(t=!1){if(!this.ok())return;this.noiseHit("highpass",3e3,.8,t?.9:.5,t?.5:.25);const e=t?14:6;for(let i=0;i<e;i++)this.tone("sine",2500+Math.random()*5e3,2e3+Math.random()*3e3,.08,.08+Math.random()*.25,Math.random()*(t?.5:.2))}crack(){this.ok()&&(this.noiseHit("highpass",2500,1,.5,.08),this.tone("sine",3800,2600,.1,.12))}ceramic(){if(this.ok()){for(let t=0;t<5;t++)this.tone("sine",1800+Math.random()*2500,1500,.12,.1+Math.random()*.15,Math.random()*.08);this.noiseHit("bandpass",4e3,1,.4,.08)}}plastic(){this.ok()&&(this.noiseHit("bandpass",1800,2,.5,.06),this.tone("square",500,200,.08,.06))}sparks(){if(this.ok()){for(let t=0;t<7;t++)this.noiseHit("highpass",5e3,1,.25+Math.random()*.2,.015,Math.random()*.35);this.tone("sawtooth",120,118,.06,.3)}}zap(){if(!this.ok())return;const t=this.ctx,e=t.currentTime,i=t.createOscillator();i.type="sawtooth",i.frequency.value=90;const n=t.createOscillator();n.frequency.value=37;const r=t.createGain();r.gain.value=60,n.connect(r),r.connect(i.frequency);const a=t.createGain();this.env(a,e,.01,.35,.9),i.connect(a),a.connect(this.sfxBus),i.start(e),i.stop(e+1),n.start(e),n.stop(e+1);for(let o=0;o<12;o++)this.noiseHit("highpass",4e3,1,.3,.02,Math.random()*.8)}splash(t=!1){this.ok()&&(this.noiseHit("lowpass",t?1200:2200,1,t?.8:.4,t?.6:.25),this.noiseHit("bandpass",600,2,.4,.3,.05))}puncture(){this.ok()&&(this.tone("sine",700,300,.25,.08),this.noiseHit("bandpass",1500,3,.5,.12))}whoosh(){if(!this.ok())return;const t=this.noiseHit("bandpass",800,.8,.8,1.6);t.frequency.setValueAtTime(400,this.t),t.frequency.linearRampToValueAtTime(3e3,this.t+.4),t.frequency.linearRampToValueAtTime(1200,this.t+1.5)}clunk(){this.ok()&&(this.tone("sine",180,80,.4,.15),this.noiseHit("lowpass",900,1,.3,.08))}paper(){if(this.ok())for(let t=0;t<4;t++)this.noiseHit("highpass",2500,.7,.18,.06,t*.07)}ring(){if(this.ok())for(let t=0;t<2;t++)for(let e=0;e<10;e++)this.tone("sine",440,440,.035,.05,t*.45+e*.04,this.ambBus),this.tone("sine",480,480,.035,.05,t*.45+e*.04+.02,this.ambBus)}typing(){if(this.ok())for(let t=0;t<9;t++)this.noiseHit("bandpass",3e3+Math.random()*2e3,4,.06,.02,t*(.07+Math.random()*.08),this.ambBus)}printer(){if(this.ok())for(let t=0;t<6;t++)this.noiseHit("bandpass",900,6,.08,.12,t*.16,this.ambBus)}tick(){this.ok()&&this.noiseHit("bandpass",5e3,8,.08,.015,0,this.ambBus)}groan(t=1,e=.5){if(!this.ok())return;const i=this.ctx,n=i.currentTime,r=.8+Math.random()*.8,a=i.createOscillator();a.type="sawtooth";const o=(70+Math.random()*40)*t;a.frequency.setValueAtTime(o,n),a.frequency.linearRampToValueAtTime(o*(.7+Math.random()*.5),n+r);const l=i.createOscillator();l.frequency.value=5+Math.random()*4;const c=i.createGain();c.gain.value=o*.06,l.connect(c),c.connect(a.frequency);const u=i.createGain();u.gain.setValueAtTime(1e-4,n),u.gain.linearRampToValueAtTime(e*.35,n+.15),u.gain.linearRampToValueAtTime(1e-4,n+r);const f=i.createBiquadFilter();f.type="bandpass",f.frequency.value=500+Math.random()*300,f.Q.value=5;const h=i.createBiquadFilter();h.type="bandpass",h.frequency.value=1100+Math.random()*400,h.Q.value=6,a.connect(f),a.connect(h),f.connect(u),h.connect(u),u.connect(this.sfxBus),a.start(n),a.stop(n+r+.1),l.start(n),l.stop(n+r+.1)}screech(){this.ok()&&(this.groan(2.6,.7),this.noiseHit("bandpass",1800,3,.25,.4))}swipe(){if(!this.ok())return;this.noiseHit("bandpass",1500,1,.6,.25).frequency.linearRampToValueAtTime(400,this.t+.25)}hurt(){this.ok()&&(this.tone("square",220,70,.35,.35),this.noiseHit("lowpass",600,1,.6,.3))}step(){this.ok()&&this.noiseHit("lowpass",250,1,.15,.06)}roar(){if(this.ok()){for(let t=0;t<3;t++)this.groan(.55+t*.12,1);this.noiseHit("lowpass",500,1,.7,1.2),this.tone("sawtooth",60,35,.5,1.4)}}blip(t=0){this.ok()&&this.tone("square",880*Math.pow(1.122,t),880*Math.pow(1.122,t),.08,.07)}coin(){this.ok()&&(this.tone("square",988,988,.12,.08),this.tone("square",1319,1319,.12,.3,.08))}combo(t){if(!this.ok())return;const e=523*Math.pow(1.06,Math.min(t,16));[1,1.26,1.5].forEach((i,n)=>this.tone("square",e*i,e*i,.07,.06,n*.05))}bonus(){this.ok()&&[523,659,784,1047,1319].forEach((t,e)=>this.tone("square",t,t,.1,.1,e*.06))}pickup(){this.ok()&&[659,880,1175,1568].forEach((t,e)=>this.tone("triangle",t,t,.16,.14,e*.07))}warning(){if(this.ok())for(let t=0;t<3;t++)this.tone("square",740,740,.12,.12,t*.22)}ding(){this.ok()&&(this.tone("sine",1318,1318,.3,1.4),this.tone("sine",1046,1046,.3,1.6,.35))}doors(){if(!this.ok())return;this.noiseHit("lowpass",500,1,.3,1.2).frequency.linearRampToValueAtTime(900,this.t+1),this.tone("sine",70,60,.15,1.1)}gameOver(){this.ok()&&[392,330,262,196].forEach((t,e)=>this.tone("square",t,t*.98,.14,.4,e*.3))}fanfare(){this.ok()&&[523,523,523,659,784,659,784,1047].forEach((t,e)=>this.tone("square",t,t,.12,.2,e*.14))}thunder(){this.ok()&&(this.noiseHit("lowpass",200,.7,.9,2.8),this.noiseHit("lowpass",500,.7,.4,.6,.1))}loopNoise(t,e,i,n,r){const a=this.ctx,o=this.noiseSrc(!0);o.playbackRate.value=1;const l=a.createBiquadFilter();l.type=t,l.frequency.value=e,l.Q.value=i;const c=a.createGain();return c.gain.value=n,o.connect(l),l.connect(c),c.connect(r),o.start(),c}startLoops(){const t=this.ctx;this.humGain=this.loopNoise("lowpass",140,.7,.35,this.ambBus),this.rainGain=this.loopNoise("highpass",1500,.5,.05,this.ambBus),this.leakGain=this.loopNoise("bandpass",2600,1.5,0,this.sfxBus),this.elevGain=this.loopNoise("lowpass",120,2,0,this.sfxBus);const e=t.createOscillator();e.frequency.value=55,e.type="triangle",e.connect(this.elevGain),e.start();const i=t.createOscillator();i.type="square",i.frequency.value=120;const n=t.createBiquadFilter();n.type="bandpass",n.frequency.value=240,n.Q.value=8,this.buzzGain=t.createGain(),this.buzzGain.gain.value=.012,i.connect(n),n.connect(this.buzzGain),this.buzzGain.connect(this.ambBus),i.start()}setLeak(t){this.leakTarget=Math.min(.35,t*.12)}setElevator(t){this.elevGain&&this.ctx&&this.elevGain.gain.setTargetAtTime(t?.45:0,this.t,.3)}setRain(t){this.rainGain&&this.ctx&&this.rainGain.gain.setTargetAtTime(t,this.t,.5)}setAmbience(t){this.ambBus&&this.ctx&&this.ambBus.gain.setTargetAtTime(t,this.t,.4)}setMuted(t){this.muted=t,this.master&&this.ctx&&this.master.gain.setTargetAtTime(t?0:.8,this.t,.05)}setMusic(t){t!==this.musicMode&&(this.musicMode=t,this.seq=0,this.ctx&&(this.nextNoteTime=this.ctx.currentTime+.05))}update(t,e){if(!this.ok())return;const i=this.ctx;if(this.leakGain&&this.leakGain.gain.setTargetAtTime(this.leakTarget,i.currentTime,.2),this.lastAmbient-=t,this.lastAmbient<=0&&e>0){this.lastAmbient=2.5+Math.random()*5;const a=Math.random();a<.35?this.typing():a<.55?this.ring():a<.75?this.printer():this.groan(.8+Math.random()*.4,.25)}if(this.musicMode==="off")return;const r=60/(this.musicMode==="boss"?150:this.musicMode==="combat"?132:this.musicMode==="muzak"?104:this.musicMode==="victory"?120:84)/4;for(this.nextNoteTime<i.currentTime-.3&&(this.nextNoteTime=i.currentTime+.05);this.nextNoteTime<i.currentTime+.15;)this.playStep(this.seq,this.nextNoteTime,r),this.nextNoteTime+=r,this.seq++}n(t,e,i,n,r,a=0){const o=this.ctx,l=o.createOscillator();l.type=e,l.frequency.value=i;const c=o.createGain();if(c.gain.setValueAtTime(1e-4,t),c.gain.linearRampToValueAtTime(r,t+.01),c.gain.exponentialRampToValueAtTime(1e-4,t+n),a){const u=o.createBiquadFilter();u.type="lowpass",u.frequency.value=a,u.Q.value=6,l.connect(u),u.connect(c)}else l.connect(c);c.connect(this.musicBus),l.start(t),l.stop(t+n+.05)}drum(t,e,i=1){const n=this.ctx;if(e==="k"){const r=n.createOscillator();r.frequency.setValueAtTime(140,t),r.frequency.exponentialRampToValueAtTime(40,t+.15);const a=n.createGain();a.gain.setValueAtTime(.7*i,t),a.gain.exponentialRampToValueAtTime(1e-4,t+.25),r.connect(a),a.connect(this.musicBus),r.start(t),r.stop(t+.3)}else{const r=this.noiseSrc(),a=n.createBiquadFilter();a.type=e==="s"?"bandpass":"highpass",a.frequency.value=e==="s"?1800:7e3;const o=n.createGain(),l=e==="s"?.18:.04;o.gain.setValueAtTime((e==="s"?.45:.15)*i,t),o.gain.exponentialRampToValueAtTime(1e-4,t+l),r.connect(a),a.connect(o),o.connect(this.musicBus),r.start(t,Math.random()),r.stop(t+l+.02)}}playStep(t,e,i){const n=this.musicMode,r=l=>440*Math.pow(2,(l-69)/12),a=Math.floor(t/16)%4,o=t%16;if(n==="tense")o===0&&this.n(e,"sawtooth",r([33,33,34,32][a]),i*15,.12,300),o===8&&a%2===1&&this.n(e,"sine",r(81+(a===3?1:0)),i*6,.03),o%8===4&&this.drum(e,"h",.4);else if(n==="combat"||n==="boss"){const c=(n==="boss"?[38,38,41,36]:[33,33,36,31])[a];o%4===0&&this.drum(e,"k"),o%8===4&&this.drum(e,"s"),o%2===0&&this.drum(e,"h",o%4===2?1:.5),n==="boss"&&o%4===2&&this.drum(e,"k",.6);const u=[0,0,12,0,0,0,10,0,0,0,12,0,7,0,10,0];this.n(e,"sawtooth",r(c+u[o]),i*.9,.14,700);const f=[0,3,7,10,12,10,7,3];o%2===0&&this.n(e,"square",r(c+36+f[o/2%8]+(a===3?-2:0)),i*1.6,.035,2600),o===0&&a===0&&this.n(e,"sawtooth",r(c+24),i*30,.05,1200)}else if(n==="muzak"){const c=[[60,64,67,71],[57,60,64,67],[62,65,69,72],[55,59,62,65]][a];(o===0||o===6||o===10)&&c.forEach(f=>this.n(e,"sine",r(f),i*4,.05)),(o===0||o===8)&&this.n(e,"triangle",r(c[0]-24),i*6,.12),(o===3||o===11)&&this.n(e,"triangle",r(c[2]-24),i*3,.08),o%2===0&&this.drum(e,"h",.25);const u=[76,0,74,72,0,71,0,0,74,0,72,0,71,69,0,0];u[o]&&a%2===0&&this.n(e,"sine",r(u[o]+(a===2?-3:0)),i*2.5,.06)}else if(n==="title"){const l=[45,45,43,41][a];o%4===0&&this.n(e,"sawtooth",r(l-12),i*3.5,.09,500);const c=[0,3,7,12,7,3,0,3,7,12,15,12,7,3,7,10];this.n(e,"square",r(l+24+c[o]),i*.8,.03,1800),o%8===0&&this.drum(e,"k",.7)}else if(n==="victory"){const l=[48,53,55,48][a];o%4===0&&this.drum(e,"k",.7),o%8===4&&this.drum(e,"s",.6),[0,4,7].forEach(c=>{(o===0||o===8)&&this.n(e,"square",r(l+12+c),i*6,.03,2500)}),o%2===0&&this.n(e,"triangle",r(l+24+[0,4,7,12,7,4,7,12][o/2%8]),i*1.5,.05)}}}const H=new Xx;function pa(s,t=!1){const e=s[0].index!==null,i=new Set(Object.keys(s[0].attributes)),n=new Set(Object.keys(s[0].morphAttributes)),r={},a={},o=s[0].morphTargetsRelative,l=new Ne;let c=0;for(let u=0;u<s.length;++u){const f=s[u];let h=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in f.attributes){if(!i.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(f.attributes[d]),h++}if(h!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in f.morphAttributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(f.morphAttributes[d])}if(t){let d;if(e)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,u),c+=d}}if(e){let u=0;const f=[];for(let h=0;h<s.length;++h){const d=s[h].index;for(let g=0;g<d.count;++g)f.push(d.getX(g)+u);u+=s[h].attributes.position.count}l.setIndex(f)}for(const u in r){const f=Ph(r[u]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,f)}for(const u in a){const f=a[u][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let h=0;h<f;++h){const d=[];for(let y=0;y<a[u].length;++y)d.push(a[u][y][h]);const g=Ph(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(g)}}}return l}function Ph(s){let t,e,i,n=-1,r=0;for(let c=0;c<s.length;++c){const u=s[c];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=u.normalized),i!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(n===-1&&(n=u.gpuType),n!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}const a=new t(r),o=new Ue(a,e,i);let l=0;for(let c=0;c<s.length;++c){const u=s[c];if(u.isInterleavedBufferAttribute){const f=l/e;for(let h=0,d=u.count;h<d;h++)for(let g=0;g<e;g++){const y=u.getComponent(h,g);o.setComponent(h+f,g,y)}}else a.set(u.array,l);l+=u.count*e}return n!==void 0&&(o.gpuType=n),o}const bt={ctx:null,root:null,zombies:(()=>[]),heal:(()=>{}),props:[]},Ae=new T,Qi=new T,Su=new T,wu=new T(0,1,0),Yx=new T,st={plastic:new te({color:2763568}),plasticL:new te({color:13223612}),white:new te({color:15132384}),metal:new Jt({color:8225416,shininess:60,specular:6710886}),darkMetal:new Jt({color:3816770,shininess:40,specular:4473924}),red:new Jt({color:11538448,shininess:80,specular:8930372}),black:new te({color:789518}),jug:new Jt({color:7321599,transparent:!0,opacity:.38,shininess:120,specular:16777215,depthWrite:!1}),water:new Jt({color:2785248,transparent:!0,opacity:.6,shininess:100,depthWrite:!1}),ceramic:new Jt({color:15789284,shininess:70}),coffee:new te({color:2758154}),bulb:new Wt({color:16773576}),bulbOff:new te({color:5591884}),panelOn:new Wt({color:15266047}),glass:new Jt({color:10471648,transparent:!0,opacity:.16,shininess:150,specular:16777215,depthWrite:!1,side:Ui}),crack:new Wt({map:Bx(),transparent:!0,depthWrite:!1,opacity:.9,polygonOffset:!0,polygonOffsetFactor:-3}),poolWarm:new Wt({map:lr(),color:5917232,blending:Oi,transparent:!0,depthWrite:!1}),poolCool:new Wt({map:lr(),color:3424334,blending:Oi,transparent:!0,depthWrite:!1}),leaf:new te({color:2972202}),pot:new te({color:3814448}),marble:new Jt({color:15262940,shininess:60}),bronze:new Jt({color:9071162,shininess:90,specular:16765072}),gold:new Jt({color:13148224,shininess:110,specular:16769184}),wood:new te({color:4861984}),vendGlow:new Wt({color:12576511}),greenBox:new Wt({color:2162528})},et={box:new Yt(1,1,1),cyl:new Nn(1,1,1,14),cyl8:new Nn(1,1,1,8),plane:new _e(1,1),sphere:new Bs(1,12,8),circle:new pr(1,20),cone:new Wl(1,1,6),torus:new La(1,.35,8,16),ico:new Yl(1,0)};et.box.translate(0,0,0);function it(s,t,e,i,n,r,a,o,l){const c=new Vt(s,t);return c.scale.set(e,i,n),c.position.set(r,a,o),l.add(c),c}class Ci{constructor(t,e,i,n,r=!1){this.obj=t,this.ground=e,this.lift=i,this.onLand=n,this.roll=r,bt.root.attach(t)}obj;ground;lift;onLand;roll;v=new T;w=new T;alive=!0;landed=!1;t=0;update(t){if(this.alive){if(this.t+=t,this.roll){this.obj.position.addScaledVector(this.v,t),this.v.multiplyScalar(Math.max(0,1-t*1.8)),this.obj.rotation.y+=this.w.y*t,this.w.y*=Math.max(0,1-t*2),this.v.lengthSq()<.001&&Math.abs(this.w.y)<.05&&(this.alive=!1);return}this.v.y-=9.8*t,this.obj.position.addScaledVector(this.v,t),this.obj.rotation.x+=this.w.x*t,this.obj.rotation.y+=this.w.y*t,this.obj.rotation.z+=this.w.z*t,this.obj.position.y<this.ground+this.lift&&(this.obj.position.y=this.ground+this.lift,this.landed||(this.landed=!0,this.onLand&&this.onLand(this)),Math.abs(this.v.y)>1.5?(this.v.y*=-.25,this.v.x*=.5,this.v.z*=.5,this.w.multiplyScalar(.4)):this.alive=!1)}}}const je=[];class Re{group=new pe;hp=1;hits=0;destroyed=!1;kind="prop";constructor(t,e,i,n=0){this.group.position.set(t,e,i),this.group.rotation.y=n,bt.root.add(this.group),bt.props.push(this)}tag(t,e="main"){return t.userData.prop=this,t.userData.part=e,t}update(t){}get world(){return this.group.getWorldPosition(Su)}ground(){return 0}}function Fn(s,t,e,i=.06){bt.ctx.fx.decal(s,t,e,i)}class Jn extends Re{screen;body;state=0;flick=0;kindIx;matOn;matCrack;matDead;glow;constructor(t,e,i,n,r=!1){super(t,e,i,n),this.kind="monitor",this.hp=3,this.kindIx=Math.floor(Math.random()*4),this.matOn=new Wt({map:To(this.kindIx,0),color:13162728}),this.matCrack=new Wt({map:To(this.kindIx,1),color:13162728}),this.matDead=new Wt({map:To(this.kindIx,2)});const a=r?1.4:1;this.body=new pe,this.group.add(this.body),this.tag(it(et.box,st.plastic,.22*a,.015,.16*a,0,.008,0,this.body)),this.tag(it(et.box,st.plastic,.04,.16*a,.03,0,.09*a,-.02,this.body)),this.tag(it(et.box,st.plastic,.56*a,.36*a,.035,0,.3*a,0,this.body)),this.screen=this.tag(it(et.plane,this.matOn,.52*a,.32*a,1,0,.3*a,.019,this.body),"screen"),this.glow=it(et.plane,st.poolCool,.9*a,.6*a,1,0,.3*a,.03,this.body),this.glow.raycast=()=>{}}hit(t,e,i,n){this.hits++;const r=bt.ctx.fx;if(r.sparks(e,i,16),H.glass(!1),H.sparks(),this.state===0)return this.state=1,this.screen.material=this.matCrack,this.flick=.6,{pts:50,label:"SCREEN CRACKED"};if(this.state===1)return this.state=2,this.screen.material=this.matDead,this.glow.visible=!1,r.smoke(e,4,.25,.25,2.5),{pts:50,label:"BLUE SCREEN"};if(this.state===2){this.state=3;const a=new Ci(this.body,this.group.position.y,.05,()=>{H.plastic(),r.debris(this.body.position,5,2763568,.04,1.5,this.group.position.y)});return a.v.set(n.x*1.5,1.2,n.z*1.5),a.w.set(-3-Math.random()*3,(Math.random()-.5)*2,0),je.push(a),{pts:75,label:"HARDWARE FAILURE"}}return Fn(this.body,e,i,.04),{pts:10}}update(t){this.state===1&&(this.flick-=t,this.flick>0||Math.random()<.04?this.screen.material=Math.random()<.5?this.matDead:this.matCrack:this.screen.material=this.matCrack)}}class fn extends Re{jug;water;level=1;leaks=[];detached=!1;puddle=null;hazard=null;spillT=0;jugBody=null;emitAcc=0;constructor(t,e,i){super(t,0,e,i),this.kind="cooler",this.hp=99,this.tag(it(et.box,st.white,.34,.95,.34,0,.475,0,this.group),"base"),it(et.box,st.plasticL,.3,.06,.02,0,.75,.171,this.group),it(et.box,st.red,.03,.04,.04,-.06,.72,.18,this.group),it(et.box,new te({color:2117824}),.03,.04,.04,.06,.72,.18,this.group),it(et.box,st.darkMetal,.2,.02,.1,0,.6,.16,this.group),this.jug=new pe,this.jug.position.set(0,.95,0),this.group.add(this.jug),this.tag(it(et.cyl,st.jug,.05,.08,.05,0,.04,0,this.jug),"jug"),this.tag(it(et.cyl,st.jug,.155,.38,.155,0,.27,0,this.jug),"jug"),this.tag(it(et.sphere,st.jug,.155,.06,.155,0,.46,0,this.jug),"jug"),this.water=it(et.cyl,st.water,.145,1,.145,0,.08,0,this.jug),this.water.geometry=et.cyl,this.water.raycast=()=>{},this.setLevel(1)}setLevel(t){this.level=Math.max(0,t);const e=.4*this.level+.001;this.water.scale.y=e,this.water.position.y=.08+e/2-.02,this.water.visible=this.level>.01}hit(t,e,i,n){this.hits++;const r=bt.ctx.fx;if(t==="base")return Fn(this.group,e,i,.04),H.plastic(),r.debris(e,3,15132384,.03,1.5),{pts:10};if(this.detached)return H.puncture(),r.liquid(e,i,10,.75,.88,1,2,.03),{pts:10};H.puncture(),H.splash(!1);const a=this.jug.worldToLocal(e.clone());Fn(this.jug,e,i,.035);const o=i.clone().transformDirection(new Bt().copy(this.jug.matrixWorld).invert()).setY(0).normalize();if(this.leaks.push({pos:a,n:o,h:a.y}),r.liquid(e,i,22,.75,.88,1,3,.035,.6),!this.puddle){const l=this.group.localToWorld(new T(0,0,.45));this.puddle=r.puddle(l,5933744,.9,.06,.55),this.hazard={kind:"puddle",pos:l,radius:.5,until:1e9,puddle:this.puddle},bt.ctx.hazards.push(this.hazard)}return this.leaks.length>=3?(this.dislodge(n),{pts:200,label:"REFRESHING!",color:"#6fd8ff"}):{pts:60,label:this.leaks.length===1?"LEAK!":void 0,color:"#6fd8ff"}}dislodge(t){this.detached=!0,H.plastic();const e=new Ci(this.jug,0,.16,()=>{H.splash(!0),H.thud();const i=this.jug.position.clone();bt.ctx.fx.liquid(i.clone().setY(.15),wu,70,.7,.85,1,3.5,.045,1.6);const n=bt.ctx.fx.puddle(i,5933744,1.7+this.level,1.2,.6);bt.ctx.hazards.push({kind:"puddle",pos:i.clone(),radius:1.5,until:1e9,puddle:n}),this.spillT=2.5*this.level,this.setLevel(this.level*.15)});e.v.set(t.x*1.2+(Math.random()-.5),1.8,t.z*1.2+(Math.random()-.5)),e.w.set(-4-Math.random()*2,(Math.random()-.5)*3,(Math.random()-.5)*3),je.push(e),this.jugBody=e,this.leaks.length=0}update(t){const e=bt.ctx.fx;let i=0;if(!this.detached&&this.leaks.length&&this.level>0){this.jug.updateMatrixWorld();const n=.08+.4*this.level;this.emitAcc+=t*40;for(const r of this.leaks){const a=n-r.h;if(a<=0)continue;i++;const o=Math.min(4,Math.floor(this.emitAcc/this.leaks.length)),l=this.jug.localToWorld(Ae.copy(r.pos)),c=Qi.copy(r.n).transformDirection(this.jug.matrixWorld),u=.8+Math.sqrt(a)*3;for(let f=0;f<o;f++)e.norm.spawn(l,Su.copy(c).multiplyScalar(u*(.85+Math.random()*.3)).add(Yx.set((Math.random()-.5)*.15,(Math.random()-.3)*.2,(Math.random()-.5)*.15)),1.2,.035,.026,.72,.86,1,.85,9.8,.05,0);this.setLevel(this.level-t*.012*Math.sqrt(a)*10/1.5)}this.emitAcc>4&&(this.emitAcc=0),this.puddle&&(this.puddle.max=Math.min(1.4,this.puddle.max+t*.05))}if(this.detached&&this.spillT>0&&this.jugBody&&!this.jugBody.alive){this.spillT-=t,i++;const n=this.jug.localToWorld(Ae.set(0,0,0));e.norm.spawn(n.setY(.12),Qi.set((Math.random()-.5)*.6,.4,(Math.random()-.5)*.6),.5,.04,.03,.72,.86,1,.8,4,.5,0)}fn.activeLeaks+=i}static activeLeaks=0}class Eu extends Re{pane;frame;w;h;broken=!1;constructor(t,e,i,n,r=2.6,a=0){super(t,a,e,i),this.kind="glass",this.hp=2,this.w=n,this.h=r,this.frame=new pe,this.group.add(this.frame),this.pane=this.tag(it(et.box,st.glass,n,r,.02,0,r/2,0,this.group),"pane"),this.pane.renderOrder=3,it(et.box,st.darkMetal,n,.05,.06,0,.025,0,this.frame),it(et.box,st.darkMetal,n,.05,.06,0,r-.025,0,this.frame),it(et.box,st.darkMetal,.04,r,.06,n/2,r/2,0,this.frame),it(et.box,new te({color:14214380,transparent:!0,opacity:.25,depthWrite:!1}),n-.04,.12,.024,0,1.25,0,this.group).raycast=()=>{}}hit(t,e,i,n){if(this.broken)return{pts:0};if(this.hits++,this.hits===1){H.crack();const r=it(et.plane,st.crack,.9,.9,1,0,0,0,this.group);return r.position.copy(this.group.worldToLocal(e.clone())),r.position.z=i.dot(Ae.set(0,0,1).applyQuaternion(this.group.quaternion))>0?.012:-.012,r.rotation.y=r.position.z>0?0:Math.PI,r.rotation.z=Math.random()*6,r.raycast=()=>{},bt.ctx.fx.shards(e,4,.04,0,n.clone().multiplyScalar(.5)),{pts:25}}return this.shatter(n),{pts:100,label:"SHATTERED!",color:"#bfe8ff"}}shatter(t){if(this.broken)return;this.broken=!0,H.glass(!0),this.group.children.forEach(r=>{r!==this.frame&&(r.visible=!1)}),this.pane.raycast=()=>{};const e=Ae.set(1,0,0).applyQuaternion(this.group.quaternion).clone(),i=this.group.localToWorld(new T(0,this.h/2,0)),n=Math.min(60,Math.floor(this.w*22));bt.ctx.fx.shards(i,n,.12,0,t?t.clone().multiplyScalar(1.2):void 0,this.w,this.h*.9,e)}crosses(t,e){if(this.broken)return!1;const n=this.group.worldToLocal(Ae.copy(t)).clone(),r=this.group.worldToLocal(Qi.copy(e));return Math.sign(n.z)===Math.sign(r.z)?Math.abs(r.z)<.25&&Math.abs(r.x)<this.w/2:Math.abs((n.x+r.x)/2)<this.w/2+.1}}class Tu extends Re{pane;w;h;cracks=0;broken=!1;constructor(t,e,i,n,r,a,o){super(t,e,i,n),this.kind="window",this.w=r,this.h=a,this.pane=this.tag(it(et.plane,o,r,a,1,0,0,0,this.group),"pane")}hit(t,e,i){if(this.broken)return{pts:0};if(this.cracks++,H.crack(),this.cracks<=12){const n=it(et.plane,st.crack,.7,.7,1,0,0,0,this.group);n.position.copy(this.group.worldToLocal(e.clone())),n.position.z=.01,n.rotation.z=Math.random()*6,n.raycast=()=>{}}return bt.ctx.fx.shards(e,3,.03,0,i.clone().multiplyScalar(.4)),{pts:5}}shatter(){if(this.broken)return;this.broken=!0,this.group.visible=!1,H.glass(!0);const t=this.group.getWorldPosition(new T),e=Ae.set(1,0,0).applyQuaternion(this.group.quaternion).clone();bt.ctx.fx.shards(t,70,.14,0,Qi.set(0,0,1).applyQuaternion(this.group.quaternion).multiplyScalar(-1.5).clone(),this.w,this.h,e)}}class $l extends Re{head;bulb;pool;state=0;flick=0;constructor(t,e,i,n){super(t,e,i,n),this.kind="lamp",this.hp=2,this.head=new pe,this.group.add(this.head),this.tag(it(et.cyl,st.darkMetal,.07,.02,.07,0,.01,0,this.head));const r=this.tag(it(et.box,st.darkMetal,.015,.36,.015,0,.18,-.02,this.head));r.rotation.x=.25;const a=this.tag(it(et.cone,st.darkMetal,.08,.12,.08,0,.34,.08,this.head));a.rotation.x=.6,this.bulb=it(et.sphere,st.bulb,.03,.03,.03,0,.3,.11,this.head),this.pool=it(et.plane,st.poolWarm,.7,.7,1,0,.003,.18,this.group),this.pool.rotation.x=-Math.PI/2,this.pool.raycast=()=>{}}hit(t,e,i,n){this.hits++;const r=bt.ctx.fx;if(this.state===0){this.state=1,this.flick=.8,r.sparks(e,i,10),H.metal();const a=new Ci(this.head,this.group.position.y,.03,()=>{H.metal(),this.bulb.material=st.bulbOff,this.pool.visible=!1,r.sparks(this.head.position,wu,8,2)});return a.v.set(n.x*1.5,1.5,n.z*1.5),a.w.set((Math.random()-.5)*8,2,(Math.random()-.5)*8),je.push(a),{pts:30,label:"LIGHTS OUT"}}return this.state===1?(this.state=2,this.head.visible=!1,this.pool.visible=!1,H.glass(!1),r.debris(e,6,3816770,.04,2,this.head.position.y-.03),r.shards(e,5,.03,this.head.position.y-.03),r.sparks(e,i,8),{pts:40}):{pts:0}}update(t){if(this.flick>0){this.flick-=t;const e=Math.random()<.5;this.bulb.material=e?st.bulb:st.bulbOff,this.pool.visible=e,this.flick<=0&&(this.bulb.material=st.bulbOff,this.pool.visible=!1)}}}class hn extends Re{constructor(t,e,i,n,r=""){super(t,e,i,n),this.label=r,this.kind="mug";const a=new Jt({color:[15789284,10493984,2112128,1710618][Math.floor(Math.random()*4)],shininess:70});this.tag(it(et.cyl,a,.04,.1,.04,0,.05,0,this.group)),this.tag(it(et.torus,a,.025,.025,.02,.045,.05,0,this.group)).rotation.y=Math.PI/2,it(et.circle,st.coffee,.035,.035,1,0,.09,0,this.group).rotation.x=-Math.PI/2}label;hit(t,e,i,n){if(this.destroyed)return{pts:0};this.destroyed=!0,this.group.visible=!1;const r=bt.ctx.fx;H.ceramic();const a=this.group.position.y;return r.debris(e,8,15262940,.025,2,a,n.clone().multiplyScalar(.5)),r.liquid(e,Ae.set(n.x,.8,n.z),16,.18,.09,.04,1.8,.03,1),r.puddle(Ae.copy(this.group.position).setY(a),2363914,.22,.4,.9),{pts:50,label:this.label||"COFFEE BREAK!",color:"#d8a060"}}}class gr extends Re{handset;base;state=0;constructor(t,e,i,n){super(t,e,i,n),this.kind="phone",this.base=new pe,this.group.add(this.base),this.tag(it(et.box,st.plastic,.2,.06,.18,0,.03,0,this.base)),it(et.box,st.greenBox,.05,.004,.02,.05,.062,.05,this.base),this.handset=this.tag(it(et.box,st.plastic,.21,.04,.05,0,.08,-.04,this.group),"handset")}hit(t,e,i,n){this.hits++;const r=bt.ctx.fx,a=this.group.position.y;if(this.state===0){this.state=1,H.plastic(),H.ring();const o=new Ci(this.handset,0,.02,()=>H.plastic());o.v.set(n.x*2,2.5,n.z*2),o.w.set(6,3,4),je.push(o);const l=new Ci(this.base,a,0,void 0,!0);return l.v.set(n.x*.8,0,n.z*.8),l.w.y=5,je.push(l),r.debris(e,3,2763568,.02,1.5,a),{pts:50,label:"PLEASE HOLD...",color:"#9fd0ff"}}return this.state===1&&t!=="handset"?(this.state=2,this.base.visible=!1,H.plastic(),r.debris(this.base.position,8,2763568,.035,2,a),r.sparks(e,i,6),{pts:40,label:"CALL DROPPED"}):{pts:5}}}class Sl extends Re{smoking=0;big;smokeAcc=0;light;constructor(t,e,i,n,r=!1){if(super(t,e,i,n),this.kind="printer",this.big=r,r){this.tag(it(et.box,st.plasticL,.9,1,.65,0,.5,0,this.group)),this.tag(it(et.box,st.plastic,.9,.08,.65,0,1.04,0,this.group)),this.tag(it(et.box,st.plasticL,.3,.05,.4,.55,.85,0,this.group)),it(et.box,st.plastic,.3,.12,.02,-.25,.95,.33,this.group),this.light=it(et.box,st.greenBox,.04,.02,.01,-.3,.97,.341,this.group);for(let a=0;a<3;a++)it(et.box,st.darkMetal,.8,.02,.02,0,.25+a*.22,.33,this.group)}else this.tag(it(et.box,st.plasticL,.45,.25,.4,0,.125,0,this.group)),this.tag(it(et.box,st.plastic,.3,.02,.18,0,.26,.12,this.group)),this.light=it(et.box,st.greenBox,.03,.015,.01,.15,.2,.201,this.group)}hit(t,e,i){this.hits++;const n=bt.ctx.fx;n.sparks(e,i,18),H.sparks(),H.plastic(),Fn(this.group,e,i,.05);const r=this.group.localToWorld(new T(this.big?.55:0,this.big?.9:.27,this.big?0:.2)),a=Ae.set(this.big?1:0,0,this.big?0:1).applyQuaternion(this.group.quaternion).clone();n.papers(r,4+this.hits*2,a),H.paper(),this.smoking=Math.min(3,this.smoking+1),this.light.material=Math.random()<.5?st.red:st.greenBox;const o=["PC LOAD LETTER","PAPER JAM!","TONER LOW","OUT OF ORDER"];return{pts:75,label:o[Math.min(this.hits-1,o.length-1)],color:"#ffe080"}}update(t){this.smoking>0&&(this.smokeAcc+=t*this.smoking,this.smokeAcc>.5&&(this.smokeAcc=0,bt.ctx.fx.smoke(this.group.localToWorld(Ae.set(0,this.big?1.1:.3,0)),1,.2,.5,3,.2,.35),Math.random()<.15&&bt.ctx.fx.sparks(this.group.localToWorld(Ae.set((Math.random()-.5)*.3,this.big?.9:.2,.2)),Qi.set(0,1,.5),4,2)))}}class In extends Re{drawers=[];shake=0;opened=0;body;constructor(t,e,i){super(t,0,e,i),this.kind="filing",this.body=new pe,this.group.add(this.body),this.tag(it(et.box,st.metal,.46,1.32,.62,0,.66,0,this.body));for(let n=0;n<4;n++){const r=this.tag(it(et.box,st.metal,.42,.29,.6,0,.18+n*.32,.03,this.body));it(et.box,st.darkMetal,.12,.025,.02,0,.1,.51,r).scale.set(.12/.42,.025/.29,.02/.6),this.drawers.push(r)}}hit(t,e,i){if(this.hits++,H.metal(),bt.ctx.fx.sparks(e,i,6,3),Fn(this.body,e,i,.04),this.shake=.5,this.hits%2===0&&this.opened<4){const n=this.drawers[3-this.opened];return this.opened++,n.position.z+=.32,bt.ctx.fx.papers(this.group.localToWorld(new T(0,n.position.y+.2,.5)),6,Ae.set(0,0,1).applyQuaternion(this.group.quaternion).clone()),H.paper(),{pts:40,label:"CONFIDENTIAL!",color:"#ffe080"}}return{pts:20}}update(t){this.shake>0&&(this.shake-=t,this.body.rotation.z=Math.sin(this.shake*60)*this.shake*.06,this.body.position.x=Math.sin(this.shake*50)*this.shake*.02)}}class Oa extends Re{panel;pool;light;state=0;flick=0;baseI=0;flickery;fT=0;constructor(t,e,i,n,r,a=!1,o=!0){super(t,e,i,n),this.kind="ceiling",this.light=r,this.flickery=a,this.tag(it(et.box,st.darkMetal,o?1.24:.64,.06,.64,0,-.03,0,this.group)),this.panel=this.tag(it(et.box,st.panelOn,o?1.18:.58,.02,.58,0,-.065,0,this.group),"panel"),this.pool=it(et.plane,st.poolCool,3.4,3.4,1,0,-e+.006,0,this.group),this.pool.rotation.x=-Math.PI/2,this.pool.raycast=()=>{},r&&(this.baseI=r.intensity,r.position.set(t,e-.3,i),bt.root.add(r))}hit(t,e,i){if(this.state>0)return H.metal(),{pts:5};this.state=1,this.flick=.5,this.hits++,H.glass(!1),H.sparks();const n=bt.ctx.fx;return n.shards(e,16,.06,0,void 0,.8,.05),n.sparks(e,i,22,3),{pts:75,label:"LIGHTS OUT!",color:"#ffffa0"}}update(t){if(this.fT+=t,this.state===1){this.flick-=t;const e=this.flick>0&&Math.random()<.5;this.panel.material=e?st.panelOn:st.bulbOff,this.pool&&(this.pool.visible=e),this.light&&(this.light.intensity=e?this.baseI:0),this.flick<=0&&(this.state=2,this.panel.material=st.bulbOff,this.pool&&(this.pool.visible=!1),this.light&&(this.light.intensity=0)),Math.random()<.2&&bt.ctx.fx.sparks(this.group.position,Ae.set(0,-1,0),3,1.5)}else if(this.state===2)Math.random()<t*.6&&bt.ctx.fx.sparks(this.group.position,Ae.set(0,-1,0),4,1.5);else if(this.flickery){const e=Math.sin(this.fT*2.3)+Math.sin(this.fT*7.1)>-.6||Math.random()<.3;this.panel.material=e?st.panelOn:st.bulbOff,this.pool&&(this.pool.visible=e),this.light&&(this.light.intensity=e?this.baseI:this.baseI*.1)}}}class _r extends Re{can;used=!1;sprayT=0;constructor(t,e,i,n){super(t,e,i,n),this.kind="extinguisher",it(et.box,st.darkMetal,.2,.08,.04,0,.5,-.02,this.group),this.can=new pe,this.can.position.set(0,0,.09),this.group.add(this.can),this.tag(it(et.cyl,st.red,.075,.5,.075,0,.25,0,this.can)),this.tag(it(et.sphere,st.red,.075,.04,.075,0,.5,0,this.can)),this.tag(it(et.box,st.black,.03,.08,.03,0,.56,0,this.can)),this.tag(it(et.box,st.black,.12,.02,.03,.04,.6,0,this.can)),it(et.box,st.white,.1,.12,.004,0,.3,.075,this.can)}hit(t,e,i,n){if(this.used)return H.metal(),{pts:5};this.used=!0,this.sprayT=2.2,H.whoosh(),H.metal();const r=bt.ctx.fx,a=Ae.set(0,0,1).applyQuaternion(this.group.quaternion).clone();r.cloud(e,a,40);const o=e.clone().addScaledVector(a,1.8).setY(0);bt.ctx.hazards.push({kind:"cloud",pos:o,radius:3,until:bt.ctx.time+6});for(const c of bt.zombies())c.alive&&c.pos.distanceTo(o)<3.2&&c.blind(5);const l=new Ci(this.can,0,.08,()=>H.metal());return l.v.set(n.x+a.x*2,1,n.z+a.z*2),l.w.set(2,9,3),je.push(l),{pts:150,label:"FIRE SAFETY BONUS!",color:"#ffffff"}}update(t){if(this.sprayT>0){this.sprayT-=t;const e=this.can.getWorldPosition(Ae).add(Qi.set(0,.5,0));bt.ctx.fx.smokeP.spawn(e,Qi.set((Math.random()-.5)*4,Math.random()*1.5,(Math.random()-.5)*4),2.5,.3,1.4,.94,.95,.97,.5,-.05,1.5)}}}class vr extends Re{door;tripped=!1;t=0;sparkT=0;constructor(t,e,i,n){super(t,e,i,n),this.kind="electric",this.tag(it(et.box,st.darkMetal,.6,.85,.16,0,0,0,this.group)),this.door=this.tag(it(et.box,st.metal,.56,.8,.02,0,0,.09,this.group));const r=it(et.plane,new Wt({map:li("⚡ DANGER","HIGH VOLTAGE","#111","#f5c400",256,128)}),.26,.13,1,0,.2,.101,this.group);r.raycast=()=>{},this.tag(r)}hit(t,e,i){const n=bt.ctx.fx;if(n.sparks(e,i,30,5),H.sparks(),this.tripped)return{pts:10};this.tripped=!0,this.t=4.5,H.zap(),this.door.rotation.y=-1.6,this.door.position.x=-.32,this.door.position.z=.35;const r=this.group.position.clone(),a={kind:"shock",pos:r.clone().setY(0),radius:3.4,until:bt.ctx.time+4.5,src:r};bt.ctx.hazards.push(a);let o=0;for(const l of bt.zombies())l.alive&&Math.hypot(l.pos.x-r.x,l.pos.z-r.z)<3.6&&(l.shock(),n.arc(r,l.pos.clone().setY(1.2),.5),o++,bt.ctx.addScore(500,l.pos.clone().setY(1.9),"OSHA VIOLATION!","#9fe8ff"));return{pts:300+o*0,label:o?"SHOCKING!":"LIVE WIRE!",color:"#9fe8ff"}}update(t){if(this.tripped)if(this.sparkT-=t,this.t>0){if(this.t-=t,this.sparkT<=0){this.sparkT=.12;const e=this.group.position;bt.ctx.fx.arc(e,Ae.set(e.x+(Math.random()-.5)*3,Math.random()*.5,e.z+(Math.random()-.5)*3),.1),bt.ctx.fx.sparks(e,Qi.set(0,0,1).applyQuaternion(this.group.quaternion),6,3)}}else this.sparkT<=0&&(this.sparkT=1.5+Math.random()*2,bt.ctx.fx.sparks(this.group.position,Qi.set(0,0,1).applyQuaternion(this.group.quaternion),5,2),bt.ctx.fx.smoke(this.group.position,1,.15,.4,2.5))}}class Fi extends Re{state=0;body=null;exec;constructor(t,e,i,n=!1){super(t,0,e,i),this.kind="chair",this.exec=n;const r=n?new Jt({color:1707786,shininess:50}):new te({color:1842466});for(let a=0;a<5;a++){const o=this.tag(it(et.box,st.darkMetal,.04,.03,.3,Math.sin(a*1.256)*.14,.05,Math.cos(a*1.256)*.14,this.group));o.rotation.y=a*1.256}this.tag(it(et.cyl8,st.metal,.025,.36,.025,0,.24,0,this.group)),this.tag(it(et.box,r,.48,.08,.46,0,.46,0,this.group)),this.tag(it(et.box,r,.46,n?.75:.5,.07,0,n?.88:.76,-.23,this.group))}hit(t,e,i,n){if(this.hits++,H.plastic(),bt.ctx.fx.debris(e,3,1842466,.03,1.5),this.state===0){this.state=1;const r=new Ci(this.group,0,0,void 0,!0);return r.v.set(n.x*2.2,0,n.z*2.2),r.w.y=(Math.random()-.5)*10,je.push(r),{pts:40,label:"ROLLING!"}}if(this.state===1){this.state=2;const r=new Ci(this.group,0,0,()=>H.thud());return r.v.set(n.x*1,1.2,n.z*1),r.w.set(n.z*5,0,-n.x*5),je.push(r),{pts:40,label:"TIPPED OVER"}}return{pts:5}}}class Ta extends Re{frontGlass;glow;drops=0;broken=!1;products=[];flick=0;constructor(t,e,i){super(t,0,e,i),this.kind="vending",this.tag(it(et.box,new Jt({color:9048088,shininess:50}),.95,1.9,.8,0,.95,0,this.group)),this.glow=it(et.box,st.vendGlow,.62,1.35,.02,-.1,1.15,.35,this.group);const n=[13639712,2117840,2138176,14721056,10494112,15790320];for(let r=0;r<5;r++)for(let a=0;a<5;a++){const o=it(et.box,new te({color:n[(r*3+a)%n.length],emissive:1118481}),.09,.15,.09,-.36+a*.13,.6+r*.25,.3,this.group);this.products.push(o)}this.frontGlass=this.tag(it(et.box,new Jt({color:11063528,transparent:!0,opacity:.22,shininess:140,depthWrite:!1}),.66,1.4,.02,-.1,1.15,.41,this.group),"glass"),it(et.box,st.black,.5,.18,.02,-.1,.25,.41,this.group),it(et.plane,new Wt({map:li("SYNER-COLA","","#fff","#a00",256,64)}),.7,.16,1,-.05,1.8,.405,this.group).raycast=()=>{},it(et.box,st.darkMetal,.16,.5,.02,.36,1.1,.41,this.group)}hit(t,e,i){this.hits++;const n=bt.ctx.fx;if(t==="glass"&&!this.broken){H.crack();const a=it(et.plane,st.crack,.5,.5,1,0,0,0,this.group);a.position.copy(this.group.worldToLocal(e.clone())),a.position.z=.425,a.rotation.z=Math.random()*6,a.raycast=()=>{},this.hits>=4&&(this.broken=!0,this.frontGlass.visible=!1,H.glass(!0),n.shards(e,30,.08,0,i.clone(),.6,1.2,Ae.set(1,0,0).applyQuaternion(this.group.quaternion).clone()),this.flick=1.2)}else H.metal(),Fn(this.group,e,i,.05),n.sparks(e,i,6);let r=0;for(let a=0;a<2;a++){const o=this.products.filter(f=>f.visible);if(!o.length)break;const l=o[Math.floor(Math.random()*o.length)];l.visible=!1,r++,this.drops++;const c=l.getWorldPosition(new T),u=l.material.color;this.broken?n.debris(c.addScaledVector(i,.2),1,u,.12,2,0,i):n.debris(this.group.localToWorld(Ae.set(-.1,.3,.3)),1,u,.1,.5)}return H.clunk(),{pts:50,label:r?"SNACK ATTACK!":void 0,color:"#ff8080"}}update(t){this.flick>0&&(this.flick-=t,this.glow.visible=Math.random()<.5,this.flick<=0&&(this.glow.visible=Math.random()<.5))}}class Mr extends Re{face;hand;minute;stopped=!1;fallen=!1;t=Math.random()*60;constructor(t,e,i,n){super(t,e,i,n),this.kind="clock",this.face=new pe,this.group.add(this.face);const r=this.tag(it(et.cyl,st.darkMetal,.2,.05,.2,0,0,0,this.face));r.rotation.x=Math.PI/2,this.tag(it(et.circle,st.white,.18,.18,1,0,0,.027,this.face));for(let o=0;o<12;o++)it(et.box,st.black,.012,.03,.004,Math.sin(o/12*Math.PI*2)*.15,Math.cos(o/12*Math.PI*2)*.15,.03,this.face).rotation.z=-o/12*Math.PI*2;this.minute=it(et.box,st.black,.012,.13,.004,0,.05,.033,this.face),this.minute.geometry=et.box;const a=new pe;a.position.z=.036,this.face.add(a),this.hand=it(et.box,st.red,.005,.15,.003,0,.065,0,a)}hit(t,e,i,n){if(this.hits++,!this.stopped){this.stopped=!0,H.crack(),H.metal();const r=it(et.plane,st.crack,.36,.36,1,0,0,.04,this.face);return r.raycast=()=>{},bt.ctx.fx.shards(e,5,.03,0,i.clone()),{pts:50,label:"TIME'S UP!"}}if(!this.fallen){this.fallen=!0;const r=new Ci(this.face,0,.03,a=>{H.glass(!1),bt.ctx.fx.debris(a.obj.position,8,3816770,.04,2),bt.ctx.fx.shards(a.obj.position,8,.04),a.obj.visible=!1});return r.v.set(n.x,.5,n.z),r.w.set(3,0,6),je.push(r),{pts:100,label:"OUT OF TIME!",color:"#ffe080"}}return{pts:0}}update(t){this.stopped||(this.t+=t,this.hand.parent.rotation.z=-Math.floor(this.t)/60*Math.PI*2,Math.floor(this.t)!==Math.floor(this.t-t)&&Math.random()<.2&&H.tick())}}class Yi extends Re{pieces=[];constructor(t,e,i,n=0,r=1){super(t,0,e,i),this.kind="sculpture",this.group.scale.setScalar(r),this.tag(it(et.box,st.marble,.6,1,.6,0,.5,0,this.group),"plinth");const a=n===0?st.bronze:n===1?st.marble:st.gold,o=n===1?[[et.box,.35,.35,.35,1.2],[et.ico,.22,.22,.22,1.55],[et.sphere,.12,.12,.12,1.86]]:[[et.torus,.22,.22,.22,1.25],[et.cone,.15,.4,.15,1.65],[et.sphere,.1,.1,.1,1.95]];for(const[l,c,u,f,h]of o){const d=this.tag(it(l,a,c,u,f,0,h,0,this.group),"piece");d.rotation.set(Math.random(),Math.random()*3,0),this.pieces.push({m:d,hp:2,fallen:!1})}}hit(t,e,i,n,r){this.hits++;const a=bt.ctx.fx,o=this.pieces[0].m.material.color;if(a.debris(e,5,o,.04,2),a.dust(e,i,.8),H.ceramic(),t==="plinth")return Fn(this.group,e,i,.05),{pts:20};const l=this.pieces.find(c=>c.m===r)??[...this.pieces].reverse().find(c=>!c.fallen);if(!l||l.fallen)return{pts:10};if(l.hp--,l.m.scale.multiplyScalar(.88),l.hp<=0){const c=this.pieces.indexOf(l);for(let f=c;f<this.pieces.length;f++){const h=this.pieces[f];if(h.fallen)continue;h.fallen=!0;const d=new Ci(h.m,0,.1,g=>{H.thud(),a.debris(g.obj.position,8,o,.06,2.5)});d.v.set(n.x*1.5+(Math.random()-.5),1,n.z*1.5),d.w.set(Math.random()*6,Math.random()*3,Math.random()*6),je.push(d)}const u=this.pieces.every(f=>f.fallen);return{pts:u?250:120,label:u?"ART CRITIC!":"FRACTURED!",color:"#ffd080"}}return{pts:40,label:"CHIPPED"}}}class Ee extends Re{leaves;potBroken=!1;constructor(t,e,i=1){super(t,0,e,Math.random()*6),this.kind="plant",this.group.scale.setScalar(i),this.tag(it(et.cyl8,st.pot,.22,.5,.18,0,.25,0,this.group),"pot"),this.leaves=new pe,this.group.add(this.leaves);for(let n=0;n<7;n++)this.tag(it(et.cone,st.leaf,.12,.7,.04,Math.sin(n)*.1,.8,Math.cos(n)*.1,this.leaves),"leaf").rotation.set(Math.sin(n*2.1)*.6,n,Math.cos(n*1.7)*.6)}hit(t,e,i,n){const r=bt.ctx.fx;if(t==="leaf")return r.debris(e,5,2972202,.04,1.2),H.paper(),{pts:10};if(this.potBroken)return{pts:0};this.potBroken=!0,H.ceramic(),H.thud(),r.debris(e,10,3814448,.06,2.2),r.debris(e,10,2759184,.04,1.5),r.dust(e,Ae.set(0,1,0),.35),this.group.children[0].visible=!1;const a=new Ci(this.leaves,0,.1,()=>H.thud());return a.v.set(n.x,.5,n.z),a.w.set(n.z*4,0,-n.x*4),je.push(a),{pts:50,label:"LANDSCAPING!",color:"#80ff80"}}}class Qn extends Re{frame;state=0;constructor(t,e,i,n,r,a,o){super(t,e,i,n),this.kind="art",this.frame=new pe,this.group.add(this.frame),this.tag(it(et.box,st.gold,r+.1,a+.1,.04,0,0,0,this.frame)),this.tag(it(et.plane,new te({map:Vx(o)}),r,a,1,0,0,.022,this.frame))}hit(t,e,i,n){if(this.hits++,H.crack(),Fn(this.frame,e,i,.05),this.state===0)return this.state=1,this.frame.rotation.z=(Math.random()<.5?1:-1)*.25,bt.ctx.fx.shards(e,4,.03),{pts:60,label:"ART CRITIC"};if(this.state===1){this.state=2;const r=new Ci(this.frame,0,.03,()=>{H.glass(!1)});return r.v.set(n.x*.5,.3,n.z*.5),r.w.set(-2,0,1),je.push(r),{pts:100,label:"PRICELESS!",color:"#ffd080"}}return{pts:5}}}class yr extends Re{used=!1;box;constructor(t,e,i,n){super(t,e,i,n),this.kind="firstaid",this.box=this.tag(it(et.box,st.white,.4,.3,.12,0,0,0,this.group)),it(et.box,st.red,.18,.05,.01,0,0,.065,this.group),it(et.box,st.red,.05,.18,.01,0,0,.065,this.group)}hit(t,e,i){return this.used?{pts:0}:(this.used=!0,H.pickup(),this.group.visible=!1,bt.ctx.fx.debris(e,6,16777215,.05,2),bt.ctx.fx.sparks(e,i,10,2),bt.heal(),{pts:100,label:"HEALTH BENEFITS!",color:"#60ff80"})}}class cr extends Re{scr;state=0;mats;flick=0;constructor(t,e,i,n,r,a,o){super(t,e,i,n),this.kind="ad",this.tag(it(et.box,st.black,r+.08,a+.08,.06,0,0,0,this.group)),this.mats=[new Wt({map:o}),new Wt({map:o,color:16744640}),new Wt({color:328965})],this.scr=this.tag(it(et.plane,this.mats[0],r,a,1,0,0,.032,this.group),"screen")}hit(t,e,i){this.hits++,bt.ctx.fx.sparks(e,i,14),H.glass(!1),H.sparks();const n=it(et.plane,st.crack,.6,.6,1,0,0,0,this.group);return n.position.copy(this.group.worldToLocal(e.clone())),n.position.z=.036,n.raycast=()=>{},this.state<2&&this.state++,this.flick=.8,this.state===2?(this.scr.material=this.mats[2],{pts:100,label:"AD BLOCKED!",color:"#ff80c0"}):{pts:40}}update(t){this.state===1&&(this.flick-=t,this.scr.material=this.flick>0||Math.random()<.05?this.mats[Math.random()<.5?1:2]:this.mats[1])}}class an extends Re{constructor(t,e,i,n=1718890){super(t,e,i,0),this.kind="vase";const r=new Jt({color:n,shininess:100});this.tag(it(et.sphere,r,.13,.18,.13,0,.18,0,this.group)),this.tag(it(et.cyl,r,.06,.15,.06,0,.38,0,this.group))}hit(t,e,i,n){return this.destroyed?{pts:0}:(this.destroyed=!0,this.group.visible=!1,H.ceramic(),H.glass(!1),bt.ctx.fx.debris(e,14,1718890,.04,2.5,this.group.position.y,n.clone().multiplyScalar(.5)),{pts:150,label:"MING DYNASTY!",color:"#ffd080"})}}class qx extends Re{leaking=!1;t=0;constructor(t,e,i,n){super(t,e,i,n),this.kind="coffee",this.tag(it(et.box,st.darkMetal,.35,.45,.35,0,.225,0,this.group)),this.tag(it(et.box,st.black,.2,.1,.05,0,.32,.18,this.group)),this.tag(it(et.cyl,new Jt({color:3153936,transparent:!0,opacity:.7,shininess:100}),.07,.14,.07,0,.1,.12,this.group),"pot")}hit(t,e,i){return this.hits++,bt.ctx.fx.sparks(e,i,12),H.sparks(),H.glass(!1),bt.ctx.fx.liquid(e,i,16,.18,.09,.04,2,.03),this.leaking||(this.leaking=!0,bt.ctx.fx.puddle(Ae.copy(this.group.position).setY(this.group.position.y+.002).add(Qi.set(0,0,.15).applyQuaternion(this.group.quaternion)),2363914,.35,.08,.9)),{pts:60,label:"DECAF!",color:"#d8a060"}}update(t){this.leaking&&(this.t+=t,this.t>.4&&(this.t=0,bt.ctx.fx.smoke(this.group.localToWorld(Ae.set(0,.5,0)),1,.85,.3,1.5,.1,.5)))}}function Kx(s){fn.activeLeaks=0;for(const t of bt.props)t.update(s);for(let t=je.length-1;t>=0;t--)je[t].update(s),je[t].alive||je.splice(t,1);H.setLeak(fn.activeLeaks)}function Zx(){bt.props.length=0,je.length=0}class $x{batches=new Map;root;colliders=[];windowMat=null;constructor(t){this.root=t}box(t,e,i,n,r,a,o,l=0,c=0){const u=new Yt(e,i,n);if(c>0){const f=u.attributes.uv,h=u.attributes.normal;for(let d=0;d<f.count;d++){const g=Math.abs(h.getX(d)),y=Math.abs(h.getY(d)),m=f.getX(d),p=f.getY(d),[b,S]=g>.5?[n,i]:y>.5?[e,n]:[e,i];f.setXY(d,m*b/c,p*S/c)}}l&&u.rotateY(l),u.translate(r,a,o),this.add(t,u)}add(t,e){if(!e.attributes.uv){const n=e.attributes.position.count;e.setAttribute("uv",new Ue(new Float32Array(n*2),2))}e.index&&(e=e.toNonIndexed());let i=this.batches.get(t);i||(i=[],this.batches.set(t,i)),i.push(e)}floor(t,e,i,n,r,a=0,o=2,l=!1){const c=n-e,u=r-i,f=new _e(c,u);f.rotateX(l?Math.PI/2:-Math.PI/2);const h=f.attributes.uv;for(let d=0;d<h.count;d++)h.setXY(d,h.getX(d)*c/o,h.getY(d)*u/o);f.translate((e+n)/2,a,(i+r)/2),this.add(t,f)}wall(t,e,i,n,r,a=3,o=0,l=2,c=.15){const u=Math.hypot(n-e,r-i),f=Math.atan2(-(r-i),n-e),h=new Yt(u,a,c),d=h.attributes.uv;for(let g=0;g<d.count;g++)d.setXY(g,d.getX(g)*u/l,d.getY(g)*a/l);h.rotateY(f),h.translate((e+n)/2,o+a/2,(i+r)/2),this.add(t,h)}finalize(){for(const[t,e]of this.batches){const i=pa(e,!1);if(e.forEach(r=>r.dispose()),!i)continue;i.computeBoundingSphere();const n=new Vt(i,t);n.userData.static=!0,this.root.add(n),this.colliders.push(n)}this.batches.clear()}desk(t,e,i,n,r={}){const a=Math.cos(n),o=Math.sin(n),l=(y,m)=>[e+y*a+m*o,i-y*o+m*a],c=r.exec?t.darkWood:t.deskTop,u=r.exec?2.2:1.5,f=r.exec?1:.75;let[h,d]=l(0,0);if(this.box(c,u,.05,f,h,.74,d,n),r.exec)[h,d]=l(0,-.2),this.box(t.darkWood,u-.1,.7,.5,h,.36,d,n);else{for(const y of[-1,1])[h,d]=l(y*(u/2-.03),0),this.box(t.deskLeg,.04,.72,f-.05,h,.36,d,n);[h,d]=l(0,-f/2+.05),this.box(t.deskLeg,u-.1,.4,.02,h,.5,d,n)}const g={seat:l(0,f/2+.35)};return[h,d]=l(0,.15),this.box(t.keyboard,.45,.02,.15,h,.775,d,n),r.monitor!==!1&&([h,d]=l(.05,-.18),g.monitor=new Jn(h,.765,d,n,r.exec)),r.lamp&&([h,d]=l(-u/2+.2,-.2),new $l(h,.765,d,n+.4)),r.mug!==!1&&Math.random()<.8&&([h,d]=l(.45,.15),new hn(h,.765,d,Math.random()*6)),r.phone!==!1&&Math.random()<.7&&([h,d]=l(-.5,.05),new gr(h,.765,d,n)),r.chair&&([h,d]=l(0,f/2+.45),new Fi(h,d,n+Math.PI,r.exec)),Math.random()<.6&&([h,d]=l(-.45,-.2),this.box(t.paper,.22,.03+Math.random()*.06,.3,h,.79,d,n+.1)),g}cubicleWalls(t,e,i,n,r=1.8,a=1.6){const o=Math.cos(n),l=Math.sin(n),c=(h,d)=>[e+h*o+d*l,i-h*l+d*o];let[u,f]=c(0,-a/2);this.box(t.cubicle,r,1.25,.06,u,.625,f,n),[u,f]=c(-r/2,0),this.box(t.cubicle,.06,1.25,a,u,.625,f,n),[u,f]=c(0,-a/2),this.box(t.trim,r,.03,.08,u,1.265,f,n),[u,f]=c(-r/2,0),this.box(t.trim,.08,.03,a,u,1.265,f,n)}ceilingLights(t,e,i,n,r=.15){let a=0;for(const o of t)for(const l of e){const c=a<n.length?n[a]:null;a++,new Oa(o,i,l,0,c,Math.random()<r)}}glassWall(t,e,i,n,r=2.7,a=1.5){const o=Math.hypot(i-t,n-e),l=Math.max(1,Math.round(o/a)),c=Math.atan2(-(n-e),i-t),u=[];for(let f=0;f<l;f++){const h=(f+.5)/l;u.push(new Eu(t+(i-t)*h,e+(n-e)*h,c,o/l-.02,r))}return u}windowWall(t,e,i,n,r,a,o,l=.3){const c=Math.hypot(i-t,n-e),u=Math.atan2(-(n-e),i-t),f=this.rainMat(),h=Math.max(1,Math.round(c/2)),d=Math.sin(u)*o,g=Math.cos(u)*o;for(let m=0;m<h;m++){const p=(m+.5)/h,b=t+(i-t)*p,S=e+(n-e)*p;new Tu(b,l+(r-l-.2)/2,S,u+(o>0?Math.PI:0),c/h-.08,r-l-.2,f),this.box(a.trim,.08,r,.12,t+(i-t)*(m/h),r/2,e+(n-e)*(m/h),u)}this.box(a.trim,.08,r,.12,i,r/2,n,u),this.wall(a.trim,t,e,i,n,l,0,2,.2),this.wall(a.trim,t,e,i,n,.2,r-.2,2,.2);const y=new Vt(new _e(c*6+60,28),new Wt({map:Gx(Math.floor(Math.random()*2)),fog:!1}));return y.position.set((t+i)/2+d*30,2,(e+n)/2+g*30),y.lookAt((t+i)/2,2,(e+n)/2),y.raycast=()=>{},this.root.add(y),{nx:d,nz:g}}rainMat(){return this.windowMat?this.windowMat:(this.windowMat=new yi({uniforms:{uTime:Au},transparent:!0,depthWrite:!1,side:Ui,vertexShader:"varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",fragmentShader:`uniform float uTime; varying vec2 vUv; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        void main(){
          vec2 p = vec2(vW.x + vW.z, vW.y) * vec2(9.0, 3.0);
          float col = floor(p.x);
          float sp = 0.6 + h(vec2(col, 1.0)) * 1.2;
          float y = fract(p.y * 0.25 + uTime * sp * 0.35 + h(vec2(col, 7.0)));
          float fx = abs(fract(p.x) - 0.5);
          float streak = smoothstep(0.08, 0.0, fx) * smoothstep(0.0, 0.25, y) * smoothstep(0.55, 0.25, y) * step(0.55, h(vec2(col, floor(p.y*0.25 + uTime*sp*0.35))));
          vec2 dp = floor(vec2(vW.x + vW.z, vW.y) * 22.0);
          float drop = step(0.965, h(dp)) * 0.6;
          float a = 0.06 + streak * 0.35 + drop * 0.25;
          gl_FragColor = vec4(vec3(0.75, 0.82, 0.95), a);
        }`}),this.windowMat)}pool(t,e,i,n,r=.005){const a=new Vt(new _e(i,i),new Wt({map:Jx(),color:n,blending:Oi,transparent:!0,depthWrite:!1}));return a.rotation.x=-Math.PI/2,a.position.set(t,r,e),a.raycast=()=>{},this.root.add(a),a}sign(t,e,i,n,r,a,o,l=!0){const c=new Vt(new _e(e,i),l?new Wt({map:t}):new te({map:t}));return c.position.set(n,r,a),c.rotation.y=o,c.raycast=()=>{},this.root.add(c),c}}const Au={value:0};let Co=null;function Jx(){if(!Co){const s=document.createElement("canvas");s.width=s.height=64;const t=s.getContext("2d"),e=t.createRadialGradient(32,32,0,32,32,32);e.addColorStop(0,"rgba(255,255,255,1)"),e.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=e,t.fillRect(0,0,64,64),Co=new Un(s)}return Co}const Wn=new Jt({color:9080726,shininess:90,specular:12303291}),tr=new Jt({color:2895411,shininess:60,specular:5592405}),Qx=new Jt({color:10331050,shininess:110,specular:14540253}),er=new Jt({color:11569728,shininess:120,specular:16769184}),jx=new Jt({color:1710620,shininess:30}),t1=new Wt({color:12103322}),Po=new te({color:4861468});class On{group=new pe;doorL;doorR;open=0;target=0;inCanvas;inTex;outCanvas;outTex;text="L";arrow=0;marquee="";mT=0;cabLight;constructor(t,e,i,n,r=!1){this.group.position.set(e,0,i),this.group.rotation.y=n,t.add(this.group);const a=this.group,o=(h,d,g,y,m,p,b)=>{const S=new Vt(new Yt(d,g,y),h);return S.position.set(m,p,b),a.add(S),S.userData.static=!0,S};o(jx,2,.05,2.2,0,-.025,-1.1),o(Wn,2,.05,2.2,0,2.62,-1.1),o(t1,1.2,.02,1.2,0,2.59,-1.1),o(Wn,2,2.6,.06,0,1.3,-2.2),o(Wn,.06,2.6,2.2,-1,1.3,-1.1),o(Wn,.06,2.6,2.2,1,1.3,-1.1),o(Po,1.9,.06,.06,0,.95,-2.14),o(Po,.06,.06,2,-.95,.95,-1.1),o(Po,.06,.06,2,.95,.95,-1.1),o(r?er:tr,.36,.06,2,0,0,-1.1).scale.set(4.5,.2,1),o(Wn,.45,2.6,.12,-.775,1.3,0),o(Wn,.45,2.6,.12,.775,1.3,0),o(Wn,1.1,.35,.12,0,2.425,0),o(r?er:tr,1.4,.12,.08,0,2.31,.08),o(r?er:tr,.12,2.3,.08,-.63,1.15,.08),o(r?er:tr,.12,2.3,.08,.63,1.15,.08),o(tr,.25,.5,.03,-.75,1.25,-.08);for(let h=0;h<8;h++){const d=new Vt(new pr(.022,10),new Wt({color:h===7?16756816:13687008}));d.position.set(-.75+(h%2?.05:-.05),1.1+Math.floor(h/2)*.09,-.097),d.rotation.y=Math.PI,a.add(d)}const l=new Vt(new pr(.03,12),new Wt({color:16765072}));l.position.set(.85,1.2,.07),a.add(l);const c=r?er:Qx;this.doorL=o(c,.57,2.25,.04,-.28,1.125,-.09),this.doorR=o(c,.57,2.25,.04,.28,1.125,-.09),this.inCanvas=document.createElement("canvas"),this.inCanvas.width=256,this.inCanvas.height=64,this.inTex=new Un(this.inCanvas),this.inTex.colorSpace=Be,this.outCanvas=document.createElement("canvas"),this.outCanvas.width=128,this.outCanvas.height=48,this.outTex=new Un(this.outCanvas),this.outTex.colorSpace=Be;const u=new Vt(new _e(.9,.225),new Wt({map:this.inTex}));u.position.set(0,2.43,-.065),u.rotation.y=Math.PI,a.add(u);const f=new Vt(new _e(.4,.15),new Wt({map:this.outTex}));f.position.set(0,2.5,.07),a.add(f),this.cabLight=new Yn(16773328,1.1,4,1.5),this.cabLight.position.set(0,2.3,-1.1),a.add(this.cabLight),this.draw()}setDisplay(t,e,i=""){t===this.text&&e===this.arrow&&i===this.marquee||(this.text=t,this.arrow=e,this.marquee=i,this.draw())}draw(){for(const[t,e]of[[this.inCanvas,!1],[this.outCanvas,!0]]){const i=t.getContext("2d"),n=t.width,r=t.height;if(i.fillStyle="#060402",i.fillRect(0,0,n,r),i.fillStyle="#ff9a2a",i.shadowColor="#ff7a00",i.shadowBlur=8,i.textBaseline="middle",this.marquee&&!e){i.font="bold 22px monospace";const a=i.measureText(this.marquee).width,o=this.mT*90%(a+n);i.fillText(this.marquee,n-o,r/2)}else i.font=`bold ${e?30:44}px monospace`,i.textAlign="center",i.fillText(this.text,n*.58,r/2+2),this.arrow&&(i.font=`bold ${e?24:34}px monospace`,i.fillText(this.arrow>0?"▲":"▼",n*.2,r/2+2)),i.textAlign="left";i.shadowBlur=0}this.inTex.needsUpdate=!0,this.outTex.needsUpdate=!0}update(t){const e=t/1.1;this.open<this.target?this.open=Math.min(this.target,this.open+e):this.open>this.target&&(this.open=Math.max(this.target,this.open-e));const i=this.open<.5?2*this.open*this.open:1-Math.pow(-2*this.open+2,2)/2;this.doorL.position.x=-.28-i*.55,this.doorR.position.x=.28+i*.55,this.marquee&&(this.mT+=t,this.draw())}insidePos(t){return this.group.localToWorld(t.set(0,1.65,-1.25))}frontPos(t,e=2.2){return this.group.localToWorld(t.set(0,1.65,e))}lookOut(t){return this.group.localToWorld(t.set(0,1.5,6))}lookIn(t){return this.group.localToWorld(t.set(0,1.5,-3))}}const wi=["root","spine","chest","neck","head","jaw","uArmL","fArmL","uArmR","fArmR","thighL","shinL","thighR","shinR"],e1={root:null,spine:"root",chest:"spine",neck:"chest",head:"neck",jaw:"head",uArmL:"chest",fArmL:"uArmL",uArmR:"chest",fArmR:"uArmR",thighL:"root",shinL:"thighL",thighR:"root",shinR:"thighR"},Ih={root:[0,.95,0],spine:[0,1.05,0],chest:[0,1.25,0],neck:[0,1.5,0],head:[0,1.56,0],jaw:[0,1.63,-.03],uArmL:[.235,1.45,0],fArmL:[.235,1.16,0],uArmR:[-.235,1.45,0],fArmR:[-.235,1.16,0],thighL:[.1,.92,0],shinL:[.1,.49,0],thighR:[-.1,.92,0],shinR:[-.1,.49,0]},Ru={root:"body",spine:"body",chest:"body",neck:"head",head:"head",jaw:"head",uArmL:"armL",fArmL:"armL",uArmR:"armR",fArmR:"armR",thighL:"legL",shinL:"legL",thighR:"legR",shinR:"legR"},i1=new Wt({vertexColors:!0});function n1(s){const t=[],e=[],i=new Nt,n=(m,p,b,S,v,R,w,C,_=!1,E=.06)=>{const P=new Yt(p,b,S);P.translate(v,R,w),P.deleteAttribute("uv");const I=P.attributes.position.count,L=new Float32Array(I*3),X=new Uint16Array(I*4),Z=new Float32Array(I*4);i.setHex(C);const N=1+(Math.random()-.5)*E,V=wi.indexOf(m);for(let k=0;k<I;k++){const K=N*(1-Math.floor(k/4)%3*.035);L[k*3]=i.r*K,L[k*3+1]=i.g*K,L[k*3+2]=i.b*K,X[k*4]=V,Z[k*4]=1}P.setAttribute("color",new Ue(L,3)),P.setAttribute("skinIndex",new Bl(X,4)),P.setAttribute("skinWeight",new Ue(Z,4)),(_?e:t).push(P)},r=s,a=r.vest??r.suit;n("root",.34,.2,.21,0,.93,0,r.skirt?r.suit:r.pants),n("root",.35,.04,.22,0,1.03,0,1381653),r.skirt&&n("root",.38,.4,.27,0,.77,0,r.suit),n("spine",.33,.24,.2,0,1.15,0,r.suit),n("spine",.12,.24,.01,0,1.15,.101,r.shortSleeve||a===r.suit?r.shirt:a),n("chest",.42,.3,.24,0,1.36,0,r.suit),n("chest",.48,.08,.25,0,1.47,0,r.suit),n("chest",.13,.27,.01,0,1.36,.121,r.shirt),r.vest!==void 0&&(n("chest",.06,.25,.012,.075,1.35,.122,r.vest),n("chest",.06,.25,.012,-.075,1.35,.122,r.vest)),r.tie!==null&&(n("chest",.05,.34,.012,0,1.3,.128,r.tie),n("chest",.07,.04,.015,0,1.46,.13,r.tie)),r.badge&&n("chest",.05,.06,.012,.13,1.4,.124,14200896),r.gold&&n("chest",.03,.03,.012,-.13,1.42,.124,16765024);for(let m=0;m<r.blood;m++){const p=.04+Math.random()*.08;n(Math.random()<.5?"chest":"spine",p,p*(1+Math.random()),.014,(Math.random()-.5)*.3,1.1+Math.random()*.35,.126,Math.random()<.5?5901578:3803142)}n("neck",.11,.1,.11,0,1.53,0,r.skin),n("neck",.17,.04,.15,0,1.5,0,r.shirt),n("head",.22,.2,.24,0,1.72,0,r.skin),n("head",.035,.05,.035,0,1.69,.13,r.skin),n("head",.17,.03,.01,0,1.745,.121,2761760),n("head",.055,.04,.012,.05,1.715,.118,1708560),n("head",.055,.04,.012,-.05,1.715,.118,1708560),n("head",.03,.022,.01,.05,1.715,.125,r.eye,!0),n("head",.03,.022,.01,-.05,1.715,.125,r.eye,!0),r.bald?n("head",.02,.08,.18,.118,1.74,-.03,r.hair):(n("head",.236,.07,.256,0,1.84,-.005,r.hair),n("head",.236,r.hairLong?.32:.16,.05,0,r.hairLong?1.66:1.75,-.115,r.hair),n("head",.02,.1,.2,.118,1.78,-.02,r.hair),n("head",.02,.1,.2,-.118,1.78,-.02,r.hair)),r.cap!==void 0&&(n("head",.25,.08,.27,0,1.86,0,r.cap),n("head",.2,.02,.11,0,1.83,.17,r.cap),n("head",.05,.04,.01,0,1.87,.136,14200896)),r.glasses&&(n("head",.2,.014,.012,0,1.735,.13,328965),n("head",.012,.035,.012,.1,1.72,.13,328965),n("head",.012,.035,.012,-.1,1.72,.13,328965)),n("jaw",.2,.07,.22,0,1.6,.01,r.skin),n("jaw",.12,.025,.01,0,1.615,.122,2753797),n("jaw",.08,.03,.012,.02,1.585,.122,4851720);for(const m of[1,-1]){const p=m>0?"uArmL":"uArmR",b=m>0?"fArmL":"fArmR",S=.235*m;r.shortSleeve?(n(p,.135,.16,.145,S,1.38,0,r.shirt),n(p,.1,.16,.11,S,1.22,0,r.skin),n(b,.095,.24,.1,S,1.04,0,r.skin)):(n(p,.13,.31,.14,S,1.3,0,r.suit),n(b,.12,.23,.13,S,1.04,0,r.suit),n(b,.11,.03,.12,S,.925,0,r.shirt)),n(b,.085,.12,.06,S,.85,.005,r.skin),n(b,.03,.05,.03,S-.035*m,.86,.04,r.skin)}const o=r.skirt?3813420:r.pants;for(const m of[1,-1]){const p=m>0?"thighL":"thighR",b=m>0?"shinL":"shinR",S=.1*m;n(p,r.skirt?.11:.15,.45,r.skirt?.12:.16,S,.7,0,o),n(b,r.skirt?.1:.14,.42,r.skirt?.11:.15,S,.28,0,o),n(b,.12,.08,.26,S,.04,.04,r.skirt?2755082:855309)}const l=pa(t),c=pa(e),u=pa([l,c],!0);t.forEach(m=>m.dispose()),e.forEach(m=>m.dispose()),l.dispose(),c.dispose();const f={},h={};for(const m of wi){const p=new su;p.name=m,f[m]=p;const b=Ih[m],S=e1[m];if(S){const v=Ih[S];p.position.set(b[0]-v[0],b[1]-v[1],b[2]-v[2]),f[S].add(p)}else p.position.set(b[0],b[1],b[2]);h[m]=p.position.clone()}const d=new te({vertexColors:!0}),g=new dd(u,[d,i1]);g.add(f.root),g.updateMatrixWorld(!0);const y=new Gl(wi.map(m=>f[m]));return g.bind(y),g.frustumCulled=!1,{mesh:g,bones:f,mat:d,boneParts:wi.map(m=>Ru[m]),rest:h}}const s1=[9411712,10134410,8359023,10656390,9080698,7305827],Lh=[1709072,3811866,5915952,7829360,2763306,9071168,11579560],Dh=[2303534,3093312,3882826,1776930,4866616,2832970,5263450],Uh=[7999504,1063546,6969872,1727034,4856410,9058832],hi=s=>s[Math.floor(Math.random()*s.length)];function r1(s){const t=s==="receptionist"||s!=="security"&&s!=="regional"&&s!=="ceo"&&Math.random()<.3,e={suit:hi(Dh),pants:hi(Dh),shirt:hi([14211280,13160668,14736588,12109e3]),tie:hi(Uh),skin:hi(s1),hair:hi(Lh),eye:hi([16773792,16769152,15794128]),blood:1+Math.floor(Math.random()*3),skirt:t,hairLong:t&&Math.random()<.7,bald:!t&&Math.random()<.15};switch(t&&(e.tie=null),s){case"worker":Math.random()<.4&&(e.shortSleeve=!0,e.suit=e.pants);break;case"accountant":e.glasses=!0,e.vest=hi([4864554,2767402]),e.suit=5921370;break;case"receptionist":e.suit=hi([5904938,2763338,1710618]),e.shirt=15261912;break;case"intern":e.shortSleeve=!0,e.suit=3824250,e.pants=9075290,e.tie=null,e.hair=hi(Lh);break;case"security":e.suit=1713208,e.pants=1317416,e.shirt=2767450,e.tie=657930,e.cap=1317416,e.badge=!0,e.skirt=!1,e.hairLong=!1;break;case"manager":e.suit=hi([2764086,4012596,2371642]),e.vest=Math.random()<.5?5917242:void 0,e.tie=hi(Uh);break;case"executive":e.suit=hi([1052692,1579036,1840152]),e.pants=e.suit,e.shirt=15790314,e.tie=hi([9046538,10518560]),e.gold=!0;break;case"regional":e.shortSleeve=!0,e.suit=2763312,e.pants=3816e3,e.shirt=13687016,e.tie=10493984,e.bald=!1,e.hair=2759184,e.blood=4;break;case"ceo":e.suit=789520,e.pants=789520,e.shirt=16053486,e.tie=10095120,e.gold=!0,e.hair=13158596,e.skin=10526864,e.eye=16724e3,e.blood=0,e.skirt=!1,e.hairLong=!1,e.bald=!1;break}return e}const a1={worker:{hp:3,speed:.95,pts:100,scale:1},accountant:{hp:3,speed:.85,pts:100,scale:.97},receptionist:{hp:3,speed:1.05,pts:120,scale:.95},intern:{hp:2,speed:1.2,pts:150,scale:.92},security:{hp:5,speed:1.25,pts:200,scale:1.06},manager:{hp:4,speed:1.15,pts:200,scale:1.02},executive:{hp:6,speed:1.3,pts:300,scale:1.04},regional:{hp:48,speed:1.1,pts:3e3,scale:1.35},ceo:{hp:1,speed:1,pts:0,scale:1}},ui=new T,ra=new T;let o1=0;class Jl{constructor(t,e){this.ctx=e,this.spawn=t,this.type=t.type,this.rig=n1(r1(t.type));const i=a1[t.type];this.hp=this.maxHp=i.hp,this.pts=i.pts,this.speed=i.speed*(1+e.difficulty*.09)*(.9+Math.random()*.2),this.baseScale=i.scale,this.root.add(this.rig.mesh),this.root.scale.setScalar(i.scale),this.root.position.set(t.x,0,t.z),this.yaw=this.targetYaw=t.rot,this.root.rotation.y=this.yaw,this.seated=!!t.seated,this.noticeDelay=t.delay??Math.random()*1.5,this.path=t.path?t.path.slice():[],this.thrower=t.throws??(t.type==="manager"&&Math.random()<.35||t.type==="executive"&&Math.random()<.5),this.rusher=t.rush??(t.type==="security"||Math.random()<.15+e.difficulty*.05),this.crawler=t.type==="intern"||t.act==="crawl",this.miniboss=t.type==="regional",this.partner=t.facePartner??0,this.miniboss&&(this.hp=this.maxHp=Math.round(i.hp*(1+e.difficulty*.1))),this.rig.mesh.userData.zombie=this,t.hidden&&(this.root.visible=!1),this.computePose(0),this.cur.set(this.tgt),this.rootY=this.rootYT,this.rootX=this.rootXT,this.applyPose()}ctx;id=o1++;root=new pe;rig;type;spawn;state="work";stateT=0;hp;maxHp;speed;pts;yaw;targetYaw;cur=new Float32Array(wi.length*3);tgt=new Float32Array(wi.length*3);rootY=0;rootYT=0;rootX=0;rootXT=0;rootZ=0;flinch=0;flinchY=0;phase=Math.random()*6;t=Math.random()*10;seated;noticeDelay;path;activated=!1;dead=!1;armHp={L:2,R:2};armGone={L:!1,R:!1};headGone=!1;attackCd=.5+Math.random();windup=0;striking=0;throwCd=1.5+Math.random()*1.5;throwCount=0;thrower;rusher;fallDir=1;fallSpin=0;fallT=0;sinkT=0;slipHit=new Set;blindT=0;shockT=0;groanCd=2+Math.random()*4;noticeStyle=Math.floor(Math.random()*3);stepCd=0;baseScale;hitFlash=0;miniboss=!1;mbPhase=0;volley=0;chargeT=0;crawler;onDeath=null;onActivate=null;onRise=null;group="";wave=0;partner=0;get alive(){return!this.dead}get pos(){return this.root.position}activate(){this.activated||this.dead||(this.activated=!0,this.stateT=-this.noticeDelay,this.onActivate&&this.onActivate(this))}s(t,e,i=0,n=0){const r=wi.indexOf(t)*3;this.tgt[r]=e,this.tgt[r+1]=i,this.tgt[r+2]=n}standPose(){this.tgt.fill(0),this.rootYT=0,this.rootXT=0,this.s("uArmL",0,0,.06),this.s("uArmR",0,0,-.06)}headToward(t,e=1){const i=t.x-this.pos.x,n=t.z-this.pos.z;let r=Math.atan2(i,n)-this.yaw;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;r=Ps.clamp(r,-1.4,1.4)*e;const a=wi.indexOf("neck")*3,o=wi.indexOf("head")*3;this.tgt[a+1]+=r*.4,this.tgt[o+1]+=r*.6,this.tgt[o]-=.15*e}workPose(t){const e=this.spawn.act;switch(this.standPose(),this.seated&&(this.rootYT=-.43,this.s("thighL",-1.5,0,.05),this.s("thighR",-1.5,0,-.05),this.s("shinL",1.45),this.s("shinR",1.45)),e){case"type":case"reception":this.s("uArmL",-.45,0,.12),this.s("uArmR",-.45,0,-.12),this.s("fArmL",-1.05+Math.sin(t*17)*.06),this.s("fArmR",-1.05+Math.sin(t*15+1)*.06),this.s("head",.18+Math.sin(t*.7)*.03),this.s("spine",.08);break;case"spreadsheet":this.s("uArmL",-.4,0,.12),this.s("uArmR",-.5,0,-.1),this.s("fArmL",-1.1),this.s("fArmR",-1+Math.sin(t*3)*.05),this.s("head",.05,Math.sin(t*.3)*.1,Math.sin(t*.5)*.08),this.s("spine",.15),this.s("chest",.1);break;case"phone":this.s("uArmR",-.35,0,-.65),this.s("fArmR",-2.5),this.s("uArmL",-.45,0,.1),this.s("fArmL",-1+Math.sin(t*2)*.1),this.s("head",.08,Math.sin(t*.8)*.2,-.22),this.s("jaw",Math.max(0,Math.sin(t*9))*.25);break;case"copier":this.s("uArmL",-.7,0,.1),this.s("uArmR",-.7+Math.max(0,Math.sin(t*1.3))*.25,0,-.1),this.s("fArmL",-.4),this.s("fArmR",-.5),this.s("head",.45),this.s("spine",.12);break;case"filing":this.s("uArmR",-.9+Math.sin(t*1.1)*.15,0,-.1),this.s("fArmR",-.25),this.s("uArmL",-.2,0,.1),this.s("fArmL",-.8),this.s("head",.5,-.2),this.s("spine",.25),this.s("thighL",-.15),this.s("shinL",.25);break;case"cooler":this.s("uArmL",-.3,0,.15),this.s("fArmL",-1.5),this.s("uArmR",Math.sin(t*1.7)*.2-.2,0,-.08),this.s("fArmR",-.6+Math.sin(t*2.3)*.3),this.s("head",.05,this.partner+Math.sin(t*.6)*.1),this.s("jaw",Math.max(0,Math.sin(t*7))*.2);break;case"meeting":this.s("uArmL",-.6,0,.15),this.s("uArmR",-.6,0,-.15),this.s("fArmL",-.95),this.s("fArmR",-.95),this.s("head",.1+Math.max(0,Math.sin(t*1.4))*.15,this.partner);break;case"write":this.s("uArmR",-.55,0,-.1),this.s("fArmR",-1+Math.sin(t*6)*.05,Math.sin(t*4)*.1),this.s("uArmL",-.5,0,.15),this.s("fArmL",-1.1),this.s("head",.35),this.s("spine",.1);break;case"guard":this.s("uArmL",.1,0,.25),this.s("uArmR",.1,0,-.25),this.s("fArmL",-1.6,.3),this.s("fArmR",-1.6,-.3),this.s("head",0,Math.sin(t*.4)*.4);break;case"window":this.s("head",-.1,0,Math.sin(t*.3)*.1),this.s("uArmL",0,0,.04),this.s("uArmR",0,0,-.04);break;case"pace":this.s("head",.2,Math.sin(t*.5)*.5),this.s("uArmL",.25,0,.1),this.s("uArmR",.25,0,-.1),this.s("fArmL",-.4),this.s("fArmR",-.4);break;case"crawl":this.crawlPose(t*.3);break;default:this.s("head",.1,Math.sin(t*.4)*.2,.1)}}walkPose(t,e){this.standPose();const i=this.phase,n=.45+e*.25;this.s("thighL",-Math.sin(i)*n),this.s("thighR",Math.sin(i)*n),this.s("shinL",Math.max(0,Math.sin(i+1.6))*(.6+e*.5)),this.s("shinR",Math.max(0,-Math.sin(i+1.6))*(.6+e*.5)),e>.6?(this.s("uArmL",-1+Math.sin(i)*.7,0,.3),this.s("uArmR",-1-Math.sin(i)*.7,0,-.3),this.s("fArmL",-.6),this.s("fArmR",-.6),this.s("spine",.3),this.s("chest",.1),this.s("jaw",.5)):(this.s("uArmL",-1.35+Math.sin(i)*.12,0,.08),this.s("uArmR",-1.35-Math.sin(i)*.12,0,-.08),this.s("fArmL",-.2),this.s("fArmR",-.15),this.s("spine",.12),this.s("jaw",.2+Math.sin(t*3)*.15)),this.s("head",.05+Math.sin(t*1.3)*.08,Math.sin(t*.7)*.15,.25*Math.sin(t*.5+this.id)),this.s("chest",.05,Math.sin(i)*.12),this.rootYT=-Math.abs(Math.cos(i))*.04,this.armGone.L&&this.s("uArmL",0,0,.1),this.armGone.R&&this.s("uArmR",0,0,-.1)}crawlPose(t){this.tgt.fill(0),this.rootYT=-.72,this.rootXT=1.35,this.s("uArmL",-2.6+Math.sin(t)*.5,0,.3),this.s("uArmR",-2.6-Math.sin(t)*.5,0,-.3),this.s("fArmL",-.3+Math.max(0,Math.sin(t))*.6),this.s("fArmR",-.3+Math.max(0,-Math.sin(t))*.6),this.s("thighL",.1+Math.sin(t)*.15),this.s("thighR",.1-Math.sin(t)*.15),this.s("shinL",.3),this.s("shinR",.4),this.s("head",-.9),this.s("jaw",.5)}computePose(t){const e=this.t,i=this.ctx.camera.position;switch(this.state){case"work":this.workPose(e);break;case"notice":{this.workPose(e*.2);const n=Ps.clamp(this.stateT/(this.noticeStyle===0?.25:.9),0,1);this.headToward(i,n),this.noticeStyle===0&&this.s("jaw",.6);break}case"rise":{this.standPose(),this.headToward(i,1),this.s("uArmL",-.6,0,.1),this.s("uArmR",-.6,0,-.1),this.s("spine",.35),this.s("jaw",.5),this.crawler&&this.crawlPose(e);break}case"move":case"stagger":if(this.crawler){this.crawlPose(this.phase);break}this.walkPose(e,this.rusher||this.blindT>0?1:.2),this.blindT>0&&(this.s("uArmL",-2.2+Math.sin(e*9)*.6,0,.4),this.s("uArmR",-2+Math.cos(e*8)*.6,0,-.4),this.s("fArmL",-1.6),this.s("fArmR",-1.6),this.s("head",.5));break;case"attack":{if(this.crawler){this.crawlPose(e*3),this.s("head",-1.3);break}if(this.standPose(),this.headToward(i,1),this.striking>0)this.s("uArmL",-.7,0,.1),this.s("uArmR",-.7,0,-.1),this.s("fArmL",-.1),this.s("fArmR",-.1),this.s("spine",.45),this.s("jaw",.9),this.s("thighL",-.5),this.s("shinL",.4);else if(this.windup>0){const n=this.windup;this.s("uArmL",-2.8*n,0,.35*n),this.s("uArmR",-2.8*n,0,-.35*n),this.s("fArmL",-.7*n),this.s("fArmR",-.7*n),this.s("spine",-.25*n),this.s("jaw",.8*n),this.s("head",-.25*n)}else this.walkPose(e,.2),this.phase+=t*.5,this.s("thighL",0),this.s("thighR",0),this.s("shinL",0),this.s("shinR",0);break}case"throw":{this.standPose(),this.headToward(i,1),this.windup>0?(this.s("uArmR",-2.8,0,-.3),this.s("fArmR",-1.2),this.s("spine",-.1,-.4),this.s("uArmL",-.8,0,.3),this.s("thighR",.3)):this.striking>0?(this.s("uArmR",-1.3,0,-.1),this.s("fArmR",-.1),this.s("spine",.3,.35),this.s("thighL",-.4)):(this.s("uArmL",-.4,0,.2),this.s("uArmR",-.4,0,-.2),this.s("jaw",.4));break}case"slip":{this.tgt.fill(0),this.s("uArmL",-2.6,0,.8),this.s("uArmR",-2.6,0,-.8),this.s("thighL",-1.2),this.s("thighR",-.8),this.s("jaw",.7);break}case"shock":{for(let n=0;n<this.tgt.length;n++)this.tgt[n]=(Math.random()-.5)*.7;this.s("uArmL",-1.5+Math.random(),0,1),this.s("uArmR",-1.5+Math.random(),0,-1),this.s("jaw",1);break}case"dying":case"dead":{if(this.crawler){this.crawlPose(0),this.s("head",-.4);break}this.tgt.fill(0),this.s("uArmL",-.9-this.fallDir*.6,0,.9),this.s("uArmR",-.9-this.fallDir*.6,0,-.9),this.s("thighL",-.3*this.fallDir),this.s("shinL",.4),this.s("head",-.4*this.fallDir,.4),this.s("jaw",.7);break}}this.armGone.L&&this.s("uArmL",0,0,0),this.armGone.R&&this.s("uArmR",0,0,0)}applyPose(){const t=this.rig.bones;for(let e=0;e<wi.length;e++)t[wi[e]].rotation.set(this.cur[e*3],this.cur[e*3+1],this.cur[e*3+2]);t.spine.rotation.x+=this.flinch,t.chest.rotation.y+=this.flinchY,t.root.position.y=this.rig.rest.root.y+this.rootY,t.root.position.z=this.rootZ,t.root.rotation.x+=this.rootX}hit(t,e,i){if(this.dead)return{killed:!1,pts:0,head:!1};this.activated||this.activate(),(this.state==="work"||this.state==="notice")&&(this.state="rise",this.stateT=0);const n=t==="head";let r=n?3:1;if(this.miniboss&&(r=n?3:1),this.ctx.fx.blood(e,ui.copy(i).multiplyScalar(-.3).add(ra.set(0,.5,0)),n?18:10,n),H.flesh(n),this.hitFlash=.12,this.flinch=-.35-Math.random()*.2,this.flinchY=(Math.random()-.5)*.8,this.miniboss||this.pos.addScaledVector(ui.set(i.x,0,i.z).normalize(),.12),t==="armL"||t==="armR"){const o=t==="armL"?"L":"R";!this.armGone[o]&&!this.miniboss&&(this.armHp[o]--,this.armHp[o]<=0&&this.detachArm(o))}return this.hp-=r,this.windup>0&&!this.miniboss?(this.windup=0,this.state="stagger",this.stateT=0):this.miniboss&&this.windup>0&&n&&(this.windup=Math.max(0,this.windup-.25)),this.hp<=0?(n&&!this.miniboss&&this.popHead(e),this.die(n?"head":"body",i),{killed:!0,pts:this.pts,head:n}):(!this.miniboss&&(this.state==="move"||this.state==="throw")&&(this.state="stagger",this.stateT=0,this.windup=0,this.striking=0),{killed:!1,pts:10,head:n})}detachArm(t){this.armGone[t]=!0;const e=this.rig.bones[t==="L"?"uArmL":"uArmR"];e.scale.setScalar(.001),e.updateMatrixWorld();const i=e.getWorldPosition(new T);i.y-=.2,this.ctx.fx.debris(i,1,(this.rig.mesh.geometry.attributes.color,2764086),.16,2.5),this.ctx.fx.debris(i,2,9411712,.06,2),this.ctx.fx.blood(i,ui.set(0,1,0),16,!0),this.ctx.popup(i,"LAID OFF!","#ffcf5a")}popHead(t){this.headGone=!0,this.rig.bones.head.scale.setScalar(.001),this.ctx.fx.debris(t,6,9411712,.06,3.5),this.ctx.fx.debris(t,3,2759184,.05,3),this.ctx.fx.blood(t,ui.set(0,1.5,0),30,!0)}die(t,e){this.dead||(this.dead=!0,this.state="dying",this.stateT=0,this.windup=0,this.striking=0,this.fallDir=Math.random()<.7?1:-1,e&&(this.fallSpin=(Math.random()-.5)*1.2),Math.random()<.3&&H.groan(1.3,.4),this.onDeath&&this.onDeath(this,t))}slip(){this.dead||this.crawler||(this.state="slip",this.stateT=0,this.windup=0,this.hp-=1,H.splash(!1),this.ctx.fx.liquid(ui.copy(this.pos).setY(.05),ra.set(0,1,0),18,.6,.8,1,2.2,.035,1.2),this.hp<=0&&this.die("slip"))}shock(t=1.1){this.dead||(this.state="shock",this.stateT=0,this.shockT=t,this.windup=0)}blind(t=5){this.dead||(this.blindT=Math.max(this.blindT,t))}update(t){this.t+=t,this.stateT+=t,this.hitFlash>0&&(this.hitFlash-=t,this.rig.mat.emissive.setRGB(this.hitFlash>0?.5:0,.05*(this.hitFlash>0?1:0),0)),this.flinch*=Math.max(0,1-t*7),this.flinchY*=Math.max(0,1-t*6),this.blindT>0&&(this.blindT-=t);const e=this.ctx.camera.position,i=this.ctx;switch(this.state){case"work":this.activated&&this.stateT>=0&&(this.state="notice",this.stateT=0,this.noticeStyle===0?H.screech():Math.random()<.5&&H.groan(1,.5));break;case"notice":this.stateT>(this.noticeStyle===0?.4:this.noticeStyle===1?1.1:1.6)/(1+i.difficulty*.1)&&(this.state="rise",this.stateT=0);break;case"rise":{this.seated&&(this.seated=!1,this.onRise&&this.onRise(this),this.pos.addScaledVector(ui.set(Math.sin(this.yaw),0,Math.cos(this.yaw)),-.25)),this.root.visible=!0;const r=this.path.length?this.path[0]:[e.x,e.z];this.targetYaw=Math.atan2(r[0]-this.pos.x,r[1]-this.pos.z),this.stateT>.65&&(this.state="move",this.stateT=0,this.rusher&&H.screech());break}case"move":{let r,a;if(this.path.length)r=this.path[0][0],a=this.path[0][1];else{const f=i.camFwd,h=-f.z,d=f.x,g=this.pos.x-e.x,y=this.pos.z-e.z,m=this.thrower&&this.throwCount<2?5.5:this.miniboss?2:1.3,p=Ps.clamp((g*h+y*d)*.35,-.65,.65)+(this.id%3-1)*.3;r=e.x+f.x*m+h*p,a=e.z+f.z*m+d*p;const b=Math.hypot(this.pos.x-r,this.pos.z-a),S=g*f.x+y*f.z;if(b<=.25||S>.6&&S<m+.2&&Math.abs(g*h+y*d)<1.1){this.thrower&&this.throwCount<2?(this.state="throw",this.stateT=0,this.throwCd=.3):(this.state="attack",this.stateT=0,this.attackCd=.2+Math.random()*.4);break}this.miniboss&&this.minibossMove(t,Math.hypot(g,y))}const o=r-this.pos.x,l=a-this.pos.z,c=Math.hypot(o,l);if(this.path.length&&c<.35){this.path.shift();break}this.targetYaw=Math.atan2(o,l);let u=this.speed*(this.rusher?1.8:1)*(this.crawler?.9:1);this.blindT>0&&(u*=.25),this.stateT<.4&&(u*=this.stateT/.4),c>.01&&(this.pos.x+=o/c*u*t,this.pos.z+=l/c*u*t),this.phase+=t*u*(this.crawler?4:4.5),this.stepCd-=t,this.stepCd<=0&&(this.stepCd=.6/Math.max(.5,u),Math.random()<.3&&H.step()),this.groanCd-=t,this.groanCd<=0&&(this.groanCd=3+Math.random()*5,H.groan(.9+Math.random()*.3,.35)),this.checkHazards(),this.thrower&&this.throwCount<2&&(this.throwCd-=t,this.throwCd<=0&&Math.hypot(this.pos.x-e.x,this.pos.z-e.z)<11&&(this.state="throw",this.stateT=0));break}case"stagger":this.phase+=t*2,this.stateT>.35&&(this.state="move",this.stateT=.2);break;case"attack":{if(this.targetYaw=Math.atan2(e.x-this.pos.x,e.z-this.pos.z),Math.hypot(this.pos.x-e.x,this.pos.z-e.z)>(this.miniboss?2.6:1.9)&&this.windup<=0&&this.striking<=0){this.state="move",this.stateT=.4;break}if(this.blindT>0){this.windup=0;break}if(this.striking>0)this.striking-=t,this.striking<=0&&(this.attackCd=(this.miniboss?1.4:1.2)+Math.random()*.8);else if(this.windup>0){const a=(this.miniboss?1.15:.95)-i.difficulty*.06;this.windup=Math.min(1,this.windup+t/a),this.windup>=1&&(this.windup=0,this.striking=.3,H.swipe(),i.playerHit(this.miniboss?2:1,this.type))}else this.attackCd-=t,this.attackCd<=0&&(this.windup=.01,i.warn(ui.copy(this.pos).setY(1.5*this.baseScale),.9),H.groan(1.4,.6));break}case"throw":{if(this.targetYaw=Math.atan2(e.x-this.pos.x,e.z-this.pos.z),this.striking>0)this.striking-=t,this.striking<=0&&(this.throwCount++,this.miniboss&&this.volley>0?(this.windup=.01,this.volley--):(this.state="move",this.stateT=.4,this.throwCd=2.5+Math.random()*2));else if(this.windup>0){if(this.windup+=t/(this.miniboss?.45:.75-i.difficulty*.05),this.windup>=1){this.windup=0,this.striking=.25;const r=this.rig.bones.fArmR.getWorldPosition(ui),a=this.type==="executive"?["briefcase","pen"]:this.type==="security"?["baton"]:this.miniboss?["bossmug"]:["stapler","mug","binder"];i.throwProjectile(r.clone(),a[Math.floor(Math.random()*a.length)],(this.miniboss?1.1:1.5)-i.difficulty*.08,this.miniboss?new T((Math.random()-.5)*.6,0,0):void 0),H.swipe()}}else this.throwCd-=t,this.throwCd<=0&&(this.windup=.01);break}case"slip":{const r=Math.min(1,this.stateT/.35);this.root.rotation.x=-r*1.45,this.stateT>1.8+.35&&(this.root.rotation.x=0,this.state="rise",this.stateT=0);break}case"shock":this.shockT-=t,this.root.position.x+=(Math.random()-.5)*.02,Math.random()<.3&&i.fx.sparks(ui.copy(this.pos).setY(.6+Math.random()),ra.set(0,1,0),3,2),this.shockT<=0&&this.die("shock");break;case"dying":{this.fallT+=t;const r=Math.min(1,this.fallT*this.fallT*3.2);this.crawler||(this.root.rotation.x=-this.fallDir*r*1.5,this.root.rotation.z=this.fallSpin*r*.3),this.fallT>.55&&this.sinkT===0&&(this.sinkT=1e-4,H.thud(),i.fx.dust(ui.copy(this.pos).setY(.05),ra.set(0,1,0),.4)),this.fallT>2.6&&(this.state="dead",this.stateT=0);break}case"dead":this.root.position.y-=t*.35,this.stateT>1.6&&(this.state="gone",this.root.removeFromParent());break}if(this.state!=="dying"&&this.state!=="dead"&&this.state!=="slip"&&this.state!=="work"){let r=this.targetYaw-this.yaw;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;this.yaw+=r*Math.min(1,t*(this.state==="notice"?1.5:5)),this.root.rotation.y=this.yaw}this.computePose(t);const n=Math.min(1,t*(this.state==="attack"&&this.striking>0?25:this.state==="shock"?30:this.state==="rise"?5:9));for(let r=0;r<this.cur.length;r++)this.cur[r]+=(this.tgt[r]-this.cur[r])*n;this.rootY+=(this.rootYT-this.rootY)*Math.min(1,t*(this.state==="rise"?4:8)),this.rootX+=(this.rootXT-this.rootX)*Math.min(1,t*8),this.applyPose()}minibossMove(t,e){this.chargeT-=t,this.chargeT<=0&&e>3.5&&(this.chargeT=6,this.state="throw",this.stateT=0,this.windup=.01,this.volley=2+Math.floor(this.ctx.difficulty/2),this.ctx.message('"WE NEED TO TALK ABOUT YOUR NUMBERS!"',2,"#ffb050")),this.rusher=e<6&&this.hp<this.maxHp*.5}checkHazards(){for(const t of this.ctx.hazards){if(t.until<this.ctx.time)continue;const e=t.puddle?t.puddle.r*.9:t.radius;Math.hypot(this.pos.x-t.pos.x,this.pos.z-t.pos.z)>e||(t.kind==="puddle"&&!this.slipHit.has(t)&&e>.35?(this.slipHit.add(t),this.slip(),this.ctx.addScore(250,ui.copy(this.pos).setY(1),"SLIP HAZARD!","#6fd8ff")):t.kind==="cloud"&&this.blindT<=0?(this.blind(5),this.ctx.addScore(150,ui.copy(this.pos).setY(1.6),"FIRE SAFETY!","#ffffff")):t.kind==="shock"&&this.state!=="shock"&&(this.shock(),t.src&&this.ctx.fx.arc(t.src,ui.copy(this.pos).setY(1.2)),this.ctx.addScore(500,ui.copy(this.pos).setY(1.8),"OSHA VIOLATION!","#9fe8ff")))}}dispose(){this.root.removeFromParent(),this.rig.mesh.geometry.dispose(),this.rig.mat.dispose()}}const ai=new T,Di=new T;class l1 extends Jl{bs="seated";bt=0;started=!1;desk=new pe;deskHome=new T(0,.15,-15.3);extras=[];heart;plates=[];heartMat=new Wt({color:16719904});exposed=!1;heartDmg=0;actT=0;summonT=12;summoned75=!1;moveTo=new T;leapFrom=new T;grown=1;done=!1;bossName="C.E.O. — CHIEF EXECUTIVE ORGANISM";onSpawn=null;onDefeat=null;deskProjectile=!1;says=[];constructor(t,e,i){super({type:"ceo",x:0,z:-16.55,rot:0,act:"write",seated:!0,delay:0},t),this.root.position.y=.15,this.hp=this.maxHp=150,this.pts=25e3,this.rig.mesh.userData.zombie=void 0,this.rig.mesh.userData.boss=this,e.add(this.root),this.desk.position.copy(this.deskHome),e.add(this.desk);const n=(b,S,v,R,w,C,_)=>{const E=new Vt(new Yt(S,v,R),b);return E.position.set(w,C,_),E.userData.static=!0,this.desk.add(E),E};n(i.darkWood,3.4,.09,1.5,0,.78,0),n(i.darkWood,3.2,.72,1.1,0,.37,-.1);const r=new Jt({color:11569728,shininess:120,specular:16769184});n(r,3.42,.03,1.52,0,.83,0);const a=new Vt(new _e(.7,.16),new Wt({map:li("C.E.O.","","#ffd070","#1a1206",256,64)}));a.position.set(0,.6,.351+.1),this.desk.add(a);const o=new Jn(.6,.85,-15.5,Math.PI,!0);this.desk.attach(o.group);const l=new $l(-1.3,.98,-15.6,Math.PI+.3);this.desk.attach(l.group);const c=new hn(1.4,.98,-15.1,0,"WORLD'S #1 CEO");this.desk.attach(c.group);const u=new gr(-.6,.98,-15.2,Math.PI);this.desk.attach(u.group),new Fi(0,-17.1,0,!0);const f=this.rig.bones.chest,h=this.rig.bones.head,d=this.rig.bones.jaw,g=new te({color:5900810}),y=new te({color:14735552}),m=(b,S,v,R,w,C,_,E,P="body")=>{const I=new Vt(new Yt(v,R,w),S);return I.position.set(C,_,E),I.visible=!1,I.userData.boss=this,I.userData.part=P,b.add(I),this.extras.push(I),I};m(f,g,.26,.26,.02,0,.11,.125);for(let b=0;b<4;b++)m(f,y,.3,.025,.03,0,0+b*.065,.14);this.heart=new Vt(new Bs(.075,12,10),this.heartMat),this.heart.position.set(0,.1,.15),this.heart.visible=!1,this.heart.userData.boss=this,this.heart.userData.part="heart",f.add(this.heart),this.extras.push(this.heart);const p=new Jt({color:2763310,shininess:90,specular:8947848});for(const b of[-1,1]){const S=new pe;S.position.set(.14*b,.1,.17),f.add(S);const v=new Vt(new Yt(.15,.28,.03),p);v.position.set(-.075*b,0,0),v.visible=!1,v.userData.boss=this,v.userData.part="plate",S.add(v),this.plates.push(v),this.extras.push(v)}for(let b=0;b<4;b++){const S=m(f,y,.04,.04,.25,(b-1.5)*.08,.05+b%2*.08,-.22);S.rotation.x=-.5}for(let b=0;b<6;b++)m(d,y,.025,.05,.02,-.075+b*.03,1.66-1.63,.13,"head");for(const b of[-1,1])m(h,new Wt({color:16724e3}),.03,.02,.01,b*.04,1.81-1.56,.125,"head");m(h,g,.24,.06,.02,0,.1,.12,"head")}get alive(){return!this.done&&this.bs!=="defeat"}start(){this.started||(this.started=!0,this.bs="intro",this.bt=0,this.says=[[2.4,"..."],[3.6,'"Ah. My 2 A.M. appointment."'],[6.6,`"Let's discuss your... SEVERANCE PACKAGE."`]])}setExposed(t){this.exposed=t;for(const[e,i]of this.plates.entries())i.parent.rotation.y=t?e===0?1.3:-1.3:0}transform(){this.bs="transform",this.bt=0,H.roar(),this.ctx.shake(.6),this.ctx.message('"YOUR POSITION HAS BEEN... ELIMINATED!"',2.5,"#ff4040");const t=this.rig.bones.chest.getWorldPosition(ai);this.ctx.fx.debris(t,18,789520,.12,4),this.ctx.fx.blood(t,Di.set(0,1,.5),40,!0)}hit(t,e,i){const n=this.ctx.fx;if(this.bs==="seated"||this.bs==="intro")return H.flesh(!1),n.blood(e,ai.copy(i).multiplyScalar(-.5),8),this.ctx.message('"HOW RUDE."',1.5,"#ff6060"),this.transform(),{killed:!1,pts:50,head:t==="head"};if(this.bs==="defeat"||this.bs==="done"||this.bs==="transform")return n.blood(e,ai.copy(i).multiplyScalar(-.5),6),{killed:!1,pts:0,head:!1};if(t==="plate")return n.sparks(e,ai.copy(i).multiplyScalar(-1),10),H.ricochet(),{killed:!1,pts:5,head:!1};let r=t==="head"?2:1;return t==="heart"?(r=this.exposed?4:1,this.heartDmg+=r,n.blood(e,ai.copy(i).multiplyScalar(-.5),20,!0),H.flesh(!0),this.ctx.popup(e,this.exposed?"CRITICAL!":"HIT","#ff6060")):(n.blood(e,ai.copy(i).multiplyScalar(-.5).add(Di.set(0,.4,0)),10),H.flesh(t==="head")),this.hitFlash=.1,this.flinch=-.15,this.flinchY=(Math.random()-.5)*.3,this.hp=Math.max(0,this.hp-r),this.ctx.bossBar(this.bossName,this.hp/this.maxHp),this.hp<=0&&this.defeat(),{killed:!1,pts:t==="heart"?60:t==="head"?40:20,head:t==="head"}}defeat(){this.bs="defeat",this.bt=0,this.setExposed(!0),this.ctx.bossBar(null,0),this.ctx.message('"NO... MY GOLDEN PARACHUTE...!"',3,"#ffd060"),H.roar(),this.ctx.shake(.5);for(const t of bt.zombies())t!==this&&t.alive&&t.die("boss")}throwAt(t,e,i){const n=this.rig.bones.fArmR.getWorldPosition(ai).clone();this.ctx.throwProjectile(n,t,e,i),H.swipe()}summon(t,e){if(this.onSpawn){this.ctx.message(t==="security"?'"SECURITY!"':'"BOARD MEMBERS! TO ME!"',1.8,"#ffb050");for(let i=0;i<e;i++){const n=i%2===0?-1:1;this.onSpawn({type:t,x:n*(6+Math.random()),z:-21+Math.random(),rot:0,act:"stand",delay:.2+i*.4,rush:t==="security"})}}}update(t){this.bt+=t,this.t+=t;const e=this.ctx,i=e.camera.position;this.hitFlash>0&&(this.hitFlash-=t,this.rig.mat.emissive.setRGB(this.hitFlash>0?.5:0,0,0)),this.flinch*=Math.max(0,1-t*7),this.flinchY*=Math.max(0,1-t*6);const n=.5+.5*Math.sin(this.t*(this.bs==="p3"?14:8));this.heartMat.color.setRGB(.6+n*.4+(this.exposed?.2:0),n*(this.exposed?.5:.1),n*.1),this.heart.scale.setScalar(1+n*(this.exposed?.35:.1));for(const o of this.says)o[0]>0&&this.bt>=o[0]&&this.bs==="intro"&&(e.message(o[1],2.2,"#ffd0a0"),o[0]=-1);let r=!0;switch(this.bs){case"seated":this.state="work";break;case"intro":{this.state="work",this.bt>2.2&&this.bt<5.5&&(this.state="notice",this.stateT=(this.bt-2.2)*.5),this.bt>5.5&&(this.seated=!1,this.state="rise",this.stateT=0),this.bt>8&&this.transform();break}case"transform":{if(this.state="attack",this.windup=Math.min(1,this.bt/.8),this.striking=0,this.grown=1+Math.min(1,this.bt/1.6)*.75,this.root.scale.setScalar(this.grown),this.rig.bones.fArmL.scale.y=this.rig.bones.fArmR.scale.y=1+Math.min(1,this.bt/1.6)*.4,this.rig.bones.jaw.scale.set(1.3,1.6,1.3),this.bt>.4)for(const o of this.extras)o.visible=!0;Math.random()<.3&&e.shake(.15),this.bt>2&&(this.bs="p1",this.bt=0,this.windup=0,this.actT=1.2,e.bossBar(this.bossName,this.hp/this.maxHp),e.message("PHASE 1 — QUARTERLY REVIEW",2,"#ff8080"),H.setMusic("boss"));break}case"p1":{if(this.state="throw",this.actT-=t,this.windup>0){if(this.windup+=t/.55,this.windup>=1){this.windup=0,this.striking=.25;const o=["paperweight","trophy","pen"];this.throwAt(o[Math.floor(Math.random()*3)],1.35,Di.set((Math.random()-.5)*.5,0,0).clone()),this.actT=1.6+Math.random()*.6}}else this.striking>0?this.striking-=t:this.actT<=0&&(this.windup=.01);this.summonT-=t,this.summonT<=0&&(this.summonT=16,this.summon("security",2)),this.pos.x=Math.sin(this.t*.6)*1.2,this.hp<=100&&(this.bs="deskLift",this.bt=0,this.heartDmg=0,this.windup=0,this.striking=0,this.setExposed(!0),e.message('"HOSTILE TAKEOVER!" — SHOOT THE HEART!',2.6,"#ff4040"),H.roar(),H.warning());break}case"deskLift":{this.state="attack",this.windup=1,this.striking=0,this.pos.x*=.9;const o=Math.min(1,this.bt/1.2);if(this.desk.position.set(this.deskHome.x,this.deskHome.y+o*2.2,this.deskHome.z-o*.4),this.desk.rotation.x=-o*.3,this.bt>.2&&Math.floor(this.bt*2)!==Math.floor((this.bt-t)*2)&&e.warn(this.heart.getWorldPosition(ai),.6),this.heartDmg>=8)this.bs="stagger",this.bt=0,this.setExposed(!1),this.desk.position.copy(this.deskHome).setY(0),this.desk.rotation.set(.15,.2,.08),H.thud(),H.glass(!0),e.shake(.5),e.fx.debris(ai.copy(this.deskHome).setY(.8),20,2758413,.12,4),e.fx.dust(ai.copy(this.deskHome).setY(.3),Di.set(0,1,0),.5),e.addScore(2e3,ai.copy(this.deskHome).setY(1.5),"TAKEOVER BLOCKED!","#80ff80");else if(this.bt>3){this.bs="deskThrown",this.bt=0,this.setExposed(!1),this.windup=0,this.striking=.4;const l=this.desk;l.removeFromParent(),this.ctx.scene.updateMatrixWorld(),e.throwProjectile(l.position.clone(),"desk",.95,void 0,l),H.roar()}break}case"deskThrown":this.state="attack",this.bt>1.4&&this.toLeap();break;case"stagger":{this.state="slip",this.stateT=Math.min(this.bt,.35),this.bt>2&&(this.root.rotation.x=0,this.toLeap());break}case"leap":{this.state="move";const o=Math.min(1,this.bt/.9);this.pos.lerpVectors(this.leapFrom,this.moveTo,o),this.pos.y=Math.sin(o*Math.PI)*2,o>=1&&(this.pos.copy(this.moveTo),this.pos.y=0,H.thud(),e.shake(.4),e.fx.dust(this.pos.clone().setY(.1),Di.set(0,1,0),.5),this.bs=this.hp>50?"p2":"p3",this.bt=0,this.actT=1.5,this.bs==="p2"&&e.message("PHASE 2 — PERFORMANCE REVIEW",2,"#ff8080"));break}case"p2":{this.state="move",this.phase+=t*4;const o=Math.sin(this.t*.7)*4;if(this.pos.x+=Ps.clamp(o-this.pos.x,-1,1)*t*2.5,this.pos.z+=(-10-this.pos.z)*t*2,this.actT-=t,!this.summoned75&&this.hp<75&&(this.summoned75=!0,this.summon("executive",2)),this.actT<=0){if(Math.random()<.55)this.bs="lunge",this.bt=0,this.heartDmg=0,this.setExposed(!0),H.roar();else{this.state="throw";for(let l=0;l<3;l++)this.throwAt("pen",1+l*.18,new T((l-1)*.5,0,0));this.actT=2.6}this.bs==="lunge"&&(this.actT=3)}this.hp<=50&&(this.bs="p3",this.bt=0,this.setExposed(!0),e.message("FINAL PHASE — GOLDEN PARACHUTE!",2.4,"#ffd060"),H.roar(),e.shake(.5),this.actT=1);break}case"lunge":{const o=ai.set(i.x+(this.pos.x-i.x)*.3,0,i.z-2.3);this.bt<.8?(this.state="move",this.phase+=t*9,this.pos.lerp(o,Math.min(1,t*3))):(this.state="attack",this.windup=Math.min(1,(this.bt-.8)/1.25),this.striking=0,Math.floor(this.bt*2.5)!==Math.floor((this.bt-t)*2.5)&&e.warn(this.heart.getWorldPosition(Di),.5),this.heartDmg>=4+(this.bs==="lunge"?0:2)?(this.windup=0,this.setExposed(!1),this.bs="stagger",this.bt=0,H.roar(),e.addScore(500,this.heart.getWorldPosition(Di),"INTERRUPTED!","#80ff80"),this.moveTo.set((Math.random()-.5)*6,0,-10)):this.windup>=1&&(this.windup=0,this.striking=.4,H.swipe(),e.playerHit(1,"ceo"),this.setExposed(!1),this.bs=this.hp>50?"p2":"p3",this.bt=0,this.actT=2.2));break}case"p3":{this.setExposed(!0),this.actT-=t;const o=this.pos.distanceTo(this.moveTo);if(o>.3?(this.state="move",this.rusher=!0,this.phase+=t*14,this.pos.addScaledVector(ai.copy(this.moveTo).sub(this.pos).normalize(),Math.min(o,t*6.5))):this.state="throw",this.actT<=0){const l=Math.random();if(l<.3)this.bs="charge",this.bt=0,this.heartDmg=0,H.roar(),e.message(`"YOU'RE FIRED!!"`,1.4,"#ff4040");else if(l<.65)this.moveTo.set((Math.random()-.5)*12,0,-8-Math.random()*7),this.actT=1;else{for(let c=0;c<3;c++)this.throwAt("bile",1.15,new T((c-1)*.7,(Math.random()-.5)*.3,0));this.actT=1.8}}Math.random()<t*.4&&e.shake(.1);break}case"charge":{if(this.bt<1.1)this.state="attack",this.windup=this.bt/1.1,Math.floor(this.bt*3)!==Math.floor((this.bt-t)*3)&&e.warn(this.heart.getWorldPosition(Di),.4);else{this.state="move",this.rusher=!0,this.phase+=t*16,this.windup=0;const o=ai.set(i.x,0,i.z-1.6);if(this.pos.addScaledVector(Di.copy(o).sub(this.pos).setY(0).normalize(),t*7.5),this.heartDmg>=6){this.bs="stagger",this.bt=0,e.addScore(800,this.heart.getWorldPosition(Di),"STOPPED COLD!","#80ff80"),this.moveTo.set((Math.random()-.5)*8,0,-11);break}Math.hypot(this.pos.x-o.x,this.pos.z-o.z)<.4&&(e.playerHit(2,"ceo"),H.swipe(),this.striking=.3,this.bs="p3",this.bt=0,this.actT=1.2,this.moveTo.set((Math.random()-.5)*10,0,-12))}break}case"defeat":{this.state="slip",this.stateT=0,this.root.rotation.x=0,this.rusher=!1;const o=this.bt;if(this.flinch=Math.sin(this.t*20)*.2,o<2.8)this.state="stagger",this.phase+=t*3,this.pos.x+=(0-this.pos.x)*t*.8,this.pos.z+=(-22.6-this.pos.z)*t*.9,Math.random()<.2&&e.fx.blood(this.rig.bones.chest.getWorldPosition(ai),Di.set(0,1,.5),6);else{if(!this.deskProjectile){this.deskProjectile=!0;for(const l of bt.props)l instanceof Tu&&Math.abs(l.group.position.z+24)<.5&&Math.abs(l.group.position.x-this.pos.x)<4&&l.shatter();H.glass(!0),H.roar(),e.shake(.6),H.thunder()}r=!1,this.root.rotation.x=-Math.min(1.6,(o-2.8)*2.5),this.pos.z-=t*3,o>3.3&&(this.pos.y-=t*(o-3.3)*18),o>5.2&&(this.bs="done",this.done=!0,this.root.visible=!1,this.onDefeat&&this.onDefeat())}break}}if(this.state==="move"&&Math.random()<t*2&&H.step(),r&&this.bs!=="seated"&&this.bs!=="intro"){this.targetYaw=Math.atan2(i.x-this.pos.x,i.z-this.pos.z);let o=this.targetYaw-this.yaw;for(;o>Math.PI;)o-=Math.PI*2;for(;o<-Math.PI;)o+=Math.PI*2;this.yaw+=o*Math.min(1,t*5),this.root.rotation.y=this.yaw}(this.bs==="seated"||this.bs==="intro")&&this.bt>5.5&&this.bs==="intro"&&(this.pos.z+=(-16.2-this.pos.z)*t*2),this.computePose(t),(this.bs==="transform"||this.bs==="p3")&&this.s("jaw",.8+Math.sin(this.t*12)*.2);const a=Math.min(1,t*10);for(let o=0;o<this.cur.length;o++)this.cur[o]+=(this.tgt[o]-this.cur[o])*a;this.rootY+=(this.rootYT-this.rootY)*Math.min(1,t*4),this.rootX+=(this.rootXT-this.rootX)*Math.min(1,t*8),this.applyPose()}toLeap(){this.bs="leap",this.bt=0,this.root.rotation.x=0,this.leapFrom.copy(this.pos),this.moveTo.set((Math.random()-.5)*4,0,-10),H.roar()}}const ma=[{id:"floor-1-lobby",name:"WELCOME TO THE COMPANY",floor:"L",sub:"LOBBY & RECEPTION"},{id:"floor-12-hr",name:"HUMAN RESOURCES",floor:"12",sub:"CUBICLES & BREAK ROOM"},{id:"floor-27-management",name:"MIDDLE MANAGEMENT",floor:"27",sub:"CONFERENCE ROOMS"},{id:"floor-48-executive",name:"EXECUTIVE FLOOR",floor:"48",sub:"LUXURY OFFICES"},{id:"floor-ph-ceo",name:"THE C.E.O.",floor:"PH",sub:"PENTHOUSE OFFICE"}];function He(s,t=16777215){return new te({map:s,color:t})}function Te(s,t=16777215,e=80,i=3355443){return new Jt({map:s,color:t,shininess:e,specular:i})}function br(s=!1){return{deskTop:s?Te(es("#2a170d"),16777215,90,4469538):He(null,9077880),deskLeg:He(null,3815998),keyboard:He(null,1842208),paper:He(null,15263454),cubicle:He(null,5923440),trim:Te(null,2763568,40),darkWood:Te(es("#2a170d"),16777215,90,4469538)}}function Sr(s,t){const e=[];for(let i=0;i<4;i++){const n=t[i]??[0,-50,0,0,0],r=new Yn(n[3],n[4],11,1.6);r.position.set(n[0],n[1],n[2]),s.add(r),e.push(r)}return e}class c1{constructor(t){this.ctx=t,this.kit=new $x(this.root),Zx(),bt.root=this.root}ctx;root=new pe;kit;zombies=[];script=[];glass=[];z(t,e,i){const n=new Jl(i,this.ctx);return n.group=t,n.wave=e,this.root.add(n.root),this.zombies.push(n),n}move(t,e,i){this.script.push({t:"move",to:t,look:e,dur:i})}fight(t,e=0,i){this.script.push({t:"fight",group:t,calm:e,msg:i})}}function h1(s){const t=s.kit,e=br(),i=Te(mr("#2a2b30","rgba(200,200,210,"),16777215,120,6710903),n=He(Fa("#3a3b40")),r=Te(mr("#c8c2b8","rgba(60,50,45,",!1),16777215,60,3355443),a=He(Zl(),6974064),o=6;t.floor(i,-9,-31,9,5,0,3),t.floor(a,-9,-31,9,5,o,4,!0),t.wall(n,-9,5,-9,-31,o,0,3),t.wall(n,9,-31,9,5,o,0,3),t.wall(n,-9,-31,-.7,-31,o,0,3),t.wall(n,.7,-31,9,-31,o,0,3),t.wall(n,-.7,-31,.7,-31,o-2.6,2.6,3),t.windowWall(9,5,-9,5,o,e,1,.05);for(const[h,d]of[[-5,-3],[5,-3],[-5,-13],[5,-13],[-5,-22],[5,-22]])t.box(r,.9,o,.9,h,o/2,d,0,1.5);const l=Te(es("#1c120c"),16777215,60);t.box(l,6,1.1,.8,0,.55,-8,0,1),t.box(r,6.2,.06,1,0,1.13,-8),t.box(e.trim,5,4,.3,0,2,-11.5,0),t.sign(li("SYNERGEX","SYNERGY · EXCELLENCE · FOREVER","#d8d0c0","#101014",1024,256),4.6,1.15,0,3,-11.33,0);for(const h of[-1.5,1.5])new Jn(h,1.16,-8.2,Math.PI);new gr(.6,1.16,-8.1,Math.PI),new hn(-2.4,1.16,-7.8,0),new hn(2.6,1.16,-7.9,0,"WORLD'S OKAYEST RECEPTIONIST"),new $l(-2.8,1.16,-8.1,Math.PI),new Mr(0,4.6,-11.33,0);const c=Te(null,2759188,50);t.box(c,2.6,.45,.8,6.8,.225,-6,Math.PI/2),t.box(c,2.6,.5,.2,7.6,.6,-6,Math.PI/2),t.box(c,2.6,.45,.8,-6.8,.225,-6,Math.PI/2),t.box(c,2.6,.5,.2,-7.6,.6,-6,Math.PI/2),t.box(e.trim,.8,.4,.8,6.8,.2,-8.3),new an(6.8,.4,-8.3,8002074),new Ee(-8.2,1.5,1.2),new Ee(8.2,1.5,1.2),new Ee(-8.2,-10,1.3),new Ee(8.2,-10.5,1.3),new fn(8.4,-2.5,-Math.PI/2),new cr(-5,3.2,-2.52,0,.8,1.4,li("BUY","MORE","#3ff7ff","#120a22",256,448)),new cr(5,3.2,-2.52,0,.8,1.4,li("WORK","HARDER","#ff3fa4","#160814",256,448)),new cr(-8.85,3.5,-16,Math.PI/2,3,1.6,li("SYNERGEX","WE OWN TOMORROW","#ffb43f","#0d0a14",768,410)),t.box(l,3,1.05,.8,-5.5,.525,-15.2,0,1),t.box(r,3.1,.05,.9,-5.5,1.07,-15.2),new Jn(-6.1,1.1,-15.4,Math.PI),new Jn(-5,1.1,-15.4,Math.PI),new gr(-4.3,1.1,-15.1,Math.PI);for(let h=-2;h<=2;h++)t.box(e.trim,.25,1,1,h*1.1,.5,-17,0);new vr(-8.88,1.5,-18.5,Math.PI/2),new _r(4.55,.9,-13,-Math.PI/2),new yr(8.88,1.5,-15,-Math.PI/2);const u=h=>{t.box(e.trim,1.4,2.4,.1,h,1.2,-30.9),t.box(Te(null,9080984,100,11184810),1.1,2.25,.05,h,1.125,-30.84)};u(-3.5),u(3.5),new Ta(-8.4,-25,Math.PI/2),new Ta(-8.4,-26.1,Math.PI/2),new fn(8.4,-24.5,-Math.PI/2),t.box(c,2.2,.45,.6,-4.2,.225,-25.5,0),new Ee(-2.2,-30.3,1.1),new Ee(2.2,-30.3,1.1),new Yi(6,-19,.4,1,.9),Sr(s.root,[[0,5,-6,16769200,9],[-5,5,-16,13162751,7],[0,4.5,-26,16771272,8],[0,5,2,10467583,5]]);for(const[h,d]of[[-2.5,-4],[2.5,-4],[-2.5,-14],[2.5,-14],[-2.5,-24],[2.5,-24]])new Oa(h,o-.4,d,0,null,Math.random()<.3,!1);t.finalize();const f=new On(s.root,0,-31,0);return f.setDisplay("L",0),s.z("g1",0,{type:"receptionist",x:0,z:-8.8,rot:0,act:"phone",delay:.4,path:[[3.4,-8.9],[3.3,-6.5]]}),s.z("g1",0,{type:"worker",x:-3.2,z:-6.5,rot:Math.PI,act:"stand",delay:1.2}),s.z("g1",0,{type:"worker",x:6.6,z:-5.6,rot:-Math.PI/2,act:"phone",seated:!0,delay:2}),s.z("g1",1,{type:"worker",x:-8,z:-12.5,rot:Math.PI/2,act:"stand",delay:.2,path:[[-3.5,-9.5]]}),s.z("g1",1,{type:"accountant",x:8,z:-13,rot:-Math.PI/2,act:"stand",delay:.8,path:[[3.6,-9.8]]}),s.z("g2",0,{type:"security",x:-5.5,z:-16,rot:0,act:"guard",delay:.8,path:[[-3.6,-16.1],[-3.2,-14]]}),s.z("g2",0,{type:"security",x:-6.6,z:-16,rot:0,act:"type",delay:1.6,path:[[-3.6,-16.3],[-3.2,-14]]}),s.z("g2",0,{type:"worker",x:2.2,z:-18.5,rot:Math.PI,act:"stand",delay:.4,path:[[2.75,-16.5]]}),s.z("g2",1,{type:"worker",x:-2,z:-24,rot:0,act:"stand",delay:.1,path:[[-2.75,-17.5],[-2,-14]]}),s.z("g2",1,{type:"intern",x:1,z:-22,rot:0,act:"crawl",delay:.3,path:[[.55,-17.5]]}),s.z("g3",0,{type:"worker",x:-.5,z:-29.5,rot:Math.PI,act:"stand",delay:1}),s.z("g3",0,{type:"receptionist",x:.6,z:-29.6,rot:Math.PI,act:"stand",delay:1.8}),s.z("g3",0,{type:"worker",x:-7.4,z:-25.5,rot:-Math.PI/2,act:"copier",delay:.6}),s.z("g3",0,{type:"security",x:7.5,z:-24.6,rot:Math.PI/2,act:"cooler",delay:1.4,facePartner:0}),s.z("g3",1,{type:"manager",x:3.5,z:-30.3,rot:0,act:"stand",delay:.2,throws:!0}),s.z("g3",1,{type:"intern",x:-3.5,z:-30.2,rot:0,act:"crawl",delay:.6}),s.script.push({t:"msg",text:"FLOOR L — WELCOME TO THE COMPANY",dur:2.6}),s.move([0,1.65,.5],[0,1.4,-9],3.2),s.fight("g1",1.5,"THE NIGHT SHIFT IS STILL WORKING..."),s.move([3.9,1.65,-6.5],[-1,1.3,-14],2.2),s.move([3.6,1.65,-12.6],[-2.5,1.3,-16.5],2),s.fight("g2",1),s.move([3,1.65,-17.6],[0,1.4,-26],2),s.move([.3,1.65,-20.5],[0,1.35,-28],1.8),s.fight("g3",1.2),{dep:f,arr:null,start:{pos:new T(0,1.65,4),look:new T(0,1.5,-8)}}}function u1(s){const t=s.kit,e=br(),i=He(Kl("#2e3440")),n=Te(mr("#b8b4aa","rgba(90,90,90,"),16777215,60),r=He(Fa("#6a6c70")),a=He(bu()),o=3;t.floor(i,-10,-35,10,0,0,2),t.floor(n,3,-25,10,-16,.002,1.2),t.floor(a,-10,-35,10,0,o,1.2,!0),t.wall(r,-.7,0,-10,0,o),t.wall(r,10,0,.7,0,o),t.wall(r,-.7,0,.7,0,.4,2.6),t.wall(r,-10,0,-10,-35,o),t.wall(r,-10,-35,-.7,-35,o),t.wall(r,.7,-35,10,-35,o),t.wall(r,-.7,-35,.7,-35,.4,2.6),t.windowWall(10,-35,10,-25,o,e,1),t.windowWall(10,-16,10,0,o,e,1),t.wall(r,10,-25,10,-16,o),t.sign(li("HUMAN RESOURCES","YOU ARE OUR MOST VALUABLE ASSET","#e8e3d8","#1d2a3a",1024,200),3,.6,-5,2.2,-.09,Math.PI);const l=[-6.6,-4.4,4.4,6.6];for(const g of l)s.zombies,t.desk(e,g,-4.4,0,{chair:!0,lamp:Math.random()<.4}),t.cubicleWalls(e,g+.75,-4.6,0,.06,1.6);const c=[-6.6,-4.4,4.4,6.6];for(const g of c)t.desk(e,g,-8.2,Math.PI,{chair:!0,lamp:Math.random()<.4});t.box(e.cubicle,4.6,1.05,.06,-5.5,.525,-6.3),t.box(e.cubicle,4.6,1.05,.06,5.5,.525,-6.3);const u=[-6.6,-4.4];for(const g of u)t.desk(e,g,-12.5,0,{chair:!0});new In(-9.6,-3.5,Math.PI/2),new In(-9.6,-4.1,Math.PI/2),new In(-9.6,-9.8,Math.PI/2),new Mr(-9.9,2.2,-7,Math.PI/2),new Sl(-8.8,0,-15.5,Math.PI/2,!0),t.box(e.trim,.8,.75,.6,-9.4,.375,-13.6),new Sl(-9.4,.75,-13.6,Math.PI/2),new In(-9.6,-17.5,Math.PI/2),new In(-9.6,-18.1,Math.PI/2),new Ee(-1.6,-1.2,.9),new Ee(1.6,-1.2,.9),new _r(-9.85,.9,-11.5,Math.PI/2),new yr(-9.88,1.5,-22,Math.PI/2),t.wall(r,-10,-20,-3,-20,o),t.wall(r,-3,-20,-3,-23,o),t.wall(r,-3,-24.4,-3,-30,o),t.box(e.trim,.06,2.2,1.4,-3,1.1,-23.7),s.glass.push(...t.glassWall(3,-16,3,-19.5,o-.3,1.2)),s.glass.push(...t.glassWall(3,-21,3,-25,o-.3,1.35)),t.box(e.trim,.1,.3,9,3,o-.15,-20.5),t.wall(r,3,-25,10,-25,o),t.wall(r,3,-16,10,-16,o,0,2,.1);const f=Te(null,4211784,60);t.box(f,3.4,.9,.6,7.8,.45,-24.4),t.box(Te(null,14210248,90),3.5,.04,.65,7.8,.92,-24.4),new qx(8.6,.94,-24.45,0),new hn(7.2,.94,-24.3,0),new hn(7.5,.94,-24.5,0,"I ❤ MONDAYS"),new Ta(9.45,-21.4,-Math.PI/2),new fn(5.2,-24.55,0),t.box(Te(null,13157560,50),1.6,.04,.9,6.8,.74,-19.4),t.box(e.deskLeg,.08,.72,.08,6.8,.36,-19.4),new Fi(6,-19.4,Math.PI/2),new Fi(7.6,-19.4,-Math.PI/2),new hn(6.6,.76,-19.3,0),new vr(-9.88,1.5,-26.5,Math.PI/2),new Ee(-9,-33.8,1.2),new Ee(9,-33.8,1.2),new fn(-6,-34.6,0),t.box(e.trim,1.4,2.4,.1,3.5,1.2,-34.9),t.box(Te(null,9080984,100,11184810),1.1,2.25,.05,3.5,1.125,-34.84),Sr(s.root,[[-4,2.6,-6,15266047,6],[5,2.6,-7,15266047,6],[6.5,2.6,-20.5,16773336,7],[0,2.6,-30,14213375,5]]),t.ceilingLights([-5.5,0,5.5],[-3,-9,-15,-21,-27,-32],o,[],.25),t.finalize();const h=new On(s.root,0,0,Math.PI);h.setDisplay("12",0);const d=new On(s.root,0,-35,0);return d.setDisplay("12",0),s.z("g1",0,{type:"worker",x:-4.4,z:-3.675,rot:Math.PI,act:"type",seated:!0,delay:2.4}),s.z("g1",0,{type:"worker",x:4.4,z:-3.675,rot:Math.PI,act:"type",seated:!0,delay:.8}),s.z("g1",0,{type:"accountant",x:-6.6,z:-8.925,rot:0,act:"spreadsheet",seated:!0,delay:1.6,path:[[-5.5,-7],[-2.2,-6.2]]}),s.z("g1",0,{type:"worker",x:6.6,z:-8.925,rot:0,act:"phone",seated:!0,delay:3,path:[[5.5,-7],[2.2,-6.2]]}),s.z("g1",0,{type:"receptionist",x:-9,z:-3.8,rot:-Math.PI/2,act:"filing",delay:1.2}),s.z("g1",1,{type:"worker",x:6.6,z:-3.675,rot:Math.PI,act:"type",seated:!0,delay:.5}),s.z("g1",1,{type:"worker",x:.5,z:-12,rot:0,act:"stand",delay:.2}),s.z("g2",0,{type:"worker",x:-7.9,z:-15.5,rot:-Math.PI/2,act:"copier",delay:.6}),s.z("g2",0,{type:"accountant",x:-4.4,z:-11.775,rot:Math.PI,act:"spreadsheet",seated:!0,delay:1.5,path:[[-2.5,-11.5]]}),s.z("g2",0,{type:"receptionist",x:-8.9,z:-17.8,rot:-Math.PI/2,act:"filing",delay:2.2}),s.z("g2",1,{type:"manager",x:-6.5,z:-21,rot:Math.PI,act:"stand",delay:.1,path:[[-2.2,-19.5]],throws:!0,hidden:!0}),s.z("g2",1,{type:"intern",x:-2,z:-21,rot:Math.PI,act:"crawl",delay:.4}),s.z("g3",0,{type:"worker",x:4.7,z:-23.6,rot:Math.PI/2,act:"cooler",delay:2.2,facePartner:0}),s.z("g3",0,{type:"receptionist",x:5.8,z:-23.6,rot:-Math.PI/2,act:"cooler",delay:3,facePartner:0}),s.z("g3",0,{type:"worker",x:7.6,z:-18.85,rot:Math.PI,act:"spreadsheet",delay:1}),s.z("g3",0,{type:"manager",x:8.8,z:-23.6,rot:Math.PI,act:"copier",delay:1.6,throws:!0}),s.z("g3",1,{type:"worker",x:9,z:-17.5,rot:-Math.PI/2,act:"stand",delay:.3}),s.z("g4",0,{type:"manager",x:-1,z:-34.2,rot:Math.PI,act:"stand",delay:1.2}),s.z("g4",0,{type:"worker",x:-5.6,z:-33.8,rot:Math.PI,act:"cooler",delay:.6}),s.z("g4",0,{type:"security",x:3.5,z:-33.6,rot:Math.PI,act:"guard",delay:2}),s.z("g4",1,{type:"worker",x:-3.5,z:-23.7,rot:-Math.PI/2,act:"stand",delay:.2,path:[[-1.5,-24.5]]}),s.z("g4",1,{type:"worker",x:-6,z:-22,rot:-Math.PI/2,act:"stand",delay:1,path:[[-3.5,-23.7],[-1.5,-25]],hidden:!0}),s.move([0,1.65,-.9],[0,1.4,-8],1.6),s.fight("g1",2.4,"NOBODY LEAVES BEFORE 5 P.M."),s.move([0,1.65,-10.2],[-5,1.3,-15.5],3.4),s.fight("g2",1),s.move([.6,1.65,-18.2],[5.6,1.25,-22.6],3.2),s.fight("g3",1.8,"BREAK ROOM — THE WATER COOLER IS FULL..."),s.move([0,1.65,-27.5],[0,1.35,-34],3.4),s.fight("g4",1),{dep:d,arr:h,start:{pos:new T(0,1.65,1.25),look:new T(0,1.5,-6)}}}function f1(s){const t=s.kit,e=br(),i=He(Kl("#3a2f2c")),n=He(Fa("#5d5a56")),r=He(bu()),a=3;t.floor(i,-11,-40,11,0,0,2),t.floor(r,-11,-40,11,0,a,1.2,!0),t.wall(n,-.7,0,-11,0,a),t.wall(n,11,0,.7,0,a),t.wall(n,-.7,0,.7,0,.4,2.6),t.wall(n,-11,0,-11,-40,a),t.wall(n,-11,-40,-6.7,-40,a),t.wall(n,-5.3,-40,11,-40,a),t.wall(n,-6.7,-40,-5.3,-40,.4,2.6),t.windowWall(11,-40,11,-24,a,e,1),t.wall(n,11,-24,11,0,a),t.wall(n,2.5,0,2.5,-3.5,a),t.wall(n,-2.5,0,-2.5,-13,a),s.glass.push(...t.glassWall(2.5,-3.5,2.5,-12.5,a-.3,1.5)),t.box(e.trim,.1,.3,9,2.5,a-.15,-8),t.wall(n,2.5,-12.5,11,-12.5,a);const o=Te(es("#3a2414"),16777215,70);t.box(o,2,.06,5.2,6.8,.74,-8),t.box(e.deskLeg,1.4,.7,4.4,6.8,.36,-8),t.sign(li("Q4 SYNERGY","LEVERAGING DEAD-END PARADIGMS","#fff","#2050a0",512,256),2.4,1.2,10.9,1.7,-8,-Math.PI/2);for(let u=0;u<3;u++)new Fi(5.45,-6.3-u*1.7,Math.PI/2),new Fi(8.15,-6.3-u*1.7,-Math.PI/2);for(let u=0;u<3;u++)new hn(6.3,.77,-6.4-u*1.6,0);new Jn(7.3,.77,-10.5,-Math.PI/2),new Ee(10.3,-4,1),s.glass.push(...t.glassWall(-2.5,-13,-2.5,-22,a-.3,1.5)),t.box(e.trim,.1,.3,9,-2.5,a-.15,-17.5),t.wall(n,-2.5,-22,-11,-22,a),t.wall(n,-2.5,-13,-11,-13,a,0,2,.1),t.box(o,1.6,.06,4,-6.8,.74,-17.5),t.box(e.deskLeg,1,.7,3.4,-6.8,.36,-17.5);for(let u=0;u<2;u++)new Fi(-7.9,-16.5-u*2,Math.PI/2);new fn(-10.5,-14,Math.PI/2),new Qn(-10.9,1.7,-19,Math.PI/2,1.4,1,1),t.wall(n,2.5,-12.5,2.5,-15.5,a),t.wall(n,2.5,-17,2.5,-22,a),s.glass.push(new Eu(2.5,-16.25,Math.PI/2,1.5,a-.3)),t.wall(n,2.5,-22,11,-22,a),t.desk(e,6.5,-18.4,Math.PI/2,{chair:!0,lamp:!0}),new In(10.5,-14,-Math.PI/2),new Ee(10.3,-21.3,1),new Qn(10.9,1.7,-18,-Math.PI/2,1.2,.9,2),t.wall(n,-2.5,-22,-2.5,-24,a),t.wall(n,2.5,-22,2.5,-24,a),t.desk(e,0,-31.2,Math.PI,{exec:!0,lamp:!0}),new hn(.8,.77,-30.9,0,"WORLD'S BEST BOSS"),new Fi(0,-32.4,0,!0),t.sign(li("REGIONAL MANAGER","THAT'S WHAT SHE SAID","#e8d8a0","#2a1a10",512,128),2.4,.6,0,2.2,-39.88,0),new Yi(-8,-32.5,0,0,.8),new Yi(4.5,-33,0,2,.8),new In(-9,-39.4,0),new In(-8.4,-39.4,0),new Sl(8.5,0,-27,-Math.PI/2,!0),new vr(-10.88,1.5,-29,Math.PI/2),new _r(-10.85,.9,-34,Math.PI/2),new yr(-2.6,1.5,-6,Math.PI/2),new Mr(-2.6,2.3,-9,Math.PI/2),new Ta(-10.4,-25.5,Math.PI/2),new Ee(-10.2,-37.2,1.2),new Ee(10.2,-38.8,1.2),Sr(s.root,[[0,2.6,-6,15266047,5],[6.8,2.6,-8,16773344,7],[-6.8,2.6,-17.5,14215423,6],[0,2.6,-30,16767144,9]]),t.ceilingLights([0],[-3,-9,-15,-21],a,[],.4),t.ceilingLights([6.8],[-6,-10],a,[],.1),t.ceilingLights([-4.5,4.5],[-27,-35],a,[],.3),t.finalize();const l=new On(s.root,0,0,Math.PI);l.setDisplay("27",0);const c=new On(s.root,-6,-40,0);return c.setDisplay("27",0),s.z("g1",0,{type:"manager",x:-.6,z:-6.5,rot:Math.PI/2,act:"pace",delay:.8}),s.z("g1",0,{type:"manager",x:1,z:-9.5,rot:0,act:"phone",delay:1.6,throws:!0}),s.z("g1",0,{type:"worker",x:-9.6,z:-14,rot:-Math.PI/2,act:"cooler",delay:2.5,path:[[-4,-14.5],[-1,-13]]}),s.z("g1",1,{type:"manager",x:-1,z:-14,rot:0,act:"stand",delay:.1,rush:!0}),s.z("g2",0,{type:"manager",x:5.6,z:-6.3,rot:Math.PI/2,act:"meeting",seated:!0,delay:1,facePartner:.4}),s.z("g2",0,{type:"manager",x:5.6,z:-8,rot:Math.PI/2,act:"meeting",seated:!0,delay:1.8,facePartner:.6}),s.z("g2",0,{type:"accountant",x:5.6,z:-9.7,rot:Math.PI/2,act:"meeting",seated:!0,delay:2.6,facePartner:.8}),s.z("g2",0,{type:"manager",x:8,z:-6.3,rot:-Math.PI/2,act:"meeting",seated:!0,delay:1.3,facePartner:-.6,throws:!0,path:[[8.8,-4.6],[4,-4.6]]}),s.z("g2",0,{type:"manager",x:8,z:-9.7,rot:-Math.PI/2,act:"meeting",seated:!0,delay:2.2,facePartner:-.6,path:[[8.8,-11.5],[4,-11.5]]}),s.z("g2",0,{type:"executive",x:10.2,z:-8,rot:-Math.PI/2,act:"pace",delay:3.2,path:[[9.4,-11.6],[4,-11]]}),s.z("g3",0,{type:"manager",x:-6.8,z:-15.3,rot:Math.PI,act:"stand",delay:.6}),s.z("g3",0,{type:"manager",x:-8.2,z:-19,rot:Math.PI/2,act:"meeting",delay:1.4}),s.z("g3",0,{type:"worker",x:6.8,z:-18.4,rot:-Math.PI/2,act:"type",seated:!0,delay:2,path:[[4.2,-16.3],[1.5,-16]]}),s.z("g3",0,{type:"manager",x:-5,z:-20.5,rot:Math.PI,act:"window",delay:2.6,throws:!0}),s.z("g3",1,{type:"security",x:0,z:-26,rot:0,act:"guard",delay:.2}),s.z("g3",1,{type:"intern",x:1,z:-24,rot:0,act:"crawl",delay:.6}),s.z("g4",0,{type:"regional",x:0,z:-32.5,rot:0,act:"phone",delay:2.5}),s.z("g4",0,{type:"manager",x:-4.5,z:-31.6,rot:0,act:"stand",delay:1.2,throws:!0}),s.z("g4",0,{type:"manager",x:4.5,z:-31.6,rot:0,act:"stand",delay:1.8}),s.z("g4",1,{type:"accountant",x:9,z:-29,rot:-Math.PI/2,act:"stand",delay:.5}),s.z("g4",1,{type:"worker",x:-9,z:-27,rot:Math.PI/2,act:"stand",delay:1.5}),s.move([0,1.65,-1],[0,1.4,-8],1.6),s.fight("g1",1.6,"MIDDLE MANAGEMENT IS IN A MEETING..."),s.move([.2,1.65,-6.2],[6.4,1.15,-8.2],2.6),s.fight("g2",2.2,"THIS MEETING COULD HAVE BEEN AN EMAIL"),s.move([0,1.65,-14.6],[-4.5,1.3,-18],3.2),s.fight("g3",1),s.move([0,1.65,-24.2],[0,1.55,-32],3.4),s.fight("g4",2,"THE REGIONAL MANAGER WILL SEE YOU NOW"),s.move([-5,1.65,-33.5],[-6,1.4,-40],2.6),{dep:c,arr:l,start:{pos:new T(0,1.65,1.25),look:new T(0,1.5,-6)}}}function d1(s){const t=s.kit,e=br(!0),i=Te(mr("#ece6dc","rgba(80,70,60,"),16777215,130,7829367),n=He(es("#24140b")),r=He(Fa("#1e1c1e",!1)),a=He(Zl(),3814964),o=Te(null,11569728,120,16769184),l=3.6;t.floor(i,-10,-38,10,0,0,2.5),t.floor(a,-10,-38,10,0,l,3,!0),t.wall(n,-.7,0,-10,0,l),t.wall(n,10,0,.7,0,l),t.wall(n,-.7,0,.7,0,1,2.6),t.wall(n,-10,0,-10,-38,l,0,2.4),t.wall(r,-10,-38,-.7,-38,l),t.wall(r,.7,-38,10,-38,l),t.wall(r,-.7,-38,.7,-38,1,2.6),t.windowWall(10,-38,10,0,l,e,1,.15),t.box(o,.05,.08,38,-9.92,1,-19),t.box(o,20,.08,.05,0,3.2,-.1),t.box(e.darkWood,4,1.05,.9,-2,.525,-7.5),t.box(o,4.1,.04,1,-2,1.07,-7.5),new Jn(-2.8,1.09,-7.7,Math.PI),new gr(-1.5,1.09,-7.6,Math.PI),new an(-.3,1.09,-7.4,1718890),t.sign(li("EXECUTIVE SUITE","BY APPOINTMENT ONLY","#d8c090","#120c08",1024,200),3.2,.62,-2.6,2.4,-11.3,0),t.box(e.darkWood,5,3.6,.3,-2.5,1.8,-11.5);for(let d=0;d<4;d++)new Qn(-9.88,1.8,-4-d*8.5,Math.PI/2,1.6,1.1,d+1);const c=Te(null,1707016,60,3351057);t.box(c,2.6,.45,.9,7.5,.225,-15,Math.PI/2),t.box(c,2.6,.55,.25,6.95,.62,-15,Math.PI/2),t.box(e.darkWood,1.2,.4,.8,5.8,.2,-15),new an(5.6,.4,-15.2,6953498),new an(6,.4,-14.8,1727034),new Yi(2.8,-13.5,0,0,1),new Yi(-2.3,-20.5,0,1,1),new Yi(2.5,-25.5,0,2,1),t.box(e.darkWood,.8,1.1,3,9,.55,-21),t.box(o,.9,.05,3.1,9,1.12,-21);for(let d=0;d<4;d++)new an(9,1.15,-20-d*.6,[2113568,4202512,8429760,6299680][d]);t.wall(n,-10,-12,-4,-12,l),t.wall(n,-10,-26,-4,-26,l),s.glass.push(...t.glassWall(-4,-12,-4,-26,l-.4,1.75)),t.box(o,.1,.4,14,-4,l-.2,-19);const u=Te(es("#1a0e06"),16777215,110,5583633);t.box(u,2.2,.07,8,-7,.75,-19),t.box(e.darkWood,1.6,.72,7.4,-7,.36,-19);for(let d=0;d<4;d++)new Fi(-8.4,-16-d*2,Math.PI/2,!0),new Fi(-5.6,-16-d*2,-Math.PI/2,!0);new cr(-9.85,1.8,-19,Math.PI/2,2.8,1.6,li("PROFITS","▲ 666%","#60ff90","#081208",512,300)),new Mr(-2.6,3,-11.3,0),new vr(-9.88,1.5,-30,Math.PI/2),new _r(9.4,.9,-32,-Math.PI/2),new yr(-9.88,1.5,-9,Math.PI/2),new Ee(-9,-36.8,1.3),new Ee(9,-36.8,1.3),new Ee(-3.2,-1,1.1),new Ee(3.2,-1,1.1),new Qn(-3.5,1.8,-37.88,0,1.6,1.2,3),new Qn(3.5,1.8,-37.88,0,1.6,1.2,4),new an(-6,0,-37,1710682),Sr(s.root,[[-2,3.2,-6,16767136,8],[6,3.2,-17,16763024,7],[-7,3.2,-19,16771272,7],[0,3.2,-32,16765072,8]]);for(const[d,g]of[[0,-4],[0,-15],[3,-22],[0,-30],[-7,-16],[-7,-22]])new Oa(d,l,g,0,null,Math.random()<.2,!1);t.finalize();const f=new On(s.root,0,0,Math.PI);f.setDisplay("48",0);const h=new On(s.root,0,-38,0,!0);return h.setDisplay("48",0),s.z("g1",0,{type:"receptionist",x:-2,z:-8.4,rot:0,act:"type",delay:1,path:[[.6,-8.4],[.4,-6]]}),s.z("g1",0,{type:"security",x:2.5,z:-6,rot:-Math.PI/2,act:"guard",delay:1.8}),s.z("g1",0,{type:"executive",x:-6,z:-9,rot:Math.PI/2,act:"phone",delay:.6}),s.z("g1",1,{type:"security",x:6,z:-12,rot:0,act:"stand",delay:.1,rush:!0}),s.z("g1",1,{type:"executive",x:-5,z:-11,rot:0,act:"stand",delay:.6,throws:!0}),s.z("g2",0,{type:"executive",x:8.9,z:-12.5,rot:Math.PI/2,act:"window",delay:1.4}),s.z("g2",0,{type:"executive",x:8.9,z:-17.5,rot:Math.PI/2,act:"window",delay:2.4,throws:!0}),s.z("g2",0,{type:"manager",x:7.6,z:-15.4,rot:-Math.PI/2,act:"meeting",seated:!0,delay:.8}),s.z("g2",0,{type:"receptionist",x:8.1,z:-21,rot:-Math.PI/2,act:"copier",delay:2}),s.z("g2",1,{type:"security",x:4,z:-27,rot:Math.PI,act:"stand",delay:.2,rush:!0}),s.z("g3",0,{type:"executive",x:-8.4,z:-16,rot:Math.PI/2,act:"meeting",seated:!0,delay:1,path:[[-6.5,-13.2],[-3,-14]]}),s.z("g3",0,{type:"executive",x:-5.6,z:-18,rot:-Math.PI/2,act:"meeting",seated:!0,delay:1.6}),s.z("g3",0,{type:"executive",x:-8.4,z:-20,rot:Math.PI/2,act:"meeting",seated:!0,delay:2.2,throws:!0,path:[[-6.5,-24.8],[-3,-22]]}),s.z("g3",0,{type:"manager",x:-5.6,z:-22,rot:-Math.PI/2,act:"meeting",seated:!0,delay:2.8}),s.z("g3",0,{type:"executive",x:-9.2,z:-19,rot:Math.PI/2,act:"pace",delay:3.4,path:[[-6.5,-24.8],[-3,-23]]}),s.z("g3",1,{type:"security",x:0,z:-30,rot:0,act:"stand",delay:.2,rush:!0}),s.z("g4",0,{type:"security",x:-1.5,z:-36.8,rot:0,act:"guard",delay:1}),s.z("g4",0,{type:"security",x:1.5,z:-36.8,rot:0,act:"guard",delay:1.4}),s.z("g4",0,{type:"executive",x:-7,z:-33,rot:Math.PI/2,act:"phone",delay:.6,throws:!0}),s.z("g4",0,{type:"executive",x:7,z:-34,rot:-Math.PI/2,act:"window",delay:2}),s.z("g4",1,{type:"executive",x:-6,z:-27.5,rot:0,act:"stand",delay:.2,rush:!0}),s.z("g4",1,{type:"intern",x:5,z:-30,rot:0,act:"crawl",delay:.5}),s.move([0,1.65,-1],[-1,1.4,-8],1.6),s.fight("g1",1.8,"THE EXECUTIVE SUITE. MIND THE MARBLE."),s.move([1.5,1.65,-10.8],[7.5,1.4,-16],3),s.fight("g2",2.2),s.move([.5,1.65,-17.5],[-6.5,1.25,-19],3),s.fight("g3",1.6,"THE BOARD IS IN SESSION"),s.move([0,1.65,-29],[0,1.4,-37],3.4),s.fight("g4",1.2),{dep:h,arr:f,start:{pos:new T(0,1.65,1.25),look:new T(0,1.5,-6)}}}function p1(s){const t=s.kit,e=br(!0),i=Te(mr("#141416","rgba(220,200,160,"),16777215,150,8947848),n=He(es("#160c06")),r=He(Zl(),2762276),a=Te(null,11569728,120,16769184),o=5;t.floor(i,-13,-24,13,0,0,3),t.floor(r,-13,-24,13,0,o,3,!0),t.wall(n,-.7,0,-13,0,o),t.wall(n,13,0,.7,0,o),t.wall(n,-.7,0,.7,0,2.4,2.6),t.windowWall(-13,0,-13,-24,o,e,-1,.1),t.windowWall(13,-24,13,0,o,e,1,.1),t.windowWall(-13,-24,13,-24,o,e,-1,.1);for(const[f,h]of[[-13,-12],[13,-12],[-6.5,-24],[6.5,-24],[-13,-24],[13,-24]])t.box(a,.3,o,.3,f,o/2,h);t.box(Te(null,657932,100,4473924),10,.15,6,0,.075,-16.5),t.box(He(Kl("#4a0a10")),8,.02,4.4,0,.16,-16.5);const l=Te(null,787974,70,3351074);t.box(l,3,.45,1,-9,.225,-7,Math.PI/2),t.box(l,3,.6,.25,-9.5,.65,-7,Math.PI/2),t.box(l,3,.45,1,9,.225,-7,Math.PI/2),t.box(l,3,.6,.25,9.5,.65,-7,Math.PI/2),t.box(a,1.2,.05,1.2,-7.6,.45,-7),t.box(a,1.2,.05,1.2,7.6,.45,-7),new an(-7.6,.475,-7,9048080),new an(7.6,.475,-7,1055338),new Yi(-6,-11.5,0,2,1.25),new Yi(6,-11.5,0,0,1.25),new Yi(-10,-19,0,1,1.1),new Yi(10,-19,0,2,1.1),new Qn(-3.5,2.4,-.12,Math.PI,1.8,1.3,3),new Qn(3.5,2.4,-.12,Math.PI,1.8,1.3,0),new Ee(-11.5,-2,1.5),new Ee(11.5,-2,1.5),new Ee(-11.5,-22,1.5),new Ee(11.5,-22,1.5),new Mr(-6,3.4,-.1,Math.PI),new cr(6,3.6,-.12,Math.PI,2.2,1,li("STOCK: SYNX","▲ ∞%","#ffd060","#100a02",512,230)),new yr(-.9,1.5,-.12,Math.PI),new _r(12.6,.9,-5,-Math.PI/2),new vr(-12.6,1.5,-15,Math.PI/2),t.box(e.darkWood,.6,1,2.6,11.2,.5,-14),t.box(a,.7,.05,2.7,11.2,1.02,-14);for(let f=0;f<3;f++)new an(11.2,1.05,-13.2-f*.7,[4202512,2113568,8429760][f]);Sr(s.root,[[0,4.2,-15,16763024,10],[-8,4,-8,11583743,5],[8,4,-8,11583743,5],[0,4.2,-4,16769200,6]]);for(const[f,h]of[[-4,-6],[4,-6],[-4,-14],[4,-14]])new Oa(f,o,h,0,null,!1,!1);t.finalize();const c=new On(s.root,0,0,Math.PI,!0);c.setDisplay("PH",0);const u=new l1(s.ctx,s.root,e);return s.move([0,1.65,-1.2],[0,1.6,-12],2),s.move([0,1.65,-4.5],[0,1.6,-15],3.5),s.script.push({t:"boss"}),{dep:null,arr:c,start:{pos:new T(0,1.65,1.25),look:new T(0,1.5,-6)},ceo:u}}function m1(s,t){const e=new c1(t),i=ma[s];let n;switch(s){case 0:n=h1(e);break;case 1:n=u1(e);break;case 2:n=f1(e);break;case 3:n=d1(e);break;default:n=p1(e);break}n.dep&&e.script.push({t:"elevator"});const r=[789524,658450,789002,657414,394506];return{id:i.id,index:s,name:i.name,floor:i.floor,sub:i.sub,root:e.root,zombies:e.zombies,script:e.script,arrival:n.arr,departure:n.dep,start:n.start,colliders:e.kit.colliders,glass:e.glass,boss:n.ceo??null,fog:r[s],fogNear:s===0?14:10,fogFar:s===0?48:40,ambient:[.95,.85,.8,.8,.85][s],hemiSky:8425648,hemiGround:2760728,lightning:s>=3}}function g1(s){for(const t of s.zombies)t.dispose();s.root.traverse(t=>{const e=t;e.isMesh&&e.userData.static&&e.geometry.dispose()}),s.root.removeFromParent()}const x1=new Wt({visible:!1}),_1=new Bs(1,8,6),Ke={black:new te({color:1579036}),grey:new te({color:9079440}),brown:new Jt({color:4860436,shininess:60}),white:new Jt({color:15789284,shininess:70}),gold:new Jt({color:14200896,shininess:120,specular:16769184,emissive:3153920}),blue:new te({color:2113696}),bile:new Wt({color:10157888}),red:new te({color:10491928}),glass:new Jt({color:12640511,transparent:!0,opacity:.6,shininess:140})};function Ze(s,t,e,i,n,r,a=0,o=0,l=0){const c=new Vt(t,e);return c.scale.set(i,n,r),c.position.set(a,o,l),s.add(c),c.raycast=()=>{},c}const An=new Yt(1,1,1),Ts=new Nn(1,1,1,10),Io=new Bs(1,10,8);class v1{constructor(t,e,i,n,r){this.kind=t,this.T=n,this.p0.copy(e),this.target.copy(i),this.arc=t==="pen"||t==="bile"?.25:t==="desk"?1.2:.7,this.hp=t==="briefcase"||t==="bossmug"?2:t==="desk"?9999:1,this.dmg=t==="desk"?2:1,this.pts=t==="pen"?150:100;const a=this.mesh;let o=.28;switch(t){case"stapler":Ze(a,An,Ke.black,.06,.06,.2),Ze(a,An,Ke.grey,.05,.02,.18,0,.04);break;case"mug":case"bossmug":Ze(a,Ts,Ke.white,.06,.12,.06),t==="bossmug"&&Ze(a,An,Ke.red,.062,.03,.062,0,.02),o=.3;break;case"briefcase":Ze(a,An,Ke.brown,.45,.32,.1),Ze(a,An,Ke.gold,.12,.04,.03,0,.18),o=.36;break;case"baton":Ze(a,Ts,Ke.black,.03,.5,.03);break;case"binder":Ze(a,An,Ke.blue,.26,.32,.06),Ze(a,An,Ke.white,.24,.3,.05,.01);break;case"paperweight":Ze(a,Io,Ke.glass,.11,.11,.11),Ze(a,Io,Ke.gold,.05,.05,.05),o=.3;break;case"trophy":Ze(a,Ts,Ke.gold,.1,.12,.1,0,.1),Ze(a,Ts,Ke.gold,.02,.12,.02),Ze(a,An,Ke.black,.12,.05,.12,0,-.08),o=.32;break;case"pen":Ze(a,Ts,Ke.black,.015,.3,.015),Ze(a,Ts,Ke.gold,.016,.05,.016,0,.12),o=.24;break;case"bile":Ze(a,Io,Ke.bile,.12,.12,.12),o=.3;break;case"desk":r&&a.add(r),o=0;break}this.hitSphere=new Vt(_1,x1),this.hitSphere.scale.setScalar(o||.01),this.hitSphere.userData.projectile=this,o&&a.add(this.hitSphere),this.spin.set((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14),t==="pen"&&this.spin.set(0,0,0),t==="desk"&&this.spin.set(-1.5,.5,0),a.position.copy(e)}kind;T;mesh=new pe;p0=new T;target=new T;t=0;dead=!1;arc;spin=new T;hp;dmg;pts;hitSphere;update(t){this.t+=t;const e=Math.min(1,this.t/this.T);return this.mesh.position.lerpVectors(this.p0,this.target,e),this.mesh.position.y+=this.arc*4*e*(1-e),this.kind==="pen"?(this.mesh.lookAt(this.target),this.mesh.rotateX(Math.PI/2)):(this.mesh.rotation.x+=this.spin.x*t,this.mesh.rotation.y+=this.spin.y*t,this.mesh.rotation.z+=this.spin.z*t),e>=1}}const dn=800,pn=600,Cu='"Lucida Console", Monaco, "Courier New", monospace';function Ft(s,t,e,i,n,r,a="left",o=0){s.font=`bold ${n}px ${Cu}`,s.textAlign=a,s.textBaseline="middle",s.lineWidth=Math.max(3,n*.18),s.strokeStyle="rgba(0,0,0,0.85)",s.strokeText(t,e,i),o&&(s.shadowColor=r,s.shadowBlur=o),s.fillStyle=r,s.fillText(t,e,i),s.shadowBlur=0}function wl(s,t,e,i,n,r,a,o=1.25){s.font=`bold ${n}px ${Cu}`;const l=t.split(" ");let c="";const u=[];for(const f of l){const h=c?c+" "+f:f;s.measureText(h).width>a&&c?(u.push(c),c=f):c=h}c&&u.push(c),u.forEach((f,h)=>Ft(s,f,e,i+(h-(u.length-1)/2)*n*o,n,r,"center"))}const Os=(s,t=8)=>String(Math.max(0,Math.floor(s))).padStart(t,"0"),Ri=(s,t=2)=>Math.floor(s*t)%2===0;function M1(s,t){s.clearRect(0,0,dn,pn);const e=t.realTime,i=t.mode;if(i==="attract")return y1(s,t,e);if(i==="intro")return b1(s,t,e);Ft(s,"1P",22,26,20,"#ff8a2a","left",8),Ft(s,Os(t.score),60,26,26,"#fff4d8"),Ft(s,"HI "+Os(Math.max(t.hiScore,t.score)),778,26,18,"#9fd8ff","right");for(let n=0;n<t.maxHealth;n++){const r=24+n*30,a=50;s.fillStyle="rgba(0,0,0,0.6)",s.fillRect(r-2,a-2,26,22),s.fillStyle=n<t.health?t.health<=1&&Ri(e,4)?"#ff2020":"#ff3a3a":"#3a1010",s.fillRect(r,a,22,18),n<t.health&&(s.fillStyle="#fff",s.fillRect(r+9,a+3,4,12),s.fillRect(r+5,a+7,12,4))}Ft(s,"LIVES x"+t.lives,24+t.maxHealth*30+8,60,16,"#ffd0a0"),t.levelInfo&&Ft(s,"FLOOR "+t.levelInfo.floor,778,50,16,"#c8c8c8","right"),t.playerHandle&&Ft(s,t.playerHandle.toUpperCase(),778,72,13,"#a0ffa0","right");for(let n=0;n<t.maxAmmo;n++){const r=770-n*20,a=548;s.fillStyle="rgba(0,0,0,0.6)",s.fillRect(r-2,a-2,14,40),n<t.ammo?(s.fillStyle="#d8a030",s.fillRect(r,a+10,10,26),s.fillStyle="#f0d070",s.beginPath(),s.moveTo(r,a+10),s.lineTo(r+5,a),s.lineTo(r+10,a+10),s.fill()):(s.strokeStyle="#5a4020",s.lineWidth=2,s.strokeRect(r,a+2,10,34))}if(t.combo>=3){const n=t.multiplier();Ft(s,`COMBO ${t.combo}`,22,556,22,"#ffe040","left",10),Ft(s,`x${n.toFixed(1)} SCORE`,22,580,14,"#ffb040")}t.ammo===0&&i==="play"&&Ri(e,3)&&(Ft(s,"RELOAD!",400,470,44,"#ff3030","center",16),Ft(s,t.touch?"TAP OFF-SCREEN OR PRESS RELOAD":"AIM OFF-SCREEN & SHOOT  /  RIGHT-CLICK",400,506,14,"#ffc0c0","center"));for(const n of t.popups){const r=Math.min(1,n.t*2);s.globalAlpha=r,Ft(s,n.text,n.sx,n.sy-(1.2-n.t)*40,n.big?24:18,n.color,"center",6),s.globalAlpha=1}for(const n of t.warnings){if(n.sx<-50)continue;const r=.6+.4*Math.sin(e*25);s.strokeStyle=`rgba(255,40,40,${r})`,s.lineWidth=4;const a=34+(1-n.t/n.dur)*-10;s.beginPath(),s.arc(n.sx,n.sy,Math.max(18,a),0,Math.PI*2),s.stroke(),Ft(s,"!",n.sx,n.sy,30,"#ff3030","center")}if(t.boss.name&&(Ft(s,t.boss.name,400,80,14,"#ffd0d0","center"),s.fillStyle="rgba(0,0,0,0.75)",s.fillRect(116,90,568,20),s.fillStyle="#4a0a0a",s.fillRect(120,92,560,16),s.fillStyle=t.boss.show>t.boss.frac?"#ffd080":"#ff2a2a",s.fillRect(120,92,560*t.boss.show,16),s.fillStyle="#ff2a2a",s.fillRect(120,92,560*t.boss.frac,16),s.strokeStyle="#ffd0a0",s.lineWidth=2,s.strokeRect(118,90,564,20)),t.msg&&t.msg.t>0){const n=Math.min(1,t.msg.t*2);s.globalAlpha=n,wl(s,t.msg.text,400,t.boss.name?150:130,24,t.msg.color,720),s.globalAlpha=1}if(!t.touch&&t.aimOn){const n=t.aimX,r=t.aimY;s.strokeStyle="rgba(255,60,60,0.9)",s.lineWidth=2,s.beginPath(),s.arc(n,r,12,0,Math.PI*2),s.moveTo(n-20,r),s.lineTo(n-6,r),s.moveTo(n+6,r),s.lineTo(n+20,r),s.moveTo(n,r-20),s.lineTo(n,r-6),s.moveTo(n,r+6),s.lineTo(n,r+20),s.stroke()}i!=="victory"&&t.results&&Pu(s,t,e),i==="continue"&&(s.fillStyle="rgba(0,0,0,0.6)",s.fillRect(0,0,dn,pn),Ft(s,"CONTINUE?",400,200,60,"#ff8a2a","center",20),Ft(s,String(Math.max(0,Math.ceil(t.continueT))),400,300,110,"#fff","center",20),Ri(e,2)&&Ft(s,t.touch?"TAP THE SCREEN TO CONTINUE":"SHOOT THE SCREEN TO CONTINUE",400,400,22,"#ffe0a0","center"),Ft(s,"CONTINUING HALVES YOUR SCORE",400,440,14,"#c0a080","center"),Ft(s,`CONTINUES USED: ${t.continues}`,400,470,14,"#c0a080","center")),i==="gameover"&&S1(s,t,e),i==="victory"&&w1(s,t,e)}function Pu(s,t,e){const i=t.results;if(!i)return;const n=i.t;s.fillStyle=`rgba(0,0,0,${Math.min(.65,n)})`,s.fillRect(70,120,660,380),s.strokeStyle="#ff8a2a",s.lineWidth=2,s.strokeRect(70,120,660,380),Ft(s,i.title,400,155,28,"#ff8a2a","center",12),i.lines.forEach((r,a)=>{n<.5+a*.45||(Ft(s,r[0],110,210+a*40,20,"#e8e0d0"),Ft(s,r[1],690,210+a*40,20,r[2]??"#fff","right"))}),n>.6+i.lines.length*.45&&Ri(e,2)&&Ft(s,i.footer,400,470,18,"#9fd8ff","center")}function Ql(s,t,e,i){Ft(s,"— TOP EMPLOYEES —",400,e,22,"#ff8a2a","center",10);const n=t.board.slice(0,8);n.length||Ft(s,t.boardLoading?"LOADING...":"NO SCORES YET — BE THE FIRST",400,e+44,16,"#c0c0c0","center"),n.forEach((r,a)=>{const o=e+38+a*28,l=r.you?Ri(i,3)?"#ffff60":"#ffffff":"#d8d0c0";Ft(s,`${String(r.rank).padStart(2," ")}.`,200,o,18,l),Ft(s,r.name.slice(0,16).toUpperCase(),250,o,18,l),Ft(s,Os(r.score),600,o,18,l,"right")})}function y1(s,t,e){const i=Math.floor(e/9)%2;if(s.fillStyle="rgba(0,0,0,0.35)",s.fillRect(0,0,dn,pn),i===0||!t.board.length){const n=Math.sin(e*2)*3;Ft(s,"CORPORATE",400,150+n,78,"#e8e0d0","center",18),Ft(s,"ZOMBIES",400,235+n,96,"#ff3a2a","center",26),Ft(s,"A SYNERGEX MANDATORY OVERTIME SIMULATION",400,300,15,"#9fd8ff","center"),Ri(e,1.6)&&Ft(s,t.touch?"TAP THE SCREEN TO START":"SHOOT THE SCREEN TO START",400,400,28,"#ffe040","center",12),Ft(s,"HI SCORE "+Os(t.hiScore),400,460,18,"#ffd0a0","center"),Ft(s,"FREE PLAY",400,560,16,"#c0c0c0","center"),Ft(s,"© 1987 SYNERGEX AMUSEMENT DIV.",400,584,12,"#808080","center")}else Ql(s,t,110,e),Ri(e,1.6)&&Ft(s,t.touch?"TAP TO START":"SHOOT TO START",400,520,24,"#ffe040","center",10)}function b1(s,t,e){s.fillStyle="rgba(0,0,0,0.85)",s.fillRect(0,0,dn,pn);const i=["02:00 A.M. — SYNERGEX TOWER","THE MANDATORY OVERTIME MEMO","HAD SOME... SIDE EFFECTS.","","THE WHOLE WORKFORCE IS STILL WORKING.","THEY ARE ALSO ZOMBIES.","","REACH THE PENTHOUSE.","TERMINATE THE C.E.O."],n=t.introT;i.forEach((r,a)=>{n>a*.35&&Ft(s,r,400,130+a*38,a===0?26:20,a===0?"#ff8a2a":a>=7?"#ff4040":"#e8e0d0","center")}),Ft(s,t.touch?"TAP SCREEN = SHOOT    TAP OUTSIDE = RELOAD":"CLICK = SHOOT    RIGHT-CLICK / OFF-SCREEN = RELOAD",400,520,14,"#9fd8ff","center"),n>2.5&&Ri(e,2)&&Ft(s,"TAP TO SKIP",400,560,14,"#808080","center")}function S1(s,t,e,i){s.fillStyle="rgba(0,0,0,0.75)",s.fillRect(0,0,dn,pn),Ft(s,"GAME OVER",400,70,64,"#ff3030","center",20),Ft(s,"YOUR CONTRACT WAS NOT RENEWED.",400,120,18,"#e8e0d0","center"),Ft(s,"FINAL SCORE "+Os(t.score),400,160,24,"#fff4d8","center"),t.newBest&&Ft(s,"NEW PERSONAL BEST!",400,190,18,Ri(e,3)?"#ffff60":"#ff8a2a","center"),Ql(s,t,230,e),t.endT>2&&Ri(e,2)&&Ft(s,t.touch?"TAP TO RETURN":"SHOOT TO RETURN",400,568,18,"#9fd8ff","center")}function w1(s,t,e){const i=t.endT;if(s.fillStyle=`rgba(0,0,0,${Math.min(.85,i*.4)})`,s.fillRect(0,0,dn,pn),i<4.5){i>.5&&wl(s,"YOUR EMPLOYMENT HAS BEEN TERMINATED.",400,280,40,"#ff3a2a",700);return}if(i<9){wl(s,"CONGRATULATIONS! YOU'VE BEEN PROMOTED TO CUSTOMER.",400,260,38,"#ffe040",700),i>6&&Ft(s,"THANK YOU FOR YOUR SERVICE.",400,400,18,"#9fd8ff","center");return}i<=15&&t.results&&Pu(s,t,e),i>15&&(s.fillStyle="rgba(0,0,0,0.92)",s.fillRect(0,0,dn,pn)),i>15&&(Ft(s,"FINAL SCORE "+Os(t.score),400,70,32,"#fff4d8","center",12),t.newBest&&Ft(s,"NEW PERSONAL BEST!",400,110,18,Ri(e,3)?"#ffff60":"#ff8a2a","center"),Ql(s,t,160,e),Ri(e,2)&&Ft(s,t.touch?"TAP TO PLAY AGAIN":"SHOOT TO PLAY AGAIN",400,568,18,"#9fd8ff","center"))}const Ye=new T,ir=new T,As=new fu,aa=s=>s<.5?2*s*s:1-Math.pow(-2*s+2,2)/2;class E1{scene=new tu;camera=new fi(62,4/3,.05,140);fx=new Wx;time=0;realTime=0;difficulty=0;camFwd=new T(0,0,-1);hazards=[];hemi;dir;amb;level=null;levelIndex=0;levelInfo=null;mode="attract";paused=!1;score=0;hiScore=0;health=5;maxHealth=5;lives=3;ammo=6;maxAmmo=6;combo=0;bestCombo=0;continues=0;invuln=0;damageFlash=0;muzzle=0;shots=0;hits=0;headshots=0;kills=0;destruction=0;floorStats={shots:0,hits:0,heads:0,kills:0,destr:0,dmg:0};popups=[];warnings=[];msg=null;boss={name:null,frac:1,show:1};results=null;board=[];boardLoading=!1;newBest=!1;continueT=0;endT=0;introT=0;touch=!1;aimX=400;aimY=300;aimOn=!1;playerHandle="";step=0;stepT=0;stepData={};camFrom=new T;camTo=new T;lookFrom=new ni;lookTo=new ni;camBase=new T;camQuat=new ni;shakeAmt=0;bob=0;projectiles=[];elev=null;elevT=0;extraZombies=[];lightningT=8;flashT=0;hudCanvas;hudCtx;hudTex;hudAcc=1;events=[];tesana=null;constructor(){this.scene.background=new Nt(328970),this.scene.fog=new Ia(657936,10,40),this.hemi=new cu(8425648,2760728,.9),this.amb=new zd(4212824,.6),this.dir=new Bd(10466528,.5),this.dir.position.set(10,8,3),this.scene.add(this.hemi,this.amb,this.dir,this.fx.group),this.scene.add(this.camera),this.fx.setScale(600,this.camera.fov),this.hudCanvas=document.createElement("canvas"),this.hudCanvas.width=dn,this.hudCanvas.height=pn,this.hudCtx=this.hudCanvas.getContext("2d"),this.hudTex=new Un(this.hudCanvas),this.hudTex.colorSpace=Be,this.hudTex.minFilter=Qe,this.hudTex.generateMipmaps=!1,bt.ctx=this,bt.zombies=()=>this.allZombies(),bt.heal=()=>{this.health=Math.min(this.maxHealth,this.health+2),this.message("+2 HEALTH",1.2,"#60ff80")};try{this.hiScore=Number(localStorage.getItem("cz_hi")||0)}catch{}this.loadLevel(0),this.attractPose(0)}emit(t,e){for(const i of this.events)i(t,e)}allZombies(){return this.level?this.level.zombies.concat(this.extraZombies):this.extraZombies}playerHit(t,e){if(!(this.mode!=="play"||this.invuln>0)&&(this.health-=t,this.floorStats.dmg+=t,this.invuln=.7,this.damageFlash=1,this.shake(.35),H.hurt(),this.combo=0,this.health<=0))if(this.lives--,this.tesana?.gameplay.death({levelId:this.level.id,x:this.camera.position.x,y:-this.camera.position.z,name:e}),window.Tesana?.track("life_lost",{levelId:this.level.id,cause:e}),this.lives>0){this.health=this.maxHealth,this.invuln=2.5,this.message(`LIFE LOST! ${this.lives} REMAINING`,2,"#ff4040");for(const i of this.allZombies())i.alive&&i.pos.distanceTo(this.camera.position)<3&&(i.pos.addScaledVector(Ye.copy(i.pos).sub(this.camera.position).setY(0).normalize(),1.2),i.windup=0);this.projectiles.forEach(i=>{i.dead=!0,i.mesh.removeFromParent()})}else this.health=0,this.mode="continue",this.continueT=10,H.setMusic("tense")}throwProjectile(t,e,i,n,r){const a=Ye.copy(this.camBase).add(ir.set(0,-.15,0));if(n){const l=ir.set(1,0,0).applyQuaternion(this.camQuat);a.addScaledVector(l,n.x),a.y+=n.y}const o=new v1(e,t,a,i*(1-this.difficulty*.03),r);this.scene.add(o.mesh),this.projectiles.push(o)}addScore(t,e,i,n="#ffffff"){this.score+=Math.round(t),e&&(i||t>=50)&&this.popup(e,i?`${i} +${Math.round(t)}`:`+${Math.round(t)}`,n,!!i)}popup(t,e,i="#ffffff",n=!1){this.popups.length>14&&this.popups.shift(),this.popups.push({pos:t.clone(),text:e,color:i,t:1.2,sx:0,sy:0,big:n})}shake(t){this.shakeAmt=Math.min(1,this.shakeAmt+t)}warn(t,e){this.warnings.push({pos:t.clone(),t:e,dur:e,sx:-100,sy:0}),H.warning()}bossBar(t,e){this.boss.name=t,this.boss.frac=e}message(t,e=2.2,i="#ffe0a0"){this.msg={text:t,t:e,color:i}}loadLevel(t){this.level&&(g1(this.level),this.level=null);for(const n of this.extraZombies)n.dispose();this.extraZombies=[],this.projectiles.forEach(n=>n.mesh.removeFromParent()),this.projectiles=[],this.fx.clear(),this.hazards=[],this.levelIndex=t,this.difficulty=t;const e=m1(t,this);this.level=e,this.levelInfo={floor:e.floor},this.scene.add(e.root);const i=this.scene.fog;i.color.setHex(e.fog),i.near=e.fogNear,i.far=e.fogFar,this.scene.background.setHex(e.fog),this.hemi.intensity=e.ambient,this.amb.intensity=e.ambient*.55;for(const n of e.zombies)this.hookZombie(n);e.boss&&(e.boss.onSpawn=n=>{const r=new Jl(n,this);r.group="boss",this.hookZombie(r),e.root.add(r.root),this.extraZombies.push(r),r.root.visible=!0,r.activate()},e.boss.onDefeat=()=>this.victory()),this.step=0,this.stepT=0,this.stepData={},this.camBase.copy(e.start.pos),this.lookAtQuat(e.start.pos,e.start.look,this.camQuat)}hookZombie(t){t.onDeath=(e,i)=>{const n=this.multiplier();let r=e.pts;const a=e.pos.clone().setY(1.9*e.baseScale);i==="head"?(r+=100,this.addScore(r*n,a,"HEADSHOT!","#ff6060")):i==="slip"||i==="shock"||i==="boss"?this.addScore(r,a,i==="slip"?"WET FLOOR!":i==="shock"?"FRIED!":void 0,"#9fe8ff"):this.addScore(r*n,a),(i==="slip"||i==="shock")&&(this.floorStats.destr+=r),this.kills++,this.floorStats.kills++,e.miniboss&&(this.bossBar(null,0),this.message("THE REGIONAL MANAGER HAS BEEN DOWNSIZED!",2.5,"#ffd060"),H.fanfare())},t.onRise=e=>{for(const i of bt.props)i instanceof Fi&&i.state===0&&i.group.position.distanceTo(Ye.copy(e.pos))<.9&&i.hit("main",i.group.position,ir.set(0,1,0),Ye.set(-Math.sin(e.yaw),0,-Math.cos(e.yaw)).add(ir.set(Math.random()-.5,0,0)).normalize())}}lookAtQuat(t,e,i){const n=new Bt().lookAt(t,e,new T(0,1,0));return i.setFromRotationMatrix(n)}startGame(){H.unlock(),this.score=0,this.health=this.maxHealth,this.lives=3,this.ammo=this.maxAmmo,this.combo=0,this.continues=0,this.shots=this.hits=this.headshots=this.kills=this.destruction=0,this.bestCombo=0,this.results=null,this.boss.name=null,this.newBest=!1,this.msg=null,this.mode="intro",this.introT=0,H.coin(),H.setMusic("title"),this.loadLevel(0),this.emit("start")}beginLevel(){const t=this.level;this.floorStats={shots:0,hits:0,heads:0,kills:0,destr:0,dmg:0},this.tesana?.gameplay.levelStart({levelId:t.id,levelIndex:t.index}),this.emit("level",{index:t.index,id:t.id})}multiplier(){return Math.min(4,1+Math.floor(this.combo/5)*.5)}fire(t,e){if(H.unlock(),this.paused)return;if(this.mode==="attract"){this.startGame();return}if(this.mode==="intro"){this.introT>1&&(this.introT=99);return}if(this.mode==="continue"){this.doContinue();return}if(this.mode==="gameover"||this.mode==="victory"){this.endT>(this.mode==="victory"?15:2)?this.toAttract():this.mode==="victory"&&this.endT>1.5&&(this.endT=this.endT<4.5?4.5:this.endT<9?9:15);return}if(this.ammo<=0){H.dryFire(),this.message("RELOAD!",.8,"#ff4040");return}if(this.ammo--,this.shots++,this.floorStats.shots++,H.shot(),this.muzzle=1,this.emit("shot"),this.camera.updateMatrixWorld(),As.setFromCamera(new Ut(t*2-1,-(e*2-1)),this.camera),As.far=80,!this.level)return;for(const a of this.allZombies())a.alive&&a.root.parent&&(a.rig.mesh.updateMatrixWorld(!0),a.rig.mesh.computeBoundingSphere());this.level.boss&&(this.level.boss.rig.mesh.updateMatrixWorld(!0),this.level.boss.rig.mesh.computeBoundingSphere());const i=[this.level.root];for(const a of this.projectiles)i.push(a.mesh);const n=As.intersectObjects(i,!0);let r=!1;for(const a of n){if(!T1(a.object))continue;const o=a.object,l=a.face?a.face.normal.clone().transformDirection(o.matrixWorld):Ye.copy(As.ray.direction).negate();l.dot(As.ray.direction)>0&&l.negate();const c=As.ray.direction.clone();if(o.userData.projectile){this.shootProjectile(o.userData.projectile,a.point),r=!0;break}const u=o.userData.zombie??o.parent?.userData.zombie;if(u&&o===u.rig.mesh){if(!u.alive)continue;const y=Nh(o,a.face),m=u.hit(y,a.point,c);this.registerHit(m.head),m.killed||(this.score+=m.pts),u.miniboss&&this.bossBar("REGIONAL MANAGER",Math.max(0,u.hp/u.maxHp)),r=!0;break}let f=o,h=null;for(;f;){if(f.userData.boss){h=f.userData.boss;break}f=f.parent}if(h){const y=o.userData.part?String(o.userData.part):o===h.rig.mesh?Nh(o,a.face):"body";if(!h.alive)continue;const m=h.hit(y,a.point,c);this.registerHit(y==="heart"),this.score+=m.pts,r=!0;break}let d=o,g=null;for(;d;){if(d.userData.prop){g=d.userData.prop;break}d=d.parent}if(g){const y=String(o.userData.part??"main"),m=g.hit(y,a.point,l,c,o);g.kind!=="window"&&this.registerHit(!1),m.pts>0&&(this.score+=m.pts,this.destruction+=m.pts,this.floorStats.destr+=m.pts,m.label?this.popup(a.point,`${m.label} +${m.pts}`,m.color??"#ffe080",!0):m.pts>=25&&this.popup(a.point,`+${m.pts}`,m.color??"#ffe080")),r=g.kind!=="window",r||(this.combo=0);break}if(o.userData.static||o.isMesh){this.fx.decal(o,a.point,l,.06),this.fx.dust(a.point,l,.55),Math.random()<.4&&H.ricochet(),this.fx.sparks(a.point,l,3,2),this.combo=0;break}}!r&&n.length===0&&(this.combo=0)}registerHit(t){this.hits++,this.floorStats.hits++,t&&(this.headshots++,this.floorStats.heads++),this.combo++,this.bestCombo=Math.max(this.bestCombo,this.combo),this.combo>=3&&this.combo%5===0&&H.combo(this.combo/5)}shootProjectile(t,e){if(t.kind==="desk"){this.fx.debris(e,4,2758413,.05,2),H.thud();return}if(t.hp--,this.registerHit(!1),t.hp<=0){t.dead=!0,t.mesh.removeFromParent();const i=t.kind==="bile"?10157888:t.kind==="briefcase"?4860436:t.kind==="paperweight"||t.kind==="trophy"?14200896:14737632;this.fx.debris(e,8,i,.05,2.5),t.kind==="bile"&&this.fx.liquid(e,Ye.set(0,1,0),20,.5,.9,.2,2,.05,1.2),t.kind==="binder"&&this.fx.papers(e,6,Ye.set(0,0,0)),t.kind==="paperweight"||t.kind==="mug"||t.kind==="bossmug"?H.ceramic():H.plastic(),this.addScore(t.pts,e,"INTERCEPTED!","#80ffff")}else this.fx.sparks(e,Ye.set(0,0,1),6),H.plastic()}reload(){if(H.unlock(),!this.paused){if(this.mode!=="play"&&this.mode!=="results"){(this.mode==="attract"||this.mode==="intro"||this.mode==="continue"||this.mode==="gameover"||this.mode==="victory")&&this.fire(.5,.5);return}this.ammo!==this.maxAmmo&&(this.ammo=this.maxAmmo,H.reload(),this.emit("reload"))}}doContinue(){this.continues++,this.lives=3,this.health=this.maxHealth,this.ammo=this.maxAmmo,this.invuln=3,this.score=Math.floor(this.score/2),this.mode="play",H.coin(),H.setMusic("combat"),this.message("BACK TO WORK!",1.5,"#60ff80");for(const t of this.allZombies())t.alive&&t.pos.distanceTo(this.camera.position)<3&&t.pos.addScaledVector(Ye.copy(t.pos).sub(this.camera.position).setY(0).normalize(),1.5);this.emit("continue")}gameOver(){this.mode="gameover",this.endT=0,H.gameOver(),H.setMusic("off"),this.tesana?.gameplay.levelFail(this.level.id,"out_of_lives"),this.finishRun(!1)}victory(){this.mode="victory",this.endT=0,H.fanfare(),H.setMusic("victory"),this.tesana?.gameplay.levelComplete({levelId:this.level.id});const t=this.shots?this.hits/this.shots:0,e=Math.round(t*100)*300,i=this.health*2e3+this.lives*5e3,n=Math.round(this.score*.1);this.results={title:"COMPLETION BONUS",t:0,footer:"SEVERANCE PAID IN FULL",lines:[["ACCURACY "+Math.round(t*100)+"%","+"+e],["HEALTH & LIVES","+"+i],["PERFORMANCE (10% OF SCORE)","+"+n],["CEO TERMINATION","+25000","#ffd060"],["CONTINUES USED",String(this.continues),"#c0c0c0"]]},this.score+=e+i+n+25e3,this.finishRun(!0)}finishRun(t){const e=Math.round(this.score);if(e>this.hiScore){this.hiScore=e,this.newBest=!0;try{localStorage.setItem("cz_hi",String(e))}catch{}}this.tesana?.gameplay.score({value:e}),this.emit("runEnd",{score:e,won:t,accuracy:this.shots?this.hits/this.shots:0}),this.submitScores(e,t)}async submitScores(t,e){const i=this.tesana;if(!i){this.board=this.localBoard(t);return}this.boardLoading=!0;try{(await i.scores.submit("highscore",t)).improved&&(this.newBest=!0),e&&this.shots>0&&await i.scores.submit("accuracy",Math.round(this.hits/this.shots*100))}catch(n){console.warn("score not sent",n)}await this.refreshBoard(),this.board.length||(this.board=this.localBoard(t))}async refreshBoard(){const t=this.tesana;if(t){this.boardLoading=!0;try{const{entries:e}=await t.scores.top("highscore",{limit:10});this.board=e.map(i=>({rank:i.rank,name:i.displayName,score:i.score,you:!!i.you}))}catch{}this.boardLoading=!1}}localBoard(t){return t>0?[{rank:1,name:this.playerHandle||"YOU",score:Math.max(t,this.hiScore),you:!0}]:[]}toAttract(){this.mode="attract",this.results=null,this.boss.name=null,this.msg=null,this.paused=!1,H.setMusic("off"),H.setElevator(!1),this.loadLevel(0),this.attractPose(0),this.refreshBoard(),this.emit("attract")}attractPose(t){this.level;const e=Math.sin(t*.12);this.camBase.set(e*3,1.9,2.5-(Math.sin(t*.07)*.5+.5)*6),this.lookAtQuat(this.camBase,Ye.set(-e*2,1.4,-14),this.camQuat)}update(t){if(this.realTime+=t,Au.value+=t,this.hudAcc+=t,this.paused){this.render();return}this.time+=t;const e=this.level;if(this.mode==="attract"){this.attractPose(this.realTime);for(const n of e.zombies)n.root.parent&&n.root.visible&&n.update(t)}else if(this.mode==="intro"){this.introT+=t,this.camBase.copy(e.start.pos),this.lookAtQuat(e.start.pos,e.start.look,this.camQuat);for(const n of e.zombies)n.update(t);this.introT>7.5&&(this.mode="play",this.beginLevel(),H.setMusic("off"))}else this.mode==="play"||this.mode==="results"?(this.runScript(t),this.updateWorld(t)):this.mode==="continue"?(this.continueT-=t,this.continueT<=0&&this.gameOver()):(this.mode==="gameover"||this.mode==="victory")&&(this.endT+=t,this.mode==="victory"&&this.updateWorld(t*.5),this.results&&(this.results.t+=t));this.invuln>0&&(this.invuln-=t),this.damageFlash=Math.max(0,this.damageFlash-t*2.5),this.muzzle=Math.max(0,this.muzzle-t*12),this.msg&&(this.msg.t-=t,this.msg.t<=0&&(this.msg=null)),this.boss.show+=(this.boss.frac-this.boss.show)*Math.min(1,t*2),e.lightning&&this.mode!=="attract"&&(this.lightningT-=t,this.lightningT<=0&&(this.lightningT=7+Math.random()*10,this.flashT=.25,setTimeout(()=>H.thunder(),400+Math.random()*900))),this.flashT>0?(this.flashT-=t,this.hemi.intensity=e.ambient+(Math.random()<.6?2.5:0)):this.hemi.intensity=e.ambient,this.shakeAmt=Math.max(0,this.shakeAmt-t*1.8);const i=this.shakeAmt*this.shakeAmt*.12;this.camera.position.copy(this.camBase).add(Ye.set((Math.random()-.5)*i,(Math.random()-.5)*i+Math.sin(this.bob)*.025,(Math.random()-.5)*i)),this.camera.quaternion.copy(this.camQuat),i>0&&this.camera.rotateZ((Math.random()-.5)*i*.4),this.camera.updateMatrixWorld(),this.camFwd.set(0,0,-1).applyQuaternion(this.camQuat).setY(0).normalize(),H.update(t,this.mode==="play"?1:0),this.render()}updateWorld(t){const e=this.level,i=new Map;for(const n of this.allZombies())n.state!=="gone"&&(i.set(n,n.pos.clone()),n.update(t));for(const[n,r]of i)if(!(n.dead||n.state!=="move"))for(const a of e.glass)!a.broken&&a.crosses(r,n.pos)&&(a.shatter(Ye.set(n.pos.x-r.x,0,n.pos.z-r.z).normalize().multiplyScalar(2)),this.popup(n.pos.clone().setY(2),"CRASH!","#bfe8ff"));e.boss&&e.boss.update(t),Kx(t),this.fx.update(t);for(const n of this.projectiles)n.dead||n.update(t)&&(n.dead=!0,n.mesh.removeFromParent(),this.playerHit(n.dmg,n.kind),this.fx.debris(this.camBase.clone().add(Ye.set(0,-.3,-.5).applyQuaternion(this.camQuat)),6,16777215,.04,1.5),n.kind==="desk"&&(H.thud(),H.glass(!0)));this.projectiles=this.projectiles.filter(n=>!n.dead),this.hazards=this.hazards.filter(n=>n.until>this.time);for(const n of this.warnings)n.t-=t;this.warnings=this.warnings.filter(n=>n.t>0);for(const n of this.popups)n.t-=t;this.popups=this.popups.filter(n=>n.t>0),this.results&&this.mode!=="victory"&&(this.results.t+=t)}runScript(t){const e=this.level;if(this.elev){this.elevT+=t,this.elevatorStep(t);return}const i=e.script[this.step];if(!i)return;this.stepT+=t;const n=this.stepData,r=()=>{this.step++,this.stepT=0,this.stepData={}};switch(i.t){case"msg":this.message(i.text,i.dur??2.2,i.color),r();break;case"wait":this.stepT>=i.dur&&r();break;case"move":{n.init||(n.init=1,this.camFrom.copy(this.camBase),this.lookFrom.copy(this.camQuat),this.lookAtQuat(Ye.fromArray(i.to),ir.fromArray(i.look),this.lookTo),this.camTo.fromArray(i.to));const a=Math.min(1,this.stepT/i.dur),o=aa(a);this.camBase.lerpVectors(this.camFrom,this.camTo,o),this.camQuat.slerpQuaternions(this.lookFrom,this.lookTo,aa(Math.min(1,a*1.4))),this.bob+=t*7*Math.sin(a*Math.PI),Math.random()<t*2.2*Math.sin(a*Math.PI)&&H.step(),a>=1&&r();break}case"fight":{const a=e.zombies.filter(h=>h.group===i.group);n.init||(n.init=1,n.wave=-1,n.waveT=0,i.msg&&this.message(i.msg,2.6,"#c8d8ff"),H.setMusic("off"));const o=i.calm??0;if(this.stepT<o)break;if(n.wave<0){n.wave=0,n.waveT=0;for(const h of a)h.wave===0&&h.activate();H.setMusic((this.levelIndex>=3,"combat"))}n.waveT=n.waveT+t;const l=n.wave,c=Math.max(0,...a.map(h=>h.wave)),u=a.filter(h=>h.wave<=l&&h.alive).length;if(l<c&&(u<=1||n.waveT>11)){n.wave=l+1,n.waveT=0;for(const h of a)h.wave===l+1&&(h.root.visible=!0,h.activate())}if(a.some(h=>h.miniboss&&h.alive&&h.activated&&h.state!=="work"&&h.state!=="notice")){const h=a.find(d=>d.miniboss);this.boss.name||this.bossBar("REGIONAL MANAGER",h.hp/h.maxHp)}a.every(h=>!h.alive)&&(n.done=(n.done??0)+t,n.done>1&&(H.setMusic("tense"),this.bossBar(null,0),this.tesana?.gameplay.checkpoint({levelId:e.id,name:i.group}),this.ammo<this.maxAmmo&&(this.ammo=this.maxAmmo,H.reload()),this.message("AREA CLEAR",1.2,"#80ff80"),r()));break}case"boss":{n.init||(n.init=1,H.setMusic("off"),e.boss?.start(),H.thunder());break}case"elevator":this.elev={ph:0,init:0,swapped:0},this.elevT=0;break}}elevatorStep(t){const e=this.elev,i=e.swapped?this.level.arrival:this.level.departure,n=this.elevT,r=o=>{e.ph=o,this.elevT=0,e.init=0},a=(o,l,c)=>{e.init||(e.init=1,this.camFrom.copy(this.camBase),this.lookFrom.copy(this.camQuat),this.camTo.copy(o),this.lookAtQuat(o,l,this.lookTo));const u=Math.min(1,n/c);return this.camBase.lerpVectors(this.camFrom,this.camTo,aa(u)),this.camQuat.slerpQuaternions(this.lookFrom,this.lookTo,aa(u)),this.bob+=t*6*Math.sin(u*Math.PI),u>=1};switch(i.update(t),e.ph){case 0:e.init||(this.message("FLOOR CLEARED — TO THE ELEVATOR",2,"#80ff80"),H.setMusic("off")),a(i.frontPos(new T,1.8),i.lookIn(new T),2.6)&&(r(1),i.target=1,H.ding(),H.doors());break;case 1:n>1.3&&r(2);break;case 2:a(i.insidePos(new T),i.lookIn(new T),1.6)&&r(3);break;case 3:a(i.insidePos(new T),i.lookOut(new T),1.1)&&(r(4),i.target=0,H.doors());break;case 4:n>1.3&&(r(5),this.levelDone(),H.setElevator(!0),H.setMusic("muzak"));break;case 5:{const o=e.swapped?this.levelIndex-1:this.levelIndex,l=o+1;if(!e.swapped&&n>.3){const g=this.level.departure;g.group.updateMatrixWorld();const y=g.group.worldToLocal(this.camBase.clone()),m=g.group.getWorldQuaternion(new ni).invert().multiply(this.camQuat);this.loadLevel(l);const p=this.level.arrival;p.group.updateMatrixWorld(),this.camBase.copy(p.group.localToWorld(y)),this.camQuat.copy(p.group.getWorldQuaternion(new ni).multiply(m)),e.swapped=1}const c=[0,12,27,48,60],u=ma[l].floor,f=Math.min(1,n/6.5),h=Math.round(c[o]+(c[l]-c[o])*f),d=e.swapped?this.level.arrival:i;u==="PH"&&f>.55?d.setDisplay("PH",1,"EXECUTIVE MANAGEMENT — AUTHORIZED PERSONNEL ONLY   "):d.setDisplay(f>=1?u:h<=0?"L":String(h),f<1?1:0),this.shake(t*.6*(.5+Math.sin(n*9)*.5)),u==="PH"&&f>.55&&!e.phMsg&&(e.phMsg=1,this.message("EXECUTIVE MANAGEMENT — AUTHORIZED PERSONNEL ONLY",3,"#ffb050")),n>7.5&&(H.setElevator(!1),H.ding(),H.setMusic("off"),this.results=null,d.target=1,H.doors(),r(6));break}case 6:{if(n>1.2){const o=ma[this.levelIndex];this.message(`FLOOR ${o.floor} — ${o.name}`,2.6,"#ffd0a0"),this.beginLevel(),this.elev=null,this.step=0,this.stepT=0,this.stepData={}}break}}}levelDone(){const t=this.level;this.tesana?.gameplay.levelComplete({levelId:t.id});const e=this.floorStats,i=e.shots?e.hits/e.shots:0,n=Math.round(i*100)*30,r=e.heads*100,a=e.dmg===0?3e3:0;this.score+=n+r+a,this.results={title:`FLOOR ${t.floor} — PERFORMANCE REVIEW`,t:0,footer:"NEXT FLOOR: "+ma[t.index+1].name,lines:[["ACCURACY "+Math.round(i*100)+"%","+"+n],["HEADSHOTS x"+e.heads,"+"+r],["CREATIVE DESTRUCTION","+"+e.destr+" (EARNED)","#ffe080"],["NO-DAMAGE BONUS",a?"+3000":"—",a?"#80ff80":"#808080"],["ZOMBIES TERMINATED",String(e.kills)]]},this.emit("floorClear",{index:t.index})}render(){const t=(e,i)=>{if(Ye.copy(e).project(this.camera),Ye.z>1){i.sx=-999,i.sy=-999;return}i.sx=(Ye.x*.5+.5)*dn,i.sy=(-Ye.y*.5+.5)*pn};for(const e of this.popups)t(e.pos,e);for(const e of this.warnings)t(e.pos,e);this.hudAcc>=1/30&&(this.hudAcc=0,M1(this.hudCtx,this),this.hudTex.needsUpdate=!0)}}function T1(s){let t=s;for(;t;){if(!t.visible)return!1;t=t.parent}const e=s.material;return!(e&&!Array.isArray(e)&&e.visible===!1&&!s.userData.projectile)}function Nh(s,t){if(!t)return"body";const i=s.geometry.attributes.skinIndex.getX(t.a);return Ru[wi[i]]??"body"}const Rs=.6,Rn=.45,Le=new T(0,1.42,.335);function A1(){const s=document.createElement("canvas");s.width=1024,s.height=256;const t=s.getContext("2d"),e=t.createLinearGradient(0,0,0,256);e.addColorStop(0,"#1a0608"),e.addColorStop(1,"#3a0a0c"),t.fillStyle=e,t.fillRect(0,0,1024,256);for(let n=0;n<30;n++)t.fillStyle=`rgba(255,${80+Math.random()*80},40,0.08)`,t.fillRect(Math.random()*1024,0,2+Math.random()*20,256);t.textAlign="center",t.textBaseline="middle",t.shadowColor="#ff3a1a",t.shadowBlur=30,t.font='bold 92px Impact, "Arial Black", sans-serif',t.fillStyle="#ffe8c8",t.fillText("CORPORATE",512,92),t.font='bold 110px Impact, "Arial Black", sans-serif',t.fillStyle="#ff2a1a",t.fillText("ZOMBIES",512,196),t.shadowBlur=0,t.strokeStyle="#ffb040",t.lineWidth=6,t.strokeRect(8,8,1008,240);const i=new Un(s);return i.colorSpace=Be,i}function R1(){const s=document.createElement("canvas");s.width=256,s.height=512;const t=s.getContext("2d");t.fillStyle="#120a10",t.fillRect(0,0,256,512),t.fillStyle="#2a0a0a";for(let i=0;i<5;i++){const n=30+i*45,r=330+i%2*30;t.fillRect(n,r,26,120),t.beginPath(),t.arc(n+13,r-10,14,0,7),t.fill(),t.fillRect(n-14,r+10,54,10)}t.save(),t.translate(128,160),t.rotate(-.15),t.font="bold 44px Impact, sans-serif",t.textAlign="center",t.fillStyle="#ff3a1a",t.shadowColor="#ff3a1a",t.shadowBlur=16,t.fillText("CORPORATE",0,0),t.fillText("ZOMBIES",0,50),t.restore(),t.fillStyle="#ff8a2a",t.fillRect(0,0,256,6),t.fillRect(0,506,256,6);const e=new Un(s);return e.colorSpace=Be,e}function C1(){const s=document.createElement("canvas");s.width=256,s.height=256;const t=s.getContext("2d");t.fillStyle="#0c0814",t.fillRect(0,0,256,256);const e=["#3a1a5a","#1a4a5a","#5a1a3a","#4a4a1a"];for(let n=0;n<40;n++){t.strokeStyle=e[n%4],t.lineWidth=3,t.beginPath();const r=Math.random()*256,a=Math.random()*256;n%3===0?t.arc(r,a,6+Math.random()*10,0,7):(t.moveTo(r,a),t.lineTo(r+20,a+10),t.lineTo(r+5,a+25)),t.stroke()}const i=new Un(s);return i.wrapS=i.wrapT=Us,i.repeat.set(6,6),i.colorSpace=Be,i}class P1{scene=new tu;camera=new fi(60,1,.02,60);screen;crt;gun=new pe;muzzleFlash;flashLight;cable;cablePos;cableN=140;holster=new Me;gunAnchor=new T(.24,1.02,.5);mode="idle";modeT=0;idlePos=new T(0,1.55,2.5);idleLook=new T(0,1.2,0);playPos=new T;playShift=0;aimWorld=new T(0,1.42,.335);aimTarget=new T(0,1.42,.335);recoil=0;flashT=0;ray=new fu;gunHold=new T;gunGrip;hand;aspect=1;neon=[];constructor(t,e){const i=this.scene;i.background=new Nt(328458),i.fog=new Ia(328458,4,14),i.add(new cu(6965914,1051156,.9));const n=new Yn(16730784,6,6,1.5);n.position.set(-1.8,2.6,1.6),i.add(n);const r=new Yn(3854591,5,6,1.5);r.position.set(1.9,2.3,1.4),i.add(r);const a=new Yn(16767152,1.5,4,1.5);a.position.set(0,1.6,2.2),i.add(a);const o=new Vt(new _e(14,14),new te({map:C1()}));o.rotation.x=-Math.PI/2,i.add(o);const l=new Vt(new _e(14,5),new te({color:1182744}));l.position.set(0,2.5,-1.2),i.add(l);const c=new Vt(new _e(2.6,.65),new Wt({map:li("THE DARKNET DISTRICT","· 24H ARCADE ·","#ff4ad8","#05030a",1024,256),blending:Oi,transparent:!0}));c.position.set(0,3,-1.18),i.add(c);for(const N of[-1.15,1.15,-2.3,2.3]){const V=new pe;V.position.set(N,0,-.05-Math.abs(N)*.08),V.rotation.y=-N*.12,i.add(V);const k=new Vt(new Yt(.78,1.85,.75),new te({color:[1710650,2759194,1714714,2759210][Math.floor((N+3)*3)%4]}));k.position.y=.925,V.add(k);const K=new Vt(new _e(.52,.4),new Wt({color:[3836671,16738874,7012202,16726783][Math.floor((N+3)*3)%4]}));K.position.set(0,1.4,.38),V.add(K),this.neon.push(K);const tt=new Vt(new _e(.7,.18),new Wt({color:16777215,map:lr()}));tt.position.set(0,1.78,.38),V.add(tt)}const u=new pe;i.add(u);const f=new Jt({color:1314830,shininess:30}),h=new te({map:R1()}),d=(N,V,k,K,tt)=>{const at=new Vt(N,V);return at.position.set(k,K,tt),u.add(at),at};d(new Yt(.06,2,.8),[h,h,f,f,h,h],-.43,1,0),d(new Yt(.06,2,.8),[h,h,f,f,h,h],.43,1,0),d(new Yt(.8,.98,.7),f,0,.49,-.02),d(new Yt(.8,.7,.4),f,0,1.45,-.15),d(new Yt(.8,.08,.8),f,0,1.99,0);const g=new Jt({color:328965,shininess:60});d(new Yt(.8,.09,.04),g,0,Le.y+Rn/2+.045,Le.z+.01),d(new Yt(.8,.09,.04),g,0,Le.y-Rn/2-.045,Le.z+.01),d(new Yt(.1,Rn+.18,.04),g,-Rs/2-.05,Le.y,Le.z+.01),d(new Yt(.1,Rn+.18,.04),g,Rs/2+.05,Le.y,Le.z+.01);const y=d(new _e(.8,.2),new Wt({map:A1()}),0,1.84,.37);y.rotation.x=-.12,d(new Yt(.82,.04,.5),f,0,1.73,.2);const m=d(new Yt(.86,.06,.42),new Jt({color:2759186,shininess:40}),0,1,.42);m.rotation.x=.25;const p=d(new _e(.84,.36),new Wt({map:li("SHOOT THE SCREEN · AIM OFF-SCREEN TO RELOAD","1 PLAYER · LIGHT GUN","#ffb040","#1a0a06",2400,260)}),0,1.032,.43);p.rotation.x=-Math.PI/2+.25;for(const[N,V]of[[-.3,16719904],[.3,2138367]]){const k=d(new Nn(.03,.03,.03,12),new Wt({color:V}),N,1.05,.36);k.rotation.x=.25}d(new Yt(.36,.42,.02),new Jt({color:3815998,shininess:80}),0,.45,.34);for(const N of[-.07,.07])d(new _e(.05,.07),new Wt({color:16724e3}),N,.52,.352);d(new _e(.76,.08),new Wt({color:16738848}),0,.06,.336),this.crt=new yi({uniforms:{tGame:{value:t},tHud:{value:e},uTime:{value:0},uFlash:{value:0},uMuzzle:{value:0},uPower:{value:1}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",fragmentShader:`uniform sampler2D tGame; uniform sampler2D tHud; uniform float uTime, uFlash, uMuzzle, uPower; varying vec2 vUv;
        void main(){
          vec2 uv = vUv;
          float ca = 0.0009;
          vec3 col = vec3(texture2D(tGame, uv + vec2(ca, 0.0)).r, texture2D(tGame, uv).g, texture2D(tGame, uv - vec2(ca, 0.0)).b);
          col = col * 1.25;
          col = col / (1.0 + col * 0.35);
          vec4 hud = texture2D(tHud, uv);
          col = mix(col, hud.rgb, hud.a);
          float sl = 0.8 + 0.2 * sin(uv.y * 600.0 * 3.14159);
          col *= sl;
          vec2 d = uv - 0.5;
          col *= 1.0 - dot(d, d) * 1.2;
          col += vec3(0.85, 0.04, 0.02) * uFlash * (0.25 + length(d));
          col += vec3(uMuzzle * 0.06);
          col *= 0.97 + 0.03 * sin(uTime * 55.0);
          float p = uPower;
          float band = smoothstep(0.0, 0.02, p - abs(uv.y - 0.5) * 2.0 * (1.0 - p * 0.98));
          col *= band;
          col += vec3(0.6, 0.7, 0.8) * (1.0 - p) * band * 0.4;
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`}),this.screen=d(new _e(Rs,Rn),this.crt,Le.x,Le.y,Le.z);const b=d(new _e(Rs,Rn),new Wt({map:lr(),color:1053720,transparent:!0,blending:Oi,depthWrite:!1}),-.12,Le.y+.08,Le.z+.004);b.scale.set(.6,.5,1),b.raycast=()=>{};const S=new Yn(9089279,2,2.2,1.5);S.position.set(0,1.42,.7),i.add(S),this.holster.position.set(.24,1.07,.48),this.holster.rotation.set(-1.25,.25,0),u.add(this.holster);const v=new Jt({color:16738842,shininess:70,specular:6702114}),R=new Jt({color:1710622,shininess:50}),w=this.gun,C=(N,V,k,K,tt,at=0)=>{const lt=new Vt(N,V);return lt.position.set(k,K,tt),lt.rotation.x=at,w.add(lt),lt};C(new Yt(.042,.06,.2),v,0,0,.02),C(new Nn(.016,.018,.12,12),R,0,.008,.17,Math.PI/2),C(new Yt(.044,.012,.18),R,0,.036,.02),C(new Yt(.01,.018,.012),R,0,.05,.1),C(new Yt(.036,.11,.045),v,0,-.07,-.05,-.32),C(new Yt(.006,.03,.012),R,0,-.04,0),C(new La(.022,.004,6,12,Math.PI),R,0,-.035,0).rotation.set(0,Math.PI/2,Math.PI),this.gunGrip=new Me,this.gunGrip.position.set(0,-.13,-.075),w.add(this.gunGrip),this.hand=new pe,w.add(this.hand);const _=new te({color:13146746}),E=new te({color:1842726}),P=(N,V,k,K,tt,at=0,lt=0)=>{const Mt=new Vt(N,V);return Mt.position.set(k,K,tt),Mt.rotation.set(at,lt,0),this.hand.add(Mt),Mt};P(new Yt(.052,.07,.07),_,.004,-.065,-.045,-.32),P(new Yt(.05,.022,.03),_,.004,-.028,0,.2),P(new Yt(.018,.02,.06),_,-.024,-.012,-.03,0,.1),P(new Yt(.075,.075,.5),E,.01,-.2,-.32,-.62),P(new Yt(.08,.03,.04),new te({color:14211280}),.01,-.1,-.11,-.62),this.muzzleFlash=new nu(new zl({map:lr(),color:16765056,blending:Oi,transparent:!0,depthWrite:!1})),this.muzzleFlash.position.set(0,.008,.25),this.muzzleFlash.scale.setScalar(.12),this.muzzleFlash.visible=!1,w.add(this.muzzleFlash),this.flashLight=new Yn(16760944,0,2,2),this.flashLight.position.set(0,.01,.3),w.add(this.flashLight),w.scale.setScalar(.72),this.holster.add(w),i.add(this.camera);const I=this.cableN,L=4;this.cablePos=new Float32Array(I*L*3);const X=[];for(let N=0;N<I-1;N++)for(let V=0;V<L;V++){const k=N*L+V,K=N*L+(V+1)%L,tt=(N+1)*L+V,at=(N+1)*L+(V+1)%L;X.push(k,tt,K,K,tt,at)}const Z=new Ne;Z.setAttribute("position",new Ue(this.cablePos,3).setUsage(rr)),Z.setIndex(X),this.cable=new Vt(Z,new te({color:921104})),this.cable.frustumCulled=!1,i.add(this.cable)}resize(t,e){this.aspect=t/e;const i=this.camera;i.fov=this.aspect<.8?62:48,i.aspect=this.aspect;const n=Math.tan(Ps.degToRad(i.fov)/2),r=n*this.aspect,a=this.aspect<.8?.97:.8,o=this.aspect<.8?.62:.74,l=Rs/a/(2*r),c=Rn/o/(2*n),u=Math.max(l,c);this.playPos.set(Le.x,Le.y,Le.z+u),this.playShift=this.aspect<.8?.36:.12,this.applyProjection()}shiftNow=0;applyProjection(){const t=this.camera;t.updateProjectionMatrix(),t.projectionMatrix.elements[9]=-this.shiftNow,t.projectionMatrixInverse.copy(t.projectionMatrix).invert()}pickUp(){(this.mode==="idle"||this.mode==="toIdle")&&(this.mode="toPlay",this.modeT=0)}putDown(){(this.mode==="play"||this.mode==="toPlay")&&(this.mode="toIdle",this.modeT=0)}pick(t,e){this.ray.setFromCamera(new Ut(t,e),this.camera);const i=this.ray.intersectObject(this.screen,!1)[0],n=new Cn(new T(0,0,1),-Le.z),r=this.ray.ray.intersectPlane(n,new T);return r&&this.aimTarget.copy(r),!i||!i.uv?null:{u:i.uv.x,v:1-i.uv.y}}aimAtUV(t,e){this.aimTarget.set(Le.x+(t-.5)*Rs,Le.y+(.5-e)*Rn,Le.z)}fire(){this.recoil=1,this.flashT=.06}update(t,e,i,n){this.modeT+=t,this.crt.uniforms.uTime.value=e,this.crt.uniforms.uFlash.value=i,this.crt.uniforms.uMuzzle.value=n;for(const[u,f]of this.neon.entries())f.material.color.offsetHSL(t*.02*(u+1),0,0);const r=this.camera;let a=0;this.mode==="toPlay"?(a=Math.min(1,this.modeT/1.3),a>=1&&(this.mode="play")):this.mode==="play"?a=1:this.mode==="toIdle"&&(a=1-Math.min(1,this.modeT/1.1),a<=0&&(this.mode="idle"));const o=a<.5?2*a*a:1-Math.pow(-2*a+2,2)/2,l=(1-o)*Math.sin(e*.5)*.05;r.position.lerpVectors(this.idlePos,this.playPos,o),r.position.x+=l;const c=new T().lerpVectors(this.idleLook,Le,o);if(r.lookAt(c),this.shiftNow=this.playShift*o,this.applyProjection(),r.updateMatrixWorld(),o>.02){this.gun.parent!==r&&r.add(this.gun);const u=new T(this.aspect<.8?.5:.6,this.aspect<.8?-.8:-.62,.5).unproject(r);r.worldToLocal(u),u.setLength((this.aspect<.8,.6));const f=this.holster.getWorldPosition(new T);r.worldToLocal(f);const h=this.gun;h.position.lerpVectors(f,u,o),this.aimWorld.lerp(this.aimTarget,Math.min(1,t*22));const d=new ni;{const b=new Bt,S=h.getWorldPosition(new T);b.lookAt(this.aimWorld,S,new T(0,1,0)),d.setFromRotationMatrix(b)}const g=r.getWorldQuaternion(new ni),y=g.clone().invert().multiply(d),m=g.clone().invert().multiply(this.holster.getWorldQuaternion(new ni));h.quaternion.slerpQuaternions(m,y,o),this.recoil=Math.max(0,this.recoil-t*7);const p=this.recoil*this.recoil;h.translateZ(-p*.05),h.rotateX(-p*.35),this.hand.visible=o>.3}else this.gun.parent!==this.holster&&this.holster.add(this.gun),this.gun.position.set(0,0,0),this.gun.quaternion.identity(),this.hand.visible=!1;this.flashT-=t,this.muzzleFlash.visible=this.flashT>0,this.flashT>0&&(this.muzzleFlash.scale.setScalar(.1+Math.random()*.08),this.muzzleFlash.material.rotation=Math.random()*6),this.flashLight.intensity=this.flashT>0?6:0,this.updateCable()}updateCable(){this.scene.updateMatrixWorld();const t=this.gunAnchor,e=this.gunGrip.getWorldPosition(new T),i=t.clone().add(e).multiplyScalar(.5);i.y-=.25+t.distanceTo(e)*.25;const n=new Cd(t,i,e),r=this.cableN,a=4,o=.011,l=.0035,c=60,u=new T,f=new T,h=new T,d=new T,g=new T(0,1,0),y=n.getSpacedPoints(r-1);for(let p=0;p<r;p++){const b=p/(r-1);n.getTangent(b,u),f.crossVectors(u,g),f.lengthSq()<1e-4&&f.set(1,0,0),f.normalize(),h.crossVectors(u,f).normalize();const S=b*c*Math.PI*2,v=p<4||p>r-5?0:o;d.copy(y[p]).addScaledVector(f,Math.cos(S)*v).addScaledVector(h,Math.sin(S)*v);for(let R=0;R<a;R++){const w=R/a*Math.PI*2,C=(p*a+R)*3;this.cablePos[C]=d.x+(f.x*Math.cos(w)+h.x*Math.sin(w))*l,this.cablePos[C+1]=d.y+(f.y*Math.cos(w)+h.y*Math.sin(w))*l,this.cablePos[C+2]=d.z+(f.z*Math.cos(w)+h.z*Math.sin(w))*l}}const m=this.cable.geometry;m.attributes.position.needsUpdate=!0,m.computeVertexNormals()}}function I1(s,t){const e=new Map,i=(r,a)=>{e.get(r)?.forEach(o=>o(a)),e.get("*")?.forEach(o=>o({event:r,data:a})),window.dispatchEvent(new CustomEvent("corporatezombies:"+r,{detail:a}))};s.events.push(i);const n={version:"1.0",enterArcade:()=>t.enter(),exitArcade:()=>t.exit(),startGame:()=>{t.cabinet.mode!=="play"&&t.enter(),s.startGame()},pause:()=>t.pause(),resume:()=>t.resume(),restart:()=>{t.resume(),s.startGame()},setPlayer:r=>{s.playerHandle=r?.handle?String(r.handle).slice(0,20):""},getState:()=>({mode:s.mode,cabinet:t.cabinet.mode,paused:s.paused,score:s.score,floor:s.levelInfo?.floor??null,lives:s.lives,health:s.health}),getLeaderboard:()=>s.board.slice(),getDisplayTextures:()=>({game:t.displayTexture,hud:s.hudTex,aspect:4/3}),trigger:(r,a)=>{r===null||a===void 0||r<0||r>1||a<0||a>1?s.reload():s.fire(r,a)},on:(r,a)=>(e.has(r)||e.set(r,new Set),e.get(r).add(a),()=>e.get(r).delete(a)),emit:i};return window.CorporateZombiesArcade=n,n}const ks=document.getElementById("game"),on=new kx({antialias:!0,powerPreference:"high-performance"});on.setPixelRatio(Math.min(window.devicePixelRatio,2));on.outputColorSpace=Be;ks.appendChild(on.domElement);const L1=800,D1=600,jl=new ki(L1,D1,{samples:4,type:$i}),Kt=new E1,ve=new P1(jl.texture,Kt.hudTex),Iu=window.matchMedia("(pointer: coarse)").matches;Kt.touch=Iu;function ss(s,t,e=ks){const i=document.createElement("button");return i.id=s,i.className="cz-btn",i.textContent=t,i.type="button",e.appendChild(i),i}const tc=ss("cz-pause","II"),Aa=ss("cz-reload","RELOAD"),ec=ss("cz-approach","▶ PICK UP THE LIGHT GUN"),ic=document.createElement("div");ic.id="cz-hint";ks.appendChild(ic);const ji=document.createElement("div");ji.id="cz-menu";ji.className="cz-hidden";ks.appendChild(ji);const Lu=document.createElement("h2");Lu.textContent="PAUSED";ji.appendChild(Lu);const Du=ss("cz-resume","RESUME",ji),Uu=ss("cz-restart","RESTART",ji),El=ss("cz-mute","SOUND: ON",ji),Nu=ss("cz-exit","EXIT ARCADE",ji),U1=s=>{s.stopPropagation()};for(const s of[tc,Aa,ec,Du,Uu,El,Nu])s.addEventListener("pointerdown",U1);function is(s){ve.mode!=="play"&&s||(Kt.paused=s,ji.classList.toggle("cz-hidden",!s),s?H.setAmbience(.1):H.setAmbience(.6),nc.emit(s?"pause":"resume"))}tc.addEventListener("click",()=>is(!Kt.paused));Du.addEventListener("click",()=>is(!1));Uu.addEventListener("click",()=>{is(!1),Kt.startGame()});El.addEventListener("click",()=>{H.setMuted(!H.muted),El.textContent=H.muted?"SOUND: OFF":"SOUND: ON"});Nu.addEventListener("click",()=>Fu());Aa.addEventListener("pointerdown",s=>{s.preventDefault(),Ra()});ec.addEventListener("click",()=>ka());function ka(){H.unlock(),ve.pickUp(),nc.emit("enter")}function Fu(){Kt.paused=!1,ji.classList.add("cz-hidden"),Kt.mode!=="attract"&&Kt.toAttract(),ve.putDown(),nc.emit("exit")}function Ra(){ve.mode!=="play"||Kt.paused||(ve.fire(),Kt.reload())}const wr=on.domElement;wr.style.touchAction="none";function Ou(s){const t=wr.getBoundingClientRect();return{x:(s.clientX-t.left)/t.width*2-1,y:-((s.clientY-t.top)/t.height)*2+1}}wr.addEventListener("pointerdown",s=>{if(s.preventDefault(),H.unlock(),ve.mode==="idle"||ve.mode==="toIdle"){ka();return}if(ve.mode!=="play"||Kt.paused)return;if(s.pointerType==="mouse"&&s.button===2){Ra();return}if(s.pointerType==="mouse"&&s.button!==0)return;const t=Ou(s),e=ve.pick(t.x,t.y);if(e){const i=Kt.ammo,n=Kt.mode==="play"||Kt.mode==="results";Kt.aimX=e.u*800,Kt.aimY=e.v*600,Kt.fire(e.u,e.v),n&&i>0&&ve.fire()}else Ra()});wr.addEventListener("pointermove",s=>{if(ve.mode==="play"&&s.pointerType==="mouse"){const t=Ou(s),e=ve.pick(t.x,t.y);Kt.aimOn=!!e,e&&(Kt.aimX=e.u*800,Kt.aimY=e.v*600)}});wr.addEventListener("contextmenu",s=>s.preventDefault());window.addEventListener("keydown",s=>{s.code==="KeyR"||s.code==="Space"?(s.preventDefault(),Ra()):s.code==="Escape"||s.code==="KeyP"?is(!Kt.paused):s.code==="Enter"&&ve.mode==="idle"&&ka()});document.addEventListener("visibilitychange",()=>{document.hidden&&Kt.mode==="play"&&ve.mode==="play"&&is(!0)});function ku(){const s=ks.clientWidth||window.innerWidth,t=ks.clientHeight||window.innerHeight;on.setSize(s,t,!1),ve.resize(s,t)}window.addEventListener("resize",ku);ku();const nc=I1(Kt,{enter:ka,exit:Fu,pause:()=>is(!0),resume:()=>is(!1),cabinet:ve,displayTexture:jl.texture});(async()=>{try{const s=await(window.__TESANA_READY__??Promise.resolve(window.Tesana));if(s){Kt.tesana=s,await Kt.refreshBoard();try{const t=await s.scores.best("highscore");t&&t.score>Kt.hiScore&&(Kt.hiScore=t.score)}catch{}}}catch{}})();window.__CZ__={game:Kt,cab:ve};let Fh=performance.now();function Bu(s){const t=Math.min(.05,(s-Fh)/1e3);Fh=s,Kt.update(t),ve.update(t,Kt.realTime,Kt.damageFlash,Kt.muzzle);const e=ve.mode==="play";ec.classList.toggle("cz-hidden",ve.mode!=="idle"),tc.classList.toggle("cz-hidden",!e),Aa.classList.toggle("cz-hidden",!e||Kt.mode!=="play"&&Kt.mode!=="results"),Aa.classList.toggle("cz-urgent",Kt.ammo===0),ic.textContent=ve.mode==="idle"?"THE DARKNET DISTRICT · AN OLD CABINET HUMS IN THE CORNER":e&&Kt.mode==="attract"?Iu?"TAP THE MONITOR TO SHOOT · TAP OUTSIDE IT TO RELOAD":"CLICK THE MONITOR TO SHOOT · AIM OFF-SCREEN OR RIGHT-CLICK TO RELOAD":"",on.setRenderTarget(jl),on.render(Kt.scene,Kt.camera),on.setRenderTarget(null),on.render(ve.scene,ve.camera),requestAnimationFrame(Bu)}requestAnimationFrame(Bu);
