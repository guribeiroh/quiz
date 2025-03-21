"use client";

import React from 'react';
import { QuizRanking } from "@/components/QuizRanking";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { FaTrophy } from "react-icons/fa";

// Esta configuração evita a pré-renderização da página durante o build
export const dynamic = 'force-dynamic';

// Não é possível usar Metadata com "use client" directive
// O metadata precisa ser definido em um Server Component

export default function RankingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl shadow-xl p-8 border border-gray-700 flex flex-col items-center max-w-md w-full"
        >
          <div className="bg-emerald-700/80 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <FaTrophy className="text-yellow-400 text-2xl" />
            </motion.div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Carregando Ranking</h3>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0 }}
              className="w-3 h-3 bg-yellow-400 rounded-full"
            />
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.2 }}
              className="w-3 h-3 bg-gray-400 rounded-full"
            />
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatType: "loop", ease: "easeInOut", delay: 0.4 }}
              className="w-3 h-3 bg-amber-600 rounded-full"
            />
          </div>
          
          <p className="text-emerald-400 text-sm text-center">
            Buscando os melhores estudantes de anatomia...
          </p>
        </motion.div>
      </div>
    }>
      <QuizRanking />
    </Suspense>
  );
} 