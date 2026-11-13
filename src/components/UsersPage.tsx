import React, { useEffect, useState } from 'react';
import { Check, Clock3, LockKeyhole, Plus, Shield, UserRound, X } from 'lucide-react';

type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'ORGANIZER';
interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  active: boolean;
  provisional: boolean;
  accessExpiresAt: string | null;
  lastLoginAt: string | null;
}
interface AccessRequest { id: string; name: string; phone: string; email: string; createdAt: string }

interface UsersPageProps { role: string }

const labels: Record<UserRole, string> = { ADMIN: 'Admin', MANAGER: 'Manager', USER: 'User', ORGANIZER: 'Manager legado' };

export const UsersPage: React.FC<UsersPageProps> = ({ role }) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as 'ADMIN' | 'MANAGER' | 'USER', provisional: true });

  const loadUsers = async () => {
    const response = await fetch('/api/users');
    const body = await response.json() as ManagedUser[] | { message?: string };
    if (!response.ok || !Array.isArray(body)) throw new Error(Array.isArray(body) ? 'Não foi possível carregar usuários.' : body.message);
    setUsers(body);
  };

  const loadRequests = async () => {
    const response = await fetch('/api/access-requests');
    const body = await response.json() as AccessRequest[] | { message?: string };
    if (response.ok && Array.isArray(body)) setRequests(body);
  };

  useEffect(() => {
    void Promise.all([loadUsers(), loadRequests()]).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar usuários.'));
  }, []);

  const reviewRequest = async (request: AccessRequest, decision: 'APPROVED' | 'REJECTED') => {
    const password = decision === 'APPROVED' ? window.prompt('Defina a senha inicial do usuário (mínimo 8 caracteres):') : undefined;
    if (decision === 'APPROVED' && !password) return;
    const response = await fetch('/api/access-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: request.id, status: decision, password }) });
    const body = await response.json() as { message?: string };
    if (!response.ok) { setError(body.message ?? 'Não foi possível revisar a solicitação.'); return; }
    setRequests((current) => current.filter((item) => item.id !== request.id));
    if (decision === 'APPROVED') void loadUsers();
  };

  const toggleActive = async (target: ManagedUser) => {
    const response = await fetch(`/api/users/${target.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !target.active }) });
    if (!response.ok) {
      const body = await response.json() as { message?: string };
      setError(body.message ?? 'Não foi possível atualizar o acesso.');
      return;
    }
    setUsers((current) => current.map((item) => item.id === target.id ? { ...item, active: !item.active } : item));
  };

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const body = await response.json() as ManagedUser | { message?: string };
    if (!response.ok || !('id' in body)) { setError('message' in body ? body.message ?? 'Não foi possível criar o usuário.' : 'Não foi possível criar o usuário.'); return; }
    setUsers((current) => [body, ...current]);
    setIsFormOpen(false);
    setForm({ name: '', email: '', password: '', role: 'USER', provisional: true });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Controle de acesso</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172036]">Usuários</h2><p className="mt-1 text-sm text-[#6b788b]">Administre perfis, acessos provisórios e permissões.</p></div>
        {role === 'ADMIN' && <button type="button" onClick={() => setIsFormOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#218f83] px-4 py-3 text-sm font-bold text-white hover:bg-[#176f67]"><Plus className="h-4 w-4" /> Novo usuário</button>}
      </div>
      {error && <div role="alert" className="rounded-xl border border-[#f2c7c2] bg-[#fff4f2] px-4 py-3 text-sm font-semibold text-[#a33d32]">{error}</div>}
      {!!requests.length && <div className="rounded-2xl border border-[#f0dfb6] bg-[#fffaf0] p-5"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#b87900]" /><h3 className="font-extrabold text-[#6e4b00]">Solicitações aguardando análise</h3></div><div className="mt-4 grid gap-3 md:grid-cols-2">{requests.map((request) => <div key={request.id} className="rounded-xl border border-[#f0dfb6] bg-white p-4"><p className="font-bold text-[#172036]">{request.name}</p><p className="text-sm text-[#526276]">{request.email} · {request.phone}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => void reviewRequest(request, 'APPROVED')} className="rounded-lg bg-[#218f83] px-3 py-2 text-xs font-bold text-white hover:bg-[#176f67]">Aprovar</button><button type="button" onClick={() => void reviewRequest(request, 'REJECTED')} className="rounded-lg border border-[#f2c7c2] px-3 py-2 text-xs font-bold text-[#a33d32] hover:bg-[#fff4f2]">Recusar</button></div></div>)}</div></div>}
      <div className="overflow-hidden rounded-2xl border border-[#dfe6ed] bg-white">
        <div className="hidden grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-[#dfe6ed] bg-[#eef3f6] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#6b788b] md:grid"><span>Usuário</span><span>E-mail</span><span>Perfil</span><span>Status</span><span>Ação</span></div>
        {users.map((item) => (
          <div key={item.id} className="grid gap-3 border-b border-[#eef3f6] px-5 py-4 last:border-0 md:grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr] md:items-center md:gap-4">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f5f2] text-[#176f67]">{item.role === 'ADMIN' ? <Shield className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}</span><div><p className="font-bold text-[#172036]">{item.name ?? 'Sem nome'}</p><p className="text-xs text-[#6b788b]">{item.provisional ? 'Acesso provisório' : 'Acesso permanente'}</p></div></div>
            <span className="text-sm text-[#526276]">{item.email}</span>
            <span className="w-fit rounded-full bg-[#eef3f6] px-2.5 py-1 text-xs font-extrabold text-[#526276]">{labels[item.role]}</span>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-extrabold ${item.active ? 'bg-[#d8f2ed] text-[#176f67]' : 'bg-[#fff4f2] text-[#a33d32]'}`}>{item.active ? 'Ativo' : 'Bloqueado'}</span>
            {item.role === 'ADMIN' && role !== 'ADMIN' ? (
              <span className="text-xs font-bold text-[#8290a1]">Administrador</span>
            ) : (
              <button type="button" onClick={() => void toggleActive(item)} className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#218f83] hover:text-[#176f67]">{item.active ? <LockKeyhole className="h-4 w-4" /> : <Check className="h-4 w-4" />}{item.active ? 'Bloquear' : 'Habilitar'}</button>
            )}
          </div>
        ))}
        {!users.length && <p className="p-8 text-center text-sm text-[#6b788b]">Nenhum usuário encontrado.</p>}
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111a31]/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={(event) => void createUser(event)} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-xl font-extrabold text-[#172036]">Novo usuário</h3><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Fechar"><X className="h-5 w-5 text-[#6b788b]" /></button></div>
            <input required placeholder="Nome completo" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" />
            <input required type="email" placeholder="E-mail" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" />
            <input required minLength={8} type="password" placeholder="Senha (mínimo 8 caracteres)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]" />
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as 'ADMIN' | 'MANAGER' | 'USER' })} className="w-full rounded-xl border border-[#dfe6ed] px-3 py-3 text-sm outline-none focus:border-[#218f83]"><option value="USER">User</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select>
            <label className="flex items-center gap-2 text-sm font-semibold text-[#526276]"><input type="checkbox" checked={form.provisional} onChange={(event) => setForm({ ...form, provisional: event.target.checked })} /> Acesso provisório</label>
            <button type="submit" className="w-full rounded-xl bg-[#218f83] px-4 py-3 text-sm font-bold text-white hover:bg-[#176f67]">Criar usuário</button>
          </form>
        </div>
      )}
    </section>
  );
};
