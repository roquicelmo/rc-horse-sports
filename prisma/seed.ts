import { PrismaClient, EventStatus } from '@prisma/client';
import { INITIAL_COMPETITORS } from '../src/data/referenceAthletes.js';
import { REFERENCE_EVENTS } from '../src/data/referenceEvents.js';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'henrique@adsolucoes.space';
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

if (!adminPassword) {
  throw new Error('Defina SEED_ADMIN_PASSWORD antes de executar o seed.');
}
const seedPassword = adminPassword;

const parseCity = (value?: string) => {
  const [city, state = 'GO'] = (value ?? '').split(' - ');
  return { city: city.trim() || 'Não informada', state: state.trim().slice(0, 2).toUpperCase() };
};

const parseEventDate = (value: string) => {
  const [day, month, year] = value.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
};

const eventStatus: Record<string, EventStatus> = {
  SORTEADA: 'DRAWN',
  FINALIZADA: 'FINISHED',
};

async function seed() {
  const passwordHash = await hash(seedPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Henrique Lagoa', passwordHash, role: 'ADMIN', active: true },
    create: { email: adminEmail, name: 'Henrique Lagoa', passwordHash, role: 'ADMIN' },
  });

  for (const competitor of INITIAL_COMPETITORS) {
    const city = parseCity(competitor.cidade);
    await prisma.athlete.upsert({
      where: { registrationNo: competitor.registrationNo ?? `ref-${competitor.id}` },
      update: {
        name: competitor.nome,
        city: city.city,
        state: city.state,
        headHandicap: competitor.headHandicap ?? competitor.handicap,
        heelHandicap: competitor.heelHandicap ?? competitor.handicap,
        active: true,
      },
      create: {
        registrationNo: competitor.registrationNo ?? `ref-${competitor.id}`,
        name: competitor.nome,
        city: city.city,
        state: city.state,
        headHandicap: competitor.headHandicap ?? competitor.handicap,
        heelHandicap: competitor.heelHandicap ?? competitor.handicap,
      },
    });
  }

  for (const referenceEvent of REFERENCE_EVENTS) {
    const arenaName = referenceEvent.arena.replace(/-GO$/i, '').trim();
    const arenaCity = parseCity(referenceEvent.arena.replace(/-/g, ' - '));
    const arena = await prisma.arena.findFirst({
      where: { name: arenaName, city: arenaCity.city, state: arenaCity.state },
    }) ?? await prisma.arena.create({
      data: { name: arenaName, city: arenaCity.city, state: arenaCity.state },
    });

    const existing = await prisma.event.findFirst({ where: { name: referenceEvent.name } });
    const data = {
      name: referenceEvent.name,
      eventDate: parseEventDate(referenceEvent.date),
      status: eventStatus[referenceEvent.status] ?? 'DRAFT' as EventStatus,
      arenaId: arena.id,
      createdById: admin.id,
    };

    if (existing) await prisma.event.update({ where: { id: existing.id }, data });
    else await prisma.event.create({ data });
  }
}

seed()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
