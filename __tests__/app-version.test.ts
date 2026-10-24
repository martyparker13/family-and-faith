import Constants from 'expo-constants';

import { getAppDisplayVersion } from '@/lib/app-version';

jest.mock('expo-constants', () => ({
  expoConfig: { version: '2.1.3' },
  nativeAppVersion: '2.1.3',
}));

describe('getAppDisplayVersion', () => {
  it('reads version from expo config', () => {
    expect(getAppDisplayVersion()).toBe('2.1.3');
  });

  it('falls back to nativeAppVersion when expoConfig is missing', () => {
    const mocked = Constants as { expoConfig?: { version?: string } };
    const previous = mocked.expoConfig;
    mocked.expoConfig = undefined;
    expect(getAppDisplayVersion()).toBe('2.1.3');
    mocked.expoConfig = previous;
  });
});
