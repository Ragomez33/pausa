import { z } from 'zod';

import type { ProfileFormValues } from '@/shared/types/global';

export const onboardingSchema: z.ZodType<ProfileFormValues> = z.object({
  dailyCigarettes: z
    .string()
    .trim()
    .min(1, 'Indica cuántos cigarrillos fumas al día')
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) > 0,
      'Debe ser un número entero mayor a 0',
    ),
  packCost: z
    .string()
    .trim()
    .min(1, 'Indica el costo de la cajetilla')
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) >= 0,
      'Debe ser un número mayor o igual a 0',
    ),
  currency: z.string().trim().min(1, 'Selecciona una moneda'),
  quitGoal: z.string().trim().max(280, 'Máximo 280 caracteres'),
});

export type OnboardingFormValues = ProfileFormValues;
