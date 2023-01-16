// creep动作
const roomFind = require('roomFind');

const creepBehavior = {
  // 矿工上岗
  miner(creep) {
    // const workSite = roomFind.findMinerWorkSite(creep);
    // 查找并绑定附近工位
    const workSite = roomFind.findMinerWorkSite(creep);
    const source = Game.getObjectById(creep.memory.sourceId);
    const harvestReult = creep.harvest(source)
    // 不在工位坐标上
    if (workSite && (creep.pos.x !== workSite.pos.x || creep.pos.y !== workSite.pos.y)) {
      // 移动到工位
      creep.moveTo(workSite, { visualizePathStyle: { stroke: '#ffaa00' } });
      return 'MOVE_TO'
    } else {
      return harvestReult
    }
  },
  // 获取房间内需要运输的资源
  getTransportEnergy(creep) {
    const room = creep.room;
    // 获取废墟中的资源
    let tombstone = room.find(FIND_TOMBSTONES, {
      filter: (tombstone) => {
        return tombstone.store[RESOURCE_ENERGY] > 0;
      }
    });
    // 如果有废墟
    if (tombstone && tombstone.length > 0) {
      // 获取最近的废墟
      tombstone = roomFind.contrastPos(creep, tombstone);
      // 如果废墟中的资源大于0
      if (tombstone.store[RESOURCE_ENERGY] > 0) {
        // 获取废墟的id
        creep.memory.transportEnergyId = tombstone.id;
        return tombstone;
      }
    }
    // 获取散落资源
    const droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
      filter: (resource) => {
        return resource.resourceType === RESOURCE_ENERGY && resource.amount > 100;
      }
    });
    // 获取container中的资源
    const container = room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        // 3*3内没有link
        const link = structure.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_LINK;
          }
        });
        return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 100 && link.length === 0;
      }
    });
    // 对比最近的返回
    return roomFind.contrastPos(creep, droppedEnergy.concat(container));
  },
  // 从指定建筑或坐标获取能量
  getEnergyFrom(creep, target) {
    let result;
    // 如果是建筑
    if (target.structureType) {
      result = creep.withdraw(target, RESOURCE_ENERGY);
    } else {
      // 从散落资源中获取能量
      result = creep.pickup(target);
    }
    if (result === ERR_NOT_IN_RANGE) {
    console.log('result: ', result);
      creep.moveTo(target);
      return 'MOVE_TO'
    }
    return result
  },
  // 储存能量，找到key存储的建筑物
  getTransportStore(creep) {
    let target = null
    // 获取link
    const link = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        // 3*3内没有storage
        const storage = structure.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: (structure) => {
            return structure.structureType === STRUCTURE_STORAGE;
          }
        });
        return structure.structureType === STRUCTURE_LINK && structure.energy < structure.energyCapacity && storage.length === 0;
      }
    });
    // 获取storage
    const storage = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE;
      }
    });
    // 如果两者都存在
    if (link.length > 0 && storage.length > 0) {
      // 获取最近的
      const link = roomFind.contrastPos(creep, link);
      const storage = roomFind.contrastPos(creep, storage);
      // 如果link距离storage近
      if (creep.pos.getRangeTo(link) < creep.pos.getRangeTo(storage)) {
        target = link;
      } else {
        target = storage;
      }
    }
    // extension
    const extension = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_EXTENSION && structure.energy < structure.energyCapacity;
      }
    });
    // tower
    const tower = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_TOWER && structure.energy < structure.energyCapacity;
      }
    });
    // spawn
    const spawn = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_SPAWN && structure.energy < structure.energyCapacity;
      }
    });
    // 整合对比
    return roomFind.contrastPos(creep, link.concat(storage, extension, tower, spawn));
  },
  // 向指定资源存储建筑物存储能量
  storeEnergyTo(creep, target) {
    let result;
    if (target.structureType) {
      result = creep.transfer(target, RESOURCE_ENERGY);
    }
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return 'MOVE_TO'
    }
    return result
  },
  // 获取房间内可以被使用的能量
  getUseEnergy(creep) {
    // 获取废墟
    // const ruin = creep.room.find(FIND_RUINS, {
    //   filter: (ruin) => {
    //     return ruin.store[RESOURCE_ENERGY] > 0;
    //   } 
    // });    
    // 墓碑
    const tombstone = creep.room.find(FIND_TOMBSTONES, {
      filter: (tombstone) => {
        return tombstone.store[RESOURCE_ENERGY] > 100;
      }
    });
    // 获取散落资源
    const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
      filter: (resource) => {
        return resource.resourceType === RESOURCE_ENERGY && resource.amount > 100;
      }
    });
    // 获取storage
    const storage = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE;
      }
    });
    // 获取container
    const container = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 100;
      }
    });
    // 获取link
    const link = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_LINK && structure.energy > 0;
      }
    });
    // 整合对比
    return roomFind.contrastPos(creep, storage.concat(container, link, droppedEnergy, tombstone));
  },
  upgrade(creep) {
    if (creep.memory.upgrading === true) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
        return 'MOVE_TO'
      } else if (creep.upgradeController(creep.room.controller) === ERR_NOT_ENOUGH_RESOURCES) {
        creep.memory.upgrading = false;
      }
      return 'UPGRADING'
    }
    // 当前是否有能量
    if (creep.store.getUsedCapacity() === 0) {
      let target = null
      // 是否存在绑定
      if (creep.memory.transportId) {
        target = Game.getObjectById(creep.memory.transportId)
      }
      // 获取能量
      else {
        target = this.getUseEnergy(creep);
      }
      // 如果有能量
      if (target) {
        // 获取能量
        const getEnergyResult = this.getEnergyFrom(creep, target);
        // 没有能量了就清除绑定
        if (getEnergyResult === ERR_NOT_ENOUGH_RESOURCES) {
          creep.memory.transportId = null;
        } else if (getEnergyResult === ERR_FULL) {
          creep.memory.transportId = null;
          creep.memory.upgrading = true;
        }
      }
      return 'GET_ENERGY'
    } else {
      creep.memory.upgrading = true;
    }
  },
  build(creep) {
    if (creep.memory.building === true) {
      // 获取所有建筑工地
      const targets = []
      // 获取所有建筑工地
      for (const key in Game.constructionSites) {
        targets.push(Game.constructionSites[key])
      }
      // 如果有工地
      if (targets.length > 0) {
        // 获取最近的工地
        const target = targets.reduce((a, b) => {
          return creep.pos.getRangeTo(a) < creep.pos.getRangeTo(b) ? a : b
        })
        // 建造
        if (creep.build(target) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
          return 'MOVE_TO'
        } else if (creep.build(target) === ERR_NOT_ENOUGH_RESOURCES) {
          creep.memory.building = false
          this.build(creep)
        }
        return 'BUILDING'
      }
      return 'NO-BUILDING'
    }
    // 当前是否有能量
    if (creep.store.getUsedCapacity() === 0) {
      let target = null
      // 是否存在绑定
      if (creep.memory.transportId) {
        target = Game.getObjectById(creep.memory.transportId)
      }
      // 获取能量
      else {
        target = this.getUseEnergy(creep);
      }
      // 如果有能量
      if (target) {
        // 获取能量
        const getEnergyResult = this.getEnergyFrom(creep, target);
        // 没有能量了就清除绑定
        if (getEnergyResult === ERR_NOT_ENOUGH_RESOURCES) {
          creep.memory.transportId = null;
        } else if (getEnergyResult === ERR_FULL) {
          creep.memory.transportId = null;
          creep.memory.building = true;
        }
      }
      return 'GET_ENERGY'
    } else {
      creep.memory.building = true;
    }
  },
  // 判断当前是否在指定房间，如果不在就移动到指定房间
  moveToRoom(creep) {
    // bindRoom为绑定的房间
    if (creep.memory.bindRoom) {
      // 如果当前房间不是绑定房间
      if (creep.room.name !== creep.memory.bindRoom) {
        // 获取绑定房间的出口
        const exit = creep.room.findExitTo(creep.memory.bindRoom);
        // 移动到出口
        creep.moveTo(creep.pos.findClosestByRange(exit), { visualizePathStyle: { stroke: '#ffffff' } });
        return 'MOVE_TO'
      }
    }
    return 'IN_ROOM'
  },
  // 判断当前是否在生成房间，如果不在就移动到生成房间
  moveToSpawnRoom(creep) {
    // createRoom为生成房间
    if (creep.memory.createRoom) {
      // 如果当前房间不是生成房间
      if (creep.room.name !== creep.memory.createRoom) {
        // 获取生成房间的出口
        const exit = creep.room.findExitTo(creep.memory.createRoom);
        // 移动到出口
        creep.moveTo(creep.pos.findClosestByRange(exit), { visualizePathStyle: { stroke: '#ffffff' } });
        return 'MOVE_TO'
      }
    }
    return 'IN_ROOM'
  },
  getAttackTarget(creep) {
    let targets = creep.room.find(FIND_HOSTILE_CREEPS);
    if (targets.length > 0) {
      const target = roomFind.contrastPos(creep, targets);
      creep.memory.attackTarget = target.id;
      return target
    }
    // 不属于我的建筑
    targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.my === false && structure.structureType !== STRUCTURE_CONTROLLER;
      }
    });
    if (targets.length > 0) {
      const target = roomFind.contrastPos(creep, targets);
      creep.memory.attackTarget = target.id;
      return target
    }
    return null
  },
  getHealTarget(creep) {
    const targets = creep.room.find(FIND_MY_CREEPS, {
      filter: (creep) => {
        return creep.hits < creep.hitsMax;
      }
    });
    if (targets.length > 0) {
      const target = roomFind.contrastPos(creep, targets);
      creep.memory.healTarget = target.id;
      return target
    }
    return null
  }
}
module.exports = creepBehavior