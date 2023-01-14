/**
 * 针对房间管理
 */
// 引入循环生成Creeps
const Creeps = require('creeps');
// 引入BuildingManager
const Building = require('building');
// 引入attackAndDefense
const AttackAndDefense = require('attackAndDefense');
// 引入resourceManager
const ResourceManagement = require('resourceManagement');

const room = {
  // 该行由tick重复调用
  roomManager(ROOM) {
    // ROOM controller level
    const RCL = ROOM.controller ? ROOM.controller.level || 0 : 0;
    // 获取当前房间可用能量
    const AvailableEnergy = ROOM.energyAvailable;
    // 获取房间storage剩余能量
    const StorageEnergy = ROOM.storage ? ROOM.storage.store[RESOURCE_ENERGY] : 0;
    // 获取container总容量
    const ContainerEnergy = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_CONTAINER;
      }
    }).reduce((sum, container) => {
      return sum + container.store[RESOURCE_ENERGY];
    }, 0);
    // 获取当前房间升级进度
    const Progress = ROOM.controller ? ROOM.controller.progress : 0;
    // 获取当前房间升级进度总量
    const ProgressTotal = ROOM.controller ? ROOM.controller.progressTotal : 0;
    // 百分比
    const ProgressPercent = (Progress / ProgressTotal * 100).toFixed(4);
    // ProgressTotal - Progress 转换成K和M
    const ProgressTotalMinusProgress = ProgressTotal - Progress;
    let ProgressTotalMinusProgressK = ProgressTotalMinusProgress / 1000000 > 1 ? `${ProgressTotalMinusProgress / 1000000}M` : `${ProgressTotalMinusProgress / 1000}K`;
    console.log(`<font color="${RCL > 0 ? '#00FF00' : 'yellow'}">--------- ${ROOM} Level：${RCL} Progress：${ProgressTotalMinusProgressK.includes('NaN') ? -1 : ProgressTotalMinusProgressK} ${ProgressTotalMinusProgress || -1} ${ProgressPercent.includes('NaN') ? -1 : ProgressPercent}% ---------</font>`);
    console.log(`AvailableEnergy：${AvailableEnergy} StorageEnergy：${StorageEnergy} ContainerEnergy：${ContainerEnergy}`);
    // 获取container数量
    const containerNum = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_CONTAINER;
      }
    }).length;
    ROOM.containerNum = containerNum
    // 获取房间旗子
    const flag = ROOM.find(FIND_FLAGS);
    // 每500tick执行一次
    if (Game.time % 500 == 0 && ROOM.controller && flag) {
      // 处理Building
      Building.BuildingManager(ROOM);
    }
    // 处理Creeps
    Creeps(ROOM);
    ResourceManagement.loop(ROOM)
    if (ROOM.controller) {
      // 处理攻防
      AttackAndDefense.loop(ROOM)
    }
  }
}

// TODO 整合房间输出函数

module.exports = room;