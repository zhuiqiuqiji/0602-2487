<template>
  <div class="game-canvas-container" :class="{ 'build-mode': store.buildMode !== null }">
    <canvas ref="canvasRef"></canvas>
    <div class="view-toggle">
      <button
        class="view-btn"
        :class="{ active: store.viewMode === ViewMode.UNDERGROUND }"
        @click="switchView(ViewMode.UNDERGROUND)"
      >
        地下巢穴
      </button>
      <button
        class="view-btn"
        :class="{ active: store.viewMode === ViewMode.SURFACE }"
        @click="switchView(ViewMode.SURFACE)"
      >
        地面世界
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { ViewMode, CELL_SIZE } from '@/utils/constants'
import type PheromoneSystem from '@/game/PheromoneSystem'
import type SeasonSystem from '@/game/SeasonSystem'
import type BuildSystem from '@/game/BuildSystem'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const store = useGameStore()

let resizeObserver: ResizeObserver | null = null

const handleClick = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const worldX = (event.clientX - rect.left) * scaleX
  const worldY = (event.clientY - rect.top) * scaleY
  store.handleClick(worldX, worldY)
}

const switchView = (mode: ViewMode) => {
  store.setViewMode(mode)
}

const handleMouseMove = (event: MouseEvent) => {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const worldX = (event.clientX - rect.left) * scaleX
  const worldY = (event.clientY - rect.top) * scaleY
  store.renderer?.setHoverPosition(worldX, worldY)
}

const handleMouseLeave = () => {
  store.renderer?.setHoverPosition(null)
}

watch(() => store.buildMode, (buildMode) => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.style.cursor = buildMode !== null ? 'cell' : 'crosshair'
}, { immediate: true })

onMounted(() => {
  const canvas = canvasRef.value
  const container = canvas?.parentElement
  if (!canvas || !container) return

  canvas.width = container.clientWidth
  canvas.height = container.clientHeight

  store.initGame(canvas)

  canvas.addEventListener('click', handleClick)
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('mouseleave', handleMouseLeave)

  if (store.colony) {
    store.renderer?.setSystems(
      store.colony.pheromoneSystem as unknown as PheromoneSystem,
      store.colony.seasonSystem as unknown as SeasonSystem,
      store.colony.buildSystem as unknown as BuildSystem
    )
    store.renderer?.setBiome(store.colony.biome)
  }

  resizeObserver = new ResizeObserver(() => {
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight
  })
  resizeObserver.observe(container)
})

onUnmounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.removeEventListener('click', handleClick)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseleave', handleMouseLeave)
  }
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  store.destroy()
})
</script>

<style scoped>
.game-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1A0E08;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.build-mode :deep(canvas) {
  cursor: cell;
}

.view-toggle {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0;
  z-index: 10;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.view-btn {
  padding: 8px 20px;
  background: #3E2723;
  color: #D7CCC8;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-family: 'Noto Sans SC';
  transition: all 0.3s;
}

.view-btn.active {
  background: #FF8F00;
  color: #3E2723;
  font-weight: bold;
}

.view-btn:hover:not(.active) {
  background: #5D4037;
}
</style>
