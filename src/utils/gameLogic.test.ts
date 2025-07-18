import { describe, it, expect, beforeEach } from 'vitest'
import {
  createTileBag,
  createPlayerBoard,
  initializeGame,
  getAccessibleBands,
  canBandAcceptTiles,
  executeDraftAction,
  executeResetAction,
  calculateBandScore,
  isRoundOver,
  isGameOver,
  calculateEndGameBonus,
  prepareNextRound
} from './gameLogic'
import type { GameState, TileColor, Tile, DraftAction } from '../types/game'

describe('Game Logic - Core Mechanics', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = initializeGame()
  })

  describe('Game Initialization', () => {
    it('should create a complete tile bag with correct distribution', () => {
      const tileBag = createTileBag()
      expect(tileBag).toHaveLength(132) // 6 colors × 22 tiles each

      const colorCounts = tileBag.reduce((counts, tile) => {
        counts[tile.color] = (counts[tile.color] || 0) + 1
        return counts
      }, {} as Record<TileColor, number>)

      Object.values(colorCounts).forEach(count => {
        expect(count).toBe(22)
      })
    })

    it('should initialize game with correct starting state', () => {
      expect(gameState.currentPlayer).toBe('human')
      expect(gameState.round).toBe(1)
      expect(gameState.factories).toHaveLength(5)
      expect(gameState.roundTiles).toHaveLength(6)
      expect(gameState.humanBoard.glazierPosition).toBe(1)
      expect(gameState.aiBoard.glazierPosition).toBe(1)
      expect(gameState.humanBoard.patternBands).toHaveLength(8)
      expect(gameState.isFirstPlayerTaken).toBe(false)
    })

    it('should fill factories with 4 tiles each', () => {
      gameState.factories.forEach(factory => {
        expect(factory.tiles).toHaveLength(4)
      })
    })

    it('should create player boards with correct pattern bands', () => {
      const board = createPlayerBoard('test')
      expect(board.patternBands).toHaveLength(8)

      board.patternBands.forEach((band, index) => {
        expect(band.column).toBe(index + 1)
        expect(band.maxCapacity).toBe(5)
        expect(band.isCompleted).toBe(false)
        expect(band.isFirstSide).toBe(true)
        expect(band.isRemoved).toBe(false)
        expect(band.tiles).toHaveLength(0)
      })
    })
  })

  describe('Glazier and Band Access', () => {
    it('should return correct accessible bands based on glazier position', () => {
      const board = gameState.humanBoard
      board.glazierPosition = 3

      const accessibleBands = getAccessibleBands(board)
      expect(accessibleBands).toHaveLength(6) // columns 3-8
      expect(accessibleBands.every(band => band.column >= 3)).toBe(true)
    })

    it('should exclude removed bands from accessible bands', () => {
      const board = gameState.humanBoard
      board.glazierPosition = 1
      board.patternBands[2].isRemoved = true // column 3

      const accessibleBands = getAccessibleBands(board)
      expect(accessibleBands).toHaveLength(7) // columns 1,2,4,5,6,7,8
      expect(accessibleBands.find(band => band.column === 3)).toBeUndefined()
    })
  })

  describe('Band Tile Acceptance Rules', () => {
    it('should accept tiles in empty band', () => {
      const band = gameState.humanBoard.patternBands[0]
      expect(canBandAcceptTiles(band, 'blue', 3)).toBe(true)
    })

    it('should accept same color tiles in occupied band', () => {
      const band = gameState.humanBoard.patternBands[0]
      band.tiles = [{ id: '1', color: 'blue' }, { id: '2', color: 'blue' }]

      expect(canBandAcceptTiles(band, 'blue', 2)).toBe(true)
      expect(canBandAcceptTiles(band, 'red', 1)).toBe(false)
    })

    it('should reject tiles exceeding band capacity', () => {
      const band = gameState.humanBoard.patternBands[0]
      band.tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' }
      ]

      expect(canBandAcceptTiles(band, 'blue', 3)).toBe(false)
      expect(canBandAcceptTiles(band, 'blue', 2)).toBe(true)
    })

    it('should reject tiles for completed or removed bands', () => {
      const band = gameState.humanBoard.patternBands[0]
      band.isCompleted = true
      expect(canBandAcceptTiles(band, 'blue', 1)).toBe(false)

      band.isCompleted = false
      band.isRemoved = true
      expect(canBandAcceptTiles(band, 'blue', 1)).toBe(false)
    })
  })

  describe('Draft Actions - Factory Source', () => {
    it('should execute factory draft action correctly', () => {
      // Setup factory with specific tiles
      const factory = gameState.factories[0]
      const blueTiles: Tile[] = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' }
      ]
      factory.tiles = [
        ...blueTiles,
        { id: '3', color: 'red' },
        { id: '4', color: 'yellow' }
      ]

      const action: DraftAction = {
        type: 'draft',
        source: { type: 'factory', id: 0 },
        color: 'blue',
        tiles: blueTiles,
        targetBand: 2
      }

      const newState = executeDraftAction(gameState, action)

      // Check tiles placed correctly
      const targetBand = newState.humanBoard.patternBands[1] // column 2
      expect(targetBand.tiles).toHaveLength(2)
      expect(targetBand.tiles.every(tile => tile.color === 'blue')).toBe(true)

      // Check glazier moved
      expect(newState.humanBoard.glazierPosition).toBe(2)

      // Check remaining tiles moved to center
      expect(newState.centerTiles).toHaveLength(2)
      expect(newState.centerTiles.some(tile => tile.color === 'red')).toBe(true)
      expect(newState.centerTiles.some(tile => tile.color === 'yellow')).toBe(true)

      // Check factory is empty
      expect(newState.factories[0].tiles).toHaveLength(0)
    })

    it('should handle excess tiles correctly', () => {
      const factory = gameState.factories[0]
      const blueTiles: Tile[] = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' },
        { id: '4', color: 'blue' }
      ]
      factory.tiles = blueTiles

      // Fill target band to near capacity
      const targetBand = gameState.humanBoard.patternBands[1]
      targetBand.tiles = [
        { id: '5', color: 'blue' },
        { id: '6', color: 'blue' },
        { id: '7', color: 'blue' }
      ]

      const action: DraftAction = {
        type: 'draft',
        source: { type: 'factory', id: 0 },
        color: 'blue',
        tiles: blueTiles,
        targetBand: 2
      }

      const newState = executeDraftAction(gameState, action)

      // Should place only 2 tiles (to reach capacity of 5)
      expect(newState.humanBoard.patternBands[1].tiles).toHaveLength(0) // Band is completed, should be empty

      // Should add broken glass penalty for 2 excess tiles
      expect(newState.humanBoard.brokenGlass).toBe(2)

      // Excess tiles should go to discard tower
      expect(newState.discardTower).toHaveLength(6) // 2 excess tiles + 4 completing the band (one is kept for glazing)
    })
  })

  describe('Draft Actions - Center Source', () => {
    it('should handle first player token correctly', () => {
      const blueTiles: Tile[] = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' }
      ]
      gameState.centerTiles = [
        ...blueTiles,
        { id: '3', color: 'red' }
      ]

      const action: DraftAction = {
        type: 'draft',
        source: { type: 'center' },
        color: 'blue',
        tiles: blueTiles,
        targetBand: 1
      }

      const newState = executeDraftAction(gameState, action)

      // Should gain first player token
      expect(newState.firstPlayerToken).toBe('human')
      expect(newState.isFirstPlayerTaken).toBe(true)

      // Should get broken glass penalty for first player token
      expect(newState.humanBoard.brokenGlass).toBe(1)

      // Should remove selected color from center
      expect(newState.centerTiles).toHaveLength(1)
      expect(newState.centerTiles[0].color).toBe('red')
    })

    it('should not give first player token if already taken', () => {
      gameState.isFirstPlayerTaken = true
      gameState.firstPlayerToken = 'ai'
      const blueTile: Tile = { id: '1', color: 'blue' }
      gameState.centerTiles = [blueTile]

      const action: DraftAction = {
        type: 'draft',
        source: { type: 'center' },
        color: 'blue',
        tiles: [blueTile],
        targetBand: 1
      }

      const newState = executeDraftAction(gameState, action)

      expect(newState.firstPlayerToken).toBe('ai')
      expect(newState.humanBoard.brokenGlass).toBe(0)
    })
  })

  describe('Band Completion and Scoring', () => {
    beforeEach(() => {
      // Set up a known round tile for consistent scoring
      gameState.currentRoundTile = { id: 'round1', color: 'blue' }
    })

    it('should complete band when reaching capacity', () => {
      const targetBand = gameState.humanBoard.patternBands[1] // column 2
      targetBand.tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' },
        { id: '4', color: 'blue' }
      ]

      const blueTile: Tile = { id: '5', color: 'blue' }
      const action: DraftAction = {
        type: 'draft',
        source: { type: 'center' },
        color: 'blue',
        tiles: [blueTile],
        targetBand: 2
      }

      const newState = executeDraftAction(gameState, action)
      const completedBand = newState.humanBoard.patternBands[1]

      expect(completedBand.isCompleted).toBe(true)
      expect(completedBand.isFirstSide).toBe(false) // Flipped to second side
      expect(completedBand.tiles).toHaveLength(0) // Tiles cleared after completion
    })

    it('should calculate base score correctly', () => {
      const scoreCalc = calculateBandScore(gameState.humanBoard, 2, gameState.currentRoundTile)
      expect(scoreCalc.baseValue).toBe(3) // Column 2 base value
    })

    it('should calculate right columns bonus', () => {
      // Complete some bands to the right
      gameState.humanBoard.patternBands[3].isCompleted = true // column 4
      gameState.humanBoard.patternBands[6].isCompleted = true // column 7

      const scoreCalc = calculateBandScore(gameState.humanBoard, 2, gameState.currentRoundTile)
      expect(scoreCalc.rightColumnsBonus).toBe(3) // column 4 (value 2) + column 7 (value 1)
    })

    it('should calculate round bonus correctly', () => {
      const board = gameState.humanBoard
      const bandColumn2 = board.patternBands[1]
      bandColumn2.tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'red' }
      ]

      const scoreCalc = calculateBandScore(board, 2, { id: 'round', color: 'blue' })
      expect(scoreCalc.roundBonus).toBe(2) // 2 blue tiles matching round tile
    })
  })

  describe('Reset Action', () => {
    it('should move glazier to leftmost accessible column', () => {
      const board = gameState.humanBoard
      board.glazierPosition = 5
      board.patternBands[0].isRemoved = true // column 1
      board.patternBands[1].isRemoved = true // column 2

      const newState = executeResetAction(gameState)
      expect(newState.humanBoard.glazierPosition).toBe(3) // leftmost available
    })

    it('should handle case where no bands are removed', () => {
      gameState.humanBoard.glazierPosition = 8

      const newState = executeResetAction(gameState)
      expect(newState.humanBoard.glazierPosition).toBe(1)
    })
  })

  describe('Round and Game End Conditions', () => {
    it('should detect round end when all factories and center are empty', () => {
      gameState.factories.forEach(factory => factory.tiles = [])
      gameState.centerTiles = []

      expect(isRoundOver(gameState)).toBe(true)
    })

    it('should not detect round end when tiles remain', () => {
      gameState.centerTiles = [{ id: '1', color: 'blue' }]

      expect(isRoundOver(gameState)).toBe(false)
    })

    it('should detect game end after round 6', () => {
      gameState.round = 7
      expect(isGameOver(gameState)).toBe(true)
    })

    it('should not detect game end before round 6', () => {
      gameState.round = 6
      expect(isGameOver(gameState)).toBe(false)
    })
  })

  describe('End Game Scoring', () => {
    it('should calculate pair bonuses correctly', () => {
      const board = gameState.humanBoard

      // Complete pairs: columns 1-2 and 5-6
      board.patternBands[0].isCompleted = true // column 1
      board.patternBands[1].isCompleted = true // column 2
      board.patternBands[4].isCompleted = true // column 5
      board.patternBands[5].isCompleted = true // column 6

      const endGameBonus = calculateEndGameBonus(board)
      expect(endGameBonus.pairBonus).toBe(6) // 3 points per pair × 2 pairs
    })

    it('should calculate remaining tiles bonus', () => {
      const board = gameState.humanBoard

      // Add tiles to bands
      board.patternBands[0].tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' }
      ] // 3 tiles = 1 point

      board.patternBands[1].tiles = [
        { id: '4', color: 'red' },
        { id: '5', color: 'red' },
        { id: '6', color: 'red' },
        { id: '7', color: 'red' },
        { id: '8', color: 'red' }
      ] // 5 tiles = 1 point (5/3 = 1)

      const endGameBonus = calculateEndGameBonus(board)
      expect(endGameBonus.remainingTilesBonus).toBe(2)
    })

    it('should calculate broken glass penalty', () => {
      const board = gameState.humanBoard
      board.brokenGlass = 5

      const endGameBonus = calculateEndGameBonus(board)
      expect(endGameBonus.brokenGlassPenalty).toBe(-5)
    })
  })

  describe('Broken Glass Penalty System', () => {
    it('should reset broken glass when reaching threshold', () => {
      gameState.humanBoard.brokenGlass = 15

      const blueTiles: Tile[] = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' },
        { id: '4', color: 'blue' }
      ]

      const action: DraftAction = {
        type: 'draft',
        source: { type: 'center' },
        color: 'blue',
        tiles: blueTiles,
        targetBand: 1
      }

      // This should add 4 more broken glass (1 for first player + 3 excess)
      gameState.centerTiles = blueTiles

      const newState = executeDraftAction(gameState, action)

      // Should trigger reset when reaching 18
      if (newState.humanBoard.brokenGlass === 0) {
        expect(newState.humanBoard.score).toBeLessThan(gameState.humanBoard.score)
      }
    })
  })

  describe('Round Transition', () => {
    it('should detect round is over when all factories and center are empty', () => {
      // Empty all factories
      gameState.factories.forEach(factory => {
        factory.tiles = []
      })

      // Empty center
      gameState.centerTiles = []

      expect(isRoundOver(gameState)).toBe(true)
    })

    it('should not detect round over when factories have tiles', () => {
      // Leave one tile in one factory
      gameState.factories[0].tiles = [{ id: '1', color: 'blue' }]
      gameState.centerTiles = []

      expect(isRoundOver(gameState)).toBe(false)
    })

    it('should not detect round over when center has tiles', () => {
      // Empty factories but leave tiles in center
      gameState.factories.forEach(factory => {
        factory.tiles = []
      })
      gameState.centerTiles = [{ id: '1', color: 'red' }]

      expect(isRoundOver(gameState)).toBe(false)
    })

    it('should prepare next round correctly when sufficient tiles in bag', () => {
      const originalRound = gameState.round
      const originalRoundTile = gameState.currentRoundTile

      // Ensure we have enough tiles in bag
      gameState.tileBag = createTileBag().slice(0, 100) // 100 tiles should be enough
      gameState.discardTower = []
      gameState.isFirstPlayerTaken = true
      gameState.firstPlayerToken = 'ai'

      const newState = prepareNextRound(gameState)

      // Check round progression
      expect(newState.round).toBe(originalRound + 1)

      // Check round tile updated
      expect(newState.currentRoundTile).not.toBe(originalRoundTile)
      expect(newState.currentRoundTile).toBe(newState.roundTiles[newState.round - 1])

      // Check first player mechanics reset
      expect(newState.isFirstPlayerTaken).toBe(false)
      expect(newState.firstPlayerToken).toBe(null)
      expect(newState.currentPlayer).toBe('ai') // Should be previous first player

      // Check factories refilled
      newState.factories.forEach(factory => {
        expect(factory.tiles).toHaveLength(4)
      })

      // Check center is empty
      expect(newState.centerTiles).toHaveLength(0)

      // Check tiles consumed from bag
      expect(newState.tileBag.length).toBeLessThan(100)
    })

    it('should shuffle discard tower into bag when insufficient tiles', () => {
      // Set up low tile bag but tiles in discard tower
      gameState.tileBag = createTileBag().slice(0, 10) // Only 10 tiles
      gameState.discardTower = createTileBag().slice(10, 50) // 40 tiles in discard

      const newState = prepareNextRound(gameState)

      // Check discard tower was shuffled back
      expect(newState.discardTower).toHaveLength(0)

      // Check factories still filled
      newState.factories.forEach(factory => {
        expect(factory.tiles).toHaveLength(4)
      })

      // Check combined tiles were used
      expect(newState.tileBag.length).toBe(50 - 20) // 50 total - 20 for factories
    })

    it('should end game when insufficient tiles even after shuffle', () => {
      // Set up scenario with very few tiles
      gameState.tileBag = createTileBag().slice(0, 5) // Only 5 tiles
      gameState.discardTower = createTileBag().slice(5, 10) // Only 5 more in discard

      const newState = prepareNextRound(gameState)

      // Should transition to game end
      expect(newState.gamePhase).toBe('gameEnd')
    })

    it('should handle round progression through all 6 rounds', () => {
      let currentState = gameState

      for (let round = 1; round < 6; round++) {
        currentState.round = round
        currentState.tileBag = createTileBag() // Ensure enough tiles

        const nextState = prepareNextRound(currentState)

        expect(nextState.round).toBe(round + 1)
        expect(nextState.currentRoundTile).toBe(nextState.roundTiles[round])
        expect(nextState.gamePhase).toBe('playing')

        currentState = nextState
      }
    })

    it('should maintain player scores through round transition', () => {
      const originalHumanScore = gameState.humanBoard.score = 25
      const originalAIScore = gameState.aiBoard.score = 18

      gameState.tileBag = createTileBag()

      const newState = prepareNextRound(gameState)

      expect(newState.humanBoard.score).toBe(originalHumanScore)
      expect(newState.aiBoard.score).toBe(originalAIScore)
    })

    it('should preserve pattern bands state through round transition', () => {
      // Set up some band states
      gameState.humanBoard.patternBands[0].isCompleted = true
      gameState.humanBoard.patternBands[1].isRemoved = true
      gameState.humanBoard.patternBands[2].tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' }
      ]

      gameState.tileBag = createTileBag()

      const newState = prepareNextRound(gameState)

      // Check band states preserved
      expect(newState.humanBoard.patternBands[0].isCompleted).toBe(true)
      expect(newState.humanBoard.patternBands[1].isRemoved).toBe(true)
      expect(newState.humanBoard.patternBands[2].tiles).toHaveLength(2)
      expect(newState.humanBoard.patternBands[2].tiles[0].color).toBe('blue')
    })

    it('should reset first player mechanics correctly', () => {
      gameState.isFirstPlayerTaken = true
      gameState.firstPlayerToken = 'human'
      gameState.currentPlayer = 'ai'
      gameState.roundStartPlayer = 'ai'
      gameState.tileBag = createTileBag()

      const newState = prepareNextRound(gameState)

      expect(newState.isFirstPlayerTaken).toBe(false)
      expect(newState.firstPlayerToken).toBe(null)
      expect(newState.currentPlayer).toBe('human') // Should use previous first player
    })

    it('should fall back to round start player when no first player token', () => {
      gameState.isFirstPlayerTaken = false
      gameState.firstPlayerToken = null
      gameState.currentPlayer = 'ai'
      gameState.roundStartPlayer = 'human'
      gameState.tileBag = createTileBag()

      const newState = prepareNextRound(gameState)

      expect(newState.currentPlayer).toBe('human') // Should use roundStartPlayer
    })

    it('should generate unique tile IDs across rounds', () => {
      gameState.tileBag = createTileBag()

      const state1 = prepareNextRound(gameState)
      const state2 = prepareNextRound(state1)

      const round1TileIds = state1.factories.flatMap(f => f.tiles.map(t => t.id))
      const round2TileIds = state2.factories.flatMap(f => f.tiles.map(t => t.id))

      // All tile IDs should be unique
      const allIds = [...round1TileIds, ...round2TileIds]
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(allIds.length)
    })
  })
})
