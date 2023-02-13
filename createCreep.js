// TODO 改成任务式创建
// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
// 哥布林
const ROLE_GOBLIN = 'ROLE_GOBLIN';
// 分配
const ROLE_ASSIGN = 'ROLE_ASSIGN';
// 一体机 供外矿使用
const ROLE_ALL_IN_ONE = 'ROLE_ALL_IN_ONE';
// 外矿治疗者
const ROLE_EXTERNALMINE_HEALER = 'ROLE_EXTERNALMINE_HEALER';
// 管理者
const ROLE_MANAGER = 'ROLE_MANAGER';
// 综合工（前期）：采集 > 运输 > 修理 > 升级 > 建造 脏活累活都干
const ROLE_HARVESTER = 'ROLE_HARVESTER';
// 行为
// 采集
const BEHAVIOR_HARVEST = 'BEHAVIOR_HARVEST';
// 矿物采集
const BEHAVIOR_HARVEST_MINERAL = 'BEHAVIOR_HARVEST_MINERAL';
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
// ROLE_ALL_IN_ONE
const BEHAVIOR_ALL_IN_ONE = 'BEHAVIOR_ALL_IN_ONE';
// 攻击
const BEHAVIOR_ATTACK = 'BEHAVIOR_ATTACK';
// 治疗
const BEHAVIOR_HEAL = 'BEHAVIOR_HEAL';
// 预定
const BEHAVIOR_RESERVE = 'BEHAVIOR_RESERVE';
// 占领
const BEHAVIOR_CLAIM = 'BEHAVIOR_CLAIM';

let creepList = []

const createCreep = {
  loop(Room) {
    // 获取房间内所有空闲的spawn
    const spawns = Room.find(FIND_MY_SPAWNS, {
      filter: (spawn) => {
        return !spawn.spawning;
      }
    });
    if(spawns.length < Room.find(FIND_MY_SPAWNS).length) {
      return
    }

    // 如果有空闲的spawn
    if (spawns.length > 0) {
      creepList = []
      // 获取Game中creep并转数组
      for (const key in Game.creeps) {
        creepList.push(Game.creeps[key])
      }
      if (emergency(Room, spawns[0]) === 'create') {
        return
      }
      switch (Room.controller.level) {
        case 8:
        case 7:
        case 6:
          createCreepForRCL6(Room, spawns[0]);
          break;
        case 5:
        case 4:
          createCreepForRCL4(Room, spawns[0]);
          break;
        case 3:
        case 2:
          createCreepForRCL2(Room, spawns[0]);
          break;
        case 1:
          createCreepForRCL1(Room, spawns[0]);
          break;
      }
    }
  }
}

// 六级房间
function createCreepForRCL6(Room, spawn) {
  if (createCreepForRCL4(Room, spawn) === 'create') {
    return 'create'
  }
  // TODO 支持其它房间
  // 这时候创建综合矿工
  // 判断房间内是否建造了extractor
  if (Room.find(FIND_MY_STRUCTURES, {
    filter: (structure) => {
      // 矿物不为空
      return structure.structureType === STRUCTURE_EXTRACTOR && structure.pos.lookFor(LOOK_MINERALS)[0].mineralAmount > 0
    }
  }).length > 0) {
    // 矿物采集
    const mineralHarvesterNum = creepList.filter((creep) => {
      return creep.memory.role === ROLE_WORKER && creep.memory.behavior === BEHAVIOR_HARVEST_MINERAL
    })
    if (mineralHarvesterNum.length < 1) {
      // 派个采集者过去
      const body = Game.Config.creep.generateInitialWorker(Room, false);
      const name = 'TouchFish_矿工' + Game.time;
      const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST_MINERAL } };
      // 创造creep
      GenerateCreep(Room, spawn, body, name, config);
      return 'create';
    }
  }
}

// 四级房间
function createCreepForRCL4(Room, spawn) {
  if (createCreepForRCL2(Room, spawn) === 'create') {
    return 'create'
  }
  // 四级了如果有Storge就需要有分配者
  if (Room.storage) {
    // 获取房间内的分配者数量
    const assignNum = Room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        return creep.memory.role === ROLE_ASSIGN;
      }
    }).length;
    // 如果分配者数量小于1
    if (assignNum < 2) {
      // 创建分配者
      const body = Game.Config.creep.generateTransporter(Room);
      const name = 'TouchFish_分配' + Game.time;
      const config = { memory: { role: ROLE_ASSIGN, behavior: BEHAVIOR_ASSIGN } };
      // 创造creep
      GenerateCreep(Room, spawn, body, name, config);
      return 'create'
    }
  }
  return 'no-create'
}

// 二级可以发展外矿了
function createCreepForRCL2(Room, spawn) {
  if (createCreepForRCL1(Room, spawn) === 'create') {
    return 'create'
  }
  const CreepList = []
  // 遍历 Game.creeps
  for (let name in Game.creeps) {
    CreepList.push(Game.creeps[name]);
  }

  // 创建破烂工ROLE_GOBLIN
  if (Room.memory.CollectTask && Room.memory.CollectTask.length > 0) {
    // 如果 ROLE_GOBLIN 的工人数量小于 Room.CollectTask.length / 3
    if (creepList.filter(creep => creep.memory.role === ROLE_GOBLIN).length < (Room.memory.CollectTask.length / 3 ? Room.memory.CollectTask.length / 3 : 1)) {
      // 派个运输者过去
      const body = Game.Config.creep.generateTransporter(Room, false);
      const name = 'TouchFish_运输' + '【哥布林】' + Game.time;
      const config = { memory: { role: ROLE_GOBLIN, behavior: BEHAVIOR_TRANSPORT } };
      // 创造creep
      GenerateCreep(Room, spawn, body, name, config);
      return 'create';
    }
  }

  // 外矿房间列表
  const externalRoomList = Room.memory.OutRoom || [];
  // 遍历外矿房间列表
  for (let i = 0; i < externalRoomList.length; i++) {
    // 外矿房间
    const externalRoom = Game.rooms[externalRoomList[i]];
    // 如果外矿房间没有视野
    if (!externalRoom) {
      // 查询是否有绑定该房间的creep
      const creep = CreepList.filter((creep) => {
        return creep.memory.bindRoom == externalRoomList[i];
      });
      // 如果没有绑定该房间的creep
      if (creep.length < 1) {
        // 如果房间内的扩展数量大于等与5
        if (Room.find(FIND_MY_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType == STRUCTURE_EXTENSION;
          }
        }).length >= 5) {
          // 派个一体机过去探路
          const body = Game.Config.creep.generateAllInOne(Room, false);
          const name = 'TouchFish_一体机' + '【' + externalRoomList[i] + '】' + Game.time;
          const config = { memory: { role: ROLE_ALL_IN_ONE, behavior: BEHAVIOR_ALL_IN_ONE, bindRoom: externalRoomList[i] } };
          // 创造creep
          GenerateCreep(Room, spawn, body, name, config);
          return 'create';
        } else {
          // 派个攻击者过去探路
          const body = [ATTACK, ATTACK, MOVE, MOVE];
          const name = 'TouchFish_攻击' + '【' + externalRoomList[i] + '】' + Game.time;
          const config = { memory: { role: ROLE_ALL_IN_ONE, behavior: BEHAVIOR_ALL_IN_ONE, bindRoom: externalRoomList[i] } };
          // 创造creep
          GenerateCreep(Room, spawn, body, name, config);
          return 'create';
        }
      }
    } else if (externalRoom) {
      // 按照规格创建creep
      // 如果敌人数量大于0且没有一体机
      // 获取该房间内的一体机数量
      const allInOneNum = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_ALL_IN_ONE && creep.memory.bindRoom == externalRoomList[i];
      }).length;
      // 如果没有一体机
      if (allInOneNum == 0) {
        // 派个一体机过去
        const body = Game.Config.creep.generateAllInOne(Room, false);
        const name = 'TouchFish_一体机' + '【' + externalRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_ALL_IN_ONE, behavior: BEHAVIOR_ALL_IN_ONE, bindRoom: externalRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
      }
      // 如果该房间被预定
      if (externalRoom.controller && externalRoom.controller.my === false && Room.energyCapacityAvailable >= 1300) {
        // 获取该房间管理者
        const manager = CreepList.filter((creep) => {
          return creep.memory.role == ROLE_MANAGER && creep.memory.bindRoom == externalRoom.name;
        });
        // 如果没有管理者
        if (manager.length === 0) {
          // 派个管理者过去
          const body = Game.Config.creep.generateManager(Room, false);
          const name = 'TouchFish_管理' + '【' + externalRoomList[i] + '】' + Game.time;
          const config = { memory: { role: ROLE_MANAGER, behavior: BEHAVIOR_RESERVE, bindRoom: externalRoomList[i] } };
          // 创造creep
          GenerateCreep(Room, spawn, body, name, config);
          return 'create';
        }
      }
      // 如果发现haveInvaderCore就多派一个一体机
      if (Game.time - externalRoom.memory.haveInvaderCore < 2000 && allInOneNum < 2) {
        // 派个一体机过去探路
        const body = Game.Config.creep.generateAllInOne(Room, false);
        const name = 'TouchFish_一体机' + '【' + externalRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_ALL_IN_ONE, behavior: BEHAVIOR_ALL_IN_ONE, bindRoom: externalRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
      }
      // 获取该房间内的采集者数量
      const workerNum = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_WORKER && creep.memory.bindRoom == externalRoomList[i];
      });
      // 如果采集者数量小于1
      if (workerNum.length < 1) {
        // 派个采集者过去
        const body = Game.Config.creep.generateHarvester(Room, false);
        const name = 'TouchFish_采集' + '【' + externalRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST, bindRoom: externalRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
      }
      // 获取该房间内的运输者数量
      const transporterNum = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_TRANSPORTER && creep.memory.bindRoom == externalRoomList[i];
      })
      // 如果运输者数量小于采集者
      if (transporterNum.length < workerNum.length) {
        // 派个运输者过去
        const body = Game.Config.creep.generateTransporter(Room, false);
        const name = 'TouchFish_运输' + '【' + externalRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT, bindRoom: externalRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
      }
      // 根据source数量创建采集者
      const source = externalRoom.find(FIND_SOURCES);
      // 如果采集者数量小于source数量
      if (workerNum.length < source.length) {
        // 派个采集者过去
        const body = Game.Config.creep.generateHarvester(Room, false);
        const name = 'TouchFish_采集' + '【' + externalRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST, bindRoom: externalRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
      }
      // 如果该房间有控制器
      if (externalRoom.controller && Room.energyCapacityAvailable >= 1300) {
        // 获取该房间管理者
        const manager = CreepList.filter((creep) => {
          return creep.memory.role == ROLE_MANAGER && creep.memory.bindRoom == externalRoom.name;
        });
        // 如果没有管理者
        if (manager.length === 0) {
          // 派个管理者过去
          const body = Game.Config.creep.generateManager(Room, false);
          const name = 'TouchFish_管理' + '【' + externalRoomList[i] + '】' + Game.time;
          const config = { memory: { role: ROLE_MANAGER, behavior: BEHAVIOR_RESERVE, bindRoom: externalRoomList[i] } };
          // 创造creep
          GenerateCreep(Room, spawn, body, name, config);
          return 'create';
        }
      }
    }
  }

  // 获取待占领房间
  const PreRoomList = Memory.PreRoom;
  if (Room.energyCapacityAvailable >= 1300 && PreRoomList) {
    for (let i = 0; i < PreRoomList.length; i++) {
      // 获取该房间内的一体机数量
      const allInOneNum = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_ALL_IN_ONE && creep.memory.bindRoom == PreRoomList[i];
      }).length;
      // 如果没有一体机
      if (allInOneNum == 0) {
        // 派个一体机过去
        const body = Game.Config.creep.generateAllInOne(Room, false);
        const name = 'TouchFish_一体机' + '【' + PreRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_ALL_IN_ONE, behavior: BEHAVIOR_ALL_IN_ONE, bindRoom: PreRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
      }
      // 获取该房间管理者数量
      const managerNum = CreepList.filter((creep) => {
        return creep.memory.role == ROLE_MANAGER && creep.memory.bindRoom == PreRoomList[i];
      })
      // 如果管理者数量小于待占领房间数量
      if (managerNum.length === 0) {
        const body = Game.Config.creep.generateManager(Room, false);
        const name = 'TouchFish_管理' + '【' + PreRoomList[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_MANAGER, behavior: BEHAVIOR_CLAIM, bindRoom: PreRoomList[i] } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create';
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
    const name = 'TouchFish_矿工' + Game.time;
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
  if (transporters.length < needTransporter(Room) + Game.Tools.GetCreepNum(Room, '运输')) {
    // 加急生成运输者
    const body = Game.Config.creep.generateTransporter(Room);
    const name = 'TouchFish_运输' + Game.time;
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
    const name = 'TouchFish_矿工' + Game.time;
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
    const name = 'TouchFish_升级' + Game.time;
    const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_UPGRADE } };
    // 创建升级爬爬
    GenerateCreep(Room, spawn, body, name, config);
    return 'create'
  }
  // 获取房间内工地数量
  const constructionSites = Room.find(FIND_CONSTRUCTION_SITES);
  // 如果工地数量大于0
  if (constructionSites.length > 0) {
    // 获取游戏所有爬
    const builders = []
    for (const key in Game.creeps) {
      if (Game.creeps[key].memory.createRoom == Room.name && Game.creeps[key].memory.behavior == BEHAVIOR_BUILD) {
        builders.push(Game.creeps[key]);
      }
    }
    // 如果建造爬爬数量小于1
    if (builders.length < 2 + Game.Tools.GetCreepNum(Room, '建造')) {
      // 生成建造爬爬
      const body = Game.Config.creep.generateInitialWorker(Room);
      const name = 'TouchFish_建造' + Game.time;
      const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_BUILD } };
      // 创建建造爬爬
      GenerateCreep(Room, spawn, body, name, config);
      return 'create'
    }
  }
  // 获取需要援建的房间
  const HelpBuildRoom = Memory.HelpBuildRoom9|| [];
  // 如果有需要援建的房间
  if (HelpBuildRoom.length > 0) {
    // 遍历
    for (let i = 0; i < HelpBuildRoom.length; i++) {
      if (HelpBuildRoom[i] == Room.name) {
        continue;
      }
      // 判断当前房间是否派发了援建者
      // 获取所有当前房间的建造者绑定了援建房间的
      const HelpBuildCreep = creepList.filter((creep) => {
        return creep.memory.behavior === BEHAVIOR_BUILD && creep.memory.bindRoom === HelpBuildRoom[i] && creep.memory.createRoom === Room.name;
      })
      // 如果没有
      if (HelpBuildCreep.length < 1 + Game.Tools.GetCreepNum(Game.rooms[HelpBuildRoom[i]], '建造')) {
        // 创建建造者
        const body = Game.Config.creep.generateInitialWorker(Room);
        const name = 'TouchFish_建造' + '【' + HelpBuildRoom[i] + '】' + Game.time;
        const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_BUILD, bindRoom: HelpBuildRoom[i], createRoom: Room.name } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create'
      }
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
  // 获取运输者数量
  const transporters = Room.find(FIND_MY_CREEPS, {
    filter: (creep) => {
      return creep.memory.behavior == BEHAVIOR_TRANSPORT;
    }
  });
  // 获取 storage剩余能量
  const storageEnergy = Room.storage ? Room.storage.store.getUsedCapacity(RESOURCE_ENERGY) : 0
  // 如果分配者数量小于2或者storage剩余能量小于10000
  if (assigners.length < 1 || storageEnergy < 10000) {
    // 四级了如果有Storge就需要有分配者
    if (Room.storage) { 
      // 获取房间内的分配者数量
      const assignNum = Room.find(FIND_MY_CREEPS, {
        filter: (creep) => {
          return creep.memory.role === ROLE_ASSIGN;
        }
      }).length;
      // 如果分配者数量小于1
      if (assignNum < 1) {
        // 创建分配者
        const body = Game.Config.creep.generateTransporter(Room, assigners.length<1  );
        const name = 'TouchFish_分配' + Game.time;
        const config = { memory: { role: ROLE_ASSIGN, behavior: BEHAVIOR_ASSIGN } };
        // 创造creep
        GenerateCreep(Room, spawn, body, name, config);
        return 'create'
      }
    }

    // 获取矿工数量
    const workers = Room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        return creep.memory.role == ROLE_WORKER;
      }
    });
    // 如果矿工数量小于1
    if (workers.length < 1) {
      // 生成矿工
      const body = Game.Config.creep.generateHarvester(Room, true);
      const name = 'TouchFish_矿工' + Game.time;
      const config = { memory: { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST } };
      // 创建矿工
      GenerateCreep(Room, spawn, body, name, config);
      return 'create'
    }

    // 如果运输者数量小于1
    if (transporters.length < needTransporter(Room)) {
      // 生成运输者
      const body = Game.Config.creep.generateTransporter(Room, true);
      const name = 'TouchFish_运输' + Game.time;
      const config = { memory: { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT } };
      // 创建运输者
      GenerateCreep(Room, spawn, body, name, config);
      return 'create'
    }
  }
  return 'no-create'
}

// 判断该房间是否需要生成运输者
function needTransporter(Room) {
  let count = 0
  // 如果当前有storage且storage剩余能量大于10000
  if (Room.storage) {
    const otherSourceLinkLenth = Object.keys(Room.memory.otherSourceLink).length
    if (Room.memory.otherSource.length - otherSourceLinkLenth > 0) {
      // 需要生成的数量
      count = Room.memory.otherSource.length - otherSourceLinkLenth
    }
  } else {
    count = Room.memory.otherSource.length
  }
  return count
}

// 接管创建creep，方便控制台输出了解详情
function GenerateCreep(Room, spawn, body, name, config) {
  body = body.slice(0,50)
  config.memory.createRoom = Room.name;
  // 正则移除name后面的数值
  const nameZN = name.replace(/\d+$/, '').replace('TouchFish_', '').replace(/【/g, '[').replace(/】/g, ']');
  // 获取当前爬爬生成需要的能量
  const computedResult = Game.Tools.ComputerCreepCost(body, Room);
  if (computedResult.CanGenerate === true) {
    const SpawnCreateResult = spawn.spawnCreep(body, name, config);
    if (SpawnCreateResult === OK) {
      Memory.log += `<font color='green'>生成成功[${nameZN},${body.length}模块,${computedResult.NeedEnergy} 能量]</font>`
      return true
    } else {
      Memory.log += `<font color='red'>生成失败[${nameZN},${body.length}模块,${computedResult.NeedEnergy} 能量]</font>`
      return false
    }
  } else if (computedResult.CanGenerate === false) {
    Memory.log += `<font color='orange'>将要生成[${nameZN},${body.length}模块,还需 ${computedResult.LackEnergy} 能量]</font>`
    return false
  }
}
module.exports = createCreep;