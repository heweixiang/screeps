/*
  worker规则：
    1、每个房间都有一个creepsWorker，负责该房间的creeps管理
    2、creeps由creeps.js生成，creepsWorker负责工作处理
    3、工作者分为：综合工（前期）、采集者、运输者、修理工、建筑工、升级工、战斗工、探索工、治疗工、预备工
    4、综合工（前期）：采集 > 运输 > 修理 > 升级 > 建筑
    5、采集者：采集
    6、运输者：运输
    7、修理工：修理 > 运输
    8、建筑工：建筑 > 运输
    9、升级工：升级
    10、战斗工：战斗 > 防御
    11、探索工：探索（跑）
    12、治疗工：治疗
    13、预备工：预备
*/

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
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

let creepsList = [];

const creepsWorker = (ROOM, spawns, creeps) => {
  creepsList = creeps;
  // creepGroup
  const creepGroup = {}
  creeps.forEach(creep => {
    switch (creep.memory.role) {
      case ROLE_WORKER:
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
  console.log(creepCount);
  // 2、采集者
  // 3、运输者
  // 4、修理工
  // 5、建筑工
  // 6、升级工
  // 7、战斗工
  // 8、探索工
  // 9、治疗工
  // 10、预备工
}

function RoleHarvesterWorker(ROOM, spawns, creep) {
  // 如果是采集行为
  if (creep.memory.behavior === BEHAVIOR_HARVEST) {
    Harvest(creep);
  } else if (creep.memory.behavior === BEHAVIOR_UPGRADE) {
    Upgrade(creep);
  } else if (creep.memory.behavior === BEHAVIOR_TRANSPORT) {
    Transport(creep);
  } else if (creep.memory.behavior === BEHAVIOR_BUILD) {
    Building(creep);
  } else if (creep.memory.behavior === BEHAVIOR_REPAIR) {
    Repair(creep);
  }
}

function Repair(creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy === 0) {
    HarvestSourceEnergy(creep, true);
  } else {
    // 寻找附近的需要修理的建筑
    let targets = creep.room.find(FIND_STRUCTURES, {
      filter: object => object.hits < object.hitsMax * 0.5
    });
    if (targets.length === 0) {
      targets = creep.room.find(FIND_STRUCTURES, {
        filter: object => object.hits < object.hitsMax * 0.85
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
      if (creep.repair(targets[0]) === ERR_NOT_IN_RANGE) {
        creep.say('🛠️');
        creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      Transport(creep);
    }
  }
}

function Transport(creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy === 0) {
    HarvestSourceEnergy(creep);
  } else {
    // // 查找Storage,如果有则LV4注意需要创建一个分配者
    // const storage = creep.room.find(FIND_STRUCTURES, {
    //   filter: (structure) => {
    //     return structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
    //   }
    // });
    // // 如果有Storage
    // if (storage.length > 0) {
    //   // 运输到Storage
    //   if (creep.transfer(storage[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    //     creep.say('🚚');
    //     creep.moveTo(storage[0], {
    //       visualizePathStyle: {
    //         stroke: '#ffffff'
    //       }
    //     });
    //   }
    //   return
    // }
    // 寻找附exits或者spawn的建筑
    const exitsOrSpawnBuildings = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity;
      }
    });
    // 如果有exits建筑
    if (exitsOrSpawnBuildings.length > 0) {
      // 优先运输到exits建筑
      if (creep.transfer(exitsOrSpawnBuildings[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🚚');
        creep.moveTo(exitsOrSpawnBuildings[0], {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }
      return
    }
    // 寻找controller3*3附近的container
    const controllerContainer = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
      }
    });
    // 如果有controllerContainer
    if (controllerContainer.length > 0) {
      // 运输到controllerContainer
      if (creep.transfer(controllerContainer[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🚚');
        creep.moveTo(controllerContainer[0], {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }
      return
    }
    // 寻找controller3*3附近的工地
    const controllerConstructionSite = creep.room.find(FIND_CONSTRUCTION_SITES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER;
      }
    });
    // 如果有controllerConstructionSite
    if (controllerConstructionSite.length > 0) {
      // 判断在不在旁边
      if (creep.pos.isNearTo(controllerConstructionSite[0])) {
        // 在旁边就丢弃能量
        creep.drop(RESOURCE_ENERGY);
      } else {
        // 不在旁边就移动到旁边
        creep.say('🚚');
        creep.moveTo(controllerConstructionSite[0], {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }
      return
    }
    // 移动到controller旁边然后丢弃
    if (creep.pos.isNearTo(creep.room.controller)) {
      creep.say('🚚');
      creep.drop(RESOURCE_ENERGY);
    } else {
      creep.moveTo(creep.room.controller, {
        visualizePathStyle: {
          stroke: '#ffffff'
        }
      });
    }
  }
}

function Building(creep) {
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
        filter: object => object.hits < object.hitsMax
      });
      if (targets.length) {
        // 修理
        Repair(creep);
      } else {
        // 如果没有工地，和修理就去升级
        Upgrade(creep);
      }
    }
  }
}

function Upgrade(creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy === 0) {
    // 查找controller附近的3*3范围内的container
    const container = creep.pos.findInRange(FIND_STRUCTURES, 3, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
      }
    });
    // 如果有container
    if (container.length > 0) {
      // 从container中取出能量
      if (creep.withdraw(container[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.say('🚚');
        creep.moveTo(container[0], {
          visualizePathStyle: {
            stroke: '#ffffff'
          }
        });
      }
      return
    }
    // 如果没有container
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
}

// 纯采集者只上岗不下岗
function Harvest(creep) {
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
      // 维护 creepsList
      creepsList.push(creep);
      // 移动到source上
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }
}





module.exports = creepsWorker;