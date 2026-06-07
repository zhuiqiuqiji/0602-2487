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
export const WATER_CONSUME_PER_ANT = 0.015
export const WORKER_SPEED = 1.2
export const SOLDIER_SPEED = 0.8
export const REPRODUCTIVE_SPEED = 1.0
export const ANT_HUNGER_RATE = 0.3
export const ANT_THIRST_RATE = 0.25
export const ANT_EAT_AMOUNT = 10
export const ANT_DRINK_AMOUNT = 8
export const HUNGER_THRESHOLD = 70
export const THIRST_THRESHOLD = 65

export const ENEMY_SPAWN_INTERVAL_MIN = 30000
export const ENEMY_SPAWN_INTERVAL_MAX = 60000
export const SPIDER_HEALTH = 80
export const SPIDER_ATTACK = 8
export const SPIDER_SPEED = 0.6
export const RIVAL_ANT_HEALTH = 30
export const RIVAL_ANT_ATTACK = 4
export const RIVAL_ANT_SPEED = 1.0
export const SCORPION_HEALTH = 100
export const SCORPION_ATTACK = 12
export const SCORPION_SPEED = 0.5
export const LIZARD_HEALTH = 120
export const LIZARD_ATTACK = 15
export const LIZARD_SPEED = 0.7
export const EATER_HEALTH = 200
export const EATER_ATTACK = 25
export const EATER_SPEED = 0.4
export const BIRD_HEALTH = 90
export const BIRD_ATTACK = 18
export const BIRD_SPEED = 1.5
export const ARMY_ANT_HEALTH = 25
export const ARMY_ANT_ATTACK = 6
export const ARMY_ANT_SPEED = 1.3
export const PARASITE_WASP_HEALTH = 40
export const PARASITE_WASP_ATTACK = 10
export const PARASITE_WASP_SPEED = 1.1
export const BEETLE_HEALTH = 60
export const BEETLE_ATTACK = 5
export const BEETLE_SPEED = 0.4

export const WORKER_HEALTH = 40
export const WORKER_ATTACK = 3
export const SOLDIER_HEALTH = 70
export const SOLDIER_ATTACK = 8
export const REPRODUCTIVE_HEALTH = 30
export const REPRODUCTIVE_ATTACK = 2
export const QUEEN_HEALTH = 150
export const QUEEN_ATTACK = 0

export const INITIAL_WORKERS = 5
export const INITIAL_SOLDIERS = 2
export const INITIAL_FOOD = 100
export const INITIAL_WATER = 80
export const INITIAL_MATERIAL = 30
export const INITIAL_MAX_FOOD = 200
export const INITIAL_MAX_WATER = 150
export const INITIAL_MAX_MATERIAL = 100

export const PHEROMONE_DECAY_RATE = 0.005
export const PHEROMONE_DIFFUSE_RATE = 0.02
export const PHEROMONE_RELEASE_RATE = 0.8
export const PHEROMONE_BOOST_RATE = 0.2
export const PHEROMONE_PERCEPTION_RANGE = 5

export const SEASON_DURATION = 120000
export const SEASON_TRANSITION_DURATION = 10000
export const DISASTER_WARNING_TIME = 18000
export const DISEASE_SPREAD_RATE = 0.03

export const GENE_LEVEL_MAX = 10
export const GENE_UPGRADE_COST_BASE = 20
export const GENE_POINTS_PER_HATCH = 1

export const INITIAL_GENE_SPEED = 1
export const INITIAL_GENE_STRENGTH = 1
export const INITIAL_GENE_DISEASE_RESIST = 1
export const INITIAL_GENE_CAPACITY = 1
export const INITIAL_GENE_REPRODUCTION = 1

export const MATERIAL_FROM_DIGGING = 2

export enum CellType {
  EMPTY = 0,
  DIRT = 1,
  TUNNEL = 2,
  ROOM = 3,
  QUEEN_CHAMBER = 4,
  NURSERY = 5,
  FOOD_STORAGE = 6,
  ENTRANCE = 7,
  WATER_RESERVOIR = 8,
  BARRACKS = 9,
  FUNGUS_FARM = 10,
  CONSTRUCTION = 11,
  FLOODED = 12,
}

export enum AntType {
  QUEEN = 'queen',
  WORKER = 'worker',
  SOLDIER = 'soldier',
  REPRODUCTIVE = 'reproductive',
}

export enum AntState {
  IDLE = 'idle',
  FORAGING = 'foraging',
  RETURNING = 'returning',
  DIGGING = 'digging',
  CARING = 'caring',
  FIGHTING = 'fighting',
  EATING = 'eating',
  DRINKING = 'drinking',
  FOLLOWING = 'following',
  CONSTRUCTING = 'constructing',
  FARMING = 'farming',
  PATROLLING = 'patrolling',
  MATING_FLIGHT = 'mating_flight',
  HIBERNATING = 'hibernating',
  SCOUTING = 'scouting',
  RAIDING = 'raiding',
}

export enum EggStage {
  EGG = 'egg',
  LARVA = 'larva',
  PUPA = 'pupa',
}

export enum EnemyType {
  SPIDER = 'spider',
  RIVAL_ANT = 'rival_ant',
  SCORPION = 'scorpion',
  LIZARD = 'lizard',
  EATER = 'anteater',
  BIRD = 'bird',
  ARMY_ANT = 'army_ant',
  PARASITE_WASP = 'parasite_wasp',
  BEETLE = 'beetle',
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
  DISEASED = 'diseased',
  HIBERNATING = 'hibernating',
  FLOODED = 'flooded',
  DROUGHT = 'drought',
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

export enum DisasterType {
  NONE = 'none',
  FLOOD = 'flood',
  DROUGHT = 'drought',
  BLIZZARD = 'blizzard',
  DISEASE = 'disease',
  WILDFIRE = 'wildfire',
}

export enum BiomeType {
  FOREST = 'forest',
  DESERT = 'desert',
  GRASSLAND = 'grassland',
  RAINFOREST = 'rainforest',
}

export enum RoomType {
  FOOD_STORAGE_ROOM = 'food_storage',
  NURSERY_ROOM = 'nursery',
  QUEEN_CHAMBER_ROOM = 'queen_chamber',
  WATER_RESERVOIR_ROOM = 'water_reservoir',
  BARRACKS_ROOM = 'barracks',
  FUNGUS_FARM_ROOM = 'fungus_farm',
}

export enum PheromoneType {
  FORAGING = 'foraging',
  ALARM = 'alarm',
  HOMING = 'homing',
}

export enum GeneType {
  SPEED = 'speed',
  STRENGTH = 'strength',
  DISEASE_RESIST = 'disease_resist',
  CAPACITY = 'capacity',
  REPRODUCTION = 'reproduction',
}

export enum GameMode {
  SINGLE = 'single',
  BATTLE = 'battle',
}

export interface PheromoneMap {
  foraging: Float32Array
  alarm: Float32Array
  homing: Float32Array
  width: number
  height: number
}

export interface GeneStats {
  speed: number
  strength: number
  diseaseResist: number
  capacity: number
  reproduction: number
  genePoints: number
}

export interface Room {
  id: string
  type: RoomType
  gridX: number
  gridY: number
  width: number
  height: number
  buildProgress: number
  active: boolean
}

export interface SeasonState {
  currentSeason: Season
  dayInSeason: number
  upcomingDisaster: DisasterType
  disasterCountdown: number
  activeDisaster: DisasterType
  disasterTimer: number
  transitionProgress: number
}

export interface BiomeConfig {
  id: BiomeType
  name: string
  description: string
  foodAbundance: number
  enemyTypes: EnemyType[]
  possibleDisasters: DisasterType[]
  colors: {
    surface: string
    surfaceLight: string
    accent: string
  }
  foodTypes: Array<'leaf' | 'fruit' | 'insect' | 'seed' | 'nectar' | 'fungus'>
}

export interface RoomConfig {
  id: RoomType
  name: string
  description: string
  size: { width: number; height: number }
  cost: { material: number; food: number }
  unlockCondition: { antCount?: number; geneLevel?: number }
  effects: {
    foodCapacity?: number
    waterCapacity?: number
    reproductionBonus?: number
    attackBonus?: number
    foodProduction?: number
    diseaseResist?: number
    waterProduction?: number
  }
  cellType: CellType
}

export interface DisasterConfig {
  id: DisasterType
  name: string
  description: string
  possibleSeasons: Season[]
  baseProbability: number
  duration: { min: number; max: number }
  effects: {
    antDeathRate?: number
    foodLossRate?: number
    waterLossRate?: number
    speedModifier?: number
    attackModifier?: number
    damageRate?: number
    infectionRate?: number
  }
  warnings: string[]
}

export interface FoodSource {
  id: string
  x: number
  y: number
  type: 'leaf' | 'fruit' | 'insect' | 'seed' | 'nectar' | 'fungus'
  amount: number
  maxAmount: number
  ownerColony?: string
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
  ownerColony?: string
}

export interface Egg {
  id: string
  stage: EggStage
  timer: number
  x: number
  y: number
  caredFor: boolean
  targetType?: AntType
  ownerColony?: string
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
  baseSpeed: number
  hunger: number
  thirst: number
  geneBonus: number
  level: number
  isSick: boolean
  infectionTimer: number
  targetX: number
  targetY: number
  targetId: string | null
  carrying: boolean
  carryingFood: number
  carryingWater: number
  carryingMaterial: number
  viewX: number
  viewY: number
  ownerColony: string
}

export interface GameEvent {
  id: string
  message: string
  type: 'info' | 'warning' | 'danger' | 'success'
  timestamp: number
  colonyId?: string
}

export interface ColonyState {
  food: number
  maxFood: number
  foodRate: number
  water: number
  maxWater: number
  waterRate: number
  material: number
  maxMaterial: number
  antCounts: Record<AntType | 'egg' | 'larva' | 'pupa', number>
  status: ColonyStatus
  dayNightCycle: number
  events: GameEvent[]
  genes: GeneStats
  season: SeasonState
  rooms: Room[]
  biome: BiomeType
  showPheromones: boolean
  buildMode: RoomType | null
  playerId: string
}

export interface BattleState {
  player1Colony: string
  player2Colony: string
  currentTurn: number
  turnTimer: number
  turnDuration: number
  territory: Map<string, number>
  winner: string | null
}
