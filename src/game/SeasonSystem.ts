import {
  Season,
  DisasterType,
  SEASON_DURATION,
  SEASON_TRANSITION_DURATION,
  DISASTER_WARNING_TIME,
  type SeasonState,
  type DisasterConfig,
} from '@/utils/constants'
import { DISASTERS, getDisasterConfig } from '@/data/disasters'
import { randomRange } from '@/utils/helpers'

class SeasonSystem {
  state: SeasonState
  seasonTimer: number = 0
  disasterDuration: number = 0

  constructor(initialSeason: Season = Season.SPRING) {
    this.state = {
      currentSeason: initialSeason,
      dayInSeason: 0,
      upcomingDisaster: DisasterType.NONE,
      disasterCountdown: 0,
      activeDisaster: DisasterType.NONE,
      disasterTimer: 0,
      transitionProgress: 0,
    }
  }

  update(
    dt: number
  ): { seasonChanged: boolean; disasterTriggered: boolean; disasterEnded: boolean } {
    const result = {
      seasonChanged: false,
      disasterTriggered: false,
      disasterEnded: false,
    }

    this.seasonTimer += dt
    this.state.dayInSeason += dt

    if (this.seasonTimer >= SEASON_DURATION) {
      const seasons = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER]
      const currentIndex = seasons.indexOf(this.state.currentSeason)
      this.state.currentSeason = seasons[(currentIndex + 1) % 4]
      this.seasonTimer = 0
      this.state.dayInSeason = 0
      this.rollForDisaster(this.state.currentSeason)
      result.seasonChanged = true
    }

    this.state.transitionProgress = Math.min(
      1,
      this.seasonTimer / SEASON_TRANSITION_DURATION
    )

    if (this.state.upcomingDisaster !== DisasterType.NONE) {
      this.state.disasterCountdown -= dt
      if (this.state.disasterCountdown <= 0) {
        this.startDisaster(this.state.upcomingDisaster)
        result.disasterTriggered = true
      }
    }

    if (this.state.activeDisaster !== DisasterType.NONE) {
      this.state.disasterTimer -= dt
      if (this.state.disasterTimer <= 0) {
        this.endDisaster()
        result.disasterEnded = true
      }
    }

    return result
  }

  rollForDisaster(season: Season): void {
    const possibleDisasters = DISASTERS.filter((d) =>
      d.possibleSeasons.includes(season)
    )

    for (const disaster of possibleDisasters) {
      if (Math.random() < disaster.baseProbability) {
        this.state.upcomingDisaster = disaster.id
        this.state.disasterCountdown = DISASTER_WARNING_TIME
        break
      }
    }
  }

  startDisaster(type: DisasterType): void {
    this.state.activeDisaster = type
    const config = getDisasterConfig(type)
    this.disasterDuration = randomRange(config.duration.min, config.duration.max)
    this.state.disasterTimer = this.disasterDuration
    this.state.upcomingDisaster = DisasterType.NONE
  }

  endDisaster(): void {
    this.state.activeDisaster = DisasterType.NONE
    this.state.disasterTimer = 0
  }

  getSeasonModifier(): {
    speedMod: number
    foodMod: number
    reproductionMod: number
    consumptionMod: number
  } {
    switch (this.state.currentSeason) {
      case Season.SPRING:
        return { speedMod: 0, foodMod: 0.2, reproductionMod: 0.3, consumptionMod: 0 }
      case Season.SUMMER:
        return { speedMod: 0.2, foodMod: -0.1, reproductionMod: 0, consumptionMod: 0 }
      case Season.AUTUMN:
        return { speedMod: 0, foodMod: 0.4, reproductionMod: 0.5, consumptionMod: 0 }
      case Season.WINTER:
        return { speedMod: -0.4, foodMod: 0, reproductionMod: 0, consumptionMod: -0.5 }
      default:
        return { speedMod: 0, foodMod: 0, reproductionMod: 0, consumptionMod: 0 }
    }
  }

  getActiveDisasterConfig(): DisasterConfig | null {
    if (this.state.activeDisaster === DisasterType.NONE) {
      return null
    }
    return getDisasterConfig(this.state.activeDisaster)
  }

  getSeasonName(): string {
    switch (this.state.currentSeason) {
      case Season.SPRING:
        return '春季'
      case Season.SUMMER:
        return '夏季'
      case Season.AUTUMN:
        return '秋季'
      case Season.WINTER:
        return '冬季'
      default:
        return ''
    }
  }

  getDisasterName(): string {
    const config = this.getActiveDisasterConfig()
    return config ? config.name : ''
  }

  getDaysRemaining(): number {
    const DAY_DURATION = (2 * Math.PI) / 0.0002
    const remainingMs = SEASON_DURATION - this.seasonTimer
    return Math.max(0, remainingMs / DAY_DURATION)
  }
}

export default SeasonSystem
