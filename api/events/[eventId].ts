import { z } from 'zod';
import { getAuthenticatedUser } from '../../src/server/auth.js';
import { prisma } from '../../src/server/prisma.js';

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

const eventUpdate = z.object({
  name: z.string().trim().min(3).max(160).optional(),
  eventDate: z.string().datetime().optional(),
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
  if (!['ADMIN', 'ORGANIZER'].includes(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode alterar provas.' });
  }

  const eventId = typeof req.query?.eventId === 'string' ? req.query.eventId : '';
  if (!eventId) return res.status(400).json({ message: 'Identificador da prova é obrigatório.' });

  if (req.method === 'DELETE') {
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) return res.status(404).json({ message: 'Prova não encontrada.' });
    await prisma.event.update({ where: { id: eventId }, data: { status: 'CANCELLED' } });
    return res.status(204).json(null);
  }

  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Método não permitido.' });
  const parsed = eventUpdate.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados da prova inválidos.', issues: parsed.error.flatten() });
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.eventDate ? { eventDate: new Date(parsed.data.eventDate) } : {}),
    },
    include: {
      arena: { select: { name: true, city: true, state: true } },
      createdBy: { select: { name: true } },
      _count: { select: { registrations: true, draws: true } },
    },
  });
  return res.status(200).json(event);
}
