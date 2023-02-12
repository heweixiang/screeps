// 此程序针对于ROOM循环，每个房间都会执行一次，所以在这里我们可以获取到当前房间的信息，然后根据当前房间的信息来生成不同的creep

const createCreep = require('createCreep')
const creepWrok = require('creepWrok')
const autoCreateBuilding = require('autoCreateBuilding')
const roomBuildingWrok = require('roomBuildingWrok')
const MarkManger = require('markManger');

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
    MarkManger.loop(Room);
  },
  // 房间初始化,只能存ID位置
  roomInit(Room) {
    /**
      {
        owner：Invader（九房）aisle（过道）其他玩家
        storageLink：storageLink的ID
        center：中心点 max：中心点最大范围
        centerSource：中心点能量ID
        otherSource：其他能量ID
        otherSourceLink：其他能量linkID
        haveInvaderCore：是否有入侵核心
        extractor：矿物提取点
        // 外部房间需要被捡起的资源
        CollectTask: [
          {
            taskId: 任务ID
            pos：资源位置，
            id：资源ID
            type：资源类型
            roomName：房间名
            saveName: 保存房间名
            functionName: 捡起资源的函数名
            state: 0 未绑定 1 已绑定
            storeCount 保存数量
            order: 优先级
            creepName: creep名字
          }
        ],
        TERMINAL_TASK: [
          {
            taskId: 任务ID
            targetRoomName: 目标房间名
            roadCost: 路费
            type: 资源类型
            count: 资源数量
            state: 0 待准备 1 在准备
            remark：备注
            order: 优先级
          }
        ]
      }
    */
    if (!Room.memory.TerminalTask) {
      Room.memory.TerminalTask = [];
    }

    if (!Room.memory.CollectTask) {
      Room.memory.CollectTask = [];
    }
    // ================= 更新该房间的拥有者 =================
    if (Room.controller && (!Room.memory.owner || Room.controller.owner !== Room.memory.owner)) {
      // 及时更新所有者
      Room.memory.owner = Room.controller.owner;
      if (!Room.memory.extractor) {
        // 标记STRUCTURE_EXTRACTOR位置
        const extractor = Room.find(FIND_STRUCTURES, {
          filter: (structure) => {
            return structure.structureType == STRUCTURE_EXTRACTOR;
          }
        })
        if (extractor.length) {
          Room.memory.extractor = extractor[0].pos
        }
      }
    } else if (!Room.controller && !Room.memory.owner) {
      // 如果没有controller就是九房或者过道
      // 如果房间名第三位和第六位数值相加取余10小于等与2就是九房
      if (parseInt(Room.name[2]) + parseInt(Room.name[5]) % 10 <= 2) {
        Room.memory.owner = "Invader";
        if (!Room.memory.extractor) {
          // 标记STRUCTURE_EXTRACTOR位置
          const extractor = Room.find(FIND_STRUCTURES, {
            filter: (structure) => {
              return structure.structureType == STRUCTURE_EXTRACTOR;
            }
          })
          if (extractor.length) {
            Room.memory.extractor = extractor[0].pos
          }
        }
      } else {
        Room.memory.owner = "aisle";
        // TODO 扫描沉积物和power
      }
    }
    // ================= 判断房间内存是否存在storageLink =================
    if (Game.time % 1000 === 0 && !Room.memory.storageLink && Room.storage && Room.controller.my && Room.controller.level > 4) {
      // 获取storage 3*3 范围内的link 1000T扫描一次
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
    if (Room.controller && Room.controller.my && Game.time % 1000 === 0 && (Room.memory.otherSourceLink.length < Room.memory.otherSource.length || !Room.memory.otherSourceLink)) {
      if (!Room.memory.otherSourceLink) Room.memory.otherSourceLink = {}
      Room.memory.otherSource.map((item, index) => {
        if (Room.memory.otherSourceLink[item.id]) return
        const source = Game.getObjectById(item)
        const sourceLink = source.pos.findInRange(FIND_STRUCTURES, 3, {
          filter: (structure) => {
            return structure.structureType == STRUCTURE_LINK;
          }
        })
        if (sourceLink.length) {
          Room.memory.otherSourceLink[item.id] = sourceLink[0].id
        }
      })
    }
    // ================= 扫描haveInvaderCore ==============
    if (Game.time % 200 === 0) {
      const invaderCore = Room.find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.structureType == STRUCTURE_INVADER_CORE;
        }
      })
      if (invaderCore.length) {
        Room.memory.haveInvaderCore = Game.time
      } else {
        Room.memory.haveInvaderCore = 0
      }
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
    // 如果房间内有非NPC的攻击性creep就开启安全模式
    const hostileCreeps = Room.find(FIND_HOSTILE_CREEPS, {
      filter: (creep) => {
        return creep.owner.username !== 'Invader' && creep.body.some((item) => {
          return item.type === ATTACK || item.type === RANGED_ATTACK
        })
      }
    })
    if (hostileCreeps.length && !Room.controller.safeMode) {
      Room.controller.activateSafeMode()
    }

    createCreep.loop(Room);
    // 获取该房间的creep
    const creeps = Room.find(FIND_MY_CREEPS);
    // 如果该房间没有creep
    if (creeps.length) {
      // 创建creep
      creepWrok.loop(creeps);
    }
    roomBuildingWrok.loop(Room);
    // 扫描添加creep创建任务
    // if (Game.time % 5 === 0) {
    //   createCreepTaskWrok(Room);
    // }
  }
}

// 矿工：只能一辈子在Container上挖矿不可移动
const ROLE_WORKER = 'ROLE_WORKER';
// 运输者：一辈子东奔西走运输资源
const ROLE_TRANSPORTER = 'ROLE_TRANSPORTER';
// 哥布林
const ROLE_GOBLIN = 'ROLE_GOBLIN';
// 分配
const ROLE_ASSIGN = 'ROLE_ASSIGN';
// 一体机 供外矿使用
const ROLE_ALL_IN_ONE = 'ROLE_ALL_IN_ONE';
// 外矿治疗者
const ROLE_EXTERNALMINE_HEALER = 'ROLE_EXTERNALMINE_HEALER';
// 管理者
const ROLE_MANAGER = 'ROLE_MANAGER';
// 综合工（前期）：采集 > 运输 > 修理 > 升级 > 建造 脏活累活都干
const ROLE_HARVESTER = 'ROLE_HARVESTER';
// 行为
// 采集
const BEHAVIOR_HARVEST = 'BEHAVIOR_HARVEST';
// 矿物采集
const BEHAVIOR_HARVEST_MINERAL = 'BEHAVIOR_HARVEST_MINERAL';
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
// ROLE_ALL_IN_ONE
const BEHAVIOR_ALL_IN_ONE = 'BEHAVIOR_ALL_IN_ONE';
// 攻击
const BEHAVIOR_ATTACK = 'BEHAVIOR_ATTACK';
// 治疗
const BEHAVIOR_HEAL = 'BEHAVIOR_HEAL';
// 预定
const BEHAVIOR_RESERVE = 'BEHAVIOR_RESERVE';
// 占领
const BEHAVIOR_CLAIM = 'BEHAVIOR_CLAIM';
// 扫描创建creep
function createCreepTaskWrok(Room) {
  const AddCreateCreep = Game.Tools.AddCreateCreep
  /**
   * 基本原则：
   *  1、运转 > 守卫 > 入侵 > 外矿 > 帮忙
   * 优先级规则： 0、最最高级 > 1、最高级 > 2、高级 > 3、中级 > 4、低级 > 5、最低级
   * ！！！注意：优先级规则是从低到高，数字越大优先级越低！！！时刻都要判断紧急模式
   */
  // 获取所有该房间创建的creep 不包括 50 tick内过世的creep
  const roomCreep = Game.creeps.filter((x) => x.memory.createRoom == Room.name).filter((x) => x.ticksToLive > 20);
  // 如果createCreepTaskList中的creepname在roomCreep中存在，则删除该任务
  Room.memory.createCreepTaskList.forEach((x) => {
    if (roomCreep.find((y) => y.name == x.name)) {
      Room.memory.createCreepTaskList.splice(Room.memory.createCreepTaskList.indexOf(x), 1);
    }
  });
  // 获取该房间创建任务列表
  const createCreepTaskList = Room.memory.createCreepTaskList;
  // 整合creepList 其中都包含memory和body
  const creepList = roomCreep.concat(createCreepTaskList);
  // TODO 自动占领 0,1 四人小队
  // 分配者 2
  // 每个房间内固定 2 个分配者
  // 获取分配者数量
  const assignCount = creepList.filter((x) => x.memory.role == ROLE_ASSIGN && (!x.memory.bindRoom || x.memory.bindRoom === Room.name)).length;
  // 创建该任务
  if (assignCount < 2) {
    // 创建分配者
    AddCreateCreep(Room, 'generateTransporter', { role: ROLE_ASSIGN, behavior: BEHAVIOR_ASSIGN }, 'as_' + Room.name + '_' + Game.time, { priority: assignCount < 1 ? 2 : 3 })
  }
  // 守卫 3
  // 矿工 4
  // 每个房间固定矿物数量的矿工
  // 获取矿工数量（能量矿）
  const harvesterCount = creepList.filter((x) => x.memory.role == ROLE_WORKER && (!x.memory.bindRoom || x.memory.bindRoom === Room.name)).length;
  // 获取矿物数量（能量矿）
  const sourceCount = Room.memory.centerSource.length + Room.memory.otherSource.length;
  // 创建该任务
  if (harvesterCount < sourceCount) {
    // 创建矿工
    AddCreateCreep(Room, 'generateHarvester', { role: ROLE_WORKER, behavior: BEHAVIOR_HARVEST }, 'hv_' + Room.name + '_' + Game.time, { priority: 4 })
  }
  // 运输 5
  // 每个房间运输者数量和outherSource数量一致
  // 获取运输者数量
  const transporterCount = creepList.filter((x) => x.memory.role == ROLE_TRANSPORTER && (!x.memory.bindRoom || x.memory.bindRoom === Room.name)).length;
  // 创建该任务
  if (transporterCount < Room.memory.otherSource.length) {
    // 创建运输者
    AddCreateCreep(Room, 'generateTransporter', { role: ROLE_TRANSPORTER, behavior: BEHAVIOR_TRANSPORT }, 'tr_' + Room.name + '_' + Game.time, { priority: 5 })
  }
  // 外矿守卫 6
  // 外矿矿工 7
  // 与外矿房间矿物数量一致
  // 获取外矿房间
  const otherRoom = Room.memory.otherRoom;
  // 外矿运输 8
  // 外矿预定 9
  // TODO 哥布林
  // 帮建 10
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