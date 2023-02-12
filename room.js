/**
 * 房间管理
 */
const room_static = require('room_static');
const room_mark = require('room_mark');
let ROOM = null
let room = {
  // 房间初始化
  init(room = ROOM) {
    console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 开始初始化!</font>`);
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

    ROOM.memory.init = true;
    console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 初始化完成!</font>`);
  },
  loop(roomName) {
    ROOM = Game.rooms[roomName];
    if (!ROOM.memory.init) {
      try {
        room.init()
      } catch (error) {
        console.log('error: ', error);
      }
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

// 将静态方法合并到room
Object.assign(room, room_static);
// 将市场方法合并到room
Object.assign(room, room_mark);
module.exports = room;