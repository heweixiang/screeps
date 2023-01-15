// 自动建筑
const autoCreateBuilding = {
  loop(Room) {
    // 创建extension
    this.createExtension(Room);
    // 创建road
    this.createRoad(Room);
    // 创建tower
    this.createTower(Room);
    // 创建container
    this.createContainer(Room);
    // 如果房间没有spawn
    if (!Room.find(FIND_MY_SPAWNS).length) {
      // 外矿房间
      return;
    }
  },
  // 创建container
  createContainer(Room) {
    // 获取所有的source
    const sources = Room.find(FIND_SOURCES);
    // 遍历所有的source
    for (const source of sources) {
      // 获取source周围的container
      const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (structure) => {
          return structure.structureType == STRUCTURE_CONTAINER;
        }
      });
      // 如果container数量大于0
      if (containers.length > 0) {
        // 跳过
        continue;
      }
      // 获取source周围的工地
      const constructionSites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
        filter: (structure) => {
          return structure.structureType == STRUCTURE_CONTAINER;
        }
      });
      // 如果工地数量大于0
      if (constructionSites.length > 0) {
        // 跳过
        continue;
      }
      // 获取source周围的空地
      // 获取上面是否为空地或者沼泽
      const terrainTop = Room.lookForAt(LOOK_TERRAIN, source.pos.x, source.pos.y - 1);
      // 获取右边是否为空地或者沼泽
      const terrainRight = Room.lookForAt(LOOK_TERRAIN, source.pos.x + 1, source.pos.y);
      // 获取下面是否为空地或者沼泽
      const terrainBottom = Room.lookForAt(LOOK_TERRAIN, source.pos.x, source.pos.y + 1);
      // 获取左边是否为空地或者沼泽
      const terrainLeft = Room.lookForAt(LOOK_TERRAIN, source.pos.x - 1, source.pos.y);
      // 如果上面为空地或者沼泽
      if (terrainTop[0] == "plain" || terrainTop[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x, source.pos.y - 1, STRUCTURE_CONTAINER);
        continue;
      }
      // 如果右边为空地或者沼泽
      if (terrainRight[0] == "plain" || terrainRight[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x + 1, source.pos.y, STRUCTURE_CONTAINER);
        continue;
      }
      // 如果下面为空地或者沼泽
      if (terrainBottom[0] == "plain" || terrainBottom[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x, source.pos.y + 1, STRUCTURE_CONTAINER);
        continue;
      }
      // 如果左边为空地或者沼泽
      if (terrainLeft[0] == "plain" || terrainLeft[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x - 1, source.pos.y, STRUCTURE_CONTAINER);
        continue;
      }
      // 获取左上
      const terrainTopLeft = Room.lookForAt(LOOK_TERRAIN, source.pos.x - 1, source.pos.y - 1);
      // 获取右上
      const terrainTopRight = Room.lookForAt(LOOK_TERRAIN, source.pos.x + 1, source.pos.y - 1);
      // 获取左下
      const terrainBottomLeft = Room.lookForAt(LOOK_TERRAIN, source.pos.x - 1, source.pos.y + 1);
      // 获取右下
      const terrainBottomRight = Room.lookForAt(LOOK_TERRAIN, source.pos.x + 1, source.pos.y + 1);
      // 如果左上为空地或者沼泽
      if (terrainTopLeft[0] == "plain" || terrainTopLeft[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x - 1, source.pos.y - 1, STRUCTURE_CONTAINER);
        continue;
      }
      // 如果右上为空地或者沼泽
      if (terrainTopRight[0] == "plain" || terrainTopRight[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x + 1, source.pos.y - 1, STRUCTURE_CONTAINER);
        continue;
      }
      // 如果左下为空地或者沼泽
      if (terrainBottomLeft[0] == "plain" || terrainBottomLeft[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x - 1, source.pos.y + 1, STRUCTURE_CONTAINER);
        continue;
      }
      // 如果右下为空地或者沼泽
      if (terrainBottomRight[0] == "plain" || terrainBottomRight[0] == "swamp") {
        // 创建container
        Room.createConstructionSite(source.pos.x + 1, source.pos.y + 1, STRUCTURE_CONTAINER);
        continue;
      }
      // const posList = source.room.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
      // // 遍历
      // for (const pos in posList) {
      //   // 如果是plain
      //   if (posList[pos].terrain == "plain") {
      //     // 创建container
      //     Room.createConstructionSite(posList[pos].x, posList[pos].y, STRUCTURE_CONTAINER);
      //     // 跳出循环
      //     break;
      //   }
      // }
    }
  },
  // 创建tower
  createTower(Room) {
    // 获取该房间RCL
    const RCL = Room.controller ? Room.controller.level : 0;
    if (Room.memory.towerBuild === RCL) {
      return;
    } else {
      Room.memory.towerBuild = RCL;
    }
    // 获取该房间spawn坐标
    const spawn = Room.find(FIND_MY_SPAWNS)[0];
    // 获取该房间tower
    const towers = Room.find(FIND_MY_STRUCTURES, {
      filter: {
        structureType: STRUCTURE_TOWER
      }
    });
    // 获取该房间的tower工地数量
    const towerConstructionSites = Room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: {
        structureType: STRUCTURE_TOWER
      }
    });
    // 获取该房间允许的extension数量
    const towerNum = Game.Config.RCL["LV" + RCL] ? Game.Config.RCL["LV" + RCL].Tower : 0;
    if (Room.controller && spawn && towers.length < towerNum + towerConstructionSites.length) {
      const getPos = getCreateBuildingPos(Room, RCL, spawn)
      if (getPos) {
        Room.createConstructionSite(getPos.x, getPos.y, STRUCTURE_TOWER);
      }
    }
  },
  // 创建extension
  createExtension(Room) {
    // 获取该房间RCL
    const RCL = Room.controller ? Room.controller.level : 0;
    // if (Room.memory.extensionBuild === RCL) {
    //   return;
    // } else {
    //   Room.memory.extensionBuild = RCL;
    // }
    // 获取该房间spawn坐标
    const spawn = Room.find(FIND_MY_SPAWNS)[0];
    // 获取该房间extension
    const extensions = Room.find(FIND_MY_STRUCTURES, {
      filter: {
        structureType: STRUCTURE_EXTENSION
      }
    });
    // 获取该房间允许的extension数量
    const extensionNum = Game.Config.RCL["LV" + RCL] ? Game.Config.RCL["LV" + RCL].Extension : 0;
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
    // if (Room.memory.roadBuild === RCL) {
    //   return;
    // } else {
    //   Room.memory.roadBuild = RCL;
    // }
    // 获取该房间spawn坐标
    const spawn = Room.find(FIND_MY_SPAWNS)[0];
    if (Room.controller && spawn) {
      for (let x = -RCL * 2; x <= RCL * 2; x++) {
        for (let y = -RCL * 2; y <= RCL * 2; y++) {
          if (createRoad(x, y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标是否有建筑
            const structures = Room.lookForAt(LOOK_STRUCTURES, spawn.pos.x + x, spawn.pos.y + y);
            // 获取该坐标建筑工地
            const constructionSites = Room.lookForAt(LOOK_CONSTRUCTION_SITES, spawn.pos.x + x, spawn.pos.y + y);
            // 三者都没有则创建extension
            if (terrain[0].terrain !== "wall" && structures.length === 0 && constructionSites.length === 0) {
              // 创建道路
              Room.createConstructionSite(spawn.pos.x + x, spawn.pos.y + y, STRUCTURE_ROAD);
            }
          }
        }
      }
    }
  }
}

// 传入Room RCL spawn 返回是否可以生成建筑
function getCreateBuildingPos(Room, RCL, spawn) {
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
          return { x, y };
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
          return { x, y };
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
          return { x, y };
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
          return { x, y };
        }
      }
      x = -x
      y = -y
    }
  }
  return null
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