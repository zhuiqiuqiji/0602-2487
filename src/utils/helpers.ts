import { ColonyStatus } from '@/utils/constants'

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function moveTowards(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  speed: number,
  dt: number,
): { x: number; y: number; arrived: boolean } {
  const dx = toX - fromX
  const dy = toY - fromY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < speed * dt) {
    return { x: toX, y: toY, arrived: true }
  }
  const ratio = (speed * dt) / dist
  return {
    x: fromX + dx * ratio,
    y: fromY + dy * ratio,
    arrived: false,
  }
}

export function getColonyStatus(
  food: number,
  maxFood: number,
  antCount: number,
  enemyCount: number,
): ColonyStatus {
  if (enemyCount > 0) return ColonyStatus.DANGER
  if (maxFood > 0 && food / maxFood < 0.15) return ColonyStatus.HUNGRY
  if (maxFood > 0 && food / maxFood > 0.6 && antCount > 15) return ColonyStatus.THRIVING
  return ColonyStatus.NORMAL
}
