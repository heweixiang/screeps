/**
 * 关于爬爬的配置文件
 */

// 爬爬角色
// 挖矿
HARVESTER = 'harvester';
// 运输
TRANSPORTER = 'transporter';
// 升级
UPGRADER = 'upgrader';
// 建造 & 维修
BUILDER = 'builder';
// 预定 & 占领
CLAIMER = 'claimer';
// 侦查
SCOUT = 'scout';
// 分配
DISTRIBUTOR = 'distributor';
// 购物
SHOPPER = 'shopper';
// 一体机
COMBINED = 'combined';
// 主防红球
MAINDEFENDERRED = 'maindefenderred';
// 主防篮球
MAINDEFENDERBLUE = 'maindefenderblue';
// 两人小队
TWOSQUAD = 'twosquad';
// 四人小队
FOURSQUAD = 'foursquad';

ROLE_LIST = [HARVESTER, TRANSPORTER, UPGRADER, BUILDER, CLAIMER, SCOUT, DISTRIBUTOR, SHOPPER,
  COMBINED, MAINDEFENDERRED, MAINDEFENDERBLUE, TWOSQUAD, FOURSQUAD];

// 所有部件列表
BodyList = ['work', 'carry', 'move', 'attack', 'ranged_attack', 'heal', 'claim', 'tough'];

// 各部件消耗
BodyPartCost = [100, 50, 50, 80, 150, 250, 600, 10];

// 爬爬生成的部件比例
BodyPartRatio = {
  HARVESTER: [1, 0, 1, 0, 0, 0, 0, 0],
  TRANSPORTER: [1, 2, 2, 0, 0, 0, 0, 0],

}



// 原始矿物 T1 T2 T3
mineralList = ['H', 'O', 'Z', 'U', 'L', 'K', 'X', 'G', 'energy'];
T1 = ['KH', 'KO', 'GH', 'GO', 'LH', 'LO', 'ZO', 'ZH', 'UH', 'UO']
T2 = ['KH2O', 'KHO2', 'ZH2O', 'ZHO2', 'GH2O', 'GHO2', 'LHO2', 'LH2O', 'UH2O', 'UHO2']
T3 = ['XKH2O', 'XKHO2', 'XZH2O', 'XZHO2', 'XGH2O', 'XGHO2', 'XLHO2', 'XLH2O', 'XUH2O', 'XUHO2']

// 强化部件列表
BoostedPartData = {
  work: ['GH', 'XGHO2', 'XGHO2'],
  carry: ['KH', 'XKH2O', 'XKH2O'],
  attack: ['UH', 'XUH2O', 'XUH2O'],
  ranged_attack: ['KO', 'XKHO2', 'XKHO2'],
  heal: ['LO', 'XLHO2', 'XLHO2'],
  move: ['ZO', 'XZHO2', 'XZHO2'],
  tough: ['GO', 'XGHO2', 'XGHO2'],
}

