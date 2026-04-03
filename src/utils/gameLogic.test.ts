import { describe, it, expect } from 'vitest';
import {
  createTileBag,
  initializeGame,
  createPlayerBoard,
  createPatternBands,
  getActivePattern,
  canBandAcceptTiles,
  calculateBandScore,
  executeDraftAction,
  calculateEndGameBonus
} from './gameLogic';
import type { DraftAction, PatternBand, Tile, TileColor } from '../types/game';

const applyPattern = (band: PatternBand, front: TileColor[] | ('joker' | TileColor)[], back?: ('joker' | TileColor)[]) => {
  band.patternSides = [front, back ?? front] as [PatternBand['patternSides'][0], PatternBand['patternSides'][1]];
  band.activeSide = 0;
  band.tiles = [];
  band.windowTiles = [];
  band.glazedTile = null;
  band.secondGlazedTile = null;
  band.isCompleted = false;
  band.isFirstSide = true;
  band.isRemoved = false;
};

describe('Game Logic - Pattern Strips', () => {
  it('creates a bag with 100 tiles and 20 per color', () => {
    const bag = createTileBag();
    expect(bag).toHaveLength(100);

    const counts = bag.reduce((acc, tile) => {
      acc[tile.color] = (acc[tile.color] ?? 0) + 1;
      return acc;
    }, {} as Record<TileColor, number>);

    expect(counts).toEqual({
      blue: 20,
      red: 20,
      yellow: 20,
      green: 20,
      orange: 20
    });
  });

  it('initial strips are generated with 8 pattern bands and joker side starts face-down', () => {
    const bands = createPatternBands();
    expect(bands).toHaveLength(8);

    bands.forEach((band) => {
      expect(band.patternSides[0]).toHaveLength(5);
      expect(band.patternSides[1]).toHaveLength(5);
      const activePattern = getActivePattern(band);
      const jokerCount = activePattern.filter((space) => space === 'joker').length;
      expect(jokerCount).toBeLessThan(2);
    });
  });

  it('acceptance follows pattern spaces and jokers', () => {
    const state = initializeGame();
    const band = state.humanBoard.patternBands[0];
    applyPattern(band, ['blue', 'red', 'joker', 'green', 'orange']);

    band.tiles = [{ id: 'b1', color: 'blue' }];

    expect(canBandAcceptTiles(band, 'red', 1)).toBe(true);
    expect(canBandAcceptTiles(band, 'blue', 1)).toBe(true); // joker remains available
    expect(canBandAcceptTiles(band, 'yellow', 1)).toBe(true); // joker accepts any color
  });

  it('places only tiles that match pattern slots and sends overflow to broken glass', () => {
    const state = initializeGame();
    state.currentPlayer = 'human';

    const band = state.humanBoard.patternBands[0];
    applyPattern(band, ['blue', 'blue', 'red', 'green', 'orange']);

    state.factories[0].tiles = [
      { id: 't1', color: 'blue' },
      { id: 't2', color: 'blue' },
      { id: 't3', color: 'blue' },
      { id: 't4', color: 'blue' }
    ];

    const action: DraftAction = {
      type: 'draft',
      source: { type: 'factory', id: 0 },
      color: 'blue',
      tiles: state.factories[0].tiles,
      targetBand: 1
    };

    const newState = executeDraftAction(state, action);
    expect(newState.humanBoard.patternBands[0].tiles).toHaveLength(2);
    expect(newState.humanBoard.brokenGlass).toBe(2);
  });

  it('rejects choosing a strip with no matching spaces when another reachable strip can accept', () => {
    const state = initializeGame();
    state.currentPlayer = 'human';
    state.humanBoard.glazierPosition = 1;

    applyPattern(state.humanBoard.patternBands[0], ['red', 'red', 'green', 'yellow', 'orange']);
    applyPattern(state.humanBoard.patternBands[1], ['blue', 'green', 'orange', 'red', 'yellow']);

    state.factories[0].tiles = [
      { id: 't1', color: 'blue' },
      { id: 't2', color: 'blue' }
    ];

    const action: DraftAction = {
      type: 'draft',
      source: { type: 'factory', id: 0 },
      color: 'blue',
      tiles: state.factories[0].tiles,
      targetBand: 1
    };

    expect(() => executeDraftAction(state, action)).toThrow(/Invalid strip choice/);
  });

  it('first strip completion flips to opposite side and stores first window pane', () => {
    const state = initializeGame();
    state.currentPlayer = 'human';

    const band = state.humanBoard.patternBands[0];
    applyPattern(band, ['blue', 'blue', 'blue', 'blue', 'blue'], ['red', 'red', 'red', 'red', 'red']);
    band.tiles = [
      { id: 'p1', color: 'blue' },
      { id: 'p2', color: 'blue' },
      { id: 'p3', color: 'blue' },
      { id: 'p4', color: 'blue' }
    ];

    state.factories[0].tiles = [{ id: 'p5', color: 'blue' }];

    const action: DraftAction = {
      type: 'draft',
      source: { type: 'factory', id: 0 },
      color: 'blue',
      tiles: state.factories[0].tiles,
      targetBand: 1
    };

    const newState = executeDraftAction(state, action);
    const newBand = newState.humanBoard.patternBands[0];

    expect(newBand.windowTiles).toHaveLength(1);
    expect(newBand.isFirstSide).toBe(false);
    expect(newBand.activeSide).toBe(1);
    expect(newBand.tiles).toHaveLength(0);
    expect(newBand.isRemoved).toBe(false);
  });

  it('second strip completion removes strip and stores second window pane', () => {
    const state = initializeGame();
    state.currentPlayer = 'human';
    const band = state.humanBoard.patternBands[0];
    applyPattern(band, ['blue', 'blue', 'blue', 'blue', 'blue'], ['red', 'red', 'red', 'red', 'red']);

    // first completion
    band.tiles = [
      { id: 'a1', color: 'blue' },
      { id: 'a2', color: 'blue' },
      { id: 'a3', color: 'blue' },
      { id: 'a4', color: 'blue' }
    ];
    state.factories[0].tiles = [{ id: 'a5', color: 'blue' }];
    let newState = executeDraftAction(state, {
      type: 'draft',
      source: { type: 'factory', id: 0 },
      color: 'blue',
      tiles: state.factories[0].tiles,
      targetBand: 1
    });

    // second completion
    newState.currentPlayer = 'human';
    const secondBand = newState.humanBoard.patternBands[0];
    secondBand.tiles = [
      { id: 'b1', color: 'red' },
      { id: 'b2', color: 'red' },
      { id: 'b3', color: 'red' },
      { id: 'b4', color: 'red' }
    ];
    newState.factories[1].tiles = [{ id: 'b5', color: 'red' }];

    newState = executeDraftAction(newState, {
      type: 'draft',
      source: { type: 'factory', id: 1 },
      color: 'red',
      tiles: newState.factories[1].tiles,
      targetBand: 1
    });

    const finalBand = newState.humanBoard.patternBands[0];
    expect(finalBand.windowTiles).toHaveLength(2);
    expect(finalBand.isRemoved).toBe(true);
    expect(finalBand.secondGlazedTile).not.toBeNull();
  });

  it('right-side bonus counts windows that already contain panes, even if strip is removed', () => {
    const board = createPlayerBoard('test');
    board.patternBands[3].windowTiles = [{ id: 'w1', color: 'blue' } as Tile];
    board.patternBands[3].isRemoved = true;

    const score = calculateBandScore(board, 2, null);
    expect(score.rightColumnsBonus).toBe(4);
  });

  it('end-game ornament pair bonus uses completed windows', () => {
    const board = createPlayerBoard('test');
    board.patternBands[0].windowTiles = [{ id: 'p1', color: 'blue' } as Tile];
    board.patternBands[1].windowTiles = [{ id: 'p2', color: 'red' } as Tile];
    const bonus = calculateEndGameBonus(board);
    expect(bonus.pairBonus).toBe(3);
  });
});
