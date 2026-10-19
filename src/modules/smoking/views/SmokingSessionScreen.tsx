import type { ReactElement } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

import { SMOKING_TRIGGER_LABELS, isSmokingTrigger } from '@/shared/constants/smoking';

import { useSmokingSession } from '../hooks/useSmokingSession';
import { formatDuration } from '../utils/session';

export function SmokingSessionScreen(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ trigger?: string }>();
  const trigger = isSmokingTrigger(params.trigger) ? params.trigger : 'habit';
  const { elapsedSeconds, promptVisible, finishing, continueSession, finishSession } =
    useSmokingSession(trigger);

  function handleFinish(): void {
    if (finishSession()) {
      router.replace('/');
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 px-6">
      <Text className="text-xs uppercase text-slate-500">Sesión de fumado</Text>
      <Text className="mt-2 text-center text-lg font-semibold text-slate-200">
        {SMOKING_TRIGGER_LABELS[trigger]}
      </Text>

      <View className="mt-10 h-52 w-52 items-center justify-center rounded-full border-4 border-amber-500/40 bg-amber-500/10">
        <Text className="text-4xl font-black text-amber-400">
          {formatDuration(elapsedSeconds)}
        </Text>
        <Text className="mt-1 text-xs uppercase text-slate-500">en curso</Text>
      </View>

      <Text className="mt-8 text-center text-sm text-slate-400">
        El temporizador corre en primer plano. Cada cinco minutos te preguntaremos si terminaste.
      </Text>

      <TouchableOpacity
        onPress={handleFinish}
        disabled={finishing}
        className={`mt-10 w-full items-center rounded-2xl py-5 ${
          finishing ? 'bg-slate-700' : 'bg-emerald-500 active:bg-emerald-400'
        }`}
      >
        <Text className={`text-base font-bold ${finishing ? 'text-slate-400' : 'text-slate-900'}`}>
          Terminé
        </Text>
      </TouchableOpacity>

      <Modal
        visible={promptVisible}
        transparent
        animationType="fade"
        onRequestClose={continueSession}
      >
        <View className="flex-1 items-center justify-center bg-black/70 px-6">
          <View className="w-full rounded-3xl bg-slate-800 p-6">
            <Text className="text-center text-2xl font-black text-slate-100">
              ¿Terminaste?
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-400">
              Han pasado cinco minutos de sesión.
            </Text>

            <TouchableOpacity
              onPress={handleFinish}
              disabled={finishing}
              className="mt-6 items-center rounded-xl bg-emerald-500 py-4 active:bg-emerald-400"
            >
              <Text className="font-bold text-slate-900">Sí, terminé</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={continueSession}
              className="mt-3 items-center rounded-xl border border-slate-600 py-4 active:bg-slate-700"
            >
              <Text className="font-bold text-slate-300">Seguir fumando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
