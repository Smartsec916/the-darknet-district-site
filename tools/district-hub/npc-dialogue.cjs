// The hub distributes only a turn number. Each listener resolves its own published recordings.
class NpcDialogue {
  constructor(now, send) {
    this.now = now;
    this.send = send;
    this.groups = new Map();
    // Each connection may listen to only one linked conversation at a time.
    this.activeByPeer = new Map();
    this.serial = 0;
  }
  finish(group, peer) {
    if (!group.listeners.delete(peer)) return;
    if (this.activeByPeer.get(peer) === group) this.activeByPeer.delete(peer);
    if (!group.listeners.size) group.next = this.now() + group.cooldown;
  }
  depart(peer) {
    for (const group of this.groups.values()) {
      group.ready.delete(peer);
      this.finish(group, peer);
    }
  }
  handle(peer, msg) {
    if (!peer?.placed) return;
    const key = peer.room + '/' + msg.group;
    const now = this.now();
    let group = this.groups.get(key);
    if (msg.t === 'npc-end') {
      if (group && group.token === msg.token) this.finish(group, peer);
      return;
    }
    if (this.activeByPeer.has(peer)) return;
    if (now - (peer.lastNpcReady ?? -Infinity) < 150) return;
    peer.lastNpcReady = now;
    if (!group) {
      if (this.groups.size >= 256) return;
      group = {ready:new Map(), listeners:new Set(), turn:0, next:now+600, touched:now};
      this.groups.set(key, group);
    }
    group.touched = now;
    group.ready.set(peer, now);
    if (group.listeners.size || now < group.next) return;
    const listeners = [...group.ready].filter(([p,at]) => now-at < 1200 && p.placed && !this.activeByPeer.has(p) && p.room === peer.room && Math.hypot(p.x-peer.x,p.z-peer.z) <= 18);
    group.ready.clear();
    group.token = ++this.serial;
    group.cooldown = msg.cooldown * 1000;
    group.expires = now + 48000;
    for (const [p] of listeners) {
      group.listeners.add(p);
      this.activeByPeer.set(p, group);
      this.send(p.conn,{t:'npc-turn',group:msg.group,token:group.token,turn:group.turn});
    }
    group.turn++;
  }
  sweep() {
    const now = this.now();
    for (const [key,group] of this.groups) {
      if (group.listeners.size && now >= group.expires) {
        for (const peer of group.listeners) this.finish(group, peer);
      }
      if (!group.listeners.size && now > Math.max(group.touched,group.next)+60000) this.groups.delete(key);
    }
  }
}
module.exports = {NpcDialogue};
