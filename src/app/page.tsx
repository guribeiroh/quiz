"use client";

import { useState, useEffect } from 'react';
import { Welcome } from '../components/Welcome';
import { Question } from '../components/Question';
import { LeadCapture } from '../components/LeadCapture';
import { QuizResult } from '../components/QuizResult';
import { useQuiz } from '../context/QuizContext';
import { Hero } from '@/components/Hero';
import { QuizForm } from '@/components/QuizForm';
import { Footer } from '@/components/Footer';

export default function Home() {
  const { isQuizStarted, isQuizFinished, isLeadCaptured, setUserData } = useQuiz();
  const [showForm, setShowForm] = useState(false);
  
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
  
  const handleStartClick = () => {
    setShowForm(true);
  };
  
  const handleFormSubmit = (name: string, email: string) => {
    setUserData({ name, email });
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950">
      {showForm ? (
        <QuizForm onSubmit={handleFormSubmit} />
      ) : (
        <Hero onStartClick={handleStartClick} />
      )}
      
      {!isQuizStarted && <Welcome />}
      
      {isQuizStarted && !isQuizFinished && <Question />}
      
      {isQuizFinished && !isLeadCaptured && <LeadCapture />}
      
      {isQuizFinished && isLeadCaptured && <QuizResult />}
      
      <Footer />
    </main>
  );
}
