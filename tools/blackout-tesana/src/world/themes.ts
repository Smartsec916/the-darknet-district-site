import type { SoundTheme } from "../engine/audio";
export interface LayerSpec { p: string; f: number; col: string; hi: string; lo?: string; y?: number; dens?: number; h?: number }
export interface Theme {
  key: string; indoor: boolean;
  mats: { ground: number; ledge: number; block: number; slab: number };
  tile: { base: string; hi: string; lo: string; line: string; accent: string; accent2: string };
  sky: [string, string, string]; layers: LayerSpec[];
  rain: number; flyers: number; searchlights: number; lightning: boolean; fog: string; ambient: number;
  sound: SoundTheme; ads: string[]; neon: string[]; fgCables: boolean; steam: boolean; light: string;
  /** Muted, weathered look: dimmer windows/signs, grime, slight desaturation. */
  gritty?: boolean; windows?: string[];
  /** Original painted parallax backdrop (assets/bg/{id}_far/near.webp) used instead of the procedural layers. */
  img?: { id: string; farF: number; farY?: number; nearF: number; nearGap: number; nearDrop?: number };
  /** Residents use the original female character art. */
  female?: boolean;
  /** Opacity of the procedural building backdrops behind the platforms (default 1, gritty 0.8). */
  facadeAlpha?: number;
}
// material ids (mirrors M in level.ts — kept literal to avoid a cycle)
const CON = 1, MET = 2, BRI = 3, GRA = 4, PIP = 5, CAT = 11, SRV = 12, TIL = 18, ROC = 19, BEA = 10;
const minor = [0, 2, 3, 5, 7, 8, 10], dorian = [0, 2, 3, 5, 7, 9, 10], phryg = [0, 1, 3, 5, 7, 8, 10];
export const THEMES: Record<string, Theme> = {
  undergrid: {
    key: "undergrid", indoor: false, mats: { ground: CON, ledge: GRA, block: BRI, slab: CON },
    tile: { base: "#2a2f33", hi: "#4a5256", lo: "#14181b", line: "#090b0d", accent: "#b8741a", accent2: "#7a3a2a" },
    sky: ["#040a12", "#0a1a28", "#18262a"],
    layers: [
      { p: "mistcity", f: 0.05, col: "#1c3a52", hi: "#c0405a", dens: 0.5, h: 250 },
      { p: "mistcity", f: 0.14, col: "#15303f", hi: "#3a8a9a", dens: 0.4, h: 210 },
      { p: "containers", f: 0.32, col: "#10202a", hi: "#2f8a8a", h: 170 },
      { p: "pipes", f: 0.55, col: "#13171c", hi: "#3a2a22", h: 220 },
    ],
    rain: 0.12, flyers: 0, searchlights: 0, lightning: false, fog: "#1c2a2c", ambient: 0.3,
    sound: { drone: 49, noiseF: 300, noiseV: 0.05, root: 110, scale: minor, bpm: 92, arp: false, mood: 0.3 },
    ads: ["RUST", "NOODLE", "VOLT", "OPEN 24", "REPAIRS"], neon: ["#b8741a", "#8a3a2a", "#2f8a8a", "#8a3a6a"], fgCables: true, steam: true, light: "#d89a40",
    gritty: true, windows: ["#8a5a22", "#a8742c", "#2f7a7a", "#8a2a40"],
    img: { id: "01", farF: 0.06, farY: 30, nearF: 0.38, nearGap: 150, nearDrop: 6 }, facadeAlpha: 0.7,
  },
  // Title screen only: same grim palette, a little more skyline.
  title: {
    key: "title", indoor: false, mats: { ground: CON, ledge: GRA, block: BRI, slab: CON },
    tile: { base: "#2a2f33", hi: "#4a5256", lo: "#14181b", line: "#090b0d", accent: "#b8741a", accent2: "#7a3a2a" },
    sky: ["#040a12", "#0a1a28", "#18262a"],
    layers: [
      { p: "mistcity", f: 0.05, col: "#1c3a52", hi: "#c0405a", dens: 0.6, h: 280 },
      { p: "mistcity", f: 0.13, col: "#15303f", hi: "#3a8a9a", dens: 0.5, h: 240 },
      { p: "containers", f: 0.26, col: "#10202a", hi: "#2f8a8a", h: 190 },
      { p: "containers", f: 0.46, col: "#0c171e", hi: "#2f8a8a", h: 170 },
    ],
    rain: 0.15, flyers: 0, searchlights: 0, lightning: false, fog: "#1c2a2c", ambient: 0.3,
    sound: { drone: 49, noiseF: 300, noiseV: 0.05, root: 110, scale: minor, bpm: 92, arp: false, mood: 0.3 },
    ads: ["RUST", "NOODLE", "VOLT", "OPEN 24", "REPAIRS"], neon: ["#b8741a", "#8a3a2a", "#2f8a8a", "#8a3a6a"], fgCables: false, steam: false, light: "#d89a40", gritty: true,
  },
  watcher: {
    key: "watcher", indoor: false, mats: { ground: CON, ledge: GRA, block: CON, slab: CON },
    tile: { base: "#2b3244", hi: "#56618a", lo: "#141826", line: "#0a0d16", accent: "#48E6E0", accent2: "#6828B8" },
    sky: ["#050816", "#0d1230", "#2a1a4a"],
    layers: [
      { p: "megatowers", f: 0.05, col: "#0c1228", hi: "#6a7aff", dens: 0.7, h: 300 },
      { p: "towers", f: 0.14, col: "#101632", hi: "#48E6E0", h: 260 },
      { p: "skyline", f: 0.26, col: "#131a36", hi: "#9a8aff", dens: 0.8, h: 220 },
      { p: "buildings", f: 0.45, col: "#171d34", hi: "#6828B8", dens: 0.7, h: 200 },
    ],
    rain: 0.6, flyers: 5, searchlights: 3, lightning: true, fog: "#2a2060", ambient: 0.15,
    sound: { drone: 55, noiseF: 900, noiseV: 0.07, root: 110, scale: dorian, bpm: 100, arp: true, mood: 0.4 },
    ads: ["BLACKROCK", "OXYGEN", "SKINSHIFT", "ZEN", "DOWNTHERE"], neon: ["#48E6E0", "#6828B8", "#9a7aff", "#ffffff"], fgCables: true, steam: false, light: "#48E6E0",
    img: { id: "02", farF: 0.06, farY: 30, nearF: 0.38, nearGap: 140, nearDrop: 6 }, facadeAlpha: 0.75,
  },
  bazaar: {
    key: "bazaar", indoor: false, mats: { ground: TIL, ledge: GRA, block: BRI, slab: CON },
    tile: { base: "#2c2238", hi: "#6a3a7a", lo: "#160f20", line: "#0a0710", accent: "#FF4CA8", accent2: "#48E6E0" },
    sky: ["#0a0414", "#2a0a38", "#5a1450"],
    layers: [
      { p: "megatowers", f: 0.05, col: "#160a26", hi: "#ff4ca8", dens: 0.9, h: 290 },
      { p: "skyline", f: 0.14, col: "#1c0c2e", hi: "#ff7ad0", dens: 1, h: 240 },
      { p: "bazaar", f: 0.28, col: "#1e1030", hi: "#FF4CA8", dens: 1, h: 210 },
      { p: "bazaar", f: 0.48, col: "#22122e", hi: "#48E6E0", dens: 0.8, h: 180 },
    ],
    rain: 0.45, flyers: 6, searchlights: 2, lightning: false, fog: "#5a1a5a", ambient: 0.1,
    sound: { drone: 58, noiseF: 1200, noiseV: 0.06, root: 130.8, scale: dorian, bpm: 112, arp: true, mood: 0.8 },
    ads: ["BUG", "PILL", "PLUG", "TOUCHLESS", "PINKNOISE", "KARAOKE", "RAMEN", "CLUB 9"], neon: ["#FF4CA8", "#48E6E0", "#c070ff", "#FFB44A"], fgCables: true, steam: true, light: "#FF4CA8",
  },
  perimeter: {
    key: "perimeter", indoor: false, mats: { ground: CON, ledge: CAT, block: MET, slab: MET },
    tile: { base: "#363c48", hi: "#5c6576", lo: "#1a1e26", line: "#0c0e13", accent: "#F04455", accent2: "#FFB44A" },
    sky: ["#08060a", "#1c0e12", "#3a1418"],
    layers: [
      { p: "industrial", f: 0.06, col: "#140e14", hi: "#F04455", h: 220 },
      { p: "towers", f: 0.16, col: "#181216", hi: "#F04455", h: 240 },
      { p: "industrial", f: 0.3, col: "#1c171c", hi: "#FFB44A", h: 190 },
      { p: "fence", f: 0.55, col: "#22232a", hi: "#F04455", h: 120 },
    ],
    rain: 0.2, flyers: 1, searchlights: 4, lightning: false, fog: "#3a1a1a", ambient: 0.2,
    sound: { drone: 41, noiseF: 200, noiseV: 0.08, root: 98, scale: phryg, bpm: 104, arp: false, mood: 0.6 },
    ads: ["NO ENTRY", "ZONE 4", "WARNING", "AUTHORIZED"], neon: ["#F04455", "#FFB44A"], fgCables: false, steam: true, light: "#F04455",
  },
  armory: {
    key: "armory", indoor: true, mats: { ground: MET, ledge: CAT, block: MET, slab: MET },
    tile: { base: "#3a3f48", hi: "#666e7c", lo: "#1c1f25", line: "#0c0d10", accent: "#FFB44A", accent2: "#F04455" },
    sky: ["#08080a", "#121216", "#1e1a18"],
    layers: [
      { p: "corridor", f: 0.08, col: "#121418", hi: "#FFB44A", h: 260 },
      { p: "machinery", f: 0.2, col: "#17191e", hi: "#F04455", h: 240 },
      { p: "racks", f: 0.36, col: "#1c1e24", hi: "#FFB44A", h: 200 },
      { p: "pipes", f: 0.6, col: "#202228", hi: "#4a3a2a", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#2a2014", ambient: 0.22,
    sound: { drone: 44, noiseF: 150, noiseV: 0.06, root: 103.8, scale: minor, bpm: 116, arp: true, mood: 0.6 },
    ads: ["ARMORY", "LEVEL B", "LOCKDOWN", "AMMO"], neon: ["#FFB44A", "#F04455"], fgCables: false, steam: true, light: "#FFB44A",
  },
  core: {
    key: "core", indoor: true, mats: { ground: MET, ledge: CAT, block: MET, slab: MET },
    tile: { base: "#262c3a", hi: "#4a5a7a", lo: "#10141c", line: "#06080c", accent: "#48E6E0", accent2: "#F04455" },
    sky: ["#04050a", "#0a1020", "#180a1a"],
    layers: [
      { p: "core", f: 0.05, col: "#0c1222", hi: "#48E6E0", h: 300 },
      { p: "machinery", f: 0.16, col: "#101626", hi: "#F04455", h: 260 },
      { p: "conduits", f: 0.32, col: "#141a2a", hi: "#48E6E0", h: 260 },
      { p: "pipes", f: 0.58, col: "#181c28", hi: "#2a3a4a", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#102030", ambient: 0.2,
    sound: { drone: 36.7, noiseF: 400, noiseV: 0.05, root: 92.5, scale: phryg, bpm: 122, arp: true, mood: 0.9 },
    ads: ["CORE", "PULSE", "GRID 6", "CAUTION"], neon: ["#48E6E0", "#F04455"], fgCables: true, steam: false, light: "#48E6E0",
  },
  transit: {
    key: "transit", indoor: true, mats: { ground: TIL, ledge: GRA, block: CON, slab: CON },
    tile: { base: "#2c2e30", hi: "#585c5a", lo: "#141516", line: "#08090a", accent: "#FFB44A", accent2: "#48E6E0" },
    sky: ["#030304", "#0a0a0c", "#141210"],
    layers: [
      { p: "tunnel", f: 0.06, col: "#0e0e10", hi: "#FFB44A", h: 220 },
      { p: "tunnel", f: 0.18, col: "#131314", hi: "#F04455", h: 220 },
      { p: "supports", f: 0.36, col: "#18181a", hi: "#FFB44A", h: 260 },
      { p: "pipes", f: 0.6, col: "#1c1c1e", hi: "#2a2a22", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#1a1410", ambient: 0.32,
    sound: { drone: 41.2, noiseF: 120, noiseV: 0.09, root: 82.4, scale: minor, bpm: 96, arp: false, mood: 0.5 },
    ads: ["LINE 7", "METRO", "MIND THE GAP", "CLOSED", "EXIT"], neon: ["#FFB44A", "#48E6E0", "#F04455"], fgCables: true, steam: false, light: "#FFB44A",
  },
  datacenter: {
    key: "datacenter", indoor: true, mats: { ground: MET, ledge: GRA, block: SRV, slab: MET },
    tile: { base: "#1e2430", hi: "#3a4660", lo: "#0c0f16", line: "#05070b", accent: "#48E6E0", accent2: "#F04455" },
    sky: ["#020306", "#05070e", "#080c16"],
    layers: [
      { p: "servers", f: 0.08, col: "#0a0e18", hi: "#48E6E0", h: 260 },
      { p: "servers", f: 0.2, col: "#0e1220", hi: "#3a8aff", h: 240 },
      { p: "fans", f: 0.36, col: "#121726", hi: "#48E6E0", h: 240 },
      { p: "cables", f: 0.6, col: "#141a26", hi: "#3a4a6a", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#081420", ambient: 0.15,
    sound: { drone: 32.7, noiseF: 180, noiseV: 0.1, root: 87.3, scale: phryg, bpm: 84, arp: false, mood: 0.2 },
    ads: ["NODE 8", "POWER FAIL", "AISLE C", "DANGER"], neon: ["#48E6E0", "#F04455"], fgCables: false, steam: false, light: "#48E6E0",
  },
  cooling: {
    key: "cooling", indoor: true, mats: { ground: MET, ledge: CAT, block: MET, slab: MET },
    tile: { base: "#24343c", hi: "#4a6a76", lo: "#0f181c", line: "#060a0c", accent: "#48E6E0", accent2: "#FFB44A" },
    sky: ["#03080a", "#08161c", "#0e2026"],
    layers: [
      { p: "fans", f: 0.06, col: "#0a161c", hi: "#48E6E0", h: 280 },
      { p: "machinery", f: 0.18, col: "#0e1c22", hi: "#48E6E0", h: 260 },
      { p: "turbines", f: 0.34, col: "#122228", hi: "#9ae6ff", h: 240 },
      { p: "pipes", f: 0.58, col: "#16262c", hi: "#2a4a52", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#0a2a30", ambient: 0.2,
    sound: { drone: 38.9, noiseF: 600, noiseV: 0.12, root: 98, scale: dorian, bpm: 108, arp: true, mood: 0.6 },
    ads: ["COOLANT", "TURBINE 3", "HOT STEAM", "PUMP"], neon: ["#48E6E0", "#FFB44A"], fgCables: false, steam: true, light: "#9ae6ff",
  },
  nexus: {
    key: "nexus", indoor: false, mats: { ground: MET, ledge: GRA, block: MET, slab: MET },
    tile: { base: "#20283c", hi: "#44567e", lo: "#0e1220", line: "#060810", accent: "#3a8aff", accent2: "#F04455" },
    sky: ["#03040c", "#0a0e24", "#1a0e2a"],
    layers: [
      { p: "megatowers", f: 0.05, col: "#0a0e22", hi: "#3a8aff", dens: 0.8, h: 300 },
      { p: "towers", f: 0.14, col: "#0e1228", hi: "#F04455", h: 260 },
      { p: "displays", f: 0.3, col: "#121830", hi: "#3a8aff", h: 230 },
      { p: "buildings", f: 0.5, col: "#151b30", hi: "#F04455", dens: 0.6, h: 200 },
    ],
    rain: 0.5, flyers: 6, searchlights: 5, lightning: true, fog: "#1a1a4a", ambient: 0.16,
    sound: { drone: 46.2, noiseF: 1000, noiseV: 0.06, root: 116.5, scale: minor, bpm: 120, arp: true, mood: 0.85 },
    ads: ["WE SEE YOU", "OBEY", "NEXUS", "COMPLY", "WATCHLIST"], neon: ["#3a8aff", "#F04455", "#ffffff"], fgCables: true, steam: false, light: "#3a8aff",
  },
  deadnet: {
    key: "deadnet", indoor: true, mats: { ground: MET, ledge: GRA, block: SRV, slab: MET },
    tile: { base: "#2a2226", hi: "#54444a", lo: "#140f12", line: "#080506", accent: "#F04455", accent2: "#FFB44A" },
    sky: ["#060304", "#120809", "#22100c"],
    layers: [
      { p: "servers", f: 0.06, col: "#120a0c", hi: "#F04455", h: 260 },
      { p: "machinery", f: 0.18, col: "#170d0f", hi: "#FFB44A", h: 250 },
      { p: "conduits", f: 0.34, col: "#1c1012", hi: "#F04455", h: 250 },
      { p: "cables", f: 0.6, col: "#201416", hi: "#4a2a2a", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#2a0a08", ambient: 0.22,
    sound: { drone: 34.6, noiseF: 250, noiseV: 0.1, root: 77.8, scale: phryg, bpm: 128, arp: true, mood: 0.95 },
    ads: ["NO SIGNAL", "ERROR", "404", "COLLAPSE"], neon: ["#F04455", "#FFB44A", "#48E6E0"], fgCables: true, steam: false, light: "#F04455",
  },
  final: {
    key: "final", indoor: true, mats: { ground: MET, ledge: CAT, block: MET, slab: MET },
    tile: { base: "#1c2232", hi: "#46527a", lo: "#0b0e18", line: "#04050a", accent: "#48E6E0", accent2: "#F04455" },
    sky: ["#04030a", "#100820", "#2a0a20"],
    layers: [
      { p: "core", f: 0.04, col: "#0c0a1e", hi: "#F04455", h: 320 },
      { p: "conduits", f: 0.14, col: "#100e24", hi: "#48E6E0", h: 280 },
      { p: "machinery", f: 0.3, col: "#141228", hi: "#F04455", h: 260 },
      { p: "pipes", f: 0.56, col: "#181628", hi: "#3a2a4a", h: 260 },
    ],
    rain: 0, flyers: 0, searchlights: 0, lightning: false, fog: "#2a0a2a", ambient: 0.18,
    sound: { drone: 36.7, noiseF: 500, noiseV: 0.07, root: 73.4, scale: phryg, bpm: 132, arp: true, mood: 1 },
    ads: ["OVERSEER", "CONTROL", "OBEY", "CORE ZERO"], neon: ["#F04455", "#48E6E0", "#6828B8"], fgCables: true, steam: false, light: "#F04455",
  },
};
// Neon Bazaar (level 3) uses the original painted backdrop and the original female residents; the plain `bazaar` theme still backs the map screens.
THEMES.neonbazaar = { ...THEMES.bazaar, key: "neonbazaar", img: { id: "03", farF: 0.06, farY: 30, nearF: 0.4, nearGap: 60, nearDrop: 6 }, female: true, facadeAlpha: 0.2 };

void [MET, BRI, GRA, PIP, CAT, SRV, TIL, ROC, BEA];
