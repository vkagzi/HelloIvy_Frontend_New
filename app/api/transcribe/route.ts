import { NextRequest, NextResponse } from 'next/server';

// ========== POST: Whisper transcription ==========
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openAIFormData = new FormData();
    openAIFormData.append('file', audioFile);
    openAIFormData.append('model', 'whisper-1');
    openAIFormData.append('response_format', 'json');

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: openAIFormData,
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Transcription failed' },
        { status: 500 }
      );
    }

    const transcriptionData = await response.json();

    return NextResponse.json({
      transcription: transcriptionData.text || '',
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const ALLOWED_VOICES = new Set(['cedar', 'marin']);

// ========== GET: Realtime ephemeral session ==========
export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY; // server-only secret
  if (!apiKey)
    return new NextResponse('Missing OPENAI_API_KEY', { status: 500 });

  const voiceParam = req.nextUrl.searchParams.get('voice');
  const voice = voiceParam && ALLOWED_VOICES.has(voiceParam) ? voiceParam : 'cedar';

  const body = {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice,
    modalities: ['audio'],
    instructions:
      'You are a warm, conversational essay coach for students aged 10-22. Engage in natural back-and-forth conversation to help them brainstorm essay ideas. Be personalized, encouraging, and ask follow-up questions that help uncover meaningful stories and insights.',
    turn_detection: {
      type: 'server_vad',
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
    },
  };

  const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'realtime=v1',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new NextResponse(text, { status: resp.status });
  }

  const data = await resp.json();
  return NextResponse.json(data); // includes ephemeral client_secret
}
