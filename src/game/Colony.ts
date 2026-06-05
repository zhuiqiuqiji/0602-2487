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
} from '@/utils/constants'
import { generateId, distance, randomRange, randomInt, getColonyStatus } from '@/utils/helpers'
import Ant from '@/game/Ant'
import Enemy from '@/game/Enemy'
import MapGenerator from '@/game/MapGenerator'

class Colony {
  ants: Ant[] = []
  eggs: Egg[] = []
  enemies: Enemy[] = []
  foodSources: FoodSource[] = []
  nestGrid: CellType[][] = []
  food: number = INITIAL_FOOD
  maxFood: number = 500
  foodRate: number = 0
  viewMode: ViewMode = ViewMode.UNDERGROUND
  gameSpeed: GameSpeed = GameSpeed.NORMAL
  queenLayTimer: number = 0
  enemySpawnTimer: number = ENEMY_SPAWN_INTERVAL_MAX
  entranceX: number = 0
  entranceY: number = 0
  events: GameEvent[] = []
  dayNightCycle: number = 0
  totalGameTime: number = 0

  constructor() {
    const mapGen = new MapGenerator()
    this.nestGrid = mapGen.generateNest()

    const surfaceFoodTypes: FoodSource['type'][] = ['leaf', 'fruit', 'insect']
    for (let i = 0; i < 8; i++) {
      const type = surfaceFoodTypes[randomInt(0, 2)]
      const maxAmount = type === 'insect' ? 50 : type === 'fruit' ? 80 : 120
      this.foodSources.push({
        id: generateId(),
        x: randomRange(50, NEST_COLS * CELL_SIZE - 50),
        y: randomRange(50, NEST_ROWS * CELL_SIZE - 50),
        type,
        amount: maxAmount,
        maxAmount,
      })
    }

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

    this.ants.push(new Ant(AntType.QUEEN, queenX, queenY))

    for (let i = 0; i < INITIAL_WORKERS; i++) {
      const wx = this.entranceX + randomRange(-20, 20)
      const wy = this.entranceY + randomRange(-20, 20)
      this.ants.push(new Ant(AntType.WORKER, wx, wy))
    }

    for (let i = 0; i < INITIAL_SOLDIERS; i++) {
      const sx = this.entranceX + randomRange(-20, 20)
      const sy = this.entranceY + randomRange(-20, 20)
      this.ants.push(new Ant(AntType.SOLDIER, sx, sy))
    }
  }

  update(dt: number): void {
    const speedMultiplier = this.gameSpeed as number
    if (this.gameSpeed === GameSpeed.PAUSED) return

    const scaledDt = dt * speedMultiplier
    this.totalGameTime += scaledDt
    this.dayNightCycle = (Math.sin(this.totalGameTime * 0.0002) + 1) / 2

    for (const ant of this.ants) {
      ant.update(scaledDt)
    }

    for (const enemy of this.enemies) {
      enemy.update(scaledDt, this.entranceX, this.entranceY)
    }

    for (const ant of this.ants) {
      this.processAntAI(ant, scaledDt)
    }

    this.processCombat(scaledDt)

    this.queenLayTimer += scaledDt
    if (this.queenLayTimer >= QUEEN_LAY_INTERVAL) {
      this.layEgg()
    }

    this.updateEggs(scaledDt)

    let consumption = 0
    for (const ant of this.ants) {
      consumption += FOOD_CONSUME_PER_ANT * scaledDt * 0.001
    }
    this.food = Math.max(0, this.food - consumption)

    for (const fs of this.foodSources) {
      if (fs.amount < fs.maxAmount && Math.random() < 0.0001 * scaledDt) {
        fs.amount = Math.min(fs.maxAmount, fs.amount + 5)
      }
    }

    this.enemySpawnTimer -= scaledDt
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy()
      this.enemySpawnTimer = randomRange(ENEMY_SPAWN_INTERVAL_MIN, ENEMY_SPAWN_INTERVAL_MAX)
    }

    this.ants = this.ants.filter((a) => a.health > 0)
    this.enemies = this.enemies.filter((e) => e.health > 0)
  }

  processAntAI(ant: Ant, dt: number): void {
    if (ant.type === AntType.QUEEN) return

    for (const enemy of this.enemies) {
      if (distance(ant.x, ant.y, enemy.x, enemy.y) < 80 && ant.type === AntType.SOLDIER) {
        ant.state = AntState.FIGHTING
        ant.targetX = enemy.x
        ant.targetY = enemy.y
        ant.targetId = enemy.id
        return
      }
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

    if (ant.state === AntState.FORAGING && ant.targetId) {
      const fs = this.foodSources.find((f) => f.id === ant.targetId)
      if (fs && distance(ant.x, ant.y, fs.x, fs.y) < 15) {
        const collected = Math.min(10, fs.amount)
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
            enemy.health -= ant.attack * dt * 0.001
            ant.health -= enemy.attack * dt * 0.001
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

      const speedMult = egg.caredFor && nearNursery ? 1.5 : egg.caredFor ? 1.0 : 0.3
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
      this.ants.push(new Ant(type, pos.x, pos.y))
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
}

export default Colony
