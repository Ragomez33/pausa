export type InventoryFormMode = 'none' | 'purchase' | 'consumption';

export const INVENTORY_MODE_LABELS = {
  purchase: 'Registrar Compra de Cajetilla',
  consumption: 'Registrar Consumo',
} as const;
