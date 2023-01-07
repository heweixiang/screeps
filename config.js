/**
 * 静态配置文件
 * Game.Config
 */

const config = {
  RCL: {
    LV1: { Upgrade: 200, Roads: true, Spawn: 1 },
    LV2: { Upgrade: 45000, Roads: true, Spawn: 1, Extension: 5, ExtensionEnergy: 50, Ramparts: 0.3, Walls: true },
    LV3: { Upgrade: 135000, Roads: true, Spawn: 1, Extension: 10, ExtensionEnergy: 50, Ramparts: 1, Walls: true, Tower: 1 },
    LV4: { Upgrade: 405000, Roads: true, Spawn: 1, Extension: 20, ExtensionEnergy: 50, Ramparts: 3, Walls: true, Tower: 1, Storage: true },
    LV5: { Upgrade: 1215000, Roads: true, Spawn: 1, Extension: 30, ExtensionEnergy: 50, Ramparts: 10, Walls: true, Tower: 2, Storage: true, Link: 2 },
    LV6: { Upgrade: 3645000, Roads: true, Spawn: 1, Extension: 40, ExtensionEnergy: 50, Ramparts: 30, Walls: true, Tower: 2, Storage: true, Link: 3, Extractor: true, Lab: 3, Terminal: true },
    LV7: { Upgrade: 10935000, Roads: true, Spawn: 2, Extension: 50, ExtensionEnergy: 100, Ramparts: 100, Walls: true, Tower: 3, Storage: true, Link: 4, Extractor: true, Lab: 6, Terminal: true, Factory: true },
    LV8: { Upgrade: Infinity, Roads: true, Spawn: 3, Extension: 60, ExtensionEnergy: 200, Ramparts: 300, Walls: true, Tower: 6, Storage: true, Link: 6, Extractor: true, Lab: 10, Terminal: true, Factory: true, Observer: true, PowerSpawn: true, Nuker: true }
  },
  // creeps配置
  creep: {
    /**
    "move": 50,
    "work": 100,
    "attack": 80,
    "carry": 50,
    "heal": 250,
    "ranged_attack": 150,
    "tough": 10,
    "claim": 600
     */
    // 普通通用工具人
    baseCreep: [WORK, CARRY, MOVE],

  }

}

module.exports = config;