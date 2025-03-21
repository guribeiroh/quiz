"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaCheck, FaStar, FaTrophy, FaMedal, FaAward, FaCrown } from 'react-icons/fa';
import { SortableHeader } from './SortableHeader';
import { RankingEntry } from '@/types/ranking';

interface RankingDesktopTableProps {
  ranking: RankingEntry[];
  sortKey: 'score' | 'time' | 'accuracy';
  setSortKey: (key: 'score' | 'time' | 'accuracy') => void;
  highlightedRow: number | null;
  setHighlightedRow: (index: number | null) => void;
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

// Animações para a tabela
const tableVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      when: "beforeChildren" 
    } 
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100,
      damping: 12
    } 
  }
};

export function RankingDesktopTable({ 
  ranking, 
  sortKey, 
  setSortKey, 
  highlightedRow, 
  setHighlightedRow,
  formatTime 
}: RankingDesktopTableProps) {
  return (
    <div className="hidden sm:block rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden">
      <div className="w-full">
        <motion.table 
          className="w-full table-fixed"
          initial="hidden"
          animate="visible"
          variants={tableVariants}
        >
          <thead className="border-b border-gray-700 bg-gray-900">
            <tr>
              <SortableHeader 
                title="Posição" 
                width="15%" 
                align="center" 
                icon={<span className="text-gray-400 text-xs opacity-80">#</span>}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
              <SortableHeader 
                title="Nome" 
                width="30%" 
                align="left"
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
              <SortableHeader 
                title="Pontuação" 
                tooltip={true} 
                tooltipText="Pontuação total: inclui tanto o desempenho no quiz quanto os pontos de bônus por indicações"
                tooltipIcon="text-emerald-500"
                sortValue="score"
                width="15%"
                align="right"
                icon={<FaStar className="text-emerald-500 text-xs" />}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
              <SortableHeader 
                title="Tempo" 
                tooltip={true} 
                tooltipText="Tempo total gasto para completar o quiz. Quanto menor o tempo, melhor a classificação em caso de empate."
                tooltipIcon="text-blue-400"
                sortValue="time"
                className="hidden sm:table-cell"
                width="12%"
                align="right"
                icon={<FaClock className="text-blue-400 text-xs" />}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
              <SortableHeader 
                title="Acertos" 
                tooltip={true} 
                tooltipText="Número de respostas corretas em relação ao total de questões do quiz."
                tooltipIcon="text-green-500"
                sortValue="accuracy"
                className="hidden sm:table-cell"
                width="14%"
                align="right"
                icon={<FaCheck className="text-green-500 text-xs" />}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
              <SortableHeader 
                title="Bônus" 
                tooltip={true} 
                tooltipText="Pontos extras ganhos através de indicações. Ganhe +5 pontos quando alguém usar seu código, e +10 pontos quando você usar o código de outro usuário."
                tooltipIcon="text-yellow-400"
                className="hidden md:table-cell"
                width="14%"
                align="right"
                icon={<FaStar className="text-yellow-400 text-xs" />}
                sortKey={sortKey}
                setSortKey={setSortKey}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            <AnimatePresence>
              {ranking.map((entry, index) => (
                <motion.tr 
                  key={index} 
                  className={`
                    group
                    ${index < 3 ? 'bg-gray-800/80' : 'bg-gray-900/80'} 
                    ${index === 0 ? 'border-l-4 border-yellow-500' : index === 1 ? 'border-l-4 border-gray-400' : index === 2 ? 'border-l-4 border-amber-700' : ''} 
                    ${highlightedRow === index ? 'bg-gray-700/50' : ''}
                    transition-colors duration-200 hover:bg-gray-700/30
                  `}
                  variants={rowVariants}
                  onMouseEnter={() => setHighlightedRow(index)}
                  onMouseLeave={() => setHighlightedRow(null)}
                >
                  <td className="p-0">
                    <div className="flex justify-center items-center h-full min-h-[4rem]">
                      {index === 0 ? (
                        <motion.div 
                          animate={podiumAnimations.first}
                          className="flex flex-col items-center justify-center"
                        >
                          <div className="relative">
                            <motion.div 
                              className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                              animate={{ y: [0, -2, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <FaCrown className="text-yellow-400 text-lg" />
                            </motion.div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:shadow-yellow-500/50 transition-all">
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
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-md shadow-gray-400/20 group-hover:shadow-gray-400/40 transition-all">
                            <FaMedal className="text-white text-lg" />
                          </div>
                          <span className="text-gray-300 text-xs font-bold mt-1">2°</span>
                        </motion.div>
                      ) : index === 2 ? (
                        <motion.div 
                          animate={podiumAnimations.third}
                          className="flex flex-col items-center justify-center"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-md shadow-amber-700/20 group-hover:shadow-amber-700/40 transition-all">
                            <FaAward className="text-amber-200 text-lg" />
                          </div>
                          <span className="text-amber-600 text-xs font-bold mt-1">3°</span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-gray-700/40 flex items-center justify-center group-hover:bg-gray-700/70 transition-all">
                            <span className="text-xs text-gray-400">{index + 1}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-0">
                    <div className="px-3 py-3 text-sm text-white truncate group-hover:text-emerald-100 transition-colors text-left h-full flex items-center">
                      {entry.user_name}
                    </div>
                  </td>
                  <td className="p-0">
                    <div className="px-2 py-3 text-sm flex items-center justify-end h-full">
                      <span className={`font-semibold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-emerald-500'} group-hover:scale-110 transition-transform`}>
                        {entry.total_score?.toFixed(1) || entry.score.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="p-0 hidden sm:table-cell">
                    <div className="px-2 py-3 text-sm text-gray-300 flex items-center justify-end h-full group-hover:text-gray-100 transition-colors">
                      {formatTime(entry.total_time_spent)}
                    </div>
                  </td>
                  <td className="p-0 hidden sm:table-cell">
                    <div className="px-2 py-3 text-sm flex items-center justify-end h-full">
                      <span className="text-white group-hover:text-gray-100 transition-colors">{entry.correct_answers}</span>
                      <span className="text-gray-500 group-hover:text-gray-400 transition-colors">/{entry.total_questions}</span>
                    </div>
                  </td>
                  <td className="p-0 hidden md:table-cell">
                    <div className="px-2 py-3 text-sm flex items-center justify-end h-full">
                      {entry.referral_bonus_points ? (
                        <div className="flex items-center justify-end">
                          <motion.div 
                            animate={highlightedRow === index ? { rotate: [-5, 5, -5] } : {}}
                            transition={{ duration: 0.5, repeat: highlightedRow === index ? Infinity : 0, repeatType: "reverse" }}
                          >
                            <FaStar className="text-yellow-400 mr-1" />
                          </motion.div>
                          <span className="text-yellow-400 group-hover:text-yellow-300 transition-colors">+{entry.referral_bonus_points}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 group-hover:text-gray-400 transition-colors">-</span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </motion.table>
      </div>
    </div>
  );
} 