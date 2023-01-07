var roleBuilder = {

  /** @param {Creep} creep **/
  run: function (creep, ROOM) {

    if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.building = false;
      creep.say('🔄采集');
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
      creep.memory.building = true;
      creep.say('🚧建造');
    }

    if (creep.memory.building) {
      // var targets = ROOM.find(FIND_CONSTRUCTION_SITES);
      // 找到所有需要建造的建筑，优先建造道路，然后是墙，然后是其他建筑，按照距离排序
      const targets = ROOM.find(FIND_CONSTRUCTION_SITES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_ROAD) || (structure.structureType == STRUCTURE_WALL) || (structure.structureType == STRUCTURE_RAMPART);
        }
      }).sort((a, b) => {
        return a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep);
      });
      if (targets.length) {
        if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // 找到房间控制器然后升级
        if (creep.upgradeController(ROOM.controller) == ERR_NOT_IN_RANGE) {
          creep.moveTo(ROOM.controller, { visualizePathStyle: { stroke: '#ffffff' } });
          creep.say('⚡升级');
        }
      }
    }
    else {
      // 找到房间内最近的有能量的container
      const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
          return (structure.structureType == STRUCTURE_CONTAINER) &&
            structure.store[RESOURCE_ENERGY] > 0;
        }
      });
      // 优先container采集，兼容采运分离
      if (container) {
        if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      } else {
        // 初期去矿采集
        const sources = ROOM.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
          creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
        }
      }
    }
  }
};

module.exports = roleBuilder;