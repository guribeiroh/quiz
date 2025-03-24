import { getSupabaseClient } from './supabase';
import { FunnelData } from '../components/admin/AdminDashboard';
import { DateRange } from '../components/admin/DateFilter';

// Interface para os dados de eventos de usuário
interface UserEvent {
  event_type: string;
  user_id?: string;
  session_id: string;
  timestamp: number;
  page: string;
  step: string;
  metadata?: Record<string, unknown>;
}

// Função para rastrear eventos de usuário
export async function trackUserEvent(event: Omit<UserEvent, 'timestamp'>) {
  try {
    const supabase = getSupabaseClient();
    
    // Adicionar timestamp atual (em milissegundos desde o epoch)
    const eventWithTimestamp: UserEvent = {
      ...event,
      timestamp: Date.now()
    };
    
    console.log('Registrando evento:', eventWithTimestamp);
    
    const result = await supabase
      .from('user_events')
      .insert(eventWithTimestamp as unknown as Record<string, unknown>)
      .select();
    
    if (result.error) {
      console.error('Erro ao salvar evento:', result.error);
      return { success: false, error: result.error };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar evento:', error);
    return { success: false, error };
  }
}

// Função para rastrear visualização de página/etapa
export async function trackStepView(step: string, sessionId: string, userId?: string) {
  return trackUserEvent({
    event_type: 'page_view',
    user_id: userId,
    session_id: sessionId,
    page: window.location.pathname,
    step,
    metadata: {
      url: window.location.href,
      referrer: document.referrer
    }
  });
}

// Enum para os passos do funil
export enum FunnelStep {
  WELCOME = 'Tela de Boas-vindas',
  QUESTION = 'Respondendo Perguntas',
  LEAD_CAPTURE = 'Captura de Dados',
  QUIZ_RESULT = 'Resultado do Quiz'
}

// Função para obter dados analíticos do funil
export async function getQuizAnalytics(dateRange?: DateRange): Promise<FunnelData[]> {
  try {
    // Se estamos no ambiente de servidor durante build, retornar dados vazios
    if (typeof window === 'undefined') {
      console.log('Ambiente de servidor detectado, retornando dados vazios');
      return [
        {
          stepName: FunnelStep.WELCOME,
          totalUsers: 0,
          retentionRate: 0,
          dropoffRate: 0
        },
        {
          stepName: FunnelStep.QUESTION,
          totalUsers: 0,
          retentionRate: 0,
          dropoffRate: 0
        },
        {
          stepName: FunnelStep.LEAD_CAPTURE,
          totalUsers: 0,
          retentionRate: 0,
          dropoffRate: 0
        },
        {
          stepName: FunnelStep.QUIZ_RESULT,
          totalUsers: 0,
          retentionRate: 0,
          dropoffRate: 0
        },
        {
          stepName: 'Quiz Completo',
          totalUsers: 0,
          retentionRate: 0,
          dropoffRate: 0
        }
      ];
    }
    
    const supabase = getSupabaseClient();
    
    console.log('Buscando dados de analytics do Supabase...');
    if (dateRange) {
      console.log('Filtrando por período:', {
        inicio: dateRange.startDate.toLocaleDateString('pt-BR'),
        fim: dateRange.endDate.toLocaleDateString('pt-BR')
      });
    }
    
    // Data mínima para todos os dados: 24/03/2025 11:24 (horário de Brasília)
    // Considerar o fuso horário de Brasília (UTC-3)
    const dataMinima = new Date('2025-03-24T14:24:00.000Z'); // 11:24 BRT convertido para UTC
    const timestampMinimo = dataMinima.getTime();
    
    // Converter datas para timestamp em milissegundos para comparação
    let startTimestamp = dateRange ? dateRange.startDate.getTime() : 0;
    const endTimestamp = dateRange ? dateRange.endDate.getTime() : Date.now() + 86400000; // Adiciona um dia para incluir o dia final completo
    
    // Garantir que a data inicial nunca seja anterior à data mínima
    startTimestamp = Math.max(startTimestamp, timestampMinimo);
    
    let allEvents = [];
    try {
      // Construir a consulta baseada no filtro de data
      const userEventQuery = await supabase
        .from('user_events')
        .select('session_id, step, timestamp')
        .select();
      
      if (userEventQuery.error) {
        console.error('Erro ao buscar eventos:', userEventQuery.error);
      } else {
        // Filtrar os resultados manualmente para garantir compatibilidade
        allEvents = (userEventQuery.data || [])
          .filter(event => 
            event.timestamp >= startTimestamp && 
            event.timestamp <= endTimestamp
          )
          .sort((a, b) => a.timestamp - b.timestamp);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos de usuário:', error);
    }
    
    console.log('Total de eventos encontrados:', allEvents?.length || 0);
    
    // Agrupar por etapa para contar sessões únicas em cada uma
    const sessions = {
      [FunnelStep.WELCOME]: new Set<string>(),
      [FunnelStep.QUESTION]: new Set<string>(),
      [FunnelStep.LEAD_CAPTURE]: new Set<string>(),
      [FunnelStep.QUIZ_RESULT]: new Set<string>()
    };
    
    // Adicionar cada sessão ao seu conjunto correspondente
    allEvents?.forEach(event => {
      if (sessions[event.step]) {
        sessions[event.step].add(event.session_id);
      }
    });
    
    let completedQuizzes = [];
    try {
      // Consultar quiz_results
      const quizResultsQuery = await supabase
        .from('quiz_results')
        .select('*')
        .select();
      
      if (quizResultsQuery.error) {
        console.error('Erro ao buscar quiz completos:', quizResultsQuery.error);
      } else {
        // Filtrar os resultados manualmente para compatibilidade
        completedQuizzes = (quizResultsQuery.data || [])
          .filter(quiz => {
            const createdAt = quiz.created_at ? new Date(quiz.created_at).getTime() : 0;
            return createdAt >= startTimestamp && createdAt <= endTimestamp;
          });
      }
    } catch (error) {
      console.error('Erro ao buscar quiz completos:', error);
    }
    
    // Contadores para cada etapa
    const welcomeCount = sessions[FunnelStep.WELCOME].size;
    const questionCount = sessions[FunnelStep.QUESTION].size;
    const leadCount = sessions[FunnelStep.LEAD_CAPTURE].size;
    const resultCount = sessions[FunnelStep.QUIZ_RESULT].size;
    const completedCount = completedQuizzes?.length || 0;
    
    console.log('Contagens por sessões únicas:', { 
      welcomeCount, 
      questionCount, 
      leadCount, 
      resultCount, 
      completedCount 
    });
    
    // Calcular taxas de retenção e abandono
    const welcomeToQuestionRetention = welcomeCount > 0 ? (questionCount / welcomeCount) * 100 : 0;
    const questionToLeadRetention = questionCount > 0 ? (leadCount / questionCount) * 100 : 0;
    const leadToResultRetention = leadCount > 0 ? (resultCount / leadCount) * 100 : 0;
    const resultToCompletedRetention = resultCount > 0 ? (completedCount / resultCount) * 100 : 0;
    
    // Construir o array de dados do funil
    const funnelData: FunnelData[] = [
      {
        stepName: FunnelStep.WELCOME,
        totalUsers: welcomeCount,
        retentionRate: 100,
        dropoffRate: 100 - welcomeToQuestionRetention
      },
      {
        stepName: FunnelStep.QUESTION,
        totalUsers: questionCount,
        retentionRate: welcomeToQuestionRetention,
        dropoffRate: 100 - questionToLeadRetention
      },
      {
        stepName: FunnelStep.LEAD_CAPTURE,
        totalUsers: leadCount,
        retentionRate: questionToLeadRetention,
        dropoffRate: 100 - leadToResultRetention
      },
      {
        stepName: FunnelStep.QUIZ_RESULT,
        totalUsers: resultCount,
        retentionRate: leadToResultRetention,
        dropoffRate: 100 - resultToCompletedRetention
      },
      {
        stepName: 'Quiz Completo',
        totalUsers: completedCount,
        retentionRate: resultToCompletedRetention,
        dropoffRate: 0
      }
    ];
    
    // Arredondar valores numéricos para melhor apresentação
    return funnelData.map(step => ({
      ...step,
      retentionRate: Math.round(step.retentionRate),
      dropoffRate: Math.round(step.dropoffRate)
    }));
  } catch (error) {
    console.error('Erro ao obter analytics:', error);
    
    // Em caso de erro, retornar array vazio em vez de dados fictícios
    return [
      {
        stepName: FunnelStep.WELCOME,
        totalUsers: 0,
        retentionRate: 0,
        dropoffRate: 0
      },
      {
        stepName: FunnelStep.QUESTION,
        totalUsers: 0,
        retentionRate: 0,
        dropoffRate: 0
      },
      {
        stepName: FunnelStep.LEAD_CAPTURE,
        totalUsers: 0,
        retentionRate: 0,
        dropoffRate: 0
      },
      {
        stepName: FunnelStep.QUIZ_RESULT,
        totalUsers: 0,
        retentionRate: 0,
        dropoffRate: 0
      },
      {
        stepName: 'Quiz Completo',
        totalUsers: 0,
        retentionRate: 0,
        dropoffRate: 0
      }
    ];
  }
} 