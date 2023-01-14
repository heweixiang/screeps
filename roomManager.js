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


}
module.exports = roomManager;