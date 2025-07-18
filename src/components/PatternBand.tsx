import React from 'react';
import type {PatternBand as PatternBandType} from '../types/game';
import { COLUMN_VALUES } from '../types/game';
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
  const filledSlots = band.tiles.length;
  const emptySlots = band.maxCapacity - filledSlots;

  const glazierClass = playerType === 'human' ? 'glazier-human' : 'glazier-ai';

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
        min-h-[60px]
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
        {/* Filled slots */}
        {band.tiles.map((tile, index) => (
          <div
            key={tile.id}
            style={{ animationDelay: `${index * 0.1}s` }}
            className="animate-float"
          >
            <Tile
              tile={tile}
              size="small"
            />
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className={`
              w-6 h-6 rounded-lg border-2 border-dashed
              ${isAccessible ? 'border-gold-accent' : 'border-gray-600'}
              transition-all duration-300
              flex items-center justify-center
            `}
          >
            {isAccessible && isSelected && (
              <div className="w-2 h-2 bg-gold-accent rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Band status indicators */}
      <div className="flex flex-col items-center ml-3">
        {/* Completion status */}
        {band.isCompleted && !band.isRemoved && (
          <div className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold
            ${band.isFirstSide ? 
              'bg-green-500 border-green-500 text-foreground' : 
              'bg-blue-500 border-blue-500 text-foreground'
            }
          `}>
            {band.isFirstSide ? '1' : '2'}
          </div>
        )}

        {band.isRemoved && (
          <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-500 flex items-center justify-center text-xs font-bold text-foreground">
            ✗
          </div>
        )}

        {!band.isCompleted && !band.isRemoved && (
          <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center text-xs text-gray-400">
            {filledSlots}/{band.maxCapacity}
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
