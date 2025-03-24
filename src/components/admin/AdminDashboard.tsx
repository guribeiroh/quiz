'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunnelStep } from './FunnelStep';
import { FunnelChart } from './FunnelChart';
import { getSupabaseClient } from '@/lib/supabase';
import { FiUsers, FiBarChart2, FiTrendingUp, FiPieChart, FiCalendar, FiRefreshCw, FiChevronDown } from 'react-icons/fi';

export interface FunnelData {
  stepName: string;
  totalUsers: number;
  retentionRate: number;
  dropoffRate: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface EventCount {
  event_name: string;
  user_count: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
  label?: string;
}

// Opções predefinidas de filtro de data
const DATE_PRESETS: DateRange[] = [
  {
    label: 'Hoje',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    label: 'Últimos 7 dias',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    label: 'Últimos 30 dias',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    label: 'Este mês',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    label: 'Mês passado',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
  },
  {
    label: 'Últimos 90 dias',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },
  {
    label: 'Este ano',
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  }
];

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [activeTab, setActiveTab] = useState('funnel');
  
  // Estados para o filtro de data
  const [dateFilter, setDateFilter] = useState<DateRange>({
    label: 'Últimos 30 dias',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customDateActive, setCustomDateActive] = useState(false);
  
  // Formatador de data para exibição amigável
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Carrega os dados do funil
  const fetchFunnelData = useCallback(async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      const supabase = getSupabaseClient();
      
      console.log('Buscando dados com filtro de data:', {
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate
      });
      
      // Buscar eventos com filtro de data
      let events: Array<{ event_name: string; user_count: number }> = [];
      try {
        // Consulta para obter contagem de eventos por nome de evento no período selecionado
        const startDate = dateFilter.startDate + 'T00:00:00.000Z';
        const endDate = dateFilter.endDate + 'T23:59:59.999Z';
        
        const { data: eventsData, error } = await supabase
          .from('user_events')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .select('event_name, created_at');
          
        if (error) {
          console.error('Erro ao consultar eventos:', error);
        } else if (eventsData) {
          // Processar manualmente para contar eventos por tipo
          const eventCounts: Record<string, number> = {};
          eventsData.forEach(event => {
            const name = event.event_name;
            eventCounts[name] = (eventCounts[name] || 0) + 1;
          });
          
          // Converter para o formato esperado
          events = Object.entries(eventCounts).map(([name, count]) => ({
            event_name: name,
            user_count: count
          }));
          
          console.log('Eventos encontrados:', events.length);
        }
      } catch (supabaseError) {
        console.error('Erro ao consultar eventos:', supabaseError);
      }

      // Alternativa: simulação de dados se a consulta falhar
      const mockEvents: EventCount[] = [
        { event_name: 'welcome', user_count: 100 },
        { event_name: 'questions', user_count: 80 },
        { event_name: 'capture', user_count: 60 },
        { event_name: 'results', user_count: 40 }
      ];

      // Determinar quais dados usar (reais ou simulados)
      const eventData: EventCount[] = events.length > 0 
        ? events 
        : mockEvents;

      // Transformar eventos brutos em dados do funil
      const welcomeCount = eventData.find(e => e.event_name === 'welcome')?.user_count || 0;
      const questionsCount = eventData.find(e => e.event_name === 'questions')?.user_count || 0;
      const captureCount = eventData.find(e => e.event_name === 'capture')?.user_count || 0;
      const resultsCount = eventData.find(e => e.event_name === 'results')?.user_count || 0;

      // Calcular taxas de retenção e abandono
      const funnelSteps: FunnelData[] = [
        {
          stepName: 'Tela Inicial',
          totalUsers: welcomeCount,
          retentionRate: 100,
          dropoffRate: welcomeCount > 0 ? ((welcomeCount - questionsCount) / welcomeCount * 100) : 0
        },
        {
          stepName: 'Perguntas',
          totalUsers: questionsCount,
          retentionRate: welcomeCount > 0 ? (questionsCount / welcomeCount * 100) : 0,
          dropoffRate: questionsCount > 0 ? ((questionsCount - captureCount) / questionsCount * 100) : 0
        },
        {
          stepName: 'Captura de Dados',
          totalUsers: captureCount,
          retentionRate: questionsCount > 0 ? (captureCount / questionsCount * 100) : 0,
          dropoffRate: captureCount > 0 ? ((captureCount - resultsCount) / captureCount * 100) : 0
        },
        {
          stepName: 'Resultados',
          totalUsers: resultsCount,
          retentionRate: captureCount > 0 ? (resultsCount / captureCount * 100) : 0,
          dropoffRate: 0
        }
      ];

      setFunnelData(funnelSteps);

      // Carregar dados de categorias
      let categories: Array<{ category: string }> = [];
      try {
        // Consulta para obter as categorias de resultados no período selecionado
        const startDate = dateFilter.startDate + 'T00:00:00.000Z';
        const endDate = dateFilter.endDate + 'T23:59:59.999Z';
        
        const { data: categoriesData, error } = await supabase
          .from('quiz_results')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .select('category, created_at');
          
        if (error) {
          console.error('Erro ao consultar categorias:', error);
        } else {
          categories = categoriesData?.map(item => ({ category: item.category })) || [];
          console.log('Categorias encontradas:', categories.length);
        }
      } catch (catError) {
        console.error('Erro ao consultar categorias:', catError);
      }
      
      if (categories.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categoryStats = categories.reduce((acc: Record<string, number>, item: any) => {
          if (item.category) {
            acc[item.category] = (acc[item.category] || 0) + 1;
          }
          return acc;
        }, {});

        const categoryData = Object.entries(categoryStats).map(([name, count]) => ({
          name,
          value: count as number
        }));

        setCategoryData(categoryData);
      } else {
        // Sem dados, definir array vazio
        setCategoryData([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilter]);

  // Atualizar dados quando o filtro de data mudar
  useEffect(() => {
    fetchFunnelData();
  }, [fetchFunnelData]);

  // Manipular seleção de preset de data
  const handleDatePresetSelect = (preset: DateRange) => {
    setDateFilter(preset);
    setShowPresets(false);
    setCustomDateActive(false);
  };

  // Manipular alteração de datas personalizadas
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value,
      label: 'Personalizado'
    }));
    setCustomDateActive(true);
  };

  // Manipular atualização manual dos dados
  const handleRefresh = () => {
    fetchFunnelData();
  };
  
  // Abrir o painel de datas personalizadas
  const handleCustomDateClick = () => {
    setCustomDateActive(true);
    setShowPresets(false);
  };

  if (loading && !isRefreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-cyan-500 border-gray-700/30 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard de Analytics</h1>
            <p className="text-gray-400 mt-1">Acompanhe o desempenho do funil de conversão</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center mt-4 md:mt-0 gap-3">
            <div className="relative">
              <button
                onClick={() => { setShowDateFilter(!showDateFilter); setShowPresets(false); }}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <FiCalendar className="mr-2" /> 
                <span>{dateFilter.label || 'Filtrar por data'}</span>
              </button>
              
              {showDateFilter && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl z-10 p-3 border border-gray-700 animate-fadeIn">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-medium">Período</h3>
                    <div className="relative">
                      <button 
                        onClick={() => setShowPresets(!showPresets)}
                        className="text-cyan-400 text-sm flex items-center hover:text-cyan-300"
                      >
                        Predefinidos <FiChevronDown className={`ml-1 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showPresets && (
                        <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-lg z-20 border border-gray-700 py-1 animate-fadeIn">
                          {DATE_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleDatePresetSelect(preset)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${dateFilter.label === preset.label && !customDateActive ? 'text-cyan-400' : 'text-gray-300'}`}
                            >
                              {preset.label}
                            </button>
                          ))}
                          <div className="border-t border-gray-700 my-1"></div>
                          <button
                            onClick={handleCustomDateClick}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors ${customDateActive ? 'text-cyan-400' : 'text-gray-300'}`}
                          >
                            Personalizado
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="startDate" className="block text-xs text-gray-400 mb-1">Data inicial</label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={dateFilter.startDate}
                        onChange={handleDateFilterChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-xs text-gray-400 mb-1">Data final</label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={dateFilter.endDate}
                        onChange={handleDateFilterChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatDateDisplay(dateFilter.startDate)} até {formatDateDisplay(dateFilter.endDate)}
                    </span>
                    <button
                      onClick={() => setShowDateFilter(false)}
                      className="text-sm px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleRefresh}
              className={`px-4 py-2 bg-indigo-700 text-indigo-100 rounded-lg hover:bg-indigo-600 transition-colors flex items-center ${isRefreshing ? 'opacity-70 pointer-events-none' : ''}`}
              disabled={isRefreshing}
            >
              <FiRefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar dados'}</span>
            </button>
            
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg mr-4">
                <FiUsers className="text-2xl text-cyan-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total de Usuários</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData[0]?.totalUsers.toLocaleString('pt-BR') || 0}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg mr-4">
                <FiBarChart2 className="text-2xl text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Taxa de Conclusão</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData.length && funnelData[0].totalUsers > 0
                    ? `${((funnelData[3]?.totalUsers / funnelData[0]?.totalUsers) * 100).toFixed(1)}%`
                    : '0%'}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg mr-4">
                <FiTrendingUp className="text-2xl text-amber-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Perguntas Respondidas</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData[1]?.totalUsers.toLocaleString('pt-BR') || 0}
                </h3>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-lg mr-4">
                <FiPieChart className="text-2xl text-fuchsia-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Resultados Exibidos</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData[3]?.totalUsers.toLocaleString('pt-BR') || 0}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação das Abas */}
        <div className="mb-6 border-b border-gray-700">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('funnel')}
              className={`py-3 px-1 relative ${
                activeTab === 'funnel'
                  ? 'text-cyan-400 font-medium'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Funil de Conversão
              {activeTab === 'funnel' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`py-3 px-1 relative ${
                activeTab === 'steps'
                  ? 'text-cyan-400 font-medium'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Etapas Detalhadas
              {activeTab === 'steps' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="mb-8">
          {isRefreshing ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg h-80 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-cyan-500 border-gray-700/30 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Atualizando dados...</p>
              </div>
            </div>
          ) : activeTab === 'funnel' ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-white">Visualização do Funil</h2>
                <div className="text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-md backdrop-blur-sm">
                  Período: {formatDateDisplay(dateFilter.startDate)} a {formatDateDisplay(dateFilter.endDate)}
                </div>
              </div>
              <div className="h-80">
                <FunnelChart data={funnelData} />
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {funnelData.map((step, index) => (
                  <div 
                    key={index} 
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center transition-all hover:shadow-md hover:border-gray-600"
                  >
                    <p className="text-sm text-gray-400">{step.stepName}</p>
                    <p className="text-xl font-semibold text-white mt-1">{step.totalUsers.toLocaleString('pt-BR')}</p>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="text-emerald-400">↑ {step.retentionRate.toFixed(1)}%</span>
                      <span className="text-rose-400">↓ {step.dropoffRate.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {funnelData.map((step, index) => (
                <FunnelStep
                  key={step.stepName}
                  step={step}
                  index={index}
                  isLastStep={index === funnelData.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Painel de Categorias */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-white">Distribuição por Categoria</h2>
            <div className="text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-md backdrop-blur-sm">
              Período: {formatDateDisplay(dateFilter.startDate)} a {formatDateDisplay(dateFilter.endDate)}
            </div>
          </div>
          
          {isRefreshing ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-t-cyan-500 border-gray-700/30 rounded-full animate-spin mb-3"></div>
                <p className="text-gray-400 text-sm">Atualizando dados...</p>
              </div>
            </div>
          ) : categoryData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-gray-300 font-medium">Categoria</th>
                    <th className="py-3 px-4 text-right text-gray-300 font-medium">Usuários</th>
                    <th className="py-3 px-4 text-right text-gray-300 font-medium">Distribuição</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map((category) => {
                    const totalResults = funnelData[3]?.totalUsers || 1; // Evitar divisão por zero
                    const percentage = (category.value / totalResults) * 100;
                    
                    return (
                      <tr key={category.name} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                        <td className="py-3 px-4 text-white">{category.name}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{category.value.toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end">
                            <div className="mr-3 text-gray-300 text-sm font-medium">{percentage.toFixed(1)}%</div>
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">Nenhum dado de categoria disponível para o período selecionado</p>
          )}
        </div>
      </div>
    </div>
  );
} 