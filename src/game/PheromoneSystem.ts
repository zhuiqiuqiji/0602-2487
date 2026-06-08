import type { PheromoneMap } from '@/utils/constants'
import {
  PheromoneType,
  PHEROMONE_DECAY_RATE,
  PHEROMONE_DIFFUSE_RATE,
  PHEROMONE_RELEASE_RATE,
  PHEROMONE_PERCEPTION_RANGE,
  SURFACE_COLS,
  SURFACE_ROWS,
  CELL_SIZE,
} from '@/utils/constants'
import { clamp } from '@/utils/helpers'

export default class PheromoneSystem {
  map: PheromoneMap
  frameCount: number = 0
  visible: boolean = true

  constructor(width: number = SURFACE_COLS, height: number = SURFACE_ROWS) {
    this.map = {
      foraging: new Float32Array(width * height),
      alarm: new Float32Array(width * height),
      homing: new Float32Array(width * height),
      width,
      height,
    }
  }

  releasePheromone(
    worldX: number,
    worldY: number,
    type: PheromoneType,
    strength: number = PHEROMONE_RELEASE_RATE,
  ): void {
    const gx = clamp(Math.floor(worldX / CELL_SIZE), 0, this.map.width - 1)
    const gy = clamp(Math.floor(worldY / CELL_SIZE), 0, this.map.height - 1)
    const index = this.getIndex(gx, gy)
    this.map[type][index] = clamp(this.map[type][index] + strength, 0, 1.0)
  }

  getPheromone(worldX: number, worldY: number, type: PheromoneType): number {
    const gx = clamp(Math.floor(worldX / CELL_SIZE), 0, this.map.width - 1)
    const gy = clamp(Math.floor(worldY / CELL_SIZE), 0, this.map.height - 1)
    const index = this.getIndex(gx, gy)
    return this.map[type][index]
  }

  getStrongestDirection(
    worldX: number,
    worldY: number,
    type: PheromoneType,
    radius: number = PHEROMONE_PERCEPTION_RANGE,
  ): { dx: number; dy: number; strength: number } {
    const gx = Math.floor(worldX / CELL_SIZE)
    const gy = Math.floor(worldY / CELL_SIZE)

    const directions = [
      { dx: -1, dy: -1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },
      { dx: 0, dy: 1 },
      { dx: 1, dy: 1 },
    ]

    let maxStrength = 0
    let bestDx = 0
    let bestDy = 0

    for (const dir of directions) {
      let total = 0
      let count = 0

      for (let r = 1; r <= radius; r++) {
        const sampleGx = gx + dir.dx * r
        const sampleGy = gy + dir.dy * r

        if (sampleGx < 0 || sampleGx >= this.map.width || sampleGy < 0 || sampleGy >= this.map.height) {
          continue
        }

        const index = this.getIndex(sampleGx, sampleGy)
        total += this.map[type][index]
        count++
      }

      const avgStrength = count > 0 ? total / count : 0

      if (avgStrength > maxStrength) {
        maxStrength = avgStrength
        bestDx = dir.dx
        bestDy = dir.dy
      }
    }

    return { dx: bestDx, dy: bestDy, strength: maxStrength }
  }

  update(dt: number): void {
    this.frameCount++

    if (this.frameCount % 3 !== 0) {
      return
    }

    const types = [PheromoneType.FORAGING, PheromoneType.ALARM, PheromoneType.HOMING]

    for (const type of types) {
      const arr = this.map[type]
      const { width, height } = this.map

      for (let i = 0; i < arr.length; i++) {
        arr[i] *= 1 - PHEROMONE_DECAY_RATE * dt
      }

      const temp = new Float32Array(arr.length)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = this.getIndex(x, y)
          let sum = 0
          let count = 0

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx
              const ny = y + dy

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                sum += arr[this.getIndex(nx, ny)]
                count++
              }
            }
          }

          const avg = sum / count
          temp[idx] = arr[idx] + (avg - arr[idx]) * PHEROMONE_DIFFUSE_RATE
        }
      }

      for (let i = 0; i < arr.length; i++) {
        arr[i] = temp[i] < 0.001 ? 0 : temp[i]
      }
    }
  }

  toggleVisible(): void {
    this.visible = !this.visible
  }

  setVisible(v: boolean): void {
    this.visible = v
  }

  clear(): void {
    this.map.foraging.fill(0)
    this.map.alarm.fill(0)
    this.map.homing.fill(0)
  }

  getIndex(gx: number, gy: number): number {
    return gy * this.map.width + gx
  }
}
