// 引入移动优化
require('moveManager');
const Tools = require('tools');
const Config = require('config');
// 引入ROOM管理
const RoomManager = require('roomManager');
module.exports.loop = function () {
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
    RoomManager.loop(Game.rooms[i]);
  }

  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel ? Game.cpu.generatePixel() : null;
  }
  clearMemory();
  // 预留防止spawn防止方法
  // 分割线
  // 绿色
  console.log(`<font color="#00FF00">==========================${Game.time}==========================</font>\n\n\n`);
  if(Game.time % 1000 == 0) {
    GameNotify(`当前时间：${Game.time}`, '#00FF00');

  }
}


function GameNotify(message) {
  Game.notify(message);
}

function clearMemory() {
  // 清理房间内无效的creep
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}