// The original BLACKOUT PROTOCOL advertisement posters, assigned to the levels they belong to.
// Posters are drawn at screen resolution (see engine/hires.ts), never squeezed into the 320x240 pixel buffer.
export interface AdImg { key: string; img: HTMLImageElement; alt?: HTMLImageElement; aspect: number }
export const ADS: Record<string, AdImg> = {};

/** Original per-level poster assignment (keyed by level id). Levels not listed get no posters. */
export const LEVEL_ADS: Record<string, string[]> = {
  undergrid: ["fourk", "meat", "holo", "rent", "oil"],
  watcher: ["blackrock", "downthere", "oxygen", "skinshift", "zen"],
  bazaar: ["bug", "pill", "plug", "touchless", "pinknoise"],
  perimeter: ["sentry", "ironmesh", "botforce"],
  armory: ["novaarms", "dronepal", "bulletcoffee"],
  core: ["obey", "happyfeed", "dreampass"],
};
/** Width / height of each poster image (used for placement before the image has loaded). */
export const AD_ASPECT: Record<string, number> = {
  fourk: 287 / 384, meat: 357 / 384, holo: 279 / 384, rent: 247 / 384, oil: 343 / 384,
  blackrock: 351 / 384, downthere: 294 / 384, oxygen: 302 / 384, skinshift: 264 / 384, zen: 252 / 384,
  bug: 348 / 384, pill: 381 / 384, plug: 351 / 384, touchless: 248 / 384, pinknoise: 282 / 384,
  sentry: 282 / 384, ironmesh: 289 / 384, botforce: 283 / 384,
  novaarms: 259 / 384, dronepal: 226 / 384, bulletcoffee: 260 / 384,
  obey: 210 / 384, happyfeed: 286 / 384, dreampass: 258 / 384,
};
const ALT: Record<string, string> = { oil: "oil2" }; // two-frame ads
const pending: Record<string, Promise<void>> = {};
function load(src: string): Promise<HTMLImageElement> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src; });
}
function loadOne(k: string): Promise<void> {
  return (pending[k] ||= (async () => {
    const [img, alt] = await Promise.all([load(`assets/ads/${k}.webp`), ALT[k] ? load(`assets/ads/${ALT[k]}.webp`) : Promise.resolve(null)]);
    if (img.naturalWidth) ADS[k] = { key: k, img, alt: alt && alt.naturalWidth ? alt : undefined, aspect: img.naturalWidth / img.naturalHeight };
  })());
}
/** Starts loading the posters of one level (safe to call repeatedly). */
export function loadAdsFor(levelId: string): Promise<void> {
  return Promise.all((LEVEL_ADS[levelId] || []).map(loadOne)).then(() => undefined);
}
