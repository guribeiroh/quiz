"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaDownload, FaRedo, FaCheckCircle, FaTimesCircle, FaChevronDown, 
         FaBrain, FaBookMedical, FaHeartbeat, FaBone, FaFlask, FaStar, FaClock, FaRunning, FaBolt } from 'react-icons/fa';
import { useQuiz } from '../context/QuizContext';
import { Footer } from './Footer';

export function QuizResult() {
  const { quizResult, userData, questions, resetQuiz } = useQuiz();
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'categorias' | 'dicas'>('resumo');
  
  // Efeito para rolar para o topo da página quando o componente é montado
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Valor padrão para quando não há resultado ainda
  const correctAnswers = quizResult?.correctAnswers ?? 0;
  const totalQuestions = quizResult?.totalQuestions ?? 0;
  const score = quizResult?.score ?? 0;
  
  // Valores de tempo do quiz
  const totalTimeSpent = quizResult?.totalTimeSpent ?? 0;
  const averageTimePerQuestion = quizResult?.averageTimePerQuestion ?? 0;
  
  // Cálculos para o gráfico circular
  const circumference = 2 * Math.PI * 45; // 45 é o raio
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Função para formatar o tempo em minutos e segundos
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? `${mins}min ` : ''}${secs}seg`;
  };
  
  // Análise do ritmo de resposta
  const getResponseRateAnalysis = useMemo(() => {
    if (!quizResult?.answers || quizResult.answers.length === 0) return null;
    
    // Ordenar as respostas por timestamp (do mais antigo para o mais recente)
    const sortedAnswers = [...quizResult.answers]
      .filter(a => a.timestamp)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    if (sortedAnswers.length < 2) return null;
    
    // Calcular a média de tempo entre as respostas
    let totalTimeBetweenAnswers = 0;
    for (let i = 1; i < sortedAnswers.length; i++) {
      totalTimeBetweenAnswers += ((sortedAnswers[i].timestamp || 0) - (sortedAnswers[i-1].timestamp || 0)) / 1000;
    }
    
    const avgTimeBetweenAnswers = totalTimeBetweenAnswers / (sortedAnswers.length - 1);
    
    // Analisar se o ritmo foi constante ou mudou ao longo do quiz
    const firstHalfAnswers = sortedAnswers.slice(0, Math.ceil(sortedAnswers.length / 2));
    const secondHalfAnswers = sortedAnswers.slice(Math.ceil(sortedAnswers.length / 2));
    
    let firstHalfTimeBetween = 0;
    for (let i = 1; i < firstHalfAnswers.length; i++) {
      firstHalfTimeBetween += ((firstHalfAnswers[i].timestamp || 0) - (firstHalfAnswers[i-1].timestamp || 0)) / 1000;
    }
    
    let secondHalfTimeBetween = 0;
    for (let i = 1; i < secondHalfAnswers.length; i++) {
      secondHalfTimeBetween += ((secondHalfAnswers[i].timestamp || 0) - (secondHalfAnswers[i-1].timestamp || 0)) / 1000;
    }
    
    const firstHalfAvg = firstHalfTimeBetween / (firstHalfAnswers.length - 1 || 1);
    const secondHalfAvg = secondHalfTimeBetween / (secondHalfAnswers.length - 1 || 1);
    
    // Determinar se o usuário acelerou, desacelerou ou manteve ritmo constante
    let trend: 'acelerou' | 'desacelerou' | 'constante' = 'constante';
    const changeFactor = 1.25; // Fator para considerar uma mudança significativa no ritmo
    
    if (firstHalfAvg > secondHalfAvg * changeFactor) {
      trend = 'acelerou';
    } else if (secondHalfAvg > firstHalfAvg * changeFactor) {
      trend = 'desacelerou';
    }
    
    return {
      averageTimeBetweenAnswers: avgTimeBetweenAnswers,
      trend,
      firstHalfAvg,
      secondHalfAvg
    };
  }, [quizResult]);
  
  // Categorias simuladas de perguntas (em um app real, essas categorias viriam das próprias perguntas)
  const questionCategories = useMemo(() => {
    if (!quizResult || !userData) return [];
    
    const categories = [
      { name: 'Sistema Nervoso', icon: <FaBrain />, color: 'emerald' },
      { name: 'Sistema Cardiovascular', icon: <FaHeartbeat />, color: 'red' },
      { name: 'Sistema Musculoesquelético', icon: <FaBone />, color: 'amber' },
      { name: 'Histologia e Embriologia', icon: <FaFlask />, color: 'blue' },
      { name: 'Anatomia Geral', icon: <FaBookMedical />, color: 'purple' }
    ];
    
    // Atribuir perguntas aleatoriamente às categorias para demonstração
    // Em um app real, cada pergunta teria sua própria categoria
    return categories.map(category => {
      const categoryQuestions = questions.filter((_, index) => index % categories.length === categories.indexOf(category));
      const correct = quizResult.answers
        .filter(a => categoryQuestions.some(q => q.id === a.questionId))
        .filter(a => a.isCorrect).length;
      const total = categoryQuestions.length;
      const percentage = total > 0 ? (correct / total) * 100 : 0;
      
      return {
        ...category,
        correct,
        total,
        percentage,
        strength: percentage >= 70
      };
    });
  }, [questions, quizResult, userData]);
  
  // Nível de desempenho
  const performanceLevel = useMemo(() => {
    if (!quizResult || !userData) return { name: 'Iniciante', stars: 1, description: 'Continue estudando para fortalecer seu conhecimento.' };
    
    if (score >= 90) return { name: 'Especialista', stars: 5, description: 'Você tem um conhecimento excepcional de anatomia!' };
    if (score >= 80) return { name: 'Avançado', stars: 4, description: 'Seu conhecimento de anatomia é muito bom!' };
    if (score >= 70) return { name: 'Intermediário+', stars: 3, description: 'Você domina bem os conceitos fundamentais.' };
    if (score >= 50) return { name: 'Intermediário', stars: 2, description: 'Você tem uma base sólida, mas ainda precisa praticar mais.' };
    return { name: 'Iniciante', stars: 1, description: 'Continue estudando para fortalecer seu conhecimento.' };
  }, [score, quizResult, userData]);
  
  // Identificar pontos fortes e fracos
  const strengths = questionCategories.filter(c => c.percentage >= 70);
  const weaknesses = questionCategories.filter(c => c.percentage < 70);
  
  if (!quizResult || !userData) return null;
  
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
  
  const getRhythmIcon = () => {
    if (!getResponseRateAnalysis) return <FaClock />;
    
    switch (getResponseRateAnalysis.trend) {
      case 'acelerou': return <FaBolt className="text-yellow-400" />;
      case 'desacelerou': return <FaClock className="text-blue-400" />;
      default: return <FaRunning className="text-emerald-400" />;
    }
  };
  
  const getRhythmMessage = () => {
    if (!getResponseRateAnalysis) return "Tempo médio consistente por questão";
    
    switch (getResponseRateAnalysis.trend) {
      case 'acelerou': 
        return "Você acelerou o ritmo de respostas ao longo do quiz";
      case 'desacelerou': 
        return "Você diminuiu o ritmo nas últimas questões";
      default: 
        return "Você manteve um ritmo constante durante todo o quiz";
    }
  };
  
  const handleDownload = () => {
    // Em uma aplicação real, aqui você poderia abrir uma nova aba com o PDF
    // ou iniciar o download do arquivo
    alert("Em uma aplicação real, aqui seria iniciado o download do e-book.");
  };
  
  const toggleAnalysis = () => {
    setIsAnalysisOpen(!isAnalysisOpen);
  };
  
  const getCategoryColorClass = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-500';
      case 'amber': return 'text-amber-500';
      case 'blue': return 'text-blue-500';
      case 'purple': return 'text-purple-500';
      default: return 'text-emerald-500';
    }
  };
  
  const getCategoryProgress = (percentage: number) => {
    const baseClasses = "h-2 rounded-full";
    let colorClass: string;
    if (percentage >= 80) colorClass = "bg-green-500";
    else if (percentage >= 60) colorClass = "bg-emerald-500";
    else if (percentage >= 40) colorClass = "bg-yellow-500";
    else colorClass = "bg-red-500";
    
    return (
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`${baseClasses} ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
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
            {/* Seção de Pontuação */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
              <div className="relative w-40 h-40">
                <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="45" 
                    fill="none" 
                    stroke="#374151" 
                    strokeWidth="15"
                  />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r="45"
                    fill="none" 
                    stroke={score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"} 
                    strokeWidth="15"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={`text-3xl font-bold ${getScoreColor()}`}>{score.toFixed(0)}%</span>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar 
                        key={i} 
                        className={i < performanceLevel.stars ? "text-yellow-400" : "text-gray-600"} 
                        size={14}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Nível: <span className={getScoreColor()}>{performanceLevel.name}</span>
                  </h3>
                  <p className="text-gray-300">{performanceLevel.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-700/70 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <span className="text-lg font-bold text-white">{correctAnswers}</span>
                    </div>
                    <p className="text-xs text-gray-300">Corretas</p>
                  </div>
                  <div className="bg-gray-700/70 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <FaTimesCircle className="text-red-500 mr-2" />
                      <span className="text-lg font-bold text-white">{totalQuestions - correctAnswers}</span>
                    </div>
                    <p className="text-xs text-gray-300">Incorretas</p>
                  </div>
                </div>
                
                {strengths.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Seus pontos fortes:</h4>
                    <div className="flex flex-wrap gap-2">
                      {strengths.map((strength, index) => (
                        <span 
                          key={index} 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-emerald-400 border border-emerald-600"
                        >
                          {strength.icon}
                          <span className="ml-1">{strength.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tabs para alternância de conteúdo */}
            <div className="border-b border-gray-700 mb-6">
              <div className="flex space-x-4">
                <button 
                  onClick={() => setActiveTab('resumo')}
                  className={`py-2 px-1 font-medium text-sm border-b-2 ${
                    activeTab === 'resumo' 
                      ? 'border-emerald-500 text-emerald-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Resumo
                </button>
                <button 
                  onClick={() => setActiveTab('categorias')}
                  className={`py-2 px-1 font-medium text-sm border-b-2 ${
                    activeTab === 'categorias' 
                      ? 'border-emerald-500 text-emerald-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Por Categoria
                </button>
                <button 
                  onClick={() => setActiveTab('dicas')}
                  className={`py-2 px-1 font-medium text-sm border-b-2 ${
                    activeTab === 'dicas' 
                      ? 'border-emerald-500 text-emerald-400' 
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Dicas Personalizadas
                </button>
              </div>
            </div>
            
            {/* Conteúdo da Tab Resumo */}
            {activeTab === 'resumo' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-600 mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-emerald-400">Análise do seu desempenho</h3>
                  <p className="text-gray-300 mb-4">{getScoreMessage()}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Distribuição de respostas</h4>
                      <div className="w-full bg-gray-600 rounded-full h-4">
                        <div 
                          className="bg-emerald-500 h-4 rounded-full text-xs flex items-center justify-center text-white"
                          style={{ width: `${(correctAnswers / totalQuestions) * 100}%` }}
                        >
                          {correctAnswers > 0 && (correctAnswers / totalQuestions) * 100 > 15 && `${Math.round((correctAnswers / totalQuestions) * 100)}%`}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-emerald-400 mb-2">Ritmo de conclusão</h5>
                        <div className="flex items-center">
                          {getRhythmIcon()}
                          <p className="text-white text-lg font-bold ml-2">
                            {formatTime(totalTimeSpent)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Tempo médio por questão: {formatTime(averageTimePerQuestion)}
                        </p>
                        {getResponseRateAnalysis && (
                          <p className="text-xs text-gray-400 mt-1">{getRhythmMessage()}</p>
                        )}
                      </div>
                      
                      <div className="bg-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-emerald-400 mb-2">Eficácia de resposta</h5>
                        <p className="text-white text-lg font-bold">{(correctAnswers / totalQuestions * 100).toFixed(0)}%</p>
                        <p className="text-xs text-gray-400">Taxa de acerto geral</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Conteúdo da Tab Categorias */}
            {activeTab === 'categorias' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-600 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-emerald-400">Desempenho por Categoria</h3>
                  
                  <div className="space-y-4">
                    {questionCategories.map((category, index) => (
                      <div key={index} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className={`mr-2 ${getCategoryColorClass(category.color)}`}>
                              {category.icon}
                            </span>
                            <h4 className="font-medium text-white">{category.name}</h4>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${
                              category.percentage >= 70 ? 'text-green-500' : 
                              category.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {category.percentage.toFixed(0)}%
                            </span>
                            <span className="text-xs text-gray-400 ml-1">({category.correct}/{category.total})</span>
                          </div>
                        </div>
                        {getCategoryProgress(category.percentage)}
                      </div>
                    ))}
                    
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-6">
                      <h4 className="font-medium text-white mb-2">Recomendação de Estudo</h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Com base no seu desempenho, recomendamos que você foque seus estudos nas seguintes áreas:
                      </p>
                      <ul className="space-y-2">
                        {weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start">
                            <span className={`mt-1 mr-2 ${getCategoryColorClass(weakness.color)}`}>
                              {weakness.icon}
                            </span>
                            <span className="text-sm text-gray-300">
                              <span className="font-medium text-white">{weakness.name}</span> - 
                              O e-book contém um capítulo detalhado sobre este tema.
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Conteúdo da Tab Dicas */}
            {activeTab === 'dicas' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-6"
              >
                <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-600 mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-emerald-400">Dicas Personalizadas</h3>
                  
                  <div className="space-y-4">
                    {score < 70 && (
                      <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-amber-500">
                        <h4 className="font-medium text-white mb-2">Os 4 Passos para Aprender</h4>
                        <p className="text-sm text-gray-300">
                          O e-book &quot;Como estudar Anatomia Humana&quot; apresenta um método dividido em 4 etapas essenciais: 
                          Explorar, Estudar, Revisar e Ensinar. Essas etapas trabalham diretamente com a forma como 
                          nossa memória se consolida, transformando exposição inicial em conhecimento de longo prazo.
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-emerald-500">
                      <h4 className="font-medium text-white mb-2">Sua Jornada de Aprendizado</h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Considerando seu desempenho, recomendamos este plano baseado no método do e-book:
                      </p>
                      <ol className="space-y-2 list-decimal list-inside text-sm text-gray-300">
                        <li><strong>Explorar</strong>: Tenha o primeiro contato com o conteúdo através de aulas ou leituras iniciais.</li>
                        <li><strong>Estudar</strong>: Use técnicas como identificação de palavras-chave ou caderno de bullet points.</li>
                        <li><strong>Revisar</strong>: Realize revisões frequentes dos conceitos destacados.</li>
                        <li><strong>Ensinar</strong>: Explique o conteúdo para consolidar seu aprendizado.</li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-medium text-white mb-2">Recursos do E-book</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• Guia para escolha dos melhores livros-texto e atlas de Anatomia</li>
                        <li>• Técnicas de memorização e consolidação do conhecimento</li>
                        <li>• Método para criar cadernos de bullet points eficientes</li>
                        <li>• Aplicação da técnica Pomodoro para otimizar seu tempo de estudo</li>
                        {weaknesses.map((weakness, i) => (
                          <li key={i}>• Estratégias específicas para melhorar em {weakness.name}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-400 italic">
                        &quot;O conhecimento é o maior bem que você pode adquirir!&quot;
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Seção de Respostas Detalhadas */}
            <div className="bg-gray-700 p-4 sm:p-6 rounded-xl mb-6 sm:mb-8">
              <button 
                onClick={toggleAnalysis}
                className="w-full flex justify-between items-center text-left focus:outline-none"
              >
                <h3 className="text-lg sm:text-xl font-semibold text-emerald-400">Todas as respostas</h3>
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
                                  {userAnswer?.timeSpent !== undefined && (
                                    <p className="text-gray-400 mt-1 text-xs">
                                      <FaClock className="inline mr-1" /> 
                                      Tempo: {formatTime(userAnswer.timeSpent)}
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
            
            {/* Seção do E-book */}
            <div className="bg-gray-700/50 p-4 sm:p-6 rounded-xl border border-gray-600 mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-emerald-400">Seu E-book está pronto!</h3>
              <p className="text-sm sm:text-base text-gray-300 mb-3 sm:mb-4">
                Parabéns por completar o quiz! Seu e-book &quot;Como estudar Anatomia Humana&quot; 
                já está disponível para download. Este guia exclusivo contém:
              </p>
              <ul className="text-xs sm:text-sm text-gray-300 space-y-2 mb-5 sm:mb-6">
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Os 4 passos essenciais para aprender: Explorar, Estudar, Revisar e Ensinar</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Guia para escolha entre livros-texto e atlas de Anatomia</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Técnicas de identificação de palavras-chave e caderno de bullet points</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-emerald-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Método Pomodoro para otimizar seu tempo de estudo</span>
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
      
      <Footer />
    </div>
  );
} 