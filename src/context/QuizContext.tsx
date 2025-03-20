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
  
  // Ref para registrar o tempo de início do quiz e de cada questão
  const quizStartTimeRef = useRef<number>(0);
  const questionStartTimeRef = useRef<number>(0);
  
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
    
    const endTime = Date.now();
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const answeredQuestions = userAnswers.length;
    const totalQuestions = questions.length;
    const wrongAnswers = answeredQuestions - correctAnswers;
    
    // Calcular o tempo total gasto
    const totalTimeSpent = Math.round((endTime - quizStartTimeRef.current) / 1000);
    
    // Calcular o tempo médio por questão
    const averageTimePerQuestion = answeredQuestions > 0 
      ? Math.round(totalTimeSpent / answeredQuestions) 
      : 0;
    
    const result: QuizResult = {
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score: (correctAnswers / totalQuestions) * 100,
      answers: userAnswers,
      totalTimeSpent,
      startTime: quizStartTimeRef.current,
      endTime,
      averageTimePerQuestion
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
    
    // Calcular o tempo gasto nesta questão
    const now = Date.now();
    const timeSpent = Math.round((now - questionStartTimeRef.current) / 1000);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTimeRemaining(QUESTION_TIME_LIMIT);
      
      // Atualizar o tempo de início da próxima questão
      questionStartTimeRef.current = now;
      
      // Se pular a questão, não salva resposta
      if (skipQuestion && currentQuestion) {
        // Remove qualquer resposta anterior a esta questão, se existir
        setUserAnswers(prevAnswers => 
          prevAnswers.filter(answer => answer.questionId !== currentQuestion.id)
        );
      } else if (currentQuestion && !skipQuestion) {
        // Se não pulou e tem uma resposta selecionada, atualiza o tempo gasto
        setUserAnswers(prevAnswers => 
          prevAnswers.map(answer => 
            answer.questionId === currentQuestion.id 
              ? { ...answer, timeSpent, timestamp: now } 
              : answer
          )
        );
      }
    } else {
      // Se for a última questão, atualiza o tempo gasto e finaliza o quiz
      if (currentQuestion && !skipQuestion) {
        setUserAnswers(prevAnswers => 
          prevAnswers.map(answer => 
            answer.questionId === currentQuestion.id 
              ? { ...answer, timeSpent, timestamp: now } 
              : answer
          )
        );
      }
      
      // Finaliza o quiz
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
    // Registrar o tempo de início do quiz
    quizStartTimeRef.current = Date.now();
    questionStartTimeRef.current = Date.now();
    
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
    
    // Calcular o tempo gasto nesta questão
    const now = Date.now();
    const timeSpent = Math.round((now - questionStartTimeRef.current) / 1000);
    
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedOption,
      isCorrect: selectedOption === currentQuestion.correctAnswer,
      timeSpent,
      timestamp: now
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
      
      // Atualizar o tempo de início ao voltar para a questão anterior
      questionStartTimeRef.current = Date.now();
      
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
  };

  const resetQuiz = () => {
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsQuizFinished(false);
    setIsLeadCaptured(false);
    setSelectedAnswer(null);
    setTimeRemaining(QUESTION_TIME_LIMIT);
    
    // Resetar os tempos
    quizStartTimeRef.current = 0;
    questionStartTimeRef.current = 0;
  };

  return (
    <QuizContext.Provider
      value={{
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
      }}
    >
      {children}
    </QuizContext.Provider>
  );
} 