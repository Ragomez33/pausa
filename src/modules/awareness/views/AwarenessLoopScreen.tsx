import type { ReactElement } from 'react';

import { type Href, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { useAwarenessLoop } from '../hooks/useAwarenessLoop';
import { AWARENESS_EMOTIONS } from '../utils/constants';

export function AwarenessLoopScreen(): ReactElement {
  const router = useRouter();
  const {
    step,
    selectedTrigger,
    selectedTriggerLabel,
    message,
    confirmPostpone,
    declinePostpone,
    selectEmotion,
  } = useAwarenessLoop();

  function handlePostpone(): void {
    if (confirmPostpone()) {
      router.replace('/');
    }
  }

  function handleStartSession(): void {
    if (selectedTrigger === null) {
      return;
    }
    router.push(`/smoking-session?trigger=${selectedTrigger}` as Href);
  }

  return (
    <ScrollView contentContainerClassName="flex-grow justify-center bg-slate-900 px-6 py-12">
      <TouchableOpacity onPress={() => router.back()} className="self-start py-2">
        <Text className="text-sm font-semibold text-emerald-400">Volver</Text>
      </TouchableOpacity>

      {step === 'postpone' ? (
        <View className="mt-6">
          <Text className="text-center text-3xl font-black text-slate-100">
            ¿Puedes posponerlo?
          </Text>
          <Text className="mt-3 text-center text-sm text-slate-400">
            Antes de encenderlo, dale una oportunidad a la pausa.
          </Text>

          <TouchableOpacity
            onPress={handlePostpone}
            className="mt-10 items-center rounded-2xl bg-emerald-500 py-5 active:bg-emerald-400"
          >
            <Text className="text-base font-bold text-slate-900">Sí, puedo esperar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={declinePostpone}
            className="mt-3 items-center rounded-2xl border border-slate-600 py-5 active:bg-slate-800"
          >
            <Text className="text-base font-bold text-slate-300">No, quiero fumar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step === 'emotion' ? (
        <View className="mt-6">
          <Text className="text-center text-2xl font-black text-slate-100">
            ¿Por qué sientes la necesidad ahora?
          </Text>

          <View className="mt-8 gap-3">
            {AWARENESS_EMOTIONS.map((emotion) => (
              <TouchableOpacity
                key={emotion.value}
                onPress={() => selectEmotion(emotion.value)}
                className="rounded-2xl bg-slate-800 px-5 py-4 active:bg-slate-700"
              >
                <Text className="text-center text-base font-semibold text-slate-200">
                  {emotion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {step === 'message' ? (
        <View className="mt-6">
          <Text className="text-xs uppercase text-slate-500">
            {selectedTriggerLabel ?? 'Disparador'}
          </Text>
          <Text className="mt-4 text-center text-2xl font-bold leading-9 text-slate-100">
            “{message}”
          </Text>

          <TouchableOpacity
            onPress={handleStartSession}
            className="mt-10 items-center rounded-2xl bg-amber-500 py-5 active:bg-amber-400"
          >
            <Text className="text-base font-bold text-slate-900">Iniciar Cigarrillo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            className="mt-3 items-center rounded-2xl border border-slate-600 py-4 active:bg-slate-800"
          >
            <Text className="text-sm font-semibold text-slate-300">Mejor no fumo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
