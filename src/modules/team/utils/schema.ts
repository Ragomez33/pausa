import { z } from 'zod';

import { DIFFICULTY_OPTIONS, type DifficultyLevel } from './difficulty';
import { isValidInviteCode, normalizeInviteCode } from './inviteCodes';

const difficultyValues = DIFFICULTY_OPTIONS.map((option) => option.value) as [
  DifficultyLevel,
  ...DifficultyLevel[],
];

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(40, 'El nombre no puede superar 40 caracteres'),
  durationDays: z
    .string()
    .trim()
    .min(1, 'Selecciona una duración')
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      'La duración debe ser un número entero de días',
    ),
  difficultyLevel: z.enum(difficultyValues, {
    message: 'Selecciona un nivel',
  }),
});

export const joinTeamSchema = z.object({
  inviteCode: z
    .string()
    .transform(normalizeInviteCode)
    .refine(isValidInviteCode, 'El código no es válido'),
});

export type CreateTeamValues = z.infer<typeof createTeamSchema>;
export type JoinTeamValues = z.infer<typeof joinTeamSchema>;
