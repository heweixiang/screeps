// 这里主管creep运转，无害的工作者
const creepBehavior = require('creepBehavior');
const roomFind = require('roomFind');

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
// 分配
const ROLE_ASSIGN = 'ROLE_ASSIGN';
// 一体机 供外矿使用
const ROLE_ALL_IN_ONE = 'ROLE_ALL_IN_ONE';
// 管理者
const ROLE_MANAGER = 'ROLE_MANAGER';
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
// 占领
const BEHAVIOR_CLAIM = 'BEHAVIOR_CLAIM';

const creepWrok = {
  loop(creep) {
    creep.forEach(creep => {
      switch (creep.memory.role) {
        // 一体机
        case ROLE_ALL_IN_ONE:
          this.allInOne(creep);
          break;
        // 管理者
        case ROLE_MANAGER:
          this.manager(creep);
          break;
        // 综合工
        case ROLE_HARVESTER:
          this.roleHarvesterd(creep);
          break;
        // 矿工
        case ROLE_WORKER:
          this.worker(creep);
          break;
        case ROLE_TRANSPORTER:
          this.transporter(creep);
          break;
        // 分配者
        case ROLE_ASSIGN:
          this.assign(creep);
          break;
      }
    });
  },
  // 一体机
  allInOne(creep) {
    // 先判断是否在绑定房间内
    if (creep.room.name !== creep.memory.bindRoom) {
      // 不在绑定房间内则移动到绑定房间
      creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    // 非战斗状态下5tick检测一次
    if (creep.memory.isFighting || creep.ticksToLive % 5 === 0) {
      // 获取较近的敌人
      const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      // 判断敌人是否在视野内
      if (target) {
        // 标记为战斗状态
        creep.memory.isFighting = true;
        // 有敌人则远程攻击
        if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
          // 不在攻击范围内则移动
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        // 本身body是否损坏
        if (creep.hits < creep.hitsMax) {
          // 损坏则治疗
          creep.heal(creep);
        }
      } else {
        // 没有敌人则判断是否为战斗状态
        if (creep.memory.isFighting) {
          // 是则切换为非战斗状态
          creep.memory.isFighting = false;
        }
        // 获取己方需要治疗的creep
        const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
          filter: creep => creep.hits < creep.hitsMax
        });
        // 判断是否有需要治疗的creep
        if (target) {
          // 有则治疗
          if (creep.heal(target) === ERR_NOT_IN_RANGE) {
            // 不在治疗范围内则移动
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
          }
        } else {
          // 到中间
          creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }
  },
  // 房间管理者
  manager(creep) {
    // 判断是否修改过房间标签，如果没有则修改
    if (creep.room.memory.roomTypeIsUpdate === undefined || creep.room.memory.roomTypeIsUpdate === false) {
      // 到controller附近
      if (creep.pos.getRangeTo(creep.room.controller) > 1) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        return;
      }
      // 修改房间标签
      const roomType = Game.Config.RoomType
      creep.room.memory.roomType = roomType;
      creep.room.memory.roomTypeIsUpdate = true;
    }
    // 是否在绑定房间
    if (creep.memory.bindRoom !== creep.room.name) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom));
      return;
    }
    // 走到控制器旁边
    if (creep.pos.getRangeTo(creep.room.controller) > 1) {
      creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    // 判断行为
    if (creep.memory.behavior === BEHAVIOR_RESERVE) {
      // 获取预定超期时间
      const reserveTime = creep.room.controller.reservation ? creep.room.controller.reservation.ticksToEnd : 0;
      // 获取当前creep的预定模块数量
      const reserveNum = creep.body.filter((item) => item.type === 'claim').length;
      if (reserveTime < 5000 - reserveNum) {
        // 预定
        const reserveRes = creep.reserveController(creep.room.controller);
        if (reserveRes === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    } else if (creep.memory.behavior === BEHAVIOR_CLAIM && creep.room.controller.my === false) {
      // 获取当前creep的预定模块数量
      const claimNum = creep.body.filter((item) => item.type === 'claim').length;
      if (claimNum > 0) {
        // 占领
        const claimRes = creep.claimController(creep.room.controller);
        if (claimRes === ERR_NOT_IN_RANGE) {
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    } else if (creep.room.controller.my === true && !Room.find(FIND_MY_SPAWNS).length) {
      // 如果没有spawn
      // 在房间中心向右两点创建spawn
      Room.createConstructionSite(Room.memory.center.x + 2, Room.memory.center.y, STRUCTURE_SPAWN);
    }
  },
  assign(creep) {
    // 获取该房间所有分配者
    const assigners = creep.room.find(FIND_MY_CREEPS, {
      filter: (creep) => creep.memory.role === ROLE_ASSIGN
    });
    // 判断当前store标记
    if (creep.memory.store && creep.memory.store === true) {
      // 保证link中是空的
      if (creep.room.memory.storageLink) {
        // 如果storageLink中有能量则存入storage并继续取出
        const storageLink = Game.getObjectById(creep.room.memory.storageLink);
        // 我是否绑定了link
        const isBindLink = creep.room.memory.storageLink && creep.room.memory.storageLink === creep.memory.storageLink;
        if (storageLink && storageLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && isBindLink) {
          // 在旁边
          if (creep.pos.getRangeTo(storageLink) === 1) {
            // 将能量给Storage并修改标记
            const transferRes = creep.transfer(creep.room.storage, RESOURCE_ENERGY);
            if (transferRes === ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.room.storage);
            } else if (transferRes === OK || transferRes === ERR_NOT_ENOUGH_RESOURCES) {
              creep.memory.store = false;
            }
            return 'transfer';
          }
        }
      }
      let filltarget = null
      if (creep.memory.filltarget) {
        filltarget = Game.getObjectById(creep.memory.filltarget)
        if (filltarget === null) {
          creep.memory.filltarget = null
        }
        if (filltarget && filltarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
          creep.memory.filltarget = null
          filltarget = null
        }
      }
      if (filltarget === null) {
        // 获取该房间tower
        const towers = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 500 && assigners.filter((assigner) => assigner.memory.filltarget === structure.id).length === 0;
          }
        });
        if (towers.length > 0) {
          filltarget = creep.pos.findClosestByRange(towers);
        }
      }
      if (filltarget === null) {
        // extensions
        const extensions = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_EXTENSION && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && assigners.filter((assigner) => assigner.memory.filltarget === structure.id).length === 0;
          }
        });
        if (extensions.length > 0) {
          filltarget = creep.pos.findClosestByRange(extensions);
        }
      }
      if (filltarget === null) {
        // spawn 
        const spawns = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && assigners.filter((assigner) => assigner.memory.filltarget === structure.id).length === 0;
          }
        });
        if (spawns.length > 0) {
          filltarget = creep.pos.findClosestByRange(spawns);
        }
      }
      if (filltarget === null) {
        // 获取该房间tower
        const towers = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 50 && assigners.filter((assigner) => assigner.memory.filltarget === structure.id).length === 0;
          }
        });
        if (towers.length > 0) {
          filltarget = creep.pos.findClosestByRange(towers);
        }
      }
      if (filltarget === null) {
        // 存储到storage
        if (creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
          filltarget = creep.room.storage;
        }
      }
      // 判断是否有填充目标
      if (filltarget) {
        if (creep.room.storage.id !== filltarget.id) {
          creep.memory.filltarget = filltarget.id
        }
        // 填充目标
        const transferRes = creep.transfer(filltarget, RESOURCE_ENERGY);
        if (transferRes === ERR_NOT_IN_RANGE) {
          creep.moveTo(filltarget, { visualizePathStyle: { stroke: '#ffffff' } });
          return 'MOVE';
        } else if (transferRes === ERR_FULL) {
          creep.memory.store = false;
          this.assign(creep);
        } else if (transferRes === ERR_NOT_ENOUGH_RESOURCES) {
          creep.memory.store = false;
          this.assign(creep);
        }
        return 'FILL';
      }
    } else {
      // 保证link中是空的
      if (creep.room.memory.storageLink) {
        // 如果storageLink中有能量则从storageLink中取出
        const storageLink = Game.getObjectById(creep.room.memory.storageLink);
        if (storageLink && storageLink.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
          // 所有分配爬爬有没有绑定了StorageLink
          const assignCreeps = assigners.filter(creep => creep.memory.storageLink === creep.room.memory.storageLink);
          // 绑定storageLink
          if (assignCreeps.length === 0) {
            creep.memory.storageLink = creep.room.memory.storageLink;
          }
          const withdrawRes = creep.withdraw(storageLink, RESOURCE_ENERGY)
          if (withdrawRes === ERR_NOT_IN_RANGE) {
            creep.moveTo(storageLink, { visualizePathStyle: { stroke: '#ffffff' } });
          } else if (withdrawRes === ERR_FULL) {
            creep.memory.store = true;
          }
          return 'WITHDRAW';
        }
      }
      let withdrawTarget = null;
      if (creep.memory.withdrawTarget) {
        withdrawTarget = Game.getObjectById(creep.memory.withdrawTarget);
        if (withdrawTarget && withdrawTarget.store && withdrawTarget.store.getUsedCapacity(RESOURCE_ENERGY) === 0 || withdrawTarget && withdrawTarget.energy && withdrawTarget.energy === 0) {
          withdrawTarget = null;
        }
      }
      if (withdrawTarget === null) {
        // tombstone
        const tombstones = creep.room.find(FIND_TOMBSTONES, {
          filter: (tombstone) => {
            return tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 50 && assigners.filter(creep => creep.memory.withdrawTarget === tombstone.id).length === 0;
          }
        });
        if (tombstones.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(tombstones);
        }
      }
      if (withdrawTarget === null) {
        // 废墟
        const ruins = creep.room.find(FIND_RUINS, {
          filter: (ruin) => {
            return ruin.store.getUsedCapacity(RESOURCE_ENERGY) > 50 && assigners.filter(creep => creep.memory.withdrawTarget === ruin.id).length === 0;
          }
        });
        if (ruins.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(ruins);
        }
      }
      if (withdrawTarget === null) {
        // 获取散落的没被标记的能量
        const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
          filter: (resource) => {
            return resource.resourceType === RESOURCE_ENERGY && resource.amount > 50 && assigners.filter(creep => creep.memory.withdrawTarget === resource.id).length === 0;
          }
        });
        if (droppedEnergy.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(droppedEnergy);
        }
      }
      if (withdrawTarget === null) {
        // container
        const containers = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 50 && assigners.filter(creep => creep.memory.withdrawTarget === structure.id).length === 0;
          }
        });
        if (containers.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(containers);
        }
      }
      if (withdrawTarget === null) {
        withdrawTarget = creep.room.storage;
      } else if (creep.room.storage.id !== creep.memory.withdrawTarget) {
        creep.memory.withdrawTarget = withdrawTarget.id;
      }
      // 从storage中取出资源
      let withdrawRes = creep.withdraw(withdrawTarget, RESOURCE_ENERGY)
      if (withdrawRes === ERR_INVALID_TARGET) {
        withdrawRes = creep.pickup(withdrawTarget, RESOURCE_ENERGY)
      }
      if (withdrawRes === ERR_NOT_IN_RANGE) {
        creep.moveTo(withdrawTarget, { visualizePathStyle: { stroke: '#ffffff' } });
      } else if (withdrawRes === ERR_FULL) {
        creep.memory.store = true;
        this.assign(creep);
      }
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
    // 判断是否在工作房间
    if (creep.memory.bindRoom && creep.room.name !== creep.memory.bindRoom) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    // 矿工行为分为三种
    // 1.采集
    // 2.如果矿没了就检查脚底下是否存在container，如果不存在就建造
    // 3.如果矿没了且有container就扫描3*3范围内的link并将container中的资源转移到link中，同时获取地上的资源
    // 获取该房间内所有creep
    if (creepBehavior.miner(creep) == 'MOVE_TO') {
      return;
    }
    // TODO 需要改成矿工满了就去搞事业，并且如果是本房间矿工就要判断放进link中
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
      let target = null
      // 获取目标,如果有的话
      if (creep.memory.storageTarget) {
        target = Game.getObjectById(creep.memory.storageTarget);
        // 如果目标不存在，就清空目标
        if (!target) {
          creep.memory.storageTarget = null;
        }
        // 如果目标非link且满了，就清空目标
        if (target.structureType !== STRUCTURE_LINK && target.store.getFreeCapacity() === 0) {
          creep.memory.storageTarget = null;
        }
      }
      // 判断是否绑定存储目标，如果新建了link则建成前的creep就暂时不管
      if (target === null) {
        // 这种情况下没有存储目标就只能到创建的房间再进行寻路了
        // 判断是否在创建房间
        if (creep.memory.createRoom && creep.room.name !== creep.memory.createRoom) {
          creep.moveTo(new RoomPosition(25, 25, creep.memory.createRoom), { visualizePathStyle: { stroke: '#ffffff' } });
          return 'moveToCreateRoom';
        }
        // createRoom
        const createRoom = Game.rooms[creep.memory.createRoom];
        // 如果有storage且有空间，就获取storage或者link
        if (createRoom.storage && createRoom.storage.store.getFreeCapacity() > 0) {
          // 获取距离最近的link或者storage
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
              (s.structureType === STRUCTURE_LINK || s.structureType === STRUCTURE_STORAGE)
              && s.id !== createRoom.storageLink && s.room.name === createRoom.name
          });
        }
        // 如果没有storage或者storage满了，就执行填充任务或升级任务
        if (target === null) {
          // 获取该房间需要填充的建筑
          const fillTargetType = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER]
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => fillTargetType.includes(s.structureType) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0,
            algorithm: 'dijkstra'
          });

        }
      }
      // 如果目标存在就运输
      if (target) {
        // 判断爬爬是否在目标附近
        if (creep.pos.isNearTo(target)) {
          // 向目标存储
          const storage = creep.transfer(target, RESOURCE_ENERGY);
          if (storage === OK) {
            return 'store';
          } else if (storage === ERR_FULL) {
            // 如果是link就将link中的能量转移到container中,否则清除找下一个
            if (target.structureType !== STRUCTURE_LINK) {
              creep.memory.storageTarget = null;
            }
          }
        } else {
          // 向目标移动
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
          return 'moveToTarget';
        }
      } else {
        // 到controller附近
        if (creep.pos.getRangeTo(creep.room.controller) > 5) {
          creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
          // 升级
          creep.upgradeController(creep.room.controller);
        }
      }
    } else {
      let target = null
      if (creep.memory.transportId) {
        target = Game.getObjectById(creep.memory.transportId);
      }
      if (target === null || target.store && target.store.getUsedCapacity() === 0) {
        // 判断是否在工作房间
        if (creep.memory.bindRoom && creep.room.name !== creep.memory.bindRoom) {
          creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
          return 'moveToBindRoom';
        }
        if (target === null) {
          // 获取散落的能量
          target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
          });
        }
        // 如果没有散落的能量就获取container
        if (target === null) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity() > 100
          });
        }
        // 如果有资源就去获取
        if (target) {
          // 绑定目标
          creep.memory.transportId = target.id;
        }
      }
      // 如果有资源就去获取
      if (target) {
        if (creep.pos.isNearTo(target)) {
          // 获取获取能量方式
          const getEnergyFunction = target.structureType === STRUCTURE_CONTAINER ? creep.withdraw : creep.pickup;
          const getEnergyResult = getEnergyFunction.call(creep, target, RESOURCE_ENERGY);
          // 没有能量了就清除绑定
          if (getEnergyResult === ERR_NOT_ENOUGH_RESOURCES) {
            creep.memory.transportId = null;
            // 寻找新的资源
            this.transporter(creep);
          } else if (getEnergyResult === ERR_FULL) {
            creep.memory.transportId = null;
            creep.memory.transport = true;
          }
        } else {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
          return 'moveToTarget';
        }
      }
    }
  }
}
module.exports = creepWrok;