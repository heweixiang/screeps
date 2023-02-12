// 房间内的一些查找
const roomFind = {
  // 对比一个实体和一个目标实体列表,返回最近的目标实体
  contrastPos: (Entity, TargetEntityList) => {
    if(!TargetEntityList) return null
    if (TargetEntityList.length === 0) return null;
    if (TargetEntityList.length === 1) return TargetEntityList[0];
    TargetEntityList = TargetEntityList.filter(x => x !== undefined && x !== null && x !== false);
    let target = null;
    let min = 9999;
    for (const targetEntity of TargetEntityList) {
      const distance = Entity.pos.getRangeTo(targetEntity);
      if (distance < min) {
        min = distance;
        target = targetEntity;
      }
    }
    return target;
  },
  // 帮矿工找工位
  // 找到该房间内所有矿物旁边没有被绑定的container或者建筑工地
  findMinerWorkSite: function (creep) {
    // 先找到一个没有被绑定的矿
    let source = creep.room.find(FIND_SOURCES, {
      filter: (source) => {
        return creep.room.find(FIND_MY_CREEPS, {
          filter: (creepx) => {
            return creepx.memory.sourceId === source.id && creepx.id !== creep.id;
          }
        }).length === 0;
      }
    });
    // 找到最近的
    source = source.length > 1 ? roomFind.contrastPos(creep, source) : source[0];
    // 如果有且当前creep没有绑定矿
    if (!creep.memory.workSiteId) {
      // 绑定矿
      creep.memory.sourceId = source ? source.id : creep.memory.sourceId;
      let entity = null
      // 获取矿周围3*3范围内的container
      const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (structure) => {
          const count = creep.room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
              return creep.memory.workSiteId === structure.id;
            }
          }).length;
          return structure.structureType === STRUCTURE_CONTAINER && count === 0;
        }
      })[0];
      // 如果有
      if (container) {
        // 绑定container
        creep.memory.workSiteId = container.id;
        entity = container
      }
      // 如果没有
      else {
        // 获取矿周围3*3范围内的建筑工地
        const constructionSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
          filter: (structure) => {
            const count = creep.room.find(FIND_MY_CREEPS, {
              filter: (creepx) => {
                creepx.memory.workSiteId === structure.id
              }
            }).length;
            return structure.structureType === STRUCTURE_CONTAINER && count === 0
          }
        })[0];
        // 如果有
        if (constructionSite) {
          // 绑定container
          creep.memory.workSiteId = constructionSite.id;
          entity = constructionSite
        }
      }
      return entity
    } else {
      // 如果没有
      // 获取当前creep绑定的矿
      const workSite = Game.getObjectById(creep.memory.workSiteId)
      if (workSite) {
        return workSite;
      } else {
        creep.memory.workSiteId = null
        this.findMinerWorkSite(creep)
      }
    }
  }
}

module.exports = roomFind