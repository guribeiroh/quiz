'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Interface para análise de indicações
interface ReferralAnalytics {
  totalReferrals: number;
  activeReferrers: number;
  averageReferralsPerUser: number;
  conversionRate: number;
  topReferrers: {
    userName: string;
    referralCount: number;
    successRate: number;
  }[];
  referralChains: {
    chainLength: number;
    count: number;
  }[];
  timeBasedAnalysis: {
    period: string;
    referralCount: number;
    conversionRate: number;
  }[];
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

interface QuizResult {
  id: string;
  created_at: string;
  referral_code?: string;
  referred_by?: string;
  user_name?: string;
  score?: number;
}

// Opções predefinidas de filtro de data
const getDatePresets = (): DateRange[] => [
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
  const [referralData, setReferralData] = useState<ReferralAnalytics>({
    totalReferrals: 0,
    activeReferrers: 0,
    averageReferralsPerUser: 0,
    conversionRate: 0,
    topReferrers: [],
    referralChains: [],
    timeBasedAnalysis: []
  });
  const [activeTab, setActiveTab] = useState('funnel');
  
  // Estados para o filtro de data
  const [dateFilter, setDateFilter] = useState<DateRange>(() => {
    // Inicializar com o preset de últimos 30 dias
    const presets = getDatePresets();
    return presets.find(preset => preset.label === 'Últimos 30 dias') || presets[2];
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
        // Garantir que as datas estejam no formato UTC para consistência
        const startDate = new Date(`${dateFilter.startDate}T00:00:00.000Z`);
        const endDate = new Date(`${dateFilter.endDate}T23:59:59.999Z`);
        
        console.log('Consultando eventos no período:', {
          startDateFormatted: startDate.toISOString(),
          endDateFormatted: endDate.toISOString()
        });
        
        // Buscar eventos com filtro de data no lado do servidor
        const result = await supabase
          .from('user_events')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
        
        // Verificar o objeto de resposta completo
        console.log('Resposta completa do Supabase:', result);
        
        // Adicionar tipagem e extrair dados  
        const eventsData = result.data || [];
        const error = result.error;
          
        if (error) {
          console.error('Erro ao consultar eventos:', error);
        } else if (eventsData) {
          console.log('Total de eventos recebidos do Supabase:', eventsData.length);
          
          // Processar para contar usuários únicos por tipo de etapa
          const uniqueUsersByStep: Record<string, Set<string>> = {};
          
          eventsData.forEach((event: EventData) => {
            const step = event.step;
            const userId = event.user_id || event.session_id;
            
            if (!step) {
              console.log('Evento sem step:', event);
              return;
            }
            
            if (!userId) {
              console.log('Evento sem user_id ou session_id:', event);
              return;
            }
            
            if (!uniqueUsersByStep[step]) {
              uniqueUsersByStep[step] = new Set();
            }
            
            uniqueUsersByStep[step].add(userId);
          });
          
          // Converter para o formato esperado
          events = Object.entries(uniqueUsersByStep).map(([step, userSet]) => ({
            event_name: step,
            user_count: userSet.size
          }));
          
          console.log('Eventos agrupados por step (usuários únicos):', events);
          
          // Usar dados dos eventos recém-obtidos, não do estado anterior
          // Transformar eventos brutos em dados do funil
          const welcomeCount = events.find(e => e.event_name === 'Tela de Boas-vindas')?.user_count || 0;
          const questionsCount = events.find(e => e.event_name === 'Respondendo Perguntas')?.user_count || 0;
          const captureCount = events.find(e => e.event_name === 'Captura de Dados')?.user_count || 0;
          
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
              dropoffRate: 0
            }
          ];

          setFunnelData(funnelSteps);
          
          // Processar dados detalhados do funil
          // Encontrar eventos específicos de perguntas (ex: "Pergunta 1", "Pergunta 2", etc)
          const questionEvents = events.filter(e => e.event_name.includes('Pergunta') || e.event_name.includes('pergunta'));
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
            const questionEvent = events.find(e => 
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
          
          setDetailedFunnelData(detailedSteps);
          
          // Atualizar o estado eventData APÓS processar todos os cálculos
          setEventData(events);
        }
      } catch (error) {
        console.error('Erro ao consultar eventos:', error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFilter]);

  // Carrega os dados de indicações
  const fetchReferralData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const supabase = getSupabaseClient();
      
      // Garantir que as datas estejam no formato UTC para consistência
      const startDate = new Date(`${dateFilter.startDate}T00:00:00.000Z`);
      const endDate = new Date(`${dateFilter.endDate}T23:59:59.999Z`);
      
      console.log('Consultando quiz_results no período:', {
        startDateFormatted: startDate.toISOString(),
        endDateFormatted: endDate.toISOString(),
        label: dateFilter.label
      });
      
      // Buscar resultados do quiz com filtro de data no lado do servidor
      const result = await supabase
        .from('quiz_results')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(1000);

      if (result.error) {
        console.error('Erro ao buscar dados de indicações:', result.error);
        return;
      }

      const quizResults = (result.data || []) as QuizResult[];
      console.log(`Encontrados ${quizResults.length} resultados de quiz no período selecionado`);
      
      // Processar dados para análise
      const referrers = new Map();
      const chains = new Map();
      const timeAnalysis = new Map();
      
      quizResults?.forEach(result => {
        // Contar indicações por usuário
        if (result.referral_code) {
          const referrer = result.referred_by;
          if (referrer) {
            const referrerData = referrers.get(referrer) || { 
              userName: result.user_name,
              referralCount: 0,
              successfulReferrals: 0
            };
            referrerData.referralCount++;
            if (result.score !== undefined && result.score >= 7) {
              referrerData.successfulReferrals++;
            }
            referrers.set(referrer, referrerData);
          }
          
          // Analisar cadeias de indicação
          let chainLength = 1;
          let currentReferrer = result.referred_by;
          while (currentReferrer) {
            chainLength++;
            const referrerResult = quizResults.find(r => r.id === currentReferrer);
            currentReferrer = referrerResult?.referred_by;
          }
          chains.set(chainLength, (chains.get(chainLength) || 0) + 1);
          
          // Análise temporal
          const month = new Date(result.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const periodData = timeAnalysis.get(month) || { referralCount: 0, conversions: 0 };
          periodData.referralCount++;
          if (result.score !== undefined && result.score >= 7) {
            periodData.conversions++;
          }
          timeAnalysis.set(month, periodData);
        }
      });
      
      // Calcular métricas finais
      const totalReferrals = quizResults?.filter(r => r.referral_code).length || 0;
      const activeReferrers = referrers.size;
      const averageReferrals = activeReferrers > 0 ? totalReferrals / activeReferrers : 0;
      
      // Preparar top referrers
      const topReferrersList = Array.from(referrers.values())
        .map(r => ({
          userName: r.userName,
          referralCount: r.referralCount,
          successRate: (r.successfulReferrals / r.referralCount) * 100
        }))
        .sort((a, b) => b.referralCount - a.referralCount)
        .slice(0, 5);
      
      // Preparar análise de cadeias
      const referralChainsList = Array.from(chains.entries())
        .map(([chainLength, count]) => ({ chainLength, count }))
        .sort((a, b) => a.chainLength - b.chainLength);
      
      // Preparar análise temporal
      const timeBasedAnalysisList = Array.from(timeAnalysis.entries())
        .map(([period, data]) => ({
          period,
          referralCount: data.referralCount,
          conversionRate: (data.conversions / data.referralCount) * 100
        }))
        .sort((a, b) => new Date(b.period).getTime() - new Date(a.period).getTime());
      
      // Atualizar estado
      setReferralData({
        totalReferrals,
        activeReferrers,
        averageReferralsPerUser: averageReferrals,
        conversionRate: totalReferrals > 0 ? 
          (quizResults?.filter(r => r.referral_code && r.score !== undefined && r.score >= 7).length || 0) / totalReferrals * 100 : 0,
        topReferrers: topReferrersList,
        referralChains: referralChainsList,
        timeBasedAnalysis: timeBasedAnalysisList
      });
      
    } catch (error) {
      console.error('Erro ao processar dados de indicações:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dateFilter]);

  // Aplica o filtro e refaz todas as consultas
  const applyDateFilter = useCallback(() => {
    console.log('Aplicando filtro com datas:', {
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      label: dateFilter.label || 'Sem rótulo'
    });
    
    // Resetar estados para evitar dados inconsistentes durante a atualização
    setFunnelData([]);
    setDetailedFunnelData([]);
    setEventData([]);
    
    // Iniciar carregamento de dados
    fetchFunnelData();
    fetchReferralData();
  }, [fetchFunnelData, fetchReferralData, dateFilter]);

  // Atualizar dados quando o componente montar
  useEffect(() => {
    applyDateFilter();
  }, [applyDateFilter]);

  // Manipular seleção de preset de data
  const handleDatePresetSelect = (preset: DateRange) => {
    // Indicar carregamento
    setIsRefreshing(true);
    
    // Aplicar preset 
    setDateFilter(preset);
    setShowPresets(false);
    setCustomDateActive(false);
    
    // Fechar o painel de datas imediatamente
    setShowDateFilter(false);
    
    // Aplicar o filtro imediatamente
    console.log('Aplicando preset de data:', preset.label);
    
    // Resetar estados para evitar dados inconsistentes
    setFunnelData([]);
    setDetailedFunnelData([]);
    setEventData([]);
    
    // Executar as consultas
    fetchFunnelData();
    fetchReferralData();
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

  // Validar e aplicar as datas personalizadas
  const handleApplyDateFilter = () => {
    // Verificar se a data inicial é anterior à data final
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    
    if (startDate > endDate) {
      alert('A data inicial deve ser anterior à data final');
      return;
    }
    
    // Adicionar registro de debug
    console.log('Aplicando filtro de datas:', {
      startDate: dateFilter.startDate,
      endDate: dateFilter.endDate,
      label: dateFilter.label
    });
    
    // Aplicar o filtro e fechar o painel
    applyDateFilter();
    setShowDateFilter(false);
  };

  // Manipular atualização manual dos dados
  const handleRefresh = () => {
    applyDateFilter();
  };
  
  // Abrir o painel de datas personalizadas
  const handleCustomDateClick = () => {
    setCustomDateActive(true);
    setShowPresets(false);
  };

  // CORREÇÃO: Atualizei os presets de data para serem gerados em tempo real a cada clique
  const handleShowPresets = () => {
    // Atualiza os presets de data toda vez que o menu é aberto
    // Para atualizar os presets, precisaríamos definir um novo estado aqui
    setShowPresets(!showPresets);
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
                        onClick={() => handleShowPresets()}
                        className="text-cyan-400 text-sm flex items-center hover:text-cyan-300"
                      >
                        Predefinidos <FiChevronDown className={`ml-1 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showPresets && (
                        <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-lg z-20 border border-gray-700 py-1 animate-fadeIn">
                          {getDatePresets().map((preset, idx) => (
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
                        max={dateFilter.endDate}
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
                        min={dateFilter.startDate}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatDateDisplay(dateFilter.startDate)} até {formatDateDisplay(dateFilter.endDate)}
                    </span>
                    <button
                      onClick={handleApplyDateFilter}
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
                <p className="text-gray-400 text-sm">Visitantes Únicos</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData[0]?.totalUsers.toLocaleString('pt-BR') || 0}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Total de pessoas que acessaram a tela inicial</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg mr-4">
                <FiBarChart2 className="text-2xl text-emerald-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Conversão Completa</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData.length && funnelData[0].totalUsers > 0
                    ? `${((funnelData[2]?.totalUsers / funnelData[0]?.totalUsers) * 100).toFixed(2)}%`
                    : '0%'}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Visitantes que concluíram todo o processo</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-lg mr-4">
                <FiTrendingUp className="text-2xl text-amber-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Engajamento no Quiz</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData[1]?.totalUsers.toLocaleString('pt-BR') || 0}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Usuários que iniciaram as perguntas</p>
          </div>
          
          <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:bg-gray-800/95">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-lg mr-4">
                <FiPieChart className="text-2xl text-fuchsia-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Leads Gerados</p>
                <h3 className="text-white text-2xl font-semibold">
                  {funnelData[2]?.totalUsers.toLocaleString('pt-BR') || 0}
                </h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Contatos capturados para seguimento</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg mb-6">
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
                onClick={() => setActiveTab('detailed')}
                className={`py-3 px-1 relative ${
                  activeTab === 'detailed'
                    ? 'text-cyan-400 font-medium'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Funil Completo
                {activeTab === 'detailed' && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={`py-3 px-1 relative ${
                  activeTab === 'referrals'
                    ? 'text-cyan-400 font-medium'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Análise de Indicações
                {activeTab === 'referrals' && (
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
                        <span className="text-emerald-400">↑ {step.retentionRate.toFixed(2)}%</span>
                        <span className="text-rose-400">↓ {step.dropoffRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'detailed' ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-white">Funil Completo (Passo a Passo)</h2>
                  <div className="text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-md backdrop-blur-sm">
                    Período: {formatDateDisplay(dateFilter.startDate)} a {formatDateDisplay(dateFilter.endDate)}
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-3 px-4 text-left text-gray-300 font-medium">Etapa</th>
                        <th className="py-3 px-4 text-right text-gray-300 font-medium">Usuários</th>
                        <th className="py-3 px-4 text-right text-gray-300 font-medium">% do Total</th>
                        <th className="py-3 px-4 text-right text-gray-300 font-medium">Taxa de Abandono</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedFunnelData.map((step, index) => {
                        const isQuestion = step.questionNumber !== undefined;
                        const isLastStep = index === detailedFunnelData.length - 1;
                        
                        return (
                          <tr 
                            key={step.step} 
                            className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${isQuestion ? 'text-sm' : 'font-medium'}`}
                          >
                            <td className="py-3 px-4 text-white">
                              <div className="flex items-center">
                                {isQuestion ? (
                                  <span className="ml-6">{step.step}</span>
                                ) : (
                                  <span className="text-cyan-400">{step.step}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-300">
                              {step.totalUsers.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center px-2 py-1 rounded bg-emerald-900/20">
                                <span className="text-emerald-400">{step.percentage.toFixed(2)}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {!isLastStep && (
                                <div className="inline-flex items-center px-2 py-1 rounded bg-rose-900/20">
                                  <span className="text-rose-400">{step.dropoff.toFixed(2)}%</span>
                                </div>
                              )}
                              {isLastStep && (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-white font-medium mb-3">Visualização Gráfica</h3>
                  <div className="relative h-10 bg-gray-700/50 rounded-lg overflow-hidden">
                    {detailedFunnelData.map((step, index) => {
                      // Calcular posição baseada na porcentagem do total
                      const width = `${step.percentage}%`;
                      const prevWidth = index > 0 ? detailedFunnelData[index-1].percentage : 0;
                      const left = `${prevWidth}%`;
                      
                      // Gerar cores diferentes para cada etapa
                      const colors = [
                        'from-cyan-500 to-blue-500',
                        'from-blue-500 to-indigo-500',
                        'from-indigo-500 to-purple-500',
                        'from-purple-500 to-pink-500',
                        'from-pink-500 to-rose-500',
                        'from-rose-500 to-orange-500',
                        'from-orange-500 to-amber-500',
                        'from-amber-500 to-yellow-500',
                        'from-yellow-500 to-lime-500',
                        'from-lime-500 to-green-500',
                        'from-green-500 to-emerald-500',
                        'from-emerald-500 to-teal-500',
                        'from-teal-500 to-cyan-500'
                      ];
                      
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <div
                          key={step.step}
                          className={`absolute h-full bg-gradient-to-r ${colorClass} opacity-80`}
                          style={{ 
                            width,
                            left,
                            transition: 'all 0.5s ease-in-out'
                          }}
                          title={`${step.step}: ${step.totalUsers} usuários (${step.percentage.toFixed(2)}%)`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Legenda */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {detailedFunnelData.map((step, index) => {
                      const colors = [
                        'from-cyan-500 to-blue-500',
                        'from-blue-500 to-indigo-500',
                        'from-indigo-500 to-purple-500',
                        'from-purple-500 to-pink-500',
                        'from-pink-500 to-rose-500',
                        'from-rose-500 to-orange-500',
                        'from-orange-500 to-amber-500',
                        'from-amber-500 to-yellow-500',
                        'from-yellow-500 to-lime-500',
                        'from-lime-500 to-green-500',
                        'from-green-500 to-emerald-500',
                        'from-emerald-500 to-teal-500',
                        'from-teal-500 to-cyan-500'
                      ];
                      
                      const colorClass = colors[index % colors.length];
                      
                      return (
                        <div key={step.step} className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 bg-gradient-to-r ${colorClass}`} />
                          <span className="text-gray-300 truncate" title={step.step}>
                            {step.step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-white">Análise do Sistema de Indicações</h2>
                  <div className="text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-md backdrop-blur-sm">
                    Período: {formatDateDisplay(dateFilter.startDate)} a {formatDateDisplay(dateFilter.endDate)}
                  </div>
                </div>

                {/* Cards de Métricas de Indicação */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                    <h3 className="text-gray-400 text-sm mb-2">Total de Indicações</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.totalReferrals}</p>
                  </div>
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                    <h3 className="text-gray-400 text-sm mb-2">Usuários Indicadores</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.activeReferrers}</p>
                  </div>
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                    <h3 className="text-gray-400 text-sm mb-2">Média de Indicações/Usuário</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.averageReferralsPerUser.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                    <h3 className="text-gray-400 text-sm mb-2">Taxa de Conversão</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.conversionRate.toFixed(2)}%</p>
                  </div>
                </div>

                {/* Top Indicadores */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-white mb-4">Top Indicadores</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left text-gray-400">Usuário</th>
                          <th className="py-3 px-4 text-right text-gray-400">Indicações</th>
                          <th className="py-3 px-4 text-right text-gray-400">Taxa de Sucesso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralData.topReferrers.map((referrer, index) => (
                          <tr key={index} className="border-b border-gray-700/50">
                            <td className="py-3 px-4 text-white">{referrer.userName}</td>
                            <td className="py-3 px-4 text-right text-gray-300">{referrer.referralCount}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-1 rounded ${
                                referrer.successRate >= 70 ? 'bg-emerald-900/20 text-emerald-400' :
                                referrer.successRate >= 50 ? 'bg-amber-900/20 text-amber-400' :
                                'bg-rose-900/20 text-rose-400'
                              }`}>
                                {referrer.successRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Análise de Cadeias de Indicação */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-white mb-4">Cadeias de Indicação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="py-2 text-left text-gray-400">Tamanho da Cadeia</th>
                            <th className="py-2 text-right text-gray-400">Quantidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralData.referralChains.map((chain, index) => (
                            <tr key={index} className="border-b border-gray-700/50">
                              <td className="py-2 text-white">{chain.chainLength} níveis</td>
                              <td className="py-2 text-right text-gray-300">{chain.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        Gráfico de distribuição de cadeias será implementado em breve
                      </div>
                    </div>
                  </div>
                </div>

                {/* Análise Temporal */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Evolução das Indicações</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left text-gray-400">Período</th>
                          <th className="py-3 px-4 text-right text-gray-400">Indicações</th>
                          <th className="py-3 px-4 text-right text-gray-400">Taxa de Conversão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralData.timeBasedAnalysis.map((period, index) => (
                          <tr key={index} className="border-b border-gray-700/50">
                            <td className="py-3 px-4 text-white">{period.period}</td>
                            <td className="py-3 px-4 text-right text-gray-300">{period.referralCount}</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-1 rounded ${
                                period.conversionRate >= 70 ? 'bg-emerald-900/20 text-emerald-400' :
                                period.conversionRate >= 50 ? 'bg-amber-900/20 text-amber-400' :
                                'bg-rose-900/20 text-rose-400'
                              }`}>
                                {period.conversionRate.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 