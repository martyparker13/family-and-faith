import { router } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { MAX_CONTENT_WIDTH } from '@/components/Screen';
import { currentPlanDay, dateToISO, isoToDate, todayISO } from '@/lib/dates';
import { useTheme } from '@/lib/theme-context';
import { percentComplete, useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

const WEEK_ROWS = 6; // every month renders 6 rows so cards are uniform height
const CELL_HEIGHT = 46;
const MONTH_HEADER_HEIGHT = 64;
const MONTH_CARD_HEIGHT = MONTH_HEADER_HEIGHT + WEEK_ROWS * CELL_HEIGHT + 24;

interface MonthEntry {
  key: string;
  year: number;
  /** 0-based month. */
  month: number;
}

/** Months spanned by the 365-day plan, first to last. */
function planMonths(planStartISO: string): MonthEntry[] {
  const start = isoToDate(planStartISO);
  const end = isoToDate(planStartISO);
  end.setDate(end.getDate() + 364);

  const months: MonthEntry[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1, 12);
  while (cursor.getFullYear() < end.getFullYear() ||
         (cursor.getFullYear() === end.getFullYear() && cursor.getMonth() <= end.getMonth())) {
    months.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/**
 * The Plan tab as a calendar: one card per month across the family's
 * 365-day journey. Completed readings show a small gold cross; today is
 * ringed in gold. Tapping any in-plan date opens that day's reading.
 */
export default function PlanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const planStartDate = useSettings((s) => s.planStartDate) ?? todayISO();
  const completedDays = useProgress((s) => s.completedDays);
  const listRef = useRef<FlatList<MonthEntry>>(null);

  const today = todayISO();
  const todayPlanDay = currentPlanDay(planStartDate, today);
  const percent = percentComplete(completedDays);

  const months = useMemo(() => planMonths(planStartDate), [planStartDate]);

  // Open the list on the current month.
  const todayDate = isoToDate(today);
  const initialIndex = Math.max(
    0,
    months.findIndex((m) => m.year === todayDate.getFullYear() && m.month === todayDate.getMonth())
  );

  const getItemLayout = useMemo(
    () => (_: unknown, index: number) => ({
      length: MONTH_CARD_HEIGHT,
      offset: MONTH_CARD_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: insets.top + theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}
      >
        <AppText variant="heading" accessibilityRole="header" semiBold>
          Reading Plan
        </AppText>
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
          <ProgressBar percent={percent} />
          <AppText variant="caption" scaled={false}>
            {Object.keys(completedDays).length} of 365 days · {percent}% of the journey
          </AppText>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={months}
        keyExtractor={(m) => m.key}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        contentContainerStyle={{
          paddingBottom: insets.bottom + theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
          width: '100%',
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: 'center',
        }}
        renderItem={({ item }) => (
          <MonthCard
            entry={item}
            planStartISO={planStartDate}
            todayISOString={today}
            todayPlanDay={todayPlanDay}
            completedDays={completedDays}
          />
        )}
      />
    </View>
  );
}

function MonthCard({
  entry,
  planStartISO,
  todayISOString,
  todayPlanDay,
  completedDays,
}: {
  entry: MonthEntry;
  planStartISO: string;
  todayISOString: string;
  todayPlanDay: number;
  completedDays: Record<number, string>;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const monthTitle = new Date(entry.year, entry.month, 1, 12).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Sunday-first weekday letters, localized.
  const weekdayLetters = useMemo(() => {
    const letters: string[] = [];
    const d = new Date(2026, 5, 7, 12); // a Sunday
    for (let i = 0; i < 7; i++) {
      letters.push(d.toLocaleDateString(undefined, { weekday: 'narrow' }));
      d.setDate(d.getDate() + 1);
    }
    return letters;
  }, []);

  const firstWeekday = new Date(entry.year, entry.month, 1, 12).getDay();
  const daysInMonth = new Date(entry.year, entry.month + 1, 0, 12).getDate();
  const start = isoToDate(planStartISO);

  const cells: ({ dateNum: number; planDay: number | null; iso: string } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(entry.year, entry.month, d, 12);
    const diff = Math.round((date.getTime() - start.getTime()) / 86_400_000);
    const planDay = diff >= 0 && diff < 365 ? diff + 1 : null;
    cells.push({ dateNum: d, planDay, iso: dateToISO(date) });
  }
  while (cells.length < WEEK_ROWS * 7) cells.push(null);

  const gridWidth = Math.min(width, MAX_CONTENT_WIDTH) - theme.spacing.lg * 2;
  const cellWidth = gridWidth / 7;

  return (
    <View style={{ height: MONTH_CARD_HEIGHT, paddingTop: theme.spacing.lg }}>
      <AppText variant="title" semiBold accessibilityRole="header">
        {monthTitle}
      </AppText>
      <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
        {weekdayLetters.map((letter, i) => (
          <View key={i} style={{ width: cellWidth, alignItems: 'center' }}>
            <AppText variant="caption" bold scaled={false} color={theme.colors.textMuted}>
              {letter}
            </AppText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
        {cells.map((cell, i) => {
          if (!cell) {
            return <View key={i} style={{ width: cellWidth, height: CELL_HEIGHT }} />;
          }
          const inPlan = cell.planDay !== null;
          const done = inPlan && Boolean(completedDays[cell.planDay!]);
          const isToday = cell.iso === todayISOString;
          const isFuture = inPlan && cell.planDay! > todayPlanDay;

          return (
            <Pressable
              key={i}
              disabled={!inPlan}
              onPress={() => router.push(`/day/${cell.planDay}/reading`)}
              accessibilityRole="button"
              accessibilityLabel={
                inPlan
                  ? `Day ${cell.planDay}${done ? ', completed' : ''}${isToday ? ', today' : ''}`
                  : undefined
              }
              style={({ pressed }) => ({
                width: cellWidth,
                height: CELL_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done ? theme.colors.green : 'transparent',
                  borderWidth: isToday ? 2 : 0,
                  borderColor: theme.colors.gold,
                }}
              >
                {done ? (
                  <AppText
                    variant="body"
                    bold
                    scaled={false}
                    color={theme.colors.onAccent}
                    style={{ lineHeight: 22 }}
                  >
                    ✝
                  </AppText>
                ) : (
                  <AppText
                    variant="small"
                    semiBold={isToday}
                    scaled={false}
                    color={
                      !inPlan
                        ? theme.colors.border
                        : isFuture
                          ? theme.colors.textMuted
                          : theme.colors.text
                    }
                  >
                    {cell.dateNum}
                  </AppText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
