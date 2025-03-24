import { v4 as uuidv4 } from 'uuid';

// Chave para armazenar o ID de sessão no localStorage
const SESSION_ID_KEY = 'quiz_session_id';
const SESSION_START_TIME = 'quiz_session_start';

/**
 * Gera um ID de sessão único ou recupera o existente do localStorage
 * @returns {string} ID da sessão
 */
export function generateSessionId(): string {
  // Verificar se já existe um ID de sessão no localStorage
  if (typeof window !== 'undefined') {
    const existingSessionId = localStorage.getItem(SESSION_ID_KEY);
    const sessionStartTime = localStorage.getItem(SESSION_START_TIME);
    
    // Se temos um ID de sessão e faz menos de 30 minutos que foi criado, use-o
    if (existingSessionId && sessionStartTime) {
      const startTime = parseInt(sessionStartTime);
      const now = Date.now();
      const thirtyMinutesInMs = 30 * 60 * 1000;
      
      // Se faz menos de 30 minutos, retorne o ID existente
      if (now - startTime < thirtyMinutesInMs) {
        return existingSessionId;
      }
    }
    
    // Gerar um novo ID de sessão (após 30 minutos ou se não houver um)
    const newSessionId = uuidv4();
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    localStorage.setItem(SESSION_START_TIME, Date.now().toString());
    console.log('Nova sessão criada:', newSessionId);
    return newSessionId;
  }
  
  // Fallback para ambientes sem localStorage (SSR)
  return uuidv4();
}

/**
 * Recupera o ID de sessão atual
 * @returns {string|null} ID da sessão ou null se não existir
 */
export function getSessionId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_ID_KEY);
  }
  return null;
}

/**
 * Limpa o ID de sessão (útil para logout ou quando o funil é completado)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_ID_KEY);
  }
}

/**
 * Verifica se o usuário está em uma nova sessão ou é retornante
 * @returns {boolean} true se é uma nova sessão, false se retornante
 */
export function isNewSession(): boolean {
  if (typeof window !== 'undefined') {
    // Verificar se já existe um flag para sessão existente
    const sessionFlag = sessionStorage.getItem('session_started');
    
    if (!sessionFlag) {
      // Marcar que a sessão foi iniciada
      sessionStorage.setItem('session_started', 'true');
      return true;
    }
    
    return false;
  }
  
  return true;
} 