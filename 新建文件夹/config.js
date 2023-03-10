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
// 全局整体配置
// 爬爬部件最高50个
const MAX_CREEP_PARTS = 50

const config = {
  RoomType: '种田流！',

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
    // 1、综合工/修理工/建筑工/升级工/预备工/分配
    generateInitialWorker: (ROOM, expedited = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 一个工作模块，一个移动模块，一个搬运模块为最小单位形成一个body小于MAX_CREEP_PARTS的creep
      for (let i = 0; i < Math.floor(energyCapacity / (WORK_ENERGY + CARRY_ENERGY + MOVE_ENERGY)) && body.length + 3 < MAX_CREEP_PARTS; i++) {
        body.push(WORK)
        body.push(CARRY)
        body.push(MOVE)
      }
      return body
    },
    // 2、采集者,采集者分配一个CARRY模块，用于建造和维护
    generateHarvester: (ROOM, expedited = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = [CARRY]
      // 最大限度的生成一个包含 工作模块、移动模块 的采集者
      let workNum = Math.floor((energyCapacity - CARRY_ENERGY) / (WORK_ENERGY * 2 + MOVE_ENERGY))
      if (workNum > 5) workNum = workNum > 5 ? 5 : workNum // 采集者最多5个工作模块就可以达到最大效率
      for (let i = 0; i < workNum && body.length + 3 < MAX_CREEP_PARTS; i++) {
        body.push(WORK)
        body.push(WORK)
        body.push(MOVE)
      }
      return body.length === 1 ? [CARRY, WORK, MOVE] : body
    },
    // 3、运输者
    generateTransporter: (ROOM, expedited = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = [WORK, MOVE]
      // 最大限度的生成一个包含 运输模块、移动模块 的运输者
      for (let i = 0; i < Math.floor((energyCapacity - WORK_ENERGY - MOVE_ENERGY) / (CARRY_ENERGY * 2 + MOVE_ENERGY)) && body.length + 3 < MAX_CREEP_PARTS; i++) {
        body.push(CARRY)
        body.push(CARRY)
        body.push(MOVE)
      }
      return body.length === 2 ? [WORK, CARRY, MOVE] : body
    },
    // 一体机
    generateAllInOne: (ROOM, expedited = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 最大限度的生成一个包含 远程攻击模块、治疗模块、移动模块 的一体机
      for (let i = 0; i < Math.floor(energyCapacity / (RANGED_ATTACK_ENERGY + HEAL_ENERGY + MOVE_ENERGY)) && body.length + 3 < MAX_CREEP_PARTS; i++) {
        body.push(RANGED_ATTACK)
        body.push(HEAL)
        body.push(MOVE)
      }
      // 排序，保证攻击模块在前，移动模块在后，治疗模块在最后
      body.sort((a, b) => {
        if (a === RANGED_ATTACK && b === MOVE) return -1
        if (a === MOVE && b === RANGED_ATTACK) return 1
        if (a === MOVE && b === HEAL) return -1
        if (a === HEAL && b === MOVE) return 1
        return 0
      })
      return body
    },
    // 4、攻击者
    generateAttacker: (ROOM, expedited = false, powerful = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = []
      let workNum = Math.floor(energyCapacity / (ATTACK_ENERGY * 2 + MOVE_ENERGY * 2))
      if (powerful) workNum = workNum > 5 ? 5 : workNum // 普通清理野怪使用
      // 最大限度的生成一个包含 攻击模块、移动模块 的攻击者
      for (let i = 0; i < workNum; i++) {
        body.push(ATTACK)
        body.push(ATTACK)
        body.push(MOVE)
        body.push(MOVE)
      }
      if (powerful && Math.floor(energyCapacity / (ATTACK_ENERGY * 2 + MOVE_ENERGY * 2)) > 5) {
        body.push(WORK)
        body.push(CARRY)
      }
      return body
    },
    // 远程
    generateRangedAttacker: (ROOM, expedited = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 最大限度的生成一个包含 攻击模块、移动模块 的攻击者
      for (let i = 0; i < Math.floor(energyCapacity / (ATTACK_ENERGY * 2 + MOVE_ENERGY * 2)) && body.length + 3 < MAX_CREEP_PARTS; i++) {
        body.push(RANGED_ATTACK)
        body.push(RANGED_ATTACK)
        body.push(MOVE)
        body.push(MOVE)
      }
      return body
    },
    // 5、探索工
    // 6、治疗工
    generateHealer: (ROOM, expedited = false, powerful = false) => {
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = []
      let workNum = Math.floor(energyCapacity / (HEAL_ENERGY * 2 + MOVE_ENERGY * 2))
      if (!powerful) workNum = workNum > 2 ? 2 : workNum // 普通清理野怪使用
      // 最大限度的生成一个包含 攻击模块、移动模块 的攻击者
      for (let i = 0; i < workNum; i++) {
        body.push(HEAL)
        body.push(HEAL)
        body.push(MOVE)
        body.push(MOVE)
      }
      return body
    },
    // 7、预定工
    generateManager: (ROOM, expedited = false) => {
      // 因为生命只有100T，所以预定工只能有1个工作模块
      // 计算当前房间的能量容量
      let energyCapacity = ROOM.energyCapacityAvailable
      // 如果是加急模式，获取当前房间的可用能量，保证100%生成成功
      if (expedited) energyCapacity = ROOM.energyAvailable
      // 根据能量容量计算出creep的body
      const body = []
      // 最大限度的生成一个包含 攻击模块、移动模块 的攻击者
      for (let i = 0; i < Math.floor(energyCapacity / (CLAIM_ENERGY + MOVE_ENERGY)) && body.length + 3 < MAX_CREEP_PARTS; i++) {
        body.push(CLAIM)
        body.push(MOVE)
      }
      return body
    },
  }
}
module.exports = config;