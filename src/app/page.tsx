'use client';

import { Welcome } from '../components/Welcome';
import { Question } from '../components/Question';
import { LeadCapture } from '../components/LeadCapture';
import { QuizResult } from '../components/QuizResult';
import { useQuiz } from '../context/QuizContext';

export default function Home() {
  const { isQuizStarted, isQuizFinished, isLeadCaptured } = useQuiz();
  
  return (
    <main>
      {!isQuizStarted && <Welcome />}
      
      {isQuizStarted && !isQuizFinished && <Question />}
      
      {isQuizFinished && !isLeadCaptured && <LeadCapture />}
      
      {isQuizFinished && isLeadCaptured && <QuizResult />}
    </main>
  );
}
