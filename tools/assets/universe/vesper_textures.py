"""Vesper workshop textures (docs/development/UNIVERSE_GRAPHICS_TRACKER.md). Generated from seeded noise; nothing downloaded.
Run by build_vesper.py (needs numpy and Pillow). Writes 512 px tileable colour / normal / ORM (glTF packing: R occlusion, G roughness, B metallic) JPEGs:
  w_paint   sun-faded industrial paint on sheet metal: chips to bare steel, dust settled in the low parts, rivet rows (tiles every 2 m)
  w_steel   bare structural steel bleached by a dry sun: mill scale, surface rust, scratches (tiles every 2 m)
  w_grime   oily machine finish for tools and engine parts: dark enamel worn to metal on the edges (tiles every 1 m)
  w_tarp    canvas / tarpaulin with weave, dust and creases (tiles every 2 m)
Vertex colours multiply the colour map, so one map serves many tints (ochre, olive, grey, faded red).
Made by Claude for this project; no third-party assets."""
import os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'kit'))
from kit_textures import _normal, _orm, _spectral, _step, _hairlines  # noqa: E402

N = 512


def _jpg(path, arr, q=86):
    Image.fromarray(np.asarray(arr).clip(0, 255).astype(np.uint8)).save(path, quality=q, optimize=True)


def _out(d, name, color, height, ao, rough, metal, ns):
    _jpg(os.path.join(d, name + '_color.jpg'), color)
    _jpg(os.path.join(d, name + '_normal.jpg'), _normal(height, ns), 90)
    _jpg(os.path.join(d, name + '_orm.jpg'), _orm(ao, rough, metal), 90)


def _rivets(n, rows, cols, r=.0009):
    yy, xx = np.mgrid[0:n, 0:n] / n
    out = np.zeros((n, n))
    for gy in rows:
        for k in range(cols):
            dx, dy = xx - (k + .5) / cols, yy - gy
            out += np.exp(-(dx * dx + dy * dy) / r * 40)
    return out.clip(0, 1)


def paint(d, n=N):
    base = _spectral(n, 61, 2.3)
    chips = _step(.76, .8, _spectral(n, 62, 1.3, lo=10)) * _step(.55, .8, _spectral(n, 63, 2.0, lo=2))
    dust = _step(.45, .85, _spectral(n, 64, 2.2, ax=1.0, ay=.35, lo=2))       # streaks settle downwards
    gy, gx = np.mgrid[0:n, 0:n]
    seam = (gx % n) < 2
    riv = _rivets(n, (.03, .53), 16)
    scr = np.asarray(_hairlines(n, 65, 40))
    h = .15 * base - .25 * chips + .2 * riv - .2 * seam + .1 * scr
    col = np.array([.80, .78, .74])[None, None, :] * (.9 + .14 * base[..., None])     # near white: vertex colour tints it
    col = col * (1 - chips[..., None] * .7) + chips[..., None] * np.array([.30, .28, .26]) * .7
    col = col * (1 - .18 * dust[..., None]) + dust[..., None] * np.array([.70, .58, .44]) * .18
    col = col * (1 - .2 * seam[..., None])
    rust = chips * _step(.5, .8, _spectral(n, 66, 1.6, lo=4))
    col = col * (1 - rust[..., None] * .6) + rust[..., None] * np.array([.42, .22, .10]) * .6
    ao = (1 - .45 * seam) * (.8 + .2 * base)
    rough = (.72 + .2 * dust - .3 * chips).clip(.3, 1)
    metal = (.15 + .7 * chips * (1 - rust)).clip(0, 1)
    _out(d, 'w_paint', col * 255, h, ao, rough, metal, 4.0)


def steel(d, n=N):
    base = _spectral(n, 71, 2.4)
    fine = _spectral(n, 72, 1.2, lo=40)
    scr = np.asarray(_hairlines(n, 73, 70))
    rust = _step(.6, .85, _spectral(n, 74, 2.0, lo=3)) * _step(.35, .65, _spectral(n, 75, 1.4))
    h = .3 * base + .2 * fine + .3 * scr + .2 * rust
    col = np.array([.44, .44, .43])[None, None, :] * (.75 + .4 * base[..., None])
    col = col * (1 - rust[..., None] * .7) + rust[..., None] * np.array([.45, .23, .10]) * .7
    col = col + scr[..., None] * .08
    ao = .85 + .15 * base
    rough = (.5 + .35 * rust + .15 * fine - .1 * scr).clip(.3, 1)
    metal = (.9 * (1 - rust)).clip(0, 1)
    _out(d, 'w_steel', col * 255, h, ao, rough, metal, 4.0)


def grime(d, n=N):
    base = _spectral(n, 81, 2.0)
    wear = _step(.62, .8, _spectral(n, 82, 1.5, lo=6))
    oil = _step(.55, .85, _spectral(n, 83, 2.2, lo=2))
    h = .3 * base - .2 * wear
    col = np.array([.30, .30, .29])[None, None, :] * (.8 + .3 * base[..., None])
    col = col * (1 - wear[..., None] * .5) + wear[..., None] * np.array([.55, .54, .52]) * .5
    col = col * (1 - .4 * oil[..., None])
    ao = .8 + .2 * base
    rough = (.55 - .3 * oil + .15 * base).clip(.15, 1)
    metal = (.4 + .5 * wear).clip(0, 1)
    _out(d, 'w_grime', col * 255, h, ao, rough, metal, 3.0)


def tarp(d, n=N):
    gy, gx = np.mgrid[0:n, 0:n]
    weave = (np.sin(gx / n * 2 * np.pi * 180) * np.sin(gy / n * 2 * np.pi * 180)) * .5 + .5
    crease = _spectral(n, 91, 2.6, ax=.3, ay=1.0, lo=2)
    dust = _step(.4, .8, _spectral(n, 92, 2.0, lo=2))
    h = .15 * weave + .6 * crease
    col = np.array([.80, .78, .74])[None, None, :] * (.75 + .3 * crease[..., None]) * (.94 + .06 * weave[..., None])
    col = col * (1 - .3 * dust[..., None]) + dust[..., None] * np.array([.72, .60, .46]) * .3
    _out(d, 'w_tarp', col * 255, h, .75 + .25 * crease, (.92 + 0 * h), 0 * h, 3.0)


def build(d):
    os.makedirs(d, exist_ok=True)
    for f in (paint, steel, grime, tarp):
        f(d)


if __name__ == '__main__':
    build(sys.argv[1])
