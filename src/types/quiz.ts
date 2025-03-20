export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
  imageUrl?: string;
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  answers: UserAnswer[];
}

export interface UserData {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  semester?: string;
  agreedToTerms: boolean;
} 