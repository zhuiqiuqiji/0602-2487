import {
  AntType,
  AntState,
  type Ant,
  WORKER_SPEED,
  SOLDIER_SPEED,
  WORKER_HEALTH,
  SOLDIER_HEALTH,
  WORKER_ATTACK,
  SOLDIER_ATTACK,
  ANT_HUNGER_RATE,
  HUNGER_THRESHOLD,
  ANT_EAT_AMOUNT,
  ANT_THIRST_RATE,
  ANT_DRINK_AMOUNT,
  THIRST_THRESHOLD,
  DISEASE_SPREAD_RATE,
  REPRODUCTIVE_SPEED,
  REPRODUCTIVE_HEALTH,
  REPRODUCTIVE_ATTACK,
  QUEEN_HEALTH,
  QUEEN_ATTACK,
  PheromoneType,
} from '@/utils/constants'
import { generateId, moveTowards, distance, randomRange } from '@/utils/helpers'

class AntImpl implements Ant {
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

  constructor(type: AntType, x: number, y: number, ownerColony: string = 'player1') {
    this.id = generateId()
    this.type = type
    this.x = x
    this.y = y
    this.state = AntState.IDLE
    this.hunger = 0
    this.thirst = 0
    this.geneBonus = 1
    this.level = 1
    this.isSick = false
    this.infectionTimer = 0
    this.targetX = x
    this.targetY = y
    this.targetId = null
    this.carrying = false
    this.carryingFood = 0
    this.carryingWater = 0
    this.carryingMaterial = 0
    this.viewX = x
    this.viewY = y
    this.ownerColony = ownerColony

    if (type === AntType.QUEEN) {
      this.maxHealth = QUEEN_HEALTH
      this.health = QUEEN_HEALTH
      this.attack = QUEEN_ATTACK
      this.speed = 0
      this.baseSpeed = 0
    } else if (type === AntType.SOLDIER) {
      this.maxHealth = SOLDIER_HEALTH
      this.health = SOLDIER_HEALTH
      this.attack = SOLDIER_ATTACK
      this.speed = SOLDIER_SPEED
      this.baseSpeed = SOLDIER_SPEED
    } else if (type === AntType.REPRODUCTIVE) {
      this.maxHealth = REPRODUCTIVE_HEALTH
      this.health = REPRODUCTIVE_HEALTH
      this.attack = REPRODUCTIVE_ATTACK
      this.speed = REPRODUCTIVE_SPEED
      this.baseSpeed = REPRODUCTIVE_SPEED
    } else {
      this.maxHealth = WORKER_HEALTH
      this.health = WORKER_HEALTH
      this.attack = WORKER_ATTACK
      this.speed = WORKER_SPEED
      this.baseSpeed = WORKER_SPEED
    }
  }

  update(dt: number, geneSystem: { speed?: number } | null = null, seasonModifiers: { speedMod?: number } | null = null): void {
    if (this.state === AntState.HIBERNATING) {
      return
    }

    this.hunger += ANT_HUNGER_RATE * dt
    this.thirst += ANT_THIRST_RATE * dt

    if (this.hunger >= 100) {
      this.health -= 0.05 * dt
    }

    if (this.thirst >= 100) {
      this.health -= 0.04 * dt
    }

    if (this.isSick) {
      this.health -= 0.02 * dt
      this.infectionTimer -= dt
      if (this.infectionTimer <= 0) {
        this.recover()
      }
    }

    const speedMod = seasonModifiers?.speedMod ?? 1
    const geneMod = geneSystem?.speed ?? 1
    const effectiveSpeed = this.baseSpeed * speedMod * geneMod

    const result = moveTowards(this.x, this.y, this.targetX, this.targetY, effectiveSpeed, dt)
    this.x = result.x
    this.y = result.y

    this.viewX = this.x
    this.viewY = this.y
  }

  assignTask(state: AntState, targetX: number, targetY: number, targetId?: string): void {
    this.state = state
    this.targetX = targetX
    this.targetY = targetY
    if (targetId !== undefined) {
      this.targetId = targetId
    }
  }

  isHungry(): boolean {
    return this.hunger >= HUNGER_THRESHOLD
  }

  eat(amount: number): void {
    this.hunger = Math.max(0, this.hunger - amount)
  }

  takeDamage(dmg: number): void {
    this.health -= dmg
  }

  isAlive(): boolean {
    return this.health > 0
  }

  pickUpFood(amount: number): void {
    this.carrying = true
    this.carryingFood = amount
  }

  isThirsty(): boolean {
    return this.thirst >= THIRST_THRESHOLD
  }

  drink(amount: number): void {
    this.thirst = Math.max(0, this.thirst - amount)
  }

  becomeSick(diseaseResist: number = 1): void {
    if (Math.random() < DISEASE_SPREAD_RATE / diseaseResist) {
      this.isSick = true
      this.infectionTimer = 10000
    }
  }

  recover(): void {
    this.isSick = false
    this.infectionTimer = 0
  }

  increaseLevel(): void {
    this.level++
  }

  getEffectiveSpeed(): number {
    return this.baseSpeed * this.geneBonus
  }

  getEffectiveAttack(): number {
    return this.attack * this.geneBonus
  }

  getCarryingCapacity(): number {
    return this.carryingFood + this.carryingWater + this.carryingMaterial
  }

  getMaxCarrying(geneCapacityBonus: number = 1): number {
    if (this.type === AntType.SOLDIER) {
      return 5 * geneCapacityBonus
    }
    return 10 * geneCapacityBonus
  }

  canCarryMore(geneBonus: number = 1): boolean {
    return this.getCarryingCapacity() < this.getMaxCarrying(geneBonus)
  }

  pickUpWater(amount: number): void {
    this.carrying = true
    this.carryingWater = amount
  }

  pickUpMaterial(amount: number): void {
    this.carrying = true
    this.carryingMaterial = amount
  }

  depositAll(): void {
    this.carrying = false
    this.carryingFood = 0
    this.carryingWater = 0
    this.carryingMaterial = 0
  }
}

export default AntImpl
