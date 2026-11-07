/* Connection limits and client-address handling. Pure: the clock and every address are passed in. */
'use strict';

/* The visitor's address. Behind Render's proxy the real address is in X-Forwarded-For, but the header is only trustworthy as far as
   the proxies we run behind: with `hops` proxies in front, the address is the entry `hops` places from the right (anything further
   left was supplied by the visitor and can be forged). With hops = 0 the socket address is used. */
function clientIp(remote,xff,hops=0){
  const ok=v=>typeof v==='string'&&/^[0-9a-fA-F:.]{3,45}$/.test(v);
  if(hops>0&&typeof xff==='string'){const list=xff.split(',').map(s=>s.trim());const ip=list[list.length-hops];if(ok(ip))return ip;}
  return ok(remote)?remote:'unknown';
}

class ConnectionGate{
  constructor({perIp=4,perIpPerMinute=20,total=60,now=()=>Date.now()}={}){this.perIp=perIp;this.perMinute=perIpPerMinute;this.total=total;this.now=now;this.open=new Map();this.opened=new Map();this.count=0;}
  /* Call before accepting a socket. On ok, call release(ip) exactly once when it closes. */
  admit(ip){
    const t=this.now(),recent=(this.opened.get(ip)||[]).filter(x=>t-x<60_000);
    if(this.count>=this.total)return {ok:false,reason:'hub is full'};
    if((this.open.get(ip)||0)>=this.perIp)return {ok:false,reason:'too many connections from this address'};
    if(recent.length>=this.perMinute)return {ok:false,reason:'connecting too quickly'};
    recent.push(t);this.opened.set(ip,recent);this.open.set(ip,(this.open.get(ip)||0)+1);this.count++;
    if(this.opened.size>5000)for(const [k,v] of this.opened)if(!v.some(x=>t-x<60_000))this.opened.delete(k);
    return {ok:true};
  }
  release(ip){const n=(this.open.get(ip)||0)-1;if(n<=0)this.open.delete(ip);else this.open.set(ip,n);this.count=Math.max(0,this.count-1);}
}
module.exports={clientIp,ConnectionGate};
