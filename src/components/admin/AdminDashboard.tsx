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

interface EventCount {
  event_name: string;
  user_count: number;
}

// Interface para armazenar dados detalhados do funil
interface DetailedFunnelData {
  step: string;
  questionNumber?: number;
  totalUsers: number;
  percentage: number;
  dropoff: number;
}

interface DateRange {
  startDate: string;
  endDate: string;
  label?: string;
}

// Adicionar interfaces para os eventos e categorias
interface EventData {
  id?: string | number;
  event_type: string;
  step: string;
  created_at: string;
  user_id?: string | null;
  session_id?: string;
  timestamp?: string;
  page?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
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
  const [detailedFunnelData, setDetailedFunnelData] = useState<DetailedFunnelData[]>([]);
  const [eventData, setEventData] = useState<EventCount[]>([]);
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
        // Consulta para obter eventos e filtrar pelo lado do cliente
        const startDate = new Date(dateFilter.startDate + 'T00:00:00.000Z');
        const endDate = new Date(dateFilter.endDate + 'T23:59:59.999Z');
        
        console.log('Consultando eventos no período:', {
          startDateFormatted: startDate.toISOString(),
          endDateFormatted: endDate.toISOString()
        });
        
        // Buscar todos os eventos - sem filtro no Supabase para garantir que recebemos dados
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result: any = await supabase
          .from('user_events')
          .select('*');
        
        // Verificar o objeto de resposta completo
        console.log('Resposta completa do Supabase:', result);
        
        // Adicionar tipagem e extrair dados  
        const eventsData = result.data || [];
        const error = result.error;
          
        if (error) {
          console.error('Erro ao consultar eventos:', error);
        } else if (eventsData) {
          console.log('Total de eventos recebidos do Supabase:', eventsData.length);
          console.log('Amostra dos eventos recebidos (primeiros 5):', eventsData.slice(0, 5));
          
          // Verificar estrutura individual do primeiro registro (se existir)
          if (eventsData.length > 0) {
            console.log('Estrutura do primeiro evento:', Object.keys(eventsData[0]));
            console.log('Primeiro evento completo:', eventsData[0]);
          } else {
            console.warn('Nenhum evento encontrado na tabela user_events');
            console.warn('Verificando se a tabela existe ou está vazia');
          }
          
          // Filtrar por data manualmente
          const filteredEvents = eventsData.filter((event: EventData) => {
            if (!event.created_at) {
              console.log('Evento sem data:', event);
              return false;
            }
            const eventDate = new Date(event.created_at);
            return eventDate >= startDate && eventDate <= endDate;
          });
          
          console.log('Eventos após filtro de data:', filteredEvents.length);
          
          // Processar manualmente para contar eventos por tipo de etapa
          const eventCounts: Record<string, number> = {};
          filteredEvents.forEach((event: EventData) => {
            const step = event.step;
            if (!step) {
              console.log('Evento sem step:', event);
              return;
            }
            eventCounts[step] = (eventCounts[step] || 0) + 1;
          });
          
          // Converter para o formato esperado
          events = Object.entries(eventCounts).map(([step, count]) => ({
            event_name: step,
            user_count: count
          }));
          
          console.log('Eventos agrupados por step:', events);
        }
      } catch (error) {
        console.error('Erro ao consultar eventos:', error);
      }

      // Não usar dados simulados - vamos forçar o uso apenas de dados reais
      const eventData: EventCount[] = events;
      setEventData(events);

      console.log('Dados de eventos usados:', events);

      // Transformar eventos brutos em dados do funil
      const welcomeCount = eventData.find(e => e.event_name === 'Tela de Boas-vindas')?.user_count || 0;
      const questionsCount = eventData.find(e => e.event_name === 'Respondendo Perguntas')?.user_count || 0;
      const captureCount = eventData.find(e => e.event_name === 'Captura de Dados')?.user_count || 0;
      const resultsCount = eventData.find(e => e.event_name === 'Resultados')?.user_count || 0;

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
      
      // Processar dados detalhados do funil
      // Encontrar eventos específicos de perguntas (ex: "Pergunta 1", "Pergunta 2", etc)
      const questionEvents = eventData.filter(e => e.event_name.includes('Pergunta') || e.event_name.includes('pergunta'));
      console.log('Eventos de perguntas encontrados:', questionEvents);
      
      // Criar array de passos detalhados
      const detailedSteps: DetailedFunnelData[] = [
        {
          step: 'Tela de Boas-vindas',
          totalUsers: welcomeCount,
          percentage: 100,
          dropoff: welcomeCount > 0 ? ((welcomeCount - questionsCount) / welcomeCount * 100) : 0
        }
      ];
      
      // Adicionar cada pergunta como um passo
      for (let i = 1; i <= 10; i++) {
        const questionEvent = eventData.find(e => 
          e.event_name.includes(`Pergunta ${i}`) || 
          e.event_name.includes(`pergunta ${i}`) ||
          e.event_name.includes(`Questão ${i}`) ||
          e.event_name.includes(`questão ${i}`)
        );
        
        const questionCount = questionEvent?.user_count || 0;
        const prevCount = i === 1 ? welcomeCount : (detailedSteps[i]?.totalUsers || welcomeCount);
        
        detailedSteps.push({
          step: `Pergunta ${i}`,
          questionNumber: i,
          totalUsers: questionCount,
          percentage: welcomeCount > 0 ? (questionCount / welcomeCount * 100) : 0,
          dropoff: prevCount > 0 ? ((prevCount - questionCount) / prevCount * 100) : 0
        });
      }
      
      // Adicionar etapas finais
      detailedSteps.push({
        step: 'Captura de Dados',
        totalUsers: captureCount,
        percentage: welcomeCount > 0 ? (captureCount / welcomeCount * 100) : 0,
        dropoff: questionEvents.length > 0 ? 
          ((detailedSteps[detailedSteps.length - 1].totalUsers - captureCount) / detailedSteps[detailedSteps.length - 1].totalUsers * 100) : 
          (questionsCount > 0 ? ((questionsCount - captureCount) / questionsCount * 100) : 0)
      });
      
      detailedSteps.push({
        step: 'Resultados',
        totalUsers: resultsCount,
        percentage: welcomeCount > 0 ? (resultsCount / welcomeCount * 100) : 0,
        dropoff: captureCount > 0 ? ((captureCount - resultsCount) / captureCount * 100) : 0
      });
      
      setDetailedFunnelData(detailedSteps);
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
                    ? `${((funnelData[3]?.totalUsers / funnelData[0]?.totalUsers) * 100).toFixed(2)}%`
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

        {/* Tabs */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              className={`px-4 py-2 font-medium rounded ${activeTab === 'funnel' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('funnel')}
            >
              Funil de Conversão
            </button>
            <button
              className={`px-4 py-2 font-medium rounded ${activeTab === 'events' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('events')}
            >
              Eventos por Data
            </button>
            <button
              className={`px-4 py-2 font-medium rounded ${activeTab === 'detailed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => setActiveTab('detailed')}
            >
              Funil Completo
            </button>
          </div>

          {activeTab === 'funnel' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Funil de Conversão</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Métricas do Funil</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 text-left">Etapa</th>
                          <th className="py-2 px-4 text-left">Usuários</th>
                          <th className="py-2 px-4 text-left">Taxa de Retenção</th>
                          <th className="py-2 px-4 text-left">Taxa de Abandono</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funnelData.map((step, index) => (
                          <FunnelStep key={index} step={step} index={index} isLastStep={index === funnelData.length - 1} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Visualização do Funil</h3>
                  <FunnelChart data={funnelData} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Eventos por Data</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 text-left">Evento</th>
                      <th className="py-2 px-4 text-left">Usuários</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventData.map((event, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">{event.event_name}</td>
                        <td className="py-2 px-4">{event.user_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'detailed' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Visualização Detalhada do Funil</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Detalhamento por Etapa</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="py-2 px-4 text-left">Etapa</th>
                          <th className="py-2 px-4 text-left">Usuários</th>
                          <th className="py-2 px-4 text-left">% do Total</th>
                          <th className="py-2 px-4 text-left">% Abandono</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailedFunnelData.map((step, index) => (
                          <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                            <td className="py-2 px-4 font-medium">{step.step}</td>
                            <td className="py-2 px-4">{step.totalUsers}</td>
                            <td className="py-2 px-4">{step.percentage.toFixed(2)}%</td>
                            <td className="py-2 px-4">{step.dropoff.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Progressão Detalhada</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    {detailedFunnelData.map((step, index) => (
                      <div key={index} className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{step.step}</span>
                          <span className="text-sm font-medium">{step.totalUsers} usuários ({step.percentage.toFixed(2)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div 
                            className="bg-blue-600 h-4 rounded-full" 
                            style={{ width: `${step.percentage}%` }}
                          ></div>
                        </div>
                        {index < detailedFunnelData.length - 1 && (
                          <div className="flex justify-end text-sm text-red-500 mt-1">
                            <FiChevronDown className="mr-1" />
                            Abandono: {step.dropoff.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="font-medium mb-2">Legenda:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><span className="text-blue-600 font-medium">% do Total</span>: Porcentagem de usuários em relação ao total que iniciou o funil</li>
                      <li><span className="text-red-500 font-medium">% Abandono</span>: Porcentagem de usuários que abandonou nesta etapa</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 