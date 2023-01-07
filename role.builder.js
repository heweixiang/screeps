var roleBuilder = {

  /** @param {Creep} creep **/
  run: function (creep, ROOM) {

    if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
      creep.memory.building = false;
      creep.say('🔄挖矿');
    }
    if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
      creep.memory.building = true;
      creep.say('🚧建造');
    }

    if (creep.memory.building) {
      var targets = ROOM.find(FIND_CONSTRUCTION_SITES);
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
      var sources = ROOM.find(FIND_SOURCES);
      if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }
};

module.exports = roleBuilder;