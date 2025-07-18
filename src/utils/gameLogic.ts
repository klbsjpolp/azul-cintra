import {
  type Tile,
  type TileColor,
  type Factory,
  type PatternBand,
  type PlayerBoard,
  type GameState,
  type DraftAction, 
  type ScoreCalculation,
  type EndGameBonus,
  COLUMN_VALUES,
  ORNAMENT_BONUS,
  BROKEN_GLASS_PENALTY_PER_TILE,
  BROKEN_GLASS_RESET_THRESHOLD,
  BROKEN_GLASS_RESET_PENALTY
} from '../types/game';

const TILE_COLORS: TileColor[] = ['blue', 'red', 'yellow', 'green', 'purple', 'orange'];
const TILES_PER_COLOR = 22;

// Generate a unique tile ID
let tileIdCounter = 0;
const generateTileId = (): string => `tile-${++tileIdCounter}`;

// Create a full bag of tiles
export const createTileBag = (): Tile[] => {
  const bag: Tile[] = [];
  TILE_COLORS.forEach(color => {
    for (let i = 0; i < TILES_PER_COLOR; i++) {
      bag.push({
        id: generateTileId(),
        color
      });
    }
  });
  return shuffleArray(bag);
};

// Shuffle array utility
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create initial pattern bands for a player
export const createPatternBands = (): PatternBand[] => {
  return Array.from({ length: 8 }, (_, index) => ({
    id: index + 1,
    column: index + 1,
    tiles: [],
    maxCapacity: 5,
    isCompleted: false,
    isFirstSide: true,
    isRemoved: false,
    glazedTile: null
  }));
};

// Create initial player board
export const createPlayerBoard = (id: string): PlayerBoard => ({
  id,
  patternBands: createPatternBands(),
  glazierPosition: 1,
  score: 0,
  brokenGlass: 0
});

// Create initial factories
export const createFactories = (tileBag: Tile[]): { factories: Factory[], remainingBag: Tile[] } => {
  const factories: Factory[] = [];
  const bagCopy = [...tileBag];
  
  for (let i = 0; i < 5; i++) {
    const factoryTiles = bagCopy.splice(0, 4);
    factories.push({
      id: i,
      tiles: factoryTiles
    });
  }
  
  return { factories, remainingBag: bagCopy };
};

// Initialize game state
export const initializeGame = (): GameState => {
  const tileBag = createTileBag();
  const roundTiles = tileBag.splice(0, 6); // Take 6 tiles for round bonuses
  const { factories, remainingBag } = createFactories(tileBag);
  
  return {
    currentPlayer: 'human',
    round: 1,
    factories,
    centerTiles: [],
    firstPlayerToken: null,
    roundTiles,
    currentRoundTile: roundTiles[0],
    humanBoard: createPlayerBoard('human'),
    aiBoard: createPlayerBoard('ai'),
    tileBag: remainingBag,
    discardTower: [],
    gamePhase: 'playing',
    isFirstPlayerTaken: false,
    roundStartPlayer: 'human'
  };
};

// Get accessible bands for a player (at or to the right of glazier)
export const getAccessibleBands = (board: PlayerBoard): PatternBand[] => {
  return board.patternBands.filter(band => 
    band.column >= board.glazierPosition && !band.isRemoved
  );
};

// Check if a band can accept tiles of a specific color
export const canBandAcceptTiles = (band: PatternBand, color: TileColor, count: number): boolean => {
  if (band.isRemoved || band.isCompleted) return false;

  // If band is empty, it can accept any color
  if (band.tiles.length === 0) {
    return band.tiles.length + count <= band.maxCapacity;
  }
  
  // If band has tiles, new tiles must be same color
  const existingColor = band.tiles[0].color;
  return existingColor === color && band.tiles.length + count <= band.maxCapacity;
};

// Calculate score for completing a band
export const calculateBandScore = (
  board: PlayerBoard, 
  bandColumn: number, 
  currentRoundTile: Tile | null
): ScoreCalculation => {
  const baseValue = COLUMN_VALUES[bandColumn - 1];
  
  // Calculate right columns bonus
  let rightColumnsBonus = 0;
  for (let col = bandColumn + 1; col <= 8; col++) {
    const rightBand = board.patternBands.find(b => b.column === col);
    if (rightBand && rightBand.isCompleted && !rightBand.isRemoved) {
      rightColumnsBonus += COLUMN_VALUES[col - 1];
    }
  }
  
  // Calculate round bonus
  let roundBonus = 0;
  if (currentRoundTile) {
    const completedBand = board.patternBands.find(b => b.column === bandColumn);
    if (completedBand && completedBand.tiles.length > 0) {
      roundBonus = completedBand.tiles.filter(tile => tile.color === currentRoundTile.color).length;
    }
  }
  
  const total = baseValue + rightColumnsBonus + roundBonus;
  
  return {
    baseValue,
    rightColumnsBonus,
    roundBonus,
    total
  };
};

// Execute draft action
export const executeDraftAction = (gameState: GameState, action: DraftAction): GameState => {
  const newState = structuredClone(gameState);
  const currentBoard = newState.currentPlayer === 'human' ? newState.humanBoard : newState.aiBoard;
  let selectedTiles: Tile[] = [];

  // Remove tiles from source
  const source = action.source;
  if (source.type === 'factory') {
    const factory = newState.factories.find(f => f.id === source.id);
    if (factory) {
      // Remove tiles of the selected color
      selectedTiles = factory.tiles.filter(tile => tile.color === action.color);
      const remainingTiles = factory.tiles.filter(tile => tile.color !== action.color);
      
      // Move remaining tiles to center
      newState.centerTiles.push(...remainingTiles);
      factory.tiles = [];
    }
  } else if (source.type === 'center') {
    // Handle first player token
    if (!newState.isFirstPlayerTaken) {
      newState.firstPlayerToken = newState.currentPlayer;
      newState.isFirstPlayerTaken = true;
      currentBoard.brokenGlass += BROKEN_GLASS_PENALTY_PER_TILE; // Penalty for taking first player token
    }
    // Remove specified tiles from center (use action.tiles)
    selectedTiles = action.tiles;
    newState.centerTiles = newState.centerTiles.filter(tile => !action.tiles.some(t => t.id === tile.id));
  }

  // Place tiles on target band
  const targetBand = currentBoard.patternBands.find(b => b.column === action.targetBand);
  if (targetBand && selectedTiles.length > 0) {
    const availableCapacity = targetBand.maxCapacity - targetBand.tiles.length;
    const tilesToPlace = selectedTiles.slice(0, availableCapacity);
    const excessTiles = selectedTiles.slice(availableCapacity);

    targetBand.tiles.push(...tilesToPlace);

    // Move glazier to target band
    currentBoard.glazierPosition = action.targetBand;

    // Handle excess tiles (broken glass penalty)
    if (excessTiles.length > 0) {
      currentBoard.brokenGlass += excessTiles.length * BROKEN_GLASS_PENALTY_PER_TILE;
      newState.discardTower.push(...excessTiles);
    }

    // Check if band is completed (only for center source)
    if (targetBand.tiles.length === targetBand.maxCapacity) {
      completeBand(newState, currentBoard, targetBand);
    }
  }
  
  // Handle broken glass penalty reset
  if (currentBoard.brokenGlass >= BROKEN_GLASS_RESET_THRESHOLD) {
    currentBoard.score += BROKEN_GLASS_RESET_PENALTY;
    currentBoard.brokenGlass = 0;
  }
  
  // Switch to next player
  newState.currentPlayer = newState.currentPlayer === 'human' ? 'ai' : 'human';

  return newState;
};

// Complete a pattern band
const completeBand = (gameState: GameState, board: PlayerBoard, band: PatternBand): void => {
  // Choose one tile to glaze (keep the first tile as glazed)
  const tileToGlaze = band.tiles[0];
  const tilesToDiscard = band.tiles.slice(1);
  
  // Calculate and add score
  const scoreCalc = calculateBandScore(board, band.column, gameState.currentRoundTile);
  board.score += scoreCalc.total;
  
  // Handle band completion based on side
  if (band.isFirstSide) {
    // First completion - flip to second side, keep glazed tile
    band.isFirstSide = false;
    band.isCompleted = true;
    band.glazedTile = tileToGlaze;
    band.tiles = [];
  } else {
    // Second completion - remove band entirely
    band.isRemoved = true;
    band.tiles = [];
    band.glazedTile = null;

    // Add the glazed tile to discard as well
    if (tileToGlaze) {
      tilesToDiscard.push(tileToGlaze);
    }
  }
  
  // Move discarded tiles to tower
  gameState.discardTower.push(...tilesToDiscard);
};

// Execute reset action
export const executeResetAction = (gameState: GameState): GameState => {
  const newState = structuredClone(gameState);
  const currentBoard = newState.currentPlayer === 'human' ? newState.humanBoard : newState.aiBoard;

  let newGlazierPosition = 1;
  // Move glazier to leftmost accessible column (not removed)
  const accessibleBands = currentBoard.patternBands.filter(band => !band.isRemoved);
  if (accessibleBands.length > 0) {
    newGlazierPosition = Math.min(...accessibleBands.map(band => band.column));
  }

  if (newGlazierPosition !== currentBoard.glazierPosition) {
    currentBoard.glazierPosition = newGlazierPosition;

    // Switch to next player
    newState.currentPlayer = newState.currentPlayer === 'human' ? 'ai' : 'human';
  }

  return newState;
};

// Check if round is over
export const isRoundOver = (gameState: GameState): boolean => {
  return gameState.factories.every(f => f.tiles.length === 0) && gameState.centerTiles.length === 0;
};

// Prepare next round
export const prepareNextRound = (gameState: GameState): GameState => {
  const newState = structuredClone(gameState);

  // Increment round
  newState.round += 1;

  // Update current round tile
  if (newState.round <= 6) {
    newState.currentRoundTile = newState.roundTiles[newState.round - 1];
  }

  // Reset first player token mechanics
  newState.isFirstPlayerTaken = false;
  newState.currentPlayer = newState.firstPlayerToken || newState.roundStartPlayer;
  newState.firstPlayerToken = null;

  // Refill factories if there are enough tiles
  if (newState.tileBag.length >= 20) { // Need 20 tiles for 5 factories
    const { factories, remainingBag } = createFactories(newState.tileBag);
    newState.factories = factories;
    newState.tileBag = remainingBag;
  } else {
    // Shuffle discard tower back into bag if needed
    const combinedTiles = [...newState.tileBag, ...newState.discardTower];
    const shuffledBag = shuffleArray(combinedTiles);
    newState.discardTower = [];

    if (shuffledBag.length >= 20) {
      const { factories, remainingBag } = createFactories(shuffledBag);
      newState.factories = factories;
      newState.tileBag = remainingBag;
    } else {
      // Not enough tiles to continue - end game
      newState.gamePhase = 'gameEnd';
    }
  }

  return newState;
};

// Calculate end game bonuses
export const calculateEndGameBonus = (board: PlayerBoard): EndGameBonus => {
  // Ornament bonus (pairs of completed columns)
  let pairBonus = 0;
  const pairs = [[1, 2], [3, 4], [5, 6], [7, 8]];
  
  pairs.forEach(([col1, col2]) => {
    const band1 = board.patternBands.find(b => b.column === col1);
    const band2 = board.patternBands.find(b => b.column === col2);
    
    let completedCount = 0;
    if (band1 && band1.isCompleted && !band1.isRemoved) completedCount++;
    if (band2 && band2.isCompleted && !band2.isRemoved) completedCount++;

    if (completedCount === 2) {
      pairBonus += ORNAMENT_BONUS[2];
    }
  });
  
  // Remaining tiles bonus (1 point per 3 tiles)
  let remainingTilesBonus = 0;
  board.patternBands.forEach(band => {
    if (!band.isRemoved && band.tiles.length > 0) {
      remainingTilesBonus += Math.floor(band.tiles.length / 3);
    }
  });
  
  // Broken glass penalty
  const brokenGlassPenalty = -board.brokenGlass;

  return {
    pairBonus,
    remainingTilesBonus,
    brokenGlassPenalty,
    total: pairBonus + remainingTilesBonus + brokenGlassPenalty
  };
};

// Check if game is over
export const isGameOver = (gameState: GameState): boolean => {
  return gameState.round > 6 || gameState.gamePhase === 'gameEnd';
};