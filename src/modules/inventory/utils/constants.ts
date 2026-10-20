export type InventoryFormMode = 'none' | 'purchase' | 'consumption';

export const INVENTORY_MODE_LABELS = {
  purchase: 'Registrar Compra de Cajetilla',
  consumption: 'Registrar Consumo',
} as const;

export const INVENTORY_REFLECTION_MESSAGES = {
  withStock: (stock: number) =>
    `Aún te quedan ${stock} cigarrillos. Evita comprar la próxima cajetilla.`,
  empty:
    'No te quedan cigarrillos. Antes de comprar otra cajetilla, respira y pregúntate si la necesitas.',
} as const;
