/**
 * 房间管理的静态方法（手操用）
 */
const room_static = {
  // 爬爬数量设置
  setCreepNum(roomName, creepRole, num) {
    // 判断creepRole是否存在
    if (ROLE_LIST.indexOf(creepRole) == -1) {
      console.log(`<font color="red">✖︎爬爬角色 ${creepRole} 不存在</font>`);
      return;
    } else {
      // 判断房间是否存在
      if (isRoom(roomName)) {
        // 设置爬爬数量
        Game.rooms[roomName].memory.creepNum[creepRole] = num;
        console.log(`<font color="green">✔︎已将房间 ${roomName} 的 ${creepRole} 数量设置为 ${num}</font>`);
      }
    }
    return;
  },
  // 资源转移，传入 资源房间名，资源ID，送达房间名，送达容器ID，资源类型，数量
  resourceTransfer(fromRoom, resourceId, targetRoom, targetId, resourceType, num) {
    // 房间内资源转移，手操和系统通用
    // 判断资源房间是否存在
    if (!isRoom(roomName, true)) return;
    if (!targetRoom) {
      targetRoom = fromRoom;
      console.log(`<font color="yellow">✖︎未指定送达房间，默认为资源房间!</font>`);
    } else {
      // 判断送达房间是否存在
      if (!isRoom(targetRoom)) {
        console.log(`<font color="red">✖︎送达房间 ${targetRoom} 不存在，或还没有初始化！</font>`);
        return;
      }
    }
    // 判断资源类型是否存在
    if (RESOURCE_LIST.indexOf(resourceType) == -1) {
      console.log(`<font color="red">✖︎资源类型 ${resourceType} 不存在！</font>`);
      return;
    }
    // 判断资源容器是否存在，资源容器是否有足够的资源
    if (!Game.getObjectById(resourceId)) {
      console.log(`<font color="red">✖︎资源容器 ${resourceId} 不存在！</font>`);
      return;
    } else {
      if (Game.getObjectById(resourceId).store[resourceType] < num) {
        console.log(`<font color="red">✖︎资源容器 ${resourceId} 中的 ${resourceType} 数量不足！</font>`);
        return;
      }
    }
    // 判断送达容器是否存在，空间是否足够
    if (!Game.getObjectById(targetId)) {
      console.log(`<font color="red">✖︎送达容器 ${targetId} 不存在！</font>`);
      return;
    } else {
      if (Game.getObjectById(targetId).store.getFreeCapacity(resourceType) < num) {
        console.log(`<font color="red">✖︎送达容器 ${targetId} 中的 ${resourceType} 空间不足！</font>`);
        return;
      }
    }
    // 生成任务ID
    const taskId = getIDByString(`${fromRoom}${resourceId}${targetRoom}${targetId}${resourceType}`);
    // 判断任务是否已存在
    const taskList = Game.rooms[roomName].memory.task;
    for (let i = 0; i < taskList.length; i++) {
      if (taskList[i].taskId == taskId) {
        // 修改该任务,数量叠加
        console.log(`<font color="green">✔︎已修改资源转移任务，任务ID为 ${taskId}，${taskList[i].num}=>${taskList[i].num + num}</font>`);
        taskList[i].num += num;
        return;
      }
    }
    // 创建任务
    const task = {
      taskId,
      taskType: 'resourceTransfer',
      fromRoom,
      resourceId,
      targetRoom,
      targetId,
      resourceType,
      num,
      status: 0,
      createTime: Game.time
    }
    taskList.push(task);
    console.log(`<font color="green">✔︎已生成资源转移任务，任务ID为 ${taskId}</font>`);
    return;
  },
  // 资源传送，传入 资源房间，目标房间，资源类型，数量
  resourceSend(fromRoom, targetRoom, resourceType, num) {
    // 计算路费
    const cost = Game.map.getRoomLinearDistance(fromRoom, targetRoom, true) * num;
    // 判断资源房间是否存在
    if (!isRoom(fromRoom, true)) return;
    // 获取terminal中该资源数量
    const terminalNum = Game.rooms[fromRoom].terminal.store[resourceType];
    // 获取storage中该资源数量
    const storageNum = Game.rooms[fromRoom].storage.store[resourceType];
    // 判断terminal和storage中是否有足够的资源，路费由内部调用暂不考虑
    if (terminalNum + storageNum < num) {
      console.log(`<font color="red">✖︎资源房间 ${fromRoom} 中的 ${resourceType} 数量不足！</font>`);
      return;
    }
    // 生成taskID
    const taskId = getIDByString(`${fromRoom}${targetRoom}${resourceType}`);
    // 判断任务是否已存在
    const taskList = Game.rooms[roomName].memory.task;
    for (let i = 0; i < taskList.length; i++) {
      if (taskList[i].taskId == taskId) {
        // 修改该任务,数量叠加
        console.log(`<font color="green">✔︎已修改资源传送任务，任务ID为 ${taskId}，${taskList[i].num}=>${taskList[i].num + num}</font>`);
        taskList[i].num += num;
        return;
      }
    }
    // 创建任务
    const task = {
      taskId,
      taskType: 'resourceSend',
      fromRoom,
      targetRoom,
      resourceType,
      num,
      status: 0,
      createTime: Game.time,
      cost
    }
    taskList.push(task);
    console.log(`<font color="green">✔︎已生成资源传送任务，任务ID为 ${taskId}</font>`);
  },
  // 查询当前房间的任务列表
  getTaskList(roomName, taskType) {
    // 判断房间是否存在
    if (!isRoom(roomName)) return;
    const taskList = Game.rooms[roomName].memory.task;
    console.log(`<font color="green">⬇︎⬇︎⬇︎当前房间任务列表如下⬇︎⬇︎⬇︎</font>`)
    if (taskType) {
      // 循环输出
      for (let i = 0; i < taskList.length; i++) {
        if (taskList[i].taskType == taskType) {
          console.log(JSON.stringify(taskList[i]));
        }
      }
    } else {
      for (let i = 0; i < taskList.length; i++) {
        console.log(JSON.stringify(taskList[i]));
      }
    }
    console.log(`<font color="green">========================</font>`)
    return;
  },
  // 根据任务ID删除任务
  deleteTaskById(roomName, taskId) {
    // 判断房间是否存在
    if (!isRoom(roomName)) return;
    const taskList = Game.rooms[roomName].memory.task;
    for (let i = 0; i < taskList.length; i++) {
      if (taskList[i].taskId == taskId) {
        taskList.splice(i, 1);
        console.log(`<font color="green">✔︎已删除任务，任务ID为 ${taskId}</font>`);
        return;
      }
    }
    console.log(`<font color="red">✖︎任务ID ${taskId} 不存在！</font>`);
    return;
  },
  // 房间定格，记录下当前房间内的所有建筑位置方便后续修复
  roomArchitectureStatic(roomName) {
    // 判断房间是否存在
    if (!isRoom(roomName)) return;
    // 清除上次的定格记录
    Game.rooms[roomName].memory.architectureStatic = {};
    // 获取当前房间内的所有建筑
    const structureList = Game.rooms[roomName].find(FIND_STRUCTURES);
    // 遍历建筑
    for (let i = 0; i < structureList.length; i++) {
      // 获取建筑的位置
      const pos = structureList[i].pos;
      // 获取建筑的类型
      const type = structureList[i].structureType;
      // 记录建筑的位置和ID
      Game.rooms[roomName].memory.architectureStatic[`${pos.x},${pos.y},${type}`] = "建筑"
    }
    // 记录建筑工地
    const constructionSiteList = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
    for (let i = 0; i < constructionSiteList.length; i++) {
      // 获取建筑的位置
      const pos = constructionSiteList[i].pos;
      // 获取建筑的类型
      const type = constructionSiteList[i].structureType;
      // 记录建筑的位置和ID
      Game.rooms[roomName].memory.architectureStatic[`${pos.x},${pos.y},${type}`] = "工地"
    }
    console.log(`<font color="green">✔︎已完成房间定格!</font>`);
    return;
  },
  // 房间修复，根据定格记录修复房间内的建筑
  roomArchitectureRepair(roomName) {
    // 记录受损建筑的数量
    let num = 0;
    // 判断房间是否存在
    if (!isRoom(roomName)) return;
    // 遍历定格记录
    for (let key in Game.rooms[roomName].memory.architectureStatic) {
      // 获取建筑的位置
      const x = key.split(",")[0];
      const y = key.split(",")[1];
      // 获取建筑的类型
      const type = key.split(",")[2];
      // 查看这个位置
      const look = Game.rooms[roomName].lookAt(+x, +y)
        .filter(x => (x.type == "structure" || x.type == "constructionSite") && x[x.type].structureType == type);
      // 有这个类型的工地或者建筑，跳过
      if (look.length > 0) continue;
      // 没有这个类型的建筑，也没有这个类型的工地，需要修复
      Game.rooms[roomName].createConstructionSite(+x, +y, type);
      num++;
      console.log(`<font color="green">✔︎已修复${type}工地，位置：${x}，${y}!</font>`);
    }
    console.log(`<font color="green">✔︎已完成房间修复，共修复受损建筑或工地 ${num} !</font>`);
    return;
  },
  // 将房间link手动注册成消费link
  registerLink(roomName, linkId) {
    // 给控制器注册消费link使用
    // 判断房间是否存在且是自己的房间
    if (!isRoom(roomName, true)) return;
    if (linkId == undefined) {
      console.log(`<font color="green">✔︎当前房间的消费link列表为：${Game.rooms[roomName].memory.consumeLinkList}</font>`);
      return;
    }
    if (Game.rooms[roomName].memory.consumeLinkList.includes(linkId)) {
      console.log(`<font color="yellow">✔︎link ${linkId} 已经注册过了！</font>`);
      return;
    } else {
      // 向消费link列表中添加link
      Game.rooms[roomName].memory.consumeLinkList.push(linkId);
      console.log(`<font color="green">✔︎已将link ${linkId} 注册为消费link！</font>`);
    }
    // 输出当前房间的消费link列表
    console.log(`<font color="green">✔︎当前房间的消费link列表为：${Game.rooms[roomName].memory.consumeLinkList}</font>`);
  }
}

// 判断房间是否是自己的房间
function isRoom(roomName, isMyRoom = false) {
  if (isMyRoom === false) {
    if (!Game.rooms[roomName]) {
      console.log(`<font color="red">✖︎房间 ${roomName} 不存在，或者未初始化！</font>`);
      return false;
    }

  } else {
    if (!(Game.rooms[roomName] && Game.rooms[roomName].controller && Game.rooms[roomName].controller.my)) {
      console.log(`<font color="red">✖︎房间 ${roomName} 不是自己的房间！</font>`);
      return false;
    }
  }
  return true;
}


module.exports = room_static;