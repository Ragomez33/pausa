import type { ReactElement } from 'react';

import { Redirect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { formatMoney } from '@/shared/utils/utils';

import { useInventory } from '../hooks/useInventory';
import { INVENTORY_MODE_LABELS } from '../utils/constants';

export function InventoryScreen(): ReactElement {
  const router = useRouter();
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
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 px-6">
        <Text className="text-center text-red-400">{error.message}</Text>
      </View>
    );
  }

  if (!hasProfile || summary === null) {
    return <Redirect href="/onboarding" />;
  }

  const inputClass =
    'mt-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100';

  return (
    <ScrollView contentContainerClassName="flex-grow bg-slate-900 px-6 py-12">
      <TouchableOpacity onPress={() => router.back()} className="self-start py-2">
        <Text className="text-sm font-semibold text-emerald-400">Volver</Text>
      </TouchableOpacity>

      <Text className="mt-4 text-2xl font-bold text-slate-100">Inventario</Text>
      <Text className="mt-2 text-sm text-slate-400">
        Lleva el control de tus cajetillas y existencias actuales.
      </Text>

      {summary.lowStock ? (
        <View className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <Text className="text-sm font-semibold text-amber-300">
            Inventario bajo: te quedan pocos cigarrillos.
          </Text>
        </View>
      ) : null}

      <View className="mt-5 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Cigarrillos</Text>
          <Text className="mt-1 text-3xl font-black text-emerald-400">{summary.stock}</Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Cajetillas</Text>
          <Text className="mt-1 text-3xl font-black text-slate-100">{summary.packs}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row gap-3">
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Días restantes</Text>
          <Text className="mt-1 text-xl font-bold text-slate-100">
            {summary.daysRemaining === null ? 'No disponible' : summary.daysRemaining.toFixed(1)}
          </Text>
        </View>
        <View className="flex-1 rounded-2xl bg-slate-800 p-4">
          <Text className="text-xs uppercase text-slate-400">Gastado</Text>
          <Text className="mt-1 text-xl font-bold text-slate-100">
            {formatMoney(summary.totalSpending, summary.currency)}
          </Text>
        </View>
      </View>

      <View className="mt-6 flex-row gap-3">
        <TouchableOpacity
          onPress={openPurchase}
          className="flex-1 items-center rounded-xl bg-emerald-500 py-4 active:bg-emerald-400"
        >
          <Text className="text-center text-sm font-bold text-slate-900">
            Registrar Compra de Cajetilla
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openConsumption}
          className="flex-1 items-center rounded-xl border border-slate-600 py-4 active:bg-slate-800"
        >
          <Text className="text-center text-sm font-bold text-slate-300">Registrar Consumo</Text>
        </TouchableOpacity>
      </View>

      {form.mode === 'purchase' ? (
        <View className="mt-6 rounded-2xl bg-slate-800 p-5">
          <Text className="text-base font-bold text-slate-100">
            {INVENTORY_MODE_LABELS.purchase}
          </Text>
          <Text className="mt-4 text-sm font-medium text-slate-300">Cajetillas compradas</Text>
          <TextInput
            className={inputClass}
            keyboardType="number-pad"
            placeholder="Ej: 2"
            placeholderTextColor="#64748b"
            value={form.packs}
            onChangeText={(packs) => updateForm({ packs })}
          />
          <Text className="mt-4 text-sm font-medium text-slate-300">Costo (opcional)</Text>
          <TextInput
            className={inputClass}
            keyboardType="decimal-pad"
            placeholder="Ej: 5.50"
            placeholderTextColor="#64748b"
            value={form.cost}
            onChangeText={(cost) => updateForm({ cost })}
          />
          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={submitPurchase}
              disabled={saving}
              className={`flex-1 items-center rounded-xl py-3 ${
                saving ? 'bg-slate-700' : 'bg-emerald-500 active:bg-emerald-400'
              }`}
            >
              <Text className={`font-bold ${saving ? 'text-slate-400' : 'text-slate-900'}`}>
                Guardar compra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeForm}
              disabled={saving}
              className="flex-1 items-center rounded-xl border border-slate-600 py-3"
            >
              <Text className="font-bold text-slate-300">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {form.mode === 'consumption' ? (
        <View className="mt-6 rounded-2xl bg-slate-800 p-5">
          <Text className="text-base font-bold text-slate-100">
            {INVENTORY_MODE_LABELS.consumption}
          </Text>
          <Text className="mt-4 text-sm font-medium text-slate-300">Cigarrillos consumidos</Text>
          <TextInput
            className={inputClass}
            keyboardType="number-pad"
            placeholder="Ej: 1"
            placeholderTextColor="#64748b"
            value={form.cigarettes}
            onChangeText={(cigarettes) => updateForm({ cigarettes })}
          />
          <View className="mt-5 flex-row gap-3">
            <TouchableOpacity
              onPress={submitConsumption}
              disabled={saving}
              className={`flex-1 items-center rounded-xl py-3 ${
                saving ? 'bg-slate-700' : 'bg-emerald-500 active:bg-emerald-400'
              }`}
            >
              <Text className={`font-bold ${saving ? 'text-slate-400' : 'text-slate-900'}`}>
                Guardar consumo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeForm}
              disabled={saving}
              className="flex-1 items-center rounded-xl border border-slate-600 py-3"
            >
              <Text className="font-bold text-slate-300">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
