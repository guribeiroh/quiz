"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
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
  startQuiz: () => void;
  nextQuestion: (skipQuestion?: boolean) => void;
  previousQuestion: () => void;
  selectAnswer: (selectedOption: number) => void;
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Computed property for current question
  const currentQuestion = isQuizStarted && currentQuestionIndex < questions.length 
    ? questions[currentQuestionIndex] 
    : null;

  const startQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizResult(null);
    setIsQuizFinished(false);
    setIsLeadCaptured(false);
    setSelectedAnswer(null);
  };

  const selectAnswer = (selectedOption: number) => {
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

  const nextQuestion = (skipQuestion: boolean = false) => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // If it's the last question, finish the quiz
      finishQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Set the selected answer to what the user previously chose
      const previousAnswer = userAnswers.find(
        a => a.questionId === questions[currentQuestionIndex - 1].id
      );
      setSelectedAnswer(previousAnswer ? previousAnswer.selectedOption : null);
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
    setSelectedAnswer(null);
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