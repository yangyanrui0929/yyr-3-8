import React from 'react';
import { GridCell as GridCellType, ToolType } from '../utils/constants';
import { Building } from './Building';

interface GridCellProps {
  cell: GridCellType;
  selectedTool: ToolType;
  highlighted: boolean;
  isRepairTarget: boolean;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

export const GridCellComponent: React.FC<GridCellProps> = ({
  cell,
  selectedTool,
  highlighted,
  isRepairTarget,
  onClick,
  onRightClick,
}) => {
  const isEmpty = cell.type === 'empty';
  const canPlace = isEmpty && selectedTool !== 'remove';
  const canRemove = !isEmpty && selectedTool === 'remove';
  const canRepair = cell.faulty;
  const hasRumor = cell.rumorLevel > 5;

  const getRumorOverlayStyle = () => {
    if (!hasRumor) return {};
    const intensity = Math.min(1, cell.rumorLevel / 100);
    return {
      backgroundColor: `rgba(239, 68, 68, ${intensity * 0.4})`,
    };
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={onRightClick}
      className={`
        relative w-14 h-14 border border-green-600/30 cursor-pointer
        transition-all duration-150 select-none
        ${isEmpty ? 'bg-green-400/40 hover:bg-green-300/60' : 'bg-green-500/50'}
        ${canPlace ? 'hover:ring-2 hover:ring-blue-400 hover:ring-inset' : ''}
        ${canRemove ? 'hover:ring-2 hover:ring-red-400 hover:ring-inset' : ''}
        ${canRepair ? 'ring-2 ring-orange-400 ring-inset animate-pulse' : ''}
        ${cell.powered && !cell.faulty ? 'bg-green-400/60' : ''}
        ${highlighted ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent animate-bounce z-20' : ''}
        ${isRepairTarget && canRepair ? 'ring-4 ring-red-500 ring-offset-4 ring-offset-white animate-pulse z-30 scale-110' : ''}
      `}
      style={{
        borderRadius: '4px',
      }}
    >
      {hasRumor && (
        <div
          className="absolute inset-0 pointer-events-none transition-colors duration-300"
          style={getRumorOverlayStyle()}
        />
      )}
      <Building cell={cell} />
      {isRepairTarget && canRepair && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-50 shadow-lg border-2 border-white animate-pulse">
          👆 点击这里维修
        </div>
      )}
      {canRepair && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${isRepairTarget ? 'bg-red-500/40' : 'bg-orange-500/20'}`}>
          <span className={`text-xs font-bold text-white drop-shadow-lg ${isRepairTarget ? 'animate-ping' : ''}`}>
            🔧{isRepairTarget ? '点我修复' : '维修'}
          </span>
        </div>
      )}
      {hasRumor && cell.type === 'house' && (
        <div className="absolute -top-1 -left-1 text-xs animate-bounce">
          💬
        </div>
      )}
    </div>
  );
};
