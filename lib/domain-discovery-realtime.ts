/**
 * Domain Discovery Realtime Voice Client
 * Handles WebSocket connection to Azure OpenAI Realtime API via Django proxy
 */

export interface RealtimeVoiceClientConfig {
  sessionId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
  onTranscriptUpdate?: (transcript: string, role: 'user' | 'assistant') => void;
  onAudioResponse?: (audio: ArrayBuffer) => void;
}

export class DomainRealtimeVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private config: RealtimeVoiceClientConfig;
  private currentSource: AudioBufferSourceNode | null = null;

  constructor(config: RealtimeVoiceClientConfig) {
    this.config = config;
  }

  /**
   * Connect to the realtime WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Get WebSocket URL - connects to Django backend proxy
        // Backend handles Azure OpenAI connection with proper authentication
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const wsUrl = apiBaseUrl
          .replace('https://', 'wss://')
          .replace('http://', 'ws://') + `/ws/domain-discovery/realtime/?session_id=${this.config.sessionId}`;

        console.log('[Realtime] Connecting to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Connected to Domain Discovery Realtime');
          this.config.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.config.onError?.('WebSocket connection error');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('Disconnected from Domain Discovery Realtime');
          this.config.onDisconnected?.();
        };

        // Initialize AudioContext
        this.audioContext = new AudioContext({ sampleRate: 24000 });
      } catch (error) {
        console.error('Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Send audio data to the server
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    // Convert ArrayBuffer to base64
    const base64Audio = this.arrayBufferToBase64(audioData);

    const message = {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Commit audio buffer (trigger processing)
   */
  commitAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'input_audio_buffer.commit',
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send a text message (for manual input)
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    };

    this.ws.send(JSON.stringify(message));

    // Trigger response
    this.triggerResponse();
  }

  /**
   * Seed full conversation history into the realtime session
   * so the AI has context from the prior text chat.
   */
  seedConversationHistory(messages: { role: 'user' | 'assistant'; content: string }[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    for (const msg of messages) {
      const item: Record<string, unknown> = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: msg.role,
          content: [
            {
              type: msg.role === 'user' ? 'input_text' : 'text',
              text: msg.content,
            },
          ],
        },
      };
      this.ws.send(JSON.stringify(item));
    }
    console.log(`[Realtime] Seeded ${messages.length} conversation history items`);
  }

  /**
   * Ask the AI to speak a continuation / repeat of the last bot message.
   * Adds an invisible system-level instruction and triggers a response.
   */
  promptContinuation(lastBotMessage: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Create a user message that instructs the AI to continue
    const prompt = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `[System: The user has switched from text chat to voice mode. Your last message was: "${lastBotMessage}". Please briefly acknowledge the switch to voice mode and continue the conversation naturally. Do NOT repeat the full message — just smoothly pick up where you left off. Be concise and conversational.]`,
          },
        ],
      },
    };
    this.ws.send(JSON.stringify(prompt));
    this.triggerResponse();
  }

  /**
   * Trigger AI response
   */
  private triggerResponse(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'response.create',
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const type = message.type;

      console.log('[Realtime] Received message:', type, message);

      switch (type) {
        case 'connection.ready':
          console.log('✅ Connection ready:', message.message);
          break;

        case 'session.created':
        case 'session.updated':
          console.log('✅ Session updated:', message);
          break;

        case 'conversation.item.created':
          this.handleConversationItem(message);
          break;

        case 'response.audio.delta':
          this.handleAudioDelta(message);
          break;

        case 'response.audio_transcript.delta':
          this.handleTranscriptDelta(message, 'assistant');
          break;

        case 'conversation.item.input_audio_transcription.completed':
          this.handleInputTranscription(message);
          break;

        case 'response.done':
          console.log('Response completed');
          break;

        case 'error':
          console.error('Server error:', message.error);
          this.config.onError?.(message.error?.message || 'Unknown error');
          break;

        default:
          // Log other message types for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('Realtime event:', type);
          }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Handle conversation item created
   */
  private handleConversationItem(message: any): void {
    const item = message.item;
    if (item && item.content) {
      for (const content of item.content) {
        if (content.type === 'text') {
          this.config.onTranscriptUpdate?.(content.text, item.role);
        }
      }
    }
  }

  /**
   * Handle audio delta (streaming audio response)
   */
  private handleAudioDelta(message: any): void {
    const base64Audio = message.delta;
    if (!base64Audio) return;

    try {
      // Decode base64 to ArrayBuffer
      const audioData = this.base64ToArrayBuffer(base64Audio);

      // Queue for playback
      this.queueAudioForPlayback(audioData);

      // Also notify callback
      this.config.onAudioResponse?.(audioData);
    } catch (error) {
      console.error('Error processing audio delta:', error);
    }
  }

  /**
   * Handle transcript delta
   */
  private handleTranscriptDelta(message: any, role: 'user' | 'assistant'): void {
    const delta = message.delta;
    if (delta) {
      this.config.onTranscriptUpdate?.(delta, role);
    }
  }

  /**
   * Handle input audio transcription
   */
  private handleInputTranscription(message: any): void {
    const transcript = message.transcript;
    if (transcript) {
      this.config.onTranscriptUpdate?.(transcript, 'user');
    }
  }

  /**
   * Queue audio for playback
   */
  private async queueAudioForPlayback(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Decode audio data (PCM16 format from OpenAI)
      const audioBuffer = await this.decodePCM16(audioData);
      this.audioQueue.push(audioBuffer);

      // Start playing if not already playing
      if (!this.isPlaying) {
        this.playNextAudio();
      }
    } catch (error) {
      console.error('Error queuing audio:', error);
    }
  }

  /**
   * Play next audio in queue
   */
  private playNextAudio(): void {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.audioQueue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    source.onended = () => {
      this.playNextAudio();
    };

    source.start();
    this.currentSource = source;
  }

  /**
   * Stop current audio playback
   */
  stopAudio(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Decode PCM16 audio data
   */
  private async decodePCM16(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    // PCM16 is 16-bit signed integer samples
    const int16Array = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(int16Array.length);

    // Convert int16 to float32 (-1.0 to 1.0)
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    // Create audio buffer
    const audioBuffer = this.audioContext.createBuffer(
      1, // mono
      float32Array.length,
      24000 // 24kHz sample rate (OpenAI default)
    );

    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
