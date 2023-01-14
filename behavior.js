// 各种行为操作
// 这里会调用房间查询方法
const roomFind = require('roomFind');

const behavior = {
  // 运输者获取能量
  transportGetEnergy: (Creep) => {
    let EnergyEntity = null
    // 如果绑定了目标，就直接去目标获取能量
    if (Creep.memory.target) {
      EnergyEntity = Game.getObjectById(Creep.memory.target);
    } else {
      // 获取最近的能量
      EnergyEntity = roomFind.getNearbyTransportEnergy(Creep);
    }
    if (EnergyEntity) {
      return toEnergyEntityGetEnergy(Creep, EnergyEntity);
    }
  },
  // 使用者获取能量
  userGetEnergy: (Creep) => {
    let EnergyEntity = null
    // 如果绑定了目标，就直接去目标获取能量
    if (Creep.memory.target) {
      EnergyEntity = Game.getObjectById(Creep.memory.target);
    } else {
      // 获取最近的能量
      EnergyEntity = roomFind.getNearbyUseEnergy(Creep);
    }
    if (EnergyEntity) {
      return toEnergyEntityGetEnergy(Creep, EnergyEntity);
    }
  },
  // 运输者存储或资源
  transportStoreEnergy: (Creep) => {
    // 判断当前房间是否是出生房间
    if (Creep.room.name === Creep.memory.createRoom) {
      let StoreEntity = null
      // 如果绑定了目标，就直接去目标存储能量
      if (Creep.memory.storeId) {
        StoreEntity = Game.getObjectById(Creep.memory.storeId);
      } else {
        // 获取最近的存储器
        StoreEntity = roomFind.getNearbyStore(Creep);
      }
      if (StoreEntity) {
        return toStoreEntityStoreEnergy(Creep, StoreEntity);
      }
      return 'noStore';
    } else {
      // 到出生房间
      Creep.moveTo(new RoomPosition(25, 25, Creep.memory.createRoom), { visualizePathStyle: { stroke: '#ffffff' } });
      return 'moveTo';
    }
  },
  // 矿工寻找矿物并上岗
  minerFindSource: (Creep) => {
    let source = null;
    // 如果绑定了目标，就直接去目标获取能量
    if (Creep.memory.sourceId) {
      source = Game.getObjectById(Creep.memory.sourceId);
    } else {
      // 获取最近的能量
      source = roomFind.getNearbySource(Creep);
    }
    if (source) {
      if (Creep.harvest(source) === ERR_NOT_IN_RANGE) {
        Creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        return 'moveTo';
      }
      // 如果矿物没有就向上反馈
      if (source.energy === 0) {
        return 'noEnergy';
      }
    }
    return 'harvest';
  },
  // 确保creep在绑定的房间，这个自己人不用调，外矿才会调用
  ensureRoom: (Creep) => {
    if (Creep.room.name !== Creep.memory.bindRoom) {
      return gotoRoom(Creep, Game.rooms[Creep.memory.bindRoom]);
    }
    return 'inRoom';
  },
  // 确保creep在创建房间
  ensureCreateRoom: (Creep) => {
    if (Creep.room.name !== Creep.memory.createRoom) {
      return gotoRoom(Creep, Creep.memory.createRoom);
    }
    return 'inRoom';
  }
}

function gotoRoom(creep, ROOM) {
  // 如果不在目标房间
  if (creep.room.name !== ROOM.name) {
    // 移动到该房间
    const exitDir = creep.room.findExitTo(ROOM);
    const exit = creep.pos.findClosestByRange(exitDir);
    creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
    return 'moveTo';
  }
  return 'inRoom';
}

// 将creep移动到存储器
function toStoreEntityStoreEnergy(Creep, StoreEntity) {
  // 绑定该存储器
  Creep.memory.storeId = StoreEntity.id;
  if (!Creep.pos.isNearTo(StoreEntity)) {
    Creep.moveTo(StoreEntity, { visualizePathStyle: { stroke: '#ffffff' } });
    return 'moveTo';
  }
  // 向存储器存储能量，直到creep能量为0，如果存储器是link就等待否则就清除绑定并重新寻找存储器
  if (Creep.transfer(StoreEntity, RESOURCE_ENERGY) === ERR_NOT_ENOUGH_RESOURCES) {
    Creep.memory.storeId = null;
    Creep.memory.isFull = false;
    return 'noEnergy';
  }
  if (Creep.transfer(StoreEntity, RESOURCE_ENERGY) === ERR_FULL) {
    if (StoreEntity.structureType === STRUCTURE_LINK) {
      return 'full';
    } else {
      Creep.memory.storeId = null;
      behavior.transportStoreEnergy(Creep);
    }
  }
  return 'storeEnergy';
}

// 到实体获取能量
function toEnergyEntityGetEnergy(Creep, EnergyEntity) {
  // 绑定该能量
  Creep.memory.transportEnergyId = EnergyEntity.id;
  // 运输者获取能量
  if (getEnergy(Creep, EnergyEntity) === 'moveTo') {
    return 'moveTo'
  } else if (getEnergy(Creep, EnergyEntity) === ERR_NOT_ENOUGH_RESOURCES) {
    // 能量不足，清除绑定
    Creep.memory.transportEnergyId = undefined
  } else if (getEnergy(Creep, EnergyEntity) === ERR_INVALID_TARGET) {
    // 目标无效，清除绑定
    Creep.memory.transportEnergyId = undefined
  } else if (getEnergy(Creep, EnergyEntity) === ERR_FULL) {
    // 满了，清除绑定
    Creep.memory.transportEnergyId = undefined
    // 标记已满
    Creep.memory.isFull = true;
  }
  if (!Creep.memory.isFull) {
    // 继续获取能量
    // behavior.transportGetEnergy(Creep);
  } else {
    // 饱和
    return 'full';
  }
  return 'getEnergy';
}

// 获取能量的几种方式
function getEnergy(Creep, target) {
  if (!Creep.pos.isNearTo(target)) {
    Creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
    return 'moveTo';
  }
  let withdrawResult = Creep.withdraw(target, RESOURCE_ENERGY)
  // 如果withdraw报错，就尝试pickup
  if (withdrawResult === ERR_INVALID_TARGET) {
    withdrawResult = Creep.pickup(target);
  }
  return withdrawResult;
}

module.exports = behavior;