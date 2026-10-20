import type { ReactElement } from 'react';

import { type Href, useRouter } from 'expo-router';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { THEME_COLORS } from '@/shared/constants/theme';

import { useAccountBackup } from '../hooks/useAccountBackup';
import { ACCOUNT_COPY } from '../utils/constants';

const STATUS_LABELS = {
  disabled: 'Respaldo desactivado',
  pending: 'Cambios pendientes',
  syncing: 'Sincronizando',
  synced: 'Sincronizado',
  offline: 'Sin conexión',
  error: 'Error de respaldo',
} as const;

function ToggleRow({
  title,
  description,
  value,
  onPress,
  disabled,
}: {
  title: string;
  description: string;
  value: boolean;
  onPress: () => void;
  disabled?: boolean;
}): ReactElement {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      className={`mt-3 flex-row items-start rounded-2xl border p-4 ${
        value ? 'border-brand-amber/40 bg-brand-amber/10' : 'border-border-card bg-card'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <View className="flex-1">
        <Text className="text-sm font-bold text-text-primary">{title}</Text>
        <Text className="mt-1 text-xs leading-5 text-text-secondary">{description}</Text>
      </View>
      <View
        className={`ml-3 mt-1 h-6 w-11 justify-center rounded-full px-1 ${
          value ? 'bg-brand-amber' : 'bg-border-card'
        }`}
      >
        <View
          className={`h-4 w-4 rounded-full bg-white ${value ? 'self-end' : 'self-start'}`}
        />
      </View>
    </TouchableOpacity>
  );
}

export function AccountScreen(): ReactElement {
  const router = useRouter();
  const account = useAccountBackup(true);
  const statusLabel = STATUS_LABELS[account.backupStatus];

  return (
    <ScrollView
      contentContainerClassName="flex-grow bg-background px-6 py-12"
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.replace('/' as Href)} className="self-start py-2">
        <Text className="text-sm font-semibold text-accent-strong">Volver</Text>
      </TouchableOpacity>

      <Text className="mt-4 text-3xl font-black tracking-tight text-text-primary">
        {ACCOUNT_COPY.title}
      </Text>
      <Text className="mt-2 text-sm leading-5 text-text-secondary">
        {ACCOUNT_COPY.subtitle}
      </Text>

      <View className="mt-6 rounded-2xl border border-border-card bg-card p-4">
        <Text className="text-xs uppercase text-text-secondary">Estado</Text>
        <Text className="mt-1 text-lg font-black text-text-primary">{statusLabel}</Text>
        {account.pendingCount > 0 ? (
          <Text className="mt-1 text-xs text-text-secondary">
            {account.pendingCount} cambios en cola
          </Text>
        ) : null}
        {account.restoring ? (
          <Text className="mt-1 text-xs text-brand-amber">
            Restaurando {account.restoreProgress ?? ''}
          </Text>
        ) : null}
        {account.errorMessage !== null ? (
          <View className="mt-3 rounded-xl border border-accent-strong/30 bg-accent-strong/5 p-3">
            <Text className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-strong">
              Detalle del error {account.errorCode !== null ? `· ${account.errorCode}` : ''}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-text-secondary">
              {account.errorMessage}
            </Text>
            {account.nextRetryAt !== null ? (
              <Text className="mt-1 text-[10px] text-text-secondary">
                Próximo reintento: {new Date(account.nextRetryAt).toLocaleTimeString()}
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={account.retryNow}
              className="mt-3 items-center rounded-lg bg-accent-strong py-2"
            >
              <Text className="text-xs font-bold text-white">Reintentar ahora</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {account.authStatus !== 'authenticated' ? (
        <View className="mt-6 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-base font-black text-text-primary">
            {ACCOUNT_COPY.guestTitle}
          </Text>
          <Text className="mt-1 text-sm leading-5 text-text-secondary">
            {ACCOUNT_COPY.guestDescription}
          </Text>

          <Text className="mt-5 text-sm font-bold text-text-primary">
            {ACCOUNT_COPY.magicLinkTitle}
          </Text>
          <TextInput
            className="mt-2 rounded-xl border border-border-card bg-background px-4 py-3 text-base text-text-primary"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="tu@email.com"
            placeholderTextColor={THEME_COLORS.textSecondary}
            value={account.emailInput}
            onChangeText={account.updateEmail}
          />
          <TouchableOpacity
            onPress={() => void account.requestMagicLink()}
            disabled={account.sendingLink || account.emailInput.trim().length === 0}
            className={`mt-3 items-center rounded-xl py-3 ${
              account.sendingLink || account.emailInput.trim().length === 0
                ? 'bg-border-card'
                : 'bg-brand-orange active:bg-accent-pressed'
            }`}
          >
            <Text className="font-bold text-white">
              {account.sendingLink ? 'Enviando...' : 'Enviar enlace mágico'}
            </Text>
          </TouchableOpacity>
          {account.linkSent ? (
            <Text className="mt-3 text-xs leading-5 text-brand-amber">
              {ACCOUNT_COPY.magicLinkSent}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="mt-6 rounded-2xl border border-border-card bg-card p-4">
          <Text className="text-base font-black text-text-primary">
            {ACCOUNT_COPY.signedInTitle}
          </Text>
          <Text className="mt-1 text-sm text-text-secondary">
            {account.accountEmail ?? 'Cuenta autenticada'}
          </Text>

          {account.adoptionNeeded ? (
            <View className="mt-4 rounded-xl border border-brand-amber/30 bg-brand-amber/10 p-4">
              <Text className="text-sm font-bold text-text-primary">
                {ACCOUNT_COPY.adoptionTitle}
              </Text>
              <Text className="mt-1 text-xs leading-5 text-text-secondary">
                {ACCOUNT_COPY.adoptionDescription}
              </Text>
              <View className="mt-3 flex-row gap-3">
                <TouchableOpacity
                  onPress={account.adoptLocalData}
                  className="flex-1 items-center rounded-xl bg-brand-orange py-3"
                >
                  <Text className="text-xs font-bold text-white">
                    {ACCOUNT_COPY.adoptAction}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={account.startWithCloudData}
                  className="flex-1 items-center rounded-xl border border-border-card py-3"
                >
                  <Text className="text-xs font-bold text-text-secondary">
                    {ACCOUNT_COPY.startFreshAction}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <ToggleRow
            title={ACCOUNT_COPY.backupTitle}
            description={ACCOUNT_COPY.backupDescription}
            value={account.preferences.backupEnabled}
            onPress={account.toggleBackup}
          />
          <ToggleRow
            title={ACCOUNT_COPY.consentTitle}
            description={ACCOUNT_COPY.consentDescription}
            value={account.preferences.consentEmotions}
            onPress={account.toggleConsent}
            disabled={!account.preferences.backupEnabled}
          />

          <TouchableOpacity
            onPress={() => void account.signOut()}
            className="mt-5 items-center rounded-xl border border-border-card py-3"
          >
            <Text className="font-bold text-accent-strong">{ACCOUNT_COPY.signOutAction}</Text>
          </TouchableOpacity>
          <Text className="mt-2 text-center text-[10px] leading-4 text-text-secondary">
            {ACCOUNT_COPY.signOutDescription}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
