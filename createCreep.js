// 创建creep

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
// 分配
const ROLE_ASSIGN = 'ROLE_ASSIGN';
// 外矿矿工
const ROLE_EXTERNALMINE_WORKER = 'ROLE_EXTERNALMINE_WORKER';
// 外矿运输者
const ROLE_EXTERNALMINE_TRANSPORTER = 'ROLE_EXTERNALMINE_TRANSPORTER';
// 外矿攻击者
const ROLE_EXTERNALMINE_ATTACKER = 'ROLE_EXTERNALMINE_ATTACKER';
// 外矿治疗者
const ROLE_EXTERNALMINE_HEALER = 'ROLE_EXTERNALMINE_HEALER';
// 外矿预定者
const ROLE_EXTERNALMINE_RESERVER = 'ROLE_EXTERNALMINE_RESERVER';
// 综合工（前期）：采集 > 运输 > 修理 > 升级 > 建造 脏活累活都干
const ROLE_HARVESTER = 'ROLE_HARVESTER';
// 行为
// 采集
const BEHAVIOR_HARVEST = 'BEHAVIOR_HARVEST';
// 运输
const BEHAVIOR_TRANSPORT = 'BEHAVIOR_TRANSPORT';
// 修理
const BEHAVIOR_REPAIR = 'BEHAVIOR_REPAIR';
// 升级
const BEHAVIOR_UPGRADE = 'BEHAVIOR_UPGRADE';
// 建造
const BEHAVIOR_BUILD = 'BEHAVIOR_BUILD';
// 分配
const BEHAVIOR_ASSIGN = 'BEHAVIOR_ASSIGN';
// 攻击
const BEHAVIOR_ATTACK = 'BEHAVIOR_ATTACK';
// 治疗
const BEHAVIOR_HEAL = 'BEHAVIOR_HEAL';
// 预定
const BEHAVIOR_RESERVE = 'BEHAVIOR_RESERVE';

const createCreep = {
  loop(Room) {
    // 如果该房间有空闲的spawn，5tikc执行一次
    if (Game.time % 5 == 0) {
      // 获取房间内所有空闲的spawn
      const spawns = Room.find(FIND_MY_SPAWNS, {
        filter: (spawn) => {
          return !spawn.spawning;
        }
      });
      // 如果有空闲的spawn
      if (spawns.length > 0) {
        switch (Room.controller.level) {
          case 8:
          case 7:
          case 6:
          case 5:
          case 4:
          case 3:
          case 2:
          case 1:
            createCreepForRCL1(Room, spawns[0]);
            break;
        }
      }
    }
  }
}



// RCL1房间创建creep
function createCreepForRCL1(Room, spawn) {
  // 获取该房间矿工列表
  const workers = Room.find(FIND_MY_CREEPS, {
    filter: (creep) => {
      return creep.memory.role == ROLE_WORKER;
    }
  });
  // 首先保证矿工数量有一个
  if (workers.length == 0) {
    // 加急生成矿工
    const body = Game.Config.creep.generateHarvester(Room, true);
    const name = 'TouchFish_矿工爬爬' + Game.time;
    const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST } };
    // 创建矿工
    GenerateCreep(Room, spawn, body, name, config);
    return 'create'
  }
  // 获取该房间运输者列表
  const transporters = Room.find(FIND_MY_CREEPS, {
    filter: (creep) => {
      return creep.memory.role == ROLE_TRANSPORTER;
    }
  });
  // 保证运输者数量有一个
  if (transporters.length == 0) {
    // 加急生成运输者
    const body = Game.Config.creep.generateTransporter(Room, true);
    const name = 'TouchFish_运输爬爬' + Game.time;
    const config = { memory: { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT } };
    // 创建运输者
    GenerateCreep(Room, spawn, body, name, config);
    return 'create'
  }
  // 获取该房间资源矿列表
  const sources = Room.find(FIND_SOURCES);
  // ruguo 该房间资源矿数量大于矿工数量
  if (sources.length > workers.length) {
    // 生成矿工
    const body = Game.Config.creep.generateHarvester(Room);
    const name = 'TouchFish_矿工爬爬' + Game.time;
    const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST } };
    // 创建矿工
    GenerateCreep(Room, spawn, body, name, config);
    return 'create'
  }
  // 获取升级爬爬
  const upgraders = Room.find(FIND_MY_CREEPS, {
    filter: (creep) => {
      return creep.memory.role == ROLE_HARVESTER && creep.memory.behavior == BEHAVIOR_UPGRADE;
    }
  });
  // 如果升级爬爬数量小于1
  if (upgraders.length < 1) {
    // 生成升级爬爬
    const body = Game.Config.creep.generateInitialWorker(Room);
    const name = 'TouchFish_升级爬爬' + Game.time;
    const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_UPGRADE } };
    // 创建升级爬爬
    GenerateCreep(Room, spawn, body, name, config);
    return 'create'
  }
  // 获取工地数量
  const constructionSites = Room.find(FIND_CONSTRUCTION_SITES);
  // 如果工地数量大于0
  if (constructionSites.length > 0) {
    // 获取建造爬爬数量
    const builders = Room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        return creep.memory.role == ROLE_HARVESTER && creep.memory.behavior == BEHAVIOR_BUILD;
      }
    });
    // 如果建造爬爬数量小于1
    if (builders.length < 1) {
      // 生成建造爬爬
      const body = Game.Config.creep.generateInitialWorker(Room);
      const name = 'TouchFish_建造爬爬' + Game.time;
      const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_BUILD } };
      // 创建建造爬爬
      GenerateCreep(Room, spawn, body, name, config);
      return 'create'
    }
  }
  return 'no-create'
}

// 接管创建creep，方便控制台输出了解详情
function GenerateCreep(Room, spawn, body, name, config) {
  config.memory.createRoom = Room.name;
  // 正则移除name后面的数值
  const nameZN = name.replace(/\d+$/, '');
  // 获取当前爬爬生成需要的能量
  const computedResult = Game.Tools.ComputerCreepCost(body, Room);
  if (computedResult.CanGenerate === true) {
    const SpawnCreateResult = spawn.spawnCreep(body, name, config);
    if (SpawnCreateResult === OK) {
      console.log(`生成爬爬成功【${nameZN}】【${body.length}模块】，本次消耗 ${computedResult.NeedEnergy} 能量`);
      return true
    } else {
      console.log(`生成爬爬失败【${nameZN}】【${body.length}模块】，生成需要 ${computedResult.NeedEnergy} 能量,当前房间能量：${computedResult.AvailableEnergy} ...`);
      return false
    }
  } else if (computedResult.CanGenerate === false) {
    console.log(`即将生成爬爬【${nameZN}】【${body.length}模块】，预计还需要 ${computedResult.LackEnergy} 能量,当前房间能量：${computedResult.AvailableEnergy} ...`);
    return false
  }
}

module.exports = createCreep;