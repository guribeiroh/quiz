import { createClient, PostgrestError } from '@supabase/supabase-js';

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
      }
    };
    select: (columns?: string) => { 
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
        update: () => ({ eq: () => ({ select: () => ({ data: null, error: null }) }) }),
        select: () => ({ 
          eq: () => ({ single: () => ({ data: null, error: null }) }),
          order: () => ({ 
            order: () => ({ limit: () => ({ data: [], error: null }) }),
            limit: () => ({ data: [], error: null }) 
          })
        })
      })
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
        update: () => ({ eq: () => ({ select: () => ({ data: null, error: null }) }) }),
        select: () => ({ 
          eq: () => ({ single: () => ({ data: null, error: null }) }),
          order: () => ({ 
            order: () => ({ limit: () => ({ data: [], error: null }) }),
            limit: () => ({ data: [], error: null }) 
          })
        })
      })
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
        update: () => ({ eq: () => ({ select: () => ({ data: null, error: mockError }) }) }),
        select: () => ({ 
          eq: () => ({ single: () => ({ data: null, error: mockError }) }),
          order: () => ({ 
            order: () => ({ limit: () => ({ data: [], error: mockError }) }),
            limit: () => ({ data: [], error: mockError }) 
          })
        })
      })
    } as SupabaseMockClient;
  }
}

// Função para salvar os resultados do quiz
export async function saveQuizResults(quizData: {
  userName: string;
  userEmail: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  completionRhythm?: string;
  referralCode?: string;  // Código de indicação, se houver
}) {
  try {
    console.log("===== INÍCIO DO SAVERESULTS =====");
    console.log("Iniciando saveQuizResults com dados:", JSON.stringify(quizData));
    
    if (!quizData.userEmail) {
      console.error("Email do usuário não fornecido");
      return { success: false, error: "Email do usuário é obrigatório" };
    }
    
    const supabase = getSupabaseClient();
    console.log("Cliente Supabase inicializado:", !!supabase);
    
    // Log da URL do Supabase (sem mostrar a chave por segurança)
    console.log("URL Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Chave Supabase disponível:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Processar código de indicação, se fornecido
    let referrerId = null;
    let referralBonusPoints = 0;
    
    if (quizData.referralCode) {
      console.log("Código de indicação fornecido:", quizData.referralCode);
      
      // Buscar o usuário que indicou pelo referral_code
      const { data: referrer, error: referrerError } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('referral_code', quizData.referralCode)
        .single();
      
      if (referrerError) {
        console.log("Não foi possível encontrar o usuário indicador:", referrerError);
      } else if (referrer) {
        console.log("Usuário indicador encontrado:", referrer);
        referrerId = referrer.id;
        referralBonusPoints = 10; // Pontos bônus por ter sido indicado
        
        // Dar pontos bônus para quem indicou
        const { error: updateReferrerError } = await supabase
          .from('quiz_results')
          .update({
            referral_bonus_points: supabase.rpc('increment', { x: 5 }) // Incrementar pontos do indicador
          })
          .eq('id', referrerId);
        
        if (updateReferrerError) {
          console.error("Erro ao atualizar pontos do indicador:", updateReferrerError);
        } else {
          console.log("Pontos do indicador atualizados com sucesso");
        }
      }
    }
    
    // Dados formatados para inserção
    const formattedData = {
      user_name: quizData.userName,
      user_email: quizData.userEmail,
      score: quizData.score,
      correct_answers: quizData.correctAnswers, 
      total_questions: quizData.totalQuestions,
      total_time_spent: quizData.totalTimeSpent,
      average_time_per_question: quizData.averageTimePerQuestion,
      completion_rhythm: quizData.completionRhythm || 'constante',
      referred_by: referrerId,
      referral_bonus_points: referralBonusPoints
    };
    
    console.log("Dados formatados para inserção:", JSON.stringify(formattedData));
    
    // Simplificar a abordagem: tentar inserir diretamente
    // Se o registro com o mesmo email já existir, Supabase retornará um erro
    const { data, error } = await supabase
      .from('quiz_results')
      .insert(formattedData)
      .select('*, referral_code');
    
    console.log("Resultado da operação de insert:", { data, error });
    
    if (error) {
      // Se o erro for de conflito/duplicado, tente atualizar em vez de inserir
      if (error.code === '23505') { // Código para violação de restrição única
        console.log("Registro duplicado detectado, tentando atualizar...");
        
        // Buscar o ID existente primeiro
        const { data: existingUser, error: searchError } = await supabase
          .from('quiz_results')
          .select('id, referral_code')
          .eq('user_email', quizData.userEmail)
          .single();
        
        console.log("Busca por usuário existente:", { existingUser, searchError });
        
        if (searchError || !existingUser) {
          console.error("Erro ao buscar usuário existente:", searchError);
          return { success: false, error: searchError || "Usuário não encontrado" };
        }
        
        // Definir interface para o tipo do usuário retornado
        interface QuizUserRecord {
          id: string;
          referral_code?: string;
        }
        
        // Atualizar o registro existente
        const updateResult = await supabase
          .from('quiz_results')
          .update(formattedData)
          .eq('id', (existingUser as QuizUserRecord).id)
          .select('*, referral_code');
        
        console.log("Resultado da operação de update:", updateResult);
        
        if (updateResult.error) {
          console.error("Erro ao atualizar registro:", updateResult.error);
          return { success: false, error: updateResult.error };
        }
        
        console.log("Registro atualizado com sucesso:", updateResult.data);
        console.log("===== FIM DO SAVERESULTS =====");
        return { success: true, data: updateResult.data };
      }
      
      // Para outros erros
      console.error('Erro detalhado ao salvar resultados:', error);
      console.error('Código do erro:', error.code || 'N/A');
      console.error('Mensagem:', error.message || 'Sem mensagem');
      console.error('Detalhes:', error.details || 'Sem detalhes');
      
      console.log("===== FIM DO SAVERESULTS COM ERRO =====");
      return { success: false, error };
    }

    console.log("Operação bem-sucedida! Dados retornados:", data);
    console.log("===== FIM DO SAVERESULTS =====");
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao salvar resultados do quiz:', error);
    // Se for um erro com propriedades, mostrar detalhes
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    console.log("===== FIM DO SAVERESULTS COM ERRO =====");
    return { success: false, error };
  }
}

// Função para obter o ranking
export async function getQuizRanking(limit = 10) {
  try {
    console.log("Iniciando getQuizRanking");
    const supabase = getSupabaseClient();
    console.log("Cliente Supabase inicializado para ranking:", !!supabase);
    
    console.log("Buscando ranking com limite:", limit);
    const { data, error } = await supabase
      .from('quiz_results')
      .select('user_name, score, total_time_spent, correct_answers, total_questions, referral_bonus_points')
      .order('score', { ascending: false })
      .order('total_time_spent', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar ranking:', error);
      return { success: false, error };
    }

    // Mapear e calcular pontuação total com bônus
    const rankingWithBonus = data?.map(entry => ({
      user_name: entry.user_name,
      score: parseFloat(entry.score || '0'),
      total_time_spent: entry.total_time_spent,
      correct_answers: entry.correct_answers,
      total_questions: entry.total_questions,
      referral_bonus_points: entry.referral_bonus_points || 0,
      total_score: parseFloat(entry.score || '0') + (entry.referral_bonus_points || 0)
    }));

    // Reordenar baseado na pontuação total (com bônus)
    const sortedRanking = rankingWithBonus?.sort((a, b) => {
      // Comparar por pontuação total primeiro
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      // Em caso de empate, quem respondeu mais rápido fica na frente
      return a.total_time_spent - b.total_time_spent;
    }).slice(0, limit);

    console.log("Ranking obtido com sucesso:", sortedRanking);
    return { success: true, data: sortedRanking };
  } catch (error) {
    console.error('Exceção ao obter ranking:', error);
    return { success: false, error };
  }
} 