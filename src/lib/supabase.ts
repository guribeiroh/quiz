import { createClient, PostgrestError } from '@supabase/supabase-js';

// Definindo a interface para os dados do resultado do quiz
export interface QuizResultData {
  userName: string;
  userEmail: string;
  userPhone?: string;
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
        single: () => { data: null | unknown; error: null | PostgrestError };
        limit: (limit: number) => { data: unknown[]; error: null | PostgrestError };
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

export function getSupabaseClient() {
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
          eq: () => ({ 
            single: () => ({ data: null, error: null }),
            limit: () => ({ data: [], error: null })
          }),
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
          eq: () => ({ 
            single: () => ({ data: null, error: null }),
            limit: () => ({ data: [], error: null })
          }),
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
          eq: () => ({ 
            single: () => ({ data: null, error: mockError }),
            limit: () => ({ data: [], error: mockError })
          }),
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
export async function saveQuizResults(
  userData: {
    userName: string;
    userEmail: string;
    userPhone?: string | undefined;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    completionRhythm: string;
    referralCode?: string | undefined;
  },
  usedReferralCode?: string | null | undefined
) {
  try {
    console.log("Iniciando saveQuizResults", usedReferralCode ? `com código de referência usado: ${usedReferralCode}` : "sem código de referência");
    
    const supabase = getSupabaseClient();
    console.log("Cliente Supabase inicializado para quiz:", !!supabase);
    
    // Verificar se o email ou telefone já existem no banco de dados
    const { data: existingUserEmailResult } = await supabase
      .from('quiz_results')
      .select('id, user_email, user_phone, referral_code')
      .eq('user_email', userData.userEmail)
      .limit(1);
    
    // Verificar se o telefone já existe (se fornecido)
    let existingUserPhone = null;
    if (userData.userPhone) {
      const { data: phoneResult } = await supabase
        .from('quiz_results')
        .select('id, user_email, user_phone, referral_code')
        .eq('user_phone', userData.userPhone)
        .limit(1);
      
      existingUserPhone = phoneResult;
    }
    
    // Se encontramos um usuário com o mesmo email ou telefone, impedir cadastro duplicado
    if ((existingUserEmailResult && existingUserEmailResult.length > 0) || 
        (existingUserPhone && existingUserPhone.length > 0)) {
      console.log("Usuário já completou o quiz anteriormente");
      
      return { 
        success: false, 
        error: { 
          message: "Você já completou o quiz anteriormente. Cada usuário pode participar apenas uma vez.",
          code: "USER_ALREADY_EXISTS"
        } 
      };
    }
    
    // Gerar um código de referência único para este usuário
    const newReferralCode = generateUniqueCode();
    console.log("Novo código de referência gerado:", newReferralCode);
    
    // Variáveis para rastrear referência
    let referrerId = null;
    let referralBonusPoints = 0;
    
    // Processar código de referência se fornecido
    if (userData.referralCode) {
      console.log("Processando código de referência:", userData.referralCode);
      
      try {
        // Interface para tipar corretamente o resultado da consulta
        interface ReferrerData {
          id: string;
          user_email: string;
          referral_bonus_points?: number;
        }
        
        // Buscar o referenciador pelo código
        const { data: referrerData, error: referrerError } = await supabase
          .from('quiz_results')
          .select('id, user_email, referral_bonus_points')
          .eq('referral_code', userData.referralCode)
          .single();
        
        if (referrerError) {
          console.log("Erro ao buscar referenciador:", referrerError);
        } else if (referrerData) {
          console.log("Referenciador encontrado:", referrerData);
          
          // Definir o ID do referenciador
          referrerId = (referrerData as ReferrerData).id;
          
          // Adicionar pontos de bônus para quem usou o código (10 pontos)
          referralBonusPoints = 10;
          
          // Adicionar pontos de bônus para o referenciador (5 pontos)
          const currentReferrerBonus = (referrerData as ReferrerData).referral_bonus_points || 0;
          const newReferrerBonus = currentReferrerBonus + 5;
          
          console.log("Pontos de bônus atualizados para:", newReferrerBonus);
          
          // Atualizar os pontos de bônus do referenciador
          const { error: updateError } = await supabase
            .from('quiz_results')
            .update({ referral_bonus_points: newReferrerBonus })
            .eq('id', referrerId);
          
          if (updateError) {
            console.log("Erro ao atualizar pontos de bônus do referenciador:", updateError);
          }
        }
      } catch (e) {
        console.log("Erro ao processar código de referência:", e);
      }
    }
    
    // Preparar os dados para inserção
    const formattedData: Record<string, unknown> = {
      user_name: userData.userName,
      user_email: userData.userEmail,
      user_phone: userData.userPhone || null, // Adicionando o telefone ao registro
      score: userData.score,
      correct_answers: userData.correctAnswers, 
      total_questions: userData.totalQuestions,
      total_time_spent: userData.totalTimeSpent,
      average_time_per_question: userData.averageTimePerQuestion,
      completion_rhythm: userData.completionRhythm,
      referral_code: newReferralCode,
      referred_by: referrerId,
      referral_bonus_points: referralBonusPoints
    };
    
    console.log("Dados formatados para inserção:", formattedData);
    
    // Inserir os dados no Supabase
    const { data: insertResult, error } = await supabase
      .from('quiz_results')
      .insert(formattedData)
      .select();
    
    if (error) {
      console.error("Erro ao salvar resultado do quiz:", error);
      
      // Detalhando mais o erro quando for 409 (Conflict)
      if (error.code === '23505' || error.code === 'P0001' || error.message.includes('duplicate key value')) {
        console.error("Erro de duplicação detectado. Detalhes:", error.details);
        return { 
          success: false, 
          error: { 
            ...error, 
            message: "Já existe um registro com este email ou telefone. Cada usuário pode participar apenas uma vez." 
          }
        };
      }
      
      return { success: false, error };
    }
    
    console.log("Resultado do Supabase:", insertResult);
    
    // Finalizar
    const finalData: Record<string, unknown> = { 
      referralCode: newReferralCode
    };
    
    // Adicionar outras propriedades se existirem dados
    if (insertResult && insertResult.length > 0 && typeof insertResult[0] === 'object') {
      Object.keys(insertResult[0] as Record<string, unknown>).forEach(key => {
        if (key !== 'referral_code') {
          (finalData as Record<string, unknown>)[key] = (insertResult[0] as Record<string, unknown>)[key];
        }
      });
    }
    
    // Adicione o código de referência usado, se disponível
    if (usedReferralCode) {
      // Lógica para registrar o uso do código de referência
      // e atribuir pontos ao usuário que compartilhou
      
      console.log(`Código de referência utilizado: ${usedReferralCode}`);
      
      // Você pode adicionar chamadas adicionais ao Supabase para registrar o uso do código
      // e aumentar a pontuação do usuário que compartilhou o código
    }
    
    return { success: true, data: finalData };
  } catch (e) {
    console.error("Erro ao salvar quiz:", e);
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
      referral_code?: string;
    }
    
    console.log("Verificando colunas disponíveis");
    
    // Determinar quais colunas selecionar com base no que está disponível
    let columns = 'user_name, score, total_time_spent, correct_answers, total_questions, referral_code';
    
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
      referral_code: entry.referral_code || '',
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

// Função para gerar um código de referência único
function generateUniqueCode(): string {
  // Gerar string aleatória usando caracteres alfanuméricos (excluindo caracteres ambíguos como 0, O, 1, I, etc.)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // Primeiro caractere sempre uma letra para melhorar legibilidade
  result += chars.charAt(Math.floor(Math.random() * 24)); // Apenas letras (0-23)
  
  // 7 caracteres restantes podem ser letras ou números
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Adicionar timestamp para garantir unicidade
  const timestamp = new Date().getTime().toString(36).slice(-3);
  
  return result + timestamp;
}

// Função para buscar informações do dono de um código de referência
export async function getReferralCodeOwner(referralCode: string) {
  try {
    console.log(`Buscando informações do dono do código: ${referralCode}`);
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select('id, user_name, user_email')
      .eq('referral_code', referralCode)
      .single();
    
    if (error) {
      console.error("Erro ao buscar dono do código:", error);
      return { success: false, error };
    }
    
    if (!data) {
      console.log("Nenhum usuário encontrado com este código");
      return { success: false, data: null };
    }
    
    // Extrair apenas o primeiro nome
    const firstName = data.user_name.split(' ')[0];
    
    console.log(`Dono do código encontrado: ${firstName}`);
    return { 
      success: true, 
      data: {
        id: data.id,
        name: data.user_name,
        firstName,
        email: data.user_email
      } 
    };
  } catch (e) {
    console.error("Erro ao buscar informações do código:", e);
    return { success: false, error: e };
  }
} 