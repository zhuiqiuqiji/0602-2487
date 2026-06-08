import type { Ant, Enemy, Egg, FoodSource } from '@/utils/constants'
import {
  CellType,
  AntType,
  AntState,
  EnemyType,
  EggStage,
  ViewMode,
  CELL_SIZE,
  NEST_COLS,
  NEST_ROWS,
  SURFACE_COLS,
  SURFACE_ROWS,
  PheromoneType,
  Season,
  BiomeType,
  RoomType,
  DisasterType,
  ColonyStatus,
} from '@/utils/constants'
import type PheromoneSystem from '@/game/PheromoneSystem'
import type SeasonSystem from '@/game/SeasonSystem'
import type BuildSystem from '@/game/BuildSystem'
import { getBiomeConfig } from '@/data/biomes'
import { getRoomConfig } from '@/data/rooms'
import { getDisasterConfig } from '@/data/disasters'
import Colony from '@/game/Colony'

class CanvasRenderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  cameraX: number = 0
  cameraY: number = 0
  selectedAntId: string | null = null
  hoveredCell: { x: number; y: number } | null = null

  pheromoneSystem: PheromoneSystem | null = null
  seasonSystem: SeasonSystem | null = null
  buildSystem: BuildSystem | null = null
  biome: BiomeType = BiomeType.FOREST
  buildMode: RoomType | null = null
  hoverPosition: { x: number; y: number } | null = null
  showPheromones: boolean = true
  activeDisaster: DisasterType = DisasterType.NONE

  private grassDecorations: { x: number; y: number; type: number }[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
    this.generateGrassDecorations()
  }

  setSystems(pheromone: PheromoneSystem, season: SeasonSystem, build: BuildSystem): void {
    this.pheromoneSystem = pheromone
    this.seasonSystem = season
    this.buildSystem = build
  }

  setBiome(biome: BiomeType): void {
    this.biome = biome
  }

  setShowPheromones(show: boolean): void {
    this.showPheromones = show
  }

  setBuildMode(roomType: RoomType | null): void {
    this.buildMode = roomType
  }

  setHoverPosition(x: number | null, y?: number): void {
    if (x === null) {
      this.hoverPosition = null
    } else if (y !== undefined) {
      this.hoverPosition = { x, y }
    }
  }

  setActiveDisaster(type: DisasterType): void {
    this.activeDisaster = type
  }

  render(colony: Colony): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    if (colony.viewMode === ViewMode.UNDERGROUND) {
      this.renderUnderground(colony)
    } else {
      this.renderSurface(colony)
    }

    this.renderSeasonOverlay()

    if (this.showPheromones && this.pheromoneSystem && colony.viewMode === ViewMode.SURFACE) {
      this.renderPheromones()
    }

    this.renderAnts(colony.ants)

    if (colony.viewMode === ViewMode.SURFACE) {
      this.renderEnemies(colony.enemies)
      this.renderFoodSources(colony.foodSources)
    }

    if (colony.viewMode === ViewMode.UNDERGROUND) {
      this.renderEggs(colony.eggs)
      this.renderRooms()
    }

    if (this.selectedAntId) {
      const ant = colony.ants.find((a) => a.id === this.selectedAntId)
      if (ant) {
        const px = ant.viewX - this.cameraX
        const py = ant.viewY - this.cameraY
        ctx.strokeStyle = '#FFD600'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(px, py, 12, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    if (this.hoveredCell) {
      const hx = this.hoveredCell.x * CELL_SIZE - this.cameraX
      const hy = this.hoveredCell.y * CELL_SIZE - this.cameraY
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      ctx.strokeRect(hx, hy, CELL_SIZE, CELL_SIZE)
    }

    this.renderBuildPreview()
    this.renderDisasterEffects()
  }

  renderUnderground(colony: Colony): void {
    const ctx = this.ctx
    ctx.fillStyle = '#2C1810'
    ctx.fillRect(0, 0, this.width, this.height)

    const startCol = Math.max(0, Math.floor(this.cameraX / CELL_SIZE))
    const endCol = Math.min(NEST_COLS, Math.ceil((this.cameraX + this.width) / CELL_SIZE))
    const startRow = Math.max(0, Math.floor(this.cameraY / CELL_SIZE))
    const endRow = Math.min(NEST_ROWS, Math.ceil((this.cameraY + this.height) / CELL_SIZE))

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const cell = colony.nestGrid[row][col]
        const px = col * CELL_SIZE - this.cameraX
        const py = row * CELL_SIZE - this.cameraY

        this.renderCell(ctx, cell, px, py)

        ctx.strokeStyle = 'rgba(0,0,0,0.15)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE)
      }
    }
  }

  private renderCell(ctx: CanvasRenderingContext2D, cell: CellType, px: number, py: number): void {
    const cs = CELL_SIZE

    switch (cell) {
      case CellType.DIRT:
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px, py, cs, cs)
        break
      case CellType.EMPTY:
        ctx.fillStyle = '#1A0E08'
        ctx.fillRect(px, py, cs, cs)
        break
      case CellType.TUNNEL:
        ctx.fillStyle = '#3E2723'
        ctx.fillRect(px, py, cs, cs)
        break
      case CellType.ROOM:
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px, py, cs, cs)
        break
      case CellType.QUEEN_CHAMBER:
        ctx.fillStyle = '#5D4037'
        ctx.fillRect(px, py, cs, cs)
        ctx.strokeStyle = '#FFB300'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2)
        break
      case CellType.NURSERY:
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px, py, cs, cs)
        ctx.strokeStyle = '#E91E63'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2)
        break
      case CellType.FOOD_STORAGE:
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px, py, cs, cs)
        ctx.strokeStyle = '#4CAF50'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2)
        break
      case CellType.ENTRANCE:
        ctx.fillStyle = '#795548'
        ctx.fillRect(px, py, cs, cs)
        break
      case CellType.WATER_RESERVOIR:
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px, py, cs, cs)
        ctx.fillStyle = 'rgba(33, 150, 243, 0.3)'
        ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4)
        ctx.strokeStyle = '#2196F3'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2)
        break
      case CellType.BARRACKS:
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px, py, cs, cs)
        ctx.fillStyle = 'rgba(244, 67, 54, 0.2)'
        ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4)
        ctx.strokeStyle = '#F44336'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2)
        break
      case CellType.FUNGUS_FARM:
        ctx.fillStyle = '#4E342E'
        ctx.fillRect(px, py, cs, cs)
        ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'
        ctx.fillRect(px + 2, py + 2, cs - 4, cs - 4)
        ctx.strokeStyle = '#8BC34A'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2)
        break
      case CellType.CONSTRUCTION:
        ctx.fillStyle = '#3E2723'
        ctx.fillRect(px, py, cs, cs)
        ctx.strokeStyle = '#FFC107'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(px + 2, py + 2, cs - 4, cs - 4)
        ctx.setLineDash([])
        break
      case CellType.FLOODED:
        ctx.fillStyle = '#1A0E08'
        ctx.fillRect(px, py, cs, cs)
        ctx.fillStyle = 'rgba(33, 150, 243, 0.4)'
        ctx.fillRect(px, py, cs, cs)
        ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)'
        ctx.lineWidth = 1
        ctx.beginPath()
        const waveOffset = (Date.now() / 200) % 8
        for (let i = 0; i < 3; i++) {
          const y = py + 4 + i * 4 + Math.sin((px + waveOffset + i * 10) / 8) * 2
          ctx.moveTo(px, y)
          ctx.quadraticCurveTo(px + cs / 4, y - 2, px + cs / 2, y)
          ctx.quadraticCurveTo(px + (cs * 3) / 4, y + 2, px + cs, y)
        }
        ctx.stroke()
        break
    }
  }

  renderSurface(colony: Colony): void {
    const ctx = this.ctx
    const biomeColors = getBiomeConfig(this.biome).colors
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, biomeColors.surface)
    gradient.addColorStop(1, biomeColors.surfaceLight)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)

    this.renderGrassDecorations(ctx)

    const nightAlpha = (1 - colony.dayNightCycle) * 0.4
    if (nightAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,30,${nightAlpha})`
      ctx.fillRect(0, 0, this.width, this.height)
    }

    const entrancePx = colony.entranceX - this.cameraX
    const entrancePy = colony.entranceY - this.cameraY
    ctx.fillStyle = '#5D4037'
    ctx.beginPath()
    ctx.ellipse(entrancePx, entrancePy, 20, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#3E2723'
    ctx.beginPath()
    ctx.ellipse(entrancePx, entrancePy, 12, 7, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  private generateGrassDecorations(): void {
    const mapW = SURFACE_COLS * CELL_SIZE
    const mapH = SURFACE_ROWS * CELL_SIZE
    for (let i = 0; i < 200; i++) {
      this.grassDecorations.push({
        x: Math.random() * mapW,
        y: Math.random() * mapH,
        type: Math.random() < 0.85 ? 0 : 1,
      })
    }
  }

  private renderGrassDecorations(ctx: CanvasRenderingContext2D): void {
    const biomeColors = getBiomeConfig(this.biome).colors
    for (const deco of this.grassDecorations) {
      const px = deco.x - this.cameraX
      const py = deco.y - this.cameraY
      if (px < -20 || px > this.width + 20 || py < -20 || py > this.height + 20) continue

      if (deco.type === 0) {
        ctx.strokeStyle = biomeColors.accent
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px - 2, py - 6)
        ctx.moveTo(px, py)
        ctx.lineTo(px + 2, py - 5)
        ctx.stroke()
      } else {
        ctx.fillStyle = ['#F48FB1', '#FFF176', '#CE93D8'][Math.floor(deco.x) % 3]
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  private renderFoodSources(foodSources: FoodSource[]): void {
    const ctx = this.ctx
    for (const fs of foodSources) {
      const px = fs.x - this.cameraX
      const py = fs.y - this.cameraY
      if (px < -30 || px > this.width + 30 || py < -30 || py > this.height + 30) continue

      switch (fs.type) {
        case 'leaf':
          ctx.fillStyle = '#66BB6A'
          ctx.beginPath()
          ctx.arc(px, py, 8, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#2E7D32'
          ctx.beginPath()
          ctx.ellipse(px, py - 2, 5, 3, -0.3, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'fruit':
          ctx.fillStyle = '#EF5350'
          ctx.beginPath()
          ctx.arc(px, py, 7, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#FF8A65'
          ctx.beginPath()
          ctx.arc(px - 1, py - 1, 4, 0, Math.PI * 2)
          ctx.fill()
          break
        case 'insect':
          ctx.fillStyle = '#4E342E'
          ctx.beginPath()
          ctx.arc(px, py, 6, 0, Math.PI * 2)
          ctx.fill()
          break
      }

      const barW = 16
      const barH = 3
      const ratio = fs.amount / fs.maxAmount
      ctx.fillStyle = '#333'
      ctx.fillRect(px - barW / 2, py + 10, barW, barH)
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(px - barW / 2, py + 10, barW * ratio, barH)
    }
  }

  renderAnts(ants: Ant[]): void {
    const ctx = this.ctx
    for (const ant of ants) {
      const px = ant.viewX - this.cameraX
      const py = ant.viewY - this.cameraY
      if (px < -20 || px > this.width + 20 || py < -20 || py > this.height + 20) continue

      if (ant.isSick) {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.4)'
        ctx.beginPath()
        ctx.arc(px, py, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      this.renderAntBody(ctx, ant, px, py)

      if (ant.carrying) {
        if (ant.carryingFood > 0) {
          ctx.fillStyle = '#8BC34A'
          ctx.beginPath()
          ctx.arc(px, py - 7, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
        if (ant.carryingWater > 0) {
          ctx.fillStyle = '#2196F3'
          ctx.beginPath()
          ctx.arc(px + 4, py - 5, 2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (ant.carryingMaterial > 0) {
          ctx.fillStyle = '#795548'
          ctx.beginPath()
          ctx.arc(px - 4, py - 5, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (ant.state === AntState.FIGHTING) {
        ctx.fillStyle = 'rgba(244,67,54,0.5)'
        ctx.beginPath()
        ctx.arc(px, py, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      if (this.selectedAntId === ant.id) {
        ctx.strokeStyle = '#FFD600'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(px, py, 10, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (ant.hunger > 70) {
        const barW = 10
        const barH = 2
        const ratio = (ant.hunger - 70) / 30
        ctx.fillStyle = '#333'
        ctx.fillRect(px - barW / 2, py - 11, barW, barH)
        ctx.fillStyle = '#F44336'
        ctx.fillRect(px - barW / 2, py - 11, barW * ratio, barH)
      }
    }
  }

  private renderAntBody(ctx: CanvasRenderingContext2D, ant: Ant, px: number, py: number): void {
    switch (ant.type) {
      case AntType.WORKER: {
        ctx.fillStyle = '#3E2723'
        ctx.beginPath()
        ctx.ellipse(px, py, 4, 3, 0, 0, Math.PI * 2)
        ctx.fill()
        this.drawLegs(ctx, px, py, 3, '#3E2723')
        this.drawAntennae(ctx, px, py, 4, '#3E2723')
        break
      }
      case AntType.SOLDIER: {
        ctx.fillStyle = '#8D6E63'
        ctx.beginPath()
        ctx.ellipse(px, py, 5, 4, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#5D4037'
        ctx.beginPath()
        ctx.moveTo(px + 5, py - 1)
        ctx.lineTo(px + 8, py - 2)
        ctx.lineTo(px + 5, py + 1)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(px + 5, py + 1)
        ctx.lineTo(px + 8, py + 2)
        ctx.lineTo(px + 5, py + 2)
        ctx.closePath()
        ctx.fill()
        this.drawLegs(ctx, px, py, 4, '#8D6E63')
        this.drawAntennae(ctx, px, py, 5, '#8D6E63')
        break
      }
      case AntType.QUEEN: {
        ctx.fillStyle = '#5D4037'
        ctx.beginPath()
        ctx.ellipse(px, py, 7, 5, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#FFB300'
        ctx.beginPath()
        ctx.moveTo(px - 3, py - 5)
        ctx.lineTo(px, py - 8)
        ctx.lineTo(px + 3, py - 5)
        ctx.closePath()
        ctx.fill()
        this.drawLegs(ctx, px, py, 5, '#5D4037')
        this.drawAntennae(ctx, px, py, 7, '#5D4037')
        break
      }
    }
  }

  private drawLegs(ctx: CanvasRenderingContext2D, px: number, py: number, radius: number, color: string): void {
    ctx.strokeStyle = color
    ctx.lineWidth = 0.8
    for (let i = 0; i < 3; i++) {
      const yOff = (i - 1) * 2
      ctx.beginPath()
      ctx.moveTo(px - radius * 0.5, py + yOff)
      ctx.lineTo(px - radius - 2, py + yOff - 1)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px + radius * 0.5, py + yOff)
      ctx.lineTo(px + radius + 2, py + yOff - 1)
      ctx.stroke()
    }
  }

  private drawAntennae(ctx: CanvasRenderingContext2D, px: number, py: number, radius: number, color: string): void {
    ctx.strokeStyle = color
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(px - 2, py - radius * 0.6)
    ctx.lineTo(px - 4, py - radius - 3)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(px + 2, py - radius * 0.6)
    ctx.lineTo(px + 4, py - radius - 3)
    ctx.stroke()
  }

  renderEggs(eggs: Egg[]): void {
    const ctx = this.ctx
    for (const egg of eggs) {
      const px = egg.x - this.cameraX
      const py = egg.y - this.cameraY
      if (px < -10 || px > this.width + 10 || py < -10 || py > this.height + 10) continue

      switch (egg.stage) {
        case EggStage.EGG:
          ctx.fillStyle = '#FAFAFA'
          ctx.beginPath()
          ctx.ellipse(px, py, 2, 3, 0, 0, Math.PI * 2)
          ctx.fill()
          break
        case EggStage.LARVA:
          ctx.fillStyle = '#FFF8E1'
          ctx.beginPath()
          ctx.ellipse(px, py, 3, 4, 0, 0, Math.PI * 2)
          ctx.fill()
          break
        case EggStage.PUPA:
          ctx.fillStyle = '#D7CCC8'
          ctx.beginPath()
          ctx.ellipse(px, py, 3.5, 5, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#A1887F'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.ellipse(px, py, 4.5, 5.5, 0, 0, Math.PI * 2)
          ctx.stroke()
          break
      }
    }
  }

  renderEnemies(enemies: Enemy[]): void {
    const ctx = this.ctx
    for (const enemy of enemies) {
      const px = enemy.viewX - this.cameraX
      const py = enemy.viewY - this.cameraY
      if (px < -30 || px > this.width + 30 || py < -30 || py > this.height + 30) continue

      switch (enemy.type) {
        case EnemyType.SPIDER:
          this.renderSpider(ctx, px, py)
          break
        case EnemyType.RIVAL_ANT:
          this.renderRivalAnt(ctx, px, py)
          break
      }

      const barW = 16
      const barH = 2
      const ratio = enemy.health / enemy.maxHealth
      ctx.fillStyle = '#333'
      ctx.fillRect(px - barW / 2, py + 12, barW, barH)
      ctx.fillStyle = '#F44336'
      ctx.fillRect(px - barW / 2, py + 12, barW * ratio, barH)
    }
  }

  private renderSpider(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = '#424242'
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#424242'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const legLen = 10
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(angle) * 5, py + Math.sin(angle) * 5)
      ctx.lineTo(px + Math.cos(angle) * legLen, py + Math.sin(angle) * legLen)
      ctx.stroke()
    }

    ctx.fillStyle = '#B71C1C'
    ctx.beginPath()
    ctx.arc(px - 2, py - 2, 1.5, 0, Math.PI * 2)
    ctx.arc(px + 2, py - 2, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderRivalAnt(ctx: CanvasRenderingContext2D, px: number, py: number): void {
    ctx.fillStyle = '#C62828'
    ctx.beginPath()
    ctx.ellipse(px, py, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
    this.drawLegs(ctx, px, py, 3, '#C62828')
    this.drawAntennae(ctx, px, py, 4, '#C62828')
  }

  private renderPheromones(): void {
    if (!this.pheromoneSystem) return
    const ctx = this.ctx
    const map = this.pheromoneSystem.map
    const startCol = Math.max(0, Math.floor(this.cameraX / CELL_SIZE))
    const endCol = Math.min(map.width, Math.ceil((this.cameraX + this.width) / CELL_SIZE))
    const startRow = Math.max(0, Math.floor(this.cameraY / CELL_SIZE))
    const endRow = Math.min(map.height, Math.ceil((this.cameraY + this.height) / CELL_SIZE))

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const index = row * map.width + col
        const px = col * CELL_SIZE + CELL_SIZE / 2 - this.cameraX
        const py = row * CELL_SIZE + CELL_SIZE / 2 - this.cameraY

        const foraging = map.foraging[index]
        const alarm = map.alarm[index]
        const homing = map.homing[index]

        if (foraging > 0.05) {
          ctx.fillStyle = `rgba(33, 150, 243, ${foraging * 0.4})`
          ctx.beginPath()
          ctx.arc(px, py, CELL_SIZE / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (alarm > 0.05) {
          ctx.fillStyle = `rgba(244, 67, 54, ${alarm * 0.4})`
          ctx.beginPath()
          ctx.arc(px, py, CELL_SIZE / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (homing > 0.05) {
          ctx.fillStyle = `rgba(255, 235, 59, ${homing * 0.4})`
          ctx.beginPath()
          ctx.arc(px, py, CELL_SIZE / 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  private renderSeasonOverlay(): void {
    if (!this.seasonSystem) return
    const ctx = this.ctx
    const state = this.seasonSystem.state
    const opacity = state.transitionProgress * 0.15

    let color: string
    switch (state.currentSeason) {
      case Season.SPRING:
        color = `rgba(244, 143, 177, ${opacity})`
        break
      case Season.SUMMER:
        color = `rgba(255, 193, 7, ${opacity})`
        break
      case Season.AUTUMN:
        color = `rgba(255, 87, 34, ${opacity})`
        break
      case Season.WINTER:
        color = `rgba(100, 181, 246, ${opacity})`
        break
      default:
        return
    }

    ctx.fillStyle = color
    ctx.fillRect(0, 0, this.width, this.height)
  }

  private renderBuildPreview(): void {
    if (!this.buildMode || !this.hoverPosition || !this.buildSystem) return
    const ctx = this.ctx
    const config = getRoomConfig(this.buildMode)
    const gridX = Math.floor(this.hoverPosition.x / CELL_SIZE)
    const gridY = Math.floor(this.hoverPosition.y / CELL_SIZE)
    const px = gridX * CELL_SIZE - this.cameraX
    const py = gridY * CELL_SIZE - this.cameraY
    const width = config.size.width * CELL_SIZE
    const height = config.size.height * CELL_SIZE

    const isValid =
      gridX >= 0 &&
      gridX + config.size.width <= this.buildSystem.gridWidth &&
      gridY >= 0 &&
      gridY + config.size.height <= this.buildSystem.gridHeight

    ctx.fillStyle = isValid ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'
    ctx.fillRect(px, py, width, height)

    ctx.strokeStyle = isValid ? '#4CAF50' : '#F44336'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(px, py, width, height)
    ctx.setLineDash([])
  }

  private renderDisasterEffects(): void {
    if (this.activeDisaster === DisasterType.NONE) return
    const ctx = this.ctx

    switch (this.activeDisaster) {
      case DisasterType.FLOOD: {
        const waterHeight = this.height * 0.4
        ctx.fillStyle = 'rgba(33, 150, 243, 0.3)'
        ctx.fillRect(0, this.height - waterHeight, this.width, waterHeight)
        ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)'
        ctx.lineWidth = 2
        const time = Date.now() / 300
        for (let i = 0; i < 5; i++) {
          ctx.beginPath()
          const y = this.height - waterHeight + i * 8
          for (let x = 0; x <= this.width; x += 20) {
            const waveY = y + Math.sin((x + time * 50 + i * 30) / 40) * 3
            if (x === 0) {
              ctx.moveTo(x, waveY)
            } else {
              ctx.lineTo(x, waveY)
            }
          }
          ctx.stroke()
        }
        break
      }
      case DisasterType.DROUGHT: {
        ctx.fillStyle = 'rgba(245, 127, 23, 0.15)'
        ctx.fillRect(0, 0, this.width, this.height)
        ctx.strokeStyle = 'rgba(121, 85, 72, 0.4)'
        ctx.lineWidth = 1
        for (let i = 0; i < 15; i++) {
          const startX = (i * 137) % this.width
          const startY = (i * 97) % this.height
          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(startX + 20 + (i % 3) * 10, startY + 15)
          ctx.lineTo(startX + 40 + (i % 5) * 5, startY + 5)
          ctx.stroke()
        }
        break
      }
      case DisasterType.BLIZZARD: {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(0, 0, this.width, this.height)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        const time = Date.now() / 100
        for (let i = 0; i < 100; i++) {
          const x = ((i * 73 + time * 2) % (this.width + 20)) - 10
          const y = ((i * 47 + time * 3) % (this.height + 20)) - 10
          const size = 1 + (i % 3) * 0.5
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
      case DisasterType.DISEASE: {
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)'
        ctx.fillRect(0, 0, this.width, this.height)
        const time = Date.now() / 500
        for (let i = 0; i < 20; i++) {
          const x = (i * 100 + Math.sin(time + i) * 30) % this.width
          const y = (i * 80 + Math.cos(time * 0.7 + i) * 20) % this.height
          const radius = 15 + Math.sin(time + i * 0.5) * 5
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
          gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)')
          gradient.addColorStop(1, 'rgba(76, 175, 80, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
      case DisasterType.WILDFIRE: {
        ctx.fillStyle = 'rgba(255, 87, 34, 0.15)'
        ctx.fillRect(0, 0, this.width, this.height)
        const time = Date.now() / 100
        for (let i = 0; i < 50; i++) {
          const x = (i * 60) % this.width
          const y = this.height - 30 - (i % 3) * 20 + Math.sin(time + i) * 10
          const height = 20 + Math.sin(time * 2 + i) * 10
          const gradient = ctx.createLinearGradient(x, y, x, y - height)
          gradient.addColorStop(0, 'rgba(255, 87, 34, 0.8)')
          gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.6)')
          gradient.addColorStop(1, 'rgba(255, 235, 59, 0)')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.moveTo(x - 5, y)
          ctx.quadraticCurveTo(x - 3, y - height / 2, x, y - height)
          ctx.quadraticCurveTo(x + 3, y - height / 2, x + 5, y)
          ctx.closePath()
          ctx.fill()
        }
        break
      }
    }
  }

  private renderRooms(): void {
    if (!this.buildSystem) return
    const ctx = this.ctx
    for (const room of this.buildSystem.rooms) {
      const px = room.gridX * CELL_SIZE - this.cameraX
      const py = room.gridY * CELL_SIZE - this.cameraY
      const width = room.width * CELL_SIZE
      const height = room.height * CELL_SIZE

      const config = getRoomConfig(room.type)
      let borderColor: string
      switch (config.cellType) {
        case CellType.QUEEN_CHAMBER:
          borderColor = '#FFB300'
          break
        case CellType.NURSERY:
          borderColor = '#E91E63'
          break
        case CellType.FOOD_STORAGE:
          borderColor = '#4CAF50'
          break
        case CellType.WATER_RESERVOIR:
          borderColor = '#2196F3'
          break
        case CellType.BARRACKS:
          borderColor = '#F44336'
          break
        case CellType.FUNGUS_FARM:
          borderColor = '#8BC34A'
          break
        default:
          borderColor = '#795548'
      }

      ctx.strokeStyle = borderColor
      ctx.lineWidth = 3
      ctx.strokeRect(px, py, width, height)

      if (!room.active) {
        ctx.fillStyle = 'rgba(255, 193, 7, 0.2)'
        ctx.fillRect(px, py, width, height)
        const barWidth = width - 8
        const barHeight = 4
        const barX = px + 4
        const barY = py + height - 8
        ctx.fillStyle = '#333'
        ctx.fillRect(barX, barY, barWidth, barHeight)
        ctx.fillStyle = '#FFC107'
        ctx.fillRect(barX, barY, barWidth * room.buildProgress, barHeight)
      }
    }
  }

  setSelectedAnt(id: string | null): void {
    this.selectedAntId = id
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.cameraX,
      y: screenY + this.cameraY,
    }
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height
  }
}

export default CanvasRenderer
