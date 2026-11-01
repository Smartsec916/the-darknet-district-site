# KTX2 / Basis Universal decoder (locally hosted)

These files let Babylon.js load glTF textures stored as KTX2 / Basis Universal (`KHR_texture_basisu`) and keep them
compressed on the GPU (BC7 on desktop GPUs, ASTC or ETC on phones, plain RGBA where the device supports none of these).
`void-runner/asset-pipeline.js` (`useKTX2Locally`) points Babylon's `KhronosTextureContainer2.URLConfig` here, so
nothing is fetched from Babylon's CDN or anywhere else.

The game loads only what a model needs: the decoder module, the Zstandard decoder and the one transcoder for the
device's format (on this machine's AMD GPU: `babylon.ktx2Decoder.js`, `zstddec.wasm`, `uastc_bc7.wasm`,
`msc_basis_transcoder.js` and `.wasm`, about 0.6 MB together). Decoding runs in web workers.

| File | Source | Licence |
|---|---|---|
| `babylon.ktx2Decoder.js` | npm `babylonjs-ktx2decoder` 8.26.0 (matches `../babylon-8.26.0.js`) | Apache-2.0, `LICENSE-babylonjs.md` |
| `msc_basis_transcoder.js`, `msc_basis_transcoder.wasm` | npm `@babylonjs/ktx2decoder` 8.26.0, `wasm/` (Binomial's Basis Universal transcoder) | Apache-2.0, `LICENSE-transcoders.md` |
| `uastc_astc.wasm`, `uastc_bc7.wasm`, `uastc_r8_unorm.wasm`, `uastc_rg8_unorm.wasm`, `uastc_rgba8_srgb_v2.wasm`, `uastc_rgba8_unorm_v2.wasm` | npm `@babylonjs/ktx2decoder` 8.26.0, `wasm/` (Khronos / Binomial UASTC transcoders; Arm and Mark Callow copyrights) | Apache-2.0, `LICENSE-transcoders.md` |
| `zstddec.wasm` | npm `zstddec` 0.1.0 by Don McCurdy (the WebAssembly embedded in `dist/zstddec.cjs`, extracted unchanged; the same module Babylon's CDN serves) | MIT and BSD-3-Clause (Zstandard, Facebook), `LICENSE-zstddec.txt` |

The licences require their notices to travel with the files: keep the three `LICENSE-*` files beside them.
Basis Universal's NOTICE (Apache-2.0 §4(d)): "Basis Universal™ Supercompressed GPU Texture Compression Library,
Copyright © 2016–2026 Binomial LLC. 'Basis Universal' is a trademark of Binomial LLC."

SHA-256:

```
4f370804c560dbfec86601f08572815f1c0043f638393c61bc14f30d2ccbf941  babylon.ktx2Decoder.js
b8906bae7e55606aba070642eb3bce790a2b5aea774874e120e9fd41f7c7d60b  msc_basis_transcoder.js
29becbf0eef2ce9f6d72109ad217704ec3799c432da0c26e3893b793ecab6bdc  msc_basis_transcoder.wasm
6846c972b4a52d938866f43896fd2b2450052da807cdd1285e898be80614d612  uastc_astc.wasm
be442ab8c0cbf734ded98e6ad38112aaba23c83bfeecac4213ded54631fc4eef  uastc_bc7.wasm
0467c98b150a630e5a51f7810843e8b7fd9aad22e3888baf70aad255c55d02bc  uastc_r8_unorm.wasm
fb45a2c103c59cec21c3708a6534d43cd4381669f66d3292dd8a6e4e1956d773  uastc_rg8_unorm.wasm
1f4d2e8bfef4e31679b23d473e1c410c29f7e485a739e76c5b357628f4190874  uastc_rgba8_srgb_v2.wasm
b7470b26a847994cdeb9226eeba1e3711688e378ee438b7dd941e83cb598b694  uastc_rgba8_unorm_v2.wasm
67d12d34f82ef700ec3a3795a77590252858c70330908a87ed1e73efc268cb4b  zstddec.wasm
```

Encoding (build time only, not shipped): `tools/assets/ktx2-glb.mjs` uses the npm dev dependency `ktx2-encoder` 0.6.0
(MIT, by Hu Song), which bundles Binomial's Basis Universal encoder (Apache-2.0).
