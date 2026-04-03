import React, { useState, useEffect, useCallback } from 'react';
import type {GameState, TileColor, DraftAction, Source} from '../types/game';
import {
  initializeGame,
  executeDraftAction,
  executeResetAction,
  getAccessibleBands,
  getAvailableMatchingSpaces,
  isRoundOver,
  prepareNextRound
} from '../utils/gameLogic';
import { calculateAIMove } from '../utils/aiLogic';
import Factory from './Factory';
import Center from './Center';
import PlayerBoard from './PlayerBoard';


export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedColor, setSelectedColor] = useState<TileColor | null>(null);
  const [selectedBand, setSelectedBand] = useState<number | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [gameMessage, setGameMessage] = useState<string>('');

  // Handle factory tile selection
  const handleFactoryTileSelect = useCallback((color: TileColor, factoryId: number) => {
    if (gameState.currentPlayer !== 'human' || isProcessingAI) return;
    
    setSelectedSource({ type: 'factory', id: factoryId });
    setSelectedColor(color);
    setSelectedBand(null);
    setGameMessage(`Selected ${color} tiles from factory ${factoryId + 1}. Choose a pattern band.`);
  }, [gameState.currentPlayer, isProcessingAI]);

  // Handle center tile selection
  const handleCenterTileSelect = useCallback((color: TileColor) => {
    if (gameState.currentPlayer !== 'human' || isProcessingAI) return;
    
    setSelectedSource({ type: 'center' });
    setSelectedColor(color);
    setSelectedBand(null);
    setGameMessage(`Selected ${color} tiles from center. Choose a pattern band.`);
  }, [gameState.currentPlayer, isProcessingAI]);

  // Handle pattern band selection
  const handleBandSelect = useCallback((bandColumn: number) => {
    if (gameState.currentPlayer !== 'human' || isProcessingAI) return;

    // Handle reset glazier action
    if (bandColumn === 0) {
      // Check if glazier is already at the first available position
      const currentBoard = gameState.currentPlayer === 'human' ? gameState.humanBoard : gameState.aiBoard;
      const accessibleBands = currentBoard.patternBands.filter(band => !band.isRemoved);
      const firstAvailablePosition = accessibleBands.length > 0 ? Math.min(...accessibleBands.map(band => band.column)) : 1;

      if (currentBoard.glazierPosition === firstAvailablePosition) {
        setGameMessage('Glazier is already at the first available position. Cannot reset.');
        return;
      }

      const newState = executeResetAction(gameState);
      setGameState({ ...newState, currentPlayer: 'ai' });
      setSelectedSource(null);
      setSelectedColor(null);
      setSelectedBand(null);
      setGameMessage('Glazier reset. AI turn.');
      return;
    }

    // Handle draft action
    if (selectedSource && selectedColor) {
      const humanBoard = gameState.humanBoard;
      const targetBand = humanBoard.patternBands.find(b => b.column === bandColumn);
      if (!targetBand) return;

      // Get tiles from source
      let tiles;
      if (selectedSource.type === 'factory') {
        const factory = gameState.factories.find(f => f.id === selectedSource.id);
        if (!factory) return;
        tiles = factory.tiles.filter(tile => tile.color === selectedColor);
      } else {
        tiles = gameState.centerTiles.filter(tile => tile.color === selectedColor);
      }

      const reachableBands = getAccessibleBands(humanBoard);
      const hasReachableMatch = reachableBands.some(band => getAvailableMatchingSpaces(band, selectedColor) > 0);
      const availableMatchingSpaces = getAvailableMatchingSpaces(targetBand, selectedColor);

      if (availableMatchingSpaces === 0 && hasReachableMatch) {
        setGameMessage('This strip cannot take that color. Choose a reachable strip with matching spaces or jokers.');
        return;
      }

      // Execute draft action (pass both band and overflow tiles)
      const draftAction: DraftAction = {
        type: 'draft',
        source: selectedSource,
        color: selectedColor,
        tiles,
        targetBand: bandColumn,
      };

      const newState = executeDraftAction(gameState, draftAction);
      setGameState({ ...newState, currentPlayer: 'ai' });
      setSelectedSource(null);
      setSelectedColor(null);
      setSelectedBand(null);
      setGameMessage('Move completed. AI turn.');
    } else {
      setSelectedBand(bandColumn);
      setGameMessage(`Selected band ${bandColumn}. Choose tiles from factories or center.`);
    }
  }, [gameState, selectedSource, selectedColor, isProcessingAI]);

  // Process AI turn
  const processAITurn = useCallback(async () => {
    if (gameState.currentPlayer !== 'ai' || isProcessingAI) return;

    setIsProcessingAI(true);
    setGameMessage('AI is thinking...');

    // Add delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const aiAction = calculateAIMove(gameState);
      let newState;

      if (aiAction.type === 'reset') {
        newState = executeResetAction(gameState);
        setGameMessage('AI reset glazier.');
      } else {
        newState = executeDraftAction(gameState, aiAction);
        setGameMessage(`AI took ${aiAction.color} tiles and placed them in column ${aiAction.targetBand}.`);
      }

      setGameState({ ...newState, currentPlayer: 'human' });
    } catch (error) {
      console.error('AI move error:', error);
      setGameMessage('AI encountered an error. Skipping turn.');
      setGameState({ ...gameState, currentPlayer: 'human' });
    }

    setIsProcessingAI(false);
  }, [gameState, isProcessingAI]);

  // Check for round/game end
  useEffect(() => {
    if (isRoundOver(gameState)) {
      if (gameState.round >= 6) {
        setGameMessage('Game Over! Calculating final scores...');
        setGameState({ ...gameState, gamePhase: 'gameEnd' });
      } else {
        setGameMessage(`Round ${gameState.round} complete. Starting round ${gameState.round + 1}...`);
        setTimeout(() => {
          const newState = prepareNextRound(gameState);
          setGameState(newState);
          setGameMessage(`Round ${newState.round} started!`);
        }, 1500);
      }
    }
  }, [gameState.round, gameState.factories, gameState.centerTiles, gameState.gamePhase, gameState]);

  // Process AI turn when it's AI's turn
  useEffect(() => {
    if (gameState.currentPlayer === 'ai' && !isProcessingAI && gameState.gamePhase === 'playing') {
      processAITurn();
    }
  }, [gameState.currentPlayer, gameState.gamePhase, processAITurn, isProcessingAI]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(initializeGame());
    setSelectedSource(null);
    setSelectedColor(null);
    setSelectedBand(null);
    setGameMessage('New game started!');
  }, []);

  const isHumanTurn = gameState.currentPlayer === 'human' && !isProcessingAI;

  // noinspection SqlNoDataSourceInspection
  return (
    <div className="min-h-screen text-foreground p-4">
      {/* Game header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-gold-accent">Azul: Sintra</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-gold-accent">Round {gameState.round}/6</div>
              <div className="text-sm text-gray-400">
                {gameState.currentPlayer === 'human' ? 'Your Turn' : 'AI Turn'}
              </div>
            </div>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-dark-surface border border-gold-accent rounded-lg text-gold-accent hover:bg-gold-accent hover:text-black transition-all duration-300"
            >
              New Game
            </button>
          </div>
        </div>

        {/* Game message */}
        <div className="bg-dark-surface border border-gray-600 rounded-lg p-3 text-center">
          <p className="text-gold-accent">{gameMessage || 'Select tiles from factories or center, then choose a pattern band.'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Human player board */}
        <div className="xl:col-span-1">
          <PlayerBoard
            board={gameState.humanBoard}
            playerType="human"
            onBandSelect={handleBandSelect}
            selectedBand={selectedBand}
            isInteractive={isHumanTurn}
            currentRoundTile={gameState.currentRoundTile}
          />
        </div>

        {/* Center column - Factories and center */}
        <div className="xl:col-span-1 flex flex-col items-center gap-6">
          {/* Current round tile */}
          {gameState.currentRoundTile && (
            <div className="bg-dark-surface border border-gold-accent rounded-lg p-4 text-center">
              <div className="text-sm text-gray-300 mb-2">Round Bonus Tile</div>
              <div className={`w-8 h-8 mx-auto glass-tile-${gameState.currentRoundTile.color} rounded-lg`} />
            </div>
          )}

          {/* Factories */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {gameState.factories.map(factory => (
              <Factory
                key={factory.id}
                factory={factory}
                onTileSelect={handleFactoryTileSelect}
                isInteractive={isHumanTurn}
                selectedColor={selectedSource?.type === 'factory' && selectedSource.id === factory.id ? selectedColor : null}
              />
            ))}
          </div>

          {/* Center */}
          <Center
            tiles={gameState.centerTiles}
            onTileSelect={handleCenterTileSelect}
            isInteractive={isHumanTurn}
            selectedColor={selectedSource?.type === 'center' ? selectedColor : null}
            hasFirstPlayerToken={!gameState.isFirstPlayerTaken}
            firstPlayerToken={gameState.firstPlayerToken}
          />
        </div>

        {/* Right column - AI player board */}
        <div className="xl:col-span-1">
          <PlayerBoard
            board={gameState.aiBoard}
            playerType="ai"
            isInteractive={false}
            currentRoundTile={gameState.currentRoundTile}
          />
        </div>
      </div>
    </div>
  );
};

export default Game;
