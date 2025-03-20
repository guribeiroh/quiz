# Quiz Anatomia Sem Medo

Um quiz interativo e moderno sobre anatomia humana, com 10 perguntas de dificuldade crescente, captura de leads e entrega de e-book.

## Características

- 🧠 Quiz com 10 perguntas de anatomia em dificuldade crescente
- 🎯 Feedback imediato e explicações detalhadas
- 📊 Pontuação e relatório de desempenho completo
- 📚 Captura de leads para entregar e-book gratuito
- 🌐 Design moderno e responsivo
- ✨ Animações elegantes usando Framer Motion

## Tecnologias Utilizadas

- [Next.js 14](https://nextjs.org/) com App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) para estilização
- [React Hook Form](https://react-hook-form.com/) para gerenciamento de formulários
- [Zod](https://zod.dev/) para validação de dados
- [Framer Motion](https://www.framer.com/motion/) para animações
- [React Icons](https://react-icons.github.io/react-icons/) para ícones

## Como Executar

Primeiro, instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

Em seguida, inicie o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## Estrutura do Projeto

- **/src/app**: Arquivos principais da aplicação Next.js
- **/src/components**: Componentes React reutilizáveis
- **/src/context**: Context API para gerenciamento de estado global
- **/src/data**: Dados do quiz (perguntas, respostas, etc.)
- **/src/types**: Definições de tipos TypeScript

## Fluxo da Aplicação

1. **Tela de Boas-vindas**: Apresentação e explicação do quiz
2. **Quiz**: 10 perguntas com dificuldade progressiva
3. **Captura de Lead**: Formulário para o usuário fornecer seus dados
4. **Relatório Final**: Análise de desempenho e download do e-book

## Personalização

Para personalizar o quiz:

1. Edite as perguntas em `/src/data/questions.ts`
2. Modifique o esquema de cores no arquivo `tailwind.config.js`
3. Altere os textos nos componentes para se adequar ao seu público-alvo

## Produção

Para criar uma versão otimizada para produção:

```bash
npm run build
# ou
yarn build
# ou
pnpm build
# ou
bun build
```

---

Desenvolvido como um projeto de demonstração para captura de leads e educação.
