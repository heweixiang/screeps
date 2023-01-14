/*
  worker规则：
    1、每个房间都有一个creepsWorker，负责该房间的creeps管理
    2、creeps由creeps.js生成，creepsWorker负责工作处理
*/
const behavior = require('behavior');
const roomFind = require('roomFind');

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
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
// 分配
const ROLE_ASSIGN = 'ROLE_ASSIGN';
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


let creepsList = [];

const creepsWorker = (ROOM, spawns, creeps) => {
  creepsList = creeps;
  // creepGroup
  const creepGroup = {}
  creeps.forEach(creep => {
    switch (creep.memory.role) {
      case ROLE_EXTERNALMINE_RESERVER:
        externalmineReserver(ROOM, creep);
        break;
      case ROLE_EXTERNALMINE_HEALER:
        externalmineHealer(ROOM, creep);
        break;
      case ROLE_EXTERNALMINE_ATTACKER:
        externalmineAttacker(ROOM, creep);
        break;
      case ROLE_EXTERNALMINE_WORKER:
        // 外矿矿工
        externalmineWorker(ROOM, creep);
        break;
      case ROLE_EXTERNALMINE_TRANSPORTER:
        // 外矿运输者
        externalmineTransporter(ROOM, creep);
        break;
      case ROLE_WORKER:
        break;
      case ROLE_ASSIGN:
        Assign(ROOM, creep);
        break;
      case ROLE_TRANSPORTER:
        Transport(creep);
        break;
      // 综合工
      case ROLE_HARVESTER:
        RoleHarvesterWorker(ROOM, spawns, creep);
        break;
      default:
        break;
    }
    // creep.name 去除末尾数值和TouchFish_
    const name = creep.name.replace(/\d+$/, '').replace('TouchFish_', '');
    if (typeof creepGroup[name] === 'undefined') {
      creepGroup[name] = 1;
    } else {
      creepGroup[name]++;
    }
  })
  let creepCount = '爬爬数量：';
  for (const key in creepGroup) {
    creepCount += `${key}：${creepGroup[key]}，`;
  }
  creepCount += `总数：${creeps.length}`;
  console.log(creepCount);
}

function RoleHarvesterWorker(ROOM, spawns, creep) {
  // 如果是采集行为
  if (creep.memory.behavior === BEHAVIOR_HARVEST) {
    Harvest(ROOM, creep);
  } else if (creep.memory.behavior === BEHAVIOR_UPGRADE) {
    Upgrade(ROOM, creep);
  } else if (creep.memory.behavior === BEHAVIOR_TRANSPORT) {
    Transport(creep);
  } else if (creep.memory.behavior === BEHAVIOR_BUILD) {
    Building(ROOM, creep);
  } else if (creep.memory.behavior === BEHAVIOR_REPAIR) {
    Repair(ROOM, creep);
  }
}

function externalmineReserver(ROOM, creep) {
  if (externalmineEnter(creep)) {
    // 预定该房间
    const target = creep.room.controller;
    if (target) {
      if (creep.reserveController(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  }
}

// 奶妈负责奶
function externalmineHealer(ROOM, creep) {
  if (externalmineEnter(creep)) {
    // 寻找附近需要治疗的单位
    const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
      filter: (creep) => creep.hits < creep.hitsMax
    });
    if (target) {
      if (creep.heal(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }
    // 如果没有敌人就走到旗子上
    const flag = ROOM.find(FIND_FLAGS, {
      filter: (flag) => true
    })[0];
    if (flag) {
      creep.moveTo(flag.pos.x - 1, flag.pos.y, { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
  }
}

function externalmineAttacker(ROOM, creep) {
  // 战士永不回头
  if (externalmineEnter(creep)) {
    // 寻找附近的敌人
    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (target) {
      if (creep.attack(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }
    // 找到房间内不是自己的extension
    let extension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_EXTENSION && structure.store[RESOURCE_ENERGY] === 0 && !structure.my;
      }
    })
    // 找到墙壁
    // let wall = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    //   filter: (structure) => {
    //     return structure.structureType === STRUCTURE_WALL && !structure.my;
    //   }
    // })
    // // 攻击墙壁
    // if (wall) {
    //   if (creep.attack(wall) === ERR_NOT_IN_RANGE) {
    //     creep.moveTo(wall, { visualizePathStyle: { stroke: '#ffffff' } });
    //   }
    //   return;
    // }
    if (extension) {
      if (creep.attack(extension) === ERR_NOT_IN_RANGE) {
        creep.moveTo(extension, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }
    // 如果没有敌人就走到旗子上
    const flag = ROOM.find(FIND_FLAGS, {
      filter: (flag) => true
    })[0];
    if (flag) {
      creep.moveTo(flag, { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
  }
}



// 外矿矿工 这里调用Harvest而不是由房间自动是因为Role不是为ROLE_HARVESTER
function externalmineWorker(ROOM, creep) {
  if (externalmineEnter(creep)) {
    Harvest(creep.room, creep);
  }
}

// 外矿运输者
function externalmineTransporter(ROOM, creep) {
  if (!creep.memory.isFull) {
    behavior.transportGetEnergy(creep);
  } else if (behavior.ensureCreateRoom(creep) === 'inRoom' && !!creep.memory.isFull) {
    behavior.transportStoreEnergy(creep);
  }
}

function gotoRoom(creep, ROOM) {
  // 如果不在目标房间
  if (creep.room.name !== ROOM.name) {
    // 移动到该房间
    const exitDir = creep.room.findExitTo(ROOM);
    const exit = creep.pos.findClosestByRange(exitDir);
    creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
    return false;
  }
  return true;

}

// 外矿进入房间以及绑定房间，并非外矿工作运行
function externalmineEnter(creep) {
  // 判断是否绑定房间
  if (creep.memory.bindRoom == undefined) {
    // 寻找房间并进入
    // 寻找黄色旗帜 颜色黄色为外矿房间
    let flag = null
    for (const key in Game.flags) {
      let flagx = Game.flags[key];
      // 获取所有外矿矿工
      const externalmineWorker = _.filter(Game.creeps, (creep) => creep.memory.role == ROLE_EXTERNALMINE_WORKER);
      // 是否有绑定该房间的
      const isBind = externalmineWorker.some((creep) => creep.memory.bindRoom == flagx.roomName);
      if (flagx.color == COLOR_YELLOW && isBind) {
        flag = Game.flags[key];
        break;
      }
    }
    // 如果有黄色旗帜
    if (flag) {
      // 绑定房间
      creep.memory.bindRoom = flag.pos.roomName;
      // 进入房间
      creep.moveTo(flag, { visualizePathStyle: { stroke: '#ffaa00' } });
      return false
    }
  } else if (creep.room.name != creep.memory.bindRoom) {
    // 如果不在房间内
    // 进入房间
    creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffaa00' } });
    return false
  } else {
    if (!Memory.externalmineRoom) {
      Memory.externalmineRoom = {};
    }
    // 搜寻Memory.externalmineRoom是否有该房间
    if (!Memory.externalmineRoom[creep.memory.bindRoom]) {
      // 如果没有则创建
      Memory.externalmineRoom[creep.memory.bindRoom] = {
        // 该房间的外矿数量
        sourceCount: creep.room.find(FIND_SOURCES).length,
      }
    }
    return true;
  }
}

// Assign 分配者工作
function Assign(ROOM, creep) {
  // 找到Storage3*3内的link并获取能量
  const link = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
    filter: (structure) => {
      // 查找Storage3*3内的link
      return (structure.structureType === STRUCTURE_LINK) && structure.store[RESOURCE_ENERGY] && structure.pos.inRangeTo(creep.room.storage, 3);
    }
  });
  if (link && creep.carry.energy < creep.carryCapacity) {
    if (creep.withdraw(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(link, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return
  }
  // 如果link还有能量就将能量转移到storage
  if (link && link.store[RESOURCE_ENERGY] > 0) {
    // 存储到Storage
    if (creep.transfer(ROOM.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(ROOM.storage, { visualizePathStyle: { stroke: '#ffaa00' } });
      return
    }
  }
  // 首先获取能量
  if (creep.carry.energy === 0) {
    // 找到最近的Storage
    source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0;
      }
    });
    if (source) {
      if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        // 标记该能量
        creep.memory.energyId = source.id;
      }
      return
    }
    HarvestSourceEnergy(creep, true);
  } else {
    // 获取所有没有被填满的extension
    const extensions = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_EXTENSION) && structure.energy < structure.energyCapacity;
      }
    });
    if (extensions.length > 0) {
      // 如果有extension
      if (creep.transfer(extensions[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(extensions[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return
    }
    // 获取所有没有被填满的spawn
    const spawns = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
      }
    });
    if (spawns.length > 0) {
      // 如果有spawn
      if (creep.transfer(spawns[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(spawns[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return
    }
    // 获取所有没有被填满的tower
    const towers = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
      }
    });
    if (towers.length > 0) {
      // 如果有tower
      if (creep.transfer(towers[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(towers[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return
    }
    // 存储到Storage
    if (creep.transfer(ROOM.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(ROOM.storage, { visualizePathStyle: { stroke: '#ffaa00' } });
      return
    }
  }
}

function Repair(ROOM, creep) {
  // 如果creep的carry没有满
  if (creep && creep.carry.energy === 0) {
    // 每次挖矿就失忆，把东西留给更需要的人
    creep.memory.targetId = null;
    HarvestSourceEnergy(creep, true);
  } else if (creep) {
    // 如果有绑定ID获取该建筑
    if (creep.memory.targetId) {
      const target = Game.getObjectById(creep.memory.targetId);
      // 如果该建筑存在
      if (target) {
        // 如果该建筑血量小于最大血量
        if (target.hits < target.hitsMax) {
          // 如果creep在该建筑附近
          if (creep.pos.isNearTo(target)) {
            // 修理该建筑
            creep.repair(target);
          } else {
            // 否则移动到该建筑附近
            creep.moveTo(target);
          }
        } else {
          // 如果该建筑血量大于最大血量
          // 重置绑定ID
          creep.memory.targetId = null;
        }
      }
    }
    // 寻找附近的需要修理的建筑 墙壁交给塔来维护
    let targets = creep.room.find(FIND_STRUCTURES, {
      filter: object => object.hits < object.hitsMax * 0.5 && object.structureType !== STRUCTURE_WALL
    });
    if (targets.length === 0) {
      targets = creep.room.find(FIND_STRUCTURES, {
        filter: object => object.hits < object.hitsMax * 0.85 && object.structureType !== STRUCTURE_WALL
      });
    }
    // 排序最后维护墙壁
    targets = _.sortBy(targets, (target) => {
      if (target.structureType === STRUCTURE_WALL) {
        return 1;
      } else {
        return 0;
      }
    });
    // 按血量最少在最前面 
    targets = _.sortBy(targets, (target) => {
      return target.hits;
    });

    if (targets.length) {
      // 如果有需要修理的建筑
      // 绑定
      creep.memory.targetId = targets[0].id;
      if (creep.repair(targets[0]) === ERR_NOT_IN_RANGE) {
        creep.say('🛠️');
        creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      Transport(creep);
    }
  }
}

// 普通运输者不需要房间判断
function Transport(creep) {
  if (creep && creep.memory.isFull) {
    behavior.transportStoreEnergy(creep);
  } else if (behavior.transportGetEnergy(creep) === 'full') {
    behavior.transportStoreEnergy(creep);
  }
}

function Building(ROOM, creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy === 0) {
    HarvestSourceEnergy(creep, false);
  } else {
    // 寻找附近工地 
    let targets = creep.room.find(FIND_CONSTRUCTION_SITES)
    // 排序优先extension
    targets = _.sortBy(targets, (target) => {
      if (target.structureType === STRUCTURE_EXTENSION) {
        return 1
      } else {
        return 2
      }
    })
    if (targets.length) {
      if (creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
        creep.say('🚧');
        creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      // 查找需要修理的建筑
      const targets = creep.room.find(FIND_STRUCTURES, {
        filter: object => object.hits < object.hitsMax * 0.5 && object.structureType !== STRUCTURE_WALL
      });
      if (targets.length) {
        // 修理
        Repair(ROOM, creep);
      } else {
        // 如果没有工地，和修理就去升级
        Upgrade(ROOM, creep);
      }
    }
  }
}

function Upgrade(ROOM, creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy === 0) {
    // 如果没有container
    // 查找Storage,如果有则LV4注意需要创建一个分配者
    const storage = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0;
      }
    });
    // 如果有Storage
    if (storage.length > 0) {
      // 从Storage中取出能量
      if (creep.withdraw(storage[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🚚');
        creep.moveTo(storage[0], {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }
      return
    }
    HarvestSourceEnergy(creep, true);
  } else if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
    delete creep.memory.energyId;
    creep.say('⏏️');
    creep.moveTo(creep.room.controller);
  }
}

// 获取能量，不是采集
function HarvestSourceEnergy(creep, urgent = false) {
  // 如果标记了能量
  if (creep.memory.energyId) {
    // 获取标记的能量
    const source = Game.getObjectById(creep.memory.energyId);
    // 如果能量存在且能量不为0
    if (source && source.amount > 0) {
      // 拾取能量
      if (creep.withdraw(source) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      } else if (creep.pickup(source) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return
    }
    // 如果能量不存在或者能量为0，就删除标记
    delete creep.memory.energyId;
  }

  // 如果加急就直接找最近可用能量
  if (urgent) {
    // 找到最近的散落的能量
    let energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: (resource) => {
        return resource.resourceType === RESOURCE_ENERGY;
      }
    });
    // 
    if (energy) {
      if (creep.pickup(energy) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(energy, { visualizePathStyle: { stroke: '#ffaa00' } });
        // 标记该能量
        creep.memory.energyId = energy.id;
      }
      return
    }

    // 找到最近的Storage
    let storage = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0;
      }
    })
    if (storage) {
      if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
        // 标记该能量
        creep.memory.energyId = storage.id;
      }
      return
    }

    // 找到最近的Container
    let container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
      }
    })
    if (container) {
      if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🔍');
        creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
        // 标记该能量
        creep.memory.energyId = container.id;
      }
      return
    }
  }

  // 找到附近的废墟,兼容废墟
  let source = creep.pos.findClosestByPath(FIND_RUINS, {
    filter: (ruin) => {
      return ruin.store[RESOURCE_ENERGY] > 0;
    }
  });
  if (source) {
    if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      // 标记该能量
      creep.memory.energyId = source.id;
    }
    return
  }

  // 找到最近的散落的能量
  source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
  if (source) {
    if (creep.pickup(source) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      // 标记该能量
      creep.memory.energyId = source.id;
    }
    return
  }
  // 找到最近的Container
  source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType === STRUCTURE_CONTAINER) && structure.store[RESOURCE_ENERGY] > 0;
    }
  });
  if (source) {
    if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      // 标记该能量
      creep.memory.energyId = source.id;
    }
    return
  }
  // 找到最近的Storage
  source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType === STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0;
    }
  });
  if (source) {
    if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      // 标记该能量
      creep.memory.energyId = source.id;
    }
    return
  }

  // 找到房间内不是自己的extension
  let extension = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType === STRUCTURE_EXTENSION && structure.store[RESOURCE_ENERGY] > 0 && !structure.my;
    }
  })
  if (extension) {
    if (creep.withdraw(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.say('🔍');
      creep.moveTo(extension, { visualizePathStyle: { stroke: '#ffaa00' } });
      // 标记该能量
      creep.memory.energyId = extension
    }
    return
  }
}

// 纯采集者只上岗不下岗
function Harvest(ROOM, creep) {
  // 获取当前标记的sourceId
  const sourceId = creep.memory.sourceId;
  // 获取上岗标记
  const TakeUp = creep.memory.TakeUp;
  // 如果有上岗标记
  if (TakeUp) {
    // 如果有sourceId
    if (sourceId) {
      // 获取source
      const source = Game.getObjectById(sourceId);
      // 这么做因为对穿会把矿工对穿了需要返岗
      // 找到source3*3范围内的container
      const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_CONTAINER;
        }
      });
      // 如果container存在
      if (container.length) {
        // 如果不是在container上
        if (!creep.pos.isEqualTo(container[0].pos)) {
          creep.say('⛑️');
          // 移动到container上
          creep.moveTo(container[0], { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
          // 标记上岗，悲催的一生开始了，且没法结束
          creep.memory.TakeUp = true;
          creep.harvest(source);
        }
      } else {
        // 找到source3*3范围内的工地
        const constructionSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
        // 如果工地存在
        if (constructionSite.length) {
          // 如果不是在工地上
          if (!creep.pos.isEqualTo(constructionSite[0].pos)) {
            creep.say('⛑️');
            // 移动到工地上
            creep.moveTo(constructionSite[0], { visualizePathStyle: { stroke: '#ffffff' } });
          } else {
            // 标记上岗，悲催的一生开始了，且没法结束
            creep.memory.TakeUp = true;
            creep.harvest(source);
          }
        }
      }
      // 当前source的能量剩余
      const energy = source.energy;
      // 如果当前source的能量剩余大于0
      if (energy > 0) {
        creep.harvest(source);
      } else {
        // 如果当前坐标是工地
        if (creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
          // 如果carry没有满
          if (creep.carry.energy === 0) {
            // 获取脚下的能量
            const energy = creep.pos.lookFor(LOOK_ENERGY);
            // 如果脚下有能量
            if (energy.length) {
              // 拾取能量
              creep.pickup(energy[0]);
            } else {
              // 建造
              creep.build(creep.pos.lookFor(LOOK_CONSTRUCTION_SITES)[0]);
            }
          } else {
            // 建造
            creep.build(creep.pos.lookFor(LOOK_CONSTRUCTION_SITES)[0]);
          }
          // 如果是container
        } else {
          // 如果旁边有link则填充link
          const link = creep.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (structure) => {

              return structure.structureType === STRUCTURE_LINK;
            }
          });
          if (link.length) {
            if (creep.transfer(link[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
              creep.moveTo(link[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
          } else {
            // 如果carry没有满
            if (creep.carry.energy === 0) {
              // 获取脚下的能量
              const energy = creep.pos.lookFor(LOOK_ENERGY);
              // 如果脚下有能量
              if (energy.length) {
                // 拾取能量
                creep.pickup(energy[0]);
              } else {
                // 获取脚下的container
                const container = creep.pos.lookFor(LOOK_STRUCTURES);
                // 如果脚下有container
                if (container.length) {
                  // 如果container的能量大于0
                  if (container[0].store.energy > 0) {
                    // 从container中取出能量
                    creep.withdraw(container[0], RESOURCE_ENERGY);
                  }
                }
              }
            }
          }
          // 获取脚下的container
          const container = creep.pos.lookFor(LOOK_STRUCTURES).filter(structure => structure.structureType === STRUCTURE_CONTAINER);
          // 如果脚下有container
          if (container.length) {
            // 如果是container血量小于80%
            if (container[0].hits < container[0].hitsMax * 0.8) {
              // 从container中取出能量并且修理
              creep.withdraw(container[0], RESOURCE_ENERGY);
              creep.repair(container[0]);
            }
          }
        }
      }
      return
    }
  }

  // 如果有标记
  if (sourceId) {
    const source = Game.getObjectById(sourceId);
    // 如果source
    if (source && source.energy > 0) {
      // 找到source3*3范围内的container
      const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_CONTAINER;
        }
      });
      // 如果container存在
      if (container.length) {
        // 如果不是在container上
        if (!creep.pos.isEqualTo(container[0].pos)) {
          creep.say('⛑️');
          // 移动到container上
          creep.moveTo(container[0], { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
          // 标记上岗，悲催的一生开始了，且没法结束
          creep.memory.TakeUp = true;
          creep.harvest(source);
        }
      } else {
        // 找到source3*3范围内的工地
        const constructionSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
        // 如果工地存在
        if (constructionSite.length) {
          // 如果不是在工地上
          if (!creep.pos.isEqualTo(constructionSite[0].pos)) {
            creep.say('⛑️');
            // 移动到工地上
            creep.moveTo(constructionSite[0], { visualizePathStyle: { stroke: '#ffffff' } });
          } else {
            // 标记上岗，悲催的一生开始了，且没法结束
            creep.memory.TakeUp = true;
            creep.harvest(source);
          }
        }
      }
    }
  } else {
    // 查找没有被标记的source
    const source = creep.pos.findClosestByPath(FIND_SOURCES, {
      filter: (source) => {
        // 遍历creepsList查找是否被标记过
        for (let i = 0; i < creepsList.length; i++) {
          if (creepsList[i].memory.sourceId === source.id) {
            return false
          }
        }
        return true;
      }
    });
    // 如果找到了
    if (source) {
      // 标记sourceId
      creep.memory.sourceId = source.id;
      // 找到并维护 creepsList
      creepsList = creepsList.map(x => {
        if (x.name === creep.name) {
          x.memory.sourceId = source.id;
        }
        return x
      })
      // 移动到source上
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }
}





module.exports = creepsWorker;