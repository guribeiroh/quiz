"use client";

import { ReactNode, useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface ColumnTooltipProps {
  icon?: ReactNode;
  text: string;
  iconClassName?: string;
}

export function ColumnTooltip({ 
  icon = <FaInfoCircle />, 
  text, 
  iconClassName = 'text-gray-400'
}: ColumnTooltipProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className={`${iconClassName} text-xs hover:opacity-80 transition-opacity focus:outline-none`}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        aria-label={text}
      >
        {icon}
      </button>
      <AnimatePresence>
        {isTooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 w-60 p-2 bg-gray-900 text-xs text-gray-200 rounded-md shadow-lg border border-gray-700 left-1/2 -translate-x-1/2 bottom-full mb-2"
          >
            <div className="relative">
              {text}
              <div 
                className="absolute w-2 h-2 bg-gray-900 border-right border-bottom border-gray-700 transform rotate-45 left-1/2 -translate-x-1/2 -bottom-1"
                style={{ borderRight: '1px solid rgba(55, 65, 81, 1)', borderBottom: '1px solid rgba(55, 65, 81, 1)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 