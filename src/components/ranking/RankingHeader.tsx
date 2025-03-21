"use client";

import { motion } from 'framer-motion';
import { FaTrophy } from 'react-icons/fa';

export function RankingHeader() {
  return (
    <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 p-4 sm:p-5 md:p-8 text-white text-center">
      <div className="mx-auto mb-2 sm:mb-3 md:mb-4 bg-white/10 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-lg">
        <FaTrophy className="text-yellow-400 text-2xl sm:text-3xl md:text-4xl drop-shadow-md" />
      </div>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 md:mb-3 text-shadow">Ranking de Anatomia</h2>
      <p className="text-sm sm:text-base md:text-xl text-emerald-100">Veja como você se compara com outros estudantes!</p>
    </div>
  );
} 