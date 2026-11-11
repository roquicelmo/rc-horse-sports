import { z } from 'zod';
import { getAuthenticatedUser } from '../../../../src/server/auth.js';
import { prisma } from '../../../../src/server/prisma.js';

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

const registrationInput = z.object({
  athleteId: z.string().trim().min(1),
  category: z.enum(['CABECEIRO', 'PEZEIRO']),
});

const toHeaders = (input: VercelRequest['headers']) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(input)) {
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(', '));
  }
  return headers;
};

const canManageRegistrations = (role: string) => role === 'ADMIN' || role === 'ORGANIZER';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(toHeaders(req.headers));
  if (!user) return res.status(401).json({ message: 'É necessário estar autenticado.' });
  if (!canManageRegistrations(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode gerenciar inscrições.' });
  }

  const eventId = typeof req.query?.eventId === 'string' ? req.query.eventId : '';
  if (!eventId) return res.status(400).json({ message: 'Identificador da prova é obrigatório.' });

  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return res.status(404).json({ message: 'Prova não encontrada.' });

  if (req.method === 'GET') {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId, status: 'ACTIVE' },
      include: {
        athlete: {
          select: {
            id: true,
            registrationNo: true,
            name: true,
            city: true,
            state: true,
            headHandicap: true,
            heelHandicap: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { athlete: { name: 'asc' } }],
    });
    return res.status(200).json(registrations);
  }

  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido.' });

  const parsed = registrationInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados da inscrição inválidos.', issues: parsed.error.flatten() });
  }

  const athlete = await prisma.athlete.findFirst({
    where: { id: parsed.data.athleteId, active: true },
    select: { id: true },
  });
  if (!athlete) return res.status(404).json({ message: 'Atleta não encontrado ou inativo.' });

  const existing = await prisma.eventRegistration.findUnique({
    where: { eventId_athleteId: { eventId, athleteId: parsed.data.athleteId } },
  });
  if (existing?.status === 'ACTIVE') {
    return res.status(409).json({ message: 'Este atleta já está inscrito nesta prova.' });
  }

  const registration = existing
    ? await prisma.eventRegistration.update({
        where: { id: existing.id },
        data: { category: parsed.data.category, status: 'ACTIVE', cancelledAt: null, registeredAt: new Date() },
        include: { athlete: true },
      })
    : await prisma.eventRegistration.create({
        data: { eventId, athleteId: parsed.data.athleteId, category: parsed.data.category },
        include: { athlete: true },
      });

  return res.status(201).json(registration);
}
