"use client";

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  total: number;
}

export function ProgressBar({ progress, total }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (progress / total) * 100));
  
  return (
    <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
      <motion.div 
        className="h-full bg-emerald-500"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ type: "spring", stiffness: 60 }}
      />
    </div>
  );
} 