import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CatchUpChoice } from '@/lib/catch-up';
import type { VacationMode } from '@/lib/vacation-mode';
import { DEFAULT_VACATION_MODE } from '@/lib/vacation-mode';

export type ThemePreference = 'system' | 'light' | 'dark';
export type SpeechRate = 'slow' | 'normal' | 'fast';
export type AgeBand = 'little' | 'older' | 'teen';

export interface ChildProfile {
  name?: string;
  ageBand: AgeBand;
}

export interface ReminderTime {
  hour: number;
  minute: number;
}

/** expo-speech rate values for each read-aloud speed. */
export const SPEECH_RATES: Record<SpeechRate, number> = {
  slow: 0.8,
  normal: 0.95,
  fast: 1.15,
};

/** Multipliers applied to scripture/body text so families can size it up. */
export const TEXT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5] as const;

export interface SettingsState {
  /** Optional family display name from onboarding ("The Parker Family"). */
  familyName: string;
  /** Whether onboarding has been completed. */
  onboarded: boolean;
  /**
   * Day 1 of the 365-day plan, as a local "YYYY-MM-DD" string. Set during
   * onboarding so the plan starts whenever the family begins.
   */
  planStartDate: string | null;
  /** @deprecated Migrated to morningReminder — kept for storage migration only. */
  reminder?: ReminderTime | null;
  /** Three optional rhythm reminders — null when disabled for that slot. */
  morningReminder: ReminderTime | null;
  dinnerReminder: ReminderTime | null;
  bedtimeReminder: ReminderTime | null;
  /** Children in the family for age-aware devotional questions. */
  children: ChildProfile[];
  /** Show seasonal overlays (Advent, etc.) when in range. */
  seasonalOverlaysEnabled: boolean;
  /** User choice when catch-up banner is shown. */
  catchUpChoice: CatchUpChoice | null;
  themePreference: ThemePreference;
  /** Index into TEXT_SCALE_STEPS. */
  textScaleIndex: number;
  /** Read-aloud narration speed. */
  speechRate: SpeechRate;
  /** Pause reminders and freeze streaks while traveling. */
  vacationMode: VacationMode;
  /** "What did we hear at church?" keyed by week-start Sunday YYYY-MM-DD. */
  sundayNotes: Record<string, string>;
  /** Discipling tip ids dismissed during days 1–14. */
  dismissedDisciplingTips: string[];

  setFamilyName: (name: string) => void;
  completeOnboarding: (opts: {
    familyName: string;
    planStartDate: string;
    morningReminder: ReminderTime | null;
    dinnerReminder: ReminderTime | null;
    bedtimeReminder: ReminderTime | null;
    children: ChildProfile[];
  }) => void;
  setPlanStartDate: (date: string) => void;
  setMorningReminder: (reminder: ReminderTime | null) => void;
  setDinnerReminder: (reminder: ReminderTime | null) => void;
  setBedtimeReminder: (reminder: ReminderTime | null) => void;
  setRhythmReminders: (reminders: {
    morning: ReminderTime | null;
    dinner: ReminderTime | null;
    bedtime: ReminderTime | null;
  }) => void;
  /** Back-compat: sets morning reminder only. */
  setReminder: (reminder: ReminderTime | null) => void;
  setChildren: (children: ChildProfile[]) => void;
  addChild: (child: ChildProfile) => void;
  removeChild: (index: number) => void;
  setSeasonalOverlaysEnabled: (enabled: boolean) => void;
  setCatchUpChoice: (choice: CatchUpChoice | null) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setTextScaleIndex: (index: number) => void;
  setSpeechRate: (rate: SpeechRate) => void;
  setVacationMode: (mode: VacationMode) => void;
  resumeFromVacation: () => void;
  setSundayNote: (weekKey: string, note: string) => void;
  dismissDisciplingTip: (tipId: string) => void;
  /** Sends the user back through onboarding on next launch of the tabs. */
  replayOnboarding: () => void;
  /** Apply settings from an imported backup (merge at call site). */
  applyImportedSettings: (partial: Partial<SettingsState>) => void;
}

export const DEFAULT_REMINDERS = {
  morning: { hour: 7, minute: 0 } as ReminderTime,
  dinner: { hour: 18, minute: 0 } as ReminderTime,
  bedtime: { hour: 20, minute: 0 } as ReminderTime,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      familyName: '',
      onboarded: false,
      planStartDate: null,
      morningReminder: null,
      dinnerReminder: null,
      bedtimeReminder: null,
      children: [],
      seasonalOverlaysEnabled: true,
      catchUpChoice: null,
      themePreference: 'system',
      textScaleIndex: 1,
      speechRate: 'normal',
      vacationMode: { ...DEFAULT_VACATION_MODE },
      sundayNotes: {},
      dismissedDisciplingTips: [],

      setFamilyName: (familyName) => set({ familyName }),
      completeOnboarding: ({
        familyName,
        planStartDate,
        morningReminder,
        dinnerReminder,
        bedtimeReminder,
        children,
      }) =>
        set({
          familyName,
          planStartDate,
          morningReminder,
          dinnerReminder,
          bedtimeReminder,
          children,
          onboarded: true,
        }),
      setPlanStartDate: (planStartDate) => set({ planStartDate }),
      setMorningReminder: (morningReminder) => set({ morningReminder }),
      setDinnerReminder: (dinnerReminder) => set({ dinnerReminder }),
      setBedtimeReminder: (bedtimeReminder) => set({ bedtimeReminder }),
      setRhythmReminders: ({ morning, dinner, bedtime }) =>
        set({
          morningReminder: morning,
          dinnerReminder: dinner,
          bedtimeReminder: bedtime,
        }),
      setReminder: (reminder) => set({ morningReminder: reminder }),
      setChildren: (children) => set({ children }),
      addChild: (child) => set((s) => ({ children: [...s.children, child] })),
      removeChild: (index) =>
        set((s) => ({ children: s.children.filter((_, i) => i !== index) })),
      setSeasonalOverlaysEnabled: (seasonalOverlaysEnabled) => set({ seasonalOverlaysEnabled }),
      setCatchUpChoice: (catchUpChoice) => set({ catchUpChoice }),
      setThemePreference: (themePreference) => set({ themePreference }),
      setTextScaleIndex: (textScaleIndex) =>
        set({ textScaleIndex: Math.max(0, Math.min(TEXT_SCALE_STEPS.length - 1, textScaleIndex)) }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setVacationMode: (vacationMode) => set({ vacationMode }),
      resumeFromVacation: () =>
        set({ vacationMode: { active: false, startDate: undefined, endDate: undefined } }),
      setSundayNote: (weekKey, note) =>
        set((s) => {
          const next = { ...s.sundayNotes };
          const trimmed = note.trim();
          if (trimmed) next[weekKey] = trimmed;
          else delete next[weekKey];
          return { sundayNotes: next };
        }),
      dismissDisciplingTip: (tipId) =>
        set((s) => ({
          dismissedDisciplingTips: s.dismissedDisciplingTips.includes(tipId)
            ? s.dismissedDisciplingTips
            : [...s.dismissedDisciplingTips, tipId],
        })),
      replayOnboarding: () => set({ onboarded: false }),
      applyImportedSettings: (partial) => set((s) => ({ ...s, ...partial, onboarded: true })),
    }),
    {
      name: 'ff-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as SettingsState & { reminder?: ReminderTime | null };
        if (version < 1) {
          if (state.reminder && !state.morningReminder) {
            state.morningReminder = state.reminder;
          }
          if (state.morningReminder === undefined) state.morningReminder = null;
          if (state.dinnerReminder === undefined) state.dinnerReminder = null;
          if (state.bedtimeReminder === undefined) state.bedtimeReminder = null;
          if (!state.children) state.children = [];
          if (state.seasonalOverlaysEnabled === undefined) state.seasonalOverlaysEnabled = true;
          if (state.catchUpChoice === undefined) state.catchUpChoice = null;
        }
        if (version < 2) {
          if (!state.vacationMode) state.vacationMode = { ...DEFAULT_VACATION_MODE };
          if (!state.sundayNotes) state.sundayNotes = {};
          if (!state.dismissedDisciplingTips) state.dismissedDisciplingTips = [];
        }
        return state as SettingsState;
      },
    }
  )
);

/** Convenience selector: the active text-size multiplier. */
export function useTextScale(): number {
  return useSettings((s) => TEXT_SCALE_STEPS[s.textScaleIndex] ?? 1);
}
