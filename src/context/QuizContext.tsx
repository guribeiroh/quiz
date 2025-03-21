"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { QuizQuestion, UserAnswer, QuizResult, UserData } from '../types/quiz';
import { quizQuestions } from '../data/questions';
import { saveQuizResults } from '../lib/supabase';

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
  saveUserData: (data: UserData) => Promise<void>;
  resetQuiz: () => void;
}

// URL do webhook para envio dos dados
const WEBHOOK_URL = "https://hook.us1.make.com/x8xbamhov1q9tlyocl2x713kpvpl3wa5";

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

  // Função para enviar os dados para o webhook
  const sendDataToWebhook = async (userData: UserData, quizResult: QuizResult) => {
    try {
      console.log("Tentando enviar dados para webhook e Supabase...");
      console.log("Dados do usuário:", userData);
      console.log("Resultados do quiz:", quizResult);
      
      // Determinar o ritmo de conclusão
      let completionRhythm = 'constante';
      const answersWithTimestamp = quizResult.answers.filter(a => a.timestamp);
      
      if (answersWithTimestamp.length >= 2) {
        const sortedAnswers = [...answersWithTimestamp].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        const firstHalf = sortedAnswers.slice(0, Math.floor(sortedAnswers.length / 2));
        const secondHalf = sortedAnswers.slice(Math.floor(sortedAnswers.length / 2));
        
        let firstHalfAvgTime = 0;
        for (let i = 1; i < firstHalf.length; i++) {
          firstHalfAvgTime += (firstHalf[i].timestamp || 0) - (firstHalf[i-1].timestamp || 0);
        }
        firstHalfAvgTime = firstHalfAvgTime / (firstHalf.length - 1 || 1);
        
        let secondHalfAvgTime = 0;
        for (let i = 1; i < secondHalf.length; i++) {
          secondHalfAvgTime += (secondHalf[i].timestamp || 0) - (secondHalf[i-1].timestamp || 0);
        }
        secondHalfAvgTime = secondHalfAvgTime / (secondHalf.length - 1 || 1);
        
        const changeFactor = 1.25;
        if (firstHalfAvgTime > secondHalfAvgTime * changeFactor) {
          completionRhythm = 'acelerou';
        } else if (secondHalfAvgTime > firstHalfAvgTime * changeFactor) {
          completionRhythm = 'desacelerou';
        }
      }
      
      // 1. Enviar para o webhook conforme antes
      const payload = {
        userData,
        quizResult: {
          ...quizResult,
          answers: quizResult.answers.map(answer => ({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent || 0
          }))
        }
      };
      
      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
        // Continuamos mesmo com erro no webhook, para tentar salvar no Supabase
      }
      
      // 2. Salvar no Supabase
      const quizResultData = {
        userName: userData.name,
        userEmail: userData.email,
        userPhone: userData.phone, // Adicionando o telefone do usuário
        score: quizResult.score,
        correctAnswers: quizResult.correctAnswers,
        totalQuestions: quizResult.totalQuestions,
        totalTimeSpent: quizResult.totalTimeSpent ?? 0,
        averageTimePerQuestion: quizResult.averageTimePerQuestion ?? 0,
        completionRhythm,
        referralCode: userData.referralCode
      };
      
      console.log("Enviando para o Supabase com os parâmetros:", quizResultData);
      
      const supabaseResult = await saveQuizResults(
        quizResultData, 
        usedReferralCode // Usando a variável correta aqui, não userData.referralCode
      );
      
      console.log("Resultado do Supabase:", supabaseResult);
      
      // Se há erro, retornar o resultado do Supabase
      if (!supabaseResult.success) {
        return supabaseResult;
      }
      
      // Armazenar o código de referência se disponível
      if (supabaseResult.success && supabaseResult.data && (supabaseResult.data as Record<string, unknown>)?.referralCode) {
        const referralCode = (supabaseResult.data as Record<string, unknown>).referralCode as string;
        localStorage.setItem('referralCode', referralCode);
        
        // Atualizar o quizResult com o código de referência
        if (quizResult) {
          setQuizResult({
            ...quizResult,
            referralCode: referralCode
          });
        }
        
        console.log("Código de referência armazenado:", referralCode);
      }
      
      return supabaseResult;
      
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      // Retornar o erro para que possa ser tratado adequadamente
      return { 
        success: false, 
        error 
      };
    }
  };

  const saveUserData = async (data: UserData) => {
    // Verificar se há um código de referência usado armazenado
    const usedReferralCode = typeof window !== 'undefined' ? localStorage.getItem('usedReferralCode') : null;
    
    // Adicionar o código de referência aos dados do usuário, se disponível
    const updatedData = {
      ...data,
      referralCode: usedReferralCode || data.referralCode
    };
    
    console.log("saveUserData - Dados atualizados com código de referência:", 
      usedReferralCode ? `Usando código do localStorage: ${usedReferralCode}` : 
      data.referralCode ? `Usando código do formulário: ${data.referralCode}` : 
      "Sem código de referência");
    
    setUserData(updatedData);
    setIsLeadCaptured(true);
    
    // Se temos resultados, enviar dados para o webhook e Supabase
    if (quizResult) {
      try {
        const result = await sendDataToWebhook(updatedData, quizResult);
        
        // Se houver erro, propagar esse erro específico
        if (result && !result.success && result.error) {
          // Verificar se o erro tem a propriedade 'code' usando verificação de tipo
          const errorWithCode = result.error as { code?: string; message?: string };
          
          // Diferentes tipos de erro que podem ser propagados
          switch (errorWithCode.code) {
            case 'USER_ALREADY_EXISTS':
              console.error("Usuário já existe:", errorWithCode.message);
              throw {...result.error, status: 409}; // Status de conflito para já existente
            
            case 'DB_CONFIG_ERROR':
              console.error("Erro de configuração do banco:", errorWithCode.message);
              throw {...result.error, status: 500}; // Status de erro de servidor
            
            case 'SERVER_ERROR':
              console.error("Erro de servidor:", errorWithCode.message);
              throw {...result.error, status: 503}; // Status de serviço indisponível
            
            default:
              if (result.error) {
                console.error("Erro desconhecido:", result.error);
                throw result.error;
              }
          }
        }
        
        return result;
      } catch (error) {
        console.error("Erro ao enviar dados para o webhook e Supabase:", error);
        // Lançar o erro para tratamento no componente
        throw error;
      }
    }
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