import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';

import { useRouter } from 'expo-router';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { usePauseFlow } from '../hooks/usePauseFlow';
import { NOTES_MAX_LENGTH, TRIGGER_OPTIONS } from '../utils/constants';

export function PauseScreen(): ReactElement {
  const router = useRouter();
  const {
    secondsRemaining,
    isRunning,
    selectedTrigger,
    notes,
    saving,
    selectTrigger,
    setNotes,
    saveOutcome,
  } = usePauseFlow();
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isRunning) {
      breath.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 4_000,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 4_000,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
      breath.setValue(0);
    };
  }, [breath, isRunning]);

  function handleOutcome(resisted: boolean): void {
    if (saveOutcome(resisted)) {
      router.replace({
        pathname: '/',
        params: { feedback: resisted ? 'resisted' : 'ceded' },
      });
    }
  }

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.12] });
  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Text className="text-center text-lg font-medium text-slate-300">
          {isRunning ? 'Respira y espera…' : '¿Qué te está pasando?'}
        </Text>

        {isRunning ? (
          <View className="mt-10 items-center">
            <Animated.View style={{ transform: [{ scale }], opacity }}>
              <View className="h-48 w-48 items-center justify-center rounded-full bg-emerald-500/20">
                <View className="h-36 w-36 items-center justify-center rounded-full bg-emerald-500">
                  <Text className="text-6xl font-black text-slate-900">{secondsRemaining}</Text>
                </View>
              </View>
            </Animated.View>
            <Text className="mt-6 text-center text-sm text-slate-400">
              Inhala mientras el círculo crece y exhala mientras se reduce.
            </Text>
          </View>
        ) : (
          <>
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

            <Text className="mt-8 text-sm font-medium text-slate-300">Nota opcional</Text>
            <TextInput
              className="mt-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100"
              placeholder="¿Qué más influyó? (opcional)"
              placeholderTextColor="#64748b"
              value={notes}
              onChangeText={setNotes}
              maxLength={NOTES_MAX_LENGTH}
              multiline
            />
            <Text className="mt-1 self-end text-xs text-slate-500">
              {notes.length}/{NOTES_MAX_LENGTH}
            </Text>

            <View className="mt-8 w-full flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleOutcome(true)}
                disabled={saving}
                className={`flex-1 items-center rounded-xl py-4 ${
                  saving ? 'bg-slate-700' : 'bg-emerald-500 active:bg-emerald-400'
                }`}
              >
                <Text className={`text-base font-bold ${saving ? 'text-slate-400' : 'text-slate-900'}`}>
                  Logré Pausar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOutcome(false)}
                disabled={saving}
                className={`flex-1 items-center rounded-xl border py-4 ${
                  saving ? 'border-slate-800' : 'border-slate-600 active:bg-slate-800'
                }`}
              >
                <Text className={`text-base font-bold ${saving ? 'text-slate-600' : 'text-slate-300'}`}>
                  Cedí / Fumé
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
