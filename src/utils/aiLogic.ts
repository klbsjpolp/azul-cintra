import type {
  GameState,
  DraftAction,
  GameAction,
  AIOption,
  TileColor,
  Tile
} from '../types/game';
import {
  getAccessibleBands,
  canBandAcceptTiles,
  getAvailableMatchingSpaces,
  executeDraftAction,
  executeResetAction,
  calculateBandScore
} from './gameLogic';

// Evaluate a single draft option
export const evaluateDraftOption = (gameState: GameState, action: DraftAction): number => {
  try {
    const originalBand = gameState.aiBoard.patternBands.find(b => b.column === action.targetBand);
    const testState = executeDraftAction(gameState, action);
    const aiBoard = testState.aiBoard;

    let score = 0;

    // Base scoring factors
    const targetBand = aiBoard.patternBands.find(b => b.column === action.targetBand);
    if (targetBand && originalBand) {
      const didCompleteStrip = targetBand.windowTiles.length > originalBand.windowTiles.length;

      // Prefer completing bands
      if (didCompleteStrip) {
        const bandScore = calculateBandScore(aiBoard, action.targetBand, gameState.currentRoundTile);
        score += bandScore.total * 2; // Double weight for completing bands
      } else {
        // Progress towards completion
        score += targetBand.tiles.length * 2;
      }

      // Prefer lower column values (easier to complete)
      score += (9 - action.targetBand);

      // Bonus for round tile color matching
      if (gameState.currentRoundTile && action.color === gameState.currentRoundTile.color) {
        score += action.tiles.length * 3;
      }
    }

    // Penalty for excess tiles (broken glass)
    const availableSpaces = originalBand ? getAvailableMatchingSpaces(originalBand, action.color) : 0;
    const excessTiles = Math.max(0, action.tiles.length - availableSpaces);
    score -= excessTiles * 5;

    // Penalty for taking first player token from center
    if (action.source.type === 'center' && !gameState.isFirstPlayerTaken) {
      score -= 2;
    }
    // Bonus for larger draft groups
    score += action.tiles.length;

    return score;
  } catch {
    return -Infinity;
  }
};

// Evaluate reset then draft option
export const evaluateResetThenDraft = (gameState: GameState, action: DraftAction): number => {
  try {
    const resetState = executeResetAction(gameState);
    resetState.currentPlayer = 'ai';
    const modifiedAction = {
      ...action,
      targetBand: resetState.aiBoard.glazierPosition
    };

    const score = evaluateDraftOption(resetState, modifiedAction);
    return score - 3; // Penalty for needing to reset
  } catch {
    return -Infinity;
  }
};

// Evaluate all possible draft actions for AI
export const evaluateAllDraftOptions = (gameState: GameState): AIOption[] => {
  const options: AIOption[] = [];
  const aiBoard = gameState.aiBoard;
  
  // Evaluate factory options
  gameState.factories.forEach(factory => {
    if (factory.tiles.length === 0) return;
    
    // Group tiles by color
    const colorGroups = factory.tiles.reduce((groups, tile) => {
      if (!groups[tile.color]) groups[tile.color] = [];
      groups[tile.color].push(tile);
      return groups;
    }, {} as Record<TileColor, Tile[]>);

    // Evaluate each color option
    Object.entries(colorGroups).forEach(([color, tiles]) => {
      const tileColor = color as TileColor;
      const accessibleBands = getAccessibleBands(aiBoard);
      
      // Try placing on each accessible band
      accessibleBands.forEach(band => {
        if (canBandAcceptTiles(band, tileColor, tiles.length)) {
          const action: DraftAction = {
            type: 'draft',
            source: {
              type:'factory',
              id: factory.id
            },
            color: tileColor,
            tiles,
            targetBand: band.column
          };

          const score = evaluateDraftOption(gameState, action);

          options.push({
            action,
            score,
            needsReset: false
          });
        }
      });
      
      // If no accessible bands can take the tiles, consider reset + placement
      if (accessibleBands.every(band => !canBandAcceptTiles(band, tileColor, tiles.length))) {
        const resetScore = evaluateResetThenDraft(gameState, {
          type: 'draft',
          source: {
            type:'factory',
            id: factory.id
          },
          color: tileColor,
          tiles,
          targetBand: 1 // Will be recalculated after reset
        });
        
        if (resetScore > -Infinity) {
          options.push({
            action: {
              type: 'draft',
              source: {
                type:'factory',
                id: factory.id
              },
              color: tileColor,
              tiles,
              targetBand: 1
            },
            score: resetScore,
            needsReset: true
          });
        }
      }
    });
  });
  
  // Evaluate center options
  if (gameState.centerTiles.length > 0) {
    const colorGroups = gameState.centerTiles.reduce((groups, tile) => {
      if (!groups[tile.color]) groups[tile.color] = [];
      groups[tile.color].push(tile);
      return groups;
    }, {} as Record<TileColor, Tile[]>);

    Object.entries(colorGroups).forEach(([color, tiles]) => {
      const tileColor = color as TileColor;
      const accessibleBands = getAccessibleBands(aiBoard);
      
      accessibleBands.forEach(band => {
        if (canBandAcceptTiles(band, tileColor, tiles.length)) {
          const action: DraftAction = {
            type: 'draft',
            source: { type: 'center' },
            color: tileColor,
            tiles,
            targetBand: band.column
          };

          const score = evaluateDraftOption(gameState, action);

          options.push({
            action,
            score,
            needsReset: false
          });
        }
      });
      
      // Reset options for center tiles
      if (accessibleBands.every(band => !canBandAcceptTiles(band, tileColor, tiles.length))) {
        const resetScore = evaluateResetThenDraft(gameState, {
          type: 'draft',
          source: { type: 'center' },
          color: tileColor,
          tiles,
          targetBand: 1
        });
        
        if (resetScore > -Infinity) {
          options.push({
            action: {
              type: 'draft',
              source: { type: 'center' },
              color: tileColor,
              tiles,
              targetBand: 1
            },
            score: resetScore,
            needsReset: true
          });
        }
      }
    });
  }
  
  // Always consider standalone reset as an option
  options.push({
    action: { type: 'reset' },
    score: -1, // Small penalty for reset
    needsReset: false
  });
  
  return options;
};

// Calculate the best AI move based on difficulty
export const calculateAIMove = (gameState: GameState): GameAction => {
  const options = evaluateAllDraftOptions(gameState);

  if (options.length === 0) {
    return { type: 'reset' };
  }
  
  // Sort options by score (descending)
  const sortedOptions = options.sort((a, b) => b.score - a.score);

  const selectedOption = sortedOptions[0];

  // If the selected action needs a reset, perform reset first
  if (selectedOption.needsReset && selectedOption.action.type === 'draft') {
    // Return the reset action; the draft will be handled in the next turn
    return { type: 'reset' };
  }

  return selectedOption.action;
};
