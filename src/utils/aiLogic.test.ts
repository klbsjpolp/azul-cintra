import { describe, it, expect } from 'vitest';
import {
  evaluateAllDraftOptions,
  calculateAIMove,
  evaluateDraftOption,
  evaluateResetThenDraft
} from './aiLogic';
import { getAvailableMatchingSpaces, initializeGame } from './gameLogic';
import type { DraftAction, GameState, PatternBand, TileColor } from '../types/game';

const applyPattern = (band: PatternBand, pattern: (TileColor | 'joker')[]) => {
  band.patternSides = [pattern, pattern];
  band.activeSide = 0;
  band.tiles = [];
  band.windowTiles = [];
  band.glazedTile = null;
  band.secondGlazedTile = null;
  band.isCompleted = false;
  band.isFirstSide = true;
  band.isRemoved = false;
};

describe('AI Logic - Pattern Strips', () => {
  it('proposes only draft targets with available matching spaces', () => {
    const gameState = initializeGame();
    const aiBand = gameState.aiBoard.patternBands[0];
    applyPattern(aiBand, ['red', 'red', 'green', 'yellow', 'orange']);
    gameState.aiBoard.glazierPosition = 1;

    gameState.factories[0].tiles = [
      { id: 'f1', color: 'blue' },
      { id: 'f2', color: 'blue' }
    ];

    const options = evaluateAllDraftOptions(gameState).filter(
      (opt) => opt.action.type === 'draft' && opt.action.source.type === 'factory' && opt.action.source.id === 0
    );

    options.forEach((opt) => {
      const draftAction = opt.action;
      if (draftAction.type !== 'draft') return;

      const targetBand = gameState.aiBoard.patternBands.find((band) => band.column === draftAction.targetBand)!;
      expect(getAvailableMatchingSpaces(targetBand, draftAction.color)).toBeGreaterThan(0);
    });
  });

  it('considers reset path when no reachable strip can accept a color', () => {
    const gameState = initializeGame();
    const aiBoard = gameState.aiBoard;
    aiBoard.glazierPosition = 8;

    const lastBand = aiBoard.patternBands[7];
    applyPattern(lastBand, ['red', 'red', 'red', 'red', 'red']);
    gameState.factories[0].tiles = [
      { id: 'b1', color: 'blue' },
      { id: 'b2', color: 'blue' }
    ];

    const options = evaluateAllDraftOptions(gameState);
    expect(options.some((option) => option.needsReset)).toBe(true);
  });

  it('returns a valid move shape', () => {
    const gameState = initializeGame();
    const move = calculateAIMove(gameState, 'medium');

    expect(move).toBeDefined();
    expect(['draft', 'reset']).toContain(move.type);
    if (move.type === 'draft') {
      expect(move.targetBand).toBeGreaterThanOrEqual(1);
      expect(move.targetBand).toBeLessThanOrEqual(8);
      expect(['factory', 'center']).toContain(move.source.type);
    }
  });

  it('evaluates draft options with finite numeric scores', () => {
    const gameState: GameState = initializeGame();
    const action: DraftAction = {
      type: 'draft',
      source: { type: 'factory', id: 0 },
      color: 'blue',
      tiles: [{ id: '1', color: 'blue' }],
      targetBand: 1
    };

    const score = evaluateDraftOption(gameState, action);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('evaluates reset-then-draft paths with finite numeric scores', () => {
    const gameState: GameState = initializeGame();
    const action: DraftAction = {
      type: 'draft',
      source: { type: 'factory', id: 0 },
      color: 'blue',
      tiles: [{ id: '1', color: 'blue' }],
      targetBand: 1
    };

    const score = evaluateResetThenDraft(gameState, action);
    expect(Number.isFinite(score)).toBe(true);
  });
});
