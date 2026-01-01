import { NextResponse } from 'next/server';

// GET endpoint for creating realtime session
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY; // server-only secret
  if (!apiKey) {
    return new NextResponse('Missing OPENAI_API_KEY', { status: 500 });
  }

  const body = {
    model: 'gpt-4o-realtime-preview-2024-12-17',
    voice: 'verse',
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

  try {
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
  } catch (error) {
    console.error('Realtime session creation error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
