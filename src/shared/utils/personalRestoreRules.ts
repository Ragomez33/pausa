export function shouldApplyRemoteProfile(
  localUpdatedAt: string | null,
  remoteUpdatedAt: string,
): boolean {
  if (localUpdatedAt === null) {
    return true;
  }
  const local = Date.parse(localUpdatedAt);
  const remote = Date.parse(remoteUpdatedAt);
  if (!Number.isFinite(remote)) {
    return false;
  }
  if (!Number.isFinite(local)) {
    return true;
  }
  return remote > local;
}
