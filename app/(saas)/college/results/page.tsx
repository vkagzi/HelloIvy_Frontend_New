// app/app/college/results/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import UserStorage from '@/lib/user-storage';

type TranscriptMessage = {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp?: string | Date;
};

interface CollegeRecommendation {
  college_name: string;
  location: string; // "City, Country"
  field_strength: string; // e.g., "Top 10 worldwide in Computer Science"
  match_percentage: number; // 0-100
  why_recommended: string; // short narrative
  alignment_points: string[]; // explicit bullets referencing user's answers
  next_steps: string[]; // actions (tests, documents, scholarships)
  typical_cost?: string; // optional
  acceptance_rate_note?: string; // optional
  notable_programs?: string[]; // optional
}

// ===== OpenAI client =====
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

async function callOpenAI(
  msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 1600
): Promise<string> {
  const payload = {
    model: 'gpt-3.5-turbo',
    messages: msgs,
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

function stripFences(s: string) {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return m?.[1]?.trim() ?? s.trim();
}
function clamp(n: any, lo: number, hi: number) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
}
function toFive(arr: any[]) {
  return Array.isArray(arr) ? arr.slice(0, 5) : [];
}

function parseRecommendations(raw: string): CollegeRecommendation[] {
  const cleaned = stripFences(raw);
  const tryParse = (txt: string) => {
    const json = JSON.parse(txt);
    if (Array.isArray(json)) return json;
    if (json?.recommendations && Array.isArray(json.recommendations))
      return json.recommendations;
    throw new Error('Unexpected JSON shape');
  };

  try {
    const a = tryParse(cleaned);
    return normalize(a);
  } catch {
    const i = cleaned.indexOf('[');
    const j = cleaned.lastIndexOf(']');
    if (i !== -1 && j !== -1 && j > i) {
      const slice = cleaned.slice(i, j + 1);
      const a = tryParse(slice);
      return normalize(a);
    }
    throw new Error('Failed to parse recommendations');
  }
}

function normalize(arr: any[]): CollegeRecommendation[] {
  return toFive(arr)
    .map((r) => ({
      college_name: String(r.college_name ?? r.name ?? '').slice(0, 200),
      location: String(r.location ?? '').slice(0, 200),
      field_strength: String(r.field_strength ?? r.strength ?? '').slice(
        0,
        300
      ),
      match_percentage: clamp(r.match_percentage ?? r.match ?? 0, 0, 100),
      why_recommended: String(r.why_recommended ?? r.why ?? '').slice(0, 1200),
      alignment_points: Array.isArray(r.alignment_points)
        ? r.alignment_points.map(String)
        : [],
      next_steps: Array.isArray(r.next_steps) ? r.next_steps.map(String) : [],
      typical_cost: r.typical_cost ? String(r.typical_cost) : undefined,
      acceptance_rate_note: r.acceptance_rate_note
        ? String(r.acceptance_rate_note)
        : undefined,
      notable_programs: Array.isArray(r.notable_programs)
        ? r.notable_programs.map(String)
        : undefined,
    }))
    .filter((r) => r.college_name && r.location);
}

const CollegeResultsPage: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<CollegeRecommendation[]>([]);

  const transcript: TranscriptMessage[] = useMemo(() => {
    try {
      const data = UserStorage.getItem('college_conversation_transcript');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const prefs = useMemo(() => {
    try {
      const data = UserStorage.getItem('college_preferences_snapshot');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        if (!transcript.length) {
          setError(
            'No conversation transcript found. Please complete the college conversation first.'
          );
          addToast('No conversation to analyze.', { type: 'warning' });
          return;
        }

        const r = await generateCollegeRecommendations(transcript, prefs);
        setRecs(r);
        if (!r.length) setError('No colleges generated. Please try again.');
      } catch (e) {
        console.error(e);
        setError('Failed to load college recommendations.');
        addToast('Failed to load college recommendations', { type: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function withRetry<T>(fn: () => Promise<T>, tag: string, tries = 3) {
    let last: any = null;
    for (let i = 1; i <= tries; i++) {
      try {
        return await fn();
      } catch (e) {
        last = e;
        console.warn(`${tag} attempt ${i} failed:`, e);
      }
    }
    throw last ?? new Error(`${tag} failed`);
  }

  function buildEducationalProfileSummary(educational: any): string {
    const lines: string[] = [];

    // Academic Level and Institution
    if (educational.academicLevel) {
      lines.push(`• Academic Level: ${educational.academicLevel}`);
    }

    if (educational.schoolName || educational.institutionName) {
      lines.push(
        `• Institution: ${educational.schoolName || educational.institutionName}`
      );
    }

    // Academic Performance Metrics
    if (educational.degree) lines.push(`• Degree: ${educational.degree}`);
    if (educational.major) lines.push(`• Major/Field: ${educational.major}`);

    // GPA and Academic Standing
    if (educational.gpa || educational.overallPercentage) {
      lines.push(
        `• Academic Performance: ${educational.gpa || educational.overallPercentage}`
      );
    }

    if (educational.estimatedRank) {
      lines.push(`• Class Rank: ${educational.estimatedRank}`);
    }

    // Standardized Test Scores (Critical for admissions)
    const testScores: string[] = [];
    if (
      educational.testType &&
      (educational.totalScore || educational.yourScore)
    ) {
      testScores.push(
        `${educational.testType}: ${educational.totalScore || educational.yourScore}`
      );
    }

    // Subject-specific scores
    if (educational.mathYourScore)
      testScores.push(`Math: ${educational.mathYourScore}`);
    if (educational.englishYourScore)
      testScores.push(`English: ${educational.englishYourScore}`);
    if (educational.writingYourScore)
      testScores.push(`Writing: ${educational.writingYourScore}`);
    if (educational.criticalReadingYourScore)
      testScores.push(`Reading: ${educational.criticalReadingYourScore}`);

    if (testScores.length > 0) {
      lines.push(`• Test Scores: ${testScores.join(', ')}`);
    }

    // Academic Background Context
    if (educational.board)
      lines.push(`• Education Board: ${educational.board}`);
    if (educational.yearOfCompletion)
      lines.push(`• Year of Completion: ${educational.yearOfCompletion}`);

    // Location for regional considerations
    if (educational.city || educational.country) {
      lines.push(
        `• Education Location: ${[educational.city, educational.country].filter(Boolean).join(', ')}`
      );
    }

    // Gap years (affects application strategy)
    if (educational.gapYears && educational.gapYears !== '0 Year') {
      lines.push(`• Gap Years: ${educational.gapYears}`);
    }

    // Awards and courses (additional strengths)
    if (educational.awards)
      lines.push(`• Academic Awards: ${educational.awards}`);

    return lines.join('\n');
  }

  function buildExtraCurricularProfileSummary(extraCurricular: any): string {
    const activities = Array.isArray(extraCurricular)
      ? extraCurricular
      : [extraCurricular];

    return activities
      .slice(0, 10)
      .map((activity: any, index: number) => {
        const parts: string[] = [];

        if (activity.activityType) {
          parts.push(`Activity ${index + 1}: ${activity.activityType}`);
        }

        if (activity.positionHeld) {
          parts.push(`Position: ${activity.positionHeld}`);
        }

        if (activity.duration) {
          parts.push(`Duration: ${activity.duration}`);
        }

        if (activity.description) {
          parts.push(
            `Description: ${String(activity.description).slice(0, 150)}`
          );
        }

        if (activity.awardsCertifications) {
          parts.push(`Awards: ${activity.awardsCertifications}`);
        }

        if (activity.city || activity.country) {
          parts.push(
            `Location: ${[activity.city, activity.country].filter(Boolean).join(', ')}`
          );
        }

        return `• ${parts.join(' | ')}`;
      })
      .join('\n');
  }

  async function generateCollegeRecommendations(
    transcript: TranscriptMessage[],
    prefs: any
  ): Promise<CollegeRecommendation[]> {
    const convo = transcript
      .slice(-40)
      .map((m) => `${m.type === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');
    const countryPref = prefs?.country_preference ?? null;
    const fieldPref = prefs?.field_preference ?? null;

    // Fetch additional profile data for enhanced recommendations (user-specific)
    let profileContext = '';
    try {
      // Ensure user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No authentication token found for profile fetch');
        // Continue without profile context
      } else {
        const headers = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const res = await fetch('/api/profiles/update/', {
          credentials: 'include',
          headers,
        });
        if (res?.ok) {
          const data = await res.json();
          const educational = data?.profile?.profile?.educational;
          const extraCurricular = data?.profile?.profile?.extraCurricular;

          if (educational || extraCurricular) {
            profileContext =
              '\n\nDetailed Academic Profile for College Matching:';

            if (educational) {
              const educationalSummary =
                buildEducationalProfileSummary(educational);
              profileContext += `\nEducational Background:\n${educationalSummary}`;
            }

            if (extraCurricular) {
              const extraSummary =
                buildExtraCurricularProfileSummary(extraCurricular);
              profileContext += `\nExtra-curricular Activities:\n${extraSummary}`;
            }
          }
        } else {
          console.warn(
            'Failed to fetch profile data or received invalid response'
          );
        }
      }
    } catch (error) {
      console.error(
        'Error fetching profile data for college recommendations:',
        error
      );
      // Continue without profile context if fetch fails
    }

    const hardRule = `
HARD RULES:
- Return EXACTLY 5 colleges.
- All colleges MUST be in the user's preferred country. If multiple countries were mentioned, infer the primary one; if ambiguous, infer from context and state the assumption briefly in why_recommended.
- Prioritize the user's FIELD preference (major/discipline). If ambiguous, infer from conversation and state the assumption.
`;

    const system = `You are an expert college counselor who analyzes student profiles against college admission requirements and acceptance criteria. You specialize in matching students with colleges based on their academic performance, test scores, extracurricular activities, and realistic admission chances. Respond with pure JSON only.`;
    const user = `
Given the conversation and detailed academic profile, produce an array of exactly 5 colleges that best fit the student.

CRITICAL ANALYSIS REQUIREMENTS:
1. Academic Profile Strength Assessment:
   - Analyze GPA/academic performance vs college admission standards
   - Evaluate test scores (SAT, ACT, GRE, GMAT, etc.) against college requirements
   - Consider class rank and academic level context
   - Review extracurricular leadership and achievements

2. College Matching Strategy:
   - Provide 1-2 "reach" schools (student's stats below typical admits)
   - Provide 2-3 "match" schools (student's stats align with typical admits)
   - Provide 1-2 "safety" schools (student's stats exceed typical admits)

3. Extracurricular Impact:
   - Evaluate leadership positions and awards
   - Consider activity diversity and commitment
   - Assess how activities align with intended major

4. Realistic Admission Assessment:
   - Compare student's profile to typical admitted students
   - Consider acceptance rates and competitiveness
   - Factor in any profile weaknesses or gaps

Conversation (latest first, truncated):
${convo}${profileContext}

Known preferences (may be null):
- country_preference: ${countryPref ?? 'null'}
- field_preference: ${fieldPref ?? 'null'}

${hardRule}

Each item must follow this JSON schema:
{
  "college_name": string,
  "location": string,                 // "City, Country"
  "field_strength": string,           // how strong it is in the requested field
  "match_percentage": number,         // 0–100 (based on comprehensive profile analysis)
  "why_recommended": string,          // detailed narrative including: profile fit, admission probability, reach/match/safety classification
  "alignment_points": string[],       // 4–6 bullets: specific profile elements that align with this college
  "next_steps": string[],             // 5–7 strategic actions: test improvements, profile strengthening, application requirements
  "typical_cost": string | null,      // tuition and living costs if known
  "acceptance_rate_note": string | null, // explicit comparison: "Your profile is above/below/aligned with typical admits (provide stats)"
  "notable_programs": string[] | null  // specific programs that match their profile and interests
}

ENHANCED OUTPUT REQUIREMENTS:
- Output ONLY the JSON array (no markdown fences).
- Each college must be clearly categorized as reach/match/safety in why_recommended.
- Reference specific test scores, GPA, and extracurriculars in alignment_points.
- Include admission probability assessment based on their actual profile data.
- Provide specific improvement suggestions if profile has gaps.
- Consider how their extracurricular activities strengthen their application to each college.
`;

    const raw = await withRetry(
      () =>
        callOpenAI(
          [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          2000
        ),
      'CollegeRecs'
    );
    return parseRecommendations(raw);
  }

  const getBadgeClass = (pct: number) =>
    pct >= 90
      ? 'text-green-600 bg-green-100'
      : pct >= 80
        ? 'text-blue-600 bg-blue-100'
        : pct >= 70
          ? 'text-yellow-600 bg-yellow-100'
          : 'text-gray-600 bg-gray-100';

  const getIcon = (pct: number) =>
    pct >= 90 ? '🌟' : pct >= 80 ? '🎯' : pct >= 70 ? '✨' : '💡';

  const getSchoolType = (
    recommendation: string
  ): { type: string; color: string; icon: string } => {
    const lowerRec = recommendation.toLowerCase();
    if (lowerRec.includes('reach') || lowerRec.includes('stretch')) {
      return {
        type: 'Reach School',
        color: 'text-red-600 bg-red-100',
        icon: '🎯',
      };
    } else if (lowerRec.includes('safety') || lowerRec.includes('likely')) {
      return {
        type: 'Safety School',
        color: 'text-green-600 bg-green-100',
        icon: '✅',
      };
    } else {
      return {
        type: 'Match School',
        color: 'text-blue-600 bg-blue-100',
        icon: '🎓',
      };
    }
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Analyzing Your Conversation
          </h2>
          <p className="text-gray-600">
            Finding the best-fit colleges in your preferred country and field…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 p-3">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Unable to Load Colleges
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/college')}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              Start New Conversation
            </button>
            <button
              onClick={() => location.reload()}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avgMatch = recs.length
    ? Math.round(recs.reduce((s, r) => s + r.match_percentage, 0) / recs.length)
    : 0;

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <Heading level={1} className="mb-4 text-4xl font-bold text-gray-900">
            🏛️ Your Best-Fit Colleges
          </Heading>
          <Paragraph className="mx-auto max-w-3xl text-xl text-gray-600">
            Based on your conversation, these 5 colleges fit your preferred{' '}
            <strong>country</strong> and <strong>field</strong>, with clear
            reasons why they match your interests.
          </Paragraph>
        </div>

        {/* Summary */}
        <div className="mx-auto mb-8 max-w-4xl rounded-lg bg-white p-6 shadow-lg">
          <div className="grid gap-6 text-center md:grid-cols-5">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {recs.length}
              </div>
              <div className="text-sm text-gray-600">Total Colleges</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {avgMatch}%
              </div>
              <div className="text-sm text-gray-600">Average Match</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {
                  recs.filter(
                    (r) =>
                      getSchoolType(r.why_recommended).type === 'Reach School'
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">🎯 Reach Schools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {
                  recs.filter(
                    (r) =>
                      getSchoolType(r.why_recommended).type === 'Match School'
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">🎓 Match Schools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {
                  recs.filter(
                    (r) =>
                      getSchoolType(r.why_recommended).type === 'Safety School'
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600">✅ Safety Schools</div>
            </div>
          </div>
        </div>

        {/* College Cards */}
        <div className="mx-auto max-w-5xl space-y-6">
          {recs.map((c, idx) => {
            const schoolType = getSchoolType(c.why_recommended);
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-lg bg-white shadow-lg"
              >
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {getIcon(c.match_percentage)}
                      </span>
                      <div>
                        <h3 className="text-2xl font-bold">{c.college_name}</h3>
                        <p className="text-purple-100 opacity-90">
                          {c.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${getBadgeClass(c.match_percentage)}`}
                      >
                        {c.match_percentage}% Match
                      </div>
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${schoolType.color}`}
                      >
                        {schoolType.icon} {schoolType.type}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Left */}
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-gray-900">
                        Field Strength
                      </h4>
                      <p className="mb-4 text-gray-700">{c.field_strength}</p>

                      <h4 className="mb-2 text-lg font-semibold text-gray-900">
                        Why It Fits You
                      </h4>
                      <p className="mb-4 text-gray-700">{c.why_recommended}</p>

                      <h4 className="mb-3 text-lg font-semibold text-gray-900">
                        How This Aligns with Your Interests
                      </h4>
                      <ul className="mb-4 space-y-2">
                        {c.alignment_points.map((p, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <svg
                              className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-700">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right */}
                    <div>
                      <h4 className="mb-2 text-lg font-semibold text-gray-900">
                        Next Steps
                      </h4>
                      <ul className="mb-6 space-y-2">
                        {c.next_steps.map((s, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <svg
                              className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-700">{s}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="grid grid-cols-1 gap-3">
                        {c.typical_cost && (
                          <div className="rounded bg-gray-50 p-3 text-gray-700">
                            <span className="font-medium">Typical Cost: </span>
                            {c.typical_cost}
                          </div>
                        )}
                        {c.acceptance_rate_note && (
                          <div className="rounded bg-gray-50 p-3 text-gray-700">
                            <span className="font-medium">Selectivity: </span>
                            {c.acceptance_rate_note}
                          </div>
                        )}
                        {c.notable_programs?.length ? (
                          <div className="rounded bg-gray-50 p-3">
                            <div className="mb-1 font-medium text-gray-900">
                              Notable Programs
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {c.notable_programs.map((np, i) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                                >
                                  {np}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 space-x-4 text-center">
          <button
            onClick={() => router.push('/college')}
            className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white hover:from-purple-700 hover:to-blue-700"
          >
            Refine Conversation
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            📄 Save Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegeResultsPage;
