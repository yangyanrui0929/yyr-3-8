import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { GRID_SIZE } from '../utils/constants';

export const RumorMap: React.FC = () => {
  const grid = useGameStore((state) => state.grid);

  const getRumorColor = (rumorLevel: number) => {
    if (rumorLevel <= 0) return 'transparent';
    const intensity = Math.min(1, rumorLevel / 100);
    const r = Math.round(239 + (1 - intensity) * 16);
    const g = Math.round(68 + (1 - intensity) * 187);
    const b = Math.round(68 + (1 - intensity) * 187);
    return `rgba(${r}, ${g}, ${b}, ${0.3 + intensity * 0.5})`;
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50">
      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        🗺️ 传闻地图
      </h3>
      <div
        className="grid gap-1 p-2 bg-gray-100 rounded-xl"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className="aspect-square rounded-sm relative"
              style={{
                backgroundColor: cell.type === 'empty' ? '#e5e7eb' : '#86efac',
                border: cell.type === 'house' ? '2px solid #16a34a' : '1px solid #d1d5db',
              }}
            >
              <div
                className="absolute inset-0 rounded-sm transition-all duration-300"
                style={{
                  backgroundColor: getRumorColor(cell.rumorLevel),
                }}
              />
              {cell.type === 'house' && (
                <span className="absolute inset-0 flex items-center justify-center text-xs">
                  🏠
                </span>
              )}
              {cell.type === 'broadcastTower' && (
                <span className="absolute inset-0 flex items-center justify-center text-xs">
                  📡
                </span>
              )}
              {cell.faulty && (
                <span className="absolute -top-1 -right-1 text-xs">⚠️</span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <span>无传闻</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-red-400/70" />
          <span>高传闻</span>
        </div>
      </div>
    </div>
  );
};
