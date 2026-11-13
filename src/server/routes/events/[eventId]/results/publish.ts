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
  if (!['ADMIN', 'MANAGER', 'ORGANIZER', 'USER'].includes(user.role)) return res.status(403).json({ message: 'Seu perfil não pode publicar resultados.' });
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido.' });

  const eventId = typeof req.query?.eventId === 'string' ? req.query.eventId : '';
  if (!eventId) return res.status(400).json({ message: 'Identificador da prova é obrigatório.' });

  const draw = await prisma.draw.findFirst({
    where: { eventId },
    orderBy: { version: 'desc' },
    include: { runs: { select: { status: true, totalTime: true, averageTime: true, isNt: true } } },
  });
  if (!draw || !draw.runs.length) return res.status(422).json({ message: 'Não há corridas para publicar.' });

  const incomplete = draw.runs.some((run) => run.status === 'PENDING' || run.status === 'IN_PROGRESS');
  if (incomplete) return res.status(422).json({ message: 'Finalize ou marque como NT todas as corridas antes de publicar.' });

  const [publishedDraw] = await prisma.$transaction([
    prisma.draw.update({ where: { id: draw.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } }),
    prisma.event.update({ where: { id: eventId }, data: { status: 'FINISHED' } }),
  ]);
  return res.status(200).json(publishedDraw);
}
