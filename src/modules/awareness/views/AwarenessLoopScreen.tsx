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
      router.replace('/' as Href);
    }
  }

  function handleStartSession(): void {
    if (selectedTrigger === null) {
      return;
    }
    router.push(`/smoking-session?trigger=${selectedTrigger}` as Href);
  }

  return (
    <ScrollView contentContainerClassName="flex-grow justify-center bg-background px-6 py-12">
      <TouchableOpacity onPress={() => router.back()} className="self-start py-2">
        <Text className="text-sm font-semibold text-accent-strong">Volver</Text>
      </TouchableOpacity>

      {step === 'postpone' ? (
        <View className="mt-6">
          <Text className="text-center text-3xl font-black text-text-primary">
            ¿Puedes posponerlo?
          </Text>
          <Text className="mt-3 text-center text-sm text-text-secondary">
            Antes de encenderlo, dale una oportunidad a la pausa.
          </Text>

          <TouchableOpacity
            onPress={handlePostpone}
            className="mt-10 items-center rounded-2xl bg-brand-orange py-5 active:bg-accent-pressed"
          >
            <Text className="text-base font-bold text-white">Sí, puedo esperar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={declinePostpone}
            className="mt-3 items-center rounded-2xl border border-border-card bg-card py-5 active:bg-card/70"
          >
            <Text className="text-base font-bold text-text-secondary">No, quiero fumar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step === 'emotion' ? (
        <View className="mt-6">
          <Text className="text-center text-2xl font-black text-text-primary">
            ¿Por qué sientes la necesidad ahora?
          </Text>

          <View className="mt-8 gap-3">
            {AWARENESS_EMOTIONS.map((emotion) => (
              <TouchableOpacity
                key={emotion.value}
                onPress={() => selectEmotion(emotion.value)}
                className="rounded-2xl border border-border-card bg-card px-5 py-4 active:bg-card/70"
              >
                <Text className="text-center text-base font-semibold text-text-primary">
                  {emotion.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {step === 'message' ? (
        <View className="mt-6">
          <Text className="text-xs uppercase text-text-secondary">
            {selectedTriggerLabel ?? 'Disparador'}
          </Text>
          <Text className="mt-4 text-center text-2xl font-bold leading-9 text-text-primary">
            “{message}”
          </Text>

          <TouchableOpacity
            onPress={handleStartSession}
            className="mt-10 items-center rounded-2xl bg-brand-amber py-5 active:bg-brand-amber/80"
          >
            <Text className="text-base font-bold text-white">Iniciar Cigarrillo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/' as Href)}
            className="mt-3 items-center rounded-2xl border border-border-card bg-card py-4 active:bg-card/70"
          >
            <Text className="text-sm font-semibold text-text-secondary">Mejor no fumo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
