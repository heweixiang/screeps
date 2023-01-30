// 引入移动优化
require('moveManager');
const Tools = require('tools');
const Config = require('config');
// 引入ROOM管理
const RoomManager = require('roomManager');
module.exports.loop = function () {
  Memory.sendText = Memory.log = `  待占房间：${Memory.PreRoom || '[]'}   援建房间：${Memory.HelpBuildRoom || '[]'}   Bucket：${Game.cpu.bucket}   
  GCL：${Game.gcl.level}   GCL进度：${(Game.gcl.progress / Game.gcl.progressTotal.toFixed(0) * 100).toFixed(4)}%   Credits：${Game.market ? Game.market.credits : 'NULL'}   
  房间列表（${Object.keys(Game.rooms).length}）：${Object.keys(Game.rooms).join(',')}`
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
  clearMemory();
  // 预留防止spawn防止方法
  // 分割线
  // 绿色
  Memory.log = `  <font color='${Game.cpu.getUsed().toFixed(2) > 15 ? 'red' : 'green'}'>CPU：${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}</font>` + Memory.log;
  Memory.sendText = `  <font color='${Game.cpu.getUsed().toFixed(2) > 15 ? 'red' : 'green'}'>CPU：${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}</font>` + Memory.sendText;
  Memory.log += `\n=================================== ${Game.time} ===================================\n\n\n`;
  Memory.sendText += `\n=================================== ${Game.time} ===================================\n\n\n`;
  console.log(Memory.log);
  // 500tick发送邮件
  if (Game.time % 1000 == 0) {
    Game.notify(`${Memory.sendText}`);
  }
  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel ? Game.cpu.generatePixel() : null;
  }
}

function clearMemory() {
  // 清理房间内无效的creep
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
  // 清理房间内无效的rooms
  for (const name in Memory.rooms) {
    if (!Game.rooms[name]) {
      delete Memory.rooms[name];
    }
  }
}