import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionLabel } from '@/components/SectionLabel';
import { VerseCard } from '@/components/VerseCard';
import { getPrayer } from '@/lib/content';
import { useTheme } from '@/lib/theme-context';
import { useFavorites, type FavoriteVerse } from '@/store/favorites';

/**
 * The Favorites tab: saved verses and saved daily prayers, newest first.
 */
export default function FavoritesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const favorites = useFavorites((s) => s.favorites);

  const verses = favorites.filter((f) => f.kind !== 'prayer');
  const prayers = favorites.filter((f) => f.kind === 'prayer');

  return (
    <Screen contentStyle={{ paddingTop: insets.top + theme.spacing.lg }}>
      <AppText variant="heading" semiBold accessibilityRole="header">
        Favorites
      </AppText>
      <AppText variant="small" color={theme.colors.textMuted} style={{ marginTop: 2 }}>
        The verses and prayers your family is holding onto.
      </AppText>

      {favorites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Nothing saved yet"
          message="When a verse or a daily prayer speaks to your family, tap its heart and it will live here."
        />
      ) : (
        <>
          {verses.length > 0 && (
            <>
              <SectionLabel>Saved verses</SectionLabel>
              <View style={{ gap: theme.spacing.md }}>
                {verses.map((f) => (
                  <View key={f.id}>
                    {f.topic ? (
                      <AppText
                        variant="caption"
                        bold
                        scaled={false}
                        color={theme.colors.goldDeep}
                        style={{ marginBottom: theme.spacing.xs }}
                      >
                        {f.topic.toUpperCase()}
                      </AppText>
                    ) : null}
                    <VerseCard reference={f.reference} text={f.text} topic={f.topic} />
                  </View>
                ))}
              </View>
            </>
          )}

          {prayers.length > 0 && (
            <>
              <SectionLabel color={theme.colors.green}>Saved prayers</SectionLabel>
              <View style={{ gap: theme.spacing.md }}>
                {prayers.map((f) => (
                  <FavoritePrayerCard key={f.id} favorite={f} />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </Screen>
  );
}

/** A saved daily prayer: preview with a link back to the full prayer screen. */
function FavoritePrayerCard({ favorite }: { favorite: FavoriteVerse }) {
  const theme = useTheme();
  const removeFavorite = useFavorites((s) => s.removeFavorite);
  const day = favorite.day;
  // Pull the live prayer content for the saved day (text is bundled).
  const prayer = day ? getPrayer(day) : null;

  return (
    <Card
      accent={theme.colors.green}
      onPress={day ? () => router.push(`/day/${day}/prayer`) : undefined}
      accessibilityLabel={favorite.reference}
      accessibilityHint="Opens this prayer to pray it together"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Ionicons name="rose" size={20} color={theme.colors.green} />
        <View style={{ flex: 1 }}>
          <AppText variant="body" semiBold scaled={false}>
            {prayer ? prayer.title : favorite.reference}
          </AppText>
          <AppText variant="caption" scaled={false}>
            {prayer ? `Day ${day} · ${prayer.theme}` : 'Daily prayer'}
          </AppText>
        </View>
        <Pressable
          onPress={() => removeFavorite(favorite.id)}
          accessibilityRole="button"
          accessibilityLabel={`Remove "${favorite.reference}" from favorites`}
          hitSlop={8}
          style={({ pressed }) => ({
            width: theme.minTouch - 8,
            height: theme.minTouch - 8,
            borderRadius: theme.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent',
          })}
        >
          <Ionicons name="heart" size={22} color={theme.colors.clay} />
        </Pressable>
      </View>
      {prayer ? (
        <AppText
          variant="body"
          italic
          serif
          numberOfLines={2}
          color={theme.colors.textMuted}
          style={{ marginTop: theme.spacing.sm }}
        >
          “{prayer.lines[0]}”
        </AppText>
      ) : null}
    </Card>
  );
}
