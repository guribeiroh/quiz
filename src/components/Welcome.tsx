"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaTrophy } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';
import { Footer } from './Footer';
import { trackStepView, FunnelStep } from '../lib/analytics';
import { generateSessionId } from '../lib/sessionUtils';

export function Welcome() {
  const { startQuiz } = useQuiz();
  
  // Rastrear visualização da página de boas-vindas
  useEffect(() => {
    // Garantir que há um ID de sessão
    const sessionId = generateSessionId();
    
    // Rastrear o evento de visualização
    trackStepView(FunnelStep.WELCOME, sessionId)
      .catch(error => console.error('Erro ao rastrear visualização:', error));
      
    // Registrar evento de pageview
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as {gtag: (event: string, action: string, params: Record<string, unknown>) => void}).gtag('event', 'page_view', {
        page_title: 'Welcome',
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <Link href="/ranking" passHref>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center bg-emerald-600/80 hover:bg-emerald-600 px-4 py-2 rounded-full text-white text-sm font-medium"
          >
            <FaTrophy className="mr-2 text-yellow-300" />
            Ver Ranking
          </motion.div>
        </Link>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center w-full max-w-[95%] sm:max-w-2xl"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4">
            <Image 
              src="/images/logo-anatomia-sem-medo.png"
              alt="Logo Anatomia Sem Medo"
              width={250}
              height={250}
              className="mx-auto"
              priority
              unoptimized={true}
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
        Centenas de estudantes já testaram seus conhecimentos! <Link href="/ranking" className="text-emerald-400 hover:underline">Confira o ranking</Link>
      </p>
      
      <Footer />
    </div>
  );
} 