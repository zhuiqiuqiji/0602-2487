import {
  CellType,
  AntType,
  AntState,
  type Ant,
  type Enemy,
  EnemyType,
  EggStage,
  type Egg,
  type FoodSource,
  ViewMode,
  CELL_SIZE,
  NEST_COLS,
  NEST_ROWS,
  SURFACE_COLS,
  SURFACE_ROWS,
} from '@/utils/constants'
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

  private grassDecorations: { x: number; y: number; type: number }[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
    this.generateGrassDecorations()
  }

  render(colony: Colony): void {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    if (colony.viewMode === ViewMode.UNDERGROUND) {
      this.renderUnderground(colony)
    } else {
      this.renderSurface(colony)
    }

    this.renderAnts(colony.ants)

    if (colony.viewMode === ViewMode.SURFACE) {
      this.renderEnemies(colony.enemies)
      this.renderFoodSources(colony.foodSources)
    }

    if (colony.viewMode === ViewMode.UNDERGROUND) {
      this.renderEggs(colony.eggs)
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
    }
  }

  renderSurface(colony: Colony): void {
    const ctx = this.ctx
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#2E7D32')
    gradient.addColorStop(1, '#388E3C')
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
    for (const deco of this.grassDecorations) {
      const px = deco.x - this.cameraX
      const py = deco.y - this.cameraY
      if (px < -20 || px > this.width + 20 || py < -20 || py > this.height + 20) continue

      if (deco.type === 0) {
        ctx.strokeStyle = '#1B5E20'
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

      this.renderAntBody(ctx, ant, px, py)

      if (ant.carrying) {
        ctx.fillStyle = '#8BC34A'
        ctx.beginPath()
        ctx.arc(px, py - 7, 2.5, 0, Math.PI * 2)
        ctx.fill()
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
