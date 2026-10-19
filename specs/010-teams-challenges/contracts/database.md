# Contract: Team Persistence & Logic

All reads/writes go through the local Drizzle layer at `src/db/`. Local-only; no network.

## Schema

`teams`: `id` text PK, `name`, `invite_code` unique, `difficulty_level`, `duration_days`, `created_at`.

`team_members`: `id` text PK, `team_id` FK, `user_name`, `daily_limit`, `role`, `joined_at`, `postponed_count`, `smoked_today`, `streak_days`, `had_stumble`.

## Exposed operations

```ts
export function createTeamWithLeader(input: {
  name: string;
  difficultyLevel: DifficultyLevel;
  durationDays: number;
  dailyCigarettes: number;
  userName?: string;
}): { team: Team; member: TeamMember } | throws;

export function joinTeamByInviteCode(input: {
  inviteCode: string;
  dailyCigarettes: number;
  userName?: string;
}): { team: Team; member: TeamMember } | throws;

export function getTeamByInviteCode(code: string): Team | null;
export function listTeamMembers(teamId: string): TeamMember[];
export function getActiveTeam(): Team | null;
export function updateTeamMemberProgress(memberId: string, progress: {
  postponedCount: number;
  smokedToday: number;
  streakDays: number;
  hadStumble: boolean;
}): void;
```

## Pure logic

```ts
export type DifficultyLevel = 'facil' | 'medio' | 'dificil' | 'modo_dios';

export function calculateDailyLimit(dailyCigarettes: number, level: DifficultyLevel): number;
export function normalizeInviteCode(input: string): string;
export function isValidInviteCode(input: string): boolean;
export function buildLeaderboard(members: TeamMember[]): {
  guardian: TeamMember | null;
  unbreakable: TeamMember | null;
  resilient: TeamMember | null;
};
```

## Requirements

- **R-TEAM-1**: Team ids and member ids MUST be non-empty locally generated text values.
- **R-TEAM-2**: `invite_code` MUST be unique; generation retries on collision; lookup normalizes trim/case.
- **R-TEAM-3**: Create MUST insert team + leader membership atomically; join MUST insert exactly one member and prevent duplicates.
- **R-TEAM-4**: Daily limit MUST be `floor(daily × level multiplier)`, minimum 0.
- **R-TEAM-5**: Difficulty MUST be one of the four allowed values; roles MUST be `leader`/`member`.
- **R-TEAM-6**: The active team MUST be selected by the most recent `joined_at` membership.
- **R-TEAM-7**: The local member snapshot MUST refresh from profile/pause/smoking data when the dashboard loads; other members keep stored snapshots.
- **R-TEAM-8**: Guardián/Inquebrantable/Resiliente MUST be deterministic with name/id tie-breaks and empty states.
- **R-TEAM-9**: Storage failures MUST not leave partial teams/members and MUST surface a clear error.
- **R-TEAM-10**: No network calls; codes resolve only against local teams.

## Privacy

- Team names, member names, and progress snapshots stay local-only in this feature.
