import type { ReactElement } from 'react';

import { useRouter } from 'expo-router';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SectionHeader } from '@/shared/components/SectionHeader';
import { THEME_COLORS } from '@/shared/constants/theme';

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
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-text-secondary">
          Completa tu perfil para unirte a un equipo.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerClassName="flex-grow bg-background px-6 py-12">
      <SectionHeader title="Unirme a un equipo" subtitle="Equipo" />

      <Text className="mt-4 text-sm text-text-secondary">
        Ingresa el código de invitación que te compartieron.
      </Text>

      <TextInput
        className="mt-6 rounded-xl border border-border-card bg-card px-4 py-4 text-center text-2xl font-black tracking-widest text-text-primary"
        placeholder="ABC123"
        placeholderTextColor={THEME_COLORS.textSecondary}
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={12}
      />

      <View className="mt-5 rounded-xl border border-border-card bg-card/70 px-4 py-3">
        <Text className="text-xs text-text-secondary">
          Este módulo es local: el código solo puede encontrar equipos creados en este mismo
          dispositivo. La sincronización entre dispositivos llegará más adelante.
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
          {submitting ? 'Uniéndome…' : 'Unirme'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
