-- Script para adicionar políticas de escrita à tabela quiz_questions
-- Como a autenticação de administrador é feita por senha na aplicação,
-- precisamos permitir operações de escrita de forma controlada

-- Habilitar escrita para qualquer origem (será controlada na aplicação)
CREATE POLICY "Permitir inserção de perguntas" 
ON quiz_questions FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Permitir atualização de perguntas" 
ON quiz_questions FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de perguntas" 
ON quiz_questions FOR DELETE 
TO anon
USING (true);

-- Comentário para o administrador:
-- 1. Este script adiciona políticas para permitir operações de escrita na tabela
-- 2. A segurança deve ser implementada na aplicação, controlando quem tem acesso ao painel admin
-- 3. Use este script após criar a tabela e configurar a política de leitura
-- 4. IMPORTANTE: Esta configuração confia que a aplicação controla adequadamente 
--    o acesso ao painel administrativo 