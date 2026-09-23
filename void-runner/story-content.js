/* Add narrative data here; missions and player hulls remain in content.js / ships.js. */
(function(root) {
  const locations = {
    meridian: {
      name: 'Meridian Station',
      district: 'SECTOR 07 / THE LOWER ORBIT',
      color: '#58ffe1',
      bar: 'The Dead Channel'
    },
    kepler: {
      name: 'Kepler Exchange',
      district: 'SECTOR 12 / FREIGHT LANE',
      color: '#ffbd69',
      bar: 'The Loading Bay'
    },
    undertow: {
      name: 'Rusthaven Port',
      district: 'SECTOR 19 / OFF THE GRID',
      color: '#ef79ff',
      bar: 'Low Frequency'
    },
    foundry: {
      name: 'The Foundry',
      district: 'SECTOR 24 / INDUSTRIAL BELT',
      color: '#ff795f',
      bar: 'Afterburn'
    }
  };
  const characters = {
    mara: {
      name: 'Mara Voss',
      role: 'FREIGHT MECHANIC',
      cell: '0% 0%',
      faction: 'independent',
      biography: 'Elias’s friend and workshop mechanic.',
      tags: ['mechanic'],
      voiceProfile: 'mara'
    },
    elias: {
      name: 'Elias Ward',
      role: 'ARCHIVED RECORDING',
      cell: '50% 0%',
      faction: 'independent',
      biography: 'Your former employer.',
      tags: ['archive'],
      voiceProfile: 'elias'
    },
    rook: {
      name: 'Rook',
      role: 'INDEPENDENT CARGO BROKER',
      cell: '100% 0%',
      faction: 'independent',
      biography: 'Meridian freight broker.',
      tags: ['broker'],
      voiceProfile: 'rook'
    },
    iona: {
      name: 'Iona Vale',
      role: 'RUSTHAVEN ENGINEER',
      cell: '0% 100%',
      faction: 'independent',
      biography: 'Keeps Rusthaven running.',
      tags: ['engineer'],
      voiceProfile: 'iona'
    },
    sol: {
      name: 'Dr. Sol',
      role: 'KEPLER CLINIC NETWORK',
      cell: '50% 100%',
      faction: 'clinic',
      biography: 'Coordinates frontier medicine.',
      tags: ['doctor'],
      voiceProfile: 'sol'
    },
    nyx: {
      name: 'Nyx',
      role: 'THE DEAD CHANNEL',
      cell: '100% 100%',
      faction: 'independent',
      biography: 'Meridian bartender.',
      tags: ['bartender'],
      voiceProfile: 'nyx'
    }
  };
  for (const [id, c] of Object.entries(characters)) Object.assign(c, {
    id,
    portrait: c.portrait || 'art/characters.png',
    relationshipDefault: c.relationshipDefault ?? 0
  });
  const voices = {
    mara: {
      pitch: 1.05,
      rate: 1,
      volume: .85,
      variant: 1,
      presentation: 'feminine',
      style: 'measured'
    },
    elias: {
      pitch: .9,
      rate: .9,
      volume: .8,
      variant: 2,
      presentation: 'masculine',
      style: 'warm'
    },
    rook: {
      pitch: .9,
      rate: .97,
      volume: .85,
      variant: 0,
      presentation: 'masculine',
      style: 'dry'
    },
    iona: {
      pitch: 1.02,
      rate: 1.03,
      volume: .8,
      variant: 3
    },
    sol: {
      pitch: 1,
      rate: .96,
      volume: .8,
      variant: 4
    },
    nyx: {
      pitch: .96,
      rate: 1,
      volume: .8,
      variant: 5
    }
  };
  const dialogue = {
    mara_workshop_intro: {
      background: 'vesper',
      heading: 'A last gift.',
      start: 'legacy',
      nodes: {
        legacy: {
          character: 'mara',
          text: 'Elias passed away last night. You worked for him for years. In his will, he left you the Kestrel.',
          next: 'recording'
        },
        recording: {
          character: 'elias',
          text: 'The ship is yours. Go make a life of your own.',
          next: 'work'
        },
        work: {
          character: 'mara',
          text: 'You have 100 credits. Fly to Meridian and meet Rook at the bar. He has work.',
          choices: [{
            text: 'I’ll make him proud.',
            effects: {
              flags: {
                maraPromise: true
              },
              relationships: {
                mara: 1
              }
            },
            next: 'depart'
          }, {
            text: 'I need the work.',
            effects: {
              flags: {
                maraPromise: false
              }
            },
            next: 'depart'
          }]
        },
        depart: {
          character: 'mara',
          text: 'Keep her flying. Rook will be waiting.',
          end: 'beginJourney',
          label: 'BOARD SHIP →'
        }
      }
    }
  };
  const ships = {
    mara_courier: {
      id: 'mara_courier',
      displayName: 'Voss Courier',
      owner: 'mara',
      faction: 'independent',
      shipClass: 'raider',
      allegiance: 'friendly',
      art: 'art/ships.png',
      loadout: ['pulse1'],
      behavior: 'rendezvous'
    },
    lane_raider: {
      id: 'lane_raider',
      displayName: 'Lane Raider',
      faction: 'raiders',
      shipClass: 'raider',
      allegiance: 'hostile',
      art: 'art/ships.png',
      loadout: ['pulse1'],
      behavior: 'attack'
    }
  };
  const encounters = {
    mara_rendezvous: {
      ships: ['mara_courier'],
      when: {
        flags: {
          maraPromise: true
        }
      },
      interaction: 'hail'
    }
  };
  const events = [{
    id: 'mara_workshop_intro',
    trigger: {
      type: 'campaignStart'
    },
    scene: 'mara_workshop_intro',
    effects: {
      flags: {
        metMara: true
      },
      chapter: 'inheritance'
    }
  }, {
    id: 'rook_introduced',
    trigger: {
      type: 'talk',
      subject: 'rook'
    },
    effects: {
      flags: {
        rookIntroduced: true
      }
    }
  }, {
    id: 'rusthaven_unlocked',
    trigger: {
      type: 'dock',
      subject: 'undertow'
    },
    effects: {
      flags: {
        rusthavenUnlocked: true
      },
      unlock: ['undertow']
    }
  }];
  const api = {
    locations,
    characters,
    voices,
    dialogue,
    ships,
    encounters,
    events,
    factions: {
      independent: {
        name: 'Independent crews'
      },
      clinic: {
        name: 'Clinic network'
      },
      raiders: {
        name: 'Raiders'
      }
    }
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.VoidStoryContent = api;
})(globalThis);
