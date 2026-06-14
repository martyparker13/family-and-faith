import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Pressable, Share, View } from 'react-native';

import { AppText } from './AppText';
import { Card } from './Card';
import { useTheme } from '@/lib/theme-context';
import { useFavorites, verseId } from '@/store/favorites';

interface VerseCardProps {
  reference: string;
  text: string;
  /** Topic name recorded with the favorite, when saved from Guidance. */
  topic?: string;
}

/**
 * A scripture card with favorite / copy / share actions — used in Guidance
 * results and the Favorites tab.
 */
export function VerseCard({ reference, text, topic }: VerseCardProps) {
  const theme = useTheme();
  const id = verseId(reference);
  const isFavorite = useFavorites((s) => s.favorites.some((f) => f.id === id));
  const toggleFavorite = useFavorites((s) => s.toggleFavorite);

  const copy = async () => {
    await Clipboard.setStringAsync(`"${text}" — ${reference} (WEB)`);
  };

  const share = async () => {
    await Share.share({ message: `"${text}"\n— ${reference} (World English Bible)` });
  };

  return (
    <Card accent={theme.colors.gold}>
      <AppText variant="scripture">“{text}”</AppText>
      <AppText
        variant="small"
        semiBold
        color={theme.colors.goldDeep}
        style={{ marginTop: theme.spacing.sm }}
      >
        {reference}
      </AppText>
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
        }}
      >
        <ActionIcon
          name={isFavorite ? 'heart' : 'heart-outline'}
          label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          color={isFavorite ? theme.colors.clay : theme.colors.textMuted}
          onPress={() => toggleFavorite({ id, reference, text, topic })}
        />
        <ActionIcon
          name="copy-outline"
          label="Copy verse"
          color={theme.colors.textMuted}
          onPress={copy}
        />
        <ActionIcon
          name="share-outline"
          label="Share verse"
          color={theme.colors.textMuted}
          onPress={share}
        />
      </View>
    </Card>
  );
}

function ActionIcon({
  name,
  label,
  color,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        width: theme.minTouch,
        height: theme.minTouch,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? theme.colors.surfaceAlt : 'transparent',
      })}
    >
      <Ionicons name={name} size={24} color={color} />
    </Pressable>
  );
}
