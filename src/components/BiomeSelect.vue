<template>
  <div class="biome-select-overlay">
    <div class="biome-select-container">
      <h1 class="title">🌍 选择生物群落</h1>
      <div class="biome-grid">
        <div
          v-for="biome in BIOMES"
          :key="biome.id"
          class="biome-card"
          :style="{ background: `linear-gradient(135deg, ${biome.colors.surface}, ${biome.colors.surfaceLight})` }"
          @click="handleSelectBiome(biome.id)"
        >
          <div class="biome-header">
            <h2 class="biome-name">{{ biome.name }}</h2>
          </div>
          <p class="biome-description">{{ biome.description }}</p>

          <div class="biome-stats">
            <div class="stat-row">
              <span class="stat-label">🍖 食物丰度</span>
              <div class="food-abundance">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="food-dot"
                  :class="{ active: i <= Math.round(biome.foodAbundance * 3) }"
                ></span>
              </div>
            </div>

            <div class="stat-row">
              <span class="stat-label">⚠️ 可能灾害</span>
              <div class="disaster-list">
                <span v-for="disaster in biome.possibleDisasters" :key="disaster" class="disaster-tag">
                  {{ getDisasterName(disaster) }}
                </span>
              </div>
            </div>

            <div class="stat-row">
              <span class="stat-label">👾 敌害类型</span>
              <div class="enemy-list">
                <span v-for="enemy in biome.enemyTypes" :key="enemy" class="enemy-tag">
                  {{ getEnemyName(enemy) }}
                </span>
              </div>
            </div>
          </div>

          <button class="select-btn" @click.stop="handleSelectBiome(biome.id)">
            选择
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BiomeType, EnemyType, DisasterType } from '@/utils/constants'
import { BIOMES } from '@/data/biomes'
import { useGameStore } from '@/stores/gameStore'
import { getDisasterConfig } from '@/data/disasters'

const store = useGameStore()

const enemyNames: Record<EnemyType, string> = {
  [EnemyType.SPIDER]: '蜘蛛',
  [EnemyType.RIVAL_ANT]: '敌对蚁群',
  [EnemyType.SCORPION]: '蝎子',
  [EnemyType.LIZARD]: '蜥蜴',
  [EnemyType.EATER]: '食蚁兽',
  [EnemyType.BIRD]: '鸟类',
  [EnemyType.ARMY_ANT]: '行军蚁',
  [EnemyType.PARASITE_WASP]: '寄生蜂',
  [EnemyType.BEETLE]: '甲虫',
}

function getEnemyName(type: EnemyType): string {
  return enemyNames[type] ?? type
}

function getDisasterName(type: DisasterType): string {
  if (type === DisasterType.NONE) return ''
  const config = getDisasterConfig(type)
  return config.name
}

function handleSelectBiome(biome: BiomeType) {
  store.startGame(biome)
}
</script>

<style scoped>
.biome-select-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: 'Noto Sans SC';
}

.biome-select-container {
  text-align: center;
  max-width: 1200px;
  padding: 20px;
}

.title {
  font-size: 36px;
  color: #FF8F00;
  margin-bottom: 30px;
  font-weight: bold;
}

.biome-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
}

.biome-card {
  width: 260px;
  height: 340px;
  border-radius: 16px;
  margin: 16px;
  padding: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.biome-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 0;
}

.biome-card > * {
  position: relative;
  z-index: 1;
}

.biome-card:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
}

.biome-header {
  margin-bottom: 12px;
}

.biome-name {
  font-size: 22px;
  font-weight: bold;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.biome-description {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  flex: 0 0 auto;
}

.biome-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 11px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.food-abundance {
  display: flex;
  gap: 4px;
}

.food-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.food-dot.active {
  background: #FFC107;
  border-color: #FFD54F;
  box-shadow: 0 0 8px rgba(255, 193, 7, 0.6);
}

.disaster-list,
.enemy-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.disaster-tag,
.enemy-tag {
  font-size: 10px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  backdrop-filter: blur(4px);
}

.select-btn {
  width: 100%;
  padding: 12px;
  background: #FF8F00;
  color: #3E2723;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-btn:hover {
  background: #FFA726;
  transform: scale(1.02);
}
</style>
