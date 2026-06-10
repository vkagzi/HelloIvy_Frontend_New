/**
 * Stream & Subject Selection API Client
 * Connects to Django backend using LangChain + Azure OpenAI for AI-powered Stream & Subject Selection
 */
import api from '@/lib/api';

// ================== Types ==================

export interface DomainMessage {
  message_id: string;
  type: 'bot' | 'user';
  content: string;
  question_type?: 'riasec' | 'deepdive' | 'general';
  choices?: string[]; // For initial assessment questions
  medium?: 'text' | 'voice';
  timestamp: string;
}

export interface DomainDiscoverySession {
  session_id: string;
  current_step: number;
  total_steps: number;
  riasec_questions_count: number;
  deepdive_questions_count: number;
  riasec_completed: number;
  deepdive_completed: number;
  current_phase: 'riasec' | 'deepdive';
  is_active: boolean;
  is_completed: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  messages: DomainMessage[];
}

export interface InterestScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface SendMessageResponse {
  session_id: string;
  user_message: string;
  bot_response: string;
  question_type?: 'riasec' | 'deepdive' | 'general';
  choices?: string[]; // For initial assessment questions
  current_step: number;
  total_steps: number;
  // Total number of questions expected for the session
  total_questions?: number;
  riasec_completed: number;
  deepdive_completed: number;
  is_complete: boolean;
  phase: 'riasec' | 'deepdive';
  progress_percentage: number;
  questions_completed: number;
  partial_interest_analysis?: InterestScores | null;
}

export interface TopDimension {
  dimension: string;
  score: number;
  rank: number;
}

export interface ResultsSummary {
  session_id: string;
  student_name: string;
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  interests_identified: string[];
  strengths_identified: string[];
  riasec_scores: InterestScores;
  top_dimensions: TopDimension[];
  primary_domains: DomainRecommendation[];
  secondary_domains: DomainRecommendation[];
}

export interface TranscriptMessage {
  question_number: number;
  phase?: string;
  bot_question: string;
  student_response: string;
  timestamp: string;
}

export interface TranscriptData {
  session_id: string;
  student_name: string;
  started_at: string;
  completed_at?: string;
  total_questions: number;
  messages: TranscriptMessage[];
  concluding_message?: string | null;
}

export interface SubjectCombinationPathway {
  pathway_name: string;
  paired_with: string[];
  leads_to: string[];
  best_for: string;
}

export interface RelatedSubject {
  subject: string;
  relevance: string;
  importance: 'core' | 'supporting' | 'optional';
  importance_reason: string;
  combination_pathways: SubjectCombinationPathway[];
}

export interface DomainRecommendation {
  id?: number;
  domain_title: string;
  category: string;
  match_percentage: number;
  key_interests: string[];
  sub_domains: string[];
  related_subjects: RelatedSubject[];
  description: string;
  why_recommended: string;
  exploration_activities: string[];
  potential_careers: string[];
  feasibility?: {
    level: 'High' | 'Medium' | 'Low';
    reason: string;
  };
  skill_gaps?: string[];
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
  riasec_completed: number;
  deepdive_completed: number;
  current_phase: 'riasec' | 'deepdive';
  is_active: boolean;
  is_completed: boolean;
}

export interface TranscribeResponse {
  text: string;
}

export interface SessionListItem {
  session_id: string;
  current_step: number;
  total_steps: number;
  // Optional counts for question breakdowns (provided by backend when available)
  riasec_questions_count?: number;
  deepdive_questions_count?: number;
  total_questions?: number;
  riasec_completed: number;
  deepdive_completed: number;
  current_phase: 'riasec' | 'deepdive';
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

class DomainDiscoveryAPI {
  private baseUrl = '/api/domain-discovery';

  /**
   * Create a new Stream & Subject Selection session
   * Returns the session with the initial bot message
   */
  async createSession(): Promise<DomainDiscoverySession> {
    return api<DomainDiscoverySession>(`${this.baseUrl}/`, {
      method: 'POST',
    });
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<DomainDiscoverySession> {
    return api<DomainDiscoverySession>(`${this.baseUrl}/${sessionId}/`);
  }

  /**
   * List all sessions for the user
   * @param isCompleted - Optional filter for completed/in-progress sessions
   * @param limit - Optional limit on number of sessions to return
   */
  async listSessions(
    isCompleted?: boolean,
    limit?: number
  ): Promise<SessionListResponse> {
    const params = new URLSearchParams();
    if (isCompleted !== undefined) {
      params.append('is_completed', isCompleted.toString());
    }
    if (limit !== undefined) {
      params.append('limit', limit.toString());
    }
    const queryString = params.toString();
    const url = queryString
      ? `${this.baseUrl}/list/?${queryString}`
      : `${this.baseUrl}/list/`;
    return api<SessionListResponse>(url);
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
   * End a Stream & Subject Selection session
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

    const data = await api<TranscribeResponse>(
      `${this.baseUrl}/audio/transcribe/`,
      {
        method: 'POST',
        body: formData,
      }
    );
    return data.text;
  }

  /**
   * Generate speech from text using backend TTS
   * Returns audio blob
   */
  async generateSpeech(text: string, voice: string = 'nova'): Promise<Blob> {
    return api<Blob>(`${this.baseUrl}/audio/speech/`, {
      method: 'POST',
      body: { text, voice },
      responseType: 'blob',
    });
  }

  /**
   * Get comprehensive results summary after conversation completion
   */
  async getResultsSummary(sessionId: string): Promise<ResultsSummary> {
    return api<ResultsSummary>(`${this.baseUrl}/${sessionId}/results/`);
  }

  /**
   * Get conversation transcript as JSON with Q&A pairs
   */
  async getTranscript(sessionId: string): Promise<TranscriptData> {
    return api<TranscriptData>(`${this.baseUrl}/${sessionId}/transcript/`);
  }

  /**
   * Health check for the Stream & Subject Selection service
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
   * Get debug information including system prompts, model info, and user profile context
   */
  async getDebugInfo(sessionId: string): Promise<DebugInfo> {
    return api<DebugInfo>(`${this.baseUrl}/${sessionId}/debug/`);
  }

  /**
   * Toggle pause/resume for a session timer
   */
  async togglePause(sessionId: string): Promise<PauseResponse> {
    return api<PauseResponse>(`${this.baseUrl}/${sessionId}/pause/`, {
      method: 'POST',
    });
  }

  /**
   * Email the generated report PDF to the user
   */
  async emailReport(sessionId: string, pdfBlob: Blob): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'report.pdf');
    return api<{ message: string }>(`${this.baseUrl}/${sessionId}/email-report/`, {
      method: 'POST',
      body: formData,
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

export interface DebugInfo {
  session_id: string;
  current_phase: 'riasec' | 'deepdive';
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
    deepdive_question_prompt: string;
    recommendations_prompt: string;
  };
  user_profile_context: string;
  riasec_context: string;
  session_state: {
    current_step: number;
    total_steps: number;
    riasec_completed: number;
    deepdive_completed: number;
    riasec_questions_count: number;
    deepdive_questions_count: number;
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
export const domainDiscoveryApi = new DomainDiscoveryAPI();

// Legacy type export for compatibility
export type DomainDiscoveryMessage = DomainMessage;
