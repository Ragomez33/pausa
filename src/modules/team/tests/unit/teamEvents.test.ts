import { buildTeamSharedEvent } from '../../sync/teamEvents';

describe('buildTeamSharedEvent', () => {
  it('contains only privacy-safe shared fields', () => {
    const event = buildTeamSharedEvent('posponed', 'team_1', 'Tú', 1_000);
    const serialized = JSON.stringify(event);

    expect(event.teamId).toBe('team_1');
    expect(event.userName).toBe('Tú');
    expect(event.eventType).toBe('posponed');
    expect(event.timestamp).toBe(new Date(1_000).toISOString());
    expect(serialized).not.toContain('trigger');
    expect(serialized).not.toContain('notes');
    expect(serialized).not.toContain('emotion');
  });

  it('generates unique event ids', () => {
    const first = buildTeamSharedEvent('posponed', 'team_1', 'Tú', 1_000);
    const second = buildTeamSharedEvent('smoked', 'team_1', 'Tú', 1_000);

    expect(first.id).not.toBe(second.id);
  });

  it('supports both event types', () => {
    expect(buildTeamSharedEvent('smoked', 'team_1', 'Tú', 1_000).eventType).toBe('smoked');
  });
});
