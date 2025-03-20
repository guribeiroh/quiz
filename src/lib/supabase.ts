import { createClient, PostgrestError } from '@supabase/supabase-js';

// Criamos uma função para inicializar o cliente Supabase (lazy initialization)
let supabaseInstance: ReturnType<typeof createClient> | null = null;

// Definindo um tipo para o cliente mock para evitar o uso de 'any'
type SupabaseMockClient = {
  from: (table: string) => {
    upsert: (data: Record<string, unknown>, options?: Record<string, unknown>) => { 
      select: () => { data: null | unknown[]; error: null | unknown }
    };
    select: (columns?: string) => { 
      order: (column: string, options?: Record<string, unknown>) => { 
        order: (column: string, options?: Record<string, unknown>) => {
          limit: (limit: number) => { data: unknown[]; error: null | unknown }
        }
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
        select: () => ({ order: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) })
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
        select: () => ({ order: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) })
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
    return {
      from: () => ({
        upsert: () => ({ select: () => ({ data: null, error: { message: "Erro ao criar cliente Supabase" } }) }),
        select: () => ({ order: () => ({ order: () => ({ limit: () => ({ data: [], error: { message: "Erro ao criar cliente Supabase" } }) }) }) })
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
}) {
  try {
    console.log("Iniciando saveQuizResults no supabase.ts");
    
    const supabase = getSupabaseClient();
    console.log("Cliente Supabase inicializado:", !!supabase);
    
    // Log da URL do Supabase (sem mostrar a chave por segurança)
    console.log("URL Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Chave Supabase disponível:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Dados formatados para inserção
    const formattedData = {
      user_name: quizData.userName,
      user_email: quizData.userEmail,
      score: quizData.score,
      correct_answers: quizData.correctAnswers, 
      total_questions: quizData.totalQuestions,
      total_time_spent: quizData.totalTimeSpent,
      average_time_per_question: quizData.averageTimePerQuestion,
      completion_rhythm: quizData.completionRhythm || 'constante'
    };
    
    console.log("Dados formatados para inserção:", formattedData);
    
    console.log("Tentando inserir na tabela quiz_results...");
    const { data, error } = await supabase
      .from('quiz_results')
      .upsert(formattedData, { onConflict: 'user_email' })
      .select();

    if (error) {
      console.error('Erro detalhado ao salvar resultados:', error);
      
      // Tratar o erro como PostgrestError para obter acesso às propriedades
      const pgError = error as PostgrestError;
      console.error('Código do erro:', pgError.code ?? 'N/A');
      console.error('Mensagem:', pgError.message ?? 'Sem mensagem');
      console.error('Detalhes:', pgError.details ?? 'Sem detalhes');
      
      return { success: false, error };
    }

    console.log("Inserção bem-sucedida! Dados retornados:", data);
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao salvar resultados do quiz:', error);
    // Se for um erro com propriedades, mostrar detalhes
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
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
      .select('user_name, score, total_time_spent, correct_answers, total_questions')
      .order('score', { ascending: false })
      .order('total_time_spent', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar ranking:', error);
      
      // Tratar o erro como PostgrestError para obter acesso às propriedades
      const pgError = error as PostgrestError;
      console.error('Código do erro:', pgError.code ?? 'N/A');
      console.error('Mensagem:', pgError.message ?? 'Sem mensagem');
      console.error('Detalhes:', pgError.details ?? 'Sem detalhes');
      
      return { success: false, error };
    }

    console.log("Ranking obtido com sucesso! Dados:", data);
    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao buscar ranking:', error);
    // Se for um erro com propriedades, mostrar detalhes
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    return { success: false, error };
  }
} 