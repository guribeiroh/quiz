"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaBrain, FaArrowRight } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';

export function Welcome() {
  const { startQuiz } = useQuiz();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full max-w-[95%] sm:max-w-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <Image 
              src="/logo-anatomia-sem-medo.png"
              alt="Logo Anatomia Sem Medo"
              width={250}
              height={250}
              className="mx-auto"
              priority
            />
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-2">Quiz Anatomia Sem Medo</h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-6 px-1">
          Desafie seu conhecimento em anatomia e descubra o quanto você sabe!
        </p>
        
        <div className="bg-gray-800/70 backdrop-blur-md p-4 sm:p-6 rounded-xl mb-8 mx-auto border border-gray-700">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-emerald-400">Como funciona:</h2>
          
          <ul className="text-left space-y-4 sm:space-y-3">
            <li className="flex items-start">
              <span className="bg-emerald-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">1</span>
              <span className="text-sm sm:text-base">Responda 10 perguntas sobre anatomia com dificuldade crescente</span>
            </li>
            <li className="flex items-start">
              <span className="bg-emerald-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">2</span>
              <span className="text-sm sm:text-base">Receba feedback imediato e explicações detalhadas</span>
            </li>
            <li className="flex items-start">
              <span className="bg-emerald-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">3</span>
              <span className="text-sm sm:text-base">Ao final, ganhe um e-book exclusivo &quot;Como estudar Anatomia Humana&quot; 📚</span>
            </li>
          </ul>
        </div>
      </motion.div>
      
      <motion.button
        onClick={startQuiz}
        className="w-64 sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full text-lg sm:text-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl shadow-emerald-900/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Começar
        <FaArrowRight className="ml-2" />
      </motion.button>
      
      <p className="mt-8 text-gray-400 text-sm px-4 text-center">
        Centenas de estudantes já testaram seus conhecimentos!
      </p>
    </div>
  );
} 