/**
 * 该文件用于生成处理creeps，接收loop调用
 */
const creepsWorker = require('creepsWorker');

const creeps = (ROOM) => {
  // 获取当前房间空闲spawn
  const spawns = ROOM.find(FIND_MY_SPAWNS).filter(spawn => !spawn.spawning);
  // 获取当前房间的creeps
  const creeps = ROOM.find(FIND_MY_CREEPS);
  logRoomSpawnState(ROOM);
  // 生成creep
  createCreeps(ROOM, spawns, creeps);
  // this.createCreep(ROOM);
  // 处理creep工作
  creepsWorker(ROOM, spawns, creeps);
}

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
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

function createCreeps(ROOM, spawns, creeps) {
  // 如果没有空闲spawn不执行生成creep
  if (!spawns.length) {
    return;
  }
  // RCL1时，综合工 * 3 （两个升级，一个采集）
  if (ROOM.controller.level === 1) {
    LV1GenerateCreeps(ROOM, spawns, creeps);
  }
  // RCL过高时记得兼容低版本，比如当前没那么多钱造高级creep，就造低级creep
  if (ROOM.controller.level < 4) {
    LV2GenerateCreeps(ROOM, spawns, creeps);
  }


}

// RCL2
function LV2GenerateCreeps(ROOM, spawns, creeps) {
  // 保留LV1时的设定，优先满足LV1时的需求
  const LV1CreateResult = LV1GenerateCreeps(ROOM, spawns, creeps);
  if (LV1CreateResult === 'no-create') {
    const spawn = spawns[0];
    // 获取当前建造者数量
    const builders = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_BUILD);
    // 如果建造者数量小于2，生成建造者
    if (builders.length < 2) {
      const SpawnCreateResult = spawn.spawnCreep(Game.Config.creep.generateInitialWorker(ROOM), 'TouchFish_建造' + Game.time, { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_BUILD } });
      if (SpawnCreateResult === OK) {
        console.log('RCL2_生成建造爬爬成功');
      } else {
        console.log('RCL2_生成建爬爬失败');
      }
    }
  }
}

// 优先保证RCL1时，综合工 * 3 （两个升级，一个采集）
function LV1GenerateCreeps(ROOM, spawns, creeps) {
  const spawn = spawns[0];
  // 采集者 behavior = BEHAVIOR_HARVEST
  const harvesters = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_HARVEST);
  // 升级者 behavior = BEHAVIOR_UPGRADE
  const upgraders = creeps.filter(creep => creep.memory.behavior === BEHAVIOR_UPGRADE);
  // 获取矿物数量
  const sources = ROOM.find(FIND_SOURCES);
  // 保证有一个采集者
  if (harvesters.length < 1) {
    // 此处使用最基础的生成防止一个爬爬都没有
    const SpawnCreateResult = spawn.spawnCreep([WORK, CARRY, MOVE], 'TouchFish_采集' + Game.time, { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_HARVEST } });
    if (SpawnCreateResult === OK) {
      console.log('RCL1_生成采集爬爬成功');
    } else {
      console.log('RCL1_生成采集爬爬失败');
    }
    return 'create'
  } else if (upgraders.length < 2) {
    // 保证有两个升级者
    // 此处使用最基础的生成防止一个爬爬都没有
    const SpawnCreateResult = spawn.spawnCreep([WORK, CARRY, MOVE], 'TouchFish_升级' + Game.time, { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_UPGRADE } });
    if (SpawnCreateResult === OK) {
      console.log('RCL1_生成升级爬爬成功');
    } else {
      console.log('RCL1_生成升级爬爬失败');
    }
    return 'create'
  } else if (creeps.length < sources.length * 2 + 2) {
    if (harvesters.length < (sources.length * 2 + 2) / 2) {
      // 保证有五个采集者
      const SpawnCreateResult = spawn.spawnCreep(Game.Config.creep.generateInitialWorker(ROOM), 'TouchFish_采集' + Game.time, { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_HARVEST } });
      if (SpawnCreateResult === OK) {
        console.log('RCL1_生成采集爬爬成功');
      } else {
        console.log('RCL1_生成采集爬爬失败');
      }
    } else {
      // 保证有6个综合工
      const SpawnCreateResult = spawn.spawnCreep(Game.Config.creep.generateInitialWorker(ROOM), 'TouchFish_升级' + Game.time, { memory: { role: ROLE_HARVESTER, behavior: BEHAVIOR_UPGRADE } });
      if (SpawnCreateResult === OK) {
        console.log('RCL1_生成升级爬爬成功');
      } else {
        console.log('RCL1_生成升级爬爬失败');
      }
    }
    return 'create'
  }
  return 'no-create'
}

// 输出当前房间状态
function logRoomSpawnState(ROOM) {
  // 所有spawn状态
  const spawns = ROOM.find(FIND_MY_SPAWNS);
  // 该房间的spawn孵化状态
  let HatchingState = '孵化状态：';
  for (const spawn in spawns) {
    HatchingState = HatchingState + "【Spawn" + spawn + (!!spawns[spawn].spawning ? '-孵化中' : '-空闲') + "】"
  }
  console.log(HatchingState);
}

module.exports = creeps;