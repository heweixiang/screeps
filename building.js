// 建筑类
const Building = {
  BuildingManager: function (ROOM) {
    // 扫描创建扩展，我的技术前期还是手动创建吧
    if (ROOM.controller.level >= 2) {
      // 构建道路
      this.createRoad(ROOM);
      // 优先构建道路
      this.createExterior(ROOM);
    }
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
    // 获取当前房间的RCL
    const RCL = ROOM.controller;
    sources.push(RCL)
    // 确保每个矿绑定了一个
    if (sources.length > containers.length) {
      // 查找当前房间还没有绑定container的矿
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        // 3*3范围内的container
        const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
          filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTAINER;
          }
        });
        // 如果有container则跳过
        if (container.length > 0) {
          continue;
        }
        // 查找资源X+1是否存在空地
        let terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x + 1, source.pos.y);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x + 1, source.pos.y, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源X-1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x - 1, source.pos.y);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x - 1, source.pos.y, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源Y+1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x, source.pos.y + 1);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x, source.pos.y + 1, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源Y-1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x, source.pos.y - 1);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x, source.pos.y - 1, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源X+1Y+1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x + 1, source.pos.y + 1);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x + 1, source.pos.y + 1, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源X-1Y-1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x - 1, source.pos.y - 1);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x - 1, source.pos.y - 1, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源X-1Y+1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x - 1, source.pos.y + 1);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x - 1, source.pos.y + 1, STRUCTURE_CONTAINER);
          continue;
        }
        // 查找资源X+1Y-1是否存在空地
        terrain = Game.map.getRoomTerrain(ROOM.name).get(source.pos.x + 1, source.pos.y - 1);
        if (!terrain) {
          // 如果存在空地，就在空地上建造container
          ROOM.createConstructionSite(source.pos.x + 1, source.pos.y - 1, STRUCTURE_CONTAINER);
          continue;
        }
      }
    }
  },
  // 创建exterior，必须建满exterior才能建立container
  createExterior: function (ROOM) {
    // 获取当前支持的exterior数量
    const extCount = Game.Config.RCL['LV' + ROOM.controller.level].Extension;
    // 获取当前房间的exterior
    const exts = ROOM.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return structure.structureType == STRUCTURE_EXTENSION;
      }
    });
    // 如果当前房间的exterior数量小于支持的数量，则继续建造
    if (exts.length < extCount) {
      // 由内向外查找空地
      for (let i = 1; i < 10; i++) {

      }
    }
  },
  // 构建道路， 该行为较为复杂，需要考虑到房间内的所有建筑，以及房间内的所有矿，以及房间内的所有container
  createRoad: function (ROOM) {
    // 首先建立spawn到所有container的道路
    // 获取当前房间的spawn
    const spawns = ROOM.find(FIND_MY_SPAWNS);
    const RCL = ROOM.controller.level > 5 ? 5 : ROOM.controller.level;
    for (let spawnIndex = 0; spawnIndex < spawns.length; spawnIndex++) {
      // 如果RCL2以上
      if (RCL >= 2) {
        // 简历5*5的星状道路
        for (let i = -(RCL + 1); i <= (RCL + 1); i++) {
          for (let j = -(RCL + 1); j <= (RCL + 1); j++) {
            if (Math.abs(i) === Math.abs(j) && !(i === j && i === 0)
              || Math.abs(i) % 2 === 1 && Math.abs(j) % 2 === 1
              || (Math.abs(i) % 2 === 1 && j === 0)
              || (Math.abs(j) % 2 === 1 && i === 0)
              || (Math.abs(i) === 5 && Math.abs(j) === 2)
              || (Math.abs(j) === 5 && Math.abs(i) === 2)
              ) {
              // 如果是空地
              if (!Game.map.getRoomTerrain(ROOM.name).get(spawns[spawnIndex].pos.x + i, spawns[spawnIndex].pos.y + j)) {
                ROOM.createConstructionSite(spawns[spawnIndex].pos.x + i, spawns[spawnIndex].pos.y + j, STRUCTURE_ROAD);
              }
            }
          }
        }
      }
    }
  }
}
module.exports = Building