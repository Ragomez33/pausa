import { buildPauseEvent } from '../../utils/mappers';

describe('buildPauseEvent', () => {
  it('maps a resisted outcome to resisted = 1', () => {
    const result = buildPauseEvent({
      timestamp: 1000,
      triggerEmotion: 'anxiety',
      resisted: true,
    });

    expect(result.createdAt).toBe(1000);
    expect(result.triggerEmotion).toBe('anxiety');
    expect(result.resisted).toBe(1);
    expect(result.notes).toBeNull();
  });

  it('maps a ceded outcome to resisted = 0', () => {
    const result = buildPauseEvent({
      timestamp: 2000,
      triggerEmotion: 'boredom',
      resisted: false,
      notes: 'después de comer',
    });

    expect(result.resisted).toBe(0);
    expect(result.notes).toBe('después de comer');
  });
});
