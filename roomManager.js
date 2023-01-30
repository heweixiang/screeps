// 此程序针对于ROOM循环，每个房间都会执行一次，所以在这里我们可以获取到当前房间的信息，然后根据当前房间的信息来生成不同的creep

const createCreep = require('createCreep')
const creepWrok = require('creepWrok')
const autoCreateBuilding = require('autoCreateBuilding')
const roomBuildingWrok = require('roomBuildingWrok')
const roomManager = {
  // 两种房间，一种是有spawn的占领房间，一种是没有spawn的外矿房间
  loop(Room) {
    // 处理房间初始化挂载查询问题，将一些定下来的值挂载到房间上，避免多次查询
    this.roomInit(Room);
    // 处理房间建筑
    autoCreateBuilding.loop(Room);
    logRoomInfo(Room);
    // 如果房间有spawn
    this.ownRoom(Room);
    // 如果房间没有spawn
    if (!Room.find(FIND_MY_SPAWNS).length) {
      // 外矿房间
      this.outRoom(Room);
    }
    // 处理房间内存
    this.roomMemory(Room);
  },
  // 房间初始化,只能存ID位置
  roomInit(Room) {
    // ================= 判断房间内存是否存在storageLink =================
    if (!Room.memory.storageLink && Room.storage) {
      // 获取storage 3*3 范围内的link
      const storageLink = Room.storage.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: (structure) => {
          return structure.structureType == STRUCTURE_LINK;
        }
      })
      if (storageLink.length) Room.memory.storageLink = storageLink[0].id
    }

    // ================= 创建房间中心点，中心布局 =================
    if (!Room.memory.center && Room.controller && Room.controller.my) {
      // 如果有storage就以storage为中心，如果没有就以spawn[0]左两格为中心
      let center = Room.storage ? Room.storage.pos : Room.find(FIND_MY_SPAWNS)[0] ? Room.find(FIND_MY_SPAWNS)[0].pos : null
      // 生成中心点
      let generateCenter = getRoomDeepCenter(Room)
      if (center === null) {
        center = generateCenter
      } else {
        center.max = generateCenter.max
      }
      Room.memory.center = center
    }

    // ================= 中心点十格以内标记为内能量 =================
    if (!Room.memory.centerSource && Room.controller && Room.controller.my) {
      Room.memory.centerSource = []
      Room.memory.otherSource = []
      // 获取中心点十格以内的能量
      const centerPos = new RoomPosition(Room.memory.center.x, Room.memory.center.y, Room.name)
      const centerSource = centerPos.findInRange(FIND_SOURCES, 10)
      // 如果有能量就挂载到内存中
      if (centerSource.length) {
        centerSource.forEach((item, index) => {
          Room.memory.centerSource.push(item.id)
        })
      }
      // 获取其它能量
      const otherSource = Room.find(FIND_SOURCES, {
        filter: (source) => {
          return !Room.memory.centerSource.includes(source.id)
        }
      })
      // 如果有能量就挂载到内存中
      if (otherSource.length) {
        otherSource.forEach((item, index) => {
          Room.memory.otherSource.push(item.id)
        })
      }
    }

    // ================= 扫描给各个otherSource挂上link ==============
    if (Room.memory.otherSource && Room.memory.otherSourceLink < Room.memory.otherSource && Room.controller && Room.controller.my || !Room.memory.otherSourceLink && Room.memory.otherSource) {
      if (!Room.memory.otherSourceLink) Room.memory.otherSourceLink = {}
      Room.memory.otherSource.map((item, index) => {
        if (Room.memory.otherSourceLink[index]) return
        const source = Game.getObjectById(item)
        const sourceLink = source.pos.findInRange(FIND_STRUCTURES, 3, {
          filter: (structure) => {
            return structure.structureType == STRUCTURE_LINK;
          }
        })
        if (sourceLink.length) {
          Room.memory.otherSourceLink[index] = sourceLink[0].id
        }
      })
    }

    // ================= 给房间内建筑也挂上memory ==============
    {
      // 不需要上内存的建筑
      const notMemoryBuilding = [STRUCTURE_ROAD, STRUCTURE_EXTENSION, STRUCTURE_RAMPART, STRUCTURE_WALL]
      // 判断房间内存是否存在building
      if (!Room.memory.building) Room.memory.building = {}
      // 扫描房间内除了道路和extension外的建筑
      const building = Room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return !notMemoryBuilding.includes(structure.structureType) && structure.memory == undefined && structure.id && structure.my
        }
      })
      // 给房间内存挂载building
      building.forEach((item, index) => {
        // 如果房间内存中没有该建筑，就挂载，如果有就回显
        if (!Room.memory.building[item.id]) {
          building[index].memory = {}
        } else {
          building[index].memory = Room.memory.building[item.id]
        }
      })
      // 如果房间内存中有建筑，但是房间中没有，就删除
      for (let key in Room.memory.building) {
        if (!building.find((item) => item.id == key)) {
          delete Room.memory.building[key]
        }
      }
    }
  },
  // 房间内存处理
  roomMemory(Room) {
    // ================ 将房间内存中的建筑挂载到房间中 ================
    {
      // 有内存的建筑
      const building = Room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.memory != undefined && structure.id && structure.my
        }
      })
      // 给房间内存挂载building
      building.forEach((item, index) => {
        // 如果房间内存中没有该建筑，就挂载，如果有就回显
        if (!Room.memory.building[item.id]) {
          Room.memory.building[item.id] = {}
        } else {
          Room.memory.building[item.id] = item.memory
        }
      })
    }
  },
  // 非可控房间
  outRoom(Room) {
    // 获取该房间的creep
    const creeps = Room.find(FIND_MY_CREEPS);
    // 如果该房间没有creep
    if (creeps.length) {
      // 创建creep
      creepWrok.loop(creeps);
    }
  },
  // 可控房间
  ownRoom(Room) {
    createCreep.loop(Room);
    // 获取该房间的creep
    const creeps = Room.find(FIND_MY_CREEPS);
    // 如果该房间没有creep
    if (creeps.length) {
      // 创建creep
      creepWrok.loop(creeps);
    }
    roomBuildingWrok.loop(Room);
  }
}

// 获取房间最深处中心点
function getRoomDeepCenter(room) {
  // 获取房间地形
  const terrain = new Room.Terrain(room.name);
  // 获取房间中心点
  let center = null
  // 判断房间内存是否存在center
  if (room.memory.center) {
    center = room.memory.center
  } else {
    // 如果房间内存中没有center，就获取房间中心点
    // 获取房间地形数组中最深处的点
    let max = 0
    let maxPos = null
    let terrainArr = []
    // 遍历每行标记墙体为0
    for (let y = 0; y < 50; y++) {
      terrainArr[y] = []
      for (let x = 0; x < 50; x++) {
        if (terrain.get(x, y) == TERRAIN_MASK_WALL || x == 0 || x == 49 || y == 0 || y == 49) {
          terrainArr[y][x] = 0
        } else {
          terrainArr[y][x] = null
        }
      }
    }

    // 墙体多层泛洪
    let count = 0
    let isNull = false
    do {
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          if (terrainArr[y][x] == count) {
            // 上
            if (y > 0 && (terrainArr[y - 1][x] === null || terrainArr[y - 1][x] > terrainArr[y][x] + 1)) {

              terrainArr[y - 1][x] = terrainArr[y][x] + 1
            }
            // 下
            if (y < 49 && (terrainArr[y + 1][x] === null || terrainArr[y + 1][x] > terrainArr[y][x] + 1)) {
              terrainArr[y + 1][x] = terrainArr[y][x] + 1
            }
            // 左
            if (x > 0 && (terrainArr[y][x - 1] === null || terrainArr[y][x - 1] > terrainArr[y][x] + 1)) {
              terrainArr[y][x - 1] = terrainArr[y][x] + 1
            }
            // 右
            if (x < 49 && (terrainArr[y][x + 1] === null || terrainArr[y][x + 1] > terrainArr[y][x] + 1)) {
              terrainArr[y][x + 1] = terrainArr[y][x] + 1
            }
          }
        }
      }
      // 获取terrainArr是否有null
      isNull = terrainArr.some((item) => {
        return item.some((item) => {
          return item === null
        })
      })
      count++
    } while (isNull && count < 49);
    // 获取最深处的点
    for (let y = 0; y < 50; y++) {
      // 输出行
      for (let x = 0; x < 50; x++) {
        if (terrainArr[y][x] > max) {
          max = terrainArr[y][x]
          maxPos = new RoomPosition(x, y, room.name)
        }
      }
    }
    // 如果没有平原+沼泽最深的点，就以controller为中心
    if (maxPos === null) {
      maxPos = room.controller.pos
    }
    maxPos.max = max
    center = maxPos
  }
  return center
}

function logRoomInfo(Room) {
  const RCL = Room.controller ? Room.controller.level : 0
  const StorageEnergy = Room.storage ? Room.storage.store[RESOURCE_ENERGY] : 0;
  // 获取当前房间升级进度
  const Progress = Room.controller ? Room.controller.progress : 0;
  // 获取当前房间升级进度总量
  const ProgressTotal = Room.controller ? Room.controller.progressTotal : 0;
  // 百分比
  const ProgressPercent = (Progress / ProgressTotal * 100).toFixed(4);
  // 房间是否有敌军
  const Hostile = Room.find(FIND_HOSTILE_CREEPS).length > 0 || Room.find(FIND_HOSTILE_STRUCTURES).length > 0;
  let ProgressLog
  if (+ProgressPercent) {
    ProgressLog = `   <font color='${['red', '#f66b00', 'orange', 'green'][Math.floor(ProgressPercent / 25)]}'>UP：${+ProgressPercent ? ProgressPercent : -1}%</font>`;
  } else {
    ProgressLog = ''
  }
  Memory.log += `\n  <font color='${Hostile ? 'red' : 'green'}'>${Room.name}</font>   RCL：${RCL}${ProgressLog}   Storage：${StorageEnergy}`
  Memory.sendText += `\n  <font color='${Hostile ? 'red' : 'green'}'>${Room.name}</font>   RCL：${RCL}${ProgressLog}   Storage：${StorageEnergy}`
  if (RCL > 0 && Room.memory.OutRoom && Room.memory.OutRoom.length > 0) {
    // 外矿房间列表
    Memory.log += `   外矿：${Room.memory.OutRoom || []}`
    Memory.sendText += `   外矿：${Room.memory.OutRoom || []}`
  }
  roomCreepInfoLog(Room);
}


function roomCreepInfoLog(Room) {
  // 获取房间所有爬爬
  let creeps = Room.find(FIND_MY_CREEPS);
  const creepsNameList = creeps.map(creep => creep.name.replace(/\d+$/, '').replace('TouchFish_', '').replace(/【/g, '[').replace(/】/g, ']'));
  const creepsNameListCount = {};
  creepsNameList.forEach(name => {
    creepsNameListCount[name] = creepsNameListCount[name] ? creepsNameListCount[name] + 1 : 1;
  });
  const creepsNameListCountStr = JSON.stringify(creepsNameListCount).replace(/,/g, '  ').replace(/:/g, '：').replace(/"/g, '').replace(/{/g, '').replace(/}/g, '');
  Memory.log += `\n  Creep：${creeps.length}   CreepList：${creepsNameListCountStr}`
  Memory.sendText += `  Creep：${creeps.length}`
  // 所有spawn状态
  const spawns = Room.find(FIND_MY_SPAWNS);
  let HatchingState = ''
  for (let i in spawns) {
    const spawn = spawns[i];
    HatchingState = HatchingState + (!!spawn.spawning ? '💓' : '💚')
    if (spawn.spawning) {
      HatchingState = HatchingState + `${spawn.spawning.name.replace(/\d+$/, '').replace('TouchFish_', '')}>>>${spawn.spawning.remainingTime}`
    }
  }
  if (HatchingState) {
    Memory.log += `\n  ${HatchingState}`
  }
  // 输出附加爬爬
  if (Room.memory.CreepNum) {
    let addCreepStr = `<font color='yellow'>  调整: </font>`;
    for (const iterator in Room.memory.CreepNum) {
      if (Room.memory.CreepNum[iterator] === 0) continue
      addCreepStr += iterator + "：" + Room.memory.CreepNum[iterator] + "   "
    }
    if (addCreepStr.length > 6) {
      Memory.log += addCreepStr;
    }
  }
}

module.exports = roomManager;