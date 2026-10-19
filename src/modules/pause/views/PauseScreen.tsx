import type { ReactElement } from 'react';

import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

import { usePauseFlow } from '../hooks/usePauseFlow';
import { TRIGGER_OPTIONS } from '../utils/constants';

export function PauseScreen(): ReactElement {
  const router = useRouter();
  const {
    secondsRemaining,
    isRunning,
    selectedTrigger,
    saving,
    selectTrigger,
    saveOutcome,
  } = usePauseFlow();

  function handleOutcome(resisted: boolean): void {
    if (saveOutcome(resisted)) {
      router.replace('/');
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-slate-900 px-6">
      <Text className="text-lg font-medium text-slate-300">
        {isRunning ? 'Respira y espera…' : '¿Qué te está pasando?'}
      </Text>

      {isRunning ? (
        <Text className="mt-6 text-6xl font-black text-emerald-400">{secondsRemaining}</Text>
      ) : (
        <View className="mt-8 w-full flex-row flex-wrap justify-center gap-3">
          {TRIGGER_OPTIONS.map((option) => {
            const selected = selectedTrigger === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => selectTrigger(option.value)}
                className={`rounded-full px-5 py-3 ${
                  selected ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View className="mt-12 w-full flex-row gap-3">
        <TouchableOpacity
          onPress={() => handleOutcome(true)}
          disabled={isRunning || saving}
          className={`flex-1 items-center rounded-xl py-4 ${
            isRunning ? 'bg-slate-800' : 'bg-emerald-500 active:bg-emerald-400'
          }`}
        >
          <Text
            className={`text-base font-bold ${
              isRunning ? 'text-slate-500' : 'text-slate-900'
            }`}
          >
            Logré pausar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleOutcome(false)}
          disabled={isRunning || saving}
          className={`flex-1 items-center rounded-xl border py-4 ${
            isRunning ? 'border-slate-800' : 'border-slate-600 active:bg-slate-800'
          }`}
        >
          <Text className={`text-base font-bold ${isRunning ? 'text-slate-600' : 'text-slate-300'}`}>
            Cedí
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
