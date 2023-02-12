/**
 * 房间建筑管理
 */

const build = {
  loop(roomName) {
    // 自动创建工位
    createWorkStation(roomName)

  }
}

// 自动创建工位
function createWorkStation(roomName) {
  const ROOM = Game.rooms[roomName]
  // 获取  energyHarvester 工位
  const energyHarvester = ROOM.memory.energyHarvester
  if (!ROOM.memory.isInitEnergyHarvester && Object.keys(energyHarvester).length > 0 && ROOM.memory.roomType !== 'nukeroom') {
    // 遍历对象
    for (let key in energyHarvester) {
      if (!energyHarvester[key].isCreate) {
        // 创建container
        const result = ROOM.createConstructionSite(energyHarvester[key].x, energyHarvester[key].y, STRUCTURE_CONTAINER)
      }
    }
    ROOM.memory.isInitEnergyHarvester = true
  }
  // 获取  energyHarvester 工位
  const mineralHarvester = ROOM.memory.mineralHarvester
  if (ROOM.controller.level >= 6 && !ROOM.memory.isInitTerminal && Object.keys(mineralHarvester).length > 0 && ROOM.memory.roomType !== 'nukeroom') {
    // 遍历对象
    for (let key in mineralHarvester) {
      if (!mineralHarvester[key].isCreate) {
        // 创建container
        const result = ROOM.createConstructionSite(mineralHarvester[key].x, mineralHarvester[key].y, STRUCTURE_CONTAINER)
      }
    }
    ROOM.memory.isInitTerminal = true
  }
}

module.exports = build