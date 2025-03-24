export interface QuizResult {
  id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  total_time_spent: number;
  average_time_per_question: number;
  completion_rhythm?: string;
  referral_code?: string;
  created_at: string;
}

export interface UserEventRecord {
  id: string;
  event_type: string;
  user_id?: string;
  session_id: string;
  timestamp: number;
  page: string;
  step: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ReferralCodeRecord {
  id: string;
  user_email: string;
  user_name: string;
  referral_code: string;
  created_at: string;
  referral_bonus_points?: number;
}

// Tipo para definir o schema das tabelas do Supabase
export interface Database {
  public: {
    Tables: {
      quiz_results: {
        Row: QuizResult;
        Insert: Omit<QuizResult, 'id' | 'created_at'>;
        Update: Partial<Omit<QuizResult, 'id' | 'created_at'>>;
      };
      user_events: {
        Row: UserEventRecord;
        Insert: Omit<UserEventRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<UserEventRecord, 'id' | 'created_at'>>;
      };
      referral_codes: {
        Row: ReferralCodeRecord;
        Insert: Omit<ReferralCodeRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<ReferralCodeRecord, 'id' | 'created_at'>>;
      };
    };
  };
} 