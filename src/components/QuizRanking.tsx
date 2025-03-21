"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaAward, FaSpinner, FaStar, FaCrown } from 'react-icons/fa';
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
  
  // Animações para o pódio
  const podiumAnimations = {
    first: {
      scale: [1, 1.1, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    second: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }
    },
    third: {
      scale: [1, 1.05, 1], 
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }
    }
  };
  
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
                      <tr 
                        key={index} 
                        className={`${index < 3 ? 'bg-gray-800/80' : 'bg-gray-900'} ${index === 0 ? 'border-l-4 border-yellow-500' : index === 1 ? 'border-l-4 border-gray-400' : index === 2 ? 'border-l-4 border-amber-700' : ''}`}
                      >
                        <td className="px-2 py-4 whitespace-nowrap">
                          {index === 0 ? (
                            <motion.div 
                              animate={podiumAnimations.first}
                              className="flex flex-col items-center justify-center"
                            >
                              <div className="relative">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <FaCrown className="text-yellow-400 text-lg" />
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                                  <FaTrophy className="text-yellow-100 text-xl" />
                                </div>
                              </div>
                              <span className="text-yellow-400 text-xs font-bold mt-1">1°</span>
                            </motion.div>
                          ) : index === 1 ? (
                            <motion.div 
                              animate={podiumAnimations.second}
                              className="flex flex-col items-center justify-center"
                            >
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md shadow-gray-400/20">
                                <FaMedal className="text-white text-lg" />
                              </div>
                              <span className="text-gray-300 text-xs font-bold mt-1">2°</span>
                            </motion.div>
                          ) : index === 2 ? (
                            <motion.div 
                              animate={podiumAnimations.third}
                              className="flex flex-col items-center justify-center"
                            >
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md shadow-amber-700/20">
                                <FaAward className="text-amber-200 text-lg" />
                              </div>
                              <span className="text-amber-600 text-xs font-bold mt-1">3°</span>
                            </motion.div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-gray-700/40 flex items-center justify-center">
                                <span className="text-xs text-gray-400">{index + 1}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-white truncate max-w-[120px] sm:max-w-none">
                          {entry.user_name}
                        </td>
                        <td className="px-2 py-4 whitespace-nowrap text-sm text-right">
                          <div className="flex items-center justify-end">
                            <span className={`font-semibold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-emerald-500'}`}>
                              {entry.total_score?.toFixed(1) || entry.score.toFixed(1)}
                            </span>
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
                Sua posição no ranking é determinada por uma combinação de desempenho no quiz e pontos de bônus por indicações. Supere seus colegas e conquiste o topo!
              </p>
              <ul className="text-xs text-gray-400 space-y-1 mb-3">
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-1">•</span>
                  <span>Pontuação base: percentual de respostas corretas no quiz (máximo 100 pontos)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-1">•</span>
                  <span>Bônus de indicação: ganhe <strong className="text-yellow-400">+5 pontos</strong> cada vez que alguém usar seu código</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-1">•</span>
                  <span>Bônus de uso: receba <strong className="text-yellow-400">+10 pontos</strong> quando você usar o código de outro participante</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-400 mr-1">•</span>
                  <span>Desempate: em caso de pontuação igual, o menor tempo de conclusão determina a melhor posição</span>
                </li>
              </ul>
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
                <p className="text-sm text-emerald-300">Compartilhe seu código de referência para ganhar pontos!</p>
                <p className="text-xs text-gray-400 mt-1">Não há limite para os pontos de bônus que você pode acumular.</p>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="mt-6 text-center">
          <a href="/" className="text-emerald-400 hover:text-emerald-300 text-sm underline">← Voltar para o Quiz</a>
        </div>
      </div>
      <Footer />
    </div>
  );
}
