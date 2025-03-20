import { createClient } from '@supabase/supabase-js';

// Criamos uma função para inicializar o cliente Supabase (lazy initialization)
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  // Se estamos no servidor durante a build estática, retorna um cliente mock
  if (typeof window === 'undefined') {
    return {
      from: () => ({
        upsert: () => ({ select: () => ({ data: null, error: null }) }),
        select: () => ({ order: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) })
      })
    } as any;
  }
  
  // Se já temos uma instância, reutilizá-la (singleton pattern)
  if (supabaseInstance) return supabaseInstance;
  
  // Credenciais do Supabase - em produção, estas devem estar em variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Verificar se as credenciais estão disponíveis
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials are missing. Please check your environment variables.');
    
    // Retornar um cliente mock que não faz nada
    return {
      from: () => ({
        upsert: () => ({ select: () => ({ data: null, error: null }) }),
        select: () => ({ order: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) })
      })
    } as any;
  }
  
  // Criar e salvar o cliente Supabase
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
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
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('quiz_results')
      .upsert(
        {
          user_name: quizData.userName,
          user_email: quizData.userEmail,
          score: quizData.score,
          correct_answers: quizData.correctAnswers,
          total_questions: quizData.totalQuestions,
          total_time_spent: quizData.totalTimeSpent,
          average_time_per_question: quizData.averageTimePerQuestion,
          completion_rhythm: quizData.completionRhythm || 'constante'
        },
        { onConflict: 'user_email' }
      )
      .select();

    if (error) {
      console.error('Error saving quiz results:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception saving quiz results:', error);
    return { success: false, error };
  }
}

// Função para obter o ranking
export async function getQuizRanking(limit = 10) {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select('user_name, score, total_time_spent, correct_answers, total_questions')
      .order('score', { ascending: false })
      .order('total_time_spent', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching quiz ranking:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception fetching quiz ranking:', error);
    return { success: false, error };
  }
} 