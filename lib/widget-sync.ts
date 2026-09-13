import { Platform } from 'react-native';

const APP_GROUP = 'group.com.C323.faithandfamily';
const WIDGET_KIND = 'FamilyFaithWidget';

// ExtensionStorage is only available in native builds (not Expo Go).
// We lazy-require so the module error doesn't crash Expo Go.
function getStorage() {
  if (Platform.OS !== 'ios') return null;
  try {
    const { ExtensionStorage } = require('@bacons/apple-targets');
    return new ExtensionStorage(APP_GROUP) as {
      set(key: string, value: number): void;
    };
  } catch {
    return null;
  }
}

function reloadWidget() {
  try {
    const { ExtensionStorage } = require('@bacons/apple-targets');
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch {
    // Not available in Expo Go
  }
}

export interface WidgetData {
  day: number;
  readingDone: boolean;
  devotionalDone: boolean;
  prayerDone: boolean;
}

export function syncWidget(data: WidgetData) {
  const storage = getStorage();
  if (!storage) return;

  storage.set('ffm.day', data.day);
  storage.set('ffm.reading',    data.readingDone    ? 1 : 0);
  storage.set('ffm.devotional', data.devotionalDone ? 1 : 0);
  storage.set('ffm.prayer',     data.prayerDone     ? 1 : 0);

  reloadWidget();
}
