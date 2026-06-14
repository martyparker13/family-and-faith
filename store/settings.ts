import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';
export type SpeechRate = 'slow' | 'normal' | 'fast';

/** expo-speech rate values for each read-aloud speed. */
export const SPEECH_RATES: Record<SpeechRate, number> = {
  slow: 0.8,
  normal: 0.95,
  fast: 1.15,
};

/** Multipliers applied to scripture/body text so families can size it up. */
export const TEXT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5] as const;

interface SettingsState {
  /** Optional family display name from onboarding ("The Parker Family"). */
  familyName: string;
  /** Whether onboarding has been completed. */
  onboarded: boolean;
  /**
   * Day 1 of the 365-day plan, as a local "YYYY-MM-DD" string. Set during
   * onboarding so the plan starts whenever the family begins.
   */
  planStartDate: string | null;
  /** Daily reminder, or null when disabled. */
  reminder: { hour: number; minute: number } | null;
  themePreference: ThemePreference;
  /** Index into TEXT_SCALE_STEPS. */
  textScaleIndex: number;
  /** Read-aloud narration speed. */
  speechRate: SpeechRate;

  setFamilyName: (name: string) => void;
  completeOnboarding: (opts: {
    familyName: string;
    planStartDate: string;
    reminder: { hour: number; minute: number } | null;
  }) => void;
  setPlanStartDate: (date: string) => void;
  setReminder: (reminder: { hour: number; minute: number } | null) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setTextScaleIndex: (index: number) => void;
  setSpeechRate: (rate: SpeechRate) => void;
  /** Sends the user back through onboarding on next launch of the tabs. */
  replayOnboarding: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      familyName: '',
      onboarded: false,
      planStartDate: null,
      reminder: null,
      themePreference: 'system',
      textScaleIndex: 1,
      speechRate: 'normal',

      setFamilyName: (familyName) => set({ familyName }),
      completeOnboarding: ({ familyName, planStartDate, reminder }) =>
        set({ familyName, planStartDate, reminder, onboarded: true }),
      setPlanStartDate: (planStartDate) => set({ planStartDate }),
      setReminder: (reminder) => set({ reminder }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setTextScaleIndex: (textScaleIndex) =>
        set({ textScaleIndex: Math.max(0, Math.min(TEXT_SCALE_STEPS.length - 1, textScaleIndex)) }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      replayOnboarding: () => set({ onboarded: false }),
    }),
    {
      name: 'ff-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** Convenience selector: the active text-size multiplier. */
export function useTextScale(): number {
  return useSettings((s) => TEXT_SCALE_STEPS[s.textScaleIndex] ?? 1);
}
