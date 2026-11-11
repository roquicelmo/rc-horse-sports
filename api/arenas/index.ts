import { z } from 'zod';
import { getAuthenticatedUser } from '../../src/server/auth.js';
import { prisma } from '../../src/server/prisma.js';

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const arenaInput = z.object({
  name: z.string().trim().min(2).max(120),
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

  if (req.method === 'GET') {
    const arenas = await prisma.arena.findMany({
      where: { active: true },
      orderBy: [{ name: 'asc' }, { city: 'asc' }],
    });
    return res.status(200).json(arenas);
  }

  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido.' });
  if (!['ADMIN', 'ORGANIZER'].includes(user.role)) {
    return res.status(403).json({ message: 'Seu perfil não pode gerenciar arenas.' });
  }

  const parsed = arenaInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados da arena inválidos.', issues: parsed.error.flatten() });
  }

  const existing = await prisma.arena.findFirst({
    where: { name: parsed.data.name, city: parsed.data.city, state: parsed.data.state, active: true },
  });
  if (existing) return res.status(200).json(existing);

  const arena = await prisma.arena.create({ data: parsed.data });
  return res.status(201).json(arena);
}
