'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalTTSManager } from '@/app/_hooks/useGlobalTTSManager';
import { useOpenAITTS } from '@/app/_hooks/useOpenAITTS';
import { Checkbox } from '@/app/_components/Checkbox';
import { Heading, Label } from '@/app/_components/Typography';
import { Button } from '@/app/_components/Button';
import { FiIcon } from '@/app/_components/Icons';
import { BrainWithoutBGLottie } from '@/app/_components/LottieAnimation';

const EssayBrainstormIntro: React.FC = () => {
  const router = useRouter();
  useGlobalTTSManager(); // Auto-stop TTS on page navigation
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { speakText } = useOpenAITTS();

  const instructions = `This module helps you lay the foundation for powerful, personalized college essays. If you are a first-time user, you will be asked about your chosen colleges and relevant essay prompts. Have your college list and essay prompts ready before starting. You can brainstorm using your voice or by typing if you prefer. Our AI will ask you questions to discover key moments and experiences from your life that align with your chosen prompts. It will explore both your personal and professional life, so be ready to talk about any significant experiences or passions. At the end, you will receive a structured essay outline with specific stories or angles to guide your next steps. This process will prepare you to effectively use the subsequent AI modules to write complete essay drafts.`;

  const handleListen = () => {
    speakText(instructions);
  };

  const handleStart = () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }
    router.push('/essay-brainstorm/personal-stories-new');
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto px-1">
        {/* Hero Section */}
        <div className="mb-10 flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Content */}
          <div className="flex-1">
            <span
              className="mb-2 bg-[linear-gradient(90deg,#ff5a1f_0%,#ec4899_25%,#8b5cf6_50%,#6366f1_75%,#14b8a6_100%)]  bg-clip-text text-2xl font-semibold  text-transparent md:text-2xl"
              // style={{
              //   backgroundImage:
              //     'linear-gradient(to right, #ef4444, #f97316, #a855f7, #3b82f6, #14b8a6)',
              // }}
            >
              Essay Brainstormer
            </span>
            <Heading level={1} variant="web" className="text-neutral-900 font-extrabold">
              Ready to start
              <br />
              Brainstorming?
            </Heading>
          </div>

          {/* Right - Brain Animation */}
          <div className="shrink-0">
            <BrainWithoutBGLottie loop={true} className="h-[200px] w-[345px]" />
          </div>
        </div>

        {/* Instructions Box */}
        <div className="mb-6 rounded-lg border border-orange-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Go Through Instructions Before We Start The Module
            </h2>
            <Button
              onClick={handleListen}
              variant='outline'
              size='sm'
              className="rounded-md border border-orange-500  text-orange-500  hover:bg-orange-100 bg-orange-50"
            >
              <FiIcon name="volume" className="h-4 w-4" />
              <Label size="md" className="text-orange-500">
                Listen
              </Label>
            </Button>
          </div>

          <ol className="space-y-3 text-neutral-700">
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">1</span>
              <span>
                This module helps you lay the foundation for powerful,
                personalized college essays.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">2</span>
              <span>
                If you are a first-time user, you will be asked about your
                chosen colleges and relevant essay prompts to lay a creative
                baseline and be familiar with your vision and goals.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">3</span>
              <span>
                Have your college list and essay prompts ready before you start
                this module. You can brainstorm using your voice or by typing if
                you prefer.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">4</span>
              <span>
                Our AI will ask you questions to discover key moments and
                experiences from your life that align with your chosen prompts.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">5</span>
              <span>
                It will explore both your personal and professional life, so be
                ready to talk about any significant experiences or passions. It
                will explore your extracurriculars, achievements, and distinct
                challenges you have faced or are facing so that we can present
                the most authentic version of yourself.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">6</span>
              <span>
                At the end, you will receive a structured essay outline with
                specific stories or angles to guide your next steps.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-5 font-semibold">7</span>
              <span>
                This process will prepare you to effectively use the subsequent
                AI modules to write complete essay drafts aligned with your
                dream schools and present the most genuine narrative of your
                journey.
              </span>
            </li>
          </ol>

          {error && (
            <div className="mt-4 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
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
              <span className="text-sm text-neutral-700">
                I have read all the instructions mentioned above.
              </span>
            </label>
          </div>

          {/* Get Started Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleStart}
            disabled={!hasReadInstructions}
            iconRight={<FiIcon name="arrow-small-right" className="h-5 w-5" />}
            className="mt-6"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EssayBrainstormIntro;
