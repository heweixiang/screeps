// 这里主管creep运转，无害的工作者
const roomFind = require('roomFind');

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
      try {
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
            switch (creep.memory.behavior) {
              case BEHAVIOR_HARVEST: this.worker(creep); break;
              case BEHAVIOR_HARVEST_MINERAL: this.harvestMineral(creep); break;
            }
            break;
          case ROLE_TRANSPORTER:
            this.transporter(creep);
            break;
          // 分配者
          case ROLE_ASSIGN:
            this.assign(creep);
            break;
          // 哥布林
          case ROLE_GOBLIN:
            this.goblin(creep);
            break;
        }
      } catch (error) {
        console.log('error: ', error);
      }
    });
  },
  // goblin开始接单啦
  goblin(creep) {
    if (!creep.memory.taskId) {
      // 获取第一条未接收的CollectTask
      const task = Game.rooms[creep.memory.createRoom].memory.CollectTask[0]//.filter(task => task.state === 0)[0];
      if (task) {
        creep.memory.taskId = task.taskId;
        task.state = 1;
        task.creepName = creep.name;
      }
    } else {
      // 如果爬爬要是死了，修改任务状态并发起新的任务
      if (creepDie(creep)) {
        const task = Game.rooms[creep.memory.createRoom].memory.CollectTask.find(task => task.taskId === creep.memory.taskId);
        if (task) {
          task.state = 0;
          task.creepName = '';
          creep.memory.taskId = '';
        }
        return;
      }
      if (creep.store.getFreeCapacity() === 0) {
        creep.memory.transfer = true;
      } else if (creep.store.getUsedCapacity() === 0) {
        creep.memory.transfer = false;
      }
      if (creep.memory.transfer) {
        // 回到createRoom房间内
        if (creep.room.name !== creep.memory.createRoom) {
          creep.moveTo(new RoomPosition(25, 25, creep.memory.createRoom));
        } else {
          // 靠近storage
          const storage = creep.room.storage;
          if (storage) {
            if (creep.pos.getRangeTo(storage) > 1) {
              creep.moveTo(storage);
            } else {
              // 将身上所有矿物给storage
              for (const resourceType in creep.store) {
                creep.transfer(storage, resourceType);
              }
            }
          }
        }
      } else {
        // 到达任务地点
        const task = Game.rooms[creep.memory.createRoom].memory.CollectTask.find(task => task.taskId === creep.memory.taskId);
        if (task) {
          // 是否在任务房间
          if (creep.room.name !== task.roomName) {
            creep.moveTo(new RoomPosition(25, 25, task.roomName));
          } else {
            const taskPos = new RoomPosition(task.pos.x, task.pos.y, task.roomName)
            if (creep.pos.isEqualTo(taskPos)) {
              // 判断脚下类型取出所有内容
              let target = creep.pos.lookFor(LOOK_RUINS)[0];
              if (!target) {
                target = creep.pos.lookFor(LOOK_TERRAIN)[0];
              }
              if (!target) {
                target = creep.pos.lookFor(LOOK_TOMBSTONES)[0];
              }
              if (!target) {
                target = creep.pos.lookFor(LOOK_STRUCTURES)[0];
              }

              // 如果是散落能量，直接拾取
              if (target) {
                if (creep.pickup(target) !== OK) {
                  for (const resourceType in target.store) {
                    creep.withdraw(target, resourceType);
                    if (target.store.getUsedCapacity(resourceType) === 0) {
                      Game.rooms[creep.memory.createRoom].memory.CollectTask = Game.rooms[creep.memory.createRoom].memory.CollectTask.filter(task => task.taskId !== creep.memory.taskId);
                    }
                  }
                  // 更新task中的资源数量
                  task.storeCount = target.store.getUsedCapacity();
                } else if (target.energy === 0) {
                  // 如果内容为空删除该任务
                  Game.rooms[creep.memory.createRoom].memory.CollectTask = Game.rooms[creep.memory.createRoom].memory.CollectTask.filter(task => task.taskId !== creep.memory.taskId);
                }
              }
            } else {
              creep.moveTo(taskPos);
              return "MOVE_TO"
            }
          }
        } else {
          // 如果任务不存在，说明任务已经完成，发起新的任务
          creep.memory.taskId = '';
          this.goblin(creep);
        }
      }
    }
  },
  // 矿工
  harvestMineral(creep) {
    if (creep.store.getFreeCapacity() === 0) {
      creep.memory.harvest = false;
    } else if (creep.store.getUsedCapacity() === 0) {
      creep.memory.harvest = true;
    }
    if (creepDie(creep)) return;
    if (creep.memory.harvest) {
      const workRoom = creep.memory.bindRoom ? creep.memory.bindRoom : creep.room.name;
      const extractorPos = new RoomPosition(workRoom.extractor.x, workRoom.extractor.y, workRoom.name);
      // 获取矿物提取器
      let extractor = extractorPos.lookFor(LOOK_STRUCTURES)[0];
      if (extractor) {
        if (creep.pos.getRangeTo(extractor) > 1) {
          creep.moveTo(extractor, { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
          // 获取矿物
          const mineral = extractor.pos.lookFor(LOOK_MINERALS)[0];
          // 在附近则开始采集
          creep.harvest(mineral);
        }
      } else {
        // 没有矿物提取器则移动到矿物提取器位置
        creep.moveTo(extractorPos, { visualizePathStyle: { stroke: '#ffffff' } });
      }
    } else {
      // 将身上所有矿物给storage
      let storage = creep.room.storage;
      if (storage) {
        if (creep.pos.getRangeTo(storage) > 1) {
          creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
          for (let resourceType in creep.store) {
            creep.transfer(storage, resourceType);
          }
        }
      }
    }
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
    if (creep.memory.isFighting || creep.ticksToLive % 10 === 0) {
      // 获取所有敌人
      let targets = creep.room.find(FIND_HOSTILE_CREEPS);
      // 排序先打治疗
      let target = creep.pos.findClosestByRange(targets);
      if (!target) {
        // 获取invadercore
        target = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
          filter: structure => structure.structureType === STRUCTURE_INVADER_CORE
        });
      }
      // 判断敌人是否在视野内
      if (target) {
        // 标记为战斗状态
        creep.memory.isFighting = true;
        // 有敌人则远程攻击
        if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
          // 不在攻击范围内则移动
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        if (creep.memory.isFighting && creep.hits < creep.hitsMax) {
          // 损坏则治疗
          creep.heal(creep);
        }
      } else {
        // 获取己方需要治疗的creep
        const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
          filter: creep => creep.hits < creep.hitsMax
        });
        // 没有敌人则判断是否为战斗状态
        if (creep.memory.isFighting && !target) {
          // 是则切换为非战斗状态
          creep.memory.isFighting = false;
        }
        // 判断是否有需要治疗的creep
        if (target) {
          // 标记为战斗状态
          creep.memory.isFighting = true;
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
      creep.signController(creep.room.controller, Game.Config.RoomType)
      creep.room.memory.roomTypeIsUpdate = true;
    }
    // 获取绑定房间的控制器
    const controller = creep.memory.bindRoom ? Game.rooms[creep.memory.bindRoom] ? Game.rooms[creep.memory.bindRoom].controller : null : creep.room.controller;
    // 走到控制器旁边
    if (controller && creep.pos.getRangeTo(controller) > 1) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    // 是否在绑定房间
    if (creep.memory.bindRoom !== creep.room.name) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom));
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
        } else if (reserveRes === ERR_INVALID_TARGET) {
          creep.attackController(creep.room.controller);
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
        } else if (claimRes === ERR_INVALID_TARGET) {
          creep.attackController(creep.room.controller);
        }
      }
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
      // 如果身上有需要存储的不是能量的
      if (creep.store.getFreeCapacity(RESOURCE_ENERGY) < creep.store.getFreeCapacity()) {
        // 靠近storage
        const storage = creep.room.storage;
        if (storage) {
          if (creep.pos.getRangeTo(storage) > 1) {
            creep.moveTo(storage);
          } else {
            // 将身上所有矿物给storage
            for (const resourceType in creep.store) {
              creep.transfer(storage, resourceType);
            }
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
        if (creep.room.storage && creep.room.storage.id !== filltarget.id) {
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

      // 判断是否有订单
      const activeOrder = creep.room.memory.TerminalTask ? creep.room.memory.TerminalTask.find(x => x.state === 1) : null;
      if (activeOrder) {
        // 优先满足订单
        // 先到terminal旁边
        if (creep.room.terminal && creep.pos.getRangeTo(creep.room.terminal) > 1) {
          creep.moveTo(creep.room.terminal, { visualizePathStyle: { stroke: '#ffffff' } });
          return 'MOVE';
        }
        // 获取终端中该类型的资源
        const terminalResource = creep.room.terminal.store.getUsedCapacity(activeOrder.type);
        // 获取需要的资源数量
        const needAmount = activeOrder.count - terminalResource;
        // 如果需要的资源数量大于0则从storage中取出
        if (needAmount > 0 && creep.store.getUsedCapacity(activeOrder.type) < needAmount && creep.store.getFreeCapacity(activeOrder.type) > 0) {
          // 获取storage中该类型的资源
          const storageResource = creep.room.storage.store.getUsedCapacity(activeOrder.type);
          // 如果storage中的资源大于需要的资源数量则从storage中取出
          if (storageResource >= needAmount) {
            const withdrawRes = creep.withdraw(creep.room.storage, activeOrder.type, needAmount > creep.store.getFreeCapacity(activeOrder.type) ? creep.store.getFreeCapacity(activeOrder.type) : needAmount);
            if (withdrawRes === ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffffff' } });
              return 'MOVE';
            }
          } else {
            // 如果storage中的资源小于需要的资源数量则从storage中取出全部
            const withdrawRes = creep.withdraw(creep.room.storage, activeOrder.type);
            if (withdrawRes === ERR_NOT_IN_RANGE) {
              creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffffff' } });
              return 'MOVE';
            }
          }
          return 'WITHDRAW';
        }
        // 判断路费
        // 如果需要的资源是能量则需要将终端中的能量减去所需的能量
        let terminalEnergy = creep.room.terminal.store.getUsedCapacity(RESOURCE_ENERGY);
        let roadCost = activeOrder.roadCost
        if (activeOrder.type === RESOURCE_ENERGY && terminalEnergy - activeOrder.count < roadCost) {
          // 从storage中取出资源
          const withdrawRes = creep.withdraw(creep.room.storage, RESOURCE_ENERGY, roadCost);
          if (withdrawRes === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffffff' } });
            return 'MOVE';
          }
        }
        // 爬爬身上所有资源转入终端
        for (const resourceType in creep.carry) {
          const transferRes = creep.transfer(creep.room.terminal, resourceType);
          if (transferRes === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.terminal, { visualizePathStyle: { stroke: '#ffffff' } });
            return 'MOVE';
          }
        }
        return 'TRANSFER';
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
            return tombstone.store.getUsedCapacity() > 0 && assigners.filter(creep => creep.memory.withdrawTarget === tombstone.id).length === 0;
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
            return resource.amount > 0 && assigners.filter(creep => creep.memory.withdrawTarget === resource.id).length === 0;
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
        creep.memory.filltarget = null;
        this.assign(creep);
      }
    }
  },
  // 综合工
  roleHarvesterd(creep) {
    switch (creep.memory.behavior) {
      case BEHAVIOR_UPGRADE:
        this.upgrade(creep);
        break;
      case BEHAVIOR_BUILD:
        this.builder(creep);
        break;
    }
  },
  // 升级工
  upgrade(creep) {
    // 判断当前是否有能量
    if (creep.store.getFreeCapacity() === 0) {
      creep.memory.upgrading = true;
    } else if (creep.store.getUsedCapacity() === 0) {
      // 如果是满能量，切换状态
      creep.memory.upgrading = false;
    }
    // 判断是否在工作房间
    if (creep.memory.bindRoom && creep.room.name !== creep.memory.bindRoom) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    if (creep.memory.upgrading === false) {
      creep.memory.dontPullMe = false
      let withdrawTarget = null;
      if (creep.memory.withdrawTarget) {
        withdrawTarget = Game.getObjectById(creep.memory.withdrawTarget);
        if (withdrawTarget && withdrawTarget.store && withdrawTarget.store.getUsedCapacity(RESOURCE_ENERGY) === 0
          || withdrawTarget && withdrawTarget.energy && withdrawTarget.energy === 0
          || withdrawTarget && withdrawTarget.amount && withdrawTarget.amount === 0) {
          withdrawTarget = null;
        }
      }
      // energy
      if (withdrawTarget === null) {
        // tombstone
        const tombstones = creep.room.find(FIND_TOMBSTONES, {
          filter: (tombstone) => {
            return tombstone.store.getUsedCapacity(RESOURCE_ENERGY) > 50
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
            return ruin.store.getUsedCapacity(RESOURCE_ENERGY) > 50
          }
        });
        if (ruins.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(ruins);
        }
      }
      if (withdrawTarget === null) {
        const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
          filter: (resource) => {
            return resource.resourceType === RESOURCE_ENERGY && resource.amount > 50
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
            return structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 50
          }
        });
        if (containers.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(containers);
        }
      }
      if (withdrawTarget === null) {
        // storage
        const storages = creep.room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_STORAGE && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 10000
          }
        });
        if (storages.length > 0) {
          withdrawTarget = creep.pos.findClosestByRange(storages);
        }
      }
      if (withdrawTarget) {
        creep.memory.withdrawTarget = withdrawTarget.id;
        let withdrawRes = creep.withdraw(withdrawTarget, RESOURCE_ENERGY);
        if (withdrawRes === ERR_INVALID_TARGET) {
          withdrawRes = creep.pickup(withdrawTarget, RESOURCE_ENERGY)
        }
        if (withdrawRes === ERR_NOT_IN_RANGE) {
          creep.moveTo(withdrawTarget, { visualizePathStyle: { stroke: '#ffffff' } });
        } else if (withdrawRes === ERR_FULL) {
          creep.memory.upgrading = true;
          creep.memory.withdrawTarget = null;
          this.upgrade(creep);
        }
      } else {
        // 自己挖矿
        const sources = creep.room.find(FIND_SOURCES);
        if (sources.length > 0) {
          const source = sources[0];
          if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
          } else if (creep.harvest(source) === ERR_NOT_ENOUGH_RESOURCES || creep.harvest(source) === ERR_FULL) {
            creep.memory.upgrading = true;
            creep.memory.withdrawTarget = null;
            this.upgrade(creep);
          }
        }
      }
    }
    // 如果当前能量为0，切换状态
    if (creep.memory.upgrading) {
      creep.memory.dontPullMe = true;
      // 获取绑定房间的控制器
      const controller = creep.memory.bindRoom ? Game.rooms[creep.memory.bindRoom].controller : creep.room.controller;
      // 判断是否在控制器旁边
      if (creep.pos.getRangeTo(controller) > 2) {
        // if (creepRepair(creep) === true) {
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
        // }
        return;
      } else {
        creep.upgradeController(controller);
        return;
      }
    }

  },
  // 建造工
  builder(creep) {
    // 判断当前是否有能量 
    if (creep.store.getFreeCapacity() === 0) {
      creep.memory.building = true;
    } else if (creep.store.getUsedCapacity() === 0) {
      creep.memory.building = false;
    }
    if (creep.memory.building === false) {
      // 如果房间有ruin,并且能量大于50
      const ruins = creep.room.find(FIND_RUINS, {
        filter: (ruin) => {
          return ruin.store.getUsedCapacity(RESOURCE_ENERGY) >= 50
        }
      });
      // 直接去最近的ruin
      if (ruins.length > 0) {
        const ruin = creep.pos.findClosestByRange(ruins);
        if (creep.withdraw(ruin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(ruin, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
    }
    // 如果工作房间矿物数量为0,且需要矿物,或者房间不是自己的
    if (creep.room.controller && creep.room.controller.level > 0 && creep.memory.building === false && creep.room.controller.my === false
      || creep.memory.building === false && creep.memory.bindRoom
      && Game.rooms[creep.memory.bindRoom] && Game.rooms[creep.memory.bindRoom].controller.my
      && Game.rooms[creep.memory.bindRoom].memory.centerSource.length + Game.rooms[creep.memory.bindRoom].memory.otherSource.length === 0) {
      // 回到创建房间获取
      creep.moveTo(new RoomPosition(25, 25, creep.memory.createRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    // 判断是否在工作房间
    if (creep.memory.bindRoom && creep.room.name !== creep.memory.bindRoom && creep.memory.building === true) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
    // 这里是房间有能量矿的情况下
    if (creep.memory.building === false) {
      // 如果有container，优先从container中获取
      const containers = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 100
        }
      });
      if (containers.length > 0) {
        const withdrawTarget = creep.pos.findClosestByRange(containers);
        creep.memory.withdrawTarget = withdrawTarget.id;
        let withdrawRes = creep.withdraw(withdrawTarget, RESOURCE_ENERGY);
        if (withdrawRes === ERR_INVALID_TARGET) {
          withdrawRes = creep.pickup(withdrawTarget, RESOURCE_ENERGY)
        }
        if (withdrawRes === ERR_NOT_IN_RANGE) {
          creep.moveTo(withdrawTarget, { visualizePathStyle: { stroke: '#ffffff' } });
          return "MOVE_TO"
        } else if (withdrawRes === ERR_FULL) {
          creep.memory.building = true;
          creep.memory.withdrawTarget = null;
          this.build(creep);
        }
      } else {
        // 自己挖矿
        const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
        if (source) {
          const harvestResult = creep.harvest(source);
          if (harvestResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            return 'MOVE_TO'
          } else if (harvestResult === ERR_NOT_ENOUGH_RESOURCES || harvestResult === ERR_FULL) {
            // 如果矿物不足，切换状态
            creep.memory.building = true;
          }
        }
      }
    }
    // 如果当前能量为0，切换状态
    if (creep.memory.building) {
      // 获取建造目标
      let buildTarget = null;
      if (creep.memory.buildTarget) {
        buildTarget = Game.getObjectById(creep.memory.buildTarget);
        if (buildTarget && buildTarget.progress === buildTarget.progressTotal) {
          buildTarget = null;
        }
      }
      if (buildTarget === null) {
        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length > 0) {
          buildTarget = creep.pos.findClosestByRange(constructionSites);
        }
      }
      if (buildTarget === null) {
        if (creep.memory.bindRoom && Game.rooms[creep.memory.bindRoom].controller !== undefined) {
          // 获取绑定房间的控制器
          const controller = creep.memory.bindRoom ? Game.rooms[creep.memory.bindRoom].controller : creep.room.controller;
          // 判断是否在控制器旁边
          if (creep.pos.getRangeTo(controller) > 2) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
            return;
          } else {
            creep.upgradeController(controller);
            return;
          }
        } else {
          // 移除帮建
          creep.memory.bindRoom = creep.memory.createRoom;
          Game.Tools.RemoveHelpBuildRoom(creep.memory.bindRoom);
        }
      }
      // 开始建造
      if (creep.build(buildTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(buildTarget, { visualizePathStyle: { stroke: '#ffffff' } });
      }
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
    let minerResult = null
    {
      // 查找并绑定附近工位
      let workSite = roomFind.findMinerWorkSite(creep);
      const source = Game.getObjectById(creep.memory.sourceId);
      const harvestReult = creep.harvest(source)
      // 不在工位坐标上
      if (workSite && (creep.pos.x !== workSite.pos.x || creep.pos.y !== workSite.pos.y)) {
        // 移动到工位
        creep.moveTo(workSite, { visualizePathStyle: { stroke: '#ffaa00' } });
        minerResult = 'MOVE_TO'
      } else {
        minerResult = harvestReult
      }
    }
    if (minerResult == 'MOVE_TO') {
      return;
    }

    if (minerResult === ERR_NOT_ENOUGH_RESOURCES) {
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
    // 如果血量少于80%就返回出生点
    if (creep.hits < creep.hitsMax * 0.8) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.createRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return;
    }
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
          if (creepRepair(creep) === true) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.createRoom), { visualizePathStyle: { stroke: '#ffffff' } });
          }
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
          creep.memory.store = true;
          this.assign(creep);
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
        creep.memory.store = true;
        this.assign(creep);
      }
    } else {
      let target = null
      if (creep.memory.transportId) {
        target = Game.getObjectById(creep.memory.transportId);
      }
      if (target === null || target.store && target.store.getUsedCapacity() === 0) {
        creep.memory.transportId = null;
        // 判断是否在工作房间
        if (creep.memory.bindRoom && creep.room.name !== creep.memory.bindRoom) {
          creep.moveTo(new RoomPosition(25, 25, creep.memory.bindRoom), { visualizePathStyle: { stroke: '#ffffff' } });
          return 'moveToBindRoom';
        }
        // 所有绑定该房间的运输者
        const transporters = creep.room.find(FIND_MY_CREEPS, {
          filter: c => c.memory.behavior === BEHAVIOR_TRANSPORT && c.memory.bindRoom === creep.room.name
        });
        if (target === null) {
          // 获取散落的能量
          target = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50 && transporters.filter(t => t.memory.transportId === r.id).length === 0
          });
        }
        // 如果没有散落的能量就获取container
        if (target === null) {
          target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity() > 100 && transporters.filter(t => t.memory.transportId === s.id).length === 0
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
          const getEnergyFunction = target.energy ? creep.pickup : creep.withdraw
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

function creepDie(creep) {
  if (creep.ticksToLive === 1 && creep.store.getUsedCapacity() > 0) {
    // 快死了叫队友收尸自己自杀
    const resource = {
      taskId: creep.room.name + '_' + creep.id,
      pos: creep.pos,
      id: null,
      type: 'TOMBSTONE',
      roomName: creep.room.name,
      saveName: creep.memory.createRoom,
      functionName: 'withdraw',
      state: 0,
      storeCount: creep.store.getUsedCapacity(),
      order: 3,
      creepName: null,
    };
    Game.Tools.AddCollectTask(creep.memory.createRoom, resource);
    creep.suicide()
    return true
  }
  return false
}

// 爬爬修路
function creepRepair(creep) {
  // 随机性检测，不然太浪费资源了
  if (creep.ticksToLive % 10 !== 0) return;
  // 获取附近道路是否存在血量低于50%的，如果有则优先修复
  // 获取脚下的道路或建筑工地
  const road = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
  if (road && road.hits < road.hitsMax * 0.5) {
    creep.repair(road);
    return 'repair';
  }
  // 获取脚下的我的道路建筑工地
  const myRoad = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES).find(s => s.structureType === STRUCTURE_ROAD);
  if (myRoad) {
    creep.build(myRoad);
    return 'build';
  }
  if (road === null && myRoad === null || road === undefined && myRoad === undefined) {
    // 脚下没有道路就建造
    creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
  }
  return true
}
module.exports = creepWrok;