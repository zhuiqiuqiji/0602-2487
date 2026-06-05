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
  CELL_SIZE,
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
  hunger: number
  targetX: number
  targetY: number
  targetId: string | null
  carrying: boolean
  carryingFood: number
  viewX: number
  viewY: number

  constructor(type: AntType, x: number, y: number) {
    this.id = generateId()
    this.type = type
    this.x = x
    this.y = y
    this.state = AntState.IDLE
    this.hunger = 0
    this.targetX = x
    this.targetY = y
    this.targetId = null
    this.carrying = false
    this.carryingFood = 0
    this.viewX = x
    this.viewY = y

    if (type === AntType.QUEEN) {
      this.maxHealth = 100
      this.health = 100
      this.attack = 0
      this.speed = 0
    } else if (type === AntType.SOLDIER) {
      this.maxHealth = SOLDIER_HEALTH
      this.health = SOLDIER_HEALTH
      this.attack = SOLDIER_ATTACK
      this.speed = SOLDIER_SPEED
    } else {
      this.maxHealth = WORKER_HEALTH
      this.health = WORKER_HEALTH
      this.attack = WORKER_ATTACK
      this.speed = WORKER_SPEED
    }
  }

  update(dt: number): void {
    this.hunger += ANT_HUNGER_RATE * dt

    if (this.hunger >= 100) {
      this.health -= 0.05 * dt
    }

    if (this.carrying) {
      const dist = distance(this.x, this.y, this.targetX, this.targetY)
      if (dist < 2) {
        this.carrying = false
        this.carryingFood = 0
      }
    }

    const result = moveTowards(this.x, this.y, this.targetX, this.targetY, this.speed, dt)
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
}

export default AntImpl
