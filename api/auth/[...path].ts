import { Auth } from '@auth/core';
import { authConfig } from '../../src/server/auth.js';

interface VercelRequest {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string | string[]) => VercelResponse;
  end: (body?: string) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const protocol = req.headers['x-forwarded-proto'];
  const host = req.headers.host;
  const forwardedProtocol = Array.isArray(protocol) ? protocol[0] : protocol;
  const forwardedHost = Array.isArray(host) ? host[0] : host;
  const url = new URL(req.url ?? '/api/auth/session', `${forwardedProtocol ?? 'https'}://${forwardedHost ?? 'localhost'}`);
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(name, value);
    if (Array.isArray(value)) headers.set(name, value.join(', '));
  }

  const body =
    req.method === 'POST' && req.body !== undefined
      ? typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body)
      : undefined;

  const request = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    body,
  });
  const response = await Auth(request, authConfig);

  res.status(response.status);
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}
