// app/app/college/conversation/page.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Heading, Paragraph } from '../../../_components/Typography';
import { useToast } from '../../../_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '../../../_hooks/useOpenAITTS';
import { Textarea } from '@/app/_components/Textarea';
import {
  personalStoriesApi,
  professionalStoriesApi,
  shortTermGoalsApi,
  longTermGoalsApi,
  PersonalStory,
  ProfessionalStory,
  ShortTermGoal,
  LongTermGoal,
} from '../../../../lib/api-services';
import UserStorage from '../../../../lib/user-storage';

type MsgRole = 'bot' | 'user';
interface Message {
  id: string;
  type: MsgRole;
  content: string;
  timestamp: Date;
}

// ==== OpenAI client-only config ====
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  maxTokens = 400
): Promise<string> {
  const payload = {
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: maxTokens,
    temperature: 0.8,
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

const TOTAL_STEPS = 8; // number of AI questions before finalizing

const CollegeConversationPage: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const { speakText, isSpeaking: ttsIsSpeaking } = useOpenAITTS();

  // UI + state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [timer, setTimer] = useState(1800);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  // Structured conversation flow state
  const [conversationStage, setConversationStage] = useState<
    'name_countries' | 'degree_field' | 'general' | 'exam_requirements'
  >('name_countries');
  const [collectedInfo, setCollectedInfo] = useState<{
    name?: string;
    targetCountries?: string[];
    degree?: string;
    fieldOfStudy?: string;
    examRequirements?: string[];
  }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Profile/Stories for smarter prompts (user-specific, authenticated)
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [educationalProfile, setEducationalProfile] = useState<any | null>(
    null
  );
  const [extraCurricularProfile, setExtraCurricularProfile] = useState<any[]>(
    []
  );
  const [personalStories, setPersonalStories] = useState<PersonalStory[]>([]);
  const [professionalStories, setProfessionalStories] = useState<
    ProfessionalStory[]
  >([]);
  const [shortTermGoals, setShortTermGoals] = useState<ShortTermGoal[]>([]);
  const [longTermGoals, setLongTermGoals] = useState<LongTermGoal[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isSpeaking = ttsIsSpeaking;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Persist transcript continuously (user-specific)
    try {
      UserStorage.setItem(
        'college_conversation_transcript',
        JSON.stringify(messages)
      );
    } catch {}
  }, [messages]);

  // simple timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigateToResults();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------- helpers to build profile summary ----------
  const extractExtraCurricular = (profile: any) => {
    if (!profile) return [];
    const candidates = [
      profile.extraCurricular,
      profile.extraCurriculars,
      profile.extraCurricularActivities,
      profile.extracurriculars,
      profile.extra_curricular,
      profile.extra_curriculars,
    ];
    for (const c of candidates) {
      if (!c) continue;
      if (Array.isArray(c)) return c;
      if (typeof c === 'object') return [c];
      if (typeof c === 'string') {
        try {
          const parsed = JSON.parse(c);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [{ description: c }];
        }
      }
    }
    if (profile.profile?.extraCurricular)
      return profile.profile.extraCurricular;
    if (profile.profile_json?.extraCurricular)
      return profile.profile_json.extraCurricular;
    return [];
  };

  const buildEducationalSummary = (): string => {
    if (!educationalProfile) return '';

    const lines: string[] = [];

    // Academic Level
    if (educationalProfile.academicLevel) {
      lines.push(`Academic Level: ${educationalProfile.academicLevel}`);
    }

    // School/Institution details
    if (educationalProfile.schoolName || educationalProfile.institutionName) {
      lines.push(
        `Institution: ${educationalProfile.schoolName || educationalProfile.institutionName}`
      );
    }

    // Degree and Major
    if (educationalProfile.degree)
      lines.push(`Degree: ${educationalProfile.degree}`);
    if (educationalProfile.major)
      lines.push(`Major: ${educationalProfile.major}`);

    // Academic Performance
    if (educationalProfile.gpa || educationalProfile.overallPercentage) {
      lines.push(
        `GPA/Score: ${educationalProfile.gpa || educationalProfile.overallPercentage}`
      );
    }

    // Test Scores
    const testScores: string[] = [];
    if (educationalProfile.testType) {
      testScores.push(
        `${educationalProfile.testType}: ${educationalProfile.totalScore || educationalProfile.yourScore || 'N/A'}`
      );
    }
    if (testScores.length > 0) {
      lines.push(`Test Scores: ${testScores.join(', ')}`);
    }

    // Location
    if (educationalProfile.city || educationalProfile.country) {
      lines.push(
        `Location: ${[educationalProfile.city, educationalProfile.country].filter(Boolean).join(', ')}`
      );
    }

    return lines.join('\n');
  };

  const buildExtraCurricularSummary = (): string => {
    if (!extraCurricularProfile || extraCurricularProfile.length === 0)
      return '';

    return extraCurricularProfile
      .slice(0, 5)
      .map((activity: any) => {
        const parts: string[] = [];

        if (activity.activityType) parts.push(activity.activityType);
        if (activity.positionHeld) parts.push(`(${activity.positionHeld})`);
        if (activity.description)
          parts.push(`- ${String(activity.description).slice(0, 100)}`);
        if (activity.awardsCertifications)
          parts.push(`Awards: ${activity.awardsCertifications}`);

        return `• ${parts.join(' ')}`;
      })
      .join('\n');
  };

  const buildProfileSummary = (): string => {
    const lines: string[] = [];
    if (userProfile) {
      lines.push(
        `Name: ${userProfile.name || userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim()
      );
      if (userProfile.email) lines.push(`Email: ${userProfile.email}`);
      if (userProfile.degree) lines.push(`Degree: ${userProfile.degree}`);
      if (userProfile.university)
        lines.push(`University: ${userProfile.university}`);
      if (userProfile.current_location)
        lines.push(`Location: ${userProfile.current_location}`);
      if (userProfile.target_country)
        lines.push(`Target Country: ${userProfile.target_country}`);
      if (userProfile.target_field)
        lines.push(`Target Field: ${userProfile.target_field}`);
      if (userProfile.gpa) lines.push(`GPA: ${userProfile.gpa}`);
      if (userProfile.budget) lines.push(`Budget: ${userProfile.budget}`);
    } else {
      lines.push('No profile JSON available.');
    }

    // Add educational background
    const educationalSummary = buildEducationalSummary();
    if (educationalSummary) {
      lines.push('\nEducational Background:');
      lines.push(educationalSummary);
    }

    // Add extra-curricular activities
    const extraCurricularSummary = buildExtraCurricularSummary();
    if (extraCurricularSummary) {
      lines.push('\nExtra-Curricular Activities:');
      lines.push(extraCurricularSummary);
    }

    const personal = personalStories
      .slice(0, 3)
      .map((s) =>
        s.what_was_incident
          ? `• ${s.what_was_incident} → ${s.what_impact || 'impact N/A'}`
          : ''
      )
      .filter(Boolean)
      .join('\n');
    const professional = professionalStories
      .slice(0, 3)
      .map((s) =>
        s.what_was_incident
          ? `• ${s.what_was_incident} → ${s.what_impact || 'impact N/A'}`
          : ''
      )
      .filter(Boolean)
      .join('\n');
    const shortGoals = shortTermGoals
      .slice(0, 3)
      .map(
        (g) =>
          `• ${g.industry || 'Unknown'}: ${g.description || g.position || ''}`
      )
      .filter(Boolean)
      .join('\n');
    const longGoals = longTermGoals
      .slice(0, 3)
      .map(
        (g) =>
          `• ${g.industry || 'Unknown'}: ${g.description || g.position || ''}`
      )
      .filter(Boolean)
      .join('\n');
    const extras = extractExtraCurricular(userProfile);

    const extrasText =
      extras && extras.length
        ? extras
            .slice(0, 5)
            .map((e: any) => {
              if (!e) return '';
              if (typeof e === 'string') return `• ${e}`;
              const parts: string[] = [];
              if (e.activityType) parts.push(`${e.activityType}`);
              if (e.positionHeld) parts.push(`(${e.positionHeld})`);
              if (e.description)
                parts.push(`- ${String(e.description).slice(0, 120)}`);
              return `• ${parts.join(' ')}`.trim();
            })
            .filter(Boolean)
            .join('\n')
        : 'None provided.';

    const humanSummary = `
${lines.join('\n')}

Personal stories:
${personal || 'None provided.'}

Professional stories:
${professional || 'None provided.'}

Short-term goals:
${shortGoals || 'None provided.'}

Long-term goals:
${longGoals || 'None provided.'}

Extracurricular activities (top entries):
${extrasText}
`.trim();

    const rawJson = userProfile ? JSON.stringify(userProfile) : '{}';
    return `${humanSummary}\n\nFull profile JSON:\n${rawJson}`;
  };

  // ---------- user authentication check ----------
  const getCurrentUserId = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch('/api/accounts/me', {
        credentials: 'include',
        headers,
      });

      if (res.ok) {
        const userData = await res.json();
        return userData.id?.toString() || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  // ---------- data clearing for user separation ----------
  const clearAllUserData = () => {
    setUserProfile(null);
    setEducationalProfile(null);
    setExtraCurricularProfile([]);
    setPersonalStories([]);
    setProfessionalStories([]);
    setShortTermGoals([]);
    setLongTermGoals([]);
    setCollectedInfo({});
    setMessages([]);
    setConversationStage('name_countries');
    setQuestionCount(0);

    // Clear user-specific localStorage data
    UserStorage.clearUserData();
  };

  // ---------- profile/story fetch (user-specific, authenticated) ----------
  const fetchProfileAndStories = async () => {
    // Check if user is authenticated and get current user ID
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found');
      clearAllUserData();
      return;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('Unable to get current user ID');
      clearAllUserData();
      return;
    }

    // If user has changed, clear all data first
    if (currentUserId && currentUserId !== userId) {
      console.log('User changed, clearing data');
      clearAllUserData();
    }

    setCurrentUserId(userId);

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch personal profile with explicit headers
      const res = await fetch('/api/profile/personal', {
        credentials: 'include',
        headers,
      }).catch(() => null);
      if (res?.ok) {
        const profileData = await res.json();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Failed to fetch personal profile:', error);
    }

    // Fetch educational profile data with explicit authentication
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch('/api/profiles/update/', {
        credentials: 'include',
        headers,
      }).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        if (data?.profile?.profile?.educational) {
          setEducationalProfile(data.profile.profile.educational);
        }
        if (data?.profile?.profile?.extraCurricular) {
          setExtraCurricularProfile(
            Array.isArray(data.profile.profile.extraCurricular)
              ? data.profile.profile.extraCurricular
              : [data.profile.profile.extraCurricular]
          );
        }
      }
    } catch (error) {
      console.error(
        'Failed to fetch educational/extracurricular profile:',
        error
      );
    }

    // Fetch user-specific stories and goals using authenticated API services
    try {
      setPersonalStories(await personalStoriesApi.list());
    } catch (error) {
      console.error('Failed to fetch personal stories:', error);
    }
    try {
      setProfessionalStories(await professionalStoriesApi.list());
    } catch (error) {
      console.error('Failed to fetch professional stories:', error);
    }
    try {
      setShortTermGoals(await shortTermGoalsApi.list());
    } catch (error) {
      console.error('Failed to fetch short term goals:', error);
    }
    try {
      setLongTermGoals(await longTermGoalsApi.list());
    } catch (error) {
      console.error('Failed to fetch long term goals:', error);
    }
  };

  // ---------- OpenAI question generation with retry ----------
  async function withRetry<T>(
    fn: () => Promise<T>,
    label: string,
    tries = 3
  ): Promise<T> {
    let last: any = null;
    for (let i = 1; i <= tries; i++) {
      try {
        return await fn();
      } catch (e) {
        last = e;
        console.warn(`${label} attempt ${i} failed:`, e);
      }
    }
    throw last ?? new Error(`${label} failed`);
  }

  // ---------- Structured conversation generators ----------
  const generateNameAndCountriesQuestion = (): string => {
    const profile = buildProfileSummary();
    const hasName = userProfile?.name || userProfile?.firstName;

    if (hasName) {
      return `Hi ${hasName}! I'm excited to help you find the perfect colleges. To get started, could you tell me your top 3 target countries where you'd like to study?`;
    } else {
      return "Hi there! I'm your college selection advisor and I'm excited to help you find the perfect universities. To get started, could you tell me your name and your top 3 target countries where you'd like to study?";
    }
  };

  const generateDegreeFieldQuestion = (): string => {
    const countries =
      collectedInfo.targetCountries?.join(', ') || 'your target countries';
    return `Great choice on ${countries}! Now, what degree level are you planning to pursue (Bachelor's, Master's, PhD, etc.) and what field of study interests you most?`;
  };

  const generateExamRequirementsQuestion = async (
    countries: string[],
    field: string
  ): Promise<string> => {
    const profile = buildProfileSummary();
    const system = `You are a college counselor expert in international education requirements.`;
    const user = `
The student wants to study ${field} in these countries: ${countries.join(', ')}.

Based on their profile, determine what standardized test scores they might need:
${profile}

Generate ONE question asking about specific exam requirements they need to know about or if they have taken required tests.
Focus on tests like SAT, ACT, GRE, GMAT, IELTS, TOEFL based on their target countries and field.
Be specific about which tests are typically required for their chosen field and countries.

Keep it conversational and helpful.
`;

    return await withRetry(
      () =>
        callOpenAI(
          [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          200
        ),
      'ExamRequirements'
    );
  };

  const extractInfoFromResponse = async (
    response: string,
    stage: string
  ): Promise<any> => {
    const system = `Extract specific information from the user's response. Return only JSON.`;
    const user = `
Extract information based on the conversation stage: ${stage}

User response: "${response}"

For "name_countries" stage, extract:
{
  "name": string | null,
  "targetCountries": string[] | null
}

For "degree_field" stage, extract:
{
  "degree": string | null,
  "fieldOfStudy": string | null
}

Return only the JSON object with extracted information.
`;

    try {
      const result = await withRetry(
        () =>
          callOpenAI(
            [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            150
          ),
        'ExtractInfo'
      );
      const cleaned = result.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {};
    }
  };

  const generateInitialQuestionOpenAI = async (): Promise<string> => {
    return generateNameAndCountriesQuestion();
  };

  const generateFollowUpOpenAI = async (latestUser: string): Promise<string> =>
    withRetry(async () => {
      const profile = buildProfileSummary();
      const convo = messages
        .slice(-8)
        .map((m) => `${m.type === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');

      // Build structured info context
      const structuredContext = `
Collected Information:
- Name: ${collectedInfo.name || 'Not provided'}
- Target Countries: ${collectedInfo.targetCountries?.join(', ') || 'Not provided'}
- Degree Level: ${collectedInfo.degree || 'Not provided'}
- Field of Study: ${collectedInfo.fieldOfStudy || 'Not provided'}
`;

      const system = `You are a friendly College Selection AI counselor who analyzes student profiles against college admission requirements and acceptance criteria.`;
      const user = `
Ask ONE strategic follow-up question to help assess their college readiness and preferences.

IMPORTANT: Use the structured information collected to personalize your question:
${structuredContext}

Your approach:
- Build on their stated target countries: ${collectedInfo.targetCountries?.join(', ') || 'various countries'}
- Reference their chosen field: ${collectedInfo.fieldOfStudy || 'their area of interest'}
- Consider admission requirements for their target countries and field
- Analyze their academic profile strength (GPA, test scores, extracurriculars)
- Compare against typical college admission requirements for their target countries
- Identify profile gaps or strengths for college applications in their target countries
- Gauge fit for target college tiers (reach, match, safety) in their chosen countries

Focus on: budget/aid, GPA/test scores, preferred city/campus size, research vs. liberal arts, internship goals, scholarship interest, and profile competitiveness for their target countries and field.

Mention their academic achievements or suggest improvements when relevant. Reference their test scores/GPA context for college admissions in their target countries.

Profile:
${profile}

Conversation so far:
${convo}

Latest user reply: "${latestUser}"

Output only one question (no preamble).
`;
      const text = await callOpenAI(
        [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        350
      );
      if (!text?.trim()) throw new Error('Empty follow-up');
      return text.trim();
    }, 'FollowUpQuestion');

  // ---------- user authentication monitoring ----------
  useEffect(() => {
    let userCheckInterval: NodeJS.Timeout;

    const checkUserAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        clearAllUserData();
        return;
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        clearAllUserData();
        return;
      }

      // If user has changed, clear all data
      if (currentUserId && currentUserId !== userId) {
        console.log('User authentication changed, clearing data');
        clearAllUserData();
        setCurrentUserId(userId);
        // Re-fetch data for new user
        await fetchProfileAndStories();
      } else if (!currentUserId) {
        setCurrentUserId(userId);
      }
    };

    // Check user authentication every 30 seconds
    userCheckInterval = setInterval(checkUserAuth, 30000);

    return () => {
      if (userCheckInterval) {
        clearInterval(userCheckInterval);
      }
    };
  }, [currentUserId]);

  // ---------- component cleanup ----------
  useEffect(() => {
    return () => {
      // Clear any user-specific data when component unmounts
      // This prevents data leakage between users
      clearAllUserData();
    };
  }, []);

  // ---------- initialize (first AI question) ----------
  useEffect(() => {
    (async () => {
      setIsInitializing(true);
      try {
        await fetchProfileAndStories();
        const firstQ = await generateInitialQuestionOpenAI();
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: firstQ,
          timestamp: new Date(),
        };
        setMessages([botMsg]);
        setQuestionCount(1);
        speakText(firstQ);
      } catch (e) {
        console.error(e);
        addToast('Failed to start college conversation. Please refresh.', {
          type: 'error',
        });
      } finally {
        setIsInitializing(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- send user message ----------
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    const userText = currentMessage.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      let nextQ = '';

      // Handle structured conversation flow
      if (conversationStage === 'name_countries') {
        const extractedInfo = await extractInfoFromResponse(
          userText,
          'name_countries'
        );
        setCollectedInfo((prev) => ({ ...prev, ...extractedInfo }));

        nextQ = generateDegreeFieldQuestion();
        setConversationStage('degree_field');
      } else if (conversationStage === 'degree_field') {
        const extractedInfo = await extractInfoFromResponse(
          userText,
          'degree_field'
        );
        setCollectedInfo((prev) => ({ ...prev, ...extractedInfo }));

        // Check if exam requirements question is needed
        const hasTestScores =
          educationalProfile?.testType ||
          educationalProfile?.totalScore ||
          educationalProfile?.yourScore;

        if (
          !hasTestScores &&
          collectedInfo.targetCountries &&
          extractedInfo.fieldOfStudy
        ) {
          nextQ = await generateExamRequirementsQuestion(
            collectedInfo.targetCountries,
            extractedInfo.fieldOfStudy
          );
          setConversationStage('exam_requirements');
        } else {
          setConversationStage('general');
          nextQ = await generateFollowUpOpenAI(userText);
        }
      } else if (conversationStage === 'exam_requirements') {
        setConversationStage('general');
        nextQ = await generateFollowUpOpenAI(userText);
      } else {
        // General conversation flow
        await updatePreferenceSnapshot();

        if (questionCount >= TOTAL_STEPS) {
          navigateToResults();
          return;
        }

        nextQ = await generateFollowUpOpenAI(userText);
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: nextQ,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setQuestionCount((prev) => prev + 1);
      speakText(nextQ);
    } catch (e) {
      console.error(e);
      addToast('Could not generate the next question. Try again.', {
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- preference snapshot (country/field/budget) ----------
  async function updatePreferenceSnapshot() {
    try {
      const convo = messages
        .concat(
          currentMessage.trim()
            ? [
                {
                  id: 'tmp',
                  type: 'user' as const,
                  content: currentMessage.trim(),
                  timestamp: new Date(),
                },
              ]
            : []
        )
        .map((m) => `${m.type === 'user' ? 'User' : 'AI'}: ${m.content}`)
        .join('\n');

      // Use structured info as primary source, fallback to AI extraction
      const snapshot = {
        country_preference: collectedInfo.targetCountries?.length
          ? collectedInfo.targetCountries[0]
          : null,
        field_preference: collectedInfo.fieldOfStudy || null,
        budget_note: null as string | null,
        // Additional structured data
        name: collectedInfo.name || null,
        target_countries: collectedInfo.targetCountries || [],
        degree_level: collectedInfo.degree || null,
      };

      // Try to extract budget info if not available
      if (!snapshot.budget_note) {
        try {
          const system = `Extract budget preference. Output only JSON.`;
          const user = `
From the conversation, extract:
{
  "budget_note": string | null           // optional short note about budget/aid
}
If no budget mentioned, set null. Output only JSON.

Conversation:
${convo}
`;
          const raw = await withRetry(
            () =>
              callOpenAI(
                [
                  { role: 'system', content: system },
                  { role: 'user', content: user },
                ],
                150
              ),
            'BudgetExtract',
            1
          );
          const cleaned = raw.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned || '{}');
          if (parsed?.budget_note) {
            snapshot.budget_note = parsed.budget_note;
          }
        } catch {}
      }

      UserStorage.setItem(
        'college_preferences_snapshot',
        JSON.stringify(snapshot)
      );
    } catch {}
  }

  // ---------- voice (Whisper) ----------
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      const response = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
          body: formData,
        }
      );
      const result = await response.json();
      return result.text || '';
    } catch (error) {
      addToast('Voice transcription failed', { type: 'error' });
      return '';
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const transcription = await transcribeAudio(audioBlob);
        if (transcription) {
          setCurrentMessage(transcription);
          if (transcription.trim()) await handleSendMessage();
        }
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      addToast('Microphone access denied', { type: 'error' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };
  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  // ---------- nav ----------
  const navigateToResults = () => {
    try {
      UserStorage.setItem(
        'college_conversation_transcript',
        JSON.stringify(messages)
      );
    } catch {}
    addToast('Analyzing your answers to find best-fit colleges…', {
      type: 'success',
    });
    router.push('/college/results');
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---------- render ----------
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-lg font-semibold">
            Setting up your college advisor…
          </div>
          <div className="text-sm text-gray-600">
            Loading your profile and preparing your first question
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Heading
                level={2}
                className="text-xl font-semibold text-gray-900"
              >
                🎓 College Selection Journey
              </Heading>
              <Paragraph className="mt-1 text-sm text-gray-600">
                Stage:{' '}
                {conversationStage === 'name_countries'
                  ? 'Getting to know you'
                  : conversationStage === 'degree_field'
                    ? 'Academic preferences'
                    : conversationStage === 'exam_requirements'
                      ? 'Test requirements'
                      : `Question ${questionCount}/${TOTAL_STEPS}`}
              </Paragraph>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-mono text-lg text-gray-900">
                  {formatTime(timer)} mins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${m.type === 'user' ? 'text-right' : 'text-left'}`}
              >
                {m.type === 'bot' && (
                  <div className="mb-2 flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                      <svg
                        className="h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <span className="flex items-center space-x-1 text-sm text-gray-500">
                      <span>College AI</span>
                      {isSpeaking && (
                        <div className="flex items-center space-x-1 text-purple-500">
                          <svg
                            className="h-4 w-4 animate-pulse"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M3 9v6h4l5 5V4L7 9H3z" />
                          </svg>
                          <span className="text-xs">Speaking…</span>
                        </div>
                      )}
                    </span>
                    <button
                      onClick={() => speakText(m.content)}
                      disabled={isSpeaking}
                      className="p-1 text-gray-400 transition-colors hover:text-purple-500"
                      title="Read aloud"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15.536 8.464a5 5 0 010 7.072"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <div
                  className={`rounded-lg px-4 py-3 ${m.type === 'user' ? 'ml-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'border bg-white text-gray-900 shadow-sm'} `}
                >
                  <Paragraph
                    className={`${m.type === 'user' ? 'text-white' : 'text-gray-900'} leading-relaxed`}
                  >
                    {m.content}
                  </Paragraph>
                </div>
                {m.type === 'user' && (
                  <div className="mt-1 mr-4 text-xs text-gray-500">
                    {m.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl">
                <div className="mb-2 flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                    <svg
                      className="h-4 w-4 animate-pulse text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-500">
                    College AI is thinking…
                  </span>
                </div>
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-purple-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-purple-400"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white px-6 py-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tell me your preferences (country, major, budget, lifestyle)…"
                className="min-h-[80px]"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={toggleRecording}
                disabled={isLoading || isTranscribing}
                className={`rounded-lg border px-4 py-2 transition-colors hover:bg-gray-50 ${isRecording ? 'border-red-300 bg-red-100 text-red-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'} ${isLoading || isTranscribing ? 'cursor-not-allowed opacity-50' : ''}`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? (
                  <div className="flex items-center space-x-1">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-red-500"></div>
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                    </svg>
                  </div>
                ) : isTranscribing ? (
                  <div className="flex items-center space-x-1">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
                    <span className="text-xs">Processing…</span>
                  </div>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 0 1-7 7"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                title="Send"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2z"
                  />
                </svg>
              </button>

              <button
                onClick={navigateToResults}
                className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 whitespace-nowrap text-white hover:from-purple-700 hover:to-blue-700"
              >
                View Results →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeConversationPage;
