import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { getProfile, listInventoryLogs } from '@/db/queries';
import { activeSmokingSession, inventoryLogs, smokingEvents } from '@/db/schema';
import { computeInventorySummary } from '@/shared/utils/inventory';
import type { SmokingTrigger } from '@/shared/constants/smoking';

import { buildSmokingEvent } from './session';

export interface CompleteSessionInput {
  sessionId?: string;
  triggerEmotion: SmokingTrigger;
  durationSeconds: number;
  nowMs: number;
}

export interface CompleteSessionResult {
  inventoryDecremented: boolean;
  error: Error | null;
}

export function completeSmokingSession(
  input: CompleteSessionInput,
): CompleteSessionResult {
  try {
    const profile = getProfile();
    const logs = listInventoryLogs();
    const summary = computeInventorySummary(logs, profile?.dailyCigarettes ?? 0);
    const inventoryDecremented = summary.stock > 0;
    const payload = buildSmokingEvent({
      nowMs: input.nowMs,
      triggerEmotion: input.triggerEmotion,
      durationSeconds: input.durationSeconds,
      inventoryDecremented,
    });

    db.transaction((transaction) => {
      transaction.insert(smokingEvents).values(payload).run();
      if (inventoryDecremented) {
        transaction
          .insert(inventoryLogs)
          .values({
            timestamp: payload.timestamp,
            actionType: 'consumption',
            quantity: 1,
            cost: null,
          })
          .run();
      }
      if (input.sessionId !== undefined) {
        transaction
          .delete(activeSmokingSession)
          .where(eq(activeSmokingSession.id, input.sessionId))
          .run();
      } else {
        transaction.delete(activeSmokingSession).run();
      }
    });

    return { inventoryDecremented, error: null };
  } catch (caught) {
    return {
      inventoryDecremented: false,
      error: caught instanceof Error ? caught : new Error('No se pudo registrar la sesión.'),
    };
  }
}
