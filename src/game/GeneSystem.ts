import type { GeneStats } from '@/utils/constants'
import {
  GeneType,
  GENE_LEVEL_MAX,
  GENE_UPGRADE_COST_BASE,
  GENE_POINTS_PER_HATCH,
  INITIAL_GENE_SPEED,
  INITIAL_GENE_STRENGTH,
  INITIAL_GENE_DISEASE_RESIST,
  INITIAL_GENE_CAPACITY,
  INITIAL_GENE_REPRODUCTION,
} from '@/utils/constants'

export default class GeneSystem {
  stats: GeneStats

  constructor() {
    this.stats = {
      speed: INITIAL_GENE_SPEED,
      strength: INITIAL_GENE_STRENGTH,
      diseaseResist: INITIAL_GENE_DISEASE_RESIST,
      capacity: INITIAL_GENE_CAPACITY,
      reproduction: INITIAL_GENE_REPRODUCTION,
      genePoints: 0,
    }
  }

  addGenePoints(amount: number = GENE_POINTS_PER_HATCH): void {
    this.stats.genePoints += amount
  }

  upgradeGene(
    geneType: GeneType,
    currentFood: number,
    currentMaterial: number
  ): {
    success: boolean
    cost: { food: number; material: number }
    message: string
  } {
    const currentLevel = this.getGeneLevel(geneType)

    if (currentLevel >= GENE_LEVEL_MAX) {
      return {
        success: false,
        cost: { food: 0, material: 0 },
        message: `${this.getGeneName(geneType)}已达到最高等级`,
      }
    }

    const cost = this.getUpgradeCost(geneType)

    if (currentFood < cost.food) {
      return {
        success: false,
        cost,
        message: `食物不足，需要 ${cost.food}`,
      }
    }

    if (currentMaterial < cost.material) {
      return {
        success: false,
        cost,
        message: `材料不足，需要 ${cost.material}`,
      }
    }

    const geneMap: Record<GeneType, keyof GeneStats> = {
      [GeneType.SPEED]: 'speed',
      [GeneType.STRENGTH]: 'strength',
      [GeneType.DISEASE_RESIST]: 'diseaseResist',
      [GeneType.CAPACITY]: 'capacity',
      [GeneType.REPRODUCTION]: 'reproduction',
    }

    const key = geneMap[geneType]
    this.stats[key]++

    return {
      success: true,
      cost,
      message: `${this.getGeneName(geneType)}升级到 Lv.${currentLevel + 1}`,
    }
  }

  getUpgradeCost(geneType: GeneType): { food: number; material: number } {
    const currentLevel = this.getGeneLevel(geneType)
    const food = GENE_UPGRADE_COST_BASE * (currentLevel + 1)
    const material = Math.floor(food * 0.3)
    return { food, material }
  }

  getGeneLevel(geneType: GeneType): number {
    const geneMap: Record<GeneType, keyof GeneStats> = {
      [GeneType.SPEED]: 'speed',
      [GeneType.STRENGTH]: 'strength',
      [GeneType.DISEASE_RESIST]: 'diseaseResist',
      [GeneType.CAPACITY]: 'capacity',
      [GeneType.REPRODUCTION]: 'reproduction',
    }
    return this.stats[geneMap[geneType]]
  }

  getGeneBonus(geneType: GeneType): number {
    const level = this.getGeneLevel(geneType)
    if (geneType === GeneType.DISEASE_RESIST) {
      return 1 + (level - 1) * 0.2
    }
    return 1 + (level - 1) * 0.1
  }

  getCombinedSpeedBonus(): number {
    return 1 + (this.stats.speed - 1) * 0.1
  }

  getCombinedStrengthBonus(): number {
    return 1 + (this.stats.strength - 1) * 0.15
  }

  getCombinedDiseaseBonus(): number {
    return 1 + (this.stats.diseaseResist - 1) * 0.2
  }

  getCombinedCapacityBonus(): number {
    return 1 + (this.stats.capacity - 1) * 0.1
  }

  getCombinedReproductionBonus(): number {
    return 1 + (this.stats.reproduction - 1) * 0.15
  }

  getAntStats(
    baseSpeed: number,
    baseAttack: number,
    baseHealth: number,
    baseCapacity: number
  ): { speed: number; attack: number; health: number; capacity: number } {
    return {
      speed: baseSpeed * this.getCombinedSpeedBonus(),
      attack: baseAttack * this.getCombinedStrengthBonus(),
      health: baseHealth * this.getCombinedStrengthBonus(),
      capacity: baseCapacity * this.getCombinedCapacityBonus(),
    }
  }

  canAffordUpgrade(geneType: GeneType, food: number, material: number): boolean {
    const cost = this.getUpgradeCost(geneType)
    return food >= cost.food && material >= cost.material
  }

  getMaxLevel(): number {
    return GENE_LEVEL_MAX
  }

  isMaxLevel(geneType: GeneType): boolean {
    return this.getGeneLevel(geneType) >= GENE_LEVEL_MAX
  }

  getTotalGeneBonus(): number {
    return (
      (this.stats.speed - 1) +
      (this.stats.strength - 1) +
      (this.stats.diseaseResist - 1) +
      (this.stats.capacity - 1) +
      (this.stats.reproduction - 1)
    )
  }

  getGeneName(geneType: GeneType): string {
    const names: Record<GeneType, string> = {
      [GeneType.SPEED]: '速度基因',
      [GeneType.STRENGTH]: '力量基因',
      [GeneType.DISEASE_RESIST]: '抗病基因',
      [GeneType.CAPACITY]: '容量基因',
      [GeneType.REPRODUCTION]: '繁殖基因',
    }
    return names[geneType]
  }

  getGeneDescription(geneType: GeneType): string {
    const descriptions: Record<GeneType, string> = {
      [GeneType.SPEED]: '提升蚂蚁移动速度，每级+10%',
      [GeneType.STRENGTH]: '提升蚂蚁攻击力和生命值，每级+15%',
      [GeneType.DISEASE_RESIST]: '提升蚂蚁对疾病的抵抗力，每级+20%',
      [GeneType.CAPACITY]: '提升蚂蚁携带资源容量，每级+10%',
      [GeneType.REPRODUCTION]: '提升蚁后繁殖效率，每级+15%',
    }
    return descriptions[geneType]
  }
}
