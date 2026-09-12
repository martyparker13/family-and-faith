import { slotNotificationId } from '@/lib/notifications';

describe('slot notifications', () => {
  it('uses stable identifiers per slot', () => {
    expect(slotNotificationId('morning')).toBe('rhythm-morning');
    expect(slotNotificationId('dinner')).toBe('rhythm-dinner');
    expect(slotNotificationId('bedtime')).toBe('rhythm-bedtime');
  });
});
