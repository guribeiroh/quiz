"use client";

import { useState, useEffect } from "react";
import { QuizRanking } from "@/components/QuizRanking";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaGift, FaTimes } from "react-icons/fa";

// Esta configuração evita a pré-renderização da página durante o build
export const dynamic = 'force-dynamic';

// Não é possível usar Metadata com "use client" directive
// O metadata precisa ser definido em um Server Component

export default function RankingPage() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Mostrar o popup após 1 segundo
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePopupClick = () => {
    setShowPopup(false);
    
    // Scroll suave até a seção de indicação
    setTimeout(() => {
      const infoSection = document.querySelector(".ranking-info-section");
      if (infoSection) {
        infoSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <>
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="fixed top-4 left-0 right-0 z-50 mx-auto max-w-md px-4"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg shadow-xl p-4 flex items-start border border-yellow-300">
              <div className="mr-3 bg-yellow-400 rounded-full p-2 flex-shrink-0">
                <FaGift className="text-amber-800 text-lg" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm sm:text-base">Multiplique suas chances no ranking!</h4>
                <p className="text-yellow-100 text-xs sm:text-sm">Ganhe +5 pontos por cada indicação. Clique aqui para saber mais!</p>
              </div>
              <button 
                onClick={() => setShowPopup(false)} 
                className="text-yellow-200 hover:text-white p-1"
                aria-label="Fechar aviso"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="relative" onClick={showPopup ? handlePopupClick : undefined}>
          <QuizRanking />
        </div>
      </Suspense>
    </>
  );
} 