/**
 * 房间市场管理
 */
let Room = null
const mark = {
  mark_loop(roomName) {
    Room = Game.rooms[roomName];
    // 获取所有订单任务遍历
    const task = Room.memory.task || []
    task.forEach((item, index) => {



    })
    return;
  },
  // 成交某个订单
  dealOrder(roomName, orderId, num) {
    // 判断房间是否为自己的
    if (!isRoom(roomName)) return;
    // 获取订单
    const order = Game.market.getOrderById(orderId);
    // 判断订单是否存在
    if (!order) {
      console.log(`<font color="red">✖︎订单 ${orderId} 不存在！</font>`);
      return;
    }
    if (num == undefined) {
      num = order.amount;
    }
    // 判断订单数量是否足够
    else if (order.amount < num) {
      console.log(`<font color="red">✖︎订单 ${orderId} 数量不足！</font>`);
      return;
    }
    // 计算路费
    order.cost = Game.map.getRoomLinearDistance(Game.rooms[roomName], Game.rooms[order.roomName], true) * num;
    // 如果当期那房间有足够的路费就直接拍下
    if (Room.terminal.store[RESOURCE_ENERGY] >= order.cost) {
      // 直接拍下
      Game.market.deal(orderId, num, roomName);
      console.log(`<font color="green">✔︎已拍下订单 ${orderId}，数量为 ${num}</font>`);
      return;
    }
    // 计算订单总价
    order.totalPrice = order.price * num;
    order.num = num;
    order.fromRoom = roomName;
    order.targetRoom = order.roomName;
    order.createTime = Game.time;
    order.taskId = order.id
    // 标记为订单任务
    order.task = 'dealOrder';
    // 将订单提交到订单任务
    // FIXME 这里可能存在和云端订单有差异的情况，需要处理的时候重新查一次订单
    Game.rooms[roomName].memory.task.push(order)
    console.log(`<font color="green">✔︎已提交订单 ${orderId}，数量为 ${num}</font>`);
    // 查看当前房间所有订单
    this.getOrderList(roomName);
    return;
  },
  // 发布订单
  publishOrder(type, resourceType, num, roomName) {
    // FIXME 可能需要测试
    if (!isRoom(roomName)) return;
    // 判断终端加上storage是否足够发布订单
    if (Room.terminal.store[resourceType] + Room.storage.store[resourceType] < num) {
      console.log(`<font color="red">✖︎房间 ${roomName} 终端和storage资源不足！</font>`);
      return;
    }
    const taskId = getIDByString(`${type}${resourceType}${num}`)
    // 资源均价
    const avgPrice = Game.market.getHistory(resourceType).pop().avgPrice;
    // 获取当前房间该类型订单任务
    const orderTask = Game.rooms[roomName].memory.task.filter(item => (type === 'BUY' ? item.task == 'dealOrder' : item.task == 'publishOrder') && item.taskId == taskId)
    // 如果当前房间有该类型订单任务，就不再发布订单
    if (orderTask.length > 0) {
      const order = Game.market.getOrderById(orderTask[0].orderId);
      if (order) {
        // 改价改数量
        Game.market.changeOrderPrice(order.id, avgPrice);
        Game.market.extendOrder(order.id, num);
        console.log(`<font color="green">✔︎订单 ${order.id} 已改价改量</font>`);
        return;
      }
    }
    // 买买买
    if (type === "BUY") {
      // 发起购买订单
      const order = {
        type: ORDER_BUY,
        resourceType: resourceType,
        price: avgPrice,
        totalAmount: num,
        roomName: roomName,
        totalCost: avgPrice * num,
        num: num,
        fromRoom: roomName,
        targetRoom: roomName,
        createTime: Game.time,
        taskId: taskId,
      }
      Game.market.createOrder(order);
      // 获取刚刚创建的订单
      const orderId = Game.market.getAllOrders({ roomName: roomName }).filter(item => item.price == avgPrice && item.amount == num && item.resourceType == resourceType)[0].id;
      order.orderId = orderId;
      order.task = 'publishOrder';
      // 将订单提交到订单任务
      Game.rooms[roomName].memory.task.push(order)
      console.log(`<font color="green">✔︎购买已发布订单 ${orderId}，数量为 ${num}</font>`);
      return;
    } else if (type === "SELL") {
      // 卖卖卖
      const order = {
        type: ORDER_SELL,
        resourceType: resourceType,
        price: avgPrice,
        totalAmount: num,
        roomName: roomName,
        totalCost: avgPrice * num,
        num: num,
        fromRoom: roomName,
        targetRoom: roomName,
        createTime: Game.time,
        taskId: taskId,
      }
      // 发起出售订单
      Game.market.createOrder(order);
      // 获取刚刚创建的订单
      const orderId = Game.market.getAllOrders({ roomName: roomName }).filter(item => item.price == avgPrice && item.amount == num && item.resourceType == resourceType)[0].id;
      order.orderId = orderId;
      order.task = 'publishOrder';
      // 将订单提交到订单任务
      Game.rooms[roomName].memory.task.push(order)
      console.log(`<font color="green">✔︎售卖已发布订单 ${orderId}，数量为 ${num}</font>`);
      return;
    }
  },
  // 删除订单任务，如果是自己发布的订单，会取消订单
  deleteOrder(roomName, orderId) {
    if (!isRoom(roomName)) return;
    Game.rooms[roomName].memory.task = Game.rooms[roomName].memory.task.filter(item => item.taskId != orderId)
  },
  // 获取订单任务列表
  getOrderList(roomName) {
    if (!isRoom(roomName)) return;
    console.log(`<font color="green">✔︎当前房间 ${roomName} 订单任务列表：</font>`);
    const orderTaskList = Game.rooms[roomName].memory.task.filter(item => item.task == 'dealOrder' || item.task == 'publishOrder');
    orderTaskList.forEach(item => {
      console.log(`<font color="green">✔︎订单任务：${JSON.stringify(item)}</font>`);
    })
    return;
  },
  // 查看房间历史订单
  getHistoryOrder(roomName) {
    if (!isRoom(roomName)) return;
    const historyOrder = Game.market.getHistory(roomName);
    historyOrder.forEach(item => {
      console.log(`<font color="green">✔︎历史订单：${JSON.stringify(item)}</font>`);
    })
    return;
  },
  // 查看房间当前订单
  getCurrentOrder(roomName) {
    if (!isRoom(roomName)) return;
    const currentOrder = Game.market.getAllOrders({ roomName: roomName });
    currentOrder.forEach(item => {
      console.log(`<font color="green">✔︎当前订单：${JSON.stringify(item)}</font>`);
    })
    return;
  },
  // 根据出售订单情况和路费计算出当前终端应该保留哪些资源
  // FIXME 可能存在问题，待测试
  getKeepResource(roomName) {
    // 获取当前所有订单任务
    const orderTaskList = Game.rooms[roomName].memory.task.filter(item => item.task == 'dealOrder' || item.task == 'publishOrder');
    // 根据资源类型分类求和形成对象
    const orderTaskListObj = orderTaskList.reduce((obj, item) => {
      obj[item.resourceType] = obj[item.resourceType] ? obj[item.resourceType] + item.num : item.num;
      return obj;
    }, {})
    // 获取当前房间终端资源
    const terminalResource = Game.rooms[roomName].terminal.store;
    // 对比形成的对象和终端资源，得出需要的资源 正数 和多余的资源 负数
    const keepResource = Object.keys(orderTaskListObj).reduce((obj, item) => {
      obj[item] = orderTaskListObj[item] - terminalResource[item];
      return obj;
    }, {})
    // 向上返回
    return keepResource;
  }
}

module.exports = mark;