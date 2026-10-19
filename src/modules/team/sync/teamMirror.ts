import type { Team, TeamMember } from '@/db/schema';
import { getSupabaseClient } from '@/services/supabase';

export async function mirrorTeamAndMember(
  team: Team,
  member: TeamMember,
): Promise<void> {
  const client = getSupabaseClient();
  if (client === null) {
    return;
  }

  try {
    const teamResult = await client.from('teams').upsert(
      {
        id: team.id,
        name: team.name,
        invite_code: team.inviteCode,
        difficulty_level: team.difficultyLevel,
        duration_days: team.durationDays,
        created_at: team.createdAt,
      },
      { onConflict: 'id' },
    );
    if (teamResult.error !== null) {
      return;
    }

    await client.from('team_members').upsert(
      {
        id: member.id,
        team_id: member.teamId,
        user_name: member.userName,
        daily_limit: member.dailyLimit,
        role: member.role,
      },
      { onConflict: 'id' },
    );
  } catch {
    // Remote mirroring is best-effort and never affects local success.
  }
}
