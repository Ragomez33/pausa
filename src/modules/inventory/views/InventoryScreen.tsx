import type { ReactElement } from 'react';

import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  CalendarClock,
  Cigarette,
  Minus,
  Package,
  Plus,
  Sparkles,
  Wallet,
} from '@/shared/components/icons';
import { MainTabBar } from '@/shared/components/MainTabBar';
import { THEME_COLORS } from '@/shared/constants/theme';

import { formatMoney } from '@/shared/utils/utils';

import { useInventory } from '../hooks/useInventory';
import {
  INVENTORY_MODE_LABELS,
  INVENTORY_REFLECTION_MESSAGES,
} from '../utils/constants';

// NativeWind cannot express colored glow shadows consistently across platforms,
// so the few neon/elevation values are applied through the `style` prop.
const CARD_SHADOW = {
  shadowColor: THEME_COLORS.textPrimary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 10,
  elevation: 3,
} as const;

const ACCENT_GLOW = {
  shadowColor: THEME_COLORS.brandAmber,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 16,
  elevation: 6,
} as const;

type SummaryCardProps = {
  label: string;
  value: string;
  icon: ReactElement;
  highlight?: boolean;
};

function SummaryCard({ label, value, icon, highlight = false }: SummaryCardProps): ReactElement {
  return (
    <View
      className={`flex-1 rounded-2xl border p-4 ${
        highlight
          ? 'border-brand-amber/30 bg-brand-amber/[0.07]'
          : 'border-border-card bg-card/80'
      }`}
      style={highlight ? ACCENT_GLOW : CARD_SHADOW}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
          {label}
        </Text>
        {icon}
      </View>
      <Text
        className={`mt-2 text-2xl font-black tracking-tight ${
          highlight ? 'text-brand-amber' : 'text-text-primary'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

export function InventoryScreen(): ReactElement {
  const {
    loading,
    hasProfile,
    summary,
    error,
    form,
    saving,
    openPurchase,
    openConsumption,
    closeForm,
    updateForm,
    submitPurchase,
    submitConsumption,
  } = useInventory();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={THEME_COLORS.brandOrange} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-accent-strong">{error.message}</Text>
      </View>
    );
  }

  if (!hasProfile || summary === null) {
    return <Redirect href="/onboarding" />;
  }

  const inputClass =
    'mt-2 rounded-xl border border-border-card bg-background px-4 py-3 text-base text-text-primary';
  const reflection =
    summary.stock > 0
      ? INVENTORY_REFLECTION_MESSAGES.withStock(summary.stock)
      : INVENTORY_REFLECTION_MESSAGES.empty;

  return (
    <View className="flex-1 bg-background">
      <View className="px-5 pt-12">
        <MainTabBar />
      </View>

      <ScrollView contentContainerClassName="flex-grow px-5 pt-5 pb-12">
        <Text className="text-3xl font-black tracking-tight text-text-primary">
          Inventario
        </Text>
        <Text className="mt-2 text-sm leading-5 text-text-secondary">
          Lleva el control de tus cajetillas y existencias actuales.
        </Text>

      {summary.lowStock ? (
        <View className="mt-5 flex-row items-start gap-3 rounded-2xl border border-brand-amber/25 bg-brand-amber/[0.07] px-4 py-3">
          <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl bg-brand-amber/15">
            <Sparkles color={THEME_COLORS.brandAmber} size={16} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-amber">
              Pausa consciente
            </Text>
            <Text className="mt-1 text-sm font-medium leading-5 text-text-primary">
              {reflection}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mt-5 flex-row gap-3">
        <SummaryCard
          label="Cigarrillos"
          value={String(summary.stock)}
          highlight
          icon={<Cigarette color={THEME_COLORS.brandAmber} size={16} strokeWidth={2.2} />}
        />
        <SummaryCard
          label="Cajetillas"
          value={String(summary.packs)}
          icon={<Package color={THEME_COLORS.textSecondary} size={16} strokeWidth={2.2} />}
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        <SummaryCard
          label="Días restantes"
          value={
            summary.daysRemaining === null ? 'No disponible' : summary.daysRemaining.toFixed(1)
          }
          icon={<CalendarClock color={THEME_COLORS.textSecondary} size={16} strokeWidth={2.2} />}
        />
        <SummaryCard
          label="Gastado"
          value={formatMoney(summary.totalSpending, summary.currency)}
          icon={<Wallet color={THEME_COLORS.textSecondary} size={16} strokeWidth={2.2} />}
        />
      </View>

      <View className="mt-6 flex-row gap-3">
        <TouchableOpacity
          onPress={openPurchase}
          activeOpacity={0.86}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-brand-orange bg-brand-orange py-4 active:bg-accent-pressed"
        >
          <Plus color={THEME_COLORS.white} size={17} strokeWidth={2.8} />
          <Text className="text-center text-xs font-black text-white">
            Registrar compra
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openConsumption}
          activeOpacity={0.82}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border-card bg-card py-4 active:bg-card/70"
        >
          <Minus color={THEME_COLORS.brandAmber} size={17} strokeWidth={2.6} />
          <Text className="text-center text-xs font-bold text-text-secondary">
            Registrar consumo
          </Text>
        </TouchableOpacity>
      </View>

      {form.mode === 'purchase' ? (
        <View
          className="mt-6 rounded-2xl border border-border-card bg-card/90 p-5"
          style={CARD_SHADOW}
        >
          <Text className="text-base font-black text-text-primary">
            {INVENTORY_MODE_LABELS.purchase}
          </Text>
          <Text className="mt-4 text-sm font-medium text-text-primary">
            Cajetillas compradas
          </Text>
          <TextInput
            className={inputClass}
            keyboardType="number-pad"
            placeholder="Ej: 2"
            placeholderTextColor={THEME_COLORS.textSecondary}
            value={form.packs}
            onChangeText={(packs) => updateForm({ packs })}
          />
          <Text className="mt-4 text-sm font-medium text-text-primary">
            Costo (opcional)
          </Text>
          <TextInput
            className={inputClass}
            keyboardType="decimal-pad"
            placeholder="Ej: 5.50"
            placeholderTextColor={THEME_COLORS.textSecondary}
            value={form.cost}
            onChangeText={(cost) => updateForm({ cost })}
          />
          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={submitPurchase}
              disabled={saving}
              className={`flex-1 items-center rounded-xl py-3 ${
                saving ? 'bg-border-card' : 'bg-brand-orange active:bg-accent-pressed'
              }`}
            >
              <Text className={`font-black ${saving ? 'text-text-secondary' : 'text-white'}`}>
                Guardar compra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeForm}
              disabled={saving}
              className="flex-1 items-center rounded-xl border border-border-card py-3"
            >
              <Text className="font-bold text-text-secondary">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {form.mode === 'consumption' ? (
        <View
          className="mt-6 rounded-2xl border border-border-card bg-card/90 p-5"
          style={CARD_SHADOW}
        >
          <Text className="text-base font-black text-text-primary">
            {INVENTORY_MODE_LABELS.consumption}
          </Text>
          <Text className="mt-4 text-sm font-medium text-text-primary">
            Cigarrillos consumidos
          </Text>
          <TextInput
            className={inputClass}
            keyboardType="number-pad"
            placeholder="Ej: 1"
            placeholderTextColor={THEME_COLORS.textSecondary}
            value={form.cigarettes}
            onChangeText={(cigarettes) => updateForm({ cigarettes })}
          />
          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={submitConsumption}
              disabled={saving}
              className={`flex-1 items-center rounded-xl py-3 ${
                saving ? 'bg-border-card' : 'bg-brand-orange active:bg-accent-pressed'
              }`}
            >
              <Text className={`font-black ${saving ? 'text-text-secondary' : 'text-white'}`}>
                Guardar consumo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeForm}
              disabled={saving}
              className="flex-1 items-center rounded-xl border border-border-card py-3"
            >
              <Text className="font-bold text-text-secondary">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
