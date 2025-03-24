'use client';

import { useState, useEffect } from 'react';
import { AdminDashboard } from '../../components/admin/AdminDashboard';
import { AdminLogin } from '../../components/admin/AdminLogin';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Verificar se já está autenticado ao carregar a página
  useEffect(() => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);
  
  const handleLogin = (password: string) => {
    // Senha simples para demonstração - em produção, use uma autenticação segura
    if (password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };
  
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </main>
  );
} 