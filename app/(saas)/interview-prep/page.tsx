'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOpenAITTS } from '../../_hooks/useOpenAITTS';
import { Checkbox } from '@/app/_components/Checkbox';

const InterviewPrepLandingPage: React.FC = () => {
  const router = useRouter();
  const { speakText, isSpeaking } = useOpenAITTS();
  const [hasReadInstructions, setHasReadInstructions] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const instructions = `This module helps you master your interview skills with AI-powered practice sessions, personalized feedback, and expert coaching. Choose from undergraduate admissions, graduate programs, or MBA interviews. Upload your resume for personalized questions based on your background. Practice answering interview questions using voice or text input, and receive detailed analysis with scoring and improvement tips. Track your progress by reviewing your sessions and monitoring improvement over time. Find a quiet environment with good audio quality and have your resume and application materials ready.`;

  const handleListen = () => {
    speakText(instructions);
  };

  const handleGetStarted = () => {
    if (!hasReadInstructions) {
      setError('Please read all instructions before proceeding');
      return;
    }

    // Navigate to interview setup
    router.push('/interview-prep/setup');
  };

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
              <span className="font-semibold text-white">H</span>
            </div>
            <span className="text-xl font-semibold">HelloIvy</span>
            <span className="text-blue-500">✓</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold">🎯 Interview Preparation</h1>
          <p className="text-lg text-gray-700">
            Ready to start Interview Practice?
          </p>
        </div>

        {/* Instructions Box */}
        <div className="mb-6 rounded-lg border-2 border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Go Through Instructions Before We Start The Module
            </h2>
            <button
              onClick={handleListen}
              className="flex items-center gap-1 font-medium text-orange-500"
            >
              🔊 Listen
            </button>
          </div>

          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">1</span>
              <span>
                This module helps you master your interview skills with
                AI-powered practice sessions, personalized feedback, and expert
                coaching.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">2</span>
              <span>
                Choose from undergraduate admissions, graduate programs, or MBA
                interviews based on your needs.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">3</span>
              <span>
                Upload your resume (optional) to get personalized questions
                based on your background and experiences.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">4</span>
              <span>
                Practice answering interview questions using voice or text
                input. Our AI will recognize your speech naturally.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">5</span>
              <span>
                Receive detailed analysis with scoring and improvement tips
                instantly to help you improve your responses.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">6</span>
              <span>
                Track your progress by reviewing your sessions and monitoring
                improvement over time.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="min-w-[20px] font-semibold">7</span>
              <span>
                Find a quiet environment with good audio quality and have your
                resume and application materials ready before starting.
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
        </div>

        {/* Start Button */}
        <div className="text-center">
          <button
            onClick={handleGetStarted}
            disabled={!hasReadInstructions}
            className="rounded-lg bg-blue-500 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepLandingPage;
