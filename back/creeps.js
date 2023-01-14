/**
 * 该文件用于生成处理creeps，接收loop调用
 */

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
// 分配
const ROLE_ASSIGN = 'ROLE_ASSIGN';
// 外矿矿工
const ROLE_EXTERNALMINE_WORKER = 'ROLE_EXTERNALMINE_WORKER';
// 外矿运输者
const ROLE_EXTERNALMINE_TRANSPORTER = 'ROLE_EXTERNALMINE_TRANSPORTER';
// 外矿攻击者
const ROLE_EXTERNALMINE_ATTACKER = 'ROLE_EXTERNALMINE_ATTACKER';
// 外矿治疗者
const ROLE_EXTERNALMINE_HEALER = 'ROLE_EXTERNALMINE_HEALER';
// 外矿预定者
const ROLE_EXTERNALMINE_RESERVER = 'ROLE_EXTERNALMINE_RESERVER';
// 综合工（前期）：采集 > 运输 > 修理 > 升级 > 建造 脏活累活都干
const ROLE_HARVESTER = 'ROLE_HARVESTER';
// 行为
// 采集
const BEHAVIOR_HARVEST = 'BEHAVIOR_HARVEST';
// 运输
const BEHAVIOR_TRANSPORT = 'BEHAVIOR_TRANSPORT';
// 修理
const BEHAVIOR_REPAIR = 'BEHAVIOR_REPAIR';
// 升级
const BEHAVIOR_UPGRADE = 'BEHAVIOR_UPGRADE';
// 建造
const BEHAVIOR_BUILD = 'BEHAVIOR_BUILD';
// 分配
const BEHAVIOR_ASSIGN = 'BEHAVIOR_ASSIGN';
// 攻击
const BEHAVIOR_ATTACK = 'BEHAVIOR_ATTACK';
// 治疗
const BEHAVIOR_HEAL = 'BEHAVIOR_HEAL';
// 预定
const BEHAVIOR_RESERVE = 'BEHAVIOR_RESERVE';



const creepsWorker = require('creepsWorker');

const creeps = (ROOM) => {
  // 获取当前房间空闲spawn
  const spawns = ROOM.find(FIND_MY_SPAWNS).filter(spawn => !spawn.spawning);
  // 获取当前房间的creeps
  const creeps = ROOM.find(FIND_MY_CREEPS);
  logRoomSpawnState(ROOM);

  // 如果没有空闲spawn不执行生成creep 
  if (spawns.length) {
    // 判断当前房间是否属于紧急状态，如果是则不生成creep
    if (!RoomCreepLengthIsSafe(ROOM, spawns[0], creeps)) {
      // 100TICK执行一次
      // if (Game.time % 2 === 0) {
      // 生成creep
      createCreeps(ROOM, spawns, creeps);
      // }
    } else {
      console.log('当前房间Creep数量处于紧急状态！！！');
    }
  }

  // this.createCreep(ROOM);
  // 处理creep工作
  creepsWorker(ROOM, spawns, creeps);
}

function createCreeps(ROOM, spawns, creeps) {

  switch (ROOM.controller.level) {
    default:
    case 8:
    case 7:
    case 6:
    case 5:
    case 4:
      LV4GenerateCreeps(ROOM, spawns, creeps);
      break;
    case 3:
    case 2:
      LV2GenerateCreeps(ROOM, spawns, creeps);
      break;
    case 1:
      LV1GenerateCreeps(ROOM, spawns, creeps);
      break;

  }
}

// RCL4,分配者
function LV4GenerateCreeps(ROOM, spawns, creeps) {
  // 遍历creeps
  const AllCreeps = []
  for (const key in Game.creeps) {
    AllCreeps.push(Game.creeps[key])
  }
  const LV2CreateResult = LV2GenerateCreeps(ROOM, spawns, creeps);
  if (LV2CreateResult === 'no-create') {
    const spawn = spawns[0];
    // 保证有两个分配者
    const assigners = creeps.filter(creep => creep.memory.role === ROLE_ASSIGN);
    // 获取矿数量
    const sources = ROOM.find(FIND_SOURCES);
    if (assigners.length < sources.length + Game.Tools.GetCreepNum(ROOM, '分配')) {
      const body = Game.Config.creep.generateTransporter(ROOM);
      const name = 'TouchFish_分配' + Game.time;
      const config = { memory: { role: ROLE_ASSIGN, behavior: BEHAVIOR_ASSIGN } };
      GenerateCreep(ROOM, spawn, body, name, config);
      return 'create';
    }
    // 分配者饱和后生成判断生成外矿
    // 获取外矿旗子数量
    // 获取key数量
    let flagCount = 0;
    for (const key in Game.flags) {
      flagCount++;
    }
    if (flagCount > 0) {
      // 遍历外矿旗子
      for (const key in Game.flags) {
        const flag = Game.flags[key];
        // 获取外矿旗子所在房间
        const flagRoomConfig = Memory.externalmineRoom ? Memory.externalmineRoom[flag.pos.roomName] : null
        // 判断外矿旗子所在房间是否有外矿,是否被探索过了
        if (flagRoomConfig && flagRoomConfig.sourceCount && flagRoomConfig.sourceCount > 0) {
          // 存在视野
          // 获取外矿攻击者数量
          const externalmineAttackers = AllCreeps.filter(creep => creep.memory.role === ROLE_EXTERNALMINE_ATTACKER && creep.memory.bindRoom === flag.pos.roomName);
          // 获取外矿治疗者数量
          const externalmineHealers = AllCreeps.filter(creep => creep.memory.role === ROLE_EXTERNALMINE_HEALER && creep.memory.bindRoom === flag.pos.roomName);
          // 如果该外矿没有攻击者
          if (externalmineAttackers.length === 0) {
            // 生成外矿攻击者
            const body = Game.Config.creep.generateAttacker(ROOM);
            const name = 'TouchFish_外矿攻击者' + Game.time;
            const config = { memory: { role: ROLE_EXTERNALMINE_ATTACKER, behavior: BEHAVIOR_ATTACK, bindRoom: flag.pos.roomName } };
            GenerateCreep(ROOM, spawn, body, name, config);
            return 'create';
          }
          // // 如果该外矿没有治疗者
          // if (externalmineHealers.length === 0) {
          //   // 生成外矿治疗者
          //   const body = Game.Config.creep.generateHealer(ROOM);
          //   const name = 'TouchFish_外矿治疗者' + Game.time;
          //   const config = { memory: { role: ROLE_EXTERNALMINE_HEALER, behavior: BEHAVIOR_HEAL, bindRoom: flag.pos.roomName } };
          //   GenerateCreep(ROOM, spawn, body, name, config);
          //   return 'create';
          // }
          // 创建外矿房间外矿数量个矿工
          const externalmineWorkers = AllCreeps.filter(creep => creep.memory.role === ROLE_EXTERNALMINE_WORKER && creep.memory.bindRoom === flag.pos.roomName);
          // 获取外矿运输者数量
          const externalmineTransporters = AllCreeps.filter(creep => creep.memory.role === ROLE_EXTERNALMINE_TRANSPORTER && creep.memory.bindRoom === flag.pos.roomName);
          // 如果运输者数量小于矿工数量
          if (externalmineTransporters.length < 1) {
            // 生成运输者
            const body = Game.Config.creep.generateTransporter(ROOM);
            const name = 'TouchFish_外矿运输' + Game.time;
            const config = { memory: { role: ROLE_EXTERNALMINE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT, bindRoom: flag.pos.roomName } };
            GenerateCreep(ROOM, spawn, body, name, config);
            return 'create';
          }
          if (externalmineWorkers.length < flagRoomConfig.sourceCount) {
            const body = Game.Config.creep.generateHarvester(ROOM);
            const name = 'TouchFish_外矿矿工' + Game.time;
            const config = { memory: { role: ROLE_EXTERNALMINE_WORKER, behavior: BEHAVIOR_HARVEST, bindRoom: flag.pos.roomName } };
            GenerateCreep(ROOM, spawn, body, name, config);
            return 'create';
          }
          // 获取外矿预定者数量
          const externalmineReservers = AllCreeps.filter(creep => creep.memory.role === ROLE_EXTERNALMINE_RESERVER && creep.memory.bindRoom === flag.pos.roomName);
          // 如果该外矿没有预定者
          if (externalmineReservers.length === 0) {
            // 生成外矿预定者
            const body = Game.Config.creep.generateClaimer(ROOM);
            const name = 'TouchFish_外矿预定者' + Game.time;
            const config = { memory: { role: ROLE_EXTERNALMINE_RESERVER, behavior: BEHAVIOR_RESERVE, bindRoom: flag.pos.roomName } };
            GenerateCreep(ROOM, spawn, body, name, config);
            return 'create';
          }

        } else if (!flagRoomConfig && !Memory.externalmineRoom[flag.pos.roomName]) {
          // 不存在视野
          // 创建一个外矿矿工
          const body = Game.Config.creep.generateHarvester(ROOM);
          const name = 'TouchFish_外矿矿工' + Game.time;
          const config = { memory: { role: ROLE_EXTERNALMINE_WORKER, behavior: BEHAVIOR_HARVEST, bindRoom: flag.pos.roomName } };
          GenerateCreep(ROOM, spawn, body, name, config);
          return 'create';
        }
      }
    }
  }
  return 'no-create';
}

// RCL2，这时候在优先满足RCL1设定下就可以开始生成RCL2的creep了
function LV2GenerateCreeps(ROOM, spawns, creeps) {
  // 保留LV1时的设定，优先满足LV1时的需求
  const LV1CreateResult = LV1GenerateCreeps(ROOM, spawns, creeps);
  if (LV1CreateResult === 'no-create') {
    const spawn = spawns[0];
    // 获取当前建造者数量
    const builders = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_BUILD);
    // 获取当前维护者数量
    const repairers = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_REPAIR);
    // 获取当前矿物采集者数量
    const harvesters = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_HARVEST);
    // 获取防御塔数量
    const towers = ROOM.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
    // 获取分配者数量
    const assigners = creeps.filter(creep => creep.memory.role === ROLE_ASSIGN);
    // 如果维护者数量小于采集者数量，生成维护者    如果有塔和分配者就不生成维护者，浪费资源
    if (repairers.length < harvesters.length && towers.length < 1 && assigners.length < 1) {
      const body = Game.Config.creep.generateInitialWorker(ROOM);
      const name = 'TouchFish_维护' + Game.time;
      const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_REPAIR } };
      GenerateCreep(ROOM, spawn, body, name, config);
      return 'create';
    }
    // 获取需要维护的建筑，血量小于50%
    const repairTargets = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.hits < structure.hitsMax * 0.5;
      }
    });
    // 如果维护者数量小于建筑数量，生成维护者
    if (repairers.length < repairTargets.length / 2 && repairers.length < 3 || repairers.length < repairTargets.length + Game.Tools.GetCreepNum(ROOM, '维护')) {
      if (towers.length < 1 && assigners.length < 1) {
        const body = Game.Config.creep.generateInitialWorker(ROOM);
        const name = 'TouchFish_维护' + Game.time;
        const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_REPAIR } };
        GenerateCreep(ROOM, spawn, body, name, config);
        return 'create';
      }
    }
    // 获取工地数量
    const constructionSites = ROOM.find(FIND_CONSTRUCTION_SITES);
    // 以上都满足就大力发展基建
    if (builders.length < constructionSites.length + Game.Tools.GetCreepNum(ROOM, '建造') && builders.length < 2) {
      const body = Game.Config.creep.generateInitialWorker(ROOM);
      const name = 'TouchFish_建造' + Game.time;
      const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_BUILD } };
      GenerateCreep(ROOM, spawn, body, name, config);
      return 'create';
    }
  } else {
    return 'create'
  }
  return 'no-create';
}

// 虽说是RCL1，其实是基础保证，RCL2时也要保证且优先满足
function LV1GenerateCreeps(ROOM, spawns, creeps) {
  const spawn = spawns[0];
  // 采集者 behavior = BEHAVIOR_HARVEST
  const harvesters = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_HARVEST);
  // 获取运输工数量
  const transporters = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_TRANSPORT);
  // 升级者，专注于升级，但必要时也会采集运输应急使用
  const upgraders = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_UPGRADE);
  // 获取矿物数量
  const sources = ROOM.find(FIND_SOURCES);
  // 有几个采集者就生成几个运输者
  if (transporters.length < 1 + Game.Tools.GetCreepNum(ROOM, '运输')) {
    const body = Game.Config.creep.generateTransporter(ROOM);
    const name = 'TouchFish_运输' + Game.time;
    const config = { memory: { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT } };
    GenerateCreep(ROOM, spawn, body, name, config);
    return 'create';
  }
  // 有几个矿物就生成几个采集者
  if (harvesters.length < sources.length + Game.Tools.GetCreepNum(ROOM, '采集')) {
    const body = Game.Config.creep.generateHarvester(ROOM);
    const name = 'TouchFish_采集' + Game.time;
    const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_HARVEST } };
    GenerateCreep(ROOM, spawn, body, name, config);
    return 'create';
  }
  // 有几个矿物就生成几个升级者
  if (upgraders.length < 1 + Game.Tools.GetCreepNum(ROOM, '升级')) {
    const body = Game.Config.creep.generateInitialWorker(ROOM);
    const name = 'TouchFish_升级' + Game.time;
    const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_UPGRADE } };
    GenerateCreep(ROOM, spawn, body, name, config);
    return 'create';
  }
  return 'no-create'
}

// 如果当前房间Creep处于紧急状态
function RoomCreepLengthIsSafe(ROOM, spawn, creeps) {
  // 存在一个矿工，一个运输工
  // 获取矿工数量
  const harvesters = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_HARVEST);
  // 获取运输工数量
  const transporters = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_TRANSPORT);
  if (harvesters.length < 1) {
    // 加急生成矿工
    const body = Game.Config.creep.generateHarvester(ROOM, true);
    const name = 'TouchFish_采集' + Game.time;
    const config = { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_HARVEST } };
    GenerateCreep(ROOM, spawn, body, name, config);
    return true
  } else if (transporters.length < 1) {
    // 加急生成运输工
    const body = Game.Config.creep.generateTransporter(ROOM, true);
    const name = 'TouchFish_运输' + Game.time;
    const config = { memory: { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT } };
    GenerateCreep(ROOM, spawn, body, name, config);
    return true
  }
  return false
}

// 接管创建creep，方便控制台输出了解详情
function GenerateCreep(ROOM, spawn, body, name, config) {
  config.memory.createRoom = ROOM.name;
  // 正则移除name后面的数值
  const nameZN = name.replace(/\d+$/, '');
  // 获取当前爬爬生成需要的能量
  const computedResult = Game.Tools.ComputerCreepCost(body, ROOM);
  if (computedResult.CanGenerate === true) {
    const SpawnCreateResult = spawn.spawnCreep(body, name, config);
    if (SpawnCreateResult === OK) {
      console.log(`生成爬爬成功【${nameZN}】【${body.length}模块】，本次消耗 ${computedResult.NeedEnergy} 能量`);
      return true
    } else {
      console.log(`生成爬爬失败【${nameZN}】【${body.length}模块】，生成需要 ${computedResult.NeedEnergy} 能量,当前房间能量：${computedResult.AvailableEnergy} ...`);
      return false
    }
  } else if (computedResult.CanGenerate === false) {
    console.log(`即将生成爬爬【${nameZN}】【${body.length}模块】，预计还需要 ${computedResult.LackEnergy} 能量,当前房间能量：${computedResult.AvailableEnergy} ...`);
    return false
  }
}

// 输出当前房间状态
function logRoomSpawnState(ROOM) {
  // 所有spawn状态
  const spawns = ROOM.find(FIND_MY_SPAWNS);
  // 该房间的spawn孵化状态
  let HatchingState = '孵化状态：';
  for (const spawn in spawns) {
    HatchingState = HatchingState + "【Spawn" + spawn + (!!spawns[spawn].spawning ? '-孵化中' : '-空闲') + "】"
    if (spawns[spawn].spawning) {
      HatchingState = HatchingState + `【Name：${spawns[spawn].spawning.name}】【Time：${spawns[spawn].spawning.remainingTime}】`
    }
  }
  HatchingState += '\n'
  // 输出当前是否有附加爬爬
  // 循环输出该对象ROOM.memory.CreepNum
  for (const creep in ROOM.memory.CreepNum) {
    HatchingState += `${creep}附加：${ROOM.memory.CreepNum[creep]}个 `
  }
  console.log(HatchingState);
}

module.exports = creeps;