import type { NextApiRequest, NextApiResponse } from 'next';
import dataGateway from '../../src/server/next-data-gateway';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return dataGateway(req, res);
}
