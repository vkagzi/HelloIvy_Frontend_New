/**
 * RAG-powered conversation API client
 * Integrates with the enhanced conversational Q&A system
 */

import api from '@/lib/api-client';

const RAG_BASE = '/api/essay-brainstorm/rag';

// Types for RAG conversation system
export interface RAGSystemStatus {
  rag_available: boolean;
  status: 'ready' | 'unavailable';
}

export interface RAGConversationStartRequest {
  college_selection_id: number;
}

export interface RAGConversationStartResponse {
  success: boolean;
  session_id: string;
  first_question: string;
  rag_qa_id: string;
  phase: string;
  essay_type: string;
  current_step: number;
  total_steps: number;
  essay_topic: string;
  college_name: string;
}

export interface RAGConversationMessageRequest {
  session_id: string;
  message: string;
}

export interface RAGConversationMessageResponse {
  success: boolean;
  user_message: string;
  bot_response: string;
  rag_qa_id: string;
  phase: string;
  essay_type: string;
  essay_topic?: string;
  is_fallback: boolean;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
  needs_fallback: boolean;
  final_dataset?: RAGConversationDataset;
}

export interface RAGMessage {
  id: number;
  type: 'bot' | 'user';
  content: string;
  timestamp: string;
  rag_qa_id?: string;
  rag_metadata?: {
    phase?: string;
    essay_type?: string;
    tags?: string[];
    story_id?: string;
    is_fallback?: boolean;
    diagnostics?: Record<string, any>;
  };
}

export interface RAGConversationHistoryResponse {
  session_id: string;
  messages: RAGMessage[];
  current_step: number;
  total_steps: number;
  is_active: boolean;
  essay_topic: string;
  college_name: string;
}

export interface QAPair {
  qa_id: string;
  essay_topic: string;
  essay_type: string;
  phase: string;
  question: string;
  answer: string;
  is_fallback: boolean;
  tags: string[];
  story_id?: string;
  timestamp: string;
  student_id: string;
  session_id: string;
  diagnostics?: Record<string, any>;
}

export interface RAGConversationDataset {
  session_id: string;
  total_questions: number;
  qa_pairs: QAPair[];
  session_summary: {
    total_questions: number;
    fallback_questions: number;
    answered_questions: number;
    weak_answers: number;
    strong_answers: number;
    phases_covered: string[];
    stories_referenced: number;
    conversation_depth: string;
  };
}

export interface RAGConversationDatasetResponse {
  success: boolean;
  dataset: RAGConversationDataset;
  ready_for_structure_generation: boolean;
}

export interface RAGConversationEndResponse {
  success: boolean;
  message: string;
  final_dataset: RAGConversationDataset;
}

class RAGConversationAPI {
  /**
   * Check if RAG system is available
   */
  async getSystemStatus(): Promise<RAGSystemStatus> {
    try {
      return await api<RAGSystemStatus>(`${RAG_BASE}/`);
    } catch (error) {
      console.error('❌ Error checking RAG system status:', error);
      return { rag_available: false, status: 'unavailable' };
    }
  }

  /**
   * Start a new RAG-powered conversation session
   */
  async startConversation(
    request: RAGConversationStartRequest
  ): Promise<RAGConversationStartResponse> {
    try {
      return await api<RAGConversationStartResponse>(
        `${RAG_BASE}/conversations/start/`,
        { method: 'POST', body: request }
      );
    } catch (error) {
      console.error('❌ Error starting RAG conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message and get RAG-powered response
   */
  async sendMessage(
    request: RAGConversationMessageRequest
  ): Promise<RAGConversationMessageResponse> {
    try {
      return await api<RAGConversationMessageResponse>(
        `${RAG_BASE}/conversations/message/`,
        { method: 'POST', body: request }
      );
    } catch (error) {
      console.error('❌ Error sending RAG message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history with RAG metadata
   */
  async getConversationHistory(
    sessionId: string
  ): Promise<RAGConversationHistoryResponse> {
    try {
      return await api<RAGConversationHistoryResponse>(
        `${RAG_BASE}/conversations/${sessionId}/history/`
      );
    } catch (error) {
      console.error('❌ Error getting RAG conversation history:', error);
      throw error;
    }
  }

  /**
   * Get the complete Q&A dataset for essay structure generation
   */
  async getConversationDataset(
    sessionId: string
  ): Promise<RAGConversationDatasetResponse> {
    try {
      return await api<RAGConversationDatasetResponse>(
        `${RAG_BASE}/conversations/${sessionId}/dataset/`
      );
    } catch (error) {
      console.error('❌ Error getting RAG conversation dataset:', error);
      throw error;
    }
  }

  /**
   * End a conversation session and get final dataset
   */
  async endConversation(
    sessionId: string
  ): Promise<RAGConversationEndResponse> {
    try {
      return await api<RAGConversationEndResponse>(
        `${RAG_BASE}/conversations/${sessionId}/end/`,
        { method: 'POST' }
      );
    } catch (error) {
      console.error('❌ Error ending RAG conversation:', error);
      throw error;
    }
  }

  /**
   * Helper: Check if RAG system is ready before using
   */
  async ensureRAGAvailable(): Promise<boolean> {
    const status = await this.getSystemStatus();
    return status.rag_available;
  }
}

// Export singleton instance
export const ragConversationApi = new RAGConversationAPI();

// Helper functions for easier integration

/**
 * Check if RAG system should be used instead of current OpenAI integration
 */
export async function shouldUseRAGSystem(): Promise<boolean> {
  try {
    const status = await ragConversationApi.getSystemStatus();
    return status.rag_available;
  } catch {
    return false;
  }
}

/**
 * Get college selection ID from localStorage (helper for starting RAG conversations)
 */
export function getCollegeSelectionIdFromLocalStorage(): number | null {
  try {
    const collegeData = localStorage.getItem('college-essay-data');
    if (collegeData) {
      const parsed = JSON.parse(collegeData);
      return parsed.collegeSelectionId || null;
    }
    return null;
  } catch {
    return null;
  }
}
