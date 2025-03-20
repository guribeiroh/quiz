"use client";

import { QuizRanking } from "@/components/QuizRanking";
import { Suspense } from "react";

export default function RankingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
      <div className="animate-pulse text-emerald-400 text-xl">Carregando ranking...</div>
    </div>}>
      <QuizRanking />
    </Suspense>
  );
} 