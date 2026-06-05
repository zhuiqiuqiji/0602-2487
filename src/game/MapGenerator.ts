import { CellType, NEST_COLS, NEST_ROWS, SURFACE_COLS, SURFACE_ROWS, CELL_SIZE, type FoodSource } from '@/utils/constants'
import { randomInt, randomRange } from '@/utils/helpers'

class MapGenerator {
  generateNest(): CellType[][] {
    const grid: CellType[][] = []
    for (let y = 0; y < NEST_ROWS; y++) {
      grid[y] = []
      for (let x = 0; x < NEST_COLS; x++) {
        grid[y][x] = CellType.DIRT
      }
    }

    const queenChamberX = Math.floor(NEST_COLS / 2) - 2
    const queenChamberY = NEST_ROWS - 10
    const queenChamberW = 5
    const queenChamberH = 5
    this.carveRoom(grid, queenChamberX, queenChamberY, queenChamberW, queenChamberH, CellType.QUEEN_CHAMBER)

    const nurseryX = queenChamberX + queenChamberW + 3
    const nurseryY = queenChamberY + 1
    const nurseryW = 4
    const nurseryH = 4
    this.carveRoom(grid, nurseryX, nurseryY, nurseryW, nurseryH, CellType.NURSERY)

    const foodStorageX = queenChamberX - 4 - 3
    const foodStorageY = queenChamberY + 1
    const foodStorageW = 4
    const foodStorageH = 4
    this.carveRoom(grid, foodStorageX, foodStorageY, foodStorageW, foodStorageH, CellType.FOOD_STORAGE)

    const entranceX = Math.floor(NEST_COLS / 2)
    const entranceY = 0
    grid[entranceY][entranceX] = CellType.ENTRANCE
    grid[entranceY][entranceX + 1] = CellType.ENTRANCE

    const queenCenter = { x: queenChamberX + Math.floor(queenChamberW / 2), y: queenChamberY + Math.floor(queenChamberH / 2) }
    const nurseryCenter = { x: nurseryX + Math.floor(nurseryW / 2), y: nurseryY + Math.floor(nurseryH / 2) }
    const foodStorageCenter = { x: foodStorageX + Math.floor(foodStorageW / 2), y: foodStorageY + Math.floor(foodStorageH / 2) }
    const entranceCenter = { x: entranceX, y: entranceY }

    this.carveTunnel(grid, queenCenter.x, queenCenter.y, nurseryCenter.x, nurseryCenter.y)
    this.carveTunnel(grid, queenCenter.x, queenCenter.y, foodStorageCenter.x, foodStorageCenter.y)
    this.carveTunnel(grid, queenCenter.x, queenCenter.y, entranceCenter.x, entranceCenter.y)

    return grid
  }

  generateSurface(): { foodSources: FoodSource[] } {
    const foodSources: FoodSource[] = []
    const count = randomInt(5, 8)
    const foodTypes: Array<{ type: 'leaf' | 'fruit' | 'insect'; minAmount: number; maxAmount: number }> = [
      { type: 'leaf', minAmount: 15, maxAmount: 25 },
      { type: 'fruit', minAmount: 30, maxAmount: 50 },
      { type: 'insect', minAmount: 60, maxAmount: 100 },
    ]

    for (let i = 0; i < count; i++) {
      const foodDef = foodTypes[randomInt(0, foodTypes.length - 1)]
      const amount = randomInt(foodDef.minAmount, foodDef.maxAmount)
      const x = randomRange(CELL_SIZE * 2, (SURFACE_COLS - 2) * CELL_SIZE)
      const y = randomRange(CELL_SIZE * 2, (SURFACE_ROWS - 2) * CELL_SIZE)
      foodSources.push({
        id: `food_${i}`,
        x,
        y,
        type: foodDef.type,
        amount,
        maxAmount: amount,
      })
    }

    return { foodSources }
  }

  findEntrancePosition(grid: CellType[][]): { x: number; y: number } {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === CellType.ENTRANCE) {
          return { x, y }
        }
      }
    }
    return { x: 0, y: 0 }
  }

  findNestPositions(grid: CellType[][], type: CellType): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = []
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x] === type) {
          positions.push({ x, y })
        }
      }
    }
    return positions
  }

  private carveRoom(grid: CellType[][], rx: number, ry: number, rw: number, rh: number, type: CellType): void {
    for (let y = ry; y < ry + rh && y < NEST_ROWS; y++) {
      for (let x = rx; x < rx + rw && x < NEST_COLS; x++) {
        if (x >= 0 && y >= 0) {
          grid[y][x] = type
        }
      }
    }
  }

  private carveTunnel(grid: CellType[][], x1: number, y1: number, x2: number, y2: number): void {
    let cx = x1
    let cy = y1

    while (cx !== x2) {
      this.setTunnelCell(grid, cx, cy)
      this.setTunnelCell(grid, cx, cy + 1)
      cx += cx < x2 ? 1 : -1
    }
    while (cy !== y2) {
      this.setTunnelCell(grid, cx, cy)
      this.setTunnelCell(grid, cx + 1, cy)
      cy += cy < y2 ? 1 : -1
    }
    this.setTunnelCell(grid, cx, cy)
  }

  private setTunnelCell(grid: CellType[][], x: number, y: number): void {
    if (x >= 0 && x < NEST_COLS && y >= 0 && y < NEST_ROWS) {
      const cell = grid[y][x]
      if (cell === CellType.DIRT || cell === CellType.EMPTY) {
        grid[y][x] = CellType.TUNNEL
      }
    }
  }
}

export default MapGenerator
