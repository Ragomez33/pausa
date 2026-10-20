import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { getProfile, listInventoryLogs, getScopedOwnerUserId } from '@/db/queries';
import { activeSmokingSession, inventoryLogs, smokingEvents, type SmokingEvent } from '@/db/schema';
import { computeInventorySummary } from '@/shared/utils/inventory';
import { createSyncId } from '@/shared/utils/syncIds';
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
  event: SmokingEvent | null;
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
      syncId: createSyncId(),
      ownerUserId: getScopedOwnerUserId(),
      nowMs: input.nowMs,
      triggerEmotion: input.triggerEmotion,
      durationSeconds: input.durationSeconds,
      inventoryDecremented,
    });

    let createdEvent: SmokingEvent | null = null;

    db.transaction((transaction) => {
      createdEvent = transaction
        .insert(smokingEvents)
        .values(payload)
        .returning()
        .get();
      if (inventoryDecremented) {
        transaction
          .insert(inventoryLogs)
          .values({
            syncId: createSyncId(),
            ownerUserId: payload.ownerUserId,
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

    return { inventoryDecremented, event: createdEvent, error: null };
  } catch (caught) {
    return {
      inventoryDecremented: false,
      event: null,
      error: caught instanceof Error ? caught : new Error('No se pudo registrar la sesión.'),
    };
  }
}
