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
  } else if (creep.memory.behavior === BEHAVIOR_BUILD) {
    Transport(creep);
  }
}

function Transport(creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy < creep.carryCapacity) {
    Harvest(creep);
  } else {
    // 移除标记
    creep.memeory.sourceId = ''
    // 寻找附近工地
    const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length) {
      if (creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
        creep.say('🚧建造');
        creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      // 如果没有工地，就去升级
      Upgrade(creep);
    }
  }
}

function Upgrade(creep) {
  // 如果creep的carry没有满
  if (creep.carry.energy < creep.carryCapacity) {
    Harvest(creep);
  } else if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
    // 移除标记
    creep.memeory.sourceId = ''
    creep.say('🚧升级');
    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function Harvest(creep) {
  // 如果creep的carry满了
  if (creep.carry.energy === creep.carryCapacity) {
    // 移除标记
    creep.memeory.sourceId = ''
    creep.say('🔄存储');
    // 寻找空的extension或者spawn
    const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity;
      }
    });
    // 如果找到了
    if (target) {
      // 将能量运输到目标
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
    }
  } else {
  console.log('creep.memory.sourceId: ', creep.memory.sourceId);
    creep.say('🔄采集');
    // 如果creep的carry没满
    // 查找所有的source中只被creep.memory中标记一次的source
    const source = creep.pos.findClosestByPath(FIND_SOURCES, {
      filter: (source) => {
        // 标记次数
        let count = 0;
        creepsList.forEach(creep => {
          if (creep.memory.sourceId === source.id) {
          
            count++;
          }
        })
        return count < 3;
      }
    });
    // 找到附近的container，container无所谓一般不会堵车
    const container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0;
      }
    });
    // 找到散落的能量
    const energy = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
    // 对比container和energy的距离
    if (container && energy) {
      if (creep.pos.getRangeTo(container) < creep.pos.getRangeTo(energy)) {
        // 如果container更近
        // 如果creep不在container附近
        if (creep.pos.getRangeTo(container) > 1) {
          // 移动到container附近
          creep.moveTo(container);
        } else {
          // 如果creep在container附近
          // 从container中取出能量
          creep.withdraw(container, RESOURCE_ENERGY);
        }
      } else {
        // 如果energy更近
        // 如果creep不在energy附近
        if (creep.pos.getRangeTo(energy) > 1) {
          // 移动到energy附近
          creep.moveTo(energy);
        } else {
          // 如果creep在energy附近
          // 从energy中取出能量
          creep.pickup(energy);
        }
      }
    } else if (container) {
      // 如果只有container
      // 如果creep不在container附近
      if (creep.pos.getRangeTo(container) > 1) {
        // 移动到container附近
        creep.moveTo(container);
      } else {
        // 如果creep在container附近
        // 从container中取出能量
        creep.withdraw(container, RESOURCE_ENERGY);
      }
    } else if (energy) {
      // 如果只有energy
      // 如果creep不在energy附近
      if (creep.pos.getRangeTo(energy) > 1) {
        // 移动到energy附近
        creep.moveTo(energy);
      } else {
        // 如果creep在energy附近
        // 从energy中取出能量
        creep.pickup(energy);
      }
    } else if (creep.memory.sourceId === '' || creep.memory.sourceId === undefined) {
      // 先标记source
      creep.memory.sourceId = source.id;
      // 维护creepsList
      creepsList = creepsList.map(x => {
        if (x.id === creep.id) {
          x.memory.sourceId = source.id;
        }
        return x;
      })
      // 如果container和energy都没有
      // 如果creep不在source附近
      if (creep.pos.getRangeTo(source) > 1) {
        // 移动到source附近
        creep.moveTo(source);
      } else {
        // 如果creep在source附近
        // 从source中取出能量
        creep.harvest(source);
      }
    } else {
      const source = Game.getObjectById(creep.memory.sourceId);
      // 如果creep不在source附近
      if (creep.pos.getRangeTo(source) > 1) {
        // 移动到source附近
        creep.moveTo(source);
      } else {
        // 如果creep在source附近
        // 从source中取出能量
        creep.harvest(source);
      }
    }
  }
}




module.exports = creepsWorker;