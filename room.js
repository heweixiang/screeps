/**
 * 房间管理
 */
const room_static = require('room_static');
const room_mark = require('room_mark');
let ROOM = null
let room = {
  // 房间初始化
  init(room = ROOM) {
    if (typeof room == 'string') {
      ROOM = Game.rooms[room]
    }
    // 初始化爬爬数量
    if (!ROOM.memory.creepNum) {
      ROOM.memory.creepNum = {}
    }
    // 初始化房间task
    if (!ROOM.memory.task) {
      ROOM.memory.task = []
    }
    // 判断房间是否存在消费link列表
    if (!ROOM.memory.consumeLinkList) {
      ROOM.memory.consumeLinkList = []
    }
    // 判断是否存在外矿房配置
    if (!ROOM.memory.outRoom) {
      ROOM.memory.outRoom = {}
    }
    // 判断是否存在中央link
    if (!ROOM.memory.centerLink && ROOM.storage) {
      ROOM.memory.centerLink = {}
      // storage两格内的link
      const centerLink = ROOM.lookForAtArea(LOOK_STRUCTURES, ROOM.storage.pos.y - 2, ROOM.storage.pos.x - 2, ROOM.storage.pos.y + 2, ROOM.storage.pos.x + 2, true).filter((item) => {
        return item.structure.structureType == STRUCTURE_LINK
      })
      centerLink.forEach(item => {
        ROOM.memory.centerLink[item.structure.id] = {
          x: item.pos.x,
          y: item.pos.y
        }
      })
      console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 中央link初始化完成!</font>`);
    }
    // 判断是否存在消费link
    if (!ROOM.memory.consumeLink) {
      ROOM.memory.consumeLink = {}
      // controller一格内的link
      const consumeLink = ROOM.lookForAtArea(LOOK_STRUCTURES, ROOM.controller.pos.y - 1, ROOM.controller.pos.x - 1, ROOM.controller.pos.y + 1, ROOM.controller.pos.x + 1, true).filter((item) => {

        return item.structure.structureType == STRUCTURE_LINK
      })
      consumeLink.forEach(item => {
        ROOM.memory.consumeLink[item.structure.id] = {
          x: item.pos.x,
          y: item.pos.y
        }
      })
      console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 消费link初始化完成!</font>`);
    }
    // 判断是否存在能量矿工位
    if (!ROOM.memory.energyHarvester && ROOM.find(FIND_SOURCES).length > 0) {
      ROOM.memory.energyHarvester = {}
      // 寻找能量矿
      ROOM.find(FIND_SOURCES).forEach((item) => {
        // 寻找能量矿一格内的container
        const energyContainer = ROOM.lookForAtArea(LOOK_STRUCTURES, item.pos.y - 1, item.pos.x - 1, item.pos.y + 1, item.pos.x + 1, true).filter((item) => {
          return item.structure.structureType == STRUCTURE_CONTAINER
        })
        // 如果存在container
        if (energyContainer.length > 0) {
          ROOM.memory.energyHarvester[energyContainer[0].structure.id] = {
            x: energyContainer[0].pos.x,
            y: energyContainer[0].pos.y,
            isCreate: true
          }
        } else {
          // 如果不存在container,寻找一格内的沼泽或平地
          const energyPos = ROOM.lookForAtArea(LOOK_TERRAIN, item.pos.y - 1, item.pos.x - 1, item.pos.y + 1, item.pos.x + 1, true).filter((item) => {
            return item.terrain == 'plain' || item.terrain == 'swamp'
          })
          ROOM.memory.energyHarvester[energyPos[0].x + '-' + energyPos[0].y] = {
            x: energyPos[0].x,
            y: energyPos[0].y
          }
        }
      })
      console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 能量矿工位初始化完成!</font>`);
    }
    // 判断是否存在矿物矿工位
    if (!ROOM.memory.mineralHarvester && ROOM.find(FIND_MINERALS).length > 0) {
      ROOM.memory.mineralHarvester = {}
      // 寻找矿物矿
      ROOM.find(FIND_MINERALS).forEach((item) => {
        // 寻找矿物矿一格内的container
        const mineralContainer = ROOM.lookForAtArea(LOOK_STRUCTURES, item.pos.y - 1, item.pos.x - 1, item.pos.y + 1, item.pos.x + 1, true).filter((item) => {
          return item.structure.structureType == STRUCTURE_CONTAINER
        })
        // 如果存在container
        if (mineralContainer.length > 0) {
          ROOM.memory.mineralHarvester[mineralContainer[0].structure.id] = {
            x: mineralContainer[0].pos.x,
            y: mineralContainer[0].pos.y,
            isCreate: true
          }
        } else {
          // 如果不存在container,寻找一格内的沼泽或平地
          const mineralPos = ROOM.lookForAtArea(LOOK_TERRAIN, item.pos.y - 1, item.pos.x - 1, item.pos.y + 1, item.pos.x + 1, true).filter((item) => {
            return item.terrain == 'plain' || item.terrain == 'swamp'
          })
          ROOM.memory.mineralHarvester[mineralPos[0].x + '-' + mineralPos[0].y] = {
            x: mineralPos[0].x,
            y: mineralPos[0].y
          }
        }
      })
      console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 矿物矿工位初始化完成!</font>`);
    }
    // 给当前是九房、普通、过道打上标记
    if (!ROOM.memory.roomType) {
      // 如果有sourceKeeperLair,则为九房
      if (ROOM.find(FIND_STRUCTURES, { filter: (item) => { return item.structureType == STRUCTURE_KEEPER_LAIR } }).length > 0) {
        ROOM.memory.roomType = 'nukeroom'
      } else {
        // 如果有controller,则为普通房间
        if (ROOM.controller) {
          ROOM.memory.roomType = 'normal'
        } else {
          // 否则为过道
          ROOM.memory.roomType = 'passage'
        }
      }
      console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 房间类型初始化完成!</font>`);
    }
  },
  loop(roomName) {
    ROOM = Game.rooms[roomName];
    try {
      room.init(roomName)
    } catch (error) {
      console.log('error: ', error);
    }
    // 如果房间有终端且终端可用,5T处理一次
    if (ROOM.terminal && ROOM.controller.level >= 6 && ROOM.terminal.cooldown == 0 && Game.time % 5 == 0) {
      try {
        room.mark.loop(ROOM.name)
      } catch (error) {
        console.log('error: ', error);
      }
    }
  }
}

// 将方法合并到room
Object.assign(room, room_static, room_mark);
module.exports = room;