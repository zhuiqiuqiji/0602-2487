export const CELL_SIZE = 16
export const NEST_COLS = 50
export const NEST_ROWS = 40
export const SURFACE_COLS = 60
export const SURFACE_ROWS = 50

export const QUEEN_LAY_INTERVAL = 15000
export const EGG_DURATION = 30000
export const LARVA_DURATION = 60000
export const PUPA_DURATION = 45000
export const FOOD_CONSUME_PER_ANT = 0.02
export const WORKER_SPEED = 1.2
export const SOLDIER_SPEED = 0.8
export const ANT_HUNGER_RATE = 0.01
export const ANT_EAT_AMOUNT = 10
export const HUNGER_THRESHOLD = 70

export const ENEMY_SPAWN_INTERVAL_MIN = 30000
export const ENEMY_SPAWN_INTERVAL_MAX = 60000
export const SPIDER_HEALTH = 80
export const SPIDER_ATTACK = 8
export const SPIDER_SPEED = 0.6
export const RIVAL_ANT_HEALTH = 30
export const RIVAL_ANT_ATTACK = 4
export const RIVAL_ANT_SPEED = 1.0

export const WORKER_HEALTH = 40
export const WORKER_ATTACK = 3
export const SOLDIER_HEALTH = 70
export const SOLDIER_ATTACK = 8

export const INITIAL_WORKERS = 5
export const INITIAL_SOLDIERS = 2
export const INITIAL_FOOD = 100

export enum CellType {
  EMPTY = 0,
  DIRT = 1,
  TUNNEL = 2,
  ROOM = 3,
  QUEEN_CHAMBER = 4,
  NURSERY = 5,
  FOOD_STORAGE = 6,
  ENTRANCE = 7,
}

export enum AntType {
  QUEEN = 'queen',
  WORKER = 'worker',
  SOLDIER = 'soldier',
}

export enum AntState {
  IDLE = 'idle',
  FORAGING = 'foraging',
  RETURNING = 'returning',
  DIGGING = 'digging',
  CARING = 'caring',
  FIGHTING = 'fighting',
  EATING = 'eating',
  FOLLOWING = 'following',
}

export enum EggStage {
  EGG = 'egg',
  LARVA = 'larva',
  PUPA = 'pupa',
}

export enum EnemyType {
  SPIDER = 'spider',
  RIVAL_ANT = 'rival_ant',
}

export enum ViewMode {
  UNDERGROUND = 'underground',
  SURFACE = 'surface',
}

export enum GameSpeed {
  PAUSED = 0,
  NORMAL = 1,
  FAST = 2,
  FASTER = 3,
}

export enum ColonyStatus {
  THRIVING = 'thriving',
  NORMAL = 'normal',
  HUNGRY = 'hungry',
  DANGER = 'danger',
}

export interface FoodSource {
  id: string
  x: number
  y: number
  type: 'leaf' | 'fruit' | 'insect'
  amount: number
  maxAmount: number
}

export interface Enemy {
  id: string
  type: EnemyType
  x: number
  y: number
  health: number
  maxHealth: number
  attack: number
  speed: number
  targetX: number
  targetY: number
  viewX: number
  viewY: number
}

export interface Egg {
  id: string
  stage: EggStage
  timer: number
  x: number
  y: number
  caredFor: boolean
}

export interface Ant {
  id: string
  type: AntType
  x: number
  y: number
  state: AntState
  health: number
  maxHealth: number
  attack: number
  speed: number
  hunger: number
  targetX: number
  targetY: number
  targetId: string | null
  carrying: boolean
  carryingFood: number
  viewX: number
  viewY: number
}

export interface GameEvent {
  id: string
  message: string
  type: 'info' | 'warning' | 'danger' | 'success'
  timestamp: number
}

export interface ColonyState {
  food: number
  maxFood: number
  foodRate: number
  antCounts: Record<AntType | 'egg' | 'larva' | 'pupa', number>
  status: ColonyStatus
  dayNightCycle: number
  events: GameEvent[]
}
