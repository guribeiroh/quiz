import { createClient, PostgrestError } from '@supabase/supabase-js';

// Definindo a interface para os dados do resultado do quiz
export interface QuizResultData {
  userName: string;
  userEmail: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  completionRhythm?: string;
  referralCode?: string;
  answers?: {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
    timeSpent?: number;
    timestamp?: number;
  }[];
}

// Interface para o tipo de dado do referenciador
interface ReferrerData {
  id: string;
  user_email: string;
  referral_bonus_points?: number;
}

// Criamos uma função para inicializar o cliente Supabase (lazy initialization)
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Definindo um tipo para o cliente mock para evitar o uso de 'any'
type SupabaseMockClient = {
  from: (table: string) => {
    upsert: (data: Record<string, unknown>, options?: Record<string, unknown>) => { 
      select: () => { data: null | unknown[]; error: null | PostgrestError }
    };
    insert: (data: Record<string, unknown>) => {
      select: () => { data: null | unknown[]; error: null | PostgrestError }
    };
    update: (data: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => {
        select: () => { data: null | unknown[]; error: null | PostgrestError }
        data: null | unknown[]; 
        error: null | PostgrestError;
      }
    };
    select: (columns?: string) => { 
      limit: (limit: number) => { data: unknown[]; error: null | PostgrestError };
      eq: (column: string, value: unknown) => {
        single: () => { data: null | unknown; error: null | PostgrestError }
      };
      order: (column: string, options?: Record<string, unknown>) => { 
        order: (column: string, options?: Record<string, unknown>) => {
          limit: (limit: number) => { data: unknown[]; error: null | PostgrestError }
        };
        limit: (limit: number) => { data: unknown[]; error: null | PostgrestError }
      }
    };
  };
  rpc: (procedure: string, params: Record<string, unknown>) => unknown;
};

function getSupabaseClient() {
  console.log("Chamando getSupabaseClient. Ambiente:", typeof window === 'undefined' ? 'servidor' : 'cliente');
  
  // Se estamos no servidor durante a build estática, retorna um cliente mock
  if (typeof window === 'undefined') {
    console.log("Ambiente de servidor detectado, retornando cliente mock");
    return {
      from: () => ({
        upsert: () => ({ select: () => ({ data: null, error: null }) }),
        insert: () => ({ select: () => ({ data: null, error: null }) }),
        update: () => ({ 
          eq: () => ({ 
            select: () => ({ data: null, error: null }),
            data: null,
            error: null
          }) 
        }),
        select: () => ({ 
          limit: () => ({ data: [], error: null }),
          eq: () => ({ single: () => ({ data: null, error: null }) }),
          order: () => ({ 
            order: () => ({ limit: () => ({ data: [], error: null }) }),
            limit: () => ({ data: [], error: null }) 
          })
        })
      }),
      rpc: () => null
    } as SupabaseMockClient;
  }
  
  // Se já temos uma instância, reutilizá-la (singleton pattern)
  if (supabaseInstance) {
    console.log("Reutilizando instância existente do Supabase");
    return supabaseInstance;
  }
  
  console.log("Criando nova instância do Supabase");
  
  // Credenciais do Supabase - em produção, estas devem estar em variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  console.log("Credenciais:", {
    urlDisponivel: !!supabaseUrl,
    keyDisponivel: !!supabaseAnonKey,
    urlTamanho: supabaseUrl.length,
    keyTamanho: supabaseAnonKey.length
  });
  
  // Verificar se as credenciais estão disponíveis
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials are missing. Please check your environment variables.');
    
    // Retornar um cliente mock que não faz nada
    console.log("Retornando cliente mock devido a credenciais ausentes");
    return {
      from: () => ({
        upsert: () => ({ select: () => ({ data: null, error: null }) }),
        insert: () => ({ select: () => ({ data: null, error: null }) }),
        update: () => ({ 
          eq: () => ({ 
            select: () => ({ data: null, error: null }),
            data: null,
            error: null
          }) 
        }),
        select: () => ({ 
          limit: () => ({ data: [], error: null }),
          eq: () => ({ single: () => ({ data: null, error: null }) }),
          order: () => ({ 
            order: () => ({ limit: () => ({ data: [], error: null }) }),
            limit: () => ({ data: [], error: null }) 
          })
        })
      }),
      rpc: () => null
    } as SupabaseMockClient;
  }
  
  try {
    // Criar e salvar o cliente Supabase
    console.log("Criando cliente Supabase com credenciais válidas");
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error("Erro ao criar cliente Supabase:", error);
    const mockError = {
      message: "Erro ao criar cliente Supabase",
      code: "MOCK_ERROR",
      details: "Erro na criação do cliente"
    } as PostgrestError;
    
    return {
      from: () => ({
        upsert: () => ({ select: () => ({ data: null, error: mockError }) }),
        insert: () => ({ select: () => ({ data: null, error: mockError }) }),
        update: () => ({ 
          eq: () => ({ 
            select: () => ({ data: null, error: mockError }),
            data: null,
            error: mockError
          }) 
        }),
        select: () => ({ 
          limit: () => ({ data: [], error: mockError }),
          eq: () => ({ single: () => ({ data: null, error: mockError }) }),
          order: () => ({ 
            order: () => ({ limit: () => ({ data: [], error: mockError }) }),
            limit: () => ({ data: [], error: mockError }) 
          })
        })
      }),
      rpc: () => null
    } as SupabaseMockClient;
  }
}

// Função para salvar os resultados do quiz
export async function saveQuizResults(quizData: QuizResultData, referralCode?: string) {
  try {
    console.log("Iniciando saveQuizResults");
    const supabase = getSupabaseClient();
    console.log("Cliente Supabase inicializado:", !!supabase);
    
    let referrerId = null;
    let userReferralCode = referralCode;
    
    // Processa código de referência, se fornecido
    if (referralCode) {
      try {
        // Buscar o referenciador pelo código
        const { data: referrerData, error: referrerError } = await supabase
          .from('quiz_results')
          .select('id, user_email, referral_bonus_points')
          .eq('referral_code', referralCode)
          .single();
        
        if (referrerError) {
          console.log("Erro ao buscar referenciador:", referrerError);
        } else if (referrerData as ReferrerData) {
          const typedReferrerData = referrerData as ReferrerData;
          console.log("Referenciador encontrado:", typedReferrerData);
          referrerId = typedReferrerData.id;
          
          // Atualizar os pontos de bônus do referenciador
          const bonusPoints = (typedReferrerData.referral_bonus_points || 0) + 5;
          const { error: updateError } = await supabase
            .from('quiz_results')
            .update({ referral_bonus_points: bonusPoints })
            .eq('id', typedReferrerData.id);
            
          if (updateError) {
            console.log("Erro ao atualizar pontos de bônus:", updateError);
          } else {
            console.log("Pontos de bônus atualizados para:", bonusPoints);
          }
        }
      } catch (e) {
        console.log("Erro ao processar código de referência:", e);
      }
    }
    
    // Gerar um código de referência único para o usuário
    if (!userReferralCode) {
      // Criar código baseado no email e timestamp
      const timestamp = new Date().getTime().toString(36);
      const emailHash = quizData.userEmail.split('@')[0].substring(0, 3);
      userReferralCode = `${emailHash}${timestamp}`.toUpperCase();
      console.log("Código de referência gerado:", userReferralCode);
    }
    
    // Dados formatados para inserção
    const formattedData: Record<string, unknown> = {
      user_name: quizData.userName,
      user_email: quizData.userEmail,
      score: quizData.score,
      correct_answers: quizData.correctAnswers, 
      total_questions: quizData.totalQuestions,
      total_time_spent: quizData.totalTimeSpent,
      average_time_per_question: quizData.averageTimePerQuestion,
      completion_rhythm: quizData.completionRhythm || 'constante',
      referral_code: userReferralCode  // Adicionar o código de referência
    };
    
    // Verificar se devemos adicionar os campos de referência (caso colunas existam)
    try {
      // Verificar se as colunas existem
      const { error: columnError } = await supabase
        .from('quiz_results')
        .select('referred_by, referral_bonus_points')
        .limit(1);
        
      // Se não houve erro, presumimos que as colunas existem
      if (!columnError) {
        // Adiciona os campos de referral apenas se a consulta teve sucesso
        formattedData.referred_by = referrerId;
        formattedData.referral_bonus_points = referralCode ? 10 : 0; // Bônus para quem usou código
      } else {
        console.log("Colunas de referência não encontradas, ignorando campos de referência");
      }
    } catch (e) {
      console.log("Erro ao verificar colunas de referência:", e);
    }
    
    console.log("Dados formatados para inserção:", JSON.stringify(formattedData));
    
    // Tenta inserir primeiro (assumindo que é um novo usuário)
    const { data, error } = await supabase
      .from('quiz_results')
      .upsert(formattedData, { onConflict: 'user_email' })
      .select();
    
    if (error) {
      console.error("Erro ao salvar resultado do quiz:", error);
      return { success: false, error };
    }
    
    console.log("Resultado do quiz salvo com sucesso:", data);
    
    // Abordagem alternativa para evitar problemas com o operador spread
    let finalData: Record<string, unknown> = { referralCode: userReferralCode };
    
    // Adicionar propriedades de data[0] apenas se existirem
    if (data && Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      // Copiar as propriedades manualmente
      Object.keys(data[0]).forEach(key => {
        finalData[key] = (data[0] as Record<string, unknown>)[key];
      });
    }
    
    return { success: true, data: finalData };
    
  } catch (e) {
    console.error("Exceção ao salvar resultado do quiz:", e);
    return { success: false, error: e };
  }
}

// Função para obter o ranking
export async function getQuizRanking(limit = 10) {
  try {
    console.log("Iniciando getQuizRanking");
    const supabase = getSupabaseClient();
    console.log("Cliente Supabase inicializado para ranking:", !!supabase);
    
    // Definindo interface para o tipo dos dados de ranking
    interface RankingEntryData {
      user_name: string;
      score: string | number;
      total_time_spent: number;
      correct_answers: number;
      total_questions: number;
      referral_bonus_points?: number;
    }
    
    console.log("Verificando colunas disponíveis");
    
    // Determinar quais colunas selecionar com base no que está disponível
    let columns = 'user_name, score, total_time_spent, correct_answers, total_questions';
    
    try {
      // Verificar se a coluna referral_bonus_points existe
      const { error: columnError } = await supabase
        .from('quiz_results')
        .select('referral_bonus_points')
        .limit(1);
      
      // Se não há erro, a coluna existe
      if (!columnError) {
        columns += ', referral_bonus_points';
        console.log("Coluna referral_bonus_points encontrada e será incluída");
      } else {
        console.log("Coluna referral_bonus_points não encontrada, será ignorada");
      }
    } catch (e) {
      console.log("Erro ao verificar colunas disponíveis:", e);
    }
    
    console.log("Buscando ranking com limite:", limit);
    console.log("Colunas selecionadas:", columns);
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select(columns)
      .order('score', { ascending: false })
      .order('total_time_spent', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar ranking:', error);
      return { success: false, error };
    }

    // Mapear e calcular pontuação total com bônus
    const rankingWithBonus = (data as RankingEntryData[] | null)?.map(entry => ({
      user_name: entry.user_name,
      score: parseFloat(entry.score as string || '0'),
      total_time_spent: entry.total_time_spent,
      correct_answers: entry.correct_answers,
      total_questions: entry.total_questions,
      referral_bonus_points: entry.referral_bonus_points || 0,
      total_score: parseFloat(entry.score as string || '0') + (entry.referral_bonus_points || 0)
    }));
    
    // Classificar por pontuação total (incluindo bônus) e, em caso de empate, por tempo
    const sortedRanking = rankingWithBonus?.sort((a, b) => 
      b.total_score !== a.total_score 
        ? b.total_score - a.total_score 
        : a.total_time_spent - b.total_time_spent
    );

    console.log("Ranking recuperado com sucesso", sortedRanking);
    return { success: true, data: sortedRanking };
  } catch (e) {
    console.error("Erro ao buscar ranking:", e);
    return { success: false, error: e };
  }
} 