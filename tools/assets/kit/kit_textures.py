"""Textures for the building kit (docs/development/BUILDING_KIT.md). Run by build_kit.py; needs numpy and Pillow, nothing else.

Four shared materials, each one texture set, generated here (nothing downloaded, nothing to license):
  kit_concrete  2K, tiles every 4 m   colour toned to sit beside the game's ambientCG brick (brick-color.jpg averages RGB 133,106,83)
  kit_metal     1K, tiles every 2 m   dark painted steel with rust
  kit_glass     512, one pane         dark, dirty window glass
  kit_emissive  1K ATLAS              the only light-giving texture: lit windows, neon tube, sign face (see EMISSIVE_REGIONS)
Each set is <name>_color.png, <name>_normal.png and <name>_orm.png (glTF packing: R occlusion, G roughness, B metallic).
Everything is seeded: the same files come out every time."""
import numpy as np
from PIL import Image

BRICK = np.array([133.2, 106.0, 83.5])
# Regions of the emissive atlas in UV (u0, v0, u1, v1), v up. build_kit.py maps faces into these.
EMISSIVE_REGIONS = {'window_warm': (0, .5, .25, 1), 'window_blinds': (.25, .5, .5, 1), 'window_cool': (.5, .5, .75, 1), 'window_dim': (.75, .5, 1, 1),
                    'neon_magenta': (0, .375, .5, .5), 'neon_cyan': (0, .25, .5, .375), 'neon_amber': (0, .125, .5, .25), 'neon_white': (0, 0, .5, .125),
                    'sign': (.5, 0, 1, .5)}


def _noise(n, octaves, seed, persistence=.55, base=4):
    """Tileable value noise, 0..1."""
    rng = np.random.default_rng(seed)
    out = np.zeros((n, n))
    amp, total, cells = 1.0, 0.0, base
    ys, xs = np.mgrid[0:n, 0:n] / n
    for _ in range(octaves):
        g = rng.random((cells, cells))
        fx, fy = xs * cells, ys * cells
        x0, y0 = np.floor(fx).astype(int) % cells, np.floor(fy).astype(int) % cells
        x1, y1 = (x0 + 1) % cells, (y0 + 1) % cells
        tx, ty = fx - np.floor(fx), fy - np.floor(fy)
        tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
        out += amp * ((g[y0, x0] * (1 - tx) + g[y0, x1] * tx) * (1 - ty) + (g[y1, x0] * (1 - tx) + g[y1, x1] * tx) * ty)
        total += amp
        amp *= persistence
        cells *= 2
    return out / total


def _normal(height, strength):
    dx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * strength
    dy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * strength
    nz = np.ones_like(height)
    length = np.sqrt(dx * dx + dy * dy + nz * nz)
    n = np.stack([-dx / length, dy / length, nz / length], -1)   # image rows run downward, glTF normal maps are +Y up
    return ((n * .5 + .5) * 255).clip(0, 255).astype(np.uint8)


def _save(path, arr):
    Image.fromarray(arr.astype(np.uint8)).save(path, optimize=True)


def _orm(ao, rough, metal):
    return (np.stack([ao, rough, metal], -1) * 255).clip(0, 255)


def concrete(out, n=2048):
    big, mid, fine = _noise(n, 5, 11), _noise(n, 6, 12, base=16), _noise(n, 4, 13, base=128)
    tone = (BRICK * .34 + np.array([84, 90, 100]) * .66) * .8      # a dark, cool grey that still carries a little of the brick's warmth
    value = .62 + .30 * (big - .5) + .16 * (mid - .5) + .10 * (fine - .5)
    # shutter-board lines of the casting, one every metre (the texture spans 4 m)
    ys, xs = np.mgrid[0:n, 0:n]
    board = np.minimum((ys % (n // 4)), (n // 4) - (ys % (n // 4))) < 2
    height = big * .5 + mid * .35 + fine * .15 - board * .5
    # rain streaks running down from random points, and damp patches
    rng = np.random.default_rng(14)
    streak = np.zeros((n, n))
    for _ in range(150):
        x, y0, length, width = rng.integers(0, n), rng.integers(0, n), rng.integers(n // 10, n // 2), rng.integers(3, 14)
        rows = (np.arange(length) + y0) % n
        fade = np.linspace(1, 0, length) ** 1.5
        for dx in range(-width, width + 1):
            streak[rows, (x + dx) % n] = np.maximum(streak[rows, (x + dx) % n], fade * (1 - abs(dx) / (width + 1)))
    damp = np.clip((_noise(n, 3, 15, base=3) - .55) * 4, 0, 1)
    value = value * (1 - .30 * streak) * (1 - .22 * damp) * (1 - .25 * board)
    color = tone[None, None, :] * value[..., None]
    color += (np.array([10, 16, 8]) * (damp * .6)[..., None]) - (np.array([18, 20, 22]) * streak[..., None] * .5)   # a little green in the damp, soot in the streaks
    _save(out + '/kit_concrete_color.png', color.clip(0, 255))
    _save(out + '/kit_concrete_normal.png', _normal(height, 2.2 * n / 1024))
    rough = .9 - .32 * damp - .12 * streak + .05 * (fine - .5)
    _save(out + '/kit_concrete_orm.png', _orm(.72 + .28 * mid, rough.clip(.3, 1), np.zeros((n, n))))


def metal(out, n=1024):
    big, mid, fine = _noise(n, 5, 21), _noise(n, 6, 22, base=12), _noise(n, 3, 23, base=96)
    rust = np.clip((big * .6 + mid * .4 - .52) * 7, 0, 1)
    ys, xs = np.mgrid[0:n, 0:n]
    scratch = (_noise(n, 2, 24, base=64)[ys, (xs * 9) % n] > .86) * (fine > .45)
    paint = np.array([44, 52, 58]) * (.82 + .3 * (mid - .5))[..., None]
    rusty = np.array([122, 62, 30]) * (.7 + .6 * (fine - .5) + .3 * (mid - .5))[..., None]
    color = paint * (1 - rust[..., None]) + rusty * rust[..., None]
    color = color * (1 - .25 * scratch[..., None]) + np.array([150, 152, 150]) * (.25 * scratch[..., None])
    height = mid * .3 + rust * (.5 + .5 * fine) - scratch * .3
    _save(out + '/kit_metal_color.png', color.clip(0, 255))
    _save(out + '/kit_metal_normal.png', _normal(height, 1.6))
    rough = .5 + .42 * rust - .2 * scratch + .08 * (fine - .5)
    metalness = (.55 * (1 - rust) + .15 * rust + .4 * scratch).clip(0, 1)     # paint is half-worn through; rust is not metallic
    _save(out + '/kit_metal_orm.png', _orm(.8 + .2 * mid, rough.clip(.2, 1), metalness))


def glass(out, n=512):
    mid, fine = _noise(n, 5, 31), _noise(n, 4, 32, base=48)
    ys, xs = np.mgrid[0:n, 0:n] / n
    dirt = np.clip(1.4 * ys ** 3 + .35 * (mid - .4), 0, 1)            # grime gathers at the bottom of a pane
    color = np.array([14, 20, 26])[None, None, :] * (1 + .5 * (mid - .5))[..., None] * (1 - dirt[..., None]) + np.array([52, 50, 44]) * dirt[..., None]
    _save(out + '/kit_glass_color.png', color.clip(0, 255))
    _save(out + '/kit_glass_normal.png', _normal(fine * .2, .6))
    _save(out + '/kit_glass_orm.png', _orm(np.ones((n, n)), (.08 + .6 * dirt).clip(0, 1), np.zeros((n, n))))


def emissive(out, n=1024):
    """Atlas: top half four lit-window looks, bottom-left four neon tube colours (magenta, cyan, amber, white), bottom-right a blank sign face."""
    img = np.zeros((n, n, 3))
    h = n // 2
    q = n // 4
    rng = np.random.default_rng(41)
    ys, xs = np.mgrid[0:h, 0:q]
    v, u = ys / h, xs / q

    def window(col, blinds=False, dim=1.0, seed=0):
        base = np.array(col, float)[None, None, :] * (dim * (.75 + .35 * np.exp(-((u - .5) ** 2) * 3 - ((v - .35) ** 2) * 4)))[..., None]
        r = np.random.default_rng(seed)
        # a curtain edge and something standing in the room, as darker shapes
        cx = r.uniform(.15, .85)
        base *= (1 - .45 * ((u > cx - .12) & (u < cx + .12) & (v > .45)))[..., None]
        base *= (1 - .35 * (u < r.uniform(.08, .22)))[..., None]
        if blinds:
            base *= (.55 + .45 * (((v * 22) % 1) > .35))[..., None]
        return base

    img[0:h, 0:q] = window([255, 196, 120], seed=1)
    img[0:h, q:2 * q] = window([255, 210, 150], blinds=True, seed=2)
    img[0:h, 2 * q:3 * q] = window([150, 215, 255], seed=3, dim=.9)
    img[0:h, 3 * q:4 * q] = window([255, 150, 190], seed=4, dim=.45)
    # neon: bright core fading to the edge of the tube, along the texture's v
    yy, xx = np.mgrid[0:h, 0:h]
    for name, col in (('neon_magenta', (255, 60, 190)), ('neon_cyan', (60, 230, 255)), ('neon_amber', (255, 170, 60)), ('neon_white', (255, 255, 255))):
        _, v0, _, v1 = EMISSIVE_REGIONS[name]
        r0, r1 = int(n - v1 * n), int(n - v0 * n)
        core = np.exp(-((np.linspace(0, 1, r1 - r0) - .5) ** 2) * 10)
        img[r0:r1, 0:h] = ((.8 + .2 * core)[:, None, None] * np.array(col, float)[None, None, :])
    # sign face: an even, slightly mottled light box with a darker rim
    rim = np.minimum.reduce([yy, xx, h - 1 - yy, h - 1 - xx]) / h
    face = (.55 + .45 * np.clip(rim * 12, 0, 1)) * (.9 + .2 * (_noise(h, 3, 42, base=8) - .5))
    img[h:n, h:n] = (235 * face)[..., None] * np.ones(3)
    _save(out + '/kit_emissive_color.png', img.clip(0, 255))


def asphalt(out, n=1024):
    big, mid, fine = _noise(n, 4, 51), _noise(n, 5, 52, base=24), _noise(n, 3, 53, base=160)
    wet = np.clip((big - .45) * 5, 0, 1)                               # puddled, shiny areas
    value = .5 + .3 * (mid - .5) + .35 * (fine - .5)
    color = np.array([44, 46, 52])[None, None, :] * value[..., None] * (1 - .35 * wet[..., None])
    _save(out + '/kit_asphalt_color.png', color.clip(0, 255))
    _save(out + '/kit_asphalt_normal.png', _normal(fine * (1 - wet) + mid * .3, 2.0))
    _save(out + '/kit_asphalt_orm.png', _orm(.85 + .15 * mid, (.85 - .7 * wet).clip(.08, 1), np.zeros((n, n))))


SETS = {'kit_concrete': concrete, 'kit_metal': metal, 'kit_glass': glass, 'kit_emissive': emissive, 'kit_asphalt': asphalt}


def build_all(out):
    import os
    os.makedirs(out, exist_ok=True)
    for make in SETS.values():
        make(out)
