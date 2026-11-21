#!/usr/bin/env python3
"""The owner, 18 Nov 2026, on the creator's two casual bases (npc-casual-f, npc-casual-m): "Can you make grey and jeans black?"
Re-colours ONLY the grey t-shirt and the blue jeans in each figure's baked albedo to a dark charcoal black that keeps the fabric's own light and dark (folds, seams,
denim weave); the black jacket, trainers, skin and hair are left alone. The masks are colour ranges on the baked map (its UV islands are scattered, so a region
mask is impossible): denim = blue hue with some saturation, the tee = near-neutral mid grey (lighter than the black leather). The original map is kept beside the
model as <name>-classic.jpg (the "grey tee and blue jeans" outfit, npc-variants.js `albedo`).
  python3 tools/assets/street/recolor_casual.py void-runner/assets/models/crowd/npc-casual-f.glb [...]   (writes the GLB in place; needs Pillow and numpy)"""
import json, struct, sys, io, os
import numpy as np
from PIL import Image, ImageFilter

def chunks(d):
    o = 12; J = B = None
    while o < len(d):
        n, t = struct.unpack_from('<II', d, o); c = d[o + 8:o + 8 + n]
        if t == 0x4E4F534A: J = json.loads(c)
        elif t == 0x004E4942: B = c
        o += 8 + n
    return J, B

def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

def recolor(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32) / 255
    mx, mn = a.max(2), a.min(2); d = mx - mn; sat = d / np.maximum(mx, 1e-4)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx); m = d > 1e-4
    hr = ((g - b) / np.where(m, d, 1)) % 6; hg = (b - r) / np.where(m, d, 1) + 2; hb = (r - g) / np.where(m, d, 1) + 4
    h = np.where(mx == r, hr, np.where(mx == g, hg, hb)) / 6; h = np.where(m, h, 0)
    lum = .2126 * r + .7152 * g + .0722 * b
    hh = np.where(h > .5, h - 1, h)
    warm = smooth(hh, -.09, -.04) * (1 - smooth(hh, .13, .18)) * smooth(sat, .04, .08)   # skin (and its grey-ish shadows), hair: never touched
    denim = smooth(h, .5, .54) * (1 - smooth(h, .7, .74)) * smooth(sat, .05, .12) * smooth(mx, .09, .14)   # the jeans (and the tee's cool grey)
    grey = (1 - smooth(sat, .08, .13)) * smooth(lum, .15, .22) * (1 - smooth(lum, .62, .72))   # the neutral grey tee, lighter than the black leather
    denim, grey = denim * (1 - warm), grey * (1 - warm)
    mask = np.clip(denim + grey, 0, 1)
    mask = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    # charcoal black that keeps the fabric's relief: brightness compressed around a dark base, a touch cooler on the denim
    v = .045 + .5 * (lum - .12)
    v = np.clip(v, .02, .2)
    tint = np.stack([.97 - .03 * denim, .98 - .01 * denim, 1.03 + .05 * denim], 2)
    black = v[..., None] * tint
    out = a * (1 - mask[..., None]) + black * mask[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)), float(mask.mean())

def main(path):
    d = open(path, 'rb').read(); J, B = chunks(d)
    tex = J['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']; im = J['images'][J['textures'][tex]['source']]; vi = im['bufferView']
    classic = path[:-4] + '-classic.jpg'
    v = J['bufferViews'][vi]; src = B[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
    if not os.path.exists(classic): open(classic, 'wb').write(src)   # the original map, kept once (re-running starts from it)
    new, share = recolor(Image.open(classic)); buf = io.BytesIO(); new.save(buf, 'JPEG', quality=88); data = buf.getvalue()
    out = bytearray()
    for i, bv in enumerate(J['bufferViews']):
        chunk = data if i == vi else B[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
        while len(out) % 4: out.append(0)
        bv['byteOffset'] = len(out); bv['byteLength'] = len(chunk); out += chunk
    while len(out) % 4: out.append(0)
    J['buffers'][0]['byteLength'] = len(out); js = json.dumps(J, separators=(',', ':')).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
    open(path, 'wb').write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out))
    print(os.path.basename(path), 'recoloured share %.1f%%' % (share * 100), 'map', len(src), '->', len(data))

for p in sys.argv[1:]: main(p)
