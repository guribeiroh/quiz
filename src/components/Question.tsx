"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FaArrowRight, FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';

const difficultyColors = {
  'fácil': 'bg-green-500',
  'médio': 'bg-yellow-500',
  'difícil': 'bg-red-500'
};

export function Question() {
  const { 
    questions, 
    currentQuestionIndex, 
    userAnswers, 
    answerQuestion, 
    nextQuestion, 
    previousQuestion,
    finishQuiz
  } = useQuiz();
  
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Reset state when question changes
  useEffect(() => {
    const existingAnswer = userAnswers.find(a => a.questionId === currentQuestion.id);
    if (existingAnswer) {
      setSelectedOption(existingAnswer.selectedOption);
      setIsAnswered(true);
    } else {
      setSelectedOption(null);
      setIsAnswered(false);
    }
    setShowExplanation(false);
  }, [currentQuestionIndex, currentQuestion.id, userAnswers]);
  
  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    
    setSelectedOption(optionIndex);
    answerQuestion(optionIndex);
    setIsAnswered(true);
  };
  
  const handleNextClick = () => {
    if (isLastQuestion) {
      if (userAnswers.length === questions.length) {
        finishQuiz();
      }
    } else {
      nextQuestion();
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <motion.button
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center text-white ${currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:text-emerald-400'}`}
            whileHover={currentQuestionIndex !== 0 ? { scale: 1.05 } : {}}
            whileTap={currentQuestionIndex !== 0 ? { scale: 0.95 } : {}}
          >
            <FaArrowLeft className="mr-2" />
            Anterior
          </motion.button>
          
          <div className="text-center">
            <span className="text-white font-medium">
              Pergunta {currentQuestionIndex + 1} de {questions.length}
            </span>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="invisible">
            <FaArrowRight className="ml-2" />
            Próxima
          </div>
        </div>
        
        <motion.div 
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="relative w-full h-48 md:h-64 bg-gray-700">
            {currentQuestion.imageUrl && (
              <Image 
                src={currentQuestion.imageUrl} 
                alt={`Imagem para ${currentQuestion.question}`}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute bottom-4 left-4">
              <span className={`${difficultyColors[currentQuestion.difficulty]} text-white text-sm px-3 py-1 rounded-full font-medium`}>
                {currentQuestion.difficulty}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6">
              {currentQuestion.question}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleOptionSelect(index)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center
                    ${selectedOption === index 
                      ? isAnswered && selectedOption === currentQuestion.correctAnswer
                        ? 'border-green-500 bg-green-500/10' 
                        : isAnswered && selectedOption !== currentQuestion.correctAnswer
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-600 hover:border-emerald-400 hover:bg-emerald-500/5 text-gray-200'}
                    ${isAnswered && index === currentQuestion.correctAnswer ? 'border-green-500 bg-green-500/10 text-white' : ''}
                  `}
                  whileHover={!isAnswered ? { scale: 1.01 } : {}}
                  whileTap={!isAnswered ? { scale: 0.99 } : {}}
                  disabled={isAnswered}
                >
                  <div className="flex-1">{option}</div>
                  {isAnswered && index === currentQuestion.correctAnswer && (
                    <FaCheckCircle className="text-green-500 text-lg" />
                  )}
                  {isAnswered && selectedOption === index && selectedOption !== currentQuestion.correctAnswer && (
                    <FaTimesCircle className="text-red-500 text-lg" />
                  )}
                </motion.button>
              ))}
            </div>
            
            <AnimatePresence>
              {isAnswered && showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <h3 className="font-semibold text-emerald-400 mb-2">Explicação:</h3>
                  <p className="text-gray-200">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-6 flex justify-between">
              {isAnswered && !showExplanation && (
                <motion.button
                  onClick={() => setShowExplanation(true)}
                  className="text-emerald-400 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ver explicação
                </motion.button>
              )}
              
              {isAnswered && showExplanation && (
                <motion.button
                  onClick={() => setShowExplanation(false)}
                  className="text-emerald-400 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ocultar explicação
                </motion.button>
              )}
              
              {isAnswered && (
                <motion.button
                  onClick={handleNextClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-full flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLastQuestion ? 'Finalizar Quiz' : 'Próxima'}
                  <FaArrowRight className="ml-2" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
        
        <div className="mt-8 text-center text-gray-300">
          <p>Responda todas as perguntas para receber seu e-book gratuito!</p>
        </div>
      </div>
    </div>
  );
} 