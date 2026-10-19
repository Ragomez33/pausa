import type { ReactElement } from 'react';

import { useRouter } from 'expo-router';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
      <View className="flex-1 items-center justify-center bg-slate-900 px-6">
        <Text className="text-center text-slate-400">Completa tu perfil para crear un equipo.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="bg-slate-900 px-6 py-12">
      <TouchableOpacity onPress={() => router.back()} className="self-start py-2">
        <Text className="text-sm font-semibold text-emerald-400">Volver</Text>
      </TouchableOpacity>

      <Text className="mt-4 text-2xl font-bold text-slate-100">Crear equipo</Text>
      <Text className="mt-2 text-sm text-slate-400">
        Elige un nombre, una duración y el nivel del reto.
      </Text>

      <Text className="mt-6 text-sm font-medium text-slate-300">Nombre del equipo</Text>
      <TextInput
        className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100"
        placeholder="Ej: Los imparables"
        placeholderTextColor="#64748b"
        value={form.name}
        onChangeText={(name) => updateForm({ name })}
        maxLength={40}
      />

      <Text className="mt-6 text-sm font-medium text-slate-300">Duración</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {DURATION_OPTIONS.map((days) => {
          const selected = form.durationDays === String(days);
          return (
            <TouchableOpacity
              key={days}
              onPress={() => updateForm({ durationDays: String(days) })}
              className={`rounded-full px-4 py-2 ${
                selected ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selected ? 'text-slate-900' : 'text-slate-300'
                }`}
              >
                {days} días
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="mt-6 text-sm font-medium text-slate-300">Nivel de dificultad</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {LEVEL_OPTIONS.map((level) => {
          const selected = form.difficultyLevel === level.value;
          return (
            <TouchableOpacity
              key={level.value}
              onPress={() => updateForm({ difficultyLevel: level.value })}
              className={`rounded-full px-4 py-2 ${
                selected ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selected ? 'text-slate-900' : 'text-slate-300'
                }`}
              >
                {level.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="mt-6 rounded-2xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">Tu límite diario</Text>
        <Text className="mt-1 text-2xl font-black text-emerald-400">{previewLimit}</Text>
        <Text className="mt-1 text-xs text-slate-500">
          Calculado desde tu promedio diario actual.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        className={`mt-6 items-center rounded-xl py-4 ${
          submitting ? 'bg-slate-700' : 'bg-emerald-500 active:bg-emerald-400'
        }`}
      >
        <Text className={`font-bold ${submitting ? 'text-slate-400' : 'text-slate-900'}`}>
          {submitting ? 'Creando…' : 'Crear equipo'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
