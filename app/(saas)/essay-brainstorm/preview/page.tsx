'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../_components/Toast';

// ==== OpenAI client-only config ====
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 1200
): Promise<string> {
  const payload = {
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
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

interface EssayStructure {
  title: string;
  college: string;
  essay_topic: string;
  total_words: number;
  sections: Array<{
    name: string;
    word_range: string;
    focus: string;
    key_elements: string[];
    user_content: string[];
  }>;
  strategic_recommendations: string[];
  personalized: boolean;
}

export default function PreviewPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [essayStructures, setEssayStructures] = useState<EssayStructure[]>([]);
  const [transcript, setTranscript] = useState<any[]>([]);

  useEffect(() => {
    const generateEssayOutlines = async () => {
      setLoading(true);
      try {
        // Get the brainstorming transcript from localStorage
        const storedTranscript = localStorage.getItem(
          'essay_brainstorm_transcript'
        );
        if (!storedTranscript) {
          addToast(
            'No brainstorming conversation found. Please complete the brainstorming session first.',
            { type: 'warning' }
          );
          router.push('/essay-brainstorm/conversation');
          return;
        }

        const transcriptData = JSON.parse(storedTranscript);
        setTranscript(transcriptData);

        if (transcriptData.length === 0) {
          addToast(
            'Empty brainstorming session. Please complete the conversation first.',
            { type: 'warning' }
          );
          router.push('/essay-brainstorm/conversation');
          return;
        }

        // Generate detailed essay structures using conversation analysis
        const structures =
          await generateStructuresFromTranscript(transcriptData);
        setEssayStructures(structures);
      } catch (error) {
        console.error('Error generating essay structures:', error);
        addToast('Failed to generate essay structures. Please try again.', {
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    generateEssayOutlines();
  }, [router, addToast]);

  const generateStructuresFromTranscript = async (
    transcript: any[]
  ): Promise<EssayStructure[]> => {
    try {
      // Get essay brainstorm data from localStorage
      let essayData = null;
      try {
        const stored = localStorage.getItem('essay-brainstorm-data');
        if (stored) {
          essayData = JSON.parse(stored);
        }
      } catch (e) {
        console.log('Could not load essay brainstorm data:', e);
      }

      // Convert transcript to conversation format and analyze user profile
      const conversation = transcript
        .filter((msg) => msg.content && msg.content.trim())
        .map(
          (msg) =>
            `${msg.type === 'user' ? 'Student' : 'Coach'}: ${msg.content}`
        )
        .join('\n\n');

      const userResponses = transcript
        .filter(
          (msg) => msg.type === 'user' && msg.content && msg.content.trim()
        )
        .map((msg) => msg.content)
        .join('\n\n');

      // Deeply analyze conversation to extract user's specific experiences and stories
      const system = `You are an expert essay structure analyst specializing in creating highly personalized essay frameworks. Your job is to analyze the student's specific responses and create essay structures that directly utilize their exact experiences, stories, and insights they shared during brainstorming.

CRITICAL: The structures must be SPECIFIC to what the student actually said, not generic advice. Use their exact words, specific experiences, concrete details, and personal insights they shared.`;

      const user = `
Analyze this brainstorming conversation and create 3 highly personalized essay structures that directly use the student's specific responses.

STUDENT'S ACTUAL BRAINSTORMING RESPONSES:
${userResponses}

FULL CONVERSATION FOR CONTEXT:
${conversation}

ESSAY DETAILS:
${
  essayData
    ? `
Target College: ${essayData.college_name}
Intended Major: ${essayData.major} (${essayData.degree})
Essay Prompt: ${essayData.essay_topic}
Word Limit: ${essayData.essay_limit_value || 650} ${essayData.essay_limit_type || 'words'}
`
    : 'College application essay'
}

INSTRUCTIONS:
1. Read through every student response carefully
2. Extract their specific experiences, challenges, achievements, insights, and goals
3. Identify unique details, names, places, numbers, quotes they mentioned
4. Create structures that directly incorporate their actual stories and examples
5. Make the guidance actionable by referencing what they already told you

For each structure, provide:

Output as JSON with this EXACT format:
[
  {
    "title": "[Specific title based on their main story/theme]",
    "college": "${essayData?.college_name || 'Your Target College'}",
    "essay_topic": "${essayData?.essay_topic || 'College Application Essay'}",
    "total_words": ${essayData?.essay_limit_value || 650},
    "sections": [
      {
        "name": "[Section name relevant to their story]",
        "word_range": "[Calculate exact range adding to total]",
        "focus": "[Specific focus using their actual experience]",
        "key_elements": [
          "[Specific element from their response]",
          "[Another specific element they mentioned]",
          "[Third element from their story]"
        ],
        "user_content": [
          "[Direct reference to something they said - quote or paraphrase]",
          "[Another specific detail from their response]",
          "[Third specific insight they shared]"
        ]
      }
    ],
    "strategic_recommendations": [
      "[Specific advice based on their situation]",
      "[Another recommendation using their details]",
      "[Third recommendation for their specific case]"
    ],
    "personalized": true
  }
]

EXAMPLE of how to be SPECIFIC:
- Instead of "Describe a challenge" → "Write about the time you [specific challenge they mentioned]"
- Instead of "Show leadership" → "Elaborate on your role as [specific position they mentioned] when you [specific action they described]"
- Instead of "Connect to career goals" → "Link this to your goal of [specific career goal they stated] by [specific connection they made]"

Create 3 different structures focusing on different aspects of their responses. Each must be deeply rooted in their actual conversation content.
`;

      const response = await callOpenAI(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        2000
      );

      // Parse the JSON response
      const cleaned = response.replace(/```json|```/g, '').trim();
      const structures = JSON.parse(cleaned);

      // Validate and return up to 3 structures
      if (Array.isArray(structures)) {
        return structures.slice(0, 3).map((structure: any) => ({
          title: structure.title || 'Personalized Essay Structure',
          college:
            structure.college ||
            essayData?.college_name ||
            'Your Target College',
          essay_topic:
            structure.essay_topic ||
            essayData?.essay_topic ||
            'College Application Essay',
          total_words:
            structure.total_words || essayData?.essay_limit_value || 650,
          sections: Array.isArray(structure.sections) ? structure.sections : [],
          strategic_recommendations: Array.isArray(
            structure.strategic_recommendations
          )
            ? structure.strategic_recommendations
            : [],
          personalized: structure.personalized || true,
        }));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error parsing essay structures:', error);

      // Get fallback data
      let essayData = null;
      try {
        const stored = localStorage.getItem('essay-brainstorm-data');
        if (stored) essayData = JSON.parse(stored);
      } catch (e) {}

      const wordLimit = essayData?.essay_limit_value || 650;

      // Recalculate user responses from transcript for fallback
      const userResponsesForFallback = transcript
        .filter(
          (msg) => msg.type === 'user' && msg.content && msg.content.trim()
        )
        .map((msg) => msg.content)
        .join('\n\n');

      // Analyze user responses even in fallback to create some personalization
      const specificKeywords = userResponsesForFallback.toLowerCase();
      const personalizedElements = {
        hasLeadership:
          specificKeywords.includes('lead') ||
          specificKeywords.includes('manage') ||
          specificKeywords.includes('team'),
        hasChallenges:
          specificKeywords.includes('difficult') ||
          specificKeywords.includes('challenge') ||
          specificKeywords.includes('problem'),
        hasGrowth:
          specificKeywords.includes('learn') ||
          specificKeywords.includes('grow') ||
          specificKeywords.includes('improve'),
        hasImpact:
          specificKeywords.includes('help') ||
          specificKeywords.includes('impact') ||
          specificKeywords.includes('change'),
        hasSpecificGoals:
          specificKeywords.includes('want') ||
          specificKeywords.includes('goal') ||
          specificKeywords.includes('plan'),
      };

      // Extract some specific content from user responses (first 100 chars of key responses)
      const responseSnippets = transcript
        .filter(
          (msg) =>
            msg.type === 'user' && msg.content && msg.content.trim().length > 20
        )
        .slice(0, 3)
        .map(
          (msg) =>
            msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '')
        );

      // Fallback structure with some personalization based on user responses
      return [
        {
          title: personalizedElements.hasLeadership
            ? 'Leadership-Driven Essay Structure'
            : personalizedElements.hasChallenges
              ? 'Challenge & Growth Essay Structure'
              : personalizedElements.hasImpact
                ? 'Impact-Focused Essay Structure'
                : 'Personalized Essay Structure',
          college: essayData?.college_name || 'Your Target College',
          essay_topic: essayData?.essay_topic || 'College Application Essay',
          total_words: wordLimit,
          sections: [
            {
              name: 'Opening Hook & Personal Connection',
              word_range: `${Math.floor(wordLimit * 0.2) - 10}-${Math.floor(wordLimit * 0.2) + 10} words`,
              focus: personalizedElements.hasLeadership
                ? 'Open with a specific leadership moment you mentioned'
                : personalizedElements.hasChallenges
                  ? 'Start with the challenge you described in detail'
                  : 'Connect your personal story to your academic motivation',
              key_elements: [
                personalizedElements.hasLeadership
                  ? 'Your leadership role and situation'
                  : 'Compelling opening moment',
                personalizedElements.hasChallenges
                  ? 'The specific challenge you faced'
                  : 'Personal connection to your field',
                'Bridge to essay topic and college choice',
              ],
              user_content:
                responseSnippets.length > 0
                  ? [
                      `Build on: "${responseSnippets[0]}"`,
                      'Add specific details about the setting and context',
                      'Show your initial thoughts and feelings',
                    ]
                  : [
                      'Use specific experiences from your conversation',
                      'Reference concrete examples you discussed',
                    ],
            },
            {
              name: personalizedElements.hasLeadership
                ? 'Leadership Experience & Impact'
                : personalizedElements.hasChallenges
                  ? 'Challenge Resolution & Learning'
                  : 'Core Experience & Development',
              word_range: `${Math.floor(wordLimit * 0.35) - 15}-${Math.floor(wordLimit * 0.35) + 15} words`,
              focus: personalizedElements.hasLeadership
                ? 'Detail your leadership approach and team dynamics'
                : personalizedElements.hasChallenges
                  ? 'Explain how you tackled the challenge and what you learned'
                  : 'Deep dive into your most significant experience',
              key_elements: [
                personalizedElements.hasLeadership
                  ? 'Your leadership strategy and decision-making'
                  : 'Your approach to the situation',
                personalizedElements.hasImpact
                  ? 'Specific impact on others you mentioned'
                  : 'Skills and insights gained',
                personalizedElements.hasGrowth
                  ? 'Personal growth and transformation'
                  : 'Results and outcomes',
              ],
              user_content:
                responseSnippets.length > 1
                  ? [
                      `Expand on: "${responseSnippets[1]}"`,
                      'Include specific actions you took',
                      'Quantify the results and impact',
                    ]
                  : [
                      'Elaborate on key experiences mentioned',
                      'Show specific actions taken',
                    ],
            },
            {
              name: personalizedElements.hasSpecificGoals
                ? 'Academic Goals & Program Fit'
                : 'Program Alignment & Learning Goals',
              word_range: `${Math.floor(wordLimit * 0.25) - 10}-${Math.floor(wordLimit * 0.25) + 10} words`,
              focus: personalizedElements.hasSpecificGoals
                ? 'Connect your stated goals to specific program offerings'
                : 'Link your experience to program features and learning objectives',
              key_elements: [
                `Specific ${essayData?.college_name || 'college'} resources that match your interests`,
                personalizedElements.hasSpecificGoals
                  ? 'How program helps achieve your stated goals'
                  : 'How program fills knowledge gaps',
                'Your unique contribution to the cohort',
              ],
              user_content:
                responseSnippets.length > 2
                  ? [
                      `Reference: "${responseSnippets[2]}"`,
                      'Connect to specific courses or faculty',
                      'Highlight unique perspective you bring',
                    ]
                  : [
                      'Connect to career goals discussed',
                      'Highlight unique perspective',
                    ],
            },
            {
              name: 'Future Vision & Long-term Impact',
              word_range: `${Math.floor(wordLimit * 0.2) - 8}-${Math.floor(wordLimit * 0.2) + 8} words`,
              focus: personalizedElements.hasSpecificGoals
                ? 'Detail your specific career plans and impact goals'
                : 'Articulate your post-graduation vision and broader impact',
              key_elements: [
                personalizedElements.hasSpecificGoals
                  ? 'Your concrete career timeline'
                  : '5-year professional plan',
                personalizedElements.hasImpact
                  ? "How you'll expand the impact you mentioned"
                  : 'Industry/community impact goals',
                'Long-term leadership and contribution vision',
              ],
              user_content: [
                'Build on the future goals you discussed in conversation',
                'Be specific about timeline and success metrics',
                'Show ambition balanced with realistic planning',
              ],
            },
          ],
          strategic_recommendations: [
            responseSnippets.length > 0
              ? 'Start with the vivid moment you described, adding more sensory details'
              : 'Start each section with a vivid, specific moment',
            personalizedElements.hasImpact
              ? 'Quantify the impact you mentioned with specific numbers or outcomes'
              : 'Use specific numbers and concrete details',
            personalizedElements.hasGrowth
              ? 'Emphasize the personal transformation you described'
              : 'Show growth and learning throughout',
            `Connect each section explicitly to why you chose ${essayData?.college_name || 'this college'} and ${essayData?.major || 'this field'}`,
            personalizedElements.hasSpecificGoals
              ? 'Reference the specific goals you mentioned and show clear path to achieving them'
              : 'End with confidence about your potential contribution',
          ],
          personalized: true,
        },
      ];
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Analyzing Your Brainstorming Session
          </h2>
          <p className="text-gray-600">
            Creating detailed essay structures with word allocations and
            strategic guidance...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-blue-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <button
              onClick={() => router.push('/essay-brainstorm/conversation')}
              className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
            >
              ← Continue Brainstorming
            </button>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            📋 Your Personalized Essay Structures
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Based on your brainstorming session, here are detailed essay
            structures with specific word allocations and strategic guidance.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="mx-auto mb-8 max-w-4xl rounded-lg bg-white p-6 shadow-lg">
          <div className="grid gap-6 text-center md:grid-cols-3">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {transcript.length}
              </div>
              <div className="text-sm text-gray-600">Conversation Messages</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {essayStructures.length}
              </div>
              <div className="text-sm text-gray-600">
                Essay Structures Generated
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {transcript.filter((m) => m.type === 'user').length}
              </div>
              <div className="text-sm text-gray-600">
                Your Responses Analyzed
              </div>
            </div>
          </div>
        </div>

        {/* Essay Structures */}
        <div className="mx-auto max-w-6xl space-y-8">
          {essayStructures.map((structure, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg bg-white shadow-lg"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold">
                      {structure.title}
                    </h2>
                    <p className="text-lg text-blue-100 opacity-90">
                      {structure.college}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-opacity-20 mb-1 inline-block rounded-full bg-white px-3 py-1 text-sm font-medium">
                      Structure {index + 1}
                    </span>
                    <div className="text-sm text-blue-100">
                      {structure.total_words} words total
                    </div>
                  </div>
                </div>
                <div className="bg-opacity-10 rounded-lg bg-white p-3">
                  <p className="text-sm font-medium text-blue-50">
                    Essay Topic:
                  </p>
                  <p className="text-sm text-white">{structure.essay_topic}</p>
                </div>
              </div>

              <div className="p-6">
                {/* Section Structure */}
                <div className="mb-8">
                  <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-900">
                    <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                      📝
                    </span>
                    Essay Structure Breakdown
                  </h3>
                  <div className="space-y-4">
                    {structure.sections.map((section, sectionIndex) => (
                      <div
                        key={sectionIndex}
                        className="rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-md"
                      >
                        <div className="mb-3 flex items-start justify-between">
                          <h4 className="flex items-center text-lg font-semibold text-gray-900">
                            <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xs font-bold text-white">
                              {sectionIndex + 1}
                            </span>
                            {section.name}
                          </h4>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                            {section.word_range}
                          </span>
                        </div>

                        <p className="mb-3 font-medium text-gray-700">
                          <strong>Focus:</strong> {section.focus}
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Key Elements */}
                          <div>
                            <h5 className="mb-2 text-sm font-semibold text-gray-900">
                              Key Elements to Include:
                            </h5>
                            <ul className="space-y-1">
                              {section.key_elements.map(
                                (element, elemIndex) => (
                                  <li
                                    key={elemIndex}
                                    className="flex items-start space-x-2 text-sm"
                                  >
                                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></span>
                                    <span className="text-gray-700">
                                      {element}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          {/* User Content */}
                          <div>
                            <h5 className="mb-2 text-sm font-semibold text-gray-900">
                              Based on Your Responses:
                            </h5>
                            <ul className="space-y-1">
                              {section.user_content.map(
                                (content, contentIndex) => (
                                  <li
                                    key={contentIndex}
                                    className="flex items-start space-x-2 text-sm"
                                  >
                                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500"></span>
                                    <span className="text-gray-700">
                                      {content}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                    <span className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm text-white">
                      💡
                    </span>
                    Strategic Recommendations
                  </h3>
                  <div className="space-y-2">
                    {structure.strategic_recommendations.map(
                      (rec, recIndex) => (
                        <div
                          key={recIndex}
                          className="flex items-start space-x-3"
                        >
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600">
                            {recIndex + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-gray-800">
                            {rec}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 space-y-4 text-center">
          <div className="space-x-4">
            <button
              onClick={() => router.push('/essay-brainstorm/conversation')}
              className="rounded-lg border border-blue-600 px-6 py-3 font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              Continue Brainstorming
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white hover:from-blue-700 hover:to-purple-700"
            >
              📋 Save Essay Structures
            </button>
          </div>
          <p className="mx-auto max-w-2xl text-sm text-gray-500">
            Use these detailed structures as frameworks for your college
            application essays. Follow the word allocations and strategic
            guidance to create compelling, well-structured essays.
          </p>
        </div>
      </div>
    </div>
  );
}
