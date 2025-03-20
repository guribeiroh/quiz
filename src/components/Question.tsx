"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInfoCircle, FaArrowRight, FaTimes, FaClock } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';
import { ProgressBar } from './ProgressBar';

export function Question() {
  const { currentQuestion, questions, selectAnswer, nextQuestion, selectedAnswer, timeRemaining } = useQuiz();
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  
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
                  stroke={`rgba(${getTimerColor() === 'emerald' ? '16, 185, 129' : 
                              getTimerColor() === 'yellow' ? '234, 179, 8' : 
                              '239, 68, 68'}, 0.2)`}
                  strokeWidth="8"
                />
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r={radius} 
                  fill="transparent"
                  stroke={getTimerColor() === 'emerald' ? '#10b981' : 
                          getTimerColor() === 'yellow' ? '#eab308' : 
                          '#ef4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 50 50)"
                  animate={{ 
                    strokeDashoffset: dashOffset,
                    stroke: getTimerColor() === 'emerald' ? '#10b981' : 
                             getTimerColor() === 'yellow' ? '#eab308' : 
                             '#ef4444'
                  }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </svg>
              
              {/* Número do tempo e ícone */}
              <motion.div 
                className="flex flex-col items-center justify-center z-10"
                animate={{ 
                  scale: isPulsing ? [1, 1.1, 1] : 1,
                  color: getTimerColor() === 'emerald' ? '#10b981' : 
                         getTimerColor() === 'yellow' ? '#eab308' : 
                         '#ef4444'
                }}
                transition={{ 
                  scale: { repeat: Infinity, duration: 0.5 },
                  color: { duration: 0.3 }
                }}
              >
                <FaClock className="mb-1" />
                <span className="text-xl font-bold">{timeRemaining}</span>
              </motion.div>
            </div>
            
            {/* Texto descritivo */}
            <AnimatePresence>
              {!isAnswered && timeRemaining <= 10 && (
                <motion.span 
                  className="absolute -bottom-7 text-sm font-medium text-center text-red-400"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {timeRemaining <= 5 ? "Rápido!" : "Tempo acabando!"}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Barra de progresso do quiz */}
        <div className="mb-6">
          <ProgressBar progress={progress} total={questions.length} />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-4 sm:p-6 mb-6"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white">
            {currentQuestion.question}
          </h2>
          
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                disabled={isAnswered}
                className={getOptionClassName(index)}
                onClick={() => selectAnswer(index)}
              >
                <span className="text-sm sm:text-base">{option}</span>
                
                {isAnswered && selectedAnswer === index && isCorrect && (
                  <span className="absolute right-3 bg-emerald-500 text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                
                {isAnswered && selectedAnswer === index && !isCorrect && (
                  <span className="absolute right-3 bg-red-500 text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
                
                {isAnswered && currentQuestion.correctAnswer === index && selectedAnswer !== index && (
                  <span className="absolute right-3 bg-emerald-500 text-white rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {isAnswered && (
            <div className="mt-6">
              {showExplanation ? (
                <div className="bg-gray-700/50 p-4 sm:p-5 rounded-lg border border-gray-600 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-emerald-400">Explicação</h3>
                    <button 
                      onClick={() => setShowExplanation(false)}
                      className="text-emerald-400 hover:text-emerald-300"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">{currentQuestion.explanation}</p>
                </div>
              ) : (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="text-emerald-400 hover:text-emerald-300 text-sm sm:text-base flex items-center"
                >
                  <FaInfoCircle className="mr-2" />
                  Ver explicação
                </button>
              )}
            </div>
          )}
        </motion.div>
        
        <div className="flex justify-center">
          {isAnswered && (
            <motion.button
              onClick={() => nextQuestion(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-full text-base sm:text-lg flex items-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Próxima Questão
              <FaArrowRight className="ml-2" />
            </motion.button>
          )}
        </div>
        
        <p className="text-center mt-6 text-gray-300 text-xs sm:text-sm">
          Responda todas as questões para receber seu e-book gratuito!
        </p>
      </div>
    </div>
  );
} 