import { generateLocalId } from '../utils/ids';

export type TeamSharedEventType = 'posponed' | 'smoked';

export interface TeamSharedEventPayload {
  id: string;
  teamId: string;
  userName: string;
  eventType: TeamSharedEventType;
  timestamp: string;
  createdAt: string;
}

export function buildTeamSharedEvent(
  eventType: TeamSharedEventType,
  teamId: string,
  userName: string,
  nowMs: number,
): TeamSharedEventPayload {
  const timestamp = new Date(nowMs).toISOString();

  return {
    id: generateLocalId('event'),
    teamId,
    userName,
    eventType,
    timestamp,
    createdAt: timestamp,
  };
}
