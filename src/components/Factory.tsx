import React, { useState } from 'react';
import type { Factory as FactoryType, TileColor } from '../types/game';
import Tile from './Tile';

interface FactoryProps {
  factory: FactoryType;
  onTileSelect?: (color: TileColor, factoryId: number) => void;
  isInteractive?: boolean;
  selectedColor?: TileColor | null;
}

export const Factory: React.FC<FactoryProps> = ({
  factory,
  onTileSelect,
  isInteractive = false,
  selectedColor = null
}) => {
  const [hoveredColor, setHoveredColor] = useState<TileColor | null>(null);

  // Group tiles by color for easier interaction
  const tilesByColor = factory.tiles.reduce((groups, tile) => {
    if (!groups[tile.color]) {
      groups[tile.color] = [];
    }
    groups[tile.color].push(tile);
    return groups;
  }, {} as Record<TileColor, typeof factory.tiles>);

  const handleColorClick = (color: TileColor) => {
    if (isInteractive && onTileSelect) {
      onTileSelect(color, factory.id);
    }
  };

  const isEmpty = factory.tiles.length === 0;

  return (
    <div className={`
      factory
      min-h-[120px]
      flex flex-col items-center justify-center
      relative
      transition-all duration-300
      ${isEmpty ? 'opacity-50' : ''}
    `}>
      {/* Factory label */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-dark-surface border border-gold-accent rounded-full flex items-center justify-center text-xs text-gold-accent font-bold">
        {factory.id + 1}
      </div>

      {isEmpty ? (
        <div className="text-gray-500 text-sm">Empty</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-2">
          {factory.tiles.map((tile) => {
            const isColorSelected = selectedColor === tile.color;
            const isColorHovered = hoveredColor === tile.color;
            const shouldGlow = isColorSelected || isColorHovered;
            
            return (
              <div
                key={tile.id}
                onMouseEnter={() => isInteractive && setHoveredColor(tile.color)}
                onMouseLeave={() => isInteractive && setHoveredColor(null)}
                onClick={() => handleColorClick(tile.color)}
                className={`
                  transition-all duration-200
                  ${isInteractive ? 'cursor-pointer hover:scale-105' : ''}
                `}
              >
                <Tile
                  tile={tile}
                  size="medium"
                  isGlowing={shouldGlow}
                  isSelected={isColorSelected}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Color selection indicator */}
      {isInteractive && !isEmpty && (hoveredColor || selectedColor) && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-dark-surface border border-gold-accent rounded-sm px-2 py-1 text-xs text-gold-accent">
            {tilesByColor[hoveredColor || selectedColor!]?.length || 0} tiles
          </div>
        </div>
      )}

      {/* Glow effect for interactive factories */}
      {isInteractive && !isEmpty && hoveredColor && (
        <div className="absolute inset-0 rounded-xl border-2 border-gold-accent opacity-50 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default Factory;