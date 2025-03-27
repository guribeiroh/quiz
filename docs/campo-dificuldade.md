# Implementação do Campo de Dificuldade

## Visão Geral

O campo `difficulty` (dificuldade) foi implementado na tabela `quiz_questions` para permitir a classificação das perguntas em três níveis: **fácil**, **médio** e **difícil**. Essa funcionalidade melhora a experiência do usuário e oferece mais opções de organização do quiz.

## Arquivos Modificados

1. **Scripts SQL**
   - `add_difficulty_field.sql`: Script para adicionar o campo à tabela
   - `quiz_questions_policies.sql`: Políticas de segurança simplificadas
   - `add_security_bypass.sql`: Script para permitir operações sem autenticação Supabase

2. **Componentes React**
   - `AdminDashboard.tsx`: Interface para gerenciar a dificuldade das perguntas
   - `MigrateQuestions.tsx`: Atualizado para incluir dificuldade na migração

3. **Serviços**
   - `quiz-service.ts`: Funções para buscar perguntas com filtragem por dificuldade

## Detalhes da Implementação

### Banco de Dados
- Campo `difficulty` do tipo TEXT com valor padrão 'médio'
- Valores aceitos: 'fácil', 'médio', 'difícil'
- Índice para melhorar performance de consultas por dificuldade

### Interface de Administração
- Campo de seleção de dificuldade ao criar/editar perguntas
- Exibição visual da dificuldade na listagem de perguntas
- Ordenação de perguntas por `question_order` mantida

### Serviço de Perguntas
- Função `fetchQuestionsByDifficulty` para filtrar perguntas por nível
- Função `determineDifficulty` como fallback para compatibilidade
- Utiliza o campo `difficulty` da tabela quando disponível

## Configuração de Segurança

Como a autenticação é feita por senha diretamente na aplicação (não via Supabase), a segurança foi configurada para:

1. Permitir leitura pública apenas de perguntas ativas
2. Permitir operações de escrita (controladas na aplicação)
3. Não depender da tabela `user_profiles` do Supabase

## Como Usar

### Para Administradores
1. Execute os scripts SQL na ordem recomendada
2. Acesse o painel admin para classificar perguntas por dificuldade
3. Use a migração para adicionar perguntas existentes

### Para Desenvolvedores
1. Use `fetchQuestionsByDifficulty('fácil')` para buscar por dificuldade
2. Utilize a propriedade `difficulty` no tipo `QuizQuestion`
3. Implemente novos filtros ou visualizações baseadas na dificuldade

## Próximos Passos Sugeridos

1. Implementar filtro por dificuldade na interface do usuário
2. Criar quizzes temáticos por nível de dificuldade
3. Adicionar estatísticas de desempenho por nível de dificuldade 