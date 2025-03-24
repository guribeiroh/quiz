'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserFriends, FaChartLine, FaSignOutAlt, FaSync, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { FunnelStep } from './FunnelStep';
import { FunnelAnalytics } from './FunnelAnalytics';
import { FunnelChart } from './FunnelChart';
import { DateFilter, DateRange } from './DateFilter';
import { getQuizAnalytics } from '../../lib/analytics';

interface AdminDashboardProps {
  onLogout: () => void;
}

// Interface para os dados do funil
export interface FunnelData {
  stepName: string;
  totalUsers: number;
  retentionRate: number;
  dropoffRate: number;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataStatus, setDataStatus] = useState<string>('');
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | undefined>(undefined);
  
  const loadAnalytics = async (dateRange?: DateRange) => {
    setIsLoading(true);
    setError('');
    setDataStatus('Carregando dados...');
    
    try {
      console.log('Iniciando carregamento de analytics...');
      const data = await getQuizAnalytics(dateRange);
      console.log('Dados recebidos:', data);
      
      setFunnelData(data);
      setLastUpdate(new Date());
      
      // Verificar se temos dados reais
      const totalUsers = data.reduce((sum, step) => sum + step.totalUsers, 0);
      if (totalUsers === 0) {
        setDataStatus(`Nenhum dado registrado ${dateRange ? 'no período selecionado' : 'ainda'}. ${!dateRange ? 'Interaja com o quiz para gerar dados.' : ''}`);
      } else {
        setDataStatus('');
      }
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
      setError('Falha ao carregar os dados. Tente novamente mais tarde.');
      setDataStatus('Erro ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle da mudança de datas
  const handleDateChange = (dateRange: DateRange) => {
    console.log('Novo período selecionado:', dateRange);
    setCurrentDateRange(dateRange);
    loadAnalytics(dateRange);
  };
  
  useEffect(() => {
    loadAnalytics();
    
    // Atualizar dados a cada 5 minutos
    const intervalId = setInterval(() => loadAnalytics(currentDateRange), 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-emerald-400">Painel Analytics</h1>
            <span className="text-gray-400 ml-2">• Quiz Anatomia Sem Medo</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadAnalytics(currentDateRange)}
              disabled={isLoading}
              className="text-sm flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition"
            >
              <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            
            <button
              onClick={onLogout}
              className="text-sm flex items-center px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-md transition"
            >
              <FaSignOutAlt className="mr-2" />
              Sair
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Aviso sobre restrição de dados */}
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg p-4 mb-6 text-sm text-amber-400">
          <div className="flex items-start">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Dados restritos:</strong> Este painel mostra apenas dados coletados a partir de <strong>24/03/2025 às 11:24</strong> (horário de Brasília). Qualquer atividade anterior a esta data/hora não está incluída nas análises.
            </span>
          </div>
        </div>
        
        {/* Cabeçalho da seção com filtro de datas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Funil de Conversão</h2>
            <p className="text-gray-400 mt-1">
              Análise do fluxo de usuários em cada etapa do quiz
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-end gap-4">
            <DateFilter onDateChange={handleDateChange} />
            
            {lastUpdate && (
              <div className="text-sm text-gray-400 mt-2 sm:mt-0">
                <div className="flex items-center">
                  <span className="mr-2">Última atualização:</span>
                  <span className="bg-gray-800 px-3 py-1 rounded-md">
                    {lastUpdate.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Exibição da faixa de datas selecionada, quando aplicável */}
        {currentDateRange && (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-6 border border-gray-700/50">
            <div className="flex items-center text-sm">
              <span className="text-emerald-400 font-medium mr-2">Período selecionado:</span>
              <span className="text-white">{currentDateRange.label}</span>
              
              {/* Botão para limpar filtro */}
              <button 
                onClick={() => {
                  setCurrentDateRange(undefined);
                  loadAnalytics();
                }}
                className="ml-auto text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300 transition-colors"
              >
                Limpar filtro
              </button>
            </div>
          </div>
        )}
        
        {/* Conteúdo principal */}
        {error ? (
          <div className="bg-red-600/20 text-red-400 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gráfico principal do funil */}
            <div className="lg:col-span-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Visualização do Funil</h3>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-gray-400 hover:text-white p-1"
                >
                  {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                </button>
              </div>
              
              {!isCollapsed && (
                <div className="h-[400px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : (
                    funnelData.length > 0 ? (
                      <FunnelChart data={funnelData} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        {dataStatus}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            
            {/* Resumo da análise */}
            <div className="lg:col-span-4 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Resumo Analítico</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                dataStatus ? (
                  <div className="text-gray-400 text-center p-4">{dataStatus}</div>
                ) : (
                  <FunnelAnalytics data={funnelData} />
                )
              )}
            </div>
            
            {/* Detalhes do funil */}
            <div className="lg:col-span-12 bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Etapas do Funil</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              ) : (
                dataStatus ? (
                  <div className="text-gray-400 text-center p-4">{dataStatus}</div>
                ) : (
                  <div className="space-y-4">
                    {funnelData.map((step, index) => (
                      <FunnelStep 
                        key={index} 
                        step={step} 
                        index={index}
                        isLastStep={index === funnelData.length - 1} 
                      />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 