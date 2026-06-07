import type { Ant, Enemy, BattleState, ColonyStatus } from '@/utils/constants'
import { AntType, AntState } from '@/utils/constants'
import { distance, generateId } from '@/utils/helpers'

export default class BattleSystem {
  state: BattleState
  player1ColonyId: string
  player2ColonyId: string
  battleActive: boolean = false
  turnTimer: number = 0

  constructor(player1Id: string = 'player1', player2Id: string = 'player2') {
    this.player1ColonyId = player1Id
    this.player2ColonyId = player2Id
    this.state = {
      player1Colony: player1Id,
      player2Colony: player2Id,
      currentTurn: 1,
      turnTimer: 0,
      turnDuration: 30000,
      territory: new Map(),
      winner: null,
    }
  }

  startBattle(): void {
    this.battleActive = true
    const gridSize = 20
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`
        if (x < gridSize / 2) {
          this.state.territory.set(key, 1)
        } else {
          this.state.territory.set(key, 2)
        }
      }
    }
  }

  update(
    dt: number,
    player1Ants: Ant[],
    player2Ants: Ant[],
    player1Queen: Ant | undefined,
    player2Queen: Ant | undefined,
  ): void {
    if (!this.battleActive || this.state.winner) return

    this.turnTimer += dt
    this.state.turnTimer = this.turnTimer

    if (this.turnTimer >= this.state.turnDuration) {
      this.state.currentTurn = this.state.currentTurn === 1 ? 2 : 1
      this.turnTimer = 0
      this.state.turnTimer = 0
    }

    this.updateTerritory(player1Ants, player2Ants)

    if (!player1Queen || player1Queen.health <= 0) {
      this.endBattle(this.player2ColonyId)
    } else if (!player2Queen || player2Queen.health <= 0) {
      this.endBattle(this.player1ColonyId)
    }
  }

  updateTerritory(player1Ants: Ant[], player2Ants: Ant[]): void {
    const gridSize = 20
    const influenceRadius = 3
    const influenceGrid: number[][] = []

    for (let x = 0; x < gridSize; x++) {
      influenceGrid[x] = []
      for (let y = 0; y < gridSize; y++) {
        influenceGrid[x][y] = 0
      }
    }

    const scaleFactor = gridSize / 100

    for (const ant of player1Ants) {
      const gx = Math.floor(ant.x * scaleFactor)
      const gy = Math.floor(ant.y * scaleFactor)
      for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
        for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
          const nx = gx + dx
          const ny = gy + dy
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist <= influenceRadius) {
              const influence = 1 - dist / influenceRadius
              influenceGrid[nx][ny] += influence
            }
          }
        }
      }
    }

    for (const ant of player2Ants) {
      const gx = Math.floor(ant.x * scaleFactor)
      const gy = Math.floor(ant.y * scaleFactor)
      for (let dx = -influenceRadius; dx <= influenceRadius; dx++) {
        for (let dy = -influenceRadius; dy <= influenceRadius; dy++) {
          const nx = gx + dx
          const ny = gy + dy
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist <= influenceRadius) {
              const influence = 1 - dist / influenceRadius
              influenceGrid[nx][ny] -= influence
            }
          }
        }
      }
    }

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const key = `${x},${y}`
        const influence = influenceGrid[x][y]
        if (influence > 0.1) {
          this.state.territory.set(key, 1)
        } else if (influence < -0.1) {
          this.state.territory.set(key, 2)
        }
      }
    }
  }

  getPlayerAnts(allAnts: Ant[], playerId: string): Ant[] {
    return allAnts.filter((ant) => ant.ownerColony === playerId)
  }

  getCurrentPlayerId(): string {
    return this.state.currentTurn === 1 ? this.player1ColonyId : this.player2ColonyId
  }

  getCurrentTurn(): number {
    return this.state.currentTurn
  }

  getTurnTimeRemaining(): number {
    return this.state.turnDuration - this.turnTimer
  }

  getWinner(): string | null {
    return this.state.winner
  }

  getTerritoryScore(playerId: string): number {
    const playerNumber = playerId === this.player1ColonyId ? 1 : 2
    let count = 0
    for (const owner of this.state.territory.values()) {
      if (owner === playerNumber) {
        count++
      }
    }
    return count
  }

  getAntCount(playerId: string, ants: Ant[]): number {
    return ants.filter((ant) => ant.ownerColony === playerId && ant.health > 0).length
  }

  isPlayerTurn(playerId: string): boolean {
    return this.getCurrentPlayerId() === playerId
  }

  sendRaid(
    attackerPlayerId: string,
    targetPlayerId: string,
    ants: Ant[],
    targetX: number,
    targetY: number,
  ): void {
    const soldierAnts = ants.filter(
      (ant) => ant.ownerColony === attackerPlayerId && ant.type === AntType.SOLDIER && ant.health > 0,
    )
    for (const ant of soldierAnts) {
      ant.state = AntState.RAIDING
      ant.targetX = targetX
      ant.targetY = targetY
      ant.targetId = targetPlayerId
    }
  }

  sendScout(playerId: string, ants: Ant[], targetX: number, targetY: number): void {
    const workerAnt = ants.find(
      (ant) => ant.ownerColony === playerId && ant.type === AntType.WORKER && ant.health > 0,
    )
    if (workerAnt) {
      workerAnt.state = AntState.SCOUTING
      workerAnt.targetX = targetX
      workerAnt.targetY = targetY
    }
  }

  endBattle(winnerId: string): void {
    this.state.winner = winnerId
    this.battleActive = false
  }

  isBattleActive(): boolean {
    return this.battleActive
  }

  getBattleStatus(player1Ants: Ant[], player2Ants: Ant[]): {
    turn: number
    currentPlayer: string
    timeRemaining: number
    winner: string | null
    p1Territory: number
    p2Territory: number
    p1Ants: number
    p2Ants: number
  } {
    return {
      turn: this.state.currentTurn,
      currentPlayer: this.getCurrentPlayerId(),
      timeRemaining: this.getTurnTimeRemaining(),
      winner: this.state.winner,
      p1Territory: this.getTerritoryScore(this.player1ColonyId),
      p2Territory: this.getTerritoryScore(this.player2ColonyId),
      p1Ants: this.getAntCount(this.player1ColonyId, player1Ants),
      p2Ants: this.getAntCount(this.player2ColonyId, player2Ants),
    }
  }
}
