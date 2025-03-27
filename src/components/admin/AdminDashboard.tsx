'use client';

import { useState, useEffect, useCallback } from 'react';
import { FunnelChart } from './FunnelChart';
import { getSupabaseClient } from '@/lib/supabase';
import { FiUsers, FiBarChart2, FiTrendingUp, FiPieChart, FiCalendar, FiRefreshCw, FiChevronDown, FiDownload, FiFilter, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export interface FunnelData {
  stepName: string;
  totalUsers: number;
  retentionRate: number;
  dropoffRate: number;
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
  previousPeriodConversionRate?: number;
  topReferrers: {
    userName: string;
    referralCount: number;
    successRate: number;
    openRate?: number;
    previousReferralCount?: number;
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
  channelDistribution?: {
    channel: string;
    count: number;
    percentage: number;
  }[];
}

// Adicionando interface para as perguntas do quiz
interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  active: boolean;
  question_order: number;
  difficulty?: 'fácil' | 'médio' | 'difícil';
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
    previousPeriodConversionRate: 0,
    topReferrers: [],
    referralChains: [],
    timeBasedAnalysis: [],
    channelDistribution: []
  });
  const [activeTab, setActiveTab] = useState('funnel');
  
  // Estados para gerenciamento de perguntas
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
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
  
  // Estados para ordenação de tabela
  const [referrersSort, setReferrersSort] = useState({ field: 'referralCount', direction: 'desc' });
  // Estado para filtro de canal de referência
  const [channelFilter, setChannelFilter] = useState('todos');
  // Estado para exportação
  const [isExporting, setIsExporting] = useState(false);
  
  // Formatador de data para exibição amigável
  const formatDateDisplay = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para carregar as perguntas do quiz
  const fetchQuizQuestions = useCallback(async () => {
    try {
      setIsLoadingQuestions(true);
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('question_order', { ascending: true });
      
      if (error) {
        console.error('Erro ao carregar perguntas do quiz:', error);
        return;
      }
      
      if (data) {
        setQuizQuestions(data);
      }
    } catch (error) {
      console.error('Erro ao processar perguntas do quiz:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

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
          .filter('created_at', 'gte', startDate.toISOString())
          .filter('created_at', 'lte', endDate.toISOString());
        
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
      
      // Calcular datas do período anterior (mesmo intervalo de tempo)
      const timeDiff = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - timeDiff);
      const previousEndDate = new Date(startDate.getTime() - 1);
      
      console.log('Consultando quiz_results no período:', {
        startDateFormatted: startDate.toISOString(),
        endDateFormatted: endDate.toISOString(),
        label: dateFilter.label
      });
      
      // Buscar resultados do quiz com filtro de data no lado do servidor
      const result = await supabase
        .from('quiz_results')
        .select('*')
        .filter('created_at', 'gte', startDate.toISOString())
        .filter('created_at', 'lte', endDate.toISOString())
        .limit(1000);

      // Buscar dados do período anterior para comparação
      const previousResult = await supabase
        .from('quiz_results')
        .select('*')
        .filter('created_at', 'gte', previousStartDate.toISOString())
        .filter('created_at', 'lte', previousEndDate.toISOString())
        .limit(1000);

      if (result.error) {
        console.error('Erro ao buscar dados de indicações:', result.error);
        return;
      }

      const quizResults = (result.data || []) as QuizResult[];
      const previousQuizResults = (previousResult.data || []) as QuizResult[];
      console.log(`Encontrados ${quizResults.length} resultados de quiz no período selecionado`);
      
      // Processar dados para análise
      const referrers = new Map();
      const chains = new Map();
      const timeAnalysis = new Map();
      const channels = new Map();
      
      // Dados do período anterior para comparação
      const previousReferrers = new Map();
      
      // Processar dados do período anterior
      previousQuizResults?.forEach(result => {
        if (result.referral_code && result.referred_by) {
          const referrer = result.referred_by;
          previousReferrers.set(referrer, (previousReferrers.get(referrer) || 0) + 1);
        }
      });
      
      // Calcular taxa de conversão no período anterior
      const previousTotalReferrals = previousQuizResults?.filter(r => r.referral_code).length || 0;
      const previousConversions = previousQuizResults?.filter(r => r.referral_code && r.score !== undefined && r.score >= 7).length || 0;
      const previousConversionRate = previousTotalReferrals > 0 ? (previousConversions / previousTotalReferrals * 100) : 0;
      
      quizResults?.forEach(result => {
        // Contar indicações por usuário
        if (result.referral_code) {
          const referrer = result.referred_by;
          
          // Extração simples do canal de origem (simulado)
          // Na implementação real isso viria dos metadados ou de um campo específico
          const channel = result.referral_code.includes('whatsapp') ? 'WhatsApp' : 
                         result.referral_code.includes('email') ? 'Email' : 
                         result.referral_code.includes('facebook') ? 'Facebook' : 'Outro';
          
          channels.set(channel, (channels.get(channel) || 0) + 1);
          
          if (referrer) {
            const referrerData = referrers.get(referrer) || { 
              userName: result.user_name || 'Usuário',
              referralCount: 0,
              successfulReferrals: 0,
              openCount: 0
            };
            referrerData.referralCount++;
            
            // Simulação de taxa de abertura (na implementação real viria de outra tabela)
            const openRate = Math.random() > 0.3; // Simulando 70% de taxa de abertura
            if (openRate) {
              referrerData.openCount++;
            }
            
            if (result.score !== undefined && result.score >= 7) {
              referrerData.successfulReferrals++;
            }
            
            // Adicionar contagem anterior
            referrerData.previousCount = previousReferrers.get(referrer) || 0;
            
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
      const conversionRate = totalReferrals > 0 ? 
        (quizResults?.filter(r => r.referral_code && r.score !== undefined && r.score >= 7).length || 0) / totalReferrals * 100 : 0;
      
      // Preparar top referrers
      const topReferrersList = Array.from(referrers.values())
        .map(r => ({
          userName: r.userName,
          referralCount: r.referralCount,
          successRate: (r.successfulReferrals / r.referralCount) * 100,
          openRate: (r.openCount / r.referralCount) * 100,
          previousReferralCount: r.previousCount
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
      
      // Preparar distribuição por canais
      const channelDistributionList = Array.from(channels.entries())
        .map(([channel, count]) => ({
          channel,
          count,
          percentage: (count / totalReferrals) * 100
        }))
        .sort((a, b) => b.count - a.count);
      
      // Atualizar estado
      setReferralData({
        totalReferrals,
        activeReferrers,
        averageReferralsPerUser: averageReferrals,
        conversionRate: conversionRate,
        previousPeriodConversionRate: previousConversionRate,
        topReferrers: topReferrersList,
        referralChains: referralChainsList,
        timeBasedAnalysis: timeBasedAnalysisList,
        channelDistribution: channelDistributionList
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
    
    // Iniciar carregamento de dados
    fetchFunnelData();
    fetchReferralData();
  }, [fetchFunnelData, fetchReferralData, dateFilter]);

  // Atualizar dados quando o componente montar
  useEffect(() => {
    applyDateFilter();
    fetchQuizQuestions(); // Carregar perguntas ao montar o componente
  }, [applyDateFilter, fetchQuizQuestions]);

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

  // Função para exportar dados
  const handleExportData = () => {
    setIsExporting(true);
    
    // Simular atraso de processamento
    setTimeout(() => {
      try {
        // Preparar dados para exportação
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Cabeçalhos
        csvContent += "Período,Indicações,Taxa de Conversão\n";
        
        // Dados
        referralData.timeBasedAnalysis.forEach(row => {
          csvContent += `${row.period},${row.referralCount},${row.conversionRate.toFixed(2)}%\n`;
        });
        
        // Criar link para download
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `indicacoes_${dateFilter.startDate}_${dateFilter.endDate}.csv`);
        document.body.appendChild(link);
        
        // Simular clique no link
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Erro ao exportar dados:', error);
        alert('Erro ao exportar dados. Tente novamente.');
      } finally {
        setIsExporting(false);
      }
    }, 800);
  };

  // Função para ordenar tabela de referrers
  const handleSortReferrers = (field) => {
    setReferrersSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Função para filtrar por canal
  const handleChannelFilter = (channel) => {
    setChannelFilter(channel);
  };

  // Função para salvar uma pergunta (criar ou atualizar)
  const saveQuestion = async (questionData: QuizQuestion) => {
    try {
      const supabase = getSupabaseClient();
      
      // Garantir que difficulty tenha um valor válido
      const difficulty = questionData.difficulty || 'médio';
      
      // Log para debug
      console.log('Dados da pergunta a serem salvos:', {
        ...questionData,
        difficulty
      });
      
      if (questionData.id) {
        // Atualizar pergunta existente
        const { error } = await supabase
          .from('quiz_questions')
          .update({
            question: questionData.question,
            options: questionData.options,
            correct_answer: questionData.correct_answer,
            explanation: questionData.explanation || null,
            active: questionData.active,
            question_order: questionData.question_order,
            difficulty: difficulty,
            updated_at: new Date().toISOString()
          })
          .eq('id', questionData.id);
          
        if (error) {
          console.error('Erro ao atualizar pergunta:', error);
          return false;
        }
      } else {
        // Verificar se a coluna difficulty existe
        try {
          // Primeiro, tentamos inserir com o campo difficulty
          const { error } = await supabase
            .from('quiz_questions')
            .insert({
              question: questionData.question,
              options: questionData.options,
              correct_answer: questionData.correct_answer,
              explanation: questionData.explanation || null,
              active: questionData.active,
              question_order: questionData.question_order,
              difficulty: difficulty,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (error) {
            // Se o erro for relacionado ao campo difficulty não existir
            if (error.message && error.message.includes('difficulty')) {
              console.warn('A coluna difficulty não existe. Execute o script add_difficulty_field.sql.');
              
              // Tentar novamente sem o campo difficulty
              const { error: error2 } = await supabase
                .from('quiz_questions')
                .insert({
                  question: questionData.question,
                  options: questionData.options,
                  correct_answer: questionData.correct_answer,
                  explanation: questionData.explanation || null,
                  active: questionData.active,
                  question_order: questionData.question_order,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (error2) {
                console.error('Erro ao inserir pergunta sem o campo difficulty:', error2);
                return false;
              }
            } else {
              console.error('Erro ao inserir pergunta:', error);
              return false;
            }
          }
        } catch (insertError) {
          console.error('Erro na tentativa de inserção:', insertError);
          return false;
        }
      }
      
      // Recarregar a lista de perguntas
      await fetchQuizQuestions();
      return true;
    } catch (error) {
      console.error('Erro ao salvar pergunta:', error);
      return false;
    }
  };

  // Função para excluir uma pergunta
  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setIsLoadingQuestions(true);
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
        
      if (error) {
        console.error('Erro ao excluir pergunta:', error);
        alert('Erro ao excluir pergunta. Tente novamente.');
        return;
      }
      
      // Recarregar perguntas após excluir
      fetchQuizQuestions();
      
    } catch (error) {
      console.error('Erro ao excluir pergunta:', error);
      alert('Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Função para criar uma pergunta
  const handleAddQuestion = () => {
    setEditingQuestion({
      question: '',
      options: ['', ''],
      correct_answer: 0,
      active: true,
      question_order: quizQuestions.length + 1,
      difficulty: 'médio'
    });
    setShowQuestionForm(true);
  };

  // Função para editar uma pergunta existente
  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  // Manipular mudanças no formulário de pergunta
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (editingQuestion) {
      setEditingQuestion(prev => {
        if (!prev) return prev;
        
        if (name === 'correct_answer') {
          return { ...prev, [name]: parseInt(value) };
        }
        
        if (name === 'active') {
          return { ...prev, [name]: value === 'true' };
        }
        
        return { ...prev, [name]: value };
      });
    }
  };

  // Manipular mudanças nas opções
  const handleOptionChange = (index: number, value: string) => {
    if (editingQuestion) {
      setEditingQuestion(prev => {
        if (!prev) return prev;
        
        const newOptions = [...prev.options];
        newOptions[index] = value;
        
        return { ...prev, options: newOptions };
      });
    }
  };

  // Adicionar opção
  const handleAddOption = () => {
    if (editingQuestion) {
      setEditingQuestion(prev => {
        if (!prev) return prev;
        
        return { ...prev, options: [...prev.options, ''] };
      });
    }
  };

  // Remover opção
  const handleRemoveOption = (index: number) => {
    if (editingQuestion) {
      setEditingQuestion(prev => {
        if (!prev) return prev;
        
        const newOptions = [...prev.options];
        newOptions.splice(index, 1);
        
        // Ajustar resposta correta se necessário
        let correctAnswer = prev.correct_answer;
        if (correctAnswer === index) {
          correctAnswer = 0;
        } else if (correctAnswer > index) {
          correctAnswer--;
        }
        
        return { 
          ...prev, 
          options: newOptions,
          correct_answer: correctAnswer
        };
      });
    }
  };

  // Enviar formulário
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingQuestion) return;
    
    // Verificar se há opções vazias
    if (editingQuestion.options.some(option => !option.trim())) {
      alert('Todas as opções devem ser preenchidas');
      return;
    }
    
    setIsLoadingQuestions(true);
    
    try {
      const success = await saveQuestion(editingQuestion);
      if (success) {
        setShowQuestionForm(false);
        setEditingQuestion(null);
      } else {
        alert('Erro ao salvar pergunta. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      alert('Ocorreu um erro inesperado. Verifique o console para mais detalhes.');
    } finally {
      setIsLoadingQuestions(false);
    }
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
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-3 px-1 relative ${
                  activeTab === 'questions'
                    ? 'text-cyan-400 font-medium'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Configuração do Quiz
                {activeTab === 'questions' && (
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
            ) : activeTab === 'referrals' ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-lg font-medium text-white">Análise do Sistema de Indicações</h2>
                  <div className="flex items-center space-x-3 mt-3 md:mt-0">
                    <div className="text-xs text-gray-400 bg-gray-800/70 px-2 py-1 rounded-md backdrop-blur-sm">
                      Período: {formatDateDisplay(dateFilter.startDate)} a {formatDateDisplay(dateFilter.endDate)}
                    </div>
                    
                    {/* Filtro de canal */}
                    <div className="relative">
                      <button
                        onClick={() => handleChannelFilter(channelFilter === 'todos' ? referralData.channelDistribution?.[0]?.channel || 'todos' : 'todos')}
                        className="flex items-center text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <FiFilter className="mr-1" /> 
                        {channelFilter === 'todos' ? 'Todos os canais' : `Canal: ${channelFilter}`}
                      </button>
                    </div>
                    
                    {/* Botão de exportação */}
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className={`flex items-center text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-md transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiDownload className={`mr-1 ${isExporting ? 'animate-pulse' : ''}`} /> 
                      {isExporting ? 'Exportando...' : 'Exportar CSV'}
                    </button>
                  </div>
                </div>

                {/* Cards de Métricas de Indicação com indicadores de tendência */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:shadow-lg transition-all">
                    <h3 className="text-gray-400 text-sm mb-2">Total de Indicações</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.totalReferrals}</p>
                    <div className="flex items-center mt-2 text-xs">
                      <span className={referralData.totalReferrals > 0 ? "text-emerald-400" : "text-gray-500"}>
                        +{referralData.totalReferrals} desde {formatDateDisplay(dateFilter.startDate)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:shadow-lg transition-all">
                    <h3 className="text-gray-400 text-sm mb-2">Usuários Indicadores</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.activeReferrers}</p>
                    <div className="flex items-center mt-2 text-xs">
                      <span className="text-gray-400">
                        {(referralData.totalReferrals / Math.max(1, referralData.activeReferrers)).toFixed(1)} indicações por usuário
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:shadow-lg transition-all">
                    <h3 className="text-gray-400 text-sm mb-2">Média de Indicações/Usuário</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.averageReferralsPerUser.toFixed(2)}</p>
                    <div className="flex items-center mt-2 text-xs">
                      <span className="text-gray-400">
                        {referralData.activeReferrers} usuários ativos
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 hover:shadow-lg transition-all">
                    <h3 className="text-gray-400 text-sm mb-2">Taxa de Conversão</h3>
                    <p className="text-2xl font-semibold text-white">{referralData.conversionRate.toFixed(2)}%</p>
                    <div className="flex items-center mt-2 text-xs">
                      {referralData.previousPeriodConversionRate !== undefined && (
                        <>
                          {referralData.conversionRate > referralData.previousPeriodConversionRate ? (
                            <span className="text-emerald-400 flex items-center">
                              <FiArrowUp className="mr-1" /> +{(referralData.conversionRate - referralData.previousPeriodConversionRate).toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center">
                              <FiArrowDown className="mr-1" /> {(referralData.conversionRate - referralData.previousPeriodConversionRate).toFixed(2)}%
                            </span>
                          )}
                          <span className="ml-1 text-gray-500">vs. período anterior</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nova seção: Distribuição por Canal */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-white mb-4">Distribuição por Canais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-3 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="py-2 text-left text-gray-400">Canal</th>
                            <th className="py-2 text-right text-gray-400">Indicações</th>
                            <th className="py-2 text-right text-gray-400">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralData.channelDistribution?.map((channel, index) => (
                            <tr 
                              key={index} 
                              className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all"
                            >
                              <td className="py-2 text-white">{channel.channel}</td>
                              <td className="py-2 text-right text-gray-300">{channel.count}</td>
                              <td className="py-2 text-right text-gray-300">{channel.percentage.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Top Indicadores com ordenação e taxa de abertura */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Top Indicadores</h3>
                    <span className="text-xs text-gray-400">Clique nas colunas para ordenar</span>
                  </div>
                  <div className="overflow-x-auto bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th 
                            className="py-3 px-4 text-left text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                            onClick={() => handleSortReferrers('referralCount')}
                          >
                            <div className="flex items-center justify-end">
                              Indicações
                              {referrersSort.field === 'referralCount' && (
                                <span className="ml-1">
                                  {referrersSort.direction === 'desc' ? '↓' : '↑'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="py-3 px-4 text-right text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                            onClick={() => handleSortReferrers('successRate')}
                          >
                            <div className="flex items-center justify-end">
                              Taxa de Sucesso
                              {referrersSort.field === 'successRate' && (
                                <span className="ml-1">
                                  {referrersSort.direction === 'desc' ? '↓' : '↑'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th 
                            className="py-3 px-4 text-right text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                            onClick={() => handleSortReferrers('openRate')}
                          >
                            <div className="flex items-center justify-end">
                              Taxa de Abertura
                              {referrersSort.field === 'openRate' && (
                                <span className="ml-1">
                                  {referrersSort.direction === 'desc' ? '↓' : '↑'}
                                </span>
                              )}
                            </div>
                          </th>
                          <th className="py-3 px-4 text-right text-gray-400">Tendência</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralData.topReferrers
                          .sort((a, b) => {
                            const aValue = a[referrersSort.field];
                            const bValue = b[referrersSort.field];
                            return referrersSort.direction === 'desc' ? bValue - aValue : aValue - bValue;
                          })
                          .map((referrer, index) => (
                            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all">
                              <td className="py-3 px-4 text-white font-medium">{referrer.userName}</td>
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
                              <td className="py-3 px-4 text-right">
                                <span className={`px-2 py-1 rounded ${
                                  referrer.openRate >= 70 ? 'bg-emerald-900/20 text-emerald-400' :
                                  referrer.openRate >= 50 ? 'bg-amber-900/20 text-amber-400' :
                                  'bg-rose-900/20 text-rose-400'
                                }`}>
                                  {referrer.openRate?.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {referrer.previousReferralCount !== undefined && (
                                  <div className="flex items-center justify-end">
                                    {referrer.referralCount > referrer.previousReferralCount ? (
                                      <span className="text-emerald-400 flex items-center">
                                        <FiArrowUp className="mr-1" /> +{referrer.referralCount - referrer.previousReferralCount}
                                      </span>
                                    ) : referrer.referralCount < referrer.previousReferralCount ? (
                                      <span className="text-rose-400 flex items-center">
                                        <FiArrowDown className="mr-1" /> {referrer.referralCount - referrer.previousReferralCount}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">Estável</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Análise de Cadeias de Indicação com gráfico */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Cadeias de Indicação</h3>
                    <div className="bg-gray-800/70 px-2 py-1 rounded text-xs text-cyan-400 flex items-center">
                      <span className="mr-1">ℹ️</span> Indicações sucessivas conectadas entre usuários
                    </div>
                  </div>
                  
                  {/* Card explicativo */}
                  <div className="bg-indigo-900/20 border border-indigo-700/50 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                          <path d="M12 17h.01"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-indigo-300 text-sm font-medium mb-1">O que são níveis de cadeia?</h4>
                        <p className="text-gray-300 text-xs leading-relaxed">
                          Representam a profundidade das indicações sucessivas. Por exemplo, um usuário que indicou outro, 
                          que por sua vez indicou mais pessoas, forma uma cadeia de múltiplos níveis. 
                          Quanto mais níveis, maior é o efeito viral das suas indicações.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Visualização de exemplos para um entendimento claro */}
                    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                      <h4 className="text-white text-sm font-medium mb-3 text-center">Exemplo Visual</h4>
                      
                      <div className="flex flex-col items-center space-y-6 py-2">
                        {/* Nível 0 - removido */}
                        
                        {/* Nível 1 - agora é o primeiro nível */}
                        <div className="relative">
                          {/* Removida conexão do nível 0 */}
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 flex items-center justify-center text-sm font-medium">
                              Nível 1
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Indicou alguém</div>
                          </div>
                        </div>
                        
                        {/* Nível 2 */}
                        <div className="relative">
                          <div className="absolute h-6 w-0.5 bg-gradient-to-b from-cyan-500 to-blue-500 -top-6 left-1/2 transform -translate-x-1/2"></div>
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 flex items-center justify-center text-sm font-medium">
                              Nível 2
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Indicado que indicou</div>
                          </div>
                        </div>
                        
                        {/* Nível 3 */}
                        <div className="relative">
                          <div className="absolute h-6 w-0.5 bg-gradient-to-b from-blue-500 to-indigo-500 -top-6 left-1/2 transform -translate-x-1/2"></div>
                          <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 flex items-center justify-center text-sm font-medium">
                              Nível 3
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Crescimento viral</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-700/20 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-300 leading-relaxed">
                          <span className="font-medium text-white">Como funciona:</span> Cada nível representa uma etapa na cadeia de indicação. O nível 1 mostra pessoas que indicaram alguém, o nível 2 são pessoas indicadas que também indicaram outros, e o nível 3 representa o crescimento viral.
                        </p>
                      </div>
                    </div>
                    
                    {/* Gráfico moderno e interativo */}
                    <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5">
                      <div className="mb-3 text-center">
                        <h4 className="text-white text-sm font-medium">Distribuição de Cadeias por Níveis</h4>
                        <p className="text-gray-400 text-xs mt-1">Visualização em árvore das cadeias de indicação</p>
                      </div>
                      
                      {/* Gráfico em formato de árvore horizontal */}
                      <div className="relative h-[250px] mt-4">
                        {/* Container do gráfico em árvore */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Estrutura de árvore horizontal */}
                          <div className="w-full h-full relative px-4">
                            {(() => {
                              // Preparar dados para visualização
                              const data = referralData.referralChains.reduce((acc, chain) => {
                                acc[chain.chainLength] = chain.count;
                                return acc;
                              }, {});
                              
                              // Buscar dados de pessoas que completaram o quiz
                              const quizCompletions = funnelData[2]?.totalUsers || 0;
                              
                              // Corrigir a lógica: Nível 0 representa TODAS as pessoas que completaram o quiz
                              // Nível 1, 2, 3, etc. são os níveis da cadeia de indicação
                              
                              // Calcular pessoas que apenas completaram mas não indicaram
                              const level1Count = data[1] || 0;
                              const level2Count = data[2] || 0;
                              const level3Count = data[3] || 0;
                              const higherLevelsCount = Object.entries(data)
                                .filter(([level]) => parseInt(level) >= 4)
                                .reduce((sum, [, count]) => sum + count, 0);
                              
                              // Total de pessoas que fizeram alguma indicação
                              const totalReferrers = level1Count + level2Count + level3Count + higherLevelsCount;
                              
                              // Pessoas que completaram mas não indicaram (nível 0 corrigido)
                              const completedButNotReferred = quizCompletions - totalReferrers;
                              
                              // Atualizar o nível 0 para representar apenas quem completou e não indicou
                              data[0] = completedButNotReferred > 0 ? completedButNotReferred : 0;
                              
                              // Número total de usuários em todas as cadeias (agora inclui todos que completaram)
                              const totalUsers = quizCompletions;
                              
                              // Calcular fator de escala para os nós com base no total correto
                              const scaleFactor = (val) => Math.max(Math.sqrt(val / (totalUsers || 1)) * 100, 24);
                              
                              // Tornar data acessível fora desta função
                              window.chartData = data;
                              window.totalReferrers = totalReferrers;
                              
                              // Validar consistência dos dados
                              // Se o total de pessoas que indicaram for maior que quem concluiu o quiz, há inconsistência
                              const somaNiveis = (data[1] || 0) + (data[2] || 0) + (data[3] || 0);
                              const totalIndicacoesAjustado = Math.min(somaNiveis, quizCompletions);
                              const fatorAjuste = somaNiveis > 0 ? totalIndicacoesAjustado / somaNiveis : 1;
                              
                              // Ajustar os dados para manter a proporção entre níveis, mas sem exceder o total de quiz
                              if (fatorAjuste < 1) {
                                data[1] = Math.floor((data[1] || 0) * fatorAjuste);
                                data[2] = Math.floor((data[2] || 0) * fatorAjuste);
                                data[3] = Math.floor((data[3] || 0) * fatorAjuste);
                                // Atualizar o window.chartData com valores ajustados
                                window.chartData = data;
                              }
                              
                              // Renderizar o gráfico em árvore horizontal
                              return (
                                <div className="h-full flex items-center">
                                  {/* Níveis alinhados horizontalmente */}
                                  <div className="flex items-center justify-between w-full h-full relative">
                                    {/* Nível 0 - removido */}
                                    
                                    {/* Nível 1 - agora é o primeiro nível */}
                                    <div className="flex flex-col items-center relative ml-0">
                                      <div 
                                        className="rounded-full bg-cyan-500/30 border-2 border-cyan-500 flex items-center justify-center shadow-lg relative group hover:bg-cyan-500/40 transition-all"
                                        style={{ 
                                          width: `${scaleFactor(data[1] || 0)}px`, 
                                          height: `${scaleFactor(data[1] || 0)}px`,
                                          minWidth: '24px',
                                          minHeight: '24px'
                                        }}
                                      >
                                        <div className="text-center">
                                          <div className="text-cyan-300 text-[10px] font-medium">Nível 1</div>
                                          <div className="text-white font-bold text-xs">{data[1] || 0}</div>
                    </div>
                                        
                                        {/* Tooltip para nível 1 */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 transform -translate-y-full px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl text-xs z-10 whitespace-nowrap">
                                          <div className="font-medium text-white mb-1">Cadeias de 1 nível</div>
                                          <div className="text-gray-300 flex justify-between gap-3">
                                            <span>Quantidade:</span> 
                                            <span className="font-medium text-cyan-400">{data[1] || 0}</span>
                  </div>
                                          <div className="mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30">
                                              {Math.round((data[1] / quizCompletions) * 100)}% dos usuários
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400 mt-2">Indicou alguém</div>
                                      
                                      {/* Conexão horizontal - sempre visível */}
                                      <div className="absolute w-16 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 top-1/2 -right-16"></div>
                                    </div>
                                    
                                    {/* Nível 2 */}
                                    <div className="flex flex-col items-center relative">
                                      <div 
                                        className="rounded-full bg-blue-500/30 border-2 border-blue-500 flex items-center justify-center shadow-lg relative group hover:bg-blue-500/40 transition-all"
                                        style={{ 
                                          width: `${scaleFactor(data[2] || 0)}px`, 
                                          height: `${scaleFactor(data[2] || 0)}px`,
                                          minWidth: '24px',
                                          minHeight: '24px'
                                        }}
                                      >
                                        <div className="text-center">
                                          <div className="text-blue-300 text-[10px] font-medium">Nível 2</div>
                                          <div className="text-white font-bold text-xs">{data[2] || 0}</div>
                                        </div>
                                        
                                        {/* Tooltip para nível 2 */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 transform -translate-y-full px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl text-xs z-10 whitespace-nowrap">
                                          <div className="font-medium text-white mb-1">Cadeias de 2 níveis</div>
                                          <div className="text-gray-300 flex justify-between gap-3">
                                            <span>Quantidade:</span> 
                                            <span className="font-medium text-cyan-400">{data[2] || 0}</span>
                                          </div>
                                          <div className="mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30">
                                              Impacto básico
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400 mt-2">Indicado que indicou</div>
                                      
                                      {/* Conexão horizontal - sempre visível */}
                                      <div className="absolute w-16 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 top-1/2 -right-16"></div>
                                    </div>
                                    
                                    {/* Nível 3 - sempre exibido mesmo com valor 0 */}
                                    <div className="flex flex-col items-center relative">
                                      <div 
                                        className="rounded-full bg-indigo-500/30 border-2 border-indigo-500 flex items-center justify-center shadow-lg relative group hover:bg-indigo-500/40 transition-all"
                                        style={{ 
                                          width: `${scaleFactor(data[3] || 0)}px`, 
                                          height: `${scaleFactor(data[3] || 0)}px`,
                                          minWidth: '24px',
                                          minHeight: '24px'
                                        }}
                                      >
                                        <div className="text-center">
                                          <div className="text-indigo-300 text-[10px] font-medium">Nível 3</div>
                                          <div className="text-white font-bold text-xs">{data[3] || 0}</div>
                                        </div>
                                        
                                        {/* Tooltip para nível 3 */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 transform -translate-y-full px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl text-xs z-10 whitespace-nowrap">
                                          <div className="font-medium text-white mb-1">Cadeias de 3 níveis</div>
                                          <div className="text-gray-300 flex justify-between gap-3">
                                            <span>Quantidade:</span> 
                                            <span className="font-medium text-cyan-400">{data[3] || 0}</span>
                                          </div>
                                          <div className="mt-1">
                                            <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                                              Impacto médio
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400 mt-2">Crescimento viral</div>
                                      
                                      {/* Removida conexão para o nível 4+ */}
                                    </div>
                                    
                                    {/* Nível 4+ removido conforme solicitação */}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-gray-700/20 rounded-lg border border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="text-cyan-400 mt-0.5">🌳</div>
                          <div>
                            <p className="text-xs text-gray-300 leading-relaxed">
                              <span className="font-medium text-white">Interpretação:</span> O tamanho de cada círculo representa a quantidade de cadeias 
                              em cada nível. Quanto mais à direita, maior o efeito viral das indicações. O nível 1 são pessoas que indicaram, nível 2 são indicações que geraram outras indicações, e nível 3 representa o crescimento viral.
                            </p>
                            <p className="text-xs text-gray-300 mt-2">
                              <span className="font-medium text-emerald-400">Total de usuários que indicaram:</span> {Math.min(((window.chartData?.[1] || 0) + (window.chartData?.[2] || 0) + (window.chartData?.[3] || 0)), funnelData[2]?.totalUsers || 0)} <span className="text-xs text-gray-500">(limitado ao total de {funnelData[2]?.totalUsers || 0} concluintes do quiz)</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Análise Temporal */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Evolução das Indicações</h3>
                  
                  <div className="overflow-x-auto bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl">
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
                          <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-all">
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
            ) : activeTab === 'questions' ? (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-white">Configuração de Perguntas do Quiz</h2>
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-indigo-700 text-indigo-100 rounded-lg hover:bg-indigo-600 transition-colors flex items-center"
                    disabled={isLoadingQuestions}
                  >
                    Nova Pergunta
                  </button>
                </div>

                {/* Formulário de edição/criação de pergunta */}
                {showQuestionForm && editingQuestion && (
                  <div className="mb-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5 shadow-lg">
                    <h3 className="text-lg font-medium text-white mb-4">
                      {editingQuestion.id ? 'Editar Pergunta' : 'Nova Pergunta'}
                    </h3>
                    
                    <form onSubmit={handleSubmitQuestion}>
                      <div className="mb-4">
                        <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-1">
                          Pergunta
                        </label>
                        <textarea
                          id="question"
                          name="question"
                          value={editingQuestion.question}
                          onChange={handleQuestionChange}
                          required
                          rows={3}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Opções de Resposta
                        </label>
                        {editingQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center mb-2">
                            <input
                              type="radio"
                              name="correct_answer"
                              value={index}
                              checked={editingQuestion.correct_answer === index}
                              onChange={handleQuestionChange}
                              className="mr-2 accent-cyan-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              required
                              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                              placeholder={`Opção ${index + 1}`}
                            />
                            {editingQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(index)}
                                className="ml-2 text-rose-400 hover:text-rose-300 transition-colors"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          + Adicionar opção
                        </button>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="explanation" className="block text-sm font-medium text-gray-300 mb-1">
                          Explicação (opcional)
                        </label>
                        <textarea
                          id="explanation"
                          name="explanation"
                          value={editingQuestion.explanation || ''}
                          onChange={handleQuestionChange}
                          rows={2}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                          placeholder="Explicação da resposta correta"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="order" className="block text-sm font-medium text-gray-300 mb-1">
                          Ordem
                        </label>
                        <input
                          type="number"
                          id="order"
                          name="question_order"
                          value={editingQuestion.question_order}
                          onChange={handleQuestionChange}
                          required
                          min="1"
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-1">
                          Dificuldade
                        </label>
                        <select
                          id="difficulty"
                          name="difficulty"
                          value={editingQuestion.difficulty || 'médio'}
                          onChange={handleQuestionChange}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                          <option value="fácil">Fácil</option>
                          <option value="médio">Médio</option>
                          <option value="difícil">Difícil</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="active" className="block text-sm font-medium text-gray-300 mb-1">
                          Status
                        </label>
                        <select
                          id="active"
                          name="active"
                          value={editingQuestion.active.toString()}
                          onChange={handleQuestionChange}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                          <option value="true">Ativa</option>
                          <option value="false">Inativa</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuestionForm(false);
                            setEditingQuestion(null);
                          }}
                          className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-cyan-700 text-cyan-100 rounded-lg hover:bg-cyan-600 transition-colors"
                          disabled={isLoadingQuestions}
                        >
                          {isLoadingQuestions ? 'Salvando...' : 'Salvar Pergunta'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Lista de perguntas */}
                {isLoadingQuestions && !showQuestionForm ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-12 h-12 border-4 border-t-cyan-500 border-gray-700/30 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400">Carregando perguntas...</p>
                    </div>
                  </div>
                ) : quizQuestions.length === 0 ? (
                  <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-8 text-center">
                    <p className="text-gray-400 mb-4">Nenhuma pergunta configurada ainda.</p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={handleAddQuestion}
                        className="px-4 py-2 bg-indigo-700 text-indigo-100 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center"
                      >
                        Criar primeira pergunta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="space-y-4 mb-8">
                      {quizQuestions.map((question, index) => (
                        <div
                          key={question.id || index}
                          className={`bg-gray-800/80 backdrop-blur-sm border ${
                            question.active ? 'border-gray-700/50' : 'border-gray-700/30'
                          } rounded-xl p-5 shadow-lg hover:shadow-xl transition-all ${
                            !question.active && 'opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="bg-gray-700 rounded-full h-8 w-8 flex items-center justify-center mr-3">
                                <span className="text-sm text-white font-medium">{question.question_order}</span>
                              </div>
                              <h3 className="text-white font-medium">{question.question}</h3>
                            </div>
                            <div className="flex items-center">
                              <button
                                onClick={() => handleEditQuestion(question)}
                                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors mr-2"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => question.id && deleteQuestion(question.id)}
                                className="px-3 py-1 bg-rose-700/70 text-rose-100 rounded-lg hover:bg-rose-600 transition-colors"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-4 pl-11">
                            <p className="text-sm text-gray-400 mb-2">Opções:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className={`text-sm p-2 rounded-lg ${
                                    optIndex === question.correct_answer
                                      ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-700/30'
                                      : 'bg-gray-700/50 text-gray-300'
                                  }`}
                                >
                                  {optIndex === question.correct_answer && (
                                    <span className="inline-block mr-1 text-xs">✓</span>
                                  )}
                                  {option}
                                </div>
                              ))}
                            </div>
                            
                            {question.explanation && (
                              <div className="mt-3 p-3 bg-gray-700/30 border border-gray-700/50 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Explicação:</p>
                                <p className="text-sm text-gray-300">{question.explanation}</p>
                              </div>
                            )}
                            
                            <div className="mt-3 flex gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                question.active
                                  ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-700/30'
                                  : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
                              }`}>
                                {question.active ? 'Ativa' : 'Inativa'}
                              </span>
                              
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                question.difficulty === 'fácil' ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-700/30' :
                                question.difficulty === 'difícil' ? 'bg-rose-900/20 text-rose-400 border border-rose-700/30' :
                                'bg-amber-900/20 text-amber-400 border border-amber-700/30'
                              }`}>
                                {question.difficulty || 'Médio'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 