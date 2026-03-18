/**
 * Generic Realtime Voice Client
 * Handles WebSocket connection to Azure OpenAI Realtime API via Django proxy.
 * Works for domain discovery, career discovery, or any feature that needs
 * realtime voice over a backend WebSocket proxy.
 */

export interface RealtimeTokenUsage {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  input_text_tokens: number;
  input_audio_tokens: number;
  output_text_tokens: number;
  output_audio_tokens: number;
  input_cached_tokens: number;
  response_count: number;
}

export interface SessionProgress {
  current_step: number;
  total_steps: number;
  questions_completed: number;
  progress_percentage: number;
  is_completed: boolean;
}

export interface RealtimeVoiceClientConfig {
  /** Session identifier sent as a query param */
  sessionId: string;
  /** Feature identifier, e.g. 'domain-discovery' or 'career-discovery' */
  feature: string;
  /** Human-readable label used for console logs */
  label?: string;
  /** OpenAI Realtime voice name (e.g. 'cedar', 'marin') */
  voice?: string;

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
  /** Fired when a response completes with updated cumulative token usage */
  onTokenUsage?: (usage: RealtimeTokenUsage) => void;
  /** Fired when the backend sends updated session progress (step count, completion) */
  onSessionProgress?: (progress: SessionProgress) => void;
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
  private _switchInProgress = false;
  /** Interval ID for periodic keepalive pings to the Django backend */
  private _pingInterval: ReturnType<typeof setInterval> | null = null;
  /** Tracks the current assistant item_id to detect response boundaries */
  private _currentAssistantItemId: string | null = null;
  /** Tracks pending user speech items awaiting transcription (VAD can split one utterance into multiple items) */
  private _pendingUserItemIds: Set<string> = new Set();
  /** Ordered list of user speech item IDs for concatenation */
  private _userItemOrder: string[] = [];
  /** Received transcription parts keyed by item_id */
  private _userTranscriptParts: Map<string, string> = new Map();
  /** Whether a user placeholder is active in the transcript */
  private _userPlaceholderActive = false;
  /** Silent reconnection state */
  private _reconnecting = false;
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 3;
  private _reconnectBaseDelay = 1000;
  /** Audio data buffered while reconnecting */
  private _audioBuffer: ArrayBuffer[] = [];
  /** Accumulated conversation history for re-seeding after reconnection */
  private _conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  /** Accumulated assistant transcript text for the current response */
  private _currentAssistantText = '';
  /** Accumulated token usage across all responses */
  private _tokenUsage: RealtimeTokenUsage = {
    total_tokens: 0,
    input_tokens: 0,
    output_tokens: 0,
    input_text_tokens: 0,
    input_audio_tokens: 0,
    output_text_tokens: 0,
    output_audio_tokens: 0,
    input_cached_tokens: 0,
    response_count: 0,
  };

  /** Timestamp of initial connection for uptime tracking */
  private _connectedAt: number | null = null;
  /** Timestamp of last received pong for diagnosing keepalive gaps */
  private _lastPongAt: number | null = null;
  /** Timestamp of last sent ping */
  private _lastPingSentAt: number | null = null;
  /** Count of messages received (to gauge session activity at disconnect) */
  private _messageCount = 0;

  constructor(config: RealtimeVoiceClientConfig) {
    this.config = config;
    this.label = config.label ?? 'Realtime';
  }

  // ───────────────────────── Connection ─────────────────────────

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const params = new URLSearchParams({
          feature: this.config.feature,
          session_id: this.config.sessionId,
        });
        if (this.config.voice) params.set('voice', this.config.voice);
        const wsUrl =
          apiBaseUrl
            .replace('https://', 'wss://')
            .replace('http://', 'ws://') +
          `/ws/voice/realtime/?${params.toString()}`;

        console.log(`[${this.label}] Connecting to:`, wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this._connectedAt = Date.now();
          this._messageCount = 0;
          console.log(`[${this.label}] Connected at ${new Date().toISOString()}`);
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

        this.ws.onclose = (event: CloseEvent) => {
          const uptime = this._connectedAt ? ((Date.now() - this._connectedAt) / 1000).toFixed(1) : '?';
          const sincePong = this._lastPongAt ? ((Date.now() - this._lastPongAt) / 1000).toFixed(1) : 'never';
          const sincePing = this._lastPingSentAt ? ((Date.now() - this._lastPingSentAt) / 1000).toFixed(1) : 'never';
          console.warn(
            `[${this.label}] WebSocket closed | code=${event.code} reason="${event.reason}" clean=${event.wasClean}` +
            ` | uptime=${uptime}s msgs=${this._messageCount} responses=${this._tokenUsage.response_count}` +
            ` | tokens=${this._tokenUsage.total_tokens} (in=${this._tokenUsage.input_tokens} out=${this._tokenUsage.output_tokens})` +
            ` | lastPingSent=${sincePing}s ago lastPong=${sincePong}s ago` +
            ` | disconnecting=${this._disconnecting} switching=${this._switchInProgress}`,
          );
          this.stopPingInterval();
          if (!this._disconnecting) {
            // Unexpected disconnect — attempt silent reconnection
            this._attemptReconnect();
          } else {
            this.config.onDisconnected?.();
          }
        };

        // Start periodic keepalive pings to prevent silent connection drops
        this.startPingInterval();

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
    this.stopPingInterval();
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
    if (this._reconnecting) {
      // Silently buffer audio during reconnection
      this._audioBuffer.push(audioData);
      return;
    }
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
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
    // Store seeded messages for potential re-seeding after reconnection
    this._conversationHistory = [...messages];
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
   * Notify the AI that the user is switching from voice to text mode.
   * Returns a Promise that resolves once the AI has finished its
   * transition acknowledgement AND the audio has finished playing.
   * Interrupts any in-flight response first. Falls back after a timeout.
   */
  sendSwitchToText(timeoutMs = 15000): Promise<void> {
    console.log(`[${this.label}] sendSwitchToText called (ws open: ${this.ws?.readyState === WebSocket.OPEN})`);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log(`[${this.label}] sendSwitchToText — WS not open, resolving immediately`);
      return Promise.resolve();
    }

    this._switchInProgress = true;

    // 1. Cancel any in-flight response and stop current playback
    console.log(`[${this.label}] sendSwitchToText — sending response.cancel`);
    this.ws.send(JSON.stringify({ type: 'response.cancel' }));
    this.stopAudio();

    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        console.log(`[${this.label}] Switch-to-text timed out – disconnecting voice anyway`);
        this._responseDoneResolver = null;
        this._switchInProgress = false;
        resolve();
      }, timeoutMs);

      // 2. When OpenAI finishes the transition response, wait for audio playback
      this._responseDoneResolver = () => {
        const checkPlayback = () => {
          if (!this.isPlaying && this.audioQueue.length === 0) {
            clearTimeout(timer);
            this._switchInProgress = false;
            // Small grace period so the last chunk finishes in the speaker
            setTimeout(resolve, 300);
          } else {
            setTimeout(checkPlayback, 200);
          }
        };
        checkPlayback();
      };

      // 3. Small delay to let the cancel round-trip complete, then send switch message
      setTimeout(() => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.log(`[${this.label}] sendSwitchToText — WS closed during delay, resolving`);
          clearTimeout(timer);
          this._switchInProgress = false;
          resolve();
          return;
        }
        console.log(`[${this.label}] sendSwitchToText — sending switch-to-text conversation item + response.create`);
        this.ws.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: '[System: The user is switching from voice to text mode. The session will continue in text. Please briefly acknowledge the switch — for example "Sure, let\'s continue over text!" Keep it to one short sentence. Do NOT say goodbye or end the session.]',
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
    return (this.ws !== null && this.ws.readyState === WebSocket.OPEN) || this._reconnecting;
  }

  // ───────────────────── Silent reconnection ────────────────────

  private _attemptReconnect(): void {
    if (this._reconnecting || this._disconnecting) return;

    this._reconnecting = true;
    this._reconnectAttempts = 0;
    this._audioBuffer = [];

    // Save any partial assistant response that was in-flight when the
    // connection dropped (response.done never arrived for it).
    if (this._currentAssistantText) {
      console.log(`[${this.label}] Saving partial assistant text (${this._currentAssistantText.length} chars) to history before reconnect`);
      this._conversationHistory.push({ role: 'assistant', content: this._currentAssistantText });
      this._currentAssistantText = '';
    }
    // Reset assistant item tracking so the first response after reconnect
    // is treated as a new turn.
    this._currentAssistantItemId = null;

    // Stop any audio playback that was in progress
    this.stopAudio();

    console.log(`[${this.label}] Connection lost — attempting silent reconnection (history: ${this._conversationHistory.length} messages)…`);
    this._doReconnect();
  }

  private _doReconnect(): void {
    if (this._disconnecting) {
      this._reconnecting = false;
      this._audioBuffer = [];
      return;
    }

    this._reconnectAttempts++;
    if (this._reconnectAttempts > this._maxReconnectAttempts) {
      console.error(`[${this.label}] Reconnection failed after ${this._maxReconnectAttempts} attempts`);
      this._reconnecting = false;
      this._audioBuffer = [];
      this.config.onError?.('Connection lost');
      this.config.onDisconnected?.();
      return;
    }

    const delay = this._reconnectBaseDelay * Math.pow(2, this._reconnectAttempts - 1);
    console.log(`[${this.label}] Reconnect attempt ${this._reconnectAttempts}/${this._maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (this._disconnecting) {
        this._reconnecting = false;
        this._audioBuffer = [];
        return;
      }

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const params = new URLSearchParams({
          feature: this.config.feature,
          session_id: this.config.sessionId,
        });
        if (this.config.voice) params.set('voice', this.config.voice);
        const wsUrl =
          apiBaseUrl
            .replace('https://', 'wss://')
            .replace('http://', 'ws://') +
          `/ws/voice/realtime/?${params.toString()}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(`[${this.label}] Reconnected successfully at ${new Date().toISOString()}`);
          this.ws = ws;
          this._reconnecting = false;
          this._reconnectAttempts = 0;
          this._connectedAt = Date.now();
          this._messageCount = 0;

          this.startPingInterval();

          // Wait for session.created, then re-seed conversation context
          setTimeout(() => {
            if (this._conversationHistory.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
              this.seedConversationHistory(this._conversationHistory);
              // Prompt the AI to continue naturally from where it was interrupted
              console.log(`[${this.label}] Prompting AI to continue after reconnect`);
              this.sendText(
                '[System: The voice connection was briefly interrupted and has been restored. ' +
                'The user did not notice. Continue the conversation naturally from exactly where you left off. ' +
                'If you were mid-sentence, complete that thought. Do NOT mention any interruption or technical issue. ' +
                'Do NOT repeat what you already said. Just pick up seamlessly.]',
              );
            }
            // Buffered audio is stale after several seconds — discard it and
            // let the mic feed fresh audio from this point forward.
            this._audioBuffer = [];
          }, 500);
        };

        ws.onmessage = (event) => this.handleMessage(event.data);

        ws.onerror = () => {
          console.warn(`[${this.label}] Reconnect attempt ${this._reconnectAttempts} failed`);
          // Attempt next reconnect
          this._doReconnect();
        };

        ws.onclose = (event: CloseEvent) => {
          console.warn(`[${this.label}] Reconnected WS closed | code=${event.code} reason="${event.reason}" clean=${event.wasClean}`);
          this.stopPingInterval();
          if (!this._disconnecting && !this._reconnecting) {
            this._attemptReconnect();
          }
        };
      } catch {
        this._doReconnect();
      }
    }, delay);
  }

  // ───────────────────── Keepalive ───────────────────────────────

  private startPingInterval(): void {
    this.stopPingInterval();
    this._pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this._lastPingSentAt = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        console.warn(`[${this.label}] Ping skipped — ws.readyState=${this.ws?.readyState ?? 'null'}`);
      }
    }, 25_000);
  }

  private stopPingInterval(): void {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
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

      this._messageCount++;

      switch (type) {
        case 'connection.ready':
          console.log(`[${this.label}] ✅ Connection ready:`, message.message);
          break;

        case 'session.created':
        case 'session.updated':
          console.log(`[${this.label}] ✅ Session updated:`, message);
          break;

        case 'pong':
          this._lastPongAt = Date.now();
          break;

        case 'session.progress':
          console.log(`[${this.label}] 📊 Session progress:`, message);
          this.config.onSessionProgress?.(message as unknown as SessionProgress);
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
          const resp = message.response as Record<string, unknown> | undefined;
          const status = resp?.status;
          console.log(`[${this.label}] Response completed (status: ${status})`);
          // Extract and accumulate token usage
          if (resp?.usage && status !== 'cancelled') {
            this.accumulateTokenUsage(resp.usage as Record<string, unknown>);
          }
          // Save completed assistant response to conversation history
          if (this._currentAssistantText && status !== 'cancelled') {
            this._conversationHistory.push({ role: 'assistant', content: this._currentAssistantText });
            this._currentAssistantText = '';
          }
          // Only resolve the switch-to-text promise on a fully completed
          // response, not on a cancelled one (response.cancel triggers
          // response.done with status "cancelled").
          if (this._responseDoneResolver && status !== 'cancelled') {
            this._responseDoneResolver();
            this._responseDoneResolver = null;
          }
          break;
        }

        case 'error':
          if (this._disconnecting || this._switchInProgress || this._reconnecting) {
            console.log(`[${this.label}] Suppressed error during disconnect/switch/reconnect:`, message.error);
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

  private accumulateTokenUsage(usage: Record<string, unknown>): void {
    const inputDetails = usage.input_token_details as Record<string, unknown> | undefined;
    const outputDetails = usage.output_token_details as Record<string, unknown> | undefined;

    this._tokenUsage.total_tokens += (usage.total_tokens as number) || 0;
    this._tokenUsage.input_tokens += (usage.input_tokens as number) || 0;
    this._tokenUsage.output_tokens += (usage.output_tokens as number) || 0;
    this._tokenUsage.input_text_tokens += (inputDetails?.text_tokens as number) || 0;
    this._tokenUsage.input_audio_tokens += (inputDetails?.audio_tokens as number) || 0;
    this._tokenUsage.input_cached_tokens += (inputDetails?.cached_tokens as number) || 0;
    this._tokenUsage.output_text_tokens += (outputDetails?.text_tokens as number) || 0;
    this._tokenUsage.output_audio_tokens += (outputDetails?.audio_tokens as number) || 0;
    this._tokenUsage.response_count += 1;

    console.log(`[${this.label}] Token usage accumulated (response #${this._tokenUsage.response_count}):`, { ...this._tokenUsage });
    this.config.onTokenUsage?.({ ...this._tokenUsage });
  }

  private handleConversationItem(message: Record<string, unknown>): void {
    const item = message.item as Record<string, unknown> | undefined;
    if (item) {
      console.log(`[${this.label}] Conversation item created:`, item.role, item.type);
      // When server VAD creates a user speech item, place a placeholder in
      // the transcript so it appears before the assistant response.  If VAD
      // splits one utterance into multiple items (consecutive user items
      // with no assistant response in between), they are merged into a
      // single placeholder that gets updated as transcriptions arrive.
      if (item.role === 'user' && item.type === 'message') {
        const content = item.content as Array<Record<string, unknown>> | undefined;
        const hasText = content?.some((c) => c.type === 'input_text' && c.text);
        if (!hasText) {
          const itemId = item.id as string;
          if (!this._userPlaceholderActive) {
            // New user turn — clear any leftover state from previous turns
            // whose transcription completions may have been missed.
            this._pendingUserItemIds.clear();
            this._userItemOrder = [];
            this._userTranscriptParts.clear();
            this._userPlaceholderActive = true;
            this.config.onTranscriptUpdate?.('\u2026', 'user', true);
          }
          this._pendingUserItemIds.add(itemId);
          this._userItemOrder.push(itemId);
        }
      }
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
      // New assistant response: future user speech should start a new bubble
      this._userPlaceholderActive = false;
      // Reset accumulated assistant text for this new response
      this._currentAssistantText = '';
    }
    // Accumulate assistant text for conversation history tracking
    this._currentAssistantText += delta;
    this.config.onTranscriptUpdate?.(delta, role, isNewTurn);
  }

  private handleInputTranscription(message: Record<string, unknown>): void {
    const transcript = message.transcript as string | undefined;
    const itemId = message.item_id as string | undefined;
    if (!transcript) return;

    // Check if this transcription belongs to a tracked (placeholder'd) group
    if (itemId && this._pendingUserItemIds.has(itemId)) {
      this._userTranscriptParts.set(itemId, transcript);
      this._pendingUserItemIds.delete(itemId);

      // Concatenate all received parts in the order items were created
      const fullText = this._userItemOrder
        .map((id) => this._userTranscriptParts.get(id))
        .filter(Boolean)
        .join(' ');

      // Replace the single placeholder with the merged text so far
      this.config.onTranscriptUpdate?.(fullText, 'user', false);

      // When all pending transcriptions have arrived, clean up
      if (this._pendingUserItemIds.size === 0) {
        // Save completed user message to conversation history
        this._conversationHistory.push({ role: 'user', content: fullText });
        this._userTranscriptParts.clear();
        this._userItemOrder = [];
      }
    } else {
      // No placeholder — create a brand-new user entry.
      this.config.onTranscriptUpdate?.(transcript, 'user', true);
      this._conversationHistory.push({ role: 'user', content: transcript });
    }
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
