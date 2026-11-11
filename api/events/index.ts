import { getAuthenticatedUser } from '../../src/server/auth.js';
import { prisma } from '../../src/server/prisma.js';
import { z } from 'zod';

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const eventInput = z.object({
  name: z.string().trim().min(3).max(160),
  eventDate: z.string().datetime(),
  arenaId: z.string().trim().min(1).optional(),
  arenaName: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().length(2).toUpperCase(),
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
  if (!['ADMIN', 'ORGANIZER', 'TRACK_OPERATOR', 'ANNOUNCER', 'JUDGE', 'VIEWER'].includes(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode consultar provas.' });
  }
  if (req.method === 'POST') {
    if (!['ADMIN', 'ORGANIZER'].includes(user.role)) {
      return res.status(403).json({ message: 'Seu perfil não pode criar provas.' });
    }
    const parsed = eventInput.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Dados da prova inválidos.', issues: parsed.error.flatten() });
    }

    const arena = parsed.data.arenaId
      ? await prisma.arena.findFirst({ where: { id: parsed.data.arenaId, active: true } })
      : await prisma.arena.create({
          data: {
            name: parsed.data.arenaName,
            city: parsed.data.city,
            state: parsed.data.state,
          },
        });
    if (!arena) return res.status(404).json({ message: 'Arena não encontrada ou inativa.' });
    const event = await prisma.event.create({
      data: {
        name: parsed.data.name,
        eventDate: new Date(parsed.data.eventDate),
        arenaId: arena.id,
        createdById: user.id,
        status: 'DRAFT',
      },
      include: {
        arena: { select: { id: true, name: true, city: true, state: true } },
        createdBy: { select: { name: true } },
        _count: { select: { registrations: true, draws: true } },
      },
    });
    return res.status(201).json(event);
  }

  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido.' });

  const events = await prisma.event.findMany({
    include: {
      arena: { select: { id: true, name: true, city: true, state: true } },
      createdBy: { select: { name: true } },
      _count: { select: { registrations: true, draws: true } },
    },
    orderBy: { eventDate: 'desc' },
  });

  return res.status(200).json(events);
}
