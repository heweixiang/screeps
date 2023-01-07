/**
 * 该文件用于生成处理creeps，接收loop调用
 */
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

var creeps = {
  // 该行由tick重复调用
  main(ROOM) {
    // 所有spawn状态
    const spawns = Game.spawns;
    // 该房间的spawn孵化状态
    let HatchingState = '孵化状态：';
    for (const spawn in spawns) {
      HatchingState = HatchingState + "【" + spawn + (!!spawns[spawn].spawning ? '-孵化中' : '-空闲') + "】"
    }
    console.log(HatchingState);
    for (let name in Game.creeps) {
      const creep = Game.creeps[name];
      // 
      if (creep.memory.role == 'harvester' || creep.memory.role == 'transporter' || creep.memory.role == 'repairer') {
        roleHarvester.run(creep, ROOM);
      }
      if (creep.memory.role == 'upgrader') {
        roleUpgrader.run(creep, ROOM);
      }
      if (creep.memory.role == 'builder') {
        roleBuilder.run(creep, ROOM);
      }
    }
    // 生成creep
    this.createCreep(ROOM);
  },
  // 生成creep
  createCreep(ROOM) {
    let CreepLength = {}
    let CreepNameGroup = {}
    // 统计各种creep数量
    for (let name in Game.creeps) {
      let creep = Game.creeps[name];
      if (CreepLength[creep.memory.role]) {
        CreepLength[creep.memory.role]++
      } else {
        CreepLength[creep.memory.role] = 1
      }
      // 正则去除末尾数字
      const splitName = creep.name.replace(/\d+$/g, '').replace(/_/g, '').replace(/TouchFish-/g, '');
      if (CreepNameGroup[splitName] == undefined) {
        CreepNameGroup[splitName] = 1
      } else {
        CreepNameGroup[splitName]++
      }
    }
    // 获取建筑工地数量
    const ConstructionSites = ROOM.find(FIND_CONSTRUCTION_SITES);
    // 输出各种creep数量
    let creepsGroupLen = '';
    for (const key in CreepNameGroup) {
      creepsGroupLen = creepsGroupLen + "【" + key + ":" + CreepNameGroup[key] + "】"
    }
    console.log('creepsGroupLen: ', creepsGroupLen);

    // 获取当前房间空闲spawn
    const spawns = ROOM.find(FIND_MY_SPAWNS);
    // 当前房间没有空闲ROOM跳过生成
    if (spawns.length == 0) {
      return;
    }
    // 有一个收集器创建一个
    if (ROOM.containerNum > 0 && (CreepNameGroup['5model修理工爬爬'] || 0) < (ROOM.containerNum + 1) / 2) {
      const spawnCreepResult = spawns[0].spawnCreep(Game.Config.creep['5modelRepairer'], '5model修理工爬爬_' + Game.time, { memory: { role: 'repairer' } });
      if (spawnCreepResult == OK) {
        console.log("【生成反馈】5model修理工爬爬：" + '生成5model修理工爬爬成功');
      } else {
        console.log("【生成反馈】5model修理工爬爬：" + JSON.stringify(Game.Tools.ComputerCreepCost(Game.Config.creep['5modelRepairer'], ROOM)));
      }
      // 停止下面的生成，此处优先级高
      return false
    }
    // 有三个以上收集器就创建三个矿工， 暂时防止出问题
    if (ROOM.containerNum > 2 && (CreepNameGroup['5model矿工爬爬'] || 0) < ROOM.containerNum) {
      const spawnCreepResult = spawns[0].spawnCreep(Game.Config.creep['5modelHarvester'], '5model矿工爬爬_' + Game.time, { memory: { role: 'harvester' } });
      if (spawnCreepResult == OK) {
        console.log("【生成反馈】5model矿工爬爬：" + '生成5model矿工爬爬成功');
      } else {
        console.log("【生成反馈】5model矿工爬爬：" + JSON.stringify(Game.Tools.ComputerCreepCost(Game.Config.creep['5modelHarvester'], ROOM)));
      }
      // 停止下面的生成，此处优先级高
      return false
    }

    // 创建对应运输工
    if (ROOM.containerNum > 3 && (CreepNameGroup['5model运输爬爬'] || 0) < ROOM.containerNum) {
      const spawnCreepResult = spawns[0].spawnCreep(Game.Config.creep['5modelTransporter'], '5model运输爬爬_' + Game.time, { memory: { role: 'transporter' } });
      if (spawnCreepResult == OK) {
        console.log("【生成反馈】5model运输爬爬：" + '生成5model运输爬爬成功');
      } else {
        console.log("【生成反馈】5model运输爬爬：" + JSON.stringify(Game.Tools.ComputerCreepCost(Game.Config.creep['5modelHarvester'], ROOM)));
      }
      // 停止下面的生成，此处优先级高
      return false
    }

    // 下面是新手区保命用的代码，初始三矿工，三升级，三建筑
    // 生成creep 不是正在生成creep的情况下
    if (spawns.length > 0) {
      // 优先级： 大头兵 > 矿工 > 升级爬爬 > 建造爬爬
      if (!CreepLength.harvester || CreepLength.harvester < 3) {
        const spawnCreepResult = spawns[0].spawnCreep(Game.Config.creep.baseCreep, '3model矿工爬爬_' + Game.time, { memory: { role: 'harvester' } });
        if (spawnCreepResult == OK) {
          console.log("【生成反馈】3model矿工爬爬：" + '生成3model矿工爬爬成功');
        } else {
          console.log("【生成反馈】3model矿工爬爬：" + JSON.stringify(Game.Tools.ComputerCreepCost(Game.Config.creep['5modelHarvester'], ROOM)));
        }
      } else if (!CreepLength.upgrader || CreepLength.upgrader < 3) {
        const spawnCreepResult = spawns[0].spawnCreep(Game.Config.creep.baseCreep, '3model升级爬爬_' + Game.time, { memory: { role: 'upgrader' } });
        if (spawnCreepResult == OK) {
          console.log("【生成反馈】3model升级爬爬：" + '生成3model升级爬爬成功');
        } else {
          console.log("【生成反馈】3model升级爬爬：" + JSON.stringify(Game.Tools.ComputerCreepCost(Game.Config.creep['5modelHarvester'], ROOM)));
        }
      } else if ((!CreepLength.builder || CreepLength.builder < 3) && ConstructionSites.length > 0) {
        const spawnCreepResult = spawns[0].spawnCreep(Game.Config.creep.baseCreep, '3model建造爬爬_' + Game.time, { memory: { role: 'builder' } });
        if (spawnCreepResult == OK) {
          console.log("【生成反馈】3model建造爬爬：" + '生成3model建造爬爬成功');
        } else {
          console.log("【生成反馈】3model建造爬爬：" + JSON.stringify(Game.Tools.ComputerCreepCost(Game.Config.creep['5modelHarvester'], ROOM)));
        }
      }
    }
  }
}

module.exports = creeps;