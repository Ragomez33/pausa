import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRouter, type Href } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { THEME_COLORS } from '@/shared/constants/theme';
import type { ProfileFormValues } from '@/shared/types/global';

import { useOnboardingProfile } from '../hooks/useOnboardingProfile';
import { CURRENCY_OPTIONS, INITIAL_PROFILE_FORM } from '../utils/constants';

export function OnboardingScreen(): ReactElement {
  const router = useRouter();
  const { submit, submitting } = useOnboardingProfile();
  const [formData, setFormData] = useState<ProfileFormValues>(INITIAL_PROFILE_FORM);

  function updateField<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K],
  ): void {
    setFormData((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(): Promise<void> {
    const saved = await submit(formData);
    if (saved) {
      router.replace('/' as Href);
    }
  }

  const inputClass =
    'mt-2 rounded-xl border border-border-card bg-card px-4 py-3 text-base text-text-primary';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Text className="text-3xl font-bold text-text-primary">Bienvenido a Pausa</Text>
        <Text className="mt-2 text-base text-text-secondary">
          Configura tu perfil para empezar a tomar conciencia de tu hábito.
        </Text>

        <Text className="mt-8 text-sm font-medium text-text-primary">
          ¿Cuántos cigarrillos fumas al día?
        </Text>
        <TextInput
          className={inputClass}
          keyboardType="number-pad"
          placeholder="Ej: 10"
          placeholderTextColor={THEME_COLORS.textSecondary}
          value={formData.dailyCigarettes}
          onChangeText={(value) => updateField('dailyCigarettes', value)}
        />

        <Text className="mt-6 text-sm font-medium text-text-primary">
          ¿Cuánto cuesta una cajetilla?
        </Text>
        <TextInput
          className={inputClass}
          keyboardType="decimal-pad"
          placeholder="Ej: 5.50"
          placeholderTextColor={THEME_COLORS.textSecondary}
          value={formData.packCost}
          onChangeText={(value) => updateField('packCost', value)}
        />

        <Text className="mt-6 text-sm font-medium text-text-primary">Moneda</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {CURRENCY_OPTIONS.map((currency) => {
            const selected = formData.currency === currency;
            return (
              <TouchableOpacity
                key={currency}
                onPress={() => updateField('currency', currency)}
                className={`rounded-full px-4 py-2 ${
                  selected ? 'bg-brand-orange' : 'border border-border-card bg-card'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-white' : 'text-text-secondary'
                  }`}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="mt-6 text-sm font-medium text-text-primary">
          Tu meta o motivo (opcional)
        </Text>
        <TextInput
          className={inputClass}
          placeholder="Ej: Recuperar mi salud"
          placeholderTextColor={THEME_COLORS.textSecondary}
          multiline
          value={formData.quitGoal}
          onChangeText={(value) => updateField('quitGoal', value)}
        />

        <TouchableOpacity
          onPress={() => {
            void handleSubmit();
          }}
          disabled={submitting}
          className="mt-10 items-center rounded-xl bg-brand-orange py-4 active:bg-accent-pressed"
        >
          <Text className="text-base font-bold text-white">
            {submitting ? 'Guardando…' : 'Comenzar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
