import { z } from 'zod';
import { executeGroupCrossDraw } from '../../../../../utils/drawAlgorithm';
import type { Competitor, DrawConfig } from '../../../../../types/roping';
import { getAuthenticatedUser } from '../../../../auth';
import { prisma } from '../../../../prisma';

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

const drawConfig = z.object({
  numGroups: z.number().int().min(2).max(8),
  minGap: z.number().int().min(0).max(100),
  balanceGroups: z.boolean(),
  batteryMode: z.enum(['phases', 'major3', 'single', 'custom']).optional(),
  numBatteries: z.number().int().min(1).max(32).optional(),
});

const toHeaders = (input: VercelRequest['headers']) => {
  const headers = new Headers();
  for (const [name, value] of Object.entries(input)) {
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(', '));
  }
  return headers;
};

const canManageDraw = (role: string) => ['ADMIN', 'MANAGER', 'ORGANIZER', 'USER'].includes(role);

const toCompetitor = (athlete: {
  id: string;
  registrationNo: string | null;
  name: string;
  city: string | null;
  headHandicap: unknown;
  heelHandicap: unknown;
}, category: string | null): Competitor => {
  const headHandicap = Number(athlete.headHandicap);
  const heelHandicap = Number(athlete.heelHandicap);
  return {
    id: athlete.id,
    registrationNo: athlete.registrationNo ?? undefined,
    nome: athlete.name,
    cidade: athlete.city ?? undefined,
    handicap: category === 'PEZEIRO' ? heelHandicap : headHandicap,
    headHandicap,
    heelHandicap,
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getAuthenticatedUser(toHeaders(req.headers));
  if (!user) return res.status(401).json({ message: 'É necessário estar autenticado.' });

  const eventId = typeof req.query?.eventId === 'string' ? req.query.eventId : '';
  if (!eventId) return res.status(400).json({ message: 'Identificador da prova é obrigatório.' });
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, createdById: true } });
  if (!event || (user.role === 'USER' && event.createdById !== user.id)) return res.status(404).json({ message: 'Prova não encontrada.' });

  if (req.method === 'GET') {
    const draws = await prisma.draw.findMany({
      where: { eventId },
      include: {
        runs: {
          orderBy: { runNumber: 'asc' },
          include: {
            headAthlete: { select: { id: true, registrationNo: true, name: true, city: true, headHandicap: true, heelHandicap: true } },
            heelAthlete: { select: { id: true, registrationNo: true, name: true, city: true, headHandicap: true, heelHandicap: true } },
            times: { orderBy: { bullNumber: 'asc' } },
          },
        },
      },
      orderBy: { version: 'desc' },
    });
    return res.status(200).json(draws);
  }

  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido.' });
  if (!canManageDraw(user.role)) return res.status(403).json({ message: 'Seu perfil não pode gerar sorteios.' });

  const parsed = drawConfig.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Configuração do sorteio inválida.', issues: parsed.error.flatten() });
  }

  const registrations = await prisma.eventRegistration.findMany({
    where: { eventId, status: 'ACTIVE' },
    include: {
      athlete: {
        select: {
          id: true,
          registrationNo: true,
          name: true,
          city: true,
          headHandicap: true,
          heelHandicap: true,
        },
      },
    },
  });
  const cabeceiros = registrations
    .filter((registration) => registration.category === 'CABECEIRO')
    .map((registration) => toCompetitor(registration.athlete, registration.category));
  const pezeiros = registrations
    .filter((registration) => registration.category === 'PEZEIRO')
    .map((registration) => toCompetitor(registration.athlete, registration.category));

  if (!cabeceiros.length || !pezeiros.length) {
    return res.status(422).json({ message: 'A prova precisa de pelo menos um cabeceiro e um pezeiro ativo.' });
  }

  const config = parsed.data as DrawConfig;
  const { runs } = executeGroupCrossDraw(cabeceiros, pezeiros, config);
  if (!runs.length) return res.status(422).json({ message: 'Não foi possível gerar corridas válidas para estas inscrições.' });

  const latest = await prisma.draw.findFirst({ where: { eventId }, orderBy: { version: 'desc' }, select: { version: true } });
  const version = (latest?.version ?? 0) + 1;
  const draw = await prisma.draw.create({
    data: {
      eventId,
      version,
      status: 'GENERATED',
      configuration: parsed.data,
      generatedById: user.id,
      generatedAt: new Date(),
      runs: {
        create: runs.map((run) => ({
          runNumber: run.numero,
          phase: run.fase,
          round: run.rodada,
          battery: run.bateria,
          headAthleteId: run.cabeceiro.id,
          heelAthleteId: run.pezeiro.id,
          headGroup: run.cabeceiroGrupo,
          heelGroup: run.pezeiroGrupo,
          combinedHandicap: run.shc,
          numberOfBulls: run.bois,
        })),
      },
    },
    include: {
      runs: {
        orderBy: { runNumber: 'asc' },
        include: {
          headAthlete: { select: { id: true, registrationNo: true, name: true, city: true, headHandicap: true, heelHandicap: true } },
          heelAthlete: { select: { id: true, registrationNo: true, name: true, city: true, headHandicap: true, heelHandicap: true } },
          times: { orderBy: { bullNumber: 'asc' } },
        },
      },
    },
  });

  await prisma.event.update({ where: { id: eventId }, data: { status: 'DRAWN' } });
  return res.status(201).json(draw);
}
