// 自动建筑
// TODO 自动创建Storage



const autoCreateBuilding = {
  loop(Room) {
    // 500tick执行一次
    if (Game.time % 500) {
      // 创建extension
      this.createExtension(Room);
      // 创建road
      this.createRoad(Room);
      // 创建tower
      this.createTower(Room);
      // 创建container
      this.createContainer(Room);
    }

    // 如果房间没有spawn
    if (!Room.find(FIND_MY_SPAWNS).length) {
      // 创建container
      this.createContainer(Room);
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
    // 获取该房间允许的tower数量
    const towerNum = Game.Config.RCL["LV" + RCL] ? Game.Config.RCL["LV" + RCL].Tower : 0;
    if (Room.controller && spawn && towers.length + towerConstructionSites.length < towerNum) {
      const towerCount = towers.length + towerConstructionSites.length;
      // 遍历环数
      for (let ring = 1; ring <= RCL * 2; ring++) {
        const posList = getCirclePos(spawn.pos.x, spawn.pos.y, ring);
        for (let i = 0; i < posList.length; i++) {
          const pos = posList[i];
          if (!createRoad(pos.x - spawn.pos.x, pos.y - spawn.pos.y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, pos.x, pos.y)[0];
            // 三者都没有则创建tower
            if (terrain === "swamp" || terrain === "plain") {
              Room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
              towerCount++;
              if (towerCount >= towerNum) {
                return;
              }
            }
          }
        }
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
    // 获取该房间的extension工地数量
    const extensionConstructionSites = Room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: {
        structureType: STRUCTURE_EXTENSION
      }
    });
    // 获取该房间允许的extension数量
    const extensionNum = Game.Config.RCL["LV" + RCL] ? Game.Config.RCL["LV" + RCL].Extension : 0;
    if (Room.controller && spawn && extensions.length + extensionConstructionSites.length < extensionNum) {
      let extCount = extensions.length + extensionConstructionSites.length;
      // 遍历环数
      for (let ring = 1; ring <= RCL * 2; ring++) {
        const posList = getCirclePos(spawn.pos.x, spawn.pos.y, ring);
        for (let i = 0; i < posList.length; i++) {
          const pos = posList[i];
          if (!createRoad(pos.x - spawn.pos.x, pos.y - spawn.pos.y)) {
            // 获取该坐标是否为空地
            const terrain = Room.lookForAt(LOOK_TERRAIN, pos.x, pos.y)[0];
            // 三者都没有则创建extension
            if (terrain === "swamp" || terrain === "plain") {
              Room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
              extCount++;
              if (extCount >= extensionNum) {
                return;
              }
            }
          }
        }
      }
    }
  },
  createRoad(Room) {
    // 获取该房间RCL
    const RCL = Room.controller ? Room.controller.level : 0;
    // 获取该房间spawn坐标
    const spawn = Room.find(FIND_MY_SPAWNS)[0];
    if (Room.controller && spawn) {
      // 遍历环数
      for (let ring = 1; ring <= RCL * 2; ring++) {
        const posList = getCirclePos(spawn.pos.x, spawn.pos.y, ring);
        for (let i = 0; i < posList.length; i++) {
          const pos = posList[i];
          if (createRoad(pos.x - spawn.pos.x, pos.y - spawn.pos.y)) {
            // 获取该坐标类型
            const terrain = Room.lookForAt(LOOK_TERRAIN, pos.x, pos.y)[0];
            // 三者都没有则创建extension
            if (terrain === "swamp" || terrain === "plain") {
              // 创建道路
              Room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
            }
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
  if (Math.abs(x) === Math.abs(y) && Math.abs(x) > 3) {
    return true;
  }
  return false;
}

// 传入一个坐标以及一个环线半径，返回圆环上的所有坐标
function getCirclePos(x, y, r) {
  const pos = [];
  // 一个循环作为x轴一个循环作为Y轴，如果x等与环线或者y等与环线则是当前环，注意控制x,y均不超过环线
  for (let i = -r; i <= r; i++) {
    for (let j = -r; j <= r; j++) {
      if (Math.abs(i) === r || Math.abs(j) === r) {
        pos.push({ x: x + i, y: y + j })
      }
    }
  }
  return pos;
}

module.exports = autoCreateBuilding;