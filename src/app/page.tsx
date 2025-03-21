"use client";

import { useEffect } from 'react';
import { Welcome } from '../components/Welcome';
import { Question } from '../components/Question';
import { LeadCapture } from '../components/LeadCapture';
import { QuizResult } from '../components/QuizResult';
import { useQuiz } from '../context/QuizContext';

export default function Home() {
  const { isQuizStarted, isQuizFinished, isLeadCaptured } = useQuiz();
  
  useEffect(() => {
    // Verificar se há um código de referência na URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      
      if (refCode) {
        // Armazenar o código de referência para uso posterior
        localStorage.setItem('usedReferralCode', refCode);
        console.log('Código de referência detectado:', refCode);
      }
    }
  }, []);
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950">
      {!isQuizStarted && <Welcome />}
      
      {isQuizStarted && !isQuizFinished && <Question />}
      
      {isQuizFinished && !isLeadCaptured && <LeadCapture />}
      
      {isQuizFinished && isLeadCaptured && <QuizResult />}
    </main>
  );
}
