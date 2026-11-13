import { getAuthenticatedUser } from '../../auth';
import { prisma } from '../../prisma';

interface VercelRequest { method?: string; query?: Record<string, string | string[] | undefined>; headers: Record<string, string | string[] | undefined> }
interface VercelResponse { status: (code: number) => VercelResponse; json: (body: unknown) => void }

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
  if (!['ADMIN', 'MANAGER', 'ORGANIZER', 'USER'].includes(user.role)) return res.status(403).json({ message: 'Seu perfil não pode acessar relatórios.' });
  if (req.method !== 'GET') return res.status(405).json({ message: 'Método não permitido.' });

  const ownerId = typeof req.query?.ownerId === 'string' ? req.query.ownerId : undefined;
  const status = typeof req.query?.status === 'string' ? req.query.status : undefined;
  const from = typeof req.query?.from === 'string' ? new Date(`${req.query.from}T00:00:00.000Z`) : undefined;
  const to = typeof req.query?.to === 'string' ? new Date(`${req.query.to}T23:59:59.999Z`) : undefined;
  const scopedOwner = user.role === 'USER' ? user.id : ownerId;
  const eventWhere = {
    ...(scopedOwner ? { createdById: scopedOwner } : {}),
    ...(status ? { status: status as never } : {}),
    ...((from || to) ? { eventDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };
  const athleteWhere = scopedOwner ? { ownerId: scopedOwner, active: true } : { active: true };
  const arenaWhere = scopedOwner ? { ownerId: scopedOwner, active: true } : { active: true };

  const [events, athletes, arenas, draws, runs, recentEvents] = await prisma.$transaction([
    prisma.event.count({ where: eventWhere }),
    prisma.athlete.count({ where: athleteWhere }),
    prisma.arena.count({ where: arenaWhere }),
    prisma.draw.count({ where: { event: eventWhere } }),
    prisma.run.count({ where: { draw: { event: eventWhere } } }),
    prisma.event.findMany({
      where: eventWhere,
      select: { id: true, name: true, eventDate: true, status: true, createdBy: { select: { id: true, name: true, email: true } }, _count: { select: { registrations: true, draws: true } } },
      orderBy: { eventDate: 'desc' },
      take: 10,
    }),
  ]);
  return res.status(200).json({ totals: { events, athletes, arenas, draws, runs }, recentEvents });
}
