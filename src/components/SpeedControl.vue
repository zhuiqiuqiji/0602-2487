<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { GameSpeed } from '@/utils/constants'

const store = useGameStore()

const dayColor = computed(() => {
  const t = store.dayNightCycle
  const r = Math.round(255 * (1 - t) + 26 * t)
  const g = Math.round(213 * (1 - t) + 35 * t)
  const b = Math.round(79 * (1 - t) + 126 * t)
  return `rgb(${r}, ${g}, ${b})`
})
</script>

<template>
  <div class="speed-control">
    <button
      class="speed-btn"
      :class="{ active: store.gameSpeed === GameSpeed.PAUSED }"
      @click="store.setGameSpeed(GameSpeed.PAUSED)"
    >⏸</button>
    <button
      class="speed-btn"
      :class="{ active: store.gameSpeed === GameSpeed.NORMAL }"
      @click="store.setGameSpeed(GameSpeed.NORMAL)"
    >1x</button>
    <button
      class="speed-btn"
      :class="{ active: store.gameSpeed === GameSpeed.FAST }"
      @click="store.setGameSpeed(GameSpeed.FAST)"
    >2x</button>
    <button
      class="speed-btn"
      :class="{ active: store.gameSpeed === GameSpeed.FASTER }"
      @click="store.setGameSpeed(GameSpeed.FASTER)"
    >3x</button>
    <div class="day-indicator" :style="{ background: dayColor }"></div>
  </div>
</template>

<style scoped>
.speed-control {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #2C1810;
  border-radius: 8px;
  border: 1px solid #5D4037;
}

.speed-btn {
  width: 36px;
  height: 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  background: #3E2723;
  color: #D7CCC8;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.speed-btn.active {
  background: #FF8F00;
  color: #3E2723;
}

.speed-btn:hover:not(.active) {
  background: #5D4037;
}

.day-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-left: 8px;
  border: 2px solid #5D4037;
  transition: background 1s;
}
</style>
