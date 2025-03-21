export interface RankingEntry {
  user_name: string;
  score: number;
  total_time_spent: number;
  correct_answers: number;
  total_questions: number;
  referral_bonus_points?: number;
  referral_code?: string;
  total_score?: number;
} 