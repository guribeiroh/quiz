"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { QuizQuestion, UserAnswer, QuizResult, UserData } from '../types/quiz';
import { quizQuestions } from '../data/questions';

interface QuizContextType {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  currentQuestion: QuizQuestion | null;
  selectedAnswer: number | null;
  userAnswers: UserAnswer[];
  quizResult: QuizResult | null;
  userData: UserData | null;
  isQuizStarted: boolean;
  isQuizFinished: boolean;
  isLeadCaptured: boolean;
  timeRemaining: number;
  startQuiz: () => void;
  nextQuestion: (skipQuestion?: boolean) => void;
  previousQuestion: () => void;
  selectAnswer: (selectedOption: number) => void;
  answerQuestion: (selectedOption: number) => void;
  finishQuiz: () => void;
  saveUserData: (data: UserData) => void;
  resetQuiz: () => void;
}

const QUESTION_TIME_LIMIT = 30; // 30 segundos por pergunta

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}

interface QuizProviderProps {
  children: ReactNode;
}

export function QuizProvider({ children }: QuizProviderProps) {
  const [questions] = useState<QuizQuestion[]>(quizQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT);
  
  // Ref para o timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Referência para funções para evitar dependências circulares
  const nextQuestionRef = useRef<((skipQuestion?: boolean) => void) | null>(null);
  
  // Computed property for current question
  const currentQuestion = isQuizStarted && currentQuestionIndex < questions.length 
    ? questions[currentQuestionIndex] 
    : null;
  
  // Defina a função finishQuiz com useCallback
  const finishQuiz = useCallback(() => {
    // Parar o timer quando finalizar o quiz
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const answeredQuestions = userAnswers.length;
    const totalQuestions = questions.length;
    const wrongAnswers = answeredQuestions - correctAnswers;
    
    const result: QuizResult = {
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score: (correctAnswers / totalQuestions) * 100,
      answers: userAnswers
    };

    setQuizResult(result);
    setIsQuizFinished(true);
  }, [questions.length, userAnswers]);
  
  // Defina a função nextQuestion com useCallback
  const nextQuestion = useCallback((skipQuestion: boolean = false) => {
    // Parar o timer atual
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeRemaining(QUESTION_TIME_LIMIT);
      
      // Se pular a questão, não salva resposta
      if (skipQuestion && currentQuestion) {
        // Remove qualquer resposta anterior a esta questão, se existir
        setUserAnswers(prevAnswers => 
          prevAnswers.filter(answer => answer.questionId !== currentQuestion.id)
        );
      }
    } else {
      // If it's the last question, finish the quiz
      finishQuiz();
    }
  }, [currentQuestionIndex, questions.length, currentQuestion, finishQuiz]);
  
  // Atualize a referência quando a função nextQuestion for recriada
  useEffect(() => {
    nextQuestionRef.current = nextQuestion;
  }, [nextQuestion]);
  
  // Limpar o timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Iniciar ou reiniciar o timer quando a pergunta mudar
  useEffect(() => {
    if (isQuizStarted && !isQuizFinished) {
      // Limpar qualquer timer existente
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Resetar o tempo
      setTimeRemaining(QUESTION_TIME_LIMIT);
      
      // Iniciar novo timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prevTime) => {
          // Se o tempo acabou, avança para a próxima pergunta
          if (prevTime <= 1) {
            // Limpar o intervalo
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            // Se ainda não respondeu, considera como pular a questão
            if (selectedAnswer === null && nextQuestionRef.current) {
              nextQuestionRef.current(true);
            } else if (nextQuestionRef.current) {
              nextQuestionRef.current(false);
            }
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => {
      // Limpa o timer quando a pergunta mudar
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex, isQuizStarted, isQuizFinished, selectedAnswer]);
  
  // Parar o timer quando uma resposta for selecionada
  useEffect(() => {
    if (selectedAnswer !== null && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [selectedAnswer]);

  const startQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsQuizFinished(false);
    setIsLeadCaptured(false);
    setSelectedAnswer(null);
    setTimeRemaining(QUESTION_TIME_LIMIT);
  };

  const selectAnswer = (selectedOption: number) => {
    // Parar o timer ao selecionar uma resposta
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setSelectedAnswer(selectedOption);
    answerQuestion(selectedOption);
  };

  const answerQuestion = (selectedOption: number) => {
    if (!currentQuestion) return;
    
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect: selectedOption === currentQuestion.correctAnswer
    };

    // Update or add the answer
    const updatedAnswers = [...userAnswers];
    const existingAnswerIndex = updatedAnswers.findIndex(
      a => a.questionId === currentQuestion.id
    );

    if (existingAnswerIndex >= 0) {
      updatedAnswers[existingAnswerIndex] = answer;
    } else {
      updatedAnswers.push(answer);
    }

    setUserAnswers(updatedAnswers);
  };

  const previousQuestion = () => {
    // Parar o timer atual
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setTimeRemaining(QUESTION_TIME_LIMIT);
      
      // Set the selected answer to what the user previously chose
      const previousAnswer = userAnswers.find(
        a => a.questionId === questions[currentQuestionIndex - 1].id
      );
      setSelectedAnswer(previousAnswer ? previousAnswer.selectedOption : null);
    }
  };

  const saveUserData = (data: UserData) => {
    setUserData(data);
    setIsLeadCaptured(true);
    
    // Aqui você poderia enviar os dados para uma API/backend
    console.log('Lead capturado:', data);
  };

  const resetQuiz = () => {
    // Parar o timer ao resetar o quiz
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsQuizFinished(false);
    setUserData(null);
    setIsLeadCaptured(false);
    setSelectedAnswer(null);
    setTimeRemaining(QUESTION_TIME_LIMIT);
  };

  const value = {
    questions,
    currentQuestionIndex,
    currentQuestion,
    selectedAnswer,
    userAnswers,
    quizResult,
    userData,
    isQuizStarted,
    isQuizFinished,
    isLeadCaptured,
    timeRemaining,
    startQuiz,
    nextQuestion,
    previousQuestion,
    selectAnswer,
    answerQuestion,
    finishQuiz,
    saveUserData,
    resetQuiz
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
} 