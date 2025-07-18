import React from 'react';
import type { PlayerBoard as PlayerBoardType, TileColor } from '../types/game';
import { getAccessibleBands } from '../utils/gameLogic';
import PatternBand from './PatternBand';

interface PlayerBoardProps {
  board: PlayerBoardType;
  playerType: 'human' | 'ai';
  onBandSelect?: (bandColumn: number) => void;
  selectedBand?: number | null;
  isInteractive?: boolean;
  currentRoundTile?: { color: TileColor } | null;
}

export const PlayerBoard: React.FC<PlayerBoardProps> = ({
  board,
  playerType,
  onBandSelect,
  selectedBand = null,
  isInteractive = false,
  currentRoundTile = null
}) => {
  const accessibleBands = getAccessibleBands(board);
  const accessibleColumns = accessibleBands.map(band => band.column);

  return (
    <div className="game-board w-full max-w-2xl">
      {/* Player header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
            ${playerType === 'human' ? 'glazier-human' : 'glazier-ai'}
          `}>
            {playerType === 'human' ? 'H' : 'AI'}
          </div>
          <h2 className="text-xl font-bold text-gold-accent">
            {playerType === 'human' ? 'Human Player' : 'AI Player'}
          </h2>
        </div>
        
        {/* Score display */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gold-accent">
              {board.score}
            </div>
            <div className="text-xs text-gray-400">Score</div>
          </div>
        </div>
      </div>

      {/* Current round tile indicator */}
      {currentRoundTile && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-dark-surface rounded-lg border border-gray-600">
          <span className="text-sm text-gray-300">Round Bonus:</span>
          <div className={`w-4 h-4 rounded-sm border glass-tile-${currentRoundTile.color}`} />
          <span className="text-xs text-gray-400">+1pt per tile</span>
        </div>
      )}

      {/* Pattern bands */}
      <div className="space-y-2 mb-4">
        {board.patternBands.map(band => (
          <PatternBand
            key={band.id}
            band={band}
            isAccessible={accessibleColumns.includes(band.column)}
            hasGlazier={board.glazierPosition === band.column}
            onClick={() => onBandSelect?.(band.column)}
            isInteractive={isInteractive && accessibleColumns.includes(band.column)}
            isSelected={selectedBand === band.column}
            playerType={playerType}
          />
        ))}
      </div>

      {/* Broken glass track */}
      <div className="broken-glass-track">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-red-300">Broken Glass</span>
          <span className="text-sm text-red-400">-{board.brokenGlass}</span>
        </div>
        
        <div className="relative h-6 bg-linear-to-r from-red-900/50 to-red-700/50 rounded-lg overflow-hidden">
          {/* Progress bar */}
          <div 
            className="absolute left-0 top-0 h-full bg-linear-to-r from-red-600 to-red-400 transition-all duration-500"
            style={{ width: `${Math.min((board.brokenGlass / 18) * 100, 100)}%` }}
          />
          
          {/* Glass fragments effect */}
          {Array.from({ length: Math.min(board.brokenGlass, 18) }).map((_, index) => (
            <div
              key={index}
              className="absolute top-1 w-1 h-4 bg-red-300 opacity-70 animate-pulse"
              style={{ 
                left: `${(index / 18) * 100}%`,
                animationDelay: `${index * 0.1}s`
              }}
            />
          ))}
          
          {/* Threshold markers */}
          <div className="absolute right-0 top-0 h-full w-0.5 bg-red-200 opacity-50" />
          <div className="absolute right-0 -top-1 text-xs text-red-200">-18</div>
        </div>
        
        {/* Warning when close to penalty */}
        {board.brokenGlass >= 15 && (
          <div className="mt-1 text-xs text-red-400 animate-pulse">
            Warning: Close to -18pt penalty!
          </div>
        )}
      </div>

      {/* Glazier position indicator */}
      <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
        <span>Glazier at column:</span>
        <span className="text-gold-accent font-bold">{board.glazierPosition}</span>
        <span className="text-xs">
          (Accessible: {accessibleColumns.join(', ')})
        </span>
      </div>

      {/* Reset glazier button for interactive mode */}
      {isInteractive && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => onBandSelect?.(0)} // 0 indicates reset action
            className="px-4 py-2 bg-dark-surface border border-gold-accent rounded-lg text-gold-accent hover:bg-gold-accent hover:text-black transition-all duration-300"
          >
            Reset Glazier
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerBoard;