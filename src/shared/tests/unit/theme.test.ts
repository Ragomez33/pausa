import { THEME_COLORS } from '@/shared/constants/theme';

describe('THEME_COLORS', () => {
  it('matches the light Tabaco & Fuego palette contract', () => {
    expect(THEME_COLORS).toEqual({
      background: '#F8F6F4',
      card: '#FFFFFF',
      borderCard: '#E5E0DA',
      textPrimary: '#1A1412',
      textSecondary: '#6E655F',
      brandOrange: '#FF5722',
      accent: '#FF5722',
      accentStrong: '#C2410C',
      accentPressed: '#C2410C',
      brandAmber: '#B45309',
      white: '#FFFFFF',
    });
  });
});
