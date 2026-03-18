'use client';

export interface RealtimeTranscriptionClientConfig {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: string) => void;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  /** Called ~60 times/sec with the current RMS audio level (0–1). */
  onAudioLevel?: (level: number) => void;
}

export class RealtimeTranscriptionClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private audioStream: MediaStream | null = null;
  private config: RealtimeTranscriptionClientConfig;
  private committedTranscript = '';
  private pendingSegment = '';
  private connected = false;

  constructor(config: RealtimeTranscriptionClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // 1. Open WebSocket to backend Azure proxy
    await new Promise<void>((resolve, reject) => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const wsUrl =
          apiBaseUrl.replace('https://', 'wss://').replace('http://', 'ws://') +
          '/ws/voice/realtime/?feature=transcription-only&session_id=transcription';

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.connected = true;
          this.config.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleEvent(event.data);
        };

        this.ws.onerror = () => {
          const error = 'Realtime transcription websocket error';
          this.config.onError?.(error);
          reject(new Error(error));
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.teardownMic();
          this.config.onClose?.();
          this.ws = null;
        };
      } catch (error) {
        reject(error);
      }
    });

    // 2. Start capturing mic audio and streaming PCM16 over the WS
    await this.openMic();
  }

  /**
   * Commit the buffered audio, wait for the final transcription, then
   * disconnect.  Returns a promise that resolves once the completed
   * transcript has been received (or after a timeout).
   */
  commitAndDisconnect(timeoutMs = 5000): Promise<string> {
    return new Promise<string>((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.disconnect();
        resolve(this.committedTranscript);
        return;
      }

      // Stop recording immediately so no new audio is sent
      this.teardownMic();

      // Commit whatever is buffered
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));

      // Wait for the final transcription event
      const originalOnTranscript = this.config.onTranscript;
      const timer = setTimeout(() => {
        this.config.onTranscript = originalOnTranscript;
        this.disconnect();
        resolve(this.committedTranscript);
      }, timeoutMs);

      this.config.onTranscript = (transcript, isFinal) => {
        originalOnTranscript?.(transcript, isFinal);
        if (isFinal) {
          clearTimeout(timer);
          this.config.onTranscript = originalOnTranscript;
          this.disconnect();
          resolve(transcript);
        }
      };
    });
  }

  disconnect(): void {
    this.connected = false;
    this.committedTranscript = '';
    this.pendingSegment = '';

    this.teardownMic();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  // ─── Mic capture ───────────────────────────────────────────

  private async openMic(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 24000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.audioStream = stream;

    const ctx = new AudioContext({ sampleRate: 24000 });
    this.audioContext = ctx;

    await ctx.audioWorklet.addModule('/audio/pcm-processor.js');

    const source = ctx.createMediaStreamSource(stream);
    this.sourceNode = source;

    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
    this.workletNode = worklet;

    worklet.port.onmessage = (e: MessageEvent<{ pcm16: ArrayBuffer; rms: number }>) => {
      this.config.onAudioLevel?.(e.data.rms);

      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      const base64 = this.arrayBufferToBase64(e.data.pcm16);
      this.ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
    };

    source.connect(worklet);
    worklet.connect(ctx.destination);
  }

  private teardownMic(): void {
    if (this.workletNode) { this.workletNode.disconnect(); this.workletNode = null; }
    if (this.sourceNode) { this.sourceNode.disconnect(); this.sourceNode = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    if (this.audioStream) { this.audioStream.getTracks().forEach((t) => t.stop()); this.audioStream = null; }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // ─── Event handling ────────────────────────────────────────

  private handleEvent(rawData: string): void {
    try {
      const event = JSON.parse(rawData) as {
        type?: string;
        transcript?: string;
        delta?: string;
        error?: { message?: string };
      };

      switch (event.type) {
        case 'conversation.item.input_audio_transcription.delta':
          if (event.delta) {
            this.pendingSegment += event.delta;
            this.config.onTranscript?.(this.committedTranscript + this.pendingSegment, false);
          }
          break;
        case 'conversation.item.input_audio_transcription.completed':
          if (typeof event.transcript === 'string') {
            this.committedTranscript += (this.committedTranscript ? ' ' : '') + event.transcript;
            this.pendingSegment = '';
            this.config.onTranscript?.(this.committedTranscript, true);
          }
          break;
        case 'error':
          this.config.onError?.(event.error?.message || 'Realtime transcription error');
          break;
        default:
          break;
      }
    } catch {
      this.config.onError?.('Failed to parse realtime transcription event');
    }
  }

  private sendEvent(event: object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Realtime transcription websocket is not open');
    }
    this.ws.send(JSON.stringify(event));
  }
}
