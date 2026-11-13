import { Auth } from '@auth/core';
import type { NextApiRequest, NextApiResponse } from 'next';
import { authConfig } from './auth';

export default async function nextAuthHandler(req: NextApiRequest, res: NextApiResponse) {
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
        : req.body instanceof URLSearchParams
          ? req.body.toString()
          : Object.entries(req.body as Record<string, unknown>)
              .filter(([, value]) => value !== undefined && value !== null)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
              .join('&')
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
