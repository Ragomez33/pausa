import * as Crypto from 'expo-crypto';

export function createSyncId(): string {
  return Crypto.randomUUID();
}

export function isValidSyncId(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
