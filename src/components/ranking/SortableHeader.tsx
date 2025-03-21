"use client";

import { FaChevronDown, FaInfoCircle } from 'react-icons/fa';
import { SortableHeaderProps } from '@/types/ranking';
import { ColumnTooltip } from './ColumnTooltip';

export function SortableHeader({ 
  title, 
  tooltip, 
  tooltipText, 
  tooltipIcon, 
  sortValue, 
  className,
  width,
  align = 'right',
  icon,
  sortKey,
  setSortKey
}: SortableHeaderProps & { 
  sortKey: 'score' | 'time' | 'accuracy',
  setSortKey: (key: 'score' | 'time' | 'accuracy') => void 
}) {
  return (
    <th className={`p-0 text-xs font-medium text-gray-300 uppercase tracking-wider ${className || ''}`} style={width ? {width} : {}}>
      <div className={`flex items-center ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'} h-full px-2 py-3`}>
        {icon && <span className="mr-1.5">{icon}</span>}
        {sortValue && (
          <button 
            onClick={() => setSortKey(sortValue)}
            className={`flex items-center transition-colors hover:text-emerald-400 ${sortKey === sortValue ? 'text-emerald-400' : ''}`}
          >
            <span>{title}</span>
            {sortKey === sortValue && (
              <FaChevronDown className="ml-1 text-xs" />
            )}
          </button>
        )}
        {!sortValue && <span>{title}</span>}
        {tooltip && tooltipText && (
          <ColumnTooltip 
            icon={<FaInfoCircle />} 
            text={tooltipText}
            iconClassName={tooltipIcon || 'text-emerald-500'}
          />
        )}
      </div>
    </th>
  );
} 