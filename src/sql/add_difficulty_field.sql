-- Script para adicionar o campo difficulty à tabela quiz_questions
-- Execute este script após a criação da tabela base

-- Primeiro verifica se a coluna já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'quiz_questions' AND column_name = 'difficulty'
    ) THEN
        -- Adiciona o campo difficulty como TEXT com valor padrão 'médio'
        ALTER TABLE quiz_questions ADD COLUMN difficulty TEXT DEFAULT 'médio';
        
        -- Adiciona um comentário à coluna
        COMMENT ON COLUMN quiz_questions.difficulty IS 'Nível de dificuldade da pergunta: fácil, médio ou difícil';
        
        -- Cria um índice para melhorar a performance de consultas por dificuldade
        CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions (difficulty);
        
        -- Atualiza o valor de difficulty baseado no question_order para perguntas existentes
        UPDATE quiz_questions
        SET difficulty = 
            CASE
                WHEN question_order <= 10 THEN 'fácil'
                WHEN question_order <= 20 THEN 'médio'
                ELSE 'difícil'
            END;
    END IF;
END
$$;

-- Comentário para o administrador:
-- 1. Este script adiciona o campo difficulty à tabela quiz_questions se ele não existir
-- 2. O valor padrão é 'médio', mas você pode alterar conforme necessário
-- 3. As perguntas existentes terão sua dificuldade determinada pelo question_order
-- 4. Você pode ajustar os limiares (10 e 20) conforme a distribuição desejada das perguntas 