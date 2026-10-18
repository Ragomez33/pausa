import type { ReactElement } from 'react';

import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';

export interface TeamDetailScreenProps {
  teamId: string;
}

export function TeamDetailScreen({ teamId }: TeamDetailScreenProps): ReactElement {
  return (
    <PlaceholderScreen
      title="Detalle de equipo"
      subtitle={`Equipo ${teamId}: métricas y miembros.`}
    />
  );
}
