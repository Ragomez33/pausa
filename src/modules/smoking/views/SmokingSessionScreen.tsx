import type { ReactElement } from 'react';
import { useEffect } from 'react';

import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { SMOKING_TRIGGER_LABELS, isSmokingTrigger } from '@/shared/constants/smoking';

import { useSmokingSession } from '../hooks/useSmokingSession';
import { formatDuration } from '../utils/session';

export function SmokingSessionScreen(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ trigger?: string; sessionId?: string }>();
  const trigger = isSmokingTrigger(params.trigger) ? params.trigger : 'habit';
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : undefined;
  const {
    trigger: sessionTrigger,
    elapsedSeconds,
    staleSession,
    finishing,
    missingSession,
    finishSession,
    discardSession,
  } = useSmokingSession(trigger, sessionId);

  useEffect(() => {
    if (missingSession) {
      router.replace('/' as Href);
    }
  }, [missingSession, router]);

  function handleFinish(): void {
    if (finishSession()) {
      router.replace('/' as Href);
    }
  }

  function handleDiscard(): void {
    if (discardSession()) {
      router.replace('/' as Href);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xs uppercase text-text-secondary">Sesión de fumado</Text>
      <Text className="mt-2 text-center text-lg font-semibold text-text-primary">
        {SMOKING_TRIGGER_LABELS[sessionTrigger]}
      </Text>

      <View className="mt-10 h-52 w-52 items-center justify-center rounded-full border-4 border-brand-amber/40 bg-brand-amber/10">
        <Text className="text-4xl font-black text-brand-amber">
          {formatDuration(elapsedSeconds)}
        </Text>
        <Text className="mt-1 text-xs uppercase text-text-secondary">en curso</Text>
      </View>

      <Text className="mt-8 text-center text-sm text-text-secondary">
        Recibirás un aviso cada cinco minutos. Puedes seguir fumando o terminar cuando quieras.
      </Text>

      {staleSession ? (
        <View className="mt-6 w-full rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-5">
          <Text className="text-center text-base font-bold text-text-primary">
            ¿Olvidaste cerrar la sesión?
          </Text>
          <Text className="mt-2 text-center text-sm text-text-secondary">
            Han pasado más de 30 minutos. Puedes registrarla o descartarla sin registrar nada.
          </Text>
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={handleFinish}
              disabled={finishing}
              className="flex-1 items-center rounded-xl bg-brand-orange py-3 active:bg-accent-pressed"
            >
              <Text className="font-bold text-white">Terminé</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDiscard}
              disabled={finishing}
              className="flex-1 items-center rounded-xl border border-border-card py-3 active:bg-card/70"
            >
              <Text className="font-bold text-text-secondary">Descartar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        onPress={handleFinish}
        disabled={finishing}
        className={`mt-10 w-full items-center rounded-2xl py-5 ${
          finishing ? 'bg-border-card' : 'bg-brand-orange active:bg-accent-pressed'
        }`}
      >
        <Text
          className={`text-base font-bold ${finishing ? 'text-text-secondary' : 'text-white'}`}
        >
          Terminé
        </Text>
      </TouchableOpacity>
    </View>
  );
}
