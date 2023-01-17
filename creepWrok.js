// 这里主管creep运转，无害的工作者
const creepBehavior = require('creepBehavior');
const roomFind = require('roomFind');

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

const creepWrok = {
  loop(creep) {
    creep.forEach(creep => {
      switch (creep.memory.role) {
        case ROLE_HARVESTER:
          this.roleHarvesterd(creep);
          break;
        case ROLE_WORKER:
          this.worker(creep);
          break;
        case ROLE_TRANSPORTER:
          this.transporter(creep);
          break;
        // 外矿矿工
        case ROLE_EXTERNALMINE_WORKER:
          this.externalMineWorker(creep);
          break;
        // 外矿运输者
        case ROLE_EXTERNALMINE_TRANSPORTER:
          this.externalMineTransporter(creep);
          break;
        // 外矿攻击者
        case ROLE_EXTERNALMINE_ATTACKER:
          this.externalMineAttacker(creep);
          break;
        // 外矿预定者
        case ROLE_EXTERNALMINE_RESERVER:
          this.externalMineReserver(creep);
          break;
        // 分配者
        case ROLE_ASSIGN:
          this.assign(creep);
          break;
      }
    });
  },
  assign(creep) {
  console.log('creep.memory.store && creep.memory.store === true: ', creep.memory.store && creep.memory.store === true);
    // 判断当前store标记
    if (creep.memory.store && creep.memory.store === true) {
    
      let filltarget = ''
      // 填充各种容器
      // 获取该房间extension
      const extensions = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
      });
      if (extensions.length > 0) {
        filltarget = roomFind.contrastPos(creep, extensions)
      } else {
        // 获取该房间spawn
        const spawns = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        if (spawns.length > 0) {
          filltarget = roomFind.contrastPos(creep, spawns)
        } else {
          // 获取该房间tower
          const towers = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
          });
          if (towers.length > 0) {
            filltarget = roomFind.contrastPos(creep, towers)
          }
        }
      }
      // 判断是否有填充目标
      if (filltarget) {
        // 填充目标
        const transferRes = creep.transfer(filltarget, RESOURCE_ENERGY);
        if (transferRes === ERR_NOT_IN_RANGE) {
          creep.moveTo(filltarget, { visualizePathStyle: { stroke: '#ffffff' } });
          return 'MOVE';
        } else if (transferRes === ERR_FULL) {
          creep.memory.store = false;
          this.assign(creep);
        }
        return 'FILL';
      }
    } else {
      // 从storage中取出资源
      const withdrawRes = creep.withdraw(creep.room.storage, RESOURCE_ENERGY)
      console.log('withdrawRes: ', withdrawRes);
      if (withdrawRes === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffffff' } });
      } else if (withdrawRes === ERR_FULL) {
        creep.memory.store = true;
        this.assign(creep);
      }
    }
  },
  // 外矿预定者
  externalMineReserver(creep) {
    // TODO 记得签名
    // 到达指定房间执行保护
    if (creepBehavior.moveToRoom(creep) === 'MOVE_TO') {
      return;
    }
    // 预定
    if (creep.reserveController(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  },
  // 外矿攻击者
  externalMineAttacker(creep) {
    // 到达指定房间执行保护
    if (creepBehavior.moveToRoom(creep) === 'MOVE_TO') {
      return;
    }
    // 获取目标
    let target = creepBehavior.getAttackTarget(creep);
    // 治疗
    let healTarget = creepBehavior.getHealTarget(creep);
    if (target) {
      // 攻击
      if (creep.attack(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else if (healTarget) {
      if (creep.heal(healTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(healTarget, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      // 找到不是自己的建筑工地
      target = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
        filter: s => !s.my
      });
      // 如果有，走上去
      if (target) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      } else {
        // 走到房间中间
        creep.moveTo(25, 25, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    }
  },
  // 外矿运输者
  externalMineTransporter(creep) {
    // 如果满了，状态机切换
    if (creep.store.getFreeCapacity() === 0) {
      // 标记为运输状态
      creep.memory.transport = true;
    } else if (creep.store.getUsedCapacity() === 0) {
      creep.memory.transport = false;
    }
    // 如果运输状态为true就运输到指定位置
    if (creep.memory.transport) {
      // 运输者修补外矿道路
      // 获取血量低于50%的道路
      let target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER) && s.hits < s.hitsMax * 0.5
      });
      // 如果有，就修补
      if (target) {
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
          creep.say("🚧")
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return 'repair'
      }
      // 判断是否在生成房间
      if (creepBehavior.moveToSpawnRoom(creep) === 'MOVE_TO') {
        return;
      }
      // 判断是否绑定存储目标
      if (creep.memory.storageTarget) {
        target = Game.getObjectById(creep.memory.storageTarget);
      } else {
        // 如果没有绑定就获取房间内的storage
        target = creepBehavior.getTransportStore(creep);
      }
      // 如果目标存在就运输
      if (target) {
        const storage = creepBehavior.storeEnergyTo(creep, target);
        if (storage === OK) {
          return 'store';
          // 满了
        } else if (storage === ERR_FULL) {
          // 如果是link就将link中的能量转移到container中,否则清除找下一个
          if (target.structureType !== STRUCTURE_LINK) {
            creep.memory.storageTarget = null;
          }
        }
      } else {
        // 到controller附近
        if (creep.pos.getRangeTo(creep.room.controller) > 3) {
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
          // 丢弃资源
          creep.drop(RESOURCE_ENERGY);
        }
      }
    } else {
      // 判断是否在生成房间
      if (creepBehavior.moveToRoom(creep) === 'MOVE_TO') {
        return;
      }
      let target = null
      if (creep.memory.transportId) {
        target = Game.getObjectById(creep.memory.transportId);
      }
      if (!target) {
        // 获取需要运输的资源
        target = creepBehavior.getTransportEnergy(creep);
        // 如果有资源就去获取
        if (target) {
          // 绑定目标
          creep.memory.transportId = target.id;
        }
      }
      // 如果有资源就去获取
      if (target) {
        const getEnergyResult = creepBehavior.getEnergyFrom(creep, target)
        // 没有能量了就清除绑定
        if (getEnergyResult === ERR_NOT_ENOUGH_RESOURCES) {
          creep.memory.transportId = null;
        } else if (getEnergyResult === ERR_FULL) {
          creep.memory.transportId = null;
          creep.memory.transport = true;
        }
      }
    }
  },
  // 外矿矿工
  externalMineWorker(creep) {
    if (creepBehavior.moveToRoom(creep) === 'IN_ROOM') {
      this.worker(creep);
    }
  },
  // 综合工
  roleHarvesterd(creep) {
    switch (creep.memory.behavior) {
      case BEHAVIOR_UPGRADE:
        creepBehavior.upgrade(creep);
        break;
      case BEHAVIOR_BUILD:
        creepBehavior.build(creep);
        break;
    }
  },
  // 矿工
  worker(creep) {
    // 矿工行为分为三种
    // 1.采集
    // 2.如果矿没了就检查脚底下是否存在container，如果不存在就建造
    // 3.如果矿没了且有container就扫描3*3范围内的link并将container中的资源转移到link中，同时获取地上的资源
    // 获取该房间内所有creep
    if (creepBehavior.miner(creep) == 'MOVE_TO') {
      return;
    }
    if (creepBehavior.miner(creep) === ERR_NOT_ENOUGH_RESOURCES) {
      // 获取脚下的container
      const container = creep.pos.findInRange(FIND_STRUCTURES, 0, {
        filter: structure => structure.structureType === STRUCTURE_CONTAINER
      })[0];
      // 如果container不存在就建造
      const constructionSite = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 0, {
        filter: constructionSite => constructionSite.structureType === STRUCTURE_CONTAINER
      })[0];
      // 获取1*1范围内的link
      const link = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: structure => structure.structureType === STRUCTURE_LINK
      })[0];
      // 地上的能量
      const energy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0];
      if (energy && creep.pickup(energy) !== ERR_FULL) {
        return
      }
      if (container && creep.transfer(container, RESOURCE_ENERGY) !== ERR_FULL) {
        return
      }
      // 如果container存在且血量小于70%就修理
      if (container && container.hits < container.hitsMax * 0.7) {
        creep.repair(container);
        return 'repair';
      } else if (constructionSite) {
        creep.build(constructionSite);
        return 'build';
        // FIEXME: 此处转移只有可能存在问题后续需要修改逻辑
        // 将地上的能量和container中的能量转移到link中
      } else if (link) {
        creepBehavior.transfer(creep, link, RESOURCE_ENERGY);
        return 'transfer';
      }
    }
  },
  // 运输者：一辈子东奔西走运输资源
  transporter(creep) {
    // 如果满了，状态机切换
    if (creep.store.getFreeCapacity() === 0) {
      // 标记为运输状态
      creep.memory.transport = true;
    } else if (creep.store.getUsedCapacity() === 0) {
      creep.memory.transport = false;
    }
    // 如果运输状态为true就运输到指定位置
    if (creep.memory.transport) {
      // 判断是否绑定存储目标
      let target;
      if (creep.memory.storageTarget) {
        target = Game.getObjectById(creep.memory.storageTarget);
      } else {
        // 如果没有绑定就获取房间内的storage
        target = creepBehavior.getTransportStore(creep);
      }
      // 如果目标存在就运输
      if (target) {
        const storage = creepBehavior.storeEnergyTo(creep, target);
        if (storage === OK) {
          return 'store';
          // 满了
        } else if (storage === ERR_FULL) {
          // 如果是link就将link中的能量转移到container中,否则清除找下一个
          if (target.structureType !== STRUCTURE_LINK) {
            creep.memory.storageTarget = null;
          }
        }
      } else {
        // 这时候没有地方存，将能量转移到controller旁边
        creepBehavior.upgrade(creep);
      }
    } else {
      let target = null
      if (creep.memory.transportId) {
        target = Game.getObjectById(creep.memory.transportId);
      }
      if (!target) {
        // 获取需要运输的资源
        target = creepBehavior.getTransportEnergy(creep);
        // 如果有资源就去获取
        if (target) {
          // 绑定目标
          creep.memory.transportId = target.id;
        }
      }
      // 如果有资源就去获取
      if (target) {
        const getEnergyResult = creepBehavior.getEnergyFrom(creep, target)
        // 没有能量了就清除绑定
        if (getEnergyResult === ERR_NOT_ENOUGH_RESOURCES) {
          creep.memory.transportId = null;
        } else if (getEnergyResult === ERR_FULL) {
          creep.memory.transportId = null;
          creep.memory.transport = true;
        }
      }
    }
  }
}
module.exports = creepWrok;