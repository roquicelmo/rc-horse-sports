import React from 'react';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogIn,
  Menu,
  Users,
  UserRoundCog,
  X,
} from 'lucide-react';

export type AppSection = 'dashboard' | 'draw' | 'events' | 'athletes' | 'agenda' | 'users';

interface SidebarProps {
  activeSection: AppSection;
  isOpen: boolean;
  onNavigate: (section: AppSection) => void;
  onClose: () => void;
  onOpenLogin: () => void;
}

const menuItems: Array<{ id: AppSection; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: 'Painel geral', icon: LayoutDashboard },
  { id: 'events', label: 'Provas e arenas', icon: ClipboardList },
  { id: 'athletes', label: 'Cadastro de atletas', icon: Users },
  { id: 'agenda', label: 'Minha agenda', icon: CalendarDays },
  { id: 'users', label: 'Usuários', icon: UserRoundCog },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  isOpen,
  onNavigate,
  onClose,
  onOpenLogin,
}) => (
  <>
    {isOpen && (
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#111a31]/25 lg:hidden"
      />
    )}

    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#dfe6ed] bg-[#ffffff] shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-20 items-center justify-between border-b border-[#dfe6ed] px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-[#172a2d] shadow-sm">
            <span className="text-lg font-black">L</span>
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-[#172036]">Lagoa</p>
            <p className="text-xs text-[#6b788b]">Gestão de provas</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onClose}
          className="rounded-lg p-2 text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036] lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 pb-4 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8290a1]">Arenas e laço</p>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Navegação principal">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                isActive
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-[#6b788b] hover:bg-[#eef3f6] hover:text-[#172036]'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#176f67]' : 'text-[#8290a1]'}`} />
              {item.label}
            </button>
          );
        })}

        <div className="my-4 border-t border-[#dfe6ed]" />

        <button
          type="button"
          onClick={() => {
            onNavigate('draw');
            onClose();
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
            activeSection === 'draw'
              ? 'bg-amber-50 text-amber-800'
              : 'text-[#6b788b] hover:bg-amber-50 hover:text-amber-800'
          }`}
        >
          <Menu className="h-4 w-4 text-amber-700" />
          Novo sorteio
        </button>
      </nav>

      <div className="border-t border-[#dfe6ed] p-4">
        <button
          type="button"
          onClick={onOpenLogin}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036]"
        >
          <LogIn className="h-4 w-4" />
          Acessar conta
        </button>
        <div className="mt-4 rounded-xl bg-[#eef3f6] px-3 py-3">
          <p className="text-xs font-bold text-[#2f3b4f]">Henrique Lagoa</p>
          <p className="mt-1 text-[11px] text-[#6b788b]">Administrador da arena</p>
        </div>
      </div>
    </aside>
  </>
);
