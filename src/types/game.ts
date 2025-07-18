export type TileColor = 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'orange';

export interface Tile {
  id: string;
  color: TileColor;
}

export interface Factory {
  id: number;
  tiles: Tile[];
}

export interface PatternBand {
  id: number;
  column: number;
  tiles: Tile[];
  maxCapacity: number;
  isCompleted: boolean;
  isFirstSide: boolean; // true for first completion, false for second
  isRemoved: boolean; // true when band is removed after second completion
  glazedTile: Tile | null; // The tile that was glazed when completed
}

export interface PlayerBoard {
  id: string;
  patternBands: PatternBand[];
  glazierPosition: number; // column position (1-8)
  score: number;
  brokenGlass: number; // penalty track position (positive numbers)
}

export interface GameState {
  currentPlayer: 'human' | 'ai';
  round: number; // 1-6
  factories: Factory[];
  centerTiles: Tile[];
  firstPlayerToken: 'human' | 'ai' | null;
  roundTiles: Tile[]; // 6 tiles for round bonuses
  currentRoundTile: Tile | null;
  humanBoard: PlayerBoard;
  aiBoard: PlayerBoard;
  tileBag: Tile[];
  discardTower: Tile[];
  gamePhase: 'setup' | 'playing' | 'roundEnd' | 'gameEnd';
  isFirstPlayerTaken: boolean;
  roundStartPlayer: 'human' | 'ai'; // Who starts each round
}

export interface SourceCenter {
  type: 'center';
}

export interface SourceFactory {
  type: 'factory';
  id: number; // factory id
}

export type Source = SourceCenter | SourceFactory;

export interface DraftAction {
  type: 'draft';
  source: Source;
  color: TileColor;
  tiles: Tile[];
  targetBand: number;
}

export interface ResetAction {
  type: 'reset';
}

export type GameAction = DraftAction | ResetAction;

export interface AIOption {
  action: GameAction;
  score: number;
  needsReset: boolean;
}

// Scoring constants for board A (based on README specifications)
export const COLUMN_VALUES = [4, 3, 3, 2, 2, 1, 1, 2]; // columns 1-8

export const ORNAMENT_BONUS = {
  2: 3, // 2 columns completed in pair
  3: 6, // 3 columns completed in pair  
  4: 10 // 4 columns completed in pair
};

// Broken glass penalty constants
export const BROKEN_GLASS_PENALTY_PER_TILE = 1;
export const BROKEN_GLASS_RESET_THRESHOLD = 18;
export const BROKEN_GLASS_RESET_PENALTY = -18;

export interface ScoreCalculation {
  baseValue: number;
  rightColumnsBonus: number;
  roundBonus: number;
  total: number;
}

export interface EndGameBonus {
  pairBonus: number;
  remainingTilesBonus: number;
  brokenGlassPenalty: number;
  total: number;
}