"use client";

import { useState } from 'react';
import { ColumnTooltipProps } from '@/types/ranking';

export function ColumnTooltip({ icon, text, iconClassName }: ColumnTooltipProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1 sm:ml-2">
      {/* Em dispositivos desktop, use hover */}
      <div 
        className={`hidden sm:block text-xs ${iconClassName || 'text-gray-500'} cursor-help transition-colors duration-200 hover:text-white group`}
      >
        {icon}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-gray-900/95 backdrop-blur-sm text-xs text-gray-200 rounded-lg shadow-xl z-10 
                      opacity-0 group-hover:opacity-100 invisible group-hover:visible 
                      transition-all duration-200 transform group-hover:translate-y-0 translate-y-1
                      pointer-events-none border border-gray-700">
          <div className="relative">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
          </div>
        </div>
      </div>
      
      {/* Em dispositivos móveis, use toque */}
      <div 
        className={`sm:hidden text-xs ${iconClassName || 'text-gray-500'} cursor-pointer transition-colors duration-200`}
        onClick={() => setIsTooltipVisible(!isTooltipVisible)}
      >
        {icon}
        {isTooltipVisible && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70" onClick={() => setIsTooltipVisible(false)}>
            <div className="bg-gray-800 m-4 p-4 rounded-lg border border-gray-700 max-w-xs" onClick={e => e.stopPropagation()}>
              <p className="text-sm text-gray-200 mb-3">{text}</p>
              <button 
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm transition-colors"
                onClick={() => setIsTooltipVisible(false)}
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 