// 自动建筑
const autoCreateBuilding = {
  loop(Room) {
    // 创建extension
    this.createExtension(Room);
    // 创建road
    this.createRoad(Room);
    // 如果房间没有spawn
    if (!Room.find(FIND_MY_SPAWNS).length) {
      // 外矿房间
      return;
    }
  },
  createExtension(Room) {
    // 获取该房间RCL
    const RCL = Room.controller ? Room.controller.level : 0;
    if (Room.memory.extensionBuild < RCL) {
      return;
    } else {
      Room.memory.extensionBuild = RCL;
    }
    // 获取该房间spawn坐标
    const spawn = Room.find(FIND_MY_SPAWNS)[0];
    // 获取该房间extension
    const extensions = Room.find(FIND_MY_STRUCTURES, {
      filter: {
        structureType: STRUCTURE_EXTENSION
      }
    });
    // 获取该房间允许的extension数量
    const extensionNum = Game.Config.RCL["LV" + RCL].Extension;
    if (Room.controller && spawn && extensions.length < extensionNum) {
      for (let x = 0; x <= RCL * 2; x++) {
        for (let y = 0; y <= RCL * 2; y++) {
          if (!createRoad(x, y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标是否有建筑
            const structures = Room.lookForAt(LOOK_STRUCTURES, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标建筑工地
            const constructionSites = Room.lookForAt(LOOK_CONSTRUCTION_SITES, spawn.pos.x + x, spawn.pos.y + y);
            // 三者都没有则创建extension
            if (terrain[0].terrain !== "wall" && structures.length === 0 && constructionSites.length === 0) {
              Room.createConstructionSite(spawn.pos.x + x, spawn.pos.y + y, STRUCTURE_EXTENSION);
            }
          }
          y = -y
          if (!createRoad(x, y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标是否有建筑
            const structures = Room.lookForAt(LOOK_STRUCTURES, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标建筑工地
            const constructionSites = Room.lookForAt(LOOK_CONSTRUCTION_SITES, spawn.pos.x + x, spawn.pos.y + y);
            // 三者都没有则创建extension
            if (terrain[0].terrain !== "wall" && structures.length === 0 && constructionSites.length === 0) {
              Room.createConstructionSite(spawn.pos.x + x, spawn.pos.y + y, STRUCTURE_EXTENSION);
            }
          }
          y = -y
          x = -x
          if (!createRoad(x, y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标是否有建筑
            const structures = Room.lookForAt(LOOK_STRUCTURES, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标建筑工地
            const constructionSites = Room.lookForAt(LOOK_CONSTRUCTION_SITES, spawn.pos.x + x, spawn.pos.y + y);
            // 三者都没有则创建extension
            if (terrain[0].terrain !== "wall" && structures.length === 0 && constructionSites.length === 0) {
              Room.createConstructionSite(spawn.pos.x + x, spawn.pos.y + y, STRUCTURE_EXTENSION);
            }
          }
          y = -y
          if (!createRoad(x, y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标是否有建筑
            const structures = Room.lookForAt(LOOK_STRUCTURES, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标建筑工地
            const constructionSites = Room.lookForAt(LOOK_CONSTRUCTION_SITES, spawn.pos.x + x, spawn.pos.y + y);
            // 三者都没有则创建extension
            if (terrain[0].terrain !== "wall" && structures.length === 0 && constructionSites.length === 0) {
              Room.createConstructionSite(spawn.pos.x + x, spawn.pos.y + y, STRUCTURE_EXTENSION);
            }
          }
          x = -x
          y = -y
        }
      }
    }
  },
  createRoad(Room) {
    // 获取该房间RCL
    const RCL = Room.controller ? Room.controller.level : 0;
    if (Room.memory.roadBuild < RCL) {
      return;
    } else {
      Room.memory.roadBuild = RCL;
    }
    // 获取该房间spawn坐标
    const spawn = Room.find(FIND_MY_SPAWNS)[0];
    if (Room.controller && spawn) {
      for (let x = -RCL * 2; x <= RCL * 2; x++) {
        for (let y = -RCL * 2; y <= RCL * 2; y++) {
          if (createRoad(x, y)) {
            // 创建道路
            Room.createConstructionSite(spawn.pos.x + x, spawn.pos.y + y, STRUCTURE_ROAD);
          }
        }
      }
    }
  }
}

// 传入坐标判断是否生成道路
function createRoad(x, y) {
  if (x === 0 || y === 0) {
    return true;
  }
  if (Math.abs(x) === 1 && Math.abs(y) === 1) {
    return true;
  }
  if (Math.abs(x) % 2 === 1 && Math.abs(y) <= Math.abs(x) || Math.abs(y) % 2 === 1 && Math.abs(x) <= Math.abs(y)) {
    return true;
  }
  return false;
}


module.exports = autoCreateBuilding;