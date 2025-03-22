"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaCheck, FaCopy, FaShareAlt, FaPhone, FaLink } from 'react-icons/fa';
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
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const copyLinkRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Garantir que o carregamento dos dados só aconteça no lado do cliente
    if (typeof window !== 'undefined') {
      loadRanking();
      
      // Verificar se há um código de referência salvo no localStorage
      const savedCode = localStorage.getItem('referralCode');
      if (savedCode) {
        setReferralCode(savedCode);
      }
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
  
  // Função para buscar código de referência pelo telefone
  const fetchReferralCodeByPhone = async (phone: string) => {
    try {
      setIsSearching(true);
      setPhoneError(null);
      
      // Aqui você chamaria uma função para buscar o código por telefone no Supabase
      // Por enquanto, simulamos um atraso e um resultado
      // Exemplo: const result = await getReferralCodeByPhone(phone);
      
      // Simulação de chamada ao banco - substitua pela implementação real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar formato do telefone (simulação)
      if (!phone.match(/^\(\d{2}\) \d{5}-\d{4}$/) && !phone.match(/^\d{10,11}$/)) {
        setPhoneError('Formato de telefone inválido. Use (00) 00000-0000 ou apenas números.');
        setIsSearching(false);
        return;
      }
      
      // Para teste - Aqui você buscaria o código real do usuário no Supabase baseado no telefone
      // Se não encontrar, retornaria null ou um erro
      const randomFound = Math.random() > 0.3; // 70% de chance de "encontrar" um código
      
      if (randomFound) {
        const mockCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setReferralCode(mockCode);
        // Salvar no localStorage para uso futuro
        localStorage.setItem('referralCode', mockCode);
        setShowPhoneForm(false);
      } else {
        setPhoneError('Não encontramos um código associado a este telefone.');
      }
    } catch (error) {
      console.error('Erro ao buscar código por telefone:', error);
      setPhoneError('Ocorreu um erro ao buscar seu código. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Função para copiar o link para o clipboard
  const copyReferralLink = () => {
    if (copyLinkRef.current) {
      copyLinkRef.current.select();
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Componente de compartilhamento de link */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800 rounded-xl mb-6 shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-4 sm:p-5 text-white flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center shadow-lg mr-3">
                <FaShareAlt className="text-blue-200 text-xl" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Compartilhe e Ganhe Pontos</h3>
                <p className="text-sm text-blue-100">Convide amigos e suba no ranking!</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {referralCode ? (
              <div>
                <p className="text-gray-300 text-sm mb-4">
                  Compartilhe seu link de indicação. Você ganha <span className="text-yellow-400 font-medium">+5 pontos</span> cada vez que alguém usar seu código!
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch mb-4">
                  <div className="relative flex-grow">
                    <input 
                      ref={copyLinkRef}
                      type="text" 
                      readOnly 
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/quiz?ref=${referralCode}`}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                      <FaLink />
                    </div>
                  </div>
                  <button 
                    onClick={copyReferralLink}
                    className={`${copySuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 sm:py-0 rounded-lg font-medium transition-colors flex items-center justify-center`}
                  >
                    {copySuccess ? (
                      <>
                        <FaCheck className="mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <FaCopy className="mr-2" />
                        Copiar Link
                      </>
                    )}
                  </button>
                </div>
                
                <div className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded-lg">
                  Seu código de indicação: <span className="bg-gray-800 px-2 py-1 rounded ml-1 text-blue-300 font-mono">{referralCode}</span>
                </div>
              </div>
            ) : showPhoneForm ? (
              <div>
                <p className="text-gray-300 text-sm mb-4">
                  Digite seu número de telefone para buscarmos seu código de indicação:
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch mb-4">
                  <div className="relative flex-grow">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <FaPhone />
                    </div>
                    <input 
                      type="tel" 
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    onClick={() => fetchReferralCodeByPhone(userPhone)}
                    disabled={isSearching || !userPhone}
                    className={`${!userPhone ? 'bg-gray-600 cursor-not-allowed' : isSearching ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 sm:py-0 rounded-lg font-medium transition-colors flex items-center justify-center`}
                  >
                    {isSearching ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Buscando...
                      </>
                    ) : (
                      'Buscar Código'
                    )}
                  </button>
                </div>
                
                {phoneError && (
                  <div className="text-sm text-red-300 bg-red-900/30 p-3 rounded-lg border border-red-800">
                    {phoneError}
                  </div>
                )}
                
                <div className="mt-3">
                  <button 
                    onClick={() => setShowPhoneForm(false)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 text-sm mb-4">
                  Não encontramos seu código de indicação no navegador atual.
                </p>
                <button 
                  onClick={() => setShowPhoneForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Buscar meu código
                </button>
              </div>
            )}
          </div>
        </motion.div>
        
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
