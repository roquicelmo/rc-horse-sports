import { z } from 'zod';
import { hash } from 'bcryptjs';
import { getAuthenticatedUser } from '../../auth';
import { prisma } from '../../prisma';
import { canEditUsers, canManageUsers } from '../../permissions';

interface VercelRequest { method?: string; query?: Record<string, string | string[] | undefined>; headers: Record<string, string | string[] | undefined>; body?: unknown }
interface VercelResponse { status: (code: number) => VercelResponse; json: (body: unknown) => void }

const adminInput = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  provisional: z.boolean().optional(),
  accessExpiresAt: z.string().datetime().nullable().optional(),
  active: z.boolean().optional(),
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
  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ message: 'Identificador do usuário é obrigatório.' });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, provisional: true } });
  if (!target) return res.status(404).json({ message: 'Usuário não encontrado.' });

  if (req.method === 'PATCH') {
    const parsed = adminInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Dados do usuário inválidos.', issues: parsed.error.flatten() });
    if (!canEditUsers(user.role)) {
      const onlyActivation = Object.keys(parsed.data).every((key) => key === 'active');
      if (!target.provisional || !onlyActivation) return res.status(403).json({ message: 'Managers só podem habilitar usuários provisórios.' });
    }
    const data = parsed.data;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name === undefined ? {} : { name: data.name }),
        ...(data.email === undefined ? {} : { email: data.email }),
        ...(data.password === undefined ? {} : { passwordHash: await hash(data.password, 12) }),
        ...(data.role === undefined ? {} : { role: data.role }),
        ...(data.provisional === undefined ? {} : { provisional: data.provisional }),
        ...(data.active === undefined ? {} : { active: data.active }),
        ...(data.accessExpiresAt === undefined ? {} : { accessExpiresAt: data.accessExpiresAt ? new Date(data.accessExpiresAt) : null }),
      },
      select: { id: true, name: true, email: true, role: true, active: true, provisional: true, accessExpiresAt: true, lastLoginAt: true, createdAt: true, managedById: true },
    });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    if (!canEditUsers(user.role)) return res.status(403).json({ message: 'Somente administradores podem excluir usuários.' });
    if (id === user.id) return res.status(422).json({ message: 'Não é possível excluir o próprio usuário.' });
    await prisma.user.update({ where: { id }, data: { active: false } });
    return res.status(204).json(null);
  }
  return res.status(405).json({ message: 'Método não permitido.' });
}
