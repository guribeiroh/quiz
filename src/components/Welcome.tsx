"use client";

import { motion } from 'framer-motion';
import { FaBrain, FaArrowRight } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';

export function Welcome() {
  const { startQuiz } = useQuiz();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <FaBrain className="text-6xl text-emerald-500" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Quiz Anatomia Sem Medo</h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-6">
          Desafie seu conhecimento em anatomia e descubra o quanto você sabe!
        </p>
        
        <div className="bg-gray-800/70 backdrop-blur-md p-6 rounded-xl mb-8 max-w-2xl mx-auto border border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-emerald-400">Como funciona:</h2>
          
          <ul className="text-left space-y-3">
            <li className="flex items-start">
              <span className="bg-emerald-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">1</span>
              <span>Responda 10 perguntas sobre anatomia com dificuldade crescente</span>
            </li>
            <li className="flex items-start">
              <span className="bg-emerald-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">2</span>
              <span>Receba feedback imediato e explicações detalhadas</span>
            </li>
            <li className="flex items-start">
              <span className="bg-emerald-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">3</span>
              <span>Ao final, ganhe um e-book exclusivo &quot;Guia Definitivo para Estudar Anatomia&quot; 📚</span>
            </li>
          </ul>
        </div>
      </motion.div>
      
      <motion.button
        onClick={startQuiz}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl flex items-center transition-all shadow-lg hover:shadow-xl shadow-emerald-900/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Começar o Desafio
        <FaArrowRight className="ml-2" />
      </motion.button>
      
      <p className="mt-8 text-gray-400 text-sm">
        Mais de 1.000 estudantes já testaram seus conhecimentos!
      </p>
    </div>
  );
} 