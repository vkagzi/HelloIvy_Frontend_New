/**
 * College Selector API Client
 * Connects to Django backend for College Selector module
 */
import api from '@/lib/api';

// ================== Types ==================

export interface CollegeSelectorMessage {
  message_id: string;
  type: 'bot' | 'user';
  content: string;
  medium?: 'text' | 'voice';
  timestamp: string;
}

export interface CollegeSelectorSession {
  session_id: string;
  current_step: number;
  total_steps: number;
  current_phase: 'preferences' | 'conversation' | 'completed';
  preferences: CollegeSelectorPreferences;
  preferences_completed: boolean;
  is_active: boolean;
  is_completed: boolean;
  metadata?: Record<string, unknown>;
  token_usage?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  messages: CollegeSelectorMessage[];
}

export interface CollegeSelectorPreferences {
  degree_level: string;
  degree_type: string;
  primary_major: string;
  secondary_major?: string;
  countries: string[];
  campus_setting: string;
  campus_importance: string;
  climate_preference: string;
  college_type: string;
  college_type_reasons: string[];
  research_importance: string;
  research_exposure: string[];
  cultural_fit: string[];
  fit_importance: string;
  class_size: string;
  teaching_style: string;
  brand_preference?: string;
  financial_aid_preference?: string;
  financial_aid_required: boolean;
  prestige_important: boolean;
  additional_notes: string;
}

export interface DegreeLevelOption {
  value: string;
  label: string;
}

export interface DegreeOptionsResponse {
  degree_levels: DegreeLevelOption[];
  degree_types: Record<string, string[]>;
}

export interface SendMessageResponse {
  session_id: string;
  bot_response: string;
  current_step: number;
  is_complete: boolean;
  progress_percentage: number;
  questions_completed: number;
  token_usage?: Record<string, unknown>;
}

export interface CollegeRecommendation {
  id?: number;
  university_name: string;
  website_url: string;
  location: string;
  country: string;
  deadlines: Record<string, string>;
  degree_and_major: string;
  tuition_fees: string;
  cost_of_living: string;
  scholarships: string[];
  academic_requirements: Record<string, string>;
  additional_requirements: string[];
  university_type: string;
  global_ranking: Record<string, string>;
  acceptance_rate: string;
  application_fee: string;
  tests_required: string[];
  post_study_work_visa: string;
  employment_rate: string;
  language: string;
  campus_type: string;
  intl_student_support: string;
  fit_category: 'reach' | 'match' | 'safe';
  fit_reasoning: string;
  suggested_deadline: string;
  match_percentage: number;
  description: string;
  rank?: number;
}

export interface RecommendationsResponse {
  session_id: string;
  recommendations: CollegeRecommendation[];
  total_count: number;
}

export interface MessageHistoryResponse {
  session_id: string;
  messages: CollegeSelectorMessage[];
  current_step: number;
  total_steps: number;
  current_phase: string;
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
  current_phase: string;
  preferences_completed: boolean;
  is_active: boolean;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  sessions: SessionListItem[];
  total_count: number;
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

export interface TranscriptMessage {
  question_number: number;
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
}

// ================== API Class ==================

class CollegeSelectorAPI {
  private baseUrl = '/api/college-selector';

  async getDegreeOptions(): Promise<DegreeOptionsResponse> {
    return api<DegreeOptionsResponse>(`${this.baseUrl}/degree-options/`);
  }

  async createSession(): Promise<CollegeSelectorSession> {
    return api<CollegeSelectorSession>(`${this.baseUrl}/`, {
      method: 'POST',
    });
  }

  async getSession(sessionId: string): Promise<CollegeSelectorSession> {
    return api<CollegeSelectorSession>(`${this.baseUrl}/${sessionId}/`);
  }

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

  async savePreferences(
    sessionId: string,
    preferences: CollegeSelectorPreferences
  ): Promise<CollegeSelectorSession> {
    return api<CollegeSelectorSession>(
      `${this.baseUrl}/${sessionId}/preferences/`,
      {
        method: 'POST',
        body: preferences,
      }
    );
  }

  async getPreferences(
    sessionId: string
  ): Promise<{
    session_id: string;
    preferences: CollegeSelectorPreferences;
    preferences_completed: boolean;
  }> {
    return api(`${this.baseUrl}/${sessionId}/preferences/`);
  }

  async saveProgress(
    sessionId: string,
    partialPreferences: Partial<CollegeSelectorPreferences> & { _step?: number }
  ): Promise<{
    session_id: string;
    preferences: Partial<CollegeSelectorPreferences> & { _step?: number };
    preferences_completed: boolean;
  }> {
    return api(`${this.baseUrl}/${sessionId}/preferences/`, {
      method: 'PATCH',
      body: partialPreferences,
    });
  }

  async sendMessage(
    sessionId: string,
    content: string
  ): Promise<SendMessageResponse> {
    return api<SendMessageResponse>(`${this.baseUrl}/${sessionId}/messages/`, {
      method: 'POST',
      body: { content },
    });
  }

  async getMessages(sessionId: string): Promise<MessageHistoryResponse> {
    return api<MessageHistoryResponse>(
      `${this.baseUrl}/${sessionId}/messages/history/`
    );
  }

  async endSession(sessionId: string): Promise<void> {
    return api<void>(`${this.baseUrl}/${sessionId}/end/`, {
      method: 'POST',
    });
  }

  async generateRecommendations(
    sessionId: string
  ): Promise<RecommendationsResponse> {
    return api<RecommendationsResponse>(
      `${this.baseUrl}/${sessionId}/recommendations/generate/`,
      { method: 'POST' }
    );
  }

  async getRecommendations(
    sessionId: string
  ): Promise<RecommendationsResponse> {
    return api<RecommendationsResponse>(
      `${this.baseUrl}/${sessionId}/recommendations/`
    );
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    const data = await api<TranscribeResponse>(
      `${this.baseUrl}/audio/transcribe/`,
      { method: 'POST', body: formData }
    );
    return data.text;
  }

  async generateSpeech(text: string, voice: string = 'nova'): Promise<Blob> {
    return api<Blob>(`${this.baseUrl}/audio/speech/`, {
      method: 'POST',
      body: { text, voice },
      responseType: 'blob',
    });
  }

  async getTranscript(sessionId: string): Promise<TranscriptData> {
    return api<TranscriptData>(`${this.baseUrl}/${sessionId}/transcript/`);
  }

  async togglePause(sessionId: string): Promise<PauseResponse> {
    return api<PauseResponse>(`${this.baseUrl}/${sessionId}/pause/`, {
      method: 'POST',
    });
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    return api<{ status: string; service: string }>(`${this.baseUrl}/health/`);
  }

  async getDebugInfo(sessionId: string): Promise<CollegeDebugInfo> {
    return api<CollegeDebugInfo>(`${this.baseUrl}/${sessionId}/debug/`);
  }

  async updateTestScores(
    testScores: Array<Record<string, unknown>>
  ): Promise<{ test_scores: Array<Record<string, unknown>>; message: string }> {
    return api<{ test_scores: Array<Record<string, unknown>>; message: string }>(
      `${this.baseUrl}/test-scores/`,
      { method: 'PUT', body: { test_scores: testScores } }
    );
  }

  async emailReport(sessionId: string, pdfBlob: Blob): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'report.pdf');
    return api<{ message: string }>(`${this.baseUrl}/${sessionId}/email-report/`, {
      method: 'POST',
      body: formData,
    });
  }
}

export interface CollegeDebugInfo {
  session_id: string;
  current_phase: 'preferences' | 'conversation' | 'completed';
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
    conversation_prompt: string;
    recommendations_prompt: string;
  };
  preferences_context: string;
  user_context: string;
  session_state: {
    current_step: number;
    total_steps: number;
    bot_messages: number;
    user_messages: number;
    preferences_completed: boolean;
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

export const collegeSelectorApi = new CollegeSelectorAPI();
export default collegeSelectorApi;
