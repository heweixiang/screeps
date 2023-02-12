/**
整体规划：
  按模块分：
    1、全局管理
    2、房间管理
    3、爬爬管理
    4、旗子管理
 */

// 配置文件，大部分依赖于配置文件
creepconfig = require('creep_config');
// 创建一个全局变量
global = require('global');
room = require('room');
creep = require('creep');
flag = require('flag');
tool = require("tool")
build = require('build')
Task = []

// 引入执行global
module.exports.loop = function () {
  Task = Memory.Task
  // 循环房间
  for (let roomName in Game.rooms) {
    // 初始化房间
    room.loop(roomName);
    // 房间建筑管理
    build.loop(roomName)
  }

}

