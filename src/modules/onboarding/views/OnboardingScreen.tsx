import type { ReactElement } from 'react';

import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';

export function OnboardingScreen(): ReactElement {
  return (
    <PlaceholderScreen
      title="Bienvenido"
      subtitle="Configura tu perfil de fumador, intervalos y metas."
    />
  );
}
