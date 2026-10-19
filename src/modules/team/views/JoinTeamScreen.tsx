import type { ReactElement } from 'react';

import { useRouter } from 'expo-router';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useJoinTeam } from '../hooks/useJoinTeam';

export function JoinTeamScreen(): ReactElement {
  const router = useRouter();
  const { profile, inviteCode, submitting, setInviteCode, submit } = useJoinTeam();

  function handleSubmit(): void {
    if (submit()) {
      router.replace('/team');
    }
  }

  if (profile === null) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 px-6">
        <Text className="text-center text-slate-400">
          Completa tu perfil para unirte a un equipo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="flex-grow bg-slate-900 px-6 py-12">
      <TouchableOpacity onPress={() => router.back()} className="self-start py-2">
        <Text className="text-sm font-semibold text-emerald-400">Volver</Text>
      </TouchableOpacity>

      <Text className="mt-4 text-2xl font-bold text-slate-100">Unirme a un equipo</Text>
      <Text className="mt-2 text-sm text-slate-400">
        Ingresa el código de invitación que te compartieron.
      </Text>

      <TextInput
        className="mt-6 rounded-xl border border-slate-700 bg-slate-800 px-4 py-4 text-center text-2xl font-black tracking-widest text-slate-100"
        placeholder="ABC123"
        placeholderTextColor="#475569"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
      />

      <View className="mt-5 rounded-xl bg-slate-800/70 px-4 py-3">
        <Text className="text-xs text-slate-400">
          Este módulo es local: el código solo puede encontrar equipos creados en este mismo
          dispositivo. La sincronización entre dispositivos llegará más adelante.
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
          {submitting ? 'Uniéndome…' : 'Unirme'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
