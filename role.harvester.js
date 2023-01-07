var roleHarvester = {

  /** @param {Creep} creep **/
  run: function (creep) {
    this.mining(creep);
  },
  // 挖矿模式
  mining: function (creep) {
    if (creep.store.getFreeCapacity() > 0) {
      // 找到旷去挖
      // 计算出距离当前creep最近的能量来源
      var sources = creep.pos.findClosestByRange(FIND_SOURCES);
      if (creep.harvest(sources) == ERR_NOT_IN_RANGE) {
        creep.moveTo(sources, { visualizePathStyle: { stroke: '#ffaa00' } });
        creep.say('🔄挖矿');
      }
    } else {
      const extensions = Game.spawns['Spawn1'].room.find(FIND_MY_STRUCTURES, {
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
      }
    }
  }
};

module.exports = roleHarvester;