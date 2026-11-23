/* Consumables Studio: the one schema the browser and the server (void_runner_items.py parses this file) both read. Edit numbers HERE and nowhere else.
   Item definitions, effect definitions, gameplay modifiers and vendor entries are validated against it. `supported:false` modifiers are listed so the editor can say why
   they are off: the game has no such mechanic yet (no stamina, melee or night-vision system), and this feature does not invent one. */
globalThis.VoidConsumableSpec = {
 "format": "vr-items",
 "version": 1,
 "limits": {"items": 300, "vendors": 60, "entries": 80, "effects": 8, "modifiers": 6, "categories": 24, "presets": 40, "name": 60, "description": 400, "bytes": 600000, "delay": 600, "duration": 900, "fadeIn": 60, "fadeOut": 120, "price": 1000000, "stock": 9999, "stack": 99, "weight": 500, "cooldown": 3600, "restockEvery": 604800},
 "categories": [
  {"id": "food", "name": "Food"}, {"id": "beverages", "name": "Beverages"}, {"id": "medical", "name": "Medical supplies"}, {"id": "stimulants", "name": "Stimulants"},
  {"id": "substances", "name": "Fictional cyberpunk substances"}, {"id": "other", "name": "Other"}],
 "kinds": ["consumable", "food", "beverage", "weapon", "ammunition", "missile", "equipment", "medical", "misc"],
 "rarities": ["common", "uncommon", "rare", "epic", "legendary"],
 "stacking": ["max", "additive", "replace", "independent"],
 "animations": ["none", "drink", "eat", "inject", "inhale", "swallow", "apply"],
 "vendorKinds": ["npc", "counter", "kiosk", "vending", "other"],
 "restock": ["none", "interval"],
 "statuses": ["draft", "published", "retired"],
 "registryItems": {"ward-kit": "Ward kit"},
 "effects": {
  "chromaticAberration": {"group": "visual", "label": "Chromatic aberration", "help": "Splits the red, green and blue of the picture apart, strongest at the edges.", "params": {
   "separation": {"label": "RGB separation", "min": 0, "max": 0.03, "def": 0.008, "step": 0.0005, "help": "How far the colour channels slide apart (a fraction of the screen width)."},
   "radial": {"label": "Radial strength", "min": 0, "max": 1, "def": 0.6, "step": 0.01, "help": "0 shifts the whole picture the same way. 1 shifts it more towards the edges."},
   "centerX": {"label": "Centre X", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Where the shift starts, left to right."},
   "centerY": {"label": "Centre Y", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Where the shift starts, bottom to top."},
   "pulse": {"label": "Pulse speed", "min": 0, "max": 3, "def": 0.4, "step": 0.05, "help": "Times per second the split swells and shrinks (kept under 3 so it never flashes)."},
   "falloff": {"label": "Edge falloff", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "How quickly the split fades towards the middle of the screen."}}},
  "motionTrails": {"group": "visual", "label": "Motion trails", "help": "Leaves a fading afterimage behind anything that moves, from the frames before.", "params": {
   "length": {"label": "Trail length", "min": 0.05, "max": 0.95, "def": 0.6, "step": 0.01, "help": "How much of the earlier frames is kept. Higher is a longer smear."},
   "opacity": {"label": "Trail opacity", "min": 0, "max": 1, "def": 0.7, "step": 0.01, "help": "How visible the afterimage is."},
   "decay": {"label": "Decay speed", "min": 0.5, "max": 8, "def": 3, "step": 0.1, "help": "How quickly the trail fades away (per second)."},
   "tintHue": {"label": "Tint colour", "min": 0, "max": 360, "def": 190, "step": 1, "help": "The colour of the afterimage, as a hue angle."},
   "tintAmount": {"label": "Tint amount", "min": 0, "max": 1, "def": 0.35, "step": 0.01, "help": "0 keeps the trail the colour of the scene."}}},
  "colorShift": {"group": "visual", "label": "Colour shift", "help": "Changes the colours of the world: hue, saturation, contrast, inversion and tint in one pass.", "params": {
   "hue": {"label": "Hue rotation", "min": 0, "max": 360, "def": 0, "step": 1, "help": "Turns every colour round the colour wheel."},
   "hueSpeed": {"label": "Colour cycling", "min": 0, "max": 90, "def": 20, "step": 1, "help": "Degrees per second the hue keeps turning (0 holds one colour)."},
   "saturation": {"label": "Saturation", "min": 0, "max": 3, "def": 1.5, "step": 0.01, "help": "1 is normal. Under 1 drains colour. Over 1 is vivid."},
   "contrast": {"label": "Contrast", "min": 0.5, "max": 2, "def": 1.1, "step": 0.01, "help": "1 is normal."},
   "exposure": {"label": "Exposure", "min": -1, "max": 1, "def": 0, "step": 0.01, "help": "Brightens or darkens the whole picture."},
   "invert": {"label": "Inversion", "min": 0, "max": 1, "def": 0, "step": 0.01, "help": "Blends towards a negative of the picture."},
   "channelSplit": {"label": "Channel mix", "min": 0, "max": 1, "def": 0.2, "step": 0.01, "help": "Swaps the colour channels into each other."},
   "tintHue": {"label": "Tint colour", "min": 0, "max": 360, "def": 280, "step": 1, "help": "Colour of the overall wash."},
   "tintAmount": {"label": "Tint amount", "min": 0, "max": 1, "def": 0.15, "step": 0.01, "help": "How much of the wash is mixed in."}}},
  "kaleidoscope": {"group": "visual", "label": "Kaleidoscope", "help": "Folds the picture into mirrored wedges around a point. The world stays visible underneath.", "params": {
   "segments": {"label": "Mirrored segments", "min": 2, "max": 16, "def": 6, "step": 1, "help": "How many wedges the screen is folded into."},
   "rotation": {"label": "Rotation speed", "min": -90, "max": 90, "def": 12, "step": 1, "help": "Degrees per second the wedges turn."},
   "scale": {"label": "Scale", "min": 0.5, "max": 3, "def": 1, "step": 0.01, "help": "Zoom of the folded picture."},
   "centerX": {"label": "Centre X", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Left to right."},
   "centerY": {"label": "Centre Y", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Bottom to top."},
   "blend": {"label": "Blend with the world", "min": 0, "max": 1, "def": 0.45, "step": 0.01, "help": "0 shows only the real picture. 1 shows only the folded one."}}},
  "fractalWarp": {"group": "visual", "label": "Fractal distortion", "help": "Bends the picture with layered flowing noise, finer at higher complexity.", "params": {
   "complexity": {"label": "Complexity", "min": 1, "max": 6, "def": 3, "step": 1, "help": "How many layers of noise are added. Lower on weak graphics cards."},
   "scale": {"label": "Scale", "min": 0.5, "max": 8, "def": 2.5, "step": 0.1, "help": "Size of the swirls."},
   "distortion": {"label": "Distortion", "min": 0, "max": 1, "def": 0.4, "step": 0.01, "help": "How far the picture is pushed around."},
   "colorBlend": {"label": "Colour blend", "min": 0, "max": 1, "def": 0.3, "step": 0.01, "help": "Mixes the noise's own colours into the picture."}}},
  "wavyVision": {"group": "visual", "label": "Wavy vision", "help": "Ripples the picture like heat haze. Nothing in the world moves.", "params": {
   "amplitude": {"label": "Amplitude", "min": 0, "max": 0.05, "def": 0.012, "step": 0.0005, "help": "How far the ripple pushes the picture."},
   "frequency": {"label": "Frequency", "min": 1, "max": 40, "def": 9, "step": 0.5, "help": "How many ripples fit on screen."},
   "direction": {"label": "Direction", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "0 ripples sideways, 1 ripples up and down, 0.5 both."},
   "noise": {"label": "Noise", "min": 0, "max": 1, "def": 0.3, "step": 0.01, "help": "Makes the ripple uneven."}}},
  "tunnelVision": {"group": "visual", "label": "Tunnel vision", "help": "Darkens the edges of the screen so only the middle is clear.", "params": {
   "radius": {"label": "Radius", "min": 0.2, "max": 1, "def": 0.65, "step": 0.01, "help": "How much of the middle stays clear."},
   "softness": {"label": "Softness", "min": 0.05, "max": 1, "def": 0.45, "step": 0.01, "help": "How gradual the edge is."},
   "darkness": {"label": "Edge darkness", "min": 0, "max": 1, "def": 0.75, "step": 0.01, "help": "How dark the edge gets."},
   "pulse": {"label": "Pulse rate", "min": 0, "max": 2, "def": 0.2, "step": 0.05, "help": "Times per second the tunnel breathes."},
   "centerX": {"label": "Centre X", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Left to right."},
   "centerY": {"label": "Centre Y", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Bottom to top."}}},
  "doubleVision": {"group": "visual", "label": "Double vision", "help": "Blends in a second copy of the picture, a little to the side.", "params": {
   "offsetX": {"label": "Sideways offset", "min": 0, "max": 0.06, "def": 0.015, "step": 0.0005, "help": "How far the copy sits to the side."},
   "offsetY": {"label": "Vertical offset", "min": 0, "max": 0.06, "def": 0.004, "step": 0.0005, "help": "How far the copy sits above."},
   "opacity": {"label": "Copy opacity", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "How strong the copy is."},
   "oscillation": {"label": "Drift speed", "min": 0, "max": 3, "def": 0.6, "step": 0.05, "help": "Times per second the copy drifts back and forth."}}},
  "particles": {"group": "visual", "label": "Hallucinated lights", "help": "Drifting lights and shapes seen only by the player. They are not in the world and other players cannot see them.", "params": {
   "style": {"label": "Style", "min": 0, "max": 4, "def": 0, "step": 1, "help": "0 floating lights, 1 sparks, 2 glowing dust, 3 geometric shapes, 4 swirling energy."},
   "count": {"label": "Amount", "min": 1, "max": 300, "def": 60, "step": 1, "help": "How many are shown (fewer on lower graphics settings)."},
   "size": {"label": "Size", "min": 0.02, "max": 1, "def": 0.12, "step": 0.01, "help": "Size of each one."},
   "hue": {"label": "Colour", "min": 0, "max": 360, "def": 170, "step": 1, "help": "Colour as a hue angle."},
   "drift": {"label": "Drift speed", "min": 0, "max": 3, "def": 0.5, "step": 0.05, "help": "How fast they move."}}},
  "cameraMotion": {"group": "camera", "label": "Camera motion", "help": "Gentle sway, drift, bob and zoom added on top of the player's own view. It never takes the controls.", "params": {
   "sway": {"label": "Sway", "min": 0, "max": 4, "def": 0.6, "step": 0.05, "help": "Sideways rocking, in degrees."},
   "swayRate": {"label": "Sway rate", "min": 0.05, "max": 2, "def": 0.35, "step": 0.05, "help": "Rocks per second."},
   "drift": {"label": "Rotational drift", "min": 0, "max": 3, "def": 0.5, "step": 0.05, "help": "A slow wander of the view, in degrees. It always comes back."},
   "bob": {"label": "Bob", "min": 0, "max": 0.1, "def": 0.02, "step": 0.002, "help": "Up and down movement, in metres."},
   "fov": {"label": "FOV change", "min": 0, "max": 12, "def": 0, "step": 0.1, "help": "Widens and narrows the view, in degrees."},
   "zoomPulse": {"label": "Zoom pulse", "min": 0, "max": 8, "def": 0, "step": 0.1, "help": "A heartbeat zoom, in degrees."},
   "shake": {"label": "Screen shake", "min": 0, "max": 1, "def": 0, "step": 0.01, "help": "Small rapid tremor."}}},
  "audioFilter": {"group": "audio", "label": "Muffle / thin", "help": "Low-pass and high-pass filters on the world sound (not on voice chat).", "params": {
   "lowpass": {"label": "Low-pass cutoff (Hz)", "min": 200, "max": 20000, "def": 2500, "step": 50, "help": "Sound above this is cut. Lower is more muffled."},
   "highpass": {"label": "High-pass cutoff (Hz)", "min": 20, "max": 2000, "def": 20, "step": 10, "help": "Sound below this is cut. Higher is thinner."}}},
  "audioEcho": {"group": "audio", "label": "Echo and reverb", "help": "Echo repeats and a room-like tail on the world sound.", "params": {
   "delay": {"label": "Echo delay (s)", "min": 0.05, "max": 1, "def": 0.28, "step": 0.01, "help": "Time between repeats."},
   "feedback": {"label": "Echo repeats", "min": 0, "max": 0.6, "def": 0.35, "step": 0.01, "help": "How many repeats. Capped below 0.6 so it can never run away."},
   "reverb": {"label": "Reverb amount", "min": 0, "max": 1, "def": 0.3, "step": 0.01, "help": "A room-like tail."},
   "mix": {"label": "Echo mix", "min": 0, "max": 1, "def": 0.4, "step": 0.01, "help": "How loud the echo is against the dry sound."}}},
  "audioPitch": {"group": "audio", "label": "Pitch bend", "help": "Raises or lowers world sound without speeding it up or slowing it down.", "params": {
   "semitones": {"label": "Semitones", "min": -12, "max": 12, "def": -3, "step": 0.5, "help": "Negative is lower, positive is higher."},
   "wobble": {"label": "Wobble", "min": 0, "max": 1, "def": 0.2, "step": 0.01, "help": "Slow drift of the pitch around its setting."}}},
  "audioPan": {"group": "audio", "label": "Stereo drift and pulse", "help": "Sound drifts from ear to ear and swells in time.", "params": {
   "rate": {"label": "Drift rate", "min": 0.05, "max": 2, "def": 0.3, "step": 0.05, "help": "Sweeps per second."},
   "depth": {"label": "Drift depth", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "How far the sound swings."},
   "pulse": {"label": "Pulse depth", "min": 0, "max": 1, "def": 0.3, "step": 0.01, "help": "How much the volume swells (never faster than 3 times a second)."},
   "pulseRate": {"label": "Pulse rate", "min": 0.1, "max": 3, "def": 1.1, "step": 0.05, "help": "Swells per second."}}},
  "audioDistortion": {"group": "audio", "label": "Electronic distortion", "help": "Crunchy, bit-crushed world sound.", "params": {
   "drive": {"label": "Drive", "min": 0, "max": 1, "def": 0.35, "step": 0.01, "help": "How hard the sound is clipped."},
   "mix": {"label": "Mix", "min": 0, "max": 1, "def": 0.4, "step": 0.01, "help": "Distorted against clean."}}},
  "audioWhispers": {"group": "audio", "label": "Whispers and imagined voices", "help": "Soft synthetic murmurs round the head. They are made up by the game, are clearly not speech from other players, and are never mixed into voice chat.", "params": {
   "level": {"label": "Level", "min": 0, "max": 1, "def": 0.3, "step": 0.01, "help": "How loud the murmurs are."},
   "density": {"label": "Density", "min": 0.1, "max": 3, "def": 0.6, "step": 0.05, "help": "Murmurs per second."},
   "pitch": {"label": "Voice pitch", "min": 0, "max": 1, "def": 0.5, "step": 0.01, "help": "Low to high."}}},
  "audioAmbient": {"group": "audio", "label": "Ambient bed", "help": "A synthesized rain, wind or night-insect bed under the world sound.", "params": {
   "style": {"label": "Style", "min": 0, "max": 2, "def": 0, "step": 1, "help": "0 rain, 1 wind, 2 night insects."},
   "level": {"label": "Level", "min": 0, "max": 1, "def": 0.3, "step": 0.01, "help": "How loud."}}}
 },
 "modifiers": {
  "walkSpeed": {"label": "Walking speed", "min": -0.5, "max": 0.5, "supported": true, "help": "Changes walking speed. 0.2 is 20 percent faster."},
  "runSpeed": {"label": "Running speed", "min": -0.5, "max": 0.5, "supported": true, "help": "Changes sprinting speed."},
  "movementControl": {"label": "Movement control", "min": -0.6, "max": 0.4, "supported": true, "help": "How quickly you start and stop. Negative feels slippery."},
  "staminaRegen": {"label": "Stamina regeneration", "min": -0.5, "max": 0.5, "supported": false, "help": "The game has no stamina yet."},
  "staminaDrain": {"label": "Stamina drain", "min": -0.5, "max": 0.5, "supported": false, "help": "The game has no stamina yet."},
  "damageDealt": {"label": "Damage dealt", "min": -0.5, "max": 0.5, "supported": false, "help": "Not available on foot yet."},
  "damageResist": {"label": "Damage resistance", "min": -0.5, "max": 0.5, "supported": false, "help": "Not available on foot yet."},
  "meleeEffectiveness": {"label": "Melee effectiveness", "min": -0.5, "max": 0.5, "supported": false, "help": "The game has no melee yet."},
  "accuracy": {"label": "Accuracy", "min": -0.5, "max": 0.5, "supported": false, "help": "Not available on foot yet."},
  "interactionSpeed": {"label": "Interaction speed", "min": -0.5, "max": 0.5, "supported": false, "help": "Interactions are instant today."}
 },

 "vendorRegistry": [
  {"entity": "shop-here", "name": "SHOP HERE counter", "kind": "counter", "location": "District store"},
  {"entity": "kiosk-entrance", "name": "Store kiosk by the entrance", "kind": "kiosk", "location": "District store"},
  {"entity": "kiosk-far-1", "name": "Store kiosk, far wall (survival gear)", "kind": "kiosk", "location": "District store"},
  {"entity": "kiosk-far-2", "name": "Store kiosk, far wall (by Iris)", "kind": "kiosk", "location": "District store"},
  {"entity": "vend-drinks", "name": "Vending machine: DRINKS", "kind": "vending", "location": "District vending alcove"},
  {"entity": "vend-dispensary", "name": "Vending machine: DISPENSARY", "kind": "vending", "location": "District vending alcove"},
  {"entity": "vend-neurohackers", "name": "Vending machine: NEUROHACKERS", "kind": "vending", "location": "District vending alcove"},
  {"entity": "bar-menu", "name": "Bar counter menu", "kind": "counter", "location": "District bar"}
 ],
 "common": {
  "intensity": {"min": 0, "max": 1, "def": 0.6}, "delay": {"min": 0, "max": 600, "def": 0}, "duration": {"min": 1, "max": 900, "def": 45}, "fadeIn": {"min": 0, "max": 60, "def": 3},
  "fadeOut": {"min": 0, "max": 120, "def": 6}, "speed": {"min": 0.1, "max": 4, "def": 1}
 }
};
if (typeof module !== 'undefined') module.exports = globalThis.VoidConsumableSpec;
