/**
 * Generic Realtime Voice Client
 * Handles WebSocket connection to Azure OpenAI Realtime API via Django proxy.
 * Works for domain discovery, career discovery, or any feature that needs
 * realtime voice over a backend WebSocket proxy.
 */

export interface RealtimeVoiceClientConfig {
  /** Session identifier sent as a query param */
  sessionId: string;
  /** Feature identifier, e.g. 'domain-discovery' or 'career-discovery' */
  feature: string;
  /** Human-readable label used for console logs */
  label?: string;

  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
  /**
   * Called with each transcript delta.
   * @param isNewTurn - true when this delta belongs to a NEW response/turn
   *   (i.e. a different item_id than the previous assistant delta, or a
   *   completed user transcription). The consumer should start a fresh
   *   transcript entry instead of appending to the previous one.
   */
  onTranscriptUpdate?: (transcript: string, role: 'user' | 'assistant', isNewTurn: boolean) => void;
  onAudioResponse?: (audio: ArrayBuffer) => void;
  /** Fired once when the bot starts speaking (first audio chunk enters playback) */
  onPlaybackStarted?: () => void;
  /** Fired when the entire audio queue has drained and playback is idle */
  onPlaybackFinished?: () => void;
}

export class RealtimeVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private config: RealtimeVoiceClientConfig;
  private currentSource: AudioBufferSourceNode | null = null;
  private _disconnecting = false;
  private label: string;
  private _responseDoneResolver: (() => void) | null = null;
  private _goodbyeInProgress = false;
  /** Tracks the current assistant item_id to detect response boundaries */
  private _currentAssistantItemId: string | null = null;

  constructor(config: RealtimeVoiceClientConfig) {
    this.config = config;
    this.label = config.label ?? 'Realtime';
  }

  // ───────────────────────── Connection ─────────────────────────

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const wsUrl =
          apiBaseUrl
            .replace('https://', 'wss://')
            .replace('http://', 'ws://') +
          `/ws/voice/realtime/?feature=${this.config.feature}&session_id=${this.config.sessionId}`;

        console.log(`[${this.label}] Connecting to:`, wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log(`[${this.label}] Connected`);
          this.config.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error(`[${this.label}] WebSocket error:`, error);
          this.config.onError?.('WebSocket connection error');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log(`[${this.label}] Disconnected`);
          this.config.onDisconnected?.();
        };

        // Use the system's native sample rate for playback — the Web Audio
        // API will automatically upsample from 24 kHz PCM to the hardware
        // rate, producing smoother output than forcing 24 kHz.
        this.audioContext = new AudioContext();
      } catch (error) {
        console.error(`[${this.label}] Failed to connect:`, error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this._disconnecting = true;
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

  // ───────────────────────── Audio I/O ──────────────────────────

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[${this.label}] WebSocket not connected`);
      return;
    }
    const base64Audio = this.arrayBufferToBase64(audioData);
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64Audio }));
  }

  commitAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
  }

  /**
   * Clear the pending audio buffer without committing.
   * Call before disconnecting to avoid "audio too small" errors.
   */
  clearAudioBuffer(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
  }

  // ───────────────────────── Text helpers ───────────────────────

  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      }),
    );
    this.triggerResponse();
  }

  seedConversationHistory(messages: { role: 'user' | 'assistant'; content: string }[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    for (const msg of messages) {
      this.ws.send(
        JSON.stringify({
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
        }),
      );
    }
    console.log(`[${this.label}] Seeded ${messages.length} conversation history items`);
  }

  promptContinuation(lastBotMessage: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
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
      }),
    );
    this.triggerResponse();
  }

  /**
   * Send a farewell prompt and return a Promise that resolves once the AI
   * has finished its response AND the goodbye audio has finished playing.
   * Interrupts any in-flight response first. Falls back after a timeout.
   */
  sendGoodbye(timeoutMs = 15000): Promise<void> {
    console.log(`[${this.label}] sendGoodbye called (ws open: ${this.ws?.readyState === WebSocket.OPEN})`);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log(`[${this.label}] sendGoodbye — WS not open, resolving immediately`);
      return Promise.resolve();
    }

    this._goodbyeInProgress = true;

    // 1. Cancel any in-flight response and stop current playback
    console.log(`[${this.label}] sendGoodbye — sending response.cancel`);
    this.ws.send(JSON.stringify({ type: 'response.cancel' }));
    this.stopAudio();

    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        console.log(`[${this.label}] Goodbye timed out – disconnecting anyway`);
        this._responseDoneResolver = null;
        this._goodbyeInProgress = false;
        resolve();
      }, timeoutMs);

      // 2. When OpenAI finishes the goodbye response, wait for audio playback
      this._responseDoneResolver = () => {
        const checkPlayback = () => {
          if (!this.isPlaying && this.audioQueue.length === 0) {
            clearTimeout(timer);
            this._goodbyeInProgress = false;
            // Small grace period so the last chunk finishes in the speaker
            setTimeout(resolve, 300);
          } else {
            setTimeout(checkPlayback, 200);
          }
        };
        checkPlayback();
      };

      // 3. Small delay to let the cancel round-trip complete, then send goodbye
      setTimeout(() => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.log(`[${this.label}] sendGoodbye — WS closed during delay, resolving`);
          clearTimeout(timer);
          this._goodbyeInProgress = false;
          resolve();
          return;
        }
        console.log(`[${this.label}] sendGoodbye — sending goodbye conversation item + response.create`);
        this.ws.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: '[System: The user has decided to end the voice session. Please say a brief, warm goodbye — for example "I see you want to end the session. Have a good day!" Keep it to one short sentence.]',
                },
              ],
            },
          }),
        );
        this.triggerResponse();
      }, 300);
    });
  }

  // ───────────────────────── Playback ───────────────────────────

  stopAudio(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    const wasPlaying = this.isPlaying || this.audioQueue.length > 0;
    this.audioQueue = [];
    this.isPlaying = false;
    if (wasPlaying) {
      this.config.onPlaybackFinished?.();
    }
  }

  getConnectionStatus(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // ───────────────────── Private helpers ────────────────────────

  private triggerResponse(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'response.create' }));
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const type = message.type;

      console.log(`[${this.label}] Received message:`, type, message);

      switch (type) {
        case 'connection.ready':
          console.log(`[${this.label}] ✅ Connection ready:`, message.message);
          break;

        case 'session.created':
        case 'session.updated':
          console.log(`[${this.label}] ✅ Session updated:`, message);
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

        case 'response.done': {
          const status = (message.response as Record<string, unknown>)?.status;
          console.log(`[${this.label}] Response completed (status: ${status})`);
          // Only resolve the goodbye promise on a fully completed response,
          // not on a cancelled one (response.cancel triggers response.done
          // with status "cancelled").
          if (this._responseDoneResolver && status !== 'cancelled') {
            this._responseDoneResolver();
            this._responseDoneResolver = null;
          }
          break;
        }

        case 'error':
          if (this._disconnecting || this._goodbyeInProgress) {
            console.log(`[${this.label}] Suppressed error during disconnect/goodbye:`, message.error);
            break;
          }
          console.error(`[${this.label}] Server error:`, message.error);
          this.config.onError?.(message.error?.message || 'Unknown error');
          break;

        default:
          if (process.env.NODE_ENV === 'development') {
            console.log(`[${this.label}] event:`, type);
          }
      }
    } catch (error) {
      console.error(`[${this.label}] Error parsing message:`, error);
    }
  }

  private handleConversationItem(message: Record<string, unknown>): void {
    const item = message.item as Record<string, unknown> | undefined;
    if (item) {
      console.log(`[${this.label}] Conversation item created:`, item.role, item.type);
    }
  }

  private handleAudioDelta(message: Record<string, unknown>): void {
    const base64Audio = message.delta as string | undefined;
    if (!base64Audio) return;

    try {
      const audioData = this.base64ToArrayBuffer(base64Audio);
      this.queueAudioForPlayback(audioData);
      this.config.onAudioResponse?.(audioData);
    } catch (error) {
      console.error(`[${this.label}] Error processing audio delta:`, error);
    }
  }

  private handleTranscriptDelta(message: Record<string, unknown>, role: 'user' | 'assistant'): void {
    const delta = message.delta as string | undefined;
    if (!delta) return;

    const itemId = message.item_id as string | undefined;
    let isNewTurn = false;
    if (itemId && itemId !== this._currentAssistantItemId) {
      // A new response item started — signal a turn boundary so the
      // consumer creates a fresh transcript entry instead of appending.
      isNewTurn = true;
      this._currentAssistantItemId = itemId;
    }
    this.config.onTranscriptUpdate?.(delta, role, isNewTurn);
  }

  private handleInputTranscription(message: Record<string, unknown>): void {
    const transcript = message.transcript as string | undefined;
    // User transcriptions are always complete (not deltas), so always a new turn.
    if (transcript) this.config.onTranscriptUpdate?.(transcript, 'user', true);
  }

  private async queueAudioForPlayback(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;
    try {
      const audioBuffer = await this.decodePCM16(audioData);
      this.audioQueue.push(audioBuffer);
      if (!this.isPlaying) this.playNextAudio();
    } catch (error) {
      console.error(`[${this.label}] Error queuing audio:`, error);
    }
  }

  private playNextAudio(): void {
    if (!this.audioContext || this.audioQueue.length === 0) {
      const wasPlaying = this.isPlaying;
      this.isPlaying = false;
      if (wasPlaying) {
        this.config.onPlaybackFinished?.();
      }
      return;
    }

    if (!this.isPlaying) {
      // Transitioning from idle → playing: notify listener
      this.isPlaying = true;
      this.config.onPlaybackStarted?.();
    }

    const audioBuffer = this.audioQueue.shift()!;

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.onended = () => this.playNextAudio();
    source.start();
    this.currentSource = source;
  }

  private async decodePCM16(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const int16Array = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
