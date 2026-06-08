import type { DisasterConfig } from '@/utils/constants'
import { DisasterType, Season } from '@/utils/constants'

export const DISASTERS: DisasterConfig[] = [
  {
    id: DisasterType.FLOOD,
    name: '洪水',
    description: '暴雨引发洪水，淹没巢穴下层，造成蚂蚁溺亡和食物发霉',
    possibleSeasons: [Season.SPRING, Season.SUMMER],
    baseProbability: 0.15,
    duration: { min: 15000, max: 25000 },
    effects: { antDeathRate: 0.01, foodLossRate: 0.02, speedModifier: -0.5 },
    warnings: ['天空阴沉，暴雨将至...', '河水上涨，危险逼近!'],
  },
  {
    id: DisasterType.DROUGHT,
    name: '干旱',
    description: '持续高温少雨，水源枯竭，食物减产',
    possibleSeasons: [Season.SUMMER],
    baseProbability: 0.20,
    duration: { min: 20000, max: 30000 },
    effects: { waterLossRate: 0.03, foodLossRate: 0.01 },
    warnings: ['天气异常炎热...', '水源告急，做好抗旱准备!'],
  },
  {
    id: DisasterType.BLIZZARD,
    name: '暴风雪',
    description: '强寒潮来袭，温度骤降，蚂蚁活动受限',
    possibleSeasons: [Season.WINTER],
    baseProbability: 0.25,
    duration: { min: 12000, max: 20000 },
    effects: { speedModifier: -0.8, damageRate: 0.008 },
    warnings: ['气温骤降，寒潮将至...', '暴风雪预警，请储备足够食物!'],
  },
  {
    id: DisasterType.DISEASE,
    name: '疫病',
    description: '传染性疾病在蚁群中蔓延，不加干预可能团灭',
    possibleSeasons: [Season.SUMMER],
    baseProbability: 0.12,
    duration: { min: 25000, max: 35000 },
    effects: { infectionRate: 0.05, damageRate: 0.005 },
    warnings: ['有蚂蚁出现异常症状...', '疾病蔓延，请升级抗病基因!'],
  },
  {
    id: DisasterType.WILDFIRE,
    name: '野火',
    description: '草原野火蔓延，烧毁地面食物，烧死地表蚂蚁',
    possibleSeasons: [Season.SUMMER, Season.AUTUMN],
    baseProbability: 0.10,
    duration: { min: 10000, max: 18000 },
    effects: { antDeathRate: 0.02, foodLossRate: 0.04 },
    warnings: ['远处有烟雾升起...', '野火逼近，紧急撤离地下!'],
  },
]

export function getDisasterConfig(id: DisasterType): DisasterConfig {
  const config = DISASTERS.find((d) => d.id === id)
  if (!config) {
    throw new Error(`Disaster config not found for id: ${id}`)
  }
  return config
}
