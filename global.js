/**
 * 全局管理
 */
const global = {
  memoryInit() {
    // 清空内存
    RawMemory.set('{}');
    console.log(`<font color="#00FF00">TouchFishGlobalInt ===> 内存已清空!</font>`);
    // 初始化内存
    // 初始化白名单
    if (!Memory.whiteList)
      Memory.whiteList = {};
    // 初始化绕过房间列表
    if (!Memory.bypassRoom)
      Memory.bypassRoom = {};
    // 初始化自动像素
    if (!Memory.autoPixel)
      Memory.autoPixel = true;
    // 初始化任务列表
    if (!Memory.Task)
      Memory.Task = {};
    // 初始化全局资源传输任务
    if (!Memory.Task.globalResourceTask)
      Memory.Task.globalResourceTask = [];

    RawMemory.set(JSON.stringify(Memory));
    // 提示初始化完成
    console.log(`<font color="#00FF00">TouchFishGlobalInt ===> 内存初始化完成!</font>`);
  },
  // 白名单管理，传入 用户名、ture/false 切换白名单
  whiteList: function (name, bool = true) {
    if (bool) {
      Memory.whiteList[name] = true;
      // 输出提示语
      console.log(`已将 ${name} 加入白名单`);
    } else {
      Memory.whiteList[name] = false;
      console.log(`已将 ${name} 移出白名单`);
    }
  },
  // 绕过房间管理（永不进入）
  bypassRoom: function (roomName, bool = true) {
    if (bool) {
      Memory.bypassRoom[roomName] = true;
      console.log(`已将 ${roomName} 加入绕过房间列表`);
    } else {
      Memory.bypassRoom[roomName] = false;
      console.log(`已将 ${roomName} 移出绕过房间列表`);
    }
  },
  // 是否自动生成像素
  autoPixel: function (bool = true) {
    if (bool) {
      Memory.autoPixel = true;
      console.log(`已开启自动像素`);
    } else {
      Memory.autoPixel = false;
      console.log(`已关闭自动像素`);
    }
  },
  // 查询全局资源传输任务
  getGlobalResourceTask: function () {
    Task.globalResourceTask.forEach(task => {
      console.log(`全局资源传输任务：${JSON.stringify(task)}`);
    })
  },
  // 设置全局资源传输任务（该任务不应该发起，除非你房间不想要了）
  setGlobalResourceTask: function (targetRoom, resourceType, amount) {
    const task = {
      taskID: uuid(),
      targetRoom: targetRoom,
      resourceType: resourceType,
      amount: amount
    }
    Task.globalResourceTask.push(task);
    console.log(`已设置全局资源传输任务：${JSON.stringify(task)}，当前任务数量：${Task.globalResourceTask.length}`);
  },
  // 删除全局资源传输任务
  deleteGlobalResourceTask: function (taskID) {
    // 如果taskID不存在，直接清空所有
    if (!taskID) {
      console.log(`已清空全局资源传输任务，共${Task.globalResourceTask.length}条`);
      Task.globalResourceTask = [];
      return;
    } else {
      const task = Task.globalResourceTask.find(task => task.taskID == taskID);
      Task.globalResourceTask = Task.globalResourceTask.filter(task => task.taskID != taskID);
      console.log(`已删除全局资源传输任务：${JSON.stringify(task)}，剩余任务数量：${Task.globalResourceTask.length}`);
    }
  }
}

module.exports = global;