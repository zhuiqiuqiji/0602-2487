import type { Enemy } from '@/utils/constants'
import {
  EnemyType,
  SPIDER_HEALTH,
  SPIDER_ATTACK,
  SPIDER_SPEED,
  RIVAL_ANT_HEALTH,
  RIVAL_ANT_ATTACK,
  RIVAL_ANT_SPEED,
  CELL_SIZE,
} from '@/utils/constants'
import { generateId, moveTowards, randomRange } from '@/utils/helpers'

class EnemyImpl implements Enemy {
  id: string
  type: EnemyType
  x: number
  y: number
  maxHealth: number
  health: number
  attack: number
  speed: number
  targetX: number
  targetY: number
  viewX: number
  viewY: number

  constructor(type: EnemyType, x: number, y: number) {
    this.id = generateId()
    this.type = type
    this.x = x
    this.y = y
    this.maxHealth = type === EnemyType.SPIDER ? SPIDER_HEALTH : RIVAL_ANT_HEALTH
    this.health = this.maxHealth
    this.attack = type === EnemyType.SPIDER ? SPIDER_ATTACK : RIVAL_ANT_ATTACK
    this.speed = type === EnemyType.SPIDER ? SPIDER_SPEED : RIVAL_ANT_SPEED
    this.targetX = x
    this.targetY = y
    this.viewX = x
    this.viewY = y
  }

  update(dt: number, nestEntranceX: number, nestEntranceY: number): void {
    const dist = Math.sqrt(
      (this.x - nestEntranceX) ** 2 + (this.y - nestEntranceY) ** 2,
    )
    if (dist > 2) {
      this.targetX = nestEntranceX
      this.targetY = nestEntranceY
    } else {
      this.targetX = nestEntranceX + randomRange(-1, 1)
      this.targetY = nestEntranceY + randomRange(-1, 1)
    }

    const result = moveTowards(this.x, this.y, this.targetX, this.targetY, this.speed, dt)
    this.x = result.x
    this.y = result.y

    this.viewX = this.x
    this.viewY = this.y
  }

  setTarget(x: number, y: number): void {
    this.targetX = x
    this.targetY = y
  }

  takeDamage(dmg: number): void {
    this.health -= dmg
  }

  isAlive(): boolean {
    return this.health > 0
  }
}

export default EnemyImpl
