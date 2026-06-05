import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Colony from '@/game/Colony'
import CanvasRenderer from '@/renderer/CanvasRenderer'
import ParticleSystem from '@/renderer/ParticleSystem'
import {
  ViewMode,
  GameSpeed,
  ColonyStatus,
  AntState,
  CELL_SIZE,
  AntType,
  CellType,
} from '@/utils/constants'

type AntCounts = Record<AntType | 'egg' | 'larva' | 'pupa', number>

export const useGameStore = defineStore('game', () => {
  const colony = ref<Colony | null>(null)
  const renderer = ref<CanvasRenderer | null>(null)
  const particles = ref(new ParticleSystem())
  const gameSpeed = ref<GameSpeed>(GameSpeed.NORMAL)
  const viewMode = ref<ViewMode>(ViewMode.UNDERGROUND)
  const selectedAntId = ref<string | null>(null)
  const showAntDetail = ref(false)
  const isRunning = ref(false)
  const lastFrameTime = ref(0)

  const food = computed(() => colony.value?.food ?? 0)
  const maxFood = computed(() => colony.value?.maxFood ?? 500)
  const foodRate = computed(() => colony.value?.foodRate ?? 0)
  const antCounts = computed<AntCounts>(() => colony.value?.getAntCounts() ?? { [AntType.QUEEN]: 0, [AntType.WORKER]: 0, [AntType.SOLDIER]: 0, egg: 0, larva: 0, pupa: 0 })
  const totalAnts = computed(() => {
    if (!colony.value) return 0
    return colony.value.ants.filter((a) => a.isAlive()).length
  })
  const colonyStatus = computed(() => colony.value?.getStatus() ?? ColonyStatus.NORMAL)
  const events = computed(() => colony.value?.events ?? [])
  const enemyCount = computed(() => colony.value?.enemies.filter((e) => e.isAlive()).length ?? 0)
  const dayNightCycle = computed(() => colony.value?.dayNightCycle ?? 0)

  const selectedAnt = computed(() => {
    if (!colony.value || !selectedAntId.value) return null
    return colony.value.ants.find((a) => a.id === selectedAntId.value) ?? null
  })

  function initGame(canvas: HTMLCanvasElement) {
    colony.value = new Colony()
    renderer.value = new CanvasRenderer(canvas)
    isRunning.value = true
    lastFrameTime.value = performance.now()
    gameLoop(lastFrameTime.value)
  }

  function gameLoop(timestamp: number) {
    if (!isRunning.value || !colony.value || !renderer.value) return

    const rawDt = (timestamp - lastFrameTime.value) / 1000
    const dt = Math.min(rawDt, 0.1)
    lastFrameTime.value = timestamp

    const speedMultiplier = gameSpeed.value === GameSpeed.PAUSED
      ? 0
      : gameSpeed.value
    colony.value.update(dt)
    colony.value.gameSpeed = speedMultiplier

    particles.value.update(dt * speedMultiplier)
    renderer.value.render(colony.value)
    particles.value.render(renderer.value.ctx)

    requestAnimationFrame(gameLoop)
  }

  function setGameSpeed(speed: GameSpeed) {
    gameSpeed.value = speed
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    if (colony.value) {
      colony.value.viewMode = mode
    }
  }

  function selectAnt(antId: string | null) {
    selectedAntId.value = antId
    showAntDetail.value = antId !== null
    if (renderer.value) {
      renderer.value.setSelectedAnt(antId)
    }
  }

  function assignAntTask(state: AntState, targetX: number, targetY: number, targetId?: string) {
    if (!colony.value || !selectedAntId.value) return
    colony.value.assignAntTask(selectedAntId.value, state, targetX, targetY, targetId)
  }

  function markFoodSource(foodSourceId: string) {
    colony.value?.markFoodSource(foodSourceId)
  }

  function markDigTarget(gridX: number, gridY: number) {
    colony.value?.markDigTarget(gridX, gridY)
  }

  function handleClick(worldX: number, worldY: number) {
    if (!colony.value) return

    const gridX = Math.floor(worldX / CELL_SIZE)
    const gridY = Math.floor(worldY / CELL_SIZE)

    if (viewMode.value === ViewMode.UNDERGROUND) {
      const clickedAnt = colony.value.ants.find(
        (a) => Math.abs(a.viewX - worldX) < 12 && Math.abs(a.viewY - worldY) < 12,
      )
      if (clickedAnt) {
        selectAnt(clickedAnt.id)
        return
      }

      if (colony.value.nestGrid[gridY]?.[gridX] === CellType.DIRT) {
        markDigTarget(gridX, gridY)
        particles.value.emitDig(worldX, worldY)
      }
    } else {
      const clickedFood = colony.value.foodSources.find(
        (f) => Math.abs(f.x - worldX) < 16 && Math.abs(f.y - worldY) < 16,
      )
      if (clickedFood) {
        markFoodSource(clickedFood.id)
        particles.value.emitFood(worldX, worldY)
      }

      const clickedAnt = colony.value.ants.find(
        (a) => Math.abs(a.viewX - worldX) < 12 && Math.abs(a.viewY - worldY) < 12,
      )
      if (clickedAnt) {
        selectAnt(clickedAnt.id)
      }
    }
  }

  function pause() {
    gameSpeed.value = GameSpeed.PAUSED
  }

  function resume() {
    gameSpeed.value = GameSpeed.NORMAL
  }

  function destroy() {
    isRunning.value = false
  }

  return {
    colony,
    renderer,
    particles,
    gameSpeed,
    viewMode,
    selectedAntId,
    selectedAnt,
    showAntDetail,
    isRunning,
    food,
    maxFood,
    foodRate,
    antCounts,
    totalAnts,
    colonyStatus,
    events,
    enemyCount,
    dayNightCycle,
    initGame,
    setGameSpeed,
    setViewMode,
    selectAnt,
    assignAntTask,
    markFoodSource,
    markDigTarget,
    handleClick,
    pause,
    resume,
    destroy,
  }
})
