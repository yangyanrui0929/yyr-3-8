export type CellType = 'empty' | 'windmill' | 'house' | 'factory' | 'battery' | 'wire' | 'broadcastTower';

export type ToolType = CellType | 'remove';

export interface GridCell {
  x: number;
  y: number;
  type: CellType;
  rotation: number;
  powered: boolean;
  faulty: boolean;
  rumorLevel: number;
  unpoweredTicks: number;
}

export interface Complaint {
  id: number;
  x: number;
  y: number;
  severity: number;
  timestamp: number;
  message: string;
}

export const GRID_SIZE = 8;

export const BUILDING_STATS = {
  windmill: { dayGen: 5, nightGen: 1, consumption: 0, name: '风车', emoji: '🌀' },
  house: { dayGen: 0, nightGen: 0, consumption: 2, name: '住房', emoji: '🏠' },
  factory: { dayGen: 0, nightGen: 0, consumption: 4, name: '工坊', emoji: '🏭' },
  battery: { dayGen: 0, nightGen: 0, consumption: 0, storage: 20, name: '蓄电池', emoji: '🔋' },
  wire: { dayGen: 0, nightGen: 0, consumption: 0, name: '电线', emoji: '⚡' },
  broadcastTower: { dayGen: 0, nightGen: 0, consumption: 3, name: '广播塔', emoji: '📡', rumorRange: 2, rumorReduction: 0.3 },
} as const;

export const WIRE_CONNECTIONS: Record<number, [boolean, boolean, boolean, boolean]> = {
  0: [true, false, true, false],
  1: [false, true, false, true],
  2: [true, true, false, false],
  3: [true, false, false, true],
  4: [false, true, true, false],
  5: [false, false, true, true],
};

export const DIR_OFFSETS: Array<[number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export const TOOLS: Array<{ type: ToolType; name: string; emoji: string; description: string }> = [
  { type: 'windmill', name: '风车', emoji: '🌀', description: '白天+5电，夜晚+1电' },
  { type: 'house', name: '住房', emoji: '🏠', description: '消耗2电，提供满意度' },
  { type: 'factory', name: '工坊', emoji: '🏭', description: '消耗4电，生产物资' },
  { type: 'battery', name: '蓄电池', emoji: '🔋', description: '存储20电量' },
  { type: 'broadcastTower', name: '广播塔', emoji: '📡', description: '消耗3电，降低周围传闻' },
  { type: 'wire', name: '电线', emoji: '⚡', description: '传导电力，右键/R旋转' },
  { type: 'remove', name: '拆除', emoji: '🗑️', description: '移除建筑或电线' },
];

export const DAY_LENGTH = 100;
export const DAY_THRESHOLD = 50;
export const TICK_INTERVAL = 300;
export const FAULT_CHANCE = 0.002;

export const RUMOR_SPREAD_CHANCE = 0.15;
export const RUMOR_DECAY_RATE = 0.05;
export const RUMOR_UNPOWERED_THRESHOLD = 10;
export const RUMOR_PER_UNPOWERED_TICK = 0.8;
export const RUMOR_SPREAD_AMOUNT = 0.3;
export const TRUST_DECAY_FROM_RUMOR = 0.1;
export const TRUST_RECOVERY_RATE = 0.02;
export const ANNOUNCEMENT_RUMOR_REDUCTION = 25;
export const ANNOUNCEMENT_COOLDOWN = 100;
export const MAX_COMPLAINTS = 10;

export const COMPLAINT_MESSAGES = [
  '又停电了！这日子没法过了',
  '电力公司能不能靠谱点？',
  '我家冰箱里的东西都坏了',
  '晚上黑灯瞎火的太吓人了',
  '电费白交了，天天停电',
  '什么时候才能稳定供电啊',
  '这电网质量也太差了',
  '投诉投诉！频繁停电',
  '孩子作业都没法写了',
  '再这样我要搬走了',
];
