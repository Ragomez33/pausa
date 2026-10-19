import type { ReactElement } from 'react';
import { useState } from 'react';

import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
      router.replace('/');
    }
  }

  const inputClass =
    'mt-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100';

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Text className="text-3xl font-bold text-slate-100">Bienvenido a Pausa</Text>
        <Text className="mt-2 text-base text-slate-400">
          Configura tu perfil para empezar a tomar conciencia de tu hábito.
        </Text>

        <Text className="mt-8 text-sm font-medium text-slate-300">
          ¿Cuántos cigarrillos fumas al día?
        </Text>
        <TextInput
          className={inputClass}
          keyboardType="number-pad"
          placeholder="Ej: 10"
          placeholderTextColor="#64748b"
          value={formData.dailyCigarettes}
          onChangeText={(value) => updateField('dailyCigarettes', value)}
        />

        <Text className="mt-6 text-sm font-medium text-slate-300">
          ¿Cuánto cuesta una cajetilla?
        </Text>
        <TextInput
          className={inputClass}
          keyboardType="decimal-pad"
          placeholder="Ej: 5.50"
          placeholderTextColor="#64748b"
          value={formData.packCost}
          onChangeText={(value) => updateField('packCost', value)}
        />

        <Text className="mt-6 text-sm font-medium text-slate-300">Moneda</Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          {CURRENCY_OPTIONS.map((currency) => {
            const selected = formData.currency === currency;
            return (
              <TouchableOpacity
                key={currency}
                onPress={() => updateField('currency', currency)}
                className={`rounded-full px-4 py-2 ${
                  selected ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {currency}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="mt-6 text-sm font-medium text-slate-300">
          Tu meta o motivo (opcional)
        </Text>
        <TextInput
          className={inputClass}
          placeholder="Ej: Recuperar mi salud"
          placeholderTextColor="#64748b"
          multiline
          value={formData.quitGoal}
          onChangeText={(value) => updateField('quitGoal', value)}
        />

        <TouchableOpacity
          onPress={() => {
            void handleSubmit();
          }}
          disabled={submitting}
          className="mt-10 items-center rounded-xl bg-emerald-500 py-4 active:bg-emerald-400"
        >
          <Text className="text-base font-bold text-slate-900">
            {submitting ? 'Guardando…' : 'Comenzar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
