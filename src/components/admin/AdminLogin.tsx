'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaSignInAlt } from 'react-icons/fa';

interface AdminLoginProps {
  onLogin: (password: string) => boolean;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Digite a senha para continuar');
      return;
    }
    
    const success = onLogin(password);
    if (!success) {
      setError('Senha incorreta');
      setPassword('');
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full border border-gray-700"
      >
        <div className="text-center mb-6">
          <div className="bg-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-gray-900 text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-400">Painel Administrativo</h1>
          <p className="text-gray-400 mt-2">Quiz Anatomia Sem Medo</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Digite a senha de acesso"
              autoComplete="current-password"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>
          
          <motion.button
            type="submit"
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaSignInAlt className="mr-2" />
            Entrar
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
} 