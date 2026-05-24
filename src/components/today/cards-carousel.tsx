import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ContentCardView } from '@/components/today/content-card';
import type { ContentCard } from '@/features/content-cards/data';
import { spacing } from '@/theme/colors';

export interface CardsCarouselProps {
  cards: ContentCard[];
}

const CARD_WIDTH = 280;

export function CardsCarousel({ cards }: CardsCarouselProps) {
  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map((card) => (
          <View key={card.id} style={styles.cardWrapper}>
            <ContentCardView card={card} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
