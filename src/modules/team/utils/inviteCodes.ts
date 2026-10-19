const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateInviteCode(length = 6): string {
  let code = '';
  for (let index = 0; index < length; index += 1) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidInviteCode(input: string): boolean {
  return /^[A-Z0-9]{4,12}$/.test(normalizeInviteCode(input));
}
