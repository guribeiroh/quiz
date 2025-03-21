"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGift, FaTimes, FaArrowRight } from 'react-icons/fa';
import { getQuizRanking } from '../lib/supabase';
import { Footer } from './Footer';
import { RankingEntry } from '@/types/ranking';
import { RankingHeader } from './ranking/RankingHeader';
import { RankingInfo } from './ranking/RankingInfo';
import { LoadingRanking } from './ranking/LoadingRanking';
import { RankingDesktopTable } from './ranking/RankingDesktopTable';
import { RankingMobileList } from './ranking/RankingMobileList';
import { formatTime } from './ranking/utils';

export function QuizRanking() {
  const [isLoading, setIsLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<'score' | 'time' | 'accuracy'>('score');
  
  useEffect(() => {
    // Garantir que o carregamento dos dados só aconteça no lado do cliente
    if (typeof window !== 'undefined') {
      loadRanking();
    }
    
    async function loadRanking() {
      try {
        setIsLoading(true);
        const result = await getQuizRanking(20); // Obter os 20 melhores
        
        if (result.success && result.data) {
          setRanking(result.data as RankingEntry[]);
        } else {
          setError('Não foi possível carregar o ranking. Tente novamente mais tarde.');
        }
      } catch (error) {
        console.error('Erro ao carregar o ranking:', error);
        setError('Erro ao carregar o ranking. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Função para alternar a exibição de informações detalhadas em dispositivos móveis
  const toggleExpandedEntry = (index: number) => {
    if (expandedEntry === index) {
      setExpandedEntry(null);
    } else {
      setExpandedEntry(index);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          <RankingHeader />
          
          <div className="p-4 sm:p-5 md:p-8">
            <RankingInfo />
            
            {isLoading ? (
              <LoadingRanking />
            ) : error ? (
              <div className="bg-red-900/30 text-red-200 p-3 sm:p-4 rounded-lg border border-red-800 text-center">
                {error}
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className="text-gray-300">Nenhum dado de ranking disponível ainda.</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">Seja o primeiro a entrar para o ranking!</p>
              </div>
            ) : (
              <>
                {/* Versão para desktop */}
                <RankingDesktopTable 
                  ranking={ranking}
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                  highlightedRow={highlightedRow}
                  setHighlightedRow={setHighlightedRow}
                  formatTime={formatTime}
                />
                
                {/* Versão para mobile */}
                <RankingMobileList 
                  ranking={ranking}
                  expandedEntry={expandedEntry}
                  toggleExpandedEntry={toggleExpandedEntry}
                  formatTime={formatTime}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}

// CSS adicional para sombra de texto
const styles = `
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
`;

// Adiciona o estilo ao documento
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
