"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaArrowRight, FaTimes, FaClock } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';
import { ProgressBar } from './ProgressBar';
import { Footer } from './Footer';
import { trackStepView, FunnelStep } from '../lib/analytics';
import { generateSessionId } from '../lib/sessionUtils';

export function Question() {
  const { currentQuestion, questions, selectAnswer, nextQuestion, selectedAnswer, timeRemaining } = useQuiz();
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
  // Inicializar rastreamento e registrar visualização da página de perguntas
  useEffect(() => {
    // Garantir que há um ID de sessão
    const sid = generateSessionId();
    
    // Rastrear o evento de visualização
    trackStepView(FunnelStep.QUESTION, sid)
      .catch(error => console.error('Erro ao rastrear visualização:', error));
      
    // Registrar evento de pageview
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as {gtag: (event: string, action: string, params: Record<string, unknown>) => void}).gtag('event', 'page_view', {
        page_title: 'Question',
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    }
  }, []);
  
  // Efeito de pulsar quando o tempo estiver acabando
  useEffect(() => {
    if (timeRemaining <= 5 && !selectedAnswer) {
      setIsPulsing(true);
    } else {
      setIsPulsing(false);
    }
  }, [timeRemaining, selectedAnswer]);
  
  if (!currentQuestion) return null;
  
  const progress = questions.findIndex(q => q.id === currentQuestion.id) + 1;
  const isAnswered = selectedAnswer !== null;
  const isCorrect = isAnswered && selectedAnswer === currentQuestion.correctAnswer;
  
  // Calcular cor do timer baseada no tempo restante
  const getTimerColor = () => {
    if (timeRemaining > 20) return "emerald";
    if (timeRemaining > 10) return "yellow";
    return "red";
  };
  
  // Calcular percentual do tempo
  const timePercentage = (timeRemaining / 30) * 100;
  
  // Calcular o perímetro do círculo
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Calcular o valor do stroke-dashoffset para criar o efeito de preenchimento circular
  const dashOffset = circumference - (timePercentage / 100) * circumference;
  
  const getOptionClassName = (index: number) => {
    const baseClasses = "relative w-full p-4 sm:p-5 mb-3 rounded-lg border-2 text-left transition-all duration-200 flex items-center";
    
    // Se ainda não respondeu
    if (!isAnswered) {
      return `${baseClasses} bg-gray-700 border-gray-600 text-white hover:border-emerald-400 hover:shadow-md`;
    }
    
    // Se é a resposta selecionada
    if (selectedAnswer === index) {
      return isCorrect
        ? `${baseClasses} bg-emerald-600/20 border-emerald-500 text-white`
        : `${baseClasses} bg-red-600/20 border-red-500 text-white`;
    }
    
    // Se é a resposta correta mas não foi a selecionada
    if (currentQuestion.correctAnswer === index && !isCorrect) {
      return `${baseClasses} bg-emerald-600/20 border-emerald-500 text-white`;
    }
    
    // Outras opções após responder
    return `${baseClasses} bg-gray-700/50 border-gray-600 text-gray-400`;
  };
  
  // Função para lidar com seleção de resposta
  const handleSelectAnswer = (index: number) => {
    selectAnswer(index);
    
    // Rastrear evento de resposta
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as {gtag: (event: string, action: string, params: Record<string, unknown>) => void}).gtag('event', 'answer_question', {
        question_id: currentQuestion?.id,
        is_correct: index === currentQuestion?.correctAnswer,
        time_remaining: timeRemaining
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 px-4 py-6 sm:py-12 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => nextQuestion(true)} 
            className="font-medium text-gray-300 hover:text-emerald-400 flex items-center text-sm sm:text-base"
          >
            Pular questão
          </button>
          
          <div className="text-right">
            <p className="text-sm sm:text-base text-gray-300">
              <span className="font-medium">{progress}</span> de <span className="font-medium">{questions.length}</span>
            </p>
          </div>
        </div>
        
        {/* Timer elegante */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex items-center justify-center">
            {/* Círculo de fundo */}
            <div className="w-24 h-24 rounded-full bg-gray-800 shadow-lg border border-gray-700 flex items-center justify-center">
              {/* Círculo de progresso animado */}
              <svg className="absolute w-24 h-24" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent"
                  stroke="#374151"
                  strokeWidth="8"
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent"
                  stroke={getTimerColor() === "emerald" ? "#10b981" : getTimerColor() === "yellow" ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              
              {/* Texto do timer */}
              <div className={`text-2xl font-bold flex items-center ${isPulsing ? 'animate-pulse text-red-500' : `text-${getTimerColor()}-500`}`}>
                <FaClock className="mr-1 text-sm" />
                {timeRemaining}
              </div>
            </div>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="mb-8">
          <ProgressBar 
            progress={progress} 
            total={questions.length} 
          />
        </div>
        
        {/* A pergunta */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {currentQuestion.question}
          </h2>
          
          {currentQuestion.imageUrl && (
            <div className="mt-4 mb-6 flex justify-center">
              <img 
                src={currentQuestion.imageUrl} 
                alt="Imagem da questão"
                className="max-w-full rounded-lg border border-gray-700 shadow-lg max-h-60 object-contain bg-gray-800"
              />
            </div>
          )}
        </div>
        
        {/* Opções */}
        <div className="mb-8">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={getOptionClassName(index)}
              onClick={() => !isAnswered && handleSelectAnswer(index)}
              disabled={isAnswered}
            >
              <span className="bg-gray-800 text-gray-300 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 border border-gray-700">
                {String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
              
              {isAnswered && selectedAnswer === index && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isCorrect ? (
                    <span className="text-emerald-500 text-xl">✓</span>
                  ) : (
                    <span className="text-red-500 text-xl">✗</span>
                  )}
                </span>
              )}
              
              {isAnswered && selectedAnswer !== index && currentQuestion.correctAnswer === index && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="text-emerald-500 text-xl">✓</span>
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Explicação */}
        <AnimatePresence>
          {isAnswered && showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-emerald-400 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Explicação
                </h3>
                <button 
                  onClick={() => setShowExplanation(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              </div>
              <p className="text-gray-300">{currentQuestion.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Botões de ação */}
        <div className="flex justify-between">
          {isAnswered && !showExplanation && (
            <button
              onClick={() => setShowExplanation(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center text-sm"
            >
              <FaInfoCircle className="mr-2" />
              Ver explicação
            </button>
          )}
          
          <div className="ml-auto">
            {isAnswered && (
              <motion.button
                onClick={() => nextQuestion()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Próxima pergunta
                <FaArrowRight className="ml-2" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 