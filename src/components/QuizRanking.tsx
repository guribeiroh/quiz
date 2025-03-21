"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaAward, FaCertificate, FaSpinner, FaClock, FaCheckCircle, FaStar } from 'react-icons/fa';
import { getQuizRanking } from '../lib/supabase';
import { Footer } from './Footer';

interface RankingEntry {
  user_name: string;
  score: number;
  total_time_spent: number;
  correct_answers: number;
  total_questions: number;
  referral_bonus_points?: number;
  total_score?: number;
}

export function QuizRanking() {
  const [isLoading, setIsLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Formatar tempo (segundos para minutos:segundos)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 px-4 py-6 sm:py-12 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="bg-emerald-700 p-5 sm:p-8 text-white text-center">
            <div className="mx-auto mb-3 sm:mb-4 bg-white/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
              <FaTrophy className="text-yellow-400 text-3xl sm:text-4xl" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Ranking de Anatomia</h2>
            <p className="text-base sm:text-xl">Veja como você se compara com outros estudantes!</p>
          </div>
          
          <div className="p-5 sm:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <FaSpinner className="animate-spin text-emerald-500 text-4xl mb-4" />
                <p className="text-gray-300">Carregando ranking...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/30 text-red-200 p-4 rounded-lg border border-red-800 text-center">
                {error}
              </div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-300">Nenhum dado de ranking disponível ainda.</p>
                <p className="text-gray-400 text-sm mt-2">Seja o primeiro a entrar para o ranking!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left border-b border-gray-700">
                    <tr className="bg-gray-800">
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Posição</th>
                      <th className="px-2 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome</th>
                      <th className="px-2 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Pontuação</th>
                      <th className="px-2 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Tempo</th>
                      <th className="px-2 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Acertos</th>
                      <th className="px-2 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Bônus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {ranking.map((entry, index) => (
                      <tr key={index} className={index < 3 ? 'bg-gray-800/50' : 'bg-gray-900'}>
                        <td className="px-2 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full 
                            {index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                             index === 1 ? 'bg-gray-400/20 text-gray-400' : 
                             index === 2 ? 'bg-amber-800/20 text-amber-800' : 'bg-gray-700/20 text-gray-400'}"
                          >
                            {index === 0 ? <FaTrophy /> : 
                             index === 1 ? <FaMedal /> : 
                             index === 2 ? <FaAward /> : 
                             <span className="text-sm">{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-white truncate max-w-[120px] sm:max-w-none">
                          {entry.user_name}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-emerald-500 font-semibold">{entry.total_score?.toFixed(1) || entry.score.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-right text-gray-300 hidden sm:table-cell">
                          {formatTime(entry.total_time_spent)}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-right text-gray-300 hidden sm:table-cell">
                          <span className="text-white">{entry.correct_answers}</span>
                          <span className="text-gray-500">/{entry.total_questions}</span>
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-right text-gray-300 hidden md:table-cell">
                          {entry.referral_bonus_points ? (
                            <div className="flex items-center justify-end">
                              <FaStar className="text-yellow-400 mr-1" />
                              <span className="text-yellow-400">+{entry.referral_bonus_points}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-8 bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">Como funciona o ranking?</h3>
              <p className="text-sm text-gray-300 mb-3">
                O ranking é baseado na pontuação obtida no quiz. Em caso de empate, o tempo de conclusão mais rápido determina a melhor posição.
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• A pontuação é calculada pelo percentual de respostas corretas</li>
                <li>• O tempo total inclui apenas o tempo efetivamente gasto em cada questão</li>
                <li>• O ranking é atualizado em tempo real a cada conclusão do quiz</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
} 