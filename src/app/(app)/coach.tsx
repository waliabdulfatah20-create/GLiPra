// Route: /coach
// AI Nutrition Coach screen — registered as a permanent 5th tab in the bottom nav.
// Free users can read the welcome message; the send input is wrapped in ProGate
// so unsubscribed users see the Pro upgrade card as a teaser.
//
// Rule 8: DisclaimerBanner tier={2} is rendered between the header and message list.
// Rule 10: Medication keyword blocking is enforced in the edge function, not here.
//          The UI does not attempt client-side filtering — the server is authoritative.

import * as React from 'react';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { useAiCoach } from '@/features/ai-coach/hooks';
import type { CoachMessage } from '@/features/ai-coach/hooks';
import { ProGate } from '@/features/subscription/pro-gate';
import { colors, radius, spacing } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Welcome message — pre-loaded before the user sends anything.
// ---------------------------------------------------------------------------

const WELCOME_MESSAGE: CoachMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I can help with protein goals, meal ideas, hydration, and food strategies. " +
    "What would you like to know?",
  timestamp: new Date(),
};

// ---------------------------------------------------------------------------
// Typing indicator component
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <View style={styles.typingRow}>
      <View style={styles.assistantBubble}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
        <Text style={styles.typingText}>Thinking…</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Individual message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.assistantBubbleText]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function CoachScreen() {
  const { messages, sendMessage, isLoading } = useAiCoach();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<CoachMessage>>(null);

  // Combine the welcome message with live messages.
  const allMessages: CoachMessage[] = [WELCOME_MESSAGE, ...messages];

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    await sendMessage(text);

    // Scroll to the bottom after sending.
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
        {/* Header — tab root, no back button */}
        <View style={styles.header}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Nutrition Coach</Text>
            <Text style={styles.headerSubtitle}>Powered by pharmacist guidelines</Text>
          </View>
        </View>

        {/* Tier-2 disclaimer — Rule 8 */}
        <DisclaimerBanner tier={2}>
          <Text style={styles.disclaimerText}>
            For nutrition guidance only. Not medical advice. Contact your prescriber for medication questions.
          </Text>
        </DisclaimerBanner>

        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={allMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
        />

        {/* Input row — Pro gated (reading coach messages is free; sending is Pro) */}
        <ProGate featureName="AI Nutrition Coach">
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about protein, meals, hydration…"
              placeholderTextColor={colors.textDisabled}
              maxLength={500}
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSend}
              editable={!isLoading}
              accessibilityLabel="Message input"
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                isSendDisabled && styles.sendButtonDisabled,
                pressed && !isSendDisabled && styles.sendButtonPressed,
              ]}
              onPress={handleSend}
              disabled={isSendDisabled}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={[styles.sendButtonText, isSendDisabled && styles.sendButtonTextDisabled]}>
                Send
              </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
    marginBottom: spacing.sm,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  assistantRow: {
    alignItems: 'flex-start',
  },

  // Bubbles
  bubble: {
    maxWidth: '80%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  typingRow: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  typingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
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
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textInverse,
  },
  sendButtonTextDisabled: {
    color: colors.textDisabled,
  },
});
