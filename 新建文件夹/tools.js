/**
 * 工具文件，改文件用于整合各种工具，但每个文件下面都有staticTools，用于存放静态工具
 * Game.tools
 */
const tools = {
  // 传入一个定义的creep配置，返回生成所需消耗的能量，以及当前是否可以生成 CreepConfigArray生成配置 ROOM房间对象
  ComputerCreepCost(CreepConfigArray, ROOM) {
    let AvailableEnergy = ROOM.energyAvailable;
    // 计算生成所需消耗的能量
    let NeedEnergy = 0;
    for (let i = 0; i < CreepConfigArray.length; i++) {
      NeedEnergy += BODYPART_COST[CreepConfigArray[i]];
    }
    // 返回生成所需消耗的能量，以及当前是否可以生成，以及当前可用能量
    return {
      NeedEnergy,
      CanGenerate: AvailableEnergy >= NeedEnergy,
      // 还差多少能量
      LackEnergy: NeedEnergy - AvailableEnergy,
      AvailableEnergy
    };
  },
  // 传入room、bodyFun、memory、name、priority添加一个creep任务
  AddCreateCreep(room, bodyFun, memory, name, priority) {
    const ROOM = Game.rooms[room];
    if (ROOM.memory.createCreepTaskList == undefined) {
      ROOM.memory.createCreepTaskList = [];
    }
    // 调用bodyFun，返回一个body数组
    try {
      ROOM.memory.createCreepTaskList.push({
        body: Game.Config[bodyFun](ROOM, false),
        memory,
        name,
        priority,
        state: 0
      });
    } catch (error) {
      console.log('%ctools.js line:33 没有该生成方法无法创建任务！', 'color: #007acc;');
    }
  },
  // 给某个房间添加一个收集任务
  AddCollectTask(ROOMName, task) {
    Game.rooms[ROOMName].memory.CollectTask.push(task);
  },
  // 设置所有房间标签的更新状态为false
  SetAllRoomTagUpdateFalse() {
    for (let i in Game.rooms) {
      Game.rooms[i].memory.roomTypeIsUpdate = false;
    }
  },
  // 设置援建房间
  SetHelpBuildRoom(ROOMName) {
    if (Memory.HelpBuildRoom == undefined) {
      Memory.HelpBuildRoom = [];
    }
    Memory.HelpBuildRoom.push(ROOMName);
    Memory.HelpBuildRoom = [...new Set(Memory.HelpBuildRoom)]
    console.log(`SetHelpBuildRoom[${ROOMName}]`, Memory.HelpBuildRoom);
  },
  // 移除援建房间
  RemoveHelpBuildRoom(ROOMName) {
    if (Memory.HelpBuildRoom == undefined) {
      Memory.HelpBuildRoom = [];
    }
    Memory.HelpBuildRoom = Memory.HelpBuildRoom.filter(item => item !== ROOMName);
    console.log(`RemoveHelpBuildRoom[${ROOMName}]`, Memory.HelpBuildRoom);
  },
  // 设置预占领房间
  SetPreRoom(ROOMName) {
    if (Memory.PreRoom == undefined) {
      Memory.PreRoom = [];
    }
    Memory.PreRoom.push(ROOMName);
    Memory.PreRoom = [...new Set(Memory.PreRoom)]
    console.log(`SetPreRoom[${ROOMName}]`, Memory.PreRoom);
  },
  // 移除预占领房间
  RemovePreRoom(ROOMName) {
    if (Memory.PreRoom == undefined) {
      Memory.PreRoom = [];
    }
    Memory.PreRoom = Memory.PreRoom.filter(item => item !== ROOMName);
    console.log(`RemovePreRoom[${ROOMName}]`, Memory.PreRoom);
  },
  // 手动绑定外矿房
  SetOutRoom(ROOMName, OutRoomName) {
    const ROOM = Game.rooms[ROOMName];
    if (ROOM.memory.OutRoom == undefined) {
      ROOM.memory.OutRoom = [];
    }
    ROOM.memory.OutRoom.push(OutRoomName);
    ROOM.memory.OutRoom = [...new Set(ROOM.memory.OutRoom)]
    console.log(`SetOutRoom[${ROOMName}]`, ROOM.memory.OutRoom);
  },
  // 手动移除外矿房
  RemoveOutRoom(ROOMName, OutRoomName) {
    const ROOM = Game.rooms[ROOMName];
    if (ROOM.memory.OutRoom == undefined) {
      ROOM.memory.OutRoom = [];
    }
    ROOM.memory.OutRoom = ROOM.memory.OutRoom.filter(item => item !== OutRoomName);
    console.log(`RemoveOutRoom[${ROOMName}]`, ROOM.memory.OutRoom);
  },
  SCN(R, C, N) {
    this.SetCreepNum(R, C, N)
  },
  // 设置角色产生数量
  SetCreepNum(ROOMName, CreepName, Num) {
    const ROOM = Game.rooms[ROOMName];
    if (ROOM.memory.CreepNum == undefined) {
      ROOM.memory.CreepNum = {};
    }
    ROOM.memory.CreepNum[CreepName] = Num;
    if (Num === 0) {
      delete ROOM.memory.CreepNum[CreepName];
    }
    console.log(`SetCreepNum[${CreepName}]`, ROOM.memory.CreepNum[CreepName] || '已删除');
  },
  // 获取角色产生数量
  GetCreepNum(ROOM, CreepName) {
    if (ROOM === undefined) {
      return {}
    }
    if (ROOM.memory.CreepNum === undefined) {
      ROOM.memory.CreepNum = {};
    }
    if (ROOM.memory.CreepNum[CreepName] == undefined) {
      ROOM.memory.CreepNum[CreepName] = 0;
    }
    return ROOM.memory.CreepNum[CreepName];
  }
}

module.exports = tools;