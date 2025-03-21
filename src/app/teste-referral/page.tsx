"use client";

import { useState } from 'react';
import { saveQuizResults } from '@/lib/supabase';
import { getQuizRanking } from '@/lib/supabase';
import { getSupabaseClient } from '@/lib/supabase';

export default function TesteReferral() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Para testar a consulta direta
  const [testReferralCode, setTestReferralCode] = useState('');
  const [queryResult, setQueryResult] = useState<any>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCopySuccess('');
    setDebugInfo(null);

    try {
      // Dados simulados de um quiz para teste
      const response = await saveQuizResults({
        userName,
        userEmail,
        score: 75,
        correctAnswers: 15,
        totalQuestions: 20,
        totalTimeSpent: 300,
        averageTimePerQuestion: 15,
        completionRhythm: 'constante',
      }, referralCode || undefined);

      setResult(response);
    } catch (err) {
      console.error("Erro ao testar sistema de referência:", err);
      setError(`Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const response = await getQuizRanking(50);
      if (response.success && response.data) {
        setRankingData(response.data);
      } else {
        setError("Erro ao buscar ranking");
      }
    } catch (err) {
      console.error("Erro ao buscar ranking:", err);
      setError(`Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (result?.data?.referralCode) {
      navigator.clipboard.writeText(result.data.referralCode)
        .then(() => {
          setCopySuccess('Código copiado!');
          setTimeout(() => setCopySuccess(''), 2000);
        })
        .catch(err => {
          setError('Erro ao copiar código');
        });
    }
  };
  
  // Função para testar o processamento do código de referência diretamente
  const testReferralQuery = async () => {
    setLoading(true);
    setQueryResult(null);
    setError(null);
    
    try {
      const supabase = getSupabaseClient();
      
      // Buscar o referenciador pelo código
      const { data: referrerData, error: referrerError } = await supabase
        .from('quiz_results')
        .select('id, user_email, referral_bonus_points, referral_code')
        .eq('referral_code', testReferralCode)
        .single();
      
      if (referrerError) {
        setQueryResult({ error: referrerError });
      } else {
        setQueryResult({ referrerData });
        
        // Mostrar informação de debug
        const { data: debugData, error: debugError } = await supabase
          .from('quiz_results')
          .select('*')
          .eq('referral_code', testReferralCode);
          
        setDebugInfo({ debugData, debugError });
      }
    } catch (e) {
      console.error("Erro ao consultar código de referência:", e);
      setError(`Erro: ${e instanceof Error ? e.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste Sistema de Referência</h1>
        
        <div className="bg-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold mb-4">Enviar Dados de Teste</h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Nome:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2">Email:</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                required
              />
            </div>
            
            <div>
              <label className="block mb-2">Código de Referência (opcional):</label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded font-medium"
            >
              {loading ? 'Processando...' : 'Enviar Teste'}
            </button>
          </form>
        </div>
        
        {/* Formulário para testar o processamento de código de referência */}
        <div className="bg-gray-800 p-6 rounded-xl mb-8">
          <h2 className="text-xl font-semibold mb-4">Testar Consulta de Código de Referência</h2>
          
          <div className="flex space-x-4">
            <input
              type="text"
              value={testReferralCode}
              onChange={(e) => setTestReferralCode(e.target.value)}
              placeholder="Digite um código de referência"
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded"
            />
            
            <button
              onClick={testReferralQuery}
              disabled={loading || !testReferralCode}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium whitespace-nowrap"
            >
              {loading ? 'Consultando...' : 'Testar Código'}
            </button>
          </div>
          
          {queryResult && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Resultado da Consulta:</h3>
              <div className="bg-gray-700 p-4 rounded overflow-auto">
                <pre>{JSON.stringify(queryResult, null, 2)}</pre>
              </div>
            </div>
          )}
          
          {debugInfo && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Informações de Debug:</h3>
              <div className="bg-gray-700 p-4 rounded overflow-auto">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <div className="bg-red-800/60 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {result && (
          <div className="bg-gray-800 p-6 rounded-xl mb-8">
            <h2 className="text-xl font-semibold mb-4">Resultado</h2>
            
            {result.data?.referralCode && (
              <div className="bg-emerald-900/30 p-4 rounded-lg mb-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-emerald-400">Seu código de referência:</p>
                  <p className="text-xl font-mono font-bold">{result.data.referralCode}</p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="bg-emerald-700 hover:bg-emerald-600 px-3 py-2 rounded text-sm"
                >
                  {copySuccess || 'Copiar Código'}
                </button>
              </div>
            )}
            
            <div className="bg-gray-700 p-4 rounded overflow-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
        
        <div className="bg-gray-800 p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Ranking Atual (com pontos de referência)</h2>
            <button
              onClick={fetchRanking}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium"
            >
              {loading ? 'Carregando...' : 'Atualizar Ranking'}
            </button>
          </div>
          
          {rankingData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="p-3 text-left">Posição</th>
                    <th className="p-3 text-left">Nome</th>
                    <th className="p-3 text-left">Pontuação</th>
                    <th className="p-3 text-left">Bônus de Referência</th>
                    <th className="p-3 text-left">Pontuação Total</th>
                    <th className="p-3 text-left">Código Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.map((entry, index) => (
                    <tr key={index} className="border-t border-gray-600">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{entry.user_name}</td>
                      <td className="p-3">{typeof entry.score === 'number' ? entry.score.toFixed(0) : entry.score}</td>
                      <td className="p-3">{entry.referral_bonus_points || 0}</td>
                      <td className="p-3 font-bold">{entry.total_score.toFixed(0)}</td>
                      <td className="p-3 text-xs font-mono">{entry.referral_code || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">Clique em "Atualizar Ranking" para ver os dados.</p>
          )}
        </div>
      </div>
    </div>
  );
} 