'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Paragraph } from '@/app/_components/Typography';
import Button from '@/app/_components/Button';
import { useToast } from '@/app/_components/Toast';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Checkbox } from '@/app/_components/Checkbox';
import ModuleAccessGuard from '@/app/_components/ModuleAccessGuard';

const EssayBrainstormLandingPage: React.FC = () => {
  const { addToast } = useToast();
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();

  // State for landing page
  const [hasReadInstructions, setHasReadInstructions] =
    useState<boolean>(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState<boolean>(true);
  const [instructionsExpanded, setInstructionsExpanded] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Check if user is returning user
  useEffect(() => {
    const checkUserStatus = () => {
      const existingEssays = localStorage.getItem('essay-brainstorm-essays');
      const userProfile = localStorage.getItem('user-profile-data');

      if (existingEssays || userProfile) {
        setIsFirstTimeUser(false);
      }
    };

    checkUserStatus();
  }, []);

  // Intro message from Ivy (Pre-recorded TTS)
  const ivyIntroMessage =
    "Welcome to Essay Brainstorming! I'm Ivy, your AI assistant. I'm here to help you craft compelling essays that showcase your unique story. Together, we'll explore your experiences, connect them to your goals, and create essays that truly represent who you are. Let's begin this exciting journey!";

  // Play Ivy's intro message
  useEffect(() => {
    if (!isSpeaking) {
      speakText(ivyIntroMessage);
    }
  }, []);

  const handleGetStarted = () => {
    if (!hasReadInstructions) {
      addToast('Please read all instructions before proceeding', {
        type: 'error',
      });
      return;
    }

    setLoading(true);

    // Navigate directly to personal stories page
    router.push('/essay-brainstorm/personal-stories-new');
  };

  const playInstructions = () => {
    const instructionsText = `Here are the instructions for Essay Brainstorming:

    Step 1: Complete your profile with personal stories, professional experiences, and goals.

    Step 2: Select your target college and essay topic.

    Step 3: Engage in a voice-first conversation with me to brainstorm your essay ideas.

    Step 4: Review and refine your essay structure.

    Environment: Find a quiet space for voice interaction. You can also use text input if preferred.

    Time: Each brainstorming session takes approximately 30-45 minutes.

    Remember: Be authentic and honest in your responses. There are no right or wrong answers, only your unique story waiting to be told.`;

    speakText(instructionsText);
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600">
                <span className="text-xs font-bold text-white">H</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                HelloIvy
              </span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-sm text-gray-600">Essay Brainstorming</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Ivy's Welcome Message */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-lg text-blue-600">🤖</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-2 text-lg font-semibold text-gray-900"
              >
                Welcome to Essay Brainstorming!
              </Heading>
              <Paragraph className="mb-3 text-sm leading-relaxed text-gray-700">
                Hi there! I'm Ivy, your AI assistant. I'm here to help you craft
                compelling essays that showcase your unique story. Together,
                we'll explore your experiences, connect them to your goals, and
                create essays that truly represent who you are.
              </Paragraph>
              <button
                onClick={() => speakText(ivyIntroMessage)}
                disabled={isSpeaking}
                className="inline-flex items-center gap-2 rounded bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                {isSpeaking ? '🔊 Playing...' : '🔊 Listen to Ivy'}
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm text-blue-600">📋</span>
            </div>
            <div className="flex-1">
              <Heading
                level={3}
                className="mb-3 text-lg font-semibold text-gray-900"
              >
                Instructions
              </Heading>

              {/* Preview Instructions */}
              <div className="mb-4 space-y-2 text-sm text-gray-700">
                <p>
                  • <strong>Step 1:</strong> Complete your profile with personal
                  stories, professional experiences, and goals
                </p>
                <p>
                  • <strong>Step 2:</strong> Select your target college and
                  essay topic
                </p>
                {!instructionsExpanded && (
                  <p>
                    • <strong>Step 3:</strong> Engage in voice-first
                    conversation to brainstorm...
                  </p>
                )}
              </div>

              {/* Expandable Full Instructions */}
              {instructionsExpanded && (
                <div className="mb-4 space-y-2 border-l-2 border-blue-200 pl-4 text-sm text-gray-700">
                  <p>
                    • <strong>Step 3:</strong> Engage in a voice-first
                    conversation with Ivy to brainstorm your essay ideas
                  </p>
                  <p>
                    • <strong>Step 4:</strong> Review and refine your essay
                    structure
                  </p>
                  <p>
                    • <strong>Environment:</strong> Find a quiet space for voice
                    interaction (optional)
                  </p>
                  <p>
                    • <strong>Time:</strong> Each brainstorming session takes
                    approximately 30-45 minutes
                  </p>
                  <p>
                    • <strong>Remember:</strong> Be authentic and honest in your
                    responses. There are no right or wrong answers!
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setInstructionsExpanded(!instructionsExpanded)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {instructionsExpanded ? 'Read Less ↑' : 'Read More ↓'}
                </button>
                <button
                  onClick={playInstructions}
                  disabled={isSpeaking}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  🔊 Listen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoint - Read Instructions */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <Checkbox
              id="instructions-read"
              checked={hasReadInstructions}
              onCheckedChange={(checked) =>
                setHasReadInstructions(Boolean(checked))
              }
              className="mt-1"
            />
            <label
              htmlFor="instructions-read"
              className="flex-1 text-sm text-gray-700"
            >
              <span className="font-medium">I have read all instructions</span>
              <span className="ml-1 text-red-500">*</span>
              <p className="mt-1 text-xs text-gray-500">
                This checkbox is mandatory to proceed to the next step
              </p>
            </label>
          </div>
        </div>

        {/* Get Started Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            label={isFirstTimeUser ? 'Get Started →' : 'Continue →'}
            onClick={handleGetStarted}
            disabled={!hasReadInstructions || loading}
            className={`rounded-lg px-8 py-3 text-base font-medium transition-all ${
              !hasReadInstructions
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md'
            }`}
          />
        </div>

        {/* User Status Indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isFirstTimeUser ? (
              <>
                New to Essay Brainstorming? We'll guide you through every step!
              </>
            ) : (
              <>Welcome back! Ready to continue your essay journey?</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  return (
    <ModuleAccessGuard moduleName="essay_brainstormer" moduleDisplay="Essay Brainstormer">
      <EssayBrainstormLandingPage />
    </ModuleAccessGuard>
  );
}
