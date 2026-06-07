<script setup lang="ts">
import { ref } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import AntDetail from '@/components/AntDetail.vue'
import SpeedControl from '@/components/SpeedControl.vue'
import MainMenu from '@/components/MainMenu.vue'
import BiomeSelect from '@/components/BiomeSelect.vue'
import SeasonIndicator from '@/components/SeasonIndicator.vue'
import GenePanel from '@/components/GenePanel.vue'
import BuildPanel from '@/components/BuildPanel.vue'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const showGenePanel = ref(false)
const showBuildPanel = ref(false)
const showViewToggle = ref(false)
</script>

<template>
  <div v-if="store.gamePhase === 'menu'" class="game-container">
    <MainMenu />
  </div>
  <div v-else-if="store.gamePhase === 'biome-select'" class="game-container">
    <BiomeSelect />
  </div>
  <div v-else class="game-container">
    <div class="game-main">
      <div class="top-bar">
        <div class="top-bar-left">
          <button
            class="panel-toggle-btn"
            :class="{ active: showGenePanel }"
            @click="showGenePanel = !showGenePanel"
          >
            🧬 基因
          </button>
          <button
            class="panel-toggle-btn"
            :class="{ active: showBuildPanel }"
            @click="showBuildPanel = !showBuildPanel"
          >
            🏗️ 建造
          </button>
        </div>
        <div class="top-bar-right">
          <button
            class="panel-toggle-btn"
            :class="{ active: showViewToggle }"
            @click="showViewToggle = !showViewToggle"
          >
            👁️ 视图
          </button>
        </div>
      </div>
      <GameCanvas />
      <AntDetail />
      <SeasonIndicator />
      <GenePanel v-if="showGenePanel" />
      <BuildPanel v-if="showBuildPanel" />
      <div class="bottom-bar">
        <SpeedControl />
        <div class="game-title">🐜 蚂蚁部落模拟</div>
      </div>
    </div>
    <StatusPanel />
  </div>
</template>

<style scoped>
.game-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1A0E08;
}

.game-main {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.game-main :deep(.game-canvas-container) {
  flex: 1;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #2C1810;
  border-bottom: 1px solid #5D4037;
  z-index: 10;
}

.top-bar-left,
.top-bar-right {
  display: flex;
  gap: 8px;
}

.panel-toggle-btn {
  padding: 6px 12px;
  background: #3E2723;
  border: 1px solid #5D4037;
  border-radius: 6px;
  color: #D7CCC8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif;
}

.panel-toggle-btn:hover {
  background: #4E342E;
  border-color: #8D6E63;
  color: #FF8F00;
}

.panel-toggle-btn.active {
  background: #5D4037;
  border-color: #FF8F00;
  color: #FF8F00;
}

.bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #2C1810;
  border-top: 1px solid #5D4037;
}

.game-title {
  color: #FF8F00;
  font-size: 16px;
  font-weight: bold;
  font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif;
  letter-spacing: 2px;
}

.game-main :deep(.season-indicator) {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
}

.game-main :deep(.gene-panel) {
  position: absolute;
  bottom: 80px;
  left: 12px;
  z-index: 20;
}

.game-main :deep(.build-panel) {
  position: absolute;
  bottom: 80px;
  right: 12px;
  z-index: 20;
}
</style>
