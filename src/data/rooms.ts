import type { RoomConfig } from '@/utils/constants'
import { RoomType, CellType } from '@/utils/constants'

export const ROOMS: RoomConfig[] = [
  {
    id: RoomType.FOOD_STORAGE_ROOM,
    name: '储藏室',
    description: '储存食物，增加食物容量上限',
    size: { width: 5, height: 4 },
    cost: { material: 20, food: 0 },
    unlockCondition: {},
    effects: { foodCapacity: 50 },
    cellType: CellType.FOOD_STORAGE,
  },
  {
    id: RoomType.NURSERY_ROOM,
    name: '育儿室',
    description: '为幼蚁提供温暖舒适的环境，加快繁殖速度',
    size: { width: 5, height: 4 },
    cost: { material: 30, food: 10 },
    unlockCondition: { antCount: 10 },
    effects: { reproductionBonus: 0.2 },
    cellType: CellType.NURSERY,
  },
  {
    id: RoomType.QUEEN_CHAMBER_ROOM,
    name: '王后室',
    description: '为蚁后提供安全舒适的产卵环境，大幅提高产卵速度',
    size: { width: 6, height: 5 },
    cost: { material: 60, food: 20 },
    unlockCondition: { antCount: 30 },
    effects: { reproductionBonus: 0.5 },
    cellType: CellType.QUEEN_CHAMBER,
  },
  {
    id: RoomType.WATER_RESERVOIR_ROOM,
    name: '蓄水池',
    description: '储存水分，增加水容量，提高抗旱能力',
    size: { width: 4, height: 4 },
    cost: { material: 35, food: 0 },
    unlockCondition: { antCount: 15 },
    effects: { waterCapacity: 30, diseaseResist: 0.5 },
    cellType: CellType.WATER_RESERVOIR,
  },
  {
    id: RoomType.BARRACKS_ROOM,
    name: '兵营',
    description: '训练兵蚁，提高攻击力和训练速度',
    size: { width: 5, height: 4 },
    cost: { material: 40, food: 15 },
    unlockCondition: { antCount: 15 },
    effects: { attackBonus: 0.1 },
    cellType: CellType.BARRACKS,
  },
  {
    id: RoomType.FUNGUS_FARM_ROOM,
    name: '真菌农场',
    description: '种植可食用真菌，稳定产出食物',
    size: { width: 6, height: 5 },
    cost: { material: 50, food: 25 },
    unlockCondition: { antCount: 20 },
    effects: { foodProduction: 0.02 },
    cellType: CellType.FUNGUS_FARM,
  },
]

export function getRoomConfig(id: RoomType): RoomConfig {
  const config = ROOMS.find((room) => room.id === id)
  if (!config) {
    throw new Error(`Room config not found for id: ${id}`)
  }
  return config
}

export function canUnlockRoom(roomId: RoomType, antCount: number, geneLevel: number): boolean {
  const config = getRoomConfig(roomId)
  const { antCount: requiredAntCount, geneLevel: requiredGeneLevel } = config.unlockCondition
  const meetsAntCount = requiredAntCount === undefined || antCount >= requiredAntCount
  const meetsGeneLevel = requiredGeneLevel === undefined || geneLevel >= requiredGeneLevel
  return meetsAntCount && meetsGeneLevel
}
