// 此程序针对于ROOM循环，每个房间都会执行一次，所以在这里我们可以获取到当前房间的信息，然后根据当前房间的信息来生成不同的creep

const createCreep = require('createCreep')
const creepWrok = require('creepWrok')
const autoCreateBuilding = require('autoCreateBuilding')
const roomManager = {
  // 两种房间，一种是有spawn的占领房间，一种是没有spawn的外矿房间
  loop(Room) {

    // 如果房间没有spawn
    if (!Room.find(FIND_MY_SPAWNS).length) {
      // 外矿房间
      this.outRoom(Room);
      return
    }
    // 如果房间有spawn
    this.ownRoom(Room);
  },
  // 非可控房间
  outRoom(Room) {
    logRoomInfo(Room);
    // 获取该房间的creep
    const creeps = Room.find(FIND_MY_CREEPS);
    // 如果该房间没有creep
    if (creeps.length) {
      // 创建creep
      creepWrok.loop(creeps);
    }
    autoCreateBuilding.loop(Room);
  },
  // 可控房间
  ownRoom(Room) {
    logRoomInfo(Room);
    createCreep.loop(Room);
    // 获取该房间的creep
    const creeps = Room.find(FIND_MY_CREEPS);
    // 如果该房间没有creep
    if (creeps.length) {
      // 创建creep
      creepWrok.loop(creeps);
    }
    autoCreateBuilding.loop(Room);
  }
}

function logRoomInfo(Room) {
  const RCL = Room.controller.level;
  const AvailableEnergy = Room.energyAvailable;
  const StorageEnergy = Room.storage ? Room.storage.store[RESOURCE_ENERGY] : 0;
  // 获取当前房间升级进度
  const Progress = Room.controller ? Room.controller.progress : 0;
  // 获取当前房间升级进度总量
  const ProgressTotal = Room.controller ? Room.controller.progressTotal : 0;
  // 百分比
  const ProgressPercent = (Progress / ProgressTotal * 100).toFixed(4);
  // ProgressTotal - Progress 转换成K和M
  const ProgressTotalMinusProgress = ProgressTotal - Progress;
  let ProgressTotalMinusProgressK = ProgressTotalMinusProgress / 1000000 > 1 ? `${ProgressTotalMinusProgress / 1000000}M` : `${ProgressTotalMinusProgress / 1000}K`;
  console.log(`<font color="${RCL > 0 ? '#00FF00' : 'yellow'}"> ${Room}   房间等级：${RCL}   升级还需：${ProgressTotalMinusProgressK.includes('NaN') ? -1 : ProgressTotalMinusProgressK}   ${ProgressTotalMinusProgress || -1}点   ${ProgressPercent.includes('NaN') ? -1 : ProgressPercent}%   当前可用能量：${AvailableEnergy}   Storage存储：${StorageEnergy}</font>`);
  // 所有spawn状态
  const spawns = Room.find(FIND_MY_SPAWNS);
  let HatchingState = ''
  for (let i in spawns) {
    const spawn = spawns[i];
    HatchingState = HatchingState + "<font color='#8bf600'>【" + spawn + (!!spawn.spawning ? '-孵化中' : '-空闲') + "】</font>"
    if (spawn.spawning) {
      HatchingState = HatchingState + `<font color='#f6c100'>【爬爬名：${spawn.spawning.name}】【需要：${spawn.spawning.remainingTime}Tick】</font>`
    }
  }
  if (!HatchingState) HatchingState = '没有spawn'
  console.log(HatchingState);
  roomCreepInfoLog(Room);
}


function roomCreepInfoLog(Room) {
  // 获取房间所有爬爬
  let creeps = Room.find(FIND_MY_CREEPS);
  const creepsNameList = creeps.map(creep => creep.name.replace(/\d+$/, '').replace('TouchFish_', ''));
  const creepsNameListCount = {};
  creepsNameList.forEach(name => {
    creepsNameListCount[name] = creepsNameListCount[name] ? creepsNameListCount[name] + 1 : 1;
  });
  console.log(`爬爬数量：${creeps.length}，爬爬列表：${JSON.stringify(creepsNameListCount)}`);
  // 输出附加爬爬
  if (Room.memory.CreepNum) {
    let addCreepStr = '手动附加: ';
    for (const iterator in Room.memory.CreepNum) {
      if (Room.memory.CreepNum[iterator] === 0) continue
      addCreepStr += iterator + "：" + Room.memory.CreepNum[iterator] + "   "
    }
    if (addCreepStr.length > 5) {
      console.log(addCreepStr);
    }
  }
}

module.exports = roomManager;