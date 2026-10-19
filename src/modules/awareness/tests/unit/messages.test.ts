import { pickMessage } from '../../utils/messages';

describe('pickMessage', () => {
  const messages = ['uno', 'dos', 'tres'];

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an empty result for an empty bank', () => {
    expect(pickMessage([])).toEqual({ index: -1, message: '' });
  });

  it('returns the only message when the bank has one entry', () => {
    expect(pickMessage(['solo'], 0)).toEqual({ index: 0, message: 'solo' });
  });

  it('avoids the immediately previous index when possible', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const result = pickMessage(messages, 0);

    expect(result.index).toBe(1);
    expect(result.message).toBe('dos');
  });

  it('returns a valid index and message', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = pickMessage(messages, 1);

    expect(result.index).toBeGreaterThanOrEqual(0);
    expect(result.index).toBeLessThan(messages.length);
    expect(result.index).not.toBe(1);
    expect(result.message).toBe(messages[result.index]);
  });
});
