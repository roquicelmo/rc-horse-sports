import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Team Roping Pro | Gestão de Inscrições & Sorteio',
  description: 'Sistema profissional de gestão de provas e sorteios de laço em dupla.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
