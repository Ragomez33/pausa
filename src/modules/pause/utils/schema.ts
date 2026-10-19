import { z } from 'zod';

import { NOTES_MAX_LENGTH, TRIGGER_VALUES } from './constants';

export const pauseFormSchema = z.object({
  triggerEmotion: z.enum(TRIGGER_VALUES, {
    message: 'Selecciona un disparador',
  }),
  notes: z
    .string()
    .trim()
    .max(NOTES_MAX_LENGTH, `Máximo ${NOTES_MAX_LENGTH} caracteres`),
});

export type PauseFormValues = z.infer<typeof pauseFormSchema>;
