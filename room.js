/**
 * 针对房间管理
 */
// 引入循环生成Creeps
const Creeps = require('creeps');

var room = {
  // 该行由tick重复调用
  roomManager(ROOM) {
    // ROOM controller level
    const RCL = ROOM.controller.level;
    // 获取当前房间可用能量
    const AvailableEnergy = ROOM.energyAvailable;
    console.log(`--------- ${ROOM} Level：${RCL} ---------`);
    console.log('AvailableEnergy：', AvailableEnergy);
    // 获取container数量
    const containerNum = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_CONTAINER;
      }
    }).length;
    ROOM.containerNum = containerNum
    // 处理Creeps
    Creeps.main(ROOM);
  }
}

module.exports = room;