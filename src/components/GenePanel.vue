<template>
  <div class="gene-panel">
    <div class="panel-title">🧬 基因进化</div>

    <div class="gene-points-display">
      <span class="points-label">基因点数</span>
      <span class="points-value">{{ geneStats.genePoints }}</span>
    </div>

    <div class="gene-list">
      <div v-for="gene in genes" :key="gene.type" class="gene-row">
        <div class="gene-info">
          <span class="gene-icon">{{ gene.icon }}</span>
          <span class="gene-name">{{ gene.name }}</span>
        </div>
        <div class="gene-progress-wrapper">
          <div class="gene-progress-bar">
            <div
              class="gene-progress-fill"
              :style="{ width: `${(getGeneLevel(gene.type) / MAX_LEVEL) * 100}%` }"
            ></div>
          </div>
          <span class="gene-level">Lv.{{ getGeneLevel(gene.type) }}/{{ MAX_LEVEL }}</span>
        </div>
        <div class="gene-cost">
          <span v-if="!isMaxLevel(gene.type)">
            🍖 {{ getUpgradeCost(gene.type).food }} 🧱 {{ getUpgradeCost(gene.type).material }}
          </span>
          <span v-else class="max-level">MAX</span>
        </div>
        <button
          v-if="!isMaxLevel(gene.type)"
          class="upgrade-btn"
          :disabled="!canAffordUpgrade(gene.type)"
          @click="handleUpgrade(gene.type)"
        >
          升级
        </button>
      </div>
    </div>

    <div class="radar-chart">
      <svg viewBox="0 0 200 200" class="radar-svg">
        <polygon
          :points="radarOutlinePoints"
          fill="none"
          stroke="#5D4037"
          stroke-width="1"
        />
        <polygon
          :points="radarDataPoints"
          fill="rgba(255, 143, 0, 0.3)"
          stroke="#FF8F00"
          stroke-width="2"
        />
        <circle v-for="(point, index) in radarDataPointsArray" :key="index"
          :cx="point.x" :cy="point.y" r="4"
          fill="#FF8F00"
        />
        <text v-for="(gene, index) in genes" :key="`label-${index}`"
          :x="radarLabelPositions[index].x"
          :y="radarLabelPositions[index].y"
          text-anchor="middle"
          fill="#D7CCC8"
          font-size="10"
        >
          {{ gene.icon }}
        </text>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { GeneType, GENE_LEVEL_MAX, type GeneStats } from '@/utils/constants'
import { useGameStore } from '@/stores/gameStore'

const store = useGameStore()
const MAX_LEVEL = GENE_LEVEL_MAX

const genes = [
  { type: GeneType.SPEED, name: '速度基因', icon: '⚡' },
  { type: GeneType.STRENGTH, name: '力量基因', icon: '💪' },
  { type: GeneType.DISEASE_RESIST, name: '抗病基因', icon: '🛡️' },
  { type: GeneType.CAPACITY, name: '容量基因', icon: '📦' },
  { type: GeneType.REPRODUCTION, name: '繁殖基因', icon: '👑' },
]

const geneStats = computed<GeneStats>(() => store.getGeneStats())

function getGeneLevel(geneType: GeneType): number {
  const geneMap: Record<GeneType, keyof GeneStats> = {
    [GeneType.SPEED]: 'speed',
    [GeneType.STRENGTH]: 'strength',
    [GeneType.DISEASE_RESIST]: 'diseaseResist',
    [GeneType.CAPACITY]: 'capacity',
    [GeneType.REPRODUCTION]: 'reproduction',
  }
  return geneStats.value[geneMap[geneType]] as number
}

function isMaxLevel(geneType: GeneType): boolean {
  return getGeneLevel(geneType) >= MAX_LEVEL
}

function getUpgradeCost(geneType: GeneType): { food: number; material: number } {
  const currentLevel = getGeneLevel(geneType)
  const food = 20 * (currentLevel + 1)
  const material = Math.floor(food * 0.3)
  return { food, material }
}

function canAffordUpgrade(geneType: GeneType): boolean {
  if (isMaxLevel(geneType)) return false
  const cost = getUpgradeCost(geneType)
  return store.food >= cost.food && store.material >= cost.material
}

function handleUpgrade(geneType: GeneType) {
  store.upgradeGene(geneType)
}

const radarDataPointsArray = computed(() => {
  const centerX = 100
  const centerY = 100
  const maxRadius = 70
  return genes.map((gene, index) => {
    const angle = (Math.PI * 2 * index) / genes.length - Math.PI / 2
    const level = getGeneLevel(gene.type)
    const radius = (level / MAX_LEVEL) * maxRadius
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  })
})

const radarDataPoints = computed(() => {
  return radarDataPointsArray.value.map((p) => `${p.x},${p.y}`).join(' ')
})

const radarOutlinePoints = computed(() => {
  const centerX = 100
  const centerY = 100
  const maxRadius = 70
  return genes
    .map((_, index) => {
      const angle = (Math.PI * 2 * index) / genes.length - Math.PI / 2
      const x = centerX + Math.cos(angle) * maxRadius
      const y = centerY + Math.sin(angle) * maxRadius
      return `${x},${y}`
    })
    .join(' ')
})

const radarLabelPositions = computed(() => {
  const centerX = 100
  const centerY = 100
  const labelRadius = 90
  return genes.map((_, index) => {
    const angle = (Math.PI * 2 * index) / genes.length - Math.PI / 2
    return {
      x: centerX + Math.cos(angle) * labelRadius,
      y: centerY + Math.sin(angle) * labelRadius + 4,
    }
  })
})
</script>

<style scoped>
.gene-panel {
  background: #3E2723;
  border-radius: 12px;
  padding: 16px;
  width: 320px;
  color: #D7CCC8;
  font-family: 'Noto Sans SC';
}

.panel-title {
  font-size: 18px;
  font-weight: bold;
  color: #FF8F00;
  margin-bottom: 12px;
  text-align: center;
}

.gene-points-display {
  background: #2C1810;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.points-label {
  font-size: 14px;
  color: #A1887F;
}

.points-value {
  font-size: 24px;
  font-weight: bold;
  color: #FF8F00;
}

.gene-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.gene-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: #2C1810;
  padding: 8px;
  border-radius: 8px;
}

.gene-info {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 90px;
}

.gene-icon {
  font-size: 16px;
}

.gene-name {
  font-size: 12px;
}

.gene-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.gene-progress-bar {
  flex: 1;
  height: 8px;
  background: #1A0E08;
  border-radius: 4px;
  overflow: hidden;
}

.gene-progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.gene-level {
  font-size: 10px;
  color: #A1887F;
  min-width: 40px;
  text-align: right;
}

.gene-cost {
  font-size: 10px;
  color: #A1887F;
  min-width: 80px;
  text-align: center;
}

.max-level {
  color: #4CAF50;
  font-weight: bold;
}

.upgrade-btn {
  background: #FF8F00;
  color: #3E2723;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 50px;
}

.upgrade-btn:hover:not(:disabled) {
  background: #FFA726;
  transform: scale(1.05);
}

.upgrade-btn:disabled {
  background: #5D4037;
  color: #8D6E63;
  cursor: not-allowed;
}

.radar-chart {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.radar-svg {
  width: 180px;
  height: 180px;
}
</style>
