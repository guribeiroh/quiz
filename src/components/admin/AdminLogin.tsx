'use client';

import { useState } from 'react';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!password.trim()) {
      setError('Por favor, digite a senha');
      setIsLoading(false);
      return;
    }
    
    const success = onLogin(password);
    
    if (!success) {
      setError('Senha incorreta');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-900 flex justify-center items-center p-4">
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-700/50 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">Painel de Administração</h2>
          <p className="text-gray-400">Acesso restrito para administradores</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha de Acesso
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Digite a senha de acesso"
              disabled={isLoading}
            />
            {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
          </div>
          
          <button
            type="submit"
            className={`w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-cyan-500/20 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verificando...
              </span>
            ) : (
              'Acessar Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 