"use client";

import { useState } from 'react';
import { FaAngleUp, FaAngleDown } from 'react-icons/fa';

export function RankingInfo() {
  const [expandedInfo, setExpandedInfo] = useState<boolean>(false);
  
  return (
    <div className="ranking-info-section mb-6 sm:mb-8 bg-gray-700/50 p-3 sm:p-4 rounded-lg border border-gray-600 transition-all duration-200 hover:border-emerald-500/30 hover:bg-gray-700/60">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-emerald-400 mb-1 sm:mb-2">Como funciona o ranking?</h3>
        <button 
          onClick={() => setExpandedInfo(!expandedInfo)} 
          className="md:hidden text-emerald-400 p-1"
          aria-label={expandedInfo ? "Recolher informações" : "Expandir informações"}
        >
          {expandedInfo ? <FaAngleUp /> : <FaAngleDown />}
        </button>
      </div>
      
      <div className={`${expandedInfo ? 'block' : 'hidden md:block'}`}>
        <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3">
          Sua posição no ranking é determinada por uma combinação de desempenho no quiz e pontos de bônus por indicações. Supere seus colegas e conquiste o topo!
        </p>
        <ul className="text-xs text-gray-400 space-y-1 mb-2 sm:mb-3">
          <li className="flex items-start">
            <span className="text-emerald-400 mr-1 mt-0.5">•</span>
            <span>Pontuação base: percentual de respostas corretas no quiz (máximo 100 pontos)</span>
          </li>
          <li className="flex items-start">
            <span className="text-emerald-400 mr-1 mt-0.5">•</span>
            <span>Bônus de indicação: ganhe <strong className="text-yellow-400">+5 pontos</strong> cada vez que alguém usar seu código</span>
          </li>
          <li className="flex items-start">
            <span className="text-emerald-400 mr-1 mt-0.5">•</span>
            <span>Bônus de uso: receba <strong className="text-yellow-400">+10 pontos</strong> quando você usar o código de outro participante</span>
          </li>
          <li className="flex items-start">
            <span className="text-emerald-400 mr-1 mt-0.5">•</span>
            <span>Desempate: em caso de pontuação igual, o menor tempo de conclusão determina a melhor posição</span>
          </li>
          <li className="flex items-start">
            <span className="text-emerald-400 mr-1 mt-0.5">•</span>
            <span>Exibição: o ranking mostra apenas os <strong className="text-yellow-400">20 primeiros</strong> colocados com melhor desempenho</span>
          </li>
        </ul>
        <div className="bg-gray-800 p-2 sm:p-3 rounded-lg border border-gray-700 text-center transition-all hover:border-emerald-500/40">
          <p className="text-xs sm:text-sm text-emerald-300 font-medium">
            Compartilhe seu código de indicação para subir no ranking! 
            <span className="text-white ml-1 block sm:inline">Não há limite para os pontos de bônus que você pode acumular.</span>
          </p>
        </div>
      </div>
    </div>
  );
} 