import { z } from 'zod';
import { getAuthenticatedUser } from '../../auth';
import { prisma } from '../../prisma';

interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const arenaInput = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  state: z.string().trim().length(2).toUpperCase().optional(),
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
  if (!user) return res.status(401).json({ message: 'É necessário estar autenticado.' });
  if (!['ADMIN', 'MANAGER', 'ORGANIZER', 'USER'].includes(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode alterar arenas.' });
  }

  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ message: 'Identificador da arena é obrigatório.' });
  const target = await prisma.arena.findUnique({ where: { id }, select: { ownerId: true } });
  if (!target || (user.role === 'USER' && target.ownerId !== user.id)) return res.status(404).json({ message: 'Arena não encontrada.' });

  if (req.method === 'DELETE') {
    await prisma.arena.update({ where: { id }, data: { active: false } });
    return res.status(204).json(null);
  }
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Método não permitido.' });

  const parsed = arenaInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados da arena inválidos.', issues: parsed.error.flatten() });
  }
  const arena = await prisma.arena.update({ where: { id }, data: parsed.data });
  return res.status(200).json(arena);
}
