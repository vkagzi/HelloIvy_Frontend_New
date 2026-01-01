import api from './api';

export interface ConversationMessage {
  id?: string;
  session_id: string;
  type: 'bot' | 'user';
  content: string;
  audio_url?: string;
  timestamp: string;
}

export interface ConversationSession {
  id?: string;
  session_id?: string;
  user_id?: number;
  college_name?: string;
  essay_topic?: string;
  essay_limit_type?: string;
  essay_limit_value?: number;
  current_step: number;
  total_steps: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  college_selection?: {
    id: number;
    college_name: string;
    essay_topic: string;
    degree: string;
    major: string;
  };
}

export interface EssaySection {
  section_title: string;
  word_count: number;
  writing_prompt: string;
  key_elements: string[];
}

export interface EssayStructure {
  title: string;
  total_words: number;
  sections: EssaySection[];
  narrative_thread: string;
  unique_angle: string;
  college_connection: string;
}

// Conversation Sessions API
export const conversationSessionApi = {
  // Create a new conversation session
  create: async (data: {
    college_selection_id?: number;
  }): Promise<ConversationSession> => {
    return api('/api/essay-brainstorm/conversations/', {
      method: 'POST',
      body: data,
    });
  },

  // Get current active session
  getCurrent: async (): Promise<ConversationSession> => {
    return api('/api/essay-brainstorm/conversations/current/', {
      method: 'GET',
    });
  },

  // End session
  endSession: async (sessionId: string): Promise<{ message: string }> => {
    return api(`/api/essay-brainstorm/conversations/${sessionId}/end/`, {
      method: 'POST',
    });
  },
};

// Conversation Messages API
export const conversationMessageApi = {
  // Send message and get RAG response
  sendMessage: async (data: {
    session_id: string;
    content: string;
  }): Promise<{
    session_id: string;
    user_message: string;
    bot_response: string;
    current_step: number;
    total_steps: number;
  }> => {
    return api('/api/essay-brainstorm/conversations/messages/', {
      method: 'POST',
      body: data,
    });
  },

  // Get conversation history
  getHistory: async (
    sessionId: string
  ): Promise<{
    session_id: string;
    messages: ConversationMessage[];
    current_step: number;
    total_steps: number;
    is_active: boolean;
  }> => {
    return api(`/api/essay-brainstorm/conversations/${sessionId}/messages/`, {
      method: 'GET',
    });
  },

  // Generate essay structure based on conversation
  generateStructure: async (
    sessionId: string
  ): Promise<{
    session_id: string;
    essay_structure: EssayStructure;
  }> => {
    return api('/api/essay-brainstorm/conversations/structure/', {
      method: 'POST',
      body: { session_id: sessionId },
    });
  },
};

// OpenAI Realtime API client with proper error handling
export class OpenAIRealtimeClient {
  private isConnected: boolean = false;
  private eventHandlers: { [key: string]: Function[] } = {};

  constructor(private apiKey: string) {
    console.log('OpenAI Realtime Client initialized (fallback mode)');
  }

  // Connect to OpenAI Realtime API with fallback error handling
  async connect(): Promise<void> {
    try {
      console.log(
        'Voice assistant currently unavailable - using text mode only'
      );
      console.log(
        'Note: Browser WebSocket connections to OpenAI Realtime API require server-side proxy'
      );

      // Emit error immediately to trigger text-only mode
      setTimeout(() => {
        this.emit(
          'error',
          new Error('Voice mode not available in browser - using text mode')
        );
      }, 100);

      return Promise.reject(new Error('Voice mode not available'));
    } catch (error) {
      console.error('Failed to connect to OpenAI Realtime API:', error);
      this.emit('error', error);
      throw error;
    }
  }

  // Send text message (not implemented for fallback)
  sendText(text: string): void {
    console.log('Voice mode not available, text message ignored:', text);
  }

  // Send audio data (not implemented for fallback)
  sendAudio(audioData: ArrayBuffer): void {
    console.log('Voice mode not available, audio data ignored');
  }

  // Commit audio (not implemented for fallback)
  commitAudio(): void {
    console.log('Voice mode not available, audio commit ignored');
  }

  // Clear audio buffer (not implemented for fallback)
  clearAudioBuffer(): void {
    console.log('Voice mode not available, audio buffer clear ignored');
  }

  // Set audio enabled
  setAudioEnabled(enabled: boolean): void {
    console.log('Audio enabled:', enabled, '(voice mode not available)');
  }

  // Event handler management
  on(event: string, handler: Function): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  off(event: string, handler: Function): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        (h) => h !== handler
      );
    }
  }

  private emit(event: string, data?: any): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach((handler) => handler(data));
    }
  }

  // Disconnect
  disconnect(): void {
    console.log('Disconnecting (fallback mode)');
    this.isConnected = false;
  }
}

// Enhanced Audio recording utilities for PCM16 streaming
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isRecording: boolean = false;
  private onAudioData?: (audioData: ArrayBuffer) => void;

  // Start recording with streaming capability for Realtime API
  async startRecording(
    onAudioData?: (audioData: ArrayBuffer) => void
  ): Promise<void> {
    try {
      this.onAudioData = onAudioData;
      this.isRecording = true;

      // Get audio stream with specific constraints for Realtime API
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000, // Required by OpenAI Realtime API
          channelCount: 1, // Mono
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // If streaming callback provided, set up real-time processing
      if (this.onAudioData) {
        await this.setupRealtimeProcessing();
      } else {
        // Fallback to MediaRecorder for blob recording
        this.setupMediaRecorder();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  // Set up real-time audio processing for streaming to Realtime API
  private async setupRealtimeProcessing(): Promise<void> {
    if (!this.stream) return;

    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });

    this.source = this.audioContext.createMediaStreamSource(this.stream);

    // Create processor for real-time audio chunks
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (event) => {
      if (!this.isRecording || !this.onAudioData) return;

      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);

      // Convert Float32 to PCM16
      const pcm16Buffer = new ArrayBuffer(inputData.length * 2);
      const pcm16View = new Int16Array(pcm16Buffer);

      for (let i = 0; i < inputData.length; i++) {
        // Convert float (-1 to 1) to 16-bit integer
        const sample = Math.max(-1, Math.min(1, inputData[i]));
        pcm16View[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }

      // Send PCM16 data to callback
      this.onAudioData(pcm16Buffer);
    };

    // Connect the audio processing chain
    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  // Fallback MediaRecorder setup
  private setupMediaRecorder(): void {
    if (!this.stream) return;

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect data every 100ms
  }

  // Stop recording
  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      this.isRecording = false;

      if (this.processor && this.audioContext) {
        // Clean up real-time processing
        this.processor.disconnect();
        this.source?.disconnect();
        this.audioContext.close();
        this.processor = null;
        this.source = null;
        this.audioContext = null;
        resolve(new Blob()); // No blob for streaming mode
      } else if (
        this.mediaRecorder &&
        this.mediaRecorder.state !== 'inactive'
      ) {
        // Stop MediaRecorder
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          this.cleanup();
          resolve(audioBlob);
        };
        this.mediaRecorder.stop();
      } else {
        resolve(new Blob());
      }
    });
  }

  // Check if currently recording
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Clean up resources
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.onAudioData = undefined;
    this.isRecording = false;
  }
}
