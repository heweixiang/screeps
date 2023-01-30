// 引入移动优化
require('moveManager');
const Tools = require('tools');
const Config = require('config');
// 引入ROOM管理
const RoomManager = require('roomManager');
module.exports.loop = function () {
  Memory.sendText = Memory.log = `  待占房间：${Memory.PreRoom || '[]'}   援建房间：${Memory.HelpBuildRoom || '[]'}   Bucket：${Game.cpu.bucket}   
  GCL：${Game.gcl.level}   GCL进度：${(Game.gcl.progress / Game.gcl.progressTotal.toFixed(0) * 100).toFixed(4)}%   Credits：${Game.market ? Game.market.credits : 'NULL'}`
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
  Memory.log += `\n=================================== ${Game.time} ===================================`;
  Memory.sendText += `\n=================================== ${Game.time} ===================================\n`;
  console.log(Memory.log);
  console.log('\n')
  // 500tick发送邮件
  if (Game.time % 1000 == 0) {
    Game.notify(`${Memory.sendText}`);
  }
  if (Game.cpu.bucket == 10000) {
    Game.cpu.generatePixel ? Game.cpu.generatePixel() : null;
  }
  MFFData()
}

// MFFData
function MFFData() {
//237451ab-3a6b-44a4-a955-644c16ced849
  if (Game.time % 20) return
  if (!Memory.stats) Memory.stats = {}
  // 统计 GCL / GPL 的升级百分比和等级
  Memory.stats.gcl = (Game.gcl.progress / Game.gcl.progressTotal) * 100
  Memory.stats.gclLevel = Game.gcl.level
  Memory.stats.gpl = (Game.gpl.progress / Game.gpl.progressTotal) * 100
  Memory.stats.gplLevel = Game.gpl.level
  // CPU 的当前使用量
  Memory.stats.cpu = Game.cpu.getUsed()
  // bucket 当前剩余量
  Memory.stats.bucket = Game.cpu.bucket
  // 当前log
  Memory.stats.log = Memory.log
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