import { z } from 'zod';
import { getAuthenticatedUser } from '../../auth';
import { prisma } from '../../prisma';

interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const athleteInput = z.object({
  name: z.string().trim().min(2).max(120),
  nickname: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().email().optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().length(2).toUpperCase().optional(),
  headHandicap: z.number().min(0).max(10),
  heelHandicap: z.number().min(0).max(10),
});

const toHeaders = (input: VercelRequest['headers']) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(input)) {
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(', '));
  }
  return headers;
};

const canManageAthletes = (role: string) => ['ADMIN', 'MANAGER', 'ORGANIZER', 'USER'].includes(role);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(toHeaders(req.headers));
  if (!user) return res.status(401).json({ message: 'É necessário estar autenticado.' });
  if (!canManageAthletes(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode gerenciar atletas.' });
  }

  if (req.method === 'GET') {
    const ownerId = typeof req.query?.ownerId === 'string' ? req.query.ownerId : undefined;
    const athletes = await prisma.athlete.findMany({
      where: { active: true, ...(user.role === 'USER' ? { ownerId: user.id } : ownerId ? { ownerId } : {}) },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(athletes);
  }

  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido.' });

  const parsed = athleteInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados do atleta inválidos.', issues: parsed.error.flatten() });
  }

  const requestedOwnerId = typeof (req.body as { ownerId?: unknown })?.ownerId === 'string'
    ? (req.body as { ownerId: string }).ownerId
    : undefined;
  const athlete = await prisma.athlete.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      nickname: parsed.data.nickname || null,
      phone: parsed.data.phone || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      ownerId: user.role === 'USER' ? user.id : requestedOwnerId ?? user.id,
    },
  });
  return res.status(201).json(athlete);
}
