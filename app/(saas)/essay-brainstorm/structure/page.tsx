'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import {
  personalStoriesApi,
  professionalStoriesApi,
  shortTermGoalsApi,
  longTermGoalsApi,
  sessionManagementApi,
  PersonalStory,
  ProfessionalStory,
  ShortTermGoal,
  LongTermGoal,
} from '@/lib/api-services';

/** ===================== Types ===================== */
interface EssayStructure {
  id: string;
  title: string;
  theme: string;
  introduction: string;
  bodyParagraphs: string[];
  conclusion: string;
  keyInsights: string[];
  created_at: string;
}

type MsgRole = 'bot' | 'user';
interface TranscriptMessage {
  id: string;
  type: MsgRole;
  content: string;
  timestamp?: string | Date;
}

/** ===================== OpenAI Setup ===================== */
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 2200,
  temperature = 0.7
): Promise<string> {
  const payload = {
    model: 'gpt-4o-mini',
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok)
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

/** ===================== JSON Parsing Helpers ===================== */
function stripCodeFencesToJSON(text: string): string {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m && m[1] ? m[1].trim() : text.trim();
}
function safeParseArray<T = any>(raw: string): T[] {
  const withoutFences = stripCodeFencesToJSON(raw)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,(\s*[\]}])/g, '$1'); // strip trailing commas
  try {
    const parsed = JSON.parse(withoutFences);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray((parsed as any).structures))
      return (parsed as any).structures;
  } catch {
    // try to slice the first array range
    const first = withoutFences.indexOf('[');
    const last = withoutFences.lastIndexOf(']');
    if (first !== -1 && last !== -1 && last > first) {
      const slice = withoutFences.slice(first, last + 1);
      try {
        const parsed = JSON.parse(slice);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    // last resort: fix single-quoted keys/values
    const alt = withoutFences
      .replace(/'([A-Za-z0-9_]+)'(?=\s*:)/g, '"$1"')
      .replace(/:\s*'([^']*)'/g, ': "$1"');
    try {
      const parsedAlt = JSON.parse(alt);
      if (Array.isArray(parsedAlt)) return parsedAlt;
    } catch {}
  }
  throw new Error('Could not parse structures JSON from OpenAI.');
}

/** ===================== Word Allocation Helpers ===================== */
function pct(n: number, p: number) {
  return Math.max(1, Math.round((n * p) / 100));
}
function rangeStr(min: number, max: number) {
  return min === max ? `${min} words` : `${min}–${max} words`;
}
function buildAllocations(total: number, bodyCount = 3) {
  // Intro 10–15%, each body 20–25%, Conclusion 10–15%
  const introMin = pct(total, 10),
    introMax = pct(total, 15);
  const conclMin = pct(total, 10),
    conclMax = pct(total, 15);
  const bodyMin = pct(total, 20),
    bodyMax = pct(total, 25);
  return {
    introLabel: rangeStr(introMin, introMax),
    conclLabel: rangeStr(conclMin, conclMax),
    bodyLabel: rangeStr(bodyMin, bodyMax),
    bodyCount,
  };
}

/** ===================== Page ===================== */
const EssayStructurePage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();

  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [essayStructures, setEssayStructures] = useState<EssayStructure[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  /** ------- Load latest transcript from conversation page ------- */
  const transcript: TranscriptMessage[] = useMemo(() => {
    try {
      const raw = localStorage.getItem('essay_brainstorm_transcript');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  /** ------- Read supporting context (topic, word limit, etc.) ------- */
  const collegeData = useMemo(() => {
    try {
      const data = localStorage.getItem('college-essay-data');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const wordLimit = useMemo(
    () => Number(collegeData?.wordLimit || 650),
    [collegeData]
  );
  const alloc = useMemo(() => buildAllocations(wordLimit, 3), [wordLimit]);

  /** ------- Build essay context from transcript + saved data ------- */
  async function buildEssayContext(messages: TranscriptMessage[]) {
    // Include *all* turns for better personalization
    const conversation_text = (messages || [])
      .map((m) => `${m.type === 'user' ? 'Student' : 'Coach'}: ${m.content}`)
      .join('\n');

    // Fetch user-specific stories from database
    let personalStories: PersonalStory[] = [];
    let professionalStories: ProfessionalStory[] = [];
    let goals: (ShortTermGoal | LongTermGoal)[] = [];

    try {
      personalStories = await personalStoriesApi.list();
      professionalStories = await professionalStoriesApi.list();
      const shortTermGoals = await shortTermGoalsApi.list();
      const longTermGoals = await longTermGoalsApi.list();
      goals = [...shortTermGoals, ...longTermGoals];
    } catch (error) {
      console.error('Error fetching stories for essay context:', error);
    }

    return {
      essay_topic: collegeData?.essayTopic || '',
      college_name: collegeData?.collegeName || '',
      major: collegeData?.major || '',
      word_limit: wordLimit,
      personal_stories: personalStories,
      professional_stories: professionalStories,
      goals: goals,
      conversation_text,
    };
  }

  /** ------- Generate structures from OpenAI based on transcript ------- */
  async function generateEssayStructures(messages: TranscriptMessage[]) {
    setIsGenerating(true);
    try {
      if (!messages?.length) {
        addToast(
          'No conversation data found. Please complete the brainstorming session first.',
          { type: 'error' }
        );
        router.push('/essay-brainstorm/conversation');
        return;
      }

      const ctx = await buildEssayContext(messages);

      const systemPrompt = `You are an expert essay architect. Based on the student's data BELOW, generate 3 DISTINCT and compelling essay structures with explicit word allocations per section.

STUDENT & ESSAY CONTEXT:
- Topic: ${ctx.essay_topic}
- College: ${ctx.college_name}${ctx.major ? ` — ${ctx.major}` : ''}
- Word Limit: ${ctx.word_limit} words
- Approx allocations to use:
  • Introduction: ${alloc.introLabel}
  • Each body paragraph: ${alloc.bodyLabel}
  • Conclusion: ${alloc.conclLabel}

Use the student's conversation and experience context when shaping the *themes* and *body paragraph focus*.`;

      const userPrompt = `CONVERSATION (latest session):
${ctx.conversation_text}

ADDITIONAL CONTEXT:
- Personal stories (top few): ${JSON.stringify(ctx.personal_stories)?.slice(0, 800)}
- Professional stories (top few): ${JSON.stringify(ctx.professional_stories)?.slice(0, 800)}
- Goals: ${JSON.stringify(ctx.goals)?.slice(0, 800)}

TASK:
Return a STRICT JSON array of exactly 3 essay structures. Each structure must follow this shape:

[
  {
    "title": "Compelling working title aligned with the topic",
    "theme": "1-sentence central idea that ties the story to the topic/major/college",
    "introduction": "What to include in the intro (${alloc.introLabel})",
    "bodyParagraphs": [
      "Body paragraph 1 focus (${alloc.bodyLabel})",
      "Body paragraph 2 focus (${alloc.bodyLabel})",
      "Body paragraph 3 focus (${alloc.bodyLabel})"
    ],
    "conclusion": "How to close and reflect (${alloc.conclLabel})",
    "keyInsights": [
      "Concise bullet 1",
      "Concise bullet 2",
      "Concise bullet 3"
    ]
  }
]

Rules:
- Use the exact word allocation labels in parentheses as shown.
- Body paragraphs must be distinct and build logically.
- Themes and focuses should reflect the student's real experiences and goals.
- Output ONLY the JSON array (no commentary).`;

      const raw = await callOpenAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        2200,
        0.65
      );

      const parsed = safeParseArray<any>(raw);
      const stamped: EssayStructure[] = parsed.map((s, i) => ({
        id: `structure-${Date.now()}-${i}`,
        title: String(s.title || `Structure ${i + 1}`),
        theme: String(s.theme || ''),
        introduction: String(s.introduction || ''),
        bodyParagraphs: Array.isArray(s.bodyParagraphs)
          ? s.bodyParagraphs.map((x: any) => String(x))
          : [],
        conclusion: String(s.conclusion || ''),
        keyInsights: Array.isArray(s.keyInsights)
          ? s.keyInsights.map((x: any) => String(x))
          : [],
        created_at: new Date().toISOString(),
      }));

      setEssayStructures(stamped);
      setSelectedIdx(0);
      localStorage.setItem('essay_structures', JSON.stringify(stamped));
      speakText(
        "Great! I've created essay structures with clear word allocations for each section."
      );
    } catch (error) {
      console.error('Error generating structures:', error);
      addToast('Error generating essay structures. Please try again.', {
        type: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  /** ------- Lifecycle: always generate fresh from latest transcript ------- */
  useEffect(() => {
    generateEssayStructures(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ------- UI Helpers ------- */
  const selected = essayStructures[selectedIdx];
  const headerSubtitle = useMemo(() => {
    const topic = collegeData?.essayTopic
      ? `“${collegeData?.essayTopic}”`
      : 'your essay';
    const wl = wordLimit || 650;
    return `Word limit: ${wl}  •  Intro ${alloc.introLabel}  •  Body ${alloc.bodyLabel} each  •  Conclusion ${alloc.conclLabel}  •  Topic: ${topic}`;
  }, [alloc, collegeData, wordLimit]);

  /** ------- Render ------- */
  if (isGenerating) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <Heading
            level={2}
            className="mb-2 text-xl font-semibold text-gray-900"
          >
            Creating Your Essay Structures
          </Heading>
          <Paragraph className="text-gray-600">
            Analyzing your brainstorming conversation and crafting structures
            with clear word allocations…
          </Paragraph>
        </div>
      </div>
    );
  }

  if (!essayStructures.length) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <Heading
            level={2}
            className="mb-2 text-xl font-semibold text-gray-900"
          >
            No structures yet
          </Heading>
          <Paragraph className="mb-4 text-gray-600">
            We couldn’t create structures. Please go back and complete the
            brainstorming conversation.
          </Paragraph>
          <div className="flex justify-center gap-3">
            <Button
              onClick={() => router.push('/essay-brainstorm/conversation')}
            >
              Back to Brainstorm
            </Button>
            <Button
              variant="secondary"
              onClick={() => generateEssayStructures(transcript)}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Heading level={1} className="text-2xl font-bold text-gray-900">
            🎯 Essay Structure Options
          </Heading>
          <Paragraph className="mt-1 text-gray-600">{headerSubtitle}</Paragraph>
          <div className="mt-3 flex gap-3">
            <Button onClick={() => generateEssayStructures(transcript)}>
              🔁 Regenerate
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  // Clear all essay brainstorming data for fresh start
                  addToast('Clearing all session data for fresh start...', {
                    type: 'info',
                  });
                  await sessionManagementApi.clearAllEssayData();

                  // Clear all localStorage data
                  localStorage.removeItem('essay_structures');
                  localStorage.removeItem('essay_brainstorm_transcript');
                  localStorage.removeItem('brainstorm-data-confirmed');
                  localStorage.removeItem('essay_structure_selected');
                  localStorage.removeItem('clear-session-after-conversation');

                  console.log(
                    '✅ All essay brainstorming data cleared for fresh start'
                  );
                  addToast('All data cleared! Starting fresh session.', {
                    type: 'success',
                  });
                  router.push('/essay-brainstorm');
                } catch (error) {
                  console.error(
                    '❌ Error clearing data for fresh start:',
                    error
                  );
                  addToast(
                    'Failed to clear all data. You may need to manually refresh.',
                    { type: 'error' }
                  );
                  // Still navigate even if cleanup fails
                  localStorage.removeItem('essay_structures');
                  localStorage.removeItem('essay_brainstorm_transcript');
                  router.push('/essay-brainstorm');
                }
              }}
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-3">
        {/* Structures List */}
        <div className="space-y-3 lg:col-span-1">
          {essayStructures.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setSelectedIdx(idx)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                idx === selectedIdx
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900">
                  Structure {idx + 1}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(s.created_at).toLocaleString()}
                </div>
              </div>
              <div className="line-clamp-2 text-sm text-gray-600">
                {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Selected Structure Preview */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selected.title}
                </h2>
                <p className="mt-1 text-gray-600">{selected.theme}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    speakText(
                      `Title: ${selected.title}. Theme: ${selected.theme}. Introduction: ${selected.introduction}. 
                  Body paragraphs: ${selected.bodyParagraphs.join('. ')}. 
                  Conclusion: ${selected.conclusion}. Key insights: ${selected.keyInsights.join(', ')}.`
                    )
                  }
                  disabled={isSpeaking}
                >
                  🔊 Read Aloud
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      // Persist chosen structure if needed by later pages
                      localStorage.setItem(
                        'essay_structure_selected',
                        JSON.stringify(selected)
                      );

                      // Clear all essay brainstorming data - session complete!
                      addToast('Session complete! Cleaning up your data...', {
                        type: 'info',
                      });
                      await sessionManagementApi.clearAllEssayData();

                      // Clear session flags and transcript
                      localStorage.removeItem('brainstorm-data-confirmed');
                      localStorage.removeItem('essay_brainstorm_transcript');
                      localStorage.removeItem(
                        'clear-session-after-conversation'
                      );

                      console.log(
                        '✅ Essay brainstorming session completed and data cleared'
                      );
                      addToast(
                        'Structure saved and session completed! Your essay brainstorming data has been cleared.',
                        { type: 'success' }
                      );

                      // navigate to (optional) outline/draft page if exists
                      // router.push('/essay-brainstorm/draft'); // keep or change as needed
                    } catch (error) {
                      console.error('❌ Error during session cleanup:', error);
                      addToast(
                        'Structure saved, but failed to clean up session data',
                        { type: 'error' }
                      );
                    }
                  }}
                >
                  Use This Structure
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <section>
                <h3 className="font-semibold text-gray-900">Introduction</h3>
                <p className="mt-1 text-gray-700">{selected.introduction}</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900">Body Paragraphs</h3>
                <ol className="mt-2 list-decimal space-y-2 pl-6 text-gray-700">
                  {selected.bodyParagraphs.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ol>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900">Conclusion</h3>
                <p className="mt-1 text-gray-700">{selected.conclusion}</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900">Key Insights</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
                  {selected.keyInsights.map((ki, i) => (
                    <li key={i}>{ki}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayStructurePage;
