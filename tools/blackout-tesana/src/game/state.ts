// Persistent profile (save/resume), equipment tiers and the stats they produce.
import { LEVELS } from "../world/levels";
export interface LevelStat { shards: boolean[]; best: number; done: boolean; setBonus: boolean }
export interface Resume { level: number; cp: string | null; shards: boolean[]; coins: number[]; btc: number; score: number }
export interface SaveData {
  v: 1; unlocked: number; btc: number; score: number; up: Record<string, number>; shield: number; sidearm: boolean;
  stats: Record<string, LevelStat>; resume: Resume | null; muted: boolean;
  fx: { scanlines: boolean; glow: boolean; grid: boolean; cabinet: boolean }; finished: boolean;
}
const GUEST_KEY = "blackout_protocol_save_v1";
let saveKey = GUEST_KEY;
let saveOwner: string | null = null;
export function freshSave(): SaveData {
  return { v: 1, unlocked: 1, btc: 0, score: 0, up: {}, shield: 0, sidearm: false, stats: {}, resume: null, muted: false, fx: { scanlines: true, glow: true, grid: false, cabinet: true }, finished: false };
}
export let save: SaveData = load();
function load(): SaveData {
  try { const s = localStorage.getItem(saveKey); if (s) { const d = JSON.parse(s); if (d && d.v === 1) return { ...freshSave(), ...d, fx: { ...freshSave().fx, ...(d.fx || {}) } }; } } catch { /* */ }
  return freshSave();
}
export const persistGate = { off: false };
export function persist(): void { if (persistGate.off) return; try { localStorage.setItem(saveKey, JSON.stringify(save)); } catch { /* */ } }
/** Keep guest progress in the export's original key and isolate each District account on this device. */
export function setSaveOwner(uid: string | null): boolean {
  if (uid === saveOwner) return false;
  persist();
  saveOwner = uid;
  saveKey = uid ? `${GUEST_KEY}_uid_${encodeURIComponent(uid)}` : GUEST_KEY;
  save = load();
  return true;
}
export function resetSave(): void { const fx = save.fx, muted = save.muted; save = freshSave(); save.fx = fx; save.muted = muted; persist(); }
export function statOf(id: string): LevelStat { if (!save.stats[id]) save.stats[id] = { shards: [false, false, false], best: 0, done: false, setBonus: false }; return save.stats[id]; }
export const tier = (k: string) => save.up[k] || 0;

export interface ShopItem { id: string; name: string; cat: string; desc: string; prices: number[]; stat: (t: number) => string; consumable?: boolean; needs?: () => string | null; icon: string }
export const SHOP: ShopItem[] = [
  { id: "armor", name: "ARMOR WEAVE", cat: "ARMOR", icon: "armor", desc: "Ballistic fibre stitched into your jacket. Raises max HP by 20 per tier.", prices: [12, 20, 32], stat: (t) => `MAX HP ${100 + t * 20} > ${100 + (t + 1) * 20}` },
  { id: "empcap", name: "EMP CAPACITOR", cat: "EMP", icon: "emp", desc: "Stores an extra EMP charge and widens the pulse.", prices: [10, 22], stat: (t) => `CHARGES ${2 + t} > ${3 + t} +RANGE` },
  { id: "overclock", name: "EMP OVERCLOCK", cat: "EMP", icon: "bolt", desc: "Stuns machines longer and recharges faster.", prices: [15, 26], stat: (t) => `STUN ${(3.5 + t * 1.5).toFixed(1)}S > ${(5 + t * 1.5).toFixed(1)}S` },
  { id: "rapid", name: "RAPID COIL", cat: "SIDEARM", icon: "gun", desc: "Rewound accelerator coil. Fires faster.", prices: [14, 24], stat: (t) => `RATE ${[3.3, 4.5, 6.6][t].toFixed(1)}/S > ${[4.5, 6.6, 6.6][t].toFixed(1)}/S`, needs: () => (save.sidearm ? null : "SIDEARM FOUND IN SECTOR 05") },
  { id: "volt", name: "VOLT ROUNDS", cat: "SIDEARM", icon: "ammo", desc: "Overcharged bolts. More damage per shot.", prices: [18, 30], stat: (t) => `DAMAGE ${1 + t * 0.5} > ${1.5 + t * 0.5}`, needs: () => (save.sidearm ? null : "SIDEARM FOUND IN SECTOR 05") },
  { id: "shield", name: "SHIELD CELL", cat: "SHIELD", icon: "shield", desc: "Temporary barrier. Each cell blocks 2 hits. Carry up to 6.", prices: [6], consumable: true, stat: () => `SHIELD ${save.shield} > ${Math.min(6, save.shield + 2)}`, needs: () => (save.shield >= 6 ? "SHIELD FULL" : null) },
  { id: "breach", name: "BREACH KIT", cat: "HACKING", icon: "chip", desc: "Better intrusion tools. Wider hack windows, slower trace.", prices: [8, 16, 26], stat: (t) => `WINDOW +${t * 5}% > +${(t + 1) * 5}%` },
  { id: "lumen", name: "LUMEN HALO", cat: "LIGHT", icon: "light", desc: "Shoulder lamp. Bigger light radius in blackout zones.", prices: [10, 20], stat: (t) => `LIGHT ${72 + t * 22} > ${94 + t * 22}` },
  { id: "rig", name: "INSULATED RIG", cat: "PROTECTION", icon: "boot", desc: "Insulated soles and steam guard. Less damage from hazards.", prices: [12, 24], stat: (t) => `HAZARD DMG -${t * 25}% > -${(t + 1) * 25}%` },
  { id: "medkit", name: "NANO MEDKIT", cat: "HEAL", icon: "med", desc: "Instant repair. Restores 50 HP (used immediately).", prices: [5], consumable: true, stat: () => "HP +50" },
];
export function stats() {
  const a = tier("armor"), ec = tier("empcap"), oc = tier("overclock"), r = tier("rapid"), v = tier("volt"), br = tier("breach"), lu = tier("lumen"), rig = tier("rig");
  return {
    maxHp: 100 + a * 20, empMax: 2 + ec, empRadius: 52 + ec * 12, empStun: 3.5 + oc * 1.5, empRecharge: 7 - oc * 1.5,
    fireCd: [0.3, 0.22, 0.15][r], dmg: 1 + v * 0.5, hackWin: br * 0.05, hackSlow: 1 - br * 0.09, lightR: 72 + lu * 22, hazard: 1 - rig * 0.25,
  };
}
export function levelCount(): number { return LEVELS.length; }
