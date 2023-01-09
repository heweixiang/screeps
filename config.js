/**
 * 静态配置文件
 * Game.Config
 */
const MOVE_ENERGY = 50
const WORK_ENERGY = 100
const CARRY_ENERGY = 50
const ATTACK_ENERGY = 80
const RANGED_ATTACK_ENERGY = 150
const HEAL_ENERGY = 250
const TOUGH_ENERGY = 10
const CLAIM_ENERGY = 600

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
    // 1、综合工/修理工/建筑工/升级工/预备工
    generateInitialWorker: (ROOM) => {
      // 计算当前房间的能量容量
      const energyCapacity = ROOM.energyCapacityAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 最大限度的生成一个包含 工作模块、移动模块 的修理工
      for (let i = 0; i < Math.floor(energyCapacity / (WORK_ENERGY + CARRY_ENERGY + MOVE_ENERGY)); i++) {
        body.push(WORK)
        body.push(CARRY)
        body.push(MOVE)
      }
      return body
    },
    // 2、采集者,采集者分配一个CARRY模块，用于建造和维护
    generateHarvester: (ROOM) => {
      // 计算当前房间的能量容量
      const energyCapacity = ROOM.energyCapacityAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 最大限度的生成一个包含 工作模块、移动模块 的采集者
      for (let i = 0; i < Math.floor(energyCapacity / (WORK_ENERGY * 2 + MOVE_ENERGY)); i++) {
        body.push(WORK)
        body.push(WORK)
        body.push(MOVE)
      }
      return body
    },
    // 3、运输者
    generateTransporter: (ROOM) => {
      // 计算当前房间的能量容量
      const energyCapacity = ROOM.energyCapacityAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 最大限度的生成一个包含 运输模块、移动模块 的运输者
      for (let i = 0; i < Math.floor(energyCapacity / (CARRY_ENERGY * 2 + MOVE_ENERGY)); i++) {
        body.push(CARRY)
        body.push(CARRY)
        body.push(MOVE)
      }
      return body
    },
    // 4、战斗工
    // 5、探索工
    // 6、治疗工
    // 普通通用工具人
  }
}



module.exports = config;