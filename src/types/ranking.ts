export interface RankingEntry {
  user_name: string;
  score: number;
  total_time_spent: number;
  correct_answers: number;
  total_questions: number;
  referral_bonus_points?: number;
  total_score?: number;
}

export interface SortableHeaderProps {
  title: string;
  tooltip?: boolean;
  tooltipText?: string;
  tooltipIcon?: string;
  sortValue?: 'score' | 'time' | 'accuracy';
  className?: string;
  width?: string;
  align?: 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

export interface ColumnTooltipProps {
  icon: React.ReactNode;
  text: string;
  iconClassName?: string;
} 