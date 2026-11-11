import React from 'react';
import { ArrowRight, Construction, Plus } from 'lucide-react';
import type { AppSection } from './Sidebar';

interface SectionPlaceholderProps {
  section: Exclude<AppSection, 'dashboard' | 'draw'>;
  onStartDraw: () => void;
}

const content: Record<SectionPlaceholderProps['section'], { title: string; description: string }> = {
  events: {
    title: 'Provas e arenas',
    description: 'Crie provas, escolha a arena e acompanhe o status de cada evento.',
  },
  athletes: {
    title: 'Cadastro de atletas',
    description: 'Mantenha os atletas, contatos e handicaps organizados para as próximas inscrições.',
  },
  agenda: {
    title: 'Minha agenda',
    description: 'Consulte provas abertas, datas, locais e a participação de cada atleta.',
  },
  users: {
    title: 'Usuários',
    description: 'Gerencie os acessos da equipe e as permissões de cada função do sistema.',
  },
};

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ section, onStartDraw }) => {
  const sectionContent = content[section];

  return (
    <section className="rounded-2xl border border-[#dfe6ed] bg-[#ffffff]">
      <div className="border-b border-[#dfe6ed] px-6 py-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Em preparação</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">
          {sectionContent.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b788b]">{sectionContent.description}</p>
      </div>
      <div className="px-6 py-16 text-center">
        <Construction className="mx-auto h-9 w-9 text-amber-600" />
        <h3 className="mt-4 text-lg font-bold text-[#2f3b4f]">Esta área será conectada ao banco</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6b788b]">
          A navegação já está pronta. O cadastro persistente e os endpoints serão implementados nos
          próximos blocos, sem dados de demonstração.
        </p>
        <button
          type="button"
          onClick={onStartDraw}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <Plus className="h-4 w-4" />
          Começar um sorteio agora
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};
