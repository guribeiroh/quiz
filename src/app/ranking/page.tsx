"use client";

import { QuizRanking } from "@/components/QuizRanking";
import { Suspense } from "react";

// Esta configuração evita a pré-renderização da página durante o build
export const dynamic = 'force-dynamic';

export default function RankingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
      <div className="animate-pulse text-emerald-400 text-xl">Carregando ranking...</div>
    </div>}>
      <QuizRanking />
    </Suspense>
  );
} 