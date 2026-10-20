import type { ReactElement } from 'react';

import { useRouter } from 'expo-router';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SectionHeader } from '@/shared/components/SectionHeader';
import { THEME_COLORS } from '@/shared/constants/theme';

import { DURATION_OPTIONS, LEVEL_OPTIONS } from '../utils/constants';
import { useCreateTeam } from '../hooks/useCreateTeam';

export function CreateTeamScreen(): ReactElement {
  const router = useRouter();
  const { profile, form, submitting, previewLimit, updateForm, submit } = useCreateTeam();

  function handleSubmit(): void {
    if (submit()) {
      router.replace('/team');
    }
  }

  if (profile === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-text-secondary">
          Completa tu perfil para crear un equipo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="bg-background px-6 py-12">
      <SectionHeader title="Crear equipo" subtitle="Equipo" />

      <Text className="mt-4 text-sm text-text-secondary">
        Elige un nombre, una duración y el nivel del reto.
      </Text>

      <Text className="mt-6 text-sm font-medium text-text-primary">Nombre del equipo</Text>
      <TextInput
        className="mt-2 rounded-xl border border-border-card bg-card px-4 py-3 text-base text-text-primary"
        placeholder="Ej: Los imparables"
        placeholderTextColor={THEME_COLORS.textSecondary}
        value={form.name}
        onChangeText={(name) => updateForm({ name })}
        maxLength={40}
      />

      <Text className="mt-6 text-sm font-medium text-text-primary">Duración</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {DURATION_OPTIONS.map((days) => {
          const selected = form.durationDays === String(days);
          return (
            <TouchableOpacity
              key={days}
              onPress={() => updateForm({ durationDays: String(days) })}
              className={`rounded-full border px-4 py-2 ${
                selected
                  ? 'border-brand-orange bg-brand-orange'
                  : 'border-border-card bg-card'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selected ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {days} días
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="mt-6 text-sm font-medium text-text-primary">
        Nivel de dificultad
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {LEVEL_OPTIONS.map((level) => {
          const selected = form.difficultyLevel === level.value;
          return (
            <TouchableOpacity
              key={level.value}
              onPress={() => updateForm({ difficultyLevel: level.value })}
              className={`rounded-full border px-4 py-2 ${
                selected
                  ? 'border-brand-orange bg-brand-orange'
                  : 'border-border-card bg-card'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selected ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="mt-6 rounded-2xl border border-border-card bg-card p-4">
        <Text className="text-xs uppercase text-text-secondary">Tu límite diario</Text>
        <Text className="mt-1 text-2xl font-black text-brand-amber">{previewLimit}</Text>
        <Text className="mt-1 text-xs text-text-secondary">
          Calculado desde tu promedio diario actual.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`mt-6 items-center rounded-xl py-4 ${
          submitting ? 'bg-border-card' : 'bg-brand-orange active:bg-accent-pressed'
        }`}
      >
        <Text className={`font-bold ${submitting ? 'text-text-secondary' : 'text-white'}`}>
          {submitting ? 'Creando…' : 'Crear equipo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
