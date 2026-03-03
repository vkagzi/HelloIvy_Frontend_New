'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { useGlobalTTSManager } from '@/app/_hooks/useGlobalTTSManager';
import { Textarea } from '@/components/ui/textarea';
import {
  sessionManagementApi,
  collegeEssayApi,
  CollegeEssayData,
  personalStoriesApi,
  professionalStoriesApi,
  essayGoalsApi,
} from '@/lib/api-services';
import api from '@/lib/api';

// Local types for UI state (with simplified field names)
interface LocalPersonalStory {
  id: string;
  year: number;
  incident: string;
  impact: string;
  created_at?: string;
}

interface LocalProfessionalStory {
  id: string;
  year: number;
  experience: string;
  impact: string;
  created_at?: string;
}

interface Goal {
  id: string;
  type: 'short-term' | 'long-term';
  goal: string;
  motivation: string;
  created_at?: string;
}

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
    model: 'gpt-4o-mini',
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

// Question rotation system to ensure all data elements are covered
const QUESTION_ROTATION = [
  'personal_story',
  'professional_story',
  'short_term_goal',
  'long_term_goal',
  'essay_context',
  'personal_story_alt',
  'professional_story_alt',
  'goals_mixed',
] as const;

type QuestionFocus = (typeof QUESTION_ROTATION)[number];

const EssayBrainstormConversationPage: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const { speakText, isSpeaking: ttsIsSpeaking } = useOpenAITTS();
  const { stopTTS } = useGlobalTTSManager();

  // UI + state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [timer, setTimer] = useState(1800);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Question rotation tracking to ensure systematic coverage
  const getCurrentQuestionFocus = (): QuestionFocus => {
    return QUESTION_ROTATION[questionCount % QUESTION_ROTATION.length];
  };

  // Get specific data element for current question focus
  const getFocusedData = (studentProfile: any, focus: QuestionFocus) => {
    switch (focus) {
      case 'personal_story':
        return {
          type: 'Personal Story',
          data: studentProfile.personal_stories?.[0],
          detail: studentProfile.personal_stories?.[0]?.incident,
          context: `${studentProfile.personal_stories?.[0]?.year}: ${studentProfile.personal_stories?.[0]?.incident} → Impact: ${studentProfile.personal_stories?.[0]?.impact}`,
        };
      case 'personal_story_alt':
        return {
          type: 'Personal Experience',
          data:
            studentProfile.personal_stories?.[1] ||
            studentProfile.personal_stories?.[0],
          detail:
            studentProfile.personal_stories?.[1]?.incident ||
            studentProfile.personal_stories?.[0]?.incident,
          context: `${studentProfile.personal_stories?.[1]?.year || studentProfile.personal_stories?.[0]?.year}: ${studentProfile.personal_stories?.[1]?.incident || studentProfile.personal_stories?.[0]?.incident} → Impact: ${studentProfile.personal_stories?.[1]?.impact || studentProfile.personal_stories?.[0]?.impact}`,
        };
      case 'professional_story':
        return {
          type: 'Professional Experience',
          data: studentProfile.professional_stories?.[0],
          detail: studentProfile.professional_stories?.[0]?.experience,
          context: `${studentProfile.professional_stories?.[0]?.year}: ${studentProfile.professional_stories?.[0]?.experience} → Impact: ${studentProfile.professional_stories?.[0]?.impact}`,
        };
      case 'professional_story_alt':
        return {
          type: 'Professional Story',
          data:
            studentProfile.professional_stories?.[1] ||
            studentProfile.professional_stories?.[0],
          detail:
            studentProfile.professional_stories?.[1]?.experience ||
            studentProfile.professional_stories?.[0]?.experience,
          context: `${studentProfile.professional_stories?.[1]?.year || studentProfile.professional_stories?.[0]?.year}: ${studentProfile.professional_stories?.[1]?.experience || studentProfile.professional_stories?.[0]?.experience} → Impact: ${studentProfile.professional_stories?.[1]?.impact || studentProfile.professional_stories?.[0]?.impact}`,
        };
      case 'short_term_goal':
        const shortTermGoal = studentProfile.goals?.find(
          (g: any) => g.type === 'short-term'
        );
        return {
          type: 'Short-term Goal',
          data: shortTermGoal,
          detail: shortTermGoal?.goal,
          context: `Goal: ${shortTermGoal?.goal} - Why: ${shortTermGoal?.motivation}`,
        };
      case 'long_term_goal':
        const longTermGoal = studentProfile.goals?.find(
          (g: any) => g.type === 'long-term'
        );
        return {
          type: 'Long-term Vision',
          data: longTermGoal,
          detail: longTermGoal?.goal,
          context: `Vision: ${longTermGoal?.goal} - Why: ${longTermGoal?.motivation}`,
        };
      case 'essay_context':
        return {
          type: 'Essay Context',
          data: studentProfile.college_essay?.[0],
          detail: studentProfile.college_essay?.[0]?.essay_type,
          context: `Essay: ${studentProfile.college_essay?.[0]?.essay_type} - Prompt: ${studentProfile.college_essay?.[0]?.prompt} (${studentProfile.college_essay?.[0]?.word_limit} words)`,
        };
      case 'goals_mixed':
        const mixedGoal =
          studentProfile.goals?.[1] || studentProfile.goals?.[0];
        return {
          type: 'Goal Connection',
          data: mixedGoal,
          detail: mixedGoal?.goal,
          context: `Goal: ${mixedGoal?.goal} - Why: ${mixedGoal?.motivation}`,
        };
      default:
        return null;
    }
  };
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Profile/Stories for smarter prompts
  const [personalStories, setPersonalStories] = useState<LocalPersonalStory[]>(
    []
  );
  const [professionalStories, setProfessionalStories] = useState<
    LocalProfessionalStory[]
  >([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const isSpeaking = ttsIsSpeaking;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Persist transcript continuously
    try {
      localStorage.setItem(
        'essay_brainstorm_transcript',
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

  const buildProfileSummary = (): string => {
    // Use the loaded data from state
    const personalStoriesData = personalStories;
    const professionalStoriesData = professionalStories;
    const goalsData = goals;

    // Focus on essay-relevant information
    const essayProfile: string[] = [];

    // Basic info
    essayProfile.push(`Student: Essay Brainstorming Session`);

    // Key experiences for essay topics from loaded data (handle both DB and localStorage formats)
    const personal = personalStoriesData
      .slice(0, 3)
      .map((s: any) => {
        const incident = s.what_was_incident || s.incident;
        const impact = s.what_impact || s.impact;
        const year = s.year_of_incident || s.year;
        return incident
          ? `Personal Story (${year}): ${incident} → Impact: ${impact || 'impact not specified'}`
          : '';
      })
      .filter(Boolean);

    const professional = professionalStoriesData
      .slice(0, 3)
      .map((s: any) => {
        const experience = s.what_did_you_do || s.experience;
        const impact = s.what_impact || s.impact;
        const company = s.company_organization || s.company || 'Company';
        return experience
          ? `Professional Experience (${company}): ${experience} → Impact: ${impact || 'impact not specified'}`
          : '';
      })
      .filter(Boolean);

    // Goals from essayGoalsApi (unified format)
    const goalsList = goalsData
      .slice(0, 6)
      .map((g: any) => {
        const goalType =
          g.type === 'short-term' ? 'Short-term Goal' : 'Long-term Goal';
        return `${goalType}: ${g.goal} → Motivation: ${g.motivation || 'motivation not specified'}`;
      })
      .filter(Boolean);

    // Compile essay-focused profile
    const profileSections: string[] = [
      ...essayProfile,
      ...personal,
      ...professional,
      ...goalsList,
    ].filter(Boolean);

    if (profileSections.length === 0) {
      return 'No profile information available - will ask general essay brainstorming questions.';
    }

    return profileSections.join('\n');
  };

  // ---------- load data from database ----------
  const fetchProfileAndStories = async () => {
    let profile = null;
    // Load user profile from database
    try {
      profile = await api('/api/profiles/update/', { method: 'GET' });
      setUserProfile(profile);
      console.log('Loaded user profile from database:', profile);
    } catch (e) {
      console.error('Error loading user profile from database:', e);
    }
    // Load personal stories from database
    try {
      const stories = await personalStoriesApi.list();
      const convertedStories = stories.map((story) => ({
        id: story.id?.toString() ?? '',
        year: story.year_of_incident
          ? new Date(story.year_of_incident).getFullYear()
          : new Date().getFullYear(),
        incident: story.what_was_incident,
        impact: story.what_impact,
      }));
      setPersonalStories(convertedStories);
      console.log(
        'Loaded personal stories from database:',
        convertedStories.length
      );
    } catch (e) {
      console.error('Error loading personal stories from database:', e);
    }

    // Load professional stories from database
    try {
      const stories = await professionalStoriesApi.list();
      const convertedStories = stories.map((story) => ({
        id: story.id?.toString() ?? '',
        year: story.year_of_incident
          ? new Date(story.year_of_incident).getFullYear()
          : new Date().getFullYear(),
        experience: story.what_was_incident,
        impact: story.what_impact,
      }));
      setProfessionalStories(convertedStories);
      console.log(
        'Loaded professional stories from database:',
        convertedStories.length
      );
    } catch (e) {
      console.error('Error loading professional stories from database:', e);
    }

    // Load goals from database (using essayGoalsApi)
    try {
      const essayGoals = await essayGoalsApi.list();

      const convertedGoals = essayGoals.map((goal) => ({
        id: goal.id?.toString() ?? '',
        type: goal.type as 'short-term' | 'long-term',
        goal: goal.goal,
        motivation: goal.motivation,
      }));

      setGoals(convertedGoals);
      console.log('Loaded goals from database:', convertedGoals.length);
    } catch (e) {
      console.error('Error loading goals from database:', e);
    }

    return profile; // Return the fresh profile data
  };

  // Get college essay data from localStorage
  const getCollegeEssayData = async (): Promise<CollegeEssayData | null> => {
    try {
      const collegeDataList = await collegeEssayApi.list();
      if (collegeDataList.length > 0) {
        // Return the most recent college data
        return collegeDataList[collegeDataList.length - 1];
      }
      return null;
    } catch (e) {
      console.error('Error loading college essay data from database:', e);
      return null;
    }
  };

  // Build ultra-personalized student profile for RAG system - fetch ALL data sources
  const buildUltraPersonalizedProfile = async (freshProfile = null) => {
    // Use fresh profile data if provided, otherwise use state
    const currentProfile = freshProfile || userProfile;

    // Fetch ALL rich data from API services - not just state
    let personalStoriesFromAPI = [];
    let professionalStoriesFromAPI = [];
    let goalsFromAPI = [];
    let collegeDataFromAPI = null;

    try {
      // Fetch personal stories from API
      personalStoriesFromAPI = await personalStoriesApi.list();
      console.log(
        '📚 Fetched personal stories from API:',
        personalStoriesFromAPI.length
      );
    } catch (e) {
      console.error('❌ Error fetching personal stories:', e);
      personalStoriesFromAPI = personalStories; // fallback to state
    }

    try {
      // Fetch professional stories from API
      professionalStoriesFromAPI = await professionalStoriesApi.list();
      console.log(
        '💼 Fetched professional stories from API:',
        professionalStoriesFromAPI.length
      );
    } catch (e) {
      console.error('❌ Error fetching professional stories:', e);
      professionalStoriesFromAPI = professionalStories; // fallback to state
    }

    try {
      // Fetch goals from API (using essayGoalsApi)
      goalsFromAPI = await essayGoalsApi.list();
      console.log('🎯 Fetched goals from API:', goalsFromAPI.length);
    } catch (e) {
      console.error('❌ Error fetching goals:', e);
      goalsFromAPI = goals; // fallback to state
    }

    try {
      // Fetch college essay data from API
      const collegeDataList = await collegeEssayApi.list();
      collegeDataFromAPI =
        collegeDataList && collegeDataList.length > 0
          ? collegeDataList[collegeDataList.length - 1]
          : null;
      console.log('🏫 Fetched college data from API:', !!collegeDataFromAPI);
    } catch (e) {
      console.error('❌ Error fetching college data:', e);
      collegeDataFromAPI = await getCollegeEssayData(); // fallback to existing method
    }

    // Use API data (or fallback to state/localStorage)
    const personalStoriesNew =
      personalStoriesFromAPI.length > 0
        ? personalStoriesFromAPI
        : personalStories;
    const professionalStoriesNew =
      professionalStoriesFromAPI.length > 0
        ? professionalStoriesFromAPI
        : professionalStories;
    const goalsNew = goalsFromAPI.length > 0 ? goalsFromAPI : goals;
    const collegeData = collegeDataFromAPI || (await getCollegeEssayData());

    // Extract real data from user profile with correct deeply nested schema mapping
    const getName = () => {
      // Check for deeply nested structure: profile.profile.personalDetails
      const pd =
        currentProfile?.personalDetails ||
        currentProfile?.profile?.personalDetails ||
        currentProfile?.profile?.profile?.personalDetails;

      // Always return first name only for more personal, natural conversation
      if (pd?.firstName) {
        return pd.firstName; // ✅ always return first name only
      }
      if (pd?.lastName) {
        return pd.lastName; // fallback if only last name available
      }

      // Check other possible name locations, but extract first name only
      const fullName =
        currentProfile?.personal?.name ||
        currentProfile?.name ||
        currentProfile?.full_name ||
        localStorage.getItem('student_name') ||
        localStorage.getItem('user_name');

      if (fullName) {
        return fullName.split(' ')[0]; // Extract first name from full name
      }

      return 'Friend'; // softer fallback than "Student"
    };

    const getCompanyName = (): string => {
      // Check for deeply nested structure: profile.profile.professional
      const professionalData =
        currentProfile?.professional ||
        currentProfile?.profile?.professional ||
        currentProfile?.profile?.profile?.professional;
      const firstProfessional = Array.isArray(professionalData)
        ? professionalData[0]
        : professionalData;

      // Handle both API type (what_was_incident) and local type (experience)
      const firstStory = professionalStoriesNew[0];
      const storyExperience = firstStory
        ? 'what_was_incident' in firstStory
          ? firstStory.what_was_incident
          : 'experience' in firstStory
            ? firstStory.experience
            : null
        : null;

      return (
        firstProfessional?.company ||
        firstProfessional?.company_name ||
        currentProfile?.company_name ||
        storyExperience ||
        'a previous workplace'
      );
    };

    const getJobTitle = () => {
      // Check for deeply nested structure: profile.profile.professional
      const professionalData =
        currentProfile?.professional ||
        currentProfile?.profile?.professional ||
        currentProfile?.profile?.profile?.professional;
      const firstProfessional = Array.isArray(professionalData)
        ? professionalData[0]
        : professionalData;

      return (
        firstProfessional?.job_title ||
        firstProfessional?.role ||
        firstProfessional?.position ||
        currentProfile?.job_title ||
        'a previous role'
      );
    };

    const getDegree = () => {
      // Check for deeply nested structure: profile.profile.educational
      const educationalData =
        currentProfile?.educational ||
        currentProfile?.profile?.educational ||
        currentProfile?.profile?.profile?.educational;
      const firstEducational = Array.isArray(educationalData)
        ? educationalData[0]
        : educationalData;

      return (
        firstEducational?.degree ||
        firstEducational?.level ||
        currentProfile?.degree ||
        currentProfile?.education ||
        'your academic background'
      );
    };

    const getUniversity = () => {
      // Check for deeply nested structure: profile.profile.educational
      const educationalData =
        currentProfile?.educational ||
        currentProfile?.profile?.educational ||
        currentProfile?.profile?.profile?.educational;
      const firstEducational = Array.isArray(educationalData)
        ? educationalData[0]
        : educationalData;

      return (
        firstEducational?.university ||
        firstEducational?.school ||
        firstEducational?.institution ||
        currentProfile?.university ||
        currentProfile?.school ||
        'your university'
      );
    };

    const getLocation = () => {
      // Check for deeply nested structure: profile.profile.personalDetails
      const pd =
        currentProfile?.personalDetails ||
        currentProfile?.profile?.personalDetails ||
        currentProfile?.profile?.profile?.personalDetails;
      return (
        pd?.currentLocation ||
        pd?.location ||
        currentProfile?.personal?.current_location ||
        currentProfile?.current_location ||
        currentProfile?.location ||
        'your location'
      );
    };

    // Debug: Log the actual userProfile structure with deeply nested checks
    console.log('🔍 USER PROFILE DEBUG:', {
      userProfile,
      currentProfile,
      freshProfileProvided: !!freshProfile,
      personalStoriesCount: personalStoriesNew.length,
      professionalStoriesCount: professionalStoriesNew.length,
      collegeData,
      // Log direct, nested, and deeply nested structures
      personalDetails: currentProfile?.personalDetails,
      nestedPersonalDetails: currentProfile?.profile?.personalDetails,
      deeplyNestedPersonalDetails:
        currentProfile?.profile?.profile?.personalDetails,
      professional: currentProfile?.professional,
      nestedProfessional: currentProfile?.profile?.professional,
      deeplyNestedProfessional: currentProfile?.profile?.profile?.professional,
      educational: currentProfile?.educational,
      nestedEducational: currentProfile?.profile?.educational,
      deeplyNestedEducational: currentProfile?.profile?.profile?.educational,
      // Check profile key structure at all levels
      profileKeys: currentProfile ? Object.keys(currentProfile) : [],
      nestedProfileKeys: currentProfile?.profile
        ? Object.keys(currentProfile.profile)
        : [],
      deeplyNestedProfileKeys: currentProfile?.profile?.profile
        ? Object.keys(currentProfile.profile.profile)
        : [],
    });

    // Debug: Log extracted values with the new mapping
    const extractedName = getName();
    const extractedCompany = getCompanyName();
    const extractedJobTitle = getJobTitle();
    const extractedDegree = getDegree();
    const extractedUniversity = getUniversity();
    const extractedLocation = getLocation();

    console.log('🔍 EXTRACTED VALUES DEBUG (New Schema Mapping):', {
      name: extractedName,
      companyName: extractedCompany,
      jobTitle: extractedJobTitle,
      degree: extractedDegree,
      university: extractedUniversity,
      location: extractedLocation,
      // Show if we're falling back to defaults
      isUsingRealName: extractedName !== 'Friend',
      isUsingRealCompany: extractedCompany !== 'a previous workplace',
      isUsingRealDegree: extractedDegree !== 'your academic background',
    });

    // Transform API data to consistent format for OpenAI prompts (handle different schemas)
    const transformedPersonalStories = personalStoriesNew.map((s: any) => ({
      year: s.year_of_incident
        ? new Date(s.year_of_incident).getFullYear()
        : s.year || new Date().getFullYear(),
      incident: s.what_was_incident || s.incident || 'personal experience',
      impact: s.what_impact || s.impact || 'meaningful impact',
    }));

    const transformedProfessionalStories = professionalStoriesNew.map(
      (s: any) => ({
        year: s.year_of_incident
          ? new Date(s.year_of_incident).getFullYear()
          : s.year || new Date().getFullYear(),
        experience:
          s.what_was_incident || s.experience || 'professional experience',
        impact: s.what_impact || s.impact || 'career impact',
      })
    );

    const transformedGoals = goalsNew.map((g: any) => ({
      type: g.type || 'short-term',
      goal: g.goal || 'aspiration',
      motivation: g.motivation || 'personal growth',
    }));

    return {
      name: getName(),
      company_name: getCompanyName(),
      job_title: getJobTitle(),
      degree: getDegree(),
      university: getUniversity(),
      current_location: getLocation(),

      // Rich story and goal data from APIs
      personal_stories: transformedPersonalStories,
      professional_stories: transformedProfessionalStories,
      goals: transformedGoals,

      // Essay context
      essay_topic: collegeData?.essayTopic || '',
      college_name: collegeData?.collegeName || '',
      major: collegeData?.major || '',
      word_limit: collegeData?.wordLimit || 650,

      // Debugging info
      dataSource: {
        personalStoriesCount: transformedPersonalStories.length,
        professionalStoriesCount: transformedProfessionalStories.length,
        goalsCount: transformedGoals.length,
        hasCollegeData: !!collegeData,
      },
    };
  };

  // Create student context string (adapted from RAG.py)
  const createStudentContextString = (studentProfile: any) => {
    if (!studentProfile) {
      return 'No student profile available.';
    }

    let context = `STUDENT PROFILE - ${studentProfile.name}:

KEY PERSONAL DETAILS:
• Name: ${studentProfile.name}
• Professional Experience: ${studentProfile.job_title} at ${studentProfile.company_name}
• Academic Background: ${studentProfile.degree}
• Location: ${studentProfile.current_location}

IMPORTANT: Use these EXACT values - not placeholders!`;

    // Add personal stories
    if (
      studentProfile.personal_stories &&
      studentProfile.personal_stories.length > 0
    ) {
      context += '\n\n🎯 PERSONAL EXPERIENCES TO REFERENCE:';
      for (const story of studentProfile.personal_stories) {
        context += `\n• ${story.year}: ${story.incident} - Impact: ${story.impact}`;
      }
    }

    // Add professional stories
    if (
      studentProfile.professional_stories &&
      studentProfile.professional_stories.length > 0
    ) {
      context += '\n\n💼 PROFESSIONAL EXPERIENCES TO REFERENCE:';
      for (const story of studentProfile.professional_stories) {
        context += `\n• ${story.year}: ${story.incident} - Impact: ${story.impact}`;
      }
    }

    // Add goals (unified format)
    if (studentProfile.goals && studentProfile.goals.length > 0) {
      const shortTermGoals = studentProfile.goals.filter(
        (g: any) => g.type === 'short-term'
      );
      const longTermGoals = studentProfile.goals.filter(
        (g: any) => g.type === 'long-term'
      );

      if (shortTermGoals.length > 0) {
        context += '\n\n🎯 SHORT-TERM GOALS TO CONNECT:';
        for (const goal of shortTermGoals) {
          context += `\n• ${goal.goal} - Why: ${goal.motivation}`;
        }
      }

      if (longTermGoals.length > 0) {
        context += '\n\n🚀 LONG-TERM ASPIRATIONS TO EXPLORE:';
        for (const goal of longTermGoals) {
          context += `\n• ${goal.goal} - Why: ${goal.motivation}`;
        }
      }
    }

    return context;
  };

  // ---------- RAG-based OpenAI question generation ----------
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

  const generateInitialQuestionOpenAI = async (
    freshProfile = null
  ): Promise<string> =>
    withRetry(async () => {
      const studentProfile = await buildUltraPersonalizedProfile(freshProfile);
      const essayTopic = studentProfile.essay_topic;
      const collegeName = studentProfile.college_name;
      const studentName = studentProfile.name;

      // Build rich context string from all API data
      const buildRichContextString = (profile: any) => {
        let context = `STUDENT: ${profile.name}\n\n`;

        if (profile.personal_stories && profile.personal_stories.length > 0) {
          context += `PERSONAL STORIES:\n`;
          profile.personal_stories.slice(0, 3).forEach((s: any) => {
            context += `- ${s.year}: ${s.incident} → Impact: ${s.impact}\n`;
          });
          context += '\n';
        }

        if (
          profile.professional_stories &&
          profile.professional_stories.length > 0
        ) {
          context += `PROFESSIONAL STORIES:\n`;
          profile.professional_stories.slice(0, 3).forEach((s: any) => {
            context += `- ${s.year}: ${s.experience} → Impact: ${s.impact}\n`;
          });
          context += '\n';
        }

        if (profile.goals && profile.goals.length > 0) {
          const shortTermGoals = profile.goals.filter(
            (g: any) => g.type === 'short-term'
          );
          const longTermGoals = profile.goals.filter(
            (g: any) => g.type === 'long-term'
          );

          if (shortTermGoals.length > 0) {
            context += `SHORT-TERM GOALS:\n`;
            shortTermGoals.forEach((g: any) => {
              context += `- ${g.goal} (Why: ${g.motivation})\n`;
            });
            context += '\n';
          }

          if (longTermGoals.length > 0) {
            context += `LONG-TERM GOALS:\n`;
            longTermGoals.forEach((g: any) => {
              context += `- ${g.goal} (Why: ${g.motivation})\n`;
            });
            context += '\n';
          }
        }

        context += `COLLEGE ESSAY CONTEXT:\n`;
        context += `- College: ${profile.college_name}\n`;
        context += `- Major: ${profile.major}\n`;
        context += `- Essay Topic: ${profile.essay_topic}\n`;
        context += `- Word Limit: ${profile.word_limit}\n`;

        return context;
      };

      const richContext = buildRichContextString(studentProfile);

      // Use systematic rotation to ensure all data elements are covered
      const currentFocus = getCurrentQuestionFocus();
      const focusedElement = getFocusedData(studentProfile, currentFocus);

      let profileDetail = '';
      let detailType = '';

      if (focusedElement && focusedElement.detail) {
        profileDetail = `"${focusedElement.detail}" (${focusedElement.context})`;
        detailType = focusedElement.type;
      } else {
        // Fallback to first available element
        const firstPersonalStory = studentProfile.personal_stories?.[0];
        const firstProfessionalStory = studentProfile.professional_stories?.[0];
        const firstShortGoal = studentProfile.goals?.find(
          (g: any) => g.type === 'short-term'
        );

        if (firstPersonalStory?.incident) {
          profileDetail = `"${firstPersonalStory.incident}" which had the impact: "${firstPersonalStory.impact}"`;
          detailType = 'Personal Story';
        } else if (firstProfessionalStory?.experience) {
          profileDetail = `"${firstProfessionalStory.experience}" which had the impact: "${firstProfessionalStory.impact}"`;
          detailType = 'Professional Experience';
        } else if (firstShortGoal?.goal) {
          profileDetail = `"${firstShortGoal.goal}" because "${firstShortGoal.motivation}"`;
          detailType = 'Short-term Goal';
        } else {
          profileDetail = `your application to ${collegeName} for the essay topic "${essayTopic}"`;
          detailType = 'Application Context';
        }
      }

      const prompt = `You are ${studentName}'s friendly essay coach helping them brainstorm ideas.

CONTEXT:
- Personal Stories: ${JSON.stringify(studentProfile.personal_stories || [])}
- Professional Stories: ${JSON.stringify(studentProfile.professional_stories || [])}
- Goals: ${JSON.stringify(studentProfile.goals || [])}
- College Essay: "${essayTopic}" for ${collegeName}

VOICE & STYLE:
- Speak in simple, clear language (as if talking to a 10–15 year old student)
- Avoid big or technical words; use short sentences
- Be friendly, curious, and supportive
- Keep each question under 25 words
- Always greet the student by first name only
- Encourage them by showing interest in their stories, goals, or challenges

RULES FOR QUESTIONS:
1. Always ask about ONE specific detail from these stories, goals, or essay context
2. Use simple words like "tough situations", "step by step", "stay calm"
3. Connect each detail to their essay topic: "${essayTopic}"
4. Be encouraging and playful: "That's cool!", "What was the most exciting part?"
5. Focus on feelings and what they learned
6. Rotate focus across personal stories, professional stories, goals, and essay topic

MANDATORY REFERENCE FOR THIS QUESTION:
${detailType}: ${profileDetail}

Generate a simple, friendly question that references this specific detail and connects it to their essay topic "${essayTopic}".
Start with "${studentName}," (first name only).`;

      const text = await callOpenAI([{ role: 'user', content: prompt }], 150);
      if (!text?.trim()) throw new Error('Empty initial question');
      return text.trim();
    }, 'InitialQuestion');

  const generateFollowUpOpenAI = async (latestUser: string): Promise<string> =>
    withRetry(async () => {
      const studentProfile = await buildUltraPersonalizedProfile();
      const essayTopic = studentProfile.essay_topic;
      const collegeName = studentProfile.college_name;
      const studentName = studentProfile.name;

      // Use systematic rotation for follow-up questions too
      const currentFocus = getCurrentQuestionFocus();
      const focusedElement = getFocusedData(studentProfile, currentFocus);

      // Extract specific words/phrases from their latest response to quote back
      const userWords = latestUser.trim();
      const firstSentence =
        userWords.split('.')[0] || userWords.substring(0, 50);

      let profileDetail = '';
      let detailType = '';

      if (focusedElement && focusedElement.detail) {
        profileDetail = `"${focusedElement.detail}" (${focusedElement.context})`;
        detailType = focusedElement.type;
      } else {
        // Fallback to any available element
        const firstPersonalStory = studentProfile.personal_stories?.[0];
        const firstProfessionalStory = studentProfile.professional_stories?.[0];
        const firstShortGoal = studentProfile.goals?.find(
          (g: any) => g.type === 'short-term'
        );

        if (firstPersonalStory?.incident) {
          profileDetail = `"${firstPersonalStory.incident}" which had the impact: "${firstPersonalStory.impact}"`;
          detailType = 'Personal Story';
        } else if (firstProfessionalStory?.experience) {
          profileDetail = `"${firstProfessionalStory.experience}" which had the impact: "${firstProfessionalStory.impact}"`;
          detailType = 'Professional Experience';
        } else if (firstShortGoal?.goal) {
          profileDetail = `"${firstShortGoal.goal}" because "${firstShortGoal.motivation}"`;
          detailType = 'Short-term Goal';
        }
      }

      const prompt = `You are ${studentName}'s friendly essay coach helping them brainstorm ideas.

CONTEXT:
- Personal Stories: ${JSON.stringify(studentProfile.personal_stories || [])}
- Professional Stories: ${JSON.stringify(studentProfile.professional_stories || [])}
- Goals: ${JSON.stringify(studentProfile.goals || [])}
- College Essay: "${essayTopic}" for ${collegeName}

WHAT ${studentName.toUpperCase()} JUST SAID:
"${latestUser}"

VOICE & STYLE:
- Speak in simple, clear language (as if talking to a 10–15 year old student)
- Avoid big or technical words; use short sentences
- Be friendly, curious, and supportive
- Keep each question under 25 words
- Always greet the student by first name only
- Encourage them by showing interest in their stories, goals, or challenges

RULES FOR FOLLOW-UP QUESTIONS:
1. Always ask about ONE specific detail from these stories, goals, or essay context
2. Quote or mention something they just said: "${firstSentence.substring(0, 30)}..."
3. Connect that detail to their essay topic: "${essayTopic}"
4. Ask about feelings and what they learned
5. Use encouraging words: "That's cool!", "What was the most exciting part?"
6. Rotate focus across personal stories, professional stories, goals, and essay topic

MANDATORY REFERENCE FOR THIS QUESTION:
${detailType}: ${profileDetail}

Generate a simple, friendly follow-up question that:
- References what they just shared
- Connects to this specific detail from their profile
- Links it to their essay topic "${essayTopic}"
Start with "${studentName}," (first name only).`;

      const text = await callOpenAI([{ role: 'user', content: prompt }], 150);
      if (!text?.trim()) throw new Error('Empty follow-up question');
      return text.trim();
    }, 'FollowUpQuestion');

  // ---------- initialize (first AI question) ----------
  useEffect(() => {
    (async () => {
      setIsInitializing(true);
      try {
        // Check if data has been confirmed
        const dataConfirmed = localStorage.getItem('brainstorm-data-confirmed');
        if (!dataConfirmed) {
          addToast('Please review and confirm your information first...', {
            type: 'error',
          });
          router.push('/essay-brainstorm/confirmation');
          return;
        }

        // Check if we have college essay data
        const collegeData = await getCollegeEssayData();
        if (!collegeData) {
          addToast('Missing college and essay information. Redirecting...', {
            type: 'error',
          });
          router.push('/essay-brainstorm/college-selection');
          return;
        }

        const freshProfile = await fetchProfileAndStories();
        console.log('Fresh profile data for AI generation:', freshProfile);
        const firstQ = await generateInitialQuestionOpenAI(freshProfile);
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
        addToast('Failed to start essay brainstorming. Please refresh.', {
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
      if (questionCount >= TOTAL_STEPS) {
        navigateToResults();
        return;
      }

      const nextQ = await generateFollowUpOpenAI(userText);
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

  // ---------- voice (Whisper fallback only) ----------
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    setIsTranscribing(true);
    try {
      // Use our API endpoint which handles Whisper as fallback
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      return result.transcription || '';
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
  const navigateToResults = async () => {
    try {
      localStorage.setItem(
        'essay_brainstorm_transcript',
        JSON.stringify(messages)
      );

      // Check if session should be cleared
      const shouldClearData = localStorage.getItem(
        'clear-session-after-conversation'
      );
      if (shouldClearData === 'true') {
        try {
          addToast('Session complete! Cleaning up data...', { type: 'info' });
          await sessionManagementApi.clearAllEssayData();
          localStorage.removeItem('clear-session-after-conversation');
          localStorage.removeItem('brainstorm-data-confirmed');
          console.log(
            '✅ Essay brainstorming session data cleared after conversation completion'
          );
        } catch (error) {
          console.error('❌ Error clearing session data:', error);
          addToast('Warning: Could not clean up session data', {
            type: 'error',
          });
        }
      }
    } catch {}
    addToast('Analyzing your responses to create essay structure…', {
      type: 'success',
    });
    router.push('/essay-brainstorm/structure');
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
            Setting up your essay brainstorming session…
          </div>
          <div className="text-sm text-gray-600">
            Loading your profile and preparing personalized questions
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-blue-50 to-purple-100">
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Heading
                level={2}
                className="text-xl font-semibold text-gray-900"
              >
                📝 Essay Brainstorming Session
              </Heading>
              <Paragraph className="mt-1 text-sm text-gray-600">
                {questionCount}/{TOTAL_STEPS} questions answered
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-500">
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
                      <span>Essay Coach</span>
                      {isSpeaking && (
                        <div className="flex items-center space-x-1 text-blue-500">
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
                      className="p-1 text-gray-400 transition-colors hover:text-blue-500"
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
                  className={`rounded-lg px-4 py-3 ${m.type === 'user' ? 'ml-12 bg-linear-to-r from-blue-500 to-purple-500 text-white' : 'border bg-white text-gray-900 shadow-sm'} `}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-500">
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
                    Essay Coach is thinking…
                  </span>
                </div>
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400"></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="h-2 w-2 animate-bounce rounded-full bg-blue-400"
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
        <div className="border-t bg-white px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:space-x-4">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Share your thoughts and experiences for essay brainstorming…"
                className="min-h-20"
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
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
                className="rounded-lg bg-linear-to-r from-blue-600 to-purple-600 px-4 py-2 whitespace-nowrap text-white hover:from-blue-700 hover:to-purple-700"
              >
                Preview Essays →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayBrainstormConversationPage;
