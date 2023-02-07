/**
 * 针对房间管理
 */
// TODO 自动建筑需要优化，自动修路需要添加对角线节点，不然范围扩大会出问题
// TODO extension的建造需要优化，需要考虑到extension的位置，不然会出现extension竖着排列的情况

const roomBuildingWrok = {
  // 该行由tick重复调用
  loop(ROOM) {
    // 获取有能量的tower
    const towers = ROOM.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_TOWER && structure.energy > 0;
      }
    });
    towers.forEach((tower) => {
      TowerManagerLoop(ROOM, tower);
    })
    // 管理link的发送
    linkSend(ROOM);
  }
}

// 管理link的发送
function linkSend(ROOM) {
  if (!ROOM.storage) {
    return
  }
  // 获取storage周围的link
  const storageLink = ROOM.storage.pos.findInRange(FIND_MY_STRUCTURES, 2, {
    filter: (structure) => {
      return structure.structureType === STRUCTURE_LINK && structure.store[RESOURCE_ENERGY] === 0;
    }
  })[0];
  if (storageLink) {
    // 找到一个满的link
    // TODO 如果是矿物的绑定link则到了100才发送，并且逐步废弃container
    const fullLink = ROOM.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_LINK && structure.store[RESOURCE_ENERGY] >= 200 && structure.my && structure.cooldown === 0
      }
    })[0];
    if (fullLink) {
      // 如果storageLink的能量小于800
      if (storageLink.store[RESOURCE_ENERGY] === 0 || storageLink.store[RESOURCE_ENERGY] < fullLink.store[RESOURCE_ENERGY]) {
        // 发送能量
        fullLink.transferEnergy(storageLink);
      }
    }
  }
}

// 暂时让塔动起来，// TODO 后面需要优化的
function TowerManagerLoop(ROOM, tower) {
  // 获取最近的敌人
  const enemies = ROOM.find(FIND_HOSTILE_CREEPS)[0];
  // 如果有敌人
  if (enemies) {
    // 攻击敌人
    tower.attack(enemies);
    return
  }
  // 如果没有敌人
  // 获取最近的爬爬
  const creeps = ROOM.find(FIND_MY_CREEPS).filter((creep) => creep.hits < creep.hitsMax);
  // 如果有爬爬
  if (creeps.length > 0) {
    // 治疗爬爬
    tower.heal(creeps[0]);
    return
  }
  // 保障建筑完整性
  // 优先获取rampart血量最少的且血量低于1K的
  const ramparts = ROOM.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) && structure.hits < 1500;
    }
  })[0];
  // 如果有rampart
  if (ramparts) {
    // 修复rampart
    tower.repair(ramparts);
    return
  }
  // 扫描血量小于10%的道路
  const roads = ROOM.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.15;
    }
  })[0];
  // 如果有道路
  if (roads) {
    // 修复道路
    tower.repair(roads);
    return
  }
  // 保障建筑血量
  if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 400 && !enemies) {
    // 获取最近的血量低于50%的建筑
    const structures = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        // 如果是墙壁
        if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
          // 如果血量低于
          return structure.hits < 200000//Game.Config.RCL['LV' + ROOM.controller.level].Ramparts * 10000 * 0.25;
        }
        return structure.hits < structure.hitsMax * 0.7;
      }
    })[0];
    // 如果有建筑
    if (structures) {
      // 修复建筑
      tower.repair(structures);
      return
    }
  } else {
    // 获取最近的血量低于50%的建筑
    const structures = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        // 如果是墙壁
        if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
          // 如果血量低于
          return structure.hits < 200000//Game.Config.RCL['LV' + ROOM.controller.level].Ramparts * 10000 * 0.25;
        }
        return structure.hits < structure.hitsMax * 0.7;
      }
    })[0];
    // 如果有建筑
    if (structures) {
      // 修复建筑
      tower.repair(structures);
      return
    }
  }
  return
}

module.exports = roomBuildingWrok;