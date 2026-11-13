import { z } from 'zod';
import { hash } from 'bcryptjs';
import { prisma } from '../../prisma';
import { getAuthenticatedUser } from '../../auth';

const requestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  email: z.string().trim().toLowerCase().email().max(160),
  recaptchaToken: z.string().min(1),
});

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
}

const verifyRecaptcha = async (token: string, remoteIp?: string) => {
  const runtime = globalThis as typeof globalThis & { process?: { env?: { RECAPTCHA_SECRET_KEY?: string } } };
  const secret = runtime.process?.env?.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('RECAPTCHA_SECRET_KEY não configurada.');

  const params = new URLSearchParams({ secret, response: token });
  if (remoteIp) params.set('remoteip', remoteIp);
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!response.ok) throw new Error('Não foi possível validar o reCAPTCHA.');
  const result = await response.json() as { success?: boolean };
  return result.success === true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers ?? {})) {
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(', '));
  }

  if (req.method === 'GET' || req.method === 'PATCH') {
    const actor = await getAuthenticatedUser(headers);
    if (!actor || !['ADMIN', 'MANAGER', 'ORGANIZER'].includes(actor.role)) {
      res.status(403).json({ message: 'Apenas Admin e Manager podem revisar solicitações.' });
      return;
    }

    if (req.method === 'GET') {
      const requests = await prisma.accessRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, phone: true, email: true, status: true, createdAt: true },
      });
      res.status(200).json(requests);
      return;
    }

    const body = req.body as { id?: unknown; status?: unknown; password?: unknown };
    const id = typeof body.id === 'string' ? body.id : '';
    const status = body.status === 'APPROVED' || body.status === 'REJECTED' ? body.status : null;
    if (!id || !status) {
      res.status(400).json({ message: 'Solicitação e decisão são obrigatórias.' });
      return;
    }

    const accessRequest = await prisma.accessRequest.findUnique({ where: { id } });
    if (!accessRequest || accessRequest.status !== 'PENDING') {
      res.status(404).json({ message: 'Solicitação pendente não encontrada.' });
      return;
    }

    if (status === 'APPROVED') {
      if (typeof body.password !== 'string' || body.password.length < 8) {
        res.status(400).json({ message: 'Informe uma senha inicial com pelo menos 8 caracteres.' });
        return;
      }
      const existingUser = await prisma.user.findUnique({ where: { email: accessRequest.email } });
      if (existingUser) {
        res.status(409).json({ message: 'Já existe um usuário com este e-mail.' });
        return;
      }
      await prisma.$transaction([
        prisma.user.create({
          data: {
            name: accessRequest.name,
            email: accessRequest.email,
            passwordHash: await hash(body.password, 12),
            role: 'USER',
            provisional: true,
            active: false,
            managedById: actor.id,
          },
        }),
        prisma.accessRequest.update({
          where: { id },
          data: { status, reviewedById: actor.id, reviewedAt: new Date() },
        }),
      ]);
    } else {
      await prisma.accessRequest.update({
        where: { id },
        data: { status, reviewedById: actor.id, reviewedAt: new Date() },
      });
    }

    res.status(200).json({ success: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Método não permitido.' });
    return;
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Informe nome, telefone, e-mail e complete o reCAPTCHA.' });
    return;
  }

  try {
    const validCaptcha = await verifyRecaptcha(parsed.data.recaptchaToken);
    if (!validCaptcha) {
      res.status(400).json({ message: 'A validação do reCAPTCHA não foi concluída.' });
      return;
    }

    const existing = await prisma.accessRequest.findFirst({
      where: { email: parsed.data.email, status: 'PENDING' },
      select: { id: true },
    });
    if (existing) {
      res.status(409).json({ message: 'Já existe uma solicitação pendente para este e-mail.' });
      return;
    }

    const accessRequest = await prisma.accessRequest.create({
      data: { name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    });
    res.status(201).json(accessRequest);
  } catch (error) {
    console.error('access_request_failed', error);
    res.status(500).json({ message: 'Não foi possível registrar a solicitação agora.' });
  }
}
