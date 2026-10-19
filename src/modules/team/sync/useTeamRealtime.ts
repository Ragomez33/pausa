import { useEffect, useState } from 'react';

import { getSupabaseClient, isSupabaseConfigured } from '@/services/supabase';

import type { SharedEvent } from './mergeRemoteEvents';

export type TeamRealtimeStatus = 'disabled' | 'connecting' | 'connected' | 'error';

interface RawSharedEvent {
  id?: string;
  team_id?: string;
  user_name?: string;
  event_type?: string;
  timestamp?: string;
}

function parseSharedEvent(row: RawSharedEvent): SharedEvent | null {
  if (
    typeof row.id !== 'string' ||
    typeof row.team_id !== 'string' ||
    typeof row.user_name !== 'string' ||
    (row.event_type !== 'posponed' && row.event_type !== 'smoked') ||
    typeof row.timestamp !== 'string'
  ) {
    return null;
  }

  return {
    id: row.id,
    teamId: row.team_id,
    userName: row.user_name,
    eventType: row.event_type,
    timestamp: row.timestamp,
  };
}

export interface UseTeamRealtimeResult {
  events: SharedEvent[];
  status: TeamRealtimeStatus;
}

export function useTeamRealtime(teamId: string | null): UseTeamRealtimeResult {
  const [events, setEvents] = useState<SharedEvent[]>([]);
  const [status, setStatus] = useState<TeamRealtimeStatus>('disabled');

  useEffect(() => {
    setEvents([]);

    const client = getSupabaseClient();
    if (teamId === null || client === null || !isSupabaseConfigured()) {
      setStatus('disabled');
      return undefined;
    }

    setStatus('connecting');
    const channel = client
      .channel(`team:${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shared_events',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const event = parseSharedEvent(payload.new as RawSharedEvent);
          if (event === null) {
            return;
          }
          setEvents((previous) =>
            previous.some((entry) => entry.id === event.id) ? previous : [...previous, event],
          );
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === 'SUBSCRIBED') {
          setStatus('connected');
          return;
        }
        if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
          setStatus('error');
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [teamId]);

  return { events, status };
}
