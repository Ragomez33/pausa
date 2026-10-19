import { DEFAULT_CURRENCY } from '@/shared/constants/app';
import type { ProfileFormValues } from '@/shared/types/global';

export const CURRENCY_OPTIONS: string[] = ['USD', 'EUR', 'MXN', 'COP', 'ARS', 'CLP'];

export const INITIAL_PROFILE_FORM: ProfileFormValues = {
  dailyCigarettes: '',
  packCost: '',
  currency: DEFAULT_CURRENCY,
  quitGoal: '',
};
