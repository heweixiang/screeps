// 用来各种角色查找房间内的各种资源,以及绑定并移动到资源的

const roomFind = {
  // 对比一个实体和一个目标实体列表,返回最近的目标实体
  contrastPos: (Entity, TargetEntityList) => {
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
  // 获取最近可获取的能量或者资源建筑 , 默认获取能量，兼容其它资源 这个用来急取能量，就近原则比如升级工
  getNearbyEnergy: (Entity, ResourceType = RESOURCE_ENERGY) => {
    return roomFind.getNearbyUseEnergy(Entity, ResourceType);
  },
  // 获取实体所在房间可获取用来使用的能量实体，非运输工
  getNearbyUseEnergy: (Entity, ResourceType = RESOURCE_ENERGY) => {
    const Room = Entity.room;
    // 实体列表
    const EntityList = [];
    // 获取所有的废墟
    const RuinList = Room.find(FIND_RUINS, {
      filter: (ruin) => {
        return ruin.store.getUsedCapacity(ResourceType) > 0;
      }
    });
    if (RuinList.length > 0) {
      // 优先运输废墟原则，因为废墟会消失，同时也保证降生在大佬房间能快速使用遗产
      return roomFind.contrastPos(Entity, RuinList);
    }
    // 获取所有Store
    const StoreList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE && structure.store.getUsedCapacity(ResourceType) > 0;
      }
    });
    // 获取所有Link
    const LinkList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_LINK && structure.store.getUsedCapacity(ResourceType) > 0;
      }
    });
    // 合并所有的实体列表
    EntityList.push(...StoreList);
    EntityList.push(...LinkList);
    EntityList.push(roomFind.getNearbyTransportEnergy(Entity, ResourceType));
    return EntityList.length === 1 ? EntityList[0] : roomFind.contrastPos(Entity, EntityList);
  },
  // 获取搬运工的目标
  getNearbyTransportEnergy: (Entity, ResourceType = RESOURCE_ENERGY) => {
    const Room = Entity.room;
    // 实体列表
    const EntityList = [];
    // 获取所有的废墟
    const RuinList = Room.find(FIND_RUINS, {
      filter: (ruin) => {
        return ruin.store.getUsedCapacity(ResourceType) > 0;
      }
    });
    if (RuinList.length > 0) {
      // 优先运输废墟原则，因为废墟会消失，同时也保证降生在大佬房间能快速使用遗产
      return roomFind.contrastPos(Entity, RuinList);
    }
    // 获取所有散落的能量
    const EnergyList = Room.find(FIND_DROPPED_RESOURCES);
    // 获取所有Container
    const ContainerList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity(ResourceType) > 0;
      }
    });
    // 获取所有非自己的Store
    const OtherStoreList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE && structure.store.getUsedCapacity(ResourceType) > 0 && !structure.my;
      }
    });
    // 获取所有非自己的Container
    const OtherContainerList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity(ResourceType) > 0 && !structure.my;
      }
    });
    // 获取所有非自己的Link
    const OtherLinkList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_LINK && structure.store.getUsedCapacity(ResourceType) > 0 && !structure.my;
      }
    });
    // 获取所有非自己的Spawn
    const OtherSpawnList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_SPAWN && structure.store.getUsedCapacity(ResourceType) > 0 && !structure.my;
      }
    });
    // 获取所有非自己的Extension
    const OtherExtensionList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_EXTENSION && structure.store.getUsedCapacity(ResourceType) > 0 && !structure.my;
      }
    });
    // 获取所有的墓碑
    const TombstoneList = Room.find(FIND_TOMBSTONES, {
      filter: (tombstone) => {
        return tombstone.store.getUsedCapacity(ResourceType) > 0;
      }
    });
    // 合并所有的实体列表
    EntityList.push(...RuinList);
    EntityList.push(...EnergyList);
    EntityList.push(...ContainerList);
    EntityList.push(...OtherStoreList);
    EntityList.push(...OtherContainerList);
    EntityList.push(...OtherLinkList);
    EntityList.push(...OtherSpawnList);
    EntityList.push(...OtherExtensionList);
    EntityList.push(...TombstoneList);
    return EntityList.length === 1 ? EntityList[0] : roomFind.contrastPos(Entity, EntityList);
  },
  // 获取最近的存储器
  getNearbyStore: (Entity, ResourceType = RESOURCE_ENERGY) => {
    const Room = Entity.room;
    // 实体列表
    const EntityList = [];
    // 获取所有Link
    const LinkList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        // 不在store 3*3范围内的link
        return structure.structureType === STRUCTURE_LINK && structure.store.getFreeCapacity(ResourceType) > 0 && !structure.pos.inRangeTo(Entity.pos, 3);
      }
    });
    // 获取所有Store
    const StoreList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_STORAGE && structure.store.getFreeCapacity(ResourceType) > 0;
      }
    });
    EntityList.push(...StoreList);
    EntityList.push(...LinkList);
    // 如果有link和store，对比两者的距离
    if (LinkList.length > 0 && StoreList.length > 0) {
      return roomFind.contrastPos(Entity, EntityList);
    }

    // 获取所有extension
    const ExtensionList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_EXTENSION && structure.store.getFreeCapacity(ResourceType) > 0;
      }
    });
    // 获取所有Spawn
    const SpawnList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_SPAWN && structure.store.getFreeCapacity(ResourceType) > 0;
      }
    });
    // 获取所有Tower
    const TowerList = Room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(ResourceType) > 0;
      }
    });

    // 合并所有的实体列表
    EntityList.push(...SpawnList);
    EntityList.push(...TowerList);
    EntityList.push(...ExtensionList);
    return EntityList.length === 1 ? EntityList[0] : roomFind.contrastPos(Entity, EntityList);
  },
  // 获取锁在房间内的矿物
  getLockMineral: (Entity, ResourceType = RESOURCE_ENERGY) => {
    // 先默认是能量
    const Room = Entity.room;
    // 实体列表
    const EntityList = [];
    // 如果是RESOURCE_ENERGY
    if (ResourceType === RESOURCE_ENERGY) {
      // 获取所有能量矿
      const SourceList = Room.find(FIND_SOURCES, {
        filter: (source) => {
          // 遍历房间内的creep确保没有被绑定
          const CreepList = Room.find(FIND_MY_CREEPS, {
            filter: (creep) => {
              return creep.memory.sourceId === source.id;
            }
          });
          return source.energy > 0 && CreepList.length === 0;
        }
      });
      return SourceList.length === 1 ? SourceList[0] : roomFind.contrastPos(Entity, SourceList);
    }
  }
}
module.exports = roomFind;