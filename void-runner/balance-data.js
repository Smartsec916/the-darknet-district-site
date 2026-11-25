/* Shared by the browser and Python API. Edit this JSON object to tune defaults and limits. */
globalThis.VoidBalanceSpec = {
  "daxRecruitPlayMinutes": {"value":-1,"min":-1,"max":100000},
  "daxBountyPlayMinutes": {"value":-1,"min":-1,"max":100000},
  "daxRecruitCivilianReputation": {"value":0,"min":-100,"max":100},
  "daxBountyCivilianReputation": {"value":0,"min":-100,"max":100},
  "firstRaiderDelay": {"value":10,"min":0,"max":60},
  "playerHull": {
    "value": 100,
    "min": 1,
    "max": 10000
  },
  "playerShield": {
    "value": 0,
    "min": 0,
    "max": 10000
  },
  "shieldRechargeRate": {
    "value": 6,
    "min": 0,
    "max": 1000
  },
  "shieldRechargeDelay": {
    "value": 6,
    "min": 0,
    "max": 60
  },
  "laserDamage": {
    "value": 1,
    "min": 0.01,
    "max": 1000
  },
  "laserFireRate": {
    "value": 4.545454545454546,
    "min": 0.1,
    "max": 60
  },
  "laserProjectileSpeed": {
    "value": 180,
    "min": 1,
    "max": 1000
  },
  "laserRange": {
    "value": 450,
    "min": 1,
    "max": 5000
  },
  "missileDamage": {
    "value": 15,
    "min": 0.01,
    "max": 1000
  },
  "missileSpeed": {
    "value": 90,
    "min": 1,
    "max": 1000
  },
  "missileTurnRate": {
    "value": 1.2,
    "min": 0.01,
    "max": 10
  },
  "missileLockTime": {
    "value": 1.5,
    "min": 0.1,
    "max": 10
  },
  "missileLockRadius": {
    "value": 0.13,
    "min": 0.01,
    "max": 0.3
  },
  "missileCooldown": {
    "value": 2,
    "min": 0.1,
    "max": 60
  },
  "missileLifetime": {
    "value": 6,
    "min": 0.1,
    "max": 30
  },
  "missileRange": {
    "value": 540,
    "min": 1,
    "max": 5000
  },
  "missileM1Damage": {
    "value": 12,
    "min": 0.01,
    "max": 1000
  },
  "missileM1TurnRate": {
    "value": 2.6,
    "min": 0.01,
    "max": 10
  },
  "missileM1Speed": {
    "value": 100,
    "min": 1,
    "max": 1000
  },
  "missileM1Blast": {
    "value": 4,
    "min": 0,
    "max": 60
  },
  "missileM1Price": {
    "value": 60,
    "min": 0,
    "max": 100000
  },
  "missileM2Damage": {
    "value": 40,
    "min": 0.01,
    "max": 1000
  },
  "missileM2TurnRate": {
    "value": 0.9,
    "min": 0.01,
    "max": 10
  },
  "missileM2Speed": {
    "value": 82,
    "min": 1,
    "max": 1000
  },
  "missileM2Blast": {
    "value": 10,
    "min": 0,
    "max": 60
  },
  "missileM2Price": {
    "value": 180,
    "min": 0,
    "max": 100000
  },
  "enemyHull": {
    "value": 2,
    "min": 0.1,
    "max": 10000
  },
  "enemyShield": {
    "value": 0,
    "min": 0,
    "max": 10000
  },
  "enemyLaserDamage": {
    "value": 10,
    "min": 0,
    "max": 1000
  },
  "enemyFireRate": {
    "value": 0.3333333333333333,
    "min": 0.05,
    "max": 10
  },
  "enemyAccuracy": {
    "value": 1,
    "min": 0,
    "max": 1
  },
  "enemyProjectileSpeed": {
    "value": 55,
    "min": 1,
    "max": 1000
  },
  "collisionDamage": {
    "value": 12,
    "min": 0,
    "max": 1000
  },
  "repairCost": {
    "value": 0,
    "min": 0,
    "max": 100000
  },
  "hullPerTier": {
    "value": 30,
    "min": 0,
    "max": 1000
  },
  "shieldPerTier": {
    "value": 15,
    "min": 0,
    "max": 1000
  },
  "laserDamagePerTier": {
    "value": 0.65,
    "min": 0,
    "max": 100
  },
  "laserCooldownPerTier": {
    "value": 0.035,
    "min": 0,
    "max": 0.1
  },
  "premiumLaserDamage": {
    "value": 3.6875,
    "min": 0.01,
    "max": 1000
  },
  "premiumLaserFireRate": {
    "value": 8.695652173913043,
    "min": 0.1,
    "max": 60
  },
  "premiumShield": {
    "value": 70,
    "min": 0,
    "max": 10000
  },
  "premiumShieldRechargeRate": {
    "value": 12,
    "min": 0,
    "max": 1000
  },
  "premiumShieldRechargeDelay": {
    "value": 4,
    "min": 0,
    "max": 60
  },
  "pistolPrice": {"value":350,"min":0,"max":100000},
  "pistolDamage": {"value":34,"min":1,"max":500},
  "pistolAimBonus": {"value":1.24,"min":1,"max":3},
  "pistolCooldown": {"value":0.25,"min":0.05,"max":3},
  "pistolSpread": {"value":1.2,"min":0,"max":15},
  "pistolRecoil": {"value":0.6,"min":0,"max":10},
  "footPlayerHealth": {"value":100,"min":1,"max":1000},
  "footEnemyHealth": {"value":60,"min":1,"max":1000},
  "footEnemyDamage": {"value":11,"min":0,"max":100},
  "footEnemyAccuracy": {"value":0.66,"min":0,"max":1},
  "footEnemyReaction": {"value":1.1,"min":0.2,"max":10},
  "footEnemySpeed": {"value":1.05,"min":0.2,"max":6},
  "detectRange": {"value":26,"min":2,"max":80},
  "detectCone": {"value":110,"min":20,"max":360},
  "guardHostileTime": {"value":45,"min":5,"max":600},
  "civilianFleeRadius": {"value":25,"min":0,"max":120},
  "neutralSafety": {"value":0,"min":0,"max":1},
  "safetyWindow": {"value":2,"min":0.5,"max":10}
};
