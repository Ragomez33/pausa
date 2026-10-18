import type { ReactElement } from 'react';

import { useLocalSearchParams } from 'expo-router';

import { TeamDetailScreen } from '@/modules/team/views/TeamDetailScreen';

export default function TeamDetailRoute(): ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TeamDetailScreen teamId={id ?? ''} />;
}
