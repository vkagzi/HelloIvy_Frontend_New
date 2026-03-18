/**
 * AudioWorklet processor that captures PCM audio from the microphone,
 * converts float32 → PCM16, computes RMS audio level, and posts both
 * back to the main thread via MessagePort.
 *
 * Loaded via: audioContext.audioWorklet.addModule('/audio/pcm-processor.js')
 */
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) return true;

    const float32 = input[0];

    // Compute RMS audio level
    let sum = 0;
    for (let i = 0; i < float32.length; i++) {
      sum += float32[i] * float32[i];
    }
    const rms = Math.sqrt(sum / float32.length);

    // Convert float32 → PCM16
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.port.postMessage({ pcm16: pcm16.buffer, rms }, [pcm16.buffer]);
    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
