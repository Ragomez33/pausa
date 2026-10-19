import { pauseFormSchema } from '../../utils/schema';

describe('pauseFormSchema', () => {
  it.each([
    'anxiety',
    'stress',
    'boredom',
    'habit_social',
    'anger_frustration',
  ])('accepts the trigger %s', (triggerEmotion) => {
    const result = pauseFormSchema.safeParse({ triggerEmotion, notes: '' });
    expect(result.success).toBe(true);
  });

  it('rejects a missing trigger', () => {
    const result = pauseFormSchema.safeParse({ notes: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown trigger', () => {
    const result = pauseFormSchema.safeParse({ triggerEmotion: 'other', notes: '' });
    expect(result.success).toBe(false);
  });

  it('trims notes', () => {
    const result = pauseFormSchema.safeParse({
      triggerEmotion: 'anxiety',
      notes: '  después de comer  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('después de comer');
    }
  });

  it('accepts empty notes', () => {
    const result = pauseFormSchema.safeParse({ triggerEmotion: 'boredom', notes: '' });
    expect(result.success).toBe(true);
  });

  it('rejects notes longer than 200 characters', () => {
    const result = pauseFormSchema.safeParse({
      triggerEmotion: 'stress',
      notes: 'a'.repeat(201),
    });
    expect(result.success).toBe(false);
  });
});
