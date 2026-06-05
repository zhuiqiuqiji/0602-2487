<template>
  <div class="ant-detail" v-if="store.selectedAnt">
    <div class="detail-header">
      <span>{{ antTypeLabel }}</span>
      <button class="close-btn" @click="store.selectAnt(null)">✕</button>
    </div>
    <div class="stat-row">
      <span>生命</span>
      <span>{{ store.selectedAnt.health }}/{{ store.selectedAnt.maxHealth }}</span>
    </div>
    <div class="bar-container">
      <div class="bar-fill" :style="{ width: healthPercent + '%', background: healthColor }"></div>
    </div>
    <div class="stat-row">
      <span>饥饿</span>
      <span>{{ store.selectedAnt.hunger }}</span>
    </div>
    <div class="bar-container">
      <div class="bar-fill" :style="{ width: store.selectedAnt.hunger + '%', background: hungerColor }"></div>
    </div>
    <div class="stat-row">
      <span>状态</span>
      <span>{{ stateLabel }}</span>
    </div>
    <div class="stat-row">
      <span>位置</span>
      <span>{{ store.selectedAnt.x }}, {{ store.selectedAnt.y }}</span>
    </div>
    <div class="stat-row">
      <span>攻击</span>
      <span>{{ store.selectedAnt.attack }}</span>
    </div>
    <div class="stat-row">
      <span>速度</span>
      <span>{{ store.selectedAnt.speed }}</span>
    </div>
    <div class="command-grid" v-if="store.selectedAnt.type !== AntType.QUEEN">
      <button class="cmd-btn" @click="assignTask(AntState.FORAGING)">觅食</button>
      <button class="cmd-btn" @click="assignTask(AntState.DIGGING)">挖掘</button>
      <button class="cmd-btn" @click="assignTask(AntState.FIGHTING)">战斗</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { AntState, AntType } from '@/utils/constants'

const store = useGameStore()

const antTypeLabel = computed(() => {
  switch (store.selectedAnt?.type) {
    case AntType.QUEEN: return '👑 蚁后'
    case AntType.WORKER: return '🐜 工蚁'
    case AntType.SOLDIER: return '⚔️ 兵蚁'
    default: return ''
  }
})

const stateLabel = computed(() => {
  switch (store.selectedAnt?.state) {
    case AntState.IDLE: return '空闲'
    case AntState.FORAGING: return '觅食'
    case AntState.RETURNING: return '搬运'
    case AntState.DIGGING: return '挖掘'
    case AntState.CARING: return '照顾'
    case AntState.FIGHTING: return '战斗'
    case AntState.EATING: return '进食'
    case AntState.FOLLOWING: return '跟随'
    default: return ''
  }
})

const healthPercent = computed(() => {
  if (!store.selectedAnt) return 0
  return (store.selectedAnt.health / store.selectedAnt.maxHealth) * 100
})

const healthColor = computed(() => {
  if (healthPercent.value > 60) return '#4CAF50'
  if (healthPercent.value > 30) return '#FFC107'
  return '#F44336'
})

const hungerColor = computed(() => {
  const h = store.selectedAnt?.hunger ?? 0
  if (h < 30) return '#4CAF50'
  if (h < 70) return '#FFC107'
  return '#F44336'
})

function assignTask(state: AntState) {
  if (!store.selectedAnt) return
  store.assignAntTask(state, store.selectedAnt.x, store.selectedAnt.y)
}
</script>

<style scoped>
.ant-detail {
  position: absolute;
  top: 50%;
  right: 300px;
  transform: translateY(-50%);
  width: 200px;
  background: #3E2723;
  border: 2px solid #FF8F00;
  border-radius: 12px;
  padding: 14px;
  color: #D7CCC8;
  z-index: 20;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  color: #FF8F00;
  margin-bottom: 10px;
}
.close-btn {
  background: none;
  border: none;
  color: #D7CCC8;
  cursor: pointer;
  font-size: 18px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin: 4px 0;
}
.bar-container {
  height: 6px;
  background: #1A0E08;
  border-radius: 3px;
  overflow: hidden;
  margin: 2px 0 8px;
}
.bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.command-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-top: 10px;
}
.cmd-btn {
  padding: 6px 0;
  background: #5D4037;
  border: none;
  color: #D7CCC8;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}
.cmd-btn:hover {
  background: #FF8F00;
  color: #3E2723;
}
</style>
