// Route: /coach
// AI Nutrition Coach screen — registered as a permanent 5th tab in the bottom nav.
// Free users can read the welcome message; the composer (chips + input) is wrapped in
// ProGate so unsubscribed users see the Pro upgrade card as a teaser.
//
// Rule 8: DisclaimerBanner tier={2} is rendered between the header and message list.
// Rule 10: Medication keyword blocking is enforced in the edge function, not here.
//          The UI does not attempt client-side filtering — the server is authoritative.
//          Suggestion chips are food-only.

import type { CoachMessage } from '@/features/ai-coach/hooks';
import type { MealType } from '@/features/meal-ideas/context';
import type { GlipraTokens } from '@/theme/tokens';

import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { ArrowRight, ChatBubble } from '@/components/ui/icons';
import { useAiCoach } from '@/features/ai-coach/hooks';
import { useMealIdeas } from '@/features/meal-ideas/hooks';
import { MealIdeasCard } from '@/features/meal-ideas/meal-ideas-card';
import { ProGate } from '@/features/subscription/pro-gate';
import { useSubscription } from '@/features/subscription/use-subscription';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// ---------------------------------------------------------------------------
// Coach avatar — small chat glyph shown beside assistant bubbles.
// ---------------------------------------------------------------------------

function CoachAvatar() {
  const { colors, radius } = useTheme();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: radius.full,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ChatBubble color={colors.primary} width={16} height={16} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  return (
    <View style={[styles.messageRow, styles.assistantRow]}>
      <CoachAvatar />
      <View style={styles.typingBubble}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
        <Text style={styles.typingText}>{t('coach.thinking')}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Individual message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: CoachMessage }) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View style={[styles.messageRow, styles.userRow]}>
        <View style={[styles.bubble, styles.userBubble]}>
          <Text style={[styles.bubbleText, styles.userBubbleText]}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, styles.assistantRow]}>
      <CoachAvatar />
      <View style={[styles.bubble, styles.assistantBubble]}>
        <Text style={[styles.bubbleText, styles.assistantBubbleText]}>{message.content}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CoachScreen() {
  const { t } = useTranslation();
  const { messages, sendMessage, isLoading } = useAiCoach();
  const { result: mealIdeas, request: requestMealIdeas, isLoading: mealIdeasLoading } = useMealIdeas();
  const { isPro } = useSubscription();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<CoachMessage>>(null);
  const { colors, spacing, radius, shadows, gradients } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  const isEmpty = messages.length === 0;
  const welcomeMessage: CoachMessage = {
    id: 'welcome',
    role: 'assistant',
    content: t('coach.welcome'),
    timestamp: new Date(),
  };
  const listData: CoachMessage[] = [welcomeMessage, ...messages];

  const suggestions = [
    t('coach.suggest_protein'),
    t('coach.suggest_snacks'),
    t('coach.suggest_appetite'),
  ];

  const mealChips: { type: MealType; label: string }[] = [
    { type: 'breakfast', label: t('coach.meal_ideas_breakfast') },
    { type: 'lunch', label: t('coach.meal_ideas_lunch') },
    { type: 'dinner', label: t('coach.meal_ideas_dinner') },
    { type: 'snack', label: t('coach.meal_ideas_snack') },
  ];

  const handleMealIdeas = (type: MealType) => {
    if (mealIdeasLoading)
      return;
    haptics.medium();
    void requestMealIdeas(type);
  };

  const handleSend = async (preset?: string) => {
    const text = (preset ?? inputText).trim();
    if (!text || isLoading)
      return;

    haptics.medium();
    if (!preset)
      setInputText('');
    await sendMessage(text);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const isSendDisabled = isLoading || inputText.trim().length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Gradient hero header */}
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>{t('coach.title')}</Text>
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText}>{t('coach.trust')}</Text>
          </View>
        </LinearGradient>

        {/* Tier-2 disclaimer — Rule 8 */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            For nutrition guidance only. Not medical advice. Contact your prescriber for medication questions.
          </Text>
        </DisclaimerBanner>

        {/* Message area: a centered welcome (empty) or the conversation list */}
        {isEmpty
          ? (
              <ScrollView
                style={styles.emptyScroll}
                contentContainerStyle={styles.emptyScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.emptyAvatar}>
                  <ChatBubble color={colors.primary} width={28} height={28} />
                </View>
                <Text style={styles.emptyText}>{t('coach.welcome')}</Text>
                {isPro && (
                  <>
                    <View style={styles.chipsRow}>
                      {suggestions.map(s => (
                        <Pressable
                          key={s}
                          testID="coach-chip"
                          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                          onPress={() => { void handleSend(s); }}
                          accessibilityRole="button"
                          accessibilityLabel={s}
                        >
                          <Text style={styles.chipText}>{s}</Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Meal ideas — on-demand, Pro. Educational ideas, not a plan. */}
                    <Text style={styles.mealIdeasLabel}>{t('coach.meal_ideas_label')}</Text>
                    <View style={styles.chipsRow}>
                      {mealChips.map(c => (
                        <Pressable
                          key={c.type}
                          testID="meal-idea-chip"
                          style={({ pressed }) => [
                            styles.chip,
                            mealIdeasLoading && styles.chipDisabled,
                            pressed && !mealIdeasLoading && styles.chipPressed,
                          ]}
                          onPress={() => handleMealIdeas(c.type)}
                          disabled={mealIdeasLoading}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: mealIdeasLoading }}
                          accessibilityLabel={c.label}
                        >
                          <Text style={styles.chipText}>{c.label}</Text>
                        </Pressable>
                      ))}
                    </View>

                    {mealIdeasLoading && (
                      <View style={styles.mealLoadingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.typingText}>{t('coach.meal_ideas_loading')}</Text>
                      </View>
                    )}

                    {mealIdeas && !mealIdeasLoading && (
                      <View style={styles.mealCardWrap}>
                        <MealIdeasCard result={mealIdeas} />
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )
          : (
              <FlatList
                ref={flatListRef}
                data={listData}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <MessageBubble message={item} />}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                ListFooterComponent={isLoading ? <TypingIndicator /> : null}
              />
            )}

        {/* Composer — Pro gated (reading is free; sending is Pro) */}
        <ProGate featureName="AI Nutrition Coach">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('coach.placeholder')}
              placeholderTextColor={colors.textDisabled}
              maxLength={500}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => { void handleSend(); }}
              editable={!isLoading}
              accessibilityLabel="Message input"
            />
            <Pressable
              testID="coach-send"
              style={({ pressed }) => [
                styles.sendButton,
                isSendDisabled && styles.sendButtonDisabled,
                pressed && !isSendDisabled && styles.sendButtonPressed,
              ]}
              onPress={() => { void handleSend(); }}
              disabled={isSendDisabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSendDisabled, busy: isLoading }}
              accessibilityLabel={t('coach.send')}
            >
              {isLoading
                ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  )
                : (
                    <ArrowRight
                      color={isSendDisabled ? colors.textDisabled : colors.textInverse}
                      width={22}
                      height={22}
                    />
                  )}
            </Pressable>
          </View>
        </ProGate>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoiding: {
      flex: 1,
    },

    // Gradient hero header
    hero: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: -0.5,
    },
    trustPill: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
      borderRadius: radius.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    trustPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#ffffff',
    },

    // Disclaimer
    disclaimerText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },

    // Message list
    messageList: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
      flexGrow: 1,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    userRow: {
      justifyContent: 'flex-end',
    },
    assistantRow: {
      justifyContent: 'flex-start',
    },

    // Bubbles
    bubble: {
      maxWidth: '78%',
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    userBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: radius.sm,
    },
    assistantBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.sm,
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userBubbleText: {
      color: colors.textInverse,
    },
    assistantBubbleText: {
      color: colors.textPrimary,
    },

    // Typing indicator
    typingBubble: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderBottomLeftRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      ...shadows.sm,
    },
    typingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },

    // Empty state (centered welcome + chips + meal ideas) — scrollable so the
    // meal-ideas card can grow past the viewport.
    emptyScroll: {
      flex: 1,
    },
    emptyScrollContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.md,
    },
    mealIdeasLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    mealLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    mealCardWrap: {
      alignSelf: 'stretch',
      marginTop: spacing.xs,
    },
    emptyAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // Suggestion chips
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipPressed: {
      backgroundColor: colors.primaryLight,
    },
    chipDisabled: {
      opacity: 0.5,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },

    // Input row
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    textInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.full,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.gray200,
    },
    sendButtonPressed: {
      backgroundColor: colors.primaryDark,
    },
  });
}
