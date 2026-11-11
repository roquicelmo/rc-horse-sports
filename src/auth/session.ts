export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser;
  expiresAt: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const request = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Não foi possível concluir a operação de autenticação.');
  }

  return response.json() as Promise<T>;
};

const getCsrfToken = async () => {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) throw new Error('Não foi possível iniciar a sessão segura.');
  const body = await response.json() as { csrfToken?: string };
  if (!body.csrfToken) throw new Error('A proteção da sessão não foi configurada corretamente.');
  return body.csrfToken;
};

export const authClient = {
  getSession: () => request<AuthSession | null>('/api/auth/session'),

  login: async ({ email, password }: LoginInput) => {
    const csrfToken = await getCsrfToken();
    const body = new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: window.location.origin,
    });
    const response = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      credentials: 'include',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (response.status !== 302 && response.status !== 303 && response.ok === false) {
      throw new Error('E-mail ou senha inválidos.');
    }
    const session = await authClient.getSession();
    if (!session) throw new Error('Não foi possível confirmar a sessão.');
    return session;
  },

  logout: async () => {
    const csrfToken = await getCsrfToken();
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, callbackUrl: window.location.origin }),
    });
    if (response.status !== 302 && response.status !== 303 && !response.ok) {
      throw new Error('Não foi possível encerrar a sessão.');
    }
    return { success: true as const };
  },
};
