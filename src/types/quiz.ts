export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  timeSpent?: number;
  timestamp?: number;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  answers: UserAnswer[];
  totalTimeSpent?: number;
  startTime?: number;
  endTime?: number;
  averageTimePerQuestion?: number;
  referralCode?: string;
}

export interface UserData {
  name: string;
  email: string;
  phone?: string;
  occupation?: string;
  college?: string;
  semester?: string;
  referralCode?: string;
  agreedToTerms: boolean;
} 