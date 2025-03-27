# Guia de Configuração do Banco de Dados

Este diretório contém os scripts SQL necessários para configurar a tabela de perguntas do quiz no Supabase. Como a autenticação de administrador é feita por senha simples na aplicação, os scripts foram otimizados para este cenário.

## Ordem de execução dos scripts

Execute os scripts na seguinte ordem:

1. `create_quiz_questions_table.sql` - Cria a tabela de perguntas do quiz
2. `quiz_questions_policies.sql` - Configura políticas de leitura (permite que qualquer pessoa veja perguntas ativas)
3. `add_security_bypass.sql` - Configura políticas de escrita (permite operações de escrita que serão controladas pela aplicação)
4. `add_difficulty_field.sql` - Adiciona o campo de dificuldade à tabela de perguntas

## Detalhes do sistema de segurança

O sistema utiliza uma abordagem simples:

1. **Autenticação**: Feita diretamente na aplicação com verificação de senha
   - A senha está definida em `src/app/admin/page.tsx`
   - Não depende da autenticação do Supabase

2. **Segurança de dados**: 
   - Leitura: Apenas perguntas ativas são visíveis publicamente
   - Escrita: Controlada pelo acesso ao painel admin com senha

## Como executar os scripts

1. Acesse o [Console do Supabase](https://app.supabase.com)
2. Vá para o Editor SQL do seu projeto
3. Para cada arquivo SQL neste diretório:
   - Abra o arquivo
   - Copie o conteúdo
   - Cole no Editor SQL do Supabase
   - Execute o script

## Notas importantes

- Altere a senha de administrador em produção (arquivo `src/app/admin/page.tsx`)
- O modelo atual não usa autenticação do Supabase, o que simplifica a configuração
- Para maior segurança em produção, considere implementar uma autenticação mais robusta
- A segurança deste sistema depende exclusivamente do controle de acesso ao painel admin 