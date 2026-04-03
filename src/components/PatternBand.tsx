import React from 'react';
import type {PatternBand as PatternBandType, TileColor} from '../types/game';
import { COLUMN_VALUES } from '../types/game';
import { getActivePattern, resolveBandSlots } from '../utils/gameLogic';
import Tile from './Tile';

interface PatternBandProps {
  band: PatternBandType;
  isAccessible?: boolean;
  hasGlazier?: boolean;
  onClick?: () => void;
  isInteractive?: boolean;
  isSelected?: boolean;
  playerType?: 'human' | 'ai';
}

export const PatternBand: React.FC<PatternBandProps> = ({
  band,
  isAccessible = false,
  hasGlazier = false,
  onClick,
  isInteractive = false,
  isSelected = false,
  playerType = 'human'
}) => {
  const columnValue = COLUMN_VALUES[band.column - 1];
  const activePattern = getActivePattern(band);
  const resolvedSlots = resolveBandSlots(band);
  const filledSlots = resolvedSlots.filter(Boolean).length;

  const glazierClass = playerType === 'human' ? 'glazier-human' : 'glazier-ai';
  const glazedTile = band.glazedTile;
  const patternSlotClass: Record<TileColor, string> = {
    blue: 'border-glass-blue bg-glass-blue/30 text-blue-100',
    red: 'border-glass-red bg-glass-red/30 text-red-100',
    yellow: 'border-glass-yellow bg-glass-yellow/30 text-yellow-100',
    green: 'border-glass-green bg-glass-green/30 text-green-100',
    orange: 'border-glass-orange bg-glass-orange/30 text-orange-100'
  };

  return (
    <div
      className={`
        pattern-band
        ${isAccessible ? 'accessible' : ''}
        ${isSelected ? 'ring-2 ring-gold-accent' : ''}
        ${isInteractive ? 'cursor-pointer hover:scale-105' : ''}
        ${band.isRemoved ? 'opacity-30' : ''}
        transition-all duration-300
        relative
        min-h-15
        flex items-center
        justify-between
        px-3
        py-2
      `}
      onClick={isInteractive ? onClick : undefined}
    >
      {/* Column number and value */}
      <div className="flex flex-col items-center mr-3">
        <div className="text-gold-accent font-bold text-lg">
          {band.column}
        </div>
        <div className="text-gray-400 text-xs">
          {columnValue}pt
        </div>
      </div>

      {/* Glazier position indicator */}
      {hasGlazier && (
        <div className={`
          absolute -top-2 left-1/2 transform -translate-x-1/2
          w-4 h-4 ${glazierClass}
          z-10
        `} />
      )}

      {/* Tile slots */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {activePattern.map((space, index) => {
          const tile = resolvedSlots[index];

          if (tile) {
            const slotPatternClass = space === 'joker' ? 'border-gray-300 bg-gray-500/20' : patternSlotClass[space];
            return (
              <div
                key={tile.id}
                style={{ animationDelay: `${index * 0.1}s` }}
                className={`
                  relative w-6 h-6 rounded-lg border shadow-inner
                  ${slotPatternClass}
                  animate-float
                `}
              >
                <Tile tile={tile} size="small" className="relative z-10" />
              </div>
            );
          }

          if (space === 'joker') {
            return (
              <div
                key={`pattern-joker-${band.id}-${index}`}
                className="relative w-6 h-6 rounded-lg border border-gray-300 bg-gray-500/30 flex items-center justify-center shadow-inner"
              >
                <span className="text-[9px] text-gray-100 font-bold">J</span>
                {isAccessible && isSelected && index === filledSlots && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gold-accent rounded-full animate-pulse" />
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={`pattern-${band.id}-${index}`}
              className={`
                relative w-6 h-6 rounded-lg border flex items-center justify-center
                shadow-inner
                ${patternSlotClass[space]}
                ${band.isRemoved ? 'grayscale opacity-60' : ''}
              `}
            >
              <span className="text-[9px] font-bold uppercase opacity-95">
                {space.charAt(0)}
              </span>
              <div
                className={`
                  absolute inset-0 rounded-lg border
                  ${patternSlotClass[space]}
                `}
              />
              {isAccessible && isSelected && index === filledSlots && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-gold-accent rounded-full animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Band status indicators */}
      <div className="flex flex-col items-center ml-3">
        {(glazedTile || band.secondGlazedTile) && (
          <div className="flex flex-col gap-1 mb-1">
            {glazedTile && (
              <Tile
                tile={glazedTile}
                size="small"
                className="ring-1 ring-gold-accent/70"
              />
            )}
            {band.secondGlazedTile && (
              <Tile
                tile={band.secondGlazedTile}
                size="small"
                className="ring-1 ring-gold-accent/70"
              />
            )}
          </div>
        )}

        {/* Completion status */}
        {!band.isRemoved ? (
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
            ${band.windowTiles.length > 0 ? 'bg-green-500 border-green-500 text-foreground' : 'border-gray-600 text-gray-400'}
          `}>
            {band.windowTiles.length}/2
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-500 flex items-center justify-center text-xs font-bold text-foreground">
            2/2
          </div>
        )}
      </div>

      {/* Accessibility glow */}
      {isAccessible && (
        <div className="absolute inset-0 rounded-lg border border-gold-accent opacity-30 animate-pulse" />
      )}

      {/* Selection highlight */}
      {isSelected && (
        <div className="absolute inset-0 bg-gold-accent bg-opacity-10 rounded-lg animate-pulse" />
      )}

      {/* Hover effect for interactive bands */}
      {isInteractive && isAccessible && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-gold-accent/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      )}
    </div>
  );
};

export default PatternBand;
