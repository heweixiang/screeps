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
      if (creep.memory.role == 'harvester') {
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
    this.generateCreep();
  },
  // 判断是否需要生成creep
  generateCreep() {
    this.createCreep();
  },
  // 生成creep
  createCreep() {
    let CreepLength = {}
    // 统计各种creep数量
    for (let name in Game.creeps) {
      let creep = Game.creeps[name];
      if (CreepLength[creep.memory.role]) {
        CreepLength[creep.memory.role]++
      } else {
        CreepLength[creep.memory.role] = 1
      }
    }
    // 获取建筑工地数量
    const ConstructionSites = Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES);

    // 输出各种creep数量
    console.log('矿工爬爬：' + (CreepLength['harvester'] || 0) + '    升级爬爬：' + (CreepLength['upgrader'] || 0) + '    建造爬爬：' + (CreepLength['builder'] || 0));

    // 生成creep 不是正在生成creep的情况下
    if (!Game.spawns['Spawn1'].spawning) {
      // 优先级： 大头兵 > 矿工 > 升级爬爬 > 建造爬爬
      if (!CreepLength.harvester || CreepLength.harvester < 3) {
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], '矿工爬爬' + Game.time, { memory: { role: 'harvester' } });
      } else if (!CreepLength.upgrader || CreepLength.upgrader < 3) {
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], '升级爬爬' + Game.time, { memory: { role: 'upgrader' } });
      } else if (!CreepLength.builder || CreepLength.builder < 2 && ConstructionSites.length > 0) {
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], '建造爬爬' + Game.time, { memory: { role: 'builder' } });
      }
    }
  }
}

module.exports = creeps;