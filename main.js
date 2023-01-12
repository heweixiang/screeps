// 引入移动优化
// require('moveManager');
const Tools = require('tools');
const Config = require('config');
// 引入ROOM管理
const RoomManager = require('room');
module.exports.loop = function () {
  // 用于各个模块之间通信
  if (Memory.Info == undefined) {
    Memory.Info = {};
  }
  // 用于公共静态配置
  if (Game.Config == undefined) {
    Game.Config = Config;
  }
  // 用于手动操作，入侵等操作放入
  if (Game.Tools == undefined) {
    Game.Tools = Tools;
  }

  // 遍历ROOM
  for (let i in Game.rooms) {
    // 获取房间
    const ROOM = Game.rooms[i];
    RoomManager.roomManager(ROOM);
  }

  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel();
  }

  // 每50tick清理一次creep内存
  if (Game.time % 50 === 0) {
    clearMemory();
  }

  // 预留防止spawn防止方法
  // 分割线
  // 绿色
  console.log(`<font color="#00FF00">==========================${Game.time}==========================</font>\n\n\n`);
}

function clearMemory() {
  // 清理房间内无效的creep
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}