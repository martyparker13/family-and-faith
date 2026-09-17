/**
 * Import family backup with merge-keep-newer strategy.
 */
import { t } from '@/i18n/index';
import { BACKUP_VERSION, type FamilyBackup } from '@/lib/export-data';
import type { FavoriteVerse } from '@/store/favorites';
import type { JournalEntry } from '@/store/journal';
import type { PrayerRequest } from '@/store/prayer-list';

export interface MergeResult {
  ok: true;
  backup: FamilyBackup;
  warnings: string[];
}

export interface MergeError {
  ok: false;
  error: string;
}

export type ParseResult = MergeResult | MergeError;

/** Parse and validate backup JSON text. */
export function parseFamilyBackup(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: t('importErrors.invalidJson') };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: t('importErrors.emptyOrMalformed') };
  }

  const backup = parsed as FamilyBackup;
  if (backup.version !== BACKUP_VERSION && backup.version !== 1) {
    return {
      ok: false,
      error: t('importErrors.unsupportedVersion', { version: String((backup as FamilyBackup).version) }),
    };
  }
  if (!backup.progress || !backup.settings) {
    return { ok: false, error: t('importErrors.missingData') };
  }

  return { ok: true, backup, warnings: [] };
}

function mergeRecordByDay(
  local: Record<number, string>,
  incoming: Record<number, string>
): Record<number, string> {
  const next = { ...local };
  for (const [dayStr, dateISO] of Object.entries(incoming)) {
    const day = Number(dayStr);
    const existing = next[day];
    if (!existing || dateISO > existing) {
      next[day] = dateISO;
    }
  }
  return next;
}

function mergeJournal(
  local: Record<number, JournalEntry>,
  incoming: Record<number, JournalEntry>
): Record<number, JournalEntry> {
  const next = { ...local };
  for (const [dayStr, entry] of Object.entries(incoming)) {
    const day = Number(dayStr);
    const existing = next[day];
    if (!existing || entry.dateISO >= existing.dateISO) {
      next[day] = entry;
    }
  }
  return next;
}

function mergeFavorites(local: FavoriteVerse[], incoming: FavoriteVerse[]): FavoriteVerse[] {
  const byId = new Map(local.map((f) => [f.id, f]));
  for (const f of incoming) {
    const existing = byId.get(f.id);
    if (!existing || f.savedAt > existing.savedAt) {
      byId.set(f.id, f);
    }
  }
  return [...byId.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

function mergePrayerList(local: PrayerRequest[], incoming: PrayerRequest[]): PrayerRequest[] {
  const byId = new Map(local.map((r) => [r.id, r]));
  for (const r of incoming) {
    const existing = byId.get(r.id);
    if (!existing) {
      byId.set(r.id, r);
      continue;
    }
    const existingTime = existing.answeredAt ?? existing.createdAt;
    const incomingTime = r.answeredAt ?? r.createdAt;
    if (incomingTime >= existingTime) {
      byId.set(r.id, r);
    }
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mergeBooleanRecord(
  local: Record<number, boolean>,
  incoming: Record<number, boolean>
): Record<number, boolean> {
  return { ...local, ...incoming };
}

export interface LocalStores {
  journal: Record<number, JournalEntry>;
  favorites: FavoriteVerse[];
  prayerList: PrayerRequest[];
  progress: FamilyBackup['progress'];
}

/** Merge incoming backup into local stores (keep newer timestamps). */
export function mergeBackupIntoLocal(local: LocalStores, backup: FamilyBackup): LocalStores {
  return {
    progress: {
      completedDays: mergeRecordByDay(local.progress.completedDays, backup.progress.completedDays),
      devotionalDays: mergeRecordByDay(local.progress.devotionalDays, backup.progress.devotionalDays),
      prayerDays: mergeRecordByDay(local.progress.prayerDays, backup.progress.prayerDays),
      practicedWeeks: mergeRecordByDay(local.progress.practicedWeeks, backup.progress.practicedWeeks),
      slotCompletions: {
        morning: mergeRecordByDay(
          local.progress.slotCompletions.morning,
          backup.progress.slotCompletions?.morning ?? {}
        ),
        dinner: mergeRecordByDay(
          local.progress.slotCompletions.dinner,
          backup.progress.slotCompletions?.dinner ?? {}
        ),
        bedtime: mergeRecordByDay(
          local.progress.slotCompletions.bedtime,
          backup.progress.slotCompletions?.bedtime ?? {}
        ),
      },
      familyChallengesDone: mergeBooleanRecord(
        local.progress.familyChallengesDone,
        backup.progress.familyChallengesDone ?? {}
      ),
    },
    journal: mergeJournal(local.journal, backup.journal ?? {}),
    favorites: mergeFavorites(local.favorites, backup.favorites ?? []),
    prayerList: mergePrayerList(local.prayerList, backup.prayerList ?? []),
  };
}

/** Route a deep link path to an expo-router href. */
export function deepLinkToRoute(url: string): string | null {
  const match = url.match(/faithandfamily:\/\/(?:rhythm\/)?(morning|dinner|bedtime)/);
  if (match) return `/rhythm/${match[1]}`;
  if (url.includes('/rhythm/morning')) return '/rhythm/morning';
  if (url.includes('/rhythm/dinner')) return '/rhythm/dinner';
  if (url.includes('/rhythm/bedtime')) return '/rhythm/bedtime';
  return null;
}
