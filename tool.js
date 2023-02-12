/**
 * 全局工具
 */
// 根据字符串生成唯一ID
getIDByString = function (str) {
  let hash = 0;
  if (str.length == 0) return hash;
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// 生成UUID
uuid = function () {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    d += performance.now(); //use high-precision timer if available
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 判断房间是否是自己的房间
isRoom = function (roomName, isMyRoom = false) {
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