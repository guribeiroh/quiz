"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { QuizQuestion, UserAnswer, QuizResult, UserData } from '../types/quiz';
import { quizQuestions } from '../data/questions';

interface QuizContextType {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  quizResult: QuizResult | null;
  userData: UserData | null;
  isQuizStarted: boolean;
  isQuizFinished: boolean;
  isLeadCaptured: boolean;
  startQuiz: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  answerQuestion: (selectedOption: number) => void;
  finishQuiz: () => void;
  saveUserData: (data: UserData) => void;
  resetQuiz: () => void;
}

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

  const startQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsQuizFinished(false);
    setIsLeadCaptured(false);
  };

  const answerQuestion = (selectedOption: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    
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

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    const wrongAnswers = userAnswers.length - correctAnswers;
    
    const result: QuizResult = {
      totalQuestions: questions.length,
      correctAnswers,
      wrongAnswers,
      score: (correctAnswers / questions.length) * 100,
      answers: userAnswers
    };

    setQuizResult(result);
    setIsQuizFinished(true);
  };

  const saveUserData = (data: UserData) => {
    setUserData(data);
    setIsLeadCaptured(true);
    
    // Aqui você poderia enviar os dados para uma API/backend
    console.log('Lead capturado:', data);
  };

  const resetQuiz = () => {
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsQuizFinished(false);
    setUserData(null);
    setIsLeadCaptured(false);
  };

  const value = {
    questions,
    currentQuestionIndex,
    userAnswers,
    quizResult,
    userData,
    isQuizStarted,
    isQuizFinished,
    isLeadCaptured,
    startQuiz,
    nextQuestion,
    previousQuestion,
    answerQuestion,
    finishQuiz,
    saveUserData,
    resetQuiz
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
} 