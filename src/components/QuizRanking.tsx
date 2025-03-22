"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaCheck, FaCopy, FaShareAlt, FaPhone, FaLink, FaAngleUp, FaAngleDown } from 'react-icons/fa';
import { getQuizRanking, getReferralCodeByPhone } from '../lib/supabase';
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
  const [userName, setUserName] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
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
      
      // Verificar se há um nome de usuário salvo no localStorage
      const savedName = localStorage.getItem('userName');
      if (savedName) {
        setUserName(savedName);
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
  
  // Função para normalizar o número de telefone
  const normalizePhoneNumber = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const numbersOnly = phone.replace(/\D/g, '');
    
    // Verifica se o número tem um comprimento razoável
    if (numbersOnly.length < 9 || numbersOnly.length > 11) {
      return null;
    }
    
    console.log('Número normalizado para busca:', numbersOnly);
    return numbersOnly;
  };
  
  // Função para buscar código de referência pelo telefone
  const fetchReferralCodeByPhone = async (phone: string) => {
    try {
      setIsSearching(true);
      setPhoneError(null);
      
      // Normaliza o número de telefone
      const normalizedPhone = normalizePhoneNumber(phone);
      
      if (!normalizedPhone) {
        setPhoneError('Número de telefone inválido. Certifique-se de que seu número tenha entre 9 e 11 dígitos.');
        setIsSearching(false);
        return;
      }
      
      // Buscar o código de referência no banco de dados
      const result = await getReferralCodeByPhone(normalizedPhone);
      
      if (result.success && result.data) {
        // Código encontrado, atualizar os estados
        setReferralCode(result.data.referralCode);
        
        // Salvar no localStorage para uso futuro
        localStorage.setItem('referralCode', result.data.referralCode);
        
        // Se temos um nome de usuário, usamos ele
        if (result.data.userName && !userName) {
          setUserName(result.data.userName);
          localStorage.setItem('userName', result.data.userName);
        } else if (userName) {
          // Se o usuário inseriu um nome e não veio um do banco, salvamos o atual
          localStorage.setItem('userName', userName);
        }
        
        setShowPhoneForm(false);
      } else {
        // Código não encontrado, mostrar erro
        setPhoneError(result.error || 'Não encontramos um código associado a este telefone.');
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
          <div 
            className="bg-gradient-to-r from-blue-800 to-blue-600 p-3 sm:p-4 text-white flex items-center justify-between cursor-pointer"
            onClick={() => setShowSharePanel(!showSharePanel)}
          >
            <div className="flex items-center">
              <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg mr-2">
                <FaShareAlt className="text-blue-200 text-sm" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">Compartilhe e Ganhe Pontos</h3>
                <p className="text-xs text-blue-100">Convide amigos e suba no ranking!</p>
              </div>
            </div>
            <div className="text-white">
              {showSharePanel ? (
                <FaAngleUp size={20} />
              ) : (
                <FaAngleDown size={20} />
              )}
            </div>
          </div>
          
          {showSharePanel && (
            <div className="p-3 sm:p-4">
              {referralCode ? (
                <div>
                  <p className="text-gray-300 text-xs mb-3">
                    Compartilhe seu link de indicação. Você ganha <span className="text-yellow-400 font-medium">+5 pontos</span> cada vez que alguém usar seu código!
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch mb-3">
                    <div className="relative flex-grow">
                      <input 
                        ref={copyLinkRef}
                        type="text" 
                        readOnly 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${referralCode}`}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                        <FaLink className="text-sm" />
                      </div>
                    </div>
                    <button 
                      onClick={copyReferralLink}
                      className={`${copySuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 sm:py-0 rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
                    >
                      {copySuccess ? (
                        <>
                          <FaCheck className="mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <FaCopy className="mr-1" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded-lg">
                    {userName && (
                      <div className="mb-1 pb-1 border-b border-gray-700">
                        <span className="text-gray-300">Link de indicação de:</span> <span className="text-blue-300 font-medium">{userName}</span>
                      </div>
                    )}
                    Seu código: <span className="bg-gray-800 px-2 py-1 rounded ml-1 text-blue-300 font-mono">{referralCode}</span>
                  </div>
                </div>
              ) : showPhoneForm ? (
                <div>
                  <p className="text-gray-300 text-xs mb-3">
                    Digite seu telefone para buscarmos seu código de indicação:
                  </p>
                  
                  <div className="flex flex-col gap-2 mb-3">
                    <div className="relative flex-grow">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <FaPhone className="text-xs" />
                      </div>
                      <input 
                        type="tel" 
                        value={userPhone}
                        onChange={(e) => setUserPhone(e.target.value)}
                        placeholder="Digite seu telefone (qualquer formato)"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-8 pr-3 text-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="relative flex-grow">
                      <input 
                        type="text" 
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Seu nome (opcional)"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch mb-3">
                    <button 
                      onClick={() => fetchReferralCodeByPhone(userPhone)}
                      disabled={isSearching || !userPhone}
                      className={`${!userPhone ? 'bg-gray-600 cursor-not-allowed' : isSearching ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 sm:py-0 rounded-lg text-sm font-medium transition-colors flex items-center justify-center w-full sm:w-auto`}
                    >
                      {isSearching ? (
                        <>
                          <FaSpinner className="animate-spin mr-1" />
                          Buscando...
                        </>
                      ) : (
                        'Buscar Código'
                      )}
                    </button>
                  </div>
                  
                  {phoneError && (
                    <div className="text-xs text-red-300 bg-red-900/30 p-2 rounded-lg border border-red-800">
                      {phoneError}
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <button 
                      onClick={() => setShowPhoneForm(false)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-300 text-xs mb-3">
                    Não encontramos seu código de indicação no navegador atual.
                  </p>
                  <button 
                    onClick={() => setShowPhoneForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Buscar meu código
                  </button>
                </div>
              )}
            </div>
          )}
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
