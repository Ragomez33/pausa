import { buildPauseEvent } from '../../utils/mappers';

describe('buildPauseEvent', () => {
  it('maps a resisted outcome to resisted = 1', () => {
    const result = buildPauseEvent({
      timestamp: 1000,
      triggerEmotion: 'anxiety',
      resisted: true,
    });

    expect(result.timestamp).toBe(new Date(1000).toISOString());
    expect(result.triggerEmotion).toBe('anxiety');
    expect(result.resisted).toBe(1);
    expect(result.notes).toBeNull();
  });

  it('maps a ceded outcome to resisted = 0 and preserves notes', () => {
    const result = buildPauseEvent({
      timestamp: 2000,
      triggerEmotion: 'habit_social',
      resisted: false,
      notes: 'después de comer',
    });

    expect(result.resisted).toBe(0);
    expect(result.triggerEmotion).toBe('habit_social');
    expect(result.notes).toBe('después de comer');
  });

  it('supports the new trigger codes', () => {
    const result = buildPauseEvent({
      timestamp: 3000,
      triggerEmotion: 'anger_frustration',
      resisted: true,
    });

    expect(result.triggerEmotion).toBe('anger_frustration');
    expect(result.notes).toBeNull();
  });
});
