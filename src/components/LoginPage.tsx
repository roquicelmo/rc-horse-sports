import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Trophy } from 'lucide-react';
import { authClient } from '../auth/session';

interface LoginPageProps {
  onCancel: () => void;
  onAuthenticated: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onCancel, onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await authClient.login({ email: email.trim(), password });
      onAuthenticated();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível entrar agora.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#dfe6ed] bg-white p-7 shadow-[0_20px_60px_rgba(17,26,49,0.08)] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e87900] text-[#111a31]">
            <Trophy className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight text-[#172036]">Lagoa</p>
            <p className="text-xs text-[#6b788b]">Gestão de provas</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">Acesso da equipe</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#172036]">Entrar no sistema</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b788b]">
            Use seu e-mail e senha para acessar provas, atletas e resultados.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#2f3b4f]">E-mail</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290a1]" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#dfe6ed] bg-[#f6f8fa] py-3 pl-10 pr-3 text-sm text-[#172036] outline-none transition focus:border-[#218f83] focus:ring-2 focus:ring-[#218f83]/15"
                placeholder="seu@email.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#2f3b4f]">Senha</span>
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290a1]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#dfe6ed] bg-[#f6f8fa] py-3 pl-10 pr-11 text-sm text-[#172036] outline-none transition focus:border-[#218f83] focus:ring-2 focus:ring-[#218f83]/15"
                placeholder="Digite sua senha"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8290a1] transition hover:bg-[#eaf0f3] hover:text-[#172036]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          {errorMessage && (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e87900] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#cf6900] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-[#6b788b] transition hover:bg-[#eef3f6] hover:text-[#172036]"
        >
          Voltar para o protótipo
        </button>
      </section>
    </main>
  );
};
