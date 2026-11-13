import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, Trophy, UserRound } from 'lucide-react';
import { authClient } from '../auth/session';

declare global {
  interface Window {
    grecaptcha?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface LoginPageProps {
  onAuthenticated: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'request'>('login');
  const [requestForm, setRequestForm] = useState({ name: '', phone: '', email: '' });
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidget = useRef<number | null>(null);

  useEffect(() => {
    if (mode !== 'request' || !import.meta.env.VITE_RECAPTCHA_SITE_KEY || recaptchaWidget.current !== null) return;
    const renderCaptcha = () => {
      if (recaptchaRef.current && window.grecaptcha) {
        recaptchaWidget.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
          callback: (token) => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(''),
        });
      }
    };
    const existingScript = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existingScript) {
      renderCaptcha();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = renderCaptcha;
    document.head.appendChild(script);
  }, [mode]);

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

  const handleAccessRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    if (!recaptchaToken) {
      setErrorMessage('Complete a validação do reCAPTCHA para continuar.');
      return;
    }
    setIsSubmitting(true);
    try {
      await authClient.requestAccess({ ...requestForm, recaptchaToken });
      setRequestSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível enviar a solicitação.');
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
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#218f83]">{mode === 'login' ? 'Acesso da equipe' : 'Primeiro acesso'}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#172036]">{mode === 'login' ? 'Entrar no sistema' : 'Solicitar acesso'}</h1>
          <p className="mt-2 text-sm leading-6 text-[#6b788b]">
            {mode === 'login' ? 'Use seu e-mail e senha para acessar provas, atletas e resultados.' : 'Envie seus dados. Um administrador analisará e liberará seu acesso.'}
          </p>
        </div>

        {mode === 'login' ? <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
        </form> : requestSent ? (
          <div className="mt-8 rounded-2xl border border-[#bde5dd] bg-[#effaf7] p-5 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#218f83]" />
            <h2 className="mt-3 font-extrabold text-[#176f67]">Solicitação enviada</h2>
            <p className="mt-2 text-sm leading-6 text-[#4f6b70]">Seus dados foram recebidos. Aguarde o contato de um administrador.</p>
          </div>
        ) : <form className="mt-8 space-y-4" onSubmit={handleAccessRequest}>
          <label className="block"><span className="mb-2 block text-sm font-bold text-[#2f3b4f]">Nome</span><span className="relative block"><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290a1]" /><input required value={requestForm.name} onChange={(event) => setRequestForm({ ...requestForm, name: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] bg-[#f6f8fa] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#218f83]" placeholder="Seu nome completo" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-[#2f3b4f]">Telefone</span><span className="relative block"><Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290a1]" /><input required type="tel" value={requestForm.phone} onChange={(event) => setRequestForm({ ...requestForm, phone: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] bg-[#f6f8fa] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#218f83]" placeholder="(00) 00000-0000" /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-[#2f3b4f]">E-mail</span><span className="relative block"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290a1]" /><input required type="email" value={requestForm.email} onChange={(event) => setRequestForm({ ...requestForm, email: event.target.value })} className="w-full rounded-xl border border-[#dfe6ed] bg-[#f6f8fa] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#218f83]" placeholder="seu@email.com" /></span></label>
          <div ref={recaptchaRef} className="min-h-[78px]" />
          {!import.meta.env.VITE_RECAPTCHA_SITE_KEY && <p className="text-xs text-amber-700">O reCAPTCHA ainda não foi configurado neste ambiente.</p>}
          {errorMessage && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{errorMessage}</span></div>}
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e87900] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#cf6900] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'Enviando...' : 'Enviar solicitação'}{!isSubmitting && <ArrowRight className="h-4 w-4" />}</button>
        </form>}

        {!requestSent && <button type="button" onClick={() => { setMode(mode === 'login' ? 'request' : 'login'); setErrorMessage(''); }} className="mt-5 w-full text-sm font-bold text-[#218f83] hover:underline">
          {mode === 'login' ? 'Ainda não tenho acesso' : 'Já tenho uma conta'}
        </button>}

      </section>
    </main>
  );
};
