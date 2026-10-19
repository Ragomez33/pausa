import { z } from 'zod';

function positiveIntegerString(message: string): z.ZodString {
  return z
    .string()
    .trim()
    .min(1, message)
    .refine((value) => {
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed > 0;
    }, message);
}

export const purchaseSchema = z.object({
  packs: positiveIntegerString('Indica una cantidad entera mayor a 0'),
  cost: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || (Number.isFinite(Number(value)) && Number(value) >= 0),
      'El costo debe ser un número mayor o igual a 0',
    ),
});

export const consumptionSchema = z.object({
  cigarettes: positiveIntegerString('Indica una cantidad entera mayor a 0'),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
export type ConsumptionFormValues = z.infer<typeof consumptionSchema>;
