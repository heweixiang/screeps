/**
 * 针对房间管理
 */
// 引入循环生成Creeps
const Creeps = require('creeps');
// 引入BuildingManager
const Building = require('building');
// 引入attackAndDefense
const AttackAndDefense = require('attackAndDefense');

const room = {
  // 该行由tick重复调用
  roomManager(ROOM) {
    // ROOM controller level
    const RCL = ROOM.controller.level;
    // 获取当前房间可用能量
    const AvailableEnergy = ROOM.energyAvailable;
    // 获取房间storage剩余能量
    const StorageEnergy = ROOM.storage ? ROOM.storage.store[RESOURCE_ENERGY] : 0;
    // 获取当前房间升级进度
    const Progress = ROOM.controller.progress;
    // 获取当前房间升级进度总量
    const ProgressTotal = ROOM.controller.progressTotal;
    // 百分比
    const ProgressPercent = (Progress / ProgressTotal * 100).toFixed(4);
    // ProgressTotal - Progress 转换成K和M
    const ProgressTotalMinusProgress = ProgressTotal - Progress;
    let ProgressTotalMinusProgressK = ProgressTotalMinusProgress/1000000 > 1 ? `${ProgressTotalMinusProgress/1000000}M` : `${ProgressTotalMinusProgress/1000}K`;
    console.log(`--------- ${ROOM} Level：${RCL} Progress：${ProgressTotalMinusProgressK} ${ProgressTotalMinusProgress} ${ProgressPercent}% ---------`);
    console.log(`AvailableEnergy：${AvailableEnergy} StorageEnergy：${StorageEnergy}`);
    // 获取container数量
    const containerNum = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_CONTAINER;
      }
    }).length;
    ROOM.containerNum = containerNum
    // 每500tick执行一次
    if (Game.time % 500 == 0) {
      // 处理Building
      Building.BuildingManager(ROOM);
    }
    // 处理Creeps
    Creeps(ROOM);
    // 处理攻防
    AttackAndDefense.loop(ROOM)
  }
}

module.exports = room;