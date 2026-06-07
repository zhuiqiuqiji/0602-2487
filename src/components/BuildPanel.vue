<template>
  <div class="build-panel">
    <div class="panel-title">🏗️ 建造房间</div>

    <div class="resources-display">
      <div class="resource-item">
        <span class="resource-icon">🧱</span>
        <span class="resource-value">{{ store.material }}/{{ store.maxMaterial }}</span>
      </div>
      <div class="resource-item">
        <span class="resource-icon">🍖</span>
        <span class="resource-value">{{ store.food }}/{{ store.maxFood }}</span>
      </div>
    </div>

    <div class="room-list">
      <div
        v-for="room in ROOMS"
        :key="room.id"
        class="room-card"
        :class="{ locked: !isUnlocked(room.id), selected: store.buildMode === room.id }"
      >
        <div class="room-header">
          <span class="room-name">{{ room.name }}</span>
          <span v-if="!isUnlocked(room.id)" class="lock-icon">🔒</span>
        </div>
        <div class="room-description">{{ room.description }}</div>
        <div class="room-cost">
          <span>🧱 {{ room.cost.material }}</span>
          <span>🍖 {{ room.cost.food }}</span>
        </div>
        <div class="room-size">
          尺寸: {{ room.size.width }}x{{ room.size.height }}
        </div>
        <div v-if="isUnlocked(room.id)" class="room-actions">
          <button
            v-if="store.buildMode !== room.id"
            class="build-btn"
            :disabled="!canAfford(room.id)"
            @click="handleSelectBuild(room.id)"
          >
            选择建造
          </button>
          <button
            v-else
            class="cancel-btn"
            @click="handleCancelSelect"
          >
            取消选择
          </button>
        </div>
        <div v-else class="unlock-condition">
          需要 {{ room.unlockCondition.antCount ?? 0 }} 只蚂蚁
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RoomType } from '@/utils/constants'
import { ROOMS, getRoomConfig } from '@/data/rooms'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()

function isUnlocked(roomType: RoomType): boolean {
  return store.isRoomUnlocked(roomType)
}

function canAfford(roomType: RoomType): boolean {
  return store.canAffordRoom(roomType)
}

function handleSelectBuild(roomType: RoomType) {
  store.setBuildMode(roomType)
}

function handleCancelSelect() {
  store.setBuildMode(null)
}
</script>

<style scoped>
.build-panel {
  background: #3E2723;
  border-radius: 12px;
  padding: 16px;
  width: 300px;
  color: #D7CCC8;
  font-family: 'Noto Sans SC';
  max-height: 600px;
  overflow-y: auto;
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #FF8F00;
  margin-bottom: 12px;
  text-align: center;
}

.resources-display {
  display: flex;
  justify-content: space-around;
  background: #2C1810;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 16px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.resource-icon {
  font-size: 16px;
}

.resource-value {
  font-size: 14px;
  font-weight: bold;
  color: #FF8F00;
}

.room-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-card {
  background: #2C1810;
  border-radius: 8px;
  padding: 10px;
  margin: 8px 0;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.room-card.selected {
  border-color: #FF8F00;
  background: rgba(255, 143, 0, 0.1);
}

.room-card.locked {
  opacity: 0.5;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.room-name {
  font-size: 14px;
  font-weight: bold;
  color: #FF8F00;
}

.lock-icon {
  font-size: 14px;
}

.room-description {
  font-size: 11px;
  color: #A1887F;
  margin-bottom: 8px;
  line-height: 1.4;
}

.room-cost {
  display: flex;
  gap: 16px;
  font-size: 12px;
  margin-bottom: 6px;
}

.room-size {
  font-size: 10px;
  color: #8D6E63;
  margin-bottom: 8px;
}

.room-actions {
  display: flex;
  justify-content: center;
}

.build-btn {
  background: #FF8F00;
  color: #3E2723;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.build-btn:hover:not(:disabled) {
  background: #FFA726;
  transform: scale(1.02);
}

.build-btn:disabled {
  background: #5D4037;
  color: #8D6E63;
  cursor: not-allowed;
}

.cancel-btn {
  background: #F44336;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.cancel-btn:hover {
  background: #E53935;
  transform: scale(1.02);
}

.unlock-condition {
  font-size: 10px;
  color: #F44336;
  text-align: center;
  padding: 4px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}
</style>
