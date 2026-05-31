// AI Coach feature hooks.
//
// Non-negotiable rules enforced here:
//   Rule 1  — Client calls supabase.functions.invoke('ai-coach'), never OpenAI directly.
//   Rule 2  — No PII is included in the context payload sent to the edge function.
//   Cost rule — When EXPO_PUBLIC_USE_MOCK_AI=true, return MOCK_COACH_REPLY
//               without calling the edge function (simulates an 800ms delay).
//
// Messages are intentionally NOT persisted to Supabase — privacy + cost reasons.
// Conversation state lives only in local React state for the lifetime of the screen.

import { useCallback, useState } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { unlockMilestone } from '@/features/journey-cards/api';
import { analytics, EVENTS } from '@/lib/analytics';
import { isMockAIEnabled, MOCK_COACH_REPLY } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoachMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type CoachContext = {
  proteinFloorG?: number;
  proteinConsumedG?: number;
  injectionPhase?: string;
  // Rule 2: No PII — no name, email, weight, or identifying fields.
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAiCoach() {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  // Messages are local-only — not persisted to Supabase.
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string, context?: CoachContext) => {
      if (!userMessage.trim())
        return;

      setError(null);

      // Append the user's message immediately so the UI feels responsive.
      const userMsg: CoachMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      // Track that a message was sent — no message content in properties (Rule 2)
      analytics.capture(EVENTS.COACH_MESSAGE_SENT);

      try {
        let replyContent: string;

        if (isMockAIEnabled()) {
          // Cost rule: return mock data without calling the edge function.
          // Simulate a realistic network delay so the UI isn't jarring.
          await new Promise<void>(resolve => setTimeout(resolve, 800));
          replyContent = MOCK_COACH_REPLY;
        }
        else {
          // Rule 1: Call the edge function — never OpenAI directly from the client.
          // Rule 2: Only nutrition context is sent — no PII.
          const { data, error: fnError } = await supabase.functions.invoke('ai-coach', {
            body: {
              message: userMessage.trim(),
              context: context ?? undefined,
            },
          });

          if (fnError) {
            throw new Error(fnError.message ?? 'Coach unavailable');
          }

          if (!data?.reply || typeof data.reply !== 'string') {
            throw new Error('Unexpected response format from coach');
          }

          replyContent = data.reply as string;
        }

        const assistantMsg: CoachMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMsg]);

        // Unlock coach_conversation milestone (idempotent — safe every message)
        if (userId) {
          unlockMilestone(userId, 'coach_conversation').catch(() => {});
        }
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);

        // Append a visible error message in the chat so the user knows what happened.
        const errorMsg: CoachMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I\'m having trouble right now. Please try again shortly.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
      finally {
        setIsLoading(false);
      }
    },
    [userId],
  );

  return { messages, sendMessage, isLoading, error };
}
