import { Auth, type AuthConfig } from '@auth/core';
import Credentials from '@auth/core/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

export const authConfig: AuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.active || !user.passwordHash) return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const accountUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = accountUser?.role ?? 'VIEWER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const sessionUser = session.user as typeof session.user & { id: string; role: string };
        sessionUser.id = token.sub;
        sessionUser.role = typeof token.role === 'string' ? token.role : 'VIEWER';
      }
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: (globalThis as typeof globalThis & { process?: { env?: { AUTH_SECRET?: string } } }).process?.env
    ?.AUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
};

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  role: string;
}

export const getAuthenticatedUser = async (headers: Headers): Promise<AuthenticatedUser | null> => {
  const request = new Request('https://localhost/api/auth/session', { headers });
  const response = await Auth(request, authConfig);
  if (!response.ok) return null;

  const session = (await response.json()) as {
    user?: { id?: string; email?: string | null; role?: string };
  };
  if (!session.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role ?? 'VIEWER',
  };
};
