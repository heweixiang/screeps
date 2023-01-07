/**
 * 针对房间管理
 */
// 引入循环生成Creeps
const Creeps = require('creeps');

var room = {
  // 该行由tick重复调用
  roomManager(ROOM) {
    // 获取当前房间可用能量
    const AvailableEnergy = ROOM.energyAvailable;
    console.log(`---------${ROOM}---------`);
    console.log('AvailableEnergy：', AvailableEnergy);
    // 处理Creeps
    Creeps.main(ROOM);
  }
}

module.exports = room;