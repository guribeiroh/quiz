"use client";

import { motion } from 'framer-motion';
import { FaCheck, FaClock, FaGift, FaInfoCircle, FaStar, FaTrophy, FaMedal, FaAward } from 'react-icons/fa';
import { ColumnTooltip } from './ColumnTooltip';
import { RankingEntry } from '@/types/ranking';

interface RankingMobileListProps {
  ranking: RankingEntry[];
  expandedEntry: number | null;
  toggleExpandedEntry: (index: number) => void;
  formatTime: (seconds: number) => string;
}

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

// Função para formatar nomes abreviando os sobrenomes do meio
const formatName = (fullName: string): string => {
  const nameParts = fullName.trim().split(' ');
  
  // Se tiver apenas um ou dois nomes, retorna o nome completo
  if (nameParts.length <= 2) {
    return fullName;
  }
  
  // Primeiro nome completo
  const firstName = nameParts[0];
  
  // Último sobrenome completo
  const lastName = nameParts[nameParts.length - 1];
  
  // Nomes do meio abreviados
  const middleNames = nameParts.slice(1, nameParts.length - 1).map(name => 
    name.charAt(0).toUpperCase() + '.'
  ).join(' ');
  
  return `${firstName} ${middleNames} ${lastName}`;
};

export function RankingMobileList({ 
  ranking, 
  expandedEntry, 
  toggleExpandedEntry,
  formatTime
}: RankingMobileListProps) {
  return (
    <div className="sm:hidden">
      {/* Legendas para os ícones */}
      <div className="flex items-center justify-end gap-2 mb-2 px-2">
        <div className="flex items-center bg-gray-800/60 px-2 py-1 rounded-full">
          <FaClock className="text-blue-400 mr-1 text-xs" />
          <span className="text-xs text-gray-300">Tempo de resposta</span>
        </div>
        <div className="flex items-center bg-gray-800/60 px-2 py-1 rounded-full">
          <FaStar className="text-yellow-400 mr-1 text-xs" />
          <span className="text-xs text-gray-300">Pontos por indicação</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2 py-3 bg-gray-800 border-b border-gray-700 mb-2 rounded-t-lg">
        <div className="text-xs font-medium text-gray-400 uppercase">Posição</div>
        <div className="text-xs font-medium text-gray-400 uppercase">Nome</div>
        <div className="text-xs font-medium text-gray-400 uppercase flex items-center">
          <span>Pontuação</span>
          <ColumnTooltip 
            icon={<FaInfoCircle className="ml-1" />} 
            text="Pontuação total: inclui tanto o desempenho no quiz quanto os pontos de bônus por indicações"
            iconClassName="text-emerald-500"
          />
        </div>
      </div>
      
      {ranking.map((entry, index) => (
        <div key={index} className="mb-2">
          <div 
            className={`flex items-center p-3 rounded-lg cursor-pointer ${index < 3 ? 'bg-gray-800/80' : 'bg-gray-900'} ${index === 0 ? 'border-l-4 border-yellow-500' : index === 1 ? 'border-l-4 border-gray-400' : index === 2 ? 'border-l-4 border-amber-700' : ''}`}
            onClick={() => toggleExpandedEntry(index)}
          >
            <div className="w-12 flex justify-center">
              {index === 0 ? (
                <motion.div 
                  animate={podiumAnimations.first}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <FaTrophy className="text-yellow-400 text-sm" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                      <FaTrophy className="text-yellow-100 text-sm" />
                    </div>
                  </div>
                </motion.div>
              ) : index === 1 ? (
                <motion.div 
                  animate={podiumAnimations.second}
                  className="flex flex-col items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md shadow-gray-400/20">
                    <FaMedal className="text-white text-sm" />
                  </div>
                </motion.div>
              ) : index === 2 ? (
                <motion.div 
                  animate={podiumAnimations.third}
                  className="flex flex-col items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md shadow-amber-700/20">
                    <FaAward className="text-amber-200 text-sm" />
                  </div>
                </motion.div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-700/40 flex items-center justify-center">
                  <span className="text-xs text-gray-400">{index + 1}</span>
                </div>
              )}
            </div>
            <div className="flex-1 ml-2">
              <div className="text-sm text-white truncate">
                {formatName(entry.user_name)}
              </div>
              <div className="flex items-center mt-1 space-x-2">
                <div className="flex items-center text-xs text-gray-400">
                  <FaClock className="text-blue-400 mr-1 text-[10px]" />
                  <span>{formatTime(entry.total_time_spent)}</span>
                </div>
                {entry.referral_bonus_points > 0 && (
                  <div className="flex items-center text-xs text-yellow-400">
                    <FaStar className="mr-1 text-[10px]" />
                    <span>+{entry.referral_bonus_points}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className={`font-semibold text-sm ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-emerald-500'}`}>
                {entry.total_score?.toFixed(1) || entry.score.toFixed(1)}
              </span>
            </div>
          </div>
          
          {expandedEntry === index && (
            <div className="bg-gray-800/50 p-3 rounded-b-lg border-t border-gray-700 text-xs grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1 flex items-center">
                  <FaClock className="text-blue-400 mr-1" />
                  Tempo
                </span>
                <span className="text-white">{formatTime(entry.total_time_spent)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1 flex items-center">
                  <FaCheck className="text-green-500 mr-1" />
                  Acertos
                </span>
                <span className="text-white">{entry.correct_answers}<span className="text-gray-500">/{entry.total_questions}</span></span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-gray-400 mb-1 flex items-center">
                  <FaGift className="text-yellow-400 mr-1" />
                  Bônus de indicação
                </span>
                {entry.referral_bonus_points ? (
                  <div className="flex items-center">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="text-yellow-400">+{entry.referral_bonus_points}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Nenhum bônus ainda</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 