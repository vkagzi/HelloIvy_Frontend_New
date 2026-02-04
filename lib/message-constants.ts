/**
 * Shared constants for message types across all conversation modules.
 * Use these constants instead of hardcoded strings to ensure consistency.
 */

/**
 * Message type constants for internal app use (matches backend database types)
 */
export const MessageType = {
  BOT: 'bot',
  USER: 'user',
} as const;

export type MessageTypeValue = typeof MessageType[keyof typeof MessageType];

/**
 * OpenAI API role constants (used when calling OpenAI API directly)
 */
export const OpenAIRole = {
  SYSTEM: 'system',
  USER: 'user',
  ASSISTANT: 'assistant',
} as const;

export type OpenAIRoleValue = typeof OpenAIRole[keyof typeof OpenAIRole];
