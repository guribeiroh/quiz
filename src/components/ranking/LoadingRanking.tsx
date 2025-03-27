"use client";

import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

export function LoadingRanking() {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-10">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-emerald-500 text-3xl sm:text-4xl mb-3 sm:mb-4"
      >
        <FaSpinner />
      </motion.div>
      <p className="text-gray-300">Carregando ranking...</p>
      <p className="text-gray-400 text-xs mt-2">Exibindo os 20 primeiros colocados</p>
    </div>
  );
} 