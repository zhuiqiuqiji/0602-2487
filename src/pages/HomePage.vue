<script setup lang="ts">
import GameCanvas from '@/components/GameCanvas.vue'
import StatusPanel from '@/components/StatusPanel.vue'
import AntDetail from '@/components/AntDetail.vue'
import SpeedControl from '@/components/SpeedControl.vue'
</script>

<template>
  <div class="game-container">
    <div class="game-main">
      <GameCanvas />
      <AntDetail />
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
</style>
