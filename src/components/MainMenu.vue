<template>
  <div class="main-menu">
    <div class="menu-content">
      <div class="title-section">
        <h1 class="main-title">🐜 蚂蚁部落模拟</h1>
        <p class="subtitle">V2.0 进化时代</p>
      </div>

      <div class="menu-buttons">
        <button class="menu-btn single-player" @click="handleSinglePlayer">
          <span class="btn-icon">🎮</span>
          <span class="btn-text">单人模式</span>
        </button>
        <button class="menu-btn battle-mode" @click="handleBattleMode">
          <span class="btn-icon">⚔️</span>
          <span class="btn-text">对战模式</span>
        </button>
      </div>

      <div class="footer">
        <p class="version-text">Version 2.0.0</p>
        <p class="copyright">© 2024 蚂蚁部落模拟</p>
      </div>
    </div>

    <div class="background-decorations">
      <span class="deco-ant deco-ant-1">🐜</span>
      <span class="deco-ant deco-ant-2">🐜</span>
      <span class="deco-ant deco-ant-3">🐜</span>
      <span class="deco-ant deco-ant-4">🐜</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

function handleSinglePlayer() {
  store.startSinglePlayer()
}

function handleBattleMode() {
  store.startBattleMode()
}
</script>

<style scoped>
.main-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1A0E08, #3E2723);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif;
  overflow: hidden;
  z-index: 1000;
}

.menu-content {
  text-align: center;
  z-index: 10;
  position: relative;
}

.title-section {
  margin-bottom: 60px;
}

.main-title {
  font-size: 48px;
  color: #FF8F00;
  margin: 0 0 12px 0;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  letter-spacing: 4px;
}

.subtitle {
  font-size: 24px;
  color: #D7CCC8;
  margin: 0;
  letter-spacing: 8px;
  opacity: 0.9;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.menu-btn {
  width: 300px;
  height: 80px;
  font-size: 24px;
  margin: 20px;
  border-radius: 16px;
  background: #FF8F00;
  color: #3E2723;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(255, 143, 0, 0.4);
  font-family: 'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif;
}

.menu-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(255, 143, 0, 0.6);
  background: #FFA726;
}

.menu-btn:active {
  transform: scale(0.98);
}

.btn-icon {
  font-size: 32px;
}

.btn-text {
  letter-spacing: 4px;
}

.battle-mode {
  background: linear-gradient(135deg, #FF8F00, #FF5722);
}

.battle-mode:hover {
  background: linear-gradient(135deg, #FFA726, #FF7043);
}

.footer {
  margin-top: 80px;
  color: #8D6E63;
}

.version-text {
  font-size: 14px;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.copyright {
  font-size: 12px;
  margin: 0;
  opacity: 0.7;
}

.background-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.deco-ant {
  position: absolute;
  font-size: 48px;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.deco-ant-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.deco-ant-2 {
  top: 20%;
  right: 15%;
  animation-delay: 1.5s;
  font-size: 64px;
}

.deco-ant-3 {
  bottom: 15%;
  left: 20%;
  animation-delay: 3s;
  font-size: 56px;
}

.deco-ant-4 {
  bottom: 25%;
  right: 10%;
  animation-delay: 4.5s;
  font-size: 40px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}
</style>
