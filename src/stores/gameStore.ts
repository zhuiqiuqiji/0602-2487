import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Colony from '@/game/Colony'
import CanvasRenderer from '@/renderer/CanvasRenderer'
import type PheromoneSystem from '@/game/PheromoneSystem'
import type SeasonSystem from '@/game/SeasonSystem'
import type BuildSystem from '@/game/BuildSystem'
import ParticleSystem from '@/renderer/ParticleSystem'
import {
  ViewMode,
  GameSpeed,
  ColonyStatus,
  AntState,
  CELL_SIZE,
  AntType,
  CellType,
  GeneType,
  RoomType,
  BiomeType,
  GameMode,
  DisasterType,
  Season,
} from '@/utils/constants'
import { getRoomConfig, canUnlockRoom } from '@/data/rooms'
import { BIOMES } from '@/data/biomes'

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
  const buildMode = ref<RoomType | null>(null)
  const gameMode = ref<GameMode | null>(null)
  const gamePhase = ref<'menu' | 'biome-select' | 'playing'>('menu')
  const selectedBiome = ref<BiomeType | null>(null)

  const food = computed(() => colony.value?.food ?? 0)
  const maxFood = computed(() => colony.value?.maxFood ?? 500)
  const foodRate = computed(() => colony.value?.foodRate ?? 0)
  const antCounts = computed<AntCounts>(() => colony.value?.getAntCounts() ?? { [AntType.QUEEN]: 0, [AntType.WORKER]: 0, [AntType.SOLDIER]: 0, [AntType.REPRODUCTIVE]: 0, egg: 0, larva: 0, pupa: 0 })
  const totalAnts = computed(() => {
    if (!colony.value) return 0
    return colony.value.ants.filter((a) => a.isAlive()).length
  })
  const colonyStatus = computed(() => colony.value?.getStatus() ?? ColonyStatus.NORMAL)
  const events = computed(() => colony.value?.events ?? [])
  const enemyCount = computed(() => colony.value?.enemies.filter((e) => e.isAlive()).length ?? 0)
  const dayNightCycle = computed(() => colony.value?.dayNightCycle ?? 0)
  const water = computed(() => colony.value?.water ?? 0)
  const maxWater = computed(() => colony.value?.maxWater ?? 150)
  const material = computed(() => colony.value?.material ?? 0)
  const maxMaterial = computed(() => colony.value?.maxMaterial ?? 100)
  const seasonState = computed(() => colony.value?.getSeasonState() ?? {
    currentSeason: Season.SPRING,
    dayInSeason: 0,
    upcomingDisaster: DisasterType.NONE,
    disasterCountdown: 0,
    activeDisaster: DisasterType.NONE,
    disasterTimer: 0,
    transitionProgress: 0,
  })
  const geneStats = computed(() => colony.value?.getGeneStats() ?? {
    speed: 1,
    strength: 1,
    diseaseResist: 1,
    capacity: 1,
    reproduction: 1,
    genePoints: 0,
  })
  const seasonModifiers = computed(() => colony.value?.getSeasonModifiers() ?? {
    speedMod: 0,
    foodMod: 0,
    reproductionMod: 0,
    consumptionMod: 0,
  })
  const rooms = computed(() => colony.value?.getRooms())

  const selectedAnt = computed(() => {
    if (!colony.value || !selectedAntId.value) return null
    return colony.value.ants.find((a) => a.id === selectedAntId.value) ?? null
  })

  function initGame(canvas: HTMLCanvasElement) {
    colony.value = new Colony()
    renderer.value = new CanvasRenderer(canvas)
    renderer.value.setSystems(
      colony.value.pheromoneSystem as PheromoneSystem,
      colony.value.seasonSystem as SeasonSystem,
      colony.value.buildSystem as BuildSystem,
    )
    renderer.value.setBiome(colony.value.biome)
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

    renderer.value.setActiveDisaster(colony.value.seasonSystem.state.activeDisaster)
    renderer.value.setBiome(colony.value.biome)

    particles.value.update(dt * speedMultiplier)
    renderer.value.render(colony.value as Colony)
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

    if (buildMode.value !== null && viewMode.value === ViewMode.UNDERGROUND) {
      const result = startBuild(buildMode.value, gridX, gridY)
      if (result.success) {
        renderer.value?.setBuildMode(null)
        setBuildMode(null)
      }
      return
    }

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

  function upgradeGene(geneType: GeneType) {
    if (!colony.value) return { success: false, message: '游戏未初始化' }
    return colony.value.upgradeGene(geneType)
  }

  function getGeneStats() {
    return geneStats.value
  }

  function setBuildMode(roomType: RoomType | null) {
    buildMode.value = roomType
    renderer.value?.setBuildMode(roomType)
  }

  function startBuild(roomType: RoomType, gridX: number, gridY: number) {
    if (!colony.value) return { success: false, message: '游戏未初始化' }
    return colony.value.startBuild(roomType, gridX, gridY)
  }

  function cancelBuild(roomId: string) {
    if (!colony.value) return false
    return colony.value.cancelBuild(roomId)
  }

  function setBiome(biome: BiomeType) {
    selectedBiome.value = biome
    if (colony.value) {
      colony.value.setBiome(biome)
    }
    renderer.value?.setBiome(biome)
  }

  function setShowPheromones(show: boolean) {
    renderer.value?.setShowPheromones(show)
  }

  function startGame(biome: BiomeType, canvas?: HTMLCanvasElement) {
    selectedBiome.value = biome
    gamePhase.value = 'playing'
    if (canvas && !colony.value) {
      colony.value = new Colony(biome)
      if (renderer.value) {
        renderer.value.setSystems(
          colony.value.pheromoneSystem as PheromoneSystem,
          colony.value.seasonSystem as SeasonSystem,
          colony.value.buildSystem as BuildSystem,
        )
        renderer.value.setBiome(colony.value.biome)
        isRunning.value = true
        lastFrameTime.value = performance.now()
        gameLoop(lastFrameTime.value)
      }
    }
  }

  function startSinglePlayer() {
    gameMode.value = GameMode.SINGLE
    gamePhase.value = 'biome-select'
  }

  function startBattleMode() {
    gameMode.value = GameMode.BATTLE
    gamePhase.value = 'biome-select'
  }

  function canAffordRoom(roomType: RoomType) {
    const config = getRoomConfig(roomType)
    return material.value >= config.cost.material && food.value >= config.cost.food
  }

  function isRoomUnlocked(roomType: RoomType) {
    const totalAntsCount = totalAnts.value
    const geneLevel = geneStats.value.genePoints
    return canUnlockRoom(roomType, totalAntsCount, geneLevel)
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
    water,
    maxWater,
    material,
    maxMaterial,
    seasonState,
    geneStats,
    seasonModifiers,
    buildMode,
    gameMode,
    gamePhase,
    selectedBiome,
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
    upgradeGene,
    getGeneStats,
    setBuildMode,
    startBuild,
    cancelBuild,
    setBiome,
    startGame,
    startSinglePlayer,
    startBattleMode,
    canAffordRoom,
    isRoomUnlocked,
    rooms,
    setShowPheromones,
  }
})
