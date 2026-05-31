import type { ContentCard } from '@/features/content-cards/data';
import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ContentCardView } from '@/components/today/content-card';
import { useTheme } from '@/lib/ThemeContext';

export type CardsCarouselProps = {
  cards: ContentCard[];
};

const CARD_WIDTH = 280;

export function CardsCarousel({ cards }: CardsCarouselProps) {
  const { spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ spacing }),
    [spacing],
  );

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map(card => (
          <View key={card.id} style={styles.cardWrapper}>
            <ContentCardView card={card} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type StyleTokens = {
  spacing: GlipraTokens['spacing'];
};

function makeStyles({ spacing }: StyleTokens) {
  return StyleSheet.create({
    // Negative horizontal margin lets the scroll view bleed to screen edges
    // while paddingHorizontal keeps the first card aligned with page content.
    outerContainer: {
      marginHorizontal: -spacing.lg,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    cardWrapper: {
      width: CARD_WIDTH,
      marginRight: spacing.md,
    },
  });
}
