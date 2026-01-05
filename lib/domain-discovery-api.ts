/**
 * Domain Discovery API Client
 * Connects to Django backend using LangChain + Azure OpenAI for AI-powered domain discovery
 */
import api from './api';

// ================== Types ==================

export interface DomainMessage {
  message_id: string;
  type: 'bot' | 'user';
  content: string;
  step_number: number;
  phase: 'exploration' | 'mapping';
  timestamp: string;
}

export interface DomainDiscoverySession {
  session_id: string;
  current_step: number;
  total_steps: number;
  current_phase: 'exploration' | 'mapping';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  messages: DomainMessage[];
}

export interface SendMessageResponse {
  session_id: string;
  user_message: string;
  bot_response: string;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
  phase: 'exploration' | 'mapping';
}

export interface DomainRecommendation {
  id?: number;
  domain_title: string;
  category: string;
  match_percentage: number;
  key_interests: string[];
  sub_domains: string[];
  related_subjects: string[];
  description: string;
  why_recommended: string;
  exploration_activities: string[];
  potential_careers: string[];
  rank?: number;
}

export interface RecommendationsResponse {
  session_id: string;
  recommendations: DomainRecommendation[];
  total_count: number;
}

export interface MessageHistoryResponse {
  session_id: string;
  messages: DomainMessage[];
  current_step: number;
  total_steps: number;
  current_phase: 'exploration' | 'mapping';
  is_active: boolean;
}

export interface TranscribeResponse {
  text: string;
}

export interface SessionListItem {
  session_id: string;
  current_step: number;
  total_steps: number;
  current_phase: 'exploration' | 'mapping';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  sessions: SessionListItem[];
  total_count: number;
}

// ================== API Class ==================

class DomainDiscoveryAPI {
  private baseUrl = '/api/domain-discovery';

  /**
   * Create a new domain discovery session
   * Returns the session with the initial bot message
   */
  async createSession(): Promise<DomainDiscoverySession> {
    return api<DomainDiscoverySession>(`${this.baseUrl}/`, {
      method: 'POST',
    });
  }

  /**
   * Get the current active session for the user
   */
  async getCurrentSession(): Promise<DomainDiscoverySession> {
    return api<DomainDiscoverySession>(`${this.baseUrl}/current/`);
  }

  /**
   * List all sessions for the user
   */
  async listSessions(): Promise<SessionListResponse> {
    return api<SessionListResponse>(`${this.baseUrl}/list/`);
  }

  /**
   * Send a message in the conversation and get the AI response
   */
  async sendMessage(
    sessionId: string,
    content: string
  ): Promise<SendMessageResponse> {
    return api<SendMessageResponse>(`${this.baseUrl}/${sessionId}/messages/`, {
      method: 'POST',
      body: {
        content: content,
      },
    });
  }

  /**
   * Get all messages for a session
   */
  async getMessages(sessionId: string): Promise<MessageHistoryResponse> {
    return api<MessageHistoryResponse>(
      `${this.baseUrl}/${sessionId}/messages/history/`
    );
  }

  /**
   * End a domain discovery session
   */
  async endSession(sessionId: string): Promise<void> {
    return api<void>(`${this.baseUrl}/${sessionId}/end/`, {
      method: 'POST',
    });
  }

  /**
   * Generate domain recommendations based on the conversation
   */
  async generateRecommendations(
    sessionId: string
  ): Promise<RecommendationsResponse> {
    return api<RecommendationsResponse>(`${this.baseUrl}/${sessionId}/recommendations/generate/`, {
      method: 'POST',
    });
  }

  /**
   * Get stored recommendations for a session
   */
  async getRecommendations(sessionId: string): Promise<RecommendationsResponse> {
    return api<RecommendationsResponse>(
      `${this.baseUrl}/${sessionId}/recommendations/`
    );
  }

  /**
   * Transcribe audio to text using backend Whisper
   */
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const fullUrl = `${baseUrl}${this.baseUrl}/audio/transcribe/`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to transcribe audio: ${errorText}`);
    }

    const data: TranscribeResponse = await response.json();
    return data.text;
  }

  /**
   * Generate speech from text using backend TTS
   * Returns audio blob
   */
  async generateSpeech(text: string, voice: string = 'nova'): Promise<Blob> {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const fullUrl = `${baseUrl}${this.baseUrl}/audio/speech/`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate speech: ${errorText}`);
    }

    return response.blob();
  }

  /**
   * Health check for the domain discovery service
   */
  async healthCheck(): Promise<{
    status: string;
    service: string;
    message: string;
  }> {
    return api<{ status: string; service: string; message: string }>(
      `${this.baseUrl}/health/`
    );
  }
}

// Export singleton instance
export const domainDiscoveryApi = new DomainDiscoveryAPI();

// Legacy type export for compatibility
export type DomainDiscoveryMessage = DomainMessage;
