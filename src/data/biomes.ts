import { BiomeType, EnemyType, DisasterType, type BiomeConfig } from '@/utils/constants'

export const BIOMES: BiomeConfig[] = [
  {
    id: BiomeType.FOREST,
    name: '温带森林',
    description: '气候温和湿润，四季分明，食物资源丰富，但雨季需防范洪水。',
    foodAbundance: 1.2,
    enemyTypes: [EnemyType.SPIDER, EnemyType.BEETLE, EnemyType.BIRD],
    possibleDisasters: [DisasterType.FLOOD, DisasterType.DISEASE],
    colors: { surface: '#2E7D32', surfaceLight: '#388E3C', accent: '#66BB6A' },
    foodTypes: ['leaf', 'fruit', 'insect', 'fungus'],
  },
  {
    id: BiomeType.DESERT,
    name: '热带沙漠',
    description: '干旱少雨，昼夜温差大，食物稀少，但外敌也较少。',
    foodAbundance: 0.6,
    enemyTypes: [EnemyType.SCORPION, EnemyType.LIZARD],
    possibleDisasters: [DisasterType.DROUGHT],
    colors: { surface: '#F9A825', surfaceLight: '#FBC02D', accent: '#FFD54F' },
    foodTypes: ['seed', 'insect'],
  },
  {
    id: BiomeType.GRASSLAND,
    name: '广袤草原',
    description: '季节性明显，视野开阔，适合大规模蚁群，但冬季严寒。',
    foodAbundance: 0.9,
    enemyTypes: [EnemyType.EATER, EnemyType.BIRD, EnemyType.BEETLE],
    possibleDisasters: [DisasterType.BLIZZARD, DisasterType.WILDFIRE],
    colors: { surface: '#8BC34A', surfaceLight: '#9CCC65', accent: '#CDDC39' },
    foodTypes: ['seed', 'leaf', 'insect', 'fruit'],
  },
  {
    id: BiomeType.RAINFOREST,
    name: '热带雨林',
    description: '高温高湿，食物极其丰富，但疾病多发，竞争激烈。',
    foodAbundance: 1.5,
    enemyTypes: [EnemyType.ARMY_ANT, EnemyType.PARASITE_WASP, EnemyType.SPIDER, EnemyType.LIZARD],
    possibleDisasters: [DisasterType.DISEASE, DisasterType.FLOOD],
    colors: { surface: '#00695C', surfaceLight: '#00796B', accent: '#26A69A' },
    foodTypes: ['fruit', 'insect', 'nectar', 'fungus', 'leaf'],
  },
]

export function getBiomeConfig(id: BiomeType): BiomeConfig {
  const biome = BIOMES.find((b) => b.id === id)
  if (!biome) {
    throw new Error(`Biome config not found for id: ${id}`)
  }
  return biome
}
