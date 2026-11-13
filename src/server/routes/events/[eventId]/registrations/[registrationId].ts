import { getAuthenticatedUser } from '../../../../auth';
import { prisma } from '../../../../prisma';

interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

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
    return res.status(403).json({ message: 'Seu perfil não pode gerenciar inscrições.' });
  }
  if (req.method !== 'DELETE') return res.status(405).json({ message: 'Método não permitido.' });

  const eventId = typeof req.query?.eventId === 'string' ? req.query.eventId : '';
  const registrationId = typeof req.query?.registrationId === 'string' ? req.query.registrationId : '';
  if (!eventId || !registrationId) {
    return res.status(400).json({ message: 'Identificadores da prova e da inscrição são obrigatórios.' });
  }
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { createdById: true } });
  if (!event || (user.role === 'USER' && event.createdById !== user.id)) return res.status(404).json({ message: 'Prova não encontrada.' });

  const registration = await prisma.eventRegistration.findFirst({
    where: { id: registrationId, eventId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!registration) return res.status(404).json({ message: 'Inscrição ativa não encontrada.' });

  await prisma.eventRegistration.update({
    where: { id: registration.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  return res.status(204).json(null);
}
