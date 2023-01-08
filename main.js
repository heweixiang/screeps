// 引入移动优化
require('moveManager');
const Tools = require('tools');
const Config = require('config');
// 引入ROOM管理
const Room = require('room');
module.exports.loop = function () {
  // 用于各个模块之间通信
  if(Memory.Info == undefined){
    Memory.Info = {};
  }
  // 用于公共静态配置
  if(Game.Config == undefined){
    Game.Config = Config;
  }
  // 用于手动操作，入侵等操作放入
  if(Game.Tools == undefined){
    Game.Tools = Tools;
  }

  // 遍历ROOM
  for (let i in Game.rooms) {
    // 获取房间
    const ROOM = Game.rooms[i];
    Room.roomManager(ROOM);
  }

  // 预留防止spawn防止方法
  // 分割线
  console.log('===================================================\n\n\n');
}