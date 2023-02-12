/**
 * 房间管理
 */
const room_static = require('room_static');
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

    ROOM.memory.init = true;
    console.log(`<font color="#00FF00">TouchFishRoomInt ===> 房间 ${ROOM.name} 初始化完成!</font>`);
  },
  loop(roomName) {
    ROOM = Game.rooms[roomName];
    if (!ROOM.memory.init) {
      room.init()
    }

  }
}

// 将静态方法合并到room
Object.assign(room, room_static);
module.exports = room;