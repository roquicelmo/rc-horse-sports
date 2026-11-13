import type { NextApiRequest, NextApiResponse } from 'next';
import arenas from './routes/arenas/index';
import arenaById from './routes/arenas/[id]';
import athletes from './routes/athletes/index';
import athleteById from './routes/athletes/[id]';
import accessRequests from './routes/access-requests/index';
import events from './routes/events/index';
import eventById from './routes/events/[eventId]';
import registrations from './routes/events/[eventId]/registrations/index';
import registrationById from './routes/events/[eventId]/registrations/[registrationId]';
import draws from './routes/events/[eventId]/draws/index';
import publishResults from './routes/events/[eventId]/results/publish';
import reports from './routes/reports/overview';
import runTimes from './routes/runs/[runId]/times';
import users from './routes/users/index';
import userById from './routes/users/[id]';

type RouteRequest = NextApiRequest & {
  query: NextApiRequest['query'] & { route?: string };
};
type RouteHandler = (req: RouteRequest, res: NextApiResponse) => unknown;

const handlers: Record<string, RouteHandler> = {
  arenas,
  'arenas-id': arenaById,
  athletes,
  'athletes-id': athleteById,
  'access-requests': accessRequests,
  events,
  'events-id': eventById,
  registrations,
  'registration-id': registrationById,
  draws,
  'publish-results': publishResults,
  reports,
  'run-times': runTimes,
  users,
  'users-id': userById,
};

const routeForPath = (path: string[]) => {
  if (path[0] === 'access-requests') return { route: 'access-requests' };
  if (path[0] === 'reports' && path[1] === 'overview') return { route: 'reports' };
  if (path[0] === 'runs' && path[2] === 'times') return { route: 'run-times', runId: path[1] };
  if (path[0] === 'users') return path[1] ? { route: 'users-id', id: path[1] } : { route: 'users' };
  if (path[0] === 'athletes') return path[1] ? { route: 'athletes-id', id: path[1] } : { route: 'athletes' };
  if (path[0] === 'arenas') return path[1] ? { route: 'arenas-id', id: path[1] } : { route: 'arenas' };
  if (path[0] !== 'events') return null;
  if (!path[1]) return { route: 'events' };
  if (path[2] === 'registrations') {
    return path[3]
      ? { route: 'registration-id', eventId: path[1], registrationId: path[3] }
      : { route: 'registrations', eventId: path[1] };
  }
  if (path[2] === 'draws') return { route: 'draws', eventId: path[1] };
  if (path[2] === 'results' && path[3] === 'publish') return { route: 'publish-results', eventId: path[1] };
  return { route: 'events-id', eventId: path[1] };
};

export default async function nextDataGateway(req: NextApiRequest, res: NextApiResponse) {
  const path = Array.isArray(req.query.path) ? req.query.path : [];
  const mapped = routeForPath(path);
  if (!mapped) {
    res.status(404).json({ message: 'Rota da API não encontrada.' });
    return;
  }

  const nextRequest = req as RouteRequest;
  nextRequest.query = { ...req.query, ...mapped };
  const routeHandler = handlers[mapped.route];
  if (!routeHandler) {
    res.status(404).json({ message: 'Rota da API não encontrada.' });
    return;
  }
  await routeHandler(nextRequest, res);
}
