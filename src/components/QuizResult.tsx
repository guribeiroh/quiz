"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaDownload, FaRedo, FaCheckCircle, FaTimesCircle, FaChevronDown } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';

export function QuizResult() {
  const { quizResult, userData, questions, resetQuiz } = useQuiz();
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  
  if (!quizResult || !userData) return null;
  
  const correctAnswers = quizResult.correctAnswers;
  const totalQuestions = quizResult.totalQuestions;
  const score = quizResult.score;
  
  const getScoreMessage = () => {
    if (score >= 90) return "Excelente! Você demonstra um conhecimento excepcional de anatomia!";
    if (score >= 70) return "Muito bom! Você tem um conhecimento sólido de anatomia!";
    if (score >= 50) return "Bom trabalho! Você está no caminho certo, mas ainda há espaço para melhorar.";
    return "Continue estudando! O e-book vai te ajudar a melhorar seus conhecimentos.";
  };
  
  const getScoreColor = () => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-emerald-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };
  
  const handleDownload = () => {
    // Em uma aplicação real, aqui você poderia abrir uma nova aba com o PDF
    // ou iniciar o download do arquivo
    alert("Em uma aplicação real, aqui seria iniciado o download do e-book.");
  };
  
  const toggleAnalysis = () => {
    setIsAnalysisOpen(!isAnalysisOpen);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 px-4 py-6 sm:py-12 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="bg-emerald-700 p-5 sm:p-8 text-white text-center">
            <div className="mx-auto mb-3 sm:mb-4 bg-white/10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center">
              <FaTrophy className="text-yellow-400 text-3xl sm:text-4xl" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Relatório de Desempenho</h2>
            <p className="text-base sm:text-xl">Olá, {userData.name}! Aqui está seu relatório completo.</p>
          </div>
          
          <div className="p-5 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="mb-3 sm:mb-4">
                <span className={`text-4xl sm:text-6xl font-bold ${getScoreColor()}`}>
                  {score.toFixed(0)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl text-gray-300">{getScoreMessage()}</p>
              <div className="flex justify-center items-center mt-3 sm:mt-4">
                <div className="flex items-center mr-4 sm:mr-6">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <span className="text-sm sm:text-base text-gray-300">{correctAnswers} corretas</span>
                </div>
                <div className="flex items-center">
                  <FaTimesCircle className="text-red-500 mr-2" />
                  <span className="text-sm sm:text-base text-gray-300">{totalQuestions - correctAnswers} incorretas</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
              <button 
                onClick={toggleAnalysis}
                className="w-full flex justify-between items-center text-left focus:outline-none"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-emerald-400">Análise das Respostas</h3>
                <motion.div 
                  animate={{ rotate: isAnalysisOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-emerald-400"
                >
                  <FaChevronDown />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {isAnalysisOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 sm:space-y-4 mt-4">
                      {questions.map((question, index) => {
                        const userAnswer = quizResult.answers.find(a => a.questionId === question.id);
                        const isCorrect = userAnswer?.isCorrect || false;
                        
                        return (
                          <div key={question.id} className="border-b border-gray-600 pb-3 sm:pb-4 last:border-0">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-1">
                                {isCorrect ? (
                                  <FaCheckCircle className="text-green-500" />
                                ) : (
                                  <FaTimesCircle className="text-red-500" />
                                )}
                              </div>
                              <div className="ml-3">
                                <h4 className="font-medium text-white text-sm sm:text-base">
                                  {index + 1}. {question.question}
                                </h4>
                                <div className="mt-1 sm:mt-2 text-xs sm:text-sm">
                                  <p className="text-gray-300">
                                    <span className="font-medium">Sua resposta:</span>{' '}
                                    {userAnswer ? question.options[userAnswer.selectedOption] : 'Não respondida'}
                                  </p>
                                  {!isCorrect && (
                                    <p className="text-emerald-400 mt-1">
                                      <span className="font-medium">Resposta correta:</span>{' '}
                                      {question.options[question.correctAnswer]}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-600 mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-emerald-400">Seu E-book está pronto!</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
                Parabéns por completar o quiz! Seu e-book &quot;Guia Definitivo para Estudar Anatomia&quot; 
                já está disponível para download. Este guia contém:
              </p>
              <ul className="text-xs sm:text-sm text-gray-300 space-y-2 mb-5 sm:mb-6">
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Técnicas de memorização específicas para anatomia</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Mapas mentais para sistemas e regiões anatômicas</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Resumos completos dos principais sistemas</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Dicas para se destacar em provas práticas</span>
                </li>
              </ul>
              
              <motion.button
                onClick={handleDownload}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaDownload className="mr-2" />
                Baixar E-book Gratuito
              </motion.button>
            </div>
            
            <div className="text-center">
              <motion.button
                onClick={resetQuiz}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center mx-auto text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaRedo className="mr-2" />
                Reiniciar Quiz
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 