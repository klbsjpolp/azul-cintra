import React from 'react';
import type { Tile as TileType, TileColor } from '../types/game';

interface TileProps {
  tile: TileType;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  isGlowing?: boolean;
  isSelected?: boolean;
}

const getTileColorClass = (color: TileColor): string => {
  switch (color) {
    case 'blue': return 'glass-tile-blue';
    case 'red': return 'glass-tile-red';
    case 'yellow': return 'glass-tile-yellow';
    case 'green': return 'glass-tile-green';
    case 'orange': return 'glass-tile-orange';
    default: return 'glass-tile';
  }
};

const getSizeClass = (size: 'small' | 'medium' | 'large'): string => {
  switch (size) {
    case 'small': return 'w-6 h-6';
    case 'medium': return 'w-8 h-8';
    case 'large': return 'w-12 h-12';
    default: return 'w-8 h-8';
  }
};

export const Tile: React.FC<TileProps> = ({
  tile,
  size = 'medium',
  onClick,
  className = '',
  isGlowing = false,
  isSelected = false
}) => {
  const colorClass = getTileColorClass(tile.color);
  const sizeClass = getSizeClass(size);
  
  const glowClass = isGlowing ? 'animate-glow' : '';
  const selectedClass = isSelected ? 'ring-2 ring-gold-accent ring-opacity-80' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';
  
  return (
    <div
      className={`
        ${colorClass}
        ${sizeClass}
        ${glowClass}
        ${selectedClass}
        ${clickableClass}
        ${className}
        flex items-center justify-center
        transition-all duration-300
        relative
        overflow-hidden
        pointer-events-none
      `}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-white/20 to-transparent opacity-50" />
      
      {/* Shimmer effect for selected tiles */}
      {isSelected && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
      )}
      
      {/* Color indicator dot */}
      <div className={`w-2 h-2 rounded-full bg-current opacity-80`} />
    </div>
  );
};

export default Tile;
