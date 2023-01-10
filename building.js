// 建筑类
const Building = {
  BuildingManager: function (ROOM) {
    // 扫描创建扩展，我的技术前期还是手动创建吧
    // this.createExterior(ROOM);
    // 除了第一个房间，其他房间都需要建造spawn 自动建造spawn

    // 自动给每个矿绑定一个container，如果没有container则自动建造，并在memory绑定矿
    this.createContainer(ROOM);
    // 如果GCL到了8再考虑link挖

    // 构建道路
    this.createRoad(ROOM);
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
    // 确保每个矿绑定了一个
    if (sources.length > containers.length) {
      // 查找当前房间还没有绑定container的矿
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
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
    // 围绕spawn二环建造exterior
  },
  // 构建道路， 该行为较为复杂，需要考虑到房间内的所有建筑，以及房间内的所有矿，以及房间内的所有container
  createRoad: function (ROOM) {
    // 围绕spawn创建道路
    const spawns = ROOM.find(FIND_MY_SPAWNS);
    for (let i = 0; i < spawns.length; i++) {
      const spawn = spawns[i];
      const terrain = ROOM.lookForAtArea(LOOK_TERRAIN, spawn.pos.y - 1, spawn.pos.x - 1, spawn.pos.y + 1, spawn.pos.x + 1, true);
      for (let j = 0; j < terrain.length; j++) {
        const terrainItem = terrain[j];
        if (terrainItem.terrain == 'plain') {
          ROOM.createConstructionSite(terrainItem.x, terrainItem.y, STRUCTURE_ROAD);
        }
      }
    }
    // 围绕spawn创建呈现十字架形状向外延伸道3格的道路
    for (let i = 0; i < spawns.length; i++) {
      const spawn = spawns[i];
      const terrain = ROOM.lookForAtArea(LOOK_TERRAIN, spawn.pos.y - i, spawn.pos.x - i, spawn.pos.y + i, spawn.pos.x + i, true);
      for (let j = 0; j < terrain.length; j++) {
        const terrainItem = terrain[j];
        if (terrainItem.terrain == 'plain') {
          ROOM.createConstructionSite(terrainItem.x, terrainItem.y, STRUCTURE_ROAD);
        }
      }
    }
  }
}
module.exports = Building