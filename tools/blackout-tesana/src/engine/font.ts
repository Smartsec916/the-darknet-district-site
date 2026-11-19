// 5x7 bitmap font, each glyph = 7 rows encoded base-32 (5 bits per row).
import { makeCanvas } from "./view";
const G: Record<string, string> = {
  A: "EHHVHHH", B: "UHHUHHU", C: "EHGGGHE", D: "UHHHHHU", E: "VGGUGGV", F: "VGGUGGG", G: "EHGNHHF",
  H: "HHHVHHH", I: "E44444E", J: "72222IC", K: "HIKOKIH", L: "GGGGGGV", M: "HRLLHHH", N: "HHPLJHH",
  O: "EHHHHHE", P: "UHHUGGG", Q: "EHHHLID", R: "UHHUKIH", S: "FGGE11U", T: "V444444", U: "HHHHHHE",
  V: "HHHHHA4", W: "HHHLLLA", X: "HHA4AHH", Y: "HHA4444", Z: "V1248GV",
  "0": "EHJLPHE", "1": "4C4444E", "2": "EH1248V", "3": "V2421HE", "4": "26AIV22", "5": "VGU11HE",
  "6": "68GUHHE", "7": "V124888", "8": "EHHEHHE", "9": "EHHF12C",
  " ": "0000000", ".": "00000CC", ",": "0000C48", "!": "4444404", "?": "EH12404", ":": "0CC0CC0",
  "-": "000V000", "+": "044V440", "/": "11248GG", "'": "4480000", "(": "2488842", ")": "8422248",
  "%": "OP248J3", ">": "8421248", "<": "248G842", "=": "00V0V00", "#": "AAVAVAA", "$": "AU9E9UA",
  "*": "0LEVEL0", "^": "4EL4440", "|": "4444444", "_": "000000V", '"': "AA00000", "@": "EHLNMGE",
  "[": "E88888E", "]": "E22222E", "~": "008L200", "&": "8KK8LID",
};
const ORDER = Object.keys(G);
const IDX: Record<string, number> = {};
ORDER.forEach((k, i) => (IDX[k] = i));
const atlas: Record<string, HTMLCanvasElement> = {};
function decode(ch: string): number { const c = ch.charCodeAt(0); return c <= 57 ? c - 48 : c - 55; }
function getAtlas(color: string): HTMLCanvasElement {
  let a = atlas[color];
  if (a) return a;
  const [c, x] = makeCanvas(ORDER.length * 6, 7);
  x.fillStyle = color;
  ORDER.forEach((k, i) => {
    const g = G[k];
    for (let r = 0; r < 7; r++) {
      const v = decode(g[r]);
      for (let b = 0; b < 5; b++) if (v & (16 >> b)) x.fillRect(i * 6 + b, r, 1, 1);
    }
  });
  atlas[color] = c;
  return c;
}
export function textWidth(s: string, scale = 1): number { return s.length * 6 * scale - scale; }
export type Align = "left" | "center" | "right";
export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = "#e8f4ff", scale = 1, align: Align = "left", shadow: string | null = "#05070C"): void {
  s = s.toUpperCase();
  const w = textWidth(s, scale);
  let ox = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  const oy = Math.round(y);
  if (shadow) drawRaw(ctx, s, ox + scale, oy + scale, shadow, scale);
  drawRaw(ctx, s, ox, oy, color, scale);
}
function drawRaw(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, scale: number): void {
  const a = getAtlas(color);
  for (let i = 0; i < s.length; i++) {
    const gi = IDX[s[i]];
    if (gi === undefined || s[i] === " ") continue;
    ctx.drawImage(a, gi * 6, 0, 5, 7, x + i * 6 * scale, y, 5 * scale, 7 * scale);
  }
}
export function wrapText(s: string, maxChars: number): string[] {
  const words = s.split(" "); const out: string[] = []; let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) { if (line) out.push(line); line = w; }
    else line = (line + " " + w).trim();
  }
  if (line) out.push(line);
  return out;
}
