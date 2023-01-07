/**
 * 工具文件，改文件用于整合各种工具，但每个文件下面都有staticTools，用于存放静态工具
 * Game.tools
 */
const Config = require('config');

const tools = {
  // 传入一个定义的creep配置，返回生成所需消耗的能量，以及当前是否可以生成 CreepConfigArray生成配置 ROOM房间对象
  ComputerCreepCost(CreepConfigArray, ROOM) {
    let AvailableEnergy = ROOM.energyAvailable;
    // 计算生成所需消耗的能量
    let NeedEnergy = 0;
    for (let i = 0; i < CreepConfigArray.length; i++) {
      NeedEnergy += BODYPART_COST[CreepConfigArray[i]];
    }
    // 返回生成所需消耗的能量，以及当前是否可以生成，以及当前可用能量
    return {
      NeedEnergy,
      CanGenerate: AvailableEnergy >= NeedEnergy,
      // 还差多少能量
      LackEnergy: NeedEnergy - AvailableEnergy
    };
  }
}

module.exports = tools;