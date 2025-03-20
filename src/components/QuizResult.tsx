"use client";

import { motion } from 'framer-motion';
import { FaTrophy, FaDownload, FaRedo, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';

export function QuizResult() {
  const { quizResult, userData, questions, resetQuiz } = useQuiz();
  
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700"
        >
          <div className="bg-emerald-700 p-8 text-white text-center">
            <div className="mx-auto mb-4 bg-white/10 w-20 h-20 rounded-full flex items-center justify-center">
              <FaTrophy className="text-yellow-400 text-4xl" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Relatório de Desempenho</h2>
            <p className="text-xl">Olá, {userData.name}! Aqui está seu relatório completo.</p>
          </div>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="mb-4">
                <span className={`text-6xl font-bold ${getScoreColor()}`}>
                  {score.toFixed(0)}%
                </span>
              </div>
              <p className="text-xl text-gray-300">{getScoreMessage()}</p>
              <div className="flex justify-center items-center mt-4">
                <div className="flex items-center mr-6">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <span className="text-gray-300">{correctAnswers} corretas</span>
                </div>
                <div className="flex items-center">
                  <FaTimesCircle className="text-red-500 mr-2" />
                  <span className="text-gray-300">{totalQuestions - correctAnswers} incorretas</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 p-6 rounded-xl mb-8">
              <h3 className="text-xl font-semibold mb-4 text-emerald-400">Análise das Respostas</h3>
              
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const userAnswer = quizResult.answers.find(a => a.questionId === question.id);
                  const isCorrect = userAnswer?.isCorrect || false;
                  
                  return (
                    <div key={question.id} className="border-b border-gray-600 pb-4 last:border-0">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {isCorrect ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaTimesCircle className="text-red-500" />
                          )}
                        </div>
                        <div className="ml-3">
                          <h4 className="font-medium text-white">
                            {index + 1}. {question.question}
                          </h4>
                          <div className="mt-2 text-sm">
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
            </div>
            
            <div className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-emerald-400">Seu E-book está pronto!</h3>
              <p className="text-gray-300 mb-4">
                Parabéns por completar o quiz! Seu e-book "Guia Definitivo para Estudar Anatomia" 
                já está disponível para download. Este guia contém:
              </p>
              <ul className="text-gray-300 space-y-2 mb-6">
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center"
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
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center mx-auto"
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