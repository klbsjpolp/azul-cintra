import React, { useState } from 'react';
import type { Tile as TileType, TileColor } from '../types/game';
import Tile from './Tile';

interface CenterProps {
  tiles: TileType[];
  onTileSelect?: (color: TileColor) => void;
  isInteractive?: boolean;
  selectedColor?: TileColor | null;
  hasFirstPlayerToken?: boolean;
  firstPlayerToken?: 'human' | 'ai' | null;
}

export const Center: React.FC<CenterProps> = ({
  tiles,
  onTileSelect,
  isInteractive = false,
  selectedColor = null,
  hasFirstPlayerToken = false,
  firstPlayerToken = null
}) => {
  const [hoveredColor, setHoveredColor] = useState<TileColor | null>(null);

  // Group tiles by color
  const tilesByColor = tiles.reduce((groups, tile) => {
    if (!groups[tile.color]) {
      groups[tile.color] = [];
    }
    groups[tile.color].push(tile);
    return groups;
  }, {} as Record<TileColor, TileType[]>);

  const handleColorClick = (color: TileColor) => {
    if (isInteractive && onTileSelect) {
      onTileSelect(color);
    }
  };

  const isEmpty = tiles.length === 0 && !hasFirstPlayerToken;
  const colors = Object.keys(tilesByColor) as TileColor[];

  return (
    <div className={`
      factory
      min-h-[160px]
      flex flex-col items-center justify-center
      relative
      transition-all duration-300
      ${isEmpty ? 'opacity-50' : ''}
    `}>
      {/* Center label */}
      <div className="absolute -top-2 -left-2 w-8 h-6 bg-dark-surface border border-gold-accent rounded-sm flex items-center justify-center text-xs text-gold-accent font-bold">
        CENTER
      </div>

      {/* First Player Token */}
      {hasFirstPlayerToken && (
        <div className="absolute -top-4 -right-4 z-10">
          <div className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold
            ${firstPlayerToken === 'human' ? 'bg-glass-blue border-glass-blue text-foreground' : 
              firstPlayerToken === 'ai' ? 'bg-glass-red border-glass-red text-foreground' :
              'bg-gold-accent border-gold-accent text-black animate-glow'}
            transition-all duration-300
          `}>
            1st
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="text-gray-500 text-sm">Empty</div>
      ) : (
        <div className="flex flex-wrap gap-1 p-3 max-w-[200px] justify-center">
          {colors.map(color => {
            const colorTiles = tilesByColor[color];
            const isColorSelected = selectedColor === color;
            const isColorHovered = hoveredColor === color;
            const shouldGlow = isColorSelected || isColorHovered;
            
            return (
              <div
                key={color}
                className={`
                  flex flex-wrap gap-1
                  transition-all duration-200
                  ${isInteractive ? 'cursor-pointer' : ''}
                `}
                onMouseEnter={() => isInteractive && setHoveredColor(color)}
                onMouseLeave={() => isInteractive && setHoveredColor(null)}
                onClick={() => handleColorClick(color)}
              >
                {colorTiles.map((tile) => (
                  <Tile
                    key={tile.id}
                    tile={tile}
                    size="small"
                    isGlowing={shouldGlow}
                    isSelected={isColorSelected}
                    className={`
                      ${shouldGlow ? 'scale-110' : ''}
                      transition-all duration-200
                    `}
                  />
                ))}
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
            {hasFirstPlayerToken && hoveredColor && (
              <span className="ml-2 text-red-400">+1st player</span>
            )}
          </div>
        </div>
      )}

      {/* Glow effect for interactive center */}
      {isInteractive && !isEmpty && hoveredColor && (
        <div className="absolute inset-0 rounded-xl border-2 border-gold-accent opacity-50 animate-pulse pointer-events-none" />
      )}

      {/* First player token warning */}
      {isInteractive && hasFirstPlayerToken && hoveredColor && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-red-900 border border-red-500 rounded-sm px-2 py-1 text-xs text-red-300">
            -1 Broken Glass
          </div>
        </div>
      )}
    </div>
  );
};

export default Center;