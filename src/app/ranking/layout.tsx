import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ranking de Anatomia | Quiz Anatomia Sem Medo',
  description: 'Confira o ranking dos melhores estudantes no Quiz de Anatomia Sem Medo. Veja como você se compara com outros estudantes!',
};

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 