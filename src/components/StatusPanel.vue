<template>
  <div class="status-panel">
    <div>
      <div class="section-title">蚁群状态</div>
      <div class="status-badge">
        <span class="status-dot" :style="{ background: statusColor }"></span>
        <span>{{ statusText }}</span>
      </div>
    </div>

    <div>
      <div class="section-title">食物储量</div>
      <div class="food-ring">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#5D4037" stroke-width="6" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            :stroke="foodColor"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="foodDashOffset"
            transform="rotate(-90 40 40)"
          />
          <text x="40" y="36" text-anchor="middle" fill="#D7CCC8" font-size="13" font-weight="bold">
            {{ Math.round(foodPercent) }}%
          </text>
          <text x="40" y="52" text-anchor="middle" fill="#A1887F" font-size="10">
            {{ store.food }}/{{ store.maxFood }}
          </text>
        </svg>
      </div>
      <div style="text-align:center;margin-top:6px;font-size:12px">
        {{ store.foodRate >= 0 ? '📈' : '📉' }} {{ store.foodRate >= 0 ? '+' : '' }}{{ store.foodRate.toFixed(1) }}/s
      </div>
    </div>

    <div>
      <div class="section-title">蚂蚁数量</div>
      <div style="font-size:24px;font-weight:bold;text-align:center;margin-bottom:8px">
        {{ store.totalAnts }}
      </div>
      <div class="ant-count">
        <span><span class="ant-count-icon">👑</span>蚁后</span>
        <span>{{ store.antCounts.queen }}</span>
      </div>
      <div class="ant-count">
        <span><span class="ant-count-icon">🐜</span>工蚁</span>
        <span>{{ store.antCounts.worker }}</span>
      </div>
      <div class="ant-count">
        <span><span class="ant-count-icon">⚔️</span>兵蚁</span>
        <span>{{ store.antCounts.soldier }}</span>
      </div>
      <div class="ant-count">
        <span><span class="ant-count-icon">🥚</span>卵</span>
        <span>{{ store.antCounts.egg }}</span>
      </div>
      <div class="ant-count">
        <span><span class="ant-count-icon">🐛</span>幼虫</span>
        <span>{{ store.antCounts.larva }}</span>
      </div>
      <div class="ant-count">
        <span><span class="ant-count-icon">🫘</span>蛹</span>
        <span>{{ store.antCounts.pupa }}</span>
      </div>
    </div>

    <div>
      <div class="section-title">事件日志</div>
      <div class="event-list" ref="eventListRef">
        <div
          v-for="(event, index) in recentEvents"
          :key="index"
          class="event-item"
          :style="{ borderLeftColor: eventBorderColor(event.type) }"
        >
          {{ event.message }}
        </div>
      </div>
    </div>

    <div v-if="store.enemyCount > 0" class="enemy-alert">
      ⚠️ 外敌入侵! {{ store.enemyCount }}个敌人
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { ColonyStatus, AntType } from '@/utils/constants'

const store = useGameStore()
const eventListRef = ref<HTMLElement | null>(null)

const circumference = 2 * Math.PI * 34

const statusMap: Record<ColonyStatus, { color: string; text: string }> = {
  [ColonyStatus.THRIVING]: { color: '#4CAF50', text: '繁荣' },
  [ColonyStatus.NORMAL]: { color: '#FFC107', text: '正常' },
  [ColonyStatus.HUNGRY]: { color: '#FF9800', text: '饥饿' },
  [ColonyStatus.DANGER]: { color: '#F44336', text: '危险' },
}

const statusColor = computed(() => statusMap[store.colonyStatus]?.color ?? '#FFC107')
const statusText = computed(() => statusMap[store.colonyStatus]?.text ?? '正常')

const foodPercent = computed(() => {
  if (store.maxFood <= 0) return 0
  return (store.food / store.maxFood) * 100
})

const foodDashOffset = computed(() => {
  return circumference * (1 - foodPercent.value / 100)
})

const foodColor = computed(() => {
  if (foodPercent.value > 60) return '#4CAF50'
  if (foodPercent.value > 30) return '#FF9800'
  return '#F44336'
})

const recentEvents = computed(() => {
  return store.events.slice(-8)
})

function eventBorderColor(type: string): string {
  switch (type) {
    case 'info': return '#2196F3'
    case 'warning': return '#FFEB3B'
    case 'danger': return '#F44336'
    case 'success': return '#4CAF50'
    default: return '#2196F3'
  }
}

watch(
  () => store.events.length,
  () => {
    nextTick(() => {
      if (eventListRef.value) {
        eventListRef.value.scrollTop = eventListRef.value.scrollHeight
      }
    })
  }
)
</script>

<style scoped>
.status-panel {
  width: 280px;
  background: #2C1810;
  border-left: 2px solid #5D4037;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  color: #D7CCC8;
  font-family: 'Noto Sans SC';
  font-size: 13px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #FF8F00;
  margin-bottom: 8px;
  border-bottom: 1px solid #5D4037;
  padding-bottom: 4px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.food-ring {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.ant-count {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid rgba(93, 64, 55, 0.3);
}

.ant-count-icon {
  margin-right: 6px;
}

.event-list {
  max-height: 160px;
  overflow-y: auto;
}

.event-item {
  padding: 4px 8px;
  border-left: 3px solid;
  margin-bottom: 4px;
  font-size: 11px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0 4px 4px 0;
}

.enemy-alert {
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid #F44336;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  animation: pulse 1.5s infinite;
  font-weight: bold;
  color: #F44336;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
