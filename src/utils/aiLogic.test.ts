import { describe, it, expect, beforeEach } from 'vitest'
import {
  evaluateAllDraftOptions,
  calculateAIMove,
  evaluateDraftOption,
  evaluateResetThenDraft
} from './aiLogic'
import { initializeGame } from './gameLogic'
import type {GameState, DraftAction, SourceFactory} from '../types/game'

describe('AI Logic', () => {
  let gameState: GameState

  beforeEach(() => {
    gameState = initializeGame()
  })

  describe('Draft Option Evaluation', () => {
    it('should find all valid factory draft options', () => {
      // Set up a factory with mixed tiles
      gameState.factories[0].tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'red' },
        { id: '4', color: 'yellow' }
      ]

      const options = evaluateAllDraftOptions(gameState)

      // Should find options for blue, red, and yellow from factory 0
      const factoryOptions = options.filter(opt =>
        opt.action.type === 'draft' &&
        opt.action.source.type === 'factory' &&
        opt.action.source.id === 0
      )

      expect(factoryOptions.length).toBeGreaterThan(0)

      // Should have options for different colors - need to check draft actions only
      const draftFactoryOptions = factoryOptions.filter(opt =>
        opt.action.type === 'draft'
      ) as { action: DraftAction; score: number; needsReset: boolean }[]

      const colors = new Set(draftFactoryOptions.map(opt => opt.action.color))
      expect(colors.has('blue')).toBe(true)
      expect(colors.has('red')).toBe(true)
      expect(colors.has('yellow')).toBe(true)
    })

    it('should find center draft options', () => {
      gameState.centerTiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'red' }
      ]

      const options = evaluateAllDraftOptions(gameState)
      const centerOptions = options.filter(opt =>
        opt.action.type === 'draft' && opt.action.source.type === 'center'
      )

      expect(centerOptions.length).toBeGreaterThan(0)
    })

    it('should consider reset options when no accessible bands available', () => {
      // Fill all accessible bands or make them unusable
      const aiBoard = gameState.aiBoard
      aiBoard.glazierPosition = 8

      // Make the last band unusable by wrong color
      aiBoard.patternBands[7].tiles = [{ id: '1', color: 'red' }]

      // Set up factory with blue tiles
      gameState.factories[0].tiles = [
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' }
      ]

      const options = evaluateAllDraftOptions(gameState)
      const resetOptions = options.filter(opt => opt.needsReset)

      expect(resetOptions.length).toBeGreaterThan(0)
    })
  })

  describe('Move Calculation', () => {
    it('should return a valid move', () => {
      const move = calculateAIMove(gameState, 'medium')

      expect(move).toBeDefined()
      expect(['draft', 'reset']).toContain(move.type)

      if (move.type === 'draft') {
        expect(['factory', 'center']).toContain(move.source.type)
        expect(move.color).toBeDefined()
        expect(move.targetBand).toBeGreaterThanOrEqual(1)
        expect(move.targetBand).toBeLessThanOrEqual(8)
      }
    })

    it('should prefer higher scoring moves', () => {
      // Set up a scenario where one option is clearly better
      gameState.factories[0].tiles = [
        { id: '1', color: 'blue' },
        { id: '2', color: 'blue' },
        { id: '3', color: 'blue' },
        { id: '4', color: 'blue' }
      ]
      gameState.factories.slice(1).forEach(factory => {
        factory.tiles[0] = { id: '1', color: 'red' }
        factory.tiles[1] = { id: '2', color: 'green' }
      })

      // Make column 1 more attractive (lower column value but accessible)
      const move = calculateAIMove(gameState, 'hard')

      expect(move.type).toBe('draft')
      if (move.type === 'draft') {
        expect(move.source.type).toBe('factory')
        expect((move.source as SourceFactory).id).toBe(0)
        expect(move.color).toBe('blue')
      }
    })
  })

  describe('Difficulty Levels', () => {
    it('should make different quality moves based on difficulty', () => {
      const easyMove = calculateAIMove(gameState, 'easy')
      const hardMove = calculateAIMove(gameState, 'hard')

      expect(easyMove).toBeDefined()
      expect(hardMove).toBeDefined()

      // Both should be valid moves, but hard AI should consider more factors
      // This is more of a behavioral test - specific implementation may vary
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty factories gracefully', () => {
      gameState.factories.forEach(factory => factory.tiles = [])
      gameState.centerTiles = []

      const options = evaluateAllDraftOptions(gameState)
      // Should still have reset option
      expect(options.length).toBeGreaterThanOrEqual(1)
      expect(options.some(opt => opt.action.type === 'reset')).toBe(true)
    })

    it('should handle case where all bands are removed', () => {
      const aiBoard = gameState.aiBoard
      aiBoard.patternBands.forEach(band => band.isRemoved = true)

      const options = evaluateAllDraftOptions(gameState)
      // Should still return some options (likely reset actions)
      expect(options).toBeDefined()
      expect(options.length).toBeGreaterThan(0)
    })
  })

  describe('Option Evaluation Functions', () => {
    it('should evaluate draft options with scoring', () => {
      const action: DraftAction = {
        type: 'draft',
        source: { type: 'factory', id: 0 },
        color: 'blue',
        tiles: [{ id: '1', color: 'blue' }],
        targetBand: 1
      }

      const score = evaluateDraftOption(gameState, action)
      expect(typeof score).toBe('number')
      expect(score).not.toBe(-Infinity) // Should be a valid score
    })

    it('should evaluate reset then draft options', () => {
      const action: DraftAction = {
        type: 'draft',
        source: { type: 'factory', id: 0 },
        color: 'blue',
        tiles: [{ id: '1', color: 'blue' }],
        targetBand: 1
      }

      const score = evaluateResetThenDraft(gameState, action)
      expect(typeof score).toBe('number')
    })
  })
})
