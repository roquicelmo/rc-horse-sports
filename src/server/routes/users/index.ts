import { z } from 'zod';
import { hash } from 'bcryptjs';
import { getAuthenticatedUser } from '../../auth';
import { prisma } from '../../prisma';
import { canEditUsers, canManageUsers } from '../../permissions';

interface VercelRequest { method?: string; headers: Record<string, string | string[] | undefined>; body?: unknown }
interface VercelResponse { status: (code: number) => VercelResponse; json: (body: unknown) => void }

const userInput = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']),
  provisional: z.boolean().default(false),
  accessExpiresAt: z.string().datetime().nullable().optional(),
});

const toHeaders = (input: VercelRequest['headers']) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(input)) {
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(', '));
  }
  return headers;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(toHeaders(req.headers));
  if (!user || !canManageUsers(user.role)) return res.status(403).json({ message: 'Você não tem permissão para gerenciar usuários.' });

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, provisional: true, accessExpiresAt: true, lastLoginAt: true, createdAt: true, managedById: true },
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return res.status(200).json(users);
  }

  if (req.method !== 'POST' || !canEditUsers(user.role)) {
    return res.status(403).json({ message: 'Somente administradores podem criar usuários.' });
  }
  const parsed = userInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Dados do usuário inválidos.', issues: parsed.error.flatten() });

  try {
    const created = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password, 12),
        role: parsed.data.role,
        provisional: parsed.data.provisional,
        accessExpiresAt: parsed.data.accessExpiresAt ? new Date(parsed.data.accessExpiresAt) : null,
        managedById: user.id,
      },
      select: { id: true, name: true, email: true, role: true, active: true, provisional: true, accessExpiresAt: true, lastLoginAt: true, createdAt: true, managedById: true },
    });
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return res.status(409).json({ message: 'Já existe um usuário com este e-mail.' });
    }
    throw error;
  }
}
