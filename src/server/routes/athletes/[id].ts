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

const athleteUpdate = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  nickname: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().email().nullable().optional(),
  city: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().length(2).toUpperCase().nullable().optional(),
  headHandicap: z.number().min(0).max(10).optional(),
  heelHandicap: z.number().min(0).max(10).optional(),
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
    return res.status(403).json({ message: 'Seu perfil não pode gerenciar atletas.' });
  }

  const id = typeof req.query?.id === 'string' ? req.query.id : '';
  if (!id) return res.status(400).json({ message: 'Identificador do atleta é obrigatório.' });
  const target = await prisma.athlete.findUnique({ where: { id }, select: { ownerId: true } });
  if (!target || (user.role === 'USER' && target.ownerId !== user.id)) return res.status(404).json({ message: 'Atleta não encontrado.' });

  if (req.method === 'DELETE') {
    await prisma.athlete.update({ where: { id }, data: { active: false } });
    return res.status(204).json(null);
  }

  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Método não permitido.' });

  const parsed = athleteUpdate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados do atleta inválidos.', issues: parsed.error.flatten() });
  }

  const athlete = await prisma.athlete.update({ where: { id }, data: parsed.data });
  return res.status(200).json(athlete);
}
