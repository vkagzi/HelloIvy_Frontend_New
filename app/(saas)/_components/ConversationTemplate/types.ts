import { ReactNode } from 'react';
import type { RealtimeTokenUsage } from '@/lib/realtime-voice-client';

export type Role = 'bot' | 'user';
export type ConversationMode = 'chat' | 'voice';

export interface ConversationMessage {
  id: string;
  type: Role;
  content: string;
  timestamp: string; // ISO
  /** Module-specific extra data (e.g. question_type, choices for domain) */
  extra?: Record<string, unknown>;
}

// ─── Color theme ────────────────────────────────────────────────
export interface ConversationTheme {
  /** Tailwind gradient from-color for background, e.g. 'from-teal-50' */
  bgFrom: string;
  /** Tailwind gradient to-color for background, e.g. 'to-cyan-100' */
  bgTo: string;
  /** Gradient from for user bubbles, e.g. 'from-teal-500' */
  bubbleFrom: string;
  /** Gradient to for user bubbles, e.g. 'to-cyan-500' */
  bubbleTo: string;
  /** Gradient from for CTA buttons, e.g. 'from-teal-600' */
  ctaFrom: string;
  /** Gradient to for CTA buttons, e.g. 'to-cyan-600' */
  ctaTo: string;
  /** Hover gradient from for CTA, e.g. 'from-teal-700' */
  ctaHoverFrom: string;
  /** Hover gradient to for CTA, e.g. 'to-cyan-700' */
  ctaHoverTo: string;
  /** Accent color for SessionTimer, e.g. 'teal' */
  timerAccent: 'purple' | 'teal';
  /** Accent color name for voice loading spinner border, e.g. 'teal' */
  accentName: 'purple' | 'teal';
  /** Timestamp text color for user messages, e.g. 'text-teal-100' */
  userTimestampColor: string;
}

// ─── API adapter ────────────────────────────────────────────────
export interface PauseResponse {
  is_paused: boolean;
  total_paused_seconds: number;
}

export interface SessionInfo {
  created_at?: string;
  is_completed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface HistoryMessage {
  message_id: string;
  type: Role;
  content: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface HistoryResponse {
  messages: HistoryMessage[];
  [key: string]: unknown;
}

export interface SendResponse {
  bot_response: string;
  is_complete: boolean;
  [key: string]: unknown;
}

export interface ConversationApi {
  getSession: (sessionId: string) => Promise<SessionInfo>;
  getMessages: (sessionId: string) => Promise<HistoryResponse>;
  sendMessage: (sessionId: string, content: string) => Promise<SendResponse>;
  togglePause: (sessionId: string) => Promise<PauseResponse>;
}

// ─── Callbacks for module-specific logic ────────────────────────
export interface ConversationCallbacks {
  /** Parse history response into messages + state. Called during init. */
  parseHistory: (
    historyResponse: HistoryResponse,
    sessionInfo: SessionInfo | null,
  ) => {
    messages: ConversationMessage[];
    questionsCompleted: number;
    progressPercentage: number;
    sessionEnded: boolean;
  };

  /** Parse send-message response into a bot message + updated state. */
  parseSendResponse: (response: SendResponse) => {
    botMessage: ConversationMessage;
    questionsCompleted: number;
    progressPercentage: number;
    sessionEnded: boolean;
  };

  /** Determine whether the "View Results" / "End" button should be enabled. */
  canEndConversation: (state: {
    sessionEnded: boolean;
    messages: ConversationMessage[];
    questionsCompleted: number;
  }) => boolean;

  /** Called when user clicks "End" / "View Results". Return the route to navigate to, or null to stay. */
  handleEnd: (params: {
    sessionId: string;
    sessionEnded: boolean;
    messages: ConversationMessage[];
  }) => Promise<string | null>;
}

// ─── Render slots for module-specific UI ────────────────────────
export interface ConversationSlots {
  /** Custom rendering for a bot message (e.g. choice buttons). Return null to use default. */
  renderBotMessageExtra?: (params: {
    message: ConversationMessage;
    isLatest: boolean;
    isLoading: boolean;
    onOptionSelect?: (choice: string) => void;
  }) => ReactNode | null;

  /** Custom content shown when session is complete (before input area). */
  renderCompletionBanner?: (params: {
    sessionId: string;
    onViewResults: () => void;
  }) => ReactNode | null;

  /** Custom status text shown when bot is loading. Default: "[Module] AI is thinking…" */
  loadingText?: string;

  /** Whether to show the text input or a custom hint instead. Return a string to show that hint. */
  inputBlockReason?: (params: {
    isLoading: boolean;
    messages: ConversationMessage[];
    sessionEnded: boolean;
  }) => string | null;

  /** Debug dialog component to render */
  renderDebugDialog?: (params: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionId: string;
    isTimerExpired: boolean;
    debugOverrideTimerBlock: boolean;
    onDebugOverrideTimerBlockChange: (value: boolean) => void;
    realtimeTokenUsage?: RealtimeTokenUsage | null;
  }) => ReactNode;

  /** Exit confirmation dialog (optional, e.g. domain discovery warns you) */
  renderExitDialog?: (params: {
    onConfirm: () => void;
    onCancel: () => void;
  }) => ReactNode;
}

// ─── Main config ────────────────────────────────────────────────
export interface ConversationConfig {
  /** Module identifier, e.g. 'domain-discovery' */
  featureId: string;
  /** Display label for voice hook, e.g. 'DomainDiscovery' */
  featureLabel: string;
  /** Page title with emoji, e.g. '🧭 Domain Discovery Journey' */
  pageTitle: string;
  /** Base route for the module, e.g. '/domain-discovery' */
  baseRoute: string;
  /** localStorage key prefix, e.g. 'domain_conversation_transcript' */
  transcriptKeyPrefix: string;
  /** Theme configuration */
  theme: ConversationTheme;
  /** API adapter */
  api: ConversationApi;
  /** Module-specific logic callbacks */
  callbacks: ConversationCallbacks;
  /** Optional UI customization slots */
  slots?: ConversationSlots;
}
