// 此处管理房间内的建筑物
const resourceManagement = {
  loop: function (room) {
    this.linkManagement(room);
  },
  // 链路管理link
  linkManagement: function (room) {
    if(!room.controller || !room.storage || !room.controller.my) {
      return;
    }
    // 找到Storage3*3内的link并获取能量
    const storageLink = room.storage.pos.findInRange(FIND_STRUCTURES, 3, {
      filter: (structure) => {
        return structure.structureType === STRUCTURE_LINK
      }
    })[0];
    // 遍历所有有内容的link
    const linkList = room.find(FIND_MY_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_LINK) && structure.store[RESOURCE_ENERGY] > 0;
      }
    });
    // 如果有link
    if (linkList.length > 0) {
      // 遍历所有link
      for (const link of linkList) {
        // 如果有storageLink
        if (storageLink) {
          // 如果link不在storage3*3范围内
          if (!link.pos.inRangeTo(room.storage, 3)) {
            // 如果link的能量大于400
            if (link.store[RESOURCE_ENERGY] > 750) {
              // 如果link的能量大于storageLink的能量
              if (storageLink.store[RESOURCE_ENERGY] === 0) {
              
                // 将link的能量转移到storageLink
                link.transferEnergy(storageLink);
              }
            }
          }
        }
      }
    }

  }


}
module.exports = resourceManagement