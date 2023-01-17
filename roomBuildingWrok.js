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
  const creeps = ROOM.find(FIND_MY_CREEPS).filter((creep) => creep.hits < creep.hitsMax * 0.5);
  // 如果有爬爬
  if (creeps.length > 0) {
    // 治疗爬爬
    tower.heal(creeps[0]);
    return
  }
  // 获取最近的血量低于50%的建筑
  const structures = ROOM.find(FIND_STRUCTURES, {
    filter: (structure) => {
      // 如果是墙壁
      if (structure.structureType === STRUCTURE_WALL) {
        // 如果血量低于
        return structure.hits < Game.Config.RCL['LV' + ROOM.controller.level].Ramparts * 0.3 * 1000;
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
  return
}

module.exports = roomBuildingWrok;