"use client";

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaTrophy, FaGift, FaCheckCircle } from 'react-icons/fa';
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
    <div className="flex flex-col items-center justify-between min-h-screen px-4 py-6 bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      {/* Botão de Ranking no topo */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <Link href="/ranking" passHref>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center bg-emerald-600/80 hover:bg-emerald-600 px-3 py-1.5 rounded-full text-white text-xs sm:text-sm font-medium"
          >
            <FaTrophy className="mr-1.5 text-yellow-300 text-xs sm:text-sm" />
            Ver Ranking
          </motion.div>
        </Link>
      </div>
      
      {/* Conteúdo Principal */}
      <div className="w-full flex flex-col items-center justify-start flex-1 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-[95%] sm:max-w-2xl"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-4">
            <Image 
              src="/images/logo-anatomia-sem-medo.png"
              alt="Logo Anatomia Sem Medo"
              width={180}
              height={180}
              className="mx-auto"
              priority
              unoptimized={true}
            />
          </div>
          
          {/* Destaques qualitativos em vez de números */}
          <div className="mb-3">
            <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-3 inline-flex items-center justify-center">
              <FaCheckCircle className="mr-2 text-emerald-400 text-xs sm:text-sm" />
              <span className="text-xs sm:text-sm font-medium">Recomendado por professores e estudantes</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 px-2 bg-gradient-to-r from-white to-emerald-300 text-transparent bg-clip-text">Desafie Seus Conhecimentos em Anatomia</h1>
          </div>
          
          {/* Botão de Ação - AGORA PRIMEIRO */}
          <div className="mb-4 flex flex-col items-center">
            <motion.button
              onClick={startQuiz}
              className="w-64 sm:w-72 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 px-6 rounded-full text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-xl shadow-emerald-900/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Iniciar Quiz Gratuito
              <FaArrowRight className="ml-2" />
            </motion.button>
            
            <p className="mt-3 text-emerald-300 text-xs sm:text-sm px-2 text-center font-medium">
              Avalie seu conhecimento e ganhe o e-book!
            </p>
          </div>
          
          {/* Card de Bônus - AGORA SEGUNDO */}
          <div className="bg-gray-800/70 border-2 border-yellow-500/50 backdrop-blur-md p-5 rounded-xl max-w-md mx-auto shadow-lg shadow-yellow-900/10">
            <div className="flex items-center justify-center mb-2">
              <FaGift className="text-yellow-400 mr-2 text-xl" />
              <h3 className="text-xl font-bold text-yellow-300">BÔNUS GRATUITO</h3>
            </div>
            <p className="text-white text-base mb-3 text-center">
              E-book exclusivo de anatomia!
            </p>
            <div className="pt-2 border-t border-gray-700">
              <p className="text-emerald-300 font-semibold text-center text-sm">
                Entregue ao finalizar o quiz
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Footer restaurado */}
      <Footer />
    </div>
  );
} 