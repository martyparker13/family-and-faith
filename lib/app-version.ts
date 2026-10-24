import Constants from 'expo-constants';

/** App semver from Expo config (app.json) for in-app display. */
export function getAppDisplayVersion(): string {
  return Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.0.0';
}
