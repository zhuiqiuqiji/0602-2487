import { BiomeType, EnemyType, SURFACE_COLS, SURFACE_ROWS, CELL_SIZE, type FoodSource, type DisasterType } from '@/utils/constants'
import { BIOMES, getBiomeConfig } from '@/data/biomes'
import { generateId, randomRange, randomInt } from '@/utils/helpers'

export default class BiomeSystem {
  currentBiome: BiomeType
  foodSources: FoodSource[] = []

  constructor(biome: BiomeType = BiomeType.FOREST) {
    this.currentBiome = biome
  }

  generateFoodSources(count?: number): FoodSource[] {
    const biome = getBiomeConfig(this.currentBiome)
    const foodCount = count ?? randomInt(6, 10)
    const sources: FoodSource[] = []

    for (let i = 0; i < foodCount; i++) {
      const foodType = biome.foodTypes[randomInt(0, biome.foodTypes.length - 1)]
      
      let minAmount: number, maxAmount: number
      switch (foodType) {
        case 'leaf':
          minAmount = 15
          maxAmount = 25
          break
        case 'fruit':
          minAmount = 30
          maxAmount = 50
          break
        case 'insect':
          minAmount = 60
          maxAmount = 100
          break
        case 'seed':
          minAmount = 20
          maxAmount = 35
          break
        case 'nectar':
          minAmount = 25
          maxAmount = 45
          break
        case 'fungus':
          minAmount = 35
          maxAmount = 60
          break
      }

      const baseAmount = randomRange(minAmount, maxAmount)
      const amount = Math.floor(baseAmount * biome.foodAbundance)
      const maxAmountFinal = amount

      const edgeMargin = 3
      const x = randomInt(edgeMargin, SURFACE_COLS - edgeMargin - 1) * CELL_SIZE + CELL_SIZE / 2
      const y = randomInt(edgeMargin, SURFACE_ROWS - edgeMargin - 1) * CELL_SIZE + CELL_SIZE / 2

      sources.push({
        id: generateId(),
        x,
        y,
        type: foodType,
        amount,
        maxAmount: maxAmountFinal,
      })
    }

    this.foodSources = sources
    return sources
  }

  getEnemyPool(): EnemyType[] {
    const biome = getBiomeConfig(this.currentBiome)
    return biome.enemyTypes
  }

  getDisasterPool(): DisasterType[] {
    const biome = getBiomeConfig(this.currentBiome)
    return biome.possibleDisasters
  }

  getColors(): { surface: string; surfaceLight: string; accent: string } {
    const biome = getBiomeConfig(this.currentBiome)
    return biome.colors
  }

  getFoodAbundance(): number {
    const biome = getBiomeConfig(this.currentBiome)
    return biome.foodAbundance
  }

  getBiomeName(): string {
    const biome = getBiomeConfig(this.currentBiome)
    return biome.name
  }

  getBiomeDescription(): string {
    const biome = getBiomeConfig(this.currentBiome)
    return biome.description
  }

  changeBiome(newBiome: BiomeType): void {
    this.currentBiome = newBiome
    this.generateFoodSources()
  }

  spawnEnemy(): { type: EnemyType; x: number; y: number } {
    const enemyPool = this.getEnemyPool()
    const type = enemyPool[randomInt(0, enemyPool.length - 1)]

    const edge = randomInt(0, 3)
    let x: number, y: number

    switch (edge) {
      case 0:
        x = randomRange(0, SURFACE_COLS * CELL_SIZE)
        y = 0
        break
      case 1:
        x = SURFACE_COLS * CELL_SIZE
        y = randomRange(0, SURFACE_ROWS * CELL_SIZE)
        break
      case 2:
        x = randomRange(0, SURFACE_COLS * CELL_SIZE)
        y = SURFACE_ROWS * CELL_SIZE
        break
      default:
        x = 0
        y = randomRange(0, SURFACE_ROWS * CELL_SIZE)
        break
    }

    return { type, x, y }
  }

  replenishFoodSource(source: FoodSource): void {
    const abundance = this.getFoodAbundance()
    const replenishAmount = Math.floor(randomRange(5, 15) * abundance)
    source.amount = Math.min(source.amount + replenishAmount, source.maxAmount)
  }
}
