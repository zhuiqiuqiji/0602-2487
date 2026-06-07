import {
  AntType,
  AntState,
  type Egg,
  EggStage,
  EnemyType,
  type FoodSource,
  type GameEvent,
  ColonyStatus,
  ViewMode,
  GameSpeed,
  QUEEN_LAY_INTERVAL,
  EGG_DURATION,
  LARVA_DURATION,
  PUPA_DURATION,
  FOOD_CONSUME_PER_ANT,
  INITIAL_WORKERS,
  INITIAL_SOLDIERS,
  INITIAL_FOOD,
  ENEMY_SPAWN_INTERVAL_MIN,
  ENEMY_SPAWN_INTERVAL_MAX,
  CELL_SIZE,
  NEST_COLS,
  NEST_ROWS,
  CellType,
  HUNGER_THRESHOLD,
  ANT_EAT_AMOUNT,
  PheromoneType,
  Season,
  DisasterType,
  BiomeType,
  RoomType,
  GeneType,
  WATER_CONSUME_PER_ANT,
  INITIAL_WATER,
  INITIAL_MATERIAL,
  INITIAL_MAX_WATER,
  INITIAL_MAX_MATERIAL,
  MATERIAL_FROM_DIGGING,
  DISEASE_SPREAD_RATE,
  THIRST_THRESHOLD,
  ANT_DRINK_AMOUNT,
  INITIAL_MAX_FOOD,
} from '@/utils/constants'
import { generateId, distance, randomRange, randomInt, getColonyStatus } from '@/utils/helpers'
import Ant from '@/game/Ant'
import Enemy from '@/game/Enemy'
import MapGenerator from '@/game/MapGenerator'
import PheromoneSystem from '@/game/PheromoneSystem'
import SeasonSystem from '@/game/SeasonSystem'
import GeneSystem from '@/game/GeneSystem'
import BuildSystem from '@/game/BuildSystem'
import BiomeSystem from '@/game/BiomeSystem'

class Colony {
  ants: Ant[] = []
  eggs: Egg[] = []
  enemies: Enemy[] = []
  foodSources: FoodSource[] = []
  nestGrid: CellType[][] = []
  food: number = INITIAL_FOOD
  maxFood: number = INITIAL_MAX_FOOD
  foodRate: number = 0
  water: number = INITIAL_WATER
  maxWater: number = INITIAL_MAX_WATER
  material: number = INITIAL_MATERIAL
  maxMaterial: number = INITIAL_MAX_MATERIAL
  biome: BiomeType = BiomeType.FOREST
  ownerId: string = 'player1'
  isHibernating: boolean = false
  pheromoneSystem: PheromoneSystem
  seasonSystem: SeasonSystem
  geneSystem: GeneSystem
  buildSystem: BuildSystem
  biomeSystem: BiomeSystem
  viewMode: ViewMode = ViewMode.UNDERGROUND
  gameSpeed: GameSpeed = GameSpeed.NORMAL
  queenLayTimer: number = 0
  enemySpawnTimer: number = ENEMY_SPAWN_INTERVAL_MAX
  entranceX: number = 0
  entranceY: number = 0
  events: GameEvent[] = []
  dayNightCycle: number = 0
  totalGameTime: number = 0

  constructor(biome: BiomeType = BiomeType.FOREST, ownerId: string = 'player1') {
    this.biome = biome
    this.ownerId = ownerId

    this.pheromoneSystem = new PheromoneSystem()
    this.seasonSystem = new SeasonSystem()
    this.geneSystem = new GeneSystem()
    this.buildSystem = new BuildSystem(NEST_COLS, NEST_ROWS)
    this.biomeSystem = new BiomeSystem(biome)

    const mapGen = new MapGenerator()
    this.nestGrid = mapGen.generateNest()

    this.foodSources = this.biomeSystem.generateFoodSources()

    let entranceFound = false
    for (let row = 0; row < NEST_ROWS && !entranceFound; row++) {
      for (let col = 0; col < NEST_COLS && !entranceFound; col++) {
        if (this.nestGrid[row][col] === CellType.ENTRANCE) {
          this.entranceX = col * CELL_SIZE + CELL_SIZE / 2
          this.entranceY = row * CELL_SIZE + CELL_SIZE / 2
          entranceFound = true
        }
      }
    }

    let queenX = this.entranceX
    let queenY = this.entranceY
    for (let row = 0; row < NEST_ROWS; row++) {
      for (let col = 0; col < NEST_COLS; col++) {
        if (this.nestGrid[row][col] === CellType.QUEEN_CHAMBER) {
          queenX = col * CELL_SIZE + CELL_SIZE / 2
          queenY = row * CELL_SIZE + CELL_SIZE / 2
        }
      }
    }

    this.ants.push(new Ant(AntType.QUEEN, queenX, queenY, ownerId))

    for (let i = 0; i < INITIAL_WORKERS; i++) {
      const wx = this.entranceX + randomRange(-20, 20)
      const wy = this.entranceY + randomRange(-20, 20)
      this.ants.push(new Ant(AntType.WORKER, wx, wy, ownerId))
    }

    for (let i = 0; i < INITIAL_SOLDIERS; i++) {
      const sx = this.entranceX + randomRange(-20, 20)
      const sy = this.entranceY + randomRange(-20, 20)
      this.ants.push(new Ant(AntType.SOLDIER, sx, sy, ownerId))
    }

    this.applyRoomEffects()
  }

  update(dt: number): void {
    const speedMultiplier = this.gameSpeed as number
    if (this.gameSpeed === GameSpeed.PAUSED) return

    const scaledDt = dt * speedMultiplier
    this.totalGameTime += scaledDt
    this.dayNightCycle = (Math.sin(this.totalGameTime * 0.0002) + 1) / 2

    const seasonResult = this.seasonSystem.update(scaledDt)
    const seasonModifiers = this.seasonSystem.getSeasonModifier()

    if (seasonResult.seasonChanged) {
      this.handleSeasonChange()
    }

    if (seasonResult.disasterTriggered) {
      this.addEvent(`灾难来袭: ${this.seasonSystem.getDisasterName()}!`, 'danger')
    }

    if (this.seasonSystem.state.upcomingDisaster !== DisasterType.NONE && this.seasonSystem.state.disasterCountdown < 5000) {
      const disasterConfig = this.seasonSystem.getActiveDisasterConfig()
      if (disasterConfig && disasterConfig.warnings.length > 0) {
        const warning = disasterConfig.warnings[Math.floor(Math.random() * disasterConfig.warnings.length)]
        this.addEvent(warning, 'warning')
      }
    }

    if (this.seasonSystem.state.activeDisaster !== DisasterType.NONE) {
      this.handleDisasterEffects(scaledDt)
    }

    this.isHibernating = this.seasonSystem.state.currentSeason === Season.WINTER

    const geneBonus = { speed: this.geneSystem.getCombinedSpeedBonus() }

    for (const ant of this.ants) {
      ant.update(scaledDt, geneBonus, seasonModifiers)
    }

    for (const enemy of this.enemies) {
      enemy.update(scaledDt, this.entranceX, this.entranceY)
    }

    for (const ant of this.ants) {
      this.processAntAI(ant, scaledDt)
    }

    this.processCombat(scaledDt)

    const reproductionBonus = this.geneSystem.getCombinedReproductionBonus()
    const adjustedLayInterval = QUEEN_LAY_INTERVAL / (1 + seasonModifiers.reproductionMod) / reproductionBonus
    this.queenLayTimer += scaledDt
    if (this.queenLayTimer >= adjustedLayInterval && !this.isHibernating) {
      this.layEgg()
    }

    this.updateEggs(scaledDt)

    const foodConsumptionMod = 1 + seasonModifiers.consumptionMod
    let foodConsumption = 0
    let waterConsumption = 0
    for (const ant of this.ants) {
      if (ant.state !== AntState.HIBERNATING) {
        foodConsumption += FOOD_CONSUME_PER_ANT * scaledDt * foodConsumptionMod
        waterConsumption += WATER_CONSUME_PER_ANT * scaledDt
      }
    }
    this.food = Math.max(0, this.food - foodConsumption)
    this.water = Math.max(0, this.water - waterConsumption)
    this.foodRate = -foodConsumption / scaledDt
    this.applyRoomEffects()

    for (const fs of this.foodSources) {
      if (fs.amount < fs.maxAmount && Math.random() < 0.0001 * scaledDt * (1 + seasonModifiers.foodMod)) {
        this.biomeSystem.replenishFoodSource(fs)
      }
    }

    this.pheromoneSystem.update(scaledDt)

    const buildResult = this.buildSystem.updateBuilds(this.ants, scaledDt)
    this.material = Math.min(this.maxMaterial, this.material + buildResult.materialGained)

    for (const room of buildResult.completedRooms) {
      this.addEvent(`建造完成: ${room.type}`, 'success')
    }

    this.processDiseaseSpread(scaledDt)

    this.releaseAntPheromones()

    this.enemySpawnTimer -= scaledDt
    if (this.enemySpawnTimer <= 0 && !this.isHibernating) {
      this.spawnEnemyFromBiome()
      this.enemySpawnTimer = randomRange(ENEMY_SPAWN_INTERVAL_MIN, ENEMY_SPAWN_INTERVAL_MAX)
    }

    this.ants = this.ants.filter((a) => a.health > 0)
    this.enemies = this.enemies.filter((e) => e.health > 0)
  }

  processAntAI(ant: Ant, dt: number): void {
    if (ant.type === AntType.QUEEN) return

    if (this.isHibernating) {
      ant.state = AntState.HIBERNATING
      return
    }

    for (const enemy of this.enemies) {
      if (distance(ant.x, ant.y, enemy.x, enemy.y) < 80 && ant.type === AntType.SOLDIER) {
        ant.state = AntState.FIGHTING
        ant.targetX = enemy.x
        ant.targetY = enemy.y
        ant.targetId = enemy.id
        return
      }
    }

    if (ant.thirst >= THIRST_THRESHOLD) {
      let waterX = this.entranceX
      let waterY = this.entranceY
      for (let row = 0; row < NEST_ROWS; row++) {
        for (let col = 0; col < NEST_COLS; col++) {
          if (this.nestGrid[row][col] === CellType.WATER_RESERVOIR) {
            waterX = col * CELL_SIZE + CELL_SIZE / 2
            waterY = row * CELL_SIZE + CELL_SIZE / 2
          }
        }
      }
      ant.state = AntState.DRINKING
      ant.targetX = waterX
      ant.targetY = waterY
      ant.targetId = null
      if (distance(ant.x, ant.y, waterX, waterY) < 20 && this.water > 0) {
        const drunk = Math.min(ANT_DRINK_AMOUNT, this.water)
        this.water -= drunk
        ant.thirst = Math.max(0, ant.thirst - drunk)
      }
      return
    }

    if (ant.hunger >= HUNGER_THRESHOLD) {
      let foodStorageX = this.entranceX
      let foodStorageY = this.entranceY
      for (let row = 0; row < NEST_ROWS; row++) {
        for (let col = 0; col < NEST_COLS; col++) {
          if (this.nestGrid[row][col] === CellType.FOOD_STORAGE) {
            foodStorageX = col * CELL_SIZE + CELL_SIZE / 2
            foodStorageY = row * CELL_SIZE + CELL_SIZE / 2
          }
        }
      }
      ant.state = AntState.EATING
      ant.targetX = foodStorageX
      ant.targetY = foodStorageY
      ant.targetId = null
      if (distance(ant.x, ant.y, foodStorageX, foodStorageY) < 20 && this.food > 0) {
        const eaten = Math.min(ANT_EAT_AMOUNT, this.food)
        this.food -= eaten
        ant.hunger = Math.max(0, ant.hunger - eaten)
      }
      return
    }

    if (ant.state === AntState.CONSTRUCTING && ant.targetId) {
      return
    }

    if (this.buildSystem.pendingBuilds.length > 0 && ant.type === AntType.WORKER && ant.state === AntState.IDLE) {
      const pending = this.buildSystem.pendingBuilds[0]
      const centerX = (pending.gridX + pending.width / 2) * CELL_SIZE
      const centerY = (pending.gridY + pending.height / 2) * CELL_SIZE
      if (distance(ant.x, ant.y, centerX, centerY) < 60) {
        ant.state = AntState.CONSTRUCTING
        ant.targetX = centerX
        ant.targetY = centerY
        ant.targetId = pending.id
        return
      }
    }

    if (ant.state === AntState.FORAGING && ant.targetId) {
      const fs = this.foodSources.find((f) => f.id === ant.targetId)
      if (fs && distance(ant.x, ant.y, fs.x, fs.y) < 15) {
        const collected = Math.min(10 * this.geneSystem.getCombinedCapacityBonus(), fs.amount)
        fs.amount -= collected
        ant.pickUpFood(collected)
        ant.state = AntState.RETURNING
        let foodStorageX = this.entranceX
        let foodStorageY = this.entranceY
        for (let row = 0; row < NEST_ROWS; row++) {
          for (let col = 0; col < NEST_COLS; col++) {
            if (this.nestGrid[row][col] === CellType.FOOD_STORAGE) {
              foodStorageX = col * CELL_SIZE + CELL_SIZE / 2
              foodStorageY = row * CELL_SIZE + CELL_SIZE / 2
            }
          }
        }
        ant.targetX = foodStorageX
        ant.targetY = foodStorageY
        ant.targetId = null
      } else if (fs) {
        const pheromoneDir = this.pheromoneSystem.getStrongestDirection(ant.x, ant.y, PheromoneType.FORAGING)
        if (pheromoneDir.strength > 0.3) {
          ant.targetX = fs.x + pheromoneDir.dx * 30
          ant.targetY = fs.y + pheromoneDir.dy * 30
        }
      }
      return
    }

    if (ant.state === AntState.RETURNING && ant.carrying) {
      let foodStorageX = this.entranceX
      let foodStorageY = this.entranceY
      for (let row = 0; row < NEST_ROWS; row++) {
        for (let col = 0; col < NEST_COLS; col++) {
          if (this.nestGrid[row][col] === CellType.FOOD_STORAGE) {
            foodStorageX = col * CELL_SIZE + CELL_SIZE / 2
            foodStorageY = row * CELL_SIZE + CELL_SIZE / 2
          }
        }
      }
      if (distance(ant.x, ant.y, foodStorageX, foodStorageY) < 20) {
        this.food = Math.min(this.maxFood, this.food + ant.carryingFood)
        ant.carrying = false
        ant.carryingFood = 0
        ant.state = AntState.IDLE
      } else {
        const pheromoneDir = this.pheromoneSystem.getStrongestDirection(ant.x, ant.y, PheromoneType.HOMING)
        if (pheromoneDir.strength > 0.2) {
          ant.targetX = foodStorageX + pheromoneDir.dx * 20
          ant.targetY = foodStorageY + pheromoneDir.dy * 20
        }
      }
      return
    }

    if (ant.state === AntState.DIGGING && ant.targetId === null) {
      const gridX = Math.floor(ant.targetX / CELL_SIZE)
      const gridY = Math.floor(ant.targetY / CELL_SIZE)
      if (gridY >= 0 && gridY < NEST_ROWS && gridX >= 0 && gridX < NEST_COLS) {
        if (distance(ant.x, ant.y, ant.targetX, ant.targetY) < 15) {
          if (this.nestGrid[gridY][gridX] === CellType.DIRT) {
            this.nestGrid[gridY][gridX] = CellType.TUNNEL
            this.material = Math.min(this.maxMaterial, this.material + MATERIAL_FROM_DIGGING)
            this.addEvent('工蚁挖掘了新的隧道!', 'info')
          }
          ant.state = AntState.IDLE
        }
      }
      return
    }

    if (ant.targetId && ant.state !== AntState.IDLE) return

    if (this.food < this.maxFood * 0.5) {
      const nearestFood = this.foodSources.reduce<{ fs: FoodSource; dist: number } | null>(
        (best, fs) => {
          if (fs.amount <= 0) return best
          const d = distance(ant.x, ant.y, fs.x, fs.y)
          if (!best || d < best.dist) return { fs, dist: d }
          return best
        },
        null,
      )
      if (nearestFood) {
        ant.state = AntState.FORAGING
        ant.targetX = nearestFood.fs.x
        ant.targetY = nearestFood.fs.y
        ant.targetId = nearestFood.fs.id
        return
      }
    }

    const uncaredEgg = this.eggs.find((e) => !e.caredFor)
    if (uncaredEgg) {
      ant.state = AntState.CARING
      ant.targetX = uncaredEgg.x
      ant.targetY = uncaredEgg.y
      ant.targetId = uncaredEgg.id
      uncaredEgg.caredFor = true
      return
    }

    if (ant.state === AntState.IDLE) {
      const d = distance(ant.x, ant.y, ant.targetX, ant.targetY)
      if (d < 5) {
        ant.targetX = ant.x + randomRange(-60, 60)
        ant.targetY = ant.y + randomRange(-60, 60)
      }
      return
    }

    ant.state = AntState.IDLE
    ant.targetX = ant.x + randomRange(-40, 40)
    ant.targetY = ant.y + randomRange(-40, 40)
    ant.targetId = null
  }

  processCombat(dt: number): void {
    for (const enemy of this.enemies) {
      for (const ant of this.ants) {
        if (ant.state === AntState.FIGHTING || ant.type === AntType.SOLDIER) {
          const dist = distance(ant.x, ant.y, enemy.x, enemy.y)
          if (dist < 20) {
            enemy.health -= ant.attack * dt
            ant.health -= enemy.attack * dt
            if (enemy.health <= 0) {
              this.addEvent(`Enemy ${enemy.type} defeated!`, 'success')
            }
            if (ant.health <= 0) {
              this.addEvent(`An ${ant.type} ant was killed in combat`, 'danger')
            }
          }
        }
      }
    }
  }

  spawnEnemy(): void {
    const type: EnemyType = Math.random() < 0.6 ? EnemyType.SPIDER : EnemyType.RIVAL_ANT
    const edge = randomInt(0, 3)
    let x: number, y: number
    const mapW = NEST_COLS * CELL_SIZE
    const mapH = NEST_ROWS * CELL_SIZE
    switch (edge) {
      case 0:
        x = randomRange(0, mapW)
        y = 0
        break
      case 1:
        x = mapW
        y = randomRange(0, mapH)
        break
      case 2:
        x = randomRange(0, mapW)
        y = mapH
        break
      default:
        x = 0
        y = randomRange(0, mapH)
        break
    }
    this.enemies.push(new Enemy(type, x, y))
    this.addEvent(`A ${type} has appeared near the colony!`, 'warning')
  }

  layEgg(): void {
    if (this.food <= 20) return
    const queen = this.ants.find((a) => a.type === AntType.QUEEN)
    if (!queen) return
    this.eggs.push({
      id: generateId(),
      stage: EggStage.EGG,
      timer: EGG_DURATION,
      x: queen.x,
      y: queen.y,
      caredFor: false,
    })
    this.queenLayTimer = 0
    this.food -= 5
  }

  updateEggs(dt: number): void {
    const toRemove: string[] = []
    const toSpawn: { x: number; y: number }[] = []
    const seasonModifiers = this.seasonSystem.getSeasonModifier()

    for (const egg of this.eggs) {
      let nearNursery = false
      const gridX = Math.floor(egg.x / CELL_SIZE)
      const gridY = Math.floor(egg.y / CELL_SIZE)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const r = gridY + dy
          const c = gridX + dx
          if (r >= 0 && r < NEST_ROWS && c >= 0 && c < NEST_COLS) {
            if (this.nestGrid[r][c] === CellType.NURSERY) {
              nearNursery = true
            }
          }
        }
      }

      const speedMult = (egg.caredFor && nearNursery ? 1.5 : egg.caredFor ? 1.0 : 0.3) * (1 + seasonModifiers.reproductionMod)
      egg.timer -= dt * speedMult

      if (egg.timer <= 0) {
        if (egg.stage === EggStage.EGG) {
          egg.stage = EggStage.LARVA
          egg.timer = LARVA_DURATION
          egg.caredFor = false
        } else if (egg.stage === EggStage.LARVA) {
          egg.stage = EggStage.PUPA
          egg.timer = PUPA_DURATION
          egg.caredFor = false
        } else {
          toRemove.push(egg.id)
          toSpawn.push({ x: egg.x, y: egg.y })
        }
      }
    }

    this.eggs = this.eggs.filter((e) => !toRemove.includes(e.id))

    for (const pos of toSpawn) {
      const type: AntType = Math.random() < 0.7 ? AntType.WORKER : AntType.SOLDIER
      const newAnt = new Ant(type, pos.x, pos.y, this.ownerId)
      newAnt.speed *= this.geneSystem.getCombinedSpeedBonus()
      newAnt.attack *= this.geneSystem.getCombinedStrengthBonus()
      newAnt.maxHealth *= this.geneSystem.getCombinedStrengthBonus()
      newAnt.health = newAnt.maxHealth
      newAnt.geneBonus = this.geneSystem.getTotalGeneBonus()
      this.geneSystem.addGenePoints()
      this.ants.push(newAnt)
      this.addEvent(`A new ${type} ant has hatched!`, 'success')
    }
  }

  addEvent(message: string, type: GameEvent['type']): void {
    this.events.push({
      id: generateId(),
      message,
      type,
      timestamp: this.totalGameTime,
    })
    if (this.events.length > 20) {
      this.events = this.events.slice(-20)
    }
  }

  assignAntTask(
    antId: string,
    state: AntState,
    targetX: number,
    targetY: number,
    targetId?: string,
  ): void {
    const ant = this.ants.find((a) => a.id === antId)
    if (!ant) return
    ant.state = state
    ant.targetX = targetX
    ant.targetY = targetY
    ant.targetId = targetId ?? null
  }

  getStatus(): ColonyStatus {
    return getColonyStatus(this.food, this.maxFood, this.ants.length, this.enemies.length)
  }

  getAntCounts(): Record<AntType | 'egg' | 'larva' | 'pupa', number> {
    const counts: Record<AntType | 'egg' | 'larva' | 'pupa', number> = {
      [AntType.QUEEN]: 0,
      [AntType.WORKER]: 0,
      [AntType.SOLDIER]: 0,
      [AntType.REPRODUCTIVE]: 0,
      egg: 0,
      larva: 0,
      pupa: 0,
    }
    for (const ant of this.ants) {
      counts[ant.type]++
    }
    for (const egg of this.eggs) {
      counts[egg.stage]++
    }
    return counts
  }

  markFoodSource(foodSourceId: string): void {
    const fs = this.foodSources.find((f) => f.id === foodSourceId)
    if (!fs) return
    const idleWorkers = this.ants.filter(
      (a) => a.type === AntType.WORKER && a.state === AntState.IDLE,
    )
    const nearby = idleWorkers
      .map((a) => ({ ant: a, dist: distance(a.x, a.y, fs.x, fs.y) }))
      .sort((a, b) => a.dist - b.dist)
    const toAssign = nearby.slice(0, 3)
    for (const { ant } of toAssign) {
      ant.state = AntState.FORAGING
      ant.targetX = fs.x
      ant.targetY = fs.y
      ant.targetId = fs.id
    }
  }

  markDigTarget(gridX: number, gridY: number): void {
    const idleWorkers = this.ants.filter(
      (a) => a.type === AntType.WORKER && a.state === AntState.IDLE,
    )
    const targetX = gridX * CELL_SIZE + CELL_SIZE / 2
    const targetY = gridY * CELL_SIZE + CELL_SIZE / 2
    const nearby = idleWorkers
      .map((a) => ({ ant: a, dist: distance(a.x, a.y, targetX, targetY) }))
      .sort((a, b) => a.dist - b.dist)
    if (nearby.length > 0) {
      const ant = nearby[0].ant
      ant.state = AntState.DIGGING
      ant.targetX = targetX
      ant.targetY = targetY
      ant.targetId = null
    }
  }

  upgradeGene(geneType: GeneType): { success: boolean; message: string } {
    const result = this.geneSystem.upgradeGene(geneType, this.food, this.material)
    if (result.success) {
      this.food -= result.cost.food
      this.material -= result.cost.material
      this.addEvent(result.message, 'success')
    } else {
      this.addEvent(result.message, 'warning')
    }
    return { success: result.success, message: result.message }
  }

  startBuild(roomType: RoomType, gridX: number, gridY: number): { success: boolean; message: string } {
    const result = this.buildSystem.startBuild(
      roomType,
      gridX,
      gridY,
      this.food,
      this.material,
      this.ants.length,
      this.geneSystem.getTotalGeneBonus(),
    )
    if (result.success) {
      this.food -= result.cost.food
      this.material -= result.cost.material
      this.addEvent(result.message, 'info')
    } else {
      this.addEvent(result.message, 'warning')
    }
    return { success: result.success, message: result.message }
  }

  cancelBuild(roomId: string): boolean {
    const build = this.buildSystem.pendingBuilds.find((b) => b.id === roomId)
    if (build) {
      this.material = Math.min(this.maxMaterial, this.material + Math.floor(MATERIAL_FROM_DIGGING * 10))
    }
    const success = this.buildSystem.cancelBuild(roomId)
    if (success) {
      this.addEvent('建造已取消', 'info')
    }
    return success
  }

  setBiome(biome: BiomeType): void {
    this.biome = biome
    this.biomeSystem.changeBiome(biome)
    this.foodSources = this.biomeSystem.foodSources
    this.addEvent(`生态群系已变更为: ${this.biomeSystem.getBiomeName()}`, 'info')
  }

  togglePheromoneVisible(): void {
    this.pheromoneSystem.toggleVisible()
  }

  getSeasonState() {
    return this.seasonSystem.state
  }

  getGeneStats() {
    return this.geneSystem.stats
  }

  getRooms() {
    return {
      rooms: this.buildSystem.rooms,
      pendingBuilds: this.buildSystem.pendingBuilds,
    }
  }

  getWaterRate(): number {
    let total = 0
    for (const ant of this.ants) {
      if (ant.state !== AntState.HIBERNATING) {
        total -= WATER_CONSUME_PER_ANT
      }
    }
    const effects = this.buildSystem.getRoomEffects()
    total += effects.waterProduction
    return total
  }

  getMaterialRate(): number {
    let total = 0
    const constructing = this.ants.filter(
      (a) => a.state === AntState.CONSTRUCTING,
    ).length
    total += constructing * MATERIAL_FROM_DIGGING * 0.1
    return total
  }

  getSeasonModifiers() {
    return this.seasonSystem.getSeasonModifier()
  }

  spawnEnemyFromBiome(): void {
    const { type, x, y } = this.biomeSystem.spawnEnemy()
    this.enemies.push(new Enemy(type, x, y))
    this.addEvent(`A ${type} has appeared near the colony!`, 'warning')
  }

  handleSeasonChange(): void {
    const season = this.seasonSystem.state.currentSeason
    const seasonName = this.seasonSystem.getSeasonName()
    this.addEvent(`季节变更: ${seasonName}`, 'info')

    if (season === Season.WINTER) {
      this.isHibernating = true
      this.addEvent('蚁群进入冬眠状态', 'warning')
    } else if (this.isHibernating) {
      this.isHibernating = false
      this.addEvent('蚁群从冬眠中苏醒', 'success')
    }

    if (season === Season.AUTUMN) {
      for (const ant of this.ants) {
        if (ant.type === AntType.WORKER) {
          ant.state = AntState.FORAGING
          const nearestFood = this.foodSources.reduce<{ fs: FoodSource; dist: number } | null>(
            (best, fs) => {
              if (fs.amount <= 0) return best
              const d = distance(ant.x, ant.y, fs.x, fs.y)
              if (!best || d < best.dist) return { fs, dist: d }
              return best
            },
            null,
          )
          if (nearestFood) {
            ant.targetX = nearestFood.fs.x
            ant.targetY = nearestFood.fs.y
            ant.targetId = nearestFood.fs.id
          }
        }
      }
    }
  }

  handleDisasterEffects(dt: number): void {
    const disasterConfig = this.seasonSystem.getActiveDisasterConfig()
    if (!disasterConfig) return

    const effects = disasterConfig.effects

    if (effects.antDeathRate) {
      for (const ant of this.ants) {
        if (Math.random() < effects.antDeathRate * dt) {
          ant.health -= 5 * dt
        }
      }
    }

    if (effects.foodLossRate) {
      this.food = Math.max(0, this.food * (1 - effects.foodLossRate * dt))
    }

    if (effects.waterLossRate) {
      this.water = Math.max(0, this.water * (1 - effects.waterLossRate * dt))
    }

    if (effects.infectionRate) {
      for (const ant of this.ants) {
        if (!ant.isSick && Math.random() < effects.infectionRate * dt) {
          ant.isSick = true
          ant.infectionTimer = 30000
          this.addEvent(`一只${ant.type}蚂蚁生病了!`, 'danger')
        }
      }
    }

    if (disasterConfig.id === DisasterType.FLOOD) {
      for (let row = 0; row < NEST_ROWS; row++) {
        for (let col = 0; col < NEST_COLS; col++) {
          if (this.nestGrid[row][col] !== CellType.DIRT && this.nestGrid[row][col] !== CellType.ENTRANCE) {
            if (Math.random() < 0.0001 * dt) {
              this.nestGrid[row][col] = CellType.FLOODED
            }
          }
        }
      }
    }
  }

  processDiseaseSpread(dt: number): void {
    const sickAnts = this.ants.filter((a) => a.isSick)
    const healthyAnts = this.ants.filter((a) => !a.isSick)
    const diseaseResist = this.geneSystem.getCombinedDiseaseBonus()

    for (const sick of sickAnts) {
      for (const healthy of healthyAnts) {
        if (distance(sick.x, sick.y, healthy.x, healthy.y) < 25) {
          const spreadRate = DISEASE_SPREAD_RATE / diseaseResist
          if (Math.random() < spreadRate * dt) {
            healthy.isSick = true
            healthy.infectionTimer = 30000
            this.addEvent(`疾病传播: 一只${healthy.type}蚂蚁被感染!`, 'danger')
          }
        }
      }
    }
  }

  releaseAntPheromones(): void {
    for (const ant of this.ants) {
      if (ant.state === AntState.FORAGING) {
        this.pheromoneSystem.releasePheromone(ant.x, ant.y, PheromoneType.FORAGING, 0.5)
      } else if (ant.state === AntState.FIGHTING) {
        this.pheromoneSystem.releasePheromone(ant.x, ant.y, PheromoneType.ALARM, 0.8)
      } else if (ant.state === AntState.RETURNING && ant.carrying) {
        this.pheromoneSystem.releasePheromone(ant.x, ant.y, PheromoneType.HOMING, 0.6)
      }
    }
  }

  applyRoomEffects(): void {
    const effects = this.buildSystem.getRoomEffects()
    this.maxFood = INITIAL_MAX_FOOD + effects.foodCapacity
    this.maxWater = INITIAL_MAX_WATER + effects.waterCapacity
    this.maxMaterial = INITIAL_MAX_MATERIAL + Math.floor(effects.foodCapacity * 0.5)

    if (effects.foodProduction > 0) {
      this.food = Math.min(this.maxFood, this.food + effects.foodProduction * 0.001)
    }
    if (effects.waterProduction > 0) {
      this.water = Math.min(this.maxWater, this.water + effects.waterProduction * 0.001)
    }
  }
}

export default Colony
