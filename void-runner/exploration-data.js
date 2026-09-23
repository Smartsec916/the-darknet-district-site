/* Prototype locations are content, not campaign replacements. Units are metres. */
(function(root) {
  const systems = {
    frontier: {
      name: 'FRONTIER',
      destinations: ['meridian', 'kepler', 'undertow', 'foundry']
    },
    sol: {
      name: 'SOL',
      interstellar: true,
      unlockQuest: 'open',
      destinations: ['earth', 'mars']
    }
  };
  const destinations = {
    earth: {
      name: 'EARTH — SACRAMENTO',
      system: 'sol',
      location: 'sacramento',
      color: '#609cb5'
    },
    mars: {
      name: 'MARS — UNDERGROUND CITY',
      system: 'sol',
      location: 'mars-terminal',
      color: '#ba6847'
    }
  };
  const locations = {
    hangar: {
      name: 'MERIDIAN / TEST HANGAR',
      kind: 'hangar',
      bounds: [18, 26],
      spawn: [0, 1.7, -15],
      color: '#416268',
      music: 'industrial',
      prototype: true,
      solids: [{
        id: 'ship',
        position: [-7, 2, -5],
        size: [7, 4, 11]
      }, {
        id: 'services',
        position: [12, 1, 10],
        size: [4, 2, 3]
      }],
      interactions: [{
        id: 'board',
        label: 'BOARD KESTREL',
        position: [-3, 1.7, -10],
        action: 'board',
        range: 3.2
      }, {
        id: 'rook',
        label: 'TALK — ROOK',
        position: [3, 1.7, 4],
        action: 'talk',
        character: 'rook',
        range: 3
      }, {
        id: 'services',
        label: 'ACCESS SHIP SERVICES',
        position: [10, 1.7, 7],
        action: 'services',
        range: 3
      }],
      signs: [{
        id: 'dock-sign',
        position: [0, 6, 23],
        text: 'MERIDIAN / FREIGHT 07',
        color: '#79bfad',
        animation: 'pulse'
      }, {
        id: 'safety',
        position: [-13, 3, 10],
        text: 'YOUR BERTH / YOUR RESPONSIBILITY',
        color: '#c5a364'
      }]
    },
    sacramento: {
      name: 'EARTH / SACRAMENTO LANDING ZONE',
      kind: 'city',
      bounds: [22, 36],
      spawn: [0, 1.7, -27],
      color: '#465257',
      music: 'earth',
      prototype: true,
      solids: [{
        id: 'west-block',
        position: [-13, 7, 0],
        size: [12, 14, 37]
      }, {
        id: 'east-block',
        position: [14, 5, -8],
        size: [12, 10, 22]
      }, {
        id: 'alley-wall',
        position: [9, 6, 18],
        size: [3, 12, 21]
      }, {
        id: 'entrance-wall',
        position: [0, 5, 32],
        size: [16, 10, 2]
      }],
      interactions: [{
        id: 'board',
        label: 'BOARD KESTREL',
        position: [0, 1.7, -30],
        action: 'board',
        range: 3.5
      }, {
        id: 'tdd',
        label: 'INSPECT — THE DARKNET DISTRICT',
        position: [0, 1.7, 30],
        action: 'tdd',
        range: 3
      }, {
        id: 'terminal',
        label: 'ACCESS LANDING TERMINAL',
        position: [6, 1.7, -22],
        action: 'terminal',
        range: 3
      }],
      signs: [{
        id: 'city',
        position: [-5, 6, -16],
        text: 'SACRAMENTO / MUNICIPAL LANDING',
        color: '#b6a888'
      }, {
        id: 'ad',
        position: [7, 7, 7],
        text: 'SOLNET / SECURITY IS A SERVICE',
        color: '#b59775',
        animation: 'flicker'
      }, {
        id: 'tdd-sign',
        position: [0, 4, 30.8],
        text: 'THE DARKNET DISTRICT',
        color: '#63c5b7',
        animation: 'pulse'
      }]
    },
    'mars-terminal': {
      name: 'MARS / SUBSURFACE ACCESS',
      kind: 'underground',
      bounds: [16, 30],
      spawn: [0, 1.7, -23],
      color: '#695044',
      music: 'mars',
      prototype: true,
      solids: [{
        id: 'airlock-left',
        position: [-10, 3, -6],
        size: [10, 6, 3]
      }, {
        id: 'airlock-right',
        position: [10, 3, -6],
        size: [10, 6, 3]
      }, {
        id: 'concourse',
        position: [-10, 2, 16],
        size: [7, 4, 14]
      }, {
        id: 'industry',
        position: [11, 3, 16],
        size: [7, 6, 14]
      }],
      interactions: [{
        id: 'board',
        label: 'BOARD KESTREL',
        position: [0, 1.7, -26],
        action: 'board',
        range: 3.5
      }, {
        id: 'airlock',
        label: 'USE AIRLOCK',
        position: [0, 1.7, -8],
        action: 'airlock',
        range: 3
      }, {
        id: 'city',
        label: 'ACCESS UNDERGROUND CITY TERMINAL',
        position: [0, 1.7, 21],
        action: 'terminal',
        range: 3
      }],
      signs: [{
        id: 'pressure',
        position: [0, 4, -6],
        text: 'PRESSURE CONTROL / SUBSURFACE ACCESS',
        color: '#d2ae73'
      }, {
        id: 'city-sign',
        position: [0, 5, 26],
        text: 'UNDERGROUND CITY / TRANSIT CONCOURSE',
        color: '#a0bdb8',
        animation: 'pulse'
      }]
    }
  };
  const radio = {
    nightdrive: {
      name: 'NIGHT//DRIVE',
      regions: ['frontier', 'sol'],
      tracks: []
    },
    district: {
      name: 'DISTRICT RADIO',
      regions: ['earth'],
      tracks: []
    },
    mars: {
      name: 'MARS RADIO',
      regions: ['mars'],
      tracks: []
    },
    solnet: {
      name: 'SOLNET NEWS',
      regions: ['sol', 'earth', 'mars'],
      tracks: []
    },
    freebelt: {
      name: 'FREEBELT',
      regions: ['frontier'],
      tracks: []
    }
  };

  function solAvailable(state) {
    return state.quest === systems.sol.unlockQuest;
  }
  const api = {
    systems,
    destinations,
    locations,
    radio,
    solAvailable
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidExplorationData = api;
})(globalThis);
