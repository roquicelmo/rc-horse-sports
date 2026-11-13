import { z } from 'zod';
import { getAuthenticatedUser } from '../../../auth';
import { prisma } from '../../../prisma';

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

const timeInput = z.object({
  bullNumber: z.number().int().min(1).max(3),
  timeSeconds: z.number().finite().min(0).max(999.99).nullable().optional(),
  isNt: z.boolean().default(false),
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
  if (!['ADMIN', 'MANAGER', 'ORGANIZER'].includes(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode registrar tempos.' });
  }
  if (req.method !== 'PATCH') return res.status(405).json({ message: 'Método não permitido.' });

  const runId = typeof req.query?.runId === 'string' ? req.query.runId : '';
  const parsed = timeInput.safeParse(req.body);
  if (!runId || !parsed.success) {
    return res.status(400).json({ message: 'Dados do tempo inválidos.', issues: parsed.success ? undefined : parsed.error.flatten() });
  }

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: { times: true, draw: { select: { event: { select: { createdById: true } } } } },
  });
  if (!run) return res.status(404).json({ message: 'Corrida não encontrada.' });
  if (user.role === 'USER' && run.draw.event.createdById !== user.id) return res.status(404).json({ message: 'Corrida não encontrada.' });
  if (parsed.data.bullNumber > run.numberOfBulls) {
    return res.status(422).json({ message: 'Este boi não faz parte da corrida.' });
  }

  if (parsed.data.timeSeconds === null || parsed.data.timeSeconds === undefined) {
    await prisma.runTime.deleteMany({ where: { runId, bullNumber: parsed.data.bullNumber } });
  } else {
    await prisma.runTime.upsert({
        where: { runId_bullNumber: { runId, bullNumber: parsed.data.bullNumber } },
        create: {
          runId,
          bullNumber: parsed.data.bullNumber,
          timeSeconds: parsed.data.timeSeconds,
          isNt: parsed.data.isNt,
          recordedById: user.id,
        },
        update: {
          timeSeconds: parsed.data.timeSeconds,
          isNt: parsed.data.isNt,
          recordedById: user.id,
          recordedAt: new Date(),
        },
      });
  }

  const times = await prisma.runTime.findMany({ where: { runId }, orderBy: { bullNumber: 'asc' } });
  const hasNt = times.some((item) => item.isNt);
  const hasAllTimes = Array.from({ length: run.numberOfBulls }, (_, index) => index + 1)
    .every((bullNumber) => times.some((item) => item.bullNumber === bullNumber && item.timeSeconds !== null && !item.isNt));
  const totalTime = !hasNt && hasAllTimes
    ? Number(times.reduce((sum, item) => sum + Number(item.timeSeconds ?? 0), 0).toFixed(2))
    : null;
  const averageTime = totalTime === null ? null : Number((totalTime / run.numberOfBulls).toFixed(2));

  const updatedRun = await prisma.run.update({
    where: { id: runId },
    data: {
      totalTime,
      averageTime,
      isNt: hasNt,
      status: hasNt ? 'ELIMINATED' : totalTime === null ? 'IN_PROGRESS' : 'COMPLETED',
    },
    include: { times: { orderBy: { bullNumber: 'asc' } } },
  });

  return res.status(200).json(updatedRun);
}
