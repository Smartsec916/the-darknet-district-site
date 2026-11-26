const fs = require('node:fs');
const path = require('node:path');
const U = require('../void-runner/universe.js');
const C = require('../void-runner/campaign.js');
const layouts = require('../void-runner/station-layouts.js');
const planets = require('../void-runner/planets.js');

const lines = ['# Universe asset development manifest', '',
  'Generated from the flight registry and walking layouts with `node tools/universe-manifest.cjs`.',
  '', '## Universe map', '',
  'Each system marker leads to open space. Local warp routes connect the destinations listed for that system. Access follows campaign discovery. Rook grants Erebus and Tessaly coordinates. Faction missions unlock Cantor and Garrow independently, and each homeworld requires its own unlock.', ''];
lines.push('Local lines in this diagram show departures from arrival space. Any two unlocked local pads or stations also connect directly. You can jump to a different known system from any of its neighbours’ flight locations. Only discovered systems appear as interstellar routes. The diagram shows connections available after all four systems have been discovered.', '', '```mermaid', 'graph LR');
const systems = Object.values(U.systems);
for (const [i, origin] of systems.entries()) {
  for (const destination of systems.slice(i + 1)) {
    lines.push('  ' + origin.arrival.replaceAll('-', '_') + '["' + origin.name + '"] <--> ' +
      destination.arrival.replaceAll('-', '_') + '["' + destination.name + '"]');
  }
}
// Hub-to-destination edges show membership. Any two discovered local destinations connect directly.
for (const [id, location] of Object.entries(U.locations)) {
  if (location.type === 'arrival') continue;
  const hub = U.systems[location.system].arrival.replaceAll('-', '_');
  const planet = U.planets[location.parentPlanet];
  const label = location.type === 'pad' && planet ? planet.name + ' / ' + planet.settlement + ' / ' + planet.facility : C.stations[id].name;
  lines.push('  ' + hub + ' --> ' + id.replaceAll('-', '_') + '["' + label + '"]');
}
lines.push('```', '');
for (const [systemId, system] of Object.entries(U.systems)) {
  lines.push('### ' + system.name, '', 'Ownership — ' + (system.ownerFaction || 'Independent') + '. Central warp marker — `' + system.arrival + '`.', '',
    '| Destination | Permanent flight ID | Type | Planet / settlement |', '| --- | --- | --- | --- |');
  for (const [id, place] of Object.entries(U.locations)) {
    if (place.system !== systemId || place.type === 'arrival') continue;
    const body = U.planets[place.parentPlanet];
    const parent = body ? body.name + (body.provisional ? ' (provisional)' : '') + (place.type === 'pad' ? ' / ' + body.settlement + (body.settlementProvisional ? ' (provisional)' : '') + ' / ' + body.facility + (body.facilityProvisional ? ' (provisional)' : '') : '') : 'Independent space facility';
    lines.push('| ' + C.stations[id].name + ' | `' + id + '` | ' + place.type + ' | ' + parent + ' |');
  }
  lines.push('');
}
lines.push('## Modular Blender specifications', '',
  'Use metres and apply object transforms before exporting glTF. Babylon uses Y up. Export a 1 m reference cube and a forward-axis marker when validating a replacement. Retain the layout origin, interaction IDs, collision volumes and boarding position. Name render meshes separately from simple collision proxies. Use baked materials, a small number of shared lights and the existing scene loader.', '');
for (const [id, place] of Object.entries(U.locations)) {
  if (!place.placeholder) continue;
  const surface = place.type === 'pad';
  const layout = surface ? planets.layout(id) : layouts.layout(id);
  const board = layout.interactions.find(i => i.action === 'board');
  lines.push('### ' + place.name + ' (provisional)', '',
    '- ID and parent — `' + id + '`, ' + U.systems[place.system].name + ', ' + U.planets[place.parentPlanet].name + '.',
    '- Theme — independent ' + (surface ? 'ring survey outpost on an undeveloped world.' : 'industrial orbital transfer facility.') ,
    '- Existing assets — ' + (surface ? 'survey ground, landing pad and parked ship.' : 'modular hangar walls, ceiling, deck and parked ship.'),
    '- Spawn — ' + JSON.stringify(layout.spawn) + ' m, yaw ' + (layout.yaw || 0) + ' rad. Boarding interaction — ' + JSON.stringify(board.position) + ' m.',
    '- Ground elevation — 0 m. Ship anchor — ' + (surface ? '[-4, 1.1, -29] m, yaw 0.3 rad. Circular pad diameter 24 m.' : '[-7, 2, -9] m. Hangar deck 36 × 30 m.'),
    '- Walking bounds — x ±' + layout.bounds[0] + ' m and z ±' + layout.bounds[1] + ' m; retain wall collision.',
    '- Reserved expansion — ' + (surface ? 'build north of z = 8 m, inside the 240 m square walking area. Keep the pad and boarding corridor clear. A future entry or mission contact may attach at [0, 0, 16] m.' : 'extend behind the rear bulkhead at z = 4 m. Place a future crew or mission contact beyond the new pressure door after the adjoining room exists.'),
    '- Needed from art — ' + (surface ? 'site-specific surface materials, future buildings and low-intensity pad lighting.' : 'station hull art, local signage, hangar material set and future interior modules.') + ' NPCs and missions are reserved for later production.', '');
}
const doc = path.join(__dirname, '../docs/development/UNIVERSE_ASSET_MANIFEST.md');
fs.writeFileSync(doc, lines.join('\n').trimEnd() + '\n');
