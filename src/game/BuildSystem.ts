import type { Room, RoomConfig } from '@/utils/constants'
import { RoomType, CellType, MATERIAL_FROM_DIGGING, CELL_SIZE, AntType, AntState } from '@/utils/constants'
import { getRoomConfig, canUnlockRoom } from '@/data/rooms'
import { generateId, distance } from '@/utils/helpers'

class BuildSystem {
  rooms: Room[] = []
  pendingBuilds: Room[] = []
  selectedRoomType: RoomType | null = null
  gridWidth: number
  gridHeight: number

  constructor(gridWidth: number, gridHeight: number) {
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight
  }

  startBuild(
    roomType: RoomType,
    gridX: number,
    gridY: number,
    food: number,
    material: number,
    antCount: number,
    geneLevel: number,
  ): {
    success: boolean
    room: Room | null
    message: string
    cost: { food: number; material: number }
  } {
    const config = getRoomConfig(roomType)
    const cost = { food: config.cost.food, material: config.cost.material }

    if (!this.canUnlock(roomType, antCount, geneLevel)) {
      return { success: false, room: null, message: 'Room not unlocked yet', cost }
    }

    if (food < config.cost.food || material < config.cost.material) {
      return { success: false, room: null, message: 'Not enough resources', cost }
    }

    const room: Room = {
      id: generateId(),
      type: roomType,
      gridX,
      gridY,
      width: config.size.width,
      height: config.size.height,
      buildProgress: 0,
      active: false,
    }

    this.pendingBuilds.push(room)

    return { success: true, room, message: 'Build started', cost }
  }

  updateBuilds(ants: any[], dt: number): { completedRooms: Room[]; materialGained: number } {
    const completedRooms: Room[] = []
    let materialGained = 0

    for (let i = this.pendingBuilds.length - 1; i >= 0; i--) {
      const build = this.pendingBuilds[i]
      const centerX = (build.gridX + build.width / 2) * CELL_SIZE
      const centerY = (build.gridY + build.height / 2) * CELL_SIZE

      const nearbyWorkers = ants.filter(
        (ant) =>
          ant.type === AntType.WORKER &&
          ant.state === AntState.IDLE &&
          distance(ant.x, ant.y, centerX, centerY) < 30,
      )

      for (const worker of nearbyWorkers) {
        worker.state = AntState.CONSTRUCTING
        worker.targetX = centerX
        worker.targetY = centerY
        worker.targetId = build.id
      }

      const assignedWorkers = ants.filter(
        (ant) => ant.state === AntState.CONSTRUCTING && ant.targetId === build.id,
      )

      for (const worker of assignedWorkers) {
        build.buildProgress += 0.05 * dt
        if (worker.carryingMaterial !== undefined) {
          worker.carryingMaterial += MATERIAL_FROM_DIGGING * dt * 0.1
        }
        materialGained += MATERIAL_FROM_DIGGING * dt * 0.1
      }

      if (build.buildProgress >= 100) {
        build.active = true
        build.buildProgress = 100
        this.pendingBuilds.splice(i, 1)
        this.rooms.push(build)
        completedRooms.push(build)
      }
    }

    return { completedRooms, materialGained }
  }

  isValidBuildLocation(
    roomType: RoomType,
    gridX: number,
    gridY: number,
    nestGrid: CellType[][],
  ): boolean {
    const config = getRoomConfig(roomType)
    const { width, height } = config.size

    if (
      gridX < 0 ||
      gridY < 0 ||
      gridX + width > this.gridWidth ||
      gridY + height > this.gridHeight
    ) {
      return false
    }

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const cell = nestGrid[gridY + dy]?.[gridX + dx]
        if (cell !== CellType.DIRT) {
          return false
        }
      }
    }

    let connected = false
    for (let dy = -1; dy <= height; dy++) {
      for (let dx = -1; dx <= width; dx++) {
        const isInside = dx >= 0 && dx < width && dy >= 0 && dy < height
        if (isInside) continue

        const checkY = gridY + dy
        const checkX = gridX + dx
        if (checkY < 0 || checkY >= this.gridHeight || checkX < 0 || checkX >= this.gridWidth) {
          continue
        }

        const cell = nestGrid[checkY][checkX]
        if (
          cell === CellType.TUNNEL ||
          cell === CellType.ROOM ||
          cell === CellType.QUEEN_CHAMBER ||
          cell === CellType.NURSERY ||
          cell === CellType.FOOD_STORAGE ||
          cell === CellType.ENTRANCE ||
          cell === CellType.WATER_RESERVOIR ||
          cell === CellType.BARRACKS ||
          cell === CellType.FUNGUS_FARM
        ) {
          connected = true
          break
        }
      }
      if (connected) break
    }

    return connected
  }

  cancelBuild(roomId: string): boolean {
    const index = this.pendingBuilds.findIndex((r) => r.id === roomId)
    if (index === -1) return false

    this.pendingBuilds.splice(index, 1)

    return true
  }

  getRoomEffects(): {
    foodCapacity: number
    waterCapacity: number
    reproductionBonus: number
    attackBonus: number
    foodProduction: number
    diseaseResist: number
    waterProduction: number
  } {
    const effects = {
      foodCapacity: 0,
      waterCapacity: 0,
      reproductionBonus: 0,
      attackBonus: 0,
      foodProduction: 0,
      diseaseResist: 0,
      waterProduction: 0,
    }

    for (const room of this.rooms) {
      if (!room.active) continue
      const config = getRoomConfig(room.type)
      effects.foodCapacity += config.effects.foodCapacity ?? 0
      effects.waterCapacity += config.effects.waterCapacity ?? 0
      effects.reproductionBonus += config.effects.reproductionBonus ?? 0
      effects.attackBonus += config.effects.attackBonus ?? 0
      effects.foodProduction += config.effects.foodProduction ?? 0
      effects.diseaseResist += config.effects.diseaseResist ?? 0
      effects.waterProduction += config.effects.waterProduction ?? 0
    }

    return effects
  }

  canUnlock(roomType: RoomType, antCount: number, geneLevel: number): boolean {
    return canUnlockRoom(roomType, antCount, geneLevel)
  }

  getBuildProgress(roomId: string): number {
    const pending = this.pendingBuilds.find((r) => r.id === roomId)
    if (pending) return pending.buildProgress

    const active = this.rooms.find((r) => r.id === roomId)
    if (active) return 100

    return 0
  }

  removeRoom(roomId: string): boolean {
    const pendingIndex = this.pendingBuilds.findIndex((r) => r.id === roomId)
    if (pendingIndex !== -1) {
      this.pendingBuilds.splice(pendingIndex, 1)
      return true
    }

    const activeIndex = this.rooms.findIndex((r) => r.id === roomId)
    if (activeIndex !== -1) {
      this.rooms.splice(activeIndex, 1)
      return true
    }

    return false
  }

  getActiveRoomCount(): number {
    return this.rooms.length
  }

  getPendingBuildCount(): number {
    return this.pendingBuilds.length
  }

  getTotalRoomCount(): number {
    return this.rooms.length + this.pendingBuilds.length
  }

  getRoomAt(gridX: number, gridY: number): Room | null {
    for (const room of this.rooms) {
      if (
        gridX >= room.gridX &&
        gridX < room.gridX + room.width &&
        gridY >= room.gridY &&
        gridY < room.gridY + room.height
      ) {
        return room
      }
    }

    for (const build of this.pendingBuilds) {
      if (
        gridX >= build.gridX &&
        gridX < build.gridX + build.width &&
        gridY >= build.gridY &&
        gridY < build.gridY + build.height
      ) {
        return build
      }
    }

    return null
  }
}

export default BuildSystem
