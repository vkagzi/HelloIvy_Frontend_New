/**
 * Career Discovery API Client
 * Connects to Django backend using LangChain + Azure OpenAI for AI-powered career discovery
 */
import api from '@/lib/api';

// ================== Types ==================

export interface CareerMessage {
  message_id: string;
  type: 'bot' | 'user';
  content: string;
  step_number: number;
  phase: 'profile' | 'explorer';
  medium?: 'text' | 'voice';
  timestamp: string;
}

export interface CareerDiscoverySession {
  session_id: string;
  domain_session_id?: string | null;
  current_step: number;
  total_steps: number;
  current_phase: 'profile' | 'explorer';
  is_active: boolean;
  is_completed: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  messages: CareerMessage[];
}

export interface SendMessageResponse {
  session_id: string;
  user_message: string;
  bot_response: string;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
  phase: 'profile' | 'explorer';
}

export interface CareerRecommendation {
  id?: number;
  career_title: string;
  salary_range: string;
  match_percentage: number;
  required_skills: string[];
  next_steps: string[];
  description: string;
  why_recommended: string;
  alignment_points: string[];
  day_in_life: string;
  pros_and_cons: { pros: string[]; cons: string[] };
  work_life_balance: string;
  rank?: number;
}

export interface RecommendationsResponse {
  session_id: string;
  recommendations: CareerRecommendation[];
  total_count: number;
}

export interface MessageHistoryResponse {
  session_id: string;
  messages: CareerMessage[];
  current_step: number;
  total_steps: number;
  total_questions: number;
  current_phase: 'profile' | 'explorer';
  is_active: boolean;
  is_completed: boolean;
}

export interface TranscribeResponse {
  text: string;
}

export interface SessionListItem {
  session_id: string;
  domain_session_id?: string | null;
  current_step: number;
  total_steps: number;
  current_phase: 'profile' | 'explorer';
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  sessions: SessionListItem[];
  total_count: number;
}

// ================== API Class ==================

class CareerDiscoveryAPI {
  private baseUrl = '/api/career-discovery';

  /**
   * Create a new career discovery session
   * Returns the session with the initial bot message
   */
  async createSession(
    domainSessionId: string
  ): Promise<CareerDiscoverySession> {
    return api<CareerDiscoverySession>(`${this.baseUrl}/`, {
      method: 'POST',
      body: {
        domain_session_id: domainSessionId,
      },
    });
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<CareerDiscoverySession> {
    return api<CareerDiscoverySession>(`${this.baseUrl}/${sessionId}/`);
  }

  /**
   * @deprecated Use getSession(sessionId) instead
   */
  async getCurrentSession(): Promise<CareerDiscoverySession> {
    // Legacy: callers should migrate to getSession(sessionId)
    throw new Error('getCurrentSession is removed. Use getSession(sessionId) instead.');
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
   * End a career discovery session
   */
  async endSession(sessionId: string): Promise<void> {
    return api<void>(`${this.baseUrl}/${sessionId}/end/`, {
      method: 'POST',
    });
  }

  /**
   * Generate career recommendations based on the conversation
   */
  async generateRecommendations(
    sessionId: string
  ): Promise<RecommendationsResponse> {
    return api<RecommendationsResponse>(
      `${this.baseUrl}/${sessionId}/recommendations/generate/`,
      {
        method: 'POST',
      }
    );
  }

  /**
   * Get stored recommendations for a session
   */
  async getRecommendations(
    sessionId: string
  ): Promise<RecommendationsResponse> {
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
   * Health check for the career discovery service
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

  /**
   * Get debug information including system prompts, model info, and user context
   */
  async getDebugInfo(sessionId: string): Promise<CareerDebugInfo> {
    return api<CareerDebugInfo>(`${this.baseUrl}/${sessionId}/debug/`);
  }

  /**
   * Toggle pause/resume for a session timer
   */
  async togglePause(sessionId: string): Promise<PauseResponse> {
    return api<PauseResponse>(`${this.baseUrl}/${sessionId}/pause/`, {
      method: 'POST',
    });
  }
}

export interface PauseResponse {
  is_paused: boolean;
  total_paused_seconds: number;
  pause_events: Array<{
    paused_at: string;
    resumed_at: string | null;
    duration_seconds: number;
  }>;
}

export interface CareerDebugInfo {
  session_id: string;
  current_phase: 'profile' | 'explorer';
  model_info: {
    provider: string;
    main_llm: {
      type: string;
      model: string;
      temperature: number | null;
      max_tokens: number | null;
    };
    recommendations_llm: {
      type: string;
      model: string;
      temperature: number | null;
      max_tokens: number | null;
    };
  };
  system_prompts: {
    explorer_question_prompt: string;
    recommendations_prompt: string;
  };
  user_context: string;
  session_state: {
    current_step: number;
    total_steps: number;
    profile_completed: number;
    explorer_completed: number;
    profile_questions_count: number;
    explorer_questions_count: number;
  };
  token_usage: {
    categories?: Record<
      string,
      {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
        call_count: number;
        cache_read_tokens?: number;
        cache_creation_tokens?: number;
        reasoning_tokens?: number;
      }
    >;
    total_input_tokens?: number;
    total_output_tokens?: number;
    total_tokens?: number;
    total_llm_calls?: number;
    total_cache_read_tokens?: number;
    total_cache_creation_tokens?: number;
    total_reasoning_tokens?: number;
  };
}

// Export singleton instance
export const careerDiscoveryApi = new CareerDiscoveryAPI();

// Legacy type export for compatibility
export type CareerDiscoveryMessage = CareerMessage;
