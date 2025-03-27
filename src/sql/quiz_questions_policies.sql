-- Script para definir políticas de segurança para a tabela quiz_questions
-- Execute este script no console SQL do Supabase após criar a tabela quiz_questions

-- Habilitar Row Level Security (RLS) para a tabela
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública apenas de perguntas ativas
CREATE POLICY "Perguntas ativas visíveis para todos" 
ON quiz_questions FOR SELECT 
USING (active = TRUE);

-- Comentário para o administrador:
-- 1. Este script configura segurança básica para a tabela quiz_questions
-- 2. Como a autenticação de administrador é feita por senha na aplicação, 
--    não criamos políticas específicas para administradores
-- 3. Esta configuração permite que todos possam ver apenas perguntas ativas
-- 4. O controle de acesso para modificação de perguntas deve ser implementado
--    diretamente na aplicação 