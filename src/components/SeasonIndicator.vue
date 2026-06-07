<template>
  <div class="season-indicator">
    <div class="season-icon-wrapper">
      <span class="season-icon">{{ seasonIcon }}</span>
    </div>
    <div class="season-name">{{ seasonName }}</div>
    <div class="days-remaining">剩余 {{ daysRemaining }} 天</div>

    <div v-if="hasUpcomingDisaster" class="disaster-warning">
      <span class="warning-icon">⚠️</span>
      <span class="warning-text">{{ upcomingDisasterName }}</span>
      <span class="countdown">{{ formattedCountdown }}</span>
    </div>

    <div v-if="hasActiveDisaster" class="disaster-active">
      <span class="active-icon">🔥</span>
      <span class="active-text">{{ activeDisasterName }}</span>
    </div>

    <div class="modifiers">
      <div class="modifier-item">
        <span>🍖 食物</span>
        <span :class="modifierClass(seasonModifiers.foodMod)">
          {{ formatModifier(seasonModifiers.foodMod) }}
        </span>
      </div>
      <div class="modifier-item">
        <span>⚡ 速度</span>
        <span :class="modifierClass(seasonModifiers.speedMod)">
          {{ formatModifier(seasonModifiers.speedMod) }}
        </span>
      </div>
      <div class="modifier-item">
        <span>👑 繁殖</span>
        <span :class="modifierClass(seasonModifiers.reproductionMod)">
          {{ formatModifier(seasonModifiers.reproductionMod) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { Season, DisasterType } from '@/utils/constants'
import { getDisasterConfig } from '@/data/disasters'

const store = useGameStore()

const seasonIcon = computed(() => {
  const icons: Record<Season, string> = {
    [Season.SPRING]: '🌸',
    [Season.SUMMER]: '☀️',
    [Season.AUTUMN]: '🍂',
    [Season.WINTER]: '❄️',
  }
  return icons[store.seasonState.currentSeason] ?? '🌸'
})

const seasonName = computed(() => {
  const names: Record<Season, string> = {
    [Season.SPRING]: '春季',
    [Season.SUMMER]: '夏季',
    [Season.AUTUMN]: '秋季',
    [Season.WINTER]: '冬季',
  }
  return names[store.seasonState.currentSeason] ?? '春季'
})

const daysRemaining = computed(() => {
  const totalDays = 30
  const elapsed = Math.floor(store.seasonState.dayInSeason / 4000)
  return Math.max(0, totalDays - elapsed)
})

const hasUpcomingDisaster = computed(() => {
  return store.seasonState.upcomingDisaster !== DisasterType.NONE
})

const upcomingDisasterName = computed(() => {
  if (!hasUpcomingDisaster.value) return ''
  const config = getDisasterConfig(store.seasonState.upcomingDisaster)
  return config.name
})

const formattedCountdown = computed(() => {
  const seconds = Math.ceil(store.seasonState.disasterCountdown / 1000)
  return `${seconds}s`
})

const hasActiveDisaster = computed(() => {
  return store.seasonState.activeDisaster !== DisasterType.NONE
})

const activeDisasterName = computed(() => {
  if (!hasActiveDisaster.value) return ''
  const config = getDisasterConfig(store.seasonState.activeDisaster)
  return config.name
})

const seasonModifiers = computed(() => store.seasonModifiers)

function formatModifier(value: number): string {
  const percent = Math.round(value * 100)
  return percent >= 0 ? `+${percent}%` : `${percent}%`
}

function modifierClass(value: number): string {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}
</script>

<style scoped>
.season-indicator {
  background: #2C1810;
  border: 1px solid #FF8F00;
  border-radius: 12px;
  padding: 12px;
  min-width: 180px;
  color: #D7CCC8;
  font-family: 'Noto Sans SC';
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.season-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 143, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #FF8F00;
}

.season-icon {
  font-size: 32px;
}

.season-name {
  font-size: 16px;
  font-weight: bold;
  color: #FF8F00;
}

.days-remaining {
  font-size: 12px;
  color: #A1887F;
}

.disaster-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(244, 67, 54, 0.2);
  border: 1px solid #F44336;
  border-radius: 8px;
  padding: 6px 10px;
  width: 100%;
  justify-content: center;
  animation: pulse 1s infinite;
}

.warning-icon {
  font-size: 14px;
}

.warning-text {
  font-size: 12px;
  color: #F44336;
  font-weight: bold;
}

.countdown {
  font-size: 12px;
  color: #FF5722;
  font-weight: bold;
}

.disaster-active {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 87, 34, 0.3);
  border: 1px solid #FF5722;
  border-radius: 8px;
  padding: 6px 10px;
  width: 100%;
  justify-content: center;
}

.active-icon {
  font-size: 14px;
  animation: spin 2s linear infinite;
}

.active-text {
  font-size: 12px;
  color: #FF5722;
  font-weight: bold;
}

.modifiers {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 143, 0, 0.2);
}

.modifier-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.positive {
  color: #4CAF50;
  font-weight: bold;
}

.negative {
  color: #F44336;
  font-weight: bold;
}

.neutral {
  color: #A1887F;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
