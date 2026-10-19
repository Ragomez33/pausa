import {
  IDLE_NOTIFICATION_BODY,
  IDLE_NOTIFICATION_CHANNEL_ID,
  IDLE_NOTIFICATION_TITLE,
} from '../../constants/notifications';

describe('idle notification content', () => {
  it('uses the exact required title', () => {
    expect(IDLE_NOTIFICATION_TITLE).toBe('Pausa consciente 🛑');
  });

  it('uses the exact required body', () => {
    expect(IDLE_NOTIFICATION_BODY).toBe(
      '¿Tienes ganas de fumar? Abre la app antes de encenderlo.',
    );
  });

  it('uses a stable Android channel id', () => {
    expect(IDLE_NOTIFICATION_CHANNEL_ID).toBe('idle-reminders');
  });
});
