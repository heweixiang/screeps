// 建筑类
const Building = {
  BuildingManager: function (ROOM) {
    // 扫描创建扩展
    this.createExterior(ROOM);
    // 除了第一个房间，其他房间都需要建造spawn 自动建造spawn

    // 自动给每个矿绑定一个container，如果没有container则自动建造，并在memory绑定矿
    this.createContainer(ROOM);
    // 如果GCL到了8再考虑link挖
  },
  // 创建绑定矿的container
  createContainer: function (ROOM) {
    // 获取当前房间的矿
    const sources = ROOM.find(FIND_SOURCES);
    // 获取当前房间的container
    const containers = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_CONTAINER;
      }
    });
    // 获取当前房间的link
    // const links = ROOM.find(FIND_STRUCTURES, {
    //   filter: (structure) => {
    //     return structure.structureType == STRUCTURE_LINK;
    //   }
    // });
    // 查找当前房间还没有绑定container的矿
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if(!source.containerId) {
        // 搜索3*3范围内的container
        const container = source.pos.findInRange(containers, 1);
        console.log('container: ', container);

      }





      // 遍历container，如果container.memory.sourceId == source.id，则跳过
      let flag = false;
      for (let j = 0; j < containers.length; j++) {
        const container = containers[j];
        if (container.memory.sourceId == source.id) {
          flag = true;
          break;
        }
      }
      // 如果没有被绑定，则绑定
      if (!flag) {
        // 获取矿的周围3*3的空地.
        const sourceAround = ROOM.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true)
        // 在空地中找到第一个可用的位置
        for (let k = 0; k < sourceAround.length; k++) {
          const pos = sourceAround[k];
          if (pos.terrain == 'plain') {
            // 在该位置创建container并绑定矿
            ROOM.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
            // 获取刚刚创建的container
            const newContainer = ROOM.lookForAt(LOOK_STRUCTURES, pos.x, pos.y)[0];
            break;
          }
        }
      }
    }
  },
  // 创建exterior，必须建满exterior才能建立container
  createExterior: function (ROOM) {
    // RCL
    const RCL = ROOM.controller.level;
    // 获取当前最大允许的exterior数量
    const maxExterior = Game.Config.RCL['LV' + RCL].Extension || 0;
    // 获取当前房间已有的exterior数量
    const currentExterior = ROOM.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_EXTENSION;
      }
    }).length
    if (currentExterior < maxExterior) {
      // 在矿点附近7格内寻找空地
      const sources = ROOM.find(FIND_SOURCES);
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        // 获取矿点附近7格内的空地
        const terrain = ROOM.lookForAtArea(LOOK_TERRAIN, source.pos.y - 5, source.pos.x - 5, source.pos.y + 5, source.pos.x + 5, true);
        // 遍历空地，找到第一个可用的位置
        for (let j = 0; j < terrain.length; j++) {
          const terrainItem = terrain[j];
          if (terrainItem.terrain == 'plain') {
            // 找到第一个可用的位置，开始创建
            const result = ROOM.createConstructionSite(terrainItem.x, terrainItem.y, STRUCTURE_EXTENSION);
            if (result == OK) {
              console.log('创建exterior成功');
              // 此处退出为了防止在一个矿点附近创建多个exterior，下个轮询再创建下一个矿点的exterior，这样可以保证每个矿点都有一个及以上exterior
              break;
            }
          }
        }
      }
    }
  },
  // 获取该房间spanwn位置
  getSpawnPosition: function () {
    // ...
  }



}
module.exports = Building