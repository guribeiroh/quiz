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

export interface SortableHeaderProps {
  title: string;
  width?: string;
  className?: string;
  tooltip?: boolean;
  tooltipText?: string;
  tooltipIcon?: string;
  sortValue?: 'score' | 'time' | 'accuracy';
  align?: 'left' | 'center' | 'right';
  icon?: React.ReactNode;
} 