'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Checkbox } from '@/app/_components/Checkbox';
import { Button } from '@/app/_components/Button';
import { FiIcon } from '@/app/_components/Icons';
import { Heading, Label } from '@/app/_components/Typography';
import LottieAnimation, { BrainWithoutBGLottie, IvyWithoutBGLottie } from '@/app/_components/LottieAnimation';

export default function CollegeLandingPage() {
  const router = useRouter();
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { speakText, isSpeaking } = useOpenAITTS();

  const instructions = `This module helps you discover colleges that align with your academic goals, preferences, and dreams. We'll explore colleges worldwide based on your preferred country, academic field, and budget. You'll receive customized college recommendations based on your profile and express your preferences naturally with voice or text. The process takes 15-20 minutes and covers preferred countries, academic fields, budget, and campus preferences. You'll get your top 5 personalized college recommendations with detailed insights.`;

  const handleListen = () => {
    speakText(instructions);
  };

  const handleStart = () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }
    setIsLoading(true);
    router.push('/college/conversation');
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="mx-auto px-1">
        {/* Hero Section */}
        <div className="mb-10 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div className="flex-1">
            <span className="mb-2 bg-[linear-gradient(90deg,#ff5a1f_0%,#ec4899_25%,#8b5cf6_50%,#6366f1_75%,#14b8a6_100%)] bg-clip-text text-2xl font-semibold text-transparent md:text-2xl">
              College Selector
            </span>
            <Heading level={1} variant="web" className="font-extrabold text-neutral-900">
              Ready to start
              <br />
              College Selection?
            </Heading>
          </div>

          {/* Right - Brain Animation */}
          <div className="shrink-0">
            <BrainWithoutBGLottie loop={true} className="h-[200px] w-[345px]" />
          </div>
        </div>

        {/* Instructions Box */}
        <div className="mb-6 rounded-lg border border-orange-200 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Go Through Instructions Before We Start The Module
            </h2>
            <Button
              onClick={handleListen}
              variant="outline"
              size="sm"
              className="rounded-md border border-orange-500 bg-orange-50 text-orange-500 hover:bg-orange-100"
            >
              <FiIcon name="volume" className="h-4 w-4" />
              <Label size="md" className="text-orange-500">
                Listen
              </Label>
            </Button>
          </div>

          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">1</span>
              <span>
                This module helps you discover colleges that align with your
                academic goals, preferences, and dreams through personalized
                AI-powered conversations.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">2</span>
              <span>
                Explore colleges worldwide based on your preferred country,
                academic field, and budget. Get customized recommendations based
                on your profile.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">3</span>
              <span>
                Express your preferences naturally with voice input or
                traditional text conversations.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">4</span>
              <span>
                The process takes 15-20 minutes and covers topics including
                preferred countries, academic fields, budget, and campus
                preferences.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">5</span>
              <span>
                You'll receive your top 5 personalized college recommendations
                with detailed insights about colleges that match your academic
                interests, budget-friendly options, campus culture alignment,
                and application requirements.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">6</span>
              <span>
                Find a comfortable space for focused discussion and be ready to
                share your academic aspirations and college preferences.
              </span>
            </li>
          </ol>

          {error && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={hasReadInstructions}
                onCheckedChange={(checked) =>
                  setHasReadInstructions(Boolean(checked))
                }
                className="mt-1"
              />
              <span className="text-sm text-gray-700">
                I have read all the instructions mentioned above.
              </span>
            </label>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            disabled={isLoading || !hasReadInstructions}
            iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
            className="mt-6"
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}
