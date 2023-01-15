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
    // 获取房间内所有空闲的spawn
    const spawns = Room.find(FIND_MY_SPAWNS, {
      filter: (spawn) => {
        return !spawn.spawning;
      }
    });

    // 如果有空闲的spawn
    if (spawns.length > 0) {
      if (emergency(Room, spawns[0]) === 'create') {
        return
      }
      switch (Room.controller.level) {
        case 8:
        case 7:
        case 6:
        case 5:
        case 4:
        case 3:
        case 2:
          createCreepForRCL2(Room, spawns[0]);
        case 1:
          createCreepForRCL1(Room, spawns[0]);
          break;
      }
    }
    roomCreepInfoLog(Room);
  }
}

// 二级可以发展外矿了
function createCreepForRCL2(Room, spawn) {
  const CreepList = []
  // 遍历 Game.creeps
  for (let name in Game.creeps) {
    CreepList.push(Game.creeps[name]);
  }
  // 获取全图黄色旗子
  const flagObj = Game.flags;
  const flags = [];
  for (let key in flagObj) {
    if (flagObj[key].color == COLOR_YELLOW) {
      flags.push(flagObj[key]);
    }
  }
  // 遍历所有黄色旗子
  for (let i = 0; i < flags.length; i++) {
    // 获取旗子所在房间
    const flagRoom = Game.rooms[flags[i].pos.roomName];
    // 如果该房间没有视野且没有进去过
    if (!flagRoom) {
      // 查询是否有绑定该房间的creep
      const creep = CreepList.filter((creep) => {
        return creep.memory.bindRoom == flags[i].pos.roomName;
      });
      // 如果没有绑定该房间的creep
      if (creep.length == 0) {
        // 生产矿工并绑定旗子所在房间
        const body = Game.Config.creep.generateHarvester(Room);
        const name = 'TouchFish_外矿矿工' + Game.time;
        const config = { memory: { role: ROLE_EXTERNALMINE_WORKER, behavior: BEHAVIOR_HARVEST, bindRoom: flagRoom.name } };
        // 创造creep
        spawn.spawnCreep(body, name, config);
        return 'create';
      }
    } else if (flagRoom) {
      // 生成一个外矿攻击者防止NPC入侵
      const attackers = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_EXTERNALMINE_ATTACKER && creep.memory.bindRoom == flagRoom.name;
      });
      if (attackers.length == 0) {
        const body = Game.Config.creep.generateAttacker(Room);
        const name = 'TouchFish_外矿攻击者' + Game.time;
        const config = { memory: { role: ROLE_EXTERNALMINE_ATTACKER, behavior: BEHAVIOR_ATTACK, bindRoom: flagRoom.name } };
        // 创造creep
        spawn.spawnCreep(body, name, config);
        return 'create';
      }
      // 根据房间内的外矿数量生成外矿矿工
      const workers = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_EXTERNALMINE_WORKER && creep.memory.bindRoom == flagRoom.name;
      });
      // flagRoom source数量生成矿工
      const sourceLen = flagRoom.find(FIND_SOURCES).length;      
      if (workers.length < sourceLen) {
        const body = Game.Config.creep.generateHarvester(Room);
        const name = 'TouchFish_外矿矿工' + Game.time;
        const config = { memory: { role: ROLE_EXTERNALMINE_WORKER, behavior: BEHAVIOR_HARVEST, bindRoom: flagRoom.name } };
        // 创造creep
        spawn.spawnCreep(body, name, config);
        return 'create';
      }
      // 如果有了这些配置给房间配个外矿运输者
      const transporters = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_EXTERNALMINE_TRANSPORTER && creep.memory.bindRoom == flagRoom.name;
      });
      if (transporters.length == 0) {
        const body = Game.Config.creep.generateTransporter(Room);
        const name = 'TouchFish_外矿运输者' + Game.time;
        const config = { memory: { role: ROLE_EXTERNALMINE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT, bindRoom: flagRoom.name } };
        // 创造creep
        spawn.spawnCreep(body, name, config);
        return 'create';
      }
      // 如果该房间有控制器
      if (flagRoom.controller) {
        // 获取外矿预定者
        const reservers = CreepList.filter((creep) => {
          return creep.memory.role == ROLE_EXTERNALMINE_RESERVER && creep.memory.bindRoom == flagRoom.name;
        });
        if (reservers.length == 0) {
          if (Room.energyCapacityAvailable >= 1300) {
            const body = Game.Config.creep.generateReserver(Room);
            const name = 'TouchFish_外矿预定者' + Game.time;
            const config = { memory: { role: ROLE_EXTERNALMINE_RESERVER, behavior: BEHAVIOR_RESERVE, bindRoom: flags[i].pos.roomName } };
            // 创造creep
            spawn.spawnCreep(body, name, config);
            return 'create';
          }
        }
      }
    }
  }
  // TODO 每2000tick生成一个外矿扫描工扫描出生房间的各个出口
  return 'no-create';
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
    const body = Game.Config.creep.generateHarvester(Room);
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
  if (transporters.length < 1 + Game.Tools.GetCreepNum(Room, '运输')) {
    // 加急生成运输者
    const body = Game.Config.creep.generateTransporter(Room);
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
  if (upgraders.length < 1 + Game.Tools.GetCreepNum(Room, '升级')) {
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
    if (builders.length < (constructionSites.length < 5 ? 1 : 2) + Game.Tools.GetCreepNum(Room, '建造')) {
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

// 如果房间内发生了紧急情况
function emergency(Room, spawn) {
  // 获取分配者数量ROLE_ASSIGN
  const assigners = Room.find(FIND_MY_CREEPS, {
    filter: (creep) => {
      return creep.memory.role == ROLE_ASSIGN;
    }
  });
  // 获取 storage剩余能量
  const storageEnergy = Room.storage ? Room.storage.store.getUsedCapacity(RESOURCE_ENERGY) : 0
  // 如果分配者数量小于1或者storage剩余能量小于10000
  if (assigners.length < 1 || storageEnergy < 10000) {
    // 获取矿工数量
    const workers = Room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        return creep.memory.role == ROLE_WORKER;
      }
    });
    // 获取运输者数量
    const transporters = Room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        return creep.memory.role == ROLE_TRANSPORTER;
      }
    });
    // 如果运输者数量小于1
    if (transporters.length < 1) {
      // 生成运输者
      const body = Game.Config.creep.generateTransporter(Room, true);
      const name = 'TouchFish_运输爬爬' + Game.time;
      const config = { memory: { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT } };
      // 创建运输者
      GenerateCreep(Room, spawn, body, name, config);
      return 'create'
    }
    // 如果矿工数量小于1
    if (workers.length < 1) {
      // 生成矿工
      const body = Game.Config.creep.generateHarvester(Room, true);
      const name = 'TouchFish_矿工爬爬' + Game.time;
      const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST } };
      // 创建矿工
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
      console.log(`生成爬爬失败【${nameZN}】【${body.length}模块】，生成需要 ${computedResult.NeedEnergy} 能量`);
      return false
    }
  } else if (computedResult.CanGenerate === false) {
    console.log(`即将生成爬爬【${nameZN}】【${body.length}模块】，预计还需要 ${computedResult.LackEnergy} 能量`);
    return false
  }
}

function roomCreepInfoLog(Room) {
  // 获取房间所有爬爬
  let creeps = Room.find(FIND_MY_CREEPS);
  const creepsNameList = creeps.map(creep => creep.name.replace(/\d+$/, '').replace('TouchFish_', ''));
  const creepsNameListCount = {};
  creepsNameList.forEach(name => {
    creepsNameListCount[name] = creepsNameListCount[name] ? creepsNameListCount[name] + 1 : 1;
  });
  console.log(`爬爬数量：${creeps.length}，爬爬列表：${JSON.stringify(creepsNameListCount)}`);
  // 输出附加爬爬
  if (Room.memory.CreepNum) {
    let addCreepStr = '手动附加: ';
    for (const iterator in Room.memory.CreepNum) {
      if (Room.memory.CreepNum[iterator] === 0) continue
      addCreepStr += iterator + "：" + Room.memory.CreepNum[iterator] + "   "
    }
    if (addCreepStr.length > 5) {
      console.log(addCreepStr);
    }
  }
}

module.exports = createCreep;