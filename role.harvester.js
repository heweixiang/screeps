var roleHarvester = {

  /** @param {Creep} creep **/
  run: function (creep, ROOM) {
    if (creep.memory.role === 'transporter') {
      // 高级运输者
      this.transporter(creep, ROOM);
    } else if (creep.memory.role === 'repairer') {
      // 维修者
      this.repairer(creep, ROOM);
    } else {
      // 普通挖矿
      this.mining(creep, ROOM);
    }
  },
  // 高级运输者
  transporter: function (creep, ROOM) {
    // 找寻附近散落的能量
    const sources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
    // 找寻附近的container
    const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) - 2000 > 0;
      }
    });
    // 找寻附近的storage
    const storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_STORAGE) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });
    // 找寻附近的extension
    const extension = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });
    // 如果能量未满
    if (creep.store.getFreeCapacity() > 0) {
      // 如果有散落的能量
      if (sources) {
        // 如果能量在附近
        if (creep.pickup(sources) === ERR_NOT_IN_RANGE) {
          // 移动到能量附近
          creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        // 如果有container
        if (container) {
          // 如果container在附近
          if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            // 移动到container附近
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
          }
        }
      }
    } else {
      if (storage) {
        // 如果storage在附近
        if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // 移动到storage附近
          creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
          creep.say('🚧存储');
        }
      } else {
        // 如果有extension
        if (extension) {
          // 如果extension在附近
          if (creep.transfer(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            // 移动到extension附近
            creep.moveTo(extension, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('🚧存储');
          }
        }
      }
    }
  },
  // 维修者
  repairer: function (creep, ROOM) {
    // 如果有需要修理的建筑，且老化程度大于50%
    const repair = creep.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.hits < structure.hitsMax * 0.5 && structure.hits < 1000000;
      }
    });
    // .findClosestByRange(FIND_STRUCTURES, {
    //   filter: (structure) => {
    //     return (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_ROAD) && structure.hits < structure.hitsMax;
    //   }
    // });
    // 如果能量未满
    if (creep.store.getFreeCapacity() > 0) {
      // 找寻附近的container
      const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType === STRUCTURE_CONTAINER) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
      });
      // 找寻附近的storage
      const storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType === STRUCTURE_STORAGE) && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
        }
      });
      // 寻找附近的能量矿
      const sources = creep.pos.findClosestByRange(FIND_SOURCES);
      // 寻找散落的能量
      const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
      // 对比container和storage的能量距离取最近
      const source = creep.pos.findClosestByRange([container, dropped, sources, storage]);
      if (source) {
        // 如果能量在附近
        if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // 移动到能量附近
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else if (creep.pickup(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    } else {
      // 如果有需要维修的建筑
      if (repair) {
        // 如果建筑在附近
        if (creep.repair(repair) === ERR_NOT_IN_RANGE) {
          // 移动到建筑附近
          creep.moveTo(repair, { visualizePathStyle: { stroke: '#ffffff' } });
          creep.say('🚧维修');
        }
      } else {
        // 如果没有需要维修的建筑, 当运输工使用
        // 找寻附近的storage
        const storage = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType === STRUCTURE_STORAGE) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        // 找寻附近的extension
        const extension = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: (structure) => {
            return (structure.structureType === STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });
        // 寻找有空隙的spawn
        const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS, {
          filter: (structure) => {
            return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
          }
        });

        if (storage) {
          // 如果storage在附近
          if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            // 移动到storage附近
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('🚧存储');
          }
        } else if (extension) {
          // 如果extension在附近
          if (creep.transfer(extension, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            // 移动到extension附近
            creep.moveTo(extension, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('🚧存储');
          }
        } else if (creep.transfer(spawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // 移动到spawn附近
          creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
          creep.say('🚧存储');
        } else {
          // 如果没有extension，就去升级
          const controller = creep.room.controller;
          if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('🚧升级');
          }
        }
      }
    }
  },
  // 挖矿模式
  mining: function (creep, ROOM) {
    // 如果没有能量且有CARRY模块
    if (creep.store.getFreeCapacity() > 0 || creep.store.getCapacity() === null) {
      // 找到旷去挖
      // 计算出距离当前creep最近的能量来源
      const sources = creep.pos.findClosestByRange(FIND_SOURCES);
      // 找寻附近的container
      const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType === STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) - 2000 > 0;
        }
      });
      // 寻找散落的能量
      const droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES);
      // 高级矿工，运挖分离
      if (creep.store.getCapacity() === null) {
        // 获取当前标记的container
        const container = Game.getObjectById(creep.memory.container);
        if (!creep.moveTo(container)) {
          // 获取所有的creep
          const creeps = creep.room.find(FIND_MY_CREEPS);
          // 寻找附近的container，过滤被creep.memory.container存储的container
          const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => {
              return (structure.structureType === STRUCTURE_CONTAINER) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && !creeps.some((creep) => creep.memory.container === structure.id);
            }
          });
          // 标记第一个找到的container
          if (container) {
            creep.memory.container = container.id;
          }
          // 如果在container上面
          if (creep.moveTo(container)) {
            // 移动到container附近
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🚧采集');
            return
          }
        } else {
          // 开始查找附近矿物
          const sources = creep.pos.findClosestByRange(FIND_SOURCES);
          if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
            // 采集了就标记开始采集，工具人不需要移动
            creep.memory.isHarvesting = true;
            creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🔄挖矿');
          }
        }
      }
      // 优先捡起散落能量
      if (droppedEnergy) {
        if (creep.pickup(droppedEnergy) === ERR_NOT_IN_RANGE) {
          // 移动到能量附近
          creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else if (container) {
        // 普通矿工优先去container，填补过渡中途出现的漏洞空隙
        // 如果container在附近
        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          // 移动到container附近
          creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    } else {
      // 如果有需要修理的建筑
      const repair = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType === STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_ROAD) && structure.hits < structure.hitsMax;
        }
      });
      const extensions = ROOM.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_EXTENSION }
      }).map(x => {
        // 剩余空间 x.store.getFreeCapacity(RESOURCE_ENERGY)
        x.space = x.store.getFreeCapacity(RESOURCE_ENERGY);
        // 能量承载总量 x.store.getCapacity(RESOURCE_ENERGY)
        x.capacity = x.store.getCapacity(RESOURCE_ENERGY);
        // 剩余空间
        x.freeCapacity = x.capacity - x.space;
        return x
      }).filter(x => x.space > 0).sort((a, b) => a.space - b.space);
      if (creep.transfer(extensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(extensions[0], { visualizePathStyle: { stroke: '#ffffff' } });
        creep.say('🔳储存');
      } else if (repair) {
        // 如果有需要修理的建筑
        // 如果建筑在附近
        if (creep.repair(repair) === ERR_NOT_IN_RANGE) {
          // 移动到建筑附近
          creep.moveTo(repair, { visualizePathStyle: { stroke: '#ffffff' } });
          creep.say('🚧修理');
        }
      } else if (extensions.length === 0) {
        // 找到房间控制器然后升级
        if (creep.upgradeController(ROOM.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(ROOM.controller, { visualizePathStyle: { stroke: '#ffffff' } });
          creep.say('⚡升级');
        }
      }
    }
  }
};

module.exports = roleHarvester;