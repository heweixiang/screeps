// 终端管理
const markManger = {
  // 向某个房间发送信息
  loop(Room) {
    // 如果房间没有终端
    if (!Room.terminal) return;
    if (Room.memory.TerminalTask && Room.memory.TerminalTask.length > 0) {
      // 获取标记为1的任务
      let task = Room.memory.TerminalTask.filter(item => item.state == 1)[0];
      if (!task) {
        // 获取优先级最高的任务标记为1
        task = Room.memory.TerminalTask.filter(item => item.state == 0).sort((a, b) => a.order - b.order)[0];
        if (!task) return;
        task.state = 1;
      }
      if (this.canSend(task, Room)) {
        // 发送任务
        Room.terminal.send(task.type, task.count, task.targetRoomName, task.remark);
        // 移除任务
        Room.memory.TerminalTask = Room.memory.TerminalTask.filter(item => item.taskId != task.taskId);
      }
    }
  },
  // 判断该任务是否可以发送
  canSend(task, Room) {
    // 获取终端
    const terminal = Room.terminal;
    // 获取资源
    const resource = terminal.store[task.type];
    // 获取终端能量
    const energy = terminal.store[RESOURCE_ENERGY];
    const count = task.type == RESOURCE_ENERGY ? task.count + task.roadCost : task.count;
    // 如果资源数量大于任务数量
    if (resource >= count && energy >= task.roadCost) {
      // 返回true
      return true;
    }
    // 返回false
    return false;
  },
  // 添加任务
  addMarkOrder(roomName, targetRoomName, type, count, order = 3, remark = "") {
    type = type.toUpperCase();
    switch (type) {
      case "E": type = RESOURCE_ENERGY; break;
      case "H": type = RESOURCE_HYDROGEN; break;
      case "O": type = RESOURCE_OXYGEN; break;
      case "U": type = RESOURCE_UTRIUM; break;
      case "L": type = RESOURCE_LEMERGIUM; break;
      case "K": type = RESOURCE_KEANIUM; break;
      case "Z": type = RESOURCE_ZYNTHIUM; break;
      case "G": type = RESOURCE_GHODIUM; break;
      case "OH": type = RESOURCE_HYDROXIDE; break;
      case "ZK": type = RESOURCE_ZYNTHIUM_KEANITE; break;
      case "UL": type = RESOURCE_UTRIUM_LEMERGITE; break;
      case "UH": type = RESOURCE_UTRIUM_HYDRIDE; break;
      case "UO": type = RESOURCE_UTRIUM_OXIDE; break;
      case "KH": type = RESOURCE_KEANIUM_HYDRIDE; break;
      case "KO": type = RESOURCE_KEANIUM_OXIDE; break;
      case "LH": type = RESOURCE_LEMERGIUM_HYDRIDE; break;
      case "LO": type = RESOURCE_LEMERGIUM_OXIDE; break;
      case "ZH": type = RESOURCE_ZYNTHIUM_HYDRIDE; break;
      case "ZO": type = RESOURCE_ZYNTHIUM_OXIDE; break;
      case "GH": type = RESOURCE_GHODIUM_HYDRIDE; break;
      case "GO": type = RESOURCE_GHODIUM_OXIDE; break;
      case "UH2O": type = RESOURCE_UTRIUM_ACID; break;
      case "UHO2": type = RESOURCE_UTRIUM_ALKALIDE; break;
      case "KH2O": type = RESOURCE_KEANIUM_ACID; break;
      case "KHO2": type = RESOURCE_KEANIUM_ALKALIDE; break;
      case "LH2O": type = RESOURCE_LEMERGIUM_ACID; break;
      case "LHO2": type = RESOURCE_LEMERGIUM_ALKALIDE; break;
      case "ZH2O": type = RESOURCE_ZYNTHIUM_ACID; break;
      case "ZHO2": type = RESOURCE_ZYNTHIUM_ALKALIDE; break;
      case "GH2O": type = RESOURCE_GHODIUM_ACID; break;
      case "GHO2": type = RESOURCE_GHODIUM_ALKALIDE; break;
      case "X": type = RESOURCE_CATALYZED_UTRIUM_ACID; break;
      case "XLH2O": type = RESOURCE_CATALYZED_UTRIUM_ALKALIDE; break;
      case "XKH2O": type = RESOURCE_CATALYZED_KEANIUM_ACID; break;
      case "XKHO2": type = RESOURCE_CATALYZED_KEANIUM_ALKALIDE; break;
      case "XLH2O": type = RESOURCE_CATALYZED_LEMERGIUM_ACID; break;
      case "XLHO2": type = RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE; break;
      case "XZH2O": type = RESOURCE_CATALYZED_ZYNTHIUM_ACID; break;
      case "XZHO2": type = RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE; break;
      case "XGH2O": type = RESOURCE_CATALYZED_GHODIUM_ACID; break;
      case "XGHO2": type = RESOURCE_CATALYZED_GHODIUM_ALKALIDE; break;
      case "OPS": type = RESOURCE_OPS; break;
      case "C": type = RESOURCE_CELL; break;
      case "B": type = RESOURCE_BIOMASS; break;
      case "S": type = RESOURCE_ESSENCE; break;
      default: console.log("未识别该资源类型... ..."); return;
    }

    // 计算路费
    const roadCost = Game.market.calcTransactionCost(count, roomName, targetRoomName);
    const task = {
      taskId: Game.time,
      targetRoomName,
      roadCost,
      type,
      count,
      state: 0,
      remark,
      order
    }
    Game.rooms[roomName].memory.TerminalTask.push(task);
  }
}

module.exports = markManger;