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
EMISSIVE_REGIONS = {'window_magenta': (0, .5, .25, 1), 'window_cyan': (.25, .5, .5, 1), 'window_violet': (.5, .5, .75, 1), 'window_green': (.75, .5, 1, 1),
                    'neon_magenta': (0, .375, .5, .5), 'neon_cyan': (0, .25, .5, .375), 'neon_amber': (0, .125, .5, .25), 'neon_white': (0, 0, .5, .125),
                    'sign_magenta': (.5, .25, .75, .5), 'sign_cyan': (.75, .25, 1, .5), 'sign_amber': (.5, 0, .75, .25), 'sign_violet': (.75, 0, 1, .25)}


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
    """Atlas: top half four lit-window looks (magenta, cyan with blinds, violet, green with blinds), bottom-left four neon tube colours (magenta, cyan, amber, white), bottom-right a blank sign face."""
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

    # coloured room light, the way a street of signs and screens lights its rooms: no warm or white windows
    img[0:h, 0:q] = window([255, 50, 170], seed=1)
    img[0:h, q:2 * q] = window([40, 225, 255], blinds=True, seed=2)
    img[0:h, 2 * q:3 * q] = window([150, 80, 255], seed=3, dim=.95)
    img[0:h, 3 * q:4 * q] = window([70, 255, 150], blinds=True, seed=4, dim=.8)
    # neon: bright core fading to the edge of the tube, along the texture's v
    yy, xx = np.mgrid[0:h, 0:h]
    for name, col in (('neon_magenta', (255, 60, 190)), ('neon_cyan', (60, 230, 255)), ('neon_amber', (255, 170, 60)), ('neon_white', (255, 255, 255))):
        _, v0, _, v1 = EMISSIVE_REGIONS[name]
        r0, r1 = int(n - v1 * n), int(n - v0 * n)
        core = np.exp(-((np.linspace(0, 1, r1 - r0) - .5) ** 2) * 10)
        img[r0:r1, 0:h] = ((.8 + .2 * core)[:, None, None] * np.array(col, float)[None, None, :])
    # sign face: an even, slightly mottled light box with a darker rim
    # four coloured light-box faces, each with rows of dark blocks standing in for lettering (no real words: a shop's own sign picture can replace them)
    sy, sx = np.mgrid[0:q, 0:q]
    rim = np.minimum.reduce([sy, sx, q - 1 - sy, q - 1 - sx]) / q
    for k, (name, col) in enumerate((('sign_magenta', (255, 50, 170)), ('sign_cyan', (40, 225, 255)), ('sign_amber', (255, 165, 50)), ('sign_violet', (160, 90, 255)))):
        u0, v0, u1, v1 = EMISSIVE_REGIONS[name]
        face = (.5 + .5 * np.clip(rim * 14, 0, 1)) * (.9 + .2 * (_noise(q, 3, 42 + k, base=8) - .5))
        r = np.random.default_rng(70 + k)
        for row in range(6):
            y0 = int(q * (.1 + row * .14))
            x = int(q * .12)
            while x < q * .86:
                w = int(q * r.uniform(.05, .16))
                face[y0:y0 + int(q * .08), x:min(x + w, int(q * .88))] *= .08
                x += w + int(q * r.uniform(.03, .07))
        img[int(n - v1 * n):int(n - v0 * n), int(u0 * n):int(u1 * n)] = face[..., None] * np.array(col, float)
    _save(out + '/kit_emissive_color.png', img.clip(0, 255))


def asphalt(out, n=1024):
    big, mid, fine = _noise(n, 4, 51), _noise(n, 5, 52, base=24), _noise(n, 3, 53, base=160)
    wet = np.clip((big - .45) * 5, 0, 1)                               # puddled, shiny areas
    value = .5 + .3 * (mid - .5) + .35 * (fine - .5)
    color = np.array([44, 46, 52])[None, None, :] * value[..., None] * (1 - .35 * wet[..., None])
    _save(out + '/kit_asphalt_color.png', color.clip(0, 255))
    _save(out + '/kit_asphalt_normal.png', _normal(fine * (1 - wet) + mid * .3, 2.0))
    _save(out + '/kit_asphalt_orm.png', _orm(.85 + .15 * mid, (.85 - .7 * wet).clip(.08, 1), np.zeros((n, n))))


# The scrolling sign above the shops: one long LED strip of text that repeats every TICKER_METRES. The game scrolls it by sliding the texture sideways.
# PLACEHOLDER WORDING (shop names already on the street, plus generic shop talk): David approves the final text.
TICKER_METRES = 20
TICKER_TEXT = [('NIGHT MARKET', (255, 60, 190)), ('OPEN 24H', (60, 230, 255)), ('DRAGON NOODLES', (255, 170, 60)), ('HOT // FAST // CHEAP', (255, 60, 190)),
               ('ELECTRONICS', (60, 230, 255)), ('REPAIRS WHILE YOU WAIT', (90, 255, 150)), ('PHARMACY 24H', (90, 255, 150)), ('NO CREDIT', (255, 70, 70)),
               ('DATA RECOVERY', (170, 110, 255)), ('CASH ONLY', (255, 170, 60))]


def ticker(out, cols=1024, rows=32, dot=4):
    from PIL import ImageDraw, ImageFont
    font = None
    for path in ('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf'):
        try:
            font = ImageFont.truetype(path, 24)
            break
        except OSError:
            pass
    font = font or ImageFont.load_default()
    # lay the phrases out end to end, then stretch the gaps so the strip closes on itself exactly
    widths = [int(font.getlength(t)) for t, _ in TICKER_TEXT]
    gap = max(8, (cols - sum(widths)) // len(TICKER_TEXT))
    small = Image.new('RGB', (cols, rows))
    draw, x = ImageDraw.Draw(small), gap // 2
    for (text, col), w in zip(TICKER_TEXT, widths):
        draw.text((x, 2), text, font=font, fill=col)
        draw.rectangle((x + w + gap // 2 - 2, 13, x + w + gap // 2 + 1, 18), fill=(110, 120, 140))      # a separator pip
        x += w + gap
    lit = np.asarray(small, float)
    lit = np.where(lit.max(-1, keepdims=True) > 90, lit / np.maximum(lit.max(-1, keepdims=True), 1) * 255, 0)   # hard on/off LEDs, full brightness
    big = np.repeat(np.repeat(lit, dot, 0), dot, 1)
    yy, xx = np.mgrid[0:rows * dot, 0:cols * dot]
    mask = (((yy % dot) - (dot - 1) / 2) ** 2 + ((xx % dot) - (dot - 1) / 2) ** 2) <= (dot * .47) ** 2
    off = np.array([10, 9, 14]) * mask[..., None]                                                 # unlit LEDs are just visible
    _save(out + '/kit_ticker_color.png', np.maximum(big * mask[..., None], off).clip(0, 255))


def fabric(out, n=512):
    """Awning cloth: broad faded stripes (the texture spans 2 m, four stripes), a weave, and dirt run down by rain."""
    ys, xs = np.mgrid[0:n, 0:n] / n
    mid, fine = _noise(n, 5, 61, base=6), _noise(n, 3, 62, base=96)
    stripe = ((xs * 4).astype(int) % 2)[..., None]
    color = np.array([24, 84, 92]) * stripe + np.array([30, 28, 36]) * (1 - stripe)
    streak = _noise(n, 3, 63, base=4)[:, :1] * 0 + _noise(n, 4, 64, base=32)[:1, :]          # varies across, constant down: run-off lines
    value = (.75 + .35 * (mid - .5)) * (1 - .35 * np.clip((streak - .5) * 3, 0, 1)) * (.85 + .3 * ys)
    weave = .5 + .25 * np.sin(xs * n * .8) + .25 * np.sin(ys * n * .8)
    _save(out + '/kit_fabric_color.png', (color * value[..., None] * (.92 + .16 * weave[..., None])).clip(0, 255))
    _save(out + '/kit_fabric_normal.png', _normal(weave * .5 + fine * .3, 1.2))
    _save(out + '/kit_fabric_orm.png', _orm(.85 + .15 * mid, (.88 + .08 * (fine - .5)).clip(0, 1), np.zeros((n, n))))


def tile(out, n=1024):
    """Interior floor: dark worn tiles, half a metre each (the texture spans 2 m), semi-gloss with duller scuffed paths and damp patches."""
    big, mid, fine = _noise(n, 4, 81), _noise(n, 5, 82, base=20), _noise(n, 3, 83, base=128)
    ys, xs = np.mgrid[0:n, 0:n]
    cell = n // 4
    gy, gx = ys % cell, xs % cell
    grout = (np.minimum(gy, cell - gy) < 3) | (np.minimum(gx, cell - gx) < 3)
    shade = _noise(4, 1, 84, base=4)[(ys // cell) % 4, (xs // cell) % 4]                 # each tile its own tone
    wear = np.clip((big - .48) * 5, 0, 1)
    value = (.55 + .25 * (shade - .5) + .18 * (mid - .5) + .1 * (fine - .5)) * (1 - .25 * wear)
    color = np.array([46, 52, 62])[None, None, :] * value[..., None]
    color = color * (1 - .6 * grout[..., None])
    _save(out + '/kit_tile_color.png', color.clip(0, 255))
    _save(out + '/kit_tile_normal.png', _normal(mid * .25 + fine * .15 - grout * .8, 1.8))
    rough = (.3 + .35 * wear + .1 * (fine - .5) - .18 * np.clip((_noise(n, 3, 85, base=3) - .6) * 5, 0, 1)).clip(.08, 1)
    rough = np.where(grout, .9, rough)
    _save(out + '/kit_tile_orm.png', _orm(.8 + .2 * mid - .3 * grout, rough, np.zeros((n, n))))


SETS = {'kit_concrete': concrete, 'kit_metal': metal, 'kit_glass': glass, 'kit_emissive': emissive, 'kit_asphalt': asphalt, 'kit_ticker': ticker, 'kit_fabric': fabric, 'kit_tile': tile}


def build_all(out):
    import os
    os.makedirs(out, exist_ok=True)
    for make in SETS.values():
        make(out)
